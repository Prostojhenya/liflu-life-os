# Настройка Push-уведомлений

## Обзор

Система уведомлений Liflu включает:
- 🔔 Центр уведомлений с колокольчиком в шапке
- 📱 Push-уведомления через Firebase Cloud Messaging (FCM)
- ⏰ Напоминания о задачах и привычках

## Настройка Firebase Cloud Messaging

### 1. Получите VAPID ключ

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в **Project Settings** → **Cloud Messaging**
4. В разделе **Web Push certificates** нажмите **Generate key pair**
5. Скопируйте сгенерированный ключ

### 2. Добавьте VAPID ключ в .env

Создайте или обновите файл `.env` в корне проекта:

```env
VITE_FIREBASE_VAPID_KEY=ваш_vapid_ключ_здесь
```

### 3. Настройте Service Worker (автоматически)

Vite-PWA автоматически генерирует service worker (`dist/sw.js`). 

Для обработки push-уведомлений на сервере, вам нужно:

1. Настроить Firebase Cloud Functions или ваш backend для отправки FCM сообщений
2. Использовать Firebase Admin SDK на сервере

## Как это работает

### Клиентская часть

1. При логине пользователь запрашивает разрешение на уведомления
2. Полученный FCM токен сохраняется в профиле пользователя (`users/{uid}/fcmToken`)
3. Уведомления подписываются через Firestore (`users/{uid}/notifications`)

### Создание напоминаний

При создании задачи/привычки можно включить напоминание:
- Задачи: напоминание в 9:00 в день выполнения
- Привычки: ежедневное напоминание в 20:00

### Центр уведомлений

Компонент `NotificationCenter` отображает:
- Непрочитанные уведомления с бейджем
- Историю уведомлений
- Кнопку включения уведомлений

## Типы уведомлений

```typescript
type NotificationType = 
  | 'task_reminder'   // Напоминание о задаче
  | 'habit_reminder'  // Напоминание о привычке
  | 'achievement'     // Достижение разблокировано
  | 'streak'          // Серия сохранена/потеряна
  | 'system'          // Системное уведомление
```

## Отправка уведомлений с сервера

Пример для Firebase Cloud Functions:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.params.userId)
      .get();
    
    const fcmToken = userDoc.data().fcmToken;
    
    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      });
    }
  });
```

## Тестирование

1. Откройте приложение в браузере
2. Нажмите на колокольчик
3. Нажмите "Включить" для разрешения уведомлений
4. Создайте задачу с напоминанием
5. Уведомление появится в центре и как push

## Решение проблем

### Уведомления не приходят

1. Проверьте разрешение в браузере (замок в адресной строке)
2. Убедитесь, что VAPID ключ правильный
3. Проверьте консоль на ошибки FCM

### Чёрный экран в Safari PWA

Исправлено в этой версии:
- Добавлен `apple-touch-startup-image`
- Установлен `background_color: #0b0416`
- Настроен `theme_color`
- Добавлен inline CSS для предотвращения белой вспышки

## Структура файлов

```
src/
├── components/
│   └── NotificationCenter.tsx  # Центр уведомлений
├── lib/
│   └── notifications.ts        # Утилиты для уведомлений
├── types/
│   └── notification.ts         # Типы уведомлений
└── firebase.ts                 # Инициализация FCM
```
