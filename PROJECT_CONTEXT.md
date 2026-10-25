# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-25 (giờ VN). Main `d47bcc6` đã deploy (PR #100, G2 Stage 1 audit/spec, không đổi output). Output đổi gần nhất: PR #99 **G1-b Stage 2** (`p4ScoreHeadingLookup: canonical-v1`, demolition 2025–2027). G1 (壞/壊) **ĐÓNG & DEPLOYED**; G2 (劵/券) Stage 1 **XONG**, Stage 2 đã được owner duyệt phạm vi, **chưa làm** (xem §3 "Nợ chữ heading G1 / G2"). Roadmap P4 (1–10) xong, P4 ON. Option C v1 DONE & DEPLOYED. Việc tiếp theo: G2 Stage 2 khi owner yêu cầu, hoặc mục §5 "Việc độc lập".
> Tài liệu này không thay thế yêu cầu mới của người dùng.
> Lịch sử chi tiết (phase, PR, số đo, release evidence, chuỗi SHA/bundle/deploy cũ): [`docs/project-context/history.md`](docs/project-context/history.md). "history §N" trỏ về phần N trong file đó; bản đầy đủ của file này trước khi thu gọn là history §42.
> **Quy tắc cập nhật:** sửa tại chỗ. Mục production chỉ giữ bản hiện hành và bản liền trước; chuỗi cũ hơn, evidence release và smoke chi tiết ghi vào `docs/audits/` hoặc history. Không thêm "phần N+1".

## 1. Project

- **Repo:** `nghiepnguyen/calendar-hana` (public, MIT) · **Production:** <https://lich.thanhnghiep.top> · **Default branch:** `main`
- Lịch dương/âm Việt Nam + lịch vạn niên, chọn ngày, phong thủy — kiến trúc audit được. Không gom quy tắc truyền thống thành "điểm tốt/xấu" tùy ý: mỗi rule cần nguồn, operand, convention và test độc lập trước khi ảnh hưởng production.

### Nguyên tắc authority

1. Astronomy/calendar core deterministic.
2. Rule truyền thống deterministic (12 Trực, 28 Tú, Hoàng/Hắc đạo) phải source-lock/convention-lock.
3. Cát/Hung thần, Thụ Tử, Sát Chủ và rule phụ thuộc sách/phái phải audit provenance trước khi migrate production.
4. Golden độc lập với production, **đóng băng trước code**; không sửa Golden để test xanh.
5. Không hardcode ngày, skip test hoặc nới assertion để che authority conflict.
6. Không dùng "đa số website giống nhau" làm authority; không majority vote.
7. Khác biệt phải phân loại: `ENGINE_BUG`, `GOLDEN_BUG`, `SPEC_BUG`, `CONVENTION_DIFFERENCE`, `SOURCE_DEPENDENT`, `NAMING_ONLY`, `UNKNOWN`.
8. Migration diff phân loại: `EXPECTED_AUTHORITY_MIGRATION_CHANGE` / `UNEXPECTED_REGRESSION`.
9. Không reopen astronomy hoặc phase CLOSED nếu không có bằng chứng mới.

## 2. Trạng thái production

| Hạng mục | Giá trị |
|---|---|
| Main đã deploy | `d47bcc6` ([PR #100](https://github.com/nghiepnguyen/calendar-hana/pull/100) G2 Stage 1, chỉ audit/spec, merge 2026-10-25). Trước đó `394acbb` ([PR #99](https://github.com/nghiepnguyen/calendar-hana/pull/99) G1-b Stage 2, merge 2026-10-24): **đổi điểm/status** chỉ demolition, chỉ 2025–2027 (353 ngày; điểm 320: 223 giảm / 97 tăng; status 337; hard warning 0; activity khác 0; ngoài miền 0). Output đổi trước đó: `85736fd` (PR #87 Option C v1). Chuỗi PR #88–#98: history §44 |
| Bundle | `/assets/index-BNiXJDPd.js`, SHA-256 `23fef042f234081727f198a2a8765b36999b442a12b92ae5e04cf9da5bb3cccb` (build `d47bcc6`, kiểm 2026-10-25; bundle chứa `p4ScoreHeadingLookup:`canonical-v1``; chưa so byte với build local). Bundle `394acbb` không ghi lại; build local `579a143`: index Δ −3 B so với `1ed3828`, chunk `p4AlmanacHeadings` giữ riêng. Cách so byte với build local: `GITHUB_SHA=<sha> npm run build`, thay `builtAt` local bằng giá trị `/version.json` → `index-*.js` trùng production ngoài tham chiếu hash chunk; build local cần `VITE_FIREBASE_*` của bundle production (config public) |
| Deploy gần nhất | [Deploy #43 / 40148584043](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40148584043) `d47bcc6` SUCCESS 2026-10-25; `/version.json` `{"version":"26.10.25","build":"d47bcc6"}` (kiểm 2026-10-25). Trước đó [Deploy #42 / 40086414826](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40086414826) `394acbb` SUCCESS 2026-10-24 (G1-b Stage 2). Smoke Playwright production theo §7 cho #99 chưa ghi lại |
| Dataset | `datasetVersion` 1.2.1, `schemaVersion` 1.1.0 |
| Catalog | 32 activities (đều enabled), 11 event profiles |

`shared/almanac-data/manifest.json` → `policies`:

| Policy | Giá trị | Ý nghĩa |
|---|---|---|
| `xiejiVol10Scoring` | **true** | Scorer 卷十 cho 6 chain 月建/月破/平日/收日/閉日/刼煞 (PR #32) |
| `mansion28ScoringEnabled` | **false** | 28 Tú chỉ informational, `scoreDelta = 0` |
| `noTabooMeansNeutralUpToSeverity` | `high` | Không gặp ngày kỵ → trung tính cho event ≤ high; `very_high` vẫn cần căn cứ |
| `hardWarningKeepsWorseScoreStatus` | true | Hard warning lấy trạng thái nghiêm hơn (≤19 strong_avoid, ≤29 avoid, còn lại ≥ consider) |
| `unknownRuleMeansNoEvidence` | true | UNKNOWN không suy thành tốt/xấu |
| `hardVetoFromClassicalJi` | false | 忌 cổ điển không tự thành veto |
| `legacyGodsMonthJian` | **true** (PR #45) | 14 thần legacy (Thiên Xá, Nguyệt Ân, Dân Nhật, Tam Hợp, Thiên Hỷ, Lục Hợp, Ngũ Phú, Giải Thần, Phúc Sinh, Thánh Tâm, Ích Hậu, Tục Thế, Nguyệt Hình, Thiên Lại) đọc theo Month Jian thay vì tháng âm; sao hiển thị và điểm cùng đổi |
| `xiejiVol10JieshaPolicy` | **`faithful-v1`** (PR #87, 2026-10-22) | 卷十 劫煞 辰戌丑未 không 德 (`cancel_both`): verdict theo authority `xieji-vol10-jiesha-authority-v1.json` (384 ô audit; runtime 352 ô APPLIED, demolition EXCLUDED_PENDING_GLYPH_AUDIT, contract/transaction UNREACHABLE đến G2 Stage 2 — authority v2 đã duyệt, chưa làm). `legacy-cancel-both` = output trước PR #87 |
| `p4ScoreHeadingLookup` | **`canonical-v1`** (PR #99, 2026-10-24) | G1-b: score adapter P4 đọc heading 卷十一 qua `canonicalP4HeadingKey` (破屋壞垣 → 破屋壊垣); heading quyết định giữ chữ nguồn. Code default cũng `canonical-v1`. `source-key-v1` = output trước PR #99 (demolition luôn `baseline`) |
| `xiejiVol10BalancingEnabled` | **true** (PR #71, 2026-10-18) | P4: cân bằng 宜/忌 卷十一 + 21 thần dormant + P5 + 9b (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`) + −25 product policy; chỉ chạy khi flag ON **và** provider `p4AlmanacHeadings` đã nạp **và** ngày trong 2025–2027. OFF = baseline v1 byte-equal |
| `tiangouYinNoYi` | **true** (PR #76, 2026-10-19) | P1: ngày Dần, `pray_blessing`/`pray_children` mọi dòng dương applied → informational (`p1-tiangou-yin-v1`, puzhu:07); mọi năm, độc lập flag P4. `false` = output trước P1 |
| `satChuNgocHapStars` | **true** (PR #78, #80, 2026-10-20) | Sao ngày Tháng Sát Chủ (Lưu-thị, = `SAT_CHU_DUONG`), Bốn Mùa Sát Chủ, Sát Chủ Trong Bốn Mùa, Ngày Sát Sư, Tháng Sát Sư (Ngọc Hạp Chánh Tông tr. 128–133; không mapping chấm điểm). `false` = output trước PR #78 (giờ Sát Chủ `DayHour.isSatChu` không theo flag, chỉ hiển thị) |
| `aiMayChangeScore` | false |  |

Rollback (flag về false trên nhánh riêng → PR → deploy → smoke; không sửa Golden):

- `xiejiVol10Scoring`: history §38–39.
- `legacyGodsMonthJian`: `docs/audits/dormant-legacy-gods.md`.
- `xiejiVol10BalancingEnabled`: PR một dòng manifest, giữ 6 chain và `legacyGodsMonthJian`; proof `shared/lunar/p4MigrationRollback.test.ts`, `docs/audits/p4-migration-diff.md`.
- `tiangouYinNoYi`: PR một dòng manifest, độc lập flag P4; test lịch sử ghim `false`, proof `shared/lunar/p1TiangouYinMigration.test.ts`.
- `satChuNgocHapStars`: PR một dòng manifest; baseline/rollback/migration-diff/almanac legacy ghim `false`.
- `p4ScoreHeadingLookup`: PR một dòng manifest về `source-key-v1` (= Score Golden v2, byte-equal output `1ed3828`); test v2 đã ghim `source-key-v1`; proof `shared/lunar/p4MigrationDiffV3.test.ts` (rollback forward/rollback/re-enable), `docs/audits/p4-g1b-stage2-migration.md`.
- `xiejiVol10JieshaPolicy`: PR một dòng manifest về `legacy-cancel-both`; authority, Golden v2 và test giữ nguyên; 9 test lịch sử đã ghim `legacy-cancel-both`; proof `shared/lunar/xiejiVol10JieshaMigration.test.ts` (legacy vs faithful-v1 toàn miền), `docs/audits/p4-jiesha-option-c-migration.md`.

## 3. Trạng thái theo phase

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
| 7 28 Tú 宜/忌 | CLOSED & DEPLOYED (PR #84); content **1.0.4** | 玉匣記 1880, `mansion-content-yuxia-1880-v1`, 115 clauses; `docs/audits/28-mansion-content-provenance.md` (lịch sử); hiện hành: §3 "28 Tú — audit" |
| Activity taxonomy/mapping/diagnostics/explainability | DEPLOYED; audit 28 Tú đóng | Mansion 115 + 用事 29: **DOUBLE_REVIEWED (semantic mapping)** — hai lượt AI-agent độc lập, chưa có chuyên gia văn bản người (§3 "28 Tú — audit"); review lượt 1: `docs/audits/xieji-activity-mapping-review.md` |
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
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`; Golden hiện hành `golden-xieji-vol10-scoring-v2.json` (PR #87); v1 `golden-xieji-vol10-scoring.json` giữ nguyên byte, test ghim `legacy-cancel-both` |
| 卷十 劫煞 Option C v1 | **DONE & DEPLOYED** (PR #87, `85736fd`, 2026-10-22) | §3 "卷十 劫煞 — Option C v1"; [báo cáo](docs/audits/p4-jiesha-option-c-migration.md) |
| G1 壞/壊 (破屋壊垣) | **ĐÓNG & DEPLOYED** (PR #89, #90, #97, #98, #99) | §3 "Nợ chữ heading G1 / G2"; [G1-a](docs/audits/p4-g1a-demolition-authority.md), [spec G1-b](docs/audits/p4-g1b-score-lookup.md), [Stage 2](docs/audits/p4-g1b-stage2-migration.md) |
| G2 劵/券 (立券交易) | Stage 1 **XONG** (PR #100, audit); Stage 2 **chưa làm** (owner duyệt authority v2 + phạm vi) | §3 "Nợ chữ heading G1 / G2"; [spec](docs/audits/p4-g2-vol10-heading-match.md) |
| P4 — cân bằng 卷十 | **ON** (PR #71, 2026-10-18) | Roadmap §5; soil `p4-soil-owner-convention-v1` OWNER_ADOPTED_SOURCE_DEPENDENT, canonical S1 PARTIALLY RESOLVED (còn mở onset khi 四立 rơi sớm trong ngày). [progress](docs/audits/p4-vol10-progress.md), [P4-B](docs/audits/p4-vol10-remaining-ji.md), [activation](docs/audits/p4-activation.md) |
| CI | Local từ 2026-10-19 (§7); GitHub chỉ deploy | Shard unit trên Actions (PR #52/#53) đã thay bằng `check`/`test:changed`/`ci:full`/`ci:p4` chạy ở máy (PR #74); PR #91–#93 thêm `check:audit-clean`, `ci:p4:fast`, `ci:p4:full` |
| Analytics PostHog | DEPLOYED (PR #94) | Proxy first-party `https://e.lich.thanhnghiep.top` (`VITE_POSTHOG_*`, CSP trong `firebase.json`) |
| PWA update (`/version.json`, toast "Có phiên bản mới") | DEPLOYED (PR #57, #58) | `docs/pwa-update-strategy.md`; version hiển thị = ngày build `YY.MM.DD` giờ VN. Chưa kiểm tay trên iPhone Home Screen |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng | Personal annual afflictions giữ convention cũ, chưa chứng nhận |

### 28 Tú — audit (đóng & deploy 2026-10-21, PR #84 `ac25ce6`)

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

### 卷十 劫煞 — Option C v1 (DONE & DEPLOYED 2026-10-22, PR #87 `85736fd`)

Commit: `fe40968` (authority + runtime + policy), `db905d8` (Golden v2, migration diff, gate), `e85451f` (docs). Báo cáo: [`docs/audits/p4-jiesha-option-c-migration.md`](docs/audits/p4-jiesha-option-c-migration.md).

- **Vấn đề:** 協紀 卷十 劫煞 tháng 辰戌丑未 không 德 「凡所忌者則不註宜所宜者亦不註忌」. Resolver cũ đọc là `cancel_both` (bỏ chú mọi heading 劫煞); 月表 phản bác (39/39 cụm). Đọc trung thực: heading có 宜 không chú, heading không 宜 giữ 忌 劫煞, sau cặp 鋪註.
- **Chuỗi audit** (history §43): H1-B → 相抵 → impact OVERLAP → simulator trung thực (鳴吠對 → 啟攢, 鋪註05) → puzhu:17 P17-A (未-壬申 +3 ô) → 未-戊申 納財 (owner: nguồn thắng 1 ô 月表 tự mâu thuẫn, **cục bộ**, ô không SOURCE_WITNESSED) → 丑-丙寅 月德 (歴例 十二月 庚 → D-A; n75 = WITNESS_PRINTING_ERROR).
- **Authority audit:** `docs/audits/sources/p4-vol10/chou-bingyin-yuede-v1/candidate-final.json` (SHA-256 `b24f6f68…1946`): 16 context × 24 activity = 384 ô, 177 avoid / 207 blank, CONFIRMED, cố định theo (Month Jian + trụ ngày, activity) suốt 1900–2100.
- **Production projection v1:** `shared/almanac-data/xieji-vol10-jiesha-authority-v1.json` (`xieji-vol10-jiesha-faithful-v1`) + `shared/lunar/xiejiVol10JieshaAuthority.ts`. Chỉ phủ phần authority mà chuẩn hoá heading hiện tại của `resolveVol10` chạm tới: **352 ô APPLIED** (22 activity; 171 avoid / 181 blank); contract/transaction **UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION** (32 ô giữ làm provenance; 劫煞 ghi 立劵交易, `NORM` không có 劵→券); demolition **EXCLUDED_PENDING_GLYPH_AUDIT** (resolver đọc 破屋壞垣 → 破屋壊垣 nhưng audit không có ô; giữ `cancel_both`, gắn `authorityExclusion`). **Không** nói cả 384 ô đều chạy ở runtime.
- **Predicate:** depth 0, entry `jie_sha`, Month Jian 辰戌丑未, 德 chắc chắn vắng (`withVirtues === false`) → nhánh `otherwise` = `cancel_both`, policy `faithful-v1`. Key `${monthJian}${pillar}` (vd. `丑丙寅`). Lỗi to: context lạ, thiếu ô APPLIED, chạm activity UNREACHABLE; authority hỏng → lỗi khi import. Không đổi: `cancel_both` chung, 災煞/月煞/月刑/重日/復日, 德, chuẩn hoá heading, P4, adapter medical, scope label; `classicalResolution.version` vẫn `xieji-vol10-v2`.
- **Tác động thật 1900–2100** (2.710 ngày chạy): 1.615 ngày; 17.631 verdict → avoid (211 trên 21 ngày 2025–2027 không đổi điểm vì P4 chấm); 17.420 activity −15 (neutral→watch 11.764, watch→avoid 3.223, recommended→watch 1.615, consider→avoid 818); 0 activity 2025–2027; event: move_house 1.022, wedding 818, groundbreaking 424, open_business 312 (caution→not_recommended); 0 ngoài scope.
- **Đối chiếu simulator:** bằng đúng simulator dựng từ candidate trên mọi ngày; so simulator `d79b08e`: chỉ khác ở P17-A 未-壬申 (312) và hàng 2025–2027 do P4 candidate của simulator (134 activity, 58 event), dư 0.
- **Golden:** `golden-xieji-vol10-scoring-v2.json` (46 case, kế nhiệm); v1 giữ byte (`c3d8b0d7…`). P4 Golden v2, astronomy/JPL không đổi.
- **Gate:** 14 mutation (`scripts/audit-vol10-jiesha-mutations.py`, trong `ci:p4`); `ci:p4` và `ci:full` PASS trước merge.
- **Nợ kỹ thuật/nguồn (không chặn release):** G1 壞/壊 đã đóng ở tầng score P4 (PR #99), demolition vẫn `EXCLUDED_PENDING_GLYPH_AUDIT` ở authority 劫煞 v1; G2 劵/券 Stage 2 sẽ đưa contract/transaction sang authority v2 (§3 "Nợ chữ heading G1 / G2").

### Nợ chữ heading G1 / G2 (cập nhật 2026-10-25)

**G1 — 破屋壊垣 / 破屋壞垣 (demolition): ĐÓNG & DEPLOYED.**

- Danh tính: `SAME_ACTIVITY_ALIAS_CONFIRMED` (G1-a, PR #97). Canonical 破屋壊垣; alias 破屋壞垣 → 破屋壊垣; `sourceRaw` giữ chữ nguồn. 土王用事後 = 忌 theo khoảng ngày, không thuộc danh tính, không phải điều kiện alias. Bằng chứng 卷十/卷十一 là bản chép Wikisource (transcription-derived), chưa đọc lại scan.
- Lỗi harness G1-a: **bỏ sót match**, không phải gộp sớm. 6 harness audit đóng băng key activity bằng `canonP4Heading` (chỉ 劵→券) trong khi phía 劫煞 qua `splitHeadings` (壞→壊) → demolition `not_listed`. Harness cũ giữ nguyên (lock); harness kế nhiệm `p4G1aDemolitionEngine.test.ts`.
- 4 witness conflict (丑-甲寅/丙寅/壬寅, 未-戊申) = DEPENDENCY_CONFLICT: ngày đại diện nằm trong cửa sổ 土王用事; 月表 không có ngày nên chỉ chứng cho trạng thái không 土王 → 16/16 khớp.
- G1-b (score adapter): lệch key duy nhất ở `p4ScoreAdapter` (đọc 破屋壞垣, provider trả 破屋壊垣). Stage 1 PR #90 (hạ tầng, `source-key-v1`), spec PR #98, **Stage 2 PR #99** bật `canonical-v1`. Envelope đúng spec: 1.095 ngày, demolition 353 ngày đổi điểm/status (điểm 320: 223 giảm / 97 tăng; status 337), hard warning 0, activity khác 0, ngoài miền 0; thêm 291 dòng chỉ đổi evidence/state. 5 ngày owner witness (2025-02-02, 2026-01-28, 2027-01-23, 2026-08-02, 2027-07-28): `baseline/35/watch` → `only_ji/20/avoid`, cơ chế: canonical match → `only_ji` (土王用事後 protected) → rời vol10 path → `applyP4Balancing` giữ Kiếp Sát applied −15; không đổi thuật toán.
- Evidence Stage 2: Score Golden v3 (`p4-score-golden-v3/`, generator Python độc lập chạy adapter v2 đóng băng, freeze trước flip `e4c0926`), migration diff v3 (`p4-migration-diff-v3/`, 644 dòng, 353 đổi kết luận, 0 UNEXPECTED), rollback proof (`rollback.json`: canonical-v1 = v3, source-key-v1 = v2 = byte `1ed3828`, re-enable = v3). `datasetVersion` giữ 1.2.1, `P4_SCORE_ADAPTER_VERSION` giữ `p4-score-adapter-v1` (lý do trong báo cáo Stage 2).
- Còn mở (không chặn): ô demolition của authority 劫煞 (Option C v2) — 5 context (丑-甲寅/丙寅/壬寅/戊寅, 未-戊申) phụ thuộc ngày qua 土王用事 → `NON_BLOCKING_FOLLOW_UP`.

**G2 — 立劵交易 / 立券交易 (contract, transaction): Stage 1 XONG (PR #100), Stage 2 CHƯA LÀM.**

- Danh tính: `SAME_ACTIVITY_ALIAS_CONFIRMED`. 卷十 ghi 立劵交易 (32×); heading thân 卷十一 立劵交易 (một mục 宜/忌; scan 06067687 tr. 42 đọc 劵, độ tin cậy trung bình); danh sách 萬年書 trong 卷十一 ghi 立券 và 交易 thành hai ô (tổng 67/37/60 chỉ khớp như vậy), 卷十一 gộp thành một heading như mọi cặp khác.
- **Chỗ lệch thật:** khớp heading 卷十 trong `resolveVol10` (`NORM` không có 劵) → contract/transaction luôn `not_listed` ở 月破/平日/收日/劫煞/月厭/月刑 (+月煞/災煞 qua `avoidSameAs`). **Không** phải score lookup P4 (P4 đã gập 劵→券 qua `canonP4Heading`).
- Phạm vi Stage 2 đã đóng băng: một entry `headingAliases` `立劵交易 → ["立券交易"]` trong `xiejibianfangshu-vol10-yiji.json` + **authority 劫煞 v2** (contract/transaction → APPLIED với ô đã duyệt). Alias đơn lẻ làm guard authority throw. Cấm: gập `NORM` 劵→券 toàn cục, sửa bản chép nguồn, đổi P4/lookup, đụng G1-b.
- Phán quyết owner 2026-10-25: authority v2 **DUYỆT**; phạm vi ngoài miền P4 + event **CHẤP NHẬN**; `未-戊申 × contract/transaction = BLANK` (giữ authority hiện hành); ngữ nghĩa BLANK = **I1**: authority hoạt động khi chạm tới (bỏ phạt 劫煞), hành vi "không khớp" cũ không phải authority, không thêm thiết lập tương thích.
- Envelope I1 đã đóng băng (candidate vs production hiện hành): 2025–2027: 24 dòng activity đổi kết luận (12 ngày, 0 giảm / 24 tăng), status 24, hard warning 0, activity khác 0, P4 state 0; event 4.330 đổi (108 điểm / 72 phân loại). 1900–2100 ngoài miền: 13.856 dòng đổi kết luận (2.020 giảm / 11.836 tăng), status 13.254, hard warning 0, activity khác 0; event mỗi ngày 289.270 đổi (62.352 điểm / 44.942 phân loại). Gồm 212 dòng + 1.060 event phụ thuộc ô BLANK 未-戊申 = `EXPECTED_G2_MIGRATION_CHANGE`.
- Stage 2 cần kế nhiệm (14 file test / 20 test trong `docs/audits/sources/p4-vol10/g2-stage1/blast-radius.json`): Score Golden v4 (24 dòng baseline contract/transaction), kế nhiệm baseline v1, `golden-xieji-vol10-scoring-v2` (`jie-chen-contract-unreachable`), test authority + lock Option C, migration event/activation, mutation guard `scripts/audit-vol10-jiesha-mutations.py:44`. Stage 2 tự quyết `datasetVersion` (có file data đổi, khác G1-b).
- Mục authority riêng còn mở: `未-戊申 × 立券交易` ([item](docs/audits/p4-weishen-lijuan-authority-item.md)) — n117 in 立券交易 ở dòng 忌; bằng chứng sơ bộ cho thấy do 五離, không phải 劫煞. Không chặn G2; không đổi ô.

## 4. Runtime pipeline

```text
computeAlmanac
  sao ngày: bảng legacy stars.data.ts (tháng âm; tháng nhuận dùng tháng gốc)
    − thay bằng source-locked: Nguyệt Đức/Đức Hợp/Phá, Kiếp Sát, Thiên Đức/Hợp (Month Jian, Phase 4D)
    − thay bằng Month Jian: 14 thần legacy (getXiejiGodPresence, flag legacyGodsMonthJian), giữ vị trí bảng
    − bỏ sao Sát Chủ/Sát Sư Ngọc Hạp khi satChuNgocHapStars OFF
    + Thụ Tử (authority), + day-rule gods (Trừ Thần, 百忌日, Nhân Thần, 土王用事)
  → present gods + godPresence (operand cho thần đã khoá); sao không mapping → cảnh báo, không chấm điểm
  giờ: getAllHours(jd, dayChi, lunarMonth) — hoàng/hắc đạo + isSatChu
→ classicalDay + activity contributions
→ getActivityRecommendations
→ resolveVol10 (policy `xiejiVol10JieshaPolicy`: 劫煞 辰戌丑未 không 德 → ô authority faithful-v1)
→ applyVol10Scoring — khi xiejiVol10BalancingEnabled ON: applyP4Balancing thay 6 chain cho activity có heading P4 (cần provider `p4AlmanacHeadings` đã nạp, 2025–2027); heading activity tra key provider qua `p4ScoreHeadingLookup` (`canonical-v1`: `canonicalP4HeadingKey`)
→ cap/status hoạt động
→ evaluateEventDay (criteria + score/classification + diagnostics)
→ daily UI/evidence
```

Bảng verdict 卷十 → điểm (`xieji-vol10-scoring-v1`; contract chi tiết history §39-C):

| Verdict | Hành vi |
|---|---|
| `avoid` | Giữ delta âm; delta dương → âm cùng độ lớn; chain chưa có dòng âm → thêm `xieji10:<entry>:<activity>` −25 (không tạo hard warning) |
| `not_avoided` | Delta âm → 0 (`informational`); giữ dòng dương |
| `no_annotation` (不註/不忌) | Delta → 0; nếu mọi dòng bị bỏ → activity `neutral`, score 50 |
| `not_listed` / `undetermined` | Giữ nguyên |

Lưu ý UI: ô "Sao tốt & sao xấu" (`StarChips`) chỉ hiện 5 sao đầu mỗi nhóm trước "xem thêm" → thứ tự sao là hành vi sản phẩm. Phần sao từ bảng ngày giữ thứ tự `STARS`; sao source-locked nối sau. Test Release A buộc thứ tự giữ nguyên ở ngày tháng âm = Month Jian.

## 5. Vấn đề mở và việc tiếp theo

Roadmap P4 1–10 xong (activation PR #71, owner cho phép 2026-10-18). Migration 卷十 劫煞 Option C v1 xong (PR #87, 2026-10-22). G1 xong (PR #99, 2026-10-24). G2 Stage 1 xong (PR #100, 2026-10-25); **G2 Stage 2 là việc kế tiếp đã được duyệt phạm vi**, làm khi owner yêu cầu. Mục cần owner quyết thì dừng và hỏi, không tự chọn.

### Roadmap (đã xong)

| # | Việc | Kết quả |
|---|---|---|
| 1–3 | Smoke PR #49, merge PR #48, quyết định 「又為X」 | XONG; `docs/audits/yue-po-still-avoid-release.md`, `docs/audits/p4-vol10-youwei-scopes.md` (PR #51) |
| 4 | P4-B — 凶 khác của 卷十一 + 21 thần dormant (audit-only) | XONG, PR #54 `1ad9b4b`; [gate](docs/audits/p4-vol10-soil-convention-gate.md), [audit](docs/audits/p4-vol10-remaining-ji.md) |
| 5 | P4-C — operand cho 11 thần 宜 | XONG, [PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) `9afd39f`; [PRD](tasks/prd-p4c-yi-operands.md), [audit](docs/audits/p4-vol10-yi-operands.md), [gate](docs/audits/sources/p4-vol10/yi-acceptance-gate-v1/README.md) |
| 6 | P5 — warehouse (修倉庫 / 開倉庫出貨財) | XONG, [PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) `22dd72f`; owner chốt D; [PRD](tasks/prd-p5-warehouse.md), [audit](docs/audits/p5-warehouse.md) |
| 7 | Full Golden P4 (720 context × heading) | XONG, [PR #66](https://github.com/nghiepnguyen/calendar-hana/pull/66) `82b3eb4`; Golden v2 freeze `c574e57`; [báo cáo](docs/audits/p4-full-golden.md), [review](docs/audits/p4-full-golden-review.md), [PRD](tasks/prd-p4-full-golden.md) |
| 7b | Layer engine cài luật owner, kiểm bằng Golden v2 | XONG, [PR #68](https://github.com/nghiepnguyen/calendar-hana/pull/68) `f00dd5c`; `shared/lunar/p4OwnerRules.ts`; [báo cáo](docs/audits/p4-owner-rules-engine.md) |
| 8 | Adapter điểm sau flag OFF | XONG, [PR #69](https://github.com/nghiepnguyen/calendar-hana/pull/69) `7d7596f`; baseline v1 `1609264`; [PRD](tasks/prd-p4-score-adapter.md), [báo cáo](docs/audits/p4-score-adapter.md) |
| 9 | Migration diff + rollback | XONG, `9865eee`; TSV 4 cấu hình (baseline / presence-only / balancing-only / full), 0 `UNEXPECTED_REGRESSION`; [PRD](tasks/prd-p4-migration-diff.md), [báo cáo](docs/audits/p4-migration-diff.md) |
| 9b | Policy sau go-live review (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`, UI 忌 bị cap) | XONG, [PR #70](https://github.com/nghiepnguyen/calendar-hana/pull/70) `98e8ca5`; [PRD](tasks/prd-p4-9b.md), [báo cáo](docs/audits/p4-9b.md) |
| 10 | Activation (flag ON + 21 thần + P5) | XONG, [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) `7826f0c`; [PRD](tasks/prd-p4-activation.md), [báo cáo](docs/audits/p4-activation.md) |
| — | 卷十 劫煞 Option C v1 (相抵 → faithful authority) | **XONG & DEPLOYED**, [PR #87](https://github.com/nghiepnguyen/calendar-hana/pull/87) `85736fd`; §3 "卷十 劫煞 — Option C v1" |
| — | G1 壞/壊: audit G1-a + G1-b Stage 1/2 (`canonical-v1`) | **XONG & DEPLOYED**, [PR #99](https://github.com/nghiepnguyen/calendar-hana/pull/99) `394acbb`; §3 "Nợ chữ heading G1 / G2" |
| — | G2 劵/券 Stage 1 (authority audit + spec) | **XONG**, [PR #100](https://github.com/nghiepnguyen/calendar-hana/pull/100) `d47bcc6`; Stage 2 chưa làm |

Evidence từng mục (số đo, mutation, quyết định owner): history §42 và các báo cáo trên.

### Việc độc lập (làm khi owner yêu cầu)

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| S1 | 土王用事 SOURCE_DEPENDENT (đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không) | **PARTIALLY RESOLVED** (2026-10-21, [final review](docs/audits/p4-vol10-remaining-operands-research.md#s1--土王用事-final-review)). Chốt: 18 ngày trước 四立, 後 = nhãn khoảng, 土府 ≠ 土王, 德 không gỡ (卷十 「與徳合赦願併猶忌…以下並同」), JPL giữ. Còn mở: ngày onset khi 四立 rơi 00:00–06:17 (212/812 ca 1899–2101; 大統 dùng 土王策 18,2621 ngày 恆氣, 協紀/推步捷例 đếm ngày dân sự). Không đổi runtime. Trước đó đã thử archive.org (chỉ 《大清時憲書箋釋》 chép tay, OCR không dùng được), ctext (cấm truy cập tự động), scan 時憲書 Tohoku (225 canvas, chưa khóa mốc 土王). Evidence: `docs/audits/p4-vol10-remaining-operands-research.md` |
| H1-B | Ghép 忌 sống sót với 相抵 (owner 2026-10-17) | **PARTIALLY_SOURCE_WITNESSED**, audit-only ([review](docs/audits/p4-h1b-yuebiao-witness.md)). 月表 xác nhận lớp 重日/復日 + 德 (7 trang, 0 mâu thuẫn). Phần 劫煞 辰戌丑未 không 德 (tiền đề 相抵 → 不註) đã giải quyết ở tầng 卷十 bằng Option C v1 (PR #87). Tầng P4 (2025–2027) vẫn `cancel_both` cho 劫煞 — xem P4-劫 |
| X相抵 | 相抵 / `cancel_both` của 劫煞 辰戌丑未 không 德 | **XONG & DEPLOYED ở tầng 卷十** (Option C v1, PR #87, §3). Chuỗi audit và số đo: history §43. Còn mở: 災煞/月煞 (ứng viên 相抵 riêng), 月刑/天吏 có 德 UNRESOLVED (lẫn puzhu:06) — chưa audit, không đổi runtime |
| P4-劫 | Tầng P4 (2025–2027) cho 劫煞 辰戌丑未 không 德 | **MORE_EVIDENCE_REQUIRED**, không đổi runtime. Engine P4 vẫn `cancel_both` + P17-0. Blocker riêng của P4: F1 (lan truyền xuyên thần, vd. 五離/五虛), mệnh đề con thứ hai của puzhu:17 (亥日/厭對/八專/四忌/四窮; điều kiện xảy ra ở 71 context), puzhu:06 Q4 vs 戌-癸亥 và lớp 四相 (UNDETERMINED), nhãn scope SPEC_GAP, bất thường adapter medical. Chuyển P4 sang P17-A sẽ đổi Golden v2 ở 2026-08-02, 2027-07-28. Báo cáo: [faithful](docs/audits/p4-jiesha-faithful-vol10.md), [puzhu:17](docs/audits/p4-puzhu17-bujiang.md), [納財](docs/audits/p4-weishen-nacai-puzhu21.md) |
| G1 | Nợ chữ 壞/壊 (demolition) | **ĐÓNG & DEPLOYED** (PR #97 audit, #99 `canonical-v1`). Còn lại: ô demolition authority 劫煞 (Option C v2) — 5 context phụ thuộc ngày qua 土王用事, `NON_BLOCKING_FOLLOW_UP`; demolition vẫn `EXCLUDED_PENDING_GLYPH_AUDIT` ở authority v1 |
| G2 | Nợ chữ 劵/券 (contract/transaction) | **Stage 1 XONG** (PR #100). **Stage 2 sẵn sàng**: alias `headingAliases` 立劵交易 → [立券交易] + authority 劫煞 v2 (đã duyệt), envelope I1 đã đóng băng, phạm vi ngoài miền + event đã chấp nhận. Không gập `NORM`. Spec: `docs/audits/p4-g2-vol10-heading-match.md` |
| W1 | `未-戊申 × 立券交易`: 月表 n117 in 立券交易 ở dòng 忌, ô authority BLANK | **OPEN**, tách riêng, không chặn G2 ([item](docs/audits/p4-weishen-lijuan-authority-item.md)). Sơ bộ: chữ in do 五離, không phải 劫煞. Đổi ô = migration authority riêng có impact riêng; đến khi xong, BLANK là authority |
| S2 | Sát Chủ: chưa có nguồn Hán văn tiền hiện đại | **OPEN** (nguồn offline). Tháng nhuận **đã chốt** (owner 2026-10-20): dùng bảng của tháng gốc (nhuận 4 → tháng 4) cho mọi bảng Sát Chủ/Sát Sư và giờ Sát Chủ; ngày Can Chi chạy liên tục. Ghi ở header `stars.ts` + test nhuận 6/2025 trong `satChuAuthority.test.ts`; golden `sat-chu-golden-v1.json` vẫn ghi `UNRESOLVED` vì bytes bị khóa bởi `yi-freeze-v1` |
| R1 | Review mapping lượt hai: mansion 115/115, 用事 29/29 | **XONG** (PR #84): `DOUBLE_REVIEWED (semantic mapping)`, hai lượt AI-agent, chưa có chuyên gia người; §3 "28 Tú — audit" |
| R2 | Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích) | Đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | Coverage thiết bị: iPhone thật chưa chạy cho các release đổi điểm | Firefox P4 ON 4/4 (2026-10-19). iPhone: owner chạy theo checklist `docs/audits/p4-activation.md` § Smoke R3 (gồm luồng PWA update) |
| R4 | 百忌日 còn 6 ngày không có activity (庚 經絡, 辛 醖釀, 壬 開渠, 卯 穿井, 丑 冠帶, 午 苫蓋) | Không tự map; chỉ làm nếu thêm activity |
| E1 | Backlog `event_fit`: event không `very_high` lấy điểm trung bình profile (vd. 6 ngày `buy_property` recommended dù `moving` là `only_ji`, `docs/audits/p4-migration-diff.md`) | Owner giữ hiện hành ở go-live review; siết là phase riêng |
| P2 | 「凡巳日忌出行不註宜出師遣使」 | Không có activity 出師 → không làm |
| P1 | 天狗寅日 | XONG, PR #76 (§3) |
| F1 | 鋪註 puzhu:06 | XONG audit-only, [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) `e427e2b`; [báo cáo](docs/audits/p4b-puzhu06.md); hold còn lại đã vào roadmap 7 |
| R5 | Visual snapshot lệch do thiếu `.env.local` | XONG, [PR #63](https://github.com/nghiepnguyen/calendar-hana/pull/63) `3980183`: `playwright.config.ts` `webServer.env` đặt `VITE_FIREBASE_*` giả. Worktree mới cần `npm --prefix functions ci` trước `npm run build` |

### Phụ thuộc

```text
Roadmap P4: 4 ─► 5 ─► 6 ─► 7 ─► 7b ─► 8 ─► 9 ─► 9b ─► 10 (tất cả XONG)
P4 giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵) và event_fit hiện hành
S1, S2, R2–R4, E1, P2: độc lập (R1 xong)
Option C v1 (XONG) ─► G1 (XONG) ─► G2 Stage 1 (XONG) ─► G2 Stage 2 (authority 劫煞 v2) ─► Option C v2 (ô demolition, nếu owner duyệt)
W1 (未-戊申 × 立券交易): độc lập, không chặn G2
P4-劫: độc lập với tầng 卷十; cần F1, puzhu:17 mệnh đề 2, puzhu:06 Q4 trước khi đổi engine P4
```

## 6. Quy tắc cho agent

- "làm" = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. Merge/push `main` = deploy production: luôn hỏi owner; owner tự merge PR.
- Chỉ nói "gate xanh" khi lệnh local đã chạy EXIT 0; chỉ nói "deployed" khi job Deploy SUCCESS và `/version.json` `build` khớp commit.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Không sửa bytes file nằm trong lock/prior-hashes (`docs/audits/sources/**/lock.json`, `prior-hashes.json`); ghi quyết định mới ở test/docs. Ngoại lệ đã được owner duyệt: `p4-adapter-baseline-v1/lock.json` cập nhật qua migration có kiểm soát (gate so toàn bộ record, writer chuẩn, chỉ nối thêm `revisions[]`, giữ revision cũ).
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi. Hành vi mới đổi output → policy manifest riêng (ship true / giá trị mới), test lịch sử ghim giá trị cũ (như `tiangouYinNoYi`, `satChuNgocHapStars`, `xiejiVol10JieshaPolicy`, `p4ScoreHeadingLookup: 'source-key-v1'`).
- Phán quyết owner kiểu `OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS` (未-戊申 納財) là **cục bộ**: không suy ra quy tắc chung "nguồn văn luôn thắng 月表".
- Authority runtime phải khai rõ phạm vi phủ (APPLIED / EXCLUDED / UNREACHABLE); không fallback im lặng.
- Giá trị authority (vd. ô BLANK) có hiệu lực khi chuẩn hoá cho phép chạm tới; output cũ do không khớp heading là hành vi cài đặt, **không phải authority** (owner 2026-10-25, G2 I1). Không thêm lớp tương thích để giữ output không khớp.
- Alias chữ: ưu tiên alias hẹp, tường minh (`headingAliases`, `canonicalP4HeadingKey`); không gập ký tự toàn cục (`NORM`) khi chưa chứng minh an toàn trên toàn bộ từ vựng. Danh tính chữ ≠ danh tính activity: cần bằng chứng mức activity.
- Phân biệt `sourceRaw` (chữ nguồn) / khoá so sánh / khoá canonical runtime; harness audit phải key hai phía cùng một cách.

## 7. Quy trình, CI, tooling

**Quy trình:** branch → gate local → PR → **owner cho phép merge** → deploy → smoke production → cập nhật file này.

**CI chạy ở máy** (từ 2026-10-19):

1. `npm run check` (= `check:fast`) = lint → typecheck (app + functions), fail-fast. Hook `.githooks/pre-push` (`core.hooksPath`, đặt bởi `prepare`) chỉ chạy tầng này; FAIL → chặn push, bypass `--no-verify`.
   `npm test` = `vitest run` trừ `p4Puzhu17Audit.test.ts` (audit đóng băng ~600 s; chạy riêng `npm run test:p4:puzhu17-freeze`). `npm run check:audit-clean` = fail nếu test đã ghi đè artifact đã track dưới `docs/audits/sources/` (chạy sau khi commit; file đang sửa dở cũng bị báo).
2. `npm run test:changed` (tay) = `vitest run --changed origin/main`: test phụ thuộc file đổi; đổi `package.json`/config Vitest/setup → chạy hết; không thấy dữ liệu đọc qua `fs` (Golden TSV/JSON).
3. `npm run ci:full` (tay; `ci:local` là alias) = check → toàn bộ unit (`vitest run`, gồm puzhu17) → `check:audit-clean` → emulator → 2 mutation gate (annual, mansion) → Playwright desktop (webServer tự `npm run build`, visual snapshot) + legal pages Vite dev; không gọi `ci:p4`.
4. `npm run ci:p4` (tay, luôn chạy đủ) = mutation P4-B, P4-C (~25 phút), P5, puzhu:06, Full Golden, owner-rules, score adapter (almanac toàn miền + Score Golden v3 toàn miền + `golden.py` v3 + mutation 21), migration diff roadmap 9 (harness toàn miền) + migration diff v3 G1-b (`P4_MIGRATION_V3_FULL=1`) + mutation 14, migration 卷十 劫煞 Option C v1 (`JIESHA_MIGRATION_FULL=1`, ~3 phút) + mutation 14 (`audit-vol10-jiesha-mutations.py`); 15 bước. `npm run ci:p4:full` = `ci:p4` + `test:p4:heading-lookup-full`.
5. `npm run ci:p4:fast` (~3 phút) = check + test P4 chọn lọc (`vitest.p4fast.config.ts`) + `check:audit-clean`; vòng dev, **không** phải gate merge/release, không đủ cho thay đổi authority/Golden/migration.

Đổi `shared/`, `e2e/` → chạy `ci:full` trước merge; đổi `shared/lunar/p4*`/`scripts/audit-p4-*`, `xiejiVol10*`, authority 卷十, lookup heading → thêm `ci:p4:full`. GitHub chỉ còn `.github/workflows/deploy.yml`: push `main` → lint → build → `firebase deploy --only firestore,hosting,functions --project calendar-hana`, không test lại. Mobile Safari/iPhone/Firefox không thuộc gate. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi Actions hỏng và owner đồng ý.

```sh
npm run typecheck
npm run lint
npm test
npm run test:emulator            # cần Firebase CLI + Java
# Mutation runners: chạy TUẦN TỰ, không song song với test/build/edit
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
python3 scripts/audit-p4-grade-mutations.py   # và audit-p4-{authority,bridge,heading,day,coverage,season,remaining-ji}-mutations.py
python3 scripts/audit-p4-yi-mutations.py       # P4-C, ~25 phút; --shard=i/n để chia
python3 scripts/audit-p4-warehouse-mutations.py  # P5, 12 mutation
python3 scripts/audit-p4-puzhu06-mutations.py  # puzhu:06, 16 mutation, ~3 phút
python3 scripts/audit-p4-score-adapter-mutations.py  # roadmap 8, 21 mutation, ~2 phút; toàn miền: P4_SCORE_ADAPTER_FULL=1 npx vitest run shared/lunar/p4ScoreAdapterAlmanac.test.ts
P4_MIGRATION_FULL=1 npx vitest run shared/lunar/p4MigrationDiff.test.ts  # roadmap 9 harness toàn miền ~5 phút; thêm P4_MIGRATION_WRITE=1 để sinh lại p4-migration-diff-v1 (cây sạch)
python3 scripts/audit-p4-migration-mutations.py  # roadmap 9, 14 mutation tuần tự, ~15 phút
JIESHA_MIGRATION_FULL=1 npx vitest run shared/lunar/xiejiVol10JieshaMigration.test.ts  # 卷十 劫煞 Option C v1: legacy vs faithful-v1 vs simulator, 2.710 ngày
python3 scripts/audit-vol10-jiesha-mutations.py  # Option C v1, 14 mutation tuần tự
# G1-b: Score Golden v3 (generator) và migration diff v3 + rollback proof toàn miền
python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v3/golden.py
P4_MIGRATION_V3_FULL=1 npx vitest run shared/lunar/p4MigrationDiffV3.test.ts
# G2 Stage 1 (audit): impact toàn miền + 2028; dải 1900–2100 (thêm G2_EVENTS_FULL=1 cho event mỗi ngày, ~6 phút)
G2_FULL=1 npx vitest run shared/lunar/p4G2Stage1Audit.test.ts
G2_RANGE=1 npx vitest run shared/lunar/p4G2Stage1Audit.test.ts -t 'supported range'
# puzhu:06: baseline/sweep verify bytes; P4B_PUZHU06_WRITE=1 ghi lại; Golden: python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/derive.py
# Quét P4-B 1095 ngày (ghi TSV + summary)
P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts shared/lunar/p4LunarDayComposition.test.ts shared/lunar/p4PuzhuEnd.test.ts shared/lunar/p4LunarPhase.test.ts
npx playwright test --project=desktop
npx playwright test e2e/mansion-content.spec.ts --project=desktop --project=mobile
# Báo cáo migration / chẩn đoán (ghi TSV qua REPORT_FILE)
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
REPORT_FILE=docs/audits/legacy-gods-month-jian-migration.tsv npx vitest run shared/lunar/legacyGodsMonthJian.test.ts
REPORT_FILE=docs/audits/xieji-god-presence-2025-2027.tsv npx vitest run shared/lunar/xiejiGodPresence.test.ts
```

**Smoke production sau release đổi điểm:** spec Playwright (vd. `e2e/xieji-vol10-activation.spec.ts`) qua config tạm `{...base, webServer: undefined, baseURL: production}`; chạy **trước** và **sau** deploy; kiểm bundle production; xoá file tạm. Profile ngày sinh chỉ lưu trong browser context tạm. "Mục tiêu và kết luận" chỉ hiện khi đã nhập ngày sinh; ô sao cần bấm "xem thêm" (nút `aria-expanded` ngay sau `h4` "Sao tốt (n)" / "Sao xấu (n)"), không bấm lan mọi `aria-expanded` (treo test). Release chỉ thêm sao/hiển thị: smoke 1–2 ngày làm chứng + console sạch là đủ.

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore`, `.claude/` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Giữ test production bất biến chạy manifest thật (`baijiProductionInvariants.test.ts`, Golden P2 `baijiTyHoi.test.ts`); không ghim chúng về flag cũ để che regression. Test migration lịch sử ghim trạng thái cũ bằng mock manifest/catalog (`xiejiVol10Scoring: false`, `legacyGodsMonthJian: false`, `tiangouYinNoYi: false`, `satChuNgocHapStars: false`, `xiejiVol10JieshaPolicy: 'legacy-cancel-both'`, `p4ScoreHeadingLookup: 'source-key-v1'` cho Score Golden v2 / migration diff v2, mapping event cũ qua `legacyEventMapping.ts`). Lưu ý: setup test nạp provider P4 trước, nên `vi.mock` module trong graph đó (vd. `xiejiVol10Resolution`) không có tác dụng; ghim qua manifest hoặc `vi.resetModules` + `vi.doMock` + import động. Kết quả factory `vi.mock` hoisted **không** đổi sau `vi.resetModules` → so nhiều model trong một file phải dùng `vi.doMock` từng model và có sanity assert model đã có hiệu lực (bài học G2 Stage 1). Release đổi output mới phải ghim lại các test lịch sử theo cách này, không sửa Golden.
- Nguồn 協紀 dạng text: Wikisource raw `https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷NN&action=raw` (NN = 03…11); SHA-1 prefix ghi trong `xieji-god-definitions.json` và các audit doc.
- Nguồn ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692.cn`–`06067697.cn` (2 quyển/item; trang ngày = n6+i ở quyển đầu, n73+i ở quyển sau, i = chỉ số lục thập hoa giáp từ 甲子; witness khoá ở `docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json`); scan 卷九–卷十 `06067686.cn` (鋪註條例 n222–n229). Cách trích ảnh: history §24.
- _Ngọc Hạp Chánh Tông_: `~/Downloads/Ngoc hap chanh tong.pdf` (SHA-1 `95c29e2f…`, bản ghi trong golden) và `~/Downloads/Ngọc Hạp Chánh Tông.pdf` (SHA-1 `ded5d57c…`, scan ncphuc1977, 69 trang PDF mỗi trang 2 trang sách; sách tr. 128–133 = PDF tr. 66–68). Máy không có poppler: render trang bằng PDFKit qua script Swift. Spec user ở `~/Downloads/`.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main `d47bcc6` đã deploy (PR #100, G2 Stage 1 audit/spec). Output đổi gần nhất PR #99 G1-b Stage 2: `p4ScoreHeadingLookup: canonical-v1` (demolition 2025–2027, 353 ngày). G1 壞/壊 ĐÓNG; G2 劵/券 Stage 1 XONG, Stage 2 (alias `headingAliases` 立劵交易 → [立券交易] + authority 劫煞 v2, envelope I1) đã duyệt, chưa làm; mục `未-戊申 × 立券交易` mở riêng. Option C v1 ON (`xiejiVol10JieshaPolicy: faithful-v1`, authority v1 352 ô APPLIED). P4 ON (activation PR #71), P1 天狗寅日 ON (PR #76), sao Sát Chủ/Sát Sư Ngọc Hạp ON (PR #78, #80). Repo public; CI chạy ở máy (`check` qua pre-push; `test:changed`, `ci:full`, `ci:p4`/`ci:p4:full` chạy tay; `ci:p4:fast` chỉ là vòng dev), GitHub chỉ deploy; merge/push main = deploy production, luôn hỏi owner, owner tự merge. Production: 卷十 ON (6 chain; 劫煞 辰戌丑未 không 德 theo authority faithful-v1), P4 balancing ON (2025–2027, sau khi provider `p4AlmanacHeadings` nạp), mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian. Audit 28 Tú đóng & deploy (content 1.0.4, `DOUBLE_REVIEWED (semantic mapping)` bởi hai lượt AI-agent). Việc tiếp theo: G2 Stage 2 hoặc §5 "Việc độc lập" (S1, S2, R2–R4, E1, W1, P4-劫, Option C v2) khi owner yêu cầu. Golden trước code, không sửa Golden/authority/lock để test xanh; hành vi mới đổi output → policy manifest riêng; mutation runner chạy tuần tự. Lịch sử ở `docs/project-context/history.md` (§42 = bản đầy đủ trước khi thu gọn, §44 = PR #88–#100).
