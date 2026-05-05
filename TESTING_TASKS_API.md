# Тестирование Tasks API

## Запуск сервера

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

---

## Тестирование через curl

### 1. Получить все задачи

```bash
curl http://localhost:3000/api/tasks
```

**Ожидаемый результат:** `[]` (пустой массив)

---

### 2. Создать задачу

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Сделать зарядку"}'
```

**Ожидаемый результат:**
```json
{
  "id": "1234567890",
  "title": "Сделать зарядку",
  "completed": false,
  "xp": 10
}
```

---

### 3. Создать задачу с кастомным XP

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Пробежать 5км", "xp": 25}'
```

**Ожидаемый результат:**
```json
{
  "id": "1234567891",
  "title": "Пробежать 5км",
  "completed": false,
  "xp": 25
}
```

---

### 4. Завершить задачу

```bash
# Замените {id} на реальный ID из предыдущего запроса
curl -X POST http://localhost:3000/api/tasks/{id}/complete
```

**Ожидаемый результат:**
```json
{
  "id": "1234567890",
  "title": "Сделать зарядку",
  "completed": true,
  "xp": 10
}
```

---

### 5. Проверить валидацию (пустой title)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

**Ожидаемый результат:**
```json
{
  "error": "Title is required"
}
```

**Status Code:** 400

---

### 6. Попытка завершить несуществующую задачу

```bash
curl -X POST http://localhost:3000/api/tasks/999999/complete
```

**Ожидаемый результат:**
```json
{
  "error": "Task not found"
}
```

**Status Code:** 404

---

### 7. Попытка завершить уже завершенную задачу

```bash
# Завершите задачу дважды с одним и тем же ID
curl -X POST http://localhost:3000/api/tasks/{id}/complete
curl -X POST http://localhost:3000/api/tasks/{id}/complete
```

**Ожидаемый результат (второй запрос):**
```json
{
  "error": "Task already completed"
}
```

**Status Code:** 400

---

## Тестирование через Frontend

1. Запустите сервер: `npm run dev`
2. Откройте браузер: `http://localhost:3000`
3. Перейдите на вкладку "Квесты"
4. Создайте несколько задач
5. Завершите задачу - должно появиться уведомление "+10 XP"
6. Проверьте, что XP отображается в бейдже каждой задачи

---

## Тестирование через Postman/Insomnia

### Collection для Postman

```json
{
  "info": {
    "name": "Tasks API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Tasks",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/tasks"
      }
    },
    {
      "name": "Create Task",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/tasks",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"title\": \"Test Task\", \"xp\": 15}"
        }
      }
    },
    {
      "name": "Complete Task",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/tasks/{{taskId}}/complete"
      }
    }
  ]
}
```

---

## Проверка TypeScript типов

```bash
npm run lint
```

Должно пройти без ошибок.

---

## Чек-лист тестирования

- [ ] Сервер запускается без ошибок
- [ ] GET /api/tasks возвращает пустой массив
- [ ] POST /api/tasks создает задачу с XP=10 по умолчанию
- [ ] POST /api/tasks с xp создает задачу с кастомным XP
- [ ] POST /api/tasks/:id/complete завершает задачу
- [ ] Валидация: пустой title возвращает 400
- [ ] Валидация: несуществующий ID возвращает 404
- [ ] Валидация: повторное завершение возвращает 400
- [ ] Frontend отображает задачи корректно
- [ ] Frontend показывает уведомление "+X XP" при завершении
- [ ] TypeScript компилируется без ошибок
