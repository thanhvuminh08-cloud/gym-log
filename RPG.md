# Hệ thống Tiến hoá — thiết kế (bản 1)

Nhập vai: nhân vật chính là chính người tập. Chủ đề **khoa học viễn tưởng** (giao diện quét sinh trắc, HUD, hologram), nhưng **mọi con số đều là số thật**: kg, ~1RM, tỉ lệ so với cân nặng. Game chỉ là lớp trình bày, không bịa chỉ số.

## Nguyên tắc
1. **Thật trước, ngầu sau.** Mỗi chỉ số game luôn hiện kèm số thật (vd. `Hạng B · Squat 1,62×BW · 113 kg`).
2. **Không thưởng tập liều.** Hạng dùng ~1RM ước tính từ set thường; XP thưởng sự đều đặn và set hoàn thành, không thưởng mức tạ.
3. **Không tụt hạng.** Hạng = kỷ lục mọi thời điểm. Hiện riêng **Đồng bộ** (phong độ hiện tại) để biết đang giữ sức hay xuống.
4. **Tính ra từ dữ liệu có sẵn**, không lưu thêm state game (trừ mốc "đã xem" để hiện màn lên cấp). Khôi phục backup → hệ thống tự tính lại.

## Thuật ngữ (giao diện)
| Game | Ý nghĩa thật |
|---|---|
| **Chủ thể** | Người dùng; hồ sơ = trang `#/hero` |
| **Mô-đun** | Nhóm cơ (Ngực, Lưng, Vai, Chân, Tay trước, Tay sau, Bụng) |
| **Hạng E → S** | Bậc sức mạnh theo chuẩn tỉ lệ ~1RM/cân nặng |
| **Cấp mô-đun Lv 1–60** | Vị trí trong hạng (6 hạng × 10 cấp) |
| **Cấp Chủ thể** | Tổng hợp các mô-đun |
| **Năng lượng (XP)** | Kinh nghiệm tích luỹ từ việc tập đều |
| **Đồng bộ %** | Phong độ: ~1RM tốt nhất 90 ngày / kỷ lục |
| **Đột phá** | Vượt ngưỡng sang hạng mới |

## 1. Hạng sức mạnh (cấp thật)
Mỗi bài chuẩn có 6 ngưỡng tỉ lệ `~1RM / cân nặng` (nam; nữ nhân hệ số bên dưới). Chuẩn tham khảo từ các bảng strength standards phổ biến, làm tròn — là **ước lượng**, ghi rõ trên giao diện.

| Hạng | Ý nghĩa thật | Squat | Bench | Deadlift | OHP | Barbell Row | Pull-up* | Barbell Curl | Dips* |
|---|---|---|---|---|---|---|---|---|---|
| E Khởi tạo | Mới bắt đầu | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D Thức tỉnh | Vài tháng | 0,75 | 0,5 | 1,0 | 0,35 | 0,5 | 1,0 | 0,2 | 1,0 |
| C Tăng cường | ~1 năm | 1,25 | 0,75 | 1,5 | 0,55 | 0,75 | 1,15 | 0,4 | 1,2 |
| B Chiến binh | 2–3 năm | 1,5 | 1,0 | 2,0 | 0,75 | 1,0 | 1,35 | 0,6 | 1,45 |
| A Tinh nhuệ | Nhiều năm, nghiêm túc | 2,25 | 1,5 | 2,5 | 1,0 | 1,25 | 1,6 | 0,85 | 1,75 |
| S Dị biệt | Thi đấu | 2,75 | 2,0 | 3,0 | 1,35 | 1,5 | 1,9 | 1,15 | 2,1 |

\* Bài trọng lượng cơ thể: tỉ lệ = (cân nặng + tạ đeo) / cân nặng.
Nữ: thân trên ×0,6, thân dưới (Squat, Deadlift, bài Chân) ×0,75.

**Bài phụ** quy đổi về bài chuẩn bằng hệ số (~1RM bài phụ ÷ hệ số = ~1RM tương đương):
Incline Bench 0,8 · Close-Grip Bench 0,9 (→ Tay sau) · Dumbbell Press 0,75 (tổng 2 tay) · Front Squat 0,8 · Romanian Deadlift 0,7 (→ Chân) · Leg Press 2,0 · T-Bar Row 1,0 · Dumbbell Row 0,45 (1 tay) · Dumbbell Shoulder Press 0,7 (tổng 2 tay) · Dumbbell Curl 0,45 (1 tay) · Skull Crusher 0,4 (so với Bench).
Bài cô lập (Lateral Raise, Leg Extension, Chest Fly…) và bài tự tạo: **không tính hạng**, chỉ cho XP.

**Hạng mô-đun** = hạng tốt nhất trong các bài thuộc nhóm cơ đó.
Bài chuẩn theo mô-đun: Ngực = Bench · Lưng = Deadlift, Row, Pull-up · Vai = OHP · Chân = Squat · Tay trước = Curl · Tay sau = Dips / Close-Grip · Bụng = không có chuẩn tạ → hạng theo XP mô-đun (xem mục 2).

**Cấp mô-đun** (liên tục): `Lv = 1 + floor(10 × (chỉ số hạng + phần đã đi được tới ngưỡng kế))`, tối đa 60.
Ví dụ Squat 1,62×BW: hạng B (1,5), kế A (2,25) → đi được 0,16 → Lv = 1 + floor(10 × 3,16) = 32.

**Cấp Chủ thể** = trung bình có trọng số các mô-đun: Chân 1,5 · Lưng 1,5 · Ngực 1,2 · Vai 1 · Tay trước 0,6 · Tay sau 0,6 · Bụng 0,6. Mô-đun chưa có dữ liệu tính Lv 1.

**Đồng bộ %** = ~1RM tương đương tốt nhất 90 ngày qua ÷ kỷ lục, mỗi mô-đun; Đồng bộ Chủ thể = trung bình. <85% hiện cảnh báo nhẹ "đang mất đồng bộ".

**Cần thêm dữ liệu:** cân nặng (đã có bảng `body`; lấy lần cân gần nhất *tại thời điểm* buổi tập, chưa cân → hỏi khi mở `#/hero`) và giới tính (`settings.sex = 'm'|'f'`, hỏi 1 lần).

## 2. Năng lượng (XP) — tiến bộ đều đặn
| Hành động | XP |
|---|---|
| Mỗi set hoàn thành | 10 (cộng vào mô-đun của bài) |
| Hoàn thành buổi | 50 |
| Buổi đúng lịch (ngày có trong `settings.schedule`) | +30 |
| Vượt lần trước: đồng / bạc / vàng | +20 / +40 / +80 |
| Đạt mục tiêu tuần (`weekGoal`) | +150 |
| Mỗi tuần trong chuỗi tuần liên tiếp | +20 × số tuần chuỗi (tối đa ×10) |

Giới hạn: tối đa 40 set/buổi được tính XP (chống "cày" set rác).
**Cấp Năng lượng**: XP cần để lên cấp L = `100 × L^1.5` (cộng dồn). Năm tập đều ≈ cấp 25–30.
Bụng (không có chuẩn tạ): hạng mô-đun theo XP mô-đun — ngưỡng D/C/B/A/S = 500 / 2 000 / 6 000 / 15 000 / 30 000.

## 3. Sự kiện & nhiệm vụ (đợt 2)
- **Màn Đột phá** khi lên hạng mô-đun hoặc cấp Chủ thể (so với mốc `gym.heroSeen`): toàn màn hình, hiện số thật vừa đạt.
- **Nhiệm vụ tuần** (3 cái, sinh từ dữ liệu): tập đủ lịch; vượt lần trước ở mô-đun yếu nhất; thêm 1 buổi cho mô-đun Đồng bộ thấp nhất.
- **Thử thách đột phá**: hiện mốc kg cụ thể để lên hạng kế (vd. "Bench 80 kg × 1 ≈ 1,0×BW → Hạng B").

## 4. Định hướng giao diện (Codex)
- Trang `#/hero` (vào từ thẻ trên Hôm nay; cân nhắc thay một mục nav).
- Phong cách **HUD sinh trắc**: nền đen-xanh sâu, đường kẻ mảnh phát sáng xanh lơ/xanh chanh, góc thẻ cắt vát, số dạng monospace, nhãn chữ hoa nhỏ giãn chữ, lưới mờ nền.
- Khối chính: huy hiệu hạng + Cấp Chủ thể, thanh XP; **biểu đồ radar 7 cạnh** các mô-đun; danh sách mô-đun (hạng, Lv, thanh tới ngưỡng kế, số thật, Đồng bộ %).
- Hiệu ứng: quét sinh trắc khi mở trang, số chạy, màn Đột phá có ánh sáng + rung (logic rung do Claude); **tắt hết khi giảm chuyển động**.
- Giữ thực tế: mỗi con số game có dòng nhỏ số thật; chú thích "Chuẩn tham khảo, ước lượng".

## Thứ tự làm
1. **Claude**: `js/hero.js` hàm thuần (bảng chuẩn, quy đổi, hạng/cấp mô-đun, Cấp Chủ thể, Đồng bộ, XP) + luật smoke. Hợp đồng dữ liệu cho Codex.
2. **Codex**: trang `#/hero` + thẻ trên Hôm nay với số liệu giả theo hợp đồng.
3. **Claude**: nối dữ liệu, hỏi cân nặng/giới tính, smoke luồng.
4. Đợt 2: màn Đột phá, nhiệm vụ tuần, thử thách.
