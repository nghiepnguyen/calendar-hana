# PRD — P5: warehouse (修倉庫 co-presence, 開倉庫出貨財)

Ngày: 2026-10-16.
Trạng thái: PRD đã chốt hướng đọc nguồn; chưa triển khai.
Quyết định owner (2026-10-16): **D — giao hai bản**. 修倉庫 qua mệnh đề đồng hiện chỉ được ghi 宜 khi cả cách đọc 卷十 (月恩, partner riêng từng thần) và cách đọc 卷十一 (月德, partner chung) đều cho 宜. Hai cách đọc lệch nhau → `undetermined`, phân loại `SOURCE_DEPENDENT`. Không chọn một bản, không lấy hợp.

## 1. Introduction / Overview

P4-C (PR #55, `9afd39f`) đã ghép đủ 11 operand 宜, nhưng heading `修倉庫` vẫn hoãn sang P5: sweep 2025–2027 còn **539 heading-ngày `undetermined` do P5**. Nguyên nhân là heading này có mệnh đề đồng hiện 「又…與…併者」, không phải danh sách ANY phẳng, và hai quyển 協紀 chép khác nhau.

P5 khóa predicate warehouse theo quyết định D, đóng băng Golden độc lập trước code, ghép vào audit ngày và đo lại 31.755 dòng. P5 cũng kiểm `開倉庫出貨財` (mở kho xuất hàng) theo spec §6: heading này đã có danh sách 宜 phẳng và propagation `puzhu:22`, nên P5 chỉ xác minh và báo cáo lỗ hổng, không viết lại.

Đây là roadmap mục 6 của [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), theo [spec cân bằng 卷十 §6](../docs/plans/p4-xieji-vol10-balancing.md). P5 audit-only: không đổi runtime, điểm, manifest hay flag.

## 2. Nguồn đã đọc (cần khóa lại trong bước authority)

**卷十一, heading 修倉庫** (`shared/almanac-data/xiejibianfangshu-yiji.json`, raw/scan 06067687.cn trang 39–40):

> 宜 天德月德天德合月德合天赦天願三合滿日又收日母倉六合五富天倉與月德四相時德開日併者

**卷十, từng entry** (`docs/audits/sources/p4-vol10/vol10.raw.txt`):

| Thần chính | Câu 卷十 | Partner theo 卷十 |
|---|---|---|
| 收日 | 「與月恩四相時德併宜修倉庫」; lời bàn: 「若開日則雖宜修造不得與收日併若德合赦願則自宜修倉庫又不待與收日併也」 | 月恩, 四相, 時德 |
| 母倉 | 「與月恩四相開日併宜修倉庫」 | 月恩, 四相, 開日 |
| 六合 | 「與月恩四相時德併宜修倉庫」 | 月恩, 四相, 時德 |
| 五富 | 「與月恩四相時德併宜修倉庫」 | 月恩, 四相, 時德 |
| 天倉 | 「與月恩四相開日併宜修倉庫」, ghi chú 「時德不得與天倉併」 | 月恩, 四相, 開日 |

Thần trực tiếp (天德, 月德, 天德合, 月德合, 天赦, 天願, 三合, 滿日) ghi 修倉庫 trong 宜 ở cả hai quyển (卷十 các entry 二德, 天赦, 天願, 三合, 滿日). Phần này không có xung đột và giữ ANY như P4-C.

**卷十一, heading 開倉庫出貨財:** 宜 「月恩四相時德滿日五富」 (danh sách phẳng). 鋪註: `puzhu:22` 「凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌」; 「凡徳合赦願月恩四相時徳等日不註忌…開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌」; 百忌日 甲日 忌開倉庫出貨財 (專忌).

## 3. Goals

1. Khóa authority predicate 修倉庫 theo D: nguyên văn, locator, offset, checksum cả hai quyển; bảng partner từng cách đọc; kết quả D cho mọi tổ hợp.
2. Đóng băng Golden độc lập trước implementation, gồm negative fixture cho đồng hiện không thể.
3. Ghép predicate vào audit ngày. 修倉庫 hiện có `yi: undefined` trên **cả 1.095 ngày** (baseline task 1); 539 dòng `undetermined` là phần lộ ra, 556 dòng còn lại có state nhờ 忌 nhưng 宜 vẫn chưa xác định (158 dòng có thần trực tiếp). Mọi dòng 修倉庫 phải được giải thành 宜 / không 宜 / `undetermined SOURCE_DEPENDENT` / unknown do thiếu operand, mỗi dòng có lý do.
4. Xác minh 開倉庫出貨財 trên dữ liệu thật: ANY phẳng, `puzhu:22`, suppression 德合赦願…, 甲日 專忌, 月煞 (alias 月虛) và 月厭 riêng.
5. Giữ nguyên runtime production, scoring, manifest và authority P4-B/P4-C đã chốt.

## 4. Functional Requirements

### 4.1. Authority

**FR-01.** Authority mới (đề xuất `p5-warehouse-v1`) ghi cho mỗi thần chính: stable ID, nguyên văn 卷十 và 卷十一, volume/locator, raw SHA-1, offset Unicode code point, scan locator. Ghi rõ status `OWNER_ADOPTED_SOURCE_DEPENDENT` cho phép giao D, ngày quyết định 2026-10-16, và rằng đây không phải canonical.

**FR-02.** Hai cách đọc phải được biểu diễn riêng, không gộp:

- **R10 (卷十):** `base AND ANY(partners10[base])`, với `partners10` như bảng §2.
- **R11 (卷十一):** `base AND ANY(月德, 四相, 時德, 開日)` cho cả năm base.

Danh sách 「與…併」 là ANY, không phải ALL (spec §6).

**FR-03.** Kết quả mệnh đề đồng hiện theo D, với mỗi base có mặt:

| R10 | R11 | Kết quả |
|---|---|---|
| 宜 | 宜 | 宜 (`agreed`) |
| không | không | không 宜 (`agreed_absent`) |
| 宜 | không | `undetermined`, `SOURCE_DEPENDENT` |
| không | 宜 | `undetermined`, `SOURCE_DEPENDENT` |
| unknown ở bất kỳ bên nào mà bên còn lại không đủ quyết | | unknown (thiếu operand), không phải SOURCE_DEPENDENT |

Hệ quả cần Golden kiểm: partner chung của hai bản là 四相 (mọi base), 時德 (收日/六合/五富), 開日 (母倉/天倉). Tổ hợp lệch: base + chỉ 月恩 (R10 có, R11 không); 六合/五富 + chỉ 開日, 母倉 + chỉ 時德 (R11 có, R10 không). 月德 trong R11 trùng thần trực tiếp nên có mặt thì heading đã có 宜 trực tiếp.

**FR-04.** Thứ tự ghép heading 修倉庫: thần trực tiếp present → 宜 (giữ ANY P4-C, 德合赦願 「自宜修倉庫，不待與收日併」); nếu không, xét mệnh đề đồng hiện theo FR-03 trên mọi base có mặt: có một base `agreed` → 宜; còn lại có base lệch → `undetermined SOURCE_DEPENDENT`; mọi base đều `agreed_absent` hoặc absent và không còn operand unknown → không 宜. Unknown operand phải được ghi trong trace kể cả khi heading đã xác định.

**FR-05.** Đồng hiện không thể phải có negative fixture và chứng minh bằng phép tính độc lập, không chỉ ghi chú: 收日 + 開日 (Trực khác nhau); 天倉 + 時德 (ghi chú nguồn). Nếu phép tính 720 context tìm thấy đồng hiện mà nguồn bảo không thể → dừng, phân loại `SPEC_BUG`/`GOLDEN_BUG`, không tự sửa.

**FR-06.** Không dùng presence 母倉 (OWNER_ADOPTED_SOURCE_DEPENDENT, coverage 2025–2027) ngoài coverage; ngoài coverage → unknown.

### 4.2. 開倉庫出貨財

**FR-07.** Không đổi predicate. Xác minh trên 31.755 dòng và 720 context: 宜 = ANY(月恩, 四相, 時德, 滿日, 五富); `puzhu:22` chỉ lan khi đủ 開市 và 立券交易 (`requireAll`); 甲日 專忌 giữ 忌 qua mọi lift; suppression 「德合赦願月恩四相時德等日不註忌…」 tôn trọng 遇德猶忌 / 從忌不從宜; 月煞 (月虛) 「又為月虛忌修倉庫開倉庫出貨財」 và 月厭 được kiểm riêng, không gỡ hết penalty warehouse chỉ vì có một cát thần.

**FR-08.** Lỗ hổng tìm được ghi vào báo cáo với phân loại (`ENGINE_BUG`, `SPEC_BUG`, …). Sửa chỉ khi có Golden khóa trước và lý do nguồn; sửa nằm trong P5 nếu là audit-only, còn nếu cần đổi runtime thì tách việc riêng và hỏi owner.

**FR-09.** `修倉庫` và `開倉庫出貨財` là hai activity khác nhau (`warehouse` / `warehouse_opening`). Không dùng miễn kỵ mở kho để cho phép sửa kho, và ngược lại.

### 4.3. Golden, kiểm tra, báo cáo

**FR-10.** Golden (đề xuất `golden-p5-warehouse-v1`) đóng băng bằng commit/checksum trước implementation; expected suy từ nguồn và phép tính operand độc lập (Python reference như P4-C), không import resolver/composer đang kiểm.

**FR-11.** Coverage tối thiểu (spec §7.1 phần warehouse): base-only, partner-only, từng partner riêng, nhiều partner, mọi tổ hợp lệch R10/R11, đồng hiện không thể, 德 độc lập, unknown operand mỗi phía, ngoài coverage 母倉, sửa kho khác mở kho. Toàn miền 12 × 60 = 720 context cho phần chỉ phụ thuộc Month Jian × pillar; 母倉 soil và 時德/月恩/四相 theo mùa dùng miền ngày riêng.

**FR-12.** Baseline trên cùng 1.095 ngày × 29 heading, cùng input đã khóa, ghi commit/tree. Báo cáo sau có cột: base có mặt, partner có mặt, kết quả R10, R11, D, trạng thái heading trước/sau, lý do. Summary tách: 539 dòng P5 trước → phân rã sau (宜 / không / SOURCE_DEPENDENT / unknown); 103 dòng `undetermined` ngoài scope giữ nguyên hay đổi và vì sao; 0 regression P4-B/P4-C.

**FR-13.** Mutation tuần tự, bắt bằng assertion, phục hồi bytes. Tối thiểu: ANY partner → ALL; bỏ 四相; đổi 月恩 ↔ 月德; D → hợp (union); D → chỉ R10; D → chỉ R11; SOURCE_DEPENDENT → absent; bỏ đường 德合赦願 trực tiếp; cho 收日 + 開日; dùng 母倉 ngoài coverage; 開倉庫 bỏ 甲日 專忌; 開倉庫 bỏ `requireAll`. Nối gate CI (path-gate P4 hiện hành bao `shared/lunar/p4*`, `scripts/audit-p4-*`; module P5 đặt tên theo đó hoặc mở rộng path).

**FR-14.** Trước nghiệm thu: unit/gate, regression A04b/P4-B/P4-C, build, typecheck main/functions, lint, CI. Runtime/manifest không đổi; kiểm bằng so bundle với build local cùng SHA (thay `builtAt`, xem PROJECT_CONTEXT §2). `graphify update .` sau sửa code.

**FR-15.** Cập nhật audit report, task list, `docs/audits/p4-vol10-progress.md` và PROJECT_CONTEXT.md theo evidence.

## 5. Non-Goals

- Score adapter, penalty, flag `xiejiVol10BalancingEnabled`, activation, UI (roadmap 8–10).
- Full Golden P4 720 context × mọi heading (roadmap 7); P5 chỉ khóa Golden cho warehouse.
- Chọn canonical giữa 月恩 và 月德, hay nâng D thành canonical. S1 soil vẫn OPEN.
- P1 百忌日, 21 thần dormant activation, personal/Bazi.
- Merge/deploy tự động; vẫn hỏi owner.

## 6. Technical Considerations

Điểm xuất phát:

- `shared/almanac-data/p4-vol10-day-composition-v2.json` → `yiEvidence`/deferred: `修倉庫` P5. Artifact mới cần version riêng, không sửa bytes v2.
- `shared/lunar/p4YiDayComposition.ts`, `p4YiDayCore.ts`, `p4YiFullDayCore.ts`, `p4YiPredicates.ts`, `p4YiTrace.ts`: chỗ ghép 宜 và trace `deferred: 'P5'`.
- `shared/lunar/p4YiWarehouse.test.ts`, `docs/audits/sources/p4-vol10/yi-warehouse-v1/`: contract hiện hành giữ 修倉庫 unknown; P5 thay contract này qua version mới.
- `docs/audits/sources/p4-vol10/yi-comparison-v1/README.md` dòng P5 月恩/月德: evidence xung đột đã khóa.
- `shared/lunar/p4YiOperands.ts`: presence 母倉, 天倉 (cần kiểm đã có operand chưa), 五富, 六合, 收日, 月恩, 四相, 時德, 開日.
- `docs/audits/p4-vol10-yi-operands-2025-2027.tsv`: baseline dòng `warehouse_deferred`.

Tên file đề xuất: `shared/almanac-data/p5-warehouse-v1.json`, `shared/almanac-data/golden-p5-warehouse-v1.json`, `shared/lunar/p4Warehouse.ts` (+ test), `docs/audits/p5-warehouse.md`, TSV/summary trước–sau, `scripts/audit-p4-warehouse-mutations.py` (tên `p4*` để vào path-gate CI sẵn có).

Thứ tự: baseline → authority → Golden freeze → test đỏ → implementation → sweep/mutation/regression/CI → nghiệm thu. Kiểm callers trước khi đổi symbol (`graft callers`).

## 7. Acceptance Gate

P5 hoàn tất khi **tất cả** đúng:

1. Authority warehouse khóa đủ năm base × hai cách đọc, nguyên văn/offset/checksum/scan; status D ghi rõ OWNER_ADOPTED_SOURCE_DEPENDENT.
2. Golden độc lập freeze trước code; lock P4-B/P4-C cũ giữ bytes.
3. Cả 1.095 dòng 修倉庫 (gồm 539 dòng P5) đều được giải với lý do; không còn `deferred: 'P5'`. Dòng `SOURCE_DEPENDENT` được đếm và liệt kê riêng, không tính là lỗi và không tính là 宜.
4. Đồng hiện không thể: 0 trường hợp trên 720 context và 1.095 ngày, hoặc dừng và báo.
5. 開倉庫出貨財: FR-07 qua trên dữ liệu thật; lỗ hổng (nếu có) được phân loại và xử lý theo FR-08.
6. 0 unresolved operand 凶, 0 regression P4-B/P4-C, mọi mutation bị bắt, CI xanh.
7. Runtime/manifest/scoring bất biến.
8. Báo cáo và PROJECT_CONTEXT.md cập nhật.

## 8. Open Questions

- 天倉 đã có presence trong P4-C/legacy với provenance 協紀 chưa? Nếu chưa, cần authority riêng trước Golden (có thể cần owner nếu nguồn lệch).
- 時德 / 月恩 / 四相 / 開日 có operand khóa cho đủ 1.095 ngày chưa (P4-C và context bridge)? Kiểm ở bước baseline.
- Reviewer: single agent, ghi giới hạn; không nhận là review độc lập thứ hai.
