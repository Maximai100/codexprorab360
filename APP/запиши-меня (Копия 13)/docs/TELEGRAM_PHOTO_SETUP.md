# 📸 Быстрая настройка автоматической загрузки фото из Telegram

## Что это дает?

Теперь фотография профиля мастера **автоматически загружается из Telegram** при первом входе в приложение. Никаких ручных действий не требуется!

## Как это работает?

```
Мастер открывает приложение
         ↓
Проверка: есть ли фото в Directus?
         ↓
Нет → Запрос к Telegram API
         ↓
Получение URL фото профиля
         ↓
Сохранение в Directus
         ↓
Отображение на странице записи
```

## Что уже сделано (Фронтенд) ✅

- ✅ Компонент Avatar поддерживает фото
- ✅ API клиент для получения фото (`src/api/photo.ts`)
- ✅ Автоматическая загрузка при инициализации
- ✅ Сохранение в Directus
- ✅ Fallback на инициалы, если фото недоступно

## Что нужно сделать (Бэкенд) 🔧

### Шаг 1: Добавить поле в Directus

1. Откройте Directus Admin Panel
2. Settings → Data Model → masters
3. Create Field:
   - Name: `photoUrl`
   - Type: String
   - Required: No
4. Save

### Шаг 2: Настроить бэкенд эндпоинт

Добавьте новый эндпоинт на ваш бэкенд (`api.prorab360.online`):

```
GET /get-photo?telegramId={telegramId}
```

**Подробная инструкция:** См. файл `BACKEND_PHOTO_API.md`

**Минимальная реализация (Node.js):**

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

router.get('/get-photo', async (req, res) => {
  try {
    const { telegramId } = req.query;
    
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Missing telegramId' });
    }

    // 1. Получаем фото профиля
    const photosRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos`,
      { params: { user_id: telegramId, limit: 1 } }
    );

    const photos = photosRes.data?.result?.photos;
    if (!photos || photos.length === 0) {
      return res.json({ success: true, photoUrl: null });
    }

    // 2. Получаем file_path
    const fileId = photos[0][photos[0].length - 1].file_id;
    const fileRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
      { params: { file_id: fileId } }
    );

    const filePath = fileRes.data?.result?.file_path;
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    return res.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Photo fetch error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### Шаг 3: Добавить переменную окружения

```bash
# .env на бэкенде
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

### Шаг 4: Подключить роут

```javascript
// server.js
const photoRouter = require('./routes/photo');
app.use('/get-photo', photoRouter);
```

### Шаг 5: Деплой

```bash
git add .
git commit -m "Add photo API endpoint"
git push
```

## Тестирование

### 1. Проверить эндпоинт

```bash
curl "https://api.prorab360.online/get-photo?telegramId=122991166"
```

Ожидаемый ответ:
```json
{
  "success": true,
  "photoUrl": "https://api.telegram.org/file/bot.../photo.jpg"
}
```

### 2. Проверить в приложении

1. Откройте приложение как мастер
2. Откройте консоль браузера (F12)
3. Должны увидеть:
   ```
   📸 Загружаем фото профиля из Telegram...
   ✅ Фото получено: https://...
   ✅ Фото сохранено в Directus для мастера: 123
   ```
4. Фото должно отображаться в шапке профиля

### 3. Проверить сохранение

1. Откройте Directus Admin
2. Перейдите в коллекцию `masters`
3. Найдите запись мастера
4. Поле `photoUrl` должно быть заполнено

## Безопасность ⚠️

URL фото содержит токен бота! Рекомендуется:

### Вариант 1: Проксирование (Простой)
Отдавайте фото напрямую через ваш сервер без раскрытия токена.

### Вариант 2: Загрузка в хранилище (Лучший)
Загружайте фото в S3/Cloudinary/Directus Files и возвращайте публичный URL.

**Подробности:** См. раздел "Безопасность" в `BACKEND_PHOTO_API.md`

## Что если бэкенд не настроен?

Ничего страшного! Приложение продолжит работать:
- Будут показываться красивые инициалы вместо фото
- Никаких ошибок не будет
- Можно добавить фото вручную через Directus

## Преимущества автоматической загрузки

✅ Мастер не делает ничего - фото загружается само  
✅ Всегда актуальное фото (при первом входе)  
✅ Единообразный дизайн для всех мастеров  
✅ Повышает доверие клиентов  
✅ Fallback на инициалы, если фото недоступно  

## Частые вопросы

**Q: Что если у мастера нет фото в Telegram?**  
A: Будут показаны цветные инициалы (как сейчас).

**Q: Обновится ли фото, если мастер изменит его в Telegram?**  
A: Нет, фото загружается один раз. Для обновления нужно удалить `photoUrl` из Directus.

**Q: Можно ли использовать свое фото вместо Telegram?**  
A: Да, просто вручную укажите URL в поле `photoUrl` в Directus.

**Q: Работает ли это для клиентов?**  
A: Нет, фото загружается только для мастеров. Клиенты видят фото мастера.

## Следующие шаги

1. [ ] Настроить поле `photoUrl` в Directus
2. [ ] Реализовать эндпоинт `/get-photo` на бэкенде
3. [ ] Добавить `TELEGRAM_BOT_TOKEN` в переменные окружения
4. [ ] Протестировать локально
5. [ ] Задеплоить на production
6. [ ] Проверить работу в Telegram WebApp

## Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Проверьте логи бэкенда
3. Убедитесь, что BOT_TOKEN корректный
4. См. подробную документацию в `BACKEND_PHOTO_API.md`

---

**Статус:** ✅ Фронтенд готов | 🔧 Требуется настройка бэкенда

**Дата:** 19.10.2025
