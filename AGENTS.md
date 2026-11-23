# Gym Log — hướng dẫn chung cho Codex + Claude Code

PWA cá nhân ghi buổi tập gym. 1 người dùng, dữ liệu IndexedDB trên điện thoại, UI tiếng Việt. Vanilla JS ES modules: không framework, không npm, không build.

## Hai agent, người dùng điều phối
- **Codex = giao diện**: `css/`, `index.html`, `assets/`, `icons/`, `manifest.webmanifest`, markup HTML trong `js/views/*`.
- **Claude Code = logic**: các file còn lại trong `js/`, `sw.js`, xử lý sự kiện/dữ liệu trong `js/views/*`. Claude **chỉ code, không chạy test**.
- **Codex = test**: giữ `smoke.html` (viết bước mới + chạy), kiểm mọi commit `logic:`; lỗi → 1 dòng `[cho Claude]` vào "Việc chờ".
- Thay đổi không phải của bạn là của agent kia: không hoàn tác/viết lại. Cần bên kia làm gì → 1 dòng vào "Việc chờ" trong `NOTES.md`.
- `js/views/*` là vùng chung: thấy `git status` có thay đổi chưa commit không phải của bạn → dừng, báo người dùng.
- Markup phải giữ nguyên `data-*` (act, f, ei, si, id, i, tab, m, del, k) và class `.set .check .rest-bar .modal .pick-list` — logic dựa vào chúng.

## Tiết kiệm token (bắt buộc)
- Bắt đầu: `git log --oneline -5` + `git diff HEAD~1 --stat`. Không đọc lại cả repo; mở đúng file, ưu tiên grep/đoạn dòng.
- Kiểm tra bằng **smoke test**, không chụp màn hình hàng loạt: `powershell -File serve.ps1`, mở `http://localhost:8080/smoke.html`, đọc dòng `SMOKE: PASS/FAIL` (dùng DB riêng, không đụng dữ liệu thật). Chỉ chụp 1 ảnh khi cần xem thẩm mỹ.
- Không tạo lại ảnh đã có. Ảnh ≤ 200KB.
- Trả lời người dùng ngắn; quyết định ghi 1 dòng vào `NOTES.md`.
- Claude thêm luồng mới quan trọng → ghi `[cho Codex] test: <luồng cần kiểm, hàm/file>` vào "Việc chờ"; Codex bổ sung bước vào `smoke.html`.
- Người dùng là người mới: **chủ động báo "nên mở chat mới"** khi xong một việc, khi đổi sang việc không liên quan, hoặc khi hội thoại đã dài. Trước đó commit + ghi việc dở vào `NOTES.md`, và đưa 1 câu mở đầu để dán vào chat mới.

## Kết thúc mỗi việc
1. Codex: smoke PASS (Claude: bỏ bước này, ghi việc cần test vào "Việc chờ"). 2. Sửa file tĩnh → **tự** tăng `VERSION` trong `sw.js` (file mới → thêm vào `FILES`), ai sửa người đó tăng, không nhờ bên kia. 3. Commit nhỏ, tiền tố `ui:` (Codex) / `logic:` (Claude). 4. Push sau khi Codex test PASS: Claude báo người dùng "chuyển Codex test"; Codex hỏi 1 câu "push lên điện thoại?" — không dồn commit.

## Phối hợp hai agent
- **Mỗi lúc chỉ một agent chạy.** Bắt đầu: `git status` phải sạch; có thay đổi chưa commit của bên kia → dừng, báo người dùng.
- **Tính năng có giao diện: Codex làm trước** (markup + CSS với số liệu giả, giữ `data-*`/class đặt tên rõ), Claude gắn dữ liệu thật sau. Claude không tự viết style tạm, trừ khi không có giao diện thì không dùng được.
- Việc nhỏ một dòng trong vùng của bên kia (tăng VERSION, thêm `data-*`) → tự làm, ghi trong commit, không mở "Việc chờ".
- Ưu tiên phản hồi dùng thật: trước tính năng lớn mới, xem mục "Ý tưởng sau khi dùng thực tế" trong `NOTES.md`.

## Bản đồ file
- `js/app.js` router hash (`#/workout`, `#/history/<id>`, `#/templates/<id|new>`), seed, đăng ký SW (tắt trên localhost).
- `js/db.js` IndexedDB `all/get/put/del/clear`, `exportAll/importAll`, `activeWorkout`. `?db=<tên>` đổi DB.
- `js/util.js` `h()` escape, `uid`, format ngày/số, `e1rm`, `toast`, `settings` (localStorage).
- `js/stats.js` PR, lần tập trước, series biểu đồ. `js/chart.js` biểu đồ SVG. `js/timer.js` đồng hồ nghỉ.
- `js/picker.js` modal chọn/tạo bài. `js/exercises.js` thư viện bài mặc định.
- `js/views/` home, workout, history, templates, progress, settings — mỗi file export `async render(el, params)`, event delegation trên `el`, luôn escape bằng `h()`.

## Dữ liệu
- exercise `{id, name, muscle, custom?}` · template `{id, name, items:[{exerciseId, sets, reps, rest}]}`
- workout `{id, name, start, end|null, templateId?, note, entries:[{exerciseId, rest, sets:[{w, r, done}]}]}` (`end:null` = đang tập, tối đa 1)
- body `{id, date, weight, waist?}` · thời gian ms, khối lượng kg.
- Đổi schema: tăng `DB_VERSION`, migration trong `onupgradeneeded`, không mất dữ liệu cũ.
