# P4-C 4.4 — Provider presence 11 thần

2026-10-15. **ELEVEN_PRESENCE_PREDICATES_IMPLEMENTED_AUDIT_ONLY**. Task 4.4 hoàn tất, parent 4.0/P4-C chưa nghiệm thu. Reviewer Codex (single agent), không independent second review. Authority `p4-yi-operands-v1` và Golden/source freeze `c12df53207d28a82f4def6a67e63c69bc68e141c` giữ nguyên bytes.

## Implementation

- `shared/lunar/p4YiOperands.ts`: single-entry provider, canonical/accepted alias lookup, validate đúng required keys, provider coverage, missing/unknown policy và basic authority/input/source-ref metadata. Không đọc label sao, score, lunar month hoặc optional inputs để tạo presence.
- `shared/lunar/p4YiPredicates.ts`: pure predicate layer thực sự được provider gọi. Mỗi monthly entry đọc bảng `byMonthJian` riêng đã khóa; 天恩 đọc inclusive ranges trong chu kỳ 60; 除神 dùng day-branch set; 鳴吠 dùng corrected 13-pillar set; 母倉 dùng seasonal branch sets và soil override thay thế, không union.
- `shared/lunar/p4YiSoil.ts`: kiểm authority adoption riêng của 母倉, status/timezone/date/coverage và boundary provenance. Đối chiếu nextLi/onset/sourcePath/sourceRowIndex/state với runtime JPL authority + civil periods hiện có. Không import expected/Golden fixtures vào runtime provider; sourcePath trong evidence chỉ là locator đến cùng frozen astronomy input đã được runtime authority xác thực.

Missing/ngoài coverage/unknown vẫn unknown; malformed required inputs hoặc provenance mâu thuẫn throw RangeError với code/inputKey/requestName. Malformed không bị missing/outside của input khác che. 10 entry không soil không bị áp giới hạn local 2025–2027 của 母倉. Irrelevant keys/provider states bị bỏ qua và không xuất hiện trong used-input trace. Alias 福徳 chỉ chuẩn hóa identity 福德; các thần trùng vị trí vẫn có entry/rule riêng.

Soil không tin `validated: true` hoặc arithmetic string. Date hợp lệ ngoài adopted scope trả unknown; trong scope phải có metadata đủ để đối chiếu next 四立, onset = Li −18 civil days và đúng row JPL. Soil unknown vẫn unknown dù runtime có thể tính ngày đó; không seasonal fallback. Onset bao gồm, Li day loại trừ. P4-B helper/authority không sửa hoặc đổi nhãn; S1 canonical OPEN, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT vẫn chỉ 2025–2027.

## Test proof

[results.json](results.json) ghi before/after, từng miền, assertion còn hoãn, code/type correction và runtime checksum. Test miền mới được chạy trước implementation: 1 integrity PASS / **19 AssertionErrors** (13 miền và 6 forged-provenance cases), không lỗi import/collection. Sau implementation:

| Nhóm                                                                                 | Kết quả                           |
| ------------------------------------------------------------------------------------ | --------------------------------- |
| 4.2: 82 integrity +828 resolved presence assertions                                  | **910 PASS**                      |
| 4.3: source/adapter guards + unknown/undefined/malformed/precedence/irrelevant input | **474 PASS**                      |
| Full domains và forged soil provenance                                               | **20 PASS**, kiểm 7.863 records   |
| 4.3 synthetic masked ANY/trace seam                                                  | **28 RED có chủ đích**, còn ở 5.x |
| Legacy A04b/P4-B regression                                                          | **9 files /198 PASS**             |

Ba test files provider chạy tổng **1.432 tests: 1.404 PASS /28 RED**, không skip/todo hoặc unexpected tooling failure. `p4YiEvidence.ts` giữ nguyên khung RED; không sửa/skip các assertion còn đỏ để tuyên bố unit suite xanh. Chưa ghép heading, ANY, suppression, protection/override hoặc propagation.

Full-domain proof dùng immutable TSV 7.863 rows, không rederive expected từ provider. 7 monthly ×720 và 3 day-only ×60, cộng 1.095 dated 母倉 +108 exact-Jie = **6.423 calls vào provider đầy đủ**. **1.440 conditional soil tuples** kiểm trực tiếp pure predicate layer, không fabricate date/validated soil để gọi full provider. Counts này là records, không unique dates hoặc Vitest test count. Sáu tests forged state/onset/nextLi/source row/path/coverage xác nhận flag validated không đủ xác thực evidence.

## Validation, correction và phạm vi còn lại

`npm run lint`, `npm run typecheck` main/functions, formatting/diff và `npm run build` PASS. Bundle vẫn `index-CeLinrvj.js`, SHA-256 **f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969**, trùng baseline. Static production import closure không chạm provider/predicate/soil audit modules; 677 locked source/authority/Golden files giữ hashes. Graphify AST update hoàn tất; JSON/report cập nhật, HTML tự bỏ do graph lớn.

Một **SPEC_BUG về kiểu helper test**: OptionalTrace.reason chỉ cho string trong scaffold, trong khi contract4.1 quy định resolved reason là null. Đổi thành string|null; đảo đúng thay đổi một dòng khôi phục hash test4.3 trước đó. Không đổi assertion, Golden hoặc evidence lịch sử 4.1–4.3. Lint/types được chạy lại sau sửa này. Build có cảnh báo chunk-size và PWA deprecated option hiện hữu; không đổi cấu hình ngoài scope.

[validation.json](validation.json) lưu commands/hash/replay. Full sourceReference (raw/scan/checksum resolved), inputProvenance export, bulk/dated adapter và trace contract còn ở **4.5**; gate4.6 chưa chốt. API hiện có basic identity/status/used-input/sourceRefs để giữ contract unknown/error; chưa tự nhận full trace nghiệm thu. P5 warehouse deferred, S1 canonical OPEN; không runtime activation, push, merge hoặc deploy. **Next 4.5**.
