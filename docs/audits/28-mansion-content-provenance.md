# Phase 7 — 28 Tú 宜/忌 content provenance

Status: IMPLEMENTED ON AUDIT BRANCH; NOT CLOSED OR DEPLOYED. Closing requires successful main CI and the actual Firebase deploy step. This content lock does not authorize mansion scoring.

## Scope and authority layers

Authority `mansion-content-yuxia-1880-v1`, content version `1.0.0`. All 28 records are `SOURCE_LOCKED` **within the selected edition**, with cross-tradition classification `SOURCE_DEPENDENT`. This is not a claim that every edition of Ngọc Hạp, or every tradition, has the same rules.

The canonical sequence, day-cycle phase, 七曜, animals and compatibility element remain the Phase 4A identity authority. `Mansion.isGood`, `shouldDo`, `shouldAvoid` remain unchanged legacy fields for API compatibility, marked unaudited. Production UI/SEO and activity explanations use `Mansion.content`. No personal birth/age rule is introduced.

## Selected primary edition and reproducibility

Work: **繪圖增廣玉匣記**. Title page (PDF page 3) visibly reads **光緒六年仲夏校鐫 / 掃葉山房藏板** (1880). Section **二十八宿值日吉凶歌** occupies PDF pages **46–73**, in canonical 角…軫 order. These are 1-based PDF pages, not printed folio numbers. Image endpoints are 0-based: page 46 is `page/n45.jpg`.

- [Complete scan / archive item](https://archive.org/details/20241205_20241205_0310)
- [Title page](https://archive.org/download/20241205_20241205_0310/page/n2.jpg)
- [First mansion / Giác](https://archive.org/download/20241205_20241205_0310/page/n45.jpg)
- PDF filename: `繪圖增廣玉匣記 .pdf` (space before extension).
- PDF bytes: 120856022; SHA-1: `c8f9ccbb73f7bb0e05c6c1880d61ac9f62dae6b1` (matched downloaded archive metadata).
- Transcription: direct visual reading of all 28 page images. Archive OCR is unusable and was not used as authority. JSON contains **operative excerpts**, not full verse transcriptions; polarity is read with the surrounding verse on the linked page.

A [version study](https://lius.cc/research/玉匣記版本流變考) was used to locate the scan, not to establish rules. The unspecific [Wikisource 玉匣記](https://zh.wikisource.org/zh-hant/玉匣記) was rejected as the content authority: it has variant order and wording (e.g. 畢「無光」 versus this scan「光前」). The museum's 1684 文瑞堂 catalog proves another edition exists, not that its clauses match this edition. Neither those sources nor Hiệp Kỷ's 二十八宿配日 are silently blended into this content authority.

## Operand, translation and coverage conventions

Every operative clause is conditional on `MANSION_INDEX == record.index` (0..27), selected by the existing source-locked day-cycle function. No Gregorian/lunar month, season, personal age, hour or direction is inferred from these excerpts. The selected verses do not state additional computable operand predicates or explicit override exceptions for these extracted clauses; `exceptions: []` means none stated here, not none exist in all traditions. The API retains condition/exception arrays; they cannot be silently discarded.

Translations are concise **activity glosses**, not literal translations of predicted fortunes. Classical claims of illness/death/wealth are not asserted as empirical outcomes in the product. PRIMARY denotes the page source. Evidence confidence is **medium** because translating activities into the product taxonomy is an interpretation. The legacy modern-text parser and its old snapshot have **low** provenance confidence and remain unaudited.

- 造作/修造 → `construction_general` / `construction`, a project mapping convention. It never means every activity, 動土, 上梁 or travel. Specific new-room/high-hall/column/waterside construction keeps its narrow scope and no broad activity ID.
- 嫁娶/婚姻 → `relationship_wedding` / `wedding`; no engagement/bed-installation inference.
- 埋葬/葬埋 → `funeral_burial` / `burial`. 修墳/墳墓修築 remain `funeral_grave_repair` / `grave_repair`.
- 行船 → `travel_water` / `water_travel`, never generic/road travel or boat construction/launch. Only Đê explicitly states this operative rule in the selected verses.
- 開門 and 放水 retain `door_opening` and `waterworks`, with empty product activity IDs because their exact activities have no matching taxonomy entry. They are still shown in the source explanation. No generic opening/business/water-travel substitution.
- Headline 吉/凶 is not converted into an intrinsic binary property or a score. A negative headline may still contain an affirmative clause: Mão's 造作進田牛 is preserved as positive construction.
- Consequences concerning descendants (e.g. Nguy's 後生出外不還鄉) are not converted into an operative travel rule. Tỉnh's widow/property consequence is not a wedding recommendation.
- General fortunes do not create “mọi việc đều tốt” or “không kỵ gì”. **Unmentioned activity = UNKNOWN**, not permission, taboo or a missing-row bug. If a side has no explicit operative clause, UI says it has not been stated in the reviewed excerpt.

## Production inventory and migration

`shared/lunar/mansions.ts`: preserve legacy fields and day-index formula; attach source content by index. `mansionContentAuthority.ts`: edition metadata, clauses, validated operands, informational evidence and presentation. `mansionEvidence.ts`: structured authority for production input; modern phrase parser retained only for text-only legacy input. `activityRecommendations.ts`: existing scoring guard unchanged. `eventEvaluation.ts`: no decision policy change. `evidence.ts`: optional source quote/condition/exception metadata; engine version 1.2.0 invalidates old memoized explanations.

Consumers migrated: `AlmanacPanel` (neutral source badge, scoped wording), `AlmanacExplain` (edition/page link, quote-to-gloss explanation), server SEO article (same edition-specific wording and page citation), activity evidence (same structured clauses). `mansion28.json` still has no applied activity rules and modifier 0. `manifest.policies.mansion28ScoringEnabled` remains false.

Migration disposition: selected-source explanations are `EXPECTED_AUTHORITY_MIGRATION_CHANGE`. Nguy burial changes from legacy positive to source negative (`SOURCE_DEPENDENT`). Chủy/Liễu gain explicit burial clauses after source review. Modern boat taboos, road-travel claims, tailoring, bed-installation, business, study, sweeping general permissions etc. not established by these poems are **UNKNOWN relative to this authority**; no invented source conflict or all-tradition prohibition is asserted. Legacy wording remains available only as compatibility data.

The table is the complete 28-row coverage inventory. Each page links the full surrounding poem. Empty positive/negative sets are deliberately unknown, not “nothing to avoid”.

| Tú | PDF page | Positive operative glosses | Negative operative glosses |
| --- | --- | --- | --- |
| Giác (角) | [46](https://archive.org/download/20241205_20241205_0310/page/n45.jpg) | Xây dựng; Cưới hỏi | Chôn cất; Sửa xây mộ (trong đoạn kiêng chôn cất) |
| Cang (亢) | [47](https://archive.org/download/20241205_20241205_0310/page/n46.jpg) | UNKNOWN | Xây dựng (đoạn nêu bất lợi); Chôn cất; Cưới hỏi (đoạn nêu bất lợi) |
| Đê (氐) | [48](https://archive.org/download/20241205_20241205_0310/page/n47.jpg) | UNKNOWN | Xây dựng; Chôn cất; Cưới hỏi; Đi thuyền |
| Phòng (房) | [49](https://archive.org/download/20241205_20241205_0310/page/n48.jpg) | Xây dựng; Chôn cất (đoạn nêu thuận lợi); Cưới hỏi | UNKNOWN |
| Tâm (心) | [50](https://archive.org/download/20241205_20241205_0310/page/n49.jpg) | UNKNOWN | Xây dựng; Chôn cất (đoạn nêu bất lợi); Cưới hỏi (đoạn nêu bất lợi) |
| Vĩ (尾) | [51](https://archive.org/download/20241205_20241205_0310/page/n50.jpg) | Xây dựng; Cưới hỏi; Chôn cất (đoạn nêu thuận lợi); Mở cửa; Dẫn nước | UNKNOWN |
| Cơ (箕) | [52](https://archive.org/download/20241205_20241205_0310/page/n51.jpg) | Xây dựng; Chôn cất; Sửa mộ; Mở cửa; Dẫn nước | UNKNOWN |
| Đẩu (斗) | [53](https://archive.org/download/20241205_20241205_0310/page/n52.jpg) | Xây dựng; Sửa xây mộ; Mở cửa; Dẫn nước | UNKNOWN |
| Ngưu (牛) | [54](https://archive.org/download/20241205_20241205_0310/page/n53.jpg) | UNKNOWN | Xây dựng; Cưới hỏi; Mở cửa (đoạn nêu bất lợi); Dẫn nước (đoạn nêu bất lợi) |
| Nữ (女) | [55](https://archive.org/download/20241205_20241205_0310/page/n54.jpg) | UNKNOWN | Xây dựng; Chôn cất; Mở cửa (đoạn nêu bất lợi); Dẫn nước (đoạn nêu bất lợi) |
| Hư (虛) | [56](https://archive.org/download/20241205_20241205_0310/page/n55.jpg) | UNKNOWN | Xây dựng; Mở cửa; Dẫn nước |
| Nguy (危) | [57](https://archive.org/download/20241205_20241205_0310/page/n56.jpg) | UNKNOWN | Dựng nhà cao; Chôn cất (đoạn nêu bất lợi); Mở cửa; Dẫn nước |
| Thất (室) | [58](https://archive.org/download/20241205_20241205_0310/page/n57.jpg) | Xây dựng; Mở cửa; Dẫn nước; Cưới hỏi; Chôn cất (đoạn nêu thuận lợi) | UNKNOWN |
| Bích (壁) | [59](https://archive.org/download/20241205_20241205_0310/page/n58.jpg) | Xây dựng; Cưới hỏi; Mở cửa; Dẫn nước; Chôn cất | UNKNOWN |
| Khuê (奎) | [60](https://archive.org/download/20241205_20241205_0310/page/n59.jpg) | Xây dựng | Chôn cất; Mở cửa; Dẫn nước |
| Lâu (婁) | [61](https://archive.org/download/20241205_20241205_0310/page/n60.jpg) | Dựng cột; Cưới hỏi; Mở cửa; Dẫn nước | UNKNOWN |
| Vị (胃) | [62](https://archive.org/download/20241205_20241205_0310/page/n61.jpg) | Xây dựng (câu tiếp nêu phú quý); Chôn cất; Cưới hỏi | UNKNOWN |
| Mão (昴) | [63](https://archive.org/download/20241205_20241205_0310/page/n62.jpg) | Xây dựng | Chôn cất; Mở cửa; Dẫn nước; Cưới hỏi |
| Tất (畢) | [64](https://archive.org/download/20241205_20241205_0310/page/n63.jpg) | Xây dựng; Chôn cất; Mở cửa; Dẫn nước; Cưới hỏi (đoạn nêu thuận lợi) | UNKNOWN |
| Chủy (觜) | [65](https://archive.org/download/20241205_20241205_0310/page/n64.jpg) | UNKNOWN | Xây dựng; Chôn cất |
| Sâm (參) | [66](https://archive.org/download/20241205_20241205_0310/page/n65.jpg) | Xây dựng; Mở cửa; Dẫn nước | Chôn cất; Cưới hỏi |
| Tỉnh (井) | [67](https://archive.org/download/20241205_20241205_0310/page/n66.jpg) | Xây dựng; Mở cửa; Dẫn nước | Chôn cất |
| Quỷ (鬼) | [68](https://archive.org/download/20241205_20241205_0310/page/n67.jpg) | Chôn cất | Xây dựng; Mở cửa; Dẫn nước; Cưới hỏi; Đắp đất xây tường |
| Liễu (柳) | [69](https://archive.org/download/20241205_20241205_0310/page/n68.jpg) | UNKNOWN | Xây dựng; Chôn cất; Mở cửa; Dẫn nước |
| Tinh (星) | [70](https://archive.org/download/20241205_20241205_0310/page/n69.jpg) | Dựng phòng mới | Chôn cất; Dẫn nước; Cưới hỏi (đoạn nêu chia lìa) |
| Trương (張) | [71](https://archive.org/download/20241205_20241205_0310/page/n70.jpg) | Dựng công trình (龍軒); Chôn cất; Mở cửa; Dẫn nước; Cưới hỏi | UNKNOWN |
| Dực (翼) | [72](https://archive.org/download/20241205_20241205_0310/page/n71.jpg) | UNKNOWN | Dựng nhà cao; Chôn cất (đoạn nêu bất lợi); Cưới hỏi; Mở cửa; Dẫn nước |
| Chẩn (軫) | [73](https://archive.org/download/20241205_20241205_0310/page/n72.jpg) | Công trình bên nước (龍宮); Chôn cất; Cưới hỏi | UNKNOWN |

## Independent gates and migration proof

Golden `shared/lunar/audit-fixtures/mansion-content-golden-v1.json` was visually transcribed **before** runtime implementation; it does not import or call production. Production JSON is a separate edition dataset; runtime never imports audit fixtures. Golden SHA-256: `4c4b1be57ac711e4209a348db919c0117d26b8aab94892711ed148607817a0b1`. The golden asserts all 28 rows, identity/index/page, every operative gloss, polarity, exact scope, condition and exception. Legacy parser fixtures remain separate and are not promoted into classical authority.

Before code changes, baseline decisions were captured on `adfd3b598545be067182654f4a1fdb2c54b7b974` for all **1095 dates, 2025-01-01 through 2027-12-31**, all enabled activity scores/statuses and every event profile with hour 09:00. Baseline SHA-256: `4ee182f6a4aeb35960ffff0565373dee88d9e825715ab35f3181279c40f66be5`. Regression recomputes each day digest without recapturing baseline. Source explanations may change; scores/statuses and event verdicts must not.

Mutation command: `python3 scripts/audit-mansion-content-mutations.py`. Nine semantic mutants: polarity flip; wrong mansion name; missing operand; grave repair merged into burial; water travel merged into road travel; dropped exception (synthetic transport fixture, not invented classical exception); unaudited promotion; nonzero applied mansion score; enabled scoring policy. Every mutant must trigger an assertion failure, with source files restored in `finally`. CI runs this gate in the unit/emulator job.

Validation recorded locally: all 28 authority rows and the 1095-day frozen decision regression pass; all nine mutants KILLED; full unit suite, typecheck/lint, and desktop/mobile E2E are required before PR readiness. GitHub CI and production deployment are recorded separately, never inferred from local success.

## Remaining boundary

This closes **edition-specific content coverage**, not source unanimity, taxonomy expansion or scoring/conflict resolution. Other editions, extra conditions, personal applications and unsupported legacy actions require their own source records/golden review. Phase 7 is not CLOSED until main CI and actual deploy are verified.
