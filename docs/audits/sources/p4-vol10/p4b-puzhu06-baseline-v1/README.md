# puzhu:06 baseline v1 (task 1.0)

Engine measurement on `origin/main` `1c4bb32` (tree `4b32d9ab0338`), P4-B/P4-C without any puzhu:06 layer. Not a Golden. Generator: `shared/lunar/p4Puzhu06Baseline.test.ts`. Ordinary runs verify bytes; `P4B_PUZHU06_WRITE=1` regenerates the files.

## Files

- `baseline.tsv` — 1,095 dates × 5 headings (開倉庫出貨財, 開市, 立券交易, 納財, 安牀) = 5,475 rows. Same dates and dated inputs as the P4-C sweep: lunar day, phase, soil and 母倉 soil.
- `context.tsv` — 720 contexts (Month Jian × 60 pillars) × 5 headings = 3,600 rows, without dated operands.
- `summary.json` — counts.

Columns:
- `triggers`: the nine puzhu:06 gods (天德 月德 天德合 月德合 天赦 天願 月恩 四相 時德) that the P4-C 宜 traces mark present.
- `day_rule`: the puzhu:28 override.
- final `yi`, `ji`, `protected_ji` and `state`.
- `sources` (only when `ji` is true): JSON list of the raw 忌 sources.
  - `subject`: every P4-B scope of the day, with owner, clause effect, 等第 grade and grade action, 德 present, and the state on this heading.
  - `youwei`: 又為 scopes that list this heading.
  - `remaining`: present remaining-ji v7 scopes with kept / protected / undetermined.
  - `puzhuEnd`: the puzhu:27 死敗 restoration.

The baseline does no classification. Classification belongs to the Golden (task 3.0).

## Results

- 532 / 1,095 dates are puzhu:06 days.
- Candidates, meaning `ji` true, not protected, on a puzhu:06 day: 開倉庫出貨財 133, 開市 153, 立券交易 159, 納財 139, 安牀 140. These match P5 F1 and PRD §2.
- 1.3 — 忌 that is already protected on a puzhu:06 day: 開倉庫出貨財 119, 安牀 61, 開市 / 立券交易 / 納財 36 each. These rows form the negative set: puzhu:06 does not touch them (FR-05).
- 1.4 — No candidate is `neither_recorded`. ~~A puzhu:06 lift never gives `neither_recorded`, so puzhu:22 cannot fire because of puzhu:06.~~ **Corrected in task 5.1:** a lift that leaves a 相抵 subject on the heading gives `neither_recorded` (authority v3). On 未戊申 this fires puzhu:22, and the protected 開倉庫 records only `propagationBlocked` (Golden v3 `propagation.tsv`).
- 1.5 — 進人口, 經絡 and 醞釀 are not in `P4_DAY_HEADINGS`, which the generator asserts.
- 9 puzhu:06 days are also puzhu:28 days (`dayRule`). There 諸事不忌 already removes the 忌.
- Context domain: 521 candidates over 720 contexts. Without dated operands, part of the 忌 stays undetermined.
- `context-p4c.tsv` (task 5.1 supplement): the P4-C pre/final state of all 29 headings on 720 contexts, used for the Golden v3 propagation replay.

## Limits

- Trigger presence comes from the engine's P4-C traces. The Golden recomputes it independently.
- Single-agent work (Claude); no independent second review.
