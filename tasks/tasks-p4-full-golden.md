# Tasks — Roadmap 7: Full Golden P4

Nguồn yêu cầu: [PRD](prd-p4-full-golden.md).
Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: PRD chốt 2026-10-17; task 1.0 xong ([inventory](../docs/audits/sources/p4-vol10/p4-full-golden-v1/inventory.md)); 3.1 xong ([presence](../docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/README.md)); 2.1 xong ([câu hỏi hold](../docs/audits/p4-full-golden-hold-questions.md), owner chốt H1-B, H2-A); 3.2 xong ([lớp 忌](../docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/README.md), owner chốt F1/F4/F5); 3.3 xong ([trạng thái ngày](../docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/README.md)); 3.4 xong ([checks](../docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/checks.json)); 4.0 đóng băng ([README](../docs/audits/sources/p4-vol10/p4-full-golden-v1/README.md)); 5.0–7.0 xong ([báo cáo](../docs/audits/p4-full-golden.md); owner chốt 德作建論 (i) → cần Golden v2); next: Golden v2, rồi 8.0.

## Relevant Files

- `tasks/prd-p4-full-golden.md`, `tasks/tasks-p4-full-golden.md`
- `docs/plans/p4-xieji-vol10-balancing.md` — spec §7.1.
- `docs/audits/sources/p4-vol10/*/derive.py`, `yi-domains-v1/domains.py` — Golden từng phần (chỉ đọc).
- `shared/almanac-data/xieji-god-definitions.json`, `xiejibianfangshu-yiji.json`, `p4-*.json`, `p5-warehouse-v1.json`, `p4b-puzhu06-v3.json` — authority (chỉ đọc).
- `docs/audits/sources/p4-vol10/p4-full-golden-v1/` — mới: inventory, derive.py, context.tsv, dated.tsv, jie.tsv, lock, commit-proof.
- `shared/almanac-data/golden-p4-full-v1.json` — mới: index.
- `shared/lunar/p4FullGolden.test.ts` — mới: gate.
- `scripts/audit-p4-full-golden-mutations.py` — mới.
- `docs/audits/p4-full-golden.md`, `docs/audits/p4-full-golden-hold-questions.md` — mới.
- `docs/audits/p4-vol10-progress.md`, `PROJECT_CONTEXT.md`.

## Tasks

- [x] 1.0 Inventory input
  - [x] 1.1 Liệt kê mọi file mỗi derive.py P4 đọc, phân loại theo FR-01
  - [x] 1.2 Với mỗi `ENGINE_OUTPUT`: tìm Golden đóng băng thay thế hoặc ghi "suy lại"
  - [x] 1.3 Đo gap: phần nào của 720×29 / 1095×29 chưa có expected độc lập
- [x] 2.0 Bộ câu hỏi hold (song song, không chặn)
  - [x] 2.1 Trích nguồn + phương án cho 月煞 卯/酉 相抵 + 又為月虛, 未月戊午 閉日/天吏, 德願
- [x] 3.0 Derive độc lập
  - [x] 3.1 Presence 35 thần từ definitions; fixture exact Jie 21 thần
  - [x] 3.2 忌 P4-B toàn miền (entry, puzhu, soil, ngày âm, 朔弦望, puzhu:28)
  - [x] 3.3 Ghép 宜 P4-C (Golden đóng băng), warehouse P5, puzhu:06, propagation
  - [x] 3.4 Self-check: exact Cartesian set, uniqueness, bất biến FR-03
- [x] 4.0 Freeze: lock, checksum, commit-proof, gate test
- [x] 5.0 Oracle chéo với Golden từng phần; phân loại lệch
- [x] 6.0 So engine toàn miền; phân loại lệch
- [x] 7.0 Mutation runner FR-07
- [ ] 8.0 Báo cáo, `ci:local`, owner review, cập nhật PROJECT_CONTEXT
