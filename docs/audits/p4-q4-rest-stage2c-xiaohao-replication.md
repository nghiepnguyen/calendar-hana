# Q4-REST Stage 2C: 小耗 replication and owner-ruling packets (audit only)

2026-10-26, branch `claude/q4-rest-stage2c-xiaohao-replication`, cut from `cac923f` (Stage 2B). Stage 1, 2A, 2A.1 and 2B are frozen and not amended. **No production change, no ruling implemented.** Reviewer: Claude, single agent, reading the scan directly; no independent second review.

**Result**

- **Page.** 戌-癸卯 (06067696-n45) was acquired and authenticated.
- **大時 is not a contaminant, by its own entry** (SOURCE_FACT): 「辰戌月值執日六合止忌安撫邊境選將訓兵出師餘皆不忌」. The day is 戌 month, officer 執, with 六合 present.
- **Replication.** All four 小耗 headings print **only_ji** under 四相: **XH-R1**, a clean replication supporting J-NARROW.
- **Owner packets.** Four separate packets and four draft rulings are frozen with isolated diagnostic impact. None is active.

**Artifacts** in `sources/p4-vol10/q4-rest-stage2c/`:

| File | Contents |
|---|---|
| `pages/06067696-n45.jpg` | The scan |
| `runtime.json` | Per-ruling and combined diagnostic diffs over 2025–2027, plus the 戌-癸卯 production rows. Written by `p4Q4RestStage2CImpact.test.ts` with `Q4R2C_DUMP=1` |
| `build_evidence.py` | Deterministic builder (optional OUTDIR) |
| `page.json`, `transcription.json` | Authentication and readings |
| `dashi-authority.json` | The 大時 finding |
| `xiaohao-replication.json` | Per-heading J/Y cells |
| `owner-packets.json` | Packets A–D |
| `scope-matrix.json` | Scope of each candidate ruling |
| `diagnostic-impact.json` | Diagnostic counts |
| `draft-rulings.json` | Draft ruling text |
| `lock.json` | Hashes |

Test: `shared/lunar/p4Q4RestStage2CLock.test.ts`.

## 1–2. Page

| | |
|---|---|
| Locator | archive.org `06067696.cn` n45 (predicted locator confirmed); `curl --fail`, image unmodified |
| SHA-256 | `71d6b5e87c16ee79de3b7109cff03898f307c97cfc74ad1a30b80b1b36a6208f` |
| Header | 癸卯金箔金寶執日; margin 卷二十八; foliation not visible |
| Month | 執 on 卯 ⇒ 建 = 戌; leaf 45 = cycle 39 + 6 (戌 block) |
| 吉神 | 四相 六合 不將 聖心 五合 鳴吠對 |
| 凶神 | 大時 大敗 咸池 小耗 五虛 勾陳 |
| 宜 | 祭祀祈福求嗣襲爵受封會親友出行上官｜赴任臨政親民結婚姻納采問名嫁娶進人｜口移徙解除求醫療病裁衣修造動土豎柱｜上梁經絡醞釀捕捉畋獵栽種牧養納畜破｜土安葬啟攢 |
| 忌 | 修倉庫開市立券交易納財開倉庫出貨財｜穿井 (穿井: 卯日 百忌) |
| Uncertain glyphs | none |
| Status | **AUTHENTICATED** |

## 3–4. 大時 and the other operands

**大時's 忌 list includes all four tested headings** (卷十: 「…修倉庫開市立劵交易納財開倉庫出貨財…」).

**Its entry restricts that list on this day.** 「辰戌月值執日六合止忌安撫邊境選將訓兵出師餘皆不忌」. The note adds 「…故即不與德合赦願併亦止忌軍事餘皆不忌也」: the restriction holds even without 德合赦願.

| Condition | On 戌-癸卯 |
|---|---|
| 辰戌月 | 戌 ✓ |
| 執日 | 執 ✓ |
| 六合 | 戌↔卯 ✓ (printed) |

- **Conclusion (SOURCE_FACT).** 大時 produces no 忌 on 開市, 立券交易, 納財 or 開倉庫出貨財 here. Production (`trace.ji = [小耗]` on all four) agrees, but the finding rests on the entry, not on production.
- **Other operands.**
  - 大敗 is 大時's alias.
  - 咸池 is 大時's 又為 (忌取魚乘船渡水), not a tested heading.
  - 五虛 on 開倉庫出貨財 is lifted by its own 六合 (「與天德月德天德合月德合六合併則不忌」).
- **Stage 1 label superseded.** Stage 1's "CONTAMINATED_TARGET" came only from 大時 appearing in the source list; the entry clause overrides it.

## 5. 小耗 replication

| Heading | 忌 operands | Neutralised | Other 忌 | Independent 宜 | Printed | J | Y |
|---|---|---|---|---|---|---|---|
| 開市 | 小耗, 大時 | 大時 (clause) | — | — | only_ji | **J-NARROW** (clean) | not testable |
| 立券交易 | 小耗, 大時 | 大時 | — | 六合 五合 | only_ji | **J-NARROW** | Y-ONLY-JI |
| 納財 | 小耗, 大時 | 大時 | — | 四相 六合 | only_ji | **J-NARROW** | Y-ONLY-JI |
| 開倉庫出貨財 | 小耗, 大時, 五虛 | 大時; 五虛 (own 六合) | — | 四相 | only_ji | **J-NARROW** | Y-ONLY-JI |

- **Trigger:** 四相.
- **小耗 own lifters present:** none.
- **劫煞 exception** (子午卯酉): does not apply in 戌 month.
- **Classification: XH-R1**, a clean replication of 巳-戊戌 (四相 → J-NARROW on 開市, 立券交易, 納財). It also adds 開倉庫出貨財.

**Y (recorded only).** 3 more only_ji cells (U3). This page does not authorize U4, U7, the other ungraded gods or a global only_ji rule. BAIJI-Y is untouched.

## 7. Owner packets

| Packet | Direct witnesses | Clean cells | Triggers tested | Untested | Counter-examples |
|---|---|---|---|---|---|
| **A 九空** | 卯-丁丑 (n86), 午-戊辰 (n10) | 6: 開市, 立券交易, 納財 on each page, all only_ji | 月恩, 四相, 時德 (時德 only with 月恩/四相) | 天德, 天赦, 天願 | 0 |
| **B 五虛** | 卯-丁巳 (n126), 午-戊申 (n50), 子-丙寅 (n8) | 3 × 開倉庫出貨財, only_ji | 月恩 (n126, n50), 四相 (n126, n50), **時德 alone** (n8) | 天赦 (never meets 五虛 per the 四庫 note) | 0 |
| **C 小耗** | 巳-戊戌 (n107), 戌-癸卯 (n45) | 7: 開市/立券/納財 ×2 + 開倉庫 ×1, only_ji | 四相 only | 月恩, 時德, 天赦 | 0 |
| **D F1-Y** | 午-戊申 (n50), 丑-甲申 (n93) | 立券交易 ×2, only_ji | independent 宜: 午-戊申 → 滿日; 丑-甲申 → 五富 | — | 0 |

**Packet D controls.** On both pages the same 宜 source prints on 開市 and 納財 (only_yi, no 忌 there). It disappears on 立券交易 (五離) and 開倉庫出貨財 (五虛 / 百忌甲). So the 宜 source is live on the page and drops out only where a 忌 survives.

## 8. Draft rulings (not active)

| Draft | Text (abridged; full in `draft-rulings.json`) | Mechanism if adopted |
|---|---|---|
| R-JK | For 九空's puzhu:06 headings, generic Q4 triggers do not remove 九空's 忌 unless a 九空 lifter (月德, 天德合, 月德合) applies; deferrals unchanged | `liftExclusions.九空 = [天德, 天赦, 天願, 月恩, 四相, 時德]` |
| R-WX | For 五虛 × 開倉庫出貨財 only, the same with 五虛's lifters (天德, 月德, 天德合, 月德合, 六合; 天願 by note) | `liftExclusions.五虛 = [天赦, 月恩, 四相, 時德]` |
| R-XH | For 小耗's puzhu:06 headings, the same with 小耗's lifters (天德, 月德, 天德合, 月德合, 天願); 子午卯酉 + 刼煞 猶忌 unchanged | `liftExclusions.小耗 = [天赦, 月恩, 四相, 時德]` |
| R-F1Y | For 五離 × 立券交易, when 五離's 忌 survives **as the sole surviving 忌** and an independent 宜 applies: only_ji, not both_present. Not the R2 J axis, 五離 lifters, other 五離 headings or global Y | composition on 立券交易 when the sole surviving 忌 is 五離 (the wording matches the measured scope) |

## 9. Scope matrix

| Debt | God | Heading scope | Evidence | Direct witnesses | Proposed | Extrapolation |
|---|---|---|---|---:|---|---|
| Q4-REST | 九空 | 開市, 立券交易, 納財 (direct); 開倉庫出貨財 | J-NARROW | 2 | R-JK | **same-god heading** (開倉庫: only joint 九空+五虛 pages exist); **same-god trigger** (天德, 天赦, 天願) |
| Q4-REST | 五虛 | 開倉庫出貨財 (direct) | J-NARROW | 3 | R-WX | same-god trigger (天赦, never co-occurs) |
| Q4-REST | 小耗 | 開市, 立券交易, 納財 (2 pages); 開倉庫出貨財 (1 page) | J-NARROW | 2 | R-XH | **same-god trigger** (月恩, 時德, 天赦) |
| Q4-REST | 五墓 | none | no discriminating context | 0 | none | — |
| F1-Y | 五離 | 立券交易 (direct) | only_ji ×2 | 2 | R-F1Y | **same-heading context**: applies to all 21 五離 × 立券交易 both_present rows, not only the 2 witnessed contexts |

**Cross-god extrapolation: NOT AUTHORIZED.** No draft reaches another god.

## 10. Diagnostic impact (2025–2027; each ruling in its own module graph)

| Ruling | Decision rows | Heading rows | Activity rows | Event rows | Status changes | Activity score | Hard warnings | Event class | Event score |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| R-JK | 37 | 37 | 57 | 120 | 57 | 57 | 0 | 80 | 110 |
| R-WX | 39 | 14 | 14 | 0 | 14 | 14 | 0 | 0 | 0 |
| R-XH | 30 | 9 | 15 | 36 | 15 | 15 | 0 | 24 | 33 |
| R-F1Y | 0 | 21 | 42 | 210 | 0 | 42 | 0 | 0 | 189 |
| **All four** | **96** | **74** | **121** | **366** | **79** | **121** | **0** | **104** | **332** |

**Heading transitions.**
- **R-JK:** not_recorded→only_ji 10, only_yi→both_present 27.
- **R-WX:** only_yi→both_present 14.
- **R-XH:** not_recorded→only_ji 6, only_yi→both_present 3.
- **R-F1Y:** both_present→only_ji 21.

**Notes.**
- **R-WX decision rows (39) = 14 heading moves + 22 tag-only + 3 others.** The tag-only rows change class (QL→QL_EXCLUDED) on rows another source already keeps. The other 3 are 戌-癸亥, where the 劫煞 相抵 leaves the final state unchanged.
- **Overlap.** The 7 joint 九空+五虛 開倉庫出貨財 rows (午-庚辰, 午-戊辰, 卯-丁丑, 酉-癸未) move under R-JK alone *and* under R-WX alone, because `decideP4Puzhu06` keeps a row if any class is keep. Single rulings sum to 81 heading rows against 74 combined. Once R-WX is adopted, R-JK's 開倉庫 extrapolation has no separate impact.

**Heading rows by evidence category** (heading counts only):

| Draft | Category | Heading rows |
|---|---|---:|
| R-JK | (a) 開市 / 立券交易 / 納財 with a tested trigger (月恩, 四相, 時德) | 30 |
| R-JK | (b) untested triggers only (天德, 天赦, 天願) | 0 |
| R-JK | (c) 開倉庫出貨財 (all joint with 五虛; also moved by R-WX) | 7 |
| R-WX | (a) tested trigger | 14 |
| R-WX | (b) untested only | 0 |
| R-XH | (a) 四相 present | 9 |
| R-XH | (b) 月恩 / 時德 / 天赦 only | 0 |
| R-F1Y | (a) witnessed contexts (丑-甲申 ×3, 午-戊申 ×1) | 4 |
| R-F1Y | (b) other 五離 × 立券交易 contexts | 17 |

**Trigger extrapolation has no 2025–2027 impact.** No production row in this range moves on an untested trigger alone.
- **Y interaction.** Under R-JK/R-WX/R-XH alone, **44 rows become both_present**: the J rulings keep 忌, and the current Y default then notes both. Every page tested so far prints only_ji in that shape. The J rulings do not decide Y; Y-CONVENTION stays a separate debt.
- **R-F1Y reach.** It reaches **21** production rows (all 五離 × 立券交易 both_present), of which 17 never involved puzhu:06. Owner choice: adopt the draft for the whole 五離 × 立券交易 heading, or restrict it.
- **Goldens.** None was modified and no test was repinned.

## Y-CONVENTION

Not changed. U4 and U7 stay quarantined. BAIJI-Y is open. The other 16 ungraded gods are untested.

## Production and regression

- **Production:** unchanged (v4; `liftExclusions` still 五墓 and 五離 only). No change under `shared/almanac-data`, `p4OwnerRules.ts` or `p4Puzhu06.ts`. Earlier stage artifacts are untouched.
- **F1 R2:** unchanged. F1-Y production still reads both_present.
- **G2/W1:** CLOSED. **P21:** untouched.

## Owner decisions required

| Draft | Decision |
|---|---|
| R-JK | adopt / reject. 37 heading rows: 30 tested-trigger + 0 untested + 7 joint 開倉庫 (also moved by R-WX) |
| R-WX | adopt / reject. 14 rows, all tested trigger |
| R-XH | adopt / reject. 9 rows, all 四相; both witnesses are 四相 only |
| R-F1Y | adopt for the whole heading (21 rows: 4 on witnessed contexts + 17 others) / restrict to witnessed contexts (4) / reject |
