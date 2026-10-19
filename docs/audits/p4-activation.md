# Roadmap 10 — activation P4 (PR-2)

2026-10-18, nhánh `claude/p4-activation`. [PRD](../../tasks/prd-p4-activation.md) (owner §5 duyệt 2026-10-18). PR-1 = [PR #70](https://github.com/nghiepnguyen/calendar-hana/pull/70) (`98e8ca5`, 9b sau flag OFF, đã deploy).

## Thay đổi

| # | Việc | Commit |
|---|---|---|
| A1 | `src/p4Provider.ts`: `main.tsx` nạp chunk resolver lúc khởi động, không chặn; `AlmanacPanel` và `DailyActivitySection` hiện "Đang tải…" tới khi provider đăng ký. Khóa memo almanac có trạng thái provider, nên almanac baseline tính trước đó không bị dùng lại. Nạp lỗi thì giữ baseline | `ba303be` |
| A2 | Prerender (`shared/seo/daySeoPrerender.ts`) nạp provider trước `daySeo` | `ba303be` |
| A5 | Chi tiết activity: mục "Đã gỡ theo Hiệp Kỷ" ("kỵ đã được gỡ" / "không ghi tốt") | `0619ece` |
| A4 | Nghĩa 16 thần dormant ([bản owner duyệt](p4-dormant-meanings-draft.md)) | `a8afa5c`, `dee80d4` |
| A3 | `xiejiVol10BalancingEnabled: true`. Test nạp provider khi manifest ship ON (giống production). Test lịch sử / Golden đóng băng / baseline flag OFF / rollback / cơ chế UI ghim OFF bằng mock manifest. Bất biến production (`baijiProductionInvariants`, Golden P2 `baijiTyHoi`, cat-hung overlay) vẫn chạy ON | `7111e42` |

## Kiểm

| Hạng mục | Kết quả |
|---|---|
| Unit (flag ON) | 8.176 pass; ban đầu 61 test đỏ / 24 file, phân loại: lịch sử/migration/Golden đóng băng → ghim OFF; cat-hung quét 1095 ngày → timeout 300 s; test p4Provider → module graph mới |
| Build | `index` 1.259,28 kB (gzip 374,22), +2,45 kB so với roadmap 8; resolver chunk riêng `p4AlmanacHeadings` 407,89 kB (gzip 91,12); bundle `xiejiVol10BalancingEnabled:!0`; trang prerender 2025-10-19 có Nguyệt Hại |
| `ci:full` | EXIT 0 (409 s): unit, emulator, gate annual + mansion, Playwright desktop 110 (visual snapshot qua) + legal 10 |
| `ci:p4` | Chạy tay 3.734 s: P4-B, P4-C, P5 12/12, puzhu:06 16/16, Golden v2, owner-rules toàn miền + 12/12, nối almanac toàn miền (lớp C 35.040) qua; runner adapter 28/29 bị bắt rồi dừng ở mutation `flag_default_on` (chuỗi manifest cũ). Đã thay bằng `flag_shipped_off` (`b340881`), thử riêng: bị bắt. **Không chạy lại** harness diff toàn miền và runner migration 20 sau khi bật flag (owner 2026-10-18: không chạy lại phần đã ổn); harness bản lấy mẫu qua trong unit |
| Rollback (diễn tập local) | `p4MigrationRollback.test.ts`: mock manifest OFF + provider đã nạp = baseline v1 byte-equal, activity + event, 1098 ngày, chạy trong unit với manifest ship ON |
| Hiệu năng | Node: almanac đầu tiên OFF 17 ms / ON 53 ms; "ngày tốt kế tiếp" 3 event × 30 ngày 6 → 35 ms |

## Còn lại (sau merge)

Deploy → kiểm bundle SHA và `xiejiVol10BalancingEnabled:!0` → smoke desktop Chrome, Pixel 7, Safari desktop (ngày làm chứng: 2025-10-19 meeting cap 百忌酉, 2025-02-17 meeting "Đã gỡ", 2025-02-20 Cưới hỏi Bát Chuyên, ngày 百忌亥, 諸事皆忌) → cập nhật PROJECT_CONTEXT. iPhone/Firefox chưa chạy (R3).

## Smoke R3 (sau release)

**Firefox — 2026-10-19:** production build `284eb8e` (`src`/`shared` không đổi từ `7826f0c`), bundle `/assets/index-DbFAG4Ga.js` SHA-256 `2233c6aff6c08fe8b342df586ddb8178cfad85aa3bf7341892012f69d3aa8ba4`, nhúng `xiejiVol10BalancingEnabled:!0`. Chạy lại 4 test smoke ON của roadmap 10 (spec tạm `e2e/zz-p4-smoke.spec.ts` + config `baseURL` production, đã xoá) bằng Playwright 1.63.0, project `firefox` (`firefox-1543`) và `desktop` làm đối chứng: **8/8 pass** (Firefox 4/4, Chrome 4/4).

| Test | Kỳ vọng ON |
|---|---|
| 2025-10-19 Gặp gỡ / Hội họp | "Ngày Dậu (Bách Kỵ) (kỵ vẫn áp dụng, đã đạt mức trừ tối đa)" |
| 2025-02-17 Gặp gỡ / Hội họp | danh sách "Đã gỡ theo Hiệp Kỷ" có "Nguyệt Hại (kỵ đã được gỡ)" |
| 2025-02-20 Cưới hỏi | "Yếu tố bất lợi" có "kỵ vẫn áp dụng, đã đạt mức trừ tối đa" |
| 2025-10-19 Sao xấu | "xem thêm" rồi có "Nguyệt Hại" |

**iPhone thật — chưa chạy (owner tự chạy).** Checklist trên Safari iOS, <https://lich.thanhnghiep.top>:

1. Cài đặt → Thông tin ngày sinh: 1/7/1990 → Lưu thông tin, thấy "Đã lưu thông tin ngày sinh."
2. `/day/2025-10-19` → Mục tiêu và kết luận trong ngày → mở hết nhóm/"Xem thêm" → Gặp gỡ / Hội họp: thấy "Ngày Dậu (Bách Kỵ) (kỵ vẫn áp dụng, đã đạt mức trừ tối đa)".
3. `/day/2025-02-17` → Gặp gỡ / Hội họp: mục "Đã gỡ theo Hiệp Kỷ" có "Nguyệt Hại (kỵ đã được gỡ)".
4. `/day/2025-02-20` → Cưới hỏi: "Yếu tố bất lợi" có "kỵ vẫn áp dụng, đã đạt mức trừ tối đa".
5. `/day/2025-10-19` → Lịch vạn niên → Sao xấu → "xem thêm": có "Nguyệt Hại".
6. PWA (Home Screen): Chia sẻ → Thêm vào MH chính → mở từ icon; khi có deploy mới, mở lại app → toast "Có phiên bản mới" → "Cập nhật ngay" → `/version.json` `build` mới (xem `docs/pwa-update-strategy.md`).

Ghi kết quả (model iPhone, iOS, ngày, pass/fail từng bước) vào mục này.
