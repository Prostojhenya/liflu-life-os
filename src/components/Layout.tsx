import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, CheckSquare, Repeat, ShoppingCart, MessageSquare, Target, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { SpaceSwitcher } from './SpaceSwitcher';

const tabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Главная' },
  { id: 'tasks', icon: CheckSquare, label: 'Задачи' },
  { id: 'habits', icon: Repeat, label: 'Привычки' },
  { id: 'goals', icon: Target, label: 'Цели' },
  { id: 'shopping', icon: ShoppingCart, label: 'Покупки' },
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
] as const;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, user } = useStore();
  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0b0416] text-white font-sans overflow-hidden">
      {/* Header HUD - Only show title for non-dashboard tabs */}
      {activeTab !== 'dashboard' && (
        <header className="px-6 pt-6 pb-2 shrink-0 z-20">
          <div className="flex justify-between items-center h-8">
            <div className="user-info">
              <h1 className="text-xl font-black tracking-tighter uppercase italic glow-purple font-display leading-tight">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
          </div>
        </header>
      )}

      {/* Space Switcher Button - Always visible */}
      <div className="px-6 pt-4 pb-2 shrink-0 z-20">
        <button
          onClick={() => setIsSpaceSwitcherOpen(true)}
          className="w-full bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-accent-purple/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-purple/20 rounded-full flex items-center justify-center">
              <span className="text-accent-purple text-sm font-black">🏠</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-white uppercase font-display">
                Personal Space
              </p>
              <p className="text-[8px] text-[#8b7ca8] font-display">
                Личное пространство
              </p>
            </div>
          </div>
          <ChevronDown size={16} className="text-[#8b7ca8]" />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn("p-5 max-w-4xl mx-auto", activeTab === 'dashboard' && "pt-2")}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Space Switcher Modal */}
      <SpaceSwitcher 
        isOpen={isSpaceSwitcherOpen} 
        onClose={() => setIsSpaceSwitcherOpen(false)} 
      />
    </div>
  );
};
