import { DEFAULT_EXERCISES } from './exercises.js';

// ?db=<name> dùng DB riêng (smoke test không đụng dữ liệu thật)
const DB_NAME = new URLSearchParams(location.search).get('db') || 'gym';
const DB_VERSION = 1;
export const STORES = ['exercises', 'templates', 'workouts', 'body'];

let dbp;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const all = (s) => tx(s, 'readonly', (o) => o.getAll());
export const get = (s, id) => tx(s, 'readonly', (o) => o.get(id));
export const put = (s, v) => tx(s, 'readwrite', (o) => o.put(v)).then(() => v);
export const del = (s, id) => tx(s, 'readwrite', (o) => o.delete(id));
export const clear = (s) => tx(s, 'readwrite', (o) => o.clear());

export async function seed() {
  if ((await all('exercises')).length) return;
  for (const e of DEFAULT_EXERCISES) await put('exercises', e);
}

export async function exportAll() {
  const out = { app: 'gym', version: DB_VERSION, exportedAt: Date.now() };
  for (const s of STORES) out[s] = await all(s);
  return out;
}

export async function importAll(data) {
  if (data?.app !== 'gym') throw new Error('File không đúng định dạng');
  for (const s of STORES) {
    if (!Array.isArray(data[s])) continue;
    await clear(s);
    for (const v of data[s]) await put(s, v);
  }
}

export async function activeWorkout() {
  return (await all('workouts')).find((w) => !w.end) || null;
}
