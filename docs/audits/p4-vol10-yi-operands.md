# P4-C — baseline và inventory operand 宜

2026-10-15. **P4-C ĐÃ NGHIỆM THU AUDIT-ONLY** — task 0–7.7 hoàn tất, acceptance gate PRD §8 8/8; PR #55 merge `9afd39f`, CI main 38771420451 và deploy SUCCESS 2026-10-16; bundle production `f29f5aab…` không đổi. Lịch sử task 1 (2026-10-13, baseline `991e87c`) giữ nguyên bên dưới.

Owner chọn 1A: P4-C chỉ nghiệm thu khi 11/11 authority được chốt. Hoàn tất task 1 không đồng nghĩa hoàn tất P4-C.

## Tổng kết P4-C (task 7.4)

| Mục | Giá trị |
|---|---|
| Nhánh / commit | `codex/p4c-yi-operands`; baseline `991e87c`, authority/Golden freeze `c12df53`, code 4.x–5.x `9902fec`, sweep/mutation `18abea6`, CI `c32f441`, validation `8994b24` |
| Authority | `shared/almanac-data/p4-yi-operands-v1.json`: 11/11 (10 SOURCE_REVIEWED, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027) |
| Golden độc lập | `golden-p4-yi-operands-v1.json`, 10.668 records, freeze trước code; 677 path khóa không đổi từ `c12df53` đến HEAD |
| Coverage | 7 thần × 720 context, 3 thần × 60 pillar, 母倉 1.440 conditional + 1.095 dated + 108 exact Jie; trên 1.095 ngày: 0 unknown, 0 missing input |
| Sweep 31.755 dòng | 0 thiếu operand 11 thần, 0 unresolved 凶, 0 conflict, 3.803 dòng đổi đều có lý do Golden; final undetermined 4.040 → 642 (P5 修倉庫 539, scope khác 103) |
| Mutation | P4-C 23/23 assertion-caught, restored; P4-B 28/28 vẫn bắt; CI job 4 shard bắt buộc trước deploy |
| Validation | unit 7.999 PASS / 3 skip opt-in; typecheck main+functions, lint, build app+functions PASS |
| Runtime | Diff `main...HEAD` ngoài test chỉ thêm 8 module `shared/lunar/p4Yi*.ts` + 2 JSON authority/Golden; 0 importer trong `src`/`functions/src`/production module; `manifest.json` không đổi; bundle `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` = baseline |
| Reviewer | Single agent (Codex task 1–4, Claude task 5–7); không independent second review |

Lệnh tái tạo:

```sh
npx vitest run shared/lunar/p4Yi                                   # toàn bộ suite P4-C (~1 phút)
P4C_SWEEP_WRITE=1 npx vitest run shared/lunar/p4YiSweep.test.ts    # tái tạo report trước/sau
python3 scripts/audit-p4-yi-mutations.py                           # gate mutation đầy đủ (~25 phút, chạy riêng)
P4C_BASELINE_VERIFY=1 npx vitest run shared/lunar/p4YiBaseline.test.ts  # trong checkout 991e87c
```

Còn mở / giới hạn:

- 母倉 là convention owner adopt, chỉ 2025–2027; canonical S1 (onset/後/定氣) vẫn OPEN.
- P5 修倉庫 co-presence (月恩/月德) deferred: 539 heading-ngày undetermined.
- 103 heading-ngày undetermined do scope khác (宜 đã biết), ngoài phạm vi P4-C.
- Month Jian theo quy ước calendar-day (CLOSED); 3 ngày Jie lệch noon với 母倉, không đổi state nào.
- Audit-only: không đổi scoring/manifest/UI; full Golden P4, adapter, activation thuộc roadmap 6–10.
- CI job P4-C chưa chạy trên Actions (chưa push).

## Checkpoint và cách tái tạo

- Starting commit: `db382ba05175f061e0b1031de5361b49a2973ced`; tree `ad1de4d9555e811bd89a31e36faeeefcd5eed49b`.
- Nhánh: `codex/p4c-yi-operands`; P4-B merge `1ad9b4b` là ancestor; release evidence `b12f024` được giữ.
- Snapshot, inventory, inputs, summary và lock: [`sources/p4-vol10/yi-baseline-v1/`](sources/p4-vol10/yi-baseline-v1/).
- Runner: `shared/lunar/p4YiBaseline.test.ts`; chỉ chạy opt-in, unit bình thường skip. Runner quan sát lookup hiện hành và không sửa evaluator/runtime.
- Checkout tái tạo: `991e87c` (commit chứa reporter và toàn bộ snapshot; code/data evaluator vẫn là baseline `db382ba`).
- Lệnh verify: `P4C_BASELINE_VERIFY=1 npx vitest run shared/lunar/p4YiBaseline.test.ts`.
- Lệnh tạo lần đầu: `P4C_BASELINE_WRITE=1 npx vitest run shared/lunar/p4YiBaseline.test.ts`. Nếu file đã tồn tại, runner chỉ so bytes và từ chối ghi đè kết quả khác.
- Sau khi predicates thay đổi, verify trong checkout/worktree của commit khóa evidence task 1, không dùng evaluator mới để viết lại baseline. Source guard so code/data ngoài test với starting commit.
- Đây là measurement baseline, **không phải Golden độc lập**. Fixture mansion chỉ cung cấp 1.095 ngày; hashes/hour lịch sử của fixture không được dùng làm oracle cho output P4-C.

## Inventory và mapping heading

`p4-vol10-day-composition-v2.json` có đúng 11 unknown; 王日 ở seasonDays và 修倉庫 deferred P5. Đối chiếu stable ID ở catalog `good-gods.json` và authority `xieji-god-definitions.json`; không coi một catalog ID là presence authority.

| Thần | Catalog ID hiện có | Definition 協紀 hiện có | Heading 宜 (chuẩn evaluator) |
|---|---|---|---|
| 母倉 | Chưa có trong catalog kiểm | Chưa có entry | 修倉庫 (P5)、栽種、牧養、納畜、納財 |
| 福德 | Chưa có trong catalog kiểm | Chưa có entry | 修宮室、宴會 |
| 天恩 | Chưa có trong catalog kiểm | Chưa có entry | 宴會 |
| 天巫 | Chưa có trong catalog kiểm | Chưa có entry | 祈福、祭祀 |
| 天后 | Chưa có trong catalog kiểm | Chưa có entry | 求醫療病 |
| 天醫 | Chưa có trong catalog kiểm | Chưa có entry | 求醫療病 |
| 除神 | tru_than | Chưa có entry | 掃舍宇、整容剃頭、求醫療病 |
| 驛馬 | Chưa có trong catalog kiểm | Chưa có entry | 般移、行幸遣使 |
| 天馬 | Chưa có trong catalog kiểm | Chưa có entry | 般移、行幸遣使 |
| 吉期 | Chưa có trong catalog kiểm | Chưa có entry | 行幸遣使 |
| 鳴吠 | Chưa có trong catalog kiểm | Chưa có entry | 安葬 |

Toàn bộ 29 heading có mapping activity catalog, không có heading ngoài catalog trong inventory này. Alias heading cần giữ: raw `破屋壞垣` → evaluator `破屋壊垣`. Chưa nhận alias mới cho 11 thần; tên/biến thể phải đọc nguồn ở task 2. `除神` có catalog ID `tru_than`, nhưng cả 11 thần đều chưa có entry trong bộ definitions đã kiểm; không tự tái sử dụng runtime rule làm authority P4-C.

Kho clause 修倉庫 có 「又…與…併者」, không phải flat ANY list. Runner chỉ bỏ các marker này để thống kê tên thần, giữ raw 宜 của heading ở `deferred`; không đánh giá câu warehouse hoặc coi 母倉 là điều kiện đủ.

## Input và authority đang dùng

- Date domain: 2025-01-01…2027-12-31, 1.095 ngày; mỗi ngày 29 heading.
- Month Jian: `getAlmanac(date).selectionContext.MONTH_JIAN_BRANCH`, 0..11 theo 子…亥; khác tháng âm.
- Pillar: `getAlmanac(date).dayCanChi.can/chi`, ghép can và chi theo bảng khóa.
- Lunar day: `selectionContext.LUNAR_DAY`, 1..30, calendar project ở Asia/Ho_Chi_Minh.
- Phase: `getP4MoonPhase(date)`, `p4-lunar-phase-authority-v1`, input USNO đã khóa, coverage 2025–2027.
- Soil: `getP4SoilPresence(date)`, `p4-soil-owner-convention-v1`, **OWNER_ADOPTED_SOURCE_DEPENDENT**, cùng coverage; S1 canonical onset/後/定氣 vẫn OPEN.
- Các authority P4-B/ngày âm/end clauses/王日, versions và hashes được ghi trong `inputs.json` / `lock.json`.
- Input từng thần P4-C vẫn UNRESOLVED_TASK_2. Task 2 phải xác minh Month Jian/tháng âm/mùa/can/chi/vị trí chu kỳ/ngày âm/tiết khí nếu nguồn thật sự yêu cầu; danh sách cần điều tra không phải predicate được chốt.

## Số đo baseline

| Metric | Dòng |
|---|---|
| Tổng dòng | 31,755 |
| Có ít nhất một tên unknown trong raw list (gồm warehouse) | 16,425 |
| Raw 宜 unknown do 11 operand, ngoài P5 | 7,115 |
| Raw 宜 true nhờ thần khác, vẫn chứa unknown | 8,215 |
| Warehouse deferred | 1,095 |
| 宜 chưa xác định sau ghép trước propagation | 4,273 |
| Trong đó: raw unknown thuộc 11 thần | 3,718 |
| Trong đó: warehouse | 555 |
| Trong đó: lý do khác | 0 |
| Raw unknown nhưng 宜 bị suppression về false | 3,397 |
| Tổng final heading undetermined | 4,040 |
| Final undetermined trên heading warehouse | 539 |
| Final undetermined có raw 宜 unknown thuộc 11 thần | 3,418 |
| Final undetermined với raw 宜 known | 83 |
| Thiếu operand 凶 | 0 |
| Conflict 天願/遊禍 | 0 |
| Propagation gỡ | 0 |
| Propagation chặn | 179 |

Bucket final undetermined là phân nhóm quan sát rời nhau, **không phải chứng minh một root cause độc nhất**: scope/state ambiguity có thể đồng thời xuất hiện. Trace giữ raw 宜, 宜 sau suppression, pre/final state để điều tra tiếp. `pre_ji` là kết quả ghép P4-B trước propagation, không phải danh sách literal raw 忌 trước exception.

## Số đo từng thần

| Thần | Dòng liệt kê | Raw 宜 unknown | Có present khác che unknown | Warehouse | Final undetermined |
|---|---|---|---|---|---|
| 母倉 | 5,475 | 1,685 | 2,695 | 1,095 | 1,193 |
| 福德 | 2,190 | 896 | 1,294 | 0 | 286 |
| 天恩 | 1,095 | 307 | 788 | 0 | 101 |
| 天巫 | 2,190 | 588 | 1,602 | 0 | 342 |
| 天后 | 1,095 | 425 | 670 | 0 | 176 |
| 天醫 | 1,095 | 425 | 670 | 0 | 176 |
| 除神 | 3,285 | 2,345 | 940 | 0 | 1,536 |
| 驛馬 | 2,190 | 881 | 1,309 | 0 | 316 |
| 天馬 | 2,190 | 881 | 1,309 | 0 | 316 |
| 吉期 | 1,095 | 417 | 678 | 0 | 141 |
| 鳴吠 | 1,095 | 720 | 375 | 0 | 306 |

Các thần có thể cùng nằm trên một heading; các cột theo thần bị overlap, không cộng để suy số dòng duy nhất. `summary.json` có breakdown theo từng heading; TSV giữ tên unknown kể cả khi 宜 đã known.

## Bảo toàn baseline P4-B và runtime

Đối chiếu toàn bộ 31.755 dòng với TSV P4-B hiện hành trên date/heading, pre/final state, final 宜/忌/protected, unresolved và propagation: **khớp tất cả**. TSV/summary P4-B và mọi artifact/Golden/lock cũ giữ bytes, có checksum trong lock mới. Không đổi evaluator để tạo evidence này.

Manifest baseline: `shared/almanac-data/manifest.json`, SHA-256 trong `inputs.json` / lock. Runtime baseline: `index-CeLinrvj.js`, SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`. Build/checks sau thêm reporter được ghi ở validation cuối.

## Tiếp theo

Task 2: đọc và chốt authority cho 11 thần. Không tạo Golden presence mới hoặc implementation trong task 1; không chuyển P5.

Validation task 1: baseline create và verify đều **3/3 test** qua; verify byte-for-byte và lock hash qua; build/main typecheck, functions typecheck, oxlint qua. Runtime bundle sau build trùng baseline. `graphify update .` đã chạy cho reporter mới. Chỉ thêm reporter measurement và evidence; không sửa evaluator, manifest hoặc artifact/Golden lịch sử.

## Task 2.1 — collection và protocol đã khóa

Hoàn tất 2026-10-13, commit `2371a80`. [Source collection](sources/p4-vol10/yi-sources-v1/README.md) có 5 raw (4 tái dùng byte-identical + raw 卷十一 revision 787353 mới), 5 scan PDF đầy đủ, manifest/locator/checksum, candidate index 11 thần / 230 occurrence, mẫu authority entry và protocol Unicode code point zero-based. Tiêu đề volume đã đọc trực tiếp; scan mỗi clause/printed folio chưa review, thuộc task entry. Không dùng OCR làm authority, không chốt predicate hoặc alias từ index.

`python3 scripts/verify-p4-yi-sources.py --self-test` qua: 31 locked files, published PDF checksum/size, revision raw content/hash, mọi occurrence/context quote, template UNREVIEWED và lock baseline task 1. Hai ca offset hợp lệ / sáu ca sai (UTF-16, bounds, length, quote, type) được kiểm; Python compile/Markdown format qua. Raw/Golden/evaluator/runtime cũ không đổi. Tiếp theo **2.2 母倉**; parent task 2/P4-C chưa hoàn tất và chưa có authority mới được nhận.

## Task 2.2 — 母倉 evidence reviewed; chưa chốt soil

2026-10-14: [review và đề xuất quyết định](sources/p4-vol10/yi-mucang-v1/README.md), entry/scan/lock riêng. Đã kiểm nguyên văn 卷五/十/十一, offset/hash, alias, bốn direct heading và warehouse P5; legacy thu thiếu 戌、未 và dùng tháng âm, không có 土王後 override. Scan lời bàn 卷十 cũng ghi 己午; định nghĩa 卷五 dùng chi 巳午. Warehouse 月恩/德 conflict giữ cho P5. Soil adoption P4-B không bao gồm presence 母倉; cần owner quyết convention riêng hoặc chờ canonical witness. Task 2.2/2.0 vẫn mở; chưa chuyển 2.3, chưa triển khai/Golden/scoring.

## Task 2.2 — authority v2 chốt theo owner

2026-10-14: owner duyệt đề xuất bằng “làm theo đề xuất”. [Authority v2](sources/p4-vol10/yi-mucang-v2/README.md) có status OWNER_ADOPTED_SOURCE_DEPENDENT, convention soil riêng cho 母倉 audit-only (18 ngày UTC+7 trước 四立, gồm onset/trừ 四立, coverage 2025–2027), bốn direct heading; warehouse P5 và canonical S1 vẫn mở. Correction locator 納畜: v1 trỏ mục lục, v2 trỏ clause 宜, source/v1 locks giữ bytes. Task 2.2 xong, 1/11 authority; task 2.0/P4-C chưa nghiệm thu. Tiếp theo 2.3 福德, chưa Golden/implementation.

## Task 2.3 — 福德 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-fude-v1/README.md), SOURCE_REVIEWED, 9 raw refs và 14 trang scan được kiểm. Predicate 月建前二辰 = chi ngày cách Month Jian 2 bước thuận, khóa hướng từ ví dụ nguồn; input chỉ Month Jian exact Jie/chi ngày, miền 720 context. Nhận alias 福徳 từ đối chiếu raw/scan. Direct catalog scope 修宮室/宴會; bốn heading nguồn khác giữ ngoài catalog. Không gộp 滿日/天巫/四利三元 收福德; 天狗 申建戌日 không tự làm 福德 absent. Task 2.3 xong, 2/11 authority; 2.0/P4-C còn mở, next 2.4 天恩. Không Golden/implementation/runtime delta.

## Task 2.4 — 天恩 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-tianen-v1/README.md), SOURCE_REVIEWED. 10 raw refs và 13 scan pages; input duy nhất pillar ngày hợp lệ; ranges 甲子–戊辰 / 己卯–癸未 / 己酉–癸丑, index 0–4/15–19/45–49, 15 present/45 absent. Không Month Jian, lunar day hoặc soil. Scan giải discrepancy raw 巳 → can 己, raw/lock cũ giữ bytes. Direct catalog 宴會, bảy source heading ngoài catalog; 頒詔/宣政事 giữ co-presence. Task 2.4 xong, 3/11 authority; 2.0/P4-C còn mở, next 2.5 天巫. Chưa Golden/implementation/runtime delta.

## Task 2.5 — 天巫 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-tianwu-v1/README.md), SOURCE_REVIEWED. 6 raw refs / 11 scan pages; 月建前二辰, input exact-Jie Month Jian và chi pillar, miền 720 context. Direct 祭祀/祈福; 卷十 bỏ old medical use, không gộp 福德/滿日/天狗. 天狗 được editor giới hạn 申建戌日 và ritual 忌 giữ riêng, không tự loại 天巫 presence. Task 2.5 xong, 4/11 authority; parent 2.0/P4-C chưa nghiệm thu, next 2.6 天后. Chưa Golden/implementation/runtime delta.

## Task 2.6 — 天后 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-tianhou-v1/README.md), SOURCE_REVIEWED. 3 full raw refs / 10 scan pages; 月中天后與驛馬同位, 正月起申逆行四孟 + monthly chart khóa target chi theo Month Jian, input exact-Jie Month Jian/chi pillar, miền 720 context. Direct 求醫療病; giữ operand/scope riêng 驛馬, không alias hay year/day/natal input; definition 祈福禮神 không mở current heading. Task 2.6 xong, 5/11 authority; parent 2.0/P4-C còn mở, next 2.7 天醫. Chưa Golden/implementation/runtime delta.

## Task 2.7 — 天醫 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-tianyi-v1/README.md), SOURCE_REVIEWED. 4 raw refs / 8 scan pages; 正月起戌順行十二辰 và ví dụ 寅→戌 khóa offset +8 từ Month Jian, input exact-Jie Month Jian/chi pillar, miền 720 context. Direct 求醫療病; không gộp 成日/天喜, không dùng seasonal 天喜 table hay mở ritual heading từ definition quotation. Raw 乂為/scan 又為 ghi riêng, không đổi raw bytes. Task 2.7 xong, 6/11 authority; parent 2.0/P4-C còn mở, next 2.8 除神. Chưa Golden/implementation/runtime delta.

## Task 2.8 — 除神 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-chushen-v1/README.md), SOURCE_REVIEWED; 8 raw refs / 9 scan pages. Fixed 申酉 day-branch set, không Month Jian/tháng/ngày âm, miền 60 pillar. Catalog tru_than rule [8,9] khớp source independently reviewed. Direct 掃舍宇/整容剃頭/求醫療病; source 解除/沐浴/整手足甲 ngoài catalog. Không alias 除日/五離/解神, không copy negative 五離 scope. Task 2.8 xong, 7/11 authority; parent 2.0/P4-C còn mở, next 2.9 驛馬. Chưa Golden/implementation/runtime delta.

## Task 2.9 — 驛馬 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-yima-v1/README.md), SOURCE_REVIEWED; 4 raw refs / 10 scan pages (8 definition/use renders tái dùng locked 天后 evidence; 2 direct heading scans). 正月起申逆行四孟, exact-Jie Month Jian/chi pillar, miền 720 context. Direct 行幸遣使/般移, court co-presence riêng; không alias 天后/天馬 hoặc year/day/natal horse input. Legacy Dịch Mã sequence khớp, input tháng âm khác. Task 2.9 xong, 8/11 authority; parent 2.0/P4-C còn mở, next 2.10 天馬. Chưa Golden/implementation/runtime delta.

## Task 2.10 — 天馬 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-tianma-v1/README.md), SOURCE_REVIEWED; 7 raw refs / 9 scan pages đọc trực tiếp. 正月起午順行六陽辰, monthly chart và 四十月在子 xác nhận lookup; exact-Jie Month Jian/chi pillar, 720 context. Direct 行幸遣使/般移; court scopes và 吉期 tháng 10/天喜 tháng 5 co-presence riêng, không tự mở heading. Legacy Thiên Mã (Lộc Mã) sequence khớp nhưng tháng âm/mô tả broader không là authority alias/scope. Không gộp 驛馬/天后. [Validation](sources/p4-vol10/yi-tianma-v1/validation.json): exact offsets/hashes/prior lock preservation/table/catalog qua. Task 2.10 xong, 9/11 authority; parent 2.0/P4-C còn mở, next 2.11 吉期. Chưa Golden/implementation/runtime delta.

## Task 2.11 — 吉期 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-jiqi-v1/README.md), SOURCE_REVIEWED; 10 raw refs / 10 scan pages đọc trực tiếp. 月建前一辰, chart 12 target + 寅→卯 xác nhận +1; exact-Jie Month Jian/chi pillar, 720 context. Direct catalog 行幸遣使; 施恩封拜/舉正直/上官赴任/臨政親民 ngoài catalog, không map career/appointment. 亥建與天馬 đồng hiện cho 詔命公卿招賢; 1/12 intersection 天馬, 0/12 驛馬 khớp source notes. Không alias 除日/兵寶; editor chuyển old military scope sang 兵寶 và bỏ marriage scope. Raw SKchar court heading giữ bytes, scan xác nhận 卿. [Validation](sources/p4-vol10/yi-jiqi-v1/validation.json) offsets/hashes/lock preservation/table/scope qua. Task 2.11 xong, 10/11 authority; parent 2.0/P4-C còn mở, next 2.12 鳴吠. Chưa Golden/implementation/runtime delta.

## Task 2.12 — 鳴吠 authority chốt

2026-10-14: [authority v1](sources/p4-vol10/yi-mingfei-v1/README.md), SOURCE_REVIEWED; 6 full raw refs / 15 scan pages đọc trực tiếp. Corrected 立成/final editor khóa 13/60 day pillars; old14 loại 庚寅/壬寅 và thêm 甲午. Raw 巳 trong derivation giữ bytes; scan 己 và raw/scan 己酉 chart chốt stem correction. Input valid civil-day pillar, không Month Jian. Direct catalog 安葬; 破土 source heading ngoài catalog; 鳴吠對 corrected 11 days/啓攢 giữ riêng, no alias/merge. 復日 chỉ heading interaction, không delete presence hay đổi P4-B. [Validation](sources/p4-vol10/yi-mingfei-v1/validation.json) exact slices/hashes/lock preservation/pillar lists/scope qua. Task 2.12 xong, individual 11/11 authority chốt; parent 2.0/P4-C chưa nghiệm thu, tiếp theo 2.13 rồi 2.14–2.15. Chưa Golden/implementation/runtime delta.

## Task 2.13 — Tổng hợp khác biệt nguồn/bảng

2026-10-14: [comparison v1](sources/p4-vol10/yi-comparison-v1/README.md), REVIEWED_COMPARISON_NOT_AUTHORITY_GATE; [ledger](sources/p4-vol10/yi-comparison-v1/decisions.json) 40 records (31 original conflicts nguyên trạng + 9 đối chiếu), [matrix](sources/p4-vol10/yi-comparison-v1/comparison.tsv) đủ 11 thần. Phân loại 31 SOURCE_DEPENDENT / 4 NAMING_ONLY / 3 CONVENTION_DIFFERENCE / 1 SPEC_BUG locator / 1 match không khác biệt; dispositions tách resolved reading/editor/scope khỏi canonical/P5 unknown. Kiểm 11 entries/74 source slices, recursive locks, definitions/catalog/inventory và 3 legacy monthly tables qua; [validation](sources/p4-vol10/yi-comparison-v1/validation.json). Canonical S1 soil và warehouse 月恩/月德 vẫn mở; 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027 giữ riêng, missing/outside input vẫn unknown. Không có owner decision mới cần trong adopted scope; single Codex consolidation review, không second independent review. Task 2.13 xong, next 2.14 rồi 2.15; parent 2.0/P4-C chưa nghiệm thu, chưa Golden/implementation/runtime delta.

## Task 2.14 — Authority tổng hợp v1

2026-10-14: [authority v1](sources/p4-vol10/yi-authority-v1/README.md), artifact `shared/almanac-data/p4-yi-operands-v1.json`, AUTHORITY_ASSEMBLED_PENDING_2_15_GATE/AUDIT_ONLY. Copy lossless 11 locked entry snapshots, thêm ruleId/provenance; 11 unique IDs/authority IDs/version-qualified rule IDs, 74 source slices/130 evidence hashes và prior locks qua. 10 SOURCE_REVIEWED, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027, S1/P5 residual giữ nguyên; reviewer Codex single agent/independentSecondReview false. JSON formatting/lint/main typecheck/diff check qua, graph cập nhật; no production import/presence implementation/Golden. Task 2.14 xong; tiếp theo 2.15, parent 2.0/P4-C chưa nghiệm thu.

## Task 2.15 — Gate authority PASS 11/11

2026-10-14: [gate v1](sources/p4-vol10/yi-authority-gate-v1/README.md), [per-entry results](sources/p4-vol10/yi-authority-gate-v1/gate.json), PASS 11/11 trong adopted scope. 10 SOURCE_REVIEWED + 母倉 bounded OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027; 74 slices/130 evidence hashes/recursive locks, prerequisites 2.1–2.14 và đầy đủ entry contract qua. Gate hash-bound snapshot 2.14 giữ nguyên; [validation](sources/p4-vol10/yi-authority-gate-v1/validation.json) lưu replay và correction validator assumption về README scan transcription của 母倉, không source change. Reviewer single Codex, no independent second review. **Task 2.15 và parent 2.0 hoàn tất authority-only; toàn bộ P4-C chưa nghiệm thu**. S1 canonical/P5 warehouse vẫn mở ngoài adopted scope; Golden chưa frozen/presence chưa triển khai. Tiếp theo 3.1 Golden matrix, commit freeze trước implementation.

## Task 3.1 — Ma trận lựa chọn fixture

2026-10-14: [matrix v1](sources/p4-vol10/yi-fixture-matrix-v1/README.md), FIXTURE_SELECTION_PLAN_NOT_GOLDEN. Đủ 11 thần × 6 loại = 66 cells: 56 áp dụng và 10 alias positive N/A có lý do; alias duy nhất 福徳→福德. JSON ghi ca present/absent/biên, omit từng required input, outside provider coverage và dated soil riêng, negative normalization, sourceRefs/rule ID để 3.2 suy expected. 7 monthly domains 720/rule; 3 day-only domains 60; 母倉 thêm soil/provenance/biên onset/四立/coverage 2025–2027, không coi 720 đủ. Malformed tách khỏi missing/coverage; irrelevant inputs không thành required.

Validation: 11 unique rows/66 cells/24 valid explicit candidate pillars; snapshot authority/gate hashes, replay prior gate (74 slices/130 evidence hashes/recursive locks), prior shared/source bytes, format/diff check qua. Reviewer single Codex, không second independent review. Đây là kế hoạch ca, không expected hay source/Golden freeze 3.6. Task 3.1 hoàn tất; parent 3.0/P4-C còn mở, next 3.2 expected từ nguồn/phép tính độc lập; S1/P5 vẫn OPEN/deferred, chưa implementation/runtime change.

## Task 3.2 — Expected độc lập từ nguồn

2026-10-14: [expected v1](sources/p4-vol10/yi-expected-v1/README.md), EXPECTED_DERIVED_PENDING_3_3_TO_3_6, 906 presence / 25 identity / 24 malformed fixtures. Mỗi presence fixture ghi required inputs/provenance, expected/authority/rule/sourceRefs và phép tính từ raw/scan. Python reference chỉ standard library, không đọc entry.predicate/production tables hoặc import/call resolver/scorer/evaluator. JPL frozen rows là input thiên văn, JDN/day pillar tính riêng và kiểm với 100 calendar records; 12 HKO Li civil dates khớp UTC+7 JPL. 72 biên soil dân sự / 36 biên mùa exact Jie / 252 biên monthly exact Jie; alias 福徳 có present/absent/unknown, identity khác không tự thành absent.

Replay/compile/AST isolation/645 prior hashes bất biến, lint/main+functions typecheck, JSON/README format và diff check qua; graph update chạy sau Python mới. Hai corrections SPEC_BUG đã ghi: thêm 12 除神 boundary fixtures còn thiếu và sửa sentinel coverage-end 2027-12-31 (甲申/子建/soil absent → 母倉 present), giữ các expected đã suy độc lập. Integrity lock mới không thay commit freeze 3.6. Reviewer single Codex, không independent second review; re-inspect 天恩 PDF38/鳴吠 PDF137, scan khác tái dùng review cũ. **3.2 xong; next 3.3**, full 720/60 và extra soil domains chưa nghiệm thu; ANY/heading 3.4, review 3.5, freeze 3.6/parent 3.0/P4-C mở. S1/P5 giữ nguyên, không runtime/manifest/scoring change.

## Task 3.3 — Full predicate domains và miền 母倉 riêng

2026-10-14: [domain v1](sources/p4-vol10/yi-domains-v1/README.md), DOMAIN_EXPECTED_COMPLETE_PENDING_3_4_TO_3_6. Đủ 7 monthly rules × 720 Month Jian/pillar (60 present/660 absent mỗi rule); 天恩/除神/鳴吠 có 60-pillar domain riêng (15/45, 10/50, 13/47), không required Month Jian. 母倉 tách 1.440 conditional predicate-only tuples (270/1170; không date/validated soil giả), 1.095 dated UTC+7 noon (215/880), 108 exact-Jie cases ba năm (19/89). Tổng 7.863 TSV records; không lấy tổng này làm chứng nhận mọi conditional tuple reachable trong coverage.

Dùng locked Python source-reference 3.2, không production evaluator; từng row có source derivation/authority/rule/status. Exact Cartesian sets/unique keys/pillar parity/source-arithmetic/provenance và overlap với expected 3.2 qua. Missing/coverage/soil onset/Li cases 3.2 giữ nguyên qua refs; 652 prior shared/Golden/source files giữ bytes. Replay/AST/compile/lint/main+functions typecheck/format/diff và graph update qua; integrity lock mới không commit freeze 3.6. Reviewer single Codex, không second independent review; S1 canonical/P5 warehouse còn mở, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT/production unchanged. **3.3 xong; next 3.4**, ANY/trace/heading/protection/override expected; review 3.5/freeze 3.6/parent 3.0/P4-C mở.

## Task 3.4 — Khóa expected phép ghép và bảo toàn

2026-10-14: [composition expected v1](sources/p4-vol10/yi-composition-expected-v1/README.md), COMPOSITION_EXPECTED_LOCKED_PENDING_3_5_3_6, 1.850 fixtures. ANY đủ 40 vectors dài 0–3; 957 scope combinations (11×29×3); 15 normalization/alias; 96 protection/suppress/cancel/override projections; 720 puzhu:28 masks đúng 8 context, 未甲午 áp/未甲子 không áp; 18 warehouse vectors và 4 source-context controls. Known absent/rỗng false, unknown không bị present khác xóa khỏi trace; raw/protected 忌 giữ evidence, override chỉ gỡ effective 忌; 修倉庫 không được generic ANY giải, 母倉 giữ OWNER_ADOPTED_SOURCE_DEPENDENT.

Expected từ PRD/source/adoption và hash-bound independent reference, không composer outputs. Synthetic vectors/projections khai báo rõ, không tuyên bố co-presence hoặc full day verdict; warehouse 四相 là existing-operand stub thực sự trong clause, không authority/date giả. Hai SPEC_BUG đã ghi minh bạch: validator literal 福德 bỏ sót raw 福徳 và draft warehouse candidate 福德 ngoài scope được thay bằng 四相 stub; non-warehouse expected sections giữ nguyên. Source/trace/exact sets/replay/AST/compile/lint/main+functions typecheck/format/diff/graph qua; 660 prior files giữ bytes, integrity lock riêng không thay commit freeze3.6. Reviewer single Codex, không second independent review. **3.4 xong; next3.5 review**; review/freeze/parent3.0/P4-C mở, S1/P5 giữ nguyên, chưa runtime/manifest/scoring change.

## Task 3.5 — Review independence/input/coverage

2026-10-14: [review v1](sources/p4-vol10/yi-golden-review-v1/README.md), PASS_SINGLE_REVIEWER_WITH_RECORDED_LIMITS, 10.668 records ở các miền (không unique dates hoặc product tests). Dependency/data-flow/source-basis review và replay validators3.1–3.4 qua; valid affirmative pillars/dated JDN/UTC+7/Jie/soil, deliberate malformed, exact seven720/three60/母倉 domains và ANY/trace/protection/override/P5 được kiểm. 667 prior files giữ bytes; no new expected/source correction, bốn SPEC_BUG lịch sử có ledger nguyên trạng.

Reviewer Codex cùng agent đã tạo expected, independentSecondReview false; không chuyên gia/second source review. Ghi rõ 69 irrelevant-input recipes chưa concrete runtime variants, malformed expected không phải validator implementation, 四相 existing stub và protection/warehouse projection chưa full-day integration. Những mapping/proof sau thuộc4.1/4.3/4.6/5.4/6.8; không dùng count hoặc replay tự nhận production acceptance. Reuse matching lint/types/compile3.4, review checks/hash/format/diff qua, chỉ thêm report/data và cập nhật tiến độ. **3.5 xong; next3.6 commit/source/Golden freeze**; parent3.0/P4-C/S1/P5 còn mở, no runtime change.

## Task 3.6 — Commit freeze authority/Golden/source

2026-10-14: [freeze v1](sources/p4-vol10/yi-freeze-v1/README.md), [receipt](sources/p4-vol10/yi-freeze-v1/commit-proof.json). Freeze commit `c12df53207d28a82f4def6a67e63c69bc68e141c`, tree `009e4b35699ce76096200418b023ac98760f0468`: authority11, Golden index `golden-p4-yi-operands-v1` trỏ immutable blocks có10.668 records, source closure677 Git blobs SHA-256 đã đối chiếu toàn bộ bằng Git object reads. Existing source/authority/Golden/locks giữ nguyên; 672 pre-freeze file bytes tại checkout khớp, kể cả local Finder metadata không phải source. Receipt tạo sau freeze commit, status/docs commit riêng để tránh checksum/self-commit cycle.

Staging phát hiện snapshot lịch sử có `golden-v3/.DS_Store` bị ignore: giữ hash record cũ nhưng loại khỏi source Git closure, không force-commit Finder metadata hoặc giả checksum trong clean checkout. TSV comparison có CRLF: giữ exact bytes, check `cr-at-eol` thay vì format phá locks. Cả hai có packaging correction evidence. Replay source arithmetic trong Git archive sạch (metadata không có) và proof677 committed blobs qua; source/Golden không sửa để test xanh. Diff product runtime/manifest paths từ freeze parent rỗng; matching lint/types/compile trước đó được reuse vì code/reference bất biến.

**Task3.6 và parent3.0 hoàn tất; next4.1 contract/callers**, chưa provider implementation hoặc toàn P4-C acceptance. Reviewer single Codex, no independent second review; 69 recipes/stubs/projection limits kế thừa, S1 canonical/P5 warehouse còn OPEN/deferred, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT. Không push/merge/deploy.

## Task 4.1 — Contract và callers chốt

2026-10-15: [contract v1](sources/p4-vol10/yi-contract-v1/README.md), [validation](sources/p4-vol10/yi-contract-v1/validation.json), CONTRACT_REVIEWED_NOT_IMPLEMENTED. Kiểm callers transitive bằng graft, graphify map quan hệ, literal consumers/mutation scripts và production import closure. Chốt single-entry/bulk provider với required inputs theo từng rule, error/unknown policy, alias và source/input trace; soil 母倉 dùng authority adoption riêng, không relabel soil P4-B. Entry point mới opt-in ghép evidence trước heading scopes/suppression/P4-B assembly/propagation; wrappers/default/oracle A04b/P4-B giữ nguyên. Warehouse P5 và 四相 existing stub mapping được ghi rõ; không mở heading ngoài catalog.

Chỉ thêm tài liệu/evidence và cập nhật tiến độ; chưa module/provider/test đỏ. Authority/Golden/source frozen hashes và legacy code/manifest giữ bytes. Reviewer single Codex, không independent second review; import proof tĩnh không thay build checksum/CI cuối. **4.1 xong; next4.2 test đỏ**, parent4.0/P4-C chưa hoàn tất, S1 canonical OPEN/P5 deferred.

## Task 4.2 — Test lock/raw offset và presence RED

2026-10-15: [RED presence v1](sources/p4-vol10/yi-red-presence-v1/README.md), [assertion evidence](sources/p4-vol10/yi-red-presence-v1/red-results.json). Thêm `p4YiOperands.test.ts` và API shell `evaluateP4YiOperand` chỉ trả unknown, không predicate/validation/trace. 82 tests integrity PASS: source lock/Golden pins, 677 hashes, 5 raw SHA-1, 74 code-point offset slices, inventory/derivation/source refs. 828 resolved presence fixtures của đủ11 thần thất bại đúng `AssertionError` unknown so present/absent (260/568), không lỗi import/tooling/timeout hoặc skip. Expected/source frozen bytes giữ nguyên; 78 unknown cases và malformed chưa behavior-test, thuộc4.3; full domains mới kiểm hash.

Regression A04b/P4-B 9 files/198 tests PASS, lint/main+functions typecheck/format/diff/source hashes/production import closure PASS; graphify AST update xong. Không triển khai predicate hoặc ghép heading, không thay legacy API/runtime/manifest; single reviewer, no independent second review. **4.2 xong, next4.3**; parent4.0/P4-C chưa nghiệm thu, S1 canonical OPEN/P5 deferred. Unit suite còn RED có chủ đích đến implementation4.4; không dùng status RED này làm CI/merge gate xanh.

## Task 4.3 — Input contract và masked unknown RED

2026-10-15: [input contract RED v1](sources/p4-vol10/yi-red-contract-v1/README.md), [assertion evidence](sources/p4-vol10/yi-red-contract-v1/red-results.json). Thêm `p4YiInputContract.test.ts`: 502 tests, 2 fixture/adapter guards PASS và 500 assertion RED. Bao phủ 78 frozen unknown với reason/input/source trace +20 explicit undefined, 24 frozen malformed +20 required null/+20 invalid provider tag/+34 validation precedence, 69 irrelevant recipes cụ thể hóa thành276 variants, 14 frozen masked ANY vectors với28 trace/evidence assertions. Không dùng default unknown làm pass giả, không import/tooling error/skip.

`p4YiEvidence.ts` chỉ seam RED cho listed operands, chưa ANY/routing/full-day integration; provider và test4.2 giữ bytes (82 integrity PASS/828 presence RED). 198 legacy regression/lint/main+functions types/format/diff/677 frozen hashes/production closure PASS, graph AST updated. Không sửa expected/source/evidence4.1–4.2; single reviewer, không independent second review. **4.3 xong; next4.4 predicates**, parent4.0/P4-C chưa nghiệm thu, S1 OPEN/P5 deferred.

## Task 4.4 — Provider 11 predicate audit-only

2026-10-15: [provider v1](sources/p4-vol10/yi-provider-v1/README.md), [results](sources/p4-vol10/yi-provider-v1/results.json). Thay khung unknown bằng presence provider đúng11 entries, required-input/error/coverage handling và metadata cơ bản; pure predicate đọc locked tables/ranges/sets, soil 母倉 xác thực riêng bằng runtime JPL/civil periods, không tin validated flag/label/score. Full domains7863 khớp: 6423 full-provider và1440 conditional lower-layer (không soil/date giả). Sáu forged provenance tests bị chặn.

Before-code domain tests1 PASS/19 assertion RED; after-code provider suites1404 PASS/28 masked ANY/trace RED giữ cho5.x, legacy198/lint/main+functions types/format/diff/build PASS. 677 source/Golden hashes và production bundle index-CeLinrvj.js SHA256 f29f5aab… giữ nguyên; graph updated. Correction một dòng kiểu helper OptionalTrace.reason cho phép null theo contract, assertions/expected cũ không đổi; evidence4.1–4.3 giữ bytes. **4.4 xong, next4.5 full trace export**; parent4.0/P4-C chưa nghiệm thu, chưa heading/ANY integration, S1 OPEN/P5 deferred.

## Task 4.5 — Full source/input trace và alias scope

2026-10-15: [trace v1](sources/p4-vol10/yi-trace-v1/README.md), [results](sources/p4-vol10/yi-trace-v1/results.json). Source snapshots giữ toàn bộ local indices/raw offsets/quotes/SHA-1/SHA-256/scan locators và entry-lock hashes, nguyên headingScopes/review/coverage. Required-key provenance tách caller declaration khỏi rule inputs, immutable snapshots; alias 福徳 giữ requestName nhưng canonical/rule/source/scope không đổi, không merge các thần trùng vị trí. Bulk đủ11 entries/stable trace IDs; dated 母倉 soil builder dùng adoption riêng và frozen boundary inputs.

Before implementation17 PASS/1025 assertion RED; after1047 trace tests PASS (906 replay,74 raw slices,25 negative identities,3 alias,88 dated soil). Ba nhóm edge bugs mới về bulk null/soil metadata scope/optional astronomy identity claims có RED proof rồi sửa đúng tầng, không Golden correction. Tổng provider/trace suites2451 PASS/28 masked ANY-trace RED giữ5.x, legacy198/lint/main+functions types/format/diff/build/677 frozen hashes/production closure PASS, graph updated. Runtime bundle f29f5aab… và evidence4.1–4.4 giữ nguyên. **4.5 xong; next4.6 presence/coverage/lock gate**, parent4.0/P4-C chưa nghiệm thu, S1 OPEN/P5 deferred; chưa heading/ANY integration.


## Task 4.6 — Presence / coverage / lock gate

[Evidence v1](sources/p4-vol10/yi-presence-gate-v1/README.md): rerun2479 tests,2451 PASS/28 exact masked ANY-trace RED giữ5.x; no unexpected failure/skip/todo/collection error. Legacy198/lint/main+functions types PASS. Replay677 frozen hashes, source/Golden/code/old evidence/production closure và bundle f29f5aab… bất biến trước/sau gate; reuse matching build4.5. Chỉ tài liệu/evidence, graph AST không đổi. **4.6 và parent4.0 hoàn tất presence audit-only; next5.1 regression heading đỏ.** P4-C chưa nghiệm thu, S1 OPEN/P5 deferred; reviewer single Codex, no independent second review.

### P4-C 5.1 — regression heading RED (2026-10-15)

[Evidence](sources/p4-vol10/yi-red-heading-v1/README.md): 958 tests, 39 PASS/919 assertion RED; 11 thần × 28 non-warehouse heading × 3 states; normalization/helper/key và alias trace. Expected dùng Golden frozen, không sửa runtime/provider/resolver. Next5.2; parent5.0/P4-C chưa hoàn tất, S1 OPEN/P5 deferred.

### P4-C 5.2 — ANY regression RED (2026-10-15)

[Evidence](sources/p4-vol10/yi-red-any-v1/README.md):40 frozen vectors lengths0–3,161 tests:68 PASS/93 assertion RED; decision/trace/unresolved/input immutability kiểm riêng,14 masked vectors. Regression5.1+4.3 giữ513 PASS/947 RED; lint/main+functions types,677 frozen hashes và5.1 evidence giữ bytes. Chưa implementation; next5.3,parent5.0/P4-C mở,S1 OPEN/P5 deferred.

### P4-C 5.3 — Opt-in audit integration (2026-10-15)

[Evidence](sources/p4-vol10/yi-integration-v1/README.md):resolveP4YiDay chạy11 provider rồi route/ANY vào versioned core trước classification/propagation; trace giữ unknown, source refs theo heading, 修倉庫 P5. 3604 tests PASS;198 legacy+3 compatibility PASS;720 contexts khớp pre-change hashes cho wrappers/core với historical lookup. Giữ bytes resolver cũ vì freeze677 gồm source; không sửa lock, không đổi inventory/vocabulary.3 focused mutations caught/restored,167 post-restoration PASS; lint/main+functions types/build/bundle/hash/production closure qua. Hai correction test mới theo source ghi SPEC_BUG;Golden giữ bytes. Next5.4; parent5.0/P4-C mở,S1 canonical OPEN/P5 deferred; chưa full gate6.x/CI hoặc push/merge/deploy.

### P4-C 5.4 — Raw/protected 忌, puzhu:28, propagation (2026-10-15)

[Evidence](sources/p4-vol10/yi-propagation-v1/README.md): Golden độc lập `yi-propagation-v1` (Python stdlib, input pin hash: baseline 1.4, domains 3.3, authority, composition 3.4, raw 卷十). Dated sweep 31.755 dòng: propagation thay đổi 0 (vẫn 0 gỡ/179 chặn); raw/protected 忌 thay đổi đúng 9 dòng 求醫療病 刼煞 收日 寅/申 止忌 (offset 11351), Golden suy từ nguồn khớp. puzhu:28 8 context (未甲午 áp, 未甲子 không); thêm `rawJiHeadings` giữ raw 忌 trước override (RED 725 assertion → GREEN 823), `assembleP4YiFullDay` công khai giữ output/hash 5.3. Nối 3.4 `dayOverride`/`sourceContextControls`/evidence `protection` vào resolver thật. P4-C suites 4.427 PASS, legacy+compat 201 PASS; 4/4 mutation bắt/phục hồi; lint/types/build PASS, bundle f29f5aab… bất biến. 2 GOLDEN_BUG derive + 2 SPEC_BUG test ghi ledger; 20 ngày Jie CONVENTION_DIFFERENCE chuyển 5.6. Next 5.5; parent5.0/P4-C mở, S1 OPEN/P5 deferred.

### P4-C 5.5 — 王日, operand sẵn có, 修倉庫 P5 (2026-10-15)

[Evidence](sources/p4-vol10/yi-warehouse-v1/README.md): 王日 trên 720 context khớp 卷05 「王日者春寅夏巳秋申冬亥」 và season Golden; legacy present trong trace = baseline 1.4 trên 31.755 dòng; 修倉庫 pre/final = resolver lịch sử (720) và baseline (1.095 ngày), 宜 luôn unknown kể cả 母倉 present, không thêm rule đồng hiện. Compose 修倉庫 giờ giữ trace/unknown của mệnh đề với `deferred: 'P5'` theo Golden 3.4 warehouse 18 + headingScope deferred 33 (RED 53 → GREEN 56). P4-C 4.483 PASS, legacy+compat 201 PASS; 4/4 mutation; lint/types/build PASS, bundle f29f5aab… bất biến. Next 5.6; parent5.0/P4-C mở, S1 OPEN/P5 deferred.

### P4-C 5.6 — Dated inputs và status trong trace (2026-10-15)

[Evidence](sources/p4-vol10/yi-dated-inputs-v1/README.md): 1.095 ngày giữ soil P4-B/phase/lunar day/母倉 `SOIL_REIGN_STATE` cùng status OWNER_ADOPTED_SOURCE_DEPENDENT trong trace, khớp domain dated 3.3; hai soil convention cùng presence. 5 biến thể × 720 context: token dated chỉ unresolved ở heading `jiInventory` liệt kê, 母倉 chỉ unknown ở 5 heading của nó với reason đúng vocabulary; 108 exact-Jie giữ instant. Thêm `lunarDayInput` và `CONFLICTING_DATED_INPUT` (RED 7 → GREEN 8). CONVENTION_DIFFERENCE: Month Jian sản phẩm là calendar-day, domain dated noon; 20 ngày Jie, 母倉 lệch 3 ngày (2026-05-05/08-07/11-07) → review 6.8. P4-C 4.491 PASS, legacy+compat 201 PASS; 4/4 mutation; lint/types/build PASS, bundle f29f5aab… bất biến. Next 5.7; parent5.0/P4-C mở.

### P4-C 5.7 — Gate phép ghép, regression A04b/P4-B (2026-10-15)

[Evidence](sources/p4-vol10/yi-composition-gate-v1/README.md): Golden tay A04b/又為/puzhu-end/dayCases trên đường 宜 mới không lệch. Diff 31.755 dòng so baseline: mọi thay đổi có lý do Golden (RECORDED_YI_RESOLVED 3.708, EVIDENCE_YI_RESOLVED 85, STOP_JI_REVEAL 10), 0 unexplained; heading final undetermined 4.040 → 642 (số đo, không oracle). Replay 6 test P4-B nguyên văn qua mock: 193/200, 7 lệch EXPECTED_AUTHORITY_MIGRATION_CHANGE (so recorded 宜 với resolveP4Day lịch sử). Toàn `shared/lunar/p4*` 5.043 PASS/3 skip opt-in; lint/types/build PASS, bundle f29f5aab… bất biến. Mutation runner P4-B chưa chạy lại → 6.x/7.1. Parent 5.0 xong; next 6.1, P4-C chưa nghiệm thu.

### P4-C 6.x — Sweep trước/sau, mutation gate, review (2026-10-15)

[Evidence](sources/p4-vol10/yi-sweep-v1/README.md): `p4YiSweep.test.ts` quét cùng 1.095 ngày/input/29 heading baseline, verify bytes [TSV](p4-vol10-yi-operands-2025-2027.tsv) (31.755 dòng × 44 cột) và [summary](p4-vol10-yi-operands-summary.json). 0 operand 11 thần unknown/thiếu input, 0 unresolved 凶, 0 conflict, 3.803 dòng đổi đều có lý do Golden (0 unexplained). Final undetermined 4.040 → 642: P5 修倉庫 539, scope khác 103 (20 dòng chuyển bucket, state không đổi). [Mutation](p4-vol10-yi-mutation-results.json) `scripts/audit-p4-yi-mutations.py`: 23/23 assertion-caught, bytes phục hồi; 1 mutation thiết kế sai (tokenizer crash, TOOLING_ERROR) đã thay và chạy lại. 6.8: 3 ngày Jie 母倉 không đổi state/忌; không correction Golden, không quyết định owner mới. Parent 6.0 xong; next 7.1 CI, P4-C chưa nghiệm thu.

### P4-C 7.1 — CI mutation gate (2026-10-15)

Job `p4-c-mutations` (“P4-C audit mutation gate (i/4)”) chạy `scripts/audit-p4-yi-mutations.py --shard=i/4` song song 4 shard (6/6/6/5 mutation + control mỗi shard), timeout 45 phút; bắt buộc trong `deploy.needs`, điều kiện deploy và danh sách job reuse-audit. Shard chỉ in report ra log; report tracked chỉ do bản chạy đầy đủ local ghi. Thử local shard 4/4: 5/5 assertion-caught, restored, 5m48s. Chưa chạy trên Actions (chưa push).

### P4-C 7.2 — Full validation (2026-10-15)

Tại `c32f441`: `npm test` 194 file / 7.999 PASS / 3 skip (baseline 1.4 opt-in); `npm run typecheck` (main + functions), `npm run lint`, `npm run build`, `npm run build:functions` PASS. Bundle `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` = baseline. `prettier --check .`: code/test nhánh sạch; 109 file lệch = 67 có sẵn trên `main` + 42 JSON evidence máy sinh P4-C (nhiều file bị lock SHA-256 nên giữ bytes); CI không có gate format.

### P4-C 7.3–7.4 — Runtime bất biến, graph, report (2026-10-15)

`git diff main...HEAD` ngoài test: chỉ thêm 10 file mới (8 module `p4Yi*`, authority, Golden index), không sửa file runtime nào; grep import: 0 file trong `src`/`functions/src` hay module production đọc `p4Yi*`/`p4-yi-operands`; `manifest.json` không đổi; bundle build `f29f5aab…` = baseline (7.2). 677 path trong `yi-freeze-v1/lock.json` + `prior-hashes.json` không đổi từ freeze `c12df53` đến HEAD. `graphify update .` đã chạy. Bảng tổng kết P4-C thêm ở đầu report. Next 7.5 push/PR.

### P4-C 7.5 — PR và CI (2026-10-15)

[PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) vào `main`. [CI run 38764920607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38764920607) **success** trên HEAD `efc5ffa`: Typecheck and lint, Unit tests 4/4, Mutation and emulator gates, P4-B audit mutation gate, P4-C audit mutation gate 1–4/4 (16m25s–20m15s, timeout 45 phút), Playwright desktop 2/2; Deploy skipped vì là PR. Commit tài liệu này đẩy HEAD mới nên CI chạy lại trên PR. Chưa merge/deploy: cần owner cho phép.

### P4-C 7.6 — Acceptance gate PRD §8 (2026-10-15)

[Gate v1](sources/p4-vol10/yi-acceptance-gate-v1/README.md): gate 1–7 **PASS** với evidence kiểm lại trực tiếp (authority 11/11 đủ trường; sweep 0 operand unknown, 0 unresolved 凶, 0 unexplained; freeze `c12df53` trước code, authority/Golden giữ bytes; mutation 23/23; CI 38764920607 trên `efc5ffa`; runtime/manifest/bundle bất biến). Gate 8 chờ 7.7: progress.md và PROJECT_CONTEXT cuối. Không có entry cần owner quyết. P4-C chưa đánh dấu hoàn tất.

### P4-C 7.7 — Nghiệm thu audit-only (2026-10-15)

Checkbox 0.0–7.7 đủ evidence; progress.md và PROJECT_CONTEXT cập nhật (roadmap 5 XONG, roadmap 6 P5 tiếp theo, S1 OPEN). Gate 8 PASS → [acceptance gate](sources/p4-vol10/yi-acceptance-gate-v1/README.md) 8/8: **P4-C nghiệm thu audit-only**. Runtime/scoring không đổi; merge PR #55 cần owner cho phép.
