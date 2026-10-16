# PWA Update Strategy

Cách app biết bản build đang chạy, phát hiện bản mới trên server và cập nhật an toàn, kể cả PWA
"Thêm vào Màn hình chính" trên iPhone.

## Hai khái niệm

| Tên | Ý nghĩa | Nguồn |
| --- | --- | --- |
| `CURRENT_BUILD` | Build đang chạy trong trình duyệt | `BUILD_VERSION` trong [`src/buildInfo.ts`](../src/buildInfo.ts), gắn vào JS lúc build |
| `LATEST_BUILD` | Build mới nhất đang deploy trên server | `build` trong `/version.json` |

`CURRENT_BUILD` không bao giờ đọc từ `/version.json`: file đó là bản trên server, không phải bản JS đang chạy.

## Build version và `/version.json`

[`vite.config.ts`](../vite.config.ts) tính một lần mỗi lần build:

```json
{ "version": "26.10.15", "build": "bf229c7", "builtAt": "2026-10-15T15:30:00.000Z" }
```

- `version`: ngày build theo giờ Việt Nam, dạng `YY.MM.DD` (build ngày 2026-10-16 → `26.10.16`). Nhiều bản trong
  cùng ngày có cùng `version`; `build` mới phân biệt được.
- `build`: 7 ký tự đầu của `GITHUB_SHA` (GitHub Actions, job deploy). Build ở máy: `YYYYMMDDHHmmss` (giờ UTC).
- Cùng object được gắn vào JS (`define: __BUILD_INFO__`) và ghi ra `dist/version.json` (plugin `version-json`,
  chỉ chạy khi build). Không sửa tay.

Settings hiện nhỏ ở cuối trang: `v26.10.15 · bf229c7` (`data-testid="build-version"`).

## Cache

| Đường dẫn | Firebase Hosting | Service worker |
| --- | --- | --- |
| `/version.json` | `no-store` | Không precache (không thuộc `globPatterns`), luôn đi mạng |
| `/sw.js` | `no-cache` | — |
| `/`, `**/*.html`, `/manifest.webmanifest` | `no-cache` | `index.html` precache theo revision; điều hướng trả app shell của SW đang chạy |
| `/assets/**` (tên có hash) | `max-age=31536000, immutable` | Precache |

App fetch `/version.json?t=<now>` với `cache: 'no-store'`, nên không có lớp cache nào trả bản cũ.
Offline vẫn chạy như trước: app shell và asset nằm trong precache của service worker.

## Phát hiện bản mới

[`checkForUpdate(registration)`](../src/reminders/updateCheck.ts):

1. Offline (`navigator.onLine === false`): bỏ qua.
2. Fetch `/version.json` (timeout 10 s). Lỗi mạng, HTTP lỗi, JSON hỏng, thiếu `build`: coi như không có bản mới.
3. `LATEST_BUILD !== CURRENT_BUILD`: gọi `registration.update()` để trình duyệt tải `sw.js` mới. Lỗi được nuốt.

Không reload và không hiện toast ở bước này. Toast chỉ hiện khi service worker mới đã cài xong và đang chờ
(`onNeedRefresh` của `vite-plugin-pwa`), nên không bao giờ có trang mới chạy với asset/service worker cũ.

Thời điểm kiểm tra ([`src/reminders/serviceWorker.ts`](../src/reminders/serviceWorker.ts)), chỉ sau khi đăng ký
service worker xong (không chặn render):

- Khởi động app.
- `visibilitychange` sang `visible` (app quay lại từ nền).
- Mỗi giờ khi app mở lâu.

## Service worker lifecycle và Cập nhật ngay

Service worker tự viết ([`src/sw.ts`](../src/sw.ts), `strategies: 'injectManifest'`, `registerType: 'prompt'`).

```
version.json khác build đang chạy
  → registration.update()
  → SW mới install, nằm ở registration.waiting
  → onNeedRefresh → toast "Có phiên bản mới" (một toast duy nhất, không tự ẩn)
  → người dùng bấm "Cập nhật ngay"
  → updateSW(true): plugin gửi { type: 'SKIP_WAITING' }, SW gọi self.skipWaiting()
  → SW mới activate, controllerchange (workbox-window "controlling", isUpdate)
  → plugin reload trang đúng một lần
  → CURRENT_BUILD === LATEST_BUILD, không còn toast
```

- Một SW đã chờ sẵn từ trước (cài lúc app ở nền) cũng gây `onNeedRefresh` ngay khi mở app.
- Toast là state trong `useAppUpdateStore`; kiểm tra nhiều lần chỉ đặt lại cùng một cờ, nên chỉ có một toast.
- Không thấy `controllerchange` sau 10 s (SW mới hỏng): tải lại trang một lần, chạy bản SW đang điều khiển
  (vẫn nhất quán, không lẫn phiên bản).
- "Để sau" ẩn toast; SW mới vẫn chờ và sẽ được dùng khi mọi cửa sổ app đóng hẳn.

## iOS Home Screen

PWA mở từ icon Màn hình chính chạy độc lập với Safari, không cần mở Safari, refresh, xoá hay cài lại:

- App bị tắt hẳn rồi mở lại: điều hướng mới, trình duyệt tự kiểm tra `sw.js` (header `no-cache`) và
  `checkForUpdate` chạy lúc khởi động.
- App chỉ nằm nền rồi quay lại: không có điều hướng, iOS không tự kiểm tra SW; `visibilitychange` gọi
  `checkForUpdate`.

Kịch bản: v1 cài trên iPhone → đóng PWA → deploy v2 → mở PWA → phát hiện v2 → toast → Cập nhật ngay → reload → v2.

## Local development và production

- `npm run dev`: service worker tắt (`devOptions.enabled: false`), không có `version.json`, không kiểm tra cập nhật.
- `npm run build && npx vite preview`: giống production, `build` là timestamp.
- Production (CI deploy từ `main`): `build` là short SHA của commit.

## Test

- [`src/reminders/updateCheck.test.ts`](../src/reminders/updateCheck.test.ts): cùng build, khác build, offline,
  lỗi server, file hỏng, `registration.update()` lỗi.
- [`src/components/UpdatePrompt/UpdatePrompt.test.tsx`](../src/components/UpdatePrompt/UpdatePrompt.test.tsx):
  bấm Cập nhật ngay gọi luồng update; báo nhiều lần chỉ một toast.
- [`e2e/pwa-update.spec.ts`](../e2e/pwa-update.spec.ts): bản build trên Settings khớp `/version.json`; server có
  build khác thì gọi `registration.update()` lúc mở và khi quay lại app.

## Giới hạn

- Toàn bộ luồng install → waiting → reload trên iPhone thật chưa tự động hoá; cần kiểm tra tay sau deploy.
- Nếu `version.json` đã đổi nhưng CDN còn trả `sw.js` cũ trong chốc lát, lần kiểm tra sau (quay lại app hoặc
  sau một giờ) sẽ bắt được.
