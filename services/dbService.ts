
import DB_WORKER_URL from './dbWorker.ts?worker&url';

// --- IndexedDB Helper ---
const IDB_NAME = 'SyllabusDB';
const IDB_STORE = 'sqlite_store';
const IDB_KEY = 'db_file';

const idbSave = (data: Uint8Array) => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(data, IDB_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
};

const idbLoad = (): Promise<Uint8Array | null> => {
   return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
       const db = (e.target as IDBOpenDBRequest).result;
       if (!db.objectStoreNames.contains(IDB_STORE)) {
         db.createObjectStore(IDB_STORE);
       }
    };
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(IDB_STORE, 'readonly');
      const getReq = tx.objectStore(IDB_STORE).get(IDB_KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

// --- Worker Setup ---

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
const messageQueue = new Map<string, { resolve: (data: any) => void, reject: (err: any) => void }>();

const generateId = () => Math.random().toString(36).substring(2, 9);

export const initDB = async () => {
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Use Vite's worker import
      worker = new Worker(DB_WORKER_URL, { type: 'module' });
      
      worker.onmessage = async (e) => {
        const { id, type, payload, error } = e.data;
        
        if (type === 'PERSIST') {
          try {
             await idbSave(payload as Uint8Array);
             // console.log("DB Persisted to IndexedDB");
          } catch (err) {
            console.error("Failed to persist DB from worker:", err);
          }
          return;
        }

        if (id && messageQueue.has(id)) {
          const { resolve: reqResolve, reject: reqReject } = messageQueue.get(id)!;
          messageQueue.delete(id);
          if (type === 'ERROR') reqReject(new Error(error));
          else reqResolve(payload);
        }
      };

      // Load data from IndexedDB
      let data = null;
      try {
        data = await idbLoad();
      } catch (e) {
        console.error("Failed to load local DB, resetting.", e);
      }

      // Send INIT
      const id = generateId();
      messageQueue.set(id, { resolve: () => resolve(), reject });
      worker.postMessage({ id, type: 'INIT', payload: data });

    } catch (e) {
      reject(e);
      initPromise = null;
    }
  });

  return initPromise;
};

export const logCalculation = async (module: string, query: string, result: any) => {
  await initDB();
  if (!worker) return;
  
  return new Promise((resolve, reject) => {
    const id = generateId();
    messageQueue.set(id, { resolve, reject });
    worker!.postMessage({
      id,
      type: 'LOG',
      payload: { module, query, result: JSON.stringify(result) }
    });
  });
};

export const getLogs = async (moduleFilter?: string) => {
  await initDB();
  if (!worker) return [];

  return new Promise((resolve, reject) => {
    const id = generateId();
    messageQueue.set(id, { resolve, reject });
    worker!.postMessage({
      id,
      type: 'GET',
      payload: { module: moduleFilter }
    });
  });
};
