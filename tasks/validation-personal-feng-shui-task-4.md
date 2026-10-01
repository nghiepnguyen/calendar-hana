# Task 4 — tích hợp Phong thủy cá nhân và hạn năm

Ngày kiểm tra: 01/10/2026. Nhánh: `codex/personal-feng-shui-expansion`. Không commit/deploy trong task này.

## Phạm vi triển khai

MVP chưa có khi bắt đầu task 4. Đã bổ sung evaluator thuần ngày/giờ, panel và công tắc riêng trước tích hợp P1. Thứ tự tab Ngày: thẻ ngày → sự kiện → Phong thủy cá nhân → Lịch vạn niên. Giữ một hồ sơ ngày sinh đã lưu; giờ sinh không ảnh hưởng MVP/P1, không cần nơi sinh.

Evaluator ngày dùng năm âm sinh đổi ở Tết UTC+7, Can Chi/nạp âm và 12 giờ có sẵn. Kiểm tra sáu nhóm rule bắt buộc; missing/pending/rejected không thành kết luận trung tính. Can hợp được ưu tiên, vẫn hiện chiều sinh/khắc. Lưu ý thắng yếu tố thuận khi tổng hợp; giữ cả hai lý do. Chỉ gợi ý giờ hoàng đạo chung không xung Chi hoặc khắc Can không hợp. Giờ Tý có hai đoạn cùng ngày, Can giờ đổi lúc 00:00. Không đưa hồ sơ vào `getDayInfo` hoặc cache chung.

Hạn năm có context năm âm/tuổi mụ, đủ ba mục và lý do, lựa chọn mục đích/vai trò rõ ràng, trạng thái Không xét/Chưa đủ dữ liệu/Chưa hỗ trợ. Không sửa evaluator năm hoặc nhãn lịch chung. Hoang Ốc giữ miền 10–69. Nguồn và phiên bản xem qua details native, dùng bàn phím được; không đưa file path/ID kỹ thuật lên giao diện hoặc diễn giải tác hại/nghi thức từ attachment.

Purpose/role chỉ trong phiên, không thêm schema. Đổi purpose đặt role về self khi general, unspecified ở mục đích khác; xóa hồ sơ/đổi tài khoản/remount về general/self. Công tắc MVP `showPersonalFengShui` mới là trường persist: bản cũ mặc định bật, false được giữ qua JSON/cloud, không phụ thuộc `showAuspicious`. Migration không ghi đè cài đặt cloud có sẵn. Không lưu kết quả dẫn xuất.

Hook `useSettings` gắn snapshot với đúng repository, không hiển thị thông tin tài khoản trước trong lúc tài khoản mới đang tải. Link nhập/sửa ngày sinh mở đúng tab và focus input. Không gửi hồ sơ/lựa chọn/kết quả vào analytics hoặc URL. Analytics hiện tắt autocapture/session recording; panel thêm lớp bảo vệ capture/mask.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | 915 test / 81 file đạt, gồm regression âm lịch/lịch chung, 25 test evaluator ngày, panel, biên giờ, đổi tài khoản/rule, JSON và focus. |
| `npm run test:emulator` | 28 test / 3 file đạt; thêm snapshot công tắc và cloud/JSON/migration giữ false. |
| `npx playwright test e2e/personal-feng-shui.spec.ts --project=desktop --project=mobile --workers=2` | 18 test đạt: nhập/xóa hồ sơ, xác nhận vai trò, không đổi kết luận ngày/lịch chung, reload không giữ purpose/role, công tắc độc lập, offline. |
| Giao diện/axe trong E2E | 360px × 3 cỡ chữ × sáng/tối, hai project; không tràn ngang, select/summary ≥44px, nguồn mở bằng Enter, không lỗi WCAG 2 A/AA và 2.1 AA trong panel. |
| `npm run typecheck`, `npm run lint`, `npm run format:check`, `git diff --check` | Đạt. |
| `npm run build` / build của E2E | Đạt; dữ liệu và module mới được PWA precache, offline đã chạy. |
| `npm audit --audit-level=high` | 0 lỗ hổng; không thay dependency trong task 4. |

12 fixture tích hợp trong `day.test.ts` dùng ngày Đinh Dậu 20/09/2026, hồ sơ 01/07 các năm 1990–2001 (đều sau Tết), nạp âm, quan hệ Chi và summary viết bằng tay theo bảng và policy PRD, không sinh kỳ vọng bằng evaluator. Có tam hợp nhưng nạp âm khắc, Can hợp nhưng nạp âm khắc, Chi xung nhưng sinh nhập, cùng ngày khác tuổi cho kết luận khác. Bảng 12×12 Chi, 10×10 Can và 25 chiều ngũ hành được kiểm tra; giờ được gợi ý phải đáp ứng điều kiện loại trừ.

## Dung lượng và giới hạn nghiệm thu

So sánh build Vite của HEAD trước task (`29aeb9c`) với bản task 4, cùng Node 23.7.0 và cấu hình môi trường build, gzip từng file bằng `node:zlib`, cộng toàn bộ JS/CSS trong `dist/assets`:

| | JS gzip | CSS gzip | Tổng |
| --- | ---: | ---: | ---: |
| Trước task | 526302 byte | 18467 byte | 544769 byte |
| Task 4 | 538167 byte | 18810 byte | 556977 byte |
| Tăng | 11865 byte | 343 byte | **12208 byte (~11.9 KiB)** |

Đạt mục tiêu tăng dưới 20KB gzip. Đây là toàn bộ asset JS/CSS, không phải chỉ kích thước module thuần, không tính các trang prerender hoặc service worker. Bản baseline dùng checkout tạm, không sửa checkout/nhánh người dùng.

Chưa đo thời gian tính dưới 10ms trên điện thoại tầm trung thật, chưa thử khả năng hiểu với 5 người dùng, chưa kiểm tra bằng người dùng screen reader hoặc chạy ma trận Firefox/WebKit trong lượt này. Đây là các bước nghiệm thu phát hành còn lại; chưa tuyên bố toàn bộ success metrics MVP đạt. Build còn cảnh báo chunk lớn/deprecation từ cấu hình hiện có; unit test có cảnh báo jsdom scrollTo và Emulator có cảnh báo metadata lookup nhưng các lệnh đều exit 0.
