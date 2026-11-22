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

## Triển khai
- GitHub Pages từ nhánh `main` (repo thanhvuminh08-cloud/gym-log) → https://thanhvuminh08-cloud.github.io/gym-log/. Cập nhật điện thoại = tăng `VERSION` sw.js + commit + `git push` (chỉ push khi người dùng đồng ý).

## Giao diện
- Dùng nền xanh đen, điểm nhấn xanh chanh. Đặt nút bắt đầu hoặc tiếp tục tập ở đầu trang Hôm nay và lưu ảnh tạ trong cache offline.
- Tab Huy chương dùng màu theo hạng, nhấn xanh chanh cho chuỗi và mức tạ, giữ ba cột thống kê trên điện thoại.
- Ba nút trong Tiến độ dùng ba cột bằng nhau để nằm cùng một hàng ở 375px.
- Nền xanh đen theo lớp, biểu đồ xanh lam và nút chính xanh chanh. Set vượt có ánh sáng theo hạng, huy chương mới có nhãn “Mới”, hiệu ứng tôn trọng chế độ giảm chuyển động.
- Thanh nghỉ tự chừa chỗ phía cuối trang theo chiều cao thực. Toast nằm dưới header và dùng chiều rộng màn hình khi cần.
- Hàng set dùng sáu cột trên điện thoại. Báo cáo tuần có điều hướng ngày, thẻ thống kê và màu theo hạng cho từng bài.

## Việc chờ (yêu cầu giữa hai agent)
Ghi dạng `- [cho Codex|cho Claude] mô tả ngắn (file liên quan)`. Bên nhận làm xong thì xoá dòng.
- [cho Codex] Sau khi bản có sửa thanh nghỉ/toast (`dae83be`) được đẩy lên GitHub Pages, kiểm lại trên iPhone còn che nội dung cuối trang hoặc đè logo không, rồi sửa nếu tái hiện.
- [cho Codex] Ngôn ngữ thiết kế mới theo ảnh mẫu người dùng gửi (app tập sức mạnh, nền tối): header trang có vầng sáng xanh lam góc trên; thẻ kính mờ bo tròn, viền sáng mảnh; số liệu chính rất to + đơn vị nhỏ + mũi tên ↑↓ xanh/đỏ; chip màu có chấm tròn làm chú thích; nav dạng viên thuốc nổi, mục chọn có nền sáng; thẻ bài tập có vạch màu bên trái theo nhóm cơ; nút "Tiếp tục" nổi trên nav. Bảng màu nhóm cơ thống nhất (css/).
- [cho Codex] Claude đã gắn markup tạm cho phần số liệu mới, cần làm giao diện: Hôm nay `.strength .lift-cards .lift-card[data-muscle] .lift-top .lift-name svg.spark .lift-total .trend.up/.down`; Tiến độ: 4 tab `.tabs` (thêm Tổng quan), `.year-card .year-nav .year-total svg.year-grid rect[data-muscle]/.off/.future` (có `--i` để làm hiệu ứng hiện dần), `.volume-card svg.chart.bars g.bar[--i] rect[data-muscle]`, `.legend .legend-chip i.dot`, `.max-box`, `.chips.range`, `svg.chart path.area/.line text.pt`; `[data-muscle]` có trên `section.entry` (đang tập) và thẻ bài trong chi tiết lịch sử để làm vạch màu bên trái. Có thể bỏ thanh `.dashboard svg` 20px cho các SVG này (đang có style inline dự phòng).

## Ý tưởng sau khi dùng thực tế
- Nhắc lịch tập theo ngày trong tuần (iPhone không có thông báo nền khi không có server → chỉ nhắc trên trang Hôm nay).
- (ghi thêm ở đây khi tập)
