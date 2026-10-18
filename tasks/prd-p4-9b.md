# PRD — Roadmap 9b: policy sau go-live review (ALL_TABOO_FLOOR_V1, MULTI_HEADING_JI_WINS_V1, UI 忌 bị cap)

Ngày: 2026-10-18. Trạng thái: **DRAFT, chờ owner duyệt §6**. Chưa sửa runtime, chưa tạo Golden.

## 1. Bối cảnh

- Go-live review roadmap 9 xong (nhóm 1–7, [kết quả](../docs/audits/p4-migration-diff.md#kết-quả-review-theo-nhóm)). Owner đặt 3 điều kiện go-live: floor 諸事皆忌 / 忌 đã ghi, bảo toàn 忌 multi-heading, UI không che 忌 bị cap về 0.
- Thay đổi PRD roadmap 8 ([prd-p4-score-adapter.md](prd-p4-score-adapter.md)): §6.6 (multi-heading `not_recorded`) chỉ phía 忌; §6.11 (諸事皆忌 −25 chỉ khi không còn dòng âm) thành floor; −25 `only_ji` không âm mở rộng sang `both_present`.
- Acceptance owner: [p4-all-taboo-floor-v1](../docs/audits/sources/p4-vol10/p4-all-taboo-floor-v1/README.md) (187 dòng).
- Flag `xiejiVol10BalancingEnabled` vẫn `false`; baseline flag OFF v1 và rollback phải byte-equal suốt 9b.

## 2. Policy (đề xuất chốt)

**P1 — `ALL_TABOO_FLOOR_V1`**, sau resolution và sau cap, một dòng tối đa mỗi activity mỗi ngày:

| Trigger | Điều kiện | Dòng thêm |
|---|---|---|
| (i) 諸事皆忌 | activity `allTaboo` (heading quyết định `rule: all_taboo`) và tổng âm applied trong scope `n` < 25 | `−(25 − n)` |
| (ii) 忌 đã ghi, không dòng âm | state `only_ji` hoặc `both_present`, không còn dòng âm applied trong scope | `−25` |

- "Âm applied trong scope" = Trực + thần catalog, status `applied`, sau cap (`scoreDelta`); thần bị Trực bao (§6.13) không tính. 28 Tú / nguồn khác không tính.
- `only_ji`/`both_present` đã có dòng âm: giữ trọng số thật, không bù (owner nhóm 1 (a), nhóm 4.1).
- (ii) với `only_ji` = luật −25 hiện hành, không đổi số. (i) với `n = 0` = −25 hiện hành.
- Dòng bù tiêu cap âm thần −30 như dòng âm khác (§6.8); luôn vừa cap vì `n` < 25.

**P2 — `MULTI_HEADING_JI_WINS_V1`** (`p4ActivityState`):

| Heading của activity | State |
|---|---|
| có `undetermined` / thiếu | `baseline` (không đổi) |
| `not_recorded` + heading kia `only_ji` / `both_present` | state heading kia (bỏ qua `not_recorded`) |
| `not_recorded` + heading kia `only_yi` / `neither_recorded` | `baseline` (không đổi) |
| không `not_recorded` | chặt nhất §6.5 (không đổi) |

`allTaboo` xét trên heading quyết định sau khi bỏ `not_recorded`.

**P3 — UI 忌 bị cap về 0.** Dòng `applied`, `preCapDelta < 0`, `scoreDelta === 0` (chỉ có khi flag ON; flag OFF không đổi UI):
- View event (`mergeFactors`): không lọc bỏ; hiện trong "Bất lợi" kèm chú thích "kỵ vẫn áp dụng, đã đạt mức trừ tối đa".
- Chi tiết activity (`evidence`): nhãn kèm cùng chú thích.

## 3. Phạm vi đo trước code (engine full roadmap 9, 1095 ngày; khớp TSV đóng băng 35.040/35.040 điểm)

| Policy | Dòng đổi dự kiến | Chuyển status ước tính | Acceptance owner |
|---|---|---|---|
| P1 (i) | **280** (n = 15: 276 watch; n = 10: 4 consider) | watch → avoid phần lớn (−10) | `group4_all_taboo` 128: 76 trong trigger, 52 đã có n ≥ 25 (không đổi, vẫn thỏa ≥ 25) |
| P1 (ii) `both_present` | **462** (prot 295, không prot 167) | recommended → watch 339; neutral → watch 91; no_evidence → avoid 32 | `group3_both_present` 25: cả 25 trong trigger |
| P2 | **26** (`wedding`) | theo heading kia | `group5_multi_heading_ji` 26: cả 26 |

忌 của 462 dòng P1 (ii) đều ngoài catalog: 九空 102, 土符 101, 死氣 67, 遊禍 64, 五虛 58, 地囊 43, 九焦 21, 朔望日 20, 天賊 19, 天狗 8, 小耗 7, 每月十五日 5, 復日 2.

**8 event `buy_property` (`group3_event_moving_both_present`): sẽ KHÔNG đổi.** Trên cả 4 ngày, `moving` `both_present` đã có dòng âm applied −15 (n = 15) nên P1 (ii) không kích hoạt; P1 (i) không áp (không 諸事皆忌). Không thêm rule event (owner nhóm 3).

## 4. Golden điểm v2 (trước code)

- Thư mục mới `p4-score-golden-v2`; v1 giữ nguyên (sha-lock), test chuyển sang v2; ghi lý do supersede = đổi policy owner 2026-10-18.
- Ca v1 đổi expected: A21 (諸事皆忌 còn 四廢 −15 → thêm −10); ca `not_recorded` + `only_ji`/`both_present` nếu có (liệt kê khi soạn). Ca còn lại giữ expected v1.
- Lớp A thêm ca tổng hợp mỗi nhánh P1 (i)/(ii)/P2 + biên (n = 24/25, Trực âm tính vào n, thần bị Trực bao không tính, `undetermined` + `only_ji` giữ baseline, `not_recorded` + `only_yi` giữ baseline, `allTaboo` trên heading kia).
- Lớp C (mới): **toàn bộ dòng 1095 × 29 có heading**, điểm/status chính xác từ `golden.py` v2. Input: (a) catalog sản phẩm (sha-lock), (b) Golden v2 state/prot/rule, (c) **file presence theo ngày đóng băng trước code** (thần catalog có mặt mỗi ngày, role `frozen_engine_presence_input`; 21 thần dormant đối chiếu Golden v2 presence, còn lại là authority CLOSED đang chạy production). Acceptance 187 dòng và 405 dòng `only_yi` (regression) là tập con có kiểm riêng.
- Test đỏ commit trước adapter.

## 5. Bằng chứng go-live

1. Golden v2 lớp A + C xanh; acceptance theo bảng README (n ≥ 25 cho 諸事皆忌; 25 `both_present` có −25, không còn recommended; 26 `wedding` theo heading ghi 忌, 8 ngày 五離 và 2025-12-07 往亡 không còn `no_evidence`, 6 ngày 百忌亥 giữ hard warning).
2. Diff v2 so với full roadmap 9: mọi dòng đổi thuộc đúng tập trigger P1 (i)/(ii)/P2; dòng đổi ngoài tập = `UNEXPECTED_REGRESSION`. Luật mới `p4-migration-rules-v2` khóa trước dữ liệu (v1 giữ nguyên).
3. Test UI (flag ON mock): 2025-10-19 `meeting` (百忌酉 bị cap) và 2025-01-25 `warehouse` (土王用事 bị cap) hiện chú thích ở event view và chi tiết activity; flag OFF UI không đổi (visual snapshot qua).
4. Mutation: floor 25 → 24; floor tràn sang `only_ji` đã có âm (bắt bởi 4.1); bỏ trigger `both_present`; P2 áp khi heading kia `only_yi` (bắt bởi 243 dòng); `undetermined` như `not_recorded`; `allTaboo` không thấy khi heading kia `not_recorded`; UI lọc lại `appliedDelta !== 0`. Runner thêm vào `ci:p4`; mutation roadmap 8 (21) và 9 (14) chạy lại, sửa mutation phụ thuộc −25 cố định nếu cần (ghi lý do).
5. Baseline flag OFF v1 + rollback byte-equal; `ci:local` xanh; `ci:p4` tay một lần.

## 6. Cần owner duyệt

1. **P1 (ii) ở quy mô 462 dòng** (không chỉ 25 acceptance): 339 recommended → watch. Phương án: **(a)** áp cả 462 (nhất quán "忌 đã ghi phải thấy trên điểm") — đề xuất; (b) chỉ khi 忌 `prot` (295 dòng); (c) chỉ 25 dòng neutral/no_evidence → recommended (không có căn cứ phân biệt, không đề xuất).
2. **8 event `buy_property` không tự điều chỉnh** (§3): chấp nhận, ghi vào acceptance là "không đổi, có lý do"?
3. **Dòng bù P1 (i) biến thiên** (−10, −15…): giữ `policyId: product_policy_default_penalty`, nhãn "Điểm trừ mặc định của ứng dụng", `sourceClauseId` `p4:<heading>:all_taboo_floor_v1`? (Đề xuất: có.)
4. **Golden lớp C dùng file presence đóng băng từ engine** cho thần không dormant (§4)? Không dùng thì lớp C chỉ kiểm bất biến, không điểm chính xác. (Đề xuất: có.)
5. **Chú thích UI** "kỵ vẫn áp dụng, đã đạt mức trừ tối đa", chỉ khi flag ON? (Đề xuất: có.)

## 7. Non-goals

Bật flag (roadmap 10); dòng giải thích "kỵ đã được gỡ" và `meaning` 16 thần dormant (roadmap 10); siết `event_fit` (backlog owner); thêm 忌 ngoài catalog (遊禍, 九空…) vào catalog.
