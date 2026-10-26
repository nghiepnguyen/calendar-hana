# Quy trình, CI, tooling

> Lệnh gate, runner audit, smoke production, workspace và nguồn ngoài repo. Trạng thái hiện hành: [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md). Lịch sử PR/deploy: [`history.md`](history.md).

**Quy trình:** branch → gate local → PR → **owner cho phép merge** → deploy → smoke production → cập nhật `PROJECT_CONTEXT.md`.

**CI chạy ở máy** (từ 2026-10-19):

1. `npm run check` (= `check:fast`) = lint → typecheck (app + functions), fail-fast. Hook `.githooks/pre-push` (`core.hooksPath`, đặt bởi `prepare`) chỉ chạy tầng này; FAIL → chặn push, bypass `--no-verify`.
   `npm test` = `vitest run` trừ `p4Puzhu17Audit.test.ts` (audit đóng băng ~600 s; chạy riêng `npm run test:p4:puzhu17-freeze`). `npm run check:audit-clean` = fail nếu test đã ghi đè artifact đã track dưới `docs/audits/sources/` (chạy sau khi commit; file đang sửa dở cũng bị báo).
2. `npm run test:changed` (tay) = `vitest run --changed origin/main`: test phụ thuộc file đổi; đổi `package.json`/config Vitest/setup → chạy hết; không thấy dữ liệu đọc qua `fs` (Golden TSV/JSON).
3. `npm run ci:full` (tay; `ci:local` là alias) = check → toàn bộ unit (`vitest run`, gồm puzhu17) → `check:audit-clean` → emulator → 2 mutation gate (annual, mansion) → Playwright desktop (webServer tự `npm run build`, visual snapshot) + legal pages Vite dev; không gọi `ci:p4`.
4. `npm run ci:p4` (tay, luôn chạy đủ) = mutation P4-B, P4-C (~25 phút), P5, puzhu:06, Full Golden, owner-rules (V3/V4 toàn miền + mutation 14), score adapter (almanac + Score Golden v3–v6 toàn miền + `golden.py` v3–v6 + mutation 21), builder verify G2 Stage 2 / G1 glyph / G1-SOIL (authority 劫煞 v2–v4, 卷十 Scoring Golden v3–v5, access matrix, lock, counterfactual G1-b) và puzhu:06 (authority v4/v5, Golden v4/v5, Full Golden v3/v4), migration diff roadmap 9 (harness toàn miền) + migration diff v3 G1-b (`P4_MIGRATION_V3_FULL=1`) + mutation 14, migration 卷十 劫煞 Option C v1 (`JIESHA_MIGRATION_FULL=1`, ~3 phút) + mutation 14 (`audit-vol10-jiesha-mutations.py`); 36 bước (`package.json`). `npm run ci:p4:full` = `ci:p4` + `test:p4:heading-lookup-full`.
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
python3 scripts/audit-p4-puzhu06-mutations.py  # puzhu:06, 19 mutation, ~3 phút
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
# puzhu:06: baseline/sweep verify bytes; P4B_PUZHU06_WRITE=1 ghi lại; Golden: python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/derive.py (v3, ghim rollback) và .../p4b-puzhu06-golden-v4/derive.py (v4, ghim rollback Q4-REST) và .../p4b-puzhu06-golden-v5/derive.py (v5, ship)
# Q4-REST Stage 3: envelope rollback v4 vs ship v5 + quy trách từng phán quyết (ghi migration-diff.json); rồi build_migration.py
Q4R3M_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage3Migration.test.ts
# F1 R2: envelope toàn miền rollback vs ship (ghi migration-diff.json, rollback.json)
F1S3_DUMP=1 npx vitest run shared/lunar/p4F1R2Migration.test.ts
# Quét P4-B 1095 ngày (ghi TSV + summary)
P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts shared/lunar/p4LunarDayComposition.test.ts shared/lunar/p4PuzhuEnd.test.ts shared/lunar/p4LunarPhase.test.ts
npx playwright test --project=desktop
npx playwright test e2e/mansion-content.spec.ts --project=desktop --project=mobile
# Báo cáo migration / chẩn đoán (ghi TSV qua REPORT_FILE)
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
REPORT_FILE=docs/audits/legacy-gods-month-jian-migration.tsv npx vitest run shared/lunar/legacyGodsMonthJian.test.ts
REPORT_FILE=docs/audits/xieji-god-presence-2025-2027.tsv npx vitest run shared/lunar/xiejiGodPresence.test.ts
```

**So bundle production với build local:** `GITHUB_SHA=<sha> npm run build`, thay `builtAt` local bằng giá trị `/version.json` → `index-*.js` trùng production ngoài tham chiếu hash chunk; build local cần `VITE_FIREBASE_*` của bundle production (config public).

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
