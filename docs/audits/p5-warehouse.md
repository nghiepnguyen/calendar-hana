# P5 — warehouse audit (修倉庫 co-presence, 開倉庫出貨財)

Status: audit-only, owner decision **D** (2026-10-16), not canonical. No runtime, scoring, manifest or flag change. PRD: [prd-p5-warehouse.md](../../tasks/prd-p5-warehouse.md), tasks: [tasks-p5-warehouse.md](../../tasks/tasks-p5-warehouse.md).

## Chain

| Step | Evidence |
|---|---|
| Baseline (1.0) | [p5-warehouse-baseline-v1](sources/p4-vol10/p5-warehouse-baseline-v1/README.md) |
| Authority (2.0) | [p5-warehouse-authority-v1](sources/p4-vol10/p5-warehouse-authority-v1/README.md), `shared/almanac-data/p5-warehouse-v1.json` |
| Golden, frozen before code (3.0) | [p5-warehouse-golden-v1](sources/p4-vol10/p5-warehouse-golden-v1/README.md), freeze `fc5c1fb` |
| Predicate (4.0) | `shared/lunar/p4Warehouse.ts`. Red `0810b96`, then green. |
| Sweep (5.1/5.2) | [p5-warehouse-2025-2027.tsv](p5-warehouse-2025-2027.tsv), [p5-warehouse-summary.json](p5-warehouse-summary.json); generator `shared/lunar/p4WarehouseSweep.test.ts` |
| Mutations (5.3) | `scripts/audit-p4-warehouse-mutations.py` → [p5-warehouse-mutation-results.json](p5-warehouse-mutation-results.json); CI job `p5-warehouse-mutations` |

## Predicate

`resolveP4Warehouse` reads the R10 (卷十, 月恩) and R11 (卷十一, 月德) partner lists from the pinned authority:

- Each reading is Kleene `base AND ANY(partners)`.
- D and the heading are the outcome over every completion of the unknown operands, as in the Golden. Owner, 2026-10-16: an unknown base whose partners are all known absent gives no 宜.

`resolveP4WarehouseDay` wraps the unchanged P4-C day `resolveP4YiDay`:

- 修倉庫 loses `deferred: 'P5'`.
- SOURCE_DEPENDENT stays `undetermined`, tagged `warehouse: 'SOURCE_DEPENDENT'`.
- Each base carries its partners, its R10/R11 membership, the source spans and the trace ID of every operand.
- The owner accepted the wrapper on 2026-10-16: no composition v3 is needed, and the P4-C API keeps its own `deferred` contract.

## 5.1 — 修倉庫 on 1,095 dates (31,755 rows swept)

- Only the 修倉庫 rows changed: 565 of 31,755. Every other row matches the P4-C sweep TSV byte for byte (`changedOtherHeadings` 0). On all 1,095 dates, every day-level field outside 修倉庫 deep-equals the P4-C output.
- 宜 verdicts (reasons from the frozen Golden):

  | Reason | Rows |
  |---|---|
  | DIRECT_YI | 520 |
  | CO_PRESENCE_AGREED | 68 |
  | CO_PRESENCE_ABSENT | 173 |
  | NO_OPERAND | 333 |
  | SOURCE_DEPENDENT | 1 |

  The SOURCE_DEPENDENT row is 2025-10-08 戌庚戌: 母倉 + 月恩, so R10 gives 宜 and R11 does not.
- The 539 P5 rows (P4-C `undetermined`) now end as:

  | Final state | Rows |
  |---|---|
  | only_yi | 225 |
  | both_present | 161 |
  | only_ji | 90 |
  | not_recorded | 46 |
  | undetermined | 17 |

- The 17 still `undetermined`:
  - 1 is SOURCE_DEPENDENT (subject 月建).
  - 16 have a known 宜 but an open 忌 scope from P4-B: 月煞 14 (卯/酉 months), 刼煞 1, 閉日+天吏 1. Their bucket is `OTHER_STATE_WITH_KNOWN_YI`; these are the same 卯/酉 days as the 24 開倉庫出貨財 rows from task 1.3.
- The other 556 修倉庫 rows keep their state, because 忌 already decided them.
- `undetermined` on all other headings: 103 before, 103 after. Unresolved 宜 operands on 2025–2027: 0.

## 5.2 — 開倉庫出貨財 (FR-07)

Checked against the frozen Golden columns on 1,095 dates:

- **宜:** equals ANY(月恩 四相 時德 滿日 五富) on every date (454 dates with 宜).
- **甲日 專忌:**
  - 110 dates. On 106 the 忌 stays protected through every lift.
  - The other 4 are puzhu:28 days: 2025-03-06 卯甲戌, and 未甲午 on 2025-07-24, 2026-07-19 and 2027-07-14. There 諸事不忌 wins (owner, 2026-10-16).
- **puzhu:22 `requireAll`:** no date in 2025–2027 actually fires the lift:
  - In 18 cases both from-headings are 相抵, but the lift is blocked because 甲日 is 專忌.
  - In 43 cases 開倉庫 is already `neither_recorded`, and in 23 it is `undetermined`.
  - 15 dates are one-sided (開市 only), and 5 of those carry an unprotected 忌 that must stay. They do stay.
  - The 16-row frozen table is checked on `applyP4Propagation` directly.
- **月煞 (月虛), on 91 dates:** raw 忌 is present on all 91.
  - Final 忌 is kept on 78, 11 are `undetermined` (open 月煞 scope), and 2 are lifted only by puzhu:28 (卯甲戌, 酉庚辰).
  - No single 吉神 removes it.
- **月厭, on 90 dates:** 忌 is kept on 72. P4-B's 月厭 clause lifts it on 18, and 德神 (天德/月德/天德合/月德合) is present on every one of those 18.

### Findings

| Id | Class | Finding | Handling |
|---|---|---|---|
| F1 | SPEC_GAP (P4-B) | puzhu:06 is not modeled anywhere in P4: 「凡德合赦願月恩四相時德等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇德猶忌及從忌不從宜之日則仍註忌」. On 開倉庫出貨財 alone, 133 rows keep an unprotected 忌 on a puzhu:06 day (only_ji 109, both_present 14, undetermined 10). These are candidates only; the 德猶忌 / 從忌不從宜 status of each 凶 is not classified. | Not fixed in P5. It touches 8 headings, not just warehouse, so it is a separate P4-B task that needs a frozen Golden and an owner decision first (FR-08). |
| F2 | COVERAGE_LIMIT | The puzhu:22 lift never fires on 2025–2027, so real data cannot show it. | Covered by the abstract 16-row table and the `kai_drop_require_all` mutation. |
| F3 | SCOPE_OUTSIDE_P5 | 24 開倉庫出貨財 and 16 修倉庫 rows stay `undetermined` because a P4-B 忌 scope is open (月煞 卯/酉, 刼煞, 閉日+天吏). | Recorded; left for P4-B. |

## Limits

- Single-agent work (Claude); no independent second review.
- 母倉 is OWNER_ADOPTED_SOURCE_DEPENDENT for 2025–2027. Outside that range 修倉庫 can stay unknown.
- One corner of FR-04: an unknown base that can only reach SOURCE_DEPENDENT or agreed_absent, next to a known SOURCE_DEPENDENT base, gives SOURCE_DEPENDENT under completion semantics. FR-04 read literally would give unknown. No real or frozen row hits this case.
