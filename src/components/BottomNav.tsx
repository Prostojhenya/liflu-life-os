import React from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, ShoppingCart, User, Plus, MessageCircle, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const leftItems = [
  { id: 'dashboard', icon: Home, label: 'Главная' },
  { id: 'tasks', icon: CheckSquare, label: 'Задачи' },
  { id: 'habits', icon: Flame, label: 'Привычки' },
  { id: 'goals', icon: Target, label: 'Цели' },
] as const;

const rightItems = [
  { id: 'shopping', icon: ShoppingCart, label: 'Покупки' },
  { id: 'chat', icon: MessageCircle, label: 'Чат' },
  { id: 'profile', icon: User, label: 'Профиль' },
] as const;

type NavId = typeof leftItems[number]['id'] | typeof rightItems[number]['id'] | 'add';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const handleNavClick = (id: NavId | 'add') => {
    if (id === 'add') { setActiveTab('create'); return; }
    setActiveTab(id as any);
  };

  return (
    <nav className="shrink-0 z-50 bg-[#0a0a0f] border-t border-white/5">
      <div className="grid grid-cols-8 items-end px-2 pt-2 pb-safe">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 transition-colors',
                isActive ? 'text-white' : 'text-[#6b7280]'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* Center + button */}
        <div className="flex justify-center items-end pb-2">
          <button
            onClick={() => handleNavClick('add')}
            className="w-13 h-13 -mt-5 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
            style={{ width: 52, height: 52 }}
          >
            <Plus size={24} strokeWidth={2.5} className="text-white" />
          </button>
        </div>

        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 transition-colors',
                isActive ? 'text-white' : 'text-[#6b7280]'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
