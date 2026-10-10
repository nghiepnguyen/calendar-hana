# 卷十 百忌日: 寅日 祭祀, 酉日 宴會, 申日 安牀, 未日 求醫療病

Status: **IMPLEMENTED — changes activity scores, no event changes** (owner decision 2026-10-10, P1). Branch `feature/baiji-dayzhi-activities`. Same mechanism as [baiji-giap-at.md](baiji-giap-at.md) (PR #26), keyed on the day branch instead of the stem.

## Source

- 欽定協紀辨方書 卷十 百忌日 (Wikisource raw, SHA-1 prefix `355dc6c8fe2d`, same file as PR #26): 「甲日忌開倉庫出貨財乙日忌栽種丁日忌剃頭庚日忌經絡辛日忌醖釀壬日忌開渠丑日忌冠帶寅日忌祭祀夘日忌穿井巳日忌出行午日忌苫葢未日忌求醫療病申日忌安牀酉日忌宴㑹亥日忌嫁娶以上所忌」.
- 卷十一 (`ce4ed7f23ff9`) confirms each day in exactly one 忌 list among the catalog's mapped headings:

| Heading | 卷十一 忌 (tail) | Activity |
|---|---|---|
| 祭祀 | 天狗寅日 | `worship` |
| 宴會 (㑹親友同) | …四廢五離酉日 | `meeting` |
| 安牀 | …四廢五墓申日 | `bed_installation` |
| 求醫療病 | …往亡未日每月十五日朔望日 | `medical` |

申日 also appears in 伐木 宜 (立冬後立春前危日午日申日), which is a 宜 list for an unmapped heading; the parity test (`datasetValidation.test.ts`) derives each god's activity list from its `han` and agrees.

## Rule

| God | Rule | Activity | Tier | Override |
|---|---|---|---|---|
| `bach_ky_dan` Ngày Dần (Bách Kỵ) | `dayChi: [2]` | `worship` | medium (−10, bad-god cap) | `dan_day_blocks_worship` (preserve_bad → hard warning) |
| `bach_ky_dau` Ngày Dậu (Bách Kỵ) | `dayChi: [9]` | `meeting` | medium | `dau_day_blocks_meeting` |
| `bach_ky_than` Ngày Thân (Bách Kỵ) | `dayChi: [8]` | `bed_installation` | medium | `than_day_blocks_bed_installation` |
| `bach_ky_mui` Ngày Mùi (Bách Kỵ) | `dayChi: [7]` | `medical` | medium | `mui_day_blocks_medical` |

IDs use `bach_ky_<branch>` because `dan_nhat` is already 民日 in the good-god catalog. With a hard warning the activity is never `recommended`: `consider`, or `avoid`/`strong_avoid` when the score is ≤ 29 / ≤ 19. None of the four activities belongs to an event profile, so no event changes.

## Golden (`shared/almanac-data/golden-baiji-dayzhi.json`)

Frozen in commit `9b3900d` before any code. 92 cases on 23 dates (5 each of 寅/酉/申/未 days, 3 子 control days, 2025–2027). Day branches come from date arithmetic from 2000-01-07 = 甲子, not from the engine. On a matching day the target activity carries its god with a hard warning and status = stricter of `consider` and the score status; the other three activities do not carry it.

## Migration proof (`shared/lunar/baijiDayZhi.test.ts`, 1095 days 2025–2027, 卷十 ON)

Only the four target activities gain one row each; every other row and activity is identical; **no event changes** (11 events, hour 9).

| Activity | Days | Status changes |
|---|---:|---|
| `worship` | 91 | recommended → consider 47, no_evidence → consider 36, neutral → consider 3, watch → avoid 3, avoid → strong_avoid 2 |
| `meeting` | 91 | recommended → consider 40, watch → avoid 16, neutral → consider 13, watch → consider 9, no_evidence → consider 6, avoid → strong_avoid 4 |
| `bed_installation` | 92 | no_evidence → consider 39, neutral → consider 21, avoid → strong_avoid 13, watch → avoid 11, recommended → consider 8 |
| `medical` | 92 | recommended → consider 34, watch → avoid 27, no_evidence → consider 16, watch → consider 8, avoid → strong_avoid 4, neutral → consider 3 |

The 1.2.1 frozen baseline (`xiejiConditionalMigration.test.ts`) pins the catalog without these four rules on both sides and still reproduces 1095/1095.

## Not encoded

- 卷十 鋪註條例 「凡天狗寅日忌祭祀不註宜求福祈嗣」 and 「凡酉日忌宴㑹亦不註宜慶賜賞賀」 suppress 宜 marking for other headings (祈福/求嗣 → `pray_blessing`/`pray_children`; 慶賜賞賀 has no activity). `preserve_bad` only acts on activities the god lists, so encoding them needs an engine change; left for an owner decision.
- 天狗 (the other 祭祀 taboo) is not in the catalog.
- 巳日 出行 and 亥日 嫁娶 affect events (Xuất hành, Cưới hỏi) and are tracked as P2.
