# Lịch Việt

Lịch cá nhân dương lịch và âm lịch Việt Nam, chạy trên web và cài được như app (PWA).

- Xem theo Ngày, Tuần, Tháng. Mặc định mở xem Ngày của hôm nay. Xem Ngày và Tuần liệt kê sự kiện từng ngày như trang Danh sách.
- Trên điện thoại, thanh tab dưới đáy có Ngày, Tháng, Sự kiện, Menu và nút tạo sự kiện. Xem Tuần chỉ có trên màn hình lớn.
- Mỗi ngày có ngày âm, Can Chi, tiết khí, ngày lễ, ngày và giờ hoàng đạo. Mùng 1 âm lịch tô đỏ.
- Tạo sự kiện theo ngày dương hoặc ngày âm. Lặp hằng ngày, tuần, tháng, năm, kể cả lặp theo âm lịch (giỗ, rằm, mùng 1). Chọn danh mục Giỗ/Lễ thì tự lặp hằng năm.
- Trang Danh sách sự kiện (`/events`): mọi sự kiện theo năm và tháng, cuộn vô hạn hai chiều, tìm kiếm, lọc theo danh mục, chọn nhiều để xoá.
- Danh mục có màu, sửa và thêm được. Lọc lịch theo danh mục.
- Nhắc hẹn bằng thông báo hệ thống hoặc email. Sự kiện mới có sẵn một nhắc hẹn thông báo (trước 15 phút, hoặc trong ngày với sự kiện cả ngày).
- Không cần tài khoản: dữ liệu lưu trên máy và dùng được offline. Đăng nhập Google để lưu lên cloud và đồng bộ nhiều thiết bị.

Tài liệu yêu cầu: [tasks/prd-personal-calendar.md](tasks/prd-personal-calendar.md). Danh sách task: [tasks/tasks-personal-calendar.md](tasks/tasks-personal-calendar.md).

## Công nghệ

| Phần | Dùng |
|---|---|
| Frontend | React 19, TypeScript, Vite, vite-plugin-pwa (service worker tự viết ở `src/sw.ts`) |
| Dữ liệu trên máy | IndexedDB qua Dexie |
| Cloud | Firebase Auth (Google), Cloud Firestore, Cloud Messaging (Web Push), Hosting |
| Nhắc hẹn phía server | Cloud Functions v2 trong `functions/`, email qua [Resend](https://resend.com) |
| Test | Vitest, Testing Library, Firebase Emulator, Playwright, axe-core |

Logic lịch âm, lặp sự kiện và tính giờ nhắc nằm trong `shared/`. Thư mục này không phụ thuộc React hay Firebase, nên cả app lẫn Cloud Functions dùng chung.

## Cài đặt

Cần có:

- Node.js 20 trở lên (Cloud Functions chạy Node 22).
- npm 11 trở lên. npm 10.9 bị lỗi khi cài, nên dùng `npx npm@11 install` nếu máy đang có npm cũ.
- Java 11 trở lên, chỉ cần khi chạy Firebase Emulator. Trên macOS: `brew install openjdk`.
- Firebase CLI: `npm install -g firebase-tools`.

```bash
npx npm@11 install
cd functions && npx npm@11 install && cd ..
cp .env.example .env.local
```

App chạy được ngay khi chưa điền `.env.local`. Khi đó chỉ có chế độ lưu trên máy, không có đăng nhập.

## Biến môi trường

### App: `.env.local` ở thư mục gốc

Lấy giá trị ở Firebase Console > Project settings > Your apps (Web app).

| Biến | Ý nghĩa |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Cấu hình Firebase Web app |
| `VITE_FIREBASE_VAPID_KEY` | Khóa Web Push. Tạo ở Project settings > Cloud Messaging > Web Push certificates > Generate key pair |
| `VITE_USE_FIREBASE_EMULATOR` | `true` để bản dev kết nối Firebase Emulator thay vì project thật |

Các giá trị `VITE_*` được đóng vào bundle và ai cũng xem được. Đây là cấu hình công khai của Firebase Web app, không phải bí mật. Dữ liệu được bảo vệ bằng `firestore.rules`.

### Cloud Functions: `functions/.env`

Copy từ `functions/.env.example`.

| Biến | Ý nghĩa |
|---|---|
| `EMAIL_FROM` | Địa chỉ gửi email, ví dụ `Lịch Việt <nhac-hen@ten-mien.vn>`. Tên miền phải được xác minh trong Resend |
| `APP_URL` | Địa chỉ app, dùng cho link trong email. Mặc định `https://lich.thanhnghiep.top` |

API key của Resend là bí mật, **không** để trong file hay trong code. Lưu vào Secret Manager:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Chưa đặt key thì nhắc hẹn email bị bỏ qua, nhắc hẹn thông báo vẫn chạy.

## Chạy khi phát triển

```bash
npm run dev          # http://localhost:5173
```

Dùng Firebase Emulator để không đụng dữ liệu thật:

```bash
npm run emulators    # Auth :9099, Firestore :8080, giao diện :4000
```

Rồi đặt `VITE_USE_FIREBASE_EMULATOR=true` trong `.env.local`, hoặc chạy `VITE_USE_FIREBASE_EMULATOR=true npm run dev`.

Service worker (offline, thông báo khi đóng tab) chỉ có ở bản build:

```bash
npm run build && npm run preview   # http://localhost:4173
```

## Kiểm tra và test

| Lệnh | Làm gì |
|---|---|
| `npm run typecheck` | Kiểm tra kiểu cho app, service worker, test emulator và functions |
| `npm run lint` | oxlint |
| `npm run format` | Prettier |
| `npm test` | Unit test (Vitest, jsdom, múi giờ `Asia/Ho_Chi_Minh`) |
| `npm run test:emulator` | Test Security Rules, Firestore repository và hàng đợi nhắc hẹn trên Emulator. Dùng project `demo-calendar-hana`, không bao giờ chạm project thật. Cần Java |
| `npm run test:e2e` | Playwright cho các user story, giao diện điện thoại và quét accessibility (axe), trên Chrome desktop và Pixel 7. Tự build và chạy preview |
| `npx playwright test --project=firefox --project=webkit --project=iphone` | Chạy e2e thêm trên Firefox, Safari và iPhone. Cài trình duyệt trước bằng `npx playwright install firefox webkit` |

Playwright chỉ hỗ trợ service worker trên Chromium. Vì vậy test offline (US-8) bị bỏ qua trên WebKit, cần kiểm tra Safari bằng tay.

## Deploy

Cần đăng nhập Firebase CLI (`firebase login`) và có quyền trên project `calendar-hana` (xem `.firebaserc`).

```bash
# Security Rules và index
firebase deploy --only firestore

# Web app
npm run build && firebase deploy --only hosting

# Cloud Functions (cần gói Blaze). Lệnh này tự build functions trước khi deploy.
firebase deploy --only functions
```

Trước lần deploy functions đầu tiên:

1. Nâng project lên gói Blaze.
2. Kiểm tra vùng Firestore. Functions đặt ở `asia-southeast1` (trong `functions/src/index.ts`) và phải cùng vùng với Firestore.
3. Đặt `RESEND_API_KEY` và tạo `functions/.env` như mục trên.

### Tự động qua GitHub Actions

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml):

- Mỗi lần push hoặc mở PR: typecheck, lint, unit test, test Emulator, e2e (Chrome desktop và Pixel 7).
- Push vào `main` và test qua hết: build rồi `firebase deploy --only firestore,hosting,functions`.

Cấu hình trên GitHub (Settings > Secrets and variables > Actions):

| Loại | Tên | Nội dung |
|---|---|---|
| Variables | `VITE_FIREBASE_*` (7 biến) | Giống `.env.local`, là cấu hình công khai |
| Variables | `EMAIL_FROM`, `APP_URL` | Giống `functions/.env` |
| Secret | `FIREBASE_SERVICE_ACCOUNT` | Nội dung file JSON key của service account dùng để deploy |

Chưa có `FIREBASE_SERVICE_ACCOUNT` thì bước deploy được bỏ qua, chỉ chạy test. `RESEND_API_KEY` vẫn nằm trong Secret Manager, không cần đưa lên GitHub.

Tạo service account ở Google Cloud Console > IAM & Admin > Service Accounts, cấp các role:

- Firebase Admin
- Cloud Functions Admin
- Service Account User
- Secret Manager Viewer
- Cloud Scheduler Admin
- Artifact Registry Administrator

Rồi tạo key JSON và dán nội dung vào secret `FIREBASE_SERVICE_ACCOUNT`.

### Tên miền riêng

App chạy ở `https://lich.thanhnghiep.top`, đặt trong `.env.production` (`VITE_CANONICAL_HOST`). Bản trên `calendar-hana.web.app` và `calendar-hana.firebaseapp.com` tự chuyển sang tên miền này. Máy đang có dữ liệu chỉ lưu trên máy thì không bị chuyển: app hiện hướng dẫn xuất dữ liệu rồi nhập ở địa chỉ mới, vì dữ liệu trên máy gắn với từng tên miền.

Khi đổi tên miền, cập nhật thêm:

- Firebase Console > Authentication > Settings > Authorized domains: thêm tên miền.
- `VITE_FIREBASE_AUTH_DOMAIN` trong `.env.local` đặt bằng tên miền, và thêm `https://<tên miền>/__/auth/handler` vào Authorized redirect URIs của OAuth client (Google Cloud Console > APIs & Services > Credentials).
- `APP_URL` trong `functions/.env`.

## Nhắc hẹn hoạt động thế nào

- **Chưa đăng nhập:** app tự hẹn giờ các nhắc hẹn trong 24 giờ tới và hiện thông báo khi app đang mở (`src/reminders/localScheduler.ts`).
- **Đã đăng nhập:** trình duyệt đăng ký Web Push, token lưu ở `users/{uid}/pushTokens`. Khi sự kiện thay đổi, function `scheduleReminders` ghi lần nhắc kế tiếp vào `reminderQueue`. Mỗi phút `sendDueReminders` gửi các nhắc đến hạn qua FCM hoặc email, rồi tính lần kế tiếp. Mỗi nhắc chỉ gửi tối đa 1 lần. Nhắc trễ quá 1 giờ thì bỏ qua.
- Sự kiện cả ngày nhắc theo giờ trong Cài đặt (mặc định 8:00).

## Cấu trúc thư mục

```
shared/        Logic thuần: lịch âm, Can Chi, ngày lễ, lặp sự kiện, giờ nhắc, format tiếng Việt
src/
  auth/        Đăng nhập Google (Firebase Auth tải khi cần)
  data/        Repository local (Dexie) và cloud (Firestore), chuyển dữ liệu, xuất/nhập JSON
  reminders/   Quyền thông báo, lịch nhắc local, Web Push, đăng ký service worker
  views/       Xem Ngày, Tuần, Tháng
  components/  Form sự kiện, chọn ngày, dòng sự kiện, hộp thoại...
  pages/       Trang lịch, Danh sách sự kiện và Cài đặt
  styles/      Theme (kính mờ kiểu iOS, sáng/tối)
  sw.ts        Service worker: cache offline, Web Push, bấm thông báo
functions/     Cloud Functions (bundle bằng esbuild, gói luôn shared/)
e2e/           Test Playwright
firestore.rules
```
