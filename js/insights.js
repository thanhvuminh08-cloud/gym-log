// Số liệu tổng quan (hàm thuần, không đụng DB): lưới năm, mức tạ chính, khối lượng tuần theo nhóm cơ.
import { e1rm } from './util.js';
import { doneSets } from './stats.js';
import { weekKey } from './medals.js';

const D = 864e5, WEEK = 7 * D;

/** Nhóm cơ → khoá dùng cho `data-muscle` + màu dự phòng (CSS có thể ghi đè fill/background). */
export const MUSCLE = {
  'Ngực': { key: 'chest', color: '#f0506e' },
  'Lưng': { key: 'back', color: '#3b9eff' },
  'Vai': { key: 'shoulders', color: '#f5a524' },
  'Chân': { key: 'legs', color: '#2ec4b6' },
  'Tay trước': { key: 'biceps', color: '#a78bfa' },
  'Tay sau': { key: 'triceps', color: '#e879f9' },
  'Bụng': { key: 'core', color: '#facc15' },
  'Khác': { key: 'other', color: '#94a3b8' },
};
export const muscleOf = (ex) => (MUSCLE[ex?.muscle] ? ex.muscle : 'Khác');
export const muscleKey = (ex) => MUSCLE[muscleOf(ex)].key;

const ended = (ws) => ws.filter((w) => w.end);
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

/** Số set đã xong theo nhóm cơ của 1 buổi: {muscle: sets}. */
function setsByMuscle(w, ex) {
  const out = {};
  for (const e of w.entries) {
    const n = doneSets(e).length;
    if (n) out[muscleOf(ex[e.exerciseId])] = (out[muscleOf(ex[e.exerciseId])] || 0) + n;
  }
  return out;
}

/**
 * Lưới thói quen 1 năm: 12 cột tháng × 31 hàng ngày.
 * Trả về {year, months:[[{day, t, muscle|null, future}|null ×31] ×12], counts:{muscle: số ngày}, total}.
 * Nhóm cơ của ngày = nhóm có nhiều set nhất trong các buổi ngày đó.
 */
export function yearGrid(workouts, ex, year = new Date().getFullYear(), now = Date.now()) {
  const byDay = {};
  for (const w of ended(workouts)) {
    if (new Date(w.start).getFullYear() !== year) continue;
    const k = dayKey(w.start), m = (byDay[k] ||= {});
    for (const [mu, n] of Object.entries(setsByMuscle(w, ex))) m[mu] = (m[mu] || 0) + n;
  }
  const counts = {};
  let total = 0;
  const months = Array.from({ length: 12 }, (_, mo) => Array.from({ length: 31 }, (_, i) => {
    const d = new Date(year, mo, i + 1);
    if (d.getMonth() !== mo) return null;
    const sets = byDay[dayKey(d)];
    let muscle = null;
    if (sets) {
      muscle = Object.entries(sets).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Khác';
      counts[muscle] = (counts[muscle] || 0) + 1;
      total++;
    }
    return { day: i + 1, t: d.getTime(), muscle, future: d.getTime() > now };
  }));
  return { year, months, counts, total };
}

/** Các năm có dữ liệu (mới → cũ), luôn có năm hiện tại. */
export function years(workouts, now = Date.now()) {
  const s = new Set([new Date(now).getFullYear(), ...ended(workouts).map((w) => new Date(w.start).getFullYear())]);
  return [...s].sort((a, b) => b - a);
}

/** e1RM tốt nhất mỗi buổi cho 1 bài, cũ → mới: [{t, v}]. */
export function e1rmSeries(workouts, exerciseId) {
  const out = [];
  for (const w of ended(workouts).sort((a, b) => a.start - b.start)) {
    const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets);
    if (sets.length) out.push({ t: w.start, v: Math.max(...sets.map((s) => e1rm(s.w, s.r))) });
  }
  return out;
}

/**
 * Mức tạ chính: n bài tập nhiều buổi nhất (bỏ bài không có tạ).
 * Mỗi bài {exerciseId, max, delta (so với max tính đến `days` ngày trước), spark:[v…] 12 buổi gần nhất}.
 * total {max, delta, series:[{t, v}]}: tổng max tích luỹ của các bài đó theo thời gian.
 */
export function topLifts(workouts, n = 3, now = Date.now(), days = 30) {
  const use = {};
  for (const w of ended(workouts)) for (const e of w.entries) if (doneSets(e).some((s) => s.w > 0)) use[e.exerciseId] = (use[e.exerciseId] || 0) + 1;
  const ids = Object.keys(use).sort((a, b) => use[b] - use[a]).slice(0, n);
  const cut = now - days * D;
  const lifts = ids.map((id) => {
    const s = e1rmSeries(workouts, id).filter((p) => p.v > 0);
    const max = Math.max(0, ...s.map((p) => p.v));
    const before = Math.max(0, ...s.filter((p) => p.t <= cut).map((p) => p.v));
    return { exerciseId: id, max, delta: before ? max - before : 0, spark: s.slice(-12).map((p) => p.v), series: s };
  });
  // Tổng: sau mỗi buổi, cộng max tích luỹ của từng bài.
  const best = {}, series = [];
  const pts = lifts.flatMap((l) => l.series.map((p) => ({ ...p, id: l.exerciseId }))).sort((a, b) => a.t - b.t);
  for (const p of pts) {
    best[p.id] = Math.max(best[p.id] || 0, p.v);
    const v = Object.values(best).reduce((a, b) => a + b, 0);
    if (series.length && dayKey(series.at(-1).t) === dayKey(p.t)) series.at(-1).v = v; else series.push({ t: p.t, v });
  }
  const tot = series.at(-1)?.v || 0, totBefore = [...series].reverse().find((p) => p.t <= cut)?.v || 0;
  return { lifts: lifts.map(({ series: _, ...l }) => l), total: { max: tot, delta: totBefore ? tot - totBefore : 0, series } };
}

/** Khối lượng (kg×rep) mỗi tuần theo nhóm cơ, `weeks` tuần gần nhất, cũ → mới: [{t (thứ Hai), byMuscle:{muscle: kg}, total}]. */
export function weeklyVolume(workouts, ex, weeks = 12, now = Date.now()) {
  const nowK = weekKey(now), out = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ k: nowK - i, t: (nowK - i) * WEEK, byMuscle: {}, total: 0 });
  const at = Object.fromEntries(out.map((x) => [x.k, x]));
  for (const w of ended(workouts)) {
    const b = at[weekKey(w.start)];
    if (!b) continue;
    for (const e of w.entries) {
      const v = doneSets(e).reduce((a, s) => a + s.w * s.r, 0);
      if (!v) continue;
      const mu = muscleOf(ex[e.exerciseId]);
      b.byMuscle[mu] = (b.byMuscle[mu] || 0) + v;
      b.total += v;
    }
  }
  return out.map(({ k, ...x }) => ({ ...x, t: mondayOf(k) }));
}
function mondayOf(k) {
  const d = new Date(k * WEEK); // ≈ thứ Năm của tuần k (epoch là thứ Năm), lùi về thứ Hai
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Lọc series theo số tháng gần nhất (0 = tất cả). */
export const inRange = (points, months, now = Date.now()) => (months ? points.filter((p) => p.t >= now - months * 30.44 * D) : points);
