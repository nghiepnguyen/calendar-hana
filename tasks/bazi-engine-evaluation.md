# Đánh giá engine thời gian sinh P3

Ngày benchmark: **01/10/2026**. Fixture: `tasks/fixtures/bazi-engine-benchmark.v1.json`.

## Kết luận chọn

Chọn **Astronomy Engine 2.1.19** cho TST và instant giao tiết. Khóa **IANA tzdb 2026d** làm dữ liệu
múi giờ; task 7 sẽ sinh artifact Việt Nam có version/checksum. Không thêm dependency ở task 6.

| Tiêu chí | Astronomy Engine 2.1.19 | NOAA fractional-year | JPL Horizons live |
| --- | --- | --- | --- |
| TST, sai số tối đa trong fixture | **0,323 giây** | 56,724 giây, trượt ngưỡng | tham chiếu quantity 34 |
| 12 giao tiết, sai số tối đa | **19,926 giây** | không đánh giá | tham chiếu DE441 quantity 31 |
| License | MIT | tài liệu công khai | dịch vụ tham chiếu |
| Offline/runtime | Có, không dependency | Có | Không chọn runtime |
| Kích thước đo | 116.424 byte browser minified; 1.812 KiB package | công thức nhỏ | network |
| Tái lập | pin package/version + fixture | tái lập nhưng không đạt | lưu query/config/result |

Ngưỡng ≤30 giây đạt trên ma trận hiện tại cho Astronomy Engine. Đây là gate kỹ thuật trong phạm vi
fixture, không phải cam kết thiên văn ngoài 1900–2100 hoặc thay thế uncertainty của giờ/nơi sinh.

## Cấu hình benchmark

- Giao tiết: Sun target 10, geocenter `500@399`, DE441, quantity 31, apparent
  ecliptic-of-date, airless, Gregorian, UT output. Lấy mẫu 1 phút quanh nghiệm và nội suy tuyến tính.
- TST: Sun target 10, `coord@399`, tọa độ geodetic giả tại Việt Nam, quantity 34, UT. So cùng instant
  với `HourAngle(Sun) + 12h mod 24` và công thức NOAA.
- Không dùng dữ liệu sinh thật. Bộ TST bao phủ 1900, 1954, mốc 1975, năm nhuận 2000, bốn mùa 2024,
  biên 2038, 2050 và 2100; kinh độ 102,15°E–109,46°E.
- Bộ giao tiết bao phủ đủ 12 mốc từ 315° theo bước 30°, gồm vòng 345°→15°.

Sai số JPL term còn gồm sai số nội suy từ dữ liệu làm tròn 7 chữ số thập phân. Task 7 giữ ngưỡng 30
giây và test regression trên các expected độc lập này; không sinh expected bằng code production.

## Lựa chọn tzdb

IANA 2026d được chọn thay cho `Intl` hoặc package có data cũ. `timezone-support@3.1.0` chỉ chứa tzdb
2022f; Moment Timezone 0.6.3 chứa 2026c và kéo thêm Moment. Vì app chỉ hỗ trợ Việt Nam ở v1, build
một transition artifact từ IANA 2026d cho `Asia/Ho_Chi_Minh`, `Asia/Bangkok` và dữ liệu lịch sử cần
thiết nhỏ hơn, rõ version hơn và tránh phụ thuộc runtime.

IANA nói dữ liệu trước 1970 không đủ cho nhu cầu chính xác mọi nơi. Vì vậy 1900–1969 không được tự
động coi là chắc chắn: người dùng phải xác nhận offset khi mapping vùng không đủ bằng chứng. Từ
1970, miền Bắc dùng `Asia/Bangkok`; miền Nam dùng `Asia/Ho_Chi_Minh` cho tới khi cùng UTC+7 từ
13/06/1975.

## Quyết định chặn đã đóng

- Phạm vi: ngày dương, nơi sinh Việt Nam, 1900–2100; auto timezone 1970–2100.
- Time scale: wall time → UTC instant; giao tiết so instant; TST chỉ phân giải ngày/giờ luận trụ.
- Tiết mở tháng: 315° + 30k; Thanh Minh 15°, không phải 0°.
- Zi default: `splitZi`; `dayStartsAt23` là tùy chọn rõ ràng.
- Uncertainty: không mặc định 12h; trả ứng viên/indeterminate, tối đa 8 tổ hợp.
- Offline: đóng gói engine + tzdb artifact; JPL chỉ dùng build/benchmark với dữ liệu giả.

## Việc chuyển sang task 7

Task 7 cần cài dependency, thêm license notice, sinh/checksum tzdb artifact, triển khai schema và các
module `validation`, `birthTime`, `solarTime`, `termInstants`, `ziPolicy`, `pillars`. Chưa được mở UI
Tứ Trụ trước khi migration, fixture, privacy và offline qua nghiệm thu.

