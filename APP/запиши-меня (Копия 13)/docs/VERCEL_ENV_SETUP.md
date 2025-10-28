# Настройка переменных окружения на Vercel

## Проблема
Приложение на Vercel не может найти `VITE_BACKEND_URL`, потому что переменные окружения из `.env.local` не попадают в production build.

## Решение

### Вариант 1: Через веб-интерфейс Vercel (рекомендуется)

1. **Открой проект на Vercel:**
   - Перейди на https://vercel.com/dashboard
   - Найди проект `zapishi-menya`

2. **Добавь переменную окружения:**
   - Перейди в **Settings** → **Environment Variables**
   - Нажми **Add New**
   - Заполни:
     - **Name**: `VITE_BACKEND_URL`
     - **Value**: `https://api.prorab360.online/notify`
     - **Environments**: выбери все три (Production, Preview, Development)
   - Нажми **Save**

3. **Также добавь переменную для Directus:**
   - **Name**: `VITE_DIRECTUS_API_URL`
   - **Value**: `https://1.cycloscope.online`
   - **Environments**: выбери все три
   - Нажми **Save**

4. **Передеплой проект:**
   - Перейди в **Deployments**
   - Найди последний деплой
   - Нажми на три точки (⋮)
   - Выбери **Redeploy**
   - Подтверди

### Вариант 2: Через Vercel CLI

```bash
# Добавить переменную для production
vercel env add VITE_BACKEND_URL production
# Введи: https://api.prorab360.online/notify

# Добавить для preview
vercel env add VITE_BACKEND_URL preview
# Введи: https://api.prorab360.online/notify

# Добавить для development
vercel env add VITE_BACKEND_URL development
# Введи: https://api.prorab360.online/notify

# То же самое для Directus
vercel env add VITE_DIRECTUS_API_URL production
# Введи: https://1.cycloscope.online

vercel env add VITE_DIRECTUS_API_URL preview
# Введи: https://1.cycloscope.online

vercel env add VITE_DIRECTUS_API_URL development
# Введи: https://1.cycloscope.online

# Передеплой
vercel --prod
```

### Вариант 3: Через vercel.json (автоматически)

Создай файл `vercel.json` в корне проекта:

```json
{
  "env": {
    "VITE_BACKEND_URL": "https://api.prorab360.online/notify",
    "VITE_DIRECTUS_API_URL": "https://1.cycloscope.online"
  }
}
```

Затем закоммить и запушить:
```bash
git add vercel.json
git commit -m "Add environment variables"
git push
```

## Проверка

После передеплоя:
1. Открой приложение на Vercel
2. Открой консоль браузера (F12)
3. Должны увидеть:
   ```
   🔧 Backend URL загружен: https://api.prorab360.online/notify
   ```

## Важно

⚠️ **Файл `.env.local` работает только локально!** Для production на Vercel нужно настраивать переменные окружения через интерфейс Vercel или `vercel.json`.

## Альтернатива: Hardcode для production

Если не хочешь настраивать переменные на Vercel, можно захардкодить URL в коде:

```typescript
// src/api/notify.ts
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.prorab360.online/notify';
```

Но это не рекомендуется для безопасности и гибкости.
