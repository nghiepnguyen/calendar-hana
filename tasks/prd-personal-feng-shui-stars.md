# PRD — Quan hệ cá nhân mở rộng P2

Phiên bản đặc tả: **1.0.0**, ngày **01/10/2026**. Phạm vi: task 5 trong
`tasks-personal-feng-shui-expansion.md`.

## 1. Kết quả cần đạt

P2 bổ sung một lớp giải thích riêng trong khối Phong thủy cá nhân. Chỉ quy tắc Thiên can xung có
đủ bảng và phạm vi để chạy. Thái Tuế, Tuế Phá, Tam Sát cá nhân và Sát Chủ cá nhân tiếp tục
`pending`; giao diện không tạo kết quả thay thế hoặc diễn đạt chúng như “không phạm”. Thụ Tử và
Sát Chủ hiện có vẫn là sao chung trong Lịch vạn niên.

P2 không đổi nhãn ngày MVP, nhóm giờ cá nhân, kết quả hạn năm hoặc nhãn hoàng/hắc đạo chung.

## 2. Nguồn và quyết định kiểm chứng

| ID | Nguồn | Quyết định |
| --- | --- | --- |
| `selection` | [選擇紀要 / 上編](https://zh.wikisource.org/zh-hant/選擇紀要/上編), mục `天干相沖` và `天干相剋` | Dùng bốn cặp xung được nêu riêng: Giáp–Canh, Ất–Tân, Bính–Nhâm, Đinh–Quý. Chọn cách đọc bảo thủ “Mậu/Kỷ không xung”; không nhập các cặp Can khắc vào bảng xung. |
| `personalStarsSpec` | Tài liệu này và `tasks/fixtures/personal-feng-shui-stars.v1.json` | Chốt operand ngày–năm sinh, validation, presentation và việc không đổi summary MVP. |
| `xieji3` | [欽定協紀辨方書, quyển 3](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷03), mục `太歲` / `歲破` | Nguồn có ngữ cảnh năm/phương vị, chưa chứng minh cách gọi Chi ngày trùng/xung tuổi là Thái Tuế/Tuế Phá cá nhân. Hoãn. |
| `xieji34` | [Cùng sách, quyển 34](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷34), mục `制煞要法` / `三煞` | Ngữ cảnh phương vị và xây sửa, chưa chứng minh phép tuổi → Chi ngày. Hoãn. |
| `localStars` | `shared/lunar/stars.data.ts`, `stars.ts` | Thụ Tử/Sát Chủ dùng tháng âm và ngày, không có operand hồ sơ. Không sao chép sang P2. |

Attachment `1. canchi.ts` chỉ là đầu vào audit. `CAN_XUNG_MAP` của attachment gộp Can khắc
Giáp–Mậu, Ất–Kỷ, Bính–Canh, Đinh–Tân, Mậu–Nhâm, Kỷ–Quý vào “xung”; các cặp này không được
chọn. Không copy lớp `FengShuiUtils` hoặc cờ `isHarmfulToUser`.

## 3. Input, validation và mốc thời gian

```ts
interface PersonalStarsInput {
  birthYear: { can: number; chi: number }
  viewedDay: { can: number; chi: number }
  lunarMonth: number
}
```

- `birthYear` là Can Chi năm âm của ngày sinh, đổi năm vào Tết theo lịch Việt UTC+7.
- `viewedDay` là Can Chi của ngày dương đang xem, đổi ngày lúc 00:00.
- Mỗi Can Chi phải có chỉ số Can 0–9, Chi 0–11, đều là số nguyên và cùng parity. Đây là điều kiện
  thuộc một trong 60 tổ hợp hợp lệ; không nhận 60 tổ hợp parity sai còn lại.
- `lunarMonth` phải là số nguyên 1–12. Tháng nhuận dùng cùng số tháng; P2 v1 chưa dùng operand
  này để tính Can xung nhưng validate context để không mở đường cho bảng tháng sai.
- Thiếu/sai input trả `insufficientData` với reason cụ thể. Rule missing/pending/rejected/sai scope
  trả `unsupported`; không trả `hit:false` giả.

## 4. Bảng Thiên can xung

Can ngày và Can năm sinh được so đối xứng:

| Cặp chỉ số | Cặp tên |
| --- | --- |
| 0 ↔ 6 | Giáp ↔ Canh |
| 1 ↔ 7 | Ất ↔ Tân |
| 2 ↔ 8 | Bính ↔ Nhâm |
| 3 ↔ 9 | Đinh ↔ Quý |

Mậu (4), Kỷ (5) không có cặp trong policy v1. Cùng Can, Can hợp và các cặp Can khắc khác không
được đổi tên thành Can xung.

Kết quả có `ruleId`, `version`, `sourceIds`, `hit`, operands và reason. `affectsDaySummary:false`
luôn được xuất để ngăn caller âm thầm đưa lớp giải thích mới vào kết luận MVP.

## 5. Quan hệ với MVP

Can xung và Can khắc là hai nhãn riêng. Bốn cặp xung đã chọn đồng thời nằm trong quan hệ ngũ
hành khắc, nên MVP đã có mức `caution`. P2 chỉ thêm lý do “Can xung”; không thêm một phiếu xấu,
không thay thứ tự ưu tiên Can hợp và không version-bump `personal.stem-relations` hoặc
`personal.summary-policy`.

Giờ cá nhân tiếp tục chỉ dùng policy MVP. P2 v1 không áp bảng Can xung năm sinh vào từng giờ và
không nới/siết danh sách giờ đã chọn.

## 6. Các quy tắc hoãn

| Rule | Trạng thái | Thiếu gì để mở gate |
| --- | --- | --- |
| `personal.thai-tue` | pending | Nguồn xác định operand và mốc năm/tháng/ngày cho hồ sơ cá nhân. Cùng Chi chỉ giữ nhãn trung tính của MVP. |
| `personal.tue-pha` | pending | Nguồn cho tên Tuế Phá ở phép so đang dùng. Lục xung tuổi vẫn là quan hệ MVP, không đổi tên. |
| `personal.tam-sat` | pending | Bằng chứng tuổi → ngày hoặc model hướng/hoạt động xây sửa rõ ràng. |
| `personal.sat-chu` | pending | Quy tắc có operand hồ sơ và nguồn định vị; bảng tháng/ngày chung không đủ. |
| `common.sat-chu-duong` | pending | Ấn bản/mục/trang và chính sách tháng nhuận; không ghi đè Sát Chủ hiện có. |

## 7. Giao diện, nguồn và riêng tư

Khối “Quan hệ cá nhân mở rộng” nằm sau ngày/giờ cá nhân và trước giải thích MVP. Hiện Thiên can
xung bằng chữ kèm màu, reason cụ thể và ghi rõ không đổi kết luận ngày. Details nguồn nêu bốn cặp,
Mậu/Kỷ, danh sách hoãn và ranh giới sao chung. Không hiển thị kết quả `hit:false` của các rule
pending.

Không persist output, không thêm Settings/Firestore/JSON, không gửi operands/kết quả qua
analytics, URL, SEO hoặc dịch vụ ngoài. Tính offline từ bảng đóng gói.

## 8. Fixture và nghiệm thu

`tasks/fixtures/personal-feng-shui-stars.v1.json` là expected viết độc lập: tám chiều của bốn cặp,
hai trường hợp Mậu/Kỷ, hai cặp chỉ khắc nhưng không xung, cùng Can, Can hợp và input sai. Test code
bao phủ toàn 10×10 Can, 60 Hoa Giáp hợp lệ, parity/range/tháng, gate pending/rejected và danh sách
rule hoãn.

Nghiệm thu còn yêu cầu regression MVP summary/giờ, sao chung, UI 360px/ba cỡ chữ/sáng tối/axe,
typecheck/lint/format/build/audit. Chỉ đánh dấu task 5 hoàn tất cho phạm vi Can xung đã chọn; các
rule hoãn giữ nguyên pending và không chặn P3.
