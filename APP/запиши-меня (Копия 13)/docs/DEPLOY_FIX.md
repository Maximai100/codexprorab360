# Инструкция по деплою исправления на Vercel

## Проблема
После исправления кода локально, на продакшене (Vercel) все еще используется старая версия с неправильным URL:
```
https://api.prorab360.online/notify/notify ❌
```

## Причина
На Vercel установлена переменная окружения `VITE_BACKEND_URL` со значением `https://api.prorab360.online/notify`, которая переопределяет локальный `.env.local`.

## Решение

### Вариант 1: Обновить переменные окружения на Vercel (Рекомендуется)

1. Зайдите в настройки проекта на Vercel
2. Перейдите в раздел **Settings** → **Environment Variables**
3. Найдите переменную `VITE_BACKEND_URL`
4. Измените её значение с:
   ```
   https://api.prorab360.online/notify
   ```
   на:
   ```
   https://api.prorab360.online
   ```
5. Сохраните изменения
6. Перейдите в раздел **Deployments**
7. Нажмите на последний деплой → **Redeploy** → **Redeploy**

### Вариант 2: Задеплоить новую версию

Если вы внесли изменения в код:

```bash
git add .
git commit -m "fix: исправлен URL для эндпоинта напоминаний"
git push origin main
```

Vercel автоматически задеплоит новую версию.

### Вариант 3: Удалить переменную окружения на Vercel

Если переменная `VITE_BACKEND_URL` не нужна на Vercel (используется fallback):

1. Зайдите в **Settings** → **Environment Variables**
2. Удалите переменную `VITE_BACKEND_URL`
3. Redeploy проект

Код будет использовать fallback значение из `notify.ts`:
```typescript
const DEFAULT_BACKEND_URL = 'https://api.prorab360.online';
```

## Проверка

После деплоя откройте консоль браузера и проверьте логи при нажатии кнопки "Напомнить":

Должно быть:
```
📍 URL эндпоинта: https://api.prorab360.online
📍 Выбран эндпоинт: https://api.prorab360.online/notify ✅
```

Не должно быть:
```
📍 Выбран эндпоинт: https://api.prorab360.online/notify/notify ❌
```

## Дополнительно: Локальная проверка

Чтобы проверить локально перед деплоем:

```bash
# Собрать проект
npm run build

# Запустить preview
npm run preview
```

Откройте приложение в браузере и проверьте работу кнопки "Напомнить".
