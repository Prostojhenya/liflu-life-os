export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'task_reminder' | 'habit_reminder' | 'achievement' | 'streak' | 'system';
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  taskReminders: boolean;
  habitReminders: boolean;
  achievements: boolean;
  streaks: boolean;
  reminderTime: string; // HH:mm format
}
