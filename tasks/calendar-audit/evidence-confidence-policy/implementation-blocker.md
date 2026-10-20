# Implementation stopped — default for clauses without metadata

2026-10-21 · STOP before any production edit (owner rule: "Nếu không đủ để coi absence = EXACT, STOP và đề xuất schema khác"). Production, golden, baseline, tests: unchanged.

## What the audit proves and what it does not

- The 2026-10-20 secondary review compared each of the 115 quotes with a transcription typed by reviewer #2 from the scan. 111 quotes match that transcription character for character; 4 do not (壁-1, 參-5, 井-1, 柳-2).
- That transcription was typed in **standard code points**. It proves the **identity** of each character (which word is printed), not the **printed glyph form** (which variant code point the woodblock shows).
- Counter-example found today: 參-5 position 7. Re-zoomed on `page/n64.jpg` (SHA-1 `9b413229ae9e…`, crop x 640–900, y 2260–2560): the right component is 寸 (one hooked vertical + a dot), so the print reads **尅** (U+5C05). The 2026-10-20 transcript first wrote 「剋/尅 variant glyph」 and then stored 剋. The typed transcript silently normalized a variant.
- Feasibility test of a glyph-form pass: 葬 on 心 `n49.jpg` (crop x 1350–1610, y 1500–2020) and on 箕 `n51.jpg` (crop x 1620–1920, y 1450–2050, one of the clearer pages). In both, the lower component of 葬 cannot be read reliably enough to tell 葬 (廾) from the common woodblock variants 塟 / 𦵏 (土). The images are already full resolution (3232 × 5643); the limit is the print, not the scan.
- Consequence: for the 111 clauses, "every character stored as printed" (the approved meaning of EXACT) is **not proven**. A glyph-form pass could resolve some characters but not complex ones such as 葬, which occurs in about 25 burial quotes.

## Options for the owner

| Option | Schema | Effect |
|---|---|---|
| **1 (recommended)** | Add one transcription value, e.g. `IDENTIFIED` — "every character's identity read on the scan; stored in standard code points; printed glyph forms not audited". Absence of metadata = `semantic VERIFIED / transcription IDENTIFIED / basis scan_read`. EXACT stays reserved for glyph-audited quotes. | Honest default for 111 clauses; 柳-2 PARTIAL and 壁-1/參-5/井-1 NORMALIZED exactly as decided; no claim stronger than the evidence. |
| 2 | Explicit metadata on all 115 clauses (no default), using the same new value or a per-clause statement. | Same honesty, but every mansion evidence row changes hash if the field is copied into Evidence; much larger P4 migration. |
| 3 | Keep the 4-value enum and treat absence as `NORMALIZED (undeclared)`. | Not recommended: NORMALIZED requires declared substitutions; this would weaken its meaning. |

Option 1 keeps every other approved decision unchanged: Option B for 柳-2 (`埋葬瘟□多□□`, PARTIAL, positions 4/6/7, 1-based), NORMALIZED declarations for 壁-1 (pos 6, printed 庄 → stored 莊), 參-5 (pos 7, printed **尅** → stored 克; not 剋), 井-1 (pos 6, printed 蚕 → stored 蠶), sparse metadata, P4 controlled migration.

## Corrections to the research artifacts

- `certification-policy.md` and `policy.md` (this folder, uncommitted research) count "111 EXACT". Under the approved definition that should read "111 IDENTIFIED (glyph form not audited)" if option 1 is adopted. They are left unchanged until the owner decides, so the record shows what was proposed.
- `policy.md` lists 參-5 as 克/剋; the printed form is 尅.
- Certification wording must say "transcription: 111 character-identified (glyph forms not audited), 3 normalized, 1 partial" — not "111 exact".

## Needed to continue

Owner choice of option 1, 2 or 3 (and, for option 1, the value name).
