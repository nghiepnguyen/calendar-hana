// Condenses run-runtimes.mjs + webkit-offline-investigation.mjs output into the
// committed v3.3 runtime-parity, performance and candidate-dataset artefacts.
// Usage (repo root): node .../write-runtime-reports.mjs <runtimeOutDir>
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
const dir = 'tasks/calendar-audit/erfa-foundation-v3.3'
const r = JSON.parse(readFileSync(join(out, 'runtime-results.json'), 'utf8'))
const inv = JSON.parse(readFileSync(join(out, 'webkit-offline-investigation.json'), 'utf8'))
const lines = readFileSync(join(out, 'node-lines.txt'), 'utf8')
const digest = createHash('sha256').update(lines).digest('hex')
if (digest !== r.node.digest) throw new Error('node line digest mismatch')

const runtimes = [
  { runtime: `node ${r.host.node}`, context: 'module', digest: r.node.digest, count: r.node.count, exactEqualToNode: true },
  ...r.runs.flatMap((x) => [
    { runtime: `${x.browser} ${x.version}`, context: `${x.contextOptions} / main thread`, digest: x.main?.digest, count: x.main?.count, exactEqualToNode: x.main?.exactEqualToNode ?? false, mismatches: x.main?.mismatches ?? [], error: x.error },
    { runtime: `${x.browser} ${x.version}`, context: `${x.contextOptions} / module worker`, digest: x.worker?.digest, exactEqualToNode: x.worker?.exactEqualToNode ?? false, error: x.worker?.error },
  ]),
]
const parity = {
  phase: '3B.4.3',
  model: r.node.model,
  comparedFields: ['year', 'termIndex', 'id (name)', 'targetLongitudeDeg', 'canonical TT integer ms', 'clock-v1 civil epoch ms', 'ISO string (3 fractional digits)', 'clock regime', 'clock policy id'],
  rawFloatingPointCompared: false,
  rows: r.node.count,
  coverage: '1899–2101 (4,824 supported crossings 1900–2100 + 48 padding)',
  nodeDigestSha256: r.node.digest,
  runtimes,
  allExactlyEqual: runtimes.every((x) => x.exactEqualToNode),
  host: r.host,
  physicalDevices: 'UNVERIFIED_DEVICE_GATE: no physical Safari/iOS or Android device was available; WebKit and mobile results are desktop engines with device emulation.',
  candidateDataset: `${dir}/fixtures/erfa-solar-term-candidate-v3.3.tsv`,
}
writeFileSync('calendar-erfa-runtime-parity-v3.3.json', JSON.stringify(parity, null, 2) + '\n')

const pick = (x) => x && { oneRootMs: x.oneRootMs, firstYear24Ms: x.firstYearMs, warmYear24UncachedMs: x.warmYearMs, cachedYearLookupMs: x.cachedYearLookupMs, all4872Ms: x.allMs }
const perf = {
  phase: '3B.4.3',
  host: r.host,
  method: 'harness.ts runParity(): one root (cold module), first year (cold cache), 24 uncached solves, cached year lookup, then all 4,872 boundaries 1899–2101 serialized via clock-v1. Browser timers are coarsened (Firefox/WebKit 1 ms; Chromium 0.1 ms).',
  cacheState: 'oneRoot and firstYear are first calls in a fresh realm; warmYear24Uncached bypasses the year cache; all4872 fills the bounded 32-year cache (evictions occur).',
  node: {
    runs: r.node.coldRuns.map((x) => ({ moduleInitMs: x.initMs, ...pick(x.timings), heapUsedBytesAfter: x.heapUsedBytes, heapDeltaBytes: x.heapDeltaBytes })),
    medians: Object.fromEntries(['oneRootMs', 'firstYearMs', 'warmYearMs', 'allMs'].map((k) => [k, r.node.coldRuns.map((x) => x.timings[k]).sort((a, b) => a - b)[1]])),
  },
  browsers: r.runs.map((x) => ({ runtime: `${x.browser} ${x.version}`, context: x.contextOptions, cpuThrottle: x.cpuThrottle ?? 1, pageLoadToReadyMs: x.loadToReadyMs, mainThread: pick(x.main?.timings), worker: pick(x.worker?.timings), heapUsedBytes: x.main?.heapUsedBytes })),
  bundle: r.bundle,
  perRootCost: 'about 9–12 apparent-Sun evaluations per root (Illinois on the integer grid); each evaluation runs EPV00 twice (light time) = ~7,800 deterministic sin/cos',
  fidelityReduction: 'none — no coefficient truncation, no lookup table, no stored timestamps',
}
const perfStats = (vals) => { const s = [...vals].sort((a, b) => a - b); return { median: s[Math.floor(s.length / 2)], p95: s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)], max: s.at(-1), n: s.length } }
const allMain = r.runs.map((x) => x.main?.timings.allMs).filter(Number.isFinite)
perf.summaryAcrossDesktopAndMobileBrowsers = { all4872Ms: perfStats(allMain), firstYear24Ms: perfStats(r.runs.map((x) => x.main?.timings.firstYearMs).filter(Number.isFinite)), oneRootMs: perfStats(r.runs.map((x) => x.main?.timings.oneRootMs).filter(Number.isFinite)) }
writeFileSync('calendar-erfa-performance-v3.3.json', JSON.stringify(perf, null, 2) + '\n')

writeFileSync(`${dir}/runtime/browser-gate-evidence.json`, JSON.stringify({ csp: r.csp, bundle: r.bundle, runs: r.runs.map(({ main, worker, ...x }) => ({ ...x, mainEqual: main?.exactEqualToNode, workerEqual: worker?.exactEqualToNode })), offlineControls: r.offlineControls, offlineInvestigation: inv }, null, 2) + '\n')

// Candidate dataset (implementation output; NOT independent Golden).
const header = [
  '# ERFA solar-term CANDIDATE dataset v3.3 — status: CANDIDATE (not reviewed, not Golden)',
  `# authority model: ${r.node.model} (ERFA 2.0.1 EPV00 + IAU 2006 + IAU 2000B, relativistic aberration, light time)`,
  '# frame: apparent geocentric, true ecliptic and equinox of date; time scale: TT (TDB≈TT)',
  '# boundary: first integer TT ms since J2000.0 TT at/after crossing; domain [T, nextT)',
  '# clock policy: clock-v1; serialization: ceil epoch ms, ISO-8601 3 fractional digits',
  '# generator: tasks/calendar-audit/erfa-foundation-v3.3/runtime/harness.ts (the implementation under test)',
  '# independent review: upstream ERFA C roots equal 4,872/4,872; JPL DE440s max |dT| 0.376 s (1900–2100). Output of the tested implementation — never use as independent Golden.',
  `# rows sha256 (node-lines): ${digest}`,
  '# columns: year|termIndex|id|targetLongitudeDeg|ttMs|civilEpochMs|civilIso|clockRegime|clockPolicy',
]
writeFileSync(`${dir}/fixtures/erfa-solar-term-candidate-v3.3.tsv`, header.join('\n') + '\n' + lines)
console.log({ allExactlyEqual: parity.allExactlyEqual, runtimes: runtimes.length })
