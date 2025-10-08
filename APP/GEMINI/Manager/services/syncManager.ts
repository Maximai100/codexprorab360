import { dbOperations, type SyncOperation } from './db';
import * as directusService from './directus';

class SyncManager {
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  // Sync status
  getSyncStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSync: 0,
      pendingOperations: 0
    };
  }

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  private notifySyncListeners(status: SyncStatus) {
    this.syncListeners.forEach(callback => callback(status));
  }

  // Queue an operation for sync
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
    await dbOperations.addToSyncQueue({
      ...operation,
      timestamp: Date.now()
    });

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingOperations();
    }
  }

  // Sync all pending operations
  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    const queue = await dbOperations.getSyncQueue();
    
    this.notifySyncListeners({
      isSyncing: true,
      lastSync: await dbOperations.getLastSync(),
      pendingOperations: queue.length
    });

    try {
      for (const operation of queue) {
        try {
          await this.processOperation(operation);
          // Remove from queue after successful sync
          if (operation.id) {
            await dbOperations.removeSyncOperation(operation.id);
          }
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
          // Keep in queue for retry
        }
      }

      // Update last sync timestamp
      await dbOperations.setLastSync(Date.now());

      // Fetch latest data from server
      await this.fetchLatestData();

    } finally {
      this.isSyncing = false;
      const remainingQueue = await dbOperations.getSyncQueue();
      
      this.notifySyncListeners({
        isSyncing: false,
        lastSync: await dbOperations.getLastSync(),
        pendingOperations: remainingQueue.length
      });
    }
  }

  // Process a single sync operation
  private async processOperation(operation: SyncOperation): Promise<void> {
    const { type, collection, itemId, data } = operation;

    if (collection === 'owners') {
      switch (type) {
        case 'create':
          await directusService.createOwner(data);
          break;
        case 'update':
          await directusService.updateOwner(itemId, data);
          break;
        case 'delete':
          await directusService.deleteOwner(itemId);
          break;
      }
    } else if (collection === 'projects') {
      switch (type) {
        case 'create':
          await directusService.createProject(data);
          break;
        case 'update':
          await directusService.updateProject(itemId, data);
          break;
        case 'delete':
          await directusService.deleteProject(itemId);
          break;
      }
    }
  }

  // Fetch latest data from server and update local DB
  private async fetchLatestData(): Promise<void> {
    try {
      // Fetch owners
      const owners = await directusService.fetchOwners();
      if (owners) {
        await dbOperations.bulkPutOwners(owners);
      }

      // Fetch projects
      const projects = await directusService.fetchProjects();
      if (projects) {
        await dbOperations.bulkPutProjects(projects);
      }
    } catch (error) {
      console.error('Failed to fetch latest data:', error);
    }
  }

  // Resolve conflicts (simple last-write-wins strategy)
  resolveConflict(local: any, remote: any): any {
    // Compare timestamps if available
    const localTime = local.updated_at || local.date_updated || 0;
    const remoteTime = remote.updated_at || remote.date_updated || 0;

    // Return the most recent version
    return remoteTime > localTime ? remote : local;
  }

  // Register background sync (if supported)
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-data');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  // Initialize sync manager
  async initialize(): Promise<void> {
    // Register background sync
    await this.registerBackgroundSync();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online, syncing...');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline');
    });

    // Sync on page load if online
    if (navigator.onLine) {
      this.syncPendingOperations();
    }
  }
}

// Sync status interface
export interface SyncStatus {
  isSyncing: boolean;
  lastSync: number;
  pendingOperations: number;
}

// Export singleton instance
export const syncManager = new SyncManager();

// Helper functions for Directus operations (to be implemented in directus.ts)
declare module './directus' {
  export function createOwner(data: any): Promise<any>;
  export function updateOwner(id: string, data: any): Promise<any>;
  export function deleteOwner(id: string): Promise<any>;
  export function fetchOwners(): Promise<any[]>;
  export function createProject(data: any): Promise<any>;
  export function updateProject(id: string, data: any): Promise<any>;
  export function deleteProject(id: string): Promise<any>;
  export function fetchProjects(): Promise<any[]>;
}
