# PRD — Roadmap 7: Full Golden P4 (resolution, presence, warehouse)

Ngày: 2026-10-17.
Trạng thái: PRD đã chốt phạm vi; chưa triển khai.
Quyết định owner (2026-10-17):

1. **Phạm vi:** mục 7 chỉ gồm lớp resolution (heading/annotation), presence 21 thần và warehouse, kèm mutation của lớp này. Score adapter, cap reallocation, event `very_high`, penalty `product_policy_default_penalty` −25 và các mutation "cap trước resolution" / "event đọc raw" chuyển sang **roadmap 8**, sau khi owner duyệt adapter (spec §7.1: "score adapter có expected riêng sau khi owner duyệt").
2. **11 dòng hold:** Golden ghi `undetermined` kèm mã lý do; không tự giải. Soạn riêng bộ câu hỏi owner có bằng chứng nguồn và phương án (gồm cả 德願 nếu cùng loại). Không chặn phần Golden còn lại.
3. **Hold (2026-10-17, sau task 2.1):** H1-B — 忌 của phạm vi convention gặp 相抵 của phạm vi khác trên cùng heading thì 忌 sống sót, 宜 không ghi, rồi mới xét lan truyền; H2-A — 天願 ∈ 德願, 未月戊午 phạm vi 閉日 như thường lệ. Cả hai `OWNER_ADOPTED_SOURCE_DEPENDENT` ([câu hỏi](../docs/audits/p4-full-golden-hold-questions.md)). Golden áp hai quyết định; FR-04 chỉ còn cho các hold mới phát hiện.
4. **Finding 3.2 (2026-10-17):** F1 map 百忌 巳日「出行」 vào 行幸遣使 (專忌); F4 閉日 không 忌 求醫療病 (theo 卷十, SOURCE_DEPENDENT); F5 mở H1-B cho cả 忌 canonical không bảo vệ ([README lớp 忌](../docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/README.md)).
5. **Luật ghép 3.3 (2026-10-17):** E1 復日/重日 「不忌亦不註宜」 → `neither_recorded`; E3 lan truyền gỡ 忌 còn 相抵 → `neither_recorded`; E5 miền context chỉ xác định khi bất biến trên soil/ngày âm/phase ([compose README](../docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/README.md)).
6. **Reviewer:** single agent + owner review bản tóm tắt và mẫu dòng. Ghi rõ không có reviewer thứ hai (R1).

## 1. Overview

P4-B (PR #54), P4-C (PR #55), P5 (PR #60), puzhu:06 (PR #61) đều audit-only và mỗi phần có Golden **từng phần**. Chưa có Golden độc lập phủ toàn miền 720 context × heading cho trạng thái cuối, và một số Golden từng phần đọc output của engine làm input:

- **puzhu:06 v3** lấy trạng thái trước lan truyền từ sweep P4-C (`docs/audits/p4-vol10-yi-operands-2025-2027.tsv`) và `p4b-puzhu06-baseline-v1/context-p4c.tsv`, tức output resolver.
- **P4-B v8** (`golden-p4-remaining-ji-v8.json`) là fixture scope (51 ca + 10 ngày + 9 ngày âm), không phải lưới toàn miền. Trạng thái 忌 toàn miền hiện chỉ có từ sweep engine.
- **P4-C** (`yi-domains-v1`, `yi-expected-v1`) và **P5 v1** độc lập: chỉ đọc nguồn và artifact khóa hash (P5 chỉ hash `catHungAuthority.ts` để ghi chú đối chiếu, không dùng logic).

Mục 7 dựng một Golden độc lập (không gọi resolver/composer/scorer, không đọc TSV sweep của engine) cho trạng thái cuối mỗi heading, rồi mới so với composer hiện có (`resolveP4Puzhu06Day` bọc `resolveP4YiDay`, `resolveP4WarehouseDay`).

Đây là roadmap mục 7 của [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), theo [spec §7.1](../docs/plans/p4-xieji-vol10-balancing.md). Audit-only: không đổi runtime, điểm, manifest hay flag.

## 2. Goals

1. Input của Golden chỉ là nguồn đã khóa (raw/scan + SHA), authority JSON đã khóa, và Golden đã đóng băng. Mọi input là output engine bị thay hoặc suy lại.
2. Phủ hai miền đầy đủ: **context720 × 29 heading = 20.880 dòng** và **dated1095 × 29 = 31.755 dòng** (2025–2027; ngày âm, 朔弦望, soil, puzhu:28, exact Jie phụ thuộc ngày, không suy từ context).
3. Presence 21 thần dormant suy từ `shared/almanac-data/xieji-god-definitions.json` (quy tắc có trích dẫn), không từ `xieji-god-tables.json` (bảng runtime); fixture biên exact Jie trước / đúng / sau 1 ms cho cả 21 thần, alias về đúng stable ID.
4. Đóng băng (lock + commit-proof + checksum) **trước** khi so với composer; mọi lệch phân loại `ENGINE_BUG` / `GOLDEN_BUG` / `SPEC_BUG` / `SOURCE_DEPENDENT`, không sửa Golden đã khóa để test xanh (sửa = version mới, như puzhu:06 v3).
5. Mutation lớp resolution bắt hết.

## 3. Functional Requirements

**FR-01 Inventory.** Bảng mọi file mỗi `derive.py` P4 đọc (P4-B, P4-C, P5, puzhu:06), phân loại `SOURCE` / `AUTHORITY_LOCK` / `FROZEN_GOLDEN` / `ENGINE_OUTPUT` / `PRODUCTION_CODE`. Hai loại sau không được làm input của Golden mới.

**FR-02 Cột mỗi dòng** (context và dated): id, month_jian, pillar, (date), heading, present IDs liên quan, clause/entry khớp, cấp 等第 + nhánh 德, `yi`, `ji`, `protected_ji`, state 4 giá trị (`both_present` / `only_yi` / `only_ji` / `neither_recorded`) cùng `not_listed` / `undetermined` / unknown tách riêng, propagated_from / propagation_blocked, kết quả warehouse (修倉庫 theo D), reason code.

**FR-03 Bất biến.** `neither_recorded` ≠ neutral ≠ unknown; unknown không thành absent; ANY partner không thành ALL; 專忌 và 百忌日 giữ; mỗi effect áp một lần cho (clause, heading, scope); thứ tự input không đổi kết quả.

**FR-04 Hold.** 11 dòng (6 開倉庫出貨財 月煞 卯/酉 相抵 + 又為月虛; 5 heading 未月戊午 2027-08-07 閉日/天吏) và các scope undetermined cả phạm vi (德願, 未月戊午) ghi `undetermined` + reason code `OWNER_QUESTION_<id>`. Bộ câu hỏi owner ở file riêng.

**FR-05 Oracle chéo.** Sau freeze, Golden mới phải tái tạo đúng các Golden từng phần (P4-B v8 fixtures, P4-C expected, P5 v1, puzhu:06 v3) trên phần giao nhau; lệch nào cũng phân loại.

**FR-06 So engine.** Sau freeze và oracle chéo: chạy composer đầy đủ trên hai miền, deep-equal theo cột FR-02; báo cáo mọi lệch.

**FR-07 Mutation.** Runner `scripts/audit-p4-full-golden-mutations.py` (tên `p4*` để vào `ci:p4`): bỏ một dormant god; Month Jian → tháng âm; ANY → ALL; bỏ 專忌 exception; unknown → absent; gộp 亦從宜亦從忌 với 不註; bỏ nhánh 德; duplicate effect. Chạy tuần tự, phục hồi tree.

## 4. Non-Goals

- Score adapter, cap, event, penalty −25 (roadmap 8). Migration diff 4 cấu hình (roadmap 9). Activation (roadmap 10).
- Giải 11 hold, S1 canonical 土王, P1, Sát Chủ.
- Đổi runtime, manifest, flag, Golden/authority cũ.

## 5. Acceptance (“Xong khi”)

1. Golden độc lập đóng băng, checksum, commit-proof; inventory chứng minh 0 input `ENGINE_OUTPUT`/`PRODUCTION_CODE`.
2. 20.880 + 31.755 dòng + fixture Jie 21 thần; mỗi dòng có reason code.
3. Oracle chéo và so engine: 0 lệch chưa phân loại.
4. Mutation bắt hết; full unit, lint, typecheck, `ci:local` qua; bundle bất biến.
5. Owner review Golden (tóm tắt + mẫu dòng) và trả lời bộ câu hỏi hold (hoặc để hold lại có ghi chú).

## 6. Rủi ro

- Suy độc lập toàn bộ 忌 P4-B (26 entry + puzhu + soil + ngày âm) là phần lớn nhất; có thể phát hiện ENGINE_BUG trong module đã merge. Sửa theo quy trình Golden-trước-code, PR riêng nếu đổi module.
- Test mới trong `shared/lunar/p4*` kéo `ci:p4` chạy mọi mutation khi push (P4-C ~25 phút).
- Single agent: lỗi suy tay chung giữa Golden và engine có thể lọt nếu cùng hiểu sai nguồn; oracle chéo với Golden cũ giảm nhưng không loại trừ.
