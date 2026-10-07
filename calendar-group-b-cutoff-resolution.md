# Group B Cutoff Resolution

Version 3.1.1. Access date: 2026-10-08. RESEARCH COMPLETE; calculation admission remains PARTIAL. Locked Month Jian/Jie basis preserved; no re-extraction or production evaluation.

## Evidence

Canonical XJBF remains highest named authority. Its 卷四 daily 建除 wording and 月表 show Jie framework but do not explicitly specify equality at a transition instant for all six rules. A different historical work supplies the strongest newly collated operational evidence.

[《大清時憲書箋釋一卷》 facsimile](https://upload.wikimedia.org/wikipedia/commons/0/0f/Shanghai_%E5%A4%A7%E6%B8%85%E6%99%82%E6%86%B2%E6%9B%B8%E7%AE%8B%E9%87%8B%E4%B8%80%E5%8D%B7.pdf), author 繆之晉: scan p.5 preface dated 雍正元年 (1723); printing year/physical-edition identification not independently established. All scan page numbers here are **1-based PDF pages**, not claimed printed folios. Relevant text on pp.51–56 visually inspected. [Digital transcription](https://www.shidianguji.com/zh/book/NA06367/chapter/1m3q9g2tzjd4i) has missing clauses and erroneous glyphs; the decision below relies on scan context.

### Exact wording and scope

Scan p.51 left, heading 二月建卯, immediately below 驚蟄二月節:

> 未交驚蟄時刻之前尚屬正月節氣主事凡諸二月內吉凶神煞及七十二候皆從交驚蟄日時之後起

This says previous month before crossing and monthly auspicious/inauspicious gods commence after crossing. The heading is Month Jian, not merely Bazi or Month General. Adjacent p.52 names 天德/月殺/月德. Scan pp.55–56 repeats the operational instruction for 立夏, including:

> 未交立夏時刻之前尚屬三月節氣所轄凡諸四月內吉凶神煞及七十二候皆從交立夏之日時後起

Thus monthly Shen Sha are explicitly in scope; this is stronger than the generic seasonal example in 例言. Not every rule is individually named in this sentence: inclusion of 月破/劫煞/災煞 is a **class-scope inference** from generic 吉凶神煞 + their locked monthly classification. It does not establish all their activity effects.

This work predates XJBF, which revised older conventions. Its model is admissible historical evidence, not silently promoted into an XJBF command. No directly contradictory cutoff sentence was found in the accessible canonical passages.

## Exact instant evidence

**Preferred model: EXACT_JIE_INSTANT.** Confidence HIGH for Miao's operational model; MEDIUM for cross-work canonical applicability.

For an independently established true crossing T:

| Sample | Historical support | Admission |
|---|---|---|
| T−ε | previous month | explicit before wording |
| T | not mathematically specified | UNRESOLVED inclusive equality |
| T+ε | new month | explicit after wording |

“從…後起” establishes crossing as commencement reference. Treating the new interval as [T,next T) would be a sensible **reviewer/project convention**, but the book does not express mathematical equality. No automatic t=new expectation is written in this package. Need explicit source or reviewer admission identifying this convention before boundary Golden.

## Whole-day evidence

[卷四 / 建除](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷04) says “每月交節則疊兩值日”. It describes a daily repetition/annotation practice in the Officer cycle; it neither proves all six monthly raw rules switch at midnight nor settles at-instant equality. [卷二十 / 月表](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷20) enumerates 60 symbolic day contexts, not a dated civil-day cutoff oracle.

No source read proves CIVIL_DAY_START_CONTAINING_JIE or CIVIL_DAY_AFTER_JIE for raw monthly gods. DAILY_ALMANAC_LABEL_CONVENTION could coexist with instant calculation; do not infer its policy from list absence or transfer Officer daily convention to all six rules.

## Calculation vs presentation

- raw rule evaluation: recommend exact Jie crossing model, **inclusive equality / canonical admission PENDING**.
- calendar UI label: **PENDING**. No implementation or display behavior chosen. A whole-day label requires its own stated representative time or annotation rule.
- No RULE_SPECIFIC midnight exception established. Thiên Đức operand dispute is separate from cutoff.

## Timezone translation

Historical regional clocks are SOURCE LOCAL CIVIL TIME; no IANA mapping invented. Only modern HKO absolute references are translated to project UTC+7. [HKO 2014 terms](https://www.hko.gov.hk/en/gts/astron2014/Solar_Term_2014.htm) explicitly uses Hong Kong Time UTC+8; publication precision is minute.

| Jie | HKO reference +08 | Same reference +07 |
|---|---|---|
| Lập Xuân | 2014-02-04 06:03 | 2014-02-04 05:03 |
| Kinh Trập | 2014-03-06 00:02 | **2014-03-05 23:02** |
| Thanh Minh | 2014-04-05 04:47 | 2014-04-05 03:47 |
| Lập Hạ | 2014-05-05 21:59 | 2014-05-05 20:59 |

Example requested, under preferred model (not authoritative Golden):

| Vietnam sample | Context conclusion |
|---|---|
| 2014-03-05 22:00 | old 寅, clearly before published crossing vicinity |
| 2014-03-05 23:01 | old 寅 relative to minute reference; exact seconds/rounding not supplied |
| 2014-03-05 23:02 | **UNRESOLVED**: published minute is not true exact T, equality also pending |
| 2014-03-05 23:03 | new 卯 relative to minute reference; exact seconds/rounding not supplied |
| 2014-03-06 00:00 | new 卯, clearly after crossing vicinity |

No fabricated error bound assigned to HKO rounding. Previous 144 boundary records remain unchanged/PENDING; no new boundary expected dataset generated.

## Decision

**DECISION: UNRESOLVED for full canonical inclusive cutoff admission.** Preferred historical model = **EXACT_JIE_INSTANT**, replacing the prior absence of scoped evidence with direct monthly-god evidence. Do not confuse model support with all boundary requirements passing.

Remaining caveats: canonical cross-work scope approval, t=new vs other inclusive convention, exact modern timestamp source for boundary fixtures. UI presentation is separate and does not need to block raw-rule Golden if explicitly excluded. Five resolved-operand rules can proceed after cutoff admission; Thiên Đức must not hold them back.

## Source log and search limits

Every record accessed 2026-10-08. FACSIMILE p.51 and pp.55–56 independently collated; no claim of full scan/canonical collation. Dates in search engine publication metadata not treated as historical edition dates.

| ID | Title | Evidence type | Edition/year | URL | Location | Access result |
|---|---|---|---|---|---|---|
| MIAO_SCAN | 大清時憲書箋釋一卷 / 大清時憲曆箋釋 | FACSIMILE | edition/year chưa xác lập | [source](https://upload.wikimedia.org/wikipedia/commons/0/0f/Shanghai_%E5%A4%A7%E6%B8%85%E6%99%82%E6%86%B2%E6%9B%B8%E7%AE%8B%E9%87%8B%E4%B8%80%E5%8D%B7.pdf) | PDF pp.36–37, 51–56 (1-based); 寫真頁 counting, printed folio not established | RELEVANT_PAGES_VISUALLY_COLLATED |
| MIAO_OCR | 大清時憲曆箋釋 | PRIMARY | edition/year chưa xác lập | [source](https://www.shidianguji.com/zh/book/NA06367/chapter/1m3q9g2tzjd4i) | 例言 L48–49; 二月建卯 L557–562; 四月建巳 L617–621 | READ_WITH_OCR_ERRORS |
| XJBF_04 | 欽定協紀辨方書 (四庫全書本) 卷04 | PRIMARY | edition/year chưa xác lập | [source](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷04) | 建除十二神; 月破 | TRANSCRIPTION_READ |
| XJBF_05 | 欽定協紀辨方書 (四庫全書本) 卷05 | PRIMARY | edition/year chưa xác lập | [source](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷05) | 天道天德; 蠡海集 / 又一說 / editorial 按; 天德合 | TRANSCRIPTION_READ |
| XJBF_06 | 欽定協紀辨方書 (四庫全書本) 卷06 | PRIMARY | edition/year chưa xác lập | [source](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷06) | monthly 刼煞/災煞/月煞; prior pinned oldid=787343 | TRANSCRIPTION_READ |
| XJBF_20 | 欽定協紀辨方書 (四庫全書本) 卷20 | PRIMARY | edition/year chưa xác lập | [source](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷20) | 月表一 正月: heading and six rule positions | TRANSCRIPTION_READ |
| HKO_CAL_201402 | Hong Kong Observatory Almanac 2014 — February | INDEPENDENT_CALENDAR_REFERENCE | 2014 | [source](https://www.hko.gov.hk/en/gts/astron2014/files/2014cal02.pdf) | PDF p.1, date cells for 5–24 February | VISUALLY_VERIFIED |
| HKO_TERMS_2014 | Date and Time information of the 24 Solar Terms in 2014 | INDEPENDENT_ASTRONOMICAL_REFERENCE | 2014 | [source](https://www.hko.gov.hk/en/gts/astron2014/Solar_Term_2014.htm) | Spring commences / Insects waken rows; timezone statement | READ |
| SHIXIAN_1870 | 大清同治九年歲次庚午時憲書 | HISTORICAL_ALMANAC | 1870 | [source](https://www.shidianguji.com/zh/book/HY1764/chapter/1ko001jzxfn77) | available chapter transcription L8–17 | READ_PARTIAL_TRANSCRIPTION |
| WU_2021 | 吳羽：唐宋曆日祭祀吉日鋪注的變化與適用範圍——以「神在」日為中心的探討 | SCHOLARLY | 2021 | [source](https://www1.ihp.sinica.edu.tw/storage/publish2L/92-2-4%E5%90%B3%E7%BE%BD.pdf) | printed p.408 / PDF p.12 table introduction; adjacent discussion | RELEVANT_PASSAGES_READ |
| CHEN_2014 | 陳峻誌：從敦煌具註曆日到寺廟安太歲：太歲以下諸神體系的起源與演變趨勢 | SCHOLARLY | 2014 | [source](https://chinese.nchu.edu.tw/files/users/189/36-3.pdf) | PDF pp.19–27 comparison tables/discussion | RELEVANT_PASSAGES_READ |
| LIHAI | 王逵 蠡海集 / 曆數類 | PRIMARY | edition/year chưa xác lập | [source](https://www.shidianguji.com/book/SK1903/chapter/1jpic4a1375sa) | 天德之法 / 又一說 | TRANSCRIPTION_READ |
| NDL | 欽定協紀辨方書36卷 — National Diet Library | DISCOVERY_ONLY | 1741 | [source](https://ndlsearch.ndl.go.jp/en/books/R100000002-I000007567664) | catalogue; https://dl.ndl.go.jp/pid/2609626 | CATALOGUE_READ_VIEWER_CONTENT_FETCH_FAILED |
| HSING_FA_TANG | 信發堂 廖淵用通書 catalogue lead | DISCOVERY_ONLY | edition/year chưa xác lập | [source](https://www.hsing-fa-tang.com.tw/book_detail.php?id=230426095739) | unknown | FETCH_FAILED |
| YINWAN | 從尹灣漢墓簡牘看中國社會的擇日傳統 | DISCOVERY_ONLY | edition/year chưa xác lập | [source](https://www11.ihp.sinica.edu.tw/storage/w2_file/3142tUjuBFN.pdf) | unknown | FETCH_FAILED |

Bounded search included 交節/交節時/月建/節前/節後/未交節/已交節/神煞/時憲書/通書 combinations, direct review of Miao monthly passages and canonical referenced chapters, historical 1870 chapter and scholarly almanac leads. Blogs/apps/snippets were discovery only. Sources with no readable interior cannot resolve policy. Exhaustive within the reachable relevant passages; not a claim to have searched every historical edition. Stop; no endless search or production change.

Additional canonical search log: 全覽1 (5,430 tool lines) and 全覽2 (1,668 lines) opened; targeted find attempts for 交節/交節時/未交/節後 returned no matches. This is **tool search evidence only**, not proof those characters do not occur in the work (卷四 separately does contain 交節). 全覽3 fetch failed. Full-page coverage/search indexing is therefore a limitation. 全覽1 奏議 L149–150 was read directly for the Thiên Đức correction; source hierarchy strengthened without re-extracting tables.
