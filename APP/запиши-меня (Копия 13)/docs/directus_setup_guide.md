# Инструкция по настройке коллекций в Directus

## Коллекция `time_blocks`

### Поля:

1. **id** (UUID, Primary Key) - создается автоматически
2. **master** (Many-to-One Relationship)
   - Related Collection: `masters`
   - Field Type: Many to One
3. **date** (Date)
   - Type: Date
   - Interface: Date
4. **startTime** (String)
   - Type: String
   - Interface: Input
   - Placeholder: "09:00"
5. **endTime** (String)
   - Type: String
   - Interface: Input
   - Placeholder: "18:00"
6. **title** (String)
   - Type: String
   - Interface: Input
   - Placeholder: "Перерыв"

### Права доступа:
- Мастер может создавать/читать/обновлять/удалять только свои блокировки
- Клиенты могут только читать блокировки (для проверки доступности)

---

## Коллекция `schedules`

### Поля:

1. **id** (UUID, Primary Key) - создается автоматически
2. **master** (Many-to-One Relationship)
   - Related Collection: `masters`
   - Field Type: Many to One
   - **ВАЖНО:** Добавить уникальный индекс на это поле (один мастер = одно расписание)
3. **schedule** (JSON)
   - Type: JSON
   - Interface: Code (JSON)
   - Default Value:
   ```json
   {
     "mon": { "enabled": false, "startTime": "09:00", "endTime": "18:00" },
     "tue": { "enabled": false, "startTime": "09:00", "endTime": "18:00" },
     "wed": { "enabled": false, "startTime": "09:00", "endTime": "18:00" },
     "thu": { "enabled": false, "startTime": "09:00", "endTime": "18:00" },
     "fri": { "enabled": false, "startTime": "09:00", "endTime": "18:00" },
     "sat": { "enabled": false, "startTime": "10:00", "endTime": "16:00" },
     "sun": { "enabled": false, "startTime": "10:00", "endTime": "16:00" }
   }
   ```

### Права доступа:
- Мастер может создавать/читать/обновлять только свое расписание
- Клиенты могут только читать расписание (для проверки доступности)

---

## Обновление существующих коллекций

### Коллекция `masters`

Убедись, что есть поля:
- `telegramId` (Big Integer, Unique, Required)
- `name` (String)
- `profession` (String)

### Коллекция `services`

Убедись, что есть поля:
- `id` (UUID, Primary Key)
- `master` (Many-to-One → `masters`)
- `name` (String)
- `price` (Integer)
- `duration` (Integer)

### Коллекция `appointments`

Убедись, что есть поля:
- `id` (UUID, Primary Key)
- `master` (Many-to-One → `masters`)
- `service` (Many-to-One → `services`)
- `clientName` (String)
- `clientPhone` (String, Optional)
- `clientTelegramId` (Big Integer, Optional)
- `dateTime` (DateTime)
- `reminderSent` (Boolean, Default: false)

---

## Настройка прав доступа (Permissions)

### Для роли "Public" (неавторизованные пользователи):

**masters:**
- Read: ✅ (только поля: id, name, profession)

**services:**
- Read: ✅ (все поля)

**appointments:**
- Create: ✅ (только свои записи)
- Read: ❌ (только мастер видит свои записи)

**time_blocks:**
- Read: ✅ (для проверки доступности)

**schedules:**
- Read: ✅ (для проверки доступности)

### Для роли "Authenticated" (авторизованные через Telegram):

**masters:**
- Create: ✅ (автоматически при первом входе)
- Read: ✅ (свой профиль)
- Update: ✅ (свой профиль)

**services:**
- Create: ✅ (свои услуги)
- Read: ✅ (все услуги)
- Update: ✅ (свои услуги)
- Delete: ✅ (свои услуги)

**appointments:**
- Create: ✅ (любые записи)
- Read: ✅ (свои записи как мастер)
- Update: ✅ (свои записи)
- Delete: ✅ (свои записи)

**time_blocks:**
- Create: ✅ (свои блокировки)
- Read: ✅ (все блокировки)
- Update: ✅ (свои блокировки)
- Delete: ✅ (свои блокировки)

**schedules:**
- Create: ✅ (свое расписание)
- Read: ✅ (все расписания)
- Update: ✅ (свое расписание)

---

## Проверка работы

После настройки коллекций проверь:

1. ✅ Создание мастера при первом входе
2. ✅ Добавление/удаление услуг
3. ✅ Создание/удаление записей
4. ✅ Обновление профиля мастера
5. ✅ Блокировка/разблокировка времени
6. ✅ Сохранение расписания работы
7. ✅ Клиент может записаться через публичную ссылку

---

## Полезные SQL запросы для проверки

```sql
-- Проверить всех мастеров
SELECT * FROM masters;

-- Проверить услуги конкретного мастера
SELECT * FROM services WHERE master = 'MASTER_ID';

-- Проверить записи конкретного мастера
SELECT * FROM appointments WHERE master = 'MASTER_ID';

-- Проверить блокировки времени
SELECT * FROM time_blocks WHERE master = 'MASTER_ID';

-- Проверить расписание
SELECT * FROM schedules WHERE master = 'MASTER_ID';
```
