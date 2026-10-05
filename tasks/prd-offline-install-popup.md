# PRD: Popup mời cài Lịch Việt để dùng offline

Ngày: 06/10/2026. Trạng thái: đặc tả, chưa triển khai.

## 1. Giới thiệu

Thêm popup giới thiệu việc cài Lịch Việt vào thiết bị để mở nhanh và sử dụng thuận tiện khi không có mạng. Popup xuất hiện sau khoảng 2 phút kể từ lúc mở web, nằm ở góc trái dưới trên desktop và dạng thẻ gọn phía dưới trên mobile. Popup không tự hết hạn; người dùng chủ động đóng.

Các quyết định đã chốt:
- Sau khi đóng, chỉ được nhắc lại sau 7 ngày.
- Tính 2 phút theo thời gian thực kể từ lúc mở web, kể cả khi tab bị ẩn.
- Nếu không thể cài trực tiếp, cung cấp hướng dẫn phù hợp thiết bị.

## 2. Mục tiêu

- Người dùng hiểu ba lợi ích: mở nhanh từ biểu tượng app, giao diện riêng thuận tiện, xem lịch khi không có mạng sau khi nội dung cần thiết đã được tải.
- Người dùng có thể cài trực tiếp hoặc tìm hướng dẫn cài trong một thao tác từ popup.
- Không làm gián đoạn thao tác chính; không che thanh điều hướng mobile.
- Đảm bảo chính xác thời điểm xuất hiện, trạng thái đóng và thời hạn nhắc lại theo tiêu chí nghiệm thu bên dưới.

## 3. User stories

- Là người thường xuyên xem lịch, tôi muốn mở Lịch Việt từ biểu tượng trên thiết bị mà không phải nhập địa chỉ web.
- Là người có kết nối không ổn định, tôi muốn biết app có thể giúp xem lịch khi mất mạng.
- Là người dùng iPhone hoặc trình duyệt không có nút cài trực tiếp, tôi muốn được hướng dẫn thêm app vào màn hình chính.
- Là người chưa muốn cài, tôi muốn đóng lời mời và không gặp lại trong 7 ngày.

## 4. Yêu cầu chức năng

### Thời điểm và điều kiện hiển thị

1. Ghi nhận thời điểm khởi động phiên web. Popup đủ điều kiện sau 120.000 ms theo thời gian thực; không yêu cầu người dùng tương tác trước đó.
2. Chuyển trang nội bộ không khởi động lại bộ đếm. Tải lại trang hoặc mở một tab mới bắt đầu phiên và bộ đếm mới.
3. Thời gian vẫn trôi khi tab bị ẩn. Nếu đã qua mốc khi tab bị ẩn, hiển thị ngay khi quay lại tab và đủ điều kiện; không cần thêm 2 phút. Không dựa vào việc callback timer chạy đúng giờ trong tab nền.
4. Chỉ hiện khi tài liệu đang hiển thị. Nếu một hộp thoại chặn thao tác hoặc biểu mẫu dạng modal đang mở ở mốc 2 phút, hoãn đến khi hộp thoại đóng. Không khởi động lại bộ đếm.
5. Không hiện khi app đang chạy ở chế độ standalone hoặc hệ thống đã xác nhận cài thành công trong phiên hiện tại.
6. Không coi việc thiếu sự kiện cài trực tiếp là bằng chứng app đã được cài. Trình duyệt không phát hiện được trạng thái cài vẫn được xem lời mời và hướng dẫn.
7. Không hiện nếu chưa đủ 7 × 24 giờ kể từ lần đóng gần nhất, tính bằng timestamp. Đúng mốc hoặc sau mốc này, một phiên mới được hiển thị sau 2 phút như bình thường.

### Nội dung và hành động

8. Nội dung mặc định:
   - Tiêu đề: **Cài Lịch Việt, mở lịch tiện hơn**.
   - Mô tả: **Mở nhanh từ biểu tượng app, xem lịch khi mất mạng và dùng trong cửa sổ riêng.**
   - Ba lợi ích ngắn: **Mở nhanh · Xem lịch offline · Giao diện riêng**.
   - Ghi chú: **Để dùng offline, hãy mở app khi có mạng trước. Đồng bộ dữ liệu cần kết nối mạng.**
9. Chỉ quảng bá khả năng offline đã được ứng dụng hỗ trợ. Không hứa mọi tính năng đều hoạt động offline; không hứa nhắc hẹn offline hoặc cài app sẽ tự cấp quyền thông báo.
10. Khi có sự kiện cài hợp lệ, CTA là **Cài app**. Chỉ gọi hộp thoại cài của trình duyệt sau thao tác bấm của người dùng.
11. Trong lúc gọi cài, ngăn bấm lặp. Nếu người dùng hủy hộp thoại cài, popup vẫn còn, không tính là đã đóng và không bắt đầu thời hạn 7 ngày. Khi sự kiện cài không còn sử dụng được, chuyển CTA sang hướng dẫn.
12. Khi không cài trực tiếp được, CTA là **Xem cách cài**. Mở hướng dẫn trong popup, ưu tiên thiết bị hiện tại: iPhone/iPad dùng luồng Chia sẻ → Thêm vào màn hình chính; Android và desktop dùng hướng dẫn tương ứng khả năng trình duyệt. Cho phép quay về phần giới thiệu.
13. Tái sử dụng nội dung hướng dẫn hiện có khi phù hợp; trình duyệt không hỗ trợ cần giải thích rõ và gợi ý mở trang trong trình duyệt hỗ trợ, tránh đưa nút cài không hoạt động.
14. Nút đóng có nhãn truy cập **Đóng lời mời cài app**. Nhấn đóng ghi nhận timestamp và ẩn popup ngay. Escape khi focus đang nằm trong popup được xử lý tương đương đóng. Không đóng khi bấm ngoài, cuộn trang hoặc vuốt.
15. Không tự đóng theo timeout, sau khi bấm CTA hay sau khi mở hướng dẫn. Popup vẫn tồn tại khi điều hướng nội bộ. Ngoại lệ hợp lý: ẩn khi nhận xác nhận cài thành công hoặc chuyển sang chế độ standalone; không tiếp tục mời cài app đã cài.
16. Timestamp đóng lưu cục bộ theo trình duyệt, không theo tài khoản. Các tab đang mở cùng trình duyệt nhận thay đổi đóng và ẩn lời mời tương ứng. Nếu lưu trữ không khả dụng, vẫn cho phép đóng và giữ trạng thái đóng trong phiên hiện tại.
17. Không tự mở lại trong cùng phiên sau khi đã đóng, dù phiên kéo dài quá 7 ngày. Người dùng vẫn có thể cài từ mục Cài đặt hiện có.

## 5. Ngoài phạm vi

- Thay đổi cơ chế cache, service worker hoặc mở rộng tính năng offline.
- Tạo ứng dụng native hoặc liên kết kho ứng dụng.
- Tự động cài app, tự mở hộp thoại cài hệ thống hoặc xin quyền thông báo.
- Đồng bộ quyết định đóng giữa các thiết bị/tài khoản.
- Thử nghiệm A/B hoặc xây dựng hệ thống analytics mới.

## 6. Thiết kế

### Desktop

- Dùng breakpoint desktop/mobile hiện có của dự án.
- Thẻ nổi ở góc trái dưới viewport, cách cạnh khoảng 24 px, rộng khoảng 360 px và không vượt viewport.
- Có biểu tượng app, tiêu đề, mô tả, lợi ích, CTA và nút đóng luôn nhìn thấy.
- Không có backdrop, không khóa cuộn, không chiếm focus khi tự xuất hiện.

### Mobile — phương án chọn

- Dùng thẻ nổi gọn gần toàn chiều ngang, cách hai cạnh khoảng 12 px, đặt phía trên thanh điều hướng dưới và vùng safe area.
- Không dùng modal toàn màn hình. Phần giới thiệu hướng tới chiều cao khoảng 180–220 px ở cỡ chữ mặc định; ưu tiên gọn và dễ đọc, không ép chiều cao khi tăng cỡ chữ.
- Hướng dẫn có thể mở rộng ngay trong thẻ; giới hạn tối đa khoảng 50% chiều cao viewport và cuộn nội dung bên trong. Giữ nút đóng luôn nhìn thấy.
- Khi bàn phím ảo đang mở, tạm ẩn thẻ để tránh che biểu mẫu; hiển thị lại khi bàn phím đóng, không xem là user đã đóng.
- Không chồng lên nút thao tác chính, thanh điều hướng, thông báo cập nhật hoặc toast. Ưu tiên thông báo tác vụ; nếu không đủ chỗ, tạm hoãn lời mời và khôi phục khi đủ chỗ.

### Khả năng truy cập và tính nhất quán

- Áp dụng màu, font, bo góc, icon, theme tối và cỡ chữ theo hệ thống hiện có.
- Các nút trên mobile có vùng chạm tối thiểu 44 × 44 px.
- Dùng vùng nội dung có tên truy cập, thông báo xuất hiện bằng cơ chế lịch sự; không khai báo modal hoặc khóa focus.
- Có thể thao tác bằng bàn phím, focus rõ ràng, nội dung đọc theo thứ tự tự nhiên. Tôn trọng thiết lập giảm chuyển động.
- Không tràn ngang ở viewport 320 px hoặc khi tăng cỡ chữ. Nếu thẻ đang có focus bị đóng, trả focus về phần tử hợp lý trong trang.

## 7. Lưu ý kỹ thuật

- Dự án đã có `src/store/installStore.ts`: lưu sự kiện cài, `canPrompt`, `installed`, `prompt()` và lắng nghe xác nhận cài. Tái sử dụng store; không tạo listener hoặc luồng cài thứ hai.
- `src/pages/Settings/InstallSection.tsx` đã có hướng dẫn iOS, Android, desktop và xử lý standalone. Chia sẻ nội dung/hành vi phù hợp giữa Cài đặt và popup để tránh lệch hướng dẫn.
- Bộ đếm và trạng thái hiển thị đặt tại tầng sống xuyên điều hướng nội bộ. Dọn listener/timer khi unmount; không tạo nhiều popup khi render lại.
- Tách trạng thái: chờ đủ thời gian, bị hoãn, đang hiện, đã đóng, đã cài. Việc mở hướng dẫn hoặc hủy cài không chuyển sang đã đóng.
- Timestamp phải được kiểm tra hợp lệ; giá trị hỏng không được làm crash ứng dụng hoặc ẩn lời mời vĩnh viễn.
- Dùng namespace/key phiên bản cho dữ liệu đóng. Không lưu user agent, danh tính hoặc dữ liệu cá nhân vào key này.
- Việc cài thành công và khả năng dùng offline là hai trạng thái khác nhau; không suy ra toàn bộ dữ liệu đã cache từ sự kiện cài.

## 8. Chỉ số thành công và nghiệm thu

Tiêu chí bắt buộc:
- 100% tình huống nghiệm thu chức năng bên dưới đạt.
- Lời mời không làm mất khả năng điều hướng, nhập liệu hoặc đóng các hộp thoại hiện có trên desktop/mobile.
- Không phát sinh lỗi khi trình duyệt không hỗ trợ cài trực tiếp hoặc chặn lưu trữ.

Nếu dùng analytics hiện có, ghi nhận các sự kiện hiển thị lời mời, đóng và mở hướng dẫn với thuộc tính loại thiết bị/loại CTA; tái sử dụng `install_prompt` và `app_installed` hiện có, tránh ghi trùng. Theo dõi tỷ lệ bấm CTA trên lượt hiển thị, kết quả cài trực tiếp và tỷ lệ đóng. Chưa đặt mục tiêu tăng trưởng khi chưa có baseline; không suy ra tỷ lệ cài thủ công từ lượt xem hướng dẫn.

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Phiên mới, chưa đóng trước đó | Chưa hiện trước 120 giây; hiện khi đủ thời gian và có thể hiển thị |
| Chuyển route sau 60 giây | Hiện sau khoảng 60 giây nữa |
| Tab bị ẩn từ giây 30, quay lại ở giây 150 | Hiện ngay khi quay lại và không có yếu tố chặn |
| Modal đang mở ở giây 120 | Chờ modal đóng, không ngắt thao tác |
| Đóng popup rồi reload | Không hiện trong 7 ngày |
| Phiên mới đúng/sau mốc 7 ngày | Hiện sau 120 giây |
| Đóng ở tab A | Popup tab B cùng trình duyệt ẩn theo trạng thái đóng |
| Hủy hộp thoại cài hệ thống | Popup giữ nguyên; cho phép xem hướng dẫn |
| Nhận xác nhận cài thành công / chạy standalone | Không còn lời mời cài |
| Không có sự kiện cài trực tiếp | Có CTA và hướng dẫn phù hợp thiết bị |
| Không thao tác sau khi popup xuất hiện | Popup không tự hết hạn |
| Bấm ngoài, cuộn, điều hướng nội bộ | Popup không bị đóng |
| Mobile có thanh điều hướng/safe area | Thẻ nằm phía trên, không che điều hướng |
| Mở/đóng bàn phím mobile | Tạm ẩn/khôi phục thẻ; không ghi timestamp đóng |
| Storage bị chặn hoặc timestamp hỏng | Không crash; đóng vẫn có tác dụng trong phiên |
| Theme tối, chữ lớn, bàn phím, viewport 320 px | Dễ đọc, nút đóng luôn thao tác được, không tràn ngang |

Kiểm tra bộ đếm bằng thời gian giả lập; kiểm tra bố cục và luồng cài/hướng dẫn trên desktop, Android và iPhone. Hộp thoại cài thực tế cần kiểm tra trên trình duyệt hỗ trợ; mock không thay thế toàn bộ nghiệm thu này.

## 9. Câu hỏi còn mở

Không còn câu hỏi chặn triển khai. Khi triển khai cần xác nhận các chức năng và dữ liệu offline thực tế để nội dung quảng bá không vượt khả năng app; xác định vị trí thẻ theo chiều cao thanh điều hướng hiện có.
