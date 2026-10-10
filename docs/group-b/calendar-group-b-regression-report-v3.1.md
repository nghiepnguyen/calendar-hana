# Group B full regression v3.1

Verdict: FAIL; Phase3B.4 BLOCKED_SPEC_CONFLICT. Clean checkpoint `b24879b77797a29fdee10bc178acfa07cfeadab0`.

| Command | Status | Result |
|---|---|---|
| npm test -- --reporter=json --outputFile=/tmp/b314-full-vitest.json | FAIL |1954/2004 PASS;50 newGroupB failures;0skipped;113/114filesPASS |
| npm run test:emulator | PASS |29/29 tests;3/3files;demo Firebase localhost; initial sandbox EPERM resolved through approved escalation |
| npm run test:e2e -- --reporter=json |FAIL| {"startTime": "2026-10-08T12:23:32.084Z", "duration": 245052.183, "expected": 482, "skipped": 95, "unexpected": 13, "flaky": 0} |
| npm run lint | PASS |oxlint exit0 |
| npm run typecheck | PASS |frontend tsc-b andfunctions tsc--noEmit exit0 |
| npm run format:check | FAIL |642 style issues after graph update: 607 baseline + 35 generated AST cache files; protected artifacts not reformatted |
| npm run build | PASS |tsc-b,Vite andPWA service-worker deterministic build exit0 |

All1,368 existing unit tests PASS. Prior calculation gate suites: [{"file": "calendarAudit.test.ts", "status": "passed", "tests": 2}, {"file": "calendarExtendedAudit.test.ts", "status": "passed", "tests": 1}, {"file": "groupA.test.ts", "status": "passed", "tests": 104}, {"file": "officers.instant.test.ts", "status": "passed", "tests": 5}]. All50 failing assertions are newGroupB:42 Golden records and8 independent exactT properties. ROOTCAUSE: AstroEngine/SwissDE441 crossing discrepancy; frozen expected unchanged.

## Formatting classification

Before graph update, 606 warned files were byte-identical to HEAD. AST graph update adds 35 generated cache formatting warnings and modifies the existing graph artifacts. Changed frozen manifest has pre-existing noncompact arrays; old manifest also fails using `.prettierrc` (printWidth100), verified from `git show HEAD:golden-v3/group-b/manifest.json` copied to/tmp. No after-freeze hash modification or baseline-wide formatter run allowed. New source/reports checked independently; final format status remains FAIL (642 warnings); new source/report JSON format check PASS.

## E2E failures

482 PASS, 13 FAIL, 95 existing project/platform skips. All failures are visual-default screenshot comparisons. No skips added or failing tests disabled.

| Test | Project | Classification |
|---|---|---|
| visual-default.spec.ts > light > day | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > week | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > month | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > form tạo sự kiện | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > day | mobile | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > week | mobile | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > light > month | mobile | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > day | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > week | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > month | desktop | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > day | mobile | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > week | mobile | Screenshot differs; underlying cause UNVERIFIED |
| visual-default.spec.ts > dark > month | mobile | Screenshot differs; underlying cause UNVERIFIED |

Full assertion messages and expected/actual screenshot paths are preserved in calendar-group-b-test-results-v3.1.json. Causes are not proven against an E2E run of the pre-implementation checkpoint; do not mislabel these as confirmed pre-existing bugs or obsolete tests. No UI, legacy code or snapshot baseline was changed to hide them.

## Integrity and scope

All11 frozen hashes unchanged. All temporary mutant sources restored to original hashes. Phase1/2.1/GroupA production and oldGolden unchanged. No ThiênĐức/GroupC/scoring/resolver. Report6 outputs listed in calendar-group-b-implementation-report-v3.1.md; detailed fixture EXPECTED/ACTUAL/ROOTCAUSE/FIXED, command stats and hashes in calendar-group-b-test-results-v3.1.json.

## Graph update and aggregate counts

`graphify update .` PASS, AST only, no LLM: 426 files / 3,187 nodes / 5,636 edges / 203 communities. Aggregate configured tests across unit + integration + E2E: 2,623 total; 2,465 PASS; 63 FAIL; 95 existing skips. Unit and integration have zero skips. Graph output changes follow AGENTS.md; they do not alter production or frozen inputs.
