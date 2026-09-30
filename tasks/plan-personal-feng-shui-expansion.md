# Tổng hợp và plan mở rộng Phong thủy cá nhân

Ngày: 30/09/2026. Trạng thái: plan đề xuất, chưa triển khai. Liên quan: [PRD MVP](prd-personal-feng-shui.md).

## Cách tiếp cận

Giữ nguyên MVP đã chốt: một hồ sơ, Can Chi/ngũ hành/giờ gợi ý, khối riêng dưới sự kiện trong tab Ngày. Tách phần mở rộng thành hạn theo năm và mục đích, quy tắc thần sát cần kiểm chứng, rồi chuẩn hóa giờ sinh và Tứ Trụ. Chỉ làm Thập thần/Dụng thần sau khi nền tảng thời gian và phương pháp luận đã đạt nghiệm thu.

Ba file được đọc như tài liệu và mã tham khảo do người dùng cung cấp; các câu “phải”, “chuẩn”, “bắt buộc tránh” trong file không tự trở thành yêu cầu triển khai hay bằng chứng nguồn. Yêu cầu hiện tại là tổng hợp và lên plan.

## 1. Tài liệu đầu vào và kết luận sử dụng

| Tài liệu | Nội dung hữu ích | Cách đưa vào plan |
| --- | --- | --- |
| [1. canchi.ts](</Users/nghiepnguyen/Downloads/1. canchi.ts>) | Bảng quan hệ Can, lục xung, Tam Sát; tra Thụ Tử/Sát Chủ; hàm tổng hợp | Dùng để audit bảng và phạm vi; không chép nguyên utility vào dự án. |
| [2. quy tắc hạn phong thủy](</Users/nghiepnguyen/Downloads/2. quy_t_c_h_n_phong_th_y.md>) | Tuổi mụ, mốc Tết/Lập Xuân, Kim Lâu/Hoang Ốc/Tam Tai theo mục đích và người được xét | Cơ sở cho module hạn năm có nguồn, giải thích và trạng thái áp dụng. Các diễn giải mức độ và ngoại lệ cần kiểm chứng riêng. |
| [3. PRD chuẩn hóa giờ sinh Bát Tự](</Users/nghiepnguyen/Downloads/3. prd_chu_n_h_a_gi_sinh_b_t_t.md>) | Múi giờ lịch sử, giờ chân thái dương, giao tiết, quy ước giờ Tý và đầu ra Tứ Trụ | Cơ sở cho PRD kỹ thuật riêng; phải sửa mâu thuẫn và bổ sung precision, uncertainty, time scale, metadata. Chưa đủ cho Dụng thần. |

## 2. Các điểm đã làm rõ từ tài liệu

- **Hạn năm khác đánh giá ngày:** Kim Lâu/Hoang Ốc/Tam Tai phải có kết quả riêng cho năm đang xem, không tự đổi nhãn ngày cá nhân thành xấu.
- **Hai hệ mốc độc lập:** theo hướng tài liệu đề xuất, hạn dân gian dùng năm âm lịch đổi ở Tết; Bát Tự dùng thời điểm Lập Xuân và các tiết mở tháng. Không thay Can Chi năm tuổi trong MVP bằng trụ năm Bát Tự.
- **Phụ thuộc mục đích và vai trò:** một người có thể là gia chủ, cô dâu hoặc chủ doanh nghiệp. “Không áp dụng cho mục đích này” phải khác “Đã xét và không phạm”.
- **Bát Tự cần hồ sơ phong phú hơn:** ngày/giờ sinh hành chính, độ chắc chắn giờ sinh, nơi sinh, múi giờ lịch sử và quy ước ngày/giờ Tý. Không thể lập lá số đầy đủ chỉ bằng hai trường ngày/giờ sinh hiện có.
- **Tứ Trụ là một mốc sản phẩm riêng:** file 3 mô tả nền tảng lập bốn trụ; chưa mô tả cách xác định vượng/suy, tàng can, Thập thần, Dụng thần hoặc đánh giá một ngày đối với Nhật chủ.

Các điểm trên đủ để lập roadmap; chưa có nghĩa mọi bảng hoặc diễn giải trong file đã được xác nhận đúng trường phái.

## 3. Audit các vấn đề cần xử lý

### 3.1. File Can Chi

| Phát hiện từ mã | Hệ quả | Quyết định đề xuất |
| --- | --- | --- |
| `CAN_XUNG_MAP` gộp Giáp–Canh và Giáp–Mậu vào cùng cờ xung; không mô tả hướng khắc, ưu tiên hợp hay căn cứ từng cặp. | Mâu thuẫn với PRD MVP phân biệt Can khắc và Can xung riêng. | Giữ cách tính MVP; kiểm chứng bảng Can xung riêng với sách/ấn bản/trang cụ thể trước khi mở rộng. |
| `isLucXung` được gọi là Tuế Phá; `isTrùngTháiTuế` chỉ kiểm tra Chi ngày bằng Chi tuổi. | Tên gọi kết luận vượt quá phép so sánh thực sự; chưa có ngữ cảnh năm/tháng. | Giữ tên quan hệ Xung tuổi/Cùng Chi; chỉ gắn tên Thái Tuế/Tuế Phá khi nguồn xác định rõ mốc và đối tượng so sánh. |
| Tam Sát được chuyển từ nhóm tuổi sang danh sách Chi ngày, nhưng không có nguồn trang hay mô tả phép áp dụng. | Chưa chứng minh bảng dùng cho ngày cá nhân thay vì bài toán thời gian/phương vị khác. | Chưa bật; xác nhận cách áp dụng, mục đích và đầu vào trước khi viết hàm. |
| Thụ Tử chỉ dùng tháng âm và Chi ngày. | Cùng ngày mọi hồ sơ nhận cùng kết quả; không phải thần sát riêng theo tuổi/mệnh. | Tận dụng sao chung đang có trong `shared/lunar/stars.data.ts`, không tính lại như yếu tố cá nhân. Bảng Thụ Tử trong attachment trùng bảng hiện có. |
| Bảng Sát Chủ Dương tháng 1→Tý, …, tháng 12→Hợi khác bảng Sát Chủ trong dự án. | Có khác biệt nguồn hoặc loại sao; không thể coi hai bảng tương đương. | Đối chiếu tên đầy đủ, nguồn, tháng âm/tiết khí và cách xử lý tháng nhuận; không ghi đè bảng hiện tại. |
| `isHarmfulToUser` OR cả sao chung lẫn quan hệ tuổi; cờ Cùng Chi không tham gia; `canChiNgay` khai báo nhưng không dùng. | Một boolean làm mất lý do, phạm vi, mức độ và thông tin thiếu dữ liệu. | Dùng danh sách kết quả có `ruleId`, `scope`, `status`, toán hạng, lý do và phiên bản; tổng hợp từng lớp riêng. |
| `lunarMonth` nhận mọi số, không kiểm tra Can Chi có phải tổ hợp hợp lệ trong vòng 60 Hoa Giáp. | Đầu vào sai có thể âm thầm thành “không phạm”. | Chuẩn hóa vào kiểu Can Chi số đang có và validate miền giá trị/tổ hợp; dữ liệu sai trả lỗi hoặc trạng thái không đủ dữ liệu. |

Comment “Hiệp Kỷ Biện Phương Thư” trong file chưa đủ để xác nhận nguồn: cần ấn bản, mục/trang hoặc bản số hóa có thể đối chiếu. Không đánh dấu bảng là verified chỉ từ comment.

### 3.2. File hạn năm

- Công thức tuổi mụ phải là **năm âm lịch của ngày xem − năm âm lịch của ngày sinh + 1**; không lấy năm dương của ngày xem. Ngày xem trước ngày sinh trả trạng thái không áp dụng.
- Kim Lâu dùng phép `age % 9` theo tài liệu. Mẹo “tổng chữ số ra 1/3/6/8” thiếu bước rút gọn: tuổi 19 có tổng chữ số 10 nhưng dư 1. Không dùng mẹo này trong mã.
- Hoang Ốc mới mô tả mốc 10–60 và đếm tuổi lẻ; chưa đủ định nghĩa tuổi dưới 10, từ 70 trở lên, điểm chuyển chu kỳ và các ngoại lệ. Cần bảng kỳ vọng độc lập trước khi chốt công thức cho toàn khoảng tuổi.
- Bảng vừa ghi Hoang Ốc cho “mua nhà/sửa nhà”, vừa giới hạn ở “động thổ/xây dựng/nhập trạch”. Cần định nghĩa chính xác từng hoạt động; đề xuất bản đầu chỉ xét **động thổ/xây dựng**, các hoạt động khác để chưa hỗ trợ đến khi có nguồn.
- Các mô tả “bắt buộc tránh”, tác hại sức khỏe/gia đình, cưới hai lần, mượn tuổi và mức Tam Tai nặng/nhẹ chưa được kiểm chứng. UI chỉ trình bày phân loại và lời giải thích theo nguồn, không tự hướng dẫn nghi thức hoặc khóa thao tác lịch.
- Tam Tai theo cặp đôi cần hai người, vượt một hồ sơ hiện tại. Bản đầu chỉ xét hồ sơ bản thân; nếu chọn cưới hỏi mà thiếu hồ sơ người còn lại thì không trả kết luận cho cả cặp.

### 3.3. File chuẩn hóa giờ sinh

1. **Mốc tiết khí có mâu thuẫn:** mô tả “bội số 30°” không khớp các mốc 315°/345° và ghi Thanh Minh 0°. Bảng chính xác phải dùng `315° + 30° × k (mod 360°)` cho 12 tiết mở tháng; Thanh Minh là **15°**, 0° là Xuân Phân. Đối chiếu [bảng 24 tiết khí của Hong Kong Observatory](https://www.hko.gov.hk/en/gts/time/24solarterms.htm).
2. **Lịch sử múi giờ có khác biệt:** attachment ghi mốc 01/05/1975; dữ liệu `Asia/Ho_Chi_Minh` hiện được IANA ghi đổi +08→+07 tại **13/06/1975**, kèm lưu ý bất định lịch sử địa phương. Plan dùng dữ liệu phiên bản cố định và cho biết mức chắc chắn, không hardcode mốc trong attachment. IANA cũng hướng dẫn riêng cho miền Bắc trước/sau 1970. [Nguồn IANA](https://data.iana.org/time-zones/tzdb/asia).
3. **Giờ Tý không luôn là Canh Tý:** phải tính Can giờ từ Can ngày theo quy ước được chọn. Cụm “Canh Tý ngày mới” trong file cần đổi thành “Can Chi giờ Tý tính từ ngày mới”.
4. **Mã giả chưa đủ đầu ra:** `target_date_for_hour_column` không được trả về và chưa xác định cho giờ 01–22; biến `option` sai cũng chưa bị từ chối. Module phải trả cả ngày dùng tính trụ ngày, ngày dùng tính Can giờ, Chi giờ và quy ước; validate enum.
5. **Không mặc định công thức EoT xấp xỉ đạt ±30 giây:** phải benchmark toàn khoảng hỗ trợ. NOAA có công thức hiệu chỉnh thời gian theo kinh độ/múi giờ và EoT, nhưng việc có công thức không chứng minh đạt ngưỡng của PRD. [Công thức NOAA](https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
6. **Tách thời điểm vật lý khỏi giờ dùng luận trụ:** thời gian hành chính → UTC instant; so giao tiết bằng instant đó. Giờ chân thái dương là biểu diễn phục vụ trụ ngày/giờ, không được dùng làm UTC instant mới hoặc hiệu chỉnh giao tiết lần thứ hai.
7. **Định nghĩa phép đối chiếu thiên văn:** kinh độ Mặt Trời địa tâm biểu kiến, hệ quy chiếu và UTC/UT1/TT/TDB phải nhất quán. Horizons có đại lượng giờ Mặt Trời biểu kiến tại nơi quan sát và hướng dẫn kinh độ Mặt Trời địa tâm; ghi rõ cấu hình truy vấn trong fixture. [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html).
8. **Độ chính xác thuật toán khác độ chắc chắn hồ sơ:** tọa độ trung tâm tỉnh/thành và giờ sinh ước lượng có thể làm đổi Chi giờ hoặc ngày. Với hệ số 4 phút/độ, sai kinh độ 0,125° đã tương đương 30 giây; không quảng bá kết quả cá nhân chính xác ±30 giây chỉ vì engine đạt ngưỡng.
9. **Ngày sinh âm lịch cần quy ước riêng:** thêm cờ tháng nhuận và vùng lịch dùng quy đổi. Đề xuất giai đoạn đầu vẫn chỉ nhận ngày sinh dương hiện có; không đổi bộ âm lịch UTC+7 của lịch chính sang múi giờ nơi sinh.

## 4. Phạm vi và thứ tự phát hành

| Giai đoạn | Trong phạm vi | Điều kiện hoàn tất |
| --- | --- | --- |
| P0 — Chuẩn hóa nguồn | Phân loại quy tắc; sửa mâu thuẫn; lập danh mục nguồn, đầu vào, mốc, fixture và version. | Mỗi quy tắc thuộc verified/pending/rejected, có lý do; pending không vào kết luận. |
| P1 — Hạn năm theo mục đích | Tuổi mụ; Kim Lâu, Hoang Ốc, Tam Tai cho một hồ sơ; vai trò và mục đích; kết quả năm riêng. | Nguồn/bảng tuổi được xác nhận, ma trận áp dụng và test biên Tết đạt; không đổi nhãn ngày. |
| P2 — Thần sát mở rộng | Chỉ các quy tắc Can xung/Thái Tuế/Tuế Phá/Tam Sát/Sát Chủ cá nhân đã đạt P0. | Có đầu vào thực sự cá nhân, nguồn và phép tổng hợp riêng; không trùng sao chung. Có thể hoãn P2 mà vẫn làm P3. |
| P3 — Thời gian sinh và Tứ Trụ | Hồ sơ nơi sinh/múi giờ/độ chắc chắn; UTC/TST; giao tiết chính xác theo instant; trụ năm/tháng/ngày/giờ. | Chính sách giờ Tý rõ ràng, benchmark sai số đạt, xử lý dữ liệu thiếu/không chắc chắn và offline. |
| P4 — Luận Bát Tự | Nhật chủ, Thập thần, sau đó Dụng thần theo phương pháp được xác nhận. | PRD và bảng quy tắc riêng; không lấy hành thiếu bằng đếm năm sinh; không tự kết luận từ module thời gian. |

Ngoài plan triển khai ban đầu: nhiều hồ sơ, ghép đôi, tìm ngày theo khoảng, tự đổi sự kiện, nghi thức hóa giải, dự đoán chắc chắn và gọi API luận giải lúc chạy. Các phần này chỉ bổ sung khi được yêu cầu riêng.

Quan hệ phụ thuộc: **P0 → P1**; **P0 → P2**; **P0 → P3 → P4**. P2 không phải điều kiện thiên văn của P3. Nếu MVP chưa triển khai, triển khai theo PRD MVP trước khi đưa các lớp mới lên UI.

## 5. Đề xuất mô hình và tích hợp

- Giữ nguyên `birthDate`/`birthTime`; bổ sung metadata hồ sơ nơi sinh/quy ước bằng migration tương thích ngược khi làm P3. Không tự suy ra nơi sinh từ vị trí hiện tại của thiết bị.
- Module đề xuất `shared/personalFengShui/annual/` nhận ngày xem, hồ sơ, mục đích, vai trò; trả năm âm, tuổi mụ, từng hạn và `applies/notApplicable/insufficientData/unsupported`. “Không phạm” là giá trị kết quả của phép tính đã áp dụng, không dùng cho trường hợp bỏ qua.
- Module đề xuất `shared/bazi/` tách `birthTime`, `solarTime`, `termInstants`, `ziPolicy`, `pillars`; không sửa `getSolarTerm` thành API theo instant để rồi làm thay đổi kết quả lịch chung.
- Bộ tiết khí hiện có `shared/lunar/solarTerms.ts` đánh giá theo cuối ngày, còn `monthCanChi` dùng tháng âm. Cả hai không được dùng nguyên trạng cho người sinh sát giao tiết.
- TST trả các thành phần hiệu chỉnh, ngày sau hiệu chỉnh, nguồn tọa độ, timezone/offset lịch sử, phiên bản tzdb/engine, khoảng bất định. Không ép wall time không tồn tại ở DST gap thành một instant hợp lệ; DST overlap cần lựa chọn có giải thích hoặc trả cả ứng viên.
- Đề xuất hai chính sách Bát Tự: `splitZi` (23h giữ trụ ngày cũ, Can giờ dùng ngày mới) và `dayStartsAt23` (23h đổi cả ngày). Chọn mặc định chỉ sau khi chốt nguồn; không gọi một phương án là “chuẩn thiên văn” cho mọi trường phái. Giờ của Lịch vạn niên/MVP vẫn giữ quy ước hiện tại.
- Đề xuất xử lý timezone bằng dữ liệu phiên bản cố định; không chỉ dựa vào `Intl` của từng trình duyệt vì phiên bản dữ liệu có thể khác. Trước 1970/địa phương lịch sử không rõ cần nguồn bổ sung hoặc khả năng xác nhận offset, không hứa tự nhận diện mọi trường hợp.
- Sinh fixture giao tiết bằng engine đã kiểm chứng hoặc ephemeris ở bước build; dữ liệu cần thiết đóng gói/cache để dùng offline. JPL dùng để đối chiếu, không mặc định gọi live khi người dùng nhập thông tin sinh.
- UI vẫn trong khối riêng dưới sự kiện: đánh giá ngày của MVP; phần **“Hạn năm theo mục đích”** có chọn mục đích/vai trò; phần Tứ Trụ sâu mở khi đủ dữ liệu. Không hỏi nơi sinh chỉ để xem hạn năm.
- Có thể hiển thị thông tin Tam Tai của bản thân khi xem chung; Kim Lâu/Hoang Ốc chỉ đánh giá áp dụng khi mục đích/vai trò phù hợp. Với cưới hỏi, không suy ra người dùng là cô dâu từ tên tài khoản; vai trò không phù hợp/thiếu hồ sơ thì giải thích chưa thể xét.
- Mọi dữ liệu mở rộng đi cùng local/cloud, JSON, xóa hồ sơ, chuyển tài khoản và cache invalidation; không vào SEO, analytics, replay hoặc log công khai.

## 6. Action items — checklist theo thứ tự

- [ ] **Lập danh mục quy tắc và nguồn** từ ba file, so `stars.data.ts` và PRD MVP; ghi rõ mốc Tết/Lập Xuân, scope chung/cá nhân/năm, purpose, status và version. Đầu ra: tài liệu audit nguồn; chưa copy utility attachment.
- [ ] **Chốt bảng hạn năm và ma trận áp dụng**: lấy năm âm từ cả ngày sinh/ngày xem; định nghĩa toàn miền tuổi Hoang Ốc; cô dâu/gia chủ/người đầu tư chính; phân biệt chưa đủ dữ liệu với không phạm. Đầu ra: PRD hạn năm, fixture độc lập.
- [ ] **Đặc tả contract module hạn năm** trong `shared/personalFengShui/annual/`: input, output, rule IDs, validation và cache. Sau đó mới lập task triển khai Kim Lâu/Hoang Ốc/Tam Tai và test.
- [ ] **Đặc tả UI hạn năm** trong khối Phong thủy cá nhân, kèm chọn mục đích/vai trò và giải thích theo năm. Bao gồm persistence/JSON/sync và trạng thái thiếu dữ liệu; không hòa vào nhãn đánh giá ngày.
- [ ] **Đánh giá từng quy tắc thần sát mở rộng**: giữ Thụ Tử chung hiện có; xác minh Sát Chủ Dương riêng, Can xung và điều kiện Thái Tuế/Tam Sát. Chỉ lập task triển khai cho phần verified; phần pending có thể để sau.
- [ ] **Viết PRD chuẩn hóa thời gian sinh phiên bản sửa**: mốc 12 tiết, UTC/TST, timezone lịch sử, uncertainty, đầu ra giờ Tý đầy đủ, tọa độ và precision. Chốt phạm vi nơi sinh/năm hỗ trợ và default ziPolicy trước khi lập task engine.
- [ ] **Benchmark và chọn engine/dữ liệu thời gian**: đối chiếu tzdb, NOAA/JPL; kiểm tra giấy phép, kích thước, offline và sai số. Dùng ngưỡng mục tiêu ≤30 giây cho phép tính TST và thời điểm giao tiết trên fixture đã thống nhất; nếu không đạt thì thay phương pháp hoặc cập nhật yêu cầu minh bạch, không coi công thức xấp xỉ là đã đạt.
- [ ] **Lập task hồ sơ sinh và module Tứ Trụ**: migration metadata, input validation, UTC normalization, TST, term instants, Zi policy và bốn trụ. Giữ lớp giải nghĩa tách riêng; thiếu giờ sinh không xuất lá số đủ bốn trụ, không lấy giờ 12h mặc định.
- [ ] **Nghiệm thu từng lớp rồi phát hành riêng**: unit/fixture, integration local/cloud/JSON, UI mobile/a11y, kiểm tra riêng tư/offline và regression lịch chung. Chỉ mở UI cho lớp đã đạt; chưa triển khai Dụng thần cùng lần phát hành Tứ Trụ.
- [ ] **Đặc tả Nhật chủ/Thập thần/Dụng thần sau Tứ Trụ**: chốt phương pháp, tàng can, vượng/suy và cách xét ngày/giờ; lấy nguồn/fixture và PRD riêng trước khi triển khai P4.

## 7. Validation bắt buộc trong các task triển khai

| Lớp | Ca kiểm tra |
| --- | --- |
| Năm/tuổi mụ | Ngày trước/đúng Tết; năm sinh trước Tết; ngày xem trước ngày sinh; năm Tết khác mốc Lập Xuân; cùng năm âm nhận cùng hạn dù đổi ngày xem. |
| Kim Lâu | Bao phủ chín số dư, tuổi 19/28 để bắt lỗi mẹo tổng chữ số; đúng mục đích/vai trò, không tự xét mua xe/khai trương. |
| Hoang Ốc | Mốc 10/20/30/40/50/60; 19→20, 59→60, 69→70; tuổi dưới 10 và trên 70 có policy rõ, không suy công thức ngoài nguồn. |
| Tam Tai | Toàn bộ 12 Chi tuổi ×12 Chi năm; đúng đầu/giữa/cuối chu kỳ; không gắn nhãn mức độ chắc chắn khi thiếu căn cứ. |
| Phân lớp | Sao chung không thay đổi theo hồ sơ; hạn năm không sửa nhãn ngày; quy tắc pending không tham gia tổng hợp; kết quả không có double count. |
| Múi giờ | Miền Bắc/Nam cùng thời điểm lịch sử; trước/sau transition IANA; gap/overlap; offset tùy xác nhận; engine/tzdb version tái lập được kết quả. |
| Solar time | Longitude đông/tây, offset lẻ, có DST, năm nhuận, đổi ngày/tháng/năm sau hiệu chỉnh; cùng UTC instant/cùng kinh độ có cùng TST bất kể biểu diễn timezone. |
| Giao tiết | Trước/đúng/sau instant Lập Xuân và mỗi tiết mở tháng ±1 phút; 345°→0°→15°; phân biệt UTC/TT/UT1; không double correction bằng TST. |
| Giờ Tý/Tứ Trụ | 22:59/23:00/23:59/00:00/00:59/01:00 theo từng ziPolicy trên TST; đủ 10 Can ngày, giờ Tý không cố định Canh; tính Can tháng/ngày/giờ theo công thức được kiểm chứng. |
| Bất định | Giờ sinh ước lượng/nơi sinh cấp tỉnh làm khoảng đầu vào cắt qua giao tiết/Chi giờ: trả ứng viên hoặc chưa xác định, không chọn một lá số giả chính xác. |
| App | Thiếu giờ/nơi sinh vẫn dùng MVP và hạn năm; dữ liệu bản cũ/JSON mới; sửa/xóa/đổi tài khoản; mobile 360px, cỡ chữ lớn, sáng/tối, offline và không lộ dữ liệu. |

Fixture thiên văn phải lưu cấu hình truy vấn, tọa độ, time scale, kết quả tham chiếu và sai số từng ca; không tạo expected bằng chính hàm sản xuất. Regression phải giữ nguyên các fixture âm lịch, tiết khí theo ngày, sao và giờ chung đã có.

## 8. Các quyết định còn cần chốt trước từng giai đoạn

Các mục sau không chặn plan; chỉ chặn phần triển khai tương ứng:

1. **Nguồn/trường phái:** sách/ấn bản cho hạn năm và thần sát; toàn miền tuổi Hoang Ốc; bảng Sát Chủ Dương trong attachment có được sử dụng dưới tên/phạm vi riêng không?
2. **Phạm vi Bát Tự:** đề xuất nơi sinh Việt Nam trước, ngày sinh dương 1900–2100 trong khả năng kiểm chứng. Cần chốt chính sách hồ sơ lịch sử không chắc múi giờ, hỗ trợ nhập offset và có nhận ngày âm ngay không.
3. **Quy ước và độ chính xác:** default giờ Tý, nguồn tiết khí biểu kiến, tiêu chí benchmark, độ chắc chắn giờ/nơi sinh. Không thể lấy tùy chọn trong attachment làm mặc định đã được người dùng xác nhận.

Nhiều hồ sơ và tìm ngày theo việc vẫn chưa được yêu cầu mở rộng. Giữ ngoài phạm vi; nếu cần kết luận cho cả cặp cưới hỏi thì phải có quyết định sản phẩm riêng cho hồ sơ người thứ hai.
