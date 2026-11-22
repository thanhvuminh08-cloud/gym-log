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

## Hợp đồng dữ liệu (bước 1 xong — `js/hero.js`)
`hero({workouts, exercises, body, sex, schedule, weekGoal, now})` trả về (Codex dựng giao diện với số giả đúng dạng này):
```js
{
  needsWeight: false, needsSex: false,   // true → Động phủ hiện ô hỏi cân nặng / giới tính (Claude nối ở bước 3)
  bw: 80, sex: 'm',                      // kg hiện tại
  tuvi: { p: 2.079, lv: 21, realm: { i: 2, name: 'Trúc Cơ' }, phase: { i: 0, name: 'Sơ kỳ' }, label: 'Trúc Cơ · Sơ kỳ', tribulation: false },
  canCo: 23, shaky: true,                // % phong độ (null = chưa có dữ liệu); shaky = < 85%
  linhKhi: { level: 3, xp: 470, into: 87, need: 520, pct: 16,   // Công lực = level; thanh = into/need
             parts: { sets, sessions, schedule, overload, weekGoal, streak } },
  meridians: [   // luôn 7 phần tử, thứ tự: chest back shoulders legs biceps triceps core (= data-muscle)
    { key: 'legs', name: 'Chân', p: 3.222, lv: 33, realm: {i, name}, phase: {i, name}, label: 'Kết Đan · Sơ kỳ', tribulation: true,
      ratio: 1.67,                       // ×BW kỷ lục (null nếu chưa có)
      best: { exerciseId, name: 'Squat', w: 100, r: 5, kg: 116.7, eq: 116.7, ratio: 1.67, bw: 70, t, workoutId } | null,
      canCo: 90, shaky: false, xp: 20,   // Linh khí của mạch
      next: { realm: 'Nguyên Anh', ratio: 2.25, exerciseId, name: 'Squat', kg: 180, added: false, perHand: false } | null },
    // Bụng: ratio/best/canCo = null, next = { realm, xp, left } (theo Linh khí mạch)
  ],
}
```
- Dòng số thật gợi ý: `Squat 1,67×BW · ~1RM 116,7 kg`; Bình cảnh: `Squat 180 kg × 1 → Nguyên Anh` (`added` = kg đeo thêm cho Pull-up/Dips; `perHand` = kg mỗi quả tạ đơn).
- Phàm nhân chưa có dữ liệu: `label: 'Phàm nhân'`, `lv: 1`, `p: 0`. Radar Thất mạch dùng `p` (0–6).
- Quy ước tính: ~1RM chỉ lấy tối đa 12 rep/set; bài tự tạo / cô lập chỉ cho Linh khí; Công lực: từ cấp L lên L+1 cần `100 × L^1,5`; "buổi đúng lịch" so với lịch hiện tại, 1 lần/ngày.

## Hợp đồng đợt 2 (bước 1 xong — `js/hero.js`, Codex dựng giao diện với số giả)
- `hero()` thêm `challenge: { key, name, label, pct, next } | null` — thử thách Bình cảnh = mạch gần đột phá nhất (`pct` = % đã đi trong cảnh giới). Mỗi `next` (mạch có tạ) thêm `alt: { r: 5, kg }` → dòng gợi ý `Squat 154,5 kg × 5 (hoặc 180 kg × 1) → Nguyên Anh`.
- `snapshot(profile)` / `breakthroughs(seen, profile)` → `[{ key: 'tuvi'|mạch, name, from, to, realm, tribulation, real }]`, quan trọng nhất trước. `realm` = lên cảnh giới (false = lên kỳ); `tribulation` = độ kiếp (lên Kết Đan trở lên). `real` = dòng số thật (`Squat 1,67×BW · ~1RM 116,7 kg`). Claude sẽ lưu mốc ở `gym.heroSeen` và gọi màn khi mở Động phủ / xong buổi. Markup gợi ý: `.breakthrough-modal.modal[data-tribulation]`, nút đóng `data-act="closeBreak"`; rung lôi kiếp do Claude.
- `quests({ workouts, exercises, profile, schedule, weekGoal, now })` → `{ quests: [{ id: 'schedule'|'overload'|'canCo', title, detail, meridian, goal, done, complete }] × 3, done, total }` — nhiệm vụ tuần T2–CN, không thưởng Linh khí (chỉ hiển thị). Đặt trong Động phủ (`[data-quests]`, mỗi mục `[data-quest=<id>]`), có thể thêm `done/total` vào thẻ Tu luyện ở Hôm nay.
- Microcopy: `settings.lore` (mặc định false), `term(k, on)` với k = `start|rest|finish` → `Bắt đầu/Bế quan`, `Nghỉ/Điều tức`, `Kết thúc/Xuất quan`. Cài đặt: checkbox `data-k="lore"`; đổi giới tính: `<select data-k="sex">` (m/f) — handler đã nhận giá trị chuỗi.

## 5. Nhập môn, Trắc linh căn, Công pháp (đợt 3 — logic xong ở `js/dao.js` + `js/hero.js`)
Ý tưởng: lần đầu mở app như khai báo với PT nhưng bằng văn phong tu tiên; xếp cảnh giới ngay từ đầu (người tập lâu năm không phải bắt đầu ở Luyện Khí); người dùng tự chọn bài cho từng mạch (không ép Deadlift); mạch phải luyện ≥ 2 bài mới lên được.

**Luật mới (đã áp dụng cho mọi người dùng):**
- **Cảnh giới mạch = trung bình 2 bài mạnh nhất** của mạch (`PAIR = 2`, bài thiếu tính 0). Chỉ Squat 1,67×BW → mạch Chân Luyện Khí Hậu kỳ; thêm Front Squat mới lên. Tu vi vẫn là trung bình có trọng số các mạch.
- **Công pháp** (`settings.dao.path = {chest:[exerciseId…], …}`): chỉ bài trong Công pháp được xét cảnh giới (bài khác vẫn cho Linh khí). Chưa Nhập môn → mọi bài có quy đổi đều xét.
- Bảng quy đổi mở rộng gần đủ thư viện (máy/cáp/tạ đơn là ước lượng thô); thêm `bwf` cho bài thân người (Hít đất = 64% cân nặng).
- **Bình cảnh** chỉ sang bài cần nâng: bài mạnh nhất đã qua mốc → bài thứ hai cần `2·mốc − bài mạnh nhất`; chưa → cả hai cùng tới mốc (`next.pair = true`, gợi ý bài mạnh nhất).
- **Trắc linh căn**: mức tạ tự khai (`dao.tested`) = một buổi ảo ở `dao.at`, tính kỷ lục + Căn cơ (90 ngày sau không tập lại thì Căn cơ tụt — tự khai mà không luyện sẽ "lung lay"), không cho Linh khí.
- **Nhiệm vụ "Khai mạch"**: mạch yếu nhất chưa đủ 2 bài → `kind: 'open'`, "Khai mạch Tay sau · Luyện Dips" (thay "Vượt lần trước" khi chưa có lần trước). Nhiệm vụ chọn mạch theo hồ sơ đầu tuần nên không đổi giữa tuần.

**Hợp đồng dữ liệu cho Codex** (`import * as G from '../dao.js'`):
- `settings.dao = { at, name, height, age, experience, goal, days, path, tested:[{exerciseId, w, r}] }` (null = chưa Nhập môn; `G.entered(settings.get())`).
- Lựa chọn: `G.EXPERIENCE` (Thời gian tu đạo: `{id, label, real, test}` — `test=false` thì bỏ bước Trắc linh căn), `G.GOALS` (Đạo tâm: `{id, label, real}`), số buổi bế quan/tuần 2–6 (`G.DAYS`).
- `G.pathOptions(exercises)` → `[{key, name, min: 2, options:[{id, name, ranked, main}]}] × 7`; `ranked=false` = bài không xét cảnh giới (ghi chú "chỉ cho Linh khí"). `G.defaultPath(exercises)` để tick sẵn. `G.validatePath(path, exercises)` → `{ok, problems:[{key, name, have, need}]}` — nút tiếp tục tắt khi `!ok`, ghi "Mạch Lưng cần thêm 1 bài".
- `G.testList(path, exercises)` → `[{exerciseId, name, meridian, meridianName, bodyweight, perHand}]` — mỗi bài 2 ô "kg × rep tốt nhất gần đây" (bodyweight → "kg đeo thêm", perHand → "kg mỗi tay"), được bỏ trống.
- `G.assess({dao, exercises, body, sex, now})` → `{tuvi, meridians:[{key, name, label, p, need}], top:{name, label}|null, verdict}` cho màn kết quả (ấn triện + lời phán + "Thiên phú: mạch Chân").
- `G.buildPlan({path, days, goal, experience}, exercises)` → `{templates:[{id, name, items}], schedule}` để xem trước giáo án tự sinh.
- `hero()` mỗi mạch thêm `lifts: [{exerciseId, name, label, ratio, kg, tested}]` (tối đa 2), `need` (số bài còn thiếu), `next.pair`, `best.tested` (kỷ lục tự khai → nhãn nhỏ "tự khai").

**Luồng UI đề xuất** (route `#/nhap-mon`, view `js/views/dao.js` export `render`): 1. Nhập môn — Đạo hiệu (tuỳ chọn) · 2. Thân thể — giới tính, Thân trọng (kg), Thân cao (cm), Tuổi · 3. Đạo hạnh — Thời gian tu đạo, Đạo tâm, số buổi bế quan/tuần · 4. Chọn Công pháp — 7 mạch, mỗi mạch tick ≥ 2 bài · 5. Trắc linh căn (bỏ qua nếu `test=false`) · 6. Kết quả + giáo án tự sinh, nút "Nhận công pháp" / "Để sau". Markup: mỗi bước `[data-dao-step=<1..6>]`; input `name=name|sex|weight|height|age|experience|goal|days`; tick bài `input[type=checkbox][data-path=<mạch>][value=<exerciseId>]`; mức tạ `[data-test=<exerciseId>]` có 2 input `name=w`, `name=r`; nút `data-act="daoNext|daoBack|daoSkip|daoSave"`. Claude nối: lưu, tạo giáo án + lịch, đặt mốc `gym.heroSeen` (không ăn mừng cảnh giới khởi đầu), tự chuyển tới `#/nhap-mon` ở lần mở đầu, mục "Sửa Công pháp" trong Cài đặt/Động phủ.

### 5b. Hư cảnh & Xác chứng (sau lần chơi thử khó tính — logic xong)
- **Hư cảnh**: mức tự khai chưa chứng minh chỉ tính tới `TEST_CAP = 3,9` (Kết Đan · Đại viên mãn). Khai lố (từ Nguyên Anh, hoặc > 15 rep bài tạ) → bước 5 hỏi lại "Đạo hữu chắc chứ?" (`G.doubts`).
- **Xác chứng**: buổi thật đạt ≥ 90% mức khai (`VERIFY`) → bỏ giới hạn, `breakthroughs` trả sự kiện `{key:'verify', verify:true, name:'Xác chứng · <bài>', from:'Hư cảnh', to, real}` (tiêu đề modal "Xác chứng").
- **Công lực khởi đầu** theo thời gian tu đạo (`START_XP`: 0 / 15k / 60k / 150k / 250k Linh khí ≈ cấp 1 / 11 / 19 / 27 / 33).
- **Bụng đo được** (`CORE_TESTS`): Plank theo giây (45/90/150/240/360), Hanging Leg Raise, Ab Wheel theo rep. Mạch Bụng = max(Linh khí mạch, TB 2 bài đo). Buổi thật cũng tính (Plank 60 giây ghi rep = 60).
- **Nhiệm vụ "Xác chứng mạch X"** (`kind:'verify'`, `exerciseId`) đứng trước Khai mạch / Vượt lần trước khi còn lời khai chưa chứng minh; detail có mốc cụ thể "Squat ~1RM 126 kg (vd. 110 kg × 5)".
- Hợp đồng thêm: `hero().claims = [{exerciseId, name, meridian, label (mức khai gốc), verified, capped, pct (% đã đạt), target:{kg, alt, added, perHand}|{reps, unit}}]`, `hero().unverified`, `hero().verified` (id); mỗi mạch `unverified`; mỗi `lifts[]` thêm `unverified, capped, reps, unit` (Bụng: `reps` + `unit` thay cho ratio/kg). `G.testList` thêm bài Bụng `{core:true, unit}`. `G.assess` thêm `unverified, claims, linhKhi`.
