import { all, del, exportAll, importAll } from '../db.js';
import { h, settings, toast, fmtDate } from '../util.js';

const BK = 'gym.lastBackup';

export async function render(el) {
  const s = settings.get();
  const custom = (await all('exercises')).filter((e) => e.custom);
  const last = Number(localStorage.getItem(BK) || 0);
  const persisted = (await navigator.storage?.persisted?.()) ?? false;

  el.innerHTML = `<h1>Cài đặt</h1>
  <section class="card">
    <label class="row">Thời gian nghỉ mặc định (giây)<span class="grow"></span><input class="tiny" type="number" inputmode="numeric" data-k="rest" value="${s.rest}"></label>
    <label class="row">Âm báo hết giờ nghỉ<span class="grow"></span><input type="checkbox" data-k="sound" ${s.sound ? 'checked' : ''}></label>
    <label class="row">Rung khi hết giờ nghỉ<span class="grow"></span><input type="checkbox" data-k="vibrate" ${s.vibrate ? 'checked' : ''}></label>
  </section>
  <h2>Dữ liệu</h2>
  <section class="card">
    <p class="small">Dữ liệu chỉ lưu trên thiết bị này. Hãy sao lưu định kỳ (gửi file vào Drive/Zalo của bạn).</p>
    <p class="small muted">Sao lưu lần cuối: ${last ? fmtDate(last) : 'chưa bao giờ'} · Lưu trữ bền vững: ${persisted ? 'có' : 'chưa'}</p>
    <div class="row wrap"><button class="primary" data-act="export">Sao lưu (xuất JSON)</button>
      <label class="btn">Khôi phục từ file<input type="file" accept="application/json,.json" hidden data-act="import"></label></div>
  </section>
  <h2>Bài tập tự tạo</h2>
  ${custom.map((e) => `<div class="card row"><span class="grow">${h(e.name)} <small class="muted">${h(e.muscle)}</small></span><button class="ghost icon danger" data-del="${h(e.id)}">✕</button></div>`).join('') || '<p class="muted small">Chưa có. Tạo bài mới khi chọn bài tập trong buổi tập.</p>'}`;

  el.onchange = async (ev) => {
    const t = ev.target;
    if (t.dataset.k) {
      settings.set({ [t.dataset.k]: t.type === 'checkbox' ? t.checked : Number(t.value) || 0 });
      toast('Đã lưu');
    }
    if (t.dataset.act === 'import' && t.files[0]) {
      try {
        const data = JSON.parse(await t.files[0].text());
        if (!confirm('Khôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?')) return;
        await importAll(data);
        toast('Đã khôi phục dữ liệu');
        render(el);
      } catch (e) { toast('Lỗi: ' + e.message); }
    }
  };
  el.onclick = async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'export') {
      const blob = new Blob([JSON.stringify(await exportAll())], { type: 'application/json' });
      const name = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); } catch { return; }
      } else {
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
      localStorage.setItem(BK, Date.now());
      render(el);
    }
    if (b.dataset.del && confirm('Xoá bài tập này? (Lịch sử cũ sẽ hiện "?")')) { await del('exercises', b.dataset.del); render(el); }
  };
}
