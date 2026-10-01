# Task 5 — nghiệm thu quan hệ cá nhân mở rộng P2

Ngày kiểm tra: **01/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`. Chưa commit/deploy
trong task này.

## Phạm vi có thể phát hành

- `personal.can-xung@1.0.0`: bốn cặp đối xứng Giáp–Canh, Ất–Tân, Bính–Nhâm, Đinh–Quý.
- Input bắt buộc là Can Chi năm âm sinh, Can Chi ngày xem và tháng âm hợp lệ. Cặp Can Chi phải
  thuộc vòng 60 Hoa Giáp theo range/parity.
- Kết quả Can xung có reason/source/version và `affectsDaySummary:false`; không đổi summary, giờ cá
  nhân, hạn năm hoặc sao chung.
- Panel hiện lớp giải thích riêng, ghi rõ phạm vi, rule hoãn và ranh giới Thụ Tử/Sát Chủ chung.
- Không thêm persist, analytics, URL, API hoặc dependency; chạy offline từ dữ liệu đóng gói.

## Phạm vi tiếp tục pending

`personal.thai-tue`, `personal.tue-pha`, `personal.tam-sat`, `personal.sat-chu` và
`common.sat-chu-duong` chưa được tính. Engine chỉ liệt kê metadata hoãn; không trả hit giả. Cùng Chi
không được gọi Thái Tuế, lục xung không đổi tên Tuế Phá, Tam Sát không chuyển từ hướng sang cảnh báo
ngày, và bảng Sát Chủ hiện có không bị sửa.

## Bằng chứng

| Kiểm tra | Kết quả |
| --- | --- |
| TDD | Test engine/registry và tích hợp ngày/UI đã thất bại vì module/gate/section chưa có trước khi viết implementation. |
| Fixture | `personal-feng-shui-stars.v1.json`: 14 ca Can viết độc lập, gồm 8 chiều xung, Mậu/Kỷ, khắc không xung, cùng Can, Can hợp; thêm input parity/range/tháng sai. |
| Bảng exhaustive | 10×10 Can; chỉ đúng 8 chiều hit. Can Chi đầu vào được kiểm tra trên 60 tổ hợp hợp lệ. |
| `npm test` | **935 test / 82 file đạt**, gồm regression `shared/lunar/stars*`, MVP ngày/giờ, annual và P2. |
| Playwright | **18 test đạt** trên desktop/mobile; 360px × ba cỡ chữ × sáng/tối, details P2 bằng bàn phím, axe WCAG A/AA và offline. |
| Build/static | `npm run build`, typecheck, lint, Prettier và `git diff --check` đạt. Build còn cảnh báo chunk lớn/PWA deprecation hiện có. |
| Security | `npm audit --audit-level=high`: **0 vulnerabilities**. Không thay dependency. |

Không chạy Firebase Emulator vì task 5 không đổi repository, schema, sync hoặc rules. Chưa thử với
người dùng thật hoặc screen reader thật; các giới hạn phát hành chung của MVP ở validation task 4
vẫn còn.
