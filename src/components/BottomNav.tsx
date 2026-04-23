import React from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, ShoppingCart, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', icon: Home, label: 'Главная' },
  { id: 'tasks', icon: CheckSquare, label: 'Задачи' },
  { id: 'add', icon: Plus, label: 'Добавить', isCenter: true },
  { id: 'shopping', icon: ShoppingCart, label: 'Покупки' },
  { id: 'profile', icon: User, label: 'Профиль' },
] as const;

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const handleNavClick = (id: string) => {
    if (id === 'add') {
      // Handle add action - можно открыть модальное окно или меню
      console.log('Add button clicked');
      return;
    }
    if (id === 'profile') {
      // Handle profile navigation
      console.log('Profile clicked');
      return;
    }
    setActiveTab(id as any);
  };

  const leftItems = navItems.slice(0, 2);
  const centerItem = navItems[2];
  const rightItems = navItems.slice(3);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between relative">
          {/* Left items */}
          <div className="flex items-center gap-2 flex-1 justify-start">
            {leftItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-4 transition-colors",
                    isActive ? "text-white" : "text-[#6b7280]"
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center button */}
          <div className="flex-shrink-0 px-4">
            <button
              onClick={() => handleNavClick(centerItem.id)}
              className="w-16 h-16 -mt-8 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
            >
              <Plus size={28} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {/* Right items */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {rightItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-4 transition-colors",
                    isActive ? "text-white" : "text-[#6b7280]"
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
