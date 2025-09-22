import React, { useEffect, useMemo } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';

export const DrywallCalculator: React.FC<MaterialCalculatorProps & { 
    wallArea: number, 
    floorArea: number, 
    perimeter: number 
}> = ({ 
    wallArea, 
    floorArea, 
    perimeter, 
    name, 
    onResultChange, 
    materials 
}) => {
    const [profileType, setProfileType] = useState<'wall' | 'ceiling'>('wall');
    const [profileSpacing, setProfileSpacing] = useState('0.6');
    const [sheetSize, setSheetSize] = useState('1.2');
    const [sheetHeight, setSheetHeight] = useState('2.5');
    const [margin, setMargin] = useState('10');
    const [profilePrice, setProfilePrice] = useState('0');
    const [sheetPrice, setSheetPrice] = useState('0');

    const result = useMemo(() => {
        const area = profileType === 'wall' ? wallArea : floorArea;
        const nProfileSpacing = parseFloat(profileSpacing.replace(',', '.')) || 0.6;
        const nSheetSize = parseFloat(sheetSize.replace(',', '.')) || 1.2;
        const nSheetHeight = parseFloat(sheetHeight.replace(',', '.')) || 2.5;
        const nMargin = parseInt(margin, 10) || 0;
        const nProfilePrice = parseFloat(profilePrice.replace(',', '.')) || 0;
        const nSheetPrice = parseFloat(sheetPrice.replace(',', '.')) || 0;

        if (area === 0 || nProfileSpacing === 0 || nSheetSize === 0 || nSheetHeight === 0) return null;

        // Calculate profiles needed
        const profilesNeeded = Math.ceil(perimeter / nProfileSpacing) * (1 + nMargin / 100);
        const profilesCost = profilesNeeded * nProfilePrice;

        // Calculate sheets needed
        const sheetsNeeded = Math.ceil(area / (nSheetSize * nSheetHeight)) * (1 + nMargin / 100);
        const sheetsCost = sheetsNeeded * nSheetPrice;

        const totalCost = profilesCost + sheetsCost;

        const quantityText = `${Math.ceil(profilesNeeded)} профилей + ${Math.ceil(sheetsNeeded)} листов`;
        const costText = totalCost > 0 ? `\nОбщая стоимость: ${totalCost.toFixed(2)} ₽` : '';

        return {
            quantity: quantityText,
            cost: totalCost,
            details: {
                "Профили": `${Math.ceil(profilesNeeded)} шт.`,
                "Листы": `${Math.ceil(sheetsNeeded)} шт.`,
                "Стоимость профилей": `${profilesCost.toFixed(2)} ₽`,
                "Стоимость листов": `${sheetsCost.toFixed(2)} ₽`,
                "Общая стоимость": `${totalCost.toFixed(2)} ₽`
            },
            showNote: profilesNeeded > 0 || sheetsNeeded > 0,
            text: quantityText + costText,
        };
    }, [wallArea, floorArea, perimeter, profileType, profileSpacing, sheetSize, sheetHeight, margin, profilePrice, sheetPrice]);

    useEffect(() => {
        onResultChange(name, result);
    }, [result, name, onResultChange]);

    const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        const material = materials.find(m => m.id === matId);
        if (material) {
            setProfileSpacing(material.params.profileSpacing || '0.6');
            setSheetSize(material.params.sheetSize || '1.2');
            setSheetHeight(material.params.sheetHeight || '2.5');
            setProfilePrice(material.params.profilePrice || '0');
            setSheetPrice(material.params.sheetPrice || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="drywall">
            <div className="toggle-switch">
                <button 
                    onClick={() => setProfileType('wall')} 
                    className={profileType === 'wall' ? 'active' : ''}
                >
                    Стены
                </button>
                <button 
                    onClick={() => setProfileType('ceiling')} 
                    className={profileType === 'ceiling' ? 'active' : ''}
                >
                    Потолок
                </button>
            </div>
            <CalcInput 
                id={`${name}-profile-spacing`} 
                label="Шаг профилей" 
                unit="м" 
                value={profileSpacing} 
                onChange={e => setProfileSpacing(e.target.value)} 
                tooltip="Расстояние между профилями каркаса. Обычно 0.4-0.6 м." 
            />
            <CalcInput 
                id={`${name}-sheet-size`} 
                label="Ширина листа" 
                unit="м" 
                value={sheetSize} 
                onChange={e => setSheetSize(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-sheet-height`} 
                label="Высота листа" 
                unit="м" 
                value={sheetHeight} 
                onChange={e => setSheetHeight(e.target.value)} 
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
                id={`${name}-profile-price`} 
                label="Цена профиля за м" 
                unit="₽" 
                value={profilePrice} 
                onChange={e => setProfilePrice(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-sheet-price`} 
                label="Цена листа" 
                unit="₽" 
                value={sheetPrice} 
                onChange={e => setSheetPrice(e.target.value)} 
            />
            <div className="calc-result">
                <strong>{result?.text}</strong>
            </div>
            {result?.showNote && (
                <p className="calc-note">
                    Учитывайте дополнительные элементы: подвесы, саморезы, ленты.
                </p>
            )}
        </BaseCalculator>
    );
};


