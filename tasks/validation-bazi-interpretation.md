# Nghiệm thu P4: giải nghĩa Bát Tự

Ngày kiểm tra: **02/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`. Chưa deploy.

## Lớp đã mở

| Rule | Version | Nguồn | Bằng chứng |
| --- | --- | --- | --- |
| `interpretation.day-master` | 1.0.0 | PRD 6.1, tài liệu engine 3.1 | `dayMaster.test.ts`: 10 Can, hành, âm dương |
| `interpretation.element-count` | 1.0.0 | PRD 6.1a, tài liệu engine 5.1 | `dayMaster.test.ts`: tổng 8, vị trí từng chữ |
| `interpretation.strength-score` | 1.0.0 (`weighted-v1.0.0`) | PRD 6.4a | `strength.test.ts`: trọng số cộng 100, ca 37/72/50 |
| `interpretation.thap-than` | 1.0.0 | 三命通會 quyển 5 và 7, PRD 6.2, fixture | `tenGods.test.ts`: 100 ô, chiều quan hệ, âm dương |
| `interpretation.hidden-stems` | 1.0.0 | PRD 6.3, fixture | `hiddenStems.test.ts`: 12 Chi, 28 tàng can, thứ tự |

Thập thần của ngày đang xem (PRD 8.1, 8.4): `transit.test.ts`, hiện trong ô Thiên can; lá số ứng viên
khác Nhật Nguyên trả `ambiguous`.

## Cách kiểm chứng Thập thần

1. **Nguồn gốc có vị trí:** 三命通會 quyển 5 (生我者…立名印綬；我生者…立名食神；同我者 Tỷ/Kiếp) và
   quyển 7, 論六親 (我克者為財，克我者為官).
2. **Suy ra độc lập:** test tự định nghĩa vòng sinh và hành của Can, không dùng `elements.ts` hay code
   engine, rồi so với `tenGodMatrix` của fixture. Cả 100 ô khớp, không ô nào phải sửa.
3. **Review nội dung của người: chưa có.** Khi có người duyệt bảng 10×10, ghi tên, ngày và quyết định
   vào đây. Thiếu bước này thì rule vẫn chạy nhưng được ghi là chưa có review của người.

## Lớp chưa mở

- `interpretation.dung-than`: pending, PRD 6.5 cần bảng quyết định và hai review.
- Bằng chứng vượng suy theo PRD 6.4 (task 3.3 đến 3.5): chưa làm.
- Can giờ đang xem: chưa làm, cần instant và địa điểm (PRD 8.2).
- `annual.han-tuoi`: pending và ẩn trên UI, xem `feng-shui-rule-audit.md` mục 12.

## Kết quả kiểm tra (02/10/2026)

- Unit/fixture: **1035 test trong 97 file** đạt, gồm `dayMaster`, `strength`, `tenGods`,
  `hiddenStems`, `transit` và test UI `BaziSection`, `personalPanelFeatures`.
- Playwright desktop + mobile (Chromium): **207 đạt**, gồm axe, 360px, ba cỡ chữ và ảnh chuẩn.
  `visual-default` week/month dark mobile từng fail một lượt rồi đạt khi chạy lại 3 lần (flaky).
- Lint (oxlint), Prettier, typecheck sạch.
- Giao diện: ô Tứ Trụ dạng lá số gọn kèm tấm tóm tắt; Thập thần ngày nằm trong ô Thiên can; tàng can
  mở bằng một nút chung, trụ Tháng có nhãn Nguyệt lệnh.
