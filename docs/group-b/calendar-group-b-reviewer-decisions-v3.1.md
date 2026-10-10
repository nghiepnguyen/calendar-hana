# Group B reviewer decisions v3.1

Decision: GROUP_B_MONTH_JIAN_CUTOFF_V3_1. Frozen 2026-10-08 by the explicit Phase 3B.2 reviewer instruction.

Scope: raw month-breaker, robbery-sha, disaster-sha, month-sha and month-virtue calculation only.

SOURCE SUPPORTS: before crossing retains prior seasonal/month context; monthly 吉凶神煞 commence after crossing. Evidence: Miao historical facsimile PDF pp.51,55–56, recorded in calendar-group-b-cutoff-resolution.md. Not a verbatim XJBF equality rule.

PROJECT DEFINES: non-overlapping half-open Jie intervals [T,next T). t<T uses old Month Jian; t>=T uses new. At T−1m OLD, T NEW, T+1m NEW. Classification: PROJECT COMPUTATIONAL CONVENTION.

Absolute astronomical instants are translated to Asia/Ho_Chi_Minh UTC+7. Civil day stem/branch follows 00:00-civil, proleptic Gregorian (original validation spec §2), not a 23:00 Bazi mode. Source regional clocks are not silently assigned IANA zones.

Presentation remains PENDING: no whole-day UI labels, date-only API or historical printed label convention is defined. Lunar month number/leap flag are not operands.

Thiên Đức excludedFromGolden=true; PARTIAL/UNRESOLVED because four trigram/direction DAY semantics remain unresolved. Other five rules do not depend on resolving it. No named branch reconstruction selected.

Known limitations: independent numerical ephemeris precision differs from physical certainty; HKO published minute is corroboration only. Exact astronomical definition compatibility must be checked before boundary construction. Candidate Golden requires independent review and does not authorize production implementation.
