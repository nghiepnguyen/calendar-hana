# Tasks: Popup mời cài Lịch Việt để dùng offline

Nguồn: [PRD](prd-offline-install-popup.md).
Triển khai trực tiếp trên `main` theo yêu cầu người dùng; không tạo branch mới. Tài liệu này chỉ lập kế hoạch, chưa triển khai tính năng.

## Relevant Files

Danh sách phản ánh triển khai. Hook được kiểm thử qua component để xác minh hành vi người dùng; installStore được tái sử dụng mà không chỉnh sửa.

- `src/main.tsx` — mốc khởi động phiên web và listener cài hiện có.
- `src/App.tsx` — gắn popup ngoài Routes để không reset khi điều hướng.
- `src/store/installStore.ts` — sự kiện cài PWA, trạng thái cài và prompt hiện có.
- `src/hooks/useInstallInvitation.ts` — đề xuất mới: điều phối thời gian, điều kiện hiển thị, đóng và đồng bộ tab.
- `src/components/InstallInvitation/InstallInvitation.test.tsx` — kiểm thử hook qua component thật: vòng đời, thời gian và lưu trữ.
- `src/components/InstallInvitation/InstallInvitation.tsx` — đề xuất mới: thẻ giới thiệu, CTA và hướng dẫn.
- `src/components/InstallInvitation/InstallInvitation.module.css` — đề xuất mới: bố cục desktop/mobile, theme, cỡ chữ và safe area.
- `src/components/InstallInvitation/InstallInvitation.test.tsx` — đề xuất mới: hành động và khả năng truy cập.
- `src/pages/Settings/InstallGuide.tsx`, `src/pages/Settings/installGuideData.ts` — renderer và nội dung hướng dẫn dùng chung với Cài đặt.
- `src/pages/Settings/InstallSection.tsx` — tái sử dụng hướng dẫn chung, giữ hành vi Cài đặt.
- `src/pages/Settings/InstallSection.test.tsx` — kiểm thử hồi quy Cài đặt.
- `src/reminders/notificationHelp.ts` — nhận diện nền tảng hiện có.
- `src/components/Modal/Modal.tsx` — khảo sát cơ chế báo modal đang mở.
- `src/components/Toast/ToastRegion.tsx`, `src/components/UpdatePrompt/UpdatePrompt.tsx` — ưu tiên thông báo tác vụ và cập nhật.
- `src/components/layout/TabBar.module.css` — chiều cao thanh điều hướng và safe area cần dùng cho vị trí mobile.
- `src/analytics.ts` — API tracking hiện có nếu bổ sung đo lường lời mời.
- `e2e/offline-install-popup.spec.ts` — đề xuất mới: kiểm thử tích hợp theo bảng nghiệm thu PRD.
- `e2e/mobile-layout.spec.ts` — kiểm tra hồi quy bố cục mobile hiện có.
- `tasks/validation-offline-install-popup.md` — đề xuất mới: bằng chứng nghiệm thu và giới hạn kiểm tra thực tế.

### Notes

- Không mở rộng cache/service worker, tự xin quyền thông báo hoặc tạo ứng dụng native.
- Không suy ra đã cài từ việc thiếu `beforeinstallprompt`; không suy ra cache offline hoàn tất từ `appinstalled`.
- Dùng Vitest và Playwright hiện có, không thêm Jest. Test nằm cạnh code khi phù hợp.
- Chạy test tập trung bằng `npm run test -- <đường-dẫn-test>` và `npm run test:e2e -- e2e/offline-install-popup.spec.ts`; chạy `npm run lint`, `npm run typecheck`, `npm run build` trước nghiệm thu.
- Parent task chỉ hoàn thành khi tất cả sub-task bắt buộc đã đạt. Nghiệm thu trình duyệt thực tế chưa làm được phải ghi rõ, không đánh dấu đã kiểm tra.

## Instructions for Completing Tasks

Sau mỗi sub-task hoàn tất và được kiểm chứng, đổi `- [ ]` thành `- [x]` ngay trong tài liệu này. Giữ các task chưa hoàn thành ở trạng thái chưa đánh dấu.

## Tasks

- [x] 1.0 Rà soát nền tảng hiện có và xác định điểm tích hợp
  - [x] 1.1 Kiểm tra đang làm trên `main` và ghi nhận thay đổi có sẵn để tránh ghi đè; không tạo branch mới.
  - [x] 1.2 Đọc graph report/wiki theo hướng dẫn dự án; rà soát listener cài, store, phần Cài đặt, khởi động app và cấu trúc Routes.
  - [x] 1.3 Xác nhận phạm vi offline thực tế và duyệt nội dung PRD theo khả năng app; không thay đổi cơ chế cache.
  - [x] 1.4 Xác định breakpoint hiện có, chiều cao TabBar/safe area, lớp hiển thị modal, toast và cập nhật; chọn tín hiệu để hoãn popup, ưu tiên tái sử dụng cơ chế hiện có.
  - [x] 1.5 Chốt nơi ghi mốc khởi động phiên sớm để không bị trễ vì chờ dữ liệu/auth; xác định hook/component sống xuyên chuyển route.

- [x] 2.0 Xây dựng trạng thái, thời gian và lưu trữ quyết định đóng
  - [x] 2.1 Tạo logic với mốc 120.000 ms thời gian thực, timestamp bắt đầu phiên và các trạng thái chờ, hoãn, hiện, đóng, đã cài; reload/tab mới bắt đầu mốc mới, chuyển route không reset.
  - [x] 2.2 Kết hợp timer với kiểm tra timestamp khi `visibilitychange`; tab nền vẫn tính thời gian, chỉ hiển thị khi tài liệu visible, timer bị trì hoãn không làm chờ thêm 2 phút.
  - [x] 2.3 Loại trừ standalone và trạng thái đã cài được xác nhận; cập nhật khi chế độ hiển thị thay đổi hoặc nhận `appinstalled`.
  - [x] 2.4 Lưu timestamp đóng bằng key có namespace/phiên bản; kiểm tra giá trị hợp lệ và mốc 7 × 24 giờ, bảo đảm dữ liệu hỏng không gây crash hoặc ẩn vĩnh viễn.
  - [x] 2.5 Giữ trạng thái đóng trong bộ nhớ phiên khi storage bị chặn; không tự mở lại trong phiên đã đóng dù kéo dài quá 7 ngày.
  - [x] 2.6 Nhận thay đổi storage từ tab khác để ẩn lời mời và giữ đóng trong phiên; không lưu danh tính hoặc user agent.
  - [x] 2.7 Dọn timer/listener khi unmount; kiểm tra render lại/StrictMode không tạo bộ đếm, listener hoặc popup trùng.
  - [x] 2.8 Viết test thời gian giả lập cho trước/đúng 120 giây, tab ẩn, chuyển route/reload, trước/đúng/sau 7 ngày, phiên kéo dài, storage lỗi/hỏng, đóng liên tab và app đã cài.

- [x] 3.0 Tạo nội dung popup và các hành động cài/hướng dẫn/đóng
  - [x] 3.1 Tách nội dung hướng dẫn cần dùng chung từ InstallSection; giữ hướng dẫn phù hợp iOS, Android và desktop, kiểm tra hồi quy phần Cài đặt.
  - [x] 3.2 Tạo thẻ giới thiệu theo PRD với biểu tượng app, tiêu đề, mô tả, ba lợi ích, ghi chú offline, CTA và nút đóng luôn thấy.
  - [x] 3.3 Gọi `prompt()` từ installStore chỉ khi user bấm “Cài app”; ngăn bấm lặp, xử lý lỗi không crash và không tạo listener cài thứ hai.
  - [x] 3.4 Khi user hủy cài, giữ popup và không ghi timestamp đóng; khi sự kiện cài đã dùng/không khả dụng, chuyển sang “Xem cách cài”.
  - [x] 3.5 Mở hướng dẫn trong thẻ theo thiết bị, cho quay lại giới thiệu; với trình duyệt không hỗ trợ, giải thích và hướng dẫn mở trình duyệt hỗ trợ thay vì đưa nút cài vô hiệu.
  - [x] 3.6 Đóng bằng nút có nhãn truy cập hoặc Escape khi focus trong thẻ; không đóng do click ngoài, cuộn, vuốt, mở hướng dẫn hoặc timeout.
  - [x] 3.7 Ẩn lời mời khi xác nhận cài thành công/standalone; khi chỉ chấp nhận prompt nhưng chưa xác nhận cài, không tự coi là đã cài.
  - [x] 3.8 Viết test CTA, chống bấm lặp, cài lỗi/hủy/thành công, fallback hướng dẫn, nút đóng/Escape và hồi quy InstallSection.

- [x] 4.0 Tích hợp bố cục và xử lý gián đoạn thao tác
  - [x] 4.1 Gắn một instance popup ngoài Routes; hoãn khi modal chặn thao tác đang mở và khôi phục sau khi đóng, không reset mốc thời gian.
  - [x] 4.2 Thiết kế desktop ở góc trái dưới, cách cạnh khoảng 24 px, rộng khoảng 360 px nhưng không vượt viewport; không backdrop, không khóa cuộn.
  - [x] 4.3 Thiết kế mobile cách hai cạnh khoảng 12 px, nằm trên TabBar và safe area; phần giới thiệu gọn, không ép chiều cao khi chữ lớn.
  - [x] 4.4 Cho hướng dẫn mở rộng với chiều cao tối đa khoảng 50% viewport, cuộn nội dung bên trong và giữ nút đóng nhìn thấy.
  - [x] 4.5 Nhận diện bàn phím ảo theo khả năng nền tảng; tạm ẩn/khôi phục thẻ mà không ghi đóng hoặc reset timer, kiểm tra resize/xoay thiết bị tránh nhận diện nhầm.
  - [x] 4.6 Hoãn/tạm ẩn khi không đủ chỗ do toast, cập nhật hoặc nút thao tác chính; khôi phục khi có chỗ, không coi là đã đóng.
  - [x] 4.7 Áp dụng theme, cỡ chữ và reduced motion; vùng chạm tối thiểu 44 px, không tràn ngang ở 320 px, hỗ trợ thay đổi kích thước/chiều màn hình.
  - [x] 4.8 Thêm tên truy cập và thông báo lịch sự; không tự lấy focus/khóa focus; hỗ trợ bàn phím và trả focus hợp lý khi đóng thẻ đang có focus.
  - [x] 4.9 Kiểm thử các điều kiện hoãn và khả năng truy cập; xác nhận người dùng vẫn điều hướng, nhập liệu và đóng modal bình thường.

- [ ] 5.0 Kiểm thử tích hợp và hoàn tất nghiệm thu
  - [x] 5.1 Thêm E2E cho bộ đếm qua chuyển route/tab ẩn, persistence qua reload, cooldown 7 ngày, đóng liên tab và không tự hết hạn; dùng clock giả lập thay vì chờ 2 phút thật.
  - [x] 5.2 Thêm E2E cho modal, bàn phím, toast/cập nhật, cài trực tiếp/fallback và các ngoại lệ installed/standalone; kiểm tra hồi quy Cài đặt và điều hướng.
  - [x] 5.3 Kiểm tra desktop/mobile, viewport 320 px, safe area, dark theme, chữ lớn và hướng dẫn mở rộng; xác nhận không che TabBar hoặc thao tác chính.
  - [x] 5.4 Nếu dùng analytics hiện có, thêm đo hiển thị/đóng/mở hướng dẫn với loại thiết bị/CTA; không ghi trùng `install_prompt`/`app_installed`, không suy ra cài thủ công từ lượt xem hướng dẫn. Ghi rõ quyết định dùng hoặc không dùng.
  - [x] 5.5 Chạy test tập trung và các kiểm tra lint/typecheck/build; khắc phục lỗi liên quan và ghi rõ lỗi có sẵn ngoài phạm vi nếu có.
  - [ ] 5.6 Kiểm tra thực tế trên desktop Chromium, Android và iPhone: hộp thoại cài/hướng dẫn, bàn phím và mở app sau cài; ghi rõ thiết bị/trình duyệt và phần chưa kiểm chứng, không coi mock là đủ.
  - [x] 5.7 Lập bảng bằng chứng đối chiếu từng tình huống nghiệm thu trong PRD, bao gồm lỗi storage và timestamp hỏng; lưu ở `tasks/validation-offline-install-popup.md`.
  - [x] 5.8 Chạy `graphify update .` sau sửa code, rà soát diff cuối và cập nhật trạng thái task theo bằng chứng nghiệm thu.
