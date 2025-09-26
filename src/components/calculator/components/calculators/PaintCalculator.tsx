import React, { useEffect } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';
import { usePaintCalculation } from '../../hooks/useCalculations';

export const PaintCalculator: React.FC<MaterialCalculatorProps & { wallArea: number, floorArea: number }> = ({ 
    wallArea, 
    floorArea, 
    name, 
    onResultChange, 
    materials 
}) => {
    const [surface, setSurface] = React.useState<'walls' | 'ceiling'>('walls');
    
    const {
        consumption,
        setConsumption,
        layers,
        setLayers,
        volume,
        setVolume,
        margin,
        setMargin,
        price,
        setPrice,
        result
    } = usePaintCalculation(
        surface === 'walls' ? wallArea : floorArea,
        '0.15',
        '2',
        '5',
        '10',
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
            setConsumption(material.params.consumption || '0.15');
            setVolume(material.params.volume || '5');
            setPrice(material.params.price || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="paint">
            <div className="toggle-switch">
                <button 
                    onClick={() => setSurface('walls')} 
                    className={surface === 'walls' ? 'active' : ''}
                >
                    Стены
                </button>
                <button 
                    onClick={() => setSurface('ceiling')} 
                    className={surface === 'ceiling' ? 'active' : ''}
                >
                    Потолок
                </button>
            </div>
            <CalcInput 
                id={`${name}-consumption`} 
                label="Расход материала" 
                unit="л/м²" 
                value={consumption} 
                onChange={e => setConsumption(e.target.value)} 
                tooltip="Обычно 0.1-0.2 л/м² на один слой. Уточните на банке." 
            />
            <CalcInput 
                id={`${name}-layers`} 
                label="Количество слоев" 
                unit="шт." 
                value={layers} 
                onChange={e => setLayers(e.target.value)} 
                step="1" 
            />
            <CalcInput 
                id={`${name}-volume`} 
                label="Объем тары" 
                unit="л" 
                value={volume} 
                onChange={e => setVolume(e.target.value)} 
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
                label="Цена за банку" 
                unit="₽" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
            />
            <div className="calc-result">
                <strong>{result?.text}</strong>
            </div>
            {result?.showNote && (
                <p className="calc-note">
                    Учитывайте впитывающую способность поверхности и качество инструмента.
                </p>
            )}
        </BaseCalculator>
    );
};


