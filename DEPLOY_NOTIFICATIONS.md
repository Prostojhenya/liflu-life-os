# Деплой обновлений для уведомлений на заблокированном экране

## Что было обновлено

1. ✅ Service Worker - добавлена поддержка уведомлений на заблокированном экране
2. ✅ Firebase Functions - добавлена функция проверки запланированных уведомлений
3. ✅ Клиентская часть - обновлена работа с FCM токенами
4. ✅ PWA манифест - создан для корректной работы приложения

## Шаги для деплоя

### 1. Деплой Firebase Functions

```bash
# Перейти в директорию functions
cd functions

# Установить зависимости (если нужно)
npm install

# Собрать функции
npm run build

# Задеплоить функции
firebase deploy --only functions

# Или задеплоить только новую функцию
firebase deploy --only functions:checkScheduledNotifications
```

### 2. Деплой фронтенда

#### Вариант A: Firebase Hosting
```bash
# Вернуться в корень проекта
cd ..

# Собрать приложение
npm run build

# Задеплоить на Firebase Hosting
firebase deploy --only hosting
```

#### Вариант B: Vercel
```bash
# Собрать приложение
npm run build

# Задеплоить на Vercel
vercel --prod
```

### 3. Проверка после деплоя

#### 3.1 Проверить Firebase Functions
```bash
# Посмотреть логи
firebase functions:log

# Проверить статус функций
firebase functions:list
```

Должны быть активны:
- ✅ `sendPushNotification` - отправка мгновенных уведомлений
- ✅ `checkScheduledNotifications` - проверка запланированных уведомлений (каждые 5 минут)

#### 3.2 Проверить Service Worker
1. Откройте приложение в браузере
2. Откройте DevTools (F12)
3. Перейдите в Application > Service Workers
4. Должен быть активен `firebase-messaging-sw.js`

#### 3.3 Проверить FCM токен
1. Откройте приложение
2. Разрешите уведомления
3. Откройте консоль браузера
4. Выполните:
```javascript
// Проверить токен
const token = await getFCMToken();
console.log('FCM Token:', token);
```

#### 3.4 Проверить сохранение в Firestore
1. Откройте Firebase Console
2. Перейдите в Firestore Database
3. Найдите `users/{ваш_userId}`
4. Проверьте поля:
   - `fcmToken` - должен быть заполнен
   - `notificationsEnabled` - должно быть `true`

### 4. Тестирование уведомлений

#### Тест 1: Мгновенное уведомление
1. Создайте задачу или привычку
2. Уведомление должно прийти сразу

#### Тест 2: Запланированное уведомление
1. Создайте задачу с датой на сегодня
2. Подождите до 9:00 (время напоминания)
3. Уведомление должно прийти

#### Тест 3: Уведомление на заблокированном экране
1. Создайте тестовое уведомление
2. Заблокируйте экран устройства
3. Уведомление должно появиться на экране блокировки

### 5. Мониторинг

#### Firebase Console
- **Functions > Logs**: логи выполнения функций
- **Cloud Messaging**: статистика доставки уведомлений
- **Firestore**: данные уведомлений

#### Полезные команды
```bash
# Логи всех функций
firebase functions:log

# Логи конкретной функции
firebase functions:log --only checkScheduledNotifications

# Логи за последний час
firebase functions:log --since 1h

# Следить за логами в реальном времени
firebase functions:log --follow
```

## Возможные проблемы и решения

### Проблема: Функция не деплоится
**Решение:**
```bash
# Проверить версию Node.js (должна быть 18+)
node --version

# Переустановить зависимости
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Проблема: Service Worker не обновляется
**Решение:**
1. Откройте DevTools > Application > Service Workers
2. Нажмите "Unregister"
3. Обновите страницу (Ctrl+Shift+R)
4. Service Worker зарегистрируется заново

### Проблема: Уведомления не приходят
**Решение:**
1. Проверьте VAPID ключ в `.env`:
```bash
VITE_FIREBASE_VAPID_KEY=ваш_vapid_ключ
```

2. Получите VAPID ключ:
```bash
firebase projects:list
firebase apps:sdkconfig web
```

3. Проверьте разрешения браузера:
   - Chrome: Settings > Privacy and security > Site Settings > Notifications
   - Safari: Settings > Websites > Notifications

### Проблема: Функция checkScheduledNotifications не запускается
**Решение:**
1. Проверьте, что функция задеплоена:
```bash
firebase functions:list
```

2. Проверьте логи:
```bash
firebase functions:log --only checkScheduledNotifications
```

3. Проверьте квоты Cloud Scheduler в Firebase Console

## Настройка частоты проверки

По умолчанию функция проверяет уведомления каждые 5 минут. Чтобы изменить:

1. Откройте `functions/src/index.ts`
2. Найдите строку:
```typescript
schedule: 'every 5 minutes',
```
3. Измените на нужное значение:
   - `'every 1 minutes'` - каждую минуту (больше нагрузка)
   - `'every 10 minutes'` - каждые 10 минут (меньше точность)
   - `'0 */1 * * *'` - каждый час (cron формат)

4. Пересоберите и задеплойте:
```bash
npm run build
firebase deploy --only functions:checkScheduledNotifications
```

## Стоимость

### Firebase Functions
- **Бесплатный план**: 2M вызовов/месяц
- **checkScheduledNotifications**: ~8,640 вызовов/месяц (каждые 5 минут)
- **sendPushNotification**: зависит от количества уведомлений

### Cloud Messaging
- **Бесплатно**: неограниченное количество сообщений

### Итого
При небольшом количестве пользователей всё работает в рамках бесплатного плана Firebase.

## Дополнительная информация

Подробная документация: [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)
