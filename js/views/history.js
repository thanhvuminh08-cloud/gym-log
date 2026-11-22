import { all, get, put, del } from '../db.js';
import { h, uid, fmtDate, fmtTime, fmtDur, fmtNum, e1rm, exMap, toast, settings } from '../util.js';
import { finished, volume, setCount } from '../stats.js';
import { startWorkout } from './workout.js';
import { analyzeWorkout } from '../overload.js';
import { muscleKey } from '../insights.js';
import { medals } from '../medals.js';
import { gloss, hint, term } from '../lore.js';
import { hintLabel, journalHeader, phamSeal, termLabel } from './sections.js';
import { recap } from '../recap.js';
import { profileForm, bindProfileForm } from './hero.js';

export async function render(el, [id]) {
  const ex = exMap(await all('exercises'));
  if (id) return detail(el, id, ex);

  const list = await finished();
  let month = '';
  el.innerHTML = journalHeader('journal') + (list.map((w) => {
    const m = new Date(w.start).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    const head = m !== month ? `<h2>${(month = m)}</h2>` : '';
    return `${head}<a class="card" href="#/ky/${h(w.id)}"><b>${h(w.name)}</b>
      <div class="muted small">${fmtDate(w.start)} · ${fmtDur(w.end - w.start)} · ${setCount(w)} set · ${fmtNum(volume(w))} kg</div>
      <div class="small">${w.entries.map((e) => h(ex[e.exerciseId]?.name || '?')).join(', ')}</div></a>`;
  }).join('') || `<section class="card empty-state">
    <span class="tile-icon empty-illustration"><svg aria-hidden="true"><use href="#i-calendar"/></svg></span>
    <h2>Chưa có buổi tập hoàn thành</h2>
    <p class="muted">Hoàn thành buổi tập đầu tiên để ghi vào Nhật ký.</p>
    <a class="btn primary" href="#/">Về Động phủ</a>
  </section>`);
}

async function detail(el, id, ex) {
  const w = await get('workouts', id);
  if (!w) { el.innerHTML = '<p>Không tìm thấy buổi tập.</p>'; return; }
  const sessions = await finished();
  const ov = analyzeWorkout(w, sessions);
  const ledger = medals(sessions.filter((session) => session.end <= w.end), w.end);
  const stones = ledger.milestones.filter((item) => item.reached?.workoutId === w.id);
  const nCmp = ov.filter((o) => !o.first).length, nUp = ov.filter((o) => o.res).length;
  const tierRow = (o) => o.res ? `<div class="tier small summary-medal" data-tier="${o.res.tier}">${phamSeal()}<strong>${termLabel(o.res.tier)}</strong><span>${h(o.res.msg)}</span></div>`
    : `<div class="tier small muted" data-tier="${o.first ? 'first' : 'none'}">${o.first ? 'Lần đầu tập bài này' : 'Chưa vượt lần trước'}</div>`;
  const sets = setCount(w), kg = volume(w);
  const [allW, body, templates] = await Promise.all([all('workouts'), all('body'), all('templates')]);
  const rc = recap(w, { workouts: allW, exercises: Object.values(ex), body, templates, settings: settings.get() });
  el.innerHTML = `
  ${journalHeader('journal')}
  <a href="#/ky" class="small">← Nhật ký</a>
  <header class="workout-record">
    <span class="workout-record-seal" aria-hidden="true"><svg class="dashboard-icon"><use href="#i-dumbbell"/></svg></span>
    <div><h2>${h(w.name)}</h2><p class="muted">${fmtDate(w.start)} · ${fmtTime(w.start)}–${fmtTime(w.end)} (${fmtDur(w.end - w.start)})</p></div>
  </header>
  ${recapView(rc)}
  <div class="stats workout-summary">
    <div><b data-count="${sets}">${sets}</b><small>Set hoàn thành</small></div>
    <div><b data-count="${kg}">${fmtNum(kg)}</b><small>Khối lượng (kg)</small></div>
    <div><b data-count="${w.entries.length}">${w.entries.length}</b><small>Bài tập</small></div>
    <div${nCmp ? ' class="overload"' : ''}>
      <b>${nCmp ? `${nUp}<span class="summary-compared">/${nCmp}</span>` : '—'}</b>
      <small>${nCmp ? 'Bài vượt lần trước' : 'Chưa có lần trước'}</small>
    </div>
  </div>
  ${ledger.streak.cur || stones.length ? `<section class="card ledger-summary">
    ${ledger.streak.cur ? `<b>${hintLabel(term('streak', ledger.streak.cur), hint('streak'))}</b><small class="gloss">${gloss('streak')}</small>` : ''}
    ${stones.length ? `<h3>${hintLabel(`${term('milestone')} mới`, hint('milestone'))}</h3><ul>${stones.map((item) => `<li>${h(ex[item.exerciseId]?.name || 'Bài đã xoá')} · ${fmtNum(item.reached.kg)} kg</li>`).join('')}</ul>` : ''}
    <a class="btn ghost" href="#/ky/cong-duc">${termLabel('ledger')}</a>
  </section>` : ''}
  ${w.entries.map((e, ei) => {
    const best = Math.max(...e.sets.map((s) => e1rm(s.w, s.r)));
    return `<section class="card" data-muscle="${muscleKey(ex[e.exerciseId])}"><div class="row"><b class="grow">${h(ex[e.exerciseId]?.name || '?')}</b><span class="muted small">~1RM ${fmtNum(best)}</span></div>
      ${tierRow(ov[ei])}
      <div class="small">${e.sets.map((s, i) => `<span class="pill">${i + 1}: ${fmtNum(s.w)}×${s.r}${s.rpe ? ` @${s.rpe}` : ''}</span>`).join('')}</div></section>`;
  }).join('')}
  ${w.note ? `<section class="card"><b>Ghi chú</b><p>${h(w.note)}</p></section>` : ''}
  <div class="row wrap">
    <button data-act="again">Tập lại buổi này</button>
    <button data-act="tpl">Lưu thành giáo án</button>
    <button class="ghost danger" data-act="del">Xoá</button>
  </div>`;

  // O1: hỏi cân nặng/giới tính một lần ngay tại tổng kết; lưu xong vẽ lại trang.
  bindProfileForm(el, () => detail(el, id, ex));
  el.onclick = async (ev) => {
    const btn = ev.target.closest('button[data-act]'), act = btn?.dataset.act;
    if (act === 'next') { const t = templates.find((x) => x.id === btn.dataset.id); if (t) startWorkout({ template: t }); return; }
    if (act === 'again') startWorkout({ from: w });
    if (act === 'tpl') {
      const name = prompt('Tên giáo án:', w.name);
      if (!name) return;
      await put('templates', { id: uid(), name, items: w.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.length, reps: e.sets[0]?.r || 8, rest: e.rest })) });
      toast('Đã lưu giáo án');
    }
    if (act === 'del' && confirm('Xoá vĩnh viễn buổi tập này?')) { await del('workouts', w.id); location.hash = '#/ky'; }
  };
}

function recapView(rc) {
  const { linhKhi, tuvi, next, pham, breakthroughs, quests, meridians } = rc;
  return `<section class="card recap" data-recap aria-labelledby="recap-title">
    <header class="recap-header">
      <h2 id="recap-title">Thu hoạch</h2>
      ${pham ? `<div class="tier small recap-pham" data-tier="${h(pham)}">${phamSeal()}<strong>${termLabel(pham)}</strong></div>` : ''}
    </header>
    <div class="recap-linhkhi" data-recap-linhkhi>
      <div class="recap-gain"><strong>+${fmtNum(linhKhi.gain)}</strong> ${termLabel('linhKhi')}</div>
      <div class="recap-level"><b>${term('congLuc')} cấp ${linhKhi.level}</b>${linhKhi.levelUp ? '<span class="recap-up">Lên cấp</span>' : ''}</div>
      <progress class="cultivation-meter" value="${linhKhi.pct}" max="100" aria-label="Tới cấp ${linhKhi.level + 1}"></progress>
      <small class="muted">${fmtNum(linhKhi.into)} / ${fmtNum(linhKhi.need)} tới cấp ${linhKhi.level + 1}</small>
    </div>
    ${rc.needsWeight || rc.needsSex ? profileForm(rc)
      : `<div class="recap-tuvi" data-recap-tuvi><h3>${termLabel('tuvi')}</h3>
        <span>${tuvi.up ? `<span class="muted">${h(tuvi.from)} → </span>` : ''}<b>${h(tuvi.to)}</b></span>
        <small class="muted">${tuvi.opened}/${tuvi.of} mạch đã khai</small></div>`}
    ${meridians.length ? `<section class="recap-group"><h3>Mạch đã tập</h3><ul class="recap-meridians">
      ${meridians.map((m) => `<li data-recap-meridian="${h(m.key)}" data-muscle="${h(m.key)}"${m.up || m.opened ? ' class="is-up"' : ''}>
        <div class="recap-meridian-head"><b>${h(m.name)}</b><small>+${fmtNum(m.xp)} ${term('linhKhi')}</small></div>
        ${m.opened ? `<small class="recap-up">${term('khaiMach')} · ${h(m.to)}</small>` : m.up ? `<small class="recap-up">${h(m.from)} → ${h(m.to)}</small>` : ''}
      </li>`).join('')}
    </ul></section>` : ''}
    ${breakthroughs.length ? `<section class="recap-group"><h3>Mốc đạt được</h3><ul class="recap-breaks" data-recap-breaks>
      ${breakthroughs.map((b) => `<li><b>${h(b.name)}</b><small>${h(b.from)} → ${h(b.to)}</small></li>`).join('')}
    </ul></section>` : ''}
    ${quests.length ? `<section class="recap-group"><h3>Nhiệm vụ hoàn thành</h3><ul class="recap-quests" data-recap-quests>
      ${quests.map((q) => `<li><span aria-hidden="true">✓</span><b>${h(q.title)}</b></li>`).join('')}
    </ul></section>` : ''}
    ${next ? `<div class="recap-next" data-recap-next="${h(next.kind)}">
      <div><h3>Buổi sau${next.when ? ` <small>· ${h(next.when)}</small>` : ''}</h3>
        <b>${h(next.title)}</b>${next.detail ? `<small class="muted">${h(next.detail)}</small>` : ''}</div>
      ${next.templateId ? `<button type="button" class="primary" data-act="next" data-id="${h(next.templateId)}">Bắt đầu</button>` : ''}</div>` : ''}
  </section>`;
}
