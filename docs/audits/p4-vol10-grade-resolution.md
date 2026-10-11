# P4 — A03: ô 等第 và nhóm 德 có tên

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48. Nối tiếp context bridge v2. Không đổi bytes/expected values của các lock trước.

## Kết luận nguồn

- **Ô bảng chọn theo (đối tượng, Month Jian).** Mỗi cột 等第 chia 12 Month Jian vào đúng một ô, không trùng, không sót. Mọi ô không trống đều được dùng. Danh sách sao trong ô mô tả những gì tất yếu đi cùng đối tượng trong tháng đó. Kiểm trên đủ 11 cột × 60 ngày: mọi sao đi kèm có operand đã audit (Trực, 月刑/月煞/災煞/月厭/月害/大時/天吏/刼煞, 六合/時德/民日) đều có mặt ở mọi ngày đối tượng xuất hiện trong tháng. 相日/王日/官日/守日/長生/德大會 chưa có operand nên chưa kiểm.
- **Bare 遇德 không phải boolean chung.** Mỗi entry tự nêu theo từng tháng nhóm thần được tính. Ví dụ 平日 申月 = 天德/月德合; 收日 子午月 = 月德合, 酉月 = 月德; 月厭 子午月 = 天赦 (德作建論). Khi đối tượng theo deferral, dùng clause của entry đích.
- **Ô bảng ↔ clause khớp ở mọi tổ hợp.** Kiểm 11 cột × 12 tháng, hai nhánh có/không 德, theo đủ chuỗi deferral:
  - 從宜不從忌 ↔ 止忌…餘皆不忌.
  - 從忌不從宜 ↔ 如常例, hoặc 猶忌 của 月破.
  - 諸事皆忌 ↔ 諸事皆忌.
  - 從宜亦從忌 ↔ 凡所忌者則不註宜所宜者亦不註忌. Chỉ xuất hiện ở hai nhánh bảng tự gọi là 相抵 (上次 không 德, 次 có 德), và 鋪註 có câu 「凡吉凶相抵不註宜亦不註忌」. Ghi thành lớp `xiangdi`, chưa gộp; chốt annotation cuối là việc của A04.
  - Không có `conflict` nào. Đối tượng nguồn và đích deferral luôn cùng cấp.
- **月建/月破 không có cột** (「除建破等日條例簡易…外餘分為六等」): trả `no_grid_column`.
- **Override can-chi:**
  - 德作建論 (`yang_error`, `yin_error`, `thin_year`, `pursuit`, `both_errors`) và nhóm 德合 bị loại bỏ bốn thần 德合 khỏi nhóm. 天赦/天願/月恩/四相 vẫn được tính.
  - Thành viên của 德願 không được nguồn nêu rõ. Nếu có thần trong nhóm đang có mặt thì trả `undetermined`: ca thật 未月戊午, 閉日 và 天吏 đều nêu 天願.
  - 諸事皆忌 theo ngày được báo cạnh cấp, không gộp vào.

## Đọc lại / đính chính

- **Ô 月厭 下:** bản chép ghi 「子月：月建、德大會、月刑 / 午月：月建、德大會」. Hai scan đều cho thấy 月刑 là token cuối, nằm thấp, sau phần ghi của cột con 午月. Ngày 月厭 tháng 子 không bao giờ trùng 月刑, tháng 午 thì luôn trùng (午自刑), và cột 月刑 下 ghi 「午月：德大會、月厭」. Đọc lại thành 「子月：月建、德大會 / 午月：月建、德大會、月刑」. Cấp không đổi vì 子 và 午 cùng ô 下. File authority đã khóa giữ nguyên; correction nằm trong artifact v2, có test buộc khớp nguyên văn ô và không chuyển token sang ô khác. Phát hiện nhờ bất biến sao đi kèm.
- **`kiep_sat`:** ghi chú trong bridge v1/v2 viết production chỉ lấy 刼煞 từ bảng Ngọc Hạp. Sai: `catHungAuthority` (Phase 4D, Month Jian) đã khóa 亥申巳寅…, trùng quy tắc 卷06. Test đối chiếu 12 tháng. Giá trị không đổi.

## Artifact / oracle

- `p4-vol10-grade-resolution.json` (v1) và Golden 13 ca suy tay: commit `4f4cea7` trước resolver. Golden qua mà không sửa.
- `p4-vol10-grade-resolution-v2.json`: thêm `still_avoid` ↔ 從忌不從宜 (月破 「與月德天德合月德合併不忌祭祀覃恩肆赦等事仍忌…」) và correction ô 月厭 下. Cả hai được tìm ra khi chạy bất biến trên toàn bảng sau freeze, nên tạo version mới; v1 giữ nguyên bytes.
- Chép thêm clause 月害/大時/天吏 kèm offset. Các entry khác dùng clause của artifact production 卷十 đã khóa.
- `shared/lunar/p4GradeResolution.ts` + test (21 test): audit-only, chỉ test import.

## Kết quả 720 context

558 đối tượng-ngày `agree`, 100 `xiangdi`, 120 `no_grid_column` (月建/月破), 2 `undetermined` (một context, 德願), 0 `conflict`. Có 17 trường hợp override loại thần khỏi nhóm 德. 32 context có 諸事皆忌 theo ngày.

## Kiểm chứng

Gate P4 260 test; full unit 169 file/3212 test; typecheck/lint/build qua; bundle SHA-256 giữ nguyên `00c37f604701221d662aa3f4401f9419964bf921ef8451647b879a249ce7ac33`. Sáu mutation bị bắt: 德 dùng boolean chung, bỏ 德作建論, 德願 coi như vắng, đảo nhánh 德, dùng clause của chính đối tượng thay vì đích, gộp 相抵 vào agree. Lần chạy đầu, mutation 德願 lọt; đã thêm ca suy tay 未月戊午 rồi chạy lại.

## Quyết định 德願 (owner, 2026-10-11)

Owner đề xuất chốt có điều kiện `deyuan := dehe + tianyuan` thành convention có tên (`resolved_by_convention`, nguồn chỉ ngầm định). Điều kiện: 德合 và 天願 cùng có mặt ở 未月戊午, và cần đúng cặp này mới tái tạo được annotation nguồn. Nếu không thì rút quyết định, giữ `undetermined`.

Kiểm presence:

- **未月戊午:** không thần 德合 nào (天德/月德 甲, 天德合/月德合 己); 天願 và 四相 có mặt.
- **巳月丙午:** có 天德合, không có 天願. Đối tượng duy nhất là 大時 với clause vô điều kiện, nên 德願 không tác động.

Điều kiện không đạt, nên **không áp convention; 未月戊午 giữ `undetermined`**. Thêm nữa, vì 德合 vắng ở cả hai context, phần 德合 của expansion không thể kiểm bằng mutation trên dữ liệu thật. Test `keeps 德願 undetermined` khóa bằng chứng này; nếu test đó đỏ thì phải xét lại quyết định, không cập nhật expected. Không tạo artifact v3 vì không có thay đổi dữ liệu.

## Còn lại

- A03: thành viên 德願 vẫn `undetermined` (convention có điều kiện không đạt, xem trên); cần bằng chứng nội tại khác; operand 相日/王日/官日/守日/長生 để kiểm nốt sao đi kèm; ý nghĩa nhãn 德大會.
- A04: annotation cuối theo heading, gồm quyết định `xiangdi` → `neither_recorded` theo 鋪註.
- A05: áp danh sách 忌 của đích vào scope.
- Full Golden, P5, 21 thần, penalty, flag, diff/rollback. Không merge/deploy.
