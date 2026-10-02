# Task 8 — nghiệm thu và chuẩn bị phát hành

Ngày kiểm tra: **02/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`. Chưa commit/deploy.

Task 8 đã gom trạng thái P1/P2/P3 vào [`feng-shui-release-checklist.md`](feng-shui-release-checklist.md),
cập nhật README, privacy, regression giao diện và snapshot có chủ đích. Không mở rule pending hoặc P4.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| Unit/fixture/regression | 956/956 test, 88/88 file đạt |
| Firebase Emulator | 28/28 test, 3/3 file đạt |
| Phong thủy E2E | 55/55 trên desktop, mobile, Firefox, WebKit và iPhone |
| Toàn bộ Playwright | **460 đạt, 95 skip theo capability, 0 lỗi** trên desktop/mobile/Firefox/WebKit/iPhone; gồm snapshot macOS, axe, offline và user stories |
| Dependency | `npm audit --audit-level=high`: 0 lỗ hổng |
| Benchmark warm | 1.000 lần, trung bình 0,3028 ms/lần trên Node 23.7.0 |

Lượt E2E đầu phát hiện test cũ giả định ba công tắc, snapshot trước tính năng và toast service worker
gây nhiễu snapshot/click Firefox. Test đã được sửa, snapshot có chủ đích được xem và cập nhật, sau đó
toàn bộ 555 ca được chạy lại với kết quả chính thức ở trên. Giới hạn thiết bị thật, người dùng thật,
screen reader thật và cảnh báo bundle được giữ trong release checklist.
