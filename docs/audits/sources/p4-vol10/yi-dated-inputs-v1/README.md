# P4-C 5.6 — Input lunar day / phase / soil và status trong trace

2026-10-15. **PASS_TASK_5_6_AUDIT_ONLY**. Parent 5.0/P4-C chưa nghiệm thu; next 5.7. Reviewer Claude, single agent; không independent second review.

## Kết quả

- **Trace giữ đủ input và status.** Kiểm trên 1.095 ngày:
  - soil P4-B (`soilScope.evidence`, status OWNER_ADOPTED_SOURCE_DEPENDENT);
  - phase (`phaseScope.evidence`) và lunar day (`lunarDayInput`, mới);
  - `SOIL_REIGN_STATE` của 母倉 nằm trong inputs/provenance của operand. State/onset/nextLi/coverage khớp domain dated 3.3 đã frozen;
  - operand 母倉 có mặt trong trace mọi heading của nó.

  Hai soil convention (P4-B và 母倉) cho cùng presence ở cả 1.095 ngày.
- **Missing/out-of-coverage chỉ unknown trong scope của nó.** Kiểm 5 biến thể × 720 context (không input; chỉ input P4-B; ngoài 2025–2027; provider state unknown; soil 母倉 unvalidated):
  - token dated 土王用事後 / 朔望日 / 每月十二日十五日 / 每月十五日 chỉ unresolved ở các heading mà `jiInventory` frozen liệt kê, và chỉ khi input đó unknown;
  - 母倉 chỉ unknown ở 納財/栽種/牧養/納畜/修倉庫;
  - reason đúng vocabulary contract (`MISSING_REQUIRED_INPUT`, `OUTSIDE_LOCAL_COVERAGE`, `UNKNOWN_INPUT`, `UNVALIDATED_SOIL_PROVENANCE`);
  - 10 thần còn lại không bị kéo theo.
- **Exact-Jie**: 108 record crossing frozen chạy qua `resolveP4YiDay` với instant provenance. Presence khớp và `instantUtc` được giữ trong trace.

## Thay đổi code

Chỉ sửa `p4YiDayComposition.ts`; core không đổi, verifier body 5.4 vẫn PASS.

1. Thêm `lunarDayInput: { authorityId, value }`. Trước đây lunar-day scopes chỉ ghi presence, mất giá trị ngày âm đã dùng.
2. Thêm `RangeError` code `CONFLICTING_DATED_INPUT` khi soil P4-B, phase và soil 母倉 ghi các ngày dân sự khác nhau. Cùng kiểu với `CONFLICTING_DERIVED_INPUT` của 5.3. Đây là quyết định contract mới, giữ chặt hơn, không đổi kết quả với input hợp lệ.

## CONVENTION_DIFFERENCE: 20 ngày Jie

Month Jian sản phẩm theo quy ước calendar-day: `solarTermMonthChi` cho cả ngày giao tiết theo tháng mới (quy ước CLOSED, dùng cho P4-B và baseline). Domain dated 母倉 3.3 lấy giờ noon. Contract 4.1 ghi "noon selectionContext như baseline" là không chính xác: baseline là calendar-day.

[jie-convention.py](jie-convention.py) chỉ dùng dữ liệu frozen. Trong 20 ngày Jie, 母倉 khác nhau ở **3 ngày**: 2026-05-05, 2026-08-07, 2026-11-07 (noon absent, calendar-day present). Sweep theo selectionContext calendar-day; caller exact-instant truyền instant provenance. Danh sách ở [jie-convention.json](jie-convention.json), chuyển vào review 6.8. Bước audit-only này không xin owner quyết định; nếu cần đổi quy ước Month Jian thì đó là phạm vi CLOSED khác.

## Test

`shared/lunar/p4YiDatedInputs.test.ts`, 8 test. Expected lấy từ authority/artifact JSON frozen và domain 3.3, không từ resolver.

- [RED](red-tests.json): 1 PASS / 7 assertion RED (thiếu `lunarDayInput`, không chặn ngày lệch), không lỗi import.
- [GREEN](test-results.json): 8/8. P4-C suites **4.491 PASS** (4.483 + 8). Legacy/compatibility **201 PASS**.

[Mutations](mutations.json): 4/4 bị assertion bắt, bytes phục hồi:

- bỏ giá trị lunar day: 4;
- bỏ guard ngày: 1;
- soil missing thành absent: 2;
- phase unknown bị resolve: 2.

lint, typecheck main/functions và build PASS. Bundle vẫn `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`. Không có import production. [validation.json](validation.json) ghi hash nguồn expected và code.

## Tái tạo

```sh
npx vitest run shared/lunar/p4YiDatedInputs.test.ts
python3 -I docs/audits/sources/p4-vol10/yi-dated-inputs-v1/jie-convention.py
python3 -I docs/audits/sources/p4-vol10/yi-dated-inputs-v1/check-mutations.py   # chạy riêng, sau mọi test/build
```

## Giới hạn

- Biến thể 720 context ghép input dated của một ngày với context cấu trúc; chỉ dùng để kiểm scope unknown, không khẳng định ngày thật.
- 3 ngày Jie lệch phụ thuộc quy ước Month Jian ngày giao tiết. Các thần monthly khác cũng theo cùng quy ước calendar-day.
- Còn mở: 5.7 gate, 6.x sweep/mutation.
- 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 OPEN, P5 deferred.
- Chưa commit/push/merge/deploy.
