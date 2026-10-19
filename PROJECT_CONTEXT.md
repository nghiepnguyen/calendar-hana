# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-18 (giờ VN). **P4 ACTIVATED: main deploy `7826f0c` (2026-10-18, [deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586) SUCCESS, `/version.json` build `7826f0c`): [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) roadmap 10 bật `xiejiVol10BalancingEnabled` = `true` (bundle `index-DmK6R6W_.js` nhúng `!0`, chunk `p4AlmanacHeadings-C0cqUkeK.js` 407.895 B): 21 thần dormant + balancing 卷十一 + P5 + 9b. Smoke production trước deploy (OFF) và sau deploy (ON) 12/12 trên desktop Chrome, Pixel 7, Safari desktop; iPhone/Firefox chưa chạy (R3). Rollback: PR một dòng flag `false`. Trước đó `98e8ca5` (PR #70 9b sau flag OFF). Trước đó `9865eee` (roadmap 8 PR #69 + roadmap 9). Go-live review roadmap 9 xong 2026-10-18; **9b** (2 policy + UI 忌 bị cap) MERGED & DEPLOYED (PR #70 `98e8ca5`, flag OFF) ([báo cáo](docs/audits/p4-9b.md)); sau đó roadmap 10 (activation): cần owner duyệt kết quả 9b ([báo cáo](docs/audits/p4-migration-diff.md), [`review.tsv`](docs/audits/sources/p4-vol10/p4-migration-diff-v1/review.tsv)) và cho phép merge/deploy.** Roadmap 1–7b xong, đều audit-only (chi tiết §5). S1 canonical (土王用事 onset/後/定氣) vẫn OPEN. Header cũ (trạng thái đến roadmap 8): history §41.
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
| Main đã deploy | `7826f0c` (PR #71 roadmap 10: **P4 ON**, 2026-10-18), trước đó `98e8ca5` (PR #70: go-live review 9 + 9b + PRD 10, flag OFF, 2026-10-18), trước đó `9865eee` (roadmap 9 migration diff, push thẳng main 2026-10-18; chỉ test/script/docs), trước đó `7d7596f` (PR #69 roadmap 8: adapter P4 sau flag OFF, runtime mới nhưng output không đổi), `f00dd5c` (PR #68 roadmap 7b audit-only), `82b3eb4` (PR #66 Full Golden), `3980183` (PR #63 R5 e2e env, 2026-10-17; không đổi `src`/`shared`), trước đó `c9a1ecc` (PR #62 docs), `e427e2b` (PR #61 puzhu:06 audit-only). Trước đó `ac2835e` (CI local pre-push, push thẳng main), PR #60 `22dd72f` (P5 audit-only), `03fb35d` (CI path-gate P4, push thẳng main). Trước nữa PR #58 `c09a4c3`, PR #57 `3800d99` (PWA: `/version.json`, update toast, version = ngày build); PR #55 `9afd39f` (P4-C audit-only). Output điểm/almanac gần nhất vẫn là `1fc9940` (PR #49): code PR #69 chỉ chạy khi flag ON |
| Bundle | `/assets/index-DmK6R6W_.js`, SHA-256 `bdfec497a5e31c00ad264724756de4b367ab470343c7198f13285fbc0abce5af`, nhúng `xiejiVol10BalancingEnabled:!0`; chunk `/assets/p4AlmanacHeadings-C0cqUkeK.js` (407.895 B, nạp không chặn); `/version.json` `{"version":"26.10.18","build":"7826f0c","builtAt":"2026-10-18T15:00:24.585Z"}` (kiểm 2026-10-18). So byte 2026-10-19: build local `GITHUB_SHA=7826f0c…` với cấu hình Firebase web public đọc từ bundle production → mọi file JS production (index, `p4AlmanacHeadings`, các chunk lazy) trùng byte sau khi chuẩn hóa `builtAt`/version và hash tên chunk (hash đổi theo `builtAt` trong `index`); `index.esm` ×3 và `workbox-window` trùng cả tên-hash. Trước đó `/assets/index-C_yKx2zH.js`, SHA-256 `7c6e04a0d2cd7d399a9cb63954b6077ba1df72d1ad43e2bdd83adb78dadfa08d`; `/version.json` `{"version":"26.10.18","build":"98e8ca5","builtAt":"2026-10-18T12:11:19.788Z"}`; nhúng `xiejiVol10BalancingEnabled:!1` (kiểm 2026-10-18; chưa so byte với build local). Trước đó `/assets/index-umK95j49.js`, SHA-256 `926dde690715f38a46e568895ce1136d1f337e7a3e5a4716936088140db35953`; `/version.json` `{"version":"26.10.18","build":"9865eee","builtAt":"2026-10-18T06:04:17.065Z"}`; manifest nhúng `xiejiVol10BalancingEnabled:!1` (kiểm 2026-10-18). Chưa so với build local cùng SHA. Khác bundle trước do code adapter roadmap 8 (+0,66 kB, resolver P4 không vào bundle chính). Trước đó `/assets/index-CBpvqC51.js`, SHA-256 `6804ea53e90145d1fe2391a53ba7e1810eb4c7150e8f679edbb68a220789d971`; `/version.json` `{"version":"26.10.17","build":"3980183","builtAt":"2026-10-17T04:35:02.404Z"}` (kiểm 2026-10-17; `src`/`shared` không đổi từ `e427e2b`, chỉ khác `build`/`builtAt`). Trước đó `/assets/index-g13VWl-j.js`, SHA-256 `8df99c4d99079e776db8d16fe14529ccdb0e931359b3073f0a176ff96c6269d2`; `/version.json` `{"version":"26.10.17","build":"e427e2b","builtAt":"2026-10-17T03:49:06.512Z"}` (kiểm 2026-10-17). Build local `GITHUB_SHA=e427e2b…` thiếu biến môi trường Firebase web của deploy (`VITE_FIREBASE_*`, config public), nên khi so phải bỏ qua khối cấu hình đó ngoài `builtAt`/hash chunk. Trước đó `index-BC34-C-T.js` / `4903beff…` (`03fb35d`). Từ PR #57 bundle nhúng `builtAt` (giờ build) nên không còn trùng byte với build local: kiểm bằng `GITHUB_SHA=<sha> npm run build`, thay `builtAt` local bằng giá trị `/version.json` → `index-*.js` trùng production ngoài tham chiếu hash chunk. Bundle cũ `index-CeLinrvj.js` / `f29f5aab…` (PR #49–#56) |
| Deploy gần nhất | [deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586), commit `7826f0c`, SUCCESS 2026-10-18. Trước đó [deploy](https://github.com/nghiepnguyen/calendar-hana/actions) `8893eb0` (docs). Trước đó [deploy 39126203902](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39126203902), commit `98e8ca5`, SUCCESS 2026-10-18. Trước đó [deploy 39102682779](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39102682779), commit `9865eee`, SUCCESS 2026-10-18. Trước đó [deploy 39090860176](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39090860176) (`7d7596f`, PR #69), [deploy 39038139063](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39038139063) (`f00dd5c`, PR #68), [deploy 39003051538](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39003051538), commit `3980183`, SUCCESS 2026-10-17. Trước đó [deploy 39000603292](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000603292) (`c9a1ecc`, PR #62), [deploy 39000168607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000168607), commit `e427e2b`, SUCCESS 2026-10-17 (workflow `deploy.yml`: build + Firebase deploy, không test lại; gate là `ci:local` ở máy). PR #60 [deploy 38995034163](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38995034163) SUCCESS (job deploy, audit reuse). Trước đó [CI main 38832193524](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38832193524), commit `03fb35d`, SUCCESS 2026-10-16 (~6 phút: 4 shard unit, gates, Playwright 2 shard, Deploy; P4-B/P4-C mutation skipped vì không đổi file P4). Trước đó PR #58 [38830103117](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38830103117), PR #57 [38821209473](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38821209473), PR #55 [38771420451](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38771420451) đều SUCCESS |
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
| `xiejiVol10BalancingEnabled` | **true** (PR #71, 2026-10-18; thêm ở PR #69 với false) | P4: cân bằng 宜/忌 卷十一 + 21 thần dormant + P5 + 9b (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`) + −25 product policy; chỉ chạy khi flag ON **và** provider `p4AlmanacHeadings` đã nạp **và** ngày trong 2025–2027. OFF = baseline v1 byte-equal (kể cả khi provider đã nạp) |
| `aiMayChangeScore` | false |  |

Rollback (flag về false trên nhánh riêng → PR → CI deploy → smoke; không sửa Golden): `xiejiVol10Scoring` (history §38–39), `legacyGodsMonthJian` (`docs/audits/dormant-legacy-gods.md`), `xiejiVol10BalancingEnabled` (PR một dòng manifest, giữ 6 chain và `legacyGodsMonthJian`; chứng minh output bằng `shared/lunar/p4MigrationRollback.test.ts`, `docs/audits/p4-migration-diff.md`).

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
| P4 — cân bằng 卷十 (audit-only) | P4-B roadmap 4 MERGED & DEPLOYED (PR #54), đã nghiệm thu theo owner convention; không đổi runtime | PR #54: 26 entry + puzhu:28 + 21 dormant; 31.755 dòng / 0 thiếu operand 凶 / 0 conflict. Soil `p4-soil-owner-convention-v1` **OWNER_ADOPTED_SOURCE_DEPENDENT** (phê duyệt mới 2026-10-13); canonical onset/後/定氣 còn OPEN (S1). P4-C (PR #55), P5 (PR #60), F1 puzhu:06 (PR #61), Full Golden (PR #66), 7b (PR #68) đã MERGED & DEPLOYED, đều audit-only. Adapter điểm (PR #69) và migration diff (`9865eee`) đã deploy sau flag OFF, production chưa đổi; activation là roadmap 10. [`progress`](docs/audits/p4-vol10-progress.md), [`P4-B`](docs/audits/p4-vol10-remaining-ji.md) |
| CI — chia shard unit | **DEPLOYED (PR #52)** | Vitest 4 shard song song + job “Mutation and emulator gates”; timeout 60 s cho 6 test quét 720 context P4, 5 s cho test vuốt `App.test.tsx`; `testTimeout` mặc định 30 s (PR #53, sau khi `catHungRegression` vượt 5 s trên CI); job Unit ~10 phút → 4 × ~2m20s |
| Coverage P2 / R5 — 百忌日 + hard warning | **DONE, MERGED & DEPLOYED (PR #47)** | Golden P2 dùng manifest thật; migration lịch sử tách riêng; 9 rule trên 1095 ngày 2025–2027, event có/không giờ, 3 vùng điểm hard warning; 2 mutation bị bắt; local 165 file / 2952 test qua; [CI PR](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38098804753) và CI main xanh; `docs/audits/baiji-production-coverage.md` |
| PWA update (build version, `/version.json`, toast “Có phiên bản mới”) | **DEPLOYED (PR #57, #58)** | `docs/pwa-update-strategy.md`; so `build` (short SHA), version hiển thị = ngày build `YY.MM.DD` giờ VN; Hosting `no-store` cho `/version.json`. Chưa kiểm tay trên iPhone Home Screen (v1 → v2 → toast → Cập nhật ngay) |
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
→ applyVol10Scoring (flag ON) — khi xiejiVol10BalancingEnabled ON: applyP4Balancing thay 6 chain cho activity có heading P4 (flag OFF ở production)
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
| 4 | **P4-B — mô hình các 凶 khác của 卷十一** (四廢, 五墓, 往亡, 八專, 四忌, 四窮, 厭對, 歸忌, 天賊, 小耗, 死氣, 遊禍…) và 21 thần dormant vào ghép ngày (audit-only) | **XONG — MERGED & DEPLOYED PR #54** (`1ad9b4b`, CI/deploy SUCCESS 2026-10-13); đã nghiệm thu audit-only theo owner: 26 entry + puzhu:28 + 21 dormant; Golden v8 giữ bytes, bổ sung ngày âm / 朔弦望 / 鋪註 27/28 / soil Golden độc lập khóa trước code (`c0d8f56`). 1095 × 29 = 31.755 dòng, 0 thiếu operand 凶, 0 conflict, 0 propagation gỡ / 179 chặn; 月表 24 trang presence 0 lệch. Giữ quyết định owner 2026-10-12 về 八風/復日/重日, 遊禍–天願 và puzhu:28 8 pillar gỡ toàn bộ 忌, 六月甲子 sửa 甲午. Soil authority mới `p4-soil-owner-convention-v1` có status OWNER_ADOPTED_SOURCE_DEPENDENT: Asia/Ho_Chi_Minh, 18 ngày dân sự trước 四立, gồm onset / trừ 四立; chỉ sáu heading. Canonical witness onset/後/定氣 vẫn OPEN, không đổi production/điểm. [`gate`](docs/audits/p4-vol10-soil-convention-gate.md), [`audit`](docs/audits/p4-vol10-remaining-ji.md). Validation: 181 file / 3476 test; gate 200 test; mutation 28/28; build/lint/typecheck qua, bundle runtime SHA-256 vẫn `f29f5aab…`. Mục 5 chưa làm. | Mỗi 凶 có entry 卷十 chép kèm offset, presence đã audit, clause → phạm vi heading; Golden suy tay khóa trước code; lan truyền 鋪註 được kiểm trên dữ liệu thật; mutation bắt hết | — |
| 5 | **P4-C — operand cho 11 thần 宜 còn thiếu** (母倉, 福德, 天恩, 天巫, 天后, 天醫, 除神, 驛馬, 天馬, 吉期, 鳴吠) | **XONG — NGHIỆM THU AUDIT-ONLY 2026-10-15**, **MERGED & DEPLOYED** ([PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) merge `9afd39f`, [CI main 38771420451](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38771420451) SUCCESS và deploy SUCCESS 2026-10-16; bundle production kiểm lại `f29f5aab…` không đổi). [PRD](tasks/prd-p4c-yi-operands.md), [task list](tasks/tasks-p4c-yi-operands.md), [audit report](docs/audits/p4-vol10-yi-operands.md) (bảng tổng kết), [acceptance gate](docs/audits/sources/p4-vol10/yi-acceptance-gate-v1/README.md) 8/8. Authority `p4-yi-operands-v1` 11/11 (10 SOURCE_REVIEWED, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027); Golden `golden-p4-yi-operands-v1` 10.668 records freeze `c12df53`; module audit-only `shared/lunar/p4Yi*.ts`, entry opt-in `resolveP4YiDay`. Sweep 1.095 × 29: baseline `991e87c` → [TSV](docs/audits/p4-vol10-yi-operands-2025-2027.tsv)/[summary](docs/audits/p4-vol10-yi-operands-summary.json): 0 operand unknown, 0 unresolved 凶, 0 conflict, 3.803 dòng đổi đều có lý do Golden; final undetermined 4.040 → 642 (修倉庫 P5 539, scope khác 103). Mutation `scripts/audit-p4-yi-mutations.py` 23/23 (CI 4 shard, 16–20 phút), P4-B 28/28. Unit 7.999 PASS; bundle `f29f5aab…` bất biến. Giới hạn: single reviewer (Codex/Claude), S1 canonical OPEN, 3 ngày Jie lệch quy ước noon không đổi state | Định nghĩa 協紀 kèm offset + SHA-1; đối chiếu chéo với bảng/nhãn sẵn có; số heading `undetermined` do 宜 giảm và được báo cáo | — |
| 6 | **P5 — warehouse** (修倉庫 co-presence; 開倉庫出貨財 với 德/月恩/四相/時德) | **XONG — NGHIỆM THU AUDIT-ONLY 2026-10-16**, **MERGED & DEPLOYED** ([PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) merge `22dd72f` 2026-10-17, deploy SUCCESS). [PRD](tasks/prd-p5-warehouse.md), [tasks](tasks/tasks-p5-warehouse.md), [audit report](docs/audits/p5-warehouse.md) (gate 8/8). Owner chốt **D**: 修倉庫 qua đồng hiện chỉ 宜 khi 卷十 (月恩) và 卷十一 (月德) cùng cho 宜, lệch → `undetermined` SOURCE_DEPENDENT (OWNER_ADOPTED_SOURCE_DEPENDENT, không canonical). Authority `p5-warehouse-v1`; Golden `golden-p5-warehouse-v1` freeze `fc5c1fb` trước code; module audit-only `shared/lunar/p4Warehouse.ts` (`resolveP4WarehouseDay` bọc `resolveP4YiDay`, P4-C giữ nguyên). Sweep 31.755 dòng: chỉ 565 dòng 修倉庫 đổi; 539 dòng P5 → only_yi 225 / both_present 161 / only_ji 90 / not_recorded 46 / undetermined 17 (SOURCE_DEPENDENT 1 = 2025-10-08, 16 do 忌 P4-B mở). Mutation `scripts/audit-p4-warehouse-mutations.py` 12/12 (job CI riêng); bundle bất biến. Giới hạn: single agent; F1 puzhu:06 làm riêng, xong ở PR #61 | Predicate khóa theo spec §6 (ANY, không ALL), negative fixture cho đồng hiện không thể; Golden trước code | — |
| 7 | **Full Golden P4** cho 720 context × heading + presence + warehouse (lớp resolution; adapter/cap/event thuộc 8) | **XONG — OWNER NGHIỆM THU 2026-10-17**, MERGED & DEPLOYED [PR #66](https://github.com/nghiepnguyen/calendar-hana/pull/66) (`82b3eb4`, deploy 39027581948 SUCCESS, runtime không đổi). [Review sheet](docs/audits/p4-full-golden-review.md). [Báo cáo](docs/audits/p4-full-golden.md), [PRD](tasks/prd-p4-full-golden.md), [tasks](tasks/tasks-p4-full-golden.md). Golden Python độc lập engine (0 input engine, quét path literal): v1 freeze `b70913f`, **v2 freeze `c574e57`** (owner (i) 德作建論 cho mọi chỗ dùng 德), 31.755 dòng ngày + 20.880 context, reason code mọi dòng, bất biến thứ tự input. Quyết định owner 2026-10-17: H1-B/F5 (忌 không bảo vệ gặp 相抵 của scope khác → 忌 giữ, 宜 không ghi, rồi lan truyền), H2-A (天願 ∈ 德願), F1 (百忌 巳日 出行 → 行幸遣使), F4 (閉日 không 忌 求醫療病), E1 (復日/重日 「不忌亦不註宜」 → neither), E3 (lan truyền còn 相抵 → neither), E5 (context bất biến trên operand theo ngày), (i). Oracle chéo: mọi Golden từng phần + P5 28.800 ô + P4-C dayOverride 720, 0 lệch chưa phân loại. So engine: ngày 31.507/31.755 trùng, chứng minh nguyên nhân từng lệch (đảo luật), phần dư 0; lệch còn lại = luật owner chưa có trong engine + ENGINE_BUG E1 + ENGINE_BUG phân tầng A04b (6 dòng 栽種) + SPEC_BUG F1 + E5. Mutation (phương án b, mutate derive): 20/20 bị self-check bắt, có trong `ci:p4`. `ci:local` EXIT 0 (unit 8.056); runtime/bundle không đổi | Golden độc lập (không gọi resolver) đóng băng, checksum, reviewer; bao phủ theo spec §7.1 | — (đã nghiệm thu) |
| 7b | **Layer engine audit-only cài luật owner** (H1-B/F5, H2-A, F1, E1, E3, E5 context, (i)) và sửa ENGINE_BUG phân tầng A04b, kiểm bằng Golden v2 | **XONG — MERGED & DEPLOYED** [PR #68](https://github.com/nghiepnguyen/calendar-hana/pull/68) (`f00dd5c`, deploy 39038139063 SUCCESS, `/version.json` build `f00dd5c`, runtime không đổi): `shared/lunar/p4OwnerRules.ts` khớp Golden v2 31.755/31.755 ngày + 20.880/20.880 context, không sửa file engine đã khóa; test đỏ trước code `aef0a1e`; mutation 12/12; `ci:p4` thêm phép so toàn miền + runner. [Báo cáo](docs/audits/p4-owner-rules-engine.md) | Layer opt-in (như `resolveP4Puzhu06Day`), không đổi runtime; khớp Golden v2 toàn miền (31.755 ngày + context ngoài E5) với 0 lệch chưa phân loại; sweep + mutation trong `ci:p4`; Golden v2 không sửa | — |
| 8 | **Adapter điểm sau flag `xiejiVol10BalancingEnabled` = OFF** | **XONG — MERGED & DEPLOYED** [PR #69](https://github.com/nghiepnguyen/calendar-hana/pull/69) (`7d7596f`, deploy 39090860176 SUCCESS 2026-10-18; flag OFF, output production không đổi). [PRD](tasks/prd-p4-score-adapter.md) (owner §6.1–6.14), [báo cáo](docs/audits/p4-score-adapter.md). Manifest flag `false`; baseline v1 `1609264` (1098 ngày × 32 activity + 11 event) byte-equal. Golden điểm `p4-score-golden-v1` Python độc lập, test đỏ `47e8438` trước adapter (25 ca điểm + 5 baseline + 31.842 trạng thái activity). Adapter `shared/lunar/p4ScoreAdapter.ts`: chặt nhất `only_ji` > `both_present` > `neither_recorded` > `only_yi`, heading `not_recorded`/`undetermined` → baseline, resolution trước cap, −25 product policy một lần, 6 chain bỏ cho activity có state. Almanac (flag ON + provider `p4AlmanacHeadings` đã nạp + 2025–2027): 21 thần theo Month Jian, thay 5 sao alias; ngoài miền = baseline toàn bộ. FR-05 4 ngày làm chứng; mutation 21/21 (`ci:p4`); bundle +0,66 kB (resolver sau provider, import tĩnh sẽ +409 kB); unit 8.104 | Resolution trước cap; penalty −25 `product_policy_default_penalty` (`balancingEligible: false`); flag OFF tương đương baseline byte-for-byte trên 1095 ngày; P2/R5 manifest thật vẫn qua | — | Resolution trước cap; penalty −25 `product_policy_default_penalty` (`balancingEligible: false`); flag OFF tương đương baseline byte-for-byte trên 1095 ngày; P2/R5 manifest thật vẫn qua | — |
| 9 | **Migration diff + rollback** | **XONG — DEPLOYED** `9865eee` (push thẳng main theo owner, deploy 39102682779 SUCCESS 2026-10-18; chỉ test/script/docs). [PRD](tasks/prd-p4-migration-diff.md) (owner §6.10), [báo cáo](docs/audits/p4-migration-diff.md), [dữ liệu](docs/audits/sources/p4-vol10/p4-migration-diff-v1/README.md). Luật class + 12 bất biến khóa sha256 trước TSV (`p4-migration-rules-v1`); harness 6 cấu hình (mỗi cấu hình một module graph); full 14.894 dòng activity đổi, 0 vi phạm, phản thực tế cap-trước 0 dòng, 2.645 dòng đổi không có thần dormant đều do gỡ/−25/bỏ chain; fixture 36 Jie × ±1 khớp Golden v2; rollback manifest OFF + provider = baseline v1 byte-equal; mutation 14/14; `ci:p4` tay EXIT 0 ~55 phút (+~12 phút) | TSV 4 cấu hình (baseline / presence-only / balancing-only / full) trên 1095 ngày × 32 activity × 11 event; 0 `UNEXPECTED_REGRESSION`; rollback bằng flag đã kiểm | **Go-live review** (chưa làm: owner xem báo cáo + `review.tsv` trước roadmap 10) |
| 9b | **Policy sau go-live review** (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`, UI 忌 bị cap) | **XONG — MERGED & DEPLOYED** [PR #70](https://github.com/nghiepnguyen/calendar-hana/pull/70) (`98e8ca5`, [deploy 39126203902](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39126203902) SUCCESS 2026-10-18; flag OFF, runtime người dùng không đổi). [PRD](tasks/prd-p4-9b.md) (owner §6), [báo cáo](docs/audits/p4-9b.md). Golden điểm v2 trước code (test đỏ `930aa31`; lớp C 35.040 điểm chính xác; với policy cũ tái tạo full roadmap 9 35.040/35.040); adapter + UI `65fc896`; luật migration v2 khóa trước dữ liệu; diff v2 0 `UNEXPECTED_REGRESSION`; delta 9b 760 dòng activity (462 + 280 + 18) = Golden, event 216 classification đều xấu đi; mutation 29/29 + 20/20; flag vẫn `false` | Ba điều kiện go-live: floor 諸事皆忌 / 忌 đã ghi ≥ −25; 忌 multi-heading bảo toàn; UI hiện 忌 bị cap về 0. Golden điểm v2 trước code, mutation, diff v2 | — (owner duyệt 2026-10-18, gồm 216 event) |
| 10 | **Activation PR** (flag ON + 21 thần + P5) → merge → deploy → smoke → cập nhật file này | **XONG — MERGED & DEPLOYED** [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) (`7826f0c`, [deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586) SUCCESS 2026-10-18). [PRD](tasks/prd-p4-activation.md), [báo cáo](docs/audits/p4-activation.md). A1 nạp provider không chặn + DayView chờ, A2 prerender, A4 nghĩa 16 thần, A5 "Đã gỡ theo Hiệp Kỷ", flag ON; unit 8.176, `ci:full` EXIT 0, `ci:p4` qua tới runner adapter (harness diff toàn miền + runner migration không chạy lại sau khi bật flag, theo owner). Smoke production OFF trước / ON sau 12/12 (desktop Chrome, Pixel 7, Safari desktop); iPhone/Firefox chưa chạy | CI xanh, deploy, bundle SHA, smoke desktop Chrome/Pixel 7/Safari | — (owner cho phép merge 2026-10-18)

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
| F1 | 鋪註 puzhu:06 「凡德合赦願月恩四相時德等日不註忌…如遇德猶忌及從忌不從宜之日則仍註忌」 (phát hiện P5 5.2) | **NGHIỆM THU AUDIT-ONLY 2026-10-16**; **MERGED & DEPLOYED** [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) (`e427e2b`, [deploy 39000168607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000168607) SUCCESS 2026-10-17; CI PR [38998213170](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38998213170) xanh trước khi main chuyển sang CI local; push cuối `7d67d80` dùng `--no-verify` theo owner vì visual snapshot fail sẵn trên main, xem R5). Owner: Q1–Q3 không, Q4 có (danh sách gỡ riêng 九空 五虛 小耗 五離 五墓), Q4a chặn (五墓 不取德合). Module opt-in `shared/lunar/p4Puzhu06.ts` (`resolveP4Puzhu06Day` bọc `resolveP4YiDay`), authority `p4b-puzhu06-v3`, Golden v3 `f0454cb` (v1/v2 trước code; v3 sau khi sweep tìm SPEC_BUG 相抵 → `neither_recorded`). 2025–2027: 724 ứng viên → gỡ 68 / giữ 645 / hold 11; sweep 70 dòng đổi (68 + 2 propagationBlocked 開倉庫 未戊申), 0 đổi 忌 protected; mutation 16/16; full unit 8.033; runtime/bundle bất biến. [PRD](tasks/prd-p4b-puzhu06.md), [tasks](tasks/tasks-p4b-puzhu06.md), [báo cáo](docs/audits/p4b-puzhu06.md). Việc còn lại: 11 dòng hold (P4-B scope mở) → roadmap 7 |
| R5 | Visual snapshot `e2e/visual-default.spec.ts` (macOS): 7 ảnh day/week/month/form lệch (header, thẻ Phong thủy cá nhân) trên main `ac2835e` → `ci:local` fail, chặn hook pre-push. Không do PR #61 (không đổi `src`/`e2e`) | **XONG — MERGED & DEPLOYED 2026-10-17** [PR #63](https://github.com/nghiepnguyen/calendar-hana/pull/63) (`3980183`, [deploy 39003051538](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39003051538) SUCCESS; hook pre-push `ci:local` qua, không cần `--no-verify`). Nguyên nhân: môi trường, không phải UI. Ảnh chuẩn chụp khi Firebase đã cấu hình (có nút Đăng nhập ở header và thẻ Phong thủy); worktree/clone mới không có `.env.local` (gitignore) nên `isFirebaseConfigured()` false, nút ẩn, layout lệch. `src` không đổi từ `3800d99`. Sửa: `playwright.config.ts` `webServer.env` đặt `VITE_FIREBASE_*` giả (`demo-calendar-hana`, không bí mật), env tiến trình thắng `.env*` của Vite. Không tạo lại ảnh chuẩn. Kiểm: visual 12/12 pass cả khi có và không có `.env.local`; `npm run ci:local` EXIT 0 trong worktree sạch (unit 8.047, Playwright desktop 109 + dev 9). Lưu ý worktree mới cần `npm --prefix functions ci` trước, nếu không `npm run build` lỗi typecheck functions |
| R4 | 百忌日 còn 6 ngày không có activity (庚 經絡, 辛 醖釀, 壬 開渠, 卯 穿井, 丑 冠帶, 午 苫蓋) | Không tự map; chỉ làm nếu thêm activity |

### Phụ thuộc

```text
(1, 2, 3 xong) ─► 4 凶 卷十一 + 21 thần ─► 5 operand 宜 ─► 6 P5
  ─► 7 full Golden (cần 4–6) ─► 7b engine cài luật owner (kiểm bằng Golden v2) ─► 8 adapter OFF ─► 9 diff + rollback ─► 10 activation
P4 giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵) và event_fit hiện hành
P1, P2, S1, S2, R1–R4: độc lập
```

## 6. Quy tắc cho agent

- “làm” = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. Từ `03fb35d`: push CI chỉ chạy cho `main`; mọi nhánh khác chạy CI qua PR. Main reuse audit khi run `pull_request` thành công có cùng Git tree.
- Chỉ nói “CI green” khi Actions xác nhận; chỉ nói “deployed” khi deploy job xong và bundle production đã kiểm.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi.

## 7. Quy trình, CI, tooling

**Quy trình:** branch → gate local → PR → CI xanh → **owner cho phép merge** → CI deploy → smoke production → cập nhật file này.

**CI** chạy ở máy, 3 tầng (2026-10-17): (1) `npm run ci:local` = lint → typecheck (app + functions) → unit, fail-fast; hook `.githooks/pre-push` (`core.hooksPath`, đặt bởi `prepare`) chỉ chạy tầng này; FAIL → chặn push, bypass `--no-verify`. (2) `npm run ci:full` (chạy tay) = `ci:local` → emulator → 2 mutation gate (annual, mansion) → Playwright desktop (webServer tự `npm run build`, visual snapshot) + legal pages Vite dev; không gọi `ci:p4`. (3) `npm run ci:p4` (chạy tay, độc lập, luôn chạy đủ, không path-gate) = mutation P4-B, P4-C (~25 phút), P5, puzhu:06, Full Golden, owner-rules, score adapter (nối almanac toàn miền + mutation 21), migration diff roadmap 9 (harness toàn miền + mutation 14); đủ chuỗi ~55 phút (EXIT 0 tại `d46e965`). Đổi `shared/`, `e2e/` hay `shared/lunar/p4*`/`scripts/audit-p4-*` thì chạy tay `ci:full`/`ci:p4` trước khi merge. GitHub chỉ còn `.github/workflows/deploy.yml`: push `main` → build → `firebase deploy --only firestore,hosting,functions --project calendar-hana`, không test lại. **Merge/push vào main = deploy production**, luôn hỏi owner trước. Mobile Safari/iPhone/Firefox không thuộc gate. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi Actions hỏng và owner đồng ý.

```sh
npm run typecheck
npm run lint
npm test
npm run test:emulator            # cần Firebase CLI + Java
# Mutation runners: chạy TUẦN TỰ, không song song với test/build/edit
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
python3 scripts/audit-p4-grade-mutations.py   # và audit-p4-{authority,bridge,heading,day,coverage,season,remaining-ji}-mutations.py
python3 scripts/audit-p4-yi-mutations.py       # P4-C, ~25 phút; CI chạy --shard=i/4, chỉ bản đầy đủ ghi report tracked
python3 scripts/audit-p4-warehouse-mutations.py  # P5, 12 mutation
python3 scripts/audit-p4-puzhu06-mutations.py  # puzhu:06, 16 mutation, ~3 phút local
python3 scripts/audit-p4-score-adapter-mutations.py  # roadmap 8, 21 mutation, ~2 phút; toàn miền: P4_SCORE_ADAPTER_FULL=1 npx vitest run shared/lunar/p4ScoreAdapterAlmanac.test.ts
P4_MIGRATION_FULL=1 npx vitest run shared/lunar/p4MigrationDiff.test.ts  # roadmap 9 harness toàn miền ~5 phút; thêm P4_MIGRATION_WRITE=1 để sinh lại p4-migration-diff-v1 (cây sạch)
python3 scripts/audit-p4-migration-mutations.py  # roadmap 9, 14 mutation tuần tự, ngày mẫu, ~15 phút
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

**Smoke production sau release đổi điểm:** spec Playwright (vd. `e2e/xieji-vol10-activation.spec.ts`, hoặc spec nháp chọn “Nhóm mục tiêu” + event) qua config tạm `{...base, webServer: undefined, baseURL: production}`; chạy **trước** deploy (giá trị cũ) và **sau** deploy; kiểm bundle production trùng SHA-256 build local; xoá file tạm. Profile ngày sinh chỉ lưu trong browser context tạm. Phần “Mục tiêu và kết luận” chỉ hiện khi đã nhập ngày sinh; ô sao cần bấm “xem thêm” (nút `aria-expanded` ngay sau `h4` “Sao tốt (n)” / “Sao xấu (n)”), không bấm lan mọi `aria-expanded` (treo test).

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Giữ test production bất biến chạy manifest thật (`baijiProductionInvariants.test.ts`, Golden P2 `baijiTyHoi.test.ts`); không ghim chúng về flag cũ để che regression. Golden lịch sử Giáp/Ất và hard warning vẫn giữ cấu hình đã đóng băng. Test migration lịch sử ghim trạng thái cũ bằng mock manifest/catalog: `xiejiVol10Scoring: false`, `legacyGodsMonthJian: false`, mapping event cũ qua `legacyEventMapping.ts`. Release đổi điểm mới phải ghim lại các test lịch sử theo cách này, không sửa Golden.
- Nguồn 協紀 dạng text: Wikisource raw `https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷NN&action=raw` (NN = 03…11); SHA-1 prefix ghi trong `xieji-god-definitions.json` và các audit doc.
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692.cn`–`06067697.cn` (2 quyển/item; trang ngày = n6+i ở quyển đầu, n73+i ở quyển sau, i = chỉ số lục thập hoa giáp từ 甲子; witness đã khoá ở `docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json`); scan 卷九–卷十 `06067686.cn` (鋪註條例 cuối quyển n222–n229); _Ngọc Hạp Chánh Tông_ `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. **P4 đã bật trên production**: main deploy `7826f0c` (2026-10-18, PR #71 roadmap 10, flag `xiejiVol10BalancingEnabled` = true; rollback = PR một dòng flag false). Trước đó main deploy `98e8ca5` (2026-10-18, PR #70: go-live review roadmap 9 + roadmap 9b, flag OFF); trước đó `9865eee` (2026-10-18): roadmap 8 adapter điểm P4 (PR #69 `7d7596f`) và roadmap 9 migration diff + rollback, cả hai sau flag `xiejiVol10BalancingEnabled` = `false` nên production không đổi điểm/sao/event (baseline v1 byte-equal; bundle `index-umK95j49.js` nhúng flag `!1`). Repo public; CI chạy ở máy (`npm run ci:local` qua hook pre-push, `ci:full`/`ci:p4` chạy tay), GitHub chỉ deploy; push/merge main = deploy production, luôn hỏi owner trước. Production: 卷十 ON (6 chain), mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian, 21 thần dormant chưa bật. Roadmap §5 làm đúng thứ tự, dứt điểm từng mục: 1–9 xong (P4-B/P4-C/P5/F1/Full Golden/7b audit-only; 8–9 sau flag OFF). Go-live review roadmap 9 xong 2026-10-18 (owner chốt nhóm 1–7); mục (9b) policy `ALL_TABOO_FLOOR_V1` + `MULTI_HEADING_JI_WINS_V1` + UI 忌 bị cap MERGED & DEPLOYED PR #70 `98e8ca5` (flag OFF; báo cáo `docs/audits/p4-9b.md`). Mục tiếp theo là (10) activation, owner đã duyệt kết quả 9b 2026-10-18 (gồm 216 event đổi classification); PR-1 (PR #70) đã merge; tiếp theo PR-2 activation, cần owner cho phép merge/deploy; roadmap 10 phải nạp `p4AlmanacHeadings` trước almanac đầu tiên. Quyết định owner P4: spec `docs/plans/p4-xieji-vol10-balancing.md` §9, PRD `tasks/prd-p4-score-adapter.md` §6, `tasks/prd-p4-migration-diff.md` §6.10. Soil authority OWNER_ADOPTED_SOURCE_DEPENDENT; S1 canonical onset/後/定氣 vẫn OPEN. Golden trước code, không sửa Golden/authority/lock để test xanh; unknown không kích hoạt; penalty mặc định là product policy; mutation runner chạy tuần tự; test quét toàn miền cần timeout rõ ràng. Lịch sử ở `docs/project-context/history.md`.
