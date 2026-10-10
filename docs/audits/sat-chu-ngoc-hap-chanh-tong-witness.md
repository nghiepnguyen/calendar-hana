# Sát Chủ / Thọ Tử — printed witness: Ngọc Hạp Chánh Tông

Status: **DECIDED 2026-10-10 — calendar Sát Chủ months 7/8 aligned to the Hán-văn verse; see “Decision”**
Date: 2026-10-10. Base: main `a69e8df`.
Related: `docs/audits/thu-tu-sat-chu-provenance.md` (Phase 5), `tasks/design-annual-directions-sat-chu.md`.

Phase 5 kept Sát Chủ `SOURCE_DEPENDENT` and said to reopen it only when “a traceable historical/printed Vietnamese source establishes the exact table”. This note records such a printed witness and one internal inconsistency it exposes. It does not reopen or close Phase 5 on its own.

## Source

| Field | Value |
|---|---|
| Title | _Ngọc Hạp Chánh Tông — Lập thành dễ hiểu_ (玉匣正宗), Phần I–III |
| Compiler | Viên-Tài Hà-Tấn-Phát (Tu sĩ Tịnh-Độ-Tông Việt-Nam) |
| Date | Not printed on the pages read; age tables span 1958–2057, so a mid/late 20th-century Vietnamese print |
| File | `Ngoc hap chanh tong.pdf` supplied by the user; 69 page images (two book pages per image), no text layer; “Scan by ncphuc1977” |
| SHA-1 | `95c29e2fd7c4b418555287a4dd1d2fbbfc3ebaae` |
| Reading | Visual reading of page images; key rows checked on full-resolution crops |

Classification: **secondary modern Vietnamese compilation** (the preface says it was compiled from an old Hán-script Ngọc Hạp plus the compiler's practice). It is a printed, traceable witness to Vietnamese folk-almanac tables; it is not a primary classical source. It cites named sub-sources (“sách Thọ-Mai”, “sách Lưu-Thị”, “sách Trần-Tử”) that were not themselves located.

## Findings

### 1. “Ngày Sát-Chủ” (theo sách Thọ-Mai) — book pp. 128–129 (PDF image 66)

Verse: _Nhứt Tỵ, nhị Tý, tam Dương vị / Tứ Thố, ngũ Hầu, lục Khuyển qui / Thất Trư, bát Ngưu, cửu Mã-thị / Thập Kê, Thập-nhứt Hổ, Thập-nhị Long._ Gloss: kỵ cất nhà, cưới gả.

| Month | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Book (verse = gloss) | Tỵ | Tý | Mùi | Mão | Thân | Tuất | **Hợi** | **Sửu** | Ngọ | Dậu | Dần | Thìn |
| `SAT_CHU_AM` (personal) | Tỵ | Tý | Mùi | Mão | Thân | Tuất | **Hợi** | **Sửu** | Ngọ | Dậu | Dần | Thìn |
| `stars.data.ts` “Sát Chủ” (calendar) | Tỵ | Tý | Mùi | Mão | Thân | Tuất | **Sửu** | **Hợi** | Ngọ | Dậu | Dần | Thìn |

The verse and its gloss agree, so this is not a typesetting slip in one place.

**Internal inconsistency (`UNKNOWN`, pending decision):** the repo has two Sát Chủ Âm tables that differ in months 7/8:

- `shared/personalFengShui/annual/afflictions.ts:44` `SAT_CHU_AM = [5, 0, 7, 3, 8, 10, 11, 1, 6, 9, 2, 4]` — test “keeps the corrected month 7 and 8 Sát Chủ Âm entries”; introduced in `38b5352` (2026-10-03). **Matches the book.**
- `shared/lunar/stars.data.ts:2058` generic star `Sát Chủ`, `byMonth` chi `[5, 0, 7, 3, 8, 10, 1, 11, 6, 9, 2, 4]`. Phase 5 audit table and `PROJECT_CONTEXT.md` §12 record the same order (7 Sửu, 8 Hợi) as the preserved legacy sequence.

Effect: for lunar months 7 and 8 the calendar layer and the personal layer can disagree about whether the same day is Sát Chủ.

The Phase 5 web sources (tierra.vn and others) were recorded as giving `…, Sửu, Hợi, …`. A printed witness now gives `…, Hợi, Sửu, …`. Per authority rules this must be classified, not silently resolved: candidate labels are `ENGINE_BUG` (calendar table transposed) or `SOURCE_DEPENDENT` (two folk variants). Majority of websites is not authority.

### 2. “Tháng Sát-Chủ” (theo sách Lưu-Thị) — p. 128 (image 66)

Verse: _Một, Chuột đào lỗ đã an / Hai, Ba, Bảy, Chín, Trâu toan kéo cày / Mùa Hè, Bốn, Chó sủa ngày / Sang qua Mười-Một, cụm cây Dê nằm / Mười-Hai, Sáu, Mười, Tám, Năm / Rồng nằm biển bắc…_

| Month | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Book | Tý | Sửu | Sửu | Tuất | Thìn | Thìn | Sửu | Thìn | Sửu | Thìn | Mùi | Thìn |
| `SAT_CHU_DUONG` | Tý | Sửu | Sửu | Tuất | Thìn | Thìn | Sửu | Thìn | Sửu | Thìn | Mùi | Thìn |

Exact match. The book does not use the labels Âm/Dương; it distinguishes the two by heading (“Ngày” vs “Tháng” Sát-Chủ) and by named sub-source. The project's Âm/Dương naming is therefore a modern label, not the book's.

### 3. Other same-name variants (pp. 128–133, images 66–68)

Printed alongside, each a separate identity, none to be merged into Sát Chủ by name (read at reduced resolution; re-check on crops before any use):

- **Giờ Sát-Chủ** (hour): months 1/7 Dần, 2/8 Tỵ, 3/9 Thân, 4/10 Thìn, 5/11 Dậu, 6/12 Mão.
- **Bốn mùa Sát-chủ**: months 1/5/9 Tý, 2/8/10 Mão, 3/7/11 Ngọ, 4/6/12 Dậu.
- **Ngày Sát-chủ trong bốn mùa** (kỵ cưới gả): Xuân Ngọ, Hạ Tý, Thu Mùi, Đông Mão.
- **Ngày Sát-Sư** (kỵ thầy cúng, p. 132): Tỵ, Tý, Mùi, Mão, **Hợi**, Tuất, **Ngọ**, **Thân**, **Sửu**, Dậu, Dần, Thìn. It differs from Ngày Sát-Chủ in months 5, 7, 8 and 9; verse _Nhức Xạ, nhị Thử, tam Dương phòng / Tứ Thố, ngũ Trư, lục Khuyển không / Thất Mã, bát Hầu, cửu Ngưu-chỉ…_. A plausible source of web confusion between “Sát Chủ” tables.
- **Tháng Sát-sư** (p. 133): months 1/11 Tý, 2 Sửu, 4 Mão, 3/6/7 Mùi, 9 Ngọ, 5/8/10/12 Dậu.

These confirm Phase 5's warning that tables under similar names conflict.

### 4. “Ngày Thọ-tử” — pp. 130–131 (image 67)

Gloss (kỵ cất nhà, cưới gả): 1 Bính-Tuất, 2 Nhâm-Thìn, 3 Tân-Hợi, 4 Đinh-Tỵ, 5 Mậu-Tý, 6 Bính-Ngọ, 7 Ất-Sửu, 8 Quý-Mùi, 9 Giáp-Dần, 10 Mậu-Thân, 11 Tân-Mão, 12 Tân-Dậu.

The branches equal the source-locked 受死 sequence (戌 辰 亥 巳 子 午 丑 未 寅 申 卯 酉). The book restricts each month to **one sexagenary day** (stem + branch) instead of every day with that branch. Classification: `CONVENTION_DIFFERENCE` / narrower variant. Phase 5 Thụ Tử authority (Month Jian + day branch, `六壬大全`) is unaffected. A **Giờ Thọ-tử** hour table is also printed (not reviewed further).

### 5. Not supplied by this book

- No convention for leap months, and no statement whether “tháng” is lunar month or solar-term month, for any of the tables above. Sát Chủ leap-month semantics stay **UNRESOLVED**.
- No 28 Tú verses; only a list of mansions good for weddings (p. 114: Giác, Trương, Đẩu, Phòng, Lâu, Vĩ, Vị, Cơ, Tất, Bích, Chẩn, Khuê, Tinh). Independent of the 1880 Ngọc Hạp content authority; not used to change it. Listing Tinh as good is consistent with treating 星-4 as a consequence line rather than a wedding taboo.
- No content for door opening / waterworks or narrow construction activities.
- 12 Trực appears only as a birth-month fate table (personal), not as day-officer activity rules.
- Pages 110–127 list many wedding/house-building stars (Thiên Đức, Nguyệt Đức, Bất Tương, Thiên/Địa Hỏa, Tam Tai, Kim Lâu, Hoang Ốc, …). Usable later as secondary witnesses when auditing star context; each needs its own provenance check.

## Recommended next steps (not implemented)

1. Decide the 7/8 inconsistency on a dedicated audit branch. Before any change: freeze an independent Golden from this witness; list every consumer of the calendar `Sát Chủ` star and of `SAT_CHU_AM`; classify every resulting day diff as `EXPECTED_AUTHORITY_MIGRATION_CHANGE` or `UNEXPECTED_REGRESSION`.
2. Look for the cited sub-sources (Thọ-Mai, Lưu-Thị) or an older Hán-script witness to reach beyond a secondary compilation.
3. Keep Sát Chủ (ngày), Sát Chủ (tháng/Dương), the seasonal variants and Sát Sư as separate identities.
4. Never infer Sát Chủ from Thụ Tử, and never move it to Month Jian on this evidence, because the book is silent on the month basis.

Until a decision is made, legacy behavior of both tables stays unchanged.

## Decision (2026-10-10, branch `audit/sat-chu-month-7-8`)

User request: open a dedicated audit branch to resolve the 7/8 inconsistency between the calendar and personal layers.

Further evidence found:

- The project owner's spec `Spec Ngày Thụ Tử & Sát Chủ.md` already chose the Hán-văn verse (“Nhất Tị, Nhì Tý, Tam Dương vị, Tứ Mão, ngũ hầu, lục Khuyển quy, Thất trư, bát ngưu, …”), marked months 7/8 as corrected from Sửu/Hợi, and recorded the Nôm verse (“Bảy trâu đực chọi cùng trâu cái / Tám dê leo núi lợn xông quàng”) as the variant that gives 7 Sửu / 8 Hợi. `SAT_CHU_AM` (commit `38b5352`) implemented that spec; the calendar star table was never updated.
- The printed witness above gives the same Hán-Việt verse and a month-by-month gloss, both 7 Hợi / 8 Sửu.

Classification: the calendar table followed the Nôm variant while the project had selected the Hán-văn variant. This is an inconsistency between two layers that implement the same selected rule (`ENGINE_BUG` for the calendar layer). It is not a claim that the Nôm variant is wrong as folk tradition; that variant stays recorded as rejected for this product.

Change:

- `shared/lunar/stars.data.ts` Sát Chủ `byMonth`: month 7 Sửu → **Hợi**, month 8 Hợi → **Sửu**. No other row changes.
- Independent golden `shared/lunar/audit-fixtures/sat-chu-golden-v1.json`: verse, witnesses, rejected Nôm variant, operands `LUNAR_MONTH + DAY_BRANCH`, leap semantics unresolved, `globalScoreAllowed: false`. Hand-transcribed from the verse, not copied from production.
- `shared/lunar/satChuAuthority.test.ts`: both layers must equal the golden; every 2025–2027 display difference must be a Sửu/Hợi day in lunar month 7 or 8 (`EXPECTED_AUTHORITY_MIGRATION_CHANGE`).
- `shared/personalFengShui/rules.test.ts`: the “keep the existing table” assertion now reads the golden.

Impact:

- Display only. Sát Chủ has no entry in `bad-gods.json`, so it is not mapped to scoring; activity scores, statuses and event verdicts (frozen baselines) are unchanged.
- 29 days in 2025–2027 change: 14 gain Sát Chủ in the calendar star list and 15 lose it, for example 2026-08-17, 2026-09-12, 2026-09-24, 2026-10-06 gain it and 2026-08-19, 2026-09-22, 2026-10-04 lose it.
- Unchanged: month basis (lunar month), leap behaviour (base month), Thụ Tử authority, Sát Chủ Dương, seasonal/hour variants, separation from Thụ Tử.

Still unresolved: primary (pre-modern) text of the verse; leap-month rule; the sub-sources “Thọ-Mai”, “Lưu-Thị”.

Validation (local): `npm test` 141 files / 2798 tests; typecheck, lint, build; mutation gates (mansion 9/9, annual directions 7/7 KILLED); Playwright desktop 104 passed / 16 skipped.

