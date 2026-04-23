# Деплой на Vercel

## Шаги для развертывания:

### 1. Установите Vercel CLI (если еще не установлен)
```bash
npm install -g vercel
```

### 2. Войдите в Vercel
```bash
vercel login
```

### 3. Разверните проект
```bash
vercel
```

При первом деплое Vercel задаст несколько вопросов:
- Set up and deploy? → Yes
- Which scope? → Выберите ваш аккаунт
- Link to existing project? → No
- What's your project's name? → liflu (или любое другое имя)
- In which directory is your code located? → ./
- Want to override the settings? → No

### 4. Для production деплоя
```bash
vercel --prod
```

## Настройка переменных окружения

После деплоя добавьте переменные окружения в Vercel Dashboard:

1. Перейдите на https://vercel.com/dashboard
2. Выберите ваш проект
3. Settings → Environment Variables
4. Добавьте:
   - `GEMINI_API_KEY` - ваш API ключ Gemini

## Настройка Firebase

После получения URL от Vercel (например, `your-app.vercel.app`):

1. Перейдите в Firebase Console
2. Authentication → Settings → Authorized domains
3. Добавьте ваш Vercel домен: `your-app.vercel.app`

## Автоматический деплой через Git

Для автоматического деплоя при push в GitHub:

1. Перейдите на https://vercel.com/new
2. Import Git Repository
3. Выберите ваш репозиторий
4. Vercel автоматически настроит деплой

Каждый push в main ветку будет автоматически деплоиться.
