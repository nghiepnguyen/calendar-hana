# 百忌日 production coverage — P2 / R5

Date: 2026-10-11 (Vietnam). Test-only change; no runtime, catalog, manifest, or frozen Golden changes.

## Scope

`baijiTyHoi.test.ts` runs the unchanged frozen P2 Golden against the real current manifest. The historical migration was moved to `baijiTyHoiMigration.test.ts`, retaining `legacyGodsMonthJian: false` and every original migration assertion/count.

`baijiProductionInvariants.test.ts` imports the real manifest and requires `xiejiVol10Scoring`, `legacyGodsMonthJian`, and `hardWarningKeepsWorseScoreStatus` to be enabled. Historical Giáp/Ất and hard-warning Golden/migration tests remain pinned to their original policy combination.

The new suite enumerates every calendar date from 2025-01-01 through 2027-12-31 (1,095 dates). Expected stems/branches use independent UTC civil-date arithmetic anchored at 2000-01-07 = 甲子. The explicit nine-rule contract comes from 卷十 百忌日 and the reviewed mappings in `baiji-giap-at.md`, `baiji-dayzhi.md`, and `baiji-ty-hoi.md`; it is not generated from the production catalog.

For each rule, every date checks presence only on the matching stem/branch, exactly one applied bad-god contribution on the target activity, hard warning, and the policy status. Counts: 甲 110; 乙/丁 109 each; 未/申 92 each; 寅/酉/巳/亥 91 each. All other dates provide negative controls. Every activity with an applied hard warning is checked against the independent threshold contract (≤19 strong_avoid, 20–29 avoid, ≥30 consider); the corpus must exercise all three bands.

All 91 巳 and 91 亥 days are checked at event level both without an hour and with hour 9: travel is caution/not_recommended; wedding is not_recommended. This protects the approved contract without freezing incidental scores from a later scoring release.

## Executed mutation proof

Each mutation was applied temporarily, tested in a fresh Vitest process, and restored byte-for-byte in a `finally` block:

- Remove `giap_nhat` from bad-gods: fails on 2025-01-05 because the required contribution is absent.
- Disable `hardWarningKeepsWorseScoreStatus`: fails both the flag gate and behavior on 2025-01-04 `bach_ky_dau` (consider instead of avoid).

Both runners returned exit 1. The unmodified production suite passes (3 tests). Frozen Golden files are unchanged.

## Limits

This closes automated coverage gaps, not new source/mapping decisions. P1 prayer activities, unmapped activities, P4 balancing, and dormant gods remain outside scope. Hour coverage is none/9, not all 24 hours. No production behavior is changed.
