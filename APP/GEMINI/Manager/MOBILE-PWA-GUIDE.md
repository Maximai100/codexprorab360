# Руководство по мобильной PWA версии

## Что было реализовано

### ✅ 1. PWA Infrastructure
- Установлен и настроен `vite-plugin-pwa`
- Создан `manifest.json` с метаданными приложения
- Сгенерированы иконки приложения (72x72 до 512x512)
- Настроен Service Worker с Workbox для кэширования
- Добавлена регистрация SW в приложении

### ✅ 2. Offline Data Storage
- Установлен Dexie.js для работы с IndexedDB
- Создана схема БД для owners, projects, syncQueue, metadata
- Реализован Sync Manager для офлайн-синхронизации
- Добавлены индикаторы офлайн-статуса
- Реализована очередь синхронизации

### ✅ 3. Mobile Navigation
- Создан компонент Bottom Navigation для мобильных
- Реализовано мобильное меню профиля (Bottom Sheet)
- Добавлена поддержка safe-area для устройств с вырезами

### ✅ 4. Mobile Card Components
- Создан OwnerCard для отображения собственников
- Создан ProjectCard для отображения проектов
- Компоненты оптимизированы для сенсорного управления

### ✅ 8. Responsive Layout System
- Созданы хуки useMediaQuery, useIsMobile, useIsTablet, useIsDesktop
- Адаптирован Dashboard для мобильных (карточки вместо таблицы)
- Адаптирован Header для разных размеров экрана
- Добавлена поддержка safe-area insets

## Структура проекта

```
├── components/
│   ├── mobile/
│   │   ├── BottomNav.tsx          # Нижняя навигация
│   │   ├── BottomSheet.tsx        # Выдвижная панель снизу
│   │   ├── ProfileMenu.tsx        # Меню профиля
│   │   ├── OwnerCard.tsx          # Карточка собственника
│   │   ├── ProjectCard.tsx        # Карточка проекта
│   │   └── ProjectList.tsx        # Список проектов
│   ├── ResponsiveDashboard.tsx    # Адаптивный дашборд
│   └── OfflineIndicator.tsx       # Индикатор офлайн-режима
├── hooks/
│   ├── useMediaQuery.ts           # Хук для медиа-запросов
│   ├── useOnlineStatus.ts         # Хук для статуса подключения
│   └── useSyncStatus.ts           # Хук для статуса синхронизации
├── services/
│   ├── db.ts                      # IndexedDB с Dexie
│   └── syncManager.ts             # Менеджер синхронизации
├── public/
│   └── icons/                     # Иконки PWA
└── scripts/
    └── generate-icons.js          # Генератор иконок
```

## Как использовать

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

### Сборка для production

```bash
npm run build
```

### Тестирование PWA

1. Соберите приложение: `npm run build`
2. Запустите preview: `npm run preview`
3. Откройте в браузере и проверьте:
   - Установку PWA (кнопка "Установить" в адресной строке)
   - Работу офлайн (отключите сеть в DevTools)
   - Кэширование (проверьте Application > Cache Storage)

### Тестирование на мобильных устройствах

1. Убедитесь, что приложение доступно по сети (не localhost)
2. Откройте на мобильном устройстве
3. В Chrome/Safari выберите "Добавить на главный экран"
4. Приложение установится как нативное

## Основные возможности

### Офлайн-режим

- Приложение работает без интернета
- Данные кэшируются локально в IndexedDB
- Изменения синхронизируются при восстановлении связи
- Индикатор показывает статус подключения

### Мобильная навигация

- На мобильных: нижняя панель навигации
- На десктопе: верхняя панель с вкладками
- Плавные переходы между разделами

### Адаптивный интерфейс

- Мобильные (< 640px): карточки, одна колонка
- Планшеты (640-1023px): сетка, две колонки
- Десктоп (> 1024px): таблицы, несколько колонок

### Touch-оптимизация

- Минимальный размер кнопок: 44x44px
- Активные состояния для тапов
- Поддержка safe-area для устройств с вырезами

## Что осталось реализовать

### Приоритет 1 (Критично)
- [ ] 5. Gesture Support (свайпы, long press, pull-to-refresh)
- [ ] 6. Full-Screen Mobile Modals
- [ ] 7. Mobile Forms Optimization

### Приоритет 2 (Важно)
- [ ] 9. Performance Optimizations (code splitting, lazy loading)
- [ ] 10. Camera Integration
- [ ] 11. Push Notifications

### Приоритет 3 (Желательно)
- [ ] 12. Additional Mobile Features (Share API, Geolocation)
- [ ] 13. Accessibility Features
- [ ] 14. Service Worker Caching Strategies (расширенные)
- [ ] 15. Update Management
- [ ] 16. Testing and QA
- [ ] 17. Documentation and Deployment

## Известные ограничения

1. **Иконки**: Текущие иконки - это заглушки (SVG с буквой "С"). Для production нужны профессиональные PNG иконки.

2. **Directus интеграция**: Функции `createOwner`, `updateOwner`, `deleteOwner`, `fetchOwners`, `createProject`, `updateProject`, `deleteProject`, `fetchProjects` должны быть реализованы в `services/directus.ts`.

3. **Жесты**: Базовые жесты (свайпы, long press) еще не реализованы. Нужна библиотека `react-use-gesture`.

4. **Модальные окна**: Текущие модальные окна не адаптированы для полноэкранного режима на мобильных.

## Следующие шаги

1. **Реализовать жесты** (Задача 5):
   ```bash
   npm install @use-gesture/react
   ```

2. **Адаптировать модальные окна** (Задача 6):
   - Сделать полноэкранными на мобильных
   - Добавить swipe-to-close

3. **Оптимизировать формы** (Задача 7):
   - Правильные типы клавиатур
   - Увеличенные поля ввода
   - Фиксированные кнопки действий

4. **Добавить code splitting** (Задача 9.1):
   - Разделить код по роутам
   - Lazy loading для модалей

5. **Провести тестирование** (Задача 16):
   - Lighthouse audit
   - Тестирование на реальных устройствах
   - Проверка офлайн-функциональности

## Полезные команды

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка
npm run build

# Preview production build
npm run preview

# Генерация иконок
node scripts/generate-icons.js

# Проверка Directus
npm run check-directus
```

## Поддержка браузеров

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- iOS Safari 14+
- Chrome Android 90+

## Ресурсы

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Dexie.js](https://dexie.org/)
- [Workbox](https://developers.google.com/web/tools/workbox)
