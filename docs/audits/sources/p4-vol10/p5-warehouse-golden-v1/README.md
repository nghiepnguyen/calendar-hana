# P5 warehouse Golden v1 (task 3.0)

Status: **HASH_LOCKED_PRE_IMPLEMENTATION**, audit-only. Frozen before any P5 predicate code. Authority [`p5-warehouse-v1`](../p5-warehouse-authority-v1/README.md), owner decision D.

- Index: [`shared/almanac-data/golden-p5-warehouse-v1.json`](../../../../../shared/almanac-data/golden-p5-warehouse-v1.json) pins four blocks by SHA-256 and count (2,718 records).
- Generator: [`derive.py`](derive.py), standard-library Python. It imports no resolver, composer, provider or TypeScript code. `python3 -I …/derive.py` rederives everything and fails on any byte difference; `--write` regenerates.
- [`lock.json`](lock.json) locks the outputs, the generator and every input. Gate: [`shared/lunar/p4WarehouseGolden.test.ts`](../../../../../shared/lunar/p4WarehouseGolden.test.ts), named `p4*` so the CI path gate runs it.

## Inputs

- God tables are literal, and each one is checked verbatim against the locked raw volume ([`source-basis.json`](source-basis.json) gives the volume and code-point offset):
  - 卷五: 天德, 天德合, 月德, 月德合, 天赦, 天願, 月恩, 四相, 時德, 母倉.
  - 卷六: 三合, 六合, 五富, 天倉, 月煞/月虛.
  - 卷四: 月厭.
  - 卷十: puzhu:22, puzhu:28, 百忌 甲日.
- Dated inputs come from the frozen P4-C block `yi-domains-v1/expected.tsv`, rows `MU_CANG_DATED_1095`: Month Jian, pillar, soil and 母倉. The Golden recomputes 母倉 and must equal that block.
- For the 20 Jie days, Month Jian follows the calendar day, as the product does. This is the frozen P4-C `CONVENTION_DIFFERENCE` in `yi-dated-inputs-v1/jie-convention.json`; 母倉 on those days is its `calendarDayMuCang`.
- Normalizations, NAMING_ONLY:
  - 巳 in a stem slot is read as 己 (天德合 六月, 月德合 二六十月, 月恩 四月, 四相 夏).
  - 徳/夘/虚 are read as 德/卯/虛.
- Conventions:
  - Seasons go by Month Jian.
  - Trigram 天德 months (坤乾艮巽) fall on no day, the same as the 4D Cat Hung table.
  - 天願 uses 起例: the 協紀 按 rejects the 歴例 list as a copying error.
  - puzhu:28 reads 未 甲子 as 甲午, from the owner print correction of 2026-10-12.

## Semantics

- Presence: true, false or null (unknown).
- Each reading is Kleene `base AND ANY(partners)`.
- D per base and the 修倉庫 heading are the outcome over every completion of the unknown operands. If all completions agree, that outcome is expected; otherwise the expected value is `unknown`. This matches the FR-04 order (direct → agreed → unknown → SOURCE_DEPENDENT → no 宜).
- **Owner 2026-10-16:** an unknown base whose partners are all known absent gives no 宜. Authority v1 says "or the base is unknown"; the owner read it this way, and the authority bytes are unchanged.
- 收日+開日 or 天倉+時德 both present gives `IMPOSSIBLE_CO_PRESENCE`.
- 開倉庫出貨財 宜 is Kleene ANY(月恩 四相 時德 滿日 五富).

## Blocks

| Block | Content | Count |
|---|---|---|
| `expected.json` fixtures (3.1) | base-only 5, partner-only 5, direct 10, single partner 23, multi partner 100, impossible 2, multi base 3, unknown 9, 母倉 outside coverage 4, separate headings 6 | 167 |
| `expected.json` propagation (3.3) | puzhu:22 `requireAll` × 甲日 專忌 × puzhu:28; `kaiJi` true = 忌 must stay, false = 諸事不忌, null = ordinary 忌 composition decides | 16 |
| `context.tsv` (3.2) | 12 Month Jian × 60 pillars × soil absent/present: all 17 gods plus 月煞, 月厭, 甲日, puzhu:28; D per base, 修倉庫, 開倉庫 宜, 專忌 kept | 1,440 |
| `dated.tsv` (3.2/3.3) | the 1,095 sweep dates, same columns | 1,095 |

Every base × partner subset is covered except the two impossible pairs, so every R10/R11 split appears. Results on 2025–2027 ([`summary.json`](summary.json)):

- 修倉庫: 宜 588, no 宜 506, SOURCE_DEPENDENT 1 (2025-10-08 戌庚戌: 母倉 + 月恩).
- 開倉庫 宜: 454.
- 甲日: 110, of which 106 keep 專忌; the other 4 are puzhu:28 days.
- 月煞 present on 91 dates, 月厭 on 90; task 5.2 checks their effect.

## Validation (after the expected values are written)

[`validation.json`](validation.json):

- **Engine baseline.** The expected values were compared with `p5-warehouse-baseline-v1/baseline.tsv` on 1,095 dates: 17 gods, 開倉庫 宜, and 甲日 專忌. There are 0 mismatches. The first run found 82; they were classified before freezing:
  - **GOLDEN_BUG:** 天願 came from the 歴例 list. It now uses 起例 with the 按 quote, which is a source reading, not an engine copy.
  - **CONVENTION_DIFFERENCE:** the Jie days took noon Month Jian. They now use the frozen calendar-day rows.
- **Prior locks.** 1,287 entries in 58 P4 locks keep their bytes. The `yi-propagation-v1/superseded-draft` lock is skipped and listed: its files were replaced on purpose.

## Limits

- Single-agent derivation and review (Claude); no independent second review.
- 3.3 covers 宜, `requireAll`, 專忌 and puzhu:28 only. The 德猶忌 / 從忌不從宜 suppression and the effect of 月煞/月厭 belong to the P4-B 忌 composition; task 5.2 verifies them against these presence columns.
- 母倉 outside coverage is tested on abstract fixtures only; there are no dated inputs beyond 2027.
