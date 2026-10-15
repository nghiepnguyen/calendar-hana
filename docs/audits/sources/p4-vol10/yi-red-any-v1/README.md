# P4-C 5.2 — ANY / unresolved trace regression RED

2026-10-15. **EXPECTED_ASSERTION_RED**, task 5.2 hoàn tất. Next 5.3 ghép provider audit-only; parent 5.0/P4-C chưa nghiệm thu. Reviewer Codex (single agent), không independent second review.

Test mới shared/lunar/p4YiAny.test.ts dùng nguyên 40 vectors trong sections.any của composition Golden frozen c12df53 (checksum lấy Golden index). Không sửa expected, authority, provider hoặc seam composeP4YiEvidence.

Selection guard kiểm đủ mọi ordered ternary vector lengths 0–3 (1+3+9+27), cùng 14 masked vectors. Không suy expected bằng duplicate ANY implementation. JSON null chỉ adapter sang undefined, false giữ nguyên.

161 tests: **68 PASS / 93 assertion RED / 0 skip**:
- Selection/checksum: 1 PASS.
- ANY decision: 11 PASS (unknown), 29 RED (present→true, all absent/empty→false).
- Complete ordered trace: 1 PASS (empty), 39 RED; giữ mọi field authority/source/status/input, không chỉ ID.
- Unresolved IDs: 15 PASS (không unknown), 25 RED; gồm 14 present-masked unknown vectors.
- Input immutability: 40 PASS.

Các nhóm test độc lập: failure ở decision không che trace hoặc unresolved assertions. Unknown cũng phải giữ trace khi final yi đã true. Mọi failure đều AssertionError, không import/collection error. Exit 1 là RED được yêu cầu; không tuyên bố full unit/CI xanh. Trường hợp empty decision RED dù empty trace PASS, nên không thể dùng trace rỗng thay kết quả false.

Regression chạy lại 5.1 và 4.3: **513 PASS / 947 RED** (919 heading + 28 masked ANY cũ), không skip. Evidence 5.1 checksum giữ nguyên. Replay verifier 4.6 PASS:677 frozen source/Golden hashes, prior code/evidence/manifest, production import closure và bundle checkpoint. Legacy198 kết quả 4.6/5.1 được reuse vì không đổi implementation. npm run lint và npm run typecheck main/functions PASS. Không build mới: chỉ thêm test. graphify update . PASS (7129 nodes/9970 edges); tool bỏ graph.html theo ngưỡng kích thước.

Reproduce (hai lệnh Vitest dự kiến exit 1):
```sh
npx vitest run shared/lunar/p4YiAny.test.ts --reporter=json --outputFile=/tmp/p4yi52-results.json
npx vitest run shared/lunar/p4YiHeadingScope.test.ts shared/lunar/p4YiInputContract.test.ts --reporter=json --outputFile=/tmp/p4yi52-regression.json
npm run lint
npm run typecheck
python3 -c "import json; exec(json.load(open('docs/audits/sources/p4-vol10/yi-presence-gate-v1/validation.json'))['verificationPython'])"
graphify update .
```

[Test output](test-results.json), [regression output](regression-results.json), [validation/checksums](validation.json). Validation có verificationPython để kiểm lại exact totals, assertion failures, artifact hashes và prior evidence.

Giới hạn: synthetic listed operands cho 求醫療病, không chứng minh co-presence ngày thật. Routing/scope test ở5.1; integration5.3/protection5.4/warehouse5.5/sweep-mutation6.x còn mở. 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 canonical OPEN/P5 deferred. Không commit/push/merge/deploy.
