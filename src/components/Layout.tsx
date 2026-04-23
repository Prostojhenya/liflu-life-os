import React from 'react';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, CheckSquare, Repeat, ShoppingCart, MessageSquare, Target, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';

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

  return (
    <div className="flex flex-col h-screen bg-[#0b0416] text-white font-sans overflow-hidden">
      {/* Header HUD - Only show full status if NOT on dashboard */}
      <header className="px-6 pt-10 pb-2 shrink-0 z-20">
        <div className="flex justify-between items-center h-12">
          <div className="user-info">
             <p className="text-[9px] text-accent-magenta font-black uppercase tracking-[0.4em] glow-magenta mb-1 font-display">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' }).replace('.', '')}
            </p>
            <h1 className="text-xl font-black tracking-tighter uppercase italic glow-purple font-display leading-tight">
              {activeTab === 'dashboard' ? '' : tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="p-5 max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
