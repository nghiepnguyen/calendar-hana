# F1 Stage 3: R2 production migration (五離 × 立券交易)

2026-10-26. Branch `claude/f1-r2-migration`, cut from F1 Stage 2 `2e3f50a`.

The owner approved R2 on 2026-10-26, and it is recorded in `sources/p4-vol10/f1-wuli-lijuan-stage3/owner-ruling.json`. Production now imports puzhu:06 authority **v4**. v3 is kept as the rollback.

## 1. Owner ruling (frozen first, commit `d74eb23`)

| Field | Value |
|---|---|
| Decision | `R2_APPROVED`, 2026-10-26 |
| Scope | 五離 × 立券交易 × puzhu:06 Q4 lifting only |
| Rule | A generic puzhu:06 trigger (天願, 月恩, 四相, 時德) does not lift 五離's 忌. 五離's own lifters (天德 月德 天德合 月德合 天赦; 三合 六合 are not puzhu:06 triggers) stay authoritative. An independent 宜 does not suppress the surviving 五離 忌. |
| Directly witness-shaped | 6 heading rows on 戌-壬申 and 戌-庚申 (06067696-n14, -n62) |
| Semantic extrapolation | 4 heading rows on 丑-甲申 and 午-戊申, where 立券交易 has its own 宜. These are an owner-approved consequence of the same rule and are **not** SOURCE_WITNESSED. |
| Intermediate only | 未-戊申: 2 puzhu:06 decisions change, the final state does not |
| Excluded | 九空, 五虛, 小耗, 五墓; the headings 開市, 納財, 安牀 and 開倉庫出貨財 |

## 2. Implementation (commit `56d19a2`)

| | |
|---|---|
| Old model | `shared/almanac-data/p4b-puzhu06-v3.json` (owner Q4 lifts 五離); kept byte-identical |
| New model | `shared/almanac-data/p4b-puzhu06-v4.json` (`e5e54f5c…`), built by `p4b-puzhu06-authority-v4/build.py` with a lock and validation |
| Mechanism | `liftExclusions.五離 = {triggers: [天願, 月恩, 四相, 時德], basis: 卷十 offset 19501 「與天德月德天德合月德合天赦三合六合併則不忌」}` |
| Production import | `shared/lunar/p4Puzhu06.ts`: `p4b-puzhu06-v3.json` → `p4b-puzhu06-v4.json`. It also exports `P4_PUZHU06_AUTHORITY_ID`. |
| Code paths | No new branch. `classify()` already maps an excluded trigger set to `QL_EXCLUDED` (keep), as Q4a does for 五墓. |

### How v4 was built and checked

- The exclusion list is **computed**: the puzhu:06 triggers whose names are absent from the quoted 五離 clause. The builder stops unless the result is exactly 天願, 月恩, 四相 and 時德.
- Against v3, only these fields change: `version`, `parent`, `liftExclusions` (+五離), `ownerDecision.answers.R2` and the `QL_EXCLUDED` basis text. This is asserted in `validation.json` and in `p4Puzhu06AuthorityV4.test.ts`.
- 五離's 忌 list intersects the puzhu:06 headings only at 立券交易. That is why the god-level exclusion is exactly the heading-level ruling.

### Comment correction

The doc comment in `p4Puzhu06.ts` used to say "Not imported by the production pipeline". It now reads: production reaches the layer through p4OwnerRules in the P4 domain.

## 3. Direct witnesses (shipped)

| Witness | Date | 立券交易 row | puzhu:06 | Rollback (v3) |
|---|---|---|---|---|
| n14, 戌-壬申 (四相) | 2025-10-30 | `only_ji`, 忌 from [五離] | `keep:QL_EXCLUDED` | `lift:QL`, not_recorded |
| n62, 戌-庚申 (月恩) | 2025-10-18 | `only_ji`, 忌 from [五離] | `keep:QL_EXCLUDED` | `lift:QL`, not_recorded |

## 4. Impact, recomputed from the shipped code

`F1S3_DUMP=1 vitest run shared/lunar/p4F1R2Migration.test.ts` compares rollback with shipped on every day of 2025–2027 and writes `migration-diff.json` (`5b7f3a77…`).

The decision, activity and event lists are **identical** to the Stage 2 `impact.json`, which was measured before any Stage 3 code. The heading lists match field for field; only Stage 2's extra owner-row fields are dropped.

| Measure | Count |
|---|---|
| puzhu:06 decisions | 19: 12 lift → keep, plus 7 tag-only (`…QL` → `…QL_EXCLUDED` on rows already kept by AN or ZHUSHI) |
| Heading rows | 10, all 立券交易: 6 `not_recorded → only_ji`, 4 `only_yi → both_present` |
| Activity rows | 20, contract + transaction only; all −15. Status changes: no_evidence → watch 12, neutral → watch 6, recommended → watch 2. |
| Event records | 100 (sign_contract, buy_vehicle, buy_property, property_handover, receive_vehicle; 20 each) |
| Event classification changes | 69 |
| Event score changes | 90 |
| Hard warnings | 0 changes |

| Group | Contexts | Heading | Activity | Events |
|---|---|---|---|---|
| Direct, witness-shaped | 戌-壬申, 戌-庚申 | 6 | 12 | 60 |
| Semantic extrapolation (own 宜) | 丑-甲申, 午-戊申 | 4 | 8 | 40 |
| Intermediate only | 未-戊申 (2026-08-02, 2027-07-28) | 0 (2 decisions) | 0 | 0 |

**未-戊申.** puzhu:06 now keeps 五離. puzhu:21 (N-A) then withholds it from 納財 (`neither_recorded`), so production output on those dates is byte-identical. N-A vs N-C remains a separate debt.

## 5. Goldens

Every successor loads its predecessor generator unchanged (sha-asserted), moves exactly one input, and stops on any row outside the R2 envelope. The old Goldens are untouched.

| New | Predecessor (kept) | Generator | Moves | Diff envelope |
|---|---|---|---|---|
| puzhu:06 Golden v4: `golden-p4b-puzhu06-v4.json` (`69a38823…`) + `p4b-puzhu06-golden-v4/` | Golden v3 | `derive.py`, a copy of the v3 derive with authority, outputs and checks moved | authority v3 → v4 | `v3ToV4`: 12 rows, all 立券交易 lift → keep (QL_EXCLUDED). Its propagation replay drops the 2 v3 notes "開倉庫出貨財 propagation blocked by 開市+立券交易" on 未-戊申; that state stays `only_ji`. |
| Full Golden P4 v3: `p4-full-golden-v3/compose/` (dated `7d9094a3…`), `lock.json` | full Golden v2 | `compose.py` (loads the v2 composer, sha `e6b4dcfc…`) | puzhu:06 authority and oracle Golden v3 → v4 | `v2-diff.txt`: dated rows = 10 立券交易 state changes, 7 tag-only, 2 未-戊申 propagation notes, 2 開倉庫出貨財 `blocked` notes (state unchanged); context rows = the same classes. Anything else stops the run. |
| Score Golden v5: `p4-score-golden-v5/` (states `4b7c4d91…`, scores `d325a903…`), `lock.json` | score Golden v4 | `golden.py` (loads v4, sha `fd422cb1…`) | layer A → full Golden v3 dated | Layer B: 20 rows (contract/transaction on the 10 dates). Layer C: exactly the 20 Stage 2 activity rows, with the same old and new score and status. |

**No unexpected churn.** Nothing else moved:

- the 開市, 納財 and 安牀 rows;
- the 開倉庫出貨財 state;
- the 九空, 五虛, 小耗 and 五墓 decisions;
- G1 / G1-b;
- G2 / W1;
- aliases.

The 開倉庫出貨財 `blocked` annotation is the one audited downstream consequence. It comes from puzhu:22 「凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財」: on 未-戊申, 立券交易 is no longer unnoted by puzhu:06, so the requireAll propagation is not attempted. It does not reach the production heading output.

## 6. Regression

All of the following are checked in `p4F1R2Migration.test.ts`.

| Boundary | Witness | Result |
|---|---|---|
| 五離's own lifters | 2025-07-14 未-甲申 (天德, 月德) | Owner rows identical to the rollback; no 五離 忌 on 立券交易 |
| Other Q4 god | 2025-03-09 卯-丁丑 立券交易, lifted by 九空 under 月恩 + 四相 | Still `lift:QL`; owner rows identical to the rollback |
| Independent 宜 | 2025-01-15 丑-甲申 | `both_present`, `keep:QL_EXCLUDED` |
| G2 / W1 | 未-戊申 劫煞 × contract / transaction | `{APPLIED, blank}`, i.e. BLANK / I1 |
| Other headings and activities | the 6 test dates; the full 2025–2027 dump | Only 立券交易 headings and contract/transaction move |
| Outside 2025–2027 | 2024-11-04 and 2028-10-14 (戌-壬申) | Production snapshots identical. The owner-rules decision itself moves (the layer is date-agnostic), but P4_DOMAIN gates it out. The Stage 2 diagnostic (494 dates) stays diagnostic. |

**Mutation.** v4 with `liftExclusions.五離` deleted gives output identical to the rollback on the R2 dates. The envelope is caused by the rule, not by the file switch.

## 7. Rollback

- **Mechanism.** `shared/lunar/f1R2Rollback.ts` mocks the v4 import path with v3. After a hoisted reload, it asserts that the loaded authority id is `p4b-puzhu06-v3`.
- **Pre-R2 proofs pinned to it.** These now pass unchanged against their frozen Goldens:
  - puzhu:06 composer and sweep vs Golden v3;
  - score adapter vs Golden v2 layer C;
  - score Golden v3 and v4;
  - migration diff v1/v2 and v3;
  - owner rules vs full Golden v2;
  - the 納財 and faithful 劫煞 audit harnesses, which no longer rewrite their frozen artifacts;
  - the F1 Stage 2 harness.
- **Locks.** The 納財 lock and the F1 Stage 2 lock check their out-of-dir harnesses as committed versions (owner rule 2026-10-17, `lockAnchor.ts`).
- **Digests.** `rollback.json` records sha256 over every day snapshot (2025–2027 plus the 2 outside dates):
  - rollback v3: `2b1fc19e…`;
  - shipped v4: `0fcc1f9f…`.
- **Result:** rollback v3 reproduces the pre-migration outputs.

## 8. Gates

New:

- `p4Puzhu06AuthorityV4`, `p4Puzhu06GoldenV4`, `p4Puzhu06V4` (composer vs Golden v4, all 720 contexts and 1,095 dates);
- `p4OwnerRulesV3` (full domain under `P4_OWNER_RULES_FULL=1`);
- `p4ScoreGoldenV5` (all 1,098 under `P4_SCORE_ADAPTER_FULL=1`);
- `p4F1R2Migration`, `p4F1WuliLijuanStage3Lock`.

`ci:p4` now also runs:

- the authority v4 build;
- the Golden v4 derive;
- the full Golden v3 compose;
- the score Golden v5 generator;
- the two FULL suites above.

## 9. Open debts (unchanged)

- puzhu:21 N-A vs N-C on 未-戊申.
- Q4 authority for 九空, 五虛, 小耗 and 五墓: 56 of the 68 pre-R2 QL-lift rows; candidate pages are listed in F1 Stage 2.

## Final status

```text
F1:     MIGRATED (R2, puzhu:06 authority v4)
G2/W1:  CLOSED / UNCHANGED
```
