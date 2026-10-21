# 柳-2 — final scan review

2026-10-21 · research only; production, baseline and golden unchanged.

## Source

- Print: 繪圖增廣玉匣記, 光緒六年 (1880), 掃葉山房, archive.org item `20241205_20241205_0310`.
- Page: `page/n68.jpg` (dataset `pdfPage` 69), SHA-1 `9a26c582e0da914c92832d905815768f9b74015a`, 3232 × 5643 px.
- Verse line 3 of 柳土獐 (任光); crops at native resolution, column x ≈ 1630–1930, y ≈ 1500–2660.
- Method: visual reading of single characters, compared with the same glyphs elsewhere in **the same print** (intra-source comparison). No OCR, no other edition, no AI reconstruction used as evidence.

## Character by character

| Pos | Reading | Confidence | Basis |
|---|---|---|---|
| 1 | 埋 | certain | clear |
| 2 | 葬 | certain | clear |
| 3 | 瘟 | certain | 疒 + 昷 clear |
| 4 | □ (疒 + stacked horizontal strokes) | uncertain | Radical 疒 is clear. The inner part is several stacked horizontals, matching the glyph after 瘟 on 女 `n54.jpg` (SHA-1 `a8782175e5eb`, line 4 「顛邪疾病更瘟□」: 疒 + 皇, conventionally 癀). It does **not** match 疫 (inner 殳, no stacked horizontals). Probable 癀-form; not confirmed. |
| 5 | 多 | certain | two 夕, clear |
| 6 | □ (疒 + 丙-like) | uncertain | 疒 clear; inner resembles 丙 as in 病 on 女 n54. Probable 病. |
| 7 | □ (top stroke, 夕-like left, 匕-like right with hook) | uncertain | Resembles 死 on 井 `n66.jpg` (SHA-1 `cd8e2216fe12`, 「埋葬須防驚卒死」). Ink smeared. Probable 死. |

Certain transcription: **埋葬瘟□多□□**

Probable reading (not evidence, not canonical): 埋葬瘟[癀?]多[病?][死?].

## Current production quote

「埋葬瘟疫多疾病」 (`mansion-content-yuxia-1880-v1.json`, golden v1/v2).

- Position 4 (疫): not supported; the glyph has stacked horizontals, not 殳.
- Positions 6–7 (疾病): not supported; position 6 looks like 病 and position 7 like 死, i.e. the order and the characters differ.
- The production quote therefore presents three characters as exact that the scan does not show. It is not confirmed, and is probably wrong at 4, 6 and 7.

## Semantic conclusion

The certain characters 埋葬 (burial) + 瘟 (pestilence) already fix the meaning: a burial on this day brings pestilence. 多 adds "much". No reading of positions 4, 6, 7 can turn the clause favourable: every candidate (癀/疫, 病/疾, 死) is an affliction.

- activity = burial — certain (埋葬)
- polarity = negative (hung) — certain (瘟 + affliction context; the verse is 凶 throughout: 「柳星造作主遭官」 …)
- resolver: reviewTerm 埋葬 sits in the certain positions 1–2, so the review status does not depend on the uncertain characters.

**semanticConfidence: VERIFIED**
**transcriptionConfidence: PARTIAL** (4 of 7 characters certain; uncertain positions 4, 6, 7)

## Recommended representation (not implemented)

- Quote: `埋葬瘟□多□□` (□ = U+25A1, one per unreadable character).
- Sparse clause metadata: `transcription: { confidence: "PARTIAL", uncertain: [4, 6, 7], probable: "埋葬瘟癀多病死", basis: "intra-source glyph comparison n54/n66; ink smeared" }`.
- Keep the current wrong-looking full quote out of any canonical field.

*Owner decision 2026-10-21: option B approved; the probable reconstruction stays in this research note only and is not stored in production (no `probable` field).*

## What would close it

A clearer image of the same 1880 print (another scan of the same woodblock edition). A different edition is a different text and cannot confirm this print.
