# Nghiệm thu popup mời cài app — 06/10/2026

## Phạm vi triển khai

Triển khai trên `main`. Popup nằm ngoài Routes, dùng mốc navigation start để tính 120 giây kể cả thời gian chờ auth/dữ liệu. Dùng installStore hiện có, chia sẻ hướng dẫn với Cài đặt. Không thay đổi cache/service worker hoặc tự xin quyền thông báo.

Desktop: góc trái dưới. Mobile: thẻ phía trên vùng TabBar/safe area, hướng dẫn cuộn bên trong. Nền dùng `--glass-sheet` để nội dung trang phía sau không lẫn với chữ; không có animation riêng. Popup hoãn khi modal/toast mở hoặc viewport không đủ chỗ, tạm ẩn khi bàn phím thu nhỏ visual viewport.

## Bằng chứng tự động

- Vitest: 28 test đạt trong 5 file (12 test popup, 4 test Cài đặt, 12 test hồi quy Modal/UpdatePrompt/TabBar).
- `npm run lint`: đạt, không warning.
- `npm run typecheck`: đạt, gồm app và functions.
- `npm run build`: đạt qua webServer của Playwright. Có cảnh báo bundle >500 kB và cấu hình inlineDynamicImports đã deprecated; không phải lỗi build.
- `git diff --check`: đạt.
- `graphify update .`: đã cập nhật graph theo yêu cầu dự án; chạy lại sau lần sửa code cuối.
- Playwright: 12/12 test đạt trên desktop Chromium, Pixel 7 giả lập và iPhone 15/WebKit giả lập; axe không ghi nhận vi phạm trong vùng popup.
- E2E bố cục tắt service worker để tránh toast offline-ready bất đồng bộ làm lệch phép đo. Việc hoãn/khôi phục theo toast được kiểm tra riêng bằng component test. Đây không phải nghiệm thu cài PWA thật.

## Đối chiếu PRD

| Tình huống | Bằng chứng |
| --- | --- |
| Trước/đúng 120 giây | Component test tại 119.999 ms và 120.000 ms; E2E kiểm tra trước/sau với khoảng đệm thời gian tải trang |
| Chuyển route sau 60 giây | Component rerender giữ mốc; E2E từ Cài đặt về lịch không reset deadline |
| Tab ẩn rồi quay lại giây 150 | Component test visibilitychange và timestamp |
| Modal mở tại deadline | Component test và E2E mở form sự kiện, khôi phục sau đóng |
| Đóng rồi reload | E2E popup không hiện sau reload |
| Phiên mới sau 7 ngày | Component test; không tự mở lại trong phiên đã đóng kéo dài quá 7 ngày |
| Đóng tab A, tab B ẩn | Component storage event và E2E hai tab thật trong cùng browser context |
| Hủy cài, không tính đóng | Component prompt pending/hủy, kiểm tra key chưa ghi và CTA fallback |
| Lỗi prompt | Component test mở hướng dẫn và thông báo lỗi, không crash |
| Installed/standalone | Component test trạng thái store và matchMedia standalone |
| Không có prompt | Component hướng dẫn desktop; E2E hướng dẫn theo user agent Android/iPhone |
| Không tự hết hạn | Component và E2E giữ lời mời sau thêm 10 phút |
| Click ngoài/Escape ngoài popup | Component test không đóng; Escape khi focus trong popup đóng |
| Cuộn/điều hướng | Component không đăng ký thao tác tự đóng; component gắn ngoài Routes và E2E kiểm tra deadline qua điều hướng |
| TabBar/safe area | E2E đo cạnh dưới popup nằm trên cạnh trên TabBar; CSS dùng biến tabbar-space hiện có |
| Bàn phím | Component test visualViewport thu nhỏ + focus ô nhập, khôi phục không ghi đóng |
| Storage lỗi/timestamp hỏng | Component test không crash và đóng được trong phiên |
| Chữ lớn, 320 px, theme tối, reduced motion | E2E dùng lựa chọn “Rất lớn” thật trong Cài đặt, đo không tràn ngang, nút đóng trong viewport và kiểm tra axe |

## Giới hạn và quyết định

- Chưa có thiết bị Android/iPhone thật để xác minh hộp thoại cài hệ thống, bàn phím thực tế và mở app sau cài. Task 5.6 giữ chưa hoàn thành; mock hoặc browser giả lập không thay thế kiểm tra này.
- Không thêm analytics cho impression/dismiss/guide trong phạm vi này (PRD cho phép tùy chọn). Các sự kiện install_prompt/app_installed có sẵn vẫn được tái sử dụng, không phát sinh lượt ghi trùng.
- Không kiểm tra lại toàn bộ offline app; nội dung lời mời giới hạn xem lịch offline sau khi mở app online và ghi rõ đồng bộ cần mạng.
- Kiểm thử tab với clock giả lập đồng bộ cùng wall time để không tạo timestamp “tương lai” giả. Unit test dùng fake timer kiểm tra chính xác ranh giới 120 giây; E2E dành khoảng đệm cho thời gian tải trang.

Navigation timeOrigin phải lớn hơn 0; nếu không, dùng thời điểm JavaScript khởi động. Browser test đã bắt trường hợp clock giả lập tạm trả -1, tránh lời mời xuất hiện ngay khi mở web.

## Cập nhật thiết kế popup — 06/10/2026

- Áp dụng skill high-end-visual-design: thẻ hai lớp, nền sheet dễ đọc, khoảng cách rõ ràng, icon Phosphor Light, CTA với mũi tên trong vòng tròn và chuyển động transform/opacity nhẹ; hỗ trợ reduced motion.
- Rút gọn lời giới thiệu. Hướng dẫn iOS/Android/desktop có số thứ tự, tiêu đề hành động và mô tả vị trí bấm; nút Quay lại/đóng luôn ở ngoài phần cuộn. Vùng cuộn nhận focus để dùng bằng bàn phím.
- Chia sẻ dữ liệu hướng dẫn với Cài đặt, dùng Safari làm hướng dẫn mặc định trên iOS và bỏ thông tin phiên bản trình duyệt không cần thiết trong bước đầu.
- 19/19 test tập trung đạt (15 popup, 4 Cài đặt); 12/12 E2E đạt trên desktop, Android/iPhone giả lập, bao gồm 320 px, chữ rất lớn, theme tối và axe. Lint/typecheck/build đạt. Đã xem ảnh lời mời và hướng dẫn trên mobile; graph đã cập nhật.
- Thời điểm xuất hiện, cooldown và luồng cài giữ hành vi đã nghiệm thu. Kiểm tra cài hệ thống trên thiết bị thật vẫn chưa thực hiện.
