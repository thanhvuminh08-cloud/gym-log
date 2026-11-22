import * as G from '../dao.js';
import { DEFAULT_EXERCISES } from '../exercises.js';
import { h, settings, uid, toast } from '../util.js';
import { all, put, del } from '../db.js';
import { snapshot } from '../hero.js';
import { loadProfile, SEEN_KEY } from './hero.js';

const STEPS = [
  ['Nhập môn', 'Chọn tên dùng trong Động phủ.'],
  ['Thân thể', 'Dùng thông tin cơ thể để ước lượng cảnh giới khởi đầu.'],
  ['Đạo hạnh', 'Chọn mục tiêu và số buổi tập phù hợp với bạn.'],
  ['Chọn Công pháp', 'Mỗi mạch cần ít nhất hai bài được xét cảnh giới.'],
  ['Trắc linh căn', 'Nhập mức tạ và số rep tốt nhất gần đây. Có thể để trống từng bài.'],
  ['Kết quả Nhập môn', 'Xem cảnh giới khởi đầu, lịch tuần và giáo án.'],
];
const DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const samplePath = G.defaultPath(DEFAULT_EXERCISES);
const sampleTests = [
  { exerciseId: 'x-bench-press-on', w: 55, r: 8 },
  { exerciseId: 'x-incline-bench-press', w: 45, r: 8 },
  { exerciseId: 'x-squat', w: 100, r: 5 },
  { exerciseId: 'x-front-squat', w: 80, r: 5 },
  { exerciseId: 'x-dumbbell-shoulder-press', w: 17.5, r: 8 },
  { exerciseId: 'x-dips', w: 0, r: 8 },
];
const sampleDao = { at: Date.UTC(2026, 10, 16), name: 'Thanh Vân', height: 174, age: 29, experience: 'mid', goal: 'muscle', days: 3, path: samplePath, tested: sampleTests };

function options(choices, value) {
  return choices.map(({ id, label, real }) => `<option value="${h(id)}"${id === value ? ' selected' : ''}>${h(label)} · ${h(real)}</option>`).join('');
}

function showPath(dao, groups, validation, preview) {
  return groups.map(({ key, name, min, options }, index) => {
    const selected = dao.path?.[key] || [];
    const need = validation?.problems.find((problem) => problem.key === key)?.need;
    const choices = options.map((exercise) => {
      const id = `dao-path-${h(key)}-${h(exercise.id)}`;
      return `<input id="${id}" type="checkbox"${exercise.ranked ? ' class="dao-ranked"' : ''} data-path="${h(key)}" value="${h(exercise.id)}"${selected.includes(exercise.id) ? ' checked' : ''}>
        <label for="${id}">${h(exercise.name)}${exercise.ranked ? '' : '<small>Chỉ cho Linh khí</small>'}</label>`;
    }).join('');
    return `<details class="dao-branch" data-muscle="${h(key)}"${index === 0 || need ? ' open' : ''}>
      <summary><span>${h(name)}</span>${preview
        ? `<small class="dao-need-one">Mạch ${h(name)} cần thêm 1 bài</small><small class="dao-need-all">Mạch ${h(name)} cần thêm ${min} bài</small>`
        : need ? `<small class="dao-path-warning">Mạch ${h(name)} cần thêm ${need} bài</small>` : ''}</summary>
      <div class="dao-options">${choices}</div>
    </details>`;
  }).join('');
}

function showTests(tests, tested) {
  const entries = new Map((tested || []).map((entry) => [entry.exerciseId, entry]));
  return tests.map((test) => {
    const entry = entries.get(test.exerciseId);
    const unit = test.bodyweight ? 'kg đeo thêm' : test.perHand ? 'kg mỗi tay' : 'kg';
    return `<fieldset class="dao-test" data-test="${h(test.exerciseId)}" data-muscle="${h(test.meridian)}">
      <legend>${h(test.name)} <small>${h(test.meridianName)}</small></legend>
      <div class="dao-test-fields">
        <label>${unit}<input type="number" inputmode="decimal" min="0" step="0.1" name="w" value="${h(entry?.w ?? '')}"></label>
        <span aria-hidden="true">×</span>
        <label>Rep<input type="number" inputmode="numeric" min="1" step="1" name="r" value="${h(entry?.r ?? '')}"></label>
      </div>
    </fieldset>`;
  }).join('');
}

function showResult(result, plan, exerciseNames) {
  const { tuvi, top, verdict, meridians } = result;
  return `<div class="dao-result">
    <div class="dao-rank">
      <span class="cultivation-seal" data-realm="${tuvi.realm.i}" aria-hidden="true">${h(tuvi.realm.name)}</span>
      <div><strong>${h(tuvi.label)}</strong><p>${h(verdict)}</p>
        ${top ? `<p class="dao-talent">Thiên phú: mạch ${h(top.name)} · ${h(top.label)}</p>` : ''}</div>
    </div>
    <ul class="dao-result-branches">${meridians.map((m) => `<li data-muscle="${h(m.key)}"><b>${h(m.name)}</b><span>${h(m.label)}${m.need > 0 ? `<small>Còn thiếu ${m.need} bài</small>` : ''}</span></li>`).join('')}</ul>
  </div>
  <h3>Lịch bế quan</h3>
  <ul class="dao-schedule">${[1, 2, 3, 4, 5, 6, 0].filter((day) => plan.schedule[day]).map((day) => {
    const template = plan.templates.find((item) => item.id === plan.schedule[day]);
    return `<li><b>${DAYS[day]}</b><span>${h(template?.name ?? '')}</span></li>`;
  }).join('')}</ul>
  <h3>Giáo án tự sinh</h3>
  ${plan.templates.map((template) => `<details class="dao-branch dao-template">
    <summary>${h(template.name)} <small>${template.items.length} bài</small></summary>
    <ul>${template.items.map((item) => `<li><span>${h(exerciseNames[item.exerciseId] || item.exerciseId)}</span><small>${item.sets} set × ${item.reps} rep · nghỉ ${item.rest} giây</small></li>`).join('')}</ul>
  </details>`).join('')}`;
}

function stepContent({ step, dao, sex, weight, groups, validation, tests, result, plan, exerciseNames }, preview) {
  switch (step) {
    case 1:
      return `<label class="dao-field">Đạo hiệu <small>Tuỳ chọn</small><input name="name" value="${h(dao.name ?? '')}" placeholder="Ví dụ: Thanh Vân"></label>`;
    case 2:
      return `<div class="dao-fields">
        <label class="dao-field">Giới tính<select name="sex" required>
          <option value="">Chọn giới tính</option><option value="m"${sex === 'm' ? ' selected' : ''}>Nam</option><option value="f"${sex === 'f' ? ' selected' : ''}>Nữ</option>
        </select></label>
        <label class="dao-field">Thân trọng (kg)<input type="number" inputmode="decimal" name="weight" min="1" step="0.1" value="${h(weight ?? '')}" required></label>
        <label class="dao-field">Thân cao (cm)<input type="number" inputmode="numeric" name="height" min="1" value="${h(dao.height ?? '')}"></label>
        <label class="dao-field">Tuổi<input type="number" inputmode="numeric" name="age" min="1" value="${h(dao.age ?? '')}"></label>
      </div>`;
    case 3:
      return `<div class="dao-fields">
        <label class="dao-field">Thời gian tu đạo<select name="experience">${options(G.EXPERIENCE, dao.experience)}</select></label>
        <label class="dao-field">Đạo tâm<select name="goal">${options(G.GOALS, dao.goal)}</select></label>
        <label class="dao-field">Số buổi bế quan mỗi tuần<select name="days">${Object.keys(G.DAYS).map((n) => `<option value="${n}"${+n === +dao.days ? ' selected' : ''}>${n} buổi / tuần</option>`).join('')}</select></label>
      </div>`;
    case 4: return showPath(dao, groups, validation, preview);
    case 5: return `<div class="dao-tests">${showTests(tests, dao.tested)}</div>`;
    case 6: return showResult(result, plan, exerciseNames);
  }
}

function stepActions({ step, dao, validation }, preview) {
  const novice = G.EXPERIENCE.find((entry) => entry.id === dao.experience)?.test === false;
  const route = (n, newToTraining = novice) => `#/nhap-mon/${n}${newToTraining ? '/new' : ''}`;
  const button = (act, label, cls, href, disabled = false) => preview && href && !disabled
    ? `<a class="btn ${cls}" data-act="${act}" href="${href}">${label}</a>`
    : `<button type="button" class="${cls}" data-act="${act}"${disabled ? ' disabled' : ''}>${label}</button>`;

  return `<div class="dao-actions">
    ${step > 1 ? button('daoBack', 'Quay lại', 'ghost', route(step === 6 && novice ? 4 : step - 1)) : ''}
    ${step === 6 ? button('daoSkip', 'Để sau', 'ghost', '#/hero') + button('daoSave', 'Nhận công pháp', 'primary', '#/hero')
      : button('daoNext', 'Tiếp tục', 'primary dao-next', route(step === 4 && novice ? 6 : step + 1, step !== 3 && novice), step === 4 && validation?.ok === false)}
    ${preview && step === 3 ? button('daoNext', 'Tiếp tục', 'primary dao-next-new', route(4, true)) : ''}
    ${preview && step === 4 && validation?.ok ? button('daoNext', 'Tiếp tục', 'primary dao-next-blocked', '', true) : ''}
  </div>`;
}

export function daoView(state, { preview = false } = {}) {
  const [title, intro] = STEPS[state.step - 1];
  return `<article class="dao-wizard cultivation${preview ? ' dao-preview' : ''}">
    <a class="cultivation-back small" href="#/hero">← Động phủ</a>
    <header class="dao-cover">
      <div class="dao-cover-top"><span>Bước ${state.step} / ${STEPS.length}</span>${preview ? '<span class="cultivation-data-badge">Số liệu mẫu</span>' : ''}</div>
      <h1>${title}</h1>
      <p>${intro}</p>
      <progress class="cultivation-meter" value="${state.step}" max="${STEPS.length}" aria-label="Tiến độ Nhập môn"></progress>
    </header>
    <section class="card cultivation-panel dao-step" data-dao-step="${state.step}">
      ${stepContent(state, preview)}
      ${stepActions(state, preview)}
    </section>
    ${preview ? '<p class="dao-preview-note muted small">Thay đổi trong bản xem trước không được lưu.</p>' : ''}
  </article>`;
}

// ——— Nối dữ liệu thật (Claude) ———
// Bản nháp sống trong module (và sessionStorage để tải lại trang không mất) cho tới khi "Nhận công pháp".
const DRAFT_KEY = 'gym.daoDraft';
let draft = null;
const keep = () => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {} };
const forget = () => { draft = null; try { sessionStorage.removeItem(DRAFT_KEY); } catch {} };
const skipsTest = (d) => G.EXPERIENCE.find((x) => x.id === d.dao.experience)?.test === false;

async function load() {
  const [exercises, body, workouts] = await Promise.all([all('exercises'), all('body'), all('workouts')]);
  const s = settings.get();
  if (!draft) { try { draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch {} }
  if (!draft?.dao) {
    // Sửa Công pháp: bắt đầu từ hồ sơ đã lưu; lần đầu: gợi ý sẵn.
    const prev = s.dao || {};
    const latest = [...body].filter((b) => b.weight > 0).sort((a, b) => a.date - b.date).at(-1);
    draft = {
      sex: s.sex || '', weight: latest?.weight ?? '',
      dao: { name: '', height: '', age: '', experience: 'novice', goal: 'muscle', days: Math.min(6, Math.max(2, s.weekGoal || 3)), tested: [],
        ...prev, path: G.cleanPath(prev.path || G.defaultPath(exercises), exercises) },
    };
  }
  return { exercises, body, workouts, s };
}

/** Đọc ô nhập của bước đang hiện vào bản nháp. */
function collect(el, step, exercises) {
  const v = (n) => el.querySelector(`[name="${n}"]`)?.value ?? '';
  const num = (x) => (x === '' || !(+x > 0) ? '' : +x);
  const d = draft.dao;
  if (step === 1) d.name = v('name').trim().slice(0, 40);
  if (step === 2) { draft.sex = v('sex'); draft.weight = num(v('weight')); d.height = num(v('height')); d.age = num(v('age')); }
  if (step === 3) { d.experience = v('experience'); d.goal = v('goal'); d.days = +v('days') || 3; }
  if (step === 4) {
    const path = Object.fromEntries(G.pathOptions(exercises).map((g) => [g.key, []]));
    el.querySelectorAll('input[data-path]:checked').forEach((c) => path[c.dataset.path]?.push(c.value));
    d.path = path;
  }
  if (step === 5) {
    const tests = G.testList(d.path, exercises);
    d.tested = tests.map((t) => {
      const f = el.querySelector(`[data-test="${CSS.escape(t.exerciseId)}"]`);
      const w = +f?.querySelector('[name=w]').value || 0, r = Math.round(+f?.querySelector('[name=r]').value || 0);
      return { exerciseId: t.exerciseId, w, r };
    }).filter((t) => t.r > 0 && t.r <= 30 && (t.w > 0 || tests.find((x) => x.exerciseId === t.exerciseId).bodyweight));
  }
  keep();
}

/** Bước 2 bắt buộc giới tính + cân nặng (để xếp cảnh giới). */
const missing = (step) => step === 2 && (!['m', 'f'].includes(draft.sex) ? 'Chọn giới tính' : !(draft.weight > 0) ? 'Nhập thân trọng (kg)' : '');

function state(step, { exercises, body, workouts }, now = Date.now()) {
  const d = draft.dao, dao = { ...d, at: now };
  const b = draft.weight > 0 ? [...body, { date: now, weight: draft.weight }] : body;
  return {
    step, dao: d, sex: draft.sex, weight: draft.weight,
    groups: G.pathOptions(exercises), validation: G.validatePath(d.path, exercises),
    tests: G.testList(d.path, exercises),
    result: step === 6 ? G.assess({ dao, exercises, body: b, sex: draft.sex, workouts, now }) : null,
    plan: step === 6 ? G.buildPlan(d, exercises) : null,
    exerciseNames: Object.fromEntries(exercises.map(({ id, name }) => [id, name])),
  };
}

/** Lưu: cân nặng (nếu đổi), giới tính, settings.dao, giáo án Công pháp (ghi đè bộ cũ), lịch, mục tiêu tuần, mốc Đột phá. */
export async function saveDao(now = Date.now()) {
  const { exercises, body } = await load();
  const s = settings.get(), prevIds = s.dao?.templateIds || [];
  const latest = [...body].filter((x) => x.weight > 0).sort((a, b) => a.date - b.date).at(-1);
  if (draft.weight > 0 && latest?.weight !== draft.weight) await put('body', { id: uid(), date: now, weight: draft.weight, waist: null });
  const plan = G.buildPlan({ ...draft.dao, makeId: (i) => prevIds[i] || uid() }, exercises);
  for (const t of plan.templates) await put('templates', t);
  for (const id of prevIds.slice(plan.templates.length)) await del('templates', id);
  const days = G.DAYS[Math.min(6, Math.max(2, +draft.dao.days || 3))].days.length;
  const dao = { ...draft.dao, at: now, templateIds: plan.templates.map((t) => t.id) };
  settings.set({ sex: draft.sex, dao, schedule: plan.schedule, weekGoal: days, daoSkip: null });
  // Cảnh giới khởi đầu là "đo", không phải "đột phá": đặt mốc để không mở màn ăn mừng.
  const profile = await loadProfile(now);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(snapshot(profile))); } catch {}
  forget();
  return { dao, plan, profile };
}

export async function render(el, [part] = []) {
  const data = await load();
  let step = Math.min(6, Math.max(1, parseInt(part, 10) || 1));
  if (step === 5 && skipsTest(draft)) step = 6;
  // Không cho nhảy cóc qua bước bắt buộc (vd. mở thẳng #/nhap-mon/6 khi chưa có cân nặng).
  if (step > 2 && missing(2)) step = 2;
  const show = () => { el.innerHTML = daoView(state(step, data)); };
  show();
  const goStep = (n) => { location.hash = `#/nhap-mon/${n}`; };
  el.onchange = (ev) => {
    if (step === 4 && ev.target.matches('input[data-path]')) {
      collect(el, 4, data.exercises);
      const open = [...el.querySelectorAll('details[open]')].map((x) => x.dataset.muscle);
      show();
      el.querySelectorAll('details.dao-branch').forEach((x) => { if (open.includes(x.dataset.muscle)) x.open = true; });
    }
  };
  el.onclick = async (ev) => {
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'daoBack') {
      collect(el, step, data.exercises);
      goStep(step === 6 && skipsTest(draft) ? 4 : step - 1);
    } else if (act === 'daoNext') {
      collect(el, step, data.exercises);
      const why = missing(step) || (step === 4 && !G.validatePath(draft.dao.path, data.exercises).ok ? 'Mỗi mạch cần ít nhất 2 bài' : '');
      if (why) return toast(why);
      goStep(step === 4 && skipsTest(draft) ? 6 : step + 1);
    } else if (act === 'daoSkip') {
      if (!settings.get().dao) settings.set({ daoSkip: Date.now() });
      forget();
      location.hash = settings.get().dao ? '#/hero' : '#/';
    } else if (act === 'daoSave') {
      ev.target.disabled = true;
      const { profile } = await saveDao();
      toast(`Nhập môn thành công · ${profile.tuvi.label}`);
      location.hash = '#/hero';
    }
  };
}
