# Gym Log — hướng dẫn chung cho Codex + Claude Code

PWA cá nhân ghi buổi tập gym. 1 người dùng, dữ liệu IndexedDB trên điện thoại, UI tiếng Việt. Vanilla JS ES modules: không framework, không npm, không build.

## Hai agent, người dùng điều phối
- **Codex = giao diện**: `css/`, `index.html`, `assets/`, `icons/`, `manifest.webmanifest`, markup HTML trong `js/views/*`.
- **Claude Code = logic**: các file còn lại trong `js/`, `sw.js`, `smoke.html`, xử lý sự kiện/dữ liệu trong `js/views/*`.
- Thay đổi không phải của bạn là của agent kia: không hoàn tác/viết lại. Cần bên kia làm gì → 1 dòng vào "Việc chờ" trong `NOTES.md`.
- `js/views/*` là vùng chung: thấy `git status` có thay đổi chưa commit không phải của bạn → dừng, báo người dùng.
- Markup phải giữ nguyên `data-*` (act, f, ei, si, id, i, tab, m, del, k) và class `.set .check .rest-bar .modal .pick-list` — logic dựa vào chúng.

## Tiết kiệm token (bắt buộc)
- Bắt đầu: `git log --oneline -5` + `git diff HEAD~1 --stat`. Không đọc lại cả repo; mở đúng file, ưu tiên grep/đoạn dòng.
- Kiểm tra bằng **smoke test**, không chụp màn hình hàng loạt: `powershell -File serve.ps1`, mở `http://localhost:8080/smoke.html`, đọc dòng `SMOKE: PASS/FAIL` (dùng DB riêng, không đụng dữ liệu thật). Chỉ chụp 1 ảnh khi cần xem thẩm mỹ.
- Không tạo lại ảnh đã có. Ảnh ≤ 200KB.
- Trả lời người dùng ngắn; quyết định ghi 1 dòng vào `NOTES.md`.
- Thêm luồng mới quan trọng → Claude bổ sung bước vào `smoke.html`.

## Kết thúc mỗi việc
1. Smoke PASS. 2. Sửa file tĩnh → tăng `VERSION` trong `sw.js` (file mới → thêm vào `FILES`). 3. Commit nhỏ, tiền tố `ui:` (Codex) / `logic:` (Claude).

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
