/**
 * useTasksQuery Hook
 * React Query hooks for tasks data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { userRepository } from '@/domain/repositories/UserRepository';
import { calculateLevel } from '@/domain/models/User';

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

/**
 * Fetch tasks for a space
 */
export function useTasksQuery(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.list(spaceId || ''),
    queryFn: async () => {
      if (!spaceId) return [];

      const q = query(collection(db, `spaces/${spaceId}/tasks`), orderBy('createdAt', 'desc'));

      // Note: For real-time updates, we'd use onSnapshot
      // For now, using getDocs for React Query compatibility
      const snapshot = await import('firebase/firestore').then((mod) =>
        mod.getDocs(q)
      );

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    },
    enabled: !!spaceId,
    staleTime: 1000 * 30, // 30 seconds (tasks change frequently)
  });
}

/**
 * Toggle task completion mutation
 */
export function useToggleTaskMutation(
  spaceId: string,
  userId: string,
  userXP: number,
  userStats: any
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task) => {
      if (task.type === 'event') return;

      const taskRef = doc(db, `spaces/${spaceId}/tasks/${task.id}`);
      const newCompleted = !task.completed;

      await updateDoc(taskRef, { completed: newCompleted });

      // Award XP if completing and not already awarded
      if (newCompleted && !task.xpAwarded) {
        const newXP = userXP + task.xpValue;
        const newLevel = calculateLevel(newXP);
        const newStats = {
          ...userStats,
          [task.statType]: (userStats[task.statType] || 0) + 1,
        };

        await updateDoc(doc(db, 'users', userId), {
          totalXP: newXP,
          level: newLevel,
          stats: newStats,
        });

        await updateDoc(taskRef, { xpAwarded: true });

        return { newXP, newLevel, newStats };
      }

      return null;
    },

    // Optimistic update
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(spaceId) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.list(spaceId));

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks.list(spaceId),
          previousTasks.map((t) =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
          )
        );
      }

      return { previousTasks };
    },

    onError: (err, task, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(spaceId), context.previousTasks);
      }
    },

    onSuccess: (result) => {
      invalidateQueries.tasks(spaceId);
      if (result) {
        invalidateQueries.user(userId);
      }
    },
  });
}

/**
 * Create task mutation
 */
export function useCreateTaskMutation(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const taskRef = await addDoc(collection(db, `spaces/${spaceId}/tasks`), {
        ...taskData,
        completed: false,
        xpAwarded: false,
        createdAt: serverTimestamp(),
      });

      return taskRef.id;
    },

    onSuccess: () => {
      invalidateQueries.tasks(spaceId);
    },
  });
}

/**
 * Delete task mutation
 */
export function useDeleteTaskMutation(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteDoc(doc(db, `spaces/${spaceId}/tasks/${taskId}`));
    },

    // Optimistic update
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(spaceId) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.list(spaceId));

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks.list(spaceId),
          previousTasks.filter((t) => t.id !== taskId)
        );
      }

      return { previousTasks };
    },

    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(spaceId), context.previousTasks);
      }
    },

    onSuccess: () => {
      invalidateQueries.tasks(spaceId);
    },
  });
}
