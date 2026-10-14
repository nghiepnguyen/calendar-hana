# P4-C 2.4 — 天恩 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Single reviewer Codex; không có review độc lập thứ hai. Task authority, chưa Golden/implementation.

## Nguyên văn, scan và correction

`entry.json` có 10 source refs với UTF-8 raw SHA-1, Unicode code-point offset/length và quote nguyên trạng. Không sửa raw hoặc lock lịch sử. `lock.json` khóa entry/README, renders, PDF/raw và các artifact đối chiếu.

- 卷五 SHA-1 `1d4000974e3222122e8919fa01102dc3cda352a2`; 06067683.cn PDF 37 là đồ 天恩, 38–40 là định nghĩa/lời bàn. Scan trang 38: **「甲子至戊辰己卯至癸未己酉至癸丑凡一十五日」**. Trang 39–40 xác nhận 己 là can, 「甲至戊天也己至癸地也」 và vị trí trong 六十甲子. Raw viết 巳 thay 己 tại các chỗ can này; ghi conflict resolved bằng scan, không normalize toàn raw. Phiên bản accepted dùng 己卯、己酉, không phải pillar sai 巳卯/巳酉.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`; 06067686.cn PDF 94–96. Trang 95 xác nhận 「其日止取一定之干支而不參諸月令」, cùng direct uses và điều kiện đồng hiện; trang 96 tiếp lời bàn 「非專指天恩」 khi nói repair/construction. Không suy presence từ tháng, mùa, lunar day hoặc label tốt.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`; 06067687.cn PDF 16–17 頒詔/覃恩肆赦, 19–20 施恩惠恤孤惸/宣政事/布政事/行惠愛雪寃枉緩刑獄, 21–22 慶賜賞賀/宴會. Giữ raw 㑹 và scan 會 riêng; đây là heading spelling, không alias mới cho god.

Locator dùng PDF page 1-based đã đọc trực tiếp; folio/index Archive chưa ghi nếu chưa kiểm, không đoán. Renders là derived evidence; PDF nguồn giữ bytes.

## Predicate, input và coverage

Input duy nhất **can-chi ngày hợp lệ trong lục thập hoa giáp**; cần cả can lẫn chi hoặc sexagenary index hợp lệ, không chỉ chi. Index zero-based 甲子=0: inclusive ranges **0–4, 15–19, 45–49**.

15 pillar accepted: 甲子、乙丑、丙寅、丁卯、戊辰；己卯、庚辰、辛巳、壬午、癸未；己酉、庚戌、辛亥、壬子、癸丑. Mỗi nhóm đúng 5 ngày, tổng 15 present / 45 absent. Không có group 甲午 và không reset theo ngày âm/tháng. Miền thích hợp là 60 pillar; 720 Month Jian × pillar có thể dùng cho regression chứng minh month independence nhưng không là input bắt buộc.

Coverage ngày kế thừa provider pillar đã audit, không tự mở coverage ngoài provider. Missing pillar/outside coverage → unknown; malformed hoặc can-chi không hợp lệ → error (contract audit, không gắn thành cổ văn). Không cần Month Jian, ngày âm, pha trăng, soil hoặc birthYear.

## Heading và exception

Current catalog chỉ **宴會 → meeting**. Nguồn còn bảy heading riêng ngoài 29 heading: 覃恩肆赦、施恩惠恤孤惸、布政事、行惠愛雪寃枉緩刑獄、慶賜賞賀、頒詔、宣政事. Hai heading cuối giữ compound clause 「又天恩與驛馬天馬建日併者」, không biến 天恩 một mình thành điều kiện đủ. 「與修造吉神併尤宜興作」 là enhancement có co-presence, không thêm direct repair/warehouse scope.

Không tìm thấy exception loại presence khỏi 15 ngày. Các heading 忌 vẫn xử lý riêng; không lấy 忌 hoặc lack co-presence để biến 天恩 absent. Không gộp 天恩 với 天赦/德合赦願 hoặc suy đại cát toàn ngày từ tên.

## Đối chiếu và tiến độ

`xieji-god-definitions.json`, `good-gods.json`, `stars.data.ts` không có entry/label 天恩 để tái dùng. `xiejibianfangshu-yiji.json` và inventory task 1 chỉ có 天恩 trong 宜 宴會, khớp source. Không nhận alias mới, không mượn rule trùng tên ngoài scope calendar đang khóa.

Task 2.4 xong, **3/11 authority**; 2.0/P4-C chưa nghiệm thu. Next 2.5 天巫. Giữ Golden, evaluator/runtime/manifest/scoring và P5/S1 hiện hành.
