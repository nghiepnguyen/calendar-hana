# Note: 觜/參 scan page links — check later

Status: **RESOLVED 2026-10-10 — confirmed on full-resolution pages; dataset and Phase 7 golden corrected (see “Resolution”)**
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

## Resolution (2026-10-10, branch `audit/mansion-scan-page-fix`)

Checked on the original archive.org page images (about 3170–3250 × 5640–5650 px), reading the mansion heading and the first verse line on each page:

| Image | SHA-1 (prefix) | Heading | First line |
|---|---|---|---|
| `n63.jpg` | `27c960118b30` | 畢月烏 吉 | 畢星造作主光前 |
| `n64.jpg` | `9b413229ae9e` | **參水猿 吉** | 參星造作旺人家 |
| `n65.jpg` | `57ed30f124d5` | **觜火猴 凶** | 觜星造作有徒刑 |
| `n66.jpg` | `cd8e2216fe12` | 井木犴 吉 | 井星造作旺蠶田 |

The 1880 print binds 參 before 觜. Only those two rows were off; 畢 and 井 were already correct.

Tú 角 (`n45.jpg`, SHA-1 prefix `e5bf3be3ce65`): the fifth verse line reads **惟有葬埋不可用** (葬 before 埋). The dataset had 埋葬, a transcription slip.

Classification: `GOLDEN_BUG` — the Phase 7 golden repeated the same values as the dataset. Fixed in both, with this evidence:

- `shared/almanac-data/mansion-content-yuxia-1880-v1.json` and `shared/lunar/audit-fixtures/mansion-content-golden-v1.json`: 觜 `pdfPage` 65 → **66**, 參 66 → **65**; 角-3 quote → 惟有葬埋不可用; version 1.0.0 → **1.0.1** (also in `manifest.json`).
- `shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json`: 角-3 quote and `reviewTerm` 埋葬 → 葬埋 (both terms were already reviewed for `funeral_burial`, so the review status does not change).
- `mansionContentAuthority.test.ts`: locks 畢 n63, 觜 n65, 參 n64, 井 n66 and the 角-3 quote.

User-visible effect: the scan link and “trang N” label of Tú Chủy and Tú Sâm now open their own page; the 角 quote shows 葬埋. Activity IDs, scopes, polarity, conditions, scores and verdicts are unchanged.
