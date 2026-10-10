# Group B mutation test design — no runtime tests

Status: DESIGN_COMPLETE, 10/10 mutation categories mapped to concrete fixed candidate records. This is independent counterexample arithmetic and a future test plan, **not** an executed mutation score or a production PASS claim. No evaluator was modified, run or tested.

Future harness: read frozen candidate bytes; assert explicit Month Jian, day operand type/value, expected raw boolean, and where supplied canonical identity cardinality. Apply one mutant at a time to a later implementation; original must pass first, each named mutant must cause a failed assertion. Do not compute expected using the mutant or future API. Report survivors, do not skip/weaken tests. T/reference compatibility disputes must be investigated separately.

M1 use lunarMonth; M2 whole civil transition date midnight; M3 strict >; M4 +1 Month Jian; M5 reverse/rotate four-row robbery sequence; M6 rejected old forward Tai Sát; M7 double count月虚; M8 change stem to branch; M9 HKO date reuse; M10 HKO minute as exact T. M5 includes separate reverse and three nonzero rotations. M8 defines both direct wrong operand comparison and index substitution, rather than an unspecified mutation. M7 is raw canonical identity, not a score/resolver expectation.

| Mutation | Rule | Candidate fixture IDs | Required counterexample / future assertion |
|---|---|---|---|
| M1 | month-breaker | month-breaker-120 | Leap2 mapped as 卯 gives a different target from admitted 辰; observed 戌 equals 辰 target 戌. Expected true; lunar-month substitute false. |
| M2 | month-breaker | month-breaker-083 | At T−1m still 卯. Midnight replacement already chooses 辰 with same day operand. Expected False; mutant True. |
| M3 | month-breaker | month-breaker-084 | At T expected True using new month; strict > retains old and produces False. |
| M4 | month-breaker | month-breaker-001 | +1 Month Jian changes target in every row; positive becomes false. Include all twelve positive contexts for arbitrary single-row shift. |
| M9 | month-breaker | month-breaker-119 | 2024-01-08T23:30:00.000000+07:00 = 2024-01-09T00:30:00+08:00. +7 day is positive; reusing next HKO civil date advances operand one day and is false. |
| M10 | month-breaker | month-breaker-121 | Midpoint between independently solved T and HKO published minute; expected False, rounded-minute cutoff chooses 辰 and yields True. |
| M1 | robbery-sha | robbery-sha-120 | Leap2 mapped as 卯 gives a different target from admitted 辰; observed 巳 equals 辰 target 巳. Expected true; lunar-month substitute false. |
| M2 | robbery-sha | robbery-sha-056 | At T−1m still 寅. Midnight replacement already chooses 卯 with same day operand. Expected True; mutant False. |
| M3 | robbery-sha | robbery-sha-057 | At T expected False using new month; strict > retains old and produces True. |
| M4 | robbery-sha | robbery-sha-001 | +1 Month Jian changes target in every row; positive becomes false. Include all twelve positive contexts for arbitrary single-row shift. |
| M9 | robbery-sha | robbery-sha-119 | 2024-01-15T23:30:00.000000+07:00 = 2024-01-16T00:30:00+08:00. +7 day is positive; reusing next HKO civil date advances operand one day and is false. |
| M10 | robbery-sha | robbery-sha-121 | Midpoint between independently solved T and HKO published minute; expected True, rounded-minute cutoff chooses 卯 and yields False. |
| M1 | disaster-sha | disaster-sha-120 | Leap2 mapped as 卯 gives a different target from admitted 辰; observed 午 equals 辰 target 午. Expected true; lunar-month substitute false. |
| M2 | disaster-sha | disaster-sha-059 | At T−1m still 卯. Midnight replacement already chooses 辰 with same day operand. Expected False; mutant True. |
| M3 | disaster-sha | disaster-sha-060 | At T expected True using new month; strict > retains old and produces False. |
| M4 | disaster-sha | disaster-sha-001 | +1 Month Jian changes target in every row; positive becomes false. Include all twelve positive contexts for arbitrary single-row shift. |
| M9 | disaster-sha | disaster-sha-119 | 2024-01-16T23:30:00.000000+07:00 = 2024-01-17T00:30:00+08:00. +7 day is positive; reusing next HKO civil date advances operand one day and is false. |
| M10 | disaster-sha | disaster-sha-121 | Midpoint between independently solved T and HKO published minute; expected True, rounded-minute cutoff chooses 卯 and yields False. |
| M1 | month-sha | month-sha-120 | Leap2 mapped as 卯 gives a different target from admitted 辰; observed 未 equals 辰 target 未. Expected true; lunar-month substitute false. |
| M2 | month-sha | month-sha-083 | At T−1m still 卯. Midnight replacement already chooses 辰 with same day operand. Expected True; mutant False. |
| M3 | month-sha | month-sha-084 | At T expected False using new month; strict > retains old and produces True. |
| M4 | month-sha | month-sha-001 | +1 Month Jian changes target in every row; positive becomes false. Include all twelve positive contexts for arbitrary single-row shift. |
| M9 | month-sha | month-sha-119 | 2024-01-17T23:30:00.000000+07:00 = 2024-01-18T00:30:00+08:00. +7 day is positive; reusing next HKO civil date advances operand one day and is false. |
| M10 | month-sha | month-sha-121 | Midpoint between independently solved T and HKO published minute; expected True, rounded-minute cutoff chooses 辰 and yields False. |
| M1 | month-virtue | month-virtue-120 | Leap2 mapped as 卯 gives a different target from admitted 辰; observed 壬 equals 辰 target 壬. Expected true; lunar-month substitute false. |
| M2 | month-virtue | month-virtue-053 | At T−1m still 丑. Midnight replacement already chooses 寅 with same day operand. Expected False; mutant True. |
| M3 | month-virtue | month-virtue-054 | At T expected True using new month; strict > retains old and produces False. |
| M4 | month-virtue | month-virtue-001 | +1 Month Jian changes target in every row; positive becomes false. Include all twelve positive contexts for arbitrary single-row shift. |
| M9 | month-virtue | month-virtue-119 | 2024-01-07T23:30:00.000000+07:00 = 2024-01-08T00:30:00+08:00. +7 day is positive; reusing next HKO civil date advances operand one day and is false. |
| M10 | month-virtue | month-virtue-121 | Midpoint between independently solved T and HKO published minute; expected False, rounded-minute cutoff chooses 寅 and yields True. |
| M5 | robbery-sha | robbery-sha-001,robbery-sha-002,robbery-sha-007,robbery-sha-008,robbery-sha-009,robbery-sha-012,robbery-sha-015,robbery-sha-016,robbery-sha-019,robbery-sha-020,robbery-sha-023,robbery-sha-024,robbery-sha-027,robbery-sha-028,robbery-sha-029,robbery-sha-032,robbery-sha-034,robbery-sha-036,robbery-sha-039,robbery-sha-040,robbery-sha-043,robbery-sha-044,robbery-sha-047,robbery-sha-048,robbery-sha-049,robbery-sha-052 | Reverse source period [亥,申,巳,寅] -> [寅,巳,申,亥], or rotate by 1/2/3 rows: positives become false. Test each nonzero rotation separately; reversing after rotating can retain some rows, therefore use all twelve contexts. |
| M6 | disaster-sha | disaster-sha-015 | Corrected 月天獄/災煞 卯 target酉 is positive; old forward 四仲 variant [子,卯,午,酉] gives卯 and false. First 寅 row alone would not detect this mutation. |
| M7 | month-sha | month-sha-122 | inputLabels月煞/月殺/月虚 have exactly one canonical month-sha match. Adding separate 月虚 record yields count2 or3 and violates identityContract. Boolean-only assertions cannot kill this mutation; identity cardinality assertion is mandatory. |
| M8 | month-virtue | month-virtue-001 | Observed day stem丙 equals target丙, expected true. Comparing day branch with stem target is false. If mutant translates stem index to branch, 寅 differs from reviewed 丙辰 daybranch辰. Assert target operandType DAY_STEM as well. |

All five rules have an effective same-day cutoff triple; every M1/M2/M3/M4/M9/M10 class maps each affected rule. M5–M8 map their specific rule. Alias record has independent canonical identity evidence from admitted source extraction, not a runtime result. No decorative triple is used as the sole cutoff killer. Future mutation execution remains NOT_RUN by phase scope.
