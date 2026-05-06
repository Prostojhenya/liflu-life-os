# ✅ Чеклист: Уведомления на заблокированном экране

## Перед деплоем

### 1. Проверить VAPID ключ
- [ ] Открыть [Firebase Console](https://console.firebase.google.com)
- [ ] Project Settings > Cloud Messaging > Web Push certificates
- [ ] Скопировать "Key pair" (VAPID key)
- [ ] Добавить в `.env`:
```bash
VITE_FIREBASE_VAPID_KEY=ваш_vapid_ключ
```

### 2. Проверить зависимости
```bash
# В корне проекта
npm install

# В functions
cd functions
npm install
cd ..
```

### 3. Проверить конфигурацию Firebase
- [ ] Файл `firebase-applet-config.json` существует
- [ ] Файл `functions/src/index.ts` обновлен
- [ ] Файл `public/firebase-messaging-sw.js` обновлен

## Деплой

### 1. Собрать и задеплоить Functions
```bash
cd functions
npm run build
firebase deploy --only functions
cd ..
```

**Ожидаемый результат:**
```
✔ functions[sendPushNotification] Successful create operation.
✔ functions[checkScheduledNotifications] Successful create operation.
```

### 2. Собрать и задеплоить приложение
```bash
npm run build
firebase deploy --only hosting
```

**Или для Vercel:**
```bash
vercel --prod
```

## После деплоя

### 1. Проверить Functions
```bash
firebase functions:list
```

**Должны быть активны:**
- [ ] `sendPushNotification(us-central1)`
- [ ] `checkScheduledNotifications(us-central1)`

### 2. Проверить Service Worker
- [ ] Открыть приложение
- [ ] DevTools (F12) > Application > Service Workers
- [ ] `firebase-messaging-sw.js` должен быть "activated and is running"

### 3. Проверить разрешения
- [ ] Открыть приложение
- [ ] Нажать на иконку колокольчика 🔔
- [ ] Нажать "Включить"
- [ ] Браузер должен запросить разрешение
- [ ] Разрешить уведомления

### 4. Проверить FCM токен
**В консоли браузера:**
```javascript
const token = await getFCMToken();
console.log('FCM Token:', token);
```

**Результат:**
- [ ] Токен получен (длинная строка)
- [ ] Нет ошибок в консоли

**В Firestore:**
- [ ] Открыть Firebase Console > Firestore Database
- [ ] Найти `users/{ваш_userId}`
- [ ] Проверить поля:
  - [ ] `fcmToken` - заполнен
  - [ ] `notificationsEnabled` - `true`

### 5. Тест мгновенного уведомления
- [ ] Создать задачу
- [ ] Уведомление пришло сразу
- [ ] Проверить в `users/{userId}/notifications`

### 6. Тест запланированного уведомления
- [ ] Создать задачу с датой на сегодня
- [ ] Проверить `users/{userId}/scheduledNotifications`
- [ ] Запись создана с полями:
  - [ ] `title`
  - [ ] `body`
  - [ ] `scheduledTime`
  - [ ] `sent: false`

### 7. Тест на заблокированном экране 🎯
**Android:**
- [ ] Создать тестовое уведомление
- [ ] Заблокировать экран (кнопка питания)
- [ ] Уведомление появилось на экране блокировки
- [ ] Есть звук/вибрация

**iOS (Safari):**
- [ ] Добавить сайт на домашний экран
- [ ] Открыть приложение с домашнего экрана
- [ ] Разрешить уведомления
- [ ] Создать тестовое уведомление
- [ ] Заблокировать экран
- [ ] Уведомление появилось

**Desktop:**
- [ ] Создать тестовое уведомление
- [ ] Уведомление появилось в системном трее
- [ ] Есть звук

### 8. Проверить логи
```bash
firebase functions:log --follow
```

**Ожидаемые логи:**
```
Checking scheduled notifications...
Sent scheduled notification to user xxx
Scheduled notifications check completed
```

## Мониторинг

### Каждый день
- [ ] Проверять логи: `firebase functions:log`
- [ ] Проверять ошибки в Firebase Console > Functions

### Каждую неделю
- [ ] Проверять статистику в Cloud Messaging
- [ ] Проверять количество запланированных уведомлений
- [ ] Очищать старые уведомления (если нужно)

## Возможные проблемы

### ❌ Уведомления не приходят
**Проверить:**
1. [ ] Разрешения браузера
2. [ ] FCM токен сохранен в Firestore
3. [ ] Service Worker активен
4. [ ] VAPID ключ правильный
5. [ ] Логи функций: `firebase functions:log`

**Решение:**
```bash
# Пересоздать Service Worker
# DevTools > Application > Service Workers > Unregister
# Обновить страницу (Ctrl+Shift+R)
```

### ❌ Функция не запускается
**Проверить:**
1. [ ] Функция задеплоена: `firebase functions:list`
2. [ ] Нет ошибок в логах: `firebase functions:log`
3. [ ] Квоты не превышены (Firebase Console > Usage)

**Решение:**
```bash
firebase deploy --only functions:checkScheduledNotifications
```

### ❌ Service Worker не обновляется
**Решение:**
1. DevTools (F12) > Application > Service Workers
2. Нажать "Unregister"
3. Обновить страницу (Ctrl+Shift+R)
4. Проверить, что новый SW зарегистрирован

### ❌ iOS не показывает уведомления
**Проверить:**
1. [ ] Сайт добавлен на домашний экран
2. [ ] Приложение открыто с домашнего экрана (не из Safari)
3. [ ] Разрешения даны в приложении
4. [ ] Safari > Settings > Websites > Notifications

## Полезные команды

```bash
# Логи всех функций
firebase functions:log

# Логи конкретной функции
firebase functions:log --only checkScheduledNotifications

# Следить за логами
firebase functions:log --follow

# Список функций
firebase functions:list

# Удалить функцию
firebase functions:delete checkScheduledNotifications

# Пересоздать функцию
firebase deploy --only functions:checkScheduledNotifications
```

## Готово! 🎉

Если все пункты отмечены ✅, уведомления работают на заблокированном экране!

## Документация
- 📖 [Полная документация](./PUSH_NOTIFICATIONS_SETUP.md)
- 🚀 [Инструкция по деплою](./DEPLOY_NOTIFICATIONS.md)
- ⚡ [Быстрый деплой](./БЫСТРЫЙ_ДЕПЛОЙ.md)
