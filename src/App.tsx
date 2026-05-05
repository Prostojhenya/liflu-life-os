import React, { useEffect } from 'react';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useStore, calculateLevel, INITIAL_STATS } from './store/useStore';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Habits } from './components/Habits';
import { Shopping } from './components/Shopping';
import { Chat } from './components/Chat';
import { Goals } from './components/Goals';
import { Profile } from './components/Profile';
import { LoadingScreen } from './components/LoadingScreen';
import { ChatHeaderProvider } from './store/chatHeaderContext';

export default function App() {
  const { user, setUser, isAuthReady, setAuthReady, activeTab } = useStore();
  const [error, setError] = React.useState<string | null>(null);
  const [inviteToken, setInviteToken] = React.useState<string | null>(null);
  const [inviteProcessing, setInviteProcessing] = React.useState(false);
  const [inviteInfo, setInviteInfo] = React.useState<{ spaceName: string; spaceId: string } | null>(null);

  // Check for invite link on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
      // Load invite info
      getDoc(doc(db, 'inviteLinks', token)).then((snap) => {
        if (snap.exists() && !snap.data().used) {
          setInviteInfo({ spaceName: snap.data().spaceName, spaceId: snap.data().spaceId });
        }
      }).catch(console.error);
    }
  }, []);

  // Process invite after login
  useEffect(() => {
    if (!user || !inviteToken || inviteProcessing) return;
    const processInvite = async () => {
      setInviteProcessing(true);
      try {
        const tokenSnap = await getDoc(doc(db, 'inviteLinks', inviteToken));
        if (!tokenSnap.exists() || tokenSnap.data().used) {
          alert('Ссылка недействительна или уже использована');
          setInviteToken(null);
          return;
        }
        const { spaceId, spaceName } = tokenSnap.data();
        // Add user as member
        await setDoc(doc(db, `spaces/${spaceId}/members`, user.uid), {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'member',
          joinedAt: serverTimestamp(),
        });
        // Mark token as used
        await updateDoc(doc(db, 'inviteLinks', inviteToken), { used: true, usedBy: user.uid });
        // Switch to space
        await updateDoc(doc(db, 'users', user.uid), { currentSpaceId: spaceId });
        setUser({ ...user, currentSpaceId: spaceId });
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        setInviteToken(null);
        setInviteInfo(null);
        alert(`Вы вступили в пространство "${spaceName}"!`);
      } catch (e) {
        console.error('Invite processing error:', e);
        alert('Ошибка при вступлении в пространство');
      } finally {
        setInviteProcessing(false);
      }
    };
    processInvite();
  }, [user, inviteToken]);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            try {
              const userRef = doc(db, 'users', firebaseUser.uid);
              const userSnap = await getDoc(userRef);

              let userData;
              if (userSnap.exists()) {
                userData = userSnap.data();
              } else {
                // New user setup
                const spacePath = 'spaces';
                try {
                  const personalSpaceRef = await addDoc(collection(db, spacePath), {
                    name: 'Personal Space',
                    type: 'personal',
                    ownerId: firebaseUser.uid,
                    createdAt: serverTimestamp(),
                  });

                  // Add member record
                  const memberPath = `spaces/${personalSpaceRef.id}/members`;
                  await setDoc(doc(db, memberPath, firebaseUser.uid), {
                    spaceId: personalSpaceRef.id,
                    userId: firebaseUser.uid,
                    role: 'admin',
                    spaceOwnerId: firebaseUser.uid,
                    joinedAt: serverTimestamp(),
                  });

                  userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || 'User',
                    photoURL: firebaseUser.photoURL || '',
                    totalXP: 0,
                    level: 0,
                    currentSpaceId: personalSpaceRef.id,
                    stats: INITIAL_STATS
                  };
                  await setDoc(userRef, userData);
                } catch (e) {
                  console.error("User setup error:", e);
                  handleFirestoreError(e, OperationType.WRITE, 'user-setup');
                }
              }
              
              setUser({
                ...userData,
                stats: userData.stats || INITIAL_STATS,
                level: calculateLevel(userData.totalXP || 0)
              } as any);
            } catch (error) {
              console.error("Auth initialization error:", error);
              setError("Ошибка инициализации пользователя");
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setError("Ошибка аутентификации");
        } finally {
          setAuthReady(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("App initialization error:", error);
      setError("Ошибка запуска приложения");
      setAuthReady(true);
    }
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
        <div className="w-20 h-20 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8">
          ⚠️
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-4 text-white">Ошибка</h1>
        <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-bold"
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  if (!isAuthReady) {
    return <LoadingScreen isLoading={true} />;
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
        <div className="w-20 h-20 bg-accent-blue rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-accent-blue/20">
          <Sparkles size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4 text-white">Life OS <span className="text-accent-blue">Liflu</span></h1>
        <p className="text-text-dim max-w-xs mb-12 leading-relaxed">
          Твой личный спутник для управления задачами, привычками и целями.
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full max-w-xs bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-sm active:scale-95 transition-all hover:bg-surface-bright"
        >
          <LogIn size={20} />
          Войти через Google
        </button>
        <p className="mt-8 text-[10px] text-text-dim uppercase tracking-widest font-bold">
          MVP v1.0 • Готов к PWA
        </p>
      </div>
    );
  }

  return (
    <ChatHeaderProvider>
      <Layout>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'habits' && <Habits />}
        {activeTab === 'shopping' && <Shopping />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'goals' && <Goals />}
        {activeTab === 'profile' && <Profile />}
      </Layout>
    </ChatHeaderProvider>
  );
}
