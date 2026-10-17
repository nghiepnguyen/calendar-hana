# PRD — Roadmap 8: adapter điểm sau flag `xiejiVol10BalancingEnabled` = OFF

Ngày: 2026-10-17. Trạng thái: **owner trả lời §6 (2026-10-17); chờ duyệt PRD**. Chưa sửa runtime.

## 1. Bối cảnh

- Lớp resolution khớp Golden v2 đã có: `resolveP4OwnerRulesDay` / `resolveP4OwnerRulesContext` (roadmap 7b, PR #68, audit-only).
- Spec: [p4-xieji-vol10-balancing.md](../docs/plans/p4-xieji-vol10-balancing.md) §4.1 (thứ tự), §4.2 (adapter), §5 (21 thần, một flag), §8 bước 5, §9 (điều kiện owner).
- Roadmap 8 = đưa kết quả resolution vào điểm, **sau flag OFF**. Bật flag là roadmap 10; migration diff là roadmap 9.

## 2. Đã làm trước PRD (nhánh `claude/p4-adapter`)

| Việc | Commit | Kết quả |
|---|---|---|
| Luật lock owner 2026-10-17 | `bae57f3` | File runtime/catalog bị lock ghim được kiểm tại commit sớm nhất có lock (`shared/lunar/lockAnchor.ts`); áp cho P4-C `yi-freeze-v1`, `yi-sources-v1`, `yi-baseline-v1`, full Golden v1/v2. File Golden vẫn kiểm trên working tree |
| Dò lock | — | Sửa 16 file runtime TS (`activityRecommendations`, `xiejiVol10Scoring`, `evidence`, `eventEvaluation`, `almanac`…), 6 JSON sản phẩm (`activities`, `truc`, `good-gods`, `bad-gods`, `overrides`, `event-mapping`) và thêm key thật `xiejiVol10BalancingEnabled` vào manifest: **8060 test qua**. Chỉ authority P4 đóng băng (`shared/almanac-data/p4-*.json`…) vỡ khi sửa — adapter không được sửa chúng |
| Baseline flag OFF | `1609264` | [p4-adapter-baseline-v1](../docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/lock.json): 32 activity × 1098 ngày (1095 + 2024-12-31, 2028-01-01, 2035-06-15) và 11 event × {không giờ, 9h}, sha256 toàn output (event bỏ version stamp). Runtime bằng `f00dd5c`. Tạo lại trùng ở 3 TZ; mutation −25→−24 bị bắt. Chạy trong `npm test` (~22 s) |

## 3. Inventory fact

**Heading ↔ activity** (`xiejibianfangshu-yiji.json#activityEntries`, đọc qua `XIEJI_HEADINGS`):
- 29 heading phủ 29/32 activity bật. Không heading: `grave_repair`, `door_opening`, `waterworks` → adapter không đụng.
- Activity nhiều heading: `wedding` (結婚姻, 嫁娶), `construction` (營建宮室, 興造動土), `livestock` (牧養, 納畜).
- Heading nhiều activity: 立券交易 → contract + transaction; 興造動土 → groundbreaking + construction; 開市 → opening + business.

**Pipeline hiện tại** (`getActivityRecommendations`, `activityRecommendations.ts:94`):
1. Dòng Trực (`truc`, weight theo activity).
2. Dòng thần cát/hung: cap theo dataset (good +25, bad −30) **trừ ngay trong vòng lặp** (`used`); thần bị Trực bao (`subsumesGods`) thành informational; `preserve_bad` override → `hardWarning`.
3. 28 Tú: luôn informational.
4. `applyVol10Scoring` (flag `xiejiVol10Scoring` = true): 6 chain (月建/月破/平日/收日/閉日/刼煞) đổi dấu / informational / thêm −25 (`ADDED_PENALTY`); phần thêm của chain thần tự tính cap còn lại.
5. Điểm = clamp(50 + dương − âm); status theo ngưỡng; `hardWarningKeepsWorseScoreStatus`.

**Hệ quả quan trọng nhất (điểm ảnh hưởng lớn):** cap đang được tiêu **trước** 卷十. Spec "resolution trước cap" nghĩa là dòng bị gỡ không còn ăn cap, nên dòng khác có thể lọt vào cap → đổi điểm cả ở ngày không có thần dormant. Phải phân rã ở roadmap 9.

**Resolution (Golden v2, 31.755 dòng ngày):** only_ji 14.495; only_yi 7.534; not_recorded 5.880; neither_recorded 2.125; both_present 1.720; undetermined 1.

**21 thần dormant:** cả 21 có trong catalog (`good-gods.json` 7, `bad-gods.json` 14) với tier và `activityIds`; presence đã audit; hiện không vào sao/điểm.

**Baseline output:** 35.136 dòng activity; no_evidence 12.493, recommended 7.627, watch 6.957, avoid 3.820, neutral 2.655, consider 825, strong_avoid 759.

## 4. Goals

1. Thêm `manifest.policies.xiejiVol10BalancingEnabled: false` và đường code mới chỉ chạy khi flag ON.
2. Flag OFF: output **byte-equal** baseline v1 (activity + event, 1098 ngày). Bằng chứng: test baseline xanh, không sửa file baseline.
3. Flag ON (chỉ trong test): adapter áp §4.2 theo trạng thái heading từ `resolveP4OwnerRulesDay`, resolution trước cap, penalty −25 product policy, contract evidence mới.
4. Ngoài 2025–2027 (không có operand P4): flag ON cũng phải bằng baseline.
5. Production không throw: lỗi resolution → `undetermined` → giữ dòng baseline.

## 5. Functional requirements (bản nháp, chốt sau §6)

- **FR-01 Golden-first.** Golden điểm (Python, độc lập engine TS) cho một tập ngày/activity có chủ đích (mỗi trạng thái × mỗi loại nguồn × cap đầy/chưa đầy × multi-heading × penalty −25 × protected), đóng băng trước code; test đỏ commit trước adapter.
- **FR-02 Bảng adapter** (spec §4.2):

| Trạng thái heading | Dòng dương trong scope | Dòng âm trong scope | Ghi chú |
|---|---|---|---|
| `only_yi` (從宜不從忌) | giữ | informational 0 | trừ 忌 protected |
| `both_present` (亦從宜亦從忌) | giữ | giữ | không triệt tiêu |
| `only_ji` (從忌不從宜) | informational 0 | giữ; nếu không có dòng âm → −25 | |
| `neither_recorded` (不註) | informational 0 | informational 0 | 忌 protected vẫn áp dụng |
| 諸事皆忌 | — | −25 `product_policy_default_penalty` | không hard warning, `balancingEligible: false` |
| `not_recorded` / `undetermined` | giữ baseline | giữ baseline | không sinh penalty |

- **FR-03 Contract `Evidence`:** thêm `evidenceOrigin: 'canonical' | 'product_policy'`, `policyId?`, `sourceClauseId?`, `balancingEligible?` — **chỉ xuất hiện khi flag ON** (để flag OFF byte-equal).
- **FR-04 Cap:** resolution → dòng còn hiệu lực → phân bổ cap một lần; trace giữ `rawDelta`, delta trước cap, delta sau cap.
- **FR-05 Event:** `event_fit` của `very_high` đọc applied negative cuối cùng (không đổi logic event); hard warning vẫn fail.
- **FR-06 Không đụng:** authority/Golden đóng băng, 28 Tú OFF, `hardVetoFromClassicalJi: false`, `hardWarningKeepsWorseScoreStatus: true`, thresholds/weights/caps.
- **FR-07 Mutation:** runner riêng, lượt đối chứng sạch, mỗi hàng FR-02 + cap + penalty dedup + flag OFF đều có mutation bị bắt; thêm vào `ci:p4`.
- **FR-08 Hiệu năng/bundle:** đo thời gian tính 1095 ngày trước–sau ở flag OFF; resolution P4 chỉ nạp khi flag ON (dynamic import nếu bundle tăng đáng kể).

## 6. Quyết định owner (2026-10-17)

1. **21 thần: có, cùng flag.** Flag ON nối 7 cát + 14 hung dormant vào sao/evidence/điểm; flag OFF giữ 14 legacy theo Month Jian. Chế độ chỉ-presence / chỉ-balancing chỉ là toggle test cho roadmap 9, không là config production.
2. **6 chain: P4 thay thế.** Flag ON bỏ `applyVol10Scoring` cho activity có heading; flag OFF giữ nguyên 6 chain. Activity không heading (`grave_repair`, `door_opening`, `waterworks`) giữ baseline.
3. **Nhiều heading: chặt nhất thắng** (product policy `p4_multi_heading_strictest`, không phải luật sách). Thứ tự đề xuất: `only_ji` > `both_present` > `neither_recorded` > `only_yi`; một heading `undetermined` / `not_recorded` → activity giữ baseline. Penalty −25 tối đa một lần mỗi activity.
4. **Scope dòng: Trực + thần catalog nguồn 協紀 卷十/十一** của activity. Không đụng 28 Tú, override `preserve_bad`, nguồn khác. 忌 protected luôn giữ.

Đã có căn cứ, không hỏi lại: resolution trước cap; −25 product policy không hard warning; `undetermined` giữ baseline; không sinh điểm dương khi chỉ "không kỵ"; giữ `event_fit`.

## 7. Non-goals

Bật flag (roadmap 10); TSV migration 4 cấu hình (roadmap 9); đưa luật owner vào engine P4 (cần lock P4-C mới, roadmap 10); 28 Tú; P1.

## 8. Acceptance

1. Test baseline v1 xanh với flag OFF, file baseline không đổi.
2. Golden điểm đóng băng trước code; test đỏ commit trước adapter.
3. Mutation bắt hết, trong `ci:p4`; `ci:local` xanh; chạy `ci:p4` tay một lần trước merge.
4. Báo cáo `docs/audits/p4-score-adapter.md`; cập nhật PROJECT_CONTEXT.
