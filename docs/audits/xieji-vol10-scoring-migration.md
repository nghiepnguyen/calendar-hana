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
- **Owner decision 2026-10-10 — 不註 reads as neutral**: when 卷十 (not_avoided / no_annotation) lifts every applied row of an activity, its status is `neutral` (base score) instead of `no_evidence`, and the event criterion `event_fit` passes with a 不註宜忌 reason instead of `unknown`. Thresholds otherwise unchanged.
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

Activity status moves (largest, after the neutral decision): watch → recommended 1,045; watch → neutral 877; no_evidence → avoid 834; avoid → neutral 191; recommended → watch 133; watch → strong_avoid 133. No activity moves to `no_evidence`.

Events (1095 days × 11 events, hour 9): 1,639 scores change. Classification moves (after the neutral decision): not_recommended → recommended 244; not_recommended → caution 172; insufficient_evidence → not_recommended 126; caution → recommended 112; insufficient_evidence → caution 59; recommended → caution 19; recommended → not_recommended 7. No event moves to `insufficient_evidence`.

Spot check: 2025-01-21 (庚寅, Month Jian 丑, 除日, 天德/月德 庚, 刼煞): wedding 65 → 87.5, not_recommended → recommended — 卷十 刼煞 “辰戌丑未月值除日…與天德月德…併止忌安撫邊境選將訓兵出師求醫療病餘皆不忌”.

## Re-measure 2026-10-10 (after PR #21 and PR #23)

Branch `audit/xieji-vol10-remeasure`, on top of PR #21 (legacy trigram Thiên Đức removed) and PR #23 (no taboo reads as neutral up to high severity). `REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts`, same 1095 days, flag mocked on. The figures above are the PR #18 measurement and stay as history.

- **Rows: identical** to the table above (changed no_annotation 1,538; not_avoided 1,395; avoid 181; added −25 1,205). 7,628 rows tagged unchanged.
- Rows by activity (changed + added; the report now prints them): 191 livestock, 191 finance, 190 travel, 182 each opening/moving/meeting/business/bed_installation, … 137 warehouse, 49 contract, 49 transaction.
- Activity status moves: watch → recommended 1,045; watch → neutral 877; no_evidence → avoid **842** (was 834); avoid → neutral 191; watch → strong_avoid 133; recommended → watch 123; watch → avoid 100; neutral → watch 95; avoid → watch 74; recommended → avoid 41; neutral → avoid 33; strong_avoid → watch 10.
- Events (1095 × 11, hour 9): **1,662** scores change (was 1,639). Classification: not_recommended → recommended 244; not_recommended → caution 172; caution → recommended 112; caution → not_recommended 77; insufficient_evidence → not_recommended **49** (was 126); recommended → caution 19; recommended → not_recommended 7. insufficient_evidence → caution (was 59) is gone: PR #23 already reads those days as neutral.
- Activity ↔ 用事 mapping reviewed: `docs/audits/xieji-activity-mapping-review.md`. 26/28 reviewed; **warehouse (137 rows) and business (182 rows) pending** — owner decision before the flag goes on.

## Re-measure after PR #25–#29 (2026-10-10)

Base: `43d6303` (PR #30 handoff; production code through PR #29). Flag remains **false**. This is release-readiness evidence, not approval to enable or deploy.

Command (run this test alone: other migration tests also write `REPORT_FILE`):

```sh
REPORT_FILE=/tmp/xieji-vol10-post-pr29.tsv npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
```

Full counters: [xieji-vol10-post-pr29.tsv](xieji-vol10-post-pr29.tsv). One first chronological witness per event-type transition, with all deciding items: [xieji-vol10-post-pr29-samples.json](xieji-vol10-post-pr29-samples.json). These are observed migration outputs, not independent Golden fixtures.

Coverage: 1,095 dates (2025–2027), 32 activities, 11 event types at hour 9. Both sides use the current catalog/policies; only the mocked flag differs. Assertions prove that original contribution keys survive, every changed/added row has an acted verdict from a scored chain, unrelated rows remain equal, existing hard-warning bits survive, applied hard warnings retain the stricter score status, and event diagnostics contain no `undetermined` items. The historical 1.2.1 baseline remains a separate proof.

| Metric | After #21/#23 | After #25–#29 |
|---|---:|---:|
| Changed rows: no_annotation | 1,538 | 1,622 |
| Changed rows: not_avoided | 1,395 | 1,482 |
| Changed rows: avoid | 181 | 181 |
| Added penalty rows | 1,205 | 1,205 |
| Tagged unchanged rows | 7,628 | 8,043 |
| Event scores changed | 1,662 | 1,662 |
| not_recommended → recommended | 244 | 231 |
| not_recommended → caution | 172 | 157 |
| caution → recommended | 112 | 112 |
| caution → not_recommended | 77 | 77 |
| insufficient_evidence → not_recommended | 49 | 49 |
| recommended → caution | 19 | 19 |
| recommended → not_recommended | 7 | 7 |

3,968 activity scores and 652 event classifications change. No event moves into `insufficient_evidence`. Changed/added rows: warehouse 137, warehouse_opening 171, business 182. All newer 百忌日 and 土王用事 contributions remain unchanged. This does not certify their unresolved source conventions.

Representative review cases:

- 2025-01-21 wedding: 65 / not_recommended → 87.5 / recommended (刼煞 止忌 with 天德/月德).
- 2025-02-11 groundbreaking: 27.5 / not_recommended → 72.5 / recommended; the 土王用事 contribution-preservation check applies across all dates.
- 2025-02-13 buy_property: null / insufficient_evidence → 12.5 / not_recommended.
- 2025-03-11 move_house: 65 / recommended → 32.5 / not_recommended.
- 2025-11-14 open_business: 68 / recommended → 23 / not_recommended.

Readiness validation so far: typecheck, lint, 155 files / 2,903 tests passed; serial annual-direction mutation 7/7 and mansion-content mutation 9/9 killed. Graph updated AST-only. The mocked-ON migration passes, while the full suite/build use the current OFF manifest. Build and E2E passed: desktop 104/16 skipped, mobile (Pixel 7 Chromium) 119/1 skipped, desktop Safari/WebKit 88/32 skipped; total 311 passed / 49 skipped. iPhone/Firefox were not run. The first E2E attempt was discarded because mutation overlapped its build; the recorded run rebuilt after both serial mutation runners finished. No emulator run: no Auth/Firestore/backend change in this PR.

Before enabling, review these changes together with the 39-case independent Golden. Keep warehouse conditional co-presence, the unencoded 開倉庫出貨財 exception in 卷十 鋪註條例, general 吉凶 balancing rules, dormant/legacy gods, and mansion scoring outside this release. Their absence is an existing scope limitation, not resolved by this proof.

Activation proposal: change only `shared/almanac-data/manifest.json` policy `xiejiVol10Scoring` from false to true in a separate release commit after owner decision. Pin historical OFF comparisons explicitly before rerunning all gates; do not change independent Golden to fit new production outputs. Then run local typecheck/lint/full tests, serial mutation gates, build and device E2E against the enabled build. Smoke wedding 2025-01-21, a 卯月 月破 day and a 子月 月厭 day. Rollback: restore the flag to false, rebuild and redeploy. No activation or deployment is included in this readiness change.

## Observations for the owner before turning it on

- ~~不註 → no_evidence~~ — owner chose **neutral** (2026-10-10); implemented above.
- The added −25 (`no_evidence → avoid` 834) comes mostly from 諸事皆忌 days the product never penalised (月煞 on 閉日/平日, 月建 小會/陰位, 月破 卯酉, 月厭 子午 without 天赦).
- ~~Legacy Thiên Đức/Thiên Đức Hợp on 坤/乾/艮/巽 months~~ — removed per 月表 in PR #21 ([issue #19](https://github.com/nghiepnguyen/calendar-hana/issues/19)).
- Activity ↔ 用事 mapping: **29/29 reviewed** after PR #24/#25. The pending warehouse/business note in the earlier re-measure is historical.

## Release

Flag stays `false` (owner, 2026-10-10: not yet). Turning it on is a one-line manifest change plus deploy; rollback is the same line. Smoke dates for a release: 2025-01-21 (wedding), a 卯月 月破 day, a 子月 月厭 day.
