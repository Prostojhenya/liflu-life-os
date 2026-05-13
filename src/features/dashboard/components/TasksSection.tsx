/**
 * TasksSection Component
 * Displays list of tasks with completion functionality
 */

import React, { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { STAT_LABELS } from '@/store/useStore';

interface Task {
  id: string;
  title: string;
  type?: 'task' | 'event';
  statType: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
  completed: boolean;
  xpValue: number;
}

interface TasksSectionProps {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  isPastDate: boolean;
  onToggleTask: (task: Task) => void;
  previewCount?: number;
}

export function TasksSection({
  tasks,
  completedCount,
  totalCount,
  isPastDate,
  onToggleTask,
  previewCount = 3,
}: TasksSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const activeTasks = tasks.filter((t) => !t.completed);
  const shownTasks = expanded ? activeTasks : activeTasks.slice(0, previewCount);

  return (
    <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="text-base">👑</span>
        <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">
          Задачи
        </span>
        {totalCount > 0 && (
          <span className="text-[10px] text-[#8b7ca8] font-display">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Content */}
      {activeTasks.length === 0 ? (
        <div className="px-4 pb-4 text-center py-6">
          {isPastDate ? (
            <p className="text-xs text-[#8b7ca8] font-display">Нет активных задач</p>
          ) : (
            <p className="text-xs text-[#8b7ca8] font-display">
              {completedCount > 0
                ? `Все ${completedCount} задач выполнено ✅`
                : 'Зажми иконку задач в навигации'}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {shownTasks.map((task) => (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onToggleTask(task)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      task.completed
                        ? 'bg-accent-purple border-accent-purple'
                        : 'border-white/20 bg-transparent'
                    )}
                  >
                    {task.completed && (
                      <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Title + stat */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-semibold text-white font-display truncate',
                        task.completed && 'line-through opacity-40'
                      )}
                    >
                      {task.title}
                    </div>
                    <div className="text-[10px] text-accent-purple font-display mt-0.5">
                      {STAT_LABELS[task.statType]}
                    </div>
                  </div>

                  {/* XP */}
                  <span className="text-xs font-black text-accent-purple font-display flex-shrink-0">
                    +{task.xpValue} XP
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Expand button */}
          {activeTasks.length > previewCount && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
            >
              {expanded ? 'Свернуть' : 'Показать все задачи'}
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
