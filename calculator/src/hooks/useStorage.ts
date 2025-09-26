import { useState, useEffect, useCallback } from 'react';
import { SavedEstimate, SavedMaterial, RoomData } from '../types';
import { safeLocalStorage } from '../utils/calculations';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = safeLocalStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            safeLocalStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
};

export const useSavedEstimates = () => {
    const [savedEstimates, setSavedEstimates] = useLocalStorage<SavedEstimate[]>('savedEstimates', []);

    const saveEstimate = useCallback((name: string, rooms: RoomData[]) => {
        const newEstimate: SavedEstimate = {
            id: Date.now(),
            name,
            date: new Date().toISOString(),
            rooms
        };
        
        setSavedEstimates(prev => [...prev, newEstimate]);
        return newEstimate;
    }, [setSavedEstimates]);

    const loadEstimate = useCallback((id: number) => {
        const estimate = savedEstimates.find(est => est.id === id);
        if (estimate) {
            return estimate.rooms;
        }
        return null;
    }, [savedEstimates]);

    const deleteEstimate = useCallback((id: number) => {
        setSavedEstimates(prev => prev.filter(est => est.id !== id));
    }, [setSavedEstimates]);

    return {
        savedEstimates,
        saveEstimate,
        loadEstimate,
        deleteEstimate
    };
};

export const useSavedMaterials = () => {
    const [savedMaterials, setSavedMaterials] = useLocalStorage<SavedMaterial[]>('savedMaterials', []);

    const saveMaterial = useCallback((material: Omit<SavedMaterial, 'id'>) => {
        const newMaterial: SavedMaterial = {
            ...material,
            id: Date.now()
        };
        
        setSavedMaterials(prev => [...prev, newMaterial]);
        return newMaterial;
    }, [setSavedMaterials]);

    const deleteMaterial = useCallback((id: number) => {
        setSavedMaterials(prev => prev.filter(mat => mat.id !== id));
    }, [setSavedMaterials]);

    return {
        savedMaterials,
        saveMaterial,
        deleteMaterial
    };
};

export const useAutoSave = (rooms: RoomData[]) => {
    useEffect(() => {
        const autosaveData = { rooms, timestamp: Date.now() };
        try {
            safeLocalStorage.setItem('autosavedRooms', JSON.stringify(autosaveData));
        } catch (error) {
            console.error('Failed to autosave:', error);
        }
    }, [rooms]);

    const loadAutoSave = useCallback(() => {
        try {
            const autosaveData = safeLocalStorage.getItem('autosavedRooms');
            if (autosaveData) {
                const parsed = JSON.parse(autosaveData);
                const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24 hours
                if (isRecent) {
                    return parsed.rooms;
                }
            }
        } catch (error) {
            console.error('Failed to load autosave:', error);
        }
        return null;
    }, []);

    const clearAutoSave = useCallback(() => {
        try {
            safeLocalStorage.removeItem('autosavedRooms');
        } catch (error) {
            console.error('Failed to clear autosave:', error);
        }
    }, []);

    return {
        loadAutoSave,
        clearAutoSave
    };
};


