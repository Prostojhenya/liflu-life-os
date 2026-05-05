import React, { useState, useEffect, useRef } from 'react';
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import {
  collection, query, orderBy, onSnapshot, updateDoc, doc,
  serverTimestamp, setDoc, getDocs, getDoc
} from 'firebase/firestore';
import { CheckCircle2, Circle, ChevronRight, Flame, CalendarDays, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Task {
  id: string;
  title: string;
  type?: 'task' | 'event';
  eventTime?: string | null;
  statType: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
  completed: boolean;
  xpAwarded: boolean;
  xpValue: number;
  createdAt: any;
  scheduledDate?: string;
}

interface Habit {
  id: string;
  title: string;
  streak: number;
  xpValue: number;
  spaceId: string;
  lastCompleted?: any;
  statType?: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
}

interface DayCompletion {
  userId: string;
  displayName: string;
  photoURL?: string;
  completedAt: any;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PREVIEW = 3;

/* ─── Component ──────────────────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
  const { user, setUser, selectedDate, setSelectedDate } = useStore();

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);

  // Habits
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, DayCompletion[]>>({});
  const [isSharedSpace, setIsSharedSpace] = useState(false);
  const [members, setMembers] = useState<{ userId: string; displayName: string; photoURL?: string }[]>([]);
  const [processingHabit, setProcessingHabit] = useState<string | null>(null);

  // UI expand state
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [habitsExpanded, setHabitsExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'tasks' | 'habits' | 'events'>('all');

  // Calendar
  const [visibleMonth, setVisibleMonth] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);

  /* ── Calendar scroll ── */
  useEffect(() => {
    if (calendarRef.current) {
      const el = calendarRef.current.querySelector('[data-today="true"]');
      el?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    }
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      const el = calendarRef.current.querySelector('[data-selected="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!calendarRef.current) return;
      const container = calendarRef.current;
      const cx = container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2;
      let closest: Element | null = null;
      let minDist = Infinity;
      container.querySelectorAll('[data-month]').forEach(day => {
        const r = day.getBoundingClientRect();
        const dist = Math.abs(cx - (r.left + r.width / 2));
        if (dist < minDist) { minDist = dist; closest = day; }
      });
      if (closest) {
        const m = (closest as Element).getAttribute('data-month');
        if (m) setVisibleMonth(m);
      }
    };
    const c = calendarRef.current;
    if (c) { c.addEventListener('scroll', handleScroll); handleScroll(); return () => c.removeEventListener('scroll', handleScroll); }
  }, []);

  /* ── Tasks subscription ── */
  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(collection(db, `spaces/${user.currentSpaceId}/tasks`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task))));
  }, [user?.currentSpaceId]);

  /* ── Habits subscription ── */
  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(collection(db, `spaces/${user.currentSpaceId}/habits`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Habit))));
  }, [user?.currentSpaceId]);

  /* ── Space type + members ── */
  useEffect(() => {
    if (!user?.currentSpaceId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'spaces', user.currentSpaceId!));
        if (!snap.exists()) return;
        const shared = snap.data().type === 'shared';
        setIsSharedSpace(shared);
        if (shared) {
          const mSnap = await getDocs(collection(db, `spaces/${user.currentSpaceId}/members`));
          setMembers(mSnap.docs.map(d => ({ userId: d.data().userId, displayName: d.data().displayName || 'Участник', photoURL: d.data().photoURL || '' })));
        }
      } catch (e) { console.error(e); }
    })();
  }, [user?.currentSpaceId]);

  /* ── Habit completions (shared) ── */
  useEffect(() => {
    if (!user?.currentSpaceId || !isSharedSpace || habits.length === 0) return;
    const today = todayKey();
    const unsubs = habits.map(habit => {
      const q = collection(db, `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`);
      return onSnapshot(q, snap => {
        const todayC = snap.docs.filter(d => d.id.startsWith(today)).map(d => d.data() as DayCompletion);
        setCompletions(prev => ({ ...prev, [habit.id]: todayC }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [user?.currentSpaceId, isSharedSpace, habits.length]);

  /* ── Toggle task ── */
  const toggleTask = async (task: Task) => {
    if (!user?.currentSpaceId || task.type === 'event') return;
    const path = `spaces/${user.currentSpaceId}/tasks/${task.id}`;
    try {
      const taskRef = doc(db, path);
      const newCompleted = !task.completed;
      await updateDoc(taskRef, { completed: newCompleted });
      if (newCompleted && !task.xpAwarded) {
        const newXP = user.totalXP + task.xpValue;
        const newLevel = calculateLevel(newXP);
        const newStats = { ...user.stats, [task.statType]: (user.stats[task.statType] || 0) + 1 };
        await updateDoc(doc(db, 'users', user.uid), { totalXP: newXP, level: newLevel, stats: newStats });
        await updateDoc(taskRef, { xpAwarded: true });
        setUser({ ...user, totalXP: newXP, level: newLevel, stats: newStats });
      }
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  /* ── Complete habit ── */
  const completeHabit = async (habit: Habit) => {
    if (!user?.currentSpaceId || iCompletedToday(habit) || processingHabit === habit.id) return;
    setProcessingHabit(habit.id);
    const habitRef = doc(db, `spaces/${user.currentSpaceId}/habits`, habit.id);
    try {
      if (isSharedSpace) {
        const today = todayKey();
        await setDoc(doc(db, `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`, `${today}_${user.uid}`), {
          userId: user.uid, displayName: user.displayName, photoURL: user.photoURL || '', completedAt: serverTimestamp(),
        });
        const newC = [...(completions[habit.id] || []), { userId: user.uid, displayName: user.displayName, photoURL: user.photoURL, completedAt: null }];
        if (newC.length >= members.length) await updateDoc(habitRef, { streak: habit.streak + 1, lastCompleted: serverTimestamp() });
      } else {
        await updateDoc(habitRef, { streak: habit.streak + 1, lastCompleted: serverTimestamp() });
      }
      const newXP = (user.totalXP || 0) + XP_VALUES.HABIT;
      const stat = habit.statType || 'vitality';
      const newStats = { ...user.stats, [stat]: (user.stats[stat] || 0) + 1 };
      await updateDoc(doc(db, 'users', user.uid), { totalXP: newXP, level: calculateLevel(newXP), stats: newStats });
      setUser({ ...user, totalXP: newXP, level: calculateLevel(newXP), stats: newStats });
    } catch (e) { console.error(e); }
    finally { setProcessingHabit(null); }
  };

  /* ── Habit helpers ── */
  const isCompletedToday = (habit: Habit) => {
    if (isSharedSpace) return members.length > 0 && (completions[habit.id] || []).length >= members.length;
    if (!habit.lastCompleted) return false;
    const d = habit.lastCompleted.toDate ? habit.lastCompleted.toDate() : new Date(habit.lastCompleted);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const iCompletedToday = (habit: Habit) => {
    if (!isSharedSpace) return isCompletedToday(habit);
    return (completions[habit.id] || []).some(c => c.userId === user?.uid);
  };

  if (!user) return null;

  /* ── Calendar data ── */
  const today = new Date();
  const weekDays = Array.from({ length: 181 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90 + i);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2).toUpperCase(),
      isToday: i === 90,
      month: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      date,
    };
  });

  const currentMonthName = visibleMonth || today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const isToday = selectedDate.toDateString() === today.toDateString();
  const isPastDate = selectedDate < today && !isToday;
  const selectedDateStr = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const selectedDateFormatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  /* ── Filtered data ── */
  const allForDate = tasks.filter(t => {
    const d = t.scheduledDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return d === selectedDateFormatted;
  });

  const realTasks = allForDate.filter(t => t.type !== 'event');
  const events = allForDate.filter(t => t.type === 'event').sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''));
  const activeTasks = realTasks.filter(t => !t.completed);
  const completedCount = realTasks.filter(t => t.completed).length;
  const totalCount = realTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const xpToNextLevel = user.level * user.level * 50;
  const xpProgress = Math.min(100, (user.totalXP / xpToNextLevel) * 100);

  /* ── Displayed slices ── */
  const shownTasks = tasksExpanded ? activeTasks : activeTasks.slice(0, PREVIEW);
  const shownHabits = habitsExpanded ? habits : habits.slice(0, PREVIEW);
  const shownEvents = eventsExpanded ? events : events.slice(0, PREVIEW);

  return (
    <div className="space-y-4 pb-28">

      {/* ── Calendar ── */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black text-[#8b7ca8] uppercase tracking-wider font-display">{currentMonthName}</span>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className="text-[10px] text-accent-purple font-black uppercase tracking-wider font-display">
              Сегодня
            </button>
          )}
        </div>
        <div ref={calendarRef} className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-1.5 pb-1" style={{ width: 'max-content' }}>
            {weekDays.map((day, i) => {
              const isSelected = selectedDate.toDateString() === day.date.toDateString();
              return (
                <button
                  key={i}
                  data-today={day.isToday}
                  data-selected={isSelected}
                  data-month={day.month}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    'flex flex-col items-center justify-center snap-center py-2.5 rounded-2xl transition-all flex-shrink-0',
                    day.isToday && !isSelected ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                      : isSelected ? 'bg-accent-purple text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                      : 'text-[#8b7ca8] hover:bg-white/5'
                  )}
                  style={{ width: 'calc((100vw - 48px) / 7)' }}
                >
                  <span className="text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">{day.weekday}</span>
                  <span className={cn('text-lg font-black font-display', isSelected && 'glow-purple')}>{day.day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Date heading ── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-black text-white uppercase font-display">
          {isToday ? 'Сегодня' : selectedDateStr}
        </h2>
        {totalCount > 0 && (
          <span className="text-xs text-[#8b7ca8] font-bold font-display">{progressPercent}% выполнено</span>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {([
          { key: 'all',    label: 'Все',       count: activeTasks.length + habits.length + events.length, color: 'bg-accent-purple' },
          { key: 'tasks',  label: 'Задачи',    count: activeTasks.length,  color: 'bg-[#f97316]' },
          { key: 'habits', label: 'Привычки',  count: habits.length,       color: 'bg-[#10b981]' },
          { key: 'events', label: 'События',   count: events.length,       color: 'bg-[#3B82F6]' },
        ] as const).map(({ key, label, count, color }) => {
          const active = sectionFilter === key;
          return (
            <button
              key={key}
              onClick={() => setSectionFilter(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider font-display transition-all flex-shrink-0 border',
                active
                  ? 'bg-accent-purple border-accent-purple text-white'
                  : 'bg-[#150a24]/50 border-white/5 text-[#8b7ca8]'
              )}
            >
              {label}
              <span className={cn(
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center',
                color
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          SECTION: Задачи
      ══════════════════════════════════════════ */}
      {(sectionFilter === 'all' || sectionFilter === 'tasks') && (
        <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="text-base">👑</span>
          <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">Задачи</span>
          {totalCount > 0 && (
            <span className="text-[10px] text-[#8b7ca8] font-display">{completedCount}/{totalCount}</span>
          )}
        </div>

        {activeTasks.length === 0 ? (
          <div className="px-4 pb-4 text-center py-6">
            {isPastDate ? (
              <p className="text-xs text-[#8b7ca8] font-display">Нет активных задач</p>
            ) : (
              <p className="text-xs text-[#8b7ca8] font-display">
                {completedCount > 0 ? `Все ${completedCount} задач выполнено ✅` : 'Зажми иконку задач в навигации'}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              <AnimatePresence>
                {shownTasks.map(task => (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => toggleTask(task)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      task.completed ? 'bg-accent-purple border-accent-purple' : 'border-white/20 bg-transparent'
                    )}>
                      {task.completed && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* Title + stat */}
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-sm font-semibold text-white font-display truncate', task.completed && 'line-through opacity-40')}>
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

            {activeTasks.length > PREVIEW && (
              <button
                onClick={() => setTasksExpanded(!tasksExpanded)}
                className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
              >
                {tasksExpanded ? 'Свернуть' : `Показать все задачи`}
                <ChevronDown size={13} className={cn('transition-transform', tasksExpanded && 'rotate-180')} />
              </button>
            )}
          </>
        )}
      </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION: Привычки (only today)
      ══════════════════════════════════════════ */}
      {isToday && (sectionFilter === 'all' || sectionFilter === 'habits') && (
        <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <Flame size={16} className="text-accent-purple" />
            <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">Привычки</span>
            {habits.length > 0 && (
              <span className="text-[10px] text-[#8b7ca8] font-display">
                {habits.filter(h => iCompletedToday(h)).length}/{habits.length}
              </span>
            )}
          </div>

          {habits.length === 0 ? (
            <div className="px-4 pb-4 text-center py-6">
              <p className="text-xs text-[#8b7ca8] font-display">Зажми иконку привычек в навигации</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {shownHabits.map(habit => {
                  const done = iCompletedToday(habit);
                  const disabled = done || processingHabit === habit.id;
                  return (
                    <div key={habit.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Complete button */}
                      <button
                        onClick={() => completeHabit(habit)}
                        disabled={disabled}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          done ? 'bg-[#10b981] border-[#10b981]' : 'border-white/20 bg-transparent active:scale-90'
                        )}
                      >
                        {done && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                      </button>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-semibold text-white font-display truncate', done && 'opacity-50')}>
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

              {habits.length > PREVIEW && (
                <button
                  onClick={() => setHabitsExpanded(!habitsExpanded)}
                  className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
                >
                  {habitsExpanded ? 'Свернуть' : 'Показать все привычки'}
                  <ChevronDown size={13} className={cn('transition-transform', habitsExpanded && 'rotate-180')} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION: События
      ══════════════════════════════════════════ */}
      {(events.length > 0 || !isPastDate) && (sectionFilter === 'all' || sectionFilter === 'events') && (
        <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <CalendarDays size={16} className="text-[#3B82F6]" />
            <span className="text-sm font-black text-white uppercase tracking-wider font-display flex-1">
              {isToday ? 'Сегодняшние события' : 'События'}
            </span>
            {events.length > 0 && (
              <span className="text-[10px] text-[#8b7ca8] font-display">{events.length}</span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="px-4 pb-4 text-center py-6">
              <p className="text-xs text-[#8b7ca8] font-display">Нет событий</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {shownEvents.map(event => (
                  <div key={event.id} className="flex items-stretch gap-0 px-4 py-3">
                    {/* Time block */}
                    <div className="flex flex-col items-center justify-center w-14 flex-shrink-0 mr-3">
                      {event.eventTime ? (
                        <span className="text-sm font-black text-[#3B82F6] font-display leading-tight">{event.eventTime}</span>
                      ) : (
                        <span className="text-[10px] text-[#8b7ca8] font-display">Весь день</span>
                      )}
                    </div>

                    {/* Vertical line */}
                    <div className="w-0.5 bg-[#3B82F6]/30 rounded-full mr-3 flex-shrink-0" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white font-display truncate">{event.title}</div>
                      <div className="text-[10px] text-[#3B82F6] font-display mt-0.5">Событие</div>
                    </div>

                    {/* Dot */}
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
                  </div>
                ))}
              </div>

              {events.length > PREVIEW && (
                <button
                  onClick={() => setEventsExpanded(!eventsExpanded)}
                  className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8b7ca8] font-display border-t border-white/5 hover:text-white transition-colors"
                >
                  {eventsExpanded ? 'Свернуть' : 'Показать все события'}
                  <ChevronDown size={13} className={cn('transition-transform', eventsExpanded && 'rotate-180')} />
                </button>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
};
