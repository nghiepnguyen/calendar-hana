# P1 — 天狗寅日 「不註宜求福祈嗣」

2026-10-19, nhánh `claude/p1-tiangou-yin`. [PRD](../../tasks/prd-p1-tiangou-yin.md) (owner D1–D3, FR-4/5/7/8 duyệt 2026-10-19). **Đổi điểm activity, không đổi event.**

## Thay đổi

| Việc | Commit |
|---|---|
| PRD | `a491d0d`, `dd36419` |
| Golden `golden-p1-tiangou-yin-v1` (90 ca, độc lập engine, `derive.py`), freeze trước code | `338b8dc` |
| Test đỏ `p1TiangouYin.test.ts` (ship / P4 OFF / policy false) | `f7f647e` |
| Engine `shared/lunar/p1TiangouYin.ts` sau resolution trong `getActivityRecommendations`; manifest `tiangouYinNoYi: true`; UI "Đã gỡ theo Hiệp Kỷ" nhận marker `p1-tiangou-yin-v1` | `eb848a7` |
| Ghim test lịch sử + migration proof | commit này |

## Test đỏ sau engine (unit 9 / 8.187, 6 file) và phân loại

Cả 6 file so với output đóng băng **trước P1**; mọi lệch bắt đầu ở `2025-01-21 pray_blessing` (ngày Dần `not_recorded`). Phân loại: lịch sử → ghim `tiangouYinNoYi: false` bằng mock manifest (PROJECT_CONTEXT §7). Không sửa Golden/fixture/lock nào.

| File | Đóng băng | Xử lý |
|---|---|---|
| `legacyGodsMonthJian.test.ts` | Release A migration TSV | ghim |
| `p4AdapterBaseline.test.ts` | baseline v1 `1609264` | ghim |
| `p4MigrationRollback.test.ts` | rollback = baseline v1 | ghim; rollback P4 giờ là flag P4 OFF + `tiangouYinNoYi` theo ý muốn (độc lập, FR-7) |
| `p4MigrationDiff.test.ts` (3 test) | diff roadmap 9/9b + lock | ghim mọi cấu hình, kể cả `baseline` |
| `p4ScoreAdapterAlmanac.test.ts` (2 test) | Golden điểm v2 lớp C 35.040 | ghim |
| `xiejiConditionalMigration.test.ts` | decision baseline 1.2.1 | ghim |

Sau ghim: 6 file 29/29 pass.

## Migration (`p1TiangouYinMigration.test.ts`, P1 off → on)

`P1_MIGRATION_FULL=1`: 1.827 ngày 2024–2028 × 32 activity, P4 ON và OFF, cộng event 11 × (không giờ, 9 giờ). Mặc định (`npm test`): mọi ngày Dần + mỗi 10 ngày, không event. Kết quả: chỉ `pray_blessing`/`pray_children` ngày Dần đổi; dòng âm và hard warning giữ nguyên; không còn dòng dương applied; **event byte-equal**; 0 `UNEXPECTED_REGRESSION`.

| P4 | Miền | Activity | Trước → sau | Dòng |
|---|---|---|---|---:|
| ON (ship) | 2025–2027 | `pray_blessing` | recommended → neutral | 30 |
| | | | neutral → neutral | 2 |
| | | `pray_children` | recommended → neutral | 23 |
| | | | neutral → neutral | 3 |
| ON/OFF | 2024, 2028 | `pray_blessing` | recommended → neutral | 30 |
| | | | neutral → neutral | 4 |
| | | | avoid → strong_avoid | 4 |
| | | | watch → strong_avoid | 1 |
| | | `pray_children` | recommended → neutral | 24 |
| | | | neutral → neutral | 5 |
| | | | avoid → strong_avoid | 1 |
| OFF | 2025–2027 | `pray_blessing` | recommended → neutral 44, avoid → strong_avoid 5, watch → strong_avoid 3, neutral → neutral 2 | 54 |
| | | `pray_children` | recommended → neutral 37, avoid → strong_avoid 3, neutral → neutral 3 | 43 |

- P4 ON trong 2025–2027: 58 dòng = đúng 32 + 26 ngày `not_recorded` đo trước code; 59 ngày P4 đã gỡ (`only_ji`/`neither_recorded`) không đổi (FR-8).
- **Cần owner xác nhận (hệ quả của D1):** bỏ điểm tốt mà giữ điểm xấu làm điểm tụt, nên có dòng chuyển `avoid`/`watch → strong_avoid` (vd. 50 + 20 − 35 = 35 `watch` → 50 − 35 = 15 `strong_avoid`). Production phục vụ mọi năm và D3 áp mọi năm, nên ngoài 2025–2027 năm nào cũng có ca này; 2024 + 2028 chỉ là mẫu: `pray_blessing` 5 (avoid 4 + watch 1), `pray_children` 1. Trong 2025–2027 với P4 ON thì không có ca nào; với trạng thái rollback P4 OFF thì thêm 11 (pray_blessing 8, pray_children 3).
- `neutral → neutral`: điểm/dòng đổi (dòng dương → informational) nhưng status không đổi.

## Kiểm khác

- `personalModifier`: không caller production nào truyền (`getAlmanac` dùng 0), nên status kiểm qua almanac là status người dùng thấy.
- Full sweep sau ghim: `P4_MIGRATION_FULL=1` `p4MigrationDiff` 9/9, `P4_SCORE_ADAPTER_FULL=1` `p4ScoreAdapterAlmanac` 12/12.
- Anchor mutation `audit-p4-migration-mutations.py` 20/20, `audit-p4-score-adapter-mutations.py` 32/32 vẫn khớp đúng một chỗ sau khi sửa manifest/`activityRecommendations.ts`.
- Smoke (spec tạm, không commit): production **trước** deploy 4/4 (desktop Chrome + Firefox; 2024-01-27 và 2025-01-21 Cầu phúc "Nên làm", không có "Đã gỡ theo Hiệp Kỷ"); build local nhánh **sau** 4/4 ("Bình thường", "Đã gỡ theo Hiệp Kỷ" có "(không ghi tốt)", 2024-01-27 có "Thiên Đức (không ghi tốt)").

## Còn lại

`ci:full`, `ci:p4` → PR → owner cho phép merge → deploy → bundle SHA → smoke (ngày làm chứng 2024-01-27, 2025-01-21) → `PROJECT_CONTEXT.md`.
