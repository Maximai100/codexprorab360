import React, { useState, useCallback } from 'react';
import { RoomData, SavedMaterial, MaterialResult, TotalCalculations } from '../../types/calculator';
import { RoomEditor } from './RoomEditor';
import { ResultsPage } from './ResultsPage';
import { Icon, IconSun, IconMoon, IconSave, IconFolderOpen, IconLibrary } from './common';

interface CalculatorViewProps {
  rooms: RoomData[];
  setRooms: (rooms: RoomData[]) => void;
  handleInputFocus: (e: React.FocusEvent<HTMLElement>) => void;
  handleThemeChange: () => void;
  themeIcon: () => string;
  onSaveEstimate: () => void;
  onLoadEstimate: () => void;
  onOpenLibrary: () => void;
  materials: SavedMaterial[];
  materialResults?: Record<string, MaterialResult | null>;
  totalMetrics?: TotalCalculations;
  totalCost?: number;
  onExport?: (format: string) => void;
  readOnly?: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
  showExportControls?: boolean;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  rooms,
  setRooms,
  handleInputFocus,
  handleThemeChange,
  themeIcon,
  onSaveEstimate,
  onLoadEstimate,
  onOpenLibrary,
  materials,
  materialResults = {},
  totalMetrics,
  totalCost = 0,
  onExport,
  readOnly = false,
  showHeader = true,
  showNavigation = true,
  showExportControls = true
}) => {
  const [currentView, setCurrentView] = useState<'rooms' | 'results'>('rooms');

  const handleViewChange = useCallback((view: 'rooms' | 'results') => {
    setCurrentView(view);
  }, []);

  return (
    <div className="calculator-view">
      {/* Заголовок */}
      {showHeader && (
        <header className="calc-header">
          <div className="calc-title">
            <h1>Строительный калькулятор</h1>
            <p>Расчет материалов для ремонта</p>
          </div>
          
          <div className="calc-controls">
            <button 
              className="theme-toggle"
              onClick={handleThemeChange}
              title="Переключить тему"
            >
              {themeIcon() === '🌙' ? <IconMoon /> : <IconSun />}
            </button>
            
            <button 
              className="btn-secondary"
              onClick={onOpenLibrary}
              title="Библиотека материалов"
            >
              <IconLibrary />
              Материалы
            </button>
            
            <button 
              className="btn-secondary"
              onClick={onLoadEstimate}
              title="Загрузить смету"
            >
              <IconFolderOpen />
              Загрузить
            </button>
            
            <button 
              className="btn-primary"
              onClick={onSaveEstimate}
              title="Сохранить смету"
            >
              <IconSave />
              Сохранить
            </button>
          </div>
        </header>
      )}

      {/* Навигация */}
      {showNavigation && (
        <nav className="calc-nav">
          <button 
            className={`nav-btn ${currentView === 'rooms' ? 'active' : ''}`}
            onClick={() => handleViewChange('rooms')}
          >
            Комнаты ({rooms.length})
          </button>
          <button 
            className={`nav-btn ${currentView === 'results' ? 'active' : ''}`}
            onClick={() => handleViewChange('results')}
          >
            Результаты
          </button>
        </nav>
      )}

      {/* Основной контент */}
      <main className="calc-main">
        {currentView === 'rooms' ? (
          <RoomEditor 
            rooms={rooms}
            setRooms={setRooms}
            onInputFocus={handleInputFocus}
            readOnly={readOnly}
          />
        ) : (
          <ResultsPage 
            rooms={rooms}
            materials={materials}
            materialResults={materialResults}
            totalMetrics={totalMetrics}
            totalCost={totalCost}
            onExport={onExport}
            showExportControls={showExportControls}
          />
        )}
      </main>
    </div>
  );
};

export { CalculatorView };
