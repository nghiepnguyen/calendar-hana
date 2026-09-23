## Relevant Files

### Cấu hình project

- `package.json` - Dependencies và script (`dev`, `build`, `test`, `lint`).
- `vite.config.ts` - Cấu hình Vite, `vite-plugin-pwa`, alias `@shared`.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.sw.json` - Cấu hình TypeScript (app, service worker), path alias `@shared/*`.
- `vitest.config.ts` - Cấu hình Vitest (môi trường `jsdom`, `fake-indexeddb`).
- `.oxlintrc.json`, `.prettierrc` - Quy tắc lint (oxlint, mặc định của template Vite hiện tại) và format.
- `.env.example` - Mẫu biến môi trường Firebase (không commit file `.env` thật).
- `firebase.json`, `.firebaserc` - Cấu hình Firebase Hosting, Firestore, Functions.
- `public/*.png`, `public/favicon.svg`, `pwa-assets.config.ts` - Icon PWA sinh từ `favicon.svg` bằng `npm run generate-icons`.

### Code dùng chung (frontend + Cloud Functions)

- `shared/lunar/julian.ts` - Số ngày Julius, cộng/trừ ngày, thứ trong tuần, parse chuỗi `YYYY-MM-DD` (không phụ thuộc múi giờ máy).
- `shared/lunar/julian.test.ts` - Unit test cho `julian.ts`.
- `shared/lunar/lunar.ts` - Chuyển đổi dương ↔ âm lịch (thuật toán Hồ Ngọc Đức, UTC+7), tháng nhuận, số ngày của tháng âm.
- `shared/lunar/lunar.test.ts` - Unit test đối chiếu với lịch chuẩn.
- `shared/lunar/canChi.ts` - Can Chi của ngày, tháng, năm.
- `shared/lunar/canChi.test.ts` - Unit test cho `canChi.ts`.
- `shared/lunar/solarTerms.ts` - 24 tiết khí.
- `shared/lunar/solarTerms.test.ts` - Unit test cho `solarTerms.ts`.
- `shared/lunar/auspicious.ts` - Ngày hoàng đạo/hắc đạo, 6 giờ hoàng đạo, ngày kỵ (Tam Nương, Nguyệt Kỵ).
- `shared/lunar/auspicious.test.ts` - Unit test cho `auspicious.ts`.
- `shared/lunar/holidays.ts` - Danh sách ngày lễ dương và âm, hàm lấy ngày lễ của một ngày.
- `shared/lunar/holidays.test.ts` - Unit test cho `holidays.ts`.
- `shared/lunar/index.ts` - Export chung, hàm `getDayInfo(date)` gom mọi thông tin của một ngày.
- `shared/lunar/index.test.ts` - Unit test cho `getDayInfo`.
- `shared/types.ts` - Kiểu `CalendarEvent`, `Category`, `Reminder`, `Settings`, `LunarDate`.
- `shared/recurrence/recurrence.ts` - Tính các lần diễn ra của sự kiện trong một khoảng ngày (dương + âm, ngoại lệ).
- `shared/recurrence/recurrence.test.ts` - Unit test cho mọi quy tắc lặp và trường hợp đặc biệt.
- `shared/reminders/nextReminder.ts` - Tính thời điểm nhắc kế tiếp của một sự kiện.
- `shared/reminders/nextReminder.test.ts` - Unit test cho `nextReminder.ts`.
- `shared/validation.ts` - Kiểm tra dữ liệu sự kiện (dùng chung cho form và repository), thông báo lỗi tiếng Việt.
- `shared/validation.test.ts` - Unit test cho `validation.ts`.
- `shared/format.ts` - Format ngày dương/âm tiếng Việt (ví dụ "12/3 âm lịch", "Thứ Hai, 23/9/2026").
- `shared/format.test.ts` - Unit test cho `format.ts`.

### Dữ liệu

- `src/data/db.ts` - Khai báo Dexie database (bảng `events`, `categories`, `settings`).
- `src/data/repository.ts` - Interface `CalendarRepository` dùng chung cho local và cloud.
- `src/data/localRepository.ts` - Cài đặt repository bằng Dexie.
- `src/data/localRepository.test.ts` - Unit test (dùng `fake-indexeddb`).
- `src/data/firestoreRepository.ts` - Cài đặt repository bằng Firestore.
- `src/data/defaultCategories.ts` - Danh mục mặc định và bảng 12 màu.
- `src/data/migrateLocalToCloud.ts` - Chuyển dữ liệu local lên tài khoản.
- `src/data/migrateLocalToCloud.test.ts` - Unit test cho migrate.
- `src/data/exportImport.ts` - Xuất/nhập file JSON.
- `src/data/exportImport.test.ts` - Unit test cho xuất/nhập.
- `src/data/RepositoryProvider.tsx` - React provider chọn repository theo trạng thái đăng nhập.
- `src/data/repositoryContext.ts` - Context, hook `useRepository()` và repository local dùng chung.

### State và hooks

- `src/store/uiStore.ts` - State giao diện tạm thời: sidebar, form sự kiện, chi tiết, tìm kiếm (Zustand).
- `src/hooks/useCalendarRoute.ts` - Chế độ xem và ngày đang xem lấy từ URL `/day/2026-09-23`, các hàm điều hướng.
- `src/hooks/useNow.ts` - Hôm nay và giờ hiện tại theo giờ Việt Nam, cập nhật mỗi phút.
- `src/hooks/useCategoryMap.ts` - Tra danh mục và màu theo id.
- `src/hooks/useKeyboardShortcuts.ts` - Phím tắt T/D/W/M/N, mũi tên, `/`.
- `src/calendar/range.ts` - Khoảng ngày cho từng chế độ xem, đầu tuần, trang trước/sau.
- `src/calendar/range.test.ts` - Unit test cho `range.ts`.
- `shared/time.ts` - Hôm nay, giờ hiện tại, đổi ngày giờ Việt Nam sang thời điểm tuyệt đối.
- `shared/time.test.ts` - Unit test cho `time.ts`.
- `src/hooks/useEventsInRange.ts` - Lấy sự kiện đã tính lần lặp trong khoảng ngày đang xem.
- `src/hooks/useEventsInRange.test.tsx` - Test hook (lặp, lọc danh mục, tự cập nhật).
- `src/hooks/useRepositoryData.ts` - Hook `useEvents`, `useCategories`, `useSettings` tự cập nhật theo repository.

### Giao diện

- `src/main.tsx`, `src/App.tsx` - Điểm vào app, router, provider.
- `src/components/layout/AppHeader.tsx` - Thanh đầu: nút Hôm nay, trước/sau, chuyển Ngày/Tuần/Tháng, tìm kiếm, tài khoản.
- `src/components/layout/Sidebar.tsx` - Lịch tháng nhỏ, danh sách danh mục để lọc.
- `src/components/DatePicker/DatePicker.tsx` - Chọn ngày theo dương hoặc âm.
- `src/components/DatePicker/LunarDateInput.tsx` - Ô chọn ngày/tháng (có tháng nhuận)/năm âm, dùng lại trong form sự kiện.
- `src/components/MiniMonth/MiniMonth.tsx` - Lịch tháng nhỏ có ngày âm ở sidebar.
- `src/components/DatePicker/DatePicker.test.tsx` - Test component.
- `src/views/DayView/DayView.tsx` - Xem Ngày (màn hình mặc định).
- `src/views/DayView/DayCard.tsx` - Thẻ ngày: ngày dương, âm, Can Chi, hoàng đạo, giờ tốt, tiết khí, ngày lễ.
- `src/views/DayView/DayView.test.tsx` - Test component.
- `src/views/WeekView/WeekView.tsx` - Xem Tuần.
- `src/views/WeekView/WeekView.test.tsx` - Test component.
- `src/views/MonthView/MonthView.tsx` - Xem Tháng.
- `src/views/MonthView/MonthView.test.tsx` - Test component.
- `src/components/TimeGrid/TimeGrid.tsx` - Lưới 24 giờ dùng chung cho Ngày và Tuần.
- `src/components/TimeGrid/layout.ts` - Xếp sự kiện trùng giờ thành cột cạnh nhau.
- `src/components/TimeGrid/layout.test.ts` - Unit test cho `layout.ts`.
- `src/pages/CalendarPage.tsx` - Trang lịch: header, sidebar, chế độ xem, nút +, phím tắt.
- `src/views/viewProps.ts` - Props chung của 3 chế độ xem.
- `src/test/fixtures.ts` - Dữ liệu và helper dùng chung cho test giao diện.
- `src/components/EventChip/EventChip.tsx` - Hiển thị một sự kiện theo màu danh mục.
- `src/components/EventForm/EventForm.tsx` - Form tạo/sửa sự kiện.
- `src/components/EventForm/EventForm.test.tsx` - Test form (validate, đổi dương/âm, ngày quy đổi).
- `src/components/EventForm/RecurrenceField.tsx` - Phần chọn kiểu lặp.
- `src/components/EventForm/ReminderField.tsx` - Phần chọn nhắc hẹn.
- `src/components/EventDetail/EventDetail.tsx` - Xem chi tiết, sửa, xóa sự kiện.
- `src/components/EventForm/draft.ts` - Dữ liệu trên form và cách đổi qua lại với sự kiện (đổi Dương/Âm, dời giờ kết thúc).
- `src/components/EventForm/draft.test.ts` - Unit test cho `draft.ts`.
- `src/components/EventForm/reminderOptions.ts` - Mốc nhắc có sẵn và nhãn tiếng Việt.
- `src/components/EventDialogs.tsx` - Điều phối hộp thoại chi tiết, form, chọn phạm vi, xác nhận xóa.
- `src/components/Modal/Modal.tsx` - Hộp thoại dùng chung (focus trap, Esc, trả focus).
- `src/components/ConfirmDialog.tsx` - Hộp thoại xác nhận.
- `src/components/ThemeController.tsx` - Đặt `data-theme` theo cài đặt.
- `src/components/SearchPanel/search.ts` - Tìm không phân biệt dấu, tính lần tới.
- `src/components/SearchPanel/search.test.ts` - Unit test cho `search.ts`.
- `src/data/eventActions.ts` - Lưu/xóa sự kiện theo phạm vi (một lần / lần này và sau / tất cả).
- `src/data/eventActions.test.ts` - Test 3 phạm vi sửa/xóa với Dexie.
- `shared/recurrence/editing.ts` - Tách sự kiện lặp, tạo ghi đè cho một lần, xóa theo phạm vi.
- `shared/recurrence/editing.test.ts` - Unit test cho `editing.ts` và `describe.ts`.
- `shared/recurrence/describe.ts` - Câu mô tả quy tắc lặp tiếng Việt.
- `src/components/RecurringScopeDialog.tsx` - Hộp thoại "Chỉ sự kiện này / Sự kiện này và các sự kiện sau / Tất cả".
- `src/components/SearchPanel/SearchPanel.tsx` - Tìm kiếm sự kiện.
- `src/pages/Settings/SettingsPage.tsx` - Trang Cài đặt.
- `src/pages/Settings/CategoryManager.tsx` - Quản lý danh mục.
- `src/pages/Settings/AccountSection.tsx` - Đăng nhập, đăng xuất, xóa tài khoản.
- `src/styles/theme.css` - Token màu sáng/tối, màu đỏ cho Chủ nhật và ngày lễ.

### Firebase và nhắc hẹn

- `src/firebase/firebase.ts` - Khởi tạo Firebase app, Auth, Firestore (bật offline persistence), kết nối Emulator khi dev.
- `src/firebase/rules.emulator.test.ts` - Test Security Rules trên Emulator.
- `src/auth/AuthProvider.tsx`, `src/auth/authContext.ts` - Đăng nhập Google (popup, redirect trên PWA mobile), đăng xuất, xóa tài khoản, thông báo lỗi tiếng Việt.
- `src/data/MigrationDialog.tsx` - Hộp thoại chuyển dữ liệu local lên tài khoản.
- `src/data/firestoreRepository.emulator.test.ts` - Test repository Firestore, chuyển dữ liệu, xuất/nhập trên Emulator.
- `src/store/syncStore.ts` - Trạng thái đồng bộ và lỗi ghi lên cloud.
- `src/components/layout/SyncStatus.tsx` - Hiện trạng thái đồng bộ trên header.
- `src/pages/Settings/DataSection.tsx` - Xuất/nhập file JSON.
- `vitest.emulator.config.ts`, `tsconfig.emulator.json` - Cấu hình test chạy trên Firebase Emulator (`npm run test:emulator`).
- `src/reminders/localScheduler.ts` - Hẹn giờ thông báo khi tab đang mở (người chưa đăng nhập).
- `src/reminders/localScheduler.test.ts` - Unit test (dùng fake timers).
- `src/reminders/pushRegistration.ts` - Xin quyền thông báo, lấy FCM token, lưu token lên Firestore.
- `src/sw.ts` - Service worker: cache offline, nhận Web Push, mở app khi bấm thông báo.
- `firestore.rules` - Security Rules: mỗi user chỉ đọc/ghi dữ liệu của mình.
- `firestore.indexes.json` - Index cho truy vấn nhắc hẹn đến hạn.
- `functions/src/index.ts` - Export các Cloud Functions.
- `functions/src/scheduleReminders.ts` - Trigger khi sự kiện thay đổi: tính và ghi lần nhắc kế tiếp vào collection `reminderQueue`.
- `functions/src/sendDueReminders.ts` - Scheduler chạy mỗi phút: gửi push/email cho nhắc hẹn đến hạn.
- `functions/src/email.ts` - Tạo nội dung email và gửi qua Resend.
- `functions/src/push.ts` - Gửi Web Push qua FCM.
- `functions/src/deleteAccount.ts` - Xóa toàn bộ dữ liệu khi user xóa tài khoản.
- `functions/src/*.test.ts` - Unit test cho functions (dùng Firebase Emulator).

### Test end-to-end

- `e2e/*.spec.ts` - Test Playwright cho các user story chính.
- `playwright.config.ts` - Cấu hình Playwright.

### Notes

- Unit test đặt cạnh file code được test (ví dụ `lunar.ts` và `lunar.test.ts` cùng thư mục).
- Chạy test bằng `npx vitest [đường/dẫn/file]`. Không truyền đường dẫn thì chạy toàn bộ test.
- Chạy test end-to-end bằng `npx playwright test`.
- Cài dependencies bằng npm 11 trở lên (`npx npm@11 install`). npm 10.9 bị lỗi `Cannot read properties of null (reading 'edgesOut')` với vitest 5.
- Thư mục `shared/` **không được** import React, Dexie hay Firebase. Nó chỉ chứa logic thuần để cả frontend lẫn Cloud Functions dùng được.
- Mọi phép tính ngày giờ dùng múi giờ `Asia/Ho_Chi_Minh`. Không dùng giờ local của máy.
- Chạy Firebase Emulator (`npm run emulators`, cần Java) khi phát triển task 6.0 và 7.0 để không đụng dữ liệu thật; đặt `VITE_USE_FIREBASE_EMULATOR=true` trong `.env.local`.
- Test trên Emulator: `npm run test:emulator` (dùng project `demo-calendar-hana`, không bao giờ chạm project thật).

## Instructions for Completing Tasks

**IMPORTANT:** Làm xong task nào thì đánh dấu task đó trong file này bằng cách đổi `- [ ]` thành `- [x]`. Việc này giúp theo dõi tiến độ và không bỏ sót bước.

Ví dụ:
- `- [ ] 1.1 Đọc file` → `- [x] 1.1 Đọc file` (sau khi làm xong)

Cập nhật file sau mỗi sub-task, không đợi xong cả parent task.

## Tasks

- [x] 0.0 Khởi tạo git repository và tạo feature branch
  - [x] 0.1 Chạy `git init` trong thư mục project, tạo `.gitignore` (bỏ qua `node_modules`, `dist`, `.env`, `functions/lib`, `.firebase`).
  - [x] 0.2 Commit đầu tiên gồm `create-prd.md`, `generate-tasks.md` và thư mục `tasks/` trên nhánh `main`.
  - [x] 0.3 Tạo và chuyển sang nhánh mới: `git checkout -b feature/personal-calendar`.

- [x] 1.0 Dựng khung project (React + TypeScript + Vite, PWA, Vitest, ESLint/Prettier, cấu trúc thư mục, code dùng chung giữa frontend và Cloud Functions)
  - [x] 1.1 Tạo project bằng `npm create vite@latest . -- --template react-ts`, chạy thử `npm run dev`.
  - [x] 1.2 Cài dependencies chính: `dexie`, `dexie-react-hooks`, `zustand`, `date-fns`, `date-fns-tz`, `react-router-dom`, `firebase`.
  - [x] 1.3 Cài dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fake-indexeddb`, `prettier`, `@playwright/test`.
  - [x] 1.4 Tạo `vitest.config.ts` (môi trường `jsdom`, setup file import `fake-indexeddb/auto`), thêm script `test` vào `package.json`, viết 1 test mẫu để kiểm tra cấu hình chạy được.
  - [x] 1.5 Cấu hình lint (oxlint thay cho ESLint, vì template Vite hiện tại dùng oxlint) + Prettier, thêm script `lint`, `format`.
  - [x] 1.6 Tạo thư mục `shared/`, khai báo alias `@shared` trong `tsconfig.json` và `vite.config.ts`.
  - [x] 1.7 Tạo cấu trúc thư mục `src/` theo mục Relevant Files (`data`, `store`, `hooks`, `components`, `views`, `pages`, `reminders`, `firebase`, `styles`).
  - [x] 1.8 Cài `vite-plugin-pwa`, cấu hình manifest (tên "Lịch Hana", `lang: "vi"`, màu theme, icon trong `public/`), chọn chế độ `injectManifest` để tự viết `src/sw.ts`.
  - [x] 1.9 Viết `shared/types.ts` theo mô hình dữ liệu trong PRD mục 7 (`CalendarEvent`, `LunarDate`, `Category`, `Reminder`, `Settings`).
  - [x] 1.10 Tạo `.env.example` với các biến `VITE_FIREBASE_*`.

- [x] 2.0 Xây thư viện âm lịch (chuyển đổi dương ↔ âm UTC+7, tháng nhuận, Can Chi, tiết khí, ngày/giờ hoàng đạo, ngày kỵ, danh sách ngày lễ) kèm unit test đối chiếu lịch chuẩn
  - [x] 2.1 Trong `shared/lunar/lunar.ts`, viết các hàm nền của thuật toán Hồ Ngọc Đức: `jdFromDate`, `jdToDate`, `getNewMoonDay`, `getSunLongitude`, `getLunarMonth11`, `getLeapMonthOffset` (tham số múi giờ = 7).
  - [x] 2.2 Viết `solarToLunar(dd, mm, yyyy): LunarDate` và `lunarToSolar(lunarDay, lunarMonth, lunarYear, isLeap)`. Hàm `lunarToSolar` trả `null` nếu ngày âm không tồn tại (ví dụ tháng nhuận không có trong năm đó).
  - [x] 2.3 Viết `getLunarMonthLength(month, year, isLeap)` (29 hoặc 30) và `getLeapMonth(year)` (trả số tháng nhuận hoặc `null`).
  - [x] 2.4 Viết test cho `lunar.ts`: ngày Tết các năm 2020–2030, các năm có tháng nhuận 2020 (4 nhuận), 2023 (2 nhuận), 2025 (6 nhuận), 2028 (5 nhuận), ngày biên 1900 và 2100, và kiểm tra chuyển đổi 2 chiều cho mọi ngày trong 1900–2100 (dương → âm → dương phải ra ngày ban đầu).
  - [x] 2.5 Viết `shared/lunar/canChi.ts`: Can Chi của năm, tháng (theo tháng âm và Can năm), ngày (từ số ngày Julius), kèm test với các ngày đã biết.
  - [x] 2.6 Viết `shared/lunar/solarTerms.ts`: xác định ngày bắt đầu của 24 tiết khí (Lập Xuân, Vũ Thủy...), kèm test với ngày tiết khí năm 2026.
  - [x] 2.7 Viết `shared/lunar/auspicious.ts`: ngày hoàng đạo/hắc đạo (theo tháng âm và Chi của ngày), 6 giờ hoàng đạo (theo Chi của ngày, kèm khung giờ như "Tý 23h–1h"), ngày Tam Nương (3, 7, 13, 18, 22, 27 âm) và Nguyệt Kỵ (5, 14, 23 âm). Ghi rõ nguồn tham chiếu trong comment đầu file (xem PRD mục 9, câu 1). Viết test. _Đã làm: tính theo tháng âm lịch như lịch treo tường phổ biến; đổi nguồn thì chỉ sửa `auspicious.ts`._
  - [x] 2.8 Viết `shared/lunar/holidays.ts`: danh sách ngày lễ dương và âm theo PRD mục 17, hàm `getHolidays(solarDate)`. Giao thừa phải tính là ngày cuối tháng Chạp (29 hoặc 30). Viết test (ví dụ Tết 2026 là 17/2/2026). _Lưu ý: Tết 2030 của Việt Nam là 2/2/2030 (Trung Quốc: 3/2), vì sóc rơi vào 23h07 giờ Việt Nam._
  - [x] 2.9 Viết `shared/lunar/index.ts` với hàm `getDayInfo(date)` trả về một object gom: ngày âm, Can Chi, hoàng đạo, giờ tốt, ngày kỵ, tiết khí, ngày lễ. Có cache theo ngày để không tính lại.
  - [x] 2.10 Viết `shared/format.ts`: tên thứ tiếng Việt, format ngày dương, ngày âm ("12/3 âm lịch", "10/4 nhuận"), tiêu đề tháng ("Tháng 9/2026 — Tháng 7–8 âm lịch, năm Bính Ngọ"). Viết test.

- [x] 3.0 Xây lớp dữ liệu local và bộ tính lần lặp (Dexie cho sự kiện/danh mục/cài đặt, danh mục mặc định, recurrence engine dương + âm với các trường hợp đặc biệt, ngoại lệ từng lần)
  - [x] 3.1 Tạo `src/data/db.ts`: Dexie database `calendar-hana` với bảng `events` (index `id`, `categoryId`, `updatedAt`), `categories`, `settings`.
  - [x] 3.2 Tạo `src/data/repository.ts`: interface `CalendarRepository` gồm `listEvents`, `getEvent`, `saveEvent`, `deleteEvent`, `listCategories`, `saveCategory`, `deleteCategory`, `getSettings`, `saveSettings`, và `watchEvents` / `watchCategories` / `watchSettings` (lắng nghe thay đổi, khớp với `liveQuery` của Dexie và `onSnapshot` của Firestore).
  - [x] 3.3 Tạo `src/data/defaultCategories.ts`: 6 danh mục mặc định (Công việc, Cá nhân, Gia đình, Giỗ/Lễ, Sức khỏe, Khác) với id cố định, và bảng 12 màu. Đánh dấu "Khác" là `isSystem: true`.
  - [x] 3.4 Viết `src/data/localRepository.ts`: cài đặt interface bằng Dexie, tự tạo danh mục mặc định và cài đặt mặc định ở lần mở đầu. Tự cập nhật `updatedAt` khi lưu.
  - [x] 3.5 Trong `deleteCategory`: không cho xóa danh mục hệ thống; chuyển các sự kiện của danh mục bị xóa sang "Khác" trong cùng một transaction.
  - [x] 3.6 Viết test cho `localRepository.ts` (tạo, sửa, xóa, xóa danh mục chuyển sự kiện sang "Khác").
  - [x] 3.7 Viết `shared/recurrence/recurrence.ts` với hàm `expandOccurrences(event, rangeStart, rangeEnd)` trả về danh sách lần diễn ra (mỗi lần có `occurrenceKey` dạng `YYYY-MM-DD` và ngày dương cụ thể).
  - [x] 3.8 Cài đặt lặp **dương lịch**: hằng ngày, hằng tuần theo `byWeekday`, hằng tháng (bỏ qua tháng không có ngày 29/30/31), hằng năm (29/2 chỉ rơi vào năm nhuận).
  - [x] 3.9 Cài đặt lặp **âm lịch**: hằng tháng âm (gồm cả tháng nhuận), hằng năm âm. Áp dụng quy tắc PRD mục 28: ngày 30 thiếu thì lùi về 29, tạo từ tháng nhuận thì các năm sau dùng tháng thường, lặp hằng năm không tạo thêm ở tháng nhuận.
  - [x] 3.10 Cài đặt điều kiện kết thúc (`until`, `count`) và áp dụng `exceptions` (bỏ lần đã xóa, ghi đè lần đã sửa riêng).
  - [x] 3.11 Viết test cho recurrence: giỗ 12/3 âm các năm 2026–2030, rằm hằng tháng năm 2025 (có tháng 6 nhuận), sự kiện 30 âm rơi vào tháng thiếu, sự kiện tạo từ 10/4 nhuận 2020, lặp ngày 31 dương, 29/2, hằng tuần thứ Hai, `count` và `until`, ngoại lệ.
  - [x] 3.12 Viết `src/hooks/useEventsInRange.ts`: lấy sự kiện từ repository, tính lần lặp trong khoảng ngày, lọc theo danh mục đang bật, tự cập nhật khi dữ liệu thay đổi.

- [x] 4.0 Xây giao diện xem lịch Ngày / Tuần / Tháng (mặc định xem Ngày, thẻ ngày âm lịch, điều hướng, date picker dương/âm, highlight hôm nay, hiển thị ngày lễ và sự kiện theo màu danh mục)
  - [x] 4.1 Tạo `src/store/viewStore.ts`: `viewMode` (mặc định `'day'`), `currentDate` (mặc định hôm nay theo giờ Việt Nam), `hiddenCategoryIds`, các action `goToday`, `goPrev`, `goNext`, `setView`, `setDate`. _Đã làm khác: chế độ xem và ngày nằm trên URL qua hook `useCalendarRoute` (4.2); `hiddenCategoryIds` nằm trong Settings; `src/store/uiStore.ts` giữ state tạm (sidebar, form, chi tiết, tìm kiếm)._
  - [x] 4.2 Tạo layout `App.tsx` + `AppHeader.tsx`: nút "Hôm nay", nút trước/sau, tiêu đề khoảng ngày đang xem, nút chuyển Ngày/Tuần/Tháng, ô tìm kiếm, nút tài khoản. Lưu chế độ xem vào URL (ví dụ `/day/2026-09-23`) để refresh không mất trạng thái.
  - [x] 4.3 Tạo `src/styles/theme.css`: token màu cho giao diện sáng/tối, màu đỏ cho Chủ nhật và ngày lễ, màu cho ngày âm (nhỏ, nhạt hơn).
  - [x] 4.4 Tạo `DatePicker.tsx`: tab Dương/Âm; ở tab Âm chọn ngày, tháng (có mục tháng nhuận nếu năm có nhuận), năm âm; luôn hiện ngày quy đổi. Viết test.
  - [x] 4.5 Tạo `DayCard.tsx`: ngày dương lớn, thứ, ngày âm, Can Chi ngày/tháng/năm, hoàng đạo/hắc đạo, ngày kỵ, danh sách giờ hoàng đạo, tiết khí, ngày lễ. Ẩn phần hoàng đạo nếu cài đặt tắt.
  - [x] 4.6 Tạo `TimeGrid.tsx`: lưới 24 giờ, khu vực sự kiện cả ngày ở trên, xếp các sự kiện trùng giờ thành cột cạnh nhau, vạch đỏ cho giờ hiện tại, tự cuộn tới giờ hiện tại khi mở.
  - [x] 4.7 Tạo `EventChip.tsx`: hiển thị tiêu đề, giờ, màu danh mục; có biểu tượng nhỏ nếu là sự kiện âm lịch hoặc sự kiện lặp.
  - [x] 4.8 Ghép `DayView.tsx` = `DayCard` + `TimeGrid` cho 1 ngày. Viết test (hiện đúng ngày âm, hiện sự kiện).
  - [x] 4.9 Tạo `WeekView.tsx`: 7 cột, đầu cột có thứ, ngày dương, ngày âm, ngày lễ; dùng `TimeGrid` nhiều cột; tuần bắt đầu theo cài đặt. Viết test.
  - [x] 4.10 Tạo `MonthView.tsx`: lưới 5–6 hàng; mỗi ô có ngày dương lớn, ngày âm nhỏ (mùng 1 hiện "1/tháng"), chấm hoàng đạo, ngày lễ, tối đa 3 sự kiện và "+N"; làm mờ ngày thuộc tháng khác; tiêu đề có tháng âm và năm Can Chi. Viết test.
  - [x] 4.11 Bấm vào ô ngày (Tháng) hoặc đầu cột (Tuần) thì chuyển sang xem Ngày của ngày đó. Bấm vào sự kiện thì mở `EventDetail`.
  - [x] 4.12 Tạo `Sidebar.tsx` (trên mobile là drawer): lịch tháng nhỏ có ngày âm để chọn nhanh, danh sách danh mục có checkbox để lọc.
  - [x] 4.13 Highlight ngày hôm nay ở cả 3 chế độ xem. Thêm phím tắt: `T` về hôm nay, `D`/`W`/`M` đổi chế độ xem, mũi tên trái/phải để chuyển trước/sau.

- [x] 5.0 Xây chức năng quản lý sự kiện và danh mục (form tạo/sửa/xóa theo dương/âm, lặp lại, sửa/xóa sự kiện lặp theo 3 lựa chọn, tạo nhanh, tìm kiếm, CRUD danh mục, lọc theo danh mục)
  - [x] 5.1 Tạo `EventForm.tsx` (modal trên desktop, toàn màn hình trên mobile) gồm các trường ở PRD mục 19. Công tắc Dương/Âm đặt trên cùng.
  - [x] 5.2 Khi đổi Dương ↔ Âm trong form: tự quy đổi ngày đang chọn sang hệ lịch kia và luôn hiện dòng ngày quy đổi (ví dụ "Tức ngày 28/4/2026 dương lịch").
  - [x] 5.3 Validate: tiêu đề bắt buộc và tối đa 200 ký tự, ghi chú tối đa 2000 ký tự, giờ kết thúc phải sau giờ bắt đầu, ngày âm phải tồn tại. Hiện lỗi bằng tiếng Việt cạnh từng trường.
  - [x] 5.4 Tạo `RecurrenceField.tsx`: kiểu lặp hiện theo loại lịch (Dương: không lặp/ngày/tuần/tháng/năm, có chọn thứ trong tuần; Âm: không lặp/tháng âm/năm âm); điều kiện kết thúc (không bao giờ / đến ngày / sau N lần); hiện câu tóm tắt (ví dụ "Lặp hằng năm vào ngày 12/3 âm lịch").
  - [x] 5.5 Nút nổi "+" mở form trống. Bấm vào khung giờ trống (Ngày/Tuần) hoặc ô ngày (Tháng) mở form đã điền sẵn ngày/giờ.
  - [x] 5.6 Tạo `EventDetail.tsx`: hiện đủ thông tin (cả ngày dương và âm của lần diễn ra), nút Sửa, nút Xóa (có hỏi xác nhận).
  - [x] 5.7 Tạo `RecurringScopeDialog.tsx`. Khi sửa/xóa sự kiện lặp:
    - "Chỉ sự kiện này": ghi vào `exceptions`.
    - "Sự kiện này và các sự kiện sau": đặt `until` của sự kiện cũ là ngày trước lần này, tạo sự kiện mới từ lần này.
    - "Tất cả": sửa trực tiếp sự kiện gốc.
  - [x] 5.8 Viết test cho `EventForm` (validate, quy đổi dương/âm, lưu sự kiện âm lặp hằng năm) và cho 3 lựa chọn sửa/xóa sự kiện lặp.
  - [x] 5.9 Tạo `SearchPanel.tsx`: tìm theo tiêu đề và ghi chú (không phân biệt hoa thường và dấu tiếng Việt), hiện kết quả kèm ngày lần diễn ra kế tiếp; bấm vào kết quả để nhảy tới ngày đó.
  - [x] 5.10 Tạo `CategoryManager.tsx`: danh sách danh mục; thêm, đổi tên, đổi màu (bảng 12 màu); xóa có hỏi xác nhận và báo số sự kiện sẽ chuyển sang "Khác"; không có nút xóa cho "Khác".
  - [x] 5.11 Nối bộ lọc danh mục ở `Sidebar` với `viewStore.hiddenCategoryIds` và lưu bộ lọc vào cài đặt.

- [x] 6.0 Tích hợp đăng nhập Google và lưu trữ cloud (Firebase Auth, Firestore + Security Rules, đồng bộ offline, chuyển dữ liệu local lên tài khoản, đăng xuất, xuất/nhập JSON, xóa tài khoản)
  - [x] 6.1 Tạo Firebase project, bật Authentication (Google provider), Firestore, Hosting. Chạy `firebase init`, cấu hình Emulator Suite.
  - [x] 6.2 Tạo `src/firebase/firebase.ts`: khởi tạo app từ biến môi trường, bật Firestore offline persistence (`persistentLocalCache`), kết nối Emulator khi chạy dev.
  - [x] 6.3 Tạo `src/hooks/useAuth.ts`: `signInWithGoogle` (popup, trên mobile dùng redirect), `signOut`, trạng thái `user`.
  - [x] 6.4 Thiết kế cấu trúc Firestore: `users/{uid}` (profile, settings), `users/{uid}/events/{eventId}`, `users/{uid}/categories/{categoryId}`, `users/{uid}/pushTokens/{token}`.
  - [x] 6.5 Viết `firestore.rules`: chỉ `request.auth.uid == uid` được đọc/ghi `users/{uid}/**`; validate độ dài tiêu đề và ghi chú. Test rules bằng `@firebase/rules-unit-testing`.
  - [x] 6.6 Viết `src/data/firestoreRepository.ts` cài đặt `CalendarRepository` bằng Firestore (dùng `onSnapshot` cho các hàm `watch*`). Khi ghi dùng `updatedAt` để giữ bản mới nhất (last-write-wins).
  - [x] 6.7 Tạo `RepositoryProvider.tsx`: chưa đăng nhập dùng `localRepository`, đã đăng nhập dùng `firestoreRepository`. Toàn bộ UI chỉ gọi qua interface, không gọi thẳng Dexie/Firestore.
  - [x] 6.8 Viết `migrateLocalToCloud.ts`: khi đăng nhập lần đầu mà local có dữ liệu, hiện hộp thoại "Chuyển dữ liệu trên máy lên tài khoản" / "Bỏ qua". Chuyển theo batch, giữ nguyên id, đếm số bản ghi trước và sau để chắc chắn không mất dữ liệu; chỉ xóa local sau khi upload thành công. Viết test.
  - [x] 6.9 Đăng xuất: xóa cache Firestore trên máy (`clearIndexedDbPersistence`), quay lại dùng dữ liệu local.
  - [x] 6.10 Viết `exportImport.ts`: xuất JSON gồm version, events, categories, settings; nhập có kiểm tra định dạng và hỏi "Gộp" hoặc "Thay thế". Viết test.
  - [x] 6.11 Tạo `AccountSection.tsx`: hiện avatar/email, nút đăng nhập/đăng xuất, nút xóa tài khoản (bắt gõ lại chữ "XÓA" để xác nhận).
  - [x] 6.12 Viết `functions/src/deleteAccount.ts`: xóa toàn bộ `users/{uid}/**`, xóa hàng đợi nhắc hẹn của user, xóa user trong Auth. _Đã làm khác: xóa ngay từ client (`FirestoreRepository.deleteAllData` + `deleteUser`, có xác thực lại), chạy được ở gói miễn phí. Phần dọn `reminderQueue` sẽ làm ở task 7 bằng trigger khi user bị xóa._
  - [x] 6.13 Hiện trạng thái đồng bộ trên header (đã đồng bộ / đang offline, sẽ đồng bộ khi có mạng).

- [ ] 7.0 Xây hệ thống nhắc hẹn (thông báo local khi tab mở, Web Push qua FCM và email qua Cloud Functions + Scheduler cho người đã đăng nhập, xin quyền thông báo, nội dung có ngày âm)
  - [x] 7.1 Tạo `ReminderField.tsx`: tối đa 5 nhắc hẹn; chọn thời điểm (lúc diễn ra, 5 phút, 15 phút, 30 phút, 1 giờ, 1 ngày, 3 ngày, 1 tuần, tùy chỉnh) và kênh (Thông báo / Email). Email bị vô hiệu hóa kèm lời nhắc "Đăng nhập Google để dùng nhắc hẹn qua email" khi chưa đăng nhập. Người chưa đăng nhập thấy ghi chú "Thông báo chỉ hiện khi app đang mở".
  - [ ] 7.2 Viết `shared/reminders/nextReminder.ts`: từ sự kiện (gồm lặp và âm lịch) và thời điểm hiện tại, tính lần nhắc kế tiếp cho từng nhắc hẹn. Sự kiện cả ngày dùng giờ nhắc mặc định trong cài đặt (8:00). Viết test (giỗ âm lịch nhắc trước 1 ngày, sự kiện hằng tuần nhắc trước 15 phút, lần đã bị xóa trong `exceptions`).
  - [ ] 7.3 Tạo `pushRegistration.ts`: xin quyền `Notification` khi người dùng thêm nhắc hẹn thông báo lần đầu; nếu bị từ chối thì hiện hướng dẫn bật lại quyền trong trình duyệt; khi đã đăng nhập thì lấy FCM token và lưu vào `users/{uid}/pushTokens`.
  - [ ] 7.4 Viết `localScheduler.ts` (người chưa đăng nhập): khi app mở, tính các nhắc hẹn trong 24 giờ tới, đặt `setTimeout`; tính lại khi dữ liệu thay đổi và khi tab được mở lại (`visibilitychange`); hiện thông báo qua `serviceWorkerRegistration.showNotification`. Viết test bằng fake timers.
  - [ ] 7.5 Trong `src/sw.ts`: xử lý sự kiện `push` từ FCM để hiện thông báo, và `notificationclick` để mở app tại ngày của sự kiện.
  - [ ] 7.6 Viết `functions/src/scheduleReminders.ts`: Firestore trigger khi sự kiện được tạo/sửa/xóa, dùng `nextReminder` (import từ `shared/`) để cập nhật document trong collection `reminderQueue` (`uid`, `eventId`, `occurrenceKey`, `channel`, `fireAt`).
  - [ ] 7.7 Viết `functions/src/sendDueReminders.ts`: scheduled function chạy mỗi phút, lấy `reminderQueue` có `fireAt <= now`, gửi theo kênh, đánh dấu đã gửi để không gửi trùng (dùng transaction), rồi tính và ghi lần nhắc kế tiếp cho sự kiện lặp.
  - [ ] 7.8 Viết `functions/src/push.ts`: gửi tới mọi FCM token của user; xóa token không còn hợp lệ.
  - [ ] 7.9 Viết `functions/src/email.ts`: template HTML tiếng Việt gồm tiêu đề, ngày dương, ngày âm, giờ, địa điểm, ghi chú, link mở sự kiện; gửi qua Resend. API key lưu bằng Firebase Secret Manager, không để trong code.
  - [ ] 7.10 Nội dung thông báo theo PRD mục 40 (ví dụ "Giỗ ông nội — Hôm nay, 12/3 âm lịch"), dùng chung hàm format trong `shared/format.ts`.
  - [ ] 7.11 Viết test cho functions bằng Firebase Emulator: tạo sự kiện thì có hàng đợi, đến giờ thì gửi 1 lần, sự kiện lặp thì có lần nhắc kế tiếp, xóa sự kiện thì xóa hàng đợi.

- [ ] 8.0 Hoàn thiện Cài đặt, giao diện và kiểm thử cuối (trang Cài đặt, sáng/tối, responsive 360px, offline PWA, accessibility, Lighthouse, kiểm thử end-to-end các user story)
  - [x] 8.1 Tạo `SettingsPage.tsx` với các mục ở PRD mục 49: ngày bắt đầu tuần, bật/tắt ngày lễ, bật/tắt hoàng đạo, giờ nhắc mặc định cho sự kiện cả ngày, giao diện sáng/tối/theo hệ thống, quản lý danh mục, xuất/nhập, tài khoản.
  - [x] 8.2 Áp dụng giao diện sáng/tối theo cài đặt (thuộc tính `data-theme` trên `<html>`, mặc định theo hệ thống).
  - [ ] 8.3 Kiểm tra responsive ở 360px, 768px, 1280px: Tuần trên mobile cuộn ngang được, Tháng trên mobile chỉ hiện chấm màu thay cho tiêu đề sự kiện, không có thanh cuộn ngang toàn trang.
  - [ ] 8.4 Hoàn thiện service worker: cache app shell và asset để mở offline; hiện thông báo "Có phiên bản mới" khi có bản cập nhật.
  - [ ] 8.5 Accessibility: đủ tương phản màu (WCAG AA), dùng được bằng bàn phím (focus trap trong modal, `Esc` để đóng), `aria-label` cho nút icon và ô ngày (ví dụ "Thứ Tư, 23 tháng 9 năm 2026, ngày 12 tháng 8 âm lịch").
  - [ ] 8.6 Viết test Playwright cho các user story: mở app thấy xem Ngày hôm nay (US-1), chuyển Ngày/Tuần/Tháng (US-2), tạo giỗ âm lặp hằng năm (US-3), tạo rằm/mùng 1 hằng tháng (US-4), họp thứ Hai hằng tuần (US-5), tạo và lọc danh mục (US-6), dùng offline không cần đăng nhập (US-8).
  - [ ] 8.7 Chạy Lighthouse: PWA installable, Performance ≥ 90. Xem Ngày phải tải dưới 1 giây trên điện thoại tầm trung (dùng chế độ throttle).
  - [ ] 8.8 Kiểm thử thủ công trên Chrome, Safari (macOS/iOS), Firefox: cài PWA, nhận thông báo, đăng nhập Google, đồng bộ giữa 2 thiết bị.
  - [ ] 8.9 Deploy lên Firebase Hosting và Functions (`firebase deploy`), kiểm tra lại nhắc hẹn email và push trên bản production.
  - [ ] 8.10 Viết `README.md`: cách cài đặt, biến môi trường, chạy dev, chạy Emulator, chạy test, deploy.
