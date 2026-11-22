export const h = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const fmtDate = (t) =>
  new Date(t).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtShort = (t) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
export const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
export const fmtDur = (ms) => {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} phút`;
};
export const fmtNum = (n) => (Math.round(n * 10) / 10).toLocaleString('vi-VN');

/** Epley 1RM estimate */
export const e1rm = (w, r) => (r > 0 && w > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0);

export function toast(msg, ms = 2200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

const SKEY = 'gym.settings';
const DEFAULTS = { rest: 90, sound: true, vibrate: true, weekGoal: 3, monthGoal: 12 };
export const settings = {
  get() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SKEY) || '{}') }; } catch { return { ...DEFAULTS }; }
  },
  set(patch) {
    const v = { ...settings.get(), ...patch };
    try { localStorage.setItem(SKEY, JSON.stringify(v)); } catch {}
    return v;
  },
};

const calm = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const BUZZ = { gold: [80, 60, 80, 60, 160], silver: [80, 60, 120], bronze: [90] };

/** Ăn mừng: rung theo cấp (nếu bật rung) + gắn `.celebrate[data-celebrate=tier]` ~1.2s cho Codex làm hiệu ứng. */
export function celebrate(el, tier = 'bronze') {
  if (settings.get().vibrate && navigator.vibrate) navigator.vibrate(BUZZ[tier] || BUZZ.bronze);
  if (!el) return;
  el.classList.add('celebrate');
  el.dataset.celebrate = tier;
  setTimeout(() => { el.classList.remove('celebrate'); delete el.dataset.celebrate; }, 1200);
}

/** Đếm tăng dần cho các phần tử `[data-count]` (số nằm ở text node đầu). Bỏ qua nếu giảm chuyển động. */
export function countUp(root, ms = 700) {
  for (const el of root.querySelectorAll('[data-count]:not([data-counted])')) {
    el.dataset.counted = '';
    const to = Number(el.dataset.count), node = el.firstChild;
    if (calm() || !(to > 0) || node?.nodeType !== 3) continue;
    const fmt = (v) => (Number.isInteger(to) ? Math.round(v).toLocaleString('vi-VN') : fmtNum(v));
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      node.textContent = fmt(to * (1 - (1 - k) ** 3));
      if (k < 1 && node.isConnected) requestAnimationFrame(tick);
    };
    node.textContent = fmt(0);
    requestAnimationFrame(tick);
  }
}

export const exMap =(list) => Object.fromEntries(list.map((e) => [e.id, e]));
