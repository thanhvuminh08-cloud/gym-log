// Lịch tập hằng tuần (hàm thuần). Lịch lưu ở settings.schedule = {getDay(): templateId | ''} — có khoá = ngày tập, '' = tập tự do.

/** Thứ tự hiển thị T2 → CN theo getDay(). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Chuẩn hoá lịch: chỉ giữ khoá 0–6, giá trị chuỗi. */
export function cleanSchedule(s) {
  const out = {};
  for (const [k, v] of Object.entries(s && typeof s === 'object' ? s : {})) if (/^[0-6]$/.test(k)) out[k] = typeof v === 'string' ? v : '';
  return out;
}

/**
 * Lịch tuần này: {state, templateId, days}.
 * state: 'none' (chưa đặt lịch) | 'done' (đã tập hôm nay) | 'due' (hôm nay có lịch, chưa tập) | 'rest'.
 * templateId: giáo án của hôm nay ('' = tự do, null nếu không có lịch).
 * days: 7 trạng thái T2 → CN: 'done' | 'today' (hôm nay có lịch, chưa tập) | 'missed' | 'planned' | 'rest'.
 */
export function weekPlan(schedule, workouts, now = Date.now()) {
  const plan = cleanSchedule(schedule), today = dayStart(now), todayDow = new Date(now).getDay();
  const mon = new Date(today); mon.setDate(mon.getDate() - ((todayDow + 6) % 7));
  const doneDays = new Set(workouts.filter((w) => w.end).map((w) => dayStart(w.start)));
  const days = WEEK_ORDER.map((dow, i) => {
    const t = new Date(mon); t.setDate(mon.getDate() + i);
    const d = t.getTime(), planned = String(dow) in plan;
    if (doneDays.has(d)) return 'done';
    if (!planned) return 'rest';
    return d === today ? 'today' : d < today ? 'missed' : 'planned';
  });
  const has = Object.keys(plan).length > 0, plannedToday = String(todayDow) in plan;
  const state = !has ? 'none' : doneDays.has(today) ? 'done' : plannedToday ? 'due' : 'rest';
  return { state, templateId: plannedToday ? plan[todayDow] : null, days };
}
