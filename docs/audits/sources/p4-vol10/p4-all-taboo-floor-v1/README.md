# ALL_TABOO_FLOOR_V1 — tập acceptance (go-live review roadmap 9)

Policy sản phẩm owner chốt 2026-10-18 ([báo cáo review](../../../p4-migration-diff.md), nhóm 2 điểm 3, nhóm 3, nhóm 4.2). Một policy, không tạo rule trùng:

- Hai trigger: (i) activity 諸事皆忌 → tổng âm applied trong scope tối thiểu **−25**, phần thiếu bù bằng một dòng `product_policy_default_penalty`; (ii) `only_ji`/`both_present` không còn dòng âm applied trong scope → một −25. `only_ji`/`both_present` đã có dòng âm giữ trọng số thật (nhóm 1 (a), 4.1). Tối đa một dòng mỗi activity mỗi ngày. Chỉ làm nặng thêm.
- **Cùng vòng code — `MULTI_HEADING_JI_WINS_V1`** (nhóm 5 (c)): activity hai heading, một heading `not_recorded`, heading kia `only_ji`/`both_present` → áp state heading kia (sửa PRD roadmap 8 §6.6 chỉ phía 忌); heading kia `only_yi` → giữ baseline; `undetermined` → giữ baseline.
- Chưa code. Thay PRD roadmap 8 §6.11; cần Golden điểm v2 trước code, adapter, mutation, chạy lại diff roadmap 9.

`acceptance.tsv` (187 dòng, sinh từ `p4-migration-diff-v1` + Golden v2 `compose/dated.tsv`):

| set | Dòng | Kỳ vọng sau policy |
|---|---|---|
| `group4_all_taboo` | 128 | Tổng âm applied ≥ 25; không dòng nào còn watch chỉ vì bỏ chain |
| `group3_both_present` | 25 | Có dòng −25 product policy; không còn recommended |
| `group3_event_moving_both_present` | 8 | **Không đổi, có lý do** (owner 2026-10-18, PRD 9b §3/§6.2): `moving` `both_present` đã có âm applied −15 nên P1 (ii) không kích hoạt; không thêm rule event |
| `group5_multi_heading_ji` | 26 | `wedding` theo heading ghi 忌: 8 ngày 五離 và 2025-12-07 往亡 không còn `no_evidence`; 6 ngày 百忌亥 giữ hard warning |

Cột `full_v1` = output trước policy (đối chứng), không phải expected.
