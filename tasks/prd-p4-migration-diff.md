# PRD — Roadmap 9: migration diff 4 cấu hình + rollback flag `xiejiVol10BalancingEnabled`

Ngày: 2026-10-18. Trạng thái: **XONG, DEPLOYED `9865eee` (2026-10-18)**: owner chấp nhận đề xuất cho §6.1–6.9 (§6.10); bước 1–5 xong ([báo cáo](../docs/audits/p4-migration-diff.md)); không sửa runtime, flag vẫn OFF. Chờ owner go-live review trước roadmap 10.

## 1. Bối cảnh

- Roadmap 8 (nhánh `claude/p4-adapter`, PR #69, merge `7d7596f` 2026-10-18): adapter điểm sau flag OFF. [PRD](prd-p4-score-adapter.md) §6.1–6.14, [báo cáo](../docs/audits/p4-score-adapter.md). Baseline flag OFF: [p4-adapter-baseline-v1](../docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/lock.json).
- Spec: [p4-xieji-vol10-balancing.md](../docs/plans/p4-xieji-vol10-balancing.md) §7.2 (migration), §8 bước 6, §9 điều kiện 4 (diff report phân loại đầy đủ + rollback flag là gate go-live).
- PROJECT_CONTEXT §5 hàng 9: TSV 4 cấu hình (baseline / presence-only / balancing-only / full) trên 1095 ngày × 32 activity × 11 event; 0 `UNEXPECTED_REGRESSION`; rollback bằng flag đã kiểm. Cần owner: **go-live review**.
- Roadmap 9 **không bật flag** (roadmap 10) và không đổi điểm production.

## 2. Inventory seam: sinh 4 cấu hình bằng code có sẵn

| Seam | Vị trí | Dùng thế nào |
|---|---|---|
| `manifest.policies.xiejiVol10BalancingEnabled` | `shared/almanac-data/manifest.json` | Almanac đọc thẳng manifest (`almanac.ts:125`), không có override theo lời gọi → test phải `vi.mock` manifest (như `p4ScoreAdapterAlmanac.test.ts`) |
| Provider heading | `shared/lunar/p4AlmanacHeadings.ts` (tự đăng ký khi import) | Chưa import → `p4BalancingReady` false → almanac đi đường flag OFF dù manifest ON |
| `p4BalancingReady(date)` | `p4ScoreAdapter.ts:55` | Provider đã nạp **và** ngày trong 2025–2027 |
| `ActivityInput.xiejiVol10BalancingEnabled` | `activityRecommendations.ts:58` | Override flag cho riêng `getActivityRecommendations` |
| `ActivityInput.p4Headings` | `activityRecommendations.ts:60` | Trạng thái heading; `{}` → mọi activity `baseline` |
| `P4_DORMANT_GODS` | `p4ScoreAdapter.ts:13` | Lọc 21 thần khỏi `presentGood/BadGods`, `godPresence` |

Almanac không xuất `ActivityInput`. Harness (chỉ test) bọc `getActivityRecommendations` bằng `vi.mock('./activityRecommendations')`: almanac chạy với manifest ON + provider (sao, alias, operand như production ON), wrapper đổi input theo cấu hình rồi gọi hàm thật. Event (`evaluateEventDay` gọi `getAlmanac`) đi qua cùng wrapper. Almanac memoize theo `datasetVersion:ENGINE_VERSION:date` (không có flag) → **mỗi cấu hình một tiến trình vitest** (env), không đổi cấu hình trong cùng tiến trình.

| Cấu hình | Cách sinh | Ghi chú |
|---|---|---|
| **baseline** | Manifest thật (OFF), không mock — chính là [baseline v1](../docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/lock.json) | Đã đóng băng; roadmap 9 chỉ đọc |
| **presence-only** | Manifest ON + provider; wrapper: `xiejiVol10BalancingEnabled: false`, bỏ `p4Headings`, **giữ** 21 thần trong input | Đường legacy chấm cả 21 thần: cap trước, 6 chain thấy thần dormant. Không phải config production (owner §6.1) |
| **balancing-only** | Manifest ON + provider; wrapper: lọc `P4_DORMANT_GODS` khỏi input, giữ override ON + `p4Headings` | Sao vẫn hiện 21 thần và thay alias (chỉ đổi `warnings`), điểm không có thần dormant |
| **full** | Manifest ON + provider, wrapper passthrough | Đúng đường roadmap 10 sẽ phát hành |

Cấu hình chẩn đoán phụ (chỉ để phân rã, không vào bảng 4 cấu hình):

| Cấu hình phụ | Cách sinh | Tách được gì |
|---|---|---|
| `stars-only` | Manifest ON + provider, `p4Headings: {}` | Theo thiết kế bằng baseline về điểm (guard spec §5): chỉ còn hiệu ứng thay sao alias trên `warnings` |
| `chain-swap` | Như balancing-only nhưng mọi heading đã giải (`only_ji`/`only_yi`/`neither_recorded`/`both_present`) ép thành `both_present` (giữ `prot`) | Không gỡ, không −25, không thần dormant; chỉ còn "bỏ 6 chain + cap sau resolution" |
| `off-recon` | Manifest ON + provider, wrapper: override OFF + lọc 21 thần | Kiểm harness tái tạo input đúng: phải bằng baseline v1 về score/status/hard warning. **Không** là bằng chứng rollback (sao/warnings vẫn ON) |

## 3. Số đo probe (read-only, harness tạm không commit, tại `fdb519d`)

Mọi số dưới đây đo bằng harness §2 chạy một lần (5 + 3 lượt vitest, ~60 s/lượt), so với baseline v1. Số chính thức sẽ do harness đã commit sinh lại. Miền: 1095 ngày × 32 activity = **35.040** dòng activity; 1095 × 11 event × {không giờ, 9h} = **24.090** dòng event. "Đổi" = score, status hoặc `hardWarning` khác baseline.

**Kiểm harness:** `off-recon` = baseline về score/status/hard warning 35.040/35.040 dòng activity và score/classification 24.090/24.090 dòng event; sha khác 13.440 dòng vì `warnings` sao alias, nên **không** byte-equal. `stars-only` = baseline về điểm/status (0 đổi), event 0 đổi.

**Phân bố status:** baseline (off-recon) no_evidence 12.458, recommended 7.623, watch 6.915, avoid 3.818, neutral 2.645, consider 822, strong_avoid 759 → full no_evidence 9.069, avoid 6.694, recommended 6.190, watch 5.920, neutral 3.951, strong_avoid 2.786, consider 430.

| Cấu hình | Activity đổi | score | status | hard warning | Event score đổi | Event classification đổi |
|---|---|---|---|---|---|---|
| presence-only | 14.484 | 14.443 | 11.282 | 0 | 13.959 | 5.166 |
| balancing-only | 8.171 | 8.098 | 6.995 | 0 | 7.397 | 3.682 |
| full | **14.894** | 14.445 | 12.797 | **0** | 13.770 | **5.009** |
| chain-swap (phụ) | 3.512 | — | 3.218 | 0 | — | — |

- Full: 1.081/1.095 ngày có ít nhất một dòng đổi. Balancing-only và full **không cộng tuyến tính**: đổi ở cả hai 8.069, chỉ full 6.825, chỉ balancing-only 102 (thần dormant bù lại). → Không phân rã bằng phép trừ cấu hình; phân loại từng dòng full theo trace (§5 FR-04).
- **Trạng thái activity (full):** `only_ji` 13.966, `baseline` 10.046, `only_yi` 7.269, `neither_recorded` 2.061, `both_present` 1.698. Dòng đổi: `only_ji` 10.006, `only_yi` 2.151, `neither_recorded` 1.757, `both_present` 980, **`baseline` 0**.
- **Nhãn trên 14.894 dòng full đổi** (một dòng nhiều nhãn): thần dormant applied 10.532; gỡ theo trạng thái 6.756; chain bị thay (baseline có dòng 6 chain) 6.508; −25 765. Một nhãn 6.735, hai nhãn 6.651, ba nhãn 1.508, **không nhãn 0**.
- **Đổi mà activity-ngày không có thần dormant nào:** 2.645 (đây là phần "đổi cả ngày không có dormant" của báo cáo roadmap 8).
- **Cap — "resolution trước cap" thuần:** phản thực tế "cap trước, gỡ sau" trên chính dòng adapter cho **0 dòng khác**. Lý do cấu trúc: pool cap `good_god` toàn dương, `bad_god` toàn âm, mà gỡ theo dấu → gỡ là làm rỗng cả pool, không giải phóng cap cho dòng còn lại. Chỉ dòng âm protected/`preserve_bad` còn lại sau khi pool âm bị gỡ mới có thể nhận cap, và trên dữ liệu thật không có ca cap ràng buộc như vậy.
- **Cap — thần dormant chen cap:** 2.070 dòng full có cap ràng buộc (1.751 có thần dormant trong pool). 506 dòng thần không dormant nhận ít điểm hơn so với balancing-only; trong đó 235 khác score, 98 khác status so với balancing-only. Thứ tự cap = thứ tự catalog (PRD 8 quy ước Golden).
- **Penalty −25:** 1.245 dòng có −25 (765 đổi). 諸事皆忌: 1.484 dòng `only_ji` có `all_taboo`, 265 nhận −25.
- **Chain bị thay (chain-swap):** 3.512 dòng đổi, đều có chain ở baseline; theo trạng thái thật `only_ji` 1.671, `neither_recorded` 1.002, `only_yi` 720, `both_present` 119. Chuyển status lớn nhất: recommended → watch 950, avoid → no_evidence 726, neutral → watch 694.
- **Multi-heading giữ baseline (owner §6.6):** 269 activity-ngày (construction 113, livestock 109, wedding 47); 17 ngày wedding có heading còn lại `only_ji` (mất −25). Heading `undetermined`: 1 dòng.
- **Warehouse/P5:** `warehouse` 527 dòng đổi, `warehouse_opening` 656.
- **Sang trạng thái tốt từ không bằng chứng:** full neutral → recommended 403, no_evidence → recommended 27; balancing-only 0; presence-only 428 + 28. Event insufficient_evidence → recommended: full 42, balancing-only 0, presence-only 38. Đều do thần cát dormant.
- **Biên độ:** |Δscore| ≥ 30: 2.574 dòng; ≥ 40: 741; tối đa 60 (vd. 2027-03-03 medical 65 recommended → 5 strong_avoid: `求醫療病` `only_ji` gỡ 月德合, thần dormant `nguyet_hai` áp).
- **Transition status full (≥ 400):** watch → avoid 2.871; avoid → strong_avoid 1.471; no_evidence → watch 1.263; recommended → watch 1.185; no_evidence → avoid 1.182; no_evidence → neutral 917; recommended → neutral 719; watch → strong_avoid 530; watch → neutral 457; neutral → recommended 403.
- **Event full:** recommended → not_recommended 1.120; recommended → caution 1.012; caution → not_recommended 784; insufficient_evidence → not_recommended 708; not_recommended → caution 486; caution → recommended 399; not_recommended → recommended 264; insufficient_evidence → caution 194; insufficient_evidence → recommended 42. 81 cặp có/không giờ đổi khác nhau.
- **Chỉ đổi `warnings` (thay sao alias):** `stars-only` 13.440 dòng trên 420 ngày (cả 32 activity mỗi ngày); full 13.511 dòng đổi sha mà không đổi score/status/hard warning, 3.411 trong số đó ở activity `baseline`. Sha toàn recommendation không dùng được làm tiêu chí "đổi": mọi dòng qua adapter có thêm field `Evidence` mới (balancing-only và full đều 28.405 dòng khác sha).
- **Rollback (đo):** manifest thật (OFF) **+ provider `p4AlmanacHeadings` đã import** (trạng thái production sau roadmap 10 khi đổi flag về `false`) = baseline v1 byte-equal, activity + event, 1098 ngày (bản sao test baseline thêm một dòng import, 2/2 xanh).
- **Rollback:** memo almanac chỉ trong bộ nhớ (`shared/astronomy/solarTerms/cache.ts`, `Map` theo module), không lưu qua phiên. Flag là JSON lúc build; đổi flag = build/deploy mới.

## 4. Goals

1. Harness test-only sinh 4 cấu hình (+ 3 phụ) cho 1095 ngày × 32 activity và 11 event × {không giờ, 9h}, không sửa runtime, không sửa file Golden/authority/baseline đóng băng.
2. TSV full theo spec §7.2 + summary (transition matrix, phân rã, top ca tác động) cho owner review.
3. Mỗi dòng full đổi có ít nhất một nhãn class `EXPECTED_AUTHORITY_MIGRATION_CHANGE` khớp trace; **0 `UNEXPECTED_REGRESSION`** theo bất biến đóng băng trước khi sinh TSV.
4. Rollback flag được chứng minh: flag OFF phục hồi baseline v1 byte-equal (activity + event) sau khi đã chạy ON.

## 5. Functional requirements

- **FR-01 Bất biến trước dữ liệu.** Danh sách bất biến `UNEXPECTED_REGRESSION` (dưới) + class đóng băng (commit riêng, test đỏ/khung) **trước** khi sinh TSV full, cùng tinh thần Golden trước code. Bất biến đề xuất, kèm kết quả probe trên full ("R8" = đã kiểm ở roadmap 8, chưa chạy lại trong harness này):
  1. Activity `baseline` (không heading, dính §6.6, ngoài miền): score/status/hard warning = baseline v1 — **đo: 0 lệch** (10.046 dòng).
  2. `hardWarning` không đổi ở mọi dòng — **đo: 0**.
  3. Ngoài 2025–2027 (2024-12-31, 2028-01-01, 2035-06-15): full = toàn bộ output flag OFF — R8 (test almanac).
  4. Mỗi dòng đổi có ≥ 1 nhãn §FR-04 — **đo: 0 dòng không nhãn**.
  5. Status `recommended` hoặc score > 50 ⇒ có dòng dương applied — **đo: 0 vi phạm** (cả baseline). `consider` **không** thuộc bất biến: là status nhóm tránh (`ActivityAvoidance`), baseline có 295 dòng `consider` không có dòng dương, full 180.
  6. −25 tối đa một lần mỗi activity-ngày, chỉ ở `only_ji`, chỉ khi không còn âm applied trong scope (thần bị Trực bao không tính) — R8 (mutation); harness roadmap 9 kiểm toàn miền (§6.10.2).
  7. Dòng informational do adapter gỡ khớp bảng FR-02 PRD 8 theo trạng thái; 忌 protected và `preserve_bad` không bao giờ bị gỡ — R8 (mutation); harness roadmap 9 kiểm toàn miền (§6.10.2).

  12. Trace giải thích delta (FR-04): score = clamp(50 + Σ applied delta) ở cả baseline và full; mỗi dòng trong scope đổi status/delta so với flag OFF phải là dòng gỡ, −25, thần dormant, cap (full hoặc flag OFF) hoặc dòng 6 chain; dòng flag OFF biến mất chỉ khi là dòng chain thêm vào.

  **Bước 4 xong**: [runner](../scripts/audit-p4-migration-mutations.py) tuần tự, lượt đối chứng sạch, mỗi mutation sửa runtime (adapter/scorer/almanac/event, không sửa luật/Golden/lock), chạy **một** test đích bằng `-t` và chỉ tính bắt khi output có đúng thông điệp bất biến: [14/14](../docs/audits/p4-migration-diff-mutation-results.json) (bất biến 1–12, chain-swap, fixture Jie), ngày mẫu, ~1 phút/mutation; trong `ci:p4`. Không dùng: đảo `both_present`/`neither_recorded` (đo trên TSV full: **0/1095 ngày** có activity nhiều heading trộn hai trạng thái đó, nên thứ tự giữa chúng không có hiệu lực trên dữ liệu thật; đã có mutation ở Golden điểm roadmap 8) và `neutral` → `recommended` (test đích fail qua bất biến khác, không có thông điệp bất biến 5, nên không tính); thay bằng `only_yi` lên đầu thứ tự và `no_evidence` → `recommended`. Bảo vệ 忌 protected/`preserve_bad` không có ca thật trên dữ liệu (chỉ ở `only_ji`/`both_present`), vẫn chỉ kiểm bằng ca tổng hợp.

  **Bước 3 xong**: [p4-migration-diff-v1](../docs/audits/sources/p4-vol10/p4-migration-diff-v1/lock.json) sinh bằng `P4_MIGRATION_FULL=1 P4_MIGRATION_WRITE=1` (commit sinh ghi trong lock): `days.tsv` (operands, sao thêm/bỏ), `activities-full-{2025,2026,2027,outside}.tsv` (tách năm vì > 5 MB), `events-full.tsv` (+ `event_fit`), dòng đổi của presence-only/balancing-only, `jie-boundary.tsv` (36 Jie × ±1 = 108 ngày; 20 ngày Month Jian lệch quy ước noon, khớp P4-C), `review.tsv` (gói §6.10.5), `summary.json`. Số khớp probe §3; phản thực tế cap-trước **0 dòng**; 2.645 dòng đổi không có thần dormant đều có nhãn gỡ/−25/chain. `npm test` kiểm ngày mẫu, `ci:p4` kiểm bytes toàn bộ.

  **Bước 2 xong** (`08c3afb`): harness [`p4MigrationDiff.test.ts`](../shared/lunar/p4MigrationDiff.test.ts) + [`p4MigrationRollback.test.ts`](../shared/lunar/p4MigrationRollback.test.ts); toàn miền 5/5 (~307 s, `ci:p4`), mẫu ~33 s trong `npm test`; `ci:local` 8.129 test ~180 s.

  **Đã đóng băng** (bước 1): [`p4MigrationRules.ts`](../shared/lunar/p4MigrationRules.ts) + test 18 ca tổng hợp, sha256 trong [lock](../docs/audits/sources/p4-vol10/p4-migration-rules-v1/lock.json). Chạy thử một lần trên full (probe, base = off-recon): 14.894 dòng đổi, **0 vi phạm** cả 12 bất biến (bất biến 3 chưa chạy ở đó).

  Vi phạm bất kỳ bất biến nào: dừng và hỏi owner, không sửa bất biến cho khớp dữ liệu (§6.10.2).
  8. Thần dormant applied ⇒ có presence trong Golden v2 ngày đó (`p4-full-golden-v2`), đúng Month Jian — R8 (presence 1095/1095).
  9. Trạng thái activity = Golden điểm v1 lớp B (31.842 dòng) — R8.
  10. Event đổi (score hoặc classification) ⇒ ít nhất một activity trong profile event đó đổi cùng ngày — **đo: 13.874 dòng event đổi, 0 vi phạm**. Hard warning vẫn fail; `very_high` đọc applied negative cuối — R8 (FR-05, 4 ngày).
  11. Không dòng nào `no_evidence` → `recommended` mà không có dòng dương applied — **đo: 0 vi phạm** (27 dòng chuyển đều có dương applied; câu hỏi §6.3 là về chính sách, không phải bất biến).
- **FR-02 Harness** `shared/lunar/p4MigrationDiff.test.ts` (tên đề xuất): cấu hình qua env, một cấu hình mỗi tiến trình; ghi đủ input + flag + commit để tái hiện; không input personal (như baseline v1). Chạy đủ miền chỉ trong `ci:p4` (~5–8 phút cho 7 lượt); `npm test` chỉ mẫu (mỗi ngày thứ 10) để giữ `ci:local` ~3 phút.
- **FR-03 TSV** `docs/audits/sources/p4-vol10/p4-migration-diff-v1/` (đề xuất): activity full gồm date, operands (Month Jian, can-chi, ngày âm), sao thêm/bỏ, heading/state/rule/`prot`, cấp/德 nếu có trong trace, dòng gỡ, raw/preCap/applied delta, cap dùng, score/status trước–sau, nhãn class, source ID; event full gồm score/classification trước–sau, `event_fit`, activity role liên quan. 3 cấu hình kia: summary + (tùy §6.4) TSV rút gọn. `lock.json` sha256 như baseline v1. Phạm vi commit theo §6.10.4: full = TSV đủ mọi dòng (activity + event); presence-only, balancing-only = summary JSON + TSV chỉ dòng đổi; 3 cấu hình phụ = summary. TSV full > ~5 MB thì tách theo năm.
- **FR-04 Class đổi (một dòng nhiều nhãn, gán từ trace của chính dòng full, không từ phép trừ cấu hình):**

| Class | Nhận diện | Kiểm |
|---|---|---|
| `STATE_LIFT` | Dòng `classical.version = p4-score-adapter-v1` | Bất biến 7, 9 |
| `DEFAULT_PENALTY` | Dòng `policyId = product_policy_default_penalty` (`all_taboo` tách riêng) | Bất biến 6 |
| `DORMANT_GOD_ADDED` | Dòng thần ∈ `P4_DORMANT_GODS`, applied, scoreDelta ≠ 0 | Bất biến 8 |
| `CHAIN_REPLACED` | Activity có state, baseline có dòng `xieji-vol10-scoring-v1` | Cấu hình `chain-swap` tách riêng tác động |
| `CAP_REALLOCATION` | (a) resolution trước cap giải phóng cap — kiểm bằng phản thực tế cap-trước, kỳ vọng 0; (b) thần dormant chen cap thần khác — so applied delta thần không dormant với balancing-only | Báo cáo số dòng/status đổi |
| `ALIAS_STAR_SWAP` | Chỉ `warnings` đổi (5 sao alias) | Không phải đổi kết luận |
| `SCHEMA_ONLY` | Chỉ thêm field `Evidence` | Không tính |
| `CHAIN_REPLACED_LIGHTER` | Dòng ra khỏi nhóm tránh (hoặc strong_avoid → avoid) **chỉ** vì bỏ 6 chain, không có dòng `STATE_LIFT` | `EXPECTED` (§6.10.7), liệt kê đủ cho owner review |
| `MULTI_HEADING_BASELINE` | §6.6: 269 dòng giữ baseline (17 wedding `only_ji`) | Liệt kê, không đổi |

  Dòng đổi không khớp bất biến nào = `UNEXPECTED_REGRESSION`. Trace phải giải thích được delta: score full = clamp(50 + Σ applied delta) và mọi delta khác baseline thuộc ít nhất một dòng có nhãn.
- **FR-05 Phân rã "resolution trước cap".** Báo cáo tách: (a) phản thực tế cap-trước (kỳ vọng 0, kèm lý do cấu trúc §3), (b) dormant chen cap, (c) bỏ 6 chain (`chain-swap`), (d) gỡ theo trạng thái, (e) −25. Mỗi phần: số dòng, transition status, top ca. Riêng tập "đổi ở activity-ngày không có thần dormant" (2.645 trong probe) phải được giải thích hết bằng (c)–(e).
- **FR-06 Báo cáo** `docs/audits/p4-migration-diff.md`: transition matrix activity + event mỗi cấu hình, ma trận chồng lấn cấu hình, phân rã FR-05, lát cắt warehouse/P5, 21 thần (theo thần), multi-heading §6.6, gói review owner (§6.10.5): top 50 |Δscore|, cả 14 dòng recommended → strong_avoid, mẫu phân tầng 3 dòng mỗi tổ hợp class × trạng thái heading; đủ 42 dòng event insufficient_evidence → recommended; 98 dòng đổi status do dormant chen cap; danh sách `CHAIN_REPLACED_LIGHTER`. Không lấy tổng recommended tăng/giảm làm bằng chứng đúng nguồn (spec §7.2).
- **FR-07 Boundary exact Jie** (spec §7.2): fixture riêng, độc lập sweep: mọi ngày chứa Jie 2025–2027 và ngày trước/sau, event có/không giờ; kiểm presence 21 thần đổi đúng ngày đổi Month Jian. Gồm 3 ngày Jie lệch quy ước noon đã biết từ P4-C.
- **FR-08 Rollback.** Trạng thái cần chứng minh là trạng thái production sau rollback: provider `p4AlmanacHeadings` **đã nạp** (roadmap 10 nạp trước almanac đầu tiên) và manifest `false`. (a) Test commit trong roadmap 9: manifest thật + `import './p4AlmanacHeadings'` → baseline v1 byte-equal, activity + event, 1098 ngày (probe §3 đã xanh). Test baseline v1 hiện có không import provider nên chỉ chứng minh lại roadmap 8. (b) Gate là **output bằng nhau**, không phải bundle: sau rollback một dòng, bundle vẫn chứa loader/UI của roadmap 10 nên không trùng SHA build trước activation; kiểm bundle chỉ là "bundle deploy = build local cùng commit". (c) Rollback = PR một dòng đổi manifest về `false`, giữ `legacyGodsMonthJian` và 6 chain; không sửa Golden/authority. Smoke production ON → OFF thuộc roadmap 10, ngay sau deploy (§6.10.8). (d) Ghi giới hạn: PWA cũ chạy tới khi update detection (PR #57) nạp bundle mới; memo chỉ trong bộ nhớ nên reload là sạch.
- **FR-09 Không đụng:** Golden/authority/baseline đóng băng; suite production P2/R5 không pin về flag cũ, không sửa expected theo output mới (spec §7.2); runtime production không đổi; mutation runner chạy tuần tự.
- **FR-10 Mutation harness** (nhỏ): bất biến FR-01 phải bắt được ít nhất: bỏ một nhãn class, −25 hai lần, gỡ 忌 protected, thần dormant ngoài Golden v2 presence, activity baseline đổi điểm, `hardWarning` mất. Runner riêng, lượt đối chứng sạch, vào `ci:p4`.

## 6. Câu hỏi owner

1. **Định nghĩa presence-only.** (a) Đề xuất: đường legacy (flag OFF) chấm cả 21 thần (cap trước, 6 chain thấy thần dormant) — đo 14.484 dòng đổi. (b) Sao-only (flag ON, heading `{}`): bằng baseline về điểm theo thiết kế (guard spec §5), chỉ đổi `warnings` 13.440 dòng / 420 ngày — đề xuất ghi như cấu hình phụ `stars-only`. Chọn (a)?
2. **Bất biến FR-01.** Duyệt danh sách 1–11 làm định nghĩa `UNEXPECTED_REGRESSION`, đóng băng trước khi sinh TSV? Thêm/bớt gì?
3. **Thần cát dormant đưa ngày không bằng chứng lên tốt.** Full: neutral → recommended 403, no_evidence → recommended 27; event insufficient_evidence → recommended 42 (balancing-only 0). Spec §7.1 "không biến `no_evidence` thành pass" viết cho event `very_high`. Coi đây là `EXPECTED` (thần cát catalog có tier/weight sẵn, owner §6.10) hay chặn/review riêng?
4. **Phạm vi commit TSV.** Đề xuất: TSV đầy đủ chỉ cho full (activity 35.040 + event 24.090 dòng, ước vài MB); presence-only/balancing-only/phụ chỉ summary JSON + dòng đổi. Hay commit TSV cả 4?
5. **Ca biên độ lớn.** 741 dòng |Δscore| ≥ 40, tối đa 60 (vd. 2027-03-03 medical/pray_blessing/pray_children 65 → 5). Owner muốn review danh sách top N nào (đề xuất top 50 theo |Δscore| + mọi recommended → strong_avoid 14 dòng) trước go-live?
6. **Dormant chen cap (506 dòng, 98 đổi status so với balancing-only).** Giữ thứ tự cap theo catalog (quy ước PRD 8) là `EXPECTED`?
7. **Chain bị thay làm mất cảnh báo cũ:** chain-swap cho avoid → no_evidence 726 dòng (trước khi tính gỡ/−25/thần dormant). Trong full còn 409 dòng `avoid`/`strong_avoid` ra khỏi nhóm tránh (avoid → watch 328, → neutral 22, → consider 8; strong_avoid → watch 49, → consider 2) và 100 strong_avoid → avoid; owner duyệt nguyên tắc "đổi theo nguồn P4 thay 6 chain" (§6.2 PRD 8) là `EXPECTED` cho cả hướng nhẹ đi?
8. **Định nghĩa "rollback đã kiểm".** FR-08: output flag OFF + provider đã nạp = baseline v1 byte-equal (đã đo xanh) + rollback là PR một dòng manifest. Đủ cho roadmap 9, hay cần thêm smoke production thật (deploy ON rồi OFF) — vốn thuộc roadmap 10? Có thêm flag vào khóa memo almanac (phòng vệ, sửa runtime) không — đề xuất **không**, vì flag chỉ đổi lúc build.
9. **Thời gian `ci:p4`.** Thêm ~5–8 phút (7 lượt đủ miền) + mutation harness. Chấp nhận? `npm test` chỉ chạy mẫu 1/10 ngày.

### 6.10 Quyết định owner (2026-10-18): chấp nhận cả 9 đề xuất

1. **Presence-only = (a)**: đường legacy (flag OFF) chấm cả 21 thần. Bản sao-only ghi thành cấu hình phụ `stars-only` (đếm riêng `warnings` sao alias).
2. **Bất biến 1–11 duyệt**, bất biến 5 không gồm `consider`. Bất biến 6, 7 kiểm lại toàn miền trong harness. Đóng băng thành test, commit trước TSV; vi phạm → dừng hỏi owner, không chỉnh bất biến theo dữ liệu.
3. **Thần cát dormant đưa ngày lên tốt** (430 dòng activity, 42 event) là `EXPECTED`: dương từ tier/weight catalog (§6.10 PRD 8), balancing-only 0 dòng, bất biến 11 0 vi phạm; spec §7.1 nói về `very_high` đọc applied negative. Báo cáo liệt kê đủ 42 dòng event.
4. **Commit TSV:** full đủ mọi dòng; presence-only/balancing-only summary + dòng đổi; phụ chỉ summary; > ~5 MB tách theo năm; `lock.json` sha256.
5. **Review biên độ:** top 50 |Δscore| + 14 recommended → strong_avoid + mẫu phân tầng 3 dòng mỗi class × trạng thái; không review hết 741 dòng ≥ 40.
6. **Cap theo thứ tự catalog giữ**, `EXPECTED` (quy ước Golden điểm v1); báo cáo ghi 98 dòng đổi status.
7. **Dòng nhẹ đi khi bỏ 6 chain** là `EXPECTED` (§6.2 PRD 8). Có `STATE_LIFT` → nhãn thường; chỉ do bỏ chain → class `CHAIN_REPLACED_LIGHTER`, liệt kê đủ, không phải regression.
8. **Rollback roadmap 9** = output flag OFF + provider đã nạp byte-equal baseline v1 + PR một dòng manifest. Smoke production ON → OFF ở roadmap 10. Không thêm flag vào khóa memo almanac.
9. **CI:** `ci:p4` thêm ~5–8 phút; `npm test` chạy mẫu 1/10 ngày.

Thứ tự thực hiện (tuần tự, một session): (1) test bất biến + class đóng băng; (2) harness `p4MigrationDiff.test.ts` + test rollback có provider; (3) TSV + summary + `lock.json`, gồm: cột FR-03 (sao thêm/bỏ, operands Month Jian/can-chi/ngày âm từ `selectionContext`), ghi input/flag/commit để tái hiện (FR-02), phản thực tế cap-trước FR-05(a), fixture boundary exact Jie FR-07; (4) mutation runner vào `ci:p4`; (5) báo cáo + PROJECT_CONTEXT.

## 7. Non-goals

Bật flag/deploy (roadmap 10); sửa adapter, Golden điểm, Golden v2, baseline v1; UI (dòng giải thích, nhãn "điểm trừ mặc định của ứng dụng", `meaning` rỗng của 16 thần — roadmap 10); 28 Tú; P1; input personal.

## 8. Acceptance

1. Bất biến + class đóng băng (commit riêng) trước TSV; harness sinh lại số §3 (hoặc giải thích chênh).
2. TSV/summary + `lock.json`; 0 `UNEXPECTED_REGRESSION`; mọi dòng đổi có nhãn; phân rã FR-05 giải thích hết 2.645 dòng không dormant.
3. Rollback FR-08 (a)(b) xanh; baseline v1 không đổi.
4. Mutation FR-10 bắt hết, trong `ci:p4`; `ci:local` xanh; chạy `ci:p4` tay một lần.
5. Báo cáo `docs/audits/p4-migration-diff.md`; cập nhật PROJECT_CONTEXT; owner go-live review.
