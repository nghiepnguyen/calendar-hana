# Roadmap 9 — migration diff 4 cấu hình + rollback flag `xiejiVol10BalancingEnabled`

2026-10-18, nhánh `claude/p4-migration-diff`, **DEPLOYED** `9865eee` (push thẳng main theo owner sau `ci:local` xanh; [deploy 39102682779](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39102682779) SUCCESS; sau roadmap 8 PR #69 `7d7596f`). Production **không đổi**: flag `false` (bundle `index-umK95j49.js` nhúng `!1`), không sửa runtime. [PRD](../../tasks/prd-p4-migration-diff.md) (owner §6.10), [spec](../plans/p4-xieji-vol10-balancing.md) §7.2, §9 điều kiện 4. **Chờ owner go-live review** trước roadmap 10 (activation); deploy này không bật gì.

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| Luật trước dữ liệu (FR-01, FR-04) | [`p4MigrationRules.ts`](../../shared/lunar/p4MigrationRules.ts): 12 bất biến `UNEXPECTED_REGRESSION` + class, 18 ca tổng hợp, sha256 trong [lock](sources/p4-vol10/p4-migration-rules-v1/lock.json), commit `7a1475a`/`4c95421` **trước** mọi TSV |
| Harness (FR-02) | [`p4MigrationDiff.test.ts`](../../shared/lunar/p4MigrationDiff.test.ts): mỗi cấu hình một module graph (`vi.resetModules`); baseline = manifest thật (OFF) = baseline v1 sha từng dòng; 5 cấu hình kia manifest ON + provider, đổi input theo cấu hình |
| Dữ liệu (FR-03) | [p4-migration-diff-v1](sources/p4-vol10/p4-migration-diff-v1/README.md), sinh ở cây sạch `0b67ff9`, chạy lại trùng bytes; `npm test` kiểm ngày mẫu, `ci:p4` kiểm toàn bộ |
| **`UNEXPECTED_REGRESSION`** | **0** trên 35.136 dòng activity + 24.156 dòng event của full (bất biến 1–12) |
| Rollback (FR-08) | [`p4MigrationRollback.test.ts`](../../shared/lunar/p4MigrationRollback.test.ts): manifest thật (OFF) **+ provider đã nạp** = baseline v1 byte-equal, activity + event, 1098 ngày. Rollback = PR một dòng manifest; smoke production ON → OFF ở roadmap 10 |
| Boundary Jie (FR-07) | 36 Jie × ±1 ngày = 108 ngày: Month Jian và 21 thần khớp Golden v2 mọi ngày; Month Jian đổi qua mọi Jie |
| Cap-trước (FR-05 a) | Phản thực tế "cap trước, gỡ sau": **0 dòng** khác |
| Mutation (FR-10) | [Runner](../../scripts/audit-p4-migration-mutations.py), [kết quả](p4-migration-diff-mutation-results.json): đối chứng sạch, **14/14** bị bắt, mỗi mutation chỉ tính khi test đích có đúng thông điệp bất biến |
| `ci:local` | 8.132 test, ~182 s (harness mẫu ~59 s, rollback ~22 s) |
| `ci:p4` (chạy tay) | **EXIT 0, ~55 phút** (3.310 s), tại `d46e965` (+ docs) |

## Bốn cấu hình (1098 ngày; trong miền 1095 ngày = 35.040 / 24.090 dòng, số dòng đổi như nhau vì ngoài miền = baseline)

| Cấu hình | Activity đổi | score | status | hard warning | Event score | Event classification |
|---|---|---|---|---|---|---|
| presence-only (§6.10.1 a) | 14.484 | 14.443 | 11.282 | 0 | 13.959 | 5.166 |
| balancing-only | 8.171 | 8.098 | 6.995 | 0 | 7.397 | 3.682 |
| **full** | **14.894** | 14.445 | 12.797 | **0** | 13.770 | **5.009** |
| stars-only (phụ) | 0 | 0 | 0 | 0 | 0 | 0 |
| chain-swap (phụ) | 3.512 | 3.512 | 3.218 | 0 | 3.073 | 1.116 |

Full ∩ balancing-only 8.069; chỉ full 6.825; chỉ balancing-only 102 → không phân rã bằng phép trừ, mỗi dòng gán class từ trace của chính nó.

**Trạng thái activity (full):** `only_ji` 13.966, `baseline` 10.142 (gồm ngoài miền), `only_yi` 7.269, `neither_recorded` 2.061, `both_present` 1.698. Dòng đổi: `only_ji` 10.006, `only_yi` 2.151, `neither_recorded` 1.757, `both_present` 980, `baseline` 0.

**Transition status full (≥ 400):** watch → avoid 2.871; avoid → strong_avoid 1.471; no_evidence → watch 1.263; recommended → watch 1.185; no_evidence → avoid 1.182; no_evidence → neutral 917; recommended → neutral 719; watch → strong_avoid 530; watch → neutral 457; neutral → recommended 403. **Event:** recommended → not_recommended 1.120; recommended → caution 1.012; caution → not_recommended 784; insufficient_evidence → not_recommended 708; not_recommended → caution 486; caution → recommended 399; not_recommended → recommended 264; insufficient_evidence → caution 194; insufficient_evidence → recommended 42.

## Phân rã (FR-05), 14.894 dòng full đổi

| Class | Dòng | Chỉ class này | Đổi status | Transition chính | Ca lớn nhất |
|---|---|---|---|---|---|
| `DORMANT_GOD_ADDED` | 10.532 | 4.322 | 9.100 | watch → avoid 2.251, avoid → strong_avoid 1.332, no_evidence → watch 1.263 | 2025-01-31 moving 60 → 0 |
| `STATE_LIFT` | 6.756 | 1.442 | 5.692 | watch → avoid 1.299, recommended → watch 763, recommended → neutral 719 | 2025-01-31 moving 60 → 0 |
| `CHAIN_REPLACED` | 6.508 | 249 | 5.692 | watch → avoid 2.117, avoid → strong_avoid 1.388 | 2025-01-31 moving 60 → 0 |
| `DEFAULT_PENALTY` | 671 | 596 | 671 | no_evidence → avoid 604 | 2025-09-11 construction 75 → 25 |
| `DEFAULT_PENALTY_ALL_TABOO` (諸事皆忌) | 94 | 32 | 94 | watch → avoid 37, no_evidence → avoid 35 | 2025-02-21 worship 75 → 25 |
| `CAP_REALLOCATION` (thần dormant chen cap) | 236 | 0 | 156 | watch → avoid 42, consider → avoid 37 | 2025-10-19 meeting 65 → 5 |

- **"Resolution trước cap" thuần = 0:** pool `good_god` toàn dương, `bad_god` toàn âm, gỡ theo dấu → gỡ làm rỗng cả pool, không giải phóng cap cho dòng còn lại. Phần cap thật sự đổi là thần dormant chen cap: 236 dòng, 98 dòng khác status so với balancing-only (owner §6.10.6: `EXPECTED`, thứ tự catalog).
- **Đổi ở activity-ngày không có thần dormant:** 2.645 dòng, **cả 2.645** có `STATE_LIFT`/`DEFAULT_PENALTY`/`CHAIN_REPLACED`.
- **Bỏ 6 chain riêng (chain-swap):** 3.512 dòng đổi, đều có chain ở baseline; 2.184 trong số đó cũng đổi ở full.
- **Mỗi dòng full đổi có ≥ 1 class**; một class 6.735, hai 6.651, ba 1.508.
- **Thần dormant applied:** nguyet_yem 1.800, nguyet_sat 1.778, tai_sat 1.438, dai_thoi 1.340, tu_tuong 1.263, nguyet_hai 1.043, tu_phe 793, thoi_duc 509, ngu_ly 441, vang_vong 323, ngu_mo 292, ngu_hop 289, thien_nguyen 250, tu_cung 161, bat_chuyen 136, pho_ho 109, quy_ky 88, yem_doi 79, thien_thuong 74, bat_tuong 49, tu_ky 48.
- **Warehouse/P5:** `warehouse` 527 dòng đổi status, `warehouse_opening` 656 (chi tiết transition trong `summary.json`).
- **Lên tốt từ không bằng chứng:** neutral/no_evidence → recommended 430 dòng (balancing-only 0), event insufficient_evidence → recommended 42 — `EXPECTED` (§6.10.3, thần cát catalog), liệt kê đủ trong `review.tsv`.
- **Biên độ |Δscore|:** 1–9: 739; 10–19: 9.362; 20–29: 2.219; 30–39: 1.833; ≥ 40: 741.

## Cho owner review (`review.tsv`, §6.10.5)

top 50 |Δscore| (50) · recommended → strong_avoid (14) · mẫu 3 dòng mỗi class × trạng thái · cap đổi status so với balancing-only (98) · `CHAIN_REPLACED_LIGHTER` (389) · multi-heading giữ baseline §6.6 (269; 17 wedding mất −25 `only_ji`) · event insufficient_evidence → recommended (42).

`CHAIN_REPLACED_LIGHTER` = 389 là dòng nhẹ đi **chỉ** vì bỏ chain (không có `STATE_LIFT`): avoid → watch 242, strong_avoid → avoid 100, strong_avoid → watch 47. PRD §6.7 đếm 409 + 100 là mọi dòng nhẹ đi bất kể nguyên nhân.

### Kết quả review (theo nhóm)

**Nhóm 1 — recommended → strong_avoid (14 dòng)**, chỉ 2 context:

- **Mẫu A — 寅月 ngày 巳, Trực Bình (12 dòng):** 2025-02-17, 2026-02-12, 2027-02-07 (丁巳), 2027-03-03 (辛巳) × `pray_blessing` / `pray_children` / `medical`, 65 → 5. Heading `only_ji`, `ji=遊禍; prot=遊禍; xd=平日+月刑+月害; suppressed:xiangdi` (Golden v2). 遊禍 không có trong catalog; điểm âm đến từ Trực Bình −15, Nguyệt Hình −15 (baseline: informational do chain 平日), Nguyệt Hại −15 (dormant); Thiên Đức / Nguyệt Đức Hợp +15 và Tứ Tướng thành informational. **Owner chốt (a), 2026-10-18:** đúng 從忌不從宜 = ghi đủ 忌; mọi dòng âm trong scope giữ trọng số, không giới hạn về −25 (PRD §6.7 giữ nguyên). `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.
- **Mẫu B — 卯月 戊寅, Trực Bế (2 dòng):** 2025-03-10, 2026-03-05 × `moving`, 65 → 15. Heading `only_ji`, `ji=歸忌; prot=歸忌; xd=閉日`. Trực Bế −20 (baseline: informational do chain 閉日), Quy Kỵ −15 (dormant); Thiên Xá +15 thành informational. **Owner OK, 2026-10-18:** Trực lấy lại trọng số khi P4 thay 6 chain (§6.2). `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.

**Nhóm 2 — top 50 |Δscore|:** 16 context, tất cả `only_ji`; 12 dòng trùng nhóm 1. Mẫu chung: 德/cát thần thành informational, dòng âm trong scope giữ trọng số (đã chốt ở nhóm 1), thêm hung thần dormant.

- **Điểm 1 — 忌 không bảo vệ thắng qua 等第:** 2025-07-15 (未 乙酉) và 2025-07-27 (未 丁酉) × `contract` / `transaction`, 75 → 20. 災煞 cấp 中, không 德 → `only_ji` (Golden v2 `ji/grades.tsv`, `未-乙酉`); Trực Mãn +15, Dân Nhật +10 thành informational; Tai Sát −15, Ngũ Ly −15 (dormant). Toàn miền 8.989/14.495 heading-ngày `only_ji` đi đường 等第 không `prot`. **Owner OK, 2026-10-18:** luật sách đã khóa ở P4-B / Golden v2, không cần policy mới. `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.
- **Điểm 2 — thần dormant chen cap:** 戌 辛酉 `meeting` (2025-10-19, 2026-10-14, 2027-10-09), 65 → 5. Nguyệt Hại, Ngũ Ly (dormant, đứng trước trong catalog) dùng hết cap −30; 百忌酉 (忌 quyết định heading, `prot`) applied 0, hard warning giữ. Điểm không phụ thuộc thần nào ăn cap. **Owner chọn (a), 2026-10-18:** giữ cap theo thứ tự catalog (§6.10.6); giải thích "kỵ vẫn áp dụng" trên UI xử lý ở roadmap 10. `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.
- **Điểm 3 — 諸事皆忌 có dòng âm nhẹ hơn khi không có:** 寅 庚申 `medical` (2025-02-20, 2026-02-15, 2027-02-10), 95 → 35 watch: Tứ Phế −15 applied nên không có −25 (§6.11). Trên heading-ngày 諸事皆忌: có −25 265 dòng (avoid); không −25: strong_avoid 539, avoid 400, watch 276, consider 4. **Owner chọn (b), 2026-10-18:** 諸事皆忌 có sàn — tổng âm applied trong scope tối thiểu −25, phần thiếu bù bằng dòng `product_policy_default_penalty`. Thay §6.11; chỉ làm nặng thêm. **Mở lại roadmap 8–9 một phần** (PRD, Golden điểm v2, adapter, mutation, chạy lại diff) — gộp làm sau khi review xong nhóm 3–7.

**Nhóm 3 — lên tốt từ không bằng chứng** (activity neutral/no_evidence → recommended 430; event insufficient_evidence → recommended 42). Owner chốt 2026-10-18:

- **405 dòng `only_yi` + cát thần dormant** (vd. 2025-01-05 `worship` 60 → 70, Golden `yi:四相+聖心`): **OK**, giữ nguyên; khóa làm ca regression trong Golden điểm v2. `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.
- **25 dòng `both_present`** có 忌 ngoài catalog nên không có dòng âm (死氣 13 `planting`, 遊禍, 地囊, 九焦, 土符, 朔望日; vd. 2025-01-15 `pray_blessing` 60 → 70, `ji=遊禍; prot=遊禍; yi:四相+福生`): **(b)** — sàn −25 `product_policy_default_penalty` khi heading có 忌 đã ghi nhưng không còn dòng âm applied trong scope. Gộp đợt code với sàn 諸事皆忌 (nhóm 2 điểm 3).
- **6 event `buy_property`** recommended dù `moving` là `only_ji` (event không `very_high`, điểm event = trung bình profile): **OK**, giữ `event_fit` hiện hành. Backlog riêng nếu muốn siết event-fit.
- **Kiểm sau khi code:** chạy lại diff; 8 event `buy_property` có `moving` `both_present` phải tự điều chỉnh theo activity, không thêm rule event.

**Nhóm 4 — `CHAIN_REPLACED_LIGHTER` (389).** Owner chốt 2026-10-18:

- **4.1 — 261 dòng (không 諸事皆忌):** chain 卷十 `yue_sha` / `yue_yan` −25 (`ADDED_PENALTY`, vì 月煞/月厭 còn dormant) thay bằng chính thần Nguyệt Sát / Nguyệt Yếm −15; nhẹ 10 điểm, cùng hệ quả nhóm 1 (a). **OK.**
- **4.2 — 128 dòng 諸事皆忌:** không chốt riêng; vào acceptance của policy `ALL_TABOO_FLOOR_V1`.
- **4.3 — 3 dòng `both_present`** nhẹ đi do Tứ Tướng +10 (cùng mẫu 405 `only_yi`). **OK.**

**Policy `ALL_TABOO_FLOOR_V1`** gộp nhóm 2 điểm 3 + nhóm 3 (25 `both_present`) + nhóm 4.2: một vòng code/Golden/diff, không rule trùng. Tập acceptance 128 + 25 + 8 event: [p4-all-taboo-floor-v1](sources/p4-vol10/p4-all-taboo-floor-v1/README.md).

Nhóm 5–7: chưa review.

## Quy ước (không phải regression)

- Month Jian theo ngày dân sự (CLOSED ở P4-C): 20 ngày trong fixture Jie lệch quy ước noon của Golden; 23 ngày Jie có 9h trước instant nhưng event 9h vẫn dùng Month Jian mới.
- Clause / cấp / 德 không lặp trong TSV: nối với Golden v2 (`compose/dated.tsv` `code`, `ji/grades.tsv`), cách nối trong [README dữ liệu](sources/p4-vol10/p4-migration-diff-v1/README.md).
- 5 sao alias thay sao âm lịch: ở full, 6.217 dòng không đổi kết luận chỉ khác `warnings` (`ALIAS_STAR_SWAP`); 7.294 dòng không đổi kết luận chỉ khác trace (`SCHEMA_ONLY`: field `Evidence` mới, dòng gỡ không đổi điểm). Probe stars-only: 13.440 dòng trên 420 ngày đổi `warnings`.

## Giới hạn

- **Không có ca thật cho 忌 protected/`preserve_bad`:** protected chỉ xuất hiện ở `only_ji`/`both_present`, nơi không gỡ âm. Bất biến 7 "protected lifted" chỉ kiểm bằng ca tổng hợp đóng băng (`p4MigrationRules.test.ts`), không bằng runner.
- **Thứ tự `both_present`/`neither_recorded`:** 0/1095 ngày có activity nhiều heading trộn hai trạng thái này → luật thứ tự giữa chúng không có hiệu lực trên dữ liệu thật (đã kiểm ở Golden điểm roadmap 8). Mutation đảo thứ tự này được thay bằng đưa `only_yi` lên đầu.
- Mutation chạy ngày mẫu (~1 phút/mutation); mỗi mutation phải sinh đúng thông điệp bất biến trên ngày mẫu nên đã chứng minh lỗi tới dòng được kiểm.
- Single agent: luật, harness và adapter cùng tác giả; luật khóa trước dữ liệu, oracle độc lập là Golden v2 (presence, Month Jian) và Golden điểm v1 (trạng thái activity).
- Event có/không giờ: cột `events_hour_differs` của fixture Jie = 1 ở mọi ngày, đều là `receive_vehicle`, và như vậy ở cả baseline lẫn full trên mọi 1098 ngày (tiêu chí giờ của event đó, không do Month Jian hay P4).

## Việc cho roadmap 10

Nạp `p4AlmanacHeadings` trước almanac đầu tiên; bật flag + 21 thần + P5; UI dòng giải thích và nhãn "điểm trừ mặc định của ứng dụng"; `meaning` rỗng của 16 thần; smoke production ON rồi ON → OFF (rollback) trên desktop Chrome / Pixel 7 / Safari; bundle SHA.

## `ci:p4` chạy tay

Đủ chuỗi tại `d46e965` (commit sau chỉ docs): **EXIT 0 trong 3.310 s (~55 phút)**, tree sạch sau khi chạy. Gồm P4-B, P4-C, P5 12/12, puzhu:06 16/16, Golden v2, owner-rules toàn miền 6/6 + mutation 12/12, nối almanac toàn miền 10/10, mutation adapter 21/21, harness roadmap 9 toàn miền 8/8, mutation roadmap 9 14/14. Roadmap 9 thêm ~12 phút so với ~43 phút đo ở roadmap 8.
