# P4-C 5.5 — 王日, operand 宜 sẵn có và 修倉庫 deferred P5

2026-10-15. **PASS_TASK_5_5_AUDIT_ONLY**. Parent 5.0/P4-C chưa nghiệm thu; next 5.6. Reviewer Claude, single agent; không independent second review.

## Kết quả

- **王日 không đổi.** Đã kiểm trên 720 context Month Jian × pillar. Expected suy trong test từ nguồn 卷05 offset 6824 「王日者春寅夏巳秋申冬亥」 và case 王日 của `golden-p4-season-days`. Trace `p4legacy:王日` có presence đúng ở 宴會/行幸遣使. Ngày có 王日 thì 宜 của hai heading này là true.
- **Operand 宜 sẵn có không đổi.** Đã so trên 1.095 ngày × 29 heading: tập thần legacy present trong trace bằng cột `known_present_yi_gods` của baseline 1.4.
- **修倉庫 giữ P5.** Ở cả 720 context và 1.095 ngày, record pre/final của 修倉庫 bằng resolver lịch sử / baseline. 宜 luôn unknown, kể cả ngày 母倉 present. Không thêm rule đồng hiện warehouse nào.

## Thay đổi code

Golden 3.4 `warehouse` (18 ca) yêu cầu 修倉庫 giữ trace các operand của mệnh đề và giữ unknown. 5.1 đã cố ý để phần này cho 5.5. Trước khi sửa, `composeP4YiEvidence` trả trace rỗng.

- `p4YiEvidence.ts`: với 修倉庫 trả `yi: undefined`, `deferred: 'P5'`; trace gồm 母倉 (scope `P5_DEFERRED_CO_PRESENCE` của authority) và các nhãn legacy của mệnh đề; `unresolvedTraceIds` giữ các operand unknown. Không bao giờ chạy ANY. Danh sách nhãn chỉ bỏ ngữ pháp 「又/與/併者」, cùng cách inventory baseline 1.4 đã làm.
- `p4YiDayComposition.ts`: source refs của 修倉庫 lấy theo scope P5 (母倉 → `[2]`); cờ `deferred` giờ lấy từ compose.

Bản đồ 宜 cấp vào core không đổi (修倉庫 vẫn undefined), nên classification/propagation không đổi. Golden 5.4 và lock của nó vẫn PASS.

## Test

`shared/lunar/p4YiWarehouse.test.ts`, 56 test:

- 33 ca `headingScope` deferred (11 thần × 3 trạng thái ở 修倉庫);
- 18 ca `warehouse`;
- 王日 trên 720 context từ nguồn;
- 修倉庫 trên 720 context so với resolver lịch sử;
- dated sweep 1.095 ngày.

Kết quả:

- [RED](red-tests.json): 3 PASS / 53 assertion RED, không lỗi import.
- [GREEN](test-results.json): 56/56.
- P4-C suites **4.483 PASS** (4.427 + 56). Legacy/compatibility **201 PASS**.

Correction duy nhất là SPEC_BUG trong test mới: mệnh đề 修倉庫 ghi 月德 hai lần và cột baseline giữ bản trùng, nên so theo tập. Không có Golden mới; không sửa Golden/lock cũ. [validation.json](validation.json) ghi hash nguồn expected và code.

[Mutations](mutations.json): 4/4 bị assertion bắt, bytes phục hồi:

- warehouse bị ANY resolve: 13;
- warehouse bỏ trace: 23;
- bỏ 王日: 2;
- source refs warehouse chỉ lấy DIRECT_YI: 1.

lint, typecheck main/functions và build PASS. Bundle vẫn `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`. Verifier core body 5.4 PASS. Không có import production.

## Tái tạo

```sh
npx vitest run shared/lunar/p4YiWarehouse.test.ts
python3 -I docs/audits/sources/p4-vol10/yi-warehouse-v1/check-mutations.py   # chạy riêng, sau mọi test/build
```

## Giới hạn

- Trace warehouse chỉ là nhãn để audit. Predicate đồng hiện (月恩/月德, ANY vs ALL) thuộc P5, roadmap 6.
- 四相 trong Golden 3.4 là stub, không phải authority mới.
- Còn mở: 5.6 dated provenance (gồm 20 ngày Jie từ 5.4), 5.7 gate, 6.x.
- 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 OPEN.
- Chưa commit/push/merge/deploy.
