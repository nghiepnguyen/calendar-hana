# P4-C 5.7 — Gate phép ghép và regression A04b/P4-B

2026-10-15. **PASS_TASK_5_7_AUDIT_ONLY**; parent 5.0 hoàn tất (ghép operand 宜 vào audit ngày). P4-C chưa nghiệm thu; next 6.1. Reviewer Claude, single agent; không independent second review.

## Gate

Test mới `shared/lunar/p4YiCompositionGate.test.ts`, 28/28 PASS. Không đổi code, Golden hay lock.

1. **Golden tay A04b/P4-B chạy trên đường 宜 mới**, expected giữ nguyên:
   - A04b 7 ca;
   - 又為 day cases;
   - puzhu-end 8 ca + 四廢;
   - puzhu:28 dayCases.

   Một state 'undetermined' của Golden chỉ được phép resolve khi 宜 mới đã biết còn lookup lịch sử thì chưa. Thực tế không ca nào lệch.
2. **Diff 1.095 ngày × 29 heading so với baseline 1.4.** Mọi dòng đổi (state, 宜, 忌, protected, propagation) phải có lý do lấy từ Golden 5.4; dòng không có lý do sẽ fail. Recorded 宜 đã biết thì không được đổi.

| Lý do | Chuyển trạng thái final | Dòng |
|---|---|---|
| RECORDED_YI_RESOLVED | undetermined → not_recorded | 2.197 |
| | undetermined → only_yi | 569 |
| | undetermined → only_ji | 430 |
| | undetermined → both_present | 107 |
| | undetermined → undetermined (chỉ 宜 đổi) | 1 |
| | only_ji → only_ji (chỉ 宜 đổi) | 404 |
| EVIDENCE_YI_RESOLVED | undetermined → only_ji / not_recorded | 71 / 14 |
| STOP_JI_REVEAL | undetermined → only_ji | 10 |

**UNEXPLAINED: 0.** Heading final undetermined giảm **4.040 → 642**. Đây là số đo, không phải oracle; phân rã P5/lý do khác thuộc 6.3.

EVIDENCE_YI_RESOLVED là trường hợp recorded 宜 vẫn bị chặn (false), nhưng 宜 trước suppression nay đã biết. Scope undetermined vì thế resolve (vd. 2025-01-19 整容剃頭, 除神 absent). STOP_JI_REVEAL có 10 dòng: 9 dòng reveal của 5.4 cộng 2026-09-04 申辛巳, dòng có 忌 đã ghi sẵn.

## Replay test P4-B nguyên văn

[replay-p4b-full-day.test.ts.txt](replay-p4b-full-day.test.ts.txt) chạy lại 6 file test P4-B (full-day, puzhu-end, lunar day, phase, soil, remaining-ji), thay `resolveP4FullDay` bằng `resolveP4YiDay` qua `vi.mock`, assertion giữ nguyên.

Kết quả: **193/200 PASS**. 7 ca lệch cùng một nguyên nhân, xếp loại EXPECTED_AUTHORITY_MIGRATION_CHANGE:

- Test so recorded 宜 của 祭祀/掃舍宇 với `resolveP4Day` lịch sử, nơi lookup còn unknown.
- Đường mới biết 天巫/除神 absent nên 宜 = false.
- Bất biến thật của test (mask 月厭 không đụng hai heading này) vẫn đúng khi so với evidence mới; gate kiểm điều này ở các ca puzhu-end.

Replay day-level A04b/又為 qua mock quá chậm (mỗi context gọi toàn resolver) nên đã dừng. Phần Golden của chúng được kiểm trực tiếp trong gate.

## Regression

- Toàn bộ `shared/lunar/p4*` (28 file): **5.043 PASS / 0 fail / 3 skip**. 3 skip là baseline opt-in, cần checkout frozen.
- lint, typecheck main/functions, build PASS.
- Bundle vẫn `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`.
- Tracked shared/src/functions không có diff.

**Chưa chạy** các runner mutation P4-B (`scripts/audit-p4-*-mutations.py`). Chúng ghi đè các file `docs/audits/*mutation-results.json` đang được track, trong khi file lịch sử mà chúng mutate giữ nguyên bytes, nên kết quả không thể đổi. Gate mutation đầy đủ thuộc 6.5–6.7 và CI 7.1.

Correction: SPEC_BUG trong bản nháp test. Bản đầu chỉ giải thích thay đổi recorded 宜; đã thêm EVIDENCE_YI_RESOLVED dựa trên `raw_yi` baseline và `expected_evidence_yi` của Golden. Ghi trong [validation.json](validation.json); kết quả ở [test-results.json](test-results.json).

## Tái tạo

```sh
P4C_57_REPORT=/tmp/r57.json npx vitest run shared/lunar/p4YiCompositionGate.test.ts
npx vitest run shared/lunar/p4
```

## Giới hạn

- Lý do trong diff là cận đủ dựa trên Golden 5.4 cộng fact baseline. Review từng dòng so với nguồn thuộc 6.8.
- 3 ngày Jie lệch quy ước Month Jian (5.6) vẫn chờ 6.8.
- 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 OPEN, P5 deferred.
- Chưa commit/push/merge/deploy.
