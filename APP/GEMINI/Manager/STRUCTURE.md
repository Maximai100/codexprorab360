# 📁 Структура проекта

```
.
├── components/                 # React компоненты
│   ├── icons/                 # Иконки
│   │   └── Icons.tsx
│   ├── manager/               # Компоненты для менеджера проектов
│   │   ├── FilterBar.tsx
│   │   ├── Header.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── ProjectDetailModal.tsx
│   │   ├── ProjectRow.tsx
│   │   ├── ProjectTable.tsx
│   │   └── StatusBadge.tsx
│   ├── AddColumnModal.tsx     # Модалка добавления колонки
│   ├── AddOwnerModal.tsx      # Модалка добавления собственника
│   ├── AttributeModal.tsx     # Модалка атрибута
│   ├── Dashboard.tsx          # Главная панель
│   ├── DocumentCell.tsx       # Ячейка документа
│   ├── DocumentModal.tsx      # Модалка документа
│   ├── Login.tsx              # Форма входа
│   ├── Modal.tsx              # Базовая модалка
│   └── OwnerModal.tsx         # Модалка собственника
│
├── context/                   # React Context
│   └── AuthContext.tsx        # Контекст аутентификации
│
├── hooks/                     # Custom React hooks
│   ├── useMockData.ts         # Mock данные (не используется)
│   ├── useOwnersData.ts       # Хук для работы с собственниками
│   └── useProjectData.ts      # Хук для работы с проектами
│
├── services/                  # API сервисы
│   ├── auth.ts                # Сервис аутентификации (mock)
│   └── directus.ts            # Сервис работы с Directus API
│
├── types/                     # TypeScript типы
│   └── manager.ts             # Типы для менеджера проектов
│
├── App.tsx                    # Главный компонент приложения
├── config.ts                  # Конфигурация Directus
├── index.tsx                  # Точка входа React
├── index.html                 # HTML шаблон
├── index.css                  # Глобальные стили
├── types.ts                   # Общие типы
├── vite.config.ts             # Конфигурация Vite
├── tsconfig.json              # Конфигурация TypeScript
├── package.json               # Зависимости и скрипты
│
├── .env.local                 # Переменные окружения (Directus)
├── .gitignore                 # Игнорируемые файлы
│
└── Документация/
    ├── README.md              # Общая информация
    ├── START.md               # Быстрый старт
    ├── DEPLOY.md              # Инструкция по деплою
    ├── ГОТОВО.md              # Резюме готовности
    ├── CHECKLIST.md           # Чеклист
    ├── STRUCTURE.md           # Этот файл
    └── check-directus.js      # Скрипт проверки Directus
```

## Ключевые файлы

### Конфигурация
- **config.ts** - URL и токен Directus
- **.env.local** - Переменные окружения
- **vite.config.ts** - Настройки сборщика

### Точки входа
- **index.html** - HTML шаблон
- **index.tsx** - Инициализация React
- **App.tsx** - Главный компонент с роутингом

### API интеграция
- **services/directus.ts** - Все запросы к Directus API
- **services/auth.ts** - Mock аутентификация

### Управление состоянием
- **hooks/useOwnersData.ts** - Состояние собственников
- **hooks/useProjectData.ts** - Состояние проектов
- **context/AuthContext.tsx** - Состояние аутентификации

## Потоки данных

### Собственники
```
useOwnersData → directus.ts → Directus API
     ↓
Dashboard → OwnerModal/DocumentModal/AttributeModal
```

### Проекты
```
useProjectData → directus.ts → Directus API
     ↓
ManagerDashboard → ProjectTable → ProjectRow → ProjectDetailModal
```

### Аутентификация
```
Login → AuthContext → auth.ts (mock)
  ↓
App (проверка isAuthenticated)
```
