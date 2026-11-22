import { all, put, del } from '../db.js';
import { h, uid, fmtDate, fmtShort, fmtNum, exMap, countUp } from '../util.js';
import { finished, series, records } from '../stats.js';
import { lineChart, sparkline, stackedBars, yearGridSvg } from '../chart.js';
import { medals } from '../medals.js';
import { GLOSSARY, PHAM, gloss } from '../lore.js';
import { archiveHeader, hintLabel, journalHeader, phamSeal, termLabel } from './sections.js';
import { MUSCLE, yearGrid, years, weeklyVolume, inRange, liftTotal, mainLifts, muscleKey, topLifts } from '../insights.js';

const METRICS = { e1rm: '~1RM', top: 'Mức tạ cao nhất', vol: 'Khối lượng' };
const RANGES = { 1: '1T', 3: '3T', 6: '6T', 12: '1N', 0: 'Tất cả' };
const TABS = ['overview', 'ex', 'body', 'library', 'medal'];
const state = { tab: 'overview', exId: '', metric: 'e1rm', range: 6, year: new Date().getFullYear() };

/** Chú thích màu nhóm cơ: [[muscle, text]]. */
const legend = (items) => `<div class="chips legend">${items.map(([m, t]) => `<span class="chip legend-chip" data-muscle="${MUSCLE[m].key}"><i class="dot" aria-hidden="true"></i> ${h(m)}${t ? ` <b>${t}</b>` : ''}</span>`).join('')}</div>`;

const trend = (d) => (d > 0 ? `<span class="trend up">↑ ${fmtNum(d)}</span>` : d < 0 ? `<span class="trend down">↓ ${fmtNum(-d)}</span>` : '');

/** Thẻ mức tạ chính (~1RM) + tổng, mũi tên so với 30 ngày trước. */
function strength({ lifts, total }, ex) {
  return `<section class="strength">
      <h2>Sức mạnh</h2>
      <div class="lift-cards">${lifts.map((l) => `
        <a class="card lift-card" href="#/tang-thu/ex/${encodeURIComponent(l.exerciseId)}" data-muscle="${muscleKey(ex[l.exerciseId])}">
          <span class="lift-top"><b data-count="${l.max}">${fmtNum(l.max)}<small> kg</small></b>${trend(l.delta)}</span>
          <small class="lift-name">${h(ex[l.exerciseId]?.name || 'Bài đã xoá')}</small>
          ${sparkline(l.spark)}
        </a>`).join('')}</div>
      ${lifts.length > 1 ? `<div class="card lift-total">
        <span class="lift-top"><b data-count="${total.max}">${fmtNum(total.max)}<small> kg</small></b>${trend(total.delta)}<small class="muted">Tổng ~1RM ${lifts.length} bài · so với 30 ngày trước</small></span>
        ${lineChart(total.series.slice(-40), { unit: ' kg', area: true, labels: true, head: false })}
      </div>` : ''}
    </section>`;
}

export async function render(el, [tab, exId] = []) {
  if (tab === 'library' && exId === 'tu-dien') {
    el.innerHTML = `${archiveHeader('library')}
      <a class="btn ghost" href="#/tang-thu/library">← Thư viện</a>
      <section aria-labelledby="glossary-title"><h2 id="glossary-title">Từ điển</h2>
        <dl class="card glossary">${GLOSSARY.map(({ key, term: name, hint, gloss }) => `<div data-term="${h(key)}">
          <dt>${hintLabel(h(name), h(hint))}</dt><dd>${h(gloss)}</dd></div>`).join('')}</dl>
      </section>`;
    return;
  }
  state.tab = TABS.includes(tab) ? tab : 'overview';
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
    if (state.tab === 'overview' && !done.length) {
      body = `<section class="card empty-state">
        <span class="tile-icon empty-illustration"><svg aria-hidden="true"><use href="#i-trend"/></svg></span>
        <h2>Chưa có buổi tập để theo dõi</h2>
        <p class="muted">Hoàn thành buổi đầu tiên để xem ngày tập và khối lượng theo tuần.</p>
        <a class="btn primary" href="#/">Về Động phủ</a>
      </section>`;
    } else if (state.tab === 'overview') {
      const ys = years(done), lo = Math.min(...ys), hi = Math.max(...ys);
      const g = yearGrid(done, ex, state.year);
      const wv = weeklyVolume(done, ex, 12);
      const main = mainLifts(Object.values(ex)), sbd = liftTotal(done, main);
      const inWeeks = Object.keys(MUSCLE).filter((m) => wv.some((w) => w.byMuscle[m]));
      const top = topLifts(done);
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
        </section></div>
        ${top.lifts.length ? strength(top, ex) : ''}`;
    } else if (state.tab === 'ex') {
      if (!used.length) body = `<section class="card empty-state">
        <span class="tile-icon empty-illustration"><svg aria-hidden="true"><use href="#i-trend"/></svg></span>
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
      body = `<p class="gloss">${gloss('ledger')}</p>
        <div class="stats medals">${Object.keys(PHAM).map((tier) => `<div class="tier" data-tier="${tier}"${newTier(tier)}>
          ${phamSeal()}<b data-count="${m.counts[tier]}">${m.counts[tier]}</b><strong>${termLabel(tier)}</strong>
          <small class="gloss">${gloss(tier)}</small><small class="medal-fresh">Mới</small></div>`).join('')}</div>
        <div class="stats streaks">
          <div class="overload"><b data-count="${m.beats}">${m.beats}</b><small>lần vượt</small></div>
          <div class="streak"><b class="streak-multiplier" data-count="${m.streak.cur}">${m.streak.cur}</b><strong>${termLabel('streak')}</strong><small class="gloss">${gloss('streak')}</small><small>Kỷ lục ${m.streak.best}</small></div>
          <div class="streak"><b data-count="${m.weeks.cur}">${m.weeks.cur}<small> tuần</small></b><strong>${termLabel('weeks')}</strong><small class="gloss">${gloss('weeks')}</small><small>Kỷ lục ${m.weeks.best}</small></div></div>
        ${m.milestones.length ? `<h2>${termLabel('milestone')}</h2><p class="gloss">${gloss('milestone')}</p>${m.milestones.map((x) => `<div class="card milestone">
          <div class="stone-scene"><span class="stone-marker${x.reached ? ' engraved' : ''}">${x.reached ? `<b>${fmtNum(x.reached.kg)} kg</b><small>${fmtShort(x.reached.t)}</small>` : '<small>Chưa khắc bia</small>'}</span></div>
          <span class="grow"><b>${name(x.exerciseId)}</b><br><small class="muted">Nặng nhất ${fmtNum(x.best)} kg${x.next ? ` · mốc kế ${fmtNum(x.next)} kg` : ''}</small></span>
        </div>`).join('')}` : ''}
        ${m.recent.length ? `<h2>Phẩm gần đây</h2>${m.recent.slice(0, 20).map((r) => `<a class="card row medal-row"${isNew(r)} href="#/ky/${h(r.workoutId)}">
          <span class="grow"><b>${name(r.exerciseId)}</b><span class="tier small" data-tier="${r.tier}">${phamSeal()} ${termLabel(r.tier)} · ${h(r.msg)}</span></span>
          <span class="medal-meta"><small class="muted">${fmtShort(r.t)}</small><small class="medal-fresh">Mới</small></span></a>`).join('')}` : ''}`;
      if (!m.recent.length && !m.milestones.length) body += `<section class="card empty-state">
        <h2>Chưa có phẩm hay Thạch bi</h2><p class="muted">Tập lại một bài và vượt lần trước để ghi phẩm đầu tiên.</p></section>`;
    } else if (state.tab === 'library') {
      const list = Object.values(ex).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      body = `<a class="btn ghost" href="#/tang-thu/library/tu-dien">Từ điển</a>
      <h2>Thư viện bài tập</h2>${[...new Set(list.map((exercise) => exercise.muscle))].map((muscle) => `<details class="card library-group">
        <summary>${h(muscle)}</summary><ul>${list.filter((exercise) => exercise.muscle === muscle).map((exercise) => `<li>${h(exercise.name)}${exercise.custom ? ' <small class="muted">Tự tạo</small>' : ''}</li>`).join('')}</ul>
      </details>`).join('')}`;
    } else {
      const b = (await all('body')).sort((a, b) => a.date - b.date);
      body = `<form class="card row wrap" data-form="body">
          <input name="weight" type="number" inputmode="decimal" step="0.1" placeholder="Cân nặng (kg)" required>
          <input name="waist" type="number" inputmode="decimal" step="0.1" placeholder="Vòng eo (cm)">
          <button class="primary">Lưu</button></form>
        <section class="card">${lineChart(b.map((x) => ({ t: x.date, v: x.weight })), { unit: ' kg' })}</section>
        ${b.slice().reverse().map((x) => `<div class="card row"><span class="grow">${fmtDate(x.date)}</span><b>${fmtNum(x.weight)} kg</b>${x.waist ? `<span class="muted">${fmtNum(x.waist)} cm</span>` : ''}<button class="ghost icon danger" data-del="${h(x.id)}">✕</button></div>`).join('')}`;
    }
    el.innerHTML = (state.tab === 'medal' ? journalHeader('medal') : archiveHeader(state.tab)) + body;
    countUp(el);
  };

  el.onchange = (ev) => { if (ev.target.dataset.f === 'exId') { state.exId = ev.target.value; draw(); } };
  el.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.m) state.metric = b.dataset.m;
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
