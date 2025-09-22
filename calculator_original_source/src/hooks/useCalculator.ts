import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RoomData, 
  SavedMaterial, 
  CalculatorConfig, 
  CalculatorData, 
  MaterialResult,
  TotalCalculations,
  CalculatorError
} from '../../types/calculator';
import { calculateTotalMetrics } from '../../utils/calculator/calculations';
import { useTheme } from './useTheme';
import { useSavedEstimates, useSavedMaterials, useAutoSave } from './useStorage';

export const useCalculator = (config?: CalculatorConfig) => {
  // Основное состояние
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);
  const [materialResults, setMaterialResults] = useState<Record<string, MaterialResult | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CalculatorError | null>(null);

  // Хуки
  const { theme, toggleTheme } = useTheme();
  const { savedEstimates, saveEstimate, loadEstimate, deleteEstimate } = useSavedEstimates();
  const { savedMaterials, saveMaterial, deleteMaterial } = useSavedMaterials();
  const { loadAutoSave, clearAutoSave } = useAutoSave(rooms);

  // Вычисляемые значения
  const totalMetrics = useMemo(() => {
    return calculateTotalMetrics(rooms);
  }, [rooms]);

  const totalCost = useMemo(() => {
    return Object.values(materialResults).reduce((sum, result) => {
      return sum + (result?.cost || 0);
    }, 0);
  }, [materialResults]);

  const calculatorData: CalculatorData = useMemo(() => ({
    rooms,
    materials,
    totalMetrics,
    materialResults,
    totalCost,
    lastUpdated: new Date().toISOString()
  }), [rooms, materials, totalMetrics, materialResults, totalCost]);

  // Инициализация
  useEffect(() => {
    if (config?.customMaterials && config.customMaterials.length > 0) {
      config.customMaterials.forEach(material => {
        if (!savedMaterials.find(m => m.id === material.id)) {
          saveMaterial(material);
        }
      });
    }
  }, [config?.customMaterials, savedMaterials, saveMaterial]);

  // Автосохранение
  useEffect(() => {
    if (config?.enableAutoSave && rooms.length > 0) {
      try {
        localStorage.setItem('calculator_autosave', JSON.stringify({
          rooms,
          materials,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('Не удалось сохранить данные:', err);
      }
    }
  }, [rooms, materials, config?.enableAutoSave]);

  // Обработчики комнат
  const addRoom = useCallback((room: RoomData) => {
    setRooms(prev => [...prev, room]);
    config?.onRoomAdded?.(room);
    config?.onDataChange?.(calculatorData);
  }, [config, calculatorData]);

  const updateRoom = useCallback((updatedRoom: RoomData) => {
    setRooms(prev => prev.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
    config?.onRoomUpdated?.(updatedRoom);
    config?.onDataChange?.(calculatorData);
  }, [config, calculatorData]);

  const deleteRoom = useCallback((roomId: number) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    config?.onRoomDeleted?.(roomId);
    config?.onDataChange?.(calculatorData);
  }, [config, calculatorData]);

  const updateRooms = useCallback((newRooms: RoomData[]) => {
    setRooms(newRooms);
    config?.onDataChange?.(calculatorData);
  }, [config, calculatorData]);

  // Обработчики материалов
  const addMaterial = useCallback((material: SavedMaterial) => {
    const newMaterial = saveMaterial(material);
    setMaterials(prev => [...prev, newMaterial]);
    config?.onMaterialAdded?.(newMaterial);
    config?.onDataChange?.(calculatorData);
  }, [saveMaterial, config, calculatorData]);

  const updateMaterial = useCallback((updatedMaterial: SavedMaterial) => {
    saveMaterial(updatedMaterial);
    setMaterials(prev => prev.map(material => 
      material.id === updatedMaterial.id ? updatedMaterial : material
    ));
    config?.onMaterialUpdated?.(updatedMaterial);
    config?.onDataChange?.(calculatorData);
  }, [saveMaterial, config, calculatorData]);

  const removeMaterial = useCallback((materialId: number) => {
    deleteMaterial(materialId);
    setMaterials(prev => prev.filter(material => material.id !== materialId));
    config?.onMaterialDeleted?.(materialId);
    config?.onDataChange?.(calculatorData);
  }, [deleteMaterial, config, calculatorData]);

  // Обработчики результатов материалов
  const updateMaterialResult = useCallback((name: string, result: MaterialResult | null) => {
    setMaterialResults(prev => ({
      ...prev,
      [name]: result
    }));
  }, []);

  // Обработчики смет
  const saveEstimateData = useCallback((name: string) => {
    try {
      const estimate = saveEstimate(name, rooms);
      return estimate;
    } catch (err) {
      const error = new CalculatorError('Не удалось сохранить смету', 'SAVE_ERROR');
      setError(error);
      config?.onError?.(error);
      throw error;
    }
  }, [saveEstimate, rooms, config]);

  const loadEstimateData = useCallback((estimateId: number) => {
    try {
      const roomsData = loadEstimate(estimateId);
      if (roomsData) {
        setRooms(roomsData);
        return roomsData;
      }
      throw new CalculatorError('Смета не найдена', 'LOAD_ERROR');
    } catch (err) {
      const error = err instanceof CalculatorError ? err : new CalculatorError('Не удалось загрузить смету', 'LOAD_ERROR');
      setError(error);
      config?.onError?.(error);
      throw error;
    }
  }, [loadEstimate, config]);

  const deleteEstimateData = useCallback((estimateId: number) => {
    try {
      deleteEstimate(estimateId);
    } catch (err) {
      const error = new CalculatorError('Не удалось удалить смету', 'DELETE_ERROR');
      setError(error);
      config?.onError?.(error);
      throw error;
    }
  }, [deleteEstimate, config]);

  // Обработчик экспорта
  const exportData = useCallback((format: string) => {
    try {
      const exportData = {
        ...calculatorData,
        format,
        exportedAt: new Date().toISOString()
      };
      
      config?.onExport?.(format, exportData);
      return exportData;
    } catch (err) {
      const error = new CalculatorError('Не удалось экспортировать данные', 'EXPORT_ERROR');
      setError(error);
      config?.onError?.(error);
      throw error;
    }
  }, [calculatorData, config]);

  // Загрузка автосохранения
  const loadAutoSaveData = useCallback(() => {
    try {
      const autoSaveData = loadAutoSave();
      if (autoSaveData) {
        setRooms(autoSaveData);
        return autoSaveData;
      }
    } catch (err) {
      console.warn('Не удалось загрузить автосохранение:', err);
    }
    return null;
  }, [loadAutoSave]);

  // Очистка данных
  const clearData = useCallback(() => {
    setRooms([]);
    setMaterials([]);
    setMaterialResults({});
    clearAutoSave();
  }, [clearAutoSave]);

  // Обработка ошибок
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Состояние
    rooms,
    materials,
    materialResults,
    totalMetrics,
    totalCost,
    calculatorData,
    isLoading,
    error,
    theme,
    
    // Сметы
    savedEstimates,
    
    // Действия с комнатами
    addRoom,
    updateRoom,
    deleteRoom,
    setRooms: updateRooms,
    
    // Действия с материалами
    addMaterial,
    updateMaterial,
    deleteMaterial: removeMaterial,
    setMaterials,
    
    // Результаты материалов
    updateMaterialResult,
    
    // Сметы
    saveEstimate: saveEstimateData,
    loadEstimate: loadEstimateData,
    deleteEstimate: deleteEstimateData,
    
    // Экспорт
    exportData,
    
    // Автосохранение
    loadAutoSave: loadAutoSaveData,
    clearAutoSave,
    
    // Утилиты
    clearData,
    clearError,
    toggleTheme
  };
};
