/**
 * useSpaceMembers Hook
 * Manages space member operations
 */

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { spaceService } from '@/domain/services/SpaceService';
import { SpaceMember } from '@/domain/models/Space';

interface UseSpaceMembersReturn {
  members: SpaceMember[];
  isLoading: boolean;
  error: string | null;
  inviteMemberByEmail: (email: string) => Promise<void>;
  generateInviteLink: () => Promise<string>;
  removeMember: (memberUserId: string) => Promise<void>;
}

export function useSpaceMembers(
  spaceId: string | null,
  userId: string | undefined,
  spaceName?: string,
  userName?: string
): UseSpaceMembersReturn {
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to members
  useEffect(() => {
    if (!spaceId) {
      setMembers([]);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, `spaces/${spaceId}/members`),
      (snapshot) => {
        const memberData = snapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId || '',
          email: doc.data().email || '',
          displayName: doc.data().displayName || 'User',
          role: doc.data().role || 'member',
          spaceOwnerId: doc.data().spaceOwnerId || '',
          joinedAt: doc.data().joinedAt?.toDate() || null,
        } as SpaceMember));
        
        setMembers(memberData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading members:', error);
        setError('Failed to load members');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [spaceId]);

  const inviteMemberByEmail = async (email: string): Promise<void> => {
    if (!spaceId || !userId) {
      throw new Error('Space or user not available');
    }

    try {
      setError(null);
      await spaceService.inviteMemberByEmail(
        spaceId,
        userId,
        email,
        spaceName || 'Space',
        userName || 'User'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generateInviteLink = async (): Promise<string> => {
    if (!spaceId || !userId) {
      throw new Error('Space or user not available');
    }

    try {
      setError(null);
      return await spaceService.generateInviteLink(spaceId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate invite link';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeMember = async (memberUserId: string): Promise<void> => {
    if (!spaceId || !userId) {
      throw new Error('Space or user not available');
    }

    try {
      setError(null);
      await spaceService.removeMember(spaceId, userId, memberUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    members,
    isLoading,
    error,
    inviteMemberByEmail,
    generateInviteLink,
    removeMember,
  };
}
