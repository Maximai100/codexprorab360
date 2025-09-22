# Руководство по интеграции калькулятора

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install xlsx@^0.18.5 jspdf@^2.5.1 jspdf-autotable@^3.6.0
npm install --save-dev @types/xlsx@^0.0.36
```

### 2. Импорт модуля

```typescript
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';
```

### 3. Базовое использование

```tsx
import React from 'react';
import { CalculatorModule } from './path/to/calculator';

function App() {
  return (
    <div className="app">
      <CalculatorModule 
        config={{
          theme: 'light',
          enableOfflineMode: true,
          enableAutoSave: true,
          enableExport: true
        }}
        className="my-calculator"
      />
    </div>
  );
}

export default App;
```

### 4. Подключение стилей

```css
/* В вашем основном CSS файле */
@import './path/to/calculator/styles/index.css';
@import './path/to/calculator/integration/styles/isolation.css';
```

## ⚙️ Конфигурация

### CalculatorConfig

```typescript
interface CalculatorConfig {
  // Тема
  theme?: 'light' | 'dark';
  
  // Функциональность
  enableOfflineMode?: boolean;
  enableAutoSave?: boolean;
  enableExport?: boolean;
  enableTelegramIntegration?: boolean;
  
  // Пользовательские материалы
  customMaterials?: SavedMaterial[];
  
  // Обратные вызовы
  onDataChange?: (rooms: RoomData[], materials: SavedMaterial[]) => void;
  onExport?: (format: string, data: any) => void;
  onRoomAdded?: (room: RoomData) => void;
  onRoomUpdated?: (room: RoomData) => void;
  onRoomDeleted?: (roomId: number) => void;
  onMaterialAdded?: (material: SavedMaterial) => void;
  onMaterialUpdated?: (material: SavedMaterial) => void;
  onMaterialDeleted?: (materialId: number) => void;
  onError?: (error: CalculatorError) => void;
}
```

### CalculatorModuleProps

```typescript
interface CalculatorModuleProps {
  // Конфигурация
  config?: CalculatorConfig;
  
  // Начальные данные
  initialRooms?: RoomData[];
  initialMaterials?: SavedMaterial[];
  
  // Стили
  className?: string;
  style?: React.CSSProperties;
  
  // Режимы отображения
  readOnly?: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
  showExportControls?: boolean;
}
```

## 📊 Типы данных

### RoomData

```typescript
interface RoomData {
  id: number;
  name: string;
  length: number;
  width: number;
  height: number;
  unit: 'm' | 'cm' | 'mm';
  openings: Opening[];
  exclusions: ExclusionZone[];
  geometricElements: GeometricElement[];
  image?: RoomImage;
  notes?: string;
}
```

### SavedMaterial

```typescript
interface SavedMaterial {
  id: number;
  name: string;
  category: MaterialCategory;
  price: number;
  unit: string;
  coverage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### MaterialResult

```typescript
interface MaterialResult {
  material: SavedMaterial;
  quantity: number;
  cost: number;
  unit: string;
  coverage?: number;
}
```

## 🎨 Стилизация

### CSS переменные

```css
.calculator-module {
  /* Основные цвета */
  --calc-primary-color: #3390ec;
  --calc-primary-hover: #2980d6;
  --calc-primary-active: #1f6bb3;
  
  /* Фоновые цвета */
  --calc-bg-primary: #ffffff;
  --calc-bg-secondary: #f8f9fa;
  --calc-bg-hover: #f0f0f0;
  
  /* Текстовые цвета */
  --calc-text-primary: #333333;
  --calc-text-secondary: #666666;
  --calc-text-hint: #999999;
  
  /* Границы */
  --calc-border-light: #e0e0e0;
  --calc-border-medium: #cccccc;
  --calc-border-dark: #999999;
}
```

### Темная тема

```css
.calculator-module[data-theme="dark"] {
  --calc-bg-primary: #1a1a1a;
  --calc-bg-secondary: #2d2d2d;
  --calc-text-primary: #ffffff;
  --calc-text-secondary: #cccccc;
  --calc-border-light: #404040;
}
```

### Адаптивность

```css
/* Мобильные устройства */
@media (max-width: 768px) {
  .calculator-module {
    --room-card-width: 100%;
    --input-height: 44px;
    --button-height: 44px;
  }
}
```

## 🔧 API методы

### useCalculator хук

```typescript
const {
  // Состояние
  rooms,
  materials,
  materialResults,
  totalMetrics,
  totalCost,
  calculatorData,
  isLoading,
  error,
  theme,
  
  // Действия с комнатами
  addRoom,
  updateRoom,
  deleteRoom,
  setRooms,
  
  // Действия с материалами
  addMaterial,
  updateMaterial,
  deleteMaterial,
  setMaterials,
  
  // Результаты материалов
  updateMaterialResult,
  
  // Сметы
  saveEstimate,
  loadEstimate,
  deleteEstimate,
  
  // Экспорт
  exportData,
  
  // Утилиты
  clearData,
  clearError,
  toggleTheme
} = useCalculator(config);
```

### Утилиты

```typescript
// Расчеты
import { 
  calculateRoomMetrics,
  calculateTotalMetrics,
  convertToMeters,
  validateRoomDimensions
} from './path/to/calculator';

// Валидация
import { 
  validateRoom,
  validateOpening,
  validateExclusion,
  validateGeometricElement
} from './path/to/calculator';

// Экспорт
import { 
  exportToPDF,
  exportToExcel,
  exportToJSON
} from './path/to/calculator';
```

## 📱 События

### Обработка событий

```typescript
const config: CalculatorConfig = {
  onDataChange: (rooms, materials) => {
    console.log('Данные изменились:', { rooms, materials });
    // Синхронизация с вашим приложением
  },
  
  onExport: (format, data) => {
    console.log('Экспорт:', format, data);
    // Обработка экспорта
  },
  
  onError: (error) => {
    console.error('Ошибка калькулятора:', error);
    // Обработка ошибок
  }
};
```

## 🔄 Интеграция с внешними системами

### Сохранение данных

```typescript
const config: CalculatorConfig = {
  onDataChange: async (rooms, materials) => {
    try {
      await fetch('/api/calculator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms, materials })
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  }
};
```

### Загрузка данных

```typescript
const [initialData, setInitialData] = useState(null);

useEffect(() => {
  fetch('/api/calculator/load')
    .then(res => res.json())
    .then(data => setInitialData(data));
}, []);

return (
  <CalculatorModule 
    initialRooms={initialData?.rooms}
    initialMaterials={initialData?.materials}
    config={config}
  />
);
```

## 🧪 Тестирование

### Тестовая страница

Откройте `integration/test-isolation.html` в браузере для проверки изоляции стилей.

### Автоматические тесты

```bash
# Запуск скриптов проверки
./integration/scripts/check-build.sh
./integration/scripts/final-check.sh
```

## 🚨 Решение проблем

### Конфликты стилей

1. Убедитесь, что подключен `isolation.css`
2. Проверьте, что калькулятор обернут в `.calculator-module`
3. Используйте CSS переменные для кастомизации

### Ошибки TypeScript

1. Проверьте импорты типов
2. Убедитесь, что установлены `@types/xlsx`
3. Проверьте совместимость версий React

### Проблемы с производительностью

1. Используйте `React.memo` для оптимизации
2. Ограничьте количество комнат и материалов
3. Включите автосохранение для больших проектов

## 📚 Дополнительные ресурсы

- [API Reference](./API_REFERENCE.md) - полный справочник API
- [Visual Comparison](./VISUAL_COMPARISON.md) - визуальное сравнение
- [Examples](./EXAMPLES.md) - примеры использования
- [Integration Checklist](./INTEGRATION_CHECKLIST.md) - чек-лист интеграции

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте [чек-лист интеграции](./INTEGRATION_CHECKLIST.md)
2. Запустите [финальную проверку](./scripts/final-check.sh)
3. Изучите [примеры использования](./EXAMPLES.md)
4. Обратитесь к [API справочнику](./API_REFERENCE.md)
