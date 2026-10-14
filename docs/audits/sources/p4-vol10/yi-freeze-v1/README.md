# P4-C 3.6 — Authority, Golden và source freeze trước implementation

2026-10-14. Golden bundle index: [`golden-p4-yi-operands-v1.json`](../../../../../shared/almanac-data/golden-p4-yi-operands-v1.json). Authority snapshot: [`p4-yi-operands-v1.json`](../../../../../shared/almanac-data/p4-yi-operands-v1.json). Không sửa bytes của authority/expected/raw/scan/lock lịch sử để đổi status; disposition mới nằm trong index/lock và commit proof.

## Bundle contract

Golden là **index của immutable blocks**, không phải output evaluator hoặc JSON copy được tái tạo từ resolver. Mỗi block có repo-relative path, JSON selector/TSV format, SHA-256 và record count. Consumer audit đọc đúng blocks đã pin:

| Block                           | Snapshot                                               | Record count  |
| ------------------------------- | ------------------------------------------------------ | ------------- |
| Presence / identity / malformed | `yi-expected-v1/expected.json` — ba arrays riêng       | 906 / 25 / 24 |
| Full domains                    | `yi-domains-v1/expected.tsv` — JSON columns giữ nguyên | 7.863         |
| Composition                     | `yi-composition-expected-v1/expected.json` — sections  | 1.850         |

**10.668 records** ở nhiều miền có overlap, không phải unique days hoặc product test count. Presence/domain/composition semantic bytes giữ nguyên bản đã review 3.5. Chỉ thêm index/status/checksum/freeze receipt, không rederive hoặc sửa expected. JSON null là unknown 宜; false là known absent. Path/selector trong index không phải runtime imports.

[lock.json](lock.json) khóa authority/index/blocks, source/basis/reference/review files và prior locks/contract inputs. [prior-hashes.json](prior-hashes.json) chứng minh **672 file có trước 3.6 giữ bytes tại checkout hiện hành** (671 source/data/reference files + một Finder metadata record không phải source). Source closure loại `golden-v3/.DS_Store` vì đây là local Finder metadata bị ignore, không input của expected generators; không force-commit nó. Các prior-hashes cũ giữ nguyên, không giả checksum của metadata vắng mặt trong clean checkout. Source lock không hash chính nó; Golden index trỏ lock path, không hash lock để tránh checksum cycle.

## Commit binding và proof

Freeze được thực hiện bằng một local Git commit chứa index, authority, mọi evidence 2.2–3.5 chưa commit và source closure. [commit-proof.json](commit-proof.json) được tạo **sau** freeze commit, ghi commit/tree/SHA-256 và proof từ Git object. Không thể ghi SHA của commit vào chính bytes mà commit đó chứa; receipt là evidence bổ sung, được commit cùng cập nhật tiến độ ở commit kế tiếp. Không amend freeze commit.

`validation.json` chứa gate trước code: replay review 3.5/prior validators; kiểm block/authority/source hashes/counts/prior bytes. Sau khi receipt có mặt, gate còn đọc `git show <freezeCommit>:<path>` và so hash mọi locked file, kiểm tree/ancestor và source-lock Git blob. Current task checklist chỉ chốt sau proof commit đã qua.

Lệnh replay:

```sh
python3 - <<'PY'
import json
exec(json.load(open('docs/audits/sources/p4-vol10/yi-freeze-v1/validation.json'))['verificationPython'])
PY
```

Git default whitespace check báo CRLF của `yi-comparison-v1/comparison.tsv`; dùng `cr-at-eol` cho check, không đổi TSV/raw/expected để tránh phá lịch sử lock.

Đây là **before-implementation replay**. Clean checkout không có Finder metadata thì chạy semantic source-generator replay và Git blob proof; local broad-snapshot guards cũ vẫn giữ nguyên và đã replay đầy đủ ở checkout gốc. Không tuyên bố metadata được kiểm khi nó vắng mặt. Sau khi bắt đầu code, tái tạo source arithmetic/historical validators trong checkout của freeze commit; không dùng runtime thay đổi để viết lại Golden hoặc sửa snapshot guards cũ. Tests cho implementation đọc block/source hashes đã pin và so output với expected. Gate này không phải test API P4-C chưa được viết.

## Reviewer, limits và phạm vi còn lại

Review 3.5 PASS với giới hạn đã ghi; reviewer **Codex (single agent)**, independentSecondReview false. Index kế thừa toàn bộ limitations: 69 optional-input recipes, malformed contract fixtures, conditional soil/protection/warehouse projections và 四相 existing stub. Adapter và integration proof tiếp tục cần 4.1/4.3/4.6/5.4/6.8, không được coi freeze là production acceptance.

Authority 11/11 trong adopted scope; 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT chỉ 2025–2027, S1 canonical OPEN. P5 修倉庫 co-presence/月恩/月德 vẫn deferred. Parent 3.0 chỉ hoàn tất Golden stage sau commit/checksum proof; toàn P4-C chưa nghiệm thu. Next **4.1 contract/callers**; chưa presence implementation, activation, push, merge hoặc deploy.

Chỉ freeze artifact/audit evidence và cập nhật tiến độ; product TypeScript/runtime/manifest/scoring giữ nguyên. Không thêm validator vào CI hoặc viết test đỏ/provider trong 3.6. Tái dùng matching lint/typecheck/compile từ 3.4; chạy packaging/hash/review/format/diff checks cho bước này.
