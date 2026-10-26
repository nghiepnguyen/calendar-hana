# Hạng mục đã hoàn thành

> Lưu trữ chi tiết các phase/migration đã đóng & deploy, tách từ PROJECT_CONTEXT 2026-10-26. Sửa tại chỗ khi cần đính chính; không ghi trạng thái mới ở đây. Trạng thái hiện hành: [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md). Lịch sử PR/deploy: [`history.md`](history.md).

## Bảng phase đầy đủ

| Phase / hạng mục | Trạng thái | Authority / tài liệu |
|---|---|---|
| Calendar core, Month Jian/12 Trực, Group A/B | CLOSED | `docs/group-b/`, `docs/rules/` |
| Astronomy | CLOSED | JPL DE440s frozen, `astronomy-authority-v4`, `clock-v1`; ERFA chỉ là verifier; `docs/astronomy/` |
| 28 Tú identity | CLOSED | `index = ((jd + 11) % 28 + 28) % 28`; `docs/audits/28-mansion-provenance.md` |
| Hỷ/Tài/Phúc Thần | CLOSED | Operand `DAY_STEM`; history §17 |
| 4C Hoàng/Hắc đạo | CLOSED & DEPLOYED | 協紀 卷七, `day-gods-authority-v1`; `docs/audits/hoang-hac-dao-provenance.md` |
| 4D Cát/Hung thần | CLOSED & DEPLOYED | Mỗi thần là authority riêng (nguồn/operand/month basis); history §5 |
| 5 Thụ Tử | CLOSED & DEPLOYED | 六壬大全 卷十九, `thu-tu-authority-v1`, `MONTH_JIAN`; `docs/audits/thu-tu-sat-chu-provenance.md` |
| 5 Sát Chủ / Sát Sư | **SOURCE_DEPENDENT**, DEPLOYED (PR #8, #78, #80) | Tháng âm; tháng nhuận dùng bảng tháng gốc (S2). Sát Chủ 7 Hợi / 8 Sửu thống nhất calendar ↔ personal (PR #8); ý nghĩa "Đại kỵ cất nhà, cưới gả, an táng; hạn chế việc trọng đại." Ngọc Hạp Chánh Tông tr. 128–133: Tháng Sát Chủ, Bốn Mùa Sát Chủ, Sát Chủ Trong Bốn Mùa (mùa = tháng âm 1–3/4–6/7–9/10–12), Ngày/Tháng Sát Sư (kỵ riêng thầy cúng), giờ Sát Chủ (`HourGrid` + "Giờ phù hợp với bạn"). Bảng ghim trong `shared/lunar/satChuAuthority.test.ts`; `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md` |
| 6 Thái Tuế/Tuế Phá/Tam Sát | CLOSED & DEPLOYED | `annual-directions-authority-v1`, boundary 立春 exact instant; `docs/audits/tai-tue-tue-pha-tam-sat-provenance.md` |
| 7 28 Tú 宜/忌 | CLOSED & DEPLOYED (PR #84); content **1.0.4** | 玉匣記 1880, `mansion-content-yuxia-1880-v1`, 115 clauses; `docs/audits/28-mansion-content-provenance.md` (lịch sử); hiện hành: mục "28 Tú — audit" |
| Activity taxonomy/mapping/diagnostics/explainability | DEPLOYED; audit 28 Tú đóng | Mansion 115 + 用事 29: **DOUBLE_REVIEWED (semantic mapping)** — hai lượt AI-agent độc lập, chưa có chuyên gia văn bản người (mục "28 Tú — audit"); review lượt 1: `docs/audits/xieji-activity-mapping-review.md` |
| Trực/thần + 卷十 diagnostics | DEPLOYED | `docs/audits/truc-than-context-audit.md`, `xieji-vol10-resolution.md`, `xieji-monthly-sha-presence.md` |
| Thiên Đức legacy tháng quẻ | RESOLVED, bỏ theo 月表 (PR #21) | `docs/audits/tiande-yuebiao.md` |
| 百忌日 甲日/乙日 | DEPLOYED (PR #26) | `docs/audits/baiji-giap-at.md` |
| 百忌日 寅/酉/申/未 (祭祀/宴會/安牀/求醫療病) | DEPLOYED (PR #40) | `docs/audits/baiji-dayzhi.md`; chỉ activity đổi, event không đổi |
| 百忌日 巳日 出行 / 亥日 嫁娶 | DEPLOYED (PR #42) | `docs/audits/baiji-ty-hoi.md`; `travel` = Xuất hành (owner) |
| P1 天狗寅日 「不註宜求福祈嗣」 | DEPLOYED (PR #76) | `docs/audits/p1-tiangou-yin.md`, PRD `tasks/prd-p1-tiangou-yin.md`; Golden `golden-p1-tiangou-yin.json` freeze `338b8dc` |
| Coverage P2 / R5 — 百忌日 + hard warning | DEPLOYED (PR #47) | `docs/audits/baiji-production-coverage.md` |
| 土王用事 | DEPLOYED (PR #29), còn SOURCE_DEPENDENT | `docs/audits/tu-vuong-dung-su.md` |
| Event bỏ activity phụ trùng heading | DEPLOYED (PR #37, #38) | `open_business` bỏ `business`, `sign_contract` bỏ `transaction`, `groundbreaking` bỏ `construction`; proof `kaishiDoubleCountMigration.test.ts`, `sameHeadingDuplicateMigration.test.ts`; mapping cũ ở `legacyEventMapping.ts` |
| P3a — định nghĩa 協紀 cho 35 thần | DONE (PR #43, audit) | `shared/almanac-data/xieji-god-definitions.json`, `xiejiGodDefinitions.test.ts` |
| P3b — presence evaluator | DONE (PR #44) | `shared/lunar/xiejiGodPresence.ts` (`xieji-god-presence-v1`), `xieji-god-tables.json`; `docs/audits/xieji-god-presence-2025-2027.tsv` |
| Release A — 14 thần legacy theo Month Jian | DEPLOYED (PR #45) | Flag `legacyGodsMonthJian`; Golden `golden-legacy-gods-month-jian.json` (đóng băng `70ed321`); `docs/audits/dormant-legacy-gods.md` |
| 月破 子午未申 仍忌 | DEPLOYED (PR #49) | `yuePoStillAvoidPolicy.ts`, `yuePoStillAvoidMigration.test.ts`; 11/1095 ngày đổi điểm `medical`/`demolition`; `docs/audits/yue-po-still-avoid-release.md` |
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`; Golden hiện hành `golden-xieji-vol10-scoring-v5.json` (G1-SOIL, 58 case); v2–v4 (PR #87, #102, #103) và v1 `golden-xieji-vol10-scoring.json` giữ nguyên byte, test ghim rollback |
| 卷十 劫煞 Option C v1 | **DONE & DEPLOYED** (PR #87, `85736fd`, 2026-10-22) | mục "卷十 劫煞 — Option C v1"; [báo cáo](../../docs/audits/p4-jiesha-option-c-migration.md) |
| G1 壞/壊 (破屋壊垣) | **ĐÓNG & DEPLOYED** (PR #89, #90, #97–#99 score P4; #103 glyph Stage 2, #104 G1-SOIL ở authority 劫煞) | mục "Nợ chữ heading G1 / G2"; [G1-a](../../docs/audits/p4-g1a-demolition-authority.md), [G1-b Stage 2](../../docs/audits/p4-g1b-stage2-migration.md), [glyph Stage 2](../../docs/audits/p4-g1-glyph-stage2-migration.md), [G1-SOIL](../../docs/audits/p4-g1-soil-stage2-migration.md) |
| G2 劵/券 (立券交易) | **ĐÓNG & DEPLOYED** (PR #100 audit, #102 Stage 2, #105 W1) | mục "Nợ chữ heading G1 / G2"; [spec](../../docs/audits/p4-g2-vol10-heading-match.md), [Stage 2](../../docs/audits/p4-g2-stage2-migration.md) |
| F1 五離 × 立券交易 / Q4-REST | **MIGRATED & DEPLOYED** (PR #106 authority puzhu:06 v4, #107 v5) | mục "F1", "Q4-REST" |
| P4 — cân bằng 卷十 | **ON** (PR #71, 2026-10-18) | Roadmap (dưới); soil `p4-soil-owner-convention-v1` OWNER_ADOPTED_SOURCE_DEPENDENT, canonical S1 PARTIALLY RESOLVED (còn mở onset khi 四立 rơi sớm trong ngày). [progress](../../docs/audits/p4-vol10-progress.md), [P4-B](../../docs/audits/p4-vol10-remaining-ji.md), [activation](../../docs/audits/p4-activation.md) |
| CI | Local từ 2026-10-19 (`tooling.md`); GitHub chỉ deploy | Shard unit trên Actions (PR #52/#53) đã thay bằng `check`/`test:changed`/`ci:full`/`ci:p4` chạy ở máy (PR #74); PR #91–#93 thêm `check:audit-clean`, `ci:p4:fast`, `ci:p4:full` |
| Analytics PostHog | DEPLOYED (PR #94) | Proxy first-party `https://e.lich.thanhnghiep.top` (`VITE_POSTHOG_*`, CSP trong `firebase.json`) |
| PWA update (`/version.json`, toast "Có phiên bản mới") | DEPLOYED (PR #57, #58) | `docs/pwa-update-strategy.md`; version hiển thị = ngày build `YY.MM.DD` giờ VN. Chưa kiểm tay trên iPhone Home Screen |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng | Personal annual afflictions giữ convention cũ, chưa chứng nhận |

## 28 Tú — audit (đóng & deploy 2026-10-21, PR #84 `ac25ce6`)

Commit: `2be48a7` (sửa nguồn + migration P4), `ed59e09` (ontology xây dựng), `49bfc00` (evidence confidence), `8bcf250` (docs). Content `mansion-content-yuxia-1880-v1` **1.0.4** (manifest khớp).

- **Chứng nhận:** `DOUBLE_REVIEWED (semantic mapping)` — 115 clause 28 Tú và 29 mapping 用事 được rà soát ngữ nghĩa độc lập hai lượt. **Cả hai lượt do AI agent thực hiện; chưa có chuyên gia văn bản người.** Không chứng nhận bản chép ngoại giao (diplomatic transcription). Trạng thái: SECONDARY_REVIEW_COMPLETE, DISAGREEMENTS_RESOLVED, ONTOLOGY_DECISIONS_RESOLVED, EVIDENCE_CONFIDENCE_MODELED. Mapping blocker còn lại: **không có**.
- **Mapping:** 111 `exact_catalog_pair`, 3 `unmapped` (gap có chủ ý, không phải blocker), 1 `not_operative` (星-4); 115/115 `interpretation_reviewed`. Gap: 婁-1 竪柱 (PARTIAL_RITUAL — phần đầu của 豎柱上梁/beam_raising), 軫-1 臨水造龍宮 (INSUFFICIENT_SEMANTIC_EVIDENCE), 鬼-6 修土築牆 (`construction_wall`: đắp đất làm tường, không phải động thổ; owner 2026-10-10 không tạo ID xây dựng hẹp).
- **Ontology (owner):** construction ← 張-1 造龍軒, 危-1 造高堂, 翼-1 架高堂, 星-1 造新房. renovation ← 修宮室, hợp đồng "sửa/cải tạo nhà hoặc công trình đang có"; không map sang 修造/興造動土.
- **Sửa nguồn (secondary review, 5 DISAGREE):** 亢-2, 房-2, 心-2, 斗-2, 壁-2 chép sai quote, đã sửa theo scan; 斗-2 dùng term mới 墳堂修築 → `funeral_grave_repair` (resolver xác nhận).
- **Evidence confidence:** semantic VERIFIED/PROBABLE/UNCERTAIN; transcription EXACT/NORMALIZED/IDENTIFIED/PARTIAL/UNCERTAIN; basis scan_read/digital_transcription; vị trí ký tự tính từ 1. **Không có default toàn cục**; chỉ dataset 28 Tú 1.0.4 khai báo default VERIFIED/IDENTIFIED/scan_read (`source.evidenceConfidence`). Phân bố 28 Tú: semantic VERIFIED 115; transcription EXACT 0, NORMALIZED 3, IDENTIFIED 111, PARTIAL 1, UNCERTAIN 0 (IDENTIFIED = nhận đúng chữ, chưa xác minh dị thể in). Ngoại lệ: 壁-1 vị trí 6 庄→莊, 參-5 vị trí 7 尅→克, 井-1 vị trí 6 蚕→蠶 (NORMALIZED); 柳-2 PARTIAL, quote `埋葬瘟□多□□`, uncertainPositions [4, 6, 7] — không còn là blocker vì kết luận burial/hung dựa vào chữ đọc chắc 埋葬.
- **用事:** 29 mapping đã rà soát ngữ nghĩa hai lượt; basis digital_transcription (Wikisource), chưa hiệu đính đủ với scan 四庫; schema evidenceConfidence chưa áp dụng cho 用事 (giới hạn provenance, không phải blocker).
- **Migration P4 (`p4-adapter-baseline-v1/lock.json` `revisions[]`, owner duyệt):** rev 1 SOURCE_TRANSCRIPTION_CORRECTION (5 quote + resolver 斗-2; 196 activity + 78 event, 0 thay đổi hành vi); rev 2 ONTOLOGY_NORMALIZATION (117 activity, 0 event, 0 hành vi); rev 3 EVIDENCE_CONFIDENCE_MODELING (159 activity, 80 event, 0 hành vi). Revision cũ giữ nguyên; lock `p4-score-golden-v2` giữ hash input lịch sử `d71c0162…`.
- **Bài học quy trình:** hash baseline P4 bao gồm nội dung provenance/evidence (vd. `sourceQuote`), nên sửa nguồn/evidence có thể đổi hash mà không đổi hành vi. Migration sau phải tách hành vi / provenance-nội dung / hash dẫn xuất, so toàn bộ leaf của record; hash đổi ≠ lịch đổi hành vi.
- **Kiểm chứng gần nhất (49bfc00):** `npm test` 8199 pass / 0 fail / 6 skipped; P4 targeted 25/25; P4 read-only (migration/adapter/owner FULL, golden.py) PASS; lint, typecheck, build PASS; Playwright `mansion-content.spec.ts` PASS. Mutation scripts không chạy ở phase evidence confidence.
- **Artifact:** `tasks/calendar-audit/{secondary-review, secondary-review-resolution, p4-baseline-source-correction, ontology-resolution, ontology-resolution-implementation, evidence-confidence-policy}/`. Artifact cũ ghi trạng thái đúng tại thời điểm đó; trạng thái **hiện hành** xem `evidence-confidence-policy/certification-final.*`, `evidence-confidence-policy/implementation.*`, `ontology-resolution-implementation/implementation.*`. Không sửa artifact lịch sử cho khớp hiện tại.
- **Follow-up không chặn:** ghi chú UI cho NORMALIZED; evidenceConfidence cho 用事; review văn bản bởi chuyên gia người nếu cần chứng nhận transcription mạnh hơn.

## 卷十 劫煞 — Option C v1 (DONE & DEPLOYED 2026-10-22, PR #87 `85736fd`)

Commit: `fe40968` (authority + runtime + policy), `db905d8` (Golden v2, migration diff, gate), `e85451f` (docs). Báo cáo: [`docs/audits/p4-jiesha-option-c-migration.md`](../../docs/audits/p4-jiesha-option-c-migration.md).

- **Vấn đề:** 協紀 卷十 劫煞 tháng 辰戌丑未 không 德 「凡所忌者則不註宜所宜者亦不註忌」. Resolver cũ đọc là `cancel_both` (bỏ chú mọi heading 劫煞); 月表 phản bác (39/39 cụm). Đọc trung thực: heading có 宜 không chú, heading không 宜 giữ 忌 劫煞, sau cặp 鋪註.
- **Chuỗi audit** (history §43): H1-B → 相抵 → impact OVERLAP → simulator trung thực (鳴吠對 → 啟攢, 鋪註05) → puzhu:17 P17-A (未-壬申 +3 ô) → 未-戊申 納財 (owner: nguồn thắng 1 ô 月表 tự mâu thuẫn, **cục bộ**, ô không SOURCE_WITNESSED) → 丑-丙寅 月德 (歴例 十二月 庚 → D-A; n75 = WITNESS_PRINTING_ERROR).
- **Authority audit:** `docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json` (SHA-256 `b24f6f68…1946`): 16 context × 24 activity = 384 ô, 177 avoid / 207 blank, CONFIRMED, cố định theo (Month Jian + trụ ngày, activity) suốt 1900–2100.
- **Production projection v1** (lịch sử; hiện hành v4, PROJECT_CONTEXT §2): `shared/almanac-data/xieji-vol10-jiesha-authority-v1.json` (`xieji-vol10-jiesha-faithful-v1`) + `shared/lunar/xiejiVol10JieshaAuthority.ts`. Chỉ phủ phần authority mà chuẩn hoá heading hiện tại của `resolveVol10` chạm tới: **352 ô APPLIED** (22 activity; 171 avoid / 181 blank); contract/transaction **UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION** (32 ô giữ làm provenance; 劫煞 ghi 立劵交易, `NORM` không có 劵→券); demolition **EXCLUDED_PENDING_GLYPH_AUDIT** (resolver đọc 破屋壞垣 → 破屋壊垣 nhưng audit không có ô; giữ `cancel_both`, gắn `authorityExclusion`). **Không** nói cả 384 ô đều chạy ở runtime.
- **Predicate:** depth 0, entry `jie_sha`, Month Jian 辰戌丑未, 德 chắc chắn vắng (`withVirtues === false`) → nhánh `otherwise` = `cancel_both`, policy `faithful-v1`. Key `${monthJian}${pillar}` (vd. `丑丙寅`). Lỗi to: context lạ, thiếu ô APPLIED, chạm activity UNREACHABLE; authority hỏng → lỗi khi import. Không đổi: `cancel_both` chung, 災煞/月煞/月刑/重日/復日, 德, chuẩn hoá heading, P4, adapter medical, scope label; `classicalResolution.version` vẫn `xieji-vol10-v2`.
- **Tác động thật 1900–2100** (2.710 ngày chạy): 1.615 ngày; 17.631 verdict → avoid (211 trên 21 ngày 2025–2027 không đổi điểm vì P4 chấm); 17.420 activity −15 (neutral→watch 11.764, watch→avoid 3.223, recommended→watch 1.615, consider→avoid 818); 0 activity 2025–2027; event: move_house 1.022, wedding 818, groundbreaking 424, open_business 312 (caution→not_recommended); 0 ngoài scope.
- **Đối chiếu simulator:** bằng đúng simulator dựng từ candidate trên mọi ngày; so simulator `d79b08e`: chỉ khác ở P17-A 未-壬申 (312) và hàng 2025–2027 do P4 candidate của simulator (134 activity, 58 event), dư 0.
- **Golden:** `golden-xieji-vol10-scoring-v2.json` (46 case, kế nhiệm); v1 giữ byte (`c3d8b0d7…`). P4 Golden v2, astronomy/JPL không đổi.
- **Gate:** 14 mutation (`scripts/audit-vol10-jiesha-mutations.py`, trong `ci:p4`); `ci:p4` và `ci:full` PASS trước merge.
- **Nợ kỹ thuật/nguồn:** đã trả hết — contract/transaction APPLIED từ authority v2 (G2, PR #102), demolition APPLIED từ v3 (PR #103) và v4 phụ thuộc ngày (PR #104) (mục "Nợ chữ heading G1 / G2").

## Nợ chữ heading G1 / G2 (ĐÓNG & DEPLOYED, cập nhật 2026-10-26)

**G1 — 破屋壊垣 / 破屋壞垣 (demolition): ĐÓNG & DEPLOYED.**

- Danh tính: `SAME_ACTIVITY_ALIAS_CONFIRMED` (G1-a, PR #97). Canonical 破屋壊垣; alias 破屋壞垣 → 破屋壊垣; `sourceRaw` giữ chữ nguồn. 土王用事後 = 忌 theo khoảng ngày, không thuộc danh tính, không phải điều kiện alias. Bằng chứng 卷十/卷十一 là bản chép Wikisource (transcription-derived), chưa đọc lại scan.
- Lỗi harness G1-a: **bỏ sót match**, không phải gộp sớm. 6 harness audit đóng băng key activity bằng `canonP4Heading` (chỉ 劵→券) trong khi phía 劫煞 qua `splitHeadings` (壞→壊) → demolition `not_listed`. Harness cũ giữ nguyên (lock); harness kế nhiệm `p4G1aDemolitionEngine.test.ts`.
- 4 witness conflict (丑-甲寅/丙寅/壬寅, 未-戊申) = DEPENDENCY_CONFLICT: ngày đại diện nằm trong cửa sổ 土王用事; 月表 không có ngày nên chỉ chứng cho trạng thái không 土王 → 16/16 khớp.
- G1-b (score adapter): lệch key duy nhất ở `p4ScoreAdapter` (đọc 破屋壞垣, provider trả 破屋壊垣). Stage 1 PR #90 (hạ tầng, `source-key-v1`), spec PR #98, **Stage 2 PR #99** bật `canonical-v1`. Envelope đúng spec: 1.095 ngày, demolition 353 ngày đổi điểm/status (điểm 320: 223 giảm / 97 tăng; status 337), hard warning 0, activity khác 0, ngoài miền 0; thêm 291 dòng chỉ đổi evidence/state. 5 ngày owner witness (2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02, 2027-07-28): `baseline/35/watch` → `only_ji/20/avoid`, cơ chế: canonical match → `only_ji` (土王用事後 protected) → rời vol10 path → `applyP4Balancing` giữ Kiếp Sát applied −15; không đổi thuật toán.
- Evidence Stage 2: Score Golden v3 (`p4-score-golden-v3/`, generator Python độc lập chạy adapter v2 đóng băng, freeze trước flip `e4c0926`), migration diff v3 (`p4-migration-diff-v3/`, 644 dòng, 353 đổi kết luận, 0 UNEXPECTED), rollback proof (`rollback.json`: canonical-v1 = v3, source-key-v1 = v2 = byte `1ed3828`, re-enable = v3). `datasetVersion` giữ 1.2.1, `P4_SCORE_ADAPTER_VERSION` giữ `p4-score-adapter-v1` (lý do trong báo cáo Stage 2).
- **Glyph Stage 2 (PR #103 `d5c005f`, Deploy #46):** owner R3 — authority 劫煞 v3 thêm 11 ô demolition tĩnh; 5 context phụ thuộc 土王用事 tạm `EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY` (fail-loud). Envelope 1900–2100: 2025–2027 = 0; ngoài miền 1.119 ngày demolition −15 (neutral→watch 464, watch→avoid 655); activity khác 0, event chỉ đổi stamp authority. 卷十 Scoring Golden v4; P4 Score Golden v4 không đổi.
- **G1-SOIL (PR #104 `aebcf2e`, Deploy #47):** owner R2 — rule service `shared/lunar/thoVuongDungSuRule.ts` (`tho-vuong-dung-su-rule-v1`, cửa sổ [立−18, 立−1], JPL, chỉ 1900–2100, UTC+7) + authority v4: 5 context `APPLIED_DATE_DEPENDENT` (trong 土王用事 = avoid, ngoài = blank), không ô tĩnh. `getVol10JieshaRuntime` cần `civilDate` (thiếu → throw). Envelope: 2025–2027 = 0; ngoài miền 298 ngày watch→avoid −15, bằng đúng Stage 1 `r2-impact.tsv`. 卷十 Scoring Golden v5 (58 case).
- G1 không còn mục mở.

**G2 — 立劵交易 / 立券交易 (contract, transaction): ĐÓNG & DEPLOYED** (Stage 1 PR #100, Stage 2 PR #102 `f3c68c6` Deploy #45, W1 PR #105).

- Danh tính: `SAME_ACTIVITY_ALIAS_CONFIRMED`. 卷十 ghi 立劵交易 (32×); heading thân 卷十一 立劵交易 (một mục 宜/忌; scan 06067687 tr. 42 đọc 劵, độ tin cậy trung bình); danh sách 萬年書 trong 卷十一 ghi 立券 và 交易 thành hai ô (tổng 67/37/60 chỉ khớp như vậy), 卷十一 gộp thành một heading như mọi cặp khác.
- **Chỗ lệch thật:** khớp heading 卷十 trong `resolveVol10` (`NORM` không có 劵) → contract/transaction luôn `not_listed` ở 月破/平日/收日/劫煞/月厭/月刑 (+月煞/災煞 qua `avoidSameAs`). **Không** phải score lookup P4 (P4 đã gập 劵→券 qua `canonP4Heading`).
- Phạm vi Stage 2 (đã ship đúng như đóng băng): một entry `headingAliases` `立劵交易 → ["立券交易"]` trong `xiejibianfangshu-vol10-yiji.json` + **authority 劫煞 v2** (contract/transaction → APPLIED với ô đã duyệt). Alias đơn lẻ làm guard authority throw. Cấm: gập `NORM` 劵→券 toàn cục, sửa bản chép nguồn, đổi P4/lookup, đụng G1-b.
- Phán quyết owner 2026-10-25: authority v2 **DUYỆT**; phạm vi ngoài miền P4 + event **CHẤP NHẬN**; `未-戊申 × contract/transaction = BLANK` (giữ authority hiện hành); ngữ nghĩa BLANK = **I1**: authority hoạt động khi chạm tới (bỏ phạt 劫煞), hành vi "không khớp" cũ không phải authority, không thêm thiết lập tương thích.
- Envelope I1 (đóng băng ở Stage 1, Stage 2 tái tạo đúng từng field, unexpected 0): 2025–2027: 24 dòng activity đổi kết luận (12 ngày, 0 giảm / 24 tăng), status 24, hard warning 0, activity khác 0, P4 state 0; event 4.330 đổi (108 điểm / 72 phân loại). 1900–2100 ngoài miền: 13.856 dòng đổi kết luận (2.020 giảm / 11.836 tăng), status 13.254, hard warning 0, activity khác 0; event mỗi ngày 289.270 đổi (62.352 điểm / 44.942 phân loại). Gồm 212 dòng + 1.060 event phụ thuộc ô BLANK 未-戊申 = `EXPECTED_G2_MIGRATION_CHANGE`.
- Kế nhiệm Stage 2: P4 Score Golden v4 (v3 → v4: 24 dòng, 12 ngày), baseline v2, 卷十 Scoring Golden v3; authority 352 → 384 ô APPLIED. `datasetVersion`, `P4_SCORE_ADAPTER_VERSION`, `canonical-v1`, policy `faithful-v1`: không đổi. Event đổi thêm stamp `classicalResolution.items[].authority` (v1 → v2) trên 1.636 ngày scope 劫煞 — không phải đổi ngữ nghĩa (gate chuẩn hoá stamp). [Báo cáo](../../docs/audits/p4-g2-stage2-migration.md).
- Mục authority `未-戊申 × 立券交易` (W1): **ĐÓNG** 2026-10-26 bằng phán quyết owner CỤC BỘ D1(a) — phán quyết 納財 cục bộ lan qua hệ quả trực tiếp puzhu:21 sang 立券交易; ô 劫煞 giữ BLANK / I1, không SOURCE_WITNESSED; không migration ([Stage 3](../../docs/audits/p4-g2-n117-stage3-owner-ruling.md)). 五離 × 立券交易 cấp heading (F1) xử lý riêng: MIGRATED (PR #106).

## F1 — 五離 × 立券交易 (MIGRATED & DEPLOYED 2026-10-26, PR #106 `7a38f09`, Deploy #49)

Tên trùng: mục này **khác** dòng F1 cũ (bảng "Việc độc lập" đã đóng, cuối file) (鋪註 puzhu:06 audit, P5 F1) và khác blocker "F1 lan truyền xuyên thần" của P4-劫. Không gộp với W1.

- **Luật authority cuối (owner R2_APPROVED 2026-10-26):** trigger chung của puzhu:06 Q4 (天願, 月恩, 四相, 時德) **không** gỡ 忌 立券交易 của 五離. Lifter riêng của 五離 (卷十 「與天德月德天德合月德合天赦三合六合併則不忌」) vẫn là authority. 宜 độc lập của 立券交易 không xoá 忌 五離 còn sống (→ `both_present`).
- **Phạm vi:** chỉ 五離 × 立券交易. **Không** áp cho 九空/五虛/小耗/五墓 (nợ Q4-REST).
- **Luật 3 (宜 → `both_present`) đã bị thay** bởi owner R-F1Y (2026-10-26, Q4-REST Stage 3): 五離 là 忌 sống sót duy nhất + 宜 độc lập trên 立券交易 → `only_ji`. Trục J của R2 không đổi.
- **Chuỗi provenance:**
  - Stage 1 `372c6be`: lấy 2 witness quyết định cùng edition 四庫 (06067696 n14 戌-壬申, n62 戌-庚申), cả hai in 立券交易 ở dòng 忌 → **F1-B SUPPORTS WULI-NARROW** ([báo cáo](../../docs/audits/p4-f1-wuli-lijuan-stage1-witness-acquisition.md)).
  - Stage 2 `2e3f50a`: đối chiếu authority, đề xuất **R2 REVISE Q4 FOR 五離 ONLY**, đo impact production ([báo cáo](../../docs/audits/p4-f1-wuli-lijuan-stage2-authority-reconciliation.md)).
  - Stage 3: `d74eb23` đóng băng phán quyết owner R2 → `56d19a2` production chuyển sang authority puzhu:06 v4 → `906c5c2` đóng băng envelope migration → `4095343` cập nhật bản ghi mutation ([báo cáo](../../docs/audits/p4-f1-wuli-lijuan-stage3-migration.md)).
- **Authority production:** `p4b-puzhu06-v4` (cơ chế `liftExclusions` như Q4a 五墓; danh sách trigger tính từ câu 卷十, không gõ tay). `p4b-puzhu06-v3` giữ làm rollback.
- **Impact 2025–2027 (tính lại từ code đã ship, bằng đúng số Stage 2):** 12 quyết định lift→keep + 7 đổi tag; 10 dòng heading cuối (đều 立券交易); 20 dòng activity (contract/transaction), cả 20 điểm −15; 100 bản ghi event xét, 69 đổi phân loại, 90 đổi điểm; hard warning đổi 0.
  - 6 dòng heading **có hình dạng witness trực tiếp** (戌-壬申, 戌-庚申).
  - 4 dòng heading là **suy rộng ngữ nghĩa** (丑-甲申, 午-戊申, 立券交易 có 宜 độc lập), owner chấp nhận; **không** SOURCE_WITNESSED.
- **G2/W1 không mở lại:** trên 未-戊申, R2 đổi quyết định trung gian của 五離 (keep) nhưng puzhu:21 sau đó vẫn gỡ, nên kết quả production cuối của G2/W1 (劫煞 × 立券交易 = BLANK / I1) không đổi.
- **Golden kế nhiệm** (cũ giữ nguyên): puzhu:06 Golden v4, Full Golden P4 v3 (`p4-full-golden-v3/`), Score Golden v5; churn ngoài dự kiến: không. Hệ quả hạ nguồn duy nhất đã audit: ghi chú `blocked` của 開倉庫出貨財 trên 2 ngày 未-戊申 (trạng thái không đổi, không ra output production).
- **Validation Stage 3:** `npm test` 275 file / 8.609 test PASS; `npm run check` PASS; `ci:p4` PASS; `test:p4:heading-lookup-full` PASS (cùng `ci:p4` = `ci:p4:full`); `ci:full` PASS. Rollback v4 → v3 tái tạo output trước R2; mutation bỏ exclusion 五離 tái tạo hành vi rollback; churn Golden ngoài dự kiến: không.
- **Biên phạm vi production:** authority P4 chỉ chạy 2025–2027. Ngoài khoảng: hành vi production không đổi, authority chỉ PARTIALLY_KNOWN. Phép chiếu 494 ngày / 1900–2100 của Stage 2 chỉ là **chẩn đoán**, không phải phạm vi migration.

## Q4-REST — 九空 / 五虛 / 小耗 + R-F1Y (MIGRATED & DEPLOYED 2026-10-26, PR #107 `6dac11a`, Deploy #50)

- **Phán quyết owner 2026-10-26** (`docs/audits/sources/p4-vol10/q4-rest-stage3/owner-ruling.json`): R-JK (九空), R-WX (五虛 × 開倉庫出貨財), R-XH (小耗): trigger chung puzhu:06 Q4 **không** gỡ 忌 của thần, trừ lifter riêng (卷十). R-F1Y: 五離 × 立券交易, 五離 là 忌 sống sót duy nhất + 宜 độc lập → `only_ji` (cả 21 dòng). Luật 宜 có phạm vi cho R-JK/R-WX/R-XH: hàng chỉ bị giữ vì `QL_NARROW` mà còn 宜 → `only_ji` (đo được 37 hàng; owner ghi 44 = cộng từng phán quyết, 7 hàng 開倉庫 chung bị đếm hai lần).
- **Không quyết:** GOD-NARROW toàn cục, Y-CONVENTION toàn cục, U4, U7, BAIJI-Y, 五墓 (không có context phân biệt), P21.
- **Chuỗi:** Stage 1 `6b9a9e2` → 2A `cf4c1e9` → 2A.1 `2862d6d` → 2B `cac923f` → 2C `2e8fe2d` → Stage 3 `ae5b13f` (đóng băng phán quyết + dự đoán trên v4) → `09a65cb` (authority v5) → `d0647a4` (envelope) → `b510dab` (mutation) ([báo cáo](../../docs/audits/p4-q4-rest-stage3-migration.md)).
- **Impact 2025–2027 (bằng đúng dự đoán đóng băng trước code):** 96 quyết định, 74 dòng heading (21 both_present→only_ji, 16 not_recorded→only_ji, 37 only_yi→only_ji), 121 dòng activity (status 79), 366 event (79 không, 104 đổi phân loại, 332 đổi điểm), hard warning 0. Bằng chứng: DIRECT 29 / SEMANTIC 38 / OVERLAP 7. Source regression 18/18 ô trong phạm vi khớp bản in.
- **Golden kế nhiệm** (cũ giữ nguyên): puzhu:06 Golden v5, Full Golden P4 v4 (`p4-full-golden-v4/`), Score Golden v6; churn ngoài dự kiến: không.
- **Validation:** `ci:full` PASS, `ci:p4` + `test:p4:heading-lookup-full` PASS, `npm test` PASS. Rollback v5 → v4 (`q4RestRollback.ts`) = baseline trước Stage 3 trên 1.097 ngày; mutation puzhu:06 19, owner-rules 14, đều bị bắt.

## Roadmap P4 và migration (đã xong)

| # | Việc | Kết quả |
|---|---|---|
| 1–3 | Smoke PR #49, merge PR #48, quyết định 「又為X」 | XONG; `docs/audits/yue-po-still-avoid-release.md`, `docs/audits/p4-vol10-youwei-scopes.md` (PR #51) |
| 4 | P4-B — 凶 khác của 卷十一 + 21 thần dormant (audit-only) | XONG, PR #54 `1ad9b4b`; [gate](../../docs/audits/p4-vol10-soil-convention-gate.md), [audit](../../docs/audits/p4-vol10-remaining-ji.md) |
| 5 | P4-C — operand cho 11 thần 宜 | XONG, [PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) `9afd39f`; [PRD](../../tasks/prd-p4c-yi-operands.md), [audit](../../docs/audits/p4-vol10-yi-operands.md), [gate](../../docs/audits/sources/p4-vol10/yi-acceptance-gate-v1/README.md) |
| 6 | P5 — warehouse (修倉庫 / 開倉庫出貨財) | XONG, [PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) `22dd72f`; owner chốt D; [PRD](../../tasks/prd-p5-warehouse.md), [audit](../../docs/audits/p5-warehouse.md) |
| 7 | Full Golden P4 (720 context × heading) | XONG, [PR #66](https://github.com/nghiepnguyen/calendar-hana/pull/66) `82b3eb4`; Golden v2 freeze `c574e57`; [báo cáo](../../docs/audits/p4-full-golden.md), [review](../../docs/audits/p4-full-golden-review.md), [PRD](../../tasks/prd-p4-full-golden.md) |
| 7b | Layer engine cài luật owner, kiểm bằng Golden v2 | XONG, [PR #68](https://github.com/nghiepnguyen/calendar-hana/pull/68) `f00dd5c`; `shared/lunar/p4OwnerRules.ts`; [báo cáo](../../docs/audits/p4-owner-rules-engine.md) |
| 8 | Adapter điểm sau flag OFF | XONG, [PR #69](https://github.com/nghiepnguyen/calendar-hana/pull/69) `7d7596f`; baseline v1 `1609264`; [PRD](../../tasks/prd-p4-score-adapter.md), [báo cáo](../../docs/audits/p4-score-adapter.md) |
| 9 | Migration diff + rollback | XONG, `9865eee`; TSV 4 cấu hình (baseline / presence-only / balancing-only / full), 0 `UNEXPECTED_REGRESSION`; [PRD](../../tasks/prd-p4-migration-diff.md), [báo cáo](../../docs/audits/p4-migration-diff.md) |
| 9b | Policy sau go-live review (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`, UI 忌 bị cap) | XONG, [PR #70](https://github.com/nghiepnguyen/calendar-hana/pull/70) `98e8ca5`; [PRD](../../tasks/prd-p4-9b.md), [báo cáo](../../docs/audits/p4-9b.md) |
| 10 | Activation (flag ON + 21 thần + P5) | XONG, [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) `7826f0c`; [PRD](../../tasks/prd-p4-activation.md), [báo cáo](../../docs/audits/p4-activation.md) |
| — | 卷十 劫煞 Option C v1 (相抵 → faithful authority) | **XONG & DEPLOYED**, [PR #87](https://github.com/nghiepnguyen/calendar-hana/pull/87) `85736fd`; mục "卷十 劫煞 — Option C v1" |
| — | G1 壞/壊: audit G1-a + G1-b Stage 1/2 (`canonical-v1`) | **XONG & DEPLOYED**, [PR #99](https://github.com/nghiepnguyen/calendar-hana/pull/99) `394acbb`; mục "Nợ chữ heading G1 / G2" |
| — | G2 劵/券 Stage 1 + Stage 2 (alias + authority 劫煞 v2) + W1 | **XONG & DEPLOYED**, [PR #100](https://github.com/nghiepnguyen/calendar-hana/pull/100), [#102](https://github.com/nghiepnguyen/calendar-hana/pull/102) `f3c68c6`, [#105](https://github.com/nghiepnguyen/calendar-hana/pull/105) `f66c74f` |
| — | G1 glyph Stage 2 (authority 劫煞 v3) + G1-SOIL (v4, phụ thuộc ngày) | **XONG & DEPLOYED**, [PR #103](https://github.com/nghiepnguyen/calendar-hana/pull/103) `d5c005f`, [#104](https://github.com/nghiepnguyen/calendar-hana/pull/104) `aebcf2e` |
| — | F1 五離 R2 (puzhu:06 v4) + Q4-REST (puzhu:06 v5) | **XONG & DEPLOYED**, [PR #106](https://github.com/nghiepnguyen/calendar-hana/pull/106) `7a38f09`, [#107](https://github.com/nghiepnguyen/calendar-hana/pull/107) `6dac11a` |

Evidence từng mục (số đo, mutation, quyết định owner): history §42 và các báo cáo trên.

## Mục "Việc độc lập" đã đóng

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| G1 | Nợ chữ 壞/壊 (demolition) | **ĐÓNG & DEPLOYED** (PR #97 audit, #99 `canonical-v1`, #103 authority 劫煞 v3, #104 G1-SOIL v4 phụ thuộc ngày). Không còn mục mở |
| G2 | Nợ chữ 劵/券 (contract/transaction) | **ĐÓNG & DEPLOYED** (PR #100 audit, #102 alias + authority 劫煞 v2, envelope I1 đúng đóng băng). Không gập `NORM` |
| W1 | `未-戊申 × 立券交易`: 月表 n117 in 立券交易 ở dòng 忌, ô authority BLANK | **ĐÓNG** 2026-10-26: phán quyết owner CỤC BỘ D1(a), ô giữ BLANK / I1, không SOURCE_WITNESSED, 0 thay đổi production ([Stage 1](../../docs/audits/p4-g2-n117-authority-discrepancy.md), [Stage 2](../../docs/audits/p4-g2-n117-stage2-resolution.md), [Stage 3](../../docs/audits/p4-g2-n117-stage3-owner-ruling.md)). F1 (五離 heading, puzhu:06 Q4 vs n117) xử lý riêng: MIGRATED (PR #106, witness 戌-壬申, 戌-庚申) |
| F1 (五離) | 五離 × 立券交易, puzhu:06 Q4 | **MIGRATED & DEPLOYED** 2026-10-26 (PR #106, owner R2_APPROVED; authority `p4b-puzhu06-v4`; mục "F1 — 五離 × 立券交易"). Luật 3 (Y) thay bởi R-F1Y (Q4-REST). Không gộp với W1 |
| Q4-REST | Authority puzhu:06 Q4 cho 九空 / 五虛 / 小耗 / 五墓 | **MIGRATED & DEPLOYED** 2026-10-26 (PR #107; R-JK/R-WX/R-XH + R-F1Y, authority `p4b-puzhu06-v5`; mục "Q4-REST"). 五墓 không đổi (không có context phân biệt). Không quyết: GOD-NARROW toàn cục, U4, U7 (cách ly) |
| R1 | Review mapping lượt hai: mansion 115/115, 用事 29/29 | **XONG** (PR #84): `DOUBLE_REVIEWED (semantic mapping)`, hai lượt AI-agent, chưa có chuyên gia người; mục "28 Tú — audit" |
| P1 | 天狗寅日 | XONG, PR #76 (trên) |
| F1 (puzhu:06 audit) | 鋪註 puzhu:06 (khác F1 五離 ở trên) | XONG audit-only, [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) `e427e2b`; [báo cáo](../../docs/audits/p4b-puzhu06.md); hold còn lại đã vào roadmap 7 |
| R5 | Visual snapshot lệch do thiếu `.env.local` | XONG, [PR #63](https://github.com/nghiepnguyen/calendar-hana/pull/63) `3980183`: `playwright.config.ts` `webServer.env` đặt `VITE_FIREBASE_*` giả. Worktree mới cần `npm --prefix functions ci` trước `npm run build` |
