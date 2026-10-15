# P4-C 4.5 — Trace authority/input/source và alias scope

2026-10-15. **FULL_SOURCE_INPUT_TRACE_EXPORTED_AUDIT_ONLY**. Task 4.5 hoàn tất; parent 4.0/P4-C chưa nghiệm thu, tiếp theo 4.6. Reviewer Codex (single agent), không independent second review. Authority/Golden/source freeze `c12df53207d28a82f4def6a67e63c69bc68e141c` giữ bytes.

## Trace contract và APIs

`evaluateP4YiOperand` giữ nguyên presence/error/coverage của 4.4, thêm `traceId`, `inputProvenance` theo required keys và `sourceReference` đủ đọc lại nguồn. `getP4YiOperands(inputs, providerStates, inputProvenance)` trả readonly array đủ 11 canonical entries theo thứ tự authority, kể cả unknown. Trace ID `p4yi:<entry.id>` ổn định; alias giữ requestName gốc nhưng cùng canonical ID/rule/source/scope. Bulk kiểm branch/pillar mâu thuẫn và malformed containers; single-entry vẫn bỏ qua các key không thuộc predicate.

`p4YiTrace.ts` tạo source snapshots chỉ từ authority bundle. `sourceReference` gồm:

- Bundle path/version/SHA-256 của snapshot đã freeze; entry ID, entry path/hash và evidence lock path/hash.
- Tất cả entry.sources với **index cục bộ giữ nguyên**, volume/path/raw SHA-1, code-point offset/length/quote và raw SHA-256. `predicateSourceRefs` tách riêng; headingScopes có thể trỏ các index khác mà không bị renumber hoặc mất source record.
- Scan locator/printed folio/PDF page/review limitations và hash rendered image; headingScopes, coverage và review metadata nguyên trạng. Archive-image alignment chưa được kiểm trong source vẫn ghi chưa kiểm, không tự nâng authority/review status.

`sourceRefs` ở root vẫn là predicate indices đã khóa. Heading scopes chỉ được xuất để audit, không tạo 宜 hoặc gộp scope. Nguồn/scan được resolve từ artifact metadata; provider không đọc file expected hoặc Golden ở runtime. Pin bundle SHA-256 là identity của frozen artifact và được test so với bytes thật.

`inputProvenance` là map đúng required keys. Mỗi key ghi originRequirement từ authority, supplied flag, provider-state tag và **caller-declared evidence**. Explicit keyed evidence được giữ độc lập; flat frozen context được bind month calculation riêng, day calculation/pillar riêng, dated soil riêng. Instant/date strings giữ nguyên, không round thành noon. Soil bị thiếu có `MISSING_SOIL_EVIDENCE`, không lấy day calculation thay thế. Metadata khai báo không quyết định presence hoặc tự xác nhận validated/coverage. Inputs/states/provenance và nguồn được snapshot/freeze; không mutate hoặc giữ mutable references vào caller/authority JSON metadata.

## Dated soil builder

`getP4MuCangSoil(date)` xuất adoption **p4-yi-mucang-soil-owner-convention-v1**, OWNER_ADOPTED_SOURCE_DEPENDENT/UTC+7 và coverage 2025–2027. Builder/validator dùng chung phép tính next 四立 civil period, giữ nextLi/onset/source row/arithmetic, JPL source SHA-256, astronomy authority và clock policy. Không đổi nhãn trên kết quả P4-B. Nếu caller cung cấp sourceSha256/astronomyAuthorityId/clockPolicy thì phải khớp identity đã pin; frozen inputs cũ không có các field mới vẫn được nhận. 88 dated evidence cases khớp source-reference độc lập; onset bao gồm/Li loại trừ giữ nguyên.

Ngày hợp lệ ngoài local coverage vẫn unknown. Ngoài astronomy table, builder không fabricate nextLi/row: coverage outside, state unknown, validated false. Malformed date là RangeError rõ ràng. S1 canonical OPEN, soil adoption không tự thành canonical; P5 warehouse tiếp tục deferred.

## Proof RED → GREEN

[results.json](results.json) ghi before/after, coverage, corrections và deferred tests. Test mới được quan sát đỏ trước implementation: **17 PASS /1.025 AssertionErrors**, không lỗi import/collection. Hai edge tests bổ sung cũng được quan sát đỏ trước sửa: bulk null gây TypeError thay vì input error, và missing soil metadata lấy nhầm day calculation. Hai lỗi implementation mới được sửa tại tầng chịu trách nhiệm; không sửa source/Golden/expected cũ. Ba tests khác đã quan sát RED khi source SHA/astronomy authority/clock claims mới bị giả; validator nay kiểm các claims tùy chọn khi có mặt, giữ tương thích frozen inputs cũ không có field này.

Sau implementation, `p4YiTrace.test.ts` **1.047 PASS**:

- 906 presence records (present/absent/unknown) giữ authority/rule/status/input/source trace và replay cùng presence/reason từ exported inputs/providerStates.
- 11 entry source checks, tổng 74 raw slices và toàn bộ scan hashes/entry locks; 25 negative identity cases không merge thần trùng vị trí/nhãn; 3 alias 福徳 present/absent/unknown giữ cùng source/scope.
- Keyed/flat provenance, nested caller snapshot và missing-soil scope; 4 bulk tests kiểm đủ inventory/unknown/coherence/container.
- 88 dated soil comparisons, 2 malformed dates, 2 ngày ngoài astronomy coverage và 3 optional astronomy identity forgeries.

Provider/domain/input/trace suites tổng **2.479 tests: 2.451 PASS /28 RED có chủ đích**. 28 RED vẫn đúng masked-unknown ANY/trace seam `p4YiEvidence.ts` chưa triển khai, thuộc 5.x; không skip hoặc đổi assertions để giả green gate. Full-domain 7.863 records vẫn khớp, gồm conditional soil layer riêng. Legacy A04b/P4-B: **9 files /198 PASS**.

## Validation và bước sau

Lint, main/functions typecheck, formatting/diff và build PASS. Production bundle vẫn `index-CeLinrvj.js`, SHA-256 **f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969**. 677 locked hashes, evidence 4.1–4.4 và API/oracle cũ giữ nguyên. Static production import closure không chạm modules audit mới; graphify AST update hoàn tất. Build chỉ có chunk-size/PWA deprecation warnings hiện hữu.

[validation.json](validation.json) lưu commands/hash/replay. Kiểm trace và replay không phải source review độc lập thứ hai; caller-declared provenance không chứng nhận ngày thực tế nếu caller không cung cấp provider đúng. Heading/ANY/propagation/protection integration và báo cáo real-day vẫn thuộc 5.x/6.x. **Next 4.6**: gate presence/coverage/lock trước ghép heading; chưa chốt parent4.0 hoặc P4-C, chưa push/merge/deploy.
