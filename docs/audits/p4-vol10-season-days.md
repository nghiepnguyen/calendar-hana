# P4 — presence 王日 / 官日 / 相日 / 民日 / 守日 / 長生

Ngày 2026-10-11, nhánh `codex/p4-authority-lock`, PR #48.

## Nguồn và cách đọc

Raw 卷04 / 卷05 lưu trong `docs/audits/sources/p4-vol10/`. SHA-1 trùng prefix đã ghi trong `xieji-god-definitions.json`.

| Ngày | 春 夏 秋 冬 | Căn cứ |
|---|---|---|
| 王日 | 寅 巳 申 亥 | 卷05 歴例. Đời sau đổi chỗ với 官日 (「今易為官日」), nhưng 按 viết 「不如舊說為高」 nên giữ thuyết cũ |
| 官日 | 卯 午 酉 子 | 卷05 歴例, như trên |
| 相日 | 巳 申 亥 寅 | 卷05 歴例 |
| 民日 | 午 酉 子 卯 | 卷05 歴例; trùng bảng `dan_nhat` đã audit (kiểm 144 tổ hợp) |
| 守日 | 辰 未 戌 丑 | 卷05 又按: theo 邵泰衢 đổi 守/牢 (「易之…今從之」). 春酉… của 歴例 trở thành 牢日 |
| 長生 | 亥 寅 巳 申 | 卷十 「寅申巳亥月值收日為月令長生」, 「亥寅申皆令星之長生」; 卷04 「木之長生在亥…水生於申」. Tháng quý (土) để `unknown` vì nguồn cũng nói 「土與水同」 |

## Bằng chứng độc lập

Bất biến "nhãn đi kèm" của A03 nay kiểm thêm 6 nhãn này trên mọi ô và mọi ngày đối tượng xuất hiện: đều có mặt cùng ngày. Ba cách đọc khác bị bảng 等第 bác bỏ bằng mutation: 王/官 theo cách đổi của đời sau, 守日 không đổi, lệch mùa một tháng. Ví dụ 月害 卯酉月 「守日」 chỉ khớp khi 守日 = 辰/戌, còn 大時 寅巳月 「官日」 chỉ khớp khi 官日 = 卯/午.

## Tác động

- A03: chỉ còn nhãn 德大會 là chưa có nghĩa đã kiểm.
- A04b: 王日 có operand (artifact `p4-vol10-day-composition-v2.json`, v1 giữ nguyên). Quyết định 5 trường hợp trong 720 × 29 (`undetermined` 2.589 → 2.584). 11 thần 宜 còn lại vẫn chưa có operand.

## Kiểm chứng

Golden 12 ca đọc tay, commit `4f447f8` trước module. Gate P4 309 test; full unit 173 file/3261 test; typecheck/lint/build qua; bundle SHA-256 giữ nguyên. Mutation A04b chạy lại: 6/6.
