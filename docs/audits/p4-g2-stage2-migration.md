# G2 Stage 2: 立劵交易 → 立券交易, production migration report

2026-10-25. Branch `claude/g2-stage2` from `origin/main` `58faf3a` (PR #101 merged, docs only since the PR #100 Stage 1 merge `d47bcc6`). The work implements the frozen spec [`p4-g2-vol10-heading-match.md`](p4-g2-vol10-heading-match.md) §13. Nothing has been pushed, merged or deployed.

Evidence is in [`sources/p4-vol10/g2-stage2/`](sources/p4-vol10/g2-stage2/), [`p4-score-golden-v4/`](sources/p4-vol10/p4-score-golden-v4/) and [`p4-adapter-baseline-v2/`](sources/p4-vol10/p4-adapter-baseline-v2/).

**`未-戊申 × 立券交易 authority audit remains open and is not resolved by G2 Stage 2.`** ([item](p4-weishen-lijuan-authority-item.md))

## 1. Preflight (before any edit)

| Item | Value |
|---|---|
| `origin/main` | `58faf3ad1715…`. Diff from the Stage 1 base `d47bcc6`: `PROJECT_CONTEXT.md`, `docs/project-context/history.md` only |
| Working tree / stash | clean except untracked `.claude/`; `stash@{0}` (ci-phase1 WIP) untouched |
| `datasetVersion` / `schemaVersion` | `1.2.1` / `1.1.0` |
| `P4_SCORE_ADAPTER_VERSION` / `p4ScoreHeadingLookup` | `p4-score-adapter-v1` / `canonical-v1` |
| 劫煞 authority / policy | `xieji-vol10-jiesha-faithful-v1` / `faithful-v1` |
| Stage 1 lock (11 inputs, 11 outputs) | every sha256 matches |

Stage 1 reproduction on current main (a `58faf3a` worktree, so later edits could not leak in):

| Gate | Result |
|---|---|
| `G2_FULL=1` candidate impact | PASS, `candidate-impact.json` / `.tsv` byte-equal (64 s) |
| `G2_RANGE=1` activities every day | PASS, `range-impact.json` byte-equal (145 s) |
| `G2_RANGE=1 G2_EVENTS_FULL=1` events every day | PASS, `range-impact-events.json` byte-equal (409 s) |
| `bound.py` | PASS: 26 candidate days, 12 changed, subset |
| `build_evidence.py` | `source-evidence.json` byte-equal. `inventory.json` differs **in the documentation layer only**: it already differed at `d47bcc6`, because the authority-item doc was added after the inventory froze, and PR #101 adds two more docs. Source transcription, source data, runtime, test and derived layers are identical. Not regenerated |
| `check:audit-clean` | clean |

Production on current main reproduces the Stage 1 baseline. Nothing moved.

## 2. Production change

Three runtime files. `git diff 58faf3a -- shared/almanac-data shared/lunar ':!*.test.ts'` also lists test-only material: `golden-xieji-vol10-scoring-v3.json` (test data) and the helpers `g2Rollback.ts`, `xiejiVol10ScoringGolden.ts` and `lockAnchor.ts` (§8). The runtime diff is:

```diff
 shared/almanac-data/xiejibianfangshu-vol10-yiji.json   headingAliases
-    "補捉": ["捕捉"]
+    "補捉": ["捕捉"],
+    "立劵交易": ["立券交易"]
 shared/lunar/xiejiVol10JieshaAuthority.ts
-import authority from '../almanac-data/xieji-vol10-jiesha-authority-v1.json'
+import authority from '../almanac-data/xieji-vol10-jiesha-authority-v2.json'
 shared/almanac-data/xieji-vol10-jiesha-authority-v2.json   (new)
```

- **Alias.** One `headingAliases` entry. The six 卷十 avoid lists keep 立劵交易, and so do `sourceRaw` and the raw transcriptions. `NORM` has no 劵. No other alias was added. `splitHeadings('立劵交易') = ['立券交易']`; `splitHeadings('開市立劵交易納財') = ['開市', '立券交易', '納財']`.
- **Collision.** The reverse group is 立券交易 ← {立券交易 (activity map), 立劵交易 (卷十)}. Those are the same heading, and no distinct activities merge (spec §8). No other 劵 heading exists in the vocabulary.
- **Authority v2** (`build_authority_v2.py`, which asserts the v1 sha). Diff from v1 (`authority-v1-v2.json`):
  - `version` → `xieji-vol10-jiesha-faithful-v2`;
  - the `runtimeCoverage.projection` note;
  - `provenance.supersedes` / `g2` / `generator`;
  - contract and transaction: `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION` → `APPLIED`.
- **Cells changed: 0.** Counts are unchanged and no other coverage entry changed. Applied cells go from 352 to 384. Contract and transaction each have 3 avoid cells (未丙申, 未壬申, 未庚申) and 13 blank, and **未戊申 is blank for both**.
- **I1** follows from the existing representation: a reached blank cell yields `no_annotation`. There is no date exception, inert state or compatibility setting. v1 is byte-frozen (`13ba27ee…`).

## 3. Version decisions

| Version | Decision | Evidence |
|---|---|---|
| 劫煞 authority | **v2** (`xieji-vol10-jiesha-faithful-v2`, new file; v1 kept) | §2 |
| `xiejiVol10JieshaPolicy` | **unchanged `faithful-v1`** | It names the reading rule (辰戌丑未 no-德 → authority table), which is unchanged. Only the table version moves |
| `P4_SCORE_ADAPTER_VERSION` | **NO BUMP** | Adapter rules are unchanged. A bump would rewrite `classical.version` on lifted rows of every activity and break the other-activity = 0 envelope |
| P4 lookup | **`canonical-v1` unchanged** | G2 is a 卷十 matching change. P4 states change on 0 rows (§5) |
| `datasetVersion` | **NO_BUMP (stays 1.2.1)** | See below |

**What `datasetVersion` controls** (grep of `shared`, `src`, `functions`, `scripts`, `vite.config.ts`):

1. The in-memory `getAlmanac` memo key (`almanac.ts:115`). It resets on every page load.
2. The stamp on every event evaluation (`eventEvaluation.ts:83`). `eventOutput` strips it from all baselines and diffs.

It controls nothing else:
- `functions/` does not read it.
- No computed almanac or evaluation is persisted on the client. localStorage and IndexedDB hold UI flags and user data only.
- The service worker (`VitePWA`, workbox `globPatterns`) precaches content-hashed build output. The changed JSON is bundled, so the chunk hash rotates on deploy whatever `datasetVersion` says.
- SEO day pages are prerendered at build.

A bump would invalidate nothing that is not already invalidated, and would change every event stamp and the pinned `eventEvaluation.test.ts` value.

## 4. Authority id stamp (reviewer-visible decision)

`resolveVol10` stamps `authority: VOL10_JIESHA_AUTHORITY_ID` on every reached 劫煞 item, and events expose those items in `classicalResolution`. So v2's new id changes the raw event JSON on every evaluation that reaches the authority, for any activity, even where nothing else differs.

**Stage 1 measured with the id held at v1.** Its candidate mock spread `...real` and so kept `version`. The frozen 4,330 / 289,270 counts therefore mean "behaviour with the authority id fixed".

**The Stage 2 harness compares with the id normalized** (v2 → v1), exactly as `eventOutput` strips `datasetVersion` / `engineVersion` so that a version bump alone is not a diff.
- Evaluations that differ **only** by the id are counted separately as `authorityStampOnly`: **252 domain, 19,380 outside**.
- Raw changed evaluations = 293,600 + 19,632 = 313,232.
- Activity records carry no stamp; the harness throws if one appears.
- `eventOutput`, `recSha` and every baseline are untouched.

## 5. Frozen envelope: exhaustive, every day 1900-01-01 … 2100-12-31

Source: `summary.json` (`compare.py` over five per-row dumps). There is no sampling: 73,414 days × 32 activities × 11 events × {no hour, 9}. Each dump took about 198 s; the comparison took 11 s.

**Activities (rollback → forward):**

| Set | Days | Conclusion | Score (lower / higher) | Status | Hard warning | P4 state | Other activities | Evidence or state |
|---|---|---|---|---|---|---|---|---|
| P4 domain 2025–2027 | 1,095 / 1,095 | **24** (12 dates) | 24 (**0 / 24**) | **24** | **0** | **0** | **0** | 24 |
| Outside the domain | 72,319 | **13,856** | 13,856 (**2,020 / 11,836**) | **13,254** | **0** | **0** | **0** | 37,372 |

- **Domain status transitions:** `watch→neutral` 22, `avoid→neutral` 2.
- **Outside:** `watch→neutral` 5,616, `watch→recommended` 4,022, `no_evidence→avoid` 1,810, `avoid→neutral` 1,596, `watch→strong_avoid` 210.
- **Domain dates:** 2025-07-14, 2025-08-03, 2025-08-22, 2025-11-11, 2026-05-03, 2026-07-09, 2026-07-29, 2026-08-17, 2027-04-28, 2027-07-24, 2027-08-12, 2027-09-05.
- **Other activities** are compared on the **whole record sha**, which is stricter than Stage 1's score/status/verdict check. That covers demolition, finance, construction, travel, marriage, burial and all the rest: 0 on every day.

**Events (score and classification overlap; they are not summed):**

| Set | Changed evaluations | Score | Classification | Evidence only |
|---|---|---|---|---|
| P4 domain | **4,330** | **108** | **72** | **4,222** |
| Outside | **289,270** | **62,352** | **44,942** | **226,918** |
| **Total** | **293,600** = 4,330 + 289,270 | | | |

- Only the five event types whose profile holds contract or transaction change: `sign_contract`, `buy_property`, `buy_vehicle`, `property_handover`, `receive_vehicle` (`event-diff.json`).
- **Every field equals the frozen Stage 1 `range-impact-events.json`** (`frozenStage1Equal`), and the domain rows equal `candidate-impact.tsv`.
- **Unexpected: 0.** That covers other-activity, P4-state and hard-warning changes, changed rows not reproduced by the independent model, and rows not explained (P4 state or hard warning moved).

## 6. 未-戊申 (I1)

- The cell stays BLANK in authority v2, and I1 is active when reached:
  - `resolveVol10` on 未-戊申 with 劫煞 gives `no_annotation` (forward), `not_listed` (rollback) and `avoid` (the dependency model);
  - all three are pinned in `p4G2Stage2Migration.test.ts`.
- **The dependency (model `weishen`: text model with the cell set to avoid) is retained in the envelope, not subtracted:**
  - outside the domain: **212 activity rows** (106 dates × 2; blank gives a higher score than 忌 on all of them), and **1,060** events (**954** score, **636** classification);
  - P4 domain: **0** activity rows, and **20** events, evidence only.
- These numbers equal Stage 1. 2028-07-22 is not a Stage 2 witness.

## 7. Witnesses (contract; transaction identical; hard warning false before and after)

| Date | Rollback | Forward |
|---|---|---|
| 2025-11-11 | 20 avoid | 50 neutral |
| 2025-07-14 | 35 watch | 50 neutral |
| 2026-05-03 | 35 watch | 50 neutral |
| 2028-02-22 | 50 no_evidence | 25 avoid |
| 2028-02-08 | 40 watch | 70 recommended |
| 2028-03-10 | 30 watch | 45 watch |
| 2028-09-26 | 35 watch | 35 watch (evidence only: `kiep_sat:applied:avoid` from the approved avoid cell) |

## 8. Golden, baselines and successors

**Score Golden v4** (`p4-score-golden-v4/`):
- **Generator:** `golden.py` loads the v3 generator unchanged (sha `071ffae3…` asserted; frozen v2 reference adapter plus the G1-a fold). It swaps one input: layer C's flag-OFF baseline rows come from **baseline v2**.
- **Independent constraint:**
  - layer B must equal v3 byte for byte; it is reused, not copied;
  - the rows where layer C differs from v3 must be **exactly** the frozen Stage 1 domain rows of `g2-stage1/candidate-impact.tsv`, which was measured before any Stage 2 code, with the same old and new score and status, state `baseline` and hard warning false.
- **v3 → v4:** 24 rows, 12 dates, contract and transaction only. Score is 0 lower and 24 higher, status changes 24, hard warning 0, layer B 0. No demolition or other drift.
- **Hashes:** `activity-scores.tsv` `a1a1d1b3…`, lock `0a897bdd…`. It reproduces byte for byte.
- **Gate:** `p4ScoreGoldenV4.test.ts` (forward). `P4_SCORE_ADAPTER_FULL=1` runs all 1,098 dates (35,040 rows): PASS.
- **Golden v3** is unchanged. Its gate is pinned to the rollback and passes in full mode.

**Baseline v2** (`p4-adapter-baseline-v2/`):
- It uses the v1 flag-OFF configuration on the forward graph.
- Diff from v1: 554 activity rows (277 dates × contract / transaction) and 4,350 event rows (870 each for the five G2-profile events). The test asserts that nothing else moved.
- Hashes: `activities.tsv` `16cae273…`, `events.tsv` `c4cc8be6…`.

**Scoring Golden v3** (`golden-xieji-vol10-scoring-v3.json`, `cb18c3c2…`):
- Built from v2 (sha asserted) by `build_scoring_golden_v3.py`.
- `jie-chen-contract-unreachable` is replaced by two hand-derived cases:
  - `jie-chen-contract-applied` (辰乙巳 blank → `no_annotation`, kiep_sat informational);
  - `jie-wei-renshen-contract-avoid` (未壬申 avoid → −15 kept).
- v2 (46 cases) runs on the rollback graph and v3 (47 cases) on forward, through one shared runner (`xiejiVol10ScoringGolden.ts`).

**Every test that broke, by class** (`blast-radius.json` listed 20 tests in 14 files; 21 failed here, adding the Stage 1 audit itself and the v1-id pin in `xiejiVol10Resolution.test.ts`):

| Test | Class | Action |
|---|---|---|
| `p4AdapterBaseline` | rollback pin | `g2Rollback.ts` pins; v1 files unchanged. Successor `p4AdapterBaselineV2` |
| `p4MigrationRollback`, `p4MigrationDiff` (×2) | rollback pin | Roadmap 9 / 9b evidence against baseline v1 |
| `p4ScoreAdapterAlmanac` (Golden v2 gate) | rollback pin | Already the `source-key-v1` rollback gate |
| `p4ScoreGoldenV3` (fails full mode only) | rollback pin | Successor `p4ScoreGoldenV4` |
| `legacyGodsMonthJian`, `sameHeadingDuplicateMigration`, `xiejiVol10Activation` (×2) | rollback pin | Historical migrations measured on the pre-G2 backdrop; same pattern as their existing "Frozen before … faithful-v1: pinned to legacy-cancel-both" |
| `p4G2Stage1Audit` | rollback pin | Every model starts from the rollback. Frozen artifacts reproduce byte-equal in this tree (`G2_FULL=1`: PASS) |
| `xiejiVol10ScoringV2` `jie-chen-contract-unreachable` | rollback pin + successor | v2 on the rollback graph; scoring Golden v3 forward |
| `xiejiVol10JieshaAuthority` (4) | expected successor / obsolete assertion superseded by v2 | The test now reads v2: contract APPLIED, 未-戊申 `no_annotation` (I1), `splitHeadings('立劵交易') = ['立券交易']`, UNREACHABLE = [ ]. The Option C v1 coverage manifest is still computed from v1 (frozen artifact) |
| `xiejiVol10Resolution` (authority id) | obsolete assertion superseded by v2 | id → v2 |
| `p4ChouBingyinYuedeAuditLock`, `p4OptionCFinalGateLock`, `xiejiVol10JieshaMigrationLock`, `p4JieshaFaithfulVol10`, `p4JieshaOverlapImpact` | historical lock, input moved | See the list after this table |
| Genuine regressions | — | **none** |

How the five historical lock tests were handled:
- Full Golden v2's lock pins `xiejibianfangshu-vol10-yiji.json` as an input. The tests now read inputs outside the Golden directory at the lock anchor (`lockFileDigests`, owner rule 2026-10-17), as `p4FullGoldenV2.test.ts` already does.
- The Golden's derivation does not read `headingAliases` (`ji/scopes.py` hard-codes the four old aliases). With the Stage 2 JSON it re-derives `scopes.tsv` byte for byte; only `scopes-summary.json`'s recorded input sha moves.
- The two harness files are themselves sha-locked (`jiesha-faithful-vol10-v1`, `jiesha-overlap-impact-v1`), and the approved candidate `candidate-final.json` (b24f6f68) pins the faithful lock by sha. So **no lock file changes**. The two artifact-lock tests check a harness file outside the lock directory as a historical proof: its locked sha must be a committed version of that file (`lockAnchor.committedWithDigest`). The anchor-commit rule cannot hold here, because both harnesses were committed after their locks. The sweep code is unchanged and `raw.json` is not regenerated.

**Changes to frozen-evidence machinery (reviewer decisions, listed together).** None of them regenerates a frozen output:
1. `p4JieshaFaithfulVol10Lock` and `p4JieshaOverlapImpactLock` verify the edited harness through `committedWithDigest`. A dated lock revision was tried first and reverted (`f9c1766`), because it broke the approved candidate's pin.
2. `scripts/audit-p4-full-golden-mutations.py`: the control worktree now restores the Full Golden v2 lock's outside inputs as committed at the lock anchor. Before this, `scopes.py --write` re-recorded the new vol10 sha in `scopes-summary.json` and the control was not byte-clean. With the anchor inputs the control is clean, and `mutation/report.json` is verified unchanged.
3. Pre-G2 test files pinned to `g2Rollback.ts`. Their frozen files are unchanged.

Test-only helpers:
- `g2Rollback.ts`: alias removed + authority v1 at the v2 path, plus `reloadUnderG2Pins`. `src/test/setup.ts` preloads the P4 provider, whose graph already holds the resolver, so pinned files reset the graph from `vi.hoisted`.
- `lockAnchor.lockFileDigests`.

**Mutation guard** (`scripts/audit-vol10-jiesha-mutations.py`, v2 report `g2-stage2/mutation-results.json`; the v1 report is frozen): **16/16 caught**.
- `jian_quan_normalized` now targets the no-fold check: with the alias, a `NORM` 劵→券 is behaviour-equivalent.
- New: `g2_alias_removed`, `g2_authority_v1_restored` (fails loudly: "contract is UNREACHABLE… but was reached").
- `unreachable_reached_silently` now targets the alias-with-v1 guard.

## 9. Rollback proof (`rollback.json`)

| Phase | Configuration | Dump sha256 (every day 1900–2100) |
|---|---|---|
| Pre-G2 main | `58faf3a` worktree, same harness | `8c3833ca…` |
| Stage 2 rollback | alias removed + authority v1 | `8c3833ca…` (**byte-identical to pre-G2**) |
| Stage 2 forward | shipped | `f21ea1a4…` |
| Re-enable | forward again, after rollback in one process | `f21ea1a4…` (**byte-identical to forward**) |

The rollback dump uses raw hashes. The authority id is v1 there, so this is equivalence of whole records and events, not only of conclusions.

The tests cover the same three phases on P4 data:
- forward: Golden v4 full PASS, baseline v2 PASS;
- rollback: Golden v3 full PASS, baseline v1 + roadmap 9 rollback PASS, Stage 1 artifacts byte-equal;
- witnesses: rollback → forward exact.

**Production rollback** = revert the feat commit: remove the alias line and re-import v1. There is no flag.

## 10. Independent verification

1. **The production alias matches the frozen Stage 1 candidate.**
   - Every frozen count equals Stage 1.
   - The domain rows equal `candidate-impact.tsv`.
   - The Stage 1 audit re-run in this tree (alias-table model on the rollback base) is byte-equal.
2. **An independent mechanism gives the same output.** The text model drops the alias and respells the six 卷十 avoid lists to 立券交易 (quotes untouched). Its full dump is **byte-identical** to forward (`f21ea1a4…`): 0 differing rows, activities and events.
3. **Bound.** The 12 changed domain dates are the Stage 1 set, and `bound.py` passes (12 ⊆ 26).
4. **Event envelope.** It equals the exhaustive Stage 1 envelope on every field.
5. **No new dates or activities.** Only contract and transaction change, and only the five G2-profile events.

## 11. G1-b protection

G1-b artifacts are not regenerated. `git diff 58faf3a` is empty for `p4-migration-diff-v3/`, `p4-score-golden-v3/`, `p4-adapter-baseline-v1/`, `g2-stage1/`, the Option C and harness locks, authority v1 and scoring Golden v2.

- **`p4MigrationDiffV3`** (`P4_MIGRATION_V3_FULL=1`): **11/11**.
  - The domain gate, the owner witnesses, the cross-evidence, isolation and "files equal the lock" all run on the **shipped G2 graph**.
  - The demolition envelope holds: **353** changed days, **320** score, **337** status, **0** hard warning, 0 other activities.
  - All five witnesses are `baseline 35 watch → only_ji 20 avoid`.
  - Migration Diff v3 files are byte-equal to their lock.
- **Only the Golden-anchored rollback proof** (forward = Golden v3, rollback = v2, re-enable = v3) runs on the pre-G2 rollback graph, because those Goldens carry pre-G2 contract rows.
- **Demolition is unchanged by G2 on every day 1900–2100**: whole-record sha, §5. The Golden v4 vs v3 diff also has 0 demolition rows.
- `test:p4:heading-lookup-full`: **12/12**.

## 12. Gates

All on this branch. `ci:p4:full` ran at `c82b681`. The only later commit, `f9c1766`, touches two artifact-lock tests and `lockAnchor.ts`, which `npm test` covers.

| Command | Result | Time |
|---|---|---|
| Stage 1 reproduction (§1), on current main | PASS | 64 s / 145 s / 409 s |
| `npm run ci:p4:full` | **PASS**. Remaining-ji 12/12, yi, warehouse 12, puzhu06 16, full-golden control clean and report verified, owner rules, owner-rule mutations 29. Score adapter + Golden v3 + **v4 full** 20/20. Golden v3 / v4 / authority v2 / scoring v3 generators verified. Score-adapter mutations. Migration diff 9b full. **Diff v3 full 11/11**. Migration mutations 20. Option C full 2/2 (`migration-rows.json` byte-equal). **vol10 劫煞 mutations 16/16**. Heading lookup full 12/12 | 1,047 s |
| `npm test` | **PASS**: 8,416 passed, 15 skipped, 0 failed | 92 s |
| `npm run typecheck` (incl. `functions/`) | PASS | 6 s |
| `npm run check:fast` (lint + typecheck) | PASS. Lint warnings are only the existing `p4G2Stage1Audit` comma expressions | 5 s |
| `npm run ci:p4:fast` | **PASS**: 5,529 passed | 50 s |
| `npm run build` | PASS | 12 s |
| `npm run check:audit-clean` | PASS (`docs/audits/sources/: clean`) | 0 s |
| `npm run test:p4:puzhu17-freeze` | PASS on Stage 2 (and on pre-G2 main) | — |
| `npx prettier --check` on new and changed TS / JSON | PASS | — |
| `G2_FULL=1 p4G2Stage1Audit` in this tree (rollback base) | PASS, frozen Stage 1 artifacts byte-equal | 54 s |
| Exhaustive dumps at HEAD `c82b681` (forward, rollback→re-enable, text, 未-戊申) + `compare.py` verify | **PASS**: the 4 committed artifacts reproduce byte for byte | 160–292 s per dump (parallel); compare 11 s |
| `python3 scripts/audit-vol10-jiesha-mutations.py` | 16/16 | 18 s |

**Not run:** `ci:full`'s emulator and Playwright suites. Playwright's fixed clock (2026-09-23) has no G2 activity change on any spec date; event pages were not checked visually.

**Where the gates live.**
- `ci:p4` now also runs the Golden v4 full gate and the three Stage 2 generators in verify mode.
- The exhaustive dumps (about 3.5 min with 5 parallel processes) are documented in `g2-stage2/lock.json` → `reproduce`, and are not part of `npm test`.
- `p4G2Stage2Migration.test.ts` asserts the committed `summary.json` / `rollback.json` against the frozen Stage 1 numbers and the three byte equalities on every run.

## 13. Known limitations

- **Evidence strength.** `bound.py` bounds days; it does not recompute verdicts. The independent check is a second mechanism inside the same engine, not a re-implementation of `resolveVol10`.
- **Dump hashes.** Dump rows use 64-bit sha prefixes. A collision could hide a diff; it cannot create one. The file-level sha256 is a full sha256.
- **What `authorityStampOnly` changes.** It changes the raw event JSON on 19,632 evaluations without changing behaviour. Consumers that hash raw event output (none in `src/`) would see that.
- **Re-running the pre-G2 dump** needs a `58faf3a` worktree (`g2-stage2/lock.json`).
- **Full-mode audit sweeps not re-run** (`JIESHA_FAITHFUL_FULL`, `JIESHA_IMPACT_FULL`). They are historical simulators, not gates, and their `raw.json` stays as run.
- **`inventory.json` (Stage 1)** is stale in the documentation layer only (§1).
- **Still open:** the `未-戊申 × 立券交易` audit. G1 demolition cells (Option C v2) are untouched.
