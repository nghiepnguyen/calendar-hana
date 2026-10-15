# P4-C 7.6 — Đối chiếu acceptance gate PRD §8

2026-10-15, tại HEAD `060ed2c` (code cuối `efc5ffa`; commit sau chỉ là tài liệu). Reviewer Claude, single agent; không independent second review.

**Kết luận: gate 1–7 PASS; gate 8 chờ 7.7.** P4-C chưa đánh dấu hoàn tất cho đến khi 7.7 cập nhật progress/PROJECT_CONTEXT cuối. Không có entry thiếu/mâu thuẫn nguồn cần owner quyết.

| # | Gate | Kết quả | Evidence kiểm lại ở 7.6 |
|---|---|---|---|
| 1 | 11/11 authority chốt | **PASS** | `p4-yi-operands-v1.json`: 11 entry (10 SOURCE_REVIEWED, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027); entry nào cũng có sources/predicate/operandInputs/headingScopes/coverage/review. [Gate 2.15](../yi-authority-gate-v1/README.md) PASS 11/11: 74 source slice, 130 evidence hash. |
| 2 | 11/11 operand ghép vào audit; unknown chỉ do thiếu input | **PASS** | Sweep 1.095 ngày: `p4cUnknownOperands` 0, `p4cUnknownTracedRows` 0. Thiếu input/ngoài coverage vẫn unknown đúng contract: [input contract 4.3](../yi-red-contract-v1/README.md) và [dated inputs 5.6](../yi-dated-inputs-v1/README.md) (5 biến thể × 720 context, unknown đúng heading và reason). |
| 3 | Golden độc lập khóa trước code; hash cũ bất biến; present/absent/biên | **PASS** | Freeze `c12df53` là ancestor của commit code đầu `9902fec`; authority và Golden không đổi bytes từ freeze. 677 path khóa không đổi đến HEAD (7.3). Domain 3.3 phủ present/absent cho mọi thần (vd. 7 × 720 = 60/660); biên: 72 soil civil edge, 36 seasonal Jie edge, 252 monthly Jie edge, 108 exact Jie. |
| 4 | Báo cáo 31.755 dòng có trước/sau và trace | **PASS** | [TSV](../../../p4-vol10-yi-operands-2025-2027.tsv) 31.755 dòng × 44 cột và [summary](../../../p4-vol10-yi-operands-summary.json). 3.803 dòng đổi đều có `reason`; trong miền đủ input, bucket thiếu 宜 của 11 thần 3.418 → 0. Undetermined còn 642 (P5 539, scope khác 103), đúng như PRD cho phép. |
| 5 | 0 unresolved 凶; không regression chưa giải thích; propagation/protection/puzhu:28 đúng | **PASS** | Sweep: `unresolvedJiRows` 0, `conflicts` 0, `unexplained` 0. [Propagation 5.4](../yi-propagation-v1/README.md): propagation đổi 0; raw/protected 忌 đổi đúng 9 dòng theo Golden; puzhu:28 8 context. [Gate 5.7](../yi-composition-gate-v1/README.md): Golden A04b/P4-B không lệch. Mutation bỏ protection/override/suppression/止忌 đều bị bắt. |
| 6 | Mutation bắt bằng assertion; bytes phục hồi; CI xanh | **PASS** | [Mutation](../../../p4-vol10-yi-mutation-results.json) 23/23 ASSERTION_CAUGHT, restored; P4-B 28/28. [CI 38764920607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38764920607) success trên code HEAD `efc5ffa`, gồm 4 shard P4-C. CI trên `060ed2c` (chỉ tài liệu) đang chạy lại; Auto-fix theo dõi. |
| 7 | Runtime/manifest/scoring bất biến; bundle = baseline | **PASS** | Diff `main...HEAD` ngoài test chỉ thêm module audit `p4Yi*` + JSON authority/Golden; 0 importer production; `manifest.json` không đổi; bundle `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` (7.2/7.3). |
| 8 | Audit report và PROJECT_CONTEXT cập nhật; P5 chỉ là bước kế sau gate | **CHỜ 7.7** | Audit report có bảng tổng kết (7.4) và evidence đến 7.6. Còn: `docs/audits/p4-vol10-progress.md` vẫn ghi “next4.1”; PROJECT_CONTEXT roadmap mục 5 chưa chuyển sang nghiệm thu và chưa ghi P5 là bước kế. |

## Giới hạn được chấp nhận trong gate

- 母倉 là convention owner adopt (2026-10-14), chỉ 2025–2027; canonical S1 vẫn OPEN. PRD tính đây là authority đã chốt trong adopted scope (owner chọn 1A).
- Toàn bộ review do một agent: Codex ở task 1–4, Claude ở task 5–7. Không có independent second review; PRD chỉ yêu cầu ghi reviewer và giới hạn.
- P5 修倉庫 deferred; 103 heading-ngày undetermined do scope khác. Ngoài phạm vi P4-C.
- Month Jian theo quy ước calendar-day (CLOSED); 3 ngày Jie lệch noon không đổi state nào (6.8).

## Việc còn lại

7.7: cập nhật progress.md, PROJECT_CONTEXT (roadmap 5 → nghiệm thu audit-only, P5 là bước kế, S1 vẫn OPEN) và checkbox parent 7.0. Merge/deploy PR #55 cần owner cho phép.
