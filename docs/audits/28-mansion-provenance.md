# 28 Mansion provenance audit

Status: **identity/order/phase source-supported; 宜/忌 tradition not source-locked**  
Scope: Phase 4A.1–4A.6  
Production behavior changed: **no**

## Production implementation

`shared/lunar/mansions.ts` currently computes the daily mansion as:

```ts
index = (((jd + 11) % 28) + 28) % 28
```

The original repository comment documented the modern anchor `2026-09-25 = Ngưu` and spot checks against licham.vn.

## 4A.1–4A.3B — phase provenance

`欽定協紀辨方書`, vol. 1, `二十八宿配日`, gives the seven-yuan scheme: 60 sexagenary days and 28 mansions meet after 420 days; the mansion on 甲子 for yuan 1..7 is `虛 → 奎 → 畢 → 鬼 → 翼 → 氐 → 箕`, then repeats. It also explicitly says the original civil date of first-yuan 甲子 cannot be recovered.

Using production ordering (`Giác=0 ... Chẩn=27`), those indices are `10 → 14 → 18 → 22 → 26 → 2 → 6 → 10`. This is exactly the +4 advance produced by `60 mod 28`, so 七元 is algebraically equivalent to advancing one mansion per civil day once the absolute phase is fixed.

Independent dated witnesses support production's absolute phase. Luo Ergang's Taiping-calendar study records 1853-02-04 (壬寅) as 牛; production JDN 2397889 gives `(2397889 + 11) mod 28 = 8 = 牛`. Modern Japanese calendar witnesses for 2025-01-01 (参) and 2026-09-25 (牛) also match production.

Decision:

```text
relative daily cycle .......... SOURCE-SUPPORTED
420-day / 七元 structure ...... SOURCE-SUPPORTED
absolute JD phase ............. SOURCE-SUPPORTED BY DATED WITNESSES
JD + 11 ....................... KEEP
```

References:

- `欽定協紀辨方書` (Siku Quanshu), vol. 1: https://zh.wikisource.org/zh-hant/%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B701
- National Library of China scan, book 1: https://upload.wikimedia.org/wikipedia/commons/0/04/NLC892-GBZX0301011955-284762_%E6%AC%BD%E5%AE%9A%E5%8D%94%E7%B4%80%E8%BE%A8%E6%96%B9%E6%9B%B8_%E4%B8%89%E5%8D%81%E5%85%AD%E5%8D%B7_%E7%AC%AC1%E5%86%8A.pdf
- Luo Ergang, `太平天國史考證集`: https://upload.wikimedia.org/wikipedia/commons/9/91/NLC511-027032013013758-17436_%E5%A4%AA%E5%B9%B3%E5%A4%A9%E5%9C%8B%E5%8F%B2%E8%80%83%E8%AD%89%E9%9B%86.pdf

## 4A.5 — canonical names, seven-luminary attributes, animal associations

### Source finding

`欽定協紀辨方書` itself lists the 宿曜 attributes while explaining the imported system:

```text
日: 虛 昴 星 房
月: 危 畢 張 心
火: 室 觜 翼 尾
水: 壁 參 軫 箕
木: 奎 井 角 斗
金: 婁 鬼 亢 牛
土: 胃 柳 氐 女
```

The same volume discusses the animal associations (禽象), including 鼠/牛/虎/兔/龍/蛇/馬/羊/猴/雞/狗/豬 and the associated neighbouring animals.

A second Qing witness, `演禽通纂` (`二十八宿名例`), prints the complete conventional names in canonical order:

```text
角木蛟 亢金龍 氐土貉 房日兔 心月狐 尾火虎 箕水豹
斗木獬 牛金牛 女土蝠 虛日鼠 危月燕 室火猪 壁水㺄
奎木狼 婁金狗 胃土雉 昴日雞 畢月烏 觜火猴 參水猿
井木犴 鬼金羊 柳土獐 星日馬 張月鹿 翼火蛇 軫水蚓
```

Reference: https://www.shidianguji.com/zh/book/SK1608/chapter/1juonrdg61a9r

### Production comparison

Production order is canonical:

```text
角 亢 氐 房 心 尾 箕 / 斗 牛 女 虛 危 室 壁 /
奎 婁 胃 昴 畢 觜 參 / 井 鬼 柳 星 張 翼 軫
```

The repository's Vietnamese names correspond to this sequence (`Giác ... Chẩn`). No ordering correction is indicated.

#### Important modeling issue: 日/月 are not literally 五行

The canonical attribute system is **七曜**: 日、月、火、水、木、金、土. Production's `element: NguHanh` cannot represent 日 or 月 and therefore normalizes:

- 日 → Hỏa
- 月 → Thủy

This normalization is understandable (`太陽`/`太陰` associations exist in later explanatory traditions), but it is not a verbatim representation of the canonical seven-luminary attribute. Consequently production should not describe this field as the canonical mansion 五行 without qualification.

Recommended future schema:

```ts
type MansionLuminary = 'Mộc' | 'Kim' | 'Thổ' | 'Nhật' | 'Nguyệt' | 'Hỏa' | 'Thủy'

interface Mansion {
  luminary: MansionLuminary // canonical 七曜
  element?: NguHanh        // optional derived normalization for app use
}
```

Do not perform this migration in the provenance-only branch; it is a separate schema/UI migration.

### Animal-name audit findings

Most production animal associations agree with the conventional full names. Two production labels are materially wrong or misleading against the source tradition:

1. **氐土貉 / Đê** — production has `Lạc (Lạc đà)` (camel). Canonical animal is **貉**, a raccoon-dog/badger-like animal, not 駱駝 (camel). This is a translation/data error, not a convention difference.
2. **柳土獐 / Liễu** — production has `Chương (Gấu ngựa)`. Canonical **獐** is muntjac/water-deer-like, not a bear. `Gấu ngựa` is therefore a translation/data error.

Other labels should be normalized carefully rather than over-translated where the historical animal is obscure (e.g. 獬, 貐/㺄, 犴). Preserve the source character/name in provenance even if the Vietnamese UI uses an accessible gloss.

Classification:

```text
name/order ..................... PASS
seven-luminary mapping ......... PASS at source level
production 日→Hỏa/月→Thủy ...... DERIVED NORMALIZATION, document explicitly
animal associations ............ MOSTLY PASS
氐土貉 = Lạc đà ................ DATA_BUG
柳土獐 = Gấu ngựa .............. DATA_BUG
obscure animal translations .... REVIEW/TRANSLATION DEBT
```

## 4A.6 — isGood and 宜/忌 content

### Key source finding

The `二十八宿配日` section of `欽定協紀辨方書` does **not** supply the repository's simple per-mansion `isGood` boolean or the current Vietnamese `shouldDo` / `shouldAvoid` lists. More importantly, the text explains that the 宿曜 method judges suitability by combining the person's natal mansion, the mansion/luminary encountered for the action, and the mansion's nature relative to the intended affair. That is a richer model than `one mansion = globally good/bad`.

Therefore we cannot honestly source-lock the current boolean `isGood` to `協紀辨方書`.

Current production `isGood` and 宜/忌 text were originally summarized from licham.vn. They may represent a valid modern Vietnamese almanac tradition, but they are **source-dependent almanac data**, not a deterministic consequence of the 28-mansion cycle.

### Decision for `isGood`

Do not promote `isGood` to canonical/audited truth.

Recommended semantics:

```text
isGood ......................... SOURCE_DEPENDENT / OVERSIMPLIFIED
use for global day score ....... NO
use as informational UI ........ ONLY if labeled by source tradition
```

Long-term, prefer removing the binary from the canonical Mansion identity object and deriving any summary badge from explicit sourced activity evidence.

### Decision for shouldDo / shouldAvoid

Keep existing text unchanged for compatibility, but treat it as a modern source layer:

```text
shouldDo/shouldAvoid ............ MODERN_VIETNAMESE_ALMANAC_TRADITION
current source .................. licham.vn transcription/paraphrase
classical source-lock ........... NOT ESTABLISHED
score contribution .............. MUST REMAIN 0
```

The current scoped parser is architecturally safer than flattening phrases: road vs water travel, burial vs grave repair, and general statements remain distinct. However parser correctness does not make the underlying 宜/忌 source canonical.

### Source hierarchy after audit

```text
Layer A — mansion identity
  order / daily phase / 七元 / 七曜 / animal identity
  => classical source-supported

Layer B — mansion action meanings
  shouldDo / shouldAvoid / exceptions
  => source-dependent almanac tradition

Layer C — app scoring
  => must consume only owner-approved/source-locked evidence
  => current mansion evidence stays informational, scoreDelta=0
```

## Required production fixes / follow-up

### Safe data corrections

Prepare a separate reviewed change for at least:

```text
Đê:   "Lạc (Lạc đà)"   -> source-faithful 貉 translation/gloss
Liễu: "Chương (Gấu ngựa)" -> source-faithful 獐 translation/gloss
```

Do not guess Vietnamese zoological glosses in production without owner review; retaining Sino-Vietnamese plus source character is safer than replacing one uncertain translation with another.

### Schema debt

Open a separate migration for canonical `luminary` so 日 and 月 are not silently collapsed into Hỏa/Thủy. Keep `element` only as explicitly derived compatibility data if product needs it.

### Evidence status

`audited-mansion-evidence.json` must remain `not_audited` for activity evidence. Identity provenance may be marked separately as source-supported, but do not globally flip each mansion item to `ready`, because that would incorrectly certify the modern 宜/忌 text.

## Phase verdict

```text
4A.1 phase convention .......... PASS
4A.2 七元 derivation ............ PASS
4A.3 absolute phase ............ PASS
4A.5 names/order ............... PASS
4A.5 七曜 ....................... PASS (schema migration needed)
4A.5 animals ................... FAIL: 2 known translation/data bugs + review debt
4A.6 binary isGood ............. NOT CANONICAL / SOURCE_DEPENDENT
4A.6 宜/忌 ...................... NOT SOURCE-LOCKED
4A.6 activity scoring .......... SAFE AS-IS ONLY BECAUSE scoreDelta=0

Overall Phase 4A verdict:
PARTIAL_PASS — canonical identity largely established; action semantics remain source-dependent.
```

## Next phase

1. Fix the two known animal-label bugs under tests.
2. Add `luminary` as canonical 七曜 data without breaking existing `element` consumers.
3. Keep mansion activity evidence informational.
4. If product wants mansion 宜/忌 to affect recommendations, run a dedicated source-lock audit of a selected Vietnamese almanac tradition before changing any score.
5. After these fixes, proceed to Phase 4B Directions provenance.
