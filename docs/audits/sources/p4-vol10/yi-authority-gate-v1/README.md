# P4-C 2.15 — Gate authority 11/11

2026-10-14. **PASS — 11/11**, scope **P4_C_AUTHORITY_STEP_2_ONLY**. Task **2.15 và parent 2.0 hoàn tất**; toàn bộ P4-C chưa nghiệm thu. Tiếp theo **3.1**: ma trận Golden độc lập trước implementation.

`gate.json` ghi từng entry, authority/rule ID, status, tất cả checks và kết quả. Gate gắn SHA-256 với `shared/almanac-data/p4-yi-operands-v1.json`; snapshot 2.14 **AUTHORITY_ASSEMBLED_PENDING_2_15_GATE** và các readiness flags của thời điểm assembly giữ nguyên bytes. Report này là evidence gate xảy ra sau snapshot, không refresh source/authority lock lịch sử.

| Entry | Authority status | Gate |
|---|---|---|
| 母倉 | OWNER_ADOPTED_SOURCE_DEPENDENT, bounded 2025–2027 | PASS |
| 福德 | SOURCE_REVIEWED | PASS |
| 天恩 | SOURCE_REVIEWED | PASS |
| 天巫 | SOURCE_REVIEWED | PASS |
| 天后 | SOURCE_REVIEWED | PASS |
| 天醫 | SOURCE_REVIEWED | PASS |
| 除神 | SOURCE_REVIEWED | PASS |
| 驛馬 | SOURCE_REVIEWED | PASS |
| 天馬 | SOURCE_REVIEWED | PASS |
| 吉期 | SOURCE_REVIEWED | PASS |
| 鳴吠 | SOURCE_REVIEWED | PASS |

## Bộ proof của gate

- Prerequisites **2.1–2.14** đều có checkbox/evidence hoàn tất; inventory đúng 11 tên, unique stable IDs/authority IDs/rule IDs.
- Chạy lại [assembly validator](../yi-authority-v1/validation.json) và [comparison validator](../yi-comparison-v1/validation.json): lossless 11 snapshots, **74 raw slices/offsets/SHA-1**, **130 evidence-file SHA-256**, recursive source/authority/baseline/comparison locks; đủ 31 original conflict records + 9 comparison records, definitions/catalog/inventory/legacy đối chiếu.
- Từng entry đủ predicate, required input origin, structural/calendar coverage, direct heading scope, exceptions/conflicts, valid sourceRefs, scan PDF locator/render và bản chép. 母倉 scanChecks dẫn bản chép trong **README v1 đã khóa**; các entry còn lại có transcription trong JSON. Cả hai dạng evidence được kiểm, không sửa entry để đồng nhất hình thức.
- Reviewer và limitations có đủ; `independentSecondReview: false`. Status entry đã chốt, source-dependent adoption không nâng thành canonical. Contract missing/outside coverage → unknown; malformed → error. ScoringReady false/AUDIT_ONLY.
- Task-2.1 source verifier và Unicode offset self-test qua; `git diff --check` qua. Lint/main+functions typecheck/JSON formatting/graph của 2.14 vẫn áp dụng vì artifact giữ đúng hash và task này chỉ thêm audit report/tài liệu; không sửa product code.

`validation.json` lưu verifier Python để chạy lại toàn bộ proof; `lock.json` khóa gate/README/validation cùng authority/comparison locks. Lần chạy đầu validator giả định mọi scanChecks có transcription inline và dừng KeyError ở 母倉. Đã sửa **validator assumption** để kiểm explicit locked README transcription; không thay source, predicate, expected hay nới gate cho evidence thiếu. Gate PASS được ghi sau khi kiểm cả hai kiểu lưu bản chép.

## Phạm vi còn mở

**S1 canonical onset/後/定氣** vẫn OPEN. 母倉 dùng separate owner adoption 2026-10-14: `p4-yi-mucang-soil-owner-convention-v1`, UTC+7, 18 ngày dân sự trước 四立, gồm onset/trừ 四立, 2025–2027. Unknown/missing soil hoặc ngoài coverage vẫn unknown; không fallback seasonal absent, không đổi P4-B. PRD non-goal S1 và quyết định owner đã khóa cho phép nghiệm thu authority P4-C trong phạm vi này, không chứng nhận canonical.

**P5 修倉庫 月恩/月德** vẫn deferred/unknown. Không chọn warehouse predicate hoặc dùng 母倉 present để tự giải co-presence. Không có blocking unresolved authority trong adopted P4-C scope; hai residual này giữ nguyên trong gate report.

**Golden chưa frozen; presence chưa implementation; toàn bộ P4-C chưa hoàn tất.** Task 3.1–3.6 cần Golden độc lập/commit freeze trước task 4. Không chuyển sang P5, activation, merge hoặc deploy.

Reviewer gate: **Codex (single agent)**; đây là read-only acceptance check của evidence đã review, không second independent source review. Không suy expected từ production resolver/scorer và không lấy giảm unknown/CI xanh làm chứng minh authority.
