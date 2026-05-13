/**
 * useInvites Hook
 * Manages space invites for a user
 */

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { SpaceInvite } from '@/domain/models/Space';
import { spaceRepository } from '@/domain/repositories/SpaceRepository';
import { userRepository } from '@/domain/repositories/UserRepository';

interface UseInvitesReturn {
  invites: SpaceInvite[];
  isLoading: boolean;
  error: string | null;
  acceptInvite: (invite: SpaceInvite) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
}

export function useInvites(userEmail: string | undefined): UseInvitesReturn {
  const [invites, setInvites] = useState<SpaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to invites
  useEffect(() => {
    if (!userEmail) {
      setInvites([]);
      setIsLoading(false);
      return;
    }

    const invitesQuery = query(
      collection(db, 'invites'),
      where('email', '==', userEmail),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      invitesQuery,
      (snapshot) => {
        const inviteData = snapshot.docs.map((doc) => ({
          id: doc.id,
          spaceId: doc.data().spaceId || '',
          spaceName: doc.data().spaceName || '',
          email: doc.data().email || '',
          invitedBy: doc.data().invitedBy || '',
          inviterName: doc.data().inviterName,
          status: doc.data().status || 'pending',
          createdAt: doc.data().createdAt?.toDate() || null,
        } as SpaceInvite));

        setInvites(inviteData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading invites:', error);
        setError('Failed to load invites');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userEmail]);

  const acceptInvite = async (invite: SpaceInvite): Promise<void> => {
    try {
      setError(null);

      // Get user info
      const user = await userRepository.getById(invite.invitedBy);
      if (!user) {
        throw new Error('User not found');
      }

      // Add member to space
      await spaceRepository.addMember(
        invite.spaceId,
        user.uid,
        invite.email,
        user.displayName,
        'member',
        invite.invitedBy
      );

      // Update invite status
      await updateDoc(doc(db, 'invites', invite.id), {
        status: 'accepted',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invite';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const rejectInvite = async (inviteId: string): Promise<void> => {
    try {
      setError(null);
      await updateDoc(doc(db, 'invites', inviteId), {
        status: 'rejected',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject invite';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    invites,
    isLoading,
    error,
    acceptInvite,
    rejectInvite,
  };
}
