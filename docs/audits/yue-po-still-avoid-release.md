# Release — 月破 子午未申 仍忌 (PR #49) và P4 audit (PR #48)

Ngày 2026-10-11.

## PR #49 — đổi điểm

- Clause 月破 「與月德天德合月德合併不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣不與德合併諸事皆忌」. Đọc sát chữ: danh sách 忌 gốc + 3 việc 仍忌 (`shared/lunar/yuePoStillAvoidPolicy.ts`).
- Migration 1095 ngày (2025–2027, `yuePoStillAvoidMigration.test.ts`): 11 ngày, chỉ `medical` / `demolition`, mỗi dòng −50; medical recommended → watch 5, watch giữ 6; demolition recommended → avoid 5, watch → strong_avoid 6; event không đổi.
- Merge `1fc9940`, [CI run 38137324257](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38137324257) SUCCESS. Bundle production `index-CeLinrvj.js`, SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`, trùng build local.

## PR #48 — audit-only

Merge `2cf7bb3`, [CI run 38141047258](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38141047258) SUCCESS (gồm Deploy). Bundle production sau deploy vẫn `index-CeLinrvj.js` / `f29f5aab…`, nên runtime không đổi. Mục lục P4: `docs/audits/p4-vol10-progress.md`.

## Smoke production (sau cả hai deploy)

Spec Playwright tạm, chạy trên `https://lich.thanhnghiep.top` với hồ sơ sinh tạm trong browser context, file tạm đã xóa. Kết quả: desktop Chrome và Pixel 7, mỗi máy 3/3 qua.

| Ngày | Cầu y / Chữa bệnh | Phá dỡ | Ghi chú |
|---|---|---|---|
| 2025-07-06 | Cần lưu ý | Nên tránh | Bản cũ: Nên làm / Nên làm |
| 2025-07-19 | Cần lưu ý | Kỵ mạnh | Bản cũ: Cần lưu ý / Cần lưu ý |
| 2025-07-05 | Cần lưu ý | Cần lưu ý | Đối chứng, không thuộc 11 ngày đổi |

Chưa chạy: Safari desktop, iPhone thật, Firefox (R3).
