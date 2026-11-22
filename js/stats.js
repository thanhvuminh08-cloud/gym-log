import { all } from './db.js';
import { e1rm } from './util.js';

export const doneSets = (entry) => entry.sets.filter((s) => s.done && s.r > 0);
export const volume = (w) => w.entries.reduce((a, e) => a + doneSets(e).reduce((b, s) => b + s.w * s.r, 0), 0);
export const setCount = (w) => w.entries.reduce((a, e) => a + doneSets(e).length, 0);

export const finished = async () => (await all('workouts')).filter((w) => w.end).sort((a, b) => b.start - a.start);

/** Sets of the most recent finished workout containing exerciseId (excluding workout `skipId`). */
export async function lastSets(exerciseId, skipId) {
  for (const w of await finished()) {
    if (w.id === skipId) continue;
    const e = w.entries.find((x) => x.exerciseId === exerciseId);
    if (e && doneSets(e).length) return doneSets(e);
  }
  return [];
}

/** Best values ever for an exercise across finished workouts (excluding skipId). */
export async function records(exerciseId, skipId) {
  const r = { w: 0, e1rm: 0, vol: 0 };
  for (const w of await finished()) {
    if (w.id === skipId) continue;
    for (const e of w.entries) {
      if (e.exerciseId !== exerciseId) continue;
      for (const s of doneSets(e)) {
        r.w = Math.max(r.w, s.w);
        r.e1rm = Math.max(r.e1rm, e1rm(s.w, s.r));
        if (s.w * s.r > r.vol) { r.vol = s.w * s.r; r.top = { w: s.w, r: s.r }; } // set tốt nhất: hiện kg × rep, không hiện tích
      }
    }
  }
  return r;
}

/** Per-session series for charts, oldest first. */
export async function series(exerciseId) {
  const out = [];
  for (const w of (await finished()).reverse()) {
    const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets);
    if (!sets.length) continue;
    out.push({
      t: w.start,
      e1rm: Math.max(...sets.map((s) => e1rm(s.w, s.r))),
      top: Math.max(...sets.map((s) => s.w)),
      vol: sets.reduce((a, s) => a + s.w * s.r, 0),
    });
  }
  return out;
}
