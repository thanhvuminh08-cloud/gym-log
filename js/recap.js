// Tổng kết buổi (O2, hàm thuần): so hồ sơ tu luyện trước/sau một buổi + gợi ý buổi sau. View: js/views/history.js.
import { hero, snapshot, breakthroughs, quests, MERIDIANS, meridianOf } from './hero.js';
import { analyzeWorkout } from './overload.js';
import { doneSets } from './stats.js';
import { cleanSchedule } from './schedule.js';

const DAY = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const RANK = { bronze: 1, silver: 2, gold: 3 };
const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const weekStart = (t) => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

/**
 * Tổng kết buổi w. Đầu vào: w (đã xong), workouts, exercises, body, templates, settings {sex, schedule, weekGoal, dao}.
 * Trả về {
 *   needsWeight, needsSex          — thiếu thì hỏi một lần ngay trên trang (mạch tạ chưa tính được khi thiếu cân nặng);
 *   pham: 'gold'|'silver'|'bronze'|null — phẩm cao nhất trong buổi; baseline: true khi mọi bài đều tập lần đầu (buổi làm mốc, chưa có gì để so);
 *   linhKhi: {gain, level, levelUp, into, need, pct};
 *   tuvi: {from, to, up, opened, of};
 *   meridians: [{key, name, xp (Linh khí mạch nhận), from, to, up, opened (mạch mới khai)}] — mạch có tập trong buổi;
 *   quests: [{id, title, detail}] — nhiệm vụ tuần buổi này vừa hoàn thành;
 *   breakthroughs: như hero.breakthroughs (trước buổi → sau buổi);
 *   next: {kind:'schedule'|'template'|'meridian', when, title, detail, templateId?, meridian?} | null
 * }
 */
export function recap(w, { workouts = [], exercises = [], body = [], templates = [], settings = {} } = {}) {
  const { sex, schedule = {}, weekGoal = 3, dao = null } = settings;
  const others = workouts.filter((x) => x.id !== w.id);
  const ctx = { exercises, body, sex, schedule, weekGoal, dao };
  // "Sau" = mọi buổi tới hết w; "trước" = như vậy nhưng bỏ w. Cân nặng nhập sau buổi vẫn tính (bwAt lấy lần cân sớm nhất).
  const upto = workouts.filter((x) => x.end && x.start <= w.start);
  const after = hero({ ...ctx, workouts: upto, now: w.end });
  const before = hero({ ...ctx, workouts: upto.filter((x) => x.id !== w.id), now: w.end });
  const needsWeight = !body.some((b) => b.weight > 0), needsSex = sex !== 'm' && sex !== 'f';

  const ex = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const trained = new Set(w.entries.filter((e) => doneSets(e).length).map((e) => meridianOf(ex[e.exerciseId])));
  const meridians = after.meridians.map((m, i) => ({ m, b: before.meridians[i] })).filter(({ m }) => trained.has(m.key)).map(({ m, b }) => ({
    key: m.key, name: m.name, xp: m.xp - b.xp, from: b.label, to: m.label, up: m.p > b.p && m.label !== b.label, opened: m.p > 0 && !(b.p > 0),
  }));

  // Nhiệm vụ: cùng hồ sơ đầu tuần (base) → so trạng thái hoàn thành có/không có buổi w.
  const base = hero({ ...ctx, workouts: upto, now: Math.min(w.end, Math.max(weekStart(w.end), dao?.at || 0)) });
  const qa = quests({ workouts: upto, exercises, now: w.end, profile: after, base, dao });
  const qb = quests({ workouts: upto.filter((x) => x.id !== w.id), exercises, now: w.end, profile: before, base, dao });
  const was = new Set(qb.quests.filter((q) => q.complete).map((q) => q.id));
  const doneQuests = qa.quests.filter((q) => q.complete && !was.has(q.id)).map(({ id, title, detail }) => ({ id, title, detail }));

  const cmp = analyzeWorkout(w, workouts.filter((x) => x.end));
  const tiers = cmp.map((o) => o.res?.tier).filter(Boolean), baseline = cmp.length > 0 && cmp.every((o) => o.first);
  const pham = tiers.sort((a, b) => RANK[b] - RANK[a])[0] || null;
  const L = after.linhKhi, L0 = before.linhKhi;
  return {
    needsWeight, needsSex, pham, baseline,
    linhKhi: { gain: L.xp - L0.xp, level: L.level, levelUp: L.level > L0.level, into: L.into, need: L.need, pct: L.pct },
    tuvi: { from: before.tuvi.label, to: after.tuvi.label, up: after.tuvi.label !== before.tuvi.label && after.tuvi.p > before.tuvi.p, opened: after.tuvi.opened, of: after.tuvi.of },
    meridians: needsWeight ? meridians.map((m) => ({ ...m, from: null, to: null, up: false, opened: false })) : meridians,
    quests: doneQuests,
    breakthroughs: needsWeight || needsSex ? [] : breakthroughs(snapshot(before), after),
    next: nextSession(w, { workouts: [...others, w], exercises, templates, schedule, dao, profile: after }),
  };
}

/** Buổi sau: theo lịch (ngày có lịch gần nhất sau hôm nay của w) → giáo án lâu chưa dùng → mạch lâu chưa tập. */
export function nextSession(w, { workouts = [], exercises = [], templates = [], schedule = {}, dao = null, profile = null } = {}) {
  const tpl = Object.fromEntries(templates.map((t) => [t.id, t]));
  const plan = cleanSchedule(schedule), day0 = dayStart(w.end);
  for (let i = 1; i <= 7 && Object.keys(plan).length; i++) {
    const d = new Date(day0); d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (!(String(dow) in plan)) continue;
    const t = tpl[plan[dow]];
    return { kind: 'schedule', when: i === 1 ? 'Mai' : DAY[dow], title: t ? t.name : 'Tập tự do', detail: t ? `${t.items.length} bài` : '', templateId: t?.id || null };
  }
  const done = workouts.filter((x) => x.end).sort((a, b) => a.start - b.start);
  const lastUse = (id) => done.filter((x) => x.templateId === id).at(-1)?.start ?? -Infinity;
  // Giáo án Công pháp xoay vòng theo thứ tự; không có thì giáo án lâu chưa dùng nhất.
  const order = (dao?.templateIds || []).filter((id) => tpl[id]);
  const pool = order.length ? order : templates.map((t) => t.id);
  if (pool.length) {
    const i = order.indexOf(w.templateId);
    const id = i >= 0 ? order[(i + 1) % order.length] : [...pool].sort((a, b) => lastUse(a) - lastUse(b))[0];
    return { kind: 'template', when: '', title: tpl[id].name, detail: `${tpl[id].items.length} bài`, templateId: id };
  }
  // Mạch lâu chưa tập nhất (trừ Bụng); chỉ gợi ý bài người dùng đã tập.
  const ex = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const last = {}, known = {};
  for (const x of done) for (const e of x.entries) {
    if (!doneSets(e).length) continue;
    const k = meridianOf(ex[e.exerciseId]);
    last[k] = x.start; known[k] = ex[e.exerciseId]?.name || known[k];
  }
  const ms = MERIDIANS.filter((m) => m.key !== 'core').sort((a, b) => (last[a.key] ?? -Infinity) - (last[b.key] ?? -Infinity) || b.w - a.w);
  const m = ms[0];
  if (!m) return null;
  const pm = profile?.meridians.find((x) => x.key === m.key);
  return { kind: 'meridian', when: '', title: `Mạch ${m.name}`, detail: known[m.key] ? `Gợi ý: ${known[m.key]}` : last[m.key] == null ? 'Chưa từng luyện' : (pm?.label || ''), meridian: m.key };
}
