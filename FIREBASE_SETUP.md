# Настройка Firebase

## Обновление правил Firestore

Правила безопасности нужно обновить в Firebase Console:

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `craftycode-mze7r`
3. Firestore Database → Rules
4. Скопируйте содержимое файла `firestore.rules` из проекта
5. Вставьте в редактор правил
6. Нажмите "Publish"

## Или через Firebase CLI

Если установлен Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use craftycode-mze7r
firebase deploy --only firestore:rules
```

## Проверка

После обновления правил новые пользователи смогут:
- Войти через Google
- Создать свое личное пространство
- Начать работу с задачами, привычками и целями
