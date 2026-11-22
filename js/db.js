import { DEFAULT_EXERCISES } from './exercises.js';

// ?db=<name> dùng DB riêng (smoke test không đụng dữ liệu thật)
export const DB_NAME = new URLSearchParams(location.search).get('db') || 'gym';
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

/** Kiểm tra file sao lưu trước khi ghi; trả về số bản ghi mỗi store, lỗi → throw. */
export function validateBackup(data) {
  if (data?.app !== 'gym') throw new Error('File không phải bản sao lưu Gym Log');
  if (data.version > DB_VERSION) throw new Error('File từ phiên bản app mới hơn, hãy cập nhật app');
  const counts = {};
  for (const s of STORES) {
    if (data[s] === undefined) continue;
    if (!Array.isArray(data[s])) throw new Error(`Mục "${s}" hỏng`);
    if (data[s].some((v) => !v || typeof v !== 'object' || typeof v.id !== 'string')) throw new Error(`Mục "${s}" có bản ghi thiếu id`);
    counts[s] = data[s].length;
  }
  if (data.workouts?.some((w) => typeof w.start !== 'number' || !Array.isArray(w.entries))) throw new Error('Có buổi tập bị hỏng');
  if (!Object.keys(counts).length) throw new Error('File không có dữ liệu');
  return counts;
}

/** Ghi đè nguyên khối trong 1 transaction: lỗi giữa chừng → không mất gì. */
export async function importAll(data) {
  validateBackup(data);
  const stores = STORES.filter((s) => Array.isArray(data[s]));
  const db = await open();
  await new Promise((resolve, reject) => {
    const t = db.transaction(stores, 'readwrite');
    for (const s of stores) {
      const o = t.objectStore(s);
      o.clear();
      for (const v of data[s]) o.put(v);
    }
    t.oncomplete = resolve;
    t.onerror = t.onabort = () => reject(t.error || new Error('Khôi phục bị huỷ'));
  });
}

export async function activeWorkout() {
  return (await all('workouts')).find((w) => !w.end) || null;
}
