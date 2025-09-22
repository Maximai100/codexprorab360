import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorConfig, CalculatorModuleProps, RoomData, SavedMaterial } from '../../types';
import { CalculatorView } from './CalculatorView';
import { SaveEstimateModal, LoadEstimateModal, MaterialLibraryModal } from './modals';
import { useCalculator } from '../hooks/useCalculator';
import { OfflineIndicator } from './common/OfflineIndicator';
import { AutoSaveIndicator } from './common/AutoSaveIndicator';
import { convertCalculatorToEstimate, createEstimateDescription, createEstimateName } from '../utils/estimateConverter';

const CalculatorModule: React.FC<CalculatorModuleProps> = ({
    config = {},
    initialRooms = [],
    initialMaterials = [],
    className = '',
    style = {},
    readOnly = false,
    showHeader = true,
    showNavigation = true,
    showExportControls = true,
    onCreateEstimate
}) => {
    // Состояние модальных окон
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setLoadModalOpen] = useState(false);
    const [isLibraryOpen, setLibraryOpen] = useState(false);

    // Главный хук калькулятора
    const {
        rooms,
        materials,
        materialResults,
        totalMetrics,
        totalCost,
        calculatorData,
        isLoading,
        error,
        theme,
        savedEstimates,
        addRoom,
        updateRoom,
        deleteRoom,
        setRooms,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        updateMaterialResult,
        saveEstimate,
        loadEstimate,
        deleteEstimate,
        exportData,
        clearError,
        toggleTheme
    } = useCalculator(config);

    // Инициализация данных
    useEffect(() => {
        if (initialRooms.length > 0) {
            setRooms(initialRooms);
        }
    }, [initialRooms, setRooms]);

    useEffect(() => {
        if (initialMaterials.length > 0) {
            // Добавляем начальные материалы
            initialMaterials.forEach(material => {
                if (!materials.find(m => m.id === material.id)) {
                    addMaterial(material);
                }
            });
        }
    }, [initialMaterials, materials, addMaterial]);

    // Обработчики событий
    const handleInputFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const handleThemeChange = useCallback(() => {
        toggleTheme();
    }, [toggleTheme]);

    const themeIcon = useCallback(() => {
        return theme === 'light' ? '🌙' : '☀️';
    }, [theme]);

    const handleSaveEstimate = useCallback((name: string) => {
        try {
            saveEstimate(name);
            setSaveModalOpen(false);
        } catch (err) {
            console.error('Ошибка сохранения сметы:', err);
        }
    }, [saveEstimate]);

    const handleLoadEstimate = useCallback((estimate: SavedEstimate) => {
        try {
            loadEstimate(estimate.id);
            setLoadModalOpen(false);
        } catch (err) {
            console.error('Ошибка загрузки сметы:', err);
        }
    }, [loadEstimate]);

    const handleDeleteEstimate = useCallback((id: number) => {
        try {
            deleteEstimate(id);
        } catch (err) {
            console.error('Ошибка удаления сметы:', err);
        }
    }, [deleteEstimate]);

    const handleSaveMaterial = useCallback((material: SavedMaterial) => {
        try {
            addMaterial(material);
        } catch (err) {
            console.error('Ошибка сохранения материала:', err);
        }
    }, [addMaterial]);

    const handleDeleteMaterial = useCallback((id: number) => {
        try {
            deleteMaterial(id);
        } catch (err) {
            console.error('Ошибка удаления материала:', err);
        }
    }, [deleteMaterial]);

    const handleRoomsChange = useCallback((newRooms: RoomData[]) => {
        setRooms(newRooms);
    }, [setRooms]);

    const handleExport = useCallback((format: string) => {
        try {
            exportData(format);
        } catch (err) {
            console.error('Ошибка экспорта:', err);
        }
    }, [exportData]);

    const handleCreateEstimate = useCallback(() => {
        if (!onCreateEstimate) return;

        const estimateData = {
            rooms,
            materials,
            materialResults,
            totalMetrics,
            totalCost
        };

        const items = convertCalculatorToEstimate(estimateData, {
            includeRoomDetails: true,
            includeMaterialDetails: true
        });

        const clientInfo = createEstimateDescription(estimateData);
        const description = createEstimateDescription(estimateData);

        onCreateEstimate({
            items,
            clientInfo,
            description
        });
    }, [onCreateEstimate, rooms, materials, materialResults, totalMetrics, totalCost]);

    // Обработка ошибок
    useEffect(() => {
        if (error) {
            console.error('Ошибка калькулятора:', error);
        }
    }, [error]);

    return (
        <div className={`calculator-module ${className}`} style={style}>
            {/* Индикаторы состояния */}
            {config.enableOfflineMode && <OfflineIndicator />}
            {config.enableAutoSave && <AutoSaveIndicator />}
            
            {/* Обработка ошибок */}
            {error && (
                <div className="error-banner">
                    <p>Ошибка: {error.message}</p>
                    <button onClick={clearError}>✕</button>
                </div>
            )}
            
            {/* Основной интерфейс калькулятора */}
            <CalculatorView
                rooms={rooms}
                setRooms={handleRoomsChange}
                handleInputFocus={handleInputFocus}
                handleThemeChange={handleThemeChange}
                themeIcon={themeIcon}
                onSaveEstimate={() => setSaveModalOpen(true)}
                onLoadEstimate={() => setLoadModalOpen(true)}
                onOpenLibrary={() => setLibraryOpen(true)}
                onCreateEstimate={onCreateEstimate ? handleCreateEstimate : undefined}
                materials={materials}
                materialResults={materialResults}
                totalMetrics={totalMetrics}
                totalCost={totalCost}
                onExport={handleExport}
                readOnly={readOnly}
                showHeader={showHeader}
                showNavigation={showNavigation}
                showExportControls={showExportControls}
            />
            
            {/* Модальные окна */}
            <SaveEstimateModal 
                isOpen={isSaveModalOpen} 
                onClose={() => setSaveModalOpen(false)} 
                onSave={handleSaveEstimate} 
            />
            
            <LoadEstimateModal 
                isOpen={isLoadModalOpen} 
                onClose={() => setLoadModalOpen(false)} 
                estimates={savedEstimates} 
                onLoad={handleLoadEstimate} 
                onDelete={handleDeleteEstimate} 
            />
            
            <MaterialLibraryModal
                isOpen={isLibraryOpen}
                onClose={() => setLibraryOpen(false)}
                materials={materials}
                onSave={handleSaveMaterial}
                onDelete={handleDeleteMaterial}
            />
        </div>
    );
};

export { CalculatorModule };
export default CalculatorModule;


