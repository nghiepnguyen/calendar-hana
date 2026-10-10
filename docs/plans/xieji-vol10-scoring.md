# Plan: apply 協紀 卷十 resolution to scores (not started)

Status: **IMPLEMENTED behind `xiejiVol10Scoring` = false (2026-10-10)** — golden + migration proof in `docs/audits/xieji-vol10-scoring-migration.md`; turning the flag on is a separate owner decision.
Written: 2026-10-10, after PR #16 (卷十 diagnostics for six locked 凶) was merged and deployed.
Related: `docs/audits/xieji-vol10-resolution.md`, `docs/audits/truc-than-context-audit.md`, handoff §23.

## Why

Today scores come from 卷十一 per-activity lists with product weights and caps: a 凶 present on a day subtracts for every activity it lists, whatever 吉神 is also present. 卷十 rejects that practice (“凡吉神所宜之事一遇凶煞則無論輕重而概忌之，尤為未當”) and resolves each 凶 by month, by co-present 德/合/赦/願 and by special day pillars. Diagnostics (`evaluateEventDay().classicalResolution`) show 1,707 of 10,920 event-activity items in 2025–2027 where the product disagrees.

## Decisions the owner must make first

1. **Target behaviour per verdict** — proposed mapping for the contribution of that 凶's product rule (its Trực; 月破 also Nguyệt Phá; 刼煞 = Kiếp Sát):

   | 卷十 verdict | Proposed effect on that rule's score |
   |---|---|
   | `avoid` | keep the negative weight; if the product had none (all-taboo pillar), add one (weight to decide) |
   | `not_avoided` | drop the negative (scoreDelta 0, keep as informational with the 卷十 quote) |
   | `no_annotation` | drop both the negative and any positive from the same 凶 for that activity |
   | `not_listed` | unchanged |
   | `undetermined` | **unchanged** (never guess) |

2. **Weights** for newly added taboos (all-taboo pillars) and whether `hardWarning` applies.
3. **Scope** — start with the six locked 凶 only (recommended), or wait for more entries.
4. **Release** — one switch (`manifest.policies.xiejiVol10Scoring`, default false) so the change can be turned on/off and rolled back.

## Owner decisions — 2026-10-10 (CHỐT)

Recorded before any code; golden and migration proof are deferred until `undetermined` is reduced further (天赦/天願/月恩/四相, 天德 trigram tokens), so they are built once.

1. **Verdict → effect** on the product rows that stand for the 凶 (its Trực row; 月破 also Nguyệt Phá; 刼煞 = Kiếp Sát; after 從X論 the target's rows too — the same `srcs` set `productDelta` uses):

   | 卷十 verdict | Negative product row | Positive product row |
   |---|---|---|
   | `avoid` | keep | turn into a negative of the same magnitude |
   | `not_avoided` | scoreDelta 0, `informational`, keep 卷十 quote | keep |
   | `no_annotation` | scoreDelta 0, `informational` | scoreDelta 0, `informational` |
   | `not_listed` | unchanged | unchanged |
   | `undetermined` | unchanged | unchanged |

2. **New penalty**: `avoid` (including 諸事皆忌) where no row of that 凶 chain is negative for the activity → add **−25**, no `hardWarning`.
3. **Scope**: the six scored 凶 (月建, 月破, 平日, 收日, 閉日, 刼煞) **with** their 從月煞/月刑/月厭/災煞/刼煞/月破 deferrals resolved. The four new entries (月厭/月刑/月煞/災煞) get **no rows of their own** (no product rule fires for them).
4. **Caps**: follow the source's existing cap — Trực rows uncapped; god rows (Kiếp Sát, Nguyệt Phá) inside bad_god `capPerActivity`.
5. **Release**: `manifest.policies.xiejiVol10Scoring`, default `false`; owner 2026-10-10: keep off for now.
6. **不註 reads as neutral** (owner, 2026-10-10): an activity whose every rule 卷十 lifts is `neutral`, not `no_evidence`.
7. **Thiên Đức legacy on 坤/乾/艮/巽 months**: separate audit of the whole 月表 ([issue #19](https://github.com/nghiepnguyen/calendar-hana/issues/19)), not in this change.

Operational readings of the above (agent; owner to confirm in review):

- “Same magnitude” uses the row's own weight (e.g. Kiến travel +15 → −15; Phá medical +25 → −25).
- The −25 row is added once per (day, activity, 凶 chain): as a Trực-source row `xieji10:<entry>:<activityId>` when the entry is a Trực (uncapped), as a bad_god row when it is 刼煞/月破 alone (capped). It is not added if any row of the chain is already negative.
- Several 凶 on one day resolve independently; each touches only its own chain's rows. If two chains share a row (e.g. 收日→刼煞 and 刼煞 itself both reach Kiếp Sát) the row gets one effect; if verdicts disagree, the stricter one (avoid > not_avoided > no_annotation) wins — flag such days in the migration report.
- Activities without 卷十一 headings produce no items and are unchanged.
- Status/classification thresholds unchanged.

## Implementation steps (when approved)

1. Add the policy flag (default `false`); with it off, behaviour is byte-identical (prove with the frozen-baseline test).
2. In `activityRecommendations`, after building contributions and before caps: for each present locked 凶, call `resolveVol10` for that activity and adjust only that 凶's own contributions per the table above. Keep the original delta in `rawDelta`, set `scoreDelta`, add the 卷十 quote and verdict to the row, never touch other sources.
3. Keep `undetermined` rows exactly as today.
4. Recompute status/classification with the existing code; no new thresholds in the same change.
5. UI: show “Theo 協紀 卷十: …” on adjusted rows (one line, source quote on demand).

## Proof required before merge

- **Independent golden**: hand-derive 30–50 (date, event, activity) cases from the 卷十 sentences (cover every clause type: 止忌, 猶忌, 不註, 從刼煞, all-taboo pillar, 陽錯, virtue unknown). Freeze before coding; never regenerate from production.
- **Migration proof**: like `xiejiConditionalMigration.test.ts` — with the flag off the frozen baseline reproduces 1095/1095; with it on, every changed score is explained by exactly one `classicalResolution` item of a locked 凶 (classify as `EXPECTED_AUTHORITY_MIGRATION_CHANGE`), and no change comes from an `undetermined` item.
- Report counts per entry/verdict and per event classification change (how many days move between recommended / caution / not_recommended).
- Local gates (Actions blocked by billing): typecheck, lint, `npm test`, mutation runners, build, Playwright desktop; then deploy hosting only with owner approval and smoke the most-affected dates.

## Work that reduces `undetermined` (can be done before or after)

1. ~~Presence audit for 月厭, 月刑, 月煞, 災煞~~ — done for diagnostics (`docs/audits/xieji-monthly-sha-presence.md`): undetermined of the six original entries 4,540 → 2,520; the four new entries add 7,320 items (1,220 undetermined). Scoring presence for them is still off.
2. ~~Presence audit for 天赦, 天願, 月恩, 四相~~ — done (same audit, part 2; 天願 per 卷五 按 起例).
3. ~~天德 trigram tokens~~ — resolved by the 月表 scan (no 天德 day in 子午卯酉 months; same audit, part 3). **Undetermined is now 0** for the encoded entries in 2025–2027, so the golden and migration proof can be built.
4. Encode 卷十 general rules (“凡吉足勝凶從宜不從忌…”, “凡吉凶相抵不註宜亦不註忌…”) and per-god 宜 sections.

## Not in scope

Personal feng-shui rules, 28 Tú scoring (stays informational, scoreDelta 0), astronomy.
