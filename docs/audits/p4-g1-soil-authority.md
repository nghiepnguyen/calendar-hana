# G1-SOIL Stage 1: 土王用事 × demolition × 劫煞 authority (audit and spec freeze)

2026-10-25. Branch `claude/g1-soil-stage1-audit` from `origin/main` `d5c005f` (PR #103, merged and deployed). **Audit only.** No production file, authority, Golden or manifest is changed. No authority v4 is created, and 土王用事 is not added to runtime.

Artifacts are in [`sources/p4-vol10/g1-soil-stage1/`](sources/p4-vol10/g1-soil-stage1/), hash-locked in `lock.json`. The test is `shared/lunar/p4G1SoilStage1Audit.test.ts`.

## 28. Final decision (summary first)

**`DATE_DEPENDENT_AUTHORITY_PARTIAL`**

**Established:**
- The date dependency of the 5 cells. Each one is blank outside 土王用事 and avoid inside, by the same puzhu:20 mechanism.
- The 土王用事 rule, now derived from 協紀 itself: [立−18, 立−1], with the 立 day excluded.
- Two independent calendars that agree on every day from 1900 to 2100.
- The full R2 envelope, measured three ways, all in agreement.

**Open (owner decisions, §25):**
- **Adopting the calendar outside 2025–2027.** Every R2 change lies outside the domain. The P4 soil authority covers only 2025–2027.
- The architecture and the rule-version identity.

Verdict: `G1_SOIL_STAGE_1_READY_FOR_REVIEW`. This does not authorize authority v4 or activation.

## 1. Scope

The audit covers only the 5 contexts excluded in authority v3: 丑甲寅, 丑丙寅, 丑壬寅, 丑戊寅 and 未戊申.

Not reopened:
- the 11 APPLIED contexts;
- G2's `未-戊申 × contract/transaction = BLANK / I1`, a different cell.

## 2. Production baseline (verified)

| Item | Value |
|---|---|
| `origin/main` | `d5c005f` (PR #103 merged 2026-10-25T10:04Z) |
| Deploy | run SUCCESS; `/version.json` build `d5c005f` |
| Working tree | clean except `.claude/`; stash untouched |
| `datasetVersion` | 1.2.1 |
| Adapter | `p4-score-adapter-v1` |
| Lookup | `canonical-v1` |
| Authority | `xieji-vol10-jiesha-faithful-v3`, sha `4b6d2c7c…`: demolition 11 APPLIED + 5 `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` |

**Reproduced:**
- G1-b history under v2: 353 / 320 / 337 / 0 (`P4_MIGRATION_V3_FULL=1`).
- The v3 counterfactual: 342 / 309 / 326 / 0, with the 15 rows frozen (`G1GS2_G1B=1`).
- The G1 glyph Stage 2 evidence and lock (27 entries).
- **A byte-exact dump** of current main with the Stage 2 harness, which equals the frozen `stage2Forward` sha (§19).
- G2 Stage 1 and Stage 2 suites.
- 卷十 Scoring Golden v4 and P4 Score Golden v4 builders.

## 3. The existing 5-context debt

The source is G1-a `engine.json` (owner-accepted), carried forward by the Stage 1 and Stage 2 specs and the [G1-SOIL item](p4-g1-demolition-soil-authority-item.md):
- **Out of window:** 興造動土 and 豎柱上梁 are both unnoted (each has a 宜), so the puzhu:20 相抵 lift leaves demolition unnoted. The cell is **blank**.
- **In window:** 興造動土 carries 土王用事後, so the lift is blocked and 劫煞's 忌 is kept. The cell is **avoid**.

## 4. Source provenance (`source-evidence.json`)

| Class | Witness | Text (as in source) | Role |
|---|---|---|---|
| primary transcription | 卷一 本原 五行用事 (quoted in [tu-vuong-dung-su.md](tu-vuong-dung-su.md)) | 「…乃於四立之前各旺一十八日」 | the rule |
| primary transcription | 卷六 :658 (玉門經, 曹震圭) | 「四絶者四立前一辰也」…「故先一日為絶也」 | **「前一辰」 = the civil day before 四立** |
| primary transcription | 卷六 :657 | 「…故先一日為四離辰也」 | same gloss for 四離 |
| primary transcription and scan (n215–n216) | 卷十 :448–450 | 「土王用事 忌…破屋壊垣栽種破土」「義同土府」 | 忌 list |
| primary transcription | 卷十一 :253, :263–265 | 「…土王用事後止忌補垣」; 破屋壊垣 heading 忌 list ends 「土王用事後」 | period 忌 operand |
| secondary (Joseon 1861, 時憲 practice) | 推步捷例 :925 | 「自四立節前一辰，逆數至十八日，爲土王用事」「寄旺四時共日七十二日」 | counting rule |
| secondary (other systems) | 明史 大統 (恆氣), 宋史, 古今律厯考 | 中氣 − 3.04 d; 季月節 + 12.17 d; 18.26 d | not the Qing 定氣 basis; not adopted |
| repository-derived | `p4-soil-owner-convention-v1`, `golden-tu-vuong-dung-su.json` (HKO 四立) | – | conventions and boundary inputs |

- No secondary or modern table becomes authority.
- 月表 pages are undated and cannot witness 土王用事 (G1-a §6).
- The 時憲書 witness stays OPEN: the Tohoku images can't be transcribed for these entries.

## 5. Definition of 土王用事 (`soil-rule.json`, `tho-vuong-dung-su-rule-v1`)

**For each 四立 L (立春, 立夏, 立秋, 立冬): the 18 civil days [date(L) − 18, date(L) − 1].**

Derivation:
- 卷一 gives 18 days before 四立.
- 推步 counts back 18 days from 「四立節前一辰」.
- 卷六 glosses 「四立前一辰」 as 「先一日」, the civil day before 四立 (the day god 四絶, 卷十 :442).
- 推步 「寄旺四時共日七十二日」 and 卷一 「合之亦為七十二日」 require 4 × 18 = 72 days. That rules out reading 「逆數至十八日」 as excluding its starting day, which would give [立−19, 立−1], 19 days. The entry day counts.
- So day 1 = date(L) − 1 and day 18 = date(L) − 18. The 立 day starts the next element (卷一 「各旺七十二日」).

**Grade B.** This is a rule derivation inside 協紀, corroborated by 推步. It is not A, because no dated 時憲書 witness exists.

The rule is identical to the production calendar `thoVuongDungSu.ts` (owner 2026-10-10) and to `p4-soil-owner-convention-v1` (owner 2026-10-13). The earlier "inference" about the 「後」 boundary is now supported by the source.

## 6. Boundary semantics (`soil-boundaries.tsv`)

| Boundary | Rule |
|---|---|
| Entry | date(L) − 18, inclusive |
| Exit | date(L) − 1, inclusive |
| 立 day | excluded |
| Unit | whole civil days |
| Windows | 4 per year, 18 days each, all inside the civil year |

For the years 1900, 2024, 2025, 2026, 2027, 2028 and 2100, all 4 windows were tested on six days each: the day before entry, entry, the second day, the penultimate day, the final day, and the day after exit (the 立 day). The expected in/out flags are asserted by the builder: 168 cases, 0 ambiguous.

## 7. Astronomy dependency

- **Inputs:** the 立春 / 立夏 / 立秋 / 立冬 instants (term index 21 / 3 / 9 / 15) on true terms (定氣).
- **Source:** the frozen project astronomy authority `solar-terms-jpl-de440s-clock-v1` (JPL DE440s, clock-v1, 1900–2100), the same authority behind Month Jian. No second engine.
- **Civil date:** the instant + 7 h (`TIME_ZONE_OFFSET`, a project-wide convention).

Sensitivity (`soil-sensitivity.json`):
- UTC+8 for the 立 date shifts 66 window days in 201 years, but flips **0** of the 502 occurrences of the 5 contexts.
- The rejected 2-hour reading of 「前一辰」 flips 2 (1939-01-17 and 2042-01-16, both 丑-甲寅).
- 恆氣 (Ming) and the modern solar-longitude rule are not adopted.
- Only the soil calendar was varied. Month Jian and the day pillar rest on the same project-wide UTC+7 convention, which is outside G1-SOIL and not reopened.

## 8. Independent calendar generation

| Derivation | Method |
|---|---|
| 1 | production `thoVuongDungSu` (TS, engine `solarTermsForYear`) |
| 2 | `build_soil_calendar.py`, reading the JPL rows directly (no engine import) |

- Result: 14,472 days (201 × 72), 72 per year, sha `c2af8374…`.
- The parity test asserts every window [li, onset, eve] for all 201 years, plus the date-list sha.
- In the dumps, the TS soil flag equals derivation 2 on every one of the 73,414 days.
- Every soil day falls in a 季月 Month Jian (辰, 未, 戌, 丑).

## 9. Five-context reconstruction (`authority-candidate.json`)

| Context | Outside: cell / grade | Inside: cell / grade | Occurrences in / out (1900–2100) |
|---|---|---|---|
| 丑甲寅 | blank / A (n123 discriminates) | avoid / B | 60 / 39 |
| 丑丙寅 | blank / B (n75 月德 printing error) | avoid / B | 61 / 38 |
| 丑壬寅 | blank / A (n111) | avoid / B | 61 / 40 |
| 丑戊寅 | blank / A (n87) | avoid / B | 59 / 36 |
| 未戊申 | blank / B (n117 owner-ruled inconsistent) | avoid / B | 62 / 46 |

- **Inside grade.** B for the rule. The calendar is B in 2025–2027 (P4 authority adopted). Outside 2025–2027 it is B only after owner adoption (§25), and C until then.
- **Behaviour.** Inside and outside genuinely differ in all 5 contexts: the engine states only_ji with 刼煞 + 土王用事後 inside, and not_recorded via puzhu:20 outside.
- **Separate cells.** The demolition 未戊申 cell is independent of the G2 contract/transaction cell.

## 10. The 298-day stake, recomputed from scratch

| Item | Days |
|---|---|
| Occurrences of the 5 contexts (scope dates 1900–2100) | 502 |
| Outside 土王用事 | 199 |
| Inside 土王用事 | 303 |
| Inside, in 2025–2027 | 5 (the G1-b overlap days) |
| Static blank wrong | 303 |
| Static blank wrong **and observable** | **298** |
| Static avoid wrong | 199 |
| Currently excluded by v3 | 502 |

**Explanation.** Static blank is wrong on every inside date. On the 5 inside dates in 2025–2027 the P4 adapter decides (`only_ji`, 土王用事後 protected), so the output can't change there. 303 − 5 = **298**.

Static blank (R1) itself changes 0 rows against v3, because blank and the legacy exclusion give the same output. The 298 figure is reproduced, not targeted.

## 11. R2 candidate (`r2-impact.json`, `r2-impact.tsv`)

The 5 contexts take avoid inside 土王用事 and blank outside. Measured per day: avoid5 inside, v3 outside.

| | 2025–2027 | Outside |
|---|---|---|
| demolition changed days | **0** | **298** |
| score changes | 0 | 298, all −15 (lower 298, higher 0) |
| status changes | 0 | 298, all watch→avoid |
| hard warning / P4 state / evidence-only | 0 | 0 |
| other activities, including contract/transaction | 0 | 0 |
| conclusion | – | `kiep_sat:informational:no_annotation → applied:avoid` |

- Per context: 丑丙寅 61, 丑壬寅 58, 丑戊寅 59, 丑甲寅 60, 未戊申 60.
- All 298 changes are inside the window. Outside the window: 0.
- This is a delta against shipped v3. It is not the Stage 1 "faithful" candidate, which was measured against v2.

## 12. R1 and static counterfactuals (`counterfactuals.json`)

| Model | vs v3 |
|---|---|
| **R1 static blank** | 0 changes |
| **Static avoid** | 496 days outside the domain (298 inside: watch→avoid; 198 outside: neutral→watch); domain 0 |
| **R3 (current)** | baseline |

Static avoid is wrong on the 199 out-of-window dates, of which 198 are observable.

## 13. Production Access Matrix (`production-access-matrix.json`, candidate only)

- The proposed state is **`APPLIED_DATE_DEPENDENT`**, with a declared selector `tho-vuong-dung-su` (rule version `tho-vuong-dung-su-rule-v1`).
- Cells: inside → avoid, outside → blank.
- A date-dependent context has **no static cell**.
- The authority file holds the selector id and its two cells, never dates.
- Unchanged: the 11 static APPLIED contexts, and every other activity at 16/16.

## 14. Architecture recommendation

**Recommended: C, a separate calendar-rule service consumed by the authority layer.**

```
calendar fact:   soilState(date) → inside | outside        (rule tho-vuong-dung-su-rule-v1, astronomy authority)
authority rule:  demolition cell = selector(state)          (authority v4: APPLIED_DATE_DEPENDENT + selector id)
resolver:        passes the civil date it already has → getVol10JieshaRuntime(month, pillar, activity, date)
scoring:         unchanged
```

| Option | Assessment |
|---|---|
| A (logic in the authority JSON) | rejected: it turns the JSON into executable pseudo-code |
| B (resolver decides) | rejected: it hides an authority rule in the resolver |
| C | the calendar function already exists (`thoVuongDungSu`) and is reused by the product 土王用事 god. Promote it to a versioned rule service, or wrap it, with its own id; the authority references that id |

Schema validation:
- the selector id must be known;
- the cells must be exactly {inside, outside};
- no static cell is allowed on a date-dependent context.

## 15. Activity envelope

See §11. Two exhaustive dumps were compared: forward (v3) and avoid5, plus blank5 for R1. 73,414 days, no sampling.

## 15a. Independent verification

All three mechanisms agree **on dates**:

| # | Mechanism | Result |
|---|---|---|
| 1 | production resolver with the audit avoid5 authority, composed per day by the production calendar | 298 changed dates |
| 2 | prediction from the v3 forward dump plus the **independent** JPL-row calendar plus the 5 contexts (vol10 `no_annotation`, P4 baseline, inside) | the same 298 dates |
| 3 | G1-a-tied scope dates of the 5 contexts (`scope-dates.json`, matched to the G1-a engine in Stage 1) ∩ the independent calendar's inside days, minus 2025–2027. Reads no dump. | the same 298 dates; per-context in/out counts also equal G1-a `full.json` (303 / 199) |

The two calendar derivations agree on all 73,414 days.

## 16. Event envelope (`event-impact.json`)

| | semantic | score | classification | evidence | stamp-only (audit candidate id) |
|---|---|---|---|---|---|
| 2025–2027 | **0** | 0 | 0 | 0 | 352 |
| outside | **0** | 0 | 0 | 0 | 20,966 |

- The composed R2 stamps only its in-window days, so these counts come from the composition.
- A real v4 would restamp every 劫煞 scope date. Expected: the same 35,992 as G1 glyph Stage 2 (1,636 × 22). Stage 2 must measure this with the G2 / G1 glyph full-JSON method.
- No mapped event profile includes demolition.

## 17. P4 interaction

- **In 2025–2027, R2 is fully masked:** 0 changes.
- The 5 inside dates (2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02, 2027-07-28) are P4 `only_ji`, and the adapter decides them.
- Under the G1-b rollback lookup (`source-key-v1`), R2 changes exactly those 5 days (`g1b-counterfactual-3.json`).

## 18. G1-b protection

| Comparison | Days | Score | Status | Hard warning | Status |
|---|---|---|---|---|---|
| Historical (v2) | 353 | 320 | 337 | 0 | reproduced, untouched |
| v3 counterfactual | 342 | 309 | 326 | 0 | reproduced, untouched |
| **Counterfactual #3 (R2), new** | **337** | **304** | **321** | **0** | recorded |

Counterfactual #3 is recorded as a third comparison and does not redefine history. R2 vs v3: `canonical-v1` changes 0 days; `source-key-v1` changes exactly the 5 overlap days.

## 19. G1 glyph v3 protection

- The Stage 2 frozen evidence verifies (lock, Goldens, access matrix).
- A fresh dump of current main with the Stage 2 harness equals the frozen `stage2Forward` sha (`985090eb…`) byte for byte. That reproduces the 1,119 / −15 / 464 / 655 envelope without regenerating it.
- G1-SOIL would be a new migration, `faithful-v3 → faithful-v4`.

## 20. G2 protection

R2 changes 0 contract/transaction records on every day, with 0 event semantic changes. The alias, the cells and 未-戊申 × contract/transaction BLANK / I1 are untouched.

## 21. Golden strategy

**P4 Score Golden v4:** unchanged, since the domain delta is 0. Verified.

**卷十 Scoring Golden:** a successor (v5) is needed.
- The current case format (month, pillar, officer, gods, activity) has no date, so it can't express a date-dependent cell.
- Proposed format: add an explicit `soilState: "inside" | "outside"` input. Do not use a civil date, so cases stay timeless.
- Proposed cases:
  - each of the 5 contexts × {inside avoid, outside blank};
  - a case asserting that a missing `soilState` throws on a date-dependent context.
- `jie-chou-renyin-demolition-excluded` is replaced, never edited in place. v4 stays frozen.
- No Golden is created in Stage 1.

## 22. Witnesses (`witnesses.json`)

**Same context, two dates (date, not identity, changes the cell):** 丑-壬寅
- 2028-01-18 is inside: cell avoid, 35 watch → **20 avoid**.
- 2029-01-12 is outside: cell blank, output unchanged.

| Witness | Date | Context | Change |
|---|---|---|---|
| Entry boundary (occurrence on the onset day) | 1914-07-21 | 未-戊申 | 35 watch → 20 avoid |
| Exit boundary (occurrence on 立 − 1) | 1915-02-04 | 丑-丙寅 | 35 watch → 20 avoid |
| First after domain | 2028-01-18 | 丑-壬寅 | – |
| Last before domain | 2023-01-20 | 丑-戊寅 | – |
| P4-masked | the 5 overlap days | – | unchanged |

Evidence-only rows: none in the envelope.

Controls, unchanged on every activity:

| Date | Context | Why |
|---|---|---|
| 2025-04-06 | 辰-乙巳 | static APPLIED, outside |
| 2025-04-30 | 辰-己巳 | static, inside |
| 2028-04-14 | 辰-己巳 | static APPLIED, outside |
| 2028-01-01 | 子-乙酉 | no 劫煞 |
| 2028-01-06 | 丑-庚寅 | 劫煞 with 德 |
| 2025-02-02 | 丑-壬寅 | inside, P4-masked |

## 23. Rollback concept

- Rollback = authority v3 in place of v4, giving byte-identical v3 output.
- The calendar-rule service is additive. The product 土王用事 god already uses the same function, so rollback leaves it in place.
- Rollback order with G1-b: v4 → v3 → v2 → G1-b, as frozen in the G1 glyph ruling.

## 24. Versioning (recommended, not implemented)

| Item | Recommendation |
|---|---|
| 劫煞 authority | `xieji-vol10-jiesha-faithful-v4` |
| Calendar rule | its own identity `tho-vuong-dung-su-rule-v1`, referenced by v4, not hidden inside it |
| `datasetVersion` | 1.2.1, unless a persistent cache is found (none today) |
| Adapter / `canonical-v1` | unchanged (domain 0) |
| Goldens | 卷十 Scoring Golden v5 (new `soilState` format); P4 Score Golden unchanged |

## 25. Owner decisions

1. **Adopt `tho-vuong-dung-su-rule-v1` as authority for 1900–2100.**
   - Today it is product policy for all years, and P4-adopted only for 2025–2027 (`getP4SoilPresence` returns `unknown` outside).
   - All 298 R2 changes lie outside 2025–2027.
   - If the owner does not adopt it, R2 does nothing in production, and fail-loud on `unknown` would throw on every changed day.
2. **Architecture C** (§14) and the date-aware runtime signature.
3. **Accept the R2 envelope**: 298 days, all −15 watch→avoid; domain 0.
4. **Accept the inside-cell grade**: B, contingent on decision 1.
5. **Accept counterfactual #3** as recorded: 337 / 304 / 321 / 0.

## 26. Stage 2 allowed changes (given rulings 1–5)

**Authority and runtime**
- Add `xieji-vol10-jiesha-faithful-v4` from v3: the 5 contexts become `APPLIED_DATE_DEPENDENT` with selector `tho-vuong-dung-su`; no static cells; all three approvals true.
- Add a versioned calendar-rule entry point (wrapping `thoVuongDungSu`, with rule id) that returns inside/outside for 1900–2100 and throws outside the supported range.
- Make `getVol10JieshaRuntime` and `resolveVol10` take the civil date for date-dependent contexts; extend `validate()` and `vol10JieshaCell`.

**Fail-loud cases (§14 of the brief).** Each of these throws:
- a date-dependent context without a date;
- an unknown selector;
- an unsupported date or unavailable astronomy data;
- a static cell on a date-dependent context;
- a date-dependent context read as ordinary APPLIED.

There are no silent defaults and no R3 fallback once R2 is active.

**Gates**
- **Frozen envelope:** domain 0; outside 298, −15, watch→avoid; 0 other; event semantic 0; stamp-only measured.
- **Golden:** 卷十 Scoring Golden v5.
- **Retargeting:** retarget mocks to the new import path, keep the historical pins with their id assertions, keep the wrong-path guard.

## 27. Stage 2 forbidden changes

Stage 2 must not:
- modify the 11 static demolition contexts, the G2 cells or the alias;
- rewrite raw source;
- change `NORM 壞→壊`, `canonical-v1` or the P4 scoring algorithm;
- rewrite G1-b history (353 / 320 / 337 / 0), the v3 counterfactual (342 / 309 / 326 / 0) or the G1 glyph v3 artifacts;
- hardcode the 298 dates or any civil-date exception list;
- approximate solar terms or add a second engine;
- silently default an unknown 土王用事 state;
- encode dates in the authority file.

## 28. Final decision

**`DATE_DEPENDENT_AUTHORITY_PARTIAL`**: dependency, rule, boundaries and impact are established; calendar adoption beyond 2025–2027 and the architecture are owner decisions.

**`G1_SOIL_STAGE_1_READY_FOR_REVIEW`**. Remote: pushed NO, PR NO, merged NO, deployed NO.
