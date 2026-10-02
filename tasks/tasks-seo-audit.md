# Kế hoạch sửa SEO theo audit 02/10/2026

Nguồn: audit ngày 02/10/2026 trên mã nguồn, bản build `dist/`, trang thật `lich.thanhnghiep.top`
(bản deploy 01/10) và một lần Lighthouse mobile. Không có dữ liệu Search Console, Analytics hay
CrUX. SEO Health Index lúc audit: **88/100 (Good)**, không có lỗi chặn lập chỉ mục.

Số đo lúc audit (`/day/2026-09-23`, Lighthouse 12, mobile, lab, 1 lần): Performance 56, SEO 100,
Accessibility 100, FCP 5,2 s, LCP 8,1 s (phần tử `bigDay` do app vẽ), Speed Index 14,0 s, TBT 40 ms,
CLS 0. Bundle chính khoảng 537 KB gzip; Lighthouse ước tính bỏ được 267 KiB JS không dùng.

## Relevant Files

### Prerender và head

- `scripts/prerenderDays.ts` - Sinh `dist/day/*.html` và `dist/sitemap.xml`; nơi thêm trang tháng, `lastmod`, bỏ H1 thừa.
- `shared/seo/daySeo.ts`, `daySeo.test.ts` - Title, description, JSON-LD, HTML tĩnh và link hôm trước/hôm sau của trang ngày.
- `src/hooks/usePageHead.ts` - Head phía client; Tuần/Tháng đang đặt `noindex, follow` bằng JS.
- `index.html` - Head trang chủ, phần `<noscript>` có `<h1>Lịch Việt</h1>`, splash.
- `src/splash.ts` - Gỡ splash khi app sẵn sàng.
- `firebase.json` - Rewrite `/day/**`, `/week/**`, `/month/**` về `index.html`; header Cache-Control.
- `public/robots.txt` - `Disallow: /settings` (đang chặn cả trang hướng dẫn).

### Route và hiệu năng

- `src/hooks/useCalendarRoute.ts` - Ngày không hợp lệ đang quay về hôm nay (dòng 19).
- `src/calendar/range.ts` - `isSupportedDate`.
- `vite.config.ts` - Chia chunk, tải trễ.
- `src/firebase/*`, `src/auth/*` - Firebase/Auth hiện nằm trong chunk tải ngay.

### Nội dung

- `src/pages/Settings/FengShuiGuideSection.tsx` - Nội dung hướng dẫn đang nằm sau `/settings`.
- `scripts/publicLegalPages.ts` - Mẫu sinh trang tĩnh công khai (privacy/terms) để làm trang phương pháp.

### Notes

- Không đưa dữ liệu cá nhân (ngày, giờ, nơi sinh, kết quả Phong thủy cá nhân) vào URL, prerender,
  sitemap hoặc JSON-LD. Chỉ dùng nội dung lịch chung.
- Sau mỗi nhóm: `npm run build`, kiểm tra `dist/`, chạy Lighthouse mobile lại trên preview và ghi số
  vào mục "Kết quả" ở cuối file. Ảnh chuẩn `visual-default` có thể đổi khi gỡ splash.
- Xác nhận F1, F2, F5 bằng Search Console (Coverage/Pages) khi có quyền truy cập.

## Instructions for Completing Tasks

Làm xong sub-task nào thì đổi `- [ ]` thành `- [x]`. Chỉ đánh dấu task cha khi mọi sub-task đạt.
Mỗi task cha là một commit riêng.

## Tasks

- [ ] 1.0 Hiệu năng trang ngày (F6, F7): ưu tiên cao
  - [ ] 1.1 Đo lại Lighthouse mobile trên `npm run preview` để có mốc so sánh cục bộ.
  - [ ] 1.2 Không che nội dung prerender bằng splash trên `/day/*`: splash chỉ hiện khi `#root` rỗng.
  - [ ] 1.3 Giữ nội dung tĩnh hiển thị tới khi app sẵn sàng, tránh nháy và CLS khi React thay nội dung.
  - [ ] 1.4 Tách Firebase/Auth, phần Bát Tự/Phong thủy cá nhân và thư viện thiên văn ra chunk tải trễ.
  - [ ] 1.5 Kiểm tra lại: mục tiêu LCP < 2,5 s, FCP < 1,8 s, CLS < 0,1 (lab mobile).

- [ ] 2.0 Liên kết nội bộ và trang hub (F1, F9, cơ hội trang tháng): ưu tiên cao
  - [ ] 2.1 Quyết định sản phẩm: mở lập chỉ mục trang Tháng (bỏ `noindex`) và prerender `/month/YYYY-MM`.
  - [ ] 2.2 Trang tháng tĩnh: lưới ngày với `<a href="/day/...">` cho mọi ngày, ngày lễ, rằm, mùng 1, tiết khí.
  - [ ] 2.3 Trang ngày link lên trang tháng của nó (breadcrumb và link).
  - [ ] 2.4 Prerender trang chủ với nội dung hôm nay và link tới hôm nay, tuần này, tháng này, vài ngày tới.
  - [ ] 2.5 Đưa trang tháng vào sitemap; cập nhật JSON-LD breadcrumb.
  - [ ] 2.6 Trong app, cân nhắc dùng `<a href>` cho ô ngày ở xem Tháng (giữ hành vi điều hướng SPA).

- [ ] 3.0 Tín hiệu lập chỉ mục (F2, F3, F4, F8): làm nhanh
  - [ ] 3.1 URL ngày không hợp lệ hoặc ngoài khoảng hỗ trợ: trả 404 thật, hoặc đặt `noindex` và không hiện nội dung hôm nay.
  - [ ] 3.2 `noindex` cho `/week/**` (và `/month/**` nếu không làm 2.1) ngay từ HTML hoặc header `X-Robots-Tag` trong `firebase.json`.
  - [ ] 3.3 Bỏ canonical trỏ về trang chủ trong HTML trả cho các rewrite không phải trang chủ.
  - [ ] 3.4 Thêm `lastmod` vào sitemap (ngày build, hoặc ngày đổi nội dung nếu theo dõi được).
  - [ ] 3.5 Phần `<noscript>` của trang ngày: hạ `<h1>Lịch Việt</h1>` thành chữ thường, giữ một H1.
  - [ ] 3.6 Cân nhắc giữ prerender cho các năm cũ đã có lượt truy cập thay vì trượt hẳn theo năm build.

- [ ] 4.0 Nội dung và độ tin cậy (F10, F11): dài hạn
  - [ ] 4.1 Trang công khai `/huong-dan` (hoặc tương tự) về cách tính và nguồn của lịch vạn niên, sinh tĩnh như privacy/terms.
  - [ ] 4.2 Link trang này từ trang ngày, trang tháng và chân trang; thêm vào sitemap.
  - [ ] 4.3 Nội dung riêng cho ngày đặc biệt (Tết, rằm, mùng 1, lễ, tiết khí): đoạn giải thích ngắn khác khuôn chung.
  - [ ] 4.4 Thêm trang Giới thiệu (ai làm, liên hệ) nếu muốn tăng tín hiệu tin cậy.

- [ ] 5.0 Tên miền phụ (F5): theo dõi
  - [ ] 5.1 Kiểm tra trong Search Console xem `calendar-hana.web.app` có trang nào được lập chỉ mục.
  - [ ] 5.2 Nếu có, cân nhắc header `X-Robots-Tag: noindex` cho host phụ (nếu Hosting cho phép theo host) hoặc giữ canonical hiện tại.

## Kết quả

| Ngày | Thay đổi | Lighthouse mobile (Perf / LCP) | Ghi chú |
| --- | --- | --- | --- |
| 02/10/2026 | Audit ban đầu | 56 / 8,1 s | Trang thật, bản deploy 01/10 |
