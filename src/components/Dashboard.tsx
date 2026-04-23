import React, { useState, useEffect, useRef } from 'react';
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { Plus, CheckCircle2, Circle, ChevronRight, Flame, Filter } from 'lucide-react';
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
  scheduledDate?: string; // Format: YYYY-MM-DD
}

const STAT_COLORS = {
  strength: '#ef4444',
  agility: '#f59e0b', 
  intelligence: '#8B5CF6',
  vitality: '#10b981',
  sense: '#3B82F6'
};

export const Dashboard: React.FC = () => {
  const { user, setUser } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Scroll to today on mount
  useEffect(() => {
    if (calendarRef.current) {
      const todayElement = calendarRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);

  // Scroll to selected date when it changes
  useEffect(() => {
    if (calendarRef.current) {
      const selectedElement = calendarRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  // Update visible month on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (calendarRef.current) {
        const container = calendarRef.current;
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        
        const days = container.querySelectorAll('[data-month]');
        let closestDay: Element | null = null;
        let closestDistance = Infinity;
        
        days.forEach((day) => {
          const rect = day.getBoundingClientRect();
          const dayCenter = rect.left + rect.width / 2;
          const distance = Math.abs(centerX - dayCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestDay = day;
          }
        });
        
        if (closestDay) {
          const month = closestDay.getAttribute('data-month');
          if (month) setVisibleMonth(month);
        }
      }
    };

    const container = calendarRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const path = `spaces/${user.currentSpaceId}/tasks`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user?.currentSpaceId || isAdding) return;

    setIsAdding(true);
    const path = `spaces/${user.currentSpaceId}/tasks`;
    try {
      const finalStat = 'intelligence';
      
      // Format selected date as YYYY-MM-DD
      const scheduledDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      await addDoc(collection(db, path), {
        title: newTask,
        statType: finalStat,
        completed: false,
        xpAwarded: false,
        xpValue: XP_VALUES.TASK,
        spaceId: user.currentSpaceId,
        scheduledDate: scheduledDateStr,
        createdAt: serverTimestamp(),
      });
      setNewTask('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user?.currentSpaceId) return;
    const path = `spaces/${user.currentSpaceId}/tasks/${task.id}`;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const taskRef = doc(db, path);
      const newCompletedState = !task.completed;
      
      await updateDoc(taskRef, { completed: newCompletedState });

      if (newCompletedState && !task.xpAwarded) {
        const newTotalXP = user.totalXP + task.xpValue;
        const newLevel = calculateLevel(newTotalXP);
        const newStats = { ...user.stats };
        newStats[task.statType] = (newStats[task.statType] || 0) + 1;

        await updateDoc(userRef, {
          totalXP: newTotalXP,
          level: newLevel,
          stats: newStats
        });
        await updateDoc(taskRef, { xpAwarded: true });

        setUser({ ...user, totalXP: newTotalXP, level: newLevel, stats: newStats });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (!user) return null;

  // Generate infinite calendar (90 days back and forward)
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const weekDays = [];
  for (let i = -90; i <= 90; i++) {
    const date = new Date(currentYear, currentMonth, currentDay + i);
    weekDays.push({
      day: date.getDate(),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2).charAt(0).toUpperCase() + date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(1, 2),
      isToday: i === 0,
      month: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      date: date
    });
  }

  const currentMonthName = visibleMonth || today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  // Filter tasks by selected date
  const isToday = selectedDate.toDateString() === today.toDateString();
  const selectedDateStr = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const isPastDate = selectedDate < today && !isToday;
  const isFutureDate = selectedDate > today && !isToday;
  
  // Format selected date for comparison
  const selectedDateFormatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  // Filter tasks by scheduled date
  const filteredTasks = tasks.filter(t => {
    // Check if task is scheduled for selected date
    const taskDate = t.scheduledDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (taskDate !== selectedDateFormatted) return false;
    
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return !t.completed;
  });

  const displayedTasks = isExpanded ? filteredTasks : filteredTasks.slice(0, 3);
  const hasMoreTasks = filteredTasks.length > 3;

  const completedToday = tasks.filter(t => t.completed).length;
  const totalToday = tasks.length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Calculate streak (simplified - just count completed tasks)
  const streak = tasks.filter(t => t.completed).length;

  const xpToNextLevel = user.level * user.level * 50;
  const xpProgress = Math.min(100, (user.totalXP / xpToNextLevel) * 100);

  return (
    <div className="space-y-4 pb-32">
      {/* Week Calendar */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display">
            {currentMonthName}
          </span>
        </div>
        <div ref={calendarRef} className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-1.5 pb-2" style={{ width: 'max-content' }}>
            {weekDays.map((day, index) => {
              const isSelected = selectedDate.toDateString() === day.date.toDateString();
              return (
                <button
                  key={index}
                  data-today={day.isToday}
                  data-selected={isSelected}
                  data-month={day.month}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "flex flex-col items-center justify-center snap-center py-3 rounded-2xl transition-all flex-shrink-0 cursor-pointer",
                    day.isToday && !isSelected
                      ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30" 
                      : isSelected
                      ? "bg-accent-purple text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                      : "bg-transparent text-[#8b7ca8] hover:bg-white/5"
                  )}
                  style={{ width: 'calc((100vw - 48px) / 7)' }}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    {day.weekday}
                  </span>
                  <span className={cn(
                    "text-xl font-black font-display",
                    isSelected && "glow-purple"
                  )}>
                    {day.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="level-circle w-16 h-16">
              <div className="level-circle-inner relative">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-white uppercase font-display">Level {user.level}</span>
                <span className="text-accent-purple">💎</span>
              </div>
              <div className="text-2xl font-black text-white glow-purple font-display">
                {user.totalXP} <span className="text-sm text-accent-purple">XP</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#8b7ca8] font-black uppercase tracking-wider font-display mb-1">
              {xpToNextLevel - user.totalXP} XP до Level {user.level + 1}
            </div>
            <ChevronRight className="ml-auto text-[#8b7ca8]" size={20} />
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="status-bar-bg h-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            className="status-bar-fill bg-gradient-to-r from-accent-purple to-accent-magenta"
          />
        </div>
      </div>

      {/* Today Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase font-display mb-1">
              {isToday ? 'Сегодня' : selectedDateStr}
            </h2>
            {isToday && (
              <p className="text-xs text-[#8b7ca8] font-bold uppercase tracking-wider font-display">
                {completedToday}/{totalToday} выполнено
              </p>
            )}
          </div>
          {isToday && (
            <button 
              onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all",
                filter === 'active' 
                  ? "bg-[#150a24] border-white/5 text-[#8b7ca8]" 
                  : "bg-accent-purple/10 border-accent-purple/30 text-accent-purple"
              )}
            >
              <Filter size={14} />
              {filter === 'active' ? 'Все' : 'Активные'}
            </button>
          )}
        </div>

        {/* Add Task Form - works for any date */}
        <form onSubmit={addTask} className="mb-4 relative">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={isFutureDate ? "Запланировать задачу..." : "Добавить задачу..."}
            className="w-full bg-[#0b0416] border border-white/10 rounded-2xl py-4 pl-5 pr-16 focus:outline-none focus:border-accent-purple transition-all text-base font-bold text-white placeholder:text-[#8b7ca8]/50 font-display"
            disabled={isAdding || isPastDate}
          />
          <button 
            type="submit"
            disabled={isAdding || !newTask.trim() || isPastDate}
            className="absolute right-2 top-2 bottom-2 w-12 bg-accent-purple text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </form>

        {/* Tasks List or Empty State */}
        {!isToday && filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">
              {isPastDate ? '📜' : '📅'}
            </div>
            <h3 className="text-lg font-black text-white mb-2 font-display">
              {isPastDate ? 'История' : 'Планы'}
            </h3>
            <p className="text-sm text-[#8b7ca8] font-display">
              {isPastDate 
                ? 'Здесь будет история выполненных задач' 
                : 'Здесь будут запланированные задачи'}
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-black text-white mb-2 font-display">
              Нет задач
            </h3>
            <p className="text-sm text-[#8b7ca8] font-display">
              Добавьте первую задачу на сегодня
            </p>
          </div>
        ) : (
          <div className="space-y-3">
          <AnimatePresence>
            {displayedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "bg-[#150a24]/50 border rounded-2xl p-4 transition-all",
                  task.completed 
                    ? "border-accent-blue/30 bg-accent-blue/5" 
                    : "border-white/5 hover:border-white/10"
                )}
                onClick={() => toggleTask(task)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                    task.completed ? "bg-accent-blue text-white" : "bg-white/5 text-[#8b7ca8]"
                  )}>
                    {task.completed ? <CheckCircle2 size={16} strokeWidth={3} /> : <Circle size={16} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-bold text-white mb-1 font-display",
                      task.completed && "line-through opacity-50"
                    )}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: STAT_COLORS[task.statType] }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider font-display" style={{ color: STAT_COLORS[task.statType] }}>
                        {STAT_LABELS[task.statType]}
                      </span>
                    </div>
                  </div>

                  {task.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-accent-blue font-black text-sm font-display"
                    >
                      +{task.xpValue} XP
                    </motion.div>
                  )}
                  {!task.completed && (
                    <div className="text-[#8b7ca8] font-black text-xs font-display">
                      {task.xpValue} XP
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}

        {/* Expand button */}
        {hasMoreTasks && isToday && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 py-4 bg-[#150a24]/50 border border-white/5 rounded-2xl text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display hover:border-accent-purple/30 transition-all flex items-center justify-center gap-2"
          >
            {isExpanded ? '↑ Свернуть' : `↓ Показать еще ${filteredTasks.length - 3}`}
          </motion.button>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Progress Circle */}
        <div className="bg-[#150a24]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-3">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#3B82F6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${progressPercent * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-white font-display">{progressPercent}%</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display mb-1">
              Сегодня: {completedToday} из {totalToday}
            </div>
            <div className="text-[10px] text-accent-blue font-bold font-display">
              Продолжай в том же духе!
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-[#150a24]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-accent-orange/10 rounded-full flex items-center justify-center mb-3">
            <Flame size={32} className="text-accent-orange" />
          </div>
          <div className="text-3xl font-black text-white mb-1 font-display">{streak}</div>
          <div className="text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display">
            дней подряд
          </div>
        </div>
      </div>
    </div>
  );
};
