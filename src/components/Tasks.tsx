import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { handleFirestoreError, OperationType } from '@/firebase';
import { CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  statType: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
  completed: boolean;
  xpAwarded: boolean;
  xpValue: number;
  createdAt: any;
  scheduledDate?: string;
}

const STAT_COLORS = {
  strength: '#ef4444',
  agility: '#f59e0b',
  intelligence: '#8B5CF6',
  vitality: '#10b981',
  sense: '#3B82F6',
};

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === tomorrow.toDateString()) return 'Завтра';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const Tasks: React.FC = () => {
  const { user, setUser } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/tasks`),
      orderBy('scheduledDate', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  }, [user?.currentSpaceId]);

  const toggleTask = async (task: Task) => {
    if (!user?.currentSpaceId) return;
    const path = `spaces/${user.currentSpaceId}/tasks/${task.id}`;
    const userRef = doc(db, 'users', user.uid);
    try {
      const taskRef = doc(db, path);
      const newCompleted = !task.completed;
      await updateDoc(taskRef, { completed: newCompleted });

      if (newCompleted && !task.xpAwarded) {
        const newTotalXP = user.totalXP + task.xpValue;
        const newLevel = calculateLevel(newTotalXP);
        const newStats = { ...user.stats };
        newStats[task.statType] = (newStats[task.statType] || 0) + 1;
        await updateDoc(userRef, { totalXP: newTotalXP, level: newLevel, stats: newStats });
        await updateDoc(taskRef, { xpAwarded: true });
        setUser({ ...user, totalXP: newTotalXP, level: newLevel, stats: newStats });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user?.currentSpaceId) return;
    await deleteDoc(doc(db, `spaces/${user.currentSpaceId}/tasks`, id));
  };

  if (!user) return null;

  const today = todayStr();

  // Apply filter
  const visibleTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    return true;
  });

  // Group by date
  const groups: Record<string, Task[]> = {};
  for (const task of visibleTasks) {
    const key = task.scheduledDate || today;
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  const sortedDates = Object.keys(groups).sort();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-5 pb-28">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">
          Все задачи
        </h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">
          {completedTasks}/{totalTasks} выполнено
        </p>
      </header>

      {/* Filter toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all border',
            filter === 'active'
              ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
              : 'bg-[#150a24] border-white/5 text-[#6b7280]'
          )}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all border',
            filter === 'all'
              ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
              : 'bg-[#150a24] border-white/5 text-[#6b7280]'
          )}
        >
          Все
        </button>
      </div>

      {/* Task groups */}
      {sortedDates.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">
            {filter === 'active' ? '✅' : '📋'}
          </div>
          <h3 className="text-lg font-black text-white mb-2 font-display">
            {filter === 'active' ? 'Все выполнено!' : 'Нет задач'}
          </h3>
          <p className="text-sm text-[#8b7ca8] font-display">
            {filter === 'active'
              ? 'Зажми иконку задач в навигации чтобы добавить'
              : 'Зажми иконку задач в навигации чтобы добавить'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <Calendar size={12} className="text-[#8b7ca8]" />
                <span className={cn(
                  'text-[10px] font-black uppercase tracking-wider font-display',
                  dateKey === today ? 'text-accent-purple' : 'text-[#8b7ca8]'
                )}>
                  {formatDate(dateKey)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-[#6b7280] font-display">
                  {groups[dateKey].filter(t => t.completed).length}/{groups[dateKey].length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                <AnimatePresence>
                  {groups[dateKey].map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      className={cn(
                        'bg-[#150a24]/50 border rounded-2xl p-3.5 flex items-center gap-3 transition-all',
                        task.completed
                          ? 'border-white/5 opacity-60'
                          : 'border-white/5 hover:border-white/10'
                      )}
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                          task.completed ? 'bg-accent-blue text-white' : 'bg-white/5 text-[#8b7ca8]'
                        )}
                      >
                        {task.completed
                          ? <CheckCircle2 size={14} strokeWidth={3} />
                          : <Circle size={14} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-sm font-bold text-white font-display truncate',
                          task.completed && 'line-through opacity-50'
                        )}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: STAT_COLORS[task.statType] }}
                          />
                          <span
                            className="text-[9px] font-black uppercase tracking-wider font-display"
                            style={{ color: STAT_COLORS[task.statType] }}
                          >
                            {STAT_LABELS[task.statType]}
                          </span>
                        </div>
                      </div>

                      <span className={cn(
                        'text-xs font-black font-display flex-shrink-0',
                        task.completed ? 'text-accent-blue' : 'text-[#8b7ca8]'
                      )}>
                        {task.completed ? '+' : ''}{task.xpValue} XP
                      </span>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[#6b7280] hover:text-red-400 transition-colors flex-shrink-0 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
