# Authority item W1: 未-戊申 × 立券交易 (contract / transaction)

Opened 2026-10-25, split out of G2 Stage 1 by owner ruling. **Status: CLOSED (2026-10-26).**

**Closed by LOCAL OWNER RULING D1(a).** The local 未-戊申 納財 ruling propagates through the direct puzhu:21 consequence to 立券交易. Result: 劫煞 × 立券交易 remains BLANK / I1, not SOURCE_WITNESSED. No production migration required. See [`p4-g2-n117-stage3-owner-ruling.md`](p4-g2-n117-stage3-owner-ruling.md). 五離 × 立券交易 at heading level (F1) stays open and separate.

**G2-n117 Stage 2 (2026-10-26):** classification C, owner ruling required ([`p4-g2-n117-stage2-resolution.md`](p4-g2-n117-stage2-resolution.md)).

**G2-n117 Stage 1 (2026-10-26):** `UNRESOLVED_CONFLICT`; the cell stays BLANK / I1, not SOURCE_WITNESSED. See [`p4-g2-n117-authority-discrepancy.md`](p4-g2-n117-authority-discrepancy.md).

## Owner ruling (2026-10-25)

- `未-戊申 × contract/transaction` stays **BLANK**, preserving current authority. It remains production authority until this item is resolved.
- The n117 discrepancy is classified `OUT_OF_SCOPE_AUTHORITY_DISCREPANCY`, not a G2 alias migration change. It is deferred to this audit.
- The G2 identity decision is unchanged: `SAME_ACTIVITY_ALIAS_CONFIRMED` ([G2 spec](p4-g2-vol10-heading-match.md)).
- **Blank semantics (owner, 2026-10-25, I1):** once G2 makes the cell reachable, `BLANK` is active authority and removes 劫煞's penalty. The old unmatched output is not authority.
- **About the 五離 finding (§4):** the preliminary evidence that n117's print comes from 五離 makes it less likely that the blank and the page contradict each other. It does **not** change the cell. If this audit finds a different 劫煞-specific value, that becomes its own authority migration with its own impact analysis.

## Questions and what the repository already records

This section records existing evidence only. None of it is a ruling.

**1. What exactly does page n117 print?**

Page `06067694-n117.jpg` (卷二十五, 未月 戊申, officer 除) was re-read from the stored JPG crops in [the 納財 audit](p4-weishen-nacai-puzhu21.md):

| Part | Content |
|---|---|
| 吉神 | 四相 陽德 相日 吉期 不將 益後 除神 司命 |
| 凶神 | 劫煞 天賊 五虛 五離 |
| 宜 | 祭祀沐浴掃舍宇 |
| 忌, column 1 | 上冊受封上表章會親友出行結婚姻納采 |
| 忌, column 2 | 問名安牀求醫療病修倉庫**立券交易**納財 |
| 忌, column 3 | 開倉庫出貨財破土安葬啟攢 |

The heading is printed in 券 form, and no 開 precedes it. The h1b lock lists 立券交易 in this page's `printedButUnnoted`.

**2. What source or table produced the approved blank?**

- It comes from the source-derived P17-A table (`chou-bingyin-yuede-v1/candidate-final.json`, `b24f6f68…`), projected into `xieji-vol10-jiesha-authority-v1.json`.
- The chain is in the 納財 audit, N3:
  - 四相 is present, so 納財 has 宜.
  - 劫煞's 忌 on 納財 meets that 宜 (相抵), so 納財 is `neither_recorded`.
  - puzhu:21 (卷十 offset 22390, the triad 開市 / 立劵交易 / 納財) then withholds 劫煞 on 開市 and 立券交易.
  - Result: finance, opening, business, contract and transaction are all blank.

**3. Was the blank intentional, omitted, or inherited?**

- [`p4-option-c-final-gate.md`](p4-option-c-final-gate.md) records the owner ruling `OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS`, scoped "local: 未-戊申 納財 only".
- Its decision line keeps "the five 未-戊申 cells (finance, contract, transaction, opening, business)" blank.
- So the blank is source-derived and was kept explicitly. The ruling's stated reasoning, however, addressed the 納財 contradiction only.
- The contract cells were never consulted at runtime: G2 kept them `UNREACHABLE`.

**4. Does 卷十 consistently support 立券交易 for this cell?**

- Not checked across editions. Only the Wikisource 四庫 transcription and the archive.org 四庫 scans are in the repository.
- One relevant fact is recorded:
  - A table cell asks whether **劫煞's** 忌 survives.
  - n117's print of 立券交易 is explained by **五離**, an independent 忌 god present on this page. 五離's 忌 list includes 立券交易 (納財 audit, line 38).
  - Both source readings, N-A and N-C, withhold 劫煞 on 立券交易 (N2).
- So the print may not contradict the 劫煞 cell. That reading is preliminary, and it is the question this item must decide.

**5. Does the table structure tie 立券交易 to 未-戊申?**

- The page is month-and-pillar specific (未月, 戊申, officer 除), and 立券交易 sits within column 2 of the 忌 line.
- Segmentation is recorded in the 納財 audit: 納財 ends column 2; 開倉庫出貨財 starts column 3.

**6. Production impact of blank → 忌, independent of G2**

- **Today:** none. The cell is unreachable.
- **Once G2 Stage 2 makes it reachable:** measured by `p4G2Stage1Audit.test.ts` as model `weishen-avoid` against the ruling envelope (`candidate-impact.json` and `range-impact.json` → `dependsOnWeishenCell`).

| Set | Activity rows dependent on the cell | Events |
|---|---|---|
| P4 domain 2025–2027 | **0**. The in-domain 未-戊申 days 2026-08-02 and 2027-07-28 use the P4 path. | 20 evaluations, evidence only (0 score, 0 classification) |
| 2028 | **2** (2028-07-22, contract and transaction): blank gives 50 neutral, 忌 keeps 35 watch | 10 evaluations (9 score, 6 classification) |
| 1900–2100, outside the domain | **212** (106 dates × 2). Blank gives a higher score than 忌 on every one. | 1,060 (954 score, 636 classification), events on every day |

## Evidence kept for this item

- **2028-07-22** (未月 戊申), contract and transaction:
  - current production: 35 watch, 劫煞 applied;
  - G2 with the blank cell: 50 neutral, 劫煞 `no_annotation`;
  - with a 忌 cell: 35 watch.
- It is **not** a G2 owner witness.

## Scope

- **In:** the contract and transaction cells for 未-戊申 only.
- **Out:**
  - G2 heading identity;
  - the 納財 ruling;
  - the other 15 contexts, which agree with their pages;
  - Option C v2 demolition cells.
