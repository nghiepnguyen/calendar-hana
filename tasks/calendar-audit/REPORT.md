# Calendar audit — corrected V1, unchanged V2

**Phase 1 PASS 100%. Phase 2 FAIL — evidence reported; no automatic corrections.**

## Phase 1 correction

Changed ONLY six `lunar.day` fields in the workspace V1 fixture and original Downloads V1. Metadata and other records/fields are unchanged. Restoring those six days reproduces the exact pre-correction SHA-256. No production calendar files were modified.

| Date | Old EXPECTED | Corrected EXPECTED / ACTUAL | ROOT CAUSE | FIXED |
|---|---|---|---|---|
| 2026-08-13 | 2/7/2026 | 1/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |
| 2026-08-20 | 9/7/2026 | 8/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |
| 2026-08-27 | 16/7/2026 | 15/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |
| 2026-09-01 | 21/7/2026 | 20/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |
| 2026-09-03 | 23/7/2026 | 22/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |
| 2026-09-10 | 30/7/2026 | 29/7/2026 | Old Golden began month7 one day early | YES, Golden V1 only |

Regression asserts Aug12 = 30/6, Aug13 = 1/7, inverse 1/7 = Aug13, and new-moon instant 2026-08-12T17:37:11.343Z falls on Aug13 in UTC+7. No engine change.

## Phase 1 results

| Module | PASS / FAIL | EXPECTED | ACTUAL | ROOT CAUSE | FIXED |
|---|---|---|---|---|---|
| Dataset | PASS | Corrected V1 + spec | 1/1 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| JDN | PASS | Corrected V1 + spec | 146,928/146,928 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Lunar | PASS | Corrected V1 + spec | 220,341/220,341 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Lunar inverse | PASS | Corrected V1 + spec | 73,514/73,514 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Can Chi day | PASS | Corrected V1 + spec | 220,343/220,343 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Can Chi month | PASS | Corrected V1 + spec | 73,514/73,514 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Can Chi year | PASS | Corrected V1 + spec | 73,514/73,514 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Nap am | PASS | Corrected V1 + spec | 146,988/146,988 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Hoang Dao hours | PASS | Corrected V1 + spec | 220,342/220,342 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Leap months | PASS | Corrected V1 + spec | 2,171/2,171 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Elements | PASS | Corrected V1 + spec | 2/2 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |
| Civil boundary | PASS | Corrected V1 + spec | 17/17 checks | None remaining | Six V1 lunar days corrected; otherwise N/A |

- Golden: 100/100 records. Full property range: 73,414 dates; 1,177,675 checks, zero failures. Boundary regression PASS.
- Combined focused Core run: 94/94 tests across 7 files PASS. Subsequent fresh Core audit: 2/2 PASS before Phase 2.
- `phase1-results.json` contains PASS and the current V1 checksum. Extended audit checks this gate and checksum before evaluating V2.

## Phase 2 results

| Module / check | PASS / FAIL | EXPECTED | ACTUAL | ROOT CAUSE | FIXED |
|---|---|---|---|---|---|
| V2 Core integrity | PASS | Unchanged V2 / spec | 700/700 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar term at noon | PASS | Unchanged V2 / spec | 100/100 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar month at noon | PASS | Unchanged V2 / spec | 100/100 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar month production day vs noon Golden | FAIL | Unchanged V2 / spec | 87/100 pass; 13 mismatches | Production day API labels the whole crossing day with the new month; V2 expects the month active at local noon. Specification/production convention conflict, not a wrong astronomical crossing. | NO production/V2 edits |
| 12 Truc production day vs noon Golden | FAIL | Unchanged V2 / spec | 87/100 pass; 13 mismatches | Same whole-day vs noon month convention; getOfficer accepts integer JDN, not an instant. It uses the new month before the actual crossing. | NO production/V2 edits |
| 28 Tu | PASS | Unchanged V2 / spec | 220,343/220,343 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Hoang Hac Dao type | FAIL | Unchanged V2 / spec | 62/100 pass; 38 mismatches | Golden V2 advances its starting Chi backwards by 2 per lunar month; production advances forwards. This changes god indices and good/bad type. | NO production/V2 edits |
| Hoang Hac Dao god | FAIL | Unchanged V2 / spec | 36/100 pass; 64 mismatches | Reverse month-offset sign in V2; some cases additionally differ only by Cau Tran/Cau Tran spelling (Câu Trận vs Câu Trần). | NO production/V2 edits |
| Hy Than | PASS | Unchanged V2 / spec | 100/100 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Tai Than | FAIL | Unchanged V2 / spec | 86/100 pass; 14 mismatches | All 14 mismatches are Ky stem: Golden North, production South. Source-dependent lookup convention differs; no locked sourceId/ruleVersion determines which convention the project adopts. | NO production/V2 edits |
| 12 Truc daily invariant | PASS | Unchanged V2 / spec | 217,829/217,829 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Directions invariant | PASS | Unchanged V2 / spec | 73,414/73,414 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar term invariant | PASS | Unchanged V2 / spec | 5,025/5,025 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar term minute boundary | PASS | Unchanged V2 / spec | 14,472/14,472 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Bazi exact month minute boundary | PASS | Unchanged V2 / spec | 7,236/7,236 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Solar month production minute boundary | FAIL | Unchanged V2 / spec | 4,827/7,236 pass; 2,409 mismatches | Integer-JDN day API changes the month from midnight of the crossing day, so t-1 minute often already returns the new month. It cannot satisfy instant-based spec before crossing. | NO production/V2 edits |
| 12 Truc production minute boundary | FAIL | Unchanged V2 / spec | 4,827/7,236 pass; 2,409 mismatches | Officer day API uses prematurely advanced calendar-day month before the exact crossing; same convention conflict as month API. | NO production/V2 edits |
| HKO independent transition reference | PASS | Unchanged V2 / spec | 24/24 pass; 0 mismatches | None in executed checks | NO production/V2 edits |
| Hoang Hac Dao 144 combinations | FAIL | Unchanged V2 / spec | 276/288 pass; 12 mismatches | Twelve cases differ only in Câu Trận vs Câu Trần naming; boolean type matches the forward canonical table in all 144 cases. | NO production/V2 edits |

Counts are failed assertions, not independent defects: type/god and month/Truc assertions often describe the same date or boundary.
Full per-mismatch EXPECTED / ACTUAL / ROOT CAUSE / independent evidence / FIXED: [CSV](phase2-mismatches.csv), [JSON](phase2-mismatches.json). Every failing assertion, including all historical boundaries, has a row. Raw observations: [phase2-results.json](phase2-results.json).

## Boundary and Trực evidence

13 V2 dates disagree with the day-based month/Truc APIs. All 13 expected Truc values follow the local-noon month; production advances at midnight of the eventual crossing day. This contradicts the supplied time-sensitive convention but matches the explicitly documented existing day-label convention. An instant-aware Truc/month API would be required to satisfy the spec without changing calendar presentation. No such change was made.

| Date | EXPECTED Trực | ACTUAL Trực | Noon month | Whole-day month | Crossing UTC |
|---|---|---|---|---|---|
| 2024-02-04 | Thâu | Thành | Sửu | Dần | 2024-02-04T08:26:49.630Z |
| 2024-07-06 | Trừ | Kiến | Ngọ | Mùi | 2024-07-06T14:20:07.101Z |
| 2025-03-05 | Nguy | Phá | Dần | Mão | 2025-03-05T08:07:17.119Z |
| 2025-05-05 | Phá | Chấp | Thìn | Tỵ | 2025-05-05T05:57:21.708Z |
| 2025-09-07 | Nguy | Phá | Thân | Dậu | 2025-09-07T08:51:50.124Z |
| 2026-03-05 | Kiến | Bế | Dần | Mão | 2026-03-05T13:58:43.971Z |
| 2026-05-05 | Bế | Khai | Thìn | Tỵ | 2026-05-05T11:49:09.475Z |
| 2026-09-07 | Kiến | Bế | Thân | Dậu | 2026-09-07T14:41:44.296Z |
| 2026-10-08 | Phá | Chấp | Dậu | Tuất | 2026-10-08T06:29:58.055Z |
| 2027-10-08 | Bế | Khai | Dậu | Tuất | 2027-10-08T12:16:48.445Z |
| 2027-12-07 | Thâu | Thành | Hợi | Tý | 2027-12-07T08:37:51.994Z |
| 2028-02-04 | Phá | Chấp | Sửu | Dần | 2028-02-04T07:31:07.292Z |
| 2028-07-06 | Khai | Thâu | Ngọ | Mùi | 2028-07-06T13:30:06.955Z |

All 4,824 solar-term crossings (24/year across 201 years) pass before/exact/after checks: 14,472/14,472. Exact Bazi month context passes 7,236/7,236 month-opening checks. The calendar-day month and Truc each fail 2,409 of those 7,236 checks, at t−1 minute. The other three pre-crossing instants fall on the previous civil day.
Independent HKO reference: 24/24 supplied timestamps in 2024/2025 agree within 60 seconds. [HKO 2024](https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf), [HKO 2025](https://www.hko.gov.hk/en/gts/astron2025/files/2025SolarTerms24.pdf). These samples support the solver; full 1900–2100 exact-instant invariants are internal-model checks, not independent ephemeris verification for every year.

## Hoàng/Hắc Đạo evidence

Independent reconstruction from all V2 records gives Thanh Long start branches **Tý, Tuất, Thân, Ngọ, Thìn, Dần** for months1–6; production uses **Tý, Dần, Thìn, Ngọ, Thân, Tuất**. V2 effectively uses `dayChi + 2*(month−1)` while production uses `dayChi − 2*(month−1)` for the god index. This explains the non-spelling god and type mismatches; it is not caused by Truc or a lunar conversion error.
An independently published original almanac provides a spot check: 20 Apr2026, lunar month3, Giáp Tý is Thiên Lao, consistent with production forward counting. [Joey Yap Tong Shu, page2](https://www.joeyyap.com/30daystongshu/ProTongShu_20Apr-19May.pdf#page=2). This supports production but does not substitute for a fully locked VN rule source.
Spelling Câu Trần (V2) versus Câu Trận (production) is retained as a separate raw-label mismatch; both refer to index11 and bad polarity. All144 boolean combinations pass against the independently enumerated forward table; 12 name assertions fail on this spelling. No naming normalization was used to hide them.

## Tài Thần evidence

All14 mismatches are Kỷ days: EXPECTED Bắc, ACTUAL Nam. [Original Tong Shu page7](https://www.joeyyap.com/30daystongshu/ProTongShu_20Apr-19May.pdf#page=7) lists 25 Apr2026 (Kỷ Tỵ) with wealth direction South, supporting current production. The Golden marks directions as needing a source lock. The project must choose a canonical source/version/convention before treating either lookup as universally authoritative. No majority-vote or automatic fix.
Hỷ Thần matches all100 records. Display aliases (Chính Nam↔Nam etc.) and case are explicitly normalized only for compass semantics; raw originals remain in immutable V2.

## Numeric longitude and provenance limits

Golden V2 approximate longitudes agree with independently recomputed Meeus geometric longitude to its four-decimal rounding (max absolute residual <0.00005°). Production uses apparent longitude; these are different quantities. All100 noon term classifications still agree. No numeric tolerance was invented for a field labelled Approximate with no acceptance threshold; full residuals are recorded.
28 Tú passes the continuous cycle, every-day +1/+28, and supplied Bích anchor across the full range. This is validation against the chosen anchor, not an independent scholarly certification of that anchor.
The spec requires versioned rule provenance. Current direction mappings and mansion anchor are not complete runtime `sourceId/ruleVersion/directionConvention` or verified-anchor objects. Numeric PASS does not certify those metadata requirements; they remain unverified and no production metadata was added.

## Reproduce and gates

```sh
npx vitest run shared/lunar/calendarAudit.test.ts && npx vitest run shared/lunar/calendarExtendedAudit.test.ts
```

The first command must succeed before the second executes. Phase2 intentionally exits nonzero for reported mismatches. It is included by the default Vitest configuration, so the full suite remains red until these disagreements are resolved. Existing focused Extended tests (unchanged project conventions): 61/61 across4 files PASS. Lint, formatting and `tsc -b` PASS.

## File integrity

- V1 original pre-correction SHA-256: `af7b8f2b5149f8bb1d2a792ded41d970960020cd6586a922a33771c357942065`
- V1 corrected SHA-256: `d368f30dc2c597daa6a4661a4db04c25c2f4178ab2e51b3dc7d20ef9610b5e37`
- V2 unchanged SHA-256: `219002684bbe48e1f0439f9406fd6f71f9342875fadcc5823e9965b1a57666b2`
- Downloads/workspace versions match byte-for-byte. Exactly six V1 field substitutions verified by inverse restoration/hash.

No Cát/Hung thần, Thụ Tử/Sát Chủ, activity advice or scoring assertions ran. No V3, production edit, commit or push. Prior audit retained as [historical report](phase1-before-correction.md).
