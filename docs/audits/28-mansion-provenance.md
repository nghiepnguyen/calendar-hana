# 28 Mansion provenance audit

Status: **absolute phase supported by independent dated witnesses**  
Scope: Phase 4A.1–4A.3B  
Production behavior changed: **no**

## Production implementation

`shared/lunar/mansions.ts` currently computes the daily mansion as:

```ts
index = (((jd + 11) % 28) + 28) % 28
```

The original repository comment documented the modern anchor `2026-09-25 = Ngưu` and spot checks against licham.vn.

## Classical rule

`欽定協紀辨方書`, section `二十八宿配日`, records:

- 60 sexagenary days and 28 mansions meet after 420 days.
- Therefore the scheme has seven 60-day yuan (七元).
- The mansion on 甲子 for yuan 1..7 is respectively:
  `虛 → 奎 → 畢 → 鬼 → 翼 → 氐 → 箕`.
- After yuan 7 the sequence repeats.
- The text says the original calendar date on which first-yuan 甲子 began cannot be recovered (`一元起於何年月日，則不可得而考`).

Primary/reference witnesses:

1. Wikisource, Siku Quanshu edition, `欽定協紀辨方書`, vol. 1, `二十八宿配日`: https://zh.wikisource.org/zh-hant/%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B701
2. National Library of China scan of `欽定協紀辨方書`, book 1: https://upload.wikimedia.org/wikipedia/commons/0/04/NLC892-GBZX0301011955-284762_%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%E4%B8%89%E5%8D%81%E5%85%AD%E5%8D%B7_%E7%AC%AC1%E5%86%8A.pdf

## 4A.2 — Re-derived 七元 rule

Using production mansion ordering (`Giác=0 ... Chẩn=27`):

- 虛 = 10
- 奎 = 14
- 畢 = 18
- 鬼 = 22
- 翼 = 26
- 氐 = 2
- 箕 = 6

A 60-day yuan advances the mansion by `60 mod 28 = 4` positions:

```text
10 → 14 → 18 → 22 → 26 → 2 → 6 → 10
虛    奎    畢    鬼    翼    氐   箕    虛
```

Thus 七元 is algebraically the same relative sequence as advancing one mansion per civil day modulo 28. It does not require a discontinuity every 60 or 420 days.

## 4A.3 — Current `JD + 11`

### Relative algorithm

Once an absolute phase is fixed, continuous `JD mod 28` and 七元 generate the same sequence indefinitely. Any disagreement is therefore an absolute phase offset, not a periodic 七元 error.

### Classical limitation

`協紀辨方書` cannot by itself derive an absolute Gregorian/JD anchor because it explicitly says the original first-yuan date is unknown. Constructing an oracle from this text while importing production's anchor would be circular.

## 4A.3B — independent absolute-phase witnesses

The phase was therefore checked against dated witnesses independent of the original licham.vn anchor.

### Historical witness — 1853

Luo Ergang's study of the Taiping calendar records the correspondence:

```text
咸豐二年 十二月廿七日 / 太平天國 癸好三年正月初一
Gregorian: 1853-02-04
sexagenary day: 壬寅
mansion: 牛
```

The production formula gives Gregorian JDN `2397889`; `(2397889 + 11) mod 28 = 8`, and production index 8 is `Ngưu / 牛`. **MATCH**.

The study also discusses surviving Southern Song calendar evidence (嘉定 1218 and 寶祐 1256), demonstrating that the daily-mansion sequence was actually printed in historical calendars rather than being only a modern web convention.

Reference: Luo Ergang, `太平天國史考證集` / discussion of 天曆 and 二十八宿, digitized NLC copy: https://upload.wikimedia.org/wikipedia/commons/9/91/NLC511-027032013013758-17436_%E5%A4%AA%E5%B9%B3%E5%A4%A9%E5%9C%8B%E5%8F%B2%E8%80%83%E8%AD%89%E9%9B%86.pdf

### Modern independent Japanese-calendar witnesses

Two Japanese calendar sources independently print:

```text
2025-01-01 => 参 / Sâm
2026-09-25 => 牛 / Ngưu
```

Production gives the same results. These sources are useful as cross-tradition modern confirmation; they are not treated as the historical authority.

References:

- 日本暦, 2025-01-01: https://nihonkoyomi.com/2025/1/1/
- 桜しろぽ暦, 2026-09-25: https://shiropo.com/koyomi/2026-09-25/
- KOYOMI NOTE also independently lists 2026-09-25 as 牛宿: https://koyominote.com/post/calendar-day/?date=2026-09-25

## Decision after 4A.3B

No evidence was found for a phase offset. The historical 1853 witness and modern independent Japanese witnesses all imply the same phase as production `JD + 11`.

Classify:

```text
relative daily cycle .......... SOURCE-SUPPORTED
420-day / 七元 structure ...... SOURCE-SUPPORTED
absolute JD phase ............. SOURCE-SUPPORTED BY DATED WITNESSES
JD + 11 ....................... KEEP
2026-09-25 = Ngưu ............. CORROBORATED, no longer sole anchor
宜/忌 text .................... NOT_AUDITED
production scoring ............ KEEP INFORMATIONAL (scoreDelta=0)
```

This supports retaining `getMansion()` unchanged. It does **not** yet certify mansion element/animal mappings, `isGood`, `shouldDo`, `shouldAvoid`, special exceptions, or activity scoring.

## Next gate — 4A.5–4A.6 content provenance

Audit separately:

1. canonical 28 mansion names/order;
2. element / animal associations;
3. whether a binary `isGood` is source-faithful or an oversimplification;
4. each `shouldDo` / `shouldAvoid` phrase against the selected source tradition;
5. exception rules and scope (travel vs water travel, burial vs grave repair, etc.).

Until this content audit is complete, `audited-mansion-evidence.json` remains `not_audited` and mansion evidence remains informational with `scoreDelta=0`.
