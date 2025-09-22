import React, { useCallback } from 'react';
import { MaterialCalculatorProps, SavedMaterial } from '../../types';
import { CalcInput } from './CalcInput';

interface BaseCalculatorProps extends MaterialCalculatorProps {
    children: React.ReactNode;
    category: string;
}

export const BaseCalculator: React.FC<BaseCalculatorProps> = ({ 
    name, 
    materials, 
    onResultChange, 
    category,
    children 
}) => {
    const handleMaterialSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        
        const material = materials.find(m => m.id === matId);
        if (material) {
            // This will be handled by individual calculators
            // They can override this behavior
            console.log('Material selected:', material);
        }
    }, [materials]);

    const filteredMaterials = materials.filter(m => m.category === category);

    return (
        <div className="card material-calculator-card">
            <h4>{name}</h4>
            <div className="library-select-group">
                <label htmlFor={`${name}-library`}>Выбрать из библиотеки</label>
                <select id={`${name}-library`} onChange={handleMaterialSelect}>
                    <option value="">Свой материал</option>
                    {filteredMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>
            </div>
            {children}
        </div>
    );
};

interface MaterialSelectorProps {
    materials: SavedMaterial[];
    category: string;
    onSelect: (material: SavedMaterial) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ 
    materials, 
    category, 
    onSelect 
}) => {
    const handleSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const matId = parseInt(e.target.value, 10);
        if (!matId) return;
        
        const material = materials.find(m => m.id === matId);
        if (material) {
            onSelect(material);
        }
    }, [materials, onSelect]);

    const filteredMaterials = materials.filter(m => m.category === category);

    return (
        <div className="library-select-group">
            <label htmlFor={`material-select-${category}`}>Выбрать из библиотеки</label>
            <select id={`material-select-${category}`} onChange={handleSelect}>
                <option value="">Свой материал</option>
                {filteredMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                        {m.name}
                    </option>
                ))}
            </select>
        </div>
    );
};


