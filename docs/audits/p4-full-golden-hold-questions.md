# Full Golden P4 — câu hỏi owner cho các dòng hold (task 2.1)

2026-10-17, nhánh `claude/p4-full-golden`. Audit-only.

> **Đính chính 2026-10-17 (task 3.3):** bảng H1 ghi 修倉庫 `only_ji` "không có câu lan truyền" là sai. puzhu:20 có 修倉庫 trong danh sách đích; trên các ngày này 興造動土/豎柱上梁 đều 相抵, nên 修倉庫 cũng thành `neither_recorded`. Quyết định không đổi. Chi tiết: [compose README](sources/p4-vol10/p4-full-golden-v1/compose/README.md).

> **月表 witness review 2026-10-21:** H1-B được chứng thực một phần (lớp 重日/復日 + 德, 7 trang). Phát hiện mâu thuẫn tiền đề 相抵 của 劫煞 tháng 辰/戌/未; chờ owner. Xem [p4-h1b-yuebiao-witness.md](p4-h1b-yuebiao-witness.md).

**Quyết định owner 2026-10-17: H1-B, H2-A**, nhãn `OWNER_ADOPTED_SOURCE_DEPENDENT`. Golden task 3.2 áp hai quyết định này. Reason code `OWNER_QUESTION_H1/H2` chỉ còn dùng cho lịch sử; mọi dòng đổi trạng thái được liệt kê trước khi đóng băng.

Nguồn: `docs/audits/sources/p4-vol10/vol10.raw.txt`, SHA-1 `355dc6c8fe2d…`; offset tính theo code point Python. Mọi câu trích đã kiểm là chuỗi con đúng tại offset.

Có hai loại số liệu khác nguồn gốc:
- **Chẩn đoán engine** (chỉ để xác định chỗ hold, không phải bằng chứng): `resolveP4Headings` / `resolveP4FullDay` chạy tạm, không commit.
- **Số dòng bị ảnh hưởng**: lấy từ sweep mới nhất, `docs/audits/p5-warehouse-2025-2027.tsv` (修倉庫) và `docs/audits/p4b-puzhu06-2025-2027.tsv` (5 heading puzhu:06). Golden task 3.2 sẽ đếm lại độc lập.

Trong lúc chờ owner, Golden ghi các dòng này là `undetermined` kèm `OWNER_QUESTION_H1` / `OWNER_QUESTION_H2` (PRD FR-04).

## Tóm tắt

| Câu | Nội dung | Dòng ảnh hưởng 2025–2027 |
|---|---|---|
| H1 | Cùng một heading có hai phạm vi: một bên `only_ji` (phạm vi convention 又為月虛), một bên `neither_recorded` (相抵 của 月煞). Heading đó ra trạng thái gì? | 11 dòng 開倉庫出貨財 + 14 dòng 修倉庫. Nếu áp thành quy tắc chung (H1-B) thì toàn miền context có 22 dòng (số đo ở [youwei-scopes](p4-vol10-youwei-scopes.md): 2.585 → 2.607) |
| H2 | Ngày 未月戊午 (逐陣): 天願 có thuộc 「德願」 không, và phạm vi 閉日 ra sao? | Cả 29 heading ngày 2027-08-07 và context 未-戊午. Gồm 5 dòng hold puzhu:06 và hai phạm vi 德願 / 未月戊午 đang `undetermined` cả phạm vi |

H2 gộp luôn câu hỏi 德願. Ngoài 未月戊午, context thật duy nhất có liên quan là 巳月丙午, và ở đó 德願 không tác động (grade-resolution: 大時 có clause vô điều kiện).

---

## H1 — Ghép phạm vi: 忌 của 又為月虛 với 相抵 của 月煞

### Bằng chứng nguồn

1. Entry 月煞, offset 12187: 「又為月虛忌修倉庫開倉庫出貨財」.
2. Offset 12204: 「夘酉月值六合與月德天願併止忌安撫邊境選將訓兵出師求醫療病餘皆不忌不與德願併凡所忌者則不註宜所宜者亦不註忌」. Tháng 卯/酉 không có 月德/天願 thì 月煞 là **相抵**.
3. 鋪註 puzhu:22, offset 22443: 「凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌」.
4. Quyết định owner 2026-10-11 ([youwei-scopes](p4-vol10-youwei-scopes.md)):
   - 月虛 là phạm vi riêng theo **convention**, không được bảo vệ, và có thể bị lan truyền gỡ.
   - 「Clause hay deferral của đối tượng chính không gỡ và không chuyển nó đi」.
5. Câu 又為 lặp heading của danh sách chính là chuyện **bình thường**, nên không dùng làm lập luận:
   - 大耗 lặp cả 5 heading của 月破;
   - 月虛 lặp cả 2 (danh sách 刼煞, offset 11115);
   - 地火 lặp 1/2 (栽種);
   - 天火 và 咸池 không lặp heading nào.

### Chẩn đoán engine (卯丙戌, 卯戊戌, 酉丙辰)

- Phạm vi `月煞`: `clauseEffect: cancel_both`. Các heading 開倉庫出貨財, 修倉庫, 開市, 立券交易 đều `neither_recorded`.
- Phạm vi `又為月虛` (convention): `only_ji` cho 修倉庫 và 開倉庫出貨財.
- Engine không có quy tắc ghép hai trạng thái này, nên heading ra `undetermined`. Kết quả không phụ thuộc 宜: 3 ngày 丙戌 và 3 ngày 壬辰 có 四相, 5 ngày còn lại không có thần 宜 nào.
- Lan truyền bỏ qua heading `undetermined`, nên puzhu:22 chưa bao giờ được xét. Trên cả 11 ngày, 開市 và 立券交易 đều `neither_recorded`, và không ngày nào là 甲日.

### Dòng ảnh hưởng

- **開倉庫出貨財 (11):**
  - 2025-03-18, 2025-03-30, 2025-09-20;
  - 2026-03-13, 2026-03-25, 2026-09-15;
  - 2027-03-08, 2027-03-20, 2027-04-01, 2027-09-10, 2027-10-04.
- **修倉庫 (14):** cùng 11 ngày trên, cộng 3 ngày 甲辰. Ở 3 ngày 甲辰, 開倉庫 đã `only_ji` nhờ 甲日 專忌, nhưng 甲日 không phải 專忌 của 修倉庫.
- Không thuộc câu hỏi: 甲戌 và 庚辰 có 月德 + 天願, nên áp 「止忌…餘皆不忌」.

### Phương án

Phương án "月虛 đi theo cân bằng của 月煞" **không** được đưa ra, vì nó trái quyết định 2026-10-11 (bằng chứng 4).

| | Quy tắc ghép | 開倉庫出貨財 (11) | 修倉庫 (14) | Ngoài kho |
|---|---|---|---|---|
| **H1-A** | Chỉ cho 月虛: 忌 sống sót. Vì 月煞 相抵 nên 宜 không được ghi; sau đó mới xét lan truyền | 忌 bị puzhu:22 gỡ (月虛 không phải 專忌) → `neither_recorded` | `only_ji` (không có câu lan truyền) | Không đổi |
| **H1-B** | Như H1-A, nhưng là quy tắc chung: 忌 của phạm vi convention + 相抵 của phạm vi khác trên cùng heading → 忌 sống sót, 宜 không ghi, rồi xét lan truyền | `neither_recorded` | `only_ji` | Các dòng 大耗 / 地火 / 天火 / 咸池 cùng loại; toàn miền context 22 dòng, trong đó có phần kho. Task 3.2 sẽ liệt kê từng dòng trước khi đóng băng |
| H1-D | Giữ `undetermined` SOURCE_DEPENDENT | `undetermined` | `undetermined` | Không đổi |

Ghi chú:
- Với 開倉庫, H1-A và H1-B cho cùng kết quả `neither_recorded`. Chỉ có câu nguồn puzhu:22 quyết định kết quả này.
- Cách đọc ngược lại, 月虛 được tính như 專忌 cho puzhu:22, sẽ trái quyết định "convention, không bảo vệ". Muốn đọc vậy phải mở lại quyết định 2026-10-11.
- **Đề xuất: H1-B.**
  - Engine hiện đã coi phạm vi 又為 là độc lập với clause chính (bằng chứng 4). Quy tắc ghép chung chỉ nói thẳng hệ quả đó, không dùng ngoại lệ riêng cho 月虛.
  - Phạm vi ảnh hưởng nhỏ (22 dòng context) và sẽ được liệt kê đủ.
  - Nếu owner muốn hẹp hơn thì chọn H1-A.
- Nhãn đề xuất cho cả A và B: `OWNER_ADOPTED_SOURCE_DEPENDENT`, vì không có câu nguồn nói thẳng quy tắc ghép.

---

## H2 — 未月戊午: 天願 ∈ 德願, phạm vi 閉日

### Bằng chứng nguồn

1. 未月戊午 vừa là 閉日 vừa là 天吏. Trong nhóm 德 của clause chỉ có **天願**; không có thần 德合 nào. 四相 cũng có mặt nhưng không thuộc nhóm.
2. Entry 閉日, offset 10890: 「辰戌丑未月值官日天吏與天德月德天德合月德合天赦天願併凡所忌者則不註宜所宜者亦不註忌不與德合赦願併如常例」.
3. Entry 天吏, offset 16268: 「辰戌丑未月值閉日與德合赦願併凡所忌者則不註宜所宜者亦不註忌不與德合赦願併如常例」.
4. Câu nói thẳng về ngày này, offset 14397: 「…六月丙午戊午十二月壬子戊子為逐陣皆從月厭所忌四月丙午六月戊午亦不從德願所宜」.
5. 鋪註:
   - offset 22604: 「凡天吏大時不以死敗論者遇四廢嵗薄逐陣仍以死敗論」 (puzhu:27; nói về 天吏, **không** nói 閉日);
   - offset 22630: 「凡嵗薄逐陣日所宜事照月厭所忌刪所忌仍從本日」.
6. Nghĩa của 「德願」 trong cùng quyển:
   - 月煞 tháng 卯/酉 (offset 12204): 「與**月德天願**併…不與**德願**併」;
   - 月刑 tháng 巳 (offset 12899): 「與月德天德合**天願**併…不與**德願**併」.

   Ở cả hai chỗ, 「願」 trong 德願 là 天願.

### Chẩn đoán engine

- `resolveP4Headings('未','戊午')`: cả hai phạm vi 閉日 và 天吏 đều `undetermined` (`suppressedBy: ['no_de_yuan']`, A03). Một phạm vi `undetermined` làm mọi heading trong ngày `undetermined`, nên cả 29 heading đều hold.
- `resolveP4FullDay`: puzhu:27 **đã** khôi phục 天吏 (`restoredSubjects: ['天吏']`, 37 heading 忌) và xóa 宜 theo 逐陣/月厭.
- Vậy phần còn mở thực chất là **phạm vi 閉日**.
- Riêng 2 heading 修倉庫 và 修宮室 còn token 「土王用事後」 khi gọi không có operand soil. Đây là chuyện của operand theo ngày (soil present ở 2027-08-07), không thuộc H2.

Lịch sử: owner từng đề xuất convention `德願 := 德合 + 天願`, với điều kiện cả hai cùng có mặt ở 未月戊午. Điều kiện không đạt vì 德合 vắng, nên đề xuất bị rút ([grade-resolution](p4-vol10-grade-resolution.md)). Câu hỏi lần này hẹp hơn: chỉ cần **天願 ∈ 德願**.

### Phương án

| | Quy tắc | Phạm vi 閉日 ngày 未月戊午 |
|---|---|---|
| **H2-A** | 天願 ∈ 德願 (bằng chứng 6). Câu 「亦不從德願所宜」 loại 天願 khỏi nhóm 德 của clause 閉日, nên áp 「不與德合赦願併如常例」 | 忌 theo danh sách 閉日 (như thường lệ); 宜 theo luật 月厭 đã mô hình |
| H2-B | 天願 ∈ 德願, nhưng 「不從德願所宜」 chỉ bỏ 宜 mà không đổi cân bằng | 閉日 vẫn 相抵 → `neither_recorded` cho heading trong danh sách 閉日 |
| H2-C | Giữ `undetermined` | Không đổi |

Ghi chú:
- puzhu:27 chỉ nói về 天吏/大時, nên **không** loại được H2-B cho phạm vi 閉日. H2-B vẫn là một cách đọc hợp lệ.
- **Đề xuất: H2-A.** Theo nghĩa chữ, 「不從德願所宜」 nghĩa là ngày này không được dựa vào 德願. Nhánh "có 德" của clause 閉日 chính là nhánh dựa vào 德願, nên không áp được. H2-A cũng khớp với cách 天吏 đã được xử lý cùng ngày.
- Cả hai bước của H2-A đều là cách đọc nội tại: 天願 thuộc 德願, và 「不從德願所宜」 bỏ nhánh 德. Nhãn mặc định đề xuất: `OWNER_ADOPTED_SOURCE_DEPENDENT`. Owner có thể nâng lên nếu thấy đủ căn cứ.

---

## Sau khi owner trả lời

- Golden task 3.2 áp quyết định, ghi `ownerDecision` kèm ngày.
- Dòng không còn hold đổi reason code sang clause tương ứng.
- Mọi dòng đổi trạng thái được liệt kê trước khi đóng băng. Với H1-B, danh sách gồm cả các dòng ngoài kho.
