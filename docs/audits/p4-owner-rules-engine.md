# Roadmap 7b — engine audit-only cài luật owner

2026-10-17, nhánh `claude/p4-golden-review`. Audit-only: runtime, điểm, manifest và flag không đổi; không file engine nào bị sửa. [PRD](../../tasks/prd-p4-owner-rules-engine.md), [tasks](../../tasks/tasks-p4-owner-rules-engine.md).

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| Khớp Golden v2 (`c574e57`), miền ngày | **31.755 / 31.755** dòng (`state`, `ji`, `protected`) |
| Khớp Golden v2, context | **20.880 / 20.880**, gồm cả các dòng E5 `undetermined` |
| Golden-first | Test đỏ commit `aef0a1e` trước code. Stub là phép ghép engine hiện tại, lệch Golden đúng 248 dòng đã chứng minh nguyên nhân (harness test) |
| Mutation | Lượt đối chứng sạch; **11/11 bị bắt**; 1 mutation tương đương trên dữ liệu thật, ghi rõ |
| `ci:local` | EXIT 0 trong khoảng 166 giây; tập con của test mới chạy khoảng 10 giây |
| `ci:p4` (chạy tay) | Thêm phép so toàn miền (`P4_OWNER_RULES_FULL=1`, khoảng 5,5 phút) và runner mutation (khoảng 3 phút) |

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

**Bị bắt (11):** H1-B/F5, E3, H2-A, F1, E1, (i) ở 宜, (i) ở quy tắc D, (i) ở remaining-ji, phân tầng A04b, puzhu:28, E5.

**Tương đương trên dữ liệu thật (1):** (i) ở trigger puzhu:06.
- Đã đảo luật rồi chạy toàn miền Golden v2: không dòng nào đổi.
- Lý do: trong 2025–2027 không có ngày 德作建論 nào có heading puzhu:06 mang 忌 không được bảo vệ mà trigger duy nhất là một thần 德合.

## Giới hạn

- Luật ghép được viết bởi cùng tác giả với Golden (single agent). Lớp fact của engine thì độc lập: trước khi có luật owner, nó đã khớp 31.507/31.755 dòng.
- Đã đọc lại code engine của puzhu:06, ghép ngày và remaining-ji (các lượt đọc đã ghi trong review Golden).
- Không có sweep TSV riêng: phép so toàn miền với Golden v2, với 0 lệch, đóng vai trò sweep.
