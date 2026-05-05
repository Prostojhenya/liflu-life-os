import React, { useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, ShoppingCart, Flame, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddSheet } from './AddSheet';
import { BurgerMenu } from './BurgerMenu';

const navItems = [
  { id: 'dashboard', icon: Home,        label: 'Главная',  addType: null },
  { id: 'tasks',     icon: CheckSquare, label: 'Задачи',   addType: 'task' },
  { id: 'habits',    icon: Flame,       label: 'Привычки', addType: 'habit' },
  { id: 'shopping',  icon: ShoppingCart,label: 'Покупки',  addType: 'shopping' },
] as const;

type AddType = 'task' | 'habit' | 'goal' | 'shopping';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();
  const [sheetType, setSheetType] = useState<AddType | null>(null);
  const [burgerOpen, setBurgerOpen] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = useCallback((addType: AddType | null) => {
    if (!addType) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setSheetType(addType);
    }, 450);
  }, []);

  const endPress = useCallback(
    (id: string, addType: AddType | null) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (!didLongPress.current) {
        setActiveTab(id as any);
      }
    },
    [setActiveTab]
  );

  const cancelPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Burger items that count as "active" for the menu button highlight
  const burgerTabs = ['profile', 'goals', 'chat'];
  const burgerActive = burgerTabs.includes(activeTab);

  return (
    <>
      <nav className="shrink-0 z-50 bg-[#0a0a0f] border-t border-white/5">
        <div className="grid grid-cols-5 items-end px-2 pt-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasAdd = item.addType !== null;
            return (
              <button
                key={item.id}
                onPointerDown={() => startPress(item.addType as AddType | null)}
                onPointerUp={() => endPress(item.id, item.addType as AddType | null)}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-2 transition-colors select-none',
                  isActive ? 'text-white' : 'text-[#6b7280]'
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
                {hasAdd && (
                  <span className={cn(
                    'absolute top-1.5 right-[calc(50%-14px)] w-1 h-1 rounded-full transition-colors',
                    isActive ? 'bg-white/40' : 'bg-white/20'
                  )} />
                )}
              </button>
            );
          })}

          {/* Burger button */}
          <button
            onPointerUp={() => setBurgerOpen(true)}
            className={cn(
              'relative flex flex-col items-center gap-1 py-2 transition-colors select-none',
              burgerActive ? 'text-white' : 'text-[#6b7280]'
            )}
          >
            <Menu size={22} strokeWidth={burgerActive ? 2.5 : 2} />
            <span className="text-[9px] font-medium whitespace-nowrap">Меню</span>
            {/* dot when a burger-tab is active */}
            {burgerActive && (
              <span className="absolute top-1.5 right-[calc(50%-14px)] w-1 h-1 rounded-full bg-accent-purple" />
            )}
          </button>
        </div>
      </nav>

      <AddSheet type={sheetType} onClose={() => setSheetType(null)} />
      <BurgerMenu open={burgerOpen} onClose={() => setBurgerOpen(false)} />
    </>
  );
};
