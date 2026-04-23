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
      setActiveTab('create');
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
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl">
        <div className="px-6 py-3">
          <div className="grid grid-cols-5 items-end gap-4">
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
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}

            {/* Center button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleNavClick(centerItem.id)}
                className="w-14 h-14 -mt-6 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-95 transition-transform mb-1"
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
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
