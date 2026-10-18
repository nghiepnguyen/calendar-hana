# Roadmap 9 — migration diff 4 cấu hình + rollback flag `xiejiVol10BalancingEnabled`

2026-10-18, nhánh `claude/p4-migration-diff` (đặt trên `claude/p4-adapter`, PR #69 chưa merge). Production **không đổi**: flag `false`, không sửa runtime. [PRD](../../tasks/prd-p4-migration-diff.md) (owner §6.10), [spec](../plans/p4-xieji-vol10-balancing.md) §7.2, §9 điều kiện 4. **Chờ owner go-live review** — dừng ở đây, chưa sang roadmap 10.

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

Đủ chuỗi tại `d46e965` (commit sau chỉ docs): **EXIT 0 trong 3.310 s (~55 phút)**, tree sạch sau khi chạy. Gồm P4-B, P4-C, P5 12/12, puzhu:06 16/16, Golden v2, owner-rules toàn miền 6/6 + mutation 12/12, nối almanac toàn miền 10/10, mutation adapter 21/21, harness roadmap 9 toàn miền 8/8, mutation roadmap 9 14/14. Roadmap 9 thêm ~20 phút (roadmap 8 ~43 phút).
