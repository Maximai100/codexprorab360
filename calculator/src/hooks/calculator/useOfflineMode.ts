import { useState, useEffect, useCallback } from 'react';

interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
}

export const useOfflineMode = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    lastSyncTime: null,
    pendingChanges: 0
  });

  const [pendingData, setPendingData] = useState<any[]>([]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      syncPendingData();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, isOfflineMode: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending data when coming back online
  const syncPendingData = useCallback(async () => {
    if (pendingData.length === 0) return;

    try {
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      }

      // Sync data to localStorage
      for (const data of pendingData) {
        await syncToStorage(data);
      }

      setStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        pendingChanges: 0,
        isOfflineMode: false
      }));

      setPendingData([]);
      console.log('Data synced successfully');
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }, [pendingData]);

  // Save data offline
  const saveOffline = useCallback(async (data: any) => {
    if (status.isOnline) {
      // If online, save directly
      await syncToStorage(data);
      setStatus(prev => ({ ...prev, lastSyncTime: new Date() }));
    } else {
      // If offline, add to pending
      setPendingData(prev => [...prev, data]);
      setStatus(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
    }
  }, [status.isOnline]);

  // Sync to storage (localStorage or IndexedDB)
  const syncToStorage = async (data: any) => {
    try {
      const key = `offline_data_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        synced: false
      }));
    } catch (error) {
      console.error('Failed to save to storage:', error);
      throw error;
    }
  };

  // Get offline data
  const getOfflineData = useCallback(() => {
    const offlineKeys = Object.keys(localStorage).filter(key => key.startsWith('offline_data_'));
    return offlineKeys.map(key => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return null;
      }
    }).filter(Boolean);
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    const offlineKeys = Object.keys(localStorage).filter(key => key.startsWith('offline_data_'));
    offlineKeys.forEach(key => localStorage.removeItem(key));
    setPendingData([]);
    setStatus(prev => ({ ...prev, pendingChanges: 0 }));
  }, []);

  return {
    ...status,
    saveOffline,
    getOfflineData,
    clearOfflineData,
    syncPendingData
  };
};

// Hook for auto-save functionality
export const useAutoSave = (data: any, interval: number = 30000) => {
  const { saveOffline, isOnline } = useOfflineMode();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        setIsSaving(true);
        await saveOffline(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [data, interval, saveOffline]);

  return {
    lastSaved,
    isSaving,
    isOnline
  };
};


