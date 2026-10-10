# 協紀 卷十 宜忌 — resolution rules for six source-locked 凶 (diagnostics only)

Status: **IMPLEMENTED AS DIAGNOSTICS — no score, status or verdict change**
Date: 2026-10-10. Branch `audit/xieji-vol10-resolution` (stacked on `audit/xieji-diagnostics`, PR #15).
Owner decisions: diagnostics first; first slice = the six 凶 whose presence is source-locked.

## Source

Wikisource 欽定協紀辨方書 (四庫全書本) 卷10, raw wikitext (`action=raw`, SHA-1 prefix `355dc6c8fe2d`), read directly. 卷十 opens by rejecting the old practice: “凡吉神所宜之事一遇凶煞則無論輕重而概忌之，尤為未當” — each 凶 is resolved by its nature and strength against the 吉神 present.

## Transcribed entries (`shared/almanac-data/xiejibianfangshu-vol10-yiji.json`)

| Entry | Production presence | Rule shape |
|---|---|---|
| 月建 (小時, 土府) | Trực Kiến | base 忌 + 土府 忌; with 德合/天赦/月恩/四相 → 止忌 earthwork list; 子午 → 從月厭, 辰午酉亥 → 從月刑; 未月己未 陽錯 ignores 德; 陰陽小會 / 陰位 pillars → 諸事皆忌 |
| 月破 (大耗) | Nguyệt Phá (= Trực Phá) | with 德合 → 猶忌, only minor matters spared; 子午未申 → stricter (needs 月德/天德合/月德合, else 諸事皆忌); 卯酉 → 諸事皆忌; 陰陽交破 / 陽破陰衝 pillars |
| 平日 (死神) | Trực Bình | 亥 → 止忌 military/medical; 申 → same only with 天德/月德合; 卯酉 with 月德, 午 with 月德合 → no annotation; 寅巳子 → 從月刑; 辰戌丑未 → 從月煞 |
| 收日 | Trực Thu | 寅申巳亥 → 從刼煞 (encoded); 卯丑戌 → 從月刑; 子午 with 月德合, 酉 with 月德 → no annotation; 辰未 with 德合 → 止忌 military/medical |
| 閉日 (血支) | Trực Bế | 子午卯酉辰戌丑未 with 德合/赦願 → no annotation; 寅申巳亥 → 從月煞 |
| 刼煞 | Kiếp Sát | 寅申 → 止忌 military/medical; 巳亥 → same with 月德/天德合; 辰戌丑未 → with 德合 止忌…, without → no annotation; 子午卯酉 with 月德/月德合 → no annotation |

Each entry keeps the exact source lines; clause quotes are checked against them. Heading lists are split with a 用事 vocabulary from 卷十一 plus four documented aliases (補垣→補垣塞穴, 宣布政事→宣政事+布政事, 求醫療目→療目, 補捉→捕捉). One textual reading recorded: 刼煞 “己亥月” is read as 巳亥.

## Algorithm (`shared/lunar/xiejiVol10Resolution.ts`)

For each present entry and event activity (activity → 用事 headings from 卷十一 `activityEntries`):

1. All-taboo pillar for the month → `avoid`.
2. First clause matching the Month Jian branch; `defer` resolves the target only if it is one of the six (收日 → 刼煞), otherwise `undetermined`.
3. Virtue condition: true if any of the four source-locked 德/合 gods is present; `undetermined` if the clause names any other virtue (天赦, 天願, 月恩, 四相, 時德, 六合 — presence not source-locked) or 天德/天德合 on a trigram-token month; else false. 陽錯 pillar forces false.
4. Effects: `as_usual` (base ∪ extra), `only_avoid`, `still_avoid` (minus spared list), `cancel_both` (no 宜 and no 忌), `avoid_all`.
5. Verdict per activity: `avoid` / `not_avoided` / `no_annotation` / `not_listed` / `undetermined`.

`evaluateEventDay().classicalResolution` lists these with `productDelta` (applied score of the product rules standing for the same 凶: its Trực; 月破 also Nguyệt Phá; after a deferral also the target's sources) and `diverges`.

## What it shows (2025–2027, 11 events, hour 9)

10,920 items: 2,691 avoid, 738 not_avoided, 637 no_annotation, 2,314 not_listed, 4,540 undetermined. **1,707 diverge** from the product score, e.g.:

- 刼煞 in 寅申 months: 卷十 keeps only military/medical taboo; the product subtracts for wedding, construction, opening, travel… (351 not_avoided, 403 no_annotation in 辰戌丑未 months without 德).
- 收日 in 寅申 months (從刼煞): same pattern (207).
- 閉日 / 平日 with 德 or 相日: 卷十 annotates nothing or only military/medical; the product subtracts (126 + 252).
- 月建 / 月破 all-taboo pillars (陰陽小會, 陰位, 陰陽交破, 陽破陰衝): 卷十 avoids everything; the product has no rule (299).
- 吉凶相抵: e.g. Thu +15 and Kiếp Sát −15 net 0 for 納財 where 卷十 concludes avoid.

## Limits

- Diagnostics only; scores, caps and verdicts unchanged (frozen-baseline proof still 1095/1095). Applying 卷十 to scores needs a separate decision and migration proof.
- 4,540 undetermined: deferrals to 月厭/月刑/月煞 (never fire) and clauses needing 天赦/月恩/四相/時德/六合 presence.
- 卷十 general rules (lines “凡吉足勝凶從宜不從忌…”, “凡吉凶相抵不註宜亦不註忌…”) and the per-god 宜 sections are not encoded.
- Activity ↔ heading mapping remains `interpretation_pending`.

## Tests

`xiejiVol10Resolution.test.ts`: transcription integrity (every list splits completely; quotes and lists appear in source lines), 18 hand-derived verdicts from the quoted sentences, event integration (items exist, divergences reported).
