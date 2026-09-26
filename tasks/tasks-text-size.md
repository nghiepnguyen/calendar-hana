## Relevant Files

### Dữ liệu cài đặt

- `shared/types.ts` - Thêm kiểu `TextSize` và 2 trường `textSize`, `boldText` vào `Settings`.
- `src/data/defaultCategories.ts` - `createDefaultSettings()` thêm `textSize: 'default'`, `boldText: false`.
- `src/data/localRepository.ts` - `toSettings()` đã gộp với giá trị mặc định; chỉ cần kiểm tra người dùng cũ nhận đúng mặc định.
- `src/data/localRepository.test.ts` - Test bản ghi Settings cũ (thiếu 2 trường) đọc ra `'default'` / `false`.
- `src/data/firestoreRepository.ts` - `toSettings()` cũng gộp mặc định; kiểm tra `saveSettings` lưu đủ 2 trường.
- `src/data/firestoreRepository.emulator.test.ts` - Test lưu/đọc 2 trường mới qua Firestore emulator.
- `firestore.rules` - Kiểm tra lại rule của tài liệu user cho phép 2 khóa mới trong `settings`.
- `src/firebase/rules.emulator.test.ts` - Test rule nếu có thay đổi.
- `src/data/exportImport.ts` - Xuất 2 trường; khi nhập kiểm tra giá trị hợp lệ.
- `src/data/exportImport.test.ts` - Test nhập giá trị hợp lệ và không hợp lệ.

### Hạ tầng phóng to

- `src/styles/textSize.ts` (mới) - Hằng số dùng chung: danh sách mức, tỉ lệ (`1`, `1.25`, `1.5`), tên hiển thị, khóa `localStorage`.
- `src/components/TextSizeController.tsx` (mới) - Đặt `data-text-size` / `data-bold-text` lên `<html>` và ghi bản sao vào `localStorage`. Làm theo mẫu `ThemeController.tsx`.
- `src/components/TextSizeController.test.tsx` (mới) - Test đặt/bỏ thuộc tính và ghi `localStorage`, kể cả khi `localStorage` ném lỗi.
- `src/components/ThemeController.tsx` - Mẫu tham khảo.
- `src/App.tsx` hoặc `src/main.tsx` - Gắn `TextSizeController` cạnh `ThemeController`.
- `index.html` - Script inline trong `<head>` đọc `localStorage` và đặt thuộc tính trước lần vẽ đầu.
- `src/styles/theme.css` - Biến `--ui-scale`, quy tắc chữ đậm, `font-size` của các class dùng chung (`.segmented`, `.switch`, nút, ô nhập).

### Chuyển CSS và icon theo tỉ lệ

- `src/**/*.module.css` - Toàn bộ CSS module có `font-size`, `padding`, `gap`, `min-height`, `width`/`height` của nút/icon viết bằng px.
- `scripts/scale-css.mjs` (đã chạy một lần rồi xóa) - Đổi 667 giá trị px sang `calc(Npx * var(--ui-scale))`.
- Các file có icon Phosphor `size={số}`, ví dụ `src/components/CreateFab/CreateFab.tsx`, `src/components/EventChip/EventChip.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TabBar.tsx`, `src/components/layout/AppHeader.tsx`, `src/pages/Settings/SettingsPage.tsx`... (khoảng 20 file, tìm bằng `grep -rn "size={" src`).

### Bố cục ở cỡ chữ lớn

- `src/hooks/useElementWidth.ts` (mới) - Hook đo chiều rộng thật của phần tử bằng `ResizeObserver` (chỉ cần chiều rộng).
- `src/hooks/useElementWidth.test.tsx` (mới) - Unit test hook.
- `src/views/MonthView/MonthView.tsx` - Ô ngày chuyển sang chế độ chỉ icon khi thiếu chỗ, hiện "+N".
- `src/views/MonthView/MonthView.module.css` - Style ô ngày, hàng icon sự kiện.
- `src/views/MonthView/MonthView.test.tsx` - Test chế độ chip có chữ và chế độ chỉ icon.
- `src/components/EventChip/eventLabel.ts` (mới) - `eventLabel()` / `isLunarEvent()` dùng chung cho chip và chấm sự kiện.
- `src/views/MonthView/MonthView.tsx` - `EventMarkers`: chấm màu danh mục (sự kiện âm lịch: icon mặt trăng), `role="img"` + tên sự kiện. Danh mục chưa có icon riêng nên dùng chấm màu.
- `src/components/layout/TabBar.tsx` - Ẩn nhãn khi thiếu chỗ, thêm `aria-label` cho mỗi tab.
- `src/components/layout/TabBar.module.css` - Style dạng chỉ icon, tab đang chọn vẫn nổi bật.
- `src/components/layout/TabBar.test.tsx` (mới) - Test ẩn/hiện nhãn theo chiều rộng thanh.
- `src/components/layout/AppHeader.module.css` - Mốc thu gọn header dịch theo tỉ lệ; header điện thoại xuống 2 dòng khi chữ to.
- `src/views/WeekView/`, `src/views/DayView/`, `src/pages/EventList/`, `src/components/EventForm/` - Rà chữ dài và cuộn ngang ở mức "Rất lớn".

### Mục "Cỡ chữ" (tab Hiển thị)

- `src/pages/Settings/TextSizeSection.tsx` (mới) - Nội dung tab: ô xem trước, segmented control, công tắc, nút đặt lại.
- `src/pages/Settings/TextSizeSection.module.css` (mới) - Style ô xem trước.
- `src/pages/Settings/TextSizeSection.test.tsx` (mới) - Component test.
- `src/pages/Settings/SettingsPage.tsx` - Mục Cỡ chữ nằm cuối tab Hiển thị; `anchors` cho link cũ `#text-size`.
- `src/pages/Settings/Toggle.tsx` (mới) - Dòng cài đặt có công tắc, tách từ `SettingsPage.tsx` để dùng chung.
- `src/App.test.tsx` - Cập nhật nếu có test đếm/đặt tên các tab Cài đặt.

### Kiểm thử end-to-end

- `e2e/text-size.spec.ts` (mới) - US-T1 đến US-T6, không cuộn ngang và vùng bấm ≥ 44px ở 360px / 1280px cả 3 mức, lưới Tháng chỉ icon, thanh tab chỉ icon, script chống nháy.
- `e2e/visual-default.spec.ts` (mới) + `e2e/visual-default.spec.ts-snapshots/` - So ảnh mức Mặc định.
- `e2e/a11y.spec.ts` - Chạy axe ở cả 3 mức, sáng và tối, và khi rê chuột lên ô lưới Tháng.
- `e2e/fixtures.ts` - `chooseTextSize()`: chọn cỡ chữ qua Cài đặt (ghi `localStorage` trước không đủ, vì Settings mặc định của DB mới ghi đè bản sao).

### Notes

- Unit test đặt cạnh file được test (ví dụ `TextSizeController.tsx` và `TextSizeController.test.tsx` cùng thư mục).
- Chạy unit test: `npm test` (tất cả) hoặc `npx vitest run src/pages/Settings` (một thư mục).
- Test Firestore: `npm run test:emulator`. Test E2E: `npm run test:e2e`.
- Kiểm tra cuối: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`.
- Quy tắc vàng: ở mức "Mặc định" (`--ui-scale: 1`) mọi `calc(Npx * var(--ui-scale))` phải ra đúng `Npx`. Chụp ảnh các màn chính **trước khi sửa CSS** (task 3.1) để so sánh về sau.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Tạo nhánh cho tính năng
  - [x] 0.1 Từ `main` mới nhất, tạo và chuyển sang nhánh `git checkout -b feature/text-size`.

- [x] 1.0 Dữ liệu cài đặt: thêm `textSize` và `boldText` vào `Settings` (mặc định, người dùng cũ, đồng bộ Firestore, xuất/nhập) kèm unit test
  - [x] 1.1 Trong `shared/types.ts` thêm `export type TextSize = 'default' | 'large' | 'xlarge'` và 2 trường `textSize: TextSize`, `boldText: boolean` vào `Settings` (có comment tiếng Việt ngắn như các trường khác).
  - [x] 1.2 Trong `createDefaultSettings()` (`src/data/defaultCategories.ts`) thêm `textSize: 'default'`, `boldText: false`.
  - [x] 1.3 Chạy `npm run typecheck`, sửa mọi chỗ báo thiếu trường (fixture test, mock Settings...).
  - [x] 1.4 Viết test trong `localRepository.test.ts`: bản ghi Settings cũ không có 2 trường thì `getSettings()` trả `'default'` / `false` và các trường khác giữ nguyên (FR 2).
  - [x] 1.5 Viết test trong `firestoreRepository.emulator.test.ts`: `saveSettings({ textSize: 'xlarge', boldText: true })` rồi đọc lại đúng; tài liệu cũ thiếu trường đọc ra mặc định.
  - [x] 1.6 Kiểm tra `firestore.rules`: nếu rule giới hạn khóa hoặc kiểu dữ liệu của `settings` thì thêm 2 khóa mới (`textSize` là một trong 3 chuỗi, `boldText` là bool) và thêm test trong `rules.emulator.test.ts`. Nếu không giới hạn thì ghi chú lại và bỏ qua. (Đã kiểm tra: `users/{uid}` không giới hạn khóa, không cần sửa.)
  - [x] 1.7 Trong `exportImport.ts`, phần đọc settings khi nhập: chỉ nhận `textSize` nếu là `'default' | 'large' | 'xlarge'`, chỉ nhận `boldText` nếu là `boolean` (làm giống cách đang kiểm tra `theme`). Xuất thì đã có sẵn vì xuất cả object `settings`; kiểm tra lại.
  - [x] 1.8 Viết test trong `exportImport.test.ts`: nhập giá trị hợp lệ thì nhận; `textSize: 'huge'` hoặc `boldText: 'yes'` thì bỏ qua, giữ giá trị hiện tại (FR 4).

- [x] 2.0 Hạ tầng phóng to: biến `--ui-scale` và chữ đậm trong `theme.css`, controller đặt `data-text-size` / `data-bold-text` lên `<html>`, script chống nháy trong `index.html` dùng `localStorage`
  - [x] 2.1 Tạo `src/styles/textSize.ts` gồm: `TEXT_SIZES` (mảng 3 mức theo thứ tự), `TEXT_SIZE_SCALE` (`{ default: 1, large: 1.25, xlarge: 1.5 }`), `TEXT_SIZE_LABEL` (`Mặc định / Lớn / Rất lớn`), `TEXT_SIZE_STORAGE_KEY = 'hana:text-size'`, `BOLD_TEXT_STORAGE_KEY = 'hana:bold-text'`, và hàm `isTextSize(value): value is TextSize`.
  - [x] 2.2 Trong `theme.css` thêm vào `:root` biến `--ui-scale: 1`; thêm `:root[data-text-size='large'] { --ui-scale: 1.25 }` và `:root[data-text-size='xlarge'] { --ui-scale: 1.5 }`. Ghi comment giải thích biến ở đầu file cạnh các quy tắc bo góc.
  - [x] 2.3 Thêm quy tắc chữ đậm: khi `:root[data-bold-text]` thì chữ thường lên 500–600, chữ đã đậm (600–700) lên thêm một bậc nhưng tối đa 800 (FR 11). Gợi ý: định nghĩa các biến `--weight-regular`, `--weight-medium`, `--weight-bold` trong `:root`, ghi đè khi có `data-bold-text`, rồi thay các `font-weight` số cố định bằng biến (làm cùng lúc với task 3).
  - [x] 2.4 Tạo `TextSizeController.tsx` theo mẫu `ThemeController`: đọc `textSize`, `boldText` từ `useSettings()`; mức `default` thì **bỏ** thuộc tính `data-text-size`, mức khác thì đặt; `boldText` true thì đặt `data-bold-text=""`, false thì bỏ. Mỗi lần đổi, ghi 2 khóa `localStorage` (bọc `try/catch`). Khi Settings chưa tải xong (`undefined`) thì **không** làm gì, để giữ giá trị script inline đã đặt (FR 16).
  - [x] 2.5 Gắn `<TextSizeController />` cùng chỗ đang gắn `<ThemeController />`.
  - [x] 2.6 Trong `<head>` của `index.html`, **trước** thẻ `<script type="module">`, thêm script inline nhỏ: đọc 2 khóa `localStorage` trong `try/catch`, kiểm tra giá trị hợp lệ (`large` / `xlarge`, `'1'`), rồi đặt thuộc tính lên `document.documentElement` (FR 15). Không import gì, chỉ vài dòng JS thuần.
  - [x] 2.7 Kiểm tra `firebase.json` / header hosting và `vite.config.ts` (PWA) xem có CSP chặn script inline không. Nếu có thì thêm hash của script hoặc chuyển thành file tĩnh trong `public/` load đồng bộ.
  - [x] 2.8 Kiểm tra trang prerender `/day/YYYY-MM-DD` (`scripts/prerenderDays.ts`) có dùng chung `index.html` không; nếu có thì script vẫn phải chạy được ở đó (không lỗi khi không có khóa).
  - [x] 2.9 Viết `TextSizeController.test.tsx`: đặt/bỏ `data-text-size` đúng với 3 mức; đặt/bỏ `data-bold-text`; ghi `localStorage`; không lỗi khi `localStorage.setItem` ném lỗi; không đổi thuộc tính khi Settings còn `undefined`.
  - [x] 2.10 Kiểm tra tay: đặt `document.documentElement.dataset.textSize = 'xlarge'` trong DevTools, thấy `getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')` là `1.5`.

- [x] 3.0 Chuyển toàn bộ CSS và icon sang theo tỉ lệ (~118 chỗ `font-size`, padding/gap/min-height của nút, icon Phosphor `size` cố định), vùng bấm ≥ 44px, mức "Mặc định" giữ nguyên từng pixel
  - [x] 3.1 **Trước khi sửa CSS:** chạy app, chụp ảnh chuẩn các màn chính (Tháng, Tuần, Ngày, Danh sách, form sự kiện, Cài đặt) ở 360px và 1280px, sáng và tối. Gợi ý: viết test Playwright dùng `toHaveScreenshot()` và commit ảnh chuẩn để task 6 so lại.
  - [x] 3.2 Đổi mọi `font-size: Npx` trong `theme.css` và `src/**/*.module.css` thành `calc(Npx * var(--ui-scale))` (có thể dùng script `scripts/scale-css.mjs` rồi xem lại diff bằng tay). Không đổi giá trị em/%, không đổi chỗ đã dùng `max(16px, 1em)`.
  - [x] 3.3 Giữ quy tắc ô nhập ≥ 16px trên điện thoại (FR 10): kiểm tra chỗ `font-size: max(16px, 1em)` trong `theme.css` vẫn đúng sau khi đổi.
  - [x] 3.4 Đổi `padding`, `gap`, `min-height`, `height`, `width` của **nút, ô ngày, chip, hàng danh sách, ô nhập** sang `calc(... * var(--ui-scale))`. **Không** đổi: viền (`border` 1px), bo góc (`--radius*`), `blur`, `box-shadow`, `max-width` của layout.
  - [x] 3.5 Thay các `font-weight` số cố định bằng biến `--weight-*` từ task 2.3.
  - [x] 3.6 Chọn cách làm icon (gợi ý cách (b) trong PRD mục 7.2.3): đổi `size={N}` thành `size="1em"` và đặt `font-size: calc(Npx * var(--ui-scale))` cho class bọc icon. Nếu chỗ nào không bọc được bằng CSS thì dùng cách (a) với hook `useUiScale()`. Chọn một cách chính, ghi comment ngắn ở `textSize.ts`. (Đã chọn: `size={iconSize(N)}` trả về `calc(Npx * var(--ui-scale))`; Chromium, Firefox, WebKit đều nhận calc() trong thuộc tính width/height của `<svg>`, nên không cần bọc CSS hay React vẽ lại.)
  - [x] 3.7 Chạy `grep -rn "size={[0-9]" src` và sửa hết (FR 8). Khi xong lệnh này không còn kết quả (trừ file test).
  - [x] 3.8 Vùng bấm ≥ 44×44px ở mức "Lớn" và "Rất lớn" (FR 9): với nút icon nhỏ, dùng `min-width` / `min-height: max(44px, calc(Npx * var(--ui-scale)))` chỉ khi có `data-text-size`, hoặc tăng vùng bấm bằng padding mà không đổi phần icon nhìn thấy. Mức "Mặc định" giữ nguyên.
  - [x] 3.9 Chạy app ở cả 3 mức, bật/tắt chữ đậm, sáng/tối, lướt qua mọi màn để chắc không còn chữ/icon nào đứng yên không to lên (FR 7).
  - [x] 3.10 So ảnh mức "Mặc định" với ảnh chuẩn ở task 3.1 — phải khớp hoàn toàn (FR 6). Lệch chỗ nào thì sửa trước khi làm tiếp.
  - [x] 3.11 Chạy `npm test` để chắc test cũ vẫn xanh.

- [x] 4.0 Bố cục ở cỡ chữ lớn: lưới Tháng chỉ hiện icon sự kiện khi thiếu chỗ (đo kích thước thật, "+N", `aria-label`), thanh tab dưới đáy ẩn nhãn khi thiếu chỗ, chữ dài không tràn, không cuộn ngang
  - [x] 4.1 Tạo hook `useElementSize(ref)` dùng `ResizeObserver`, trả `{ width, height }`; dọn observer khi unmount. Viết unit test (mock `ResizeObserver`).
  - [x] 4.2 Trong `EventChip.tsx` thêm prop `compact`: chỉ hiện icon danh mục (hoặc chấm màu danh mục nếu không có icon), kèm icon âm lịch/lặp lại nếu vừa; có `aria-label` và `title` là tên sự kiện; bấm vẫn gọi đúng hành động như chip thường.
  - [x] 4.3 Trong `MonthView.tsx`, đo ô ngày bằng `useElementSize`. Tính số chip có chữ vừa trong ô (dựa trên chiều cao thật của một chip, đo hoặc tính từ `--ui-scale`). Nếu ô **không đủ chỗ** cho chip có chữ (quá hẹp để đọc tên, hoặc không vừa ít nhất 1 chip) thì chuyển sang dạng `compact` cho cả ô. Gợi ý: đo một lần cho cả lưới (một ô đại diện) thay vì mỗi ô một observer, để nhẹ hơn.
  - [x] 4.4 Ở dạng `compact`, xếp icon theo hàng, tính số icon vừa; phần còn lại hiện "+N" (FR 17). Số ngày dương và âm luôn được ưu tiên hiện đủ.
  - [x] 4.5 Đảm bảo dạng chip có chữ vẫn dùng như cũ khi đủ chỗ (máy tính, mức "Mặc định").
  - [x] 4.6 Viết test trong `MonthView.test.tsx`: giả lập kích thước ô nhỏ thì chỉ có icon với `aria-label` đúng tên sự kiện và "+N" đúng số; kích thước lớn thì có chip chữ.
  - [x] 4.7 Trong `TabBar.tsx`, đo thanh bằng `useElementSize`; nếu chiều rộng mỗi tab không đủ chứa nhãn (đo `scrollWidth > clientWidth` của nhãn hoặc tính theo chiều rộng tối thiểu) thì ẩn nhãn, chỉ hiện icon (FR 19). Nhãn ẩn phải đổi thành `aria-label` trên nút tab; tab đang chọn vẫn có màu nhấn/nền. Cẩn thận vòng lặp đo → ẩn → đo lại: quyết định dựa trên chiều rộng thanh, không dựa trên nhãn đang ẩn.
  - [x] 4.8 Viết test cho `TabBar`: thanh hẹp thì không có nhãn nhìn thấy nhưng mỗi tab có tên truy cập được (`getByRole('link', { name: ... })`); thanh rộng thì có nhãn.
  - [x] 4.9 Kiểm tra thanh tab Cài đặt (cuộn ngang) vẫn giữ icon + nhãn và cuộn được ở mức "Rất lớn" (FR 19a).
  - [x] 4.10 Rà chữ dài ở Tuần, Ngày (kể cả khối lịch vạn niên), Danh sách, form sự kiện, sidebar, hộp thoại, toast ở mức "Rất lớn": tên sự kiện/danh mục phải xuống dòng hoặc cắt "…" (`overflow-wrap: anywhere` / `text-overflow: ellipsis`) (FR 18).
  - [x] 4.11 Ở 360px mức "Rất lớn", kiểm tra `document.documentElement.scrollWidth <= innerWidth` trên mọi màn chính; sửa chỗ nào tràn (FR 20).

- [x] 5.0 Tab "Cỡ chữ" trong Cài đặt: ô xem trước, segmented control 3 mức, công tắc "Chữ đậm hơn", nút "Đặt lại mặc định", kèm component test
  - [x] 5.1 Tạo `TextSizeSection.tsx` nhận `settings` và `save` giống các section khác (`SectionProps`).
  - [x] 5.2 Ô xem trước (FR 25–27): card `glass` có nhãn nhỏ "Xem trước"; bên trong dùng lại CSS/component thật: một ô ngày kiểu lưới Tháng ("26" + "15/8"), một `EventChip` "Giỗ ông nội" có icon mặt trăng, một dòng chữ thường và một nút có icon. Dùng dữ liệu giả cố định, tắt mọi hành động bấm (`inert` hoặc `pointer-events: none` + `aria-hidden` cho phần giả, kèm mô tả ngắn cho trình đọc màn hình).
  - [x] 5.3 Segmented control 3 lựa chọn dùng class `.segmented` có sẵn (xem cách dùng ở `SettingsPage.tsx` / `AppHeader.tsx`). Mỗi lựa chọn có chữ "A" với cỡ tăng dần và tên mức bên dưới. Dùng `role="radiogroup"` / `role="radio"` + `aria-checked`, phím mũi tên trái/phải chuyển lựa chọn (FR 24).
  - [x] 5.4 Chọn một mức thì gọi ngay `save({ textSize })` (FR 23). Giao diện cả app (kể cả ô xem trước) đổi ngay nhờ `TextSizeController`.
  - [x] 5.5 Công tắc "Chữ đậm hơn" dùng lại `Toggle` đang có trong `SettingsPage.tsx` (tách ra file riêng nếu cần để dùng chung), mô tả: "Làm chữ dày hơn để dễ đọc trên nền kính mờ."
  - [x] 5.6 Nút "Đặt lại mặc định": gọi `save({ textSize: 'default', boldText: false })`; chỉ hiện khi `textSize !== 'default' || boldText`.
  - [x] 5.7 Thêm tab vào `TABS` trong `SettingsPage.tsx` ngay sau `general`: `id: 'text-size'`, `label: 'Cỡ chữ'`, `title: 'Cỡ chữ'`, `icon: TextAa`, không có `desktopOnly` (FR 21). Kiểm tra `/settings#text-size` mở đúng tab.
  - [x] 5.10 Gộp vào tab "Hiển thị" (theo yêu cầu sau): bỏ tab `text-size`, `TextSizeSection` thành mục con cuối `GeneralSection` với `<h3 id="text-size">`. Tab có `anchors: ['text-size']` nên `/settings#text-size` mở tab Hiển thị và cuộn tới mục. Test trong `src/App.test.tsx`.
  - [x] 5.8 Viết `TextSizeSection.test.tsx`: chọn "Rất lớn" gọi `save({ textSize: 'xlarge' })`; phím mũi tên chuyển mức; bật công tắc gọi `save({ boldText: true })`; nút đặt lại ẩn ở mặc định, hiện khi khác mặc định và gọi đúng `save`; bấm vào ô xem trước không gọi hành động nào.
  - [x] 5.9 Cập nhật `src/App.test.tsx` nếu test đang liệt kê các tab Cài đặt.

- [ ] 6.0 Kiểm thử E2E, a11y, so ảnh mức "Mặc định" và kiểm tra cuối (lint, typecheck, format, build)
  - [x] 6.1 Thêm helper trong `e2e/fixtures.ts` để đặt cỡ chữ nhanh (ghi `localStorage` bằng `page.addInitScript` hoặc chọn trong Cài đặt).
  - [x] 6.2 `e2e/user-stories.spec.ts`: thêm US-T1 đến US-T6 — chọn mức trong Cài đặt, thấy `data-text-size` đổi và cỡ chữ ô ngày tăng; bật chữ đậm; đặt lại mặc định; tải lại trang vẫn giữ mức và không nháy (thuộc tính có ngay sau khi tải HTML, trước khi React chạy).
  - [x] 6.3 `e2e/mobile-layout.spec.ts`: ở 360px và 1280px, cả 3 mức, kiểm tra không cuộn ngang trên Tháng, Tuần, Ngày, Danh sách, form sự kiện, Cài đặt (Goal 5).
  - [x] 6.4 `e2e/mobile-layout.spec.ts`: 360px mức "Rất lớn" — lưới Tháng chỉ hiện icon sự kiện có `aria-label` đúng tên, thanh tab dưới đáy chỉ hiện icon và mỗi tab có tên truy cập được; 1280px vẫn hiện chip có chữ; mức "Mặc định" ở 360px vẫn hiện nhãn tab.
  - [x] 6.5 Kiểm tra vùng bấm: ở mức "Lớn" và "Rất lớn", mọi `button`, `a`, `[role="radio"]`, `[role="switch"]` nhìn thấy có `boundingBox` ≥ 44×44 (Goal 2).
  - [x] 6.6 `e2e/a11y.spec.ts`: chạy axe ở 3 mức × sáng/tối, kể cả tab "Cỡ chữ" (Goal 6).
  - [x] 6.7 Chạy lại so ảnh mức "Mặc định" với ảnh chuẩn task 3.1 — phải khớp (Success Metric 2).
  - [x] 6.8 Chạy `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run test:emulator`, `npm run test:e2e`, `npm run build`; sửa hết lỗi.
  - [ ] 6.9 (Chưa làm, cần người thử) Thử trên điện thoại thật (iOS Safari và Android Chrome) ở mức "Lớn" 1.25 và "Rất lớn" 1.5; ghi nhận xét về tỉ lệ để chốt câu hỏi mở trong PRD mục 9.
  - [x] 6.10 Cập nhật `README.md` (mục tính năng) nhắc tới tùy chỉnh cỡ chữ.
