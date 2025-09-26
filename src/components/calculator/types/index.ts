// --- CALCULATOR DATA TYPES & UTILS ---

export type Unit = 'm' | 'cm';
export const conversionFactors: Record<Unit, number> = { m: 1, cm: 100 };

export interface Opening {
    id: number;
    width: string;
    height: string;
    count: string;
    type: 'window' | 'door';
    sillHeight?: string;
    includeSillArea?: boolean;
}

export interface ExclusionZone {
    id: number;
    name: string;
    width: string;
    height: string;
    count: string;
    affectsWallArea: boolean;
    affectsPerimeter: boolean;
}

export interface GeometricElement {
    id: number;
    type: 'niche' | 'protrusion' | 'column';
    width: string;   // For rectangle
    depth: string;   // For rectangle
    diameter: string; // For cylinder
    height: string;
    count: string;
}

export interface RoomImage {
    id: string;
    url: string;
    name: string;
    size: number;
    uploadedAt: string;
}

export interface RoomData {
    id: number;
    name: string;
    length: string;
    width: string;
    height: string;
    openings: Opening[];
    exclusions: ExclusionZone[];
    geometricElements: GeometricElement[];
    unit: Unit;
    notes: string;
    images: RoomImage[];
}

export interface SavedEstimate {
    id: number;
    name: string;
    date: string;
    rooms: RoomData[];
}

export interface MaterialResult {
    quantity: string;
    cost: number;
    details: Record<string, string>;
    showNote?: boolean;
    text: string;
}

export type MaterialCategory = 'plaster' | 'putty' | 'paint' | 'wallpaper' | 'tile' | 'flooring' | 'screed' | 'skirting' | 'drywall';

export interface SavedMaterial {
    id: number;
    name: string;
    category: MaterialCategory;
    params: Record<string, string>;
}

export interface MaterialCalculatorProps {
    name: string;
    materials: SavedMaterial[];
    onResultChange: (name: string, result: MaterialResult | null) => void;
}

export interface RoomMetrics {
    floorArea: number;
    perimeter: number;
    netWallArea: number;
    totalDoorWidth: number;
    totalExclusionPerimeterLength: number;
    height: number;
}

export interface TotalCalculations {
    totalFloorArea: number;
    totalPerimeter: number;
    totalNetWallArea: number;
    totalDoorWidth: number;
    totalExclusionPerimeterLength: number;
    totalDoorPerimeter: number;
    avgHeight: number;
    roomCount: number;
}

export type ThemeMode = 'light' | 'dark';

// Telegram Web App API types
export interface TelegramWebApp {
    version: string;
    ready: () => void;
    expand: () => void;
    sendData: (data: string) => void;
    HapticFeedback: {
        notificationOccurred: (type: 'success' | 'error' | 'warning') => void;
    };
    colorScheme: 'light' | 'dark';
    onEvent: (eventType: 'themeChanged', eventHandler: () => void) => void;
    offEvent: (eventType: 'themeChanged', eventHandler: () => void) => void;
    isClosingConfirmationEnabled: boolean;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    disableVerticalSwipes: () => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback: (ok: boolean) => void) => void;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
        jspdf: {
            jsPDF: typeof import('jspdf').jsPDF;
        }
    }
}

// Error handling types
export class CalculatorError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'CalculatorError';
    }
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

// Constants
export const MATERIAL_ORDER = [
    'Черновая штукатурка (Стены)', 'Черновая штукатурка (Потолок)',
    'Финишная шпаклевка (Стены)', 'Финишная шпаклевка (Потолок)',
    'Гипсокартон (Каркас)', 'Краска / Грунтовка', 'Обои', 'Плитка',
    'Ламинат / Напольные покрытия', 'Стяжка / Наливной пол', 'Плинтус'
] as const;

// Расширенная конфигурация калькулятора для интеграции
export interface CalculatorConfig {
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

// Данные калькулятора
export interface CalculatorData {
    rooms: RoomData[];
    materials: SavedMaterial[];
    totalMetrics: TotalCalculations;
    materialResults: Record<string, MaterialResult | null>;
    totalCost: number;
    lastUpdated: string;
}

// Расширенный интерфейс для интеграции
export interface CalculatorIntegrationProps {
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
    
    // Интеграция с системой смет
    onCreateEstimate?: (estimateData: {
        items: any[];
        clientInfo: string;
        description: string;
        projectId?: string | null;
    }) => void;
}

// Простой интерфейс для обратной совместимости
export interface CalculatorModuleProps extends CalculatorIntegrationProps {
    // Оставляем для обратной совместимости
}
