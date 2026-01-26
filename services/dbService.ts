
const WORKER_CODE = `
import initSqlJs from 'https://esm.sh/sql.js@1.13.0';

let db = null;

const init = async (data) => {
  const wasmUrl = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.wasm';
  const wasmResponse = await fetch(wasmUrl);
  const wasmBinary = await wasmResponse.arrayBuffer();
  
  const initFn = typeof initSqlJs === 'function' ? initSqlJs : initSqlJs.default;
  const SQL = await initFn({ wasmBinary });
  
  if (data) {
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
    db.run(\`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT,
        query TEXT,
        result TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    \`);
  }
};

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;
  
  try {
    switch (type) {
      case 'INIT':
        await init(payload);
        self.postMessage({ id, type: 'SUCCESS' });
        break;
        
      case 'LOG':
        if (!db) throw new Error("DB not initialized");
        db.run("INSERT INTO logs (module, query, result) VALUES (?, ?, ?)", [payload.module, payload.query, payload.result]);
        
        // Export for persistence
        const binary = db.export();
        // Send persist message separately
        self.postMessage({ type: 'PERSIST', payload: binary });
        self.postMessage({ id, type: 'SUCCESS' });
        break;
        
      case 'GET':
        if (!db) throw new Error("DB not initialized");
        let res;
        if (payload.module) {
          res = db.exec("SELECT * FROM logs WHERE module = ? ORDER BY timestamp DESC", [payload.module]);
        } else {
          res = db.exec("SELECT * FROM logs ORDER BY timestamp DESC");
        }
        
        const logs = [];
        if (res.length > 0) {
           const columns = res[0].columns;
           logs.push(...res[0].values.map((row) => {
              const obj = {};
              columns.forEach((col, i) => {
                obj[col] = row[i];
              });
              return obj;
           }));
        }
        self.postMessage({ id, type: 'SUCCESS', payload: logs });
        break;
    }
  } catch (error) {
    self.postMessage({ id, type: 'ERROR', error: error.message });
  }
};
`;

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
const messageQueue = new Map<string, { resolve: (data: any) => void, reject: (err: any) => void }>();

const generateId = () => Math.random().toString(36).substring(2, 9);

export const initDB = async () => {
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Create worker from Blob to avoid URL resolution issues with import.meta.url
      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl, { type: 'module' });
      
      worker.onmessage = (e) => {
        const { id, type, payload, error } = e.data;
        
        if (type === 'PERSIST') {
          // Handle persistence independently of request/response cycle
          try {
             // payload is Uint8Array
             const arr = Array.from(payload as Uint8Array);
             localStorage.setItem('syllabus_sqlite_db', JSON.stringify(arr));
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

      // Load data from localStorage
      const savedDb = localStorage.getItem('syllabus_sqlite_db');
      let data = null;
      if (savedDb) {
        try {
          data = new Uint8Array(JSON.parse(savedDb));
        } catch (e) {
          console.error("Corrupt local DB, resetting.");
        }
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
