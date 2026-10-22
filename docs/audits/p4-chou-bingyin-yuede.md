# 丑-丙寅 月德 source audit and the Option C candidate (audit only)

2026-10-22, branch `claude/chou-bingyin-yuede-source-audit`, parent `163e050`. Nothing in production changes: no code, JSON, flag, adapter revision or Golden. Earlier audit commits are untouched.

Artifacts are in `sources/p4-vol10/chou-bingyin-yuede-v1/`:

| File | Contents |
|---|---|
| `yuede-check.json` | source, mapping, n75 reading, consistency |
| `build_candidate.py` → `candidate-final.json` | the candidate authority |
| `lock.json` | hashes of the above |

The test is `p4ChouBingyinYuedeAuditLock.test.ts`.

The question, from the [final gate](p4-option-c-final-gate.md): should 丑月 丙寅 carry 月德? The project's calculation and the n75 print were treated as competing evidence.

## YD1: canonical 月德 mapping (SOURCE_SUPPORTED)

卷五 義例三 月徳 (`vol05.raw.txt`):

> 歴例曰月徳者正五九月在丙二六十月在甲三七十一月在壬四八十二月在庚

- 曹震圭 derives it as 「以三合五行陽干為徳假令寅午戌三合為火以丙為徳」, so 巳酉丑 金局 gives 庚.
- The companion 月空 table is 「巳酉丑月甲」, the 衝 of 庚.

Month basis: 月建, with 正月 = 寅.

- The 月表 is arranged by 月建 month.
- A generic month-pillar page cannot express a lunar-month basis.
- Under either basis 十二月/丑 gives 庚, so no basis mismatch can produce 丙.

| 月建 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 | 子 | 丑 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 月德 | 丙 | 甲 | 壬 | 庚 | 丙 | 甲 | 壬 | 庚 | 丙 | 甲 | 壬 | **庚** |

## YD2: project calculation (VERIFIED)

`groupB.ts` holds `month-virtue` targets 丙甲壬庚×3, with row = (branch index + 10) % 12, so 寅 → row 0 and 丑 → row 11, which is 庚. `catHungAuthority.ts` month 12 / 丑 / 小寒 also has `yueDe: '庚'`.

- This is a direct transcription of 歴例 on a 月建 basis.
- There is no index, branch-order or stem-cycle offset.
- 月德合 (乙) and 天德 (庚) are separate rows, not conflated.
- The test checks all 12 months against the source mapping.

## YD3: n75 witness (READ, high confidence)

- **Page:** `06067697-n75.jpg`, SHA-256 `a86985f7…5d809`. Re-read from a crop of the 吉神 block of the stored 2332×3176 JPG; the locator is in `yuede-check.json` and the crop was not stored. No OCR.
- **Heading:** 丙寅鑪中火義除日.
- **吉神:** 天恩 月德 相日 | 吉期 不將 玉宇 | 五合 金匱 鳴吠對.
- **凶神:** 劫煞 天賊 五虛.

What the text says:

- The two glyphs are clearly 月德. 相日 follows directly, so the entry is not 月德合, 天德 or 天德合.
- **Month identity:** the page is 丑. 除日 on a 寅 day requires 建丑, 劫煞 on 寅 belongs to 巳酉丑 months, and the 十二月 不將 list contains 丙寅.
- **Alignment:** there is one day per page, so the 月德 cannot belong to an adjacent row.

## YD4: internal 月表 consistency (CONSISTENT except one cell)

All 67 locked pages were checked against the 歴例 tables for 天德, 天德合, 月德 and 月德合. 66/67 match on all four; the only miss is the 月德 on 丑-丙寅.

| 丑 page | Stem | 月德 printed | D-A expects | D-B expects |
|---|---|---|---|---|
| 丙寅 | 丙 | yes | no | yes |
| 庚寅 | 庚 | **yes** (with 天德) | yes | no |
| 壬寅 | 壬 | no | no | no |
| 戊寅 | 戊 | no | no | no |
| 甲子 | 甲 | no; prints 月空 | no | no |
| 甲寅 | 甲 | no; prints 月空 | no | no |

Answers to the consistency questions:

- **One mapping?** Yes. The 丑 月表 itself follows 庚: 庚寅 prints 月德.
- **Is 月空 consistent with it?** Yes. 月空 is printed on 甲 days, which matches a 庚 月德; under a 丙 system 月空 would fall on 壬, and 壬寅 doesn't print it.
- **A one-cell anomaly?** Yes.
- **Is there a second 德 operand for 丙 in 丑?** None in the 卷五 德 tables. 丑 天德 is 庚, 天德合 乙, 月德合 乙, 月恩 辛.

## YD5: independent corroboration (NOT PURSUED)

No other edition or scan was fetched. The primary rule, the project's transcription and the edition's own 丑-month pages (庚寅 月德, 甲 月空) all agree. A second edition would only explain how this one cell arose; it could not change the reading.

## Classification and decision

**Classification: WITNESS_PRINTING_ERROR.** This is a one-cell anomaly in this edition's 月表. It could be a printing or a compilation slip; the page alone cannot tell which. 丙 is the 月德 of 正月 (寅月).

**Decision: D-A.** 月德 is absent on 丑-丙寅. The n75 print stays in provenance permanently.

## Option C consequence

- The scope stays at 16 contexts.
- The candidate is **384 cells: 177 avoid, 207 blank**, all CONFIRMED and deterministic over 1,636 dates.
- Against the faithful table (`d79b08e`) it differs in exactly 3 cells, 未-壬申 wedding, engagement and moving (P17-A).
- The 未-戊申 owner ruling and the D-A decision change no cell.

| Open item | CAN_CHANGE_OPTION_C_TABLE |
|---|---|
| F1 | NO |
| puzhu:17 second clause | NO |
| puzhu:06 Q4 | NO |
| scope label SPEC_GAP | NO |
| medical adapter anomaly | NO |
| 未-戊申 witness conflict | NO (local owner ruling) |
| 丑-丙寅 月德 | NO (D-A, source-supported) |

- **F2_TABLE = COMPLETE.**
- **VOL10_OPTION_C = MIGRATION_READY.**
- **P4 = MORE_EVIDENCE_REQUIRED.** Its blockers are unchanged: F1, puzhu:17 second clause, puzhu:06 Q4 and the 四相 class, the scope label, the medical adapter, and the engine still on P17-0.

**Candidate authority:** `sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json`, status `AUDIT_ONLY_NOT_WIRED`.

- It records the schema, scope (key `${monthJian}${pillar}`), contexts, activities and all cells.
- It records provenance for H1-B, 相抵, OVERLAP, 鳴吠對 → 啟攢, 鋪註05, P17-A, the 未-戊申 ruling and the 丑-丙寅 decision, plus the evidence limit.
- It records the generator and input hashes.

Production implementation follows the design in [the 納財 audit](p4-weishen-nacai-puzhu21.md#option-c-implementation-design-only-once-the-table-is-closed). It waits for owner approval.
