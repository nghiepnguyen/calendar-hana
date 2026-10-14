# P4-C 3.5 — Review expected độc lập, input và coverage

2026-10-14. **Task 3.5 hoàn tất — PASS_SINGLE_REVIEWER_WITH_RECORDED_LIMITS**. [review.json](review.json) bind toàn bộ artifact được review bằng SHA-256. Không có blocking finding hoặc correction expected/source mới. Chưa authority/Golden commit freeze 3.6, parent 3.0/P4-C chưa nghiệm thu.

## Reviewer và cách review

Reviewer **Codex (single agent)**, cùng agent đã chốt nguồn và suy expected 3.1–3.4. Đây là lượt self-review sau derivation; **`independentSecondReview: false`**, không xác nhận chuyên gia hoặc source reviewer thứ hai. Tính độc lập đang kiểm là expected với production/future evaluator, không phải hai người review độc lập.

Đã đọc dependency/data flow của ba Python generators và source-basis/domain contracts; replay read-only cả bốn validator 3.1–3.4. Generator 3.2 dùng standard-library arithmetic từ raw/scan literal; 3.3 và bốn control 3.4 tái dùng đúng reference đã pin hash. Không import/call TS provider/resolver/scorer hoặc đọc `entry.predicate` để tính expected. Metadata heading/rule ID vẫn phụ thuộc authority text đã review và được pin; không tự gọi đó là một nguồn cổ văn độc lập thứ hai.

Checkpoint nhánh `codex/p4c-yi-operands`, HEAD `f54aaf849fdb4b42d07c6919f13ec7c18c93c1ac`, tree `d410122e596268ad5f89bee2fa2fe217d05c9bb2`. HEAD chỉ mô tả checkout, không phải commit chứa toàn bộ evidence hiện đang untracked/modified. Review kiểm bytes thực tế ở working tree; commit freeze thuộc 3.6.

## Kết quả review

| Tiêu chí             | Kết quả / proof                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Independence         | PASS: dependency chain chỉ stdlib và fixed/hash-bound audit reference; source expected không đến từ resolver/scorer output                      |
| Input validity       | PASS: mọi affirmative pillar hợp lệ; JDN/date/UTC+7/Jie/soil provenance đã kiểm; malformed fixtures cố ý sai và được tách khỏi missing/coverage |
| Presence coverage    | PASS: 11/11 thần; 56 applicable matrix cells; 7 exact 720 domains, 3 exact 60 domains; 母倉 conditional/date/instant miền riêng                 |
| Composition coverage | PASS: ANY40, scope957, normalization15, protection96, override720 đúng8, warehouse18 và context4; giữ unknown trace/raw protected facts/P5      |
| Integrity            | PASS: **667 file có trước review giữ bytes**, gồm nguồn/Golden/artifact/locks 3.1–3.4; PRD/spec và các input review được hash-bound riêng       |
| Reviewer/limits      | PASS: single reviewer được ghi rõ; không source/canonical/runtime acceptance hoặc freeze giả                                                    |

Inventory có **10.668 records**: 906 presence + 25 identity + 24 malformed + 7.863 domain + 1.850 composition. Đây là nhiều miền/contract có overlap, **không phải 10.668 ngày khác nhau hoặc 10.668 test production đã chạy**. Matrix 66 cells là coverage plan riêng, không cộng vào số record này. Presence fixtures chia 507 structural / 399 dated; structural tuple không khẳng định ngày thật.

Review giữ lại bốn correction **SPEC_BUG** lịch sử từ 3.2/3.4 cùng scope/resolution trong `historicalCorrections`; không sửa lịch sử hoặc chạy lại expected để khớp product code. `newCorrections: []`, `blockingFindings: []`.

## Giới hạn và cách dùng khi triển khai

- **69 irrelevant-input records là recipe** với required tuple và “omitted/valid alternative”, chưa chứa concrete optional values chạy qua adapter. Không tính chúng như proof runtime invariance. Chốt mapping ở 4.1, chạy cases phù hợp ở 4.3/4.6.
- **24 malformed fixtures là contract expected error**. Python reference không phải input validator sẽ được kiểm; shape của null/missing/error class và provider coverage được chốt ở 4.1/4.3. Không dùng reference trên mọi malformed input rồi gọi đó là production validation proof.
- **母倉 1.440 conditional tuples** không có dated soil provenance, không được truyền như valid full-provider inputs. Ngày thật 1.095 noon + 108 exact Jie là miền sample đã khai báo; không nới dated coverage hoặc tự chứng nhận mọi intraday instant.
- **Protection/ANY/warehouse vectors là isolated contracts**. Protection projections ghép cancel/lift request trong cùng case, chưa kiểm full propagation độc lập với cancellation. Actual changed rows, scopes còn unknown và integration Golden cần 5.4/6.8, không đổi baseline counts bằng fixture giả.
- **四相 existing stub** có null authority/rule IDs được khai báo rõ; adapter 4.1 phải nối operand đã audit, không tạo authority mới từ placeholder.
- **Source arithmetic reuse** không phải fresh astronomy audit hoặc independent second implementation. Calendar/JPL input references đã được khóa từ phase trước; scan review cũ giữ giới hạn đã ghi.
- **母倉 vẫn OWNER_ADOPTED_SOURCE_DEPENDENT**, canonical S1 OPEN; warehouse 月恩/月德/co-presence P5 vẫn deferred. Không nâng status hoặc chọn rule ngoài scope.
- **Pending status của snapshot cũ giữ nguyên bytes**. Review disposition hiện hành nằm trong report mới này. Commit freeze/new source lock/Golden packaging 3.6 còn mở.

Các giới hạn trên không chặn review artifact trong scope 3.5; chúng giới hạn những gì được phép tuyên bố ở bước implementation/acceptance sau. Không có yêu cầu owner decision mới trong adopted scope.

## Validation và tiến độ

[validation.json](validation.json) lưu lệnh/verifier có thể replay. Chạy lại exact source/lock/domain/input/trace checks 3.1–3.4; AST kiểm dependencies, phân loại input đúng domain và ledger corrections; new review lock/checksum, JSON/README format và `git diff --check` qua. Reuse lint/main+functions typecheck/Python compile từ 3.4 vì generator/product/source bytes giữ nguyên; không thêm hoặc sửa code để review xanh.

[prior-hashes.json](prior-hashes.json) bảo toàn 667 file. [lock.json](lock.json) khóa report/README/verifier cùng prior locks và input contract PRD/spec. Đây là **review integrity**, không authority/Golden commit freeze. Không thay source hoặc expected cũ.

**Next 3.6**: đóng băng authority/Golden/nguồn bằng commit/checksum và source lock mới, kiểm bytes lịch sử bất biến trước implementation. Chưa làm 3.6, chưa chốt parent 3.0/P4-C; chưa thay production/manifest/scoring.
