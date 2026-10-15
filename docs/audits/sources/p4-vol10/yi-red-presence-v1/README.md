# P4-C 4.2 — Source locks, raw offsets và assertion đỏ presence

2026-10-15. **RED_TESTS_RECORDED_BEFORE_PREDICATES**. Task 4.2 hoàn tất phần test đỏ; parent 4.0/P4-C chưa hoàn tất. Reviewer Codex (single agent), không independent second review. Contract là [4.1](../yi-contract-v1/README.md); source/authority/Golden vẫn freeze tại `c12df53207d28a82f4def6a67e63c69bc68e141c`.

## Code và phạm vi kiểm

- `shared/lunar/p4YiOperands.test.ts` đọc immutable presence block từ Golden index; không gọi Python reference, không tạo expected từ evaluator.
- `shared/lunar/p4YiOperands.ts` là khung API RED có signature single-entry đã chốt; chỉ trả `presence: unknown`. Không có bảng, predicate, alias/validation hoặc source trace implementation. Khung này giúp module import/chạy bình thường, để assertion về kết quả thực sự đỏ; không dùng mock hoặc test-local fallback. Được thay bằng provider thực trong 4.4–4.5, không được tính là đã triển khai presence.
- Tests là assertion thông thường trong unit suite, không `skip`, `it.fails`, env opt-in hoặc catch lỗi import. Full suite sẽ còn đỏ có chủ đích cho đến khi triển khai predicate; bước này không phải CI/merge/activation gate xanh.

| Nhóm                                                                                                      | Kết quả tại RED checkpoint  |
| --------------------------------------------------------------------------------------------------------- | --------------------------- |
| Pin SHA-256 source lock + Golden index, 677 locked files, authority và mọi expected block                 | PASS, 1 test                |
| Inventory 11 entry, 906 fixture IDs độc nhất, derivation/source refs và present/absent/boundary từng thần | PASS, 1 test                |
| Raw bytes SHA-1, 5 volume paths                                                                           | PASS, 5 tests               |
| Unicode supplementary Han vs UTF-16 control, đủ 74 slices                                                 | PASS, 1 test                |
| 74 exact raw quote slices: code-point offset/length, bounds, quote length/content                         | PASS, 74 tests              |
| 828 resolved presence fixtures                                                                            | RED, 828 assertion failures |

Tổng **910 tests: 82 PASS / 828 FAIL**, không skipped/todo hoặc collection/unhandled/import failure. Tất cả failures là `AssertionError` tại so sánh `result.presence`, received `unknown`, expected `present` hoặc `absent`. Đủ 11 thần: 260 present và 568 absent. [red-results.json](red-results.json) giữ mọi ID/failure first line, các passing test names, breakdown từng thần và SHA-256 code/test lúc RED; không chỉ suy số failure từ exit code.

828 fixture được chọn từ 906 frozen presence records bằng expected outcome, không bằng output provider. 78 unknown cases giữ nguyên trong block, chưa test behavior ở 4.2; missing/coverage/malformed thuộc 4.3. Full-domain TSV 7.863 records được kiểm hash, **chưa được coi là đã chạy provider full-domain**. Conditional 母倉 1.440 tuples không được gán date/soil validated giả để gọi provider. Alias resolved trong presence block được truyền nguyên requestName nhưng identity/source-trace contract chưa được nghiệm thu tại đây.

## Tái tạo và evidence

```sh
npx vitest run shared/lunar/p4YiOperands.test.ts --reporter=json --outputFile=/tmp/p4c-42-red-vitest.json
```

Lệnh phải exit 1 ở khung RED hiện tại. JSON reporter dùng để phân biệt assertion fail với tooling/import/timeout; [validation.json](validation.json) có replay checker cho frozen hashes, reduced results và production import closure. Báo cáo RED là observation của khung chưa có predicate, không phải Golden mới. Không sửa expected hoặc các lock cũ để test xanh.

Regression A04b/P4-B: 9 files / **198 tests PASS** (day/full-day, heading, lunar day/phase, puzhu-end, soil, season days, youwei). Không chạy lại historical baseline guard tại HEAD sau khi thêm provider; baseline/source-generator guards giữ nguyên và tái tạo ở checkpoint tương ứng như 4.1. `npm run lint`, `npm run typecheck` (main + functions), formatting và diff check PASS; `graphify update .` hoàn tất AST-only, 6.982 nodes / 9.789 edges. Graph quá lớn nên tool tự bỏ HTML visualization; graph/report đã cập nhật.

Legacy API code, manifest, authority/Golden/source locks giữ bytes. Không có import module mới vào production closure. Chỉ tests import khung mới; S1 canonical OPEN, soil 母倉 vẫn owner-adopted/source-dependent, warehouse P5 deferred. Chưa triển khai provider hoặc ghép heading; chưa push/merge/deploy. **Next 4.3** — test missing input/outside coverage/malformed và unknown trace theo contract, trước predicates 4.4.
