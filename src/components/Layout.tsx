import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { SpaceSwitcher } from './SpaceSwitcher';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronDown, Users, Lock } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, user } = useStore();
  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<{ name: string; type: 'personal' | 'shared' } | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // iOS keyboard fix: lock the container height when keyboard opens
  // so the layout doesn't scroll/jump
  useEffect(() => {
    const initialHeight = window.innerHeight;

    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
      setKeyboardOpen(true);

      // On iOS: freeze container at current height so it doesn't jump
      if (containerRef.current) {
        containerRef.current.style.height = `${initialHeight}px`;
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.top = '0';
        containerRef.current.style.left = '0';
        containerRef.current.style.right = '0';
      }
    };

    const onFocusOut = () => {
      setKeyboardOpen(false);
      // Restore normal layout
      if (containerRef.current) {
        containerRef.current.style.height = '';
        containerRef.current.style.position = '';
        containerRef.current.style.top = '';
        containerRef.current.style.left = '';
        containerRef.current.style.right = '';
      }
    };

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
    <div
      ref={containerRef}
      className="flex flex-col bg-[#0b0416] text-white font-sans overflow-hidden"
      style={{ height: '100svh' }}
    >
      {/* Top bar — hidden in chat */}
      {!isChat && (
        <header className="shrink-0 z-20 bg-[#0b0416]">
          <button
            onClick={() => setIsSpaceSwitcherOpen(true)}
            className="w-full bg-[#150a24] border-b border-white/10 px-5 py-3.5 flex items-center gap-3 active:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 bg-accent-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
              {currentSpace?.type === 'shared'
                ? <Users size={16} className="text-accent-purple" />
                : <Lock size={16} className="text-accent-purple" />
              }
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-black text-white uppercase font-display truncate">
                {currentSpace?.name || 'Personal Space'}
              </p>
              <p className="text-[9px] text-[#8b7ca8] font-display">
                {currentSpace?.type === 'shared' ? 'Групповое пространство' : 'Личное пространство'}
              </p>
            </div>
            <ChevronDown size={16} className="text-[#8b7ca8] flex-shrink-0" />
          </button>
        </header>
      )}

      <SpaceSwitcher
        isOpen={isSpaceSwitcherOpen}
        onClose={() => setIsSpaceSwitcherOpen(false)}
      />

      {/* Main Content */}
      <main className={cn(
        'min-h-0',
        isChat
          ? 'flex-1 flex flex-col overflow-hidden'
          : 'flex-1 overflow-y-auto custom-scrollbar'
      )}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'max-w-4xl mx-auto w-full',
            isChat
              ? 'flex-1 flex flex-col overflow-hidden px-4'
              : 'p-5 pb-28'
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation — hidden when keyboard open in chat */}
      {!hideNav && <BottomNav />}
    </div>
  );
};
