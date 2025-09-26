import React, { useEffect } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';
import { useBagCalculation } from '../../hooks/useCalculations';

export const PlasterCalculator: React.FC<MaterialCalculatorProps & { area: number }> = ({ 
    area, 
    name, 
    onResultChange, 
    materials 
}) => {
    const {
        thickness,
        setThickness,
        consumption,
        setConsumption,
        bagWeight,
        setBagWeight,
        margin,
        setMargin,
        price,
        setPrice,
        result
    } = useBagCalculation(area, '0.02', '1.2', '25', '10', '0');

    useEffect(() => {
        onResultChange(name, result);
    }, [result, name, onResultChange]);

    const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        const material = materials.find(m => m.id === matId);
        if (material) {
            setThickness(material.params.thickness || '0.02');
            setConsumption(material.params.consumption || '1.2');
            setBagWeight(material.params.bagWeight || '25');
            setPrice(material.params.price || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="plaster">
            <CalcInput 
                id={`${name}-thickness`} 
                label="Толщина слоя" 
                unit="м" 
                value={thickness} 
                onChange={e => setThickness(e.target.value)} 
                tooltip="Толщина штукатурного слоя в метрах. Обычно 0.01-0.03 м." 
            />
            <CalcInput 
                id={`${name}-consumption`} 
                label="Расход смеси" 
                unit="кг/м²" 
                value={consumption} 
                onChange={e => setConsumption(e.target.value)} 
                tooltip="Расход сухой смеси на квадратный метр при указанной толщине." 
            />
            <CalcInput 
                id={`${name}-bag-weight`} 
                label="Вес мешка" 
                unit="кг" 
                value={bagWeight} 
                onChange={e => setBagWeight(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-margin`} 
                label="Запас" 
                unit="%" 
                value={margin} 
                onChange={e => setMargin(e.target.value)} 
                step="1" 
            />
            <CalcInput 
                id={`${name}-price`} 
                label="Цена за мешок" 
                unit="₽" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
            />
            <div className="calc-result">
                <strong>{result?.text}</strong>
            </div>
            {result?.showNote && (
                <p className="calc-note">
                    Учитывайте потери при нанесении и возможные неровности стен.
                </p>
            )}
        </BaseCalculator>
    );
};


