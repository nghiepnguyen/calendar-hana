# G1 audit: 破屋壊垣 vs 破屋壞垣

2026-10-23. Branch `claude/p4-g1-audit` from `origin/main` `8b63ba0`, which is Option C v1 as released in PR #87 and PR #88. This is an **audit only**. No runtime code, authority, Golden or P4 dataset is changed.

Artifacts are in [`sources/p4-vol10/g1-glyph-audit-v1/`](sources/p4-vol10/g1-glyph-audit-v1/):

- `build_inventory.py` produces `inventory.tsv` (per file and class, counting occurrences rather than lines) and `inventory-summary.json`.
- `probe-score-adapter.test.ts.txt` is a read-only probe. Its output is in `probe-result.json`.

**Question (PROJECT_CONTEXT G1):** do 破屋壊垣 (壊 U+58CA) and 破屋壞垣 (壞 U+58DE) name the same 卷十一 用事 activity, or must they stay distinct?

## Decision: `SAME_ACTIVITY_ALIAS`

The two forms are glyph variants of one heading, demolition (`demolition`). Evidence from the source corpus inside the repo is enough to decide this. No claim from an external variant dictionary is relied on.

The alias should be applied **at match and key time**, by folding into the canonical form 破屋壊垣, which runtime already uses. Raw source text and keys should **not** be rewritten (see Provenance).

## Evidence

The evidence below comes from the sources themselves (`docs/audits/sources/p4-vol10/`):

| # | Evidence | Shows |
|---|---|---|
| E1 | 卷十 `vol10.raw.txt:392` 土符地囊 忌 「…平治道塗破屋**壞**垣栽種破土」 and `:449` 土王用事 忌 「…平治道塗破屋**壊**垣栽種破土」 | The lists are identical character for character except 宫/宮 and 壞/壊. |
| E2 | `:271` 月建「又為**土府**專忌…破屋**壞**垣…」 vs `:449` 土王用事, which is glossed at `:450` `{{SK anchor\|義同土府}}` | The text itself says 土王用事 has the same meaning as 土府, and the two lists match. They differ only in 宮/宫, 產/産 and 壞/壊, and `NORM` already folds the first two pairs. |
| E2b | 卷十一 `vol11.raw.txt:265`, the 忌 of heading 破屋**壊**垣, names 劫煞. The 卷十 劫煞 avoid list (`xiejibianfangshu-vol10-yiji.json` `jie_sha.avoid`) names 破屋**壞**垣. | This is the exact authority link G1 is about, written in two glyphs. |
| E3 | 卷十 `:189` 破日「宜求醫療病破屋**壞**垣」 ↔ 卷十一 `vol11.raw.txt:263–264` heading 破屋**壊**垣「宜月破」 | Each volume cross-references the other: 破日 says demolition is 宜, and the demolition entry says 月破 is 宜. The two volumes use different glyphs for this one link. |
| E4 | 卷十 `:443` 上朔/四離/四絶/晦日 止不忌「…破屋**壊**垣伐木」 vs 推步紀曆 `tuibu-jieli-shang.raw.txt:999`, the same rule, 「…破屋**壞**垣，伐木」 | Two sources print the same rule with different glyphs. |
| E5 | 卷十一 activity list `vol11.raw.txt:46` and heading `:263` both use 壊. 卷十 has 壊 3 times and 壞 15 times. In both volumes every occurrence of either glyph is inside this compound (counted per character with `grep -o`). | No other 壞 or 壊 word exists in these sources that could carry a separate meaning. |
| E6 | The project's transcription of the 月表 scans (h1b, scans SHA-locked) gives 破屋**壞**垣 on the ji line of 13 of 29 pages. No page is transcribed with 壊. `h1b lock.json headingTerms.map` already pairs canonical 破屋壊垣 with the transcribed 破屋壞垣. | An earlier approved audit already treated the two as one heading. |
| E7 | `yi-composition-expected-v1/source-basis.json normalization.headingMap` 「破屋壞垣 → 破屋壊垣」, with `expected.json` cases `heading-norm:破屋壞垣:{present,absent,unknown}` | The yi layer already locks this alias in a Golden. |

**Falsification check.** Every file that contains both forms (`yi-baseline-v1/baseline.tsv`, `coverage.json`, `freeze.json`, `expected.json`, `source-basis.json`, `h1b lock.json`) pairs them as raw → canonical: `raw_heading`/`heading`, `heading`/`yueBiaoTerm`, `rawHeading`/`canonicalHeading`, or a map. No artifact gives the two forms different meanings, values or activity IDs. `DISTINCT_ACTIVITY` has no supporting evidence.

**Limit.** The raw text is a Wikisource 四庫 transcription. Scans were checked only for the 月表 (E6), not for the 卷十 and 卷十一 pages.

## Inventory and classification

There are 121 tracked files: 15,534 occurrences of 壊 and 3,525 of 壞 (`inventory-summary.json`). A line that pairs or maps the two forms is classed as alias/normalization, wherever it appears.

| Class | Files | 壊 | 壞 | Notes |
|---|---|---|---|---|
| source/raw evidence | 6 | 6 | 43 | `vol10.raw.txt` 3/15, `vol11.raw.txt` 3/0, tuibu 0/5, vol06 0/1, h1b 月表 lock 0/17 (13 printed ji lines), xiangdi witness 0/5 |
| canonical activity | 2 | 0 | 4 | `xiejibianfangshu-yiji.json` (`activityEntries.demolition`, `entries` key), `truc.json` sourceRef |
| alias/normalization | 25 | 1,316 | 1,178 | yi baseline raw/canonical columns, authority G1 exclusion, `headingMap`, audit `VARIANTS`/`replace` |
| authority/golden | 44 | 8,667 | 72 | P4 full Golden v1/v2, puzhu06 Golden v3, `p4-vol10-*` authorities, almost all canonical 壊 |
| runtime | 2 | 1 | 3 | `xiejiVol10Resolution.ts` HEADINGS (壊), `yuePoStillAvoidPolicy.ts` quote and headings (壞, folded by `splitHeadings`) |
| fixture/test/snapshot | 38 | 5,539 | 2,213 | sweep TSVs, migration diff (壞 is the raw activity key), test files |
| documentation | 13 | 5 | 12 | |

The string inventory does not show runtime sites driven by data, where the compound comes from JSON. They are listed under Behavioral impact.

## Provenance

- **Source.** 卷十 mixes both glyphs. 卷十一, the activity vocabulary, uses only 壊. 推步, 卷六 and the printed 月表 use only 壞.
- **Activity map.** `xiejibianfangshu-yiji.json` stores 破屋**壞**垣, and its own note says the variants were normalized `壊→壞`. That 壞 key is therefore a project normalization, not the 卷十一 glyph.
- **Runtime and Goldens go the other way.** `NORM` in `xiejiVol10Resolution.ts:68` maps `壞: '壊'`. The P4 Golden v1/v2 `VARIANTS`, puzhu06 v3 `canon`, the jiesha faithful and overlap scripts and the yi `headingMap` all fold to 壊.
- The repo has folded in two opposite directions. This is about naming only and changes no meaning, but it is the root cause of both live splits below.

**Would normalization destroy provenance?**

- **Folding at match or key time preserves it.** Raw text, `quote`, authority `text` and the 卷十一 key stay as written. This is what `splitHeadings`, `normalizeP4YiHeading` and the yi `headingMap` already do.
- **Rewriting raw data destroys it.** Examples are editing `*.raw.txt`, `YUE_PO_STILL_AVOID.quote`, `p4-vol10-authority.json` `text`, or the witness `jiLine`. Renaming the `activityEntries` or `entries` key also changes the evidence text shown to users (`activityRecommendations.ts:95` prints the headings) and the hashes of locked artifacts. Do not do any of these.

## Root cause of G1 (correction)

PR #87 docs and PROJECT_CONTEXT say the simulator missed demolition because `canonP4Heading` "keeps 壞". That is imprecise.

- `canonP4Heading` (`p4HeadingAnnotation.ts:41`) only maps 劵→券.
- Every runtime caller applies it *after* `splitHeadings`, which already folds 壞→壊. `P4_HEADINGS` contains 破屋壊垣 and does not contain 破屋壞垣 (probe).
- The actual split is in the audit harnesses `p4Puzhu17Audit.test.ts:166/246/273` and `p4ChouBingyinDeGate.test.ts:173/253/280`. They run `canon` on raw `activityEntries` **without** `splitHeadings`, while `listed` comes from `splitHeadings(jie.avoid)`. Demolition therefore reads `not_listed`, and `p4Puzhu17Audit.test.ts:366` drops it.
- The approved matrix is 24 of 29 activities. Of the 5 missing, only demolition was dropped because of the glyph. 祭祀, 掃舍宇, 入學 and 乘船渡水 are not in 劫煞's 忌 list, so they are genuinely `not_listed`.

## Behavioral impact

**A. Glyph folding in resolver paths is already done, so canonicalizing there changes nothing.**

- `resolveVol10` / `splitHeadings`
- `YUE_PO_STILL_AVOID` (its headings go through `splitHeadings`)
- `P4_HEADINGS`
- `p4DayComposition` / `p4YiDayCore` `norm`
- `normalizeP4YiHeading`

**B. Live split 1, 劫煞 authority v1.** Demolition is `EXCLUDED_PENDING_GLYPH_AUDIT`, and 16 runtime contexts keep legacy `cancel_both`.

- Closing it needs demolition cells. The faithful engine's `sensitivity.json` previews them as 15 of 16 contexts `only_ji` with 刼煞 in `ji`, and 丑-戊寅 as `not_recorded`.
- 14 of those 15 rows also carry the date-dependent 土王用事後, and the earlier H1-B page check skipped rows that carry it.
- Every one of the 16 contexts has an h1b 月表 page. Comparing whether 破屋壞垣 is on the transcribed ji line:
  - **12 agree with the preview:** 辰 ×4, 未 壬申/丙申/庚申, 戌 ×4, and 丑-戊寅, where it is not printed, which matches `not_recorded`.
  - **4 disagree:** 丑-甲寅, 丑-丙寅, 丑-壬寅 and 未-戊申 do not print it, although the preview says `only_ji`. The 丑-丙寅 page lists 月德, so that page falls outside the `cancel_both` branch. 未-戊申 is under an owner ruling.
- The preview is therefore **not** an approved cell set.
- The real cells need a re-run of P17-A with the harness fix and owner approval. That is an Option C v2.

**C. Live split 2, P4 score adapter (new finding, not covered by the G1 text).**

- `p4ScoreAdapter.ts:71/84` looks up `headings[h]` with the raw `activityEntries` key 破屋壞垣. The provider (`p4AlmanacHeadings` → `resolveP4OwnerRulesDay`) returns canonical keys.
- Result: demolition is `baseline` on **all 1,095 P4-domain days**, and its P4 balancing never runs.
- This is live in production. `manifest.json:40` ships `xiejiVol10BalancingEnabled: true`, and `src/main.tsx:13` loads the provider through `src/p4Provider.ts`.
- Corroboration: `p4-migration-diff-v2/activities-full-*.tsv` shows `破屋壞垣=missing` on every demolition row, and on no row of any other activity in 2025–2027.
- If the key were folded, 644 of 1,095 days would change state (`probe-result.json`):

  | State after folding | Days |
  |---|---|
  | `only_ji` | 552 |
  | `neither_recorded` | 54 |
  | `only_yi` | 28 |
  | `both_present` | 10 |
  | stays `baseline` (`not_recorded`) | 451 |

- Score and status were measured end to end with `getAlmanac` and two providers: the real one, and one that also returns the canonical row under 破屋壞垣, which is what a key-fold fix would do.
  - **Score:** changes on 320 of 1,095 days, 223 lower and 97 higher. The most common deltas are −15 (129 days), +10 (71), −25 (71), −5 (16) and +15 (12).
  - **Status:** changes on 337 days. The most common transitions are `no_evidence→avoid` 71, `watch→avoid` 64, `avoid→watch` 53, `no_evidence→watch` 51, `no_evidence→neutral` 33 and `strong_avoid→avoid` 26.
  - The full counts are in `probe-result.json`.
- Fixing this is a production behavior change. P4 migration-diff and the score Goldens would need regeneration and owner sign-off.

## Recommended follow-up (not implemented)

1. **Owner rules on the ontology.** Accept `SAME_ACTIVITY_ALIAS`, with canonical 破屋壊垣 at key and match level and raw text untouched.
2. **G1-a, the authority (Option C v2).**
   - Make the two audit harnesses match through `splitHeadings` + `canonP4Heading`.
   - Re-run P17-A for demolition only, in all 16 contexts.
   - Reconcile the 土王用事後 confound and witness pages.
   - Get owner approval for the cells, then move demolition from `EXCLUDED_PENDING_GLYPH_AUDIT` to `APPLIED` in a new authority version.
   - The approved candidate (`b24f6f68…`) and authority v1 stay frozen.
3. **G1-b, the score adapter.** Fold keys at lookup in `p4ActivityState` / `applyP4Balancing`, for example by using `normalizeP4YiHeading`. Do not rename the JSON key.
   - Gate it behind its own manifest policy, following the repo rule.
   - Add a migration diff for demolition across 2025–2027.
   - Get owner sign-off.
   - Track it separately from G1-a, because it moves P4 scores, not 劫煞.
4. **Docs.** Fix the root-cause sentence in `p4-jiesha-option-c-migration.md:34` and in the PROJECT_CONTEXT G1 row. Add G1-b to the debt table. This was not done here, by scope.
5. **Out of scope:** G2 劵/券 has the same structure. It is a separate audit.
