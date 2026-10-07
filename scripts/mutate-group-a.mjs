// Execute real production mutations against the unchanged Golden/property tests.
// Run serially; never run alongside another test process. Always restore source.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const path = 'shared/lunar/groupA.ts'
const original = readFileSync(path, 'utf8')
const testPath = 'shared/lunar/groupA.test.ts'
const testHash = hash(readFileSync(testPath))
const frozen = JSON.parse(readFileSync('tasks/calendar-audit/group-a-frozen-hashes.json', 'utf8'))
const temporary = mkdtempSync(join(tmpdir(), 'hana-group-a-mutations-'))
function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}
function verifyFrozen() {
  for (const [file, expected] of Object.entries(frozen))
    if (hash(readFileSync(file)) !== expected) throw new Error(`Frozen file changed: ${file}`)
  if (hash(readFileSync(testPath)) !== testHash)
    throw new Error('Tests changed during mutation run')
}
function run(name) {
  const output = join(temporary, `${name}.json`)
  const process = spawnSync(
    'node',
    [
      'node_modules/vitest/vitest.mjs',
      'run',
      testPath,
      '--reporter=json',
      `--outputFile=${output}`,
    ],
    { encoding: 'utf8', timeout: 180000 },
  )
  if (process.error) throw process.error
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const failures = report.testResults
    .flatMap((suite) => suite.assertionResults)
    .filter((test) => test.status === 'failed')
  return {
    exitCode: process.status,
    failures: failures.map((test) => ({
      name: test.fullName,
      evidence: test.failureMessages.join('\n').slice(0, 1000),
    })),
  }
}
const civil = 'solarStringToJd(todayInVietnam(new Date(term.instantUtc))) - jd === 1'
const rolling =
  'Date.parse(term.instantUtc) - Date.parse(instant) > 0 && Date.parse(term.instantUtc) - Date.parse(instant) <= 86400000'
const hongKong =
  'solarStringToJd(new Date(Date.parse(term.instantUtc) + 8 * 3600000).toISOString().slice(0, 10)) - jd === 1'
const mutations = [
  ['yue-day-5-to-6', '[5, 14, 23].includes(lunar.day)', '[6, 14, 23].includes(lunar.day)'],
  ['yue-gregorian-day', '[5, 14, 23].includes(lunar.day)', '[5, 14, 23].includes(solar.day)'],
  [
    'yue-ignore-leap',
    '[5, 14, 23].includes(lunar.day)',
    '!lunar.isLeap && [5, 14, 23].includes(lunar.day)',
  ],
  [
    'ly-longitude-0-to-315',
    'beforeTransition([0, 90, 180, 270])',
    'beforeTransition([315, 90, 180, 270])',
  ],
  [
    'tuyet-longitude-315-to-0',
    'beforeTransition([315, 45, 135, 225])',
    'beforeTransition([0, 45, 135, 225])',
  ],
  ['ly-offset-zero', civil, civil.replace('=== 1', '=== (longitudes.includes(90) ? 0 : 1)')],
  ['tuyet-offset-zero', civil, civil.replace('=== 1', '=== (longitudes.includes(45) ? 0 : 1)')],
  ['ly-rolling-24h', civil, `(longitudes.includes(90) ? (${rolling}) : (${civil}))`],
  ['tuyet-rolling-24h', civil, `(longitudes.includes(45) ? (${rolling}) : (${civil}))`],
  ['ly-utc8', civil, `(longitudes.includes(90) ? (${hongKong}) : (${civil}))`],
  ['tuyet-utc8', civil, `(longitudes.includes(45) ? (${hongKong}) : (${civil}))`],
]
const results = []
try {
  verifyFrozen()
  const baseline = run('baseline')
  if (baseline.exitCode !== 0 || baseline.failures.length)
    throw new Error('Baseline must pass before mutations')
  for (const [name, before, after] of mutations) {
    if (original.split(before).length !== 2) throw new Error(`Mutation target not unique: ${name}`)
    writeFileSync(path, original.replace(before, after))
    const outcome = run(name)
    const assertionFailures = outcome.failures.filter((f) =>
      /AssertionError|expected|to be/i.test(f.evidence),
    )
    const killed = outcome.exitCode !== 0 && assertionFailures.length > 0
    results.push({
      name,
      killed,
      failedTests: outcome.failures.length,
      evidence: assertionFailures.slice(0, 3),
    })
    console.log(
      `${name}: ${killed ? 'KILLED' : 'SURVIVED/INVALID'} (${outcome.failures.length} failing tests)`,
    )
    writeFileSync(path, original)
    verifyFrozen()
  }
} finally {
  writeFileSync(path, original)
  rmSync(temporary, { recursive: true, force: true })
}
verifyFrozen()
const report = {
  status: results.length === mutations.length && results.every((r) => r.killed) ? 'PASS' : 'FAIL',
  productionRestored: hash(readFileSync(path)) === hash(original),
  goldenUnchanged: true,
  testsUnchanged: true,
  total: mutations.length,
  killed: results.filter((r) => r.killed).length,
  results,
}
writeFileSync('tasks/calendar-audit/group-a-mutations.json', JSON.stringify(report, null, 2) + '\n')
if (report.status !== 'PASS') process.exitCode = 1
