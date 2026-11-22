import { seed } from './db.js';
import * as timer from './timer.js';
import { countUp, toast } from './util.js';
import { logError } from './safety.js';

// Bắt mọi lỗi chưa xử lý: ghi nhật ký (xem ở Cài đặt) + báo bằng toast, tối đa 1 toast/5 giây.
let lastToast = 0;
function onError(e) {
  const msg = logError(e);
  if (Date.now() - lastToast > 5000) { lastToast = Date.now(); toast('Có lỗi: ' + msg, 4000); }
}
addEventListener('error', (e) => onError(e.error || e.message));
addEventListener('unhandledrejection', (e) => onError(e.reason));

const ROUTES = {
  '': () => import('./views/home.js'),
  workout: () => import('./views/workout.js'),
  history: () => import('./views/history.js'),
  templates: () => import('./views/templates.js'),
  progress: () => import('./views/progress.js'),
  settings: () => import('./views/settings.js'),
  report: () => import('./views/report.js'),
  hero: () => import('./views/hero.js'),
  'nhap-mon': () => import('./views/dao.js'),
};

const main = document.getElementById('main');
let cleanup;

async function route() {
  const [name = '', ...params] = location.hash.replace(/^#\/?/, '').split('/');
  const load = ROUTES[name] || ROUTES[''];
  cleanup?.();
  cleanup = null;
  main.onclick = main.oninput = main.onchange = main.onsubmit = null;
  document.querySelectorAll('nav a').forEach((a) => {
    const current = a.dataset.r === (ROUTES[name] ? name : '');
    a.classList.toggle('on', current);
    if (current) a.setAttribute('aria-current', params.length ? 'location' : 'page');
    else a.removeAttribute('aria-current');
  });
  try {
    const loading = document.getElementById(`loading-${name || 'home'}`);
    if (loading) main.replaceChildren(loading.content.cloneNode(true));
    cleanup = await (await load()).render(main, params.map(decodeURIComponent));
    countUp(main);
  } catch (e) {
    console.error(e);
    logError(e);
    main.innerHTML = `<p class="error">Lỗi: ${String(e.message || e)}</p>`;
  }
  window.scrollTo(0, 0);
}

await seed();
navigator.storage?.persist?.();
timer.resume();
addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('sw.js');
}
