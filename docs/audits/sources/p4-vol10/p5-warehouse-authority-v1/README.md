# P5 warehouse authority v1 (task 2.0)

Status: **OWNER_ADOPTED_SOURCE_DEPENDENT**, audit-only, not canonical. Owner decision **D** (2026-10-16): the 修倉庫 co-presence clause gives 宜 only when the 卷十 and 卷十一 readings both give 宜. A split reading is `undetermined`, SOURCE_DEPENDENT.

- Authority: [`shared/almanac-data/p5-warehouse-v1.json`](../../../../../shared/almanac-data/p5-warehouse-v1.json).
- Builder: [`build.py`](build.py), independent Python, imports no TypeScript audit code. `python3 -I …/build.py` rebuilds and fails on any byte difference; `--write` regenerates.
- [`validation.json`](validation.json): the 160-row truth table (5 bases × 32 partner subsets), impossible co-presence on 720 contexts, and the definition quotes used for the proof.
- [`lock.json`](lock.json): SHA-256 of the raw sources, scans, authority, validation and builder. Gate: [`shared/lunar/p4WarehouseAuthority.test.ts`](../../../../../shared/lunar/p4WarehouseAuthority.test.ts) checks the lock, every quote at its code-point offset, and decision D.
- Offsets: Unicode code points, zero-based, end-exclusive. The raw sources match `yi-sources-v1/manifest.json` (SHA-1 and SHA-256). 卷十 `355dc6c8…`, 卷十一 `ce4ed7f2…`.

## 2.1 — Sources

| Clause | Source | Offset |
|---|---|---|
| 卷十一 修倉庫 宜 「…又收日母倉六合五富天倉與月徳四相時徳開日併者」 | vol11 | 5052 |
| 卷十一 開倉庫出貨財 宜 「月恩四相時徳滿日五富」 | vol11 | 5601 |
| 收日 「與月恩四相時德併宜修倉庫」 | vol10 | 5919 |
| 收日 按 「義取諸收無修造義故必與月恩四相時德併而後宜修倉庫若開日則雖宜修造不得與收日併若德合赦願則自宜修倉庫又不待與收日併也」 | vol10 | 5934 |
| 「母倉義亦如此」 | vol10 | 5994 |
| 母倉 「與月恩四相開日併宜修倉庫」 | vol10 | 2880 |
| 六合 「與月恩四相時德併宜修倉庫」 | vol10 | 6379 |
| 五富 「與月恩四相時德併宜修倉庫」 | vol10 | 6536 |
| 天倉 「與月恩四相開日併宜修倉庫」, note 「時德不得與天倉併」 | vol10 | 6626, 6652 |

Scans: the 卷十 母倉 entry (`06067686` pdf 97–98) and the 卷十一 修倉庫 heading (`06067687` pdf 39–40), both already locked in `yi-mucang-v1`, confirm 月恩 and 月德 respectively. The 收日/六合/五富/天倉 clauses are raw-only (limit).

卷十一 raw writes 徳; god names compare as 德 (NAMING_ONLY).

## 2.2 — Readings and D

| Base | R10 partners (卷十) | R11 partners (卷十一) | Agreed | R10 only | R11 only |
|---|---|---|---|---|---|
| 收日, 六合, 五富 | 月恩 四相 時德 | 月德 四相 時德 開日 | 四相 時德 | 月恩 | 月德 開日 |
| 母倉, 天倉 | 月恩 四相 開日 | 月德 四相 時德 開日 | 四相 開日 | 月恩 | 月德 時德 |

Each reading is `base AND ANY(partners)`; never ALL. Per base: agreed → 宜, both false → no 宜, split → SOURCE_DEPENDENT. A reading is unknown when no partner is present and one is unknown; D is unknown when either reading is.

Heading order: a direct god present → 宜; else a base agreed → 宜; else any direct god or base verdict unknown → unknown (it could still become 宜); else a split base → `undetermined` SOURCE_DEPENDENT; else no 宜.

Truth table: 135 agreed, 5 agreed_absent (base with no partner), 20 source_dependent. Within one base, a split needs no agreed partner present and then exactly one side: 月恩 present with no R11-only partner (R10 only), or an R11-only partner present without 月恩 (R11 only).

月德 is both a direct god and an R11 partner. When it is present the heading is 宜 through the direct path, so the clause-level split on 月德 never decides a heading.

「母倉義亦如此」 follows the 收日 commentary: a base with no 修造 meaning needs a partner. It adds no partner and changes neither reading.

## 2.3 — Direct gods

Both volumes list 修倉庫 under 天德, 月德, 天德合, 月德合 (one 卷十 entry), 天赦, 天願, 三合 and 滿日. No conflict; P5 keeps ANY.

## 2.4 — Impossible co-presence

Checked on all 12 Month Jian × 60 pillars from the source definitions alone: 12 Trực (建除滿平定執破危成收開閉), 天倉 「正月起寅逆行十二辰」 (卷六 歴例), 時德 春午 夏辰 秋子 冬寅 (卷五). Results: 收日+開日 = 0 (one Trực per day); 天倉+時德 = 0, consistent with the 卷十 note. The Golden in task 3 carries both as negative fixtures.

## Limits

- Single-agent reading (Claude); no independent second review.
- Raw-only for four base clauses (see 2.1).
- 母倉 presence stays OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027 (`p4-yi-mucang-v2`); outside that coverage it is unknown.
