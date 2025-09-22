// Утилита для преобразования данных калькулятора в смету

import { RoomData, MaterialResult, TotalCalculations, SavedMaterial } from '../types';
import { Item, ItemType } from '../../../types';

export interface CalculatorToEstimateData {
  rooms: RoomData[];
  materials: SavedMaterial[];
  materialResults: Record<string, MaterialResult | null>;
  totalMetrics?: TotalCalculations;
  totalCost?: number;
}

export interface EstimateCreationOptions {
  projectId?: string | null;
  clientInfo?: string;
  estimateName?: string;
  includeRoomDetails?: boolean;
  includeMaterialDetails?: boolean;
}

/**
 * Преобразует данные калькулятора в элементы сметы
 */
export const convertCalculatorToEstimate = (
  data: CalculatorToEstimateData,
  options: EstimateCreationOptions = {}
): Item[] => {
  const items: Item[] = [];
  
  // Добавляем общую информацию о проекте
  if (data.totalMetrics) {
    items.push({
      id: `calc-total-${Date.now()}`,
      name: 'Общая площадь помещений',
      quantity: Math.round(data.totalMetrics.totalFloorArea * 100) / 100,
      price: 0,
      unit: 'м²',
      image: null,
      type: 'work'
    });

    items.push({
      id: `calc-perimeter-${Date.now()}`,
      name: 'Общий периметр помещений',
      quantity: Math.round(data.totalMetrics.totalPerimeter * 100) / 100,
      price: 0,
      unit: 'м',
      image: null,
      type: 'work'
    });

    items.push({
      id: `calc-wall-area-${Date.now()}`,
      name: 'Общая площадь стен',
      quantity: Math.round(data.totalMetrics.totalNetWallArea * 100) / 100,
      price: 0,
      unit: 'м²',
      image: null,
      type: 'work'
    });
  }

  // Добавляем детали по комнатам, если включено
  if (options.includeRoomDetails) {
    data.rooms.forEach((room, index) => {
      const roomName = room.name || `Комната ${index + 1}`;
      
      items.push({
        id: `calc-room-${room.id}`,
        name: `${roomName} - Площадь`,
        quantity: Math.round(parseFloat(room.length) * parseFloat(room.width) * 100) / 100,
        price: 0,
        unit: 'м²',
        image: null,
        type: 'work'
      });

      if (room.openings.length > 0) {
        items.push({
          id: `calc-room-openings-${room.id}`,
          name: `${roomName} - Проемы`,
          quantity: room.openings.length,
          price: 0,
          unit: 'шт',
          image: null,
          type: 'work'
        });
      }
    });
  }

  // Добавляем материалы с результатами расчетов
  if (options.includeMaterialDetails) {
    data.materials.forEach((material) => {
      const result = data.materialResults[material.name];
      if (result) {
        items.push({
          id: `calc-material-${material.id}`,
          name: material.name,
          quantity: parseFloat(result.quantity) || 0,
          price: result.cost / (parseFloat(result.quantity) || 1),
          unit: getMaterialUnit(material.category),
          image: null,
          type: 'material'
        });
      }
    });
  }

  // Добавляем общую стоимость, если доступна
  if (data.totalCost && data.totalCost > 0) {
    items.push({
      id: `calc-total-cost-${Date.now()}`,
      name: 'Общая стоимость материалов',
      quantity: 1,
      price: data.totalCost,
      unit: 'руб',
      image: null,
      type: 'work'
    });
  }

  return items;
};

/**
 * Получает единицу измерения для категории материала
 */
const getMaterialUnit = (category: string): string => {
  const unitMap: Record<string, string> = {
    'plaster': 'кг',
    'putty': 'кг',
    'paint': 'л',
    'wallpaper': 'рул',
    'tile': 'м²',
    'flooring': 'м²',
    'screed': 'м²',
    'skirting': 'м',
    'drywall': 'м²'
  };
  
  return unitMap[category] || 'шт';
};

/**
 * Создает описание сметы на основе данных калькулятора
 */
export const createEstimateDescription = (data: CalculatorToEstimateData): string => {
  const roomCount = data.rooms.length;
  const materialCount = data.materials.length;
  const totalArea = data.totalMetrics?.totalFloorArea || 0;
  
  let description = `Расчет материалов для ${roomCount} ${roomCount === 1 ? 'комнаты' : 'комнат'}`;
  
  if (totalArea > 0) {
    description += ` общей площадью ${Math.round(totalArea * 100) / 100} м²`;
  }
  
  if (materialCount > 0) {
    description += ` с использованием ${materialCount} ${materialCount === 1 ? 'материала' : 'материалов'}`;
  }
  
  return description;
};

/**
 * Создает название сметы на основе данных калькулятора
 */
export const createEstimateName = (data: CalculatorToEstimateData, customName?: string): string => {
  if (customName) {
    return customName;
  }
  
  const roomCount = data.rooms.length;
  const date = new Date().toLocaleDateString('ru-RU');
  
  return `Калькулятор материалов (${roomCount} ${roomCount === 1 ? 'комната' : 'комнат'}) - ${date}`;
};
