# Full Golden P4 v2 (roadmap 7)

Index: `shared/almanac-data/golden-p4-full-v2.json`. Gate: `shared/lunar/p4FullGoldenV2.test.ts`, chỉ kiểm hash. v1 (`b70913f`) vẫn đóng băng và giữ nguyên.

Trạng thái: **HASH_LOCKED_AFTER_V1_ENGINE_COMPARISON**. v2 đóng băng **sau** phép so engine của v1 (task 6.0), nên chỉ được khác v1 ở hai điểm dưới đây; mọi expected khác của v1 giữ nguyên.

## Thay đổi so với v1

1. **Quyết định owner (i), 2026-10-17 — 德作建論 áp cho mọi chỗ dùng 德.** Trên ngày 德作建論 / 不作德合論, 天德/月德/天德合/月德合 không còn được tính là 德 ở bất cứ đâu:
   - 宜 evidence;
   - trigger puzhu:06;
   - quy tắc D của 修倉庫;
   - điều kiện gỡ 忌 của remaining-ji (đã có từ v1);
   - nhóm 德 có tên của A03 (đã có từ v1).
   - Quy tắc D được cài lại trong `compose.py` và assert tái tạo đúng Golden P5 trên mọi dòng trước khi áp (i).
2. **Scope `undetermined` cả phạm vi** giờ làm các heading gốc của nó thành `undetermined` (spec §4); v1 bỏ qua scope đó lặng lẽ. Trên dữ liệu thật không có scope nào như vậy, nên không dòng nào đổi.

## Khác v1

| | Miền ngày | Context |
|---|---|---|
| Trạng thái / 忌 / bảo vệ đổi | **0** | **11** (4 context: 午丙午, 巳丙午, 未己巳, 未己未) |
| Chỉ 宜 evidence đổi | 6 dòng (4 修倉庫, 2 安葬; trạng thái không đổi vì 宜 đã bị chặn hoặc 忌 giữ) | — |
| 修倉庫 theo quy tắc D, true → false | 4 ngày | 9 (context × soil) |

Số liệu context đổi so với v1:
- Trạng thái: both_present 898 → 894, not_recorded 2.997 → 2.998, only_ji 7.488 → 7.486, only_yi 4.011 → 4.010, undetermined (E5) 4.431 → 4.437. 6 dòng 納畜/牧養/栽種 nay phụ thuộc 母倉 theo soil, vì bỏ 德合 khỏi 宜.
- `protectedJiHeld` 1.442 → 1.439.
- So engine: trùng 14.794 → 14.786, không so 4.658 → 4.664.

Miền ngày: mọi số đếm trạng thái không đổi.

Số liệu hiện hành lấy từ `compose/summary.json` và `compose/checks.json` của v2. Các README con (`presence/`, `ji/`, `compose/`) mô tả cách suy và số liệu của v1: cách suy vẫn áp dụng, trừ hai thay đổi trên; số liệu context trong đó là của v1.

`freeze.py` ghim `lock.json` của v1 và index v1 làm parent. `commit-proof.json` được ghi sau commit đóng băng.
