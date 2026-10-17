# Full Golden P4 — câu hỏi owner cho các dòng hold (task 2.1)

2026-10-17, nhánh `claude/p4-full-golden`. Audit-only.

Nguồn: `docs/audits/sources/p4-vol10/vol10.raw.txt`, SHA-1 `355dc6c8fe2d…`; offset tính theo code point Python. Mọi câu trích đã kiểm là chuỗi con đúng tại offset.

Số dòng bị ảnh hưởng lấy từ sweep engine `docs/audits/p4-vol10-yi-operands-2025-2027.tsv`. Số này chỉ để đo phạm vi, không phải bằng chứng. Golden task 3.2 sẽ đếm lại độc lập.

Trong lúc chờ owner trả lời, Golden ghi các dòng này là `undetermined` kèm reason code `OWNER_QUESTION_H1` / `OWNER_QUESTION_H2` (PRD FR-04). Không bật gì cho đến khi có quyết định.

## Tóm tắt

| Câu | Nội dung | Dòng ảnh hưởng (2025–2027) | Đề xuất |
|---|---|---|---|
| H1 | 忌 của phạm vi 又為月虛 gặp 相抵 của 月煞 trên cùng heading | 11 ngày 開倉庫出貨財, cùng 修倉庫 các ngày đó (trong 16 dòng 修倉庫 P5 F3), và mọi context 卯/酉 月煞 | H1-B |
| H2 | 天願 có thuộc 「德願」 không; ngày 未月戊午 (逐陣) | Cả 29 heading ngày 2027-08-07 và context 未-戊午. Gồm 5 dòng hold puzhu:06 và 2 phạm vi 德願 / 未月戊午 `undetermined` cả phạm vi | H2-A |

Bộ câu hỏi này gộp 德願 vào H2. Ngoài 未月戊午, context thật duy nhất có liên quan là 巳月丙午. Ở đó 德願 không tác động (grade-resolution: 大時, clause vô điều kiện).

---

## H1 — 月煞 tháng 卯/酉 (相抵) và 又為月虛

### Bằng chứng

1. Entry 月煞, offset 12187: 「又為月虛忌修倉庫開倉庫出貨財」.
2. Offset 12204: 「夘酉月值六合與月德天願併止忌安撫邊境選將訓兵出師求醫療病餘皆不忌不與德願併凡所忌者則不註宜所宜者亦不註忌」. Tháng 卯/酉 mà không có 月德/天願 thì 月煞 là **相抵**, theo nghĩa không ghi 宜 cũng không ghi 忌.
3. 月煞 「忌同刼煞」. Danh sách 忌 của 刼煞 (offset 11115) **đã có sẵn** cả 修倉庫 lẫn 開倉庫出貨財.
   - Tức là 又為月虛 lặp lại hai heading đã nằm trong danh sách chính.
   - So sánh: 災煞 「又為天火忌苫葢」 (offset 11889) thêm 苫葢, một việc **không** có trong danh sách 刼煞.
4. 鋪註 puzhu:22, offset 22443: 「凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌」.
5. Quyết định owner 2026-10-11 ([youwei-scopes](p4-vol10-youwei-scopes.md)): 月虛 là phạm vi riêng theo **convention**, không được bảo vệ. Phạm vi convention có thể bị lan truyền gỡ.

### Trạng thái hiện tại

- Phạm vi 月煞 cho các heading kho là `neither_recorded`; phạm vi 月虛 là `only_ji`.
- Engine không có quy tắc ghép hai trạng thái này, nên ra `undetermined` ([youwei-scopes](p4-vol10-youwei-scopes.md): "忌 convention không được bảo vệ gặp 相抵 của phạm vi khác trên cùng heading, nguồn không phân xử").
- Lan truyền bỏ qua heading đang `undetermined`, nên puzhu:22 chưa bao giờ được xét.
- Trên 11 ngày (丙戌, 戊戌, 庚戌 tháng 卯; 壬辰, 丙辰 tháng 酉), 開市 và 立券交易 đều `neither_recorded`, và không ngày nào là 甲日.

Ngày ảnh hưởng: 2025-03-18, 2025-03-30, 2025-09-20, 2026-03-13, 2026-03-25, 2026-09-15, 2027-03-08, 2027-03-20, 2027-04-01, 2027-09-10, 2027-10-04. Các ngày 甲辰 đã `only_ji` vì 甲日 專忌, nên không thuộc câu hỏi này.

### Phương án

| | Quy tắc | 開倉庫出貨財 | 修倉庫 |
|---|---|---|---|
| **H1-A** | 月虛 giữ 忌 qua 相抵 của 月煞, rồi puzhu:22 gỡ (月虛 không phải 專忌) | `neither_recorded` | `only_ji` (không có câu lan truyền) |
| **H1-B** (đề xuất) | Như H1-A về 忌 sống sót. Đây là quy tắc chung: 忌 của phạm vi convention thắng 相抵 của phạm vi khác trên cùng heading; lan truyền xét sau | `neither_recorded` | `only_ji` |
| H1-C | 月虛 theo cân bằng của 月煞 (又為 = cùng ngày, cùng cấp) | `neither_recorded` | `neither_recorded` |
| H1-D | Giữ `undetermined` SOURCE_DEPENDENT | `undetermined` | `undetermined` |

Lý do đề xuất H1-B:
- Nếu 月虛 chỉ đi theo 月煞 (H1-C) thì câu 又為 thừa, vì hai heading đã nằm trong danh sách 刼煞.
- Câu 鋪註 puzhu:22 nói rõ cách xử lý 開倉庫 trên ngày 相抵, với ngoại lệ duy nhất là 專忌.

Khác nhau giữa H1-A và H1-B:
- H1-A chỉ áp cho 月虛.
- H1-B áp cho mọi cặp "phạm vi convention 忌 + phạm vi khác 相抵": 大耗, 地火, 天火, 咸池, 月虛.
- H1-B sẽ đổi thêm các dòng ngoài kho. Task 3.2 sẽ đếm và báo trước khi đóng băng.

Rủi ro: cả H1-A và H1-B đều là **cách đọc**, không có câu nguồn nói thẳng. Nhãn đề xuất: `OWNER_ADOPTED_SOURCE_DEPENDENT`.

---

## H2 — 天願 ∈ 德願; ngày 未月戊午

### Bằng chứng

1. 未月戊午 là 閉日 và 天吏. Trong nhóm 德, chỉ có **天願**; không có thần 德合 nào. 四相 cũng có mặt nhưng không thuộc nhóm.
2. Entry 閉日, offset 10890: 「辰戌丑未月值官日天吏與天德月德天德合月德合天赦天願併凡所忌者則不註宜所宜者亦不註忌不與德合赦願併如常例」.
3. Entry 天吏, offset 16268: 「辰戌丑未月值閉日與德合赦願併凡所忌者則不註宜所宜者亦不註忌不與德合赦願併如常例」.
4. Câu nói thẳng về ngày này, offset 14397 (bàn về 月厭/逐陣): 「…六月丙午戊午十二月壬子戊子為逐陣皆從月厭所忌四月丙午六月戊午亦不從德願所宜」.
5. 鋪註:
   - offset 22604: 「凡天吏大時不以死敗論者遇四廢嵗薄逐陣仍以死敗論」 (puzhu:27, đã mô hình);
   - offset 22630: 「凡嵗薄逐陣日所宜事照月厭所忌刪所忌仍從本日」.
6. Nghĩa của 「德願」 trong cùng quyển:
   - 月煞 tháng 卯/酉 (offset 12204) viết 「與**月德天願**併…不與**德願**併」;
   - 月刑 tháng 巳 (offset 12899) viết 「與月德天德合**天願**併…不與**德願**併」.

   Cả hai chỗ, 「願」 trong 德願 là 天願.

### Trạng thái hiện tại

- Theo A03 ([grade-resolution](p4-vol10-grade-resolution.md)), thành viên của 德願 "không được nguồn nêu rõ". Khi có thần thuộc nhóm đang có mặt, engine ra `undetermined` (`suppressedBy: ['no_de_yuan']`).
- Owner từng đề xuất convention `德願 := 德合 + 天願`, với điều kiện cả hai cùng có mặt ở 未月戊午. Điều kiện không đạt vì 德合 vắng, nên quyết định đã rút.
- Câu hỏi lần này hẹp hơn: chỉ cần **天願 ∈ 德願**. Không cần biết 德合 có thuộc nhóm hay không.

### Phương án

| | Quy tắc | Kết quả 未月戊午 |
|---|---|---|
| **H2-A** (đề xuất) | 天願 ∈ 德願 (bằng chứng 6). 「亦不從德願所宜」 loại 天願 khỏi nhóm 德 của clause 閉日/天吏, nên áp 「不與德合赦願併如常例」: 忌 theo danh sách gốc. puzhu:27 (仍以死敗論) cho cùng kết luận. 宜 xử lý theo 「所宜事照月厭所忌刪」 (đã mô hình ở puzhu 28-first) | Giải được 29 heading: 忌 theo danh sách 閉日/天吏/月厭; 宜 theo luật 月厭 |
| H2-B | 天願 ∈ 德願, nhưng 「不從德願所宜」 chỉ bỏ 宜 của 天願 mà không đổi cân bằng: 閉日/天吏 vẫn 相抵 | `neither_recorded` trong phạm vi 閉日/天吏 |
| H2-C | Giữ `undetermined` | Không đổi |

Lý do đề xuất H2-A:
- Theo nghĩa chữ, 「不從德願所宜」 nghĩa là ngày này không được dùng 德願 để hưởng 宜. Nhánh "có 德" của clause là nhánh hưởng 宜 đó, nên không áp được.
- puzhu:27 độc lập dẫn tới cùng kết luận cho 天吏.

H2-B mâu thuẫn với puzhu:27, vì câu này buộc 天吏 「仍以死敗論」, tức như thường lệ chứ không 相抵.

Nhãn đề xuất: H2-A là `SOURCE_REVIEWED`, vì có câu nguồn trực tiếp cho ngày này. Riêng thành viên 天願 là cách đọc nội tại từ hai câu trong cùng quyển, single reviewer.

---

## Cần owner trả lời

1. **H1:** A / B / C / D.
2. **H2:** A / B / C.

Sau khi có trả lời:
- Golden task 3.2 áp quyết định và ghi `ownerDecision` kèm ngày.
- Các dòng không còn hold đổi reason code sang clause tương ứng.
- Mọi dòng đổi trạng thái được liệt kê trong báo cáo trước khi đóng băng.
