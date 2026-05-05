import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  X, User, Target, ShoppingCart, MessageCircle,
  ChevronRight, Users, Lock, LogOut
} from 'lucide-react';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  spaceName: string;
  spaceType: 'personal' | 'shared';
  onSpaceSwitch: () => void;
}

const menuItems = [
  { id: 'profile',  icon: User,         label: 'Профиль',  color: '#8B5CF6' },
  { id: 'goals',    icon: Target,        label: 'Цели',     color: '#3B82F6' },
  { id: 'shopping', icon: ShoppingCart,  label: 'Покупки',  color: '#f59e0b' },
  { id: 'chat',     icon: MessageCircle, label: 'Чат',      color: '#10b981' },
] as const;

export const BurgerMenu: React.FC<Props> = ({ isOpen, onClose, spaceName, spaceType, onSpaceSwitch }) => {
  const { user, setActiveTab, activeTab } = useStore();

  // Close on back gesture / escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleNav = (id: typeof menuItems[number]['id']) => {
    setActiveTab(id as any);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0f0720] border-r border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="level-circle w-12 h-12">
                  <div className="level-circle-inner relative">
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-white font-display truncate max-w-[140px]">
                    {user?.displayName || 'Пользователь'}
                  </p>
                  <p className="text-[10px] text-accent-purple font-display">
                    Level {user?.level} · {user?.totalXP} XP
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Space switcher */}
            <button
              onClick={() => { onSpaceSwitch(); onClose(); }}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors"
            >
              <div className="w-8 h-8 bg-accent-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
                {spaceType === 'shared'
                  ? <Users size={15} className="text-accent-purple" />
                  : <Lock size={15} className="text-accent-purple" />
                }
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-black text-white uppercase font-display truncate">{spaceName}</p>
                <p className="text-[9px] text-[#8b7ca8] font-display">
                  {spaceType === 'shared' ? 'Групповое' : 'Личное'} · Сменить
                </p>
              </div>
              <ChevronRight size={14} className="text-[#8b7ca8] flex-shrink-0" />
            </button>

            {/* Nav items */}
            <div className="flex-1 py-3">
              {menuItems.map(({ id, icon: Icon, label, color }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className={cn(
                      'w-full flex items-center gap-4 px-5 py-3.5 transition-colors',
                      isActive ? 'bg-white/5' : 'hover:bg-white/3'
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className={cn(
                      'text-sm font-bold font-display',
                      isActive ? 'text-white' : 'text-[#8b7ca8]'
                    )}>
                      {label}
                    </span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />}
                  </button>
                );
              })}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-5 py-4 border-t border-white/5 text-[#8b7ca8] hover:text-red-400 transition-colors mb-safe"
            >
              <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-bold font-display">Выйти</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
