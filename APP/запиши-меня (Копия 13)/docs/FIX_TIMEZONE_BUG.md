# Исправление бага с часовыми поясами

## Проблема
Записи, созданные на одну дату, в календаре мастера отображались на следующий день (+1 день). Это классическая проблема с неправильной обработкой часовых поясов на фронтенде.

## Причина
Использование `new Date()` и `toISOString().split('T')[0]` для получения даты приводило к некорректной конвертации между UTC и локальным временем пользователя.

## Решение

### 1. Установлена библиотека date-fns-tz
```bash
npm install date-fns date-fns-tz
```

### 2. Исправлены файлы

#### index.tsx
- Добавлен импорт: `import { toZonedTime, format as formatTz } from 'date-fns-tz';`
- Исправлена функция `convertDirectusAppointmentToLocal`:
  - Вместо `new Date(directusAppt.dateTime)` используется `toZonedTime(directusAppt.dateTime, timeZone)`
  - Вместо `dateTime.toISOString().split('T')[0]` используется `formatTz(localDateTime, 'yyyy-MM-dd', { timeZone })`
  - Вместо `dateTime.toTimeString().substring(0, 5)` используется `formatTz(localDateTime, 'HH:mm', { timeZone })`

- Исправлена функция `getAvailableTimes`:
  - Вместо `date.toISOString().split('T')[0]` используется `formatTz(date, 'yyyy-MM-dd', { timeZone })`

- Исправлен код отображения календаря (weekDays.map):
  - Вместо `day.toISOString().split('T')[0]` используется `formatTz(day, 'yyyy-MM-dd', { timeZone })`

#### src/components/BookingCard.tsx
- Добавлен импорт: `import { toZonedTime, format as formatTz } from 'date-fns-tz';`
- Исправлена функция `formatDateTime`:
  - Вместо `new Date(isoString)` используется `toZonedTime(isoString, timeZone)`
  - Добавлен параметр `timeZone` в `toLocaleString`

## Ключевой принцип
**Никогда не использовать `new Date(isoString)` для получения дня/месяца/часа напрямую.**

Всегда:
1. Получить часовой пояс пользователя: `const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;`
2. Конвертировать дату из UTC в локальный часовой пояс: `const localDate = toZonedTime(isoString, timeZone);`
3. Работать с локальной датой для отображения

## Результат
Теперь записи корректно отображаются в календаре на той дате, на которую они были созданы, независимо от часового пояса пользователя.
