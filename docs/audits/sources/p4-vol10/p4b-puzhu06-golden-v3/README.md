# puzhu:06 Golden v3 (task 5.1 fix)

Index: `shared/almanac-data/golden-p4b-puzhu06-v3.json`. Generator: `derive.py`, a copy of the v2 derive plus the changes below. Gate: `shared/lunar/p4Puzhu06GoldenV3.test.ts`.

Commands:
- `python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/derive.py` verifies bytes.
- Add `--write` to regenerate.

- Authority: `p4b-puzhu06-v3`. Owner answers: Q1 no, Q2 no, Q3 no, Q4 yes, Q4a block.
- v1 and v2 stay frozen; v2 is pinned as `parent`.

## Provenance: frozen after a composer existed

v3 was frozen **after** the composer had been built and turned green against v2 (`368ecd8`). The task 5.1 sweep then showed a SPEC_BUG in authority v2 `stateAfterLift`, which v2 and the composer shared:
- on 5 dated rows and 2 contexts, a lift leaves a 相抵 subject (刼煞 `cancel_both`) on the heading;
- such a row must read `neither_recorded`, and it can feed the propagation lines.

v3 fixes the Golden first. The composer test then points at v3 and runs red, and only after that is the composer fixed. Catching this kind of bug is what the sweep is for.

## Changes from v2

- **State after lift.** A 相抵 subject left on the heading gives `neither_recorded` (puzhu:05, the P4-B state model). Three new fixtures, 105 in total:
  - 相抵 + QL with 宜 false → lift, `neither_recorded`;
  - 相抵 + QL with 宜 unknown → lift, `neither_recorded`;
  - 相抵 + QL + AN → keep.
- **Propagation replay.** An independent single-pass mirror of the `p4-vol10-day-composition-v2.json` lines, read as frozen data. Inputs are the P4-C pre-propagation states of all 29 headings: the P4-C sweep TSV for dates, and the baseline supplement `context-p4c.tsv` for contexts.
  - Before it is used, the mirror must rebuild every P4-C final state with no lift: 31,755 dated rows and 20,880 context rows, 0 mismatches.
  - The first run found 36 mismatches. Cause: 破屋壞垣 (lines) vs 破屋壊垣 (headings), a NAMING_ONLY gap in the mirror. Fixed with the same normalization the day headings use.
- **New block `propagation.tsv`.** It lists every heading outside the lifted rows whose final state changes because of a lift. There are 3: 開倉庫出貨財 on 未戊申 2026-08-02 and 2027-07-28, and on context 未-戊申.
  - 立券交易 becomes 相抵 next to 開市, which is already 相抵, so puzhu:22 (`requireAll`) fires.
  - The 開倉庫 忌 is protected, so it stays. Only `propagationBlocked = 開市+立券交易` is recorded.
- `dated.tsv` and `context.tsv` gain `after_propagated_from` and `after_propagation_blocked` for the five headings.

## Result (2025–2027)

- Actions are unchanged from v2: 68 lift (34 dates), 645 keep, 11 hold.
- v2 → v3: 5 rows change state to `neither_recorded`, namely 戌癸亥 開倉庫出貨財 (×3) and 未戊申 立券交易 (×2). There are also 2 propagation-blocked annotations. Unexpected changes: 0.
- 0 mismatches against the engine baseline; the PRD counts match.

## Limits

Same as v1. Single-agent work (Claude); no independent second review.
