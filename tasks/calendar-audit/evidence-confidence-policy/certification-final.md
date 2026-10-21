# Certification — current state

2026-10-21 · authoritative current-state record; earlier artifacts stay as history.

## DOUBLE_REVIEWED (semantic mapping)

Required qualifiers:

- 115 Mansion clauses and 29 用事 mappings were independently reviewed twice for semantic mapping.
- The two reviewers were independent AI-agent review passes; no human textual expert review has been completed.
- Mansion transcription includes normalized, character-identified and partial primary-source readings; no clause is certified as a diplomatically exact transcription.
- 用事 review is based on the Wikisource digital transcription and has not been fully proofread against the 四庫 scan.

This does **not** mean: diplomatic transcription verified; expert reviewed; human reviewed; all glyph variants verified; textually certified.

## Audit state

- SECONDARY_REVIEW_COMPLETE
- DISAGREEMENTS_RESOLVED
- ONTOLOGY_DECISIONS_RESOLVED
- EVIDENCE_CONFIDENCE_MODELED
- DOUBLE_REVIEWED (semantic mapping)

## Mansion transcription distribution (computed from implemented data)

| transcription | clauses |
|---|---|
| EXACT | 0 |
| NORMALIZED | 3 |
| IDENTIFIED | 111 |
| PARTIAL | 1 |
| UNCERTAIN | 0 |

Semantic: {'VERIFIED': 115}. Basis: scan_read for all 115. Exceptions: 壁-1 NORMALIZED, 參-5 NORMALIZED, 井-1 NORMALIZED, 柳-2 PARTIAL. Every other clause inherits the dataset default VERIFIED / IDENTIFIED / scan_read.

## 用事

- basis = digital_transcription (Wikisource 卷十一); not fully proofread against the 四庫 scan.
- The evidence-confidence schema currently applies to Mansion clauses only (limitation).

## Mapping (computed from the resolver)

- 111 exact_catalog_pair; unmapped intentional gaps ['婁-1', '鬼-6', '軫-1'] (婁-1 partial ritual, 鬼-6 wall, 軫-1 insufficient semantic evidence); not_operative ['星-4']; interpretation_reviewed 115/115.
- 柳-2: semantic VERIFIED / transcription PARTIAL — a modeled evidence state, not a mapping blocker.

## Remaining mapping blockers

None.
