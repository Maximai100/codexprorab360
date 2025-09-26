# Примеры использования калькулятора

## 🚀 Базовые примеры

### Простое использование

```tsx
import React from 'react';
import { CalculatorModule } from './path/to/calculator';

function App() {
  return (
    <div className="app">
      <h1>Мой калькулятор</h1>
      <CalculatorModule />
    </div>
  );
}

export default App;
```

### С конфигурацией

```tsx
import React from 'react';
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';

function App() {
  const config: CalculatorConfig = {
    theme: 'light',
    enableOfflineMode: true,
    enableAutoSave: true,
    enableExport: true
  };

  return (
    <div className="app">
      <CalculatorModule config={config} />
    </div>
  );
}

export default App;
```

### С начальными данными

```tsx
import React from 'react';
import { CalculatorModule, RoomData, SavedMaterial } from './path/to/calculator';

function App() {
  const initialRooms: RoomData[] = [
    {
      id: 1,
      name: 'Гостиная',
      length: 5,
      width: 4,
      height: 2.7,
      unit: 'm',
      openings: [],
      exclusions: [],
      geometricElements: []
    }
  ];

  const initialMaterials: SavedMaterial[] = [
    {
      id: 1,
      name: 'Краска белая',
      category: 'paint',
      price: 500,
      unit: 'л',
      coverage: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return (
    <div className="app">
      <CalculatorModule 
        initialRooms={initialRooms}
        initialMaterials={initialMaterials}
      />
    </div>
  );
}

export default App;
```

## 🔧 Продвинутые примеры

### Интеграция с внешним API

```tsx
import React, { useState, useEffect } from 'react';
import { CalculatorModule, CalculatorConfig, RoomData, SavedMaterial } from './path/to/calculator';

function App() {
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const config: CalculatorConfig = {
    theme: 'light',
    enableAutoSave: true,
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
    },
    onExport: async (format, data) => {
      try {
        const response = await fetch('/api/calculator/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, data })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `calculator.${format}`;
          a.click();
        }
      } catch (error) {
        console.error('Ошибка экспорта:', error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/calculator/load');
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="app">
      <CalculatorModule 
        config={config}
        initialRooms={initialData?.rooms}
        initialMaterials={initialData?.materials}
      />
    </div>
  );
}

export default App;
```

### Кастомные стили

```tsx
import React from 'react';
import { CalculatorModule } from './path/to/calculator';
import './custom-styles.css';

function App() {
  return (
    <div className="app">
      <CalculatorModule 
        className="my-custom-calculator"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}
      />
    </div>
  );
}

export default App;
```

```css
/* custom-styles.css */
.my-custom-calculator {
  --calc-primary-color: #ff6b6b;
  --calc-primary-hover: #ff5252;
  --calc-primary-active: #e53935;
  --calc-bg-primary: #f8f9fa;
  --calc-border-radius: 12px;
}

.my-custom-calculator .calc-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.my-custom-calculator .calc-room-card {
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.my-custom-calculator .calc-room-card:hover {
  border-color: #ff6b6b;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
}
```

### Использование хуков

```tsx
import React, { useState, useEffect } from 'react';
import { useCalculator, CalculatorConfig } from './path/to/calculator';

function CustomCalculator() {
  const [config] = useState<CalculatorConfig>({
    theme: 'light',
    enableAutoSave: true,
    onDataChange: (rooms, materials) => {
      console.log('Данные изменились:', { rooms, materials });
    }
  });

  const {
    rooms,
    materials,
    totalMetrics,
    totalCost,
    addRoom,
    addMaterial,
    exportData
  } = useCalculator(config);

  const handleAddRoom = () => {
    const newRoom = {
      id: Date.now(),
      name: 'Новая комната',
      length: 4,
      width: 3,
      height: 2.7,
      unit: 'm' as const,
      openings: [],
      exclusions: [],
      geometricElements: []
    };
    addRoom(newRoom);
  };

  const handleExport = () => {
    exportData('pdf');
  };

  return (
    <div className="custom-calculator">
      <div className="controls">
        <button onClick={handleAddRoom}>Добавить комнату</button>
        <button onClick={handleExport}>Экспорт PDF</button>
      </div>
      
      <div className="summary">
        <h3>Сводка</h3>
        <p>Комнат: {rooms.length}</p>
        <p>Материалов: {materials.length}</p>
        <p>Общая площадь: {totalMetrics.totalArea} м²</p>
        <p>Общая стоимость: {totalCost} ₽</p>
      </div>
    </div>
  );
}

export default CustomCalculator;
```

## 🎨 Темы и стилизация

### Переключение тем

```tsx
import React, { useState } from 'react';
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const config: CalculatorConfig = {
    theme,
    enableAutoSave: true
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app">
      <div className="theme-controls">
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Темная тема' : '☀️ Светлая тема'}
        </button>
      </div>
      
      <CalculatorModule config={config} />
    </div>
  );
}

export default App;
```

### Кастомная цветовая схема

```css
/* custom-theme.css */
.calculator-module[data-theme="custom"] {
  --calc-primary-color: #9c27b0;
  --calc-primary-hover: #8e24aa;
  --calc-primary-active: #7b1fa2;
  --calc-bg-primary: #f3e5f5;
  --calc-bg-secondary: #e1bee7;
  --calc-text-primary: #4a148c;
  --calc-text-secondary: #6a1b9a;
  --calc-border-light: #ce93d8;
  --calc-border-medium: #ba68c8;
  --calc-border-dark: #ab47bc;
}
```

## 📱 Адаптивность

### Мобильная версия

```tsx
import React, { useState, useEffect } from 'react';
import { CalculatorModule } from './path/to/calculator';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`app ${isMobile ? 'mobile' : 'desktop'}`}>
      <CalculatorModule 
        className={isMobile ? 'mobile-calculator' : 'desktop-calculator'}
      />
    </div>
  );
}

export default App;
```

```css
/* responsive.css */
.mobile-calculator {
  --room-card-width: 100%;
  --input-height: 44px;
  --button-height: 44px;
  --modal-width: 95vw;
  --container-padding: 16px;
}

.desktop-calculator {
  --room-card-width: 300px;
  --input-height: 40px;
  --button-height: 40px;
  --modal-width: 500px;
  --container-padding: 20px;
}

@media (max-width: 768px) {
  .app {
    padding: 10px;
  }
  
  .calculator-module {
    font-size: 16px; /* Предотвращает зум на iOS */
  }
}
```

## 🔄 Интеграция с состоянием приложения

### Redux интеграция

```tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';

function CalculatorContainer() {
  const dispatch = useDispatch();
  const { rooms, materials, theme } = useSelector(state => state.calculator);

  const config: CalculatorConfig = {
    theme,
    initialRooms: rooms,
    initialMaterials: materials,
    onDataChange: (newRooms, newMaterials) => {
      dispatch(updateCalculatorData({ rooms: newRooms, materials: newMaterials }));
    },
    onExport: (format, data) => {
      dispatch(exportCalculatorData({ format, data }));
    }
  };

  return <CalculatorModule config={config} />;
}

export default CalculatorContainer;
```

### Context API интеграция

```tsx
import React, { createContext, useContext, useState } from 'react';
import { CalculatorModule, CalculatorConfig, RoomData, SavedMaterial } from './path/to/calculator';

interface CalculatorContextType {
  rooms: RoomData[];
  materials: SavedMaterial[];
  theme: 'light' | 'dark';
  updateRooms: (rooms: RoomData[]) => void;
  updateMaterials: (materials: SavedMaterial[]) => void;
  toggleTheme: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export const useCalculatorContext = () => {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculatorContext must be used within CalculatorProvider');
  }
  return context;
};

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const config: CalculatorConfig = {
    theme,
    onDataChange: (newRooms, newMaterials) => {
      setRooms(newRooms);
      setMaterials(newMaterials);
    }
  };

  const value: CalculatorContextType = {
    rooms,
    materials,
    theme,
    updateRooms: setRooms,
    updateMaterials: setMaterials,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
      <CalculatorModule config={config} />
    </CalculatorContext.Provider>
  );
};
```

## 🧪 Тестирование

### Unit тесты

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculatorModule } from './path/to/calculator';

describe('CalculatorModule', () => {
  it('renders calculator correctly', () => {
    render(<CalculatorModule />);
    
    expect(screen.getByText('Калькулятор строительных материалов')).toBeInTheDocument();
  });

  it('handles theme toggle', () => {
    const config = {
      theme: 'light' as const,
      onDataChange: jest.fn()
    };

    render(<CalculatorModule config={config} />);
    
    const themeButton = screen.getByRole('button', { name: /тема/i });
    fireEvent.click(themeButton);
    
    // Проверяем, что тема изменилась
    expect(screen.getByRole('button', { name: /светлая тема/i })).toBeInTheDocument();
  });
});
```

### Integration тесты

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalculatorModule } from './path/to/calculator';

describe('Calculator Integration', () => {
  it('adds room and calculates metrics', async () => {
    const onDataChange = jest.fn();
    const config = { onDataChange };

    render(<CalculatorModule config={config} />);
    
    // Добавляем комнату
    const addRoomButton = screen.getByText('Добавить комнату');
    fireEvent.click(addRoomButton);
    
    // Заполняем форму
    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Гостиная' } });
    fireEvent.change(screen.getByLabelText('Длина'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Ширина'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Высота'), { target: { value: '2.7' } });
    
    // Сохраняем
    fireEvent.click(screen.getByText('Сохранить'));
    
    await waitFor(() => {
      expect(onDataChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Гостиная',
            length: 5,
            width: 4,
            height: 2.7
          })
        ]),
        expect.any(Array)
      );
    });
  });
});
```

## 🚀 Производительность

### Оптимизация с React.memo

```tsx
import React, { memo } from 'react';
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';

const OptimizedCalculator = memo<{ config: CalculatorConfig }>(({ config }) => {
  return <CalculatorModule config={config} />;
});

OptimizedCalculator.displayName = 'OptimizedCalculator';

export default OptimizedCalculator;
```

### Ленивая загрузка

```tsx
import React, { lazy, Suspense } from 'react';

const CalculatorModule = lazy(() => import('./path/to/calculator'));

function App() {
  return (
    <div className="app">
      <Suspense fallback={<div>Загрузка калькулятора...</div>}>
        <CalculatorModule />
      </Suspense>
    </div>
  );
}

export default App;
```

## 🔧 Отладка

### Логирование

```tsx
import React from 'react';
import { CalculatorModule, CalculatorConfig } from './path/to/calculator';

function App() {
  const config: CalculatorConfig = {
    onDataChange: (rooms, materials) => {
      console.log('Calculator data changed:', { rooms, materials });
    },
    onExport: (format, data) => {
      console.log('Export requested:', { format, data });
    },
    onError: (error) => {
      console.error('Calculator error:', error);
    }
  };

  return <CalculatorModule config={config} />;
}

export default App;
```

### DevTools

```tsx
import React from 'react';
import { CalculatorModule } from './path/to/calculator';

function App() {
  return (
    <div className="app">
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-tools">
          <button onClick={() => console.log('Dev tools')}>
            Открыть DevTools
          </button>
        </div>
      )}
      <CalculatorModule />
    </div>
  );
}

export default App;
```
