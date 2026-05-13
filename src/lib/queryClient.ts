/**
 * React Query Configuration
 * Centralized query client setup with optimized defaults
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time: how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 1,

      // Refetch on window focus
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query keys for consistency and type safety
 */
export const queryKeys = {
  // Auth
  auth: {
    user: (userId: string) => ['auth', 'user', userId] as const,
  },

  // Spaces
  spaces: {
    all: ['spaces'] as const,
    list: (userId: string) => ['spaces', 'list', userId] as const,
    detail: (spaceId: string) => ['spaces', 'detail', spaceId] as const,
    members: (spaceId: string) => ['spaces', 'members', spaceId] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (spaceId: string) => ['tasks', 'list', spaceId] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    byDate: (spaceId: string, date: string) => ['tasks', 'byDate', spaceId, date] as const,
  },

  // Habits
  habits: {
    all: ['habits'] as const,
    list: (spaceId: string) => ['habits', 'list', spaceId] as const,
    detail: (habitId: string) => ['habits', 'detail', habitId] as const,
    completions: (habitId: string, date: string) => ['habits', 'completions', habitId, date] as const,
  },

  // Goals
  goals: {
    all: ['goals'] as const,
    list: (spaceId: string) => ['goals', 'list', spaceId] as const,
    detail: (goalId: string) => ['goals', 'detail', goalId] as const,
  },

  // Invites
  invites: {
    all: ['invites'] as const,
    list: (userEmail: string) => ['invites', 'list', userEmail] as const,
    link: (tokenId: string) => ['invites', 'link', tokenId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', 'list', userId] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
  },
} as const;

/**
 * Invalidation helpers
 * Common patterns for invalidating related queries
 */
export const invalidateQueries = {
  /**
   * Invalidate all space-related queries
   */
  spaces: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.spaces.list(userId) });
  },

  /**
   * Invalidate all task-related queries for a space
   */
  tasks: (spaceId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(spaceId) });
  },

  /**
   * Invalidate all habit-related queries for a space
   */
  habits: (spaceId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(spaceId) });
  },

  /**
   * Invalidate user data
   */
  user: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.user(userId) });
  },

  /**
   * Invalidate all queries (use sparingly)
   */
  all: () => {
    queryClient.invalidateQueries();
  },
};
