import { all, activeWorkout } from '../db.js';
import { h, fmtDate, fmtDur, fmtNum } from '../util.js';
import { finished, volume, setCount } from '../stats.js';
import { startWorkout } from './workout.js';

const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

export async function render(el) {
  const [cur, templates, done] = await Promise.all([activeWorkout(), all('templates'), finished()]);
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
          ? `<a class="btn primary" href="#/workout">${icon('play')}Tiếp tục tập</a>`
          : `<button class="primary" data-act="empty">${icon('plus')}Bắt đầu tập</button>`}
      </div>
    </section>
    <section>
      <h2 class="section-heading">7 ngày qua <a href="#/report">Báo cáo tuần</a></h2>
      <div class="stats week-stats">
        <div><span class="tile-icon">${icon('calendar')}</span><b data-count="${week.length}">${week.length}</b><small>Buổi tập</small></div>
        <div><span class="tile-icon">${icon('layers')}</span><b data-count="${week.reduce((a, w) => a + setCount(w), 0)}">${week.reduce((a, w) => a + setCount(w), 0)}</b><small>Set hoàn thành</small></div>
        <div><span class="tile-icon">${icon('dumbbell')}</span><b data-count="${week.reduce((a, w) => a + volume(w), 0)}">${fmtNum(week.reduce((a, w) => a + volume(w), 0))}<small> kg</small></b><small>Tổng khối lượng</small></div>
      </div>
    </section>
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
