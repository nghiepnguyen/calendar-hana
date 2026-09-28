# PRD: Vuốt ngang để chuyển ngày / tuần / tháng (calendar-hana)

## 1. Giới thiệu / Tổng quan

Hiện muốn sang ngày sau hoặc tháng sau, người dùng phải bấm nút ‹ › nhỏ trên header (điện thoại) hoặc nhấn phím mũi tên (máy tính). Trên điện thoại, nút nằm ở mép trên màn hình, xa ngón cái, dễ bấm trượt. Người dùng đã quen với Google Calendar và lịch iOS: **vuốt ngang để lật trang lịch**.

Tính năng này thêm cử chỉ **vuốt ngang** trên vùng nội dung lịch:

- **Vuốt sang trái** → trang **sau** (ngày mai / tuần sau / tháng sau).
- **Vuốt sang phải** → trang **trước** (hôm qua / tuần trước / tháng trước).
- Mỗi lần vuốt đi đúng **một đơn vị của chế độ xem đang mở**: xem Ngày ±1 ngày, xem Tuần ±1 tuần, xem Tháng ±1 tháng.
- Hỗ trợ **màn cảm ứng** (điện thoại, iPad, laptop cảm ứng, bút) và **vuốt 2 ngón ngang trên trackpad** (MacBook, laptop Windows có Precision Touchpad). **Không** hỗ trợ kéo bằng chuột.
- Nội dung **chạy theo ngón tay** khi vuốt; thả tay đủ xa hoặc đủ nhanh thì trượt sang trang mới, chưa đủ thì bật về chỗ cũ.

- Lần đầu mở lịch trên máy cảm ứng, hiện **một gợi ý nhỏ, một lần duy nhất**: "Vuốt ngang để đổi ngày".
- Đổi trang (bằng vuốt, nút hay phím) thì vùng lịch **cuộn về đầu trang**.

Nút ‹ › và phím mũi tên giữ nguyên. Vuốt là cách **thêm**, không thay thế.

**Mục tiêu:** Người dùng điện thoại lật ngày/tháng bằng một ngón cái, tự nhiên như lịch giấy, mà không làm hỏng thao tác cuộn dọc hay bấm vào ngày/sự kiện đang có.

## 2. Mục tiêu (Goals)

1. Vuốt ngang trên vùng nội dung lịch chuyển đúng một ngày / tuần / tháng tùy chế độ xem, ở cả 3 chế độ Ngày, Tuần, Tháng.
2. **Không có cú vuốt nhầm:** cuộn dọc (kể cả cuộn hơi chéo) không bao giờ làm đổi trang; bấm (tap) vào ô ngày hoặc sự kiện không bao giờ bị hiểu là vuốt.
3. Hiệu ứng mượt: nội dung bám theo ngón tay ở **60 khung hình/giây** trên điện thoại tầm trung (không giật khi kiểm bằng Chrome DevTools Performance, CPU throttling 4x).
4. Thời gian từ lúc thả tay đến khi trang mới hiện đầy đủ **≤ 300ms**.
5. Không phá cử chỉ hệ thống: vuốt từ mép màn hình để "quay lại" (iOS Safari, Android) vẫn hoạt động như cũ.
6. Trên máy tính dùng trackpad: **một** cú vuốt 2 ngón = **đúng một** lần đổi trang (không nhảy 2–3 trang do quán tính).
7. Không có lỗi WCAG AA mới (axe) và không có lỗi test hiện tại nào bị hỏng.

## 3. User Stories

- **US-S1:** Là người dùng điện thoại, tôi muốn **vuốt sang trái ở xem Ngày** để xem ngày mai (âm lịch, giờ hoàng đạo, sự kiện) mà không phải với tay lên nút › trên cùng.
- **US-S2:** Là người dùng điện thoại, tôi muốn **vuốt ở xem Tháng** để lướt nhanh qua nhiều tháng, tìm ngày rằm hoặc ngày lễ sắp tới.
- **US-S3:** Là người dùng, tôi muốn **thấy trang lịch chạy theo ngón tay**, để biết mình đang vuốt và có thể đổi ý (kéo ngược lại) trước khi thả tay.
- **US-S4:** Là người dùng, tôi muốn **cuộn dọc lịch vạn niên và lưới giờ** ở xem Ngày như bình thường, mà không bị nhảy sang ngày khác khi ngón tay hơi lệch.
- **US-S5:** Là người dùng iPhone, tôi muốn **vuốt từ mép trái để quay lại** trang trước như mọi app khác, không bị app "cướp" cử chỉ đó.
- **US-S6:** Là người dùng MacBook, tôi muốn **vuốt 2 ngón ngang trên trackpad** để lật tháng, giống như lật ảnh trong Photos.
- **US-S7:** Là người bật "Giảm chuyển động" trong hệ điều hành, tôi muốn vuốt vẫn đổi trang nhưng **không có hiệu ứng trượt**, để không bị chóng mặt.
- **US-S8:** Là người mới dùng, tôi muốn **được nhắc một lần** rằng có thể vuốt ngang, vì tôi không tự đoán ra được.
- **US-S9:** Là người dùng đã cài app lên màn hình chính iPhone, tôi muốn **vuốt được cả khi đặt ngón tay sát mép màn hình**, vì app đã cài không có cử chỉ "vuốt mép để quay lại" của Safari.
- **US-S10:** Là người dùng xem Ngày, tôi muốn **sang ngày mới là thấy phần đầu** (ngày âm, can chi) thay vì bị kẹt ở cuối trang của ngày cũ.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1 Hành vi chung

1. Vuốt sang trái phải gọi `goNext()`, vuốt sang phải phải gọi `goPrev()` của `useCalendarRoute` (`src/hooks/useCalendarRoute.ts`). Không viết lại logic cộng/trừ ngày; dùng lại hàm có sẵn để kết quả giống hệt nút ‹ › và phím mũi tên.
2. Áp dụng cho 3 chế độ xem: Ngày (`/day/...`), Tuần (`/week/...`), Tháng (`/month/...`).
3. Không áp dụng cho các trang khác: Danh sách sự kiện (`/events`), Cài đặt, trang đăng nhập...
4. Mỗi cú vuốt thành công đổi **đúng một** trang. Muốn đi 3 tháng thì vuốt 3 lần.
5. Đổi trang bằng vuốt phải cập nhật URL giống như bấm nút (để refresh vẫn giữ ngày, và nút Back của trình duyệt quay lại được).
6. Khi đang ở giới hạn năm app hỗ trợ (1900 hoặc 2100) và không còn trang tiếp theo hợp lệ, vuốt tiếp không được đổi trang. Nội dung bật về chỗ cũ, không báo lỗi.

### 4.2 Vùng nhận vuốt

7. Chỉ **vùng nội dung lịch** nhận vuốt, tức phần tử `<main>` trong `src/pages/CalendarPage.tsx` (lưới Tháng, lưới Tuần, thẻ ngày + lịch vạn niên + lưới giờ ở xem Ngày).
8. Các vùng sau **không** nhận vuốt: header (`AppHeader`), sidebar, thanh tab dưới đáy (`TabBar`), nút tạo sự kiện (`CreateFab`), hộp thoại, bảng tìm kiếm.
9. Khi đang mở bất kỳ hộp thoại nào (`[role="dialog"][aria-modal="true"]`) hoặc bảng tìm kiếm, vuốt không được đổi trang. Đây cũng là quy tắc `useKeyboardShortcuts` đang dùng.
10. Khi chạy **trong trình duyệt** (tab thường), bỏ qua cú vuốt bắt đầu cách **mép trái hoặc mép phải màn hình dưới 24px**, để nhường cử chỉ "vuốt từ mép để quay lại" của hệ điều hành/trình duyệt.
    - Khi chạy như **app đã cài (PWA)**, tức media query `(display-mode: standalone)` khớp, thì **không** có vùng chặn 24px: vuốt bắt đầu sát mép vẫn được nhận.
    - Đổi giữa hai trạng thái (hiếm, ví dụ cài app khi đang mở) phải có hiệu lực ngay, không cần tải lại. Dùng `useMediaQuery` là đủ.
11. Bỏ qua cú vuốt bắt đầu trên:
    - Ô nhập liệu: `input`, `textarea`, `select`, phần tử `contenteditable`.
    - Phần tử tự cuộn ngang được (có `overflow-x: auto/scroll` và nội dung rộng hơn khung).
    - Phần tử được đánh dấu `data-no-swipe` (để sau này chặn vuốt ở chỗ cần, ví dụ một slider).

### 4.3 Nhận diện cử chỉ trên màn cảm ứng

12. Chỉ nhận thao tác từ **ngón tay và bút** (`pointerType` là `touch` hoặc `pen`). Thao tác bằng chuột (`pointerType === 'mouse'`) phải bị bỏ qua hoàn toàn: kéo chuột vẫn bôi đen chữ như cũ.
13. **Khóa hướng:** khi ngón tay đã di chuyển quá **10px** kể từ điểm chạm:
    - Nếu quãng ngang lớn hơn quãng dọc (`|dx| > |dy|`), coi là **vuốt ngang**: app bắt đầu điều khiển, trình duyệt không cuộn dọc nữa.
    - Ngược lại, coi là **cuộn dọc**: app bỏ qua cả cú chạm này, trình duyệt cuộn bình thường.
    - Đã khóa hướng thì giữ nguyên đến khi nhấc tay, không đổi giữa chừng.
14. Chạm bằng **2 ngón trở lên** (ví dụ pinch để phóng to) phải hủy cú vuốt đang diễn ra và bật nội dung về chỗ cũ.
15. Khi thả tay, cú vuốt **thành công** nếu thỏa **một trong hai**:
    - Quãng ngang **≥ 25% chiều rộng** vùng nội dung, **hoặc**
    - Vuốt nhanh: vận tốc ngang **≥ 0.5 px/ms** trong khoảng 100ms cuối **và** quãng ngang **≥ 40px**.
16. Nếu lúc thả tay ngón tay đang đi **ngược** chiều so với hướng vuốt (người dùng kéo ra rồi kéo lại), coi là **hủy**, dù quãng đã đủ xa.
17. Cú chạm bị hệ thống hủy (`pointercancel`, ví dụ có cuộc gọi đến) phải bật nội dung về chỗ cũ và không đổi trang.
18. **Chặn bấm nhầm sau khi vuốt:** nếu cú chạm đã được khóa là vuốt ngang (dù thành công hay bị hủy), sự kiện `click` ngay sau đó phải bị chặn. Nhờ vậy vuốt xong không vô tình mở ngày hay mở sự kiện nằm dưới ngón tay.
19. Chạm và nhấc tay mà di chuyển dưới 10px phải được coi là **bấm bình thường**. Bấm ô ngày, bấm sự kiện, nhấn giữ... đều hoạt động như trước.

### 4.4 Hiệu ứng

20. Trong lúc vuốt ngang, nội dung trong `<main>` phải **dịch ngang theo ngón tay** (1px ngón tay = 1px nội dung).
21. Thả tay và vuốt **thành công**:
    1. Nội dung cũ trượt tiếp ra khỏi màn hình theo hướng vuốt.
    2. Đổi sang ngày/tuần/tháng mới (gọi `goNext`/`goPrev`).
    3. Nội dung mới trượt vào từ phía đối diện về vị trí giữa.

    Tổng thời gian ≤ 300ms, easing kiểu `ease-out`.
22. Thả tay và vuốt **không thành công**: nội dung trượt về vị trí cũ trong ~200ms.
23. Khi vuốt ở giới hạn năm (yêu cầu 6), nội dung chỉ dịch được **tối đa 1/3 quãng ngón tay** (cảm giác "kéo cao su"), để người dùng hiểu là không đi tiếp được.
24. Khi hệ điều hành bật "Giảm chuyển động" (`prefers-reduced-motion: reduce`):
    - Nội dung **không** dịch theo ngón tay và **không** có hiệu ứng trượt.
    - Vuốt thành công (theo quy tắc ở yêu cầu 15) thì đổi trang ngay lập tức.
25. Chỉ dùng `transform: translateX(...)` cho hiệu ứng, không đổi `left`/`margin`/`width`, để trình duyệt không phải tính lại bố cục mỗi khung hình.
26. Trong lúc vuốt không được hiện ngày/tháng kế bên (không "hé lộ" trang tiếp theo). Phần trống lộ ra khi nội dung dịch đi là màu nền của `<main>`.

### 4.5 Trackpad trên máy tính

27. Nhận **vuốt 2 ngón ngang trên trackpad** qua sự kiện `wheel` trên `<main>`: sự kiện có `deltaX` và `|deltaX| > |deltaY|`.
28. Cộng dồn `deltaX` của một chuỗi sự kiện `wheel` liên tiếp. Khi tổng vượt **80px**, đổi **một** trang: `deltaX > 0` (vuốt 2 ngón sang trái) thì trang sau, `deltaX < 0` thì trang trước.
29. Sau khi đổi trang, **bỏ qua mọi sự kiện `wheel` ngang** cho đến khi trackpad đứng yên liên tục **≥ 300ms**, để quán tính (momentum) của cùng một cú vuốt không lật thêm trang.
30. Sự kiện `wheel` dọc (cuộn bình thường) và `wheel` có giữ phím `Ctrl`/`Cmd` (phóng to trang) phải được bỏ qua hoàn toàn.
31. Trackpad **không** có hiệu ứng chạy theo tay; đổi trang dùng hiệu ứng trượt vào ngắn (bước 3 của yêu cầu 21). Nếu bật "Giảm chuyển động" thì đổi ngay.
32. **Không** cố chặn cử chỉ "vuốt 2 ngón để Back/Forward" của trình duyệt bằng JavaScript: không gắn listener `wheel` non-passive, không gọi `preventDefault()` trên `wheel`. Trình duyệt vẫn làm mặc định của nó.
    - Được phép đặt CSS `overscroll-behavior-x: none` cho `<main>`. Chrome/Edge sẽ không Back khi vuốt trong vùng lịch; trình duyệt không hỗ trợ (Safari) thì cứ để hành vi mặc định.
    - Nếu trên Safari macOS một cú vuốt vừa đổi trang lịch vừa Back trình duyệt, chấp nhận. Không làm thêm gì.
33. Chuột có bánh xe ngang, hoặc giữ `Shift` + lăn chuột, cũng sinh `deltaX`. Được phép coi như trackpad và đổi trang theo cùng quy tắc; không cần phân biệt.

### 4.6 Sau khi đổi trang

34. Sau khi đổi sang ngày/tuần/tháng khác, vùng `<main>` phải **cuộn về đầu trang** (`scrollTop = 0`), dù đổi bằng cách nào: vuốt, trackpad, nút ‹ ›, phím mũi tên, nút "Hôm nay", chọn ngày trên mini-calendar hay bộ chọn ngày. Hiện tại app giữ nguyên vị trí cuộn; tính năng này đổi hành vi đó.
    - Áp dụng cho cả 3 chế độ xem. Quan trọng nhất là xem Ngày, vì trang dài (thẻ ngày + lịch vạn niên + lưới giờ).
    - Cuộn về đầu **ngay lập tức**, không cuộn mượt (`behavior: 'instant'`). Khi có hiệu ứng trượt thì cuộn lúc nội dung mới bắt đầu trượt vào, để người dùng không thấy trang cũ nhảy lên.
    - **Không** cuộn về đầu khi chỉ đổi chế độ xem (Ngày → Tháng) mà ngày giữ nguyên, hoặc khi mở/đóng hộp thoại sự kiện. Cả hai trường hợp này giữ hành vi hiện tại.
35. Tiêu đề trang (`useCalendarHead`) và header phải cập nhật sang ngày/tháng mới như khi bấm nút.

### 4.7 Đo lường

36. Mỗi lần đổi trang thành công bằng vuốt phải gửi `track('swipe_navigate', { view, direction, input })`, trong đó:
    - `view`: `'day' | 'week' | 'month'`
    - `direction`: `'next' | 'prev'`
    - `input`: `'touch' | 'trackpad'`
37. Để so sánh, đổi trang bằng nút ‹ › và phím mũi tên phải gửi `track('nav_button', { view, direction, input })`, với `input` là `'button'` hoặc `'keyboard'`.

### 4.8 Hướng dẫn người dùng

38. Trang Cài đặt, mục phím tắt (`Settings/ShortcutSection`), phải thêm một dòng hướng dẫn: "Vuốt ngang trên lịch (hoặc vuốt 2 ngón trên trackpad) để sang ngày/tuần/tháng trước hoặc sau."

### 4.9 Gợi ý vuốt lần đầu

39. Hiện một **gợi ý nhỏ** trên màn hình lịch (Ngày, Tuần hoặc Tháng) khi đủ **tất cả** điều kiện sau:
    - Thiết bị có màn cảm ứng làm cách nhập chính: media query `(pointer: coarse)` khớp. Máy tính dùng chuột/trackpad **không** thấy gợi ý; họ đọc hướng dẫn trong Cài đặt.
    - Máy này **chưa từng** thấy gợi ý: `localStorage` chưa có khóa `hana:swipe-hint-seen`.
    - **Không** có hộp thoại nào đang mở (kể cả hộp thoại chào mừng `Welcome`, hộp thoại chuyển dữ liệu `MigrationDialog`) và bảng tìm kiếm đang đóng. Nếu đang mở thì chờ đóng xong mới hiện.
    - Người dùng **chưa** tự vuốt thành công lần nào (đã biết vuốt thì không cần nhắc).
40. Gợi ý hiện sau khi màn lịch hiển thị xong khoảng **1 giây**, để không chen vào lúc app vừa mở.
41. Nội dung gợi ý:
    - Icon bàn tay vuốt (Phosphor `HandSwipeLeft`) + chữ: **"Vuốt ngang để sang ngày khác"**. Ở xem Tuần/Tháng đổi chữ thành "tuần khác"/"tháng khác".
    - Nút **×** để đóng, `aria-label="Đóng gợi ý"`, vùng bấm tối thiểu 44×44px.
42. Vị trí: nằm nổi ở phía dưới vùng `<main>`, **ngay trên** thanh tab dưới đáy, căn giữa. Không che header, không che nút tạo sự kiện, không đẩy bố cục (dùng `position` nổi, không chiếm chỗ).
43. Hiệu ứng: icon bàn tay lắc nhẹ trái–phải 2 lần khi gợi ý xuất hiện. Bật "Giảm chuyển động" thì icon đứng yên.
44. Gợi ý **tự biến mất** khi xảy ra điều đầu tiên trong các điều sau:
    - Người dùng vuốt thành công một lần (`reason: 'swipe'`).
    - Người dùng bấm × (`reason: 'close'`).
    - Hết **8 giây** (`reason: 'timeout'`).
45. Ngay khi gợi ý **xuất hiện**, ghi `hana:swipe-hint-seen = '1'` vào `localStorage`. Nhờ vậy nếu người dùng tắt app giữa chừng, lần sau cũng không hiện lại. Mỗi máy chỉ thấy gợi ý **một lần**; khóa này không đồng bộ theo tài khoản.
46. Nếu `localStorage` bị chặn (đọc/ghi ném lỗi, ví dụ chế độ ẩn danh chặn lưu trữ), **không hiện** gợi ý. Đây là cách `Welcome.tsx` đang làm: thà không hiện còn hơn hiện mỗi lần mở.
47. Gợi ý phải có `role="status"` để trình đọc màn hình đọc nội dung một lần. Gợi ý không được lấy focus bàn phím khi xuất hiện.
48. Khi gợi ý biến mất, gửi `track('swipe_hint_dismissed', { reason })` với `reason` như yêu cầu 44.
49. Gợi ý không được làm hỏng thao tác nào: vẫn bấm được ô ngày/sự kiện nằm ngoài khung gợi ý, vẫn cuộn và vuốt được bình thường khi gợi ý đang hiện.

## 5. Ngoài phạm vi (Non-Goals)

- **Kéo bằng chuột** để đổi trang.
- **Vuốt dọc** để đổi trang, hoặc cuộn liên tục kiểu "cuộn vô tận" qua các tháng.
- **Hé lộ / tải trước** ngày hoặc tháng kế bên trong lúc vuốt (kiểu carousel 3 trang).
- Vuốt ở trang **Danh sách sự kiện**, Cài đặt, hộp thoại, mini-calendar trong sidebar hoặc bộ chọn ngày.
- Vuốt để **đổi chế độ xem** (Ngày ↔ Tuần ↔ Tháng).
- **Rung (haptic)** khi đổi trang.
- Cài đặt bật/tắt vuốt hoặc chỉnh độ nhạy. Làm sau nếu có phản hồi cần.
- Chặn cử chỉ "vuốt 2 ngón để Back" của Safari bằng JavaScript (xem yêu cầu 32).
- Hiện lại gợi ý vuốt lần thứ hai, hoặc nút "xem lại gợi ý" trong Cài đặt.
- Thử nghiệm với người dùng để chỉnh ngưỡng vuốt trước khi phát hành. Dùng các giá trị trong PRD này, chỉnh sau theo số liệu analytics nếu cần.
- Kéo sự kiện sang ngày khác (drag & drop).
- Thêm thư viện cử chỉ bên ngoài (Hammer.js, use-gesture...).

## 6. Thiết kế (Design Considerations)

- **Hướng:** vuốt trái = tương lai, vuốt phải = quá khứ, giống lật trang sách và giống Google Calendar / lịch iOS.
- **Vùng vuốt** (điện thoại):

  ```
  ┌──────────────────────────┐
  │ AppHeader  ‹ Tháng 9 ›   │  ← không nhận vuốt
  ├──────────────────────────┤
  │▒│                      │▒│
  │▒│   <main>: lưới lịch  │▒│  ← nhận vuốt
  │▒│   / thẻ ngày         │▒│
  │▒│                      │▒│  ▒ = 24px mép, không nhận vuốt
  ├──────────────────────────┤
  │ TabBar                   │  ← không nhận vuốt
  └──────────────────────────┘
  ```

- **Hiệu ứng:** nội dung cũ và mới trượt cùng hướng ngón tay, không mờ dần, không phóng to/thu nhỏ. Thời lượng ngắn (≤ 300ms) để lướt nhiều tháng liên tục không thấy chậm.
- Trong lúc vuốt không có viền, bóng hay chỉ báo gì thêm. Phần nền lộ ra là màu nền sẵn có của `<main>`, hợp cả chế độ sáng và tối.
- **Gợi ý lần đầu** (mục 4.9), trên điện thoại:

  ```
  ┌──────────────────────────┐
  │ AppHeader                │
  ├──────────────────────────┤
  │                          │
  │      lưới lịch           │
  │                          │
  │  ┌────────────────────┐  │
  │  │ 👋 Vuốt ngang để   │  │  ← nổi, căn giữa, ngay trên TabBar
  │  │ sang ngày khác   × │  │
  │  └────────────────────┘  │
  ├──────────────────────────┤
  │ TabBar                   │
  └──────────────────────────┘
  ```

  - Dùng kiểu khung kính mờ có sẵn trong `src/styles/theme.css` (giống toast/popover hiện có), bo góc tròn dạng viên thuốc. Chữ và icon theo tỉ lệ cỡ chữ người dùng chọn (`iconSize` trong `src/styles/textSize.ts`).
  - Độ tương phản chữ/nền đạt WCAG AA ở cả chế độ sáng và tối.
  - Xuất hiện bằng hiệu ứng mờ dần + trượt lên nhẹ (~200ms); biến mất bằng mờ dần. Bật "Giảm chuyển động" thì hiện/ẩn ngay.

## 7. Kỹ thuật (Technical Considerations)

### Cấu trúc code gợi ý

- **`src/calendar/swipe.ts`**: hàm thuần (không dùng DOM, không dùng React), dễ test:
  - `lockDirection(dx, dy)` → `'horizontal' | 'vertical' | null`
  - `isSwipeCommitted({ dx, velocity, width, reversed })` → `boolean`
  - `rubberBand(dx)` → `dx / 3`
  - Các hằng số: `LOCK_DISTANCE = 10`, `EDGE_GUARD = 24`, `DISTANCE_RATIO = 0.25`, `MIN_FLING_DISTANCE = 40`, `FLING_VELOCITY = 0.5`, `TRACKPAD_THRESHOLD = 80`, `TRACKPAD_IDLE_MS = 300`.
- **`src/hooks/useSwipeNavigation.ts`**: hook nhận `ref` của `<main>`, `onPrev`, `onNext`, `canPrev`, `canNext`. Hook gắn Pointer Events + `wheel` và trả về trạng thái để áp `transform`.
- **`src/pages/CalendarPage.tsx`**: gắn hook vào `<main>`. Bọc `<View />` trong một `div` để làm phần tử dịch chuyển; không dịch chính `<main>` vì `<main>` là khung cuộn dọc.
- **Cuộn về đầu (yêu cầu 34)**: trong `CalendarPage`, một `useEffect` phụ thuộc vào `date` gọi `mainRef.current.scrollTo({ top: 0, behavior: 'instant' })`. Chỉ phụ thuộc `date`, **không** phụ thuộc `view`, để đổi chế độ xem không làm cuộn. Vì mọi cách đổi ngày đều đổi URL rồi đổi `date`, một chỗ này bao hết mọi cách, không cần sửa từng nút.
- **`src/components/SwipeHint/SwipeHint.tsx`** (+ `.module.css`, `.test.tsx`): component gợi ý lần đầu. Làm theo mẫu `src/components/Welcome/Welcome.tsx`: hằng số khóa `SWIPE_HINT_STORAGE_KEY = 'hana:swipe-hint-seen'` được export, đọc/ghi `localStorage` trong `try/catch`. Nhận prop `view` (để đổi chữ) và một tín hiệu "vừa vuốt thành công" từ `useSwipeNavigation` để tự ẩn.
- **Phát hiện đang mở như app đã cài:** dùng `useMediaQuery('(display-mode: standalone)')`, giống `Welcome.tsx` và `InstallSection.tsx`.

### Lưu ý triển khai

- **Pointer Events** (`pointerdown/move/up/cancel`) thay vì Touch Events: một API cho cả ngón tay và bút, dễ lọc `pointerType`.
- Đặt CSS **`touch-action: pan-y`** cho `<main>`. Trình duyệt vẫn tự cuộn dọc, còn cử chỉ ngang được giao cho app. Không cần `preventDefault()` trên `touchmove`, nên không phải gắn listener non-passive trên điện thoại.
- Sau khi khóa hướng ngang, gọi `setPointerCapture(pointerId)` để vẫn nhận sự kiện khi ngón tay trượt ra ngoài `<main>`.
- Chặn click sau vuốt (yêu cầu 18): gắn listener `click` ở **capture phase** trên `<main>` và gọi `stopPropagation()` + `preventDefault()` một lần.
- Cập nhật `transform` bằng `requestAnimationFrame` và ghi thẳng vào `style` của phần tử qua `ref`. **Không** `setState` mỗi `pointermove`: re-render cả lưới Tháng mỗi khung hình sẽ giật.
- Hiệu ứng trượt ra/vào: có thể dùng Web Animations API (`element.animate(...)`) hoặc CSS transition. Phải dọn `transform` về `none` sau khi xong, để không ảnh hưởng `position: sticky` hay popover bên trong.
- **Back/Forward của trình duyệt khi vuốt trackpad (yêu cầu 32):** chỉ đặt `overscroll-behavior-x: none` cho `<main>` (có tác dụng trên Chrome/Edge). Listener `wheel` để **passive** (mặc định), không gọi `preventDefault()`. Safari giữ hành vi mặc định.
- **Giới hạn năm (yêu cầu 6, 23):** tính `canPrev`/`canNext` bằng cách thử `shiftDate(view, date, ±1)` rồi kiểm năm trong khoảng 1900–2100, dùng lại quy tắc của `isValidDate` trong `useCalendarRoute.ts`.
- **Giảm chuyển động:** dùng `useMediaQuery('(prefers-reduced-motion: reduce)')` có sẵn trong `src/hooks/useMediaQuery.ts`.
- **Analytics:** dùng `track()` trong `src/analytics.ts`. Các nút ‹ › trong `AppHeader` và phím tắt trong `CalendarPage` cần truyền thêm `input` để gửi `nav_button` (yêu cầu 37).
- Không thêm thư viện mới.

### Kiểm thử

- **Unit test** (`src/calendar/swipe.test.ts`) cho các hàm thuần: khóa hướng ở các góc (0°, 30°, 45°, 60°), ngưỡng 25%, vuốt nhanh, kéo ngược, kéo cao su.
- **Component test** (Vitest + Testing Library) cho `useSwipeNavigation`, dùng `fireEvent.pointerDown/Move/Up` với `pointerType: 'touch'`:
  - Vuốt trái/phải gọi đúng `onNext`/`onPrev`.
  - `pointerType: 'mouse'` không làm gì.
  - Bắt đầu trong 24px mép thì không làm gì khi ở trình duyệt; vẫn nhận khi giả lập `(display-mode: standalone)` khớp.
  - Bắt đầu trên `input` hoặc `[data-no-swipe]` thì không làm gì.
  - Có hộp thoại mở thì không làm gì.
  - Click sau vuốt bị chặn; tap bình thường vẫn qua.
  - Chuỗi `wheel` ngang chỉ đổi một trang; `wheel` với `ctrlKey` bị bỏ qua.
- **Component test cuộn về đầu** (`CalendarPage`): đặt `scrollTop` của `<main>` khác 0, đổi ngày bằng nút › thì `scrollTop` về 0; đổi chế độ xem Ngày → Tháng thì `scrollTop` giữ nguyên.
- **Component test `SwipeHint`**:
  - Hiện khi `(pointer: coarse)` khớp và chưa có khóa; không hiện khi đã có khóa hoặc khi không phải màn cảm ứng.
  - Ghi khóa ngay khi xuất hiện.
  - Tự ẩn khi bấm ×, khi vuốt thành công, và sau 8 giây (dùng fake timers); mỗi lần gửi đúng `reason`.
  - Chờ khi có hộp thoại đang mở.
  - `localStorage` ném lỗi thì không hiện.
- **E2E** (Playwright, project mobile có `hasTouch: true`): vuốt ở xem Ngày và xem Tháng, kiểm URL đổi đúng; cuộn dọc lịch vạn niên không đổi URL. Playwright chưa có API vuốt sẵn; dùng `page.touchscreen` hoặc gửi touch events qua CDP (`Input.dispatchTouchEvent`).
- **Thử tay trên máy thật** trước khi phát hành: iPhone Safari (cả tab trình duyệt và PWA đã cài), Android Chrome, iPad, MacBook Safari + Chrome (trackpad).

## 8. Đo lường thành công (Success Metrics)

1. Sau 4 tuần phát hành, trên điện thoại, **≥ 40%** lượt đổi trang (`swipe_navigate` + `nav_button`) đến từ vuốt.
2. Số phiên có lượt xem Ngày/Tháng lật **≥ 3 trang** tăng **≥ 15%** so với 4 tuần trước khi phát hành (người dùng lướt xem nhiều hơn vì dễ hơn).
3. **Không** có báo lỗi/phản hồi nào về "tự nhảy ngày khi đang cuộn" hoặc "không vuốt quay lại được trên iPhone" trong 4 tuần đầu.
4. Toàn bộ test cũ và test mới đều qua; axe không có lỗi mới.
5. Trong các lượt `swipe_hint_dismissed`, **≥ 30%** có `reason: 'swipe'` (người dùng thử vuốt ngay khi được nhắc).

## 9. Câu hỏi còn mở (Open Questions)

Các câu hỏi đợt trước đã được chốt:

| Câu hỏi | Quyết định | Yêu cầu liên quan |
|---|---|---|
| Safari macOS có chặn được "vuốt 2 ngón để Back" không? | Không chặn bằng JS; chấp nhận hành vi mặc định của trình duyệt | 32 |
| Có bỏ vùng chặn 24px mép khi chạy như app đã cài không? | Có, bỏ khi `(display-mode: standalone)` | 10 |
| Đổi ngày thì giữ vị trí cuộn hay về đầu? | Về đầu trang, với mọi cách đổi ngày | 34 |
| Có gợi ý vuốt lần đầu trên màn hình chính không? | Có, hiện một lần trên máy cảm ứng | 39–49 |
| Có thử ngưỡng với người dùng trước khi phát hành không? | Không, dùng giá trị trong PRD | Mục 5 |

Không còn câu hỏi mở.
