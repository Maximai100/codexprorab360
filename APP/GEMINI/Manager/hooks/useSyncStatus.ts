import { useState, useEffect } from 'react';
import { syncManager, type SyncStatus } from '../services/syncManager';

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSync: 0,
    pendingOperations: 0
  });

  useEffect(() => {
    const unsubscribe = syncManager.onSyncStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  return syncStatus;
}
