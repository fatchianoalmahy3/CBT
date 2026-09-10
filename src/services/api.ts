import { MODULE_REGISTRY } from '../core/registry';
import { ModuleSchema } from '../core/types';
import { FirebaseDataService, testFirestoreConnection } from './firebase';

export class ApiService {
  private static getActiveRole(): string {
    return localStorage.getItem('admin_active_role') || 'SUPER_ADMIN';
  }

  // Initialize and check connection
  public static async init(): Promise<boolean> {
    return await testFirestoreConnection();
  }

  // Get active schemas
  public static async getSchemas(): Promise<ModuleSchema[]> {
    return MODULE_REGISTRY;
  }

  // Synchronously retrieve cached records without network wait (0ms response)
  public static getCachedRecords(module: string, search = ''): any[] | null {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      return null;
    }

    return FirebaseDataService.getCachedData(module, search);
  }

  // Get records from Firebase Firestore with caching and anti-limit safeguards
  public static async getRecords(module: string, search = '', forceRefresh = false): Promise<any[]> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan mengakses modul ini.`);
    }

    return await FirebaseDataService.getCollectionData(module, search, forceRefresh);
  }

  // Get Next Page records using cursor pagination (startAfter)
  public static async getNextPageRecords(module: string, pageSize = 100): Promise<{ items: any[]; hasMore: boolean }> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan mengakses modul ini.`);
    }

    return await FirebaseDataService.getNextPage(module, pageSize);
  }

  // Get total count cheaply via Firestore Aggregation
  public static async getRecordCount(module: string): Promise<number> {
    return await FirebaseDataService.getCollectionCount(module);
  }

  // Manual cache invalidation
  public static invalidateCache(module?: string): void {
    FirebaseDataService.invalidateCache(module);
  }

  // Get single record from Firebase Firestore
  public static async getRecordById(module: string, id: string): Promise<any> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan mengakses modul ini.`);
    }

    return await FirebaseDataService.getDocument(module, id);
  }

  // Create record in Firebase Firestore
  public static async createRecord(module: string, payload: any): Promise<any> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan menambahkan data.`);
    }

    return await FirebaseDataService.createDocument(module, payload);
  }

  // Bulk create records (for Excel import) in Firebase Firestore
  public static async bulkCreateRecords(module: string, items: any[]): Promise<{ totalInserted: number; errors: any[] }> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan mengimpor data.`);
    }

    return await FirebaseDataService.bulkCreate(module, items);
  }

  // Update record in Firebase Firestore
  public static async updateRecord(module: string, id: string, payload: any): Promise<any> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan memperbarui data.`);
    }

    return await FirebaseDataService.updateDocument(module, id, payload);
  }

  // Delete record from Firebase Firestore
  public static async deleteRecord(module: string, id: string): Promise<boolean> {
    const schema = MODULE_REGISTRY.find((m) => m.id === module);
    const role = this.getActiveRole();

    if (schema && !schema.allowedRoles.includes(role)) {
      throw new Error(`Akses ditolak. Peran '${role}' tidak diizinkan menghapus data.`);
    }

    return await FirebaseDataService.deleteDocument(module, id);
  }

  // Upload file/media directly to Firebase Storage
  public static async uploadFile(fileName: string, fileType: string, fileData: string | File | Blob): Promise<string> {
    return await FirebaseDataService.uploadFile(fileName, fileType, fileData);
  }
}
