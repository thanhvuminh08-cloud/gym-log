import { all, activeWorkout } from '../db.js';
import { h, fmtDate, fmtDur, fmtNum, exMap } from '../util.js';
import { finished, volume, setCount } from '../stats.js';
import { startWorkout } from './workout.js';
import { topLifts, muscleKey } from '../insights.js';
import { sparkline, lineChart } from '../chart.js';
import { lastBackup, backupDue } from '../safety.js';

const icon = (name) => `<svg class="dashboard-icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const trend = (d) => (d > 0 ? `<span class="trend up">↑ ${fmtNum(d)}</span>` : d < 0 ? `<span class="trend down">↓ ${fmtNum(-d)}</span>` : '');

/** Thẻ mức tạ chính (~1RM) + tổng, mũi tên so với 30 ngày trước. */
function strength({ lifts, total }, ex) {
  return `<section class="strength">
      <h2 class="section-heading">Sức mạnh <a href="#/progress/overview">Tổng quan</a></h2>
      <div class="lift-cards">${lifts.map((l) => `
        <a class="card lift-card" href="#/progress/ex/${encodeURIComponent(l.exerciseId)}" data-muscle="${muscleKey(ex[l.exerciseId])}">
          <span class="lift-top"><b data-count="${l.max}">${fmtNum(l.max)}<small> kg</small></b>${trend(l.delta)}</span>
          <small class="lift-name">${h(ex[l.exerciseId]?.name || 'Bài đã xoá')}</small>
          ${sparkline(l.spark)}
        </a>`).join('')}</div>
      ${lifts.length > 1 ? `<a class="card lift-total" href="#/progress/overview">
        <span class="lift-top"><b data-count="${total.max}">${fmtNum(total.max)}<small> kg</small></b>${trend(total.delta)}<small class="muted">Tổng ~1RM ${lifts.length} bài · so với 30 ngày trước</small></span>
        ${lineChart(total.series.slice(-40), { unit: ' kg', area: true, head: false })}
      </a>` : ''}
    </section>`;
}

export async function render(el) {
  const [cur, templates, done, exList] = await Promise.all([activeWorkout(), all('templates'), finished(), all('exercises')]);
  const ex = exMap(exList), top = topLifts(done);
  const last = lastBackup(), remind = backupDue(last, done);
  const weekAgo = Date.now() - 7 * 864e5;
  const week = done.filter((w) => w.start > weekAgo);
  const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(Date.now());
  templates.sort((a, b) => a.name.localeCompare(b.name));

  el.innerHTML = `
  <div class="dashboard">
    <header class="dashboard-heading">
      <h1>Hôm nay</h1>
      <p>${icon('calendar')}<span>${h(date)}</span></p>
    </header>
    <section class="workout-hero">
      <div class="hero-content">
        <h2>${cur ? 'Buổi tập đang diễn ra' : 'Buổi tập mới'}</h2>
        <p>${cur ? h(cur.name) : 'Ghi số set, rep và mức tạ.'}</p>
        ${cur
          ? `<a class="btn primary resume-workout" href="#/workout">${icon('play')}Tiếp tục tập</a>`
          : `<button class="primary" data-act="empty">${icon('plus')}Bắt đầu tập</button>`}
      </div>
    </section>
    ${remind ? `<a class="card row backup-reminder" href="#/settings">
      <span class="tile-icon">${icon('backup')}</span>
      <span class="grow"><b>Nên sao lưu dữ liệu</b><small class="muted">${last ? `Lần cuối ${fmtDate(last)}` : 'Chưa sao lưu lần nào'} · dữ liệu chỉ nằm trên máy này</small></span>
      ${icon('chevron')}
    </a>` : ''}
    <section>
      <h2 class="section-heading">7 ngày qua <a href="#/report">Báo cáo tuần</a></h2>
      <div class="stats week-stats">
        <div><span class="tile-icon">${icon('calendar')}</span><b data-count="${week.length}">${week.length}</b><small>Buổi tập</small></div>
        <div><span class="tile-icon">${icon('layers')}</span><b data-count="${week.reduce((a, w) => a + setCount(w), 0)}">${week.reduce((a, w) => a + setCount(w), 0)}</b><small>Set hoàn thành</small></div>
        <div><span class="tile-icon">${icon('dumbbell')}</span><b data-count="${week.reduce((a, w) => a + volume(w), 0)}">${fmtNum(week.reduce((a, w) => a + volume(w), 0))}<small> kg</small></b><small>Tổng khối lượng</small></div>
      </div>
    </section>
    ${top.lifts.length ? strength(top, ex) : ''}
    <div class="dashboard-lists">
      <section>
        <h2 class="section-heading">Giáo án <a href="#/templates">Quản lý</a></h2>
        ${templates.length ? templates.map((t) => `
          <div class="card row dashboard-item">
            <span class="tile-icon">${icon('layers')}</span>
            <div class="grow"><b>${h(t.name)}</b><div class="muted small">${t.items.length} bài</div></div>
            <button data-act="tpl" data-id="${h(t.id)}" ${cur ? 'disabled' : ''}>Tập</button>
          </div>`).join('') : `
          <div class="card empty-card">
            <span class="tile-icon">${icon('layers')}</span>
            <div class="grow"><b>Chưa có giáo án</b><p class="muted small">Lưu sẵn các bài bạn thường tập.</p></div>
            <a class="btn" href="#/templates/new">Tạo giáo án</a>
          </div>`}
      </section>
      <section>
        <h2 class="section-heading">Tập gần đây <a href="#/history">Xem tất cả</a></h2>
        ${done.slice(0, 3).map((w) => `
          <a class="card row dashboard-item" href="#/history/${h(w.id)}">
            <span class="tile-icon">${icon('dumbbell')}</span>
            <div class="grow"><b>${h(w.name)}</b><div class="muted small">${fmtDate(w.start)} · ${fmtDur(w.end - w.start)} · ${setCount(w)} set</div></div>
          </a>`).join('') || `
          <div class="card empty-card">
            <span class="tile-icon">${icon('calendar')}</span>
            <div class="grow"><b>Chưa có buổi tập</b><p class="muted small">Buổi đã hoàn thành sẽ hiện ở đây.</p></div>
          </div>`}
      </section>
    </div>
  </div>`;

  el.onclick = (ev) => {
    const b = ev.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'empty') startWorkout();
    if (b.dataset.act === 'tpl') startWorkout({ template: templates.find((t) => t.id === b.dataset.id) });
  };
}
