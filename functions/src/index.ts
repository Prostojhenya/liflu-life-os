import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

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
          },
        },
      });
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
