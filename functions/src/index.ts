import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const DATABASE_ID = 'ai-studio-7c012fdc-8d48-450f-84a0-26b51c2c1a57';

initializeApp();

const db = getFirestore(DATABASE_ID);
const messaging = getMessaging();

export const sendPushNotification = onDocumentCreated(
  {
    document: 'users/{userId}/notifications/{notificationId}',
    database: DATABASE_ID,
    region: 'us-central1',
  },
  async (event) => {
    const notification = event.data?.data();
    const userId = event.params.userId;

    if (!notification) return;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const token = userData?.fcmToken;

    if (!token || userData?.notificationsEnabled === false) {
      console.log('No enabled FCM token for user:', userId);
      return;
    }

    try {
      await messaging.send({
        token,
        notification: {
          title: notification.title || 'Liflu',
          body: notification.body || '',
        },
        data: {
          title: notification.title || 'Liflu',
          body: notification.body || '',
          notificationId: event.params.notificationId,
          ...(notification.data || {}),
        },
        webpush: {
          notification: {
            icon: '/img/liflu-icon.png',
            badge: '/img/liflu-icon.png',
            requireInteraction: false,
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: '/',
          },
        },
        android: {
          priority: 'high',
          notification: {
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public', // Показывать на заблокированном экране
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
      });
      console.log('Push notification sent to user:', userId);
    } catch (error: any) {
      console.error('Error sending push notification:', error);

      const code = error?.code || '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        await userDoc.ref.update({
          fcmToken: null,
          notificationsEnabled: false,
        });
      }
    }
  }
);

// Проверка и отправка запланированных уведомлений каждые 5 минут
export const checkScheduledNotifications = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Europe/Moscow',
    region: 'us-central1',
  },
  async () => {
    console.log('Checking scheduled notifications...');
    
    try {
      const now = Timestamp.now();
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Пропускаем пользователей без токена или с отключенными уведомлениями
        if (!userData?.fcmToken || userData?.notificationsEnabled === false) {
          continue;
        }
        
        // Получаем запланированные уведомления для пользователя
        const scheduledSnapshot = await db
          .collection(`users/${userId}/scheduledNotifications`)
          .where('sent', '==', false)
          .where('scheduledTime', '<=', now)
          .get();
        
        for (const scheduledDoc of scheduledSnapshot.docs) {
          const scheduledData = scheduledDoc.data();
          
          try {
            // Отправляем push-уведомление
            await messaging.send({
              token: userData.fcmToken,
              notification: {
                title: scheduledData.title || 'Liflu',
                body: scheduledData.body || '',
              },
              data: {
                title: scheduledData.title || 'Liflu',
                body: scheduledData.body || '',
                type: scheduledData.type || 'reminder',
                itemId: scheduledData.itemId || '',
              },
              webpush: {
                notification: {
                  icon: '/img/liflu-icon.png',
                  badge: '/img/liflu-icon.png',
                  requireInteraction: false,
                  vibrate: [200, 100, 200],
                },
                fcmOptions: {
                  link: '/',
                },
              },
              android: {
                priority: 'high',
                notification: {
                  priority: 'high',
                  defaultSound: true,
                  defaultVibrateTimings: true,
                  visibility: 'public',
                },
              },
              apns: {
                payload: {
                  aps: {
                    contentAvailable: true,
                    sound: 'default',
                  },
                },
              },
            });
            
            console.log(`Sent scheduled notification to user ${userId}`);
            
            // Добавляем в историю уведомлений
            await db.collection(`users/${userId}/notifications`).add({
              title: scheduledData.title,
              body: scheduledData.body,
              type: scheduledData.type === 'task' ? 'task_reminder' : 'habit_reminder',
              read: false,
              createdAt: Timestamp.now(),
            });
            
            // Удаляем запланированное уведомление
            await scheduledDoc.ref.delete();
            
          } catch (error: any) {
            console.error(`Error sending scheduled notification to user ${userId}:`, error);
            
            // Если токен недействителен, отключаем уведомления
            const code = error?.code || '';
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              await userDoc.ref.update({
                fcmToken: null,
                notificationsEnabled: false,
              });
            }
          }
        }
      }
      
      console.log('Scheduled notifications check completed');
    } catch (error) {
      console.error('Error in checkScheduledNotifications:', error);
    }
  }
);
