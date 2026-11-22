import { all, put } from './db.js';
import { h, uid, settings } from './util.js';
import { MUSCLES } from './exercises.js';
import { MERIDIANS } from './hero.js';
import { lockedPath } from './dao.js';

/**
 * Mở modal chọn bài tập. Trả về Promise<exercise|null>.
 * Đã Nhập môn → chỉ các bài trong Công pháp (nhóm theo mạch, không tạo bài mới; đổi bài ở Động phủ › Sửa Công pháp).
 * Chưa Nhập môn → toàn bộ thư viện, cho phép tạo bài mới.
 */
export async function pickExercise() {
  const lock = lockedPath(settings.get());
  const all_ = await all('exercises');
  const list = lock
    ? [...lock.keys()].map((id) => all_.find((e) => e.id === id)).filter(Boolean)
    : all_.sort((a, b) => a.name.localeCompare(b.name));
  const groupOf = (e) => (lock ? lock.get(e.id) : e.muscle);
  const groups = lock
    ? MERIDIANS.filter((M) => list.some((e) => lock.get(e.id) === M.key)).map((M) => [M.key, M.name])
    : MUSCLES.map((g) => [g, g]);
  const label = Object.fromEntries(groups);
  return new Promise((resolve) => {
    const m = document.createElement('div');
    m.className = 'modal';
    if (lock) m.dataset.locked = 'path';
    m.innerHTML = `<div class="sheet">
      <div class="row"><input type="search" placeholder="Tìm bài tập…" class="grow" autofocus><button class="ghost" data-close>Đóng</button></div>
      ${lock ? '<p class="muted small pick-lock">Theo Công pháp đã chọn. Đổi bài ở <a href="#/nhap-mon/4" data-close>Động phủ › Sửa Công pháp</a>.</p>' : ''}
      <div class="chips">${[['', 'Tất cả'], ...groups].map(([v, t], i) => `<button class="chip${i ? '' : ' on'}" data-g="${h(v)}">${h(t)}</button>`).join('')}</div>
      <div class="list pick-list"></div>
      ${lock ? '' : '<button class="ghost wide" data-new>+ Tạo bài tập mới</button>'}
    </div>`;
    document.body.append(m);
    const q = m.querySelector('input'), box = m.querySelector('.pick-list');
    let group = '';
    const draw = () => {
      const s = q.value.trim().toLowerCase();
      const rows = list.filter((e) => (!group || groupOf(e) === group) && (!s || e.name.toLowerCase().includes(s)));
      box.innerHTML = rows.map((e) => `<button class="item" data-id="${h(e.id)}"><span>${h(e.name)}</span><small class="muted">${h(lock ? label[groupOf(e)] : e.muscle)}</small></button>`).join('') || `<p class="muted">Không có kết quả.</p>`;
    };
    const done = (v) => { m.remove(); resolve(v); };
    q.addEventListener('input', draw);
    m.addEventListener('click', async (ev) => {
      if (ev.target === m) return done(null);
      if (ev.target.closest('a[data-close]')) return done(null); // link Sửa Công pháp: đóng modal, để trình duyệt đổi trang
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.close !== undefined) return done(null);
      if (b.dataset.g !== undefined) {
        group = b.dataset.g;
        m.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
        return draw();
      }
      if (b.dataset.id) return done(list.find((e) => e.id === b.dataset.id));
      if (b.dataset.new !== undefined && !lock) {
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
