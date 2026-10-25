# G1-SOIL Stage 2: specification (R2, date-dependent demolition authority)

2026-10-25. Branch `claude/g1-soil-stage2`. Ancestry: `ce05ba4` (the Stage 1 audit, [p4-g1-soil-authority.md](p4-g1-soil-authority.md)). Production base: `d5c005f`. This records the owner ruling that governs the implementation.

## Owner ruling (2026-10-25): `DATE_DEPENDENT_AUTHORITY_CONFIRMED` for Stage 2

**The rule, `tho-vuong-dung-su-rule-v1`.** Production authority for 1900-01-01 … 2100-12-31.
- For each 四立 civil date L, the window is [L − 18, L − 1], both ends included, the 立 day excluded: 4 × 18 = 72 days a year.
- The 四立 instant comes from the JPL true-term authority, converted to a civil date at UTC+7.
- Any change of timezone, civil conversion, solar-term authority or inclusivity requires a new rule version.
- The 19-day reading and the 2-hour reading of 「前一辰」 are rejected.

**The 5 contexts** (丑甲寅, 丑丙寅, 丑壬寅, 丑戊寅, 未戊申), demolition only:
- outside → blank, inside → avoid;
- grade B;
- represented as `APPLIED_DATE_DEPENDENT` with selector `tho-vuong-dung-su-rule-v1`;
- no static cell, no dates.

The G2 cells (including 未戊申 contract/transaction BLANK / I1) are untouched.

**Architecture:** calendar fact → authority selector → scoring. A separate, versioned calendar-rule service. No astronomy in scoring, activity mapping, authority JSON or resolver branches.

**Fail loud** on each of these:
- a missing civil date;
- an undeterminable state;
- an out-of-range date;
- an unknown selector;
- a static cell on one of the 5 contexts;
- one of the 5 treated as static APPLIED;
- missing solar-term authority.

No silent blank or avoid, and no R3 fallback.

## Frozen envelope (against shipped v3)

**Activities**

| | 2025–2027 | Outside |
|---|---|---|
| demolition changed days | 0 | 298 |
| score changes | 0 | 298, all −15 |
| status changes | 0 | 298 watch → avoid |
| hard warning / P4 state | 0 | 0 / 0 |
| other activities | 0 | 0 |

Outside, per context: 丑丙寅 61, 丑壬寅 58, 丑戊寅 59, 丑甲寅 60, 未戊申 60.

**Stake:** 502 occurrences = 303 inside + 199 outside. Static blank is wrong on 303; 298 of those are visible and 5 are P4-masked. Static avoid is wrong on 199.

**Events:** 0 semantic changes. The v4 restamp is measured exhaustively, not assumed.

**History, untouched:**

| Comparison | Envelope |
|---|---|
| G1-b (v2) | 353 / 320 / 337 / 0 |
| v3 counterfactual | 342 / 309 / 326 / 0 |
| G1 glyph v3 | domain 0; outside 1,119, all −15, 464 neutral→watch, 655 watch→avoid |

Counterfactual #3 (R2) is frozen separately: 337 / 304 / 321 / 0.

## Versions and Goldens

**Versions:**
- `xieji-vol10-jiesha-faithful-v4`, plus the rule identity `tho-vuong-dung-su-rule-v1`;
- `datasetVersion` 1.2.1, `p4-score-adapter-v1`, `canonical-v1`: unchanged.

**Goldens:**
- P4 Score Golden v4: unchanged.
- 卷十 Scoring Golden v5: builder-generated, each case carrying an explicit `soilState` and a real `date`, both verified.

Remote: no push, merge or deploy before review.
