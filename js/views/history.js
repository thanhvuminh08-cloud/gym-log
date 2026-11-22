import { all, get, put, del } from '../db.js';
import { h, uid, fmtDate, fmtTime, fmtDur, fmtNum, e1rm, exMap, toast } from '../util.js';
import { finished, volume, setCount } from '../stats.js';
import { startWorkout } from './workout.js';
import { analyzeWorkout, TIER_LABEL } from '../overload.js';

export async function render(el, [id]) {
  const ex = exMap(await all('exercises'));
  if (id) return detail(el, id, ex);

  const list = await finished();
  let month = '';
  el.innerHTML = `<h1>Lịch sử</h1>` + (list.map((w) => {
    const m = new Date(w.start).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    const head = m !== month ? `<h2>${(month = m)}</h2>` : '';
    return `${head}<a class="card" href="#/history/${h(w.id)}"><b>${h(w.name)}</b>
      <div class="muted small">${fmtDate(w.start)} · ${fmtDur(w.end - w.start)} · ${setCount(w)} set · ${fmtNum(volume(w))} kg</div>
      <div class="small">${w.entries.map((e) => h(ex[e.exerciseId]?.name || '?')).join(', ')}</div></a>`;
  }).join('') || `<section class="card empty-state">
    <span class="tile-icon"><svg aria-hidden="true"><use href="#i-calendar"/></svg></span>
    <h2>Chưa có buổi tập hoàn thành</h2>
    <p class="muted">Các buổi tập đã lưu sẽ hiện ở đây.</p>
    <a class="btn primary" href="#/">Về Hôm nay</a>
  </section>`);
}

async function detail(el, id, ex) {
  const w = await get('workouts', id);
  if (!w) { el.innerHTML = '<p>Không tìm thấy buổi tập.</p>'; return; }
  const ov = analyzeWorkout(w, await finished());
  const nCmp = ov.filter((o) => !o.first).length, nUp = ov.filter((o) => o.res).length;
  const tierRow = (o) => o.res ? `<div class="tier small" data-tier="${o.res.tier}">${TIER_LABEL[o.res.tier]} · ${h(o.res.msg)}</div>`
    : `<div class="tier small muted" data-tier="${o.first ? 'first' : 'none'}">${o.first ? 'Lần đầu tập bài này' : 'Chưa vượt lần trước'}</div>`;
  el.innerHTML = `
  <a href="#/history" class="small">← Lịch sử</a>
  <h1>${h(w.name)}</h1>
  <p class="muted">${fmtDate(w.start)} · ${fmtTime(w.start)}–${fmtTime(w.end)} (${fmtDur(w.end - w.start)})</p>
  <div class="stats"><div><b>${setCount(w)}</b><small>set</small></div><div><b>${fmtNum(volume(w))}</b><small>kg khối lượng</small></div><div><b>${w.entries.length}</b><small>bài</small></div>${nCmp ? `<div class="overload"><b>${nUp}/${nCmp}</b><small>bài vượt lần trước</small></div>` : ''}</div>
  ${w.entries.map((e, ei) => {
    const best = Math.max(...e.sets.map((s) => e1rm(s.w, s.r)));
    return `<section class="card"><div class="row"><b class="grow">${h(ex[e.exerciseId]?.name || '?')}</b><span class="muted small">~1RM ${fmtNum(best)}</span></div>
      ${tierRow(ov[ei])}
      <div class="small">${e.sets.map((s, i) => `<span class="pill">${i + 1}: ${fmtNum(s.w)}×${s.r}</span>`).join('')}</div></section>`;
  }).join('')}
  ${w.note ? `<section class="card"><b>Ghi chú</b><p>${h(w.note)}</p></section>` : ''}
  <div class="row wrap">
    <button data-act="again">Tập lại buổi này</button>
    <button data-act="tpl">Lưu thành giáo án</button>
    <button class="ghost danger" data-act="del">Xoá</button>
  </div>`;

  el.onclick = async (ev) => {
    const act = ev.target.closest('button[data-act]')?.dataset.act;
    if (act === 'again') startWorkout({ from: w });
    if (act === 'tpl') {
      const name = prompt('Tên giáo án:', w.name);
      if (!name) return;
      await put('templates', { id: uid(), name, items: w.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.length, reps: e.sets[0]?.r || 8, rest: e.rest })) });
      toast('Đã lưu giáo án');
    }
    if (act === 'del' && confirm('Xoá vĩnh viễn buổi tập này?')) { await del('workouts', w.id); location.hash = '#/history'; }
  };
}
