// Phase 3B.4.3 cross-runtime parity, browser/PWA/CSP/worker gate and performance.
// Builds the isolated ERFA foundation (never wired into the app), serves it with a
// strict CSP from a local static server, and runs Node, Chromium, Firefox and WebKit.
// Usage (repo root): node tasks/calendar-audit/erfa-foundation-v3.3/runtime/run-runtimes.mjs <outDir>
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { gzipSync, brotliCompressSync, constants as z } from 'node:zlib'
import os from 'node:os'
import { chromium, firefox, webkit, devices } from '@playwright/test'

const out = process.argv[2]
const here = 'tasks/calendar-audit/erfa-foundation-v3.3/runtime'
const sha = (b) => createHash('sha256').update(b).digest('hex')
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'site'), { recursive: true })

// ---- Builds -------------------------------------------------------------------
const rolldown = (entry, file, extra = []) =>
  execFileSync('npx', ['rolldown', entry, '--format', 'esm', '--file', file, ...extra], { stdio: 'pipe' })
rolldown(`${here}/page-main.ts`, join(out, 'site/main.js'), ['--minify'])
rolldown(`${here}/worker-main.ts`, join(out, 'site/worker.js'), ['--minify'])
cpSync(`${here}/page/index.html`, join(out, 'site/index.html'))
cpSync(`${here}/page/sw.js`, join(out, 'site/sw.js'))
rolldown(`${here}/harness.ts`, join(out, 'node-harness.mjs'))
// Foundation-only production-style bundle, built twice for determinism.
rolldown('shared/astronomy/erfa/index.ts', join(out, 'foundation-a.min.js'), ['--minify'])
rolldown('shared/astronomy/erfa/index.ts', join(out, 'foundation-b.min.js'), ['--minify'])
rolldown('shared/astronomy/erfa/index.ts', join(out, 'foundation.js'))
const minA = readFileSync(join(out, 'foundation-a.min.js'))
const minB = readFileSync(join(out, 'foundation-b.min.js'))
const unmin = readFileSync(join(out, 'foundation.js'))
const bundle = {
  bundler: `rolldown ${execFileSync('npx', ['rolldown', '--version'], { encoding: 'utf8' }).trim()}`,
  entry: 'shared/astronomy/erfa/index.ts',
  unminifiedBytes: unmin.length,
  minifiedBytes: minA.length,
  gzipBytes: gzipSync(minA, { level: 9 }).length,
  brotliBytes: brotliCompressSync(minA, { params: { [z.BROTLI_PARAM_QUALITY]: 11 } }).length,
  minifiedSha256: sha(minA),
  deterministicRebuild: sha(minA) === sha(minB),
  externalImports: [...minA.toString().matchAll(/\bimport\s*[^;]*?from\s*["']([^"']+)["']/g)].map((m) => m[1]),
  dynamicCodeOrNetwork: {
    eval: /\beval\s*\(/.test(unmin.toString()),
    newFunction: /new Function\s*\(/.test(unmin.toString()),
    fetch: /\bfetch\s*\(/.test(unmin.toString()),
    xmlHttpRequest: /XMLHttpRequest/.test(unmin.toString()),
    importScripts: /importScripts/.test(unmin.toString()),
    dynamicImport: /\bimport\s*\(/.test(unmin.toString()),
  },
  domGlobals: { window: /\bwindow\./.test(unmin.toString()), document: /\bdocument\./.test(unmin.toString()), localStorage: /localStorage/.test(unmin.toString()) },
}

// ---- Node ---------------------------------------------------------------------
function nodeRun(label) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
    const t0 = performance.now()
    const m = await import(${JSON.stringify(resolve(out, "node-harness.mjs"))})
    const initMs = performance.now() - t0
    const before = process.memoryUsage().heapUsed
    const r = m.runParity()
    const after = process.memoryUsage().heapUsed
    const { createHash } = await import('node:crypto')
    const digest = createHash('sha256').update(r.lines.join('\\n') + '\\n').digest('hex')
    process.stdout.write(JSON.stringify({ ...r, initMs, digest, heapDeltaBytes: after - before, heapUsedBytes: after }))
  `], { encoding: 'utf8', maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error(`${label}: ${r.stderr}`)
  return JSON.parse(r.stdout)
}
const nodeCold = [nodeRun('node-1'), nodeRun('node-2'), nodeRun('node-3')]
const node = nodeCold[0]
writeFileSync(join(out, 'node-lines.txt'), node.lines.join('\n') + '\n')

// ---- Static server with strict CSP -----------------------------------------------
const CSP = "default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; style-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }
const requests = []
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  const file = join(out, 'site', path === '/' ? 'index.html' : path)
  requests.push(path)
  if (!existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store' })
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://localhost:${server.address().port}`

const compareLines = (lines) => {
  const mismatches = []
  for (let i = 0; i < Math.max(lines.length, node.lines.length); i++)
    if (lines[i] !== node.lines[i] && mismatches.length < 10) mismatches.push({ i, node: node.lines[i], runtime: lines[i] })
  return mismatches
}

async function browserRun(name, type, contextOptions = {}, extra = {}) {
  const result = { browser: name, version: null, contextOptions: extra.label ?? 'desktop' }
  let browser
  try {
    browser = await type.launch()
    result.version = browser.version()
    const context = await browser.newContext({ ...contextOptions, serviceWorkers: 'allow' })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
    page.on('pageerror', (e) => consoleErrors.push(String(e)))
    if (extra.cpuThrottle && name === 'chromium') {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: extra.cpuThrottle })
      result.cpuThrottle = extra.cpuThrottle
    }
    const t0 = Date.now()
    await page.goto(`${origin}/index.html`)
    await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready')
    result.loadToReadyMs = Date.now() - t0
    const main = await page.evaluate(() => window.__erfa.run())
    result.main = { count: main.count, digest: main.digest, timings: main.timings, heapUsedBytes: main.heapUsedBytes, mismatches: compareLines(main.lines), exactEqualToNode: main.digest === node.digest && compareLines(main.lines).length === 0 }
    if (!extra.skipWorker) {
      try {
        const w = await page.evaluate(() => window.__erfa.runWorker())
        result.worker = { digest: w.digest, timings: w.timings, exactEqualToNode: w.digest === node.digest && compareLines(w.lines).length === 0 }
      } catch (e) {
        result.worker = { error: String(e).slice(0, 400) }
      }
    }
    result.cspViolations = await page.evaluate(() => window.__erfa.violations)
    result.consoleErrors = consoleErrors
    // ---- Offline: service-worker controlled reload and fresh navigation.
    result.serviceWorkerRegistered = await page.evaluate(() => window.__erfa.swReady)
    await page.reload()
    await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready')
    result.serviceWorkerControlling = await page.evaluate(() => !!navigator.serviceWorker?.controller)
    const offline = {}
    const before = requests.length
    await context.setOffline(true)
    for (const [label, action] of [
      ['reload', () => page.reload({ waitUntil: 'domcontentloaded' })],
      ['newPageGoto', async () => { const p2 = await context.newPage(); await p2.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' }); return p2 }],
    ]) {
      try {
        const target = (await action()) ?? page
        const p = typeof target.waitForFunction === 'function' ? target : page
        await p.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, { timeout: 15000 })
        const year = await p.evaluate(async () => (await window.__erfa.run()).digest)
        offline[label] = { ok: true, digestEqualToNode: year === node.digest }
      } catch (e) {
        offline[label] = { ok: false, error: String(e).split('\n')[0].slice(0, 300) }
      }
    }
    // Isolate the engine from navigation: evaluate on the already-loaded page while offline.
    try {
      const p3 = await context.newPage()
      await context.setOffline(false)
      await p3.goto(`${origin}/index.html`)
      await p3.waitForFunction(() => document.getElementById('status')?.textContent === 'ready')
      await context.setOffline(true)
      const d = await p3.evaluate(async () => (await window.__erfa.run()).digest)
      offline.computeWhileOfflineOnLoadedPage = { ok: true, digestEqualToNode: d === node.digest }
    } catch (e) {
      offline.computeWhileOfflineOnLoadedPage = { ok: false, error: String(e).split('\n')[0].slice(0, 300) }
    }
    offline.networkRequestsWhileOffline = requests.slice(before).length
    result.offline = offline
    await context.close()
  } catch (e) {
    result.error = String(e).split('\n').slice(0, 3).join(' | ').slice(0, 600)
  } finally {
    await browser?.close()
  }
  console.log(name, result.contextOptions, JSON.stringify({ eq: result.main?.exactEqualToNode, worker: result.worker?.exactEqualToNode, csp: result.cspViolations?.length, offline: result.offline, error: result.error }))
  return result
}

// Control experiment for the WebKit offline-navigation question: offline navigation
// with NO service worker must fail in every browser (it proves the harness, not the engine).
async function offlineControl(name, type) {
  const browser = await type.launch()
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' })
    const page = await context.newPage()
    await page.goto(`${origin}/index.html`)
    await context.setOffline(true)
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })
      return { browser: name, reloadWithoutServiceWorker: 'UNEXPECTEDLY_SUCCEEDED' }
    } catch (e) {
      return { browser: name, reloadWithoutServiceWorker: 'FAILED_AS_EXPECTED', error: String(e).split('\n')[0].slice(0, 200) }
    }
  } finally {
    await browser.close()
  }
}

const runs = []
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) runs.push(await browserRun(name, type))
runs.push(await browserRun('chromium', chromium, { ...devices['Pixel 7'] }, { label: 'mobile Pixel 7 emulation, 4x CPU throttle', cpuThrottle: 4 }))
runs.push(await browserRun('webkit', webkit, { ...devices['iPhone 14'] }, { label: 'mobile iPhone 14 emulation' }))
const controls = []
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) controls.push(await offlineControl(name, type))
server.close()

const summary = {
  phase: '3B.4.3',
  generatedAt: new Date().toISOString(),
  host: { platform: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, cores: os.cpus().length, memoryBytes: os.totalmem(), node: process.version, playwright: JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8')).version },
  csp: CSP,
  bundle,
  node: { digest: node.digest, count: node.count, model: node.model, coldRuns: nodeCold.map((r) => ({ initMs: r.initMs, timings: r.timings, heapUsedBytes: r.heapUsedBytes, heapDeltaBytes: r.heapDeltaBytes, digest: r.digest })) },
  runs,
  offlineControls: controls,
}
writeFileSync(join(out, 'runtime-results.json'), JSON.stringify(summary, null, 2))
console.log('bundle', JSON.stringify(bundle))
