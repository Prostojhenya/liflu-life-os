/**
 * useHabitsQuery Hook
 * React Query hooks for habits data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { calculateLevel } from '@/domain/models/User';

interface Habit {
  id: string;
  title: string;
  streak: number;
  xpValue: number;
  spaceId: string;
  lastCompleted?: any;
  statType?: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
  createdAt: any;
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

/**
 * Fetch habits for a space
 */
export function useHabitsQuery(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.habits.list(spaceId || ''),
    queryFn: async () => {
      if (!spaceId) return [];

      const q = query(
        collection(db, `spaces/${spaceId}/habits`),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Habit[];
    },
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 2, // 2 minutes (habits change less frequently than tasks)
  });
}

/**
 * Fetch habit completions for today (shared spaces)
 */
export function useHabitCompletionsQuery(
  spaceId: string | undefined,
  habitId: string | undefined,
  isSharedSpace: boolean
) {
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return useQuery({
    queryKey: queryKeys.habits.completions(habitId || '', todayKey()),
    queryFn: async () => {
      if (!spaceId || !habitId) return [];

      const snapshot = await getDocs(
        collection(db, `spaces/${spaceId}/habits/${habitId}/completions`)
      );

      const today = todayKey();
      return snapshot.docs
        .filter((d) => d.id.startsWith(today))
        .map((d) => d.data() as DayCompletion);
    },
    enabled: !!spaceId && !!habitId && isSharedSpace,
    staleTime: 1000 * 30, // 30 seconds (completions change frequently)
  });
}

/**
 * Complete habit mutation
 */
export function useCompleteHabitMutation(
  spaceId: string,
  userId: string,
  userXP: number,
  userStats: any,
  isSharedSpace: boolean,
  members: SpaceMember[]
) {
  const queryClient = useQueryClient();

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return useMutation({
    mutationFn: async ({
      habit,
      userDisplayName,
      userPhotoURL,
    }: {
      habit: Habit;
      userDisplayName: string;
      userPhotoURL?: string;
    }) => {
      const habitRef = doc(db, `spaces/${spaceId}/habits`, habit.id);

      if (isSharedSpace) {
        const today = todayKey();
        
        // Add completion for current user
        await setDoc(
          doc(
            db,
            `spaces/${spaceId}/habits/${habit.id}/completions`,
            `${today}_${userId}`
          ),
          {
            userId,
            displayName: userDisplayName,
            photoURL: userPhotoURL || '',
            completedAt: serverTimestamp(),
          }
        );

        // Get current completions
        const completionsSnap = await getDocs(
          collection(db, `spaces/${spaceId}/habits/${habit.id}/completions`)
        );
        const todayCompletions = completionsSnap.docs.filter((d) =>
          d.id.startsWith(today)
        );

        // Send notifications to other members
        const otherMembers = members.filter((m) => m.userId !== userId);
        for (const member of otherMembers) {
          try {
            await addDoc(collection(db, `users/${member.userId}/notifications`), {
              title: '🔥 Привычка выполнена',
              body: `${userDisplayName} выполнил привычку: ${habit.title}`,
              type: 'habit_reminder',
              read: false,
              createdAt: serverTimestamp(),
              data: { habitId: habit.id, spaceId, actorId: userId },
            });
          } catch (e) {
            console.error('Error sending habit completion notification:', e);
          }
        }

        // Check if all members completed
        if (todayCompletions.length >= members.length) {
          await updateDoc(habitRef, {
            streak: habit.streak + 1,
            lastCompleted: serverTimestamp(),
          });

          // Send achievement notification to all members
          for (const member of members) {
            try {
              await addDoc(collection(db, `users/${member.userId}/notifications`), {
                title: '🎉 Все выполнили!',
                body: `Все участники выполнили привычку: ${habit.title}`,
                type: 'achievement',
                read: false,
                createdAt: serverTimestamp(),
                data: { habitId: habit.id, spaceId },
              });
            } catch (e) {
              console.error('Error sending streak notification:', e);
            }
          }
        }
      } else {
        // Personal space - just update streak
        await updateDoc(habitRef, {
          streak: habit.streak + 1,
          lastCompleted: serverTimestamp(),
        });
      }

      // Award XP
      const XP_VALUES = { HABIT: 20 };
      const newXP = userXP + XP_VALUES.HABIT;
      const newLevel = calculateLevel(newXP);
      const stat = habit.statType || 'vitality';
      const newStats = {
        ...userStats,
        [stat]: (userStats[stat] || 0) + 1,
      };

      await updateDoc(doc(db, 'users', userId), {
        totalXP: newXP,
        level: newLevel,
        stats: newStats,
      });

      return { newXP, newLevel, newStats };
    },

    onSuccess: (result, { habit }) => {
      // Invalidate habits list
      invalidateQueries.habits(spaceId);
      
      // Invalidate user data
      invalidateQueries.user(userId);

      // Invalidate completions for this habit
      const today = todayKey();
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits.completions(habit.id, today),
      });
    },
  });
}

/**
 * Create habit mutation
 */
export function useCreateHabitMutation(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitData: Partial<Habit>) => {
      const habitRef = await addDoc(collection(db, `spaces/${spaceId}/habits`), {
        ...habitData,
        streak: 0,
        createdAt: serverTimestamp(),
      });

      return habitRef.id;
    },

    onSuccess: () => {
      invalidateQueries.habits(spaceId);
    },
  });
}

/**
 * Delete habit mutation
 */
export function useDeleteHabitMutation(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await deleteDoc(doc(db, `spaces/${spaceId}/habits/${habitId}`));
    },

    // Optimistic update
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(spaceId) });

      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits.list(spaceId)
      );

      if (previousHabits) {
        queryClient.setQueryData<Habit[]>(
          queryKeys.habits.list(spaceId),
          previousHabits.filter((h) => h.id !== habitId)
        );
      }

      return { previousHabits };
    },

    onError: (err, habitId, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(spaceId), context.previousHabits);
      }
    },

    onSuccess: () => {
      invalidateQueries.habits(spaceId);
    },
  });
}

/**
 * Helper: Check if habit is completed today (personal space)
 */
export function isHabitCompletedToday(habit: Habit): boolean {
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
}

/**
 * Helper: Check if current user completed habit today (shared space)
 */
export function hasUserCompletedHabitToday(
  completions: DayCompletion[],
  userId: string
): boolean {
  return completions.some((c) => c.userId === userId);
}
