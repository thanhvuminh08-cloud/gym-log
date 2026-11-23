import { all, del, exportAll, importAll, validateBackup } from '../db.js';
import { h, settings, toast, fmtDate } from '../util.js';
import { archiveHeader, termLabel } from './sections.js';
import { lastBackup, markBackup, snapshot, snapshotInfo, undoRestore, errorLog, clearErrors, resetAll, RESET_WORD } from '../safety.js';

const LABEL = { workouts: 'buổi tập', templates: 'giáo án', exercises: 'bài tập', body: 'lần cân' };

export async function render(el) {
  const s = settings.get();
  const custom = (await all('exercises')).filter((e) => e.custom);
  const last = lastBackup(), snap = snapshotInfo(), errs = errorLog();
  const persisted = (await navigator.storage?.persisted?.()) ?? false;

  el.innerHTML = `${archiveHeader('settings')}
  <p class="muted small">Lịch tập và mục tiêu tuần nằm ở <a href="#/cong-phap">${termLabel('congPhap')}</a>.</p>
  <h2 id="rest-settings">Đồng hồ nghỉ</h2>
  <section class="card settings-options" aria-labelledby="rest-settings">
    <label class="row">Thời gian nghỉ mặc định (giây)<span class="grow"></span><input class="tiny" type="number" inputmode="numeric" data-k="rest" value="${s.rest}"></label>
    <label class="row">Âm báo hết giờ nghỉ<span class="grow"></span><input type="checkbox" data-k="sound" ${s.sound ? 'checked' : ''}></label>
    <label class="row">Rung khi hết giờ nghỉ<span class="grow"></span><input type="checkbox" data-k="vibrate" ${s.vibrate ? 'checked' : ''}></label>
  </section>
  <h2 id="cultivation-settings">Con Đường Tu Luyện</h2>
  <section class="card settings-options cultivation-settings" aria-labelledby="cultivation-settings">
    <label class="row"><span class="grow">Chú giải <small class="muted">— dòng nghĩa thật dưới thuật ngữ</small></span><input type="checkbox" data-k="gloss" ${s.gloss !== false ? 'checked' : ''}></label>
    <label class="row"><span class="grow">Giới tính</span><select data-k="sex">
      <option value="" disabled ${!s.sex ? 'selected' : ''}>Chưa chọn</option>
      <option value="m" ${s.sex === 'm' ? 'selected' : ''}>Nam</option>
      <option value="f" ${s.sex === 'f' ? 'selected' : ''}>Nữ</option>
    </select></label>
    <label class="row"><span class="grow">Nhạc nền Động phủ</span><input type="checkbox" data-k="music" ${s.music ? 'checked' : ''}></label>
    <label class="row"><span class="grow">Âm hiệu ứng tu luyện</span><input type="checkbox" data-k="sfx" ${s.sfx ? 'checked' : ''}></label>
  </section>
  <h2>Dữ liệu</h2>
  <section class="card">
    <p class="small">Dữ liệu chỉ lưu trên thiết bị này. Hãy sao lưu định kỳ (gửi file vào Drive/Zalo của bạn).</p>
    <p class="small muted">Sao lưu lần cuối: ${last ? fmtDate(last) : 'chưa bao giờ'} · Lưu trữ bền vững: ${persisted ? 'có' : 'chưa'}</p>
    <div class="row wrap"><button class="primary" data-act="export">Sao lưu (xuất JSON)</button>
      <label class="btn">Khôi phục từ file<input type="file" accept="application/json,.json" hidden data-act="import"></label></div>
    ${snap ? `<div class="restore-snapshot">
      <p class="small">Bản dự phòng trước lần khôi phục <span class="muted">${fmtDate(snap)}</span></p>
      <button class="restore-undo" data-act="undoRestore">
        <svg class="dashboard-icon" aria-hidden="true"><use href="#i-undo"/></svg>Hoàn tác khôi phục
      </button>
    </div>` : ''}
  </section>
  ${errs.length ? `<h2>Nhật ký lỗi</h2>
  <section class="card error-log">
    <ul class="error-list" role="list">
      ${errs.map((e) => `<li><small class="muted">${fmtDate(e.at)} · ${h(e.where)}</small><p>${h(e.msg)}</p></li>`).join('')}
    </ul>
    <div class="error-log-actions"><button class="ghost danger" data-act="clearErrors">Xoá nhật ký</button></div>
  </section>` : ''}
  <h2>Khu nguy hiểm</h2>
  <section class="card danger-zone">
    <p class="small">Xoá sạch mọi dữ liệu (buổi tập, giáo án, cân nặng, cài đặt), đưa app về như lần đầu mở. Không hoàn tác được.</p>
    <button class="ghost danger" data-act="resetAll">Đặt lại app</button>
  </section>
  <h2>Bài tập tự tạo</h2>
  ${custom.map((e) => `<div class="card row"><span class="grow">${h(e.name)} <small class="muted">${h(e.muscle)}</small></span><button class="ghost icon danger" data-del="${h(e.id)}">✕</button></div>`).join('') || '<p class="muted small">Chưa có. Tạo bài mới khi chọn bài tập trong buổi tập.</p>'}`;

  el.onchange = async (ev) => {
    const t = ev.target;
    if (t.dataset.k) {
      settings.set({ [t.dataset.k]: t.type === 'checkbox' ? t.checked : t.type === 'number' ? Number(t.value) || 0 : t.value });
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
    if (b.dataset.act === 'resetAll') {
      if (!confirm('Đặt lại app sẽ XOÁ SẠCH mọi dữ liệu trên máy này.\nNên bấm "Sao lưu (xuất JSON)" trước. Đã sao lưu và muốn tiếp tục?')) return;
      const word = prompt(`Gõ chữ ${RESET_WORD} để xác nhận xoá sạch:`);
      if ((word || '').trim().toUpperCase() !== RESET_WORD) { if (word !== null) toast('Chữ xác nhận không đúng, chưa xoá gì'); return; }
      try { await resetAll(); } catch (e) { toast('Lỗi: ' + e.message, 4000); return; }
      location.hash = '#/'; location.reload();
    }
    if (b.dataset.del && confirm('Xoá bài tập này? (Lịch sử cũ sẽ hiện "?")')) { await del('exercises', b.dataset.del); render(el); }
  };
}
