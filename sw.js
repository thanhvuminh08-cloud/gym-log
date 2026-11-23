// Tăng VERSION mỗi khi sửa file tĩnh để điện thoại tải bản mới.
const VERSION = 'v66';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/db.js', 'js/util.js', 'js/stats.js', 'js/exercises.js', 'js/timer.js', 'js/chart.js', 'js/picker.js', 'js/overload.js', 'js/medals.js', 'js/report.js', 'js/insights.js', 'js/safety.js', 'js/schedule.js', 'js/hero.js', 'js/dao.js', 'js/lore.js', 'js/recap.js',
  'js/views/home.js', 'js/views/workout.js', 'js/views/history.js', 'js/views/templates.js', 'js/views/progress.js', 'js/views/settings.js', 'js/views/report.js', 'js/views/hero.js',
  'js/views/dao.js',
  'js/views/sections.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/training-pavilion.webp', 'assets/cultivation-mountains.svg',
  'assets/cultivation-mist.svg', 'assets/cultivation-realms.svg', 'assets/formation-ring.svg',
  'assets/fonts/noto-serif-vi-bold.woff2',
  'js/sfx.js', 'assets/audio/dong-phu.mp3', 'assets/audio/loi-kiep.mp3', 'assets/audio/dot-pha.mp3', 'assets/audio/nhiem-vu.mp3',
  'assets/audio/set-xong.mp3', 'assets/audio/pham-dong.mp3', 'assets/audio/pham-ngoc.mp3', 'assets/audio/pham-kim.mp3', 'assets/audio/het-gio.mp3',
  'assets/audio/xuat-quan.mp3', 'assets/audio/nhap-mon.mp3', 'assets/audio/thoi-the.mp3', 'assets/audio/xac-chung.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
