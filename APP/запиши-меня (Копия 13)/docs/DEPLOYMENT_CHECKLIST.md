# 🚀 Чеклист деплоя системы уведомлений

## ✅ Что уже сделано

- [x] ✅ Настроены переменные окружения (`.env.local`)
- [x] ✅ Подключен Telegram WebApp SDK (`index.html`)
- [x] ✅ Созданы типы данных (`src/types/booking.ts`)
- [x] ✅ Реализованы утилиты (`src/lib/utils.ts`)
- [x] ✅ Создан API клиент (`src/api/notify.ts`)
- [x] ✅ Интегрирована отправка в форму (`index.tsx`)
- [x] ✅ Проверена компиляция TypeScript (без ошибок)
- [x] ✅ Успешная сборка проекта (`npm run build`)
- [x] ✅ Создана документация:
  - `README_NOTIFICATIONS.md` - полная документация
  - `TESTING_NOTIFICATIONS.md` - инструкции по тестированию
  - `NOTIFICATION_INTEGRATION_SUMMARY.md` - итоговый отчет

---

## 🧪 Что нужно протестировать

### 1. Локальное тестирование

```bash
# Запустить dev-сервер
npm run dev
```

#### Тест 1: Успешная запись
- [ ] Открыть: `http://localhost:3000/?startapp=122991166`
- [ ] Выбрать услугу
- [ ] Заполнить форму (имя, дата, время)
- [ ] Нажать "ЗАПИСАТЬСЯ"
- [ ] **Ожидаемо:**
  - ✅ Запись создана
  - ✅ Сообщение: "Спасибо! Вы записаны. Уведомление отправлено."
  - ✅ 2 уведомления в Telegram

#### Тест 2: Отсутствие masterId
- [ ] Открыть: `http://localhost:3000/` (без параметра)
- [ ] Попытаться создать запись
- [ ] **Ожидаемо:**
  - ❌ Ошибка: "Отсутствует параметр startapp в URL"

#### Тест 3: Несуществующий masterId
- [ ] Открыть: `http://localhost:3000/?startapp=999999999`
- [ ] Создать запись
- [ ] **Ожидаемо:**
  - ✅ Запись создана
  - ❌ Ошибка: "Chat not found"

#### Тест 4: Проверка Network
- [ ] Открыть DevTools (F12) → Network
- [ ] Создать запись
- [ ] Найти запрос к `api.prorab360.online/notify`
- [ ] **Проверить payload:**
```json
{
  "masterId": 122991166,
  "telegramId": 122991166,
  "clientName": "...",
  "service": "...",
  "date": "2025-10-20",
  "time": "14:30"
}
```

---

### 2. Продакшн тестирование

#### Подготовка
- [ ] Собрать проект: `npm run build`
- [ ] Выложить `dist/` на хостинг
- [ ] Убедиться, что `.env` на сервере содержит `VITE_BACKEND_URL`

#### Тест 5: Telegram WebApp
- [ ] Открыть бота в Telegram
- [ ] Запустить WebApp (кнопка или команда)
- [ ] Создать запись
- [ ] **Ожидаемо:**
  - ✅ `telegramId` = реальный user.id (не masterId)
  - ✅ Оба получают уведомления
  - ✅ Сообщение об успехе

#### Тест 6: Проверка в консоли (Telegram Desktop)
- [ ] Открыть DevTools в Telegram Desktop
- [ ] Выполнить в консоли:
```javascript
console.log(window.Telegram.WebApp.initDataUnsafe.user.id);
// Должно вывести число
```

---

## 🐛 Отладка

### Если уведомления не приходят:

1. **Проверить переменную окружения:**
```javascript
// В консоли браузера
console.log(import.meta.env.VITE_BACKEND_URL);
// Должно: "https://api.prorab360.online/notify"
```

2. **Проверить Telegram SDK:**
```javascript
console.log(window.Telegram?.WebApp);
// Должно: объект с методами
```

3. **Проверить Network tab:**
- Статус 200 = успех
- Статус 404 = пользователь не запустил бота
- Статус 500 = ошибка бэкенда

4. **Проверить логи бэкенда:**
```bash
# На сервере
tail -f /var/log/api.prorab360.online/notifications.log
```

---

## 📝 После успешного тестирования

- [ ] Обновить `CHANGELOG.md`:
```markdown
## [1.1.0] - 2025-10-19

### Added
- Интеграция Telegram-уведомлений при создании записи
- Автоматическая отправка уведомлений мастеру и клиенту
- Валидация masterId из URL параметра
- Обработка ошибок с понятными сообщениями

### Technical
- Добавлен API клиент `src/api/notify.ts`
- Добавлены утилиты `src/lib/utils.ts`
- Добавлены типы `src/types/booking.ts`
```

- [ ] Создать Git commit:
```bash
git add .
git commit -m "feat: add Telegram notifications integration

- Add notification API client
- Add URL and Telegram utilities
- Integrate notifications into booking form
- Add comprehensive error handling
- Add documentation and testing guides"
```

- [ ] Создать Git tag:
```bash
git tag -a v1.1.0 -m "Release: Telegram Notifications Integration"
git push origin v1.1.0
```

- [ ] Выкатить в продакшн:
```bash
npm run build
# Загрузить dist/ на хостинг
```

---

## 📊 Мониторинг после деплоя

### Первые 24 часа:

- [ ] Проверить логи бэкенда каждые 2 часа
- [ ] Отследить количество успешных/неуспешных отправок
- [ ] Собрать feedback от первых пользователей

### Метрики для отслеживания:

| Метрика | Целевое значение |
|---------|------------------|
| Success Rate | > 95% |
| Response Time | < 2s |
| Error Rate (404) | < 5% |
| Error Rate (500) | < 1% |

---

## 🚨 План действий при проблемах

### Если уведомления не приходят:

1. **Проверить статус бэкенда:**
```bash
curl -X POST https://api.prorab360.online/notify \
  -H "Content-Type: application/json" \
  -d '{"masterId":122991166,"telegramId":122991166,"clientName":"Test","service":"Test","date":"2025-10-20","time":"14:30"}'
```

2. **Проверить CORS:**
- Открыть DevTools → Console
- Искать ошибки CORS
- Связаться с бэкенд-командой

3. **Откатить изменения (если критично):**
```bash
git revert HEAD
npm run build
# Загрузить dist/ на хостинг
```

---

## ✅ Критерии успеха

Деплой считается успешным, если:

- ✅ Все локальные тесты пройдены
- ✅ Все продакшн тесты пройдены
- ✅ Success Rate > 95% в первые 24 часа
- ✅ Нет критических ошибок в логах
- ✅ Пользователи получают уведомления
- ✅ Нет жалоб от пользователей

---

## 📞 Контакты

**При критических проблемах:**
- Проверить логи: `/var/log/api.prorab360.online/`
- Проверить статус сервера: `systemctl status api-server`
- Связаться с DevOps командой

**При вопросах по коду:**
- Документация: `README_NOTIFICATIONS.md`
- Тестирование: `TESTING_NOTIFICATIONS.md`
- Итоги: `NOTIFICATION_INTEGRATION_SUMMARY.md`

---

## 🎉 Поздравляем!

После выполнения всех пунктов чеклиста система уведомлений будет полностью интегрирована и готова к использованию в продакшене!

**Дата:** 19.10.2025  
**Статус:** 🚀 Готово к деплою
