import { all, activeWorkout } from '../db.js';
import { h, fmtDate, settings } from '../util.js';
import { finished } from '../stats.js';
import { startWorkout } from './workout.js';
import { weekPlan } from '../schedule.js';
import { sessionCounts } from '../insights.js';
import { medals } from '../medals.js';
import { lastBackup, backupDue } from '../safety.js';
import { music } from '../sfx.js';
import { bindProfileForm, ceremony, loadProfile, profileForm, questBoard, tuviStrip } from './hero.js';
import { NAV, gloss } from '../lore.js';
import { hintLabel, termLabel } from './sections.js';

const icon = (name) => `<svg class="dashboard-icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const scheduleLabels = { none: 'Chưa đặt lịch tập', due: 'Hôm nay có lịch tập', done: 'Đã tập hôm nay', rest: 'Hôm nay nghỉ' };

function trainingCard(cur, plan, template, first) {
  const scheduled = plan.state === 'due' && template;
  return `<section class="workout-hero sanctum-training" data-schedule-today data-state="${plan.state}"${first ? ' data-first-run' : ''}>
    <div class="hero-content">
      <div class="training-schedule">${icon('calendar')}<span>${scheduleLabels[plan.state]}</span>
        ${plan.state === 'none' ? '<a href="#/cong-phap">Đặt lịch</a>' : ''}</div>
      ${cur ? `<h2>${h(cur.name)}</h2>` : scheduled ? `<h2>${h(template.name)}</h2>` : first ? '<h2>Ghi buổi tập đầu tiên</h2>' : ''}
      ${plan.state === 'due' && !cur && !template ? '<p>Tập tự do</p>' : ''}
      ${!cur && !first && plan.state !== 'due' ? `<p class="gloss">${gloss('start')}</p>` : ''}
      <div class="row wrap training-actions">
        ${cur ? `<a class="btn primary" href="#/workout">${icon('play')}Tiếp tục buổi tập</a>` :
          scheduled ? `<button type="button" class="primary" data-act="tpl" data-id="${h(template.id)}">${icon('play')}${termLabel('start')}</button>
            <button type="button" class="ghost" data-act="empty">Tập tự do</button>` :
          `<button type="button" class="primary" data-act="empty">${icon('plus')}${termLabel('start')}</button>`}
      </div>
    </div>
  </section>`;
}

export async function render(el) {
  const [cur, templates, done, profile] = await Promise.all([activeWorkout(), all('templates'), finished(), loadProfile()]);
  const now = Date.now();
  const { schedule, weekGoal } = settings.get(), plan = weekPlan(schedule, done, now);
  const template = templates.find((t) => t.id === plan.templateId);
  const { week } = sessionCounts(done, now), { streak } = medals(done, now);
  const target = Object.keys(schedule || {}).length || Math.max(1, Math.round(weekGoal) || 1); // có lịch → số ngày theo lịch
  const last = lastBackup(), remind = backupDue(last, done);
  const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  const draw = (p) => {
    el.innerHTML = `<div class="dashboard">
      <header class="dashboard-heading"><h1>${hintLabel(NAV[0].label, NAV[0].hint)}</h1><p>${icon('calendar')}<span>${h(date)}</span></p></header>
      ${trainingCard(cur, plan, template, !cur && !done.length)}
      ${!settings.get().dao && !settings.get().daoSkip ? `<a class="card row dao-invite" href="#/nhap-mon">
        ${icon('layers')}<span class="grow"><b>${termLabel('nhapMon')}</b><small class="muted">Tuỳ chọn · chọn bài theo mạch, tự sinh giáo án và lịch tập</small></span>${icon('chevron')}
      </a>` : ''}
      <div class="sanctum-cultivation cultivation">
        ${tuviStrip(p)}
        ${questBoard(p.weekly, false, true)}
        <div class="sanctum-stats">
          <a href="#/cong-phap" data-session-goals data-session-goal="week"${week >= target ? ' data-done' : ''}>
            <small>Buổi tuần này</small><b data-session-goal-count><span data-session-count data-count="${week}">${week}</span> / ${target}</b>
          </a>
          <a href="#/ky/cong-duc">${termLabel('streak')}<b class="streak-multiplier"><span data-count="${streak.cur}">${streak.cur}</span></b></a>
        </div>
        ${profileForm(p)}
      </div>
      ${remind ? `<a class="card row backup-reminder" href="#/tang-thu/cai-dat">
        ${icon('backup')}<span class="grow"><b>Nên sao lưu dữ liệu</b><small class="muted">${last ? `Lần cuối ${fmtDate(last)}` : 'Chưa sao lưu lần nào'}</small></span>${icon('chevron')}
      </a>` : ''}
    </div>`;
  };
  draw(profile);
  el.onclick = (ev) => {
    const b = ev.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'empty') startWorkout();
    if (b.dataset.act === 'tpl') startWorkout({ template: templates.find((t) => t.id === b.dataset.id) });
  };
  bindProfileForm(el, draw);
  const board = el.querySelector('[data-quests]');
  ceremony(profile).then(({ quests: fresh }) => fresh.forEach((id) => board?.querySelector(`[data-quest="${id}"]`)?.classList.add('celebrate')));
  return music();
}
