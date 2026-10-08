// Phase 3B.4.4A final integrity record. Usage (repo root): node .../write-integrity.mjs
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const A = 'tasks/calendar-audit/astronomy-authority-v3.4A'
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim()
execFileSync(process.execPath, ['tasks/calendar-audit/erfa-foundation-v3.3/hash-manifest.mjs', `${A}/hashes-after.json`])
const before = JSON.parse(readFileSync(`${A}/hashes-before.json`, 'utf8')).files
const after = JSON.parse(readFileSync(`${A}/hashes-after.json`, 'utf8')).files
const changed = Object.keys(before).filter((p) => after[p]?.sha256 !== before[p].sha256)
const unauthorized = changed.filter((p) => !p.startsWith('graphify-out/'))
const pick = (pred) => Object.fromEntries(Object.keys(before).filter(pred).map((p) => [p, { before: before[p].sha256, after: after[p]?.sha256 }]))
const oldGolden = pick((p) => p.startsWith('golden-v3/') || p === 'calendar-group-b-exact-jie-evidence.json' || p.startsWith('tasks/calendar-audit/group-a') || p === 'tasks/calendar-audit/group-b-freeze-hashes.json')
const production = pick((p) => /^(shared|src|functions\/src)\//.test(p) && !p.includes('.test.'))
const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' }).trimEnd().split('\n').filter(Boolean)
const allowedNew = /^(graphify-out\/|golden-v4\/|tasks\/calendar-audit\/astronomy-authority-v3\.4A\/|calendar-[A-Za-z0-9.-]*v3\.4A\.(md|json)$|calendar-phase-3B\.4\.4B-migration-gate\.md$|integrity-final-v3\.4A\.json$)/
const unexpected = status.filter((l) => l.startsWith('??') && !allowedNew.test(l.slice(3))).concat(status.filter((l) => !l.startsWith('??') && !l.slice(3).startsWith('graphify-out/')))
const manifest = JSON.parse(readFileSync('golden-v4/manifest.json', 'utf8'))
const unit = JSON.parse(readFileSync(`${A}/unit-regression-diff.json`, 'utf8'))
const mut = JSON.parse(readFileSync(`${A}/mutation/mutation-results.json`, 'utf8'))
const ra = JSON.parse(readFileSync(`${A}/reviews/review-authority.json`, 'utf8'))
const rb = JSON.parse(readFileSync(`${A}/reviews/review-groupb.json`, 'utf8'))
const e = JSON.parse(readFileSync('calendar-erfa-vs-authority-v3.4A.json', 'utf8'))
const gs = JSON.parse(readFileSync(`${A}/git-state-before.json`, 'utf8'))
const goldenOk = Object.entries(manifest.files).every(([p, f]) => createHash('sha256').update(readFileSync(p)).digest('hex') === f.sha256)
const result = {
  phase: '3B.4.4A',
  startingHead: gs.head,
  endingHead: git('rev-parse', 'HEAD'),
  originMain: git('rev-parse', 'origin/main'),
  workingTree: status.length ? `${status.length} entries (this phase's new files and graphify metadata; uncommitted at record time)` : 'clean',
  protectedHashes: { filesCompared: Object.keys(before).length, changed, unauthorized, verdict: unauthorized.length || unexpected.length ? 'FAIL_SCOPE_VIOLATION' : 'PASS', unexpectedWorkingTreeEntries: unexpected },
  oldGolden: { files: Object.keys(oldGolden).length, changed: Object.entries(oldGolden).filter(([, v]) => v.before !== v.after).map(([p]) => p), hashes: oldGolden },
  productionSources: { files: Object.keys(production).length, changed: Object.entries(production).filter(([, v]) => v.before !== v.after).map(([p]) => p) },
  newGolden: { version: manifest.goldenVersion, status: manifest.status, files: manifest.files, verifiedNow: goldenOk },
  tests: {
    newAuthorityTooling: { goldenV4Validation: '10/10 PASS', authorityReview: ra.verdict, groupBReview: rb.verdict, reproduction: 'byte-identical (reproduce.sh step 3)' },
    mutation: mut.summary,
    unitSuite: { total: unit.current.total, failed: unit.current.failed, newFailures: unit.newFailures.length, statusChanged: unit.changed.length, baselineFailures: unit.preExistingExpectedFailures.length, classification: 'PRE_EXISTING_EXPECTED_FAILURE (50 Group B, identical to the 3B.4.3 baseline)' },
    typecheck: 'PASS', lint: 'PASS (0 warnings)', build: 'PASS',
    formatCheck: 'FAIL pre-existing: 16 non-generated files unchanged from baseline; graphify cache JSON 591 -> 695 from the AGENTS.md-mandated graph update committed in 3B.4.3 (generated output); golden-v4 and all new JSON reports pass prettier',
    integrationEmulator: 'NOT_RUN (production unchanged)', e2e: 'NOT_RUN (production unchanged)',
  },
  erfaVsAuthority: { maxAbsSeconds: e.accuracyGate.maxAbsSeconds, medianAbsSeconds: e.accuracyGate.medianAbsSeconds, p95AbsSeconds: e.accuracyGate.p95AbsSeconds, integerMsEqual: e.canonicalIntegerMs.equal, integerMsDiffer: e.canonicalIntegerMs.differ, civilDateMismatches: e.civilDateMismatches },
  deviceGate: 'UNVERIFIED_DEVICE_GATE',
  productionMigrationExecuted: false,
  erfaWiredToProduction: false,
  oldGoldenChanged: false,
  testsDisabled: false,
}
result.oldGoldenChanged = result.oldGolden.changed.length > 0
result.finalVerdict = result.protectedHashes.verdict === 'PASS' && !result.oldGoldenChanged && goldenOk && ra.verdict === 'PASS' && rb.verdict === 'PASS' && mut.summary.SURVIVED === 0 && unit.newFailures.length === 0 && !result.productionSources.changed.length ? 'APPROVE_AUTHORITY_AND_GOLDEN_FREEZE' : 'INSUFFICIENT_EVIDENCE'
writeFileSync('integrity-final-v3.4A.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ changed, unauthorized, unexpected, oldGoldenChanged: result.oldGolden.changed, prodChanged: result.productionSources.changed, goldenOk, verdict: result.finalVerdict }))
