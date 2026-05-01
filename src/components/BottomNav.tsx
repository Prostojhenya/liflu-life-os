import React from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, ShoppingCart, User, Plus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// 2 left | center (+) | 3 right
const leftItems = [
  { id: 'dashboard', icon: Home, label: 'Главная' },
  { id: 'tasks', icon: CheckSquare, label: 'Задачи' },
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
    if (id === 'add') {
      setActiveTab('create');
      return;
    }
    setActiveTab(id as any);
  };

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl">
        <div className="px-4 py-3">
          <div className="grid grid-cols-6 items-end gap-1">
            {/* Left items */}
            {leftItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 transition-colors",
                    isActive ? "text-white" : "text-[#6b7280]"
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}

            {/* Center button — spans 2 cols visually via flex trick */}
            <div className="col-span-2 flex justify-center items-end pb-1">
              <button
                onClick={() => handleNavClick('add')}
                className="w-14 h-14 -mt-6 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
              >
                <Plus size={26} strokeWidth={2.5} className="text-white" />
              </button>
            </div>

            {/* Right items */}
            {rightItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 transition-colors",
                    isActive ? "text-white" : "text-[#6b7280]"
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
