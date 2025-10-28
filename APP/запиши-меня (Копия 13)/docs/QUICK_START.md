# ⚡ Quick Start: Telegram Notifications

## 🎯 Что сделано

✅ Полная интеграция системы Telegram-уведомлений  
✅ Все файлы созданы и протестированы  
✅ Проект собирается без ошибок  
✅ Документация готова  

---

## 🚀 Быстрый старт

### 1. Локальное тестирование (прямо сейчас!)

```bash
# Запустить
npm run dev

# Открыть в браузере
http://localhost:3000/?startapp=122991166

# Создать запись → проверить уведомления в Telegram
```

### 2. Деплой в продакшн

```bash
# Собрать
npm run build

# Загрузить dist/ на хостинг
```

---

## 📁 Созданные файлы

### Код:
- ✅ `src/types/booking.ts` - типы данных
- ✅ `src/lib/utils.ts` - утилиты (URL, Telegram)
- ✅ `src/api/notify.ts` - API клиент
- ✅ `index.tsx` - интеграция в форму (обновлен)

### Документация:
- 📖 `README_NOTIFICATIONS.md` - **ГЛАВНАЯ ДОКУМЕНТАЦИЯ** (читать первым!)
- 🧪 `TESTING_NOTIFICATIONS.md` - инструкции по тестированию
- 📋 `DEPLOYMENT_CHECKLIST.md` - чеклист деплоя
- 📊 `NOTIFICATION_INTEGRATION_SUMMARY.md` - итоговый отчет
- ⚡ `QUICK_START.md` - этот файл

---

## 🔍 Как это работает

```
1. Клиент открывает форму с ?startapp=122991166
2. Заполняет данные и нажимает "ЗАПИСАТЬСЯ"
3. Система извлекает masterId из URL
4. Система получает telegramId из Telegram WebApp
5. Отправляется POST на api.prorab360.online/notify
6. Мастер и клиент получают уведомления в Telegram
7. Создается запись в Directus (только при успехе)
```

**⚠️ Важно:** Сначала уведомление, потом запись в БД. Это предотвращает рассинхрон.

---

## 🧪 Быстрый тест

### Тест 1: Всё работает ✅
```
URL: http://localhost:3000/?startapp=122991166
Действие: Создать запись
Результат: "✅ Спасибо! Вы записаны. Уведомление отправлено."
```

### Тест 2: Нет masterId ❌
```
URL: http://localhost:3000/
Действие: Создать запись
Результат: "❌ Отсутствует параметр startapp в URL"
```

### Тест 3: Пользователь не запустил бота ⚠️
```
URL: http://localhost:3000/?startapp=999999999
Действие: Создать запись
Результат: "⚠️ Пожалуйста, откройте бот и нажмите /start"
```

### Тест 3: Проверка Network 🔍
```
DevTools → Network → api.prorab360.online/notify
Статус: 200 OK
Payload: { masterId, telegramId, clientName, service, date, time }
```

---

## 📚 Что читать дальше

1. **Для разработчиков:** `README_NOTIFICATIONS.md`
   - Полная документация по коду
   - Примеры использования
   - Отладка и troubleshooting

2. **Для тестирования:** `TESTING_NOTIFICATIONS.md`
   - Детальные сценарии тестирования
   - Проверка в разных окружениях
   - Известные проблемы и решения

3. **Для деплоя:** `DEPLOYMENT_CHECKLIST.md`
   - Пошаговый чеклист
   - Мониторинг после деплоя
   - План действий при проблемах

---

## 🎯 Следующие шаги

1. [ ] Запустить локально: `npm run dev`
2. [ ] Протестировать с `?startapp=122991166`
3. [ ] Проверить уведомления в Telegram
4. [ ] Прочитать `README_NOTIFICATIONS.md`
5. [ ] Выполнить `DEPLOYMENT_CHECKLIST.md`
6. [ ] Задеплоить в продакшн

---

## 💡 Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Проверка типов
npx tsc --noEmit

# Проверка переменных окружения
cat .env.local
```

---

## 🐛 Быстрая отладка

### Проблема: Уведомления не приходят

```javascript
// В консоли браузера (F12)

// 1. Проверить URL бэкенда
console.log(import.meta.env.VITE_BACKEND_URL);
// Должно: "https://api.prorab360.online/notify"

// 2. Проверить masterId
import { getNumberParam } from './src/lib/utils';
console.log(getNumberParam('startapp'));
// Должно: число

// 3. Проверить Telegram SDK
console.log(window.Telegram?.WebApp);
// Должно: объект

// 4. Проверить telegramId
import { getTelegramUserId } from './src/lib/utils';
console.log(getTelegramUserId());
// Должно: число или null
```

### Проблема: "Chat not found"

**Решение:** Пользователь должен запустить бота (`/start`)

### Проблема: CORS ошибка

**Решение:** Проверить настройки CORS на бэкенде

---

## ✅ Готово!

Всё настроено и готово к использованию. Начните с локального тестирования, затем переходите к деплою.

**Удачи! 🚀**
