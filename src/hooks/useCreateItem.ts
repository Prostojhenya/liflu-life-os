import { useState } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { XP_VALUES } from '@/store/useStore';
import { createTaskReminder, createHabitReminder } from '@/lib/notifications';

export type ItemType = 'task' | 'event' | 'habit' | 'goal' | 'shopping';

export interface CreateItemData {
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  xp?: number;
  reminder?: boolean;
  eventTime?: string | null;
}

export interface UseCreateItemOptions {
  spaceId: string;
  userId: string;
  scheduledDate?: Date;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCreateItem(options: UseCreateItemOptions) {
  const { spaceId, userId, scheduledDate, onSuccess, onError } = options;
  const [isCreating, setIsCreating] = useState(false);

  const createItem = async (type: ItemType, data: CreateItemData) => {
    if (!data.title.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const today = new Date();
      const targetDate = (type === 'task' || type === 'event') && scheduledDate ? scheduledDate : today;
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      if (type === 'task' || type === 'event') {
        const docRef = await addDoc(collection(db, `spaces/${spaceId}/tasks`), {
          title: data.title,
          description: data.description || null,
          priority: data.priority || 'medium',
          type: type === 'event' ? 'event' : 'task',
          eventTime: type === 'event' ? (data.eventTime || null) : null,
          statType: 'intelligence',
          completed: false,
          xpAwarded: false,
          xpValue: data.xp || XP_VALUES.TASK,
          spaceId,
          scheduledDate: dateStr,
          createdAt: serverTimestamp(),
        });

        if (type === 'task' && data.reminder) {
          await createTaskReminder(userId, docRef.id, data.title, dateStr);
        }
      } else if (type === 'habit') {
        const docRef = await addDoc(collection(db, `spaces/${spaceId}/habits`), {
          title: data.title,
          description: data.description || null,
          statType: 'vitality',
          frequency: 'daily',
          streak: 0,
          xpValue: data.xp || XP_VALUES.HABIT,
          spaceId,
          createdAt: serverTimestamp(),
        });

        if (data.reminder) {
          await createHabitReminder(userId, docRef.id, data.title);
        }
      } else if (type === 'goal') {
        await addDoc(collection(db, `spaces/${spaceId}/goals`), {
          title: data.title,
          description: data.description || null,
          progress: 0,
          target: 100,
          xpValue: data.xp || XP_VALUES.GOAL,
          spaceId,
          createdAt: serverTimestamp(),
        });
      } else if (type === 'shopping') {
        await addDoc(collection(db, `spaces/${spaceId}/shopping`), {
          name: data.title,
          completed: false,
          spaceId,
          createdAt: serverTimestamp(),
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error creating item:', error);
      onError?.(error as Error);
    } finally {
      setIsCreating(false);
    }
  };

  return { createItem, isCreating };
}
