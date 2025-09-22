import { Unit, RoomData, RoomMetrics, TotalCalculations, ValidationResult, CalculatorError } from '../types';

// --- CALCULATION UTILITIES ---

export const convertToMeters = (value: string, fromUnit: Unit): number => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return 0;
    return num / conversionFactors[fromUnit];
};

export const conversionFactors: Record<Unit, number> = { m: 1, cm: 100 };

export const calculateRoomMetrics = (room: RoomData): RoomMetrics => {
    const lengthM = convertToMeters(room.length, room.unit);
    const widthM = convertToMeters(room.width, room.unit);
    const heightM = convertToMeters(room.height, room.unit);
    const floorArea = lengthM * widthM;
    const perimeter = (lengthM + widthM) * 2;
    const grossWallArea = perimeter * heightM;

    const modifiedTotalOpeningsArea = room.openings.reduce((sum, op) => {
        const w = convertToMeters(op.width, room.unit);
        const h = convertToMeters(op.height, room.unit);
        const count = parseInt(op.count.replace(',', '.'), 10) || 0;
        if (op.type === 'window' && op.includeSillArea && op.sillHeight) {
            const sillH = convertToMeters(op.sillHeight, room.unit);
            return sum + w * Math.max(0, h - sillH) * count;
        }
        return sum + w * h * count;
    }, 0);

    const totalOpeningsArea = room.openings.reduce((sum, op) => {
        const w = convertToMeters(op.width, room.unit);
        const h = convertToMeters(op.height, room.unit);
        return sum + w * h * (parseInt(op.count.replace(',', '.'), 10) || 0);
    }, 0);
    
    const totalExclusionWallArea = room.exclusions
        .filter(ex => ex.affectsWallArea)
        .reduce((sum, ex) => {
            const w = convertToMeters(ex.width, room.unit);
            const h = convertToMeters(ex.height, room.unit);
            return sum + w * h * (parseInt(ex.count.replace(',', '.'), 10) || 0);
        }, 0);

    const totalExclusionPerimeterLength = room.exclusions
        .filter(ex => ex.affectsPerimeter)
        .reduce((sum, ex) => {
            const w = convertToMeters(ex.width, room.unit);
            const h = convertToMeters(ex.height, room.unit);
            return sum + (w + h) * 2 * (parseInt(ex.count.replace(',', '.'), 10) || 0);
        }, 0);

    let adjustedNetWallArea = grossWallArea - modifiedTotalOpeningsArea - totalExclusionWallArea;
    let adjustedPerimeter = perimeter - totalExclusionPerimeterLength;
    let adjustedFloorArea = floorArea;

    let geometryWallAreaChange = 0;
    room.geometricElements.forEach(el => {
        const count = parseInt(el.count.replace(',', '.'), 10) || 0;
        if (count === 0) return;
        const h = convertToMeters(el.height, room.unit);
        let areaChange = 0;

        if (el.type === 'column') {
            const diameter = convertToMeters(el.diameter, room.unit);
            if (diameter > 0) {
                areaChange = (Math.PI * diameter * h) * count;
                adjustedPerimeter += (Math.PI * diameter) * count;
                const radius = diameter / 2;
                adjustedFloorArea -= (Math.PI * radius * radius) * count;
            }
        } else { // Niche or Protrusion
            const width = convertToMeters(el.width, room.unit);
            const depth = convertToMeters(el.depth, room.unit);
            if (width > 0 && depth > 0) {
                if (el.type === 'niche') {
                    areaChange = (width * h + 2 * depth * h) * count;
                    adjustedPerimeter += (2 * depth) * count;
                } else { // Protrusion
                    areaChange = (2 * depth * h) * count;
                    adjustedPerimeter += (2 * depth) * count;
                }
            }
        }
        adjustedNetWallArea += areaChange;
        geometryWallAreaChange += areaChange;
    });

    const netWallArea = Math.max(0, adjustedNetWallArea);
    const finalPerimeter = Math.max(0, adjustedPerimeter);
    const finalFloorArea = Math.max(0, adjustedFloorArea);

    const totalDoorWidth = room.openings.filter(op => op.type === 'door').reduce((sum, op) => {
        const w = convertToMeters(op.width, room.unit);
        return sum + w * (parseInt(op.count.replace(',', '.'), 10) || 0);
    }, 0);

    return { 
        floorArea: finalFloorArea, 
        perimeter: finalPerimeter,
        netWallArea,
        totalDoorWidth,
        totalExclusionPerimeterLength,
        height: heightM
    };
};

export const calculateTotalMetrics = (rooms: RoomData[]): TotalCalculations => {
    return rooms.reduce((totals, room) => {
        const metrics = calculateRoomMetrics(room);
        totals.totalFloorArea += metrics.floorArea;
        totals.totalPerimeter += metrics.perimeter;
        totals.totalNetWallArea += metrics.netWallArea;
        totals.totalDoorWidth += metrics.totalDoorWidth;
        totals.totalExclusionPerimeterLength += metrics.totalExclusionPerimeterLength;
        
        const roomDoorPerimeter = room.openings
            .filter(op => op.type === 'door')
            .reduce((sum, op) => {
                const w = convertToMeters(op.width, room.unit);
                const h = convertToMeters(op.height, room.unit);
                const count = parseInt(op.count.replace(',', '.'), 10) || 0;
                return sum + ((h * 2) + w) * count;
            }, 0);
        totals.totalDoorPerimeter += roomDoorPerimeter;

        totals.avgHeight = (totals.avgHeight * totals.roomCount + metrics.height) / (totals.roomCount + 1);
        totals.roomCount += 1;
        return totals;
    }, { 
        totalFloorArea: 0, 
        totalPerimeter: 0, 
        totalNetWallArea: 0, 
        totalDoorWidth: 0, 
        totalExclusionPerimeterLength: 0, 
        totalDoorPerimeter: 0, 
        avgHeight: 0, 
        roomCount: 0 
    });
};

// --- VALIDATION UTILITIES ---

export const validateNumber = (value: string, min: number = 0, max: number = Infinity): ValidationResult => {
    const num = parseFloat(value.replace(',', '.'));
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Введите корректное число' };
    }
    
    if (num < min) {
        return { isValid: false, error: `Значение должно быть не менее ${min}` };
    }
    
    if (num > max) {
        return { isValid: false, error: `Значение должно быть не более ${max}` };
    }
    
    return { isValid: true };
};

export const validateRoomDimensions = (room: RoomData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const lengthValidation = validateNumber(room.length, 0.1, 100);
    if (!lengthValidation.isValid) {
        errors.length = lengthValidation.error!;
    }
    
    const widthValidation = validateNumber(room.width, 0.1, 100);
    if (!widthValidation.isValid) {
        errors.width = widthValidation.error!;
    }
    
    const heightValidation = validateNumber(room.height, 0.1, 10);
    if (!heightValidation.isValid) {
        errors.height = heightValidation.error!;
    }
    
    return errors;
};

// --- ERROR HANDLING UTILITIES ---

export const safeLocalStorage = {
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            throw new CalculatorError('Storage unavailable', 'STORAGE_ERROR');
        }
    },
    
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            throw new CalculatorError('Storage unavailable', 'STORAGE_ERROR');
        }
    },
    
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            throw new CalculatorError('Storage unavailable', 'STORAGE_ERROR');
        }
    }
};

// --- MATERIAL CALCULATION UTILITIES ---

export const calculateBagQuantity = (
    area: number,
    thickness: number,
    consumption: number,
    bagWeight: number,
    margin: number
): { totalWeight: number; bags: number } => {
    if (area === 0 || bagWeight === 0) {
        return { totalWeight: 0, bags: 0 };
    }
    
    const totalWeight = area * thickness * consumption * (1 + margin / 100);
    const bags = Math.ceil(totalWeight / bagWeight);
    
    return { totalWeight, bags };
};

export const calculatePaintQuantity = (
    area: number,
    consumption: number,
    layers: number,
    volume: number,
    margin: number
): { totalLiters: number; cans: number } => {
    if (area === 0 || volume === 0) {
        return { totalLiters: 0, cans: 0 };
    }
    
    const totalLiters = area * consumption * layers * (1 + margin / 100);
    const cans = Math.ceil(totalLiters / volume);
    
    return { totalLiters, cans };
};

export const calculateWallpaperQuantity = (
    perimeter: number,
    height: number,
    rollLength: number,
    rollWidth: number,
    trimAllowance: number,
    rapport: number,
    margin: number
): { rolls: number; strips: number } => {
    if (perimeter === 0 || height === 0 || rollLength === 0 || rollWidth === 0) {
        return { rolls: 0, strips: 0 };
    }
    
    const totalStripsNeeded = Math.ceil(perimeter / rollWidth);
    const stripLengthWithTrim = height + trimAllowance;
    
    if (stripLengthWithTrim > rollLength) {
        throw new CalculatorError('Высота потолка больше длины рулона', 'WALLPAPER_ERROR');
    }
    
    let rolls = 0;
    let stripsCut = 0;
    
    while (stripsCut < totalStripsNeeded) {
        rolls++;
        const stripsFromThisRoll = Math.floor(rollLength / stripLengthWithTrim);
        stripsCut += stripsFromThisRoll;
    }
    
    const finalRolls = Math.ceil(rolls * (1 + margin / 100));
    
    return { rolls: finalRolls, strips: totalStripsNeeded };
};


