# Исправление кнопки "Напомнить"

## Проблема
При нажатии кнопки "Напомнить" в панели мастера появлялась ошибка: **"Отсутствуют обязательные поля"**

## Причина
Фронтенд отправлял напоминания на эндпоинт `/booking`, который предназначен для создания новых записей. Этот эндпоинт имеет другие требования к полям и формату данных.

Для отправки напоминаний существует отдельный эндпоинт `/notify`, который ожидает:
- `masterId` (Telegram ID мастера)
- `telegramId` (Telegram ID клиента)
- `clientName` (имя клиента)
- `service` (название услуги)
- `date` (дата в формате YYYY-MM-DD)
- `time` (время в формате HH:MM)
- `notificationType` (тип уведомления: 'reminder')

## Решение

### 1. Изменен базовый URL в `src/api/notify.ts`
```typescript
// Было:
const DEFAULT_BACKEND_URL = 'https://api.prorab360.online/booking';

// Стало:
const DEFAULT_BACKEND_URL = 'https://api.prorab360.online';
```

### 2. Добавлена логика выбора эндпоинта
Теперь функция `sendBookingNotifications` определяет правильный эндпоинт в зависимости от типа уведомления:
- Для напоминаний (`notificationType: 'reminder'`) → `/notify`
- Для бронирований → `/booking`

### 3. Добавлено поле `serviceName` в тип `BookingData`
```typescript
export type BookingData = {
  // ... другие поля
  serviceName?: string; // Название услуги для уведомлений
};
```

### 4. Обновлен код отправки напоминания в `index.tsx`
Теперь передается название услуги через поле `serviceName`:
```typescript
await sendBookingNotifications({
    masterId: Number(masterTelegramChatId),
    masterName: bookingMasterName,
    serviceName: appointment.service || 'Услуга', // Название услуги
    clientName: appointment.clientName,
    clientPhone,
    clientTelegramId: appointment.telegramId!,
    serviceId,
    dateTime: dateTimeISO,
    notificationType: 'reminder',
});
```

### 5. Преобразование формата данных для `/notify`
Для эндпоинта `/notify` данные преобразуются из ISO формата в нужный:
- `dateTime` (ISO) → `date` (YYYY-MM-DD) + `time` (HH:MM)
- `serviceName` → `service` (название услуги)
- `clientTelegramId` → `telegramId`

## Дополнительное исправление: Логика выбора эндпоинта

### Проблема
После первого исправления появилась ошибка "эндпоинт не найден". Причина: код добавлял `/notify` к URL, который уже содержал `/notify`:
```
backendUrl = 'https://api.prorab360.online/notify'
endpoint = `${backendUrl}/notify` 
// Результат: https://api.prorab360.online/notify/notify ❌
```

### Решение
Изменена логика формирования эндпоинта в `src/api/notify.ts`:

```typescript
// backendUrl по умолчанию указывает на /notify
const DEFAULT_BACKEND_URL = 'https://api.prorab360.online/notify';

// Для напоминаний используем URL как есть
// Для бронирований заменяем /notify на /booking
const endpoint = isReminder 
  ? backendUrl 
  : backendUrl.replace('/notify', '/booking');
```

Теперь формируются правильные URL:
- Для напоминаний: `https://api.prorab360.online/notify` ✅
- Для бронирований: `https://api.prorab360.online/booking` ✅

### Важно
`.env.local` и переменная окружения на Vercel должны содержать полный путь:
```
VITE_BACKEND_URL=https://api.prorab360.online/notify
```

## Результат
Теперь кнопка "Напомнить" корректно отправляет напоминания клиентам через правильный эндпоинт с правильным форматом данных.
