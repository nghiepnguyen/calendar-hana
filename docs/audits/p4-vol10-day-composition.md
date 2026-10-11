# P4 — A04b: ghép các phạm vi trong một ngày

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48. Nối tiếp A04a. Không đổi bytes/expected values của các lock trước.

## Mô hình

Với 29 heading 卷十一 có ánh xạ activity, mỗi ngày được ghép từ các phạm vi đã mô hình: 13 đối tượng 卷十 (A04a), mệnh đề 諸事皆忌 theo can-chi và 百忌日. Các 凶 khác của 卷十一 (四廢, 五墓, 往亡…) chưa mô hình; danh sách 忌 thô còn lại được trả trong `unmodeledJi` để biết kết quả ngày mới là một phần.

- **Bằng chứng 宜:** danh sách 宜 của 卷十一, tách theo bộ từ vựng của artifact (test buộc tách khớp đủ 28 danh sách). 12 thần chưa có operand đã audit (母倉, 福德, 天恩, 王日, 天巫, 天后, 天醫, 除神, 驛馬, 天馬, 吉期, 鳴吠) cho `undetermined`. 修倉庫 để dành cho P5.
- **百忌日 (卷十 offset 21515):** phạm vi 專忌 được bảo vệ. 巳日 「出行」 không phải heading nên để unmapped.
- **鋪註 07–10:** chặn 宜 của heading liên quan. Ví dụ 丁日: 剃頭 giữ 忌 (百忌), 整容 mất 宜, nên heading ghép 整容剃頭 = `only_ji`.
- **Quy tắc ghép:**
  - 忌 được ghi nếu có phạm vi nào giữ 忌, hoặc heading là 百忌 của ngày.
  - 宜 bị chặn nếu có phạm vi 從忌不從宜 / 不註 liệt kê heading đó, hoặc một dòng 07–10 áp dụng.
  - `neither_recorded` chỉ khi có 相抵 và không còn 忌 được bảo vệ (鋪註 05).
  - `not_recorded` khi không ghi gì mà không có câu 不註.
  - Mọi phạm vi còn `undetermined` giữ ngày ở `undetermined`.
  - Phạm vi 止忌 báo `undetermined` khi 宜 đã biết là false thì chỉ có thể là 忌 đã gỡ, nên suy ra `not_avoided`.
- **Lan truyền 鋪註 11, 16–24:** một lượt, kích hoạt khi heading nguồn là `neither_recorded`. Gỡ 忌 chưa được bảo vệ của heading đích; 百忌 / 止忌 / 諸事皆忌 theo can-chi chặn lại. Hai cách đọc ghi rõ: dòng 20 「修造動土」 → 興造動土; dòng 22 cần cả 開市 lẫn 立券交易. Dòng 24 (啟攢) chưa có activity nên chỉ ghi inventory.
- **Sửa A04a:** 卷十 viết 立劵交易, còn 卷十一 / activity map viết 立券交易. A04a để lệch khóa nên contract/transaction luôn ra `not_listed`. Đã chuẩn hóa `劵→券`, Golden A04a không đổi. Các heading của artifact được đưa về dạng chuẩn của `splitHeadings` khi nạp (ví dụ 壞→壊).

## Kết quả 720 context × 29 heading

`only_ji` 7.247, `only_yi` 5.970, `not_recorded` 3.305, `undetermined` 2.863, `neither_recorded` 1.209, `both_present` 286. Lan truyền chưa lần nào được áp (0), bị chặn 24 lần vì 忌 được bảo vệ. Với 13 đối tượng đã mô hình, heading đích luôn cùng phạm vi 相抵 với heading nguồn; lan truyền chỉ có tác dụng khi mô hình thêm các 凶 khác. Logic lan truyền được kiểm bằng ca tổng hợp: gỡ đúng, chặn đúng, không lan tiếp, `requireAll`.

## Artifact / oracle

- `p4-vol10-day-composition.json` và Golden 7 ngày suy tay: commit `3d03947` trước composer. Golden qua mà không sửa.
- `shared/lunar/p4DayComposition.ts` + test (13 test).

## Kiểm chứng

Gate P4 290 test; full unit 171 file/3242 test; typecheck/lint/build qua; bundle SHA-256 giữ nguyên. Sáu mutation bị bắt: 百忌 không được bảo vệ, 相抵 thắng 忌 được bảo vệ, bỏ qua dòng 07–10, 宜 chưa biết coi như không, tắt suy luận 忌 đã gỡ, lan truyền bỏ qua bảo vệ. Lần đầu mutation 宜-chưa-biết lọt; đã thêm ca suy tay (午月庚寅 掃舍宇) rồi chạy lại. A04a mutation chạy lại sau khi chuẩn hóa: 6/6.

## Còn lại

Mô hình các 凶 khác của 卷十一 và 21 thần dormant; operand cho 12 thần 宜 chưa audit (王日 thuộc việc presence sắp tới); P5 修倉庫; score/event chưa nối.
