import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, Flame, Plus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddSheet } from './AddSheet';

type AddType = 'task' | 'habit' | 'goal' | 'shopping';

const leftItems = [
  { id: 'dashboard', icon: Home,          label: 'Главная'  },
  { id: 'tasks',     icon: CheckSquare,   label: 'Задачи'   },
] as const;

const rightItems = [
  { id: 'habits',    icon: Flame,         label: 'Привычки' },
  { id: 'chat',      icon: MessageCircle, label: 'Чат'      },
] as const;

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const renderItem = (item: { id: string; icon: React.ElementType; label: string }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id as any)}
        className={cn(
          'flex flex-col items-center gap-1 py-2 transition-colors flex-1',
          isActive ? 'text-white' : 'text-[#6b7280]'
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <nav className="shrink-0 z-50 bg-[#0a0a0f] border-t border-white/5">
        <div className="flex items-end px-2 pt-2 pb-safe">
          {leftItems.map(renderItem)}

          {/* Center + button */}
          <div className="flex justify-center items-end pb-2 flex-1">
            <button
              onClick={() => setSheetOpen(true)}
              className="w-[52px] h-[52px] -mt-5 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {rightItems.map(renderItem)}
        </div>
      </nav>

      <AddSheet type={sheetOpen ? 'picker' : null} onClose={() => setSheetOpen(false)} />
    </>
  );
};
