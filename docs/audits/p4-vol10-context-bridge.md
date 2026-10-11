# P4 — cầu nối presence → override can-chi → deferral có tên

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48. Nối tiếp named-clause lock v1. Không đổi bytes/expected values của các lock trước.

## Đã thực hiện

- **Presence 13 đối tượng của bảng 等第** (11 cột + 月建 + 月破), ba trạng thái `present / absent / unknown`, chỉ từ operand đã audit: Trực (月建/月破/平日/收日/閉日), `xiejiMonthlySha` (月厭/月刑/月煞/災煞), `getXiejiGodPresence` (月害/大時/天吏). Test đối chiếu chéo trên 144 tổ hợp: 月厭 ≡ `nguyet_yem`, 月刑 ≡ `nguyet_hinh`, 月破 ≡ 破日.
- **刼煞 = `unknown`**: chưa có quy tắc Month Jian đã audit; `kiep_sat` production lấy từ bảng sao Ngọc Hạp, không dùng làm operand P4. Edge tới 刼煞 (月害 巳亥, 收日 寅申巳亥) trả `undetermined`, không coi là vắng.
- **Override can-chi**: predicate là đúng tháng + can-chi mà câu nguồn liệt kê, không thêm điều kiện presence. Scope annotation mà override biến đổi vẫn do resolver cấp trên quyết định.
- **德作建論不作德論**: ghi rõ cho `both_errors`, `thin_year`, `pursuit`, `yang_error`, `yin_error`, mỗi nhóm kèm quote và offset. Chỉ ghi nhận rằng 德 không được tính là 德, chưa suy ra cấp.
- **Deferral bắc cầu**: chỉ đi theo edge có tên, chỉ từ đối tượng present. Mỗi bước cần đích cùng hiện diện. Giữ đủ path; báo `cycle`, `target_absent`, `undetermined` thay vì đoán. Nhiều đối tượng hội tụ về một đích thì gộp thành một terminal.

## Kết quả trên 720 context (12 Month Jian × 60 can-chi)

- 165 edge có tên đi tới đích cùng hiện diện; 525 đối tượng không có edge.
- 30 edge `undetermined` (đích 刼煞), nằm trong 20 context.
- 59 context khớp override can-chi, đúng bằng 59 cặp riêng của lock v1. 29 context có 德作建論.
- Bất biến kiểm trên toàn miền: mọi edge chỉ tới đích present hoặc unknown; terminal không còn edge đi tiếp trong tháng đó. Dữ liệu thật không có vòng; chuỗi đều dài một bước, nên đi nhiều bước và chống vòng được kiểm bằng đồ thị tổng hợp.
- Negative witness 辰月丁卯: 天吏 cùng hiện diện với 月害 nhưng 月害 không theo 天吏.

## Artifact / oracle

- `shared/almanac-data/p4-vol10-context-bridge.json`: nguồn presence của từng đối tượng, nhóm 德作建論 có quote.
- `shared/almanac-data/golden-p4-context-bridge.json`: 11 ca suy tay, commit `4099d88` **trước khi có module**. Test đỏ vì thiếu module, sau đó qua mà không sửa expected.
- `docs/audits/sources/p4-vol10/context-bridge-lock.json`: checksum, parent là named-clauses lock v1.
- `shared/lunar/p4ContextBridge.ts` và test (19 test): audit-only, chỉ test import.

## Kiểm chứng

Gate P4 3 file/236 test; full unit 168 file/3188 test; typecheck/lint/build qua. Bundle SHA-256 giữ nguyên `00c37f604701221d662aa3f4401f9419964bf921ef8451647b879a249ce7ac33`. Năm mutation (unknown → absent, đích vắng thành terminal, đi từ đối tượng unknown, chỉ một bước, bỏ 德作建論) đều bị bắt; file đã phục hồi (`p4-vol10-bridge-mutation-results.json`).

## v2 — presence 刼煞 theo 卷六 (A05)

- Câu nguồn: 卷06 「李鼎祚曰正月起亥逆行四孟」 (offset 2325), có lời 按 「按月刼煞義與嵗刼煞同」 (offset 2352), không bác bỏ. Theo Month Jian từ tháng 寅: 亥申巳寅 lặp lại.
- Raw 卷06 lưu ở `docs/audits/sources/p4-vol10/vol06.raw.txt`. SHA-1 `a9ab67896fc9098e6842036979e84fde4f8aae19` trùng prefix đã ghi trong `xieji-god-definitions.json`.
- Đối chiếu với 卷十: hai edge có tên 月害 巳亥 → 刼煞 và 收日 寅申巳亥 → 刼煞 đều rơi vào ngày 刼煞 có mặt theo quy tắc này. Bất biến kiểm trên đủ 720 context.
- `kiep_sat` production vẫn lấy từ bảng sao Ngọc Hạp, không đổi. Quy tắc này chỉ là operand của P4.
- Artifact và Golden v2 là file mới (`p4-vol10-context-bridge-v2.json`, `golden-p4-context-bridge-v2.json`), commit `67c442b` trước khi đổi code. v1 và lock v1 giữ nguyên bytes, test vẫn kiểm. Golden v2 suy tay lại 11 ca v1, đổi ca 巳月甲寅 từ undetermined sang named deferral, thêm 2 ca 刼煞.
- 720 context: 195 edge có tên tới đích có mặt, 585 đối tượng không có edge, **0 undetermined**, không còn đối tượng unknown.
- Gate P4 239 test; full unit 168 file/3191 test; typecheck/lint/build qua; bundle SHA giữ nguyên. Sáu mutation đều bị bắt: đích unknown thành vắng, đích vắng thành terminal, 刼煞 trở lại unknown, 刼煞 lệch một tháng, chỉ đi một bước, bỏ 德作建論. Mutation “đi từ đối tượng unknown” của v1 được bỏ vì v2 không còn đối tượng unknown; trường hợp đích unknown được kiểm bằng đồ thị tổng hợp.

## Còn lại trước scoring

- **A03**: chưa chọn ô 等第 theo predicate tháng + đồng hiện. Cần tiêu thụ `deAsJianRuleIds`/`ignoredVirtueGroups` và bare 遇德.
- **A04**: chưa có applicability theo từng heading.
- **A05**: path deferral và presence đích đã đủ. Chưa áp danh sách 忌 của đích vào scope của đối tượng.

Full Golden, P5, bridge 21 thần, penalty, flag và diff/rollback chưa làm. Không merge/deploy.
