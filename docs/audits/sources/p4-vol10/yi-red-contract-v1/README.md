# P4-C 4.3 — Test đỏ input contract và unknown trace

2026-10-15. **RED_INPUT_CONTRACT_AND_MASKED_TRACE_RECORDED**. Task 4.3 hoàn tất phần test; parent 4.0/P4-C chưa hoàn tất. Reviewer Codex (single agent), không independent second review. [Contract 4.1](../yi-contract-v1/README.md) và authority/Golden freeze `c12df53207d28a82f4def6a67e63c69bc68e141c` giữ nguyên.

## Tests và bằng chứng đỏ

`shared/lunar/p4YiInputContract.test.ts` chạy **502 tests: 2 PASS / 500 assertion RED**, không skip/todo, import/collection failure hoặc timeout. [red-results.json](red-results.json) giữ toàn bộ 500 case IDs, title và assertion first line; numeric case labels giữ định danh duy nhất khi Vitest rút gọn string dài.

| Nhóm                                                                    | Số assertion RED | Căn cứ                                                                                |
| ----------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| Unknown với reason/identity/authority/input/source refs/missingInputs   | 78               | Frozen presence block, đủ 11 thần                                                     |
| Explicit undefined của từng required key → missing                      | 20               | Contract 4.1; không đồng nhất null với undefined                                      |
| Malformed fixtures → RangeError + stable code/inputKey/requestName      | 24               | Frozen malformed block                                                                |
| Required null → malformed                                               | 20               | Contract 4.1                                                                          |
| Invalid required provider-state tag → malformed                         | 20               | Contract 4.1                                                                          |
| Malformed không bị required key khác missing/outside che                | 34               | Contract validation order, 17 required-key contexts × 2                               |
| Irrelevant input không đổi outcome hoặc used-input/provider-state trace | 276              | 69 frozen recipes × 4 concrete variants                                               |
| Present che unknown nhưng giữ toàn bộ trace/unresolved IDs              | 14               | Frozen synthetic listed-heading ANY vectors                                           |
| Cùng vector có evidence 宜 true                                         | 14               | Frozen synthetic vectors; assertion riêng để trace failure không che evidence failure |

Hai PASS guards kiểm hash immutable presence/composition blocks, số lượng/coverage selection và mapping recipe không thay required inputs. Unknown fixtures phân biệt 32 missing, 20 provider unknown, 20 outside-provider, 2 outside-local, 3 unvalidated soil provenance và 1 unknown soil. Khung chỉ trả unknown không đủ làm các test này xanh: tests còn đòi reason và trace tương ứng. Malformed phải throw `RangeError`, sau đó kiểm stable code; không biến error thành absent/unknown.

## Adapter input không liên quan

[irrelevant-input-adapter.json](irrelevant-input-adapter.json) là **test input adapter**, không phải authority/Golden mới. Map chín recipe labels (`MonthJian`/`monthJian`, dayStem, lunarMonth, lunarDay, moonPhase, soil, birthYear, personalPillar) sang keys API dùng trong test. Mỗi recipe chạy omitted, hai concrete alternatives và malformed irrelevant null. Provider-state outside trên key không required cũng phải bị bỏ qua.

Required tuple và expected giữ nguyên từ fixture. Hai soil alternatives lấy nguyên evidence present/absent từ dated 母倉 fixtures đã khóa, không tạo validated/date giả. Null chỉ được bỏ qua khi key không required; 20 required-null tests kiểm chiều ngược lại. Trace phải chứa đúng required inputs/provider states, không copy key irrelevant vừa truyền vào. Đây là 276 runnable variants, khác với 69 recipe records được đếm ở Golden trước khi có adapter.

## Masked unknown và seam ghép evidence

Thêm `shared/lunar/p4YiEvidence.ts` với signature `composeP4YiEvidence(heading, operands)`. Đây là seam RED cho **operands đã được caller chọn vào heading**; khung trả yi undefined / trace rỗng / unresolved rỗng. Chưa có ANY calculation, trace assembly, heading routing, suppression hoặc propagation. Tầng này sẽ được triển khai khi ghép operand ở 5.x, không tính là presence provider hoặc full-day composer đã xong.

14 vector synthetic đều dùng listed heading 求醫療病 và chứa cả present lẫn unknown. Test gọi seam thật, không mock, không tự tính ANY trong test, không gọi resolver ngày cũ để tạo expected. Assertions so exact trace và unresolved IDs giữ authority/rule/source/inputEvidence từ frozen vectors; assertion riêng đòi evidence true. Đây là projection contract; không tuyên bố gods đồng hiện trên ngày thật hoặc entry point 5.3 đã tích hợp. 26 ANY vectors còn lại, routing/normalization, protection/override/P5 và real-day integration tiếp tục ở 5.x.

## Validation và phạm vi còn lại

```sh
npx vitest run shared/lunar/p4YiInputContract.test.ts --reporter=json --outputFile=/tmp/p4c-43-red-vitest.json
```

Exit 1 là kết quả RED hiện tại. [validation.json](validation.json) có replay kiểm evidence, 677 frozen hashes, code checkpoint và production import closure. Không sửa bytes của 4.1/4.2 evidence hoặc source/Golden/locks để hợp output mới. Provider và test 4.2 giữ bytes: chạy lại vẫn 82 integrity PASS / 828 presence RED. Legacy regression A04b/P4-B: **9 files / 198 tests PASS**. `npm run lint`, main/functions typecheck, formatting/diff qua; graphify AST update xong, 7.013 nodes / 9.819 edges.

Chỉ thêm test, adapter/evidence và seam RED; provider single-entry vẫn là khung unknown, không thêm predicate/validation/trace implementation. Legacy API, runtime/manifest không đổi; production closure không import hai khung mới. S1 canonical OPEN, soil 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, warehouse P5 deferred. Unit suite còn RED có chủ đích; chưa CI/merge/activation gate xanh, chưa push/merge/deploy. **Next 4.4** triển khai 11 predicate từ authority; source/input trace hoàn thiện ở 4.5, gate ở 4.6, heading integration ở 5.x.
