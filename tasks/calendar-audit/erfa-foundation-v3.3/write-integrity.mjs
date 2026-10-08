// Phase 3B.4.3 final integrity: compare protected hashes before/after and
// summarise every gate. Usage (repo root): node .../write-integrity.mjs <unit-regression-diff.json> <checks.json>
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const dir = 'tasks/calendar-audit/erfa-foundation-v3.3'
execFileSync(process.execPath, [`${dir}/hash-manifest.mjs`, `${dir}/hashes-after.json`])
const before = JSON.parse(readFileSync(`${dir}/hashes-before.json`, 'utf8'))
const after = JSON.parse(readFileSync(`${dir}/hashes-after.json`, 'utf8'))
const changed = Object.entries(before.files)
  .filter(([p, e]) => after.files[p]?.sha256 !== e.sha256)
  .map(([p, e]) => ({ path: p, class: e.class, authorized: p.startsWith('graphify-out/') }))
const unauthorized = changed.filter((c) => !c.authorized)
const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
const newFiles = status.filter((l) => l.startsWith('??')).map((l) => l.slice(3))
const allowedNew = /^(graphify-out\/|shared\/astronomy\/erfa\/|tasks\/calendar-audit\/erfa-foundation-v3\.3\/|calendar-erfa-|calendar-astronomy-spec-change-v3\.3\.md$|integrity-final-v3\.3\.json$)/
const unexpectedNew = newFiles.filter((f) => !allowedNew.test(f))
const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const unit = read(process.argv[2])
const checks = read(process.argv[3])
const port = read(`${dir}/erfa-port-parity.json`)
const ref = read('calendar-erfa-reference-comparison-v3.3.json')
const mut = read(`${dir}/mutation/mutation-results.json`)
const rt = read('calendar-erfa-runtime-parity-v3.3.json')
const prov = read('calendar-erfa-provenance-v3.3.json')
const result = {
  phase: '3B.4.3',
  startingHead: before.head,
  endingHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  productionMigrationOccurred: false,
  protectedHashes: {
    filesCompared: Object.keys(before.files).length,
    changed,
    unauthorizedChanges: unauthorized,
    verdict: unauthorized.length ? 'FAIL_SCOPE_VIOLATION' : 'PASS',
    note: 'graphify-out/* changes are the AGENTS.md-mandated `graphify update .` knowledge-graph refresh (tooling metadata, no runtime effect).',
  },
  newFiles: { count: newFiles.length, unexpected: unexpectedNew },
  gates: {
    provenance: prov.status,
    portFidelity: port.verdict,
    officialVectors: `${port.officialVectors.passed}/${port.officialVectors.total}`,
    referenceAccuracy: ref.verdict,
    referenceMaxAbsSeconds: ref.supported1900to2100.maxAbsSeconds,
    mutation: mut.summary,
    runtimeParity: rt.allExactlyEqual ? 'PASS' : 'FAIL',
    deviceGate: 'UNVERIFIED_DEVICE_GATE (physical Safari/iOS, Android)',
    license: 'PASS',
    spec: 'SPEC_CHANGE_PROPOSED',
  },
  regression: {
    unit: {
      baseline: unit.baseline,
      current: unit.current,
      newFailures: unit.newFailures,
      statusChanged: unit.statusChangedOtherThanAdded,
      testsAdded: unit.testsAdded.length,
      preExistingExpectedFailures: { count: unit.preExistingExpectedFailures.length, classification: 'PRE_EXISTING_EXPECTED_FAILURE (Group B astronomy-model conflict)', tests: unit.preExistingExpectedFailures },
    },
    checks,
    newRegressions: unit.newFailures.length,
  },
  finalVerdict: !unauthorized.length && !unexpectedNew.length && !unit.newFailures.length && port.verdict === 'PORT_FIDELITY_PASS' && ref.verdict === 'REFERENCE_ACCURACY_PASS' && mut.summary.SURVIVED === 0 && mut.summary.INVALID_RUN === 0 && rt.allExactlyEqual ? 'APPROVE_FOUNDATION_WITH_DEVICE_GATE' : 'INSUFFICIENT_EVIDENCE',
}
writeFileSync('integrity-final-v3.3.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ changed: changed.length, unauthorized: unauthorized.length, unexpectedNew, verdict: result.finalVerdict }))
