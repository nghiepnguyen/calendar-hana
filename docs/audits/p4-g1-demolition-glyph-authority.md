# G1 glyph debt, Stage 1: demolition 劫煞 authority audit and spec freeze

2026-10-25. Branch `claude/g1-glyph-stage1-audit` from `origin/main` `f3c68c6` (PR #102 merged). **Audit only.** No production file, authority, Golden, manifest policy or locked artifact is changed.

Artifacts are in [`sources/p4-vol10/g1-glyph-stage1/`](sources/p4-vol10/g1-glyph-stage1/), all hash-locked in `lock.json` (21 artifacts, 13 pinned inputs). The test is `shared/lunar/p4G1GlyphStage1Audit.test.ts` and runs in `npm test`. Full-range dumps run behind `G1GS1_DUMP` (see `lock.json` `reproduce`).

## Final Stage 1 decision

**`SAME_HEADING_AUTHORITY_PARTIAL`**

| # | Question | Answer |
|---|---|---|
| 1 | Is the heading identical? | **Yes.** `SAME_ACTIVITY_ALIAS_CONFIRMED`: G1-a, owner 2026-10-24, re-verified here and not re-decided. |
| 2 | Are the authority cells known? | **11 of 16 yes, all avoid.** The other 5 (丑-甲寅, 丑-丙寅, 丑-壬寅, 丑-戊寅, 未-戊申) are known but **depend on the date**: blank outside 土王用事, avoid inside. The v2 schema cannot represent that. 0 cells are UNKNOWN. |
| 3 | Is production currently authorized to use them? | **No.** Demolition is `EXCLUDED_PENDING_GLYPH_AUDIT` in authority v2. `authorityApproved = productionApproved = false`. |
| 4 | Should Stage 2 change production access? | **Only after an owner ruling on the representation of the 5 date-dependent cells (§23).** The recommended option is R3; R1 is the no-runtime-change alternative. |

## 1. Scope

The audit separates four questions:

- **Q1, character:** 壞 ↔ 壊.
- **Q2, heading:** 破屋壞垣 ↔ 破屋壊垣.
- **Q3, activity:** the relationship to `demolition`.
- **Q4, authority:** the 劫煞 cells for demolition.

Production access (§10A) is a fifth, separate decision. Resolver reachable ≠ authority established ≠ production authorized.

## 2. Current production state (verified, not assumed)

| Item | Value |
|---|---|
| `origin/main` | `f3c68c611f21da4ea9493720c6434b45fa601644` (merge of PR #102). Branch HEAD before this audit: `8528e20` on `claude/g2-stage2`, the G2 tip, which is an ancestor of main. |
| Working tree | clean except `.claude/`. The stash (`stash@{0}` ci-phase1) was untouched. |
| `datasetVersion` | `1.2.1` |
| P4 adapter | `p4-score-adapter-v1` |
| P4 heading lookup | `canonical-v1` (G1-b Stage 2) |
| 劫煞 policy string | `faithful-v1` (`manifest.policies.xiejiVol10JieshaPolicy`) |
| 劫煞 authority loaded | `xieji-vol10-jiesha-faithful-v2`. This is a static import in `xiejiVol10JieshaAuthority.ts:1`. The policy name and the authority id are two different things. |

**G1-b baseline**

- `P4_MIGRATION_V3_FULL=1 vitest run p4MigrationDiffV3.test.ts` passes: 11/11 tests.
- 353 changed demolition days, 320 score changes, 337 status changes, 0 hard-warning changes.
- All 5 witnesses (2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02, 2027-07-28) pass.

**G2 baseline**

- `p4G2Stage2Migration` and `p4G2Stage1Audit` pass.
- Alias `立劵交易 → ["立券交易"]` is active.
- contract and transaction are `APPLIED`.
- `未-戊申` × contract/transaction = `blank` (I1). This is re-asserted in the audit test.

**Demolition today, observed**

- The resolver reaches it: `NORM` 壞→壊 puts 破屋壊垣 in 劫煞's `listed` set.
- `getVol10JieshaRuntime` returns `EXCLUDED_PENDING_GLYPH_AUDIT`.
- `resolveVol10` keeps the legacy `no_annotation` and stamps `authorityExclusion`. Kiếp Sát stays `informational`.

## 3. Source inventory

`inventory.json` hashes 28 prior artifacts with their role and authority level:

- G1, G1-a, G1-b and G2 reports and locks;
- Migration Diff v3;
- Score Golden v3/v4;
- authority v1/v2;
- the approved candidate `b24f6f68…`;
- the raw sources;
- the h1b lock;
- `scope-dates.json`.

`source-evidence.json` lists all 27 compound occurrences, with the source spelling preserved:

| Source | Class | 壞 | 壊 | 壞/壊 outside 破屋?垣 |
|---|---|---|---|---|
| 卷十 `vol10.raw.txt` | transcription of primary (Wikisource 四庫) | 15 | 3 | 0 |
| 卷十一 `vol11.raw.txt` | transcription of primary | 0 | 3 | 0 |
| 卷六 `vol06.raw.txt` | transcription of primary | 1 | 0 | 0 |
| 推步捷例 | secondary reference | 5 | 0 | 0 |

**The 劫煞 witness**

- `vol10.raw.txt:299`: 忌 list, an unseparated compound heading 破屋**壞**垣.
- 按語 `:301`: 「…忌解除求醫療病破屋壞垣…」.

The 卷十一 heading is `vol11.raw.txt:263` 破屋**壊**垣.

## 4. Glyph analysis (`glyph-analysis.json`)

**General relationship.**
- 壞 U+58DE is the traditional form. 壊 U+58CA is the Japanese shinjitai form.
- NFKC does not unify them.
- Classification: `CHARACTER_VARIANT_CONFIRMED`. This is used as context only, not as authority.

**Inside this source pipeline.**
- 卷十 prints the same lists in both glyphs: 土府 `:271` and 土符 `:392` use 壞; 土王用事 `:449` uses 壊, glossed 義同土府.
- 卷十一 uses only 壊. 推步, 卷六 and the 月表 use only 壞.
- No other word in any source contains either glyph.
- Classification: `SOURCE_ORTHOGRAPHY_VARIANT_CONFIRMED`.

**Repository.** The repo folds in two opposite directions:
- the activity-map data, per its own note, folds 壊→壞;
- runtime `NORM` (`xiejiVol10Resolution.ts:68`) folds 壞→壊 at match/key time.

This is about naming only. It is consistent with the source finding but is not its basis.

**Scan verification (§5).**
- **月表:** 11 of 16 context pages print the heading (h1b, scan-locked). A visual crop of `06067694-n81.jpg` (未-壬申 除日, last 忌 column 「垣牆破屋壞垣栽種…」) reads **壞** (罒 over 衣), with high confidence. Crop: `crop-06067694-n81-pwuhuaiyuan.jpg`.
- **卷十 / 卷十一:** there is no scan of a 破屋 line in the repo. `vol10-n228/n229` are 鋪註 pages with no compound. Those glyphs rest on the transcription alone. This is the same limit as G1-a §4. It is not blocking, because both glyphs alternate inside one compound in the same transcription.

## 5. Heading identity (`heading-provenance.json`)

```
卷十 :299 破屋壞垣 (劫煞 忌)        卷十一 :263 破屋壊垣 (heading)
 → vol10 JSON entries[jie_sha].avoid 破屋壞垣     activityEntries.demolition = [破屋壞垣]
 → NORM 壞→壊 (Resolution.ts:68) → splitHeadings (:98) → listed ∋ 破屋壊垣
 → ACTIVITY_HEADINGS.map(normalize) 破屋壊垣 → match ✔ → cancel_both → no_annotation
 → authority guard (Resolution.ts:291 → Authority.ts:71) → EXCLUDED_PENDING_GLYPH_AUDIT
 → legacy verdict + authorityExclusion → Kiếp Sát informational
P4: canonicalP4HeadingKey (:114) 破屋壊垣, canonical-v1 (G1-b, shipped)
```

**Answers.**
- Matching succeeds today. It stops at the authority guard.
- Demolition is excluded because the approved simulator harnesses keyed the activity side without `splitHeadings`, so the approved matrix never contained demolition cells (G1 root cause, G1-a §3).
- Heading identity is `SAME_HEADING`.

**G1 vs G2**

| Layer | G1 (破屋壞垣) | G2 (立劵交易) |
|---|---|---|
| Source glyph | both glyphs in source | 卷十 劵, 卷十一 券 |
| Runtime glyph | 破屋壞垣 in data | 立劵交易 in data |
| Activity heading | 破屋壞垣 | 立券交易 |
| Normalization | `NORM` 壞→壊, a character fold that predates G1 | `headingAliases` whole-heading alias (G2 Stage 2) |
| Resolver reachability | reachable before and now | unreachable before G2, reachable after |
| Authority coverage | `EXCLUDED_PENDING_GLYPH_AUDIT`, 0 cells | approved cells existed and were made `APPLIED` in v2 |
| Production effect | none (legacy verdict kept) | G2 envelope (shipped) |
| Remaining problem | the cells, one of which cannot be represented | none (未-戊申 audit separate) |

G1 does not need an alias. Its open problem is the authority cells, not matching.

## 6. Activity identity

- `activityEntries.demolition = ['破屋壞垣']`: exactly one heading.
- No other activity uses 壞 or 壊.
- `demolition == 破屋壞垣` is an **exact** one-to-one mapping. This is asserted in the test.
- 土王用事後 is a date-period 忌 on the heading (G1-a §5), not part of the activity identity.

## 7. Resolver provenance

See §5. The P4 adapter reads `canonicalP4HeadingKey`. On P4-domain days whose state is not baseline, it decides demolition through `applyP4Balancing`, not through the 卷十 劫煞 branch. This is why the domain envelope is empty (§12).

## 8. Why demolition is currently excluded

- `authority v2 runtimeCoverage.demolition.reason`: 「resolver lists it (NORM 壞→壊) but the approved simulator never matched 破屋壞垣…」. This is confirmed against G1 §Root cause and G1-a §3.
- **Cause: a simulator/harness keying defect, which hid a real match.** It was not a source ambiguity, an activity mismatch or a deliberate exclusion of scope.
- The missing cells therefore prove nothing either way. The cells are re-derived in §9 from the G1-a corrected engine (owner-accepted).
- The runtime status name predates the identity ruling. The semantic state today is `EXCLUDED_PENDING_AUTHORITY`.

## 9. Authority-cell evidence and candidate matrix (`authority-candidate.json`)

**Source.** G1-a `engine.json`, the corrected faithful engine: 16 contexts, each with 土王用事後 absent and present. Each soil-absent cell agrees with its 月表 page (16/16).

**Grades.**
- **A:** discriminating 月表 page.
- **B:** approved-rule derivation. The page is consistent but not discriminating, or no page is possible.
- **C:** depends on the owner soil convention being extended past its adopted 2025–2027 coverage. Outside 2025–2027, production `getP4SoilPresence` returns `unknown`. The product 土王用事 bad god uses the same period rule for all years, but it is product policy, not the P4 convention.
- **D:** none.

| Context | Out of 土王用事 | In 土王用事 | Mechanism | Grade (out / in) |
|---|---|---|---|---|
| 辰-乙巳, 辰-己巳, 辰-癸巳, 辰-辛巳 | avoid | avoid | 興造動土 has no 宜 and keeps 刼煞, so puzhu:20 never lifts | A / A |
| 未-丙申, 未-壬申, 未-庚申 | avoid | avoid | same | A / A |
| 戌-丁亥, 戌-乙亥, 戌-己亥 | avoid | avoid | same; the page is not discriminating (土符 lists the heading) | B / B |
| 戌-癸亥 | avoid | avoid | 興造動土 is noted by 土符 (undated), so the lift is blocked | B / B |
| 丑-甲寅, 丑-壬寅, 丑-戊寅 | **blank** | **avoid** | puzhu:20 lift; inside the window 興造動土 carries 土王用事後, so the lift is blocked | A / B (2025–27), **C** (outside) |
| 丑-丙寅 | **blank** | **avoid** | same; n75 月德 is a printing error | B / B, **C** (outside) |
| 未-戊申 | **blank** | **avoid** | same; n117 was owner-ruled inconsistent | B / B, **C** (outside) |

**Totals.**
- 0 cells are UNKNOWN.
- The 5 date-dependent contexts cannot be keyed by Month Jian + pillar alone, because `getVol10JieshaRuntime(month, pillar, activity)` takes no date and `Vol10Day` has no soil field.
- No approved activity among the 24 is date-dependent. The faithful report's status split is CONFIRMED 17,949 avoid and 21,315 blank, with SOURCE_DEPENDENT 0 and UNRESOLVED 0 (`p4-jiesha-faithful-vol10.md:123,140`). Demolition would be the first, so its representation is an owner decision.

## 10A. Production Access Matrix (`production-access-matrix.json`, `.tsv`)

**States**

| State | Definition |
|---|---|
| `APPLIED` | Reachable, and an approved cell is applied at runtime. Holds ⇔ identityApproved ∧ authorityApproved ∧ productionApproved. |
| `UNREACHABLE_HEADING` | Cells may exist, but heading resolution cannot reach them. Runtime name: `UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION`. Reaching one throws. |
| `EXCLUDED_PENDING_GLYPH_AUDIT` | Reachable. The legacy verdict is kept on purpose, per activity. This is a runtime status. |
| `EXCLUDED_PENDING_AUTHORITY` | Identity is settled, but the cells are incomplete or cannot be represented. This is an audit state; the runtime has no enum for it. |
| `NO_AUTHORITY_CELL` | No approved cell. An `APPLIED` activity without a cell throws, on import or on reach. |
| `NOT_APPLICABLE` | The heading is not in 劫煞's 忌 list. |

The runtime enum has 3 values and works per activity. The audit states map onto it; no runtime state was invented.

**Matrix A: current production (authority v2)**

| Activity | Source heading | Runtime heading | Reachable | Cells | identity | authority | production | Access |
|---|---|---|---|---|---|---|---|---|
| contract | 立劵交易 | 立券交易 | yes | 16/16 | ✔ | ✔ | ✔ | APPLIED |
| transaction | 立劵交易 | 立券交易 | yes | 16/16 | ✔ | ✔ | ✔ | APPLIED |
| demolition | 破屋壞垣 | 破屋壊垣 | **yes** | **0/16** | ✔ | ✘ | ✘ | **EXCLUDED_PENDING_GLYPH_AUDIT** |
| groundbreaking (control) | 興造動土 | 興造動土 | yes | 16/16 | ✔ | ✔ | ✔ | APPLIED |
| wedding (control) | 嫁娶 | 嫁娶 | yes | 16/16 | ✔ | ✔ | ✔ | APPLIED |
| medical (control) | 求醫療病 | 求醫療病 | yes | 16/16 | ✔ | ✔ | ✔ | APPLIED |

Authority v1 (rollback) is the same, except that contract and transaction are `UNREACHABLE_HEADING`.

**Matrix B: audit candidate.** This is audit evaluation only and does not authorize production. The full per-context table is in the TSV.

- **11 date-invariant contexts:** reachable; cell avoid, grade A or B; identity ✔, authority ✘, production ✘. Current: `EXCLUDED_PENDING_GLYPH_AUDIT`. Candidate: `APPLIED (audit model only)`.
- **5 date-dependent contexts:** reachable; cell blank out of window, avoid in window, grades A or B and C. Current: `EXCLUDED_PENDING_GLYPH_AUDIT`. Candidate: `EXCLUDED_PENDING_AUTHORITY` (`UNRESOLVED_REPRESENTATION`).

**Matrix C: proposed Stage 2.**
- Default: demolition stays excluded. Nothing is `APPLIED` while 5 contexts are unresolved.
- Options for the owner:

| Option | Representation | Access after Stage 2 | Runtime change |
|---|---|---|---|
| R1 | v3 with all 16 cells: 11 avoid, 5 soil-absent blank | APPLIED 16/16 | none |
| R2 | v3 plus a date-aware cell (土王用事 flag) | APPLIED 16/16, with in-window avoid on the 5 | API change; grade C outside 2025–2027 |
| **R3** (recommended) | per-context coverage: 11 APPLIED, 5 `EXCLUDED_PENDING_AUTHORITY` | partial | coverage becomes per-context |
| R4 | keep excluded | unchanged | none |

**R1 and R3: same scores, different authority semantics.**
- A blank cell gives `no_annotation`, which is exactly the legacy verdict. So both change only the 11 avoid contexts, and their activity and event envelopes are identical: the fit envelope equals the prediction made from avoid contexts alone (§16).
- They differ in what is asserted:
  - R1 records an unconditional, authority-stamped `blank` on the 5 contexts.
  - On the 298 in-window days outside the domain, the G1-a engine says `avoid`, so R1 asserts a value the source contradicts there. Today those days carry an honest `authorityExclusion`; R1 drops it.
  - R3 keeps that exclusion.
- R1 is acceptable only with an explicit provenance note on the 5 cells: "soil-absent cell; in-window value avoid not represented".

**Transitions.**
- Semantic now: `EXCLUDED_PENDING_GLYPH_AUDIT` → `EXCLUDED_PENDING_AUTHORITY`. Identity is settled; no runtime change.
- R1 or R2: `EXCLUDED_PENDING_GLYPH_AUDIT` → `APPLIED` (faithful-v3).
- R3: → `APPLIED` (11 contexts) plus `EXCLUDED_PENDING_AUTHORITY` (5).
- R4: unchanged.

**Authority versions.**

| Version | Role | Demolition |
|---|---|---|
| `faithful-v1` | rollback, pre-G2 | excluded |
| `faithful-v2` | production: contract/transaction APPLIED | excluded |
| `faithful-v3` | hypothetical, exists only after an owner ruling | per the chosen option (R1, R2 or R3) |

v2 is never mutated.

**Runtime enforcement and fail-loud (observed, `mutation-results.json`).**

| Situation | Runtime behaviour |
|---|---|
| UNREACHABLE becomes reachable | throws `… is UNREACHABLE… but was reached` (G2 test `alias-v1`) |
| EXCLUDED becomes reachable | **does not throw.** The legacy verdict is kept and `authorityExclusion` is stamped. This is deliberate and observable; demolition is already reachable today. |
| `APPLIED` without cells (`m-applied-no-cells`) | `validate()` throws on import |
| cells while still EXCLUDED (`m-cells-while-excluded`) | `validate()` throws on import |
| coverage missing (`m-no-coverage`) | `getVol10JieshaRuntime` throws on reach: `no coverage for demolition` |
| unknown status (e.g. a new enum value) | `validate()` throws |

`validate()` rejects a candidate cell leaking into v2. The G2 alias and `NORM` cannot bypass coverage; both are asserted in the test.

**Recommended Stage 2 guard.** EXCLUDED is the only silent path. Pin the exact set of excluded reaches (contexts × activity) in a test, so that any `NORM` or alias change that widens it fails CI.

## 11. Collision analysis (`collision-analysis.json`)

- The 卷十一 vocabulary has 29 headings. 1 contains 壞 and 0 contain 壊.
- Folding 壞→壊 produces **0 normalized collisions**.
- 5 卷十 avoid lists contain 壞, all inside 破屋壞垣.
- Semantic collisions: 0. Unrelated activities affected: 0.
- Current `NORM` stays valid unchanged.

## 12. Full-range impact (`range-impact.json`, `candidate-impact.tsv`)

All 73,414 days from 1900-01-01 to 2100-12-31, no sampling, compared with shipped production:

| | fit (R1) | faithful (R2) | faithful − fit |
|---|---|---|---|
| **P4 domain 2025–2027**, 1,095 days: every field | **0** | **0** | 0 |
| **Outside the domain**, 72,319 days: demolition changed days | 1,119 | 1,417 | 298 |
| Conclusion (Kiếp Sát `informational:no_annotation` → `applied:avoid`) | 1,119 | 1,417 | 298 |
| Score changes, all −15 (lower / higher) | 1,119 / 0 | 1,417 / 0 | 298 / 0 |
| Status changes | 1,119: neutral→watch 464, watch→avoid 655 | 1,417: neutral→watch 464, watch→avoid 953 | 298 watch→avoid |
| Hard warning / evidence-only / P4 state | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| Other activities (whole-record sha), incl. contract/transaction | 0 | 0 | 0 |

**Why the domain is empty.**
- 18 domain scope dates are P4 `only_ji` in window. There the adapter row decides and there is no vol10 劫煞 row.
- The remaining domain scope dates have a non-baseline P4 state. Under that state `applyP4Balancing` overrides the vol10 verdict, e.g. 2025-04-06, which is `neither_recorded`.

## 13. Event impact (`range-impact-events.json`)

- Every event × {no hour, hour 9} on every day: 1,615,108 evaluations.
- **Semantic changes: 0** for both candidates: score 0, classification 0, evidence-only 0.
- **Authority stamp-only: 462 in the domain and 35,530 outside.** That is 1,636 scope dates × 22 evaluations, from the candidate authority id. It is counted separately and normalized away in `nsha`.
- No mapped event depends on demolition, so 劫煞 demolition cells never reach event semantics.

## 14. G1-b relationship

- The historical 353 / 320 / 337 / 0 envelope (Migration Diff v3, `source-key-v1` → `canonical-v1`) is reproduced, and stays **frozen as history and rollback evidence**.
- The candidate's domain delta is 0. A demolition authority activation therefore **does not touch a single G1-b day**. It is a separate migration layered on top, entirely outside 2025–2027.
- Migration Diff v3 and Score Golden v3/v4 must not be regenerated.

## 15. G2 regression protection

- Contract/transaction whole-record sha: 0 changes in every model.
- Event semantics: 0 changes.
- 未-戊申 × contract/transaction stays `blank` (I1) in v2 and in both candidates; the build asserts that only demolition differs.
- The separate 未-戊申 × 立券交易 audit stays open.
- The demolition 未-戊申 cell comes from the puzhu:20 engine and does not depend on the n117 ruling.

## 16. Independent verification (`independent-verification.json`)

**Method 1: production `resolveVol10` with the candidate authority (`vi.doMock`).**
- Measured changed days: 1,119 (fit) and 1,417 (faithful).
- Composite candidate: inwindow inside 土王用事, fit outside.

**Method 2: prediction from the forward dump plus the frozen cells only.**
- Rule: changed ⇔ a vol10 劫煞 `no_annotation`, with P4 state baseline, and the cell avoid (or in window, for faithful).
- The prediction equals the measured set **exactly**, for both candidates.

**Method 3: the G1-a corrected faithful engine, a separate code path.**
- Per-context in/out-window counts equal the production scope for all 16 contexts, total 1,636.
- The production scope equals `scope-dates.json`. The 18 P4-handled dates, all in-domain `only_ji`, are listed by name.
- Caveat: the scope check uses `scope-dates.json` to admit P4-handled days. The non-circular part is that 0 `no_annotation` 辰戌丑未 days fall outside scope.

**First-run disagreement, investigated and not averaged.**
- The first run of Methods 1 and 2 differed by 18 scope dates and by 2 days.
- Cause: P4-domain days decided by the adapter.
- Fix: add the P4-state condition to the prediction. With that condition, all three methods agree.

## 17. Witnesses and controls (`witnesses.json`)

Chosen after the full envelope: for each category, the first date ≥ 2028-01-01 and the last date ≤ 2024-12-31. The domain has no witnesses, because its envelope is empty.

| Category | Date | Context | Soil | Before → after |
|---|---|---|---|---|
| fit neutral→watch | 2024-07-07 | 未-壬申 | – | 50 neutral → 35 watch |
| fit neutral→watch | 2028-04-14 | 辰-己巳 | – | 50 neutral → 35 watch |
| fit watch→avoid | 2024-10-26 | 戌-癸亥 | soil | 35 watch → 20 avoid |
| fit watch→avoid | 2028-04-26 | 辰-辛巳 | soil | 35 watch → 20 avoid |
| faithful only (in window, date-dependent) | 2023-01-20 | 丑-戊寅 | soil | 35 watch → 20 avoid (fit: unchanged) |
| faithful only | 2028-01-18 | 丑-壬寅 | soil | 35 watch → 20 avoid (fit: unchanged) |

Every change sets Kiep Sat from `informational:no_annotation` to `applied:avoid`.

**Categories with no instances.**
- `avoid→blank` is impossible: production is at legacy `no_annotation`.
- score-higher, score-only and evidence-only changes do not occur.

**Controls.** All five are unchanged in every model.

| Date | Context | Why it is a control |
|---|---|---|
| 2028-01-01 | 子-乙酉 | no 劫煞 on demolition |
| 2028-01-06 | 丑-庚寅 | 劫煞 `not_avoided`, outside the no-德 branch |
| 2029-01-12 | 丑-壬寅 | out of window, date-dependent context, blank in both candidates |
| 2025-04-06 | 辰-乙巳 | domain, avoid cell, P4 `neither_recorded` |
| 2025-04-30 | 辰-己巳 | domain in window, P4 `only_ji` |

## 18. Open authority questions

1. **The representation of the 5 date-dependent contexts:** R1, R2, R3 or R4.
2. **R2 only:** does the 土王用事 window outside 2025–2027 count as authority? Today it is grade C: the P4 soil convention is adopted for 2025–2027 only, and outside it `getP4SoilPresence` returns `unknown`.
3. **Evidence that is consistent but not discriminating:** the B grades on 戌×4, 丑-丙寅 (n75 月德) and 未-戊申 (n117).

## 19. Stage 2 allowed changes (spec, given an owner ruling for R3; R1 differences noted)

**Identity and heading.**
- Identity: `SAME_ACTIVITY_ALIAS_CONFIRMED`.
- Canonical heading 破屋壊垣. `sourceRaw` 破屋壞垣 is kept everywhere.
- `NORM 壞→壊` stays unchanged. **No alias** is needed.

**New authority successor: `shared/almanac-data/xieji-vol10-jiesha-authority-v3.json`, `xieji-vol10-jiesha-faithful-v3`.**
- Built by a generator from v2 plus `authority-candidate.json` `cellSoilAbsent`.
- Cells:
  - avoid: 辰乙巳, 辰己巳, 辰癸巳, 辰辛巳, 未丙申, 未壬申, 未庚申, 戌丁亥, 戌乙亥, 戌己亥, 戌癸亥;
  - blank: 丑甲寅, 丑丙寅, 丑壬寅, 丑戊寅, 未戊申.
- Counts: 25 activities, 400 cells, 188 avoid, 212 blank.
- **R3:**
  - Demolition coverage becomes `APPLIED` with a per-context exclusion `EXCLUDED_PENDING_AUTHORITY` on 丑甲寅, 丑丙寅, 丑壬寅, 丑戊寅 and 未戊申.
  - Those 5 cells stay in the table only as provenance, or are omitted.
  - `validate()` and `getVol10JieshaRuntime` gain per-context coverage, and an excluded context keeps the legacy verdict plus `authorityExclusion`, exactly as today.
- **R1:** coverage is `APPLIED` for all 16 contexts, and each of the 5 blank cells carries the note "soil-absent cell; in-window value avoid not represented".
- In both cases the provenance names the ruling and this audit.

**Runtime and tests.**
- `xiejiVol10JieshaAuthority.ts` imports v3, and the `validate()` invariants are kept.
- Production-access guard test: the exact set of excluded reaches.
- Rollback helper analogous to `g2Rollback.ts`: authority v2 in place of v3.

**Frozen envelopes.**
- Activity envelope = fit. Domain: 0 on every field. Outside: 1,119 days, all −15; neutral→watch 464, watch→avoid 655; 0 hard warning; 0 other activity.
- Event envelope: 0 semantic. Stamp-only 462 (domain) and 35,530 (outside), on the v2 → v3 id.
- Witnesses and controls: as in §17, excluding the faithful-only rows. Under R1 those rows are expected unchanged, and are asserted unchanged.

**Golden and versions.**
- Golden successor: Scoring Golden v3 → v4.
  - The one expected flip is found by **grep, not computed**. `jie-chen-demolition-excluded` (辰-乙巳) is the only demolition × 劫煞 case in the authority branch, and it is expected to become verdict `avoid`, Kiep Sat `applied` −15.
  - `jie-yin-demolition` (寅 month) is outside the branch and is expected unchanged.
  - Stage 2 must compute the successor with the builder (`build_scoring_golden_v3.py` pattern), not hand-edit it.
- **Every file that names `EXCLUDED_PENDING_GLYPH_AUDIT`** must be revisited in Stage 2:
  - `xiejiVol10JieshaAuthority.ts` and its test;
  - `xiejiVol10Resolution.ts` (the `authorityExclusion` branch stays for R3);
  - `xiejiVol10ScoringV2.test.ts` and `xiejiVol10ScoringV3.test.ts`;
  - `golden-xieji-vol10-scoring-v2.json` and `-v3.json`, which stay frozen; a v4 is added;
  - `jiesha-option-c-migration-v1/build_authority.py` and `g2-stage2/build_authority_v2.py`, frozen generators that must keep verifying v1/v2.
- P4 Score Golden v4 is unchanged (domain 0).

**Stop conditions.** Stage 2 stops if any of these holds:
- any domain change;
- any change to another activity or to contract/transaction;
- any event semantic change;
- an envelope ≠ 1,119 or a transition count that differs;
- the soil-absent cells ≠ this candidate;
- a G1-b or G2 gate fails;
- rollback ≠ shipped v2, byte for byte.

## 20. Stage 2 forbidden changes

Stage 2 must not:

- rewrite raw source text;
- globally modernize Chinese glyphs;
- alter the G2 alias;
- alter the contract/transaction cells;
- alter the 未-戊申 G2 ruling;
- rewrite G1-b historical artifacts (Migration Diff v3, Score Golden v3/v4);
- change the P4 scoring algorithm or `p4-score-adapter-v1`;
- change `canonical-v1`;
- change unrelated activities or their cells;
- resolve the separate 未-戊申 × 立券交易 audit;
- hardcode civil dates;
- invent demolition cells or promote a C/D cell without an owner ruling;
- mutate authority v2;
- extend the P4 soil convention beyond 2025–2027 (R2 only, and only with an explicit ruling).

## 21. Rollback design

- Rollback = authority v2 statically imported in place of v3. No other file differs.
- Expected rollback output = shipped `f3c68c6` production, byte for byte, over the full-range dump. This follows the G2 `rollback.json` pattern.
- R3 also reverts the per-context coverage code. That revert must leave the shipped `validate()` and `getVol10JieshaRuntime` behaviour unchanged for v2.
- Re-enable = forward.

## 22. Versioning implications

| Item | Under R1 / R2 |
|---|---|
| 劫煞 authority | `faithful-v3` required |
| `datasetVersion` | **owner decision.** G2 Stage 2 changed user-visible scores and kept 1.2.1 (precedent). A bump to 1.2.2 is optional, not the default. |
| P4 adapter | unchanged (domain delta 0) |
| `canonical-v1` | unchanged |
| Scoring Golden (`golden-xieji-vol10-scoring`) | successor v4 required |
| P4 Score Golden v4, Migration Diff v3 | frozen |
| Event baseline | no semantic successor; stamp-only accounting as in G2 |
| Policy string `faithful-v1` | unchanged, as G2 left it |

Under R3 the runtime coverage model also changes. Under R4 nothing changes.

## 23. Owner decisions required

1. **Representation of the 5 date-dependent contexts.** Choose R1, R2, R3 or R4. Recommendation: **R3**.
   - It applies only cells that are grade A or B in every date state (the 11 date-invariant contexts).
   - It keeps the honest `authorityExclusion` on the 5 contexts.
   - Its scores are identical to R1.
   - Cost: coverage becomes per-context, in `validate()` and `getVol10JieshaRuntime`.
   - R1 is the alternative with no runtime change, but it asserts a source-contradicted `blank` on 298 in-window days (§10A), which needs the provenance note.
   - In-window 劫煞 avoid on the 5 contexts remains a documented follow-up (R2).
2. **Acceptance of the outside-domain blast radius** (same for R1 and R3). 1,119 demolition days, all −15, which is the full transition table in §12. In the P4 domain the change is 0.
3. **Acceptance of the B-grade cells** whose 月表 pages do not discriminate: 戌×4, 丑-丙寅 and 未-戊申 out of window.
4. **R2 only:** adopt the soil-window convention beyond 2025–2027 as authority. It is grade C today, and no approved cell yet rests on that extension (SOURCE_DEPENDENT 0).
5. **`datasetVersion`:** bump or keep, following the G2 precedent.

Already-frozen matters (G1-b, G2, identity, canonical direction, 2025-02-02 soil boundary) are not re-asked.

## 24. Final Stage 1 decision

- **`SAME_HEADING_AUTHORITY_PARTIAL`.**
- Stage 2 recommendation: **proceed after the owner rulings in §23 (1–3, and 5).**
- Verdict: **`G1_GLYPH_STAGE_1_READY_FOR_REVIEW`**. This does not approve production activation. It means the evidence and the Stage 2 specification are ready for owner review.
