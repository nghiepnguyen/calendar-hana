# P5 warehouse baseline v1 (task 1.0)

Status: BASELINE_INVENTORY — inventory only. No R10 / R11 / D verdict is computed here. Expected values come from the task 3 Golden, not from these files.

- Starting commit `067be0541b92bb612640ebbb17d9b79cdcebb3e5`, tree `96f562d10a81bce7727d477a2804d154370fac30` (branch `codex/p5-warehouse`, base `origin/main` `1c4bb32`).
- Generator: [`shared/lunar/p4WarehouseBaseline.test.ts`](../../../../../shared/lunar/p4WarehouseBaseline.test.ts). Ordinary runs verify bytes; `P5_BASELINE_WRITE=1` regenerates.
- Inputs: the P4-C sweep inputs (1.095 dates in `mansion-decision-baseline-v1.json`, lunar day, `getP4MoonPhase`, `getP4SoilPresence`, `getP4MuCangSoil`) through `resolveP4YiDay`. P4-C sweep TSV SHA-256 `d46c19a7…` (recorded in `summary.json`).
- [`baseline.tsv`](baseline.tsv): one row per date, the presence of the 17 warehouse gods, P4-C state of 修倉庫, and the 開倉庫出貨財 heading (宜, pre/final state, 忌, protected, propagation). [`summary.json`](summary.json): counts.

## 1.1 — 修倉庫 rows

- 539 rows `P5_WAREHOUSE` (P4-C `undetermined`). Base/partner combinations are in `summary.json` → `xiuCangKu.deferredBasePartnerCombos`.
- 362 of the 539 have a direct god present (天德, 月德, 天德合, 月德合, 天赦, 天願, 三合, 滿日). 177 have none; 101 of those have at least one base (收日, 母倉, 六合, 五富, 天倉).
- **Finding (scope):** `composeP4YiEvidence` returns `yi: undefined` for 修倉庫 on **all 1.095 dates**, not only the 539. The other 556 rows already have a determined state from 忌 (only_ji 517, neither_recorded 36, not_recorded 3). 158 of them have a direct god present, so their 宜 also changes once P5 lands (for example only_ji → both_present). The P5 sweep and acceptance must cover all 1.095 修倉庫 rows, not just the 539.

## 1.2 — Operand inventory

All 17 gods are known (present or absent) on all 1.095 dates; 0 unknown, so 1.2 does not stop for an owner decision. Provenance by trace source:

| Gods | Lookup | Authority |
|---|---|---|
| 天德, 月德, 天德合, 月德合 | `getSourceLockedCatHungStars` | Phase 4D, Month Jian (CLOSED & DEPLOYED) |
| 天赦, 天願, 月恩, 四相 | `getVol10VirtuesPresent` | 卷五 義例三 (`xiejiVirtues.ts`) |
| 三合, 六合, 五富, 天倉, 時德 | `getXiejiGodPresence` | P3a `xieji-god-definitions.json` (天倉 歴例曰 正月起寅逆行; 時德 by season) |
| 滿日, 收日, 開日 | 12 Trực | Month Jian / 12 Trực (CLOSED) |
| 母倉 | `p4yi:` P4-C provider | `p4-yi-operands-v1`, OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027 |

月恩 is a 卷十 partner only. 卷十一 修倉庫 does not list it, so its presence is read from the 開倉庫出貨財 trace; where both traces carry a god the test asserts they agree.

Pre-check, not the 2.4 proof: on the 1.095 dates, 收日+開日 = 0 and 天倉+時德 = 0.

## 1.3 — Undetermined rows outside P5

103 rows, all bucket `OTHER_STATE_WITH_KNOWN_YI`, unchanged from the P4-C report (yi-sweep-v1 “OTHER 83 → 103”). 24 of them are on 開倉庫出貨財 (宜 false, 忌 true, state undetermined before and after propagation): 2025-03-18 卯丙戌, 2025-03-30 卯戊戌, 2025-04-06 辰乙巳, 2025-04-30 辰己巳, 2025-09-20 酉壬辰, 2025-10-21 戌癸亥, 2025-11-02 戌乙亥, 2026-03-13, 2026-03-25, 2026-04-25, 2026-09-15, 2026-10-16, 2026-10-28, 2027-03-08, 2027-03-20, 2027-04-01 卯庚戌, 2027-04-20, 2027-05-02 辰辛巳, 2027-08-07 未戊午, 2027-09-10, 2027-10-04 酉丙辰, 2027-10-11, 2027-10-23, 2027-11-04 戌丁亥 (full list in the P4-C TSV). None is a 修倉庫 row; P5's co-presence predicate does not touch them. Their cause (an open 忌 scope) goes into task 5.2.

## 1.4 — 開倉庫出貨財 baseline

- Final state over 1.095 dates: only_ji 621, not_recorded 162, only_yi 159, both_present 76, neither_recorded 53, undetermined 24.
- 甲日: 110 dates. 106 keep a protected 忌 (百忌日 專忌). The other 4 are `not_recorded`: 2025-03-06 卯甲戌, 2025-07-24 / 2026-07-19 / 2027-07-14 未甲午. All four are `puzhu:28` 「…德合與赦願所㑹之辰諸事不忌」 days (卯甲戌, and 未甲午 by the owner print correction 2026-10-12). Explained by an owner-adopted override, not a regression. Task 5.2 still checks that this precedence over 專忌 is what the owner intended.

## Limits

Single-agent baseline (Claude); no second reviewer. Counts come from the audit composer, so they are inventory for planning, never expected values.
