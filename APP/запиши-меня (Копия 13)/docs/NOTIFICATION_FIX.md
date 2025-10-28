# Исправление отправки уведомлений мастерам

## Проблема
Уведомления не приходили мастерам, потому что в `masterId` передавался внутренний ID из Directus вместо реального `chat_id` из Telegram.

## Что исправлено

### 1. ✅ Используется правильный telegramId мастера

**Было:**
```typescript
setMasterId(Number(masterData.id)); // Внутренний ID из Directus
```

**Стало:**
```typescript
setMasterId(Number(masterData.telegramId)); // Реальный chat_id из Telegram
```

Теперь в состоянии `masterId` хранится значение поля `masters.telegramId` — это реальный `chat_id` мастера из Telegram, который он получает в @userinfobot.

### 2. ✅ Правильная отправка данных на /notify

Функция `sendBookingNotifications` теперь получает корректные данные:

```typescript
await sendBookingNotifications({
    masterId: masterTelegramId,      // chat_id мастера из masters.telegramId
    telegramId: clientTelegramId || 0, // chat_id клиента (0 если не авторизован)
    clientName,
    service: bookingService.name,
    date,
    time,
    notificationType: 'booking',
});
```

### 3. ✅ Добавлена кнопка "Получать уведомления в Telegram"

Если клиент не авторизован в боте (не нажимал Start), после успешной записи показывается кнопка с диплинком:

```
https://t.me/zapismenya_bot?start=notify_<appointmentId>
```

Когда клиент нажмёт на эту кнопку:
- Откроется бот
- Бот получит его `chat_id`
- Бот сможет отправлять уведомления по этой записи

### 4. ✅ handleBookAppointment возвращает созданную запись

Функция теперь возвращает `Promise<Appointment>` с ID созданной записи, чтобы можно было сформировать диплинк для уведомлений.

## Изменённые файлы

### index.tsx

1. **Загрузка masterId (режим мастера):**
   - Строка ~1589: Сохраняем `masterData.telegramId` вместо `masterData.id`

2. **Загрузка masterId (режим клиента):**
   - Строка ~1652: Сохраняем `masterData.telegramId` вместо `masterData.id`

3. **ClientBookingPage:**
   - Добавлено состояние `lastAppointmentId` и `showNotificationButton`
   - Обновлена функция `handleBook` для сохранения ID записи
   - Добавлен UI блок с кнопкой "Получать уведомления в Telegram"

4. **handleBookAppointment:**
   - Возвращает `Promise<Appointment>` вместо `void`
   - Возвращает созданную запись с ID

## Результат

✅ Мастера теперь получают уведомления о новых записях  
✅ Клиенты могут подписаться на уведомления через диплинк  
✅ Бекенд получает правильные `chat_id` для отправки сообщений  
✅ Если клиент не авторизован, уведомление мастеру всё равно отправляется

## Тестирование

1. **Проверка уведомлений мастеру:**
   - Клиент создаёт запись
   - Мастер должен получить уведомление в Telegram

2. **Проверка кнопки для клиента:**
   - Клиент без авторизации в боте создаёт запись
   - Появляется кнопка "Получать уведомления в Telegram"
   - При клике открывается бот с параметром `start=notify_<appointmentId>`

3. **Проверка напоминаний:**
   - Мастер отправляет напоминание клиенту
   - Используется правильный `masterId` (telegramId мастера)
