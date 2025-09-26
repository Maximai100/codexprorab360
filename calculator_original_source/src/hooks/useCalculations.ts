import { useState, useMemo, useCallback } from 'react';
import { MaterialResult, SavedMaterial } from '../types';
import { calculateBagQuantity, calculatePaintQuantity, calculateWallpaperQuantity } from '../utils/calculations';

// Hook for bag-based material calculations
export const useBagCalculation = (
    area: number,
    initialThickness: string,
    initialConsumption: string,
    initialBagWeight: string,
    initialMargin: string,
    initialPrice: string
) => {
    const [thickness, setThickness] = useState(initialThickness);
    const [consumption, setConsumption] = useState(initialConsumption);
    const [bagWeight, setBagWeight] = useState(initialBagWeight);
    const [margin, setMargin] = useState(initialMargin);
    const [price, setPrice] = useState(initialPrice);

    const result = useMemo(() => {
        const nArea = area || 0;
        const nThickness = parseFloat(thickness.replace(',', '.')) || 0;
        const nConsumption = parseFloat(consumption.replace(',', '.')) || 0;
        const nBagWeight = parseFloat(bagWeight.replace(',', '.')) || 1;
        const nMargin = parseFloat(margin.replace(',', '.')) || 0;
        const nPrice = parseFloat(price.replace(',', '.')) || 0;

        if (nArea === 0 || nBagWeight === 0) return null;

        const { totalWeight, bags } = calculateBagQuantity(
            nArea, 
            nThickness, 
            nConsumption, 
            nBagWeight, 
            nMargin
        );
        
        const totalCost = bags * nPrice;
        
        const quantityText = `${totalWeight.toFixed(2)} кг (≈ ${bags} меш.)`;
        const costText = nPrice > 0 ? ` - ${totalCost.toFixed(2)} ₽` : '';

        return {
            quantity: quantityText,
            cost: totalCost,
            details: {
                "Количество": quantityText,
                "Стоимость": `${totalCost.toFixed(2)} ₽`,
                "Цена за мешок": `${nPrice.toFixed(2)} ₽`,
                "Всего мешков": `${bags} шт.`
            },
            showNote: bags > 0,
            text: quantityText + costText,
        };
    }, [area, thickness, consumption, bagWeight, margin, price]);

    return {
        thickness, setThickness,
        consumption, setConsumption,
        bagWeight, setBagWeight,
        margin, setMargin,
        price, setPrice,
        result
    };
};

// Hook for paint calculations
export const usePaintCalculation = (
    area: number,
    initialConsumption: string,
    initialLayers: string,
    initialVolume: string,
    initialMargin: string,
    initialPrice: string
) => {
    const [consumption, setConsumption] = useState(initialConsumption);
    const [layers, setLayers] = useState(initialLayers);
    const [volume, setVolume] = useState(initialVolume);
    const [margin, setMargin] = useState(initialMargin);
    const [price, setPrice] = useState(initialPrice);

    const result = useMemo(() => {
        const nArea = area || 0;
        const nConsumption = parseFloat(consumption.replace(',', '.')) || 0;
        const nLayers = parseInt(layers, 10) || 0;
        const nVolume = parseFloat(volume.replace(',', '.')) || 1;
        const nMargin = parseFloat(margin.replace(',', '.')) || 0;
        const nPrice = parseFloat(price.replace(',', '.')) || 0;

        if (nArea === 0 || nVolume === 0) return null;

        const { totalLiters, cans } = calculatePaintQuantity(
            nArea, 
            nConsumption, 
            nLayers, 
            nVolume, 
            nMargin
        );
        
        const totalCost = cans * nPrice;

        const quantityText = `${totalLiters.toFixed(2)} л (≈ ${cans} банок)`;
        const costText = nPrice > 0 ? ` - ${totalCost.toFixed(2)} ₽` : '';
        
        return {
            quantity: quantityText,
            cost: totalCost,
            details: {
                "Количество": quantityText,
                "Стоимость": `${totalCost.toFixed(2)} ₽`,
                "Цена за банку": `${nPrice.toFixed(2)} ₽`,
                "Всего банок": `${cans} шт.`
            },
            showNote: cans > 0,
            text: quantityText + costText,
        };
    }, [area, consumption, layers, volume, margin, price]);

    return {
        consumption, setConsumption,
        layers, setLayers,
        volume, setVolume,
        margin, setMargin,
        price, setPrice,
        result
    };
};

// Hook for wallpaper calculations
export const useWallpaperCalculation = (
    perimeter: number,
    height: number,
    initialRollLength: string,
    initialRollWidth: string,
    initialTrimAllowance: string,
    initialRapport: string,
    initialMargin: string,
    initialPrice: string
) => {
    const [rollLength, setRollLength] = useState(initialRollLength);
    const [rollWidth, setRollWidth] = useState(initialRollWidth);
    const [trimAllowance, setTrimAllowance] = useState(initialTrimAllowance);
    const [rapport, setRapport] = useState(initialRapport);
    const [margin, setMargin] = useState(initialMargin);
    const [price, setPrice] = useState(initialPrice);

    const result = useMemo(() => {
        const nPerimeter = perimeter || 0;
        const nHeight = height || 0;
        const nRollLength = parseFloat(rollLength.replace(',', '.')) || 1;
        const nRollWidth = parseFloat(rollWidth.replace(',', '.')) || 1;
        const nRapportM = (parseFloat(rapport.replace(',', '.')) || 0) / 100;
        const nMargin = parseInt(margin, 10) || 0;
        const nTrimAllowanceM = (parseFloat(trimAllowance.replace(',', '.')) || 0) / 100;
        const nPrice = parseFloat(price.replace(',', '.')) || 0;

        if (nPerimeter === 0 || nHeight === 0 || nRollLength === 0 || nRollWidth === 0) return null;

        try {
            const { rolls, strips } = calculateWallpaperQuantity(
                nPerimeter,
                nHeight,
                nRollLength,
                nRollWidth,
                nTrimAllowanceM,
                nRapportM,
                nMargin
            );

            const totalCost = rolls * nPrice;
            const quantityText = `${rolls} рулонов (${strips} полос)`;
            const costText = nPrice > 0 ? `\nОбщая стоимость: ${totalCost.toFixed(2)} ₽` : '';

            return {
                quantity: quantityText,
                cost: totalCost,
                details: {
                    "Количество": quantityText,
                    "Стоимость": `${totalCost.toFixed(2)} ₽`,
                    "Цена за рулон": `${nPrice.toFixed(2)} ₽`,
                    "Всего рулонов": `${rolls} шт.`,
                    "Полос": `${strips} шт.`
                },
                showNote: rolls > 0,
                text: quantityText + costText,
            };
        } catch (error) {
            return {
                quantity: `Ошибка: ${error.message}`,
                cost: 0,
                details: {},
                showNote: false,
                text: `Ошибка: ${error.message}`
            };
        }
    }, [perimeter, height, rollLength, rollWidth, trimAllowance, rapport, margin, price]);

    return {
        rollLength, setRollLength,
        rollWidth, setRollWidth,
        trimAllowance, setTrimAllowance,
        rapport, setRapport,
        margin, setMargin,
        price, setPrice,
        result
    };
};

// Hook for material selection
export const useMaterialSelection = (materials: SavedMaterial[], category: string) => {
    const handleMaterialSelect = useCallback((material: SavedMaterial) => {
        return material.params;
    }, []);

    const filteredMaterials = useMemo(() => {
        return materials.filter(m => m.category === category);
    }, [materials, category]);

    return {
        filteredMaterials,
        handleMaterialSelect
    };
};

// Hook for room metrics
export const useRoomMetrics = (rooms: any[]) => {
    return useMemo(() => {
        // This will be implemented when we extract the calculation logic
        return {
            totalFloorArea: 0,
            totalPerimeter: 0,
            totalNetWallArea: 0,
            totalDoorWidth: 0,
            totalExclusionPerimeterLength: 0,
            totalDoorPerimeter: 0,
            avgHeight: 0,
            roomCount: 0
        };
    }, [rooms]);
};


