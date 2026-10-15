# P4-C 5.1 — Heading scope regression RED

2026-10-15. **EXPECTED_ASSERTION_RED**. Task 5.1 hoàn tất; parent 5.0/P4-C còn mở, next 5.2. Reviewer Codex (single agent), không independent second review.

Test mới: shared/lunar/p4YiHeadingScope.test.ts. Dùng nguyên composition block của Golden frozen c12df53; không tính expected bằng provider/composer, không sửa authority/Golden/source locks. Seam composeP4YiEvidence hiện có vẫn chưa triển khai.

958 tests: **39 PASS / 919 assertion RED / 0 skip**:
- Selection/checksum guard PASS; 924 scope vectors = 11 thần × 28 heading không warehouse × present/absent/unknown: 20 PASS (listed unknown), 904 RED.
- Mỗi thần có cả listed và unlisted heading ở cả ba state. Unlisted present/unknown phải false, không lan sang scope khác.
- 15 normalization helper checks PASS, gồm 立劵交易→立券交易, 破屋壞垣→破屋壊垣, 宴㑹→宴會, 修宫室→修宮室 và canonical idempotence.
- 15 raw/canonical routing checks: 3 unknown PASS/12 RED. Expected routing lấy đúng canonical key/state trong frozen headingScope, không suy listedness từ spelling.
- 3 福徳→福德 alias trace checks RED; requestName gốc/authority/source trace phải giữ. Đây là synthetic composer vectors; provider identity đã kiểm ở 4.5.

Mọi failure đều AssertionError; không import/collection/tooling error. Exit 1 là kết quả RED được yêu cầu, không tuyên bố unit/CI xanh. Trace checks và routing có test riêng để failure đầu không che các nhóm sau. File JSON giữ toàn bộ test names/failure messages.

Regression chín suites legacy **198 PASS**; npm run lint và npm run typecheck (main/functions) PASS. Replay verifier 4.6 PASS: 677 frozen hashes, prior evidence/code/manifest bytes, static production closure và bundle checkpoint bất biến. Không build lại vì chỉ thêm test; không sửa runtime/provider/seam. graphify update . PASS (7117 nodes/9958 edges); graph.html bị tool bỏ qua theo ngưỡng kích thước.

Reproduce:
```sh
npx vitest run shared/lunar/p4YiHeadingScope.test.ts --reporter=json --outputFile=/tmp/p4yi51-results.json
npm run lint
npm run typecheck
python3 -c "import json; exec(json.load(open('docs/audits/sources/p4-vol10/yi-presence-gate-v1/validation.json'))['verificationPython'])"
graphify update .
```

[Results](results.json), [test output](test-results.json), [legacy output](legacy-results.json), [validation](validation.json). Legacy suite paths nằm trong testResults[].name.

Giới hạn: isolated synthetic operands không chứng minh co-presence ngày thật; không ANY combinations (5.2), integration (5.3), protection/override (5.4), warehouse deferral (5.5) hoặc sweep/mutation (6.x). 33 warehouse vectors giữ frozen và chưa chọn ở đây. 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT, S1 canonical OPEN/P5 deferred. Không commit/push/merge/deploy.
