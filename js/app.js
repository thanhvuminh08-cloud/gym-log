import { seed } from './db.js';
import * as timer from './timer.js';

const ROUTES = {
  '': () => import('./views/home.js'),
  workout: () => import('./views/workout.js'),
  history: () => import('./views/history.js'),
  templates: () => import('./views/templates.js'),
  progress: () => import('./views/progress.js'),
  settings: () => import('./views/settings.js'),
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
    cleanup = await (await load()).render(main, params.map(decodeURIComponent));
  } catch (e) {
    console.error(e);
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
