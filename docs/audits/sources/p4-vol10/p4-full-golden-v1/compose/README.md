# Full Golden P4 — trạng thái ngày (task 3.3)

2026-10-17. Trạng thái: **DERIVED, chưa đóng băng**. Lock và commit-proof làm ở task 4.0.

[compose.py](compose.py) kiểm bytes khi chạy mặc định; thêm `--write` để sinh lại. Chạy từ root repo:

```
python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/compose.py
```

## Output

| File | Dòng | Nội dung |
|---|---|---|
| [dated.tsv](dated.tsv) | 31.755 | 1.095 ngày × 29 heading: 宜 evidence, 宜 được ghi, 忌, bảo vệ, trạng thái, lý do, puzhu:06, lan truyền |
| [context.tsv](context.tsv) | 20.880 | 720 context × 29 heading, cùng các cột |
| [h1b-changes.tsv](h1b-changes.tsv) | 153 | Mọi dòng do quy tắc H1-B/F5 quyết định: nguồn 忌 không bảo vệ, scope 相抵, trạng thái cuối, lan truyền |
| [summary.json](summary.json) | — | Số đếm, kết quả đối chiếu oracle |

## Thứ tự ghép

1. **宜 evidence** (卷十一, quy tắc ANY):
   - 德/赦/願/月恩/四相/時德 và thần dormant/legacy lấy từ 3.1/3.2a;
   - Trực lấy từ 3.2a; 王日 lấy từ `p4-vol10-season-days.json`;
   - 11 thần P4-C lấy từ Golden `yi-domains-v1` đã khóa. 母倉 dùng bảng điều kiện (tháng, can-chi, soil) để thống nhất quy ước calendar-day;
   - 修倉庫 lấy từ Golden P5 (quyết định D).
2. **Chặn 宜**: 鋪註 07–10, 28-first, puzhu:27, 不註 (相抵 / 「不忌亦不註宜」), và scope 從忌不從宜 giữ 忌.
3. **Trạng thái trước lan truyền**, theo thứ tự ưu tiên:
   - puzhu:28 (諸事不忌);
   - 諸事皆忌 (theo can-chi hoặc 四廢+月破);
   - undetermined (scope chưa xác định, deferral hụt, defer không phủ);
   - **H1-B/F5**: 忌 không bảo vệ gặp 相抵 → 忌 giữ, 宜 không ghi;
   - 相抵 không còn 忌 → `neither_recorded`;
   - còn lại theo 忌 và 宜.
4. **puzhu:06** (authority `p4b-puzhu06-v3`): phân lớp nguồn 忌 rồi lift / keep / hold.
5. **Lan truyền** (鋪註 11, 16–24): một lượt, tính từ trạng thái trước lan truyền. Gỡ 忌 không bảo vệ của heading đích; nếu heading còn 相抵 thì kết quả là `neither_recorded` (cùng quy tắc với `stateAfterLift` của puzhu:06 v3).

**Miền context.** Các operand chỉ có theo ngày đều chưa biết: soil (dùng chung cho 母倉 và 土王用事後), ngày âm 12/15/khác, có hay không phase. Mỗi context được tính đủ 12 tổ hợp. Heading chỉ xác định khi cả 12 tổ hợp cho cùng một dòng; nếu không thì ra `undetermined` với lý do `context:date-operand-dependent`.

## Số liệu

| | dated | context |
|---|---|---|
| only_ji | 14.495 | 7.488 |
| only_yi | 7.534 | 4.011 |
| not_recorded | 5.880 | 2.997 |
| neither_recorded | 2.125 | 1.055 |
| both_present | 1.720 | 898 |
| undetermined | **1** (2025-10-08 修倉庫, P5 SOURCE_DEPENDENT) | 4.431 (phụ thuộc operand theo ngày) |
| H1-B/F5 | 95 | 58 |
| puzhu:06 lift / keep / hold | 68 / 650 / 6 | 46 / 465 / 4 |
| lan truyền gỡ / chặn | 57 / 181 | 33 / 70 |

- puzhu:06 lift 68 dòng, trùng sweep đã nghiệm thu. 6 dòng hold là nhóm 月煞 卯/酉 + 月虛: authority v3 xếp 又為 có cha 相抵 vào lớp UNDETERMINED. Sau đó puzhu:22 gỡ các dòng này thành `neither_recorded`.
- 57 dòng lan truyền gỡ đều là dòng H1-B: 忌 sống sót rồi bị câu lan truyền gỡ, đúng thứ tự của quy tắc owner.

## Đối chiếu oracle đã khóa (tự kiểm trong derive)

| Oracle | Kết quả |
|---|---|
| Golden puzhu:06 v3 `dated.tsv` (5 heading × 1.095) | 5.444 trùng; 26 lệch do H1-B/F5, 5 do H2-A |
| Golden puzhu:06 v3 `context.tsv` (5 × 720) | 3.470 trùng; 101 lệch do chính sách operand theo ngày (納財, 母倉); 24 do H1-B/F5, 5 do H2-A |
| Golden ghép ngày A04b v1 (7 ca, 32 heading) | 30 trùng; 卯甲申 整容剃頭 do chính sách ngày âm; 寅丁未 嫁娶 do scope sau này (八專 protected) |

Derive assert: mọi lệch đều có phân loại, không có dòng nào chưa giải thích.

## Đính chính gửi owner (H1)

File câu hỏi H1 viết rằng 修倉庫 thành `only_ji` "vì không có câu lan truyền". Câu đó **sai**: puzhu:20 (「…亦不註忌修宮室…修倉庫…」) có 修倉庫 trong danh sách đích.
- Trên các ngày 月煞 卯/酉, 興造動土 và 豎柱上梁 đều 相抵, nên 修倉庫 cũng thành `neither_recorded`.
- Quyết định H1-B không đổi; chỉ hệ quả ghi trong file câu hỏi bị sai.
- Ngoại lệ: 2 ngày 地火 (栽種, 2025-11-16 và 2026-11-11) vẫn `only_ji`.

## Quyết định owner sau 3.3 (2026-10-17)

- **E1 — theo nguồn:** 復日/重日 「則不忌亦不註宜」 thành `neither_recorded`. 67 dòng theo ngày (đều là 安葬) có kết quả phụ thuộc cách đọc này. Lệch engine dự kiến được ghi là ENGINE_BUG.
- **E3 — `neither_recorded`:** khi lan truyền gỡ 忌 mà heading còn 相抵 của scope khác. Áp cho 57 dòng theo ngày và 33 dòng context; tất cả đều là dòng H1-B.
- **E5 — quy ước bất biến cho miền context:** 4.431 dòng context là `undetermined`. Miền theo ngày vẫn là oracle chính.
- **E2/E4:** mỗi loại chỉ ảnh hưởng 1 dòng theo ngày, chính là 2025-10-08 修倉庫 (P5 SOURCE_DEPENDENT). Không cần quyết định.
- **Đối chiếu số H1-B:** trước đây báo khoảng 75 dòng context, nay là 58. Chênh 17 dòng là các dòng nay `undetermined` theo E5. Theo ngày có 95 dòng: 27 convention, 68 canonical. Chi tiết ở [h1b-changes.tsv](h1b-changes.tsv).

## Điểm lệch dự kiến so với engine (phân loại ở task 6.0)

| # | Golden | Engine | Căn cứ |
|---|---|---|---|
| E1 | 復日/重日 gặp 德赦六合 → `neither_recorded` (chặn 宜) | chỉ gỡ 忌, vẫn ghi 宜 | Nguồn 「則不忌亦不註宜」; Golden v8 "not 忌, not 宜" |
| E2 | Danh sách 止忌 giữ 忌 cả khi 宜 chưa biết | A04a ra `undetermined` | 遇德猶忌: 忌 không phụ thuộc 宜 |
| E3 | Lan truyền gỡ 忌 mà heading còn 相抵 → `neither_recorded` | `only_yi` / `not_recorded` | Như `stateAfterLift` của puzhu:06 v3 (puzhu:05) |
| E4 | Có 忌 và 宜 chưa biết → `undetermined` | ghép ngày ra `only_ji` | 宜 chưa biết khi nó còn quyết định trạng thái |
| E5 | Miền context: bất biến trên operand theo ngày | provider context riêng | Quy tắc nêu ở trên |
| E6 | F1, H1-B/F5, H2-A | chưa áp | Quyết định owner 2026-10-17 |

**F6 (puzhu:27 và lan truyền):** không dòng thật nào được puzhu:27 khôi phục mà bị lan truyền gỡ hay chặn. Không cần quy tắc riêng.

## Ngữ nghĩa lấy từ engine

Đã đọc thêm hai file, đều ghi log:
- [p4FullDayComposition.ts:133-199](../../../../../../shared/lunar/p4FullDayComposition.ts): thứ tự puzhu:28 > 諸事皆忌 > unresolved; puzhu:27 chặn 宜.
- [p4Puzhu06.ts:43-124](../../../../../../shared/lunar/p4Puzhu06.ts): lớp nguồn; trigger là presence thô.

Thêm `applyP4Propagation` ([p4DayComposition.ts:116-150](../../../../../../shared/lunar/p4DayComposition.ts)): `from` nhiều heading không có `requireAll` thì hiểu là ANY.

Các điểm Golden chọn khác engine được liệt kê ở bảng E1–E6, không chép theo engine.
