/**
 * useInviteLink Hook
 * Handles invite link processing
 */

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { spaceService } from '@/domain/services/SpaceService';
import { userRepository } from '@/domain/repositories/UserRepository';

interface InviteInfo {
  spaceName: string;
  spaceId: string;
}

interface UseInviteLinkReturn {
  inviteInfo: InviteInfo | null;
  isProcessing: boolean;
  error: string | null;
  acceptInvite: () => Promise<void>;
}

export function useInviteLink(userId: string | undefined): UseInviteLinkReturn {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for invite link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    
    if (token) {
      setInviteToken(token);
      
      // Load invite info
      getDoc(doc(db, 'inviteLinks', token))
        .then((snap) => {
          if (snap.exists() && !snap.data().used) {
            setInviteInfo({
              spaceName: snap.data().spaceName,
              spaceId: snap.data().spaceId
            });
          }
        })
        .catch((err) => {
          console.error('Error loading invite info:', err);
          setError('Failed to load invite information');
        });
    }
  }, []);

  const acceptInvite = async () => {
    if (!inviteToken || !userId || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get user info
      const user = await userRepository.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Accept the invite
      const { spaceId, spaceName } = await spaceService.acceptInviteLink(
        inviteToken,
        userId,
        user.email,
        user.displayName
      );

      // Switch to the new space
      await userRepository.updateCurrentSpace(userId, spaceId);

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setInviteToken(null);
      setInviteInfo(null);

      return;
    } catch (err) {
      console.error('Error accepting invite:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invite';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    inviteInfo,
    isProcessing,
    error,
    acceptInvite,
  };
}
