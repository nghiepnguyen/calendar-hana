# P4-C 2.6 — 天后 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Single reviewer Codex; không phải review độc lập thứ hai. Task authority, chưa Golden/implementation.

## Nguyên văn và locator

`entry.json` có 3 raw refs (full definition/editorial + 卷十 use + 卷十一 heading), Unicode code-point offset/length và UTF-8 SHA-1. `lock.json` khóa entry/README/renders cùng raw/PDF và bảng đối chiếu; source/locks cũ giữ nguyên.

- 卷六 SHA-1 `a9ab67896fc9098e6842036979e84fde4f8aae19`, scan 06067684.cn PDF 17–22. Trang 17 đồ **驛馬 / 天后**; trang 18: 「驛馬者正月起申逆行四孟」「總要歴曰天后者月中福神也其日宜求醫療病祈福禮神」「歴例曰天后與驛馬同位」. Trang 19–21 giải thích các 三合 group, cùng 天后之義; trang 22 ghi 「又按驛馬有從年支取者有從日支取者其義例皆與月同故不重列」. Raw/scan cùng xác nhận monthly rule. Giữ variant 夘/卯 và chữ lịch nguyên trạng, không đổi offsets.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 108–109. Named scope **「又為天后宜求醫療病」** tách khỏi 驛馬 宜行幸遣使般移 và các co-presence clauses. 「天后見義例」 dẫn định nghĩa trên. Không chuyển travel/moving/court heading sang 天后 chỉ vì đồng vị.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 33–34. 求醫療病 宜 có 天后 (chữ 天 cuối trang 33, 后 đầu trang 34), cùng 天醫/除神 và các gods khác. Literal 忌 của medical vẫn lưu trong source ref; 天后 present không tự gỡ raw/protected 忌, missing phase/day/soil vẫn theo authority riêng hiện hành khi ghép sau.

Locator PDF page 1-based đã đọc trực tiếp; unrecorded folio/Archive image alignment không đoán. Derived PNG không thay PDF nguồn. Không có discrepancy làm thay predicate hay heading đã nhận.

## Predicate/input/coverage

Monthly target chi:

| Month Jian group | Chi ngày 天后 |
|---|---|
| 寅午戌 | 申 |
| 亥卯未 | 巳 |
| 申子辰 | 寅 |
| 巳酉丑 | 亥 |

Theo tháng tuần tự 寅→申、卯→巳、辰→寅、巳→亥, lặp qua 12 chi. Bảng đầy đủ 子→寅、丑→亥、寅→申、卯→巳、辰→寅、巳→亥、午→申、未→巳、申→寅、酉→亥、戌→申、亥→巳 khớp đồ trang 17 và phép nghịch 四孟. Presence bằng so chi ngày với lookup Month Jian.

Input: **exact-Jie Month Jian + chi ngày từ pillar hợp lệ**. Miền cấu trúc 12 × 60 = 720 context. Coverage lịch kế thừa provider input đã kiểm, không tự mở coverage. Missing/outside coverage → unknown; malformed → error là contract audit. Can ngày, tháng âm, ngày âm, phase, soil, birthYear/personal pillar không là required input.

Nguồn có variants horse từ năm/chi ngày; không thay input tháng bằng năm sinh hay chính chi ngày trong entry monthly này. Không mượn natal/personal 驛馬 làm authority P4-C.

## Scope, alias, exceptions và đối chiếu

Direct heading duy nhất **求醫療病 → medical**. Definition quotation 祈福禮神 giữ làm evidence, nhưng 卷十/十一 adopted use scope không mở 祈福/祭祀 từ quotation cũ. Không alias mới. Source nói 天后/驛馬 đồng vị, thậm chí gọi cùng tên trong phần giải nghĩa; P4-C giữ hai operand names và scopes riêng theo 「又為天后」. Sự đồng vị không chứng minh mọi 宜 của hai tên hoán đổi được. Task 2.9 vẫn cần authority 驛馬 riêng.

Không tìm thấy presence exception trong monthly table. Heading 忌/co-presence không là lý do đổi 天后 absent. Không áp scope deity hoặc nhãn sao trùng tên ngoài monthly almanac.

`xieji-god-definitions.json`, `good-gods.json`, `stars.data.ts` không có entry/label 天后/Thiên Hậu để tái dùng. `xiejibianfangshu-yiji.json` và inventory task 1 chỉ có 天后 ở 求醫療病, khớp source. Các source/bảng/evaluator/runtime giữ bytes.

Task 2.6 xong, **5/11 authority**; parent 2.0/P4-C còn mở, next 2.7 天醫. P5/S1 không đổi; chưa Golden/implementation/scoring activation.
