# Task 7 — nghiệm thu hồ sơ sinh và Tứ Trụ P3

Ngày kiểm tra: **02/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`. Chưa commit/deploy.

## Phạm vi hoàn tất

- Mở rộng `Settings` bằng nơi sinh, tọa độ nguồn, timezone, offset xác nhận, độ chắc chắn và quy
  ước giờ Tý; xóa ngày sinh xóa liên đới toàn bộ metadata.
- Local, Firestore, JSON và migration giữ dữ liệu cũ, chuyển đủ metadata mới và không ghi đè hồ sơ
  cloud đã nhập hoặc đã xóa.
- Pipeline thuần chuẩn hóa wall time Việt Nam thành UTC, tính TST, 12 tiết mở tháng, hai quy ước giờ
  Tý và bốn trụ. Output gắn version rules 1.1.0, Astronomy Engine 2.1.19 và tzdb 2026d.
- Khoảng bất định và giờ lặp trả nhiều ứng viên, tối đa tám; thiếu dữ liệu không tự điền giờ.
- `BaziSection` nằm trong khối Phong thủy cá nhân, hiển thị bốn trụ, giờ hành chính/TST, hiệu chỉnh,
  nguồn, policy và giới hạn.
- Engine chạy trong bundle, được PWA precache và không gửi hồ sơ tới dịch vụ luận giải ngoài.
  Chính sách riêng tư và thông báo giấy phép đã được cập nhật.

## Biên và giới hạn

- Miền hỗ trợ là Việt Nam 1900–2100; form hiện cung cấp địa danh Hà Nội và TP. Hồ Chí Minh. Trước
  1970 người dùng phải xác nhận offset. Giờ lặp miền Nam ngày 12/06/1975 trả hai instant.
- Không có khoảng giờ DST bị khuyết trong miền auto 1970–2100 đã chốt cho hai timezone Việt Nam;
  input lịch sử trước mốc này không được tự đoán để tạo một ca gap giả.
- TST và giao tiết đạt ngưỡng benchmark ≤30 giây của Task 6. Độ chính xác engine và độ chắc chắn
  giờ/tọa độ đầu vào được hiển thị riêng.
- Astronomy Engine browser minified là khoảng **116 KiB**. Build hiện có chunk ứng dụng 914,35 kB
  (gzip 278,07 kB); cảnh báo chunk >500 kB đã tồn tại và sẽ được theo dõi ở Task 8.

## Kiểm tra dự án

| Kiểm tra | Kết quả |
| --- | --- |
| TDD lõi P3 | **17/17** test Bát Tự đạt, gồm benchmark 12 TST/12 giao tiết, năm 1900, overlap, uncertainty, đủ 10 Can giờ Tý và hai policy. |
| Full unit/component | **956 test / 88 file đạt**; chỉ có cảnh báo `window.scrollTo` của jsdom đã biết. |
| Firebase emulator | **28/28** test đạt; xác nhận round-trip/xóa metadata, migration và phân quyền tài khoản. |
| Playwright | **55/55** ca hồ sơ và phong thủy đạt trên desktop/mobile/Firefox/WebKit/iPhone, gồm tính Tứ Trụ khi offline. |
| Static/build | Typecheck, oxlint, Prettier và Vite/PWA/prerender đạt; PWA precache 34 mục, 2.106,54 KiB. |
| Dependency | `npm audit --audit-level=high`: **0 lỗ hổng**. Astronomy Engine 2.1.19, giấy phép MIT. |

Task 8 vẫn chịu trách nhiệm nghiệm thu phát hành tổng thể, chạy lại toàn bộ E2E sau mọi thay đổi,
đo thiết bị thật/Safari và kiểm thử người dùng. Task 7 không deploy production và không mở P4.
