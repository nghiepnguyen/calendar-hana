# P4 score Golden v3 (G1-b Stage 2, `canonical-v1`)

Successor to [v2](../p4-score-golden-v2/README.md). v2 stays unchanged and sha-locked. It is the evidence for the `source-key-v1` rollback. v3 is the forward evidence for `manifest.policies.p4ScoreHeadingLookup = "canonical-v1"`.

The frozen spec is [`p4-g1b-score-lookup.md`](../../../p4-g1b-score-lookup.md) §4.3. The authority is [G1-a](../../../p4-g1a-demolition-authority.md).

- **Generate / verify:** `python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v3/golden.py [--write]`
- **Gate:** `shared/lunar/p4ScoreGoldenV3.test.ts`. `P4_SCORE_ADAPTER_FULL=1` runs all 1,098 dates; otherwise every 10th date plus the 3 outside dates.

## Method

- `golden.py` loads the frozen v2 `golden.py` unchanged; its sha is asserted.
- It folds only the heading lookup key, using the single G1-a alias 破屋壞垣 → 破屋壊垣. The alias is written in the file, not read from TS.
- Each activity gets a view keyed by its 卷十一 source spelling, so `deciding_heading` and `policy_rows` keep 破屋壞垣, as at runtime.
- A drift guard asserts three things:
  - the alias is the only fold;
  - its source key is not a P4 heading;
  - every folded activity heading is a P4 heading.
- G2 (劵→券) is not folded.

## Files

| File | Content |
|---|---|
| `activity-states.tsv` | Layer B: 1,095 P4 dates + 3 outside dates × 29 heading activities |
| `activity-scores.tsv` | Layer C: score, status and hard warning for 1,095 P4 dates × 32 activities |

There is no layer A. The v2 `cases.json` has no demolition case and still holds under `canonical-v1`.

## Cross-check (when authored, not part of the lock)

- **Fold emptied:** v3 reproduces v2 layers B and C byte for byte.
- **Fold applied:** 353 layer-C rows differ from v2, all of them `demolition`.

| Change | Rows |
|---|---|
| Score | 320 (223 lower, 97 higher) |
| Status | 337 |
| Hard warning | 0 |

These counts equal the frozen envelope (spec §6).

The five owner witnesses are 2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02 and 2027-07-28. Each goes from `baseline 35 watch` to `only_ji 20 avoid`.

## Limits

- **Inputs:** v3 reuses v2's inputs. That covers the frozen engine presence and the flag-OFF baseline v1 for baseline rows.
- **Production config:** like v2, v3 is not the whole production configuration. The gate pins `tiangouYinNoYi` and `satChuNgocHapStars` off, exactly as the v2 almanac gate does.
