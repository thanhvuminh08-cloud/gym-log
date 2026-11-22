# Luyện Thể Ký — tầm nhìn (hướng mới, 22/11/2026)

**Gym Log → Luyện Thể Ký.** Tu tiên không còn là lớp phủ tuỳ chọn (`settings.lore`) mà là **chủ đề chính** của cả app: mọi màn, mọi nhãn, mọi phần thưởng nói bằng văn phong luyện thể. Bên dưới vẫn là một app ghi buổi tập nghiêm túc — kg, rep, RPE, ~1RM là số thật và luôn được hiện.

Chi tiết cảnh giới, Thất mạch, Linh khí, Nhập môn, Luyện thể: xem `RPG.md` (vẫn đúng). File này chỉ nói **hướng đi, bản đồ app và hệ phần thưởng mới**.

## Nguyên tắc (giữ từ RPG.md, thêm 2 điều)
1. **Thật trước, huyền ảo sau** — mỗi chỉ số tu tiên có dòng nhỏ số thật.
2. **Không thưởng tập liều** — phẩm/kích/bia dựa trên tiến bộ và đều đặn, không phải mức tạ tuyệt đối trong một buổi.
3. **Không phạt, không rớt** — mất chuỗi chỉ là "Đạo tâm dao động", không trừ gì.
4. **Tính lại từ dữ liệu** — không lưu state game (trừ mốc "đã xem"). Khôi phục backup → mọi thứ tự đúng.
5. *(mới)* **Một từ, một nghĩa** — mỗi khái niệm chỉ một tên tu tiên, dùng thống nhất ở mọi nơi; nguồn tên duy nhất trong code (xem Hợp đồng).
6. *(mới)* **Không đổi dữ liệu** — đổi tên chỉ ở lớp trình bày: DB `gym`, khoá `gym.*`, schema, URL GitHub Pages giữ nguyên. Không tăng `DB_VERSION` cho việc đổi tên.

## Bỏ huy chương → hệ Công đức
| Cũ (huy chương) | Mới | Nghĩa thật (logic hiện có) |
|---|---|---|
| Tab Huy chương / kho huy chương | **Công đức bạ** | Sổ ghi mọi lần vượt, chuỗi, mốc tạ (`medals()` trong `js/medals.js`) |
| 🥇 Vàng | **Thượng phẩm** | e1RM vượt kỷ lục ≥ 5% (`GOLD_PCT`) |
| 🥈 Bạc | **Trung phẩm** | PR nhỏ / tăng tạ / tăng rep / tăng e1RM |
| 🥉 Đồng | **Hạ phẩm** | thêm set / thêm volume |
| Chuỗi buổi vượt (`streak`) | **Liên kích** (vd. "Liên kích ×4") | buổi liên tiếp có ≥ 1 bài vượt |
| Chuỗi tuần tập (`weeks`) | **Đạo tâm** (vd. "Đạo tâm 6 tuần") | tuần liên tiếp có tập |
| Mốc tạ (`milestones`) | **Thạch bi** — mỗi mốc là một tấm bia khắc kg + ngày | lần đầu set nặng nhất chạm 10…300 kg |

- Không dùng emoji huy chương nữa; phẩm hiện bằng ấn/ngọc giản 3 màu (Thượng = kim, Trung = ngọc bích, Hạ = đồng thau) — Codex quyết hình.
- Set vượt trong buổi: nhãn "Thượng phẩm" thay "Vàng"; hiệu ứng `celebrate(tier)` giữ nguyên mức rung.
- **Xung đột tên:** bước 3 Nhập môn đang gọi mục tiêu tập là "Đạo tâm" (`G.GOALS`). Đổi nhãn đó thành **"Chí hướng"** (khoá dữ liệu `dao.goal` giữ nguyên), để "Đạo tâm" chỉ còn nghĩa là sự kiên trì theo tuần.

## Bản đồ 5 mục (thanh điều hướng)
| Mục | Route | Gom từ | Nội dung |
|---|---|---|---|
| **Động phủ** | `#/` | Hôm nay + Động phủ (`#/hero`) | Nút Bế quan/Tiếp tục ở đầu · ấn Tu vi + Công lực · Thất mạch đồ · Nhiệm vụ tuần · lịch 7 ngày · Bình cảnh · nhắc sao lưu · độ sẵn sàng ("Khí huyết") |
| **Bế quan** | `#/workout` | Tập | Buổi đang tập; nghỉ = "Điều tức", kết thúc = "Xuất quan"; tổng kết buổi hiện phẩm, Liên kích, Thạch bi mới |
| **Công pháp** | `#/cong-phap` | Giáo án (`#/templates`) + Công pháp/lịch trong Cài đặt | Công pháp 7 mạch (sửa bài) · giáo án · lịch bế quan T2–CN · mục tiêu buổi/tuần |
| **Tu luyện ký** | `#/ky` | Lịch sử + Báo cáo tuần + Huy chương | 3 tab: **Nhật ký** (các buổi, `#/ky/<id>`) · **Tuần ký** (báo cáo tuần, `#/ky/tuan/<offset>`) · **Công đức bạ** (`#/ky/cong-duc`, gồm Thạch bi) |
| **Tàng thư** | `#/tang-thu` | Tiến độ + Cài đặt + thư viện bài | Biểu đồ theo bài, tổng quan năm, thân trọng · thư viện bài tập · Cài đặt (âm, rung, giới tính, Nhập môn lại) · sao lưu/khôi phục · nhật ký lỗi |

- Route cũ (`#/hero`, `#/history…`, `#/report…`, `#/progress…`, `#/templates…`, `#/settings`) **chuyển hướng** sang route mới để link/bookmark cũ không gãy.
- `#/nhap-mon` giữ nguyên, vẫn tự mở ở lần đầu.
- Tên app: `Luyện Thể Ký` ở `<title>`, brand header, `manifest.webmanifest` (`name`, `short_name` có thể "Luyện Thể"). Icon có thể đổi sau, không bắt buộc đợt này.
- `settings.lore` bỏ công tắc: văn phong tu tiên luôn bật. Thay bằng tuỳ chọn **"Chú giải"** (mặc định bật) — hiện dòng nghĩa thật nhỏ dưới thuật ngữ cho người mới.

## Hợp đồng (Claude làm trước, Codex dựng theo)
- `js/lore.js` (mới): từ điển duy nhất — `NAV` (5 mục: key, label, route, icon), `PHAM = {gold:'Thượng phẩm', silver:'Trung phẩm', bronze:'Hạ phẩm'}`, `term(k)` cho `start|rest|finish|streak|weeks|milestone|ledger`, `gloss(k)` cho dòng chú giải. `TIER_LABEL` trong `overload.js` lấy từ đây.
- `medals()` giữ tên hàm và cấu trúc trả về (đổi tên chỉ ở trình bày) → không phải viết lại smoke huy chương.
- Router: bảng `ROUTES` mới + `ALIASES` cũ→mới; các view hiện có được gắn lại làm tab con, không viết lại từ đầu.
- Markup giữ `data-*` và class hiện có (`.set .check .rest-bar .modal .pick-list`…).

## Thứ tự làm
1. **Claude** — `js/lore.js`, `TIER_LABEL`, router 5 mục + chuyển hướng route cũ, smoke kiểm các route mới. Ghi hợp đồng chi tiết cuối file này.
2. **Codex** — nav 5 mục, tên app, Động phủ gộp (số giả chỗ mới), khung 3 tab Tu luyện ký, giao diện Công đức bạ / phẩm / Liên kích / Đạo tâm / Thạch bi, trang Công pháp và Tàng thư.
3. **Claude** — nối dữ liệu thật, chuyển lịch tập/Công pháp khỏi Cài đặt, "Chú giải", nhãn "Chí hướng", smoke đủ luồng, tăng `VERSION`.
4. **Codex** — đánh bóng: hình ấn phẩm, tranh Thạch bi, thử trên iPhone (việc chờ cũ).

## Để sau (từ phản hồi dùng thật)
- Set sau tự điền theo set trước (ghi trong NOTES, vẫn chưa làm) — nên làm cùng đợt 3 vì đụng màn Bế quan.
- Ý tưởng "mời bật microcopy ở lần đầu" không còn cần (tu tiên luôn bật).

## Không làm
- Không tiền ảo, không gacha, không vật phẩm mua bán, không bảng xếp hạng.
- Không dùng tên nhân vật, tông môn, pháp bảo, cốt truyện hay hình ảnh của truyện/phim cụ thể nào.
- Không đổi DB, không đổi URL triển khai.
