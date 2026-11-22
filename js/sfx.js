// Âm thanh Con Đường Tu Luyện: nhạc nền Động phủ (settings.music) + âm hiệu ứng (settings.sfx).
// iOS/Chrome chặn phát khi chưa chạm: play() bị từ chối → thử lại ở lần chạm kế tiếp.
import { settings } from './util.js';

const SRC = { dongPhu: 'dong-phu', loiKiep: 'loi-kiep', dotPha: 'dot-pha', nhiemVu: 'nhiem-vu', setXong: 'set-xong', phamDong: 'pham-dong', phamNgoc: 'pham-ngoc', phamKim: 'pham-kim', hetGio: 'het-gio', xuatQuan: 'xuat-quan', nhapMon: 'nhap-mon', thoiThe: 'thoi-the', xacChung: 'xac-chung' };
const cache = {};
const audio = (name) => (cache[name] ||= Object.assign(new Audio(`assets/audio/${SRC[name]}.mp3`), { preload: 'auto' }));

let pending = null; // hàm chờ lần chạm đầu
function retryOnTouch(fn) {
  if (pending) removeEventListener('pointerdown', pending, true);
  pending = () => { pending = null; fn(); };
  addEventListener('pointerdown', pending, { capture: true, once: true });
}
function start(a, retry) {
  const p = a.play();
  p?.catch?.((e) => { if (e?.name === 'NotAllowedError' && retry) retryOnTouch(() => start(a, false)); });
}

/** Âm hiệu ứng một lần (dotPha, loiKiep, nhiemVu). */
export function sfx(name) {
  if (!settings.get().sfx || !SRC[name]) return;
  const a = audio(name);
  a.currentTime = 0;
  start(a, true);
}

let musicOn = false;
const onVisible = () => { const a = audio('dongPhu'); if (document.hidden) a.pause(); else if (musicOn) start(a, true); };

/** Nhạc nền lặp khi ở Động phủ. Trả về hàm dừng (dùng làm cleanup của route). */
export function music() {
  if (!settings.get().music) return () => {};
  const a = audio('dongPhu');
  a.loop = true; a.volume = 0.5; musicOn = true;
  start(a, true);
  document.addEventListener('visibilitychange', onVisible);
  return stopMusic;
}
export function stopMusic() {
  musicOn = false;
  document.removeEventListener('visibilitychange', onVisible);
  if (pending) { removeEventListener('pointerdown', pending, true); pending = null; }
  const a = cache.dongPhu;
  if (a) { a.pause(); a.currentTime = 0; }
}
