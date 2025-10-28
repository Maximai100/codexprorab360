# ✅ Чеклист настройки автоматической загрузки фото

## Фронтенд (Готово ✅)

- [x] Компонент `Avatar` с поддержкой фото
- [x] API клиент `src/api/photo.ts`
- [x] Автоматическая загрузка при инициализации
- [x] Сохранение в Directus
- [x] Fallback на инициалы
- [x] Стили для отображения фото
- [x] TypeScript без ошибок
- [x] Документация создана

## Бэкенд (Требуется настройка 🔧)

### 1. Добавить эндпоинт `/get-photo`

```bash
# Создать файл routes/photo.js
touch routes/photo.js
```

Скопировать код из `BACKEND_PHOTO_API.md` → раздел "Реализация на бэкенде"

- [ ] Файл `routes/photo.js` создан
- [ ] Код эндпоинта добавлен
- [ ] Роут подключен в `server.js`

### 2. Настроить переменные окружения

```bash
# Добавить в .env
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here" >> .env
```

- [ ] `TELEGRAM_BOT_TOKEN` добавлен в `.env`
- [ ] Токен взят из @BotFather
- [ ] Сервер перезапущен

### 3. Установить зависимости

```bash
npm install axios
```

- [ ] `axios` установлен

### 4. Настроить CORS

```javascript
// server.js
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000']
}));
```

- [ ] CORS настроен для фронтенда

### 5. Тестирование бэкенда

```bash
# Локально
curl "http://localhost:3000/get-photo?telegramId=122991166"

# Production
curl "https://api.prorab360.online/get-photo?telegramId=122991166"
```

Ожидаемый ответ:
```json
{
  "success": true,
  "photoUrl": "https://api.telegram.org/file/bot.../photo.jpg"
}
```

- [ ] Локальный тест пройден
- [ ] Production тест пройден

### 6. Деплой

```bash
git add .
git commit -m "Add Telegram photo API endpoint"
git push
```

- [ ] Изменения закоммичены
- [ ] Код задеплоен на production

## Directus (Требуется настройка 🔧)

### 1. Добавить поле `photoUrl`

1. Открыть Directus Admin: `https://1.cycloscope.online`
2. Settings → Data Model
3. Выбрать коллекцию `masters`
4. Create Field:
   - **Field Name**: `photoUrl`
   - **Type**: String
   - **Interface**: Input
   - **Required**: No (снять галочку)
5. Save

- [ ] Поле `photoUrl` создано
- [ ] Тип String
- [ ] Не обязательное

### 2. Проверить права доступа

- [ ] API имеет права на чтение `photoUrl`
- [ ] API имеет права на запись `photoUrl`

## Тестирование интеграции (После настройки бэкенда)

### 1. Локальное тестирование

```bash
npm run dev
```

1. Открыть `http://localhost:3000`
2. Открыть консоль браузера (F12)
3. Проверить логи:

```
📸 Загружаем фото профиля из Telegram...
✅ Фото получено: https://...
✅ Фото сохранено в Directus для мастера: 123
```

- [ ] Фото загружается
- [ ] Фото сохраняется в Directus
- [ ] Фото отображается в UI

### 2. Проверка в Directus

1. Открыть Directus Admin
2. Content → masters
3. Найти запись мастера
4. Проверить поле `photoUrl`

- [ ] Поле `photoUrl` заполнено
- [ ] URL валидный

### 3. Проверка fallback

1. Удалить `photoUrl` из Directus
2. Изменить бэкенд, чтобы вернул `photoUrl: null`
3. Перезагрузить приложение

- [ ] Показываются инициалы
- [ ] Цвет генерируется корректно
- [ ] Нет ошибок в консоли

### 4. Production тестирование

1. Собрать проект: `npm run build`
2. Задеплоить на хостинг
3. Открыть через Telegram WebApp

- [ ] Фото загружается в production
- [ ] Фото отображается корректно
- [ ] Нет ошибок в консоли

## Безопасность (Рекомендуется)

### Опция 1: Проксирование

Изменить эндпоинт, чтобы отдавать фото напрямую:

```javascript
router.get('/get-photo', async (req, res) => {
  // ... получить photoUrl ...
  
  const imageResponse = await axios.get(photoUrl, {
    responseType: 'arraybuffer'
  });
  
  res.set('Content-Type', 'image/jpeg');
  res.send(imageResponse.data);
});
```

- [ ] Проксирование реализовано

### Опция 2: Загрузка в хранилище

Загружать фото в S3/Cloudinary/Directus Files

- [ ] Хранилище настроено
- [ ] Загрузка реализована

## Оптимизация (Опционально)

### Кэширование

```bash
npm install node-cache
```

```javascript
const NodeCache = require('node-cache');
const photoCache = new NodeCache({ stdTTL: 3600 });
```

- [ ] Кэширование добавлено
- [ ] TTL настроен

### Rate Limiting

```bash
npm install express-rate-limit
```

- [ ] Rate limiting добавлен

## Мониторинг (Опционально)

### Логирование

```javascript
console.log(`✅ Photo fetched for ${telegramId} in ${duration}ms`);
console.error(`❌ Photo fetch failed for ${telegramId}:`, error);
```

- [ ] Логирование добавлено

### Метрики

- [ ] Отслеживание успешных запросов
- [ ] Отслеживание ошибок
- [ ] Отслеживание времени ответа

## Документация

- [x] `TELEGRAM_PHOTO_SETUP.md` - быстрая инструкция
- [x] `BACKEND_PHOTO_API.md` - подробная документация API
- [x] `PHOTO_FEATURE_SUMMARY.md` - итоговый отчет
- [x] `PHOTO_CHECKLIST.md` - этот чеклист
- [x] `ADD_PHOTO_FIELD.md` - обновлена информация

## Финальная проверка

### Сценарий 1: Новый мастер с фото

1. Мастер с фото в Telegram открывает приложение
2. Фото автоматически загружается
3. Фото сохраняется в Directus
4. Фото отображается в UI

- [ ] Работает корректно

### Сценарий 2: Новый мастер без фото

1. Мастер без фото в Telegram открывает приложение
2. Показываются инициалы
3. Нет ошибок

- [ ] Работает корректно

### Сценарий 3: Существующий мастер

1. Мастер с сохраненным `photoUrl` открывает приложение
2. Фото загружается из Directus
3. Нет запроса к Telegram API

- [ ] Работает корректно

### Сценарий 4: Клиент видит мастера

1. Клиент открывает ссылку записи
2. Видит фото мастера в шапке
3. Фото загружается быстро

- [ ] Работает корректно

## Готово! 🎉

Когда все пункты отмечены:

- [ ] Фронтенд работает
- [ ] Бэкенд работает
- [ ] Directus настроен
- [ ] Тестирование пройдено
- [ ] Production деплой выполнен

**Поздравляем! Автоматическая загрузка фото из Telegram работает!** 🚀

---

**Дата:** 19.10.2025  
**Версия:** 1.0
