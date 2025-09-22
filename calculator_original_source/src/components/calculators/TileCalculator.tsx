import React, { useEffect, useMemo } from 'react';
import { MaterialCalculatorProps } from '../../types';
import { BaseCalculator } from '../common/BaseCalculator';
import { CalcInput } from '../common/CalcInput';

export const TileCalculator: React.FC<MaterialCalculatorProps & { wallArea: number, floorArea: number }> = ({ 
    wallArea, 
    floorArea, 
    name, 
    onResultChange, 
    materials 
}) => {
    const [surface, setSurface] = useState<'walls' | 'floor'>('walls');
    const [tileWidth, setTileWidth] = useState('30');
    const [tileHeight, setTileHeight] = useState('60');
    const [groutWidth, setGroutWidth] = useState('2');
    const [margin, setMargin] = useState('10');
    const [pattern, setPattern] = useState<'straight' | 'diagonal'>('straight');
    const [packSize, setPackSize] = useState('10');
    const [price, setPrice] = useState('0');

    useEffect(() => {
        setMargin(pattern === 'straight' ? '10' : '15');
    }, [pattern]);

    const result = useMemo(() => {
        const area = surface === 'walls' ? wallArea : floorArea;
        const nTileWidthM = (parseFloat(tileWidth.replace(',', '.')) || 0) / 100;
        const nTileHeightM = (parseFloat(tileHeight.replace(',', '.')) || 0) / 100;
        const nGroutWidthM = (parseFloat(groutWidth.replace(',', '.')) || 0) / 1000;
        const nMargin = parseInt(margin, 10) || 0;
        const nPackSize = parseInt(packSize, 10) || 1;
        const nPrice = parseFloat(price.replace(',', '.')) || 0;
        
        if (area === 0 || nTileWidthM === 0 || nTileHeightM === 0) return null;
        
        const tileAreaWithGrout = (nTileWidthM + nGroutWidthM) * (nTileHeightM + nGroutWidthM);
        if (tileAreaWithGrout === 0) return null;

        const totalAreaNeeded = area * (1 + nMargin / 100);
        const totalTiles = Math.ceil(totalAreaNeeded / tileAreaWithGrout);
        const totalPacks = Math.ceil(totalTiles / nPackSize);
        const totalCost = totalPacks * nPrice;

        const quantityText = `≈ ${totalTiles} плиток / ${totalPacks} уп. (${totalAreaNeeded.toFixed(2)} м²)`;
        const costText = nPrice > 0 ? `\nОбщая стоимость: ${totalCost.toFixed(2)} ₽` : '';
        
        return {
            quantity: quantityText,
            cost: totalCost,
            details: {
                "Плиток": `${totalTiles} шт.`,
                "Упаковок": `${totalPacks} шт.`,
                "Площадь": `${totalAreaNeeded.toFixed(2)} м²`,
                "Стоимость": `${totalCost.toFixed(2)} ₽`
            },
            showNote: totalTiles > 0,
            text: quantityText + costText,
        };
    }, [wallArea, floorArea, surface, tileWidth, tileHeight, groutWidth, margin, packSize, price]);

    useEffect(() => {
        onResultChange(name, result);
    }, [result, name, onResultChange]);

    const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        const material = materials.find(m => m.id === matId);
        if (material) {
            setTileWidth(material.params.tileWidth || '30');
            setTileHeight(material.params.tileHeight || '60');
            setPackSize(material.params.packSize || '10');
            setPrice(material.params.price || '0');
        }
    };

    return (
        <BaseCalculator name={name} materials={materials} onResultChange={onResultChange} category="tile">
            <div className="toggle-switch">
                <button 
                    onClick={() => setSurface('walls')} 
                    className={surface === 'walls' ? 'active' : ''}
                >
                    Стены
                </button>
                <button 
                    onClick={() => setSurface('floor')} 
                    className={surface === 'floor' ? 'active' : ''}
                >
                    Пол
                </button>
            </div>
            <div className="toggle-switch">
                <button 
                    onClick={() => setPattern('straight')} 
                    className={pattern === 'straight' ? 'active' : ''}
                >
                    Прямая укладка
                </button>
                <button 
                    onClick={() => setPattern('diagonal')} 
                    className={pattern === 'diagonal' ? 'active' : ''}
                >
                    Диагональная укладка
                </button>
            </div>
            <div className="tile-inputs-grid">
                <CalcInput 
                    id={`${name}-tile-width`} 
                    label="Ширина плитки" 
                    unit="см" 
                    value={tileWidth} 
                    onChange={e => setTileWidth(e.target.value)} 
                />
                <CalcInput 
                    id={`${name}-tile-height`} 
                    label="Высота плитки" 
                    unit="см" 
                    value={tileHeight} 
                    onChange={e => setTileHeight(e.target.value)} 
                />
            </div>
            <CalcInput 
                id={`${name}-grout-width`} 
                label="Ширина шва" 
                unit="мм" 
                value={groutWidth} 
                onChange={e => setGroutWidth(e.target.value)} 
            />
            <CalcInput 
                id={`${name}-margin`} 
                label="Запас на подрезку" 
                unit="%" 
                value={margin} 
                onChange={e => setMargin(e.target.value)} 
                step="1" 
                tooltip="Рекомендуемый запас: 10% для прямой укладки, 15% для диагональной." 
            />
            <CalcInput 
                id={`${name}-pack-size`} 
                label="Плиток в упаковке" 
                unit="шт." 
                value={packSize} 
                onChange={e => setPackSize(e.target.value)} 
                step="1" 
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
                    Не забудьте про затирку для швов и клей для плитки.
                </p>
            )}
        </BaseCalculator>
    );
};


