import { all, del, exportAll, importAll, validateBackup } from '../db.js';
import { h, settings, toast, fmtDate } from '../util.js';
import { lastBackup, markBackup, snapshot, snapshotInfo, undoRestore, errorLog, clearErrors } from '../safety.js';

const LABEL = { workouts: 'buổi tập', templates: 'giáo án', exercises: 'bài tập', body: 'lần cân' };

export async function render(el) {
  const s = settings.get();
  const custom = (await all('exercises')).filter((e) => e.custom);
  const last = lastBackup(), snap = snapshotInfo(), errs = errorLog();
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
    ${snap ? `<p class="small muted">Có bản dự phòng trước lần khôi phục ${fmtDate(snap)}.</p>
    <div class="row wrap"><button data-act="undoRestore">Hoàn tác khôi phục</button></div>` : ''}
  </section>
  ${errs.length ? `<h2>Nhật ký lỗi</h2>
  <section class="card error-log">
    ${errs.map((e) => `<p class="small"><span class="muted">${fmtDate(e.at)} · ${h(e.where)}</span><br>${h(e.msg)}</p>`).join('')}
    <div class="row wrap"><button class="ghost" data-act="clearErrors">Xoá nhật ký</button></div>
  </section>` : ''}
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
        let data;
        try { data = JSON.parse(await t.files[0].text()); } catch { throw new Error('File không đọc được (không phải JSON)'); }
        const counts = validateBackup(data);
        const what = Object.entries(counts).filter(([s]) => LABEL[s]).map(([s, n]) => `${n} ${LABEL[s]}`).join(', ');
        if (!confirm(`File có ${what}${data.exportedAt ? ` (sao lưu ${fmtDate(data.exportedAt)})` : ''}.\nKhôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?`)) return;
        if (!(await snapshot()) && !confirm('Không đủ chỗ lưu bản dự phòng dữ liệu hiện tại, sẽ không hoàn tác được. Vẫn tiếp tục?')) return;
        await importAll(data);
        toast('Đã khôi phục dữ liệu');
        render(el);
      } catch (e) { toast('Lỗi: ' + e.message, 4000); } finally { t.value = ''; }
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
      markBackup();
      render(el);
    }
    if (b.dataset.act === 'undoRestore' && confirm('Quay lại dữ liệu trước lần khôi phục? Dữ liệu hiện tại sẽ bị thay thế.')) {
      try { await undoRestore(); toast('Đã hoàn tác'); } catch (e) { toast('Lỗi: ' + e.message); }
      render(el);
    }
    if (b.dataset.act === 'clearErrors') { clearErrors(); render(el); }
    if (b.dataset.del && confirm('Xoá bài tập này? (Lịch sử cũ sẽ hiện "?")')) { await del('exercises', b.dataset.del); render(el); }
  };
}
