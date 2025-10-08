import Dexie, { Table } from 'dexie';
import type { Owner } from '../types';
import type { Project } from '../types/manager';

// Sync operation types
export interface SyncOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  collection: 'owners' | 'projects';
  itemId: string;
  data: any;
  timestamp: number;
}

// Metadata for tracking sync state
export interface AppMetadata {
  key: string;
  value: any;
}

// Database class
export class AppDatabase extends Dexie {
  owners!: Table<Owner, string>;
  projects!: Table<Project, string>;
  syncQueue!: Table<SyncOperation, number>;
  metadata!: Table<AppMetadata, string>;

  constructor() {
    super('OwnersManagerDB');
    
    this.version(1).stores({
      owners: 'id, name, apartment',
      projects: 'id, status, deadline, responsible',
      syncQueue: '++id, timestamp, collection',
      metadata: 'key'
    });
  }
}

// Create database instance
export const db = new AppDatabase();

// Utility functions for CRUD operations
export const dbOperations = {
  // Owners
  async getAllOwners(): Promise<Owner[]> {
    return await db.owners.toArray();
  },

  async getOwner(id: string): Promise<Owner | undefined> {
    return await db.owners.get(id);
  },

  async addOwner(owner: Owner): Promise<string> {
    return await db.owners.add(owner);
  },

  async updateOwner(id: string, changes: Partial<Owner>): Promise<number> {
    return await db.owners.update(id, changes);
  },

  async deleteOwner(id: string): Promise<void> {
    await db.owners.delete(id);
  },

  async bulkPutOwners(owners: Owner[]): Promise<string> {
    return await db.owners.bulkPut(owners);
  },

  // Projects
  async getAllProjects(): Promise<Project[]> {
    return await db.projects.toArray();
  },

  async getProject(id: string): Promise<Project | undefined> {
    return await db.projects.get(id);
  },

  async addProject(project: Project): Promise<string> {
    return await db.projects.add(project);
  },

  async updateProject(id: string, changes: Partial<Project>): Promise<number> {
    return await db.projects.update(id, changes);
  },

  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
  },

  async bulkPutProjects(projects: Project[]): Promise<string> {
    return await db.projects.bulkPut(projects);
  },

  // Sync Queue
  async addToSyncQueue(operation: Omit<SyncOperation, 'id'>): Promise<number> {
    return await db.syncQueue.add(operation as SyncOperation);
  },

  async getSyncQueue(): Promise<SyncOperation[]> {
    return await db.syncQueue.orderBy('timestamp').toArray();
  },

  async clearSyncQueue(): Promise<void> {
    await db.syncQueue.clear();
  },

  async removeSyncOperation(id: number): Promise<void> {
    await db.syncQueue.delete(id);
  },

  // Metadata
  async getMetadata(key: string): Promise<any> {
    const item = await db.metadata.get(key);
    return item?.value;
  },

  async setMetadata(key: string, value: any): Promise<string> {
    return await db.metadata.put({ key, value });
  },

  async getLastSync(): Promise<number> {
    return await this.getMetadata('lastSync') || 0;
  },

  async setLastSync(timestamp: number): Promise<void> {
    await this.setMetadata('lastSync', timestamp);
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    await db.owners.clear();
    await db.projects.clear();
    await db.syncQueue.clear();
    await db.metadata.clear();
  }
};
