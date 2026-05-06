# Liflu - Life OS

## 1. Краткое описание

Liflu - мобильное PWA-приложение в стиле Life OS для управления личной и совместной жизненной системой: задачами, событиями, привычками, целями, покупками, профилем, XP/уровнями, пространствами и уведомлениями.

Проект сейчас выглядит как MVP с сильным фокусом на мобильный UX, геймификацию и совместные пространства. Основной persistence-слой - Firebase Auth + Firestore. Фронтенд построен на React, Vite, Zustand и Tailwind CSS.

## 2. Текущий стек

- Frontend: React 19, TypeScript, Vite.
- UI: Tailwind CSS 4, lucide-react, motion/react.
- State management: Zustand.
- Backend/data: Firebase Auth, Firestore, Firebase Messaging.
- PWA: vite-plugin-pwa, Workbox, web app manifest.
- Dev server: Express + Vite middleware в `server.ts`.
- Deploy traces: Vercel config, Firebase config, health endpoint.

## 3. Как запустить

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

Проверка типов:

```bash
npm run lint
```

Важно: README сейчас остался от AI Studio шаблона и требует актуализации под Liflu. Этот документ отражает фактическое состояние проекта на 2026-05-06.

## 4. Основные сущности

### User

Хранится в `users/{uid}`:

- профиль Google-пользователя;
- `totalXP`, `level`;
- текущий `currentSpaceId`;
- игровые характеристики: strength, agility, intelligence, vitality, sense;
- настройки уведомлений и FCM-токен.

### Space

Хранится в `spaces/{spaceId}`:

- личное или совместное пространство;
- владелец `ownerId`;
- участники в `spaces/{spaceId}/members`;
- вложенные коллекции задач, привычек, покупок, целей и сообщений.

### Task/Event

Хранится в `spaces/{spaceId}/tasks`:

- обычные задачи и события различаются полем `type`;
- задачи дают XP и стат-поинты;
- события имеют дату и опциональное время;
- используется `scheduledDate`.

### Habit

Хранится в `spaces/{spaceId}/habits`:

- daily-привычки;
- streak;
- XP за выполнение;
- в совместных пространствах есть подколлекция `completions`, где отмечаются выполнения участников за день.

### Goal

Хранится в `spaces/{spaceId}/goals`:

- цель;
- `progress`;
- `target`;
- ручное изменение прогресса.

### Shopping Item

Хранится в `spaces/{spaceId}/shopping`:

- позиция списка покупок;
- статус выполнения/покупки.

### Notifications

Хранятся в:

- `users/{uid}/notifications`;
- `users/{uid}/scheduledNotifications`.

Сейчас уведомления частично локальные, частично Firestore-based. Полноценная серверная отправка push-уведомлений пока не завершена.

## 5. Что уже готово

### Готово функционально

- Авторизация через Google.
- Создание личного пространства при первом входе.
- Переключение между пространствами.
- Создание личных и совместных пространств.
- Инвайты по email и ссылке.
- Dashboard с календарём, задачами, привычками и событиями.
- Создание задач, событий, привычек, целей и покупок.
- Выполнение задач с начислением XP и статов.
- Выполнение привычек, включая совместную механику "все участники выполнили".
- Список покупок.
- Цели с ручным прогрессом.
- Профиль с уровнем, XP, аватаром и визуальной статистикой.
- Центр уведомлений.
- PWA-манифест, иконки, service worker.
- Firestore rules с базовым разграничением доступа.
- Production build проходит.
- TypeScript-проверка проходит.

### Готово частично

- Push notifications: есть Firebase Messaging, сохранение токена и локальные уведомления, но нет полноценного доверенного backend-процесса отправки FCM другим пользователям.
- Совместные пространства: базовые сценарии есть, но поиск членства и права доступа требуют доработки.
- Профиль/аналитика: UI богатый, но часть статистики пока mock/demo.
- AI parsing API: есть старый in-memory Express endpoint, но основной UI уже работает напрямую с Firestore; AI-сценарий не интегрирован как продуктовая функция.
- PWA: базовая установка есть, но нужен реальный тест offline/fresh install/push.

## 6. Архитектура приложения

### Входная точка

- `src/main.tsx` монтирует React-приложение.
- `src/App.tsx` отвечает за auth lifecycle, создание первого пространства, обработку invite-ссылок и выбор активного экрана.

### Глобальное состояние

- `src/store/useStore.ts` хранит пользователя, активную вкладку, выбранную дату и краткий прогресс дня.
- Локальное состояние экранов хранится внутри компонентов.

### Работа с Firebase

- `src/firebase.ts` инициализирует Auth, Firestore и Messaging.
- Основная бизнес-логика сейчас живёт прямо в React-компонентах.
- Firestore используется через realtime listeners `onSnapshot`.

### Навигация

Навигация табовая, без router:

- dashboard;
- tasks;
- habits;
- shopping;
- chat;
- goals;
- profile.

### Данные

Схема Firestore в упрощённом виде:

```text
users/{uid}
  notifications/{notificationId}
  scheduledNotifications/{notificationId}

spaces/{spaceId}
  members/{uid}
  tasks/{taskId}
  habits/{habitId}
    completions/{date_uid}
  shopping/{itemId}
  goals/{goalId}
  messages/{messageId}

invites/{inviteId}
inviteLinks/{tokenId}
conversations/{conversationId}
  messages/{messageId}
```

## 7. Сильные стороны

- Хорошая продуктовая идея: не просто todo-list, а Life OS с геймификацией и совместными пространствами.
- Мобильный UX продуман лучше среднего MVP: нижняя навигация, быстрый add-flow, календарь, карточки, PWA-настройки.
- Firestore realtime-подход хорошо подходит для совместных задач, привычек и пространств.
- Есть базовая система ролей и правил доступа.
- Проект уже собирается и проходит TypeScript-проверку.
- Много пользовательской ценности уже в UI: задачи, события, привычки, покупки, цели, профиль, уведомления.
- Хорошая база для будущего AI-ввода задач и событий.

## 8. Слабые стороны и риски

### Критичные

- Уведомления другим участникам сейчас конфликтуют с Firestore rules: клиент пытается писать в `users/{otherUserId}/notifications`, но правила разрешают пользователю писать только в собственные уведомления.
- Firestore rules слишком широко разрешают `list` для `spaces`, `invites` и чтение `inviteLinks`. Это создаёт риск утечки метаданных.
- Invite links имеют `expiresAt`, но при принятии ссылки срок действия не проверяется.

### Средние

- В `SpaceSwitcher` есть обход всех `spaces`, чтобы найти пространства пользователя. Это плохо масштабируется и зависит от широкого `allow list`.
- В коде есть ссылка на `userMemberships`, но при создании/принятии пространства такие документы не создаются.
- Бизнес-логика распределена по большим React-компонентам. Это усложняет тестирование, переиспользование и контроль ошибок.
- Есть дублирование логики выполнения задач и привычек между `Dashboard`, `Tasks` и `Habits`.
- Профиль содержит mock-статистику, из-за чего может показывать недостоверные данные.
- Есть старый in-memory API в `server.ts` и `src/api/tasks.ts`, который расходится с текущей Firestore-моделью.

### Низкие

- В проекте много документации из разных этапов, но README не отражает текущий продукт.
- `clean` script использует Unix-команду `rm -rf`, что не подходит для Windows без совместимой оболочки.
- В production bundle крупные chunks Firebase и основного приложения; это нормально для MVP, но стоит следить за lazy-loading.
- В компонентах встречаются debug `console.log`.

## 9. Рекомендуемый план работ

### Ближайший этап

- Актуализировать README: продукт, запуск, env, Firebase setup, deploy.
- Перенести отправку уведомлений другим пользователям в доверенный backend/Firebase Functions или изменить модель на разрешённые user-owned writes.
- Закрыть Firestore rules: убрать широкий list/read там, где он не нужен.
- Добавить проверку `expiresAt` для invite links.
- Исправить модель членства: завести и поддерживать `userMemberships` или заменить обход всех spaces на collection group/query-friendly структуру.

### Следующий этап

- Вынести Firestore-операции в сервисный слой: tasks, habits, spaces, notifications, goals.
- Убрать дублирование complete/toggle логики между экранами.
- Заменить mock-статистику профиля на агрегаты из Firestore.
- Добавить unit/integration тесты для XP, streak, invites и security rules.
- Пройти ручной mobile QA: auth, PWA install, offline, shared space, invite link, notification permission.

### Будущий продуктовый план

- AI quick capture: разбор естественного языка в задачи, события, привычки и покупки.
- Голосовой ввод через кнопку mic.
- Повторяющиеся задачи и события.
- Настраиваемые напоминания по времени.
- Достижения, бейджи и реальные unlocks.
- Аналитика активности по реальным данным.
- Offline-first очередь изменений.
- Импорт/экспорт данных.
- Более точные роли в пространствах: owner/admin/member/viewer.

## 10. Рекомендации по качеству

- Ввести тесты Firestore rules через Firebase Emulator.
- Добавить smoke E2E: login mock/emulator, create task, complete task, create shared space, accept invite.
- Настроить ESLint отдельно от `tsc`.
- Добавить CI: install, typecheck, build.
- Добавить docs для env-переменных и Firebase-проекта.
- Разделить продуктовую документацию и технические changelog-файлы.

## 11. Статус проекта

Текущий статус: сильный MVP / early beta.

Проект уже можно демонстрировать как интерактивный прототип с реальным persistence через Firebase. До стабильного production-релиза нужно закрыть безопасность правил, уведомления, членство в пространствах и достоверность аналитики.
