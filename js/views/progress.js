import { all, put, del } from '../db.js';
import { h, uid, fmtDate, fmtNum, exMap } from '../util.js';
import { finished, series, records } from '../stats.js';
import { lineChart } from '../chart.js';

const METRICS = { e1rm: '~1RM', top: 'Mức tạ cao nhất', vol: 'Khối lượng' };
const state = { tab: 'ex', exId: '', metric: 'e1rm' };

export async function render(el) {
  const ex = exMap(await all('exercises'));
  const done = await finished();
  const counts = {};
  for (const w of done) for (const e of w.entries) counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1;
  const used = Object.keys(counts).filter((id) => ex[id]).sort((a, b) => counts[b] - counts[a]);
  if (!used.includes(state.exId)) state.exId = used[0] || '';

  const draw = async () => {
    let body = '';
    if (state.tab === 'ex') {
      if (!used.length) body = `<section class="card empty-state">
        <span class="tile-icon"><svg aria-hidden="true"><use href="#i-trend"/></svg></span>
        <h2>Chưa có dữ liệu bài tập</h2>
        <p class="muted">Hoàn thành buổi tập để xem tiến độ theo từng bài.</p>
      </section>`;
      else {
        const s = await series(state.exId), r = await records(state.exId);
        body = `<select data-f="exId">${used.map((id) => `<option value="${h(id)}" ${id === state.exId ? 'selected' : ''}>${h(ex[id].name)} (${counts[id]})</option>`).join('')}</select>
        <div class="chips">${Object.entries(METRICS).map(([k, v]) => `<button class="chip${k === state.metric ? ' on' : ''}" data-m="${k}">${v}</button>`).join('')}</div>
        <section class="card">${lineChart(s.map((p) => ({ t: p.t, v: p[state.metric] })), { unit: ' kg' })}</section>
        <div class="stats"><div><b>${fmtNum(r.e1rm)}</b><small>~1RM tốt nhất</small></div><div><b>${fmtNum(r.w)}</b><small>tạ nặng nhất</small></div><div><b>${fmtNum(r.vol)}</b><small>set tốt nhất (kg×rep)</small></div></div>`;
      }
    } else {
      const b = (await all('body')).sort((a, b) => a.date - b.date);
      body = `<form class="card row wrap" data-form="body">
          <input name="weight" type="number" inputmode="decimal" step="0.1" placeholder="Cân nặng (kg)" required>
          <input name="waist" type="number" inputmode="decimal" step="0.1" placeholder="Vòng eo (cm)">
          <button class="primary">Lưu</button></form>
        <section class="card">${lineChart(b.map((x) => ({ t: x.date, v: x.weight })), { unit: ' kg' })}</section>
        ${b.slice().reverse().map((x) => `<div class="card row"><span class="grow">${fmtDate(x.date)}</span><b>${fmtNum(x.weight)} kg</b>${x.waist ? `<span class="muted">${fmtNum(x.waist)} cm</span>` : ''}<button class="ghost icon danger" data-del="${h(x.id)}">✕</button></div>`).join('')}`;
    }
    el.innerHTML = `<h1>Tiến độ</h1>
      <div class="tabs"><button class="${state.tab === 'ex' ? 'on' : ''}" data-tab="ex">Bài tập</button><button class="${state.tab === 'body' ? 'on' : ''}" data-tab="body">Cơ thể</button></div>${body}`;
  };

  el.onchange = (ev) => { if (ev.target.dataset.f === 'exId') { state.exId = ev.target.value; draw(); } };
  el.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) state.tab = b.dataset.tab;
    else if (b.dataset.m) state.metric = b.dataset.m;
    else if (b.dataset.del) { if (!confirm('Xoá số đo này?')) return; await del('body', b.dataset.del); }
    else return;
    draw();
  };
  el.onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    await put('body', { id: uid(), date: Date.now(), weight: Number(f.get('weight')), waist: Number(f.get('waist')) || null });
    draw();
  };
  await draw();
}
