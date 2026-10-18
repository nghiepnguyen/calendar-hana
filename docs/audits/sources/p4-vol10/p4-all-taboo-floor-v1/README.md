# ALL_TABOO_FLOOR_V1 — tập acceptance (go-live review roadmap 9)

Policy sản phẩm owner chốt 2026-10-18 ([báo cáo review](../../../p4-migration-diff.md), nhóm 2 điểm 3, nhóm 3, nhóm 4.2). Một policy, không tạo rule trùng:

- Heading 諸事皆忌 (`all_taboo`), hoặc heading có 忌 đã ghi (`only_ji`/`both_present`) mà không còn dòng âm applied trong scope: tổng âm applied trong scope tối thiểu **−25**; phần thiếu bù bằng một dòng `product_policy_default_penalty`. Tối đa một dòng mỗi activity mỗi ngày. Chỉ làm nặng thêm.
- Chưa code. Thay PRD roadmap 8 §6.11; cần Golden điểm v2 trước code, adapter, mutation, chạy lại diff roadmap 9.

`acceptance.tsv` (161 dòng, sinh từ `p4-migration-diff-v1` + Golden v2 `compose/dated.tsv`):

| set | Dòng | Kỳ vọng sau policy |
|---|---|---|
| `group4_all_taboo` | 128 | Tổng âm applied ≥ 25; không dòng nào còn watch chỉ vì bỏ chain |
| `group3_both_present` | 25 | Có dòng −25 product policy; không còn recommended |
| `group3_event_moving_both_present` | 8 | Event `buy_property` tự điều chỉnh theo `moving`, không thêm rule event |

Cột `full_v1` = output trước policy (đối chứng), không phải expected.
