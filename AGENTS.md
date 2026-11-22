# Gym app — agent guide (Codex + Claude Code dùng chung file này)

App PWA cá nhân để ghi buổi tập gym. Một người dùng, dữ liệu chỉ nằm trên điện thoại (IndexedDB). UI tiếng Việt.

## Nguyên tắc tiết kiệm token
- KHÔNG đọc toàn bộ repo. Dùng bản đồ file dưới đây, chỉ mở file liên quan.
- Mỗi màn hình là một file trong `js/views/`. Sửa tính năng nào thì chỉ mở view đó + `js/db.js`/`js/util.js` nếu cần.
- Không thêm framework, bundler, npm. Vanilla JS ES modules, không có bước build.
- Thay đổi nhỏ, tập trung; không refactor ngoài phạm vi yêu cầu.
- Ghi quyết định/ý tưởng mới vào `NOTES.md` (ngắn gọn) thay vì giải thích dài trong chat.

## Phân công (bắt buộc — không giẫm chân nhau)
| | Codex (giao diện) | Claude Code (logic) |
|---|---|---|
| Sở hữu | `css/app.css`, `index.html`, `assets/`, `icons/`, `manifest.webmanifest`, phần **markup HTML** trong `js/views/*.js` | `js/db.js`, `stats.js`, `timer.js`, `picker.js`(logic), `chart.js`, `util.js`, `exercises.js`, `app.js`, `sw.js`, phần **xử lý sự kiện/dữ liệu** trong `js/views/*.js` |
| Được làm | màu, bố cục, icon, ảnh, chữ hiển thị, khả năng truy cập | tính năng mới, sửa lỗi, schema/migration, thống kê, offline |

- Không sửa file của bên kia. Cần thay đổi ở phía bên kia → ghi yêu cầu vào mục "Việc chờ" trong `NOTES.md`, người dùng sẽ chuyển.
- File view là vùng chung: **chỉ một agent sửa tại một thời điểm**. Trước khi sửa, chạy `git status`; nếu có thay đổi chưa commit của bên kia thì dừng và báo người dùng.
- Codex đổi markup phải **giữ nguyên** các thuộc tính `data-act`, `data-f`, `data-ei`, `data-si`, `data-id`, `data-i`, `data-tab`, `data-m`, `data-del`, `data-k` và class `.set`, `.check`, `.rest-bar`, `.modal`, `.pick-list` — logic dựa vào chúng.
- Claude thêm markup mới thì dùng class có sẵn trong `app.css`; cần style mới → ghi vào "Việc chờ" cho Codex.

## Quy trình mỗi lần làm (tiết kiệm token)
1. `git status` + `git log --oneline -5` để biết bên kia vừa làm gì; xem `git diff HEAD~1 --stat` thay vì đọc lại file.
2. Làm việc trong phạm vi của mình.
3. Kiểm tra: chạy `serve.ps1`, ở màn hình ~375px: bắt đầu buổi tập → thêm bài → nhập kg/rep → ✓ (đồng hồ nghỉ hiện) → Kết thúc → mở Tiến độ. Không có lỗi console.
4. Sửa file tĩnh → tăng `VERSION` trong `sw.js` (file mới thì thêm vào `FILES`). Ảnh nén ≤ 200KB.
5. Commit ngay, tiền tố theo agent: `ui: ...` (Codex) hoặc `logic: ...` (Claude). Commit nhỏ, một việc một commit.

## Bản đồ file
- `index.html` — khung app, thanh điều hướng dưới.
- `css/app.css` — toàn bộ style (biến màu ở `:root`, giao diện tối).
- `js/app.js` — router theo hash (`#/workout`, `#/history/<id>`...), đăng ký service worker.
- `js/db.js` — IndexedDB: `all/get/put/del/clear(store)`, `exportAll/importAll`. Stores: `exercises`, `templates`, `workouts`, `body`.
- `js/util.js` — `h` (escape), `uid`, định dạng ngày, `e1rm`, `toast`, `settings`.
- `js/stats.js` — tính PR, lần tập trước, chuỗi dữ liệu cho biểu đồ.
- `js/exercises.js` — thư viện bài tập mặc định (seed lần đầu).
- `js/timer.js` — đồng hồ nghỉ giữa set.
- `js/chart.js` — biểu đồ đường SVG tự viết.
- `js/picker.js` — modal chọn/tạo bài tập (dùng chung cho buổi tập và giáo án).
- `assets/` — ảnh giao diện (vd `workout-hero.jpg`).
- `js/views/home.js | workout.js | history.js | templates.js | progress.js | settings.js`.
- `sw.js` — cache offline. **Mỗi lần sửa file tĩnh, tăng `VERSION` trong `sw.js`** để điện thoại nhận bản mới.

## Mô hình dữ liệu
- exercise `{id, name, muscle, custom?}`
- template `{id, name, items:[{exerciseId, sets, reps, rest}]}`
- workout `{id, name, start, end|null, templateId?, note, entries:[{exerciseId, rest, sets:[{w, r, done}]}]}` — `end:null` = buổi đang tập (tối đa 1).
- body `{id, date, weight, waist?, note?}`
- Thời gian là timestamp ms. Khối lượng là kg.
- Đổi schema: tăng `DB_VERSION` trong `db.js`, viết migration trong `onupgradeneeded`, không làm mất dữ liệu cũ.

## View contract
Mỗi view export `async function render(el, params)`: ghi `el.innerHTML`, gắn event (ưu tiên event delegation trên `el`). Luôn escape text người dùng bằng `h()`.

## Chạy thử
`powershell -File serve.ps1` (máy không có Python/Node) rồi mở http://localhost:8080. Service worker tắt trên localhost để tránh cache khi dev. Không có test tự động; kiểm tra thủ công trên màn hình hẹp (~375px).
