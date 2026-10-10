# Plan: apply 協紀 卷十 resolution to scores (not started)

Status: **PLAN — needs an owner decision before implementation**
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

1. Presence audit for 月厭, 月刑, 月煞, 災煞 (never fire today; 30% of undetermined items defer to them) — source-lock each 協紀 definition (Month Jian + day operand), independent golden, then transcribe their 卷十 entries.
2. Presence audit for 天赦, 天願, 月恩, 四相, 時德, 六合 (virtue conditions).
3. Normalize 天德 trigram tokens (坤/乾/艮/巽) with an independent authority.
4. Encode 卷十 general rules (“凡吉足勝凶從宜不從忌…”, “凡吉凶相抵不註宜亦不註忌…”) and per-god 宜 sections.

## Not in scope

Personal feng-shui rules, 28 Tú scoring (stays informational, scoreDelta 0), astronomy.
