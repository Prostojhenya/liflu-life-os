/**
 * useSpaces Hook
 * Manages space operations and state
 */

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { spaceService } from '@/domain/services/SpaceService';
import { Space, SpaceMember, SpaceType } from '@/domain/models/Space';

interface UseSpacesReturn {
  spaces: Space[];
  isLoading: boolean;
  error: string | null;
  createSpace: (name: string, type: SpaceType) => Promise<string>;
  switchSpace: (spaceId: string) => Promise<void>;
  renameSpace: (spaceId: string, newName: string) => Promise<void>;
  deleteSpace: (spaceId: string) => Promise<void>;
  refreshSpaces: () => Promise<void>;
}

export function useSpaces(userId: string | undefined): UseSpacesReturn {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load spaces
  const loadSpaces = async () => {
    if (!userId) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const userSpaces = await spaceService.getUserSpaces(userId);
      setSpaces(userSpaces);
    } catch (err) {
      console.error('Error loading spaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to space changes
  useEffect(() => {
    if (!userId) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    loadSpaces();

    const q = query(
      collection(db, 'spaces'),
      where('memberIds', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      () => {
        loadSpaces();
      },
      (error) => {
        console.error('Error in spaces subscription:', error);
        setError('Failed to sync spaces');
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const createSpace = async (name: string, type: SpaceType): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      // Get user info from current spaces (assuming at least one exists)
      const currentUser = spaces[0]; // This is a workaround, ideally we'd have user context
      
      const spaceId = await spaceService.createSpace(
        userId,
        '', // email - should come from user context
        'User', // displayName - should come from user context
        name,
        type
      );

      await loadSpaces();
      return spaceId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create space';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const switchSpace = async (spaceId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await spaceService.switchSpace(userId, spaceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch space';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const renameSpace = async (spaceId: string, newName: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await spaceService.renameSpace(spaceId, userId, newName);
      await loadSpaces();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename space';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteSpace = async (spaceId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await spaceService.deleteSpace(spaceId, userId, spaces);
      await loadSpaces();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete space';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    spaces,
    isLoading,
    error,
    createSpace,
    switchSpace,
    renameSpace,
    deleteSpace,
    refreshSpaces: loadSpaces,
  };
}
