# Calendar V3 — Fixture review

Phase 3A extraction and fixture construction complete. **Candidate package awaiting user review; no production implementation authorized or performed.**

VERIFIED (primary-transcription extraction): yue-ji, four-separations, four-extinctions.
PARTIAL: month-breaker, robbery-sha, disaster-sha, month-sha, month-virtue, heaven-virtue.
UNVERIFIED: thu-tu, sat-chu, tam-nuong.
PENDING: all six PARTIAL rules plus all three VN extensions; none enter authoritative Golden.

| Rule | Source | Provenance | Golden Eligible | Positive | Negative | Boundary | Confidence |
|---|---|---|---|---|---|---|---|
| Nguyệt Kỵ | XJBF_QD | VERIFIED | true | 8 | 16 | 6 | HIGH |
| Tứ Ly | XJBF_QD | VERIFIED | true | 12 | 26 | 26 | HIGH |
| Tứ Tuyệt | XJBF_QD | VERIFIED | true | 12 | 26 | 26 | HIGH |
| Nguyệt Phá | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Kiếp Sát | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Tai Sát | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Nguyệt Sát | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Nguyệt Đức | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Thiên Đức | XJBF_QD | PARTIAL | false | 0 | 0 | 0 | MEDIUM |
| Thụ Tử | VN_TRADITION_EXTENSION | UNVERIFIED | false | 0 | 0 | 0 | LOW |
| Sát Chủ | VN_TRADITION_EXTENSION | UNVERIFIED | false | 0 | 0 | 0 | LOW |
| Tam Nương | VN_TRADITION_EXTENSION | UNVERIFIED | false | 0 | 0 | 0 | LOW |

100 date/instant records total: Nguyệt Kỵ24, Tứ Ly38, Tứ Tuyệt38. Boundary counts overlap positive/negative counts. Group B contains 136 **non-authoritative symbolic** anchors in extraction JSON (24 each except Thiên Đức16); no Group B date-Golden files exist.

## Coverage and expected origin

- Nguyệt Kỵ: required days5/14/23 positive, 4/6/13/15/22/24 negative, in both normal and leap months; lunar-year boundary; UTC+7 midnight entering/leaving day5.
- Tứ Ly/Tứ Tuyệt: all four respective source-defined terms independently anchored to HKO2014; D-2/D-1/D; civil midnight start/end; published transition −1min/at/+1min; civil-year boundary negatives.
- Solar rules do not depend on lunar/leap-month fields; leap mutation invariance is in the property specification. No unsupported leap-month policy added to Group B.
- HKO references are minute precision, not exact sub-second instants. Future runtime boundaries must use the previously verified exact engine; independent reference date uncertainty is explicit.
- Every record includes locked primary rule provenance and independent context provenance. `reviewStatus` explicitly awaits user fixture review.

## Property / invariant / mutation test specification

### Nguyệt Kỵ

- For day 1..30 in every normal/leap month and year: match iff day is 5,14,23. Invalid lunar dates rejected by context validation, not interpreted as unmatched.
- Hold lunar day constant while varying weekday, Gregorian day, lunar month/year/leap flag: raw match unchanged.
- Across UTC+7 23:59:59→00:00:00 at lunar 4→5 and 5→6, use new civil lunar day exactly at midnight.
- Keep raw match separate from activity effects; no all-activities avoid inference.
- Canonical ID yue-ji deduplicates aliases; each admitted output carries sourceId/ruleVersion/evidence.

- Mutation: Change day set 5→6. Detection: Independent normal/leap fixtures at days 5 and 6 must both fail.
- Mutation: Use Gregorian day instead of lunar day. Detection: Positive 2024-03-03 (lunar23) and 2023-03-26 (leap lunar5) become false if Gregorian days3/26 are used.
- Mutation: Ignore leap months. Detection: 2023-03-26, 2023-04-04 and 2023-04-13 positive leap fixtures fail.

### Tứ Ly

- 1900–2100: use existing exact transition engine for context ONLY; independent rule definition and HKO fixtures remain the oracle.
- For each of four relevant terms per year: D-2=false, D-1=true, D=false, all civil UTC+7.
- At D-1 midnight=true, D-1 23:59:59=true, D midnight=false. At transition -1min/exact/+1min no instant toggle: normally all on D and unmatched; if -1min falls on D-1 it must match.
- Non-relevant terms must not create raw matches. Match is invariant to lunar day, leap flag and day stem/branch for fixed civil date and transitions.
- At most four distinct matched civil dates/year; do not reset or miscount at civil-year boundaries.
- Same absolute instant represented by Z versus +07 must give same UTC+7 result; never derive D from a substring of source +08 timestamp.
- Compare existing exact engine transition with independently published minute reference using existing 60-second reference policy; do not claim published minute as exact to milliseconds.
- Deduplicate aliases into canonical rule ID; every record includes rule and context provenance.

- Mutation: Replace relevant longitude 0 with 315. Detection: Frozen equinox/solstice vs four-start positive anchors distinguish the two rules.
- Mutation: Shift civil-day offset -1→0. Detection: D-1 positive and D negative fixtures must fail.
- Mutation: Subtract rolling 24h instead of civil day. Detection: D-1 midnight and D midnight fixtures fail; no moving instant window.
- Mutation: Use Hong Kong UTC+8 transition day. Detection: Tứ Ly spring2014: HKO March21 00:57 → VN March20 23:57, so matched date is March19, not March20.

### Tứ Tuyệt

- 1900–2100: use existing exact transition engine for context ONLY; independent rule definition and HKO fixtures remain the oracle.
- For each of four relevant terms per year: D-2=false, D-1=true, D=false, all civil UTC+7.
- At D-1 midnight=true, D-1 23:59:59=true, D midnight=false. At transition -1min/exact/+1min no instant toggle: normally all on D and unmatched; if -1min falls on D-1 it must match.
- Non-relevant terms must not create raw matches. Match is invariant to lunar day, leap flag and day stem/branch for fixed civil date and transitions.
- At most four distinct matched civil dates/year; do not reset or miscount at civil-year boundaries.
- Same absolute instant represented by Z versus +07 must give same UTC+7 result; never derive D from a substring of source +08 timestamp.
- Compare existing exact engine transition with independently published minute reference using existing 60-second reference policy; do not claim published minute as exact to milliseconds.
- Deduplicate aliases into canonical rule ID; every record includes rule and context provenance.

- Mutation: Replace relevant longitude 315 with 0. Detection: Frozen equinox/solstice vs four-start positive anchors distinguish the two rules.
- Mutation: Shift civil-day offset -1→0. Detection: D-1 positive and D negative fixtures must fail.
- Mutation: Subtract rolling 24h instead of civil day. Detection: D-1 midnight and D midnight fixtures fail; no moving instant window.
- Mutation: Use Hong Kong UTC+8 transition day. Detection: Timezone metamorphic tests and a future independently sourced crossing in the UTC+7/UTC+8 date-divergence window are required; current four start anchors do not kill this mutation alone.

### Nguyệt Phá

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

### Kiếp Sát

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

### Tai Sát

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

### Nguyệt Sát

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

### Nguyệt Đức

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

### Thiên Đức

- After basis review: enumerate full 12 source-month contexts × 12 day branches or ×10 day stems; canonical enum outputs only.
- For four-month tables assert m and m+4 have same symbolic target; month-breaker assert opposition is involutive.
- Do not assert date-based PASS until month-context/transition/leap policy admitted.
- Heaven-virtue months2,5,8,11 remain unresolved mixed trigram operands; do not replace them with chosen branches.

- Mutation: Alter first symbolic month target to a different target. Detection: Source-based month1 positive and negative symbolic anchors must fail; these are candidate anchors, not date-Golden evidence.

## Gate status

- Gate A (source): PASS for admitted Group A at primary-transcription level; facsimile collation remains unperformed. Group B/C pending.
- Gate B (rule): fixture structure/context consistency validated; production evaluator/property/mutation execution is **NOT RUN**, because this request stops before implementation. Do not claim V3 engine PASS.
- Gate C (activity): only directly supported travel effect recorded; other effects unadmitted.
- Gate D (conflict): policy specified; resolver **NOT IMPLEMENTED/NOT TESTED**.
- Gate E (safety): protected file hashes unchanged; no production output oracle, majority voting, scoring, migration or per-date production exceptions.

## Validation performed

JSON parse, rule count12, admitted/pending partition3+9, fixture count100, unique fixture IDs, positive/negative presence, required provenance, fixed UTC+7 context dates, primary-rule consistency and protected file SHA256 verification. These validate the candidate artifacts only. No Phase1/2.1 or production test suites rerun.

Validation evidence: `tasks/calendar-audit/v3a-artifact-validation.json`; protected before/after hashes: `tasks/calendar-audit/v3a-protected-hashes.json`.

## Stop

Stop at this package. User review of candidate Golden is required before any subsequent production implementation. Unresolved provenance/basis is a legitimate result; no pending rule was unlocked.
