# p4-migration-diff-v1 — roadmap 9

Diff 4 cấu hình P4 so với baseline flag OFF ([PRD](../../../../../tasks/prd-p4-migration-diff.md) FR-02/03/05/06/07, owner §6.10). Sinh bằng `P4_MIGRATION_FULL=1 P4_MIGRATION_WRITE=1 npx vitest run shared/lunar/p4MigrationDiff.test.ts` tại commit ghi trong [lock.json](lock.json) (cây sạch); chạy lại cho bytes trùng. Không phải Golden: đo output engine, phân loại bằng luật đã khóa trước ([p4-migration-rules-v1](../p4-migration-rules-v1/lock.json)).

## File

| File | Nội dung |
|---|---|
| `days.tsv` | Mỗi ngày (full): Month Jian, can-chi, ngày âm, thần dormant có mặt, sao thêm/bỏ so với baseline (5 sao alias bị thay) |
| `activities-full-{2025,2026,2027,outside}.tsv` | Mọi dòng activity của full (tách năm vì > 5 MB, §6.10.4): trạng thái activity, heading quyết định, trạng thái từng heading, `prot`, score/status trước–sau, hard warning, class, cap đã dùng (good/bad), phản thực tế cap-trước, `source_ids` (clause gỡ/−25), `rows` = dòng trong scope đổi so với flag OFF dạng `source:ruleId raw/preCap/applied<base` (`i` = informational) |
| `events-full.tsv` | 11 event × {không giờ, 9h}: score/classification/`event_fit` trước–sau, activity trong profile bị đổi |
| `activities-{presence,balancing}-changed.tsv`, `events-{presence,balancing}-changed.tsv` | Chỉ dòng đổi của 2 cấu hình chẩn đoán |
| `jie-boundary.tsv` | FR-07: 36 Jie 2025–2027 × ngày −1/0/+1 = 108 dòng: Month Jian engine / Golden v2 (calendar-day) / Golden noon, dormant, 9h trước instant, số event đổi classification giữa có/không giờ |
| `review.tsv` | Gói review owner §6.10.5 (`reason` = top50, recommended → strong_avoid, mẫu 3 dòng mỗi class × trạng thái, cap đổi status so với balancing-only, `CHAIN_REPLACED_LIGHTER`, multi-heading baseline, event insufficient_evidence → recommended) |
| `summary.json` | Tổng theo cấu hình, chồng lấn full/balancing-only, class, phân rã FR-05, lát cắt warehouse, thần dormant |

## Đọc số

- **Cơ số:** `summary.json` đếm cả 3 ngày ngoài miền: 1098 × 32 = **35.136** dòng activity, 1098 × 22 = **24.156** dòng event. PRD §3 đếm trong miền: 35.040 / 24.090. Ngoài miền mọi cấu hình = baseline nên số dòng đổi bằng nhau ở cả hai cơ số.
- **Clause / cấp / 德** (spec §7.2) không lặp lại ở đây: provider của adapter chỉ mang `state`/`rule`/`prot`. Lấy từ Golden v2 đóng băng (engine khớp Golden v2 31.755/31.755 ngày, roadmap 7b): clause theo heading-ngày ở [`compose/dated.tsv`](../p4-full-golden-v2/compose/dated.tsv) cột `code` (nối `date` + `deciding_heading`); cấp, nhánh có/không 德, effect theo context ở [`ji/grades.tsv`](../p4-full-golden-v2/ji/grades.tsv) (nối `id` = `month_jian-pillar` từ `days.tsv`, `subject` = nguồn 忌 trong `code`).
- **`CHAIN_REPLACED_LIGHTER` = 389** là dòng nhẹ đi **chỉ** vì bỏ 6 chain (không có `STATE_LIFT`); PRD §6.7 đếm 409 + 100 là mọi dòng ra khỏi nhóm tránh / strong_avoid → avoid, bất kể nguyên nhân.
- **Quy ước, không phải regression:** Month Jian sản phẩm theo ngày dân sự (calendar-day, CLOSED ở P4-C). 20 ngày trong fixture lệch quy ước noon (`month_jian ≠ noon_month_jian`); 23 ngày Jie có 9h trước instant nhưng event 9h vẫn dùng Month Jian mới.
