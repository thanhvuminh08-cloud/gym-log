import { NAV, hint, term } from '../lore.js';

export const hintLabel = (label, note) => `<span class="label-with-hint">${label} <small class="term-hint">${note}</small></span>`;
export const termLabel = (key) => hintLabel(term(key), hint(key));

const journal = [
  ['journal', '#/ky', 'Nhật ký'],
  ['week', '#/ky/tuan', termLabel('tuanKy')],
  ['medal', '#/ky/cong-duc', termLabel('ledger')],
];
const archive = [
  ['overview', '#/tang-thu', 'Tổng quan'],
  ['ex', '#/tang-thu/ex', 'Bài tập'],
  ['body', '#/tang-thu/body', termLabel('thanTrong')],
  ['that-mach', '#/tang-thu/that-mach', termLabel('thatMach')],
  ['library', '#/tang-thu/library', 'Thư viện'],
  ['settings', '#/tang-thu/cai-dat', 'Cài đặt'],
];

function sectionHeader(key, links, active) {
  const { label, icon, hint: note } = NAV.find((item) => item.key === key);
  return `<header class="section-masthead" data-ink-surface="${active === 'settings' ? 'settings' : key}">
    <span class="tile-icon"><svg aria-hidden="true"><use href="#${icon}"/></svg></span><h1>${active === 'settings' ? 'Cài đặt' : hintLabel(label, note)}</h1>
  </header><div class="tabs section-tabs" role="navigation" aria-label="${label}">
    ${links.map(([id, href, title]) => `<a href="${href}" data-tab="${id}"${id === active ? ' class="on" aria-current="page"' : ''}>${title}</a>`).join('')}
  </div>`;
}

export const journalHeader = (active) => sectionHeader('ky', journal, active);
export const archiveHeader = (active) => sectionHeader('tang-thu', archive, active);
export const phamSeal = () => '<span class="pham-seal" aria-hidden="true"></span>';
