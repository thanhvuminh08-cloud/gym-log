import { all, get, put, del } from '../db.js';
import { h, uid, exMap, settings, toast } from '../util.js';
import { pickExercise } from '../picker.js';
import { startWorkout } from './workout.js';
import { NAV, term } from '../lore.js';
import { pathOptions } from '../dao.js';
import { cleanSchedule } from '../schedule.js';

const days = [[1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [0, 'CN']];

function pathPreview(dao, exercises) {
  return dao?.at
    ? `<ul class="plan-meridians">${pathOptions(exercises).map(({ key, name, options }) => {
      const selected = options.filter((exercise) => dao.path?.[key]?.includes(exercise.id));
      return `<li data-muscle="${key}"><b>${h(name)}</b><span>${selected.map((exercise) => h(exercise.name)).join(' · ') || 'Chưa chọn bài'}</span></li>`;
    }).join('')}</ul>`
    : '<p class="muted">Chọn các bài cho từng mạch trong Nhập môn.</p>';
}

export async function render(el, [id]) {
  const ex = exMap(await all('exercises'));
  if (id) return edit(el, id, ex);
  const list = (await all('templates')).sort((a, b) => a.name.localeCompare(b.name));
  const { dao, schedule, weekGoal } = settings.get(), plan = cleanSchedule(schedule);
  const { label, icon } = NAV.find((item) => item.key === 'cong-phap');
  el.innerHTML = `<header class="section-masthead"><span class="tile-icon"><svg aria-hidden="true"><use href="#${icon}"/></svg></span><h1>${label}</h1></header>
  <section class="card plan-overview">
    <h2>Thất mạch</h2>${pathPreview(dao, Object.values(ex))}
    <a class="btn ghost" href="#/nhap-mon${dao?.at ? '/4' : ''}">${dao?.at ? 'Sửa Công pháp' : 'Nhập môn'}</a>
  </section>
  <section class="card plan-overview">
    <h2>Lịch bế quan</h2>
    <ul class="plan-week">${days.map(([day, name]) => `<li${day in plan ? ' class="scheduled"' : ''}><b>${name}</b>
      <small>${day in plan ? h(list.find((t) => t.id === plan[day])?.name || 'Tập tự do') : 'Nghỉ'}</small></li>`).join('')}</ul>
    <div class="row wrap"><small class="grow muted">Mục tiêu ${h(weekGoal)} buổi / tuần</small><a class="btn ghost" href="#/tang-thu/cai-dat">Đổi lịch và mục tiêu</a></div>
  </section>
  <h2>Giáo án</h2>
  ${list.map((t) => `<div class="card"><div class="row"><b class="grow">${h(t.name)}</b>
      <a class="btn ghost" href="#/cong-phap/${h(t.id)}">Sửa</a><button data-id="${h(t.id)}">${term('start')}</button></div>
      <div class="small muted">${t.items.map((i) => `${h(ex[i.exerciseId]?.name || '?')} ${i.sets}×${i.reps}`).join(' · ')}</div></div>`).join('')
    || `<section class="card empty-state">
      <span class="tile-icon empty-illustration is-template"><svg aria-hidden="true"><use href="#i-layers"/></svg></span>
      <h2>Chưa có giáo án</h2>
      <p class="muted">Tạo giáo án để lưu bài tập và số set cho các buổi sau.</p>
      <a class="btn primary" href="#/cong-phap/new">+ Tạo giáo án</a>
    </section>`}
  ${list.length ? '<a class="btn primary wide" href="#/cong-phap/new">+ Tạo giáo án</a>' : ''}`;
  el.onclick = (ev) => {
    const b = ev.target.closest('button[data-id]');
    if (b) startWorkout({ template: list.find((t) => t.id === b.dataset.id) });
  };
}

async function edit(el, id, ex) {
  const t = id === 'new' ? { id: uid(), name: '', items: [] } : await get('templates', id);
  if (!t) { el.innerHTML = '<p>Không tìm thấy giáo án.</p>'; return; }
  const draw = () => {
    el.innerHTML = `<a href="#/cong-phap" class="small">← Công pháp</a>
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
      toast('Đã lưu'); location.hash = '#/cong-phap'; return;
    } else if (act === 'del') {
      if (!confirm('Xoá giáo án này?')) return;
      await del('templates', t.id); location.hash = '#/cong-phap'; return;
    }
    draw();
  };
  draw();
}
