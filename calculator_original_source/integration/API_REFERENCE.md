# API Справочник калькулятора

## 📚 Основные компоненты

### CalculatorModule

Главный компонент калькулятора для интеграции.

```typescript
import { CalculatorModule } from './path/to/calculator';

<CalculatorModule 
  config={config}
  initialRooms={rooms}
  initialMaterials={materials}
  className="my-calculator"
/>
```

**Props:**
- `config?: CalculatorConfig` - конфигурация калькулятора
- `initialRooms?: RoomData[]` - начальные комнаты
- `initialMaterials?: SavedMaterial[]` - начальные материалы
- `className?: string` - CSS класс
- `style?: React.CSSProperties` - инлайн стили
- `readOnly?: boolean` - режим только для чтения
- `showHeader?: boolean` - показывать заголовок
- `showNavigation?: boolean` - показывать навигацию
- `showExportControls?: boolean` - показывать элементы экспорта

### CalculatorView

Основной вид калькулятора.

```typescript
import { CalculatorView } from './path/to/calculator';

<CalculatorView 
  rooms={rooms}
  setRooms={setRooms}
  materials={materials}
  // ... другие props
/>
```

## 🔧 Хуки

### useCalculator

Основной хук для работы с калькулятором.

```typescript
import { useCalculator } from './path/to/calculator';

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

### useTheme

Хук для работы с темами.

```typescript
import { useTheme } from './path/to/calculator';

const { theme, toggleTheme, setTheme } = useTheme();
```

### useStorage

Хуки для работы с локальным хранилищем.

```typescript
import { 
  useSavedEstimates, 
  useSavedMaterials, 
  useAutoSave 
} from './path/to/calculator';

// Сметы
const { savedEstimates, saveEstimate, loadEstimate, deleteEstimate } = useSavedEstimates();

// Материалы
const { savedMaterials, saveMaterial, deleteMaterial } = useSavedMaterials();

// Автосохранение
const { loadAutoSave, clearAutoSave } = useAutoSave(rooms);
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

### CalculatorConfig

```typescript
interface CalculatorConfig {
  theme?: 'light' | 'dark';
  enableOfflineMode?: boolean;
  enableAutoSave?: boolean;
  enableExport?: boolean;
  enableTelegramIntegration?: boolean;
  customMaterials?: SavedMaterial[];
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

## 🛠️ Утилиты

### Расчеты

```typescript
import { 
  calculateRoomMetrics,
  calculateTotalMetrics,
  convertToMeters,
  validateRoomDimensions
} from './path/to/calculator';

// Расчет метрик комнаты
const metrics = calculateRoomMetrics(room);

// Расчет общих метрик
const totalMetrics = calculateTotalMetrics(rooms);

// Конвертация в метры
const meters = convertToMeters(value, unit);

// Валидация размеров
const isValid = validateRoomDimensions(length, width, height);
```

### Валидация

```typescript
import { 
  validateRoom,
  validateOpening,
  validateExclusion,
  validateGeometricElement,
  validateSavedMaterial
} from './path/to/calculator';

// Валидация комнаты
const roomValidation = validateRoom(room);

// Валидация проема
const openingValidation = validateOpening(opening);

// Валидация исключения
const exclusionValidation = validateExclusion(exclusion);

// Валидация геометрического элемента
const geometricValidation = validateGeometricElement(element);

// Валидация материала
const materialValidation = validateSavedMaterial(material);
```

### Экспорт

```typescript
import { 
  exportToPDF,
  exportToExcel,
  exportToJSON
} from './path/to/calculator';

// Экспорт в PDF
exportToPDF(data, filename);

// Экспорт в Excel
exportToExcel(data, filename);

// Экспорт в JSON
exportToJSON(data, filename);
```

### Платформенный API

```typescript
import { 
  PlatformAPI,
  TelegramPlatformAPI,
  WebPlatformAPI,
  ReactNativePlatformAPI,
  PlatformAPIFactory,
  platformAPI,
  usePlatformAPI
} from './path/to/calculator';

// Использование платформенного API
const api = usePlatformAPI();

// Отправка сообщения
await api.sendMessage('Текст сообщения');

// Поделиться файлом
await api.shareFile(fileData, filename);
```

## 🎨 Стили

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

## 🔄 События

### Обработка событий

```typescript
const config: CalculatorConfig = {
  onDataChange: (rooms, materials) => {
    console.log('Данные изменились:', { rooms, materials });
  },
  
  onExport: (format, data) => {
    console.log('Экспорт:', format, data);
  },
  
  onError: (error) => {
    console.error('Ошибка калькулятора:', error);
  },
  
  onRoomAdded: (room) => {
    console.log('Комната добавлена:', room);
  },
  
  onMaterialAdded: (material) => {
    console.log('Материал добавлен:', material);
  }
};
```

## 🧪 Тестирование

### Тестовые данные

```typescript
const testRoom: RoomData = {
  id: 1,
  name: 'Гостиная',
  length: 5,
  width: 4,
  height: 2.7,
  unit: 'm',
  openings: [],
  exclusions: [],
  geometricElements: [],
  notes: 'Тестовая комната'
};

const testMaterial: SavedMaterial = {
  id: 1,
  name: 'Краска белая',
  category: 'paint',
  price: 500,
  unit: 'л',
  coverage: 10,
  notes: 'Тестовый материал',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### Моки для тестирования

```typescript
const mockConfig: CalculatorConfig = {
  theme: 'light',
  enableOfflineMode: true,
  enableAutoSave: true,
  enableExport: true,
  onDataChange: jest.fn(),
  onExport: jest.fn(),
  onError: jest.fn()
};
```

## 🚨 Обработка ошибок

### CalculatorError

```typescript
interface CalculatorError {
  message: string;
  code: string;
  details?: any;
}

// Создание ошибки
const error = new CalculatorError('Не удалось сохранить данные', 'SAVE_ERROR');

// Обработка ошибки
try {
  await saveData(data);
} catch (error) {
  if (error instanceof CalculatorError) {
    console.error('Ошибка калькулятора:', error.message);
  }
}
```

### Типы ошибок

- `VALIDATION_ERROR` - ошибка валидации
- `SAVE_ERROR` - ошибка сохранения
- `LOAD_ERROR` - ошибка загрузки
- `EXPORT_ERROR` - ошибка экспорта
- `CALCULATION_ERROR` - ошибка расчета
- `NETWORK_ERROR` - сетевая ошибка

## 📱 Интеграция с внешними системами

### Сохранение в API

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

### Загрузка из API

```typescript
const [initialData, setInitialData] = useState(null);

useEffect(() => {
  fetch('/api/calculator/load')
    .then(res => res.json())
    .then(data => setInitialData(data))
    .catch(error => console.error('Ошибка загрузки:', error));
}, []);

return (
  <CalculatorModule 
    initialRooms={initialData?.rooms}
    initialMaterials={initialData?.materials}
    config={config}
  />
);
```

## 🔧 Расширение функциональности

### Кастомные калькуляторы материалов

```typescript
import { BaseMaterialCalculator } from './path/to/calculator';

class CustomCalculator extends BaseMaterialCalculator {
  calculate(room: RoomData, material: SavedMaterial): MaterialResult {
    // Кастомная логика расчета
    return {
      material,
      quantity: customCalculation(room, material),
      cost: material.price * quantity,
      unit: material.unit
    };
  }
}
```

### Кастомные валидаторы

```typescript
import { ValidationRule } from './path/to/calculator';

const customValidationRule: ValidationRule = {
  name: 'customRule',
  validate: (value: any) => {
    // Кастомная логика валидации
    return { isValid: true, message: '' };
  }
};
```
