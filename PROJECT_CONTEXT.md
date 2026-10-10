# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-10 (giờ VN), sau PR #36.
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
| Main | `77861fe` (PR #35); PR #36 docs |
| Bundle | `/assets/index-Camk5ToH.js`, SHA-256 `5430ed0db4c83ad83ef9ee54948582766f59e8a3397b7d6ff8ccf7eb5e9fb190` |
| Deploy gần nhất | CI, 2026-10-10 10:47:09 UTC; product trùng release 卷十 (PR #32) |
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
| `aiMayChangeScore` | false | |

Rollback 卷十: flag về false trên nhánh riêng → PR → CI deploy → smoke. Không sửa Golden. Chi tiết history §38–39.

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
| 土王用事 | DEPLOYED (PR #29), còn SOURCE_DEPENDENT | `docs/audits/tu-vuong-dung-su.md` |
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`, Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` (39 ca) |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng | Personal annual afflictions giữ convention cũ, chưa chứng nhận |

## 4. Runtime pipeline

```text
computeAlmanac → classicalDay + activity contributions
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

## 5. Vấn đề mở

1. **Activity phụ trùng heading — đã sửa (10/10/2026):** event không còn tính lại activity phụ cùng mục 用事 với activity chính: `open_business` bỏ `business` (開市; 40 ngày recommended → caution), `sign_contract` bỏ `transaction` (立券交易; 80), `groundbreaking` bỏ `construction` (興造動土, không có bằng chứng 營建宮室 riêng; 6). Proof `kaishiDoubleCountMigration.test.ts`, `sameHeadingDuplicateMigration.test.ts`; test lịch sử ghim mapping cũ qua `legacyEventMapping.ts`. **Giữ có chủ đích:** activity phụ khác heading (vd. `finance` 納財 trong `open_business`, `engagement` 納采問名 trong `wedding`) vẫn nhận các thần chung vì 卷十一 ghi thần đó cho cả hai việc. Muốn mỗi thần chỉ tính một lần mỗi event là đổi policy cộng điểm cho cả 11 event → phase riêng (spec, Golden, migration), chưa làm.
2. **百忌日 còn lại** có activity: 巳日 出行, 寅日 祭祀, 亥日 嫁娶, 酉日 宴會, 申日 安牀, 未日 求醫療病. Giữ chú 巳日 không 宜 出師遣使, 酉日 không 宜 慶賜賞賀. Heading chưa có activity không tự map.
3. **Thần vắng mặt / legacy:** 21/44 thần chấm điểm không bao giờ có presence (inventory cũ, `godPresenceCoverage.test.ts`); 14 thần legacy tính theo tháng âm trong khi 協紀 dùng Month Jian (`CONVENTION_DIFFERENCE`). Generic `byMonth` mang giả định tháng âm — không đổi blanket sang Month Jian. Legacy Hoàng/Hắc trùng không được ghi đè Phase 4C.
4. **卷十 chưa mã hoá:** cân bằng chung (“凡吉足勝凶…”, “凡吉凶相抵…”), phần 宜 theo thần; 4 thần 月厭/月刑/月煞/災煞 chỉ tác động qua deferral, không có dòng riêng.
5. **Warehouse:** điều kiện co-presence 修倉庫 và ngoại lệ 開倉庫出貨財 với 德/月恩/四相/時德 chưa mã hoá.
6. **土王用事 SOURCE_DEPENDENT:** đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không; 補垣/開渠穿井 chưa có activity.
7. **Sát Chủ:** chưa có nguồn Hán văn tiền hiện đại (cần nguồn offline); leap-month semantics UNRESOLVED; không suy từ Thụ Tử, không chuyển Month Jian.
8. **Review:** mansion 115/115 và 用事 29/29 single reviewer (agent), chưa có chuyên gia thứ hai. 5 scope xây dựng hẹp giữ unmapped (owner). door_opening/waterworks không có rule Trực/thần → `no_evidence`.
9. **Coverage:** iPhone thật, Firefox, emulator chưa chạy cho release 卷十; 月表 tháng 6/7/9/10/12 mới đọc một phần. Phase 6 hướng năm chưa đưa vào calendar UI.

## 6. Next steps (chưa scope nào được duyệt)

1. **Sáu 百忌日:** nguồn/diễn giải → Golden độc lập đóng băng → rule `dayChi` + preserve_bad (mẫu PR #26) → migration diff → PR. Owner duyệt trọng số.
2. **Audit thần vắng mặt/legacy** bằng 月表 — docs/diagnostics trước, chấm điểm tách release riêng.
3. Cân bằng chung 卷十 và phần 宜.
4. Nguồn offline Sát Chủ; các điểm mở 土王用事.

## 7. Quy tắc cho agent

- “làm” = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. CI chạy push cho `main`, `feature/**`, `audit/**`; `fix/**`, `docs/**` chỉ chạy khi mở PR.
- Chỉ nói “CI green” khi Actions xác nhận; chỉ nói “deployed” khi deploy job xong và bundle production đã kiểm.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi.

## 8. Quy trình, CI, tooling

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
# 卷十 migration report
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
```

**Smoke production sau release đổi điểm:** `e2e/xieji-vol10-activation.spec.ts` qua config tạm trỏ baseURL production (không webServer, xoá config sau); kiểm bundle production trùng SHA local.

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692/94/95/97.cn`; *Ngọc Hạp Chánh Tông* `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

## 9. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main `77861fe`+ (PR #6–#36), repo public, CI tự deploy khi merge main (hỏi trước khi merge). Production 卷十 ON, mansion scoring OFF. Activity phụ trùng heading đã bỏ khỏi open_business/sign_contract/groundbreaking. Next: sáu 百忌日, hoặc audit thần vắng mặt/legacy. Lịch sử ở `docs/project-context/history.md`.
