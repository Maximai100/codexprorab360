# Интеграция Construction Calculator Module

> ⚠️ **ВНИМАНИЕ**: Этот файл содержит старую версию документации. 
> 
> **Для интеграции используйте новую документацию:** [`integration/`](./integration/)
> 
> - 📚 [Руководство по интеграции](./integration/INTEGRATION_GUIDE.md)
> - 🔧 [API Справочник](./integration/API_REFERENCE.md)
> - 💡 [Примеры использования](./integration/EXAMPLES.md)
> - ✅ [Чек-лист готовности](./integration/INTEGRATION_CHECKLIST.md)

## 🎯 Описание

Construction Calculator Module - это готовый к интеграции модуль калькулятора строительных материалов для React приложений. Модуль предоставляет полный функционал расчета материалов с возможностью настройки под нужды вашего приложения.

## 📦 Установка

### Вариант 1: Копирование файлов (рекомендуется для одного приложения)

```bash
# Скопировать папку calculator в ваше приложение
cp -r calculator/src/components/* your-app/src/components/calculator/
cp -r calculator/src/hooks/* your-app/src/hooks/calculator/
cp -r calculator/src/utils/* your-app/src/utils/calculator/
cp -r calculator/src/styles/* your-app/src/styles/calculator/
cp calculator/src/types/index.ts your-app/src/types/calculator.ts
```

### Вариант 2: Как npm пакет (если планируете публикацию)

```bash
npm install construction-calculator-module
```

## 🚀 Базовое использование

### Простая интеграция

```typescript
import React, { useState } from 'react';
import { CalculatorModule, CalculatorConfig, RoomData, SavedMaterial } from './components/calculator';
import './styles/calculator/index.css'; // Импорт стилей

const MyApp = () => {
  const [projectData, setProjectData] = useState<{
    rooms: RoomData[];
    materials: SavedMaterial[];
  }>({
    rooms: [],
    materials: []
  });

  const config: CalculatorConfig = {
    theme: 'light',
    enableOfflineMode: true,
    enableAutoSave: true,
    enableExport: true,
    enableMaterialLibrary: true,
    enableImageUpload: true,
    defaultUnits: 'm',
    calculationPrecision: 2,
    defaultMargin: 10,
    onDataChange: (data) => {
      // Синхронизация с вашим приложением
      setProjectData({ rooms: data.rooms, materials: data.materials });
      console.log('Данные калькулятора обновлены:', data);
    },
    onExport: (format, data) => {
      console.log(`Экспорт в ${format}:`, data);
      // Ваша логика обработки экспорта
    },
    onError: (error) => {
      console.error('Ошибка калькулятора:', error);
      // Ваша логика обработки ошибок
    }
  };

  return (
    <div className="my-app">
      <header>
        <h1>Мое строительное приложение</h1>
      </header>
      
      <main>
        {/* Калькулятор как обычный компонент */}
        <CalculatorModule 
          config={config}
          initialRooms={projectData.rooms}
          initialMaterials={projectData.materials}
          className="my-calculator"
          readOnly={false}
          showHeader={true}
          showNavigation={true}
          showExportControls={true}
        />
      </main>
    </div>
  );
};
```

### Интеграция с роутингом

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CalculatorModule } from './components/calculator';

const App = () => {
  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/calculator">Калькулятор</Link>
          <Link to="/projects">Проекты</Link>
          <Link to="/budget">Бюджет</Link>
        </nav>
        
        <Routes>
          <Route path="/calculator" element={<CalculatorModule />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
        </Routes>
      </div>
    </Router>
  );
};
```

## ⚙️ Конфигурация

### CalculatorConfig

```typescript
interface CalculatorConfig {
  // Тема и внешний вид
  theme?: 'light' | 'dark' | 'auto';
  
  // Функциональность
  enableOfflineMode?: boolean;
  enableAutoSave?: boolean;
  enableExport?: boolean;
  enableTelegramIntegration?: boolean;
  enableMaterialLibrary?: boolean;
  enableImageUpload?: boolean;
  
  // Данные
  customMaterials?: SavedMaterial[];
  defaultUnits?: Unit;
  
  // Настройки расчета
  calculationPrecision?: number;
  defaultMargin?: number;
  
  // Колбэки
  onDataChange?: (data: CalculatorData) => void;
  onExport?: (format: string, data: unknown) => void;
  onError?: (error: CalculatorError) => void;
  onRoomAdded?: (room: RoomData) => void;
  onRoomUpdated?: (room: RoomData) => void;
  onRoomDeleted?: (roomId: number) => void;
  onMaterialAdded?: (material: SavedMaterial) => void;
  onMaterialUpdated?: (material: SavedMaterial) => void;
  onMaterialDeleted?: (materialId: number) => void;
}
```

### CalculatorIntegrationProps

```typescript
interface CalculatorIntegrationProps {
  // Данные
  initialRooms?: RoomData[];
  initialMaterials?: SavedMaterial[];
  
  // Конфигурация
  config?: CalculatorConfig;
  
  // Стилизация
  className?: string;
  style?: React.CSSProperties;
  
  // Дополнительные опции
  readOnly?: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
  showExportControls?: boolean;
}
```

## 🔧 Расширенное использование

### Использование главного хука useCalculator

```typescript
import { useCalculator } from './hooks/calculator/useCalculator';

const CalculatorPage = () => {
  const {
    rooms,
    materials,
    totalMetrics,
    totalCost,
    addRoom,
    updateRoom,
    deleteRoom,
    addMaterial,
    exportData,
    clearData
  } = useCalculator({
    theme: 'light',
    enableAutoSave: true,
    onDataChange: (data) => {
      console.log('Данные обновлены:', data);
    }
  });

  return (
    <div>
      <h2>Калькулятор</h2>
      <p>Комнат: {rooms.length}</p>
      <p>Материалов: {materials.length}</p>
      <p>Общая стоимость: {totalCost.toFixed(2)} ₽</p>
      
      <button onClick={() => addRoom({
        id: Date.now(),
        name: 'Новая комната',
        length: '5',
        width: '4',
        height: '2.8',
        unit: 'm',
        openings: [],
        exclusions: [],
        geometricElements: [],
        notes: '',
        images: []
      })}>
        Добавить комнату
      </button>
    </div>
  );
};
```

### Использование PlatformAPI

```typescript
import { usePlatformAPI, PlatformAPIFactory } from './utils/platformAPI';

const MyComponent = () => {
  const platformAPI = usePlatformAPI();

  const handleExport = () => {
    platformAPI.showConfirm('Экспортировать данные?', (confirmed) => {
      if (confirmed) {
        platformAPI.hapticFeedback('success');
        // Логика экспорта
      }
    });
  };

  return (
    <button onClick={handleExport}>
      Экспорт
    </button>
  );
};

// Создание кастомного API
const customAPI = PlatformAPIFactory.create();
```

### Использование системы плагинов

```typescript
import { 
  MaterialCalculatorRegistry, 
  BaseMaterialCalculator,
  MaterialCalculator 
} from './utils/materialCalculators';

// Создание кастомного калькулятора
class CustomMaterialCalculator extends BaseMaterialCalculator {
  name = 'Мой материал';
  category = 'custom' as MaterialCategory;
  description = 'Кастомный калькулятор материала';
  requiredMetrics = ['netWallArea'];
  defaultParams = {
    consumption: '1.5',
    price: '1000'
  };

  calculate(metrics: RoomMetrics, params: Record<string, string>): MaterialResult {
    const consumption = parseFloat(params.consumption) || 0;
    const price = parseFloat(params.price) || 0;
    const area = metrics.netWallArea;
    
    const totalAmount = area * consumption;
    const totalCost = totalAmount * price;

    return {
      quantity: `${totalAmount.toFixed(2)} шт.`,
      cost: totalCost,
      details: {
        "Количество": `${totalAmount.toFixed(2)} шт.`,
        "Стоимость": `${totalCost.toFixed(2)} ₽`
      },
      showNote: true,
      text: `${totalAmount.toFixed(2)} шт. - ${totalCost.toFixed(2)} ₽`
    };
  }

  render(props: MaterialCalculatorProps): React.ReactNode {
    return <div>Кастомный калькулятор</div>;
  }
}

// Регистрация плагина
const registry = new MaterialCalculatorRegistry();
registry.register(new CustomMaterialCalculator());
```

### Использование системы валидации

```typescript
import { 
  useValidation, 
  RoomValidationSchema,
  validateProject 
} from './utils/validation';

const RoomForm = ({ room, onSave }) => {
  const { errors, validate, validateField, clearErrors } = useValidation(RoomValidationSchema);

  const handleSubmit = (formData: RoomData) => {
    if (validate(formData)) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={room.name}
        onChange={(e) => validateField('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name[0]}</span>}
      
      <button type="submit">Сохранить</button>
    </form>
  );
};

// Валидация всего проекта
const projectValidation = validateProject(rooms);
if (!projectValidation.isValid) {
  console.log('Ошибки валидации:', projectValidation.errors);
}
```

### Использование системы событий

```typescript
import { useEventBus, calculatorEventBus } from './utils/eventBus';

const MyComponent = () => {
  const { useEventListener, emitEvent } = useEventBus();

  // Подписка на события
  useEventListener('room:added', (data) => {
    console.log('Добавлена комната:', data.room);
  });

  useEventListener('calculation:completed', (data) => {
    console.log('Расчет завершен:', data.results);
  });

  const handleAddRoom = () => {
    // Эмиссия события
    emitEvent('room:added', { room: newRoom });
  };

  return <button onClick={handleAddRoom}>Добавить комнату</button>;
};

// Глобальная подписка на события
calculatorEventBus.on('export:completed', (data) => {
  console.log('Экспорт завершен:', data);
});
```

### Использование системы конфигурации

```typescript
import { useConfigManager, configManager } from './utils/config';

const SettingsPage = () => {
  const { 
    config, 
    updateConfig, 
    resetConfig, 
    saveConfig, 
    loadConfig 
  } = useConfigManager();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateConfig({ theme });
  };

  const handlePrecisionChange = (precision: number) => {
    updateConfig({ precision });
  };

  return (
    <div>
      <h2>Настройки</h2>
      
      <div>
        <label>Тема:</label>
        <select value={config.theme} onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}>
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
        </select>
      </div>
      
      <div>
        <label>Точность расчетов:</label>
        <input 
          type="number" 
          value={config.precision}
          onChange={(e) => handlePrecisionChange(parseInt(e.target.value))}
          min="0" 
          max="10" 
        />
      </div>
      
      <button onClick={saveConfig}>Сохранить настройки</button>
      <button onClick={resetConfig}>Сбросить</button>
    </div>
  );
};
```

## 📁 Структура файлов для интеграции

```
your-app/
├── src/
│   ├── components/
│   │   ├── calculator/           # Калькулятор
│   │   │   ├── CalculatorModule.tsx
│   │   │   ├── CalculatorView.tsx
│   │   │   ├── RoomEditor.tsx
│   │   │   ├── RoomForm.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── calculators/     # Калькуляторы материалов
│   │   │   ├── modals/          # Модальные окна
│   │   │   └── common/          # Общие компоненты
│   │   └── your-components/     # Ваши компоненты
│   ├── hooks/
│   │   ├── calculator/          # Хуки калькулятора
│   │   │   ├── useCalculator.ts
│   │   │   ├── useTheme.ts
│   │   │   ├── useStorage.ts
│   │   │   └── useCalculations.ts
│   │   └── your-hooks/          # Ваши хуки
│   ├── utils/
│   │   ├── calculator/          # Утилиты калькулятора
│   │   │   ├── calculations.ts
│   │   │   ├── platformAPI.ts
│   │   │   ├── materialCalculators.ts
│   │   │   ├── validation.ts
│   │   │   ├── eventBus.ts
│   │   │   └── config.ts
│   │   └── your-utils/          # Ваши утилиты
│   ├── types/
│   │   ├── calculator.ts        # Типы калькулятора
│   │   └── your-types.ts        # Ваши типы
│   └── styles/
│       ├── calculator/          # Стили калькулятора
│       │   ├── calculator.css
│       │   ├── components.css
│       │   ├── themes.css
│       │   ├── responsive.css
│       │   └── index.css
│       └── your-styles.css      # Ваши стили
```

## 🎨 Стилизация

### Импорт стилей

```css
/* В вашем main.css */
@import './styles/calculator/index.css';

/* Кастомизация */
.my-calculator {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.my-calculator .calc-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### CSS переменные для темизации

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
  --bg-color: #fff;
  --border-color: #e0e0e0;
}

.dark-theme {
  --primary-color: #7c3aed;
  --secondary-color: #a855f7;
  --text-color: #f8fafc;
  --bg-color: #1e293b;
  --border-color: #475569;
}
```

### Программная темизация

```typescript
import { useConfig } from './utils/config';

const ThemeToggle = () => {
  const [theme, setTheme] = useConfig('theme');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

## 🔍 Отладка

### Логирование данных

```typescript
const config: CalculatorConfig = {
  onDataChange: (data) => {
    console.log('Rooms:', data.rooms);
    console.log('Materials:', data.materials);
    console.log('Total Metrics:', data.totalMetrics);
    console.log('Total Cost:', data.totalCost);
    
    // Валидация данных
    const isValid = data.rooms.every(room => 
      room.length && room.width && room.height
    );
    
    if (!isValid) {
      console.warn('Некоторые комнаты имеют неполные данные');
    }
  }
};
```

### Проверка типов

```typescript
import { RoomData, SavedMaterial, CalculatorData } from './types/calculator';

const validateCalculatorData = (data: unknown): data is CalculatorData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'rooms' in data &&
    'materials' in data &&
    Array.isArray((data as CalculatorData).rooms) &&
    Array.isArray((data as CalculatorData).materials)
  );
};
```

### Использование EventBus для отладки

```typescript
import { calculatorEventBus } from './utils/eventBus';

// Подписка на все события для отладки
calculatorEventBus.on('room:added', (data) => console.log('Room added:', data));
calculatorEventBus.on('material:added', (data) => console.log('Material added:', data));
calculatorEventBus.on('calculation:completed', (data) => console.log('Calculation completed:', data));
calculatorEventBus.on('error:occurred', (data) => console.error('Error occurred:', data));
```

## 🚀 Производительность

### Ленивая загрузка

```typescript
import { lazy, Suspense } from 'react';

const CalculatorModule = lazy(() => import('./components/calculator/CalculatorModule'));

const App = () => (
  <Suspense fallback={<div>Загрузка калькулятора...</div>}>
    <CalculatorModule />
  </Suspense>
);
```

### Мемоизация

```typescript
import { useMemo } from 'react';

const CalculatorPage = () => {
  const config = useMemo(() => ({
    theme: 'light' as const,
    enableOfflineMode: true,
    onDataChange: (data: CalculatorData) => {
      // Обработка данных
    }
  }), []);

  return <CalculatorModule config={config} />;
};
```

### Оптимизация с помощью useCallback

```typescript
const MyComponent = () => {
  const handleDataChange = useCallback((data: CalculatorData) => {
    // Обработка данных
  }, []);

  const handleExport = useCallback((format: string, data: unknown) => {
    // Обработка экспорта
  }, []);

  return (
    <CalculatorModule 
      config={{
        onDataChange: handleDataChange,
        onExport: handleExport
      }}
    />
  );
};
```

## 📱 Адаптивность

Калькулятор автоматически адаптируется под размер экрана. Для мобильных устройств рекомендуется:

```css
@media (max-width: 768px) {
  .calculator-module {
    padding: 8px;
  }
  
  .calc-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .rooms-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🔒 Безопасность

### Валидация данных

```typescript
import { validateProject, validateRoom } from './utils/validation';

const sanitizeCalculatorData = (data: unknown) => {
  if (!validateProject(data.rooms).isValid) {
    throw new Error('Invalid room data');
  }
  
  return {
    rooms: data.rooms.map((room: RoomData) => ({
      ...room,
      name: room.name?.slice(0, 100) || 'Комната',
      length: parseFloat(room.length) || 0,
      width: parseFloat(room.width) || 0,
      height: parseFloat(room.height) || 0
    })),
    materials: data.materials.filter((material: SavedMaterial) => 
      material.name && material.category
    )
  };
};
```

### Обработка ошибок

```typescript
const config: CalculatorConfig = {
  onError: (error) => {
    console.error('Calculator Error:', error);
    
    // Отправка в систему мониторинга
    if (window.gtag) {
      window.gtag('event', 'calculator_error', {
        error_code: error.code,
        error_message: error.message
      });
    }
  }
};
```

## 🆘 Решение проблем

### Частые ошибки

1. **Ошибка импорта**: Убедитесь, что все пути к файлам корректны
2. **Стили не применяются**: Проверьте импорт CSS файлов
3. **Типы не работают**: Убедитесь, что TypeScript настроен правильно
4. **События не работают**: Проверьте инициализацию EventBus
5. **Конфигурация не сохраняется**: Проверьте доступность localStorage

### Поддержка

При возникновении проблем проверьте:
- Версию React (должна быть >= 18.0.0)
- Настройки TypeScript
- Корректность импортов
- Консоль браузера на наличие ошибок
- Инициализацию всех систем (EventBus, ConfigManager)

### Отладка производительности

```typescript
import { useEventBus } from './utils/eventBus';

const PerformanceMonitor = () => {
  const { useEventListener } = useEventBus();
  
  useEventListener('calculation:started', () => {
    console.time('calculation');
  });
  
  useEventListener('calculation:completed', () => {
    console.timeEnd('calculation');
  });
  
  return null;
};
```

## 📄 Лицензия

MIT License - используйте свободно в коммерческих и некоммерческих проектах.

## 🔄 Обновления

### Версия 2.0.0
- ✅ Модульная архитектура компонентов
- ✅ Расширенный API интеграции
- ✅ Отдельные CSS файлы
- ✅ Главный хук useCalculator
- ✅ Абстракция PlatformAPI
- ✅ Система плагинов для материалов
- ✅ Строгая типизация (без any)
- ✅ Централизованная валидация
- ✅ Система событий EventBus
- ✅ Централизованная конфигурация

### Миграция с версии 1.x

```typescript
// Старый способ
<CalculatorModule 
  config={{
    onDataChange: (rooms, materials) => { /* ... */ }
  }}
/>

// Новый способ
<CalculatorModule 
  config={{
    onDataChange: (data) => { 
      const { rooms, materials } = data;
      /* ... */ 
    }
  }}
/>
```