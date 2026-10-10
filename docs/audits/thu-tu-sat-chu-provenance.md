# Phase 5 — Thụ Tử / Sát Chủ provenance audit

Status: **IN PROGRESS — Thụ Tử source-locked; Sát Chủ remains source-dependent**

> **Update 2026-10-10:** the calendar Sát Chủ months 7/8 were aligned to the Hán-văn verse (7 Hợi, 8 Sửu) after a printed witness was found; see `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md`. The month table below is the pre-update record. Sát Chủ stays `SOURCE_DEPENDENT`; leap-month semantics stay unresolved.

## Scope

Audit two current legacy hung-star identities independently:

- `Thụ Tử` / 受死
- `Sát Chủ` (Vietnamese folk almanac rule; often described as Sát Chủ Âm)

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

## Thụ Tử / 受死 — source locked

A classical Chinese text witness, `六壬大全` 卷十九, gives the exact 12-row 受死 sequence:

`正月戌、二月辰、三月亥、四月巳、五月子、六月午、七月丑、八月未、九月寅、十月申、十一月卯、十二月酉`.

This exactly matches the 12 legacy branch values.

Independent modern calendrical descriptions of 受死 explicitly define the month as **節切り / solar-term month** and give the same branch sequence from 寅月 through 丑月. The admitted authority is therefore:

- authority: `thu-tu-authority-v1`
- day operand: `DAY_BRANCH`
- month operand: `MONTH_JIAN_BRANCH`
- boundary: `EXACT_JIE_INSTANT`
- civil-day presentation: project `solarTermMonthChi(jd)` convention
- leap-month semantics: none; lunar leap month is not an operand
- status: `SOURCE_LOCKED`
- global score: forbidden

Independent Golden, authority API, production migration, exact-Jie gate, mutation gate and migration/regression gates are now implemented on this audit branch.

## Sát Chủ — Vietnamese source-dependent rule

### What the current evidence supports

The production sequence is not an accidental inference from `licham.vn`: it is a recognizable Vietnamese folk-almanac sequence. Multiple modern Vietnamese descriptions publish the same twelve day branches for a rule they call **Sát Chủ Âm**:

`Tỵ, Tý, Mùi, Mão, Thân, Tuất, Sửu, Hợi, Ngọ, Dậu, Dần, Thìn`.

A commonly transmitted mnemonic is represented in modern sources as the sequence:

`Giêng rắn; hai chuột; ba dê; bốn mèo; năm khỉ; sáu chó; bảy trâu; tám heo; chín ngựa; mười gà; mười một hổ; chạp rồng.`

This is strong enough to identify the **tradition and table identity**, but not strong enough to promote it to primary/classical authority.

### Month operand

The Vietnamese sources located in this audit explicitly describe the lookup as **tháng âm lịch + Địa Chi ngày**. This agrees with current production behavior and differs from the Month-Jian source lock established for 受死.

Working classification:

- tradition: `VIETNAMESE_FOLK_ALMANAC / SAT_CHU_AM`
- day operand: `DAY_BRANCH`
- month operand: `LUNAR_MONTH`
- current 12-row table: corroborated by multiple secondary Vietnamese sources
- leap-month semantics: **UNRESOLVED** — do not infer reuse merely from the generic legacy engine
- primary classical provenance: **NOT ESTABLISHED**
- status: `SOURCE_DEPENDENT`
- production migration: **BLOCKED**
- global score: forbidden

### Conflicting variants are real

The web audit also found incompatible modern tables under the same broad label `Sát Chủ`:

- some sources distinguish **Sát Chủ Âm** from **Sát Chủ Dương**, with a completely different Dương table;
- another modern source publishes a Tứ Chính-style cycle instead of the production sequence;
- at least one source gives a first-month Sát Chủ Âm row inconsistent with the otherwise common Tỵ sequence.

Therefore `Sát Chủ` must not be normalized by name alone. Any future authority record must encode the tradition explicitly; a Dương rule or another regional/school variant is a separate identity, not a correction to this table.

### Source assessment

Evidence gathered in this audit:

1. `tierra.vn` — secondary modern Vietnamese description. Explicitly calls the table Sát Chủ Âm, uses lunar months and gives the production sequence.
2. `thanhhungvn.vn` — secondary modern Vietnamese description. Gives the mnemonic and the same production sequence, explicitly as lunar-month lookup.
3. `chonngaylanh.com` — secondary modern discussion. States that Sát Chủ tables have variants and should not be treated as a single uncontested authority.
4. `licham.net/phuong-phap-tinh` — project-relevant modern almanac methodology page identifies Sát Chủ among Vietnamese folk taboo-day rules, but the search evidence available in this audit does not expose a primary textual witness for the twelve-row table.

These are **secondary evidence only**. No located source is sufficient to label the table `PRIMARY`.

## Recommendation semantics

Do not introduce a global additive score.

Current Vietnamese secondary descriptions treat:

- Thụ Tử: broadly bad, with a hunting exception reported by Ngọc Hạp-derived secondary material.
- Sát Chủ Âm: broadly bad / bách kỵ, especially for major undertakings in modern folk descriptions.

These activity meanings remain `SECONDARY`. Future handling must flow through activity evidence and conflict resolution rather than `scoreDelta`.

## Phase 5 gates

1. Inventory current production behavior. **DONE**
2. Thụ Tử provenance and operand source lock. **DONE**
3. Thụ Tử independent Golden. **DONE**
4. Thụ Tử production migration. **DONE**
5. Thụ Tử exact-Jie / mutation / migration / regression gates. **DONE**
6. Sát Chủ tradition identification. **DONE — Vietnamese Sát Chủ Âm, secondary evidence**
7. Sát Chủ primary provenance. **UNRESOLVED**
8. Sát Chủ leap-month semantics. **UNRESOLVED**
9. Sát Chủ production migration. **BLOCKED — preserve legacy behavior**
10. CI desktop gate. **PASS on branch before this documentation update; re-check current run**
11. E2E/visual classification and deploy/close after the accepted Phase 5 scope is finalized.

## Phase 5 closure decision

Phase 5 may close with an explicit split outcome:

- **Thụ Tử: SOURCE_LOCKED and migrated.**
- **Sát Chủ: SOURCE_DEPENDENT and intentionally preserved as legacy lunar-month behavior.**

Do not delay later calendar primitives by pretending an unavailable primary source exists. Reopen Sát Chủ only when a traceable historical/printed Vietnamese source establishes the exact table and leap-month convention.

## Safety rule

Thụ Tử and Sát Chủ must remain separate authority records. A source lock for one must never be used to infer the other. In particular, never convert Sát Chủ to Month Jian merely because Thụ Tử uses Month Jian.
