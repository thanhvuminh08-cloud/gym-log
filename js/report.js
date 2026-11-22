// Báo cáo tuần (thứ Hai → Chủ nhật, giờ địa phương). Hàm thuần, không đụng DB.
import { analyzeWorkout, summary, TIERS } from './overload.js';
import { volume, setCount, doneSets } from './stats.js';
import { fmtNum, fmtDur, fmtShort } from './util.js';
import { PHAM } from './lore.js';

const DAY = 864e5;
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Mốc 0h thứ Hai của tuần chứa t, lùi/tiến `offset` tuần. */
export function weekStart(t = Date.now(), offset = 0) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d.getTime();
}
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };

const totals = (ws) => ({
  sessions: ws.length,
  sets: ws.reduce((a, w) => a + setCount(w), 0),
  vol: ws.reduce((a, w) => a + volume(w), 0),
  time: ws.reduce((a, w) => a + (w.end - w.start), 0),
});

/**
 * workouts: mọi buổi (chỉ buổi đã kết thúc được tính); bodies: [{date, weight}]; ex: exMap; start: weekStart(...).
 * Trả về {start, end, cur, prev, days, rpe, beats, compared, medals, exercises, weight, pending}.
 */
export function weekReport(workouts, bodies, ex, start) {
  const done = workouts.filter((w) => w.end);
  const end = addDays(start, 7), prevStart = addDays(start, -7);
  const inWeek = done.filter((w) => w.start >= start && w.start < end).sort((a, b) => a.start - b.start);
  const prevWeek = done.filter((w) => w.start >= prevStart && w.start < start);

  const medals = { gold: 0, silver: 0, bronze: 0 }, byEx = new Map();
  let beats = 0, compared = 0;
  const rpes = [];
  for (const w of inWeek) {
    const an = analyzeWorkout(w, done);
    w.entries.forEach((e, i) => {
      const sets = doneSets(e), s = summary(sets);
      if (!s) return;
      sets.forEach((x) => +x.rpe && rpes.push(+x.rpe));
      const res = an[i].res;
      if (!an[i].first) compared++;
      if (res) { beats++; medals[res.tier]++; }
      const cur = byEx.get(e.exerciseId) || { exerciseId: e.exerciseId, name: ex[e.exerciseId]?.name || '?', sets: 0, vol: 0, top: null, e1: 0, best: null };
      cur.sets += s.n; cur.vol += s.vol;
      if (s.e1 > cur.e1) { cur.e1 = s.e1; cur.top = s.top; }
      if (res && (!cur.best || TIERS[res.tier] > TIERS[cur.best.tier])) cur.best = res;
      byEx.set(e.exerciseId, cur);
    });
  }

  const bw = bodies.slice().sort((a, b) => a.date - b.date);
  const lastBefore = (t) => bw.filter((b) => b.date < t).at(-1);
  const wNow = lastBefore(end), wPrev = lastBefore(start);
  const weight = wNow && wNow.date >= start ? { kg: wNow.weight, delta: wPrev ? wNow.weight - wPrev.weight : null } : null;

  return {
    start, end,
    cur: totals(inWeek), prev: totals(prevWeek),
    days: inWeek.map((w) => ({ id: w.id, day: WD[new Date(w.start).getDay()], t: w.start, name: w.name })),
    rpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0,
    beats, compared, medals,
    exercises: [...byEx.values()].sort((a, b) => b.vol - a.vol),
    weight,
  };
}

/** % thay đổi so với tuần trước ('' nếu tuần trước = 0). */
export const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${fmtNum(((a - b) / b) * 100)}%` : '');

/** Bản văn bản để chia sẻ / sao chép. */
export function reportText(r) {
  const L = [`📜 Tuần ký ${fmtShort(r.start)}–${fmtShort(r.end - 1)}`];
  const d = (k) => { const p = pct(r.cur[k], r.prev[k]); return p ? ` (${p})` : ''; };
  L.push(`• ${r.cur.sessions} buổi${r.days.length ? ` (${r.days.map((x) => x.day).join(', ')})` : ''}, ${fmtDur(r.cur.time)}`);
  L.push(`• ${r.cur.sets} set${d('sets')} · ${fmtNum(r.cur.vol)} kg${d('vol')}`);
  if (r.compared) L.push(`• Vượt lần trước: ${r.beats}/${r.compared} bài · ${Object.entries(PHAM).map(([k, n]) => `${n} ${r.medals[k]}`).join(' · ')}`);
  if (r.rpe) L.push(`• RPE trung bình: ${fmtNum(r.rpe)}`);
  if (r.weight) L.push(`• Cân nặng: ${fmtNum(r.weight.kg)} kg${r.weight.delta != null ? ` (${r.weight.delta >= 0 ? '+' : ''}${fmtNum(r.weight.delta)})` : ''}`);
  if (r.exercises.length) {
    L.push('', 'Bài tập:');
    for (const e of r.exercises) L.push(`- ${e.name}: ${e.sets} set, top ${fmtNum(e.top.w)}×${e.top.r}${e.best ? ` — ${PHAM[e.best.tier]}: ${e.best.msg}` : ''}`);
  }
  return L.join('\n');
}
