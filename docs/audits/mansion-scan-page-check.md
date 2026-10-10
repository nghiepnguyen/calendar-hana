# Note: 觜/參 scan page links — check later

Status: **OPEN — to verify; no data, Golden or code change**
Recorded: 2026-10-10, during the activity interpretation review (PR #6). Base: main `48fa260`.

## Observation

Authority `mansion-content-yuxia-1880-v1` builds each scan link as `page/n{pdfPage - 1}.jpg` (`shared/lunar/mansionContentAuthority.ts`, `sourceRef`).

| Mansion | Dataset `pdfPage` | Link opens | Page seen during review |
|---|---|---|---|
| 畢 Tất (18) | 64 | `n63` | — |
| 觜 Chủy (19) | 65 | `n64` | verse of **參** |
| 參 Sâm (20) | 66 | `n65` | verse of **觜** |
| 井 Tỉnh (21) | 67 | `n66` | — |

In the 1880 print (archive.org item `20241205_20241205_0310`) 參 seems to be bound before 觜, so the two links appear to be swapped. The quotes of both mansions match their real verses; only the page reference is affected.

The reading was made on downscaled page images while settling 參-5. It has **not** been rechecked on full-resolution crops.

## To check

1. Download `page/n63.jpg` … `page/n66.jpg` and confirm which mansion heading (觜宿 / 參宿) is printed on each page.
2. Recheck every neighbour row (at least 昴 → 井) for the same offset.
3. If confirmed, classify: `GOLDEN_BUG` (the Phase 7 golden `shared/lunar/audit-fixtures/mansion-content-golden-v1.json` holds the same page numbers) together with a dataset fix in `shared/almanac-data/mansion-content-yuxia-1880-v1.json`. Fix both in a dedicated change with recorded evidence; do not edit the golden only to keep tests green.
4. The page number is also shown to users: `presentMansionContent` (“Bản scan · trang N”, `mansionContentAuthority.ts`) and the SEO page (“Ngọc Hạp 1880 · trang N”, `shared/seo/daySeo.ts`). Update their expected values in tests with the fix.

## Related

- Tú 角: the scan may read 惟有**葬埋**不可用 where the dataset has 埋葬. Check on a high-resolution crop at the same time.
- `docs/verification/activity-interpretation-review.md` (section “Phát hiện ngoài phạm vi”).
