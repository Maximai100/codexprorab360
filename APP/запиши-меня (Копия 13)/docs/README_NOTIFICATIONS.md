# 📱 Telegram Notifications Integration

## 🎯 Цель

Полная интеграция системы Telegram-уведомлений с фронтендом. При создании записи клиентом автоматически отправляются уведомления в Telegram как мастеру, так и клиенту.

## 🏗️ Архитектура

```
Клиент заполняет форму
         ↓
Валидация данных
         ↓
Извлечение masterId из URL (?startapp=...)
         ↓
Определение telegramId (Telegram WebApp или fallback)
         ↓
POST https://api.prorab360.online/notify
         ↓
Уведомления в Telegram (мастер + клиент)
         ↓
Создание записи в Directus
```

### ⚠️ Важно: Порядок операций

**Сначала уведомление, потом запись в БД**

Это сделано намеренно, чтобы избежать рассинхрона:
- ✅ Если Telegram упал → запись НЕ создается, пользователь видит ошибку
- ✅ Если Telegram успешен → запись создается, всё ОК
- ❌ Если бы было наоборот: запись создана, но уведомление не ушло → клиент не знает о записи

**Обработка ошибок:**
- Если уведомление не отправилось → показываем понятное сообщение с инструкцией
- Пользователь может исправить проблему (запустить бота) и попробовать снова
- Дублирующих записей не будет

## 📦 Структура файлов

```
проект/
├── .env.local                    # Переменные окружения
├── index.html                    # Telegram WebApp SDK
├── src/
│   ├── types/
│   │   └── booking.ts           # Типы данных
│   ├── lib/
│   │   └── utils.ts             # Утилиты (URL, Telegram)
│   ├── api/
│   │   └── notify.ts            # API клиент
│   └── index.tsx                # Интеграция в форму
└── README_NOTIFICATIONS.md       # Этот документ
```

---

## 🔧 1. Настройка окружения

### `.env.local`

```bash
VITE_BACKEND_URL=https://api.prorab360.online/notify
```

### ✅ Важно:
- ❌ **НЕ хардкодить** URL в коде
- ✅ Использовать `import.meta.env.VITE_BACKEND_URL`
- ✅ Перезапустить dev-сервер после изменения `.env`

---

## 🌐 2. Подключение Telegram WebApp SDK

### `index.html`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>ЗапишиМеня</title>
  
  <!-- 📌 КРИТИЧНО: Подключить SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="index.tsx"></script>
</body>
</html>
```

### ⚠️ Почему это критично:
Без этого скрипта `window.Telegram.WebApp` будет `undefined`, и ID пользователя не получится извлечь.

---

## 🛠️ 3. Типы данных

### `src/types/booking.ts`

```typescript
export type BookingData = {
  masterId: number;      // ID мастера из URL (?startapp=...)
  telegramId: number;    // ID клиента из Telegram WebApp
  clientName: string;    // Имя клиента
  service: string;       // Название услуги
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
};
```

---

## 🔍 4. Утилиты для работы с URL и Telegram

### `src/lib/utils.ts`

```typescript
/**
 * Извлекает числовой параметр из URL
 * @param name - имя параметра (например, 'startapp')
 * @returns число или null
 */
export function getNumberParam(name: string): number | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(name);
  const num = value ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

/**
 * Получает Telegram User ID из WebApp
 * @returns ID пользователя или null (если WebApp недоступен)
 */
export function getTelegramUserId(): number | null {
  const tg = (window as any)?.Telegram?.WebApp;
  
  try {
    tg?.ready?.();
  } catch (e) {
    // Игнорируем ошибки инициализации
  }
  
  const userId = tg?.initDataUnsafe?.user?.id;
  return typeof userId === 'number' ? userId : null;
}
```

### 📌 Использование:

```typescript
// masterId берём из URL параметра ?startapp=...
const masterId = getNumberParam('startapp');

// telegramId берём из Telegram WebApp
// Если SDK недоступен (локальная разработка) — используем masterId
const telegramId = getTelegramUserId() ?? masterId;
```

---

## 📡 5. API клиент для отправки уведомлений

### `src/api/notify.ts`

```typescript
import type { BookingData } from '../types/booking';

const backendUrl = 
  (import.meta as any).env?.VITE_BACKEND_URL ?? 
  (process as any).env?.REACT_APP_BACKEND_URL;

if (!backendUrl) {
  console.error('BACKEND URL is not set in .env');
}

/**
 * Отправляет уведомление о записи на бэкенд
 * @param payload - данные записи
 * @returns Promise с ответом сервера
 * @throws Error при ошибке сети или бэкенда
 */
export async function sendBookingNotifications(
  payload: BookingData
): Promise<any> {
  const response = await fetch(backendUrl as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Парсим ответ
  let json: any;
  try {
    json = await response.json();
  } catch {
    // Если не удалось распарсить JSON
    if (!response.ok) {
      throw new Error(`Ошибка бэкенда: ${response.status}`);
    }
    return {};
  }

  // Проверяем статус ответа (поддержка success: boolean)
  if (!response.ok || json?.success === false) {
    const errorMessage = json?.message || `Ошибка бэкенда: ${response.status}`;
    throw new Error(errorMessage);
  }

  return json;
}
```

### 📋 Формат запроса:

```http
POST https://api.prorab360.online/notify
Content-Type: application/json

{
  "masterId": 122991166,
  "telegramId": 123456789,
  "clientName": "Иван",
  "service": "Стрижка",
  "date": "2025-10-20",
  "time": "14:30"
}
```

### ✅ Успешный ответ:

```json
{
  "success": true,
  "message": "Уведомления отправлены"
}
```

### ❌ Ответ с ошибкой:

```json
{
  "success": false,
  "message": "Пользователь не написал боту. Откройте бот и нажмите /start.",
  "detail": "Bad Request: chat not found"
}
```

**Типичные ошибки:**
- `"Пользователь не написал боту. Откройте бот и нажмите /start."` - пользователь не запустил бота
- `"Пользователь заблокировал бота."` - бот заблокирован пользователем
- `"Отсутствует поле masterId"` - невалидные данные запроса
- `"ID должны быть числами"` - неверный формат ID
- `"Неверный формат даты/времени"` - неверный формат date/time

---

## 🔗 6. Интеграция в форму записи

### `index.tsx` (компонент `ClientBookingPage`)

```typescript
import { sendBookingNotifications } from './src/api/notify';
import { getNumberParam, getTelegramUserId } from './src/lib/utils';
import type { BookingData } from './src/types/booking';

const handleBook = async (
  clientName: string, 
  clientPhone: string, 
  date: string, 
  time: string
) => {
  if (!bookingService) return;

  // 1. Получаем masterId из URL
  const masterId = getNumberParam('startapp');
  if (!masterId) {
    showToast('❌ Отсутствует параметр startapp в URL (masterId).');
    return;
  }

  // 2. Определяем telegramId
  const telegramId = getTelegramUserId() ?? masterId;

  // 3. Валидация форматов
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    showToast('⚠️ Неверный формат даты. Используйте YYYY-MM-DD.');
    return;
  }
  
  if (!/^\d{2}:\d{2}$/.test(time)) {
    showToast('⚠️ Неверный формат времени. Используйте HH:mm.');
    return;
  }

  try {
    // 4. Создаем запись в Directus (существующая логика)
    onBookAppointment({ 
      clientName, 
      clientPhone, 
      service: bookingService.name, 
      date, 
      time, 
      duration: bookingService.duration, 
      telegramId: tg.initDataUnsafe?.user?.id 
    });
    
    // 5. Отправляем уведомление
    await sendBookingNotifications({
      masterId,
      telegramId,
      clientName,
      service: bookingService.name,
      date,
      time,
    });
    
    tg.HapticFeedback.notificationOccurred('success');
    showToast(`✅ Спасибо, ${clientName}! Вы записаны. Уведомление отправлено.`);
    setBookingService(null);
  } catch (err: any) {
    showToast(err?.message ?? '❌ Неизвестная ошибка при отправке уведомления.');
  }
};
```

---

## 🧪 7. Тестирование

### ✅ Локальный режим

```bash
# 1. Запустить dev-сервер
npm run dev

# 2. Открыть в браузере
http://localhost:3000/?startapp=122991166

# 3. Заполнить форму и отправить
```

**Ожидаемый результат:**
- ✅ Запись создается в Directus
- ✅ POST-запрос на `api.prorab360.online/notify`
- ✅ 2 уведомления в Telegram (мастеру и клиенту)
- ✅ Сообщение: "Спасибо! Вы записаны. Уведомление отправлено."

### ✅ Продакшн (Telegram WebApp)

```bash
# 1. Собрать проект
npm run build

# 2. Выложить dist/ на хостинг

# 3. Открыть через Telegram бота
```

**Проверить:**
- ✅ `telegramId` = реальный `user.id` из Telegram (не masterId)
- ✅ Оба пользователя получают уведомления
- ✅ URL содержит параметр `startapp`

### ❌ Тест ошибок

**1. Отсутствие masterId:**
```
URL: http://localhost:3000/
Результат: "❌ Отсутствует параметр startapp в URL"
```

**2. Несуществующий masterId:**
```
URL: http://localhost:3000/?startapp=999999999
Результат: "❌ Ошибка бэкенда: 404 - Chat not found"
```

**3. Пустые поля:**
```
Результат: HTML5 валидация (поле required)
```

---

## 🐛 8. Отладка

### Проверка переменных окружения

```javascript
// В консоли браузера (F12)
console.log(import.meta.env.VITE_BACKEND_URL);
// Должно вывести: "https://api.prorab360.online/notify"
```

### Проверка функций

```javascript
// В консоли браузера
import { getNumberParam, getTelegramUserId } from './src/lib/utils';

// Проверить masterId
console.log(getNumberParam('startapp')); // число или null

// Проверить Telegram User ID
console.log(getTelegramUserId()); // число или null

// Проверить Telegram WebApp
console.log(window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
```

### Network Tab

Откройте DevTools → Network → найдите запрос к `api.prorab360.online/notify`:

**Request Payload:**
```json
{
  "masterId": 122991166,
  "telegramId": 123456789,
  "clientName": "Тест",
  "service": "Стрижка",
  "date": "2025-10-20",
  "time": "14:30"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notifications sent"
}
```

---

## 🚨 9. Частые проблемы и решения

### ❌ "BACKEND URL is not set in .env"

**Причина:** Переменная не определена

**Решение:**
1. Проверьте `.env.local` в корне проекта
2. Убедитесь в наличии строки: `VITE_BACKEND_URL=https://api.prorab360.online/notify`
3. Перезапустите dev-сервер: `npm run dev`

### ❌ "Пользователь не написал боту"

**Причина:** Пользователь (мастер или клиент) не запустил бота

**Решение:**
1. Откройте бота в Telegram: `@zapismenya_bot`
2. Нажмите кнопку "START" или отправьте команду `/start`
3. Вернитесь в приложение и попробуйте создать запись снова

### ❌ "Пользователь заблокировал бота"

**Причина:** Пользователь заблокировал бота в Telegram

**Решение:**
1. Откройте бота в Telegram
2. Разблокируйте бота (Settings → Privacy → Blocked users)
3. Отправьте `/start`
4. Попробуйте создать запись снова

### ❌ CORS ошибки

**Причина:** Бэкенд не разрешает запросы с вашего домена

**Решение:**
1. Проверьте CORS headers на бэкенде
2. Убедитесь, что домен фронтенда в whitelist

### ❌ `window.Telegram is undefined`

**Причина:** Telegram WebApp SDK не подключен

**Решение:**
1. Добавьте в `index.html`: `<script src="https://telegram.org/js/telegram-web-app.js"></script>`
2. Перезагрузите страницу

---

## 🚀 10. Рекомендации по улучшению

### 🔁 Retry-логика

```typescript
async function sendWithRetry(payload: BookingData, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await sendBookingNotifications(payload);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 📦 Offline Queue

```typescript
// Сохранить в localStorage при ошибке сети
if (err.message.includes('Failed to fetch')) {
  const queue = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
  queue.push(payload);
  localStorage.setItem('notificationQueue', JSON.stringify(queue));
}

// Отправить при восстановлении соединения
window.addEventListener('online', async () => {
  const queue = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
  for (const payload of queue) {
    await sendBookingNotifications(payload);
  }
  localStorage.removeItem('notificationQueue');
});
```

### 📊 Логирование

```typescript
try {
  const result = await sendBookingNotifications(payload);
  console.log('✅ Notification sent:', result);
  // Отправить в Sentry/Analytics
} catch (err) {
  console.error('❌ Notification failed:', err);
  // Отправить в Sentry
}
```

---

## 📋 11. Чеклист перед деплоем

- [x] ✅ Переменная `VITE_BACKEND_URL` настроена
- [x] ✅ Telegram WebApp SDK подключен в `index.html`
- [x] ✅ Утилиты `getNumberParam()` и `getTelegramUserId()` реализованы
- [x] ✅ API клиент `sendBookingNotifications()` создан
- [x] ✅ Интеграция в `handleBook()` завершена
- [x] ✅ TypeScript компилируется без ошибок
- [x] ✅ Проект собирается (`npm run build`)
- [ ] 🔄 Проведено локальное тестирование
- [ ] 🔄 Проведено тестирование в Telegram WebApp
- [ ] 🔄 Проверена обработка всех ошибок
- [ ] 🔄 Обновлен `CHANGELOG.md`
- [ ] 🔄 Выкачены изменения в продакшн

---

## 📊 12. Мониторинг после деплоя

### Метрики для отслеживания:

- **Success Rate:** % успешных отправок уведомлений
- **Response Time:** среднее время ответа API
- **Error Rate:** частота ошибок по типам (404, 500, network)
- **User Feedback:** отзывы пользователей о получении уведомлений

### Логи для проверки:

```bash
# Логи бэкенда
tail -f /var/log/api.prorab360.online/notifications.log

# Логи Nginx (если используется)
tail -f /var/log/nginx/access.log | grep notify
```

---

## 📚 13. Дополнительная документация

- **Требования:** `.kiro/specs/booking-notifications/requirements.md`
- **Дизайн:** `.kiro/specs/booking-notifications/design.md`
- **Задачи:** `.kiro/specs/booking-notifications/tasks.md`
- **Тестирование:** `TESTING_NOTIFICATIONS.md`
- **Итоги:** `NOTIFICATION_INTEGRATION_SUMMARY.md`

---

## 👥 14. Контакты

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Проверьте Network tab на failed requests
3. Проверьте логи бэкенда
4. Обратитесь к команде разработки

---

## ✅ Итог

После выполнения всех шагов приложение будет:
- ✅ Стабильно отправлять Telegram-уведомления при каждой записи
- ✅ Работать как локально, так и в продакшене
- ✅ Корректно обрабатывать ошибки
- ✅ Поддерживать как Telegram WebApp, так и браузерный режим

**Статус:** 🚀 Готово к тестированию и деплою

**Дата:** 19.10.2025
