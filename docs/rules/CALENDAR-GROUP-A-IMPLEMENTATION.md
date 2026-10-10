# Calendar Group A — implementation audit

Status: PASS. Scope: Nguyệt Kỵ, Tứ Ly, Tứ Tuyệt only.

The latest user instruction authorizes Group A implementation against frozen Golden V3. Historical candidate/review and excluded-production fields in the frozen manifest remain untouched; this report records the new authorization rather than rewriting those files.

| Module | Result | EXPECTED | ACTUAL | ROOT CAUSE | FIXED |
| --- | --- | --- | --- | --- | --- |
| Nguyệt Kỵ | PASS 24/24 | Lunar days 5,14,23; normal/leap months | Exact frozen matches | Missing admitted production evaluator | Yes |
| Tứ Ly | PASS 38/38 | UTC+7 civil D−1 of 0°,90°,180°,270° crossings | Exact frozen matches | Missing admitted production evaluator | Yes |
| Tứ Tuyệt | PASS 38/38 | UTC+7 civil D−1 of 315°,45°,135°,225° crossings | Exact frozen matches | Missing admitted production evaluator | Yes |

## API and evidence

`evaluateGroupAAtInstant(instant, timezone)` is exported from `shared/lunar/index.ts`. Requires a zoned absolute instant, explicit `Asia/Ho_Chi_Minh`, and supported civil years 1900–2100. Uses fixed UTC+7 for historical dates as locked by the validation convention. Reuses `solarTermsForYear`; no new astronomy, per-date exception, or legacy star-table dependency.

Returns all three canonical raw matches, source/version/text evidence and calculation context, plus ID-based travel warnings with canonical rule IDs as reasons. Nguyệt Kỵ has no activity prohibition. Tứ Ly/Tứ Tuyệt affect travel only. No severity, score or whole-day auspiciousness conclusion. `normalizeGroupARuleId` maps locked aliases to canonical IDs. Group B/C remain pending and are not admitted by this API.

Source: locked XJBF_QD 卷六 digital primary-work transcription (oldid=787343); facsimile collation remains not performed. Frozen solar context comes from independent HKO 2014 minute references; published minute instants are not claimed as subsecond exact. Lunar fixtures retain independent HKO context references. Property tests reuse trusted core/astronomy for context only; expected day sets, term sets and civil offsets are specified independently of the new evaluator.

## Verification

- Frozen Golden: 100/100 PASS (24 + 38 + 38).
- Solar boundary properties: 1900–2100, 4,824 transitions × 12 samples = 57,888 contexts; 115,776 rule assertions. Covers all 24 terms, D−2/D−1/D start/noon/end and t−1 minute/t/t+1 minute.
- Lunar properties: 73,414 civil days, including normal/leap months and year boundaries; matched iff lunar day belongs to independently specified {5,14,23}.
- Alias/provenance, scoped travel effects, equivalent instant representations, invalid inputs: PASS.
- Full npm test: 1,368/1,368 PASS; 113 files. Includes legacy behavior and prior Phase 1 / Phase 2.1 regression suites.
- npm run lint: PASS. npm run typecheck: PASS. git diff --check: PASS.
- graphify update .: PASS (392 code files processed).
- SHA-256 verification: all four Golden V3 files and three older repository Golden datasets unchanged (7/7). Hashes: tasks/calendar-audit/group-a-frozen-hashes.json.

## Executed mutation proof

Run: `node scripts/mutate-group-a.mjs` (serially, without concurrent tests). Runner first verifies baseline, temporarily mutates real production source, executes the unchanged complete Group A tests, requires assertion failures (syntax/import failure does not count), restores source in finally, and rechecks test/Golden hashes. Original production source was restored. Initial pre-implementation red run failed all 100 Golden tests because the new API was unavailable.

| Mutation | Result | Failing tests |
| --- | --- | --- |
| yue-day-5-to-6 | KILLED | 8 |
| yue-gregorian-day | KILLED | 7 |
| yue-ignore-leap | KILLED | 4 |
| ly-longitude-0-to-315 | KILLED | 5 |
| tuyet-longitude-315-to-0 | KILLED | 5 |
| ly-offset-zero | KILLED | 34 |
| tuyet-offset-zero | KILLED | 33 |
| ly-rolling-24h | KILLED | 20 |
| tuyet-rolling-24h | KILLED | 22 |
| ly-utc8 | KILLED | 10 |
| tuyet-utc8 | KILLED | 1 |

11/11 mutants killed. UTC+8 Tứ Tuyệt is killed by the exhaustive boundary property test; current frozen four-start fixtures alone do not distinguish that mutation. Machine-readable assertion evidence: tasks/calendar-audit/group-a-mutations.json.

## Files changed / added

- Production: shared/lunar/groupA.ts (new), shared/lunar/index.ts (export only).
- Regression tests: shared/lunar/groupA.test.ts (new).
- Mutation runner: scripts/mutate-group-a.mjs (new).
- Evidence: this report, tasks/calendar-audit/group-a-frozen-hashes.json, tasks/calendar-audit/group-a-mutations.json.
- Knowledge graph refreshed per AGENTS.md. Earlier uncommitted instant Officer / solar month changes belong to Phase 2.1, not this Group A implementation.

Group A calculation gate: PASS. This does not claim full V3 completion or independently verified Group B/C provenance.
