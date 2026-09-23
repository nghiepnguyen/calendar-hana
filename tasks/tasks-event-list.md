## Relevant Files

### Logic thuần (dùng chung, dễ test)

- `shared/recurrence/editing.ts` - Thêm `deleteOccurrences(event, occurrences[])`: gộp nhiều exception `deleted` vào một sự kiện, trả về `delete` nếu đã hết lần.
- `shared/recurrence/editing.test.ts` - Unit test cho `deleteOccurrences`.
- `src/components/SearchPanel/search.ts` - Tách phần so khớp từ khoá thành `queryWords(query)` và `matchesQuery(event, words)` để dùng chung.
- `src/components/SearchPanel/search.test.ts` - Unit test cho hàm so khớp (không dấu, nhiều từ, ghi chú, địa điểm).
- `src/pages/EventList/groupList.ts` - Hàm thuần `groupByMonthAndDay(occurrences, today)` trả về các nhóm tháng → ngày → lần diễn ra.
- `src/pages/EventList/groupList.test.ts` - Unit test cho hàm nhóm.
- `src/pages/EventList/listRange.ts` - Khoảng ngày mặc định, mở rộng 3/12 tháng, kẹp trong 1900–2100.
- `src/pages/EventList/listRange.test.ts` - Unit test cho `listRange.ts`.
- `src/pages/EventList/savedPosition.ts` - Đọc/ghi `{ anchorDate, start, end }` trong `sessionStorage`.
- `src/pages/EventList/savedPosition.test.ts` - Unit test cho `savedPosition.ts`.

### Dữ liệu

- `src/data/eventActions.ts` - Thêm `deleteEventOccurrences(repository, selections)`: gom theo `eventId`, mỗi sự kiện gọi một lần `deleteEvent` hoặc `saveEvent`.
- `src/data/eventActions.test.ts` - Unit test cho `deleteEventOccurrences` (dùng local repository + `fake-indexeddb`).
- `src/hooks/useEventsInRange.ts` - Dùng lại để lấy các lần diễn ra trong khoảng ngày (không truyền `hiddenCategoryIds`).

### Trang Danh sách

- `src/pages/EventList/EventListPage.tsx` - Trang `/events`: header, thanh tìm và lọc, danh sách, chế độ chọn, dialog.
- `src/pages/EventList/EventListPage.module.css` - Style trang (kính iOS, sticky tháng, nhóm ngày inset grouped).
- `src/pages/EventList/EventListPage.test.tsx` - Test component: hiển thị nhóm, mở chi tiết, lọc, tìm, chọn và xoá.
- `src/pages/EventList/EventRow.tsx` - Một dòng sự kiện (thường và chế độ chọn).
- `src/pages/EventList/DayGroup.tsx` - Tiêu đề ngày (dương + âm) và các dòng của ngày đó.
- `src/pages/EventList/CategoryChips.tsx` - Hàng chip lọc danh mục cục bộ.
- `src/pages/EventList/SelectionBar.tsx` - Thanh công cụ dưới đáy ở chế độ chọn.
- `src/pages/EventList/useInfiniteRange.ts` - Hook cuộn vô hạn hai chiều bằng `IntersectionObserver`, giữ vị trí khi chèn phía trên.

### Tích hợp

- `src/App.tsx` - Thêm route `/events` trước `/:view/:date`.
- `src/App.test.tsx` - Test route `/events` và lối vào từ Menu.
- `src/components/layout/Sidebar.tsx` - Thêm mục "Danh sách sự kiện" (sidebar máy tính và sheet Menu điện thoại).
- `src/components/layout/Sidebar.module.css` - Style cho mục mới.
- `src/components/EventDialogs.tsx` - Dùng lại để mở chi tiết/sửa/xoá từ trang Danh sách.
- `src/components/ConfirmDialog.tsx` - Dùng lại cho hộp xác nhận xoá nhiều.
- `src/components/Toast/Toast.tsx` - (Mới, nếu cần) thông báo ngắn "Đã xoá N sự kiện". App chưa có component toast.
- `src/components/Toast/Toast.module.css` - Style cho toast.

### Kiểm thử end-to-end

- `e2e/user-stories.spec.ts` - Thêm các user story US-L1 đến US-L8.
- `e2e/a11y.spec.ts` - Thêm `/events` vào danh sách trang kiểm tra WCAG.

### Notes

- Unit test đặt cạnh file được test (ví dụ `groupList.ts` và `groupList.test.ts` cùng thư mục).
- Chạy unit test: `npm test` (tất cả) hoặc `npx vitest run src/pages/EventList` (một thư mục).
- Chạy E2E: `npx playwright test --project=desktop --project=iphone`.
- Trước khi commit: `npm run lint`, `npx tsc -b`, `npm run format:check`.
- Ngày luôn là chuỗi `YYYY-MM-DD` theo giờ Việt Nam. Dùng hàm trong `shared/lunar/julian.ts` (`addDays`, `parseSolarDate`...), **không** dùng `new Date()` để cộng ngày.
- Ngày âm luôn lấy từ `getDayInfo(date).lunar`, format bằng `shared/format.ts`. Không tự tính lại.

## Instructions for Completing Tasks

**IMPORTANT:** Làm xong task nào thì đánh dấu trong file này bằng cách đổi `- [ ]` thành `- [x]`. Cập nhật sau mỗi sub-task, không đợi xong cả task cha.

Ví dụ:

- `- [ ] 1.1 Đọc file` → `- [x] 1.1 Đọc file` (sau khi làm xong)

## Tasks

- [x] 0.0 Tạo feature branch
  - [x] 0.1 Từ `main` mới nhất, tạo và chuyển sang branch `git checkout -b feature/event-list`
- [x] 1.0 Viết logic thuần cho danh sách (nhóm lần diễn ra theo tháng/ngày, so khớp từ khoá dùng chung với SearchPanel, xoá nhiều lần diễn ra gộp exception theo từng sự kiện, đọc/ghi vị trí cuộn trong sessionStorage) kèm unit test
  - [x] 1.1 Trong `search.ts`, tách `queryWords(query)` (chuẩn hoá bằng `normalizeText`, tách theo khoảng trắng) và `matchesQuery(event, words)` (tiêu đề + ghi chú + địa điểm chứa đủ mọi từ). Sửa `searchEvents` dùng lại hai hàm này; test cũ của SearchPanel phải vẫn pass.
  - [x] 1.2 Unit test `matchesQuery`: "gio" khớp "Giỗ ông nội", khớp theo ghi chú và địa điểm, cần đủ mọi từ, từ khoá rỗng khớp tất cả.
  - [x] 1.3 Viết `groupByMonthAndDay(occurrences, today)` trong `groupList.ts`. Đầu vào là mảng đã sắp xếp (từ `useEventsInRange`). Đầu ra: `{ year, month, days: { date, isToday, isPast, occurrences }[] }[]`. Nếu hôm nay nằm trong khoảng nhưng không có sự kiện, vẫn thêm nhóm hôm nay với `occurrences: []` đúng vị trí (PRD yêu cầu 9, 13).
  - [x] 1.4 Unit test `groupByMonthAndDay`: nhiều tháng, bỏ tháng rỗng, nhóm hôm nay rỗng, lần bị dời ngày nằm đúng ngày mới, `isPast` đúng.
  - [x] 1.5 Viết `listRange.ts`: `defaultRange(today)` (3 tháng trước → 6 tháng sau), `extendBefore(range, months)`, `extendAfter(range, months)`, `isAtStart(range)`, `isAtEnd(range)`. Kẹp trong `1900-01-01` và `2100-12-31` (`MIN_YEAR`, `MAX_YEAR` trong `shared/lunar/lunar.ts`).
  - [x] 1.6 Unit test `listRange.ts`: cộng/trừ tháng qua năm, kẹp ở hai đầu, ngày cuối tháng (31/1 + 1 tháng).
  - [x] 1.7 Trong `shared/recurrence/editing.ts`, viết `deleteOccurrences(event, occurrences)`: sự kiện không lặp → `{ action: 'delete' }`; sự kiện lặp → thêm exception `deleted` cho **mọi** `occurrenceKey` trong một object mới; nếu sau đó chuỗi có `count` không còn lần nào thì trả về `delete`. Dùng `iterateOccurrences` để kiểm tra còn lần nào không.
  - [x] 1.8 Unit test `deleteOccurrences`: một lần, nhiều lần cùng sự kiện (không mất exception cũ, kể cả exception đã sửa riêng), xoá hết các lần của chuỗi `count: 3`, sự kiện không lặp.
  - [x] 1.9 Trong `src/data/eventActions.ts`, viết `deleteEventOccurrences(repository, selections: { eventId, occurrenceKey, index }[])`: gom theo `eventId`; với mỗi sự kiện, đọc bản **gốc** bằng `repository.getEvent(id)` (không dùng `occurrence.event`), gọi `deleteOccurrences`, rồi `deleteEvent` hoặc `saveEvent` **một lần**. Trả về `{ deleted: number, failed: selections[] }` để UI báo lỗi phần chưa xoá được.
  - [x] 1.10 Unit test `deleteEventOccurrences` với local repository: xoá lẫn sự kiện thường và lặp, chọn 3 lần của cùng một sự kiện chỉ gọi `saveEvent` một lần (spy), sự kiện đã bị xoá ở nơi khác được bỏ qua không báo lỗi.
  - [x] 1.11 Viết `savedPosition.ts`: `loadPosition()` và `savePosition({ anchorDate, start, end })` với khoá `event-list:position` trong `sessionStorage`. Kiểm tra dữ liệu đọc ra (đúng dạng `YYYY-MM-DD`, `start <= anchorDate <= end`), sai thì trả về `null`. Bọc mọi truy cập `sessionStorage` trong `try/catch`.
  - [x] 1.12 Unit test `savedPosition.ts`: ghi rồi đọc lại, JSON hỏng, ngày sai dạng, `sessionStorage` ném lỗi (mock) đều trả về `null`.
- [x] 2.0 Dựng trang `/events` và lối vào (route, header có nút quay lại / Hôm nay / Chọn, mục "Danh sách sự kiện" trong sidebar và sheet Menu, tải dữ liệu theo khoảng ngày, nhóm tháng sticky + nhóm ngày có ngày dương và âm, dòng sự kiện, bấm mở chi tiết, trạng thái rỗng và đang tải)
  - [x] 2.1 Tạo `EventListPage.tsx` rỗng, thêm `<Route path="/events" element={<EventListPage />} />` vào `src/App.tsx` **trước** `/:view/:date`. Kiểm tra refresh `/events` vẫn ở trang này.
  - [x] 2.2 Thêm mục "Danh sách sự kiện" (icon `ListBullets` của Phosphor) vào `Sidebar.tsx`: trên máy tính là link dưới phần Danh mục; trên điện thoại là một dòng trong nhóm link của sheet Menu (cạnh "Cài đặt"). Bấm vào thì đóng sheet và chuyển tới `/events`.
  - [x] 2.3 Dựng header kính dính trên cùng, giống `SettingsPage`: nút "‹ Lịch" quay về `/`, tiêu đề `h1` "Danh sách sự kiện", nút "Hôm nay", nút "Chọn" (task 5.0 sẽ nối logic).
  - [x] 2.4 Trong trang, giữ `range` trong state (khởi tạo bằng `defaultRange(today)`), lấy dữ liệu bằng `useEventsInRange(range.start, range.end)` (không truyền `hiddenCategoryIds`), nhóm bằng `groupByMonthAndDay`.
  - [x] 2.5 Render nhóm tháng: `section` có `h2` "Tháng 9/2026" và dòng phụ tháng âm từ `formatMonthTitleParts`. Tiêu đề tháng `position: sticky` dưới header.
  - [x] 2.6 Tạo `DayGroup.tsx`: `h3` gồm `formatSolar(date)` và `formatLunar(getDayInfo(date).lunar)`; nhãn "Hôm nay" và màu nhấn cho hôm nay; Chủ nhật màu đỏ; ngày đã qua nhạt hơn; gắn `data-date={date}` lên phần tử ngoài cùng (dùng ở task 3.0). Nhóm hôm nay rỗng hiện "Không có sự kiện".
  - [x] 2.7 Tạo `EventRow.tsx`: chấm màu danh mục (`useCategoryMap().colorOf`), tiêu đề, "Cả ngày" hoặc "09:00 – 10:00" (`formatTime`), tên danh mục, icon lặp (`ArrowsClockwise`) nếu `isRecurring`, nhãn "Âm lịch" nếu `event.calendarType === 'lunar'`, địa điểm một dòng có "…". Nhãn đọc màn hình gồm tiêu đề, thời gian và `formatAccessibleDate(date)`.
  - [x] 2.8 Bấm dòng (khi không ở chế độ chọn) gọi `useUiStore().openDetail(occurrence)`. Render `<EventDialogs settings={settings} signedIn={!!user} />` trong trang để sửa/xoá hoạt động như ở xem Ngày.
  - [x] 2.9 Trạng thái đang tải (`occurrences === undefined`): hiện skeleton vài nhóm ngày. Chưa có sự kiện nào: hiện "Chưa có sự kiện nào" và nút "Tạo sự kiện" gọi `openCreate({ date: today })`.
  - [x] 2.10 Test component: render `/events` với vài sự kiện mẫu (`src/test/fixtures.ts`), kiểm tra tiêu đề tháng, tiêu đề ngày có ngày âm, sự kiện lặp hiện nhiều dòng, bấm dòng mở dialog chi tiết.
- [x] 3.0 Cuộn vô hạn hai chiều và lưu vị trí cuộn (tải thêm 3 tháng ở đầu/cuối, giữ vị trí khi chèn phía trên, giới hạn 1900–2100, cuộn tới hôm nay lần đầu, khôi phục vị trí khi quay lại trong cùng phiên, nút Hôm nay)
  - [x] 3.1 Tạo hook `useInfiniteRange` nhận `range`, `setRange` và ref vùng cuộn. Đặt phần tử "mốc" ở đầu và cuối danh sách; dùng `IntersectionObserver` (`rootMargin` khoảng 600px) để gọi `extendBefore` / `extendAfter` 3 tháng.
  - [x] 3.2 Giữ vị trí khi chèn phía trên: trước khi mở rộng về trước, ghi `scrollHeight` và `scrollTop`; sau khi render (`useLayoutEffect`) cộng phần chênh lệch `scrollHeight` vào `scrollTop`. Kiểm tra thủ công trên Safari iOS (không dựa vào `overflow-anchor`).
  - [x] 3.3 Khi `isAtStart` / `isAtEnd`, ngắt observer tương ứng và hiện dòng "Đã hết sự kiện".
  - [x] 3.4 Lần đầu mở trang (không có vị trí đã lưu): sau khi dữ liệu đầu tiên render, cuộn tới `[data-date="<today>"]` với `block: 'start'`, trừ đi chiều cao header và tiêu đề tháng sticky (`scroll-margin-top`).
  - [x] 3.5 Nút "Hôm nay": nếu hôm nay nằm ngoài `range` thì đặt lại `defaultRange(today)` trước, rồi cuộn tới nhóm hôm nay.
  - [x] 3.6 Lưu vị trí: tìm `anchorDate` là nhóm ngày đầu tiên còn trong vùng nhìn thấy (duyệt các `[data-date]`, so `getBoundingClientRect().bottom` với đáy header). Gọi `savePosition` khi cuộn (throttle ~300ms) và trong cleanup của `useEffect` khi rời trang.
  - [x] 3.7 Khôi phục vị trí: khi mở trang, nếu `loadPosition()` trả về giá trị thì khởi tạo `range` bằng `start`/`end` đã lưu và cuộn tới `anchorDate`. Nếu ngày đó không còn nhóm nào, cuộn tới nhóm ngày gần nhất sau nó (PRD yêu cầu 38).
  - [x] 3.8 Đảm bảo chỉ lưu vị trí cuộn: từ khoá, bộ lọc danh mục và các dòng đang chọn **không** ghi vào `sessionStorage` (PRD yêu cầu 41).
  - [x] 3.9 Test component: mock `IntersectionObserver` trong test, kiểm tra chạm mốc cuối thì range mở rộng; có vị trí đã lưu thì range khởi tạo đúng.
- [x] 4.0 Lọc danh mục và tìm theo từ khoá trên trang (chip danh mục cục bộ không lưu, "Hiện tất cả", ô tìm không dấu, đếm kết quả aria-live, "Tìm xa hơn")
  - [x] 4.1 Tạo `CategoryChips.tsx`: một chip cho mỗi danh mục (chấm màu + tên), `aria-pressed` theo trạng thái bật, cuộn ngang trên điện thoại, vùng bấm tối thiểu 44px.
  - [x] 4.2 Trong trang, giữ `hiddenIds` bằng `useState<Set<string>>(new Set())`: mặc định bật tất cả, **không** đọc `settings.hiddenCategoryIds`, **không** gọi `repository.saveSettings`. Lọc các lần diễn ra trước khi nhóm.
  - [x] 4.3 Khi mọi danh mục đều tắt, hiện "Đang ẩn tất cả danh mục" và nút "Hiện tất cả" (xoá `hiddenIds`).
  - [x] 4.4 Thêm ô tìm kiếm (`type="search"`, placeholder "Tìm theo tiêu đề, ghi chú, địa điểm", `aria-label`). Lọc bằng `queryWords` + `matchesQuery` từ task 1.1, kết hợp với lọc danh mục. Dùng `useDeferredValue` cho từ khoá để gõ không bị giật.
  - [x] 4.5 Khi có từ khoá: hiện "N kết quả" trong phần tử `aria-live="polite"`. Nếu không có kết quả trong khoảng đã tải: hiện "Không tìm thấy trong khoảng đã tải" và nút "Tìm xa hơn" gọi `extendBefore` + `extendAfter` 12 tháng.
  - [x] 4.6 Xoá từ khoá thì giữ vị trí quanh ngày đang xem: ghi `anchorDate` trước khi đổi bộ lọc, sau khi render cuộn lại tới nhóm đó (dùng lại logic của task 3.6–3.7).
  - [x] 4.7 Test component: tắt một chip thì dòng của danh mục đó biến mất và `saveSettings` không được gọi; gõ "gio" thấy "Giỗ ông nội"; tắt hết thấy "Hiện tất cả".
- [x] 5.0 Chế độ chọn nhiều và xoá cùng lúc (ô chọn trên từng dòng, thanh công cụ dưới đáy, Chọn tất cả, hộp xác nhận, xoá gộp theo sự kiện, trạng thái đang xoá, báo lỗi, hoạt động offline)
  - [x] 5.1 Thêm state `selecting: boolean` và `selected: Map<string, Selection>` với khoá `${eventId}:${occurrenceKey}`. Nút "Chọn" bật chế độ chọn; ở chế độ chọn đổi thành "Xong", bấm thì thoát và xoá `selected`.
  - [x] 5.2 Ở chế độ chọn, `EventRow` hiện `input type="checkbox" className="check"` có nhãn là tiêu đề + ngày; bấm cả dòng thì bật/tắt chọn, không mở chi tiết. Dùng được bằng Tab và Space.
  - [x] 5.3 Tạo `SelectionBar.tsx` nổi ở đáy (kính, tôn trọng `env(safe-area-inset-bottom)`): "Đã chọn N", nút "Chọn tất cả" (chọn mọi dòng **đang hiển thị** sau lọc và tìm), nút "Xoá" màu đỏ bị vô hiệu khi N = 0. Chừa khoảng trống cuối danh sách để thanh không che dòng cuối.
  - [x] 5.4 Bấm "Xoá" mở `ConfirmDialog` tiêu đề "Xoá N sự kiện?", nội dung "Không thể hoàn tác."; nếu có lần của sự kiện lặp thì thêm câu "Với sự kiện lặp lại, chỉ xoá các lần đã chọn; các lần khác vẫn giữ."
  - [x] 5.5 Xác nhận thì gọi `deleteEventOccurrences` (task 1.9). Trong lúc xoá: nút "Xoá" bị vô hiệu và hiện "Đang xoá…".
  - [x] 5.6 Xoá xong toàn bộ: thoát chế độ chọn, hiện toast "Đã xoá N sự kiện". Tạo component `Toast` đơn giản (tự ẩn sau ~3 giây, `role="status"`) nếu app chưa có.
  - [x] 5.7 Có phần lỗi (`failed` không rỗng): hiện thông báo lỗi rõ ràng, giữ lại các dòng chưa xoá được trong `selected`, vẫn ở chế độ chọn để thử lại.
  - [ ] 5.8 (Đã kiểm tra với dữ liệu local qua E2E; còn thiếu kiểm tra Firestore khi offline.) Kiểm tra offline và local: xoá nhiều khi chưa đăng nhập (Dexie) và khi offline với Firestore; dữ liệu cập nhật ngay trên danh sách và xem Tháng.
  - [x] 5.9 Kiểm tra nhắc hẹn: sau khi xoá, `ReminderService` không còn hẹn giờ cho các lần đã xoá (theo dõi thay đổi sự kiện như hiện tại); ghi chú lại nếu cần sửa.
  - [x] 5.10 Test component: chọn 2 lần của một sự kiện lặp + 1 sự kiện thường, xác nhận, kiểm tra 3 dòng biến mất và các lần khác của chuỗi vẫn còn; "Chọn tất cả" chỉ chọn dòng đang hiển thị khi đang lọc.
- [x] 6.0 Hoàn thiện giao diện và kiểm thử (style kính iOS sáng/tối, điện thoại ≤ 720px và safe-area, vùng bấm 44px, a11y, test component, E2E desktop + iPhone, thêm `/events` vào a11y.spec)
  - [x] 6.1 Hoàn thiện `EventListPage.module.css` theo token trong `theme.css`: nội dung rộng tối đa 720px căn giữa trên máy tính; nhóm ngày dạng "inset grouped" (`--radius-lg`, vạch ngăn `--separator`); tiêu đề tháng sticky có nền kính để chữ phía sau không lẫn vào.
  - [x] 6.2 Điện thoại (≤ 720px, `COMPACT_QUERY`): lề 8px, header và thanh chọn tôn trọng `env(safe-area-inset-*)`, chip cuộn ngang không làm trang cuộn ngang.
  - [x] 6.3 Kiểm tra chế độ sáng, tối và "Giảm trong suốt"; ngày đã qua, ngày âm, nhãn "Âm lịch" vẫn đạt tương phản 4.5:1.
  - [ ] 6.4 (Chưa đo; chưa thêm `content-visibility`.) Hiệu năng: tạo dữ liệu thử có sự kiện lặp hằng ngày nhiều năm; nếu cuộn giật, thêm `content-visibility: auto` cho từng nhóm tháng (hoặc virtualization nếu vẫn chậm).
  - [x] 6.5 E2E trong `e2e/user-stories.spec.ts` (chạy cả `desktop` và `iphone`): mở `/events` từ Menu; tạo giỗ âm lịch lặp hằng năm và thấy đúng ngày dương + âm; tìm "gio"; tắt chip danh mục không làm đổi lịch; xoá 2 lần của sự kiện lặp rồi kiểm tra xem Tháng; cuộn sang tháng khác, về lịch rồi mở lại `/events` vẫn ở tháng đó.
  - [x] 6.6 Thêm `/events` vào mảng `pages` trong `e2e/a11y.spec.ts`; thêm một case a11y ở chế độ chọn (có thanh công cụ và hộp xác nhận).
  - [x] 6.7 Chạy `npm run lint`, `npx tsc -b`, `npm run format:check`, `npm test`, `npx playwright test --project=desktop --project=mobile --project=iphone`; sửa hết lỗi.
  - [ ] 6.8 (Cần làm trên máy thật.) Kiểm tra thủ công trên iPhone thật (Safari và PWA đã cài): cuộn lên không nhảy, sticky tháng, thanh chọn không bị home indicator che.
