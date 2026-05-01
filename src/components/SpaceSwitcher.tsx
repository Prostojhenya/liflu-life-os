import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { useStore } from '@/store/useStore';
import { X, Plus, Users, Lock, Settings, UserPlus, Mail, Trash2, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Space {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  ownerId: string;
  memberCount?: number;
}

interface SpaceMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  joinedAt: any;
}

interface SpaceInvite {
  id: string;
  spaceId: string;
  spaceName: string;
  email: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

interface SpaceSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState<'personal' | 'shared'>('personal');
  const [managingSpaceId, setManagingSpaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [invites, setInvites] = useState<SpaceInvite[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    // Get spaces where user is owner or member
    const spacesQuery = query(collection(db, 'spaces'));

    const unsubscribe = onSnapshot(spacesQuery, async (snapshot) => {
      const allSpaces = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Space));

      // Get spaces where user is a member
      const memberSpaceIds = new Set<string>();
      for (const space of allSpaces) {
        const membersQuery = query(
          collection(db, `spaces/${space.id}/members`),
          where('userId', '==', user.uid)
        );
        const membersSnap = await getDocs(membersQuery);
        if (!membersSnap.empty) {
          memberSpaceIds.add(space.id);
        }
      }

      // Filter spaces where user is owner or member
      const userSpaces = allSpaces.filter(space => 
        space.ownerId === user.uid || memberSpaceIds.has(space.id)
      );

      // Get member counts for shared spaces
      const spacesWithCounts = await Promise.all(
        userSpaces.map(async (space) => {
          if (space.type === 'shared') {
            const membersSnap = await getDocs(collection(db, `spaces/${space.id}/members`));
            return { ...space, memberCount: membersSnap.size };
          }
          return space;
        })
      );

      setSpaces(spacesWithCounts);
    }, (error) => {
      console.error('Error fetching spaces:', error);
      setSpaces([]);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load invites for current user
  useEffect(() => {
    if (!user?.email) return;

    const invitesQuery = query(
      collection(db, 'invites'),
      where('email', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(invitesQuery, (snapshot) => {
      const inviteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SpaceInvite));
      setInvites(inviteData);
    });

    return () => unsubscribe();
  }, [user?.email]);

  // Load members when managing a space
  useEffect(() => {
    if (!managingSpaceId) {
      setMembers([]);
      return;
    }

    const membersQuery = query(collection(db, `spaces/${managingSpaceId}/members`));

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const memberData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SpaceMember));
      setMembers(memberData);
    });

    return () => unsubscribe();
  }, [managingSpaceId]);

  const switchSpace = async (spaceId: string) => {
    if (!user) return;
    
    try {
      // Update user's current space in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        currentSpaceId: spaceId
      });

      // Update local state
      setUser({
        ...user,
        currentSpaceId: spaceId
      });
      
      onClose();
    } catch (error) {
      console.error('Error switching space:', error);
      alert('Ошибка при переключении пространства');
    }
  };

  const createSpace = async () => {
    if (!newSpaceName.trim() || !user?.uid || isCreating) return;

    setIsCreating(true);
    try {
      const spaceRef = await addDoc(collection(db, 'spaces'), {
        name: newSpaceName,
        type: newSpaceType,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Add creator as admin member
      await setDoc(doc(db, `spaces/${spaceRef.id}/members`, user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      setNewSpaceName('');
      setNewSpaceType('personal');
      switchSpace(spaceRef.id);
    } catch (error) {
      console.error('Error creating space:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !managingSpaceId || !user || isSendingInvite) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert('Введите корректный email');
      return;
    }

    // Check if user is already a member
    const existingMember = members.find(m => m.email === inviteEmail);
    if (existingMember) {
      alert('Этот пользователь уже является участником');
      return;
    }

    setIsSendingInvite(true);
    try {
      const space = spaces.find(s => s.id === managingSpaceId);
      
      await addDoc(collection(db, 'invites'), {
        spaceId: managingSpaceId,
        spaceName: space?.name || 'Пространство',
        email: inviteEmail.toLowerCase(),
        invitedBy: user.uid,
        inviterName: user.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setInviteEmail('');
      alert('Приглашение отправлено!');
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Ошибка при отправке приглашения');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const acceptInvite = async (invite: SpaceInvite) => {
    if (!user) return;

    try {
      // Add user as member
      await setDoc(doc(db, `spaces/${invite.spaceId}/members`, user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'member',
        joinedAt: serverTimestamp(),
      });

      // Update invite status
      await updateDoc(doc(db, 'invites', invite.id), {
        status: 'accepted',
      });

      // Switch to the new space
      switchSpace(invite.spaceId);
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('Ошибка при принятии приглашения');
    }
  };

  const rejectInvite = async (inviteId: string) => {
    try {
      await updateDoc(doc(db, 'invites', inviteId), {
        status: 'rejected',
      });
    } catch (error) {
      console.error('Error rejecting invite:', error);
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!managingSpaceId) return;

    const space = spaces.find(s => s.id === managingSpaceId);
    if (space?.ownerId === memberUserId) {
      alert('Нельзя удалить владельца пространства');
      return;
    }

    if (window.confirm('Удалить участника из пространства?')) {
      try {
        await deleteDoc(doc(db, `spaces/${managingSpaceId}/members`, memberId));
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const canManageSpace = (space: Space) => {
    if (space.ownerId === user?.uid) return true;
    const member = members.find(m => m.userId === user?.uid);
    return member?.role === 'admin';
  };

  const deleteSpace = async (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space || space.ownerId !== user?.uid) {
      alert('Только владелец может удалить пространство');
      return;
    }

    if (space.type === 'personal') {
      alert('Нельзя удалить личное пространство');
      return;
    }

    if (window.confirm(`Удалить пространство "${space.name}"? Это действие нельзя отменить.`)) {
      try {
        // Delete all members
        const membersSnap = await getDocs(collection(db, `spaces/${spaceId}/members`));
        for (const memberDoc of membersSnap.docs) {
          await deleteDoc(memberDoc.ref);
        }

        // Delete the space
        await deleteDoc(doc(db, 'spaces', spaceId));

        // If this was the current space, switch to another
        if (user?.currentSpaceId === spaceId) {
          const otherSpace = spaces.find(s => s.id !== spaceId);
          if (otherSpace) {
            await switchSpace(otherSpace.id);
          }
        }

        alert('Пространство удалено');
      } catch (error) {
        console.error('Error deleting space:', error);
        alert('Ошибка при удалении пространства');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setManagingSpaceId(null);
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0b0416] border border-white/10 rounded-3xl p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase font-display">
                  {managingSpaceId ? 'Управление' : 'Пространства'}
                </h2>
                <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display">
                  {managingSpaceId ? 'Участники и приглашения' : 'Выбери или создай новое'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (managingSpaceId) {
                    setManagingSpaceId(null);
                  } else {
                    onClose();
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Invites Section */}
            {!managingSpaceId && invites.length > 0 && (
              <div className="mb-4 p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={16} className="text-accent-purple" />
                  <h3 className="text-sm font-black text-white uppercase font-display">
                    Приглашения ({invites.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div key={invite.id} className="bg-[#0b0416] rounded-xl p-3">
                      <p className="text-sm font-bold text-white mb-1">{invite.spaceName}</p>
                      <p className="text-xs text-[#8b7ca8] mb-3">
                        Приглашение в групповое пространство
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptInvite(invite)}
                          className="flex-1 bg-accent-purple text-white py-2 rounded-lg text-xs font-bold uppercase"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => rejectInvite(invite.id)}
                          className="flex-1 bg-white/5 text-[#8b7ca8] py-2 rounded-lg text-xs font-bold uppercase"
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Managing Space View */}
            {managingSpaceId ? (
              <div className="space-y-4">
                {/* Current Members */}
                <div>
                  <h3 className="text-sm font-black text-white uppercase font-display mb-3">
                    Участники ({members.length})
                  </h3>
                  <div className="space-y-2">
                    {members.map((member) => {
                      const space = spaces.find(s => s.id === managingSpaceId);
                      const isOwner = space?.ownerId === member.userId;
                      const isCurrentUser = member.userId === user?.uid;
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-[#150a24] rounded-xl border border-white/10"
                        >
                          <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-white font-bold">
                            {member.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white">
                                {member.displayName}
                                {isCurrentUser && ' (вы)'}
                              </p>
                              {isOwner && <Crown size={14} className="text-accent-orange" />}
                              {member.role === 'admin' && !isOwner && <Shield size={14} className="text-accent-blue" />}
                            </div>
                            <p className="text-xs text-[#8b7ca8]">{member.email}</p>
                          </div>
                          {!isOwner && !isCurrentUser && canManageSpace(space!) && (
                            <button
                              onClick={() => removeMember(member.id, member.userId)}
                              className="w-8 h-8 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red hover:bg-accent-red/20 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite New Member */}
                {canManageSpace(spaces.find(s => s.id === managingSpaceId)!) && (
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-black text-white uppercase font-display mb-3">
                      Пригласить участника
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email участника..."
                        className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && sendInvite()}
                      />
                      <button
                        onClick={sendInvite}
                        disabled={!inviteEmail.trim() || isSendingInvite}
                        className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSendingInvite ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UserPlus size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Space Button - Only for owner of shared spaces */}
                {managingSpaceId && (() => {
                  const space = spaces.find(s => s.id === managingSpaceId);
                  return space && space.ownerId === user?.uid && space.type === 'shared' && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => deleteSpace(managingSpaceId)}
                        className="w-full py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-accent-red/20 transition-all"
                      >
                        <Trash2 size={16} />
                        Удалить пространство
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                {/* Spaces List */}
                <div className="space-y-3 mb-4">
                  {spaces.map((space) => {
                    const isActive = space.id === user?.currentSpaceId;
                    const isOwner = space.ownerId === user?.uid;
                    
                    return (
                      <div
                        key={space.id}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all",
                          isActive
                            ? "bg-accent-purple/20 border-accent-purple"
                            : "bg-[#150a24] border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => switchSpace(space.id)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              isActive ? "bg-accent-purple" : "bg-white/5"
                            )}>
                              {space.type === 'shared' ? (
                                <Users size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                              ) : (
                                <Lock size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={cn(
                                "text-sm font-black uppercase font-display",
                                isActive ? "text-white" : "text-[#8b7ca8]"
                              )}>
                                {space.name}
                              </h3>
                              <p className="text-[10px] text-[#8b7ca8] font-display">
                                {space.type === 'shared' ? `${space.memberCount || 1} участников` : 'Личное'}
                              </p>
                            </div>
                            {isActive && (
                              <div className="w-2 h-2 rounded-full bg-accent-purple" />
                            )}
                          </button>
                          {space.type === 'shared' && (isOwner || canManageSpace(space)) && (
                            <button
                              onClick={() => setManagingSpaceId(space.id)}
                              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors"
                            >
                              <Settings size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Create New Space */}
                <div className="pt-4 border-t border-white/10">
                  <div className="mb-3">
                    <label className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display mb-2 block">
                      Тип пространства
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setNewSpaceType('personal')}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          newSpaceType === 'personal'
                            ? "bg-accent-purple/20 border-accent-purple"
                            : "bg-[#150a24] border-white/10"
                        )}
                      >
                        <Lock size={20} className={cn("mx-auto mb-1", newSpaceType === 'personal' ? "text-accent-purple" : "text-[#8b7ca8]")} />
                        <p className={cn("text-xs font-bold uppercase font-display", newSpaceType === 'personal' ? "text-white" : "text-[#8b7ca8]")}>
                          Личное
                        </p>
                      </button>
                      <button
                        onClick={() => setNewSpaceType('shared')}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          newSpaceType === 'shared'
                            ? "bg-accent-purple/20 border-accent-purple"
                            : "bg-[#150a24] border-white/10"
                        )}
                      >
                        <Users size={20} className={cn("mx-auto mb-1", newSpaceType === 'shared' ? "text-accent-purple" : "text-[#8b7ca8]")} />
                        <p className={cn("text-xs font-bold uppercase font-display", newSpaceType === 'shared' ? "text-white" : "text-[#8b7ca8]")}>
                          Групповое
                        </p>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      placeholder="Название пространства..."
                      className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && createSpace()}
                    />
                    <button
                      onClick={createSpace}
                      disabled={!newSpaceName.trim() || isCreating}
                      className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isCreating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
