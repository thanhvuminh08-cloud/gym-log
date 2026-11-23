// Luyện Thể Ký — từ điển duy nhất cho tên tu tiên (VISION.md, nguyên tắc "Một từ, một nghĩa").
// Chỉ đổi ở lớp trình bày: khoá dữ liệu (gold/silver/bronze, streak, weeks, milestones…) giữ nguyên.
// "Giữ tu tiên, thêm chú" (VISION.md › Dễ dùng): mỗi tên tu tiên đi kèm một chữ thường (`hint`) và một câu giải nghĩa (`gloss`).

/**
 * 5 mục thanh điều hướng. `r` = đoạn đầu của hash, dùng làm `data-r` trên <a> để router tô mục đang mở.
 * `hint` = chữ thường hiện nhỏ dưới tên (luôn hiện, không theo công tắc Chú giải).
 */
export const NAV = [
  { key: 'dong-phu', r: '', label: 'Động phủ', hint: 'Hôm nay', route: '#/', icon: 'i-home' },
  { key: 'be-quan', r: 'workout', label: 'Bế quan', hint: 'Tập', route: '#/workout', icon: 'i-dumbbell' },
  { key: 'cong-phap', r: 'cong-phap', label: 'Công pháp', hint: 'Kế hoạch', route: '#/cong-phap', icon: 'i-layers' },
  { key: 'ky', r: 'ky', label: 'Tu luyện ký', hint: 'Nhật ký', route: '#/ky', icon: 'i-calendar' },
  { key: 'tang-thu', r: 'tang-thu', label: 'Tàng thư', hint: 'Tiến độ', route: '#/tang-thu', icon: 'i-trend' },
];

/** Phẩm thay huy chương: Thượng = kim, Trung = ngọc bích, Hạ = đồng thau. */
export const PHAM = { gold: 'Thượng phẩm', silver: 'Trung phẩm', bronze: 'Hạ phẩm' };

/**
 * Từ điển: khoá → [tên tu tiên, chữ thường ngắn, câu giải nghĩa]. Nhóm theo nơi người dùng gặp.
 * Thêm thuật ngữ mới thì thêm ở đây, không gõ chữ cứng trong view.
 */
const DICT = {
  // Hành động trong buổi tập
  start: ['Bế quan', 'Bắt đầu tập', 'Bắt đầu buổi tập'],
  rest: ['Điều tức', 'Nghỉ', 'Nghỉ giữa các set'],
  finish: ['Xuất quan', 'Kết thúc', 'Kết thúc và lưu buổi tập'],
  // Nơi chốn / mục
  dongPhu: ['Động phủ', 'Hôm nay', 'Trang chính: hôm nay tập gì, đang ở mức nào'],
  congPhap: ['Công pháp', 'Kế hoạch', 'Bài theo từng nhóm cơ, giáo án, lịch tập và mục tiêu'],
  giaoAn: ['Giáo án', 'Buổi mẫu', 'Danh sách bài + số set/rep dùng lại cho nhiều buổi'],
  tuLuyenKy: ['Tu luyện ký', 'Nhật ký', 'Các buổi đã tập, báo cáo tuần và thành tích'],
  tuanKy: ['Tuần ký', 'Báo cáo tuần', 'Tổng kết số buổi, set, khối lượng của một tuần'],
  ledger: ['Công đức bạ', 'Thành tích', 'Sổ ghi mọi lần vượt, chuỗi và mốc tạ'],
  tangThu: ['Tàng thư', 'Tiến độ', 'Biểu đồ, cân nặng, thư viện bài và cài đặt'],
  thanTrong: ['Thân trọng', 'Cân nặng', 'Cân nặng và vòng eo theo thời gian'],
  nhapMon: ['Nhập môn', 'Thiết lập', 'Khai báo thân thể, chọn bài cho từng nhóm cơ, nhận lịch tập gợi ý'],
  // Tiến độ — 4 hệ chính (VISION.md › Dễ dùng › B)
  tuvi: ['Tu vi', 'Cấp sức mạnh', 'Mức sức mạnh tổng, tính từ ~1RM các bài chính so với cân nặng'],
  congLuc: ['Công lực', 'Cấp chăm chỉ', 'Lên cấp nhờ tập đều và hoàn thành set, không phụ thuộc mức tạ'],
  linhKhi: ['Linh khí', 'Điểm tập', 'Điểm cộng mỗi set, mỗi buổi, buổi đúng lịch và lần vượt; đủ điểm thì lên Công lực'],
  thatMach: ['Thất mạch', '7 nhóm cơ', 'Ngực, Lưng, Vai, Chân, Tay trước, Tay sau, Bụng'],
  khaiMach: ['Khai mạch', 'Thêm bài', 'Nhóm cơ cần thêm bài thứ hai để tính cấp'],
  luyenThe: ['Luyện thể', 'Cấp nhóm cơ', 'Cấp của từng nhóm cơ: Bế mạch → Luyện Bì → Nhục → Cân → Cốt → Tủy'],
  quests: ['Nhiệm vụ tuần', 'Việc tuần này', '3 việc nhỏ sinh từ lịch và dữ liệu tập của bạn, làm mới mỗi thứ Hai'],
  // Phẩm và chuỗi
  gold: ['Thượng phẩm', 'Vượt mạnh', '~1RM vượt kỷ lục ≥ 5%'],
  silver: ['Trung phẩm', 'Vượt', 'Kỷ lục nhỏ, tăng tạ, tăng rep hoặc tăng ~1RM'],
  bronze: ['Hạ phẩm', 'Nhích', 'Thêm set hoặc thêm khối lượng'],
  streak: ['Liên kích', 'Chuỗi vượt', 'Số buổi liên tiếp có ít nhất 1 bài vượt lần trước'],
  weeks: ['Đạo tâm', 'Chuỗi tuần', 'Số tuần liên tiếp có tập'],
  milestone: ['Thạch bi', 'Mốc tạ', 'Lần đầu set nặng nhất chạm mốc tạ (10…300 kg)'],
  // Chỉ số phụ (chỉ hiện ở trang chi tiết Thất mạch)
  khiHuyet: ['Khí huyết', 'Độ sẵn sàng', 'Ước lượng cơ thể đã hồi phục chưa: theo thời gian nghỉ, tải 7 ngày, RPE'],
  canCo: ['Căn cơ', 'Phong độ', '~1RM tốt nhất 90 ngày so với kỷ lục; dưới 85% là đang tụt'],
  binhCanh: ['Bình cảnh', 'Mốc kế tiếp', 'Mức tạ cụ thể cần đạt để lên cấp tiếp theo'],
  dotPha: ['Đột phá', 'Lên cấp', 'Tu vi hoặc một nhóm cơ vừa lên cấp'],
  doKiep: ['Độ kiếp', 'Lên cấp lớn', 'Lên cấp từ Kết Đan trở lên (có hiệu ứng sấm)'],
  thoiThe: ['Thối thể', 'Nhóm cơ lên cấp', 'Một nhóm cơ lên bậc luyện thể'],
  huCanh: ['Hư cảnh', 'Tự khai', 'Cấp tính từ mức tạ bạn tự khai, chưa có buổi tập thật xác nhận'],
  xacChung: ['Xác chứng', 'Đã xác nhận', 'Buổi tập thật đạt ≥ 90% mức tự khai'],
  tracLinhCan: ['Trắc linh căn', 'Kiểm tra sức', 'Khai mức tạ tốt nhất hiện có để app xếp cấp ban đầu'],
  chiHuong: ['Chí hướng', 'Mục tiêu tập', 'Tăng sức mạnh, tăng cơ, giảm mỡ hay khoẻ bền'],
};

const TERMS = Object.fromEntries(Object.entries(DICT).map(([k, [t]]) => [k, t]));

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

/** Chữ thường ngắn đi kèm tên tu tiên ("Bế quan" → "Bắt đầu tập"). Khoá lạ → ''. */
export const hint = (k) => DICT[k]?.[1] ?? '';

/** Dòng chú giải nghĩa thật (hiện nhỏ dưới thuật ngữ khi bật "Chú giải"). Khoá lạ → ''. */
export const gloss = (k) => DICT[k]?.[2] ?? '';

/** Toàn bộ từ điển cho trang "Từ điển" (Tàng thư): [{ key, term, hint, gloss }] theo thứ tự trên. */
// Liên kích (streak) không còn hiện ở đâu (O7: chỉ giữ Đạo tâm) → không đưa vào Từ điển.
export const GLOSSARY = Object.entries(DICT).filter(([key]) => key !== 'streak').map(([key, [t, hn, g]]) => ({ key, term: t, hint: hn, gloss: g }));
