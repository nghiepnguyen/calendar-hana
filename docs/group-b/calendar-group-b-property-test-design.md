# Group B property test design — design only

No runtime API, production test or property generator is implemented. Future tests use independently reviewed frozen candidates, source symbolic rows, and exact evidence. Distinguish astronomical correctness from rule arithmetic and equality semantics.

## A. Month Jian switch

For each of 21 reference transitions assert old at T−1m, new at T, new at T+1m; target equality follows PROJECT convention [T,next T). Test same-day killers specified in mutation report so cutoff error changes actual booleans. Also exercise t just inside each independent TT bracket after reference precision is reviewed; do not widen tolerances to make production pass. Every interval must be nonoverlapping and contiguous. No civil-midnight substitution.

## B. Month-breaker opposition

Enumerate twelve source Jian rows; target branch is six steps opposite in source branch order, applying opposition twice returns original. Independently frozen 26 positive and 26 negative interior records include all twelve rows; compare actual target and raw result, not merely result count.

## C. Three-sha monthly sequence

From primary extraction: robbery 亥申巳寅, corrected disaster 子酉午卯, month-sha 丑戌未辰 repeat after four Jian positions. Enumerate twelve branches, both positives and operand mismatches; no use of rejected forward Tai Sát, 天火/Phi Ma or annual/monthly identity mixing. 月煞/月殺/月虚 normalize to one canonical month-sha match, monthly天獄 to disaster-sha; no duplicate aliases, no scoring or global auspicious verdict.

## D. Month Virtue remains DAY_STEM

Source targets 丙甲壬庚 repeat every four Jian positions. Enumerate ten day stems while branch varies only through valid sexagenary pairings; changing branch with identical stem/context cannot change this rule. Verify operandType DAY_STEM and keep月德合 a separate identity. Positive source anchors expose both direct branch-vs-stem and index-remapping mutants.

## E. Lunar metadata independence

Each rule contains a positive independently established 2023 leap2 date in solar Jian辰, where using lunar ordinal2/卯 would be negative. Hold absolute instant, monthJian and valid day operands fixed while changing lunarMonth/isLeapMonth metadata: raw result stays identical, including removing unused metadata if future context permits. Do not generate a special leap lookup, or claim an altered lunar annotation is an actual historical calendar date. The counterfactual only tests unused-input invariance.

## F. Absolute-instant timezone consistency / civil rollover

Every rule includes Z/+07/+08 forms of an effective killer T. Assert same absolute epoch, Month Jian, +7 civil date/day stem/day branch and raw result. HKO 00:30+08 = previous date23:30+07 positive fixtures specifically expose source-date reuse. Future day-boundary property: +7 23:59:59 -> 00:00 changes day cycle by one, leaves Jian unchanged unless a Jie actually occurs there. Do not infer traditional23:00 rollover. Near-midnight 2014 Kinh Trập crosses on March5+7 versus March6+8.

## Future execution gate

Validate candidate hashes/provenance before running. First pass independent review and freeze; only in a later explicitly authorized implementation phase create tests, establish RED against known wrong behavior and run mutation variants. Do not regenerate expected from production, majority websites or rounded HKO values. This design does not declare production readiness or resolve date-only UI presentation.
