# Thiết kế: Phạm Thái Tuế, Tuế Phá, Tam Sát và Sát Chủ

## Tóm tắt yêu cầu

- Thêm kết quả vào khu vực **Phong thủy cá nhân**, chỉ khi hồ sơ có ngày sinh hợp lệ.
- Phạm Thái Tuế, Tuế Phá và Tam Sát được tính từ quan hệ giữa chi tuổi âm lịch và chi năm âm lịch đang xem.
- Phạm Thái Tuế gồm Trực, Xung, Hình/Tự Hình, Hại và Phá; có thể đồng thời phạm nhiều kiểu.
- Tuế Phá mặc định dùng Lục Xung và không được đếm hai lần với Xung Thái Tuế.
- Tam Sát lấy nhóm Tam Hợp của chi tuổi rồi kiểm tra chi năm có thuộc bộ ba kỵ hay không.
- Sát Chủ Âm/Dương được tính từ tháng âm lịch và chi ngày đang xem, không theo tuổi.
- Dùng bảng Sát Chủ Âm đã audit: tháng 7 = Hợi, tháng 8 = Sửu.

## Giả định và yêu cầu phi chức năng

- Mốc đổi năm là Tết âm lịch Việt Nam; ngày sinh trước Tết thuộc năm âm trước.
- Toàn bộ phép tính chạy cục bộ từ bảng tĩnh, không gọi server hoặc AI.
- Kết quả dùng ngày đang xem, không dùng đồng hồ hiện tại; tháng nhuận dùng bảng tháng chính.
- Không thu thập thêm dữ liệu cá nhân. Giờ sinh không tham gia vì công thức đã duyệt không dùng giờ.
- Module tính toán độc lập với React để dễ kiểm thử và bảo trì.
- Nội dung phải nói rõ đây là quan niệm truyền thống để tham khảo, không khẳng định hậu quả.

## Thiết kế được chọn

Tạo engine độc lập cho các quan hệ phạm theo tuổi và engine Sát Chủ ngày. Kết quả theo tuổi được thêm vào phần “Hạn theo năm”; Sát Chủ được đặt thành một mục tách biệt ngay bên dưới để không bị hiểu là kết quả do tuổi.

### Dữ liệu và thuật toán

- `assessPersonalAnnualAfflictions(birthDate, viewDate)` quy đổi hai ngày sang năm âm, lấy chi tuổi và chi năm, rồi trả danh sách kiểu phạm Thái Tuế, Tuế Phá và kết quả Tam Sát.
- Quan hệ dùng bảng tra Lục Xung, Lục Hại, Lục Phá, Tam Hình và Tự Hình từ spec chi tiết.
- `evaluateSatChu(lunarMonth, dayBranch)` trả riêng Sát Chủ Âm và Sát Chủ Dương cùng chi kỳ vọng.
- Bảng “Sát Chủ cá nhân theo chi tuổi” trong `technical_specification.md` không được dùng vì người dùng đã chọn Sát Chủ ngày trong spec chi tiết.

### Giao diện

- Khi ngày sinh thiếu hoặc không hợp lệ: giữ nguyên màn hình mời nhập/sửa ngày sinh; không hiện các mục mới.
- Khi hồ sơ hợp lệ: thêm nhóm “Phạm theo tuổi” trong “Hạn theo năm”.
- Xung Thái Tuế và Tuế Phá được gộp thành một dòng.
- Sát Chủ Âm/Dương hiện trong mục “Sát Chủ của ngày”, ghi rõ “tính theo ngày, không theo tuổi”.
- Kết quả không phạm vẫn được hiển thị rõ, tránh để khoảng trống khó hiểu.

## Kiểm thử

- RED trước implementation cho 9 ca chuẩn trong spec, đủ các quan hệ Thái Tuế và bốn nhóm Tam Sát.
- Kiểm toàn bộ bảng Sát Chủ 12 tháng, đặc biệt tháng 7/8 và phân biệt Tỵ/Tý.
- Kiểm ngày sinh trước Tết lấy chi của năm âm trước và ngày xem đổi kết quả đúng tại Tết.
- Kiểm UI không hiển thị khi thiếu/sai ngày sinh và hiển thị khi ngày sinh hợp lệ.
- Chạy test liên quan, toàn bộ test, lint, typecheck và build.

## Decision log

1. Dùng engine phạm theo tuổi độc lập, lấy chi tuổi từ ngày sinh đã đổi sang âm lịch.
2. Dùng 5 quan hệ Thái Tuế và Tam Sát theo chi tuổi từ spec chi tiết; không an lá số Tử Vi hoặc dùng Nhật chủ.
3. Dùng bảng Sát Chủ Âm mới đã sửa tháng 7/8 và bảng Sát Chủ Dương trong spec chi tiết.
4. Sát Chủ chỉ tính theo ngày; loại bỏ thuật toán “Sát Chủ cá nhân theo chi tuổi” của technical spec.
5. Ngày sinh vừa là cổng mở khóa vừa là đầu vào xác định chi tuổi; giờ sinh không tham gia.
6. Không thêm Thụ Tử và không thêm tùy chọn Lập Xuân/Lục Phá trong phiên bản này.

