# Group B Golden candidate review — Phase 3B.2

Recommendation: **READY_FOR_INDEPENDENT_GOLDEN_REVIEW**. Candidate construction self-audit passed; production correctness and mutation execution have NOT been tested. All new Golden files remain authoritative=false, reviewStatus=awaiting-independent-review, implemented=false.

## Reviewer decision

GROUP_B_MONTH_JIAN_CUTOFF_V3_1 frozen 2026-10-08 in calendar-group-b-reviewer-decisions-v3.1.md. SOURCE SUPPORTS before/after crossing; PROJECT DEFINES [T,next T), with equality selecting new month. Raw calculation only. +7 midnight day boundary is original validation-spec convention; UI/date-only presentation remains PENDING.

## Exact Jie evidence

21 independent transitions, all12 Jie types, 4 calendar years: Swiss apparent geocentric longitude with actual compressed JPLDE441 data, flags checked, TT solve <=0.1ms numerical bracket, UTC conversion and full trace in exact-jie-evidence JSON/review. Definition compatibility documented against official upstream methods. Every T corroborated by HKO published minute, max discrepancy26.2214s. HKO reference is never exact T. 2014 KinhTrập detects adjacent regional dates. No production astronomical result was inspected or used to generate expectations.

## Rule fixture counts

| Rule | Interior + | Interior - | Month Jian coverage | Boundary | Killer boundary | Leap regression | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| month-breaker | 26 | 26 | 12/12 | 63 | 3 transitions | 1 | CANDIDATE ready for independent review |
| robbery-sha | 26 | 26 | 12/12 | 63 | 6 transitions | 1 | CANDIDATE ready for independent review |
| disaster-sha | 26 | 26 | 12/12 | 63 | 2 transitions | 1 | CANDIDATE ready for independent review |
| month-sha | 26 | 26 | 12/12 | 63 | 2 transitions | 1 | CANDIDATE ready for independent review |
| month-virtue | 26 | 26 | 12/12 | 63 | 3 transitions | 1 | CANDIDATE ready for independent review |

Total606 fixtures: month-breaker121, robbery-sha121, disaster-sha121, month-sha122, month-virtue121. Each has63 boundary records (21 triples), three offset-equivalent records, one HKO-day trap, one leap regression and one HKO-minute discriminator. Month-sha additionally has one canonical alias-cardinality record. Interior counts include four reviewed2014 anchors plus two positive/two mismatch negatives for every 2024 Jian interval. Duplicate absolute instants in representation/identity classes are intentional distinct contracts, not additional independent anchors.

Effective same-day boundary triples (old result differs from new):

- month-breaker: month-breaker-083/month-breaker-084/month-breaker-085; month-breaker-089/month-breaker-090/month-breaker-091; month-breaker-113/month-breaker-114/month-breaker-115.
- robbery-sha: robbery-sha-056/robbery-sha-057/robbery-sha-058; robbery-sha-065/robbery-sha-066/robbery-sha-067; robbery-sha-068/robbery-sha-069/robbery-sha-070; robbery-sha-074/robbery-sha-075/robbery-sha-076; robbery-sha-086/robbery-sha-087/robbery-sha-088; robbery-sha-104/robbery-sha-105/robbery-sha-106.
- disaster-sha: disaster-sha-059/disaster-sha-060/disaster-sha-061; disaster-sha-089/disaster-sha-090/disaster-sha-091.
- month-sha: month-sha-083/month-sha-084/month-sha-085; month-sha-113/month-sha-114/month-sha-115.
- month-virtue: month-virtue-053/month-virtue-054/month-virtue-055; month-virtue-089/month-virtue-090/month-virtue-091; month-virtue-107/month-virtue-108/month-virtue-109.

## Independence audit

| Expected component | Independent oracle | Production used |
|---|---|---|
| Month Jian | Swiss DE441 exact Jie + admitted Jian order + reviewer interval convention | false |
| Day Ganzhi | HKO丁未 epoch + Python Gregorian day arithmetic, corroborated in2023/2024/2025 | false |
| Rule target | primary XJBF source-extraction symbolic rows, never legacy runtime table | false |
| Raw boolean | equality of preceding independently established operand/target | false |
| Leap metadata | HKO March/April2023 calendars/new-moon row | false |
| Alias identity | admitted月煞/月殺/月虚 source relation, one canonical record | false |

Independent arithmetic is a derived oracle, not an ancient dated star-label claim. Earlier extraction field calendarContextBinding=PENDING is intentionally unchanged; new reviewer decision supplies candidate binding. Original records/reports are protected instead of retrospectively rewritten.

## Provenance audit

Every606 record has instant, explicit timezone, monthJian/dayStem/dayBranch/civilDate, expected boolean, operandType/observed/target/sourceRow/comparison, source-extraction JSON pointer, primary evidence URLs, calendar derivation/corroborations, Jie evidence IDs, fixture class/confidence and productionUsed=false. Numerical evidence contains ephemeris/runtime versions, actual data441 identity, data/binarySHA256, TT brackets/residuals, HKO source locations/time precision/differences. Candidate hashes in manifest pin all five Golden files and exact evidence.

Limitations retained: primary-work digital transcription is not a new facsimile collation; physical ephemeris certainty is not numerical serialization precision; day operands are independently propagated/corroborated, not all individually visually collated. Candidates await independent review. Direction provenance/28Tú provenance from Phase2.1 remain unchanged; no invented metadata.

## Mutation coverage

10/10 required mutation categories have concrete fixture mappings and independently derived counterexamples in calendar-group-b-mutation-test-design.md. Every cutoff-family mutant maps all five rules. M7 requires canonical match-count assertion supplied by identityContract; a boolean-only test would be insufficient. Mutation design is complete; executed production mutation score=NOT_RUN. Property design covers six requested families, no runtime tests added.

## Remaining blockers

Independent reviewer must approve ephemeris/reference precision, all twelve source rows and candidate provenance before authoritative freeze or production work. Whole-day UI/date-only semantics remain PENDING. heaven-virtue=PARTIAL/UNRESOLVED, excludedFromGolden=true: four canonical trigram/direction DAY semantics unresolved. No evaluator Golden file for it; it does not block these five candidates. Phase1/2.1/GroupA priorPASS preserved, not rerun or relabelled as new verification.

## Recommendation

READY_FOR_INDEPENDENT_GOLDEN_REVIEW; not production authorization. Stop after construction and self-audit. No evaluator/API, runtime test, stars.ts migration, lunar lookup replacement, UI, scoring/resolver, GroupC or ThiênĐức implementation.

## Safety and protected hashes

398 protected preexisting files unchanged by SHA256 (production shared/src/functions, existing GoldenV3 and calendar research/report files, Downloads calendar inputs including V1/V2.1). Protected baseline aggregateSHA256 ab64f215bf1e331a909cca3aa3761cb919f431eca6acdc9e5d2cb60430df3824. Source datasets, expected values, registry/extraction and previous research reports untouched. Only the twelve requested new artifacts created; preexisting untracked research/graph files left intact. No production-derived expected, majority-web authority, rounded-minute exactT, UI policy or score inference. No code modified; graphify AST update not needed for research/JSON artifacts. JSON/provenance/hash/counterexample self-audit and git diff --check completed separately from production testing.
