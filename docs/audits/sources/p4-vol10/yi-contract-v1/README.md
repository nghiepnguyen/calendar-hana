# P4-C 4.1 — Contract provider, trace và entry point audit

2026-10-15. **CONTRACT_REVIEWED_NOT_IMPLEMENTED**. Reviewer: Codex (single agent), không independent second review. Chỉ chốt thiết kế cho 4.2–5.3; không thêm module, import hoặc predicate. Parent 4.0/P4-C còn mở. Authority/Golden freeze `c12df53207d28a82f4def6a67e63c69bc68e141c` giữ bytes; S1 canonical OPEN, warehouse P5 deferred.

## Callers và blast radius

Đọc GRAPH_REPORT trước source; wiki/index không tồn tại. Graphify BFS nối day/full-day/heading/remaining-Ji với các helper production dùng chung; cạnh gần nhau không chứng minh production gọi audit. Graft callers `--depth all` và kiểm literal import/reference bổ sung cho kết quả:

| Symbol / vị trí tại checkpoint                    | Caller trực tiếp                                                              | Ranh giới cần bảo toàn                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `resolveP4Day`, `p4DayComposition.ts:153`         | `resolveP4FullDay`; day/full-day/puzhu-end/youwei tests                       | A04b hai argument, giá trị và shape cũ                      |
| `resolveP4FullDay`, `p4FullDayComposition.ts:24`  | full-day/lunar-day/lunar-phase/puzhu-end/soil tests và `p4YiBaseline.test.ts` | P4-B optional operands mặc định `{}` và historical baseline |
| `applyP4Propagation`, `p4DayComposition.ts:116`   | day/full-day composer và day tests                                            | Một pass trên snapshot trước propagation, bảo vệ 忌         |
| `yiEvidence`, `p4DayComposition.ts:68`            | private, trong `resolveP4Day`                                                 | Đây là nơi cần seam đầu vào, không patch kết quả cuối       |
| `resolveP4Headings`, `p4HeadingAnnotation.ts:142` | day composer, heading/coverage tests                                          | Missing heading key là unknown, `false` phải còn nguyên     |

Blast radius transitive của day/propagation gồm các tests lunar-day/lunar-phase/soil/baseline qua full-day. Scripts không hiện đầy đủ trên call graph: `audit-p4-day-mutations.py` thay literal trong day composer; `audit-p4-remaining-ji-mutations.py` thay literal trong full-day/soil; heading/coverage/season mutation runners cũng phụ thuộc module tương ứng. Refactor sau này phải giữ mutation có ý nghĩa và chứng minh assertion bắt lỗi, không coi import/tooling failure là pass.

Production consumers dùng chung `catHungStars`, `xiejiGodPresence`, `xiejiVirtues`, `splitHeadings`, `thoVuongDungSu` và astronomy. Chỉ đọc/reuse các helper này; không đổi chúng cho audit. Kiểm import closure tĩnh từ `src`, `functions/src`, và `shared/lunar/almanac.ts`: không chạm day/full-day/heading P4 hoặc authority/Golden P4-C. Evidence và giới hạn scanner ở [validation.json](validation.json). Đây là proof tĩnh tại checkpoint; build checksum và CI cuối vẫn thuộc 7.x.

## API provider được chốt

Module mới ở 4.2–4.5: `shared/lunar/p4YiOperands.ts`. Contract version `p4-yi-provider-contract-v1`; authority bundle vẫn `p4-yi-operands-v1`, không đổi authority status/bytes để ghi tiến độ.

```ts
evaluateP4YiOperand(requestName, (inputs = {}), (providerStates = {}), (inputProvenance = {}))
getP4YiOperands((inputs = {}), (providerStates = {}), (inputProvenance = {}))
getP4MuCangSoil(date)
```

Đây là signatures thiết kế, chưa phải exports đang có. `requestName` nhận canonical Hán hoặc alias đã khóa; chỉ `福徳` → `福德`. Stable catalog ID không thay tên Hán/rule ID; tên ngoài inventory báo `RangeError` với code `UNRECOGNIZED_YI_OPERAND`, không trả absent. `天巫` vẫn resolve về chính entry 天巫 khi request, không alias sang 福德. Bulk trả đủ 11 canonical entries theo thứ tự authority, kể cả unknown; mỗi entry dùng đúng tập required riêng. Output readonly, không mutate input/artifact.

Input dùng keys đã khóa trong Golden; không lấy tên sao hiện diện hay score làm input:

| Entry                                    | Required keys                                         | Miền                                                  |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| 福德、天巫、天后、天醫、驛馬、天馬、吉期 | `MONTH_JIAN_BRANCH`, `DAY_BRANCH`                     | 12 × 60, exact-Jie Month Jian                         |
| 天恩、鳴吠                               | `DAY_PILLAR`                                          | 60 pillar hợp lệ, 0 = 甲子                            |
| 除神                                     | `DAY_BRANCH`                                          | Chi của 60 pillar, không required tháng/can           |
| 母倉                                     | `MONTH_JIAN_BRANCH`, `DAY_BRANCH`, `SOIL_REIGN_STATE` | Mùa exact-Jie + dated soil convention riêng 2025–2027 |

`MONTH_JIAN_BRANCH`/`DAY_BRANCH` là một chữ trong 子丑寅卯辰巳午未申酉戌亥. `DAY_PILLAR` là hai chữ can/chi có cùng parity, một trong 60 pillar. Adapter đổi index 0..11 của selectionContext sang Hán sau khi kiểm integer/range; không truyền index thẳng vào API. Không thay Month Jian bằng tháng âm hay officer của cả crossing day. Low-level provider chấp nhận structural context không date cho 10 entry không soil; không áp coverage 母倉 lên chúng.

`providerStates` là partial map cùng keys, values `inside | outside | unknown`; omitted có nghĩa input structural do caller cung cấp, không tự xác nhận dated provenance. Chỉ keys required của entry ảnh hưởng presence. Optional/irrelevant keys (kể cả lunar day/phase/soil đối với entry không dùng) không được đọc, validate hoặc trở thành required. Bulk có thể báo lỗi ở entry thực sự dùng input malformed đó; kiểm irrelevant-input recipes bằng single-entry API. Nếu `DAY_PILLAR` lẫn `DAY_BRANCH` được dùng để dựng cùng dated context, adapter kiểm khớp trước khi gọi bulk.

Thứ tự xử lý: resolve identity → validate mọi required value có cung cấp và required provider-state tag → kiểm missing → outside provider/local coverage → unknown provider/soil provenance → predicate. Omitted hoặc `undefined` là missing; `null`, sai type/range/parity hay unknown tag là malformed. Một giá trị malformed không được che bằng required key khác đang missing/outside. Required key có provider state outside/unknown nhưng giá trị hợp lệ vẫn trả unknown. Các lý do unknown giữ đúng vocabulary Golden: `MISSING_REQUIRED_INPUT`, `OUTSIDE_PROVIDER_COVERAGE`, `OUTSIDE_LOCAL_COVERAGE`, `UNKNOWN_INPUT`, `UNKNOWN_SOIL`, `UNVALIDATED_SOIL_PROVENANCE`. Error là `RangeError` kèm `code`/`inputKey`/`requestName`: `MALFORMED_REQUIRED_INPUT` hoặc `MALFORMED_SOIL_PROVENANCE`; không dùng text message làm oracle duy nhất.

### 母倉 soil và adapter dated

`SOIL_REIGN_STATE` giữ shape Golden: `state` (present/absent/unknown), `authorityId`, `status`, `timezone`, `date`, `coverage` (inside/outside), `validated`, `nextLi`, `onset`, `sourcePath`, `sourceRowIndex`, `arithmetic`. Authority phải là `p4-yi-mucang-soil-owner-convention-v1`, status `OWNER_ADOPTED_SOURCE_DEPENDENT`, timezone `Asia/Ho_Chi_Minh`. `validated: false` là unknown provenance; flag true không đủ để tin một object tùy ý. Sai authority/status/timezone/date hoặc evidence tự mâu thuẫn là malformed. Date hợp lệ ngoài 2025-01-01…2027-12-31 là unknown, không seasonal fallback; soil unknown cũng không fallback dù chi nằm ngoài mọi seasonal set.

`getP4MuCangSoil(date)` sẽ tạo evidence theo adoption riêng: cùng 四立 authority/boundary và phép tính civil-date đã khóa, onset = 四立 civil date − 18 ngày, onset ≤ date < 四立. Reuse read-only `thoVuongDungSuPeriods` sau đối chiếu input authority, giữ nextLi/onset và source row/hash để tái hiện. Không chỉ đổi authorityId trên object `getP4SoilPresence`; helper P4-B hiện chỉ trả date/ID/status/presence và thiếu boundary provenance. Validator đối chiếu date/coverage/onset/nextLi/state với authority boundary; không tin `arithmetic` string hoặc `validated` do fixture gán. Golden adapter có thể bind source-row evidence đã freeze mà không import Python reference vào provider.

Dated audit adapter nhận cùng civil date/noon selectionContext như baseline (UTC+7); exact-instant fixture dùng instant trong inputProvenance và exact-Jie provider, không làm tròn thành noon. Trace ghi instant/date/provider version/coverage và input thực dùng. `lunarDay`, phase và soil P4-B vẫn được truyền riêng cho full-day 忌 như trước; chúng không trở thành input mới của 10 thần còn lại. Structural truth table 母倉 1.440 tuples chỉ kiểm conditional predicate, không tạo soil dated/validated giả để gọi full provider.

## Output và trace

Mỗi result có `contractVersion`, `requestName`, `id`, `han`, `authorityId`, `ruleId`, `authorityStatus`, `presence`, `reason` (null khi resolved), `inputs`, `providerStates`, `inputProvenance`, `missingInputs`, `sourceRefs`, `sourceReference`. `inputs` chỉ copy required values đã dùng (missing ghi trong missingInputs); provenance chỉ của required keys, không kéo irrelevant inputs vào quyết định. Rule ID đúng `authorityId + :presence`, không dùng catalog ID. Mọi result present/absent/unknown đều giữ identity/authority/status/source trace.

`sourceRefs` là indices zero-based của **entry.sources** cho predicate (`predicate.sourceRefs`); `sourceReference` ghi bundle path/hash, entry ID, sources được resolve với volume/path/offset/length/quote/raw SHA-1 và scan/evidence lock path/hash. Không global-renumber refs. Heading contribution thêm heading-specific refs từ `headingScopes`, tách khỏi refs định nghĩa presence. Alias giữ requestName gốc và canonical han, cùng authority/rule ID; không gộp hai entry trùng vị trí. Test offset dùng Unicode code points (`Array.from(raw)`), không UTF-16 slice.

Bulk trace ID ổn định theo entry ID (`p4yi:<id>`); request riêng giữ requestName, heading tham chiếu result bằng ID, không tính lại predicate cho từng heading. Presence state không đổi khi suppression/cancel/override tác động recorded 宜/忌. Unknown vẫn nằm trong trace khi một operand khác present đã xác định ANY; báo riêng unresolved của 11 thần và unresolved khác/P5, không suy chúng từ final heading state.

## Entry point ghép audit ở 5.3

Entry point mới: `resolveP4YiDay(month, pillar, operands = {})` trong `shared/lunar/p4YiDayComposition.ts`, output version `p4-yi-day-composition-v1`. Operands gồm `lunarDay`, `phase`, `soil` P4-B và `yiInputs`, `yiProviderStates`, `yiInputProvenance` cho provider mới. Month/pillar vẫn validate theo P4 context; derive branch/pillar required từ hai args; nếu yiInputs lặp lại có value mâu thuẫn thì lỗi, không silently ưu tiên. Date/soil 母倉 phải có evidence riêng; không tự suy từ soil P4-B. Khi không có soil 母倉, chỉ 母倉 unknown; 10 entry còn lại vẫn có thể resolved.

Chọn seam explicit, không thêm flag mặc định bật vào API cũ: tại 5.3 extract phần lắp state hiện hành thành audit core nhận map 宜 override **trước** `resolveP4Headings`. Các wrappers `resolveP4Day(month,pillar)` và `resolveP4FullDay(month,pillar,operands={})` gọi core với lookup lịch sử; chỉ entry point mới cấp map từ provider. Core không import provider/authority P4-C; provider chỉ được import bởi module mới và tests. Trước extraction chạy lại callers và regression đỏ/known-output cũ. Không thay shape/output/default của hai API cũ, không patch `base.headings` hay `base.prePropagationHeadings` sau khi chúng đã bị phân loại với 宜 cũ.

Pipeline được chốt:

1. Validate context/input, provider 11 entries; giữ lookup hiện hành của các operand đã có (王日/四相 và các nhóm khác).
2. Normalize raw heading bằng cùng `splitHeadings` + `canonP4Heading`; alias thần qua authority riêng. Dùng vocabulary/artifact version mới nếu cần, giữ `p4-vol10-day-composition-v2.json` và splitter lịch sử. Không sửa production `splitHeadings` để thêm spelling audit.
3. Chỉ `DIRECT_YI` trên 29 heading được ghép với các operand đã có: ANY present → true; không present/còn unknown → undefined; toàn absent hoặc empty → false. Golden JSON null adapter sang undefined, không boolean-coerce.
4. Đưa evidence vào scopes → suppression/cancel → assembly P4-B lunar/phase/soil/remaining-Ji/end clauses → override ngày → propagation một pass. Phân biệt evidenceYi và recordedYi; giữ rawJi/protected facts trong trace dù puzhu:28 gỡ effectiveJi. Giữ 未甲午 áp dụng/未甲子 không áp dụng và mọi exception P4-B.
5. `修倉庫` giữ deferred P5 kể cả generic ANY true. 四相 stub ở Golden bind với operand hiện có `getVol10VirtuesPresent(monthIndex, stemIndex, branchIndex).has('四相')`, giữ source definition `VOL10_VIRTUES` trong `xiejiVirtues.ts:65–73` (seasonal DAY_STEM, không phải 相日 của `getP4SeasonDays`); đây không phải alias 福德 và không bổ sung warehouse predicate. Heading ngoài catalog/co-presence nguồn vẫn chỉ report.

Không re-export module mới qua production barrel, `almanac.ts`, scorer, UI hoặc functions. Golden index/blocks chỉ tests/runner đọc filesystem; provider đọc authority bundle, không import expected. Bổ sung output/lock mới riêng; không viết lại baseline/Golden/source locks để ghép code.

## Proof và việc tiếp theo

[validation.json](validation.json) ghi HEAD/tree, source hashes, import consumers/closure, frozen hashes và validation commands. Static import scanner giới hạn literal local imports/re-exports/dynamic imports; external packages/variable dynamic loads không được tự coi đã audit. Graft có ranked/structural limitations nên đã kiểm thêm scripts và literal refs. Single reviewer, không source review độc lập mới.

Task 4.2 viết assertion đỏ với adapter vào frozen presence/raw locks; 4.3 kiểm missing/coverage/malformed, irrelevant-input recipes và masked unknown; 4.4–4.5 triển khai provider/trace; 4.6 kiểm lại hashes. Chưa tạo placeholder module hoặc đỏ bằng import thiếu file trong 4.1. Integration/protection projections không phải real-day expected: Golden độc lập bổ sung ở 5.4/6.8 khi cần. Baseline/source-generator guards historical tái tạo ở checkout freeze/baseline tương ứng sau refactor; giữ nguyên guards cũ, không update hashes để bypass. Current regression tests cho wrappers phải chạy tại HEAD mới; baseline measurement không dùng làm oracle presence.
