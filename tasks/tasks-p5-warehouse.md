# Tasks — P5: warehouse

Nguồn yêu cầu: [PRD P5](prd-p5-warehouse.md).
Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: **ĐANG LÀM** — task 1.0 baseline và 2.0 authority xong ([baseline](../docs/audits/sources/p4-vol10/p5-warehouse-baseline-v1/README.md), [authority](../docs/audits/sources/p4-vol10/p5-warehouse-authority-v1/README.md)); task 3.0 Golden freeze xong ([golden](../docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/README.md)); task 4.0 xong (`shared/lunar/p4Warehouse.ts`); next 5.1. Owner chốt D (giao 卷十 ∩ 卷十一) ngày 2026-10-16.

## Relevant Files

Tên file mới là đề xuất; chốt tên/contract trước implementation. Artifact, Golden và lock cũ là đầu vào bất biến, không sửa bytes.

- `tasks/prd-p5-warehouse.md` — yêu cầu, quyết định D, acceptance gate.
- `tasks/tasks-p5-warehouse.md` — checklist và evidence.
- `PROJECT_CONTEXT.md` — roadmap mục 6.
- `docs/plans/p4-xieji-vol10-balancing.md` — spec §6 warehouse, §7.1 coverage.
- `shared/almanac-data/xiejibianfangshu-yiji.json` — 宜/忌 heading 卷十一 (修倉庫, 開倉庫出貨財).
- `docs/audits/sources/p4-vol10/vol10.raw.txt` — 卷十 raw đã khóa (entry 收日/母倉/六合/五富/天倉).
- `docs/audits/sources/p4-vol10/yi-comparison-v1/` — xung đột 月恩/月德 đã ghi.
- `shared/almanac-data/p4-vol10-day-composition-v2.json` — deferral P5 hiện hành; chỉ đọc.
- `shared/almanac-data/p4-yi-operands-v1.json`, `shared/lunar/p4YiOperands.ts` — presence operand P4-C.
- `shared/lunar/p4YiDayComposition.ts`, `p4YiDayCore.ts`, `p4YiFullDayCore.ts`, `p4YiPredicates.ts`, `p4YiTrace.ts` — ghép 宜 và trace `deferred: 'P5'`.
- `shared/lunar/p4YiWarehouse.test.ts`, `docs/audits/sources/p4-vol10/yi-warehouse-v1/` — contract warehouse P4-C.
- `shared/almanac-data/p5-warehouse-v1.json` — mới: authority D.
- `shared/almanac-data/golden-p5-warehouse-v1.json`, `docs/audits/sources/p4-vol10/p5-warehouse-*-v1/` — mới: Golden và evidence.
- `shared/lunar/p4Warehouse.ts` / `p4Warehouse.test.ts` — mới: predicate audit-only.
- `docs/audits/p5-warehouse.md`, `docs/audits/p5-warehouse-2025-2027.tsv`, `docs/audits/p5-warehouse-summary.json` — mới: báo cáo.
- `scripts/audit-p4-warehouse-mutations.py` — mới: mutation runner (tên `p4*` để vào path-gate CI).
- `.github/workflows/ci.yml` — nối mutation gate.
- `docs/audits/p4-vol10-progress.md` — mục lục.

## Instructions for Completing Tasks

Đổi `- [ ]` thành `- [x]` khi sub-task thực sự xong và có evidence (file/commit/test/report) ghi cạnh checkbox. Task list không cho phép activation, merge hay deploy.

## Tasks

- [x] 0.0 Tạo nhánh và commit PRD
  - [x] 0.1 Nhánh `codex/p5-warehouse` từ `origin/main` (`1c4bb32`); ghi commit/tree bắt đầu. Evidence: bắt đầu tại `1c4bb32b939d8c5734d26e3d58a46077747f1fe1`, tree 4b32d9ab0338.
  - [x] 0.2 Commit PRD, task list, PROJECT_CONTEXT; mở PR docs hoặc giữ trên nhánh làm việc theo owner. Evidence: commit `067be05`, [PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) (giữ làm PR làm việc).

- [x] 1.0 Baseline và inventory operand — evidence [p5-warehouse-baseline-v1](../docs/audits/sources/p4-vol10/p5-warehouse-baseline-v1/README.md), generator `shared/lunar/p4WarehouseBaseline.test.ts` (verify bytes).
  - [x] 1.1 Từ sweep P4-C, lọc 539 dòng `warehouse_deferred` → ngày, base có mặt, partner có mặt; ghi commit/tree và authority IDs. Evidence: 539 dòng, 362 có thần trực tiếp, 177 không (101 có base). Phát hiện: 修倉庫 `yi: undefined` trên cả 1.095 ngày → phạm vi P5 = 1.095 dòng (PRD đã sửa).
  - [x] 1.2 Kiểm presence có provenance 協紀 cho 收日, 母倉, 六合, 五富, 天倉, 月恩, 月德, 四相, 時德, 開日 trên 1.095 ngày; liệt kê operand thiếu hoặc unknown. Thiếu authority (vd. 天倉) → dừng ở 2.x, hỏi owner nếu nguồn lệch. Evidence: 17 thần known trên 1.095 ngày, 0 unknown; provenance đủ (4D, 卷五 virtues, P3a, 12 Trực, 母倉 P4-C). 天倉 có định nghĩa P3a. Pre-check 收日+開日 = 0, 天倉+時德 = 0.
  - [x] 1.3 Kiểm 103 dòng `undetermined` ngoài P5 không thuộc warehouse; ghi danh sách để chứng minh P5 không đụng. Evidence: 103 dòng `OTHER_STATE_WITH_KNOWN_YI`, 0 dòng 修倉庫; 24 dòng 開倉庫出貨財 (宜 false, 忌 mở) → chuyển 5.2.
  - [x] 1.4 Baseline 開倉庫出貨財 trên 31.755 dòng: 宜/忌 trước–sau propagation, 甲日, `puzhu:22`. Evidence: state cuối only_ji 621 / not_recorded 162 / only_yi 159 / both 76 / neither 53 / undetermined 24; 甲日 110, 106 giữ 專忌, 4 ngày `puzhu:28` 諸事不忌 (卯甲戌, 未甲午) — owner override, 5.2 kiểm lại thứ tự ưu tiên.

- [x] 2.0 Authority `p5-warehouse-v1` — evidence [p5-warehouse-authority-v1](../docs/audits/sources/p4-vol10/p5-warehouse-authority-v1/README.md); `shared/almanac-data/p5-warehouse-v1.json`, builder `build.py` (Python độc lập, verify bytes), gate `shared/lunar/p4WarehouseAuthority.test.ts`.
  - [x] 2.1 Chép nguyên văn 卷十 năm entry và lời bàn 收日, 卷十一 heading 修倉庫/開倉庫出貨財; offset code point, SHA-1 raw, locator scan (卷十 `06067686.cn`, 卷十一 `06067687.cn` trang 39–40).
  - [x] 2.2 Bảng partner R10/R11 và bảng kết quả D (PRD FR-02/FR-03); status OWNER_ADOPTED_SOURCE_DEPENDENT, ngày 2026-10-16.
  - [x] 2.3 Đối chiếu thần trực tiếp hai quyển (天德, 月德, 天德合, 月德合, 天赦, 天願, 三合, 滿日) → ghi khớp.
  - [x] 2.4 Chứng minh độc lập đồng hiện không thể (收日+開日, 天倉+時德) trên 720 context; tìm thấy ca → dừng, phân loại.
  - [x] 2.5 Validation/lock file, review single-agent và giới hạn. Evidence: 11 span khớp offset code point, nguồn khớp manifest; truth table 160 dòng (135 agreed / 5 agreed_absent / 20 source_dependent); 720 context: 收日+開日 0, 天倉+時德 0; thần trực tiếp hai quyển khớp. Thứ tự heading chốt: unknown trước SOURCE_DEPENDENT (PRD FR-04 đã sửa). Giới hạn: single agent, 4 clause base chỉ có raw.

- [x] 3.0 Golden độc lập, freeze trước code — evidence [p5-warehouse-golden-v1](../docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/README.md); index `shared/almanac-data/golden-p5-warehouse-v1.json`, generator `derive.py` (Python độc lập, verify bytes), gate `shared/lunar/p4WarehouseGolden.test.ts`.
  - [x] 3.1 Fixture matrix: base-only, partner-only, từng partner, nhiều partner, mọi tổ hợp lệch, impossible, 德 trực tiếp, unknown mỗi phía, 母倉 ngoài coverage, sửa kho ≠ mở kho. Evidence: 167 fixture (mọi base × tập partner trừ 2 cặp impossible). Owner 2026-10-16: base unknown + mọi partner absent → không 宜.
  - [x] 3.2 Python reference độc lập (không import resolver), expected 720 context + miền ngày cho 母倉 soil / partner theo mùa. Evidence: 1.440 context (720 × soil) và 1.095 ngày (input từ P4-C frozen `MU_CANG_DATED_1095`, 20 ngày Tiết theo calendar-day). 修倉庫 2025–2027: 宜 588 / không 506 / SOURCE_DEPENDENT 1 (2025-10-08).
  - [x] 3.3 Expected 開倉庫出貨財 (PRD FR-07). Evidence: 宜 ANY trên 1.440 + 1.095; truth table 16 dòng `requireAll` × 甲日 × puzhu:28; 甲日 110 (106 giữ 專忌, 4 puzhu:28); presence 月煞 91 / 月厭 90 cho 5.2 (khớp engine 4.320/4.320 trên 1.440 context). Owner 2026-10-16: 甲日 trùng puzhu:28 → 諸事不忌 thắng 專忌 (đóng câu hỏi 1.4).
  - [x] 3.4 Review, integrity lock, commit freeze; ghi SHA-256 và commit. Evidence: so baseline engine sau khi viết expected: 0 lệch (82 lệch lần đầu đã phân loại: 天願 歴例→起例 GOLDEN_BUG, ngày Tiết CONVENTION_DIFFERENCE); 1.287 entry/58 lock P4 giữ bytes; freeze commit `fc5c1fb` (tree `a2f61b4`), [commit-proof.json](../docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/commit-proof.json) ở commit kế, không amend.

- [x] 4.0 Test đỏ và predicate audit-only — `shared/lunar/p4Warehouse.ts`, test `shared/lunar/p4Warehouse.test.ts`.
  - [x] 4.1 `graft callers` các symbol ghép 宜/trace P5; chốt entry point, giữ API P4-C. Evidence: `composeP4YiEvidence`/`resolveP4YiDay` chỉ có caller là test, không runtime. Composition v2: không dòng propagation/suppression nào lấy 修倉庫 làm nguồn. Chốt: lớp P5 `resolveP4WarehouseDay` bọc `resolveP4YiDay`; P4-C và test của nó giữ nguyên (vẫn `deferred: 'P5'` theo contract P4-C).
  - [x] 4.2 Test đỏ từ Golden frozen. Evidence: commit `0810b96`, đỏ 5/5 trên stub. Sửa test sau đỏ: so thêm trường `base` mà Golden ghi (thiếu map, không nới assertion).
  - [x] 4.3 `p4Warehouse.ts`: R10, R11, D, trace từng base, SOURCE_DEPENDENT riêng với unknown. Evidence: đọc partner từ authority `p5-warehouse-v1` (SHA-256 pin); Kleene + completion như `derive.py`; `IMPOSSIBLE_CO_PRESENCE` có code và pair; mỗi base trích clause R10 và heading R11. Xanh 5/5: 167 fixture, 1.440 context, 720 context end-to-end (母倉 unknown khi không có ngày), 1.095 ngày.
  - [x] 4.4 Ghép vào composer qua artifact version mới; bỏ `deferred: 'P5'`; giữ raw/protected 忌, override, `puzhu:28`. Evidence: output `p5-warehouse-day-v1` (artifact mới là authority `p5-warehouse-v1`; không cần composition JSON v3). 修倉庫 không còn `deferred`. SOURCE_DEPENDENT: `yi` undefined, state `undetermined`, tag `warehouse: 'SOURCE_DEPENDENT'` (chỉ 2025-10-08). Mọi heading khác (headings, pre-propagation, raw 忌, yiEvidence) deep-equal P4-C trên 1.095 ngày. Full suite 8.018 pass; typecheck, lint sạch; module không được runtime import.

- [ ] 5.0 Sweep, mutation, regression
  - [ ] 5.1 Sweep 31.755 dòng trước/sau → TSV + summary; 539 dòng P5 phân rã đủ, mỗi dòng có lý do.
  - [ ] 5.2 Xác minh 開倉庫出貨財 (FR-07); ghi lỗ hổng và phân loại.
  - [ ] 5.3 Mutation runner tuần tự (PRD FR-13), bytes phục hồi; nối CI.
  - [ ] 5.4 Regression A04b/P4-B/P4-C, unit, build, typecheck, lint; bundle so build local (thay `builtAt`) không đổi runtime.

- [ ] 6.0 Nghiệm thu
  - [ ] 6.1 Acceptance gate 8/8 (PRD §7) với evidence.
  - [ ] 6.2 `graphify update .`; cập nhật audit report, progress, PROJECT_CONTEXT.md.
  - [ ] 6.3 PR, CI xanh; merge/deploy chỉ khi owner cho phép.
