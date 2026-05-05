import React, { useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Home, CheckSquare, Flame, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddSheet } from './AddSheet';

type AddType = 'task' | 'habit' | 'goal' | 'shopping';

const leftItems = [
  { id: 'dashboard', icon: Home,        label: 'Главная',  addType: null },
  { id: 'tasks',     icon: CheckSquare, label: 'Задачи',   addType: 'task' as AddType },
] as const;

const rightItems = [
  { id: 'habits',    icon: Flame,       label: 'Привычки', addType: 'habit' as AddType },
] as const;

// All items that support long-press add
const allItems = [...leftItems, ...rightItems];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();
  const [sheetType, setSheetType] = useState<AddType | null>(null);

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

  const endPress = useCallback((id: string, addType: AddType | null) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      setActiveTab(id as any);
    }
  }, [setActiveTab]);

  const cancelPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const renderItem = (item: typeof allItems[number]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onPointerDown={() => startPress(item.addType)}
        onPointerUp={() => endPress(item.id, item.addType)}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        className={cn(
          'relative flex flex-col items-center gap-1 py-2 transition-colors select-none flex-1',
          isActive ? 'text-white' : 'text-[#6b7280]'
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
        {item.addType && (
          <span className={cn(
            'absolute top-1.5 right-[calc(50%-14px)] w-1 h-1 rounded-full',
            isActive ? 'bg-white/40' : 'bg-white/20'
          )} />
        )}
      </button>
    );
  };

  return (
    <>
      <nav className="shrink-0 z-50 bg-[#0a0a0f] border-t border-white/5">
        <div className="flex items-end px-2 pt-2 pb-safe">
          {/* Left items */}
          {leftItems.map(renderItem)}

          {/* Center + button */}
          <div className="flex justify-center items-end pb-2 flex-1">
            <button
              onPointerDown={() => setSheetType('task')}
              className="w-[52px] h-[52px] -mt-5 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {/* Right items */}
          {rightItems.map(renderItem)}

          {/* Extra right slot — placeholder to balance layout */}
          <div className="flex-1" />
        </div>
      </nav>

      <AddSheet type={sheetType} onClose={() => setSheetType(null)} />
    </>
  );
};
