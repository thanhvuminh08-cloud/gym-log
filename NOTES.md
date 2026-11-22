# Ghi chú & backlog

## Đã có (v1)
- Ghi buổi tập (set/kg/rep), tự gợi ý số liệu lần trước, đồng hồ nghỉ, phát hiện PR.
- Giáo án (template), lịch sử, biểu đồ e1RM/volume theo bài, cân nặng.
- Sao lưu/khôi phục JSON.

- Quá tải lũy tiến (js/overload.js): so với lần trước; vàng = PR e1RM, bạc = tăng tạ (e1RM không tụt >2%)/tăng rep/e1RM, đồng = thêm set/volume. Đợt 2 (js/medals.js): tab Huy chương trong Tiến độ (`#/progress/medal`, nav đã đủ 5 mục); chuỗi = buổi liên tiếp có ≥1 bài vượt (buổi toàn bài mới bỏ qua) + tuần tập liên tiếp; mốc tạ 10–100 bước 10, rồi 120…200, 250, 300.

## Giao diện
- Dùng nền xanh đen, điểm nhấn xanh chanh. Đặt nút bắt đầu hoặc tiếp tục tập ở đầu trang Hôm nay và lưu ảnh tạ trong cache offline.

## Việc chờ (yêu cầu giữa hai agent)
Ghi dạng `- [cho Codex|cho Claude] mô tả ngắn (file liên quan)`. Bên nhận làm xong thì xoá dòng.
- [cho Codex] Style tab Huy chương (css/app.css, js/views/progress.js tab `medal`): `.stats.medals .tier[data-tier]` (3 ô vàng/bạc/đồng), `.stats.streaks .streak` (chuỗi), `.card.milestone` (mốc tạ), `a.card.medal-row` (huy chương gần đây, có `.tier.small` bên trong). Không đổi class/data-*.

## Ý tưởng sau khi dùng thực tế
- (ghi thêm ở đây khi tập)
