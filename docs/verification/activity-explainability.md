# Activity explainability — bước 4, 10/10/2026

Nhánh `codex/activity-taxonomy`. Tích hợp contract taxonomy/mapping/conflict diagnostics vào phần “Thông tin Tú (tham khảo)” của DailyActivitySection.

## Hành vi

- Phần tham khảo thu gọn mặc định, mở được bằng bàn phím. Khi đổi ngày hoặc mục tiêu, disclosure được tạo lại ở trạng thái đóng.
- Hiển thị cho mục tiêu event và activity riêng: nhãn nguồn, bản dịch, câu trích nguyên văn, phạm vi hoạt động, review diễn giải pending, điều kiện áp dụng và ngoại lệ nếu có. Link “Bản scan nguồn” mở tab mới với noopener/noreferrer.
- Không có clause liên quan: ghi nguồn chưa nêu rõ việc đã chọn, không suy thành permission hoặc taboo.
- Những clause ID rỗng nằm trong nhóm “Việc khác trong nguồn chưa có mục tương ứng”, tách với evidence liên quan mục tiêu; không tự gán chúng cho mục tiêu đã chọn.
- Phân tích report dùng analyzer bước 3 trên các rows đang hiển thị, context MANSION_INDEX của ngày. Hiển thị opposing witnesses/cùng bản hay giữa các bản khi có; missing applicability và unresolved exceptions có lý do tiếng Việt.
- Không hiển thị raw ID/schema/status kỹ thuật trong product flow. Pending mapping không được trình bày như review đã hoàn tất.
- CSS kế thừa typography/tokens/focus của giao diện, quote ngôn ngữ zh-Hant, link có tap target và chống tràn ngang.

## Compatibility và giới hạn

Không đổi engine scoring/verdict, dataset nguồn, Golden, astronomy hay personal policy. 28 Tú tiếp tục informational/scoreDelta=0. Các hoạt động chưa có ID vẫn pending; source lock không thay mapping review.

UI này phục vụ nguồn 28 Tú đã có contract. Không mở thêm authority hoặc tự resolve nguồn thắng; các case cross-authority vẫn là diagnostics. Không mở rộng evidence nguồn của Trực/cát/hung thần trong bước này.

## Kiểm tra

Component tests: mặc định đóng/mở, quote/source link/pending review, unmapped riêng, opposing excerpts, ngoại lệ unresolved, thiếu evidence không thành permission, integration với thao tác chọn Cưới hỏi và giữ nguyên verdict.

Kiểm tra thật bằng browser tại /day/2026-10-10: chọn nhóm Tình cảm → Cưới hỏi → Enter mở phần tham khảo. Kết luận “Chưa đủ dữ liệu” giữ nguyên, clause mở cửa/dẫn nước ở nhóm riêng; link scan và quote hiển thị. Responsive width 390 px: section clientWidth=scrollWidth=358 px, không tràn ngang. Viewport override đã reset.

Ảnh kiểm tra local: /private/tmp/calendar-hana-activity-explainability.jpg. Ảnh là development preview, không phải production release.

Kết quả local: 140 test files / 2.787 tests passed; sau sửa tùy chọn test không hợp lệ, component suite 4/4 passed và typecheck/lint/Prettier/diff-check passed. Build qua webServer của E2E thành công; existing mansion-content E2E desktop/mobile 4/4 passed. Các warnings bundle >500 kB và inlineDynamicImports deprecated còn tồn tại, không chặn build. Chưa commit/push/PR/deploy.
