# Regression (v3.4B)

**Unexplained failures: 0.** "FULL_GREEN" is **not** claimed, because 13 pre-existing visual-snapshot failures remain (classified below).

| Suite | Before (f845444) | After |
|---|---|---|
| Unit (`vitest run`) | 1,977 / 2,027 (50 known Group B) | **2,679 / 2,679** |
| Emulator integration (`test:emulator`) | — | **29 / 29** |
| Typecheck (`tsc -b` + functions) | — | **pass** |
| Lint (oxlint) | — | **pass** (exit 0) |
| Format (`prettier --check .`) | 736 files flagged | 736 flagged (same set), **0 new**. All pre-existing: 721 graphify-out, 6 audit JSON, 2 golden-v3 JSON, 6 other files (`shared/` 3, `src/` 2, `example.spec.ts`), `.codex` |
| Production build | pass | **pass** (main chunk gzip 315.1 KB → 339.8 KB; ERFA not bundled) |
| Playwright E2E, 5 projects | — | **482 passed**, 95 skipped (by design), **13 failed** |
| PWA / offline E2E (`offline-install-popup`, service worker) | — | pass (included in the 482) |
| SSR / prerender (`prerender-days`) | 1,095 pages | 1,095 pages, **byte-identical** apart from asset hashes; sitemap identical |
| Solar-term E2E (`solar-terms.spec`) | — | pass (2026-09-07 Bạch lộ still 21:41 VN) |

## The 13 E2E failures: TEST_INFRA_FAILURE (pre-existing; not migration)

**What fails.** `visual-default.spec.ts`, desktop and mobile Chromium:
- day / week / month (light and dark);
- the create-form screenshot.

**Same failures before the migration.** The pre-migration tree (f845444, same `.env*` files) fails the same 13 tests against the same committed baselines.

**Screenshots compared directly.** Pre- and post-migration actual screenshots are **pixel-identical** in 11 of 13. The other two differ only by:
- the offline "App đã dùng được khi không có mạng" toast, whose appearance depends on timing (light/day/mobile);
- a 13-pixel caret blink (create form).

The page under test is 2026-09-23, the Thu phân day; "Tiết Thu phân" renders identically before and after.

**Cause.** The committed baselines are stale relative to the current UI; for example, they predate the "Đăng nhập" header button.

**Action.** Snapshots were **not** updated. They need an owner decision unrelated to this migration.

## Day-level / UI / SEO changes

Classified in `production-impact-v3.4B.json`, with 0 UNEXPECTED_REGRESSION:

| Change | Count | Class |
|---|---|---|
| Daily term label: index or startsToday | 4 days (1938-09-23 and 09-24; 1946-12-07 and 12-08) | expected |
| `startsAtUtc` value (displayed crossing time) | every day; moves with the authority T | expected |
| Daily Officer | 1 day (1946-12-07) | expected |
| Tứ Ly | 2 day flips (1938-09-22 and 09-23) | expected |
| Group B at civil noon | 0 | — |
| Almanac content apart from officer, term, stars and recommendations | 0 days | — |

Event advice follows the Officer, stars and recommendations, so it changes only on 1946-12-07.

## Notes

- Historical evidence protection: `calendarExtendedAudit.test.ts` previously rewrote `tasks/calendar-audit/phase2.1-results.json` on every run. Under the new authority this would have silently changed frozen Phase 2.1 evidence (diagnostic `dayLabelTransitionUtc` values only). The writer is now opt-in (`PHASE21_AUDIT_OUTPUT`), and the file is unchanged.
- Tests disabled: none. Assertions weakened: none.
- The golden-v3 assertions now accept only the 77 reviewed, manifest-pinned v4 values, plus 13 for the P2 evidence check. Every other v3 record must still match exactly.
