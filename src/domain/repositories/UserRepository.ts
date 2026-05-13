/**
 * User Repository
 * Handles all Firebase operations related to users
 */

import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { UserProfile, INITIAL_STATS, calculateLevel } from '../models/User';

export class UserRepository {
  private readonly collectionName = 'users';

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, this.collectionName, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      return this.mapToUserProfile(userId, userSnap.data());
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  /**
   * Create a new user
   */
  async create(userData: Omit<UserProfile, 'level'>): Promise<UserProfile> {
    try {
      const userRef = doc(db, this.collectionName, userData.uid);
      
      const userToCreate = {
        ...userData,
        stats: userData.stats || INITIAL_STATS,
        totalXP: userData.totalXP || 0,
      };

      await setDoc(userRef, userToCreate);

      return {
        ...userToCreate,
        level: calculateLevel(userToCreate.totalXP),
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user data
   */
  async update(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, userId);
      
      // Remove level from updates as it's calculated
      const { level, ...updateData } = updates;
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user's current space
   */
  async updateCurrentSpace(userId: string, spaceId: string): Promise<void> {
    try {
      await this.update(userId, { currentSpaceId: spaceId });
    } catch (error) {
      console.error('Error updating current space:', error);
      throw new Error('Failed to update current space');
    }
  }

  /**
   * Add XP to user
   */
  async addXP(userId: string, xpAmount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
    try {
      const user = await this.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const oldLevel = user.level;
      const newXP = user.totalXP + xpAmount;
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > oldLevel;

      await this.update(userId, { totalXP: newXP });

      return { newXP, newLevel, leveledUp };
    } catch (error) {
      console.error('Error adding XP:', error);
      throw new Error('Failed to add XP');
    }
  }

  /**
   * Map Firestore document to UserProfile
   */
  private mapToUserProfile(userId: string, data: DocumentData): UserProfile {
    return {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || 'User',
      photoURL: data.photoURL || '',
      totalXP: data.totalXP || 0,
      level: calculateLevel(data.totalXP || 0),
      currentSpaceId: data.currentSpaceId || null,
      stats: data.stats || INITIAL_STATS,
      avatarSeed: data.avatarSeed,
    };
  }
}

// Singleton instance
export const userRepository = new UserRepository();
