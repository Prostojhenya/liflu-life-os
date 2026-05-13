/**
 * useDashboardData Hook
 * Manages dashboard data fetching and state
 */

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
} from 'firebase/firestore';
import { useStore, XP_VALUES, calculateLevel } from '@/store/useStore';

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

interface SpaceMember {
  userId: string;
  displayName: string;
  photoURL?: string;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function useDashboardData() {
  const { user, setUser, setTodayProgress } = useStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, DayCompletion[]>>({});
  const [isSharedSpace, setIsSharedSpace] = useState(false);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [processingHabit, setProcessingHabit] = useState<string | null>(null);

  // Subscribe to tasks
  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/tasks`),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) =>
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)))
    );
  }, [user?.currentSpaceId]);

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

  // Subscribe to habits
  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/habits`),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) =>
      setHabits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Habit)))
    );
  }, [user?.currentSpaceId]);

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
        console.error(e);
      }
    })();
  }, [user?.currentSpaceId]);

  // Subscribe to habit completions (shared spaces)
  useEffect(() => {
    if (!user?.currentSpaceId || !isSharedSpace || habits.length === 0) return;

    const today = todayKey();
    const unsubs = habits.map((habit) => {
      const q = collection(
        db,
        `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`
      );

      return onSnapshot(q, (snap) => {
        const todayC = snap.docs
          .filter((d) => d.id.startsWith(today))
          .map((d) => d.data() as DayCompletion);

        setCompletions((prev) => ({ ...prev, [habit.id]: todayC }));
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [user?.currentSpaceId, isSharedSpace, habits.length]);

  // Toggle task
  const toggleTask = async (task: Task) => {
    if (!user?.currentSpaceId || task.type === 'event') return;

    const path = `spaces/${user.currentSpaceId}/tasks/${task.id}`;

    try {
      const taskRef = doc(db, path);
      const newCompleted = !task.completed;
      await updateDoc(taskRef, { completed: newCompleted });

      // Send notification to other members
      if (newCompleted && isSharedSpace && members.length > 0) {
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

      // Award XP
      if (newCompleted && !task.xpAwarded) {
        const newXP = user.totalXP + task.xpValue;
        const newLevel = calculateLevel(newXP);
        const newStats = {
          ...user.stats,
          [task.statType]: (user.stats[task.statType] || 0) + 1,
        };

        await updateDoc(doc(db, 'users', user.uid), {
          totalXP: newXP,
          level: newLevel,
          stats: newStats,
        });
        await updateDoc(taskRef, { xpAwarded: true });

        setUser({ ...user, totalXP: newXP, level: newLevel, stats: newStats });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  // Complete habit
  const completeHabit = async (habit: Habit) => {
    if (!user?.currentSpaceId || iCompletedToday(habit) || processingHabit === habit.id)
      return;

    setProcessingHabit(habit.id);
    const habitRef = doc(db, `spaces/${user.currentSpaceId}/habits`, habit.id);

    try {
      if (isSharedSpace) {
        const today = todayKey();
        await setDoc(
          doc(
            db,
            `spaces/${user.currentSpaceId}/habits/${habit.id}/completions`,
            `${today}_${user.uid}`
          ),
          {
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL || '',
            completedAt: serverTimestamp(),
          }
        );

        const newC = [
          ...(completions[habit.id] || []),
          {
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            completedAt: null,
          },
        ];

        // Send notifications
        const otherMembers = members.filter((m) => m.userId !== user.uid);
        for (const member of otherMembers) {
          try {
            await addDoc(collection(db, `users/${member.userId}/notifications`), {
              title: '🔥 Привычка выполнена',
              body: `${user.displayName} выполнил привычку: ${habit.title}`,
              type: 'habit_reminder',
              read: false,
              createdAt: serverTimestamp(),
              data: { habitId: habit.id, spaceId: user.currentSpaceId, actorId: user.uid },
            });
          } catch (e) {
            console.error('Error sending habit completion notification:', e);
          }
        }

        // Check if all members completed
        if (newC.length >= members.length) {
          await updateDoc(habitRef, {
            streak: habit.streak + 1,
            lastCompleted: serverTimestamp(),
          });

          // Send achievement notification
          for (const member of members) {
            try {
              await addDoc(collection(db, `users/${member.userId}/notifications`), {
                title: '🎉 Все выполнили!',
                body: `Все участники выполнили привычку: ${habit.title}`,
                type: 'achievement',
                read: false,
                createdAt: serverTimestamp(),
                data: { habitId: habit.id, spaceId: user.currentSpaceId },
              });
            } catch (e) {
              console.error('Error sending streak notification:', e);
            }
          }
        }
      } else {
        await updateDoc(habitRef, {
          streak: habit.streak + 1,
          lastCompleted: serverTimestamp(),
        });
      }

      // Award XP
      const newXP = (user.totalXP || 0) + XP_VALUES.HABIT;
      const stat = habit.statType || 'vitality';
      const newStats = { ...user.stats, [stat]: (user.stats[stat] || 0) + 1 };

      await updateDoc(doc(db, 'users', user.uid), {
        totalXP: newXP,
        level: calculateLevel(newXP),
        stats: newStats,
      });

      setUser({ ...user, totalXP: newXP, level: calculateLevel(newXP), stats: newStats });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingHabit(null);
    }
  };

  // Habit helpers
  const isCompletedToday = (habit: Habit) => {
    if (isSharedSpace)
      return members.length > 0 && (completions[habit.id] || []).length >= members.length;

    if (!habit.lastCompleted) return false;

    const d = habit.lastCompleted.toDate
      ? habit.lastCompleted.toDate()
      : new Date(habit.lastCompleted);
    const t = new Date();

    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth() &&
      d.getFullYear() === t.getFullYear()
    );
  };

  const iCompletedToday = (habit: Habit) => {
    if (!isSharedSpace) return isCompletedToday(habit);
    return (completions[habit.id] || []).some((c) => c.userId === user?.uid);
  };

  return {
    tasks,
    habits,
    isSharedSpace,
    members,
    processingHabit,
    toggleTask,
    completeHabit,
    isCompletedToday,
    iCompletedToday,
  };
}
