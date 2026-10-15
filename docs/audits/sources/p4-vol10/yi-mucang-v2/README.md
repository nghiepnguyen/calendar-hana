# P4-C 2.2 — 母倉 authority adopted

2026-10-14. Owner trả lời **“làm theo đề xuất”** cho đề xuất tại [evidence v1](../yi-mucang-v1/README.md). Entry `p4-yi-mucang-v2` được chốt với status **OWNER_ADOPTED_SOURCE_DEPENDENT**, audit-only, scoringReady false. Đây là authority riêng cho 母倉; không đổi scope authority soil P4-B.

Convention: Asia/Ho_Chi_Minh, 18 ngày dân sự trước 四立, gồm onset / trừ 四立; coverage 2025-01-01…2027-12-31. Khi soil present dùng 巳午 **thay** bảng mùa; absent dùng xuân 亥子 / hạ 寅卯 / thu 辰戌丑未 / đông 申酉. Mùa từ Month Jian, ngày dùng chi. Missing input hoặc ngoài coverage → unknown; malformed → error. Input soil phải có provenance authority riêng; không lấy label legacy làm presence.

Áp dụng bốn direct heading 納財、栽種、牧養、納畜. 修倉庫 vẫn deferred P5; conflict 月恩/月德 giữ nguyên cho P5. 己午 trong lời bàn 卷十 được giữ nguyên; predicate theo định nghĩa dùng chi 巳午 của 卷五. Alias chưa nhận. Canonical S1 onset/後/定氣 vẫn OPEN, không có chứng nhận canonical mới.

## Correction và khóa

v1 `sources[6]` trỏ nhầm anchor 納畜 trong mục lục (offset 774). v2 chọn anchor 納畜 theo sau bởi 宜, đối chiếu scan PDF trang 51 đã review. Đây là correction locator, không sửa source/Golden hoặc predicate theo output runtime. Các nguồn/scan/transcription và khác biệt legacy đã ghi tại v1; v2 kế thừa chúng bằng refs, không ghi đè v1 lock.

`entry.json` ghi quyết định owner, correction, nguyên văn/offset/SHA-1, input/coverage/predicate, heading và giới hạn review. `lock.json` khóa entry/README, v1 evidence và tất cả raw/render input. Review: Codex, một agent; không tự nhận review độc lập thứ hai. Task 2.2 xong; 2.0 và P4-C còn mở vì mới chốt 1/11 authority. Chưa Golden/implementation.
