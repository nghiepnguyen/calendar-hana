# P21 Stage 3 — Authority freeze and migration eligibility (audit only)

**Date:** 2026-10-26
**Branch:** `claude/p21-stage3-authority`, cut from Stage 2 `cbe4cac`
**Production:** unchanged. No code, data, flag, Golden or lock outside this directory was touched. The active authority stays `p4b-puzhu06-v5`.

Artifacts are in [`sources/p4-vol10/p21-stage3/`](sources/p4-vol10/p21-stage3/):

| File | Contents |
|---|---|
| `affected-cells.json` | Every date in 2025–2027 where N-C differs from production, recomputed from the production layer by `shared/lunar/p4P21Stage3Affected.test.ts` |
| `authority.json` | Successor semantic authority record (not active) |
| `eligibility.json` | Per-context and per-date status |
| `impact.json` | `ALL_H2_PROJECTED` versus `MIGRATION_ELIGIBLE_ONLY` |
| `golden-manifest.json` | Expected Golden successors, MIGRATE rows only |
| `migration-spec.json` | Stage 4 specification |
| `lock.json` | Lock over the above |

`build_stage3.py` builds everything except `affected-cells.json`. The lock harness is `shared/lunar/p4P21Stage3Lock.test.ts`.

**Conclusion:**

- **Semantic authority:** `P21_SEMANTIC_AUTHORITY = H2_SUPPORTED`.
- **Migration readiness:** `MIGRATION_READINESS = READY_FOR_PARTIAL_MIGRATION`.

## 1. Scope

Stage 3 freezes the authority from Stage 2 and classifies which production rows may consume it.

It does not:

- migrate anything;
- create production Goldens;
- touch puzhu:22, P4-劫, X相抵 (災煞 相抵), Y-CONVENTION, G2/W1 or Q4-REST.

## 2. Frozen Stage 2 authority

Baseline checks:

- Stage 1 and Stage 2 locks and tests pass on this branch.
- The witness page hashes are unchanged:
  - n82 `734614ab…`;
  - n106 `805a2be9…`.
- The freeze order is still proven: `fd11bd2` is an ancestor of `cbe4cac`.
- `git diff cbe4cac -- shared/lunar shared/almanac-data` is empty before the Stage 3 tests.

Stage 2's result is unchanged:

- CLEAN_H2: n82 (亥-癸酉) and n106 (亥-丁酉).
- CLEAN_H1: none.
- No new CLEAN_H1 witness was found.

## 3. Successor semantic authority

`authority.json`, id `p4-puzhu21-semantic-v1`:

| Field | Value |
|---|---|
| Rule | puzhu:21 |
| Semantic | `contribution-scoped-suppression` |
| Meaning | The trigger's 相抵 gods' 忌 is withheld on the target. Independent target 忌 survive |
| Label | N-C, an audit label, not a source term |
| Status | `SUPPORTED_SEMANTIC_AUTHORITY` |
| Production status | `NOT_MIGRATED` |
| Active production authority | `p4b-puzhu06-v5` (puzhu:21 runs N-A) |
| Evidence | Level A |
| Eligible contexts | 亥-丁酉, 亥-癸酉 |

The record lives under `docs/audits/`. Nothing imports it.

## 4. Full affected set

The set was recomputed date by date from production, without reading the Stage 1 freeze. It equals the Stage 2 set exactly.

On every row:

- the target is 立券交易;
- the independent 忌 is 五離;
- the target has no protected 忌;
- the current state is `neither_recorded`; under H2 it becomes `only_ji`;
- contract and transaction move 50 neutral → 20 avoid (−30);
- hard warnings do not change;
- 9 event records change, 6 of them in classification.

| Date | Context | Trigger (宜 source / 相抵 god) | Target | Independent 忌 | Current | H2 | Status |
|---|---|---|---|---|---|---|---|
| 2025-07-26 | 未-丙申 | 開市 (no 宜 / 劫煞), 納財 (no 宜 / 劫煞) | 立券交易 | 五離 | neither_recorded | only_ji | QUARANTINE |
| 2025-11-24 | 亥-丁酉 | 開市 (開日 / 災煞), 納財 (母倉 / 災煞) | 立券交易 | 五離 | neither_recorded | only_ji | **MIGRATE** |
| 2026-07-21 | 未-丙申 | as 2025-07-26 | 立券交易 | 五離 | neither_recorded | only_ji | QUARANTINE |
| 2026-08-02 | 未-戊申 | 開市 (no 宜 / 劫煞), 納財 (四相 / 劫煞); `puzhu06 keep:QL_EXCLUDED` | 立券交易 | 五離 | neither_recorded | only_ji | HOLD |
| 2026-11-19 | 亥-丁酉 | as 2025-11-24 | 立券交易 | 五離 | neither_recorded | only_ji | **MIGRATE** |
| 2027-07-16 | 未-丙申 | as 2025-07-26 | 立券交易 | 五離 | neither_recorded | only_ji | QUARANTINE |
| 2027-07-28 | 未-戊申 | as 2026-08-02 | 立券交易 | 五離 | neither_recorded | only_ji | HOLD |
| 2027-11-14 | 亥-丁酉 | as 2025-11-24 | 立券交易 | 五離 | neither_recorded | only_ji | **MIGRATE** |

Context-level only (no date in 2025–2027):

- 亥-癸酉: MIGRATE, 0 rows;
- 未-壬申 and 未-庚申: QUARANTINE, 0 rows.

NO_CHANGE: none. H2 changes the output on all 8 rows.

## 5. Trigger provenance

| Context | Trigger authority | Highest level |
|---|---|---|
| 亥-丁酉, 亥-癸酉 | SOURCE_AUTHORITY (witness-specific) | A |
| 未-戊申 | OWNER_CONVENTION (LOCAL 納財 ruling) plus IMPLEMENTATION_CONVENTION (開市 via `cancel_both`) | D |
| 未-丙申 (also 壬申, 庚申) | IMPLEMENTATION_CONVENTION (P4 `cancel_both`), contradicted at Level A | C |

## 6. Eligibility matrix

| Status | Dates |
|---|---|
| MIGRATE | 2025-11-24, 2026-11-19, 2027-11-14 |
| HOLD | 2026-08-02, 2027-07-28 |
| QUARANTINE | 2025-07-26, 2026-07-21, 2027-07-16 |
| NO_CHANGE | — |

## 7. 亥 family: MIGRATE (witness-specific authority)

**Question:** can these contexts migrate from direct witness evidence, without first closing the general X相抵 debt? **Yes.**

1. **The page is the exact context.**
   - n106 is 亥-丁酉, and n82 is 亥-癸酉.
   - Each shows the trigger realised: 開市 and 納財 are on neither line.
   - Each shows the target output: 立券交易 on the 忌 line.
2. **The output does not depend on X相抵.**
   - The trigger: 開市 has 宜 開日 and 納財 has 宜 母倉 (卷十一). With a 宜, each is unnoted under either 災煞 reading.
   - The target ends `only_ji` (五離) either way:
     - P4 removes 災煞 on 立券交易 through a local `cancel_both` mark;
     - the source removes it through puzhu:21 H2.
3. **The dated operands match the generic page.** On the three dates:
   - soil is absent;
   - 母倉 is present;
   - there is no puzhu:06 trigger;
   - 立券交易 has no protected 忌.

**Basis:** witness-specific authority. **X相抵 is not closed as a general item.**

## 8. 未-戊申: HOLD

| | |
|---|---|
| Trigger | 納財 (宜 四相) |
| Basis for 納財 being unnoted | `OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS`, 2026-10-22. LOCAL, 未-戊申 納財 only. This is a project convention, not a source fact. n117 prints 納財 |
| Extension | D1(a), 2026-10-26, extended it only to 劫煞 × 立券交易, and lists **"other 五離 cases"** under `notExtendedTo` |
| 開市 | Has no 宜. It is unnoted only under P4 `cancel_both` |
| W6 | 四相 is a puzhu:06 trigger. puzhu:06 keeps 五離 under F1 R2, so it does not explain the output, but the day is not clean |

**Governance.** Owner rulings do drive production, for example Q4 and H1-B. But this LOCAL ruling explicitly stops short of 五離, which is exactly what H2 would keep.

**Missing:** either an owner ruling that extends the LOCAL 納財 ruling to its H2 consequence on 五離, with the basis labelled `OWNER_CONVENTION`, or a second edition of n117 (the 內府刊本, not acquired).

## 9. 未-丙申: QUARANTINE

| | |
|---|---|
| Trigger path | 開市 and 納財 have no 宜. They are unnoted only because P4 runs `cancel_both` for 劫煞 辰戌丑未 without 德 |
| Classification | IMPLEMENTATION_CONVENTION |
| Conflict | n105 (未-丙申) prints 開市, 立券交易 and 納財. Faithful 卷十 v4 has finance and opening = avoid. H1-B review contradiction 1 is the same issue |
| Meaning | **At source the trigger never fires** |
| Blocking dependency | P4-劫 |

The source output for 立券交易 is 忌 (劫煞 + 五離). That coincides with the H2 projection, but by a different path. Migrating it through P21 would encode the unsupported trigger, so the fix belongs to P4-劫.

The same applies to 未-壬申 (n81) and 未-庚申 (n129); neither has a production row.

## 10. puzhu:22 boundary (`PUZHU22_SEMANTIC_DEBT`)

- **What n82/n106 show:** 開倉庫出貨財 is absent without a 宜 of its own. That fits only if puzhu:22's trigger is also read per contribution.
- **Owner precedent of 2026-10-17:** H1-B, with puzhu:22 withholding 月虛. It stands unchanged.
- **This audit does not:** reinterpret that precedent, change production, or touch any Golden.
- **P21 H2 does not generalise to puzhu:22.** This is recorded in `authority.json`.

## 11. Migration-ready subset

- **Contexts:** 亥-丁酉 and 亥-癸酉.
- **Dates:** 2025-11-24, 2026-11-19 and 2027-11-14.
- **Rows:** 6 activity rows (contract and transaction): 50 neutral → 20 avoid.

## 12. Held and quarantined subset

| Status | Dates | Rows | Blocking item |
|---|---|---|---|
| HOLD | 2026-08-02, 2027-07-28 | 4 | owner ruling on 五離 |
| QUARANTINE | 2025-07-26, 2026-07-21, 2027-07-16 | 6 | P4-劫 |

All of these must stay production-identical in Stage 4.

## 13. Golden impact (MIGRATE rows only)

| Current Golden | Successor | File | Records |
|---|---|---|---:|
| p4-full-golden-v4 | p4-full-golden-v5 | compose/dated.tsv | 3 |
| p4-full-golden-v4 | p4-full-golden-v5 | compose/context.tsv | 2 |
| p4-full-golden-v4 | p4-full-golden-v5 | compose/h1b-changes.tsv | 5 |
| p4-score-golden-v6 | p4-score-golden-v7 | activity-states.tsv | 6 |
| p4-score-golden-v6 | p4-score-golden-v7 | activity-scores.tsv | 6 |

Unchanged:

- **p4b-puzhu06-golden-v5:** no puzhu:06 trigger on these contexts.
- **p5-warehouse-golden-v1:** no warehouse delta.
- **p4-adapter-baseline-v1 and v2:** P4 OFF baseline.
- **Events:** there is no event Golden. Event deltas belong in the Stage 4 migration diff.

## 14. Event impact

| | ALL_H2_PROJECTED | MIGRATION_ELIGIBLE_ONLY |
|---|---|---|
| Dates | 8 | 3 |
| Activity rows | 16 | 6 |
| Score | −30 (neutral → avoid) | −30 (neutral → avoid) |
| Event records | 72 | 27 |
| Classification changes | 48 | 18 (caution → not_recommended) |
| Hard warnings | 0 | 0 |

## 15. Stage 4 implementation options

`migration-spec.json` holds the full specification. Three options were compared:

| Option | Assessment |
|---|---|
| **A, recommended:** a contribution filter on puzhu:21 edges only, gated by an allowlist in a new authority `shared/almanac-data/p4-puzhu21-v1.json` (`eligibleContexts` 亥-丁酉, 亥-癸酉), with policy `p4Puzhu21Scope: contribution-v1` (`heading-v1` = rollback) | Encodes the semantic. The allowlist is auditable. The change is small: the propagation pass in `p4OwnerRules.ts` |
| B: a context overlay (context, heading) → `only_ji` | The smallest diff, but it encodes the output rather than the semantic, and it drifts if other rules move |
| C: a global filter with a blocklist for HOLD/QUARANTINE | Rejected: it fails open for new contexts |

**Algorithm (option A).** For a puzhu:21 edge whose target context is eligible:

1. `cancelled` = the trigger's 相抵 subjects.
2. `remaining` = target `trace.ji` minus `cancelled`.
3. If `remaining` is empty, lift as today. Otherwise keep `ji`, with state `only_ji` (or `both_present` if 宜 is noted).
4. Protected 忌 keep blocking as today.
5. Every other edge, line and context stays N-A.

**Gates for Stage 4:**

- The migration diff may contain only MIGRATE dates, and its deltas must equal `MIGRATION_ELIGIBLE_ONLY`.
- Mutation tests:
  - removing an eligible context must fail;
  - adding 未-戊申 or 未-丙申 to the allowlist must fail.
- `ci:p4:full` must pass.
- These P21 audit tests must be re-pointed, because they pin N-A:
  - `p4P21Stage1Projection`;
  - `p4P21Stage2Candidates`;
  - `p4P21Stage2Impact`;
  - `p4P21Stage3Affected`.

## 16. Conclusion

| Axis | Result |
|---|---|
| `P21_SEMANTIC_AUTHORITY` | `H2_SUPPORTED`, frozen, not active |
| `MIGRATION_READINESS` | `READY_FOR_PARTIAL_MIGRATION` |

The partial split:

- **MIGRATE:** 3 dates, 亥-丁酉 (Level A, witness-specific).
- **HOLD:** 2 dates, 未-戊申 (LOCAL owner convention does not reach 五離).
- **QUARANTINE:** 3 dates, 未-丙申 (the trigger is contradicted at source; P4-劫).

`PROJECT_CONTEXT.md` is unchanged. P21 is not closed and not migrated.
