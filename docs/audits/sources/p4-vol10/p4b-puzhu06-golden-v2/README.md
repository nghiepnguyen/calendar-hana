# puzhu:06 Golden v2 (task 3.5)

Index: `shared/almanac-data/golden-p4b-puzhu06-v2.json`, status `HASH_LOCKED_PRE_IMPLEMENTATION`. Generator: `derive.py`, a copy of the v1 derive with the Q4a change. Gate: `shared/lunar/p4Puzhu06GoldenV2.test.ts`.

Commands:
- `python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v2/derive.py` verifies bytes.
- Add `--write` to regenerate.

- Authority: `p4b-puzhu06-v2`. Owner answers: Q1 no, Q2 no, Q3 no, Q4 yes, Q4a block (2026-10-16).
- Golden v1 (`4a7da71`) stays frozen and is pinned as `parent`. Its `dated.tsv` is an input only for the v1 → v2 diff check.
- Independence and frozen inputs are the same as in v1 (see the v1 README).

## Change from v1

- A Q4 god kept on a puzhu:06 day lifts only if some trigger present on the day is not excluded for that god. For 五墓, 天德合 and 月德合 are excluded, so with only those triggers the row is `QL_EXCLUDED` (keep).
- 7 new fixtures, 102 in total:
  - 五墓 + 天德合, + 月德合, + both → keep;
  - 五墓 + 天德合 + 月恩 → lift;
  - 五墓 + 天德 → lift;
  - 九空 + 天德合 → lift;
  - 五墓 + 九空 + 天德合 → keep.
- v1 → v2: 9 rows change, all lift → keep: 巳丙戌 on 2025-05-17, 2026-05-12 and 2027-05-07, for each of 開市, 立券交易 and 安牀. Unexpected changes: 0.

## Dated result (2025–2027)

| Action | 開倉庫出貨財 | 開市 | 立券交易 | 納財 | 安牀 | Total |
|---|---|---|---|---|---|---|
| lift | 17 | 13 | 25 | 13 | 0 | 68 |
| keep | 109 | 139 | 133 | 125 | 139 | 645 |
| hold | 7 | 1 | 1 | 1 | 1 | 11 |
| untouched | 962 | 942 | 936 | 956 | 955 | 4,751 |

- The 68 lifted rows fall on 34 dates.
- 254 kept rows carry a sourced exception, the same as v1.
- 0 mismatches against the engine baseline on 9,075 rows. The PRD counts match.

## Limits

Same as v1. Single-agent work (Claude); no independent second review.
