# Функция экспорта записей в CSV

## Описание
Добавлена кнопка экспорта в разделе "Мои клиенты", которая позволяет скачать все записи в формате CSV, совместимом с Google Sheets и Excel.

## Реализованные изменения

### 1. index.tsx

#### Добавлена иконка "download"
В компонент `Icon` добавлена SVG-иконка для скачивания:
```tsx
download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
</svg>
```

#### Обновлен компонент BottomSheet
Добавлен опциональный пропс `actions` для размещения дополнительных элементов в заголовке:
```tsx
const BottomSheet: FC<{ 
  title: string; 
  children: React.ReactNode; 
  onClose: () => void; 
  actions?: React.ReactNode 
}> = ({ title, children, onClose, actions }) => {
  // ...
  {actions && <div className="bottom-sheet-header-actions">{actions}</div>}
}
```

#### Обновлен компонент ClientsSheet
Добавлены новые пропсы:
- `services: Service[]` - для получения цен услуг
- `showToast: (message: string) => void` - для отображения уведомлений

Добавлена функция экспорта `handleExportCSV`:
- Создает CSV-файл с заголовками: Дата, Время, Имя клиента, Телефон клиента, Услуга, Длительность (мин), Цена (₽)
- Сортирует записи по дате и времени
- Экранирует специальные символы в данных (кавычки, запятые)
- Добавляет BOM (`\uFEFF`) для корректного отображения кириллицы в Excel
- Генерирует имя файла с текущей датой: `zapisi_YYYY-MM-DD.csv`
- Показывает тост-уведомление и тактильную обратную связь

Добавлена кнопка экспорта:
```tsx
const exportButton = (
  <button className="icon-btn" onClick={handleExportCSV} title="Экспорт в CSV">
    <Icon name="download" />
  </button>
);
```

Кнопка передается в `BottomSheet` через пропс `actions`.

#### Обновлено использование ClientsSheet
В основном компоненте приложения добавлены недостающие пропсы:
```tsx
case 'clients':
  return <ClientsSheet 
    appointments={appointments} 
    services={services} 
    clientNotes={clientNotes} 
    setClientNotes={setClientNotes} 
    showToast={showToast} 
    onClose={() => setActiveSheet(null)} 
  />;
```

### 2. index.css

#### Добавлены стили для контейнера кнопок в заголовке
```css
.bottom-sheet-header-actions {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}
```

#### Добавлены стили для иконочной кнопки
```css
.icon-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.icon-btn:hover {
    background-color: var(--tg-theme-bg-color, #eff3f8);
}

.icon-btn:active {
    opacity: 0.7;
}
```

## Использование

1. Откройте раздел "Мои клиенты" в приложении
2. В правом верхнем углу заголовка появится иконка скачивания
3. Нажмите на иконку для экспорта всех записей
4. Файл `zapisi_YYYY-MM-DD.csv` автоматически загрузится на устройство
5. Откройте файл в Google Sheets или Excel

## Особенности реализации

- **Кодировка UTF-8 с BOM**: Обеспечивает корректное отображение кириллицы в Excel
- **Экранирование данных**: Все текстовые поля оборачиваются в кавычки, внутренние кавычки удваиваются
- **Сортировка**: Записи экспортируются в хронологическом порядке (от старых к новым)
- **Цены**: Автоматически подтягиваются из справочника услуг
- **Тактильная обратная связь**: Вибрация при успешном экспорте (Telegram Haptic Feedback)

## Формат CSV

```csv
Дата,Время,Имя клиента,Телефон клиента,Услуга,Длительность (мин),Цена (₽)
20.10.2025,10:00,"Иван Иванов","+7 (999) 123-45-67","Стрижка",60,1500
21.10.2025,14:30,"Мария Петрова","","Окрашивание",120,3000
```

## Совместимость

✅ Google Sheets  
✅ Microsoft Excel  
✅ LibreOffice Calc  
✅ Numbers (macOS)  
✅ Любые другие программы, поддерживающие CSV с UTF-8
