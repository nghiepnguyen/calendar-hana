# Phase 5 — Thụ Tử / Sát Chủ provenance audit

Status: **IN PROGRESS — do not migrate production yet**

## Scope

Audit two current legacy hung-star identities independently:

- `Thụ Tử` / 受死
- `Sát Chủ`

The goal is to source-lock the month operand, day operand, boundary semantics, activity meaning, and tradition before any production migration.

## Current production state

`shared/lunar/stars.data.ts` is a legacy table generated primarily from 2025–2026 `licham.vn` observations. Its generic `byMonth` engine means **lunar month**, including leap month reuse. This is evidence of current behavior, not authority.

Current legacy rows:

| Lunar month | Thụ Tử day branch | Sát Chủ day branch |
| --- | --- | --- |
| 1 | Tuất | Tỵ |
| 2 | Thìn | Tý |
| 3 | Hợi | Mùi |
| 4 | Tỵ | Mão |
| 5 | Tý | Thân |
| 6 | Ngọ | Tuất |
| 7 | Sửu | Sửu |
| 8 | Mùi | Hợi |
| 9 | Dần | Ngọ |
| 10 | Thân | Dậu |
| 11 | Mão | Dần |
| 12 | Dậu | Thìn |

Do not infer from this table that both stars use the same month basis.

## Thụ Tử / 受死 — first source lock

A classical Chinese text witness, `六壬大全` 卷十九, gives the exact 12-row 受死 sequence:

`正月戌、二月辰、三月亥、四月巳、五月子、六月午、七月丑、八月未、九月寅、十月申、十一月卯、十二月酉`.

This exactly matches the 12 legacy branch values.

Independent modern calendrical descriptions of 受死 explicitly define the month as **節切り / solar-term month** and give the same branch sequence from 寅月 through 丑月. Therefore the working authority classification is:

- day operand: `DAY_BRANCH`
- month operand: `MONTH_JIAN_BRANCH`
- boundary: `EXACT_JIE_INSTANT`
- civil-day presentation: must follow the project's existing `solarTermMonthChi(jd)` convention
- leap-month semantics: none; lunar leap month is not an operand
- status: `SOURCE_LOCK_CANDIDATE`

Before production migration, freeze an independent Golden and test exact Jie boundaries using the existing astronomy authority.

## Sát Chủ — NOT source-locked

The current Vietnamese legacy sequence is:

`Tỵ, Tý, Mùi, Mão, Thân, Tuất, Sửu, Hợi, Ngọ, Dậu, Dần, Thìn`.

At this stage we have **not established a primary classical source that proves**:

1. which historical `Sát Chủ` tradition this sequence belongs to;
2. whether its month operand is lunar month or Month Jian;
3. whether leap months reuse the numbered lunar month;
4. whether `Sát Chủ` here is equivalent to similarly named Chinese sha-day systems.

Therefore:

- status: `SOURCE_DEPENDENT`
- production migration: **BLOCKED**
- no silent conversion to Month Jian
- no Golden may be labeled primary-authority until provenance is established

## Recommendation semantics

Do not introduce a global additive score.

Current Vietnamese secondary descriptions treat:

- Thụ Tử: broadly bad, with a hunting exception reported by Ngọc Hạp-derived secondary material.
- Sát Chủ: broadly bad / bách kỵ in modern Vietnamese almanac descriptions.

These meanings remain `SECONDARY` until source-locked. Future handling must flow through activity evidence and conflict resolution rather than `scoreDelta`.

## Phase 5 gates

1. Inventory current production behavior. **DONE**
2. Source provenance: Thụ Tử candidate identified; Sát Chủ unresolved. **IN PROGRESS**
3. Operand classification. **PARTIAL**
4. Independent Golden. **NEXT — Thụ Tử only**
5. Production migration. **BLOCKED until Golden**
6. Mutation gate.
7. Historical regression / migration classifier.
8. E2E / visual / CI.
9. Deploy and close.

## Safety rule

Thụ Tử and Sát Chủ must remain separate authority records. A source lock for one must never be used to infer the other.
