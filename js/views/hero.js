import { all, put } from '../db.js';
import { hero, REALMS } from '../hero.js';
import { fmtNum, h, uid, settings, countUp } from '../util.js';

/** Dữ liệu thật cho Động phủ: hero() từ toàn bộ buổi tập, thư viện bài, cân nặng và cài đặt. */
export async function loadProfile(now = Date.now()) {
  const [workouts, exercises, body] = await Promise.all([all('workouts'), all('exercises'), all('body')]);
  const s = settings.get();
  return hero({ workouts, exercises, body, sex: s.sex, schedule: s.schedule, weekGoal: s.weekGoal, now });
}

const SAMPLE_QUESTS = {
  quests: [
    { id: 'schedule', title: 'Tập đủ 3 buổi tuần này', detail: 'Theo mục tiêu tuần', meridian: null, goal: 3, done: 2, complete: false },
    { id: 'overload', title: 'Vượt lần trước ở mạch Tay trước', detail: 'Gợi ý: Barbell Curl', meridian: 'biceps', goal: 1, done: 1, complete: true },
    { id: 'canCo', title: 'Thêm buổi cho mạch Vai', detail: 'Căn cơ 82%', meridian: 'shoulders', goal: 1, done: 0, complete: false },
  ],
  done: 1,
  total: 3,
};

const SAMPLE_CHALLENGE = {
  key: 'legs', name: 'Chân', label: 'Kết Đan · Hậu kỳ', pct: 74,
  next: { realm: 'Nguyên Anh', ratio: 2.25, exerciseId: 'x-squat', name: 'Squat', kg: 180, added: false, perHand: false, alt: { r: 5, kg: 154.5 } },
};

const SAMPLE_BREAKTHROUGHS = [
  { key: 'legs', name: 'Chân', from: 'Kết Đan · Sơ kỳ', to: 'Kết Đan · Trung kỳ', realm: false, tribulation: false, real: 'Squat 1,76×BW · ~1RM 140,8 kg' },
  { key: 'legs', name: 'Chân', from: 'Trúc Cơ · Đại viên mãn', to: 'Kết Đan · Sơ kỳ', realm: true, tribulation: true, real: 'Squat 1,67×BW · ~1RM 116,7 kg' },
];

const realmArt = (index, className) => `<svg class="${className}" viewBox="0 0 220 210" aria-hidden="true" focusable="false"><use href="assets/cultivation-realms.svg#realm-${index}"/></svg>`;
const seal = (index, name) => `<span class="cultivation-seal" data-realm="${index}" aria-hidden="true">${h(name)}</span>`;

export function heroCard(tuvi, preview = false, weekly = SAMPLE_QUESTS) {
  return `<a class="card cultivation-link" href="#/hero" data-hero-link>
    ${seal(tuvi.realm.i, tuvi.realm.name)}
    <span class="cultivation-link-copy">
      <strong>Động phủ</strong>
      <small>${h(tuvi.label)}${preview ? ' · Số liệu mẫu' : ''}</small>
      ${weekly ? `<small class="cultivation-link-quests">Nhiệm vụ ${weekly === SAMPLE_QUESTS ? 'mẫu ' : ''}<b>${weekly.done}/${weekly.total}</b></small>` : ''}
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
    <g class="radar-orbit" aria-hidden="true">
      <circle cx="180" cy="150" r="110"/>
      <circle cx="180" cy="150" r="103"/>
      <path d="m180 40 4 5-4 5-4-5zm0 210 4 5-4 5-4-5zm-107-105 4 5-4 5-4-5zm214 0 4 5-4 5-4-5z"/>
    </g>
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

export function breakthroughModal(event, { id = 'breakthrough', demo = false } = {}) {
  const title = event.tribulation ? 'Độ kiếp' : 'Đột phá';
  const realm = event.to.split(' · ')[0];
  const index = Math.max(0, REALMS.indexOf(realm));
  const key = h(id);
  return `<dialog id="${key}" class="breakthrough-modal modal" data-tribulation="${Boolean(event.tribulation)}"
    data-breakthrough="${h(event.key)}" aria-labelledby="${key}-title"${demo ? ' popover="auto"' : ''}>
    <div class="breakthrough-scene">
      <div class="breakthrough-celestial" aria-hidden="true">
        <span class="breakthrough-clouds"></span>
        <svg class="breakthrough-bolts" viewBox="0 0 320 186" preserveAspectRatio="xMidYMid meet">
          <path class="bolt-primary" d="M155 1l-17 42 23 4-19 32 19 4-8 38 42-54-26-3 19-30-23 2 12-35z"/>
          <path class="bolt-secondary" d="M90 7 72 57l18-4-5 23 21-35-13 2 13-36Z"/>
          <path class="bolt-secondary" d="m246 4-11 35 18-2-12 35 30-47-19 5 12-26Z"/>
        </svg>
        <span class="breakthrough-aura"></span>
        <span class="breakthrough-qi"></span>
        ${realmArt(index, 'breakthrough-figure')}
        ${seal(index, realm)}
      </div>
      <div class="breakthrough-content">
        <p class="breakthrough-kind">${h(event.name)}${demo ? ' · Số liệu mẫu' : ''}</p>
        <h2 id="${key}-title">${title}</h2>
        <div class="breakthrough-ranks"><span>${h(event.from)}</span><span aria-hidden="true">↓</span><strong>${h(event.to)}</strong></div>
        <p class="breakthrough-real">${event.real ? h(event.real) : 'Chưa có số liệu'}</p>
        <form method="dialog">
          <button class="primary breakthrough-close" data-act="closeBreak"${demo ? ` type="button" popovertarget="${key}" popovertargetaction="hide"` : ''}>Đóng</button>
        </form>
      </div>
    </div>
  </dialog>`;
}

function questBoard(weekly, sample) {
  if (!weekly) return '';
  return `<section class="cultivation-scroll" data-quests>
    <header class="cultivation-section-heading"><h2>Nhiệm vụ tuần</h2><span><b>${weekly.done}/${weekly.total}</b> hoàn thành</span></header>
    ${sample ? '<p class="quest-sample">Số liệu mẫu · Thứ hai đến Chủ nhật</p>' : '<p class="quest-sample">Thứ hai đến Chủ nhật</p>'}
    <ul class="quest-list">${weekly.quests.map((q) => `<li data-quest="${h(q.id)}"${q.meridian ? ` data-muscle="${h(q.meridian)}"` : ''}>
      <div><h3>${h(q.title)}</h3><p>${h(q.detail)}</p></div>
      <div class="quest-status"><b>${q.done}/${q.goal}</b>${q.complete ? '<span class="quest-stamp">Đã xong</span>' : ''}</div>
    </li>`).join('')}</ul>
  </section>`;
}

function challengeCard(challenge, sample) {
  if (!challenge) return '';
  const { next } = challenge;
  const unit = next.added ? 'kg đeo thêm' : next.perHand ? 'kg mỗi tay' : 'kg';
  return `<section class="cultivation-challenge" data-muscle="${h(challenge.key)}">
    <header class="cultivation-section-heading"><h2>Thử thách Bình cảnh</h2>${sample ? '<span class="cultivation-data-badge">Số liệu mẫu</span>' : ''}</header>
    <p class="challenge-realm">${h(challenge.name)} · ${h(challenge.label)}</p>
    <div class="challenge-goal">
      <div><p>${h(next.name)}</p><strong>${fmtNum(next.alt?.kg ?? next.kg)} ${unit} × ${next.alt?.r ?? 1}</strong>
        ${next.alt ? `<small>Hoặc ${fmtNum(next.kg)} ${unit} × 1</small>` : ''}</div>
      <p class="challenge-next">→ ${h(next.realm)}</p>
    </div>
    <div class="challenge-progress"><progress class="cultivation-meter" value="${challenge.pct}" max="100" aria-label="Tiến độ đến ${h(next.realm)}"></progress><b>${challenge.pct}%</b></div>
  </section>`;
}

export function heroView(profile, { preview = false, weekly = SAMPLE_QUESTS, challenge = SAMPLE_CHALLENGE, demo = true } = {}) {
  const { tuvi, canCo, shaky, linhKhi, meridians, bw } = profile;
  return `<article class="cultivation">
    <a class="cultivation-back small" href="#/">← Hôm nay</a>
    <header class="cultivation-cover">
      <span class="cultivation-mist" aria-hidden="true"></span>
      ${realmArt(tuvi.realm.i, 'cultivation-guardian')}
      <div class="cultivation-cover-heading">
        <h1>Động phủ</h1>
        ${preview ? '<span class="cultivation-sample">Số liệu mẫu</span>' : ''}
      </div>
      <div class="cultivation-rank">
        ${seal(tuvi.realm.i, tuvi.realm.name)}
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
    ${challengeCard(challenge, challenge === SAMPLE_CHALLENGE)}
    ${questBoard(weekly, weekly === SAMPLE_QUESTS)}
    ${demo ? `<section class="cultivation-demo" aria-labelledby="cultivation-demo-title">
      <h2 id="cultivation-demo-title">Xem thử nghi lễ</h2>
      <div class="row wrap">
        <button type="button" class="ghost" popovertarget="sample-breakthrough">Đột phá</button>
        <button type="button" class="ghost" popovertarget="sample-tribulation">Độ kiếp</button>
      </div>
      ${breakthroughModal(SAMPLE_BREAKTHROUGHS[0], { id: 'sample-breakthrough', demo: true })}
      ${breakthroughModal(SAMPLE_BREAKTHROUGHS[1], { id: 'sample-tribulation', demo: true })}
    </section>` : ''}
    <section class="card cultivation-panel cultivation-chart">
      <h2>Thất mạch đồ</h2>
      ${radar(meridians)}
    </section>
    <section>
      <div class="cultivation-section-heading">
        <h2>Thất mạch</h2>
        ${bw != null ? `<span class="muted small">Cân nặng ${fmtNum(bw)} kg</span>` : ''}
      </div>
      <ul class="cultivation-meridians">${meridians.map(meridianCard).join('')}</ul>
    </section>
    <details class="cultivation-atlas">
      <summary>Đồ phổ cảnh giới</summary>
      <ul>${REALMS.map((name, i) => `<li>${realmArt(i, 'cultivation-portrait')}${seal(i, name)}<b>${h(name)}</b></li>`).join('')}</ul>
    </details>
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
