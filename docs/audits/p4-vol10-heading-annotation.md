# P4 — A04a: trạng thái heading trong phạm vi từng đối tượng

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48. Nối tiếp A03. Không đổi bytes/expected values của các lock trước.

## Phạm vi

A04 được tách đôi:

- **A04a (làm ở bước này):** với mỗi đối tượng 卷十 có mặt, sau deferral lấy danh sách của entry đích, tính trạng thái từng heading (74 heading).
- **A04b:** ghép các phạm vi trong một ngày, gồm các dòng lan truyền của 鋪註. Các dòng 11, 16–24 (ví dụ 「吉凶相抵不註忌嫁娶亦不註忌冠帶…」, có ngoại lệ 不將 / 亥日 / 專忌) luôn nối 忌 đến từ hai phạm vi khác nhau, nên chỉ làm được ở tầng ghép ngày. Ở bước này chúng mới khóa thành inventory có offset, chưa áp.

## Quy tắc (theo effect của clause đã resolve ở A03)

| Effect | Heading thuộc danh sách 忌 của phạm vi |
|---|---|
| 止忌…餘皆不忌 (`only_avoid`) | 忌 giữ đúng danh sách 止忌 (遇德猶忌, 鋪註 04). 宜 lấy từ evidence do caller truyền vào; chưa biết 宜 thì `undetermined` |
| 如常例 (`as_usual`) | `only_ji`: 從忌不從宜, 宜 bị bỏ qua trong phạm vi này |
| 猶忌…止不忌 (`still_avoid`) | `only_ji`, trừ danh sách 止不忌 (`not_avoided`) |
| 不註宜亦不註忌 (`cancel_both`, gồm 100 ca 相抵 của A03) | `neither_recorded`. Owner đã duyệt 相抵 → 不註 (鋪註 05) |
| 諸事皆忌 (`avoid_all`) | `only_ji` cho mọi heading, kể cả danh sách 止不忌 và heading không có trong danh sách |

Heading thuộc 止不忌 thì `not_avoided`. Heading không có trong danh sách nào thì `not_listed`: phạm vi này không nói gì, không phải trung tính. 猶忌 của đối tượng khác (月破, 天賊, 四廢…) là phạm vi được bảo vệ riêng, không gộp vào đây. 月建/月破 không có cột 等第 nhưng vẫn áp clause riêng của chúng, với cùng quy tắc nhóm 德 có tên.

## Chép thêm

Danh sách 忌 / 止忌 của 月害, 大時, 天吏 kèm offset. Có hai cách đọc editorial:

- 月害 「置産室」 → 修置産室: lời 按 cùng entry viết 「修置産室重於牧養故並忌之」.
- 大時 「冠{{SKchar|2917}}」 → 冠帶: danh sách giống hệt của 天吏 ghi 冠帶 ở cùng vị trí.

Có test kiểm danh sách tái tạo đúng từ quote, chỉ khác ở các cách đọc này.

## Phát hiện production (chưa sửa)

Clause 子午未申 của 月破: 「與月德天德合月德合併不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣不與德合併諸事皆忌」. Nhánh không gặp 德 là 諸事皆忌, nên khi gặp 德 thì vẫn 忌 mọi việc trừ danh sách được chừa. Câu 「仍忌」 nêu cả 解除 / 求醫療病 / 破屋壞垣 vốn không có trong danh sách 忌 gốc. Golden suy tay đã đọc như vậy, còn lần chạy đầu của resolver theo cách hiểu "danh sách gốc trừ phần chừa" nên đỏ; resolver đã sửa, Golden không đổi.

`xiejiVol10Resolution.ts` (production, 卷十 scoring ON) cũng dùng cách hiểu "danh sách gốc trừ phần chừa". Ví dụ 子月壬午 (破日, có 月德): production trả `not_listed` cho `medical` và `demolition`. Do đó chain 卷十 không đổi gì, và Trực Phá vẫn cộng +25 cho hai việc này, trái với 「仍忌」. Trong miền 720 context có 5 context như vậy (月破 `still_avoid` ở tháng 子午未申). Sửa production phải là quyết định riêng, có diff report; bước này không động vào production.

## Artifact / oracle

- `p4-vol10-heading-annotation.json` và Golden 10 ca suy tay: commit `d36e2aa` trước resolver. Golden qua mà không sửa.
- `shared/lunar/p4HeadingAnnotation.ts` + test (16 test). A03 được refactor để export `evaluateP4Clause` / `presentP4De`; output A03 giữ nguyên, Golden A03 vẫn qua.

## Đính chính sau A05

Bản đầu đọc 月煞/災煞 với danh sách rỗng (bỏ qua 忌同刼煞), và chưa xử lý heading hụt khi deferral. Đã sửa ở bước A05 (`p4-vol10-deferral-coverage.md`). Số liệu dưới đây là bản đã sửa (73 heading sau khi chuẩn hóa 劵→券).

## Kết quả 720 context (không có evidence 宜)

Trạng thái heading của các phạm vi resolve được: `only_ji` 30.042, `not_listed` 9.859, `undetermined` 6.061 (chưa biết 宜 trong phạm vi 止忌, hoặc heading hụt khi deferral), `not_avoided` 5.542, `neither_recorded` 5.290. Không có `only_yi` / `both_present` khi chưa có evidence 宜. 2 phạm vi `undetermined` cả phạm vi (德願, 未月戊午).

## Kiểm chứng

Gate P4 277 test; full unit 170 file/3229 test; typecheck/lint/build qua; bundle SHA-256 giữ nguyên `00c37f604701221d662aa3f4401f9419964bf921ef8451647b879a249ce7ac33`. Sáu mutation bị bắt: 相抵 giữ 忌, 如常例 nghe theo 宜, 月破 chỉ dùng danh sách gốc, bỏ qua danh sách 止忌, 諸事皆忌 chừa heading, 宜 chưa biết coi như không. Lần chạy đầu mutation cuối lọt; đã thêm ca suy tay (申月癸亥 平日 求醫療病) rồi chạy lại. A03 mutations chạy lại sau refactor: 6/6.

## Còn lại

- A04b: ghép các phạm vi trong ngày và lan truyền 鋪註 11, 16–24; nguồn evidence 宜 (卷十一 / 吉神 cần presence).
- A05: danh sách 忌 của đích có bao trùm đối tượng không (negative witness 月害/天吏).
- Presence 相日/王日/官日/守日/長生, nhãn 德大會; 德願 vẫn `undetermined`.

## Đồng bộ với production (PR #49)

Production sửa lỗi 月破 theo cách đọc sát chữ: danh sách gốc + 3 việc 「仍忌」 (解除 / 求醫療病 / 破屋壞垣), không phải "mọi heading trừ phần chừa". Audit A04a đổi theo, dùng chung `YUE_PO_STILL_AVOID`. Hệ quả cho A05: khi gặp 德, 災煞 → 月破 không còn bao trùm `苫蓋` (又為天火), nên heading này là `undetermined` (artifact `p4-vol10-deferral-coverage-v2.json`, v1 giữ nguyên). Golden A04a không đổi. Migration 1095 ngày của production: 11 ngày, chỉ medical/demolition, mỗi dòng −50, event không đổi.
