import { NAV, term } from '../lore.js';

const journal = [
  ['journal', '#/ky', 'Nhật ký'],
  ['week', '#/ky/tuan', 'Tuần ký'],
  ['medal', '#/ky/cong-duc', term('ledger')],
];
const archive = [
  ['overview', '#/tang-thu', 'Tổng quan'],
  ['ex', '#/tang-thu/ex', 'Bài tập'],
  ['body', '#/tang-thu/body', 'Thân trọng'],
  ['that-mach', '#/tang-thu/that-mach', 'Thất mạch'],
  ['library', '#/tang-thu/library', 'Thư viện'],
  ['settings', '#/tang-thu/cai-dat', 'Cài đặt'],
];

function sectionHeader(key, links, active) {
  const { label, icon } = NAV.find((item) => item.key === key);
  return `<header class="section-masthead">
    <span class="tile-icon"><svg aria-hidden="true"><use href="#${icon}"/></svg></span><h1>${label}</h1>
  </header><div class="tabs section-tabs" role="navigation" aria-label="${label}">
    ${links.map(([id, href, title]) => `<a href="${href}" data-tab="${id}"${id === active ? ' class="on" aria-current="page"' : ''}>${title}</a>`).join('')}
  </div>`;
}

export const journalHeader = (active) => sectionHeader('ky', journal, active);
export const archiveHeader = (active) => sectionHeader('tang-thu', archive, active);
export const phamSeal = () => '<span class="pham-seal" aria-hidden="true"></span>';
