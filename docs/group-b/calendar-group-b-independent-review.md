# Phase 3B.3 Independent Golden Review

## Verdict

**PASS — APPROVE_GOLDEN_FREEZE (recommendation only).** 60/60 source cells; 21/21 independently re-solved Jie; 156 unique civil dates checked; all606 fixture records independently recomputed; 16/16 killer triples valid; 10/10 mutation categories have effective counterexamples. No material mismatch found. This is candidate review, not production correctness, actual freeze or runtime mutation execution.

## Independence methodology

Treated candidate booleans/context/targets/timestamps as claims. Created rule oracle from admitted primary prose before loading candidate fields, re-downloaded official ephemeris, used a different solar root solver from construction, and independently derived Gregorian JDN from a separately read HKO epoch. Only then compared candidate fields. Numerical comparisons are in review JSON, including each fixture's independently derived components and all protected hashes.

Source/spec, extraction JSON/MD, GroupB research/basis/conflicts, cutoff/reviewer decision, dated anchors, exact evidence/review, candidate manifest/files, property/mutation designs, Golden review and ThiênĐức resolution were consulted. Authority: primary/admitted extraction → frozen reviewer convention → independent calendar/astronomy → source/spec → candidate. Production was not read as an oracle, imported or called.

Construction and review share the admitted historical rules and the traceable Swiss ephemeris model; that reuse is explicit. Review does not claim a second physical ephemeris/model or a second human reviewer. Independence here is from generated candidate fields and production: fresh prose derivation, different first-principles day algorithm/epoch, fresh astronomy roots without candidate starting points, and published HKO cross-checks.

## Source table review

**60/60 reviewed, zero mismatches** against admitted extraction and all candidate target rows. Independent derivation: twelve-branch opposition; reverse四孟 starting亥; corrected reverse四仲 starting子; reverse四季 starting丑; explicit月徳 triplets丙/甲/壬/庚. No candidate lookup/target field was used to create this table.

| Month Jian | month-breaker | robbery-sha | disaster-sha | month-sha | month-virtue |
|---|---|---|---|---|---|
| 寅 | 申 | 亥 | 子 | 丑 | 丙 |
| 卯 | 酉 | 申 | 酉 | 戌 | 甲 |
| 辰 | 戌 | 巳 | 午 | 未 | 壬 |
| 巳 | 亥 | 寅 | 卯 | 辰 | 庚 |
| 午 | 子 | 亥 | 子 | 丑 | 丙 |
| 未 | 丑 | 申 | 酉 | 戌 | 甲 |
| 申 | 寅 | 巳 | 午 | 未 | 壬 |
| 酉 | 卯 | 寅 | 卯 | 辰 | 庚 |
| 戌 | 辰 | 亥 | 子 | 丑 | 丙 |
| 亥 | 巳 | 申 | 酉 | 戌 | 甲 |
| 子 | 午 | 巳 | 午 | 未 | 壬 |
| 丑 | 未 | 寅 | 卯 | 辰 | 庚 |

[卷四 月破](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷04) confirms opposition to月建; rendered paragraph163 independently read. [卷六](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷06), paragraphs159–167, independently confirms robbery reverse sequence; 天獄 starts子 and the editor accepts reversing四仲, then deletes duplicate天獄; 月煞/月殺/月虛 share the reverse四季 position. Frozen oldid787343 endpoint failed this fetch; accessible current primary transcription corroborates the admitted extraction, which was not edited. No new canonical facsimile collation claimed.

[卷五 月徳](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05), paragraph147, explicitly supports four triplets and heavenly stem operand. Separate月徳合 paragraph150 remains separate. No import of annual variants, 天火/PhiMa effects or legacy table. Alias identity is one canonical raw rule, not one match per spelling; it does not imply merging activity prose/scoring.

## Exact Jie review

**21/21 independently reviewed, zero mismatches.** Official sepl_18.se1 freshly downloaded to isolated/tmp directory; SHA256 ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66 equals recorded bytes. Actual header metadata441, library2.10.03, wrapper2.10.3.2; binary hash verified. [Official ephemeris README](https://github.com/aloistr/swisseph/blob/master/readme.md) corroborates the DE441 update and older-runtime compatibility.

New solver: built-in solcross from independently constructed first-of-month TT, then Newton correction using longitude speed until JD fixed. Candidate used bisection; its timestamps/brackets did not initialize review solver. Verified each new root's ±one-ULP bracket and re-evaluated every candidate bracket/residual with fresh data. Checked absent TRUEPOS/NONUT/J2000/HELCTR/TOPOCTR; [Swiss interface documentation](https://www.astro.com/swisseph/swephprg.htm) confirms apparent geocentric true-equinox-of-date definition. This agrees with the source-locked apparent solar convention, not a mean/geometric/heliocentric substitution.

Independent TT construction uses integer civil JDN plus UTC fraction and TT−UTC67.184s for2014,69.184s for2023–2025; checked recorded JDTT and round-trip conversion. FixedUTC+7 and+8 are absolute conversions, not machine-local defaults. No leap-second date occurs in sampled transitions.

Numerical comparison bound is calculated **before matching each root** from half of each verified bracket, two double-JD ULPs for UTC round-trip, plus1µs serialization. Maximum observed discrepancy41µs, at most one JD ULP after serialization. This is a numerical reproducibility bound, not a physical ephemeris accuracy claim or production tolerance. No tolerance was chosen from candidate pass/fail or widened after mismatch.

For the same validated serialized crossing event, equality belongs to NEW solely by frozen PROJECT convention [T,nextT). Astronomical floating-point calculation cannot establish physical microsecond truth. Event equivalence uses half of the declared0.1ms construction bracket plus independently measured JD precision; all ±1minute and midpoint discriminator samples are far outside that numerical uncertainty. Future production root disagreement still requires separate diagnosis; this review neither sets nor weakens runtime tolerances.

Every recomputed root corroborated by independently read HKO published minute: maximum absolute difference26.221359s. HKO precision is minute only, never exactT or a source to average. [2014 annual reference](https://www.hko.gov.hk/en/gts/astron2014/Solar_Term_2014.htm) plus monthly2023–2025 PDF rows/locations recorded in JSON. Four required early-year Jie, later years and2014regional-date trap included.

| Transition | Candidate UTC | Recomputed UTC | Recomputed − candidate seconds | HKO published minute | Result |
|---|---|---|---:|---|---|
| jie-2014-02 | 2014-02-03T22:03:16.684536Z | 2014-02-03T22:03:16.684536Z | +0.000000 | 2014-02-04T06:03:00+08:00 | MATCH |
| jie-2014-03 | 2014-03-05T16:02:15.805446Z | 2014-03-05T16:02:15.805486Z | +0.000040 | 2014-03-06T00:02:00+08:00 | MATCH |
| jie-2014-04 | 2014-04-04T20:46:39.787483Z | 2014-04-04T20:46:39.787442Z | -0.000041 | 2014-04-05T04:47:00+08:00 | MATCH |
| jie-2014-05 | 2014-05-05T13:59:26.221400Z | 2014-05-05T13:59:26.221359Z | -0.000041 | 2014-05-05T21:59:00+08:00 | MATCH |
| jie-2023-03 | 2023-03-05T20:36:14.214332Z | 2023-03-05T20:36:14.214332Z | +0.000000 | 2023-03-06T04:36:00+08:00 | MATCH |
| jie-2023-04 | 2023-04-05T01:13:03.657937Z | 2023-04-05T01:13:03.657937Z | +0.000000 | 2023-04-05T09:13:00+08:00 | MATCH |
| jie-2023-05 | 2023-05-05T18:18:45.556920Z | 2023-05-05T18:18:45.556920Z | +0.000000 | 2023-05-06T02:19:00+08:00 | MATCH |
| jie-2024-01 | 2024-01-05T20:49:22.512852Z | 2024-01-05T20:49:22.512852Z | +0.000000 | 2024-01-06T04:49:00+08:00 | MATCH |
| jie-2024-02 | 2024-02-04T08:27:07.611503Z | 2024-02-04T08:27:07.611543Z | +0.000040 | 2024-02-04T16:27:00+08:00 | MATCH |
| jie-2024-03 | 2024-03-05T02:22:46.184919Z | 2024-03-05T02:22:46.184919Z | +0.000000 | 2024-03-05T10:23:00+08:00 | MATCH |
| jie-2024-04 | 2024-04-04T07:02:17.672062Z | 2024-04-04T07:02:17.672102Z | +0.000040 | 2024-04-04T15:02:00+08:00 | MATCH |
| jie-2024-05 | 2024-05-05T00:10:05.052803Z | 2024-05-05T00:10:05.052803Z | +0.000000 | 2024-05-05T08:10:00+08:00 | MATCH |
| jie-2024-06 | 2024-06-05T04:09:53.688941Z | 2024-06-05T04:09:53.688941Z | +0.000000 | 2024-06-05T12:10:00+08:00 | MATCH |
| jie-2024-07 | 2024-07-06T14:20:03.398193Z | 2024-07-06T14:20:03.398153Z | -0.000040 | 2024-07-06T22:20:00+08:00 | MATCH |
| jie-2024-08 | 2024-08-07T00:09:16.449044Z | 2024-08-07T00:09:16.449004Z | -0.000040 | 2024-08-07T08:09:00+08:00 | MATCH |
| jie-2024-09 | 2024-09-07T03:11:20.866192Z | 2024-09-07T03:11:20.866152Z | -0.000040 | 2024-09-07T11:11:00+08:00 | MATCH |
| jie-2024-10 | 2024-10-07T18:59:57.335789Z | 2024-10-07T18:59:57.335829Z | +0.000040 | 2024-10-08T03:00:00+08:00 | MATCH |
| jie-2024-11 | 2024-11-06T22:20:04.521878Z | 2024-11-06T22:20:04.521878Z | +0.000000 | 2024-11-07T06:20:00+08:00 | MATCH |
| jie-2024-12 | 2024-12-06T15:17:02.605598Z | 2024-12-06T15:17:02.605558Z | -0.000040 | 2024-12-06T23:17:00+08:00 | MATCH |
| jie-2025-01 | 2025-01-05T02:32:46.338815Z | 2025-01-05T02:32:46.338855Z | +0.000040 | 2025-01-05T10:33:00+08:00 | MATCH |
| jie-2025-07 | 2025-07-06T20:04:59.099337Z | 2025-07-06T20:04:59.099296Z | -0.000041 | 2025-07-07T04:05:00+08:00 | MATCH |

## Day Ganzhi review

**156 unique civil dates, zero mismatches** in606 fixture components. Two independent strategies:

1. Visually read45 published HKO cells:24 selected2024 interior dates spanning all12Jian contexts, all12 2024 boundary dates,2014 March5/6 trap, separately selected2025Jan1 epoch,2025July7, and allfive leap-regression dates. PDF p.1 date-cell URLs and comparisons are in JSON.24interior dates are actual fixtures, not unrelated convenient dates.
2. Integer proleptic Gregorian JDN anchored independently at **2025-01-01庚午**, cycle6 in甲子=0 sequence, read from HKO January2025 cell1. Epoch JDN2460677. Compute n=(JDN(date)−JDN(epoch)+6)%60, stem=n%10, branch=n%12. This does not use construction's2014丁未 epoch or Gregorian date-delta algorithm, or production CanChi/JD code.

All130 unique interior dates and21 unique boundary civil dates computationally covered; leap and timezone samples included. +7civil date is determined after absolute offset conversion. Source HK dates are not blindly reused. No23:00day turnover introduced.

| Published cell date | HKO directly read | Independent JDN | Result |
|---|---|---|---|
| 2014-03-05 | 乙亥 | 乙亥 | MATCH |
| 2014-03-06 | 丙子 | 丙子 | MATCH |
| 2023-04-06 | 甲午 | 甲午 | MATCH |
| 2023-04-07 | 乙未 | 乙未 | MATCH |
| 2023-04-10 | 戊戌 | 戊戌 | MATCH |
| 2023-04-14 | 壬寅 | 壬寅 | MATCH |
| 2023-04-17 | 乙巳 | 乙巳 | MATCH |
| 2024-01-06 | 己巳 | 己巳 | MATCH |
| 2024-01-07 | 庚午 | 庚午 | MATCH |
| 2024-01-08 | 辛未 | 辛未 | MATCH |
| 2024-02-04 | 戊戌 | 戊戌 | MATCH |
| 2024-02-05 | 己亥 | 己亥 | MATCH |
| 2024-02-14 | 戊申 | 戊申 | MATCH |
| 2024-03-05 | 戊辰 | 戊辰 | MATCH |
| 2024-03-06 | 己巳 | 己巳 | MATCH |
| 2024-03-10 | 癸酉 | 癸酉 | MATCH |
| 2024-04-04 | 戊戌 | 戊戌 | MATCH |
| 2024-04-05 | 己亥 | 己亥 | MATCH |
| 2024-04-16 | 庚戌 | 庚戌 | MATCH |
| 2024-05-05 | 己巳 | 己巳 | MATCH |
| 2024-05-06 | 庚午 | 庚午 | MATCH |
| 2024-05-11 | 乙亥 | 乙亥 | MATCH |
| 2024-06-05 | 庚子 | 庚子 | MATCH |
| 2024-06-06 | 辛丑 | 辛丑 | MATCH |
| 2024-06-17 | 壬子 | 壬子 | MATCH |
| 2024-07-06 | 辛未 | 辛未 | MATCH |
| 2024-07-07 | 壬申 | 壬申 | MATCH |
| 2024-07-12 | 丁丑 | 丁丑 | MATCH |
| 2024-08-07 | 癸卯 | 癸卯 | MATCH |
| 2024-08-08 | 甲辰 | 甲辰 | MATCH |
| 2024-08-18 | 甲寅 | 甲寅 | MATCH |
| 2024-09-07 | 甲戌 | 甲戌 | MATCH |
| 2024-09-08 | 乙亥 | 乙亥 | MATCH |
| 2024-09-12 | 己卯 | 己卯 | MATCH |
| 2024-10-08 | 乙巳 | 乙巳 | MATCH |
| 2024-10-09 | 丙午 | 丙午 | MATCH |
| 2024-10-19 | 丙辰 | 丙辰 | MATCH |
| 2024-11-07 | 乙亥 | 乙亥 | MATCH |
| 2024-11-08 | 丙子 | 丙子 | MATCH |
| 2024-11-13 | 辛巳 | 辛巳 | MATCH |
| 2024-12-06 | 甲辰 | 甲辰 | MATCH |
| 2024-12-07 | 乙巳 | 乙巳 | MATCH |
| 2024-12-08 | 丙午 | 丙午 | MATCH |
| 2025-01-01 | 庚午 | 庚午 | MATCH |
| 2025-07-07 | 丁丑 | 丁丑 | MATCH |

## Stratified Golden review

Cheap independent recomputation covered the **entire606**, rather than only a smaller stratified subset. Each input instant → independently computed apparent longitude/Jie context → +7civil day → independent JDN stem/branch → prose-derived target → comparison; then candidate fields were compared. All606 MATCH, no MISMATCH or INSUFFICIENT_EVIDENCE. Classes/targets were not used as oracles.

| Rule | Records reviewed | Independent interior + / − | Jian coverage | Boundary records | Killer transitions | Mismatches |
|---|---:|---:|---:|---:|---:|---:|
| month-breaker | 121 | 26 / 26 | 12/12 | 63 | 3 | 0 |
| robbery-sha | 121 | 26 / 26 | 12/12 | 63 | 6 | 0 |
| disaster-sha | 121 | 26 / 26 | 12/12 | 63 | 2 | 0 |
| month-sha | 122 | 26 / 26 | 12/12 | 63 | 2 | 0 |
| month-virtue | 121 | 26 / 26 | 12/12 | 63 | 3 | 0 |

Every effective killer plus all remaining non-killer triples reviewed. Non-killer triples per rule:18/15/19/19/18, each exceeds requested3. Leap, HK-day, rounded-minute, all15 equivalent-offset records and month-sha alias-cardinality fixture included. Duplicate instants in representation/identity classes are distinct assertion contracts, not additional independent calendar dates.

## Boundary killer review

**16 reviewed, zero invalid.** Each verified same civil day operand, independently different old/new targets, and changed boolean at crossing. No decorative triple is counted as killer. t<T OLD, eventT NEW, t>T NEW is explicitly PROJECT COMPUTATIONAL CONVENTION; not verbatim ancient inequality language.

| Rule | Jie | Triple fixture IDs before / at / after | Old → new target | Independent boolean sequence |
|---|---|---|---|---|
| month-breaker | jie-2024-04 | month-breaker-083 / month-breaker-084 / month-breaker-085 | 酉 → 戌 | false → true → true |
| month-breaker | jie-2024-06 | month-breaker-089 / month-breaker-090 / month-breaker-091 | 亥 → 子 | false → true → true |
| month-breaker | jie-2025-07 | month-breaker-113 / month-breaker-114 / month-breaker-115 | 子 → 丑 | false → true → true |
| robbery-sha | jie-2014-03 | robbery-sha-056 / robbery-sha-057 / robbery-sha-058 | 亥 → 申 | true → false → false |
| robbery-sha | jie-2023-03 | robbery-sha-065 / robbery-sha-066 / robbery-sha-067 | 亥 → 申 | true → false → false |
| robbery-sha | jie-2023-04 | robbery-sha-068 / robbery-sha-069 / robbery-sha-070 | 申 → 巳 | false → true → true |
| robbery-sha | jie-2024-01 | robbery-sha-074 / robbery-sha-075 / robbery-sha-076 | 巳 → 寅 | true → false → false |
| robbery-sha | jie-2024-05 | robbery-sha-086 / robbery-sha-087 / robbery-sha-088 | 巳 → 寅 | true → false → false |
| robbery-sha | jie-2024-11 | robbery-sha-104 / robbery-sha-105 / robbery-sha-106 | 亥 → 申 | true → false → false |
| disaster-sha | jie-2014-04 | disaster-sha-059 / disaster-sha-060 / disaster-sha-061 | 酉 → 午 | false → true → true |
| disaster-sha | jie-2024-06 | disaster-sha-089 / disaster-sha-090 / disaster-sha-091 | 卯 → 子 | false → true → true |
| month-sha | jie-2024-04 | month-sha-083 / month-sha-084 / month-sha-085 | 戌 → 未 | true → false → false |
| month-sha | jie-2025-07 | month-sha-113 / month-sha-114 / month-sha-115 | 丑 → 戌 | true → false → false |
| month-virtue | jie-2014-02 | month-virtue-053 / month-virtue-054 / month-virtue-055 | 庚 → 丙 | false → true → true |
| month-virtue | jie-2024-06 | month-virtue-089 / month-virtue-090 / month-virtue-091 | 庚 → 丙 | true → false → false |
| month-virtue | jie-2024-12 | month-virtue-107 / month-virtue-108 / month-virtue-109 | 甲 → 壬 | true → false → false |

## Timezone review

15 Z/+07/+08 representations resolve to the same absolute epoch and same+7day operands/context/result. Allfive HK-day traps are true under+7and false if next HK civil date is wrongly reused. 2014KinhTrập is independently March5 23:02:15.805486+07, March6 00:02:15.805486+08. HKO March5 cell乙亥 and March6丙子 independently confirm the trap. Parsing uses explicit offsets and timezone conversion before date extraction; no machine-local timezone dependency.

## Leap regression review

HKO March/April2023 originals independently reread: leap second month starts March22; new moon01:23+08=00:23+07 is safely same civil date; April header閏二月小 and selected cells demonstrate leap2. Allfive selected dates fall in independently computed辰 Jian afterThanhMinh, while substituting lunar ordinal2 chooses卯. Each wrong lunar-month implementation gives false instead of true; fixtures discriminate, not merely exercise a leap flag. No leap lookup is introduced.

| Rule | Fixture | +7civil date | Correct Jian / lunarMonth substitute | Correct / wrong boolean |
|---|---|---|---|---|
| month-breaker | month-breaker-120 | 2023-04-10 | 辰 / 卯 | true / false |
| robbery-sha | robbery-sha-120 | 2023-04-17 | 辰 / 卯 | true / false |
| disaster-sha | disaster-sha-120 | 2023-04-06 | 辰 / 卯 | true / false |
| month-sha | month-sha-120 | 2023-04-07 | 辰 / 卯 | true / false |
| month-virtue | month-virtue-120 | 2023-04-14 | 辰 / 卯 | true / false |

## Dependency-lineage audit

- Primary opposition/逆行 sequences/month徳triplets → independent60-cell table → compare extraction and candidate targets.
- Official freshly downloadedDE441 + library-defined apparent coordinates → solcross/Newton from first-of-month + longitude at each input → compare candidateT/monthJian.
- Published HKO2025Jan1庚午 + integer Gregorian JDN → day operands → compare candidate fields;45printed cells cross-check.
- Independent context/day/target → equality → compare candidate booleans.

**Circular production dependencies found:0.** Review code has no production import/call, candidate context/expected is compared only after deriving components. Shared primary extraction and Swiss model are disclosed legitimate source reuse. Prior construction script/extraction provenance trace to primary text and independent calendar inputs; source rows freshly corroborate rather than being accepted because they match legacy. No assurance of auditing every historical author/tool environment beyond available artifacts is implied.

## Mutation design review

**10/10 REVIEW_PASS**, explicit independently evaluated arithmetic/cardinality counterexamples. These are static design proofs, not executed runtime mutations or a mutation score. The JSON stores every mapped correct/mutated comparison.

| Mutation | Independently confirmed fixture mapping | Correct / mutated | Verdict |
|---|---|---|---|
| M1 | month-breaker-120 (HKO April2023 leap2; source row2 卯 vs independently active 辰); robbery-sha-120 (HKO April2023 leap2; source row2 卯 vs independently active 辰); disaster-sha-120 (HKO April2023 leap2; source row2 卯 vs independently active 辰); month-sha-120 (HKO April2023 leap2; source row2 卯 vs independently active 辰); month-virtue-120 (HKO April2023 leap2; source row2 卯 vs independently active 辰) | true / false; true / false; true / false; true / false; true / false | REVIEW_PASS |
| M2 | month-breaker-083 (civil midnight switches already before astronomical event, same civil operand); robbery-sha-056 (civil midnight switches already before astronomical event, same civil operand); disaster-sha-059 (civil midnight switches already before astronomical event, same civil operand); month-sha-083 (civil midnight switches already before astronomical event, same civil operand); month-virtue-053 (civil midnight switches already before astronomical event, same civil operand) | false / true; true / false; false / true; true / false; false / true | REVIEW_PASS |
| M3 | month-breaker-084 (strict > keeps prior target at semantic T equality); robbery-sha-057 (strict > keeps prior target at semantic T equality); disaster-sha-060 (strict > keeps prior target at semantic T equality); month-sha-084 (strict > keeps prior target at semantic T equality); month-virtue-054 (strict > keeps prior target at semantic T equality) | true / false; false / true; true / false; false / true; true / false | REVIEW_PASS |
| M4 | month-breaker-001 (source MonthJian advanced one row); robbery-sha-001 (source MonthJian advanced one row); disaster-sha-001 (source MonthJian advanced one row); month-sha-001 (source MonthJian advanced one row); month-virtue-001 (source MonthJian advanced one row) | true / false; true / false; true / false; true / false; true / false | REVIEW_PASS |
| M5 | robbery-sha-001 (reverse); robbery-sha-001 (rotate1); robbery-sha-001 (rotate2); robbery-sha-001 (rotate3) | true / false; true / false; true / false; true / false | REVIEW_PASS |
| M6 | disaster-sha-015 (old rejected forward四仲 子卯午酉 versus corrected逆行) | true / false | REVIEW_PASS |
| M7 | month-sha-122 (canonical same identity 月煞/月殺/月虚; explicit cardinality assertion essential, not boolean-only) | 1 / 2 | REVIEW_PASS |
| M8 | month-virtue-001 (direct branch-vs-stem); month-virtue-001 (stem-index to branch-index) | true / false; true / false | REVIEW_PASS |
| M9 | month-breaker-119 (source +08 civil date advances day vs project+07); robbery-sha-119 (source +08 civil date advances day vs project+07); disaster-sha-119 (source +08 civil date advances day vs project+07); month-sha-119 (source +08 civil date advances day vs project+07); month-virtue-119 (source +08 civil date advances day vs project+07) | true / false; true / false; true / false; true / false; true / false | REVIEW_PASS |
| M10 | month-breaker-121 (published HKO minute independent source, midpoint on opposite side of exact root); robbery-sha-121 (published HKO minute independent source, midpoint on opposite side of exact root); disaster-sha-121 (published HKO minute independent source, midpoint on opposite side of exact root); month-sha-121 (published HKO minute independent source, midpoint on opposite side of exact root); month-virtue-121 (published HKO minute independent source, midpoint on opposite side of exact root) | false / true; true / false; true / false; true / false; false / true | REVIEW_PASS |

M7 needs identityContract count assertion: boolean-only test is insufficient. M5 explicitly covers reverse plus allthree nonzero rotations; M8 covers direct wrong operand and index substitution. No production mutant/test harness was implemented or run.

## Manifest/hash review

Allfive candidateSHA256 values and exact-evidenceSHA256 match manifest. Actual counts121/121/121/122/121 total606; independent interior/boundary/Jian/killer counts agree. authoritative=false, implemented=false, reviewStatus=awaiting-independent-review, presentationPolicy=PENDING. Noheaven-virtue evaluator Golden exists in group-b; excluded metadata is retained. All606provenance pointers/source row bindings/Jie IDs valid, source evidence present, productionUsed=false.

**413 protected baseline files unchanged** by SHA256: candidate/manifest/exact evidence/reviewer decision/extraction, production, GroupA and previousGolden inputs/reports. Full before hashes preserved in reviewJSON and rechecked after output creation. Baseline aggregateSHA256 6fa5d4378376840ff480f0ba4debb0d34aaff7b5954195716490fe373fb37887. No repairs or candidate status/hash edits. Prior Phase1/2.1/GroupA PASS retained without rerunning production tests.

## Findings

No material findings; zero HIGH-severity mismatch. Classification inventory GOLDEN_BUG/SOURCE_EXTRACTION_BUG/ASTRONOMY_EVIDENCE_BUG/CALENDAR_OPERAND_BUG/REVIEWER_CONVENTION_CONFLICT/PROVENANCE_GAP/HASH_OR_MANIFEST_BUG/UNKNOWN has zero confirmed failures.

Scoped limitations remain: same Swiss physical model with a different review solver, finite numericalT precision, no new complete facsimile collation, unavailable oldid endpoint during fresh corroboration, and not every day cell manually collated. They are disclosed and do not change independently verified raw expectations. ThiênĐức unresolved, UI/date-only policy PENDING, and Phase2.1 direction/28Tú provenance debt are excluded, not reasons to reject these five rules.

## Freeze recommendation

**APPROVE_GOLDEN_FREEZE.** Recommendation only: actual frozen hashes/status remain for a later explicitly authorized phase. Candidate files remain unchanged and non-authoritative. Stop here; no GroupB production/API, runtime tests/mutations, GroupC, ThiênĐức, UI policy, scoring or resolver work.
