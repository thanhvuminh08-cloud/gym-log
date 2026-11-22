# Ghi chú & backlog

## Đã có (v1)
- Ghi buổi tập (set/kg/rep), tự gợi ý số liệu lần trước, đồng hồ nghỉ, phát hiện PR.
- Giáo án (template), lịch sử, biểu đồ e1RM/volume theo bài, cân nặng.
- Sao lưu/khôi phục JSON.

- Quá tải lũy tiến (js/overload.js): so với lần trước; vàng = PR e1RM, bạc = tăng tạ (e1RM không tụt >2%)/tăng rep/e1RM, đồng = thêm set/volume. Đợt 2 (js/medals.js): tab Huy chương trong Tiến độ (`#/progress/medal`, nav đã đủ 5 mục); chuỗi = buổi liên tiếp có ≥1 bài vượt (buổi toàn bài mới bỏ qua) + tuần tập liên tiếp; mốc tạ 10–100 bước 10, rồi 120…200, 250, 300.

## Giao diện
- Dùng nền xanh đen, điểm nhấn xanh chanh. Đặt nút bắt đầu hoặc tiếp tục tập ở đầu trang Hôm nay và lưu ảnh tạ trong cache offline.
- Tab Huy chương dùng màu theo hạng, nhấn xanh chanh cho chuỗi và mức tạ, giữ ba cột thống kê trên điện thoại.
- Ba nút trong Tiến độ dùng ba cột bằng nhau để nằm cùng một hàng ở 375px.

## Việc chờ (yêu cầu giữa hai agent)
Ghi dạng `- [cho Codex|cho Claude] mô tả ngắn (file liên quan)`. Bên nhận làm xong thì xoá dòng.
- [cho Claude] Tăng `VERSION` trong `sw.js` để thiết bị nhận CSS mới cho hàng nút Tiến độ.

## Ý tưởng sau khi dùng thực tế
- (ghi thêm ở đây khi tập)
