import React, { useMemo, useCallback } from 'react';
import { RoomData, SavedMaterial, MaterialResult, TotalCalculations } from '../types';
import { calculateTotalMetrics } from '../utils/calculations';
import { 
  PlasterCalculator, 
  PuttyCalculator, 
  PaintCalculator, 
  WallpaperCalculator,
  DrywallCalculator,
  TileCalculator,
  LaminateCalculator
} from './calculators';
import { Icon, IconPdf, IconShare } from './common';

interface ResultsPageProps {
  rooms: RoomData[];
  materials: SavedMaterial[];
  materialResults?: Record<string, MaterialResult | null>;
  totalMetrics?: TotalCalculations;
  totalCost?: number;
  onExport?: (format: string) => void;
  showExportControls?: boolean;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  rooms,
  materials,
  materialResults = {},
  totalMetrics,
  totalCost = 0,
  onExport,
  showExportControls = true
}) => {
  const [localMaterialResults, setLocalMaterialResults] = React.useState<Record<string, MaterialResult | null>>(materialResults);

  const calculatedTotalMetrics = useMemo(() => {
    return totalMetrics || calculateTotalMetrics(rooms);
  }, [totalMetrics, rooms]);

  const handleResultChange = useCallback((name: string, result: MaterialResult | null) => {
    setLocalMaterialResults(prev => ({
      ...prev,
      [name]: result
    }));
  }, []);

  const calculatedTotalCost = useMemo(() => {
    if (totalCost > 0) return totalCost;
    return Object.values(localMaterialResults).reduce((sum, result) => {
      return sum + (result?.cost || 0);
    }, 0);
  }, [totalCost, localMaterialResults]);

  const handleExport = useCallback((format: string) => {
    if (onExport) {
      onExport(format);
    } else {
      const exportData = {
        rooms,
        materials,
        results: localMaterialResults,
        totalMetrics: calculatedTotalMetrics,
        totalCost: calculatedTotalCost,
        timestamp: new Date().toISOString()
      };
      console.log(`Экспорт в ${format}:`, exportData);
    }
  }, [onExport, rooms, materials, localMaterialResults, calculatedTotalMetrics, calculatedTotalCost]);

  if (rooms.length === 0) {
    return (
      <div className="results-empty">
        <div className="empty-state">
          <h2>Нет данных для расчета</h2>
          <p>Добавьте комнаты для просмотра результатов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      {/* Заголовок с экспортом */}
      <div className="results-header">
        <h2>Результаты расчета</h2>
        {showExportControls && (
          <div className="export-controls">
            <button 
              className="btn-secondary"
              onClick={() => handleExport('pdf')}
              title="Экспорт в PDF"
            >
              <IconPdf />
              PDF
            </button>
            <button 
              className="btn-secondary"
              onClick={() => handleExport('excel')}
              title="Экспорт в Excel"
            >
              📊 Excel
            </button>
            <button 
              className="btn-secondary"
              onClick={() => handleExport('telegram')}
              title="Отправить в Telegram"
            >
              <IconShare />
              Telegram
            </button>
          </div>
        )}
      </div>

      {/* Общие метрики */}
      <div className="metrics-summary">
        <h3>Общие показатели</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{calculatedTotalMetrics.totalFloorArea.toFixed(2)}</div>
            <div className="metric-label">м²</div>
            <div className="metric-description">Общая площадь пола</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{calculatedTotalMetrics.totalNetWallArea.toFixed(2)}</div>
            <div className="metric-label">м²</div>
            <div className="metric-description">Площадь стен</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{calculatedTotalMetrics.totalPerimeter.toFixed(2)}</div>
            <div className="metric-label">м</div>
            <div className="metric-description">Периметр</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value">{calculatedTotalMetrics.avgHeight.toFixed(2)}</div>
            <div className="metric-label">м</div>
            <div className="metric-description">Средняя высота</div>
          </div>
        </div>
      </div>

      {/* Калькуляторы материалов */}
      <div className="material-calculators">
        <h3>Расчет материалов</h3>
        
        <div className="calculators-grid">
          <PlasterCalculator
            name="Черновая штукатурка (Стены)"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <PlasterCalculator
            name="Черновая штукатурка (Потолок)"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalFloorArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <PuttyCalculator
            name="Финишная шпаклевка (Стены)"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <PuttyCalculator
            name="Финишная шпаклевка (Потолок)"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalFloorArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <DrywallCalculator
            name="Гипсокартон (Каркас)"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <PaintCalculator
            name="Краска / Грунтовка"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <WallpaperCalculator
            name="Обои"
            materials={materials}
            onResultChange={handleResultChange}
            perimeter={calculatedTotalMetrics.totalPerimeter}
            height={calculatedTotalMetrics.avgHeight}
          />
          
          <TileCalculator
            name="Плитка"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
          
          <LaminateCalculator
            name="Ламинат / Напольные покрытия"
            materials={materials}
            onResultChange={handleResultChange}
            wallArea={calculatedTotalMetrics.totalNetWallArea}
            floorArea={calculatedTotalMetrics.totalFloorArea}
          />
        </div>
      </div>

      {/* Итоговая стоимость */}
      {calculatedTotalCost > 0 && (
        <div className="total-cost">
          <h3>Итоговая стоимость</h3>
          <div className="cost-summary">
            <div className="cost-value">{calculatedTotalCost.toFixed(2)} ₽</div>
            <div className="cost-description">Общая стоимость материалов</div>
          </div>
        </div>
      )}
    </div>
  );
};