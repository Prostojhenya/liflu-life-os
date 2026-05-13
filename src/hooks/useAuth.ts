/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useState, useEffect } from 'react';
import { authService } from '@/domain/services/AuthService';
import { UserProfile } from '@/domain/models/User';
import { initMessaging } from '@/firebase';

interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);

      // Initialize messaging when user logs in
      if (user) {
        initMessaging().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
  };
}
