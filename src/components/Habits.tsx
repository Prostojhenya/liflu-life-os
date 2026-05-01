import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import {
  collection, query, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, orderBy, setDoc, getDocs, getDoc
} from 'firebase/firestore';
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { Plus, Flame, CheckCircle2, Circle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  xpValue: number;
  spaceId: string;
  lastCompleted?: any;
  statType?: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
}

interface SpaceMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

// Completion record for today
interface DayCompletion {
  userId: string;
  displayName: string;
  photoURL?: string;
  completedAt: any;
}

const getAvatar = (uid: string, photoURL?: string) =>
  photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const Habits: React.FC = () => {
  const { user, setUser } = useStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSharedSpace, setIsSharedSpace] = useState(false);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  // completions[habitId] = array of users who completed today
  const [completions, setCompletions] = useState<Record<string, DayCompletion[]>>({});
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  // Load space type and members
  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const loadSpace = async () => {
      try {
        const spaceSnap = await getDoc(doc(db, 'spaces', user.currentSpaceId!));
        if (spaceSnap.exists()) {
          const isShared = spaceSnap.data().type === 'shared';
          setIsSharedSpace(isShared);

          if (isShared) {
            const membersSnap = await getDocs(collection(db, `spaces/${user.currentSpaceId}/members`));
            const memberList: SpaceMember[] = [];
            for (const m of membersSnap.docs) {
              const data = m.data();
              // Try to get fresh photoURL from users collection
              try {
                const userSnap = await getDoc(doc(db, 'users', data.userId));
                if (userSnap.exists()) {
                  memberList.push({
                    userId: data.userId,
                    displayName: userSnap.data().displayName || data.displayName || 'Участник',
                    photoURL: userSnap.data().photoURL || data.photoURL || '',
                    email: userSnap.data().email || data.email || '',
                  });
                } else {
                  memberList.push({
                    userId: data.userId,
                    displayName: data.displayName || 'Участник',
                    photoURL: data.photoURL || '',
                  });
                }
              } catch {
                memberList.push({
                  userId: data.userId,
                  displayName: data.displayName || 'Участник',
                  photoURL: '',
                });
              }
            }
            setMembers(memberList);
          }
        }
      } catch (e) {
        console.error('Error loading space:', e);
      }
    };

    loadSpace();
  }, [user?.currentSpaceId]);

  // Load habits
  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/habits`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Habit)));
    });
    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  // Listen to today's completions for all habits (shared space only)
  useEffect(() => {
    if (!user?.currentSpaceId || !isSharedSpace || habits.length === 0) return;

    const today = todayKey();
    const unsubscribers: (() => void)[] = [];

    for (const habit of habits) {
      const q = collection(db, `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`);
      const unsub = onSnapshot(q, (snap) => {
        const todayCompletions = snap.docs
          .filter(d => d.id.startsWith(today))
          .map(d => d.data() as DayCompletion);

        setCompletions(prev => ({ ...prev, [habit.id]: todayCompletions }));
      });
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach(u => u());
  }, [user?.currentSpaceId, isSharedSpace, habits.length]);

  const isCompletedToday = (habit: Habit): boolean => {
    if (isSharedSpace) {
      // In shared space: completed when ALL members have completed
      const habitCompletions = completions[habit.id] || [];
      return members.length > 0 && habitCompletions.length >= members.length;
    }
    // Personal space: check lastCompleted
    if (!habit.lastCompleted) return false;
    const date = habit.lastCompleted.toDate ? habit.lastCompleted.toDate() : new Date(habit.lastCompleted);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const iCompletedToday = (habit: Habit): boolean => {
    if (!isSharedSpace) return isCompletedToday(habit);
    const habitCompletions = completions[habit.id] || [];
    return habitCompletions.some(c => c.userId === user?.uid);
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim() || !user?.currentSpaceId || isAdding) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, `spaces/${user.currentSpaceId}/habits`), {
        title: newHabit,
        statType: 'vitality',
        frequency: 'daily',
        streak: 0,
        xpValue: XP_VALUES.HABIT,
        spaceId: user.currentSpaceId,
        createdAt: serverTimestamp(),
      });
      setNewHabit('');
    } catch (err) {
      console.error('Add habit error:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const completeHabit = async (habit: Habit) => {
    if (!user?.currentSpaceId || iCompletedToday(habit) || isProcessing === habit.id) return;

    setIsProcessing(habit.id);
    const habitRef = doc(db, `spaces/${user.currentSpaceId}/habits`, habit.id);
    const userRef = doc(db, 'users', user.uid);

    try {
      if (isSharedSpace) {
        // Save individual completion
        const today = todayKey();
        await setDoc(
          doc(db, `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`, `${today}_${user.uid}`),
          {
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL || '',
            completedAt: serverTimestamp(),
          }
        );

        // Check if all members completed → update streak
        const newCompletions = [...(completions[habit.id] || []), { userId: user.uid, displayName: user.displayName, photoURL: user.photoURL, completedAt: null }];
        if (newCompletions.length >= members.length) {
          await updateDoc(habitRef, {
            streak: habit.streak + 1,
            lastCompleted: serverTimestamp(),
          });
        }
      } else {
        await updateDoc(habitRef, {
          streak: habit.streak + 1,
          lastCompleted: serverTimestamp(),
        });
      }

      // Award XP to the user
      const newXP = (user.totalXP || 0) + XP_VALUES.HABIT;
      const statToIncrement = habit.statType || 'vitality';
      const newStats = {
        ...user.stats,
        [statToIncrement]: (user.stats[statToIncrement] || 0) + 1,
      };
      await updateDoc(userRef, {
        totalXP: newXP,
        level: calculateLevel(newXP),
        stats: newStats,
      });
      setUser({ ...user, totalXP: newXP, level: calculateLevel(newXP), stats: newStats });
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">
          Скиллы & Навыки
        </h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">
          Прокачивай свои показатели ежедневно
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {habits.map((habit) => {
          const allDone = isCompletedToday(habit);
          const iDone = iCompletedToday(habit);
          const isDisabled = iDone || isProcessing === habit.id;
          const habitCompletions = completions[habit.id] || [];
          const completedCount = isSharedSpace ? habitCompletions.length : (iDone ? 1 : 0);
          const totalCount = isSharedSpace ? members.length : 1;
          const isExpanded = expandedHabit === habit.id;

          return (
            <motion.div key={habit.id} layout className="space-y-0">
              <div className={cn(
                'bento-card flex items-center justify-between shadow-xl transition-all gaming-border',
                allDone ? 'opacity-60 grayscale-[0.5] border-[#ff00d4]' : 'border-white/5'
              )}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg flex-shrink-0',
                    allDone ? 'bg-accent-magenta/20 text-accent-magenta' : 'bg-accent-purple/20 text-accent-purple'
                  )}>
                    <Flame size={20} fill={(habit.streak > 0 || allDone) ? 'currentColor' : 'none'} className={allDone ? 'animate-pulse' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white uppercase italic tracking-tight font-display truncate">
                      {habit.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-widest font-display',
                        allDone ? 'text-accent-magenta glow-magenta' : 'text-[#8b7ca8]'
                      )}>
                        СЕРИЯ: {habit.streak}
                      </span>
                      <div className="w-[1px] h-2 bg-white/10" />
                      <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest font-display">
                        {STAT_LABELS[habit.statType || 'vitality']} +1
                      </span>
                      {allDone && (
                        <span className="text-[8px] font-black text-accent-magenta px-1.5 py-0.5 bg-accent-magenta/10 rounded uppercase font-display">
                          Готово!
                        </span>
                      )}
                    </div>

                    {/* Shared space progress */}
                    {isSharedSpace && (
                      <button
                        onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                        className="flex items-center gap-1.5 mt-1.5"
                      >
                        {/* Avatars of who completed */}
                        <div className="flex -space-x-1.5">
                          {members.map(member => {
                            const done = habitCompletions.some(c => c.userId === member.userId);
                            return (
                              <div key={member.userId} className="relative">
                                <img
                                  src={getAvatar(member.userId, member.photoURL)}
                                  alt={member.displayName}
                                  className={cn(
                                    'w-5 h-5 rounded-full border object-cover',
                                    done ? 'border-accent-magenta opacity-100' : 'border-white/20 opacity-30 grayscale'
                                  )}
                                  referrerPolicy="no-referrer"
                                />
                                {done && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-magenta rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={7} className="text-white" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[9px] text-[#8b7ca8] font-display">
                          {completedCount}/{totalCount}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => completeHabit(habit)}
                  disabled={isDisabled}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all border-2 flex-shrink-0 ml-2',
                    iDone
                      ? 'bg-accent-magenta text-white border-accent-magenta shadow-[0_0_10px_#ff00d4]'
                      : 'bg-[#0b0416] text-[#8b7ca8] border-white/10 hover:border-accent-magenta/50 hover:text-accent-magenta',
                    isProcessing === habit.id && 'animate-pulse'
                  )}
                >
                  {iDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
              </div>

              {/* Expanded: who completed */}
              <AnimatePresence>
                {isSharedSpace && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#150a24]/80 border border-white/10 border-t-0 rounded-b-2xl px-4 py-3 space-y-2">
                      {members.map(member => {
                        const completion = habitCompletions.find(c => c.userId === member.userId);
                        return (
                          <div key={member.userId} className="flex items-center gap-3">
                            <img
                              src={getAvatar(member.userId, member.photoURL)}
                              alt={member.displayName}
                              className={cn(
                                'w-7 h-7 rounded-full object-cover',
                                completion ? 'opacity-100' : 'opacity-40 grayscale'
                              )}
                              referrerPolicy="no-referrer"
                            />
                            <span className={cn(
                              'text-xs font-bold font-display flex-1',
                              completion ? 'text-white' : 'text-[#8b7ca8]'
                            )}>
                              {member.displayName}
                              {member.userId === user.uid && ' (вы)'}
                            </span>
                            {completion ? (
                              <span className="text-[10px] text-accent-magenta font-black uppercase font-display flex items-center gap-1">
                                <CheckCircle2 size={12} /> Выполнено
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8b7ca8] font-display">Ожидание...</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {habits.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-lg font-black text-white mb-2 font-display">Нет привычек</h3>
            <p className="text-sm text-[#8b7ca8] font-display">Добавь первую привычку для прокачки</p>
          </div>
        )}
      </div>

      {/* Add habit form */}
      <form onSubmit={addHabit} className="flex gap-2">
        <input
          type="text"
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          placeholder="Новая привычка..."
          className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
        />
        <button
          type="submit"
          disabled={!newHabit.trim() || isAdding}
          className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50"
        >
          {isAdding
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Plus size={20} />
          }
        </button>
      </form>
    </div>
  );
};
