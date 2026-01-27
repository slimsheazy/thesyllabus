// @ts-ignore
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
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT,
        query TEXT,
        result TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
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