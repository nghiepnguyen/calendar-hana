# PRD: Lịch cá nhân Dương – Âm lịch Việt Nam (calendar-hana)

## 1. Giới thiệu / Tổng quan

calendar-hana là một **web app lịch cá nhân** (cài được như PWA) hiển thị song song **dương lịch và âm lịch Việt Nam**. Người dùng xem lịch theo ngày, tuần, tháng; tạo sự kiện theo ngày dương hoặc ngày âm (ví dụ: ngày giỗ, rằm, mùng 1); phân loại sự kiện bằng danh mục có màu; và nhận nhắc hẹn qua thông báo hệ thống hoặc email.

**Vấn đề cần giải quyết:** Các ứng dụng lịch phổ biến (Google Calendar, Apple Calendar) không hỗ trợ tốt âm lịch Việt Nam. Người dùng không tạo được sự kiện lặp theo ngày âm (giỗ hằng năm, rằm hằng tháng) và không xem được thông tin truyền thống như Can Chi, giờ hoàng đạo, ngày tốt/xấu.

**Mục tiêu:** Một lịch cá nhân dùng hằng ngày, xem nhanh ngày âm/dương cùng thông tin âm lịch, quản lý sự kiện theo cả hai hệ lịch, không bỏ lỡ ngày quan trọng. App dùng được ngay không cần tài khoản (lưu trên máy). Người dùng có thể đăng nhập Google để lưu dữ liệu lên cloud.

## 2. Mục tiêu (Goals)

1. Hiển thị chính xác ngày âm lịch Việt Nam (múi giờ UTC+7) cho mọi ngày trong khoảng năm 1900–2100.
2. Người dùng tạo được sự kiện theo ngày dương hoặc ngày âm, có lặp lại, trong tối đa 30 giây.
3. Sự kiện lặp theo âm lịch (tháng/năm) rơi đúng ngày dương tương ứng mỗi năm.
4. Nhắc hẹn gửi đúng giờ, sai lệch không quá 1 phút (với thông báo hệ thống) và không quá 5 phút (với email).
5. App dùng đầy đủ chức năng ở chế độ offline với dữ liệu lưu trên máy.
6. Người dùng đăng nhập Google thấy cùng dữ liệu sự kiện trên mọi thiết bị.

## 3. User Stories

- **US-1:** Là người dùng, tôi muốn mở app là thấy ngay **lịch ngày hôm nay** với ngày âm, Can Chi và giờ hoàng đạo, để biết nhanh thông tin trong ngày.
- **US-2:** Là người dùng, tôi muốn chuyển qua lại giữa **xem ngày / tuần / tháng**, để nhìn lịch ở mức chi tiết phù hợp.
- **US-3:** Là người dùng, tôi muốn tạo sự kiện **giỗ ông nội ngày 12/3 âm lịch lặp hằng năm**, để app tự nhắc tôi mỗi năm dù ngày dương thay đổi.
- **US-4:** Là người dùng, tôi muốn tạo sự kiện **đi chùa mùng 1 và rằm hằng tháng âm lịch**, để không phải tạo tay từng tháng.
- **US-5:** Là người dùng, tôi muốn tạo sự kiện **họp team 9h sáng thứ Hai hằng tuần** theo dương lịch.
- **US-6:** Là người dùng, tôi muốn gán sự kiện vào danh mục (Công việc, Gia đình, Giỗ/Lễ...) có màu riêng, và tự tạo danh mục mới, để nhìn lịch là phân biệt được loại việc.
- **US-7:** Là người dùng, tôi muốn được nhắc trước sự kiện (ví dụ trước 1 ngày, trước 30 phút) qua **thông báo hệ thống** hoặc **email**, để không quên.
- **US-8:** Là người dùng mới, tôi muốn **dùng app ngay không cần đăng ký**, dữ liệu lưu trên máy.
- **US-9:** Là người dùng, tôi muốn **đăng nhập bằng Google** để dữ liệu được lưu trên cloud và dùng được trên máy khác. Khi đăng nhập lần đầu, tôi muốn các sự kiện đang lưu trên máy được chuyển lên tài khoản.
- **US-10:** Là người dùng, tôi muốn thấy các **ngày lễ Việt Nam** (Tết Nguyên Đán, Giỗ Tổ, Trung Thu, 30/4, 2/9...) tự động hiện trên lịch.
- **US-11:** Là người dùng, tôi muốn biết một ngày là **ngày hoàng đạo hay hắc đạo** và các **giờ hoàng đạo** trong ngày, để chọn ngày giờ cho việc quan trọng.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Hiển thị lịch

1. Hệ thống phải có 3 chế độ xem: **Ngày**, **Tuần**, **Tháng**.
2. Khi mở app, chế độ xem mặc định phải là **Ngày**, hiển thị ngày hôm nay.
3. Hệ thống phải có nút **"Hôm nay"** để quay về ngày hiện tại, và nút **trước / sau** để chuyển sang ngày/tuần/tháng liền kề.
4. Hệ thống phải cho phép chọn nhanh một ngày bất kỳ bằng date picker (chọn được theo ngày dương hoặc ngày âm).
5. **Xem Ngày** phải hiển thị:
   - Ngày dương (thứ, ngày/tháng/năm).
   - Ngày âm (ngày/tháng âm, ghi rõ "tháng nhuận" nếu có).
   - Can Chi của ngày, tháng, năm (ví dụ: ngày Giáp Tý, tháng Bính Dần, năm Ất Tỵ).
   - Ngày hoàng đạo / hắc đạo.
   - Danh sách giờ hoàng đạo trong ngày (ví dụ: Tý 23h–1h, Sửu 1h–3h...).
   - Tiết khí (nếu ngày đó bắt đầu một tiết khí).
   - Ngày lễ (nếu có).
   - Dòng thời gian 24 giờ chứa các sự kiện có giờ, và khu vực riêng phía trên cho sự kiện cả ngày.
6. **Xem Tuần** phải hiển thị 7 cột (thứ Hai đến Chủ nhật). Mỗi cột có ngày dương, ngày âm, và các sự kiện theo khung giờ.
7. **Xem Tháng** phải hiển thị lưới các ngày trong tháng. Mỗi ô có:
   - Ngày dương (số lớn) và ngày âm (số nhỏ).
   - Ngày âm mùng 1 phải hiển thị kèm tháng âm (ví dụ "1/4") để dễ nhận biết đầu tháng âm.
   - Ngày lễ và tối đa 3 sự kiện; nếu nhiều hơn thì hiện "+N".
   - Đánh dấu ngày hoàng đạo (ví dụ bằng một chấm nhỏ).
8. Tiêu đề xem Tháng phải hiển thị cả tháng dương và (các) tháng âm tương ứng (ví dụ: "Tháng 9/2026 — Tháng 7–8 âm lịch, năm Bính Ngọ").
9. Bấm vào một ngày trong xem Tháng/Tuần phải chuyển sang xem Ngày của ngày đó.
10. Bấm vào một sự kiện phải mở chi tiết sự kiện (xem, sửa, xóa).
11. Ngày hôm nay phải được làm nổi bật ở mọi chế độ xem.

### 4.2. Âm lịch và thông tin truyền thống

12. Hệ thống phải chuyển đổi dương lịch ↔ âm lịch Việt Nam theo **múi giờ UTC+7** (thuật toán của Hồ Ngọc Đức hoặc tương đương), hỗ trợ tháng nhuận, trong khoảng năm 1900–2100.
13. Hệ thống phải tính Can Chi cho ngày, tháng, năm.
14. Hệ thống phải tính ngày hoàng đạo / hắc đạo và 6 giờ hoàng đạo trong ngày dựa trên Chi của ngày.
15. Hệ thống phải tính 24 tiết khí.
16. Hệ thống phải hiển thị **ngày tốt/xấu** cơ bản cho mỗi ngày (ví dụ: ngày hoàng đạo/hắc đạo, và các ngày kỵ phổ biến như Tam Nương, Nguyệt Kỵ).
17. Hệ thống phải có sẵn danh sách **ngày lễ Việt Nam**, gồm:
    - Lễ theo dương lịch: 1/1, 14/2, 8/3, 30/4, 1/5, 1/6, 2/9, 20/10, 20/11, 24/12...
    - Lễ theo âm lịch: Tết Nguyên Đán (1–3/1), Rằm tháng Giêng (15/1), Giỗ Tổ Hùng Vương (10/3), Phật Đản (15/4), Đoan Ngọ (5/5), Vu Lan (15/7), Trung Thu (15/8), ông Công ông Táo (23/12), Giao thừa (ngày cuối tháng Chạp).
18. Người dùng phải bật/tắt được việc hiển thị ngày lễ trong phần Cài đặt.

### 4.3. Sự kiện (Event)

19. Người dùng phải tạo được sự kiện với các trường:
    - **Tiêu đề** (bắt buộc, tối đa 200 ký tự).
    - **Loại lịch**: Dương lịch hoặc Âm lịch (mặc định: Dương lịch).
    - **Ngày**: chọn theo loại lịch đã chọn. Nếu chọn Âm lịch, người dùng nhập ngày/tháng âm (và chọn "tháng nhuận" nếu tháng đó có nhuận). Form phải hiển thị ngày dương tương ứng ngay bên dưới để người dùng kiểm tra.
    - **Cả ngày** hoặc **giờ bắt đầu – giờ kết thúc**.
    - **Danh mục** (mặc định: "Cá nhân").
    - **Lặp lại** (xem mục 4.4).
    - **Nhắc hẹn** (xem mục 4.6).
    - **Địa điểm** (tùy chọn, văn bản).
    - **Ghi chú** (tùy chọn, tối đa 2000 ký tự).
20. Người dùng phải sửa và xóa được sự kiện.
21. Sự kiện âm lịch phải được **lưu theo ngày âm** (ngày, tháng, năm âm, cờ nhuận). Ngày dương hiển thị được tính lại từ ngày âm, không lưu cố định.
22. Hệ thống phải cho phép tạo nhanh sự kiện bằng cách bấm vào một khung giờ trống (xem Ngày/Tuần) hoặc một ô ngày (xem Tháng). Form mở ra với ngày/giờ điền sẵn.
23. Sự kiện phải hiển thị bằng màu của danh mục.
24. Hệ thống phải có ô **tìm kiếm** sự kiện theo tiêu đề và ghi chú.

### 4.4. Lặp lại sự kiện

25. Hệ thống phải hỗ trợ các kiểu lặp theo **dương lịch**: không lặp, hằng ngày, hằng tuần (chọn được các thứ trong tuần), hằng tháng (cùng ngày), hằng năm (cùng ngày/tháng).
26. Hệ thống phải hỗ trợ các kiểu lặp theo **âm lịch**: hằng tháng âm (cùng ngày âm mỗi tháng, ví dụ mùng 1, rằm), hằng năm âm (cùng ngày/tháng âm mỗi năm, ví dụ giỗ).
27. Người dùng phải chọn được điều kiện kết thúc lặp: không bao giờ, đến một ngày cụ thể, hoặc sau N lần.
28. **Quy tắc xử lý trường hợp đặc biệt của âm lịch:**
    - Nếu sự kiện đặt ngày **30 âm** nhưng tháng âm đó chỉ có 29 ngày → sự kiện rơi vào **ngày 29** (ngày cuối tháng).
    - Sự kiện lặp hằng năm âm được tạo từ một **tháng nhuận** → các năm sau rơi vào **tháng thường** cùng số (ví dụ: tạo ngày 10/4 nhuận thì năm sau là 10/4 thường).
    - Sự kiện lặp hằng năm âm tạo từ tháng thường → năm nào có tháng nhuận cùng số thì chỉ tính **tháng thường**, không tạo thêm ở tháng nhuận.
    - Sự kiện lặp hằng tháng âm → có tạo ở cả tháng nhuận (vì mùng 1, rằm tháng nhuận vẫn được tính).
29. Với sự kiện dương lịch lặp hằng tháng vào ngày 29/30/31 → tháng nào không có ngày đó thì bỏ qua tháng đó.
30. Khi sửa hoặc xóa một sự kiện lặp, hệ thống phải hỏi: **"Chỉ sự kiện này"**, **"Sự kiện này và các sự kiện sau"**, hoặc **"Tất cả"**.

### 4.5. Danh mục (Category)

31. Hệ thống phải có sẵn danh mục mặc định: **Công việc**, **Cá nhân**, **Gia đình**, **Giỗ/Lễ**, **Sức khỏe**, **Khác**. Mỗi danh mục có một màu mặc định.
32. Người dùng phải thêm, đổi tên, đổi màu và xóa được danh mục. Màu chọn từ bảng khoảng 12 màu có sẵn.
33. Danh mục **"Khác"** không xóa được. Khi xóa một danh mục đang có sự kiện, hệ thống phải hỏi xác nhận và chuyển các sự kiện đó sang "Khác".
34. Người dùng phải lọc được lịch theo danh mục (bật/tắt hiển thị từng danh mục).

### 4.6. Nhắc hẹn (Reminder)

35. Mỗi sự kiện có thể có **tối đa 5 nhắc hẹn**. Mỗi nhắc hẹn gồm:
    - **Thời điểm**: lúc diễn ra, trước 5 phút, 15 phút, 30 phút, 1 giờ, 1 ngày, 3 ngày, 1 tuần, hoặc tùy chỉnh (số + đơn vị phút/giờ/ngày).
    - **Kênh**: Thông báo hệ thống hoặc Email.
36. Với sự kiện cả ngày, nhắc hẹn "trước N ngày" phải gửi lúc **8:00 sáng** (giờ này chỉnh được trong Cài đặt).
37. **Thông báo hệ thống:**
    - Lần đầu người dùng thêm nhắc hẹn loại này, app phải xin quyền thông báo của trình duyệt. Nếu bị từ chối, hiện hướng dẫn bật lại quyền.
    - Người dùng **chưa đăng nhập**: thông báo chỉ gửi được khi trình duyệt đang mở (tab app hoặc PWA đang chạy). App phải ghi rõ giới hạn này trên giao diện.
    - Người dùng **đã đăng nhập**: thông báo gửi bằng Web Push từ server, nhận được cả khi đã đóng tab (miễn là trình duyệt/hệ điều hành còn chạy).
38. **Email:**
    - Chỉ dùng được khi **đã đăng nhập Google**. Email gửi tới địa chỉ Gmail của tài khoản.
    - Nếu chưa đăng nhập, lựa chọn "Email" phải bị vô hiệu hóa kèm lời nhắc "Đăng nhập Google để dùng nhắc hẹn qua email".
    - Nội dung email gồm: tiêu đề sự kiện, ngày dương, ngày âm, giờ, địa điểm, ghi chú, và link mở sự kiện trong app.
39. Nhắc hẹn của sự kiện lặp phải áp dụng cho **từng lần** diễn ra.
40. Nội dung thông báo hệ thống gồm tiêu đề sự kiện, giờ, và ngày âm (ví dụ: "Giỗ ông nội — Hôm nay, 12/3 âm lịch").

### 4.7. Lưu trữ và tài khoản

41. Khi chưa đăng nhập, mọi dữ liệu (sự kiện, danh mục, cài đặt) phải lưu **trên máy** (IndexedDB) và dùng được offline.
42. Người dùng phải đăng nhập được bằng **Google** (Google Sign-In).
43. Khi đăng nhập lần đầu mà máy đang có dữ liệu local, hệ thống phải hỏi: **"Chuyển dữ liệu trên máy lên tài khoản"** hoặc **"Bỏ qua"** (giữ riêng dữ liệu local).
44. Khi đã đăng nhập, dữ liệu phải lưu trên cloud và tự đồng bộ giữa các thiết bị cùng tài khoản. App vẫn phải dùng được khi mất mạng; thay đổi offline được đồng bộ khi có mạng lại.
45. Khi xảy ra xung đột (cùng sự kiện bị sửa ở 2 máy), bản sửa **mới nhất** được giữ (last-write-wins).
46. Người dùng phải đăng xuất được. Khi đăng xuất, dữ liệu tài khoản bị xóa khỏi máy (dữ liệu trên cloud vẫn còn).
47. Người dùng phải **xuất** được dữ liệu ra file JSON và **nhập** lại từ file JSON (để sao lưu thủ công).
48. Người dùng đã đăng nhập phải xóa được tài khoản và toàn bộ dữ liệu trên cloud.

### 4.8. Cài đặt

49. Trang Cài đặt phải gồm: ngày bắt đầu tuần (thứ Hai / Chủ nhật), bật/tắt ngày lễ, bật/tắt thông tin hoàng đạo, giờ nhắc mặc định cho sự kiện cả ngày, giao diện sáng/tối/theo hệ thống, quản lý danh mục, xuất/nhập dữ liệu, tài khoản.

### 4.9. PWA

50. App phải cài được như PWA (có manifest, icon, service worker) trên máy tính và điện thoại.
51. App phải mở được và dùng được khi offline sau lần tải đầu.

## 5. Ngoài phạm vi (Non-Goals)

- **Không** đồng bộ với Google Calendar (không đọc/ghi Google Calendar).
- **Không** chia sẻ lịch, mời người khác, hay cộng tác nhiều người.
- **Không** làm app mobile native (iOS/Android) hoặc app desktop riêng ở giai đoạn này.
- **Không** nhắc hẹn qua SMS, Zalo, Messenger.
- **Không** đính kèm file/ảnh vào sự kiện.
- **Không** đăng nhập bằng phương thức khác Google (email/mật khẩu, Facebook, Apple).
- **Không** xem tử vi, xem tuổi, xem hướng, văn khấn (chỉ dừng ở hoàng đạo, giờ tốt, ngày kỵ cơ bản).
- **Không** hỗ trợ đa ngôn ngữ; giao diện chỉ tiếng Việt.
- **Không** hỗ trợ nhiều múi giờ; toàn bộ app dùng giờ Việt Nam (Asia/Ho_Chi_Minh).

## 6. Thiết kế (Design Considerations)

- Giao diện responsive: dùng tốt trên điện thoại (từ 360px) và máy tính.
- **Xem Ngày** là màn hình chính: phần đầu là "thẻ ngày" lớn (ngày dương to, ngày âm, Can Chi, hoàng đạo) giống lịch bloc treo tường; bên dưới là dòng thời gian sự kiện.
- Ngày âm luôn hiển thị nhỏ hơn và nhạt hơn ngày dương để không rối mắt.
- Chủ nhật và ngày lễ hiển thị màu đỏ (theo thói quen lịch Việt Nam).
- Có nút nổi "+" để tạo sự kiện nhanh.
- Form tạo sự kiện: công tắc Dương/Âm ở trên cùng; khi đổi loại lịch, ô chọn ngày đổi tương ứng và luôn hiện ngày quy đổi bên dưới.
- Hỗ trợ chế độ sáng/tối.
- Đạt chuẩn truy cập cơ bản: tương phản màu đủ, dùng được bằng bàn phím, có nhãn cho trình đọc màn hình.

## 7. Kỹ thuật (Technical Considerations)

Đề xuất (developer có thể điều chỉnh):

- **Frontend:** React + TypeScript + Vite; `vite-plugin-pwa` cho PWA/service worker.
- **Lưu local:** IndexedDB qua thư viện Dexie.
- **Tài khoản & cloud:** Firebase Authentication (Google provider) + Cloud Firestore (có sẵn cache offline và đồng bộ).
- **Nhắc hẹn phía server:** Cloud Functions + Cloud Scheduler chạy mỗi phút, tìm nhắc hẹn đến hạn và gửi:
  - Web Push qua Firebase Cloud Messaging (FCM).
  - Email qua dịch vụ gửi mail (Resend, SendGrid hoặc Firebase Extension "Trigger Email").
- **Nhắc hẹn local (chưa đăng nhập):** hẹn giờ trong app/service worker khi tab đang mở. Trình duyệt không hỗ trợ đặt lịch thông báo offline ổn định, nên đây là giới hạn đã biết.
- **Âm lịch:** tự cài đặt thuật toán Hồ Ngọc Đức (tham số múi giờ 7) hoặc dùng thư viện có sẵn đã kiểm chứng. Mọi hàm âm lịch phải có unit test đối chiếu với bảng lịch chuẩn (ví dụ: Tết các năm 2020–2030, các năm có tháng nhuận như 2020, 2023, 2025, 2028).
- **Mô hình dữ liệu sự kiện (gợi ý):**
  ```ts
  type CalendarEvent = {
    id: string;
    title: string;
    calendarType: 'solar' | 'lunar';
    // solar: 'YYYY-MM-DD'; lunar: { day, month, year, isLeap }
    date: string | { day: number; month: number; year: number; isLeap: boolean };
    allDay: boolean;
    startTime?: string; // 'HH:mm'
    endTime?: string;
    categoryId: string;
    recurrence?: {
      freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
      calendar: 'solar' | 'lunar';
      byWeekday?: number[];
      until?: string;
      count?: number;
    };
    exceptions?: Record<string, 'deleted' | Partial<CalendarEvent>>; // chỉnh riêng từng lần
    reminders: { offsetMinutes: number; channel: 'notification' | 'email' }[];
    location?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
  };
  ```
- Sự kiện lặp **không** lưu từng lần riêng lẻ; các lần diễn ra được tính khi hiển thị trong khoảng ngày đang xem.
- Server nhắc hẹn cần tự tính lần diễn ra kế tiếp (bao gồm quy đổi âm lịch), nên code âm lịch phải dùng chung giữa frontend và Cloud Functions.
- **Bảo mật:** Firestore Security Rules chỉ cho mỗi user đọc/ghi dữ liệu của chính mình.

## 8. Chỉ số thành công (Success Metrics)

- 100% test chuyển đổi âm lịch đúng với bảng lịch chuẩn trong khoảng 1900–2100.
- Tạo một sự kiện âm lịch lặp hằng năm mất dưới 30 giây (kiểm tra với người dùng thử).
- Ít nhất 99% nhắc hẹn server (push/email) gửi trong vòng 1 phút (push) / 5 phút (email) so với giờ hẹn.
- Xem Ngày tải xong dưới 1 giây trên điện thoại tầm trung sau lần mở đầu tiên.
- Điểm Lighthouse PWA đạt yêu cầu "installable"; Performance ≥ 90.
- Không mất dữ liệu khi chuyển dữ liệu local lên tài khoản Google.

## 9. Câu hỏi còn mở (Open Questions)

1. Nguồn tham chiếu cho **ngày tốt/xấu**: các sách lịch khác nhau cho kết quả khác nhau. Chọn theo nguồn nào (ví dụ lịch vạn niên phổ biến), và có cần thêm Nhị thập bát tú / Thập nhị trực không?
2. Có cần giới hạn số email nhắc hẹn mỗi ngày cho mỗi người dùng để kiểm soát chi phí gửi mail không?
3. Tên miền và địa chỉ email gửi đi (sender) cho email nhắc hẹn là gì?
4. Có cần danh sách ngày lễ chỉnh sửa được (người dùng tự thêm ngày lễ riêng) hay chỉ dùng danh sách cố định?
5. Người dùng chưa đăng nhập có nên được gợi ý đăng nhập để có nhắc hẹn tin cậy hơn không (ví dụ banner khi thêm nhắc hẹn)?
6. Có cần hiển thị lịch âm cho khoảng năm ngoài 1900–2100 không?
