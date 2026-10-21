# 劫煞 OVERLAP — impact study (audit only)

2026-10-21, branch `claude/jiesha-overlap-impact`, cut from `158263f` (相抵 audit). No production code, JSON, flag, adapter revision or Golden change. Earlier audit commits are untouched.

## J1 — 鳴吠對 (Gate A)

**Question:** is 鳴吠對 an auspicious operand for 安葬?

**Source text:**

- 卷十 (raw offset 7284): 「鳴吠 宜破土安葬」; 「鳴吠對 宜破土啟攢」.
- 卷十一: 安葬 宜 「天徳月徳天徳合月徳合天赦天願六合鳴吠」, with no 鳴吠對. 啓攢 宜 「鳴吠對」. 破土 宜 「鳴吠鳴吠對」.
- 卷五 立成 (P4-C scan-locked, `p4-yi-operands-v1.json`): the corrected set 「今圖依起例改正」 is 丙子 庚子 壬子 / 甲寅 丙寅 庚寅 壬寅 / 乙卯 丁卯 辛卯 癸卯, i.e. 11 days, all months. The older 通書 list has 10 days (it includes 甲午 and omits 庚寅 and 壬寅).
- 鋪註 (卷十 21980–22513): 「凡吉凶相抵有宜安葬不註忌啟攢有宜啟攢不註忌安葬」.

**月表 evidence:** across all 67 locked 月表 pages (H1-B 29, 相抵 audit 14, `yuebiao-witness-lock-v2` 24), the printed 鳴吠對 agrees with the corrected 11-day list on 67/67 pages. The older list agrees on 62/67.

**Answers:**

1. 鳴吠對 is **not** 宜 安葬; the source text says this directly. It is 宜 破土 and 啟攢.
2. The 安葬 effect is a source chain, not inference. On a 相抵 day, 鳴吠對 gives 宜 啟攢, and the 鋪註 rule then withholds 忌 from 安葬.
3. It applies on the 11 corrected day pillars, in every month.
4. It explains both usable 丑 misses (J2).
5. Production lacks the whole path:
   - P4-C models 鳴吠 but records 鳴吠對 as `RECORDED_NOT_ADOPTED`;
   - 啓攢 is outside the 29-heading catalog;
   - the 鋪註 pair is recorded in `p4-vol10-heading-annotation.json` but cannot fire.

**Status:**

- "鳴吠對 → 宜 安葬": not source-supported. The source says otherwise.
- "鳴吠對 → (宜 啟攢) → 相抵: 安葬 not noted": **SOURCE_WITNESSED**. Presence is confirmed on 67/67 pages; 宜 and the 鋪註 rule are direct text.

Both scenarios are kept in the impact study:

- **Scenario A:** without the 鳴吠對 path.
- **Scenario B:** with the source chain.

## J2 — 丑 controls

The usable 丑 pages are 丑-甲寅, 丑-戊寅 and 丑-壬寅. 丑-丙寅 stays excluded, because its printed 月德 is unresolved.

| Reading | Distinguishing clusters matched |
|---|---|
| Production CANCEL_BOTH | 2/3 |
| OVERLAP (Scenario A) | 1/3 |
| OVERLAP + 鳴吠對 chain (Scenario B) | **3/3** |

- 丑-甲寅 and 丑-壬寅 are 鳴吠對 days, so 安葬 is not noted, and the page agrees.
- 丑-戊寅 is excluded from 鳴吠對 by 「戊寅不用」, so 安葬 keeps 忌, and the page agrees.
- Remaining 丑 mismatches: none.

**Status: SOURCE_WITNESSED**, on 3 pages.

## J3 — witness fit on the locked 劫煞 set

These are distinguishing clusters (headings) on the 16 locked pages, using the frozen OVERLAP function from `5c35a9e` plus the Scenario B chain:

| Month | Production | OVERLAP + B |
|---|---|---|
| 辰 | 0/15 (0/35) | 15/15 (35/35) |
| 戌 | 0/12 (0/24) | 12/12 (24/24) |
| 未 | 0/12 (0/19) | 12/12 (19/19) |
| 丑, 3 usable pages | 2/3 | 3/3 |
| **Total** | **2/42** | **42/42** |

**Engine-variant check, 2025–2027.** This is the real P4 pipeline with propagation and puzhu:06. Of the 146 changed P4 heading rows:

- 132 are SUPPORTED_BY_WITNESS;
- 12 are CONSISTENT_WITH_CANDIDATE, because the heading has no 月表 term;
- 2 are AMBIGUOUS: 未-戊申 立券交易, on 2 dates.

On 未-戊申 the page prints 忌. The candidate restores 劫煞's 忌, and the engine's puzhu:06 (trigger 四相) then lifts it to `not_recorded`. Production leaves it unnoted as well, so neither reading matches. This is a puzhu:06 question, not a 劫煞 one.

**Contradictions in the target scope:** none against OVERLAP itself.

**Caveat:** this is in-sample. All 16 no-德 劫煞 contexts in 辰戌丑未 months were read before OVERLAP was written down, so no out-of-sample 劫煞 test exists.

## Exact candidate scope

Source: 卷十 刼煞 (offset 11115), 「辰戌丑未月值除日相日…不與德神併凡所忌者則不註宜所宜者亦不註忌」.

The predicate is: Month Jian ∈ {辰, 戌, 丑, 未}, AND 劫煞 is present, AND none of 天德/月德/天德合/月德合 is present. That is the clause's `cancel_both` (otherwise) branch.

- 劫煞 in those months always falls on 除日 (巳/亥/申/寅 days). Every one of the 16 locked pages prints 除日 and 相日.
- All 1,636 changed dates in 1900–2100 fall in exactly these 16 (month, pillar) contexts, and all 16 are witnessed. Extrapolation is over years, not over contexts.

In that scope, a 劫煞 heading behaves as follows:

- If its 宜 evidence is false, it keeps 忌.
- If its 宜 evidence is true, it stays unnoted.
- If its 宜 evidence is unknown, production behaviour is kept and the case is counted as unresolved.
- Scenario B: 安葬 also stays unnoted on 鳴吠對 days.

Out of scope: 災煞, 月煞, 月刑, 重日, 復日, any other `cancel_both` clause, 子午卯酉 劫煞, and any 德 rule.

Where it acts:

| Layer | Hook | Years | Propagation |
|---|---|---|---|
| P4 | `resolveP4Headings` as called by `resolveP4OwnerRulesDay` | 2025–2027 | the engine's own (鋪註 pairs, puzhu:06) |
| 卷十 6-chain scoring | `resolveVol10` (`jie_sha`, `cancel_both`, `no_annotation`) | every year | none: it decides per activity |

## Impact (Scenario B, the source-backed one; A in the artifact)

[`impact.json`](sources/p4-vol10/jiesha-overlap-impact-v1/impact.json) comes from the audit-only harness `shared/lunar/p4JieshaOverlapImpact.test.ts`. It uses `vi.mock` wrappers that are off by default, with no production change.

- Supported range: 1900-01-01 – 2100-12-31 (`MIN_YEAR`/`MAX_YEAR`).
- 24,471 days were scanned, i.e. those with day branch 寅/巳/申/亥.

| | Full range | 2025–2027 |
|---|---:|---:|
| Dates affected | 1,636 | 21 |
| Contexts affected | 16 | 10 |
| Annotation rows: P4 heading, `neither_recorded`→`only_ji` / →`not_recorded` | 120 / 26 | 120 / 26 |
| Annotation rows: 卷十 verdict `no_annotation`→`avoid` (activity rows) | 15,208 | 186 |
| Activity rows with a raw scoreDelta change | 15,164 | 142 |
| Activity rows with an effective score change | 15,158 (−15 ×15,146, −30 ×12) | 136 |
| Rating change: neutral→watch | 12,179 | 124 |
| Rating change: watch→avoid | 2,149 | 0 |
| Rating change: consider→avoid | 818 | 0 |
| Rating change: neutral→avoid | 12 | 12 |
| Visible activity status changes | 15,158 | 136 |
| Event classification changes: caution→not_recommended (11 events, no hour) | 3,314 | 50 |
| Event score changes | 5,352 | 68 |

- **Top affected activities (full range):** bed_installation 1,631, construction 1,618, wedding 1,422, engagement / moving / beam_raising 1,034, groundbreaking / renovation 1,024, burial 1,010, meeting 925.
- **Annotation changes with no score change: 74**, all in 2025–2027, classified from engine output:
  - 64: the activity's P4 state is unchanged, because another heading already decides it;
  - 6: score unchanged after cap or aggregation;
  - 4: no applied row to restore.
- **Outside 2025–2027 every 卷十 `avoid` changed the score.** The restored row is Kiếp Sát −15.
- **Unresolved:** 1,762 卷十 activity verdicts (18 in 2025–2027) kept production because 宜 is unknown. There are 0 unknown-宜 P4 headings.

**Upper bound outside 2025–2027.** The 卷十 layer cannot apply the 鋪註 pairs or the H1-B interplay. Cross-checking its 15,022 `avoid` rows against the context-level OVERLAP + pairs model:

- 10,284 are supported;
- 2,653 are unknown to the model (context-undetermined soil headings);
- 2,085 are not supported.

So the outside-window count overstates what the faithful rule would change, and a faithful 卷十 implementation would need its own design and its own measurement.

Witness window, Scenario B, for the P4 heading rows: 132 SUPPORTED_BY_WITNESS, 12 CONSISTENT_WITH_CANDIDATE, 2 AMBIGUOUS, 0 NO_DIRECT_WITNESS.

## J4 — materiality

- **2025–2027 (P4):** small. 136 activity rows and 50 event classifications move on 21 dates.
- **All years (卷十 scoring):** large. Up to 15,158 activity rows are restored by −15, and 3,314 event classifications move from caution to not_recommended on 1,636 dates.

The 卷十-layer figure is an upper bound (see above).

## J5 — migration readiness: **MORE_EVIDENCE_REQUIRED**

The seven criteria:

| # | Criterion | Met? |
|---|---|---|
| 1 | Production `cancel_both` contradicted | yes |
| 2 | OVERLAP explains materially better | yes (42/42 vs 2/42) |
| 3 | 丑 explained | yes (Scenario B, 3/3) |
| 4 | No known witness contradicts the candidate in scope | yes; 未-戊申 立券交易 is a puzhu:06 interaction that production also misses |
| 5 | Exact runtime predicate source-backed | **P4 layer only.** The 卷十 layer as measured is OVERLAP without pairs, not the source rule |
| 6 | Impact measured | yes for P4; only an upper bound for the 卷十 layer |
| 7 | Uncertainty documented | yes; no out-of-sample 劫煞 witness is possible |

- Taken alone, the P4 (2025–2027) scope would be READY_FOR_OWNER_MIGRATION_DECISION.
- Overall readiness is held back by the 卷十 all-years layer. It is where most of the impact sits, and the measured variant there is not the faithful rule.

## If migrated later (not done)

1. Keep Golden v2 and freeze Golden v3.
2. Add a 劫煞-only policy flag, shipped `true`, with historical tests pinned `false`.
3. Append a revision to the adapter baseline.
4. Produce a migration diff with 0 `UNEXPECTED_REGRESSION`.
5. Add mutations.
6. Run `ci:p4`.
7. Model the 鳴吠對 → 啟攢 → 安葬 chain explicitly.
8. Either design 鋪註-pair handling for 卷十 scoring or limit the migration to P4.

## Safety

- The harness wraps `p4YiDayComposition`, `p4Warehouse`, `p4HeadingAnnotation` and `xiejiVol10Resolution` only inside the test file.
- With the candidate off, output equals the unmocked production graph on the sampled dates (invariance test).
- The Golden v2 bytes are checked against their lock.
- No production file, JSON, flag or adapter revision changed.

## Artifacts and tests

Under `sources/p4-vol10/jiesha-overlap-impact-v1/`:

| File | Contents |
|---|---|
| `raw.json` | the sweep output |
| `impact.json` | the decision artifact |
| `build_impact.py` | the summariser |
| `lock.json` | SHA-256 of the above plus the harness |

Tests:

- `shared/lunar/p4JieshaOverlapImpact.test.ts`: invariance, the 2025-04-30 sample, and the gated full sweep (`JIESHA_IMPACT_FULL=1`, about 8 minutes).
- `shared/lunar/p4JieshaOverlapImpactLock.test.ts`: artifact hashes and decision counts.
