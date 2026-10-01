# PRD chuẩn hóa thời gian sinh Bát Tự

Phiên bản: **1.0.0**  
Ngày chốt: **01/10/2026**  
Trạng thái: nền tảng P3 đã đủ quyết định để bắt đầu task 7; chưa triển khai hồ sơ hoặc Tứ Trụ.

## 1. Mục tiêu và phạm vi

Chuẩn hóa ngày, giờ và nơi sinh thành một hoặc nhiều UTC instant có thể kiểm chứng; từ instant đó
tính giờ Mặt Trời thật (TST), thời điểm giao tiết và các ngày làm căn cứ cho trụ ngày/giờ. Kết quả
phải tái lập, dùng offline sau khi tải ứng dụng và không gửi dữ liệu sinh đến dịch vụ thiên văn.

Phiên bản đầu hỗ trợ nơi sinh tại Việt Nam và ngày sinh dương lịch **1900–2100**. Tự động phân giải
múi giờ chỉ được cam kết cho **1970–2100**. Dữ liệu 1900–1969 vẫn nhận nhưng yêu cầu người dùng xác
nhận offset nếu lịch sử vùng không đủ chắc chắn. Chưa nhận ngày âm, tháng nhuận, địa điểm ngoài Việt
Nam, Dụng thần, Thập thần hoặc luận giải cát hung.

## 2. Schema đầu vào và provenance

```ts
interface BirthTimeInput {
  civilDate: string // YYYY-MM-DD, Gregorian
  wallTime: string | null // HH:mm[:ss], never default to 12:00
  precision: 'exact' | 'estimated' | 'unknown'
  uncertaintyMinutes: number | null
  place: {
    countryCode: 'VN'
    subdivisionCode: string | null
    label: string
    latitude: number
    longitude: number
    coordinateSource: 'bundledGazetteer' | 'userSelected' | 'userEntered'
    coordinateAccuracyKm: number | null
  } | null
  timezoneId: 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok' | null
  timezoneSource: 'bundledMapping' | 'userConfirmed' | null
  confirmedOffsetMinutes: number | null
  ziPolicy: 'splitZi' | 'dayStartsAt23'
}
```

Output chuẩn hóa luôn kèm `tzdbVersion`, `astronomyEngineVersion`, `rulesetVersion`, offset thực tế,
nguồn offset/tọa độ, khoảng uncertainty và cảnh báo lịch sử. Không suy nơi sinh từ GPS/IP/vị trí
thiết bị. Nhãn địa điểm là dữ liệu người dùng; tọa độ dùng tính toán lấy từ lựa chọn có provenance.

Xóa ngày sinh sẽ xóa giờ, nơi sinh, offset xác nhận, uncertainty và policy liên đới. Không persist
UTC/TST, tiết khí hoặc bốn trụ vì đó là dữ liệu dẫn xuất có thể tính lại theo version.

## 3. Múi giờ lịch sử

Khóa dữ liệu ở **IANA tzdb 2026d**. Task 7 sinh một artifact chỉ chứa transition cần cho Việt Nam,
license/public-domain notice, checksum và script build. Runtime không dùng riêng `Intl` để quyết định
offset; `Intl` chỉ được dùng để format.

- Từ 13/06/1975, toàn Việt Nam dùng `Asia/Ho_Chi_Minh` và UTC+07 theo tzdb.
- Miền Bắc từ 1970 đến trước mốc trên dùng `Asia/Bangkok`; miền Nam dùng `Asia/Ho_Chi_Minh`.
- Trước 1970, tzdb không cam kết đầy đủ. Mapping vùng chỉ là gợi ý; UI phải hiển thị offset và yêu
  cầu xác nhận. Nếu không xác nhận, trả `insufficientData`, không âm thầm chọn một instant.
- Wall time nằm trong gap trả `invalidWallTime`. Wall time overlap trả cả hai ứng viên UTC và yêu
  cầu chọn offset; không tự chọn sớm/muộn.
- Offset xác nhận phải nằm trong −14:00…+14:00, theo phút và được lưu cùng nguồn `userConfirmed`.

Ranh giới Bắc/Nam lịch sử không được suy chỉ từ kinh độ. Gazetteer cần mapping subdivision theo thời
kỳ; địa điểm không ánh xạ chắc chắn chuyển sang luồng xác nhận offset.

## 4. Pipeline và time scale

1. Validate Gregorian date, wall time, precision, tọa độ, timezone, offset và policy.
2. Phân giải wall time bằng tzdb/offset xác nhận thành 0, 1 hoặc 2 UTC instant.
3. Dùng **UTC instant** để so với instant giao tiết. Engine nội bộ chuyển UTC/UT gần đúng sang TT
   theo model của engine; metadata giữ rõ time scale. Không dùng TST để so giao tiết.
4. Với mỗi UTC instant, tính TST tại kinh độ nơi sinh và carry đầy đủ ngày/tháng/năm.
5. Dùng TST để phân giải Chi giờ, `dayPillarDate` và `hourStemDate` theo `ziPolicy`.
6. Nếu uncertainty đầu vào cắt qua offset transition, giao tiết, nửa đêm TST hoặc biên Chi giờ, trả
   các ứng viên khác nhau; không chọn kết quả có vẻ chính xác hơn.

TST là biểu diễn luận trụ của cùng instant vật lý. Không chuyển TST thành UTC instant mới và không
cộng hiệu chỉnh kinh độ/EoT lần thứ hai.

## 5. Giờ Mặt Trời thật

Định nghĩa theo local apparent solar time tại kinh độ địa lý. Dấu kinh độ: Đông dương, Tây âm; đơn
vị độ. Công thức giải thích tương đương:

`TST = wall clock + EoT + 4 × longitudeEast − 60 × UTC offset hours`.

Implementation chọn **Astronomy Engine 2.1.19**: `HourAngle(Sun) + 12 giờ modulo 24`, dùng tọa độ
geodetic và cùng UTC instant. Output gồm:

- `tstDateTime`, `longitudeCorrectionSeconds`, `equationOfTimeSeconds`, `totalCorrectionSeconds`;
- civil offset, engine/version, coordinate provenance;
- `engineErrorBoundSeconds: 30` tách biệt `inputUncertaintySeconds`.

Công thức fractional-year NOAA chỉ dùng giải thích và regression. Nó không được chọn làm engine vì
benchmark có ca sai 56,724 giây, vượt ngưỡng 30 giây.

## 6. Giao tiết và trụ năm/tháng

Mười hai tiết mở tháng dùng kinh độ biểu kiến địa tâm của Mặt Trời trên hoàng đạo của ngày:

| Tháng Chi | Tiết | Kinh độ |
| --- | --- | ---: |
| Dần | Lập Xuân | 315° |
| Mão | Kinh Trập | 345° |
| Thìn | Thanh Minh | 15° |
| Tỵ | Lập Hạ | 45° |
| Ngọ | Mang Chủng | 75° |
| Mùi | Tiểu Thử | 105° |
| Thân | Lập Thu | 135° |
| Dậu | Bạch Lộ | 165° |
| Tuất | Hàn Lộ | 195° |
| Hợi | Lập Đông | 225° |
| Tý | Đại Tuyết | 255° |
| Sửu | Tiểu Hàn | 285° |

Thanh Minh là **15°**; 0° là Xuân Phân và không mở tháng. Trụ năm đổi đúng instant Lập Xuân 315°.
Trụ tháng đổi đúng từng instant trên. So sánh là `[termInstant, nextTermInstant)`: đúng mốc thuộc kỳ
mới. Không dùng tháng âm hoặc API `solarTerms` theo cuối ngày hiện có.

Implementation chọn `SearchSunLongitude` của Astronomy Engine 2.1.19. Fixture tham chiếu dùng JPL
Horizons DE441, quantity 31, Sun nhìn từ geocenter, apparent ecliptic-of-date, Gregorian/UT.

## 7. Quy ước giờ Tý

Default sản phẩm là **`splitZi`**; người dùng có thể chọn `dayStartsAt23`. Đây là quy ước luận trụ,
không thay đổi ngày của Lịch vạn niên hoặc MVP.

| TST | `splitZi`: ngày trụ ngày | `splitZi`: ngày lấy Can giờ | `dayStartsAt23`: cả hai |
| --- | --- | --- | --- |
| 23:00–23:59:59 | ngày TST hiện tại | ngày TST + 1 | ngày TST + 1 |
| 00:00–00:59:59 | ngày TST hiện tại | ngày TST hiện tại | ngày TST hiện tại |
| giờ khác | ngày TST hiện tại | ngày TST hiện tại | ngày TST hiện tại |

Chi giờ: Tý 23:00–00:59, Sửu 01:00–02:59, …, Hợi 21:00–22:59. Can giờ phải tính từ Can của
`hourStemDate`; không cố định “Canh Tý”. Enum khác hai giá trị trên bị reject.

## 8. Thiếu dữ liệu và bất định

- Thiếu giờ: không tự điền 12:00; chỉ có thể xuất phần không phụ thuộc giờ nếu API gọi rõ partial.
- `precision: estimated` bắt buộc `uncertaintyMinutes > 0`; `exact` dùng 0; `unknown` không lập đủ
  bốn trụ.
- Thiếu nơi sinh/tọa độ: không tính TST. Thiếu offset tin cậy: không tạo UTC instant.
- Khoảng uncertainty được mở quanh wall time trước khi normalize. Tối đa **8 tổ hợp khác biệt** sau
  khi gộp các kết quả đồng nhất. Vượt giới hạn trả `indeterminate` cùng các biên đã cắt.
- UI ghi “Có nhiều khả năng” hoặc “Chưa xác định” và nêu mốc bị cắt; không làm tròn để ép một kết quả.

## 9. Build, offline, riêng tư và nghiệm thu

Task 7 thêm `astronomy-engine@2.1.19` với MIT notice và artifact tzdb 2026d tối giản. Đo hiện tại:
file browser minified của engine **116.424 byte**; package tạm **1.812 KiB** trên đĩa. Chỉ bundle API
cần dùng nếu tree-shaking thực tế chứng minh được; không gọi JPL lúc runtime. Dữ liệu cá nhân không
được đưa vào service-worker public cache, URL, SEO, analytics, replay hoặc log.

Điều kiện triển khai:

- Fixture độc lập đạt sai số tuyệt đối ≤30 giây cho TST và instant giao tiết.
- Test 1900/1970/1975/2038/2100, Bắc/Nam, gap/overlap, offset lẻ, đổi ngày TST và cùng instant.
- Test trước/đúng/sau 12 giao tiết; 345°→15° qua 0°; đủ biên giờ Tý và hai policy.
- Mỗi output có version/provenance và phân biệt sai số engine với uncertainty đầu vào.
- Chưa mở UI nếu artifact tzdb, schema, migration, offline và privacy chưa đạt task 7/8.

## 10. Nguồn

- IANA tzdb 2026d: `asia`, `backzone`, `zone1970.tab`, `theory.html`.
- NOAA, *General Solar Position Calculations*: dấu/đơn vị EoT và TST.
- NASA/JPL Horizons manual/API: quantities 31/34, time scale và DE441 fixture.
- Hong Kong Observatory, Table 1: tên và kinh độ 24 tiết khí.
- Astronomy Engine 2.1.19: MIT, VSOP87/NOVAS-based implementation; benchmark ở
  `tasks/fixtures/bazi-engine-benchmark.v1.json`.

