# ERFA foundation browser / PWA / CSP / device gate v3.3

**Result: PASS for desktop engines and emulated mobile. UNVERIFIED_DEVICE_GATE for physical Safari/iOS and Android.** The engine is not wired into the app. Everything here was measured on an isolated probe page that loads only the foundation bundle.

Evidence:

- `calendar-erfa-runtime-parity-v3.3.json`
- `calendar-erfa-performance-v3.3.json`
- `tasks/calendar-audit/erfa-foundation-v3.3/runtime/browser-gate-evidence.json`

Tooling: `runtime/run-runtimes.mjs`, `runtime/webkit-offline-investigation.mjs`.

## 1. Bundle

| Metric | Value |
|---|---|
| Entry | `shared/astronomy/erfa/index.ts` (rolldown 1.2.9, the bundler under Vite 8) |
| Unminified | 138,427 B |
| Minified | 108,407 B |
| gzip -9 | 47,293 B |
| brotli q11 | 39,089 B |
| Deterministic rebuild | yes (two builds byte-identical) |
| External imports | none |
| eval / new Function / fetch / XHR / importScripts / dynamic import | none |
| DOM / storage globals | none (safe for SSR, prerender and workers) |

About 83% of the source bytes are the 1,951-term EPV00 table. No remote astronomy data is loaded at runtime.

## 2. CSP

The probe was served with:

```
default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; style-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

There were **0 `securitypolicyviolation` events** in every browser, on the main thread and in module workers. The engine needs no `unsafe-eval`, `unsafe-inline` or `wasm-unsafe-eval`. Firefox logged that its own browser-chrome favicon request was blocked by `img-src 'none'`. That request comes from the browser, not from the page.

## 3. Runtimes and determinism

All 4,872 boundaries for 1899–2101 were computed and serialized in each context: year, term index/id, target longitude, TT ms, clock-v1 civil ms, ISO string, regime and policy.

| Runtime | Context | Equal to Node (byte-exact) |
|---|---|---|
| Node 23.7.0 | module | reference |
| Chromium 153 | desktop main thread / module worker | yes / yes |
| Firefox 155 | desktop main thread / module worker | yes / yes |
| WebKit 26.6 | desktop main thread / module worker | yes / yes |
| Chromium 153 | Pixel 7 emulation, 4× CPU throttle, main / worker | yes / yes |
| WebKit 26.6 | iPhone 14 emulation, main / worker | yes / yes |

Digest SHA-256 `80a24dae71e8abe8ebfa46a6bd237166b0cc972202dac2a5283a8855722fe5cc`. Raw floating-point intermediates were not compared for equality, as designed. They match bit-for-bit anyway, because the engine uses no runtime libm.

## 4. Offline / PWA, and the earlier WebKit failure

The probe page registers a cache-first service worker that precaches the page and both bundles.

| Browser | `setOffline` reload | `setOffline` new navigation | Real server shutdown: reload / navigation | Compute offline on loaded page |
|---|---|---|---|---|
| Chromium | pass | pass | pass / pass | pass |
| Firefox | pass | pass | pass / pass | pass |
| WebKit | **fail**: "WebKit encountered an internal error" | **fail** (same) | **pass / pass** (SW serves the page; digest equal) | pass |

Control: with service workers blocked, offline reload fails in all three browsers as expected. WebKit reports the same "internal error" text there, while Chromium reports `ERR_INTERNET_DISCONNECTED` and Firefox `NS_ERROR_OFFLINE`.

**Classification of the WebKit failure: BROWSER_INFRA_FAILURE (test-harness network emulation). Not an ENGINE_FAILURE.**

- When the network is genuinely unavailable (server closed, sockets destroyed), the same WebKit build loads the page from the service worker and computes identical results.
- The failure appears only with Playwright's `context.setOffline(true)` in WebKit, which rejects navigations before the service worker can answer.
- The 3B.4.2A failure therefore came from the harness. Production PWA navigation offline in WebKit still has to be confirmed on a physical Safari/iOS device.

Firefox note: under `setOffline`, Firefox still sent `/sw.js` update checks to the server. Its emulation does not block service-worker update requests. Results were unaffected.

## 5. Performance (summary; full data in `calendar-erfa-performance-v3.3.json`)

Apple M-series host:

| Measurement | Node (median of 3 cold processes) | Browsers desktop (median) | Pixel 7 emulation, 4× throttle |
|---|---|---|---|
| One root (cold) | ≈ 4 ms | 3–10 ms | 15 ms |
| First year, 24 roots (cold cache) | ≈ 27 ms | 26–35 ms | 103 ms |
| All 4,872 roots + serialization | ≈ 4.9 s | 4.0–6.3 s | 19.2 s |
| Cached year lookup | < 0.1 ms | < 1 ms | < 1 ms |
| Heap | 7.6–10 MB after the full run | Chromium about 10 MB | — |

- Page load to ready: 42–129 ms locally (local server, cold browser context).
- A calendar view needs one or two years, about 30–100 ms cold. That is acceptable synchronously; a worker is recommended for full-range batch use.
- The full 4,872-root sweep is an audit workload, not a UI path.
- Cache: a bounded 32-year memo derived from the engine. No stored timestamps. Fidelity is not reduced.

## 6. Not verified

- **UNVERIFIED_DEVICE_GATE:** physical Safari/iOS and physical Android, including installed-PWA offline launch, memory pressure and timing on low-end CPUs.
- The production Vite PWA (`injectManifest`) path with the engine bundled. The engine is not wired in this phase. The production build still passes unchanged.
