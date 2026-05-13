/**
 * HabitsSection Component
 * Displays list of habits with completion functionality
 */

import React, { useState } from 'react';
import { Flame, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  title: string;
  streak: number;
  xpValue: number;
}

interface HabitsSectionProps {
  habits: Habit[];
  completedCount: number;
  onCompleteHabit: (habit: Habit) => void;
  isHabitCompleted: (habit: Habit) => boolean;
  processingHabitId: string | null;
  previewCount?: number;
}

export function HabitsSection({
  habits,
  completedCount,
  onCompleteHabit,
  isHabitCompleted,
  processingHabitId,
  previewCount = 3,
}: HabitsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const shownHabits = expanded ? habits : habits.slice(0, previewCount);

  return (
    <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <Flame size={16} className="text-accent-purple" />
        <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">
          Привычки
        </span>
        {habits.length > 0 && (
          <span className="text-[10px] text-[#8b7ca8] font-display">
            {completedCount}/{habits.length}
          </span>
        )}
      </div>

      {/* Content */}
      {habits.length === 0 ? (
        <div className="px-4 pb-4 text-center py-6">
          <p className="text-xs text-[#8b7ca8] font-display">
            Зажми иконку привычек в навигации
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {shownHabits.map((habit) => {
              const done = isHabitCompleted(habit);
              const disabled = done || processingHabitId === habit.id;

              return (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Complete button */}
                  <button
                    onClick={() => onCompleteHabit(habit)}
                    disabled={disabled}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      done
                        ? 'bg-[#10b981] border-[#10b981]'
                        : 'border-white/20 bg-transparent active:scale-90'
                    )}
                  >
                    {done && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                  </button>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-semibold text-white font-display truncate',
                        done && 'opacity-50'
                      )}
                    >
                      {habit.title}
                    </div>
                    <div className="text-[10px] text-[#8b7ca8] font-display mt-0.5">
                      Серия: {habit.streak} дней
                    </div>
                  </div>

                  {/* XP */}
                  <span className="text-xs font-black text-[#10b981] font-display flex-shrink-0">
                    +{habit.xpValue} XP
                  </span>
                </div>
              );
            })}
          </div>

          {/* Expand button */}
          {habits.length > previewCount && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
            >
              {expanded ? 'Свернуть' : 'Показать все привычки'}
              <ChevronDown
                size={13}
                className={cn('transition-transform', expanded && 'rotate-180')}
              />
            </button>
          )}
        </>
      )}
    </div>
  );
}
