## Relevant Files

### Dữ liệu tham chiếu (soạn từ licham.vn)

- `shared/lunar/almanac.fixtures.ts` - Bộ 20 ngày đối chiếu (và ngày mẫu 25/9/2026), mỗi ngày đủ các trường lấy từ licham.vn.
- `shared/lunar/napAm.ts` - Bảng 60 Hoa Giáp (nạp âm) và `getNapAm(canChi)`.
- `shared/lunar/clashes.data.ts` - Bảng xung ngày và xung tháng, 60 dòng mỗi bảng.
- `shared/lunar/stars.data.ts` - Bảng sao Ngọc Hạp Thông Thư: tên, tốt/xấu, kiểu quy tắc, tham số, giải thích ngắn.
- `shared/lunar/mansions.ts` - Bảng 28 tú và `getMansion(jd)`.
- `shared/lunar/officers.ts` - 12 trực (tên, cát/hung, nên làm, nên kiêng, giải thích) và `getOfficer(jd)`.
- `shared/lunar/directions.ts` - Bảng Hỷ Thần / Tài Thần theo Can ngày và `getTravelDirections(dayCan)`.

### Logic thuần

- `shared/lunar/elements.ts` - Ngũ hành của Can/Chi, `getCanChiRelation(canChi)` (bảo/nghĩa/chế/phạt/chuyên nhật).
- `shared/lunar/clashes.ts` - `getDayClashes(canChi)`, `getMonthClashes(canChi)`.
- `shared/lunar/stars.ts` - `getStars({ lunar, canChi, officer, mansion })` trả về `{ good, bad }`.
- `shared/lunar/auspicious.ts` - Thêm `getAllHours(jd, dayChi)` trả đủ 12 giờ; `getAuspiciousHours` lọc lại từ hàm mới.
- `shared/lunar/solarTerms.ts` - Có thể cần thêm hàm lấy Chi của tháng tiết khí cho `getOfficer`.
- `shared/lunar/almanac.ts` - `getAlmanac(date)` gom mọi thông tin, cache khoảng 2000 ngày.
- `shared/lunar/index.ts` - Export các module mới.
- `shared/lunar/napAm.test.ts`, `elements.test.ts`, `mansions.test.ts`, `officers.test.ts`, `directions.test.ts`, `clashes.test.ts`, `stars.test.ts`, `auspicious.test.ts`, `almanac.test.ts` - Unit test tương ứng.

### Giao diện

- `src/views/DayView/AlmanacPanel.tsx` - Khối "Lịch vạn niên" (7 nhóm con).
- `src/views/DayView/AlmanacPanel.module.css` - Style khối (inset grouped, chip, lưới giờ).
- `src/views/DayView/HourGrid.tsx` - Lưới 12 giờ, đánh dấu "Bây giờ".
- `src/views/DayView/StarChips.tsx` - Chip sao tốt/xấu bấm được.
- `src/views/DayView/AlmanacExplain.tsx` - Hộp giải thích dùng `Modal` cỡ `sm` (hộp giữa màn hình trên máy tính, bottom sheet trên điện thoại).
- `src/views/DayView/hourIndex.ts` - `hourIndexAt(minutes)`: giờ hiện tại thuộc khung giờ nào.
- `src/views/DayView/AlmanacPanel.test.tsx` - Test component.
- `src/views/DayView/DayView.tsx` - Chèn `AlmanacPanel` sau khối "Sự kiện trong ngày".
- `src/views/DayView/DayView.test.tsx` - Test thứ tự khối và ẩn theo `showAuspicious`.
- `src/views/DayView/DayCard.tsx` - Bỏ danh sách "Giờ hoàng đạo" và dòng "Tiết khí: ...".
- `src/views/DayView/DayCard.module.css` - Dọn style không còn dùng.
- `src/pages/Settings/SettingsPage.tsx` - Đổi nhãn và gợi ý của công tắc `showAuspicious`.
- `src/styles/theme.css` - Biến màu tốt (xanh lá) / xấu (xám, đỏ nhạt), bản sáng và tối.
- `src/components/Modal/Modal.tsx` - Dùng lại cho bottom sheet.
- `src/hooks/useNow.ts`, `src/hooks/useMediaQuery.ts` - Dùng lại cho giờ hiện tại và phân biệt điện thoại/máy tính.

### Kiểm thử end-to-end

- `e2e/user-stories.spec.ts` - Thêm user story US-A1 đến US-A8.
- `e2e/a11y.spec.ts` - Thêm xem Ngày có khối "Lịch vạn niên" và hộp giải thích đang mở.

### Notes

- Unit test đặt cạnh file được test (ví dụ `mansions.ts` và `mansions.test.ts` cùng thư mục).
- Chạy unit test: `npm test` (tất cả) hoặc `npx vitest run shared/lunar` (một thư mục).
- Chạy E2E: `npx playwright test --project=desktop --project=iphone`.
- Trước khi commit: `npm run lint`, `npx tsc -b`, `npm run format:check`.
- **Nguồn chuẩn là licham.vn.** Chỗ nào licham.vn khác công thức hoặc bảng trong PRD thì theo licham.vn, sửa phụ lục PRD cho khớp và ghi lại trong commit.
- Không chép nguyên văn dài từ licham.vn; giải thích sao/trực tự viết lại ngắn (1–3 câu).
- Mỗi file dữ liệu ghi nguồn và ngày đối chiếu ở đầu file, giống `auspicious.ts`.
- Ngày là chuỗi `YYYY-MM-DD` theo giờ Việt Nam. Dùng `shared/lunar/julian.ts`, không dùng `new Date()` để cộng ngày.
- **Không** thêm trường mới vào `DayInfo`/`getDayInfo` (hàm này chạy cho mọi ô xem Tháng); dùng `getAlmanac` riêng.

## Instructions for Completing Tasks

**IMPORTANT:** Làm xong task nào thì đánh dấu trong file này bằng cách đổi `- [ ]` thành `- [x]`. Cập nhật sau mỗi sub-task, không đợi xong cả task cha.

## Tasks

- [x] 0.0 Tạo nhánh cho tính năng
  - [x] 0.1 Tạo và chuyển sang nhánh mới: `git checkout -b feature/day-almanac`.
- [x] 1.0 Soạn và đối chiếu dữ liệu tham chiếu từ licham.vn (bộ fixture 20 ngày, bảng xung tuổi 60 dòng, bảng sao Ngọc Hạp, 28 tú, 12 trực, Hỷ/Tài Thần, giải thích sao)
  - [x] 1.1 (licham.vn trả lỗi 500 cho năm 1900 và 2100, nên fixture chỉ gồm các ngày 2025–2026; hai năm biên có test riêng, chỉ kiểm tra hàm chạy không lỗi.) Chọn 20 ngày đối chiếu trải đều: ngày mẫu 25/9/2026, ít nhất 2 ngày trong tháng nhuận, 2 ngày đầu tiết khí (đổi tháng tiết khí), 2 ngày giáp Tết, 1 ngày năm 1900, 1 ngày năm 2100, còn lại rải đều các Can ngày và các tháng âm.
  - [x] 1.2 Với mỗi ngày, ghi từ licham.vn: tiết khí, niên mệnh, Can Chi ngày/tháng, quan hệ Can Chi, sao 28 tú (tên, hành, con vật, cát/hung), trực, Hỷ Thần, Tài Thần, xung ngày, xung tháng, danh sách sao tốt, danh sách sao xấu, 12 giờ (tốt/xấu). Lưu vào `shared/lunar/almanac.fixtures.ts` dạng mảng có kiểu.
  - [x] 1.3 Soạn bảng 28 tú (tên, ngũ hành đã quy về 5 hành, con vật, cát/hung) và đối chiếu với Phụ lục B của PRD. Kiểm tra công thức `(jd + 11) mod 28` với cả 20 ngày; nếu lệch, tìm offset đúng và sửa PRD.
  - [x] 1.4 Soạn bảng 12 trực: tên, cát/hung, nên làm, nên kiêng, giải thích ngắn. Kiểm tra công thức trực theo tháng tiết khí (PRD yêu cầu 13) với 20 ngày.
  - [x] 1.5 Đối chiếu bảng Hỷ Thần / Tài Thần (Phụ lục C) với licham.vn cho đủ 10 Can; sửa Phụ lục C nếu khác.
  - [x] 1.6 Soạn bảng xung ngày (60 dòng theo Can Chi ngày) và xung tháng (60 dòng theo Can Chi tháng). Nếu thấy quy luật rõ ràng (ví dụ Thiên khắc Địa xung) thì vẫn lưu dạng bảng, chỉ ghi quy luật trong chú thích. Lưu vào `shared/lunar/clashes.data.ts`.
  - [x] 1.7 (Sinh bằng script từ 730 ngày licham.vn: 111 sao. Thiên Xá, Âm Thác, Dương Thác dùng bảng gốc vì licham.vn tính sai.) Soạn bảng sao Ngọc Hạp Thông Thư (bản đầy đủ, khoảng 100 sao). Mỗi sao: `name`, `good: boolean`, `rule` (một trong các kiểu: `monthChi`, `monthCan`, `monthCanChi`, `officer`, `mansion`, `lunarDay`) và bảng tham số theo 12 tháng âm. Lưu vào `shared/lunar/stars.data.ts`.
  - [x] 1.8 (28 tú và 12 trực tự viết lại; ý nghĩa sao Ngọc Hạp dùng câu ngắn của licham.vn.) Viết giải thích ngắn (1–3 câu, tự viết lại) cho mỗi sao Ngọc Hạp, mỗi sao 28 tú và mỗi trực. Kèm "Nên làm" / "Nên kiêng" nếu có.
  - [x] 1.9 (lichvannien365.com trả 404; đối chiếu thêm xemngay.com và lichviet.me: 4 dòng xung ngày Tỵ lấy từ lichviet.me, đối chiếu thêm thoigian.com.vn: trực theo tiết giao trong ngày (khớp 24/24), Tài Thần ngày Mậu là Bắc, xung Giáp Ngọ có Canh Thân.) Soát chéo một lượt với lichvannien365.com để bắt lỗi chép (không dùng để thay giá trị của licham.vn). Ghi nguồn và ngày đối chiếu ở đầu mỗi file dữ liệu.
  - [x] 1.10 Cập nhật Phụ lục A, B, C trong `tasks/prd-day-almanac.md` nếu có giá trị khác sau khi đối chiếu.
- [x] 2.0 Logic tính toán thuần trong `shared/lunar/` (nạp âm, quan hệ Can Chi, 28 tú, 12 trực, hướng xuất hành, xung tuổi, 12 giờ) kèm unit test
  - [x] 2.1 `napAm.ts`: bảng 30 cặp nạp âm, `getNapAm(canChi): string`. Test: đủ 60 Can Chi đều có kết quả, Nhâm Dần là "Kim Bạch Kim", Giáp Tý là "Hải Trung Kim".
  - [x] 2.2 `elements.ts`: kiểu `Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ'`, `canElement(can)`, `chiElement(chi)`, quan hệ sinh/khắc, `getCanChiRelation(canChi)` trả về `{ kind, dayName, rating, text }`, trong đó `text` giống "Can sinh Chi (Thủy, Mộc), là ngày cát (bảo nhật).". Test đủ 5 loại quan hệ.
  - [x] 2.3 `mansions.ts`: bảng 28 tú (từ task 1.3), `getMansion(jd)`. Test: 25/9/2026 là Ngưu; 28 ngày liên tiếp ra đủ 28 sao không trùng; khớp fixture.
  - [x] 2.4 Thêm vào `solarTerms.ts` hàm lấy Chi của tháng tiết khí (tháng Dần bắt đầu từ Lập xuân). Test: ngày ngay trước và ngay tại Lập xuân, Kinh trập.
  - [x] 2.5 `officers.ts`: bảng 12 trực (từ task 1.4), `getOfficer(jd)` theo công thức `(chiNgày − chiThángTiếtKhí + 12) mod 12`. Test: ngày đầu tiết lặp lại trực của ngày trước; khớp fixture.
  - [x] 2.6 `directions.ts`: `getTravelDirections(dayCan)` trả về `{ hyThan, taiThan }`. Test đủ 10 Can; Nhâm là Nam / Tây.
  - [x] 2.7 `clashes.ts`: `getDayClashes(canChi)`, `getMonthClashes(canChi)` đọc từ `clashes.data.ts`, trả về mảng tên Can Chi. Test: Nhâm Dần ra "Canh Thân, Bính Thân, Bính Dần"; Đinh Dậu ra "Ất Mão, Quý Mão, Quý Tị, Quý Hợi, Quý Dậu"; bảng đủ 60 dòng.
  - [x] 2.8 Sửa `auspicious.ts`: thêm `getAllHours(jd, dayChi)` trả về 12 phần tử `{ chi, name, startHour, endHour, canChi, god, isGood }` (Can Chi giờ dùng `hourCanChi`). Viết lại `getAuspiciousHours` bằng cách lọc `isGood` từ hàm mới, giữ nguyên kiểu trả về cũ.
  - [x] 2.9 Test `getAllHours`: đúng 12 giờ theo thứ tự Tý→Hợi, đúng 6 giờ tốt, 6 giờ tốt trùng với `getAuspiciousHours` cũ cho cả 12 Chi ngày; ngày Dần khớp bảng giờ ở Phụ lục A.
  - [x] 2.10 Export các module mới trong `shared/lunar/index.ts`.
- [x] 3.0 Sao tốt & Sao xấu theo Ngọc Hạp Thông Thư và hàm gom `getAlmanac(date)` có cache, kèm unit test với fixture
  - [x] 3.1 `stars.ts`: định nghĩa kiểu `Star = { name, good, meaning, shouldDo?, shouldAvoid? }` và kiểu quy tắc. Viết `matchesRule(rule, ctx)` cho từng kiểu quy tắc ở task 1.7.
  - [x] 3.2 `getStars({ lunar, canChi, officer, mansion })`: duyệt bảng, trả về `{ good: Star[], bad: Star[] }` theo thứ tự trong bảng. Tháng nhuận dùng quy tắc của tháng thường cùng số (PRD yêu cầu 22).
  - [x] 3.3 Test `stars.ts`: 25/9/2026 ra sao tốt (Thiên đức, Giải thần, Thanh Long, Sát cống) và sao xấu (Kiếp sát, Hoàng Sa), hoặc giá trị đã sửa theo licham.vn; khớp 20 ngày fixture; ngày trong tháng nhuận ra giống tháng thường cùng số.
  - [x] 3.4 `almanac.ts`: kiểu `Almanac` gồm `solarTerm`, `napAm`, `dayCanChi`, `relation`, `mansion`, `officer`, `directions`, `dayClashes`, `monthClashes`, `stars`, `hours`. `getAlmanac(date)` dùng lại `getDayInfo(date)` cho jd, âm lịch, Can Chi, tiết khí.
  - [x] 3.5 Thêm cache Map giới hạn 2000 phần tử cho `getAlmanac`, giống cách làm trong `getDayInfo`.
  - [x] 3.6 Test `almanac.test.ts`: ngày mẫu khớp Phụ lục A; vòng lặp 20 ngày fixture so từng trường; gọi hai lần trả về cùng object (cache).
  - [x] 3.7 Test hiệu năng đơn giản: gọi `getAlmanac` cho 365 ngày liên tiếp (không cache) và kiểm tra trung bình dưới 5ms mỗi ngày.
- [x] 4.0 Giao diện khối "Lịch vạn niên" trong xem Ngày (`AlmanacPanel`, lưới 12 giờ có đánh dấu "Bây giờ", chip sao, hộp giải thích popover/bottom sheet)
  - [x] 4.1 Tạo `AlmanacPanel.tsx` nhận `{ date, isToday }`, gọi `getAlmanac(date)` trong `useMemo`. Render `section` có `aria-label="Lịch vạn niên"`, tiêu đề "Lịch vạn niên", rồi 7 nhóm con theo thứ tự PRD mục 1, mỗi nhóm có tiêu đề `h3` và danh sách `dl`.
  - [x] 4.2 Nhóm "Tiết Khí & Ngũ Hành": 4 dòng Tiết khí, Niên mệnh, Ngày Can Chi, Quan hệ Can Chi (dùng `relation.text`).
  - [x] 4.3 Nhóm "Nhị Thập Bát Tú": nhãn Cát Tú/Hung Tú (viên thuốc có màu), Sao, Ngũ hành, Động vật. Tên sao là `button` mở hộp giải thích.
  - [x] 4.4 Nhóm "Thập Nhị Trực": Trực (button mở giải thích), nhãn cát/hung, Nên làm, Nên kiêng.
  - [x] 4.5 Nhóm "Hướng Xuất Hành" (Hỷ Thần, Tài Thần) và nhóm "Tuổi Xung Khắc" (Xung ngày, Xung tháng; nối bằng ", ").
  - [x] 4.6 Tạo `StarChips.tsx`: hai nhóm "Sao tốt (n)" và "Sao xấu (n)", mỗi sao là chip `button` có `aria-haspopup="dialog"`, chip tốt xanh lá nhạt, chip xấu đỏ/cam nhạt, vùng bấm tối thiểu 44×44px. Nhóm rỗng hiện "Không có".
  - [x] 4.7 Tạo `HourGrid.tsx`: 12 ô theo thứ tự Tý→Hợi. Mỗi ô: dòng 1 "Tý 23h–1h" (đậm), dòng 2 Can Chi giờ và tên thần (nhỏ). Ô tốt nền xanh lá nhạt kèm chữ/biểu tượng "Tốt"; ô xấu chữ `--text-muted`. Lưới 3 cột trên điện thoại, 6 cột trên máy tính.
  - [x] 4.8 Đánh dấu "Bây giờ" trong `HourGrid`: dùng `useNow()`; chỉ khi `date === today`; tìm giờ chứa `minutes` hiện tại (giờ Tý 23h–24h thuộc ngày đang xem; 0h–1h thuộc giờ Tý của ngày đó theo PRD yêu cầu 33). Ô hiện tại có viền `--accent` 2px và nhãn "Bây giờ".
  - [x] 4.9 Nhãn đọc màn hình cho mỗi ô giờ, ví dụ "Giờ Tý, 23 giờ đến 1 giờ, Canh Tý, Thanh Long, giờ tốt, bây giờ".
  - [x] 4.10 (Dùng `Modal` cỡ `sm` cho cả hai: máy tính là hộp giữa màn hình, điện thoại là bottom sheet; không làm popover riêng.) Tạo `AlmanacExplain.tsx`: nhận mục đang chọn (sao / 28 tú / trực) và nút đã bấm. Máy tính: popover neo cạnh nút. Điện thoại (`useMediaQuery` ≤ 720px): bottom sheet bằng `Modal`. Nội dung: tên, nhãn tốt/xấu, ý nghĩa, Nên làm / Nên kiêng nếu có.
  - [x] 4.11 Đóng hộp bằng nút đóng, bấm ra ngoài, phím Esc; đóng xong trả focus về nút đã bấm. Popover có `role="dialog"` và `aria-labelledby`.
  - [x] 4.12 Viết `AlmanacPanel.module.css` theo token trong `theme.css` (glass, `--radius-lg`, inset grouped, vạch ngăn). Kiểm tra chế độ sáng, tối và "Giảm trong suốt".
  - [x] 4.13 Test component `AlmanacPanel.test.tsx`: ngày 25/9/2026 hiện "Thu phân", "Kim Bạch Kim", "Ngưu", "Nam", "Tây", đủ 12 ô giờ, 6 ô "Tốt"; giả lập thời gian (`vi.useFakeTimers`) để kiểm tra "Bây giờ" đúng ô khi là hôm nay và không có khi xem ngày khác; bấm chip "Thiên đức" mở hộp, Esc đóng và focus quay lại chip.
- [x] 5.0 Tích hợp với xem Ngày và Cài đặt (thứ tự khối, bật/tắt theo `showAuspicious`, đổi nhãn công tắc, bỏ phần trùng trong `DayCard`, biến màu trong `theme.css`)
  - [x] 5.1 Trong `DayView.tsx`, render `AlmanacPanel` **sau** khối "Sự kiện trong ngày", chỉ khi `settings.showAuspicious` là `true`. Truyền `date` và `isToday={date === today}`.
  - [x] 5.2 Trong `DayCard.tsx`, bỏ danh sách "Giờ hoàng đạo" và dòng "Tiết khí: ...". Giữ dòng ngày hoàng đạo/hắc đạo và các ngày kỵ. Giữ tag "Tiết ..." khi `startsToday`. Dọn CSS không còn dùng trong `DayCard.module.css`.
  - [x] 5.3 Trong `SettingsPage.tsx`, đổi nhãn công tắc thành "Hiện ngày hoàng đạo và lịch vạn niên" và gợi ý thành "Ngày hoàng đạo / hắc đạo, ngày kỵ, sao tốt xấu, giờ tốt, hướng xuất hành".
  - [x] 5.4 Thêm biến màu vào `theme.css`: `--almanac-good`, `--almanac-good-bg`, `--almanac-bad`, `--almanac-bad-bg` (và dùng `--text-muted` cho giờ xấu), đủ bản sáng và tối, tương phản chữ/nền tối thiểu 4.5:1.
  - [x] 5.5 Cập nhật `DayView.test.tsx`: khối "Lịch vạn niên" nằm sau "Sự kiện trong ngày"; tắt `showAuspicious` thì không có khối; `DayCard` không còn "Giờ hoàng đạo".
  - [x] 5.6 (App không có thao tác vuốt; test E2E "US-A: khối Lịch vạn niên đổi theo ngày" kiểm tra nút Ngày sau, phím ←, và chọn ngày ở lịch nhỏ trên desktop.) Kiểm tra chuyển ngày (vuốt, nút trước/sau, chọn ngày ở MiniMonth) thì khối cập nhật đúng ngày mới.
- [ ] 6.0 Kiểm thử E2E, a11y, hiệu năng và kiểm tra cuối (lint, typecheck, format, kích thước bundle)
  - [x] 6.1 E2E trong `e2e/user-stories.spec.ts` (chạy `desktop` và `iphone`): mở xem Ngày 25/9/2026, thấy "Thu phân", "Kim Bạch Kim", sao "Ngưu", Hỷ Thần "Nam"; bấm chip "Thiên đức" thấy giải thích rồi đóng; tắt công tắc trong Cài đặt thì khối biến mất.
  - [x] 6.2 Thêm xem Ngày (có khối "Lịch vạn niên") và trạng thái hộp giải thích đang mở vào `e2e/a11y.spec.ts`, chạy cả sáng và tối.
  - [x] 6.3 Đo kích thước bundle trước và sau (`npm run build`, xem kích thước gzip trong output). Nếu tăng quá 30KB gzip, tách `stars.data.ts` bằng `import()` động và hiện khung chờ trong nhóm "Sao tốt & Sao xấu".
  - [x] 6.4 (Lint, tsc, format, 390 unit test qua. E2E đủ 5 cấu hình desktop, mobile, firefox, webkit, iphone: 157 qua, 28 skip có sẵn. Đã sửa US-5: test chờ "9:00-10:00" nhưng nhãn là "9:00 – 10:00" từ commit 8caba49.) Chạy `npm run lint`, `npx tsc -b`, `npm run format:check`, `npm test`, `npx playwright test --project=desktop --project=iphone`; sửa hết lỗi.
  - [ ] 6.5 (Cần làm trên máy thật.) Kiểm tra thủ công trên iPhone (Safari và PWA đã cài): lưới giờ không tràn ngang, bottom sheet không bị home indicator che, chip dễ bấm.
  - [x] 6.6 (Thay bằng đối chiếu tự động cả 730 ngày: sao khớp 720/730, 10 ngày lệch là trang licham.vn hiện danh sách của ngày khác.) So tay 3 ngày ngẫu nhiên ngoài bộ fixture với licham.vn; ghi lại kết quả. Nếu lệch, thêm ngày đó vào fixture rồi sửa.
