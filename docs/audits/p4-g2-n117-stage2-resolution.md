# G2-n117 Stage 2: targeted authority resolution (audit only)

2026-10-26, branch `claude/g2-n117-stage2`, cut from Stage 1 `3afb22d`. Nothing in production changes. Stage 1 files are read, never written.

Artifacts are in `sources/p4-vol10/g2-n117-stage2/`:

| File | Purpose |
|---|---|
| `build_evidence.py` | Deterministic builder |
| `evidence.json` | Sweep scope, 11-page operand matrix, decisive targets, puzhu:06 / puzhu:21 text, runtime observation, classification |
| `lock.json` | Hashes of the evidence, the builder, Stage 1 evidence and lock, the puzhu:06 sweep and baseline, `vol10.raw.txt`, and the 11 page scans |

Harness: `shared/lunar/p4G2N117Stage2Lock.test.ts`.

**Classification: C. Still `UNRESOLVED_CONFLICT`; owner ruling required.** No stored witness discriminates. The two decisive pages exist but are not in the repository.

## 1. Stage 1 baseline

- Stage 1 (`3afb22d`, pushed) ruled `UNRESOLVED_CONFLICT`. The cell stays `BLANK / I1` and is not `SOURCE_WITNESSED`.
- This Stage leaves that ruling as it stands.
- Every finding below either adds to Stage 1 or, in one case (§11), corrects a Stage 1 attribution as a new finding. Stage 1 files are untouched.

## 2. 戌-辛酉 re-read

| Field | Value |
|---|---|
| Witness | `06067696-n63` (卷二十八), archive.org `06067696.cn/page/n63` |
| File | `xiangdi-cancel-both-v1/pages/06067696-n63.jpg` |
| sha256 | `1922bb2b0b80a49a3536c12c24bf740701a0279e62375658d936d67bf976f65c` |
| Context | 戌月, 辛酉, officer 閉 (辛酉石榴木專閉日) |
| 吉神 (scan) | 天德合 月德合 官日 除神 寶光 鳴吠 |
| 凶神 (scan) | 月害 天吏 致死 血支 五離 |
| 宜 (scan) | 祭祀沐浴剃頭整手足甲裁衣補垣塞穴掃舍宇 |
| 忌 (scan) | 會親友求醫療病療目針刺醞釀畋獵取魚 |

- **五離:** present. It is **lifted by its own clause**: 「與天德月德天德合月德合天赦三合六合併則不忌」 names 天德合 and 月德合.
- **puzhu:06 trigger:** yes, the same two gods (天德合, 月德合).
- **立券交易 忌 operands (卷十一):** 月害, 天吏, 五離. There is no 宜 operand.
- **Printed:** 開市 absent, 立券交易 absent, 納財 absent.
- **Decisive: NO.** The puzhu:06 trigger and 五離's own lifter are the same gods, so the page cannot separate a puzhu:06 lift from 五離's own lift. 月害 and 天吏 are also lifted on this page, so it says nothing about 五離 under 四相.

## 3. Repository witness search

### Scope

- 67 structured 月表 page records from the three witness locks (`h1b-yuebiao-witness-v1`, `yuebiao-witness-lock-v2`, `xiangdi-cancel-both-v1`).
- 8 `suibao-zhuzhen` pages. All are 子 or 午 days, none 申/酉.
- Excluded: `yi-*`, `phase-clause`, `shixian-tohoku`, `g1-glyph-stage1`, `g2-stage1`. These are 卷五 / 十 / 十一 source pages or non-月表 scans.
- 五離 falls on 申/酉 days. **11 stored pages qualify.**

### The ideal witness

It needs:

1. 五離 present and not lifted by its own clause;
2. a puzhu:06 trigger that is **not** also a 五離 lifter (四相, 時德, 月恩 or 天願);
3. 五離 as the **only** 立券交易 忌 operand;
4. no 宜 on 立券交易.

### Result

- **No stored page qualifies** (`decisiveStored = []`). n117 has 劫煞 as a second operand.
- The frozen puzhu:06 sweep names **two contexts that do qualify**. Both are absent from the repository:

| Context | Example dates | Trigger | 立券交易 raw 忌 sources (baseline-v1) | Model | Status |
|---|---|---|---|---|---|
| **戌-壬申** | 2025-10-30, 2026-10-25 | 四相 | [五離] only | only_ji → not_recorded (QL lift) | not stored |
| **戌-庚申** | 2025-10-18, 2026-10-13 | 月恩 | [五離] only | only_ji → not_recorded (QL lift) | not stored |

- Their god lists come from P4 model presence, not from print.
- The leaf numbers are unverified. Spacing predicts 06067696 n14 and n62; a fetched page header must confirm them.
- 丑-甲申 and 午-戊申 have 四相 + 五離, but 立券交易 has its own 宜 there (`both_present`), so they are confounded.

## 4. Operand matrix

Three things are kept apart:

- **Printed:** the 忌 line.
- **Derived:** the frozen puzhu:06 sweep on the first in-window date.
- **Production:** shown only for the target.

L = 五離's own lifters; T = puzhu:06 triggers; 忌 / 宜 ops = 立券交易 operands from 卷十一.

| Page | Context | Read | L | T | 立券交易 忌 ops | 宜 ops | Printed 開市 / 立券 / 納財 | Derived 立券交易 | Decisive? |
|---|---|---|---|---|---|---|---|---|---|
| **n117** | **未-戊申** | S1 | — | 四相 | 劫煞 五離 | — | — / 忌 / 忌 | undetermined → neither_recorded (QL) | target |
| n81 | 未-壬申 | S1 | — | — | 劫煞 五離 | — | 忌 / 忌 / 忌 | (no in-window date) | no trigger |
| n105 | 未-丙申 | S1 | — | — | 劫煞 五離 | — | 忌 / 忌 / 忌 | undetermined | no trigger |
| n129 | 未-庚申 | S1 | — | — | 劫煞 五離 (八專) | — | 忌 / 忌 / 忌 | (no in-window date) | no trigger |
| n93 | 未-甲申 | S1 | 天德 月德 | 天德 月德 | 劫煞 五離 | — | — / — / — | not_recorded | trigger = lifter |
| n50 | 申-戊申 | S1 | 天德合 天赦 | 天德合 天赦 | 五離 | — | — / — / — | not_recorded | trigger = lifter |
| 06067693-n105 | 巳-丙申 | S1 | 天德合 六合 | 天德合 天願 | 月刑 五離 | 天願 六合 五富 | — / (宜) / (宜) | only_yi | own 宜 |
| n51 | 寅-己酉 | S1 | — | — | 天吏 五離 | — | 忌 / 忌 / 忌 | only_ji | no trigger, 2 operands |
| **n63** | **戌-辛酉** | **S2** | 天德合 月德合 | 天德合 月德合 | 月害 天吏 五離 | — | — / — / — | neither_recorded | trigger = lifter |
| **06067692-n93** | **卯-甲申** | **S2** | 月德 | 月德 | 劫煞 小耗 五離 | — | 忌 / 忌 / 忌 | only_ji, protected (小耗 猶忌) | positive control |
| 06067696-n130 | 亥-辛酉 | prior | — | — | 災煞 四耗 五離 | — | 忌 / 忌 / 忌 | (no row) | no trigger, 3 operands |

**Positive control: 卯-甲申.**

- A puzhu:06 trigger (月德) is present, and the triad still prints 忌.
- 小耗's clause 「子午卯酉月值刼煞雖與德合併猶忌」 keeps it, and the model's `protected_ji` agrees.
- So puzhu:06 is not a blanket lift, and the page and model agree where the exception applies.
- This tells us nothing about 五離 under 四相.

**Patterns, characterization only, not proof:**

- On every page where 五離 is lifted, the lift comes from its own clause, and 立券交易 is never printed.
- On every page where 五離 is unlifted and there is no trigger, 立券交易 is printed.
- n117 is the only stored page with an unlifted 五離 together with a non-lifter trigger.

## 5. puzhu:06 reconstruction

1. **Literal source (卷十 offset 21817, verified in `vol10.raw.txt`):**
   - 「凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌」.
   - **立劵交易 is named as a target.**
   - There is **no god qualifier** for which 忌 is withheld. The only exceptions are 遇徳猶忌 and 從忌不從宜.
2. **Interpretation:**
   - **Q1–Q3 = no:** 如常例 with an 等第 grade, 「與德併如常例」, and 月破 without 德 all keep 忌. These are the restrictive readings.
   - **Q4 = yes:** a remaining-ji god with its own 「與…併則不忌」 list is lifted. This is the **literal-leaning** reading; the text has no exception for such gods.
   - **The counter-reading:** 五離's own list 「與天德月德天德合月德合天赦三合六合併則不忌」 does not name 四相, 時德, 月恩 or 天願. That could mean the authors scoped 五離's lift deliberately. This is equally an interpretation.
3. **What the owner adopted (2026-10-16, `OWNER_ADOPTED`, not canonical):**
   - 「Q4 có」: puzhu:06 lifts the 忌 of 九空, 五虛, 小耗, **五離** and 五墓.
   - That covered 77 rows in 2025–2027, **立券交易 28** of them, later 25 after Q4a.
   - Recorded in `p4b-puzhu06-v1..v3.json` `ownerDecision.Q4` and `tasks/prd-p4b-puzhu06.md` §8.
4. **Does it explicitly cover 立券交易?** Yes: it is in the counted rows, and puzhu:06 names it.
5. **Does it explicitly cover lifting 五離?** Yes: 五離 is named in the Q4 class (`liftLists.五離`, class QL).
6. **Was 未-戊申 considered?**
   - As a model row, yes: 2026-08-02 未戊申 立券交易 is a worked example in `p4b-puzhu06.md` (QL lift).
   - As a witness, no. n117 first enters the repository on 2026-10-21 (`372bdad`, H1-B), five days **after** Q4 was adopted. The owner ruled without the page.
7. **Is applying Q4 to n117 direct or an extrapolation?** **Direct:**
   - 五離, 立券交易 and the 四相 trigger are each inside the adopted class.
   - The open issue is not the scope of Q4. It is whether Q4 should stand against a witness the owner never saw.

## 6. puzhu:21 reconstruction

**Literal (卷十 offset 22390, verified):**

> 「凡吉凶相抵不註忌開市亦不註忌立劵交易納財；不註忌納財亦不註忌開市立劵交易；不註忌立劵交易亦不註忌開市納財」

**How it works:**

- **Contextual, not unconditional.** The trigger is a triad heading left unnoted **by 吉凶相抵**.
- **Tied to 相抵,** not to 五離. The rule names no god.
- **A rule, not an example.** It is an operative 鋪註 line.
- The next line, puzhu:22, carries its own exception 「如遇專忌之日則仍註忌」. puzhu:21 has none.

**Effect on 立券交易 when 納財 is unnoted by 相抵:**

- 「不註忌」 the heading. Read literally (N-A), all its 忌 are withheld, 五離 included.
- Under N-C, only the 忌 that the 相抵 cancelled (劫煞) is withheld.
- For the **劫煞 cell** the two are identical: withheld, so blank.

**Effect on 五離:** only under N-A. puzhu:21 never targets 五離 by name.

**n117 compatibility:** not fully compatible under any reading (§7). The literal rule makes the triad move together, and n117 splits it.

## 7. n117 re-evaluation

Printed on n117: 開市 —, 立券交易 忌, 納財 忌. The table gives predicted print per reading, and ✗ marks a printed cell the reading misses.

| puzhu:21 reading | Q4 | 開市 | 立券交易 | 納財 | Misses | 劫煞 cell (contract) |
|---|---|---|---|---|---|---|
| N-A (all 忌 withheld) | yes | — | — ✗ | — ✗ | 2 | blank |
| N-A | no | — | — ✗ | — ✗ | 2 | blank |
| N-C (only the 相抵 god withheld) | yes | — | — ✗ | — ✗ | 2 | blank |
| N-C | no | — | 忌 (五離) | — ✗ | 1 | blank |
| N-B (page-literal: no 相抵 on 納財) | yes | 忌 ✗ | 忌 (劫煞) | 忌 | 1 | **avoid** |
| N-B | no | 忌 ✗ | 忌 | 忌 | 1 | **avoid** |

- **Every reading misses at least one printed cell.** The two best miss exactly one: (N-C, Q4 no) misses 納財, and N-B misses 開市.
- The "one miss vs two" count is **non-probative characterization**. Parsimony is no better than frequency or uniqueness as proof, and the brief excludes those.
- The n117 立券交易 print is correct only under **Q4 = no and N-C together**. Neither is adopted.
- **The 劫煞 cell is avoid only under N-B.** N-B denies 納財's 相抵, which is exactly what the LOCAL 納財 owner ruling decided against. Under every reading consistent with that ruling, the 劫煞 cell is blank, whatever Q4 says.
- **Q4 vs n117 is therefore a heading-level question about 五離.** It decides whether 立券交易 should *also* carry 五離's 忌 on 未-戊申. It does not move the 劫煞 cell under any reading consistent with the 納財 ruling.

## 8. Hypothesis comparison

| | Verdict | Basis |
|---|---|---|
| **H1 SOURCE_RULE_WINS** | Not established | The cell's blank needs the LOCAL 納財 owner ruling plus literal puzhu:21. One link is an owner ruling, so source authority alone does not decide it (outcome A unavailable). On 立券交易 itself, n117 is wrong only if Q4 is right, and Q4 is owner-adopted, not source. |
| **H2 MONTH_TABLE_WINS** | No evidence | No precedence rule or commentary. No stored analogue where a 月表 print overrode a source rule. For the 劫煞 cell it needs N-B, which contradicts the 納財 ruling and the page's own 開市. |
| **H3 UNRESOLVED** | **Holds** | The decisive question is Q4 vs the n117 print on 五離. Only 戌-壬申 or 戌-庚申 can test it, and neither is stored. |

## 9. Final evidence classification

**C — Still UNRESOLVED, owner ruling justified.**

- **Not A:** the blank depends on an owner ruling, and no source-level witness resolves Q4.
- **Not B:** there is no precedence and no witness for it.
- **Not D:** all repository evidence was inspected:
  - all 11 申/酉 pages;
  - the two this Stage re-read against the scan (n63, 卯-甲申);
  - the other nine via Stage 1 re-reads, except 亥-辛酉, which is a prior transcription and non-discriminating with three operands.
- The decisive pages are **outside** the repository.

**Confidence:** high that the classification is C; high on the operand matrix and the puzhu:06 adoption record.

## 10. Owner decision required

There are two separable questions. D1 does not depend on D2.

### D1 — the cell (closes W1)

> Does the LOCAL 未-戊申 納財 ruling extend to its literal puzhu:21 consequence on 劫煞 × 立券交易 (contract, transaction)?

- **(a) Yes.**
  - The cell stays `blank`, and W1 closes as a derivative of the 納財 ruling.
  - Zero impact. The cell is still not `SOURCE_WITNESSED`.
- **(b) No.**
  - Create a local exception to puzhu:21 for 立券交易 only, giving `avoid`.
  - Measured impact (G2 Stage 2 §6): 212 activity rows and 1,060 events outside 2025–2027; 0 activity rows inside.
  - It must not extend to 開市, which the page leaves unnoted.

### D2 — the heading (five-離 / F1; does not block D1)

> On 未-戊申, does puzhu:06 Q4 (四相 lifts 五離) stand against n117's printed 立券交易 忌?

- **(a) Keep Q4.** Record n117's 立券交易 print as a heading-level witness error, alongside 納財.
- **(b) Local exception for n117.** 五離 survives on 未-戊申 立券交易. That is a P4-layer change in its own migration.
- **(c) Defer and authorize fetching** 06067696 戌-壬申 and 戌-庚申 (§13) to test Q4 against print practice first.

This audit makes neither decision.

## 11. Production impact

**None.** No production file changed, and the target stays `BLANK / I1`.

- `getVol10JieshaRuntime('未','戊申', contract/transaction) = {APPLIED, blank}`. Pinned again in this Stage's test.
- **New finding, correcting a Stage 1 attribution (Stage 1 is not edited).**
  - Stage 1 §10 attributed the in-domain 五離 `no_annotation` on 2026-08-02 to "N-A via puzhu:21".
  - The production P4 path (`getP4DayHeadings → resolveP4OwnerRulesDay`) actually yields 立券交易 = `neither_recorded` with `rule: H1-B` (五離 忌 kept) followed by **`puzhu06: lift:QL`**.
  - So **Q4 is live in production inside 2025–2027.** The current behaviour equals the (N-C, Q4 yes) row of §7.
  - The same layer gives 戌-壬申 and 戌-庚申 立券交易 = `not_recorded` (QL lift), with contract at 50 no_evidence.
  - 卯-甲申 is protected `only_ji`, with contract at 20 avoid.
- **Side finding:** the doc comment in `shared/lunar/p4OwnerRules.ts` says the layer is "Not imported by the production pipeline". `p4AlmanacHeadings.ts` imports it. The comment is stale; it is not fixed here.
- **Consequence for D2:**
  - Choosing D2(b) changes production in 2025–2027 (2026-08-02 and 2027-07-28, contract and transaction). That impact is not measured here.
  - Choosing D2(a) changes nothing.

## 12. F1 separation

- F1 is the heading-level 五離 debt:
  - inside the domain, the P4 owner-rules layer (H1-B, then puzhu:06 Q4);
  - outside the domain, 五離 presence is not locked.
- D2 belongs to F1, and this Stage does not solve it.
- The relationship: if the owner picks D2(b), the F1 inside-domain behaviour changes for 未-戊申. If D2(a), F1 stays as it is.
- Either way, the outside-domain gap (no 五離 presence after 2027) remains its own debt.
- Neither D2 outcome changes the 劫煞 cell.

## 13. Remaining external evidence opportunity

- **Decisive pages (same 四庫 edition, already the repository's authority source):**
  - archive.org `06067696.cn`, 戌月 **壬申** and **庚申**.
  - Leaves are predicted at n14 and n62 from n63 = 辛酉 and one leaf per pillar. **Unverified:** the page header must read 壬申 / 庚申 and 戌月 before use.
- **What each outcome would mean:**
  - **Not printed:** print practice applies a puzhu:06 non-lifter trigger to 五離, which supports Q4. n117's 立券交易 becomes a second witness error on the page.
  - **Printed:** print practice keeps 五離 on such days, which contradicts Q4 and supports D2(b).
  - **Mixed:** stays unresolved.
- **Weaker supplementary pages:** 丑-甲申 and 午-戊申 (own 宜 confounds them).
- **A second edition** of 卷二十五 未月 戊申 remains useful for the 納財 / 開市 split.
- Nothing was fetched in this Stage, because downloading needs explicit authorization.
