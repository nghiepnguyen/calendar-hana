// Offline probe: precache the page and both bundles; serve cache-first.
const CACHE = 'erfa-probe-v1'
const ASSETS = ['./', './index.html', './main.js', './worker.js']
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())))
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)),
  )
})
