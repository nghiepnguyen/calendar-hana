# Evidence confidence policy (proposal)

2026-10-21 · research; nothing implemented. Applies to any classical source read from scans (28 Tú 1880, 協紀 卷十/卷十一, future sources).

## 1. Current model (audit)

*Status 2026-10-21: implemented — `EvidenceConfidence` type, dataset-level default for mansion content 1.0.4, sparse metadata on 柳-2/壁-1/參-5/井-1 (see `implementation.md`). The table below describes the model before implementation.*

| Question | Answer (with location) |
|---|---|
| Field for semantic confidence? | **No dedicated field.** `RuleActivityMapping.reviewStatus` (`shared/lunar/ruleActivityMapping.ts`) is binary `interpretation_reviewed` / `interpretation_pending`. `Evidence.confidence` (`shared/lunar/evidence.ts`) is set to the constant `'medium'` for every mansion row (`mansionContentAuthority.ts:61`), so it carries no per-clause information. |
| Field for transcription confidence? | **No.** Clause `confidence: "PRIMARY"` (all 115) is a source-tier label and no code reads it for mansion content. Dataset-level `source.transcription` says "Visual reading of page images; short operative excerpts, not OCR or complete verses." Item `reviewStatus: SOURCE_LOCKED` (all 28) gates the authority but says nothing about character accuracy. |
| What does `interpretation_reviewed` commit to? | Only that the quote **contains a reviewed operative term of the clause's own scope** (`terms.find(t => quote.includes(t))`) and that the term's meaning was reviewed for that scope. It certifies the term, not the quote. Evidence: before the secondary review, five clauses with wrong quotes were all `interpretation_reviewed`; 斗-2 was "reviewed" only because the misreading 墳墓修築 matched a term. |
| Does the UI assume `sourceQuote` is exact? | **Yes.** `MansionEvidenceDetails.tsx:46` renders it as `<blockquote lang="zh-Hant">` with no qualifier, also for the unmapped list. SEO (`daySeo.ts`) and the mansion dialog use `sourcePhrase` only, never the quote. |
| Do tests lock quotes as exact primary text? | They lock **dataset strings**, not the scan: `mansionContentAuthority.test.ts` (角-3 + the five 2026-10-20 corrections), golden v1/v2 equality, and `ruleActivityMapping.test.ts` asserts that golden v2 `verses` (reviewer transcriptions) contain the quote for 張/參/婁/鬼/星/斗. |
| Does confidence metadata affect resolver/scoring? | Scoring: no (mansion rows `scoreDelta 0`, `mansion28ScoringEnabled false`). Resolver: only through the quote string (term matching). P4: the baseline row hash covers the whole Evidence object, so any field added **to Evidence** or any quote change changes hashes (provenance-only migration). Fields kept on the clause and not copied into Evidence change nothing. |

**Weakness:** one field (`quote` → `sourceQuote`) is used at once as raw transcription, normalized text, the string the resolver searches, and the quotation shown to users. Nothing records which characters were read with certainty, which were normalized, or which were inferred.

## 2. Confidence model

Two independent dimensions per clause (or per evidence item of any source).

### semanticConfidence

- **VERIFIED** — the readable source fixes the activity/concept, the polarity, and the scope the mapping needs. Every character need not be legible.
- **PROBABLE** — strong evidence for activity/polarity, but a reasonable alternative reading exists.
- **UNCERTAIN** — not enough to base a production mapping on.

### transcriptionConfidence (always relative to the primary image)

- **EXACT** — compared with the primary image, and the stored character keeps the printed form/variant (diplomatic). Recognising the lexical character is not enough.
- **IDENTIFIED** — the lexical character is identified on the scan well enough for transcription and semantics, but it is not verified that the stored Unicode character reflects the printed variant (e.g. 葬 vs 塟 / 𦵏). Not a semantic uncertainty. *(Added 2026-10-21, owner option 1 after `implementation-blocker.md`.)*
- **NORMALIZED** — the printed variant was identified, but the stored text deliberately uses another (normalized) character; each substitution is declared as position / sourceCharacter / storedCharacter (1-based positions).
- **PARTIAL** — some characters certain, others not; the certain part alone supports the semantic conclusion. Uncertain positions are explicit.
- **UNCERTAIN** — the quote cannot be reconstructed reliably.

Plus a **basis** attribute: `scan_read` (read on the primary image) or `digital_transcription` (e.g. Wikisource, not proofread against the scan). The 29 用事 headings are `digital_transcription`; EXACT/NORMALIZED there means "relative to the transcription", and the basis must be shown.

### Normalization policy

- Recommended: **EXACT and NORMALIZED stay distinct levels.** Do not introduce "EXACT_WITH_NORMALIZATION"; it blurs the one fact an auditor needs (was the stored string printed like this?).
- Prefer storing the **printed form** when it exists in Unicode (庄, 蚕, 尅). Then the quote can be EXACT once glyph-verified, and normalization lives in a separate search/normalized layer, not in the quotation.
- When a normalized form is stored, the clause must list each substitution (printed → stored).
- Generalization check on the secondary review: 壁-1 (pos 6, printed 庄, stored 莊), 參-5 (pos 7, printed **尅**, stored 克), 井-1 (pos 6, printed 蚕, stored 蠶) are **NORMALIZED** and must be declared. 參-5's printed form was re-read on 2026-10-21 (寸 component); the 2026-10-20 transcript had normalized it to 剋.
- **Discovery (2026-10-21, `implementation-blocker.md`):** the secondary review verified **lexical character identification**, not diplomatic glyph/variant identity. Its typed transcript used standard code points. The other 111 mansion quotes are therefore **IDENTIFIED** (character-identified), not EXACT; a glyph-form pass is not reliable on this print for complex characters such as 葬.

### Critical principle

`semanticConfidence = VERIFIED` together with `transcriptionConfidence = PARTIAL` is consistent. Example 柳-2: 「埋葬瘟□多□□」 fixes burial + negative (see `liu-2-review.md`).

## 3. Layers

```
primarySourceImage        page image + SHA-1 + crop/locator
  → rawTranscription      characters as printed; □ for unreadable
  → normalizedTranscription  declared variant substitutions only
  → semanticInterpretation   operative term, polarity, scope, confidence
  → activityMapping          catalog activity, review status
```

Rules: the UI quotation shows rawTranscription; search/resolver term matching may use normalizedTranscription; mapping depends only on semanticInterpretation. Today all three text roles share `quote`; the policy names them so a future change does not mix them again. Not all five layers need fields now (see `schema-options.md`).

## 4. Release matrix

| Semantic | Transcription | Mapping allowed? | Release blocker? | Reasoning |
|---|---|---|---|---|
| VERIFIED | EXACT | yes | no | — |
| VERIFIED | NORMALIZED | yes | no | substitutions declared |
| VERIFIED | PARTIAL | yes | no — **but** the display must mark uncertain characters (a reconstructed character shown as exact is a defect to fix) | the meaning is proven by the certain part |
| PROBABLE | EXACT | informational evidence only; never scoring | no; tracked as open item | an alternative reading exists |
| PROBABLE | PARTIAL | no — keep as gap (unmapped) with a note | no, if kept as gap | two weaknesses stack |
| UNCERTAIN | any | no — gap | yes, if mapped | nothing to stand on |

## 5. UI (proposal, not implemented)

For PARTIAL quotes:

```
Nguồn: 《玉匣記》 bản 1880 · trang 69
Nguyên văn: 埋葬瘟□多□□
Ghi chú: Một số chữ trên bản scan không đọc rõ (□). Ý nghĩa "An táng — bất lợi" vẫn xác định được từ phần đọc chắc.
```

- Never show a probable reading inside the quotation; if shown at all, label it "cách đọc có thể" outside the blockquote.
- NORMALIZED: optional small note "chữ dị thể đã chuẩn hoá". EXACT: unchanged.

## 6. Owner decisions needed

1. Adopt the two-dimension model + basis attribute (semantic/transcription/basis).
2. 柳-2 representation (`schema-options.md`, recommended B).
3. Certification rule (`certification-policy.md`).
4. Whether to store printed forms (庄/尅/蚕) for 壁-1/參-5/井-1 later or keep them declared NORMALIZED.

*Owner decisions 2026-10-21: model approved with IDENTIFIED (option 1); 柳-2 option B; 壁-1/參-5/井-1 declared NORMALIZED; certification = semantic mapping. Dataset default for mansion-content-yuxia-1880-v1 only: VERIFIED / IDENTIFIED / scan_read.*
