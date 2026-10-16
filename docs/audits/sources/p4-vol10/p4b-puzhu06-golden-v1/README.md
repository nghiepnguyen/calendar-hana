# puzhu:06 Golden v1 (task 3.0)

Index: `shared/almanac-data/golden-p4b-puzhu06-v1.json`, status `HASH_LOCKED_PRE_IMPLEMENTATION`. Generator: `derive.py`. Gate: `shared/lunar/p4Puzhu06Golden.test.ts`.

Commands:
- `python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v1/derive.py` verifies bytes.
- Add `--write` to regenerate.

Frozen before the red tests and code (PRD FR-08). Authority: `p4b-puzhu06-v1`. Owner decision of 2026-10-16: Q1 no, Q2 no, Q3 no, Q4 yes.

## Independence

`derive.py` uses only the Python standard library and reads no resolver, composer or TypeScript code.

**Recomputed here:**
- Presence of the nine trigger gods, and puzhu:28. Each table is checked verbatim against `vol05.raw.txt` / `vol10.raw.txt`; the literals are the same as in the frozen P5 Golden.
- The puzhu:06 decision, from the authority JSON: classes, inheritance, row rule and state after lift.

**Frozen upstream inputs, not re-derived:**
- The P4-C sweep `docs/audits/p4-vol10-yi-operands-2025-2027.tsv`: dated Month Jian, pillar and final state.
- The task 1.0 baseline source inventory (`p4b-puzhu06-baseline-v1`, commit `6f970cd`): the P4-B 忌 sources per row.
- Both are P4-B/P4-C facts accepted with their own Goldens. Neither contains puzhu:06.

**Validation phase**, run after expected is built: the engine baseline's triggers, puzhu:28, yi, ji, protected and state are compared on 9,075 rows. Mismatches: 0. The PRD §2/§8 counts are also compared.

## Blocks

- `expected.json`, 95 fixtures:
  - each class × 宜 true / false / unknown;
  - all class pairs (the strictest wins: hold > keep > lift);
  - each trigger, and the non-triggers 三合 / 六合 / 母倉 / 滿日;
  - each in-scope heading, 修倉庫 out of list, protected, no 忌, puzhu:28;
  - via / 又為 / defer inheritance;
  - the five Q4 gods;
  - SPEC_GAP inputs.
- `dated.tsv`: 1,095 dates × 5 headings = 5,475 rows.
- `context.tsv`: 720 contexts × 5 headings = 3,600 rows.
- `summary.json` and `validation.json`.

## Dated result (2025–2027)

| Action | 開倉庫出貨財 | 開市 | 立券交易 | 納財 | 安牀 | Total |
|---|---|---|---|---|---|---|
| lift | 17 | 16 | 28 | 13 | 3 | 77 |
| keep | 109 | 136 | 130 | 125 | 136 | 636 |
| hold | 7 | 1 | 1 | 1 | 1 | 11 |
| untouched | 962 | 942 | 936 | 956 | 955 | 4,751 |

- The 724 candidates split into 77 lift, 636 keep and 11 hold.
- 254 of the keep rows carry a sourced exception (猶忌 / 諸事皆忌 / puzhu:27). Per heading: 開倉庫 45, 開市 53, 立券 53, 納財 53, 安牀 50.
- The 77 lifted rows fall on 37 dates.

## Validation finding (classified, before freeze)

The first run matched the engine on every row, but differed from the PRD on 10 rows (2 per heading, 2026-06-01 and 2027-05-27 巳丙午). Classes in those rows: PUZHU27 + 大時 `only_avoid` with state `undetermined`.

- Classification: **GOLDEN_BUG**. The Golden had left out the P4-C reading 「A 止忌 scope cannot be undetermined with known-false 宜」 (`assembleP4YiDay`, which turns it into `not_avoided`).
- Fix: `derive.py` now mirrors that reading for `only_avoid` + `undetermined` + 宜 false. Two fixtures cover it, and on 宜 unknown the row still holds.
- After the fix the PRD counts match. No expected value was edited by hand.

## Limits

- The P4-B 忌 source inventory is an engine measurement (task 1.0), not re-derived from the 卷十 entries here.
- The P5 Golden is not merged. Its trigger literals are copied, not imported.
- Single-agent work (Claude); no independent second review.
