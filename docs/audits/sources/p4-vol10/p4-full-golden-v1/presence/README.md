# Full Golden P4 — presence 35 thần (task 3.1)

2026-10-17. Trạng thái: **DERIVED, chưa đóng băng** (lock/commit-proof ở task 4.0). Generator [derive.py](derive.py), chỉ thư viện chuẩn:

- `python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/derive.py` kiểm bytes;
- thêm `--write` để sinh lại.

## Input (độc lập engine)

| File | Vai trò |
|---|---|
| `shared/almanac-data/xieji-god-definitions.json` | Quy tắc có trích dẫn 35 thần. Không đọc `xieji-god-tables.json` (bảng runtime) |
| `golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json` (SHA `1db7a155…`) | Month Jian từ exact Jie (termIndex lẻ), như `yi-expected-v1` |
| `shared/lunar/audit-fixtures/calendar-golden-v2.1.json` | Neo day pillar 1900-01-01 甲戌, kiểm 100 record |
| `good-gods.json`, `bad-gods.json` | Chỉ kiểm stable ID ↔ han |
| `golden-legacy-gods-month-jian.json` | Oracle tự kiểm 52 ca legacy (Release A) |

Không đọc TypeScript, resolver, evaluator hay TSV sweep. SHA-256 từng input ghi trong [summary.json](summary.json).

## Output

| File | Dòng | Nội dung |
|---|---|---|
| [context.tsv](context.tsv) | 720 | 12 Month Jian × 60 can-chi hợp lệ → ID dormant / legacy có mặt |
| [dated.tsv](dated.tsv) | 1.095 | 2025–2027. Month Jian theo quy ước **calendar-day**: ngày giao tiết mang Month Jian mới cả ngày, như `yi-dated-inputs-v1`. Cột `noon_*` chỉ điền ở 20 ngày Jie mà quy ước noon cho kết quả khác |
| [jie.tsv](jie.tsv) | 108 | 36 Jie thật × instant −1 / 0 / +1 ms; `added`/`removed` so với mốc trước |
| [structural.tsv](structural.tsv) | 424 | Mỗi thần dormant × 12 chuyển tháng: pillar đầu tiên bật (`on`) / tắt (`off`), hoặc `stable` khi thần không thể đổi (tháng NONE, cùng mùa). Tuple trừu tượng, không phải ngày thật |

## Self-check trong derive

- Định nghĩa đúng thứ tự spec §5 (21 dormant + 14 legacy).
- Bảng đủ 12 tháng, giá trị hợp lệ, không trùng lặp.
- Giá trị trong `excluded` không còn trong bảng (不將 六月戊午).
- Operand `NONE` cho cùng tập ở mọi tháng; operand `SEASON` cùng tập trong mỗi khối 3 tháng.
- Han trong catalog khớp. Alias (月虛, 地火, 招搖, 大敗, 咸池, 天獄) có trong ghi chú của đúng stable ID và không phải tên thần catalog khác.
- Mỗi Jie đổi Month Jian đúng tại offset 0.
- 52/52 ca Golden legacy khớp pillar, Month Jian và presence.
- 20 ngày Jie khớp từng dòng với `yi-dated-inputs-v1/jie-convention.json` (kiểm ngoài derive, xem commit).

## Độ phủ biên Jie

Trên 36 Jie thật, 4 thần theo can-chi/mùa (四廢 四忌 四窮 五墓) không đổi trạng thái tại giao tiết nào; 四忌 và 五墓 còn không có mặt ở mốc nào. 3 thần không phụ thuộc tháng (五合 五離 八專) đúng ra không bao giờ đổi. Vì vậy `structural.tsv` là witness bắt buộc: cả 21 thần đều có `on`/`off` hoặc `stable`.

## Giới hạn

- Bảng `table` trong definitions đã được trích bởi agent, quote kiểm bằng script (`xiejiGodDefinitions.test.ts`), single reviewer. Derive này **không** suy lại bảng từ văn 起例; nếu đọc nguồn sai thì cả Golden lẫn runtime cùng sai. Đối chiếu runtime ở task 6.0 chỉ bắt lệch giữa runtime và definitions.
- Theo quyết định owner: 五富 dùng 順行 (`alternative` 逆行 không dùng), 往亡 không gồm 氣往亡.
