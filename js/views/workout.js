import { all, put, del, activeWorkout } from '../db.js';
import { h, uid, e1rm, toast, settings, exMap, fmtDate, fmtNum, celebrate, tap } from '../util.js';
import { term } from '../lore.js';
import { termLabel } from './sections.js';
import { lastSets, records, doneSets } from '../stats.js';
import { pickExercise } from '../picker.js';
import * as timer from '../timer.js';
import { compare, target, TIERS, RPE } from '../overload.js';
import { muscleKey } from '../insights.js';
import { lockedPath, filterByPath } from '../dao.js';
import { weekPlan } from '../schedule.js';
import { sfx } from '../sfx.js';

const PHAM_SFX = { gold: 'phamKim', silver: 'phamNgoc', bronze: 'phamDong' };

async function newEntry(exerciseId, nSets, reps, rest) {
  const prev = await lastSets(exerciseId);
  const n = nSets || Math.max(prev.length, 3);
  const sets = Array.from({ length: n }, (_, i) => {
    const p = prev[i] || prev[prev.length - 1];
    return { w: p?.w ?? '', r: reps || p?.r || '', done: false };
  });
  return { exerciseId, rest: rest || settings.get().rest, sets };
}

/** Tạo buổi tập mới (từ giáo án, từ buổi cũ, hoặc trống) rồi mở màn hình tập. */
export async function startWorkout({ template, from } = {}) {
  const cur = await activeWorkout();
  if (cur) { location.hash = '#/workout'; return toast('Đang có buổi tập dở — tiếp tục buổi đó'); }
  const entries = [];
  // Đã Nhập môn: chỉ tập bài trong Công pháp — giáo án/buổi cũ có bài ngoài thì bỏ và báo.
  const lock = lockedPath(settings.get());
  const items = filterByPath(template?.items || [], lock), olds = filterByPath(from?.entries || [], lock);
  for (const it of items.kept) entries.push(await newEntry(it.exerciseId, it.sets, it.reps, it.rest));
  for (const e of olds.kept) entries.push(await newEntry(e.exerciseId, doneSets(e).length, 0, e.rest));
  const dropped = items.dropped.length + olds.dropped.length;
  if (dropped) toast(`Bỏ ${dropped} bài ngoài danh sách bài theo mạch`);
  const name = template?.name || from?.name || 'Buổi tập tự do'; // ngày đã hiện cạnh tên ở mọi nơi → không lặp ngày trong tên
  await put('workouts', { id: uid(), name, start: Date.now(), end: null, templateId: template?.id || null, note: '', entries });
  // Bắt đầu từ trang chọn ở #/workout: hash không đổi → tự phát hashchange để vẽ lại.
  if (location.hash === '#/workout') dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = '#/workout';
}

export function workoutStartView({ scheduled = null, templates = [], last = null } = {}) {
  return `<section class="workout-start" aria-labelledby="workout-start-title">
    <header class="section-masthead" data-ink-surface="be-quan"><span class="tile-icon"><svg aria-hidden="true"><use href="#i-dumbbell"/></svg></span>
      <h1 id="workout-start-title">${termLabel('start')}</h1>
    </header>
    ${scheduled ? `<section class="card start-scheduled">
      <h2>Hôm nay có lịch tập</h2>
      <p>${h(scheduled.name || 'Tập tự do')}</p>
      <button type="button" class="primary" data-act="scheduled"${scheduled.id ? ` data-id="${h(scheduled.id)}"` : ''}>Tập theo lịch</button>
    </section>` : ''}
    ${templates.length ? `<section class="card start-templates">
      <h2>${termLabel('giaoAn')}</h2>
      <ul>${templates.map((t) => `<li class="row"><div class="grow"><b>${h(t.name)}</b><small class="muted">${t.items.length} bài</small></div>
        <button type="button" data-id="${h(t.id)}" aria-label="Tập theo giáo án ${h(t.name)}">Chọn</button></li>`).join('')}</ul>
    </section>` : ''}
    ${last ? `<section class="card">
      <h2>Lặp lại buổi gần nhất</h2>
      <p>${h(last.name)} <small class="muted">· ${fmtDate(last.start)}</small></p>
      <button type="button" data-act="again">Tập lại</button>
    </section>` : ''}
    <section class="card">
      <h2>Buổi trống</h2>
      <p class="muted small">Chọn từng bài khi tập.</p>
      <button type="button"${!scheduled ? ' class="primary"' : ''} data-act="empty">Bắt đầu buổi trống</button>
    </section>
  </section>`;
}

/** Chưa có buổi: trang chọn cách bắt đầu — theo lịch hôm nay · từ giáo án · lặp lại buổi gần nhất · buổi trống. */
async function renderStart(el) {
  const [templates, workouts] = await Promise.all([all('templates'), all('workouts')]);
  const done = workouts.filter((x) => x.end).sort((a, b) => b.start - a.start);
  const plan = weekPlan(settings.get().schedule, done);
  const scheduled = plan.state === 'due' ? (templates.find((t) => t.id === plan.templateId) || { name: 'Tập tự do' }) : null;
  const last = done.find((x) => x.entries?.length) || null;
  el.innerHTML = workoutStartView({ scheduled, templates, last });
  el.onclick = (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'again') startWorkout({ from: last });
    else if (b.dataset.id) startWorkout({ template: templates.find((t) => t.id === b.dataset.id) });
    else if (act === 'empty' || act === 'scheduled') startWorkout(); // lịch hôm nay không gắn giáo án = tập tự do
  };
}

export async function render(el) {
  const w = await activeWorkout();
  if (!w) return renderStart(el);
  const ex = exMap(await all('exercises'));
  const prev = {}, recs = {};
  const loadMeta = async (id) => {
    if (!(id in prev)) { prev[id] = await lastSets(id, w.id); recs[id] = await records(id, w.id); }
  };
  for (const e of w.entries) await loadMeta(e.exerciseId);
  const result = (e) => compare(e.sets, prev[e.exerciseId], recs[e.exerciseId].e1rm);
  const shown = new Map(w.entries.map((e) => [e, TIERS[result(e)?.tier] || 0])); // cấp đã cổ vũ, tránh lặp toast
  const save = () => put('workouts', w);

  const setRow = (e, ei, s, si) => {
    const p = prev[e.exerciseId][si];
    const isPr = s.done && recs[e.exerciseId].e1rm > 0 && e1rm(+s.w, +s.r) > recs[e.exerciseId].e1rm;
    return `<div class="set${s.done ? ' done' : ''}" data-ei="${ei}" data-si="${si}">
      <span class="n">${si + 1}</span>
      <span class="prev muted">${p ? `${fmtNum(p.w)}×${p.r}` : '—'}</span>
      <div class="set-values">
        <input type="number" inputmode="decimal" step="0.5" data-f="w" aria-label="Mức tạ set ${si + 1} (kg)" value="${h(s.w)}" placeholder="${p ? h(p.w) : 'kg'}">
        <span class="set-operator" aria-hidden="true">×</span>
        <input type="number" inputmode="numeric" data-f="r" aria-label="Số rep set ${si + 1}" value="${h(s.r)}" placeholder="${p ? h(p.r) : 'rep'}">
        <span class="set-operator" aria-hidden="true">@</span>
        <select class="rpe" data-f="rpe" aria-label="Độ khó (RPE) set ${si + 1}">
          <option value="">–</option>${RPE.map(([v, t]) => `<option value="${v}"${+s.rpe === v ? ' selected' : ''}>${v} · ${h(t)}</option>`).join('')}
        </select>
      </div>
      <button class="check${isPr ? ' pr' : ''}" data-act="check" aria-label="Đánh dấu set ${si + 1} hoàn thành" aria-pressed="${Boolean(s.done)}">${isPr ? 'PR' : '✓'}</button>
    </div>`;
  };

  const draw = () => {
    el.innerHTML = `
    <div class="section-masthead" data-ink-surface="be-quan"><h1>Bế quan</h1></div>
    <header class="top workout-controls">
      <input class="title-input" data-f="name" aria-label="Tên buổi tập" value="${h(w.name)}">
      <div class="row"><span class="muted" id="elapsed"></span><span class="grow"></span>
        <button class="ghost danger" data-act="discard">Huỷ</button>
        <button class="primary" data-act="finish">${termLabel('finish')}</button></div>
    </header>
    ${w.entries.map((e, ei) => `
      <section class="card entry" data-muscle="${muscleKey(ex[e.exerciseId])}">
        <div class="row"><b class="grow">${h(ex[e.exerciseId]?.name || '?')}</b>
          <label class="muted small entry-rest">${termLabel('rest')} <input type="number" inputmode="numeric" class="tiny" data-ei="${ei}" data-f="rest" value="${e.rest}">s</label>
          <button class="ghost icon" data-act="up" data-ei="${ei}" ${ei ? '' : 'disabled'}>↑</button>
          <button class="ghost icon danger" data-act="rmEntry" data-ei="${ei}">✕</button></div>
        ${prev[e.exerciseId].length ? `<div class="target small">${h(target(prev[e.exerciseId]))}</div>` : ''}
        <div class="set head muted small"><span>Set</span><span>Lần trước</span><span class="set-inputs-label">Kg × Rep @ RPE</span><span></span></div>
        ${e.sets.map((s, si) => setRow(e, ei, s, si)).join('')}
        <div class="row"><button class="ghost grow" data-act="addSet" data-ei="${ei}">+ Thêm set</button>
          <button class="ghost" data-act="rmSet" data-ei="${ei}" ${e.sets.length ? '' : 'disabled'}>− Set</button></div>
      </section>`).join('')}
    ${w.entries.length ? '<button class="wide" data-act="addEx">+ Thêm bài tập</button>' : `
      <section class="card empty-state">
        <span class="tile-icon"><svg aria-hidden="true"><use href="#i-dumbbell"/></svg></span>
        <h2>Chưa có bài tập</h2>
        <p class="muted">Chọn bài đầu tiên để ghi set.</p>
        <button class="primary" data-act="addEx">+ Thêm bài tập</button>
      </section>`}
    <textarea data-f="note" placeholder="Ghi chú buổi tập (cảm giác, ngủ, đau…)">${h(w.note)}</textarea>`;
    tickElapsed();
  };

  const tickElapsed = () => {
    const s = el.querySelector('#elapsed');
    if (s) { const m = Math.floor((Date.now() - w.start) / 60000); s.textContent = `⏱ ${m} phút`; }
  };
  const iv = setInterval(tickElapsed, 15000);

  el.oninput = (ev) => {
    const t = ev.target, f = t.dataset.f;
    if (!f) return;
    if (f === 'name') w.name = t.value;
    else if (f === 'note') w.note = t.value;
    else if (f === 'rest') w.entries[t.dataset.ei].rest = Number(t.value) || 0;
    else {
      const row = t.closest('.set');
      const s = w.entries[row.dataset.ei].sets[row.dataset.si];
      s[f] = t.value === '' ? '' : Number(t.value);
      if (f === 'rpe' && s.rpe === '') delete s.rpe;
    }
    save();
  };

  el.onclick = async (ev) => {
    const b = ev.target.closest('button[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const ei = Number(b.dataset.ei ?? b.closest('.set')?.dataset.ei);
    if (act === 'check') {
      const row = b.closest('.set'), si = Number(row.dataset.si), e = w.entries[ei], s = e.sets[si];
      if (!s.done) {
        const p = prev[e.exerciseId][si];
        if (s.w === '' && p) s.w = p.w;
        if (s.r === '' && p) s.r = p.r;
        if (s.w === '') s.w = 0;
        if (!(s.r > 0)) return toast('Nhập số rep trước');
      }
      s.done = !s.done;
      // Set kế tiếp còn trống → tự điền kg × rep của set vừa xong (vẫn sửa được trước khi đánh dấu).
      const nx = e.sets[si + 1], fill = s.done && nx && !nx.done && (nx.w === '' || nx.r === '');
      if (fill) { if (nx.w === '') nx.w = s.w; if (nx.r === '') nx.r = s.r; }
      await save();
      row.outerHTML = setRow(e, ei, s, si);
      if (fill) el.querySelector(`.set[data-ei="${ei}"][data-si="${si + 1}"]`).outerHTML = setRow(e, ei, nx, si + 1);
      if (s.done) {
        timer.start(e.rest);
        const res = result(e), lvl = TIERS[res?.tier] || 0;
        if (lvl > (shown.get(e) || 0)) {
          shown.set(e, lvl); toast(`${term(res.tier)} · ${res.msg}`, 3000);
          celebrate(el.querySelector(`.set[data-ei="${ei}"][data-si="${si}"]`), res.tier);
          sfx(PHAM_SFX[res.tier]);
        } else {
          // Set thường vừa lưu: ấn niêm + âm nhẹ, gỡ lớp sau hiệu ứng.
          const r = el.querySelector(`.set[data-ei="${ei}"][data-si="${si}"]`);
          r?.classList.add('is-set-sealed'); setTimeout(() => r?.classList.remove('is-set-sealed'), 480);
          tap(); sfx('setXong');
        }
      }
      return;
    }
    if (act === 'addSet') {
      const e = w.entries[ei], last = e.sets[e.sets.length - 1];
      e.sets.push({ w: last?.w ?? '', r: last?.r ?? '', done: false });
    } else if (act === 'rmSet') w.entries[ei].sets.pop();
    else if (act === 'rmEntry') { if (!confirm('Xoá bài tập này khỏi buổi tập?')) return; w.entries.splice(ei, 1); }
    else if (act === 'up') [w.entries[ei - 1], w.entries[ei]] = [w.entries[ei], w.entries[ei - 1]];
    else if (act === 'addEx') {
      const x = await pickExercise();
      if (!x) return;
      ex[x.id] = x;
      await loadMeta(x.id);
      w.entries.push(await newEntry(x.id));
    } else if (act === 'discard') {
      if (!confirm('Huỷ buổi tập này? Dữ liệu buổi này sẽ bị xoá.')) return;
      timer.stop(); await del('workouts', w.id); location.hash = '#/'; return;
    } else if (act === 'finish') {
      const entries = w.entries.map((e) => ({ ...e, sets: doneSets(e) })).filter((e) => e.sets.length);
      if (!entries.length) return toast('Chưa có set nào được đánh dấu xong');
      const skipped = w.entries.reduce((a, e) => a + e.sets.length, 0) - entries.reduce((a, e) => a + e.sets.length, 0);
      if (!confirm(`${term('finish')} và lưu buổi tập?${skipped ? `\n${skipped} set chưa đánh dấu sẽ bị bỏ.` : ''}`)) return;
      Object.assign(w, { entries, end: Date.now() });
      await save(); timer.stop(); sfx('xuatQuan');
      const up = entries.filter((e) => result(e)).length, cmp = entries.filter((e) => prev[e.exerciseId].length).length;
      if (cmp) toast(up ? `💪 Vượt lần trước ${up}/${cmp} bài!` : 'Buổi sau cố vượt lần trước nhé 💪', 3500);
      location.hash = '#/ky/' + w.id;
      import('./hero.js').then(async (m) => m.ceremony(await m.loadProfile())); // Đột phá / nhiệm vụ vừa xong
      return;
    }
    await save();
    draw();
  };

  draw();
  return () => clearInterval(iv);
}
