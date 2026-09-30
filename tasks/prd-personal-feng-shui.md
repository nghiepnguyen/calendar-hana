# PRD: Phong thủy cá nhân

Ngày lập: 30/09/2026. Phạm vi: bản đầu (MVP). Tài liệu yêu cầu sản phẩm, chưa triển khai mã.

## 1. Giới thiệu / Tổng quan

Lịch Việt đang hiển thị Lịch vạn niên với thông tin chung cho từng ngày. Người dùng cần biết ngày và giờ đó có những quan hệ hợp/xung, sinh/khắc nào với tuổi của riêng mình, thay vì chỉ dựa vào nhãn hoàng đạo chung.

Thêm khối riêng **“Phong thủy cá nhân”** trong tab Ngày, ngay dưới khối **“Sự kiện trong ngày”**, trước **“Lịch vạn niên”**. Khối sử dụng một hồ sơ bản thân từ thông tin sinh đã lưu trong Cài đặt, hiển thị kết luận có giải thích và các giờ được gợi ý.

Phạm vi đã chốt với người dùng:

- Bản đầu: Can Chi, ngũ hành và giờ tốt cá nhân.
- Một hồ sơ bản thân, tận dụng ngày/giờ sinh hiện có.
- Bộ quy tắc có nguồn và phiên bản; chỉ bật phần đã kiểm chứng.
- Hạn tuổi và Bát Tự dành cho giai đoạn sau.

**Giới hạn diễn giải:** đây là tham khảo theo quy ước lịch truyền thống. MVP cá nhân hóa theo Can Chi và nạp âm **năm sinh âm lịch**, chưa phân tích toàn bộ ngày/tháng/năm/giờ sinh. Hai người cùng tuổi và nạp âm có thể nhận kết quả giống nhau. Không hứa rằng mọi người có ngày sinh khác nhau đều nhận đánh giá khác nhau.

PRD này mở rộng phạm vi “không xem tuổi riêng” của `prd-day-almanac.md` và “không xem tuổi” của `prd-personal-calendar.md` cho đúng tính năng mô tả tại đây; các chức năng lịch hiện có tiếp tục theo các PRD đó.

## 2. Mục tiêu

1. Khi có ngày sinh hợp lệ, người dùng xem được quan hệ của ngày đang chọn với tuổi, bản mệnh và giờ gợi ý trong tab Ngày.
2. Mỗi kết luận phải truy được về dữ liệu đầu vào và quy tắc cụ thể; không có điểm số hay kết luận do AI tự suy diễn.
3. Người không biết giờ sinh vẫn dùng đầy đủ MVP; người chưa nhập ngày sinh có đường dẫn nhập rõ ràng.
4. Tính được offline sau lần tải đầu, dùng cùng kết quả trên thiết bị với cùng dữ liệu và phiên bản quy tắc.
5. Không làm thay đổi kết quả hoàng đạo/hắc đạo chung của Lịch vạn niên.

## 3. User Stories

| ID | Nhu cầu | Kết quả nghiệm thu |
| --- | --- | --- |
| US-01 | Là người đã lưu ngày sinh, tôi muốn biết ngày đang xem có hợp tuổi không. | Có khối riêng dưới sự kiện, hiển thị tuổi, bản mệnh, nhãn tổng hợp và từng lý do. |
| US-02 | Tôi muốn hiểu vì sao ngày hoàng đạo vẫn có yếu tố cần lưu ý với mình. | Hoàng đạo chung và đánh giá cá nhân được phân biệt; yếu tố xung/khắc vẫn xuất hiện dù ngày là hoàng đạo. |
| US-03 | Tôi muốn chọn giờ hoàng đạo không xung tuổi và ưu tiên giờ hợp tuổi. | Có danh sách giờ gợi ý, danh sách đầy đủ 12 giờ và lý do một giờ được chọn hoặc bị loại. |
| US-04 | Tôi chưa lưu ngày sinh hoặc không biết giờ sinh. | Chưa có ngày sinh thì thấy lời mời nhập; không có giờ sinh vẫn tính đủ MVP. |
| US-05 | Tôi sửa hoặc xóa thông tin sinh. | Sau khi lưu, kết quả cập nhật ngay; xóa ngày sinh thì mọi kết quả cá nhân cũ biến mất. |
| US-06 | Tôi dùng không có tài khoản hoặc mất mạng. | Ngày sinh đã lưu và bộ quy tắc tĩnh đủ để tính; không yêu cầu đăng nhập hay gọi API. |

## 4. Yêu cầu chức năng

### 4.1. Vị trí và bật/tắt

1. Thứ tự trong tab Ngày phải là: **thẻ ngày → sự kiện trong ngày → Phong thủy cá nhân → Lịch vạn niên**. Không có sự kiện vẫn hiển thị khối sự kiện rỗng trước khối mới.
2. Khối mới là một `section` riêng với tiêu đề “Phong thủy cá nhân”, không đặt bên trong `AlmanacPanel` và không nhập vào danh sách sự kiện.
3. Thêm cài đặt **“Hiện Phong thủy cá nhân”**, mặc định bật. Cài đặt này độc lập với `showAuspicious`: tắt Lịch vạn niên chung không tự tắt khối cá nhân và ngược lại.
4. Cài đặt mới phải lưu local, đồng bộ theo tài khoản và đi cùng sao lưu JSON theo cơ chế hiện có. Dữ liệu bản cũ thiếu trường mới được hiểu là bật; không ghi đè lựa chọn đã lưu.
5. Không thêm kết quả vào tab Tháng, Tuần, Danh sách sự kiện hoặc thông báo nhắc hẹn ở MVP.

### 4.2. Hồ sơ và dữ liệu đầu vào

6. Dùng `Settings.birthDate` (dương lịch, `YYYY-MM-DD`) và `Settings.birthTime` (tùy chọn, `HH:mm`), không tạo một kho hồ sơ thứ hai.
7. Ngày sinh phải đầy đủ ngày/tháng/năm, là ngày tồn tại, không nằm trong tương lai và trong khoảng tính lịch của MVP: **1900–2100**. Giữ dữ liệu đã lưu ngoài khoảng, nhưng không tính phong thủy cho dữ liệu đó. Ngày đang xem cũng phải trong khoảng này.
8. Khi chưa có ngày sinh (`null` hoặc `undefined`), hiển thị “Nhập ngày sinh để xem mức độ hợp với bạn” và nút **“Nhập ngày sinh”** mở Cài đặt, đưa người dùng đến form thông tin sinh. Không hiển thị kết quả mẫu như kết quả của người dùng.
9. Dữ liệu sai định dạng hoặc ngoài khoảng hỗ trợ phải có thông báo cụ thể và nút sửa thông tin; không làm lỗi toàn màn hình. Ngày đang xem ngoài khoảng thì thông báo giới hạn của tính năng, không yêu cầu sửa ngày sinh hợp lệ.
10. MVP dùng giờ Việt Nam, `Asia/Ho_Chi_Minh` (UTC+7 trong thuật toán hiện có). Không yêu cầu nơi sinh, giới tính hoặc đăng nhập. Chưa hỗ trợ hiệu chỉnh múi giờ/nơi sinh khác.
11. Quy đổi ngày sinh dương sang âm bằng thuật toán sẵn có; lấy **năm âm lịch sau quy đổi** để tính tuổi Can Chi. Người sinh trước Tết không được tính tuổi bằng năm dương lịch trực tiếp. Không lấy mốc Lập Xuân trong MVP.
12. Bản mệnh là nạp âm của Can Chi năm sinh âm lịch; mệnh ngày là nạp âm của Can Chi ngày đang xem. Không dùng hành của Thiên Can thay thế nạp âm năm sinh.
13. Hiển thị tóm tắt hồ sơ: tuổi Can Chi, tên nạp âm, ngũ hành và nút **“Sửa thông tin sinh”**. Ghi “Đang xem theo tuổi và nạp âm năm sinh”. Không cần hiện toàn bộ ngày sinh trên thẻ.
14. Không có giờ sinh vẫn tính đủ MVP. Không dùng giờ sinh để thay đổi kết quả bản đầu; trong phần giải thích ghi “Giờ sinh sẽ được dùng khi có phân tích Bát Tự”.
15. Chỉ dữ liệu **đã lưu** được dùng để tính. Thay đổi chưa lưu trong form không cập nhật khối. Sau lưu/sync, kết quả cập nhật theo dữ liệu hiện tại mà không cần tải lại trang.

### 4.3. Quan hệ Địa Chi

16. So sánh Chi của ngày với Chi năm sinh theo bảng quy tắc tại mục 7.2, trả một trong các nhãn:
    - **“Xung tuổi”** nếu thuộc một cặp lục xung.
    - **“Lục hợp”** nếu thuộc một cặp lục hợp.
    - **“Cùng nhóm tam hợp”** nếu là hai Chi khác nhau trong một nhóm tam hợp.
    - **“Cùng Chi”** nếu giống nhau.
    - **“Không có quan hệ hợp/xung trong phạm vi đang xét”** cho các trường hợp còn lại.
17. “Cùng nhóm tam hợp” là so sánh hai Chi, không khẳng định đã hình thành đủ tam hợp cục. “Cùng Chi” không tự động được coi là tốt.
18. Mỗi nhãn kèm cặp dữ liệu, ví dụ “Ngày Tý xung tuổi Ngọ” hoặc “Ngày Tý và tuổi Thân cùng nhóm Thân–Tý–Thìn”. MVP không bổ sung hình, hại, phá hay tự hình.

### 4.4. Quan hệ Thiên Can

19. So sánh Can ngày với Can năm sinh. Hiển thị các dấu hiệu áp dụng: **Can hợp**, **cùng Can**, hoặc quan hệ ngũ hành của hai Can có hướng (Can ngày sinh/khắc Can tuổi hoặc ngược lại).
20. **Can hợp** theo năm cặp tại mục 7.2. Khi có Can hợp, dùng nhãn này làm đánh giá chính của nhóm Thiên Can; quan hệ ngũ hành vẫn có thể xem trong chi tiết, nhưng không tính thêm một cảnh báo khắc cho cùng cặp. Đây là quy tắc tổng hợp của sản phẩm, không khẳng định hai Can đã “hóa” thành hành khác.
21. Nếu không có Can hợp: Can ngày khắc Can tuổi hoặc Can tuổi khắc Can ngày là dấu hiệu cần lưu ý; Can ngày sinh Can tuổi là dấu hiệu thuận; cùng hành và Can tuổi sinh Can ngày là thông tin trung tính trong tổng hợp MVP.
22. Không gọi mọi cặp Can khắc nhau là **“Thiên Can tương xung”**. Ví dụ Giáp–Mậu được mô tả theo chiều ngũ hành Can, không mặc định là một cặp Can xung. Bảng Can xung riêng chỉ được thêm ở phiên bản sau khi xác nhận phương pháp và nguồn.

### 4.5. Ngũ hành nạp âm

23. So sánh mệnh ngày với bản mệnh; phải bao phủ đủ 25 tổ hợp có hướng của năm hành.

| Quan hệ | Nhãn hiển thị | Vai trò trong tổng hợp MVP |
| --- | --- | --- |
| Ngày sinh bản mệnh | “Ngày sinh mệnh” | Thuận |
| Ngày cùng hành bản mệnh | “Bình hòa” | Thuận |
| Bản mệnh sinh ngày | “Mệnh sinh ngày (sinh xuất)” | Trung tính, giải thích chiều sinh |
| Ngày khắc bản mệnh | “Ngày khắc mệnh (khắc nhập)” | Cần lưu ý |
| Bản mệnh khắc ngày | “Mệnh khắc ngày (khắc xuất)” | Cần lưu ý |

24. Luôn ghi chủ thể và chiều tương tác, ví dụ “Ngày hành Thủy sinh bản mệnh Mộc”. Khắc nhập là ngày khắc bản mệnh; khắc xuất là bản mệnh khắc ngày. Không dùng hai thuật ngữ thay thế nhau.
25. Không dự đoán bệnh, mất tiền hoặc kết quả cụ thể từ một quan hệ sinh/khắc. Không suy ra Dụng thần hoặc hành còn thiếu bằng nạp âm năm sinh.

### 4.6. Kết luận tổng hợp

26. MVP không dùng điểm số 0–100, trọng số ẩn hoặc nhãn tuyệt đối “đại cát/đại hung”. Dùng quy tắc tổng hợp sau, áp dụng theo thứ tự:
    1. Có **Xung tuổi**, **Can khắc không được ưu tiên Can hợp**, hoặc một trong hai chiều **nạp âm khắc** → **“Có yếu tố cần lưu ý”**.
    2. Không có yếu tố trên và có ít nhất một dấu hiệu thuận: Lục hợp, cùng nhóm tam hợp, Can hợp, Can ngày sinh Can tuổi, ngày sinh mệnh, bình hòa → **“Có yếu tố thuận”**.
    3. Còn lại → **“Trung tính trong phạm vi đang xét”**.
27. Nếu thuận và bất lợi cùng tồn tại, giữ nhãn “Có yếu tố cần lưu ý”, hiển thị **cả hai nhóm lý do**; không để dấu hiệu thuận che mất xung/khắc.
28. Không đưa nhãn hoàng đạo/hắc đạo chung, sao chung hoặc các hạn chưa triển khai vào phép tổng hợp này. Nếu hiển thị trạng thái ngày chung để đối chiếu, phải ghi “Đánh giá chung”.
29. Phần giải thích ghi rõ: “Kết quả tham khảo theo tuổi và nạp âm năm sinh, chưa xét hạn tuổi hoặc Bát Tự.” Nhãn tổng hợp là quy ước trình bày của Lịch Việt, không phải kết luận thống nhất của mọi trường phái.

### 4.7. Giờ tốt cá nhân

30. Lấy đầy đủ 12 giờ và trạng thái hoàng đạo từ `getAllHours`; giữ nguyên Can Chi giờ, thần trực giờ và cách tính chung của ứng dụng.
31. Với từng giờ, so sánh Chi giờ với Chi năm sinh và Can giờ với Can năm sinh bằng cùng bộ quy tắc ở mục 4.3–4.4. Không dùng giờ sinh của người dùng trong MVP.
32. Một giờ chỉ vào danh sách **“Giờ hoàng đạo phù hợp hơn với bạn”** khi đồng thời:
    - Là giờ hoàng đạo chung.
    - Không lục xung với Chi tuổi.
    - Không có quan hệ Can khắc theo một trong hai chiều, trừ cặp được ưu tiên Can hợp theo yêu cầu 20.
33. Trong danh sách đủ điều kiện, chia hai nhóm:
    - **“Ưu tiên”**: có Lục hợp, cùng nhóm tam hợp, Can hợp hoặc Can giờ sinh Can tuổi.
    - **“Có thể cân nhắc”**: không có dấu hiệu ưu tiên trên.
    Trong mỗi nhóm, sắp theo thứ tự 12 Chi Tý → Hợi. Không có điểm số ngầm.
34. Giờ hắc đạo hợp tuổi vẫn ghi “Hắc đạo chung”, không được nâng thành giờ hoàng đạo cá nhân. Giờ hoàng đạo xung tuổi vẫn giữ nhãn hoàng đạo chung nhưng ghi “Xung tuổi — không gợi ý”.
35. Bên dưới danh sách gợi ý có phần **“Xem đủ 12 giờ”**, mở/đóng được. Mỗi giờ có tên, khoảng giờ, Can Chi giờ, trạng thái chung, quan hệ với tuổi và lý do được gợi ý hoặc bị loại. Một giờ có thể có nhiều lý do.
36. Không dùng nạp âm giờ hoặc suy diễn hành giờ bổ khuyết Dụng thần ở MVP. Giải thích rằng gợi ý giờ mới xét hoàng đạo chung và quan hệ Can Chi với tuổi, không bảo đảm đảo ngược kết luận cần lưu ý của cả ngày.
37. Không có giờ đủ điều kiện thì hiện “Không có giờ hoàng đạo đáp ứng bộ tiêu chí cá nhân trong ngày này”; vẫn cho xem 12 giờ, không tự nới tiêu chí.
38. Giờ Tý trong ngày đang xem gồm **00:00–01:00 và 23:00–24:00 của chính ngày đó**, dùng Can Chi giờ theo ngày đang xem. Hiển thị hai đoạn này trong chi tiết để tránh hiểu 00:00–01:00 là của ngày hôm sau. Ngày đổi lúc 00:00 theo quy ước ứng dụng; không đổi ngày lúc 23:00.
39. Chỉ đánh dấu “Bây giờ” khi ngày đang xem là hôm nay, tái sử dụng `useNow` và logic `hourIndex` hiện có. Khoảng giờ là đầu đóng, cuối mở: 01:00 thuộc Sửu, 23:00 thuộc Tý. Sang 00:00 dùng dữ liệu ngày mới nếu đang xem ngày mới; không đổi hồ sơ hoặc tự chuyển ngày người dùng đang xem.

### 4.8. Nguồn quy tắc, lưu trữ và riêng tư

40. Mỗi nhóm quy tắc phải có ID ổn định, phiên bản, nguồn, quy ước và trạng thái kiểm chứng trong dữ liệu kỹ thuật. Phần “Cách tính và nguồn” phải cho xem bản giải thích tiếng Việt và phiên bản đang dùng.
41. Chỉ đưa vào kết quả và tổng hợp những quy tắc đã được kiểm chứng bằng bảng và fixture; quy tắc còn tranh luận/thiếu nguồn không được âm thầm tính. Nếu thiếu nhóm bắt buộc của MVP thì chưa đạt điều kiện phát hành, không trả “trung tính” như thể nhóm đó đã được tính.
42. Ngày sinh tiếp tục theo cơ chế lưu local/cloud, xuất/nhập JSON, xóa và đăng xuất hiện có. Không yêu cầu quyền Google mới; Google chỉ hỗ trợ điền ngày sinh theo luồng đã có.
43. Không đưa ngày/giờ sinh, tuổi, bản mệnh hoặc kết quả cá nhân vào analytics, session replay, log, URL, HTML prerender, metadata SEO hay cache công khai. Có thể đo hiệu năng bằng hồ sơ thử cố định.
44. Khi đổi tài khoản, đăng xuất, sửa/xóa ngày sinh hoặc đổi phiên bản quy tắc, không được hiện kết quả cache của hồ sơ trước. Màn hình phải dùng đúng nguồn dữ liệu hiện đang hoạt động.

## 5. Ngoài phạm vi / Non-Goals

- Nhiều hồ sơ người thân; ghép tuổi hai người; chọn người thực hiện sự kiện.
- Trang tìm ngày, lọc khoảng ngày hoặc đánh giá theo mục đích cưới hỏi/làm nhà/khai trương.
- Kim Lâu, Hoang Ốc, Tam Tai, Sát Chủ/Thụ Tử cá nhân, Thái Tuế/Tuế Phá theo năm/tháng/ngày.
- Lập Bát Tự/Tứ Trụ, Dụng thần, Nhật chủ, Thập thần, đại vận; không ghép Tử Vi và Bát Tự thành cùng một phương pháp.
- Hình/hại/phá, Can xung riêng, hóa hợp, xét chi tiết tương tác từng loại nạp âm.
- Hiệu chỉnh giờ mặt trời, nơi sinh, múi giờ lịch sử hoặc hồ sơ sinh ngoài Việt Nam.
- Chấm điểm tài lộc/sức khỏe/tình cảm, dự đoán chắc chắn tương lai, trả phí hoặc tư vấn chuyên gia.
- Tự đổi ngày/giờ sự kiện, ngăn tạo sự kiện hoặc thêm cảnh báo vào nhắc hẹn.
- Triển khai mã hoặc lập danh sách task kỹ thuật trong yêu cầu tạo spec này.

## 6. Thiết kế / Design Considerations

Theo component, màu và kiểu `glass` hiện có. Khối mới phải độc lập về bố cục với khối Lịch vạn niên, hỗ trợ sáng/tối, cỡ chữ Mặc định/Lớn/Rất lớn và chữ đậm hơn.

Thứ tự nội dung khối:

1. Tiêu đề “Phong thủy cá nhân”, tóm tắt tuổi và bản mệnh, nút sửa hồ sơ.
2. Nhãn tổng hợp kèm lý do quan trọng nhất; nếu có Xung tuổi thì lý do này đứng trước.
3. Ba nhóm: **Địa Chi với tuổi**, **Thiên Can với tuổi**, **Ngũ hành nạp âm**. Mỗi nhóm có dữ liệu đang so sánh và diễn giải ngắn.
4. **Giờ hoàng đạo phù hợp hơn với bạn**, chia nhóm Ưu tiên/Có thể cân nhắc và phần xem đủ 12 giờ.
5. Giới hạn phương pháp và nút **“Cách tính và nguồn”**.

Trạng thái chưa có hồ sơ là một thẻ ngắn có nút nhập; không hiện các nhóm rỗng. Trạng thái dữ liệu không hợp lệ khác với chưa nhập. Khi nguồn tài khoản đang tải, dùng trạng thái chờ; không tạm lấy hồ sơ local để hiển thị rồi thay bằng hồ sơ cloud.

Nhãn thuận/cần lưu ý dùng màu cùng chữ hoặc biểu tượng; không chỉ phân biệt bằng xanh/đỏ. Vùng bấm ít nhất 44px, dùng `iconSize` và `--ui-scale` theo dự án. Không tràn ngang ở màn 360px với cỡ chữ Rất lớn; danh sách giờ có thể chuyển thành một cột.

Dùng tiêu đề có cấp bậc, nhãn đọc màn hình cho từng giờ gồm cả trạng thái chung và cá nhân. Nút mở chi tiết dùng được bằng bàn phím; dialog giải thích đóng bằng Esc và trả focus. Không thông báo lại toàn bộ kết quả qua live region mỗi lần đồng hồ cập nhật.

## 7. Kỹ thuật / Technical Considerations

### 7.1. Tận dụng dự án hiện tại

| Thành phần | Sử dụng |
| --- | --- |
| `shared/types.ts`, `shared/birthInfo.ts` | Hồ sơ sinh/cài đặt và kiểm tra ngày giờ; bổ sung kiểm tra khoảng tính cho tính năng này. |
| `shared/lunar/index.ts`, `canChi.ts`, `napAm.ts` | Chuyển ngày sinh sang âm, tính Can Chi tuổi/ngày và nạp âm. |
| `shared/lunar/elements.ts` | Ngũ hành Can và vòng sinh/khắc; không dùng `getCanChiRelation` trực tiếp để đánh giá cá nhân vì hàm này so Can với Chi của cùng ngày. |
| `shared/lunar/auspicious.ts` | `getAllHours` và hoàng đạo chung của giờ. |
| `src/views/DayView/DayView.tsx` | Chèn component riêng ngay sau section sự kiện. |
| `src/pages/Settings/BirthInfoForm.tsx` | Nhập/sửa hồ sơ đã có; không nhân đôi form. |
| Repository, sao lưu JSON và sync hiện có | Thêm cài đặt bật/tắt, xử lý bản cũ và chuyển tài khoản. |

Đề xuất logic mới trong `shared/personalFengShui/`, gồm hàm thuần cho quan hệ Can/Chi, ngũ hành có hướng, tổng hợp và giờ. Kết quả nên tách dữ liệu khỏi văn bản giao diện, chứa `ruleId`, `rulesetVersion`, quan hệ, mức đánh giá và các toán hạng; cùng một bộ hàm phục vụ ngày và giờ.

Component đề xuất: `PersonalFengShuiPanel` trong `src/views/DayView/`. Tính theo ngày đang xem và hồ sơ đang hoạt động; không nhét kết quả cá nhân vào `DayInfo` hoặc cache lịch chung dùng cho Tháng/SEO.

Không lưu kết quả dẫn xuất lên Firestore. Nếu memo/cache, khóa phải bao gồm ngày đang xem, dữ liệu hồ sơ thực sự dùng, ngữ cảnh tài khoản và phiên bản quy tắc. Không đưa ngày sinh vào tên khóa cache persisted hoặc log.

### 7.2. Bộ quy tắc MVP

Phiên bản đề xuất: **`personal-feng-shui-v1`**. Các quy tắc tổng hợp ngày/giờ là quyết định sản phẩm tại mục 4.6–4.7, phải được version cùng bảng tra.

**Bảng quan hệ:**

| Loại | Các cặp / nhóm |
| --- | --- |
| Lục xung | Tý–Ngọ; Sửu–Mùi; Dần–Thân; Mão–Dậu; Thìn–Tuất; Tỵ–Hợi |
| Lục hợp | Tý–Sửu; Dần–Hợi; Mão–Tuất; Thìn–Dậu; Tỵ–Thân; Ngọ–Mùi |
| Nhóm tam hợp | Thân–Tý–Thìn; Dần–Ngọ–Tuất; Hợi–Mão–Mùi; Tỵ–Dậu–Sửu |
| Thiên Can hợp | Giáp–Kỷ; Ất–Canh; Bính–Tân; Đinh–Nhâm; Mậu–Quý |

Các bảng trên đã đối chiếu với [tài liệu chính thức của Lunisolar, mục quan hệ Can Chi](https://lunisolar.js.org/reference/stemBranch.html). Nguồn này dùng để kiểm tra bảng quan hệ; không nhập các phép hóa hợp hoặc bộ thần sát của thư viện vào ứng dụng.

Vòng sinh/khắc giữ theo `shared/lunar/elements.ts`: Mộc sinh Hỏa → Thổ → Kim → Thủy → Mộc; Mộc khắc Thổ → Thủy → Hỏa → Kim → Mộc. Nạp âm giữ bảng `shared/lunar/napAm.ts`; phép lịch và hoàng đạo dùng nguồn/quy ước hiện có của dự án. Không thay mốc năm âm lịch bằng mốc năm của thư viện tham khảo.

Trước phát hành, lưu fixture và tài liệu kiểm chứng bảng tra trong repo, ghi nguồn, ngày kiểm tra, phiên bản quy tắc và các khác biệt đã chủ động lựa chọn. Phân biệt **khớp bảng tra** với **chứng minh kết quả dự đoán**; việc đối chiếu chỉ xác nhận tính nhất quán của phương pháp.

### 7.3. Kiểm thử và điều kiện nghiệm thu

Đây là yêu cầu kiểm thử khi triển khai sau này, không yêu cầu chạy test ứng dụng cho lần tạo tài liệu này.

| Nhóm | Ca kiểm thử bắt buộc |
| --- | --- |
| Tuổi và mệnh | Ngày sinh trước/đúng/sau Tết: 09/02/2024 thuộc năm âm 2023; 10/02/2024 thuộc năm âm 2024. Thêm năm nhuận, tháng nhuận, biên 1900/2100 và ngày sinh tương lai. |
| Chi | Bao phủ 12×12 cặp có thứ tự; hợp/xung đối xứng; cùng Chi không nhận nhãn tam hợp; nhóm tam hợp ghi đúng giới hạn hai Chi. |
| Can | Bao phủ 10×10 cặp; đủ năm cặp hợp; Giáp–Mậu không nhận nhãn Can xung; Can hợp ưu tiên đúng khi quan hệ ngũ hành khắc cùng tồn tại. |
| Ngũ hành | Đủ 25 tổ hợp có hướng, phân biệt sinh nhập/xuất và khắc nhập/xuất; Thủy ngày–Mộc tuổi là ngày sinh mệnh; Mộc ngày–Thủy tuổi là mệnh sinh ngày. |
| Tổng hợp | Thuận đơn lẻ, bất lợi đơn lẻ, thuận và bất lợi đồng thời; xung tuổi ưu tiên lý do; ngày hoàng đạo không xóa nhãn cần lưu ý. |
| Giờ | Đủ 12 giờ, giữ đúng 6 giờ hoàng đạo chung; hoàng đạo xung tuổi bị loại; hắc đạo hợp tuổi không được gợi ý; Can hợp không bị loại do chiều ngũ hành khắc; kết quả rỗng không nới tiêu chí. |
| Biên giờ | 00:00, 00:59, 01:00, 22:59, 23:00, 23:59; Can giờ dùng đúng ngày; chỉ đánh dấu Bây giờ khi là hôm nay. |
| Hồ sơ | Thiếu ngày sinh, thiếu giờ sinh, dữ liệu sai, ngoài khoảng; sửa/xóa và lưu cập nhật ngay; cùng ngày sinh nhưng giờ sinh khác vẫn cùng kết quả MVP. |
| Tích hợp | Vị trí ngay dưới sự kiện, kể cả khi sự kiện rỗng; hai công tắc độc lập; bản JSON cũ, đồng bộ, đăng xuất và đổi tài khoản không lộ kết quả hồ sơ trước. |
| Riêng tư/offline | Offline vẫn tính đủ; không gọi dịch vụ luận giải; không có thông tin cá nhân trong URL/SEO/analytics/replay/log. |
| Giao diện | Playwright desktop/mobile, sáng/tối, ba cỡ chữ; bàn phím, đọc màn hình và axe; không tràn ngang ở 360px. |

Thêm ít nhất 12 fixture tích hợp ngày xem × hồ sơ sinh có kết quả kỳ vọng viết độc lập với hàm sản xuất, gồm cùng ngày với hai tuổi khác nhau và các trường hợp trái chiều. Dữ liệu kỳ vọng không được tạo bằng chính hàm đang kiểm thử.

### 7.4. Hiệu năng

Chỉ tính cho ngày đang xem, tối đa 12 giờ. Logic dùng bảng tĩnh trong bundle, không yêu cầu API lúc chạy. Mục tiêu phép tính toàn khối dưới 10ms ở lần tính đầu trên điện thoại tầm trung sau khi mã đã tải; đo và ghi thiết bị/môi trường. Bundle tăng không quá 20KB gzip so với trước tính năng; nếu vượt, xem lại phần dữ liệu hoặc tách tải nhưng vẫn phải dùng offline sau lần tải.

## 8. Chỉ số thành công / Success Metrics

- 100% fixture và các bảng kiểm tra quan hệ tại mục 7.3 đạt; không có kết luận thiếu lý do/ID quy tắc.
- 100% giờ được gợi ý đáp ứng yêu cầu 32; không có giờ xung tuổi được gợi ý.
- Không có lỗi nghiêm trọng về accessibility hoặc tràn ngang trong ma trận giao diện đã nêu.
- Đạt mục tiêu thời gian tính và dung lượng ở mục 7.4.
- Không có dữ liệu cá nhân trong các bề mặt công khai hoặc công cụ đo theo yêu cầu 43.
- Kiểm tra với ít nhất 5 người dùng thử: tối thiểu 4 người xác định được lý do đánh giá trong 30 giây và phân biệt được hoàng đạo chung với gợi ý cá nhân mà không cần giải thích thêm. Đây là mục tiêu nghiệm thu, chưa phải kết quả đã đo.

## 9. Câu hỏi còn mở / Open Questions

Không còn câu hỏi chặn việc mô tả MVP. Các lựa chọn về phạm vi, vị trí và hồ sơ đã được người dùng chốt; quy tắc trình bày, công tắc độc lập và tổng hợp được đề xuất cụ thể trong PRD này để có thể triển khai và kiểm thử.

Những điểm cần xác nhận khi mở rộng giai đoạn sau:

1. Nguồn/trường phái cho Can xung riêng, Sát Chủ/Thụ Tử cá nhân và Thái Tuế/Tuế Phá; tránh suy ra từ sao chung.
2. Quy tắc tuổi mụ, mốc năm và người được xét cho Kim Lâu/Hoang Ốc/Tam Tai theo từng mục đích; không tự gộp mọi hạn thành “ngày xấu”.
3. Phương pháp Bát Tự: mốc tiết khí, quy ước đổi ngày ở giờ Tý, nơi sinh/múi giờ và cách xác định Dụng thần; cần PRD riêng trước khi dùng giờ sinh.
4. Có cần nhiều hồ sơ hoặc tìm ngày theo việc; hiện ngoài phạm vi và không tạo sẵn luồng giao diện chưa sử dụng.
