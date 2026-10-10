# Thiên Đức mixed operand resolution

Version 3.1.1; 2026-10-08. **Canonical decision: UNRESOLVED.** Multiple interpretations are historically documented, but no complete canonical DAY evaluator is admitted. Locked eight stems/four trigrams remain unchanged.

## Three models

| Model | Primary Support | Historical Support | Day Operand | Dated Evidence | Problems | Status |
|---|---|---|---|---|---|---|
| A — mixed day/direction | XJBF 卷五: eight stems, four 卦位; 天道 direction, 天德 day stems + direction | Monthly tables retain 坤乾艮巽 | Eight DAY_STEM; four directional positions | Two positive/two negative derived dated anchors in 寅 only | Directional aspect does not explicitly prove **no day match** at all in four months; false/null policy not prescribed | PARTIAL; no full mixed-model verification |
| B — named non-tomb reconstruction | 蠡海集 quoted by XJBF reports 巳亥寅申 group; compiler does not endorse canonical replacement | Miao scan p.36 explicitly 二月逢申日; p.37 describes contemporary errors in 天德合 | Source-specific months2/5/8/11: 申/亥/寅/巳, not an inferred conversion | No admitted branch-month dated anchors in this package | Older work differs from XJBF editor's logic; no cross-tradition blending | Historical DAY usage documented; canonical admission NO |
| C — tomb reconstruction | XJBF reports another view: 二月未/五月戌/八月丑/十一月辰 | 蠡海集 alternative discussion | Branch interpretation stated; dated application unverified | None admitted | Compiler preserves theory as explanation, not an instruction to rewrite four rows | Reported tradition only; not admitted |

## Exact wording, editor stance and source hierarchy

[Canonical 卷五](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷05): “以天干者八以卦位者四”; also “天道…專言其方…天徳…兼日干與方向”. Strong support for a mixed representation. The editorial objection is that branch life-cycle arguments should not be mixed into a system expressed in heavenly stems. It retains the tomb account as one explanation: “聊存以傳一解可也”. This is **not an affirmative choice of B or C**.

The absence-of-day statement discussed previously concerns **天德合**, not an unconditional no-day-match axiom for 天德. This scope distinction matters: do not make A return false for four months simply from the 合 paragraph.

[蠡海集 transcription](https://www.shidianguji.com/book/SK1903/chapter/1jpic4a1375sa) contains non-tomb and tomb interpretations. Some OCR/transcription wording differs from XJBF quotations; comparison is textual evidence, not a basis to silently repair canonical extraction. Four branches as a set do not by themselves establish each month's DAY mapping.

New [Miao facsimile](https://upload.wikimedia.org/wikipedia/commons/0/0f/Shanghai_%E5%A4%A7%E6%B8%85%E6%99%82%E6%86%B2%E6%9B%B8%E7%AE%8B%E9%87%8B%E4%B8%80%E5%8D%B7.pdf) p.36 right, 天德 section, directly says:

> 正月節氣內逢丁日即是天德所值之日二月逢申日即是天德所值之日

The nearby twelve-position row retains 丁/坤/壬/辛/乾/甲/癸/艮/丙/乙/巽/庚 and marks four corner “宮” with branch correspondences. Hence B is **reported source-specific historical DAY usage**, not a guessed 坤→申 conversion. This older commentary cannot override the later XJBF editor without a reviewer selecting a named variant.

Miao p.37 天德合 notes missing four-month 合 entries because four corners are not stems, then critiques contemporary strong branch combinations as erroneous (e.g. combining 二月 坤申 with 巳). This is evidence that branch-day usage and a warning against arbitrary 合 reconstruction coexisted in this author. Do not import 合/day conclusions between rules.

For C, the source gives the month-wise tomb branches, but no independently dated usage for the four unresolved months was admitted. A symbolic passage alone is not a dated anchor.

## Newly reviewed canonical correction list

[御製序 / 奏議 / 計開](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/全覽1), 全覽1 L149–150, supplies an additional **canonical transcription** statement:

> 天徳不用地支故不用辰而用巽

It asks to correct old Tong Shu entries, including the 子-month form rendered 巳 where the intended corner is 巽. This strengthens the canonical recommendation to retain the mixed stem/trigram representation and weakens an automatic canonical adoption of Miao's older branch reconstruction. It still does not supply an executable direction input or an explicit false/null DAY result for all four corners. The operational decision stays UNRESOLVED; no existing extraction is edited.

## 月表 compatibility

A preserves canonical monthly table symbols directly. B/C are interpretations of the four corners, not replacements proven by the printed symbols alone. Retaining a trigram in a monthly directional row does not prove either an independent day match or its absence. No model blend and no alias merging across interpretations.

## Dated evidence and recommendation

`calendar-group-b-dated-anchors.json` contains two positive and two negative first-month stem anchors for Thiên Đức, each derived from visually inspected HKO date cells + independently sourced 丁 rule. They do not discriminate A/B/C; all three agree on that resolved row. Four-month direction/branch dated examples are still missing.

**Allowed-result decision: UNRESOLVED**, with documented multiple historical traditions. Do not claim MIXED_MODEL_VERIFIED or NAMED_BRANCH_RECONSTRUCTION_VERIFIED for the canonical engine. Named Miao reconstruction can be considered separately only after reviewer choice and suitable dated evidence. Other five rules proceed independently once their own cutoff is admitted.

Source details/access results: full source log in `calendar-group-b-cutoff-resolution.md` and JSON. Miao relevant pp.36–37 visually inspected, p.5 preface 1723; printing date unknown. XJBF 四庫 transcription, work 1741, no canonical facsimile collation. 蠡海集 edition year unknown, transcription only. No severity, activity expansion, scoring or production changes.
