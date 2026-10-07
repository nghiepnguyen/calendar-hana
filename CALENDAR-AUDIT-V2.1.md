# Calendar Audit V2.1

Phase 1: **PASS**
Phase 2.1: **FAIL** — instant-aware 12 Trực cannot be verified: production API unavailable.

Audit date: 2026-10-07. Timezone: Asia/Ho_Chi_Minh. Range: 1900-01-01–2100-12-31 (73,414 civil days).

Authority: Patch 2.1 > original validation spec > corrected Golden V1 / Golden V2.1. Old Golden V2 is historical only. No production changes were made during this audit.

| Module | Status | Expected | Actual | Classification | Root Cause | Action |
|---|---|---|---|---|---|---|
| Core: Dataset | PASS | 1 checks | 0 failures | — | — | No fix |
| Core: JDN | PASS | 146,928 checks | 0 failures | — | — | No fix |
| Core: Lunar | PASS | 220,341 checks | 0 failures | — | — | No fix |
| Core: Lunar inverse | PASS | 73,514 checks | 0 failures | — | — | No fix |
| Core: Can Chi day | PASS | 220,343 checks | 0 failures | — | — | No fix |
| Core: Can Chi month | PASS | 73,514 checks | 0 failures | — | — | No fix |
| Core: Can Chi year | PASS | 73,514 checks | 0 failures | — | — | No fix |
| Core: Nap am | PASS | 146,988 checks | 0 failures | — | — | No fix |
| Core: Hoang Dao hours | PASS | 220,342 checks | 0 failures | — | — | No fix |
| Core: Leap months | PASS | 2,171 checks | 0 failures | — | — | No fix |
| Core: Elements | PASS | 2 checks | 0 failures | — | — | No fix |
| Core: Civil boundary | PASS | 17 checks | 0 failures | — | — | No fix |
| V2.1 Core integrity | PASS | 700 checks | 0 failures | — | — | No fix |
| Solar term at noon | PASS | 100 checks | 0 failures | — | — | No fix |
| Solar month at noon | PASS | 100 checks | 0 failures | — | — | No fix |
| 12 Truc exact API at noon | FAIL / API unavailable | 100 checks | 100 unverifiable inputs | CONVENTION_DIFFERENCE | Missing instant-aware Officer API | Report first; API implementation needed before acceptance |
| 28 Tu | PASS | 220,343 checks | 0 failures | — | — | No fix |
| Hoang Hac Dao type | PASS | 100 checks | 0 failures | — | — | No fix |
| Hoang Hac Dao god | PASS | 100 checks | 0 failures | — | — | No fix |
| Hy Than | PASS | 100 checks | 0 failures | — | — | No fix |
| Tai Than | PASS | 100 checks | 0 failures | — | — | No fix |
| Legacy 12 Truc daily invariant | PASS | 217,829 checks | 0 failures | — | — | No fix |
| Directions invariant | PASS | 73,414 checks | 0 failures | — | — | No fix |
| Solar term invariant | PASS | 5,025 checks | 0 failures | — | — | No fix |
| Solar term minute boundary | PASS | 14,472 checks | 0 failures | — | — | No fix |
| Bazi exact month minute boundary | PASS | 7,236 checks | 0 failures | — | — | No fix |
| 12 Truc exact API minute boundary | FAIL / API unavailable | 7,236 checks | 7,236 unverifiable inputs | CONVENTION_DIFFERENCE | Missing instant-aware Officer API | Report first; API implementation needed before acceptance |
| HKO independent transition reference | PASS | 24 checks | 0 failures | — | — | No fix |
| Hoang Hac Dao 144 combinations | PASS | 288 checks | 0 failures | — | — | No fix |
| Direction provenance | UNVERIFIED | sourceId / ruleVersion / directionConvention | runtime fields absent | SOURCE_DEPENDENT | Missing metadata | Lock and expose source metadata |
| 28 Tú provenance | UNVERIFIED | independently cited anchor | project Bích anchor only | SOURCE_DEPENDENT | No scholarly citation | Verify anchor source |

Golden V1: 100/100 records PASS. Golden V2.1 Core: 100/100 PASS. Extended calculable fields: 100/100 per field PASS. No exact-instant 12 Trực output was fabricated from the test formula or the whole-day API. Phase 2.1 remains failed.

## Unique root causes

1. **API_LIMITATION / CONVENTION_DIFFERENCE** — expected Trực at noon and at crossing ±1 minute; actual production exact-instant output is unavailable. `getOfficer(jd, dayChi)` uses the month of the whole civil day. 100 noon samples and 7,236 boundary inputs are unverifiable, not 7,336 independent calculation bugs. Patch §3 requires an instant-aware result. Confidence HIGH from the exported signature and dependency. Recommended action: add an explicitly instant-aware Officer API and regression tests after reviewing this finding; preserve the legacy presentation API. FIXED: NO.

2. **LEGACY_CONVENTION / CONVENTION_DIFFERENCE** — 13 Golden noon days and 2,409 boundary observations differ from the whole-day API. They are excluded from the *exact* result identity by specification, but retained as observations, not skipped failures. Expected/actual pairs for each input are in JSON. Confidence HIGH. Recommended action: label/document the presentation convention. FIXED: NO.

3. **NAMING_ONLY** — `Câu Trận` versus `Câu Trần`, and cardinal labels such as `Nam` versus `Chính Nam`. Raw strings remain in observations/JSON; only explicitly approved aliases normalize for semantic comparison. All normalized comparisons PASS. Confidence HIGH from Patch §1 and supplied request. FIXED: audit comparison follows patch; production labels unchanged.

4. **SOURCE_DEPENDENT** — direction runtime metadata absent. Calculation PASS; provenance UNVERIFIED. Golden ruleVersion does not provide runtime sourceId/directionConvention. Confidence HIGH for absence. Recommended action: supply versioned source metadata, without changing numeric mapping. FIXED: NO.

5. **SOURCE_DEPENDENT** — 28 Tú anchor numeric cycle PASS but scholarly provenance UNVERIFIED. Bích on 2026-09-30 is authoritative for this project dataset, not independent historical validation. Recommended action: obtain a cited canonical anchor. FIXED: NO.

## Independent evidence and limits

- [Hong Kong Observatory 2024 solar-term table](https://www.hko.gov.hk/en/gts/astron2024/files/2024SolarTerms24.pdf) and [2025 table](https://www.hko.gov.hk/en/gts/astron2025/files/2025SolarTerms24.pdf): 24 existing reference cases PASS within the original fixture’s 60-second resolution. Tolerance was not changed.
- [Joey Yap original 20 April–19 May 2026 Tong Shu](https://www.joeyyap.com/30daystongshu/ProTongShu_20Apr-19May.pdf): 20 April lists Heavenly Jail for lunar month 3 / Giáp Tý; 25 April (Kỷ Tỵ) lists wealth South. These support sampled mappings, not universal tradition provenance.
- Exhaustive transition tests use production-calculated crossing instants to test selection semantics; expected term/month identities come from fixed canonical order and Patch rules. They do **not** independently prove the astronomical timestamps for every year. Independent timestamp checks are limited to the 24 HKO samples.
- Golden approximate longitude remains diagnostic because it specifies noon regression precision, not a strict numeric error bound. Apparent and geometric longitude diagnostics are preserved; no invented tolerance makes them pass.

## Tests executed

- Core gate: `npx vitest run shared/lunar/calendarAudit.test.ts` PASS 2/2; seven Core test files PASS 94/94.
- Extended gate: `npx vitest run shared/lunar/calendarExtendedAudit.test.ts` FAIL 1/1, solely unavailable instant-aware Trực output.
- Full suite: `npm test` — 110/111 files and 1,258/1,259 tests PASS. The only failed test is the explicit Phase 2.1 exact-Trực availability gate; no other failures.
- `npm run lint` PASS; `npm run typecheck` PASS.

## Total assertions

- Core internal checks: 1,177,675; failures: 0.
- Extended internal checks: 547,267; calculated/invariant checks passed: 539,931; unavailable exact Trực checks: 7,336.
- Totals above count the audit’s explicit `check` calls; Vitest test counts and ordinary setup assertions are separate.
- Unique root-cause groups: 5, including aliases and provenance, not independent engine bugs.

## Files and safety checks

- Production files changed: **none**.
- Golden files changed in this audit: **none**. Corrected V1 remains unchanged; V2.1 copied byte-for-byte into the repo. Prior authorized six-record V1 correction is historical.
- Test harness changed: `shared/lunar/calendarExtendedAudit.test.ts` now uses V2.1 authority and allowed aliases; no `.skip`, per-date exceptions, weakened tolerances or production-generated expected outputs added.
- Historical V2 test expectations are superseded by the user’s explicit authority change; old result and mismatch files remain intact.
- Input hashes verified before/after; see `v2.1-input-hashes.json`.
- `graphify update .` completed (AST-only).

## Remaining uncertainties / provenance gaps

- Instant-aware Trực semantics cannot be verified until production exposes the required output.
- No exhaustive independent timestamp fixture exists for all 4,824 transitions.
- Direction sourceId/directionConvention and runtime ruleVersion missing; 28 Tú anchor independently unverified.

## Recommendation for Phase 3

**Do not unlock Phase 3.** Complete instant-aware Trực validation and rerun Phase 2.1 to 100% first. Cát/Hung thần, Thụ Tử/Sát Chủ, activity advice and scoring were not audited or modified.
