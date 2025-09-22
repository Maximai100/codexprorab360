// Главный экспорт калькулятора для интеграции в Прораб360
export { default as CalculatorModule } from './components/CalculatorModule';
export { CalculatorView } from './components/CalculatorView';


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

// Прямые импорты из исходных файлов
export {
    convertToMeters,
    calculateRoomMetrics,
    calculateTotalMetrics,
    validateRoomDimensions,
    calculateBagQuantity,
    calculatePaintQuantity,
    calculateWallpaperQuantity
} from './utils/calculations';

export {
    PlatformAPI,
    TelegramPlatformAPI,
    WebPlatformAPI,
    ReactNativePlatformAPI,
    PlatformAPIFactory,
    platformAPI,
    usePlatformAPI
} from './utils/platformAPI';

export {
    MaterialCalculator,
    MaterialCalculatorProps,
    BaseMaterialCalculator,
    PlasterCalculatorPlugin,
    PaintCalculatorPlugin,
    WallpaperCalculatorPlugin,
    MaterialCalculatorRegistry,
    materialCalculatorRegistry,
    useMaterialCalculators
} from './utils/materialCalculators';

export {
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
    useValidation
} from './utils/validation';

export {
    CalculatorEventType,
    CalculatorEventData,
    EventHandler,
    EventBus,
    CalculatorEventBus,
    calculatorEventBus,
    useEventBus,
    EventUtils,
    DefaultEventHandlers,
    initializeDefaultHandlers
} from './utils/eventBus';

export {
    CalculatorConfigSchema,
    defaultConfig,
    ConfigManager,
    configManager,
    useConfig,
    useConfigManager,
    ConfigUtils,
    initializeConfig
} from './utils/config';

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