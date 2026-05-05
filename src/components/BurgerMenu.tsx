import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  X, Home, CheckSquare, Flame, Target, BarChart2,
  Bot, Settings, Moon, LogOut, Users, ChevronRight,
  Plus, RefreshCw, Flag, ShoppingCart, CalendarDays,
  Trash2, Pencil, Check, Lock
} from 'lucide-react';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  collection, getDocs, doc, getDoc, addDoc, updateDoc,
  deleteDoc, serverTimestamp, query, where
} from 'firebase/firestore';
import { AddType } from './AddSheet';

interface Space {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  ownerId: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSpaceSwitch: () => void;
  onQuickAdd: (type: AddType) => void;
}

const SECTIONS = [
  { id: 'dashboard', icon: Home,        label: 'Сегодня'      },
  { id: 'tasks',     icon: CheckSquare, label: 'Задачи'       },
  { id: 'habits',    icon: Flame,       label: 'Привычки'     },
  { id: 'goals',     icon: Target,      label: 'Цели'         },
  { id: 'chat',      icon: BarChart2,   label: 'Аналитика'    },
  { id: 'profile',   icon: Bot,         label: 'AI ассистент' },
] as const;

const QUICK_ACTIONS: { type: AddType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'task',     label: 'Задача',   icon: CheckSquare,  color: '#8B5CF6' },
  { type: 'shopping', label: 'Покупка',  icon: ShoppingCart, color: '#f59e0b' },
  { type: 'habit',    label: 'Привычка', icon: RefreshCw,    color: '#10b981' },
  { type: 'goal',     label: 'Цель',     icon: Flag,         color: '#3B82F6' },
  { type: 'event',    label: 'Событие',  icon: CalendarDays, color: '#ec4899' },
];

export const BurgerMenu: React.FC<Props> = ({ isOpen, onClose, onSpaceSwitch, onQuickAdd }) => {
  const { user, setUser, setActiveTab, activeTab } = useStore();
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Space context menu
  const [contextSpace, setContextSpace] = useState<Space | null>(null);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load spaces
  const loadSpaces = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDocs(query(collection(db, 'spaces'), where('ownerId', '==', user.uid)));
      const list: Space[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Space));
      // Also load spaces where user is member but not owner
      const memberSnaps = await getDocs(collection(db, `spaces`));
      for (const d of memberSnaps.docs) {
        if (list.find(s => s.id === d.id)) continue;
        try {
          const mSnap = await getDoc(doc(db, `spaces/${d.id}/members`, user.uid));
          if (mSnap.exists()) list.push({ id: d.id, ...d.data() } as Space);
        } catch { /* skip */ }
      }
      setSpaces(list);
    } catch (e) { console.error(e); }
  }, [user?.uid]);

  useEffect(() => {
    if (isOpen) loadSpaces();
  }, [isOpen, loadSpaces]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* ── Space long press ── */
  const startSpacePress = (space: Space) => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setContextSpace(space);
    }, 450);
  };
  const endSpacePress = (space: Space) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (!contextSpace) switchSpace(space);
  };
  const cancelSpacePress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  /* ── Switch space ── */
  const switchSpace = async (space: Space) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { currentSpaceId: space.id });
      setUser({ ...user, currentSpaceId: space.id });
    } catch (e) { console.error(e); }
  };

  /* ── Rename space ── */
  const saveRename = async () => {
    if (!editingSpaceId || !editingName.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'spaces', editingSpaceId), { name: editingName.trim() });
      setSpaces(prev => prev.map(s => s.id === editingSpaceId ? { ...s, name: editingName.trim() } : s));
      setEditingSpaceId(null);
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  /* ── Delete space ── */
  const deleteSpace = async (space: Space) => {
    if (!user || space.ownerId !== user.uid) return;
    if (!confirm(`Удалить пространство "${space.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'spaces', space.id));
      setSpaces(prev => prev.filter(s => s.id !== space.id));
      if (user.currentSpaceId === space.id) {
        const remaining = spaces.filter(s => s.id !== space.id);
        if (remaining.length > 0) {
          await updateDoc(doc(db, 'users', user.uid), { currentSpaceId: remaining[0].id });
          setUser({ ...user, currentSpaceId: remaining[0].id });
        }
      }
    } catch (e) { console.error(e); }
    setContextSpace(null);
  };

  /* ── Create space ── */
  const createSpace = async () => {
    if (!newSpaceName.trim() || !user) return;
    setIsSaving(true);
    try {
      const ref = await addDoc(collection(db, 'spaces'), {
        name: newSpaceName.trim(),
        type: 'personal',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, `spaces/${ref.id}/members`), {
        userId: user.uid,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });
      setNewSpaceName('');
      setIsCreatingSpace(false);
      await loadSpaces();
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const handleSignOut = async () => { await signOut(auth); onClose(); };

  if (!user) return null;

  const xpToNext = user.level * user.level * 50;
  const xpProgress = Math.min(100, (user.totalXP / xpToNext) * 100);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-[#0d0820] flex flex-col overflow-y-auto"
              onClick={() => setContextSpace(null)}
            >
              {/* Logo + close */}
              <div className="flex items-center justify-between px-5 pt-12 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-accent-purple rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-black">L</span>
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-widest font-display">Liflu</span>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]">
                  <X size={16} />
                </button>
              </div>

              {/* Profile */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="level-circle w-16 h-16 flex-shrink-0">
                    <div className="level-circle-inner relative">
                      <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-black text-white font-display">{user.displayName}</p>
                    <p className="text-sm text-accent-purple font-bold font-display">Level {user.level}</p>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} className="h-full bg-gradient-to-r from-accent-purple to-accent-magenta rounded-full" />
                </div>
                <p className="text-[10px] text-[#8b7ca8] font-display">{user.totalXP} / {xpToNext} XP</p>
              </div>

              {/* ── Quick actions — icon row ── */}
              <div className="px-5 pb-5">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-3">Быстрые действия</p>
                <div className="flex justify-between gap-2">
                  {QUICK_ACTIONS.map(({ type, label, icon: Icon, color }, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose();
                        onQuickAdd(type);
                      }}
                      className="flex flex-col items-center gap-1.5 flex-1"
                    >
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                      <span className="text-[9px] font-bold font-display text-[#8b7ca8] whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sections ── */}
              <div className="px-5 pb-4">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">Разделы</p>
                <div className="space-y-0.5">
                  {SECTIONS.map(({ id, icon: Icon, label }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setActiveTab(id as any); onClose(); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left',
                          isActive ? 'bg-accent-purple text-white' : 'hover:bg-white/5 text-[#8b7ca8]'
                        )}
                      >
                        <Icon size={18} />
                        <span className={cn('text-sm font-semibold font-display', isActive ? 'text-white' : 'text-white/80')}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Spaces ── */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display">Пространство</p>
                  <button
                    onClick={() => setIsCreatingSpace(true)}
                    className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:text-white transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Create space input */}
                <AnimatePresence>
                  {isCreatingSpace && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-2"
                    >
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={newSpaceName}
                          onChange={e => setNewSpaceName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') createSpace(); if (e.key === 'Escape') setIsCreatingSpace(false); }}
                          placeholder="Название пространства..."
                          className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
                        />
                        <button onClick={createSpace} disabled={!newSpaceName.trim() || isSaving} className="w-8 h-8 bg-accent-purple rounded-xl flex items-center justify-center disabled:opacity-40">
                          <Check size={14} className="text-white" />
                        </button>
                        <button onClick={() => setIsCreatingSpace(false)} className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[#8b7ca8]">
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  {spaces.map(space => {
                    const isCurrent = space.id === user.currentSpaceId;
                    const isEditing = editingSpaceId === space.id;
                    const isOwner = space.ownerId === user.uid;

                    return (
                      <div key={space.id} className="relative">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingSpaceId(null); }}
                              className="flex-1 bg-[#150a24] border border-accent-purple/50 rounded-xl px-3 py-2 text-xs text-white font-display focus:outline-none"
                            />
                            <button onClick={saveRename} disabled={isSaving} className="w-8 h-8 bg-accent-purple rounded-xl flex items-center justify-center">
                              <Check size={13} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onPointerDown={() => startSpacePress(space)}
                            onPointerUp={() => endSpacePress(space)}
                            onPointerLeave={cancelSpacePress}
                            onPointerCancel={cancelSpacePress}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left select-none',
                              isCurrent ? 'bg-accent-purple/15 border border-accent-purple/30' : 'hover:bg-white/5 border border-transparent'
                            )}
                          >
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', isCurrent ? 'bg-accent-purple/30' : 'bg-white/5')}>
                              {space.type === 'shared' ? <Users size={13} className={isCurrent ? 'text-accent-purple' : 'text-[#8b7ca8]'} /> : <Lock size={13} className={isCurrent ? 'text-accent-purple' : 'text-[#8b7ca8]'} />}
                            </div>
                            <span className={cn('text-xs font-semibold font-display flex-1 truncate', isCurrent ? 'text-white' : 'text-[#8b7ca8]')}>{space.name}</span>
                            {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />}
                          </button>
                        )}

                        {/* Context menu */}
                        <AnimatePresence>
                          {contextSpace?.id === space.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -4 }}
                              className="absolute right-0 top-full mt-1 z-10 bg-[#1a0d30] border border-white/10 rounded-2xl overflow-hidden shadow-xl min-w-[140px]"
                              onClick={e => e.stopPropagation()}
                            >
                              {isOwner && (
                                <button
                                  onClick={() => { setEditingSpaceId(space.id); setEditingName(space.name); setContextSpace(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                  <Pencil size={14} className="text-[#8b7ca8]" />
                                  <span className="text-xs font-semibold text-white font-display">Переименовать</span>
                                </button>
                              )}
                              {isOwner && spaces.length > 1 && (
                                <button
                                  onClick={() => deleteSpace(space)}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-red-500/10 transition-colors text-left"
                                >
                                  <Trash2 size={14} className="text-red-400" />
                                  <span className="text-xs font-semibold text-red-400 font-display">Удалить</span>
                                </button>
                              )}
                              {!isOwner && (
                                <div className="px-4 py-3">
                                  <span className="text-[10px] text-[#8b7ca8] font-display">Только просмотр</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Other ── */}
              <div className="px-5 pb-8 mt-auto">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">Другое</p>
                <div className="space-y-0.5">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left">
                    <Settings size={18} className="text-[#8b7ca8]" />
                    <span className="text-sm font-semibold text-white/80 font-display flex-1">Настройки</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-left">
                    <Moon size={18} className="text-[#8b7ca8]" />
                    <span className="text-sm font-semibold text-white/80 font-display flex-1">Тема</span>
                    <ChevronRight size={14} className="text-[#8b7ca8]" />
                  </button>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors text-left">
                    <LogOut size={18} className="text-red-400" />
                    <span className="text-sm font-semibold text-red-400 font-display">Выйти из аккаунта</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
};
