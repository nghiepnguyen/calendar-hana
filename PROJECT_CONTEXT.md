# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-10 (giờ VN), sau PR #38.
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
| Main | `f9c1d1e` (PR #38) |
| Bundle | `/assets/index-AMatzopN.js`, SHA-256 `3fd1e1b9b335bb1fe2cc2fb2d8d8e75f562beb06df0960140f46757c4dfc87bb` (trùng build local) |
| Deploy gần nhất | CI, 2026-10-10 12:29:13 UTC (19:29 VN); smoke production 9/9 (desktop Chrome, Pixel 7, Safari desktop) |
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
| Event bỏ activity phụ trùng heading | DEPLOYED (PR #37, #38) | `open_business` bỏ `business` (開市), `sign_contract` bỏ `transaction` (立券交易), `groundbreaking` bỏ `construction` (興造動土); 1095 ngày: recommended → caution 40 / 80 / 6, event khác không đổi. Proof `kaishiDoubleCountMigration.test.ts`, `sameHeadingDuplicateMigration.test.ts`; test lịch sử ghim mapping cũ qua `legacyEventMapping.ts` |
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

## 5. Vấn đề mở và việc tiếp theo

Một danh sách duy nhất: mỗi vấn đề có trạng thái, việc tiếp theo và phụ thuộc. **Chưa scope nào được duyệt**; đổi điểm luôn cần owner quyết, Golden độc lập đóng băng trước code, migration diff giải thích từng thay đổi.

### Ưu tiên

| # | Vấn đề | Trạng thái | Việc tiếp theo | Phụ thuộc |
|---|---|---|---|---|
| P1 | **百忌日 không dính event:** 寅日 祭祀 (`worship`), 酉日 宴會 (`meeting`), 申日 安牀 (`bed_installation`), 未日 求醫療病 (`medical`) | Sẵn sàng | Nguồn 卷十 + đối chiếu 卷十一 → Golden → `dayChi` + preserve_bad (mẫu PR #26, −10 + hard warning) → migration (không event nào đổi) → PR | — |
| P2 | **百忌日 dính event:** 巳日 出行 (`travel` → Xuất hành, Nhận xe ×0.3), 亥日 嫁娶 (`wedding` → Cưới hỏi `very_high`) | Chờ đo + quyết | Đo tác động trước code (như PR #37); owner duyệt | 巳日: chốt cách hiểu `travel` (行幸遣使, 「出行同」) vs 鋪註條例 「凡巳日忌出行不註宜出師遣使」 → xem R1 |
| P3 | **Thần vắng mặt / legacy:** 21/44 thần chấm điểm không bao giờ có presence (`godPresenceCoverage.test.ts`); 14 thần legacy tính theo tháng âm, 協紀 dùng Month Jian (`CONVENTION_DIFFERENCE`). Generic `byMonth` giả định tháng âm — không đổi blanket; legacy Hoàng/Hắc trùng không ghi đè Phase 4C | Mở | Đọc nốt 月表 tháng 6/7/9/10/12 → audit từng thần (docs/diagnostics, không đổi điểm) → release chấm điểm tách riêng | 月表 đọc đủ |
| P4 | **卷十 chưa mã hoá:** cân bằng chung (“凡吉足勝凶…”, “凡吉凶相抵…”), phần 宜 theo thần; 月厭/月刑/月煞/災煞 chỉ tác động qua deferral | Mở | Spec + Golden sau P3 | P3 (cần presence cát thần). Ràng buộc: ngày 專忌 (百忌日) vẫn kỵ dù 吉凶相抵 |
| P5 | **Warehouse:** co-presence 修倉庫; ngoại lệ 開倉庫出貨財 với 德/月恩/四相/時德 | Mở | Làm trong P4 | P3 (時德 nằm trong 21 thần vắng mặt) |

### Chờ nguồn

| # | Vấn đề | Việc tiếp theo |
|---|---|---|
| S1 | **土王用事 SOURCE_DEPENDENT:** đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không; 補垣/開渠穿井 chưa có activity | Tìm nguồn; không đổi khi chưa có |
| S2 | **Sát Chủ:** chưa có nguồn Hán văn tiền hiện đại; leap-month UNRESOLVED; không suy từ Thụ Tử, không chuyển Month Jian | Nguồn offline |

### Ghi nhận, chưa lên lịch

| # | Vấn đề | Ghi chú |
|---|---|---|
| R1 | **Review mapping single reviewer (agent):** mansion 115/115, 用事 29/29; chưa có chuyên gia thứ hai. 5 scope xây dựng hẹp giữ unmapped (owner); door_opening/waterworks không có rule Trực/thần → `no_evidence` | Chặn một phần P2 (巳日 ↔ `travel`) |
| R2 | **Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích):** vd. `finance` 納財 trong `open_business`, `engagement` 納采問名 trong `wedding` — 卷十一 ghi thần cho cả hai việc | Mỗi thần chỉ tính một lần/event = đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | **Coverage:** iPhone thật, Firefox, emulator chưa chạy cho release 卷十; Phase 6 hướng năm chưa vào calendar UI | Phần 月表 chuyển sang P3 |

### Phụ thuộc

```text
月表 đọc đủ ─► P3 audit thần ─► P4 cân bằng chung 卷十 ─► P5 warehouse
R1 cách hiểu 巳日 ─► P2 (巳日 出行)
P4 phải giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵)
P1, S1, S2, R2: độc lập
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
# 卷十 migration report
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
```

**Smoke production sau release đổi điểm:** spec Playwright (vd. `e2e/xieji-vol10-activation.spec.ts`, hoặc spec nháp chọn “Nhóm mục tiêu” + event) qua config tạm `{...base, webServer: undefined, baseURL: production}`; chạy **trước** deploy (giá trị cũ) và **sau** deploy; kiểm bundle production trùng SHA-256 build local; xoá file tạm. Profile ngày sinh chỉ lưu trong browser context tạm.

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692/94/95/97.cn`; *Ngọc Hạp Chánh Tông* `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

## 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main `f9c1d1e`+ (PR #6–#38), repo public, CI tự deploy khi merge main (hỏi trước khi merge). Production 卷十 ON, mansion scoring OFF. Activity phụ trùng heading đã bỏ khỏi open_business/sign_contract/groundbreaking. Việc tiếp theo theo bảng ưu tiên §5 (P1: bốn 百忌日 không dính event). Lịch sử ở `docs/project-context/history.md`.
