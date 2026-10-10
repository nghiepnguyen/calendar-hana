# Thiên Đức / Thiên Đức Hợp vs 協紀 月表 (issue #19)

Status: **IMPLEMENTED — changes scores** (production, no flag). Date: 2026-10-10. Branch `audit/tianDe-yuebiao`.

## Problem

The cat-hung authority (`catHungAuthority.ts`, from 協紀 卷五) gives 天德 as a stem/branch in eight Month Jian rows and as a trigram (坤/乾/艮/巽) in the four 仲 rows (卯/午/酉/子). `computeAlmanac` replaced the legacy lunar-table Thiên Đức/Thiên Đức Hợp only in the eight direct rows; in the four trigram months it kept the legacy rows, which put Thiên Đức/Hợp on chosen branches/stems (and on a lunar-month basis), giving +15/+10 where the source has no 天德 day.

## Witness (`shared/almanac-data/golden-yuebiao-tiande.json`, frozen before the code)

欽定協紀辨方書 月表 卷二十–三十一, 四庫全書 子部 scan (浙江大學圖書館 copy, archive.org `06067692.cn` … `06067697.cn`), one page per day 甲子 → 癸亥, read by eye from the 吉神 column (pages cropped and tiled with ffmpeg):

| Month (Jian) | 天德 days | 天德合 days | Pages read |
|---|---|---|---|
| 正月 寅 | stem 丁 | stem 壬 | all 60 |
| 二月 卯 (坤) | **none** | **none** | all 60 |
| 三月 辰 | 壬 | 丁 | all 60 |
| 四月 巳 | 辛 | 丙 | all 60 |
| 五月 午 (乾) | **none** | **none** | all 60 |
| 六月 未 | 甲 | 己 | 36 |
| 七月 申 | 癸 | 戊 | 12 |
| 八月 酉 (艮) | **none** | **none** | all 60 |
| 九月 戌 | 丙 | 辛 | 12 |
| 十月 亥 | 乙 | 庚 | 12 |
| 十一月 子 (巽) | **none** | **none** | all 60 |
| 十二月 丑 | 庚 | 乙 | 12 |

The eight stem months agree with the authority table; the four trigram months list 天德/天德合 on no day (month header only: 天德在坤…).

## Change

- `almanac.ts`: Thiên Đức/Thiên Đức Hợp always come from the authority (none on trigram months). The old behaviour is kept behind `tianDeLegacyPolicy.KEEP_LEGACY_TRIGRAM_TIAN_DE` (false), mocked to `true` only by migration tests.
- `xiejiConditionalMigration.test.ts`: both sides mock the legacy behaviour, so the frozen decision baseline still reproduces 1095/1095 and the 1.2.1 warehouse proof stays isolated.
- Fixtures: `almanac.test.ts` (2026-09-25, 酉 month 壬寅 — 月表 八月 壬寅 page has no 天德), `AlmanacPanel.test.tsx` and two e2e specs now use the Giải Thần chip on that date; `xiejiDiagnostics.test.ts` drops the legacy exemption.

## Migration proof (`tianDeYuebiao.test.ts`, 1095 baseline days 2025–2027)

- Every day matches the witness (Thiên Đức iff day stem = month's 天德 stem; same for 合).
- Days outside trigram months: activity recommendations identical.
- Trigram months: 62 days lose a legacy row (34 Thiên Đức, 28 Thiên Đức Hợp); stars otherwise identical; all other contribution rows identical except other good-god rows rising within their weight as the good-god cap (25) frees up (226 rows).
- Activities: 914 score changes; recommended → no_evidence 156, watch → avoid 87, recommended → neutral 33.
- Events (× 11, hour 9): 284 score changes; recommended → insufficient_evidence 31 (Thiên Đức was the only applied rule for the primary activity). Classification `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.

## Not changed

`catHungAuthority` raw tokens (still 坤/乾/艮/巽, never coerced to a day); `xiejiVol10Scoring` stays off; other legacy lunar-month stars.
