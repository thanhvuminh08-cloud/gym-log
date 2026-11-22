// Nhập môn (RPG.md mục 5): hàm thuần cho màn khai báo lần đầu, Trắc linh căn, Công pháp, giáo án + lịch tự sinh.
// Lưu ở settings.dao (xem hợp đồng cuối RPG.md). Không đụng DB — view lo việc ghi.
import { MERIDIANS, PAIR, LIFTS, liftOf, meridianOf, hero, REALMS } from './hero.js';

/** Thời gian tu đạo (kinh nghiệm tập). test = có hỏi mức tạ Trắc linh căn không; sets = số set bài chính trong giáo án. */
export const EXPERIENCE = [
  { id: 'new', label: 'Chưa nhập đạo', real: 'Chưa tập hoặc dưới 3 tháng', test: false, sets: 3 },
  { id: 'novice', label: 'Sơ nhập đạo môn', real: '3–12 tháng', test: true, sets: 3 },
  { id: 'mid', label: 'Tu đạo nhiều năm', real: '1–3 năm', test: true, sets: 4 },
  { id: 'veteran', label: 'Lão tu sĩ', real: '3–5 năm', test: true, sets: 4 },
  { id: 'elder', label: 'Ẩn thế cao nhân', real: 'Trên 5 năm', test: true, sets: 4 },
];

/** Đạo tâm (mục tiêu): rep/nghỉ mặc định cho bài chính và bài phụ. */
export const GOALS = [
  { id: 'strength', label: 'Luyện lực', real: 'Tăng sức mạnh', main: { reps: 5, rest: 180 }, acc: { reps: 8, rest: 120 } },
  { id: 'muscle', label: 'Luyện thể', real: 'Tăng cơ', main: { reps: 8, rest: 120 }, acc: { reps: 12, rest: 75 } },
  { id: 'lean', label: 'Luyện khí', real: 'Giảm mỡ, săn chắc', main: { reps: 10, rest: 90 }, acc: { reps: 15, rest: 60 } },
  { id: 'health', label: 'Dưỡng sinh', real: 'Khoẻ mạnh, bền bỉ', main: { reps: 10, rest: 90 }, acc: { reps: 12, rest: 60 } },
];

/** Số buổi bế quan mỗi tuần → ngày trong tuần (getDay: 1 = T2 … 0 = CN) và cách chia buổi. */
export const DAYS = {
  2: { days: [1, 4], split: ['full-a', 'full-b'] },
  3: { days: [1, 3, 5], split: ['full-a', 'full-b', 'full-a'] },
  4: { days: [1, 2, 4, 5], split: ['upper-a', 'lower-a', 'upper-b', 'lower-b'] },
  5: { days: [1, 2, 3, 5, 6], split: ['push', 'pull', 'legs', 'upper-b', 'lower-b'] },
  6: { days: [1, 2, 3, 4, 5, 6], split: ['push', 'pull', 'legs', 'push-b', 'pull-b', 'legs-b'] },
};

/** Buổi: tên + các mạch (theo thứ tự) + chọn bài thứ mấy trong công pháp mỗi mạch (0 = bài 1, 1 = bài 2, 'all' = mọi bài). */
const SESSIONS = {
  'full-a': { name: 'Toàn thân A', m: ['legs', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'core'], pick: 0 },
  'full-b': { name: 'Toàn thân B', m: ['legs', 'back', 'chest', 'shoulders', 'triceps', 'biceps', 'core'], pick: 1 },
  'upper-a': { name: 'Thượng thân A', m: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], pick: 0 },
  'upper-b': { name: 'Thượng thân B', m: ['back', 'chest', 'shoulders', 'triceps', 'biceps'], pick: 1 },
  'lower-a': { name: 'Hạ thân A', m: ['legs', 'core'], pick: 'all' },
  'lower-b': { name: 'Hạ thân B', m: ['legs', 'core'], pick: 'all', rotate: true },
  push: { name: 'Đẩy', m: ['chest', 'shoulders', 'triceps'], pick: 'all' },
  pull: { name: 'Kéo', m: ['back', 'biceps', 'core'], pick: 'all' },
  legs: { name: 'Chân', m: ['legs', 'core'], pick: 'all' },
  'push-b': { name: 'Đẩy B', m: ['chest', 'shoulders', 'triceps'], pick: 'all', rotate: true },
  'pull-b': { name: 'Kéo B', m: ['back', 'biceps', 'core'], pick: 'all', rotate: true },
  'legs-b': { name: 'Chân B', m: ['legs', 'core'], pick: 'all', rotate: true },
};

const lower = (s) => String(s || '').trim().toLowerCase();
const prioOf = (ex) => { const i = LIFTS.indexOf(liftOf(ex)); return i < 0 ? 999 : i; };
const isMain = (key, ex) => !!MERIDIANS.find((m) => m.key === key)?.main?.test(lower(ex.name));

/**
 * Bài chọn được cho từng mạch: [{key, name, min, options:[{id, name, ranked}]}] × 7.
 * ranked = có quy đổi → được xét cảnh giới (bài tự tạo hay bài không có quy đổi chỉ cho Linh khí).
 * Bụng xét theo Linh khí nên mọi bài Bụng đều "ranked".
 */
export function pathOptions(exercises = []) {
  const prio = (id) => prioOf(exercises.find((e) => e.id === id));
  return MERIDIANS.map((M) => ({
    key: M.key, name: M.name, min: PAIR,
    options: exercises.filter((e) => meridianOf(e) === M.key)
      .map((e) => ({ id: e.id, name: e.name, ranked: M.key === 'core' || !!liftOf(e), main: isMain(M.key, e) }))
      .sort((a, b) => b.main - a.main || b.ranked - a.ranked || prio(a.id) - prio(b.id)),
  }));
}

/** Công pháp gợi ý: mỗi mạch lấy bài chuẩn + bài có quy đổi kế tiếp (đúng PAIR bài). */
export function defaultPath(exercises = []) {
  return Object.fromEntries(pathOptions(exercises).map((g) => [g.key, g.options.filter((o) => o.ranked).slice(0, PAIR).map((o) => o.id)]));
}

/**
 * Kiểm Công pháp: mỗi mạch cần ≥ PAIR bài được xét cảnh giới.
 * → {ok, problems:[{key, name, have, need}]}. Bài không thuộc mạch (hoặc đã xoá) bị bỏ qua.
 */
export function validatePath(path = {}, exercises = []) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const problems = [];
  for (const M of MERIDIANS) {
    const ids = (path?.[M.key] || []).filter((id) => exMap[id] && meridianOf(exMap[id]) === M.key);
    const have = ids.filter((id) => M.key === 'core' || liftOf(exMap[id])).length;
    if (have < PAIR) problems.push({ key: M.key, name: M.name, have, need: PAIR - have });
  }
  return { ok: !problems.length, problems };
}

/** Làm sạch Công pháp: bỏ id lạ, bỏ trùng, giữ thứ tự người dùng chọn. */
export function cleanPath(path = {}, exercises = []) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  return Object.fromEntries(MERIDIANS.map((M) => [M.key, [...new Set(path?.[M.key] || [])].filter((id) => exMap[id] && meridianOf(exMap[id]) === M.key)]));
}

/** Bài cần hỏi mức tạ ở Trắc linh căn: các bài có quy đổi trong Công pháp (Bụng không hỏi). */
export function testList(path = {}, exercises = []) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  return MERIDIANS.filter((M) => M.key !== 'core').flatMap((M) => (path?.[M.key] || [])
    .map((id) => exMap[id]).filter((e) => e && liftOf(e))
    .map((e) => ({ exerciseId: e.id, name: e.name, meridian: M.key, meridianName: M.name, bodyweight: liftOf(e).bwf > 0, perHand: liftOf(e).hands === 2 })));
}

/**
 * Giáo án + lịch từ Công pháp: {templates:[{id, name, items:[{exerciseId, sets, reps, rest}]}], schedule:{getDay: templateId}}.
 * Bài chính (bài chuẩn của mạch) dùng rep/nghỉ "main" của Đạo tâm, còn lại "acc". id do người gọi cấp (makeId).
 */
export function buildPlan({ path = {}, days = 3, goal = 'muscle', experience = 'novice', makeId = (i) => `dao-${i}` } = {}, exercises = []) {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const G = GOALS.find((g) => g.id === goal) || GOALS[1], X = EXPERIENCE.find((x) => x.id === experience) || EXPERIENCE[1];
  const plan = DAYS[Math.min(6, Math.max(2, Math.round(days) || 3))];
  const list = (key) => (path?.[key] || []).filter((id) => exMap[id]);
  const item = (key, id) => {
    const main = isMain(key, exMap[id]), p = main ? G.main : G.acc;
    return { exerciseId: id, sets: main ? X.sets : 3, reps: p.reps, rest: p.rest };
  };
  const byKind = {};
  const templates = [];
  for (const kind of plan.split) {
    if (byKind[kind]) continue;
    const S = SESSIONS[kind], items = [];
    for (const key of S.m) {
      const ids = list(key);
      if (!ids.length) continue;
      if (S.pick === 'all') {
        const ordered = S.rotate ? [...ids.slice(1), ids[0]] : ids;
        // Mạch phụ (Bụng, Tay) trong buổi tách nhóm: 1 bài; mạch chính: tới 2 bài.
        const n = key === 'core' || key === 'biceps' || key === 'triceps' ? 1 : 2;
        ordered.slice(0, n).forEach((id) => items.push(item(key, id)));
      } else {
        items.push(item(key, ids[Math.min(S.pick, ids.length - 1)]));
      }
    }
    const t = { id: makeId(templates.length), name: `Công pháp · ${S.name}`, items };
    templates.push(t);
    byKind[kind] = t.id;
  }
  const schedule = Object.fromEntries(plan.days.map((d, i) => [d, byKind[plan.split[i]]]));
  return { templates, schedule };
}

/**
 * Trắc linh căn: cảnh giới khởi đầu từ dữ liệu khai báo (chưa có buổi tập nào cũng được).
 * dao = {at, path, tested:[{exerciseId, w, r}]}. → {tuvi, meridians:[{key, name, label, need}], top} — top = mạch mạnh nhất (thiên phú).
 */
export function assess({ dao, exercises = [], body = [], sex, workouts = [], now = Date.now() } = {}) {
  const p = hero({ workouts, exercises, body, sex, dao, now });
  const ranked = p.meridians.filter((m) => m.key !== 'core' && m.p > 0).sort((a, b) => b.p - a.p);
  return {
    tuvi: p.tuvi, profile: p,
    meridians: p.meridians.map((m) => ({ key: m.key, name: m.name, label: m.label, p: m.p, need: m.need })),
    top: ranked[0] ? { key: ranked[0].key, name: ranked[0].name, label: ranked[0].label } : null,
    verdict: verdict(p.tuvi.realm.i),
  };
}

/** Lời phán khi Trắc linh căn xong (UI có thể dùng hoặc thay). */
export function verdict(i) {
  return [
    'Phàm thể chưa khai. Đường dài bắt đầu từ bước chân đầu tiên.',
    'Đã dẫn khí nhập thể. Căn cơ còn mỏng, chăm luyện ắt thành.',
    'Đạo cơ vững chắc, vượt xa phàm nhân.',
    'Kim đan đã thành. Từ đây mỗi bước đột phá đều là độ kiếp.',
    'Nguyên Anh xuất khiếu — hiếm người đạt tới.',
    'Hoá Thần cảnh. Đạo hữu là bậc cao nhân ẩn thế.',
  ][i] || '';
}

/** Đã Nhập môn chưa (settings.dao có at). */
export const entered = (s) => !!s?.dao?.at;
export { REALMS };
