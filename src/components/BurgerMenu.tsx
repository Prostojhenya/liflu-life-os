import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { User, Target, MessageCircle, LogOut, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'profile', icon: User,          label: 'Профиль',      sub: 'Уровень, XP, достижения', color: '#8B5CF6' },
  { id: 'goals',   icon: Target,         label: 'Цели',         sub: 'Долгосрочные цели',        color: '#3B82F6' },
  { id: 'chat',    icon: MessageCircle,  label: 'Чат',          sub: 'Сообщения и пространства', color: '#10b981' },
] as const;

export const BurgerMenu: React.FC<Props> = ({ open, onClose }) => {
  const { user, setUser, setActiveTab, activeTab } = useStore();

  const handleNav = (id: string) => {
    setActiveTab(id as any);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onPointerDown={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0720] border-t border-white/10 rounded-t-3xl pb-safe"
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white font-display truncate">{user.displayName}</p>
                  <p className="text-[10px] text-[#8b7ca8] font-display">Level {user.level} · {user.totalXP} XP</p>
                </div>
                <button onPointerDown={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Nav items */}
            <div className="px-3 py-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onPointerDown={() => handleNav(item.id)}
                    className={cn(
                      'w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl transition-all mb-1',
                      isActive ? 'bg-white/8' : 'hover:bg-white/5'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-white font-display">{item.label}</p>
                      <p className="text-[10px] text-[#8b7ca8] font-display">{item.sub}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#6b7280]" />
                  </button>
                );
              })}
            </div>

            {/* Sign out */}
            <div className="px-3 pb-4 pt-1 border-t border-white/5 mx-3">
              <button
                onPointerDown={handleSignOut}
                className="w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-red-500/10 transition-all mt-2"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <LogOut size={20} className="text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-red-400 font-display">Выйти</p>
                  <p className="text-[10px] text-[#8b7ca8] font-display">{user?.email}</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
