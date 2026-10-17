# Full Golden P4 — lớp 忌 P4-B (task 3.2)

2026-10-17. Trạng thái: **DERIVED, chưa đóng băng**. Lock và commit-proof làm ở task 4.0.

Mỗi file Python kiểm bytes khi chạy mặc định; thêm `--write` để sinh lại. Chạy từ root repo bằng `python3 -I`. Mỗi stage nạp stage trước qua đường dẫn cố định.

Đầu ra là **fact theo từng scope**, chưa phải trạng thái ngày. Ghép ngày, 宜, H1-B, lan truyền và puzhu:06 là task 3.3.

## Stage

| Stage | File | Dòng | Nội dung | Oracle đã qua |
|---|---|---|---|---|
| 3.2a | [operands.py](operands.py) → `operands.tsv` | 720 | Trực, 13 đối tượng 卷十, nhóm 德 (天德/月德/天德合/月德合 từ quote 卷五; 天赦/天願/月恩/四相/時德 từ 3.1), override can-chi, deferral | Golden context-bridge v2 (13 ca), named-clauses (26 pillar). Số đếm trùng audit: 195 edge / 585 không edge / 59 context override / 29 德作建論 |
| 3.2b | [scopes.py](scopes.py) → `scopes.tsv` | 48.206 fact | Clause (13 đối tượng), nhóm 德 có tên sau override, 月破 仍忌, độ phủ deferral A05, scope 又為 (專忌 / convention) | Golden A03 (13), A04a v2 (10, có 2 ngoại lệ H2-A), 又為 v2 (5), tập expected của A05 |
| 3.2c | [context_ji.py](context_ji.py) → `context-ji.tsv` | 20.880 | 3.2b + 26 entry 卷十一 (gồm 21 thần dormant), 百忌日, 諸事皆忌 theo can-chi, puzhu:28, puzhu:27; thêm fact chặn 宜 (鋪註 07–10, 28-first) | remaining-ji v8 (51 ca scope + 10 ca ngày), puzhu-end (8 + ca 四廢) |
| 3.2d | [dated_ji.py](dated_ji.py) → `dated-ji.tsv` | 31.755 | Ngày âm (sóc USNO), 朔弦望, 土王用事後 theo ngày; trỏ về context | 58/58 ngày âm của lịch tham chiếu; Golden phase (13), soil (48 + 12 kỳ), ngày âm (9); 四立 khớp HKO |

Trạng thái fact:
- `only_ji`, `kept`: 忌 giữ, không được bảo vệ.
- `protected`, `stop`: 忌 giữ, được bảo vệ (`stop` là danh sách 止忌, tức 遇德猶忌).
- `lifted`: 忌 gỡ, 宜 theo evidence.
- `neither_recorded`, `no_annotation`: 不註.
- `not_avoided`: thuộc danh sách 止不忌.
- `undetermined`: deferral hụt (A05).
- `restored_as_usual`: puzhu:27.
- `pending`: token cần ngày; stage 3.2d giải.

## Quyết định owner đã áp

- **H2-A** (2026-10-17): 天願 ∈ 德願. Ngày 未月戊午, phạm vi 閉日/天吏 thành 如常例. Sau đó không còn phạm vi nào `undetermined` cả phạm vi.
- Golden A04a v2 đã khóa ghi `undetermined` cho ngày này. Golden đó **không bị sửa**; derive ghi 2 ngoại lệ có lý do trong `scopes-summary.json` (`goldenExceptions`).
- **H1-B** là quy tắc ghép ngày nên áp ở task 3.3, kèm danh sách dòng đổi theo alias trước khi đóng băng.

## Ngữ nghĩa lấy từ engine (rủi ro hiểu sai chung)

Mọi quy tắc được viết từ authority JSON và tài liệu audit trước, rồi kiểm bằng Golden đã khóa. Những lần đọc engine:

- `grep follow_yan|follow_jian` trong `shared/lunar/p4*.ts`: xác nhận effect `follow_yan`/`follow_jian` của override can-chi **không** được composer dùng làm scope. Golden giữ đúng như vậy (xem finding F2).
- Chẩn đoán task 2.1 (`resolveP4Headings` / `resolveP4FullDay` cho 卯丙戌, 卯戊戌, 酉丙辰, 未戊午). Chỉ dùng để soạn câu hỏi H1/H2, không dùng sinh expected.

Ngoài hai lần trên, không đọc file TS nào để quyết định ngữ nghĩa. Bốn chỗ ngữ nghĩa được chốt theo Golden đã khóa (hand-derived), không theo engine:
- `uncoveredByDeferral` là phần chênh thô, còn heading chỉ thành `undetermined` khi đích không cho `only_ji` (Golden 又為 子月壬午);
- puzhu:27 khôi phục cả khi scope đã là 如常例 (Golden puzhu-end 未丙午);
- danh sách 忌 của 月害/大時/天吏 đã ở dạng đọc (修置産室, 冠帶);
- ngoài miền 2025–2027 thì phase là `unknown`.

## Finding (chưa sửa, cần owner)

- **F1 — 巳日「出行」.**
  - Bằng chứng: 卷十一 ghi heading 行幸遣使 kèm chú 「出行同」 (`yi-sources-v1/vol11.raw.txt` offset 2850), và inventory 忌 của heading này có 「巳日」. Production PR #42 cũng map 巳日 vào `travel`.
  - Vấn đề: authority A04b (`day-composition-v2.json` → `baiji`) lại để 百忌 巳日「出行」 là unmapped. Golden hiện theo authority nên **không** ghi 忌 專忌 cho 行幸遣使 ngày 巳.
  - Phạm vi: 60 context và khoảng 91 ngày 2025–2027.
  - Phân loại đề xuất: `SPEC_BUG` của authority P4. Cần owner quyết trước khi đóng băng.
- **F2 — override 從厭/從建 không là scope 忌.**
  - `yin_error` 「餘俱從厭所忌」, `yang_error` 「餘皆從建所忌」 và 歲薄/逐陣 「從月厭所忌」 chỉ được authority dùng cho 德作建論 (và 28-first chặn 宜).
  - Golden giữ như vậy để đúng phạm vi đã nghiệm thu. Ghi lại để owner biết đây là giới hạn mô hình, không phải chứng nhận nguồn.
- **F3 — số đếm cũ không so được.** Số trạng thái heading trong `p4-vol10-heading-annotation.md` đo trước quyết định 又為 (v3) và trước PR #49 (月破). Vì vậy không dùng làm oracle. Oracle là các Golden fixture nêu ở bảng trên.

## Giới hạn

- Bảng presence (3.1) và danh sách 忌 lấy từ authority đã khóa, không suy lại từ văn gốc. Nếu authority đọc sai nguồn, Golden và engine sẽ sai giống nhau.
- Single agent; owner review ở task 8.0.
