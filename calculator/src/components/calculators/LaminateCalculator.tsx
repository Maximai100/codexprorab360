import React, { useEffect, useMemo } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';

export const LaminateCalculator: React.FC<MaterialCalculatorProps & { floorArea: number }> = ({ 
    floorArea, 
    name, 
    onResultChange, 
    materials 
}) => {
    const [packArea, setPackArea] = useState('2.13');
    const [margin, setMargin] = useState('5');
    const [direction, setDirection] = useState<'along' | 'across'>('along');
    const [price, setPrice] = useState('0');

    useEffect(() => {
        setMargin(direction === 'along' ? '5' : '10');
    }, [direction]);

    const result = useMemo(() => {
        const nFloorArea = floorArea || 0;
        const nPackArea = parseFloat(packArea.replace(',', '.')) || 1;
        const nMargin = parseInt(margin, 10) || 0;
        const nPrice = parseFloat(price.replace(',', '.')) || 0;

        if (nFloorArea === 0 || nPackArea === 0) return null;

        const totalAreaNeeded = nFloorArea * (1 + nMargin / 100);
        const packs = Math.ceil(totalAreaNeeded / nPackArea);
        const totalCost = packs * nPrice;

        const quantityText = `${packs} упаковок (${totalAreaNeeded.toFixed(2)} м²)`;
        const costText = nPrice > 0 ? `\nОбщая стоимость: ${totalCost.toFixed(2)} ₽` : '';

        return {
            quantity: quantityText,
            cost: totalCost,
            details: {
                "Упаковок": `${packs} шт.`,
                "Площадь": `${totalAreaNeeded.toFixed(2)} м²`,
                "Цена за упаковку": `${nPrice.toFixed(2)} ₽`,
                "Общая стоимость": `${totalCost.toFixed(2)} ₽`
            },
            showNote: packs > 0,
            text: quantityText + costText,
        };
    }, [floorArea, packArea, margin, price]);

    useEffect(() => {
        onResultChange(name, result);
    }, [result, name, onResultChange]);

    const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        const material = materials.find(m => m.id === matId);
        if (material) {
            setPackArea(material.params.packArea || '2.13');
            setPrice(material.params.price || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="flooring">
            <div className="toggle-switch">
                <button 
                    onClick={() => setDirection('along')} 
                    className={direction === 'along' ? 'active' : ''}
                >
                    Прямая укладка
                </button>
                <button 
                    onClick={() => setDirection('across')} 
                    className={direction === 'across' ? 'active' : ''}
                >
                    Диагональная укладка
                </button>
            </div>
            <CalcInput 
                id={`${name}-packarea`} 
                label="Площадь в упаковке" 
                unit="м²" 
                value={packArea} 
                onChange={e => setPackArea(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-margin`} 
                label="Запас на подрезку" 
                unit="%" 
                value={margin} 
                onChange={e => setMargin(e.target.value)} 
                step="1" 
                tooltip="Рекомендуемый запас: 5-7% для прямой укладки, 10-15% для диагональной." 
            />
            <CalcInput 
                id={`${name}-price`} 
                label="Цена за упаковку" 
                unit="₽" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
            />
            <div className="calc-result">
                <strong>{result?.text}</strong>
            </div>
            {result?.showNote && (
                <p className="calc-note">
                    Не забудьте про подложку и плинтусы.
                </p>
            )}
        </BaseCalculator>
    );
};


