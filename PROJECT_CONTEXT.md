# PROJECT_CONTEXT.md

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-26 (giờ VN). Main `6dac11a` đã deploy (PR #107 **Q4-REST**, authority puzhu:06 `p4b-puzhu06-v5`, đổi output P4 2025–2027). Trước đó cùng ngày: PR #106 F1 R2 (puzhu:06 v4), #105 W1 đóng (không đổi output), #104 G1-SOIL (劫煞 authority v4), #103 G1 glyph Stage 2 (劫煞 authority v3), #102 G2 Stage 2 (alias 立劵交易 + 劫煞 authority v2). G1 (壞/壊) và G2 (劵/券) **ĐÓNG & DEPLOYED**; F1 五離 và Q4-REST **MIGRATED & DEPLOYED**. Roadmap P4 (1–10) xong, P4 ON. Checkpoint post-Q4-REST đóng băng (§4). Việc tiếp theo: **P21 Stage 1 — Authority Reconstruction**, trước Y-CONVENTION.
> Tài liệu này không thay thế yêu cầu mới của người dùng.
> File này chỉ giữ **trạng thái hiện hành + việc mở**. Chi tiết tách ra `docs/project-context/`:
> - [`completed.md`](docs/project-context/completed.md): phase/migration đã đóng (bảng phase đầy đủ, 28 Tú, Option C v1, G1/G2, F1, Q4-REST, roadmap P4, mục độc lập đã đóng).
> - [`history.md`](docs/project-context/history.md): chuỗi PR/deploy/bundle cũ ("history §N"; §42 = bản đầy đủ trước lần thu gọn đầu).
> - [`rollback.md`](docs/project-context/rollback.md), [`runtime.md`](docs/project-context/runtime.md) (pipeline + bảng verdict 卷十), [`tooling.md`](docs/project-context/tooling.md) (CI, lệnh audit, smoke, workspace, nguồn ngoài repo).
>
> **Quy tắc cập nhật:** sửa tại chỗ. Production chỉ giữ bản hiện hành và bản liền trước; bản cũ hơn → history. Hạng mục đóng → chuyển chi tiết sang `completed.md`, ở đây chỉ để một dòng. Không thêm "phần N+1".

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
| Main đã deploy | `6dac11a` ([PR #107](https://github.com/nghiepnguyen/calendar-hana/pull/107) Q4-REST Stage 3, merge 2026-10-26): **đổi điểm/status** chỉ 2025–2027 (121 dòng activity, status 79, 366 event, hard warning 0; ngoài miền 0). Trước đó `7a38f09` ([PR #106](https://github.com/nghiepnguyen/calendar-hana/pull/106) F1 R2, 2026-10-26): 20 dòng activity contract/transaction −15, 2025–2027. Chuỗi PR #101–#105: history §45; #88–#100: history §44 |
| Bundle | `/assets/index-YAZPGNPM.js` (build `6dac11a`, kiểm 2026-10-26; chưa so byte với build local, SHA-256 chưa ghi). Cách so byte: `tooling.md` |
| Deploy gần nhất | [Deploy #50 / 40290726192](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40290726192) `6dac11a` SUCCESS 2026-10-26; `/version.json` `{"version":"26.10.26","build":"6dac11a"}` (kiểm 2026-10-26). Trước đó [Deploy #49 / 40268301142](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40268301142) `7a38f09` SUCCESS 2026-10-26 (F1 R2). Smoke Playwright production (`tooling.md`) cho #102–#107 chưa ghi lại |
| Dataset | `datasetVersion` 1.2.1, `schemaVersion` 1.1.0 (G2/G1 glyph/G1-SOIL/F1/Q4-REST đều NO_BUMP, lý do trong từng báo cáo migration) |
| Catalog | 32 activities (đều enabled), 11 event profiles |
| Authority puzhu:06 (P4, 2025–2027) | **`p4b-puzhu06-v5`** (Q4-REST, PR #107): v4 + `liftExclusions` 九空/五虛/小耗 (class `QL_NARROW`, luật 宜 có phạm vi `Q4_REST_OWNER_ONLY_JI`) + `yiComposition` R-F1Y. `p4b-puzhu06-v4` (F1 R2, PR #106) giữ nguyên làm authority rollback; v3 trước đó |
| Authority 卷十 劫煞 | **`xieji-vol10-jiesha-faithful-v4`** (G1-SOIL, PR #104): v3 + 5 context demolition (丑-甲寅/丙寅/壬寅/戊寅, 未-戊申) `APPLIED_DATE_DEPENDENT` qua selector `tho-vuong-dung-su-rule-v1` (trong 土王用事 = avoid, ngoài = blank). v3 (PR #103, demolition 11 ô tĩnh), v2 (PR #102, contract/transaction 352 → 384 ô APPLIED), v1 giữ nguyên làm rollback |

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
| `xiejiVol10JieshaPolicy` | **`faithful-v1`** (PR #87, 2026-10-22) | 卷十 劫煞 辰戌丑未 không 德 (`cancel_both`): verdict theo bảng authority hiện hành `xieji-vol10-jiesha-authority-v4.json` (policy tên luật đọc, không đổi khi bảng lên v2–v4). Contract/transaction APPLIED từ v2 (G2), demolition APPLIED từ v3/v4 (tĩnh + phụ thuộc ngày). `legacy-cancel-both` = output trước PR #87 |
| `p4ScoreHeadingLookup` | **`canonical-v1`** (PR #99, 2026-10-24) | G1-b: score adapter P4 đọc heading 卷十一 qua `canonicalP4HeadingKey` (破屋壞垣 → 破屋壊垣); heading quyết định giữ chữ nguồn. Code default cũng `canonical-v1`. `source-key-v1` = output trước PR #99 (demolition luôn `baseline`) |
| `xiejiVol10BalancingEnabled` | **true** (PR #71, 2026-10-18) | P4: cân bằng 宜/忌 卷十一 + 21 thần dormant + P5 + 9b (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`) + −25 product policy; chỉ chạy khi flag ON **và** provider `p4AlmanacHeadings` đã nạp **và** ngày trong 2025–2027. OFF = baseline v1 byte-equal |
| `tiangouYinNoYi` | **true** (PR #76, 2026-10-19) | P1: ngày Dần, `pray_blessing`/`pray_children` mọi dòng dương applied → informational (`p1-tiangou-yin-v1`, puzhu:07); mọi năm, độc lập flag P4. `false` = output trước P1 |
| `satChuNgocHapStars` | **true** (PR #78, #80, 2026-10-20) | Sao ngày Tháng Sát Chủ (Lưu-thị, = `SAT_CHU_DUONG`), Bốn Mùa Sát Chủ, Sát Chủ Trong Bốn Mùa, Ngày Sát Sư, Tháng Sát Sư (Ngọc Hạp Chánh Tông tr. 128–133; không mapping chấm điểm). `false` = output trước PR #78 (giờ Sát Chủ `DayHour.isSatChu` không theo flag, chỉ hiển thị) |
| `aiMayChangeScore` | false |  |

Rollback: [`rollback.md`](docs/project-context/rollback.md).

## 3. Trạng thái theo phase (tóm tắt)

| Hạng mục | Trạng thái |
|---|---|
| Calendar core, Month Jian/12 Trực, Astronomy (JPL DE440s), 28 Tú identity, Hỷ/Tài/Phúc Thần | CLOSED |
| 4C Hoàng/Hắc đạo, 4D Cát/Hung thần, 5 Thụ Tử, 6 Thái Tuế/Tuế Phá/Tam Sát, 7 28 Tú 宜/忌 (content 1.0.4) | CLOSED & DEPLOYED |
| 5 Sát Chủ / Sát Sư | SOURCE_DEPENDENT, DEPLOYED (PR #8, #78, #80); mở S2 |
| 百忌日, 天狗寅日 P1, 月破 仍忌, 14 thần legacy (Month Jian), 土王用事 (còn S1) | DEPLOYED |
| 卷十 scoring (6 chain) + 劫煞 Option C v1 | ON / DEPLOYED (PR #31/#32, #87); Golden `golden-xieji-vol10-scoring-v5.json` |
| P4 cân bằng 卷十 (2025–2027) | ON (PR #71); roadmap 1–10 xong |
| G1 壞/壊, G2 劵/券, W1 | ĐÓNG & DEPLOYED (PR #97–#105) |
| F1 五離 × 立券交易, Q4-REST | MIGRATED & DEPLOYED (PR #106, #107) |
| CI | Local từ 2026-10-19; GitHub chỉ deploy (`tooling.md`) |
| Analytics PostHog, PWA update | DEPLOYED (PR #94; PR #57, #58 — chưa kiểm tay iPhone Home Screen) |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng; annual afflictions chưa chứng nhận |

Chi tiết, authority và tài liệu từng hạng mục: [`completed.md`](docs/project-context/completed.md).

## 4. Vấn đề mở và việc tiếp theo

**Checkpoint post-Q4-REST** (đóng băng 2026-10-26): PR #107 MERGED + DEPLOYED; Q4-REST MIGRATED / CLOSED; production `p4b-puzhu06-v5`.

| Authority | Trạng thái |
|---|---|
| 九空 | R-JK migrated |
| 五虛 | R-WX migrated |
| 小耗 | R-XH migrated |
| 五離 | R2 J-axis + R-F1Y migrated |
| 五墓 | Không đổi từ Q4a. Q4-REST Stage 3 **không** cung cấp authority mới cho 五墓 |
| G2/W1 | CLOSED |
| Q4-REST | MIGRATED / CLOSED |
| Y-CONVENTION | OPEN (~1.089 `both_present`) |
| U4/U7 | QUARANTINED |
| BAIJI-Y | OPEN |
| P21 | **PARTIALLY MIGRATED** trên nhánh `claude/p21-stage4-partial-migration` (chưa merge/deploy): authority ngữ nghĩa H2_SUPPORTED; 亥 contexts migrated (`p4-puzhu21-v1`); 未-戊申 HOLD; 未-丙申 QUARANTINED |

Chọn việc khác dưới đây khi owner yêu cầu; mục cần owner quyết thì dừng và hỏi, không tự chọn.

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| S1 | 土王用事 SOURCE_DEPENDENT (đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không) | **PARTIALLY RESOLVED** (2026-10-21, [final review](docs/audits/p4-vol10-remaining-operands-research.md#s1--土王用事-final-review)). Chốt: 18 ngày trước 四立, 後 = nhãn khoảng, 土府 ≠ 土王, 德 không gỡ (卷十 「與徳合赦願併猶忌…以下並同」), JPL giữ. Còn mở: ngày onset khi 四立 rơi 00:00–06:17 (212/812 ca 1899–2101; 大統 dùng 土王策 18,2621 ngày 恆氣, 協紀/推步捷例 đếm ngày dân sự). Không đổi runtime; nguồn đã thử ghi trong final review |
| H1-B | Ghép 忌 sống sót với 相抵 (owner 2026-10-17) | **PARTIALLY_SOURCE_WITNESSED**, audit-only ([review](docs/audits/p4-h1b-yuebiao-witness.md)). 月表 xác nhận lớp 重日/復日 + 德 (7 trang, 0 mâu thuẫn). Phần 劫煞 辰戌丑未 không 德 (tiền đề 相抵 → 不註) đã giải quyết ở tầng 卷十 bằng Option C v1 (PR #87). Tầng P4 (2025–2027) vẫn `cancel_both` cho 劫煞 — xem P4-劫 |
| X相抵 | 相抵 / `cancel_both` của 劫煞 辰戌丑未 không 德 | Tầng 卷十 xong (Option C v1, PR #87; `completed.md`). Còn mở: 災煞/月煞 (ứng viên 相抵 riêng), 月刑/天吏 có 德 UNRESOLVED (lẫn puzhu:06) — chưa audit, không đổi runtime |
| P4-劫 | Tầng P4 (2025–2027) cho 劫煞 辰戌丑未 không 德 | **MORE_EVIDENCE_REQUIRED**, không đổi runtime. Engine P4 vẫn `cancel_both` + P17-0. Blocker riêng của P4: F1 (lan truyền xuyên thần, vd. 五離/五虛), mệnh đề con thứ hai của puzhu:17 (亥日/厭對/八專/四忌/四窮; điều kiện xảy ra ở 71 context), puzhu:06 Q4 vs 戌-癸亥 và lớp 四相 (UNDETERMINED), nhãn scope SPEC_GAP, bất thường adapter medical. Chuyển P4 sang P17-A sẽ đổi Golden v2 ở 2026-08-02, 2027-07-28. Báo cáo: [faithful](docs/audits/p4-jiesha-faithful-vol10.md), [puzhu:17](docs/audits/p4-puzhu17-bujiang.md), [納財](docs/audits/p4-weishen-nacai-puzhu21.md) |
| P21 | puzhu:21 N-A vs N-C / 未-戊申 | **PARTIALLY MIGRATED** (Stage 1–4, nhánh `claude/p21-stage4-partial-migration`, chưa merge/deploy). Authority ngữ nghĩa: **H2_SUPPORTED** (contribution-scoped; nhân chứng 月表 n82 亥-癸酉, n106 亥-丁酉; [Stage 2](docs/audits/p21-stage2-discriminating-witness.md)). Migration: authority `p4-puzhu21-v1` (eligibleContexts 亥-丁酉, 亥-癸酉) đổi 3 ngày 2025–2027 (contract/transaction 50 → 20; full Golden v5, score Golden v7; [Stage 4](docs/audits/p21-stage4-partial-migration.md)). Còn: 未-戊申 **HOLD** (cần owner ruling mở rộng LOCAL 納財 sang 五離); 未-丙申/壬申/庚申 **QUARANTINED** (P4-劫). Nợ mới: PUZHU22_SEMANTIC_DEBT; X相抵 (災煞) chưa đóng |
| Y-CONVENTION | 忌 không xếp hạng sống sót + 宜 độc lập: production `both_present` (mặc định cài đặt), 月表 in `only_ji` | **OPEN**. Chỉ có luật có phạm vi (Q4-REST) và R-F1Y. Còn ~1.089 dòng 2025–2027 (U4, U7 cách ly; 16 thần khác chưa kiểm). [Báo cáo](docs/audits/p4-q4-rest-stage2a1-y-axis-impact.md) |
| BAIJI-Y | 百忌 + 宜 độc lập: production `both_present`, bản in `only_ji` (3 ô) | **OPEN**, chưa đo |
| S2 | Sát Chủ: chưa có nguồn Hán văn tiền hiện đại | **OPEN** (nguồn offline). Tháng nhuận **đã chốt** (owner 2026-10-20): dùng bảng của tháng gốc (nhuận 4 → tháng 4) cho mọi bảng Sát Chủ/Sát Sư và giờ Sát Chủ; ngày Can Chi chạy liên tục. Ghi ở header `stars.ts` + test nhuận 6/2025 trong `satChuAuthority.test.ts`; golden `sat-chu-golden-v1.json` vẫn ghi `UNRESOLVED` vì bytes bị khóa bởi `yi-freeze-v1` |
| R2 | Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích) | Đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | Coverage thiết bị: iPhone thật chưa chạy cho các release đổi điểm | Firefox P4 ON 4/4 (2026-10-19). iPhone: owner chạy theo checklist `docs/audits/p4-activation.md` § Smoke R3 (gồm luồng PWA update) |
| R4 | 百忌日 còn 6 ngày không có activity (庚 經絡, 辛 醖釀, 壬 開渠, 卯 穿井, 丑 冠帶, 午 苫蓋) | Không tự map; chỉ làm nếu thêm activity |
| E1 | Backlog `event_fit`: event không `very_high` lấy điểm trung bình profile (vd. 6 ngày `buy_property` recommended dù `moving` là `only_ji`, `docs/audits/p4-migration-diff.md`) | Owner giữ hiện hành ở go-live review; siết là phase riêng |
| P2 | 「凡巳日忌出行不註宜出師遣使」 | Không có activity 出師 → không làm |

Phụ thuộc:

```text
P4 giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵) và event_fit hiện hành
S1, S2, R2–R4, E1, P2: độc lập
Q4-REST (DEPLOYED) ─► Y-CONVENTION, BAIJI-Y, P21, U4/U7 (mở, độc lập)
P4-劫: độc lập với tầng 卷十; cần F1 lan truyền xuyên thần, puzhu:17 mệnh đề 2, puzhu:06 Q4 trước khi đổi engine P4
```

## 5. Quy tắc cho agent

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
- Untracked `.ignore`, `.claude/`, local `.gitignore` của user: giữ nguyên, không đưa vào PR. Không `npx prettier --write` theo glob rộng. Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Rollback từng policy/authority: [`rollback.md`](docs/project-context/rollback.md) (thứ tự 劫煞 v4 → v3 → v2 trước G1-b).

## 6. Quy trình, CI

**Quy trình:** branch → gate local → PR → **owner cho phép merge** → deploy → smoke production → cập nhật file này.

- `npm run check` (pre-push) → `npm test` → `npm run check:audit-clean` (sau commit).
- Đổi `shared/`, `e2e/` → `npm run ci:full` trước merge; đổi `shared/lunar/p4*`, `scripts/audit-p4-*`, `xiejiVol10*`, authority 卷十, lookup heading → thêm `npm run ci:p4:full`. `ci:p4:fast` chỉ là vòng dev.
- Push `main` → `.github/workflows/deploy.yml` (lint → build → firebase deploy), không test lại.
- Lệnh chi tiết, runner mutation, smoke production, workspace, nguồn ngoài repo: [`tooling.md`](docs/project-context/tooling.md).

## 7. Starter prompt

> Đọc PROJECT_CONTEXT.md. Main `6dac11a` đã deploy (PR #107 Q4-REST: authority puzhu:06 `p4b-puzhu06-v5`, đổi output P4 2025–2027; Deploy #50, `/version.json` 26.10.26). Chuỗi 2026-10-25/26: G2 Stage 2 (#102, alias 立劵交易 + 劫煞 authority v2), G1 glyph (#103, v3), G1-SOIL (#104, v4 phụ thuộc 土王用事), W1 đóng (#105), F1 五離 R2 (#106, puzhu:06 v4), Q4-REST (#107). G1 壞/壊 và G2 劵/券 ĐÓNG; authority 劫煞 hiện hành `xieji-vol10-jiesha-faithful-v4` (`xiejiVol10JieshaPolicy: faithful-v1`). P4 ON (activation PR #71, `p4ScoreHeadingLookup: canonical-v1`), P1 天狗寅日 ON (PR #76), sao Sát Chủ/Sát Sư Ngọc Hạp ON (PR #78, #80). Repo public; CI chạy ở máy (`check` qua pre-push; `test:changed`, `ci:full`, `ci:p4`/`ci:p4:full` chạy tay; `ci:p4:fast` chỉ là vòng dev), GitHub chỉ deploy; merge/push main = deploy production, luôn hỏi owner, owner tự merge. Production: 卷十 ON (6 chain), P4 balancing ON (2025–2027, sau khi provider `p4AlmanacHeadings` nạp), mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian. Audit 28 Tú đóng & deploy (content 1.0.4, `DOUBLE_REVIEWED (semantic mapping)` bởi hai lượt AI-agent). Checkpoint post-Q4-REST ở §4 (五墓 giữ authority Q4a; U4/U7 QUARANTINED). Việc tiếp theo: P21 Stage 1 — Authority Reconstruction (trước Y-CONVENTION); còn lại §4 (BAIJI-Y, P4-劫, S1, S2, R2–R4, E1) khi owner yêu cầu. Golden trước code, không sửa Golden/authority/lock để test xanh; hành vi mới đổi output → policy manifest hoặc authority kế nhiệm + rollback pin; mutation runner chạy tuần tự. Hạng mục đã đóng ở `docs/project-context/completed.md`; lịch sử ở `docs/project-context/history.md` (§42 = bản đầy đủ trước khi thu gọn, §44 = PR #88–#100, §45 = PR #101–#107).
