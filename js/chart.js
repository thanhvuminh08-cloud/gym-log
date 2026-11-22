import { fmtShort, fmtNum } from './util.js';
import { MUSCLE } from './insights.js';

/**
 * Biểu đồ đường SVG. points: [{t, v}] (cũ → mới).
 * opts: unit, area (tô vùng dưới đường), labels (ghi số ở các điểm, tự thưa bớt), head (dòng số mới nhất, mặc định có).
 */
export function lineChart(points, { unit = '', area = false, labels = false, head = true } = {}) {
  if (!points.length) return `<p class="muted">Chưa có dữ liệu.</p>`;
  const W = 340, H = labels ? 190 : 170, P = { l: 36, r: 12, t: labels ? 22 : 12, b: 22 };
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const n = points.length;
  const x = (i) => P.l + (n === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (n - 1));
  const y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const grid = [0, 0.5, 1].map((f) => {
    const v = lo + f * (hi - lo);
    return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 4}" y="${y(v) + 3}" text-anchor="end">${fmtNum(v)}</text>`;
  }).join('');
  const dates = [0, n - 1].filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}">${fmtShort(points[i].t)}</text>`).join('');
  const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3"${i === n - 1 ? ' class="last"' : ''}><title>${fmtShort(p.t)}: ${fmtNum(p.v)}${unit}</title></circle>`).join('');
  const fill = area && n > 1
    ? `<defs><linearGradient id="area-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cool,#79c8ff)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--cool,#79c8ff)" stop-opacity="0"/></linearGradient></defs>
<path class="area" style="fill:url(#area-g);stroke:none;filter:none" d="${path}L${x(n - 1).toFixed(1)},${H - P.b}L${x(0).toFixed(1)},${H - P.b}Z"/>` : '';
  // Nhãn số: tối đa ~8 nhãn, luôn có điểm cuối; chỉ ghi khi giá trị đổi so với nhãn trước.
  let tags = '';
  if (labels) {
    const step = Math.max(1, Math.ceil(n / 8));
    let prev = null;
    points.forEach((p, i) => {
      if ((i % step && i !== n - 1) || p.v === prev) return;
      prev = p.v;
      tags += `<text class="pt" x="${x(i)}" y="${y(p.v) - 8}" text-anchor="${i === n - 1 ? 'end' : i ? 'middle' : 'start'}">${fmtNum(p.v)}</text>`;
    });
  }
  const top = head ? `<div class="chart-head"><b>${fmtNum(points[n - 1].v)}${unit}</b><span class="muted"> mới nhất · ${n} buổi</span></div>\n` : '';
  return `${top}<svg style="width:100%;height:auto" class="chart${area ? ' has-area' : ''}" viewBox="0 0 ${W} ${H}" role="img">${grid}${fill}<path class="line" d="${path}"/>${dots}${tags}${dates}</svg>`;
}

/** Đường nhỏ không trục cho thẻ số liệu. values: [v…] cũ → mới. */
export function sparkline(values, W = 100, H = 32) {
  if (values.length < 2) return `<svg class="spark" style="width:100%;height:auto;fill:none;stroke:currentColor" viewBox="0 0 ${W} ${H}" aria-hidden="true"></svg>`;
  let lo = Math.min(...values), hi = Math.max(...values);
  if (lo === hi) { lo -= 1; hi += 1; }
  const n = values.length, x = (i) => 2 + (i * (W - 4)) / (n - 1), y = (v) => 3 + (1 - (v - lo) / (hi - lo)) * (H - 6);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg class="spark" style="width:100%;height:auto;fill:none;stroke:currentColor" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d}"/><circle cx="${x(n - 1)}" cy="${y(values[n - 1])}" r="2.5" fill="currentColor" stroke="none"/></svg>`;
}

/** Cột chồng theo nhóm cơ. weeks: [{t, byMuscle:{muscle: kg}, total}] cũ → mới. */
export function stackedBars(weeks) {
  const max = Math.max(...weeks.map((w) => w.total));
  if (!max) return `<p class="muted">Chưa có dữ liệu.</p>`;
  const W = 340, H = 170, P = { l: 6, r: 6, t: 10, b: 22 }, n = weeks.length;
  const slot = (W - P.l - P.r) / n, bw = Math.max(4, slot * 0.62), ih = H - P.t - P.b;
  const order = Object.keys(MUSCLE);
  const bars = weeks.map((wk, i) => {
    let yy = H - P.b;
    const x = P.l + i * slot + (slot - bw) / 2;
    const segs = order.filter((m) => wk.byMuscle[m]).map((m) => {
      const hh = (wk.byMuscle[m] / max) * ih;
      yy -= hh;
      return `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, hh).toFixed(1)}" data-muscle="${MUSCLE[m].key}" fill="${MUSCLE[m].color}"><title>${m}: ${fmtNum(wk.byMuscle[m])} kg</title></rect>`;
    }).join('');
    return `<g class="bar" style="--i:${i}">${segs}<title>Tuần ${fmtShort(wk.t)}: ${fmtNum(wk.total)} kg</title></g>`;
  }).join('');
  const dates = [0, Math.floor((n - 1) / 2), n - 1].map((i, j) => `<text x="${P.l + i * slot + slot / 2}" y="${H - 6}" text-anchor="${['start', 'middle', 'end'][j]}">${fmtShort(weeks[i].t)}</text>`).join('');
  return `<svg style="width:100%;height:auto" class="chart bars" viewBox="0 0 ${W} ${H}" role="img"><line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}"/>${bars}${dates}</svg>`;
}

/** Lưới năm 12 tháng × 31 ngày từ insights.yearGrid. */
export function yearGridSvg(grid) {
  const C = 11, G = 3, L = 14, S = C + G;
  const W = L + 12 * S, H = 14 + 31 * S;
  const heads = 'T1 T2 T3 T4 T5 T6 T7 T8 T9 T10 T11 T12'.split(' ')
    .map((m, i) => `<text fill="currentColor" opacity=".55" font-size="8" x="${L + i * S + C / 2}" y="9" text-anchor="middle">${i + 1}</text>`).join('');
  const cells = grid.months.flatMap((days, mo) => days.map((d, i) => {
    if (!d) return '';
    const mu = d.muscle && MUSCLE[d.muscle];
    const attrs = mu ? ` data-muscle="${mu.key}" fill="${mu.color}"` : d.future ? ' class="future" fill="#1b2030" opacity=".5"' : ' class="off" fill="#2a3142"';
    return `<rect x="${L + mo * S}" y="${14 + i * S}" width="${C}" height="${C}" rx="2.5" style="--i:${mo * 31 + i}"${attrs}>${mu ? `<title>${d.day}/${mo + 1}: ${d.muscle}</title>` : ''}</rect>`;
  })).join('');
  const rows = [1, 10, 20, 31].map((d) => `<text fill="currentColor" opacity=".55" font-size="8" x="${L - 4}" y="${14 + (d - 1) * S + C - 2}" text-anchor="end">${d}</text>`).join('');
  return `<svg style="width:100%;height:auto" class="year-grid" viewBox="0 0 ${W} ${H}" role="img" aria-label="Lịch tập năm ${grid.year}">${heads}${rows}${cells}</svg>`;
}
