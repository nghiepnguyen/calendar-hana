# Full Golden P4 v1 — báo cáo (roadmap 7, task 5.0–7.0)

2026-10-17, nhánh `claude/p4-full-golden`. Audit-only, không đổi runtime/điểm/manifest/flag.

Golden độc lập suy bằng Python, **đóng băng `b70913f`** trước mọi phép so engine; commit-proof `df9210d`. Chỉ mục: [README Golden](sources/p4-vol10/p4-full-golden-v1/README.md), [PRD](../../tasks/prd-p4-full-golden.md).

## Tóm tắt

| Task | Kết quả |
|---|---|
| 5.0 Oracle chéo | Mọi Golden từng phần đã khóa đều được tái tạo; mọi lệch đều đã phân loại, không có lệch chưa giải thích |
| 6.0 So engine | Miền ngày **31.507 / 31.755 trùng** (99,2%); 248 lệch, 100% thuộc lớp đăng ký trước. Miền context 14.794 trùng; mọi lệch đã phân loại. Phát sinh 1 SPEC_BUG mới (4 dòng) cần owner xem |
| 7.0 Mutation (b) | **18/18 bị self-check bắt** (8 FR-07 + 10 đảo ngược luật owner/precedence); 0 lọt |

## 5.0 — Oracle chéo với Golden từng phần

Các phép so này chạy bên trong derive (assert) trước khi đóng băng:

| Oracle đã khóa | Stage | Kết quả |
|---|---|---|
| Legacy 14 thần theo Month Jian (52 ca) | 3.1 presence | 52/52 |
| `jie-convention.json` (20 ngày giao tiết) | 3.1 | 20/20 |
| Context bridge v2 (13), named clauses (26 pillar) | 3.2a | đủ; số edge / override trùng audit |
| A03 等第 (13), A04a v2 (10), 又為 v2 (5), tập expected A05 | 3.2b | qua; 2 ngoại lệ A04a do H2-A, có ghi |
| Bảng 等第 so với clause, 720 context | 3.2e | 660 cặp, 0 conflict (560 agree, 100 相抵) |
| remaining-ji v8 (51 + 10), puzhu-end (8 + ca 四廢) | 3.2c | qua |
| Ngày âm: 58 record lịch tham chiếu + 1.095 ngày HKO; phase (13); soil (48 + 12 kỳ); ngày âm (9) | 3.2d | qua |
| puzhu:06 v3, miền ngày (5 heading × 1.095) | 3.3 | 5.444 trùng; lệch: 26 H1-B/F5, 5 H2-A |
| puzhu:06 v3, miền context (5 × 720) | 3.3 | 3.470 trùng; lệch: 101 chính sách E5 (納財 / 母倉), 24 H1-B/F5, 5 H2-A |
| Ghép ngày A04b v1 (7 ca, 32 heading) | 3.3 | 30 trùng; 2 lệch đều đã phân loại (E5, LATER_SCOPE 八專) |

P4-C (`yi-domains-v1`) và P5 (Golden D) là Golden độc lập engine. Chúng được dùng làm **input**, không phải oracle.

## 6.0 — So engine

[compare.py](sources/p4-vol10/p4-full-golden-v1-review/engine/compare.py) → [summary.json](sources/p4-vol10/p4-full-golden-v1-review/engine/summary.json), [diffs.tsv](sources/p4-vol10/p4-full-golden-v1-review/engine/diffs.tsv).

Cách ghép engine theo đúng `engineComparisonPlan` đã đăng ký trong lock:
- miền ngày: P4-C (`resolveP4YiDay`, 29 heading), đè bằng puzhu:06 (`resolveP4Puzhu06Day`) cho 5 heading và P5 (`resolveP4WarehouseDay`) cho 修倉庫;
- dùng các sweep đã commit; ngay trước khi so đã chạy lại 4 test kiểm bytes sweep với code hiện tại (5/5 qua);
- code engine P4 không đổi kể từ khi các sweep được sinh.

| Lớp (đăng ký trước) | Theo ngày | Context |
|---|---|---|
| Trùng | 31.507 | 14.794 |
| Không so (E5 `undetermined`; 修倉庫 không có context engine) | — | 4.658 |
| H1-B/F5 (gồm E3) | 82 | 50 |
| H1-B/F5, mẫu A04b: engine `undetermined`, Golden có 忌 được bảo vệ | 6 | — |
| F1 (巳日 → 行幸遣使) | 73 | 45 |
| E1 (復日/重日 「不註宜」) | 56 | 39 |
| H2-A (未月戊午) | 29 | 22 |
| CONTEXT_DATE_OPERAND_POLICY (E5) | — | 1.270 |
| **SPEC_BUG mới**: 德作建論 trong điều kiện remaining-ji | 2 | 2 |
| Chưa phân loại | **0** | **0** |

### SPEC_BUG mới — cần owner

Ngày 歲薄/逐陣/陰陽錯 (`deAsJian`): 2026-06-01 và 2027-05-27 安葬 (thin_year/pursuit), cùng hai context 巳丙午 và 未己未.
- **Golden:** derive coi 天德/月德/天德合/月德合 là 「德作建論不作德論」 cả khi xét điều kiện gỡ 忌 của 復日. Kết quả: 復日 giữ 忌 → `only_ji` / `both_present`.
- **Engine:** chỉ áp 德作建論 cho nhóm 德 có tên của A03. Kết quả: 復日 gặp 德 → không 忌 → `not_recorded` / `only_yi`.
- **Nguồn:** câu 「德作建論不作德論」 (卷十 offset 15011, 15079) nói về 德 của ngày, không giới hạn ở clause nào. Authority remaining-ji v7 lại không nói gì về điểm này.
- Lựa chọn của Golden **không được đăng ký trước đóng băng**, nên ghi thành SPEC_BUG thay vì xếp vào lớp có sẵn.
- Còn một điểm không nhất quán **bên trong Golden** (context 未己未): 天德合/月德合 vẫn được tính làm 宜 cho 安葬, nhưng không được tính khi gỡ 忌 復日.
- Cần owner chọn phạm vi của 德作建論: (i) áp cho mọi chỗ dùng 德 (cả 宜 lẫn điều kiện gỡ 忌), (ii) chỉ áp cho A03 như engine, hoặc (iii) giữ như Golden hiện tại.
  - Chọn (i) hoặc (ii) thì phải ra Golden v2. Không sửa v1.

### Đọc kết quả

- Mọi lệch đều đến từ quyết định owner chưa có trong engine (H1-B/F5, F1, E1, H2-A), từ quy ước miền context (E5), hoặc từ SPEC_BUG nêu trên.
- **Không có ENGINE_BUG ngoài các luật owner.** Trên các luật đã nghiệm thu (P4-B/P4-C/P5/puzhu:06), engine và Golden độc lập cho cùng trạng thái.
- 6 dòng mẫu A04b (栽種, 月厭 相抵 + 地火 + 忌 được bảo vệ): engine báo `undetermined` vì tầng A04b phán trước khi thấy 忌 bảo vệ của tầng sau. Khi cài H1-B vào engine thì các dòng này tự hết.

## 7.0 — Mutation (phương án b)

[scripts/audit-p4-full-golden-mutations.py](../../scripts/audit-p4-full-golden-mutations.py) → [report.json](sources/p4-vol10/p4-full-golden-v1-review/mutation/report.json).

- Mỗi mutation sửa một script trong worktree tạm, sinh lại toàn chuỗi derive, ghi lại check nào bắt; worktree được reset sau mỗi lần.
- Kết quả: **18/18 bị self-check bắt**, 0 chỉ bị bắt nhờ bytes đóng băng, 0 lọt.

| Nhóm | Mutation | Bị bắt ở |
|---|---|---|
| FR-07 | M01 bỏ thần dormant (四窮) | presence: không dựng được witness cấu trúc (bắt ngầm qua StopIteration) |
| | M02 Month Jian lệch một tiết (proxy cho tháng âm) | presence: assert Jie / Golden legacy |
| | M03 ANY → ALL | compose: oracle puzhu:06 v3 |
| | M04 bỏ ngoại lệ 專忌 | compose: puzhu:06 SPEC_GAP |
| | M05 unknown → absent | checks: tập 宜 chưa biết |
| | M06 gộp 亦從宜亦從忌 với 不註 | scopes: Golden A04a |
| | M07 bỏ nhánh 德 | scopes: Golden A03 |
| | M08 lan truyền hai lượt (duplicate effect) | owner_checks: lan truyền một lượt |
| Luật owner / precedence | M09 lan truyền bỏ qua bảo vệ; M10 bỏ puzhu:28; M11 hoàn H2-A; M12 hoàn H1-B; M13 hoàn F1; M14 hoàn E1; M15 hoàn E3; M16 bỏ 德作建論; M17 biên Jie theo trưa; M18 chọn clause theo vị trí | compose / scopes / context_ji / checks / owner_checks |

- [owner_checks.py](sources/p4-vol10/p4-full-golden-v1-review/owner_checks.py) được thêm **sau khi đóng băng**: chỉ đọc output đã khóa để kiểm E1, E3 và lan truyền một lượt, không ghi dữ liệu expected nào nên lock không đổi. Trước khi có file này, M08/M14/M15 chỉ bị bắt nhờ bytes đóng băng.
- Mutation về cap trước resolution, event đọc raw và penalty trùng thuộc roadmap 8.

## Giới hạn

- Single agent (Claude); owner review ở task 8.0.
- Presence và danh sách 忌 lấy từ authority đã khóa, không suy lại từ văn gốc. Nếu authority đọc sai nguồn, engine và Golden sẽ sai giống nhau.
- Engine được ghép từ các sweep đã commit (được test kiểm bytes), không gọi trực tiếp trong phép so.
- Miền context chưa so 修倉庫.
