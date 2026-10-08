# Physical device gate (v3.4B)

**Status: UNVERIFIED_DEVICE_GATE → RELEASE_BLOCKED_DEVICE_GATE**

No physical Safari/iOS or Android device was available to this session. The migration implementation is not invalidated by this, but release requires the checks below (D3).

## Automated proxies already run (not a substitute)

- Playwright WebKit (Desktop Safari) and iPhone 15 / Pixel 7 emulation: all functional specs pass, including offline/PWA install and solar terms.
- Node desktop: authority first load + SHA-256 verification takes 27.5 ms; a lookup takes 0.12 µs; the table is 21 KB gzipped.

## Required checks: Safari/iOS (installed PWA) and Android/Chrome (installed PWA)

| Check | How | Pass criterion |
|---|---|---|
| Offline cold launch | Install, open once online, enable airplane mode, force-quit, relaunch | App opens; day view shows term label and time |
| Authority table load | Open `/day/2026-09-07` offline | "Bắt đầu lúc 21:41"; no SolarTermAuthorityError in the console |
| Cache upgrade | Install the pre-migration build, then update to the migration build (update prompt), go offline | `/day/1946-12-07` shows Tiểu tuyết (not Đại tuyết) and Officer for month Hợi; `/day/1938-09-22` shows Tứ Ly avoidance |
| Exact boundary | Open `/day/1946-12-08` | "Tiết Đại tuyết", start 00:00:11 (VN) |
| Memory | Safari Web Inspector / Chrome remote devtools heap snapshot after day, month and Bazi views | No regression above +1 MB vs the pre-migration build |
| Timing | Performance panel: first `getDayInfo` after cold start | First authority load under 100 ms on a mid-range device |

Record the results as `calendar-device-gate-v3.4B-results.md`.
