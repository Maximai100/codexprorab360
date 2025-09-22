// Главный экспорт для интеграции калькулятора в одно приложение
export { default as CalculatorModule } from './components/CalculatorModule';

// Типы для внешнего использования
export type {
    RoomData,
    MaterialResult,
    SavedMaterial,
    SavedEstimate,
    RoomMetrics,
    TotalCalculations,
    MaterialCalculatorProps,
    ThemeMode,
    Unit,
    Opening,
    ExclusionZone,
    GeometricElement,
    RoomImage,
    MaterialCategory,
    CalculatorConfig,
    CalculatorData,
    CalculatorIntegrationProps,
    CalculatorModuleProps
} from './types';

// Утилиты для внешнего использования
export {
    convertToMeters,
    calculateRoomMetrics,
    calculateTotalMetrics,
    validateRoomDimensions,
    calculateBagQuantity,
    calculatePaintQuantity,
    calculateWallpaperQuantity,
    PlatformAPI,
    TelegramPlatformAPI,
    WebPlatformAPI,
    ReactNativePlatformAPI,
    PlatformAPIFactory,
    platformAPI,
    usePlatformAPI,
    MaterialCalculator,
    MaterialCalculatorProps,
    BaseMaterialCalculator,
    PlasterCalculatorPlugin,
    PaintCalculatorPlugin,
    WallpaperCalculatorPlugin,
    MaterialCalculatorRegistry,
    materialCalculatorRegistry,
    useMaterialCalculators,
    ValidationRule,
    ValidationResult,
    ValidationSchema,
    ValidationRules,
    RoomValidationSchema,
    OpeningValidationSchema,
    ExclusionValidationSchema,
    GeometricElementValidationSchema,
    SavedMaterialValidationSchema,
    Validator,
    roomValidator,
    openingValidator,
    exclusionValidator,
    geometricElementValidator,
    savedMaterialValidator,
    validateRoom,
    validateOpening,
    validateExclusion,
    validateGeometricElement,
    validateSavedMaterial,
    validateProject,
    useValidation,
    CalculatorEventType,
    CalculatorEventData,
    EventHandler,
    EventBus,
    CalculatorEventBus,
    calculatorEventBus,
    useEventBus,
    EventUtils,
    DefaultEventHandlers,
    initializeDefaultHandlers,
    CalculatorConfigSchema,
    defaultConfig,
    ConfigManager,
    configManager,
    useConfig,
    useConfigManager,
    ConfigUtils,
    initializeConfig
} from './utils';

// Хуки для внешнего использования
export {
    useCalculator,
    useRoomMetrics,
    useMaterialSelection,
    useTheme,
    useLocalStorage,
    useSavedEstimates,
    useSavedMaterials
} from './hooks';

// Константы
export { MATERIAL_ORDER, conversionFactors } from './types';

// Стили (для импорта в приложении)
export const styles = {
    calculator: () => import('./styles/calculator.css'),
    components: () => import('./styles/components.css'),
    themes: () => import('./styles/themes.css'),
    responsive: () => import('./styles/responsive.css'),
    all: () => import('./styles/index.css')
};

// Конфигурация калькулятора для интеграции
export interface CalculatorConfig {
    theme?: ThemeMode;
    enableOfflineMode?: boolean;
    enableAutoSave?: boolean;
    enableExport?: boolean;
    enableTelegramIntegration?: boolean;
    customMaterials?: SavedMaterial[];
    onDataChange?: (rooms: RoomData[], materials: SavedMaterial[]) => void;
    onExport?: (format: string, data: any) => void;
}

// Простой интерфейс для интеграции
export interface CalculatorModuleProps {
    config?: CalculatorConfig;
    initialRooms?: RoomData[];
    initialMaterials?: SavedMaterial[];
    className?: string;
    style?: React.CSSProperties;
}