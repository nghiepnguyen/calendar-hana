# Tasks — P4-C: 11 operand 宜

Nguồn yêu cầu: [PRD P4-C](prd-p4c-yi-operands.md).
Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: Phase 2 — owner đã xác nhận **Go**; parent tasks và sub-tasks đã tạo. Đã tạo feature branch; chưa triển khai code.

## Relevant Files

Các file mới bên dưới là tên đề xuất; chốt tên/contract trước implementation và cập nhật danh sách khi thay đổi. Các artifact/Golden/lock cũ là đầu vào bất biến, không sửa bytes.

- `tasks/prd-p4c-yi-operands.md` — yêu cầu và gate 1A.
- `tasks/tasks-p4c-yi-operands.md` — checklist và evidence tiến độ từng sub-task.
- `PROJECT_CONTEXT.md` — roadmap và trạng thái nghiệm thu.
- `docs/plans/p4-xieji-vol10-balancing.md` — spec chung và ranh giới P5/full Golden/activation.
- `shared/almanac-data/p4-vol10-day-composition-v2.json` — inventory 11 unknown và warehouse deferred hiện hành; chỉ đọc, cần version mới nếu đổi artifact.
- `shared/almanac-data/xiejibianfangshu-yiji.json` — mapping 宜 theo heading 卷十一.
- `shared/almanac-data/xieji-god-definitions.json` — definitions hiện có để đối chiếu provenance.
- `shared/almanac-data/p4-yi-operands-v1.json` — mới: authority/predicate/input/coverage/heading của 11 thần.
- `shared/almanac-data/golden-p4-yi-operands-v1.json` — mới: Golden presence và phép ghép độc lập trong scope P4-C.
- `docs/audits/sources/p4-vol10/` — raw/scan/bản chép và các source/Golden lock mới; giữ lock lịch sử.
- `shared/lunar/p4YiOperands.ts` / `p4YiOperands.test.ts` — mới: provider presence audit và test 11 operand/authority/coverage.
- `shared/lunar/p4DayComposition.ts` / `p4DayComposition.test.ts` — `yiEvidence`, tokenizer, ghép ngày và oracle A04b phải bảo toàn.
- `shared/lunar/p4FullDayComposition.ts` / `p4FullDayComposition.test.ts` — đường ghép P4-B và regression full-day; chốt entry point P4-C trước sửa.
- `shared/lunar/p4YiComposition.test.ts` — mới: ANY/unknown/heading/propagation/override và sweep P4-C.
- `shared/lunar/p4ContextBridge.ts` / `p4ContextBridge.test.ts` — presence/deferral contract, tham chiếu nếu thiết kế yêu cầu.
- `shared/lunar/p4HeadingAnnotation.ts` / `p4HeadingAnnotation.test.ts` — normalization, protection và heading state.
- `shared/lunar/p4SeasonDays.ts` / `p4SeasonDays.test.ts` — 王日 regression control.
- `shared/lunar/p4RemainingJi.test.ts`, `p4LunarDayComposition.test.ts`, `p4LunarPhase.test.ts`, `p4PuzhuEnd.test.ts`, `p4SoilConvention.test.ts` — regression các authority/operand P4-B.
- `docs/audits/p4-vol10-yi-operands.md` — mới: nguồn, baseline, decisions, coverage và validation.
- `docs/audits/p4-vol10-yi-operands-2025-2027.tsv` / `p4-vol10-yi-operands-summary.json` — mới: báo cáo trước/sau với phân loại nguyên nhân.
- `docs/audits/p4-vol10-progress.md` — cập nhật mục lục và trạng thái P4-C.
- `scripts/audit-p4-yi-mutations.py` — mới: mutation runner và báo cáo restoration.
- `scripts/audit-p4-remaining-ji-mutations.py` — gate P4-B giữ nguyên ý nghĩa/assertion coverage.
- `.github/workflows/ci.yml` — nối gate P4-C và điều kiện deploy/reuse-audit nếu cần.

### Notes

- Inventory: 母倉、福德、天恩、天巫、天后、天醫、除神、驛馬、天馬、吉期、鳴吠. 王日 đã có operand, chỉ kiểm regression.
- Chỉ nghiệm thu khi **11/11 authority được chốt**. Thiếu/mâu thuẫn nguồn giữ unknown và P4-C chưa hoàn tất; không nghiệm thu partial.
- Authority và Golden độc lập phải khóa bằng commit/checksum trước implementation; không dùng output resolver/scorer để tạo expected.
- Audit-only: giữ runtime/manifest/scoring; P5 warehouse, full Golden P4, adapter và activation ngoài phạm vi.
- Giữ các quyết định P4-B, soil `OWNER_ADOPTED_SOURCE_DEPENDENT`, bảo vệ 忌 và override `puzhu:28`. Canonical S1 vẫn OPEN.
- Đo trước/sau 1.095 ngày × 29 heading; phân biệt thiếu operand 宜 của 11 thần với `undetermined` do P5/lý do khác. Trace phải giữ unknown ngay cả khi 宜 đã xác định nhờ thần khác.
- Unit test đặt cạnh code. Repo dùng Vitest: `npx vitest run <test-file>`; không dùng lệnh Jest trong ví dụ template.
- Mutation chạy tuần tự và phục hồi đúng bytes; các kiểm tra khác không chạy đồng thời khi source đang bị mutate.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` khi task đã thực sự hoàn tất và có evidence. Sau Phase 2, cập nhật sau từng sub-task, không chờ xong toàn bộ parent task. Chưa đạt gate 11/11 thì không đánh dấu nghiệm thu hoặc chuyển roadmap sang P5.

Owner đã xác nhận **Go** để tạo danh sách chi tiết. Task list này không tự cho phép implementation, activation hoặc merge/deploy. Mỗi sub-task hoàn tất phải có file/commit/test/report tương ứng; ghi evidence cạnh checkbox hoặc trong audit report có liên kết.

## Tasks

- [x] 0.0 Create feature branch — tạo nhánh `codex/` cho P4-C từ baseline có P4-B đã merge, giữ các thay đổi tài liệu hiện có.
  - [x] 0.1 Kiểm tra branch/status/upstream và local release-evidence commit `b12f024`; xác định phần tài liệu đang thay đổi trước khi chuyển nhánh, không reset hoặc bỏ file. Evidence: bắt đầu trên `main`, upstream `origin/main`; local commit `b12f024` chưa push; chỉ có `PROJECT_CONTEXT.md` sửa và hai file PRD/task mới.
  - [x] 0.2 Tạo và checkout nhánh `codex/p4c-yi-operands` từ baseline chứa P4-B merge `1ad9b4b`, bảo toàn commit/tài liệu local và ghi starting commit/tree. Evidence: nhánh `codex/p4c-yi-operands` bắt đầu tại `b12f02438433ea7b039c4bd4695fabac9c92cfcd`, tree `c571965d4d21c7fee801b893e829788a899bf404`; merge `1ad9b4b` là ancestor, release evidence và các tài liệu local được giữ.
  - [x] 0.3 Commit PRD/task list/context vào nhánh P4-C trước implementation; xác nhận working tree không có thay đổi không rõ nguồn. Evidence: commit `73aa326` chứa PRD/task/context; `git status --short` rỗng sau commit; format và diff check qua.

- [ ] 1.0 Khóa baseline và inventory — xác nhận 11 operand thiếu, mapping heading/input hiện hành và số liệu trước thay đổi trên 1.095 ngày.
  - [x] 1.1 Kiểm tra `yiEvidence.unknown` đúng 11 tên; 王日 nằm trong seasonDays, 修倉庫 còn deferred cho P5. Evidence: đọc artifact v2 tại baseline `db382ba`; 11 tên khớp PRD, chưa đổi artifact/evaluator.
  - [x] 1.2 Lập bảng 11 thần → tên/alias/stable ID hiện có → heading 宜 trong 卷十一; kiểm normalization và các heading không thuộc phạm vi catalog. Evidence: inventory.json khóa mapping raw/normalized/activities; 除神 có ID tru_than, 10 tên khác chưa có catalog ID đã kiểm; không có entry authority hiện hành cho cả 11.
  - [x] 1.3 Ghi nguồn input Month Jian/pillar/lunar day/phase/soil và authority IDs của sweep; liệt kê input bổ sung cần điều tra, chưa giả định predicate. Evidence: inputs.json ghi providers/authority IDs, timezone/coverage và input gaps task 2; chưa chốt predicate mới.
  - [x] 1.4 Lưu baseline trước thay đổi đủ 1.095 ngày × 29 heading, commit/tree/hash và phương pháp tái tạo; giữ báo cáo P4-B cũ bất biến. Evidence: baseline.tsv có 31.755 dòng và checkpoint db382ba/tree ad1de4d; lock.json khóa outputs/inputs/runner; verify không ghi đè.
  - [x] 1.5 Đếm riêng unresolved operand 宜 theo từng thần/heading, tổng heading undetermined và lý do P5/khác; kiểm baseline có 0 unresolved operand 凶 với đủ input P4-B. Evidence: summary.json phân nhóm raw unknown/masked/P5/final undetermined theo thần và heading; 0 unresolved operand 凶, 0 conflict; khớp 31.755 dòng P4-B.
  - [x] 1.6 Ghi baseline runtime/manifest và bundle SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` vào audit report. Evidence: inputs.json/lock.json ghi manifest hash và bundle đo sau build; SHA-256 trùng baseline; build/main/functions typecheck và lint qua.

- [ ] 2.0 Chốt authority 11/11 thần — đọc nguồn 協紀, khóa nguyên văn/locator/offset/checksum, predicate/input/coverage và đối chiếu definitions/bảng hiện có; xử lý mọi điểm chưa chốt trước nghiệm thu.
  - [ ] 2.1 Thu thập raw/scan cần thiết, lưu bytes/checksum và locator; quy định offset Unicode code point và mẫu entry authority thống nhất.
  - [ ] 2.2 Chốt entry 母倉: nguyên văn, predicate/input/coverage, alias, heading, ngoại lệ và đối chiếu definitions/bảng sẵn có.
  - [ ] 2.3 Chốt entry 福德 với cùng bộ evidence và đối chiếu; không suy từ nhãn sao trùng tên.
  - [ ] 2.4 Chốt entry 天恩 với cùng bộ evidence; xác định chính xác input/chu kỳ mà nguồn yêu cầu.
  - [ ] 2.5 Chốt entry 天巫 với cùng bộ evidence và đối chiếu.
  - [ ] 2.6 Chốt entry 天后 với cùng bộ evidence và đối chiếu.
  - [ ] 2.7 Chốt entry 天醫 với cùng bộ evidence và đối chiếu.
  - [ ] 2.8 Chốt entry 除神 với cùng bộ evidence; phân biệt tên thần với 除日 và các nhãn tương tự nếu nguồn yêu cầu.
  - [ ] 2.9 Chốt entry 驛馬 với cùng bộ evidence; phân biệt authority/input của scope này với các cách tính ngoài P4-C.
  - [ ] 2.10 Chốt entry 天馬 với cùng bộ evidence và đối chiếu.
  - [ ] 2.11 Chốt entry 吉期 với cùng bộ evidence và đối chiếu.
  - [ ] 2.12 Chốt entry 鳴吠 với cùng bộ evidence; không tự gộp alias hoặc biến thể ngoài định nghĩa đã khóa.
  - [ ] 2.13 Tổng hợp khác biệt raw/scan/definitions/bảng, cách đọc thay thế và kết luận; điểm chưa đủ căn cứ giữ unknown và chỉ xin quyết định owner khi thực sự cần.
  - [ ] 2.14 Hoàn thiện authority version mới với ID/status/nguồn/input/coverage/heading cho từng entry; ghi reviewer và giới hạn review, không tự nhận review độc lập thứ hai.
  - [ ] 2.15 Kiểm gate **11/11 authority đã chốt**; nếu chưa đủ, ghi vấn đề mở và giữ task 2.0/P4-C chưa hoàn tất, không tự nghiệm thu partial.

- [ ] 3.0 Đóng băng Golden độc lập trước code — bao phủ 11 thần, present/absent, biên predicate, missing input, coverage và alias; kiểm miền 720 context khi phù hợp và miền riêng cho input bổ sung.
  - [ ] 3.1 Lập ma trận fixture 11 thần × present/absent/biên/thiếu input/ngoài coverage/alias áp dụng; ghi ca nào không áp dụng và lý do.
  - [ ] 3.2 Tạo expected từ nguồn và phép tính độc lập; ghi derivation mỗi fixture, không import/call production resolver/scorer hoặc evaluator sẽ được kiểm.
  - [ ] 3.3 Bao phủ 720 Month Jian × pillar context cho predicate chỉ cần hai input đó; chốt fixture/domain riêng cho predicate cần input khác, không suy coverage từ 720 context.
  - [ ] 3.4 Khóa expected phép ghép 宜 ANY, known absent, unknown được che bởi present nhưng còn trong trace, normalization, protection/override và warehouse deferred.
  - [ ] 3.5 Review tính độc lập, tính hợp lệ pillar/input và độ phủ; ghi người review/giới hạn cùng corrections có phân loại nếu phát hiện lỗi.
  - [ ] 3.6 Đóng băng authority/Golden/nguồn bằng commit/checksum và source lock mới trước implementation; kiểm mọi artifact/Golden/lock cũ giữ bytes.

- [ ] 4.0 Viết test đỏ và triển khai presence audit-only — trả present/absent/unknown cùng authority/input/source trace, giữ API/oracle cũ và artifact versioned.
  - [ ] 4.1 Kiểm callers/blast radius của API dự kiến thay; chốt contract provider/input/trace và entry point P4-C bảo toàn mặc định/oracle A04b/P4-B, không tạo import vào production.
  - [ ] 4.2 Viết test kiểm lock/raw offset và fixture presence cho 11 thần; ghi nhận assertion đỏ trước implementation thay vì chỉ lỗi import thiếu module.
  - [ ] 4.3 Viết test missing input/outside coverage → unknown và malformed input → lỗi rõ ràng; kiểm trace không bỏ unknown khi heading đã có evidence khác.
  - [ ] 4.4 Triển khai provider 11 predicate từ authority đã khóa, chỉ dùng đúng input/coverage của từng rule; không tự tạo presence từ label/score.
  - [ ] 4.5 Xuất authority/rule ID, input đã dùng, presence và source reference đủ tái hiện; kiểm alias được chuẩn hóa mà không gộp scope khác.
  - [ ] 4.6 Chạy test presence/coverage/lock đã viết và typecheck/lint phù hợp; kiểm source/Golden hashes bất biến trước ghép heading.

- [ ] 5.0 Ghép operand 宜 vào audit ngày — giữ rule ANY hiện hành, chuẩn hóa heading, ghi unknown riêng và bảo toàn raw/protected 忌, override và deferral P5.
  - [ ] 5.1 Viết regression đỏ cho heading được từng thần cung cấp 宜 và negative heading không được liệt kê; kiểm normalization tên nguồn/key evaluator.
  - [ ] 5.2 Viết test present → true, toàn bộ absent → false, không present/còn unknown → unknown và danh sách rỗng → false theo contract; giữ unresolved trace ngay cả khi có present khác.
  - [ ] 5.3 Ghép provider vào đường audit đã chốt trước propagation, giữ default/API/oracle lịch sử; tạo artifact version mới nếu inventory/vocabulary phải đổi.
  - [ ] 5.4 Kiểm raw/protected 忌 và `puzhu:28` trên listed/unlisted ngày, gồm 六月甲午/甲子; bổ sung Golden độc lập cho thay đổi propagation có nghĩa do 宜 mới.
  - [ ] 5.5 Kiểm 王日 và các operand 宜 đã có không đổi; 修倉庫 giữ deferred P5 dù 母倉 present, không tự thêm warehouse co-presence rule.
  - [ ] 5.6 Kiểm input lunar day/phase/soil và status OWNER_ADOPTED_SOURCE_DEPENDENT được giữ trong trace; missing/out-of-coverage vẫn unknown đúng scope.
  - [ ] 5.7 Chạy gate phép ghép và regression A04b/P4-B; giải thích mọi khác biệt có căn cứ mà không sửa Golden cũ hoặc giữ số đếm baseline bằng fixture giả.

- [ ] 6.0 Tạo báo cáo trước/sau và chứng minh regression/mutation — quét đủ 31.755 dòng, giải thích thay đổi heading/propagation, giữ 0 unresolved operand 凶 và bắt mọi mutation đã đăng ký bằng assertion.
  - [ ] 6.1 Tạo runner/test sweep trên cùng 1.095 ngày, input và 29 heading của baseline; đặt timeout phù hợp CI và lệnh tái tạo report rõ ràng.
  - [ ] 6.2 Xuất TSV trước/sau có presence/trace liên quan, 宜, raw/effective 忌, protected flags, heading state, unresolved và propagation; kiểm số dòng/cột và khả năng truy ngược evidence.
  - [ ] 6.3 Xuất summary theo từng thần/heading: authority coverage, missing input, thiếu operand 宜 của 11 thần, undetermined P5/khác và các transition có lý do.
  - [ ] 6.4 Kiểm miền đủ input không còn thiếu chính 11 operand và unresolved operand 凶 vẫn 0; rà mọi source conflict/regression mới, không yêu cầu tổng undetermined bằng 0.
  - [ ] 6.5 Đăng ký mutation có ý nghĩa cho từng loại predicate thực tế và phép ghép: bỏ operand, sai bảng/offset/chu kỳ/input, unknown thành absent, sai heading, bỏ protection/override.
  - [ ] 6.6 Triển khai runner tuần tự với timeout, assertion-caught detection và phục hồi bytes trong finally; report phải phân biệt assertion bắt lỗi với lỗi tooling/import/timeout.
  - [ ] 6.7 Chạy toàn bộ mutation đã đăng ký, kiểm bắt hết bằng assertion và source hashes phục hồi; không chạy unit/build hoặc sửa source song song trong lúc mutate.
  - [ ] 6.8 Rà changed rows/propagation với source/Golden; ghi corrections hoặc quyết định owner minh bạch, không lấy tổng số giảm unknown làm oracle.

- [ ] 7.0 Hoàn tất CI, evidence và nghiệm thu 1A — nối gate P4-C, kiểm unit/build/typecheck/lint/runtime checksum, cập nhật graph/audit report/PROJECT_CONTEXT.md và chỉ chốt hoàn tất khi đủ mọi gate PRD.
  - [ ] 7.1 Nối mutation gate P4-C vào CI, đặt timeout phù hợp và bắt buộc trong dependency/condition deploy; nếu reuse-audit liệt kê required jobs thì bổ sung gate mới.
  - [ ] 7.2 Chạy full unit, main/functions typecheck, lint, formatting và build sau khi mutation đã phục hồi; chạy regression/gate bổ sung khi có failure hoặc thay đổi cần kiểm chứng.
  - [ ] 7.3 Kiểm diff runtime/manifest/scoring và checksum bundle so baseline; bất kỳ runtime delta chưa được duyệt riêng đều chặn nghiệm thu.
  - [ ] 7.4 Chạy `graphify update .` sau code changes; hoàn thiện audit report với command, commit/hash, reviewer, coverage, unresolved và các giới hạn nguồn.
  - [ ] 7.5 Commit/push nhánh P4-C và chuẩn bị PR có scope/validation cuối; theo dõi CI đúng HEAD và xử lý findings đến khi xanh, không tự merge/deploy.
  - [ ] 7.6 Đối chiếu toàn bộ acceptance gate PRD §8: 11/11 authority/presence, Golden độc lập, 31.755 dòng, 0 thiếu operand 凶, mutation/restoration, CI và runtime bất biến; gate thiếu thì P4-C chưa hoàn tất.
  - [ ] 7.7 Cập nhật task checkboxes/evidence, audit progress và PROJECT_CONTEXT.md theo kết quả thật; chỉ ghi P5 là bước tiếp theo khi P4-C đã đạt gate, giữ S1 canonical OPEN.
