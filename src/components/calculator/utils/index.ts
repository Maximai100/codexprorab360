export { 
    convertToMeters, 
    conversionFactors, 
    calculateRoomMetrics, 
    calculateTotalMetrics,
    validateNumber,
    validateRoomDimensions,
    safeLocalStorage,
    calculateBagQuantity,
    calculatePaintQuantity,
    calculateWallpaperQuantity
} from './calculations';
export {
    exportToPDF,
    exportToExcel,
    exportToJSON,
    exportToTelegram
} from './exportUtils';
export {
    PlatformAPI,
    TelegramPlatformAPI,
    WebPlatformAPI,
    ReactNativePlatformAPI,
    PlatformAPIFactory,
    platformAPI,
    usePlatformAPI
} from './platformAPI';
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
} from './materialCalculators';
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
} from './validation';
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
} from './eventBus';
export {
    CalculatorConfigSchema,
    defaultConfig,
    ConfigManager,
    configManager,
    useConfig,
    useConfigManager,
    ConfigUtils,
    initializeConfig
} from './config';
