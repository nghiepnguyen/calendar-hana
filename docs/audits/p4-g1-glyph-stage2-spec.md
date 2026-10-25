# G1 glyph Stage 2: production migration specification (R3)

2026-10-25. Branch `claude/g1-glyph-stage1-audit`, base `origin/main` `f3c68c6`. **This is a specification only.** No production file is changed by this document. Implementation, migration evidence and review come first; there is no push, merge or deploy before that review.

Stage 1: [p4-g1-demolition-glyph-authority.md](p4-g1-demolition-glyph-authority.md), artifacts in [`sources/p4-vol10/g1-glyph-stage1/`](sources/p4-vol10/g1-glyph-stage1/).

## 1. Owner ruling (2026-10-25)

| Decision | Ruling |
|---|---|
| Representation | **R3 APPROVED**: activation at context level. R1, R2 and R4 are not implemented. |
| 11 A/B-grade contexts | **APPROVED** for production, with their Stage 1 provenance grades preserved |
| 5 date-dependent contexts | stay excluded, with an explicit context-level state. They are never a static `blank` or `avoid`. They get no civil-date exception, no hidden fallback, no new 土王用事 runtime dependency and no date-aware cells. |
| R3 blast radius | **APPROVED**, as frozen in §6 |
| `datasetVersion` | **1.2.1 kept** (see §9) |
| R2 / extended 土王用事 authority | **NOT APPROVED, DEFERRED.** It is a separate item: [p4-g1-demolition-soil-authority-item.md](p4-g1-demolition-soil-authority-item.md). |

Already frozen and not reopened:
- identity `SAME_ACTIVITY_ALIAS_CONFIRMED`;
- canonical 破屋壊垣;
- G1-b (353 / 320 / 337 / 0, 5 witnesses);
- G2 (alias, authority v2 cells, 未-戊申 × contract/transaction BLANK / I1);
- the 2025-02-02 soil boundary.

## 2. Accepted representation

- **Identity and heading.** 破屋壞垣 ≡ 破屋壊垣. Runtime keeps `NORM 壞→壊` unchanged. **No alias** is added. `sourceRaw` stays as written everywhere: raw texts, vol10 JSON, the activity map, quotes.
- **Activity.** `demolition` = [破屋壞垣], exactly.
- **Authority successor.** `shared/almanac-data/xieji-vol10-jiesha-authority-v3.json`, version `xieji-vol10-jiesha-faithful-v3`. v1 and v2 stay byte-frozen.

## 3. Authority v3 schema (context-level coverage)

v3 = v2 plus demolition. Every v2 cell, count and coverage entry for the other 24 activities is copied unchanged, and the generator asserts this.

**Cells.**
- The 11 APPLIED contexts get demolition = `avoid`:
  - 辰乙巳, 辰己巳, 辰癸巳, 辰辛巳;
  - 未丙申, 未壬申, 未庚申;
  - 戌丁亥, 戌乙亥, 戌己亥, 戌癸亥.
- The 5 excluded contexts (丑甲寅, 丑丙寅, 丑壬寅, 丑戊寅, 未戊申) have **no demolition key at all**. They have no `blank`, no `avoid` and no placeholder value.

**Counts.**
- `activities`: 25 (demolition added).
- `cells`: 384 + 11 = 395.
- `avoid`: 177 + 11 = 188.
- `blank`: 207.

**runtimeCoverage.activities.demolition**

```json
{
  "status": "APPLIED_BY_CONTEXT",
  "contexts": {
    "辰乙巳": { "status": "APPLIED", "cell": "avoid", "grade": "A",
               "identityApproved": true, "authorityApproved": true, "productionApproved": true },
    "...": "11 APPLIED contexts, grades as authority-candidate.json gradeSoilAbsent (A ×7, B ×4)",
    "丑壬寅": { "status": "EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY",
               "grade": { "outOfWindow": "A", "inWindow2025_2027": "B", "inWindowOutside": "C" },
               "identityApproved": true, "authorityApproved": false, "productionApproved": false,
               "reason": "cell depends on 土王用事 (blank out of window, avoid in window); not representable per context",
               "debt": "G1-SOIL" }
  }
}
```

- **Grades** are copied, not re-derived, from `g1-glyph-stage1/authority-candidate.json`: A for 辰×4 and 未丙申/壬申/庚申, B for 戌×4. The `cell` value in a coverage entry must equal the `cells` table.
- **New coverage statuses.**
  - `APPLIED_BY_CONTEXT` applies at activity level and requires `contexts` with exactly the 16 scope keys.
  - `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` applies at context level only.
- **Existing statuses keep their meaning.** v3 has no activity in `EXCLUDED_PENDING_GLYPH_AUDIT`. The enum value stays for v1/v2 validation, because the frozen files still use it.
- **Projection note.** "faithful-v3: v2 + demolition APPLIED in 11 contexts; 5 date-dependent contexts EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY (G1 glyph Stage 2, R3)".

**Generator.** `docs/audits/sources/p4-vol10/g1-glyph-stage2/build_authority_v3.py` reads v2 (sha-asserted) and `g1-glyph-stage1/authority-candidate.json` (sha-asserted from the Stage 1 lock). It never reads production output. It verifies by default and writes with `--write`.

## 4. Runtime changes (`xiejiVol10JieshaAuthority.ts`, `xiejiVol10Resolution.ts`)

The scoring algorithm, P4 adapter and resolver logic stay unchanged. Only the authority access path changes.

**1. Import v3.** `VOL10_JIESHA_AUTHORITY_ID` becomes `xieji-vol10-jiesha-faithful-v3`.

**2. `validate()` additions.** A malformed table must fail on import, never on some user's day. Each of these throws:
- `APPLIED_BY_CONTEXT` without `contexts`, or with any context key other than exactly the 16 scope contexts.
- A context `APPLIED` without a cell, or whose cell differs from its coverage `cell`.
- A context `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` **with** a cell, whether `blank`, `avoid` or anything else.
- An excluded context without `reason` and `debt`, or with any approval flag `true`.
- An `APPLIED` context where any approval flag is not `true` (APPLIED ⇔ identity ∧ authority ∧ production).
- Any unknown status.
- Counts that differ from `counts`.

The row-completeness rule becomes: every row holds every activity, except the (activity, context) pairs that are explicitly excluded, which must be absent.

**3. `getVol10JieshaRuntime(month, pillar, activityId)`.**
- For `APPLIED_BY_CONTEXT`, read the context entry.
  - `APPLIED` returns `{ status: 'APPLIED', cell }`.
  - `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` returns `{ status, reason }` and **never reads `cells`**.
  - A missing context throws.
- Existing paths (APPLIED, EXCLUDED_PENDING_GLYPH_AUDIT, UNREACHABLE → throw) are unchanged.

**4. Explicit cell guard.** Add `vol10JieshaCell(runtime)`, which returns `cell` only for `status === 'APPLIED'` and **throws for every other status**, naming the status and context. `resolveVol10` computes `kept` only through this guard, inside an `APPLIED` branch. It must not use a truthiness or equality shortcut that could read an excluded context as `blank` or `avoid`.

**5. Normal evaluation of an excluded context.** It keeps the approved legacy behaviour: verdict `no_annotation`, Kiếp Sát informational, `authorityExclusion: "EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY: <reason>"`, and an authority stamp (v3). Authority *application* is unreachable for these contexts.

**6. Pinned access set.**
- A test enumerates every (activity × 16 contexts) reach of `getVol10JieshaRuntime` and pins:
  - exactly 395 APPLIED;
  - exactly 5 `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY`, all demolition, at the 5 named contexts;
  - 0 of any other status.
- Any `NORM`, alias or table change that widens or narrows the set fails CI.

## 5. Fail-loud gates (audit test, mutations through `vi.doMock`, as in Stage 1 `m-*`)

| Mutation / probe | Required result |
|---|---|
| excluded context given cell `blank` | `validate()` throws on import |
| excluded context given cell `avoid` | `validate()` throws on import |
| excluded context relabelled `APPLIED`, no cell | `validate()` throws on import |
| `APPLIED` context with `productionApproved: false` | `validate()` throws on import |
| demolition `contexts` missing one of the 16 keys | `validate()` throws on import |
| `vol10JieshaCell` called on an excluded runtime | throws (no blank or avoid fallback) |
| `resolveVol10` on each of the 5 contexts, 劫煞 present, no 德 | verdict `no_annotation`, `authorityExclusion` names the new status, verdict never `avoid` |
| `NORM` still folds 壞→壊 and demolition is reachable | the 5 contexts stay excluded, so reachability alone never applies a cell |
| direct `getVol10JieshaRuntime` on an excluded context | returns the exclusion; never a cell |
| v3 with authority id replaced by v2 (rollback) | demolition `EXCLUDED_PENDING_GLYPH_AUDIT`, as shipped |

The results are frozen in `g1-glyph-stage2/mutation-results.json`. `scripts/audit-vol10-jiesha-mutations.py` gains the same mutations on the real files.

## 6. Frozen activity envelope (owner-approved; no count may move to fit an implementation)

Stage 2 forward (v3) vs rollback (v2 = shipped `f3c68c6`), every day 1900-01-01 … 2100-12-31, no sampling:

| | 2025–2027 | Outside, within 1900–2100 |
|---|---|---|
| demolition changed days | **0** | **1,119** |
| score changes | 0 | 1,119, all **−15**, higher 0 |
| status changes | 0 | 1,119: **neutral→watch 464, watch→avoid 655** |
| hard-warning changes | 0 | 0 |
| P4 state changes | 0 | 0 |
| evidence-only | 0 | 0 |
| other activities (whole-record sha, incl. contract/transaction) | **0** | **0** |
| conclusion transition | – | `kiep_sat:informational:no_annotation → kiep_sat:applied:avoid` ×1,119 |

**Independent row-level gate.** The Stage 2 changed demolition rows must equal, byte for byte on (date, context, before, after, Kiếp Sát, P4), the `candidate = fit` rows of the frozen Stage 1 `g1-glyph-stage1/candidate-impact.tsv`. Those rows were measured before any Stage 2 code. A blank cell and the legacy exclusion give the same output, so R3 must reproduce them exactly; Stage 1 §16 records that prediction.

**The 5 excluded contexts.** 0 changed rows. Every scope date in those contexts is identical to rollback, apart from the authority stamp on events.

## 7. Events

- **Semantic changes: 0**, in the domain and outside. Score 0, classification 0, evidence-only 0. This is a hard gate.
- **Authority stamp-only.**
  - Measure it with the G2 Stage 2 method: the whole event output canonically serialized; only `classicalResolution.items[].authority` normalized v3 → v2; the v3 id anywhere else throws; a second equality with the field deleted on both sides.
  - Freeze the exact full range in `g1-glyph-stage2/authority-stamp.json`.
  - Stage 1 measured 462 (domain) and 35,530 (outside) = 1,636 scope dates × 22 evaluations, on the candidate id.
  - Expected for v3: the same 462 / 35,530, because excluded contexts are stamped too.
  - Checks: raw changed = semantic + stamp-only; intersection 0; unclassified 0.
  - A different count is investigated, never adjusted.

## 8. Witnesses and controls (from Stage 1 `witnesses.json`; asserted forward vs rollback)

| Date | Context | Rollback (v2) | Stage 2 (v3) |
|---|---|---|---|
| 2024-07-07 | 未-壬申 | 50 neutral | 35 watch, Kiếp Sát applied avoid |
| 2028-04-14 | 辰-己巳 | 50 neutral | 35 watch |
| 2024-10-26 | 戌-癸亥 (土王用事) | 35 watch | 20 avoid |
| 2028-04-26 | 辰-辛巳 (土王用事) | 35 watch | 20 avoid |
| 2023-01-20 | 丑-戊寅 (excluded, in window) | 35 watch | **35 watch, unchanged**. `resolveVol10` `authorityExclusion` names the new status. Activity records never carry the field (`activityRecommendations.ts` drops it), and no mapped event profile includes demolition. That is why Stage 1 measured 0 rows here. |
| 2028-01-18 | 丑-壬寅 (excluded, in window) | 35 watch | **35 watch, unchanged** |

Controls, unchanged in both models:

| Date | Context | Why |
|---|---|---|
| 2028-01-01 | 子-乙酉 | no 劫煞 |
| 2028-01-06 | 丑-庚寅 | 劫煞 `not_avoided`, outside the no-德 branch |
| 2029-01-12 | 丑-壬寅 | excluded, out of window |
| 2025-04-06 | 辰-乙巳 | domain, P4 `neither_recorded` |
| 2025-04-30 | 辰-己巳 | domain in window, P4 `only_ji` |

G1-b's 5 witnesses (2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02, 2027-07-28) stay `only_ji / 20 / avoid` and must not move.

## 9. Versioning

| Item | Stage 2 |
|---|---|
| 劫煞 authority | **`xieji-vol10-jiesha-faithful-v3`** (new file); v1 and v2 byte-frozen |
| `manifest.policies.xiejiVol10JieshaPolicy` | `faithful-v1`, unchanged, as G2 left it |
| `datasetVersion` | **1.2.1**, unchanged. No cache correctness reason was found: the almanac cache (`almanac.ts:115`) is an in-memory `Map` per session, keyed `datasetVersion:ENGINE_VERSION:date`. A new bundle starts empty. `functions/` holds no `datasetVersion`-keyed store, and prerendered pages rebuild on every deploy. If implementation finds a persistent cache, stop and report. |
| P4 adapter | `p4-score-adapter-v1`, unchanged |
| heading lookup | `canonical-v1`, unchanged |
| scoring algorithm / weights | unchanged |

## 10. Golden lineage (checked on `origin/main`)

The repo has **two independent lineages**. The name "Score Golden v4" belongs to the first.

| Lineage | Files | Coverage | History | G1 Stage 2 |
|---|---|---|---|---|
| **P4 Score Golden** | `docs/audits/sources/p4-vol10/p4-score-golden-v1…v4/` | 2025–2027 only (35,040 rows) | v3 = G1-b `canonical-v1` (`e4c0926`); **v4 = G2 Stage 2** (`5da6824`) | **No successor.** The domain envelope is 0, so v4 must still verify byte for byte, and there is no v5. If v4 changes, stop. |
| **卷十 Scoring Golden** | `shared/almanac-data/golden-xieji-vol10-scoring{,-v2,-v3}.json` | hand-derived per-context cases | v1 legacy; v2 = Option C v1 (`db905d8`); **v3 = G2 Stage 2** (`dbef7ba`) | **Successor `golden-xieji-vol10-scoring-v4.json`** (`xieji-vol10-scoring-golden-v4`) |

**Builder.** `docs/audits/sources/p4-vol10/g1-glyph-stage2/build_scoring_golden_v4.py` follows the authoritative `build_scoring_golden_v3.py` pattern:
- it reads v3 (sha-asserted);
- it derives each case from **authority v3 cells and coverage**, never from production output.

**Expected derivation.**
- `jie-chen-demolition-excluded` (辰乙巳) becomes `jie-chen-demolition-applied`: cell `avoid`, 劫煞 verdict `avoid`, Kiếp Sát −15 applied.
- New `jie-chou-renyin-demolition-excluded` (丑壬寅): context `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY`, verdict `no_annotation`, Kiếp Sát informational, `authorityExclusion` set.
- Every other case is copied.
- The builder asserts that the case diff is exactly this, so the flip is not a manual JSON patch.

v1, v2 and v3 stay byte-frozen.
- `xiejiVol10ScoringV2.test.ts` stays on its existing pre-G2 pin: authority v1, alias removed.
- `xiejiVol10ScoringV3.test.ts` is pinned to the authority v2 graph, which is the G1 Stage 2 rollback.

**Naming note (departs from the owner's stated expectation; owner to confirm).**
- The repo uses two names:
  - **"Score Golden"** = the P4 lineage. `p4-g2-stage2-migration.md:177` names "Score Golden v4 (`p4-score-golden-v4/`)".
  - **"Scoring Golden"** = the 卷十 lineage. `:192` names "Scoring Golden v3 (`golden-xieji-vol10-scoring-v3.json`)".
- One commit title mixes them: `dbef7ba` "freeze G2 Score Golden v4" added `golden-xieji-vol10-scoring-v3.json`. That is the likely source of the expectation "Score Golden v5".
- The demolition flip sits only in the 卷十 lineage. The P4 lineage has no demolition delta.
- So the successor is **卷十 Scoring Golden v4** (`golden-xieji-vol10-scoring-v4.json`), and there is **no P4 Score Golden v5**.
- To avoid another collision, Stage 2 docs, tests and commits always write the full name "卷十 Scoring Golden v4" and never "Score Golden v4".

**Unchanged and asserted.**
- `p4-adapter-baseline-v2`: the flag-OFF baseline pins `legacy-cancel-both`, which never consults the authority.
- Migration Diff v3 and every G1-b artifact.
- G2 Stage 2 artifacts.

## 11. Existing migrations stay frozen

**G1-b.** `P4_MIGRATION_V3_FULL=1` passes with 353 / 320 / 337 / 0 and 5 witnesses. No G1-b file is regenerated.

**G2.**
- `p4G2Stage2Migration.test.ts` and `p4G2Stage1Audit.test.ts` load the "forward" graph from shipped files. After Stage 2 that graph would carry v3. They must be **pinned to authority v2**, through a rollback helper `g1GlyphRollback.ts` (`jieshaAuthorityV2()`, the analogue of `g2Rollback.ts`), so their frozen evidence (`authority-stamp.json`, `summary.json`, `rollback.json`) stays byte-identical. This follows commit `c82b681`, which pinned the G1-b proofs to the pre-G2 rollback.
- A new Stage 2 assertion: under v3, contract and transaction records are whole-record identical to v2 on every day; `未-戊申 × contract/transaction = blank` (I1); 0 G2 event semantic changes.

**The separate 未-戊申 × 立券交易 item** stays open and untouched.

## 12. Files Stage 2 touches

| File | Change |
|---|---|
| `shared/almanac-data/xieji-vol10-jiesha-authority-v3.json` | new (generated) |
| `shared/lunar/xiejiVol10JieshaAuthority.ts` | import v3; statuses; `validate()`; context lookup; `vol10JieshaCell` |
| `shared/lunar/xiejiVol10Resolution.ts` | `kept` via `vol10JieshaCell`; exclusion message; no other logic |
| `shared/lunar/g1GlyphRollback.ts` | new test-only helper (authority v2) |
| `shared/lunar/xiejiVol10JieshaAuthority.test.ts` | v3 invariants, pinned access set |
| `shared/lunar/xiejiVol10ScoringV2.test.ts` | stays on authority v1 with the alias removed (pre-G2); mock retargeted (§12a) |
| `shared/lunar/xiejiVol10ScoringV3.test.ts` | pinned to authority v2 (G1 Stage 2 rollback) |
| `shared/lunar/xiejiVol10ScoringV4.test.ts`, `golden-xieji-vol10-scoring-v4.json` | new |
| `shared/lunar/p4G2Stage2Migration.test.ts`, `p4G2Stage1Audit.test.ts`, `xiejiVol10Resolution.test.ts` | pin the authority v2 where they assert v2 |
| `shared/lunar/p4G1GlyphStage1Audit.test.ts` | its `forward` model becomes the v2 rollback; Stage 1 artifacts stay byte-frozen |
| `shared/lunar/p4G1GlyphStage2Migration.test.ts` | new: forward / rollback / re-enable dumps, envelope, witnesses, mutations, stamp gate |
| `docs/audits/sources/p4-vol10/g1-glyph-stage2/` | new: `build_authority_v3.py`, `build_scoring_golden_v4.py`, `compare.py`, `summary.json`, `activity-diff.tsv`, `authority-stamp.json`, `rollback.json`, `mutation-results.json`, `lock.json` |
| `scripts/audit-vol10-jiesha-mutations.py` | retarget to the v3 import; new context-level mutations |
| the 14 test files in §12a | mock path retargeted; authority-id assertion added |
| `package.json` `ci:p4` | add the v3 builder, the scoring v4 builder and the Stage 2 gates |
| `docs/audits/p4-g1-glyph-stage2-migration.md` | migration record |
| `PROJECT_CONTEXT.md` | G1 row and debt list, once the change ships |

## 12a. Authority mocks must be retargeted (silent-no-op hazard)

Every pin today mocks the **v2 file path**. Once `xiejiVol10JieshaAuthority.ts` imports v3, mocking the v2 path does nothing: each "rollback" or "pinned" graph would quietly load v3. Most frozen-artifact tests would fail loudly, but a model that does not assert the authority id would pass on the wrong graph.

**Hits on `origin/main`** (`git grep -n "xieji-vol10-jiesha-authority-v" -- '*.ts' 'scripts/*.py'`).

Mocking the v2 path, to retarget to the v3 path with the same content:
- `legacyGodsMonthJian.test.ts:18`
- `p4AdapterBaseline.test.ts:13`
- `p4G2Stage1Audit.test.ts:34`
- `p4G2Stage2Migration.test.ts:16`
- `p4MigrationDiff.test.ts:59`
- `p4MigrationDiffV3.test.ts:469`
- `p4MigrationRollback.test.ts:15`
- `p4ScoreAdapterAlmanac.test.ts:17`
- `p4ScoreGoldenV3.test.ts:14`
- `sameHeadingDuplicateMigration.test.ts:13`
- `xiejiVol10Activation.test.ts:12`
- `xiejiVol10JieshaMigration.test.ts:24`
- `xiejiVol10ScoringV2.test.ts:19`
- `p4G1GlyphStage1Audit.test.ts` (`AUTH`)

Other hits:
- `g2Rollback.ts:4` imports v1 content and stays as it is. Only the mocked path in its callers changes.
- `xiejiVol10JieshaAuthority.test.ts:7–8` imports v2 and v1 directly, and gains v3.
- `scripts/audit-vol10-jiesha-mutations.py:21,52` points `DATA` and its v1-swap mutation at the v2 file. Retarget them to the v3 import, and keep a v2-content mutation.

**Rules.**
- Each retargeted mock keeps exactly the content it used before (v1, v2 or a Stage 1 candidate). Only the mocked path changes.
- Every pinned model asserts `VOL10_JIESHA_AUTHORITY_ID` equals the version it expects. A mock that silently misses then fails.
- A guard test fails if any `.test.ts` mocks a `xieji-vol10-jiesha-authority-v*.json` path other than the one `xiejiVol10JieshaAuthority.ts` imports.
- Stage 2 re-runs the grep and must account for every hit in the migration record.

## 13. Rollback

- **Configuration:** authority v2 imported in place of v3. Nothing else differs, because the resolver code must still accept v2.
- **Gate:** the rollback dump equals the shipped `f3c68c6` dump, as whole-range bytes. Re-enable (rollback then forward in one process) equals forward. Both are recorded in `rollback.json` with dump sha256, following G2.

## 14. Forbidden in Stage 2

- R1 (static blank), R2 (date-aware cells or 土王用事 dependency) and R4.
- A static `blank` or `avoid` value for any of the 5 contexts.
- Civil-date exceptions or hardcoded dates in runtime.
- A hidden fallback from exclusion to a cell.
- Rewriting raw source text, global glyph modernization, or a new alias.
- Altering the G2 alias, the contract/transaction cells or the 未-戊申 G2 ruling.
- Rewriting G1-b or G2 artifacts, Migration Diff v3, P4 Score Golden v3/v4, or 卷十 Scoring Golden v1–v3.
- Changing the P4 scoring algorithm, `p4-score-adapter-v1` or `canonical-v1`.
- Changing unrelated activities or cells.
- Resolving the 未-戊申 × 立券交易 item or the G1-SOIL item.
- Bumping `datasetVersion` without a concrete cache reason.
- Adjusting any frozen count to match the implementation.

## 15. Stop conditions

Stop and report on any of these:

- any domain (2025–2027) change;
- the outside envelope differs from §6 in any count or transition;
- the Stage 2 rows differ from the Stage 1 `fit` rows;
- any other-activity or contract/transaction change;
- any event semantic change;
- stamp-only ≠ semantic-free, or any unclassified raw change;
- any excluded context changes output or reads a cell;
- a mutation in §5 is not caught;
- P4 Score Golden v4, `p4-adapter-baseline-v2`, Migration Diff v3 or the G2 frozen evidence changes;
- rollback ≠ shipped bytes;
- a persistent cache keyed by `datasetVersion` is found;
- any authority mock still targets a path the runtime does not import (§12a).

## 16. Gates before review

1. focused Stage 2 tests;
2. the full-range dumps and `compare.py`;
3. the authority stamp gate;
4. G1-b full;
5. G2 Stage 2 regression (pinned);
6. P4 Score Golden v4 verification;
7. 卷十 Scoring Golden v4;
8. `ci:p4:full`;
9. `npm test`;
10. `check:fast`;
11. `check:audit-clean`;
12. build.

Playwright is not required unless UI output changes, and it does not.

Remote state until review: pushed NO, PR NO, merged NO, deployed NO.
