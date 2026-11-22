import { DEFAULT_EXERCISES } from '../exercises.js';
import { hero } from '../hero.js';
import { fmtNum, h } from '../util.js';

const DAY = 86_400_000;
const previewDate = Date.UTC(2026, 5, 15, 8);
const sampleLifts = [
  ['Bench Press (đòn)', 55, 8],
  ['Deadlift', 135, 5],
  ['Overhead Press', 42.5, 5],
  ['Squat', 112.5, 5],
  ['Barbell Curl', 28, 5],
  ['Dips', 12.5, 5],
  ['Plank', 0, 1],
];

function sampleWorkout(id, start, load) {
  return {
    id, start, end: start + 3_600_000,
    entries: sampleLifts.map(([name, weight, reps]) => ({
      exerciseId: DEFAULT_EXERCISES.find((exercise) => exercise.name === name).id,
      sets: [{ w: weight * load, r: reps, done: true }, { w: weight * load, r: reps, done: true }],
    })),
  };
}

const PREVIEW = hero({
  workouts: [
    sampleWorkout('sample-record', previewDate - 120 * DAY, 1),
    sampleWorkout('sample-recent', previewDate - 4 * DAY, .88),
  ],
  body: [{ date: previewDate - 130 * DAY, weight: 80 }],
  exercises: DEFAULT_EXERCISES, sex: 'm', now: previewDate,
});

export function heroCard(tuvi = PREVIEW.tuvi, preview = true) {
  return `<a class="card cultivation-link" href="#/hero" data-hero-link>
    <span class="cultivation-seal" aria-hidden="true">${h(tuvi.realm.name)}</span>
    <span class="cultivation-link-copy">
      <strong>Động phủ</strong>
      <small>${h(tuvi.label)}${preview ? ' · Số liệu mẫu' : ''}</small>
    </span>
    <svg class="dashboard-icon" aria-hidden="true"><use href="#i-chevron"/></svg>
  </a>`;
}

function radar(meridians) {
  const point = (i, radius) => {
    const angle = i * 2 * Math.PI / meridians.length;
    return [180 + radius * Math.sin(angle), 150 - radius * Math.cos(angle)];
  };
  const points = (radius) => meridians.map((m, i) => point(i, radius(m)).map((n) => n.toFixed(1)).join(',')).join(' ');
  return `<svg class="cultivation-radar" viewBox="0 0 360 300" role="img" aria-label="Biểu đồ cảnh giới của bảy mạch">
    <g class="radar-grid" aria-hidden="true">
      ${Array.from({ length: 6 }, (_, i) => `<polygon points="${points(() => 17 * (i + 1))}"/>`).join('')}
      ${meridians.map((m, i) => {
        const [x, y] = point(i, 102);
        return `<line x1="180" y1="150" x2="${x}" y2="${y}"/>`;
      }).join('')}
    </g>
    <polygon class="radar-value" points="${points((m) => 17 * m.p)}"/>
    ${meridians.map((m, i) => {
      const [x, y] = point(i, 17 * m.p), [labelX, labelY] = point(i, 115);
      const anchor = i === 0 ? 'middle' : labelX > 180 ? 'start' : 'end';
      return `<g data-muscle="${h(m.key)}">
        <circle cx="${x}" cy="${y}" r="3.5"/>
        <text x="${labelX}" y="${labelY + 4}" text-anchor="${anchor}">${h(m.name)}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

function meridianCard(m) {
  const { next, best } = m;
  const progress = Math.round((m.p - m.realm.i) * 100);
  const target = next && ('kg' in next
    ? `${h(next.name)} ${fmtNum(next.kg)} kg${next.added ? ' đeo thêm' : next.perHand ? ' mỗi tay' : ''} × 1`
    : `Còn ${fmtNum(next.left)} Linh khí`);
  return `<li class="card cultivation-meridian" data-muscle="${h(m.key)}">
    <div class="cultivation-meridian-head">
      <h3>${h(m.name)}</h3><strong>${h(m.label)}</strong>
    </div>
    <p class="cultivation-lift">${best
      ? `${h(best.name)} · ${m.ratio.toLocaleString('vi-VN')}×BW · ~1RM ${fmtNum(best.kg)} kg`
      : m.key === 'core' ? `${fmtNum(m.xp)} Linh khí` : 'Chưa có kỷ lục'}</p>
    ${m.canCo != null ? `<p class="cultivation-condition${m.shaky ? ' is-shaky' : ''}">Căn cơ <b>${m.canCo}%</b>${m.shaky ? ' · Lung lay' : ''}</p>` : ''}
    ${next ? `<div class="cultivation-target">
      <div class="cultivation-target-label"><span>${target}</span><b>${h(next.realm)}</b></div>
      <progress class="cultivation-meter" value="${progress}" max="100" aria-label="Tiến độ đến ${h(next.realm)}"></progress>
    </div>` : ''}
  </li>`;
}

function profileForm({ needsWeight, needsSex }) {
  if (!needsWeight && !needsSex) return '';
  return `<form class="card cultivation-panel cultivation-profile" data-hero-profile>
    <h2>Thông tin tu luyện</h2>
    <p class="muted small">Dùng cân nặng và giới tính để ước lượng cảnh giới.</p>
    ${needsWeight ? '<label>Cân nặng (kg)<input name="weight" type="number" inputmode="decimal" min="1" step="0.1" required></label>' : ''}
    ${needsSex ? '<label>Giới tính<select name="sex" required><option value="">Chọn giới tính</option><option value="m">Nam</option><option value="f">Nữ</option></select></label>' : ''}
    <button class="primary">Lưu thông tin</button>
  </form>`;
}

export function heroView(profile, { preview = false } = {}) {
  const { tuvi, canCo, shaky, linhKhi, meridians, bw } = profile;
  return `<article class="cultivation">
    <a class="cultivation-back small" href="#/">← Hôm nay</a>
    <header class="cultivation-cover">
      <div class="cultivation-cover-heading">
        <h1>Động phủ</h1>
        ${preview ? '<span class="cultivation-sample">Số liệu mẫu</span>' : ''}
      </div>
      <div class="cultivation-rank">
        <span class="cultivation-seal" aria-hidden="true">${h(tuvi.realm.name)}</span>
        <div>
          <h2>Tu vi</h2>
          <strong>${h(tuvi.label)}</strong>
          ${canCo != null ? `<p class="cultivation-condition${shaky ? ' is-shaky' : ''}">Căn cơ <b>${canCo}%</b>${shaky ? ' · Lung lay' : ''}</p>` : ''}
        </div>
      </div>
    </header>
    ${profileForm(profile)}
    <section class="card cultivation-panel">
      <div class="cultivation-section-heading">
        <h2>Công lực cấp ${linhKhi.level}</h2>
        <span><b data-count="${linhKhi.xp}">${fmtNum(linhKhi.xp)}</b> Linh khí</span>
      </div>
      <progress class="cultivation-meter" value="${linhKhi.into}" max="${linhKhi.need}" aria-label="Linh khí tới cấp tiếp theo"></progress>
      <p class="muted small">${fmtNum(linhKhi.into)} / ${fmtNum(linhKhi.need)} Linh khí tới cấp ${linhKhi.level + 1}</p>
    </section>
    <section class="card cultivation-panel cultivation-chart">
      <h2>Thất mạch đồ</h2>
      ${radar(meridians)}
    </section>
    <section>
      <div class="cultivation-section-heading">
        <h2>Bình cảnh</h2>
        ${bw != null ? `<span class="muted small">Cân nặng ${fmtNum(bw)} kg</span>` : ''}
      </div>
      <ul class="cultivation-meridians">${meridians.map(meridianCard).join('')}</ul>
    </section>
    <p class="cultivation-note muted small">Chuẩn tham khảo, ước lượng. BW là cân nặng lúc tập. Căn cơ so phong độ 90 ngày với kỷ lục.</p>
  </article>`;
}

export async function render(el) {
  el.innerHTML = heroView(PREVIEW, { preview: true });
}
