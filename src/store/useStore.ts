import { create } from 'zustand';

interface UserStats {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  sense: number;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  totalXP: number;
  level: number;
  currentSpaceId: string | null;
  stats: UserStats;
}

interface AppState {
  user: UserProfile | null;
  isAuthReady: boolean;
  activeTab: 'dashboard' | 'tasks' | 'habits' | 'shopping' | 'chat' | 'goals' | 'create';
  setUser: (user: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthReady: false,
  activeTab: 'dashboard',
  setUser: (user) => set({ user }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export const calculateLevel = (xp: number) => {
  // Более плавная прогрессия: Уровень = sqrt(XP / 50)
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

export const XP_VALUES = {
  TASK: 10,
  HABIT: 5,
  GOAL: 50,
};

export const INITIAL_STATS: UserStats = {
  strength: 10,
  agility: 10,
  intelligence: 10,
  vitality: 10,
  sense: 10
};

export const STAT_LABELS: Record<string, string> = {
  strength: 'Физика',
  agility: 'Энергия',
  intelligence: 'Интеллект',
  vitality: 'Здоровье',
  sense: 'Организация'
};
