/**
 * Domain Model: User
 * Represents a user in the system with their profile and stats
 */

export interface UserStats {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  sense: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  totalXP: number;
  level: number;
  currentSpaceId: string | null;
  stats: UserStats;
  avatarSeed?: string;
}

export const INITIAL_STATS: UserStats = {
  strength: 10,
  agility: 10,
  intelligence: 10,
  vitality: 10,
  sense: 10
};

export const STAT_LABELS: Record<keyof UserStats, string> = {
  strength: 'Физика',
  agility: 'Энергия',
  intelligence: 'Интеллект',
  vitality: 'Здоровье',
  sense: 'Организация'
};

export const XP_VALUES = {
  TASK: 10,
  HABIT: 5,
  GOAL: 50,
} as const;

/**
 * Calculate user level based on XP
 * Formula: Level = sqrt(XP / 50) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

/**
 * Calculate XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 50;
}

/**
 * Calculate XP progress to next level (0-1)
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = getXPForNextLevel(currentLevel - 1);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  
  return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
}
