# Tasks — P4-B follow-up: 鋪註 puzhu:06

Nguồn yêu cầu: [PRD puzhu:06](prd-p4b-puzhu06.md).
Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: owner chốt **Q1 không, Q2 không, Q3 không, Q4 có, Q4a chặn** (2026-10-16; PRD §8). Xong: 1.0 baseline (`6f970cd`), 2.0 authority v1 (`718e195`), 3.0 Golden v1 (`4a7da71`), 3.5 authority v2 (`c3aedf6`) và Golden v2 (`67af7c0`, commit-proof ở commit kế). Golden dùng cho 4.x là **v2**: gỡ 68 / giữ 645 / hold 11. **Next: 4.2 test đỏ từ Golden v2** (chưa có code puzhu:06).

## Relevant Files

Tên file mới là đề xuất; chốt tên và contract ở task 2.0. Artifact, Golden và lock cũ là đầu vào bất biến, không sửa bytes.

- `tasks/prd-p4b-puzhu06.md` — yêu cầu, baseline 724 dòng, câu hỏi owner, acceptance gate.
- `tasks/tasks-p4b-puzhu06.md` — checklist và evidence.
- `shared/almanac-data/p4-vol10-authority.json` — `puzhu:06` (offset 21817), grade 等第 (中 9720, 次 9743, 下 9766); chỉ đọc.
- `docs/audits/sources/p4-vol10/vol10.raw.txt` — 卷十 raw đã khóa (entry 月破, 災煞, 月煞, 平日, 月刑, 九空, 五虛, 小耗, 五離, 五墓…).
- `shared/almanac-data/p4-vol10-grade-resolution-v2.json` — `actionEffect` (only_ji ↔ as_usual/still_avoid); chỉ đọc.
- `shared/almanac-data/p4-vol10-day-composition-v2.json`, `p4-vol10-remaining-ji-v7.json`, `p4-puzhu-end-v1.json` — composition, remaining-ji, puzhu:27/28; chỉ đọc.
- `shared/lunar/p4YiDayComposition.ts` (`resolveP4YiDay`), `p4YiFullDayCore.ts`, `p4YiDayCore.ts`, `p4HeadingAnnotation.ts` (`resolveP4Headings`, `getP4YouweiScopes`), `p4GradeResolution.ts` (`resolveP4Grades`, `presentP4De`), `p4RemainingJi.ts`, `p4DayComposition.ts` (`applyP4Propagation`) — nguồn 忌 và propagation; không sửa.
- `shared/lunar/p4YiSweep.test.ts` — mẫu lặp 1.095 ngày (`mansion-decision-baseline-v1.json`) và verify bytes.
- `docs/audits/p4-vol10-yi-operands-2025-2027.tsv` — sweep P4-C, trạng thái "before".
- `shared/almanac-data/p4b-puzhu06-v1.json` — mới: authority và cách đọc owner.
- `docs/audits/sources/p4-vol10/p4b-puzhu06-baseline-v1/` — mới: baseline 724 dòng (generator + TSV + summary).
- `docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/`, `shared/almanac-data/golden-p4b-puzhu06-v1.json` — mới: Golden (Python `derive.py`, expected, lock, commit-proof).
- `shared/lunar/p4Puzhu06.ts` / `p4Puzhu06.test.ts` — mới: lớp composer audit-only `resolveP4Puzhu06Day`.
- `shared/lunar/p4Puzhu06Baseline.test.ts`, `p4Puzhu06Authority.test.ts`, `p4Puzhu06Golden.test.ts`, `p4Puzhu06Sweep.test.ts` — mới: gate.
- `docs/audits/p4b-puzhu06.md`, `docs/audits/p4b-puzhu06-2025-2027.tsv`, `docs/audits/p4b-puzhu06-summary.json` — mới: báo cáo.
- `scripts/audit-p4-puzhu06-mutations.py` — mới: mutation runner (tên `p4*` để vào path-gate CI).
- `.github/workflows/ci.yml` — nối mutation gate.
- `docs/audits/p4-vol10-progress.md`, `PROJECT_CONTEXT.md` — mục lục, dòng F1.

### Notes

- Test chạy bằng `npx vitest run <path>`. Generator verify bytes khi chạy thường và ghi lại khi có env `P4B_PUZHU06_WRITE=1`, theo mẫu P4-C/P5.
- Module audit-only không được runtime import. Kiểm bằng `graft callers` và so bundle.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` khi sub-task thực sự xong và có evidence (file, commit, test hoặc report) ghi cạnh checkbox. Task list không cho phép activation, merge hay deploy.

## Tasks

- [x] 0.0 Tạo nhánh và commit PRD
  - [x] 0.1 Nhánh `claude/p4b-puzhu06` từ `origin/main` `1c4bb32` (tree `4b32d9ab0338`). P5 (PR #60) chưa merge; nhánh này không phụ thuộc P5 về code.
  - [x] 0.2 Commit PRD và task list; giữ trên nhánh làm việc. PROJECT_CONTEXT chưa sửa, vì dòng F1 chỉ có trên nhánh P5.
  - [x] 0.3 Baseline pre-PRD (PRD §2): 724 ứng viên khớp P5 F1; phân loại 254 giữ / 459 tùy owner / 11 undetermined; bảng 16 tổ hợp Q. Probe tạm không commit; TSV nằm trong ghi chú nhóm session.

- [x] 1.0 Baseline chính thức trong repo — commit `6f970cd`, [README](../docs/audits/sources/p4-vol10/p4b-puzhu06-baseline-v1/README.md)
  - [ ] 1.1 Generator `p4Puzhu06Baseline.test.ts`: 1.095 ngày × 5 heading. Ghi presence chín thần, `ji`/`protectedJi`/state cuối, từng nguồn 忌 kèm clauseEffect, grade 等第, `dePresent`, 又為, remaining-ji effect và puzhuEnd. Ghi commit/tree và authority IDs. Evidence: `baseline.tsv` 5.475 dòng + `context.tsv` 3.600 dòng, engine trên main `1c4bb32`; presence chín thần lấy từ trace 宜 P4-C (không phụ thuộc P5).
  - [ ] 1.2 Tạo lại 724 dòng và phân loại lớp (猶忌 / 諸事皆忌 / puzhu27 / AN / AD / AU / QL / 又為 / defer / undetermined); số phải khớp PRD §2. Lệch thì dừng và phân loại (`BASELINE_DRIFT`). Evidence: generator assert 724 ứng viên (133/153/159/139/140). Phân lớp nằm ở Golden (3.2), không ở baseline; Golden validation khớp PRD §2/§8 (77 lift, 11 hold, 254 ngoại lệ).
  - [ ] 1.3 Đếm 忌 protected trên ngày puzhu:06 cho năm heading (百忌 甲日, `only_avoid`, 又為 專忌, lunar/phase/soil) để làm negative set cho FR-05. Evidence: protected trên ngày puzhu:06: 開倉庫 119, 安牀 61, 開市/立券/納財 36 mỗi heading.
  - [ ] 1.4 Ghi tương tác `puzhu:22`: các ngày mà lift puzhu:06 trên 開市 và 立券交易 có thể kích hoạt propagation sang 開倉庫出貨財. Evidence: 0 ứng viên `neither_recorded`; lift chỉ ra only_yi/not_recorded/undetermined, nên puzhu:22 (cần 相抵) không bao giờ kích hoạt do puzhu:06.
  - [ ] 1.5 Xác nhận 進人口, 經絡 và 醞釀 không thuộc 29 heading (`P4_DAY_HEADINGS`). Evidence: assert trong generator và gate authority.

- [x] 2.0 Câu hỏi owner và authority `p4b-puzhu06-v1` — commit `718e195`, [README](../docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v1/README.md)
  - [x] 2.1 Ghi câu trả lời Q1–Q4 kèm ngày; status `OWNER_ADOPTED`, không phải canonical. Evidence: owner 2026-10-16 chốt không/không/không/có, ghi trong PRD §8. Dự kiến gỡ 77 dòng; Golden 3.x phải tái lập con số này độc lập.
  - [ ] 2.2 Chép nguyên văn puzhu:06; mọi clause 如常例, 猶忌 và 諸事皆忌 của các entry chạm 724 dòng (月破, 月建, 平日, 收日, 閉日, 刼煞, 災煞, 月煞, 月刑, 月害, 月厭, 大時, 天吏); grade 中/次/下; remaining-ji 九空, 五虛, 小耗, 五離, 五墓; puzhu:27. Kèm offset code point, SHA-1 raw và locator scan. Evidence: 23 span khớp offset code point (gate); puzhu:06 21817, grade và puzhu:27 khớp lock P4 cũ; raw pin bằng SHA-256. Lệch so với kế hoạch: chỉ chép clause đại diện cho từng lớp (月破 猶忌/大耗, 災煞, 月煞/月虛, 九空 defer) cùng năm danh sách gỡ Q4. clauseEffect của các entry khác (月建, 平日, 收日…) lấy từ lock P4-B đã khóa (`xiejibianfangshu-vol10-yiji.json`), không chép lại.
  - [ ] 2.3 Bảng quyết định lớp nguồn → gỡ/giữ theo Q1–Q4 (PRD FR-02..FR-05); kế thừa 又為 và defer. Evidence: `classes` (9 lớp → keep/lift/hold/untouched), `inherit` (via, 又為大耗→月破, 又為月虛→月煞, defer đọc từ remaining-ji v7), `rowRule`, `stateAfterLift`.
  - [ ] 2.4 Validation và lock file; builder Python độc lập có verify bytes; gate `p4Puzhu06Authority.test.ts`. Review single-agent, ghi giới hạn. Evidence: `validation.json`, `lock.json` (7 file), gate 3/3 xanh.

- [x] 3.0 Golden độc lập, đóng băng trước code — freeze `4a7da71`, [README](../docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/README.md)
  - [ ] 3.1 Fixture matrix (PRD FR-09): mỗi thần kích hoạt; mỗi lớp nguồn; nhiều nguồn với nguồn chặt nhất thắng; 忌 protected; heading ngoài danh sách; puzhu:28; `puzhu:22`. Evidence: 95 fixture (lift 22, keep 46, hold 15, untouched 8, SPEC_GAP 4). `puzhu:22` không cần fixture vì lift không tạo `neither_recorded` (1.4).
  - [ ] 3.2 Python reference `derive.py` không import resolver hay composer. Đầu vào là các lock đã khóa (clause, grade, remaining-ji, presence). Expected cho 720 context và 1.095 ngày. Evidence: stdlib; presence chín thần và puzhu:28 tính lại từ bảng 卷五/卷十 có kiểm nguyên văn; đầu vào frozen: P4-C sweep TSV và inventory nguồn 忌 của baseline 1.0 (giới hạn đã ghi). Dated: lift 77 (37 ngày), keep 636, hold 11.
  - [ ] 3.3 So với baseline 1.x sau khi viết expected. Phân loại mọi lệch (`GOLDEN_BUG`, `ENGINE_BUG`, `CONVENTION_DIFFERENCE`) và không nới assertion. Evidence: so engine 9.075 dòng: 0 lệch. So PRD: 10 dòng lệch ở lần chạy đầu (巳丙午 2026-06-01, 2027-05-27) → `GOLDEN_BUG` (thiếu quy tắc P4-C 止忌 undetermined + 宜 false → not_avoided), sửa ở derive.py, thêm 2 fixture; không sửa expected bằng tay.
  - [ ] 3.4 Integrity lock (SHA-256); commit freeze; `commit-proof.json` ở commit kế, không amend. Kiểm lock P4-B/P4-C/P5 cũ giữ bytes. Evidence: freeze `4a7da71` (tree `c51a08c`), [commit-proof.json](../docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/commit-proof.json) ở commit kế; `git diff origin/main` chỉ có file mới; full `shared/lunar` 100 file / 7.008 test xanh.

- [x] 3.5 Owner trả lời Q4a (PRD §8). Nếu "chặn": tạo `p4b-puzhu06-v2` và `golden-p4b-puzhu06-v2`, đóng băng lại, ghi commit-proof mới; v1 giữ nguyên bytes. Evidence: owner 2026-10-16 chọn chặn. Authority v2 `c3aedf6` ([README](../docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v2/README.md)): `liftExclusions` 五墓 → 天德合, 月德合, lớp `QL_EXCLUDED` (keep), 24 span. Golden v2 freeze `67af7c0` ([README](../docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v2/README.md)): 102 fixture; dated gỡ 68 (34 ngày), giữ 645, hold 11; v1 → v2 chỉ đổi 9 dòng 五墓 巳丙戌 (lift → keep), 0 thay đổi ngoài dự kiến; 0 lệch engine; gate v1 và v2 đều xanh.

- [ ] 4.0 Test đỏ và composer opt-in
  - [ ] 4.1 `graft callers resolveP4YiDay` và các symbol nguồn 忌; chốt entry point `resolveP4Puzhu06Day` bọc `resolveP4YiDay`. Giữ API P4-C (và P5 nếu đã merge, xem PRD §6).
  - [ ] 4.2 Test đỏ từ Golden **v2** frozen, commit riêng, chạy đỏ trên stub.
  - [ ] 4.3 `p4Puzhu06.ts`:
    - đọc authority **v2** (SHA-256 pin), gồm `liftExclusions`;
    - phân lớp nguồn theo bảng 2.3;
    - lift trước `applyP4Propagation`;
    - chỉ đổi `ji`/`state`, không đổi 宜 (FR-06);
    - trace FR-07;
    - không chạm 忌 protected, puzhu:27 hay puzhu:28;
    - ném `SPEC_GAP` khi một nguồn as_usual có grade mà `gradeAction` khác `only_ji`. Trên baseline 9.075 dòng không có trường hợp nào (kiểm sau freeze), nhưng lớp AN/AD dựa vào điều này.
  - [ ] 4.4 Output version `p4b-puzhu06-day-v1`. Mọi field ngoài năm heading deep-equal P4-C trên 1.095 ngày. Full suite, typecheck và lint sạch; không có runtime import.

- [ ] 5.0 Sweep, mutation, regression
  - [ ] 5.1 `p4Puzhu06Sweep.test.ts`: 1.095 × 29 trước/sau → `docs/audits/p4b-puzhu06-2025-2027.tsv` và summary. 724 dòng phân rã khớp Golden, mỗi dòng có lý do; 0 đổi ở heading khác; 0 đổi trên 忌 protected; `undetermined` ngoài phạm vi giữ nguyên.
  - [ ] 5.2 Ghi từng ví dụ PRD §8 (2025-01-22, 2025-01-11, 2025-01-26, 2025-04-11, 2025-01-15) trước/sau trong báo cáo.
  - [ ] 5.3 Mutation runner `scripts/audit-p4-puzhu06-mutations.py` (PRD FR-11): tuần tự, bắt bằng assertion, phục hồi bytes; ghi kết quả JSON; nối job CI và gate deploy.
  - [ ] 5.4 Regression A04b/P4-B/P4-C (và P5 nếu đã merge), unit, build, typecheck main/functions, lint. So bundle với build local cùng SHA (thay `builtAt`): runtime không đổi.

- [ ] 6.0 Nghiệm thu
  - [ ] 6.1 Acceptance gate 7/7 (PRD §7) kèm evidence.
  - [ ] 6.2 `graphify update .`; cập nhật báo cáo, `p4-vol10-progress.md` và PROJECT_CONTEXT.md (dòng F1).
  - [ ] 6.3 PR, CI xanh; merge hay deploy chỉ khi owner cho phép.
