import { runParity } from './harness'

declare global {
  interface Window {
    __erfa: { run: () => unknown; runWorker: () => Promise<unknown>; violations: string[]; swReady: Promise<boolean> }
  }
}

async function digest(lines: string[]) {
  const bytes = new TextEncoder().encode(lines.join('\n') + '\n')
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const violations: string[] = []
document.addEventListener('securitypolicyviolation', (e) => violations.push(`${e.violatedDirective} ${e.blockedURI}`))

window.__erfa = {
  violations,
  async run() {
    const r = runParity()
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
    return { ...r, digest: await digest(r.lines), heapUsedBytes: mem?.usedJSHeapSize ?? null }
  },
  runWorker() {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./worker.js', { type: 'module' })
      worker.onmessage = async (e) => resolve({ ...e.data, digest: await digest(e.data.lines) })
      worker.onerror = (e) => reject(new Error(e.message))
    })
  },
  swReady:
    'serviceWorker' in navigator
      ? navigator.serviceWorker
          .register('./sw.js')
          .then(() => navigator.serviceWorker.ready)
          .then(() => true)
          .catch(() => false)
      : Promise.resolve(false),
}
document.getElementById('status')!.textContent = 'ready'
