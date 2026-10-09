# Hoàng đạo / Hắc đạo — provenance audit

Status: **SOURCE DECISION FOUND — IMPLEMENTATION MIGRATION REQUIRED**

## Scope

Audit the current day-level Hoàng đạo / Hắc đạo rule (`getDayGod`) and determine whether its month operand is lunar month or Month Jian (solar-term/Jie month). Hour-level rules are recorded separately because they use the day branch, not a month operand.

## Current production

`shared/lunar/auspicious.ts` currently documents and implements day gods from **lunar month number**:

```ts
getDayGod(lunarMonth, dayChi)
startChi = ((lunarMonth - 1) % 6) * 2
```

`shared/lunar/index.ts` passes `lunar.month` into `getDayGod`.

The existing tests intentionally compare against modern Vietnamese calendar websites and contain discriminator dates chosen because lunar-month and solar-term-month results differ. These tests therefore lock the current convention, but they are not primary-source authority.

## Primary source

### 欽定協紀辨方書, 卷七, 黃道黒道

The source gives the 12 gods in order:

1. 青龍 — Thanh Long — good
2. 明堂 — Minh Đường — good
3. 天刑 — Thiên Hình — bad
4. 朱雀 — Chu Tước — bad
5. 金匱 — Kim Quỹ — good
6. 天德 — Thiên Đức — good
7. 白虎 — Bạch Hổ — bad
8. 玉堂 — Ngọc Đường — good
9. 天牢 — Thiên Lao — bad
10. 元武 — Huyền/Nguyên Vũ — bad
11. 司命 — Tư Mệnh — good
12. 勾陳 — Câu Trận — bad

The key rule is explicit:

> 月起日，則建寅之月，子日為青龍，丑日為明堂。

It also states the month grouping:

- 寅申 → 青龍 starts at 子
- 卯酉 → starts at 寅
- 辰戌 → starts at 辰
- 巳亥 → starts at 午
- 子午 → starts at 申
- 丑未 → starts at 戌

Most importantly, the same section explains the mechanism as applying 天罡 to **建**, and explicitly says `擇日則加月建` — for choosing the day, use **Month Jian**.

Therefore the classical rule's month operand is the **月建 / Month Jian branch**, not lunar month number.

Primary transcription:
- https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷07

Corroborating transcription:
- https://www.shidianguji.com/zh/book/SK1619/chapter/1l9llqlcqlzc3

## Authority decision

```text
rule             黃道黒道 / 12 day gods
primary source   欽定協紀辨方書 卷七〈黃道黒道〉
month operand    MONTH_JIAN_BRANCH
month boundary   exact Jie boundary under astronomy-authority-v4 / clock-v1
day operand      DAY_BRANCH
leap month       irrelevant (no lunar-month operand)
status           SOURCE_LOCKED
```

The production lunar-month implementation is therefore **not source-aligned** with the selected classical authority.

This is an authority migration, not an arithmetic bug:

```text
old convention   LUNAR_MONTH_NUMBER
new authority    MONTH_JIAN_BRANCH
classification   EXPECTED_AUTHORITY_MIGRATION_CHANGE
```

Do not preserve the old website-derived results merely because several Vietnamese calendar sites agree. Those observations may be retained as historical convention evidence, but must not override the primary-source operand.

## Canonical day rule

For Month Jian branch `monthJianBranch` and day branch `dayBranch`, the starting branch for 青龍 is:

```text
Month Jian   Thanh Long starts on
寅 / 申       子
卯 / 酉       寅
辰 / 戌       辰
巳 / 亥       午
午 / 子       申
未 / 丑       戌
```

Equivalent zero-based branch formula (Tý=0 ... Hợi=11):

```ts
startChi = ((monthJianBranch + 11) % 6) * 2
index = (dayBranch - startChi + 12) % 12
```

This preserves the 12-god order above.

## Hour rule

The same primary source says:

> 日起時，則子日申時起青龍，酉時為明堂，依次順數。

This supports the existing hour-rule structure: the hour gods are keyed by **day branch**. The current production formula should be independently checked across all six day-branch pairs, but there is no lunar-month vs Month-Jian issue for the hour rule.

## Current code findings

- `TWELVE_GODS`: structurally matches the source's good/bad sequence.
- `getDayGod(lunarMonth, dayChi)`: **operand mismatch**; currently lunar month.
- `computeDayInfo`: explicitly passes `lunar.month`; must migrate to Month Jian branch.
- `getAuspiciousHours/getHourGods`: separate day-branch rule; no month migration implied.
- Existing website comparison tests: preserve as legacy/convention observations, not authority Golden.

## Migration requirements

1. Build an independent Golden from the source table using all 12 Month Jian branches × 12 day branches.
2. Add exact-Jie discriminator fixtures: `T-1ms`, `T`, `T+1ms`; day god must switch at the same authority boundary as Month Jian.
3. Migrate `getDayGod` API to accept Month Jian branch (or a typed Month Jian value), not lunar month number.
4. Route production through the already source-locked JPL/Jie Month Jian authority. Do not derive Month Jian from lunar month.
5. Preserve old website fixtures as historical convention evidence and classify mismatches as `EXPECTED_AUTHORITY_MIGRATION_CHANGE` where applicable.
6. Add mutation killers for: lunar-month operand, off-by-one Month Jian, shifted 12-god order, inverted good/bad classification, and Jie-boundary old/new semantics.
7. Run unit, historical migration audit, E2E/visual, Actions and deploy before closing Phase 4C.

## Non-goals

- Do not change 12 Trực.
- Do not reopen astronomy-authority-v4 / clock-v1.
- Do not infer global auspiciousness or activity scoring from Hoàng/Hắc đạo alone.
- Do not source-lock unrelated Tam Nương / Nguyệt Kỵ in this phase.

## Verdict

**Primary-source audit resolves the open question: day Hoàng/Hắc đạo should use Month Jian / Jie-month authority, not lunar month. Production currently uses the wrong operand for the selected authority and requires a controlled authority migration.**
