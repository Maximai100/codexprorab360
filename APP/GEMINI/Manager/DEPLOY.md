# Инструкция по деплою приложения

## Подготовка к запуску

### 1. Установка зависимостей
```bash
npm install
```

### 2. Проверка конфигурации Directus

Убедитесь, что в вашем Directus созданы следующие коллекции:

#### Коллекция `owners` (Собственники)
Поля:
- `id` (UUID, Primary Key)
- `name` (String) - Имя собственника
- `contact` (JSON) - Контактные данные
- `apartments` (JSON) - Список апартаментов
- `notes` (Text) - Заметки
- `data` (JSON) - Данные по документам и атрибутам

#### Коллекция `projects` (Проекты)
Поля:
- `id` (UUID, Primary Key)
- `name` (String) - Название проекта
- `responsible` (String) - Ответственный
- `deadline` (DateTime) - Дедлайн
- `status` (String) - Статус (в работе/завершено/архив)
- `attachments` (Many-to-Many к directus_files) - Вложения
- `notes` (Text) - Заметки
- `history` (JSON) - История изменений
- `tags` (JSON) - Теги

### 3. Настройка переменных окружения

Файл `.env.local` уже настроен с вашими данными:
```
VITE_DIRECTUS_URL=https://1.cycloscope.online
VITE_DIRECTUS_STATIC_TOKEN=7JeEQ9bKtgX7onxJQZyGu8w8tCziiblV
```

### 4. Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 5. Сборка для продакшена
```bash
npm run build
```

Собранные файлы будут в папке `dist/`

### 6. Предпросмотр продакшен-сборки
```bash
npm run preview
```

## Данные для входа

Приложение использует mock-аутентификацию. Доступные учетные записи:

**Руководитель (полный доступ):**
- Логин: `director`
- Пароль: `password`

**Менеджер (только проекты):**
- Логин: `manager`
- Пароль: `password`

## Деплой на хостинг

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Другие платформы
Загрузите содержимое папки `dist/` на ваш хостинг после выполнения `npm run build`

## Важные замечания

1. **CORS**: Убедитесь, что в настройках Directus разрешены запросы с домена вашего приложения
2. **Токен**: Статический токен должен иметь права на чтение и запись в коллекции `owners` и `projects`
3. **HTTPS**: Рекомендуется использовать HTTPS для безопасной передачи токена

## Структура проекта

- `/components` - React компоненты
- `/services` - API сервисы для работы с Directus
- `/hooks` - Custom React hooks
- `/types` - TypeScript типы
- `/context` - React Context (аутентификация)
- `config.ts` - Конфигурация Directus

## Troubleshooting

### Ошибка подключения к Directus
- Проверьте, что Directus доступен по адресу https://1.cycloscope.online
- Проверьте валидность токена
- Проверьте настройки CORS в Directus

### Ошибка "Failed to fetch"
- Убедитесь, что коллекции `owners` и `projects` существуют
- Проверьте права доступа токена к этим коллекциям
