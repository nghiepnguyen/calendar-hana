# 協紀 卷十 scoring — golden and migration proof (flag off by default)

Status: **IMPLEMENTED BEHIND `manifest.policies.xiejiVol10Scoring` = false — production scores unchanged**
Date: 2026-10-10. Branch `audit/xieji-monthly-sha-presence` (PR #18). Policy: `docs/plans/xieji-vol10-scoring.md` (owner decisions 2026-10-10).

## Implementation

- `shared/lunar/xiejiVol10Scoring.ts` — `applyVol10Scoring(rows, items, {activityId, scope, badGodCap})`, pure. Only applied rows of a scored 凶 chain (`VOL10_PRODUCT_SOURCES`: 月建 Kiến, 月破 Phá + Nguyệt Phá, 平日 Bình, 收日 Thu, 閉日 Bế, 刼煞 Kiếp Sát; after 從X論 also the deciding entry's sources) change:
  - `avoid`: negative kept, positive turned into the same-magnitude negative; if no row of the chain is negative, one row `xieji10:<deciding entry>:<activity>` of −25 is added (Trực source when the chain has a Trực, else bad_god inside its cap).
  - `not_avoided`: negative → 0, `informational`.
  - `no_annotation`: any non-zero → 0, `informational`.
  - `not_listed` / `undetermined`: unchanged. Rows disagreeing between chains take the stricter verdict.
  - Each touched row carries `classical {version, entry, verdict, via, quote}` and a “Theo 協紀 卷十 …” phrase; `rawDelta` keeps the product weight.
- `getActivityRecommendations` applies it after building contributions, before status, when the flag (or the `xiejiVol10Scoring` input override) is on and `classicalDay` is given; `computeAlmanac` now passes `classicalDay`. Status/classification thresholds unchanged.
- `eventEvaluation` reuses `isVol10ChainRow` for `productDelta` (same rows as before, plus added `xieji10:` rows).

## Golden (`shared/almanac-data/golden-xieji-vol10-scoring.json`)

39 cases, hand-derived from the 卷十 sentences and the product weights, frozen in commit `a045f3a` before the code. Each is a real day (officer follows from Month Jian and day branch). Coverage: 止忌 (刼煞 寅/辰, 月建 德, 平日 亥), 猶忌 (月破 德), 不註 (刼煞 辰 no 德, 平日 卯 月德, 收日 子 月德合, 閉日 子/未 天願), 從刼煞 / 從月刑 / 從月煞 / 從月厭, all-taboo pillars (月建 己卯 小會, 月破 卯), 陽錯 (月建 己未), 天赦 (月建 子 甲子), positive → negative, added −25, weight-0 row, `not_listed` kept (incl. 收日's own 宜 納財 under 不註).

One correction after the first run (commit after `a045f3a`): `jie-yin-finance` expected 收日 `not_avoided`; 納財 is in 收日 止不忌, so `not_listed` — my derivation error (`GOLDEN_BUG`), consistent with two sibling cases; expected score rows unchanged.

Extra mechanics (`xiejiVol10Scoring.test.ts`): stricter verdict wins on a shared row; god-only chain penalty inside the bad-god cap; new entries get no rows.

## Migration proof (`xiejiVol10ScoringMigration.test.ts`)

Flag off is production: the frozen decision baseline still reproduces 1095/1095 (`xiejiConditionalMigration.test.ts`). With the flag on (manifest mocked), for the 1095 baseline days (2025–2027) every changed or added row carries exactly one deciding item of a scored entry with verdict avoid / not_avoided / no_annotation, nothing disappears, and no event has an `undetermined` item. Classification: `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.

Rows (activity level, 1095 days × all activities):

| Change | Rows |
|---|---|
| changed, no_annotation (刼煞 682, 平日 180, 平日→月刑 280, 閉日 240, 收日→月刑 128, 月建→月刑 28) | 1,538 |
| changed, not_avoided (收日→刼煞 540, 刼煞 297, 平日 228, 月建 160, 平日→月刑 95, 收日 75) | 1,395 |
| changed, avoid (positive → negative: 月破 80, 收日→月刑 38, 收日→刼煞 22, 月建 18, 月建→月厭 12, 月建→月刑 11) | 181 |
| added −25 (閉日→月煞 402, 月建 234, 平日→月煞 168, 月破 160, 月建→月厭 138, 收日→月刑 60, 平日→月刑 22, 月建→月刑 21) | 1,205 |

Activity status moves (largest): watch → recommended 1,045; no_evidence → avoid 834; watch → no_evidence 613; watch → neutral 264; avoid → no_evidence 191; recommended → watch 133; watch → strong_avoid 133.

Events (1095 days × 11 events, hour 9): 1,639 scores change. Classification moves: not_recommended → recommended 244; not_recommended → insufficient_evidence 156; insufficient_evidence → not_recommended 126; caution → recommended 112; insufficient_evidence → caution 59; recommended → caution 19; caution → insufficient_evidence 18; not_recommended → caution 16; recommended → not_recommended 7.

Spot check: 2025-01-21 (庚寅, Month Jian 丑, 除日, 天德/月德 庚, 刼煞): wedding 65 → 87.5, not_recommended → recommended — 卷十 刼煞 “辰戌丑未月值除日…與天德月德…併止忌安撫邊境選將訓兵出師求醫療病餘皆不忌”.

## Observations for the owner before turning it on

- When every applied row of an activity is dropped by `not_avoided`/`no_annotation`, the activity becomes `no_evidence` (613 + 191 moves) and some events become `insufficient_evidence` (156 + 18). This follows the unchanged thresholds; whether 不註宜忌 should read as “neutral” rather than “no evidence” is a separate decision.
- The added −25 (`no_evidence → avoid` 834) comes mostly from 諸事皆忌 days the product never penalised (月煞 on 閉日/平日, 月建 小會/陰位, 月破 卯酉, 月厭 子午 without 天赦).
- Legacy Thiên Đức/Thiên Đức Hợp stars stay in scoring on 坤/乾/艮/巽 months (almanac keeps the lunar-table rows there), although the 月表 shows no 天德 day in those months — follow-up, not changed here.
- Activity ↔ 用事 mapping remains `interpretation_pending` (e.g. travel ↔ 行幸遣使).

## Release

Flag stays `false`. Turning it on is a one-line manifest change plus deploy; rollback is the same line. Smoke dates for a release: 2025-01-21 (wedding), a 卯月 月破 day, a 子月 月厭 day.
