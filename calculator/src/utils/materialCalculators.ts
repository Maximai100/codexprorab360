// Система плагинов для калькуляторов материалов

import React from 'react';
import { RoomMetrics, MaterialResult, SavedMaterial, MaterialCategory } from '../types';

// Базовый интерфейс для калькулятора материалов
export interface MaterialCalculator {
  // Основная информация
  name: string;
  category: MaterialCategory;
  description?: string;
  icon?: string;
  
  // Параметры расчета
  requiredMetrics: (keyof RoomMetrics)[];
  defaultParams: Record<string, string>;
  
  // Методы
  calculate: (metrics: RoomMetrics, params: Record<string, string>) => MaterialResult;
  validateParams: (params: Record<string, string>) => { isValid: boolean; errors: string[] };
  
  // UI компонент
  render: (props: MaterialCalculatorProps) => React.ReactNode;
  
  // Дополнительные возможности
  getHelpText?: () => string;
  getExamples?: () => Array<{ name: string; params: Record<string, string> }>;
}

// Пропсы для рендеринга калькулятора
export interface MaterialCalculatorProps {
  name: string;
  materials: SavedMaterial[];
  onResultChange: (name: string, result: MaterialResult | null) => void;
  metrics: RoomMetrics;
  params?: Record<string, string>;
  onParamsChange?: (params: Record<string, string>) => void;
  readOnly?: boolean;
}

// Базовый класс для калькуляторов материалов
export abstract class BaseMaterialCalculator implements MaterialCalculator {
  abstract name: string;
  abstract category: MaterialCategory;
  abstract description?: string;
  abstract icon?: string;
  abstract requiredMetrics: (keyof RoomMetrics)[];
  abstract defaultParams: Record<string, string>;

  abstract calculate(metrics: RoomMetrics, params: Record<string, string>): MaterialResult;

  validateParams(params: Record<string, string>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Проверяем обязательные параметры
    Object.keys(this.defaultParams).forEach(key => {
      if (!params[key] || params[key].trim() === '') {
        errors.push(`Параметр "${key}" обязателен`);
      }
    });
    
    // Проверяем числовые значения
    Object.entries(params).forEach(([key, value]) => {
      const num = parseFloat(value.replace(',', '.'));
      if (isNaN(num) || num < 0) {
        errors.push(`Параметр "${key}" должен быть положительным числом`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  abstract render(props: MaterialCalculatorProps): React.ReactNode;

  getHelpText(): string {
    return `Калькулятор для ${this.name}`;
  }

  getExamples(): Array<{ name: string; params: Record<string, string> }> {
    return [];
  }
}

// Калькулятор штукатурки
export class PlasterCalculatorPlugin extends BaseMaterialCalculator {
  name = 'Штукатурка';
  category: MaterialCategory = 'plaster';
  description = 'Расчет количества штукатурки для стен и потолков';
  icon = '🏗️';
  requiredMetrics: (keyof RoomMetrics)[] = ['netWallArea', 'floorArea'];
  defaultParams = {
    thickness: '0.02',
    consumption: '8.5',
    bagWeight: '25',
    margin: '10',
    price: '0'
  };

  calculate(metrics: RoomMetrics, params: Record<string, string>): MaterialResult {
    const thickness = parseFloat(params.thickness.replace(',', '.')) || 0;
    const consumption = parseFloat(params.consumption.replace(',', '.')) || 0;
    const bagWeight = parseFloat(params.bagWeight.replace(',', '.')) || 1;
    const margin = parseFloat(params.margin.replace(',', '.')) || 0;
    const price = parseFloat(params.price.replace(',', '.')) || 0;

    const area = metrics.netWallArea;
    const totalWeight = area * thickness * consumption * (1 + margin / 100);
    const bags = Math.ceil(totalWeight / bagWeight);
    const totalCost = bags * price;

    const quantityText = `${totalWeight.toFixed(2)} кг (≈ ${bags} меш.)`;
    const costText = price > 0 ? ` - ${totalCost.toFixed(2)} ₽` : '';

    return {
      quantity: quantityText,
      cost: totalCost,
      details: {
        "Количество": quantityText,
        "Стоимость": `${totalCost.toFixed(2)} ₽`,
        "Цена за мешок": `${price.toFixed(2)} ₽`,
        "Всего мешков": `${bags} шт.`
      },
      showNote: bags > 0,
      text: quantityText + costText,
    };
  }

  render(props: MaterialCalculatorProps): React.ReactNode {
    // Здесь будет рендеринг компонента
    return React.createElement('div', { key: props.name }, `PlasterCalculator: ${props.name}`);
  }
}

// Калькулятор краски
export class PaintCalculatorPlugin extends BaseMaterialCalculator {
  name = 'Краска';
  category: MaterialCategory = 'paint';
  description = 'Расчет количества краски для покраски стен и потолков';
  icon = '🎨';
  requiredMetrics: (keyof RoomMetrics)[] = ['netWallArea', 'floorArea'];
  defaultParams = {
    consumption: '0.15',
    layers: '2',
    volume: '5',
    margin: '10',
    price: '0'
  };

  calculate(metrics: RoomMetrics, params: Record<string, string>): MaterialResult {
    const consumption = parseFloat(params.consumption.replace(',', '.')) || 0;
    const layers = parseInt(params.layers, 10) || 0;
    const volume = parseFloat(params.volume.replace(',', '.')) || 1;
    const margin = parseFloat(params.margin.replace(',', '.')) || 0;
    const price = parseFloat(params.price.replace(',', '.')) || 0;

    const area = metrics.netWallArea;
    const totalLiters = area * consumption * layers * (1 + margin / 100);
    const cans = Math.ceil(totalLiters / volume);
    const totalCost = cans * price;

    const quantityText = `${totalLiters.toFixed(2)} л (≈ ${cans} банок)`;
    const costText = price > 0 ? ` - ${totalCost.toFixed(2)} ₽` : '';

    return {
      quantity: quantityText,
      cost: totalCost,
      details: {
        "Количество": quantityText,
        "Стоимость": `${totalCost.toFixed(2)} ₽`,
        "Цена за банку": `${price.toFixed(2)} ₽`,
        "Всего банок": `${cans} шт.`
      },
      showNote: cans > 0,
      text: quantityText + costText,
    };
  }

  render(props: MaterialCalculatorProps): React.ReactNode {
    return React.createElement('div', { key: props.name }, `PaintCalculator: ${props.name}`);
  }
}

// Калькулятор обоев
export class WallpaperCalculatorPlugin extends BaseMaterialCalculator {
  name = 'Обои';
  category: MaterialCategory = 'wallpaper';
  description = 'Расчет количества обоев для оклейки стен';
  icon = '📄';
  requiredMetrics: (keyof RoomMetrics)[] = ['perimeter', 'height'];
  defaultParams = {
    rollLength: '10.05',
    rollWidth: '1.06',
    trimAllowance: '10',
    rapport: '0',
    margin: '5',
    price: '0'
  };

  calculate(metrics: RoomMetrics, params: Record<string, string>): MaterialResult {
    const rollLength = parseFloat(params.rollLength.replace(',', '.')) || 1;
    const rollWidth = parseFloat(params.rollWidth.replace(',', '.')) || 1;
    const trimAllowance = parseFloat(params.trimAllowance.replace(',', '.')) || 0;
    const rapport = parseFloat(params.rapport.replace(',', '.')) || 0;
    const margin = parseInt(params.margin, 10) || 0;
    const price = parseFloat(params.price.replace(',', '.')) || 0;

    const perimeter = metrics.perimeter;
    const height = metrics.height;
    const trimAllowanceM = trimAllowance / 100;
    const rapportM = rapport / 100;

    const totalStripsNeeded = Math.ceil(perimeter / rollWidth);
    const stripLengthWithTrim = height + trimAllowanceM;

    if (stripLengthWithTrim > rollLength) {
      return {
        quantity: 'Ошибка: Высота потолка больше длины рулона',
        cost: 0,
        details: {},
        showNote: false,
        text: 'Ошибка: Высота потолка больше длины рулона'
      };
    }

    let rolls = 0;
    let stripsCut = 0;

    while (stripsCut < totalStripsNeeded) {
      rolls++;
      const stripsFromThisRoll = Math.floor(rollLength / stripLengthWithTrim);
      stripsCut += stripsFromThisRoll;
    }

    const finalRolls = Math.ceil(rolls * (1 + margin / 100));
    const totalCost = finalRolls * price;

    const quantityText = `${finalRolls} рулонов (${totalStripsNeeded} полос)`;
    const costText = price > 0 ? `\nОбщая стоимость: ${totalCost.toFixed(2)} ₽` : '';

    return {
      quantity: quantityText,
      cost: totalCost,
      details: {
        "Количество": quantityText,
        "Стоимость": `${totalCost.toFixed(2)} ₽`,
        "Цена за рулон": `${price.toFixed(2)} ₽`,
        "Всего рулонов": `${finalRolls} шт.`,
        "Полос": `${totalStripsNeeded} шт.`
      },
      showNote: finalRolls > 0,
      text: quantityText + costText,
    };
  }

  render(props: MaterialCalculatorProps): React.ReactNode {
    return React.createElement('div', { key: props.name }, `WallpaperCalculator: ${props.name}`);
  }
}

// Реестр плагинов
export class MaterialCalculatorRegistry {
  private calculators: Map<string, MaterialCalculator> = new Map();

  register(calculator: MaterialCalculator): void {
    this.calculators.set(calculator.name, calculator);
  }

  unregister(name: string): void {
    this.calculators.delete(name);
  }

  get(name: string): MaterialCalculator | undefined {
    return this.calculators.get(name);
  }

  getAll(): MaterialCalculator[] {
    return Array.from(this.calculators.values());
  }

  getByCategory(category: MaterialCategory): MaterialCalculator[] {
    return this.getAll().filter(calc => calc.category === category);
  }

  getNames(): string[] {
    return Array.from(this.calculators.keys());
  }

  clear(): void {
    this.calculators.clear();
  }
}

// Глобальный реестр
export const materialCalculatorRegistry = new MaterialCalculatorRegistry();

// Регистрация стандартных калькуляторов
materialCalculatorRegistry.register(new PlasterCalculatorPlugin());
materialCalculatorRegistry.register(new PaintCalculatorPlugin());
materialCalculatorRegistry.register(new WallpaperCalculatorPlugin());

// Хук для использования реестра
export const useMaterialCalculators = () => {
  const [calculators, setCalculators] = React.useState<MaterialCalculator[]>(
    materialCalculatorRegistry.getAll()
  );

  const registerCalculator = React.useCallback((calculator: MaterialCalculator) => {
    materialCalculatorRegistry.register(calculator);
    setCalculators(materialCalculatorRegistry.getAll());
  }, []);

  const unregisterCalculator = React.useCallback((name: string) => {
    materialCalculatorRegistry.unregister(name);
    setCalculators(materialCalculatorRegistry.getAll());
  }, []);

  const getCalculator = React.useCallback((name: string) => {
    return materialCalculatorRegistry.get(name);
  }, []);

  const getCalculatorsByCategory = React.useCallback((category: MaterialCategory) => {
    return materialCalculatorRegistry.getByCategory(category);
  }, []);

  return {
    calculators,
    registerCalculator,
    unregisterCalculator,
    getCalculator,
    getCalculatorsByCategory
  };
};
