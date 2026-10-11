# P4 — 「又為X」: phạm vi riêng theo nguồn (roadmap mục 3)

Ngày 2026-10-11. Owner chọn hướng B, rồi chọn "B theo nguồn" sau khi có bằng chứng bên dưới.

## Quyết định

| 又為 | Entry chính | Trạng thái | Căn cứ |
|---|---|---|---|
| 土府 | 月建 | Phạm vi riêng, **專忌** (được bảo vệ) | 「又為土府專忌…」 |
| 血支 | 閉日 | Phạm vi riêng, **專忌** | 「又為血支專忌針刺」 |
| 死神 | 平日 | **Thuộc danh sách gốc** | 平日 亥月 「…止忌軍事療病餘皆不忌」; 按 「平日又為死神…與德神併吉凶僅足相抵故忌則不宜宜則不忌」: 死神 được cân bằng cùng 平日 |
| 大耗, 地火, 月虛, 天火, 咸池 | 月破, 月厭, 月煞, 災煞, 大時 | Phạm vi riêng theo **convention** (owner), không bảo vệ | Nguồn không nói thêm |

「正月建日又忌出師」 không phải 「又為」, nên giữ trong danh sách gốc của 月建.

## Hành vi (audit-only)

- Phạm vi 又為 có mặt đúng khi đối tượng chính có mặt.
- Mỗi phạm vi là `only_ji` cho danh sách của nó. Clause hay deferral của đối tượng chính không gỡ và không chuyển nó đi.
- 專忌 được bảo vệ như 百忌日: còn hiệu lực qua 相抵 và lan truyền. Convention thì có thể bị một dòng lan truyền gỡ.
- Không phạm vi 又為 nào chặn 宜.
- Kết quả trả ở field `youweiScopes` của `resolveP4Headings`, tách khỏi `scopes` để Golden A04a đã khóa không đổi cấu trúc.

## Hệ quả

- **A05:** heading của 又為 rời khỏi danh sách gốc, nên tập heading hụt nhỏ lại. 月建 → 月刑 chỉ còn 伐木; 大時 → 月刑 hết hụt; 閉日 → 月煞 chỉ còn 療目; 災煞 → 月破 bao trùm đủ sau resolve. Artifact v3.
- **Golden A04a v2:** 取魚 rời phạm vi 大時 (sang 咸池). Chỉ đổi đúng expectation này; v1 giữ nguyên bytes.
- **Golden 又為 v2:** sửa lỗi suy tay ở v1 (`df4e1f9`): ngày 寅月丁丑, đích 月煞 cũng có mặt nên phạm vi 月虛 phải xuất hiện.
- **Ghép ngày (720 × 29):**
  - `undetermined` 2.585 → 2.607. Nguyên nhân: 忌 convention không được bảo vệ gặp 相抵 của phạm vi khác trên cùng heading, nguồn không phân xử.
  - Lan truyền bị chặn 27 → 36 lần.
  - Không còn heading activity nào bị hụt khi deferral. Nhánh sửa của review (không suy luận "忌 đã gỡ" cho heading hụt) vẫn giữ trong code; mutation tương ứng được bỏ vì không còn ca thật để kiểm.

## Kiểm chứng

Gate P4 321 test; full unit 175 file/3276 test; typecheck/lint/build qua; bundle trùng production `f29f5aab…`. Mutation thêm: 又為 bị giữ trong danh sách gốc, bỏ phạm vi 又為, bỏ 忌 của 又為 khi ghép ngày, 專忌 không được bảo vệ. Tất cả bị bắt; mutation cuối cần thêm ca tay 辰月壬辰 興造動土 mới bắt được.
