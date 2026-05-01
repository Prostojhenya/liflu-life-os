import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, CheckSquare, Repeat, ShoppingCart, MessageSquare, Target, User, ChevronDown, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { SpaceSwitcher } from './SpaceSwitcher';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [currentSpace, setCurrentSpace] = useState<{ name: string; type: 'personal' | 'shared' } | null>(null);

  // Load current space info
  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const loadSpace = async () => {
      try {
        const spaceDoc = await getDoc(doc(db, 'spaces', user.currentSpaceId));
        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          setCurrentSpace({
            name: data.name || 'Personal Space',
            type: data.type || 'personal'
          });
        }
      } catch (error) {
        console.error('Error loading space:', error);
      }
    };

    loadSpace();
  }, [user?.currentSpaceId]);

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

      {/* Space Switcher Button */}
      <div className="px-6 pt-4 pb-2 shrink-0 z-20">
        <button
          onClick={() => setIsSpaceSwitcherOpen(true)}
          className="w-full bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-accent-purple/30 transition-all active:scale-98"
        >
          <div className="w-8 h-8 bg-accent-purple/20 rounded-full flex items-center justify-center">
            {currentSpace?.type === 'shared' ? (
              <Users size={16} className="text-accent-purple" />
            ) : (
              <Lock size={16} className="text-accent-purple" />
            )}
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-black text-white uppercase font-display">
              {currentSpace?.name || 'Personal Space'}
            </p>
            <p className="text-[8px] text-[#8b7ca8] font-display">
              {currentSpace?.type === 'shared' ? 'Групповое пространство' : 'Личное пространство'}
            </p>
          </div>
          <ChevronDown size={16} className="text-[#8b7ca8]" />
        </button>
      </div>

      {/* Space Switcher Modal */}
      <SpaceSwitcher 
        isOpen={isSpaceSwitcherOpen} 
        onClose={() => setIsSpaceSwitcherOpen(false)} 
      />

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
    </div>
  );
};
