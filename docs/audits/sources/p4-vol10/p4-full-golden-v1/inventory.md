# Full Golden P4 — inventory input (task 1.0)

2026-10-17, nhánh `claude/p4-full-golden` từ `da73e90`. Audit-only, không đổi file nào ngoài thư mục này. Phương pháp: trích mọi path literal trong script sinh Golden/authority, đọc chỗ dùng; Golden không có script (JSON viết tay) chỉ đếm fixture.

Phân loại (PRD FR-01): `SOURCE` (raw/scan khóa SHA), `AUTHORITY_LOCK` (JSON authority đã khóa), `FROZEN_GOLDEN`, `ENGINE_OUTPUT` (sinh bởi test chạy resolver/evaluator), `PRODUCTION_CODE`. Hai loại sau không được làm input Golden mới.

## 1.1 Input từng script

| Script | Input | Loại | Dùng làm gì |
|---|---|---|---|
| `yi-expected-v1/derive.py` (P4-C 3.2) | `yi-expected-v1/source-basis.json`, solar-term file (SHA `1db7a155…`), `soil-hko/T*.txt`, `yi-fixture-matrix-v1/matrix.json` | SOURCE / AUTHORITY_LOCK | Expected presence 11 thần 宜 |
| `yi-domains-v1/domains.py` (P4-C 3.3) | `yi-expected-v1/{derive.py,expected.json,source-basis.json}` | FROZEN_GOLDEN | 7.863 record toàn miền 11 thần 宜 |
| `yi-composition-expected-v1/derive.py` | `yi-expected-v1/derive.py`, `source-basis.json` | FROZEN_GOLDEN | Ghép 宜 theo heading |
| `yi-propagation-v1/derive.py` | `vol10.raw.txt`, `yi-domains-v1/expected.tsv`, `yi-composition-expected-v1/*`, `p4-vol10-day-composition-v2.json`, `p4-vol10-remaining-ji-v7.json`, `p4-yi-operands-v1.json` | SOURCE / FROZEN_GOLDEN / AUTHORITY_LOCK | Lan truyền 宜 |
| ″ | **`yi-baseline-v1/baseline.tsv`** (sinh bởi `shared/lunar/p4YiBaseline.test.ts`, evaluator `db382ba`) | **ENGINE_OUTPUT** | Ngày âm, phase, soil, Month Jian, `pre_ji`/`pre_state` P4-B của 1.095 × 29 |
| `yi-dated-inputs-v1/jie-convention.py` | `yi-domains-v1/expected.tsv`, `yi-propagation-v1/expected.json` | FROZEN_GOLDEN (gián tiếp ENGINE_OUTPUT qua yi-propagation) | Quy ước ngày Jie |
| `p5-warehouse-golden-v1/derive.py` | `vol05/06/10/11.raw.txt`, `yi-domains-v1/expected.tsv`, `jie-convention.json`, `p5-warehouse-v1.json`, `p4-vol10-remaining-ji-v7.json` | SOURCE / FROZEN_GOLDEN / AUTHORITY_LOCK | Predicate D 修倉庫 |
| ″ | `shared/lunar/catHungAuthority.ts` | PRODUCTION_CODE, **chỉ hash** (ghi chú đối chiếu 天德 quẻ), không đọc logic | Không ảnh hưởng expected |
| ″ | `p5-warehouse-baseline-v1/baseline.tsv` | ENGINE_OUTPUT, **chỉ so sau khi expected đã ghi** | So sánh, không phải input. 忌 thường để `null` ("ordinary 忌 composition decides") |
| `p4b-puzhu06-golden-v1/v2/v3/derive.py` | `vol05/10.raw.txt`, `p4b-puzhu06-v*.json`, `p4-vol10-day-composition-v2.json`, Golden cha | SOURCE / AUTHORITY_LOCK / FROZEN_GOLDEN | Quy tắc gỡ puzhu:06 |
| ″ | **`docs/audits/p4-vol10-yi-operands-2025-2027.tsv`** (sweep P4-C) | **ENGINE_OUTPUT** | Trạng thái trước gỡ 1.095 × 29 (`yi`, `ji`, triggers) |
| ″ | **`p4b-puzhu06-baseline-v1/{baseline,context,context-p4c}.tsv`** (sinh bởi `p4Puzhu06Baseline.test.ts`) | **ENGINE_OUTPUT** | Trạng thái 720 context × 5 / × 29, nguồn 忌 |
| `p5-warehouse-authority-v1/build.py`, `p4b-puzhu06-authority-v3/build.py` | raw, scan, authority trước | SOURCE / AUTHORITY_LOCK | Authority, không phải Golden |

Golden P4-B không có script (JSON viết tay, đóng băng theo lock): `golden-p4-remaining-ji-v8` (51 ca scope + 10 ca ngày + correction), `lunar-day-v1` 9, `lunar-phase-v1` 13, `season-days` 12, `soil-owner-convention-v1` 48 ca / 12 kỳ, `puzhu-end-v1` 8, `grade-resolution` 13, `heading-annotation-v2` 10, `day-composition` 7, `context-bridge-v2` 13, `youwei-scopes-v2` 5, `named-clauses` 26 pillar. `golden-p4-vol10-authority` có 720 context nhưng chỉ `expectedGlobalGrade: "undetermined"`, `scoreExpected: null` (placeholder). `golden-legacy-gods-month-jian` 52 ca.

## 1.2 Thay ENGINE_OUTPUT

| Input engine | Thay bằng |
|---|---|
| `yi-baseline-v1/baseline.tsv` — dated operands (ngày âm, 朔弦望, soil, Month Jian) | Suy lại từ nguồn: solar-term file đã khóa SHA (như `yi-expected-v1`), `soil-hko` + authority `p4-soil-owner-convention-v1`, lịch âm/phase từ nguồn của `lunar-day-v1`/`lunar-phase-v1` (cần xác định nguồn độc lập ở task 3.2; nếu chỉ có engine thì ghi `ENGINE_DERIVED_OPERAND` và đối chiếu với fixture đã khóa) |
| `yi-baseline-v1` / `p4b-puzhu06-baseline-v1` — `pre_ji`, `pre_protected_ji`, `pre_state` P4-B | **Suy lại**: 26 entry 卷十 + 鋪註 (`p4-vol10-remaining-ji-v7.json`, `p4-puzhu-end-v1.json`, `p4-vol10-day-composition-v2.json`, 百忌日) trên presence suy độc lập. Fixture P4-B v8 dùng làm oracle chéo |
| sweep P4-C `p4-vol10-yi-operands-2025-2027.tsv` — `yi`, triggers | `yi-domains-v1/expected.tsv` + `yi-composition-expected-v1` (đã độc lập) + lan truyền suy lại |
| `context-p4c.tsv` — 720 × 29 trạng thái P4-C | Như trên, miền context |

## 1.3 Gap: expected độc lập hiện có trên miền đầy đủ

| Lớp | context720 × 29 | dated1095 × 29 | Ghi chú |
|---|---|---|---|
| Presence 11 thần 宜 (P4-C) | **Có** (`yi-domains-v1`) | **Có** (母倉 dated + exact Jie 108) | Độc lập |
| Presence 21 thần dormant + 14 legacy | **Không** | **Không** | Chỉ engine (`xieji-god-presence-2025-2027.tsv`); Golden 52 ca legacy; chưa fixture Jie cho 21 thần |
| Dated operands (ngày âm, phase, soil) | n/a | **Không** | Engine; fixture 9 + 13 + 48 ca |
| 忌 P4-B (entry, scope, protected, puzhu:28, 27/28-first) | **Không** | **Không** | Chỉ fixture 51 + 10; toàn miền chỉ engine |
| 宜 theo heading (P4-C composition) | Một phần | Một phần | Ghép độc lập, nhưng lan truyền dựa engine baseline |
| State 4 giá trị cuối + propagation | **Không** | **Không** | Phụ thuộc 忌 |
| Warehouse 修倉庫 宜 (P5 D) | **Có** (1.440 = 720 × soil 2) | **Có** | Độc lập; 忌 để null |
| puzhu:06 gỡ | Có (5 heading) | Có (5 heading) | **Không độc lập**: đầu vào engine |

**Kết luận.** Phần độc lập đã có: presence 11 thần 宜 và predicate warehouse. Phần phải suy mới cho Golden đầy đủ: (1) presence 21 + 14 thần từ `xieji-god-definitions.json`; (2) dated operands; (3) toàn bộ 忌 P4-B; (4) state cuối + lan truyền + puzhu:06 trên 29 heading. (3) là khối lớn nhất. Không còn input `ENGINE_OUTPUT` nào được dùng trực tiếp; mọi file engine chỉ được so sau freeze (task 6.0).

## Câu hỏi mở cho task 3

- Nguồn độc lập cho ngày âm và 朔弦望 toàn miền 1.095 ngày: kiểm `lunar-day-lock-v1.json`, `lunar-phase-lock-v1.json`, `usno-phase/` trước khi chọn.
