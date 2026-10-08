# Rollback (v3.4B)

**Result: PASS. Rehearsed in both directions.**

## Design: one revertable commit boundary

The whole migration is a single commit on top of `f845444`. Reverting that commit restores everything together:

| Restored together | Before migration | After migration |
|---|---|---|
| Boundary source | Astronomy Engine `SearchSunLongitude` (`shared/lunar/solarTerms.ts`) | JPL table (`shared/astronomy/solarTerms`) |
| Authority version / method | `astronomy-engine-search-sun-longitude-v1` | `jpl-de440s-table:astronomy-authority-v4:clock-v1` |
| Clock | Astronomy Engine UTC/Delta-T | clock-v1 |
| Cache namespace | bare / unversioned in-memory keys | `solar-terms/astronomy-authority-v4/clock-v1` |
| Current Golden selection | golden-v3 (blocking) | golden-v4 (blocking) + golden-v3 historical |

There is no rollback state in which the code returns to Astronomy Engine but the caches still hold JPL-v4 values. All solar-term caches are in-process memory owned by the same modules, and the revert removes the namespaced cache module itself. No persistent store (IndexedDB/Dexie, Firestore, service-worker runtime cache) holds solar-term-derived results. The service-worker precache is keyed by content-hashed assets, so a rolled-back build replaces the bundle atomically.

## Procedure

```
git revert --no-edit <migration-commit>
npm run build   # redeploy; the service worker picks up the new precache manifest
```

## Rehearsal (isolated worktree, never on main)

1. Created a worktree at `f845444`, applied the full migration change set and committed it as one commit.
2. `git revert --no-edit HEAD`. The tree hash after the revert was `762130e3dd7d392a6895a6f9d8bb08bed1e8f220`, **identical** to the `f845444` tree.
3. Ran the unit tests on the reverted tree: 2,027 tests, 50 failures. The failure set is **identical** to the pre-migration baseline (golden-v3 and P2 against Astronomy Engine roots).
4. Re-forward: reverted the revert. Authority, Group B (v4 + historical), consumer and Bazi suites: 1,367 / 1,367 pass.

Before committing, the tree hash after reverting the actual migration commit must equal `762130e3…`. Recheck this before release.
