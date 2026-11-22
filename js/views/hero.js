import { all, put } from '../db.js';
import { hero } from '../hero.js';
import { fmtNum, h, uid, settings, countUp } from '../util.js';

/** Dữ liệu thật cho Động phủ: hero() từ toàn bộ buổi tập, thư viện bài, cân nặng và cài đặt. */
export async function loadProfile(now = Date.now()) {
  const [workouts, exercises, body] = await Promise.all([all('workouts'), all('exercises'), all('body')]);
  const s = settings.get();
  return hero({ workouts, exercises, body, sex: s.sex, schedule: s.schedule, weekGoal: s.weekGoal, now });
}

export function heroCard(tuvi, preview = false) {
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
  el.innerHTML = heroView(await loadProfile());
  el.onclick = el.onchange = null; // bỏ handler của màn trước (main dùng chung)
  // Lưu cân nặng (bảng body, như Tiến độ › Cơ thể) và giới tính rồi tính lại.
  el.onsubmit = async (ev) => {
    const form = ev.target.closest('[data-hero-profile]');
    if (!form) return;
    ev.preventDefault();
    const f = new FormData(form), weight = Number(f.get('weight')), sex = f.get('sex');
    if (f.has('weight') && !(weight > 0)) return;
    if (f.has('sex') && sex !== 'm' && sex !== 'f') return;
    if (f.has('weight')) await put('body', { id: uid(), date: Date.now(), weight, waist: null });
    if (f.has('sex')) settings.set({ sex });
    el.innerHTML = heroView(await loadProfile());
    countUp(el);
  };
}
