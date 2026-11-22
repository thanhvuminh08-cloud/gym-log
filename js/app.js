import { seed, activeWorkout } from './db.js';
import * as timer from './timer.js';
import { countUp, toast, settings } from './util.js';
import { logError } from './safety.js';
import { NAV } from './lore.js';

// Bắt mọi lỗi chưa xử lý: ghi nhật ký (xem ở Cài đặt) + báo bằng toast, tối đa 1 toast/5 giây.
let lastToast = 0;
function onError(e) {
  const msg = logError(e);
  if (Date.now() - lastToast > 5000) { lastToast = Date.now(); toast('Có lỗi: ' + msg, 4000); }
}
addEventListener('error', (e) => onError(e.error || e.message));
addEventListener('unhandledrejection', (e) => onError(e.reason));

const VIEWS = {
  home: () => import('./views/home.js'),
  workout: () => import('./views/workout.js'),
  history: () => import('./views/history.js'),
  templates: () => import('./views/templates.js'),
  progress: () => import('./views/progress.js'),
  settings: () => import('./views/settings.js'),
  report: () => import('./views/report.js'),
  dao: () => import('./views/dao.js'),
};

// 5 mục (NAV trong lore.js) + Nhập môn. Mỗi route nhận các đoạn hash sau tên, trả danh sách [view, params]
// render nối tiếp trong #main. Tạm gắn view cũ làm tab con; gộp/viết giao diện mới ở đợt 2–3 (VISION.md).
const ROUTES = {
  '': () => [['home']], // Động phủ
  workout: () => [['workout']], // Bế quan
  'cong-phap': ([id]) => [['templates', id ? [id] : []]], // Công pháp: #/cong-phap/<id|new>
  // Tu luyện ký: Nhật ký #/ky[/<id>] · Tuần ký #/ky/tuan[/<offset>] · Công đức bạ #/ky/cong-duc
  ky: ([a, ...p]) => (a === 'tuan' ? [['report', p]] : a === 'cong-duc' ? [['progress', ['medal']]] : [['history', a ? [a] : []]]),
  // Tàng thư: Tiến độ #/tang-thu[/<tab>[/<exId>]] · Cài đặt #/tang-thu/cai-dat
  'tang-thu': ([a, ...p]) => (a === 'cai-dat' ? [['settings']] : [['progress', [a || 'overview', ...p]]]),
  'nhap-mon': (p) => [['dao', p]],
};

// Route cũ → hash mới, để link/bookmark cũ không gãy. Nhận các đoạn (đã mã hoá) sau tên route cũ.
const ALIASES = {
  hero: () => '#/',
  history: ([id]) => `#/ky${id ? `/${id}` : ''}`,
  report: ([off]) => `#/ky/tuan${off ? `/${off}` : ''}`,
  progress: ([tab, ...p]) => (tab === 'medal' ? '#/ky/cong-duc' : ['#/tang-thu', tab, ...p].filter(Boolean).join('/')),
  templates: ([id]) => `#/cong-phap${id ? `/${id}` : ''}`,
  settings: () => '#/tang-thu/cai-dat',
};

/** Tên route mới mà một data-r (mới, hoặc cũ khi markup nav chưa đổi) trỏ tới — để tô mục nav đang mở. */
const navKey = (r = '') => (ALIASES[r] ? ALIASES[r]([]).replace(/^#\/?/, '').split('/')[0] : r);

const main = document.getElementById('main');
document.querySelector('.site-nav').innerHTML = NAV.map(({ route, r, icon, label }) =>
  `<a href="${route}" data-r="${r}"><span><svg aria-hidden="true"><use href="#${icon}"/></svg></span>${label}</a>`).join('');
let cleanup;

async function route() {
  const [name = '', ...raw] = location.hash.replace(/^#\/?/, '').split('/');
  if (ALIASES[name]) return location.replace(ALIASES[name](raw)); // thay mục lịch sử; hashchange gọi lại route()
  const params = raw.map(decodeURIComponent);
  // Lần đầu (chưa Nhập môn, chưa bấm "Để sau", không có buổi đang tập): vào thẳng Nhập môn.
  if (!name) {
    const s = settings.get();
    if (!s.dao && !s.daoSkip && !(await activeWorkout())) return location.replace('#/nhap-mon');
  }
  const key = ROUTES[name] ? name : '';
  const views = ROUTES[key](key === name ? params : []);
  cleanup?.();
  cleanup = null;
  main.onclick = main.oninput = main.onchange = main.onsubmit = null;
  document.querySelectorAll('nav a').forEach((a) => {
    const current = navKey(a.dataset.r) === key;
    a.classList.toggle('on', current);
    if (current) a.setAttribute('aria-current', params.length ? 'location' : 'page');
    else a.removeAttribute('aria-current');
  });
  try {
    const loading = document.getElementById(`loading-${key || 'home'}`) || document.getElementById(`loading-${views[0][0]}`);
    if (loading) main.replaceChildren(loading.content.cloneNode(true));
    const mods = await Promise.all(views.map(([v]) => VIEWS[v]()));
    if (views.length === 1) cleanup = await mods[0].render(main, views[0][1] || []);
    else {
      // Nhiều view: mỗi view một khung riêng (event delegation của view gắn trên khung đó).
      const boxes = views.map(([v]) => Object.assign(document.createElement('div'), { className: `view-part view-${v}` }));
      main.replaceChildren(...boxes);
      const stops = [];
      for (let i = 0; i < views.length; i++) stops.push(await mods[i].render(boxes[i], views[i][1] || []));
      cleanup = () => stops.forEach((f) => typeof f === 'function' && f());
    }
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
