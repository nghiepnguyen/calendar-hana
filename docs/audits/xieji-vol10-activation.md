# 卷十 scoring activation — release candidate

Status: **PREPARED LOCALLY, NOT MERGED OR DEPLOYED**. Production remains OFF until the activation release is merged, built and deployed.

Base: readiness PR #31 (`53c80e8`) on top of `43d6303`; branch `codex/enable-xieji-vol10-scoring`. PR #31 is still open, so this release PR is stacked on its branch. No merge or deployment is part of preparation.

## Product change

`shared/almanac-data/manifest.json`: `policies.xiejiVol10Scoring` false → true. No other product behavior, weights, authority data or independent Golden changes. Mansion scoring remains false.

The existing reviewed 卷十 scorer now runs through the production manifest. Over 2025–2027 × 11 event types at hour 9, the reviewed migration records 1,662 scores and 652 classifications changing. 231 not_recommended events become recommended; seven recommended events become not_recommended. See [migration report](xieji-vol10-scoring-migration.md) and its counters/witnesses for the complete breakdown.

## Tests and isolation

- Migration proof loads ON and OFF modules explicitly. The OFF comparison no longer depends on the production default. It still proves all 1,095 dates, 32 activities and 11 event types, unchanged unrelated contributions/百忌日/土王用事, preserved hard warnings and zero undetermined event items.
- Historical 修倉庫, Thiên Đức, hard-warning, 甲日/乙日 and 土王用事 migration/Golden files pin the later flag OFF on both sides. This preserves the exact historical migration contract without changing their independent fixtures. Other current runtime tests use ON.
- Diagnostics assert that added `xieji10:` penalties have their own 卷十 source quote/version/avoid verdict rather than a 卷十一 activity mapping. Existing audited-row assertions remain unchanged.
- `xiejiVol10Activation.test.ts` uses the real ON manifest to verify all 21 observed event transition witnesses. These are integration witnesses, not independent Golden. It also asserts the intended 月破/月厭 smoke entries and disabled mansion scoring.
- `e2e/xieji-vol10-activation.spec.ts` saves a temporary browser-only birth profile, selects Cưới hỏi through the rendered UI (its event does not expose a time field), and checks the rendered verdict on three dates: 2025-01-21 (Thuận lợi), 2025-03-17 (卯月 月破), 2025-12-09 (子月 月厭). Screenshots are retained in Playwright output.

## Validation

- Typecheck/lint passed.
- Full ON suite: 156 files / 2,927 tests passed. The first run found the legacy diagnostic assertion that assumed every Trực row came from 卷十一; the new 卷十 row assertion resolves that mismatch.
- Serial mutations: annual directions 7/7, mansion content 9/9 killed. Source restored before E2E build.
- Graph updated AST-only; generated graph changes stay outside the PR.
- ON build/device E2E: existing suite desktop 104/16 skipped, mobile Pixel 7 119/1 skipped, desktop Safari WebKit 88/32 skipped. All nine new release smoke cases passed on a focused rerun after fixing test navigation (the initial test incorrectly looked for a time field and assumed the wedding button was never collapsed). Combined: 320 passed / 49 skipped; no product code changed between these runs.
- Explicit ON/OFF migration rerun produces counters identical to readiness PR #31 (ignoring only the trailing newline).
- iPhone/Firefox/emulator and production browser smoke are not part of these completed local gates. No backend/Auth/Firestore changes.

## Release and rollback

After review, merge readiness PR #31 first, retarget the activation PR to main, and merge/deploy only with owner authorization. Build on the merged main tree, deploy Firebase Hosting manually while GitHub Actions billing remains unavailable, verify the actual deployed bundle matches the local ON bundle, then smoke the three dates above on production. Do not call local tests CI green.

Rollback is a separate change restoring `xiejiVol10Scoring` to false, followed by rebuilding and redeploying. Prefer flipping the policy alone so the explicit ON/OFF migration proof and historical isolation remain available; full-suite ON-default assertions must be treated as activation checks rather than edited Golden. Rollback production smoke must match the readiness OFF path.

## Remaining scope limitations

The general 吉凶 balancing rules, unencoded 開倉庫出貨財 exception, warehouse co-presence condition, dormant/legacy god audits, 土王用事 source-dependent conventions and second expert interpretation review remain unresolved. Activating this reviewed six-chain subset does not certify them. No astronomy authority is reopened.
