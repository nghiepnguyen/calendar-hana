# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-21 (giờ VN). Main `ac25ce6` đã deploy (PR #84, audit 28 Tú). Roadmap P4 (1–10) xong, P4 ON trên production. Audit 28 Tú ĐÓNG & DEPLOYED (xem §3 "28 Tú — audit"). Không có mục roadmap đang làm; việc tiếp theo chọn từ §5 "Việc độc lập" khi owner yêu cầu.
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
| Main đã deploy | `ac25ce6` ([PR #84](https://github.com/nghiepnguyen/calendar-hana/pull/84) audit 28 Tú: sửa 5 quote, ontology xây dựng, evidence confidence; content 1.0.4; 2026-10-21). Chỉ đổi hiển thị/evidence, không đổi điểm/status. Runtime trước đó `ca3c983` ([PR #80](https://github.com/nghiepnguyen/calendar-hana/pull/80) Tháng Sát Chủ + giờ Sát Chủ cá nhân). Output điểm/status đổi gần nhất: `5913c98` (PR #76 P1) |
| Bundle | `/assets/index-CRGNGEqY.js`, SHA-256 `fce1aaea29c4f878fd75a31f3558c59393a1d4194eab45c8c06ac664982a8474` (build `ac25ce6`, kiểm 2026-10-21; chưa so byte với build local). Trước đó `index-BOXM4O_Y.js` `b591b41d…` (`ca3c983`). Cách so byte với build local: `GITHUB_SHA=<sha> npm run build`, thay `builtAt` local bằng giá trị `/version.json` → `index-*.js` trùng production ngoài tham chiếu hash chunk; build local cần `VITE_FIREBASE_*` của bundle production (config public) |
| Deploy gần nhất | [deploy 39518653568](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39518653568) `ac25ce6` SUCCESS 2026-10-21; `/version.json` build `ac25ce6`. Smoke production 2026-10-21 PASS (desktop: 柳 10/10/2026 quote `埋葬瘟□多□□` + ghi chú chữ khó đọc, hộp thoại Sao Liễu, 星 11/10/2026 Xây dựng có 造新房, `mansion-content.spec.ts`; console sạch). Trước đó [deploy 39348730720](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39348730720) `94f5319` SUCCESS 2026-10-20 |
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
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`, Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` |
| P4 — cân bằng 卷十 | **ON** (PR #71, 2026-10-18) | Roadmap §5; soil `p4-soil-owner-convention-v1` OWNER_ADOPTED_SOURCE_DEPENDENT, canonical S1 PARTIALLY RESOLVED (còn mở onset khi 四立 rơi sớm trong ngày). [progress](docs/audits/p4-vol10-progress.md), [P4-B](docs/audits/p4-vol10-remaining-ji.md), [activation](docs/audits/p4-activation.md) |
| CI | Local từ 2026-10-19 (§7); GitHub chỉ deploy | Shard unit trên Actions (PR #52/#53) đã thay bằng `check`/`test:changed`/`ci:full`/`ci:p4` chạy ở máy (PR #74) |
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
→ applyVol10Scoring — khi xiejiVol10BalancingEnabled ON: applyP4Balancing thay 6 chain cho activity có heading P4 (cần provider `p4AlmanacHeadings` đã nạp, 2025–2027)
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

Roadmap P4 1–10 xong (activation PR #71, owner cho phép 2026-10-18). Không có mục roadmap mới. Mục cần owner quyết thì dừng và hỏi, không tự chọn.

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

Evidence từng mục (số đo, mutation, quyết định owner): history §42 và các báo cáo trên.

### Việc độc lập (làm khi owner yêu cầu)

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| S1 | 土王用事 SOURCE_DEPENDENT (đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không) | **PARTIALLY RESOLVED** (2026-10-21, [final review](docs/audits/p4-vol10-remaining-operands-research.md#s1--土王用事-final-review)). Chốt: 18 ngày trước 四立, 後 = nhãn khoảng, 土府 ≠ 土王, 德 không gỡ (卷十 「與徳合赦願併猶忌…以下並同」), JPL giữ. Còn mở: ngày onset khi 四立 rơi 00:00–06:17 (212/812 ca 1899–2101; 大統 dùng 土王策 18,2621 ngày 恆氣, 協紀/推步捷例 đếm ngày dân sự). Không đổi runtime. Trước đó đã thử archive.org (chỉ 《大清時憲書箋釋》 chép tay, OCR không dùng được), ctext (cấm truy cập tự động), scan 時憲書 Tohoku (225 canvas, chưa khóa mốc 土王). Evidence: `docs/audits/p4-vol10-remaining-operands-research.md` |
| H1-B | Ghép 忌 sống sót với 相抵 (owner 2026-10-17) | **PARTIALLY_SOURCE_WITNESSED**, audit-only (nhánh `claude/h1b-yuebiao-witness`, chưa merge; [review](docs/audits/p4-h1b-yuebiao-witness.md)). 月表 xác nhận lớp 重日/復日 + 德 (7 trang, 0 mâu thuẫn). **Chờ owner:** 11 trang 月表 劫煞 tháng 辰/戌/未 không 德 vẫn in 忌 các heading mà Golden v2/production để `neither_recorded` (tới 235 dòng ngày, 14 ngày 2025–2027) — tiền đề 相抵 → 不註, không phải H1-B. Không đổi runtime |
| X相抵 | 相抵 / `cancel_both` (tách khỏi H1-B) | Audit evidence-only (nhánh `claude/xiangdi-cancel-both-audit`, chưa merge; [audit](docs/audits/p4-xiangdi-cancel-both-audit.md)). **劫煞 辰戌丑未 không 德: `cancel_both` bị 月表 phản bác** (辰/戌/未 39/39 cụm). Đọc chữ 「凡所忌者則不註宜所宜者亦不註忌」 = chỉ bỏ heading có 宜 + cặp 鋪註: PARTIALLY_SOURCE_WITNESSED (in-sample). 災煞/月煞 ứng viên riêng; 月刑/天吏 có 德 UNRESOLVED (lẫn puzhu:06). Ảnh hưởng mọi năm qua 卷十 scoring. **Impact study** (nhánh `claude/jiesha-overlap-impact`; [báo cáo](docs/audits/p4-jiesha-overlap-impact.md)): 鳴吠對 宜 啟攢 (không 宜 安葬) + 鋪註 「有宜啟攢不註忌安葬」 giải thích 丑 (3/3); OVERLAP 42/42 cụm vs production 2/42. 1900–2100: tối đa 15.158 activity −15, 3.314 event caution→not_recommended (cận trên — tầng 卷十 không có cặp 鋪註); 2025–2027: 136 activity, 50 event. J5 MORE_EVIDENCE_REQUIRED (tầng 卷十). **Simulator trung thực** (nhánh `claude/jiesha-faithful-vol10-sim`; [báo cáo](docs/audits/p4-jiesha-faithful-vol10.md)): verdict 卷十 劫煞 = hàm của (context, activity), 384 ô; 1900–2100: 17.242 activity đổi điểm (CONFIRMED, 0 unresolved), thêm 鋪註05 (求醫療病 遇徳猶忌); F1 (lan truyền xuyên thần) SOURCE_DEPENDENT chỉ tầng P4; đề xuất kiến trúc C (bảng authority sinh từ engine P4). **puzhu:17 不將** (nhánh `claude/puzhu17-bujiang-audit`; [audit](docs/audits/p4-puzhu17-bujiang.md)): ngoại lệ là điều kiện trên nguồn 宜 — 嫁娶 chỉ có 宜 từ 不將 thì không lan truyền; 月表 未-壬申/未-戊申 7/7 ô ủng hộ, engine hiện tại (P17-0) sai 5; bảng 384 ô đổi 3 ô (未-壬申 wedding/engagement/moving → avoid); kiểm 16 trang: 未-戊申 納財 宜 (qua puzhu:21) còn có thể đổi tới 5 ô → F2_TABLE PARTIAL, VOL10_OPTION_C và P4 đều MORE_EVIDENCE_REQUIRED. **未-戊申 納財 / puzhu:21** (nhánh `claude/weishen-nacai-puzhu21-audit`; [audit](docs/audits/p4-weishen-nacai-puzhu21.md)): nguồn (四相 宜 納財, mệnh đề 劫煞, puzhu:06) đều cho 納財 không chú 忌 → bảng = bảng P17-A, 0 ô đổi; trang n117 tự mâu thuẫn (in 納財 nhưng bỏ 開市), mọi cách đọc đều sai ≥1 ô → **dừng chờ owner**: nguồn có thắng 1 ô 月表 hay không (nếu theo trang: 5 ô, 108 ngày, 328 activity −15). **Owner chọn nguồn** cho 未-戊申 納財 (phán quyết cục bộ). **Gate cuối** (nhánh `claude/option-c-final-gate`; [audit](docs/audits/p4-option-c-final-gate.md)): 丑-丙寅 in 月德 làm đổi 2 ô (construction, warehouse) × 99 ngày, 198 activity +15 → F2_TABLE PARTIAL, Option C chưa sẵn sàng; chờ owner chọn D-A (384 ô) hay D-B (360 ô). **Audit nguồn 月德** (nhánh `claude/chou-bingyin-yuede-source-audit`; [audit](docs/audits/p4-chou-bingyin-yuede.md)): 歴例 「四八十二月在庚」, project chép đúng; 月德 10 trang khớp, 0 thiếu, 1 thừa (n75); 月空 4/0/0; 丑-庚寅 in 月德 (đọc lại full-res) → 月德 trên n75 丙寅 là lỗi chép (WITNESS_PRINTING_ERROR) → D-A. F2_TABLE COMPLETE, **VOL10_OPTION_C MIGRATION_READY**; candidate audit-only 384 ô / 177 avoid. P4 vẫn MORE_EVIDENCE_REQUIRED. **Chờ owner duyệt triển khai.** **Chờ owner**, không đổi runtime |
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
```

## 6. Quy tắc cho agent

- "làm" = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. Merge/push `main` = deploy production: luôn hỏi owner; owner tự merge PR.
- Chỉ nói "gate xanh" khi lệnh local đã chạy EXIT 0; chỉ nói "deployed" khi job Deploy SUCCESS và `/version.json` `build` khớp commit.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Không sửa bytes file nằm trong lock/prior-hashes (`docs/audits/sources/**/lock.json`, `prior-hashes.json`); ghi quyết định mới ở test/docs. Ngoại lệ đã được owner duyệt: `p4-adapter-baseline-v1/lock.json` cập nhật qua migration có kiểm soát (gate so toàn bộ record, writer chuẩn, chỉ nối thêm `revisions[]`, giữ revision cũ).
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi. Hành vi mới đổi output → policy manifest riêng (ship true), test lịch sử ghim false (như `tiangouYinNoYi`, `satChuNgocHapStars`).

## 7. Quy trình, CI, tooling

**Quy trình:** branch → gate local → PR → **owner cho phép merge** → deploy → smoke production → cập nhật file này.

**CI chạy ở máy** (từ 2026-10-19):

1. `npm run check` = lint → typecheck (app + functions), fail-fast. Hook `.githooks/pre-push` (`core.hooksPath`, đặt bởi `prepare`) chỉ chạy tầng này; FAIL → chặn push, bypass `--no-verify`.
2. `npm run test:changed` (tay) = `vitest run --changed origin/main`: test phụ thuộc file đổi; đổi `package.json`/config Vitest/setup → chạy hết; không thấy dữ liệu đọc qua `fs` (Golden TSV/JSON).
3. `npm run ci:full` (tay; `ci:local` là alias) = check → toàn bộ unit → emulator → 2 mutation gate (annual, mansion) → Playwright desktop (webServer tự `npm run build`, visual snapshot) + legal pages Vite dev; không gọi `ci:p4`.
4. `npm run ci:p4` (tay, luôn chạy đủ) = mutation P4-B, P4-C (~25 phút), P5, puzhu:06, Full Golden, owner-rules, score adapter (almanac toàn miền + mutation 21), migration diff roadmap 9 (harness toàn miền + mutation 14); 11 bước ~1h20m.

Đổi `shared/`, `e2e/` → chạy `ci:full` trước merge; đổi `shared/lunar/p4*`/`scripts/audit-p4-*` → thêm `ci:p4`. GitHub chỉ còn `.github/workflows/deploy.yml`: push `main` → lint → build → `firebase deploy --only firestore,hosting,functions --project calendar-hana`, không test lại. Mobile Safari/iPhone/Firefox không thuộc gate. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi Actions hỏng và owner đồng ý.

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
- Giữ test production bất biến chạy manifest thật (`baijiProductionInvariants.test.ts`, Golden P2 `baijiTyHoi.test.ts`); không ghim chúng về flag cũ để che regression. Test migration lịch sử ghim trạng thái cũ bằng mock manifest/catalog (`xiejiVol10Scoring: false`, `legacyGodsMonthJian: false`, `tiangouYinNoYi: false`, `satChuNgocHapStars: false`, mapping event cũ qua `legacyEventMapping.ts`). Release đổi output mới phải ghim lại các test lịch sử theo cách này, không sửa Golden.
- Nguồn 協紀 dạng text: Wikisource raw `https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷NN&action=raw` (NN = 03…11); SHA-1 prefix ghi trong `xieji-god-definitions.json` và các audit doc.
- Nguồn ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692.cn`–`06067697.cn` (2 quyển/item; trang ngày = n6+i ở quyển đầu, n73+i ở quyển sau, i = chỉ số lục thập hoa giáp từ 甲子; witness khoá ở `docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json`); scan 卷九–卷十 `06067686.cn` (鋪註條例 n222–n229). Cách trích ảnh: history §24.
- _Ngọc Hạp Chánh Tông_: `~/Downloads/Ngoc hap chanh tong.pdf` (SHA-1 `95c29e2f…`, bản ghi trong golden) và `~/Downloads/Ngọc Hạp Chánh Tông.pdf` (SHA-1 `ded5d57c…`, scan ncphuc1977, 69 trang PDF mỗi trang 2 trang sách; sách tr. 128–133 = PDF tr. 66–68). Máy không có poppler: render trang bằng PDFKit qua script Swift. Spec user ở `~/Downloads/`.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main `ac25ce6` đã deploy (PR #84, audit 28 Tú); P4 ON (activation PR #71), P1 天狗寅日 ON (PR #76), sao Sát Chủ/Sát Sư Ngọc Hạp ON (PR #78, #80). Repo public; CI chạy ở máy (`check` qua pre-push; `test:changed`, `ci:full`, `ci:p4` chạy tay), GitHub chỉ deploy; merge/push main = deploy production, luôn hỏi owner, owner tự merge. Production: 卷十 ON (6 chain), P4 balancing ON (2025–2027, sau khi provider `p4AlmanacHeadings` nạp), mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian. Audit 28 Tú đóng & deploy (content 1.0.4, `DOUBLE_REVIEWED (semantic mapping)` bởi hai lượt AI-agent, chưa có chuyên gia người; mapping blocker: không). Không có mục roadmap đang làm; việc tiếp theo từ §5 "Việc độc lập" (S1, S2, R2–R4, E1) khi owner yêu cầu. Golden trước code, không sửa Golden/authority/lock để test xanh; hành vi mới đổi output → policy manifest riêng; mutation runner chạy tuần tự. Lịch sử ở `docs/project-context/history.md` (§42 = bản đầy đủ trước khi thu gọn).
