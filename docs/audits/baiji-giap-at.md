# 卷十 百忌日: 甲日 開倉庫出貨財, 乙日 栽種

Status: **IMPLEMENTED — changes scores** (owner decision 2026-10-10). Branch `feature/giap-at-day-rules`.

## Source

- 欽定協紀辨方書 卷十 百忌日 (Wikisource raw, SHA-1 prefix `355dc6c8fe2d`): 「甲日忌開倉庫出貨財乙日忌栽種丁日忌剃頭庚日忌經絡辛日忌醖釀壬日忌開渠丑日忌冠帶…以上所忌」.
- 卷十一 (`ce4ed7f23ff9`): 開倉庫出貨財 忌 「…五虛九空甲日」; 栽種 忌 「…土符地囊乙日土王用事後」.
- 卷十 鋪註條例: 「凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌」 — a 專忌 day keeps its taboo even when good and bad cancel.

## Rule

Same shape as `dinh_nhat` (丁日忌剃頭, already in production):

| God | Rule | Activity | Tier | Override |
|---|---|---|---|---|
| `giap_nhat` Ngày Giáp (Bách Kỵ) | `dayCan: [0]` | `warehouse_opening` | medium (−10, bad-god cap) | `giap_day_blocks_warehouse_opening` (preserve_bad → hard warning) |
| `at_nhat` Ngày Ất (Bách Kỵ) | `dayCan: [1]` | `planting` | medium | `at_day_blocks_planting` |

The vol. 11 parity test derives the activity list from `han` (甲日 / 乙日): each appears only in its one heading. With a hard warning the activity status is never `recommended`: `consider`, or `avoid`/`strong_avoid` when the score is ≤ 29 / ≤ 19 (PR #28).

## Golden (`shared/almanac-data/golden-baiji-giap-at.json`)

Frozen in commit `f29a4d0` before any code. 49 cases on 21 dates (7 甲, 7 乙, 7 丙 days, 2025–2027). Day stems come from date arithmetic from 2000-01-07 = 甲子, not from the engine. Each 甲 day: `warehouse_opening` has `giap_nhat` with a hard warning and status `consider`; `planting` and `warehouse` (Sửa kho) do not. Each 乙 day: the mirror image for `planting`. Each 丙 day: neither. All pass on the first run; no correction.

## Migration proof (`shared/lunar/baijiGiapAt.test.ts`, 1095 days 2025–2027)

- Only `warehouse_opening` (110 甲 days) and `planting` (109 乙 days) gain a row; every other row and activity is identical; **no event changes** (11 events, hour 9).
- warehouse_opening: watch → consider 40, no_evidence → consider 37, avoid → consider 15, recommended → consider 9, neutral → consider 9.
- planting: watch → consider 41, no_evidence → consider 35, recommended → consider 25, neutral → consider 4, avoid → consider 2, strong_avoid → consider 2.
- The 1.2.1 frozen baseline (`xiejiConditionalMigration.test.ts`) pins the catalog without these two rules on both sides and still reproduces 1095/1095.

## Hard-warning status (resolved by PR #28)

The first version of this PR exposed that a hard warning softened `avoid`/`strong_avoid` to `consider`. PR #28 (merged first) takes the stricter status. After rebasing, 2 of the 14 golden presence cases (score 25: 2025-08-03 warehouse_opening, 2027-09-03 planting) expect `avoid`; recorded in the golden as `POLICY_CHANGE`, not `GOLDEN_BUG`.

## Not encoded

- 卷十 鋪註條例: 「凡德合赦願月恩四相時德等日不註忌…開倉庫出貨財如遇德猶忌及從忌不從宜之日則仍註忌」 concerns marking, not the 百忌日 專忌; the rule stays unconditional, as for 丁日.
- The other 百忌日 items (庚日 經絡, 辛日 醖釀, 壬日 開渠, 卯日 穿井, 巳日 出行…) have no catalog activity or are not in scope.
