# PRD — P1 天狗寅日 「不註宜求福祈嗣」

2026-10-19, nhánh `claude/p1-tiangou-yin`. Việc độc lập P1 (`PROJECT_CONTEXT.md` §5), làm phase riêng theo owner 2026-10-19 (không gộp P4: P4 đã activation ở PR #71). **Đổi điểm** → Golden trước code, migration diff, owner cho phép merge.

## 1. Nguồn

- 欽定協紀辨方書 卷十 鋪註條例 (Wikisource raw, cùng file PR #26/#40; `docs/audits/sources/p4-vol10/vol10.raw.txt` SHA-1 prefix `355dc6c8fe2d`, kiểm 2026-10-19), offset 21876 (slice khớp nguyên văn): 「凡天狗寅日忌祭祀不註宜求福祈嗣」. Đã có trong `shared/almanac-data/p4-vol10-day-composition-v2.json` (`puzhu:07`, day 寅, headings 祈福/求嗣).
- Phần 「忌祭祀」 đã deploy (PR #40, `bach_ky_dan` → `worship`). PRD này chỉ làm phần 「不註宜」.
- Heading → activity theo `shared/almanac-data/xiejibianfangshu-yiji.json`: 祈福 → `pray_blessing`, 求嗣 → `pray_children`.

## 2. Hiện trạng (đo 2026-10-19, almanac thật, manifest ship ON + provider đã nạp)

- **2025–2027, 91 ngày Dần:** P4 đã mô hình `puzhu:07`. Gỡ điểm tốt khi heading ra `only_ji` (49 ngày) hoặc `neither_recorded` (10 ngày). Với 32 ngày `not_recorded` (không có 忌, 宜 bị chặn), adapter trả baseline nên điểm tốt vẫn cộng: `pray_blessing` 32 ngày còn delta dương (30 recommended, 2 neutral), `pray_children` 26 ngày (23 recommended, 3 neutral).
- **Ngoài 2025–2027** (baseline, P4 không chạy): mọi ngày Dần giữ điểm tốt. Ví dụ 2024-01-27: Thiên Đức +15, Nguyệt Đức +10, ra recommended 75. Đo 2024 + 2028: `pray_blessing` 39 ngày, `pray_children` 30 ngày có delta dương.
- **Event:** không profile nào dùng 2 activity này, nên không event nào đổi.

## 3. Quyết định owner (2026-10-19)

| # | Câu hỏi | Chốt |
|---|---|---|
| D1 | 「不註宜」 đổi điểm thế nào | **Bỏ delta dương**: mọi dòng dương → `informational`, delta 0. Giữ nguyên dòng âm. Không thêm −25 (nguồn chỉ nói không ghi 宜, không nói 忌) |
| D2 | Bỏ dòng dương của nguồn nào | **Tất cả**: Trực, cát thần, 28 Tú (đang 0 vì mansion scoring OFF), override dương |
| D3 | Miền áp dụng | **Mọi năm**, chỉ cần chi ngày = 寅. Áp cả baseline ngoài 2025–2027 và cả khi flag P4 OFF (như 百忌日 PR #40) |

## 4. Yêu cầu

FR-4, FR-5, FR-7, FR-8 là **đề xuất của agent**, chờ owner duyệt; FR-1–FR-3, FR-6 suy từ D1–D3.


| # | Yêu cầu |
|---|---|
| FR-1 | Ngày có chi = 寅 (chi index 2), activity `pray_blessing` và `pray_children`: mọi dòng `applied` có `rawDelta > 0` → `status: 'informational'`, `scoreDelta = 0`. Dòng âm, hard warning, cap âm giữ nguyên |
| FR-2 | Bước này chạy **sau** resolution (卷十 scoring / P4 adapter) và **trước** cap |
| FR-8 | **No-op khi P4 đã gỡ:** dòng dương đã `informational` do P4 (59 ngày Dần `only_ji`/`neither_recorded` trong 2025–2027) giữ nguyên byte-for-byte, không đánh dấu lại. Trong 2025–2027 chỉ 32 ngày `not_recorded` đổi |
| FR-3 | Điểm và trạng thái theo công thức hiện hành: score = 50 − Σ âm sau cap. Không còn dòng `applied` mà có dòng bị gỡ → `neutral` (giống `no_annotation`). Ngày không có dòng nào → giữ `no_evidence` |
| FR-4 | Dòng P1 gỡ có dấu nguồn `puzhu:07` (để migration diff và UI phân biệt với lift P4) |
| FR-5 | UI: mục "Đã gỡ theo Hiệp Kỷ" (A5, `DailyActivitySection`) hiện dòng bị gỡ với nhãn "không ghi tốt", **cả khi flag P4 OFF** và cả ngoài 2025–2027 |
| FR-6 | Activity khác, ngày không phải Dần, mọi event: byte-equal so với trước P1 |
| FR-7 | Rollback: policy manifest riêng `tiangouYinNoYi` (ship `true`). `false` → output byte-equal với trước P1. Độc lập với `xiejiVol10BalancingEnabled`. **Bắt buộc vì D3:** P1 chạy cả khi flag P4 OFF, nên nếu không có flag riêng thì rollback P4 không còn ra baseline v1 byte-equal (`p4MigrationRollback.test.ts`, baseline `1609264` 1098 ngày × 32 activity, câu rollback §2 `PROJECT_CONTEXT.md`). Các test đó ghim `tiangouYinNoYi: false` |

## 5. Golden (đóng băng trước code, độc lập engine)

- File `shared/almanac-data/golden-p1-tiangou-yin.json`, `FROZEN_BEFORE_CODE`. Chi ngày tính bằng số học ngày (2000-01-07 = 甲子), không gọi engine. State P4 để chọn ca lấy từ Golden v2 `docs/audits/sources/p4-vol10/p4-full-golden-v2/compose/dated.tsv`, không từ engine.
- Ca: ngày Dần 2025–2027 đủ 3 state (`only_ji`, `neither_recorded`, `not_recorded`), ngày Dần ngoài miền (2024, 2028, 2035), ngày đối chứng không phải Dần. Mỗi ca × `pray_blessing`, `pray_children` + đối chứng `worship`.
- Kỳ vọng: ngày Dần → 0 dòng dương `applied` cho 2 activity; status suy từ dòng còn lại theo FR-3; ngày không phải Dần và `worship` → không có dòng `puzhu:07`.
- Test đỏ trước code (commit riêng). Golden không sửa sau freeze.

## 6. Migration diff

- 1095 ngày 2025–2027 + 2024 + 2028, flag P4 ON và OFF: chỉ `pray_blessing`/`pray_children` trên ngày Dần đổi; tập dòng âm và tổng âm sau cap bằng trước P1 (kiểm ở đây, không ở Golden). Mỗi dòng đổi phân loại `EXPECTED_AUTHORITY_MIGRATION_CHANGE`, 0 `UNEXPECTED_REGRESSION`. Bảng status trước → sau như `docs/audits/baiji-dayzhi.md`.
- Test lịch sử ghim trạng thái cũ bằng mock manifest `tiangouYinNoYi: false` (quy tắc §7 `PROJECT_CONTEXT.md`), không sửa Golden.

## 6b. Test sẽ đỏ

Các sweep đóng băng quét mọi activity (`mansion-decision-baseline-v1`, p4-score Golden v1/v2 lớp C 35.040, migration diff v1/v2 và runner `ci:p4`, `baijiDayZhi`, `xiejiVol10ScoringMigration`, `legacyGodsMonthJian`, `xiejiConditionalMigration`, `p4MigrationRollback`, prerender/SEO nếu có status activity…). Danh sách chính xác lấy từ lần chạy unit đỏ sau khi bật P1; mỗi test phân loại: lịch sử → ghim `tiangouYinNoYi: false`; bất biến production → giải thích trong diff. Không sửa Golden/fixture đóng băng.

## 7. Release

`npm run check` → `ci:full` → `ci:p4` (đổi `shared/lunar`) → PR → **owner cho phép merge** → deploy → kiểm bundle SHA → smoke production trước/sau (desktop Chrome, Pixel 7, Safari, Firefox; ngày làm chứng 2024-01-27 và một ngày `not_recorded` trong 2025–2027) → cập nhật `PROJECT_CONTEXT.md` và `docs/audits/p1-tiangou-yin.md`.

## 8. Ngoài phạm vi

「凡酉日忌宴㑹亦不註宜慶賜賞賀」 (không có activity), 天狗 vào catalog, P2, R4, siết `event_fit`.
