# PRD: Trang Danh sách sự kiện (calendar-hana)

## 1. Giới thiệu / Tổng quan

Hiện tại người dùng chỉ xem sự kiện theo từng ngày, tuần hoặc tháng. Muốn biết "sắp tới có những việc gì" hay "tháng trước đã có những sự kiện nào" thì phải bấm chuyển qua lại nhiều lần. Ô Tìm kiếm chỉ trả về một lần gần nhất của mỗi sự kiện, không cho thấy toàn cảnh.

Tính năng này thêm một **trang riêng `/events`** hiển thị **tất cả sự kiện dạng danh sách**, cuộn liên tục cả về quá khứ lẫn tương lai. Danh sách được **nhóm theo tháng, trong tháng nhóm theo ngày**. Mỗi ngày luôn ghi sẵn **ngày dương và ngày âm**. Trên trang có lọc theo danh mục, tìm theo từ khoá, và chọn nhiều sự kiện để xoá cùng lúc.

**Mục tiêu:** Người dùng nhìn một chỗ là thấy toàn bộ lịch trình (đã qua và sắp tới) kèm ngày âm, và dọn dẹp nhiều sự kiện nhanh mà không phải mở từng cái.

## 2. Mục tiêu (Goals)

1. Từ lịch, người dùng mở được trang Danh sách trong tối đa 2 lần bấm.
2. Lần đầu mở trang trong phiên, danh sách tự cuộn tới **hôm nay**. Quay lại trang trong cùng phiên thì về đúng chỗ đang xem lần trước.
3. Mọi ngày trong danh sách hiển thị đúng ngày dương và ngày âm, giống cách hiện ở các chế độ xem khác.
4. Sự kiện lặp lại hiện **từng lần** đúng ngày (kể cả lặp theo âm lịch), khớp với xem Ngày/Tuần/Tháng.
5. Xoá được 10 sự kiện cùng lúc trong dưới 15 giây.
6. Cuộn mượt (không giật, không nhảy vị trí) khi danh sách có trên 1.000 dòng.

## 3. User Stories

- **US-L1:** Là người dùng, tôi muốn mở một trang thấy **tất cả sự kiện theo thứ tự thời gian**, để biết sắp tới có việc gì mà không phải lật từng tháng.
- **US-L2:** Là người dùng, tôi muốn **cuộn lên để xem sự kiện đã qua**, cuộn xuống để xem sự kiện sắp tới.
- **US-L3:** Là người dùng, tôi muốn mỗi ngày trong danh sách ghi sẵn **ngày dương và ngày âm** (ví dụ "Thứ Tư, 23/9/2026 · 13/8 âm lịch"), để khỏi phải tra.
- **US-L4:** Là người dùng, tôi muốn thấy **từng lần** của giỗ hằng năm, rằm hằng tháng, họp hằng tuần, để biết chính xác các ngày sẽ diễn ra.
- **US-L5:** Là người dùng, tôi muốn **lọc theo danh mục** (ví dụ chỉ xem Giỗ/Lễ), để tập trung vào một loại việc.
- **US-L6:** Là người dùng, tôi muốn **tìm theo từ khoá** ngay trên danh sách (ví dụ "giỗ"), gõ không dấu vẫn ra.
- **US-L7:** Là người dùng, tôi muốn **chọn nhiều sự kiện rồi xoá một lần**, để dọn các việc cũ hoặc tạo nhầm.
- **US-L8:** Là người dùng, tôi muốn bấm vào một sự kiện trong danh sách để **mở chi tiết** (xem, sửa, xoá) như ở các màn hình khác.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Vào trang và điều hướng

1. Hệ thống phải có trang mới tại địa chỉ **`/events`**, tiêu đề **"Danh sách sự kiện"**.
2. Trong Menu (sidebar trên máy tính, sheet Menu trên điện thoại) phải có mục **"Danh sách sự kiện"** dẫn tới `/events`.
3. Trang phải có nút **quay lại lịch** ở góc trên bên trái, giống trang Cài đặt.
4. Trang phải có nút **"Hôm nay"** để cuộn về nhóm ngày hôm nay.
5. Refresh trang `/events` phải mở lại đúng trang này (không quay về lịch).

### 4.2. Nội dung danh sách

6. Danh sách phải gồm **các lần diễn ra** của mọi sự kiện, sắp theo ngày tăng dần. Trong cùng một ngày: sự kiện cả ngày trước, sau đó sự kiện có giờ theo giờ bắt đầu (dùng cùng thứ tự với xem Ngày).
7. Sự kiện lặp lại phải được **bung ra từng lần**, mỗi lần một dòng nằm dưới ngày tương ứng. Các lần đã bị xoá riêng (exception `deleted`) không được hiện. Các lần đã sửa riêng phải hiện nội dung đã sửa.
8. Danh sách phải **cuộn cả hai chiều**:
   - Khi mở trang, tải sẵn khoảng từ **3 tháng trước** đến **6 tháng sau** hôm nay.
   - Khi cuộn gần tới **cuối** danh sách, tự tải thêm **3 tháng** tiếp theo.
   - Khi cuộn gần tới **đầu** danh sách, tự tải thêm **3 tháng** trước đó. Vị trí đang xem **không được nhảy** khi phần mới chèn vào phía trên.
   - Dừng tải khi chạm giới hạn app hỗ trợ (năm 1900 và năm 2100). Khi đó hiện dòng "Đã hết sự kiện" ở đầu/cuối tương ứng.
9. Lần đầu mở trang trong phiên (chưa có vị trí đã lưu, xem mục 4.8), danh sách phải tự cuộn tới nhóm **hôm nay**. Nếu hôm nay không có sự kiện, vẫn hiện nhóm hôm nay với dòng "Không có sự kiện" để người dùng biết mình đang ở đâu.
10. Danh sách phải tự cập nhật khi dữ liệu thay đổi (tạo, sửa, xoá ở màn hình khác hoặc đồng bộ từ cloud), không cần refresh.

### 4.3. Nhóm theo tháng và ngày

11. Danh sách phải được **nhóm theo tháng dương**. Tiêu đề tháng hiển thị cả tháng dương và (các) tháng âm tương ứng, ví dụ:
    **"Tháng 9/2026"** và dòng phụ **"Tháng 7–8 âm lịch, năm Bính Ngọ"** (dùng lại `formatMonthTitleParts` trong `shared/format.ts`).
12. Trong mỗi tháng, sự kiện phải được **nhóm theo ngày**. Tiêu đề ngày hiển thị:
    - Ngày dương: thứ và ngày/tháng/năm, ví dụ "Thứ Tư, 23/9/2026" (`formatSolar`).
    - Ngày âm: ví dụ "13/8 âm lịch", tháng nhuận ghi "10/4 nhuận âm lịch" (`formatLunar`).
13. Chỉ hiện các ngày **có sự kiện** (trừ nhóm hôm nay, xem yêu cầu 9). Tháng không có sự kiện nào thì **ẩn** luôn tiêu đề tháng đó.
14. Tiêu đề tháng phải **dính ở đầu màn hình** (sticky) khi cuộn, để người dùng luôn biết đang xem tháng nào.
15. Nhóm ngày **hôm nay** phải được làm nổi bật (ví dụ nhãn "Hôm nay" và màu nhấn). Chủ nhật hiển thị chữ màu đỏ như các màn hình khác.
16. Các ngày **đã qua** hiển thị nhạt hơn một chút so với ngày sắp tới (vẫn phải đủ tương phản WCAG AA).

### 4.4. Dòng sự kiện

17. Mỗi dòng sự kiện phải hiển thị:
    - Chấm màu của danh mục.
    - Tiêu đề sự kiện.
    - Thời gian: "Cả ngày" hoặc "09:00 – 10:00" (chỉ giờ bắt đầu nếu không có giờ kết thúc).
    - Tên danh mục.
    - Biểu tượng lặp lại nếu là sự kiện lặp, và nhãn "Âm lịch" nếu sự kiện được tạo theo ngày âm.
    - Địa điểm (nếu có), một dòng, cắt bằng "…" khi quá dài.
18. Bấm vào một dòng (khi **không** ở chế độ chọn) phải mở **chi tiết sự kiện** của đúng lần đó (dùng `openDetail` và các dialog hiện có trong `EventDialogs`). Sửa/xoá từ đây hoạt động như ở xem Ngày.

### 4.5. Lọc theo danh mục

19. Phía trên danh sách phải có hàng **chip danh mục** (cuộn ngang trên điện thoại). Mỗi chip có chấm màu và tên danh mục; bấm để bật/tắt.
20. Bộ lọc danh mục **chỉ áp dụng cho trang này** và **không được lưu**:
    - Mỗi lần mở trang, mọi danh mục đều bật (kể cả danh mục đang bị ẩn ở sidebar).
    - Bật/tắt chip trên trang này **không** thay đổi `settings.hiddenCategoryIds`, nên lịch Ngày/Tuần/Tháng không bị ảnh hưởng.
    - Rời trang rồi quay lại thì bộ lọc trở về mặc định (bật tất cả).
21. Khi mọi danh mục đều bị tắt, hiện thông báo "Đang ẩn tất cả danh mục" kèm nút "Hiện tất cả".

### 4.6. Tìm theo từ khoá

22. Phía trên danh sách phải có **ô tìm kiếm** với placeholder "Tìm theo tiêu đề, ghi chú, địa điểm".
23. Khi có từ khoá, danh sách chỉ giữ các dòng có tiêu đề, ghi chú hoặc địa điểm chứa **tất cả** các từ đã gõ, **không phân biệt hoa thường và dấu** ("gio" khớp "Giỗ"). Dùng lại hàm `normalizeText` và cách so khớp trong `src/components/SearchPanel/search.ts`.
24. Tìm kiếm kết hợp với lọc danh mục (phải thoả cả hai).
25. Việc cuộn và tự tải thêm (yêu cầu 8) vẫn hoạt động khi đang tìm.
26. Khi có từ khoá, phải hiện số kết quả trong khoảng đã tải, ví dụ "12 kết quả", đọc được bằng trình đọc màn hình (`aria-live="polite"`). Nếu khoảng đã tải không có kết quả, hiện "Không tìm thấy trong khoảng đã tải" và nút **"Tìm xa hơn"** để tải thêm 12 tháng mỗi chiều.
27. Xoá hết từ khoá thì danh sách trở lại bình thường và giữ vị trí cuộn quanh ngày đang xem.

### 4.7. Chọn nhiều và xoá cùng lúc

28. Trên thanh tiêu đề phải có nút **"Chọn"**. Bấm vào thì vào **chế độ chọn**:
    - Mỗi dòng sự kiện hiện ô chọn tròn (dùng class `.check` có sẵn) ở bên trái.
    - Bấm vào dòng thì bật/tắt chọn dòng đó (không mở chi tiết).
    - Nút "Chọn" đổi thành **"Xong"** để thoát chế độ chọn và bỏ chọn tất cả.
29. Ở chế độ chọn phải có **thanh công cụ dưới đáy** gồm:
    - Số dòng đã chọn, ví dụ "Đã chọn 3".
    - Nút **"Chọn tất cả"**: chọn mọi dòng **đang hiển thị** (sau khi lọc và tìm), không chọn các dòng chưa tải.
    - Nút **"Xoá"** (màu đỏ), bị vô hiệu khi chưa chọn dòng nào.
30. Bấm "Xoá" phải mở hộp xác nhận (dùng `ConfirmDialog`), ghi rõ: "Xoá N sự kiện? Không thể hoàn tác." Nếu trong số đã chọn có lần của sự kiện lặp, ghi thêm: "Với sự kiện lặp lại, chỉ xoá các lần đã chọn; các lần khác vẫn giữ."
31. Khi xác nhận:
    - Sự kiện **không lặp**: xoá hẳn sự kiện.
    - Lần của sự kiện **lặp**: chỉ xoá **đúng lần đó** (phạm vi `single`, tức thêm exception `deleted`).
    - Nếu chọn **nhiều lần của cùng một sự kiện lặp**, phải gộp tất cả vào **một** lần lưu sự kiện đó (thêm nhiều exception cùng lúc). Không được lưu lần lượt từng lần, vì lần lưu sau sẽ ghi đè lần trước và làm mất exception.
    - Nếu đã chọn **mọi lần** của một sự kiện lặp có số lần hữu hạn thì xoá hẳn sự kiện đó.
32. Trong lúc xoá, nút "Xoá" phải bị vô hiệu và hiện trạng thái đang xử lý. Xoá xong thì thoát chế độ chọn và hiện thông báo ngắn "Đã xoá N sự kiện".
33. Nếu xoá lỗi (ví dụ lỗi ghi Firestore), phải báo lỗi rõ ràng, giữ nguyên các dòng chưa xoá được và vẫn ở chế độ chọn để người dùng thử lại.
34. Xoá cùng lúc phải hoạt động cả khi **offline** và khi dùng dữ liệu local (chưa đăng nhập), giống xoá từng sự kiện hiện nay.
35. Các nhắc hẹn của lần/sự kiện đã xoá không được gửi nữa (repository và ReminderService hiện có đã xử lý khi sự kiện đổi; cần kiểm tra lại).

### 4.8. Lưu vị trí cuộn

36. Khi rời trang (ví dụ quay lại lịch, vào Cài đặt), hệ thống phải lưu **vị trí đang xem**: ngày dương của nhóm ngày đang nằm ở đầu màn hình, và khoảng ngày đã tải.
37. Quay lại `/events` trong **cùng phiên** (cùng tab trình duyệt, kể cả khi refresh) phải tải lại khoảng ngày đó và cuộn về đúng nhóm ngày đã lưu, không phải về hôm nay.
38. Nếu ngày đã lưu không còn sự kiện nào (ví dụ vừa bị xoá), cuộn tới nhóm ngày gần nhất sau ngày đó.
39. Đóng tab rồi mở lại (phiên mới) thì bắt đầu lại từ hôm nay.
40. Nút "Hôm nay" luôn cuộn về hôm nay, bất kể vị trí đã lưu.
41. Chỉ lưu vị trí cuộn. Từ khoá tìm kiếm, bộ lọc danh mục và các dòng đang chọn **không** được lưu; quay lại trang thì các thứ này về mặc định.

### 4.9. Trạng thái rỗng và đang tải

42. Khi đang tải dữ liệu lần đầu, hiện khung chờ (skeleton) thay vì trang trắng.
43. Khi người dùng chưa có sự kiện nào, hiện "Chưa có sự kiện nào" và nút **"Tạo sự kiện"** (mở form tạo như nút +).

## 5. Ngoài phạm vi (Non-Goals)

- **Không** thay thế ô Tìm kiếm hiện có; ô đó vẫn hoạt động như cũ.
- **Không** thêm chế độ xem thứ tư trong nhóm Ngày / Tuần / Tháng, và không thêm tab mới ở thanh tab dưới đáy.
- **Không** sửa nhiều sự kiện cùng lúc (đổi danh mục, dời ngày...). Chỉ hỗ trợ xoá.
- **Không** xoá "toàn bộ chuỗi lặp" hay "lần này và các lần sau" từ chế độ chọn nhiều; muốn vậy thì mở chi tiết sự kiện.
- **Không** có hoàn tác (undo) sau khi xoá; thay bằng hộp xác nhận.
- **Không** hiển thị ngày lễ, tiết khí, ngày hoàng đạo trong danh sách (các thông tin này vẫn có ở xem Ngày).
- **Không** xuất danh sách ra file hoặc in.
- **Không** có nút "Chọn tất cả trong tháng"; chỉ có "Chọn tất cả" các dòng đang hiển thị.
- **Không** tìm kiếm trên toàn bộ khoảng 1900–2100; chỉ tìm trong khoảng đã tải, kèm nút "Tìm xa hơn".
- **Không** lưu bộ lọc danh mục của trang Danh sách, và bộ lọc này không ảnh hưởng tới lịch.

## 6. Thiết kế (Design Considerations)

- Theo phong cách kính (glass) kiểu iOS đang dùng (`src/styles/theme.css`): panel `--radius-lg`, nút dạng viên thuốc, màu nhấn `--accent`.
- Bố cục tham khảo màn **Lịch trình (List)** của iOS Calendar:
  - Thanh tiêu đề kính nổi phía trên: nút quay lại · "Danh sách sự kiện" · nút "Chọn"/"Xong".
  - Dưới đó: ô tìm kiếm, rồi hàng chip danh mục.
  - Tiêu đề tháng sticky, chữ lớn, đậm; dòng tháng âm nhỏ, màu `--text-muted`.
  - Tiêu đề ngày: ngày dương đậm bên trái, ngày âm nhỏ và nhạt (`--text-lunar`) bên phải hoặc ngay dưới.
  - Các dòng sự kiện của một ngày nằm chung trong một nhóm bo góc kiểu "inset grouped", có vạch ngăn giữa các dòng.
- Trên điện thoại (≤ 720px): chiếm toàn chiều rộng (lề 8px), tôn trọng `env(safe-area-inset-*)`. Thanh công cụ chế độ chọn nổi ở đáy, dạng viên kính giống thanh tab.
- Trên máy tính: nội dung giới hạn chiều rộng khoảng 720px, căn giữa, giống trang Cài đặt.
- Ô chọn nhiều, dòng sự kiện, chip danh mục phải có vùng bấm tối thiểu 44×44px.
- Hỗ trợ chế độ sáng/tối và "Giảm trong suốt" như phần còn lại của app.
- Truy cập:
  - Tiêu đề tháng là `h2`, tiêu đề ngày là `h3`, danh sách dùng `ul`/`li`.
  - Dòng sự kiện có nhãn đọc màn hình gồm tiêu đề, thời gian và ngày đầy đủ (`formatAccessibleDate`).
  - Ở chế độ chọn, mỗi dòng là checkbox có nhãn; dùng được bằng bàn phím (Tab, Space).

## 7. Kỹ thuật (Technical Considerations)

- **Route:** thêm `<Route path="/events" element={<EventListPage />} />` trong `src/App.tsx`, **đặt trước** route `/:view/:date`. Trang đặt tại `src/pages/EventList/`.
- **Lấy dữ liệu:** dùng lại `useEventsInRange(start, end)` **không truyền** `hiddenCategoryIds`, để có các lần diễn ra đã bung và đã sắp xếp của mọi danh mục. Lọc danh mục làm ngay trong trang bằng state cục bộ (`useState<Set<string>>` các danh mục đang tắt), không gọi `repository.saveSettings`. Giữ `start`/`end` trong state; tải thêm là mở rộng khoảng này.
- **Lưu vị trí cuộn:** lưu `{ anchorDate, start, end }` vào `sessionStorage` (khoá ví dụ `event-list:position`) khi rời trang (cleanup của `useEffect`) và khi cuộn (throttle khoảng 300ms, phòng trường hợp refresh). Tìm `anchorDate` bằng cách lấy tiêu đề ngày đầu tiên còn nằm trong vùng nhìn thấy (ví dụ gắn `data-date` lên mỗi nhóm ngày). Khi mở trang: nếu có giá trị hợp lệ thì dùng `start`/`end` đã lưu và cuộn tới `[data-date="anchorDate"]` sau khi render xong; nếu không thì dùng khoảng mặc định và cuộn tới hôm nay. Bọc mọi thao tác `sessionStorage` trong `try/catch`; lỗi thì coi như chưa lưu.
- **Nhóm dữ liệu:** viết hàm thuần (dễ unit test), ví dụ `groupByMonthAndDay(occurrences, today)`, trả về `[{ month, year, days: [{ date, occurrences }] }]`. Có thể dựa trên `groupByDate` đã có trong `useEventsInRange.ts`.
- **Ngày âm:** dùng `getDayInfo(date).lunar` và các hàm trong `shared/format.ts`. Không tự tính lại âm lịch.
- **Cuộn vô hạn:** dùng `IntersectionObserver` trên phần tử "mốc" ở đầu và cuối danh sách. Khi chèn dữ liệu vào **phía trên**, ghi lại `scrollHeight` trước khi render rồi bù `scrollTop` sau khi render (trong `useLayoutEffect`) để không nhảy vị trí. Có thể thay bằng `overflow-anchor` của CSS, nhưng Safari hỗ trợ chưa đầy đủ.
- **Hiệu năng:** bung lặp cho khoảng 9–12 tháng là nhẹ, nhưng sự kiện lặp **hằng ngày** có thể sinh rất nhiều dòng. Nếu danh sách vượt khoảng 1.000 dòng, cân nhắc chỉ render phần gần màn hình (virtualization) hoặc dùng CSS `content-visibility: auto` cho từng nhóm tháng.
- **Xoá cùng lúc:** thêm hàm thuần trong `shared/recurrence/editing.ts`, ví dụ `deleteOccurrences(event, occurrences[])`, gộp nhiều exception `deleted` vào một sự kiện (hoặc trả về `delete` nếu đã hết lần). Thêm `deleteEventOccurrences(repository, selections)` trong `src/data/eventActions.ts`: gom các lựa chọn theo `eventId`, mỗi sự kiện gọi **một** lần `deleteEvent` hoặc `saveEvent`. Phải lấy bản sự kiện **gốc** từ repository (không phải `occurrence.event` đã gộp phần sửa riêng) trước khi thêm exception.
- **Khoá chọn:** định danh một dòng bằng `${eventId}:${occurrenceKey}` (ổn định kể cả khi lần đó bị dời ngày).
- **Tìm kiếm:** tách phần so khớp từ khoá trong `searchEvents` thành hàm dùng chung, ví dụ `matchesQuery(event, words)`, để trang Danh sách và SearchPanel dùng chung.
- **Test:**
  - Unit test: đọc/ghi vị trí đã lưu (có giá trị hỏng hoặc `sessionStorage` lỗi thì bỏ qua), bộ lọc danh mục cục bộ không gọi `saveSettings`.
  - Unit test: hàm nhóm tháng/ngày (có tháng nhuận, ngày dời, nhóm hôm nay rỗng), `deleteOccurrences` (nhiều lần cùng sự kiện, xoá hết các lần của chuỗi có `count`), so khớp từ khoá không dấu.
  - Test component: bấm dòng mở chi tiết; chế độ chọn, chọn tất cả, xác nhận xoá.
  - E2E (Playwright, cả `desktop` và `iphone`): mở `/events` từ Menu, thấy đúng ngày dương/âm của một giỗ âm lịch; xoá 2 lần của sự kiện lặp và kiểm tra xem Tháng không còn 2 lần đó; cuộn tới tháng khác, quay lại lịch rồi mở lại `/events` thì vẫn ở tháng đó.
  - Chạy `e2e/a11y.spec.ts` thêm trang `/events` (sáng và tối).

## 8. Chỉ số thành công (Success Metrics)

- 100% lần diễn ra hiện trong danh sách khớp với xem Ngày/Tuần/Tháng cho cùng khoảng ngày (có test đối chiếu).
- Xoá cùng lúc 10 dòng (gồm lần của sự kiện lặp) không làm mất exception nào (có unit test).
- Không có lỗi WCAG AA trên `/events` (axe) ở cả chế độ sáng và tối.
- Cuộn lên để tải thêm không làm nhảy vị trí đang xem (kiểm tra thủ công trên iPhone Safari và Chrome Android).
- Quay lại trang trong cùng phiên về đúng nhóm ngày đã xem (có test E2E).
- Mở trang và cuộn tới hôm nay trong dưới 1 giây trên điện thoại tầm trung với 500 sự kiện.

## 9. Câu hỏi còn mở (Open Questions)

Các câu hỏi đã được trả lời và đưa vào PRD:

1. Bộ lọc danh mục: chỉ áp dụng cho trang này, không lưu (yêu cầu 20).
2. Không cần nút "Chọn tất cả trong tháng" (Ngoài phạm vi).
3. Không tìm trên toàn bộ 1900–2100; giữ cách tìm trong khoảng đã tải và nút "Tìm xa hơn" (yêu cầu 26).
4. Có lưu vị trí cuộn khi rời trang rồi quay lại (mục 4.8).

Hiện không còn câu hỏi mở.
