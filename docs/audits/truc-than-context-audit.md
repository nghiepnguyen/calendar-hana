# Trực / Cát–Hung thần — context audit

Status: **AUDIT — inventory and gap analysis; no runtime, dataset or scoring change**
Date: 2026-10-10. Base: `audit/mansion-scan-page-fix` (PR #11) on main `8899a87`.
Request: handoff §23 next step #4 — audit context/conditions/exceptions of Trực and cát/hung thần before migrating them into conflict diagnostics.

## Why this matters

`analyzeEvidenceConflicts` only asserts a conflict when each witness carries `activityMapping`, explicit `conditions` with known operands and resolved `exceptions` (phần 27). Mansion evidence (1880) has all three. Trực and god contributions currently have none, so they are kept out of diagnostics. Before they can enter, each needs: (1) a source-locked activity list, (2) a source-locked **presence** rule with explicit operands, (3) explicit exceptions.

## 1. Trực (12 officers)

| Item | State |
|---|---|
| Presence | `getOfficer(jd, dayChi)` — Month Jian + day branch, exact Jie boundary. **Authority closed** (Month Jian / 12 Trực). |
| Activity rules | `truc.json`: 139 rules, all `reviewStatus: classical_text`, `sourceRef` 協紀辨方書 卷十一 (+3 from 卷十: 開日 kỵ an táng; 平日/收日 “止不忌…整容剃頭”). Parity test against `xiejibianfangshu-yiji.json` (28 用事 headings transcribed; the volume has many more, e.g. 開渠穿井, 修飾垣墻). |
| Levels | kien 14 bad/1 good; tru 3 good/1 strong_good; man 8 good/3 bad; binh 22 bad/1 neutral; dinh 0; chap 0; pha 22 strong_bad/2 strong_good; nguy 1 strong_good; thanh 9 good; thu 18 bad/3 good/1 neutral; khai 15 good/1 strong_good/1 bad; be 12 bad/1 strong_bad. |
| Weights | Product policy (`weight` per rule), not stated by the source. |
| Subsumption | Định ⊃ Tam Hợp; Thành ⊃ Tam Hợp, Thiên Hỷ; Phá ⊃ Nguyệt Phá (shown, not double-counted). |

Context needed for diagnostics: operand `OFFICER_INDEX` (or `MONTH_JIAN_BRANCH` + `DAY_BRANCH`); authority id per rule (`xiejibianfangshu-vol11`); activity mapping 用事 heading → activity ID (already explicit in `activityEntries`). **Gap: small** — the source and operands are locked; only the evidence shape is missing.

## 2. Cát/hung thần (scoring catalog, 44 gods)

Activity lists: `good-gods.json` (24) / `bad-gods.json` (20), `activityIds` derived from 協紀 卷十一 用事 宜/忌 lists (parity test). Weights and caps (`major 15 / medium 10 / minor 5`, cap 25; `critical −25 / major −15 / medium −10 / minor −5`, cap −30) are product policy.

**Presence** — how a god is found on a day. Counted over 1095 days (2025–2027):

| Presence source | Gods | Days present (of 1095) |
|---|---|---|
| Source-locked Cát/Hung authority (Month Jian, Phase 4D) | Thiên Đức*, Nguyệt Đức, Thiên Đức Hợp*, Nguyệt Đức Hợp, Nguyệt Phá, Kiếp Sát | 90–111 each |
| Catalog day rule with cited source | Trừ Thần (申酉), Ngày Đinh, Nhân Thần (lunar 12/15) | 183 / 109 / 74 |
| Legacy `stars.data.ts`, exact name, **lunar-month** `byMonth` | Thiên Xá, Nguyệt Ân, Dân Nhật, Tam Hợp, Thiên Hỷ, Lục Hợp, Ngũ Phú, Giải Thần, Phúc Sinh, Thánh Tâm, Ích Hậu, Tục Thế, Nguyệt Hình, Thiên Lại | 17–182 |
| **No presence source — never fires** | 7 good: Thiên Nguyện, Tứ Tướng, Thời Đức, Ngũ Hợp, Bất Tương, Thiên Thương, Phổ Hộ · 14 bad: Tai Sát, Nguyệt Sát, Nguyệt Hại, Nguyệt Yếm, Yếm Đối, Đại Thời, Tứ Phế, Tứ Kỵ, Tứ Cùng, Ngũ Mộ, Ngũ Ly, Vãng Vong, Bát Chuyên, Quy Kỵ | 0 |

\* Thiên Đức/Hợp: legacy kept on the four rows whose source token is a trigram (坤/乾/艮/巽), see §23 item 2.

Findings:

1. **21 of 44 scoring gods never fire.** `godMapping.ts` bridges only exact names and never infers aliases (deliberate, `docs/verification/mapping-scoring.md`). The day table has similar but unreviewed names: “Phổ Hộ (Hội Hộ)”, “Nguyệt Hư (Nguyệt Sát)”, “Nguyệt Yếm Đại Hoạ”, “Vãng Vong (Thổ Kỵ)”, “Phi Ma Sát (Tai Sát)”. Their identity with 普護 / 月煞 / 月厭 / 往亡 / 災煞 is unproven, so bridging by name would be an unaudited migration. Effect today: several major taboos (災煞, 月煞, 月厭, 往亡, 四廢, 五墓) and virtues (天願, 四相, 時德, 不將) are silently absent from scores. `godPresenceCoverage.test.ts` now locks this list.
2. **Operand mismatch for 14 legacy-bridged gods.** 協紀 defines these by Month Jian (月建) and day stem/branch; runtime evaluates `byMonth` on the **lunar month**. Days near a Jie boundary can get the wrong set (already observed for Trực Phá vs Nguyệt Phá, `mapping-scoring.md`). Classification: `CONVENTION_DIFFERENCE` against the source, `SOURCE_DEPENDENT` until each table is audited. Do not bulk-convert to Month Jian (§23 item 3).
3. **Activity list source is fine, presence source is the gap.** Every god's `activityIds` traces to 卷十一; what is not source-locked is *when* the god is present.

## 3. Exceptions (`overrides.json`)

| id | Action | Enabled | Source state |
|---|---|---|---|
| `de_virtues_reduce_yem_doi` | 德 gods halve 厭對 for wedding | **false** | `classical_exception_requires_runtime_source_verification`; 厭對 never fires anyway (finding 1) |
| `month_break_not_auto_cancelled` | preserve 月破 hard warning (wedding, engagement, moving, opening, construction, groundbreaking) | true | product guardrail, no citation |
| `dinh_day_blocks_haircut` | preserve Đinh-day haircut taboo | true | 協紀 卷十 “凡丁日忌剃頭亦不註宜整容” |

`resolutionOrder` is product policy. The classical 宜忌 precedence rules (卷十一 “凡…” notes such as 德 neutralising 煞, and per-heading “止忌” sub-notes, e.g. 開渠穿井 “壬日止忌開渠卯日止忌穿井”) are **not** encoded. Diagnostics must treat a god witness as having unresolved exceptions until these notes are transcribed per heading.

## 4. Coverage of the two new activities (PR #6)

`door_opening` and `waterworks` have no Trực/god rules, so they are always `no_evidence`. 卷十一 has candidate headings (checked on Wikisource 四庫全書本 卷11):

- **開渠穿井** — 宜 開日; 忌 土府 月破 平日 收日 閉日 劫煞 災煞 月煞 月刑 月厭 四廢 土符 地囊 土王用事後; note 壬日止忌開渠，卯日止忌穿井.
- **修飾垣墻** — 宜 平日; 忌 土府 月破 劫煞 災煞 月煞 月刑 月厭 四廢 土符 地囊 土王用事後.
- **補垣塞穴**, **修置産室** — also present.
- No heading contains 門.

開渠穿井 (dig channels and wells) is **not** proven equivalent to 1880 放水 (let water out); a mapping would be an interpretation decision. 修飾垣墻 is a candidate for the narrow wall scope, which the owner decided not to add as an ID (§23 #3).

## 5. Readiness for diagnostics

| Source | Activity list | Presence operands | Exceptions | Ready? |
|---|---|---|---|---|
| Trực | locked (卷十一) | locked (Month Jian) | 3 cited extras; 卷十一 notes not transcribed | **Near** — needs evidence shape + exception notes per heading |
| 6 Cát/Hung authority gods | locked | locked (Month Jian) | as above | **Near** |
| 3 catalog day-rule gods | locked | explicit, cited | Đinh override cited | **Near** |
| 14 legacy-bridged gods | locked | lunar `byMonth`, unaudited | — | **No** — presence audit per table first |
| 21 gods without presence | locked | none | — | **No** — need a presence authority (and alias decision) |

## Recommended order (not implemented)

1. Give Trực + the 9 locked/day-rule gods an evidence shape for diagnostics (operands, authority id, mapping) behind a test; no score change.
2. Transcribe 卷十一 per-heading notes (止忌/不忌, 德化煞) as explicit exceptions; until then mark god witnesses `unresolved_exceptions`.
3. Presence audit, one god table at a time, starting with the high-impact never-firing taboos (災煞, 月煞, 月厭, 往亡, 四廢, 五墓): source-lock the 協紀 definition (Month Jian + day operand), freeze an independent golden, classify every day diff; only then bridge or add.
4. Decide alias identities explicitly (e.g. whether “Phi Ma Sát (Tai Sát)” is 災煞); never by name similarity.
5. Separately decide whether 開渠穿井 supports `waterworks` rules.

Scores, verdicts, datasets and the frozen decision baseline are unchanged by this audit.

## Follow-up 2026-10-10: raw-source check of 卷十一 notes and one conditional clause (branch `audit/xieji-conditional-warehouse`)

Source read as raw wikitext (not a summary): Wikisource 欽定協紀辨方書 (四庫全書本) 卷11 (`action=raw`, SHA-1 prefix `ce4ed7f23ff9`) and 卷10 (`355dc6c8fe2d`).

### Notes in 卷十一

The whole volume has 8 `{{SK notes}}`. Seven are “X同” cross-references (e.g. 宴會 “會親友同”, 行幸遣使 “出行同”, 般移 “移徙同”, 興造動土 “修造同”). The eighth, under 祈福, is general: **“又忌禄空上朔等日見鋪註條例餘倣此”** — every heading is further subject to the 鋪註條例 taboos (祿空, 上朔, …) of 卷十. Those are additional 忌 witnesses (coverage), not exceptions to the listed rules. 祭祀's 忌 line “天狗寅日” is already in the dataset.

### Conditional clause — `ENGINE_BUG`, fixed

修倉庫 宜: “天德月德天德合月德合天赦天願三合滿日**又收日母倉六合五富天倉與月德四相時德開日併者**”. The second part means 收日, 母倉, 六合, 五富, 天倉 are good for repairing storehouses **only when combined with** 月德, 四相, 時德 or 開日 (卷十 confirms for 母倉: “與月恩四相開日併宜修倉庫”). The parity parser removed only “與…併者”, so 收日 (Trực Thu), 六合, 五富 and 天倉 were listed as unconditional 宜.

Fix (dataset 1.2.0 → **1.2.1**):

- Parser strips the whole “又…併者” clause; the parity test now requires the catalog to omit them.
- `truc.json`: removed Thu → warehouse (good, +15).
- `good-gods.json`: removed `warehouse` from Lục Hợp, Ngũ Phú, Thiên Thương.
- The conditional combination itself (e.g. Thu + Nguyệt Đức) is **not encoded**; those days now have no positive evidence from these sources rather than an unconditional one. Encoding combinations needs a co-presence rule shape (pending).

Migration proof (`xiejiConditionalMigration.test.ts`): a module rebuilt with the pre-fix catalog reproduces the frozen decision baseline hash on **all 1095 days**; production differs only in the `warehouse` activity on **220 days**, each where a removed rule had applied; every event verdict is unchanged (no event uses warehouse). Classified `EXPECTED_AUTHORITY_MIGRATION_CHANGE`.

### Where the resolution policy lives

卷十 宜忌 opens: **“舊厯宜忌多與神煞名義不合，且凡吉神所宜之事一遇凶煞則無論輕重而概忌之，尤為未當。今即其情之愛惡與其力之大小分合考訂”** — the authority itself rejects “any 煞 cancels any 吉神” and resolves by each god's nature and strength. Per-god notes (按) give strengths and combinations, e.g. 天赦/天願 “其氣純其力大乃日之最吉者能解諸凶”, 天恩 “與驛馬天馬建日併宜頒詔…”. This is the classical source for a future resolution policy (§23 #6); it is not encoded. The product's current caps/weights remain product policy.
