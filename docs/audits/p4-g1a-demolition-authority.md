# G1-a audit: demolition authority (破屋壞垣 / 破屋壊垣)

2026-10-24. Branch `claude/g1a-demolition-authority-audit` from `origin/main` `00558ba`. **Audit only.** No runtime code, authority, Golden, manifest policy or locked artifact is changed. Production stays on `p4ScoreHeadingLookup: "source-key-v1"`.

Artifacts are in [`sources/p4-vol10/g1a-demolition-authority-v1/`](sources/p4-vol10/g1a-demolition-authority-v1/):

| File | Producer | Content |
|---|---|---|
| `engine.json` | `shared/lunar/p4G1aDemolitionEngine.test.ts` (runs in `npm test`) | The corrected faithful 劫煞 engine for demolition in 16 contexts, with 土王用事後 absent and present, compared with the 月表 page |
| `full.json` | the same file with `G1A_FULL=1` | Demolition verdicts on all 1,636 faithful scope dates, split by 土王用事 window |
| `overlap.json` | `shared/lunar/p4G1aDemolitionOverlap.test.ts` (runs in `npm test`) | `source-key-v1` and `canonical-v1` through `getAlmanac` with a mocked manifest, for the 5 overlap days and their soil siblings |
| `witness-matrix.json` | `build_witness.py` | Every source occurrence and every 月表 page, as `source_raw` / `normalized_comparison` / `canonical_candidate` |
| `lock.json` | — | sha256 of the inputs, the outputs and the prior evidence |

Both tests compare against the committed JSON. `G1A_WRITE=1` rewrites it. Plain `npm test` writes nothing.

## Decision

- **G1 classification:** `SAME_ACTIVITY_ALIAS_CONFIRMED`.
- **Stage 2 G1-a gate:** `READY_FOR_REVIEW`.
- **Still required:** the owner's acknowledgement of the 5 overlap days. That is G1-b acceptance criterion 4, and this audit cannot grant it.

## 1. Evidence inventory

| Artifact | Purpose | Authority level | Conclusion | Pinned? |
|---|---|---|---|---|
| `docs/audits/p4-g1-glyph-audit.md` (`ef5e278`) | G1 glyph audit | project audit, owner ruling pending | `SAME_ACTIVITY_ALIAS`. It lists the four witness disagreements and the 土王用事後 confound. | in git. `lock.json` adds sha256. |
| `docs/audits/p4-g1b-score-lookup.md` (`9aa9cf7`, **unmerged** branch `claude/p4-g1b-audit`) | G1-b spec. It names the 5 overlap days (§8) and the Stage 2 criteria (§9). | project spec | READY_FOR_IMPLEMENTATION, with Stage 2 gated on G1-a and the owner | not on `main`. `main` cites it at `p4ScoreHeadingLookup.test.ts:18` and in `45c9eea`. Pinned here by commit and sha256 `8ac93927…`. |
| `45c9eea` (PR #90), `p4ScoreAdapter.ts`, `manifest.json:42` | G1-b Stage 1 | runtime | `source-key-v1` shipped. `canonical-v1` exists but is not shipped. | Stage 1 commit says the change is byte-identical (`ab5a5a73…`) |
| `xieji-vol10-jiesha-authority-v1.json` | 劫煞 Option C v1 | approved authority | demolition is `EXCLUDED_PENDING_GLYPH_AUDIT` | candidate `b24f6f68…` |
| `jiesha-faithful-vol10-v1/sensitivity.json` | faithful preview | audit snapshot | demolition verdict `not_listed` in 16/16 contexts, which is the harness defect | sha in `lock.json` |
| `h1b-yuebiao-witness-v1/lock.json` | 月表 page transcriptions | scan-locked witness | 破屋壞垣 is printed on 11 of the 16 context pages | page sha256 |
| `p4-soil-owner-convention-v1.json` | 土王用事後 timing | owner-adopted (2026-10-13), `SOURCE_DEPENDENT` | 18 days before 四立, the 立 day excluded, coverage 2025–2027 | yes |
| `p4-vol10-day-composition-v2.json` `puzhu:20` | 相抵 propagation 興造動土+豎柱上梁 → 破屋壞垣 | locked composition | — | yes |
| `yi-composition-expected-v1/source-basis.json` `headingMap` | yi alias 破屋壞垣 → 破屋壊垣 | locked Golden | alias | yes |

**Where the previous conclusion came from.** G1 drew on E1–E7: same lists in two glyphs, cross-references between volumes, the h1b `headingTerms.map` and the yi `headingMap`. It found no artifact that gives the two forms different values. It left open the four page disagreements and the 土王用事後 confound. G1-a re-derives both from source and does not inherit them.

## 2. Current production behaviour

- **Default lookup:** `manifest.policies.p4ScoreHeadingLookup = "source-key-v1"`, and the code default is also `source-key-v1` (`p4ScoreAdapter.ts:108,167`).
- **`source-key-v1`:** the adapter reads `headings['破屋壞垣']`. The P4 provider keys rows canonically (`破屋壊垣`), so demolition stays `baseline` on every P4 day.
- **`canonical-v1`:** reads `canonicalP4HeadingKey(h)` (`xiejiVol10Resolution.ts:114`), which is `splitHeadings` + `canonP4Heading`. The deciding heading keeps the source spelling. This mode is not shipped.

**Where folding happens:**
- `resolveVol10` / `splitHeadings` (`NORM` 壞→壊)
- `P4_HEADINGS`
- `normalizeP4YiHeading`
- the yi `headingMap`
- `canonicalP4HeadingKey`

**Where it deliberately does not happen:**
- `xiejibianfangshu-yiji.json` `activityEntries` / `entries` keys
- the raw texts
- authority `text`
- witness `jiLine`

**Stage 1 is behaviour-neutral.** The `p4ScoreHeadingLookup.test.ts` tests pass and are unchanged.

## 3. Harness defect

**Location.** Six frozen audit harnesses key the two sides differently:

- `p4JieshaFaithfulSensitivity`
- `p4JieshaFaithfulVol10`
- `p4JieshaOverlapImpact`
- `p4Puzhu17Audit`
- `p4ChouBingyinDeGate`
- `p4WeishenNacaiAudit`

In each, the 劫煞 side is `splitHeadings(jie.avoid).map(canonP4Heading)`, which folds 壞→壊. The activity side is `activityEntries[a].map(canonP4Heading)`, which maps only 劵→券. For example, `p4Puzhu17Audit.test.ts:165–166,246,273`.

`build_faithful.py:103` folds correctly.

**What it does.** Demolition's source key 破屋壞垣 never meets 破屋壊垣, so the verdict is a false `not_listed`.

**The direction is the opposite of the hypothesis in the task.** The harness does **not** collapse the spellings early and so manufacture an agreement. It **fails to fold**, so it hides a real match.

- The engine rows are unaffected: `rows['破屋壊垣']` is computed correctly, with `only_ji` and 刼煞 in 15/16 contexts.
- Only the verdict selection drops demolition.
- No other activity is affected. `canonicalP4HeadingKey` changes only 破屋壞垣 (`p4ScoreHeadingLookup.test.ts`).

**Why the six harnesses were not fixed in place.**
- `p4Puzhu17Audit` rewrites `puzhu17-bujiang-v1/freeze.json` whenever it runs.
- That lock is part of the approved chain (`candidate-final.json` `b24f6f68`).
- CI fails when a tracked artifact changes (`9243e33`).

An in-place fix would therefore regenerate approved evidence. Instead, `p4G1aDemolitionEngine.test.ts` is a successor harness:

- It copies the faithful prelude, trimmed. puzhu:17 variants are dropped because puzhu:17 never reaches demolition. Its `to` set is the marriage headings.
- It keys both sides with `canonicalP4HeadingKey`.
- It records `sourceRaw`, `normalizedComparison` and `canonicalCandidate` separately.

The harness tests prove:

- the legacy keying gives `[]`, which is `not_listed`, and the corrected keying gives `['破屋壊垣']`;
- `sourceRaw` `破屋壞垣` ≠ `破屋壊垣`, and `NFKC` does not unify them;
- `normalizedComparison` is equal for both spellings;
- `canonicalCandidate` = `破屋壊垣`.

Only the one runtime `NORM` pair is used. No new fold is added, for example none for 劫/刼.

## 4. Demolition witness matrix

Built by `witness-matrix.json`. Glyph counts per source:

| Source | Work | Provenance | 壞 | 壊 |
|---|---|---|---|---|
| `vol10.raw.txt` | 協紀辨方書 卷十 | primary authority, Wikisource 四庫 transcription | 15 | 3 (`:443`, `:449`, `:506`) |
| `vol11.raw.txt` | 協紀辨方書 卷十一 | primary authority, transcription | 0 | 3 (`:46`, `:67`, `:263`) |
| `vol06.raw.txt` | 協紀辨方書 卷六 | primary authority, transcription | 1 | 0 |
| `tuibu-jieli-shang.raw.txt` | 推步捷例 上 (Joseon 1861) | derivative compilation, `RESEARCH_EVIDENCE_ONLY` | 5 | 0 |
| h1b 月表 pages (16 contexts) | 協紀辨方書 月表 scans | scan-locked, project visual transcription | 11 pages | 0 |

**Normalized forms.** Every occurrence normalizes to one form: `distinctNormalized = ['破屋壊垣']`.

**Independence.**
- 卷六, 卷十, 卷十一 and the 月表 are **one work**. They are internal cross-references, not independent witnesses.
- 推步 is a later compilation of the same rules. It corroborates the reading but is not independent authority.
- The 明史 / 宋史 / 律曆考 files speak only to 土王用事 timing. They are not demolition witnesses.

**Glyph-specific conditions.** No source shows one.
- One rule is printed in both glyphs:
  - 土王用事 at `vol10:449` (壊) and `tuibu:1005` (壞);
  - 上朔/四離 at `vol10:443` (壊) and `tuibu:999` (壞).
- One list is printed in both glyphs: 土府/土符 at `vol10:271/392` (壞) and 土王用事 at `vol10:449` (壊), glossed 義同土府.
- 卷十一 uses only 壊, both in the activity list and in the heading.

**Limit.** 卷十 and 卷十一 were not re-read from scan. Only the 月表 is scan-locked.

## 5. 土王用事後

**Source.** 卷十一 `vol11.raw.txt:263–265`. Heading 破屋壊垣, 「宜月破」, and a 忌 list that ends 「…土符地囊**土王用事後**」. It is a 忌 operand of the heading itself.

**Corroboration.** The 卷十 土王用事 忌 list (`vol10:449`, 壊) names the heading, as does 推步 (`tuibu:1005`, 壞). Timing comes from 「自四立節前一辰，逆數至十八日，爲土王用事」 (`tuibu:925`) and 卷一 「土於四立之前各旺一十八日」.

**What it is.** A **temporal 忌 qualifier**, meaning a date-period avoidance. It is not part of the activity identity, not an exception and not a prerequisite. It attaches in both glyphs, so it does not depend on the glyph.

**How it acts on demolition.** Two paths:

1. **Direct.** It is a 忌 on 破屋壊垣.
2. **Indirect, through puzhu:20** (卷十 offset 22313). The text is 「凡吉凶相抵不註忌修造動土豎柱上梁亦不註忌…破屋壊垣如遇徳猶忌之日則仍註忌」. The 相抵 lift reaches demolition only when 興造動土 and 豎柱上梁 are both unnoted. Inside the window, 興造動土 carries 土王用事後, so the lift is blocked and 劫煞's 忌 survives on demolition.

**Dependency chain.**

```
卷十一 :265 破屋壊垣 忌 …土王用事後          卷十 :449 土王用事 忌 …破屋壊垣
        │                                          │
        ├── direct 忌 on demolition ───────────────┘
        └── 興造動土 also 忌 土王用事後 → puzhu:20 相抵 lift blocked → 劫煞 忌 kept on demolition
                 ↓
p4-soil-owner-convention-v1 (window = 18 civil days before 四立, 立 excluded; 2025–2027)
                 ↓  production: p4SoilConvention → p4AlmanacHeadings provider → resolveP4OwnerRulesDay
demolition P4 state only_ji, prot 土王用事後 on in-window days
```

**Decision.** `RESOLVED`.
- **Attachment: high confidence.** It is a literal source operand, in both glyphs.
- **Exact day boundary: owner convention**, owner-adopted and `SOURCE_DEPENDENT`.

## 6. The four witness conflicts

**The contexts.** The four come from G1 §B: 丑-甲寅, 丑-丙寅, 丑-壬寅 and 未-戊申. The representative dates are the same as in `p4Puzhu17Audit` REP.

**Cause.** In all four, the representative date falls **inside** the 土王用事 window (`repDateInSoilWindow: true`). The 月表 is indexed by month + pillar only, so it cannot carry a date-dependent operand. G1 compared an undated page with an in-window cell.

**Test.** The corrected engine was run with 土王用事後 forced absent and then present (`engine.json`).

| Context | Page n | Soil absent: 興造動土 / 豎柱上梁 → demolition | Soil present → demolition | Page prints 破屋壞垣 | Agrees (absent) | Cause | Resolution | Confidence |
|---|---|---|---|---|---|---|---|---|
| 丑-甲寅 | 06067697-n123 | neither_recorded (宜) / neither_recorded → `not_recorded` via puzhu:20, **blank** | only_ji 刼煞+土王用事後, avoid | no | yes | DEPENDENCY_CONFLICT | soil-absent cell = blank, which matches the page. In window, avoid. | high |
| 丑-丙寅 | 06067697-n75 | same → **blank** | avoid | no | yes | DEPENDENCY_CONFLICT. The page's 月德 is a printing error (D-A, not reopened). It would also leave the heading unprinted. | blank / avoid as above | high |
| 丑-壬寅 | 06067697-n111 | same → **blank** | avoid | no | yes | DEPENDENCY_CONFLICT | blank / avoid | high |
| 未-戊申 | 06067694-n117 | same → **blank** | avoid | no | yes | DEPENDENCY_CONFLICT. This is not the 納財 owner ruling, which stays local. | blank / avoid | high |

**Controls.**
- The other 12 contexts also agree when soil is absent, so the count is **16/16**:
  - In 10 contexts 興造動土 has no 宜 and keeps 刼煞. Demolition is avoid in both states and printed.
  - In 戌-癸亥, 興造動土 has 宜 but is noted by 土符, which is undated. That blocks the lift, so demolition is avoid and printed. This is the one soil-independent case of the puzhu:20 mechanism.
  - 丑-戊寅 is blank and not printed.
- How much each page discriminates:
  - **Discriminating (10): 辰×4, 未-丙申/壬申/庚申, 丑-甲寅/壬寅/戊寅.** Only 劫煞 could put the heading on these pages, or leave it off.
  - **Consistent but not discriminating:**
    - 戌×4: 土符's own 忌 list names 破屋壞垣 (`vol10:392`), so the heading prints whatever 劫煞 does. 戌-癸亥 (n65) is also `SOURCE_AMBIGUOUS` in h1b, but over 開倉庫出貨財/安葬, not demolition.
    - 丑-丙寅 (n75): the page prints 月德 (D-A printing error), which would leave the heading off under either reading.
    - 未-戊申 (n117): the owner has ruled this page internally inconsistent (納財 ruling). Its omission matches the blank cell but carries less weight.
- `full.json` covers all 1,636 scope dates, 1900–2100. Demolition's verdict depends only on the 土王用事 window: avoid in every in-window date. Out of window it is blank in the 5 丑-寅/未-戊申 contexts and avoid in the other 11. Moon-phase enumeration never splits a date. 母倉 soil reign is forced to match the window, as in the faithful `extend` run.

**Not glyph conflicts.** None of the four is GLYPH_ONLY or ALIAS_ONLY. Neither glyph is printed on those pages. The harness defect hid demolition but did not cause these disagreements.

**Option C v2 note (not a Stage 2 blocker).**
- The 劫煞 demolition cell is **date-dependent** in 5 contexts. Authority v1 keys cells by context only.
- Option C v2 must choose a representation, for example the soil-absent cell plus 土王用事 as its own avoid source. The owner needs to approve it.
- Authority v1 is untouched, and demolition stays `EXCLUDED_PENDING_GLYPH_AUDIT`.

## 7. The five overlap dates

**Source of the dates.** G1-b §8 lists 5 dates. They are recomputed here on `00558ba` through `getAlmanac` (`overlap.json`), and production is not changed.

**Coverage.** These 5 dates are the **only** 2025–2027 days in the four conflict contexts. All of them are inside the window. So no in-domain day can be checked against a page out of window. `full.json` covers that case instead.

| Date | Context | 土王用事 window | Source-key-v1 | Canonical-v1 | Soil siblings same day | Class |
|---|---|---|---|---|---|---|
| 2025-02-02 | 丑-壬寅 | 立春 2025-02-03; onset+17, **the eve (boundary)** | 35 watch: 劫煞 informational 0 (vol10 相抵 lift), 土王用事 −15 | 20 avoid: 劫煞 applied −15, 土王用事 −15, P4 only_ji prot 土王用事後 | groundbreaking, construction, renovation, warehouse, planting = 20 avoid, 劫煞 −15, 土王用事 −15 | EXPECTED_CORRECTION |
| 2026-01-28 | 丑-壬寅 | 立春 2026-02-04; onset+11 | 35 watch | 20 avoid | identical | EXPECTED_CORRECTION |
| 2027-01-23 | 丑-壬寅 | 立春 2027-02-04; onset+6 | 35 watch | 20 avoid | identical | EXPECTED_CORRECTION |
| 2026-08-02 | 未-戊申 | 立秋 2026-08-07; onset+13 | 35 watch | 20 avoid | identical | EXPECTED_CORRECTION |
| 2027-07-28 | 未-戊申 | 立秋 2027-08-08; onset+7 | 35 watch | 20 avoid | identical | EXPECTED_CORRECTION |

**Activity state** (`p4ActivityState`) is `baseline` under `source-key-v1` and `only_ji` under `canonical-v1` on all 5 days. The deciding heading stays the source spelling 破屋壞垣. Hard warning is `false` in both modes on every date.

**Why EXPECTED_CORRECTION.**
- `source-key-v1` leaves demolition on the vol10 path only because of a key mismatch. That is the G1-b bug, not an authority decision.
- The avoid **ruling** rests on 土王用事後. It is a literal 忌 of the heading (卷十一 `:265`) and the protected reason for the P4 `only_ji` state.
- Under `canonical-v1`, demolition takes the same score, status and penalties as all five soil-convention siblings on the same day. This shows **consistency with the P4 convention, not authority**.

**Attribution note on G1-b §8.**
- §8 is right at the row level. P4 rows suppress 刼煞 by xiangdi, and the state comes from 土王用事後.
- The score delta has another source. The −15 is Kiếp Sát going from `informational` to `applied`, while 土王用事 is −15 in both modes.
- The mechanism is the adapter convention. On the P4 path the vol10 相抵 lift is not used, and under `only_ji` `applyP4Balancing` keeps every applied negative bad-god row (`p4ScoreAdapter.ts:178–181`). The siblings get their −15 the same way.
- For demolition this label is also source-consistent. The corrected faithful engine, independently, keeps 刼煞 on demolition inside the window, because puzhu:20 is blocked by 興造動土's 土王用事後.
- The note does not change the classification. The owner signs off on these days, so the attribution is stated exactly.

**Boundary.** 2025-02-02 is in window only because the owner convention excludes the 立 day. That convention is approved. Under a different convention this one date would move.

## 8. Proof of SAME_ACTIVITY_ALIAS

1. **Same activity?** Yes. Each rule is printed in both glyphs (E1, E4, 土王用事 `vol10:449` / `tuibu:1005`). Every occurrence normalizes to one form. No source gives the glyphs different lists or values.
2. **Is 壞→壊 the expected fold?** Yes. It is the existing runtime `NORM` pair. 卷十一 itself uses 壊, and no other 壞/壊 word exists in these sources (G1 E5).
3. **Does either spelling carry a different condition?** No. The same lists and the same conditions appear in both glyphs (§4).
4. **Does 土王用事後 attach equally?** Yes. It is a 忌 of the heading (卷十一 `:265`), and 土王用事 lists the heading in both glyphs (§5).
5. **Do the four conflicts disappear?** Yes. They are a comparison artifact of the 土王用事 dependency, at 16/16 agreement, 10 of which discriminate. None is a glyph conflict.
6. **Do the five dates keep their semantics?** Yes. All five are EXPECTED_CORRECTION and match their siblings.

**Not WITH_CONDITION.** The 土王用事 dependency is a rule condition. It attaches identically to both spellings, so the alias itself is unconditional.

**Classification:** `SAME_ACTIVITY_ALIAS_CONFIRMED`.

## 9. Canonical candidate

```
canonicalCandidate: 破屋壊垣
alias:              破屋壞垣 → 破屋壊垣
```

**Why this direction.**
- 卷十一, the activity vocabulary, uses only 壊.
- Runtime `NORM`, `P4_HEADINGS`, the P4 provider, the Golden `VARIANTS` and the yi `headingMap` already fold to 壊.
- The opposite fold (`activityEntries` 壞) is a project normalization, as the note in `xiejibianfangshu-yiji.json` says. It is not the 卷十一 glyph.

`sourceRaw` stays 破屋壞垣 wherever provenance needs it: activity map keys, `quote`, authority `text`, witness `jiLine`, and the deciding heading under `canonical-v1`.

**Not activated.**

## 10. Stage 2 readiness (G1-a gate)

- [x] Audit harness normalization fixed (successor harness; frozen harnesses untouched)
- [x] Raw transcription preserved (`sourceRaw` separate; test-proven)
- [x] Demolition re-audit complete (16 contexts × 2 soil states; 1,636 scope dates)
- [x] 土王用事後 dependency resolved
- [x] Four witness conflicts resolved (DEPENDENCY_CONFLICT; 16/16 agree, 10 discriminating)
- [x] Five overlap dates resolved (5 × EXPECTED_CORRECTION)
- [x] SAME_ACTIVITY_ALIAS confirmed
- [x] Canonical candidate justified
- [x] No unresolved semantic conflict
- [x] No authority or Golden data rewritten (`git diff` on tracked files is empty)
- [x] Production remains `source-key-v1`

**Result: `READY_FOR_REVIEW`.**

**Still owed before Stage 2:**
- The owner's explicit acknowledgement of the 5 days (G1-b criterion 4).
- Merging or pinning the G1-b spec, which is only on `9aa9cf7`.

**Separate from Stage 2.** Option C v2 for the 劫煞 demolition cell is its own track, and it needs a dated-cell design.
