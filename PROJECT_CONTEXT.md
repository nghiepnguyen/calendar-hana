# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-11 (giờ VN), sau PR #47 (coverage P2/R5, đã merge và deploy; không đổi runtime/điểm).
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
| Main đã deploy | `93a513d` (merge PR #47; Release A PR #45 vẫn là thay đổi runtime gần nhất) |
| Bundle | `/assets/index-D6Jh5JwV.js`, SHA-256 `00c37f604701221d662aa3f4401f9419964bf921ef8451647b879a249ce7ac33` (trùng build local) |
| Deploy gần nhất | [CI run 38099256995](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38099256995), commit `93a513d`, hoàn tất 2026-10-11 00:51:10 UTC (**07:51:10 VN**). Typecheck/lint, unit + emulator + authority mutation gates, Playwright desktop 2 shard và bước Deploy đều SUCCESS. Production HTTP 200, bundle trùng từng byte với build local; smoke browser trong app: tải hôm nay/lịch vạn niên, chuyển 12/10/2026, quay về hôm nay đều qua. Đã áp dụng bản app hiện hành qua nút Cập nhật trước smoke |
| Dataset | `datasetVersion` 1.2.1, `schemaVersion` 1.1.0 |
| Catalog | 32 activities (đều enabled), 11 event profiles |

PR #47 chỉ sửa test/tài liệu; bundle và SHA-256 giữ nguyên. Smoke đổi điểm của Release A (PR #45, 10/10/2026) đã qua 6/6 trên desktop Chrome, Pixel 7, Safari desktop: 2025-01-29 Tam Hợp + Thiên Hỷ biến mất, 2025-03-31 xuất hiện (ô sao đã mở “xem thêm”); chi tiết `docs/audits/dormant-legacy-gods.md`. Smoke PR #47 là kiểm tải/chuyển ngày, không phải chạy lại ma trận đổi điểm này.

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
| 月破 子午未申 仍忌 | PR (chờ merge) | Clause 「…不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣」: resolver trước chỉ giữ danh sách gốc nên medical/demolition `not_listed`, Trực Phá vẫn +25. Sửa (`yuePoStillAvoidPolicy.ts`, cách đọc sát chữ: danh sách gốc + 3 việc 仍忌); 1095 ngày: 11 ngày, medical recommended → watch 5 / watch giữ 6, demolition recommended → avoid 5 / watch → strong_avoid 6, mỗi dòng −50; event không đổi. `yuePoStillAvoidMigration.test.ts` |
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`, Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` (39 ca) |
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

Một danh sách duy nhất: mỗi vấn đề có trạng thái, việc tiếp theo và phụ thuộc. **P4 đã được owner duyệt hướng triển khai có điều kiện (2026-10-11, spec §9)**; chưa duyệt activation/merge/deploy. Trước code scoring khóa bản chép đầy đủ 等第 + bảng thần → class; tách bốn trạng thái annotation, penalty mặc định có nhãn product policy không tham gia balancing release đầu; Golden trước code, diff report và rollback flag bắt buộc trước go-live.

### Ưu tiên

| # | Vấn đề | Trạng thái | Việc tiếp theo | Phụ thuộc |
|---|---|---|---|---|
| P1 | **百忌日 không dính event:** 寅日 祭祀 (`worship`), 酉日 宴會 (`meeting`), 申日 安牀 (`bed_installation`), 未日 求醫療病 (`medical`) | **DEPLOYED phạm vi chính (PR #40).** Kiểm lại 10/10/2026 trên cấu hình production (sau Release A, 1095 ngày): thần có mặt đúng và chỉ ở ngày chi tương ứng, kèm hard warning; activity không bao giờ “Nên làm” | **Còn:** (1) 鋪註條例 「凡天狗寅日忌祭祀不註宜求福祈嗣」 → ngày Dần không ghi tốt cho `pray_blessing`/`pray_children` — cần engine (override hiện chỉ áp lên activity của thần), owner quyết; (2) 天狗 (kỵ khác của 祭祀) không có trong catalog; (3) 「酉日…不註宜慶賜賞賀」: không có activity → không làm | — |
| P2 | **百忌日 dính event:** 巳日 出行 (`travel`), 亥日 嫁娶 (`wedding`) | **DEPLOYED phạm vi chính (PR #42); coverage DONE (PR #47, merged/deployed).** Golden P2 dùng manifest thật, migration giữ cấu hình lịch sử trong `baijiTyHoiMigration.test.ts`; suite production tự động kiểm 91 ngày Tỵ/91 ngày Hợi, không giờ và giờ 9: Xuất hành không recommended, Cưới hỏi not_recommended. Bằng chứng `docs/audits/baiji-production-coverage.md` | **Còn:** 「凡巳日忌出行不註宜出師遣使」 không có activity → không làm. `travel` = 出行 đã được owner chốt; review mapping thứ hai vẫn thuộc R1 | — |
| P3 | **Thần vắng mặt / legacy:** 21/44 thần chấm điểm không bao giờ có presence; 14 thần legacy tính theo tháng âm | P3a (PR #43) + P3b (PR #44) xong. **Release A DEPLOYED (PR #45):** 14 thần legacy theo Month Jian — 741 kết luận event đổi (caution → recommended 170, not_recommended → recommended 129, recommended → caution 115, …), 1.835 điểm event, 3.724 điểm activity; 0 thay đổi ở ngày tháng âm = Month Jian. Bảng legacy vốn đúng 12/12 tháng, chỉ sai cơ sở tháng. 5 tên gần giống (Phổ Hộ (Hội Hộ) = 普護, Phi Ma Sát (Tai Sát) = 災煞, Nguyệt Hư (Nguyệt Sát) = 月煞, Nguyệt Yếm Đại Hoạ = 月厭, Vãng Vong (Thổ Kỵ) = 往亡) đã chứng minh bằng bảng | **Còn:** bật 21 thần vắng mặt — làm cùng P4. Đo (so với trước Release A): +7 cát → 1.042 kết luận đổi, recommended 3.008 → 3.472; +đủ 21 → 2.892, recommended 3.008 → 1.988, not_recommended 3.962 → 5.920 (14 hung thần trừ điểm khi chưa có cân bằng 卷十) | Owner đã chốt 往亡/不將/五富 |
| P4 | **卷十 chưa mã hoá:** cân bằng chung (“凡吉足勝凶…”, “凡吉凶相抵…”), phần 宜 theo thần; 月厭/月刑/月煞/災煞 chỉ tác động qua deferral | **ĐANG LÀM — nguồn/partial Golden đã khóa v2 `19e8673` (2026-10-11)** — [`spec P4`](docs/plans/p4-xieji-vol10-balancing.md); chưa triển khai đổi điểm | Đã chép 66 ô 等第 + 28 dòng 鋪註, source-role đủ 53 IDs và partial Golden v2 `19e8673`; gate P4 168 test, toàn bộ unit 166 file/3120 test, 3 mutation, typecheck/lint/build qua; bundle giữ nguyên; [`audit nguồn`](docs/audits/p4-vol10-authority-lock.md). Đã thêm named-clause lock v1: 18 nhóm/67 cặp override can-chi, 16 nhóm deferral, 26 oracle cases và 49 test mới (audit-only); [`audit predicates`](docs/audits/p4-vol10-named-clauses.md). Context bridge v2 (audit-only): presence đủ 13 đối tượng bảng (刼煞 theo 卷06 正月起亥逆行四孟), override can-chi theo ngày, deferral bắc cầu có path, 0 undetermined/720; Golden v1 `4099d88`, v2 `67c442b` khóa trước code, gate P4 239 test, 6 mutation; [`audit bridge`](docs/audits/p4-vol10-context-bridge.md). A03 (audit-only, `p4GradeResolution.ts`): ô 等第 chọn theo (đối tượng, Month Jian), đã kiểm 11×12; bare 遇德 = nhóm thần do clause từng entry nêu; ô ↔ clause 0 conflict, 100 ca 相抵 tách riêng cho A04; đọc lại ô 月厭 下 (月刑 thuộc 午月), đính chính ghi chú kiep_sat; Golden `4f4cea7`, gate P4 260 test, 6 mutation; [`audit A03`](docs/audits/p4-vol10-grade-resolution.md). A04a (audit-only, `p4HeadingAnnotation.ts`): trạng thái 74 heading trong từng phạm vi đối tượng, 相抵 → neither_recorded (owner duyệt), Golden `d36e2aa`, gate P4 277 test, 6 mutation; [`audit A04`](docs/audits/p4-vol10-heading-annotation.md). **Phát hiện production chưa sửa:** 月破 子午未申 có 德 「仍忌解除求醫療病破屋壞垣」 nhưng resolver production để `not_listed`, Trực Phá vẫn +25 cho medical/demolition. A04b (audit-only, `p4DayComposition.ts`): ghép 13 phạm vi + 諸事皆忌 can-chi + 百忌日 cho 29 heading, evidence 宜 卷十一 (12 thần chưa có operand → undetermined), 鋪註 07–10 và lan truyền 11/16–24 (0 lần áp, 24 lần bị chặn trên dữ liệu thật), sửa khóa 立劵/立券 của A04a; Golden `3d03947`, gate P4 290 test; [`audit A04b`](docs/audits/p4-vol10-day-composition.md). A05: 12/16 edge bao trùm đủ; 月建→月刑, 大時→月刑, 閉日→月煞 hụt heading (đánh dấu undetermined), 災煞→月破 chỉ bao trùm sau resolve (củng cố cách đọc 仍忌 của 月破); sửa lỗi A04a bỏ qua 忌同刼煞; [`audit A05`](docs/audits/p4-vol10-deferral-coverage.md). Presence 四時 日 (`p4SeasonDays.ts`, 卷04/05): 王/官 theo thuyết cũ, 守日 = 辰未戌丑 (邵泰衢), 長生 theo 令星 (tháng quý unknown); mọi nhãn đi kèm trong bảng 等第 khớp, 3 cách đọc khác bị bác; [`audit`](docs/audits/p4-vol10-season-days.md). Còn 德願, nhãn 德大會, 又為X là phạm vi riêng hay không, các 凶 卷十一 + 11 thần 宜 chưa mô hình + full Golden trước scoring; 720 contexts chưa có score oracle. Resolution trước cap đã duyệt; penalty product policy ngoài balancing release đầu. Bật gộp 21 thần + P5 chỉ sau diff report và kiểm rollback, migration so với sau Release A | Presence 35 thần đã sẵn (`getXiejiGodPresence`). Ràng buộc: ngày 專忌 (百忌日) vẫn kỵ dù 吉凶相抵; event `very_high` fail `event_fit` khi activity chính có bất kỳ dòng âm (chính sách hiện hành, xem có cần đổi trong P4) |
| P5 | **Warehouse:** co-presence 修倉庫; ngoại lệ 開倉庫出貨財 với 德/月恩/四相/時德 | Mở | Làm trong P4 | Presence 時德/四相 đã có (P3b), chờ P4 |

### Chờ nguồn

| # | Vấn đề | Việc tiếp theo |
|---|---|---|
| S1 | **土王用事 SOURCE_DEPENDENT:** đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không; 補垣/開渠穿井 chưa có activity | Tìm nguồn; không đổi khi chưa có |
| S2 | **Sát Chủ:** chưa có nguồn Hán văn tiền hiện đại; leap-month UNRESOLVED; không suy từ Thụ Tử, không chuyển Month Jian | Nguồn offline |

### Ghi nhận, chưa lên lịch

| # | Vấn đề | Ghi chú |
|---|---|---|
| R1 | **Review mapping single reviewer (agent):** mansion 115/115, 用事 29/29; chưa có chuyên gia thứ hai. 5 scope xây dựng hẹp giữ unmapped (owner); door_opening/waterworks không có rule Trực/thần → `no_evidence` | Cách hiểu 巳日 ↔ `travel` đã được owner chốt (P2) |
| R2 | **Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích):** vd. `finance` 納財 trong `open_business`, `engagement` 納采問名 trong `wedding` — 卷十一 ghi thần cho cả hai việc | Mỗi thần chỉ tính một lần/event = đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | **Coverage:** iPhone thật, Firefox chưa chạy cho release 卷十 và các release PR #37–#45 (smoke Release A chỉ desktop Chrome, Pixel 7, Safari desktop); emulator và desktop Playwright 2 shard đã qua trên main `93a513d` (PR #47); smoke PR #47 dùng browser trong app; Phase 6 hướng năm chưa vào calendar UI; 月表 tháng 6/7/9/10/12 chưa đọc (không còn chặn P3 — định nghĩa đều có chữ) | Đối chiếu 月表 là kiểm chứng thêm, không bắt buộc |
| R4 | **百忌日 còn 6 ngày không có activity:** 庚日 經絡, 辛日 醖釀, 壬日 開渠, 卯日 穿井, 丑日 冠帶, 午日 苫蓋 | Không tự map (nguyên tắc); chỉ làm nếu thêm activity tương ứng |

### Phụ thuộc

```text
P4 cân bằng chung 卷十 + bật 21 thần vắng mặt ─► P5 warehouse
(P3a/P3b/Release A đã xong và deploy; coverage P2/R5 DONE — PR #47)
P4 phải giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵)
P1, P2 (phần còn lại), S1, S2, R2, R4: độc lập
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

**CI** (`.github/workflows/ci.yml`): typecheck/lint, unit + emulator, Playwright desktop 2 shard; push `main` → `firebase deploy --only firestore,hosting,functions --project calendar-hana`. **Merge vào main = deploy production**, luôn hỏi owner trước. Main có thể reuse audit khi Git tree giống hệt. Mobile Safari/iPhone không thuộc gate bắt buộc. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi CI hỏng và owner đồng ý.

```sh
npm run typecheck
npm run lint
npm test
npm run test:emulator            # cần Firebase CLI + Java
# Mutation runners: chạy TUẦN TỰ, không song song với test/build/edit
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
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
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692/94/95/97.cn`; *Ngọc Hạp Chánh Tông* `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main đã deploy `93a513d` (PR #47), repo public, CI tự deploy khi merge main (hỏi trước khi merge). Production: 卷十 ON, mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian (`legacyGodsMonthJian`), activity phụ trùng heading đã bỏ. 35 thần có định nghĩa 協紀 (`xieji-god-definitions.json`) + presence (`getXiejiGodPresence`); 21 thần vắng mặt chưa bật. Coverage P2/R5 DONE: 9 rule 百忌日/hard warning chạy cấu hình production trên 1095 ngày; Golden P2 tách khỏi migration lịch sử; CI main và deploy xanh, bundle giữ nguyên. P1 và phần nguồn/mapping còn lại của P2 vẫn mở. Spec P4 được duyệt hướng triển khai có điều kiện (§9) ở `docs/plans/p4-xieji-vol10-balancing.md`: cân bằng chung 卷十 + 21 thần + P5 warehouse. Nguồn/bản chép 66 ô, source-role 53 IDs và partial Golden khóa v2 `19e8673`, audit `docs/audits/p4-vol10-authority-lock.md`; 720 contexts chưa có score oracle. Named-clause lock v1 đã thêm 18 nhóm/67 cặp override và 16 nhóm deferral (audit-only; xem `docs/audits/p4-vol10-named-clauses.md`). Context bridge v2 (`shared/lunar/p4ContextBridge.ts`, audit-only) nối presence 13 đối tượng → override can-chi → deferral có tên; 刼煞 theo 卷06, 0 edge undetermined (`docs/audits/p4-vol10-context-bridge.md`). A03 audit-only xong phần ô bảng + nhóm 德 có tên (`docs/audits/p4-vol10-grade-resolution.md`); 德願: owner duyệt convention 德合+天願 có điều kiện, nhưng 未月戊午 không có 德合 nên không áp, vẫn undetermined. A04a xong (`docs/audits/p4-vol10-heading-annotation.md`), kèm phát hiện production 月破 仍忌 chưa sửa. A04b xong (`docs/audits/p4-vol10-day-composition.md`). A05 và presence 四時 日 xong (`docs/audits/p4-vol10-deferral-coverage.md`, `docs/audits/p4-vol10-season-days.md`). Việc tiếp theo: mô hình các 凶 卷十一 còn lại / 21 thần, full Golden, P5, rồi bridge scoring OFF và canonical resolver + full Golden trước code scoring; tách both_present/only_yi/only_ji/neither_recorded. Penalty mặc định có nhãn product policy, ngoài balancing release đầu; không dùng thận trọng thay authority. Resolution trước cap và giữ event_fit đã duyệt; go-live cần diff report + rollback flag, chưa cho phép activation/merge/deploy. Lịch sử ở `docs/project-context/history.md`.
