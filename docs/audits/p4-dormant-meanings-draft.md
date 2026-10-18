# Nghĩa 16 thần dormant — bản nháp chờ owner duyệt (roadmap 10 A4)

2026-10-18. [PRD roadmap 10](../../tasks/prd-p4-activation.md) §5.3: soạn một câu nghĩa tiếng Việt cho 16 thần dormant chưa có sao âm lịch tương ứng. Năm thần còn lại lấy nghĩa sao alias, không đổi: Phổ Hộ, Tai Sát, Nguyệt Sát, Nguyệt Yếm, Vãng Vong.

**Căn cứ** là trích dẫn 協紀 đã khóa trong `shared/almanac-data/xieji-god-definitions.json`, đối chiếu với `activityIds` trong catalog. Câu nghĩa chỉ hiện trên thẻ sao ("Sao tốt & sao xấu") và trang SEO tĩnh; **không đổi điểm**. Câu nào nguồn không ghi rõ 宜/忌 thì chỉ mô tả, không thêm việc nên làm hay cần kiêng.

| # | Thần | Hán | Căn cứ (trích, rút gọn) | Nghĩa đề xuất |
|---|---|---|---|---|
| 1 | Thiên Nguyện | 天願 | 歴例: ngày theo tháng (正月甲午…); 天願必是六合 | Ngày lành của tháng theo Hiệp Kỷ. |
| 2 | Tứ Tướng | 四相 | …移徙逺行; 春丙丁夏戊己秋壬癸冬甲乙 | Ngày can vượng tướng của mùa; tốt cho chuyển nhà, đi xa. |
| 3 | Thời Đức | 時德 | 四序中德神也，其日宜慶賜宴樂拜官賞賀 | Đức thần của mùa; tốt cho mừng thưởng, yến tiệc, nhận chức. |
| 4 | Ngũ Hợp | 五合 | 月内良日也，其日宜結婚姻會親友立券交易 | Ngày lành trong tháng; tốt cho cưới hỏi, gặp gỡ, lập khế ước, giao dịch. |
| 5 | Bất Tương | 不將 | 陰陽不將…乃堪輿家之吉日，凡事可用，非僅施之嫁娶 | Ngày âm dương bất tương; ngày tốt dùng được cho mọi việc, nhất là cưới hỏi. |
| 6 | Thiên Thương | 天倉 | 天庫之神也，其日可以修倉庫受賞賜納財牧養 | Thần kho trời; tốt cho sửa kho, nhận thưởng, thu tài, chăn nuôi. |
| 7 | Nguyệt Hại | 月害 | 所値之日忌攻城野戰牧養羣畜結會親姻請醫巫納奴婢 | Kỵ chiến trận, chăn nuôi, kết thân cưới hỏi, mời thầy chữa bệnh, nhận người làm. |
| 8 | Yếm Đối | 厭對 | 月厭所衝之辰也，其日忌嫁娶…忌乘船渡水 | Ngày xung Nguyệt Yếm; kỵ cưới gả, đi thuyền qua sông. |
| 9 | Đại Thời | 大時 | …築室會親; 神樞經有忌無宜 | Hung thần chỉ có kỵ, không có nghi; kỵ xây nhà, kết thân. |
| 10 | Tứ Phế | 四廢 | 四廢日干支皆死氣也; 與月破併諸事皆忌 | Can chi ngày đều ở tử khí của mùa; kỵ hầu hết mọi việc. |
| 11 | Tứ Kỵ | 四忌 | 春甲子夏丙子秋庚子冬壬子; 以本令陽干加於辰首 | Ngày can dương của mùa ở đầu chi (Giáp Tý xuân, Bính Tý hạ, Canh Tý thu, Nhâm Tý đông); kỵ cưới hỏi, an táng. |
| 12 | Tứ Cùng | 四窮 | 所值之日不可遠行征伐出納財物 | Không nên đi xa, xuất quân, xuất nhập tiền của. |
| 13 | Ngũ Mộ | 五墓 | 正二月乙未四五月丙戌七八月辛丑十月十一月壬辰四季月戊辰 | Ngày mộ của hành vượng trong tháng; kỵ nhiều việc lớn. |
| 14 | Ngũ Ly | 五離 | 月中離神也，其日忌結婚姻會親友作交關立契券 | Thần chia lìa trong tháng; kỵ cưới hỏi, gặp gỡ, giao dịch, lập khế ước. |
| 15 | Bát Chuyên | 八專 | 八專日忌出軍嫁娶 | Kỵ xuất quân, cưới gả. |
| 16 | Quy Kỵ | 歸忌 | 其日忌遠行歸家移徙娶婦; …應止忌般移遠迴，不忌嫁娶 | Kỵ đi xa, trở về nhà, chuyển nhà (Hiệp Kỷ: không kỵ cưới gả). |

**Lưu ý cho owner:**
- **#11 Tứ Kỵ:** nguồn chỉ nêu cách tính. "Kỵ cưới hỏi, an táng" lấy từ `activityIds` của catalog, không phải câu trích.
- **#13 Ngũ Mộ:** nguồn đã khóa chỉ có bảng ngày.
- **#2 Tứ Tướng:** câu trích bắt đầu giữa danh sách 宜 ("…移徙逺行"); phần đầu danh sách không có trong trích đã khóa.

Có thể bỏ vế việc làm ở #11, #13, #2 nếu owner muốn chỉ giữ phần nguồn ghi rõ.
