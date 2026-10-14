# P4-C — baseline và inventory operand 宜

2026-10-13. **TASK 1 HOÀN TẤT — baseline khóa tại `991e87c`; chưa chốt authority mới, chưa triển khai presence P4-C.**

Owner chọn 1A: P4-C chỉ nghiệm thu khi 11/11 authority được chốt. Hoàn tất task 1 không đồng nghĩa hoàn tất P4-C.

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
