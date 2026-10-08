// Phase 3B.4.3: discriminate the WebKit offline-navigation failure.
// Experiment A uses Playwright's context.setOffline(true) (network emulation).
// Experiment B makes the network genuinely unavailable by shutting the origin
// server down (all sockets destroyed) while the service worker controls the page.
// If B succeeds where A fails, A's failure is an emulation/harness artefact.
// Usage (repo root, after run-runtimes.mjs): node .../webkit-offline-investigation.mjs <runtimeOutDir>
import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { chromium, firefox, webkit } from '@playwright/test'

const out = process.argv[2]
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }

function startServer(port = 0) {
  const sockets = new Set()
  const log = []
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname
    log.push(path)
    const file = join(out, 'site', path === '/' ? 'index.html' : path)
    if (!existsSync(file)) return res.writeHead(404).end()
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
    res.end(readFileSync(file))
  })
  server.on('connection', (s) => (sockets.add(s), s.on('close', () => sockets.delete(s))))
  return new Promise((resolve) =>
    server.listen(port, '127.0.0.1', () =>
      resolve({
        port: server.address().port,
        log,
        stop: () => new Promise((r) => { for (const s of sockets) s.destroy(); server.close(() => r()) }),
      }),
    ),
  )
}

const ready = (p) => p.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, { timeout: 15000 })
const first = (e) => String(e).split('\n')[0].slice(0, 240)

async function experiment(name, type, mode) {
  const srv = await startServer()
  const origin = `http://localhost:${srv.port}`
  const browser = await type.launch()
  const result = { browser: name, version: browser.version(), mode }
  try {
    const context = await browser.newContext({ serviceWorkers: 'allow' })
    const page = await context.newPage()
    await page.goto(`${origin}/index.html`)
    await ready(page)
    result.serviceWorkerRegistered = await page.evaluate(() => window.__erfa.swReady)
    await page.reload()
    await ready(page)
    result.controlledBeforeOffline = await page.evaluate(() => !!navigator.serviceWorker.controller)
    const before = srv.log.length
    if (mode === 'setOffline') await context.setOffline(true)
    else await srv.stop()
    for (const [label, act] of [
      ['reload', async () => { await page.reload({ waitUntil: 'domcontentloaded' }); return page }],
      ['newPageGoto', async () => { const p = await context.newPage(); await p.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' }); return p }],
    ]) {
      try {
        const p = await act()
        await ready(p)
        const r = await p.evaluate(async () => {
          const x = await window.__erfa.run()
          return { count: x.count, digest: x.digest, controlled: !!navigator.serviceWorker.controller }
        })
        result[label] = { ok: true, ...r }
      } catch (e) {
        result[label] = { ok: false, error: first(e) }
      }
    }
    result.serverRequestsAfterOffline = srv.log.slice(before)
    await context.close()
  } catch (e) {
    result.error = first(e)
  } finally {
    await browser.close()
    if (mode === 'setOffline') await srv.stop()
  }
  console.log(JSON.stringify(result))
  return result
}

const results = []
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]])
  for (const mode of ['setOffline', 'serverShutdown']) results.push(await experiment(name, type, mode))
writeFileSync(join(out, 'webkit-offline-investigation.json'), JSON.stringify(results, null, 2))
