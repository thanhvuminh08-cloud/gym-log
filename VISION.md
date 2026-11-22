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
3. ✅ **Claude** (22/11) — nối dữ liệu thật, chuyển lịch tập/Công pháp khỏi Cài đặt, "Chú giải", nhãn "Chí hướng", smoke đủ luồng, tăng `VERSION`.
4. **Codex** — đã hoàn thiện hình ấn phẩm và tranh Thạch bi. Còn thử trực tiếp trên iPhone (xem Việc chờ trong NOTES.md).

## Để sau (từ phản hồi dùng thật)
- ~~Set sau tự điền theo set trước~~ — đã làm ở bước 3 (chỉ điền ô còn trống của set kế tiếp).
- Ý tưởng "mời bật microcopy ở lần đầu" không còn cần (tu tiên luôn bật).

## Không làm
- Không tiền ảo, không gacha, không vật phẩm mua bán, không bảng xếp hạng.
- Không dùng tên nhân vật, tông môn, pháp bảo, cốt truyện hay hình ảnh của truyện/phim cụ thể nào.
- Không đổi DB, không đổi URL triển khai.

## Hợp đồng chi tiết (Claude bước 1 xong, 22/11) — cho Codex bước 2
**`js/lore.js`** — nguồn tên duy nhất, Codex import thay vì gõ chữ cứng:
- `NAV`: mảng 5 `{key, r, label, route, icon}` theo thứ tự thanh nav. Nav nên dựng `<a href="${route}" data-r="${r}"><svg><use href="#${icon}"/></svg>${label}</a>` (hoặc giữ markup tĩnh trong `index.html` nhưng `href`/`data-r` phải khớp `route`/`r`). `r`: `''`, `workout`, `cong-phap`, `ky`, `tang-thu`. Icon tạm dùng sprite có sẵn (`i-home i-dumbbell i-layers i-calendar i-trend`) — Codex đổi được, nhớ sửa luôn `icon` trong `NAV`.
- `PHAM.gold|silver|bronze` → "Thượng/Trung/Hạ phẩm". `TIER_LABEL` (overload.js) = `PHAM`, đã bỏ emoji. Giao diện đọc phẩm từ `data-tier="gold|silver|bronze"` (giữ nguyên).
- `term(k, n?)`: `start` Bế quan · `rest` Điều tức · `finish` Xuất quan · `streak` Liên kích (`term('streak',4)` → "Liên kích ×4") · `weeks` Đạo tâm (`term('weeks',6)` → "Đạo tâm 6 tuần") · `milestone` Thạch bi · `ledger` Công đức bạ; cũng nhận `gold|silver|bronze`.
- `gloss(k)`: dòng nghĩa thật cho cùng các khoá trên + `gold|silver|bronze` (khoá lạ → `''`). Bật/tắt "Chú giải" là việc Claude bước 3; Codex chỉ cần chỗ đặt dòng nhỏ (vd. `<small class="gloss">`).

**Router (`js/app.js`)** — `ROUTES` (route mới → view) + `ALIASES` (route cũ → hash mới, `location.replace`, không thêm mục lịch sử):
| Hash mới | View tạm gắn | Hash cũ chuyển tới |
|---|---|---|
| `#/` Động phủ | `home` rồi `hero` xếp chồng, mỗi view một khung `div.view-part.view-home` / `.view-hero` | `#/hero` |
| `#/workout` Bế quan | `workout` | — |
| `#/cong-phap[/<id>\|/new]` | `templates` | `#/templates[/…]` |
| `#/ky[/<id>]` Nhật ký | `history` | `#/history[/…]` |
| `#/ky/tuan[/<offset>]` Tuần ký | `report` | `#/report[/…]` |
| `#/ky/cong-duc` Công đức bạ | `progress` tab `medal` | `#/progress/medal` |
| `#/tang-thu[/<tab>[/<exId>]]` | `progress` | `#/progress[/…]` |
| `#/tang-thu/cai-dat` | `settings` | `#/settings` |
| `#/nhap-mon[/…]` | `dao` (giữ nguyên) | — |
- Nav tô mục bằng `data-r`; tạm thời router hiểu cả `data-r` cũ (vd. `history` → `ky`). Template tải: `loading-<r>` (vd. `loading-ky`, `loading-tang-thu`), không có thì dùng `loading-<view>` cũ.
- Link trong view còn trỏ route cũ vẫn chạy (qua chuyển hướng); Codex đổi sang route mới khi sửa markup bước 2. Khung 3 tab Tu luyện ký: dùng link `#/ky`, `#/ky/tuan`, `#/ky/cong-duc` (router đã có), không cần `data-tab`.
- Động phủ xếp chồng là tạm: bước 2 Codex gộp markup Hôm nay + Động phủ (bỏ thẻ `[data-hero-link]` và link "← Hôm nay" của hero), giữ `[data-hero-profile]`, `[data-quests] [data-quest]`, `.cultivation-meridian[data-muscle]`, `dialog.breakthrough-modal`, `[data-act=empty|tpl]` mà smoke dựa vào.
- Còn emoji huy chương ở `js/report.js` (chữ chia sẻ) và markup `progress.js`/`report.js` — Claude đổi chữ chia sẻ ở bước 3, Codex đổi markup ở bước 2.

## Động phủ gọn (22/11, từ phản hồi dùng thật: trang dài ~5 màn, lướt mỏi tay)
Động phủ chỉ trả lời **"hôm nay làm gì, đang ở đâu"** — mục tiêu ≤ ~1,5 màn ở 375 px.
1. Thẻ **Bế quan / Tiếp tục** gộp với lời nhắc lịch hôm nay (`[data-schedule-today]` giữ `data-state`).
2. **Ấn Tu vi** thu thành một dải (cảnh giới · Công lực · thanh tiến độ), bấm → `#/tang-thu/that-mach`.
3. **Nhiệm vụ tuần** gọn 3 dòng (`[data-quests] [data-quest]`).
4. **Một hàng số**: buổi tuần này / mục tiêu · Khí huyết (`[data-readiness-score]`) · Liên kích.
5. Form cân nặng/giới tính (`[data-hero-profile]`) chỉ hiện khi thiếu (như hiện nay).
- **Chuyển đi:** Thất mạch đồ, bảng Luyện thể, Thử thách Bình cảnh → tab **Thất mạch** `#/tang-thu/that-mach` (Claude đã gắn: view `hero` đầy đủ; `#/hero` cũ chuyển tới đây). Bỏ khỏi Động phủ: Giáo án (có ở Công pháp), Tập gần đây (Tu luyện ký), Sức mạnh (Tàng thư › Tổng quan), 7 ngày qua/Mục tiêu (gộp vào hàng số).
- **Hợp đồng:** Động phủ vẫn phải gọi `ceremony(profile)` (export từ `js/views/hero.js`) để nghi lễ Đột phá bật khi mở `#/` — smoke "Động phủ đợt 2" kiểm ở `#/`. Có thể tách phần nhỏ trong hero.js thành hàm export (vd. `tuviStrip`, `questBoard`) để home.js dùng; trang Thất mạch thêm `archiveHeader('that-mach')`. Smoke cần `.lift-card` ở `#/` → đổi bước "Hôm nay: thẻ Sức mạnh" sang `#/tang-thu/overview` khi bỏ thẻ (Codex sửa smoke cùng commit, hoặc ghi Việc chờ cho Claude).

## Dễ dùng (22/11, từ phản hồi: ghép lại thì rối, bạn của người dùng không biết dùng)
**Chẩn đoán:** (1) ~35 thuật ngữ tu tiên phải học, kể cả trên nút/điều hướng; (2) một từ nhiều nghĩa — "Bế quan" (mục, nút, lịch, mục tiêu), "Công pháp" (mục, bộ bài Nhập môn, tên giáo án tự sinh), "Luyện thể" (thang cấp nhóm cơ *và* Chí hướng "tăng cơ"); (3) ~12 hệ tiến độ song song rải ở 3 nơi; (4) luồng chính gãy: mục Bế quan khi chưa có buổi lặng lẽ bật về Động phủ, lần đầu bị ép qua 6 bước Nhập môn trước khi được tập.

**Quyết định (người dùng chọn):** *giữ tên tu tiên, thêm chú* — mỗi tên tu tiên đi kèm chữ thường. Nguồn chữ: `js/lore.js` (`hint(k)` chữ ngắn, `gloss(k)` câu giải nghĩa, `GLOSSARY` toàn bộ, `NAV[i].hint`).

- **A. Chú:** thanh điều hướng hiện `label` + `hint` nhỏ bên dưới (luôn hiện, không theo công tắc Chú giải). Nút hành động chính kèm hint ("Bế quan · Bắt đầu tập"). Tiêu đề mục/tab kèm hint. Công tắc Chú giải chỉ ẩn/hiện câu `gloss` dài. Thêm trang **Từ điển** (Tàng thư › Thư viện hoặc cuối Cài đặt) liệt kê `GLOSSARY`.
- **B. Bốn hệ tiến độ hiện ra ngoài:** Tu vi (gồm Công lực/Linh khí trên cùng một dải), Thất mạch (cấp nhóm cơ), Phẩm (mỗi buổi), Nhiệm vụ tuần. Khí huyết, Căn cơ, Bình cảnh, Hư cảnh/Xác chứng chỉ ở trang Thất mạch. Liên kích là chuỗi duy nhất ở Động phủ; Đạo tâm chỉ trong Công đức bạ.
- **C. Một việc một tên:** "Bế quan" = chỉ hành động bắt đầu tập (lịch → "Lịch tập", mục tiêu → "Mục tiêu tuần" trong Công pháp). "Công pháp" = cả mục Kế hoạch; bộ bài chọn ở Nhập môn gọi là "Bài theo mạch"; giáo án tự sinh đặt tên "Giáo án · …". Chí hướng "Luyện thể" (tăng cơ) đổi nhãn khác (vd. "Luyện cơ") để "Luyện thể" chỉ còn là thang cấp nhóm cơ.
- **D. Mục Bế quan khi chưa có buổi:** không bật về; hiện trang chọn cách bắt đầu — theo lịch hôm nay (nếu có) · từ giáo án · lặp lại buổi gần nhất · buổi trống.
- **E. Lần đầu mở app:** không ép Nhập môn. Vào Động phủ với thẻ "Ghi buổi tập đầu tiên" (nút Bế quan) + thẻ mời Nhập môn (tuỳ chọn, có hint "Thiết lập"). Nhập môn vẫn mở được từ Công pháp.

**Thứ tự:**
1. ✅ **Claude** — `lore.js`: `NAV[].hint`, từ điển 35 khoá (`term/hint/gloss/GLOSSARY`), smoke.
2. **Codex** — A (nav 2 dòng, hint ở nút/tiêu đề, trang Từ điển), B (gom/ẩn theo danh sách trên), C (đổi nhãn trong markup), D (giao diện trang chọn cách bắt đầu với số giả; giữ `[data-act=empty]` cho buổi trống, `button[data-id]` cho giáo án).
3. ✅ **Claude** — D: dữ liệu thật + `#/workout` không bật về; E: bỏ chuyển thẳng Nhập môn lần đầu (sửa smoke bước 1); C: tên giáo án tự sinh, nhãn Chí hướng trong `js/dao.js`; smoke đủ luồng.
   - Làm rồi (22/11): `#/workout` chưa có buổi → trang chọn (lịch hôm nay · giáo án · lặp lại buổi gần nhất có bài · buổi trống); lần đầu ở Động phủ, không ép Nhập môn; giáo án tự sinh "Giáo án · …" (đổi tên bộ cũ khi mở app); Chí hướng tăng cơ = "Luyện cơ".
4. **Người dùng** — đưa bạn thử 3 việc không hướng dẫn: ghi một buổi tập · xem lại buổi hôm trước · tìm xem mình có tiến bộ không. Ghi chỗ bị kẹt vào NOTES "Ý tưởng sau khi dùng thực tế".

## Hồn tu tiên — hình ảnh, chuyển động, âm thanh (23/11, người dùng giao Codex)
**Yêu cầu:** làm *tất cả* hiệu ứng hình ảnh, animation, âm thanh hợp chất tu tiên hơn. Được dùng nội dung do AI tạo tuỳ ý (ảnh, nhạc, âm hiệu ứng), được thay ảnh/âm thanh đã có nếu bản mới tốt hơn.

**Chỗ cần hồn (đã có móc logic):** đánh dấu set xong (`celebrate(el, tier)`, `tap()`), PR (`.check.pr`, `.celebrate[data-celebrate=gold]`), kết thúc buổi + Phẩm, Đột phá cảnh giới (`sfx('dotPha')`), Lôi kiếp/Bình cảnh (`loiKiep`), nhiệm vụ xong (`nhiemVu`), nghi lễ Nhập môn, nhạc Động phủ (`music()`), chuyển trang, đồng hồ nghỉ/Điều tức (`.rest-bar`, cảnh báo ≤10s), trang Bế quan chọn cách bắt đầu, thẻ lần đầu.

**Ràng buộc:**
- Ghi set phải nhanh: hiệu ứng trên đường ghi set ≤ ~600 ms, không chặn chạm/nhập; hiệu ứng dài chỉ ở mốc lớn (đột phá, kết thúc buổi, Nhập môn), có thể chạm để bỏ qua.
- `prefers-reduced-motion` → tắt chuyển động lớn. Âm thanh theo công tắc `sfx`/`music`, rung theo `vibrate` (Cài đặt).
- Ngoại tuyến: mọi tệp mới thêm vào `FILES` trong `sw.js`, tăng `VERSION`. Ảnh ≤ 200 KB (ưu tiên SVG/WebP), mỗi âm hiệu ứng ≤ ~60 KB, nhạc nền ≤ ~600 KB.
- Nội dung AI: ghi công cụ/nguồn 1 dòng trong NOTES "Giao diện". Không dùng nhạc/ảnh/nhân vật của phim, truyện, game có thật.
- Giữ `data-*` và class mà logic dựa vào (AGENTS.md). Âm mới: thêm tên vào `SRC` trong `js/sfx.js` (việc một dòng, tự làm). Cần chỗ gọi `sfx()`/sự kiện mới trong logic → 1 dòng "Việc chờ cho Claude", Claude gắn + thêm smoke.

**Thứ tự:** 1. **Codex** — tự lập danh sách hiệu ứng theo mức ưu tiên ghi vào đây, làm, smoke PASS, commit `ui:`. 2. **Claude** — gắn các điểm gọi mới, smoke.

### Danh sách hiệu ứng theo mức ưu tiên
1. **P0 · Trong lúc tập:** set xong có nét mực ngắn, PR hiện ấn kim/ngọc/đồng theo phẩm. Điều tức dùng vòng linh khí và viền cảnh báo rõ ở 10 giây cuối. Chuẩn bị âm chạm hoàn thành, âm PR và âm hết giờ để nối vào các móc hiện có.
2. **P1 · Mốc lớn:** Đột phá dùng vòng ấn và ánh ngọc, Lôi kiếp có mây tối và ba nhịp sét, Thối thể màu đồng, Xác chứng hiện dấu khắc. Nghi lễ Nhập môn đánh thức bảy mạch rồi đóng ấn. Xuất quan/Phẩm và nhiệm vụ tuần có phản hồi riêng. Các nghi lễ có nút bỏ qua hoặc đóng.
3. **P2 · Không khí và điều hướng:** thay ảnh tạ công nghiệp bằng hiên luyện công, dùng chung tranh núi và mây sẵn có. Động phủ, thẻ đầu tiên và màn chọn cách Bế quan cùng bảng màu mực, ngọc, giấy và đồng. Chuyển trang nhẹ. Thay nhạc Động phủ và các âm nghi lễ bằng bản tổng hợp gốc có tiết tấu riêng.
4. **P3 · Kiểm tra:** thử ở chiều rộng điện thoại, chế độ giảm chuyển động, công tắc âm/rung và ngoại tuyến. Đo dung lượng tệp, chạy smoke và ghi điểm gọi âm còn chờ Claude.

Ảnh hiên trong `assets/training-pavilion.webp` dùng ImageGen tích hợp với prompt:

> Use case: illustration-story. Asset type: wide landscape background for Vietnamese cultivation workout PWA, text added separately over left side. Paint an original quiet mountainside training pavilion at blue hour in an elegant ink-wash and carefully textured digital gouache style, atmospheric and believable, with distant karst mountains and bands of mist. Place a warm bronze lantern and stone training terrace under a curved timber roof at the right-center; an understated circular design engraved in the paving, a few mossy jade stones and a pine branch. Keep the entire left third very dark blue-green with quiet low-contrast mist and no prominent objects for light text. Main subject must remain visible in center-right crop on mobile. Ink blacks, muted teal-jade, a few restrained warm copper highlights, no saturated cyan. 3:2 wide composition. No person, no gym equipment, no lettering, no runes, no logo, no watermark, no existing franchise.

## Đánh giá người mới (23/11) — chờ người dùng duyệt
**Cách làm:** Claude đóng vai người rành tu tiên + tập lâu năm (nam 75 kg, Squat 100×5, Bench 80×8), mở app lần đầu ở DB trống, màn 375 px, không đọc hướng dẫn. Làm 3 việc, rồi đi hết 5 mục và Nhập môn.

**3 việc:** ghi buổi ✓ dễ (2 chạm tới ô set, đồng hồ nghỉ tự chạy) · xem buổi trước ✓ dễ (Tu luyện ký › Nhật ký) · tìm tiến bộ ⚠ có số nhưng tự mâu thuẫn, và phần tu tiên không phản ánh gì.

### Phát hiện (nặng → nhẹ)
1. **Tầng tu tiên "chết" khi chưa Nhập môn — lỗi xương sống.** Squat 100×5 xong: vẫn *Phàm nhân*, Thất mạch ghi Chân "Bế mạch · Chưa có kỷ lục · còn thiếu 2 bài". Lại còn Nhập môn là "tuỳ chọn". Tu vi có chú "Cấp sức mạnh" nhưng thực tế đo *độ phủ* (đủ 7 mạch × 2 bài) → người khoẻ mà tập ít bài mãi là Phàm nhân. Người mê tu tiên thấy bị xử ép, còn người tập thì thấy vô nghĩa.
2. **Tập xong không biết mình được gì.** Trang tổng kết không nhắc Linh khí, Công lực, nhiệm vụ hay mạch. Phải quay về Động phủ mới thấy Công lực lên cấp 2, mà cũng không ai giải thích vì sao. Vòng "tập → thấy tiến → biết buổi sau" bị đứt.
3. **Nhập cùng một thứ ở nhiều nơi.** Cân nặng: 4 nơi (form Động phủ, form Thất mạch, Thân trọng, Nhập môn). Giới tính: 4 nơi (Động phủ, Thất mạch, Cài đặt, Nhập môn). Trắc linh căn bắt gõ lại tạ dù lịch sử đã có Squat/Bench.
4. **Số trùng:** nhiệm vụ "Tập đủ 3 buổi" = ô "Buổi tuần này 1/3" ngay bên dưới. Tổng ~1RM hiện 2 lần trong Tổng quan. Linh khí có 2 cách ghi ("130 Linh khí" và "30 / 283 tới cấp 3"). Thạch bi (mốc tạ) gần trùng với kỷ lục bài.
5. **Chức năng thừa hoặc chết:**
   - Mục tiêu tháng được lưu nhưng không dùng ở đâu (`monthGoal`).
   - Lịch tập khi chưa có giáo án hiện 7 dòng "Nghỉ · chọn giáo án" mà không có gì để chọn.
   - Khí huyết 55/100 và Căn cơ 100% không dẫn tới hành động nào.
   - Có 3 thứ cùng là "chuỗi": Liên kích, Đạo tâm, và streak trong nhiệm vụ.
   - Hư cảnh/Xác chứng/Bình cảnh: người mới không gặp, nhưng vẫn đang chiếm chữ.
6. **Đòi việc khi chưa đủ điều kiện:** nhiệm vụ "Khai mạch Lưng · Luyện Deadlift" chỉ định bài khi người dùng chưa chọn gì. Nhắc sao lưu ngay sau buổi đầu tiên. Phẩm ở buổi đầu hiện "—".
7. **Chữ gây hiểu sai:**
   - Tổng quan ghi "Ngực 0 ngày" dù đã Bench, vì lưới chỉ tô theo nhóm cơ chính của ngày.
   - "Tập Squat, Bench Press hoặc Deadlift để xem biểu đồ" trong khi đã tập 2 bài (cần ≥2 buổi).
   - "set tốt nhất (kg×rep) 500" hiện tích số thay vì 100×5.
   - Trang Bế quan ghi "Buổi tập 23/11/2026 · Thứ 2, 23/11/2026" (ngày lặp lại).
   - Thẻ lần đầu nói một ý 3 lần ("Ghi buổi tập đầu tiên / Bắt đầu buổi tập / Bế quan · Bắt đầu tập").

**Bản đồ:** đang có ~16 hệ số (Tu vi, Công lực, Linh khí, Căn cơ, Khí huyết, Luyện thể/mạch, Bình cảnh, Lôi kiếp, Hư cảnh, Xác chứng, Phẩm, Liên kích, Đạo tâm, Thạch bi, Nhiệm vụ tuần, Tổng SBD). Chỉ Linh khí/Công lực, Phẩm, Thạch bi và số buổi tuần chạy được mà không cần Nhập môn + cân nặng. Chỉ có Nhiệm vụ tuần là chỉ cho người dùng *việc cần làm*.

### Đề xuất tối ưu (một vòng lặp: Tập → Xuất quan thấy mình tiến → biết buổi sau tập gì; hệ nào không góp vào vòng này thì gộp hoặc giấu)
- **O1 (Claude, lớn):** tu tiên chạy không cần Nhập môn. Mạch tự khai từ bài đã tập. Tu vi tính theo các mạch đã khai và ghi rõ "x/7 mạch". Cân nặng + giới tính hỏi **một lần** ngay trên trang tổng kết buổi đầu. Nhập môn chỉ còn là "tạo kế hoạch tập"; Trắc linh căn điền sẵn từ lịch sử hoặc bỏ qua được.
- **O2 (Claude dữ liệu → Codex giao diện):** trang tổng kết = khoảnh khắc chính: Phẩm, +Linh khí, Công lực, mạch nào tiến, nhiệm vụ xong, Đột phá. Cuối trang là "Buổi sau: …" (theo lịch, giáo án hoặc mạch lâu chưa tập).
- **O3:** một nơi cho thân thể: Thân trọng (Tàng thư) + lời hỏi một lần; giới tính ở Cài đặt. Bỏ form khỏi Động phủ và Thất mạch.
- **O4 (gộp/bỏ):**
  - Bỏ Mục tiêu tháng.
  - Bỏ nhiệm vụ "đủ buổi tuần" (đã có ô Buổi tuần).
  - Gộp Khí huyết + Căn cơ thành một "Trạng thái", chỉ ở Thất mạch.
  - Thạch bi chỉ ở Công đức bạ.
  - Hư cảnh/Xác chứng chỉ hiện khi xảy ra.
  - Nhiệm vụ chỉ nhắc bài người dùng đã tập hoặc đã chọn.
- **O5 (sửa nhỏ):** các chữ ở mục 7; Lịch tập khi chưa có giáo án → 1 dòng "Tạo giáo án hoặc Nhập môn để đặt lịch"; nhắc sao lưu sau ≥3 buổi.

**Thứ tự đề xuất:** O5 + bỏ gọn ở O4 (nhanh) → O1 → O2 → O3.
- ✅ 23/11 người dùng chốt: Tu vi = trung bình trọng số các mạch đã khai (p > 0), `tuvi.opened/of`; Thất mạch ghi "Theo x/7 mạch đã khai". Mạch vẫn cần đủ 2 bài (giữ). Còn lại của O1: hỏi cân nặng một lần (thiếu cân nặng thì mạch tạ chưa tính được) — gộp với O2/O3.
- ✅ 23/11 O5 + phần bỏ gọn của O4 xong (Claude). Còn: gộp Khí huyết + Căn cơ (Codex, Việc chờ); O1 phần hỏi cân nặng → O2 → O3.
