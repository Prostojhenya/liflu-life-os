import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Listen for new notifications and send push notifications
export const sendPushNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userId = context.params.userId;

    try {
      // Get user's FCM token
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.fcmToken) {
        console.log('No FCM token for user:', userId);
        return null;
      }

      // Send push notification
      const message = {
        token: userData.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        webpush: {
          notification: {
            icon: '/img/liflu-icon.png',
            badge: '/img/liflu-icon.png',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return null;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  });

// Listen for task completions in shared spaces and send notifications to all members
export const onTaskCompletion = functions.firestore
  .document('spaces/{spaceId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only trigger when task is newly completed
    if (beforeData.completed === afterData.completed) {
      return null;
    }

    if (!afterData.completed) {
      return null;
    }

    const spaceId = context.params.spaceId;
    const taskId = context.params.taskId;

    try {
      // Get space members
      const membersSnapshot = await db
        .collection('spaces')
        .doc(spaceId)
        .collection('members')
        .get();

      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get task completer info
      const taskCompleterId = beforeData.completedBy || context.auth?.uid;
      if (!taskCompleterId) {
        return null;
      }

      // Get completer's display name
      const completerDoc = await db.collection('users').doc(taskCompleterId).get();
      const completerName = completerDoc.data()?.displayName || 'Пользователь';

      // Send notification to all other members
      const promises = members
        .filter(member => member.userId !== taskCompleterId)
        .map(async member => {
          // Add notification to Firestore
          await db
            .collection('users')
            .doc(member.userId)
            .collection('notifications')
            .add({
              title: '✅ Задача выполнена',
              body: `${completerName} завершил задачу: ${afterData.title}`,
              type: 'task_reminder',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: { taskId, spaceId },
            });
        });

      await Promise.all(promises);
      return null;
    } catch (error) {
      console.error('Error sending task completion notifications:', error);
      return null;
    }
  });

// Listen for habit completions in shared spaces
export const onHabitCompletion = functions.firestore
  .document('spaces/{spaceId}/habits/{habitId}/completions/{completionId}')
  .onCreate(async (snap, context) => {
    const completion = snap.data();
    const spaceId = context.params.spaceId;
    const habitId = context.params.habitId;
    const userId = completion.userId;

    try {
      // Get habit info
      const habitDoc = await db
        .collection('spaces')
        .doc(spaceId)
        .collection('habits')
        .doc(habitId)
        .get();

      const habitData = habitDoc.data();
      if (!habitData) {
        return null;
      }

      // Get all members
      const membersSnapshot = await db
        .collection('spaces')
        .doc(spaceId)
        .collection('members')
        .get();

      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Send notification to other members
      const promises = members
        .filter(member => member.userId !== userId)
        .map(async member => {
          await db
            .collection('users')
            .doc(member.userId)
            .collection('notifications')
            .add({
              title: '🔥 Привычка выполнена',
              body: `${completion.displayName} выполнил привычку: ${habitData.title}`,
              type: 'habit_reminder',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              data: { habitId, spaceId },
            });
        });

      await Promise.all(promises);
      return null;
    } catch (error) {
      console.error('Error sending habit completion notifications:', error);
      return null;
    }
  });
