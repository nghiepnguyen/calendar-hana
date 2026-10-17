# PRD — Roadmap 7b: engine audit-only cài luật owner, kiểm bằng Golden v2

Ngày: 2026-10-17. Trạng thái: **owner duyệt 2026-10-17**.

## 1. Bối cảnh

Golden v2 (`c574e57`, PR #66) đã được owner nghiệm thu. Đây là oracle đầy đủ của lớp resolution: 31.755 dòng ngày (1.095 ngày × 29 heading) và 20.880 dòng context.

So với engine hiện tại (ghép từ `resolveP4YiDay` → `resolveP4Puzhu06Day` → `resolveP4WarehouseDay`), Golden v2 lệch 248 dòng ngày. Mọi lệch đều đã chứng minh được nguyên nhân bằng cách đảo luật ([attribution.json](../docs/audits/sources/p4-vol10/p4-full-golden-v2-review/engine/attribution.json)):

- luật owner mà engine chưa cài: H1-B/F5, E3, H2-A, F1, E1, (i);
- hai ENGINE_BUG: E1 (bỏ vế 「亦不註宜」) và phân tầng A04b (6 dòng 栽種);
- quy ước context E5.

Mục 8 (adapter điểm, flag OFF) phải dựa trên một lớp resolution khớp Golden. Vì vậy 7b đi trước 8 (owner, 2026-10-17).

## 2. Goals

1. Thêm một layer **opt-in, audit-only** trong `shared/lunar/`:
   - entry đề xuất: `resolveP4OwnerRulesDay(month, pillar, operands)`;
   - trả trạng thái 29 heading đúng Golden v2;
   - không import vào pipeline production; runtime, điểm, manifest và flag giữ nguyên.
2. Khớp Golden v2:
   - **miền ngày**: 31.755/31.755 dòng ở các cột `state`, `ji`, `protected`;
   - **context**: mọi dòng Golden không `undetermined` theo E5 (gồm cả 修倉庫, phần mà v1/v2 chưa so được).
3. Mọi luật có trace: reason code tương đương cột `code` của Golden, ít nhất ở phần quyết định (`primary`, nguồn 忌, nguồn bảo vệ).
4. Mutation suite riêng bắt hết; đưa vào `ci:p4` (chạy tay).

## 3. Functional requirements

- **FR-01 Golden-first.**
  - Viết test đọc Golden v2 (`compose/dated.tsv`, `compose/context.tsv`) và cho chạy **đỏ** trên một stub trước khi có code.
  - Golden v2 không được sửa. Nếu phát hiện lỗi Golden thì phân loại và ra v3 theo đúng quy trình.
- **FR-02 Luật cần cài** (căn cứ: [review sheet](../docs/audits/p4-full-golden-review.md), [hold-questions](../docs/audits/p4-full-golden-hold-questions.md), README Golden):

| Mã | Ở đâu trong engine |
|---|---|
| H2-A | Nhóm 德願 của A03: bỏ 天願 khỏi nhóm 德 có tên khi có `no_de_yuan` |
| (i) | 德作建論 cho mọi chỗ dùng 德: 宜 evidence, trigger puzhu:06, quy tắc D của 修倉庫, điều kiện gỡ 忌 của remaining-ji |
| F1 | 百忌 巳日「出行」 → 行幸遣使 (專忌, bảo vệ) |
| E1 | 復日/重日 `no_annotation` → 不註 cả 宜 lẫn 忌 |
| H1-B/F5 | Ghép ngày: 忌 không bảo vệ + 相抵 scope khác → 忌 giữ, 宜 không ghi |
| E3 | Lan truyền gỡ 忌 mà heading còn 相抵 → `neither_recorded` |
| A04b | Không phán `undetermined` ở tầng A04b trước khi gom đủ 忌 được bảo vệ của các tầng sau |
| Scope undetermined | Chỉ các heading của scope đó `undetermined` (spec §4), không phải cả ngày |
| E5 (context) | Context chỉ xác định khi bất biến trên soil × ngày âm (12/15/khác) × phase |

- **FR-03 Không phá layer cũ.** `resolveP4YiDay` / `resolveP4Puzhu06Day` / `resolveP4WarehouseDay` và sweep của chúng giữ nguyên bytes. Layer mới bọc hoặc tái dùng chúng. Các test và Golden cũ vẫn xanh.
- **FR-04 Sweep.** Ghi TSV 1.095 × 29 cùng context, kèm diff so với Golden v2 (kỳ vọng 0 lệch), tái tạo được từ test (verify bytes / chế độ write).
- **FR-05 Mutation.**
  - Runner `scripts/audit-p4-owner-rules-mutations.py`, có lượt đối chứng sạch.
  - Ít nhất một mutation cho mỗi luật ở FR-02; tất cả phải bị test bắt.
  - Thêm runner vào `ci:p4`.

## 3b. Quyết định owner sau implementation (2026-10-17)

- **FR-03 (hook):** giữ cách cài trong layer. Ba file engine cần hook nằm trong lock đóng băng của P4-C (`yi-freeze-v1`), nên H2-A và (i) cho remaining-ji được cài trong `p4OwnerRules.ts`. Test toàn miền kiểm phần chạy lại remaining-ji trùng engine trên đủ 720 context. Việc đưa logic vào engine (lock P4-C mới) để tới **mục 10** (activation).
- **FR-04 (sweep):** thay bằng phép so toàn miền với Golden v2 (0 lệch, gồm trace) cộng `docs/audits/p4-owner-rules-summary.json`, được kiểm bytes trong `ci:p4`.
- **FR-05 (mutation):** luật trigger puzhu:06 của (i) được tách thành hàm thuần `p4Puzhu06Triggers` và có unit test riêng, nên mọi mutation đều bị bắt.

## 4. Non-goals

- Score adapter, cap, event, penalty: mục 8. Migration diff: mục 9. Activation: mục 10.
- Đổi Golden, authority hay runtime production.
- Chứng nhận S1 (土王用事 canonical).

## 5. Acceptance

1. Golden v2 khớp 100%: miền ngày đủ 31.755 dòng; context mọi dòng ngoài E5.
2. Có test đỏ được commit trước code (bằng chứng Golden-first).
3. Mutation bắt hết, nằm trong `ci:p4`. `ci:local` xanh; chạy `ci:p4` tay một lần trước khi merge.
4. Runtime và bundle không đổi; diff chỉ gồm module audit-only, test, script và docs.
5. Có báo cáo `docs/audits/p4-owner-rules-engine.md`; cập nhật PROJECT_CONTEXT.

## 6. Rủi ro

- Các luật nằm sâu ở nhiều tầng (A03, A04b, remaining-ji, puzhu:06, P5). Bọc sau cùng có thể không đủ, khi đó phải tái hiện một phần composer. Ưu tiên tái dùng hàm sẵn có và thêm tham số opt-in, không sửa hành vi mặc định.
- Golden được suy bằng Python, engine viết bằng TS: hai nơi có thể hiểu sai giống nhau. Bù lại, mutation của cả hai phía cộng với oracle chéo giúp giảm rủi ro này.
- `ci:p4` sẽ dài thêm (sweep toàn miền + mutation).
