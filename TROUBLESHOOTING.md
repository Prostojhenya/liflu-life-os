# Решение проблем с авторизацией

## Как проверить логи Vercel

1. Перейдите на https://vercel.com/dashboard
2. Выберите проект `liflu-life-os`
3. Перейдите на вкладку "Logs"
4. Выберите последний деплой
5. Проверьте Runtime Logs на наличие ошибок

## Частые проблемы с авторизацией на мобильных

### 1. Домен не добавлен в Firebase
- Перейдите в Firebase Console → Authentication → Settings → Authorized domains
- Убедитесь, что добавлен домен: `liflu-life-os.vercel.app`

### 2. Переменные окружения не настроены
- Vercel Dashboard → Settings → Environment Variables
- Проверьте наличие `GEMINI_API_KEY`

### 3. Правила Firestore
Правила уже обновлены через Firebase CLI. Проверить можно:
- Firebase Console → Firestore Database → Rules
- Должна быть строка: `allow create: if isSignedIn() && isValidSpace(incoming()) && incoming().ownerId == request.auth.uid;`

### 4. Кэш браузера на телефоне
- Очистите кэш браузера на телефоне
- Попробуйте в режиме инкогнито
- Перезагрузите страницу

### 5. CORS проблемы
Если в логах видите CORS ошибки, проверьте:
- Firebase Console → Authentication → Settings → Authorized domains
- Все домены должны быть добавлены без протокола (http/https)

## Проверка работы локально

```bash
npm run dev
```

Откройте http://localhost:3000 и проверьте авторизацию.

## Текущий статус

- ✅ Правила Firestore обновлены
- ✅ PWA манифест исправлен
- ⏳ Ожидается push на GitHub (GitHub временно недоступен)
- ⏳ После push Vercel автоматически задеплоит обновления

## Команды для ручного обновления

Когда GitHub заработает:

```bash
git push origin main --force
```

Или создайте новый коммит:

```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```
