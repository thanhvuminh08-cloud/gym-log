import { all, get, put, del } from '../db.js';
import { h, uid, exMap, settings, toast } from '../util.js';
import { pickExercise } from '../picker.js';
import { startWorkout } from './workout.js';

export async function render(el, [id]) {
  const ex = exMap(await all('exercises'));
  if (id) return edit(el, id, ex);
  const list = (await all('templates')).sort((a, b) => a.name.localeCompare(b.name));
  el.innerHTML = `<h1>Giáo án</h1>
  ${list.map((t) => `<div class="card"><div class="row"><b class="grow">${h(t.name)}</b>
      <a class="btn ghost" href="#/templates/${h(t.id)}">Sửa</a><button data-id="${h(t.id)}">Tập</button></div>
      <div class="small muted">${t.items.map((i) => `${h(ex[i.exerciseId]?.name || '?')} ${i.sets}×${i.reps}`).join(' · ')}</div></div>`).join('')
    || `<section class="card empty-state">
      <span class="tile-icon empty-illustration is-template"><svg aria-hidden="true"><use href="#i-layers"/></svg></span>
      <h2>Chưa có giáo án</h2>
      <p class="muted">Tạo giáo án để lưu bài tập và số set cho các buổi sau.</p>
      <a class="btn primary" href="#/templates/new">+ Tạo giáo án</a>
    </section>`}
  ${list.length ? '<a class="btn primary wide" href="#/templates/new">+ Tạo giáo án</a>' : ''}`;
  el.onclick = (ev) => {
    const b = ev.target.closest('button[data-id]');
    if (b) startWorkout({ template: list.find((t) => t.id === b.dataset.id) });
  };
}

async function edit(el, id, ex) {
  const t = id === 'new' ? { id: uid(), name: '', items: [] } : await get('templates', id);
  if (!t) { el.innerHTML = '<p>Không tìm thấy giáo án.</p>'; return; }
  const draw = () => {
    el.innerHTML = `<a href="#/templates" class="small">← Giáo án</a>
    <h1>${id === 'new' ? 'Giáo án mới' : 'Sửa giáo án'}</h1>
    <input class="title-input" data-f="name" placeholder="Tên (vd: Push A)" value="${h(t.name)}">
    ${t.items.map((it, i) => `<div class="card" data-i="${i}">
      <div class="row"><b class="grow">${h(ex[it.exerciseId]?.name || '?')}</b>
        <button class="ghost icon" data-act="up" ${i ? '' : 'disabled'}>↑</button>
        <button class="ghost icon danger" data-act="rm">✕</button></div>
      <div class="row small">
        <label>Set <input class="tiny" type="number" inputmode="numeric" data-f="sets" value="${it.sets}"></label>
        <label>Rep <input class="tiny" type="number" inputmode="numeric" data-f="reps" value="${it.reps}"></label>
        <label>Nghỉ <input class="tiny" type="number" inputmode="numeric" data-f="rest" value="${it.rest}">s</label>
      </div></div>`).join('')}
    <button class="wide" data-act="add">+ Thêm bài tập</button>
    <div class="row"><button class="primary grow" data-act="save">Lưu</button>
      ${id === 'new' ? '' : '<button class="ghost danger" data-act="del">Xoá</button>'}</div>`;
  };
  el.oninput = (ev) => {
    const f = ev.target.dataset.f;
    if (f === 'name') t.name = ev.target.value;
    else if (f) t.items[ev.target.closest('[data-i]').dataset.i][f] = Number(ev.target.value) || 0;
  };
  el.onclick = async (ev) => {
    const b = ev.target.closest('button[data-act]');
    if (!b) return;
    const i = Number(b.closest('[data-i]')?.dataset.i), act = b.dataset.act;
    if (act === 'add') {
      const x = await pickExercise();
      if (!x) return;
      ex[x.id] = x;
      t.items.push({ exerciseId: x.id, sets: 3, reps: 8, rest: settings.get().rest });
    } else if (act === 'rm') t.items.splice(i, 1);
    else if (act === 'up') [t.items[i - 1], t.items[i]] = [t.items[i], t.items[i - 1]];
    else if (act === 'save') {
      if (!t.name.trim()) return toast('Nhập tên giáo án');
      await put('templates', { ...t, name: t.name.trim() });
      toast('Đã lưu'); location.hash = '#/templates'; return;
    } else if (act === 'del') {
      if (!confirm('Xoá giáo án này?')) return;
      await del('templates', t.id); location.hash = '#/templates'; return;
    }
    draw();
  };
  draw();
}
