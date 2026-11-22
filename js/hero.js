// Con Đường Tu Luyện (RPG.md): hàm thuần, tính lại toàn bộ từ dữ liệu có sẵn, không đụng DB.
// Mọi con số tu luyện đi kèm số thật (kg, ~1RM, ×BW). Chuẩn là ước lượng tham khảo.
import { e1rm } from './util.js';
import { doneSets } from './stats.js';
import { analyzeWorkout } from './overload.js';
import { weekKey } from './medals.js';
import { MUSCLE } from './insights.js';

const D = 864e5;
export const REALMS = ['Phàm nhân', 'Luyện Khí', 'Trúc Cơ', 'Kết Đan', 'Nguyên Anh', 'Hoá Thần'];
export const PHASES = ['Sơ kỳ', 'Trung kỳ', 'Hậu kỳ', 'Đại viên mãn'];
export const TRIB_FROM = 3; // từ Kết Đan trở lên: đột phá = "độ kiếp"
export const SHAKY = 85; // Căn cơ < 85% → "căn cơ lung lay"
export const MAX_REPS = 12; // ~1RM chỉ tính tối đa 12 rep/set (set rep cao ước lượng quá tay)
export const MAX_SETS = 40; // Linh khí: tối đa 40 set/buổi
export const CHALLENGE_REPS = 5; // Bình cảnh: kèm mốc kg × 5 rep (dễ tập hơn thử 1RM)

/** Ngưỡng ~1RM/cân nặng (nam) cho Luyện Khí → Hoá Thần. `lower` = thân dưới (nữ ×0,75, còn lại ×0,6). */
export const STANDARDS = {
  squat: { name: 'Squat', t: [0.75, 1.25, 1.5, 2.25, 2.75], lower: true },
  bench: { name: 'Bench', t: [0.5, 0.75, 1.0, 1.5, 2.0] },
  deadlift: { name: 'Deadlift', t: [1.0, 1.5, 2.0, 2.5, 3.0], lower: true },
  ohp: { name: 'OHP', t: [0.35, 0.55, 0.75, 1.0, 1.35] },
  row: { name: 'Barbell Row', t: [0.5, 0.75, 1.0, 1.25, 1.5] },
  pullup: { name: 'Pull-up', t: [1.0, 1.15, 1.35, 1.6, 1.9], bw: true },
  curl: { name: 'Barbell Curl', t: [0.2, 0.4, 0.6, 0.85, 1.15] },
  dips: { name: 'Dips', t: [1.0, 1.2, 1.45, 1.75, 2.1], bw: true },
};

/**
 * Bài tính cảnh giới (theo tên): std = bài chuẩn, f = hệ số quy đổi (~1RM ÷ f = ~1RM chuẩn tương đương),
 * hands = 2 nếu tạ ghi theo 1 quả tạ đơn nhưng hệ số tính tổng 2 tay, m = mạch. Bài khác chỉ cho Linh khí.
 */
export const LIFTS = [
  [/^squat\b/, 'squat', 1, 'legs'], [/^front squat/, 'squat', 0.8, 'legs'], [/^leg press/, 'squat', 2, 'legs'],
  [/^romanian deadlift/, 'deadlift', 0.7, 'legs'], [/^deadlift/, 'deadlift', 1, 'back'],
  [/^bench press/, 'bench', 1, 'chest'], [/^incline bench press/, 'bench', 0.8, 'chest'], [/^dumbbell press/, 'bench', 0.75, 'chest', 2],
  [/^close-?grip bench/, 'bench', 0.9, 'triceps'], [/^skull crusher/, 'bench', 0.4, 'triceps'], [/^dips\b/, 'dips', 1, 'triceps'],
  [/^overhead press/, 'ohp', 1, 'shoulders'], [/^dumbbell shoulder press/, 'ohp', 0.7, 'shoulders', 2],
  [/^barbell row/, 'row', 1, 'back'], [/^t-bar row/, 'row', 1, 'back'], [/^dumbbell row/, 'row', 0.45, 'back'], [/^pull-?up/, 'pullup', 1, 'back'],
  [/^barbell curl/, 'curl', 1, 'biceps'], [/^dumbbell curl/, 'curl', 0.45, 'biceps'],
].map(([re, std, f, m, hands = 1]) => ({ re, std, f, m, hands }));

/** Thất mạch: key = data-muscle (insights.MUSCLE), w = trọng số Tu vi, main = bài chuẩn gợi ý Bình cảnh khi chưa có dữ liệu. */
export const MERIDIANS = [
  { key: 'chest', name: 'Ngực', w: 1.2, main: /^bench press/ },
  { key: 'back', name: 'Lưng', w: 1.5, main: /^deadlift/ },
  { key: 'shoulders', name: 'Vai', w: 1, main: /^overhead press/ },
  { key: 'legs', name: 'Chân', w: 1.5, main: /^squat\b/ },
  { key: 'biceps', name: 'Tay trước', w: 0.6, main: /^barbell curl/ },
  { key: 'triceps', name: 'Tay sau', w: 0.6, main: /^dips\b/ },
  { key: 'core', name: 'Bụng', w: 0.6, main: null },
];
export const CORE_XP = [500, 2000, 6000, 15000, 30000]; // Bụng: cảnh giới theo Linh khí mạch

export const XP = { set: 10, session: 50, schedule: 30, bronze: 20, silver: 40, gold: 80, weekGoal: 150, streak: 20, streakMax: 10 };

export const liftOf = (ex) => (ex?.custom ? null : LIFTS.find((l) => l.re.test(String(ex?.name || '').trim().toLowerCase())) || null);

/** Ngưỡng theo giới tính. */
export function thresholds(std, sex = 'm') {
  const s = STANDARDS[std];
  const k = sex === 'f' ? (s.lower ? 0.75 : 0.6) : 1;
  return s.t.map((v) => v * k);
}

/** Vị trí liên tục 0 → <6 từ giá trị và 5 ngưỡng tăng dần. Trên Hoá Thần: tiếp tục theo bước cuối, chặn ở 5,99. */
export function progress(v, t) {
  if (!(v > 0)) return 0;
  const i = t.filter((x) => v >= x).length; // 0..5
  if (i === 5) return Math.min(5.99, 5 + (v - t[4]) / (t[4] - t[3]));
  const lo = i ? t[i - 1] : 0;
  return i + (v - lo) / (t[i] - lo);
}

/** {p, lv, realm:{i,name}, phase:{i,name}, label, tribulation} từ p. */
export function rank(p) {
  const i = Math.min(5, Math.floor(p)), f = p - i, ph = f < 0.3 ? 0 : f < 0.6 ? 1 : f < 0.9 ? 2 : 3;
  const r2 = (x) => Math.round(x * 1000) / 1000;
  return { p: r2(p), lv: Math.min(60, 1 + Math.floor(10 * p + 1e-9)), realm: { i, name: REALMS[i] }, phase: { i: ph, name: PHASES[ph] },
    label: i ? `${REALMS[i]} · ${PHASES[ph]}` : REALMS[0], tribulation: i >= TRIB_FROM };
}

/** Công lực: lên từ cấp L sang L+1 cần 100 × L^1,5 Linh khí (cộng dồn), bắt đầu cấp 1. */
export function level(xp) {
  let lv = 1, base = 0;
  while (xp >= base + Math.round(100 * lv ** 1.5)) { base += Math.round(100 * lv ** 1.5); lv++; }
  const need = Math.round(100 * lv ** 1.5), into = xp - base;
  return { level: lv, xp, into, need, pct: Math.floor((into / need) * 100) };
}

/** Cân nặng lần cân gần nhất tại thời điểm t (chưa có lần nào trước t → lần cân sớm nhất). */
export function bwAt(body, t) {
  const bs = (body || []).filter((b) => b.weight > 0).sort((a, b) => a.date - b.date);
  if (!bs.length) return null;
  return (bs.filter((b) => b.date <= t).at(-1) || bs[0]).weight;
}

const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
const ceilHalf = (x) => Math.ceil(x * 2 - 1e-9) / 2 + 0; // + 0: đổi -0 thành 0

/** Linh khí từ lịch sử: {total, byMeridian:{key: xp}, parts:{sets, sessions, schedule, overload, weekGoal, streak}}. */
export function linhKhi(done, exMap, { schedule = {}, weekGoal = 3 } = {}) {
  const parts = { sets: 0, sessions: 0, schedule: 0, overload: 0, weekGoal: 0, streak: 0 }, byMeridian = {};
  const days = new Set(), weeks = {};
  for (const w of done) {
    let n = 0;
    for (const e of w.entries) {
      const m = MUSCLE[exMap[e.exerciseId]?.muscle]?.key;
      const k = Math.min(doneSets(e).length, MAX_SETS - n);
      if (k <= 0) continue;
      n += k; parts.sets += k * XP.set;
      if (m && m !== 'other') byMeridian[m] = (byMeridian[m] || 0) + k * XP.set;
    }
    if (!n) continue; // buổi không có set nào: không tính
    parts.sessions += XP.session;
    const day = new Date(w.start).toDateString();
    if (!days.has(day) && String(new Date(w.start).getDay()) in (schedule || {})) parts.schedule += XP.schedule;
    days.add(day);
    for (const o of analyzeWorkout(w, done)) if (o.res) parts.overload += XP[o.res.tier] || 0;
    const wk = weekKey(w.start);
    weeks[wk] = (weeks[wk] || 0) + 1;
  }
  const wk = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  let run = 0;
  wk.forEach((k, i) => {
    run = i && k === wk[i - 1] + 1 ? run + 1 : 1;
    parts.streak += XP.streak * Math.min(run, XP.streakMax);
    if (weekGoal > 0 && weeks[k] >= weekGoal) parts.weekGoal += XP.weekGoal;
  });
  return { total: Object.values(parts).reduce((a, b) => a + b, 0), byMeridian, parts };
}

/**
 * Hợp đồng dữ liệu cho trang Động phủ (#/hero). Đầu vào: workouts, exercises, body, settings {sex, schedule, weekGoal}.
 * Trả về {
 *   needsWeight, needsSex, bw (kg hiện tại|null), sex,
 *   tuvi: rank (+ p), canCo: % | null, shaky,
 *   linhKhi: {xp, level, into, need, pct, parts},
 *   meridians: [{key, name, ...rank, ratio, best, canCo, shaky, xp, next}] × 7 (thứ tự MERIDIANS)
 * } — chi tiết từng trường ở NOTES.md.
 */
export function hero({ workouts = [], exercises = [], body = [], sex, schedule = {}, weekGoal = 3, now = Date.now() } = {}) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const done = workouts.filter((w) => w.end && w.start <= now).sort((a, b) => a.start - b.start);
  const bw = bwAt(body.filter((b) => b.date <= now), now);
  const lk = linhKhi(done, exMap, { schedule, weekGoal });

  // Kỷ lục từng mạch: set có p cao nhất (theo cân nặng lúc tập); n = ~1RM chuẩn / ngưỡng Kết Đan (so sánh được giữa các bài, không phụ thuộc cân nặng) cho Căn cơ.
  const rec = {}, recent = {}, cut = now - 90 * D;
  for (const w of done) {
    const bwT = bwAt(body, w.start);
    for (const e of w.entries) {
      const ex = exMap[e.exerciseId], L = liftOf(ex);
      if (!L) continue;
      const t = thresholds(L.std, sex), isBw = STANDARDS[L.std].bw;
      for (const s of doneSets(e)) {
        const load = isBw ? (bwT || 0) + (+s.w || 0) : (+s.w || 0) * L.hands;
        const one = e1rm(load, Math.min(+s.r, MAX_REPS)), eq = one / L.f;
        if (!(eq > 0)) continue;
        const n = eq / t[2];
        if (w.start >= cut) recent[L.m] = Math.max(recent[L.m] || 0, n);
        const cur = rec[L.m] || (rec[L.m] = { n: 0, p: -1 });
        cur.n = Math.max(cur.n, n);
        if (!bwT) continue;
        const ratio = eq / bwT, p = progress(ratio, t);
        if (p > cur.p) Object.assign(cur, { p, ratio, best: { exerciseId: e.exerciseId, name: ex.name, w: +s.w, r: +s.r, kg: r1(one), eq: r1(eq), ratio: r2(ratio), bw: bwT, t: w.start, workoutId: w.id } });
      }
    }
  }

  const meridians = MERIDIANS.map((M) => {
    const xp = lk.byMeridian[M.key] || 0;
    if (M.key === 'core') {
      const p = progress(xp, CORE_XP), rk = rank(p), ni = rk.realm.i;
      return { key: M.key, name: M.name, ...rk, ratio: null, best: null, canCo: null, shaky: false, xp,
        next: ni < 5 ? { realm: REALMS[ni + 1], xp: CORE_XP[ni], left: CORE_XP[ni] - xp } : null };
    }
    const R = rec[M.key], p = R && R.p > 0 ? R.p : 0, rk = rank(p);
    const canCo = R?.n ? Math.round(((recent[M.key] || 0) / R.n) * 100) : null;
    // Bình cảnh: kg cần (1 rep, cân nặng hiện tại) ở bài đang giữ kỷ lục, hoặc bài chuẩn của mạch.
    let next = null;
    const ex = R?.best ? exMap[R.best.exerciseId] : exercises.find((e) => M.main?.test(e.name.trim().toLowerCase()) && !e.custom);
    const L = liftOf(ex), ni = rk.realm.i;
    if (L && bw && ni < 5) {
      const ratio = thresholds(L.std, sex)[ni], eq = ratio * bw * L.f;
      const bwLift = STANDARDS[L.std].bw;
      const kgAt = (r) => { const load = r === 1 ? eq : eq / (1 + r / 30); return ceilHalf(Math.max(0, bwLift ? load - bw : load / L.hands)); };
      next = { realm: REALMS[ni + 1], ratio, exerciseId: ex.id, name: ex.name, kg: kgAt(1), added: !!bwLift, perHand: L.hands === 2,
        alt: { r: CHALLENGE_REPS, kg: kgAt(CHALLENGE_REPS) } };
    }
    return { key: M.key, name: M.name, ...rk, ratio: R?.ratio != null ? r2(R.ratio) : null, best: R?.best || null, canCo, shaky: canCo != null && canCo < SHAKY, xp, next };
  });

  const wSum = MERIDIANS.reduce((a, m) => a + m.w, 0);
  const tuvi = rank(meridians.reduce((a, m, i) => a + m.p * MERIDIANS[i].w, 0) / wSum);
  const cc = meridians.map((m) => m.canCo).filter((v) => v != null);
  const canCo = cc.length ? Math.round(cc.reduce((a, b) => a + b, 0) / cc.length) : null;
  // Thử thách Bình cảnh: mạch có mốc kg gần chạm nhất (phần đã đi trong cảnh giới cao nhất; hoà → trọng số lớn hơn).
  const near = meridians.filter((m) => m.next?.kg != null)
    .sort((a, b) => (b.p - b.realm.i) - (a.p - a.realm.i) || weight(b.key) - weight(a.key))[0];
  return {
    needsWeight: !bw, needsSex: sex !== 'm' && sex !== 'f', bw, sex,
    tuvi, canCo, shaky: canCo != null && canCo < SHAKY,
    linhKhi: { ...level(lk.total), parts: lk.parts },
    meridians,
    challenge: near ? { key: near.key, name: near.name, label: near.label, pct: Math.round((near.p - near.realm.i) * 100), next: near.next } : null,
  };
}

const weight = (key) => MERIDIANS.find((m) => m.key === key)?.w || 0;
const step = (r) => r.realm.i * 4 + r.phase.i;
const fmt = (x) => x.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/** Mốc "đã xem" để so Đột phá: {tuvi:[realm, phase], chest:[...], ...}. Lưu ở localStorage (view lo). */
export function snapshot(profile) {
  const s = { tuvi: [profile.tuvi.realm.i, profile.tuvi.phase.i] };
  for (const m of profile.meridians) s[m.key] = [m.realm.i, m.phase.i];
  return s;
}

/**
 * Đột phá kể từ mốc đã xem. seen = null (lần đầu) → [] (chỉ lưu mốc, không ăn mừng).
 * Trả về [{key ('tuvi'|mạch), name, from, to (label), realm (true = lên cảnh giới, false = lên kỳ), tribulation, real}],
 * xếp quan trọng nhất trước: độ kiếp > lên cảnh giới > lên kỳ, Tu vi trước mạch.
 */
export function breakthroughs(seen, profile) {
  if (!seen || typeof seen !== 'object') return [];
  const items = [{ key: 'tuvi', name: 'Tu vi', ...profile.tuvi, real: `Công lực cấp ${profile.linhKhi.level}` }, ...profile.meridians.map((m) => ({
    ...m, real: m.best ? `${m.best.name} ${fmt(m.ratio)}×BW · ~1RM ${fmt(m.best.kg)} kg` : m.key === 'core' ? `${fmt(m.xp)} Linh khí` : '',
  }))];
  const out = [];
  for (const it of items) {
    const [ri = 0, pi = 0] = seen[it.key] || [];
    // Phàm nhân không hiện kỳ → không ăn mừng "lên kỳ" bên trong Phàm nhân.
    if (!it.realm.i || step(it) <= (ri ? ri * 4 + pi : 0)) continue;
    const realm = it.realm.i > ri;
    out.push({ key: it.key, name: it.name, from: ri ? `${REALMS[ri]} · ${PHASES[pi]}` : REALMS[0], to: it.label, realm,
      tribulation: realm && it.realm.i >= TRIB_FROM, real: it.real });
  }
  const score = (e) => (e.tribulation ? 4 : 0) + (e.realm ? 2 : 0) + (e.key === 'tuvi' ? 1 : 0);
  return out.sort((a, b) => score(b) - score(a));
}

/**
 * Nhiệm vụ tuần (T2–CN chứa `now`), 3 cái sinh từ dữ liệu, không lưu gì:
 *  schedule — tập đủ số ngày theo lịch (không có lịch → weekGoal);
 *  overload — vượt lần trước ở một bài của mạch yếu nhất (p thấp nhất, trừ Bụng);
 *  canCo    — tập ≥1 buổi có mạch Căn cơ thấp nhất (chưa có Căn cơ → mạch lâu chưa tập nhất), khác mạch nhiệm vụ 2.
 * Trả về {quests:[{id, title, detail, meridian, goal, done, complete}], done, total}.
 */
export function quests({ workouts = [], exercises = [], profile, schedule = {}, weekGoal = 3, now = Date.now() } = {}) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const done = workouts.filter((w) => w.end && w.start <= now).sort((a, b) => a.start - b.start);
  const wk = weekKey(now), week = done.filter((w) => weekKey(w.start) === wk);
  const keyOf = (id) => MUSCLE[exMap[id]?.muscle]?.key;
  const trains = (w, key) => w.entries.some((e) => keyOf(e.exerciseId) === key && doneSets(e).length);
  const days = new Set(week.filter((w) => w.entries.some((e) => doneSets(e).length)).map((w) => new Date(w.start).toDateString()));
  const named = (key) => profile.meridians.find((m) => m.key === key);
  const list = [];

  const planned = Object.keys(schedule || {}).length, goal1 = planned || Math.max(1, weekGoal || 0);
  list.push({ id: 'schedule', title: `Tập đủ ${goal1} buổi tuần này`, detail: planned ? 'Theo lịch tập' : 'Theo mục tiêu tuần', meridian: null, goal: goal1, done: Math.min(goal1, days.size) });

  const body = profile.meridians.filter((m) => m.key !== 'core');
  const weak = [...body].sort((a, b) => a.p - b.p || weight(b.key) - weight(a.key))[0];
  const beat = week.some((w) => analyzeWorkout(w, done).some((o) => o.res && keyOf(o.exerciseId) === weak.key));
  const hint = weak.best?.name || weak.next?.name;
  list.push({ id: 'overload', title: `Vượt lần trước ở mạch ${weak.name}`, detail: hint ? `Gợi ý: ${hint}` : `Mạch yếu nhất · ${weak.label}`, meridian: weak.key, goal: 1, done: beat ? 1 : 0 });

  const rest = body.filter((m) => m.key !== weak.key);
  const last = (key) => done.filter((w) => trains(w, key)).at(-1)?.start ?? -Infinity;
  const withCc = rest.filter((m) => m.canCo != null).sort((a, b) => a.canCo - b.canCo || last(a.key) - last(b.key));
  const low = withCc[0] || [...rest].sort((a, b) => last(a.key) - last(b.key) || weight(b.key) - weight(a.key))[0];
  list.push({ id: 'canCo', title: `Thêm buổi cho mạch ${low.name}`, detail: low.canCo != null ? `Căn cơ ${low.canCo}%` : 'Lâu chưa tập', meridian: low.key, goal: 1, done: week.some((w) => trains(w, low.key)) ? 1 : 0 });

  for (const q of list) q.complete = q.done >= q.goal;
  return { quests: list, done: list.filter((q) => q.complete).length, total: list.length };
}

/** Microcopy tu tiên (settings.lore, mặc định tắt). term('start', on) → 'Bế quan' | 'Bắt đầu'. */
export const LORE = { start: ['Bắt đầu', 'Bế quan'], rest: ['Nghỉ', 'Điều tức'], finish: ['Kết thúc', 'Xuất quan'] };
export const term = (k, on) => LORE[k]?.[on ? 1 : 0] ?? k;
