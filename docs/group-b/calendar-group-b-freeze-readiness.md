# Group B freeze readiness — Phase 3B.3

**Verdict: PASS. Recommendation: APPROVE_GOLDEN_FREEZE.** Recommendation only; no actual freeze, status changes or production work performed.

| Gate | Result | Evidence |
|---|---|---|
| Source60/60 | PASS;0mismatches | primary prose independently re-derived all60symbolic cells; fresh canonical transcription corroboration |
| ExactJie | PASS;21/21,0mismatches | fresh officialDE441 bytes/header/hash; solcross/Newton instead of candidate bisection; maximum41µs numeric difference; HKO corroboration |
| DayGanzhi | PASS;156civil dates,0mismatches |45published cells; independent integerJDN anchored2025Jan1庚午;24interior/all12contexts,21boundary dates, leap/trap |
| Golden sample | PASS;606/606,0mismatches | allrecords independently recomputed, includes each required stratum |
| Boundary killers | PASS;16/16,0invalid | different old/new source targets and changed independent boolean; additional15–19non-killer triples/rule |
| Timezone | PASS |15equivalent Z/+07/+08 records; fiveHKcivil-day traps;2014KinhTrập |
| Leap regression | PASS;5/5 discriminating | HKO2023leap2 dates in independently active辰; lunarMonth→卯 gives opposite boolean |
| Dependency independence | PASS;0circular dependencies found | primary→rule table; fresh astronomy→Jian; separate HKOepoch/JDN→Ganzhi; compare candidate last |
| Mutation design | PASS;10/10 effective mappings | independently calculated static counterexamples; runtime mutationNOT_RUN; M7 requires canonical count |
| Hash/manifest | PASS |606count and declaredSHA256/statuses correct;413protected hashes unchanged;ThiênĐứcexcluded |

Full record-level evidence and baseline hashes: calendar-group-b-independent-review.json. Source table,21root comparisons,45printed-cell comparisons,16killers and mutation mappings: calendar-group-b-independent-review.md.

Finite ephemeris/numerical precision is explicitly disclosed: atT is reviewed model-event equality under PROJECT convention[T,nextT), not a physical microsecond claim or newly approved runtime tolerance. Same Swiss physical model is reused with independent solver/starts; HKO is a second lower-precision source, never exactT. No material mismatch found.

Safety: production, candidateGolden, exact evidence, reviewer decision, extraction,GroupA,V1/V2.1 unchanged. No Golden repair, runtime mutation, production tests, UI policy, scoring/resolver, ThiênĐức or GroupC work. Actual authoritative freeze and implementation require a later phase. STOP.
