import React, { useState, useCallback } from 'react';
import { CalculatorModule } from '../calculator/components/CalculatorModule';
import { type CalculatorConfig } from '../calculator/types';
import { IconChevronLeft } from '../common/Icon';
import { useEstimates } from '../../hooks/useEstimates';
import { useAppState } from '../../hooks/useAppState';

interface CalculatorViewProps {
    onBack: () => void;
}

const CalculatorView: React.FC<CalculatorViewProps> = ({ onBack }) => {
    const [rooms, setRooms] = useState([]);
    const [materials, setMaterials] = useState([]);
    const appState = useAppState();
    const estimatesHook = useEstimates(null); // Временно передаем null для session

    const config: CalculatorConfig = {
        theme: 'light',
        enableOfflineMode: true,
        enableAutoSave: true,
        enableExport: true,
        onDataChange: (newRooms, newMaterials) => {
            console.log('Данные калькулятора изменились:', { newRooms, newMaterials });
            setRooms(newRooms);
            setMaterials(newMaterials);
        },
        onExport: (format, data) => {
            console.log('Экспорт калькулятора:', format, data);
        }
    };

    const handleCreateEstimate = useCallback((estimateData: {
        items: any[];
        clientInfo: string;
        description: string;
        projectId?: string | null;
    }) => {
        try {
            // Создаем новую смету
            const newEstimate = estimatesHook.createNewEstimate(estimateData.projectId);
            
            // Устанавливаем данные из калькулятора
            estimatesHook.setClientInfo(estimateData.clientInfo);
            estimatesHook.setItems(estimateData.items);
            
            // Переходим к смете
            appState.navigateToView('estimate');
            
            console.log('Смета создана из калькулятора:', newEstimate);
        } catch (error) {
            console.error('Ошибка при создании сметы из калькулятора:', error);
        }
    }, [estimatesHook, appState]);

    const handleInputFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
        // Предотвращаем автоматическое масштабирование на мобильных устройствах
        if (e.target instanceof HTMLInputElement) {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    return (
        <div className="calculator-view">
            <div className="calculator-header">
                <button 
                    onClick={onBack} 
                    className="back-button"
                    aria-label="Назад"
                >
                    <IconChevronLeft />
                    <span>Назад</span>
                </button>
                <h1>Калькулятор строительных материалов</h1>
            </div>
            
            <div className="calculator-content">
                <CalculatorModule 
                    config={config}
                    className="prorab-calculator"
                    onInputFocus={handleInputFocus}
                    onCreateEstimate={handleCreateEstimate}
                />
            </div>
        </div>
    );
};

export { CalculatorView };
