# P4-C 5.3 — Opt-in provider integration

2026-10-15. **PASS_TASK_5_3_AUDIT_ONLY**. Parent5.0/P4-C chưa nghiệm thu; next5.4. Reviewer Codex, single agent; không independent second review.

## Entry point và pipeline

shared/lunar/p4YiDayComposition.ts exports resolveP4YiDay(month,pillar,operands={}), output version p4-yi-day-composition-v1. Không import/re-export vào production.

Context được validate trước lookup. Derived MONTH_JIAN_BRANCH/DAY_BRANCH/DAY_PILLAR lấy từ hai argument; duplicate yiInputs có value khác bị RangeError với code CONFLICTING_DERIVED_INPUT/inputKey. Provider states và per-key provenance truyền nguyên qua provider11. Lunar day/phase/soil P4-B vẫn là inputs riêng; soil P4-B không tự trở thành 母倉 authority.

Provider chạy một lần cho đủ11 stable IDs. Helper composeP4YiEvidence chuẩn hóa source spelling, lọc DIRECT_YI theo authority, ghép với operand lịch sử và thực hiện ANY. True khi có present, undefined nếu không present nhưng còn unknown, false khi toàn absent/rỗng; unlisted không làm heading unknown. Trace giữ eligible entries theo thứ tự cùng unresolved IDs. Alias 福徳 không gộp 天巫. Warehouse không flatten compound clause; 修倉庫 vẫn yi undefined/P5.

yiEvidence lưu evidence trước suppression, p4cTraceIds/unresolvedP4cTraceIds và heading-specific sourceRefs/sources. Provider predicate sourceRefs không bị đánh số lại. Presence trace top-level yiOperands giữ đủ11, kể cả không listed và unknown. Bản đồ 宜 được cấp vào core trước resolveP4Headings, rồi suppression/cancel, P4-B assembly/override và propagation một pass trên snapshot như trước. prePropagationHeadings/headings phản ánh recorded state, không patch kết quả cuối.

## Versioned core và điều chỉnh contract

Callers resolveP4Day/resolveP4FullDay --depth all đã kiểm trước sửa; literal mutation consumers kiểm bổ sung. Không có production consumer.

Contract4.1 đề xuất extract shared core trong hai resolver cũ. Thử extraction cho output720 contexts khớp, nhưng test source lock phát hiện **677 frozen reference blobs bao gồm cả hai file mã lịch sử**. Không sửa test/lock để cho qua. Giải pháp cuối: giữ nguyên bytes p4DayComposition.ts và p4FullDayComposition.ts, thêm p4YiDayCore.ts/p4YiFullDayCore.ts versioned với explicit 宜 injection. Reuse tokenizer, heading catalog, propagation và các pure providers cũ. New helper dùng chính historical artifact vocabulary; không cần sửa inventory hoặc tạo successor JSON khi vocabulary không đổi.

Hai body assembly giữ nguyên predecessor, trừ lookup 宜 được chuyển thành argument và full core gọi day core mới. verify-core-bodies.py kiểm structural text equality sau bỏ whitespace/comments. Compatibility test cấp historical lookup vào core mới và so toàn bộ output hash đã capture **trước implementation**, đủ720 contexts cho cả day/full-day. 12 optional-input combinations (lunar/phase/soil, gồm 未甲午/未甲子) cũng so với predecessor bất biến. Đây là proof preservation, không phải Golden cho behavior mới.

Tradeoff: versioned assembly có code duplication để bảo toàn frozen reference. Predicate/ANY wiring chỉ ở entry mới; việc chỉnh core sau này cần tiếp tục đối chiếu predecessor và regression, không sửa historical lock. S1/warehouse scope không đổi.

## RED → GREEN và corrections

[RED](red-tests.json):6 assertion failures từ integration shell, không import/collection error. [Before](before-tests.json):compatibility capture chạy trước extraction,1 PASS. Capture branch đã bỏ khỏi test cuối, không có switch regenerate oracle.

Hai SPEC_BUG trong test mới (không phải frozen Golden): chọn nhầm 甲子 cho 天赦 mùa xuân (source VOL10_VIRTUES ghi 戊寅); chọn 甲辰 làm Thiên Ân present (frozen cycle không có). Sửa case source-locked 戊寅 và 甲子 tương ứng, giữ authority/expected cũ. Không sửa output để khớp case sai. Assertion bổ sung kiểm classified pre-propagation và heading source refs được chứng minh bằng focused injection mutation.

Final provider/domain/trace/input/heading/ANY/integration suites: **3604 PASS**, gồm958 heading/161 ANY/502 contract và6 integration. 919+93+28 RED trước đây đã xanh. Frozen source hashes677,7863 domain records và trace replay được suites hiện có kiểm.

Legacy/compatibility: **201 PASS** =198 historical +3 compatibility. Hashes720 contexts capture trước refactor dùng cho cả original wrappers và versioned cores với historical 宜. Không dùng baseline presence counts làm expected mới.

[Focused mutations](mutations.json):3/3 bị assertion bắt (bỏ injection trước classification:1 failure; present→unknown:25; xóa unresolved IDs:25). Runner tuần tự, timeout120s, finally phục hồi bytes; không unit/build/edit song song. [Post-restoration](restored-results.json):167 PASS. Đây là wiring proof5.3, không thay comprehensive gate6.x.

npm run lint, npm run typecheck main/functions, npm run build PASS. Bundle index-CeLinrvj.js vẫn SHA-256 f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969. Build có warnings chunk size/deprecated inlineDynamicImports hiện có; không failure.

Static production import closure giữ ngoài toàn bộ P4-C modules/authority/Golden. Scanner chỉ theo literal local imports/re-exports/type-only/dynamic imports, không coi variable imports là đã audit. Historical code/manifest/artifact bytes và prior4.x/5.1/5.2 evidence giữ nguyên; chỉ seam p4YiEvidence thay shell bằng implementation. Không chạy lại historical verifier đòi shell bytes cũ như một current-code gate; verify.py phân biệt delta này, giữ artifact bytes.

## Tái tạo và giới hạn

Commands:
```sh
npx vitest run shared/lunar/p4YiHeadingScope.test.ts shared/lunar/p4YiAny.test.ts shared/lunar/p4YiInputContract.test.ts shared/lunar/p4YiDayComposition.test.ts shared/lunar/p4YiOperands.test.ts shared/lunar/p4YiDomains.test.ts shared/lunar/p4YiTrace.test.ts
npx vitest run shared/lunar/p4YiCompatibility.test.ts shared/lunar/p4DayComposition.test.ts shared/lunar/p4FullDayComposition.test.ts shared/lunar/p4HeadingAnnotation.test.ts shared/lunar/p4LunarDayComposition.test.ts shared/lunar/p4LunarPhase.test.ts shared/lunar/p4PuzhuEnd.test.ts shared/lunar/p4SeasonDays.test.ts shared/lunar/p4SoilConvention.test.ts shared/lunar/p4YouweiScopes.test.ts
npm run lint
npm run typecheck
npm run build
python3 docs/audits/sources/p4-vol10/yi-integration-v1/check-mutations.py
python3 docs/audits/sources/p4-vol10/yi-integration-v1/verify-core-bodies.py
python3 docs/audits/sources/p4-vol10/yi-integration-v1/verify.py
graphify update .
```

Chạy mutation riêng sau khi mọi test/build xong. [Test output](test-results.json), [legacy](legacy-results.json), [validation](validation.json).

Chưa full unit/CI hoặc sweep31755/mutation6.x. New-day classified assertions là integration proof hạn chế, không thay independent real-day propagation Golden ở5.4. Raw/protected 忌, puzhu:28 và propagation behavior mới cần kiểm sâu ở5.4–5.7; 5.5 warehouse/王日 và5.6 dated provenance còn mở. 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 canonical OPEN, P5 deferred. Chưa commit/push/merge/deploy hoặc scoring activation.
