# XP System Implementation

## ✅ Реализовано

### 1. Backend: User с XP и Level

**Файл:** `server.ts`

```typescript
interface User {
  xp: number;
  level: number;
}

let user: User = {
  xp: 0,
  level: 1
};
```

### 2. Формула расчета уровня

```typescript
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}
```

**Примеры:**
- 0 XP → Level 1
- 100 XP → Level 2
- 200 XP → Level 3
- 1000 XP → Level 11

### 3. Функция начисления XP

```typescript
function addXP(amount: number): { xpGained: number; leveledUp: boolean } {
  const oldLevel = user.level;
  user.xp += amount;
  user.level = calculateLevel(user.xp);
  
  return {
    xpGained: amount,
    leveledUp: user.level > oldLevel
  };
}
```

### 4. Обновленный endpoint завершения задачи

**POST** `/api/tasks/:id/complete`

**Response:**
```json
{
  "task": {
    "id": "123",
    "title": "Задача",
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

### 5. Новый endpoint для получения пользователя

**GET** `/api/user`

**Response:**
```json
{
  "xp": 110,
  "level": 2
}
```

### 6. Frontend: Отображение XP и уровня

**Файл:** `src/components/Tasks.tsx`

**Добавлено:**
- Карточка с уровнем и XP пользователя
- Прогресс-бар до следующего уровня
- Анимация "+X XP" при завершении задачи
- Анимация "Level Up!" при повышении уровня
- Загрузка данных пользователя при монтировании

### 7. Типы TypeScript

**Файл:** `src/types/task.ts`

```typescript
export interface User {
  xp: number;
  level: number;
}

export interface CompleteTaskResponse {
  task: Task;
  user: User;
  xpGained: number;
  leveledUp: boolean;
}
```

### 8. API Client

**Файл:** `src/api/tasks.ts`

**Добавлено:**
- `getUser()` - получить данные пользователя
- Обновлен `completeTask()` - возвращает `CompleteTaskResponse`

---

## Архитектура XP системы

```
┌─────────────────────────────────────────┐
│           Frontend (Tasks.tsx)          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  User Stats Card                │   │
│  │  - Level badge                  │   │
│  │  - XP progress bar              │   │
│  │  - Total XP display             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Animations                     │   │
│  │  - "+X XP" notification         │   │
│  │  - "Level Up!" modal            │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               │ completeTask(id)
               ▼
┌─────────────────────────────────────────┐
│        API Client (tasks.ts)            │
│                                         │
│  POST /api/tasks/:id/complete           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Backend (server.ts)             │
│                                         │
│  1. Найти задачу                        │
│  2. Отметить completed = true           │
│  3. addXP(task.xp)                      │
│     - user.xp += task.xp                │
│     - user.level = calculateLevel(xp)   │
│     - проверить leveledUp               │
│  4. Вернуть CompleteTaskResponse        │
└─────────────────────────────────────────┘
```

---

## Пример работы системы

### Сценарий 1: Обычное завершение задачи

**Начальное состояние:**
- User: `{ xp: 50, level: 1 }`
- Task: `{ xp: 10 }`

**Действие:** Завершить задачу

**Результат:**
```json
{
  "task": { "completed": true, "xp": 10 },
  "user": { "xp": 60, "level": 1 },
  "xpGained": 10,
  "leveledUp": false
}
```

**UI:**
- Показывается "+10 XP"
- Прогресс-бар обновляется: 60/100

---

### Сценарий 2: Повышение уровня

**Начальное состояние:**
- User: `{ xp: 95, level: 1 }`
- Task: `{ xp: 10 }`

**Действие:** Завершить задачу

**Результат:**
```json
{
  "task": { "completed": true, "xp": 10 },
  "user": { "xp": 105, "level": 2 },
  "xpGained": 10,
  "leveledUp": true
}
```

**UI:**
- Показывается "+10 XP"
- Показывается "Level Up! Уровень 2"
- Прогресс-бар обновляется: 5/100 (105 - 100)
- Бейдж уровня меняется с 1 на 2

---

## UI Компоненты

### 1. User Stats Card

```tsx
<div className="bento-card">
  <div className="flex items-center gap-3">
    <div className="level-badge">{user.level}</div>
    <div>
      <h3>Уровень {user.level}</h3>
      <p>{user.xp} / {nextLevelXP} XP</p>
    </div>
  </div>
  <ProgressBar percent={progressPercent} />
</div>
```

### 2. XP Notification

```tsx
<motion.div className="xp-notification">
  <Sparkles />
  <span>+{earnedXP} XP</span>
</motion.div>
```

### 3. Level Up Modal

```tsx
<motion.div className="level-up-modal">
  <TrendingUp size={48} />
  <h3>Level Up!</h3>
  <p>Уровень {user.level}</p>
</motion.div>
```

---

## Формулы и константы

### Расчет уровня
```
level = floor(xp / 100) + 1
```

### XP для следующего уровня
```
nextLevelXP = level * 100
```

### Прогресс до следующего уровня
```
currentLevelXP = (level - 1) * 100
progressXP = xp - currentLevelXP
progressPercent = (progressXP / 100) * 100
```

### Константы
- `DEFAULT_TASK_XP = 10`
- `XP_PER_LEVEL = 100`

---

## Тестирование

### Тест 1: Начисление XP
```bash
# Создать задачу
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "xp": 25}'

# Завершить задачу
curl -X POST http://localhost:3000/api/tasks/{id}/complete

# Проверить пользователя
curl http://localhost:3000/api/user
# Ожидается: { "xp": 25, "level": 1 }
```

### Тест 2: Повышение уровня
```bash
# Создать 10 задач по 10 XP и завершить их
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/tasks \
    -H "Content-Type: application/json" \
    -d '{"title": "Task '$i'"}'
  
  # Завершить последнюю задачу
done

# Проверить пользователя
curl http://localhost:3000/api/user
# Ожидается: { "xp": 100, "level": 2 }
```

---

## Следующие шаги (опционально)

1. **Персистентность данных**
   - Сохранять user в Firebase/Firestore
   - Восстанавливать при загрузке

2. **Дополнительные фичи**
   - История получения XP
   - Достижения за уровни
   - Бонусы за streak (серии выполненных задач)

3. **Улучшение формулы**
   - Экспоненциальный рост сложности
   - Разные категории задач с разным XP

4. **Интеграция со статами**
   - Начисление очков характеристик при level up
   - Влияние характеристик на получаемый XP
