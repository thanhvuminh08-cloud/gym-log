// Kho huy chương (quá tải lũy tiến đợt 2): tính lại toàn bộ từ lịch sử, hàm thuần (không đụng DB).
import { analyzeWorkout, summary } from './overload.js';

export const MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300];
const WEEK = 7 * 864e5;

/** Chỉ số tuần (bắt đầu thứ Hai, giờ địa phương). */
export function weekKey(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Math.round(d.getTime() / WEEK);
}

/**
 * workouts: các buổi (chỉ buổi đã kết thúc được tính), thứ tự bất kỳ.
 * Trả về {counts:{gold,silver,bronze}, beats, compared, streak:{cur,best}, weeks:{cur,best},
 *   milestones:[{exerciseId, best, reached:{kg,t,workoutId}|null, next}], recent:[{workoutId,t,exerciseId,tier,msg}]}
 */
export function medals(workouts, now = Date.now()) {
  const done = workouts.filter((w) => w.end).sort((a, b) => a.start - b.start);
  const counts = { gold: 0, silver: 0, bronze: 0 };
  const recent = [], best = {};
  let beats = 0, compared = 0, cur = 0, bestStreak = 0;

  for (const w of done) {
    const ov = analyzeWorkout(w, done);
    // Chuỗi buổi vượt: buổi có ≥1 bài so được; buổi toàn bài mới thì bỏ qua (không nối, không đứt).
    if (ov.some((o) => !o.first)) {
      compared++;
      const up = ov.filter((o) => o.res);
      cur = up.length ? cur + 1 : 0;
      bestStreak = Math.max(bestStreak, cur);
    }
    for (const o of ov) {
      if (!o.res) continue;
      beats++;
      counts[o.res.tier]++;
      recent.push({ workoutId: w.id, t: w.start, end: w.end, exerciseId: o.exerciseId, tier: o.res.tier, msg: o.res.msg });
    }
    // Mốc tạ: lần đầu set nặng nhất chạm mốc.
    for (const e of w.entries) {
      const s = summary(e.sets);
      if (!s || !(s.top.w > 0)) continue;
      const b = (best[e.exerciseId] ||= { exerciseId: e.exerciseId, best: 0, reached: null });
      if (s.top.w <= b.best) continue;
      b.best = s.top.w;
      const m = MILESTONES.filter((k) => k <= b.best).at(-1);
      if (m && m !== b.reached?.kg) b.reached = { kg: m, t: w.start, workoutId: w.id };
    }
  }

  const milestones = Object.values(best)
    .map((b) => ({ ...b, next: MILESTONES.find((k) => k > b.best) || null }))
    .sort((a, b) => b.best - a.best);

  // Chuỗi tuần tập liên tiếp; tuần này chưa tập thì chuỗi vẫn tính đến tuần trước.
  const wk = [...new Set(done.map((w) => weekKey(w.start)))].sort((a, b) => a - b);
  let run = 0, bestWeeks = 0;
  wk.forEach((k, i) => { run = i && k === wk[i - 1] + 1 ? run + 1 : 1; bestWeeks = Math.max(bestWeeks, run); });
  const nowK = weekKey(now), last = wk.at(-1);
  const curWeeks = last === nowK || last === nowK - 1 ? run : 0;

  return {
    counts, beats, compared,
    streak: { cur, best: bestStreak },
    weeks: { cur: curWeeks, best: bestWeeks },
    milestones,
    recent: recent.reverse(),
  };
}
