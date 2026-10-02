# Audit quy tắc Phong thủy cá nhân — P0

Hoàn tất rà soát: **01/10/2026** (bắt đầu đối chiếu 30/09/2026). Registry: `shared/personalFengShui/rules.ts`. Phiên bản từng quy tắc: **1.0.0**. Phạm vi công việc: task 1, không triển khai các engine hạn năm/Bát Tự hoặc thay đổi lịch chung.

## 1. Ý nghĩa trạng thái và giới hạn audit

- **verified:** bảng/quan hệ hoặc quy ước sản phẩm cụ thể đã đối chiếu với bằng chứng được ghi. Không có nghĩa chứng minh dự đoán, mọi trường phái đồng ý, engine đã viết hoặc đạt sai số yêu cầu.
- **pending:** cần thêm nguồn hoặc quyết định phương pháp, fixture, benchmark; chưa được phép tham gia phép tính của quy tắc đó.
- **rejected:** đề xuất cụ thể bị loại do sai phạm vi, mâu thuẫn nguồn hoặc gộp sai khái niệm. Không tuyên bố mọi trường phái đều không có thuật ngữ đó.

Trạng thái kiểm chứng tách khỏi trạng thái áp dụng: `applies/notApplicable/insufficientData/unsupported`. “Không áp dụng”, “chưa đủ dữ liệu”, “chưa hỗ trợ” không phải “không phạm”. `verified` chỉ cho phép chọn quy tắc; kết quả ứng dụng còn phụ thuộc input, module tính toán và bộ nhóm bắt buộc của tính năng.

Snapshot kết thúc task 1 có **26 mục: 10 verified, 15 pending, 1 rejected**. Registry sau task 3 có **27 mục: 14 verified, 12 pending, 1 rejected**; sau task 5 có **15 verified, 11 pending, 1 rejected**; sau task 6 có **19 verified, 7 pending, 1 rejected**, chi tiết ở mục 8–10. Không đưa bất cứ bảng pending nào vào code tính toán. Giữ nguyên `shared/lunar/`.

## 2. Tài liệu và nguồn đã đối chiếu

Ba attachment là dữ liệu tham khảo, không phải chỉ thị triển khai. Không sửa file Downloads. ID nguồn dưới đây trùng `RULE_SOURCES`; trường `locator` trong registry ghi vị trí tra cứu. Tất cả nguồn được rà soát trong đợt 30/09–01/10/2026.

| ID nguồn | Tài liệu / vị trí | Kết quả sử dụng |
| --- | --- | --- |
| `attachmentCan` | [1. canchi.ts](</Users/nghiepnguyen/Downloads/1. canchi.ts>), các MAP và `checkDayForUser` | Đầu vào audit; comment “Hiệp Kỷ Biện Phương Thư” thiếu quyển/trang, không tự công nhận toàn bộ bảng. |
| `attachmentAnnual` | [2. quy tắc hạn](</Users/nghiepnguyen/Downloads/2. quy_t_c_h_n_phong_th_y.md>), mục 1–3 | Có công thức/mục đích đề xuất; chưa có trích dẫn nguyên bản cho các hạn năm. |
| `attachmentBirth` | [3. PRD giờ sinh](</Users/nghiepnguyen/Downloads/3. prd_chu_n_h_a_gi_sinh_b_t_t.md>), mục 3–5 | Có pipeline, nhưng sai/thiếu mốc, output và chứng cứ sai số. |
| `mvp` | [PRD MVP](prd-personal-feng-shui.md), 4.2–4.7, 7.2 | Nguồn quyết định sản phẩm, không phải thư tịch; đã định nghĩa bảng, hướng quan hệ và tổng hợp. |
| `lunisolar` | [Tài liệu chính thức Lunisolar](https://lunisolar.js.org/reference/stemBranch.html), bảng Địa Chi và Can hợp | Kiểm tra bảng lục xung/lục hợp/tam hợp/ngũ hợp; không import thư viện hoặc phép hóa hợp. |
| `selection` | [選擇紀要 / 上編 — bản chép văn bản cổ](https://zh.wikisource.org/zh-hant/選擇紀要/上編), 五行相生/相剋, 天干相剋/相沖, 五鼠遁時例, 披麻・紅紗・受死 | Phân biệt khắc/xung, kiểm tra vòng ngũ hành, bảng Thụ Tử và Can giờ Tý. Bản chép số hóa, chưa đối chiếu ảnh nguyên bản; chỉ dùng cho nhận định có vị trí rõ. |
| `xieji3` | [欽定協紀辨方書, 四庫全書本, quyển 3](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷03), mục 太歲 / 歲破 | Văn bản bàn theo năm/phương vị; không đủ để gắn tên này cho mọi phép so Chi ngày với tuổi. |
| `xieji34` | [Cùng sách, quyển 34](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷34), 制煞要法 / 三煞 | Có ngữ cảnh phương vị/sửa xây; chưa xác nhận phép ánh xạ tuổi → Chi ngày trong attachment. |
| `localCalendar` | `shared/lunar/canChi.ts`, test tương ứng | Năm theo âm lịch, tháng theo tháng âm, Can giờ phụ thuộc ngày. Quy ước đang có cần giữ nguyên. |
| `localStars` | `shared/lunar/stars.data.ts`, `stars.ts` | Bảng chung dùng tháng âm, tháng nhuận theo tháng cùng số; không có operand hồ sơ trong Thụ Tử/Sát Chủ. |
| `localElements` | `shared/lunar/elements.ts`, `napAm.ts`, test tương ứng | Vòng sinh/khắc có hướng, nạp âm năm/ngày; hàm Can–Chi nội tại một ngày không phải đánh giá cá nhân. |
| `hko` | [Hong Kong Observatory, bảng 24 tiết khí](https://www.hko.gov.hk/en/gts/time/24solarterms.htm), Table 1 | Xác nhận các góc tham chiếu, không xác nhận engine instant giao tiết. |
| `iana` | [IANA tzdb, asia](https://data.iana.org/time-zones/tzdb/asia), mục Vietnam | Xác nhận khác biệt mốc offset và lưu ý bất định; chưa chọn dữ liệu runtime phiên bản cố định. |
| `noaa` | [NOAA Solar Equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF), trang 1 | Xác nhận dấu/đơn vị hiệu chỉnh TST; không chứng minh approximation attachment đạt ±30 giây. |
| `jpl` | [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), Time và quantities 31/34 | Cơ sở định nghĩa đối chiếu; task 1 chưa truy vấn ephemeris hoặc benchmark engine. |

Các URL văn bản cổ được dùng như nguồn nguyên văn theo mục, không dựa vào bài bình luận/search snippet để bật quy tắc. Không tìm được định vị nguyên bản chứng minh bảng Sát Chủ Dương tuần tự hoặc phép Tam Sát cá nhân của attachment trong đợt rà soát này. Điều đó là **thiếu chứng cứ**, không phải chứng minh chúng không tồn tại ở nguồn khác.

## 3. Danh mục quy tắc và quyết định

Bảng dưới là snapshot task 1. Cập nhật trạng thái/version của các quy tắc annual ở task 3 được ghi tại mục 8; trạng thái các mục khác giữ nguyên.

Metadata đầy đủ cho **từng ID** nằm trong registry: `version`, `scope`, `verificationStatus`, `sourceIds`, `reviewedOn`, `inputs`, `boundary`, `calendar`, `purposes`, `roles`, `reason`. Không suy purpose/role từ tên/giới tính tài khoản. Các purpose/role cho mục pending là **phạm vi đề xuất cần xác nhận**, không phải policy đã được phép chạy.

| ID | Trạng thái | Bằng chứng / quyết định | Giới hạn hoặc bước tiếp theo |
| --- | --- | --- | --- |
| `personal.branch-relations` | verified | Bảng quan hệ Địa Chi khớp Lunisolar và PRD MVP. | Chỉ “cùng nhóm tam hợp”, không khẳng định đủ cục; cùng Chi là thông tin trung tính. |
| `personal.stem-relations` | verified | Năm cặp hợp và quan hệ hành có hướng đối chiếu nguồn và code. | Ưu tiên hợp khi trình bày/tổng hợp là quyết định MVP; không nhập phép hóa hợp. |
| `personal.nap-am-elements` | verified | Vòng sinh/khắc và nạp âm hiện có; kiểm tra bảng hành theo chu kỳ. | Không suy Dụng thần hoặc chi tiết tương tác từng tên nạp âm. |
| `personal.birth-year-boundary` | verified | Policy MVP và `yearCanChi` dùng năm âm sau quy đổi. | Mốc Tết/UTC+7 của app; không dùng làm trụ năm Bát Tự. |
| `personal.summary-policy` | verified | Quy tắc sản phẩm đã mô tả rõ trong PRD 4.6. | Chỉ input cá nhân ngày; engine/fixture MVP vẫn chưa được triển khai. |
| `personal.hour-policy` | verified | PRD 4.7 và giờ chung hiện có. | Mốc 00h của app; không bị thay thế bởi policy Bát Tự. |
| `personal.attachment-can-xung` | rejected | MAP attachment gọi cả Giáp–Mậu là xung; nguồn phân biệt mục khắc và xung. | Loại MAP gộp; giữ Can khắc có hướng trong MVP. |
| `personal.can-xung` | verified tại task 5 | `選擇紀要` tách Can xung khỏi Can khắc; PRD P2 chọn bốn cặp được nêu rõ. | Chỉ thêm lý do, không đổi summary MVP; Mậu/Kỷ không có cặp trong policy v1. |
| `personal.thai-tue` | pending | Attachment chỉ so Chi ngày == Chi tuổi; nguồn quyển 3 không xác nhận phép rút gọn này. | Cần nguồn cho mốc năm/tháng/ngày và cách áp dụng cá nhân. Giữ nhãn Cùng Chi ở MVP. |
| `personal.tue-pha` | pending | Lục xung là quan hệ riêng đã xác nhận; tên Tuế Phá có ngữ cảnh riêng. | Cần xác định cặp operand/mốc và nguồn; chưa đổi tên Xung tuổi thành Tuế Phá. |
| `personal.tam-sat` | pending | Nguồn quyển 34 có phương vị và việc xây sửa. | Cần bằng chứng phép tuổi→ngày, direction nếu cần và mục đích; không triển khai MAP như universal day warning. |
| `personal.sat-chu` | pending | MAP attachment chỉ dùng tháng/Chi ngày, không tuổi/mệnh. | Cần quy tắc có input thực sự cá nhân và định vị nguồn. Không nhầm với sao chung. |
| `common.thu-tu` | verified | Đủ 12 entry khớp bảng source monthly và code hiện có. | Reuse sao chung; policy tháng nhuận là của app, không khẳng định áp dụng mọi sách. |
| `common.sat-chu-duong` | pending | Bảng tuần tự khác Sát Chủ hiện có. | Cần ấn bản/mục/trang và xác nhận tên/mốc/tháng nhuận; không ghi đè bảng lịch chung. |
| `annual.nominal-age` | verified | Công thức đề xuất và policy mốc Tết được làm rõ về hai năm âm. | Chỉ convention tuổi, chưa xác nhận Kim Lâu/Hoang Ốc/Tam Tai; ngày xem trước sinh không áp dụng. |
| `annual.kim-lau` | pending | Có thuật toán mod 9 trong attachment. | Cần nguồn phân loại, purpose/role và fixture độc lập tại task 2; phép chia đúng không tự chứng minh ý nghĩa hạn. |
| `annual.hoang-oc` | pending | Attachment có mốc 10–60 và đếm tuổi lẻ. | Cần miền tuổi <10, ≥70, chuyển chu kỳ và activity; nếu thiếu thì giới hạn miền rõ. |
| `annual.tam-tai` | pending | Attachment cho bốn nhóm và thứ tự ba năm. | Cần nguồn, bảng 12×12 và phạm vi diễn giải/mức độ; không áp vào kết luận ngày. |
| `birth.historical-timezone` | verified tại task 6 | Chọn tzdb 2026d và policy vùng/offset/gap/overlap trong PRD P3. | Auto 1970–2100; 1900–1969 cần xác nhận offset nếu mapping lịch sử không chắc. |
| `birth.solar-time-formula` | verified | NOAA xác nhận dấu/đơn vị công thức hiệu chỉnh. | Chỉ quan hệ công thức; không certify approximation hay precision. |
| `birth.solar-time-engine` | verified tại task 6 | Astronomy Engine 2.1.19 đạt max 0,323 giây trên 12 ca JPL quantity 34. | NOAA fractional-year vượt ngưỡng; implementation/uncertainty thuộc task 7. |
| `birth.solar-term-angles` | verified, v1.1 task 6 | Chuỗi mở tháng 315° + 30k; Thanh Minh 15°. | Không thay API tiết khí theo ngày của lịch chung. |
| `birth.term-instant-engine` | verified tại task 6 | Astronomy Engine 2.1.19 đạt max 19,926 giây trên 12 mốc so JPL DE441 quantity 31. | Task 7 phải mở rộng regression nhiều năm và đóng gói offline. |
| `birth.zi-policy` | verified tại task 6 | Chốt `splitZi` mặc định, `dayStartsAt23` opt-in và tách ngày trụ ngày/ngày lấy Can giờ. | Quy ước sản phẩm, không thay giờ chung MVP; task 7 triển khai đủ 24h. |
| `interpretation.thap-than` | pending triển khai | PRD P4 v1 đã chốt Nhật chủ, âm dương và ma trận 10×10; engine chưa có. | Fixture độc lập đã có; task P4a phải đạt đủ 100 tổ hợp và không gán cát/hung theo tên. |
| `interpretation.dung-than` | pending theo rule | PRD P4 v1 chọn Tử Bình tháng lệnh–cách cục; chưa có bảng quyết định hai review. | Chỉ rule có passage/fixture/review mới được verified; không tính từ đếm hành thiếu hoặc nạp âm. |

## 4. Bằng chứng so sánh trực tiếp và cách sửa

### 4.1. Can khắc, Can xung và các nhãn năm

Nguồn `selection` có các mục riêng cho hành khắc và Can xung. Vì vậy MAP gộp trong attachment không đủ để thay thế quan hệ Can của MVP. Giáp–Mậu được xử lý như chiều Mộc khắc Thổ; phép Can xung riêng chỉ ở P2 khi chốt nguồn/policy. [Nguồn nguyên văn](https://zh.wikisource.org/zh-hant/選擇紀要/上編).

So Chi ngày với tuổi chỉ chứng minh bằng nhau hoặc lục xung. Văn bản `xieji3` bàn Thái Tuế/Tuế Phá theo năm và phương vị; chưa chứng minh tên hạn cá nhân theo ngày trong mã. Tam Sát ở quyển 34 có ngữ cảnh phương vị/sửa xây; không tự chuyển phép này thành ngày kỵ với mọi tuổi. [Quyển 3](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷03), [quyển 34](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷34).

Không thêm cờ `isHarmfulToUser` gộp sao chung với quan hệ cá nhân. `canChiNgay` trong attachment chưa được dùng nên không được nói logic đã xét Nhật chủ.

### 4.2. Thụ Tử và Sát Chủ

Fixture Thụ Tử theo tháng 1→12 (Chi): **Tuất, Thìn, Hợi, Tỵ, Tý, Ngọ, Sửu, Mùi, Dần, Thân, Mão, Dậu**. Bảng này khớp mục `受死` của nguồn và `Thụ Tử` hiện có. Không phụ thuộc hồ sơ. [Nguồn bảng tháng](https://zh.wikisource.org/zh-hant/選擇紀要/上編).

Sát Chủ hiện có (tháng 1→12): **Tỵ, Tý, Mùi, Mão, Thân, Tuất, Sửu, Hợi, Ngọ, Dậu, Dần, Thìn**. Attachment Sát Chủ Dương: **Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi**. Khác **10/12** tháng; chỉ tháng 4 và 10 trùng. Đây là bằng chứng khác bảng, không xác nhận bảng nào là dị bản đúng cho mọi mục đích. Không sửa `stars.data.ts`.

Test audit giữ fixture đầy đủ, kiểm tra Thụ Tử trên toàn 12×12 miền tháng/Chi và Sát Chủ vẫn là bảng cũ. Cần định vị nguồn riêng nếu muốn dùng bảng Sát Chủ Dương; việc đặt tên “Dương” không đủ chứng minh equivalence.

### 4.3. Hạn năm

- Tuổi mụ đề xuất: năm âm ngày xem − năm âm ngày sinh + 1. Không lấy năm dương; không tính trước ngày sinh.
- Kim Lâu: tuổi 19/28 đều dư 1 nhưng tổng chữ số một lượt là 10. Sửa bằng phép `% 9`; ý nghĩa hạn vẫn pending nguồn.
- Hoang Ốc: không tự kéo công thức 10–60 xuống tuổi nhỏ hoặc qua ≥70; task 2 phải chốt nguồn hoặc giới hạn miền. Không coi thiếu nguồn là không phạm.
- Ma trận mục đích: attachment mâu thuẫn giữa mua/sửa nhà và động thổ/xây/nhập trạch. Chỉ đặt construction như phạm vi đề xuất trong registry; task 2 chốt policy trước chạy.
- Không nhập “bắt buộc tránh”, thiệt hại cụ thể, mượn tuổi/cưới hai lần vào UI. Không xét cả cặp bằng hồ sơ bản thân.

### 4.4. Thiên văn và thời gian sinh

- Thanh Minh là **15°**, Xuân Phân **0°**, Lập Xuân **315°**, Kinh Trập **345°**. Các mốc mở tháng đề xuất đi từ 315° theo bước 30° modulo 360, không phải các bội 30° tính từ 0. Code lịch hiện tại có tên đúng; không thay nó để khớp lỗi attachment. [HKO](https://www.hko.gov.hk/en/gts/time/24solarterms.htm).
- IANA ghi +08→+07 của `Asia/Ho_Chi_Minh` tại **13/06/1975**, khác 01/05 trong attachment; có lưu ý không biết mọi thay đổi địa phương. Đây là kết quả của nguồn tham chiếu, không lời hứa tự xác định lịch sử mọi nơi. Runtime timezone/coverage vẫn pending. [IANA](https://data.iana.org/time-zones/tzdb/asia).
- Công thức TST có dạng giờ hành chính + EoT + 4×kinh độ đông −60×offset giờ. Kiểm tra đơn vị phút, dấu và việc carry ngày; formula reference verified không chứng minh engine ±30 giây. Attachment approximation cố định 365 và không xét phần ngày cần benchmark riêng. [NOAA](https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
- Giờ Tý không cố định Canh: năm nhóm Can ngày cho giờ Tý **Giáp, Bính, Mậu, Canh, Nhâm**, đối chiếu code/test và nguồn. Mã giả không trả ngày tính Can giờ, không xác định đủ giờ ngoài Tý và không reject option sai. Task 6 phải chốt default/split policy; không thay `hourCanChi` của lịch chung. [Nguồn 五鼠遁時例](https://zh.wikisource.org/zh-hant/選擇紀要/上編).
- `getSolarTerm` xem cuối ngày; `monthCanChi` dùng tháng âm. Không dùng nguyên trạng cho giao tiết sinh sát phút. So giao tiết bằng UTC instant đã normalize; TST dùng cho biểu diễn ngày/giờ luận trụ, không tạo instant vật lý thứ hai.
- TST precision, thời điểm giao tiết, UTC/UT1/TT/TDB và bất định input phải xét riêng. JPL quantity 31/34 là tham chiếu; chưa sinh benchmark ở P0. [JPL](https://ssd.jpl.nasa.gov/horizons/manual.html).

## 5. Contract registry và nghiệm thu task 1

`createRuleRegistry(definitions)`:

1. Reject ID trùng (kể cả khác version), version không hợp lệ, metadata trống, ngày rà soát không tồn tại, scope/status sai và source ID không có trong `RULE_SOURCES`.
2. Sao chép/freeze metadata để sửa mảng/object đầu vào sau khi tạo không thay đổi kết quả audit.
3. `getReadiness(scope, requiredRuleIds)` chỉ xét nhóm được yêu cầu trong scope đó. Không có required IDs là input lỗi, không phải kết quả hoàn chỉnh.
4. Chỉ `verified` và đúng scope mới được chọn. Có một nhóm pending/rejected/missing/sai scope → `blocked`, danh sách `rules` rỗng và lý do cụ thể; không trả một phần kết quả như assessment đã đủ.
5. Không trả rating tốt/xấu/trung tính, không thực thi callback hoặc đánh giá tuổi. Caller ở task sau phải liệt kê **đủ nhóm bắt buộc** của phép tính và chỉ tính khi `ready`; registry không thể tự phát hiện caller bỏ quên một ID chưa được khai báo.

Đặc biệt: góc tham chiếu đã verified **không** cho phép bỏ qua `birth.term-instant-engine`; công thức TST không thay `birth.solar-time-engine`. Engine accuracy và policy là gate riêng.

`rules.test.ts` kiểm tra ranh giới trên, fixture Thụ Tử/Sát Chủ, Can giờ Tý, hành nạp âm và mốc tiết khí. Đây là fixture về bảng/semantics đang có; **không thay** fixture assessment MVP, hạn năm hay benchmark Bát Tự sẽ phải lập ở các task sau.

Audit P0 hoàn tất khi mọi đề xuất có quyết định và câu hỏi cụ thể, registry/test đạt. P0 hoàn tất **không** mở khóa toàn bộ P1/P2/P3: từng quy tắc pending vẫn bị chặn đến khi có bằng chứng và version mới. Giữ task triển khai hạn/engine tương ứng chưa hoàn tất.

## 6. Kết quả kiểm tra

- `npx vitest run shared/personalFengShui/rules.test.ts shared/lunar`: **165 test đạt**, gồm registry và regression lịch âm.
- `npm test`: **518 test đạt / 70 file**, gồm 16 test registry/fixture audit mới. Có cảnh báo jsdom chưa triển khai `window.scrollTo` từ test UI hiện có; không có test thất bại.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`: đạt. Build có cảnh báo chunk lớn và tùy chọn PWA đã deprecated; task này không thay cấu hình/bundle ứng dụng.
- `npm audit --audit-level=high`: đã thử nhưng không hoàn tất do DNS `ENOTFOUND registry.npmjs.org`; không kết luận dependency không có lỗ hổng. Không thêm hoặc thay dependency ở task 1.
- Chưa chạy Emulator/E2E vì không đổi UI, lưu trữ hoặc security rules; chưa commit/deploy. Các kiểm tra đó nằm ở task tích hợp sau.

## 7. Bổ sung task 2 — đặc tả P1 (01/10/2026)

Đã tạo `prd-annual-feng-shui.md` v1.0.0 và `fixtures/annual-feng-shui.v1.json`. Nội dung P0 ở trên là snapshot đợt audit trước; registry **vẫn giữ nguyên 26 mục và trạng thái**, không có engine mới trong task 2.

Nguồn bổ sung và phạm vi sử dụng được định vị tại PRD mục 2:

- `batTrachCourse`: giáo trình Uông Sỹ Cần, bản PDF do website trung tâm công bố, Bài 7 / trang thực tế 47–48. Đối chiếu phép số dư và mốc sáu cung; không dùng lời dự đoán hoặc kéo miền tuổi vượt các mốc được chọn.
- `khoiSuExtract`: bản trích *Phần thứ tư: Khởi sự*, II.1.a / trang in 2, PDF 3. Đối chiếu bảng Chi; bản trích thiếu tác giả/ấn bản và có phạm vi giới tính khác attachment. PRD ghi rõ giới hạn provenance, chỉ lấy bảng, không chuyển toàn bộ lời kiêng việc thành policy.
- `annualSpec`: ma trận vai trò, mốc Tết UTC+7, miền tuổi và cách trình bày là policy sản phẩm; không gán chúng cho toàn bộ các trường phái.

Đã chốt Hoang Ốc 10–69 inclusive; ngoài miền trả unsupported. Kim Lâu dùng mod 9; Tam Tai chỉ trả vị trí chu kỳ, không mức độ. Các hoạt động mua xe/mua nhà/sửa nhà/nhập trạch/nghi thức chưa hỗ trợ. Purpose/role tạm thời, không persist; không đánh giá cả cặp với một hồ sơ.

Fixture tĩnh bao phủ 9 số dư và 4 ví dụ bổ sung, 60 tuổi, 144 cặp Chi, 54 tổ hợp purpose/role, 16 context ngày và 4 tình huống gate. Expected ghi từ bảng/đếm tay, không sinh bằng engine production. Chín context hợp lệ được so với bộ lịch hiện có; đây là regression của quy ước app, không benchmark thiên văn độc lập.

**Điều kiện task 3:** đồng bộ metadata nguồn, phạm vi và version registry với đặc tả trước khi chạy; kiểm tra readiness cho từng hạn và nominal-age. Không dùng fixture để vượt gate pending. Giới hạn nguồn của Tam Tai phải xuất hiện trong metadata/lý do; nếu yêu cầu nguồn có tác giả/ấn bản đầy đủ thì giữ riêng hạn đó pending và unsupported, không tạo kết quả thay thế. Task 2 đóng các quyết định đặc tả, chưa chứng nhận module hoặc UI.

## 8. Bổ sung task 3 — module hạn năm và gate (01/10/2026)

Registry đã thêm nguồn `annualSpec`, `batTrachCourse`, `khoiSuExtract` với locator như PRD. Chấp nhận bản trích Tam Tai như nguồn phương pháp công bố trực tiếp để đối chiếu **riêng bảng Chi**; không gán tác giả/ấn bản cổ, không nhập quy định giới tính, mức độ hay lời kiêng việc. Giới hạn bản trích được giữ nguyên trong source locator và reason của rule, trả theo `requiredRules` trong kết quả evaluator. Việc lựa chọn bảng trong phạm vi này là quyết định triển khai PRD đã chốt, không xác nhận hiệu lực dự đoán.

| ID | Version | Trạng thái hiện tại / phạm vi |
| --- | --- | --- |
| `annual.nominal-age` | 1.1.0 | verified; ngày dương 1900–2100, âm năm 1899 ở đầu miền, tuổi mụ 1–202, mốc Tết UTC+7. Gate chạy trước quy đổi. |
| `annual.application-policy` | 1.0.0 | verified, mới; policy sản phẩm ma trận mục đích/vai trò một hồ sơ; là nhóm bắt buộc độc lập khi tính mỗi hạn. |
| `annual.kim-lau` | 1.1.0 | verified; bảng số dư và tên loại được đối chiếu; không suy tác hại. |
| `annual.hoang-oc` | 1.1.0 | verified; mốc 10–60 và đếm lẻ trong miền 10–69; ngoài miền unsupported. |
| `annual.tam-tai` | 1.1.0 | verified; bốn nhóm Chi và vị trí chu kỳ; chỉ thông tin cá nhân theo policy, không severity hoặc kết luận cặp đôi. |

Các quy tắc khác giữ version/status P0. Tổng hiện tại: **27 mục, 14 verified / 12 pending / 1 rejected**. Các source được bổ sung ở task 3 không tự mở gate thần sát/Bát Tự.

`assessAnnualFengShui` không giữ state/cache. Mỗi hạn phải có đủ nominal-age, application-policy và chính rule trong scope annual. Pending/rejected/missing/sai scope trả unsupported, không value hoặc hit giả; thiếu ngày/đối tượng và mục đích bị loại giữ trạng thái riêng. Missing rule có version/verificationStatus null. Tuổi/năm không được dẫn xuất khi nominal-age chưa sẵn sàng; metadata nguồn là snapshot, không chia sẻ mảng với cấu hình caller.

Nghiệm thu: **360 test annual + 17 test registry đạt**; toàn dự án **879 test / 75 file** đạt; typecheck/lint/format/build đạt. Test bao phủ fixture đầy đủ, tất cả 54 tổ hợp purpose/role và 4 kiểu lỗi readiness cho cả 5 nhóm annual. Không thay lịch chung, UI, dữ liệu lưu trữ hoặc dependency. npm audit bị lỗi DNS tới registry; không kết luận dependency đã sạch lỗ hổng. Chi tiết command/cảnh báo và giới hạn nghiệm thu ở PRD mục 10. Task 4 chưa triển khai.

## 8.1. Bổ sung task 9 — đặc tả luận giải P4 (02/10/2026)

`prd-bazi-interpretation.md` chọn Tử Bình lấy Nhật can làm Nhật chủ và tháng lệnh làm trục. Quan hệ
Thập thần được đóng thành ma trận 10×10 theo sinh/khắc có hướng và âm dương; tàng can đóng thành
bảng 12 Chi/28 Can có thứ tự nhưng không có tỷ trọng. Bằng chứng vượng/suy là danh sách có nguồn,
không phải điểm số.

Dụng thần tiếp tục pending ở cấp runtime. PRD đã chốt phương pháp tháng lệnh–cách cục và cấm phép
đếm hành thiếu, nhưng từng nhánh thành–bại/cứu ứng chỉ được verified sau khi có passage, fixture
positive/near-miss/conflict và hai review nội dung. P4a Nhật chủ/Thập thần có thể triển khai độc lập;
P4c không được mở theo trạng thái của P4a. Fixture và task triển khai nằm ở
`fixtures/bazi-interpretation.v1.json` và `tasks-bazi-interpretation.md`.

## 9. Bổ sung task 5 — quan hệ cá nhân mở rộng P2 (01/10/2026)

`personal.can-xung@1.0.0` chuyển từ pending sang verified trong phạm vi PRD
`prd-personal-feng-shui-stars.md`. Nguồn `selection` nêu riêng bốn cặp Giáp–Canh, Ất–Tân,
Bính–Nhâm, Đinh–Quý và có chú giải một cách đọc Mậu/Kỷ không xung. Policy v1 dùng đúng bốn cặp
đối xứng, không lấy sáu cặp Can khắc bổ sung từ attachment và không thực hiện hóa hợp.

Can xung chỉ là evidence bổ sung (`affectsDaySummary:false`). Bốn cặp đã nằm trong quan hệ ngũ
hành khắc của MVP, nên không đổi `personal.stem-relations`, `personal.summary-policy`, summary ngày
hoặc lọc giờ. `personal.attachment-can-xung` tiếp tục rejected.

Các rule `personal.thai-tue`, `personal.tue-pha`, `personal.tam-sat`, `personal.sat-chu` giữ
pending. Cùng Chi/lục xung vẫn dùng nhãn MVP, không đổi thành Thái Tuế/Tuế Phá. Tam Sát chưa được
chuyển từ hướng/xây sửa thành tuổi→ngày. Sát Chủ/Thụ Tử trong dữ liệu hiện có vẫn là sao chung;
`common.sat-chu-duong` tiếp tục pending và không ghi đè bảng Sát Chủ.

Registry hiện có **27 mục: 15 verified / 11 pending / 1 rejected**. Nghiệm thu và giới hạn ở
`tasks/validation-personal-feng-shui-task-5.md`.

## 10. Bổ sung task 6 — nền tảng thời gian sinh P3 (01/10/2026)

PRD `prd-birth-time-normalization.md` v1.0.0 đã chốt Việt Nam/ngày dương 1900–2100, tự động múi
giờ 1970–2100, tzdb 2026d, pipeline wall time → UTC instant → TST, uncertainty và hai Zi policy.
Trước 1970 cần xác nhận offset nếu mapping vùng không chắc; gap bị từ chối và overlap trả ứng viên.

Astronomy Engine 2.1.19 được chọn sau benchmark độc lập với JPL Horizons DE441. Trên fixture hiện
tại, 12 ca TST đạt sai số tuyệt đối tối đa **0,323 giây** và 12 tiết mở tháng đạt tối đa **19,926
giây**, dưới ngưỡng 30 giây. Công thức NOAA fractional-year có ca 56,724 giây nên chỉ giữ làm tài
liệu giải thích. JPL không được gọi lúc runtime và fixture không chứa dữ liệu sinh thật.

Các rule `birth.historical-timezone`, `birth.solar-time-engine`, `birth.term-instant-engine` và
`birth.zi-policy` chuyển sang verified v1.1.0; `birth.solar-term-angles` lên v1.1.0 để gắn PRD và
chuỗi 315° + 30k. Đây là gate thiết kế cho task 7, không tuyên bố engine/schema/UI đã triển khai.
Registry hiện có **27 mục: 19 verified / 7 pending / 1 rejected**. Chi tiết benchmark và giới hạn ở
`tasks/bazi-engine-evaluation.md` và `tasks/validation-personal-feng-shui-task-6.md`.

## 11. Bổ sung Nhật Nguyên và thống kê ngũ hành (02/10/2026)

Theo `bazi_calculation_engine_spec.md` và PRD `prd-bazi-interpretation.md` v1.1.0 mục 6.1/6.1a:

- `interpretation.day-master@1.0.0` verified: Can trụ Ngày của từng candidate P3, hành theo
  `CAN_ELEMENTS`, chỉ số chẵn Dương/lẻ Âm.
- `interpretation.element-count@1.0.0` verified: đếm 4 Can và hành chính 4 Chi, tổng 8, chỉ mô tả.
- `interpretation.strength-score@1.0.0` verified sau khi sửa (PRD v1.2.0 mục 6.4a): tài liệu gốc cho
  trọng số cộng 105%, không nói Can ngày và có nhánh ngưỡng “hoặc” chưa định nghĩa. Bản sửa lấy Chi
  tháng 35 (trong khoảng 30–40) để 7 vị trí cộng 100, loại Can ngày, ngưỡng ≥ 50 là Thân Vượng.
- Ví dụ đầu ra mục 2.2 của tài liệu bị từ chối: theo công thức JDN của chính tài liệu, 15/08/1990 là
  Nhâm Tý (JDN 2448119), giờ Thìn là Giáp Thìn. Regression nằm ở `shared/bazi/pillars.test.ts`.
