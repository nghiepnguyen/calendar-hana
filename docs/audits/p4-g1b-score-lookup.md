# G1-b: demolition P4 score-adapter lookup, frozen Stage 2 spec

2026-10-24. Branch `claude/g1b-spec-freeze` from `origin/main` `5f2397d`. **Spec only.** No production file, authority, Golden, manifest or test is changed. Stage 2 is **not** implemented.

Pinned metadata: [`sources/p4-vol10/g1b-spec-freeze-v1/lock.json`](sources/p4-vol10/g1b-spec-freeze-v1/lock.json).

## 0. Provenance of this spec

**Historical source.** The first G1-b audit and spec was written on branch `claude/p4-g1b-audit`, commit `9aa9cf7`, from `177f694`.
- The file had the same path as this one, `docs/audits/p4-g1b-score-lookup.md`, sha256 `8ac9392728de6f88d95bbbc0ee6289236a1c2c2d029a73e25feb42bdef021a9b`.
- It was **never on `main`**. Its probe artifacts (`sources/p4-vol10/g1b-score-lookup-v1/`) were never on `main` either.
- This file is a new materialization. It was not cherry-picked.
- The historical text is the input. Where it conflicts with this file, this file wins.

**Authority dependency.** G1-a was merged through PR #97, merge commit `5f2397dc3f75530259a11228452b7dc2dfd7ec0b`. Its report is [`p4-g1a-demolition-authority.md`](p4-g1a-demolition-authority.md) and its artifacts are in [`sources/p4-vol10/g1a-demolition-authority-v1/`](sources/p4-vol10/g1a-demolition-authority-v1/).

**Stage 1 is already on `main`.** It shipped as PR #90 (`45c9eea`) and is behaviour-neutral:
- `canonicalP4HeadingKey` (`xiejiVol10Resolution.ts:114`)
- the policy type and `headingView` (`p4ScoreAdapter.ts:12,84`)
- the `ActivityInput.p4ScoreHeadingLookup` plumbing (`activityRecommendations.ts:68,122`)
- `manifest.policies.p4ScoreHeadingLookup = "source-key-v1"` (`manifest.json:42`)
- `p4ScoreHeadingLookup.test.ts`

### What changed against the historical spec

| Historical statement (`9aa9cf7`) | Status now |
|---|---|
| "G1 ontology is closed: `SAME_ACTIVITY_ALIAS`" | Then a recommendation waiting for an owner ruling. **Now confirmed** by G1-a: `SAME_ACTIVITY_ALIAS_CONFIRMED`, owner-accepted 2026-10-24. |
| §8: "G1-a still owns the 劫煞 cells, 土王用事後 and the four witness conflicts" | 土王用事後 and the four conflicts are **resolved** by G1-a. The cells are now a non-blocking Option C v2 follow-up (§9). |
| §8: "On all 5, the avoid comes from 土王用事後, not from 劫煞" | **Inaccurate for the score.** It is corrected in §3. |
| §8 / §9: "Stage 2 is gated on the owner acknowledging the 5 days" | **Satisfied.** Owner acceptance is recorded in G1-a §11. |
| §9 Stage 1 acceptance criteria | **Done** in PR #90. |
| Line references such as `p4ScoreAdapter.ts:71,86,141` | Stale. They point at `177f694`. After Stage 1 the heading view is at `:84–89`, `prot` at `:169` and the lift rule at `:186–188`. |
| §4 impact (score 320, status 337, either 353, hard warning 0, other activities 0) | **Retained.** It was recomputed on `5f2397d` with identical results (§6). |
| §5 design, §6 tests, §7 migration-diff v3 schema | **Retained** as the Stage 2 design (§4, §5). Stage 1 parts are omitted. |

## 1. The bug, in one line

- `p4ScoreAdapter` reads the day's P4 headings by the raw activity key, 破屋壞垣.
- The P4 provider keys rows canonically as 破屋壊垣.
- So under `source-key-v1`, demolition is `baseline` on all 1,095 P4-domain days, and its P4 evidence is never applied. Historical §1–§3 has the trace.
- `canonical-v1` exists but is not active. It reads `canonicalP4HeadingKey(source)`.

## 2. G1-a decision, incorporated

| Item | Decision (G1-a) |
|---|---|
| G1 | `SAME_ACTIVITY_ALIAS_CONFIRMED` |
| Canonical candidate | 破屋壊垣 |
| Alias | 破屋壞垣 → 破屋壊垣 |
| `sourceRaw` | Stays the literal source transcription. Canonicalization never rewrites provenance text: activity map keys, `quote`, authority `text`, witness lines, or the deciding heading. |
| 土王用事後 | Resolved. It is a date-period avoidance on demolition (卷十一 `vol11:265`). It is not part of the activity identity and not an alias condition. |
| Four witness conflicts | Resolved as `DEPENDENCY_CONFLICT` (G1-a §6). |
| Harness defect | A missed match, not a premature merge (G1-a §3). |
| Evidence level | 卷十 / 卷十一 evidence is transcription-derived. The scans were not re-read. This does not block. |

The evidence is not repeated here. See G1-a §4–§8.

## 3. The five overlap dates, and the corrected score explanation

**Owner decision, final for Stage 2** (G1-a §11, 2026-10-24):

| Date | source-key-v1 | canonical-v1 | Decision |
|---|---|---|---|
| 2025-02-02 | baseline / 35 watch | only_ji / 20 avoid | ACCEPT |
| 2026-01-28 | baseline / 35 watch | only_ji / 20 avoid | ACCEPT |
| 2027-01-23 | baseline / 35 watch | only_ji / 20 avoid | ACCEPT |
| 2026-08-02 | baseline / 35 watch | only_ji / 20 avoid | ACCEPT |
| 2027-07-28 | baseline / 35 watch | only_ji / 20 avoid | ACCEPT |

**2025-02-02** uses the **current** soil-window convention (`p4-soil-owner-convention-v1`): the date is inside the 土王用事 window and the 立 day is excluded. This convention is not reopened in G1-b or Stage 2.

**Correction.** The historical §8 attributed the avoid to 土王用事後 "not 劫煞". That holds for the P4 row state, but not for the score.

Canonicalization does not change the score directly. The causal chain:

```
canonical heading match            canonicalP4HeadingKey(破屋壞垣) = 破屋壊垣 meets the provider row
    ↓
demolition P4 state resolves        p4ActivityState: baseline → only_ji (deciding heading stays 破屋壞垣)
    ↓
土王用事後 gives only_ji            protected soil-convention 忌 on 破屋壊垣 (prot 土王用事後)
    ↓
the activity leaves the vol10 path  the vol10 相抵 lift that kept Kiếp Sát informational no longer applies
    ↓
the existing adapter rule           applyP4Balancing lifts negatives only under only_yi / neither_recorded
                                    (p4ScoreAdapter.ts:186–188); under only_ji the applied Kiếp Sát row stays
    ↓
Kiếp Sát informational (0) → applied (−15); 土王用事 −15 unchanged      35 → 20, watch → avoid
```

**No scoring algorithm change is needed or allowed.**

On these days the result equals the five soil-convention siblings: groundbreaking, construction, renovation, warehouse and planting (G1-a `overlap.json`). That equality is consistency with the P4 convention, not new authority. The demolition-specific source basis is in G1-a §7.

## 4. Stage 2: frozen scope

Stage 2 is **only** the production activation of the `canonical-v1` lookup, which already exists.

**Stage 2 MAY:**

1. Flip `manifest.policies.p4ScoreHeadingLookup` **and** the code default (`p4ScoreAdapter.ts`, `activityRecommendations.ts`) from `source-key-v1` to `canonical-v1`.
2. Pin `"source-key-v1"` explicitly in the tests that lock historical output: the Score Golden v2 tests (`p4ScoreAdapter.test.ts`, `p4ScoreAdapterAlmanac.test.ts`), the migration-diff v2 harness (`p4MigrationDiff.test.ts`) and `p4JieshaOverlapImpact.test.ts`. That way no direct caller silently keeps the old lookup, and v2 stays frozen.
3. Freeze the successors that the historical design requires, leaving v2 untouched:
   - **Score Golden v3.** The generator is `golden.py` with only the lookup key folded. `deciding_heading` and `policy_rows` keep 破屋壞垣. It is hash-locked before the flip.
   - **Migration diff v3** (schema in §5).
   - Fix `p4MigrationDiff.test.ts:230` so `headingStates` uses the policy lookup.
4. Add the rollback check: `source-key-v1` must be byte-equal to Score Golden v2 `activity-scores.tsv` for 1,095 days × 32 activities.
5. Update tests, fixtures and expected outputs that change **only** because demolition now matches canonically.

**Stage 2 MUST NOT:**

- redesign `canonicalP4HeadingKey`, `NORM` or `splitHeadings`, or add glyph normalization rules;
- change 土王用事 timing or the soil convention;
- change scoring weights, the lift rules or `P4_DEFAULT_PENALTY`;
- change P4 composition rules or authorities, including 劫煞 authority v1 and `EXCLUDED_PENDING_GLYPH_AUDIT`;
- solve Option C v2, or mix in G2 (劵→券) work;
- rewrite `sourceRaw`, activity map keys or any provenance text;
- edit approved Goldens (Full v1/v2, Score v1/v2, `p4-migration-diff-v2`) or unrelated locks;
- change any activity other than demolition.

**Decisions Stage 2 must state in its PR** (from historical §5 and §6). These are not blockers:
- Cache: follow the PR #87 precedent with no `datasetVersion` bump, or bump it.
- Whether `P4_SCORE_ADAPTER_VERSION` stays `p4-score-adapter-v1`. The historical recommendation is to keep it.

**Stage 2 acceptance:**
- every check in §6 of the historical spec as retained here, which covers unit, drift, equivalence, rollback, v3 Golden, v3 diff, `ci:p4` and `ci:full`;
- `npm run build`, with the `index` delta ≤ 1 kB and the P4 resolver kept in its own chunk;
- owner sign-off on the frozen v3 diff, matching the envelope in §6.

## 5. Migration-diff v3 schema (retained from historical §7)

- Reuse the `p4MigrationDiff.test.ts` machinery: `classifyActivityRow` / `MigrationClass`, `capFirstDiff`, `source_ids` and the lock pattern.
- Write to `p4-migration-diff-v3/`, leaving v2 frozen.
- One row per (date, activity) where any field differs between `source-key-v1` and `canonical-v1`.
- The 3 outside dates are listed with zero change.

| Column | Content |
|---|---|
| `date`, `month_jian`, `pillar` | Day context |
| `activity` | Always `demolition`. Any other value fails the gate. |
| `source_heading` / `canonical_heading` | 破屋壞垣 / 破屋壊垣. The deciding heading and `policy_rows` use `source_heading`. |
| `p4_state_old` / `p4_state_new` | `baseline` → the P4 state |
| `heading_input` | The authority row behind the new state: `state`, `rule`, `prot`, and the Full Golden v2 `code` |
| `score_*`, `status_*`, `hard_warning_*` | Old and new output |
| `path_old` / `path_new` | `legacy` or `vol10` → `p4` |
| `rows_removed` / `rows_added` / `rows_lifted` | Evidence `source:ruleId` sets |
| `policy_rows` | Penalty and floor `sourceClauseId=delta` |
| `cap_first_diff` | As in v2 |
| `class` | A `MigrationClass` from the v2 rules, extended only if a row fits no class |
| `reason` | Derived from the columns, never free text: P4 state, then path switch, dormant gods, lift, penalty, cap |

The historical `impact-rows.tsv` (at `9aa9cf7`) is a prototype only. Its `reason` column under-attributes, so v3 replaces it.

## 6. Expected production delta (the envelope)

The delta was recomputed on `5f2397d` (2026-10-24) by a throwaway probe that was not committed:
- `getAlmanac` under both policies with a mocked manifest;
- all 2025-01-01 … 2027-12-31 days plus 2024-12-31, 2028-01-01 and 2035-06-15;
- full `activityRecommendations` JSON compared.

The result is identical to the historical §4.

| Metric | Expected |
|---|---|
| Canonicalization target | 破屋壞垣 → 破屋壊垣 only. Among `activityEntries`, `canonicalP4HeadingKey` changes no other heading (`p4ScoreHeadingLookup.test.ts`). |
| Activities changed | **demolition only.** Other activities changed: **0**. |
| Demolition days in the P4 domain | 1,095 |
| Score changed | **320** (223 lower, 97 higher) |
| Status changed | **337** |
| Score or status changed | **353** |
| Hard warning changed | **0** |
| Outside 2025–2027 | **0** changes. P4 is inactive there. |
| P4 state after the flip | `only_ji` 552, `baseline` (`not_recorded`) 451, `neither_recorded` 54, `only_yi` 28, `both_present` 10 (historical §4) |
| The five owner-approved days | each `baseline / 35 watch` → `only_ji / 20 avoid` |
| `sourceRaw` | unchanged. The deciding heading stays 破屋壞垣, so it remains traceable. |
| Scoring logic | unchanged |

**Scope of the owner acceptance.** The five days are the specific owner acceptance from G1-a. The other 348 changed demolition days are the ordinary effect of the fix. The owner reviews them through the frozen migration diff v3 at Stage 2 sign-off (§4).

**Any Stage 2 output outside this envelope must be investigated before it is accepted.** That means any other activity, any count mismatch, any hard-warning change or any outside-date change.

## 7. G2 exclusion

- **G2 (劵 → 券) is not part of Stage 2.**
- `canonicalP4HeadingKey` includes `canonP4Heading` (劵→券). It does nothing to activity keys today, because `activityEntries` already writes 立券交易, and contract and transaction are unchanged (historical §3).
- This freeze grants no G2 authority. No G2 conclusion may be inferred from G1.
- 劫煞 contract and transaction stay `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION` (authority v1).

## 8. Non-goals

The historical §10 list is retained, with the Stage 1 items removed:
- changing any approved authority or Golden;
- `xiejibianfangshu-yiji.json`;
- `NORM`;
- Option C v1 / `faithful-v1`;
- astronomy;
- de-duplicating the `norm` helpers;
- renaming provenance keys.

## 9. Non-blocking follow-up: Option C v2

- In five contexts (丑-甲寅, 丑-丙寅, 丑-壬寅, 丑-戊寅, 未-戊申) the 劫煞 demolition cell depends on the date through 土王用事 (G1-a §6). A future Option C v2 authority may need a dated representation.
- Classification: `NON_BLOCKING_FOLLOW_UP`.
- It does not block Stage 2. G1-b reads P4 rows, and in 2025–2027 P4 owns demolition scoring.
- It is not implemented here.

## 10. Stage 2 entry gate

- [x] G1-a authority audit complete (PR #97, `5f2397d`)
- [x] SAME_ACTIVITY_ALIAS_CONFIRMED
- [x] canonical candidate approved (破屋壊垣)
- [x] 土王用事後 dependency resolved
- [x] four witness conflicts resolved
- [x] five overlap dates owner-approved
- [x] current soil convention accepted
- [x] expected score delta understood (§3, §6; recomputed on `5f2397d`)
- [x] sourceRaw preservation required
- [x] G2 excluded
- [x] Option C v2 separated

**`STAGE_2_READY_FOR_IMPLEMENTATION`**

**`STAGE_2_NOT_IMPLEMENTED`.** Production remains on `source-key-v1`.
