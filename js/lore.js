// Luyện Thể Ký — từ điển duy nhất cho tên tu tiên (VISION.md, nguyên tắc "Một từ, một nghĩa").
// Chỉ đổi ở lớp trình bày: khoá dữ liệu (gold/silver/bronze, streak, weeks, milestones…) giữ nguyên.

/** 5 mục thanh điều hướng. `r` = đoạn đầu của hash, dùng làm `data-r` trên <a> để router tô mục đang mở. */
export const NAV = [
  { key: 'dong-phu', r: '', label: 'Động phủ', route: '#/', icon: 'i-home' },
  { key: 'be-quan', r: 'workout', label: 'Bế quan', route: '#/workout', icon: 'i-dumbbell' },
  { key: 'cong-phap', r: 'cong-phap', label: 'Công pháp', route: '#/cong-phap', icon: 'i-layers' },
  { key: 'ky', r: 'ky', label: 'Tu luyện ký', route: '#/ky', icon: 'i-calendar' },
  { key: 'tang-thu', r: 'tang-thu', label: 'Tàng thư', route: '#/tang-thu', icon: 'i-trend' },
];

/** Phẩm thay huy chương: Thượng = kim, Trung = ngọc bích, Hạ = đồng thau. */
export const PHAM = { gold: 'Thượng phẩm', silver: 'Trung phẩm', bronze: 'Hạ phẩm' };

const TERMS = {
  start: 'Bế quan',
  rest: 'Điều tức',
  finish: 'Xuất quan',
  streak: 'Liên kích',
  weeks: 'Đạo tâm',
  milestone: 'Thạch bi',
  ledger: 'Công đức bạ',
};

const GLOSS = {
  start: 'Bắt đầu buổi tập',
  rest: 'Nghỉ giữa các set',
  finish: 'Kết thúc buổi tập',
  streak: 'Số buổi liên tiếp có ít nhất 1 bài vượt lần trước',
  weeks: 'Số tuần liên tiếp có tập',
  milestone: 'Lần đầu set nặng nhất chạm mốc tạ (10…300 kg)',
  ledger: 'Sổ ghi mọi lần vượt, chuỗi và mốc tạ',
  gold: '~1RM vượt kỷ lục ≥ 5%',
  silver: 'Kỷ lục nhỏ, tăng tạ, tăng rep hoặc tăng ~1RM',
  bronze: 'Thêm set hoặc thêm khối lượng',
};

/**
 * Tên tu tiên của một khái niệm. Có `n` thì kèm số: term('streak', 4) → "Liên kích ×4",
 * term('weeks', 6) → "Đạo tâm 6 tuần". Khoá lạ → trả lại chính khoá (dễ thấy khi thiếu).
 */
export function term(k, n) {
  const t = TERMS[k] ?? PHAM[k] ?? k;
  if (n == null) return t;
  if (k === 'streak') return `${t} ×${n}`;
  if (k === 'weeks') return `${t} ${n} tuần`;
  return `${t} ${n}`;
}

/** Dòng chú giải nghĩa thật (hiện nhỏ dưới thuật ngữ khi bật "Chú giải"). Khoá lạ → ''. */
export const gloss = (k) => GLOSS[k] ?? '';
