// An toàn dữ liệu: nhắc sao lưu, bản dự phòng trước khi khôi phục, nhật ký lỗi.
import { DB_NAME, exportAll, importAll } from './db.js';

// Khoá localStorage riêng theo DB (smoke test dùng ?db=gym-smoke không đụng dữ liệu thật).
const key = (k) => (DB_NAME === 'gym' ? k : `${k}.${DB_NAME}`);
export const BACKUP_KEY = key('gym.lastBackup');
const SNAP = key('gym.preRestore'), ERR = key('gym.errors');
export const BACKUP_DAYS = 7, BACKUP_MIN = 3;

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export const lastBackup = () => Number(localStorage.getItem(BACKUP_KEY) || 0);
export const markBackup = (t = Date.now()) => localStorage.setItem(BACKUP_KEY, t);

/** Cần nhắc sao lưu? Đã có ≥ BACKUP_MIN buổi xong, có buổi mới hơn lần sao lưu cuối và đã quá BACKUP_DAYS ngày. */
export function backupDue(last, workouts, now = Date.now()) {
  const ends = workouts.filter((w) => w.end).map((w) => w.end), newest = Math.max(0, ...ends);
  if (ends.length < BACKUP_MIN) return false;
  return newest > last && now - last > BACKUP_DAYS * 864e5;
}

/** Lưu dữ liệu hiện tại trước khi khôi phục. false = không đủ chỗ (localStorage ~5MB). */
export async function snapshot() {
  try { localStorage.setItem(SNAP, JSON.stringify({ at: Date.now(), data: await exportAll() })); return true; }
  catch { localStorage.removeItem(SNAP); return false; }
}
export const snapshotInfo = () => read(SNAP, null)?.at || 0;
export async function undoRestore() {
  const s = read(SNAP, null);
  if (!s) throw new Error('Không có bản dự phòng');
  await importAll(s.data);
  localStorage.removeItem(SNAP);
}

// Nhật ký lỗi: giữ 10 lỗi gần nhất để xem lại trong Cài đặt.
export function logError(e) {
  const msg = String(e?.message || e?.reason?.message || e?.reason || e || 'Lỗi không rõ').slice(0, 300);
  const list = [{ at: Date.now(), msg, where: location.hash || '#/' }, ...read(ERR, [])].slice(0, 10);
  try { localStorage.setItem(ERR, JSON.stringify(list)); } catch {}
  return msg;
}
export const errorLog = () => read(ERR, []);
export const clearErrors = () => localStorage.removeItem(ERR);
