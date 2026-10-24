# G1-b Stage 2: canonical-v1 P4 heading lookup, migration report

2026-10-24. Branch `claude/g1b-stage2` from `origin/main` `1ed3828`, which is PR #98 merged. The work is implemented against the frozen spec [`p4-g1b-score-lookup.md`](p4-g1b-score-lookup.md). Nothing has been pushed, merged or deployed.

## Authority layers

| Layer | What it is | Where |
|---|---|---|
| **Source authority** | 卷十一 heading 破屋壊垣. The activity map keeps the transcribed source key 破屋壞垣, and G1-a confirms `SAME_ACTIVITY_ALIAS` | `xiejibianfangshu-yiji.json` (unchanged), [G1-a](p4-g1a-demolition-authority.md) |
| **Production authority** | `manifest.policies.p4ScoreHeadingLookup`, now `"canonical-v1"`. The code default in `p4ScoreAdapter.ts` is also `canonical-v1` | `shared/almanac-data/manifest.json:42` |
| **Historical / migration evidence** | Score Golden v2 and migration diff v2 are frozen and serve as `source-key-v1` rollback evidence. Score Golden v3 and migration diff v3 are new and serve as `canonical-v1` forward evidence | `sources/p4-vol10/p4-score-golden-v{2,3}/`, `sources/p4-vol10/p4-migration-diff-v{2,3}/` |

## Production change

The flip changes three lines and nothing else.

```diff
- "p4ScoreHeadingLookup": "source-key-v1",
+ "p4ScoreHeadingLookup": "canonical-v1",
```

`p4ScoreAdapter.ts` changes in two places: the `p4ActivityState` default, and `applyP4Balancing`'s `headingLookup ?? …`. Both move from `'source-key-v1'` to `'canonical-v1'`. The comment is updated.

What does not change:

- scoring rules;
- `canonicalP4HeadingKey`, `NORM` or `splitHeadings`;
- the 土王用事 window;
- any authority or data file;
- `P4_SCORE_ADAPTER_VERSION`;
- `datasetVersion`.

**Authority path, and where Stage 2 acts:**

```
卷十一 source key 破屋壞垣 (activityEntries.demolition, sourceRaw, unchanged)
  → canonicalP4HeadingKey  (Stage 1; splitHeadings NORM 壞→壊, canonP4Heading)  = 破屋壊垣
  → headingView(activity, dayHeadings, lookup)                                  ← STAGE 2: lookup now canonical-v1
        source-key-v1: dayHeadings['破屋壞垣']  → undefined → baseline (vol10 / legacy path)
        canonical-v1:  dayHeadings['破屋壊垣']  → provider row, re-keyed under 破屋壞垣
  → p4ActivityState / applyP4Balancing (unchanged rules; deciding heading 破屋壞垣)
  → getActivityRecommendations → score / status / hard warning
```

## Versioning decisions

The spec (§4) leaves both of these to Stage 2.

**`datasetVersion` stays `1.2.1`.** The reasons:

- No data file changes. Only a manifest policy changes.
- `datasetVersion` keys only the in-memory `getAlmanac` memo (`almanac.ts:115`), which resets on reload. It is also stamped on event evaluations.
- No computed almanac output is persisted on the client: localStorage and IndexedDB hold only UI flags and user data. SEO day pages are prerendered again at deploy.
- This follows the PR #87 precedent, where the `xiejiVol10JieshaPolicy` flip did not bump the version.
- A bump would change every event evaluation's stamp and the pinned `eventEvaluation.test.ts` value, without any data change behind it.

**`P4_SCORE_ADAPTER_VERSION` stays `p4-score-adapter-v1`.** The reasons:

- The adapter's rules are unchanged. The lookup change is recorded by the manifest policy and by Score Golden v3 (`lock.json` `headingLookup`).
- A bump would rewrite `classical.version` on lifted rows of **every** activity. That would break the frozen envelope, which requires 0 changes to other activities.
- Keeping the version is the historical spec's recommendation.

## Gates and evidence

### Full-domain gate

The gate is `p4MigrationDiffV3.test.ts`, run with `P4_MIGRATION_V3_FULL=1`. It compares the production configuration under both lookups; only the lookup itself is mocked.

| Metric | Observed | Frozen (§6) |
|---|---|---|
| Domain days evaluated | 1,095 / 1,095 (2025-01-01 … 2027-12-31) | 1,095 |
| Outside controls | 3 / 3 unchanged (2024-12-31, 2028-01-01, 2035-06-15) | 0 changes |
| Activity evaluations | 35,136 (1,098 × 32) | — |
| Changed demolition days (score or status) | **353** | 353 |
| Score changes | **320** (223 lower) | 320 (223 lower) |
| Status changes | **337** | 337 |
| Hard-warning changes | 0 | 0 |
| Other-activity changes | 0 | 0 |
| Unexpected regressions | 0 | 0 |

Diff rows where any field differs: **644**, all demolition, all `EXPECTED_G1B_MIGRATION_CHANGE`. That is every day the P4 state leaves `baseline`:

| State change | Days |
|---|---|
| only_ji | 552 |
| neither_recorded | 54 |
| only_yi | 28 |
| both_present | 10 |

- **Where 353 and 644 differ.** The spec's 353 counts days where score or status changes (§6). Its §5 rows list every field. The other 291 rows change evidence only, through the path switch (vol10 302 / legacy 342 → p4), and their conclusion stays the same.
- **Classification rule.** A row is `EXPECTED` only if all of these hold:
  - the activity is demolition and the date is in the domain;
  - the source heading is 破屋壞垣;
  - the state moves from `baseline` to the canonical row's state;
  - the deciding heading is still 破屋壞垣;
  - the hard warning is unchanged.

### Owner witnesses

All five pass with exact values: `baseline / 35 / watch` → `only_ji (deciding 破屋壞垣) / 20 / avoid`, hard warning unchanged. The dates are 2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02 and 2027-07-28.

### Score Golden v3

The generator is `p4-score-golden-v3/golden.py`. It loads the frozen v2 reference adapter, whose sha is asserted, and folds only the lookup key using the G1-a alias written in the file. It reads no TS output.

- **Commit order.** Golden v3 was committed before the flip (`e4c0926`), so its lock anchor predates `canonical-v1`.
- **Records:**
  - layer B: 31,842 states (1,098 × 29)
  - layer C: 35,040 scores (1,095 × 32)
- **Mismatches against the shipped engine:** 0 on all 1,098 dates (`P4_SCORE_ADAPTER_FULL=1`).
- **Cross-check:** with the fold emptied, v3 reproduces v2 byte for byte.
- **Hashes:**
  - `activity-states.tsv` `d8ee5846…`
  - `activity-scores.tsv` `73349e9b…`
  - `lock.json` `d2b9718d…`

### Cross-evidence

Migration diff v3 comes from the running engine on the production configuration. Golden v3 comes from Python with the Golden configuration. They are derived independently and agree:

- The diff's 353 conclusion-changed (date, activity) pairs equal the set where Golden v3 differs from v2.
- Each row's before value equals Golden v2 and its after value equals Golden v3. This is tested in `p4MigrationDiffV3.test.ts` "cross-evidence".

### Rollback proof

The proof is `rollback.json`, from the full run. It flips `p4ScoreHeadingLookup` in-process and writes no data file. The source data sha is identical before and after.

| Step | Lookup | Golden | Dates | Mismatches |
|---|---|---|---|---|
| Forward | canonical-v1 | v3 | 1,095 | 0 |
| Rollback | source-key-v1 | v2 | 1,095 | 0 |
| Re-enable | canonical-v1 | v3 | 1,095 | 0 |

On rollback, the five witnesses return to `35 watch`.

**Rollback in production** means setting `"p4ScoreHeadingLookup": "source-key-v1"` in `manifest.json`. The existing v2 Golden and v2 diff tests already pin that value and pass.

### Isolation

- **One fold only.** `canonicalP4HeadingKey` folds exactly one source heading, 破屋壞垣. There is no collision, and no source heading is already spelled canonically.
- **G2 is excluded.** `立券交易` is unchanged.
- **`sourceRaw` is preserved.** `activityEntries.demolition = ['破屋壞垣']`, `entries` has no 破屋壊垣, and every changed row keeps the deciding heading 破屋壞垣.
- **No missing lookups.** An unknown activity stays `baseline`. No heading activity reads a missing key on any domain day under `canonical-v1`.
- **The scoring algorithm is unchanged.** `canonical-v1` on canonical keys gives the same state and rows as `source-key-v1` on source keys, for every P4 state, with `prot` and `all_taboo`.

- **Events.** No `EVENT_OPTIONS` type resolves to `demolition`, either as an activity or as a role, so event outputs cannot move.
- **Manifest alone controls production.** The only runtime caller of `p4ActivityState` and `applyP4Balancing` is `getActivityRecommendations`, and it passes the manifest-derived lookup (`activityRecommendations.ts:122,152,267`). Checked with `graft callers`.

### Production-configuration equivalence (scratch probe, not committed)

The probe hashed the full `activityRecommendations` JSON for 1,098 dates in a throwaway worktree, using the real manifest each time.

| Tree | Lookup | sha256 |
|---|---|---|
| `1ed3828` (pre-migration production) | shipped `source-key-v1` | `b844ee12…` |
| HEAD | forced `source-key-v1` (rollback) | `b844ee12…` |
| `1ed3828` | forced `canonical-v1` | `b36226c5…` |
| HEAD | shipped `canonical-v1` | `b36226c5…` |

Two conclusions follow:
- Rollback is byte-equal to pre-migration production in the **full** production configuration, not only in the Golden configuration.
- Stage 2 changes nothing except which lookup value is selected.

### Build (spec §4 acceptance)

`vite build` was run on `1ed3828` and on HEAD.

| Chunk | `1ed3828` | HEAD |
|---|---|---|
| `index` | 1,277,974 B | 1,277,971 B (Δ −3 B) |
| `p4AlmanacHeadings` (P4 resolver) | 407,874 B | 407,874 B, still its own chunk |

The full `npm run build` in a fresh worktree stopped at `tsc -b` only because `functions/node_modules` was not installed there. In the main checkout, `npm run check` (lint plus `tsc -b`, including functions) passes.

## Pinned to `source-key-v1` (v2 = rollback evidence)

- `p4ScoreAdapter.test.ts`: the cases `run` and the layer B `p4ActivityState` call.
- `p4ScoreAdapterAlmanac.test.ts`: the manifest mock and the layer B call.
- `p4MigrationDiff.test.ts`: the manifest mock, both `p4ActivityState` calls, and `headingStates`. That last one now reads the policy key; it was the `:230` fix in spec §4.3.
- `p4ScoreHeadingLookup.test.ts`: the Stage 1 assertions now state that `canonical-v1` is shipped and the default.

## Limits

- **Golden configuration.** Like v2, Score Golden v3 runs the Golden configuration, with `tiangouYinNoYi` and `satChuNgocHapStars` off. The rollback proof uses the same configuration. The domain gate and migration diff v3 run the full production configuration, and they agree.
- **Single author.** Golden v3, the harness and the adapter come from one author. Independence rests on Golden v3's Python path, which never reads TS output.
- **Spec deviation.** Migration diff v3 uses its own class (`EXPECTED_G1B_MIGRATION_CHANGE` / `UNEXPECTED_REGRESSION`) instead of the v2 `MigrationClass`. The v2 classes describe baseline-flag-OFF → P4 changes. The G1-b comparison is `source-key-v1` → `canonical-v1`, so no v2 class fits.
