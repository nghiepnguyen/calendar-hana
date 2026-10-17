# Tasks — Roadmap 7: Full Golden P4

Nguồn yêu cầu: [PRD](prd-p4-full-golden.md).
Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: PRD chốt 2026-10-17; task 1.0 xong ([inventory](../docs/audits/sources/p4-vol10/p4-full-golden-v1/inventory.md)); 3.1 xong ([presence](../docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/README.md)); next 2.1 / 3.2.

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
- [ ] 2.0 Bộ câu hỏi hold (song song, không chặn)
  - [ ] 2.1 Trích nguồn + phương án cho 月煞 卯/酉 相抵 + 又為月虛, 未月戊午 閉日/天吏, 德願
- [ ] 3.0 Derive độc lập
  - [x] 3.1 Presence 35 thần từ definitions; fixture exact Jie 21 thần
  - [ ] 3.2 忌 P4-B toàn miền (entry, puzhu, soil, ngày âm, 朔弦望, puzhu:28)
  - [ ] 3.3 Ghép 宜 P4-C (Golden đóng băng), warehouse P5, puzhu:06, propagation
  - [ ] 3.4 Self-check: exact Cartesian set, uniqueness, bất biến FR-03
- [ ] 4.0 Freeze: lock, checksum, commit-proof, gate test
- [ ] 5.0 Oracle chéo với Golden từng phần; phân loại lệch
- [ ] 6.0 So engine toàn miền; phân loại lệch
- [ ] 7.0 Mutation runner FR-07
- [ ] 8.0 Báo cáo, `ci:local`, owner review, cập nhật PROJECT_CONTEXT
