# puzhu:06 authority v3 (task 5.1 fix)

`shared/almanac-data/p4b-puzhu06-v3.json` = v2 plus the P4-B state rule after a lift. It is built by `build.py` (copy of v2 with these changes). Gate: `shared/lunar/p4Puzhu06AuthorityV3.test.ts`. v1 and v2 are unchanged; v2 is pinned as `parent`.

## Why

The task 5.1 sweep found 5 dated rows and 2 contexts that are lifted while a 相抵 subject stays on the heading. Every one is 刼煞 `cancel_both`, state `neither_recorded`:
- 戌癸亥 開倉庫出貨財 (+ 五虛);
- 未戊申 立券交易 (+ 五離).

P4-B read these rows as `undetermined`, because a 相抵 heading also carried an unprotected 忌. After puzhu:06 lifts that 忌, only the 相抵 is left. P4-B's own model then gives `neither_recorded` (puzhu:05 「凡吉凶相抵不註宜亦不註忌…」; P4-C has 2,023 such rows). v2 wrote `not_recorded` because 宜 was false, but that 宜 is false only as a side effect of the 相抵 suppression.

Classification: **SPEC_BUG** in v2 `stateAfterLift`. It also falsified the claim in baseline 1.4 / task 3.1 that a lift never yields `neither_recorded`.

## Change from v2

- `stateAfterLift.state`: a 相抵 subject on the heading gives `neither_recorded`; otherwise 宜 true / false / unknown gives only_yi / not_recorded / undetermined, as before. The basis is puzhu:05 (offset 21790).
- `stateAfterLift.propagation`: a lift that leaves a 相抵 heading feeds the propagation lines like any 相抵 heading. The artifact `p4-vol10-day-composition-v2.json` is pinned by SHA-256 and its line ids are listed.
- On 未戊申, 開市 is already 相抵, so 立券交易 becoming 相抵 fires puzhu:22. The target 開倉庫出貨財 is protected 忌, so P4-C records `propagationBlocked` and the 忌 stays.

This is P4-B's convention applied mechanically, not a new reading of the source, so no owner question was asked.

## Limits

Single-agent work (Claude); no independent second review.
