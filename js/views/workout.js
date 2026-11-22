import { all, put, del, activeWorkout } from '../db.js';
import { h, uid, e1rm, toast, settings, exMap, fmtNum } from '../util.js';
import { lastSets, records, doneSets } from '../stats.js';
import { pickExercise } from '../picker.js';
import * as timer from '../timer.js';

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
  if (template) for (const it of template.items) entries.push(await newEntry(it.exerciseId, it.sets, it.reps, it.rest));
  if (from) for (const e of from.entries) entries.push(await newEntry(e.exerciseId, doneSets(e).length, 0, e.rest));
  const name = template?.name || from?.name || 'Buổi tập ' + new Date().toLocaleDateString('vi-VN');
  await put('workouts', { id: uid(), name, start: Date.now(), end: null, templateId: template?.id || null, note: '', entries });
  location.hash = '#/workout';
}

export async function render(el) {
  const w = await activeWorkout();
  if (!w) { location.hash = '#/'; return; }
  const ex = exMap(await all('exercises'));
  const prev = {}, recs = {};
  const loadMeta = async (id) => {
    if (!(id in prev)) { prev[id] = await lastSets(id, w.id); recs[id] = await records(id, w.id); }
  };
  for (const e of w.entries) await loadMeta(e.exerciseId);
  const save = () => put('workouts', w);

  const setRow = (e, ei, s, si) => {
    const p = prev[e.exerciseId][si];
    const isPr = s.done && recs[e.exerciseId].e1rm > 0 && e1rm(+s.w, +s.r) > recs[e.exerciseId].e1rm;
    return `<div class="set${s.done ? ' done' : ''}" data-ei="${ei}" data-si="${si}">
      <span class="n">${si + 1}</span>
      <span class="prev muted">${p ? `${fmtNum(p.w)}×${p.r}` : '—'}</span>
      <input type="number" inputmode="decimal" step="0.5" data-f="w" aria-label="Mức tạ set ${si + 1} (kg)" value="${h(s.w)}" placeholder="${p ? h(p.w) : 'kg'}">
      <input type="number" inputmode="numeric" data-f="r" aria-label="Số rep set ${si + 1}" value="${h(s.r)}" placeholder="${p ? h(p.r) : 'rep'}">
      <button class="check${isPr ? ' pr' : ''}" data-act="check" aria-label="Đánh dấu set ${si + 1} hoàn thành" aria-pressed="${Boolean(s.done)}">${isPr ? 'PR' : '✓'}</button>
    </div>`;
  };

  const draw = () => {
    el.innerHTML = `
    <header class="top">
      <input class="title-input" data-f="name" aria-label="Tên buổi tập" value="${h(w.name)}">
      <div class="row"><span class="muted" id="elapsed"></span><span class="grow"></span>
        <button class="ghost danger" data-act="discard">Huỷ</button>
        <button class="primary" data-act="finish">Kết thúc</button></div>
    </header>
    ${w.entries.map((e, ei) => `
      <section class="card entry">
        <div class="row"><b class="grow">${h(ex[e.exerciseId]?.name || '?')}</b>
          <label class="muted small">Nghỉ <input type="number" inputmode="numeric" class="tiny" data-ei="${ei}" data-f="rest" value="${e.rest}">s</label>
          <button class="ghost icon" data-act="up" data-ei="${ei}" ${ei ? '' : 'disabled'}>↑</button>
          <button class="ghost icon danger" data-act="rmEntry" data-ei="${ei}">✕</button></div>
        <div class="set head muted small"><span>Set</span><span>Lần trước</span><span>kg</span><span>Rep</span><span></span></div>
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
      w.entries[row.dataset.ei].sets[row.dataset.si][f] = t.value === '' ? '' : Number(t.value);
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
      await save();
      row.outerHTML = setRow(e, ei, s, si);
      if (s.done) {
        timer.start(e.rest);
        const r = recs[e.exerciseId];
        if (r.e1rm > 0 && e1rm(s.w, s.r) > r.e1rm) toast(`🏆 PR mới! ~1RM ${fmtNum(e1rm(s.w, s.r))} kg`);
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
      if (!confirm(`Kết thúc buổi tập?${skipped ? `\n${skipped} set chưa đánh dấu sẽ bị bỏ.` : ''}`)) return;
      Object.assign(w, { entries, end: Date.now() });
      await save(); timer.stop();
      location.hash = '#/history/' + w.id; return;
    }
    await save();
    draw();
  };

  draw();
  return () => clearInterval(iv);
}
