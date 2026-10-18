# Golden điểm P4 adapter v2 (roadmap 9b)

Đóng băng **trước** code 9b. Thay [v1](../p4-score-golden-v1/README.md) (giữ nguyên, sha-lock) sau khi owner đổi policy 2026-10-18 ([PRD 9b](../../../../../tasks/prd-p4-9b.md) §2, §6). Tạo/kiểm: `python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v2/golden.py [--write]`. Gate: `shared/lunar/p4ScoreAdapter.test.ts`, `shared/lunar/p4ScoreAdapterAlmanac.test.ts`.

Policy mới:
- **ALL_TABOO_FLOOR_V1** — (i) 諸事皆忌: tổng âm applied trong scope (Trực + thần catalog, sau cap) ≥ 25, bù bằng một dòng `product_policy_default_penalty` `sourceClauseId: p4:<heading>:all_taboo_floor_v1`; (ii) `only_ji`/`both_present` không còn dòng âm applied → −25 (roadmap 8 chỉ `only_ji`).
- **MULTI_HEADING_JI_WINS_V1** — heading `not_recorded` nhường heading `only_ji`/`both_present`; `only_yi`/`neither_recorded` + `not_recorded` và mọi `undetermined` giữ baseline.

Lớp:
- **A — `cases.json`**: 35 ca tính điểm + 7 ca baseline. A01–A25 giữ input v1; chỉ **A21** đổi expected (諸事皆忌 còn 四廢 −15 → thêm −10). Mới: A26–A28 (floor: Trực tính vào, 30, đúng 25), A29 (`only_ji` −15 giữ trọng số thật), A30–A32 (`both_present` −25 / Trực chặn / protected chặn), A33–A35 (P2, P2 + floor), B06–B07 (P2 giữ baseline).
- **B — `activity-states.tsv`**: trạng thái activity 1095 ngày × 29 activity + 3 ngày ngoài miền (31.842 dòng); khác v1 đúng 26 dòng `wedding` (P2).
- **C — `activity-scores.tsv`** (mới): điểm/status/hard warning chính xác cho mọi P4 ngày × 32 activity (35.040 dòng). Dòng có state P4: `score()` của file này; dòng baseline: baseline flag OFF v1 đóng băng. Cột `policy_rows` liệt kê dòng product policy.

Input: catalog sản phẩm, Golden v2 (`compose/dated.tsv` state/prot/rule, `presence/dated.tsv` 21 thần dormant + 14 legacy), baseline flag OFF v1, và **`presence-input.tsv`** — thần catalog có mặt mỗi ngày như engine truyền vào điểm (flag OFF), sinh bởi `p4ScoreGoldenV2Presence.test.ts` trước code 9b (owner §6.4, role `frozen_engine_presence_input`). `golden.py` kiểm phần legacy 14 khớp Golden v2 và không chứa thần dormant.

**Đối chiếu khi soạn** (không thuộc lock, ghi để review): đặt `POLICY_9B = False`, lớp C tái tạo cấu hình full roadmap 9 ([p4-migration-diff-v1](../p4-migration-diff-v1/README.md)) **35.040/35.040** dòng (điểm + status). Với policy 9b: **760 dòng đổi**, cả 760 thuộc tập trigger (P1 (i) 280, P1 (ii) 462, P2 18/26), 0 dòng ngoài.

Acceptance owner ([p4-all-taboo-floor-v1](../p4-all-taboo-floor-v1/README.md)): `group4_all_taboo` 128 → đều `avoid` (âm ≥ 25); `group3_both_present` 25 → đều `watch`; `group5_multi_heading_ji` 26 → 8 ngày 五離 và 2025-12-07 往亡 hết `no_evidence` (watch 35–45), 6 ngày 百忌亥 giữ `consider` + hard warning, 2 ngày 月建 không đổi (35 watch), 3 ngày 五離 + 滿日 → 20 avoid. **Lưu ý:** 6 ngày `wedding` 結婚姻 `both_present` (滿日, yi 五合 + 時德) **tăng điểm** 35 → 55 (status vẫn `watch`): rời baseline (bỏ chain, thêm cát thần dormant). P2 không chỉ làm nặng thêm điểm số; status không tốt lên ở dòng nào.

Giới hạn: Golden và adapter cùng tác giả (single agent); `presence-input.tsv` lấy từ engine (thần không dormant là authority CLOSED đang chạy production).
