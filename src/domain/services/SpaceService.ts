/**
 * Space Service
 * Business logic for space management
 */

import { spaceRepository } from '../repositories/SpaceRepository';
import { userRepository } from '../repositories/UserRepository';
import { Space, SpaceMember, SpaceType, isSpaceOwner, canManageSpace } from '../models/Space';

export class SpaceService {
  /**
   * Get all spaces for a user
   */
  async getUserSpaces(userId: string): Promise<Space[]> {
    return await spaceRepository.getUserSpaces(userId);
  }

  /**
   * Get space by ID
   */
  async getSpace(spaceId: string): Promise<Space | null> {
    return await spaceRepository.getById(spaceId);
  }

  /**
   * Create a new space
   */
  async createSpace(
    userId: string,
    email: string,
    displayName: string,
    spaceName: string,
    spaceType: SpaceType
  ): Promise<string> {
    if (!spaceName.trim()) {
      throw new Error('Space name is required');
    }

    return await spaceRepository.create(userId, email, displayName, spaceName.trim(), spaceType);
  }

  /**
   * Switch to a different space
   */
  async switchSpace(userId: string, spaceId: string): Promise<void> {
    // Verify space exists and user is a member
    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (!space.memberIds.includes(userId)) {
      throw new Error('You are not a member of this space');
    }

    await userRepository.updateCurrentSpace(userId, spaceId);
  }

  /**
   * Rename a space
   */
  async renameSpace(spaceId: string, userId: string, newName: string): Promise<void> {
    if (!newName.trim()) {
      throw new Error('Space name is required');
    }

    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    const member = await spaceRepository.getMember(spaceId, userId);
    if (!canManageSpace(space, userId, member)) {
      throw new Error('You do not have permission to rename this space');
    }

    await spaceRepository.updateName(spaceId, newName.trim());
  }

  /**
   * Delete a space
   */
  async deleteSpace(spaceId: string, userId: string, userSpaces: Space[]): Promise<void> {
    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (!isSpaceOwner(space, userId)) {
      throw new Error('Only the owner can delete a space');
    }

    if (userSpaces.length <= 1) {
      throw new Error('Cannot delete your only space');
    }

    await spaceRepository.delete(spaceId);
  }

  /**
   * Get space members
   */
  async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
    return await spaceRepository.getMembers(spaceId);
  }

  /**
   * Invite a member by email
   */
  async inviteMemberByEmail(
    spaceId: string,
    userId: string,
    email: string,
    spaceName: string,
    inviterName: string
  ): Promise<void> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }

    // Check permissions
    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    const member = await spaceRepository.getMember(spaceId, userId);
    if (!canManageSpace(space, userId, member)) {
      throw new Error('You do not have permission to invite members');
    }

    // Check if user is already a member
    const members = await spaceRepository.getMembers(spaceId);
    const existingMember = members.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existingMember) {
      throw new Error('This user is already a member');
    }

    // Create invite (this would typically send an email)
    // For now, we'll just create the invite document
    // TODO: Implement email sending via Firebase Functions
    console.log('Invite created for:', email);
  }

  /**
   * Generate an invite link
   */
  async generateInviteLink(spaceId: string, userId: string): Promise<string> {
    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    const member = await spaceRepository.getMember(spaceId, userId);
    if (!canManageSpace(space, userId, member)) {
      throw new Error('You do not have permission to create invite links');
    }

    const tokenId = await spaceRepository.createInviteLink(spaceId, space.name, userId);
    return `${window.location.origin}?invite=${tokenId}`;
  }

  /**
   * Accept an invite link
   */
  async acceptInviteLink(
    tokenId: string,
    userId: string,
    email: string,
    displayName: string
  ): Promise<{ spaceId: string; spaceName: string }> {
    // Get invite link
    const inviteLink = await spaceRepository.getInviteLink(tokenId);
    if (!inviteLink) {
      throw new Error('Invite link not found');
    }

    if (inviteLink.used) {
      throw new Error('Invite link has already been used');
    }

    if (inviteLink.expiresAt && new Date() > inviteLink.expiresAt) {
      throw new Error('Invite link has expired');
    }

    // Accept the invite
    return await spaceRepository.acceptInviteLink(tokenId, userId, email, displayName);
  }

  /**
   * Remove a member from a space
   */
  async removeMember(spaceId: string, userId: string, memberUserId: string): Promise<void> {
    const space = await spaceRepository.getById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    // Cannot remove the owner
    if (isSpaceOwner(space, memberUserId)) {
      throw new Error('Cannot remove the space owner');
    }

    // Check permissions
    const member = await spaceRepository.getMember(spaceId, userId);
    if (!canManageSpace(space, userId, member)) {
      throw new Error('You do not have permission to remove members');
    }

    await spaceRepository.removeMember(spaceId, memberUserId);
  }
}

// Singleton instance
export const spaceService = new SpaceService();
