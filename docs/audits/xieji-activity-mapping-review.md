# 協紀 卷十一 用事 → activity — interpretation review

Status: **29/29 REVIEWED** — owner decisions 2026-10-10 applied (see end)
Date: 2026-10-10. Branch `audit/xieji-vol10-remeasure`. Reviewer: agent (single reviewer, as for the mansion mapping v2).
Data: `shared/almanac-data/xieji-activity-mapping-review.json`; test `shared/lunar/xiejiActivityMappingReview.test.ts`.

## Why

`xieji-activity-mapping-v1` maps each catalog activity to one or more 卷十一 用事 headings (`xiejibianfangshu-yiji.json` `activityEntries`). The same table decides which 卷十 verdicts touch which activity once `xiejiVol10Scoring` is on, so the mapping must be reviewed before the flag.

## Source

欽定協紀辨方書 (四庫全書本) 卷十一 用事, Wikisource `action=raw`, SHA-1 prefix `ce4ed7f23ff9` (same text as the 2026-10-10 Trực/thần audit). The volume lists 御用六十七事, 民用三十七事 and 通書選擇六十事, then merges them under one set of headings ("今以次合為一編"). Merged names are noted under the heading as 「X同」; this is the deciding evidence for several rows below. The closing line reads: 「療目針刺無宜日與療病同也鼓鑄苫蓋無宜日與修造同也遠迴乘船渡水無宜日除所忌之外無日不宜也」.

## Review

| Activity | Heading(s) | Verdict | Evidence |
|---|---|---|---|
| worship | 祭祀 | reviewed | same term |
| pray_blessing | 祈福 | reviewed | same term |
| pray_children | 求嗣 | reviewed | same term |
| wedding | 結婚姻、嫁娶 | reviewed | both are marriage |
| engagement | 納采問名 | reviewed | betrothal rites |
| moving | 般移 | reviewed | 「移徙同」 |
| bed_installation | 安牀 | reviewed | same term |
| opening | 開市 | reviewed | opening a shop |
| contract | 立券交易 | reviewed | 立券 = deed; listed apart from 交易 in 御用/通書, merged in the body |
| transaction | 立券交易 | reviewed | 交易 |
| finance | 納財 | reviewed | receiving wealth; label "Cầu tài" broader, same direction |
| travel | 行幸遣使 | reviewed | **「出行同」** — 出行 shares the 宜忌 of 行幸遣使 |
| meeting | 宴會 | reviewed | 「會親友同」 |
| study | 入學 | reviewed | same term |
| medical | 求醫療病 | reviewed | 民用 療病 |
| cleaning | 掃舍宇 | reviewed | sweeping the house |
| cut_hair | 整容剃頭 | reviewed | 民用 剃頭 |
| groundbreaking | 興造動土 | reviewed | 「修造同」; 破土 is a separate heading (burial earthwork) |
| construction | 營建宮室、興造動土 | reviewed | building + starting work |
| renovation | 修宮室 | reviewed | repairing dwellings; 修造 belongs to 興造動土 |
| beam_raising | 豎柱上梁 | reviewed | same term |
| planting | 栽種 | reviewed | same term |
| livestock | 牧養、納畜 | reviewed | rearing + buying livestock |
| burial | 安葬 | reviewed | same term |
| demolition | 破屋壞垣 | reviewed | same term |
| water_travel | 乘船渡水 | reviewed | no 宜 days; any day without a taboo is fine (closing line) |
| **warehouse** | 修倉庫 | **pending** | 修倉庫 = repairing storehouses; the label "Mở kho" matches the separate heading **開倉庫出貨財**, not transcribed |
| **business** | 開市 | **pending** | 開市 is narrower than "Kinh doanh" and duplicates `opening` |

`grave_repair`, `door_opening`, `waterworks` have no heading (unchanged; candidates for the last two are in `truc-than-context-audit.md`).

## Effect

- `Evidence.activityMapping.reviewStatus` is `interpretation_reviewed` (with `reviewTerm`, `reviewNote`) for the 26 rows, `interpretation_pending` (with `reviewNote`) for warehouse/business. Scores, statuses and the frozen baseline are unchanged.
- `conflictAnalysis.conflicts[].reviewPending` becomes `false` for conflicts on reviewed activities (e.g. wedding). Nothing consumes it beyond diagnostics.
- With the flag on, 137 changed/added rows sit on warehouse and 182 on business.

## Owner decisions needed

1. **warehouse**: (a) keep 修倉庫 and relabel "Sửa kho"; (b) transcribe 開倉庫出貨財 and map "Mở kho" to it (scoring change, new parity + migration proof); (c) split into two activities.
2. **business**: (a) keep as an alias of 開市; (b) drop the 卷十一 mapping (always `no_evidence` from Trực/thần); (c) relabel.
3. Whether a second reviewer is needed before the flag: this review, like the mansion mapping v2, is single-reviewer.

## Owner decisions applied (2026-10-10, branch `feature/warehouse-split`)

1. **warehouse → split (option c).** `warehouse` keeps 修倉庫 and is relabelled **Sửa kho** (rules, scores unchanged). New activity `warehouse_opening` **Mở kho xuất hàng** ↔ **開倉庫出貨財**, transcribed from the same raw text:
   - 宜 月恩四相時德滿日五富
   - 忌 月建月破大耗平日收日閉日劫煞災煞月煞月虛月刑月害月厭大時天吏小耗天賊四耗四廢四窮五虛九空甲日
   - Trực (parity test, weights by the catalog convention good +15 / bad −15 / Phá −25): Mãn +15; Kiến, Bình, Thu, Bế −15; Phá −25.
   - Gods (parity test): good 月恩, 四相, 時德, 五富; bad 月破, 劫煞, 災煞, 月煞, 月刑, 月害, 月厭, 大時, 天吏, 四廢, 四窮.
   - **Not encoded:** 甲日 (day-stem taboo), as with 修倉庫's 土王用事後; names without a catalog god (大耗 counts through Phá; 小耗, 天賊, 四耗, 五虛, 九空, 月虛) are missing witnesses.
   - 1095 days 2025–2027: recommended 83, watch 383, neutral 81, avoid 163, strong_avoid 21, no_evidence 364. No event uses it.
   - 卷十 (flag on): 171 changed/added rows; event figures unchanged (1,662).
2. **business → relabel (option c)** to **Khai trương / Mở hàng**, following 開市 and separating it from Ký kết / Giao dịch (立券交易). It shares the heading with `opening` ("Khai trương"); rules differ only in product weights.

Frozen decision baseline (`xiejiConditionalMigration.test.ts`) still reproduces 1095/1095 with `warehouse_opening` excluded like the other added activities: every existing activity and every event keeps its score and status.
