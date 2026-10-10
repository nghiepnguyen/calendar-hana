# Calendar V3 — Rule extraction (Phase 3A)

Phase 1 and Phase 2.1 calculation PASS are retained. This delivery is extraction and candidate fixture construction only. No production implementation, migration, scoring or Phase 3B.

Authority: Source Lock V3 > Spec V3 > Patch 2.1 > original spec > Golden > production. Supplied files were read in full and remain unchanged.

## Registry audit

The supplied registry locks source families and advertises Group A eligibility, but does not contain exact quotes, locations, basis, boundary policy or independent fixtures. We re-established Group A admission from identifiable passages; we did not treat the registry flag alone as proof. Group B stays pending despite primary symbolic table extraction. Group C remains VN/unverified.

Primary evidence is a digital transcription of the locked work, not a facsimile collation. `verified` here means the named rule and quotation were located in that transcription. Candidate Golden still awaits the user’s independent review; it is not labeled “independently-reviewed”.

## Group A

### Nguyệt Kỵ (`yue-ji`)

Source: [卷六 / 義例四 / 月忌日 / 齊東野語曰](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343).

> 俗以每月初五十四二十三日為月忌

Match lunar days 5,14,23 only. Do not infer a global prohibition; the paragraph explicitly discusses limited annotations and usable auspicious influences.

Normalized rule: `{"kind": "lunar-day-membership", "days": [5, 14, 23], "monthIndependent": true, "leapPolicy": "project V3: same rule in normal/leap months; source says every month but does not discuss intercalation separately"}`.

Effects: No activity effect admitted. Raw lunar-day match is not a blanket restriction. Source annotation policy is more nuanced than “everything is bad”.

### Tứ Ly (`four-separations`)

Source: [卷六 / 義例四 / 四離四絶 / 曹震圭曰](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343).

> 四離者冬至前一日水離夏至前一日火離春分前一日陽體分而木亦離也秋分前一日隂體分而金亦離也

Day before winter/summer solstices and spring/autumn equinoxes. Modern apparent-longitude instants and UTC+7 civil-day assignment are project conventions, not claimed as ancient numerical method.

Normalized rule: `{"kind": "civil-day-before-solar-transition", "longitudes": [0, 90, 180, 270], "dayOffset": -1, "notInstantSubtraction24Hours": true}`.

Effects: `travel → avoid` only, based on 出行/逺行; military action has no approved taxonomy ID and is left unmapped. No severity or overall-day verdict.

### Tứ Tuyệt (`four-extinctions`)

Source: [卷六 / 義例四 / 四離四絶 / 玉門經曰、曹震圭曰](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343).

> 四絶者四立前一辰也

Day before Spring/Summer/Autumn/Winter Commences. Four season starts at 315,45,135,225 degrees under the project astronomical convention.

Normalized rule: `{"kind": "civil-day-before-solar-transition", "longitudes": [315, 45, 135, 225], "dayOffset": -1, "notInstantSubtraction24Hours": true}`.

Effects: `travel → avoid` only, based on 出行/逺行; military action has no approved taxonomy ID and is left unmapped. No severity or overall-day verdict.

## Group B — symbolic extraction, pending admission

| Rule | Source location | Targets for source month 1→12 | Status |
|---|---|---|---|
| Nguyệt Phá | [卷四 / 義例二 / 月破 / 考原曰](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷04) | 申 / 酉 / 戌 / 亥 / 子 / 丑 / 寅 / 卯 / 辰 / 巳 / 午 / 未 | PARTIAL; Golden false |
| Kiếp Sát | [卷六 / 義例四 / 刼煞 / 李鼎祚曰](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) | 亥 / 申 / 巳 / 寅 / 亥 / 申 / 巳 / 寅 / 亥 / 申 / 巳 / 寅 | PARTIAL; Golden false |
| Tai Sát | [卷六 / 義例四 / 月災煞、天獄 / 按](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) | 子 / 酉 / 午 / 卯 / 子 / 酉 / 午 / 卯 / 子 / 酉 / 午 / 卯 | PARTIAL; Golden false |
| Nguyệt Sát | [卷六 / 義例四 / 月煞 / 歴例曰](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) | 丑 / 戌 / 未 / 辰 / 丑 / 戌 / 未 / 辰 / 丑 / 戌 / 未 / 辰 | PARTIAL; Golden false |
| Nguyệt Đức | [卷五 / 義例三 / 月徳 / 歴例曰](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05) | 丙 / 甲 / 壬 / 庚 / 丙 / 甲 / 壬 / 庚 / 丙 / 甲 / 壬 / 庚 | PARTIAL; Golden false |
| Thiên Đức | [卷五 / 義例三 / 天徳 / 堪輿經曰](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05) | 丁 / 坤 / 壬 / 辛 / 乾 / 甲 / 癸 / 艮 / 丙 / 乙 / 巽 / 庚 | PARTIAL; Golden false |

These are source-symbolic month targets, **not lunar-month runtime tables**. Calendar binding remains unresolved in the present evidence package. 月建/opposition and numbered-month passages were found, but an independently reviewed modern exact-instant month policy, leap policy and date anchors have not been established for each rule. Do not infer that all numbered months mean lunar months or automatically reuse the Bazi month for every rule.

Thiên Đức explicitly uses 丁/坤/壬/辛/乾/甲/癸/艮/丙/乙/巽/庚. Four trigram rows cannot silently become 申/亥/寅/巳 or 未/戌/丑/辰; the source discusses alternative reconstructions. Keep tagged targets and defer day matching for months 2,5,8,11.

Tai Sát follows the editorial reverse 四仲 correction. 天獄 is an alias to avoid double counting, not a second independent rule. Nguyệt Sát/月虚 similarly needs canonical ID deduplication. No source-wide effects or resolver precedence are invented.

## Activities and conflicts

Only direct Group A travel effects are recorded. Group B effects stay unadmitted until context and scope review. Nguyệt Kỵ has no broad activity effect. Raw matches must remain separate from activity resolution. If a later canonical recommend/avoid conflict lacks precedence, preserve both and return conflict per activity. No weights or total score.

## Reproducibility

Expected booleans came from quoted rule definitions and independent HKO calendar/transition anchors, never from production output. Python used only Gregorian civil-date arithmetic and timezone conversion to expand fixed trusted anchors. Gregorian dates in fixtures are examples, not a hard-coded evaluator. Property specifications describe reuse of the existing exact engine for context in a later authorized implementation.

The 2014 HKO table publishes times to minutes. Fixtures preserve that precision and do not fabricate seconds. Spring equinox is 2014-03-21 00:57 UTC+8 → 2014-03-20 23:57 UTC+7, yielding Tứ Ly on March19. The civil-date result is robust within the prior 60-second reference resolution.

The lunar fixtures use HKO 2023/2024 calendar cells and explicit new-moon references (2023 leap2 starts March22 at00:23 UTC+7; 2024 month1 starts Feb10 at05:59 UTC+7). This is independent context evidence, not HKO authority for Shen Sha, and not a general claim that UTC+8 and UTC+7 calendars are interchangeable.

## Artifacts

- `calendar-rule-extraction-v3.json`: twelve rules, primary evidence, normalized lookup candidates, property specifications and mutation designs.
- `golden-v3/manifest.json`: admitted Group A candidate list, pending list and independent source references.
- `calendar-v3-fixture-review.md`: admission/coverage review.
- `calendar-v3-pending-rules.md`: unresolved decisions, including legacy VN conventions.
