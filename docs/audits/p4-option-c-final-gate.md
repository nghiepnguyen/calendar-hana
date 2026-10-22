# Option C final gate (audit only)

2026-10-22, branch `claude/option-c-final-gate`, parent `3e1c784`. Nothing in production changes: no code, JSON, flag, adapter revision or Golden. Earlier audit commits are untouched.

Artifacts are in `sources/p4-vol10/option-c-final-gate-v1/`:

| File | Contents |
|---|---|
| `owner-ruling.json` | the owner ruling below |
| `de-sensitivity.json` | per-date D-A/D-B differences |
| `gate.json` | summary |
| `lock.json` | hashes of the above |

The harness is `p4ChouBingyinDeGate.test.ts` (`GATE_FULL=1`).

## Owner ruling, recorded (未-戊申 納財)

`OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS`.

- **Scope: local.** It covers 未-戊申 納財 only. It is not a general policy that source prose outranks 月表.
- **Decision:** keep the source-derived P17-A table. The five 未-戊申 cells (finance, contract, transaction, opening, business) stay blank.
- **The disputed 納財 cell is not SOURCE_WITNESSED.**
- **Contradiction kept in provenance:** page `06067694-n117` prints 納財 on the 忌 line. No coherent rule tested in [the 納財 audit](p4-weishen-nacai-puzhu21.md) reproduces {納財 noted 忌, 開市 unnoted}.

## 丑-丙寅 printed 月德: D-A vs D-B

The two readings:

- **D-A:** calculated presence. 丑月's 月德 falls on 庚, so 丑-丙寅 has no 德. 劫煞 takes the `cancel_both` branch, and the Option C cells apply (P17-A).
- **D-B:** the printed 月德 is honoured. 劫煞 then falls under 「辰戌丑未月值除日相日與天德月德天德合月德合併止忌安撫邊境選將訓兵出師求醫療病餘皆不忌」, and only those affairs are avoided. Among the 24 activities that is medical.

D-B is emulated on the 劫煞 verdict only. 月德's own scoring elsewhere is outside the migration.

Result over all 99 scope dates (1900–2100; none fall in 2025–2027, so the P4 layer is not involved):

| | D-A | D-B | Differences |
|---|---|---|---|
| Table cells | construction avoid, warehouse avoid, medical avoid, 21 blank | medical avoid, 23 blank | **2 cells: construction, warehouse** |
| Activity verdicts | | | 198 rows (2 × 99) |
| Scores | | | +15 on all 198 (D-B is milder) |
| Ratings | | | avoid→watch 61 + 61, watch→neutral 38 + 38 |
| Events | | | 0 |

**Classification: VALUE_AFFECTING_SCOPE_UNCERTAINTY. The gate fails, so this audit stops.**

The page cannot decide between the two:

- construction comes from 營建宮室, which has no 月表 term;
- warehouse comes from 修倉庫, which n75 prints under both readings, because 天賊 「與德合併猶忌」 keeps it.

Following the task, the reason for the 月德 discrepancy was not investigated further.

## Gate

| Open item | CAN_CHANGE_OPTION_C_TABLE |
|---|---|
| F1 | NO |
| puzhu:17 second clause | NO |
| puzhu:06 Q4 | NO |
| scope label SPEC_GAP | NO |
| medical adapter anomaly | NO |
| 未-戊申 witness conflict | NO (settled by the owner ruling) |
| **丑-丙寅 月德** | **YES: 2 cells (construction, warehouse), 99 dates** |

The four results:

- **F2_TABLE = PARTIAL.**
- **VOL10_OPTION_C = MORE_EVIDENCE_REQUIRED.**
- **P4 = MORE_EVIDENCE_REQUIRED.**
- **No candidate authority was generated.**

## What closes the gate

Any one of the following is enough:

1. **Owner ruling for D-A.** Calculated 德 presence governs the scope, and the printed 月德 is a witness anomaly. The table stays at 384 cells with 177 avoid.
2. **Owner ruling for D-B.** 丑-丙寅 leaves the `cancel_both` scope. Option C then has 15 contexts and 360 cells; 丑-丙寅 falls back to the 德 clause, with medical only.
3. **Evidence.** The 月德 source table (卷四 / 考原) or another witness of the 丑-丙寅 page.
