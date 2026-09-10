import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  startAfter,
  limit as firestoreLimit,
  getCountFromServer,
  writeBatch,
  getDocFromServer,
  DocumentSnapshot
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with Persistent IndexedDB Local Cache (Zero-Read Repeat Optimization)
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, checking network or rules.');
    }
    return false;
  }
}

// Helper to compress image data URL in browser to keep size strictly below Firestore 1MB limit
async function compressImageDataUrl(dataUrl: string, maxDimension = 900, quality = 0.75): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// In-memory Snapshot Cursor tracker map for smooth multi-page pagination
const cursorCache = new Map<string, DocumentSnapshot>();

// In-memory Short-Term Cache Map (Avoids redundant network trips during quick tab switches)
const memoryCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 45 * 1000; // 45 Seconds TTL for high responsiveness

// Data Services using Firebase Firestore
export class FirebaseDataService {
  /**
   * Get cached data synchronously without network wait (0ms response)
   */
  public static getCachedData(collectionName: string, search = ''): any[] | null {
    const cached = memoryCache.get(collectionName);
    if (!cached) return null;
    let items = cached.data;
    if (search.trim()) {
      const queryLower = search.toLowerCase();
      items = items.filter(item => 
        Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(queryLower)
        )
      );
    }
    return items;
  }

  /**
   * Invalidate memory cache for a collection or all
   */
  public static invalidateCache(collectionName?: string): void {
    if (collectionName) {
      memoryCache.delete(collectionName);
      cursorCache.delete(collectionName);
    } else {
      memoryCache.clear();
      cursorCache.clear();
    }
  }

  /**
   * Fetch aggregate count cheaply without loading all documents (1 read per 1,000 index items)
   */
  public static async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getCountFromServer(colRef);
      return snapshot.data().count;
    } catch {
      // Fallback: check memory cache length if available
      const cached = memoryCache.get(collectionName);
      if (cached) return cached.data.length;
      return 0;
    }
  }

  /**
   * Fetch records from a Firestore collection with fast direct query, deterministic client-side sorting, and local caching
   */
  public static async getCollectionData(
    collectionName: string, 
    search = '', 
    forceRefresh = false,
    maxLimit = 150
  ): Promise<any[]> {
    try {
      // Check in-memory cache first if not forced refresh and no search term
      const cached = memoryCache.get(collectionName);
      const isFresh = cached && (Date.now() - cached.timestamp < CACHE_TTL_MS);

      let items: any[] = [];

      if (!forceRefresh && isFresh) {
        items = cached.data;
      } else {
        // Fast direct query without composite index overhead
        const colRef = collection(db, collectionName);
        const basicQuery = query(colRef, firestoreLimit(maxLimit));
        const snap = await getDocs(basicQuery);
        
        items = [];
        let lastDocSnapshot: DocumentSnapshot | null = null;
        snap.forEach((d) => {
          items.push({
            id: d.id,
            ...d.data()
          });
          lastDocSnapshot = d;
        });

        // Deterministic sorting in-memory (latest first) - 0ms, zero index error risk
        items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return timeB - timeA;
        });

        if (lastDocSnapshot) {
          cursorCache.set(collectionName, lastDocSnapshot);
        }

        // Store in memory cache
        memoryCache.set(collectionName, {
          timestamp: Date.now(),
          data: items
        });
      }

      // Filter by search query on the cached payload (zero extra read cost)
      if (search.trim()) {
        const queryLower = search.toLowerCase();
        return items.filter(item => 
          Object.values(item).some(val => 
            val !== null && val !== undefined && String(val).toLowerCase().includes(queryLower)
          )
        );
      }

      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  }

  /**
   * Fetch Next Page (Cursor-Based Pagination via startAfter) for Deep Archive Retrieval (>100 data)
   */
  public static async getNextPage(
    collectionName: string,
    pageSize = 100
  ): Promise<{ items: any[]; hasMore: boolean }> {
    try {
      const lastCursor = cursorCache.get(collectionName);
      if (!lastCursor) {
        return { items: [], hasMore: false };
      }

      const colRef = collection(db, collectionName);
      let snap;
      try {
        const nextQuery = query(
          colRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastCursor),
          firestoreLimit(pageSize)
        );
        snap = await getDocs(nextQuery);
      } catch {
        const fallbackQuery = query(
          colRef,
          startAfter(lastCursor),
          firestoreLimit(pageSize)
        );
        snap = await getDocs(fallbackQuery);
      }

      const newItems: any[] = [];
      let newLastDoc: DocumentSnapshot | null = null;
      snap.forEach((d) => {
        newItems.push({
          id: d.id,
          ...d.data()
        });
        newLastDoc = d;
      });

      if (newLastDoc) {
        cursorCache.set(collectionName, newLastDoc);
      }

      // Append new items into memory cache
      const existing = memoryCache.get(collectionName);
      if (existing) {
        const merged = [...existing.data, ...newItems];
        memoryCache.set(collectionName, {
          timestamp: Date.now(),
          data: merged
        });
      }

      return {
        items: newItems,
        hasMore: newItems.length >= pageSize
      };
    } catch (error) {
      console.warn('Next page pagination query fallback:', error);
      return { items: [], hasMore: false };
    }
  }

  /**
   * Get single document by ID
   */
  public static async getDocument(collectionName: string, id: string): Promise<any> {
    try {
      // Check if item is already in local memory cache
      const cached = memoryCache.get(collectionName);
      if (cached) {
        const found = cached.data.find(item => item.id === id);
        if (found) return found;
      }

      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Data dengan ID ${id} tidak ditemukan di Firebase Firestore.`);
      }
      return {
        id: snap.id,
        ...snap.data()
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
    }
  }

  /**
   * Create a new document in Firestore
   */
  public static async createDocument(collectionName: string, payload: any): Promise<any> {
    const docId = payload.id || `${collectionName.substring(0, 3)}-${Date.now()}`;
    const cleanPayload = { ...payload };
    delete cleanPayload.id;

    const dataToSave = {
      ...cleanPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, dataToSave);
      
      // Invalidate memory cache so next fetch reflects new item
      this.invalidateCache(collectionName);

      // Auto log audit
      if (collectionName !== 'audit_logs') {
        await this.logAudit(
          `Tambah Data (${collectionName})`,
          `<p>Menambahkan data baru "${payload.name || payload.customer_name || docId}" ke Firebase Firestore.</p>`
        );
      }

      return {
        id: docId,
        ...dataToSave
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${collectionName}/${docId}`);
    }
  }

  /**
   * Update document in Firestore
   */
  public static async updateDocument(collectionName: string, id: string, payload: any): Promise<any> {
    const cleanPayload = { ...payload };
    delete cleanPayload.id;

    const dataToUpdate = {
      ...cleanPayload,
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, dataToUpdate);

      // Invalidate memory cache
      this.invalidateCache(collectionName);

      // Auto log audit
      if (collectionName !== 'audit_logs') {
        await this.logAudit(
          `Perbarui Data (${collectionName})`,
          `<p>Memperbarui data ID "${id}" di Firebase Firestore.</p>`
        );
      }

      return {
        id,
        ...dataToUpdate
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  }

  /**
   * Delete document from Firestore
   */
  public static async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      // Invalidate memory cache
      this.invalidateCache(collectionName);

      // Auto log audit
      if (collectionName !== 'audit_logs') {
        await this.logAudit(
          `Hapus Data (${collectionName})`,
          `<p>Menghapus data ID "${id}" dari Firebase Firestore.</p>`
        );
      }

      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  }

  /**
   * Bulk create records (Excel Import) using chunked Firestore WriteBatch (Anti-Crash limit >500)
   */
  public static async bulkCreate(collectionName: string, items: any[]): Promise<{ totalInserted: number; errors: any[] }> {
    try {
      const CHUNK_SIZE = 400; // Safeguard under Firestore 500-write hard limit
      let totalInserted = 0;
      const errors: any[] = [];

      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((item, index) => {
          const docId = item.id || `${collectionName.substring(0, 3)}-${Date.now()}-${i + index}`;
          const cleanPayload = { ...item };
          delete cleanPayload.id;

          const dataToSave = {
            ...cleanPayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const docRef = doc(db, collectionName, docId);
          batch.set(docRef, dataToSave);
        });

        await batch.commit();
        totalInserted += chunk.length;
      }

      // Invalidate memory cache
      this.invalidateCache(collectionName);

      if (collectionName !== 'audit_logs' && totalInserted > 0) {
        await this.logAudit(
          `Import Massal (${collectionName})`,
          `<p>Berhasil mengimpor ${totalInserted} data baru ke Firebase Firestore secara aman.</p>`
        );
      }

      return {
        totalInserted,
        errors
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/batch`);
    }
  }

  /**
   * Upload file to Firebase Storage with Automatic Canvas Image Compression
   */
  public static async uploadFile(fileName: string, fileType: string, fileData: string | File | Blob): Promise<string> {
    try {
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `uploads/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, storagePath);

      if (typeof fileData === 'string') {
        let processedData = fileData;
        if (fileData.startsWith('data:image')) {
          // Compress before uploading or fallback storage
          processedData = await compressImageDataUrl(fileData, 1000, 0.75);
        }

        if (processedData.startsWith('data:')) {
          await uploadString(storageRef, processedData, 'data_url');
        } else {
          await uploadString(storageRef, processedData, 'raw');
        }
      } else {
        await uploadBytes(storageRef, fileData);
      }

      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (storageError) {
      console.warn('Firebase Storage upload unconfigured/failed, using compressed data URL directly:', storageError);
      if (typeof fileData === 'string' && fileData.startsWith('data:image')) {
        // Compress data URL strictly to prevent Firestore 1MB document limit overflow
        const compressed = await compressImageDataUrl(fileData, 800, 0.7);
        return compressed;
      }
      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        return fileData;
      }
      return 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=60';
    }
  }

  /**
   * Record Audit Log to Firestore
   */
  public static async logAudit(action: string, details: string): Promise<void> {
    try {
      const role = localStorage.getItem('admin_active_role') || 'SUPER_ADMIN';
      const logId = `log-${Date.now()}`;
      const logRef = doc(db, 'audit_logs', logId);
      await setDoc(logRef, {
        action,
        user: `User (${role})`,
        timestamp: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID'),
        details,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to write audit log to Firestore:', e);
    }
  }
}

