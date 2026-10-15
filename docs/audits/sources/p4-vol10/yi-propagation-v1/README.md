# P4-C 5.4 — Raw/protected 忌, puzhu:28 và propagation do 宜 mới

2026-10-15. **PASS_TASK_5_4_AUDIT_ONLY**. Parent 5.0/P4-C chưa nghiệm thu; next 5.5. Reviewer Claude, single agent; không independent second review.

## Kết quả chính

Trên 1.095 ngày × 29 heading (cùng input với baseline 1.4), sau khi ghép 11 operand 宜:

- **Propagation thay đổi: 0.** `propagatedFrom`/`propagationBlocked` giữ nguyên ở mọi 31.755 dòng; baseline vẫn 0 gỡ / 179 chặn.
- **Raw/protected 忌 thay đổi: đúng 9 dòng**, đều là 求醫療病 ngày 收日 tháng 寅/申 (寅月亥日, 申月巳日). Nguồn 卷十 刼煞 offset 11351: 「寅申巳亥月值收日為月令長生寅申月又值六合止忌安撫邊境選將訓兵出師求醫療病」. 忌 này vốn đã được chứng minh và protected (止忌). Trước đây nó bị ẩn vì 宜 của 天后/天醫/除神 chưa biết. Nay 宜 known false nên 忌 được ghi: undetermined → only_ji, protected. Golden suy từ nguồn ra đúng 9 dòng, khớp kết quả quan sát.
- **puzhu:28**: 8 context áp dụng, gồm 未月甲午. 未月甲子 không áp dụng. Trên ngày áp dụng, mọi 忌 hiệu lực bị gỡ, kể cả protected. 宜 evidence và unresolved trace (vd. 母倉) giữ nguyên.

## Thay đổi code: giữ raw 忌 sau override

Test đỏ cho thấy trên ngày puzhu:28, output **không còn chỗ nào giữ raw 忌** đã bị gỡ (百忌 甲日 開倉, 申日 安牀…). Contract 3.4 yêu cầu `rawJiScopesRetained`. Chỗ sửa:

- `p4YiFullDayCore.ts`: thêm `assembleP4YiFullDayWithRaw`. Hàm này vẫn dựng record thường của từng heading, nhưng trên ngày override chỉ ghi record đó vào `rawJiHeadings` (trước override, trước propagation). Ngày không override thì `rawJiHeadings` chính là `prePropagationHeadings`.
- `assembleP4YiFullDay` công khai bỏ field này. Vì vậy output và hash 720 context của compatibility test 5.3 không đổi.
- `resolveP4YiDay` gọi bản có raw. File lịch sử `p4FullDayComposition.ts`/`p4DayComposition.ts` giữ nguyên bytes.

[verify-core-bodies.py](verify-core-bodies.py) chứng minh full core chỉ khác predecessor ở 宜 injection (5.3) cộng đúng 5 edit raw-retention đã khai báo; day core vẫn parity. Verifier 5.3 bản cũ fail do snapshot 5.3, đúng như dự kiến; không sửa evidence 5.3.

## Golden độc lập

[derive.py](derive.py): Python standard library, chạy `python3 -I`, mọi input được pin SHA-256/SHA-1. Không gọi resolver. Input gồm:

- baseline 1.4: các fact P4-B do evaluator lịch sử `db382ba` tạo ra, là input chứ không phải expected P4-C;
- domain Golden 3.3 cho 11 thần;
- authority 2.14;
- composition 3.4;
- artifact nguồn (dòng propagation 鋪註 11, 16–24; 百忌; dayRules);
- raw 卷十 (kiểm slice theo offset).

Output, khóa bằng [lock.json](lock.json):

| Phần | Nội dung |
|---|---|
| [evidence.tsv](evidence.tsv) | 31.755 dòng: 宜 evidence (null = unknown), unresolved P4-C IDs, recorded 宜 |
| `propagationBound` | 298 target ứng viên (296 new-trigger, 2 fired-target-resolves) và 2.776 reveal candidates. Ngoài tập này, propagation và ji/protected phải giữ baseline |
| `stopJiReveal` | 14 dòng 刼煞 收日 寅/申 × 求醫療病, 9 reveal |
| `override` | 8 context + control 未甲子 với raw 百忌 trong 29 heading; 261 dòng dated trên ngày áp dụng |

`propagationBound` là **cận trên**, không phải dự đoán kết quả của từng ứng viên. Ứng viên có thể đổi; thực tế quan sát 0 thay đổi. Danh sách ứng viên chuyển vào review 6.8.

**CONVENTION_DIFFERENCE**: có 20 ngày Jie mà baseline/getAlmanac gán Month Jian mới cho cả ngày, còn domain dated 母倉 lấy giờ noon. Golden dùng bảng conditional 1.440 đã frozen với Month Jian của baseline và soil theo ngày; resolver nhận cùng Month Jian đó. Xem xét instant/provenance thuộc 5.6.

## Test và RED → GREEN

`shared/lunar/p4YiPropagation.test.ts`, 823 test:

- integrity;
- dated sweep 31.755 dòng;
- 720 context mask `dayOverride` 3.4;
- 4 `sourceContextControls`;
- nửa evidence của 96 `protection`.

Các phần 3.4 này trước đây chưa nối với resolver thật. Nửa cancel/lift/override của `protection` là isolated contract, không có seam export; phần tương ứng trên ngày thật nằm trong sweep và override.

- [RED](red-tests.json): 98 PASS / 725 assertion RED, đều do thiếu raw 忌 sau override; không có lỗi import.
- [GREEN](test-results.json): 823/823. P4-C suites **4.427 PASS** (3.604 cũ + 823). Legacy/compatibility **201 PASS**.

Corrections (ledger trong [validation.json](validation.json); bytes draft cũ ở `superseded-draft/`):

1. GOLDEN_BUG: `rawProtectedBaiji` liệt kê 經絡/醞釀/苫蓋, nằm ngoài 29 heading. Đã lọc, phần ngoài catalog giữ riêng.
2. GOLDEN_BUG: dòng 止忌 đã ghi 忌 sẵn nhưng 宜 vừa resolve vẫn giữ state baseline. Đã áp cùng quy tắc ghi như reveal; chỉ 1 dòng đổi (2026-09-04 申辛巳 undetermined → only_ji). Reveal vẫn 9.
3. SPEC_BUG (test): control 3.4 chỉ cố định một source scope. Trên ngày thật 子月己酉, 收日 「如常例」 chặn ghi 宜 của 天恩. Test giờ kiểm contribution vào evidence; chỉ kiểm recorded false cho control 除神/丁日.
4. SPEC_BUG (test): matcher `p4cTraceIds` dùng arrayContaining.

Không sửa expected để khớp output resolver. Không sửa Golden/lock cũ.

[Mutations](mutations.json): 4/4 bị assertion bắt (raw view = effective: 7; override giữ protection: 8; known absent → unknown: 33; propagation bỏ protection: 1). Runner chạy tuần tự, timeout 300s, phục hồi bytes trong finally. Đây là proof tập trung, không thay gate 6.x.

lint, typecheck main/functions và build PASS. Bundle `index-CeLinrvj.js` vẫn SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`. Không có import production tới module/authority/Golden P4-C.

## Tái tạo

```sh
python3 -I docs/audits/sources/p4-vol10/yi-propagation-v1/derive.py
npx vitest run shared/lunar/p4YiPropagation.test.ts
python3 -I docs/audits/sources/p4-vol10/yi-propagation-v1/verify-core-bodies.py
python3 -I docs/audits/sources/p4-vol10/yi-propagation-v1/check-mutations.py   # chạy riêng, sau mọi test/build
```

## Giới hạn

- Golden được soạn sau khi code 5.3 đã có. Nó chỉ suy từ input frozen ở trên, không từ output resolver.
- `stopJiReveal` chỉ phủ clause 刼煞 寅申月. Các 止忌 reveal khác chỉ có cận trên (thực tế không có).
- Trạng thái dated ngày override giả định recorded 宜 không đổi ở nơi baseline đã ghi; derive dừng nếu gặp trường hợp mơ hồ (0 ca).
- Còn mở: 5.5 王日/warehouse, 5.6 dated provenance (gồm 20 ngày Jie), 5.7 gate, 6.x sweep/mutation.
- 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 OPEN, P5 deferred.
- Chưa commit/push/merge/deploy.
