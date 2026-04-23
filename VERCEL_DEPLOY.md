# Деплой на Vercel

## Шаги для деплоя:

### 1. Установите Vercel CLI (если еще не установлен)
```bash
npm install -g vercel
```

### 2. Войдите в Vercel
```bash
vercel login
```

### 3. Деплой проекта
```bash
vercel
```

Или для продакшн деплоя:
```bash
vercel --prod
```

### 4. Настройте переменные окружения в Vercel

После первого деплоя, добавьте переменные окружения через:
- Vercel Dashboard: https://vercel.com/dashboard
- Выберите ваш проект
- Settings → Environment Variables
- Добавьте:

```
GEMINI_API_KEY=AIzaSyCEgKUQkUFCAvJxh9l3mFnmcxANs_7HfS4
```

### 5. Redeploy после добавления переменных

После добавления переменных окружения, сделайте redeploy:
```bash
vercel --prod
```

## Альтернативный способ через GitHub

1. Подключите репозиторий к Vercel через GitHub
2. Vercel автоматически будет деплоить при каждом push
3. Не забудьте добавить `GEMINI_API_KEY` в Environment Variables

## Важно:

- Файл `.env` не попадет в репозиторий (он в `.gitignore`)
- Переменные окружения нужно добавить вручную в Vercel Dashboard
- Firebase конфигурация уже в `firebase-applet-config.json` и будет работать автоматически
