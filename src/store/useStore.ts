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
  avatarSeed?: string;
}

interface AppState {
  user: UserProfile | null;
  isAuthReady: boolean;
  activeTab: 'dashboard' | 'tasks' | 'habits' | 'shopping' | 'chat' | 'goals' | 'profile';
  selectedDate: Date;
  streak: number;
  todayProgress: { done: number; total: number };
  setUser: (user: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setSelectedDate: (date: Date) => void;
  setStreak: (streak: number) => void;
  setTodayProgress: (progress: { done: number; total: number }) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthReady: false,
  activeTab: 'dashboard',
  selectedDate: new Date(),
  streak: 0,
  todayProgress: { done: 0, total: 0 },
  setUser: (user) => set({ user }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setStreak: (streak) => set({ streak }),
  setTodayProgress: (todayProgress) => set({ todayProgress }),
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
