# Faithful 卷十 劫煞 — migration simulator (audit only)

2026-10-21, branch `claude/jiesha-faithful-vol10-sim`, parent `c340cb0`. No production code, JSON, flag, adapter revision or Golden change. Earlier audit commits are untouched. Inputs:

- [H1-B](p4-h1b-yuebiao-witness.md)
- [相抵 audit](p4-xiangdi-cancel-both-audit.md)
- [OVERLAP impact study](p4-jiesha-overlap-impact.md)

## Architecture gap

```text
source operands (Month Jian, pillar, gods, lunar day, phase, 土王 soil, 母倉 soil)
 → heading evidence: 宜 traces per heading (P4-C) | 忌 facts per god (subject / remaining / 百忌 / dated)
 → 相抵 (clause effect per subject scope, per heading)
 → 鋪註 (05 遇德猶忌, 06, 11, 16–24 pairs, 24 啟攢, 27/28)
 → heading annotation (only_ji / both_present / neither_recorded / not_recorded / only_yi / undetermined)
 → activity mapping (卷十一 activityEntries; strictest heading state)
 → score (P4 adapter / 卷十 chain verdict)
 → rating, events
```

**P4 layer** (`p4OwnerRules.resolveP4OwnerRulesDay`, 2025–2027 only, via `P4_DOMAIN`):

- 宜 per heading comes from the P4-C traces.
- 忌 facts are kept per source kind.
- 相抵 sets `neither_recorded` per subject heading.
- H1-B, puzhu:06 and the 鋪註 pairs act per heading (`art.propagation.lines`).
- `p4ActivityState` takes the strictest heading for each activity; `applyP4Balancing` scores it.
- Every step of the diagram is represented.

**卷十 scoring layer** (`xiejiVol10Resolution.resolveVol10`, every year):

- It sees only Month Jian, day pillar, officer and the present gods (`Vol10Day`).
- Per entry, it picks one clause effect and turns it into an `avoided` set for each **activity**.
- **It skips:**
  - 宜 per heading (the `cancel_both` branch never looks at 宜);
  - dated operands;
  - every 鋪註 relationship;
  - other gods' 忌 on the same heading.
- **It collapses** heading → activity before 相抵 is applied. The 鋪註 pairs act heading to heading, so they cannot be expressed afterwards.

## Faithful candidate

The scope is unchanged: Month Jian ∈ {辰, 戌, 丑, 未}, 劫煞 present, none of 天德/月德/天德合/月德合 present, the 劫煞 `cancel_both` branch only.

Within that scope, for each 劫煞 heading:

1. If the heading has 宜, the 劫煞 忌 is withheld; otherwise it is retained.
2. **鋪註 05** 「凡吉凶相抵不註宜亦不註忌者如遇徳猶忌之事則仍註忌」: 求醫療病 is in 劫煞's 止忌 list (still avoided with 德), so it keeps 忌.
3. Then the engine's own 鋪註 pairs, puzhu:06 and H1-B run.
4. 鳴吠對 enters only as 宜 for an internal 啟攢 heading, and puzhu:24 「有宜啟攢不註忌安葬」 then withholds 安葬. There is no "鳴吠對 → 宜安葬" shortcut.

鋪註 05 was added after the first full run. That run's calibration showed 19 求醫療病 rows printed on every page while the candidate left them blank.

**This is in-sample.** The text is direct, but the only witnesses are those 19 rows. `medical` is now the largest single activity (1,636 rows), and the +5…+30 score anomaly comes from this addition.

**Faithful 卷十 verdict** for an activity: `avoid` if 劫煞's 忌 survives on any of its headings in the P4 engine (state `only_ji` or `both_present` with 刼煞 in the trace); otherwise blank.

Unknown operands outside 2025–2027 are moon phase, soil and 母倉. Each is enumerated over its possible values (母倉 through valid 2025 stand-in inputs; the stand-ins are verified to flip 宜 on 辰-巳 days).

- **CONFIRMED:** the verdict is the same for every combination.
- **SOURCE_DEPENDENT:** the verdict is decided only by extending the owner soil convention past 2025–2027.
- **UNRESOLVED:** otherwise.

## Relevant 鋪註 rules

| Rule | Trigger heading | Effect heading | Direction | Source status | Runtime support |
|---|---|---|---|---|---|
| 05 遇徳猶忌 | 相抵 on a 止忌 heading | 求醫療病 (劫煞 止忌) keeps 忌 | same heading | direct text; printed on all locked pages | **missing** in production and P4; added in the simulator |
| 06 德合赦願… | trigger gods present | 開市, 立券交易, 納財, 開倉庫出貨財, 安牀, 進人口, … | lift 忌 | direct; owner Q1–Q4a (OWNER_ADOPTED) | P4 engine |
| 11 | 祈福 | 求嗣 | → | direct | P4 engine |
| 16 | 結婚姻 | 冠帶, 納采問名, 嫁娶, 進人口 | → | direct | P4 engine |
| 17 | 嫁娶 | 冠帶, 結婚姻, 納采問名, 進人口, 般移, 安牀 | → | direct; **exception 「遇不將而不註忌嫁娶者亦仍註忌」 reading open** | P4 engine (reads the exception as concerning 嫁娶 only) |
| 18 | 般移 ↔ 安牀 | | both | direct | P4 engine |
| 20 | 興造動土 + 豎柱上梁 | 修宮室, 修倉庫, 破屋壊垣, … | → | direct (修造動土 read as 興造動土) | P4 engine |
| 21 | 開市 ↔ 立券交易 ↔ 納財 | | both | direct | P4 engine |
| 22 | 開市 + 立券交易 | 開倉庫出貨財 | → (both required; 專忌 exception) | direct | P4 engine |
| 23 | 牧養 ↔ 納畜 | | both | direct | P4 engine |
| 24 | 啟攢 (宜 from 鳴吠對) | 安葬 | → | direct; 鳴吠對 presence 67/67 pages | **missing**; 啟攢 is not a heading. Simulator only |

None of these rules exist in the 卷十 scoring layer. Rules 19 (解除) and 27/28 do not touch any 劫煞 heading that is in scope.

## F1 — cross-god propagation: **SOURCE_DEPENDENT**

**Question:** when a 鋪註 pair fires, does it also remove another god's independent 忌 on the target heading?

The engine says yes: it lifts the whole row. The witness-window rows where this happens are mixed:

| Context | Target | Other 忌 | Page | Reading |
|---|---|---|---|---|
| 辰-己巳, 辰-乙巳, 辰-辛巳 (5 rows) | 開倉庫出貨財 ← 開市 + 立券交易 | 五虛 | absent | consistent with removal |
| 戌-乙亥, 戌-丁亥 (4 rows) | 開倉庫出貨財 ← 開市 + 立券交易 | 五虛 | printed | against removal |
| 未-戊申 (4 rows) | 結婚姻, 納采問名 ← 嫁娶 | 五離 | printed | against removal, or puzhu:17's 不將 exception (不將 is on the page) |
| 未-戊申 (2 rows) | 立券交易 ← 納財 | 五離 | printed | the page also prints 納財 itself, so this is a 宜-evidence mismatch on 納財 first |

No source sentence decides the question. These rows stay unresolved in the P4 layer.

**F1 does not reach the 卷十 劫煞 verdict. This was checked, not assumed** ([`sensitivity.json`](sources/p4-vol10/jiesha-faithful-vol10-v1/sensitivity.json): engine rows for all 16 contexts, one representative date each).

- All 31 propagations there are triggered by a 劫煞-listed heading that has 宜. That is 劫煞's own 相抵, so it is same-god.
- No 劫煞 verdict depends on a trigger unnoted by another god.

F1 stays open for the P4 heading rows only.

## The 2,085 "not supported" upper-bound rows

| Faithful result | Rows |
|---|---:|
| PUZHU_PAIR (a partner heading dropped, the 鋪註 pair carries it) | 1,687 |
| OTHER_YI_EVIDENCE + PUZHU_PAIR | 296 |
| FAITHFUL_AVOID (the context model was wrong; the upper bound was right) | 102 |
| Unexplained | 0 |

All 2,085 are explained.

## The 2,653 date-dependent rows

Decided date by date with real operands and enumeration of the unknown ones:

| Result | Rows |
|---|---:|
| FAITHFUL_AVOID (CONFIRMED) | 2,653 |
| SOURCE_DEPENDENT | 0 |
| UNRESOLVED | 0 |

## Full range 1900–2100

Production is the reference. Changes are against production; 24,471 days were scanned, of which 1,636 fall in scope.

| Metric | Production | Upper bound | Faithful |
|---|---:|---:|---:|
| Affected dates | — | 1,636 | 1,636 |
| Annotation changes (卷十 劫煞 verdict → avoid) | — | 15,208 | 17,949 |
| Raw score changes (activity rows) | — | 15,164 | 17,252 |
| Effective score changes | — | 15,158 | 17,242 |
| Rating changes | — | 15,158 | 17,239 |
| Visible activity changes | — | 15,158 | 17,239 |
| Event classification changes (caution→not_recommended) | — | 3,314 | 2,408 |

Faithful status split: CONFIRMED 17,949 avoid and 21,315 blank; SOURCE_DEPENDENT 0; UNRESOLVED 0.

"CONFIRMED" means: decided under the current OWNER_ADOPTED inputs (puzhu:06 Q1–Q4a, P5 rule D, 母倉, H1-B, soil convention) and invariant over every unknown date operand. It is not out-of-sample confirmation.

[`status.json`](sources/p4-vol10/jiesha-faithful-vol10-v1/status.json) re-tags all 384 cells:

- **Label dependence:** relabelling the restored 劫煞 scope as `as_usual` makes puzhu:06 throw a SPEC_GAP (grade action `both_present`), and `only_avoid` would trip its protected-source guard. The engine has no valid label, which is a design decision for any migration.
  - Under the current `cancel_both` label, puzhu:06 touches 12 rows in the 16 contexts. Propagation lifts all 12 afterwards, so no verdict depends on the label.
  - 0 LABEL_DEPENDENT cells.
- **F1 dependence:** 0 cells (see F1).
- **Re-split by cell status:** all 17,949 annotation rows, 17,242 score rows, 17,239 rating rows and 2,408 event changes are CONFIRMED.

**Why faithful exceeds the "upper bound":**

- The earlier variant asked for 宜 without operands, so it left 1,762 verdicts at production. Faithful decides them, adding 3,111 avoid rows: warehouse 1,536, plus contract, transaction, finance, planting and livestock 315 each.
- Faithful also adds 鋪註 05 (medical, 1,636 rows).
- It drops 2,006 rows through the pairs.

So "upper bound" was a misnomer for the earlier variant.

**Rating transitions (faithful):**

| Transition | Rows |
|---|---:|
| neutral→watch | 11,571 |
| watch→avoid | 3,223 |
| recommended→watch | 1,615 |
| consider→avoid | 818 |
| neutral→avoid | 12 |
| watch→watch (score only) | 3 |

**Score deltas:** −15 on 17,209 rows and −30 on 12. **+5 to +30 on 21 `medical` rows in 2025–2027:** the status tightens (neutral→watch) while the P4 adapter's `only_ji` path raises the score. That is a P4-adapter interaction to resolve before any P4 migration.

## Distribution

| Breakdown | Faithful effective score changes |
|---|---|
| Month branch | 辰 5,641 · 未 5,567 · 戌 4,665 · 丑 1,369 |
| Activity | medical 1,636 · construction 1,618 · warehouse 1,519 · bed_installation 1,137 · wedding 1,122 · beam_raising 1,034 · groundbreaking / renovation 1,024 · burial 1,010 · engagement / moving 930 · meeting 925 |

By decade the count stays between 733 and 916, except the 2020s (742) and 2100 (a partial decade).

**Discontinuity at 2025–2027:** about 6 changes per scope date there, against about 11 elsewhere. Inside `P4_DOMAIN`, P4 balancing replaces the 卷十 chains, so a 卷十 verdict change is partly absorbed. That is a software boundary that already exists in production, not a property of the rule. No year is flagged by the ±50% check.

## 2025–2027 witness calibration

Every comparable heading on the 16 locked 劫煞 pages, against the faithful P4 rows:

| Class | Rows |
|---|---:|
| exact | 441 |
| contradiction | 15 |
| non-comparable (date-specific 土王 operand on a generic 月表 page) | 48 |
| unmodelled (no 月表 term) | 105 |

- **The 15 contradictions:**
  - 10 are F1 propagation rows: 戌-乙亥 / 戌-丁亥 開倉庫出貨財, and 未-戊申 結婚姻, 納采問名 and 立券交易.
  - 2 are the 未-戊申 納財 宜 mismatch.
  - 3 are 戌-癸亥 開倉庫出貨財. The engine row reads `puzhu06: lift:QL`: owner decision Q4 lets puzhu:06 (trigger 四相) lift 五虛's 忌, yet the page prints 開倉庫. **That is a witness against an owner-adopted decision (puzhu:06 Q4), listed under owner items.**
  - None concerns whether 劫煞's own 忌 survives.
- **Distinguishing clusters:** 42/42 (from the 相抵 audit).
- **Status:** in-sample. All 16 contexts were read before the rule was formulated.

## Full-resolution verification

[`fullres-check.json`](sources/p4-vol10/jiesha-faithful-vol10-v1/fullres-check.json) covers 87 deciding cells on 14 pages:

- the 81 printed category-A headings;
- 安葬 and 鳴吠對 on 丑-甲寅, 丑-戊寅 and 丑-壬寅.

Each was re-read from crops of the original locked bytes at about 1.7× the earlier resolution. Result: 87/87 match, 0 uncertain. 丑-丙寅 stays excluded (月德 anomaly).

## Production architecture options (not implemented)

**The faithful 卷十 verdict is a pure function of (context, activity).** There are 384 cells (16 contexts × 24 activities; 174 avoid, 210 blank), and the verdict is constant across all 1,636 dates.

| Criterion | A — extend 卷十 scoring | B — P4 engine for every year | C — versioned faithful authority table |
|---|---|---|---|
| Source fidelity | needs a re-implementation of 宜 + pairs + 05 + 24 | highest (same engine) | same as B: generated by the engine |
| Duplicated logic | high (second composer) | none | none (the generator is the engine) |
| Testability | new composer to test | existing Golden v2 tests | 384-cell table, hashable, diffable |
| Migration risk | high | very high: brings all P4 balancing (all gods) to every year, far beyond 劫煞 | low: one entry, one branch |
| Runtime cost | low | high (lazy 400 kB resolver per day, all years) | negligible |
| Maintainability | two composers drift | P4 operand coverage is 2025–2027 only | regenerate when an input authority changes |

**Recommendation: C.** It adds a `jie_sha` override for the scoped `cancel_both` branch in `resolveVol10`, read from a versioned table that the P4 engine generates. The P4 layer (2025–2027) needs its own small change (scope state + 鋪註 05 + 啟攢 chain), gated on F1, the puzhu:17 exception and the medical adapter interaction.

## Readiness gates

| Gate | Status |
|---|---|
| F1 cross-god propagation | SOURCE_DEPENDENT for P4 heading rows; checked to reach 0 卷十 verdict cells |
| F2 relevant 鋪註 coverage | PARTIAL. Inventoried and simulated, but these are open: the puzhu:17 不將 exception, the puzhu:06 Q4 witness (戌-癸亥), the 未-戊申 納財 宜 mismatch, and the restored-scope label |
| F3 2,085 rows explained | YES, 100% |
| F4 2,653 rows resolved | YES, 2,653/2,653 CONFIRMED |
| F5 full-resolution witnesses | PASSED, 87/87 |
| F6 faithful all-years impact | MEASURED (17,242 effective score changes) |
| F7 production architecture | SELECTED: Option C (not built) |

**Migration readiness: MORE_EVIDENCE_REQUIRED.**

- For the **卷十 layer outside 2025–2027** on its own, the evidence and the measured impact are sufficient. What remains is architecture work (build Option C) and the standing caveats: in-sample witnesses only, and a single AI reviewer.
- The **P4 layer** stays blocked by F1, the puzhu:17 exception and the medical adapter interaction.

## Owner items

1. **F1 cross-god propagation (P4 layer):** the evidence is mixed.
2. **puzhu:17 不將 exception reading:** does it block propagation from 嫁娶?
3. **puzhu:06 Q4 vs 戌-癸亥 開倉庫:** a witness against the adopted decision.
4. **未-戊申 納財 宜 evidence:** the page prints 納財 忌.
5. **Restored-scope label:** the engine has no valid label (SPEC_GAP).
6. **P4 adapter medical interaction:** 21 rows where the score rises while the status tightens.
7. **Repository weight:** the audit branches commit about 29 MB of `raw.json` and about 20 MB of scans to a public repo. It could be reduced, e.g. by gzipping `raw.json` or keeping only the summaries plus hashes. Not changed.

## Successor artifacts if migration is approved (none created)

1. A faithful 劫煞 authority table (`*-jiesha-faithful-v1.json`) plus its generator lock.
2. A successor to `golden-xieji-vol10-scoring.json`, with the 卷十 scoring migration tests re-pinned.
3. Golden v3 for P4, if the P4 layer moves.
4. A narrow policy flag, shipped `true`, with historical tests pinned `false`.
5. A new revision in `p4-adapter-baseline-v1` `revisions[]` (P4 only).
6. A migration diff with 0 `UNEXPECTED_REGRESSION`, mutations, and `ci:p4` / `ci:full`.

## Safety and tests

`shared/lunar/p4JieshaFaithfulVol10.test.ts`:

- vi.mock wrappers, off by default;
- invariance: with no mode set, activities and the 11 events equal the unmocked graph on 5 dates, and the Golden v2 bytes are checked;
- samples: 2025-04-30 decided, including 鋪註 05; 2026-01-28 安葬 withheld through 啟攢;
- the gated full sweep (`JIESHA_FAITHFUL_FULL=1`, about 13 minutes).

`shared/lunar/p4JieshaFaithfulVol10Lock.test.ts` checks the hashes, the three-way counts, the explanations of the 2,085 and 2,653 rows, the invariance of the table, and the full-resolution summary.

Artifacts live under `sources/p4-vol10/jiesha-faithful-vol10-v1/`: `raw.json`, `faithful.json`, `build_faithful.py`, `fullres-check.json`, `lock.json`.

## Non-inferences

- In-sample witness fit is not out-of-sample confirmation.
- CONFIRMED means invariant to unknown operands under the modelled sources, not historically verified for each date.
- F1 must not be decided from engine behaviour; the evidence is mixed.
- The table being invariant over (context, activity) holds for this candidate and these sources. A change in any input authority (P4-C 宜, puzhu:06 owner decisions) needs the table regenerated.
