// Phase 3B.4.3: real source mutations of the isolated ERFA foundation.
// Each mutant edits shared/astronomy/erfa source in place, runs the full
// foundation test suite serially, then restores and hash-verifies the source.
// A mutant counts as KILLED only if the suite executed every test and at least
// one failed. The unmutated baseline must be fully green first.
// Usage (repo root): node tasks/calendar-audit/erfa-foundation-v3.3/mutation/mutate-erfa.mjs
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = 'shared/astronomy/erfa'
const files = ['solarTermRoots.ts', 'apparentSun.ts', 'erfa.ts', 'index.ts', 'clockV1.ts'].map((f) => `${base}/${f}`)
const tests = ['erfa.test.ts', 'solarTermRoots.test.ts', 'clockV1.test.ts'].map((f) => `${base}/${f}`)
const hash = (b) => createHash('sha256').update(b).digest('hex')
const sources = Object.fromEntries(files.map((p) => [p, readFileSync(p, 'utf8')]))
const sourceHashes = Object.fromEntries(Object.entries(sources).map(([p, s]) => [p, hash(s)]))
const testHashes = Object.fromEntries(tests.map((p) => [p, hash(readFileSync(p))]))
const temporary = mkdtempSync(join(tmpdir(), 'hana-erfa-mutations-'))

function restore() {
  for (const [p, s] of Object.entries(sources)) writeFileSync(p, s)
  for (const [p, h] of Object.entries(sourceHashes)) if (hash(readFileSync(p)) !== h) throw new Error(`restore failed ${p}`)
  for (const [p, h] of Object.entries(testHashes)) if (hash(readFileSync(p)) !== h) throw new Error(`tests changed ${p}`)
}

let expectedTests = 0
function run(name) {
  const output = join(temporary, `${name}.json`)
  const child = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', ...tests, '--reporter=json', `--outputFile=${output}`], { encoding: 'utf8', timeout: 900000 })
  if (child.error) throw child.error
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const assertions = report.testResults.flatMap((s) => s.assertionResults)
  const suiteErrors = report.testResults.filter((s) => s.status === 'failed' && !s.assertionResults.length).map((s) => s.message?.slice(0, 600))
  return {
    exitCode: child.status,
    executed: assertions.length,
    passed: assertions.filter((t) => t.status === 'passed').length,
    failed: assertions.filter((t) => t.status === 'failed').length,
    suiteErrors,
    failures: assertions.filter((t) => t.status === 'failed').map((t) => ({ test: t.fullName, evidence: t.failureMessages.join('\n').split('\n').slice(0, 4).join(' | ').slice(0, 500) })),
  }
}

const once = (file, from, to) => ({ file: `${base}/${file}`, from, to, all: false })
const every = (file, from, to) => ({ file: `${base}/${file}`, from, to, all: true })
const mutants = [
  { id: 'M1', name: 'floor instead of ceil (last ms before the crossing)', edits: [once('solarTermRoots.ts', 'return { ttMs: hi, iterations }', 'return { ttMs: fhi === 0 ? hi : lo, iterations }')] },
  { id: 'M2', name: 'round to nearest ms instead of ceil', edits: [once('solarTermRoots.ts', 'return { ttMs: hi, iterations }', 'return { ttMs: -flo < fhi ? lo : hi, iterations }')] },
  { id: 'M3', name: 't > T instead of t >= T (TT classifier)', edits: [once('solarTermRoots.ts', '.filter((boundary) => boundary.ttMs <= ttMs)', '.filter((boundary) => boundary.ttMs < ttMs)')] },
  { id: 'M3b', name: 't > T instead of t >= T (civil classifier)', edits: [once('index.ts', 'ttToCivil(b.ttMs).epochMs <= epochMs', 'ttToCivil(b.ttMs).epochMs < epochMs')] },
  { id: 'M4', name: 'add +1 ms to T', edits: [once('solarTermRoots.ts', 'return { ttMs: hi, iterations }', 'return { ttMs: hi + 1, iterations }')] },
  { id: 'M5', name: 'subtract 1 ms from T', edits: [once('solarTermRoots.ts', 'return { ttMs: hi, iterations }', 'return { ttMs: hi - 1, iterations }')] },
  { id: 'M6', name: 'wrong longitude wrap (no 0°/360° wrap)', edits: [once('solarTermRoots.ts', '  if (r >= 180) r -= 360\n  else if (r < -180) r += 360\n', '')] },
  { id: 'M7', name: 'adjacent 15° target', edits: [once('solarTermRoots.ts', 'return termIndex * 15', 'return ((termIndex + 1) % 24) * 15')] },
  {
    id: 'M8',
    name: 'mean (geometric) instead of apparent longitude: no light-time, aberration or nutation',
    edits: [
      once('apparentSun.ts', 'const retarded = epv00(days - sunEarthDistance / ERFA_DC)', 'const retarded = epv00(days)'),
      once('apparentSun.ts', 'const apparent = ab(natural, v, sunEarthDistance, bm1)', 'const apparent = natural'),
      once('apparentSun.ts', 'rz(-(psib + dpsi), rx(phib, rz(gamb, apparent)))', 'rz(-psib, rx(phib, rz(gamb, apparent)))'),
    ],
  },
  { id: 'M9', name: 'remove nutation', edits: [once('apparentSun.ts', 'rz(-(psib + dpsi), rx(phib, rz(gamb, apparent)))', 'rz(-(psib + 0), rx(phib, rz(gamb, apparent)))')] },
  { id: 'M10', name: 'remove aberration', edits: [once('apparentSun.ts', 'const apparent = ab(natural, v, sunEarthDistance, bm1)', 'const apparent = natural')] },
  { id: 'M11', name: 'remove bias-precession frame transform', edits: [once('apparentSun.ts', 'rz(-(psib + dpsi), rx(phib, rz(gamb, apparent)))', 'rz(-dpsi, rx(phib, apparent))')] },
  { id: 'M12', name: 'truncate EPV00 to the first 50 terms of every table', edits: [every('erfa.ts', 'j < coeffs.length; j += 3', 'j < Math.min(coeffs.length, 150); j += 3')] },
  { id: 'M12b', name: 'truncate EPV00 by dropping only the last (smallest) term of every table', edits: [every('erfa.ts', 'j < coeffs.length; j += 3', 'j < coeffs.length - 3; j += 3')] },
]

const baseline = run('baseline')
expectedTests = baseline.executed
if (baseline.failed || baseline.exitCode !== 0 || baseline.executed < 20)
  throw new Error(`Baseline not green: ${JSON.stringify(baseline).slice(0, 1500)}`)
console.log('baseline green', baseline.executed)

const results = []
try {
  for (const m of mutants) {
    for (const e of m.edits) {
      const text = readFileSync(e.file, 'utf8')
      const count = text.split(e.from).length - 1
      if (e.all ? count < 1 : count !== 1) throw new Error(`${m.id}: target found ${count}x in ${e.file}`)
      writeFileSync(e.file, e.all ? text.split(e.from).join(e.to) : text.replace(e.from, e.to))
    }
    const mutatedHashes = Object.fromEntries(m.edits.map((e) => [e.file, hash(readFileSync(e.file))]))
    const r = run(m.id)
    restore()
    const killed = r.executed === expectedTests && r.failed > 0
    const status = killed ? 'KILLED' : r.executed !== expectedTests ? 'INVALID_RUN' : 'SURVIVED'
    results.push({ ...m, mutatedHashes, status, executed: r.executed, failed: r.failed, failures: r.failures.slice(0, 6), suiteErrors: r.suiteErrors })
    console.log(m.id, status, `${r.failed}/${r.executed} failed`)
  }
} finally {
  restore()
}
const out = {
  phase: '3B.4.3',
  method: 'in-place source mutation, serial full-suite execution, hash-verified restoration',
  testFiles: tests,
  testHashes,
  sourceHashes,
  baseline: { executed: baseline.executed, passed: baseline.passed, failed: baseline.failed },
  summary: Object.fromEntries(['KILLED', 'SURVIVED', 'INVALID_RUN'].map((s) => [s, results.filter((r) => r.status === s).length])),
  mutants: results,
}
writeFileSync('tasks/calendar-audit/erfa-foundation-v3.3/mutation/mutation-results.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.summary)
