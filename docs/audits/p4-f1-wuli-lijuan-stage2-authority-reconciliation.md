# F1 Stage 2: 五離 × 立券交易, authority reconciliation and impact (audit only)

2026-10-26, branch `claude/f1-authority-reconciliation`, cut from F1 Stage 1 `372c6be`. **No production code or data change.**

**Artifacts** in `sources/p4-vol10/f1-wuli-lijuan-stage2/`:

| File | Contents |
|---|---|
| `impact.json` | Written by `shared/lunar/p4F1WuliStage2Impact.test.ts` with `F1S2_DUMP=1`. Every day of 2025–2027, both models, plus an outside-range diagnostic. |
| `build_evidence.py` → `evidence.json`, `lock.json` | Audit evidence and its lock. |

Stage 1 images are referenced by path and hash; they are not copied. The lock harness is `shared/lunar/p4F1WuliLijuanStage2Lock.test.ts`.

**Determination: R2, revise Q4 for 五離 only.** This is an audit determination. Q4 stays in force until the owner adopts R2.

## 1. Q4 authority chain

| Layer | Class | Where |
|---|---|---|
| Literal puzhu:06 | SOURCE_FACT | 卷十, `vol10.raw.txt` offset 21817: 「凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌」 |
| Transcription | SOURCE_FACT | Wikisource 四庫 transcription; scan check in puzhu:06 authority v1 (`718e195`) |
| Normalization | IMPLEMENTATION | p4b-puzhu06 headings: 立劵交易 → P4 heading 立券交易; 徳 = 德 |
| Class QL | SOURCE_INTERPRETATION | `tasks/prd-p4b-puzhu06.md` §8: remaining-ji with its own 「與…併則不忌」 list that does not name the trigger |
| **Q4 = yes** | **OWNER_RULING** (2026-10-16) | `p4b-puzhu06-v1.json` `ownerDecision.Q4`; `liftLists` includes 五離 (`718e195`) |
| Authority data | IMPLEMENTATION | `p4b-puzhu06-v3.json` `liftLists.五離`, `classes.QL` |
| Decision code | IMPLEMENTATION | `shared/lunar/p4Puzhu06.ts` `classify` (LIFT_GODS → QL) and `decideP4Puzhu06` |
| Runtime consumer | IMPLEMENTATION | `p4OwnerRules.ts` `resolveP4OwnerRulesDay` (`4d6ad5c`, 2026-10-17) → `p4AlmanacHeadings.getP4DayHeadings` (`134ff00`, 2026-10-18) → score adapter inside P4_DOMAIN 2025–2027 |

**Where "四相/月恩 lifts 五離 on 立券交易" entered the project:** the owner ruling Q4 = yes on 2026-10-16. The source text does not state it.

That ruling came before:

- n117 entered the repository (2026-10-21);
- n14 and n62 were acquired (2026-10-26).

## 2. Literal puzhu:06

**What the text says.** On 德, 合, 赦, 願, 月恩, 四相 and 時德 days, do not note 忌 on the listed headings, 立劵交易 among them. There are two exceptions, where 忌 is still noted:

- 遇徳猶忌;
- 從忌不從宜之日.

**What the text does not say.**

- Which 忌 *sources* are withheld.
- Whether a god whose own entry lists its lifters is covered.

**Where 五離 stands.** 五離 is not a 猶忌 god: its own entry lifts it with 德. Neither named exception covers it.

**What the project inferred (Q4).** Every remaining-ji god outside the two exceptions is lifted by any trigger. That reading leans literal, but it is still a choice about scope.

**Alternative reading (SOURCE_INTERPRETATION): lex specialis.** A god whose 卷十 entry lists its own lifters follows that entry, and puzhu:06 governs everything else. Two things support it:

- **Entry style.** 卷十 entries spell out trigger-specific behaviour, for example 八專 「與德合併猶忌與天願併止忌…餘不忌」.
- **The prints.** The Stage 1 pages behave this way.

This audit does not rewrite the source. Both readings are interpretations.

## 3. 五離's own authority

| | Value |
|---|---|
| Entry (卷十) | 「忌慶賜賞賀宴㑹結婚姻納采問名立劵交易與天德月德天德合月德合天赦三合六合併則不忌」 |
| 忌 | 慶賜賞賀, 宴會, 結婚姻, 納采問名, **立劵交易** |
| Explicit lifters | 天德 月德 天德合 月德合 天赦 三合 六合 |
| 四相 included | **NO** |
| 月恩 included | **NO** |
| puzhu:06 triggers outside its list | 天願, 月恩, 四相, 時德 |
| 五離 忌 ∩ puzhu:06 targets | 立券交易 only |

That 四相 and 月恩 are missing from the list is a source fact. This audit reads it as exclusion only together with the n14 and n62 prints.

## 4. n14 and n62 (source observations)

| | Supports | Contradicts | Cannot test |
|---|---|---|---|
| 06067696-n14 (戌-壬申, 四相) | WULI-NARROW; R2 | Q4 as applied to 五離 | Q4 for 九空/五虛/小耗/五墓; puzhu:21 N-A vs N-C (no 相抵); other months or officers; headings where 立券交易 has its own 宜 |
| 06067696-n62 (戌-庚申, 月恩) | same | same | same |

- Each page tests a different non-lifter trigger: 四相 on n14, 月恩 on n62.
- On each, 五離 is the only operand on 立券交易.
- The argument rests on that shared operand structure, not on there being two pages.

## 5. n117 (F1 only)

**Classification: CONTAMINATED_BUT_SUPPORTIVE. Weight: non-decisive.**

- **Fits:** its printed 立券交易 忌 is consistent with WULI-NARROW.
- **Contradicts:** Q4 together with N-A.
- **Limit:** 劫煞 is a second operand, so the page cannot separate 五離 from 劫煞.

The G2 cell 劫煞 × 立券交易 = BLANK / I1 (LOCAL D1(a)) is out of scope and unchanged.

## 6. Does Q4 survive?

| Option | Verdict |
|---|---|
| R1 KEEP Q4 | No. The text gives no stronger *direct* authority. It is silent on which sources are withheld, and two decisive prints contradict the Q4 application. |
| **R2 REVISE Q4 FOR 五離 ONLY** | **Determined.** Narrowest form the evidence supports. |
| R3 RETIRE Q4 GLOBALLY | Not supported **by evidence** (see the scope basis below). |
| R4 UNRESOLVED | No. The witnesses discriminate cleanly. |

**Exact scope.** For 五離 only, a puzhu:06 trigger does not remove 五離's 忌 on 立券交易 unless that trigger is also one of 五離's own lifters (天德, 月德, 天德合, 月德合, 天赦; 三合 and 六合 are not puzhu:06 triggers).

Out of scope:

- 九空, 五虛, 小耗, 五墓;
- other headings;
- puzhu:21.

**Scope basis: limited by the evidence, not by the interpretation.**

- The lex specialis reading would apply to every Q4-class god, since all five have their own lift lists. R2 is narrow because n14 and n62 test 五離 only.
- That makes the other four gods an **open, suspect class**: 56 of the 68 QL-lift rows in 2025–2027.
- **Unanalysed candidate pages:** the stored corpus has 27 pages that combine one of those gods with a puzhu:06 trigger (`evidence.json` → `otherQ4Gods`).
- **Pages that look testable:** some carry only non-lifter triggers, e.g. 卯-丁巳 and 戌-癸亥 with 五虛 + 四相, and 丑-戊寅 and 丑-壬寅 with 五虛 + 時德.
- Not solved here.

**Confidence**

- **High:** the 6 rows with the witnessed shape.
- **Medium:** the 4 extrapolated rows (§7).

## 7. Impact 2025–2027 (current production vs the R2 data change)

| Measure | Count |
|---|---|
| puzhu:06 decisions lift → keep | **12**, matching Stage 1's estimate: 10 with a final-state change, plus 2 decision-only (未-戊申 2026-08-02 and 2027-07-28) |
| puzhu:06 class-tag-only changes, rows already keep | 7 (午-己酉, 卯-丁酉, 戌-癸酉: `…QL` → `…QL_EXCLUDED`), no state change |
| **Heading rows changed** | **10**: 6 `not_recorded → only_ji` + 4 `only_yi → both_present` |
| **Activity rows changed** | **20**, all contract or transaction. Every one is −15, ending at watch. |
| Activity status moves | no_evidence → watch 12; neutral → watch 6; recommended → watch 2 |
| Hard warning changes | 0 |
| **Event records changed** | **100**: sign_contract, buy_vehicle, buy_property, property_handover, receive_vehicle, 20 each |
| Event classification changes | 69 |
| Event score changes | 90 |

Dates: 2025-01-15, 2025-06-08, 2025-10-18, 2025-10-30, 2026-01-10, 2026-10-13, 2026-10-25, 2027-01-05, 2027-10-08, 2027-10-20.

### Split by what the witnesses test

| Group | Contexts | Heading | Activity | Events | Status |
|---|---|---|---|---|---|
| Witnessed shape (no 宜 on 立券交易) | 戌-壬申, 戌-庚申 | 6 | 12 | 60 | tested by n14 and n62 |
| Extrapolated (立券交易 has its own 宜, both_present under R2) | 丑-甲申, 午-戊申 | 4 | 8 | 40 | no witness. Representative rows: contract 60 neutral → 45 watch; 65 recommended → 50 watch |

**Owner note.** One data change carries R2 into both groups. Limiting it to the witnessed group would need an ad hoc condition on the heading's 宜. The realistic choices are to adopt both groups or to defer R2.

### Why 未-戊申 is decision-only

- Under R2, puzhu:06 keeps 五離 (`keep:QL_EXCLUDED`).
- puzhu:21, read N-A, then withholds it from 納財 (`neither_recorded`), so the final state stays `neither_recorded`.
- Production therefore still disagrees with n117 after R2.
- This is a **separate open question (puzhu:21 N-A vs N-C)** and is outside the Stage 3 scope.

## 8. Outside 2025–2027

| Layer | Status |
|---|---|
| Production | **KNOWN: 0.** The P4 layer that holds puzhu:06 runs only inside P4_DOMAIN: `getP4DayHeadings` returns `{}` outside it. Outside the domain, 五離 is not a source-locked presence god. A test pins this: 戌-壬申 on 2024-11-04 and 2028-10-14 shows heading, activity and event diffs all zero. |
| Authority | **PARTIALLY_KNOWN.** The context-level diagnostic finds final-state changes in 5 contexts (丑-甲申, 午-戊申, 戌-壬申, 戌-庚申, 酉-壬申), covering 494 dates in 1900–2100 outside the domain. It is diagnostic only, not frozen production impact. |

## 9. Regression boundary for an R2 migration

The measured envelope above shows that only 立券交易 headings and contract/transaction activities move. The following must not change:

- **G2-n117 / W1:** 劫煞 × 立券交易 = BLANK / I1 (authority v4 untouched); the 劫煞 cells; the 納財 LOCAL ruling.
- **Other P4 headings:** 開市, 納財, 安牀, 開倉庫出貨財.
- **Other puzhu:06 behaviour:** 九空, 五虛, 小耗, 五墓; the Q4a 五墓 exclusion.
- **puzhu:21:** still read N-A.
- **G1 / G1-b and aliases:** demolition; activity aliases.
- **Everything else:** every activity except contract and transaction; all dates outside 2025–2027.

| Regression witness test | What it guards |
|---|---|
| `p4G2N117Stage3Lock` | G2-n117 / W1 cell and ruling |
| `xiejiVol10JieshaAuthority` | 劫煞 authority cells |
| `p4OptionCFinalGateLock` | 納財 LOCAL ruling |
| `p4Puzhu06` | Q4a 巳丙戌 keep rows |
| `p4F1WuliStage2Impact` | the 10-row envelope and the out-of-domain zero |

## 10. Migration design (plan only, not implemented)

**Decision point:** `shared/lunar/p4Puzhu06.ts` `classify()`. For a remaining-ji god in LIFT_GODS, the god gets class QL or QL_EXCLUDED through `EXCLUDED`. This is the existing Q4a mechanism.

**Change: data only.**

- A new authority `p4b-puzhu06-v4.json` = v3 + `liftExclusions.五離 = {triggers: [天願, 月恩, 四相, 時德]}`, with the basis quoted from the 卷十 五離 entry.
- `p4Puzhu06.ts` imports v4 instead of v3.
- No date condition, no page condition, no code branch.

**Goldens:**

- puzhu:06 Golden v4, successor to v3;
- P4 score Golden v5, successor to v4;
- a migration-diff successor and lock;
- re-pins wherever the 10 rows sit.

**Fallout, measured as an upper bound.** v3 was edited in place in a scratch worktree, not with a v4 file. That broke 11 suites / 23 tests:

- puzhu:06 authority v3, composer, Golden v3, sweep;
- score adapter almanac;
- P4 score Golden v3 and v4;
- migration diff, and migration diff v3;
- the faithful 劫煞 lock;
- the 納財 audit lock.

A v4 file plus an import switch would keep the v3 lock tests green. That variant was not measured.

**Tests:**

- envelope = exactly the rows in `impact.json`;
- rollback to v3 = byte-identical current output;
- mutation: dropping the exclusion leaves the envelope empty;
- G2 / W1 and the 劫煞 cells unchanged.

**Audit artifacts:** `docs/audits/p4-f1-wuli-lijuan-stage3-migration.md` and `f1-wuli-lijuan-stage3/` (evidence and lock).

**Forbidden:**

- date or witness conditions;
- editing v3 in place.

## 11. Owner ruling

| | |
|---|---|
| Previous | Q4 = yes (2026-10-16) |
| Current | **Q4 = yes, still in force** |
| Proposed | **R2**, an audit determination that needs owner adoption before Stage 3. It covers both impact groups (§7), or R2 is deferred. |
| Reason | Q4 was adopted before n117, n14 and n62 were available. Two decisive prints from the same edition contradict its application to 五離. 五離's own entry does not list 四相 or 月恩. |

## 12. Production and G2

- Production code and data are unchanged. The only new files are audit docs, evidence and test harnesses.
- G2-n117 / W1 is CLOSED and unchanged.

## 13. Next step

**F1 Stage 3 (migration) is required once the owner adopts R2.**

The following stay separate and open:

- puzhu:21 N-A vs N-C on 未-戊申;
- the other Q4-class gods.
