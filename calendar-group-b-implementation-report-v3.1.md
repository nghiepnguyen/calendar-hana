# Phase 3B.4 Group B Implementation

## Freeze

FROZEN before production changes. Clean checkpoint `b24879b77797a29fdee10bc178acfa07cfeadab0`. Only manifest freeze metadata changed. Five Golden data files preserve original bytes and historical candidate headers; scoped authority comes from the frozen manifest. Eleven hashes recorded in calendar-group-b-golden-freeze-v3.1.md and tasks/calendar-audit/group-b-freeze-hashes.json. Phase 3B.3 review PASS and recommendation APPROVE_GOLDEN_FREEZE retained byte-identical.

## Files changed

Production: shared/lunar/groupB.ts (new), shared/lunar/index.ts (one export).
Tests/tooling: shared/lunar/groupB.test.ts (new), scripts/mutate-group-b.mjs (new), tasks/calendar-audit/group-b-freeze-hashes.json (new).
Freeze metadata: golden-v3/group-b/manifest.json only. Six requested report artifacts created. `graphify update .` completed with AST only: 426 files, 3,187 nodes, 5,636 edges and 203 communities; graphify-out reports, graph, manifest, lock and 35 new AST cache files updated. No legacy calculation, Phase 1/2.1 production, old Golden or prior review changed.

## Architecture

Small raw rule layer and instant-context adapter. Legacy stars.ts/stars.data.ts and UI call sites remain unchanged. No legacy prose/effects admitted by aliases. Rule source provenance means reviewed digital primary transcription; facsimile collation was not performed. Calculation verification is BLOCKED, not implied by source provenance.

## Runtime API

`evaluateGroupBAtInstant(instant, timezone, labels?)` returns context (instant, timezone, UTC+7 civilDate, Chinese monthJian/dayStem/dayBranch), exactly five canonical rules by default, and astronomyMethod. Optional labels select deduplicated identities. `evaluateGroupBContext(context, labels?)` is the deterministic raw layer; `normalizeGroupBRuleId(label)` normalizes admitted monthly aliases. Rejects implicit/unzoned instants, unsupported zones, out-of-range years and invalid operand symbols. Range 1900–2100; explicit Asia/Ho_Chi_Minh. API implemented but not verified for release because exact independent boundary gate fails.

## Rule table

Order 寅卯辰巳午未申酉戌亥子丑.

| Rule | Target rows | Operand |
|---|---|---|
| month-breaker | 申酉戌亥子丑寅卯辰巳午未 | DAY_BRANCH |
| robbery-sha | 亥申巳寅亥申巳寅亥申巳寅 | DAY_BRANCH |
| disaster-sha | 子酉午卯子酉午卯子酉午卯 | DAY_BRANCH |
| month-sha | 丑戌未辰丑戌未辰丑戌未辰 | DAY_BRANCH |
| month-virtue | 丙甲壬庚丙甲壬庚丙甲壬庚 | DAY_STEM |

## Alias normalization

月破→month-breaker; 劫煞/刼煞→robbery-sha; 災煞/月災煞/monthly天獄→disaster-sha; 月煞/月殺/月虚/月虛→month-sha; 月徳/月德→month-virtue. Vietnamese names and canonical IDs also normalize. Alias fixture month-sha-122 PASS, cardinality one. Monthly alias identity never merges effects or annual variants.

## Exact Jie / Month Jian integration

Reuses `getSolarMonth` and shared solarTerms.ts Astronomy Engine path, unchanged. [T,next T), t>=T NEW is PROJECT COMPUTATIONAL CONVENTION, not verbatim ancient wording. No hard-coded Golden dates, second astronomy engine, lunar-month fallback or tolerance.

**ROOT CAUSE: ASTRONOMICAL_MODEL_MISMATCH / BLOCKED_SPEC_CONFLICT.** Frozen exact instants are Swiss compressed JPL DE441 roots; required existing production uses Astronomy Engine's truncated VSOP87 model. Compatible apparent geocentric longitude definitions do not imply identical numerical crossing instants. All 21 roots differ (-18.835 to +21.044 seconds at millisecond resolution). Eight production roots are later than independent T: at frozen T they still select OLD Jian, causing 40 exact-boundary fixture failures. Two rounded-minute discriminator failures occur where production crosses early. The existing Phase2.1 inclusive-boundary properties verify behavior at that engine's own roots, and minute-resolution astronomical references do not establish DE441 instant equality.

Independent evidence: calendar-group-b-independent-review.json#/exactJie (fresh DE441 bytes/header/SHA256 and independent solcross/Newton), calendar-group-b-exact-jie-evidence.json (TT/UTC conversion, numerical brackets), HKO minute corroboration. Golden is not shown wrong. Production loses the frozen calculation gate; no Golden repair performed. Official Astronomy Engine documentation describes its [truncated VSOP87 model and ±1 arcminute design accuracy](https://github.com/cosinekitty/astronomy/blob/master/README.md), and [SearchSunLongitude's geocentric apparent-longitude definition](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#SearchSunLongitude). Finite numerical serialization must not be confused with physical or inter-model equality; JavaScript's <1ms fractional truncation does not account for measured second-level differences.

| Transition | EXPECTED Swiss DE441 UTC | ACTUAL production UTC | Delta seconds (ms resolution) |
|---|---|---|---:|
| jie-2014-02 | 2014-02-03T22:03:16.684536Z | 2014-02-03T22:03:04.781Z | -11.903 |
| jie-2014-03 | 2014-03-05T16:02:15.805446Z | 2014-03-05T16:01:56.970Z | -18.835 |
| jie-2014-04 | 2014-04-04T20:46:39.787483Z | 2014-04-04T20:46:27.245Z | -12.542 |
| jie-2014-05 | 2014-05-05T13:59:26.221400Z | 2014-05-05T13:59:24.306Z | -1.915 |
| jie-2023-03 | 2023-03-05T20:36:14.214332Z | 2023-03-05T20:36:20.289Z | +6.075 |
| jie-2023-04 | 2023-04-05T01:13:03.657937Z | 2023-04-05T01:13:07.237Z | +3.580 |
| jie-2023-05 | 2023-05-05T18:18:45.556920Z | 2023-05-05T18:18:31.575Z | -13.981 |
| jie-2024-01 | 2024-01-05T20:49:22.512852Z | 2024-01-05T20:49:19.758Z | -2.754 |
| jie-2024-02 | 2024-02-04T08:27:07.611503Z | 2024-02-04T08:26:49.630Z | -17.981 |
| jie-2024-03 | 2024-03-05T02:22:46.184919Z | 2024-03-05T02:22:28.877Z | -17.307 |
| jie-2024-04 | 2024-04-04T07:02:17.672062Z | 2024-04-04T07:02:14.725Z | -2.947 |
| jie-2024-05 | 2024-05-05T00:10:05.052803Z | 2024-05-05T00:10:08.464Z | +3.412 |
| jie-2024-06 | 2024-06-05T04:09:53.688941Z | 2024-06-05T04:09:54.092Z | +0.404 |
| jie-2024-07 | 2024-07-06T14:20:03.398193Z | 2024-07-06T14:20:07.101Z | +3.703 |
| jie-2024-08 | 2024-08-07T00:09:16.449044Z | 2024-08-07T00:09:30.136Z | +13.687 |
| jie-2024-09 | 2024-09-07T03:11:20.866192Z | 2024-09-07T03:11:41.910Z | +21.044 |
| jie-2024-10 | 2024-10-07T18:59:57.335789Z | 2024-10-07T19:00:06.976Z | +9.641 |
| jie-2024-11 | 2024-11-06T22:20:04.521878Z | 2024-11-06T22:19:55.550Z | -8.971 |
| jie-2024-12 | 2024-12-06T15:17:02.605598Z | 2024-12-06T15:16:48.690Z | -13.915 |
| jie-2025-01 | 2025-01-05T02:32:46.338815Z | 2025-01-05T02:32:41.099Z | -5.239 |
| jie-2025-07 | 2025-07-06T20:04:59.099337Z | 2025-07-06T20:04:51.895Z | -7.204 |


Example robbery-sha-066: EXPECTED Jian卯 / target申 / false; ACTUAL Jian寅 / target亥 / true at2023-03-06T03:36:14.214332+07. Production root03:36:20.289+07. ROOT CAUSE model crossing later; FIXED=false. All 42 mismatches have full EXPECTED/ACTUAL/ROOT CAUSE/FIXED and independent evidence in calendar-group-b-test-results-v3.1.json.

## Golden results

**564/606 PASS,42 FAIL.** All 606 exercised through actual production astronomy path; no skipped fixtures or expected transformations.

| Rule | Golden PASS / Total | FAIL |
|---|---:|---:|
| month-breaker | 113/121 | 8 |
| robbery-sha | 112/121 | 9 |
| disaster-sha | 113/121 | 8 |
| month-sha | 114/122 | 8 |
| month-virtue | 112/121 | 9 |


Interior positives130/130; negatives130/130; leap5/5; civil timezone traps5/5; equivalent forms15/15; alias1/1. Exact boundary275/315. Rounded-minute discriminators3/5. Killer transitions10/16 PASS; six fail.

## Property results

P1 PASS:144 crossings in six representative years,288 expect assertions; independent accuracy is a separate gate.
P2 FAIL:13/21 independent T triplets; eight fail exactly atT. T−1m andT+1m pass. No epsilon/tolerance changed.
P3–P7 PASS:720 valid source-month/sexagenary-day contexts;5,040 assertion calls /15,840 field checks.
P8 PASS:120 lunar ordinal/leap counterfactual assertions with fixed context.
P9 PASS:33 equivalent-instant/midnight assertions.
P10 PASS:17 alias normalization/selection assertions.
P11/P12 PASS:14 exclusions/output-shape assertions. Validation-input test also PASS (six assertions).

## Range invariants

1900-01-01 through2100-12-31 civil noon:73,414 days,587,313 actual assertion calls /1,321,453 individual field checks. PASS. Day arithmetic independently uses Gregorian epoch/JDN; target tables independently transcribed from admitted source rows. This is not a proof of exact DE441 boundary accuracy.

## Mutation results

Executed 10 categories / 13 variants. All 13 produce new failed assertions that passed in baseline, including named frozen witnesses. M5 reverse plus three rotations; M7 month-sha-122 duplicate canonical identity; M3 P1 actual engine-root equality; M10 actual crossing rounded before getSolarMonth comparisons, not display-only. For the M10 named witness month-breaker-121 at2024ThanhMinh, rounded production crossing07:02Z equals published HKO15:02+08, so the discriminator checks actual HKO-minute behavior. Other rounding/model combinations are not claimed identical to all HKO rows.

**Qualified mutation gate BLOCKED: unmutated baseline586/636 PASS,50 FAIL. Qualified KILLED0/10; diagnostic detections13/13 are not presented as a10/10 acceptance PASS.** Every source restored and SHA256 verified after each variant; fixture/test hashes immutable during run. Full actual failing test names, exit statuses, exact temporary diffs, restoration hashes and failure evidence in calendar-group-b-mutation-results-v3.1.json. Reproduce `node scripts/mutate-group-b.mjs`; runs all636 tests per variant, exits1 while baseline red. Intentional invalid behaviors exist only during serial temporary mutations, not final production.

## Legacy comparison

73,414 civil noons;15,479 boolean divergences, all MONTH_BASIS_DIFFERENCE; LOOKUP_DIFFERENCE0 for the compared raw predicates. Counts: month-breaker2985, robbery-sha2958, disaster-sha2981, month-sha2968, month-virtue3587. Tai Sát comparison uses legacy display “Phi Ma Sát (Tai Sát)” only for its predicate; no canonical admission of its name/effects. Legacy/UI unchanged. Detailed diagnostics in calendar-group-b-legacy-diff-v3.1.json.

## Full regression

Diagnostic full suite executed although Group B calculation acceptance gate stays closed. npm test:1954/2004 PASS,50 FAIL,0 skipped;114 files (113 PASS). All 1,368 existing tests PASS, including Phase1,Phase2.1,GroupA,Bazi,officers,mansions,gods,directions and app tests. Only newGroupB suite fails. Integration29/29 PASS across3 files. lint/typecheck/build PASS. E2E: FAIL — 482 PASS, 13 screenshot FAIL, 95 pre-existing project/platform skips; none added by this phase. Format FAIL: 642 warnings after graph update: 607 pre-existing style issues plus 35 generated AST cache files;606 warned files unchanged fromHEAD, frozen manifest retains baseline array-formatting failure. Original manifest independently fails current repository Prettier configuration. No protected Golden/review/manifest formatting edits after freeze. New source and report JSON formatting PASS when checked separately; frozen artifacts were not formatted. Exact commands/counts and any E2E errors in regression report/resultsJSON.

## Frozen hash verification

11/11 unchanged since freeze, including manifest. Five Golden data files unchanged from clean checkpoint. No production-generated expected values; no prior review overwritten. Snapshot/read-back hashes in resultsJSON.

## Remaining exclusions

Thiên Đức PARTIAL/UNRESOLVED excluded from new canonical evaluator; existing legacy Thiên Đức untouched. Thụ Tử/Sát Chủ/Tam Nương/GroupC, UI whole-day policy, activity resolver and scoring untouched.

## Verdict

**BLOCKED_SPEC_CONFLICT.** Five-rule evaluator and tests implemented; no verified release/PASS claim. Fixing table logic cannot eliminate a model-dependent astronomical equality disagreement. Strict frozen DE441 T equality plus mandatory current Astronomy Engine reuse/no second engine cannot all be satisfied as written. Needs an explicit model/precision compatibility decision or authorization to upgrade the single shared astronomy path, with Phase1/2.1 regression. No tolerance widening, Golden edit or per-date repair performed. Stop; no Thiên Đức or GroupC work.

## Output artifacts

- [calendar-group-b-golden-freeze-v3.1.md](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-golden-freeze-v3.1.md>)
- [calendar-group-b-implementation-report-v3.1.md](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-implementation-report-v3.1.md>)
- [calendar-group-b-test-results-v3.1.json](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-test-results-v3.1.json>)
- [calendar-group-b-mutation-results-v3.1.json](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-mutation-results-v3.1.json>)
- [calendar-group-b-legacy-diff-v3.1.json](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-legacy-diff-v3.1.json>)
- [calendar-group-b-regression-report-v3.1.md](</Users/nghiepnguyen/My Files/calendar-hana/calendar-group-b-regression-report-v3.1.md>)
