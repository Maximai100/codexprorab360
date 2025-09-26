import React, { useEffect } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';
import { useWallpaperCalculation } from '../../hooks/useCalculations';

export const WallpaperCalculator: React.FC<MaterialCalculatorProps & { perimeter: number, height: number }> = ({ 
    perimeter, 
    height, 
    name, 
    onResultChange, 
    materials 
}) => {
    const {
        rollLength,
        setRollLength,
        rollWidth,
        setRollWidth,
        trimAllowance,
        setTrimAllowance,
        rapport,
        setRapport,
        margin,
        setMargin,
        price,
        setPrice,
        result
    } = useWallpaperCalculation(
        perimeter,
        height,
        '10.05',
        '1.06',
        '10',
        '0',
        '5',
        '0'
    );

    useEffect(() => {
        onResultChange(name, result);
    }, [result, name, onResultChange]);

    const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        const material = materials.find(m => m.id === matId);
        if (material) {
            setRollLength(material.params.rollLength || '10.05');
            setRollWidth(material.params.rollWidth || '1.06');
            setRapport(material.params.rapport || '0');
            setPrice(material.params.price || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="wallpaper">
            <CalcInput 
                id={`${name}-roll-length`} 
                label="Длина рулона" 
                unit="м" 
                value={rollLength} 
                onChange={e => setRollLength(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-roll-width`} 
                label="Ширина рулона" 
                unit="м" 
                value={rollWidth} 
                onChange={e => setRollWidth(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-trim`} 
                label="Припуск на подрезку" 
                unit="см" 
                value={trimAllowance} 
                onChange={e => setTrimAllowance(e.target.value)} 
                tooltip="Общий припуск на одну полосу для выравнивания (сверху и снизу). Стандартно 5-10 см." 
            />
            <CalcInput 
                id={`${name}-rapport`} 
                label="Раппорт (повтор рисунка)" 
                unit="см" 
                value={rapport} 
                onChange={e => setRapport(e.target.value)} 
                tooltip="Укажите 0, если рисунок не нужно совмещать." 
            />
            <CalcInput 
                id={`${name}-margin`} 
                label="Доп. запас" 
                unit="%" 
                value={margin} 
                onChange={e => setMargin(e.target.value)} 
                step="1" 
            />
            <CalcInput 
                id={`${name}-price`} 
                label="Цена за рулон" 
                unit="₽" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
            />
            <div className="calc-result">
                <strong>{result?.text}</strong>
            </div>
            {result?.showNote && (
                <p className="calc-note">
                    Учитывайте сложность рисунка и возможные ошибки при поклейке.
                </p>
            )}
        </BaseCalculator>
    );
};


