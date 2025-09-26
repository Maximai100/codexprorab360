# Строительный калькулятор - Рефакторинг

## 📁 Новая структура проекта

```
src/
├── components/
│   ├── calculators/          # Калькуляторы материалов
│   │   ├── PlasterCalculator.tsx
│   │   ├── PuttyCalculator.tsx
│   │   ├── PaintCalculator.tsx
│   │   ├── WallpaperCalculator.tsx
│   │   ├── DrywallCalculator.tsx
│   │   ├── TileCalculator.tsx
│   │   ├── LaminateCalculator.tsx
│   │   └── index.ts
│   ├── modals/              # Модальные окна
│   │   ├── SaveEstimateModal.tsx
│   │   ├── LoadEstimateModal.tsx
│   │   ├── MaterialLibraryModal.tsx
│   │   └── index.ts
│   ├── common/              # Общие компоненты
│   │   ├── Icon.tsx
│   │   ├── CalcInput.tsx
│   │   ├── BaseCalculator.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/                   # Кастомные хуки
│   ├── useCalculations.ts
│   ├── useTheme.ts
│   ├── useStorage.ts
│   └── index.ts
├── utils/                   # Утилиты
│   ├── calculations.ts
│   └── index.ts
├── types/                   # Типы TypeScript
│   └── index.ts
├── __tests__/               # Тесты
│   └── calculations.test.ts
└── index.ts                 # Главный экспорт
```

## 🎯 Основные улучшения

### ✅ **Модульность**
- Разделение на логические модули
- Четкая структура папок
- Переиспользуемые компоненты

### ✅ **Типизация**
- Строгая типизация всех интерфейсов
- Вынесение типов в отдельный файл
- Generic типы для калькуляторов

### ✅ **Переиспользование кода**
- Базовый компонент `BaseCalculator`
- Общие хуки для расчетов
- Унифицированные компоненты

### ✅ **Обработка ошибок**
- Класс `CalculatorError`
- Валидация входных данных
- Безопасная работа с localStorage

### ✅ **Тестирование**
- Unit тесты для критических функций
- Покрытие основных алгоритмов
- Тестирование валидации

### ✅ **Доступность**
- ARIA атрибуты
- Клавиатурная навигация
- Семантическая разметка

## 🔧 Использование

### Импорт компонентов
```typescript
import { PlasterCalculator, PaintCalculator } from './src/components/calculators';
import { SaveEstimateModal } from './src/components/modals';
import { CalcInput, Icon } from './src/components/common';
```

### Использование хуков
```typescript
import { useBagCalculation, useTheme } from './src/hooks';
import { calculateRoomMetrics } from './src/utils';
```

### Типы
```typescript
import { RoomData, MaterialResult, SavedEstimate } from './src/types';
```

## 🧪 Тестирование

Запуск тестов:
```bash
npm test
```

Покрытие тестами:
- ✅ `convertToMeters` - конвертация единиц измерения
- ✅ `calculateRoomMetrics` - расчет метрик помещений
- ✅ `validateNumber` - валидация чисел
- ✅ `calculateBagQuantity` - расчет количества мешков

## 📊 Статистика рефакторинга

**До:**
- 1 файл (2200+ строк)
- Дублирование кода
- Отсутствие тестов
- Слабая типизация

**После:**
- 25+ модульных файлов
- Переиспользуемые компоненты
- Unit тесты
- Строгая типизация
- Улучшенная архитектура

## 🚀 Следующие шаги

1. **Интеграция** - Обновить основной файл `index.tsx`
2. **Миграция** - Перенести оставшиеся калькуляторы
3. **Тестирование** - Добавить E2E тесты
4. **Оптимизация** - Lazy loading компонентов
5. **Документация** - Storybook для компонентов


