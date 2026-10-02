# Task 9 — nghiệm thu đặc tả luận giải Bát Tự P4

Ngày kiểm tra: **02/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`.

## Đầu ra

- `prd-bazi-interpretation.md`: chốt Tử Bình lấy Nhật can làm chủ, tháng lệnh làm trục; contract,
  uncertainty, version, ranh giới nạp âm và gate riêng P4a/P4b/P4c.
- `fixtures/bazi-interpretation.v1.json`: 100 quan hệ Thập thần, 12 Chi/28 tàng can và status cases.
- `tasks-bazi-interpretation.md`: task TDD từ registry/fixture đến engine, UI và nghiệm thu; Dụng thần
  chỉ được mở theo từng decision rule có hai review nguồn.

Task dừng ở tài liệu/fixture/task. Không thêm engine, UI, persistence hoặc feature flag P4.

## Quyết định an toàn phương pháp

- Tên Thập thần chỉ là quan hệ có hướng; không tự gán tốt/xấu hoặc dự báo.
- Vượng/suy dùng evidence có cấu trúc, không có điểm số tùy ý.
- Dụng thần v1 dùng phương pháp tháng lệnh–cách cục. Rule chưa có passage, fixture và hai review trả
  `unsupported`; nhiều rule xung đột trả `indeterminate`.
- Nhiều candidate P3 được tính riêng và giữ source index; không ép thành một kết luận.
- Không dùng đếm hành thiếu, nạp âm năm sinh hoặc một bảng Nhật chủ×tháng đơn lẻ.

## Kiểm tra tài liệu

- Fixture parse được, có ma trận 10×10, đủ 12 Chi và tổng 28 tàng can.
- Ma trận được đối chiếu lại bằng quan hệ ngũ hành và polarity độc lập.
- Prettier và `git diff --check` đạt cho toàn bộ file thay đổi.
- Registry runtime giữ P4 ở trạng thái pending; Task 9 không tự mở gate triển khai/phát hành.

