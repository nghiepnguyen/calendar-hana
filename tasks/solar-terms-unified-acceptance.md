# Nghiệm thu can chi và nguồn chung 24 tiết khí — 06/10/2026

## Kết quả và quy ước

- `shared/lunar/solarTerms.ts` là nguồn chung cho 24 thời điểm giao tiết. Engine: astronomy-engine 2.1.19; phương pháp: `astronomy-engine-search-sun-longitude-v1`.
- Mỗi tiết có mã ổn định, chỉ số, tên, góc và thời điểm UTC. Bộ nhớ đệm giữ tối đa 16 năm; kết quả được đóng băng để tránh sửa nhầm dữ liệu dùng chung.
- Lịch ngày dùng UTC+7 cố định và lấy tiết ngay trước nửa đêm kế tiếp. Cả ngày có giao tiết mang nhãn tiết mới. `startsAtUtc` là thời điểm bắt đầu tiết được hiển thị, kể cả ngày không giao tiết.
- `getSolarTermAt` nhận thời điểm có múi giờ; trước giao tiết vẫn là tiết cũ, từ đúng thời điểm giao trở đi là tiết mới. Bát tự dùng thời điểm này thông qua nguồn chung, không dùng nhãn cuối ngày.
- Chu kỳ 12 tiết mở tháng của Bát tự vẫn bắt đầu ở Lập Xuân và kết thúc ở Tiểu Hàn năm kế tiếp; tên và giao diện trả về được giữ nguyên.
- Can chi lịch ngày: năm đổi ở Tết, tháng theo tháng âm; tháng nhuận dùng cùng can chi tháng cùng số. Bát tự: năm đổi ở Lập Xuân, tháng đổi theo 12 tiết mở tháng. Hai chính sách giờ Tý hiện có được giữ nguyên.
- Giao diện Lịch vạn niên hiện giờ bắt đầu theo Việt Nam vào ngày giao tiết, ví dụ Bạch lộ 07/09/2026 lúc 21:41. Hiển thị giờ/phút, bỏ phần giây.
- Phạm vi lịch 1900–2100; bộ tính năm có thêm 1899 và 2101 để xử lý biên. Không thay đổi thuật toán âm–dương hoặc quy tắc tốt/xấu.

## Đối chiếu và giới hạn

- 24 mốc trung khí năm 2024–2025 từ HKO, công bố theo UTC+8 và độ chính xác đến phút: sai lệch lớn nhất đo được 41,327 giây, dưới ngưỡng 60 giây. Fixture lưu thời điểm có offset để tránh nhầm ngày Việt Nam và Hong Kong.
- Nguồn: https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf và https://www.hko.gov.hk/en/gts/astron2025/files/2025SolarTerms24.pdf.
- 12 mốc tiết mở tháng trong bộ tham chiếu JPL hiện có tiếp tục đạt ngưỡng 30 giây. Đây là dữ liệu tham chiếu sẵn có của dự án; không tải lại JPL trong đợt này.
- Kiểm thử toàn bộ 4.824 giao tiết thuộc các năm 1900–2100: nhãn ngày Việt Nam và cờ bắt đầu nhất quán. Đây là kiểm tra tính nhất quán, không phải đối chiếu độc lập toàn miền năm. Chưa tuyên bố độ chính xác 30/60 giây cho toàn bộ 1900–2100.
- So với công thức `sunLongitude` cũ trên toàn bộ ngày 1900–2100: 36 ngày đổi nhãn, do giao tiết sát nửa đêm. Danh sách ngày, nhãn cũ/mới và thời điểm giao lưu ở `fixtures/solar-terms-migration.v1.json`. Fixture này là bằng chứng chuyển đổi, không phải nguồn thiên văn độc lập. Không có thay đổi nhãn trong 2024–2026.
- Đo tham khảo tại máy phát triển: tính 24 tiết của một năm chưa cache khoảng 0,56 ms; 10.000 lần lấy năm đã cache khoảng 0,27 ms. Không coi đây là cam kết hiệu năng trên mọi thiết bị.

## Kiểm tra

- Kiểm thử can chi trước/sau Tết, tháng nhuận, chu kỳ 60 ngày và chính sách giờ Tý.
- Kiểm thử trước/đúng/sau giao tiết, biên lịch 1900/2100, Lập Xuân Bát tự, cache bất biến và tính lại sau khi bị đẩy khỏi cache.
- Kiểm thử trình duyệt desktop, Android và iPhone: giờ giao tiết hiện đúng, không tràn ngang, ngày kế tiếp không hiện dòng bắt đầu. Đã xem ảnh kiểm tra trên điện thoại.
- Kiểm tra kiểu frontend và Functions, lint, định dạng, bản dựng frontend và Functions đạt. Bản dựng frontend còn cảnh báo kích thước chunk và tùy chọn cấu hình Vite deprecated; không phải lỗi biên dịch.
- Kiểm tra dependency offline báo không có lỗ hổng từ dữ liệu sẵn có; chưa truy vấn cơ sở dữ liệu lỗ hổng trực tuyến.
