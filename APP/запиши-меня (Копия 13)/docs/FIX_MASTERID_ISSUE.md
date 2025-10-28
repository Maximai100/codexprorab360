# Исправление ошибки "Отсутствует параметр startapp"

## Проблема
При создании записи на стороне клиента появлялась ошибка:
```
❌ Отсутствует параметр startapp в URL (masterId).
```

## Причина
Функция `handleBook` пыталась получить `masterId` из URL-параметра `startapp` с помощью `getNumberParam('startapp')`, но в Telegram WebApp параметр передается как `start_param` в объекте `tg.initDataUnsafe`, а не в URL.

## Решение

### 1. Добавлено состояние для masterId
```typescript
const [masterId, setMasterId] = useState<number | null>(null);
```

### 2. Сохранение masterId при загрузке данных
В обоих режимах (мастер и клиент) теперь сохраняется `masterId`:

**Режим мастера:**
```typescript
setMasterId(masterData.id);
```

**Режим клиента:**
```typescript
setMasterId(masterData.id); // Получаем из данных мастера по startParam
```

### 3. Передача masterId в ClientBookingPage
Обновлен интерфейс компонента:
```typescript
const ClientBookingPage: FC<{ 
  masterName: string; 
  profession: string; 
  masterId: number; // Добавлен параметр
  // ... остальные параметры
}> = ({ masterName, profession, masterId, ... }) => {
```

### 4. Использование masterId в handleBook
Вместо получения из URL:
```typescript
// Было:
const masterId = getNumberParam('startapp');

// Стало:
// masterId уже доступен из пропсов компонента
if (!masterId) {
    showToast('❌ Ошибка: не удалось определить мастера.');
    return;
}
```

### 5. Условный рендеринг
Добавлена проверка наличия `masterId` перед рендерингом:
```typescript
{isClientView ? (
    masterId ? (
        <ClientBookingPage masterId={masterId} ... />
    ) : (
        <div>Загрузка данных мастера...</div>
    )
) : ...}
```

## Результат
Теперь `masterId` корректно определяется из данных, загруженных с сервера Directus, а не из URL-параметров. Это работает как для режима мастера, так и для клиентского режима.

## Тестирование
1. Откройте приложение в клиентском режиме (с параметром `start_param`)
2. Выберите услугу и заполните форму записи
3. Нажмите "ЗАПИСАТЬСЯ"
4. Уведомление должно успешно отправиться на бэкенд с правильным `masterId`
