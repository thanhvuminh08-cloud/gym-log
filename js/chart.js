import { fmtShort, fmtNum } from './util.js';

/** Biểu đồ đường SVG đơn giản. points: [{t, v}] (cũ → mới). */
export function lineChart(points, { unit = '' } = {}) {
  if (!points.length) return `<p class="muted">Chưa có dữ liệu.</p>`;
  const W = 340, H = 170, P = { l: 36, r: 10, t: 12, b: 22 };
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
  const labels = [0, n - 1].filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}">${fmtShort(points[i].t)}</text>`).join('');
  const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3"><title>${fmtShort(p.t)}: ${fmtNum(p.v)}${unit}</title></circle>`).join('');
  const last = points[n - 1].v;
  return `<div class="chart-head"><b>${fmtNum(last)}${unit}</b><span class="muted"> mới nhất · ${n} buổi</span></div>
<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}<path d="${path}"/>${dots}${labels}</svg>`;
}
