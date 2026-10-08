// Phase 3B.4.3 independent port review driver (audit tooling only).
// Compares the TypeScript port with unmodified upstream ERFA 2.0.1 C under the
// tolerances pre-registered in tolerance-preregistration.json.
//
// Usage (repo root):
//   sh tasks/calendar-audit/erfa-foundation-v3.3/port-review/build-upstream.sh <work>
//   node tasks/calendar-audit/erfa-foundation-v3.3/port-review/run-parity.mjs <work>
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const work = process.argv[2]
const dir = 'tasks/calendar-audit/erfa-foundation-v3.3'
const prereg = readFileSync(`${dir}/port-review/tolerance-preregistration.json`)
const preregSha = createHash('sha256').update(prereg).digest('hex')
if (preregSha !== readFileSync(`${dir}/port-review/tolerance-preregistration.sha256`, 'utf8').split(' ')[0])
  throw new Error('Tolerance pre-registration changed after registration')
const tol = JSON.parse(prereg).tolerances

// Bundle the port (internals included) for Node.
const tmp = mkdtempSync(join(tmpdir(), 'erfa-parity-'))
writeFileSync(
  join(tmp, 'entry.ts'),
  `export * from '${process.cwd()}/shared/astronomy/erfa/erfa'
export * from '${process.cwd()}/shared/astronomy/erfa/apparentSun'
export * from '${process.cwd()}/shared/astronomy/erfa/solarTermRoots'\n`,
)
execFileSync('npx', ['rolldown', join(tmp, 'entry.ts'), '--format', 'esm', '--file', join(tmp, 'bundle.mjs')], { stdio: 'ignore' })
const E = await import(join(tmp, 'bundle.mjs'))

// ---- Official upstream vectors (t_erfa_c.c) applied to the TS port -----------
const vectors = []
const vvd = (name, got, expected, tolerance) =>
  vectors.push({ name, got, expected, tolerance, pass: Math.abs(got - expected) <= tolerance })
{
  const d = 2400000.5 - 2451545.0 + 53411.52501161
  const r = E.epv00(d)
  const exp = [
    [r.heliocentricPosition, [-0.7757238809297706, 0.559805224136334, 0.2426998466481687], 1e-14],
    [r.heliocentricVelocity, [-0.010918918241473138, -0.01247187268440845, -0.005407569418065039], 1e-15],
    [r.barycentricPosition, [-0.7714104440491112, 0.5598412061824172, 0.24259962777224525], 1e-14],
    [r.barycentricVelocity, [-0.010918742681168233, -0.012465254617328616, -0.0054047731809662315], 1e-15],
  ]
  exp.forEach(([got, e, t], k) => e.forEach((v, i) => vvd(`eraEpv00 ${['pvh0', 'pvh1', 'pvb0', 'pvb1'][k]}[${i}]`, got[i], v, t)))
  vvd('eraEpv00 status', r.outsideNominalRange ? 1 : 0, 0, 0)
  const n = E.nut00b(2400000.5 - 2451545.0 + 53736.0)
  vvd('eraNut00b dpsi', n.dpsi, -0.000009632552291148363, 1e-13)
  vvd('eraNut00b deps', n.deps, 0.00004063197106621159, 1e-13)
  const f = E.pfw06(2400000.5 - 2451545.0 + 50123.9999)
  vvd('eraPfw06 gamb', f.gamb, -0.0000022433876709979958, 1e-16)
  vvd('eraPfw06 phib', f.phib, 0.4091014602391313, 1e-12)
  vvd('eraPfw06 psib', f.psib, -0.0009501954178013031, 1e-14)
  vvd('eraPfw06 epsa', f.epsa, 0.40910143165873675, 1e-12)
  vvd('eraObl06', E.obl06(2400000.5 - 2451545.0 + 54388.0), 0.4090749229387258, 1e-14)
  const a = E.ab(
    [-0.76321968546737951, -0.60869453983060384, -0.21676408580639883],
    [2.1044018893653786e-5, -8.9108923304429319e-5, -3.8633714797716569e-5],
    0.99980921395708788,
    0.99999999506209258,
  )
  ;[-0.7631631094219556, -0.6087553082505591, -0.21679262693684712].forEach((v, i) => vvd(`eraAb ${i}`, a[i], v, 1e-12))
  const p = E.pn([0.3, 1.2, -2.5])
  vvd('eraPn r', p.r, 2.7892651361962706, 1e-12)
  ;[0.10755521090731121, 0.43022084362924484, -0.8962934242275934].forEach((v, i) => vvd(`eraPn u${i}`, p.u[i], v, 1e-12))
  vvd('eraPm', E.pm([0.3, 1.2, -2.5]), 2.7892651361962706, 1e-12)
  // eraApcs velocity step (geocentric observer: only v and bm1 are exercised by the port).
  const AUDMS = 149597870.7e3 / 86400.0
  const vc = E.velocityInC([
    0.00364365824 + -77.0361767 / AUDMS,
    -0.0154287319 + -133.310856 / AUDMS,
    -0.00668922024 + 0.0971855934 / AUDMS,
  ])
  vvd('eraApcs v0', vc.v[0], 0.000020787049932826855, 1e-16)
  vvd('eraApcs v1', vc.v[1], -0.00008955360106989405, 1e-16)
  vvd('eraApcs v2', vc.v[2], -0.00003863338994289409, 1e-16)
  vvd('eraApcs bm1', vc.bm1, 0.9999999950277562, 1e-12)
}

// ---- Epoch set -----------------------------------------------------------------
let seed = 20261008
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648)
const epochs = []
for (let year = 1899; year <= 2101; year++)
  for (let k = 0; k < 3; k++) {
    const jan1 = (Date.UTC(year, 0, 1) - 946728000000) / 86400000
    // Three epochs per year spread over the seasons (thirds of the year, random within).
    epochs.push({ kind: 'grid', ms: Math.round((jan1 + k * 121.75 + rnd() * 121.75) * 86400000) })
  }
epochs.push(
  { kind: 'j2000', ms: 0 },
  { kind: 'padding-1899-start', ms: Date.UTC(1899, 0, 1) - 946728000000 },
  { kind: 'padding-2101-end', ms: Date.UTC(2101, 11, 31, 23) - 946728000000 },
)

// TS roots for all 4,872 crossings (1899–2101), giving near-crossing epochs.
const tsRoots = []
for (let year = 1899; year <= 2101; year++) for (const b of E.erfaSolarTermsForYear(year)) tsRoots.push(b)
for (const b of tsRoots)
  epochs.push({ kind: 'crossing-T-1', ms: b.ttMs - 1 }, { kind: 'crossing-T', ms: b.ttMs })

function runC(binary) {
  const input =
    epochs.map((e) => `E ${e.ms}`).join('\n') +
    '\n' +
    tsRoots.map((b) => `R ${b.year} ${b.termIndex}`).join('\n') +
    '\n'
  const out = spawnSync(binary, { input, encoding: 'utf8', maxBuffer: 1 << 30 })
  if (out.status !== 0) throw new Error(`harness failed: ${out.stderr}`)
  const lines = out.stdout.trim().split('\n')
  const eLines = lines.filter((l) => l.startsWith('E ')).map((l) => l.split(' ').slice(1).map(Number))
  const rLines = lines.filter((l) => l.startsWith('R ')).map((l) => l.split(' ').slice(1))
  return { eLines, rLines }
}

const fields = {
  heliocentricPositionAu: [0, 3],
  heliocentricVelocityAuPerDay: [3, 6],
  barycentricPositionAu: [6, 9],
  barycentricVelocityAuPerDay: [9, 12],
  nutationRad: [12, 14],
  fukushimaWilliamsRad: [14, 17],
  meanObliquityRad: [17, 18],
  apparentLongitudeDeg: [18, 19],
}
function tsRow(ms) {
  // Same integer ms and the same division as the C harness.
  const d = ms / 86400000
  const r = E.epv00(d)
  const n = E.nut00b(d)
  const f = E.pfw06(d)
  const s = E.apparentSunTrueEclipticOfDate(ms)
  return [
    ...r.heliocentricPosition, ...r.heliocentricVelocity, ...r.barycentricPosition, ...r.barycentricVelocity,
    n.dpsi, n.deps, f.gamb, f.phib, f.psib, f.epsa, s.longitudeDeg,
  ]
}

function compare(label, c) {
  const maxAbs = Object.fromEntries(Object.keys(fields).map((k) => [k, 0]))
  const worst = {}
  const violations = []
  c.eLines.forEach((row, i) => {
    const d = row[0]
    if (d !== epochs[i].ms / 86400000) throw new Error('epoch misalignment')
    const ts = tsRow(epochs[i].ms)
    for (const [k, [a, b]] of Object.entries(fields))
      for (let j = a; j < b; j++) {
        let diff = Math.abs(ts[j] - row[1 + j])
        if (k === 'apparentLongitudeDeg' && diff > 180) diff = 360 - diff
        if (diff > maxAbs[k]) {
          maxAbs[k] = diff
          worst[k] = { epochIndex: i, kind: epochs[i].kind, ttMs: epochs[i].ms, ts: ts[j], upstream: row[1 + j] }
        }
        if (diff > tol[k] && violations.length < 50)
          violations.push({ field: k, epochIndex: i, diff })
      }
  })
  // Roots.
  const rootDiffs = []
  c.rLines.forEach((r, i) => {
    const b = tsRoots[i]
    if (r[2] === 'UNBRACKETED') return rootDiffs.push({ year: b.year, termIndex: b.termIndex, error: 'C_UNBRACKETED' })
    const cT = Number(r[2])
    if (cT !== b.ttMs)
      rootDiffs.push({ year: b.year, termIndex: b.termIndex, tsTtMs: b.ttMs, upstreamTtMs: cT, upstreamResidualBefore: Number(r[4]), upstreamResidualAt: Number(r[5]) })
  })
  const explained = rootDiffs.filter(
    (x) => x.upstreamTtMs !== undefined && Math.abs(x.tsTtMs - x.upstreamTtMs) === 1 &&
      Math.min(Math.abs(x.upstreamResidualBefore), Math.abs(x.upstreamResidualAt)) <= 1e-11,
  )
  return {
    label,
    epochCount: c.eLines.length,
    rootCount: c.rLines.length,
    maxAbs,
    worst,
    toleranceViolations: violations,
    rootExactMatches: c.rLines.length - rootDiffs.length,
    rootDifferences: rootDiffs,
    rootDifferencesExplainedByLongitudeTolerance: explained.length,
    rootDifferencesUnexplained: rootDiffs.length - explained.length,
    pass: violations.length === 0 && rootDiffs.length === explained.length,
  }
}

const strictRun = runC(join(work, 'strict/harness'))
const strict = compare('clang -O2 -ffp-contract=off (pre-registered comparison)', strictRun)
// Compact upstream-C vector fixture for the unit tests: every grid epoch of every
// 4th year plus the J2000/padding probes (strict build output, %.17g exact).
const fixtureRows = strictRun.eLines
  .map((row, i) => ({ row, e: epochs[i], i }))
  .filter(({ e, i }) => (e.kind === 'grid' && Math.floor(i / 3) % 4 === 0) || ['j2000', 'padding-1899-start', 'padding-2101-end'].includes(e.kind))
  .map(({ row, e }) => [e.ms, ...row.slice(1, 20)])
writeFileSync(
  `${dir}/fixtures/upstream-erfa-c-vectors-v3.3.json`,
  JSON.stringify({
    classification: 'INDEPENDENT_UPSTREAM_VECTORS (ERFA 2.0.1 C, clang -O2 -ffp-contract=off)',
    tolerancePreregistrationSha256: preregSha,
    rowFormat: ['ttMs', 'pvh0[3]', 'pvh1[3]', 'pvb0[3]', 'pvb1[3]', 'dpsi', 'deps', 'gamb', 'phib', 'psib', 'epsa', 'apparentLongitudeDeg'],
    rows: fixtureRows,
  }).replace('],[', '],\n[') + '\n',
)
const contracted = compare('clang -O2 default fp-contract (informational only)', runC(join(work, 'default/harness')))
const counts = epochs.reduce((m, e) => ((m[e.kind] = (m[e.kind] ?? 0) + 1), m), {})
const result = {
  phase: '3B.4.3',
  classification: 'INDEPENDENT_PORT_REVIEW',
  upstream: 'ERFA 2.0.1 C (unmodified), archive sha256 d5469fbd0b212b3c7270c1da15c9bd82f37da9218fc89627f98283d27b416cbf',
  compiler: execFileSync('cc', ['--version'], { encoding: 'utf8' }).split('\n')[0],
  platform: `${process.platform}-${process.arch}`,
  tolerancePreregistrationSha256: preregSha,
  tolerances: tol,
  epochCounts: counts,
  officialVectors: { total: vectors.length, passed: vectors.filter((v) => v.pass).length, vectors },
  strict,
  contractedInformational: contracted,
  verdict:
    strict.pass && vectors.every((v) => v.pass) ? 'PORT_FIDELITY_PASS' : 'BLOCK_PORT_FIDELITY',
}
writeFileSync(`${dir}/erfa-port-parity.json`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ verdict: result.verdict, vectors: result.officialVectors.passed + '/' + vectors.length, counts, strictMax: strict.maxAbs, strictRoots: [strict.rootExactMatches, strict.rootDifferences.length], contractedMax: contracted.maxAbs, contractedRoots: [contracted.rootExactMatches, contracted.rootDifferences.length] }, null, 1))
