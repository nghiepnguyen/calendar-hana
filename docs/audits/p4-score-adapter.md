# Roadmap 8 — adapter điểm P4 sau flag `xiejiVol10BalancingEnabled` = OFF

2026-10-18, nhánh `claude/p4-adapter`, **MERGED & DEPLOYED** [PR #69](https://github.com/nghiepnguyen/calendar-hana/pull/69) (`7d7596f`, [deploy 39090860176](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39090860176) SUCCESS). Roadmap 9 (migration diff) xong và deploy `9865eee`: [báo cáo](p4-migration-diff.md). Production **không đổi**: flag `false` trong manifest, baseline flag OFF byte-equal. [PRD](../../tasks/prd-p4-score-adapter.md) (quyết định owner §6.1–6.14), [spec](../plans/p4-xieji-vol10-balancing.md) §4.1, §4.2, §5.

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| Flag OFF (goal 2) | [Baseline v1](sources/p4-vol10/p4-adapter-baseline-v1/lock.json) (`1609264`, đóng băng trước code) xanh: 32 activity × 1098 ngày + 11 event × {không giờ, 9h}, sha256 toàn output, file baseline không đổi. Test còn assert manifest ship `false` |
| Golden điểm (FR-01) | [p4-score-golden-v1](sources/p4-vol10/p4-score-golden-v1/README.md): Python độc lập engine, đóng băng + test đỏ `47e8438` **trước** adapter. Lớp A 25 ca tính điểm (ghim từng dòng `rawDelta`/`preCapDelta`/`scoreDelta`/`evidenceOrigin`/penalty) + 5 ca baseline; lớp B trạng thái activity 1098 ngày × 29 activity = 31.842 dòng. Xanh 33/33 |
| Nối almanac (goal 3, §6.1) | 21 thần dormant theo Month Jian khớp presence Golden v2 trên 1095/1095 ngày; heading state từ `resolveP4OwnerRulesDay` khớp lớp B 31.842/31.842; activity baseline giữ điểm/status/hard warning flag OFF |
| Ngoài miền (goal 4) | 2024-12-31, 2028-01-01, 2035-06-15: flag ON = toàn bộ output flag OFF (sha mọi recommendation), không sao dormant (owner §6.14) |
| Không throw (goal 5) | Lỗi resolver, ngoài miền hoặc chưa nạp provider → `{}` → mọi activity baseline |
| Event (FR-05) | 4 ngày làm chứng `very_high` (quét toàn miền, flag ON, đều qua adapter): còn âm applied → fail; âm chỉ bị gỡ → pass; hard warning → fail; −25 → fail. Logic event không đổi |
| Mutation (FR-07) | [Runner](../../scripts/audit-p4-score-adapter-mutations.py), [kết quả](p4-score-adapter-mutation-results.json): lượt đối chứng sạch, **21/21 bị bắt**, khoảng 2 phút; trong `ci:p4` |
| Bundle (FR-08) | `index` 1.256,17 → 1.256,83 kB (+0,66 kB; gzip 372,72 → 372,97). Import tĩnh resolver sẽ là +409 kB (gzip +91 kB) nên resolver ở sau provider |
| Thời gian (FR-08) | Flag OFF: test baseline 21,0 s (trước ~22 s), không gọi resolver. Flag ON: resolver ~32 ms/ngày |
| Unit | 8.104 pass (216 file); lint, typecheck sạch |
| `ci:p4` (chạy tay) | Đủ chuỗi tại `4d3d1bf` (+ docs): **EXIT 0 trong khoảng 43 phút** — P4-B, P4-C, P5 12/12, puzhu:06 16/16, Golden v2 (đối chứng sạch), owner-rules toàn miền 6/6 + mutation 12/12, nối almanac toàn miền 10/10, mutation adapter 21/21 |

> **Roadmap 9b (2026-10-18)** thay §6.6 phía 忌 và §6.11 bằng `MULTI_HEADING_JI_WINS_V1` / `ALL_TABOO_FLOOR_V1`, Golden điểm v1 → v2: [báo cáo 9b](p4-9b.md).

## Thiết kế

- **Flag.** `manifest.policies.xiejiVol10BalancingEnabled: false`; `ActivityInput.xiejiVol10BalancingEnabled` ghi đè (test). Field `Evidence` mới (`preCapDelta`, `evidenceOrigin`, `policyId`, `sourceClauseId`, `balancingEligible`) chỉ xuất hiện khi ON.
- **Trạng thái activity** — [`p4ActivityState`](../../shared/lunar/p4ScoreAdapter.ts): heading 卷十一 của activity; có heading `not_recorded`/`undetermined`/thiếu → `baseline`; còn lại lấy chặt nhất `only_ji` > `both_present` > `neither_recorded` > `only_yi` (policy `p4_multi_heading_strictest`).
- **Adapter** — `applyP4Balancing` (activity không baseline): dòng thần chưa cap → gỡ theo dấu (dòng informational 0, tag `classical` để status `neutral` khi gỡ hết) → 忌 protected (khớp `han`) và `preserve_bad` không bị gỡ → một −25 `product_policy_default_penalty` khi `only_ji` (cả 諸事皆忌) không còn âm applied (thần bị Trực bao không tính) → phân bổ cap một lần theo nguồn, thứ tự catalog, penalty cuối pool âm; Trực không cap. 6 chain 卷十 bỏ cho activity này.
- **Activity baseline khi ON**: đường flag OFF, bỏ 21 thần dormant khỏi danh sách điểm và khỏi presence của 6 chain.
- **Almanac** — chỉ khi flag ON **và** provider đã nạp **và** ngày trong 2025–2027: thêm 21 thần (sao sau legacy, thứ tự catalog; 5 sao alias âm lịch `Phổ Hộ (Hội Hộ)`, `Phi Ma Sát (Tai Sát)`, `Nguyệt Hư (Nguyệt Sát)`, `Nguyệt Yếm Đại Hoạ`, `Vãng Vong (Thổ Kỵ)` bị thay như legacy 14) và truyền heading state. Legacy 14 không đổi (Month Jian ở cả hai trạng thái, spec §2/§5).
- **Provider** — [`p4AlmanacHeadings.ts`](../../shared/lunar/p4AlmanacHeadings.ts) gọi resolver với operand ngày (ngày âm, phase, soil, 母倉) và tự đăng ký khi được import. Chưa nạp → balancing không chạy, nên không thể phát hành trạng thái chỉ-21-thần (spec §5).

## Quyết định owner trong roadmap

§6.1–6.4 (2026-10-17), §6.5–6.13 (2026-10-18, gồm 諸事皆忌 chỉ −25 khi thiếu âm; gỡ hết → `neutral`; thần bị Trực bao không chặn −25), §6.14 (2026-10-18, ngoài miền = baseline toàn bộ). Chi tiết trong PRD.

## Mutation (21/21 bị bắt)

FR-02 từng hàng (從宜不從忌, 從忌不從宜, 亦從宜亦從忌 ≠ 不註), protected, `preserve_bad`, đổi thứ tự both/neither, bỏ luật `not_recorded`, bỏ penalty, −25→−24, penalty mỗi heading (dedup), penalty bị thần bị bao chặn, cap trước resolution, giữ 6 chain khi ON, dormant trên activity baseline, bỏ một thần dormant, giữ sao alias, bỏ guard miền, resolver throw, không truyền 諸事皆忌, event đọc âm gốc thay applied, flag mặc định ON.

## Giới hạn

- **Mutation sống sót (không trong runner):** cho ID dormant vào presence của 6 chain không đổi điểm/status/hard warning nào trong 2025–2027 (đã chạy toàn miền). Bộ lọc giữ làm phòng vệ.
- **Trong miền, so baseline chỉ ở điểm/status/hard warning:** thay sao alias đổi `warnings`, nên recommendation toàn phần khác baseline có chủ đích.
- **§6.13 không tách được bằng catalog** (chỉ 月破 bị 破日 bao, mọi activity của nó có Trực âm): kiểm bằng unit test `applyP4Balancing`.
- **Protected chỉ xuất hiện ở `only_ji`/`both_present`** trong Golden v2, nên luật protected chỉ kiểm bằng ca tổng hợp; thần 百忌日 đã có `preserve_bad`.
- Golden điểm và adapter cùng tác giả (single agent); Golden chỉ đọc catalog + Golden v2 đóng băng.

## Việc cho roadmap 9/10

- **Roadmap 9:** phân rã tác động "resolution trước cap" (đổi điểm cả ngày không có dormant), TSV 4 cấu hình; recommendation khác baseline do warnings sao alias.
- **Roadmap 10:**
  - nạp `p4AlmanacHeadings` (dynamic import) **trước** almanac đầu tiên, vì almanac được memoize;
  - 16 thần dormant không có sao alias hiện `meaning` rỗng;
  - dòng giải thích spec §5 ("có sao" / "kỵ đã được gỡ" / "kỵ vẫn áp dụng") và nhãn "điểm trừ mặc định của ứng dụng" trên UI;
  - chi phí ~32 ms/ngày khi ON.
