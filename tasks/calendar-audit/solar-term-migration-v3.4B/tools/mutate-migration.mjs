// Phase 3B.4.4B production mutation campaign (P-series: authority / consumers;
// M-series: Group B, re-run on the green golden-v4 baseline).
// Real source/data edits, serial runs, verified restoration, frozen Goldens
// hash-checked before and after every mutant. KILLED requires at least one
// failing assertion in a clean (importable) run of the unmodified tests;
// a module-load failure is reported separately as KILLED_BY_LOAD_FAILURE.
//
//   node tasks/calendar-audit/solar-term-migration-v3.4B/tools/mutate-migration.mjs

import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = 'tasks/calendar-audit/solar-term-migration-v3.4B/calendar-mutation-results-v3.4B.json'
const AUTH = 'shared/astronomy/solarTerms/authority.ts'
const DATA = 'shared/astronomy/solarTerms/authority.data.ts'
const CACHE = 'shared/astronomy/solarTerms/cache.ts'
const GEN = 'scripts/generate-solar-term-authority.mjs'
const TERMS = 'shared/lunar/solarTerms.ts'
const GROUPB = 'shared/lunar/groupB.ts'
const TESTS = [
  'shared/astronomy/solarTerms/authority.test.ts',
  'shared/astronomy/solarTerms/clock.test.ts',
  'shared/lunar/groupB.test.ts',
  'shared/lunar/authorityMigration.test.ts',
  'shared/bazi/authorityMigration.test.ts',
]
const sha = (b) => createHash('sha256').update(b).digest('hex')
const mutable = [AUTH, DATA, CACHE, GEN, TERMS, GROUPB]
const originals = Object.fromEntries(mutable.map((p) => [p, readFileSync(p, 'utf8')]))
const testHashes = Object.fromEntries(TESTS.map((p) => [p, sha(readFileSync(p))]))
const frozenPaths = [
  ...Object.keys(JSON.parse(readFileSync('golden-v4/manifest.json', 'utf8')).files),
  'golden-v4/manifest.json',
  ...Object.keys(JSON.parse(readFileSync('tasks/calendar-audit/group-b-freeze-hashes.json', 'utf8'))),
  'golden-v3/manifest.json',
  'golden-v3/yue-ji.json',
  'golden-v3/four-separations.json',
  'golden-v3/four-extinctions.json',
]
const frozen = Object.fromEntries(frozenPaths.map((p) => [p, sha(readFileSync(p))]))
const tmp = mkdtempSync(join(tmpdir(), 'hana-3b44b-mutations-'))

function verifyFrozen() {
  for (const [p, h] of Object.entries(frozen))
    if (sha(readFileSync(p)) !== h) throw new Error(`Frozen artifact changed: ${p}`)
  for (const [p, h] of Object.entries(testHashes))
    if (sha(readFileSync(p)) !== h) throw new Error(`Test changed: ${p}`)
}
function restore() {
  for (const [p, text] of Object.entries(originals)) writeFileSync(p, text)
  for (const [p, text] of Object.entries(originals))
    if (readFileSync(p, 'utf8') !== text) throw new Error(`Restoration failed: ${p}`)
  verifyFrozen()
}
function change(source, before, after) {
  const n = source.split(before).length - 1
  if (n !== 1) throw new Error(`anchor found ${n}x: ${before.slice(0, 80)}`)
  return source.replace(before, after)
}
const edit = (path, before, after) => writeFileSync(path, change(readFileSync(path, 'utf8'), before, after))
/** Rewrites encoded data and re-pins its hash, as a careless regeneration would. */
function setEncoded(transform) {
  const data = readFileSync(DATA, 'utf8')
  const encoded = data.match(/encoded:\s*'([^']*)'/)[1]
  const next = transform(encoded.split(',')).join(',')
  const oldHash = sha(encoded)
  const newHash = sha(next)
  writeFileSync(DATA, data.replace(encoded, next).replace(oldHash, newHash))
  edit(AUTH, oldHash, newHash)
}
function run(name) {
  const output = join(tmp, `${name}.json`)
  const child = spawnSync(
    process.execPath,
    ['node_modules/vitest/vitest.mjs', 'run', ...TESTS, '--reporter=json', `--outputFile=${output}`],
    { encoding: 'utf8', timeout: 900_000, env: { ...process.env, GROUP_B_AUDIT_OUTPUT: '' } },
  )
  if (child.error) throw child.error
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const suites = report.testResults
  const loadFailures = suites.filter((s) => s.status === 'failed' && s.assertionResults.length === 0)
  const assertions = suites.flatMap((s) => s.assertionResults)
  const failed = assertions.filter((t) => t.status === 'failed')
  return {
    exitCode: child.status,
    total: assertions.length,
    passed: report.numPassedTests,
    failed: failed.length,
    loadFailures: loadFailures.map((s) => `${s.name.split('calendar-hana/')[1]}: ${s.message.slice(0, 300)}`),
    failingFiles: [...new Set(failed.map((t) => t.ancestorTitles[0] ?? ''))].slice(0, 8),
    examples: failed.slice(0, 4).map((t) => ({
      test: t.fullName.slice(0, 160),
      evidence: t.failureMessages.join('\n').split('\n')[0].slice(0, 300),
    })),
  }
}

const P = [
  {
    id: 'P1',
    behavior: 'corrupt one authority timestamp (+1 ms on a 2024 row), hash left as is',
    apply: () => {
      const data = readFileSync(DATA, 'utf8')
      const encoded = data.match(/encoded:\s*'([^']*)'/)[1]
      const parts = encoded.split(',')
      parts[3000] = (parseInt(parts[3000], 36) + 1).toString(36)
      writeFileSync(DATA, data.replace(encoded, parts.join(',')))
    },
  },
  {
    id: 'P1b',
    behavior: 'corrupt one authority timestamp (+1 ms) and re-pin the hash',
    apply: () =>
      setEncoded((p) => p.map((x, i) => (i === 3000 ? (parseInt(x, 36) + 1).toString(36) : x))),
  },
  {
    id: 'P2',
    behavior: 'shift every Jie boundary +1 ms',
    apply: () => edit(AUTH, 'const civil = ttToCivil(t)', 'const civil = ttToCivil(t + (termIndex % 2))'),
  },
  {
    id: 'P3',
    behavior: 'shift every Jie boundary -1 ms',
    apply: () => edit(AUTH, 'const civil = ttToCivil(t)', 'const civil = ttToCivil(t - (termIndex % 2))'),
  },
  ...['floor', 'round'].map((fn) => ({
    id: fn === 'floor' ? 'P4a' : 'P4b',
    behavior: `${fn}(root) instead of the frozen ceil T in runtime-data generation (regenerated + re-pinned)`,
    apply: () => {
      edit(
        GEN,
        "const t = Number(r[3])\n    if (!Number.isSafeInteger(t) || String(t) !== r[3])",
        `const t = Math.${fn}(Number(r[2]))\n    if (!Number.isSafeInteger(t))`,
      )
      const oldHash = readFileSync(DATA, 'utf8').match(/encodedSha256: '([0-9a-f]+)'/)[1]
      execFileSync(process.execPath, [GEN])
      const newHash = readFileSync(DATA, 'utf8').match(/encodedSha256: '([0-9a-f]+)'/)[1]
      edit(AUTH, oldHash, newHash)
    },
  })),
  {
    id: 'P5',
    behavior: 'strict t > T (crossing instant still belongs to the old term)',
    apply: () => edit(AUTH, 'if (axis[mid]! <= value) lo = mid', 'if (axis[mid]! < value) lo = mid'),
  },
  {
    id: 'P6',
    behavior: 'nearest-minute rounding of every boundary',
    apply: () =>
      edit(
        AUTH,
        'const civil = ttToCivil(t)',
        'const exact = ttToCivil(t)\n    const civil = { ...exact, epochMs: Math.round(exact.epochMs / 60000) * 60000 }',
      ),
  },
  {
    id: 'P7',
    behavior: 'swap adjacent Jie (Lập xuân 21 <-> Kinh trập 23 term indices)',
    apply: () =>
      edit(
        AUTH,
        'const termIndex = (19 + (i % 24)) % 24',
        'const raw = (19 + (i % 24)) % 24\n    const termIndex = raw === 21 ? 23 : raw === 23 ? 21 : raw',
      ),
  },
  {
    id: 'P8',
    behavior: 'pre-migration Astronomy Engine SearchSunLongitude roots restored as the source',
    apply: () =>
      writeFileSync(TERMS, execFileSync('git', ['show', 'f845444:shared/lunar/solarTerms.ts'], { encoding: 'utf8' })),
  },
  {
    id: 'P9',
    behavior: 'ERFA runtime roots used as the boundary (integrity checks still pass)',
    apply: () => {
      edit(AUTH, "import { sha256AsciiHex } from './sha256'", "import { sha256AsciiHex } from './sha256'\nimport { erfaSolarTermsForYear } from '../erfa/solarTermRoots'")
      edit(
        AUTH,
        'const t = i === 0 ? value : ttMs[i - 1]! + value',
        'const year0 = pinned.firstYear + Math.floor(i / 24)\n    const t = erfaSolarTermsForYear(year0).find((x) => x.termIndex === (19 + (i % 24)) % 24)!.ttMs',
      )
      edit(AUTH, 'if (i && (value < MIN_GAP_MS || value > MAX_GAP_MS))', 'if (i && (value < 0))')
    },
  },
  {
    id: 'P10',
    behavior: 'stale cache namespace: authority version from the previous authority',
    apply: () => edit(CACHE, '${SOLAR_TERM_AUTHORITY.authorityVersion}/', 'astronomy-authority-v3/'),
  },
  {
    id: 'P10b',
    behavior: 'cache key without any namespace (pre-migration keying)',
    apply: () => edit(CACHE, 'const namespaced = `${SOLAR_TERM_CACHE_NAMESPACE}|${key}`', 'const namespaced = key'),
  },
  {
    id: 'P11',
    behavior: 'stale clock version in the cache namespace',
    apply: () => edit(CACHE, '/${SOLAR_TERM_AUTHORITY.clockVersion}`', '/clock-v0`'),
  },
  {
    id: 'P11b',
    behavior: 'authority data declares a stale clock version',
    apply: () => edit(DATA, "clockVersion: 'clock-v1'", "clockVersion: 'clock-v0'"),
  },
  {
    id: 'P12',
    behavior: 'corrupt pinned authority dataset hash',
    apply: () => {
      const h = readFileSync(AUTH, 'utf8').match(/encodedSha256: '([0-9a-f]+)'/)[1]
      edit(AUTH, h, h.slice(0, -1) + (h.endsWith('0') ? '1' : '0'))
    },
  },
  {
    id: 'P12b',
    behavior: 'corrupt source Golden hash in the runtime data',
    apply: () => edit(DATA, "sourceSha256: '1db7a155", "sourceSha256: '0db7a155"),
  },
]

const M = [
  {
    id: 'M1',
    behavior: 'lunar month instead of Month Jian',
    apply: () => {
      edit(GROUPB, "import { dayCanChi } from './canChi'", "import { dayCanChi } from './canChi'\nimport { solarToLunar } from './lunar'")
      edit(GROUPB, 'const month = getSolarMonth(instant, timezone)', 'const month = (solarToLunar(solar.day, solar.month, solar.year).month + 1) % 12')
    },
  },
  {
    id: 'M2',
    behavior: 'switch at civil midnight of the Jie day',
    apply: () => edit(GROUPB, 'const month = getSolarMonth(instant, timezone)', "const month = getSolarMonth(civilDate + 'T23:59:59.999+07:00', timezone)"),
  },
  {
    id: 'M3',
    behavior: 'strict > at the crossing (Group B path)',
    apply: () => edit(TERMS, 'const active = getCanonicalSolarTermAt(instant)', 'const active = getCanonicalSolarTermAt(instant - 1)'),
  },
  {
    id: 'M4',
    behavior: 'shift Jian table one row (wrong table row)',
    apply: () => edit(GROUPB, '(branches.indexOf(monthJian) + 10) % 12', '(branches.indexOf(monthJian) + 11) % 12'),
  },
  ...['寅巳申亥', '申巳寅亥', '巳寅亥申', '寅亥申巳'].map((period, i) => ({
    id: `M5${'abcd'[i]}`,
    behavior: `robbery-sha ${i === 0 ? 'reverse' : `rotate-${i}`}`,
    apply: () => edit(GROUPB, "targets: '亥申巳寅亥申巳寅亥申巳寅'", `targets: '${period.repeat(3)}'`),
  })),
  {
    id: 'M6',
    behavior: 'rejected forward Tai Sat sequence',
    apply: () => edit(GROUPB, "targets: '子酉午卯子酉午卯子酉午卯'", "targets: '子卯午酉子卯午酉子卯午酉'"),
  },
  {
    id: 'M7',
    behavior: 'alias duplication (month-sha raw identity twice)',
    apply: () => edit(GROUPB, 'return definitions\n', "return [...definitions, { ...definitions[3], name: '月虚' }]\n"),
  },
  {
    id: 'M8',
    behavior: 'Month Virtue uses day branch',
    apply: () => edit(GROUPB, "rule.operandType === 'DAY_STEM' ? dayStem : dayBranch", "rule.operandType === 'DAY_STEM' ? dayBranch : dayBranch"),
  },
  {
    id: 'M9',
    behavior: 'timezone/day operand: Hong Kong (UTC+8) civil date reused for Vietnam',
    apply: () => edit(GROUPB, 'todayInVietnam(new Date(instant))', 'new Date(Date.parse(instant) + 8 * 3600000).toISOString().slice(0, 10)'),
  },
  {
    id: 'M9b',
    behavior: 'timezone/day operand: UTC civil date',
    apply: () => edit(GROUPB, 'todayInVietnam(new Date(instant))', 'new Date(instant).toISOString().slice(0, 10)'),
  },
  {
    id: 'M10',
    behavior: 'minute rounding of the instant before the Month Jian lookup',
    apply: () => edit(TERMS, 'const active = getCanonicalSolarTermAt(instant)', 'const active = getCanonicalSolarTermAt(Math.round(instant / 60000) * 60000)'),
  },
  {
    id: 'M11',
    behavior: 'wrong Month Jian (off by one branch)',
    apply: () => edit(AUTH, 'return ((Math.floor((termIndex - 21 + 24) / 2) % 12) + 2) % 12', 'return ((Math.floor((termIndex - 21 + 24) / 2) % 12) + 3) % 12'),
  },
  {
    id: 'M12',
    behavior: 'wrong table cell (month-sha 辰 row -> 戌)',
    apply: () => edit(GROUPB, "targets: '丑戌未辰丑戌未辰丑戌未辰'", "targets: '丑戌戌辰丑戌未辰丑戌未辰'"),
  },
]

const results = { phase: '3B.4.4B', testFiles: TESTS, baseline: null, mutants: [], summary: {} }
try {
  verifyFrozen()
  const baseline = run('baseline')
  results.baseline = baseline
  if (baseline.failed || baseline.loadFailures.length) throw new Error(`baseline not green: ${JSON.stringify(baseline)}`)
  console.log(`baseline green: ${baseline.passed}/${baseline.total}`)
  for (const m of [...P, ...M]) {
    try {
      m.apply()
      const r = run(m.id)
      const status = r.failed > 0 ? 'KILLED' : r.loadFailures.length ? 'KILLED_BY_LOAD_FAILURE' : 'SURVIVED'
      results.mutants.push({ id: m.id, series: m.id[0], behavior: m.behavior, status, ...r })
      console.log(m.id, status, `${r.failed} failed / ${r.total}`, r.loadFailures[0]?.slice(0, 120) ?? '')
    } finally {
      restore()
    }
  }
  const final = run('final')
  results.finalBaseline = { passed: final.passed, failed: final.failed, total: final.total }
  if (final.failed) throw new Error('post-campaign baseline not green')
} finally {
  restore()
  results.frozenArtifactsUnchanged = true
  results.frozenHashes = frozen
  results.summary = ['KILLED', 'KILLED_BY_LOAD_FAILURE', 'SURVIVED'].reduce(
    (s, k) => ({ ...s, [k]: results.mutants.filter((m) => m.status === k).length }),
    { executed: results.mutants.length },
  )
  writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n')
  console.log(results.summary)
}
