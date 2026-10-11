# P4 — A05: danh sách 忌 của đích deferral có bao trùm đối tượng

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48.

## Nguyên tắc nguồn

「…其凶皆重於月害故從重論」 và 「天吏之凶亦重於月害而不從天吏論者天吏不能該月害之所忌故也」: một deferral 從重 hợp lệ vì 忌 của đích chứa 忌 của đối tượng. Đây cũng là lý do 月害 không theo 天吏.

## Đo trên 16 edge có tên (danh sách gốc = 忌 + 又為X theo tháng, có 忌同刼煞)

- **12 edge bao trùm đủ:** `jian_yan`, `hai_sha`, `hai_jie`, `hai_xing`, `hai_ping`, `xing_yan`, `li_ping`, `li_xing`, `ping_xing`, `ping_sha`, `shou_jie`, `shou_xing`.
- **Hụt ở danh sách gốc:**
  - 月建 → 月刑 (辰酉亥): 伐木 (danh sách 月建), 平治道塗 (又為土府). Cả hai thuộc 止不忌 của 月刑.
  - 大時 → 月刑 (卯): 取魚, 乘船渡水 (又為咸池).
  - 閉日 → 月煞 (寅申巳亥): 療目 (「求醫療目」), 針刺 (又為血支). 月煞 dùng danh sách của 刼煞 (忌同刼煞), không có hai heading này.
  - 災煞 → 月破 (子午卯酉): 解除, 求醫療病, 破屋壊垣, 苫蓋. **Ở tầng resolve thì được bao trùm:** clause 子午 của 月破 「仍忌解除求醫療病破屋壞垣」 thêm đúng phần 災煞 kỵ mà 月破 thiếu, còn 卯酉 là 諸事皆忌. Điều này củng cố cách đọc của A04a và phát hiện lỗi production về 月破.
- **Negative witness 月害 → 天吏 (辰戌):** hụt 慶賜賞賀, 宴會, 經絡, 醞釀, 破土, 安葬, 啓攢, đúng với 「不能該」.

## Quy tắc áp dụng

Dưới deferral, heading có trong danh sách của đối tượng nhưng không có trong danh sách của đích thì là `undetermined` trong phạm vi đối tượng, trừ khi resolution của đích đã cho `only_ji`. Phạm vi ghi `uncoveredByDeferral`. Không lặng lẽ bỏ, cũng không lặng lẽ giữ 忌.

**Câu hỏi mở:** các danh sách 「又為X」 (土府, 咸池, 血支, 天火…) có phải phạm vi riêng, tồn tại qua mọi deferral/gỡ kỵ hay không, nguồn không nói. Hiện chúng được tính vào danh sách gốc.

**Provenance:** bảng bao trùm là phép đo cơ học. Expected được chốt sau khi đo và đối chiếu tay từng heading với câu nguồn của danh sách, không viết trước như các oracle khác. Ba ca ngữ cảnh trong test (寅月丁丑 / 乙丑, 辰月壬辰, 子月壬午 / 甲午) được suy tay.

## Lỗi A04a phát hiện khi làm A05

月煞 và 災煞 ghi 「忌同刼煞」. Artifact production dùng `avoidSameAs`, resolver production có xử lý, nhưng A04a đọc thẳng `avoid` rỗng. Mọi phạm vi có chủ clause là 月煞/災煞 mà không phải 諸事皆忌 đều thành `not_listed`. Đã sửa và thêm ca suy tay 辰月丁未 (平日 → 月煞). Golden A03 / A04a / A04b không chạm tới nên không đổi.

## Kiểm chứng

Gate P4 295 test; full unit 172 file/3247 test; typecheck/lint/build qua; bundle SHA-256 giữ nguyên. Bốn mutation A05 bị bắt: bỏ qua heading hụt, ghi đè cả 忌 của đích, bỏ 忌同刼煞, so danh sách với chính nó. Mutation A03 / A04a / A04b chạy lại: đều 6/6.
