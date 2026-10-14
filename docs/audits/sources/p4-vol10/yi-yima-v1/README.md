# P4-C 2.9 — 驛馬 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Single reviewer Codex; scan definition/use tái dùng evidence đã đọc trực tiếp ở 2.6, không nhận là review độc lập thứ hai. Chưa Golden/implementation.

## Nguyên văn và locator

`entry.json` chứa 4 raw refs với Unicode code-point offset/length và UTF-8 SHA-1, 10 scan-page checks. `lock.json` khóa entry/README/renders, raw/PDF, prior authority locks và các artifacts đối chiếu. Không refresh bytes nguồn cũ.

- 卷六 SHA-1 `a9ab67896fc9098e6842036979e84fde4f8aae19`, scan 06067684.cn PDF 17–22. Trang 17 chart 驛馬/天后; trang 18 **「李鼎祚曰驛馬者正月起申逆行四孟」**. Full quote giữ giải nghĩa 三合 và các alternatives; trang 22 **「又按驛馬有從年支取者有從日支取者其義例皆與月同故不重列」**. Main monthly rule không bị thay thành birthYear hoặc viewed-day branch làm base.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 108–109. **「宜行幸遣使般移」** là direct scope; 「與天恩併宜頒詔宣政事與月恩四相時德併宜詔命公卿招賢」 là conditional. Lời bàn bác old broader court/赴任 uses và xác định 「今以其日止宜行幸遣使般移」. 「又為天后宜求醫療病」 thuộc named scope 天后; không copy sang 驛馬.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 23 行幸遣使（出行同）và 30 般移（移徙同）. Hai heading có 驛馬 trong 宜; raw 忌 giữ nguyên. Raw notes/variants giữ nguyên bytes, scan excerpt không thay raw quote. Không có discrepancy làm thay predicate/direct heading.

PDF pages 1-based đã xác minh. Không đoán folio/Archive alignment chưa ghi; PNG là derived render. Eight definition/use page renders tái dùng từ locked 天后 evidence, hai heading renders được đọc trực tiếp trong task 2.9.

## Predicate, input và coverage

Monthly lookup:

| Month Jian group | Target chi ngày |
|---|---|
| 寅午戌 | 申 |
| 亥卯未 | 巳 |
| 申子辰 | 寅 |
| 巳酉丑 | 亥 |

Sequence từ 寅建: 申、巳、寅、亥 lặp ba lần, tức 逆行四孟. Full lookup 子→寅、丑→亥、寅→申、卯→巳、辰→寅、巳→亥、午→申、未→巳、申→寅、酉→亥、戌→申、亥→巳. Presence bằng chi ngày == target monthly.

Input exact-Jie **Month Jian + chi pillar ngày hợp lệ**. Chi ngày là target cần so, không horse-base. Không tháng/ngày âm, can ngày, phase, soil, birthYear hay personal pillar. Year/day variants được nguồn nhắc nhưng nằm ngoài entry monthly P4-C. Miền cấu trúc 12×60 = 720 context; coverage lịch kế thừa validated providers. Missing/outside coverage → unknown; malformed → error là audit contract.

## Scope, aliases, ngoại lệ và đối chiếu

Hai direct heading: **行幸遣使 → travel**, **般移 → moving**. 出行同/移徙同 là source heading annotations, không alias god. Court headings 頒詔、宣政事、詔命公卿招賢 được lưu ở `conditionalSourceScopes` ngoài current 29-heading catalog; không coi presence 驛馬 một mình là đủ hoặc mở activity mới.

天后 đồng vị theo nguồn nhưng có medical named scope riêng; không nhận alias/merge identity. Không gộp 天馬 (predicate phải review riêng ở 2.10). Không tìm thấy presence exception trong monthly table; heading 忌/co-presence không tự đổi 驛馬 absent, không tự gỡ raw/protected 忌.

`xieji-god-definitions.json`, `good-gods.json` chưa có entry 驛馬 riêng. Legacy `stars.data.ts` dòng 876 có **Dịch Mã**, lunar byMonth [申,巳,寅,亥]×3, khớp sequence nhưng khác input tháng âm với exact-Jie Month Jian. Mô tả legacy “Tốt cho mọi việc” không là scope source. Không nhận label Việt làm token alias, không sửa runtime để đồng bộ trong task authority.

`xiejibianfangshu-yiji.json` và inventory task 1 khớp hai direct heading. Authority 天后 đã khóa có cùng monthly target; đối chiếu chỉ là kiểm consistency, không lấy nó hoặc resolver làm Golden cho 驛馬. Source definition/readings được giữ độc lập ở entry này.

Task 2.9 xong, **8/11 authority**; parent 2.0/P4-C còn mở, next 2.10 天馬. Giữ P5/S1, Golden, runtime/manifest/scoring hiện hành.
