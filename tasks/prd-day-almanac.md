# PRD: Thông tin lịch vạn niên trong xem Ngày (calendar-hana)

## 1. Giới thiệu / Tổng quan

Xem Ngày hiện có thẻ ngày (`DayCard`) với ngày dương, ngày âm, Can Chi ngày/tháng/năm, ngày hoàng đạo/hắc đạo, 6 giờ hoàng đạo và tiết khí. Người dùng quen xem lịch vạn niên (xem ngày tốt xấu, hướng xuất hành, tuổi xung...) vẫn phải mở app hoặc trang web khác để tra thêm.

Tính năng này thêm một **khối "Lịch vạn niên"** trong xem Ngày, gồm 7 nhóm thông tin:

1. Tiết khí & Ngũ hành (tiết khí, niên mệnh, Can Chi ngày, quan hệ Can Chi)
2. Nhị thập bát tú (sao, ngũ hành, con vật, tốt/xấu)
3. Thập nhị trực (trực của ngày, việc nên làm, việc nên kiêng)
4. Hướng xuất hành (Hỷ Thần, Tài Thần)
5. Tuổi xung khắc (xung ngày, xung tháng)
6. Sao tốt & Sao xấu (theo Ngọc Hạp Thông Thư, bấm vào sao để xem giải thích)
7. Giờ trong ngày (đủ 12 khung giờ, giờ tốt màu xanh lá, giờ xấu màu xám, đánh dấu giờ hiện tại)

Mọi thông tin được **tính ngay trên máy**, không gọi API, dùng được khi không có mạng. Khối này bật/tắt chung với công tắc "Hiện ngày hoàng đạo" đang có trong Cài đặt.

**Mục tiêu:** Người dùng xem được đầy đủ thông tin lịch vạn niên của bất kỳ ngày nào ngay trong app, số liệu khớp với các trang lịch vạn niên phổ biến ở Việt Nam.

## 2. Mục tiêu (Goals)

1. Mở xem Ngày của một ngày bất kỳ (1900–2100) là thấy ngay đủ 7 nhóm thông tin, không cần bấm thêm.
2. Số liệu khớp 100% với bộ ngày mẫu đã đối chiếu trước từ nguồn tham chiếu (mục 7.3), có unit test.
3. Tính toàn bộ thông tin của một ngày mất dưới 5ms trên điện thoại tầm trung. Chuyển ngày không bị giật.
4. Dùng được khi không có mạng (không gọi API, không tải thêm file lúc chạy).
5. Không có lỗi WCAG AA (axe) ở cả chế độ sáng và tối.

## 3. User Stories

- **US-A1:** Là người dùng, tôi muốn xem **tiết khí, niên mệnh và Can Chi của ngày**, để biết ngày đó thuộc hành gì, tốt hay xấu theo Can Chi.
- **US-A2:** Là người dùng, tôi muốn biết **sao Nhị thập bát tú** trực ngày, để tham khảo khi chọn ngày làm việc lớn.
- **US-A3:** Là người dùng, tôi muốn biết **trực của ngày và việc nên làm / nên kiêng**, để chọn ngày cưới hỏi, khai trương, động thổ.
- **US-A4:** Là người dùng, tôi muốn biết **hướng Hỷ Thần và Tài Thần**, để chọn hướng xuất hành.
- **US-A5:** Là người dùng, tôi muốn biết **tuổi nào xung với ngày và tháng**, để tránh chọn ngày xung tuổi người trong nhà.
- **US-A6:** Là người dùng, tôi muốn xem **các sao tốt và sao xấu** của ngày, bấm vào một sao để **đọc giải thích ngắn**, vì tôi không nhớ hết ý nghĩa từng sao.
- **US-A7:** Là người dùng, tôi muốn xem **đủ 12 giờ trong ngày**, giờ nào tốt giờ nào xấu, và biết **bây giờ là giờ gì**, để chọn giờ xuất hành.
- **US-A8:** Là người dùng không quan tâm tới xem ngày, tôi muốn **tắt** toàn bộ phần này bằng công tắc đang có trong Cài đặt.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Vị trí và bật/tắt

1. Xem Ngày phải có thêm một khối kính (glass) tiêu đề **"Lịch vạn niên"**, **luôn mở sẵn** (không có nút thu gọn).
2. Thứ tự trong xem Ngày: `DayCard` → khối "Sự kiện trong ngày" → khối "Lịch vạn niên". Sự kiện đứng trước để trên điện thoại không bị đẩy xuống dưới màn hình.
3. Khối "Lịch vạn niên" chỉ hiện khi `settings.showAuspicious === true`. Tắt công tắc này trong Cài đặt thì ẩn cả khối, cùng lúc với phần hoàng đạo trong `DayCard` và dấu hoàng đạo ở xem Tháng như hiện nay.
4. Đổi nhãn công tắc trong Cài đặt thành **"Hiện ngày hoàng đạo và lịch vạn niên"** để người dùng biết công tắc này điều khiển cả khối mới.
5. Khi khối mới hiện, **bỏ** danh sách "Giờ hoàng đạo" và dòng "Tiết khí: ..." trong `DayCard`, vì khối mới đã có đầy đủ hơn. Vẫn giữ dòng "Ngày hoàng đạo / hắc đạo (tên thần)" và các ngày kỵ (Tam Nương, Nguyệt Kỵ) trong `DayCard`.
6. Chuyển sang ngày khác (vuốt, nút trước/sau, chọn ngày) thì khối phải cập nhật theo ngày mới.

### 4.2. Tiết khí & Ngũ hành

7. Hiện 4 dòng, dạng nhãn và giá trị:
   - **Tiết khí:** tên tiết khí đang ở, ví dụ "Thu phân". Dùng `getSolarTerm(jd).name` đã có.
   - **Niên mệnh:** nạp âm của **Can Chi ngày**, theo bảng 60 Hoa Giáp, ví dụ Nhâm Dần là "Kim Bạch Kim".
   - **Ngày Can Chi:** ví dụ "Nhâm Dần". Dùng `dayCanChi(jd)` đã có.
   - **Quan hệ Can Chi:** câu mô tả quan hệ ngũ hành giữa Can và Chi của ngày, ví dụ "Can sinh Chi (Thủy, Mộc), là ngày cát (bảo nhật)."
8. Quan hệ Can Chi phải tính theo ngũ hành của Can và Chi:

   | Quan hệ | Tên ngày | Đánh giá |
   |---|---|---|
   | Can sinh Chi | bảo nhật | cát |
   | Chi sinh Can | nghĩa nhật | cát |
   | Can khắc Chi | chế nhật | bình (tiểu cát) |
   | Chi khắc Can | phạt nhật | hung |
   | Can và Chi cùng hành | chuyên nhật (hoà nhật) | cát |

   Ngũ hành của Can: Giáp, Ất là Mộc; Bính, Đinh là Hỏa; Mậu, Kỷ là Thổ; Canh, Tân là Kim; Nhâm, Quý là Thủy.
   Ngũ hành của Chi: Dần, Mão là Mộc; Tỵ, Ngọ là Hỏa; Thân, Dậu là Kim; Hợi, Tý là Thủy; Thìn, Tuất, Sửu, Mùi là Thổ.
   Trong câu mô tả, ghi hành của Can trước, hành của Chi sau.

### 4.3. Nhị thập bát tú

9. Hiện: nhãn **Cát Tú** hoặc **Hung Tú** (có màu), **Sao** (ví dụ "Ngưu"), **Ngũ hành** (ví dụ "Kim"), **Động vật** (ví dụ "Ngưu (Trâu)").
    Ngũ hành luôn là một trong 5 hành. 4 sao Thái Dương (Phòng, Hư, Mão, Tinh) quy về **Hỏa**, 4 sao Thái Âm (Tâm, Nguy, Tất, Trương) quy về **Thủy**. Nếu licham.vn ghi khác thì theo licham.vn.
10. Sao của ngày tính theo công thức `index = (jd + 11) mod 28`, với `index = 0` là sao Giác, rồi theo thứ tự trong bảng Phụ lục B. Công thức này đã kiểm tra với ngày mẫu 25/9/2026 (ra sao Ngưu). Phải kiểm tra thêm với ít nhất 5 ngày khác từ nguồn tham chiếu (mục 7.3).
11. Bấm vào tên sao thì mở giải thích ngắn (mục 4.8).

### 4.4. Thập nhị trực

12. Hiện: **Trực** (ví dụ "Trực Chấp"), nhãn cát/hung, **Nên làm** (1 dòng liệt kê việc) và **Nên kiêng** (1 dòng liệt kê việc).
13. Trực tính theo **tháng tiết khí** (không theo tháng âm): tháng Dần bắt đầu từ tiết Lập xuân, tháng Mão từ Kinh trập, v.v. Ngày có Chi trùng Chi của tháng tiết khí là trực **Kiến**, rồi lần lượt theo thứ tự Kiến, Trừ, Mãn, Bình, Định, Chấp, Phá, Nguy, Thành, Thâu, Khai, Bế (licham.vn ghi "Thâu" thay cho "Thu"). Công thức: `trựcIndex = (chiNgày − chiThángTiếtKhí + 12) mod 12`.
    Ghi chú: tiết giao lúc nào trong ngày thì ngày đó đã thuộc tháng tiết khí mới (khớp thoigian.com.vn ở cả 24 ngày bắt đầu tiết 2025–2026). licham.vn và xemngay.com dùng bảng tiết riêng nên có thể lệch một ngày ở ngày giao tiết; ngày thường cả 4 nguồn khớp nhau.
14. Bấm vào tên trực thì mở giải thích ngắn (mục 4.8).

### 4.5. Hướng xuất hành

15. Hiện **Hỷ Thần** và **Tài Thần**, mỗi mục một hướng (Đông, Tây, Nam, Bắc, Đông Bắc, Đông Nam, Tây Bắc, Tây Nam).
16. Tra theo **Can của ngày** (bảng Phụ lục C). Ngày mẫu Nhâm: Hỷ Thần hướng Nam, Tài Thần hướng Tây (ghi ngắn như xemngay.com, lichviet.me; licham.vn ghi "Chính Nam").

### 4.6. Tuổi xung khắc

17. Hiện **Xung ngày**: danh sách tuổi (Can Chi) xung với ngày, ví dụ "Canh Thân, Bính Thân, Bính Dần".
18. Hiện **Xung tháng**: danh sách tuổi xung với **Can Chi của tháng âm** (dùng `monthCanChi` đã có), ví dụ tháng Đinh Dậu: "Ất Mão, Quý Mão, Quý Tỵ, Quý Hợi". licham.vn không ghi xung tháng, nên dùng cùng bảng xung ngày của licham.vn, tra theo Can Chi của tháng.
19. Hai danh sách phải lấy từ **bảng tĩnh 60 dòng** (một dòng cho mỗi Can Chi), chép từ licham.vn (mục 7.3). Không tự đặt quy tắc riêng. licham.vn để trống 4 dòng (Đinh Tỵ, Kỷ Tỵ, Tân Tỵ, Quý Tỵ); 4 dòng này lấy từ lichviet.me (ghi xung ngày cùng cách với licham.vn). Xung tháng dùng cùng bảng: trùng lichviet.me 18/24 tháng, xemngay.com 14/24 tháng. Dòng Giáp Ngọ sửa "Nhâm Dần" thành "Canh Thân" theo xemngay.com, thoigian.com.vn (xung ngày khớp thoigian.com.vn ở mọi ngày mẫu trừ dòng này).

### 4.7. Sao tốt & Sao xấu

20. Hiện hai nhóm: **Sao tốt (n)** và **Sao xấu (n)**, `n` là số sao. Mỗi sao là một chip bấm được. Chip sao tốt màu xanh lá nhạt, chip sao xấu màu đỏ/cam nhạt.
21. Danh sách sao lấy theo **Ngọc Hạp Thông Thư, bản đầy đủ** (khoảng 100 sao). Mỗi sao có một quy tắc, thuộc một trong các kiểu:
    - theo **tháng âm** và **Chi ngày** (ví dụ Hoàng Sa: tháng 2, 5, 8, 11 gặp ngày Dần);
    - theo **tháng âm** và **Can ngày** hoặc **Can Chi ngày**;
    - theo **trực** hoặc **Nhị thập bát tú** của ngày (ví dụ các sao đi kèm trực);
    - theo **ngày âm** (nếu nguồn có).
22. Quy tắc theo tháng tính theo **tháng âm** (không theo tháng tiết khí), giống `getDayGod`. Tháng nhuận dùng quy tắc của tháng thường cùng số.
    Đối chiếu 730 ngày licham.vn: tính theo tháng âm lệch 0–5 ngày mỗi sao, tính theo tháng tiết khí lệch 10–45 ngày, xác nhận licham.vn dùng tháng âm. Thiên Xá, Âm Thác, Dương Thác dùng bảng gốc (một Can Chi cụ thể), vì licham.vn lấy cả ngày chỉ trùng Can hoặc chỉ trùng Chi.
23. Nếu ngày không có sao tốt (hoặc sao xấu) nào, hiện dòng "Không có" trong nhóm đó.
24. Thứ tự chip trong mỗi nhóm: giữ theo thứ tự trong bảng dữ liệu (để ổn định, không nhảy giữa các lần mở).

### 4.8. Giải thích ngắn khi bấm

25. Bấm vào một **sao tốt/xấu**, **sao Nhị thập bát tú** hoặc **trực** thì mở một hộp giải thích:
    - Dùng lại component `Modal` cỡ `sm`: máy tính là hộp nhỏ giữa màn hình, điện thoại (≤ 640px) tự thành bottom sheet.
26. Nội dung hộp: tên, nhãn tốt/xấu, 1–3 câu ý nghĩa, và (nếu có) "Nên làm" / "Nên kiêng".
27. Đóng bằng nút đóng, bấm ra ngoài, hoặc phím Esc. Đóng xong trả focus về chip vừa bấm.
28. Mọi nội dung giải thích là văn bản tĩnh trong mã nguồn, viết bằng tiếng Việt có dấu.

### 4.9. Giờ trong ngày

29. Hiện **đủ 12 khung giờ**, đúng thứ tự: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi.
30. Mỗi khung giờ hiện:
    - Tên giờ và khoảng giờ, ví dụ "Tý 23h–1h".
    - Can Chi của giờ, ví dụ "Canh Tý". Dùng `hourCanChi(jd, chi)` đã có.
    - Tên thần trực giờ, ví dụ "Thanh Long".
31. Giờ tốt (6 giờ hoàng đạo) **màu xanh lá**. Giờ xấu (6 giờ hắc đạo) **màu xám**. Màu không phải cách duy nhất để phân biệt: giờ tốt có thêm biểu tượng hoặc chữ "Tốt" để người mù màu và trình đọc màn hình nhận biết được.
32. Nếu đang xem **hôm nay**, khung giờ hiện tại (theo giờ Việt Nam) phải được **đánh dấu** (viền màu nhấn và nhãn "Bây giờ"). Tự chuyển sang khung kế tiếp khi hết giờ, không cần refresh (dùng `useNow`).
33. Giờ Tý (23h–1h): từ 23h–24h vẫn thuộc ngày đang xem, giống cách `getAuspiciousHours` đang tính. Khoảng 0h–1h của ngày hôm sau đánh dấu "Bây giờ" ở giờ Tý của **ngày hôm sau**.
34. Xem ngày khác hôm nay thì không đánh dấu giờ nào.

### 4.10. Dữ liệu mẫu (để kiểm tra)

35. Ngày **25/9/2026** (15/8 âm lịch, năm Bính Ngọ) phải hiện đúng các giá trị ở Phụ lục A. Đây là một test case bắt buộc.

## 5. Ngoài phạm vi (Non-Goals)

- **Không** gọi API hay tải dữ liệu lúc chạy. Không có chế độ "tải thêm dữ liệu".
- **Không** xem tuổi riêng theo năm sinh người dùng (ví dụ "ngày này có hợp tuổi tôi không").
- **Không** có tìm ngày tốt ("tìm ngày cưới trong tháng này") hay lọc ngày theo sao/trực.
- **Không** hiện các thông tin mới ở xem Tuần, xem Tháng, trang Danh sách sự kiện, hay trong nhắc nhở.
- **Không** thêm công tắc riêng trong Cài đặt; dùng chung `showAuspicious`.
- **Không** có nút thu gọn khối "Lịch vạn niên".
- **Không** hỗ trợ ngôn ngữ khác ngoài tiếng Việt.
- **Không** đổi cách tính ngày hoàng đạo và giờ hoàng đạo đang có.

## 6. Thiết kế (Design Considerations)

- Theo phong cách kính kiểu iOS đang dùng (`src/styles/theme.css`): khối `glass`, bo góc `--radius-lg`, màu nhấn `--accent`, chữ phụ `--text-muted`.
- Khối "Lịch vạn niên" chia thành các **nhóm con** có tiêu đề nhỏ (`h3`), theo thứ tự ở mục 1. Mỗi nhóm là một danh sách nhãn và giá trị (`dl`), nhãn bên trái nhạt, giá trị bên phải đậm, kiểu "inset grouped" của iOS Settings.
- Nhãn **Cát Tú / Hung Tú** và cát/hung của trực dùng dạng viên thuốc nhỏ có màu, giống các `tag` trong `DayCard`.
- **Giờ trong ngày:** lưới 3 cột trên điện thoại, 4 hoặc 6 cột trên máy tính. Mỗi ô: tên giờ và khoảng giờ (dòng 1, đậm), Can Chi giờ và tên thần (dòng 2, nhỏ). Ô giờ tốt nền xanh lá nhạt, chữ xanh lá đậm. Ô giờ xấu chữ `--text-muted`. Ô "Bây giờ" có viền `--accent` 2px.
- Thêm biến màu cho xanh lá tốt / xám xấu / đỏ xấu vào `theme.css` (có bản cho chế độ tối), đủ tương phản AA.
- Chip sao và nút mở giải thích phải có vùng bấm tối thiểu 44×44px (có thể dùng padding).
- Hỗ trợ chế độ sáng/tối và "Giảm trong suốt".
- Truy cập:
  - Khối là `section` có `aria-label="Lịch vạn niên"`, tiêu đề nhóm là `h3`.
  - Mỗi ô giờ có nhãn đọc màn hình đầy đủ, ví dụ "Giờ Tý, 23 giờ đến 1 giờ, Canh Tý, Thanh Long, giờ tốt, bây giờ".
  - Chip sao là `button` có `aria-haspopup="dialog"`.

## 7. Kỹ thuật (Technical Considerations)

### 7.1. Tổ chức mã

- Toàn bộ logic tính toán đặt trong `shared/lunar/`, là **hàm thuần**, không phụ thuộc React. Mỗi nhóm một file để dễ test và dễ thay nguồn:
  - `napAm.ts`: bảng 60 Hoa Giáp và `getNapAm(canChi)`.
  - `elements.ts`: ngũ hành của Can/Chi, `getCanChiRelation(canChi)`.
  - `mansions.ts`: bảng 28 tú, `getMansion(jd)`.
  - `officers.ts`: 12 trực, `getOfficer(jd)` (cần Chi của tháng tiết khí, lấy từ `getSolarTerm`).
  - `directions.ts`: `getTravelDirections(dayCan)`.
  - `clashes.ts`: bảng xung 60 dòng, `getDayClashes(canChi)`, `getMonthClashes(canChi)`.
  - `stars.ts` và `stars.data.ts`: bảng Ngọc Hạp Thông Thư và `getStars(lunar, canChi, officer, mansion)` trả về `{ good: Star[], bad: Star[] }`.
  - Sửa `auspicious.ts`: thêm `getAllHours(jd, dayChi)` trả về đủ 12 giờ, mỗi giờ có `{ chi, name, startHour, endHour, canChi, god, isGood }`. Giữ `getAuspiciousHours` (lọc từ hàm mới) cho các chỗ đang dùng.
- Thêm hàm gom `getAlmanac(date: SolarDateString): Almanac` trong `shared/lunar/almanac.ts`, dùng lại `getDayInfo(date)` rồi tính thêm. Cache giống `getDayInfo` (giới hạn khoảng 2000 ngày). **Không** nhét thêm vào `DayInfo`, vì `getDayInfo` được gọi cho mọi ô của xem Tháng; phần lịch vạn niên chỉ cần ở xem Ngày.
- Bảng dữ liệu viết dạng mảng/đối tượng TypeScript `as const`, có kiểu rõ ràng. Mỗi file ghi rõ nguồn tham chiếu ở đầu file, giống `auspicious.ts`.
- Giao diện: component mới `src/views/DayView/AlmanacPanel.tsx` (+ `.module.css`), con: `HourGrid`, `StarChips`, `AlmanacExplain` (popover/sheet). `DayView` truyền `date`, `isToday`; `AlmanacPanel` tự gọi `getAlmanac(date)` trong `useMemo`.

### 7.2. Nguồn dữ liệu cho từng mục

| Mục | Cách lấy | Đã có trong code? |
|---|---|---|
| Tiết khí | `getSolarTerm(jd)` | Có |
| Can Chi ngày/tháng/giờ | `dayCanChi`, `monthCanChi`, `hourCanChi` | Có |
| Niên mệnh (nạp âm) | Bảng 60 Hoa Giáp (30 cặp), kiến thức phổ thông, không có dị bản | Chưa |
| Quan hệ Can Chi | Công thức ngũ hành (yêu cầu 8) | Chưa |
| Nhị thập bát tú | Công thức `(jd + 11) mod 28` và bảng Phụ lục B | Chưa |
| Thập nhị trực | Công thức theo tháng tiết khí (yêu cầu 13) và bảng nên/kiêng | Chưa |
| Hỷ Thần, Tài Thần | Bảng 10 dòng theo Can ngày (Phụ lục C) | Chưa |
| Xung ngày, xung tháng | Bảng 60 dòng, chép từ nguồn tham chiếu | Chưa |
| Sao tốt, sao xấu | Bảng Ngọc Hạp Thông Thư, chép từ nguồn tham chiếu | Chưa |
| Thần trực giờ, giờ tốt | `TWELVE_GODS` và logic trong `getAuspiciousHours` | Có một phần |

### 7.3. Nguồn tham chiếu và cách đối chiếu

- **Thuật toán âm lịch:** Hồ Ngọc Đức (đang dùng trong `shared/lunar/lunar.ts`).
- **Bảng tra (xung tuổi, sao Ngọc Hạp, nên/kiêng của trực, 28 tú, Hỷ/Tài Thần):** nguồn chính là **licham.vn**. Khi licham.vn khác công thức hoặc bảng trong PRD này, **theo licham.vn** và sửa bảng/phụ lục cho khớp. Nguồn phụ để soát lỗi chép: lichvannien365.com. Không dùng nguồn phụ để thay giá trị của licham.vn.
- **Thư viện tham khảo:** `lunar-javascript` (6tail, giấy phép MIT) có 28 tú, hướng Hỷ/Tài Thần, xung sát, thần sát. **Chỉ dùng để tham khảo thuật toán**, không import: thư viện này theo quy ước Trung Quốc (thần sát tính theo tháng tiết khí, tên chữ Hán), khác cách lịch Việt Nam đang dùng trong app.
- **Bộ ngày đối chiếu:** chọn ít nhất 20 ngày trải đều (có ngày tháng nhuận, ngày đầu tiết khí, ngày giáp Tết, năm 1900 và 2100), lấy giá trị từ licham.vn, lưu thành fixture `shared/lunar/almanac.fixtures.ts`. Test so từng trường.
- Dữ liệu thô (sao Ngọc Hạp, giải thích) có thể soạn bằng script một lần rồi **kiểm lại bằng tay**; kết quả cuối là file TypeScript tĩnh trong repo. Không chép nguyên văn dài từ trang web có bản quyền; giải thích sao tự viết lại ngắn gọn.

### 7.4. Hiệu năng

- `getAlmanac` chỉ chạy cho ngày đang xem (và có thể 2 ngày kề bên nếu có vuốt). Bảng sao khoảng 100 dòng, mỗi dòng kiểm tra O(1), nên dưới 1ms.
- Bảng dữ liệu nằm trong bundle chính (vài chục KB trước khi nén). Nếu bundle tăng quá 30KB (gzip), tách `stars.data.ts` bằng `import()` động và hiện khung chờ trong nhóm "Sao tốt & Sao xấu".

### 7.5. Test

- Unit test cho từng hàm trong mục 7.1, gồm:
  - Ngày mẫu 25/9/2026 khớp Phụ lục A.
  - Bộ fixture 20 ngày khớp licham.vn.
  - Nạp âm đủ 60 Can Chi, 28 tú quay vòng đúng sau 28 ngày, 12 trực đổi đúng ở ngày đầu tiết (trực lặp lại một ngày khi sang tiết mới).
  - `getAllHours` trả đúng 12 giờ, đúng 6 giờ tốt, khớp với `getAuspiciousHours` cũ.
- Test component `AlmanacPanel`: ẩn khi `showAuspicious = false`; đánh dấu "Bây giờ" đúng giờ khi là hôm nay (giả lập thời gian), không đánh dấu khi xem ngày khác; bấm chip sao mở hộp giải thích, Esc đóng và trả focus.
- E2E (Playwright, `desktop` và `iphone`): mở xem Ngày 25/9/2026, thấy "Thu phân", "Kim Bạch Kim", sao "Ngưu", Hỷ Thần "Nam"; bấm chip "Thiên đức" thấy giải thích.
- Thêm xem Ngày có khối mới vào `e2e/a11y.spec.ts` (sáng và tối).

## 8. Chỉ số thành công (Success Metrics)

- 100% trường khớp với bộ fixture 20 ngày (lấy từ licham.vn) và ngày mẫu (unit test).
- Không có lỗi WCAG AA (axe) ở xem Ngày, cả sáng và tối.
- `getAlmanac` dưới 5ms mỗi ngày (đo trong test hiệu năng đơn giản hoặc thủ công trên iPhone Safari).
- Bundle chính tăng không quá 30KB (gzip).
- Không có báo lỗi "sai ngày tốt xấu so với lịch X" trong tháng đầu sau khi phát hành (theo dõi thủ công qua phản hồi).

## 9. Câu hỏi còn mở (Open Questions)

Đã trả lời và đưa vào PRD:

- Vị trí: luôn mở sẵn, dưới `DayCard` (mục 4.1).
- Sao tốt/xấu: bản đầy đủ Ngọc Hạp Thông Thư (mục 4.7).
- Giờ: tên, khoảng giờ, Can Chi giờ, thần, đánh dấu giờ hiện tại (mục 4.9).
- Bật/tắt: dùng chung `showAuspicious` (mục 4.1).
- Có thêm Thập nhị trực, việc nên/kiêng và giải thích khi bấm (mục 4.4, 4.8).
- Thứ tự khối: "Sự kiện trong ngày" trước "Lịch vạn niên" (yêu cầu 2).
- Nguồn chuẩn: licham.vn (mục 7.3).
- Sao Ngọc Hạp tính theo tháng âm (yêu cầu 22).
- Ngũ hành 28 tú quy về 5 hành: Thái Dương là Hỏa, Thái Âm là Thủy (yêu cầu 9).

Hiện không còn câu hỏi mở.

## Phụ lục A. Dữ liệu mẫu: 25/9/2026 (15/8 Bính Ngọ)

Dùng làm test case bắt buộc (yêu cầu 35). Các giá trị có dấu \* đã khớp với code hiện có hoặc công thức trong PRD. Các giá trị còn lại phải xác nhận lại với licham.vn.

**Tiết Khí & Ngũ Hành**

| Nhãn | Giá trị |
|---|---|
| Tiết khí | Thu phân \* |
| Niên mệnh | Kim Bạch Kim \* (licham.vn ghi "Kim Bạc Kim") |
| Ngày Can Chi | Nhâm Dần \* |
| Quan hệ Can Chi | Can sinh Chi (Thủy sinh Mộc), là ngày cát (bảo nhật). \* |

**Nhị Thập Bát Tú:** Hung Tú. Sao Ngưu \*, ngũ hành Kim, động vật Ngưu (Trâu).

**Thập Nhị Trực:** Trực Chấp \*.

**Hướng Xuất Hành:** Hỷ Thần: Nam \*. Tài Thần: Tây \*.

**Tuổi Xung Khắc**

- Xung ngày: Canh Thân, Bính Thân, Bính Dần
- Xung tháng (Đinh Dậu): Ất Mão, Quý Mão, Quý Tỵ, Quý Hợi (data mẫu ban đầu có thêm Quý Dậu, lấy từ nguồn khác)

**Sao Tốt & Sao Xấu**

- Sao tốt (3): Thiên Đức, Giải Thần, Thanh Long Hoàng Đạo (data mẫu ban đầu có thêm "Sát cống" từ xemngay.com; licham.vn không có sao này)
- Sao xấu (2): Kiếp Sát, Hoàng Sa

**Giờ Trong Ngày** (ngày Dần: Thanh Long của giờ khởi ở giờ Tý)

| Giờ | Khoảng | Thần | Tốt/Xấu |
|---|---|---|---|
| Tý | 23h–1h | Thanh Long | Tốt |
| Sửu | 1h–3h | Minh Đường | Tốt |
| Dần | 3h–5h | Thiên Hình | Xấu |
| Mão | 5h–7h | Chu Tước | Xấu |
| Thìn | 7h–9h | Kim Quỹ | Tốt |
| Tỵ | 9h–11h | Kim Đường | Tốt |
| Ngọ | 11h–13h | Bạch Hổ | Xấu |
| Mùi | 13h–15h | Ngọc Đường | Tốt |
| Thân | 15h–17h | Thiên Lao | Xấu |
| Dậu | 17h–19h | Huyền Vũ | Xấu |
| Tuất | 19h–21h | Tư Mệnh | Tốt |
| Hợi | 21h–23h | Câu Trận | Xấu |

Can Chi của giờ lấy từ `hourCanChi(jd, chi)`; test phải ghi rõ giá trị sau khi chạy hàm và đối chiếu với licham.vn.

## Phụ lục B. Bảng Nhị thập bát tú

`index = (jd + 11) mod 28`. Thái Dương quy về Hỏa, Thái Âm quy về Thủy (yêu cầu 9). Cần đối chiếu cột "Ngũ hành" và "Cát/Hung" với licham.vn.

| # | Sao | Ngũ hành | Động vật | Cát/Hung |
|---|---|---|---|---|
| 0 | Giác | Mộc | Giao (Thuồng luồng) | Cát |
| 1 | Cang | Kim | Long (Rồng) | Hung |
| 2 | Đê | Thổ | Lạc (Lạc đà) | Hung |
| 3 | Phòng | Hỏa | Thố (Thỏ) | Cát |
| 4 | Tâm | Thủy | Hồ (Cáo) | Hung |
| 5 | Vĩ | Hỏa | Hổ (Cọp) | Cát |
| 6 | Cơ | Thủy | Báo (Beo) | Cát |
| 7 | Đẩu | Mộc | Giải (Cua) | Cát |
| 8 | Ngưu | Kim | Ngưu (Trâu) | Hung |
| 9 | Nữ | Thổ | Bức (Dơi) | Hung |
| 10 | Hư | Hỏa | Thử (Chuột) | Hung |
| 11 | Nguy | Thủy | Yến (Chim én) | Hung |
| 12 | Thất | Hỏa | Trư (Heo) | Cát |
| 13 | Bích | Thủy | Du (Rái cá) | Cát |
| 14 | Khuê | Mộc | Lang (Sói) | Hung |
| 15 | Lâu | Kim | Cẩu (Chó) | Cát |
| 16 | Vị | Thổ | Trĩ (Chim trĩ) | Cát |
| 17 | Mão | Hỏa | Kê (Gà) | Hung |
| 18 | Tất | Thủy | Ô (Quạ) | Cát |
| 19 | Chủy | Hỏa | Hầu (Khỉ) | Hung |
| 20 | Sâm | Thủy | Viên (Vượn) | Cát |
| 21 | Tỉnh | Mộc | Hãn (Bò rừng) | Cát |
| 22 | Quỷ | Kim | Dương (Dê) | Hung |
| 23 | Liễu | Thổ | Chương (Hoẵng) | Hung |
| 24 | Tinh | Hỏa | Mã (Ngựa) | Hung |
| 25 | Trương | Thủy | Lộc (Hươu) | Cát |
| 26 | Dực | Hỏa | Xà (Rắn) | Hung |
| 27 | Chẩn | Thủy | Dẫn (Giun) | Cát |

## Phụ lục C. Hướng Hỷ Thần và Tài Thần theo Can ngày

| Can ngày | Hỷ Thần | Tài Thần |
|---|---|---|
| Giáp | Đông Bắc | Đông Nam |
| Ất | Tây Bắc | Đông Nam |
| Bính | Tây Nam | Đông |
| Đinh | Nam | Đông |
| Mậu | Đông Nam | Bắc |
| Kỷ | Đông Bắc | Nam |
| Canh | Tây Bắc | Tây Nam |
| Tân | Tây Nam | Tây Nam |
| Nhâm | Nam | Tây |
| Quý | Đông Nam | Tây |

Đã đối chiếu với licham.vn (2025–2026). Riêng Tài Thần ngày Mậu: licham.vn ghi Nam, còn xemngay.com, lichviet.me, thoigian.com.vn đều ghi Bắc; app dùng Bắc.
