/**
 * Space Repository
 * Handles all Firebase operations related to spaces
 */

import { db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { Space, SpaceMember, InviteLink, SpaceType, MemberRole } from '../models/Space';

export class SpaceRepository {
  private readonly collectionName = 'spaces';

  /**
   * Get space by ID
   */
  async getById(spaceId: string): Promise<Space | null> {
    try {
      const spaceRef = doc(db, this.collectionName, spaceId);
      const spaceSnap = await getDoc(spaceRef);

      if (!spaceSnap.exists()) {
        return null;
      }

      return this.mapToSpace(spaceId, spaceSnap.data());
    } catch (error) {
      console.error('Error getting space:', error);
      throw new Error('Failed to get space');
    }
  }

  /**
   * Get all spaces for a user
   */
  async getUserSpaces(userId: string): Promise<Space[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('memberIds', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      const spaces = snapshot.docs.map(doc => this.mapToSpace(doc.id, doc.data()));

      // Get member counts for shared spaces
      const spacesWithCounts = await Promise.all(
        spaces.map(async (space) => {
          if (space.type === 'shared') {
            try {
              const membersSnap = await getDocs(collection(db, `${this.collectionName}/${space.id}/members`));
              return { ...space, memberCount: membersSnap.size };
            } catch {
              return space;
            }
          }
          return space;
        })
      );

      return spacesWithCounts;
    } catch (error) {
      console.error('Error getting user spaces:', error);
      throw new Error('Failed to get user spaces');
    }
  }

  /**
   * Create a new space
   */
  async create(
    userId: string,
    email: string,
    displayName: string,
    spaceName: string,
    spaceType: SpaceType
  ): Promise<string> {
    try {
      const spaceRef = await addDoc(collection(db, this.collectionName), {
        name: spaceName,
        type: spaceType,
        ownerId: userId,
        memberIds: [userId],
        createdAt: serverTimestamp(),
      });

      // Add owner as admin member
      await this.addMember(spaceRef.id, userId, email, displayName, 'admin', userId);

      return spaceRef.id;
    } catch (error) {
      console.error('Error creating space:', error);
      throw new Error('Failed to create space');
    }
  }

  /**
   * Update space name
   */
  async updateName(spaceId: string, name: string): Promise<void> {
    try {
      const spaceRef = doc(db, this.collectionName, spaceId);
      await updateDoc(spaceRef, { name: name.trim() });
    } catch (error) {
      console.error('Error updating space name:', error);
      throw new Error('Failed to update space name');
    }
  }

  /**
   * Delete a space
   */
  async delete(spaceId: string): Promise<void> {
    try {
      // Delete all members
      const membersSnap = await getDocs(collection(db, `${this.collectionName}/${spaceId}/members`));
      await Promise.allSettled(membersSnap.docs.map(m => deleteDoc(m.ref)));

      // Delete the space
      await deleteDoc(doc(db, this.collectionName, spaceId));
    } catch (error) {
      console.error('Error deleting space:', error);
      throw new Error('Failed to delete space');
    }
  }

  /**
   * Get space members
   */
  async getMembers(spaceId: string): Promise<SpaceMember[]> {
    try {
      const membersSnap = await getDocs(collection(db, `${this.collectionName}/${spaceId}/members`));
      return membersSnap.docs.map(doc => this.mapToSpaceMember(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting space members:', error);
      throw new Error('Failed to get space members');
    }
  }

  /**
   * Get specific member
   */
  async getMember(spaceId: string, userId: string): Promise<SpaceMember | null> {
    try {
      const memberRef = doc(db, `${this.collectionName}/${spaceId}/members`, userId);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        return null;
      }

      return this.mapToSpaceMember(userId, memberSnap.data());
    } catch (error) {
      console.error('Error getting space member:', error);
      return null;
    }
  }

  /**
   * Add a member to a space
   */
  async addMember(
    spaceId: string,
    userId: string,
    email: string,
    displayName: string,
    role: MemberRole,
    ownerId: string
  ): Promise<void> {
    try {
      const spaceRef = doc(db, this.collectionName, spaceId);

      // Update memberIds array
      await updateDoc(spaceRef, {
        memberIds: arrayUnion(userId)
      });

      // Add member document
      await setDoc(doc(db, `${this.collectionName}/${spaceId}/members`, userId), {
        userId,
        email,
        displayName,
        role,
        spaceOwnerId: ownerId,
        joinedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding space member:', error);
      throw new Error('Failed to add space member');
    }
  }

  /**
   * Remove a member from a space
   */
  async removeMember(spaceId: string, userId: string): Promise<void> {
    try {
      const spaceRef = doc(db, this.collectionName, spaceId);

      // Remove from memberIds array
      await updateDoc(spaceRef, {
        memberIds: arrayRemove(userId)
      });

      // Delete member document
      await deleteDoc(doc(db, `${this.collectionName}/${spaceId}/members`, userId));
    } catch (error) {
      console.error('Error removing space member:', error);
      throw new Error('Failed to remove space member');
    }
  }

  /**
   * Create an invite link
   */
  async createInviteLink(spaceId: string, spaceName: string, createdBy: string): Promise<string> {
    try {
      const tokenRef = await addDoc(collection(db, 'inviteLinks'), {
        spaceId,
        spaceName,
        createdBy,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        used: false,
      });

      return tokenRef.id;
    } catch (error) {
      console.error('Error creating invite link:', error);
      throw new Error('Failed to create invite link');
    }
  }

  /**
   * Get invite link by token
   */
  async getInviteLink(tokenId: string): Promise<InviteLink | null> {
    try {
      const tokenRef = doc(db, 'inviteLinks', tokenId);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        return null;
      }

      return this.mapToInviteLink(tokenId, tokenSnap.data());
    } catch (error) {
      console.error('Error getting invite link:', error);
      return null;
    }
  }

  /**
   * Accept invite link (with transaction to prevent race conditions)
   */
  async acceptInviteLink(
    tokenId: string,
    userId: string,
    email: string,
    displayName: string
  ): Promise<{ spaceId: string; spaceName: string }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'inviteLinks', tokenId);
        const tokenSnap = await transaction.get(tokenRef);

        if (!tokenSnap.exists()) {
          throw new Error('Invite link not found');
        }

        const tokenData = tokenSnap.data();

        if (tokenData.used) {
          throw new Error('Invite link already used');
        }

        const { spaceId, spaceName } = tokenData;
        const spaceRef = doc(db, this.collectionName, spaceId);
        const spaceSnap = await transaction.get(spaceRef);

        if (!spaceSnap.exists()) {
          throw new Error('Space not found');
        }

        // Update space memberIds
        transaction.update(spaceRef, {
          memberIds: arrayUnion(userId)
        });

        // Add member document
        const memberRef = doc(db, `${this.collectionName}/${spaceId}/members`, userId);
        transaction.set(memberRef, {
          userId,
          email,
          displayName,
          role: 'member',
          spaceOwnerId: spaceSnap.data().ownerId,
          joinedAt: serverTimestamp(),
        });

        // Mark token as used
        transaction.update(tokenRef, {
          used: true,
          usedBy: userId,
          usedAt: serverTimestamp()
        });

        return { spaceId, spaceName };
      });
    } catch (error) {
      console.error('Error accepting invite link:', error);
      throw error;
    }
  }

  /**
   * Map Firestore document to Space
   */
  private mapToSpace(id: string, data: DocumentData): Space {
    return {
      id,
      name: data.name || '',
      type: data.type || 'personal',
      ownerId: data.ownerId || '',
      memberIds: data.memberIds || [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      memberCount: data.memberCount,
    };
  }

  /**
   * Map Firestore document to SpaceMember
   */
  private mapToSpaceMember(id: string, data: DocumentData): SpaceMember {
    return {
      id,
      userId: data.userId || '',
      email: data.email || '',
      displayName: data.displayName || 'User',
      role: data.role || 'member',
      spaceOwnerId: data.spaceOwnerId || '',
      joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : null,
    };
  }

  /**
   * Map Firestore document to InviteLink
   */
  private mapToInviteLink(id: string, data: DocumentData): InviteLink {
    return {
      id,
      spaceId: data.spaceId || '',
      spaceName: data.spaceName || '',
      createdBy: data.createdBy || '',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : null,
      used: data.used || false,
      usedBy: data.usedBy,
      usedAt: data.usedAt instanceof Timestamp ? data.usedAt.toDate() : null,
    };
  }
}

// Singleton instance
export const spaceRepository = new SpaceRepository();
