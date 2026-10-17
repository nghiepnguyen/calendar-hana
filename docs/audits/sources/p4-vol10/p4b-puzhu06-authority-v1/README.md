# puzhu:06 authority v1 (task 2.0)

`shared/almanac-data/p4b-puzhu06-v1.json` is built by `build.py`, which uses only the Python standard library and reads only the locked sources. Commands:

- `python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-authority-v1/build.py` verifies bytes.
- Add `--write` to regenerate.

Gate: `shared/lunar/p4Puzhu06Authority.test.ts`.

## Contents

- **Rule.** puzhu:06 full text at code-point offset 21817 of `vol10.raw.txt`, equal to the P4 lock `p4-vol10-authority.json`. The four parts it is built from: triggers, headings, 「如遇徳猶忌」 and 「從忌不從宜之日則仍註忌」.
- **Headings.** The eight printed headings with raw → P4 names (劵 → 券, 醖 → 醞 are NAMING_ONLY). Five are IN_SCOPE. 進人口, 經絡 and 醞釀 are OUT_OF_HEADING_SCOPE, and the gate checks this against `P4_DAY_HEADINGS`.
- **Triggers.** The nine gods 天德, 月德, 天德合, 月德合, 天赦, 天願, 月恩, 四相 and 時德. 三合, 六合, 母倉 and 滿日 are explicitly not triggers.
- **等第 grades.** The six grade texts, checked against the P4 lock offsets. The relevant ones: 中 9720, 次 9743, 下 9766. puzhu:27 at 22604, equal to `p4-puzhu-end-v1.json`.
- **Clauses** for the classes seen on 2025–2027:
  - 月破 猶忌 and 又為大耗;
  - 災煞 「辰戌丑未月不與德神併如常例」;
  - 月煞 「…平日與天德月德天德合月德合併如常例」 and 又為月虛;
  - 九空 「從月厭論 / 從月破論」.
- **Lift lists** for the five Q4 remaining-ji gods: 九空, 五虛, 小耗, 五離 and 五墓.
- **Owner decision** (2026-10-16, `OWNER_ADOPTED`, not canonical): Q1 no, Q2 no, Q3 no, Q4 yes. Convention: "yes" means puzhu:06 lifts.
- **Classes → action.** 23 spans in total.

| Class | Action | Why |
|---|---|---|
| YOUJI | keep | 猶忌 (遇德猶忌 exception) |
| ZHUSHI | keep | 諸事皆忌 |
| PUZHU27 | keep | puzhu:27 |
| AN | keep | Q1 no |
| AD | keep | Q1 no, Q2 no |
| AU | keep | Q3 no |
| QL | lift | Q4 yes |
| UNDETERMINED | hold | open P4-B scope |
| PROTECTED | untouched | protected 忌 |

- **Inheritance.**
  - An as_usual subject without a 等第 column that is ruled by another entry (`via`) takes the class of that entry's own record.
  - 又為大耗 follows 月破, and 又為月虛 follows 月煞.
  - A remaining-ji `defer` follows its target. The table is read from remaining-ji v7: 九空 → 月厭 in 巳亥, → 月破 in 辰戌丑未; 滿日 also appears there.
  - A 相抵 parent gives UNDETERMINED (P5 F3).
- **Row rule.**
  - puzhu:06 touches a row only if the heading is in scope, a trigger is present, the row has unprotected 忌 and there is no puzhu:28 day rule.
  - The row is lifted only when every source lifts.
  - A source the table does not cover is SPEC_GAP: stop, never guess.
- **After lift.** `ji` becomes false and 宜 is unchanged. The state becomes only_yi / not_recorded / undetermined. puzhu:06 runs before `applyP4Propagation`.

## Limits

- 又為 in P4-B is never lifted by its parent's own clause. Inheriting the parent class is a puzhu:06 reading, PRD FR-04, accepted by the owner with the PRD. Under the adopted answers every possible parent class is keep or hold, so the choice changes no row on 2025–2027.
- Single-agent work (Claude); no independent second review.
