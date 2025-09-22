// Централизованная система конфигурации калькулятора

import React from 'react';
import { Unit, MaterialCategory, ThemeMode } from '../types';

// Базовые типы конфигурации
export interface CalculatorConfigSchema {
  // Основные настройки
  theme: ThemeMode;
  units: Unit;
  precision: number;
  
  // Функциональность
  enableOfflineMode: boolean;
  enableAutoSave: boolean;
  enableExport: boolean;
  enableTelegramIntegration: boolean;
  enableMaterialLibrary: boolean;
  enableImageUpload: boolean;
  
  // Настройки расчета
  defaultMargin: number;
  calculationTimeout: number;
  
  // UI настройки
  showTooltips: boolean;
  showHelpText: boolean;
  enableAnimations: boolean;
  
  // Настройки материалов
  materials: {
    defaultCategories: MaterialCategory[];
    customCategories: string[];
    defaultParams: Record<MaterialCategory, Record<string, string>>;
  };
  
  // Настройки комнат
  rooms: {
    defaultPresets: Array<{
      name: string;
      width: number;
      length: number;
      height: number;
      unit: Unit;
    }>;
    maxRooms: number;
    maxOpeningsPerRoom: number;
    maxExclusionsPerRoom: number;
    maxGeometricElementsPerRoom: number;
  };
  
  // Настройки экспорта
  export: {
    defaultFormat: 'pdf' | 'excel' | 'json' | 'telegram';
    pdfSettings: {
      pageSize: 'A4' | 'A3' | 'Letter';
      orientation: 'portrait' | 'landscape';
      includeImages: boolean;
      includeNotes: boolean;
    };
    excelSettings: {
      includeFormulas: boolean;
      includeCharts: boolean;
      sheetName: string;
    };
  };
  
  // Настройки валидации
  validation: {
    strictMode: boolean;
    showWarnings: boolean;
    autoValidate: boolean;
  };
  
  // Настройки производительности
  performance: {
    debounceDelay: number;
    throttleDelay: number;
    maxConcurrentCalculations: number;
    enableCaching: boolean;
  };
}

// Конфигурация по умолчанию
export const defaultConfig: CalculatorConfigSchema = {
  // Основные настройки
  theme: 'dark',
  units: 'm',
  precision: 2,
  
  // Функциональность
  enableOfflineMode: true,
  enableAutoSave: true,
  enableExport: true,
  enableTelegramIntegration: false,
  enableMaterialLibrary: true,
  enableImageUpload: true,
  
  // Настройки расчета
  defaultMargin: 10,
  calculationTimeout: 5000,
  
  // UI настройки
  showTooltips: true,
  showHelpText: true,
  enableAnimations: true,
  
  // Настройки материалов
  materials: {
    defaultCategories: ['plaster', 'putty', 'paint', 'wallpaper', 'tile', 'flooring', 'screed', 'skirting', 'drywall'],
    customCategories: [],
    defaultParams: {
      plaster: {
        thickness: '0.02',
        consumption: '8.5',
        bagWeight: '25',
        margin: '10',
        price: '0'
      },
      putty: {
        thickness: '0.001',
        consumption: '1.2',
        bagWeight: '20',
        margin: '10',
        price: '0'
      },
      paint: {
        consumption: '0.15',
        layers: '2',
        volume: '5',
        margin: '10',
        price: '0'
      },
      wallpaper: {
        rollLength: '10.05',
        rollWidth: '1.06',
        trimAllowance: '10',
        rapport: '0',
        margin: '5',
        price: '0'
      },
      tile: {
        tileWidth: '0.3',
        tileHeight: '0.3',
        tileThickness: '0.01',
        groutWidth: '0.002',
        margin: '10',
        price: '0'
      },
      flooring: {
        plankWidth: '0.2',
        plankLength: '1.2',
        plankThickness: '0.008',
        margin: '10',
        price: '0'
      },
      screed: {
        thickness: '0.05',
        consumption: '20',
        bagWeight: '25',
        margin: '10',
        price: '0'
      },
      skirting: {
        length: '2.5',
        height: '0.1',
        margin: '10',
        price: '0'
      },
      drywall: {
        sheetWidth: '1.2',
        sheetHeight: '2.5',
        sheetThickness: '0.0125',
        margin: '10',
        price: '0'
      }
    }
  },
  
  // Настройки комнат
  rooms: {
    defaultPresets: [
      { name: 'Спальня', width: 3.5, length: 4, height: 2.7, unit: 'm' },
      { name: 'Гостиная', width: 5, length: 6, height: 2.8, unit: 'm' },
      { name: 'Кухня', width: 3, length: 4, height: 2.7, unit: 'm' },
      { name: 'Ванная', width: 2, length: 2.5, height: 2.5, unit: 'm' },
      { name: 'Прихожая', width: 2, length: 3, height: 2.7, unit: 'm' }
    ],
    maxRooms: 50,
    maxOpeningsPerRoom: 20,
    maxExclusionsPerRoom: 20,
    maxGeometricElementsPerRoom: 20
  },
  
  // Настройки экспорта
  export: {
    defaultFormat: 'pdf',
    pdfSettings: {
      pageSize: 'A4',
      orientation: 'portrait',
      includeImages: true,
      includeNotes: true
    },
    excelSettings: {
      includeFormulas: true,
      includeCharts: false,
      sheetName: 'Смета'
    }
  },
  
  // Настройки валидации
  validation: {
    strictMode: false,
    showWarnings: true,
    autoValidate: true
  },
  
  // Настройки производительности
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    maxConcurrentCalculations: 5,
    enableCaching: true
  }
};

// Менеджер конфигурации
export class ConfigManager {
  private config: CalculatorConfigSchema;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor(initialConfig?: Partial<CalculatorConfigSchema>) {
    this.config = this.mergeConfig(defaultConfig, initialConfig || {});
  }

  // Получение значения конфигурации
  get<K extends keyof CalculatorConfigSchema>(key: K): CalculatorConfigSchema[K] {
    return this.config[key];
  }

  // Получение вложенного значения
  getNested<K extends keyof CalculatorConfigSchema, N extends keyof CalculatorConfigSchema[K]>(
    key: K,
    nestedKey: N
  ): CalculatorConfigSchema[K][N] {
    return this.config[key][nestedKey];
  }

  // Установка значения конфигурации
  set<K extends keyof CalculatorConfigSchema>(key: K, value: CalculatorConfigSchema[K]): void {
    const oldValue = this.config[key];
    this.config[key] = value;
    this.notifyListeners(key, value, oldValue);
  }

  // Установка вложенного значения
  setNested<K extends keyof CalculatorConfigSchema, N extends keyof CalculatorConfigSchema[K]>(
    key: K,
    nestedKey: N,
    value: CalculatorConfigSchema[K][N]
  ): void {
    const oldValue = this.config[key][nestedKey];
    this.config[key] = { ...this.config[key], [nestedKey]: value };
    this.notifyListeners(`${key}.${nestedKey}`, value, oldValue);
  }

  // Обновление конфигурации
  update(updates: Partial<CalculatorConfigSchema>): void {
    const oldConfig = { ...this.config };
    this.config = this.mergeConfig(this.config, updates);
    
    // Уведомляем об изменениях
    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof CalculatorConfigSchema;
      if (updates[typedKey] !== undefined) {
        this.notifyListeners(typedKey, this.config[typedKey], oldConfig[typedKey]);
      }
    });
  }

  // Получение всей конфигурации
  getAll(): CalculatorConfigSchema {
    return { ...this.config };
  }

  // Сброс к конфигурации по умолчанию
  reset(): void {
    this.config = { ...defaultConfig };
    this.notifyListeners('*', this.config, null);
  }

  // Подписка на изменения
  subscribe<K extends keyof CalculatorConfigSchema>(
    key: K,
    listener: (value: CalculatorConfigSchema[K], oldValue: CalculatorConfigSchema[K]) => void
  ): () => void {
    if (!this.listeners.has(key as string)) {
      this.listeners.set(key as string, new Set());
    }
    this.listeners.get(key as string)!.add(listener);

    return () => {
      this.listeners.get(key as string)?.delete(listener);
    };
  }

  // Уведомление слушателей
  private notifyListeners(key: string, value: unknown, oldValue: unknown): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(value, oldValue);
        } catch (error) {
          console.error(`Error in config listener for ${key}:`, error);
        }
      });
    }

    // Уведомляем глобальных слушателей
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(this.config, null);
        } catch (error) {
          console.error('Error in global config listener:', error);
        }
      });
    }
  }

  // Слияние конфигураций
  private mergeConfig(
    base: CalculatorConfigSchema,
    updates: Partial<CalculatorConfigSchema>
  ): CalculatorConfigSchema {
    const merged = { ...base };

    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof CalculatorConfigSchema;
      const value = updates[typedKey];
      
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[typedKey] = { ...merged[typedKey], ...value } as any;
        } else {
          merged[typedKey] = value as any;
        }
      }
    });

    return merged;
  }

  // Сохранение в localStorage
  saveToStorage(): void {
    try {
      localStorage.setItem('calculator-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }

  // Загрузка из localStorage
  loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem('calculator-config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = this.mergeConfig(defaultConfig, parsedConfig);
        return true;
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
    return false;
  }

  // Экспорт конфигурации
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Импорт конфигурации
  import(configJson: string): boolean {
    try {
      const parsedConfig = JSON.parse(configJson);
      this.config = this.mergeConfig(defaultConfig, parsedConfig);
      this.notifyListeners('*', this.config, null);
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }
}

// Глобальный экземпляр менеджера конфигурации
export const configManager = new ConfigManager();

// Хук для использования конфигурации в React компонентах
export const useConfig = <K extends keyof CalculatorConfigSchema>(key: K) => {
  const [value, setValue] = React.useState<CalculatorConfigSchema[K]>(configManager.get(key));

  React.useEffect(() => {
    const unsubscribe = configManager.subscribe(key, (newValue) => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [key]);

  const updateValue = React.useCallback((newValue: CalculatorConfigSchema[K]) => {
    configManager.set(key, newValue);
  }, [key]);

  return [value, updateValue] as const;
};

// Хук для использования всей конфигурации
export const useConfigManager = () => {
  const [config, setConfig] = React.useState<CalculatorConfigSchema>(configManager.getAll());

  React.useEffect(() => {
    const unsubscribe = configManager.subscribe('*' as any, () => {
      setConfig(configManager.getAll());
    });

    return unsubscribe;
  }, []);

  const updateConfig = React.useCallback((updates: Partial<CalculatorConfigSchema>) => {
    configManager.update(updates);
  }, []);

  const resetConfig = React.useCallback(() => {
    configManager.reset();
  }, []);

  const saveConfig = React.useCallback(() => {
    configManager.saveToStorage();
  }, []);

  const loadConfig = React.useCallback(() => {
    return configManager.loadFromStorage();
  }, []);

  const exportConfig = React.useCallback(() => {
    return configManager.export();
  }, []);

  const importConfig = React.useCallback((configJson: string) => {
    return configManager.import(configJson);
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    loadConfig,
    exportConfig,
    importConfig
  };
};

// Утилиты для работы с конфигурацией
export const ConfigUtils = {
  // Валидация конфигурации
  validate(config: Partial<CalculatorConfigSchema>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Неверная тема');
    }

    if (config.units && !['m', 'cm'].includes(config.units)) {
      errors.push('Неверные единицы измерения');
    }

    if (config.precision && (config.precision < 0 || config.precision > 10)) {
      errors.push('Точность должна быть от 0 до 10');
    }

    if (config.defaultMargin && (config.defaultMargin < 0 || config.defaultMargin > 100)) {
      errors.push('Запас должен быть от 0 до 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Создание конфигурации для конкретного случая использования
  createPreset(name: string, overrides: Partial<CalculatorConfigSchema>): CalculatorConfigSchema {
    return configManager.mergeConfig(defaultConfig, overrides);
  },

  // Получение конфигурации для материала
  getMaterialConfig(category: MaterialCategory): Record<string, string> {
    return configManager.get('materials').defaultParams[category] || {};
  },

  // Получение пресетов комнат
  getRoomPresets(): Array<{
    name: string;
    width: number;
    length: number;
    height: number;
    unit: Unit;
  }> {
    return configManager.get('rooms').defaultPresets;
  }
};

// Инициализация конфигурации
export const initializeConfig = () => {
  // Загружаем сохраненную конфигурацию
  configManager.loadFromStorage();
  
  // Сохраняем конфигурацию при изменениях
  configManager.subscribe('*' as any, () => {
    configManager.saveToStorage();
  });
};
