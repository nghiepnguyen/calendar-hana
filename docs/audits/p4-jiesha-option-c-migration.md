# 卷十 劫煞 Option C v1: production projection

2026-10-22, branch `claude/jiesha-option-c-migration`, parent `681c692`. Owner approval covers Option C, using the approved runtime projection (Option 1).

Nothing has been pushed, merged or deployed.

Artifacts are in `sources/p4-vol10/jiesha-option-c-migration-v1/`. The approved candidate (`chou-bingyin-yuede-v1/candidate-final.json`, SHA-256 `b24f6f68…1946`) is unchanged.

## Audit authority vs production projection

**Audit authority matrix:** 16 contexts × 24 activities = 384 cells (177 avoid, 207 blank). This is the approved source authority.

**Production Option C v1 projection:** the audit matrix projected through the **current** `resolveVol10` heading normalization, with explicit v1 exclusions. Not all 384 cells are runtime-covered.

| Runtime status | Activities | Audit cells | Avoid | Blank |
|---|---|---|---|---|
| `APPLIED` | 22 | 352 | 171 | 181 |
| `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION` | contract, transaction | 32 | 6 | 26 |
| `EXCLUDED_PENDING_GLYPH_AUDIT` | demolition | 0; 16 runtime contexts have no audit cell | — | — |

The per-cell mapping is in `coverage.json`, with every cell's context, activity, audit verdict, runtime status, production headings and reason.

### Why the three activities differ

- **demolition (G1, 壞/壊).** `resolveVol10` normalizes 破屋壞垣 → 破屋壊垣 and lists it under 劫煞. The approved simulator matched activity headings with `canonP4Heading`, which keeps 壞, so it never produced demolition cells. Runtime keeps legacy `cancel_both`, marks the item `authorityExclusion: EXCLUDED_PENDING_GLYPH_AUDIT: …`, and never throws.
- **contract, transaction (G2, 劵/券).** 劫煞 lists 立劵交易, but `NORM` has no 劵→券, so `resolveVol10` reads both activities as `not_listed`. Their audit cells stay for provenance and are never consulted. If one were reached, for example because someone added 劵→券, runtime throws.

## Runtime

**Policy:** `manifest.policies.xiejiVol10JieshaPolicy`, either `legacy-cancel-both` or `faithful-v1`. The shipped value is `faithful-v1`, which follows the repo rule that new behaviour gets its own manifest policy.

- `resolveVol10(day, ids, { jieshaPolicy })` defaults to `faithful-v1`.
- `getActivityRecommendations` takes `xiejiVol10JieshaPolicy` as an input override.
- `evaluateEventDay` passes the manifest value.
- Historical tests pin `legacy-cancel-both` explicitly.

**Exact predicate** in `resolveEntry`. All of the following must hold:

- depth 0, so never through a 從X論 deferral;
- the entry is `jie_sha`;
- Month Jian ∈ 辰戌丑未;
- the 辰戌丑未 clause's 德 test is definitely false (`withVirtues === false`), so the `otherwise` branch gives `cancel_both`;
- the policy is `faithful-v1`.

Undetermined 德 (`null`) is out of scope.

**Lookup:** for an item that would read `no_annotation`, `getVol10JieshaRuntime(monthJian, pillar, activityId)` is called with key `${monthJian}${pillar}`, for example `丑丙寅`. The authority is context-fixed, so there is no date key.

| Runtime status | Result |
|---|---|
| `APPLIED` | the cell decides: `avoid`, or `no_annotation` kept. The item gets `authority: xieji-vol10-jiesha-faithful-v1`. |
| `EXCLUDED_PENDING_GLYPH_AUDIT` | legacy verdict, plus `authorityExclusion` |
| unknown context, uncovered activity, missing APPLIED cell, reached UNREACHABLE activity | throws |

A malformed authority (counts, schema, coverage states, missing exclusion reason or debt id) throws at import.

**Unchanged:** generic `cancel_both`; 災煞, 月煞, 月刑, 重日 and 復日; generic 德 behaviour; heading normalization; P4 (engine, heading annotation, adapter, Golden v2); the medical adapter; the scope label. `classicalResolution.version` stays `xieji-vol10-v2`: the item shape is unchanged apart from two optional fields.

## Actual migration impact, 1900–2100

Real production, legacy vs `faithful-v1`, over every one of the 1,636 scope dates plus every 2025–2027 day (2,710 dates in all):

| Measure | Count |
|---|---|
| Affected dates | 1,615 |
| Rows outside scope | 0 (the 1,095 window days are invariant) |
| Verdict changes (`no_annotation` → `avoid`) | 17,631 |
| — of which without score effect (21 dates in 2025–2027, where P4 balancing owns scoring) | 211 |
| Raw score changes (rows) | 17,420 |
| Effective score changes | 17,420 (all −15; every one on an APPLIED avoid cell) |
| Visible activity changes | 17,420 |
| Rating changes | neutral→watch 11,764; watch→avoid 3,223; recommended→watch 1,615; consider→avoid 818 |
| Activity changes in 2025–2027 | 0 |
| Event rows (score change) | 5,220 |
| Event classification changes | move_house caution→not_recommended 1,022; wedding 818; groundbreaking 424; open_business 312 |

Per-row data is in `migration-rows.json`: date, context, activity, authority cell, score, status, hard warning and row change, plus event results. The summary is `migration-summary.json`.

## Simulator reconciliation

1. **Against the approved candidate, exact.** `xiejiVol10JieshaMigration.test.ts` compares production with an independent simulator-style graph on every date: legacy runtime plus a `resolveVol10` wrapper that flips 劫煞 `cancel_both` `no_annotation` items from the docs candidate. Activities and events match exactly, with 0 mismatches over 2,710 dates.
2. **Against the d79b08e faithful simulator (`raw.json`).** That run used the P17-0 table and also applied its P4 candidate in 2025–2027.

| Category | Activities | Events |
|---|---|---|
| identical | 17,108 | 4,908 |
| production only: 未-壬申 wedding, engagement, moving (P17-A, approved authority) | 312 | 312 |
| simulator only, 2025–2027 (its P4 candidate; P4 is not migrated) | 134 | 58 |
| residual | **0** | **0** |

| Activity | Simulator authority | Production v1 status | Impact difference | Reason |
|---|---|---|---|---|
| demolition | no cells (never matched) | EXCLUDED_PENDING_GLYPH_AUDIT | 0 (simulator 0, production 0) | 壞/壊 (G1) |
| contract | 16 cells | UNREACHABLE | 0 outside 2025–2027; the simulator's 5 in-window rows came from its P4 candidate | 劵/券 (G2) |
| transaction | 16 cells | UNREACHABLE | same as contract | 劵/券 (G2) |

All other activities reconcile exactly, after accounting for the approved P17-A cells.

## Golden

- `golden-xieji-vol10-scoring.json` (v1) is byte-identical (`c3d8b0d7…0118`). Its test pins `legacy-cancel-both`.
- The successor `golden-xieji-vol10-scoring-v2.json` has 46 cases, hand-derived from the projection.
  - `jie-chen-no-de` flips to avoid.
  - New cases cover P17-A (未-壬申 wedding, engagement), D-A (丑-丙寅 construction avoid, wedding blank), the owner ruling (未-戊申 finance blank), the demolition exclusion and contract unreachable.
  - Provenance names the source authority, the projection, both exclusions and unchanged normalization.
- P4 Golden v2 is byte-identical, checked against its lock.

## Tests and gates

| Test | Covers |
|---|---|
| `xiejiVol10JieshaAuthority.test.ts` | shipped policy and resolver default; cell-for-cell equality with the approved candidate; fail-loudly; coverage states against the real `resolveVol10` listing; coverage manifest; a 720-context scan (exactly the 16 contexts, with demolition explicitly excluded); 子午卯酉, 德 and other gods out of scope; the corrections |
| `xiejiVol10JieshaMigration.test.ts` | one date per context against the independent simulator. `JIESHA_MIGRATION_FULL=1` runs the full range and writes the artifact. |
| `xiejiVol10JieshaMigrationLock.test.ts` | artifact hashes, impact, reconciliation, old Golden and P4 Golden v2 invariance |
| `xiejiVol10ScoringV2.test.ts` | Golden v2 under `faithful-v1` |

Historical frozen comparisons now pin `legacy-cancel-both` in their existing manifest mocks; no baseline was edited. They are `baijiTyHoiMigration`, `kaishiDoubleCountMigration`, `legacyGodsMonthJian`, `p4AdapterBaseline`, `p4MigrationRollback`, `sameHeadingDuplicateMigration`, `xiejiVol10Activation`, `p4MigrationDiff` and `xiejiVol10Scoring` (v1). In `xiejiVol10Resolution`, the hand-derived 辰-乙巳 case now asserts both policies.

`scripts/audit-vol10-jiesha-mutations.py` runs 14 mutation gates, all caught (`mutation-results.json`):

- revert the default (manifest);
- resolver default set to legacy;
- branch never flagged;
- faithful demolition without a new revision;
- demolition as a silent fallback;
- 劵→券 normalization;
- an UNREACHABLE activity reached silently;
- an APPLIED cell changed;
- the P17-A cell removed;
- an exclusion reason removed;
- another god outside the scope;
- applied when 德 is present;
- 丑-丙寅 moved into 德 scope;
- generic `cancel_both` changed.

The `jie_sha` guard and the 辰戌丑未 guard are each redundant on current data, so removing only one is an equivalent mutant; the gate removes both. The script and the full migration proof are appended to `ci:p4`.

## Glyph debt (follow-up audits, not solved here)

- **G1 壞/壊:** do production 破屋壊垣 and source/P4 破屋壞垣 represent the same heading for authority purposes? If yes, audit and approve the 15 demolition cells (the engine keeps 劫煞 忌 in 15 of 16 contexts) before an Option C v2.
- **G2 劵/券:** should the 卷十 normalization layer canonicalize 劵 → 券? This must be audited repository-wide, because changing `NORM` affects entries beyond 劫煞.
