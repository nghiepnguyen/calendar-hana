# P4-C 2.10 — 天馬 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Reviewer: Codex (single agent), không tự nhận review độc lập thứ hai. Chưa Golden/implementation.

## Nguyên văn, locator và scan

`entry.json` giữ 7 raw refs nguyên trạng, Unicode code-point offset/length và UTF-8 SHA-1; 9 scan pages được đọc trực tiếp trong task 2.10. `lock.json` khóa entry/README/renders, raw/PDF, prior authority locks và artifacts đối chiếu. Không refresh nguồn/lock cũ.

- 卷六 SHA-1 `a9ab67896fc9098e6842036979e84fde4f8aae19`, 06067684.cn PDF **103–104**: chart 天馬 và **「李鼎祚曰天馬者正月起午順行六陽辰」**. Lời bàn **「天馬則四十月在子」** xác nhận tháng 4/10 cùng 子. Full definition giữ old quotation 拜公卿/擇賢良/宣布政事/逺行出征; direct usage phải đọc cùng editor 卷十.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, 06067686.cn PDF **108–111, 117**: editor 「驛馬天馬皆第取行遠之義」 bác old broader court/出征 usage. Named 天馬 entry bắt đầu trang 109, tiếp trang 110: **「宜行幸遣使般移」**, 「與天恩併宜頒詔宣政事與月恩四相時德併宜詔命公卿招賢」, 「義見驛馬」. Không lấy trang 109 riêng làm full entry. Trang 111 ghi 吉期/tháng 10, trang 117 ghi 天喜/tháng 5 đồng hiện với 天馬 để 詔命公卿招賢; notes phân biệt 驛馬 không đồng hiện được với hai thần đó.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, 06067687.cn PDF **23, 30**: 行幸遣使（出行同）/般移（移徙同）đều có 天馬 trong 宜. Full raw heading gồm cả 忌, không bỏ protection hoặc tự gỡ 忌.

PDF page 1-based verified; printed folio/Archive image alignment chưa ghi thì giữ null, không suy từ số PDF. Bốn renders cũ (108/109/23/30) được copy từ locked 驛馬 rồi đọc lại; năm renders mới từ PDF gốc. Excerpt scan có punctuation/ellipsis riêng, không thay nguyên văn raw. Không phát hiện raw/scan discrepancy làm đổi predicate/direct scope.

## Predicate, input, coverage

Từ 寅建: **午、申、戌、子、寅、辰、午、申、戌、子、寅、辰**. Đây là tiến qua sáu chi dương, mỗi tháng +2 vị trí chi; không +1, không 逆行四孟 của 驛馬.

| Month Jian | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chi ngày 天馬 | 寅 | 辰 | 午 | 申 | 戌 | 子 | 寅 | 辰 | 午 | 申 | 戌 | 子 |

Presence khi chi pillar ngày == target trong bảng. Input: **exact-Jie Month Jian + chi pillar ngày hợp lệ**. Không can ngày, tháng/ngày âm, moon phase, soil, năm sinh/personal pillar. Miền cấu trúc 12×60 = 720 context; calendar coverage kế thừa validated providers, không tự tạo dated restriction. Missing/outside coverage → unknown; malformed → error theo audit contract. Không tìm thấy ngoại lệ loại presence; conditional heading/忌 không biến present thành absent.

## Heading, aliases và đối chiếu

Direct catalog scope chỉ **行幸遣使 → travel**, **般移 → moving**. 出行同/移徙同 là heading annotations, không alias thần. Ba court source heading 頒詔/宣政事/詔命公卿招賢 và các điều kiện 吉期 ở 亥建, 天喜 ở 午建 được ghi riêng ngoài current 29-heading catalog; không mở activity hoặc coi 天馬 một mình là đủ. Điều kiện tháng 5/10 là đối chiếu scope, không thay predicate.

`xieji-god-definitions.json`, `good-gods.json` không có entry 天馬 riêng. `stars.data.ts:267` có **Thiên Mã (Lộc Mã)**, byMonth [6,8,10,0,2,4]×2 khớp sequence nhưng dùng tháng âm, khác exact-Jie input. Mô tả giao dịch/cầu tài/kinh doanh và alias Lộc Mã không có authority trong entry này; không adopt hoặc sửa runtime. Không gộp 驛馬/天后 hay import year/day/natal horse-base từ entry khác.

Inventory baseline và `xiejibianfangshu-yiji.json` khớp hai heading trực tiếp. Bảng được chốt từ definition/chart, không lấy legacy resolver/scorer làm Golden.

## Validation và giới hạn

`validation.json` ghi read-only integrity/offset/table/catalog/preservation checks và lệnh tái tạo. Task-2.1 verifier + offset self-test qua; mọi prior authority lock được kiểm đệ quy; raw/PDF, baseline và comparison artifacts giữ SHA-256. Entry source slices, 12 chart targets/60 valid pillars, heading mapping và conditional refs được kiểm. Đây là consistency check authority, **không Golden độc lập**. `git diff --check` qua.

Task 2.10 xong, **9/11 authority**; parent 2.0/P4-C chưa nghiệm thu, tiếp theo 2.11 吉期. P5/S1 vẫn mở; runtime/manifest/scoring chưa đổi.
