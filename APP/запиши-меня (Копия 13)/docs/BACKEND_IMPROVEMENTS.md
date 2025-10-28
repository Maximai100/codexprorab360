# 🔧 Рекомендации по улучшению бэкенда

## ⚠️ Критичные исправления (сделать перед продом)

### 1. Унификация формата ответа

**Текущее состояние:**
```javascript
res.json({ status: "success", message: "Уведомления отправлены" })
```

**Рекомендуется:**
```javascript
// Успех
res.json({ 
  success: true, 
  message: "Уведомления отправлены" 
});

// Ошибка
res.status(404).json({ 
  success: false, 
  message: "Пользователь не написал боту. Откройте бот и нажмите /start.",
  detail: "Bad Request: chat not found"
});
```

**Почему:** Единый формат `success: boolean` упрощает обработку на фронте и соответствует REST best practices.

---

### 2. Маппинг ошибок Telegram → понятные сообщения

**Добавить в обработчик Telegram API:**

```javascript
async function sendTelegramMessage(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });

  const data = await response.json();

  if (!data.ok) {
    const desc = data.description || 'Unknown error';
    let userMsg = 'Не удалось отправить уведомление.';
    
    // Маппинг ошибок Telegram на понятные сообщения
    if (/chat not found/i.test(desc)) {
      userMsg = 'Пользователь не написал боту. Откройте бот и нажмите /start.';
    } else if (/blocked by the user/i.test(desc)) {
      userMsg = 'Пользователь заблокировал бота.';
    } else if (/bot was kicked/i.test(desc)) {
      userMsg = 'Бот был удален из чата.';
    } else if (/user is deactivated/i.test(desc)) {
      userMsg = 'Аккаунт пользователя деактивирован.';
    }
    
    throw { userMessage: userMsg, detail: desc };
  }

  return data;
}

// В основном обработчике
app.post('/notify', async (req, res) => {
  try {
    // ... логика отправки
    await sendTelegramMessage(masterId, masterText);
    await sendTelegramMessage(clientId, clientText);
    
    res.json({ success: true, message: 'Уведомления отправлены' });
  } catch (err) {
    console.error('Telegram error:', err);
    res.status(404).json({ 
      success: false, 
      message: err.userMessage || 'Ошибка отправки уведомления',
      detail: err.detail 
    });
  }
});
```

---

### 3. Валидация входных данных

**Добавить в начало обработчика `/notify`:**

```javascript
app.post('/notify', async (req, res) => {
  // 1. Проверка наличия всех полей
  const requiredFields = ['masterId', 'telegramId', 'clientName', 'service', 'date', 'time'];
  
  for (const field of requiredFields) {
    if (req.body[field] == null || req.body[field] === '') {
      return res.status(400).json({ 
        success: false, 
        message: `Отсутствует поле ${field}` 
      });
    }
  }

  // 2. Проверка типов ID
  const { masterId, telegramId } = req.body;
  if (!Number.isInteger(masterId) || !Number.isInteger(telegramId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID должны быть числами' 
    });
  }

  // 3. Проверка форматов даты и времени
  const { date, time } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Неверный формат даты. Используйте YYYY-MM-DD' 
    });
  }
  
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Неверный формат времени. Используйте HH:mm' 
    });
  }

  // 4. Проверка длины строк (защита от спама)
  if (req.body.clientName.length > 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Имя клиента слишком длинное (макс. 100 символов)' 
    });
  }
  
  if (req.body.service.length > 200) {
    return res.status(400).json({ 
      success: false, 
      message: 'Название услуги слишком длинное (макс. 200 символов)' 
    });
  }

  // ... дальше логика отправки
});
```

---

### 4. Экранирование Markdown

**Проблема:** Если в `clientName` или `service` попадут символы `_ * [ ] ( )`, Telegram сломает форматирование.

**Решение:**

```javascript
/**
 * Экранирует спецсимволы Markdown для Telegram
 */
function escapeMarkdown(text = '') {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Использование
const masterText = `
🔔 *Новая запись*

👤 Клиент: ${escapeMarkdown(clientName)}
📋 Услуга: ${escapeMarkdown(service)}
📅 Дата: ${date}
🕐 Время: ${time}
`;

const clientText = `
✅ *Вы записаны!*

👤 Мастер: ${escapeMarkdown(masterName)}
📋 Услуга: ${escapeMarkdown(service)}
📅 Дата: ${date}
🕐 Время: ${time}
`;
```

**Альтернатива:** Использовать `parse_mode: 'HTML'` вместо Markdown:

```javascript
function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const masterText = `
🔔 <b>Новая запись</b>

👤 Клиент: ${escapeHtml(clientName)}
📋 Услуга: ${escapeHtml(service)}
📅 Дата: ${date}
🕐 Время: ${time}
`;
```

---

## 🚀 Рекомендуемые улучшения

### 5. Health Check эндпоинт

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**Зачем:** Для мониторинга и k8s/Docker health checks.

---

### 6. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const notifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // максимум 30 запросов с одного IP
  message: { 
    success: false, 
    message: 'Слишком много запросов. Попробуйте позже.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/notify', notifyLimiter);
```

**Зачем:** Защита от спама и DDoS.

---

### 7. CORS белый список

**Вместо:**
```javascript
app.use(cors());
```

**Использовать:**
```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://1.cycloscope.online',
    // Для локальной разработки
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['POST', 'GET'],
  credentials: true
};

app.use(cors(corsOptions));
```

**Зачем:** Безопасность - только разрешенные домены могут делать запросы.

---

### 8. Структурированное логирование

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.post('/notify', async (req, res) => {
  const requestId = Date.now().toString(36);
  
  logger.info('Notification request', {
    requestId,
    masterId: req.body.masterId,
    telegramId: req.body.telegramId,
    service: req.body.service,
    date: req.body.date,
    time: req.body.time,
    // НЕ логируем clientName и clientPhone (PII)
  });

  try {
    // ... логика
    logger.info('Notification sent', { requestId, success: true });
    res.json({ success: true, message: 'Уведомления отправлены' });
  } catch (err) {
    logger.error('Notification failed', { 
      requestId, 
      error: err.message,
      detail: err.detail 
    });
    res.status(404).json({ success: false, message: err.userMessage });
  }
});
```

**Зачем:** Удобная отладка и мониторинг.

---

### 9. Retry логика для Telegram API

```javascript
async function sendTelegramMessageWithRetry(chatId, text, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await sendTelegramMessage(chatId, text);
    } catch (err) {
      // Не ретраим ошибки типа "chat not found" или "blocked"
      if (err.detail && (
        /chat not found/i.test(err.detail) ||
        /blocked by the user/i.test(err.detail)
      )) {
        throw err;
      }
      
      // Последняя попытка - выбрасываем ошибку
      if (i === retries) {
        throw err;
      }
      
      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**Зачем:** Устойчивость к временным сбоям Telegram API.

---

### 10. Мониторинг метрик

```javascript
let metrics = {
  totalRequests: 0,
  successfulNotifications: 0,
  failedNotifications: 0,
  errorsByType: {}
};

app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    successRate: (metrics.successfulNotifications / metrics.totalRequests * 100).toFixed(2) + '%',
    uptime: process.uptime()
  });
});

app.post('/notify', async (req, res) => {
  metrics.totalRequests++;
  
  try {
    // ... логика
    metrics.successfulNotifications++;
    res.json({ success: true, message: 'Уведомления отправлены' });
  } catch (err) {
    metrics.failedNotifications++;
    metrics.errorsByType[err.type || 'unknown'] = 
      (metrics.errorsByType[err.type || 'unknown'] || 0) + 1;
    
    res.status(404).json({ success: false, message: err.userMessage });
  }
});
```

---

## 📋 Чеклист перед продом

- [ ] ✅ Формат ответа унифицирован (`success: boolean`)
- [ ] ✅ Маппинг ошибок Telegram на понятные сообщения
- [ ] ✅ Валидация всех входных полей
- [ ] ✅ Экранирование Markdown/HTML в текстах
- [ ] ✅ `/health` эндпоинт добавлен
- [ ] ✅ Rate limiting настроен
- [ ] ✅ CORS белый список настроен
- [ ] ✅ Логирование настроено
- [ ] ⚠️ Retry логика (опционально)
- [ ] ⚠️ Метрики (опционально)

---

## 🧪 Тестирование бэкенда

### Тест 1: Успешная отправка

```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": 122991166,
    "telegramId": 122991166,
    "clientName": "Тест",
    "service": "Стрижка",
    "date": "2025-10-20",
    "time": "14:30"
  }'
```

**Ожидаемо:**
```json
{
  "success": true,
  "message": "Уведомления отправлены"
}
```

### Тест 2: Отсутствие поля

```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": 122991166,
    "telegramId": 122991166
  }'
```

**Ожидаемо:**
```json
{
  "success": false,
  "message": "Отсутствует поле clientName"
}
```

### Тест 3: Неверный формат

```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "not-a-number",
    "telegramId": 122991166,
    "clientName": "Тест",
    "service": "Стрижка",
    "date": "2025-10-20",
    "time": "14:30"
  }'
```

**Ожидаемо:**
```json
{
  "success": false,
  "message": "ID должны быть числами"
}
```

### Тест 4: Chat not found

```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": 999999999,
    "telegramId": 999999999,
    "clientName": "Тест",
    "service": "Стрижка",
    "date": "2025-10-20",
    "time": "14:30"
  }'
```

**Ожидаемо:**
```json
{
  "success": false,
  "message": "Пользователь не написал боту. Откройте бот и нажмите /start.",
  "detail": "Bad Request: chat not found"
}
```

### Тест 5: Health check

```bash
curl https://api.prorab360.online/health
```

**Ожидаемо:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T12:00:00.000Z",
  "uptime": 12345.67
}
```

---

## 📊 Мониторинг в продакшене

### Логи

```bash
# Логи приложения
pm2 logs booking-backend --lines 200

# Логи Nginx
sudo tail -f /var/log/nginx/access.log | grep "/notify"
sudo tail -f /var/log/nginx/error.log

# Поиск ошибок
pm2 logs booking-backend --err --lines 50
```

### Метрики

```bash
# Проверка метрик
curl https://api.prorab360.online/metrics

# Проверка health
curl https://api.prorab360.online/health
```

### Алерты

Настроить мониторинг на:
- Success rate < 95%
- Response time > 5s
- Error rate > 5%
- Health check fails

---

## 🚨 Troubleshooting

### Проблема: Уведомления не приходят

1. Проверить логи: `pm2 logs booking-backend`
2. Проверить Telegram API: `curl https://api.telegram.org/bot<TOKEN>/getMe`
3. Проверить, что пользователь запустил бота

### Проблема: Высокий error rate

1. Проверить логи на частые ошибки
2. Проверить rate limiting
3. Проверить Telegram API status

### Проблема: Медленные ответы

1. Добавить retry логику
2. Увеличить timeout
3. Проверить нагрузку на сервер

---

**Дата:** 19.10.2025  
**Статус:** 📋 Готово к имплементации
