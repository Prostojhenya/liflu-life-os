/**
 * Domain Model: Space
 * Represents a workspace (personal or shared) where users collaborate
 */

export type SpaceType = 'personal' | 'shared';
export type MemberRole = 'admin' | 'member';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  ownerId: string;
  memberIds: string[];
  createdAt: Date | null;
  memberCount?: number;
}

export interface SpaceMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  spaceOwnerId: string;
  joinedAt: Date | null;
}

export interface SpaceInvite {
  id: string;
  spaceId: string;
  spaceName: string;
  email: string;
  invitedBy: string;
  inviterName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | null;
}

export interface InviteLink {
  id: string;
  spaceId: string;
  spaceName: string;
  createdBy: string;
  createdAt: Date | null;
  expiresAt: Date | null;
  used: boolean;
  usedBy?: string;
  usedAt?: Date | null;
}

/**
 * Check if a user is the owner of a space
 */
export function isSpaceOwner(space: Space, userId: string): boolean {
  return space.ownerId === userId;
}

/**
 * Check if a user is an admin of a space
 */
export function isSpaceAdmin(member: SpaceMember | undefined): boolean {
  return member?.role === 'admin';
}

/**
 * Check if a user can manage a space (owner or admin)
 */
export function canManageSpace(space: Space, userId: string, member?: SpaceMember): boolean {
  return isSpaceOwner(space, userId) || isSpaceAdmin(member);
}

/**
 * Check if an invite link is valid
 */
export function isInviteLinkValid(link: InviteLink): boolean {
  if (link.used) return false;
  if (!link.expiresAt) return true;
  return new Date() < link.expiresAt;
}
