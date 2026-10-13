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
|---|---:|
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
|---|---:|---:|---:|---:|---:|
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
