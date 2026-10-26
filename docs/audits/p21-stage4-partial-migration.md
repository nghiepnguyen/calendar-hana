# P21 Stage 4 — Partial production migration

2026-10-26. Branch `claude/p21-stage4-partial-migration`, cut from Stage 3 `7ab7bc8`. This change is production code: it changes P4 output on 3 dates in 2025–2027.

The evidence is in [`sources/p4-vol10/p21-stage4/`](sources/p4-vol10/p21-stage4/):

| File | Contents |
|---|---|
| `migration-diff.json` | Every day of 2025–2027 under the pre-P21 rollback and the shipped build: heading states, activity score/status/hard warning, and events. Written by `shared/lunar/p4P21Stage4Migration.test.ts` with `P21S4_DUMP=1` |
| `lock.json` | Built by `build_lock.py` |

## 1. Baseline

At `7ab7bc8`:

- the Stage 1–3 locks pass, and the Stage 2 witness hashes are unchanged;
- production ran `p4b-puzhu06-v5`, with puzhu:21 heading-wide (N-A) everywhere;
- `p4-puzhu21-semantic-v1` was `SUPPORTED_SEMANTIC_AUTHORITY / NOT_MIGRATED`;
- readiness was `READY_FOR_PARTIAL_MIGRATION`.

## 2. Implementation

**New authority: `shared/almanac-data/p4-puzhu21-v1.json`.**

- `eligibleContexts`: 亥-丁酉 and 亥-癸酉. These are the Stage 3 MIGRATE contexts. 亥-癸酉 has no date in 2025–2027 but stays on the list.
- Provenance points to `p4-puzhu21-semantic-v1`, to witnesses n82 and n106, and to the Stage 3 eligibility.
- The record lists the excluded contexts (HOLD and QUARANTINE) and puzhu:22.

**Code: `shared/lunar/p4OwnerRules.ts`, propagation pass only.** The change applies only to a `puzhu:21` edge whose context is eligible.

1. The pass collects the fired triggers.
2. It also collects their 相抵 gods: the subject facts that are `neither_recorded` on each trigger.
3. After the pass, the target is decided from the union over all its fired edges:
   - **An independent 忌 survives:** the row keeps its pre-propagation state. `trace.ji` lists only the surviving gods, and `propagationKept` records the triggers.
   - **No independent 忌 survives:** the row is lifted exactly as before.
4. Protected 忌 still block, as before.

Every other context, edge and line runs the old code path. Generic cancellation and other owner rules are untouched.

**Production authority after this stage:** `p4b-puzhu06-v5` plus `p4-puzhu21-v1`. The two compose: puzhu:06 is unchanged, and puzhu:21 is scoped per the v1 allowlist.

## 3. Production diff

`migration-diff.json` covers 1,095 days, with every activity and every event in each run.

| | Value |
|---|---|
| Dates | 2025-11-24, 2026-11-19, 2027-11-14 (all 亥-丁酉) |
| Heading rows | 3: 立券交易 `neither_recorded` → `only_ji` |
| Activity rows | 6 (contract and transaction × 3): 50 neutral → 20 avoid, −30 |
| Hard warnings | 0 changes |
| Events | 27 records, 18 classification changes (caution → not_recommended) |
| Unexpected rows | 0 |

These are identical to the Stage 3 `MIGRATION_ELIGIBLE_ONLY` impact.

**Rows that must not move:**

- **HOLD** (未-戊申: 2026-08-02, 2027-07-28): unchanged.
- **QUARANTINE** (未-丙申: 2025-07-26, 2026-07-21, 2027-07-16): unchanged.
- **Control** (2025-01-01): unchanged.

`p4P21Stage4Migration.test.ts` re-runs the pre/post comparison on these dates on every `npm test`. `p4OwnerRulesV5.test.ts` also asserts that 未-戊申, 未-丙申, 未-壬申 and 未-庚申 stay `neither_recorded` at context level.

**puzhu:22 boundary.** The only heading that moves is 立券交易, so 開倉庫出貨財 does not change anywhere. The full Golden v5 diff confirms this at context level, and the migration diff test asserts it.

## 4. Golden successors

Fallout was triaged before any Golden was written. `npm test` and the `ci:p4` env-gated suites ran unchanged, and every failure was on the 3 MIGRATE dates (contract, transaction, 立券交易) or the 亥-丁酉 / 亥-癸酉 context rows.

Failing suites:

- owner rules v2, v3 and v4;
- score adapter almanac;
- score Golden v3 to v6;
- migration diff and diff V3;
- the P21 Stage 1–3 harnesses.

All of them are on the Stage 3 rollback-pin or re-point list.

| Golden | Successor | Diff |
|---|---|---|
| p4-full-golden-v4 | **p4-full-golden-v5**. The v4 composer is loaded sha-asserted; only propagate moves | dated 3, context 2, h1b-changes 5; it checks itself against the Stage 3 manifest. The derived `summary.json` counts move by the same rows |
| p4-score-golden-v6 | **p4-score-golden-v7**. The v6 generator is loaded sha-asserted on full v5 | states 6, scores 6; it checks itself against the Stage 3 eligibility |

The owner-rules Golden is the full Golden compose (see Stage 3). The owner-rules mutation script gains two P21 mutations:

- the scope is dropped;
- the scope is applied globally.

Its results file is refreshed by `ci:p4`.

Unchanged: p4b-puzhu06-golden-v5, p5-warehouse-golden-v1 and p4-adapter-baseline v1/v2. The older Goldens stay in place as rollback evidence.

## 5. Rollback

`shared/lunar/p21Rollback.ts` is test-only. It mocks `p4-puzhu21-v1.json` with `eligibleContexts: []`, which is N-A byte-equal.

- **Self-import:** the factory writes the record out rather than importing the mocked path, because a self-import waits on its own mock.
- **Production imports:** 0, asserted by a test.
- **Pinned suites:**
  - historical: p4OwnerRules, p4OwnerRulesV3, p4OwnerRulesV4, p4ScoreAdapterAlmanac, p4ScoreGoldenV3–V6, p4MigrationDiff, p4MigrationDiffV3;
  - P21 audit harnesses: Stage1Projection, Stage2Candidates, Stage2Impact, Stage3Affected.
- **Check:** each pin asserts that 亥-丁酉 reads `neither_recorded` under it.

## 6. Debts (unchanged, not touched)

| Item | Status |
|---|---|
| 未-戊申 | HOLD: needs an owner ruling on 五離 |
| 未-丙申 / 壬申 / 庚申 | QUARANTINE: blocked by P4-劫 |
| PUZHU22_SEMANTIC_DEBT | Open |
| X相抵 (災煞) | Not closed as a general item |
