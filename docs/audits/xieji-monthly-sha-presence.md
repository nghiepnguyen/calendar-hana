# 協紀 月厭 / 月刑 / 月煞 / 災煞, 天赦 / 天願 / 月恩 / 四相 and 月表 天德 — presence lock for 卷十 (diagnostics only)

Status: **IMPLEMENTED AS DIAGNOSTICS — no score, status or verdict change**
Date: 2026-10-10. Branch `audit/xieji-monthly-sha-presence` (after PR #16/#17).
Related: `docs/audits/xieji-vol10-resolution.md`, `docs/plans/xieji-vol10-scoring.md` (“Work that reduces `undetermined`”, item 1), `docs/audits/truc-than-context-audit.md`.

## Why these four

The 4,540 `undetermined` items in the 卷十 diagnostics (2025–2027 × 11 events, hour 9) broke down as:

| Cause | Items |
|---|---|
| 從月煞論 (平日 辰戌丑未, 閉日 寅申巳亥) | 1,200 |
| 從月刑論 (平日 寅巳子, 收日 卯丑戌, 月建 辰酉亥) | 1,160 |
| 從月厭論 (月建 子午) | 240 |
| Virtue presence unknown (天赦/天願/月恩/四相, 天德 trigram months) | 1,940 |

No deferral goes to 災煞; it is included because its presence and 卷十 entry come with the same work and 月破/月厭 clauses refer to it.

## Presence (`shared/lunar/xiejiMonthlySha.ts`)

Wikisource 欽定協紀辨方書 (四庫全書本), raw wikitext read directly: 卷03 SHA-1 prefix `ce833ba7e0d3`, 卷04 `da680c13601d`, 卷06 `a9ab67896fc9`, 卷10 `355dc6c8fe2d` (same as PR #16). Month operand is Month Jian; operand is the day branch.

| 凶 | Rule | Source |
|---|---|---|
| 月厭 (地火, 隂建) | 正月起戌逆行十二辰 | 卷四 隂陽不將 / 天寶厯曰; 地火 / 厯例曰 (地火即是月厭) |
| 月刑 | same as 歲刑: 子刑卯 丑刑戌 寅刑巳 卯刑子 巳刑申 未刑丑 申刑寅 戌刑未, 辰午酉亥自刑 | 卷六 月刑 / 按 “月刑之義與嵗刑同”; 卷三 歲刑 / 曾門經曰 |
| 月煞 (月虛) | 正月起丑逆行四季 | 卷六 月煞 / 歴例曰 |
| 災煞 (天獄) | 正月起子逆行四仲 (曹震圭, adopted: “其說是今從之”) | 卷六 月災煞 / 按 |

The month tables in 卷四/卷六 are images on Wikisource; 月刑's own 厯例 line is not in the text layer, hence the 歲刑 route the book itself gives.

Independent checks (`xiejiMonthlySha.test.ts`):

- The sequences match the source phrases read by hand.
- 月煞 and 災煞 agree on all 144 (Month Jian, branch) cells with the frozen Group B v3.1 authority (`groupB.ts`, verified earlier, unused by production presence).
- Every 值X日 phrase in 卷十 holds for all twelve months (e.g. 月厭 寅申 成日 / 丑未 開日 / 辰戌 定日 / 巳亥 滿日 / 子午 建日 / 卯酉 破日; 月刑 巳寅子 平日 / 辰酉亥午 建日 / 丑戌卯 收日 / 未申 破日; 月煞 寅申巳亥 閉日 / 辰戌丑未 平日 / 卯酉 危日; 災煞 寅申巳亥 開日 / 辰戌丑未 滿日 / 子午卯酉 破日).

This presence feeds only `resolveVol10`. Production `godPresence`, star lists and scores are untouched; the legacy gods 月厭/月刑/月煞/災煞 still never fire (21/44 list in `godPresenceCoverage.test.ts` unchanged).

## 卷十 entries (`shared/almanac-data/xiejibianfangshu-vol10-yiji.json`)

| Entry | 忌 | Clauses |
|---|---|---|
| 月厭 | own list (+ 地火 栽種) | 卯酉 諸事皆忌 even with 德; 子午 (厭建會) as usual only with 天赦, else 諸事皆忌; 寅申丑未 with 月德/天德合/月德合 → 止忌 travel/office/marriage/medical/moving/planting list; 辰戌巳亥 with 天德/月德/月德合 → 不註宜忌 |
| 月刑 | own list | 午 從月厭; 巳 with 月德/天德合/天願 → 止忌 military/medical, else 不註宜忌; 寅辰酉亥丑戌 with 德合 → 不註宜忌, else as usual; 子卯未申 with 德合 → as usual, else 諸事皆忌 |
| 月煞 | 忌同刼煞 (+ 月虛 修倉庫, 開倉庫出貨財) | 卯酉 with 月德/天願 → 止忌 military/medical, else 不註宜忌; 子午 with 月德合 → 不註宜忌; 寅申巳亥辰戌丑未 with 德合 → as usual, else 諸事皆忌 |
| 災煞 | 忌同刼煞 (+ 天火 苫蓋) | 子午卯酉 從月破; 寅申巳亥 with 德神 → 止忌 military/medical, else 不註宜忌; 辰戌丑未 with 德神 → 止忌 military/medical, else as usual (〔赦願不得與災煞併〕) |

月厭 day pillars: only pillars that fall on a 月厭 day are encoded — 隂陽大會 (8), 小會 五月戊午 / 十一月戊子, 隂道衝陽 二月己酉 / 八月己卯, 隂錯 exceptions (二月辛酉, 八月乙卯, 六月己巳) as 諸事皆忌; the other 隂錯 days as 從厭所忌 (德 ignored). Pillars on other days are recorded in `notEncoded`: 小會 on 建 days (already under 月建), 單隂/純陽/孤陽/純隂, 隂位, 交破/擊衝/陽破隂衝 on 破 days, 歲薄/逐陣/三隂 (days that take 月厭's taboos without 月厭 present), 陽錯 on 建 days, 絶隂/絶陽 (月煞 閉日, already 諸事皆忌 there for lack of 德).

Readings recorded: 月厭 “己亥月值滿日” read as 巳亥 (as 刼煞 in PR #16); 地火 修築園圃 is not a 卷十一 用事 heading, so no activity maps to it; 葢 normalised to 蓋.

Resolver changes: presence `{ "table": … }`, `avoidSameAs` for 忌同刼煞, version `xieji-vol10-v2`.

## Effect (2025–2027, 11 events, hour 9)

| | Before | After |
|---|---|---|
| Six original entries: undetermined | 4,540 | **2,520** |
| Six original entries: avoid / not_avoided / no_annotation / not_listed | 2,691 / 738 / 637 / 2,314 | 4,192 / 774 / 731 / 2,703 |
| Six original entries: diverge from product | 1,707 | 2,313 |
| New four entries: items (undetermined) | — | 7,320 (1,220) |
| New four entries: diverge from product | — | 3,417 |

Most newly resolved deferrals are 月煞/月刑 without 德 → 諸事皆忌, so `avoid` grows. The new entries diverge mainly because the product has no working 月厭/月刑/月煞/災煞 rule (legacy gods never fire), so 卷十 `avoid` meets product delta 0.

Remaining `undetermined` (all entries, 3,740): 天赦/天願/月恩/四相 presence (閉日 1,000; 月建 720; 天赦 for 子午 月厭 480 = 月厭 200 + 月建→月厭 200 + 月刑→月厭 80; 月煞 卯酉 280; 月刑 巳 160 incl. 平日→月刑) and 天德/天德合 on trigram months (月刑 360; 月破 220 + 災煞→月破 220; 收日/平日/月建 → 月刑 300).

## Part 2 — virtue presence: 天赦, 天願, 月恩, 四相 (`shared/lunar/xiejiVirtues.ts`)

卷五 義例三 (raw `卷05` SHA-1 prefix `1d4000974e32`; checked against the 四庫全書 scan, archive.org `06067683.cn` n40–n51), by Month Jian; seasons 春 = 寅卯辰 … 冬 = 亥子丑.

| 吉神 | Rule adopted by 協紀 | Source | Operand |
|---|---|---|---|
| 天赦 | 春戊寅 夏甲午 秋戊申 冬甲子 | 歴例曰 (考原 agrees) | day pillar |
| 天願 | 正月乙亥 二月甲戌 三月乙酉 四月丙申 五月丁未 六月戊午 七月己巳 八月庚辰 九月辛卯 十月壬寅 十一月癸丑 十二月甲子 | **按 … 起例曰** | day pillar |
| 月恩 | 正月丙 二丁 三庚 四己 五戊 六辛 七壬 八癸 九庚 十乙 十一甲 十二辛 | 歴例曰 (按 agrees) | day stem |
| 四相 | 春丙丁 夏戊己 秋壬癸 冬甲乙 | 歴例曰 (按 agrees) | day stem |

**天願 correction**: 卷五 first quotes the 歴例 list (正月甲午 二月甲戌 …) and 曹震圭's explanation, then rejects both in its 按: “考諸神煞起例乃知傳寫謬誤二十四字中誤十三字焉” and adopts the 起例 list (branch = 太陽/月將, stem = 令星). A first draft of this branch used the 歴例 list; it was corrected after the 月表 scan showed 五月丁未 (not 丁丑). Readings: 月恩 四月 and 四相 夏 “巳” read as the stem 己.

Consistency (`xiejiVirtues.test.ts`): with the 起例 list, the 卷十 notes 〔天願不得與月建併〕〔天赦天願不得與月破併〕〔天赦天願不得與滿日併〕 hold for every month (天願 never falls on 建/破/滿; 天赦 never on 破/滿), and the 卷十 clauses that name 天願 land on that 凶's day: 月煞 卯 (戌) = 甲戌, 月煞 酉 (辰) = 庚辰, 月刑 巳 (申) = 丙申. The 歴例 list fails both checks.

## Part 3 — the 月表 scan: 天德 on 坤/乾/艮/巽 months

卷五 records two ways to put the trigram 天德 on days (考原 墓 reading 二月未/五月戌/八月丑/十一月辰; others 巳亥寅申) and calls the 考原 one “聊存以傳一解”. The book's own day tables decide it. Scan: 四庫全書 子部 (浙江大學圖書館 copy on archive.org) — 卷二十一 二月 `06067692.cn` n73–n132, 卷二十四 五月 `06067694.cn` n6–n65, 卷二十七 八月 `06067695.cn` n70–n129, 卷三十 十一月 `06067697.cn` n6–n65; one page per day, 甲子 → 癸亥. Every page's 吉神 list was read (cropped and tiled with ffmpeg).

- **None of the 240 day pages of the four 仲 months lists 天德** (and none lists 天德合). The month headers still say 天德在坤/乾/艮/巽 (a direction). By contrast 七月 癸亥 lists 天德 (申 month 天德 = 癸), so 天德 is printed whenever it is a stem or branch.
- Same pages confirm the locked definitions: 月德/月德合 on their stems, 天赦 (戊寅/甲午/戊申/甲子), 天願 (甲戌/丁未/庚辰/癸丑), 月恩, 四相; 月建/月破/月刑/月煞/月厭/災煞/刼煞 on the expected branches (e.g. 二月 癸酉: 月破 大耗 災煞 月厭; 甲戌: 月德 天願 六合 / 月煞 月虛).

So 天德 is treated as **absent** on days of 子午卯酉 months: `almanac.ts` `unknownGodIds` is now always `[]` (only the 卷十 diagnostics read it). Production presence was already absent there (trigram tokens never match a day).

### Effect after parts 2–3 (2025–2027, 11 events, hour 9)

| | Original (PR #16) | After part 1 | After parts 2–3 |
|---|---|---|---|
| Six original entries: undetermined | 4,540 | 2,520 | **0** |
| Four new entries: undetermined | — | 1,220 | **0** |
| Six original entries: diverge | 1,707 | 2,313 | 2,575 |
| Four new entries: diverge | — | 3,417 | 3,385 |

Six original entries now: 5,422 avoid / 798 not_avoided / 833 no_annotation / 3,867 not_listed. Four new entries: 4,583 / 420 / 728 / 1,589.

## Limits / next

- Diagnostics only; frozen decision baseline still 1095/1095; not shown in UI.
- No `undetermined` remains for the encoded entries in 2025–2027. 時德/六合 are not named in any encoded clause.
- Next: golden + migration proof for the scoring table decided 2026-10-10 (`docs/plans/xieji-vol10-scoring.md`).
- Encoding these presences in the scoring layer (making the legacy 月厭/月刑/月煞/災煞 rules fire) is a separate decision: it would change scores.
