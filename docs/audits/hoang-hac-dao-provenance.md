# Hoàng đạo / Hắc đạo — provenance audit

Status: **SOURCE-LOCKED — MIGRATION IMPLEMENTED, RELEASE GATES PENDING**

## Scope

Audit the day-level Hoàng đạo / Hắc đạo rule and determine whether its month operand is lunar month or Month Jian (solar-term/Jie month). Hour-level rules are separate because they use the day branch, not a month operand.

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

Key text: `月起日，則建寅之月，子日為青龍，丑日為明堂。` The same section explains the mechanism with 建 and states `擇日則加月建`. The selected classical authority therefore uses 月建 / Month Jian, not lunar month number.

Primary transcription:
- https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷07

Corroborating transcription:
- https://www.shidianguji.com/zh/book/SK1619/chapter/1l9llqlcqlzc3

## Authority decision

```text
rule             黃道黒道 / 12 day gods
primary source   欽定協紀辨方書 卷七〈黃道黒道〉
month operand    MONTH_JIAN_BRANCH
exact boundary   exact Jie under astronomy-authority-v4 / clock-v1
day operand      DAY_BRANCH
leap month       irrelevant
status           SOURCE_LOCKED
authority id     day-gods-authority-v1
```

Historical production used `LUNAR_MONTH_NUMBER`; this is retained only as migration evidence. Differences caused by changing that operand are `EXPECTED_AUTHORITY_MIGRATION_CHANGE`, not arithmetic regressions.

## Canonical rule

```text
Month Jian   Thanh Long starts on
寅 / 申       子
卯 / 酉       寅
辰 / 戌       辰
巳 / 亥       午
午 / 子       申
未 / 丑       戌
```

The independent Golden is `shared/lunar/audit-fixtures/day-gods-golden-v1.json`, covering all 12 Month Jian branches and deriving 144 Month-Jian × day-branch authority cells.

## Implementation

- `getDayGodByMonthJian(monthJianBranch, dayBranch)` is the canonical deterministic API.
- `getDayGodAtInstant(dateTime, timezone)` uses the existing JPL/Jie authority and switches exactly at T: `T-1ms = old`, `T = new`, `T+1ms = new`.
- `getDayInfo(date)` uses the project's existing calendar-day solar-term convention via `solarTermMonthChi(jd)`: the whole Vietnamese civil day containing a Jie crossing is presented with the new Month Jian. This is intentionally distinct from exact-instant semantics.
- Legacy `getDayGod(lunarMonth, dayBranch)` remains deprecated for historical audit/convention evidence only.
- Canonical source name `天德` is rendered `Thiên Đức`. Historical `Kim Đường` differences are `NAMING_ONLY`; good/bad classification is unchanged.

## Verification completed

- Independent authority Golden: PASS.
- 144/144 Month Jian × day branch cells: PASS.
- 12 Jie boundaries in 2026 at T-1ms/T/T+1ms: PASS.
- Full unit suite after production migration: **123 files / 2686 tests / 0 failures**.
- Historical V2.1 Golden remains immutable; naming aliases are normalized in audit rather than rewriting Golden.
- Modern website lunar-month fixtures were reclassified as legacy convention evidence and no longer override the primary source.
- Mutation gate added for representative wrong-operand/table mutations: lunar-month-style row shift, Month Jian +1, day branch +1, Thanh-Long start +2, and inverted good/bad.

## Hour rule

The same primary source says `日起時，則子日申時起青龍，酉時為明堂，依次順數。` This supports the existing hour-rule structure keyed by DAY_BRANCH. The day-level Month Jian migration does not change its operand. Canonical naming now uses Thiên Đức consistently.

## Remaining release gates

1. Run the new mutation/migration test plus the full unit suite after pulling its commit.
2. Run E2E/visual tests; update snapshots only for reviewed intentional UI text/data changes, never to hide a regression.
3. Merge to `main` only after gates pass.
4. Require GitHub Actions green and production deploy before marking Phase 4C CLOSED.

## Non-goals

- No change to 12 Trực.
- No change to astronomy-authority-v4 / clock-v1.
- No global auspiciousness/activity score inferred from Hoàng/Hắc đạo alone.
- Tam Nương / Nguyệt Kỵ are not source-locked in this phase.

## Verdict

**Hoàng/Hắc đạo day-level provenance is source-locked to Month Jian × Day Branch. The controlled production migration is implemented and unit-green. Phase 4C remains open only for the final mutation/E2E/CI/deploy release gates.**
