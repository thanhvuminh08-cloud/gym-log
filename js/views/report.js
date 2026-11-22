import { all } from '../db.js';
import { h, fmtNum, fmtDur, fmtShort, exMap, toast } from '../util.js';
import { weekStart, weekReport, reportText, pct } from '../report.js';

/** #/report/<offset>: 0 = tuần này, -1 = tuần trước… */
export async function render(el, [off = '0']) {
  const offset = Math.min(0, Number(off) || 0);
  const [workouts, bodies, exs] = await Promise.all([all('workouts'), all('body'), all('exercises')]);
  const r = weekReport(workouts, bodies, exMap(exs), weekStart(Date.now(), offset));
  const delta = (k) => { const p = pct(r.cur[k], r.prev[k]); return p ? `<small class="muted report-delta">${h(p)} so với tuần trước</small>` : ''; };

  el.innerHTML = `
  <header class="top row report-top">
    <button class="ghost icon" data-act="week" data-k="${offset - 1}" aria-label="Tuần trước">‹</button>
    <div class="grow">
      <h1>Báo cáo tuần</h1>
      <p>${h(fmtShort(r.start))} – ${h(fmtShort(r.end - 1))}</p>
    </div>
    <button class="ghost icon" data-act="week" data-k="${offset + 1}" aria-label="Tuần sau" ${offset ? '' : 'disabled'}>›</button>
  </header>
  <div class="stats week-stats report-stats">
    <div><b data-count="${r.cur.sessions}">${r.cur.sessions}</b><small>Buổi tập</small>${delta('sessions')}</div>
    <div><b data-count="${r.cur.sets}">${r.cur.sets}</b><small>Set</small>${delta('sets')}</div>
    <div><b data-count="${Math.round(r.cur.vol)}">${fmtNum(r.cur.vol)}<small> kg</small></b><small>Khối lượng</small>${delta('vol')}</div>
  </div>
  ${r.cur.sessions ? `
  <section class="card report-summary">
    <div class="row"><span class="grow">Ngày tập</span><b>${h(r.days.map((d) => d.day).join(', '))}</b></div>
    <div class="row"><span class="grow">Thời gian</span><b>${h(fmtDur(r.cur.time))}</b></div>
    ${r.compared ? `<div class="row"><span class="grow">Vượt lần trước</span><b>${r.beats}/${r.compared} bài</b></div>
    <div class="row"><span class="grow">Huy chương</span><b>🥇${r.medals.gold} 🥈${r.medals.silver} 🥉${r.medals.bronze}</b></div>` : ''}
    ${r.rpe ? `<div class="row"><span class="grow">RPE trung bình</span><b>${fmtNum(r.rpe)}</b></div>` : ''}
    ${r.weight ? `<div class="row"><span class="grow">Cân nặng</span><b>${fmtNum(r.weight.kg)} kg${r.weight.delta != null ? ` <small class="muted">(${r.weight.delta >= 0 ? '+' : ''}${fmtNum(r.weight.delta)})</small>` : ''}</b></div>` : ''}
  </section>
  <h2 class="section-heading">Bài tập</h2>
  ${r.exercises.map((e) => `
    <section class="card report-ex"${e.best ? ` data-tier="${e.best.tier}"` : ''}>
      <div class="row"><b class="grow">${h(e.name)}</b><span class="muted small">${e.sets} set · ${fmtNum(e.vol)} kg</span></div>
      <div class="small">Top ${fmtNum(e.top.w)}×${e.top.r} · ~1RM ${fmtNum(e.e1)} kg</div>
      ${e.best ? `<div class="small target">${h(e.best.msg)}</div>` : ''}
    </section>`).join('')}
  <h2 class="section-heading">Buổi tập</h2>
  ${r.days.map((d) => `<a class="card row report-day" href="#/history/${h(d.id)}"><span class="grow">${h(d.name)}</span><span class="muted small">${h(d.day)} ${h(fmtShort(d.t))}</span></a>`).join('')}
  <button class="primary wide report-share" data-act="share">Chia sẻ / sao chép báo cáo</button>` : `
  <section class="card empty-state"><h2>Tuần này chưa có buổi tập</h2><p class="muted">Các buổi tập đã kết thúc trong tuần sẽ hiện ở đây.</p></section>`}`;

  el.onclick = async (ev) => {
    const b = ev.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'week') location.hash = `#/report/${b.dataset.k}`;
    if (b.dataset.act === 'share') {
      const text = reportText(r);
      try {
        if (navigator.share) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); toast('Đã sao chép báo cáo'); }
      } catch (e) {
        if (e.name !== 'AbortError') toast('Không chia sẻ được');
      }
    }
  };
}
