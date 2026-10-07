# Calendar validation audit — 07/10/2026

**Phase 1: FAIL. Phase 2: NOT RUN (gate locked).**

Golden V1: **94/100 records** match all Core fields. Six records differ in lunar conversion and inverse conversion. Exhaustive Core invariants pass over **73,414 dates (1900–2100)**.
Total: 1,177,675 checks; 12 failed field comparisons describing six unique Golden records.

EXPECTED = unchanged Golden/spec; ACTUAL = engine. Mismatches remain FAIL even when independent evidence supports the engine.

| Module | PASS / FAIL | EXPECTED | ACTUAL | ROOT CAUSE | FIXED |
|---|---|---|---|---|---|
| Dataset | PASS | Golden V1 / spec invariants | 1/1 pass | — | N/A |
| JDN | PASS | Golden V1 / spec invariants | 146,928/146,928 pass | — | N/A |
| Lunar | FAIL | Golden V1 / spec invariants | 220,335/220,341 pass | Golden starts month 7/2026 one civil day early | NO: engine correct for disputed dates, Golden preserved |
| Lunar inverse | FAIL | Golden V1 / spec invariants | 73,508/73,514 pass | Golden starts month 7/2026 one civil day early | NO: engine correct for disputed dates, Golden preserved |
| Can Chi day | PASS | Golden V1 / spec invariants | 220,343/220,343 pass | — | N/A |
| Can Chi month | PASS | Golden V1 / spec invariants | 73,514/73,514 pass | — | N/A |
| Can Chi year | PASS | Golden V1 / spec invariants | 73,514/73,514 pass | — | N/A |
| Nap am | PASS | Golden V1 / spec invariants | 146,988/146,988 pass | — | N/A |
| Hoang Dao hours | PASS | Golden V1 / spec invariants | 220,342/220,342 pass | — | N/A |
| Leap months | PASS | Golden V1 / spec invariants | 2,171/2,171 pass | — | N/A |
| Elements | PASS | Golden V1 / spec invariants | 2/2 pass | — | N/A |
| Civil boundary | PASS | Golden V1 / spec invariants | 17/17 pass | — | N/A |

## Exact mismatches

| Date | EXPECTED lunar | ACTUAL lunar | EXPECTED inverse | ACTUAL inverse |
|---|---|---|---|---|
| 2026-08-13 | 02/07/2026 | 01/07/2026 | 2026-08-13 | 2026-08-14 |
| 2026-08-20 | 09/07/2026 | 08/07/2026 | 2026-08-20 | 2026-08-21 |
| 2026-08-27 | 16/07/2026 | 15/07/2026 | 2026-08-27 | 2026-08-28 |
| 2026-09-01 | 21/07/2026 | 20/07/2026 | 2026-09-01 | 2026-09-02 |
| 2026-09-03 | 23/07/2026 | 22/07/2026 | 2026-09-03 | 2026-09-04 |
| 2026-09-10 | 30/07/2026 | 29/07/2026 | 2026-09-10 | null (day 30 does not exist) |

## ROOT CAUSE evidence

- All six Golden dates imply month 7 starts 2026-08-12.
- Independent Astronomy Engine `SearchMoonPhase(0, 2026-08-01 UTC, 30)` gives **2026-08-12T17:37:11.343Z**, or **2026-08-13 00:37:11.343 UTC+7**. The local civil day containing the new moon is August 13, matching production.
- [NASA](https://eclipse.gsfc.nasa.gov/OH/OH2026.html) independently identifies the August 12 UTC new moon/solar eclipse. The exact UTC+7 day discrimination above is from the separate numerical phase solver.
- **Incorrect artifact: Golden V1 lunar values for the six listed dates.** No engine fix is justified.
- Golden generator is not provided; an omitted timezone conversion or a near-midnight approximation is plausible but unproven. We can establish the wrong start day, not its generator code defect.

## Coverage and limits

- A01–A03: exhaustive round-trip, valid fields, 29/30-day month lengths, daily transitions (year, normal/leap month boundaries). A04–A05: supplied Tết Golden cases and every leap-month day in the civil range.
- B01–B03: daily increments, parity, 60 unique combinations, 60-day/year repetition. Civil lunar month convention is compared separately; no solar-term/Bát Tự month assertions run.
- C01–C03: canonical stem/branch element tables, all 60 Nạp âm mappings, 30 pairs, 60-day repeat.
- G01–G05: canonical six-hour table across all dates, good/bad partition, all 12 branches, half-open interval endpoints, Dậu table regression.
- BD01–BD07 covered by exhaustive transitions. BD13–BD18: 22:59, 23:00, 23:59, 00:00, 00:59, 01:00 civil normalization. BD19 UTC/+7. BD20 checks VN normalization at US DST-change instants; arbitrary timezone/DST rendering APIs are not certified.
- B04 civil lunar rollover checked; B04 solar-term month boundaries and BD08–BD12 deferred to Phase 2.
- Whole-range invariants prove internal consistency, not independent astronomical correctness for every date.
- Independent JS Gregorian date arithmetic validates JDN over 1900–2100. Engine uses Julian/Gregorian cutover before 1582, outside audited range; universal proleptic support is not certified.

## Phase 2

| Module | PASS / FAIL | EXPECTED | ACTUAL | ROOT CAUSE | FIXED |
|---|---|---|---|---|---|
| Tiết khí | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| Tháng tiết khí | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| 12 Trực | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| 28 Tú | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| Ngày Hoàng/Hắc Đạo | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| Hỷ Thần | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| Tài Thần | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |
| Boundary giao tiết | NOT RUN | Golden V2 / spec | Not evaluated | Phase 1 FAIL gate | N/A |

V2 was read for scope only. No Extended engine comparison or property tests ran. Cát/Hung thần, Thụ Tử/Sát Chủ, advice/scoring and V3 were not audited.

## Reproduce

```sh
npx vitest run shared/lunar/calendarAudit.test.ts
```

This audit intentionally exits nonzero while the unchanged Golden disagrees. Existing Vitest includes this test, so the full suite stays red for the documented Golden defect. Existing focused Core suite: **92/92 tests across six files pass**. Lint, formatting and frontend `tsc -b` pass.

Raw per-field evidence: [phase1-results.json](phase1-results.json).

## Golden integrity (SHA-256)

Original Downloads files and workspace copies remain identical:
- `calendar-golden.json`: `af7b8f2b5149f8bb1d2a792ded41d970960020cd6586a922a33771c357942065`
- `calendar-golden-v2.json`: `219002684bbe48e1f0439f9406fd6f71f9342875fadcc5823e9965b1a57666b2`

No Golden record was edited, exempted or replaced with engine-generated expected values. No production engine changes, commit or push.
