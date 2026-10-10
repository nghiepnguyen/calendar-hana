# 土王用事 (Thổ vương dụng sự) — definition lock

Status: **AUDIT ONLY — no code, no score change.** Owner decisions below are needed before implementation.
Date: 2026-10-10. Branch `audit/tu-vuong-dung-su`.

Source: 欽定協紀辨方書 (四庫全書本), Wikisource `action=raw`, all 36 volumes searched (土王, 土旺, 王用事, 十八日, 用事, 立春前). Volumes 1–9 are titled `卷01`…`卷09`. SHA-1 prefixes: 卷一 `66c18401b9f4`, 卷五 `1d4000974e32`, 卷六 `a9ab67896fc9`, 卷十 `355dc6c8fe2d`, 卷十一 `ce4ed7f23ff9`, 卷二十二 `3517ed0b55bb`, 卷三十五 `cfc090a9feca`. Quotes below re-checked against the downloaded text.

## 1. Definition — day count before each 四立

卷一 本原, 五行用事:

> 神樞經曰五行旺各有時惟土居無所定乃於四立之前各旺一十八日○歴例曰立春木立夏火立秋金立冬水各旺七十二日土於四立之前各旺一十八日合之亦為七十二日

卷一 按語: 「辰戌丑未固土也減十二日以與本令餘十八日為土王用事則各七十二日也」.

協紀 states the rule as **18 days before each of 立春, 立夏, 立秋, 立冬**. It gives no 日躔 / 宮度 / 定氣 computation for this item, and 卷三–卷八 (義例) have no entry of their own.

卷十 says the dates change yearly and are not in its tables: 「見義例以下諸日皆毎年不同亦月表萬年書所不能載臨時選用詳萬年書鋪註條例」. The 月表 only point to it in the 季月, e.g. 卷二十二 (三月): 「土王用事後忌修造動土巳午日添母倉」 (same in 卷二十五, 二十八, 三十一). 卷六 往亡 counts days from the onset: 「六月土旺後十二日十二月土旺後十八日…或節氣早晚間有差一日者」.

## 2. Day count vs solar longitude

The modern 土用 rule (sun at 297°/27°/117°/207°) is **not** in 協紀. Secondary witnesses, not 協紀, lean towards the day count:

- 明史 卷35 (大統曆, 恆氣): 「推土王用事 置穀雨大暑霜降大寒恒氣日減土王䇿…即各得土王用事日」.
- 承政院日記 (Joseon, 時憲 calendar): 高宗五年 「今六月初一日丁未…土王用事」 ≈ 1868-07-20 = 立秋 (Aug 7) − 18; λ117° fell a day earlier. 憲宗十三年 1847 similar. Computed with an approximate ephemeris by the research agent, not from a printed 時憲書 → **medium confidence**.

## 3. Scope of 「土王用事後」

Not defined verbatim. Reading: from the onset through the eve of the 立 day; the 立 day starts the next element's 72 days (「立春木…各旺七十二日」), so it is excluded. 卷十 uses the bare heading 土王用事 for the same taboos. **Inference.**

## 4. What it forbids

卷十: 「土王用事　忌營建宫室修宫室繕城郭築隄防興造動土修倉庫修置産室開渠穿井安碓磑補垣修飾垣墻平治道塗破屋壊垣栽種破土」 (small note 「義同土府」). 卷十一 lists 土王用事後 under the same headings (豎柱上梁 and 開倉庫出貨財 do not have it). 補垣塞穴: 「…土王用事後止忌補垣」 (補垣 only). 卷三十五: 「猶土王用事忌動土之義」.

**Correction to the research note:** 栽種's 忌 「…土符地囊乙日土王用事後」 is a list — 乙日 and 土王用事後 are separate items. 栽種 is forbidden for the whole period (卷十 lists it plainly), and on 乙 days all year (PR #26).

Catalog activities affected:

| Activity | Heading(s) |
|---|---|
| construction (Xây dựng) | 營建宮室, 興造動土 |
| groundbreaking (Động thổ) | 興造動土 |
| renovation (Sửa chữa) | 修宮室 |
| warehouse (Sửa kho) | 修倉庫 |
| demolition (Phá dỡ) | 破屋壞垣 |
| planting (Trồng trọt) | 栽種 |

Not in the catalog: 繕城郭, 築隄防, 修置産室, 開渠穿井 (candidate for `waterworks`, unmapped), 安碓磑, 補垣, 修飾垣墻, 平治道塗, 破土. Not affected: beam_raising, warehouse_opening, burial.

## 5. Proposed engine definition

1. For each year, take the civil dates (Asia/Ho_Chi_Minh) of 立春, 立夏, 立秋, 立冬 from the existing exact-Jie engine.
2. Period = [立 date − 18 days, 立 date − 1 day]: 18 civil days, the 立 day excluded.
3. Four periods a year, one in each 季月 (辰, 未, 戌, 丑 by Month Jian); the 立春 period falls in the 丑 month before the new year's 寅 month.

## 6. SOURCE_DEPENDENT

- 18 days counted from the 立 **date** (proposed) or from its exact **moment**; the two only differ in naming the first day when 立 falls near midnight.
- 「後」 boundary: 立 day excluded (inference).
- Whether the official 時憲書 used day count or 定氣 (two dated witnesses favour day count; unconfirmed).
- Interaction with 德/赦: 卷十 notes 「義同土府」; 土府 has 「與天德月德…併止忌營建宮室…」 (only the earth works stay forbidden). Whether 土王用事 inherits that 止忌 clause is not stated.

## Owner decisions needed

1. Day count from the 立 date (recommended) vs solar longitude.
2. 立 day excluded (recommended).
3. Weight: the catalog has no separate 土府 god (土府 is scored through the Trực Kiến alias, −15 per rule). 土王用事 is a period taboo on earth works 「義同土府」, not a 專忌 — recommendation: bad-god tier **major (−15)**, matching how 土府 already weighs, **no** hard warning. Alternative: medium (−10) with a hard warning, like 甲日/乙日/丁日.
4. Activities: the 6 above.

## Implementation plan after decisions

- Golden frozen before code: periods for 2025–2027 with 立 dates taken from an **independent** published table (not the engine), plus boundary days (onset, eve of 立, the 立 day) for 2–3 activities.
- Day-rule god `tho_vuong_dung_su` with a period rule (new `rule` shape), parity test extended (`han` 「土王用事後」 matches the 卷十一 lists).
- Migration proof over 1095 days: only the 6 activities on period days change; events report.
