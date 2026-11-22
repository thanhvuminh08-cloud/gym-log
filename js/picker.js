import { all, put } from './db.js';
import { h, uid } from './util.js';
import { MUSCLES } from './exercises.js';

/** Mở modal chọn bài tập. Trả về Promise<exercise|null>. Cho phép tạo bài mới. */
export async function pickExercise() {
  const list = (await all('exercises')).sort((a, b) => a.name.localeCompare(b.name));
  return new Promise((resolve) => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="sheet">
      <div class="row"><input type="search" placeholder="Tìm bài tập…" class="grow" autofocus><button class="ghost" data-close>Đóng</button></div>
      <div class="chips">${['Tất cả', ...MUSCLES].map((g, i) => `<button class="chip${i ? '' : ' on'}" data-g="${i ? h(g) : ''}">${h(g)}</button>`).join('')}</div>
      <div class="list pick-list"></div>
      <button class="ghost wide" data-new>+ Tạo bài tập mới</button>
    </div>`;
    document.body.append(m);
    const q = m.querySelector('input'), box = m.querySelector('.pick-list');
    let group = '';
    const draw = () => {
      const s = q.value.trim().toLowerCase();
      const rows = list.filter((e) => (!group || e.muscle === group) && (!s || e.name.toLowerCase().includes(s)));
      box.innerHTML = rows.map((e) => `<button class="item" data-id="${h(e.id)}"><span>${h(e.name)}</span><small class="muted">${h(e.muscle)}</small></button>`).join('') || `<p class="muted">Không có kết quả.</p>`;
    };
    const done = (v) => { m.remove(); resolve(v); };
    q.addEventListener('input', draw);
    m.addEventListener('click', async (ev) => {
      if (ev.target === m) return done(null);
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.close !== undefined) return done(null);
      if (b.dataset.g !== undefined) {
        group = b.dataset.g;
        m.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
        return draw();
      }
      if (b.dataset.id) return done(list.find((e) => e.id === b.dataset.id));
      if (b.dataset.new !== undefined) {
        const name = prompt('Tên bài tập mới:', q.value.trim());
        if (!name?.trim()) return;
        const muscle = prompt(`Nhóm cơ (${MUSCLES.join(', ')}):`, group || 'Khác') || 'Khác';
        const ex = await put('exercises', { id: 'c-' + uid(), name: name.trim(), muscle: muscle.trim(), custom: true });
        done(ex);
      }
    });
    draw();
  });
}
