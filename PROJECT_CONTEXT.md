# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-13 (giờ VN), sau audit P4-B local (witness 月表, ngày âm 12/15, 朔弦望 và 鋪註 27/28, nghiệm thu P4-B theo soil authority owner 2026-10-13; nhánh `codex/p4-remaining-ji-audit`, draft PR #54, P4-B đã commit local: authority/Golden `c0d8f56`, implementation/evidence `1e90669`; chuẩn bị push và CI cuối PR #54); PR #53 đã merge (`8789115`, timeout test), chưa kiểm lại deploy của #53 trong lượt này. Runtime gần nhất: PR #49 (sửa 月破 仍忌, đổi điểm 11 ngày, đã smoke). PR #48, #50, #51 là audit/tài liệu, không đổi runtime.
> Tài liệu này không thay thế yêu cầu mới của người dùng.
> Lịch sử chi tiết (phase, PR, số đo, release evidence): [`docs/project-context/history.md`](docs/project-context/history.md) — “history §N” trỏ về phần N trong file đó.
> **Quy tắc cập nhật:** sửa tại chỗ các mục trạng thái / vấn đề mở / next steps. Không thêm “phần N+1”. Chi tiết release ghi vào `docs/audits/` hoặc history.

## 1. Project

- **Repo:** `nghiepnguyen/calendar-hana` (public, MIT) · **Production:** <https://lich.thanhnghiep.top> · **Default branch:** `main`
- Lịch dương/âm Việt Nam + lịch vạn niên, chọn ngày, phong thủy — kiến trúc audit được. Không gom quy tắc truyền thống thành “điểm tốt/xấu” tùy ý: mỗi rule cần nguồn, operand, convention và test độc lập trước khi ảnh hưởng production.

### Nguyên tắc authority

1. Astronomy/calendar core deterministic.
2. Rule truyền thống deterministic (12 Trực, 28 Tú, Hoàng/Hắc đạo) phải source-lock/convention-lock.
3. Cát/Hung thần, Thụ Tử, Sát Chủ và rule phụ thuộc sách/phái phải audit provenance trước khi migrate production.
4. Golden độc lập với production, **đóng băng trước code**; không sửa Golden để test xanh.
5. Không hardcode ngày, skip test hoặc nới assertion để che authority conflict.
6. Không dùng “đa số website giống nhau” làm authority; không majority vote.
7. Khác biệt phải phân loại: `ENGINE_BUG`, `GOLDEN_BUG`, `SPEC_BUG`, `CONVENTION_DIFFERENCE`, `SOURCE_DEPENDENT`, `NAMING_ONLY`, `UNKNOWN`.
8. Migration diff phân loại: `EXPECTED_AUTHORITY_MIGRATION_CHANGE` / `UNEXPECTED_REGRESSION`.
9. Không reopen astronomy hoặc phase CLOSED nếu không có bằng chứng mới.

## 2. Trạng thái production

| Hạng mục | Giá trị |
|---|---|
| Main đã deploy | `94cdb05` (merge PR #52, chỉ CI/test); thay đổi runtime gần nhất là `1fc9940` (PR #49) |
| Bundle | `/assets/index-CeLinrvj.js`, SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` (trùng build local; kiểm trên production 2026-10-11) |
| Deploy gần nhất | [CI run 38146400830](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38146400830), commit `94cdb05`, SUCCESS (4 shard unit, gates, Playwright 2 shard, Deploy); cả pipeline 5m11s (trước 11m43s). Bundle production kiểm lại sau deploy: không đổi so với PR #49 |
| Dataset | `datasetVersion` 1.2.1, `schemaVersion` 1.1.0 |
| Catalog | 32 activities (đều enabled), 11 event profiles |

PR #49 đổi điểm `medical`/`demolition` ở 11/1095 ngày (chi tiết bảng §3). Run main của PR #51 (`2f14092`) đỏ do test 720 context vượt timeout 5 s nên bỏ qua deploy; PR #52 sửa timeout và deploy lại xanh (production không bị ảnh hưởng vì #51 không đổi runtime). Smoke production PR #49: 2025-07-06 / 2025-07-19 / 2025-07-05 (đối chứng) đúng kỳ vọng trên desktop Chrome và Pixel 7. Safari desktop, iPhone, Firefox chưa chạy (R3).

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
| `aiMayChangeScore` | false | |

Rollback (flag về false trên nhánh riêng → PR → CI deploy → smoke; không sửa Golden): `xiejiVol10Scoring` (history §38–39), `legacyGodsMonthJian` (`docs/audits/dormant-legacy-gods.md`).

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
| 5 Sát Chủ | **SOURCE_DEPENDENT** | Tháng âm; 7 Hợi / 8 Sửu thống nhất calendar ↔ personal (PR #8); `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md` |
| 6 Thái Tuế/Tuế Phá/Tam Sát | CLOSED & DEPLOYED | `annual-directions-authority-v1`, boundary 立春 exact instant; `docs/audits/tai-tue-tue-pha-tam-sat-provenance.md` |
| 7 28 Tú 宜/忌 | CLOSED & DEPLOYED | 玉匣記 1880, `mansion-content-yuxia-1880-v1`, 115 clauses; `docs/audits/28-mansion-content-provenance.md` |
| Activity taxonomy/mapping/diagnostics/explainability | DEPLOYED | Mansion mapping 115/115, 用事 29/29 (single reviewer); `docs/audits/xieji-activity-mapping-review.md` |
| Trực/thần + 卷十 diagnostics | DEPLOYED | `docs/audits/truc-than-context-audit.md`, `xieji-vol10-resolution.md`, `xieji-monthly-sha-presence.md` |
| Thiên Đức legacy tháng quẻ | RESOLVED, bỏ theo 月表 (PR #21) | `docs/audits/tiande-yuebiao.md` |
| 百忌日 甲日/乙日 | DEPLOYED (PR #26) | `docs/audits/baiji-giap-at.md` |
| 百忌日 寅/酉/申/未 (祭祀/宴會/安牀/求醫療病) | DEPLOYED (PR #40) | `docs/audits/baiji-dayzhi.md`; chỉ activity đổi, event không đổi |
| 百忌日 巳日 出行 / 亥日 嫁娶 | DEPLOYED (PR #42) | `docs/audits/baiji-ty-hoi.md`; `travel` = Xuất hành (owner); mọi ngày Tỵ: Xuất hành ≤ Cân nhắc; mọi ngày Hợi: Cưới hỏi Không thuận lợi |
| 土王用事 | DEPLOYED (PR #29), còn SOURCE_DEPENDENT | `docs/audits/tu-vuong-dung-su.md` |
| Event bỏ activity phụ trùng heading | DEPLOYED (PR #37, #38) | `open_business` bỏ `business` (開市), `sign_contract` bỏ `transaction` (立券交易), `groundbreaking` bỏ `construction` (興造動土); 1095 ngày: recommended → caution 40 / 80 / 6, event khác không đổi. Proof `kaishiDoubleCountMigration.test.ts`, `sameHeadingDuplicateMigration.test.ts`; test lịch sử ghim mapping cũ qua `legacyEventMapping.ts` |
| P3a — định nghĩa 協紀 cho 35 thần | DONE (PR #43, audit) | `shared/almanac-data/xieji-god-definitions.json` (quy tắc + trích dẫn nguyên văn + offset, SHA-1 từng quyển), `xiejiGodDefinitions.test.ts`; owner chốt 往亡 (氣往亡 = tên liên quan, quy tắc khác), 不將 bỏ 六月戊午, 五富 順行 (逆行 lưu `alternative`) |
| P3b — presence evaluator | DONE (PR #44) | `shared/lunar/xiejiGodPresence.ts` (`xieji-god-presence-v1`), runtime đọc `xieji-god-tables.json` (bảng không trích dẫn, test buộc khớp definitions); `docs/audits/xieji-god-presence-2025-2027.tsv` |
| Release A — 14 thần legacy theo Month Jian | **DEPLOYED (PR #45)** | Flag `legacyGodsMonthJian`; Golden `golden-legacy-gods-month-jian.json` (52 ca, đóng băng `70ed321`); migration `legacyGodsMonthJian.test.ts` + `docs/audits/legacy-gods-month-jian-migration.tsv`; `docs/audits/dormant-legacy-gods.md` |
| 月破 子午未申 仍忌 | **DEPLOYED (PR #49)** | Clause 「…不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣」: resolver trước chỉ giữ danh sách gốc nên medical/demolition `not_listed`, Trực Phá vẫn +25. Sửa (`yuePoStillAvoidPolicy.ts`, cách đọc sát chữ: danh sách gốc + 3 việc 仍忌); 1095 ngày: 11 ngày, medical recommended → watch 5 / watch giữ 6, demolition recommended → avoid 5 / watch → strong_avoid 6, mỗi dòng −50; event không đổi. `yuePoStillAvoidMigration.test.ts` |
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`, Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` (39 ca) |
| P4 — cân bằng 卷十 (audit-only) | P4-B roadmap 4 ĐÃ NGHIỆM THU theo owner convention; không đổi runtime | Draft PR #54: 26 entry + puzhu:28 + 21 dormant; 31.755 dòng / 0 thiếu operand 凶 / 0 conflict. Soil `p4-soil-owner-convention-v1` **OWNER_ADOPTED_SOURCE_DEPENDENT** (phê duyệt mới 2026-10-13); canonical onset/後/定氣 còn OPEN (S1). Mục 5 chưa làm. [`progress`](docs/audits/p4-vol10-progress.md), [`P4-B`](docs/audits/p4-vol10-remaining-ji.md) |
| CI — chia shard unit | **DEPLOYED (PR #52)** | Vitest 4 shard song song + job “Mutation and emulator gates”; timeout 60 s cho 6 test quét 720 context P4, 5 s cho test vuốt `App.test.tsx`; `testTimeout` mặc định 30 s (PR #53, sau khi `catHungRegression` vượt 5 s trên CI); job Unit ~10 phút → 4 × ~2m20s |
| Coverage P2 / R5 — 百忌日 + hard warning | **DONE, MERGED & DEPLOYED (PR #47)** | Golden P2 dùng manifest thật; migration lịch sử tách riêng; 9 rule trên 1095 ngày 2025–2027, event có/không giờ, 3 vùng điểm hard warning; 2 mutation bị bắt; local 165 file / 2952 test qua; [CI PR](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38098804753) và CI main xanh; `docs/audits/baiji-production-coverage.md` |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng | Personal annual afflictions giữ convention cũ, chưa chứng nhận |

## 4. Runtime pipeline

```text
computeAlmanac
  sao ngày: bảng legacy stars.data.ts (tháng âm)
    − thay bằng source-locked: Nguyệt Đức/Đức Hợp/Phá, Kiếp Sát, Thiên Đức/Hợp (Month Jian, Phase 4D)
    − thay bằng Month Jian: 14 thần legacy (getXiejiGodPresence, flag legacyGodsMonthJian), giữ vị trí bảng
    + Thụ Tử (authority), + day-rule gods (Trừ Thần, 百忌日, Nhân Thần, 土王用事)
  → present gods + godPresence (operand cho thần đã khoá)
→ classicalDay + activity contributions
→ getActivityRecommendations
→ applyVol10Scoring (flag ON)
→ cap/status hoạt động
→ evaluateEventDay (criteria + score/classification + diagnostics)
→ daily UI/evidence
```

Bảng verdict 卷十 → điểm (`xieji-vol10-scoring-v1`):

| Verdict | Hành vi |
|---|---|
| `avoid` | Giữ delta âm; delta dương → âm cùng độ lớn; chain chưa có dòng âm → thêm `xieji10:<entry>:<activity>` −25 (không tạo hard warning) |
| `not_avoided` | Delta âm → 0 (`informational`); giữ dòng dương |
| `no_annotation` (不註/不忌) | Delta → 0; nếu mọi dòng bị bỏ → activity `neutral`, score 50 |
| `not_listed` / `undetermined` | Giữ nguyên |

Chi tiết contract: history §39-C.

Lưu ý UI: ô “Sao tốt & sao xấu” (`StarChips`) chỉ hiện 5 sao đầu mỗi nhóm trước “xem thêm” → thứ tự sao là hành vi sản phẩm. Phần sao từ bảng ngày giữ thứ tự `STARS`; sao source-locked nối sau. Test Release A buộc thứ tự giữ nguyên ở ngày tháng âm = Month Jian.

## 5. Vấn đề mở và việc tiếp theo

Roadmap đánh số theo **thứ tự thực hiện**. Làm dứt điểm từng mục: chỉ chuyển mục kế khi mục hiện tại đạt “Xong khi”. Mục cần owner quyết thì dừng ở đó và hỏi, không tự chọn. P4 được owner duyệt hướng triển khai có điều kiện (spec §9); chưa duyệt activation/merge/deploy của scoring P4.

### Roadmap

| # | Việc | Trạng thái | Xong khi | Cần owner |
|---|---|---|---|---|
| 1 | ~~Smoke production PR #49~~ | **XONG** 2026-10-11: 6/6 desktop Chrome + Pixel 7 (`docs/audits/yue-po-still-avoid-release.md`) | — | — |
| 2 | ~~Merge PR #48~~ | **XONG**: merge `2cf7bb3`, deploy SUCCESS, bundle production vẫn `f29f5aab…` | — | — |
| 3 | ~~Quyết định 「又為X」~~ | **XONG**, merged PR #51 (audit-only): B theo nguồn — 土府/血支 專忌 = phạm vi bảo vệ, 死神 thuộc 平日, 大耗/地火/月虛/天火/咸池 = phạm vi riêng convention; 德願 giữ undetermined (`docs/audits/p4-vol10-youwei-scopes.md`) | — | — |
| 4 | **P4-B — mô hình các 凶 khác của 卷十一** (四廢, 五墓, 往亡, 八專, 四忌, 四窮, 厭對, 歸忌, 天賊, 小耗, 死氣, 遊禍…) và 21 thần dormant vào ghép ngày (audit-only) | **ĐÃ NGHIỆM THU AUDIT-ONLY** theo owner 2026-10-13: 26 entry + puzhu:28 + 21 dormant; Golden v8 giữ bytes, bổ sung ngày âm / 朔弦望 / 鋪註 27/28 / soil Golden độc lập khóa trước code (`c0d8f56`). 1095 × 29 = 31.755 dòng, 0 thiếu operand 凶, 0 conflict, 0 propagation gỡ / 179 chặn; 月表 24 trang presence 0 lệch. Giữ quyết định owner 2026-10-12 về 八風/復日/重日, 遊禍–天願 và puzhu:28 8 pillar gỡ toàn bộ 忌, 六月甲子 sửa 甲午. Soil authority mới `p4-soil-owner-convention-v1` có status OWNER_ADOPTED_SOURCE_DEPENDENT: Asia/Ho_Chi_Minh, 18 ngày dân sự trước 四立, gồm onset / trừ 四立; chỉ sáu heading. Canonical witness onset/後/定氣 vẫn OPEN, không đổi production/điểm. [`gate`](docs/audits/p4-vol10-soil-convention-gate.md), [`audit`](docs/audits/p4-vol10-remaining-ji.md). Validation: 181 file / 3476 test; gate 200 test; mutation 28/28; build/lint/typecheck qua, bundle runtime SHA-256 vẫn `f29f5aab…`. Mục 5 chưa làm. | Mỗi 凶 có entry 卷十 chép kèm offset, presence đã audit, clause → phạm vi heading; Golden suy tay khóa trước code; lan truyền 鋪註 được kiểm trên dữ liệu thật; mutation bắt hết | — |
| 5 | **P4-C — operand cho 11 thần 宜 còn thiếu** (母倉, 福德, 天恩, 天巫, 天后, 天醫, 除神, 驛馬, 天馬, 吉期, 鳴吠) | **BƯỚC TIẾP THEO — chưa bắt đầu** (王日 đã xong): khóa nguồn/predicate 11 thần → Golden độc lập trước code → ghép operand audit → sweep 1095 ngày và báo mức giảm `undetermined` do 宜. Giữ soil authority P4-B và runtime hiện hành | Định nghĩa 協紀 kèm offset + SHA-1; đối chiếu chéo với bảng/nhãn sẵn có; số heading `undetermined` do 宜 giảm và được báo cáo | — |
| 6 | **P5 — warehouse** (修倉庫 co-presence; 開倉庫出貨財 với 德/月恩/四相/時德) | Chưa làm; 修倉庫 đang hoãn trong A04b | Predicate khóa theo spec §6 (ANY, không ALL), negative fixture cho đồng hiện không thể; Golden trước code | — |
| 7 | **Full Golden P4** cho 720 context × heading + presence + warehouse | Chưa làm (mới có partial oracle) | Golden độc lập (không gọi resolver) đóng băng, checksum, reviewer; bao phủ theo spec §7.1 | Review Golden |
| 8 | **Adapter điểm sau flag `xiejiVol10BalancingEnabled` = OFF** | Chưa làm | Resolution trước cap; penalty −25 `product_policy_default_penalty` (`balancingEligible: false`); flag OFF tương đương baseline byte-for-byte trên 1095 ngày; P2/R5 manifest thật vẫn qua | — |
| 9 | **Migration diff + rollback** | Chưa làm | TSV 4 cấu hình (baseline / presence-only / balancing-only / full) trên 1095 ngày × 32 activity × 11 event; 0 `UNEXPECTED_REGRESSION`; rollback bằng flag đã kiểm | **Go-live review** |
| 10 | **Activation PR** (flag ON + 21 thần + P5) → merge → deploy → smoke → cập nhật file này | Chưa làm | CI xanh, deploy, bundle SHA, smoke desktop Chrome/Pixel 7/Safari | **Cho phép merge/deploy** |

### Việc độc lập (làm khi owner yêu cầu, không chặn roadmap)

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| P1 | 百忌日 phần còn lại: 「凡天狗寅日忌祭祀不註宜求福祈嗣」 → ngày Dần không ghi tốt cho `pray_blessing`/`pray_children` | Production chưa áp (cần engine chặn 宜 theo heading); audit đã mô hình ở A04b (鋪註 07). Owner quyết làm riêng hay gộp P4. Scope 天狗 của P4-B (entry 滿日 卷十: 申月戌, 忌祭祀) là scope khác, không thay P1. 天狗 không có trong catalog; 「酉日…不註宜慶賜賞賀」 không có activity → không làm |
| P2 | 「凡巳日忌出行不註宜出師遣使」 | Không có activity 出師 → không làm. 巳日/亥日 chính đã deploy (PR #42), coverage PR #47 |
| S1 | 土王用事 SOURCE_DEPENDENT (đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không) | Tìm nguồn; không đổi khi chưa có. 2026-10-12: archive.org không có 時憲書 in theo năm; chỉ có 《大清時憲書箋釋》 (`02094009.cn`, chép tay, tựa 雍正元年, trước 協紀, OCR không dùng được); ctext cấm truy cập tự động. Đã tìm thêm scan công khai 時憲書 ở Tohoku (225 canvas, 9冊; canvas 6 là 咸豐元年 1851 dù metadata bộ ghi 同治3年), đã tải manifest/ảnh, chưa khóa mốc 土王. Phương án và evidence: `docs/audits/p4-vol10-remaining-operands-research.md`; P4-B được nhận theo authority mới OWNER_ADOPTED_SOURCE_DEPENDENT 2026-10-13; S1 canonical onset/後/定氣 vẫn OPEN và SOURCE_DEPENDENT |
| S2 | Sát Chủ: chưa có nguồn Hán văn tiền hiện đại; leap-month UNRESOLVED | Nguồn offline |
| R1 | Review mapping single reviewer (agent): mansion 115/115, 用事 29/29 | Cần chuyên gia thứ hai nếu muốn nâng chứng nhận |
| R2 | Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích) | Đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | Coverage thiết bị: iPhone thật, Firefox chưa chạy cho các release đổi điểm | Kiểm thêm khi có thiết bị |
| R4 | 百忌日 còn 6 ngày không có activity (庚 經絡, 辛 醖釀, 壬 開渠, 卯 穿井, 丑 冠帶, 午 苫蓋) | Không tự map; chỉ làm nếu thêm activity |

### Phụ thuộc

```text
(1, 2, 3 xong) ─► 4 凶 卷十一 + 21 thần ─► 5 operand 宜 ─► 6 P5
  ─► 7 full Golden (cần 4–6) ─► 8 adapter OFF ─► 9 diff + rollback ─► 10 activation
P4 giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵) và event_fit hiện hành
P1, P2, S1, S2, R1–R4: độc lập
```

## 6. Quy tắc cho agent

- “làm” = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. CI chạy push cho `main`, `feature/**`, `audit/**`; `fix/**`, `docs/**` chỉ chạy khi mở PR.
- Chỉ nói “CI green” khi Actions xác nhận; chỉ nói “deployed” khi deploy job xong và bundle production đã kiểm.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi.

## 7. Quy trình, CI, tooling

**Quy trình:** branch → gate local → PR → CI xanh → **owner cho phép merge** → CI deploy → smoke production → cập nhật file này.

**CI** (`.github/workflows/ci.yml`): typecheck/lint; unit Vitest chia 4 shard song song (`npm test -- --shard=i/4`; 12 file migration 1095 ngày chiếm ~75% thời gian); job riêng “Mutation and emulator gates” (2 mutation gate + Firebase emulator); Playwright desktop 2 shard. Deploy cần cả 4 shard, gates, e2e và typecheck xanh; push `main` → `firebase deploy --only firestore,hosting,functions --project calendar-hana`. **Merge vào main = deploy production**, luôn hỏi owner trước. Main có thể reuse audit khi Git tree giống hệt. Mobile Safari/iPhone không thuộc gate bắt buộc. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi CI hỏng và owner đồng ý.

```sh
npm run typecheck
npm run lint
npm test
npm run test:emulator            # cần Firebase CLI + Java
# Mutation runners: chạy TUẦN TỰ, không song song với test/build/edit
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
python3 scripts/audit-p4-grade-mutations.py   # và audit-p4-{authority,bridge,heading,day,coverage,season,remaining-ji}-mutations.py
# Quét P4-B 1095 ngày (ghi TSV + summary)
P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts shared/lunar/p4LunarDayComposition.test.ts shared/lunar/p4PuzhuEnd.test.ts shared/lunar/p4LunarPhase.test.ts
npx playwright test --project=desktop
npx playwright test e2e/mansion-content.spec.ts --project=desktop --project=mobile
# Báo cáo migration / chẩn đoán (ghi TSV qua REPORT_FILE)
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
REPORT_FILE=docs/audits/legacy-gods-month-jian-migration.tsv npx vitest run shared/lunar/legacyGodsMonthJian.test.ts
REPORT_FILE=docs/audits/xieji-god-presence-2025-2027.tsv npx vitest run shared/lunar/xiejiGodPresence.test.ts
```

**Smoke production sau release đổi điểm:** spec Playwright (vd. `e2e/xieji-vol10-activation.spec.ts`, hoặc spec nháp chọn “Nhóm mục tiêu” + event) qua config tạm `{...base, webServer: undefined, baseURL: production}`; chạy **trước** deploy (giá trị cũ) và **sau** deploy; kiểm bundle production trùng SHA-256 build local; xoá file tạm. Profile ngày sinh chỉ lưu trong browser context tạm. Phần “Mục tiêu và kết luận” chỉ hiện khi đã nhập ngày sinh; ô sao cần bấm “xem thêm” (nút `aria-expanded` ngay sau `h4` “Sao tốt (n)” / “Sao xấu (n)”), không bấm lan mọi `aria-expanded` (treo test).

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Giữ test production bất biến chạy manifest thật (`baijiProductionInvariants.test.ts`, Golden P2 `baijiTyHoi.test.ts`); không ghim chúng về flag cũ để che regression. Golden lịch sử Giáp/Ất và hard warning vẫn giữ cấu hình đã đóng băng. Test migration lịch sử ghim trạng thái cũ bằng mock manifest/catalog: `xiejiVol10Scoring: false`, `legacyGodsMonthJian: false`, mapping event cũ qua `legacyEventMapping.ts`. Release đổi điểm mới phải ghim lại các test lịch sử theo cách này, không sửa Golden.
- Nguồn 協紀 dạng text: Wikisource raw `https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷NN&action=raw` (NN = 03…11); SHA-1 prefix ghi trong `xieji-god-definitions.json` và các audit doc.
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692.cn`–`06067697.cn` (2 quyển/item; trang ngày = n6+i ở quyển đầu, n73+i ở quyển sau, i = chỉ số lục thập hoa giáp từ 甲子; witness đã khoá ở `docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json`); scan 卷九–卷十 `06067686.cn` (鋪註條例 cuối quyển n222–n229); *Ngọc Hạp Chánh Tông* `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main đã deploy `94cdb05` (PR #52: CI chia 4 shard unit + job gates, không đổi runtime); runtime gần nhất là PR #49 (sửa 月破 仍忌: 11/1095 ngày, medical/demolition −50, event không đổi), đã smoke production. Repo public, CI tự deploy khi merge main (hỏi trước khi merge). Production: 卷十 ON, mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian, 21 thần dormant chưa bật. P4 audit-only đã merge (PR #48, #51; mục lục `docs/audits/p4-vol10-progress.md`); 「又為X」 đã chốt B theo nguồn. Làm theo roadmap §5 đúng thứ tự, dứt điểm từng mục; mục (4) P4-B đã nghiệm thu audit-only theo phê duyệt mới 2026-10-13: 26 entry + puzhu:28 + 21 dormant, 0 thiếu operand 凶 / 0 conflict trên 31.755 dòng. Soil authority `p4-soil-owner-convention-v1` OWNER_ADOPTED_SOURCE_DEPENDENT, không canonical; S1 onset/後/定氣 vẫn OPEN. Draft PR #54, các commit mới chưa push. Bắt đầu mục (5) P4-C: chép nguồn/offset/SHA-1 và predicate cho 母倉、福德、天恩、天巫、天后、天醫、除神、驛馬、天馬、吉期、鳴吠; đối chiếu definitions/bảng hiện có; khóa Golden độc lập trước code, rồi ghép operand audit và sweep 1095 ngày để báo mức giảm undetermined do 宜. 王日 đã xong. Sau P4-C mới làm (6) P5 warehouse; không nhầm nghiệm thu P4-B với full Golden, P5 hay activation. Golden trước code; unknown không kích hoạt; penalty mặc định là product policy; test quét toàn miền cần timeout rõ ràng (CI chậm ~4× local); không merge/deploy khi owner chưa cho phép. Lịch sử ở `docs/project-context/history.md`.
