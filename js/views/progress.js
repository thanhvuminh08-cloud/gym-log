import { all, put, del } from '../db.js';
import { h, uid, fmtDate, fmtShort, fmtNum, exMap, countUp } from '../util.js';
import { finished, series, records } from '../stats.js';
import { lineChart, stackedBars, yearGridSvg } from '../chart.js';
import { medals } from '../medals.js';
import { TIER_LABEL } from '../overload.js';
import { MUSCLE, yearGrid, years, weeklyVolume, inRange, liftTotal, mainLifts } from '../insights.js';

const METRICS = { e1rm: '~1RM', top: 'Mức tạ cao nhất', vol: 'Khối lượng' };
const RANGES = { 1: '1T', 3: '3T', 6: '6T', 12: '1N', 0: 'Tất cả' };
const TABS = { overview: 'Tổng quan', ex: 'Bài tập', body: 'Cơ thể', medal: 'Huy chương' };
const state = { tab: 'overview', exId: '', metric: 'e1rm', range: 6, year: new Date().getFullYear() };

/** Chú thích màu nhóm cơ: [[muscle, text]]. */
const legend = (items) => `<div class="chips legend">${items.map(([m, t]) => `<span class="chip legend-chip" data-muscle="${MUSCLE[m].key}"><i class="dot" aria-hidden="true"></i> ${h(m)}${t ? ` <b>${t}</b>` : ''}</span>`).join('')}</div>`;

export async function render(el, [tab, exId] = []) {
  if (TABS[tab]) state.tab = tab;
  if (exId) state.exId = exId;
  const ex = exMap(await all('exercises'));
  const done = await finished();
  const counts = {};
  for (const w of done) for (const e of w.entries) counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1;
  const used = Object.keys(counts).filter((id) => ex[id]).sort((a, b) => counts[b] - counts[a]);
  if (!used.includes(state.exId)) state.exId = used[0] || '';

  let seen; // mốc "đã xem huy chương", đọc 1 lần mỗi lần vào trang để đổi tab qua lại không mất dấu "mới"
  const draw = async () => {
    let body = '';
    if (state.tab === 'overview') {
      const ys = years(done), lo = Math.min(...ys), hi = Math.max(...ys);
      const g = yearGrid(done, ex, state.year);
      const wv = weeklyVolume(done, ex, 12);
      const main = mainLifts(Object.values(ex)), sbd = liftTotal(done, main);
      const inWeeks = Object.keys(MUSCLE).filter((m) => wv.some((w) => w.byMuscle[m]));
      body = `<div class="progress-overview"><section class="card year-card">
          <div class="row year-nav"><button class="ghost icon" data-y="${state.year - 1}" ${state.year <= lo ? 'disabled' : ''} aria-label="Năm trước">‹</button>
            <b class="grow">${state.year}</b>
            <button class="ghost icon" data-y="${state.year + 1}" ${state.year >= hi ? 'disabled' : ''} aria-label="Năm sau">›</button></div>
          <div class="year-total"><b data-count="${g.total}">${g.total}</b><small> ngày tập</small></div>
          <div class="year-muscle-days" data-year-muscle-days>
            ${legend(Object.keys(MUSCLE).map((m) => [m, `${g.counts[m] || 0} ngày`]))}
          </div>
          ${yearGridSvg(g)}
        </section>
        <section class="card summary-card strength-total" data-strength-total>
          <h2>Tổng</h2>
          <div class="lift-top"><b><span data-strength-total-value data-count="${sbd.max}">${fmtNum(sbd.max)}</span><small> kg</small></b>${sbd.delta ? `<span class="trend ${sbd.delta > 0 ? 'up' : 'down'}">${sbd.delta > 0 ? '↑' : '↓'} ${fmtNum(Math.abs(sbd.delta))}</span>` : ''}</div>
          <p class="muted small">Tổng ~1RM ${main.length ? main.map((id) => `${h(ex[id].name)} ${fmtNum(sbd.parts[id] || 0)}`).join(' · ') : 'Squat, Bench Press, Deadlift'}${sbd.delta ? ' · so với 30 ngày trước' : ''}</p>
          <div data-strength-total-chart>
            ${sbd.series.length > 1 ? lineChart(sbd.series.slice(-40), { unit: ' kg', area: true, labels: true, head: false }) : `<p class="muted small">Tập Squat, Bench Press hoặc Deadlift để xem biểu đồ.</p>`}
          </div>
        </section>
        <section class="card volume-card">
          <h2>Khối lượng 12 tuần</h2>
          ${stackedBars(wv)}
          ${legend(inWeeks.map((m) => [m, '']))}
        </section></div>`;
    } else if (state.tab === 'ex') {
      if (!used.length) body = `<section class="card empty-state">
        <span class="tile-icon"><svg aria-hidden="true"><use href="#i-trend"/></svg></span>
        <h2>Chưa có dữ liệu bài tập</h2>
        <p class="muted">Hoàn thành buổi tập để xem tiến độ theo từng bài.</p>
      </section>`;
      else {
        const s = await series(state.exId), r = await records(state.exId);
        const pts = inRange(s.map((p) => ({ t: p.t, v: p[state.metric] })), state.range);
        const diff = pts.length > 1 ? pts.at(-1).v - pts[0].v : 0;
        body = `<select data-f="exId">${used.map((id) => `<option value="${h(id)}" ${id === state.exId ? 'selected' : ''}>${h(ex[id].name)} (${counts[id]})</option>`).join('')}</select>
        <div class="max-box"><b data-count="${r.e1rm}">${fmtNum(r.e1rm)}<small> kg</small></b><small>Max hiện tại (~1RM)</small></div>
        <div class="chips">${Object.entries(METRICS).map(([k, v]) => `<button class="chip${k === state.metric ? ' on' : ''}" data-m="${k}">${v}</button>`).join('')}</div>
        <div class="chips range">${Object.entries(RANGES).map(([k, v]) => `<button class="chip${Number(k) === state.range ? ' on' : ''}" data-range="${k}">${v}</button>`).join('')}</div>
        <section class="card">
          <div class="chart-head"><b>${pts.length ? fmtNum(pts.at(-1).v) : '–'} kg</b>${diff ? `<span class="trend ${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '↑' : '↓'} ${fmtNum(Math.abs(diff))}</span>` : ''}<span class="muted"> ${pts.length} buổi${state.range ? ` · ${RANGES[state.range]}` : ''}</span></div>
          ${lineChart(pts, { unit: ' kg', area: true, labels: true, head: false })}</section>
        <div class="stats"><div><b data-count="${r.e1rm}">${fmtNum(r.e1rm)}</b><small>~1RM tốt nhất</small></div><div><b data-count="${r.w}">${fmtNum(r.w)}</b><small>tạ nặng nhất</small></div><div><b data-count="${r.vol}">${fmtNum(r.vol)}</b><small>set tốt nhất (kg×rep)</small></div></div>`;
      }
    } else if (state.tab === 'medal') {
      const m = medals(done);
      const name = (id) => h(ex[id]?.name || 'Bài đã xoá');
      // Huy chương mới kể từ lần mở tab trước (lần đầu mở: không đánh dấu gì).
      if (seen === undefined) {
        seen = Infinity;
        try { seen = Number(localStorage.getItem('gym.medalSeen')) || Infinity; localStorage.setItem('gym.medalSeen', Date.now()); } catch {}
      }
      const fresh = m.recent.filter((r) => r.end > seen), isNew = (r) => (fresh.includes(r) ? ' data-new' : '');
      const newTier = (t) => (fresh.some((r) => r.tier === t) ? ' data-new' : '');
      body = !m.compared && !m.milestones.length ? `<section class="card empty-state">
        <span class="tile-icon"><svg aria-hidden="true"><use href="#i-trend"/></svg></span>
        <h2>Chưa có huy chương</h2>
        <p class="muted">Tập lại một bài và vượt lần trước để nhận huy chương đầu tiên.</p>
      </section>` : `<div class="stats medals">
          <div class="tier" data-tier="gold"${newTier('gold')}><b data-count="${m.counts.gold}">${m.counts.gold}</b><small>🥇 Vàng</small><small class="medal-fresh">Mới</small></div>
          <div class="tier" data-tier="silver"${newTier('silver')}><b data-count="${m.counts.silver}">${m.counts.silver}</b><small>🥈 Bạc</small><small class="medal-fresh">Mới</small></div>
          <div class="tier" data-tier="bronze"${newTier('bronze')}><b data-count="${m.counts.bronze}">${m.counts.bronze}</b><small>🥉 Đồng</small><small class="medal-fresh">Mới</small></div></div>
        <div class="stats streaks">
          <div class="overload"><b data-count="${m.beats}">${m.beats}</b><small>lần vượt</small></div>
          <div class="streak"><b data-count="${m.streak.cur}">${m.streak.cur}</b><small>buổi vượt liên tiếp · kỷ lục ${m.streak.best}</small></div>
          <div class="streak"><b data-count="${m.weeks.cur}">${m.weeks.cur}</b><small>tuần tập liên tiếp · kỷ lục ${m.weeks.best}</small></div></div>
        ${m.milestones.length ? `<h2>Mốc tạ</h2>${m.milestones.map((x) => `<div class="card row milestone">
          <span class="grow"><b>${name(x.exerciseId)}</b><br><small class="muted">${x.reached ? `Mốc ${fmtNum(x.reached.kg)} kg · ${fmtShort(x.reached.t)}` : 'Chưa đạt mốc'}${x.next ? ` · tiếp: ${fmtNum(x.next)} kg (còn ${fmtNum(x.next - x.best)})` : ''}</small></span>
          <b>${fmtNum(x.best)} kg</b></div>`).join('')}` : ''}
        ${m.recent.length ? `<h2>Huy chương gần đây</h2>${m.recent.slice(0, 20).map((r) => `<a class="card row medal-row"${isNew(r)} href="#/history/${h(r.workoutId)}">
          <span class="grow"><b>${name(r.exerciseId)}</b><span class="tier small" data-tier="${r.tier}">${TIER_LABEL[r.tier]} · ${h(r.msg)}</span></span>
          <span class="medal-meta"><small class="muted">${fmtShort(r.t)}</small><small class="medal-fresh">Mới</small></span></a>`).join('')}` : ''}`;
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
      <div class="tabs">${Object.entries(TABS).map(([k, v]) => `<button class="${state.tab === k ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>${body}`;
    countUp(el);
  };

  el.onchange = (ev) => { if (ev.target.dataset.f === 'exId') { state.exId = ev.target.value; draw(); } };
  el.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) state.tab = b.dataset.tab;
    else if (b.dataset.m) state.metric = b.dataset.m;
    else if (b.dataset.range) state.range = Number(b.dataset.range);
    else if (b.dataset.y) state.year = Number(b.dataset.y);
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
