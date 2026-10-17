# Roadmap 7b — engine audit-only cài luật owner

2026-10-17, nhánh `claude/p4-golden-review`. Audit-only: runtime, điểm, manifest và flag không đổi; không file engine nào bị sửa. [PRD](../../tasks/prd-p4-owner-rules-engine.md), [tasks](../../tasks/tasks-p4-owner-rules-engine.md).

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| Khớp Golden v2 (`c574e57`), miền ngày | **31.755 / 31.755** dòng (`state`, `ji`, `protected`) |
| Khớp Golden v2, context | **20.880 / 20.880**, gồm cả các dòng E5 `undetermined` |
| Trace | Primary, nguồn 忌 và nguồn bảo vệ khớp cột `code` của Golden trên toàn miền ngày và mọi dòng context bất biến. Alias 招搖 ghi theo entry 厭對, như Golden |
| Golden-first | Test đỏ commit `aef0a1e` trước code. Stub là phép ghép engine hiện tại, lệch Golden đúng 248 dòng đã chứng minh nguyên nhân (harness test) |
| Mutation | Lượt đối chứng sạch; **12/12 bị bắt** |
| `ci:local` | EXIT 0 trong khoảng 166 giây; tập con của test mới chạy khoảng 10 giây |
| `ci:p4` (chạy tay) | Thêm phép so toàn miền (`P4_OWNER_RULES_FULL=1`, khoảng 5,5 phút) và runner mutation (khoảng 3 phút). Đã chạy đủ chuỗi tại `dedd8f4`: **EXIT 0 trong khoảng 39 phút** (P4-B, P4-C, P5 12/12, puzhu:06 16/16, Golden v2 có lượt đối chứng sạch, owner-rules toàn miền 3/3, mutation 11/11) |

## Thiết kế

Module [p4OwnerRules.ts](../../shared/lunar/p4OwnerRules.ts) có hai entry:
- `resolveP4OwnerRulesDay(month, pillar, operands)` cho ngày có đủ operand theo ngày;
- `resolveP4OwnerRulesContext(month, pillar)` cho context.

Module **ghép từ các lớp fact của engine**, không bọc output ngày đã ghép. Lý do: output ngày đã ghép gộp sẵn các dòng H1-B và dòng phân tầng A04b thành `undetermined`, nên không còn phân biệt được.

- **Nguồn fact (đều là engine):**
  - `resolveP4Headings` với 宜 cố định true (`both_present` = 止忌 giữ, `only_yi` = gỡ);
  - `resolveP4RemainingJi`, `resolveP4YiDay` (trace 宜, ngày âm/phase/soil, puzhu:27/28), `resolveP4WarehouseDay` (presence quy tắc D);
  - `decideP4Puzhu06` (lớp của authority v3).
- **Luật owner cài trong layer:**
  - **H2-A:** gọi lại `evaluateP4Clause` đã export, với nhóm 德 bỏ 天願; chỉ chấp nhận kết quả 如常例 (đúng ca thật 未月戊午), trường hợp khác báo lỗi.
  - **(i):** bỏ 4 thần 德合 khỏi trace 宜, khỏi quy tắc D, khỏi trigger puzhu:06, và khỏi điều kiện gỡ 忌 của remaining-ji. Phần remaining-ji chạy lại phép chọn điều kiện; bản chạy lại khi **không** bỏ 德 phải trùng output engine (assert lúc chạy).
  - **F1, E1, H1-B/F5, E3**, sửa phân tầng A04b (gom đủ 忌 được bảo vệ của mọi tầng trước khi phán), scope `undetermined` chỉ theo heading của nó, và **E5** (12 tổ hợp: 4 ngày thật soil × phase cùng ngày âm 12/15/khác, vì engine bắt mọi operand theo ngày phải từ cùng một ngày).
- **Vì sao không thêm hook vào engine:** `p4GradeResolution.ts`, `p4HeadingAnnotation.ts` và `p4RemainingJi.ts` đều nằm trong lock đóng băng của P4-C (`yi-freeze-v1`, 677 file). Bản đầu thêm hook opt-in đã phá lock này, bị `ci:local` bắt, và đã được hoàn tác.

## Mutation ([runner](../../scripts/audit-p4-owner-rules-mutations.py), [kết quả](p4-owner-rules-mutation-results.json))

**Bị bắt (12/12):** H1-B/F5, E3, H2-A, F1, E1, (i) ở 宜, (i) ở quy tắc D, (i) ở remaining-ji, (i) ở trigger puzhu:06 (bắt bằng unit test của hàm thuần), phân tầng A04b, puzhu:28, E5.

## Lệch so với PRD (owner duyệt hướng xử lý 2026-10-17)

- **FR-03 / task 3.1, không hook vào engine:** ba file cần hook nằm trong lock P4-C, nên H2-A và (i) cho remaining-ji được cài trong layer.
  - Giảm rủi ro: test toàn miền kiểm phần chạy lại remaining-ji (khi không bỏ 德) trùng engine trên **đủ 720 context**, không chỉ ngày 德作建論.
  - Đưa logic vào engine (cần lock P4-C mới) là việc của mục 10.
- **FR-04, không có sweep TSV:** thay bằng phép so toàn miền với Golden v2 (0 lệch, gồm trace) cộng [summary.json](p4-owner-rules-summary.json), được kiểm bytes. Nội dung: số dòng theo trạng thái, số trace đã so, và số dòng mà (i) làm đổi trigger.
- **FR-05, mutation:**
  - Luật (i) cho trigger puzhu:06 được tách thành hàm thuần `p4Puzhu06Triggers` và có unit test riêng, nên runner đạt **12/12**.
  - Nguyên nhân đã đếm trực tiếp: (i) làm đổi tập trigger trên **10 dòng ngày** (bỏ hết trigger) và **9 dòng context** (4 bỏ hết, 5 bớt).
  - Trên toàn miền, việc đảo luật này không đổi trạng thái dòng nào. Lý do: ở các dòng đó, puzhu:06 với trigger 德合 vẫn cho keep/hold.

## Giới hạn

- Luật ghép được viết bởi cùng tác giả với Golden (single agent). Lớp fact của engine thì độc lập: trước khi có luật owner, nó đã khớp 31.507/31.755 dòng.
- Đã đọc lại code engine của puzhu:06, ghép ngày và remaining-ji (các lượt đọc đã ghi trong review Golden).
- Không có sweep TSV riêng: phép so toàn miền với Golden v2, với 0 lệch, đóng vai trò sweep.
