# Schema options for partial / normalized transcriptions

2026-10-21 · not implemented. Impact figures are expectations from the code paths; the P4 row counts follow from the baseline (柳 burial = 40 rows of 1098 dates) and must be measured at implementation with the full-leaf method.

## OPTION A — Metadata only

Keep `quote` 「埋葬瘟疫多疾病」; add clause metadata `transcription: { confidence: "PARTIAL", uncertain: [4, 6, 7] }`.

| Criterion | Assessment |
|---|---|
| correctness | Low: three unsupported characters stay in the canonical string |
| auditability | Medium: the flag exists, but the string still looks exact |
| schema impact | Small: one optional clause field |
| UI impact | Needs UI to read the flag; otherwise the blockquote still shows a wrong quote as exact |
| P4 impact | None if kept on the clause; ~40 rows (or every mansion row if added to every Evidence) if copied into Evidence |
| migration cost | Low |
| future usefulness | Low: does not separate raw/normalized/semantic |

## OPTION B — Honest partial transcription (recommended)

`quote` = 「埋葬瘟□多□□」 (□ = U+25A1 per unreadable character). Sparse clause metadata **only on exception clauses**: `transcription: { confidence, uncertain?, probable?, normalizations?, basis }`. The dataset default covers the rest, so 111 clauses carry nothing new. *(Corrected 2026-10-21: that default is IDENTIFIED, not EXACT — see `implementation-blocker.md`.)*

| Criterion | Assessment |
|---|---|
| correctness | High: the canonical string contains only what the scan shows |
| auditability | High: uncertain positions and the basis are explicit |
| schema impact | Small: one optional clause field; Evidence gets an optional field only where non-default |
| UI impact | Small: blockquote already renders the string; add one note line when the clause is PARTIAL/NORMALIZED |
| P4 impact | Provenance-only. Estimate here was ~40 柳 burial rows and 0 events; **measured at implementation (2026-10-21): 159 activity rows (柳 40, 壁 39, 參 40, 井 40) + 80 event rows (參 wedding)**, because the NORMALIZED metadata is also copied into Evidence and 參-5 feeds the wedding event. See `implementation.md`. |
| resolver | reviewTerm 埋葬 sits in certain positions 1–2 → still `interpretation_reviewed` |
| tests/golden | golden v1/v2 quote for 柳-2; golden v2 `verses` may add 柳 with □; one regression test that □ never reaches a reviewTerm |
| migration cost | Low–medium (one clause; same process as the 2026-10-20 migrations) |
| future usefulness | Medium–high: the same field covers NORMALIZED (壁-1/參-5/井-1) and other sources |

## OPTION C — Separate raw / normalized / evidence fields

Every clause gets `rawTranscription`, `normalizedTranscription`, `operativeTerm`, `transcriptionConfidence`, `semanticConfidence`; Evidence carries the raw text for display and the normalized text for search.

| Criterion | Assessment |
|---|---|
| correctness | Highest |
| auditability | Highest |
| schema impact | Large: all 115 clauses, Evidence type, resolver input |
| UI impact | Medium |
| P4 impact | Every mansion evidence row changes hash (thousands of rows), provenance-only |
| migration cost | High; harder to prove "no behavior change" in one step |
| future usefulness | Highest; the right target when a second scan source is onboarded |

## Recommendation

**OPTION B** now (sparse, honest, smallest migration), with field names chosen so they can grow into OPTION C later without renaming. Do not adopt A: it leaves a quotation on screen that the scan does not support.
