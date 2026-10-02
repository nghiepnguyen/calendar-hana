# Checklist phát hành Phong thủy cá nhân

Ngày nghiệm thu tự động: **02/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`.
Không deploy production trong quy trình này.

## Trạng thái từng lớp

| Lớp | Phạm vi được mở | Version | Trạng thái |
| --- | --- | --- | --- |
| P1 | Kim Lâu, Hoang Ốc 10–69, Tam Tai theo mục đích/vai trò | rules 1.0.0 | Đạt nghiệm thu tự động |
| P2 | Can xung cá nhân, hiển thị tách khỏi summary ngày | `personal.can-xung@1.0.0` | Đạt nghiệm thu tự động |
| P3 | Hồ sơ sinh Việt Nam 1900–2100, UTC/TST, giao tiết, giờ Tý, Tứ Trụ | rules 1.1.0; Astronomy 2.1.19; tzdb 2026d | Đạt nghiệm thu tự động |

PRD: [`prd-personal-feng-shui.md`](prd-personal-feng-shui.md),
[`prd-annual-feng-shui.md`](prd-annual-feng-shui.md),
[`prd-personal-feng-shui-stars.md`](prd-personal-feng-shui-stars.md) và
[`prd-birth-time-normalization.md`](prd-birth-time-normalization.md). Registry nguồn và gate nằm ở
[`feng-shui-rule-audit.md`](feng-shui-rule-audit.md).

## Bằng chứng phát hành

- Unit/fixture: 956 test trong 88 file đạt. Bao phủ ma trận hạn năm, purpose/role, Can xung, lịch âm,
  Can Chi, nạp âm, sao/giờ chung, timezone lịch sử, overlap 1975, TST, 12 giao tiết, hai policy giờ
  Tý và uncertainty.
- Firebase Emulator: 28 test trong 3 file đạt. Rules chặn tài khoản khác; local/cloud/JSON/migration
  giữ hồ sơ mới, không ghi đè hồ sơ cloud và xóa liên đới metadata.
- Playwright phong thủy: 55/55 ca đạt trên Chromium desktop/Pixel, Firefox, WebKit và iPhone 15;
  gồm offline, 360px, sáng/tối, ba cỡ chữ, bàn phím và axe WCAG A/AA.
- Toàn bộ Playwright: 460 đạt, 95 skip theo capability, 0 lỗi. Lượt đầu phát hiện baseline cũ còn
  giả định ba công tắc và snapshot trước tính năng. Test đã được sửa để kiểm tra đủ bốn công tắc;
  snapshot được cập nhật sau khi xem diff trực tiếp và toàn bộ 555 ca được chạy lại.
- Static/build: typecheck, oxlint, Prettier, `git diff --check`, Vite/PWA/prerender đạt. npm audit
  không có lỗ hổng.

## Hiệu năng, dung lượng và offline

- Benchmark warm trên máy phát triển, Node 23.7.0: 1.000 lần tính hồ sơ chính xác trung bình
  **0,3028 ms/lần**. Đây không thay thế phép đo trên điện thoại tầm trung thật.
- Astronomy Engine browser minified khoảng 116 KiB. Build có chunk app 914,35 kB, gzip 278,09 kB;
  PWA precache 34 mục, khoảng 2.106,54 KiB. Cảnh báo chunk >500 kB và cấu hình
  `inlineDynamicImports` deprecated vẫn còn.
- Benchmark tham chiếu Task 6: TST sai số lớn nhất 0,323 giây và giao tiết 19,926 giây, dưới ngưỡng
  30 giây. Sai số engine tách biệt với uncertainty của giờ và tọa độ người dùng.
- E2E xác nhận Tứ Trụ đổi ngày trong SPA khi offline. Service worker cache asset ứng dụng và trang
  pháp lý; không cache Settings, hồ sơ sinh hoặc output Tứ Trụ trong cache công khai.

## Privacy

- Không có field hồ sơ sinh hoặc kết quả trong URL, analytics event/property, session replay, log,
  metadata SEO, JSON-LD hay HTML prerender.
- PostHog tắt autocapture và session recording; panel dùng `ph-no-capture ph-mask`.
- Không có request tới JPL hay dịch vụ luận giải lúc chạy. Astronomy Engine và dữ liệu quy tắc nằm
  trong bundle. Hồ sơ chỉ đi qua repository local/cloud và JSON do người dùng chủ động xuất.
- [`../public/privacy.html`](../public/privacy.html) mô tả ngày/giờ/nơi sinh, Tứ Trụ cục bộ và việc
  không đưa dữ liệu này vào analytics/cache công khai.

## Chưa hỗ trợ hoặc chưa phát hành

- P2 vẫn hoãn Thái Tuế, Tuế Phá, Tam Sát và Sát Chủ cá nhân; không suy từ rule sao chung.
- P3 chưa hỗ trợ ngoài Việt Nam, ngày âm/tháng nhuận làm input, tự dò vị trí thiết bị hoặc tự đoán
  offset trước 1970. Form hiện có Hà Nội/miền Bắc và TP. Hồ Chí Minh/miền Nam.
- P4 đã có PRD, fixture và task triển khai riêng; chưa có engine/UI và chưa được phát hành. Nhật chủ,
  Thập thần hoặc Dụng thần không được suy ngầm từ tên trụ trong P1–P3.
- Chưa đo trên điện thoại tầm trung thật, chưa thử với người dùng thật hoặc screen reader thật.
  WebKit/iPhone trong Playwright là mô phỏng engine/thiết bị. Các bước thủ công này phải hoàn tất
  trước tuyên bố đạt success metrics sản phẩm rộng hơn.

## Quyết định phát hành

P1, phần Can xung P2 và nền tảng Tứ Trụ P3 đủ bằng chứng tự động để tạo release candidate. Không mở
các rule pending hoặc P4. Trước deploy production cần review thay đổi, kiểm tra thiết bị thật và thực
hiện quy trình phát hành riêng.
