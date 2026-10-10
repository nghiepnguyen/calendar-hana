# Conflict diagnostics — bước 3, 10/10/2026

Phạm vi: phân tích evidence có context nguồn để phục vụ explainability. Không thay scoring, classification, hard warnings, cancellation hoặc chọn authority thắng. Nhánh `codex/activity-taxonomy`.

## Contract

`analyzeEvidenceConflicts(rows, context)` nhận evidence cùng context đánh giá và trả:

- version `evidence-conflicts-v1`, bản sao context operand.
- conflicts: activityId/scope, kind, authorityIds, witnesses (ruleId/sourceRef/polarity/authorityId), reviewPending.
- unresolved: ruleId/sourceRef và lý do không thể khẳng định applicability/conflict.
- notApplicable: no_evidence hoặc điều kiện không khớp context.

Điều kiện hiện tại là các equality operand, kết hợp AND. Thiếu operand/giá trị không hữu hạn/missing conditions giữ unresolved. Ngoại lệ dạng free text hoặc không khai báo exceptions giữ unresolved; không tự suy hiệu lực ngoại lệ. Evidence có ID rỗng, mapping unmapped, cặp ID/scope không hợp lệ, hoặc thiếu authority context không được dùng để khẳng định xung đột.

Chỉ positive và negative đối lập. Neutral không được xem là negative; hai scope khác nhau không tự inherit. So sánh trên cùng activity/scope và context cụ thể mà các conditions đều khớp, không dựa vào giống nhau của chuỗi điều kiện.

- within_authority: positive và negative trong cùng authority ID.
- between_authorities: positive và negative đến từ các authority ID khác nhau.
- Hai loại có thể cùng tồn tại. Không majority vote, dedup để tăng/giảm độ tin cậy hoặc chọn winner. Witnesses và input nguyên vẹn; input không bị sửa.
- Authority ID phải định danh edition/convention; không đoán từ URL. Pending mapping cho diagnostics với reviewPending=true, không trở thành chứng nhận diễn giải hoặc scoring.

Không có conflicts chỉ nghĩa là chưa thấy cặp đối lập có applicability rõ trong tập evidence đầu vào; không có nghĩa activity được phép hay tất cả nguồn đã thống nhất. Danh sách unresolved phải được đọc cùng conflicts.

## Tích hợp và giới hạn

`EventEvaluation.conflictAnalysis` phân tích mansion contributions liên quan đến roles của sự kiện, với MANSION_INDEX của ngày. Unknown event/invalid date có diagnostics rỗng. Không phân tích toàn bộ clause không liên quan đến event, không suy rằng các clause có ID rỗng đã được review hoặc giải quyết. API standalone có thể phân tích toàn bộ 115 clauses (70 mapped, 45 unmapped).

Current production subset chỉ có một authority 1880; between_authorities được chứng minh bằng witnesses tổng hợp có expected outcomes khai báo trực tiếp trong test. Chưa thu thập/audit authority thứ hai. Trực/cát/hung thần chưa có contract source/convention context đủ cho lớp này, chưa migrate. Legacy `status=conflict` và `conflictLevel`/verdict policy cũ giữ nguyên.

Đây là lớp chẩn đoán phục vụ conflict resolution, chưa phải policy tự giải quyết xung đột hay thay đổi verdict. UI chưa hiển thị report mới.

## Acceptance và bằng chứng

`evidenceConflicts.test.ts` kiểm tra opposing witnesses, majority independence, cross-authority distinction, neutral/nonoverlapping scope, missing context, unresolved exceptions, no_evidence/nonmatching conditions, đồng thời có hai loại conflict, input immutability và integration event. Expected outcomes được viết trực tiếp, không lấy từ runtime resolver.

Toàn bộ 28 mansion content records được kiểm tra: diagnostics không báo conflict nội bộ, điểm bằng 0 và status informational. Golden Phase 7 và baseline quyết định 2025–2027 giữ nguyên; regression kiểm tra 1.095 ngày × 11 event với hour=9. Không sửa Golden để hợp code mới.

## Tiếp theo

Explainability: hiển thị nguồn, quote, activity/scope, applicability, mapping review và các witnesses đối lập/còn unresolved. Sau review mapping và context của các nguồn khác mới có thể thiết kế policy resolution cụ thể; không tự bật scoring 28 Tú.

## Kết quả local

`npm test`: 139 files / 2.783 tests passed. Typecheck, lint, Prettier và diff-check passed. Dataset authority và manifest không có diff. Suite có ba thông báo jsdom scrollTo chưa implement, không có test failure. Chưa commit/push/PR/deploy.
