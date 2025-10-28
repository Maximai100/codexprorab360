# Решение проблем с уведомлениями

## Проблема 1: Клиент не получает уведомление, если не подписан на бота

### Причина
Telegram Bot API **не позволяет** отправлять сообщения пользователям, которые не написали боту первыми (не нажали /start). Это защита от спама.

### ❌ Нельзя решить полностью
Это ограничение Telegram API, обойти его невозможно.

### ✅ Что можно улучшить

#### 1. Улучшить UX на клиентской стороне

**В `index.tsx` в функции `handleBook`:**

```typescript
try {
    await sendBookingNotifications(notificationPayload);
    
    // Успех - создаем запись
    onBookAppointment({ 
        clientName, 
        clientPhone, 
        service: bookingService.name, 
        date, 
        time, 
        duration: bookingService.duration, 
        telegramId: tg.initDataUnsafe?.user?.id 
    });
    
    tg.HapticFeedback.notificationOccurred('success');
    showToast(`✅ Спасибо, ${clientName}! Вы записаны.`);
    setBookingService(null);
    
} catch (err: any) {
    const errorMsg = err?.message || 'Неизвестная ошибка';
    
    // Если клиент не подписан - все равно создаем запись, но показываем подсказку
    if (errorMsg.includes('не написал боту') || errorMsg.includes('chat not found')) {
        
        // Создаем запись в любом случае
        onBookAppointment({ 
            clientName, 
            clientPhone, 
            service: bookingService.name, 
            date, 
            time, 
            duration: bookingService.duration, 
            telegramId: tg.initDataUnsafe?.user?.id 
        });
        
        showToast(`✅ Вы записаны! Чтобы получать уведомления, откройте @zapismenya_bot и нажмите /start`);
        setBookingService(null);
        
    } else if (errorMsg.includes('заблокировал бота') || errorMsg.includes('blocked')) {
        showToast('⚠️ Бот заблокирован. Разблокируйте бота в Telegram.');
    } else {
        showToast(`❌ ${errorMsg}`);
    }
}
```

#### 2. Добавить кнопку "Подписаться на уведомления"

В компоненте `ClientBookingPage` после успешной записи:

```typescript
<div className="notification-prompt">
    <p>💬 Хотите получать напоминания о записи?</p>
    <a 
        href="https://t.me/zapismenya_bot?start=subscribe" 
        target="_blank"
        className="btn btn-primary"
    >
        Подписаться на уведомления
    </a>
</div>
```

#### 3. Улучшить бэкенд - не возвращать ошибку, если клиент не подписан

На бэкенде `api.prorab360.online/notify`:

```javascript
// Отправка клиенту
try {
    await bot.sendMessage(telegramId, clientMessage);
    results.client = 'sent';
} catch (error) {
    if (error.response?.body?.error_code === 403) {
        // Пользователь не подписан - это нормально
        results.client = 'not_subscribed';
    } else {
        results.client = 'error';
        console.error('Ошибка отправки клиенту:', error);
    }
}

// Отправка мастеру (ВСЕГДА должна работать)
try {
    await bot.sendMessage(masterId, masterMessage);
    results.master = 'sent';
} catch (error) {
    results.master = 'error';
    console.error('Ошибка отправки мастеру:', error);
}

// Возвращаем успех, даже если клиент не подписан
return res.json({
    status: 'success',
    message: 'Уведомления отправлены',
    details: results
});
```

---

## Проблема 2: Мастеру не приходят уведомления

### ✅ Можно и нужно исправить!

### Возможные причины:

#### 1. Неправильный masterId
Проверьте, что передается правильный `masterId` (это должен быть Telegram ID мастера, а не ID из базы Directus).

**Проверка в консоли браузера:**
```javascript
console.log('masterId:', masterId);
console.log('telegramId:', telegramId);
```

#### 2. Бэкенд не отправляет уведомление мастеру
Проверьте код на `api.prorab360.online/notify`:

**Должно быть:**
```javascript
app.post('/notify', async (req, res) => {
    const { masterId, telegramId, clientName, service, date, time } = req.body;
    
    // Сообщение мастеру
    const masterMessage = `
🔔 Новая запись!

👤 Клиент: ${clientName}
💼 Услуга: ${service}
📅 Дата: ${date}
🕐 Время: ${time}
    `.trim();
    
    // Сообщение клиенту
    const clientMessage = `
✅ Вы записаны!

💼 Услуга: ${service}
📅 Дата: ${date}
🕐 Время: ${time}

Ждем вас!
    `.trim();
    
    const results = {};
    
    // ВАЖНО: Отправляем мастеру
    try {
        await bot.sendMessage(masterId, masterMessage);
        results.master = 'sent';
        console.log('✅ Уведомление мастеру отправлено:', masterId);
    } catch (error) {
        results.master = 'error';
        console.error('❌ Ошибка отправки мастеру:', error);
    }
    
    // Отправляем клиенту
    try {
        await bot.sendMessage(telegramId, clientMessage);
        results.client = 'sent';
        console.log('✅ Уведомление клиенту отправлено:', telegramId);
    } catch (error) {
        if (error.response?.body?.error_code === 403) {
            results.client = 'not_subscribed';
            console.log('⚠️ Клиент не подписан на бота:', telegramId);
        } else {
            results.client = 'error';
            console.error('❌ Ошибка отправки клиенту:', error);
        }
    }
    
    res.json({
        status: 'success',
        message: 'Уведомления отправлены',
        details: results
    });
});
```

#### 3. Мастер не написал боту /start
Даже мастер должен написать боту `/start`, чтобы получать уведомления!

**Решение:**
1. Откройте бот @zapismenya_bot
2. Нажмите `/start`
3. Попробуйте создать запись снова

#### 4. Неправильный Telegram ID мастера
Проверьте, что в базе Directus у мастера правильный `telegramId`.

**Как узнать свой Telegram ID:**
```javascript
// В консоли браузера в режиме мастера
console.log('Мой Telegram ID:', window.Telegram.WebApp.initDataUnsafe?.user?.id);
```

Сравните с тем, что хранится в Directus.

---

## Чек-лист для диагностики

### На клиенте (браузер):
- [ ] Открыть DevTools (F12) → Console
- [ ] Проверить логи:
  ```
  📤 Отправка уведомления на: https://api.prorab360.online/notify
  📦 Данные: { masterId: ..., telegramId: ..., ... }
  📥 Ответ сервера: 200 OK
  ```
- [ ] Проверить, что `masterId` и `telegramId` - это числа, а не `undefined`

### На бэкенде (api.prorab360.online):
- [ ] Проверить логи сервера
- [ ] Убедиться, что запрос приходит с правильными данными
- [ ] Проверить, что бот отправляет сообщения обоим пользователям
- [ ] Проверить коды ошибок от Telegram API

### В Telegram:
- [ ] Мастер написал боту `/start`
- [ ] Клиент написал боту `/start` (опционально)
- [ ] Бот не заблокирован ни мастером, ни клиентом

---

## Тестирование

### Тест 1: Проверка отправки через curl

```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": 122991166,
    "telegramId": 122991166,
    "clientName": "Тест",
    "service": "Стрижка",
    "date": "2025-10-20",
    "time": "14:00"
  }'
```

**Ожидаемый результат:**
- Мастер получает уведомление
- Клиент получает уведомление (если подписан)

### Тест 2: Проверка через приложение

1. Откройте приложение в клиентском режиме
2. Создайте запись
3. Проверьте консоль браузера
4. Проверьте Telegram (у мастера и клиента)

---

## Следующие шаги

1. **Покажите код бэкенда** `api.prorab360.online/notify` - я помогу его исправить
2. **Проверьте логи** - что показывает сервер при отправке уведомлений?
3. **Проверьте Telegram ID** - правильный ли ID мастера в базе?

Где находится код бэкенда для уведомлений?
