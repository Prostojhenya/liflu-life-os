import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { addNotification, showLocalNotification, requestNotificationPermission } from '@/components/NotificationCenter';

// Schedule a notification reminder
export const scheduleNotification = async (
  userId: string,
  type: 'task' | 'habit',
  itemId: string,
  title: string,
  body: string,
  scheduledTime: Date
) => {
  try {
    // Store scheduled notification in Firestore
    await addDoc(collection(db, `users/${userId}/scheduledNotifications`), {
      type,
      itemId,
      title,
      body,
      scheduledTime,
      createdAt: serverTimestamp(),
      sent: false
    });
  } catch (e) {
    console.error('Error scheduling notification:', e);
  }
};

// Check and send due notifications (should be called periodically or on app load)
export const checkScheduledNotifications = async (userId: string) => {
  try {
    const now = new Date();
    const q = query(
      collection(db, `users/${userId}/scheduledNotifications`),
      where('sent', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const scheduledTime = data.scheduledTime?.toDate?.() || new Date(data.scheduledTime);
      
      if (scheduledTime <= now) {
        // Send notification
        const granted = await requestNotificationPermission();
        if (granted) {
          showLocalNotification(data.title, data.body);
        }
        
        // Add to notification history
        await addNotification(userId, {
          title: data.title,
          body: data.body,
          type: data.type === 'task' ? 'task_reminder' : 'habit_reminder'
        });
        
        // Mark as sent
        await deleteDoc(doc(db, `users/${userId}/scheduledNotifications`, docSnap.id));
      }
    }
  } catch (e) {
    console.error('Error checking notifications:', e);
  }
};

// Cancel scheduled notification
export const cancelScheduledNotification = async (userId: string, itemId: string, type: 'task' | 'habit') => {
  try {
    const q = query(
      collection(db, `users/${userId}/scheduledNotifications`),
      where('itemId', '==', itemId),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, `users/${userId}/scheduledNotifications`, docSnap.id));
    }
  } catch (e) {
    console.error('Error canceling notification:', e);
  }
};

// Create task reminder notification
export const createTaskReminder = async (userId: string, taskId: string, taskTitle: string, scheduledDate?: string) => {
  if (!scheduledDate) return;
  
  // Parse the scheduled date and set reminder for 9:00 AM that day
  const [year, month, day] = scheduledDate.split('-').map(Number);
  const reminderTime = new Date(year, month - 1, day, 9, 0, 0);
  
  // Only schedule if the time is in the future
  if (reminderTime > new Date()) {
    await scheduleNotification(
      userId,
      'task',
      taskId,
      '📋 Напоминание о задаче',
      `Не забудьте: ${taskTitle}`,
      reminderTime
    );
  }
};

// Create habit reminder notification  
export const createHabitReminder = async (userId: string, habitId: string, habitTitle: string) => {
  // Schedule daily reminder for 20:00
  const now = new Date();
  let reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  
  // If it's already past 20:00, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  await scheduleNotification(
    userId,
    'habit',
    habitId,
    '🔥 Напоминание о привычке',
    `Время выполнить: ${habitTitle}`,
    reminderTime
  );
};
