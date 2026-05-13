/**
 * Dashboard Component (React Query Version)
 * Main dashboard view with calendar, tasks, habits, and events
 * Migrated to use React Query hooks for data fetching
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTasksQuery, useToggleTaskMutation } from '@/hooks/queries/useTasksQuery';
import {
  useHabitsQuery,
  useCompleteHabitMutation,
  isHabitCompletedToday,
  hasUserCompletedHabitToday,
} from '@/hooks/queries/useHabitsQuery';
import { db } from '@/firebase';
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar } from './Calendar';
import { FilterBar, FilterType } from './FilterBar';
import { TasksSection } from './TasksSection';
import { HabitsSection } from './HabitsSection';
import { EventsSection } from './EventsSection';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface SpaceMember {
  userId: string;
  displayName: string;
  photoURL?: string;
}

export function Dashboard() {
  const { user, selectedDate, setSelectedDate, setTodayProgress } = useStore();
  const [sectionFilter, setSectionFilter] = useState<FilterType>('all');
  const [isSharedSpace, setIsSharedSpace] = useState(false);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, any[]>>({});
  const [processingHabit, setProcessingHabit] = useState<string | null>(null);

  // React Query hooks
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery(user?.currentSpaceId);
  const { data: habits = [], isLoading: habitsLoading } = useHabitsQuery(user?.currentSpaceId);

  const toggleTaskMutation = useToggleTaskMutation(
    user?.currentSpaceId || '',
    user?.uid || '',
    user?.totalXP || 0,
    user?.stats || {}
  );

  const completeHabitMutation = useCompleteHabitMutation(
    user?.currentSpaceId || '',
    user?.uid || '',
    user?.totalXP || 0,
    user?.stats || {},
    isSharedSpace,
    members
  );

  // Load space type and members
  useEffect(() => {
    if (!user?.currentSpaceId) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'spaces', user.currentSpaceId!));
        if (!snap.exists()) return;

        const shared = snap.data().type === 'shared';
        setIsSharedSpace(shared);

        if (shared) {
          const mSnap = await getDocs(
            collection(db, `spaces/${user.currentSpaceId}/members`)
          );
          setMembers(
            mSnap.docs.map((d) => ({
              userId: d.data().userId,
              displayName: d.data().displayName || 'Участник',
              photoURL: d.data().photoURL || '',
            }))
          );
        }
      } catch (e) {
        console.error('Error loading space info:', e);
      }
    })();
  }, [user?.currentSpaceId]);

  // Load habit completions for shared spaces
  useEffect(() => {
    if (!user?.currentSpaceId || !isSharedSpace || habits.length === 0) return;

    const today = todayKey();

    (async () => {
      const completionsMap: Record<string, any[]> = {};

      for (const habit of habits) {
        try {
          const snap = await getDocs(
            collection(db, `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`)
          );

          const todayCompletions = snap.docs
            .filter((d) => d.id.startsWith(today))
            .map((d) => d.data());

          completionsMap[habit.id] = todayCompletions;
        } catch (e) {
          console.error(`Error loading completions for habit ${habit.id}:`, e);
        }
      }

      setHabitCompletions(completionsMap);
    })();
  }, [user?.currentSpaceId, isSharedSpace, habits.length]);

  // Update today's progress
  useEffect(() => {
    const todayStr = todayKey();
    const todayTasks = tasks.filter((t) => {
      const td = t.scheduledDate || todayStr;
      return td === todayStr && t.type !== 'event';
    });

    setTodayProgress({
      done: todayTasks.filter((t) => t.completed).length,
      total: todayTasks.length,
    });
  }, [tasks, setTodayProgress]);

  if (!user) return null;

  // Date calculations
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const isPastDate = selectedDate < today && !isToday;
  const selectedDateStr = selectedDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
  const selectedDateFormatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  // Filter tasks for selected date
  const allForDate = tasks.filter((t) => {
    const d = t.scheduledDate || todayKey();
    return d === selectedDateFormatted;
  });

  const realTasks = allForDate.filter((t) => t.type !== 'event');
  const events = allForDate
    .filter((t) => t.type === 'event')
    .sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''));

  const activeTasks = realTasks.filter((t) => !t.completed);
  const completedCount = realTasks.filter((t) => t.completed).length;
  const totalCount = realTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Habit completion helpers
  const isCompletedTodayFn = (habit: any) => {
    if (isSharedSpace) {
      return members.length > 0 && (habitCompletions[habit.id] || []).length >= members.length;
    }
    return isHabitCompletedToday(habit);
  };

  const iCompletedTodayFn = (habit: any) => {
    if (!isSharedSpace) return isCompletedTodayFn(habit);
    return hasUserCompletedHabitToday(habitCompletions[habit.id] || [], user.uid);
  };

  const habitsCompletedCount = habits.filter((h) => iCompletedTodayFn(h)).length;

  // Handlers
  const handleToggleTask = async (task: any) => {
    if (task.type === 'event') return;

    try {
      await toggleTaskMutation.mutateAsync(task);

      // Send notification to other members if shared space
      if (!task.completed && isSharedSpace && members.length > 0) {
        const otherMembers = members.filter((m) => m.userId !== user.uid);
        for (const member of otherMembers) {
          try {
            await addDoc(collection(db, `users/${member.userId}/notifications`), {
              title: '✅ Задача выполнена',
              body: `${user.displayName} завершил задачу: ${task.title}`,
              type: 'task_reminder',
              read: false,
              createdAt: serverTimestamp(),
              data: {
                taskId: task.id,
                spaceId: user.currentSpaceId,
                actorId: user.uid,
              },
            });
          } catch (e) {
            console.error('Error sending task completion notification:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleCompleteHabit = async (habit: any) => {
    if (iCompletedTodayFn(habit) || processingHabit === habit.id) return;

    setProcessingHabit(habit.id);

    try {
      await completeHabitMutation.mutateAsync({
        habit,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL,
      });

      // Update local state
      const { newXP, newLevel, newStats } = completeHabitMutation.data || {};
      if (newXP && newLevel && newStats) {
        useStore.setState({
          user: { ...user, totalXP: newXP, level: newLevel, stats: newStats },
        });
      }
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setProcessingHabit(null);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Calendar */}
      <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Date heading */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-black text-white uppercase font-display">
          {isToday ? 'Сегодня' : selectedDateStr}
        </h2>
        {totalCount > 0 && (
          <span className="text-xs text-[#8b7ca8] font-bold font-display">
            {progressPercent}% выполнено
          </span>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        activeFilter={sectionFilter}
        onFilterChange={setSectionFilter}
        tasksCount={activeTasks.length}
        habitsCount={habits.length}
        eventsCount={events.length}
      />

      {/* Tasks Section */}
      {(sectionFilter === 'all' || sectionFilter === 'tasks') && (
        <TasksSection
          tasks={realTasks}
          completedCount={completedCount}
          totalCount={totalCount}
          isPastDate={isPastDate}
          onToggleTask={handleToggleTask}
        />
      )}

      {/* Habits Section (only today) */}
      {isToday && (sectionFilter === 'all' || sectionFilter === 'habits') && (
        <HabitsSection
          habits={habits}
          completedCount={habitsCompletedCount}
          onCompleteHabit={handleCompleteHabit}
          isHabitCompleted={iCompletedTodayFn}
          processingHabitId={processingHabit}
        />
      )}

      {/* Events Section */}
      {(events.length > 0 || !isPastDate) &&
        (sectionFilter === 'all' || sectionFilter === 'events') && (
          <EventsSection events={events} isPastDate={isPastDate} isToday={isToday} />
        )}
    </div>
  );
}
