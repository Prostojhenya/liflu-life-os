import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { SpaceSwitcher } from './SpaceSwitcher';
import { BurgerMenu } from './BurgerMenu';
import { AddType } from './AddSheet';
import { QuickAddModal } from './QuickAddModal';
import { LifluAvatar } from './LifluAvatar';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Menu, ArrowLeft, Users, Search, Bell, Flame } from 'lucide-react';
import { useChatHeader } from '@/store/chatHeaderContext';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Сегодня',
  tasks:     'Задачи',
  habits:    'Привычки',
  goals:     'Цели',
  shopping:  'Покупки',
  chat:      'Чат',
  profile:   'Профиль',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, user, streak, todayProgress } = useStore();
  const { chatHeader } = useChatHeader();
  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<AddType | null>(null);
  const [currentSpace, setCurrentSpace] = useState<{ name: string; type: 'personal' | 'shared' } | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const loadSpace = async () => {
      try {
        const spaceDoc = await getDoc(doc(db, 'spaces', user.currentSpaceId!));
        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          setCurrentSpace({ name: data.name || 'Personal Space', type: data.type || 'personal' });
        }
      } catch (error) {
        console.error('Error loading space:', error);
      }
    };
    loadSpace();
  }, [user?.currentSpaceId]);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') setKeyboardOpen(true);
    };
    const onFocusOut = () => setKeyboardOpen(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const isChat = activeTab === 'chat';
  const hideNav = isChat && keyboardOpen;

  return (
    <div className="flex flex-col bg-[#0b0416] text-white font-sans overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Top bar ── */}
      <header className="shrink-0 z-20 bg-[#0b0416]">
        {isChat && chatHeader ? (
          // Chat conversation header
          <div className="bg-[#150a24] border-b border-white/10 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => chatHeader.onBack?.()}
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            {chatHeader.avatar ? (
              <img src={chatHeader.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-accent-purple" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white uppercase font-display truncate">{chatHeader.title}</p>
              <p className="text-[9px] text-[#8b7ca8] font-display">{chatHeader.subtitle}</p>
            </div>
          </div>
        ) : (
          // Default header with burger
          <div className="bg-[#0b0416] border-b border-white/5 px-4 py-3 flex items-center gap-3">
            {/* Burger */}
            <button
              onClick={() => setIsBurgerOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] flex-shrink-0 active:bg-white/10 transition-colors"
            >
              <Menu size={18} />
            </button>

            {/* Title + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white uppercase font-display leading-tight">
                {TAB_TITLES[activeTab] ?? activeTab}
              </p>
              <p className="text-[9px] text-[#8b7ca8] font-display">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Today progress pill */}
            {user && todayProgress.total > 0 && (
              <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-blue rounded-full transition-all"
                    style={{ width: `${Math.round((todayProgress.done / todayProgress.total) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-[#8b7ca8] font-display whitespace-nowrap">
                  {todayProgress.done}/{todayProgress.total}
                </span>
              </div>
            )}

            {/* XP pill */}
            {user && (
              <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-magenta rounded-full"
                    style={{ width: `${Math.min(100, (user.totalXP / (user.level * user.level * 50)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-accent-purple font-display whitespace-nowrap">
                  Lv{user.level}
                </span>
              </div>
            )}

            {/* Streak pill */}
            {user && (
              <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                <Flame size={12} className="text-orange-400" />
                <span className="text-[10px] font-black text-orange-400 font-display whitespace-nowrap">
                  {streak}
                </span>
              </div>
            )}

            {/* Search + Bell */}
            <div className="flex items-center gap-1.5">
              <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#8b7ca8] active:bg-white/10 transition-colors">
                <Search size={17} />
              </button>
              <button className="relative w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#8b7ca8] active:bg-white/10 transition-colors">
                <Bell size={17} />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent-purple rounded-full text-[10px] font-black text-white flex items-center justify-center leading-none">
                  3
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      <SpaceSwitcher isOpen={isSpaceSwitcherOpen} onClose={() => setIsSpaceSwitcherOpen(false)} />

      <BurgerMenu
        isOpen={isBurgerOpen}
        onClose={() => setIsBurgerOpen(false)}
        onSpaceSwitch={() => setIsSpaceSwitcherOpen(true)}
        onQuickAdd={(type) => { setIsBurgerOpen(false); setTimeout(() => setQuickAddType(type), 300); }}
      />

      <QuickAddModal type={quickAddType} onClose={() => setQuickAddType(null)} />

      {/* Main Content */}
      <main className={cn(
        'min-h-0',
        isChat ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1 overflow-y-auto custom-scrollbar'
      )}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'max-w-4xl mx-auto w-full',
            isChat ? 'flex-1 flex flex-col overflow-hidden px-4 pt-3 pb-0' : 'p-5 pb-28'
          )}
        >
          {children}
        </motion.div>
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
};
