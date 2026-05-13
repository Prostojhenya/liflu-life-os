/**
 * FilterBar Component
 * Filter buttons for tasks, habits, and events
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'tasks' | 'habits' | 'events';

interface FilterOption {
  key: FilterType;
  label: string;
  count: number;
  color: string;
}

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  tasksCount: number;
  habitsCount: number;
  eventsCount: number;
}

export function FilterBar({
  activeFilter,
  onFilterChange,
  tasksCount,
  habitsCount,
  eventsCount,
}: FilterBarProps) {
  const filters: FilterOption[] = [
    {
      key: 'all',
      label: 'Все',
      count: tasksCount + habitsCount + eventsCount,
      color: 'bg-accent-purple',
    },
    {
      key: 'tasks',
      label: 'Задачи',
      count: tasksCount,
      color: 'bg-[#f97316]',
    },
    {
      key: 'habits',
      label: 'Привычки',
      count: habitsCount,
      color: 'bg-[#10b981]',
    },
    {
      key: 'events',
      label: 'События',
      count: eventsCount,
      color: 'bg-[#3B82F6]',
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {filters.map(({ key, label, count, color }) => {
        const active = activeFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider font-display transition-all flex-shrink-0 border',
              active
                ? 'bg-accent-purple border-accent-purple text-white'
                : 'bg-[#150a24]/50 border-white/5 text-[#8b7ca8] hover:bg-white/5'
            )}
          >
            {label}
            <span
              className={cn(
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center',
                color
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
