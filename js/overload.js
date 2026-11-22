// Quá tải lũy tiến: so một bài với lần tập trước, xếp cấp vàng/bạc/đồng.
// Hàm thuần (không đụng DB) để dùng cả lúc tập lẫn tính lại từ lịch sử (đợt 2: kho huy chương).
import { e1rm, fmtNum } from './util.js';

const done = (sets) => sets.filter((s) => s.done !== false && +s.r > 0).map((s) => ({ w: +s.w || 0, r: +s.r }));
const STEP = 2.5;
const E1_TOL = 0.98; // tăng tạ mà e1RM tụt ≤2% vẫn tính là vượt

export const TIERS = { gold: 3, silver: 2, bronze: 1 };
export const TIER_LABEL = { gold: '🥇 Vàng', silver: '🥈 Bạc', bronze: '🥉 Đồng' };

/** Số liệu tóm tắt của một bài: set nặng nhất, e1RM, volume. */
export function summary(sets) {
  const d = done(sets);
  if (!d.length) return null;
  const top = d.reduce((a, s) => (s.w > a.w || (s.w === a.w && s.r > a.r) ? s : a));
  return {
    top,
    e1: Math.max(...d.map((s) => e1rm(s.w, s.r))),
    vol: d.reduce((a, s) => a + s.w * s.r, 0),
    n: d.length,
    nTop: d.filter((s) => s.w >= top.w).length,
    repsAt: (w) => Math.max(0, ...d.filter((s) => s.w >= w).map((s) => s.r)),
  };
}

/**
 * So sets hiện tại với lần trước + kỷ lục cũ (recE1 = e1RM tốt nhất trước đây).
 * Trả về {tier, kind, msg} hoặc null (chưa vượt / chưa có lần trước để so).
 */
export function compare(curSets, prevSets, recE1 = 0) {
  const c = summary(curSets), p = summary(prevSets || []);
  if (!c || !p) return null;
  if (recE1 > 0 && c.e1 > recE1 + 1e-9) return { tier: 'gold', kind: 'pr', msg: `🏆 PR mới! ~1RM ${fmtNum(c.e1)} kg` };
  if (c.top.w > p.top.w && c.e1 >= p.e1 * E1_TOL)
    return { tier: 'silver', kind: 'weight', msg: `🔥 +${fmtNum(c.top.w - p.top.w)} kg so với lần trước!` };
  const reps = c.repsAt(p.top.w) - p.top.r;
  if (p.top.w > 0 && reps > 0) return { tier: 'silver', kind: 'reps', msg: `🔥 +${reps} rep ở ${fmtNum(p.top.w)} kg!` };
  if (c.e1 > p.e1 + 1e-9) return { tier: 'silver', kind: 'e1rm', msg: `🔥 ~1RM tăng ${fmtNum(c.e1 - p.e1)} kg so với lần trước!` };
  if (c.top.w >= p.top.w && c.nTop > p.nTop) return { tier: 'bronze', kind: 'sets', msg: `💪 Thêm ${c.nTop - p.nTop} set ở ${fmtNum(p.top.w)} kg!` };
  if (c.vol > p.vol) return { tier: 'bronze', kind: 'volume', msg: `💪 Khối lượng vượt lần trước (+${fmtNum(c.vol - p.vol)} kg)` };
  return null;
}

/** Gợi ý mục tiêu buổi này từ lần trước. */
export function target(prevSets) {
  const p = summary(prevSets || []);
  if (!p) return '';
  const { w, r } = p.top;
  if (!w) return `Mục tiêu: > ${r} rep`;
  return `Mục tiêu: ${fmtNum(w)}kg × ${r + 1} hoặc ${fmtNum(w + STEP)}kg × ${r}`;
}

/**
 * Phân tích một buổi đã xong so với các buổi trước nó (workouts: mọi buổi đã kết thúc, thứ tự bất kỳ).
 * Trả về [{exerciseId, res}] theo thứ tự entries; res = compare(...) hoặc null; `first: true` nếu lần đầu tập bài.
 */
export function analyzeWorkout(w, workouts) {
  const before = workouts.filter((x) => x.end && x.id !== w.id && x.start < w.start).sort((a, b) => b.start - a.start);
  return w.entries.map((e) => {
    let prev = null, rec = 0;
    for (const x of before) for (const y of x.entries) {
      if (y.exerciseId !== e.exerciseId) continue;
      const s = summary(y.sets);
      if (!s) continue;
      if (!prev) prev = y.sets;
      rec = Math.max(rec, s.e1);
    }
    return { exerciseId: e.exerciseId, first: !prev, res: prev ? compare(e.sets, prev, rec) : null };
  });
}
