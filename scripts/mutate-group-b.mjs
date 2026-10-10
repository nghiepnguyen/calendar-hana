// Real source mutations, serial execution, immutable fixtures and verified restoration.
// A red baseline never earns a qualified KILLED score: differential failures
// are recorded as diagnostic detection only, not acceptance evidence.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const groupB = 'shared/lunar/groupB.ts'
const terms = 'shared/lunar/solarTerms.ts'
const testPath = 'shared/lunar/groupB.test.ts'
const sources = Object.fromEntries([groupB, terms].map((p) => [p, readFileSync(p, 'utf8')]))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const originalHashes = Object.fromEntries(
  Object.entries(sources).map(([p, text]) => [p, hash(text)]),
)
const testHash = hash(readFileSync(testPath))
const frozen = JSON.parse(readFileSync('tasks/calendar-audit/group-b-freeze-hashes.json', 'utf8'))
// Frozen artifacts cite pre-reorganisation root paths; docs/legacy-paths.json maps them.
const legacyPaths = JSON.parse(readFileSync('docs/legacy-paths.json', 'utf8')).moves
const artifact = (p) => legacyPaths[p] ?? p
const resultsPath = artifact('calendar-group-b-mutation-results-v3.1.json')
const temporary = mkdtempSync(join(tmpdir(), 'hana-group-b-mutations-'))
function verify() {
  for (const [p, expected] of Object.entries(frozen))
    if (hash(readFileSync(artifact(p))) !== expected)
      throw new Error(`Frozen artifact changed: ${p}`)
  if (hash(readFileSync(testPath)) !== testHash) throw new Error('Tests changed during mutations')
}
function restore() {
  for (const [p, source] of Object.entries(sources)) writeFileSync(p, source)
  for (const [p, expected] of Object.entries(originalHashes))
    if (hash(readFileSync(p)) !== expected) throw new Error(`Restoration failed: ${p}`)
  verify()
}
function run(name) {
  const output = join(temporary, `${name}.json`)
  const child = spawnSync(
    process.execPath,
    [
      'node_modules/vitest/vitest.mjs',
      'run',
      testPath,
      '--reporter=json',
      `--outputFile=${output}`,
    ],
    { encoding: 'utf8', timeout: 180000, env: { ...process.env, GROUP_B_AUDIT_OUTPUT: '' } },
  )
  if (child.error) throw child.error
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const assertions = report.testResults.flatMap((s) => s.assertionResults)
  if (assertions.length !== 636)
    throw new Error(
      `Invalid mutation run / import failure: ${name}; ${JSON.stringify(report.testResults).slice(0, 1500)}`,
    )
  return {
    exitCode: child.status,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    failures: assertions
      .filter((t) => t.status === 'failed')
      .map((t) => ({ name: t.fullName, evidence: t.failureMessages.join('\n').slice(0, 1800) })),
  }
}
function change(source, before, after) {
  if (!source.includes(before)) throw new Error(`Mutation anchor missing: ${before}`)
  if (source.indexOf(before) !== source.lastIndexOf(before))
    throw new Error(`Ambiguous anchor: ${before}`)
  return source.replace(before, after)
}
const mutants = [
  {
    id: 'M1',
    behavior: 'lunar month instead of Month Jian',
    expectedKiller: 'month-breaker-120',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        'import { dayCanChi }',
        "import { solarToLunar } from './lunar'\nimport { dayCanChi }",
      ).replace(
        'const month = getSolarMonth(instant, timezone)',
        'const month = (solarToLunar(solar.day, solar.month, solar.year).month + 1) % 12',
      ),
  },
  {
    id: 'M2',
    behavior: 'switch at civil midnight of Jie day',
    expectedKiller: 'month-breaker-083',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        'const month = getSolarMonth(instant, timezone)',
        "const month = getSolarMonth(civilDate + 'T23:59:59.999+07:00', timezone)",
      ),
  },
  {
    id: 'M3',
    behavior: 'strict > at actual astronomical crossing',
    expectedKiller: 'P1: only Jie',
    path: terms,
    mutate: (s) =>
      change(s, 'Date.parse(t.instantUtc) <= instant', 'Date.parse(t.instantUtc) < instant'),
  },
  {
    id: 'M4',
    behavior: 'shift Jian table one row',
    expectedKiller: 'month-breaker-001',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        '(branches.indexOf(monthJian) + 10) % 12',
        '(branches.indexOf(monthJian) + 11) % 12',
      ),
  },
  ...['寅巳申亥', '申巳寅亥', '巳寅亥申', '寅亥申巳'].map((period, i) => ({
    id: 'M5',
    variant: i === 0 ? 'reverse' : `rotate-${i}`,
    behavior: 'incorrect robbery reverse/rotation',
    expectedKiller: 'robbery-sha-001',
    path: groupB,
    mutate: (s) =>
      change(s, "targets: '亥申巳寅亥申巳寅亥申巳寅'", `targets: '${period.repeat(3)}'`),
  })),
  {
    id: 'M6',
    behavior: 'rejected forward Tai Sat sequence',
    expectedKiller: 'disaster-sha-015',
    path: groupB,
    mutate: (s) =>
      change(s, "targets: '子酉午卯子酉午卯子酉午卯'", "targets: '子卯午酉子卯午酉子卯午酉'"),
  },
  {
    id: 'M7',
    behavior: 'duplicate month-sha alias raw identity',
    expectedKiller: 'month-sha-122',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        'return definitions\n',
        "return [...definitions, { ...definitions[3], name: '月虚' }]\n",
      ),
  },
  {
    id: 'M8',
    behavior: 'Month Virtue uses day branch',
    expectedKiller: 'month-virtue-001',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        "rule.operandType === 'DAY_STEM' ? dayStem : dayBranch",
        "rule.operandType === 'DAY_STEM' ? dayBranch : dayBranch",
      ),
  },
  {
    id: 'M9',
    behavior: 'Hong Kong civil date reused for Vietnam',
    expectedKiller: 'month-breaker-119',
    path: groupB,
    mutate: (s) =>
      change(
        s,
        'todayInVietnam(new Date(instant))',
        'new Date(Date.parse(instant) + 8 * 3600000).toISOString().slice(0, 10)',
      ),
  },
  {
    id: 'M10',
    behavior: 'actual crossing rounded to published HKO minute for discriminator transitions',
    expectedKiller: 'month-breaker-121',
    path: terms,
    mutate: (s) =>
      change(
        s,
        'instantUtc: found.date.toISOString()',
        'instantUtc: new Date(Math.round(found.date.getTime() / 60000) * 60000).toISOString()',
      ),
  },
]
const results = {
  phase: '3B.4',
  baseline: null,
  requiredCategories: 10,
  executedVariants: 0,
  qualifiedKilled: 0,
  diagnosticDetected: 0,
  survived: [],
  records: [],
  originalSourceHashes: originalHashes,
  frozenArtifactsUnchanged: false,
}
try {
  verify()
  const baseline = run('baseline')
  results.baseline = baseline
  const existingFailures = new Set(baseline.failures.map((t) => t.name))
  console.log(
    `Baseline: ${baseline.passed}/636 passed, ${baseline.failed} failed. Qualified mutation gate ${baseline.failed ? 'BLOCKED' : 'OPEN'}.`,
  )
  for (const m of mutants) {
    restore()
    const mutated = m.mutate(sources[m.path])
    writeFileSync(m.path, mutated)
    const name = m.id + (m.variant ? `-${m.variant}` : '')
    const execution = run(name)
    const newFailures = execution.failures.filter((t) => !existingFailures.has(t.name))
    const witness = newFailures.find((t) => t.name.includes(m.expectedKiller))
    const detected = !!witness
    const qualified = baseline.failed === 0 && execution.exitCode === 1 && detected
    const beforePath = join(temporary, `${name}-before.ts`)
    const afterPath = join(temporary, `${name}-after.ts`)
    writeFileSync(beforePath, sources[m.path])
    writeFileSync(afterPath, mutated)
    const diff = spawnSync('diff', ['-u', beforePath, afterPath], { encoding: 'utf8' }).stdout
    restore()
    results.records.push({
      id: m.id,
      variant: m.variant,
      behavior: m.behavior,
      sourcePath: m.path,
      expectedKiller: m.expectedKiller,
      actualFailingTest: witness?.name ?? null,
      actualFailureEvidence: witness?.evidence ?? null,
      exitStatus: execution.exitCode,
      totalFailed: execution.failed,
      newFailureCount: newFailures.length,
      newFailures,
      detected,
      qualifiedKilled: qualified,
      status: qualified
        ? 'KILLED'
        : detected
          ? 'DETECTED_WITH_FAILED_BASELINE'
          : 'TEST_GAP_OR_MUTATION_DESIGN_GAP',
      exactDiff: diff,
      mutatedSourceSha256: hash(mutated),
      restorationHashes: Object.fromEntries(
        Object.keys(sources).map((p) => [p, hash(readFileSync(p))]),
      ),
    })
    results.executedVariants++
    if (detected) results.diagnosticDetected++
    else results.survived.push(name)
    console.log(
      `${name}: ${newFailures.length} new assertion failures; named witness ${detected ? 'DETECTED' : 'MISSING'}; source restored.`,
    )
    writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n')
  }
  results.qualifiedKilled = new Set(
    results.records.filter((r) => r.qualifiedKilled).map((r) => r.id),
  ).size
  results.frozenArtifactsUnchanged = true
  results.status = baseline.failed
    ? 'BLOCKED_SPEC_CONFLICT: failed unmutated astronomy baseline; diagnostic detection is not a qualified mutation PASS'
    : results.qualifiedKilled === 10
      ? 'PASS'
      : 'FAIL'
} finally {
  restore()
  writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n')
  rmSync(temporary, { recursive: true, force: true })
}
if (results.qualifiedKilled !== 10) process.exitCode = 1
