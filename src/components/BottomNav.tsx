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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-around relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenter = item.isCenter;

            if (isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
                >
                  <Icon size={28} strokeWidth={2.5} className="text-white" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 transition-colors min-w-[60px]",
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
    </nav>
  );
};
