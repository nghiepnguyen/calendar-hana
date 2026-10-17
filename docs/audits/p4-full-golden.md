# Full Golden P4 — báo cáo (roadmap 7, task 5.0–7.0)

2026-10-17, nhánh `claude/p4-full-golden`. Audit-only, không đổi runtime/điểm/manifest/flag.

Golden độc lập suy bằng Python, **đóng băng ở `b70913f`** trước mọi phép so với engine; commit-proof ở `df9210d`. Công cụ review sau đóng băng nằm ở [p4-full-golden-v1-review/](sources/p4-vol10/p4-full-golden-v1-review/), ngoài thư mục đã khóa. Xem thêm: [README Golden](sources/p4-vol10/p4-full-golden-v1/README.md), [PRD](../../tasks/prd-p4-full-golden.md).

## Golden v2 (hiện hành) — quyết định owner (i)

**v2 đóng băng ở `c574e57`**, proof `81024fb`, xem [README v2](sources/p4-vol10/p4-full-golden-v2/README.md). v1 giữ nguyên làm lịch sử; các mục bên dưới mô tả v1.

v2 = v1 cộng hai điểm:
- 德作建論 áp cho **mọi** chỗ dùng 德: 宜 evidence, trigger puzhu:06, quy tắc D của 修倉庫. Quy tắc D được cài lại và assert tái tạo đúng Golden P5 trên mọi dòng trước khi áp (i).
- Scope `undetermined` cả phạm vi làm các heading của nó thành `undetermined` (spec §4).

Khác v1: miền ngày **0** dòng đổi trạng thái (chỉ 6 dòng đổi 宜 evidence); context 11 dòng ở 4 context.

Review v2 ([p4-full-golden-v2-review/](sources/p4-vol10/p4-full-golden-v2-review/)):

| Hạng mục | Kết quả |
|---|---|
| Oracle chéo P5 (28.800 ô), P4-C `dayOverride` (720) | 0 lệch |
| So engine, miền ngày | **31.507 / 31.755 trùng**; 248 lệch, chưa phân loại 0 |
| So engine, context | 14.786 trùng; chưa phân loại 0 |
| Chứng minh nguyên nhân (đảo từng luật) | Phần dư **0** cả hai miền. Quyết định (i): 2 dòng ngày + 4 dòng context lệch engine; tầm ảnh hưởng 2 dòng ngày / 12 dòng context |
| Mutation | Lượt đối chứng sạch; **20/20 bị self-check bắt** (thêm M19 hoàn (i) ở 宜/trigger, M20 hoàn (i) ở quy tắc D). `owner_checks.py` kiểm thêm (i): không có thần 德合 nào làm 宜 trên ngày 德作建論; tính lại quy tắc D độc lập cho 修倉庫; ngày puzhu:28 không trùng ngày 德作建論. Runner trong `ci:p4` trỏ tới v2 |

Lớp lệch engine của v2 (theo nguyên nhân):
- OWNER H1-B/F5 (gồm E3), H2-A, DE_AS_JIAN_ALL (i);
- ENGINE_BUG E1;
- SPEC_BUG F1;
- ENGINE_BUG phân tầng A04b (6 dòng 栽種);
- CONTEXT_DATE_OPERAND_POLICY (E5).

Không còn SPEC_BUG nào mở. Số liệu chi tiết ở [attribution.json](sources/p4-vol10/p4-full-golden-v2-review/engine/attribution.json).

---

# Golden v1 (lịch sử)

> Các artifact trong `p4-full-golden-v1-review/` là ảnh chụp lịch sử của v1. Runner mutation hiện trỏ tới v2, nên `report.json` của v1 không còn verify lại được bằng runner.

## Tóm tắt

| Task | Kết quả |
|---|---|
| 5.0 Oracle chéo | Mọi Golden từng phần đã khóa đều được tái tạo; các cột presence của P5 (28.800 ô) và `dayOverride` của P4-C (720) khớp 0 lệch; mọi lệch đã phân loại |
| 6.0 So engine | Miền ngày **31.507 / 31.755 trùng** (99,2%). Mọi lệch ở cả hai miền **đã được chứng minh nguyên nhân** bằng cách đảo luật; phần dư bằng 0. Có 1 SPEC_BUG mới (4 dòng) cần owner quyết |
| 7.0 Mutation (b) | Lượt đối chứng sạch; **18/18 bị self-check bắt**; runner đã nối vào `ci:p4` |

## 5.0 — Oracle chéo

Các phép so chạy bên trong derive (assert) trước khi đóng băng:

| Oracle đã khóa | Stage | Kết quả |
|---|---|---|
| Legacy 14 thần theo Month Jian (52 ca) | 3.1 | 52/52 |
| `jie-convention.json` (20 ngày giao tiết) | 3.1 | 20/20 |
| Context bridge v2 (13), named clauses (26 pillar) | 3.2a | đủ; số edge / override trùng audit |
| A03 等第 (13), A04a v2 (10), 又為 v2 (5), tập expected A05 | 3.2b | qua; 2 ngoại lệ A04a do H2-A, có ghi |
| Bảng 等第 so với clause, 720 context | 3.2e | 660 cặp, 0 conflict |
| remaining-ji v8 (51 + 10), puzhu-end (8 + ca 四廢) | 3.2c | qua |
| Ngày âm (58 record tham chiếu + 1.095 ngày HKO), phase (13), soil (48 + 12 kỳ), bảng ngày âm (9) | 3.2d | qua |
| puzhu:06 v3, miền ngày / context | 3.3 | 5.444 / 3.470 trùng; mọi lệch thuộc H1-B/F5, H2-A hoặc E5 |
| Ghép ngày A04b v1 (7 ca) | 3.3 | 30/32; 2 lệch đã phân loại |

Thêm sau khi đóng băng ([cross_oracles.py](sources/p4-vol10/p4-full-golden-v1-review/cross_oracles.py)):
- **Golden P5** (720 × 2 trạng thái soil, suy độc lập): 天德 月德 天德合 月德合 天赦 天願 三合 滿日 收日 六合 五富 天倉 月恩 四相 時德 開日 月煞 月厭 甲日 puzhu:28. Khớp **28.800/28.800 ô**. Bỏ qua 母倉 vì P5 cũng đọc nó từ `yi-domains-v1`, nên không phải nhân chứng độc lập.
- **P4-C `dayOverride`** (720 context, quy tắc puzhu:28): khớp **720/720**.

## 6.0 — So engine

**Cách ghép engine** theo `engineComparisonPlan` đã đăng ký: P4-C (`resolveP4YiDay`), đè bằng puzhu:06 (`resolveP4Puzhu06Day`) cho 5 heading và P5 (`resolveP4WarehouseDay`) cho 修倉庫. Nguồn là các sweep đã commit; ngay trước khi so, 4 test kiểm bytes sweep đã chạy lại với code hiện tại (5/5 qua). Code engine P4 không đổi kể từ khi sinh sweep.

**Chứng minh nguyên nhân** ([attribute.py](sources/p4-vol10/p4-full-golden-v1-review/engine/attribute.py) → [attribution.json](sources/p4-vol10/p4-full-golden-v1-review/engine/attribution.json)):
- Mỗi luật Golden áp mà engine không có được đảo trong một worktree tạm, rồi tính lại phần ghép.
- Một dòng lệch được gán cho luật nào làm nó đổi khi bị đảo.
- Khi đảo **tất cả** các luật cùng lúc, dòng phải trùng engine; nếu không, nó vào phần dư và phải được giải thích riêng.

| Lớp (theo nguyên nhân) | Ngày | Context |
|---|---|---|
| Trùng | 31.507 | 14.794 |
| Không so (E5 `undetermined`; 修倉庫 không có context engine) | — | 4.658 |
| OWNER H1-B/F5 (gồm E3) | 79 | 49 |
| OWNER H1-B/F5 + ENGINE_BUG E1 | 3 | 1 |
| OWNER H2-A | 13 | 10 |
| OWNER H2-A — engine coi cả ngày `undetermined` | 16 | 12 |
| **ENGINE_BUG E1**: engine bỏ vế 「亦不註宜」 của 復日/重日 | 56 | 37 |
| **SPEC_BUG F1**: authority P4 để 巳日「出行」 unmapped; owner đã map | 73 | 45 |
| **ENGINE_BUG phân tầng A04b**: 栽種 có 月厭 相抵 + 地火, nhưng có 忌 được bảo vệ ở tầng sau | 6 | — |
| CONTEXT_DATE_OPERAND_POLICY (E5) | — | 1.272 |
| **SPEC_BUG mới**: phạm vi 德作建論 | 2 | 2 |
| Phần dư chưa giải thích | **0** | **0** |

**Tầm ảnh hưởng của từng luật** (mọi dòng đổi khi đảo luật, kể cả dòng không lệch engine):

| Luật | Ngày | Context |
|---|---|---|
| H1-B/F5 | 95 | 58 |
| E3 | 57 | 33 |
| F1 | 73 | 45 |
| E1 | 59 | 38 |
| 德作建論 trong điều kiện remaining-ji | 2 | 2 |

Hai ENGINE_BUG đều ở các luật đã ghi nhận:
- **E1**: owner đã chọn theo nguồn.
- **Phân tầng A04b**: engine phán `undetermined` ở tầng A04b, trước khi tầng sau có 忌 được bảo vệ. Lỗi này hết khi engine cài H1-B.

Trên phần đã nghiệm thu (P4-B/P4-C/P5/puzhu:06), ngoài các lớp trên, engine và Golden độc lập cho cùng trạng thái.

### SPEC_BUG mới — phạm vi của 德作建論

**Quyết định owner 2026-10-17: (i)** — 德作建論 áp cho **mọi chỗ dùng 德**, cả 宜 lẫn điều kiện gỡ 忌. Việc này cần Golden v2 (đóng băng mới); v1 giữ nguyên. Bản v2 cũng sửa luôn hạn chế ẩn ghi ở mục dưới (scope `undetermined` cả phạm vi).

- **Phạm vi:** 2026-06-01 và 2027-05-27 安葬 (歲薄/逐陣), cùng hai context 巳丙午 và 未己未. Tầm ảnh hưởng đầy đủ đúng 4 dòng.
- **Golden v1:** derive bỏ 天德/月德/天德合/月德合 khỏi điều kiện gỡ 忌 của 復日 trên ngày 德作建論, nên 復日 giữ 忌. Lựa chọn này **không được đăng ký trước đóng băng**.
- **Engine:** chỉ áp 德作建論 cho nhóm 德 có tên của A03.
- **Golden tự mâu thuẫn:** ở context 未己未, 天德合/月德合 vẫn được tính làm 宜 cho 安葬, nhưng lại không được tính khi xét gỡ 忌.
- **Nguồn:** 「德作建論不作德論」 (卷十 offset 15011, 15079) nói về 德 của ngày, không giới hạn ở clause nào. Authority remaining-ji v7 không nói gì về điểm này.

### Hạn chế ẩn của derive (không ảnh hưởng dữ liệu đã khóa)

Khi một scope `undetermined` cả phạm vi, `scopes.py` trả danh sách heading rỗng; scope đó bị bỏ qua thay vì làm các heading của nó thành `undetermined` như spec §4 yêu cầu.
- Golden v1 không có scope nào như vậy (`undeterminedScopes: []`), nên dữ liệu không bị ảnh hưởng.
- Phép đảo H2-A trong `attribute.py` dùng cách đọc đúng của spec.
- Nếu ra Golden v2 thì sửa luôn điểm này.

## 7.0 — Mutation (phương án b)

[scripts/audit-p4-full-golden-mutations.py](../../scripts/audit-p4-full-golden-mutations.py) → [report.json](sources/p4-vol10/p4-full-golden-v1-review/mutation/report.json). Runner đã nối vào `ci:p4` (chế độ verify, khoảng 5 phút, chạy tuần tự).

- Mỗi mutation sửa một script trong worktree tạm tại HEAD và sinh lại toàn chuỗi derive.
- Trước mọi mutation có **lượt đối chứng**: chuỗi không mutation phải qua mọi stage và tái tạo đúng bytes đã khóa. Lượt này sạch.
- Kết quả: **18/18 bị self-check bắt**, 0 chỉ bị bắt nhờ bytes đóng băng, 0 lọt.

| Nhóm | Mutation | Bị bắt ở |
|---|---|---|
| FR-07 | M01 bỏ thần dormant (四窮) | presence: không dựng được witness cấu trúc (bắt ngầm qua StopIteration) |
| | M02 Month Jian lệch một tiết (proxy cho tháng âm) | presence |
| | M03 ANY → ALL | compose: oracle puzhu:06 v3 |
| | M04 bỏ ngoại lệ 專忌 | compose: puzhu:06 SPEC_GAP |
| | M05 unknown → absent | checks: tập 宜 chưa biết |
| | M06 gộp 亦從宜亦從忌 với 不註 | scopes: Golden A04a |
| | M07 bỏ nhánh 德 | scopes: Golden A03 |
| | M08 lan truyền hai lượt | owner_checks: lan truyền một lượt (dòng chặn) |
| Luật owner / precedence | M09–M18: lan truyền bỏ qua bảo vệ, bỏ puzhu:28, hoàn H2-A / H1-B / F1 / E1 / E3, bỏ 德作建論, biên Jie theo trưa, chọn clause theo vị trí | compose / scopes / context_ji / checks / owner_checks |

[owner_checks.py](sources/p4-vol10/p4-full-golden-v1-review/owner_checks.py) được thêm **sau khi đóng băng**. File chỉ đọc output đã khóa (E1, E3, lan truyền một lượt cho cả dòng gỡ lẫn dòng chặn) và không ghi dữ liệu expected, nên lock không đổi.

Lần chạy đầu của runner bị loại: khi đó `owner_checks.py` chưa được commit và chưa có lượt đối chứng.

Mutation về cap, event đọc raw và penalty trùng thuộc roadmap 8.

## Giới hạn

- Single agent (Claude); owner review ở task 8.0.
- Presence và danh sách 忌 lấy từ authority đã khóa, không suy lại từ văn gốc.
- Engine được ghép từ các sweep đã commit (đã kiểm bytes), không gọi trực tiếp trong phép so.
- Miền context chưa so 修倉庫.
