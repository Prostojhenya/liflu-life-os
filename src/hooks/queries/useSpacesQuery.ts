/**
 * useSpacesQuery Hook
 * React Query hooks for spaces data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceService } from '@/domain/services/SpaceService';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { Space, SpaceType } from '@/domain/models/Space';

/**
 * Fetch user's spaces
 */
export function useSpacesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spaces.list(userId || ''),
    queryFn: () => spaceService.getUserSpaces(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch single space
 */
export function useSpaceQuery(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spaces.detail(spaceId || ''),
    queryFn: () => spaceService.getSpace(spaceId!),
    enabled: !!spaceId,
  });
}

/**
 * Create space mutation
 */
export function useCreateSpaceMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      type,
      email,
      displayName,
    }: {
      name: string;
      type: SpaceType;
      email: string;
      displayName: string;
    }) => spaceService.createSpace(userId, email, displayName, name, type),

    onSuccess: () => {
      // Invalidate spaces list
      invalidateQueries.spaces(userId);
    },
  });
}

/**
 * Switch space mutation
 */
export function useSwitchSpaceMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spaceId: string) => spaceService.switchSpace(userId, spaceId),

    onSuccess: () => {
      // Invalidate user data
      invalidateQueries.user(userId);
    },
  });
}

/**
 * Rename space mutation
 */
export function useRenameSpaceMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, newName }: { spaceId: string; newName: string }) =>
      spaceService.renameSpace(spaceId, userId, newName),

    // Optimistic update
    onMutate: async ({ spaceId, newName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.list(userId) });

      // Snapshot previous value
      const previousSpaces = queryClient.getQueryData<Space[]>(queryKeys.spaces.list(userId));

      // Optimistically update
      if (previousSpaces) {
        queryClient.setQueryData<Space[]>(
          queryKeys.spaces.list(userId),
          previousSpaces.map((space) =>
            space.id === spaceId ? { ...space, name: newName } : space
          )
        );
      }

      return { previousSpaces };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousSpaces) {
        queryClient.setQueryData(queryKeys.spaces.list(userId), context.previousSpaces);
      }
    },

    // Refetch on success
    onSuccess: () => {
      invalidateQueries.spaces(userId);
    },
  });
}

/**
 * Delete space mutation
 */
export function useDeleteSpaceMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, userSpaces }: { spaceId: string; userSpaces: Space[] }) =>
      spaceService.deleteSpace(spaceId, userId, userSpaces),

    onSuccess: () => {
      invalidateQueries.spaces(userId);
    },
  });
}
