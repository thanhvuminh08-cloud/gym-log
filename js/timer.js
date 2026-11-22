import { settings } from './util.js';

// Đồng hồ nghỉ: thanh cố định phía trên nav. Lưu thời điểm kết thúc để sống qua việc chuyển màn hình.
// gym.restStart giữ mốc bắt đầu để vòng nghỉ tính đúng tỉ lệ sau ±15 và khi mở lại app.
const KEY = 'gym.restEnd', START = 'gym.restStart', WARN_S = 10;
let tick, bar, ctx;

function beep() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.2;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.15);
    });
  } catch {}
}

function getEnd() { return Number(localStorage.getItem(KEY) || 0); }
function setEnd(v) { v ? localStorage.setItem(KEY, v) : (localStorage.removeItem(KEY), localStorage.removeItem(START)); }

// Tỉ lệ thời gian còn lại 0–100 (hàm thuần, smoke kiểm).
export function restProgress(start, end, now = Date.now()) {
  const total = end - start;
  if (!(total > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round(((end - now) / total) * 1000) / 10));
}

function ensureBar() {
  if (bar) return bar;
  bar = document.createElement('div');
  bar.className = 'rest-bar';
  bar.innerHTML = `
    <button data-d="-15">−15</button>
    <div class="rest-clock">
      <svg class="rest-ring" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <circle class="rest-ring-track" cx="18" cy="18" r="15"/>
        <circle class="rest-ring-progress" cx="18" cy="18" r="15" pathLength="100" transform="rotate(-90 18 18)"/>
        <path class="rest-ring-hands" d="M18 11v7l4 3"/>
      </svg>
      <div class="rest-time"></div>
    </div>
    <button data-d="15">+15</button>
    <button data-skip>Bỏ qua</button>`;
  bar.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.skip !== undefined) return stop();
    setEnd(getEnd() + Number(b.dataset.d) * 1000);
    update();
  });
  document.body.append(bar);
  return bar;
}

function update() {
  const left = Math.round((getEnd() - Date.now()) / 1000);
  if (left <= 0) {
    const s = settings.get();
    if (s.sound) beep();
    if (s.vibrate && navigator.vibrate) navigator.vibrate([300, 150, 300]);
    return stop();
  }
  ensureBar().classList.add('show');
  const start = Number(localStorage.getItem(START)) || getEnd() - left * 1000;
  bar.style.setProperty('--rest-progress', restProgress(start, getEnd()));
  if (left <= WARN_S) bar.dataset.warn = 'true'; else delete bar.dataset.warn;
  bar.querySelector('.rest-time').textContent = `Nghỉ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

export function start(seconds) {
  if (!seconds) return;
  // Unlock audio on user gesture (iOS)
  try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch {}
  const now = Date.now();
  localStorage.setItem(START, now);
  setEnd(now + seconds * 1000);
  resume();
}

export function resume() {
  clearInterval(tick);
  if (getEnd() <= Date.now()) return setEnd(0);
  update();
  tick = setInterval(update, 500);
}

export function stop() {
  clearInterval(tick);
  setEnd(0);
  bar?.classList.remove('show');
  if (bar) delete bar.dataset.warn;
}
