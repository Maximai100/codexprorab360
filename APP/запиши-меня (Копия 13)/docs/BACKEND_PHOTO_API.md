# Backend API для получения фото профиля из Telegram

## Обзор

Новый эндпоинт для автоматического получения фотографии профиля пользователя из Telegram Bot API.

## Эндпоинт

```
GET https://api.prorab360.online/get-photo?telegramId={telegramId}
```

## Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| telegramId | number | Да | Telegram ID пользователя |

## Пример запроса

```bash
curl "https://api.prorab360.online/get-photo?telegramId=122991166"
```

## Ответы

### Успешный ответ (200 OK)

```json
{
  "success": true,
  "photoUrl": "https://api.telegram.org/file/bot<TOKEN>/photos/file_123.jpg"
}
```

### Фото не найдено (200 OK)

```json
{
  "success": true,
  "photoUrl": null,
  "message": "У пользователя нет фото профиля"
}
```

### Ошибка (400/500)

```json
{
  "success": false,
  "message": "Отсутствует параметр telegramId"
}
```

## Реализация на бэкенде (Node.js/Express)

### Установка зависимостей

```bash
npm install axios
```

### Код эндпоинта

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Telegram Bot Token из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /get-photo
 * Получает URL фото профиля пользователя из Telegram
 */
router.get('/get-photo', async (req, res) => {
  try {
    const { telegramId } = req.query;

    // Валидация
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствует параметр telegramId'
      });
    }

    const userId = Number(telegramId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({
        success: false,
        message: 'telegramId должен быть числом'
      });
    }

    // 1. Получаем список фотографий профиля
    const photosResponse = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos`,
      {
        params: {
          user_id: userId,
          limit: 1 // Берем только последнюю фотографию
        }
      }
    );

    const photos = photosResponse.data?.result?.photos;

    // Если фото нет
    if (!photos || photos.length === 0) {
      return res.json({
        success: true,
        photoUrl: null,
        message: 'У пользователя нет фото профиля'
      });
    }

    // 2. Берем самое большое разрешение (последний элемент в массиве)
    const photo = photos[0];
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;

    // 3. Получаем file_path для скачивания
    const fileResponse = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
      {
        params: { file_id: fileId }
      }
    );

    const filePath = fileResponse.data?.result?.file_path;

    if (!filePath) {
      return res.status(500).json({
        success: false,
        message: 'Не удалось получить путь к файлу'
      });
    }

    // 4. Формируем публичный URL
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    return res.json({
      success: true,
      photoUrl: photoUrl
    });

  } catch (error) {
    console.error('Ошибка при получении фото:', error.message);
    
    // Обработка специфичных ошибок Telegram API
    if (error.response?.data?.description) {
      return res.status(400).json({
        success: false,
        message: error.response.data.description
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

module.exports = router;
```

### Подключение в основном файле

```javascript
// server.js или app.js
const express = require('express');
const cors = require('cors');
const photoRouter = require('./routes/photo');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/get-photo', photoRouter);

// Существующий эндпоинт для уведомлений
app.use('/notify', require('./routes/notify'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Переменные окружения

Добавьте в `.env` на бэкенде:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Безопасность

### ⚠️ Важно: Не раскрывайте BOT_TOKEN

URL фото содержит токен бота, что может быть проблемой безопасности. Рекомендуется:

### Вариант 1: Проксирование через свой сервер

```javascript
router.get('/get-photo', async (req, res) => {
  // ... получаем photoUrl как выше ...
  
  // Скачиваем фото
  const imageResponse = await axios.get(photoUrl, {
    responseType: 'arraybuffer'
  });
  
  // Отдаем напрямую
  res.set('Content-Type', 'image/jpeg');
  res.send(imageResponse.data);
});
```

### Вариант 2: Загрузка в облачное хранилище

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

router.get('/get-photo', async (req, res) => {
  // ... получаем photoUrl ...
  
  // Скачиваем фото
  const imageResponse = await axios.get(photoUrl, {
    responseType: 'arraybuffer'
  });
  
  // Загружаем в S3
  const s3Key = `profile-photos/${userId}.jpg`;
  await s3.putObject({
    Bucket: 'your-bucket',
    Key: s3Key,
    Body: imageResponse.data,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  }).promise();
  
  const publicUrl = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
  
  return res.json({
    success: true,
    photoUrl: publicUrl
  });
});
```

### Вариант 3: Загрузка в Directus Files

```javascript
const FormData = require('form-data');

router.get('/get-photo', async (req, res) => {
  // ... получаем photoUrl ...
  
  // Скачиваем фото
  const imageResponse = await axios.get(photoUrl, {
    responseType: 'arraybuffer'
  });
  
  // Загружаем в Directus
  const formData = new FormData();
  formData.append('file', imageResponse.data, {
    filename: `${userId}.jpg`,
    contentType: 'image/jpeg'
  });
  
  const directusResponse = await axios.post(
    'https://1.cycloscope.online/files',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      }
    }
  );
  
  const fileId = directusResponse.data.data.id;
  const publicUrl = `https://1.cycloscope.online/assets/${fileId}`;
  
  return res.json({
    success: true,
    photoUrl: publicUrl
  });
});
```

## Кэширование

Для оптимизации можно кэшировать URL фото:

```javascript
const NodeCache = require('node-cache');
const photoCache = new NodeCache({ stdTTL: 3600 }); // 1 час

router.get('/get-photo', async (req, res) => {
  const { telegramId } = req.query;
  
  // Проверяем кэш
  const cachedUrl = photoCache.get(telegramId);
  if (cachedUrl) {
    return res.json({
      success: true,
      photoUrl: cachedUrl
    });
  }
  
  // ... получаем фото из Telegram ...
  
  // Сохраняем в кэш
  photoCache.set(telegramId, photoUrl);
  
  return res.json({
    success: true,
    photoUrl: photoUrl
  });
});
```

## Тестирование

### Локальное тестирование

```bash
# Запустить сервер
node server.js

# Тестовый запрос
curl "http://localhost:3000/get-photo?telegramId=122991166"
```

### Production тестирование

```bash
curl "https://api.prorab360.online/get-photo?telegramId=122991166"
```

## Интеграция с фронтендом

Фронтенд автоматически:
1. Проверяет наличие `photoUrl` в Directus
2. Если нет - запрашивает фото через этот API
3. Сохраняет полученный URL в Directus
4. При следующей загрузке использует сохраненный URL

## Мониторинг

Логируйте запросы для отладки:

```javascript
router.get('/get-photo', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... логика ...
    
    const duration = Date.now() - startTime;
    console.log(`✅ Photo fetched for ${telegramId} in ${duration}ms`);
  } catch (error) {
    console.error(`❌ Photo fetch failed for ${telegramId}:`, error.message);
  }
});
```

## Частые ошибки

### "Bad Request: user not found"
- Пользователь с таким ID не существует в Telegram
- Проверьте правильность telegramId

### "Unauthorized"
- Неверный BOT_TOKEN
- Проверьте переменную окружения

### "Too Many Requests"
- Превышен лимит запросов к Telegram API
- Добавьте кэширование или rate limiting

## Лимиты Telegram API

- **getUserProfilePhotos**: 30 запросов/секунду
- **getFile**: 20 запросов/секунду

Рекомендуется использовать кэширование для снижения нагрузки.

## Чеклист деплоя

- [ ] Добавлен эндпоинт `/get-photo`
- [ ] Настроена переменная `TELEGRAM_BOT_TOKEN`
- [ ] Добавлен CORS для фронтенда
- [ ] Реализовано кэширование (опционально)
- [ ] Реализовано проксирование/загрузка в хранилище (рекомендуется)
- [ ] Добавлено логирование
- [ ] Проведено тестирование
- [ ] Обновлена документация

## Дополнительные ресурсы

- [Telegram Bot API - getUserProfilePhotos](https://core.telegram.org/bots/api#getuserprofilephotos)
- [Telegram Bot API - getFile](https://core.telegram.org/bots/api#getfile)
