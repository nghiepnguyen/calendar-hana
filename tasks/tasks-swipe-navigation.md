## Relevant Files

### Logic cử chỉ

- `src/calendar/swipe.ts` (mới) - Hàm thuần và hằng số: khóa hướng, điều kiện vuốt thành công, kéo cao su, cộng dồn trackpad, kiểm giới hạn năm.
- `src/calendar/swipe.test.ts` (mới) - Unit test cho `swipe.ts`.
- `src/calendar/range.ts` - Có sẵn `shiftDate(view, date, ±1)`, dùng để tính trang trước/sau khi kiểm giới hạn năm.
- `src/hooks/useCalendarRoute.ts` - Có sẵn `goPrev`/`goNext` và quy tắc năm 1900–2100 (`isValidDate`). Có thể cần export quy tắc năm để `swipe.ts` dùng lại.

### Hook nhận vuốt

- `src/hooks/useSwipeNavigation.ts` (mới) - Gắn Pointer Events và `wheel` lên `<main>`, lọc vùng không nhận vuốt, chặn click sau vuốt, điều khiển hiệu ứng.
- `src/hooks/useSwipeNavigation.test.tsx` (mới) - Component test cho hook.
- `src/hooks/useMediaQuery.ts` - Dùng cho `(display-mode: standalone)`, `(prefers-reduced-motion: reduce)`, `(pointer: coarse)`.
- `src/hooks/useKeyboardShortcuts.ts` - Mẫu tham khảo cách kiểm tra hộp thoại đang mở và ô nhập liệu.

### Gắn vào trang lịch

- `src/pages/CalendarPage.tsx` - Thêm `ref` cho `<main>`, bọc `<View />`, gắn hook, cuộn về đầu khi đổi `date`, gắn `SwipeHint`, gửi analytics phím mũi tên.
- `src/pages/CalendarPage.module.css` - `touch-action: pan-y`, `overscroll-behavior-x: none` cho `.main`; class cho phần tử bọc nội dung.
- `src/pages/CalendarPage.test.tsx` (mới, nếu chưa có) - Test cuộn về đầu khi đổi ngày, giữ vị trí khi đổi chế độ xem.
- `src/App.test.tsx` - Kiểm tra test cũ không vỡ sau khi đổi cấu trúc `<main>`.
- `src/views/DayView/DayView.test.tsx`, `src/views/MonthView/MonthView.test.tsx`, `src/views/WeekView/WeekView.test.tsx` - Chạy lại để chắc không vỡ.

### Gợi ý lần đầu

- `src/components/SwipeHint/SwipeHint.tsx` (mới) - Component gợi ý vuốt, hiện một lần.
- `src/components/SwipeHint/SwipeHint.module.css` (mới) - Style khung kính mờ, vị trí trên thanh tab, hiệu ứng tay lắc.
- `src/components/SwipeHint/SwipeHint.test.tsx` (mới) - Component test cho gợi ý.
- `src/components/Welcome/Welcome.tsx` - Mẫu tham khảo đọc/ghi `localStorage` an toàn.
- `src/styles/theme.css` - Class kính mờ, biến màu và quy tắc `prefers-reduced-motion` có sẵn.
- `src/styles/textSize.ts` - `iconSize()` để icon theo cỡ chữ người dùng chọn.

### Analytics và hướng dẫn

- `src/analytics.ts` - Hàm `track()` có sẵn.
- `src/components/layout/AppHeader.tsx` - Nút ‹ › gửi `nav_button` với `input: 'button'`.
- `src/components/layout/AppHeader.test.tsx` (mới, nếu cần) - Test nút gửi đúng sự kiện analytics.
- `src/pages/Settings/ShortcutSection.tsx` - Thêm dòng hướng dẫn vuốt ngang.

### E2E

- `e2e/swipe.spec.ts` (mới) - Vuốt trên project `mobile` (Pixel 7) và `iphone` (iPhone 15).
- `e2e/fixtures.ts` - Có thể thêm helper `swipe(page, direction)` và helper tắt gợi ý (đặt sẵn khóa `localStorage`) cho các spec khác.
- `e2e/a11y.spec.ts` - Thêm trường hợp axe khi gợi ý đang hiện.
- `e2e/mobile-layout.spec.ts`, `e2e/user-stories.spec.ts`, `e2e/visual-default.spec.ts` - Có thể vỡ vì gợi ý mới che màn hình; đặt sẵn khóa `hana:swipe-hint-seen` trước khi chạy.
- `playwright.config.ts` - Các project `mobile`, `iphone` đã có `hasTouch`.

### Notes

- Unit test đặt cạnh file được test (ví dụ `swipe.ts` và `swipe.test.ts` cùng thư mục).
- Chạy unit test: `npm test` (tất cả) hoặc `npx vitest run src/hooks/useSwipeNavigation.test.tsx` (một file). Test E2E: `npm run test:e2e`.
- Kiểm tra cuối: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`.
- jsdom không có `matchMedia`, `setPointerCapture`, `element.animate`. Trong test phải mock các hàm này (xem `src/test/setup.ts`).
- Quy tắc vàng: **không `setState` mỗi `pointermove`**. Ghi `transform` thẳng vào `style` qua `ref` trong `requestAnimationFrame`.
- Số yêu cầu (FR n) trong task là số thứ tự trong `tasks/prd-swipe-navigation.md`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Tạo nhánh cho tính năng
  - [x] 0.1 Từ `main` mới nhất, tạo và chuyển sang nhánh `git checkout -b feature/swipe-navigation`.

- [x] 1.0 Logic cử chỉ dạng hàm thuần (`src/calendar/swipe.ts`): khóa hướng, điều kiện vuốt thành công (25% / vuốt nhanh / kéo ngược), kéo cao su, cộng dồn trackpad, kiểm giới hạn năm `canPrev`/`canNext`, kèm unit test
  - [x] 1.1 Tạo `src/calendar/swipe.ts` với các hằng số có comment tiếng Việt: `LOCK_DISTANCE = 10`, `EDGE_GUARD = 24`, `DISTANCE_RATIO = 0.25`, `MIN_FLING_DISTANCE = 40`, `FLING_VELOCITY = 0.5`, `VELOCITY_WINDOW_MS = 100`, `TRACKPAD_THRESHOLD = 80`, `TRACKPAD_IDLE_MS = 300`, `SLIDE_MS = 150` (trượt ra, trượt vào mỗi bước), `SNAP_BACK_MS = 200`.
  - [x] 1.2 Viết `lockDirection(dx, dy): 'horizontal' | 'vertical' | null`. Trả `null` khi `Math.hypot(dx, dy) < LOCK_DISTANCE`; `'horizontal'` khi `|dx| > |dy|`; còn lại `'vertical'`. Góc đúng 45° (`|dx| === |dy|`) tính là dọc, để ưu tiên cuộn (FR 13).
  - [x] 1.3 Viết `velocityOf(samples)`: nhận mảng `{ x, t }` (vị trí ngang và thời điểm của các lần `pointermove`) và trả vận tốc ngang (px/ms) tính trên các mẫu nằm trong `VELOCITY_WINDOW_MS` cuối. Ít hơn 2 mẫu thì trả 0.
  - [x] 1.4 Viết `isSwipeCommitted({ dx, velocity, width })`:
    - Trả `false` nếu `velocity` ngược dấu với `dx` và `|velocity|` đáng kể (> 0.1 px/ms). Đây là trường hợp kéo ngược (FR 16).
    - Trả `true` nếu `|dx| >= width * DISTANCE_RATIO`, hoặc `|velocity| >= FLING_VELOCITY` và `|dx| >= MIN_FLING_DISTANCE` (FR 15).
  - [x] 1.5 Viết `directionOf(dx): 'next' | 'prev'`: `dx < 0` (ngón tay đi sang trái) là `'next'`, `dx > 0` là `'prev'`.
  - [x] 1.6 Viết `rubberBand(dx) => dx / 3` (FR 23).
  - [x] 1.7 Viết `createTrackpadAccumulator()` trả object `{ push(deltaX, deltaY, time, ctrlOrMeta): 'next' | 'prev' | null }` (FR 27–30):
    - Bỏ qua sự kiện có `ctrlOrMeta` hoặc `|deltaX| <= |deltaY|`.
    - Cộng dồn `deltaX`; khi `|tổng| > TRACKPAD_THRESHOLD` thì trả hướng (`deltaX > 0` là `'next'`), reset tổng và chuyển sang trạng thái "khóa".
    - Khi đang khóa, bỏ qua mọi sự kiện cho tới khi khoảng cách giữa hai sự kiện liên tiếp `>= TRACKPAD_IDLE_MS` thì mở khóa.
    - Nếu hai sự kiện cách nhau `>= TRACKPAD_IDLE_MS` khi chưa khóa, reset tổng (cú vuốt mới).
    - Nhận `time` qua tham số (không gọi `Date.now()` bên trong) để test dễ.
  - [x] 1.8 Viết `canShift(view, date, delta): boolean`: gọi `shiftDate(view, date, delta)` từ `range.ts` rồi kiểm năm trong 1900–2100. Nếu cần, tách quy tắc năm trong `useCalendarRoute.ts` thành hàm export (ví dụ `isSupportedYear(year)`) và dùng chung ở cả hai nơi, không chép lại số 1900/2100 (FR 6).
  - [x] 1.9 Viết `isEdgeStart(clientX, viewportWidth, standalone): boolean`: `standalone` true thì luôn trả `false`; ngược lại trả `true` khi `clientX < EDGE_GUARD` hoặc `clientX > viewportWidth - EDGE_GUARD` (FR 10).
  - [x] 1.10 Viết `src/calendar/swipe.test.ts`:
    - `lockDirection` ở các góc 0°, 30°, 45°, 60°, 90° và khi quãng < 10px.
    - `isSwipeCommitted`: đúng 25%, dưới 25%; vuốt nhanh đủ quãng 40px và thiếu quãng; kéo ngược dù quãng > 25%.
    - `velocityOf`: bỏ mẫu cũ hơn 100ms; ít mẫu thì trả 0.
    - `rubberBand`, `directionOf`.
    - Trackpad accumulator: chuỗi sự kiện ngang đổi đúng 1 lần; quán tính tiếp theo bị bỏ qua; nghỉ 300ms thì cú vuốt mới đổi được; `ctrlOrMeta` và sự kiện dọc bị bỏ qua; hướng âm/dương đúng.
    - `canShift`: `1900-01-01` xem Ngày không lùi được; `2100-12-31` không tiến được; xem Tháng `2100-12-xx` không tiến được; ngày bình thường thì được.
    - `isEdgeStart`: sát mép trái/phải, giữa màn hình, và `standalone = true`.
  - [x] 1.11 Chạy `npx vitest run src/calendar` và `npm run typecheck`, sửa đến khi qua hết.

- [x] 2.0 Hook `useSwipeNavigation`: nhận vuốt bằng ngón tay/bút qua Pointer Events, lọc vùng không nhận vuốt (mép 24px trừ khi chạy PWA, ô nhập, vùng cuộn ngang, `data-no-swipe`, hộp thoại đang mở), hủy khi chạm 2 ngón hoặc `pointercancel`, chặn click sau vuốt, nhận vuốt 2 ngón trên trackpad qua `wheel`, kèm component test
  - [x] 2.1 Tạo `src/hooks/useSwipeNavigation.ts`. Chữ ký gợi ý:

    ```ts
    useSwipeNavigation({
      containerRef,   // <main>: nơi gắn listener
      contentRef,     // phần tử bọc <View />: nơi đặt transform
      canPrev, canNext,
      onNavigate,     // (direction: 'next' | 'prev', input: 'touch' | 'trackpad') => void
      enabled,        // false khi có hộp thoại/bảng tìm kiếm mở
    })
    ```

    Lưu các giá trị mới nhất vào `ref` (giống `useKeyboardShortcuts`) để listener không phải gắn lại mỗi lần render.
  - [x] 2.2 Viết hàm `shouldIgnoreStart(event)`, trả `true` (bỏ qua cú chạm) khi:
    - `pointerType === 'mouse'` (FR 12).
    - `!event.isPrimary`.
    - `isEdgeStart(...)` với `standalone` lấy từ `useMediaQuery('(display-mode: standalone)')` (FR 10).
    - `event.target.closest('input, textarea, select, [contenteditable], [data-no-swipe]')` tìm thấy phần tử (FR 11).
    - Một phần tử tổ tiên (từ `target` lên tới `<main>`, không tính `<main>`) có `overflow-x` là `auto`/`scroll` và `scrollWidth > clientWidth` (FR 11).
    - Đang có `[role="dialog"][aria-modal="true"]` trong `document`, hoặc `enabled === false` (FR 9).
  - [x] 2.3 Xử lý `pointerdown`: nếu không bỏ qua thì lưu điểm bắt đầu, `pointerId`, thời điểm, mảng mẫu vận tốc, và chiều rộng `<main>` (`getBoundingClientRect().width`). Trạng thái lúc này là "chờ khóa hướng".
  - [x] 2.4 Theo dõi số ngón đang chạm (tập hợp `pointerId` đang xuống). Có ngón thứ 2 thì hủy cú vuốt đang diễn ra và bật về (FR 14).
  - [x] 2.5 Xử lý `pointermove` (chỉ với đúng `pointerId` đã lưu):
    - Khi đang chờ khóa: gọi `lockDirection`. `'vertical'` thì bỏ cả cú chạm (không làm gì thêm cho tới `pointerup`). `'horizontal'` thì chuyển sang "đang vuốt" và gọi `containerRef.current.setPointerCapture(pointerId)` (FR 13).
    - Khi đang vuốt: thêm mẫu vận tốc, tính `dx`; nếu hướng đi không được phép (`canNext`/`canPrev` là false) thì dùng `rubberBand(dx)`; xin một `requestAnimationFrame` để ghi `contentRef.current.style.transform = translateX(...)`. Không gọi `setState` (FR 20, 23, 25).
    - Bật "Giảm chuyển động" thì không ghi `transform` khi đang kéo (FR 24).
  - [x] 2.6 Xử lý `pointerup`: nếu đang vuốt, tính `isSwipeCommitted`. Thành công **và** hướng được phép thì chạy hiệu ứng thành công (task 3.4) rồi gọi `onNavigate(direction, 'touch')`; không thì bật về (task 3.5). Luôn đặt cờ "vừa vuốt" (FR 18).
  - [x] 2.7 Xử lý `pointercancel`: bật về chỗ cũ, không đổi trang, xóa trạng thái (FR 17). Nhớ `releasePointerCapture` nếu đã capture.
  - [x] 2.8 Chặn click sau vuốt: gắn listener `click` ở **capture phase** (`{ capture: true }`) trên `<main>`. Nếu cờ "vừa vuốt" đang bật thì gọi `preventDefault()` + `stopPropagation()` và tắt cờ. Tắt cờ luôn ở `pointerdown` kế tiếp, để một click không đến (một số trình duyệt không bắn click sau khi kéo) không chặn nhầm lần bấm sau (FR 18, 19).
  - [x] 2.9 Xử lý `wheel` (listener passive, **không** `preventDefault`, FR 32): nếu `enabled` và không có hộp thoại, đưa `deltaX`, `deltaY`, `event.timeStamp`, `event.ctrlKey || event.metaKey` vào accumulator từ task 1.7. Có hướng trả về và hướng đó được phép thì chạy hiệu ứng trượt vào (task 3.6) và gọi `onNavigate(direction, 'trackpad')` (FR 27–31, 33).
  - [x] 2.10 Dọn dẹp khi unmount: gỡ mọi listener, hủy `requestAnimationFrame` đang chờ, hủy animation đang chạy, đặt `transform` về rỗng.
  - [x] 2.11 Trả về từ hook một bộ đếm/tín hiệu "vừa vuốt thành công" (ví dụ `swipeCount` tăng mỗi lần đổi trang bằng vuốt). `SwipeHint` dùng tín hiệu này để tự ẩn. Chỉ `setState` **một lần** sau khi đổi trang, không phải trong lúc kéo.
  - [x] 2.12 Viết `src/hooks/useSwipeNavigation.test.tsx`: dựng component test có `<main>` + phần tử nội dung, mock `matchMedia`, `setPointerCapture`, `releasePointerCapture`, `element.animate` (hoặc tắt hiệu ứng bằng giả lập "Giảm chuyển động" để `onNavigate` gọi ngay). Kiểm:
    - Vuốt trái 150px trên khung rộng 400px thì gọi `onNavigate('next', 'touch')`; vuốt phải thì `'prev'`.
    - Vuốt 50px chậm thì không gọi.
    - Kéo dọc (dy > dx) thì không gọi.
    - `pointerType: 'mouse'` thì không gọi.
    - Bắt đầu tại `clientX = 10` thì không gọi; cùng thao tác khi `(display-mode: standalone)` khớp thì có gọi.
    - Bắt đầu trên `input` hoặc phần tử `data-no-swipe` thì không gọi.
    - Có `[role="dialog"][aria-modal="true"]` trong DOM thì không gọi.
    - Ngón thứ 2 chạm giữa chừng thì không gọi.
    - `pointercancel` thì không gọi.
    - `canNext = false` thì vuốt trái không gọi.
    - Click ngay sau vuốt bị chặn (handler `onClick` của con không chạy); tap (di chuyển < 10px) thì handler vẫn chạy.
    - Chuỗi 10 sự kiện `wheel` ngang liên tiếp chỉ gọi 1 lần với `'trackpad'`; `wheel` có `ctrlKey` không gọi.
  - [x] 2.13 Chạy `npx vitest run src/hooks` và `npm run typecheck`.

- [ ] 3.0 Gắn vào `CalendarPage` và làm hiệu ứng: bọc `<View />` để dịch chuyển, nội dung chạy theo ngón tay, trượt ra/vào hoặc bật về chỗ cũ, kéo cao su ở giới hạn năm, giảm chuyển động, CSS `touch-action` / `overscroll-behavior-x`, cuộn `<main>` về đầu khi đổi ngày
  - [x] 3.1 Trong `CalendarPage.tsx`: thêm `mainRef` cho `<main>` và bọc `<View {...viewProps} />` trong `<div ref={contentRef} className={styles.swipeContent}>`. Kiểm tra CSS hiện có của `.main > *` (dòng `flex-shrink: 0` trong `CalendarPage.module.css`) vẫn áp đúng cho con mới. Nếu cần, chuyển quy tắc đó xuống `.swipeContent` để bố cục điện thoại không đổi.
  - [x] 3.2 Trong `CalendarPage.module.css`: thêm `touch-action: pan-y` và `overscroll-behavior-x: none` cho `.main`; thêm `.swipeContent` với `will-change: transform` **chỉ khi đang vuốt** (đặt bằng class/thuộc tính `data-swiping`, không để cố định vì tốn bộ nhớ).
  - [x] 3.3 Gọi `useSwipeNavigation` trong `CalendarPage`:
    - `canPrev = canShift(view, date, -1)`, `canNext = canShift(view, date, 1)`.
    - `enabled = !searchOpen`.
    - `onNavigate` gọi `route.goNext()` hoặc `route.goPrev()` và gửi analytics (task 5.1).
  - [x] 3.4 Làm hiệu ứng **thành công** (FR 21), dùng `element.animate()`:
    1. Trượt nội dung cũ từ vị trí hiện tại ra `translateX(∓100%)` trong `SLIDE_MS`, `ease-out`.
    2. Khi xong, gọi `onNavigate`, đặt ngay nội dung ở phía đối diện (`translateX(±100%)`).
    3. Sau khi React vẽ trang mới (đợi 1 `requestAnimationFrame`), trượt về `translateX(0)` trong `SLIDE_MS`.
    4. Xong thì xóa `transform`.

    Tổng ≤ 300ms. Nếu người dùng chạm lại khi animation đang chạy, `finish()` animation cũ trước khi bắt đầu cú vuốt mới.
  - [x] 3.5 Làm hiệu ứng **bật về** (FR 22, 23): từ vị trí hiện tại về `translateX(0)` trong `SNAP_BACK_MS`, `ease-out`, xong thì xóa `transform`.
  - [x] 3.6 Làm hiệu ứng **trượt vào cho trackpad** (FR 31): gọi `onNavigate` ngay, rồi chạy bước 2–4 của task 3.4.
  - [x] 3.7 Giảm chuyển động (FR 24, 31): khi `useMediaQuery('(prefers-reduced-motion: reduce)')` khớp, bỏ mọi animation, vuốt thành công thì gọi `onNavigate` ngay.
  - [x] 3.8 Phần nền lộ ra khi nội dung dịch đi phải là màu nền của `<main>` (FR 26). Kiểm cả chế độ sáng và tối; nếu `.main` trong suốt (nền kính mờ) mà trông lỗi thì thêm `overflow-x: hidden` cho `.main` để nội dung trượt ra không làm hiện thanh cuộn ngang.
  - [x] 3.9 Cuộn về đầu (FR 34): trong `CalendarPage`, thêm `useEffect(() => { mainRef.current?.scrollTo({ top: 0, behavior: 'instant' }) }, [date])`. Chỉ phụ thuộc `date`, **không** thêm `view`. Bỏ qua lần render đầu tiên (dùng `ref` đánh dấu) để mở app bằng link có `#hash` vẫn hoạt động như cũ. Kiểm lại `useOpenOccurrenceFromUrl` không bị ảnh hưởng.
  - [x] 3.10 Kiểm tra nút "Hôm nay", mini-calendar trong sidebar, bộ chọn ngày ở header và kết quả tìm kiếm đều cuộn về đầu (chúng đều đổi `date` qua route, nên task 3.9 tự bao). Đổi Ngày → Tháng cùng ngày thì **không** cuộn.
  - [x] 3.11 Viết/cập nhật test `CalendarPage` (có thể đặt trong `src/App.test.tsx` nếu `CalendarPage` đang được test ở đó):
    - Đặt `scrollTop` của `<main>` = 500, bấm nút › thì `scrollTo` được gọi với `top: 0`.
    - Đổi chế độ xem thì không gọi.
    - Mock `scrollTo` vì jsdom không cuộn thật.
  - [x] 3.12 Chạy `npm test` và sửa các test cũ bị vỡ vì cấu trúc DOM mới (thêm `div` bọc).
  - [ ] 3.13 Chạy `npm run dev`, mở bằng Chrome DevTools chế độ thiết bị (Pixel 7, bật touch) và thử tay: vuốt, bật về, kéo cao su ở `/day/2100-12-31`, cuộn dọc lịch vạn niên, bấm ô ngày sau khi vuốt. Ghi lại Performance khi vuốt với CPU throttling 4x để chắc không giật (Goal 3).

- [x] 4.0 Gợi ý vuốt lần đầu (`SwipeHint`): điều kiện hiện (màn cảm ứng, chưa thấy, không có hộp thoại, chưa tự vuốt), hiện sau 1 giây, tự ẩn (vuốt / bấm × / 8 giây), lưu `localStorage`, a11y, kèm component test
  - [x] 4.1 Tạo `src/components/SwipeHint/SwipeHint.tsx`. Export hằng số `SWIPE_HINT_STORAGE_KEY = 'hana:swipe-hint-seen'`. Viết `hasSeenHint()` và `markHintSeen()` bọc `try/catch` theo mẫu `Welcome.tsx`: đọc lỗi thì coi như **đã thấy** (FR 46).
  - [x] 4.2 Props: `view: ViewMode`, `swipeCount: number` (từ task 2.11). Trạng thái: `'waiting' | 'visible' | 'hidden'`.
  - [x] 4.3 Điều kiện hiện (FR 39):
    - `useMediaQuery('(pointer: coarse)')` khớp.
    - `!hasSeenHint()`.
    - `swipeCount === 0` lúc bắt đầu chờ.
    - Không có `[role="dialog"][aria-modal="true"]` và bảng tìm kiếm đóng: nhận thêm prop `blocked: boolean` từ `CalendarPage` (`searchOpen`), và kiểm hộp thoại bằng `MutationObserver` trên `document.body` hoặc kiểm lại mỗi lần hẹn giờ chạy.
  - [x] 4.4 Hẹn giờ 1 giây (FR 40): chỉ bắt đầu đếm khi mọi điều kiện đã đủ. Nếu trong lúc đếm có hộp thoại mở thì hủy và chờ lại. Hết giờ thì chuyển sang `'visible'` và gọi `markHintSeen()` **ngay lúc hiện** (FR 45).
  - [x] 4.5 Tự ẩn (FR 44) khi xảy ra điều đầu tiên trong các điều sau:
    - `swipeCount` tăng: `reason: 'swipe'`.
    - Bấm ×: `reason: 'close'`.
    - Hẹn giờ 8 giây từ lúc hiện: `reason: 'timeout'`.

    Mỗi lần ẩn gửi `track('swipe_hint_dismissed', { reason })` **đúng một lần** (FR 48). Nếu người dùng vuốt trước khi gợi ý kịp hiện thì không hiện nữa và không gửi analytics.
  - [x] 4.6 Nội dung (FR 41): icon `HandSwipeLeft` từ `@phosphor-icons/react` với `size={iconSize(20)}` và `aria-hidden="true"`, chữ "Vuốt ngang để sang ngày khác" / "tuần khác" / "tháng khác" theo `view`. Nút × dùng class `btn btn-ghost btn-icon` có sẵn, icon `X`, `aria-label="Đóng gợi ý"`.
  - [x] 4.7 A11y (FR 47): khung ngoài có `role="status"`; **không** gọi `focus()` khi hiện; nút × vẫn tới được bằng Tab.
  - [x] 4.8 Tạo `SwipeHint.module.css` (FR 42, 43, Design):
    - `position: fixed` (hoặc `absolute` trong `.body`), căn giữa ngang, đáy cách mép trên thanh tab một khoảng. Dùng biến chiều cao tab bar/safe area đang có trong `TabBar.module.css`/`theme.css`, không tự đặt số px mới.
    - Nền kính mờ theo class/biến sẵn có trong `theme.css`, bo góc viên thuốc, kích thước theo `--ui-scale`.
    - Nút × có vùng bấm ≥ 44×44px.
    - Khung ngoài `pointer-events: none`, riêng khung gợi ý `pointer-events: auto`, để phần lịch xung quanh vẫn bấm được (FR 49).
    - Hiện: mờ dần + trượt lên ~200ms; ẩn: mờ dần. Icon tay lắc trái–phải 2 lần bằng `@keyframes`.
    - Trong `@media (prefers-reduced-motion: reduce)` tắt mọi animation.
  - [x] 4.9 Trên màn rộng (không có tab bar), gợi ý đặt ở đáy vùng `<main>` và không che `CreateFab`. Kiểm cả iPad dọc/ngang.
  - [x] 4.10 Gắn `<SwipeHint view={view} swipeCount={swipeCount} blocked={searchOpen} />` vào `CalendarPage`.
  - [x] 4.11 Viết `SwipeHint.test.tsx` (dùng `vi.useFakeTimers()`, mock `matchMedia`, mock `track`):
    - Hiện sau 1 giây khi `(pointer: coarse)` khớp và chưa có khóa; ghi khóa ngay lúc hiện.
    - Không hiện khi đã có khóa, khi `(pointer: coarse)` không khớp, khi `localStorage.getItem` ném lỗi.
    - Có hộp thoại `aria-modal` trong DOM thì chờ; gỡ hộp thoại thì 1 giây sau mới hiện.
    - `blocked = true` thì chờ.
    - Bấm × thì ẩn và gửi `reason: 'close'`; sau 8 giây thì `'timeout'`; `swipeCount` tăng thì `'swipe'`; mỗi trường hợp gửi đúng 1 lần.
    - Chữ đổi theo `view`.
    - Render lại sau khi ẩn (mount mới) thì không hiện nữa.
  - [x] 4.12 Chạy `npx vitest run src/components/SwipeHint`.

- [x] 5.0 Analytics và hướng dẫn: `swipe_navigate`, `nav_button` cho nút ‹ › và phím mũi tên, `swipe_hint_dismissed`, thêm dòng hướng dẫn vuốt trong `Settings/ShortcutSection`
  - [x] 5.1 Trong `onNavigate` của `CalendarPage` (task 3.3), gửi `track('swipe_navigate', { view, direction, input })` với `input` là `'touch'` hoặc `'trackpad'` (FR 36).
  - [x] 5.2 Trong `AppHeader.tsx`, bọc `onClick` của nút ‹ › để gửi `track('nav_button', { view, direction: 'prev' | 'next', input: 'button' })` rồi mới gọi `onPrev`/`onNext` (FR 37). Không đổi props của `AppHeader`.
  - [x] 5.3 Trong `CalendarPage.tsx`, phím `ArrowLeft`/`ArrowRight` của `useKeyboardShortcuts` gửi `track('nav_button', { view, direction, input: 'keyboard' })` rồi gọi `route.goPrev`/`route.goNext` (FR 37).
  - [x] 5.4 Kiểm lại `swipe_hint_dismissed` đã gửi ở task 4.5 (FR 48).
  - [x] 5.5 (Đã làm: thêm một đoạn `field-hint` dưới đoạn giới thiệu thay vì đặt "Vuốt ngang" vào ô `<kbd>`, vì vuốt không phải phím. Mục Phím tắt chỉ hiện trên máy tính; người dùng điện thoại được nhắc bằng `SwipeHint`.) Trong `ShortcutSection.tsx`, nhóm "Lịch", thêm dòng sau dòng `←`/`→`: `{ keys: ['Vuốt ngang'], label: 'Trên lịch (hoặc vuốt 2 ngón trên trackpad): ngày, tuần hoặc tháng trước / sau' }` (FR 38). Kiểm chữ "Vuốt ngang" hiển thị đẹp trong ô phím; nếu ô `<kbd>` quá hẹp thì chỉnh CSS hoặc tách dòng này ra khỏi danh sách phím. Sửa comment đầu mảng `GROUPS` nếu cần.
  - [x] 5.6 Viết test (trong test có sẵn của header/CalendarPage, hoặc `AppHeader.test.tsx` mới): mock `track`, bấm nút › thì `track` được gọi với `nav_button` và `input: 'button'`; nhấn `ArrowRight` thì `input: 'keyboard'`.
  - [x] 5.7 Chạy `npm test`.

- [ ] 6.0 Kiểm thử E2E (Playwright có touch), axe, thử tay trên máy thật và kiểm tra cuối (lint, typecheck, format, build)
  - [x] 6.1 Trong `e2e/fixtures.ts`, thêm helper đặt sẵn `localStorage['hana:swipe-hint-seen'] = '1'` qua `page.addInitScript`. Dùng helper này trong các spec cũ (`mobile-layout`, `user-stories`, `visual-default`, `a11y`, `text-size`) để gợi ý không che màn hình và không làm lệch ảnh so sánh.
  - [x] 6.2 Trong `e2e/fixtures.ts`, thêm helper `swipe(page, locator, direction)`. Dùng CDP `Input.dispatchTouchEvent` (chỉ Chromium), hoặc `locator.dispatchEvent('pointerdown' | 'pointermove' | 'pointerup', { pointerType: 'touch', ... })` qua nhiều bước. Chọn cách chạy được trên cả project `mobile` và `iphone` (WebKit không có CDP, nên ưu tiên `dispatchEvent`).
  - [x] 6.3 Viết `e2e/swipe.spec.ts` (chỉ chạy ở project `mobile` và `iphone`):
    - Mở `/day/2026-09-15`, vuốt trái thì URL thành `/day/2026-09-16`; vuốt phải hai lần thì `/day/2026-09-14`.
    - Mở `/month/2026-09-15`, vuốt trái thì tháng 10.
    - Mở `/week/...`, vuốt trái thì tiến 7 ngày.
    - Cuộn dọc lịch vạn niên ở xem Ngày thì URL không đổi.
    - Cuộn xuống, vuốt sang ngày mới thì `<main>` về `scrollTop = 0`.
    - Vuốt xong không mở hộp thoại sự kiện dù điểm thả tay nằm trên chip sự kiện.
    - Mở `/day/2100-12-31`, vuốt trái thì URL không đổi.
  - [x] 6.4 Thêm test gợi ý trong `swipe.spec.ts`: lần đầu (không đặt khóa) gợi ý hiện; vuốt thì gợi ý ẩn; tải lại trang thì không hiện nữa.
  - [x] 6.5 Trong `e2e/a11y.spec.ts`: thêm một lượt axe khi gợi ý đang hiện, ở cả chế độ sáng và tối (Goal 7).
  - [x] 6.6 Chạy `npm run test:e2e`, sửa đến khi qua hết; cập nhật ảnh so sánh chỉ khi thay đổi là cố ý và đã xem ảnh khác biệt.
  - [ ] 6.7 Thử tay trên máy thật và ghi kết quả vào PR:
    - iPhone Safari trong tab thường: vuốt từ mép trái vẫn Back trình duyệt.
    - iPhone PWA đã cài: vuốt sát mép vẫn đổi ngày.
    - Android Chrome.
    - iPad.
    - MacBook Chrome (trackpad đổi đúng 1 trang, không Back).
    - MacBook Safari (trackpad đổi trang; Back của Safari chấp nhận theo FR 32).
    - Máy tính dùng chuột: kéo chuột bôi đen chữ bình thường, không đổi trang.
  - [x] 6.8 Chạy `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`. Sửa hết lỗi.
  - [ ] 6.9 Đánh dấu hoàn thành các task trong file này, tạo PR vào `main` với mô tả tóm tắt, ảnh/video vuốt trên điện thoại và kết quả thử tay ở 6.7.
