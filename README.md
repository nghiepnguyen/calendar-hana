# Lịch Việt

Lịch cá nhân dương lịch và âm lịch Việt Nam, chạy trên web và cài được như app (PWA).

- Xem theo Ngày, Tuần, Tháng. Mặc định mở xem Ngày của hôm nay. Xem Ngày và Tuần liệt kê sự kiện từng ngày như trang Danh sách.
- Trên điện thoại, thanh tab dưới đáy có Ngày, Tháng, Sự kiện, Menu và nút tạo sự kiện. Xem Tuần chỉ có trên màn hình lớn.
- Mỗi ngày có ngày âm, Can Chi, tiết khí, ngày lễ, ngày và giờ hoàng đạo. Mùng 1 âm lịch tô đỏ.
- Xem Ngày có khối Lịch vạn niên: niên mệnh (nạp âm), quan hệ Can Chi, Nhị thập bát tú, Thập nhị trực kèm việc nên làm / nên kiêng, hướng Hỷ Thần và Tài Thần trên la bàn, tuổi xung ngày và tháng, sao tốt và sao xấu theo Ngọc Hạp Thông Thư (bấm để xem giải thích), đủ 12 giờ trong ngày có đánh dấu giờ hiện tại. Bật/tắt cùng công tắc hoàng đạo trong Cài đặt. Số liệu tính ngay trên máy, đã đối chiếu với licham.vn, xemngay.com, lichviet.me và thoigian.com.vn.
- Phong thủy cá nhân trong xem Ngày, cùng ngôn ngữ thiết kế với Lịch vạn niên:
  - Chưa có ngày sinh hợp lệ thì chỉ hiện lời mời nhập ngày sinh (và nút đăng nhập cho khách nếu có tài khoản Firebase), kèm vòng 12 con giáp.
  - Kết luận ngày nêu rõ yếu tố quyết định (ví dụ "Vì Địa chi xung tuổi (Ngọ xung Tý)"). Ô Địa chi, Thiên can, Nạp âm có nút ⓘ giải thích. Ô Thiên can có Thập thần của ngày đang xem so với Nhật Nguyên.
  - Giờ cá nhân đánh dấu giờ hiện tại và nhắc khi sự kiện có giờ rơi vào giờ không hợp tuổi (chỉ là gợi ý, không đổi kết luận).
  - Hạn theo năm: Sao chiếu mệnh theo Ngọc Hạp Ký (chỉ tên sao, không gắn cát/hung), Kim Lâu, Hoang Ốc, Tam Tai. Hạn tuổi tạm ẩn vì chưa có nguồn. Nam/Nữ mạng lấy theo giới tính đã lưu.
  - Tứ Trụ (cần ngày, giờ và nơi sinh; Việt Nam 1900–2100, giờ ước lượng, hai quy ước giờ Tý): lá số có Thập thần, tàng can, Nguyệt lệnh; Nhật Nguyên, điểm vượng suy (bản đơn giản theo trọng số vị trí) và thống kê ngũ hành 8 chữ.
  - Trên điện thoại, Hạn theo năm và Tứ Trụ thu gọn thành một dòng tóm tắt.
  - Mỗi lớp đi qua gate quy tắc có nguồn và version. Kết quả mang tính tham khảo theo quy ước đã công bố; chưa có Dụng thần.
- Tạo sự kiện theo ngày dương hoặc ngày âm. Lặp hằng ngày, tuần, tháng, năm, kể cả lặp theo âm lịch (giỗ, rằm, mùng 1). Chọn danh mục Giỗ/Lễ thì tự lặp hằng năm.
- Trang Danh sách sự kiện (`/events`): mọi sự kiện theo năm và tháng, cuộn vô hạn hai chiều, tìm kiếm, lọc theo danh mục, chọn nhiều để xoá.
- Danh mục có màu, sửa và thêm được. Lọc lịch theo danh mục.
- Nhắc hẹn bằng thông báo hệ thống hoặc email. Sự kiện mới có sẵn một nhắc hẹn thông báo (trước 15 phút, hoặc trong ngày với sự kiện cả ngày).
- Cỡ chữ cho người lớn tuổi (Cài đặt > Hiển thị > Cỡ chữ): Mặc định, Lớn (×1.25), Rất lớn (×1.5). Chữ, icon, nút và khoảng cách to cùng tỉ lệ, vùng bấm tối thiểu 44px. Có công tắc chữ đậm hơn và ô xem trước. Trên màn hẹp, lưới Tháng chỉ hiện chấm/icon sự kiện, thanh tab chỉ hiện icon. Cài đặt đồng bộ theo tài khoản.
- Sao lưu và chuyển dữ liệu trong Cài đặt: JSON (đầy đủ), ICS và CSV theo chuẩn Google Calendar. Nhập được file .ics / .csv xuất từ Google Calendar.
- Không cần tài khoản: dữ liệu lưu trên máy và dùng được offline. Đăng nhập Google để lưu lên cloud và đồng bộ nhiều thiết bị.

Tài liệu yêu cầu: [tasks/prd-personal-calendar.md](tasks/prd-personal-calendar.md). Danh sách task: [tasks/tasks-personal-calendar.md](tasks/tasks-personal-calendar.md). Lịch vạn niên: [tasks/prd-day-almanac.md](tasks/prd-day-almanac.md), [tasks/tasks-day-almanac.md](tasks/tasks-day-almanac.md). Cỡ chữ: [tasks/prd-text-size.md](tasks/prd-text-size.md), [tasks/tasks-text-size.md](tasks/tasks-text-size.md). Giải nghĩa Bát Tự: [tasks/prd-bazi-interpretation.md](tasks/prd-bazi-interpretation.md), [tasks/tasks-bazi-interpretation.md](tasks/tasks-bazi-interpretation.md). Kế hoạch SEO: [tasks/tasks-seo-audit.md](tasks/tasks-seo-audit.md).

## Công nghệ

| Phần | Dùng |
|---|---|
| Frontend | React 19, TypeScript, Vite, vite-plugin-pwa (service worker tự viết ở `src/sw.ts`) |
| Dữ liệu trên máy | IndexedDB qua Dexie |
| Cloud | Firebase Auth (Google), Cloud Firestore, Cloud Messaging (Web Push), Hosting |
| Nhắc hẹn phía server | Cloud Functions v2 trong `functions/`, email qua [Resend](https://resend.com) |
| Test | Vitest, Testing Library, Firebase Emulator, Playwright, axe-core |

Logic lịch âm, lặp sự kiện và tính giờ nhắc nằm trong `shared/`. Thư mục này không phụ thuộc React hay Firebase, nên cả app lẫn Cloud Functions dùng chung.

Hồ sơ sinh được lưu cùng cài đặt trên thiết bị hoặc tài khoản, có thể xuất/nhập bằng JSON và được
xóa liên đới khi xóa ngày sinh. Phép tính phong thủy và Tứ Trụ chạy trong ứng dụng, dùng được offline;
ngày, giờ, nơi sinh và kết quả không được đưa vào analytics, URL, SEO/prerender hoặc dịch vụ luận
giải bên ngoài. Xem phạm vi, nguồn và bằng chứng phát hành tại
[`tasks/feng-shui-release-checklist.md`](tasks/feng-shui-release-checklist.md).

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

`e2e/visual-default.spec.ts` so ảnh các màn chính ở cỡ chữ Mặc định (Chromium, chỉ chạy trên macOS vì ảnh chuẩn chụp trên macOS; CI Linux bỏ qua) để chắc phóng to chữ không làm lệch giao diện gốc. Chỉ cập nhật ảnh chuẩn khi cố ý đổi giao diện: `npx playwright test visual-default --project=desktop --project=mobile --update-snapshots`.

CSS mới: viết cỡ chữ, khoảng cách, kích thước dạng `calc(Npx * var(--ui-scale))` và icon dạng `size={iconSize(N)}` (`src/styles/textSize.ts`). Không nhân tỉ lệ cho viền, bo góc, bóng, blur và lề trang.

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
- `SITE_URL` trong `shared/seo/daySeo.ts`, các URL trong `index.html` và `public/robots.txt`.

### SEO trang ngày

`npm run build` tạo sẵn `dist/day/YYYY-MM-DD.html` cho mọi ngày từ đầu năm trước tới cuối năm sau (`scripts/prerenderDays.ts`), mỗi trang có title, description, canonical, Open Graph, JSON-LD và nội dung lịch vạn niên dạng HTML tĩnh, và ghi `dist/sitemap.xml` liệt kê các trang này. Firebase Hosting (`cleanUrls`) phục vụ `/day/2026-09-25` từ file tương ứng; ngày ngoài khoảng vẫn mở được qua rewrite, app tự cập nhật `<head>` (`src/hooks/usePageHead.ts`). Xem Tuần và Tháng có `noindex, follow`. Service worker không precache các trang này. Khoảng ngày trượt theo năm build, nên cần deploy lại ít nhất mỗi năm.

Kết quả audit SEO 02/10/2026 và kế hoạch sửa (hiệu năng mobile, liên kết nội bộ, trang tháng, soft 404) nằm ở [`tasks/tasks-seo-audit.md`](tasks/tasks-seo-audit.md).

## Các trang chính sách cho Google OAuth

Hai trang HTML công khai (không cần JavaScript hay đăng nhập):

- Privacy policy: `https://lich.thanhnghiep.top/privacy`
- Terms of service: `https://lich.thanhnghiep.top/terms`

Nội dung ở `public/privacy.html` và `public/terms.html`, CSS chung ở `public/legal.css`.
Tên app là **Lịch Việt**, email liên hệ **thanhnghiep.top@gmail.com**. Trang chủ và footer
cuối trang Cài đặt (ngoài các tab) có liên kết; sitemap có hai URL; service worker cache các trang cho offline.
Firebase Hosting với `cleanUrls: true` phục vụ chúng từ file HTML tương ứng.
Trong app, các liên kết này dùng React Router và hiển thị nội dung từ cùng file HTML,
giữ nguyên phiên đăng nhập và kết nối Firestore khi quay lại lịch trên PWA iOS.
Vite dev dùng `scripts/publicLegalPages.ts` để ánh xạ `/privacy` và `/terms` sang HTML công khai,
giữ nguyên URL trên trình duyệt. Kiểm tra riêng dev bằng
`npx playwright test --config playwright.dev.config.ts --project=desktop --project=mobile`.

Sau khi deploy, điền các URL trên vào Google Auth Platform > Branding (cùng trang chủ
`https://lich.thanhnghiep.top/`), xác minh tên miền `thanhnghiep.top`, khai báo scope
`user.birthday.read` trong Data Access và thực hiện quy trình xác minh Google yêu cầu.
Việc có hai trang không tự bật People API hoặc tự hoàn tất xét duyệt OAuth.

## Thông tin ngày sinh

Cài đặt > Tài khoản có ngày, tháng, năm sinh theo dương lịch và giới tính (tùy chọn, dùng cho Sao
chiếu mệnh theo Nam/Nữ mạng) trên cùng một hàng. Nhóm **Giờ và nơi sinh** (để lập Tứ Trụ) có giờ sinh
24 giờ và nơi sinh; độ chắc chắn và sai số chỉ hiện khi đã nhập giờ; quy ước giờ Tý nằm trong
**Tùy chọn nâng cao** và tự mở khi hồ sơ dùng quy ước khác mặc định.
Nhập tay và bấm **Lưu thông tin** để lưu trên máy hoặc đồng bộ vào tài khoản đang đăng nhập.
**Xóa thông tin ngày sinh** làm trống form; bấm lưu để xác nhận xóa (giới tính và các trường giờ,
nơi sinh bị xóa cùng). Thông tin này đi cùng
bản sao lưu JSON, không gửi vào analytics. Khi chuyển dữ liệu local lên cloud, ngày sinh local
chỉ được điền nếu tài khoản chưa từng lưu ngày sinh.

Sau khi đăng nhập, **Lấy ngày sinh từ Google** xin thêm quyền
`https://www.googleapis.com/auth/user.birthday.read`, đọc Google People API và điền vào form.
Người dùng kiểm tra rồi bấm lưu; năm sinh Google không cung cấp thì cần nhập bổ sung.
Giờ sinh luôn nhập tay. OAuth access token chỉ dùng cho yêu cầu API, không được lưu.

Để bật lấy từ Google trên production, bật **People API** trong Google Cloud Console của
project Firebase và cấu hình scope ngày sinh trong Google Auth Platform > Data Access.
Thực hiện xác minh OAuth theo yêu cầu Google trước khi mở quyền này cho mọi người.
Nếu API chưa bật, người dùng từ chối quyền hoặc trình duyệt/PWA chặn popup, app báo lỗi
và vẫn cho phép nhập thủ công. Luồng này dùng popup để xin quyền cho đúng tài khoản hiện tại.

Xem [Google People API](https://developers.google.com/people/api/rest/v1/people/get)
và [Firebase Google Auth](https://firebase.google.com/docs/auth/web/google-signin).

## Nhắc hẹn hoạt động thế nào

- **Chưa đăng nhập:** app tự hẹn giờ các nhắc hẹn trong 24 giờ tới và hiện thông báo khi app đang mở (`src/reminders/localScheduler.ts`).
- **Đã đăng nhập:** trình duyệt đăng ký Web Push, token lưu ở `users/{uid}/pushTokens`. Khi sự kiện thay đổi, function `scheduleReminders` ghi lần nhắc kế tiếp vào `reminderQueue`. Mỗi phút `sendDueReminders` gửi các nhắc đến hạn qua FCM hoặc email, rồi tính lần kế tiếp. Mỗi nhắc chỉ gửi tối đa 1 lần. Nhắc trễ quá 1 giờ thì bỏ qua.
- Sự kiện cả ngày nhắc theo giờ trong Cài đặt (mặc định 8:00).

## Cấu trúc thư mục

```
shared/        Logic thuần: lịch âm, Can Chi, ngày lễ, lịch vạn niên (28 tú, trực, sao Ngọc Hạp...), lặp sự kiện, giờ nhắc, format tiếng Việt
src/
  auth/        Đăng nhập Google (Firebase Auth tải khi cần)
  data/        Repository local (Dexie) và cloud (Firestore), chuyển dữ liệu, xuất/nhập JSON, ICS, CSV (Google Calendar)
  reminders/   Quyền thông báo, lịch nhắc local, Web Push, đăng ký service worker
  views/       Xem Ngày (kèm khối Lịch vạn niên), Tuần, Tháng
  components/  Form sự kiện, chọn ngày, dòng sự kiện, hộp thoại...
  pages/       Trang lịch, Danh sách sự kiện và Cài đặt
  styles/      Theme (kính mờ kiểu iOS, sáng/tối)
  sw.ts        Service worker: cache offline, Web Push, bấm thông báo
functions/     Cloud Functions (bundle bằng esbuild, gói luôn shared/)
e2e/           Test Playwright
firestore.rules
```
