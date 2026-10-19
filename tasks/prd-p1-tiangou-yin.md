# PRD — P1 天狗寅日 「不註宜求福祈嗣」

2026-10-19, nhánh `claude/p1-tiangou-yin`. Việc độc lập P1 (`PROJECT_CONTEXT.md` §5), làm phase riêng theo owner 2026-10-19 (không gộp P4: P4 đã activation ở PR #71). **Đổi điểm** → Golden trước code, migration diff, owner cho phép merge.

## 1. Nguồn

- 欽定協紀辨方書 卷十 鋪註條例 (Wikisource raw, cùng file PR #26/#40, SHA-1 prefix `355dc6c8fe2d`), offset 21876: 「凡天狗寅日忌祭祀不註宜求福祈嗣」. Đã có trong `shared/almanac-data/p4-vol10-day-composition-v2.json` (`puzhu:07`, day 寅, headings 祈福/求嗣).
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

| # | Yêu cầu |
|---|---|
| FR-1 | Ngày có chi = 寅 (chi index 2), activity `pray_blessing` và `pray_children`: mọi dòng `applied` có `rawDelta > 0` → `status: 'informational'`, `scoreDelta = 0`. Dòng âm, hard warning, cap âm giữ nguyên |
| FR-2 | Bước này chạy **sau** resolution (卷十 scoring / P4 adapter) và **trước** cap. Kết quả không phụ thuộc thứ tự với lift P4: dòng dương P4 đã gỡ vẫn ở trạng thái gỡ |
| FR-3 | Điểm và trạng thái theo công thức hiện hành: score = 50 − Σ âm sau cap. Không còn dòng `applied` mà có dòng bị gỡ → `neutral` (giống `no_annotation`). Ngày không có dòng nào → giữ `no_evidence` |
| FR-4 | Dòng bị gỡ có dấu nguồn `puzhu:07` (để migration diff và UI phân biệt với lift P4) |
| FR-5 | UI: mục "Đã gỡ theo Hiệp Kỷ" (A5, `DailyActivitySection`) hiện dòng bị gỡ với nhãn "không ghi tốt", **cả khi flag P4 OFF** và cả ngoài 2025–2027 |
| FR-6 | Activity khác, ngày không phải Dần, mọi event: byte-equal so với trước P1 |
| FR-7 | Rollback: một policy manifest riêng `tiangouYinNoYi` (mặc định `true` khi ship). `false` → output byte-equal với trước P1. Độc lập với `xiejiVol10BalancingEnabled` |

## 5. Golden (đóng băng trước code)

- File `shared/almanac-data/golden-p1-tiangou-yin.json`, `FROZEN_BEFORE_CODE`. Chi ngày tính độc lập với engine bằng số học ngày (2000-01-07 = 甲子).
- Ca: ngày Dần trong 2025–2027 gồm đủ 4 state P4 (`only_ji`, `neither_recorded`, `not_recorded`, ngày có dòng âm), ngày Dần ngoài miền (2024, 2028, 2035), ngày đối chứng không phải Dần. Mỗi ca × 2 activity + 1 activity đối chứng (`worship`).
- Kỳ vọng mỗi ca: số dòng dương `applied` = 0 trên ngày Dần; tập dòng âm và tổng âm sau cap bằng output trước P1; status theo FR-3; activity đối chứng và ngày không phải Dần không đổi.
- Test đỏ trước code (commit riêng), Golden không sửa sau khi freeze.

## 6. Migration diff

- 1095 ngày 2025–2027 + 2024 + 2028, flag P4 ON và OFF: chỉ `pray_blessing`/`pray_children` trên ngày Dần đổi. Mỗi dòng đổi phân loại `EXPECTED_AUTHORITY_MIGRATION_CHANGE`, 0 `UNEXPECTED_REGRESSION`. Bảng status trước → sau như `docs/audits/baiji-dayzhi.md`.
- Test lịch sử ghim trạng thái cũ bằng mock manifest `tiangouYinNoYi: false` (quy tắc §7 `PROJECT_CONTEXT.md`), không sửa Golden.

## 7. Release

`npm run check` → `ci:full` → `ci:p4` (đổi `shared/lunar`) → PR → **owner cho phép merge** → deploy → kiểm bundle SHA → smoke production trước/sau (desktop Chrome, Pixel 7, Safari, Firefox; ngày làm chứng 2024-01-27 và một ngày `not_recorded` trong 2025–2027) → cập nhật `PROJECT_CONTEXT.md` và `docs/audits/p1-tiangou-yin.md`.

## 8. Ngoài phạm vi

「凡酉日忌宴㑹亦不註宜慶賜賞賀」 (không có activity), 天狗 vào catalog, P2, R4, siết `event_fit`.
