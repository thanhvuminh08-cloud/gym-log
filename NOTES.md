# Ghi chú & backlog

## Đã có (v1)
- Ghi buổi tập (set/kg/rep), tự gợi ý số liệu lần trước, đồng hồ nghỉ, phát hiện PR.
- Giáo án (template), lịch sử, biểu đồ e1RM/volume theo bài, cân nặng.
- Sao lưu/khôi phục JSON.

- Quá tải lũy tiến (js/overload.js): so với lần trước; vàng = PR e1RM vượt kỷ lục ≥5% (`GOLD_PCT`), bạc = PR nhỏ hơn/tăng tạ (e1RM không tụt >2%)/tăng rep/e1RM, đồng = thêm set/volume. Đợt 2 (js/medals.js): tab Huy chương trong Tiến độ (`#/progress/medal`, nav đã đủ 5 mục); chuỗi = buổi liên tiếp có ≥1 bài vượt (buổi toàn bài mới bỏ qua) + tuần tập liên tiếp; mốc tạ 10–100 bước 10, rồi 120…200, 250, 300.
- Báo cáo tuần (js/report.js, `#/report/<offset>` 0 = tuần này, âm = tuần trước): T2–CN, so với tuần trước, vượt/huy chương, RPE TB, cân nặng, từng bài; nút chia sẻ (Web Share, không có thì sao chép). Link từ "7 ngày qua" ở Hôm nay.
- RPE (logic): mỗi set có `rpe?` 6–10 (`select.rpe[data-f=rpe]`, thang `RPE` trong overload.js); `target()` dùng RPE nặng nhất ở mức tạ cao nhất lần trước: ≤6 → +5kg, 7 → +2,5kg, 8/không ghi → như cũ, 9 → +1 rep, 10 → giữ nguyên. Lịch sử hiện `@8`.
- Hiệu ứng (logic): `celebrate(el, tier)` rung theo cấp (tôn trọng cài đặt rung) + gắn `.celebrate`; `countUp(root)` đếm `[data-count]` sau mỗi lần render; huy chương mới so với `localStorage gym.medalSeen` (lần đầu mở không đánh dấu).
- Tổng quan (js/insights.js, hàm thuần): `MUSCLE` nhóm cơ → `key` (data-muscle: chest/back/shoulders/legs/biceps/triceps/core/other) + màu dự phòng; `yearGrid` 12 tháng × 31 ngày, màu = nhóm cơ nhiều set nhất trong ngày; `topLifts` 3 bài tập nhiều nhất, ~1RM + delta so với 30 ngày trước + tổng; `weeklyVolume` 12 tuần theo nhóm cơ. chart.js: `sparkline`, `stackedBars`, `yearGridSvg`, `lineChart({area, labels, head})`. Tiến độ có tab `#/progress/overview` (mặc định) và `#/progress/ex/<id>` (khoảng 1T/3T/6T/1N/Tất cả, ô Max). SVG có style inline dự phòng (width 100%, fill) vì `.dashboard svg` ép 20px.
- An toàn dữ liệu (js/safety.js): Hôm nay có thẻ `.backup-reminder` khi có buổi tập xong mới hơn lần sao lưu cuối và đã quá 7 ngày (`BACKUP_DAYS`). Khôi phục chạy `validateBackup` (db.js), hiện số bản ghi để xác nhận, lưu bản dự phòng vào localStorage `gym.preRestore` (nút "Hoàn tác khôi phục"), rồi `importAll` ghi nguyên khối trong 1 transaction. Lỗi chưa xử lý → toast + 10 lỗi gần nhất trong `gym.errors` (Cài đặt › Nhật ký lỗi, `.error-log`). Khoá localStorage thêm hậu tố `.<db>` khi `?db=` khác `gym`.
- Thẻ thật (js/insights.js): `liftTotal(ws, ids)` tổng ~1RM tích luỹ (Tiến độ › thẻ Tổng = `mainLifts` Squat/Bench Press/Deadlift theo tên). `readinessAt/readiness` điểm 0–100 = 100 − nghỉ (<24h 20, <48h 8) − tải 7 ngày/TB tuần 28 ngày (>1,5 25, >1,3 12) − RPE TB buổi gần nhất trong 72h (≥9,5 15, ≥8,5 10, ≥7,5 5); delta so với hôm qua. `sessionCounts` buổi tuần (từ T2)/tháng, mục tiêu `settings.weekGoal` (3) / `monthGoal` (12). Smoke đọc `data-count` thay vì chữ (countUp dừng ở 0 khi khung ẩn).
- Lịch tập (js/schedule.js): `settings.schedule = {getDay(): templateId | ""}` (có khoá = ngày tập, "" = tự do). `weekPlan` → state none/done/due/rest cho Hôm nay + 7 ô T2–CN done/today/missed/planned/rest. Chọn giáo án ở Cài đặt tự bật ngày đó; giáo án đã xoá → coi như tự do; nút tập tắt khi đang có buổi dở. Smoke sao lưu/khôi phục `gym.settings`.
- Vòng nghỉ (js/timer.js): `--rest-progress` = % thời gian còn lại theo `gym.restStart`→`gym.restEnd` (±15 đổi cả tổng), `data-warn="true"` khi ≤10s.
- Tu luyện (js/hero.js, hàm thuần): `hero()` → Tu vi, Thất mạch (cảnh giới theo ~1RM/cân nặng lúc tập, kỷ lục không rớt), Căn cơ 90 ngày, Bình cảnh (kg cần theo cân nặng hiện tại), Linh khí/Công lực. Hợp đồng ở cuối RPG.md.
- Rung xong set: `tap()` (util.js) 25 ms theo cài đặt rung; set có huy chương mới chỉ rung `celebrate`. Tu luyện đợt 2 bước 1: `challenge`, `next.alt`, `snapshot/breakthroughs`, `quests`, `term` + `settings.lore` (hợp đồng cuối RPG.md).
- Tu luyện đợt 2 nối xong: `loadProfile()` kèm `profile.weekly` (quests); `ceremony(profile)` (views/hero.js) so `gym.heroSeen` → mở tối đa 3 màn Đột phá/Độ kiếp (dialog gắn body, sống qua đổi trang), lần đầu / chưa đủ cân nặng-giới tính chỉ lưu mốc; gọi khi vào Động phủ và sau Kết thúc buổi. `gym.questSeen` {week, done} → `nhiem-vu.mp3` khi nhiệm vụ vừa xong. Âm (js/sfx.js): `music()` lặp dong-phu khi ở Động phủ (cleanup route dừng, tạm dừng khi ẩn tab), `sfx()` một lần; bị chặn tự phát → thử lại ở lần chạm đầu. Mặc định `music: false`, `sfx: true`. Độ kiếp rung + dot-pha ở 1,05/1,65/2,25 s.
- Tu luyện đợt 3 (RPG.md mục 5): `js/dao.js` tính hồ sơ, cảnh giới và giáo án/lịch Công pháp. `#/nhap-mon` sáu bước đã nối dữ liệu thật: bản nháp sessionStorage `gym.daoDraft`; lần đầu mở (chưa `dao`/`daoSkip`, không có buổi dở) router chuyển tới; "Nhận công pháp" lưu cân nặng nếu đổi, `settings.dao` (+`templateIds`, làm lại thì ghi đè giáo án cũ), `schedule`, `weekGoal`, đặt mốc `gym.heroSeen` (không ăn mừng cảnh giới khởi đầu); Động phủ hiện hai bài mạnh nhất, số bài còn thiếu và nhãn tự khai.
- Hư cảnh & Xác chứng (RPG.md 5b): tự khai tối đa Kết Đan (`TEST_CAP`) tới khi buổi thật đạt 90% (`VERIFY`) → sự kiện Đột phá `verify`; `START_XP` Công lực khởi đầu; Bụng đo bằng Plank/Leg Raise/Ab Wheel (`CORE_TESTS`); nhiệm vụ `kind:verify`; bước 5 hỏi lại khi khai lố (`G.doubts`). Smoke xoá `gym.daoDraft` khi bắt đầu.
- Khoá Công pháp: đã Nhập môn → `pickExercise` (màn Tập, Giáo án) chỉ hiện bài trong `dao.path`, chip theo mạch, không "Tạo bài mới" (`.modal[data-locked=path]`, dòng `.pick-lock` dẫn tới Sửa Công pháp); `startWorkout` từ giáo án/buổi cũ bỏ bài ngoài Công pháp và báo toast (`lockedPath`, `filterByPath` trong js/dao.js).
- Luyện thể (RPG.md 5c): mạch dùng Bế mạch → Luyện Bì → Luyện Nhục → Luyện Cân → Luyện Cốt → Luyện Tủy · Sơ thành → Viên mãn (`temper()`); Tu vi giữ cảnh giới. Sự kiện `kind: tuvi|temper|verify`, chỉ Tu vi độ kiếp; mạch lên bậc = "Thối thể".

- Hướng mới (22/11): app thành **Luyện Thể Ký**, tu tiên là chủ đề chính; huy chương → Công đức bạ / phẩm / Liên kích / Đạo tâm / Thạch bi; nav 5 mục. Xem `VISION.md`.
- Luyện Thể Ký bước 1 (Claude, 22/11): `js/lore.js` (NAV/PHAM/term/gloss), `TIER_LABEL = PHAM`, router `ROUTES` 5 mục + `ALIASES` route cũ (`location.replace`); `#/` tạm xếp chồng home + hero. Hợp đồng chi tiết cuối VISION.md.
- Luyện Thể Ký bước 3 (Claude, 22/11): lịch bế quan + mục tiêu buổi chuyển từ Cài đặt sang Công pháp (`[data-schedule]`, `[data-goals]`); "Chú giải" `settings.gloss` (mặc định bật, thay `lore`) → `<html data-no-gloss>` ẩn `.gloss`; chữ chia sẻ Tuần ký dùng tên phẩm; bỏ `LORE/term` cũ trong js/hero.js (dùng lore.js); Bế quan: đánh dấu set xong → ô trống của set kế tự điền kg × rep.
- Động phủ gọn (22/11): thẻ lịch kiêm nút Bế quan/Tiếp tục, dải Tu vi, ba nhiệm vụ tuần và một hàng số. Thất mạch/Luyện thể/Bình cảnh ở Tàng thư › Thất mạch, Sức mạnh ở Tàng thư › Tổng quan. Nút Tiếp tục nằm trong thẻ đầu trang.
- Dễ dùng (22/11): người dùng chọn "giữ tu tiên, thêm chú" — tên tu tiên luôn kèm chữ thường (`hint`), gom 12 hệ tiến độ còn 4, một việc một tên, mục Bế quan có trang bắt đầu, không ép Nhập môn. Kế hoạch: VISION.md › Dễ dùng.
- Dễ dùng bước 2 (Codex): chú ngắn luôn hiện, Từ điển trong Tàng thư › Thư viện, Khí huyết chuyển sang Thất mạch, đổi nhãn Lịch tập/Mục tiêu tuần/Bài theo mạch và dựng mẫu chọn cách bắt đầu buổi tập.
- O5 + O4 bỏ gọn (Claude, 23/11): bỏ Mục tiêu tháng (`monthGoal`) và nhiệm vụ "đủ buổi" (còn 2 nhiệm vụ, ô Buổi tuần lấy số ngày theo lịch nếu có); nhiệm vụ chỉ gợi ý bài đã tập hoặc trong `dao.path`; nhắc sao lưu khi ≥3 buổi (`BACKUP_MIN`); lưới năm đếm mọi nhóm cơ trong ngày; set tốt nhất hiện kg×rep; tên buổi mặc định "Buổi tập tự do"; Lịch tập chưa có giáo án → 1 dòng. Thạch bi (Công đức bạ + tổng kết buổi) và Hư cảnh (chỉ khi có lời khai) đã đúng, giữ.
- Âm Hồn tu tiên (Claude, 23/11): `sfx()` ưu tiên âm nghi lễ (`MAJOR`: loiKiep/dotPha/thoiThe/xacChung/nhapMon) — đang phát thì âm nhỏ bỏ qua, bắt đầu thì cắt âm nhỏ; `played` ghi 20 lần phát cho smoke. setXong + `.is-set-sealed` 480 ms cho set thường, pham* cho phẩm mới, hetGio theo công tắc âm báo (thay bíp), xuatQuan khi lưu buổi, thoiThe/xacChung theo loại Đột phá, nhapMon ở ấn triện.
- O1 hỏi cân nặng + O2 tổng kết (Claude, 23/11): `js/recap.js` `recap(w, ctx)` so hồ sơ trước/sau buổi (Phẩm, +Linh khí/Công lực, Tu vi, mạch có tập: Linh khí + khai/lên bậc, Đột phá, nhiệm vụ vừa xong) + `nextSession` (lịch → giáo án Công pháp xoay vòng/lâu chưa dùng → mạch lâu chưa tập). Trang `#/ky/<id>` có thẻ `[data-recap]` "Thu hoạch"; thiếu cân nặng/giới tính → form `profileForm` ngay trong thẻ (lưu xong vẽ lại). Markup tạm, chưa CSS.
- O3 một nơi cho thân thể (Claude, 23/11): Động phủ + Thất mạch bỏ form, thay bằng dòng `profileHint` `[data-profile-hint=weight|sex]` dẫn tới Thân trọng (`#/tang-thu/body`) hoặc Cài đặt. Form chỉ còn ở trang tổng kết (hỏi một lần). Nhập môn bước 2: đã có giới tính + cân nặng → chỉ hiện 1 dòng `[data-dao-known]`, không hỏi lại.

## Triển khai
- GitHub Pages từ nhánh `main` (repo thanhvuminh08-cloud/gym-log) → https://thanhvuminh08-cloud.github.io/gym-log/. Cập nhật điện thoại = tăng `VERSION` sw.js + commit + `git push` (chỉ push khi người dùng đồng ý).

## Giao diện
- Dùng nền xanh đen, điểm nhấn xanh chanh. Đặt nút bắt đầu hoặc tiếp tục tập ở đầu trang Hôm nay và lưu ảnh tạ trong cache offline.
- Tab Huy chương dùng màu theo hạng, nhấn xanh chanh cho chuỗi và mức tạ, giữ ba cột thống kê trên điện thoại.
- Ba nút trong Tiến độ dùng ba cột bằng nhau để nằm cùng một hàng ở 375px.
- Nền xanh đen theo lớp, biểu đồ xanh lam và nút chính xanh chanh. Set vượt có ánh sáng theo hạng, huy chương mới có nhãn “Mới”, hiệu ứng tôn trọng chế độ giảm chuyển động.
- Thanh nghỉ tự chừa chỗ phía cuối trang theo chiều cao thực. Toast nằm dưới header và dùng chiều rộng màn hình khi cần.
- Hàng set dùng sáu cột trên điện thoại. Báo cáo tuần có điều hướng ngày, thẻ thống kê và màu theo hạng cho từng bài.
- Hôm nay và Tiến độ dùng thẻ kính tối, số lớn và một bảng màu nhóm cơ cho biểu đồ, chú thích và viền thẻ bài. Nút “Tiếp tục tập” nổi trên thanh điều hướng và chừa chỗ riêng cho thanh nghỉ.
- Hôm nay có thẻ nhắc sao lưu riêng. Cài đặt đặt nút hoàn tác cạnh ngày tạo bản dự phòng và trình bày từng lỗi thành một mục có thể xuống dòng.
- Nền đầu trang chuyển xanh đậm, thẻ kính có viền mảnh, số lớn và biểu đồ có nhãn; màn Tập nhóm ô nhập theo dạng kg × rep @ RPE.
- Thẻ Mục tiêu tập đánh dấu tuần/tháng đã đạt và dẫn đến nhóm ô số buổi ở đầu trang Cài đặt.
- Lịch tập có bảy dòng T2–CN trong Cài đặt và thẻ mời đặt lịch ở Hôm nay.
- Màn Tập dùng nút đánh dấu 48 × 48 px, ô nhập cao 48 px và viền xanh chanh cho set chưa xong đầu tiên của mỗi bài; set đã xong mờ nhẹ.
- Thanh nghỉ có vòng SVG cạnh số giây và kiểu cảnh báo vàng cho 10 giây cuối.
- Tổng kết buổi có bốn thẻ số lớn và hiệu ứng xuất hiện cho huy chương, theo cài đặt giảm chuyển động.
- Hôm nay và Tiến độ có khung chờ khi tải; nội dung khi đổi trang xuất hiện nhẹ nếu cho phép chuyển động.
- Lịch sử, Giáo án, Tiến độ và Huy chương có minh hoạ và hướng dẫn khi chưa có dữ liệu.
- Nút và liên kết dùng vùng chạm tối thiểu 44 px và có phản hồi khi nhấn.
- Động phủ dùng hồ sơ thật; nhiệm vụ, Thử thách Bình cảnh và hai nghi lễ xem thử dùng mẫu có nhãn. Hình núi, sương và sáu cảnh giới là SVG tự vẽ. Có thể đổi giới tính trong Cài đặt.
- Âm thanh tự tổng hợp bằng Node.js và mã hoá bằng FFmpeg, không dùng bản thu hay mẫu âm thanh bên ngoài. Tệp trong `assets/audio/`: `dong-phu.mp3`, `loi-kiep.mp3`, `dot-pha.mp3`, `nhiem-vu.mp3`.
- Nhập môn có nghi lễ đá linh căn, bảy mạch sáng lần lượt và ấn triện; hiện mốc Xác chứng bên cạnh Hư cảnh. Tiêu đề dùng Noto Serif tiếng Việt ngoại tuyến, theo giấy phép OFL trong `assets/fonts/`.
- Luyện thể có bảng bậc riêng ở Thất mạch và nghi lễ Thối thể tông đồng; dòng `.pick-lock` có nút Sửa Công pháp dễ chạm.
- Luyện Thể Ký dùng năm mục từ `NAV`, một trang Động phủ, ba tab Tu luyện ký, ấn phẩm kim/ngọc/đồng và Thạch bi theo mốc tạ thật.
- Công pháp gộp lịch thành một dòng mỗi ngày và đặt hai ô mục tiêu cạnh nhau. Động phủ giữ tên buổi dở khi tắt Chú giải. Công đức bạ dùng ba dáng ấn và bia khắc kg, ngày trên nền tranh núi có sẵn.
- Khi mở Động phủ lần đầu, tiêu đề “Ghi buổi tập đầu tiên” dẫn mắt tới nút Bế quan. Thẻ Nhập môn tuỳ chọn nằm ngay dưới, với biểu tượng và viền xanh ngọc.
- Hồn tu tiên: hiên luyện công do ImageGen tạo (tranh mực, sương núi, đèn đồng), nén WebP bằng FFmpeg. Vòng ấn vẽ bằng SVG. Nhạc và âm gốc tổng hợp bằng Node.js, mã hoá bằng FFmpeg, không dùng bản thu bên ngoài.
- O2–O4: Thu hoạch nằm ngay dưới tên buổi tập, nổi bật Linh khí/Phẩm và gợi ý Buổi sau; dòng hồ sơ và số đo đã lưu có kiểu riêng; Trạng thái trong Thất mạch gom Khí huyết và Căn cơ (kể cả phong độ từng mạch).
- Thu hoạch có vòng trận, ấn Phẩm và vệt sáng theo màu phẩm; Linh khí đếm tăng. Trạng thái có hai vòng chỉ số, Động phủ lần đầu có ánh đèn trong tranh. Chuyển động chạy một lượt và theo cài đặt giảm chuyển động.

## Việc chờ (yêu cầu giữa hai agent)
Ghi dạng `- [cho Codex|cho Claude] mô tả ngắn (file liên quan)`. Bên nhận làm xong thì xoá dòng.
- [cho Codex] Luyện Thể Ký bước 4 (VISION.md) còn thử ấn phẩm và tranh Thạch bi trực tiếp trên iPhone.
- [cho Codex] Kiểm trực tiếp trên iPhone xem thanh nghỉ có che nội dung cuối trang hoặc toast có đè logo không, rồi sửa nếu tái hiện. Đã kiểm bằng Chrome ở 320 và 375 px.
- [cho Codex] Style "Khu nguy hiểm" + nút Đặt lại app trong Cài đặt (`section.danger-zone`, `[data-act=resetAll]`, js/views/settings.js) — hiện chỉ markup tối thiểu.


## Ý tưởng sau khi dùng thực tế
- Chơi thử vai fan tiên hiệp (22/11): set sau tự điền — đã làm ở Luyện Thể Ký bước 3; microcopy luôn bật nên bỏ ý "mời bật".
- (ghi thêm ở đây khi tập)
