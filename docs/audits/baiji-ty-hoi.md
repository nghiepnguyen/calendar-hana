# 卷十 百忌日: 巳日 出行, 亥日 嫁娶

Status: **IMPLEMENTED — changes activity scores and two events** (owner decision 2026-10-10, P2: option (a), `travel` = user-facing Xuất hành). Branch `feature/baiji-ty-hoi`, PR #42. Same mechanism as [baiji-giap-at.md](baiji-giap-at.md) (PR #26) and [baiji-dayzhi.md](baiji-dayzhi.md) (PR #40).

## Source

- 欽定協紀辨方書 卷十 百忌日 (Wikisource raw, SHA-1 prefix `355dc6c8fe2d`): 「…巳日忌出行…亥日忌嫁娶以上所忌」.
- 卷十一 (`ce4ed7f23ff9`):
  - 行幸遣使 (注 「出行同」) 忌 「…天賊四廢五墓往亡巳日」 → `travel`.
  - 嫁娶 忌 「…往亡八專亥日」 → `wedding` (mapped to 結婚姻 + 嫁娶; 亥日 appears only under 嫁娶). 納采問名 (`engagement`) and 乘船渡水 (`water_travel`) do not list these days.

## Interpretation (owner, 2026-10-10)

`travel` maps 行幸遣使 through the note 「出行同」. 鋪註條例 「凡巳日忌出行不註宜出師遣使」 marks 出行 as taboo on 巳日 and only withholds 宜 from 出師遣使. The owner chose to read `travel` as the user-facing Xuất hành (出行), so the 巳日 taboo applies to it. 出師遣使 has no catalog activity; its 「不註宜」 is not encoded.

## Rule

| God | Rule | Activity | Tier | Override |
|---|---|---|---|---|
| `bach_ky_ty` Ngày Tỵ (Bách Kỵ) | `dayChi: [5]` | `travel` | medium (−10, bad-god cap) | `ty_day_blocks_travel` (preserve_bad → hard warning) |
| `bach_ky_hoi` Ngày Hợi (Bách Kỵ) | `dayChi: [11]` | `wedding` | medium | `hoi_day_blocks_wedding` |

## Event effect (existing event policy, unchanged)

- **Cưới hỏi** (`wedding`, very_high, mustHave `event_fit`): `event_fit` fails whenever the primary activity has a hard warning or any negative row, so **every 亥 day is not_recommended** for the wedding event — the same rule already applies to every other bad god of `wedding`.
- **Xuất hành** (`start_journey`, medium, no `event_fit`): the hard warning makes it `caution`; **no 巳 day is recommended**.
- `receive_vehicle` lists `travel` as a conditional supporting activity; its score does not change.
- Measured with and without the hard warning: event conclusions are identical; only the activity status differs (consider vs watch).

## Golden (`shared/almanac-data/golden-baiji-ty-hoi.json`)

Frozen in commit `b2e330c` before any code. 26 cases on 13 dates (5 巳, 5 亥, 3 子 control days, 2025–2027); day branches from date arithmetic (2000-01-07 = 甲子). Matching days: the activity carries the god with a hard warning, status = stricter of `consider` and the score status; wedding event `not_recommended`; start_journey event `not_recommended` or `caution`.

## Migration proof (`shared/lunar/baijiTyHoi.test.ts`, 1095 days 2025–2027, 卷十 ON)

Only `travel` and `wedding` gain one row each, only on 巳 / 亥 days; every other row and activity is identical; only `start_journey` (巳 days) and `wedding` (亥 days) events change.

| | Days | Changes |
|---|---:|---|
| `travel` activity | 91 | recommended → consider 46, no_evidence → consider 14, watch → avoid 13, avoid → strong_avoid 8, neutral → consider 6, watch → consider 4 |
| `wedding` activity | 91 | recommended → consider 26, watch → avoid 26, neutral → consider 13, no_evidence → consider 12, avoid → strong_avoid 6, watch → consider 3, consider → avoid 2 |
| Xuất hành event | 91 | recommended → caution 46 (all 91 巳 days now caution) |
| Cưới hỏi event | 91 | recommended → not_recommended 27, caution → not_recommended 12, insufficient_evidence → not_recommended 12 (all 91 亥 days now not_recommended) |

Across 2025–2027: Xuất hành recommended 428 → 382; Cưới hỏi recommended 346 → 319. The 1.2.1 frozen baseline pins the catalog without these rules on both sides.
