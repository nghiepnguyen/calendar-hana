# Certification policy (proposal)

2026-10-21 · not applied. Only the owner/maintainer changes certification.

## What is being certified

Certification certifies the **semantic mapping** (clause/heading → concept → activity, polarity, scope), not a diplomatic transcription of the whole text. Transcription quality is reported alongside, per clause, with the transcription dimension of `policy.md`.

## Levels

- **SINGLE_REVIEWED** — one review established every mapping with recorded evidence.
- **DOUBLE_REVIEWED** — a second, independent review re-derived every mapping from the primary source (not from the first review), all disagreements are resolved, every ontology question is decided, and no item is `semanticConfidence < VERIFIED` while mapped.
- Transcription is **not** a condition of DOUBLE_REVIEWED, but it is a mandatory qualifier: the certificate states the transcription distribution.

## Can VERIFIED semantic + PARTIAL transcription qualify?

**YES**, under the definition above, because the mapping depends only on the certain characters and that dependency is documented (柳-2: reviewTerm 埋葬 in certain positions). It must never be described as "all primary-source transcriptions exact".

If the owner wants the certificate to cover exact transcription, then 柳-2 keeps the set below DOUBLE_REVIEWED until a clearer image of the same print is found.

## Current state against the rule

| Condition | State |
|---|---|
| second independent review | done: 144/144 (115 mansion clauses, 29 用事) |
| disagreements | 5/5 resolved (quote corrections, 2be48a7) |
| ontology questions | resolved (ed59e09) |
| mapped items with semantic < VERIFIED | none known |
| transcription | mansion: 111 IDENTIFIED (character-identified; glyph variants not verified), 3 NORMALIZED (壁-1, 參-5, 井-1), 1 PARTIAL (柳-2), EXACT 0; 用事: 29 headings from an unproofread Wikisource transcription (basis `digital_transcription`). Corrected 2026-10-21: the first draft said "111 EXACT"; the review verified lexical identification, not glyph identity (`implementation-blocker.md`). |
| display honesty | 柳-2 currently shows a reconstructed quote as exact → fix (schema option B) before claiming the certificate |

Reviewer disclosure: reviewer #1 and reviewer #2 were both AI agents working independently; no human domain expert has reviewed the set. The certificate should say so.

## Recommended certification wording

> **DOUBLE_REVIEWED (semantic mapping)** — 28 Tú 1880 mapping (115 clauses) and 協紀 卷十一 用事 mapping (29 activities) were independently reviewed twice against the primary sources; all disagreements and ontology questions are resolved. Transcription: 111 character-identified (glyph variants not verified), 3 normalized variant forms, 1 partial (柳-2, semantics verified from the legible characters), 0 diplomatically exact; 用事 headings rely on an unproofread digital transcription. Reviews performed by two independent AI agents; no human expert review.

## Recommendation

Adopt the semantic-mapping definition. Grant DOUBLE_REVIEWED with the wording above **after** 柳-2 is displayed honestly (option B) and the three normalized clauses are either stored as printed or declared.
