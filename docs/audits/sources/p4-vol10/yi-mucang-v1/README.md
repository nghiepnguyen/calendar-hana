# P4-C 2.2 — 母倉: evidence reviewed, soil decision open

2026-10-14. Entry `entry.json` lưu nguồn/offset/checksum, predicate đề xuất, input/coverage, heading và conflicts. **Chưa adopted; chưa đánh dấu task 2.2 xong.** Không sửa collection task 2.1, baseline, Golden hoặc runtime. Single reviewer: Codex; không có review độc lập thứ hai.

## Nguyên văn và locator

- 卷五, raw SHA-1 `1d4000974e3222122e8919fa01102dc3cda352a2`, PDF 06067683.cn trang 53–55, folio 二十五 verso / 二十六 recto–verso. Trang 53 là đồ 母倉; trang 54 định nghĩa, trang 55 lời bàn. Đọc trực tiếp scan bằng PDF skill. Definition: 「母倉者五行當王所生者為母倉如遇土王後則以巳午為之」; lịch lệ: 「春亥子夏寅卯秋辰戌丑未冬申酉土王後巳午」; input ngày: 「不用干而用支」. Scan chép 「養育羣畜栽植種蒔」; raw dùng 「飬育羣畜栽植種蒔」, giữ bytes riêng. Toàn đoạn nguyên trạng nằm trong entry.
- 卷十, SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, PDF 06067686.cn trang 97–98, folio 十一 recto–verso. 「宜納財栽種牧養納畜」「與月恩四相開日併宜修倉庫」. Lời bàn phân hạng 亥/子、寅/卯、申/酉; không loại nhánh thứ hai khỏi presence, không tạo điểm. Raw **và scan** lời bàn đều có 「土王後之己午日」: không gọi đây là lỗi transcription raw. Predicate chọn 巳 theo định nghĩa 卷五 ghi hai lần 巳午 và quy định dùng chi, không dùng can; giữ variant 己 nguyên trạng để review.
- 卷十一, SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, PDF 06067687.cn: 修倉庫 trang 39–40 (十九 verso / 二十 recto); 納財 trang 42–43 (二十一 recto–verso); 栽種、牧養 trang 50 (二十五 recto), 納畜 trang 51 (二十五 verso). Scan xác nhận cả bốn direct heading và warehouse. Câu warehouse raw/scan ghi 「與月德四相時德開日併者」 khác 月恩 của 卷十: giữ conflict cho P5, không tự chọn.

PNG kèm theo là derived render của PDF đã khóa, không thay source bytes. Archive image alignment chưa kiểm nên index null; locator dùng PDF page 1-based. Folio recto ghi số đọc trên paired verso, không suy từ PDF page. `lock.json` khóa entry, README, renders và hashes input; offset dùng Unicode code point protocol task 2.1.

## Predicate/input/coverage đề xuất

Mùa từ Month Jian (寅卯辰 xuân; 巳午未 hạ; 申酉戌 thu; 亥子丑 đông), chi ngày từ pillar hợp lệ. Khi 土王後 known absent: xuân 亥子, hạ 寅卯, thu 辰戌丑未, đông 申酉. Khi known present: thay bảng mùa bằng 巳午; không cộng hai bảng. 土王後 unknown hoặc thiếu input → unknown; ngoài coverage → unknown; malformed → error (contract audit, không phải câu cổ văn). Can ngày, ngày âm, pha trăng không phải operand định nghĩa này.

Miền cấu trúc 12 Month Jian × 60 pillar, cộng input soil; **720 context đơn thuần không đủ**. Coverage lịch chưa chốt vì chưa adopted soil cho 母倉. Không tự dùng authority P4-B chỉ vì có field `soil`.

Alias: chưa nhận alias. Tên Việt “Mẫu Thương” là label legacy để đối chiếu, không tạo catalog identity hay authority alias. Không mở rộng sang 開市/khai trương từ mô tả label. Bốn heading trực tiếp là 納財、栽種、牧養、納畜; 修倉庫 vẫn P5 co-presence deferred.

## Đối chiếu artifacts hiện có

- `xieji-god-definitions.json`: chưa có entry 母倉; `good-gods.json`: không có catalog match như inventory task 1. Giữ bytes.
- `stars.data.ts` dòng 729: legacy label Mẫu Thương, `byMonth` dùng tháng âm. Ba tháng xuân [子,亥], hạ [寅,卯], đông [申,酉] giống ordinary branch set; thu chỉ [丑,辰], **thiếu 戌、未**, và không có override 土王後. Mô tả “khai trương hoặc cầu tài” không là scope 協紀. Không sửa runtime bảng này trong task authority.
- `xiejibianfangshu-yiji.json` và inventory task 1 khớp năm heading nói trên; warehouse không phải flat ANY. Artifact day composition v2 giữ 母倉 unknown đến implementation được duyệt/Golden khóa.

## Quyết định cần owner trước khi chốt 2.2

S1 chưa chứng minh canonical onset/後/定氣. `p4-soil-owner-convention-v1` được duyệt ngày 2026-10-13 cho **P4_B_AUDIT_ONLY**, sáu heading; 母倉 là một presence predicate mới, ngoài scope đó. PROJECT_CONTEXT.md §5/§6 yêu cầu owner quyết khi nguồn chưa đủ và không tự chọn source conflict.

Đề xuất cụ thể: tạo authority riêng cho 母倉 với status **OWNER_ADOPTED_SOURCE_DEPENDENT**, dùng cùng convention Asia/Ho_Chi_Minh, 18 ngày dân sự trước 四立, gồm onset / trừ 四立, coverage 2025–2027; soil present thay ordinary set bằng 巳午. Chỉ áp cho presence 母倉 audit P4-C và bốn direct heading; 修倉庫 vẫn deferred P5. Không nâng S1 thành canonical, không đổi authority P4-B/runtime. Đây là đề xuất **chưa được owner duyệt**; alternative là giữ entry SOURCE_DEPENDENT/unknown cho tới khi có canonical witness. Sau owner quyết, tạo version mới kèm decision/lock, không refresh evidence lock này.
