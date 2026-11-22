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
 * hands = 2 nếu tạ ghi theo 1 quả tạ đơn nhưng hệ số tính tổng 2 tay, m = mạch,
 * bwf = phần cân nặng cơ thể nằm trong tải (mặc định 1 với chuẩn thân người, 0 với còn lại). Bài khác chỉ cho Linh khí.
 * Bài phụ (máy, cáp, tạ đơn) là quy đổi ước lượng thô — đủ để xếp cảnh giới, không phải chuẩn chính xác.
 */
export const LIFTS = [
  [/^squat\b/, 'squat', 1, 'legs'], [/^front squat/, 'squat', 0.8, 'legs'], [/^leg press/, 'squat', 2, 'legs'],
  [/^romanian deadlift/, 'deadlift', 0.7, 'legs'], [/^deadlift/, 'deadlift', 1, 'back'],
  [/^bench press/, 'bench', 1, 'chest'], [/^incline bench press/, 'bench', 0.8, 'chest'], [/^dumbbell press/, 'bench', 0.75, 'chest', 2],
  [/^close-?grip bench/, 'bench', 0.9, 'triceps'], [/^skull crusher/, 'bench', 0.4, 'triceps'], [/^dips\b/, 'dips', 1, 'triceps'],
  [/^overhead press/, 'ohp', 1, 'shoulders'], [/^dumbbell shoulder press/, 'ohp', 0.7, 'shoulders', 2],
  [/^barbell row/, 'row', 1, 'back'], [/^t-bar row/, 'row', 1, 'back'], [/^dumbbell row/, 'row', 0.45, 'back'], [/^pull-?up/, 'pullup', 1, 'back'],
  [/^barbell curl/, 'curl', 1, 'biceps'], [/^dumbbell curl/, 'curl', 0.45, 'biceps'],
  [/^incline dumbbell press/, 'bench', 0.65, 'chest', 2], [/^chest fly/, 'bench', 0.45, 'chest'], [/^(hít đất|push-?up)/, 'bench', 1, 'chest', 1, 0.64],
  [/^lat pulldown/, 'pullup', 0.9, 'back', 1, 0], [/^seated cable row/, 'row', 0.9, 'back'],
  [/^lateral raise/, 'ohp', 0.6, 'shoulders', 2], [/^rear delt fly/, 'ohp', 0.45, 'shoulders', 2], [/^face pull/, 'ohp', 0.6, 'shoulders'],
  [/^bulgarian split squat/, 'squat', 0.5, 'legs', 2], [/^leg extension/, 'squat', 0.7, 'legs'], [/^leg curl/, 'squat', 0.5, 'legs'],
  [/^hip thrust/, 'squat', 1.3, 'legs'], [/^calf raise/, 'squat', 1.2, 'legs'],
  [/^hammer curl/, 'curl', 0.5, 'biceps'], [/^cable curl/, 'curl', 0.8, 'biceps'],
  [/^triceps pushdown/, 'bench', 0.4, 'triceps'], [/^overhead triceps extension/, 'bench', 0.3, 'triceps'],
].map(([re, std, f, m, hands = 1, bwf]) => ({ re, std, f, m, hands, bwf: bwf ?? (STANDARDS[std].bw ? 1 : 0) }));

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

/** Ngược của progress: giá trị cần để đạt vị trí p. */
export function ratioAt(p, t) {
  if (!(p > 0)) return 0;
  const i = Math.min(5, Math.floor(p)), f = p - i;
  if (i === 5) return t[4] + f * (t[4] - t[3]);
  const lo = i ? t[i - 1] : 0;
  return lo + f * (t[i] - lo);
}

/** Số bài tối thiểu mỗi mạch phải luyện: cảnh giới mạch = trung bình 2 bài mạnh nhất (thiếu bài = 0). */
export const PAIR = 2;

/** Hư cảnh: mức tự khai chưa xác chứng chỉ tính tới Luyện Cân · Viên mãn (p 3,9). */
export const TEST_CAP = 3.9;
/** Xác chứng: buổi thật đạt ≥ 90% mức khai (cùng quy đổi ~1RM chuẩn, hoặc giây/rep với Bụng). */
export const VERIFY = 0.9;
/** Mức khai bị hỏi lại ("Đạo hữu chắc chứ?"): từ Luyện Cốt trở lên. */
export const DOUBT_FROM = 4;
/** Công lực khởi đầu theo thời gian tu đạo (Linh khí, ≈ cấp 1 / 11 / 19 / 27 / 33). */
export const START_XP = { new: 0, novice: 15000, mid: 60000, veteran: 150000, elder: 250000 };
/** Bài Bụng đo được ở Trắc linh căn: ngưỡng Luyện Khí → Hoá Thần theo giây (Plank) hoặc rep. */
export const CORE_TESTS = [
  { re: /^plank/, unit: 'giây', t: [45, 90, 150, 240, 360] },
  { re: /^hanging leg raise/, unit: 'rep', t: [5, 10, 15, 20, 30] },
  { re: /^ab wheel/, unit: 'rep', t: [5, 10, 20, 30, 50] },
];
export const coreTest = (ex) => (ex?.custom ? null : CORE_TESTS.find((c) => c.re.test(String(ex?.name || '').trim().toLowerCase())) || null);

/** Mạch của một bài: theo bảng quy đổi nếu có, không thì theo nhóm cơ. */
export const meridianOf = (ex) => liftOf(ex)?.m || MUSCLE[ex?.muscle]?.key || 'other';

/** {p, lv, realm:{i,name}, phase:{i,name}, label, tribulation} từ p. */
export function rank(p) {
  const i = Math.min(5, Math.floor(p)), f = p - i, ph = f < 0.3 ? 0 : f < 0.6 ? 1 : f < 0.9 ? 2 : 3;
  const r2 = (x) => Math.round(x * 1000) / 1000;
  return { p: r2(p), lv: Math.min(60, 1 + Math.floor(10 * p + 1e-9)), realm: { i, name: REALMS[i] }, phase: { i: ph, name: PHASES[ph] },
    label: i ? `${REALMS[i]} · ${PHASES[ph]}` : REALMS[0], tribulation: i >= TRIB_FROM };
}

/**
 * Luyện thể — bậc của từng mạch (Tu vi được đúc lên từ 7 mạch nên mạch không dùng tên cảnh giới).
 * Cùng ngưỡng p với rank(): Bế mạch → Luyện Bì → Luyện Nhục → Luyện Cân → Luyện Cốt → Luyện Tủy; độ thuần thục Sơ thành → Viên mãn.
 */
export const TEMPERS = ['Bế mạch', 'Luyện Bì', 'Luyện Nhục', 'Luyện Cân', 'Luyện Cốt', 'Luyện Tủy'];
export const MASTERY = ['Sơ thành', 'Tiểu thành', 'Đại thành', 'Viên mãn'];
export function temper(p) {
  const r = rank(p), i = r.realm.i, ph = r.phase.i;
  return { ...r, realm: { i, name: TEMPERS[i] }, phase: { i: ph, name: MASTERY[ph] }, label: i ? `${TEMPERS[i]} · ${MASTERY[ph]}` : TEMPERS[0], tribulation: false };
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
export function hero({ workouts = [], exercises = [], body = [], sex, schedule = {}, weekGoal = 3, dao = null, now = Date.now() } = {}) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const done = workouts.filter((w) => w.end && w.start <= now).sort((a, b) => a.start - b.start);
  const bw = bwAt(body.filter((b) => b.date <= now), now);
  const lk = linhKhi(done, exMap, { schedule, weekGoal });
  // Công pháp (dao.path): chỉ các bài đã chọn mới xét cảnh giới; chưa Nhập môn → mọi bài có quy đổi đều xét.
  const path = dao?.path && typeof dao.path === 'object' ? dao.path : null;
  const counted = (key, id) => !path?.[key]?.length || path[key].includes(id);
  // Trắc linh căn: mức tạ tự khai lúc Nhập môn = một "buổi" ảo ở dao.at, chỉ dùng cho kỷ lục/Căn cơ (không Linh khí, không nhiệm vụ).
  const tested = dao?.at <= now && Array.isArray(dao.tested) && dao.tested.length
    ? [{ id: 'dao', start: dao.at, tested: true, entries: dao.tested.map((t) => ({ exerciseId: t.exerciseId, sets: [{ w: +t.w || 0, r: +t.r || 0, done: true }] })) }] : [];

  // Công lực khởi đầu theo thời gian tu đạo (không còn cảnh "Nguyên Anh · cấp 1").
  const startXp = dao?.at <= now ? START_XP[dao.experience] || 0 : 0;
  if (startXp) { lk.total += startXp; lk.parts.dao = startXp; }

  // Kỷ lục từng bài, tách hai nguồn: real (buổi thật) và test (tự khai). n = ~1RM chuẩn / ngưỡng Kết Đan cho Căn cơ.
  // Bụng: bài có CORE_TESTS xét theo giây/rep (không theo cân nặng).
  const rec = {}, recent = {}, cut = now - 90 * D;
  for (const w of [...tested, ...done]) {
    const bwT = bwAt(body, w.start), slot = w.tested ? 'test' : 'real';
    for (const e of w.entries) {
      const ex = exMap[e.exerciseId], L = liftOf(ex), C = L ? null : coreTest(ex);
      const m = L ? L.m : C ? 'core' : null;
      if (!m || !counted(m, e.exerciseId)) continue;
      const cur = rec[e.exerciseId] || (rec[e.exerciseId] = { m, ex, L, C, n: 0, realEq: 0, real: null, test: null });
      for (const s of doneSets(e)) {
        let p, ratio = null, eq, one = null;
        if (C) {
          eq = Math.round(+s.r || 0);
          if (!(eq > 0)) continue;
          p = progress(eq, C.t);
        } else {
          const t = thresholds(L.std, sex), load = L.bwf * (bwT || 0) + (+s.w || 0) * L.hands;
          one = e1rm(load, Math.min(+s.r, MAX_REPS)); eq = one / L.f;
          if (!(eq > 0)) continue;
          const n = eq / t[2];
          if (w.start >= cut) recent[m] = Math.max(recent[m] || 0, n);
          cur.n = Math.max(cur.n, n);
          if (!w.tested) cur.realEq = Math.max(cur.realEq, eq);
          if (!bwT) continue;
          ratio = eq / bwT; p = progress(ratio, t);
        }
        if (C && !w.tested) cur.realEq = Math.max(cur.realEq, eq);
        if (!cur[slot] || p > cur[slot].p) cur[slot] = { p, ratio, eq, best: { exerciseId: e.exerciseId, name: ex.name, w: +s.w, r: +s.r, kg: one == null ? null : r1(one), eq: r1(eq),
          ratio: ratio == null ? null : r2(ratio), bw: bwT, t: w.start, workoutId: w.tested ? null : w.id, tested: !!w.tested, unit: C?.unit || null } };
      }
    }
  }
  // Hư cảnh: mức tự khai chỉ tính tới TEST_CAP cho tới khi một buổi thật đạt ≥ VERIFY × mức khai (Xác chứng).
  for (const r of Object.values(rec)) {
    const T = r.test, R = r.real;
    r.verified = !!T && r.realEq >= VERIFY * T.eq;
    const tp = T ? (r.verified ? T.p : Math.min(T.p, TEST_CAP)) : -1;
    const fromTest = !!T && tp > (R?.p ?? -1);
    const use = fromTest ? { ...T, p: tp } : R;
    Object.assign(r, { p: use?.p ?? -1, ratio: use?.ratio ?? null, best: use?.best || null,
      unverified: fromTest && !r.verified, capped: fromTest && !r.verified && T.p > TEST_CAP });
  }
  const liftView = (r) => ({ exerciseId: r.ex.id, name: r.ex.name, ...temper(r.p), ratio: r.ratio == null ? null : r2(r.ratio), kg: r.best?.kg ?? null,
    reps: r.C ? r.best?.r ?? null : null, unit: r.C?.unit || null, tested: !!r.best?.tested, unverified: r.unverified, capped: r.capped });

  const meridians = MERIDIANS.map((M) => {
    const xp = lk.byMeridian[M.key] || 0;
    if (M.key === 'core') {
      // Bụng: max(Linh khí mạch, TB 2 bài đo được) — người tập lâu khai Plank/Leg Raise không phải bắt đầu Phàm nhân.
      const cl = Object.values(rec).filter((r) => r.m === 'core' && r.p > 0).sort((a, b) => b.p - a.p), top = cl.slice(0, PAIR);
      const xpP = progress(xp, CORE_XP), testP = top.reduce((a, r) => a + r.p, 0) / PAIR;
      const p = Math.max(xpP, testP), rk = temper(p), ni = rk.realm.i;
      return { key: M.key, name: M.name, ...rk, ratio: null, best: null, canCo: null, shaky: false, xp, lifts: top.map(liftView), need: 0,
        unverified: testP > xpP && top.some((r) => r.unverified),
        next: ni < 5 ? { realm: TEMPERS[ni + 1], xp: CORE_XP[ni], left: Math.max(0, CORE_XP[ni] - xp) } : null };
    }
    // Cảnh giới mạch = trung bình PAIR bài mạnh nhất (bài thiếu tính 0) → phải luyện đủ bài mới lên được.
    const all = Object.values(rec).filter((r) => r.m === M.key), lifts = all.filter((r) => r.p > 0).sort((a, b) => b.p - a.p);
    const top = lifts.slice(0, PAIR), p = top.reduce((a, r) => a + r.p, 0) / PAIR, rk = temper(p);
    const nMax = Math.max(0, ...all.map((r) => r.n));
    const canCo = nMax ? Math.round(((recent[M.key] || 0) / nMax) * 100) : null;
    // Bình cảnh: bài cần nâng để mạch lên cảnh giới kế (1 rep, cân nặng hiện tại).
    //  - bài mạnh nhất đã ≥ mốc → nâng bài thứ hai tới 2·mốc − bài mạnh nhất;
    //  - chưa → cả hai bài cùng phải tới mốc (pair = true), gợi ý bài mạnh nhất (hoặc bài chuẩn).
    let next = null;
    const ni = rk.realm.i, P = ni + 1, [A, B] = lifts;
    const pool = exercises.filter((e) => !e.custom && liftOf(e)?.m === M.key && counted(M.key, e.id) && e.id !== A?.ex.id)
      .sort((a, b) => (path?.[M.key]?.indexOf(a.id) ?? 0) - (path?.[M.key]?.indexOf(b.id) ?? 0) || LIFTS.indexOf(liftOf(a)) - LIFTS.indexOf(liftOf(b))); // Công pháp trước, rồi theo thứ tự ưu tiên LIFTS
    const pair = !A || A.p < P;
    const ex = pair ? A?.ex || pool[0] : B?.ex || pool[0];
    const L = liftOf(ex);
    if (L && bw && ni < 5) {
      const pNeed = pair ? P : Math.max(2 * P - A.p, 1e-6);
      const ratio = ratioAt(Math.min(pNeed, 5.99), thresholds(L.std, sex)), eq = ratio * bw * L.f;
      const kgAt = (r) => { const load = r === 1 ? eq : eq / (1 + r / 30); return ceilHalf(Math.max(0, (load - L.bwf * bw) / L.hands)); };
      next = { realm: TEMPERS[P], ratio: r2(ratio), exerciseId: ex.id, name: ex.name, kg: kgAt(1), added: L.bwf > 0, perHand: L.hands === 2, pair,
        alt: { r: CHALLENGE_REPS, kg: kgAt(CHALLENGE_REPS) } };
    }
    return { key: M.key, name: M.name, ...rk, ratio: A?.ratio != null ? r2(A.ratio) : null, best: A?.best || null, canCo, shaky: canCo != null && canCo < SHAKY, xp,
      lifts: top.map(liftView), unverified: top.some((r) => r.unverified),
      need: Math.max(0, PAIR - lifts.length), next };
  });

  // Lời khai (mức tự khai gốc, chưa giới hạn) + việc cần làm để Xác chứng từng bài.
  const claims = Object.values(rec).filter((r) => r.test).map((r) => {
    const T = r.test, L = r.L, goal = VERIFY * T.eq;
    let target = null;
    if (r.C) target = { reps: Math.ceil(goal - 1e-9), unit: r.C.unit };
    else if (bw) {
      const one = goal * L.f, kgAt = (n) => ceilHalf(Math.max(0, ((n === 1 ? one : one / (1 + n / 30)) - L.bwf * bw) / L.hands));
      target = { kg: kgAt(1), alt: { r: CHALLENGE_REPS, kg: kgAt(CHALLENGE_REPS) }, added: L.bwf > 0, perHand: L.hands === 2 };
    }
    return { exerciseId: r.ex.id, name: r.ex.name, meridian: r.m, ...temper(T.p), verified: r.verified, capped: !r.verified && T.p > TEST_CAP,
      pct: T.eq ? Math.min(100, Math.round((r.realEq / T.eq) * 100)) : 0, target };
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
    meridians, claims, unverified: meridians.some((m) => m.unverified),
    verified: claims.filter((c) => c.verified).map((c) => c.exerciseId),
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
  s.verified = [...(profile.verified || [])];
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
    const tv = it.key === 'tuvi', [RN, PN] = tv ? [REALMS, PHASES] : [TEMPERS, MASTERY];
    // Tu vi: Đột phá / Độ kiếp. Mạch: Thối thể (luyện thể lên bậc) — không bao giờ độ kiếp.
    out.push({ key: it.key, kind: tv ? 'tuvi' : 'temper', name: it.name, from: ri ? `${RN[ri]} · ${PN[pi]}` : RN[0], to: it.label, realm, level: it.realm.i,
      tribulation: tv && realm && it.realm.i >= TRIB_FROM, real: it.real });
  }
  // Xác chứng: bài tự khai vừa được buổi thật chứng minh (mốc cũ chưa có danh sách → coi như chưa bài nào).
  const was = new Set(Array.isArray(seen.verified) ? seen.verified : []);
  for (const c of profile.claims || []) {
    if (!c.verified || was.has(c.exerciseId)) continue;
    const mer = profile.meridians.find((m) => m.key === c.meridian);
    out.push({ key: 'verify', kind: 'verify', level: c.realm.i, exerciseId: c.exerciseId, verify: true, name: `Xác chứng · ${c.name}`, from: 'Hư cảnh', to: c.label, realm: false, tribulation: false,
      real: `Lời khai đã được chứng minh · mạch ${mer?.name || ''} ${mer?.label || ''}`.trim() });
  }
  const score = (e) => (e.tribulation ? 4 : 0) + (e.realm ? 2 : 0) + (e.verify ? 1.5 : 0) + (e.key === 'tuvi' ? 1 : 0);
  return out.sort((a, b) => score(b) - score(a));
}

/**
 * Nhiệm vụ tuần (T2–CN chứa `now`), 3 cái sinh từ dữ liệu, không lưu gì:
 *  schedule — tập đủ số ngày theo lịch (không có lịch → weekGoal);
 *  overload — vượt lần trước ở một bài của mạch yếu nhất (p thấp nhất, trừ Bụng);
 *  canCo    — tập ≥1 buổi có mạch Căn cơ thấp nhất (chưa có Căn cơ → mạch lâu chưa tập nhất), khác mạch nhiệm vụ 2.
 * Trả về {quests:[{id, title, detail, meridian, goal, done, complete}], done, total}.
 */
export function quests({ workouts = [], exercises = [], profile, base = null, schedule = {}, weekGoal = 3, now = Date.now() } = {}) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const done = workouts.filter((w) => w.end && w.start <= now).sort((a, b) => a.start - b.start);
  const wk = weekKey(now), week = done.filter((w) => weekKey(w.start) === wk);
  const keyOf = (id) => meridianOf(exMap[id]);
  const trains = (w, key) => w.entries.some((e) => keyOf(e.exerciseId) === key && doneSets(e).length);
  const days = new Set(week.filter((w) => w.entries.some((e) => doneSets(e).length)).map((w) => new Date(w.start).toDateString()));
  const list = [];

  const planned = Object.keys(schedule || {}).length, goal1 = planned || Math.max(1, weekGoal || 0);
  list.push({ id: 'schedule', title: `Tập đủ ${goal1} buổi tuần này`, detail: planned ? 'Theo lịch tập' : 'Theo mục tiêu tuần', meridian: null, goal: goal1, done: Math.min(goal1, days.size) });

  // Chọn mạch theo hồ sơ đầu tuần (base) để nhiệm vụ không đổi giữa tuần khi số liệu thay đổi.
  const body = (base || profile).meridians.filter((m) => m.key !== 'core');
  const weak = [...body].sort((a, b) => a.p - b.p || weight(b.key) - weight(a.key))[0];
  const hint = weak.next?.name || weak.best?.name || exercises.filter((e) => !e.custom && liftOf(e)?.m === weak.key).sort((a, b) => LIFTS.indexOf(liftOf(a)) - LIFTS.indexOf(liftOf(b)))[0]?.name;
  // Còn lời khai chưa xác chứng → nhiệm vụ Xác chứng (bài nặng ký nhất của mạch có trọng số lớn nhất).
  const P0 = base || profile;
  const claim = (P0.claims || []).filter((c) => !c.verified && c.target)
    .sort((a, b) => weight(b.meridian) - weight(a.meridian) || b.p - a.p)[0];
  if (claim) {
    const mer = MERIDIANS.find((m) => m.key === claim.meridian), t = claim.target;
    const goal = t.unit ? `${t.reps} ${t.unit}` : `~1RM ${fmt(t.kg)} kg${t.added ? ' đeo thêm' : t.perHand ? ' mỗi tay' : ''} (vd. ${fmt(t.alt.kg)} kg × ${t.alt.r})`;
    const ok = (profile.verified || []).includes(claim.exerciseId);
    list.push({ id: 'overload', kind: 'verify', title: `Xác chứng mạch ${mer.name}`, detail: `${claim.name} ${goal}`, meridian: claim.meridian, exerciseId: claim.exerciseId, goal: 1, done: ok ? 1 : 0 });
  } else if (weak.need) {
    // Mạch chưa đủ bài để xét cảnh giới → "Khai mạch": tập bài còn thiếu (chưa có lần trước thì không thể "vượt").
    const opened = week.some((w) => w.entries.some((e) => e.exerciseId === weak.next?.exerciseId && doneSets(e).length));
    const any = week.some((w) => trains(w, weak.key));
    list.push({ id: 'overload', kind: 'open', title: `Khai mạch ${weak.name}`, detail: hint ? `Luyện ${hint}` : `Còn thiếu ${weak.need} bài`, meridian: weak.key, goal: 1, done: (weak.next ? opened : any) ? 1 : 0 });
  } else {
    const beat = week.some((w) => analyzeWorkout(w, done).some((o) => o.res && keyOf(o.exerciseId) === weak.key));
    list.push({ id: 'overload', kind: 'beat', title: `Vượt lần trước ở mạch ${weak.name}`, detail: hint ? `Gợi ý: ${hint}` : `Mạch yếu nhất · ${weak.label}`, meridian: weak.key, goal: 1, done: beat ? 1 : 0 });
  }

  const rest = body.filter((m) => m.key !== weak.key);
  const last = (key) => done.filter((w) => trains(w, key)).at(-1)?.start ?? -Infinity;
  const withCc = rest.filter((m) => m.canCo != null).sort((a, b) => a.canCo - b.canCo || last(a.key) - last(b.key));
  const low = withCc[0] || [...rest].sort((a, b) => last(a.key) - last(b.key) || weight(b.key) - weight(a.key))[0];
  list.push({ id: 'canCo', title: `Thêm buổi cho mạch ${low.name}`, detail: low.canCo != null ? `Căn cơ ${low.canCo}%` : last(low.key) > -Infinity ? 'Lâu chưa tập' : 'Chưa từng luyện', meridian: low.key, goal: 1, done: week.some((w) => trains(w, low.key)) ? 1 : 0 });

  for (const q of list) q.complete = q.done >= q.goal;
  return { quests: list, done: list.filter((q) => q.complete).length, total: list.length };
}

/** Microcopy tu tiên (settings.lore, mặc định tắt). term('start', on) → 'Bế quan' | 'Bắt đầu'. */
export const LORE = { start: ['Bắt đầu', 'Bế quan'], rest: ['Nghỉ', 'Điều tức'], finish: ['Kết thúc', 'Xuất quan'] };
export const term = (k, on) => LORE[k]?.[on ? 1 : 0] ?? k;
