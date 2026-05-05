# Tasks API Documentation

## Обзор

REST API для управления задачами (квестами) и XP системой в приложении Life OS.

## Базовый URL

```
http://localhost:3000/api
```

## Endpoints

### Tasks

#### 1. Получить все задачи

**GET** `/api/tasks`

Возвращает список всех задач.

**Response:**
```json
[
  {
    "id": "1234567890",
    "title": "Сделать зарядку",
    "completed": false,
    "xp": 10
  }
]
```

**Status Codes:**
- `200 OK` - успешный запрос

---

#### 2. Создать новую задачу

**POST** `/api/tasks`

Создает новую задачу.

**Request Body:**
```json
{
  "title": "Название задачи",
  "xp": 10  // опционально, по умолчанию 10
}
```

**Response:**
```json
{
  "id": "1234567890",
  "title": "Название задачи",
  "completed": false,
  "xp": 10
}
```

**Status Codes:**
- `201 Created` - задача успешно создана
- `400 Bad Request` - невалидные данные (пустой title)

**Validation:**
- `title` - обязательное поле, строка, не может быть пустой
- `xp` - опциональное поле, число > 0, по умолчанию 10

---

#### 3. Завершить задачу

**POST** `/api/tasks/:id/complete`

Отмечает задачу как выполненную и начисляет XP пользователю.

**URL Parameters:**
- `id` - ID задачи

**Response:**
```json
{
  "task": {
    "id": "1234567890",
    "title": "Сделать зарядку",
    "completed": true,
    "xp": 10
  },
  "user": {
    "xp": 110,
    "level": 2
  },
  "xpGained": 10,
  "leveledUp": true
}
```

**Status Codes:**
- `200 OK` - задача успешно завершена
- `404 Not Found` - задача не найдена
- `400 Bad Request` - задача уже завершена

---

### User

#### 4. Получить данные пользователя

**GET** `/api/user`

Возвращает текущий XP и уровень пользователя.

**Response:**
```json
{
  "xp": 110,
  "level": 2
}
```

**Status Codes:**
- `200 OK` - успешный запрос

---

## Типы данных

### Task

```typescript
interface Task {
  id: string;          // Уникальный идентификатор
  title: string;       // Название задачи
  completed: boolean;  // Статус выполнения
  xp: number;         // Количество опыта за выполнение
}
```

### User

```typescript
interface User {
  xp: number;    // Общее количество опыта
  level: number; // Текущий уровень
}
```

### CompleteTaskResponse

```typescript
interface CompleteTaskResponse {
  task: Task;           // Завершенная задача
  user: User;           // Обновленные данные пользователя
  xpGained: number;     // Количество полученного XP
  leveledUp: boolean;   // Повысился ли уровень
}
```

### CreateTaskRequest

```typescript
interface CreateTaskRequest {
  title: string;    // Название задачи (обязательно)
  xp?: number;      // Количество XP (опционально, по умолчанию 10)
}
```

---

## XP Система

### Формула расчета уровня

```
level = floor(xp / 100) + 1
```

**Примеры:**
- 0-99 XP → Уровень 1
- 100-199 XP → Уровень 2
- 200-299 XP → Уровень 3
- 1000 XP → Уровень 11

### Начисление XP

При завершении задачи:
1. `user.xp += task.xp`
2. Пересчитывается уровень
3. Проверяется, повысился ли уровень
4. Возвращается полная информация о начислении

---

## Примеры использования

### JavaScript/TypeScript

```typescript
// Получить все задачи
const tasks = await fetch('http://localhost:3000/api/tasks')
  .then(res => res.json());

// Создать задачу
const newTask = await fetch('http://localhost:3000/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Новая задача', xp: 15 })
}).then(res => res.json());

// Завершить задачу и получить XP
const result = await fetch(`http://localhost:3000/api/tasks/${taskId}/complete`, {
  method: 'POST'
}).then(res => res.json());

console.log(`Получено ${result.xpGained} XP`);
if (result.leveledUp) {
  console.log(`Новый уровень: ${result.user.level}!`);
}

// Получить данные пользователя
const user = await fetch('http://localhost:3000/api/user')
  .then(res => res.json());
console.log(`Уровень ${user.level}, XP: ${user.xp}`);
```

---

## Хранение данных

В текущей версии данные хранятся в памяти (in-memory). При перезапуске сервера все задачи и прогресс пользователя будут потеряны.

**Планируется:** интеграция с Firebase Firestore для постоянного хранения.

---

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": "Описание ошибки"
}
```

**Типичные ошибки:**
- `400 Bad Request` - невалидные данные в запросе
- `404 Not Found` - ресурс не найден
- `500 Internal Server Error` - внутренняя ошибка сервера
