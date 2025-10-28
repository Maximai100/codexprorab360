# Changelog - Интеграция с Directus

## ✅ Выполненные изменения

### 1. Добавлены интерфейсы для Directus API
- `DirectusService` - для работы с услугами
- `DirectusAppointment` - для работы с записями
- `DirectusTimeBlock` - для работы с блокировками времени
- `DirectusSchedule` - для работы с расписанием

### 2. Созданы функции конвертации данных
- `convertDirectusAppointmentToLocal()` - преобразует данные из БД в формат UI
- `convertLocalAppointmentToDirectus()` - преобразует данные из UI в формат БД

### 3. Обновлены обработчики для работы с API

#### Записи (Appointments):
- ✅ `handleBookAppointment()` - создает запись в БД через POST
- ✅ `handleCancelAppointment()` - удаляет запись из БД через DELETE

#### Услуги (Services):
- ✅ `handleAddService()` - создает услугу в БД с привязкой к мастеру
- ✅ `handleDeleteService()` - удаляет услугу из БД

#### Профиль (Master):
- ✅ `ProfileSheet` - обновляет профиль мастера через PATCH
- ✅ Автоматическое создание мастера при первом входе

#### Блокировки времени (Time Blocks):
- ✅ `handleAddTimeBlock()` - создает блокировку в БД
- ✅ `handleRemoveTimeBlock()` - удаляет блокировку из БД

#### Расписание (Schedule):
- ✅ `ScheduleSheet` - сохраняет/обновляет расписание в БД
- ✅ Автоматическое создание или обновление существующего расписания

### 4. Обновлена загрузка данных при инициализации

#### Режим мастера:
- ✅ Загрузка профиля мастера
- ✅ Автоматическое создание записи мастера, если не существует
- ✅ Загрузка услуг мастера
- ✅ Загрузка записей мастера
- ✅ Загрузка блокировок времени
- ✅ Загрузка расписания работы

#### Режим клиента:
- ✅ Загрузка профиля мастера по `startParam`
- ✅ Загрузка услуг мастера
- ✅ Загрузка записей (для проверки занятости)
- ✅ Загрузка блокировок времени
- ✅ Загрузка расписания работы

### 5. Улучшения UX
- ✅ Добавлены индикаторы загрузки (isSaving, isSubmitting)
- ✅ Добавлена тактильная обратная связь (HapticFeedback)
- ✅ Улучшена обработка ошибок с выводом в консоль
- ✅ Добавлены toast-уведомления для всех операций

### 6. Исправлены проблемы с полями ввода
- ✅ Добавлены обработчики `onFocus` для всех input полей
- ✅ Обновлен CSS для разрешения взаимодействия с полями
- ✅ Изменен viewport для корректной работы клавиатуры в Telegram

### 7. Исправлены TypeScript ошибки
- ✅ Создан файл `vite-env.d.ts` с типами для `import.meta.env`

---

## 📋 Структура данных

### Локальные интерфейсы (UI):
```typescript
interface Service { 
  id?: string; 
  name: string; 
  price: number; 
  duration: number; 
}

interface Appointment { 
  id: string; 
  clientName: string; 
  clientPhone?: string; 
  service: string; // название услуги
  time: string; // "HH:MM"
  date: string; // "YYYY-MM-DD"
  duration: number; 
  telegramId?: number; 
  reminderSent?: boolean; 
}

interface TimeBlock { 
  id: string; 
  date: string; 
  startTime: string; 
  endTime: string; 
  title: string; 
}

interface Schedule { 
  [day: string]: { 
    enabled: boolean; 
    startTime: string; 
    endTime: string; 
  } 
}
```

### Directus интерфейсы (API):
```typescript
interface DirectusService { 
  id?: string; 
  master: string | number; 
  name: string; 
  price: number; 
  duration: number; 
}

interface DirectusAppointment { 
  id?: string; 
  master: string | number; 
  service: string | number; // ID услуги
  clientName: string; 
  clientPhone?: string; 
  clientTelegramId?: number; 
  dateTime: string; // ISO 8601
  reminderSent?: boolean; 
}

interface DirectusTimeBlock {
  id?: string;
  master: string | number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

interface DirectusSchedule {
  id?: string;
  master: string | number;
  schedule: Schedule; // JSON
}
```

---

## 🔄 Поток данных

### Создание записи (клиент записывается):
1. Клиент заполняет форму → `BookingPanel`
2. Данные передаются в `handleBookAppointment()`
3. Конвертация через `convertLocalAppointmentToDirectus()`
4. POST запрос в `/items/appointments`
5. Ответ конвертируется через `convertDirectusAppointmentToLocal()`
6. Обновление локального state
7. Toast-уведомление + тактильная обратная связь

### Добавление услуги (мастер):
1. Мастер заполняет форму → `ServicesSheet`
2. Получение ID мастера из БД
3. POST запрос в `/items/services` с полем `master`
4. Обновление локального state
5. Toast-уведомление + тактильная обратная связь

### Сохранение расписания (мастер):
1. Мастер редактирует расписание → `ScheduleSheet`
2. Получение ID мастера из БД
3. Проверка существования расписания (GET)
4. PATCH (если существует) или POST (если новое)
5. Обновление локального state
6. Закрытие модального окна

---

## 🧪 Тестирование

### Что нужно проверить:

1. **Первый вход мастера:**
   - [ ] Автоматически создается запись в `masters`
   - [ ] Отображается приветственный экран
   - [ ] После "Начать работу" показывается дашборд

2. **Управление услугами:**
   - [ ] Добавление услуги сохраняется в БД
   - [ ] Удаление услуги удаляет из БД
   - [ ] Услуги отображаются корректно

3. **Управление записями:**
   - [ ] Клиент может записаться через публичную ссылку
   - [ ] Запись сохраняется в БД
   - [ ] Мастер видит запись в календаре
   - [ ] Мастер может отменить запись

4. **Блокировки времени:**
   - [ ] Мастер может заблокировать время
   - [ ] Блокировка сохраняется в БД
   - [ ] Заблокированное время недоступно для записи
   - [ ] Мастер может разблокировать время

5. **Расписание работы:**
   - [ ] Мастер может настроить расписание
   - [ ] Расписание сохраняется в БД
   - [ ] Клиент видит только доступные дни/часы

6. **Профиль мастера:**
   - [ ] Мастер может изменить имя и специализацию
   - [ ] Изменения сохраняются в БД
   - [ ] Изменения отображаются в публичной ссылке

---

## 📝 Известные ограничения

1. **Напоминания:** Функция отправки напоминаний пока симулируется (нужен бот)
2. **Права доступа:** Нужно настроить в Directus (см. `directus_setup_guide.md`)
3. **Валидация:** Базовая валидация на фронтенде, нужно добавить на бэкенде

---

## 🚀 Следующие шаги

1. Настроить коллекции в Directus (см. `directus_setup_guide.md`)
2. Настроить права доступа
3. Протестировать все функции
4. Настроить Telegram бота для отправки напоминаний
5. Добавить обработку ошибок сети (offline mode)
6. Добавить кэширование данных
