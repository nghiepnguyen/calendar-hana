# 28 Mansion provenance audit

Status: **phase convention not source-locked**  
Scope: Phase 4A.1–4A.3  
Production behavior changed: **no**

## Production implementation

`shared/lunar/mansions.ts` currently computes the daily mansion as:

```ts
index = (((jd + 11) % 28) + 28) % 28
```

The phase is documented by the modern anchor `2026-09-25 = Ngưu` and spot checks against licham.vn.

## Classical rule

`欽定協紀辨方書`, section `二十八宿配日`, records:

- 60 sexagenary days and 28 mansions meet after 420 days.
- Therefore the scheme has seven 60-day yuan (七元).
- The mansion on 甲子 for yuan 1..7 is respectively:
  `虛 → 奎 → 畢 → 鬼 → 翼 → 氐 → 箕`.
- After yuan 7 the sequence repeats.
- Critically, the text also says the calendar date on which yuan 1 originally began cannot be determined (`一元起於何年月日，則不可得而考`).

Primary/reference witnesses used for this audit:

1. Chinese Text Project, `欽定協紀辨方書`, `二十八宿配日`: https://ctext.org/wiki.pl?chapter=530461&if=en&remap=gb
2. Wikisource, Siku Quanshu edition, vol. 1, `二十八宿配日`: https://zh.wikisource.org/zh-hant/%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B701

## 4A.2 — Re-derived 七元 rule

Using the production mansion ordering (`Giác=0 ... Chẩn=27`):

- 虛 = 10
- 奎 = 14
- 畢 = 18
- 鬼 = 22
- 翼 = 26
- 氐 = 2
- 箕 = 6

A 60-day yuan advances the mansion by `60 mod 28 = 4` positions. Starting at 虛 (10):

```text
10 → 14 → 18 → 22 → 26 → 2 → 6 → (after another 60 days) 10
虛    奎    畢    鬼    翼    氐   箕                         虛
```

Thus the classical 七元 rule is algebraically the same **relative cycle** as advancing one mansion per civil day modulo 28. The seven-yuan description does not introduce discontinuities or a different per-day stepping rule.

## 4A.3 — Comparison with current `JD + 11`

### Finding A — relative algorithm: equivalent

Once an absolute phase/anchor is chosen, a continuous `JD mod 28` implementation and the 七元 rule generate the same mansion sequence indefinitely. Therefore a 1900–2100 comparison cannot reveal periodic mismatches caused by 七元 itself: there are none. Any mismatch would be a constant phase offset caused by choosing a different absolute anchor.

### Finding B — absolute phase: not derivable from this classical source

`協紀辨方書` explicitly states that the original calendar date of first-yuan 甲子 cannot be determined. Therefore the classical text cannot independently prove that production's `JD + 11` phase, or the anchor `2026-09-25 = Ngưu`, is the historically/canonically correct absolute phase.

This means an "independent 七元 oracle" cannot honestly be constructed from this source alone. Doing so would have to import the same modern anchor and would be circular validation.

## Decision

Do **not** change `getMansion()` yet.

Classify current state as:

```text
relative daily cycle .......... SOURCE-SUPPORTED
420-day / 七元 structure ...... SOURCE-SUPPORTED
absolute JD phase ............. PROVISIONAL / MODERN-ANCHOR
2026-09-25 = Ngưu ............. NEEDS INDEPENDENT ALMANAC EVIDENCE
宜/忌 text .................... NOT_AUDITED
production scoring ............ KEEP INFORMATIONAL (scoreDelta=0)
```

The existing `audited-mansion-evidence.json` must remain `not_audited`; this phase does not authorize scoring.

## Next gate — 4A.3B absolute-anchor validation

Before changing production, collect at least two independent dated almanac witnesses that explicitly print the daily mansion, preferably separated substantially in time. Requirements:

1. One source should be an authoritative/historical calendar or scan rather than a modern calculator.
2. Record Gregorian/civil date, sexagenary day if printed, mansion name, edition/source, page/image reference, and timezone/calendar convention where relevant.
3. Verify whether each witness implies the same `JD mod 28` phase as production.
4. If witnesses disagree, preserve production and classify the convention conflict before choosing a policy.
5. Only after the phase is source-locked should we run exhaustive 1900–2100 golden comparison and promote provenance status.

## Non-goals

This audit does not yet certify mansion element/animal mappings, `isGood`, `shouldDo`, `shouldAvoid`, exceptions, or activity scoring. Those remain Phase 4A.5–4A.8.
