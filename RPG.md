# Con Đường Tu Luyện — thiết kế (bản 2, tu tiên)

Nhập vai tu tiên: người tập là **tu sĩ phàm nhân** từng bước luyện thể, đột phá cảnh giới. Cảm hứng **thể loại** tu tiên/huyền huyễn (phàm nhân chăm chỉ, tích luỹ từng chút, không có thiên phú may mắn) — dùng các khái niệm chung của thể loại (cảnh giới, linh khí, bình cảnh, độ kiếp), **không** dùng nhân vật, tông môn, pháp bảo hay cốt truyện riêng của bộ truyện nào.

Mọi con số vẫn là **số thật**: kg, ~1RM, tỉ lệ so với cân nặng. Tu tiên chỉ là lớp trình bày.

## Nguyên tắc
1. **Thật trước, huyền ảo sau.** Mỗi chỉ số tu luyện luôn hiện kèm số thật (vd. `Kết Đan · Trung kỳ — Squat 1,62×BW · 113 kg`).
2. **Không thưởng tập liều.** Cảnh giới dùng ~1RM ước tính từ set thường; Linh khí thưởng sự đều đặn và set hoàn thành, không thưởng mức tạ. Đúng tinh thần "phàm nhân": tiến bằng kiên trì.
3. **Cảnh giới không rớt.** Cảnh giới = kỷ lục mọi thời điểm. Riêng **Căn cơ %** cho biết phong độ hiện tại.
4. **Tính ra từ dữ liệu có sẵn**, không lưu state game (trừ mốc "đã xem" để hiện màn Đột phá). Khôi phục backup → tự tính lại.

## Thuật ngữ
| Tu luyện | Ý nghĩa thật |
|---|---|
| **Tu sĩ** | Người dùng; trang **Động phủ** (`#/hero`) |
| **Thất mạch** | 7 nhóm cơ: Ngực, Lưng, Vai, Chân, Tay trước, Tay sau, Bụng (mỗi nhóm = 1 mạch) |
| **Cảnh giới** | Bậc sức mạnh theo chuẩn tỉ lệ ~1RM/cân nặng |
| **Sơ kỳ / Trung kỳ / Hậu kỳ / Đại viên mãn** | Vị trí trong cảnh giới (Lv 1–60 tính ngầm) |
| **Tu vi** | Cảnh giới tổng của tu sĩ (tổng hợp Thất mạch) |
| **Linh khí** | XP tích luỹ từ việc tập đều; cấp Linh khí = **Công lực** |
| **Căn cơ %** | Phong độ: ~1RM tốt nhất 90 ngày / kỷ lục |
| **Bình cảnh** | Mốc kg cụ thể cần đạt để lên cảnh giới kế |
| **Đột phá / Độ kiếp** | Lên cảnh giới; từ Kết Đan trở lên là "độ kiếp" (hiệu ứng lôi kiếp) |

Microcopy tuỳ chọn ở nơi khác (bật/tắt trong Cài đặt, mặc định tắt): bắt đầu buổi = "Bế quan", đồng hồ nghỉ = "Điều tức", kết thúc = "Xuất quan".

## 1. Cảnh giới (sức mạnh thật)
Mỗi bài chuẩn có ngưỡng tỉ lệ `~1RM / cân nặng` (nam; nữ nhân hệ số bên dưới). Chuẩn tham khảo từ các bảng strength standards phổ biến, làm tròn — là **ước lượng**, ghi rõ trên giao diện.

| Cảnh giới | Ý nghĩa thật | Squat | Bench | Deadlift | OHP | Barbell Row | Pull-up* | Barbell Curl | Dips* |
|---|---|---|---|---|---|---|---|---|---|
| Phàm nhân | Mới bắt đầu | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Luyện Khí | Vài tháng | 0,75 | 0,5 | 1,0 | 0,35 | 0,5 | 1,0 | 0,2 | 1,0 |
| Trúc Cơ | ~1 năm | 1,25 | 0,75 | 1,5 | 0,55 | 0,75 | 1,15 | 0,4 | 1,2 |
| Kết Đan | 2–3 năm | 1,5 | 1,0 | 2,0 | 0,75 | 1,0 | 1,35 | 0,6 | 1,45 |
| Nguyên Anh | Nhiều năm, nghiêm túc | 2,25 | 1,5 | 2,5 | 1,0 | 1,25 | 1,6 | 0,85 | 1,75 |
| Hoá Thần | Thi đấu | 2,75 | 2,0 | 3,0 | 1,35 | 1,5 | 1,9 | 1,15 | 2,1 |

\* Bài trọng lượng cơ thể: tỉ lệ = (cân nặng + tạ đeo) / cân nặng.
Nữ: thân trên ×0,6, thân dưới (Squat, Deadlift, bài Chân) ×0,75.

**Bài phụ** quy đổi về bài chuẩn bằng hệ số (~1RM bài phụ ÷ hệ số = ~1RM tương đương):
Incline Bench 0,8 · Close-Grip Bench 0,9 (→ Tay sau) · Dumbbell Press 0,75 (tổng 2 tay) · Front Squat 0,8 · Romanian Deadlift 0,7 (→ Chân) · Leg Press 2,0 · T-Bar Row 1,0 · Dumbbell Row 0,45 (1 tay) · Dumbbell Shoulder Press 0,7 (tổng 2 tay) · Dumbbell Curl 0,45 (1 tay) · Skull Crusher 0,4 (so với Bench).
Bài cô lập (Lateral Raise, Leg Extension, Chest Fly…) và bài tự tạo: **không tính cảnh giới**, chỉ cho Linh khí.

**Cảnh giới một mạch** = cao nhất trong các bài thuộc nhóm cơ đó.
Bài chuẩn theo mạch: Ngực = Bench · Lưng = Deadlift, Row, Pull-up · Vai = OHP · Chân = Squat · Tay trước = Curl · Tay sau = Dips / Close-Grip · Bụng = không có chuẩn tạ → theo Linh khí của mạch (mục 2).

**Tiến độ trong cảnh giới** (liên tục): `p = chỉ số cảnh giới + phần đã đi tới ngưỡng kế` (0 → 6). `Lv = 1 + floor(10 × p)`, tối đa 60.
Kỳ trong cảnh giới theo phần lẻ: <0,3 Sơ kỳ · <0,6 Trung kỳ · <0,9 Hậu kỳ · còn lại Đại viên mãn.
Ví dụ Squat 1,62×BW: Kết Đan (1,5), kế Nguyên Anh (2,25) → đi được 0,16 → **Kết Đan · Sơ kỳ**, Lv 32.

**Tu vi (tổng)** = trung bình có trọng số `p` các mạch: Chân 1,5 · Lưng 1,5 · Ngực 1,2 · Vai 1 · Tay trước 0,6 · Tay sau 0,6 · Bụng 0,6. Mạch chưa có dữ liệu tính p = 0.

**Căn cơ %** = ~1RM tương đương tốt nhất 90 ngày ÷ kỷ lục, mỗi mạch; Căn cơ tổng = trung bình. <85% → "căn cơ lung lay" (nhắc nhẹ, không phạt).

**Bình cảnh**: với mạch, tính kg cần cho ngưỡng kế từ cân nặng hiện tại (vd. "Bench 80 kg × 1 ≈ 1,0×BW → Kết Đan").

**Cần thêm dữ liệu:** cân nặng (bảng `body`; lấy lần cân gần nhất *tại thời điểm* buổi tập; chưa cân → hỏi khi mở Động phủ) và giới tính (`settings.sex = 'm'|'f'`, hỏi 1 lần).

## 2. Linh khí (XP) — kiên trì tích luỹ
| Hành động | Linh khí |
|---|---|
| Mỗi set hoàn thành | 10 (vào mạch của bài) |
| Hoàn thành buổi | 50 |
| Buổi đúng lịch (`settings.schedule`) | +30 |
| Vượt lần trước: đồng / bạc / vàng | +20 / +40 / +80 |
| Đạt mục tiêu tuần (`weekGoal`) | +150 |
| Chuỗi tuần liên tiếp | +20 × số tuần chuỗi (tối đa ×10) |

Tối đa 40 set/buổi được tính (chống "cày" set rác).
**Công lực**: Linh khí cần để lên cấp L = `100 × L^1.5` (cộng dồn). Một năm tập đều ≈ cấp 25–30.
Bụng: cảnh giới theo Linh khí mạch — ngưỡng Luyện Khí/Trúc Cơ/Kết Đan/Nguyên Anh/Hoá Thần = 500 / 2 000 / 6 000 / 15 000 / 30 000.

## 3. Sự kiện & nhiệm vụ (đợt 2)
- **Màn Đột phá** khi mạch hoặc Tu vi lên kỳ/cảnh giới (so với mốc `gym.heroSeen`). Lên cảnh giới từ Kết Đan trở lên = **Độ kiếp**: mây đen, lôi kiếp, rồi hào quang; hiện số thật vừa đạt.
- **Nhiệm vụ tuần** (3 cái, sinh từ dữ liệu): tập đủ lịch; vượt lần trước ở mạch yếu nhất; thêm buổi cho mạch có Căn cơ thấp nhất.
- **Bình cảnh** hiện thành thử thách có mốc kg cụ thể.

## 4. Định hướng giao diện (Codex)
- Trang **Động phủ** `#/hero` (vào từ thẻ trên Hôm nay; cân nhắc thành một mục nav).
- Phong cách **thuỷ mặc huyền huyễn**: nền mực đen ánh lam, mây/núi mờ kiểu tranh thuỷ mặc, điểm nhấn vàng kim + ngọc bích, ấn triện đỏ cho cảnh giới, viền thẻ hoạ tiết vân mây mảnh. Tiêu đề chữ có chân (serif hỗ trợ tiếng Việt, vd. Noto Serif), số giữ rõ ràng.
- Khối chính: ấn triện cảnh giới + Tu vi (kỳ), thanh Linh khí/Công lực; **Thất mạch đồ** — biểu đồ radar 7 cạnh dạng trận pháp; danh sách 7 mạch (cảnh giới, kỳ, thanh tới bình cảnh, số thật, Căn cơ %).
- Hiệu ứng: linh khí (hạt sáng) tụ khi mở trang, số chạy; Độ kiếp có tia sét + rung (logic rung do Claude). **Tắt hết khi giảm chuyển động.**
- Giữ thực tế: mỗi con số tu luyện có dòng nhỏ số thật; chú thích "Chuẩn tham khảo, ước lượng".
- Ảnh/hoạ tiết tự vẽ (SVG) hoặc nguồn tự do bản quyền; không dùng ảnh/nhân vật từ truyện, phim.

## Thứ tự làm
1. **Claude**: `js/hero.js` hàm thuần (bảng chuẩn, quy đổi, cảnh giới/kỳ từng mạch, Tu vi, Căn cơ, Bình cảnh, Linh khí) + luật smoke + hợp đồng dữ liệu cho Codex.
2. **Codex**: trang Động phủ + thẻ trên Hôm nay với số liệu giả theo hợp đồng.
3. **Claude**: nối dữ liệu, hỏi cân nặng/giới tính, smoke luồng.
4. Đợt 2: màn Đột phá/Độ kiếp, nhiệm vụ tuần, Bình cảnh, microcopy tu tiên.
