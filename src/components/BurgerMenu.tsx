import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, calculateLevel } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  X, Home, CheckSquare, Flame, Target, Trophy, BarChart2,
  Bot, Settings, Moon, LogOut, Users, ChevronDown, ChevronRight,
  Plus, RefreshCw, Flag
} from 'lucide-react';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { AddSheet, AddType } from './AddSheet';

interface Space {
  id: string;
  name: string;
  type: 'personal' | 'shared';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSpaceSwitch: () => void;
}

const SECTIONS = [
  { id: 'dashboard', icon: Home,        label: 'Сегодня'      },
  { id: 'tasks',     icon: CheckSquare, label: 'Задачи'       },
  { id: 'habits',    icon: Flame,       label: 'Привычки'     },
  { id: 'goals',     icon: Target,      label: 'Цели'         },
  { id: 'shopping',  icon: Trophy,      label: 'Достижения'   },
  { id: 'chat',      icon: BarChart2,   label: 'Аналитика'    },
  { id: 'profile',   icon: Bot,         label: 'AI ассистент' },
] as const;

// Map display sections to actual tabs
const SECTION_TAB_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  tasks:     'tasks',
  habits:    'habits',
  goals:     'goals',
  shopping:  'shopping',
  chat:      'chat',
  profile:   'profile',
};

const QUICK_ACTIONS: { type: AddType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'task',    label: 'Новая задача', icon: Plus,       color: '#8B5CF6' },
  { type: 'habit',   label: 'Привычка',     icon: RefreshCw,  color: '#10b981' },
  { type: 'goal',    label: 'Цель',         icon: Flag,       color: '#3B82F6' },
];

export const BurgerMenu: React.FC<Props> = ({ isOpen, onClose, onSpaceSwitch }) => {
  const { user, setActiveTab, activeTab } = useStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [addSheetType, setAddSheetType] = useState<AddType | null>(null);

  // Load spaces
  useEffect(() => {
    if (!user?.uid || !isOpen) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'spaces'));
        const list: Space[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          // Only spaces where user is member
          try {
            const memberSnap = await getDoc(doc(db, `spaces/${d.id}/members`, user.uid));
            if (memberSnap.exists()) {
              list.push({ id: d.id, name: data.name || 'Space', type: data.type || 'personal' });
            }
          } catch { /* skip */ }
        }
        setSpaces(list);
      } catch (e) { console.error(e); }
    })();
  }, [user?.uid, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleNav = (sectionId: string) => {
    const tab = SECTION_TAB_MAP[sectionId] || sectionId;
    setActiveTab(tab as any);
    onClose();
  };

  const handleQuickAction = (type: AddType) => {
    setAddSheetType(type);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  if (!user) return null;

  const xpToNext = user.level * user.level * 50;
  const xpProgress = Math.min(100, (user.totalXP / xpToNext) * 100);

  const currentSpaceName = spaces.find(s => s.id === user.currentSpaceId)?.name || 'Personal';

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
            >
              {/* ── Logo + close ── */}
              <div className="flex items-center justify-between px-5 pt-12 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-accent-purple rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-black">L</span>
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-widest font-display">Liflu</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ── Profile block ── */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="level-circle w-16 h-16 flex-shrink-0">
                    <div className="level-circle-inner relative">
                      <img
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-black text-white font-display">{user.displayName}</p>
                    <p className="text-sm text-accent-purple font-bold font-display">Level {user.level}</p>
                  </div>
                </div>
                {/* XP bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-magenta rounded-full"
                  />
                </div>
                <p className="text-[10px] text-[#8b7ca8] font-display">{user.totalXP} / {xpToNext} XP</p>
              </div>

              {/* ── Quick actions ── */}
              <div className="px-5 pb-4">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">
                  Быстрые действия
                </p>
                <div className="space-y-1.5">
                  {QUICK_ACTIONS.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => handleQuickAction(type)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/8 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <span className="text-sm font-semibold text-white font-display">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sections ── */}
              <div className="px-5 pb-4">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">
                  Разделы
                </p>
                <div className="space-y-0.5">
                  {SECTIONS.map(({ id, icon: Icon, label }) => {
                    const isActive = activeTab === SECTION_TAB_MAP[id];
                    return (
                      <button
                        key={id}
                        onClick={() => handleNav(id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left',
                          isActive ? 'bg-accent-purple text-white' : 'hover:bg-white/5 text-[#8b7ca8]'
                        )}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-[#8b7ca8]'} />
                        <span className={cn('text-sm font-semibold font-display', isActive ? 'text-white' : 'text-white/80')}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Space switcher ── */}
              <div className="px-5 pb-4">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">
                  Пространство
                </p>
                <button
                  onClick={() => setSpacesOpen(!spacesOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-accent-purple" />
                  </div>
                  <span className="text-sm font-semibold text-white font-display flex-1 text-left truncate">{currentSpaceName}</span>
                  <ChevronDown size={14} className={cn('text-[#8b7ca8] transition-transform', spacesOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {spacesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 space-y-0.5">
                        {spaces.map(space => (
                          <button
                            key={space.id}
                            onClick={() => { onSpaceSwitch(); onClose(); }}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left',
                              space.id === user.currentSpaceId ? 'bg-accent-purple/10 text-accent-purple' : 'hover:bg-white/5 text-[#8b7ca8]'
                            )}
                          >
                            <span className="text-xs font-semibold font-display">{space.name}</span>
                            {space.id === user.currentSpaceId && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Other ── */}
              <div className="px-5 pb-6 mt-auto">
                <p className="text-[9px] text-[#8b7ca8] font-black uppercase tracking-widest font-display mb-2">
                  Другое
                </p>
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
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={18} className="text-red-400" />
                    <span className="text-sm font-semibold text-red-400 font-display">Выйти из аккаунта</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick action sheet */}
      <AddSheet type={addSheetType} onClose={() => setAddSheetType(null)} />
    </>
  );
};
