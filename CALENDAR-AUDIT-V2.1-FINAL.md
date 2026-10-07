# Calendar Audit V2.1 — Final

Phase 1: **PASS**
Phase 2.1 calculation: **PASS**
Provenance: **UNVERIFIED**

Date: 2026-10-07. Timezone: Asia/Ho_Chi_Minh, fixed civil UTC+7 per the specification. Patch 2.1 takes priority over the original spec. No Phase 3 audit was started.

## Production implementation

- `shared/lunar/solarTerms.ts`: added `getSolarMonth(dateTime, timezone)`, returning active month branch index (0 = Tý). Reuses `getSolarTermAt` and its existing exact astronomical crossings; no second astronomical algorithm.
- `shared/lunar/officers.ts`: added `getOfficerAtInstant(dateTime, timezone)`. Uses the active exact month, the civil day branch in the explicit timezone and the unchanged 12-Officer table.
- Both functions are already exported through the existing library barrel’s export-all statements.
- Input timestamp must contain Z or an explicit offset; timezone must be supplied and valid. No implicit machine-local parsing.
- At a month-opening crossing the new month is active; one minute before it the previous month remains active. Civil midnight does not advance the month prematurely.
- Vietnam civil dates reuse `todayInVietnam`, preserving the project’s fixed UTC+7 across 1900–2100. Other explicit IANA zones use their timezone rules.
- `getOfficer(jd, dayChi)` formula, table and existing callers remain unchanged; documentation now identifies it as legacy whole-day presentation.

```ts
getSolarMonth("2026-09-07T12:00:00+07:00", "Asia/Ho_Chi_Minh")
getOfficerAtInstant("2026-09-07T12:00:00+07:00", "Asia/Ho_Chi_Minh")
```

## Calculation results

| Module | Status | Expected | Actual | Root cause / Fixed |
|---|---|---|---|---|
| Phase 1 | PASS | Golden 100/100, 1,177,675 internal checks | Zero failures | Core unchanged |
| V2.1 Core integrity | PASS | 700 checks | 700 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Solar term at noon | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Solar month at noon | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| 12 Truc exact API at noon | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| 28 Tu | PASS | 220,343 checks | 220,343 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Hoang Hac Dao type | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Hoang Hac Dao god | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Hy Than | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Tai Than | PASS | 100 checks | 100 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Legacy 12 Truc daily invariant | PASS | 217,829 checks | 217,829 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Directions invariant | PASS | 73,414 checks | 73,414 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Solar term invariant | PASS | 5,025 checks | 5,025 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Solar term minute boundary | PASS | 14,472 checks | 14,472 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Bazi exact month minute boundary | PASS | 7,236 checks | 7,236 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Solar month exact API minute boundary | PASS | 7,236 checks | 7,236 passed | Instant API gap fixed where applicable; otherwise unchanged |
| 12 Truc exact API minute boundary | PASS | 7,236 checks | 7,236 passed | Instant API gap fixed where applicable; otherwise unchanged |
| HKO independent transition reference | PASS | 24 checks | 24 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Hoang Hac Dao 144 combinations | PASS | 288 checks | 288 passed | Instant API gap fixed where applicable; otherwise unchanged |
| Direction provenance | UNVERIFIED | sourceId, ruleVersion, directionConvention | Existing gaps retained | Not modified |
| 28 Tú anchor provenance | UNVERIFIED | independent scholarly anchor | Project anchor only | Not modified |

Extended internal checks: **554,503**, zero failures. Includes the former 100 noon and 7,236 transition Trực inputs, now evaluated using real production output.

## Regression tests added

`shared/lunar/officers.instant.test.ts` adds five tests: API availability; midnight/before/exact/after Bạch Lộ with legacy behavior preserved; explicit civil timezone and equivalent-offset instants; invalid/ambiguous input rejection; historical Vietnam fixed-UTC+7 regression.

The historical regression first failed: 1907-05-06T16:54:43.621Z returned Bế when a general timezone formatter used the next civil day under historical tzdb offsets. Expected Khai under the project’s civil UTC+7 rule. Reusing the existing UTC+7 helper fixed all 42 affected boundary checks, without per-date production exceptions.

`shared/lunar/calendarExtendedAudit.test.ts`: former unavailable outputs replaced with calls to the production API. Golden expected values and boundary expected formulas are unchanged. Added direct checks of the new solar-month API for all 7,236 month-transition inputs; retained the separate Bazi boundary checks.

## Validation

- New regression tests were observed failing before production implementation.
- Focused Officer / legacy / Extended audit: 3 files, 16/16 tests PASS.
- `npm test`: PASS — 112/112 files, 1,264/1,264 tests. Includes the existing Core audit as part of the requested full suite; no separate Phase 1 rerun was scheduled.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS (app and functions).
- `git diff --check`: PASS.
- Formatting of touched TypeScript and this report: PASS.
- `graphify update .`: completed, AST only.

## Safety and preserved scope

- Production files changed: only `shared/lunar/solarTerms.ts` and `shared/lunar/officers.ts`.
- Golden datasets changed: **none**; V1, V2.1 and historical V2 input hashes match `tasks/calendar-audit/v2.1-input-hashes.json`. V2.1 repo copy remains byte-identical to the supplied file.
- No expected result was generated by the new API; no tests skipped, tolerance changes, hard-coded transitions or per-date exceptions.
- 28 Tú, directions, Hoàng/Hắc Đạo calculation logic and provenance metadata were not changed.
- Legacy presentation observations remain: 13 noon days and 2,409 boundary inputs differ from exact-instant context by design. They are not calculation failures. Historical mismatch JSON and the prior report are retained as history, not current failing outputs.

## Remaining limits

- Direction provenance = **UNVERIFIED**.
- 28 Tú anchor provenance = **UNVERIFIED**.
- Full-range crossing tests prove selection semantics around computed instants. Independent timestamp comparison remains limited to the existing 24 HKO reference samples and unchanged fixture tolerance; no new astronomical precision claim is made.

## Phase 3

**Not started.** Phase 2.1 calculation acceptance is met; provenance gaps remain separately recorded.
