/**
 * Auth Service
 * Handles authentication and user initialization
 */

import { auth, googleProvider } from '@/firebase';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { userRepository } from '../repositories/UserRepository';
import { spaceRepository } from '../repositories/SpaceRepository';
import { UserProfile, INITIAL_STATS, calculateLevel } from '../models/User';

export class AuthService {
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Initialize or get existing user
   */
  async initializeUser(firebaseUser: FirebaseUser): Promise<UserProfile> {
    try {
      // Try to get existing user
      let user = await userRepository.getById(firebaseUser.uid);

      if (user) {
        return user;
      }

      // New user - create personal space and user profile
      const personalSpaceId = await spaceRepository.create(
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName || 'User',
        'Personal Space',
        'personal'
      );

      // Create user profile
      user = await userRepository.create({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || '',
        totalXP: 0,
        currentSpaceId: personalSpaceId,
        stats: INITIAL_STATS,
      });

      return user;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw new Error('Failed to initialize user');
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.initializeUser(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

// Singleton instance
export const authService = new AuthService();
