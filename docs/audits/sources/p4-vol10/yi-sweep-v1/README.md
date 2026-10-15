# P4-C 6.x — Sweep trước/sau, mutation gate và review thay đổi

2026-10-15. **PASS_TASK_6_AUDIT_ONLY**; parent 6.0 hoàn tất. P4-C chưa nghiệm thu (7.x: CI, full validation, PR). Reviewer Claude, single agent; không independent second review.

## 6.1 Sweep

Test `shared/lunar/p4YiSweep.test.ts`: cùng 1.095 ngày (`mansion-decision-baseline-v1`), cùng input (lunar day, phase, soil P4-B, Month Jian calendar-day) và 29 heading như baseline 1.4; thêm `SOIL_REIGN_STATE` 母倉 từ `getP4MuCangSoil(date)`. Chạy mọi lần unit (~14 s local, timeout 300 s cho CI chậm ~4×) và so bytes với report đã commit; lệch thì báo dòng đầu tiên khác.

```sh
P4C_SWEEP_WRITE=1 npx vitest run shared/lunar/p4YiSweep.test.ts   # tái tạo report
npx vitest run shared/lunar/p4YiSweep.test.ts                     # kiểm bytes
```

## 6.2 TSV

[`p4-vol10-yi-operands-2025-2027.tsv`](../../../p4-vol10-yi-operands-2025-2027.tsv): 31.755 dòng + header, 44 cột.

- Input: date, lunar_day, phase, soil_presence, mucang_soil, month_jian, pillar.
- Trace: `p4c_presence` (từng thần đủ điều kiện heading, `han:present|absent|unknown`), `p4c_unresolved`, `legacy_present`, `legacy_unknown`, `warehouse_deferred`.
- 宜: `before_raw_yi` (baseline) / `after_evidence_yi` (trước suppression).
- Cặp `before_`/`after_` cho pre/final 宜, 忌, protected 忌, state, propagated_from, propagation_blocked.
- `after_raw_ji` (rawJiHeadings, giữ 忌 trước override puzhu:28), `ji_unresolved`, bucket undetermined trước/sau, `reason`.

Truy ngược: `before_*` lấy nguyên cột baseline 1.4; `reason` lấy từ baseline + Golden 5.4 (`yi-propagation-v1/evidence.tsv`, `expected.json`), không từ output resolver.

## 6.3 Summary

[`p4-vol10-yi-operands-summary.json`](../../../p4-vol10-yi-operands-summary.json): counts, bucket undetermined trước/sau, transition theo lý do, `perGod` (authority/rule/status, input bắt buộc, presence theo ngày, unknown reasons, traced rows, sole-proof rows, baseline-unknown rows nay đã biết), `perHeading`.

| Bucket final undetermined | Trước | Sau |
|---|---|---|
| RAW_YI_UNKNOWN_ELEVEN / P4C_YI_UNKNOWN | 3.418 | **0** |
| P5_WAREHOUSE (修倉庫) | 539 | 539 |
| OTHER (宜 đã biết, scope khác còn mở) | 83 | 103 |
| **Tổng** | **4.040** | **642** |

Transition (3.803 dòng đổi): RECORDED_YI_RESOLVED 3.708, EVIDENCE_YI_RESOLVED 85, STOP_JI_REVEAL 10, UNEXPLAINED 0 — khớp 5.7.

Coverage 11 thần trên 1.095 ngày: 0 unknown, 0 missing input. Present/ngày: 母倉 218, 福德 89, 天恩 275, 天巫 89, 天后 92, 天醫 90, 除神 183, 驛馬 92, 天馬 90, 吉期 89, 鳴吠 239. Biến thể thiếu input/ngoài coverage đã kiểm ở 5.6 (5 × 720 context), không lặp lại ở đây.

## 6.4 Gate miền đủ input

Assert trong sweep: 1.095 ngày / 31.755 dòng; 0 operand P4-C unknown; 0 dòng còn trace unresolved P4-C; bucket P4C_YI_UNKNOWN = 0; 0 unresolved 凶; 0 conflict 遊禍; 0 transition unexplained. Không yêu cầu tổng undetermined = 0: 642 còn lại là P5 và scope khác.

## 6.5–6.7 Mutation

Runner [`scripts/audit-p4-yi-mutations.py`](../../../../../scripts/audit-p4-yi-mutations.py): tuần tự, control run sạch trước, mỗi mutation áp đúng 1 chỗ, chạy toàn bộ suite `shared/lunar/p4Yi*` (gồm sweep byte check), phục hồi bytes trong `finally`. Phân loại ASSERTION_CAUGHT / NOT_CAUGHT / TOOLING_ERROR (suite không load, lỗi không phải assertion) / TIMEOUT (900 s). Report: [`p4-vol10-yi-mutation-results.json`](../../../p4-vol10-yi-mutation-results.json).

23 mutation:

- Predicate: lookup tháng lệch offset; biên range 天恩 exclusive; chu kỳ 60 lệch; set chi 除神 thiếu phần tử; set pillar 鳴吠 đọc chi thay vì pillar; soil override 母倉 bị bỏ / hợp với mùa; ngày 立 tính vào kỳ soil.
- Provider/operand: unknown → absent; outside coverage bị bỏ qua; bỏ operand 母倉; bỏ operand legacy.
- Phép ghép: ANY → ALL; unknown → false; bỏ lọc heading scope; 修倉庫 bị ANY resolve (bỏ deferral P5).
- Bảo vệ/override: bỏ protection 百忌日; bỏ suppression 宜; bỏ 止忌 reveal; bỏ protection full-day; bỏ override puzhu:28; mất raw 忌 view; bỏ suppression 死敗.

**Kết quả: control 4.523 PASS / 0 fail; 23/23 ASSERTION_CAUGHT, `restored: true`**, hash phục hồi ghi trong report. Mỗi mutation bị ≥ 5 assertion bắt (ít nhất: `stop_ji_reveal_dropped` 5, nhiều nhất: `monthly_lookup_offset_shifted` 649); ngoài Sweep, mọi mutation đều bị ít nhất một suite ngữ nghĩa (Domains/Operands/Any/HeadingScope/Propagation/Compatibility…) bắt, không chỉ bởi byte check. Hai mutation có thêm lỗi phi-assertion bên cạnh assertion: `soil_li_day_included` (98: provenance soil tự kiểm từ chối giá trị lệch) và `drop_p4c_operand_mucang` (2); vẫn có assertion bắt nên tính caught. Toàn gate ~25 phút local.

Correction: bản đầu của mutation 修倉庫 (`warehouse = false`) làm tokenizer ném lỗi "Unknown 宜 token" trên mệnh đề ghép chưa strip, runner xếp TOOLING_ERROR (819 lỗi, 0 assertion). Đây là mutation không có nghĩa, không phải lỗ test; thay bằng bỏ nhánh deferral (giữ strip nhãn) và chạy lại toàn gate.

Không mutate: chuẩn hóa chính tả heading (helper 5.1 có test riêng; mutation tương đương do `P4_DAY_HEADINGS` đã chuẩn hóa), bảng JSON authority (bị hash lock bắt, không đo được assertion ngữ nghĩa).

## 6.8 Review thay đổi

- **3.803 dòng đổi** đều có lý do Golden (5.7 gate + sweep). Recorded 宜 chỉ đi từ unknown sang giá trị Golden; giá trị đã biết không đổi.
- **3 ngày Jie lệch quy ước** (2026-05-05, 2026-08-07, 2026-11-07; 母倉 present theo calendar-day, absent theo noon): 15 dòng heading của 母倉. 14 dòng có thần legacy present khác (天德/月恩/四相/開日) nên 宜 true bất kể 母倉; 1 dòng (2026-05-05 納畜) 宜 evidence chỉ do 母倉 nhưng recorded 宜 vẫn false do suppression. Cả 15 dòng không đổi state/忌 so baseline. Kết luận CONVENTION_DIFFERENCE không ảnh hưởng state; giữ quy ước calendar-day (CLOSED), không cần owner quyết.
- **OTHER 83 → 103**: 20 dòng trước xếp RAW_YI_UNKNOWN_ELEVEN (bucket ưu tiên raw unknown), nay 宜 đã biết nhưng state vẫn undetermined do 忌 chưa bảo vệ/scope khác (安葬/鳴吠 15, 宴會/福德+天恩 3, 2027-08-07 未戊午 掃舍宇+整容剃頭 2). Chuyển bucket, không phải regression; state không đổi.
- **2027-08-07 未戊午**: 28/29 heading undetermined trước và sau (scope ngày undetermined); 掃舍宇 có recorded 宜 resolve nhưng state giữ undetermined — 1 transition RECORDED_YI_RESOLVED undetermined>undetermined.
- Không correction Golden, không quyết định owner mới.

## Regression P4-B

Runner P4-B `scripts/audit-p4-remaining-ji-mutations.py` (CI gate) chạy lại sau gate P4-C: **28/28 assertion-caught, `restored: true`**, target hashes không đổi. Report mới chỉ khác thứ tự key `targetHashes` (Python set), nên đã giữ nguyên bytes file tracked. Sau mọi mutation: sweep verify bytes PASS, lint/typecheck PASS.

## Giới hạn

- 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027; S1 canonical OPEN; 修倉庫 P5 deferred.
- Bucket undetermined là phân loại quan sát, không phải nguyên nhân duy nhất.
- Chưa nối CI (7.1), chưa full unit/build (7.2), chưa commit/push/merge/deploy.
