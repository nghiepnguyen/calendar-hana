# Task 6 — nghiệm thu nền tảng thời gian sinh P3

Ngày kiểm tra: **01/10/2026**. Nhánh: `codex/personal-feng-shui-expansion`. Chưa commit/deploy.

## Phạm vi hoàn tất

- PRD 1.0.0 chốt schema, Việt Nam 1900–2100, auto timezone 1970–2100, UTC/TST, uncertainty, 12
  giao tiết, default `splitZi`, giới hạn 8 ứng viên và privacy/offline.
- Chọn tzdb 2026d; lịch sử không chắc trước 1970 yêu cầu xác nhận offset.
- Chọn Astronomy Engine 2.1.19 cho TST và giao tiết; không cài dependency trong task đặc tả.
- Fixture chỉ dùng dữ liệu thử giả và lưu cấu hình JPL, version, tọa độ, time scale, kết quả/sai số.
- Registry mở năm gate `birthTime` ở version 1.1.0; đây là readiness thiết kế, chưa phải engine đã
  được tích hợp vào sản phẩm.

## Benchmark

| Lớp | Ma trận | Kết quả |
| --- | --- | --- |
| TST | 12 ca 1900–2100, nhiều kinh độ Việt Nam | Astronomy max **0,323s**, đạt ≤30s |
| NOAA comparison | Cùng 12 ca | max **56,724s**, không chọn |
| Giao tiết | 12 tiết mở tháng 2024–2025 | Astronomy max **19,926s**, đạt ≤30s |
| License/offline | package 2.1.19 | MIT, browser minified 116.424 byte, không network runtime |
| Timezone | IANA 2026d | public-domain data; task 7 sinh artifact Việt Nam |

## Giới hạn

Benchmark hiện có một chu kỳ 12 tiết; task 7 phải mở rộng regression nhiều năm trước khi phát hành.
Độ chính xác engine và độ chắc chắn input được báo riêng. Chưa có schema migration, UI, repository,
service-worker artifact hoặc engine production nên không chạy emulator/Playwright/build cho task tài
liệu này. Unit registry, typecheck, lint, format và full regression được chạy để bảo đảm gate hiện có
không hỏng.

## Kiểm tra dự án

| Kiểm tra | Kết quả |
| --- | --- |
| Registry TDD | Test gate P3 thất bại khi bốn rule engine/policy còn pending, sau đó đạt **18/18** khi registry được đồng bộ với PRD và fixture. |
| Fixture | JSON parse đạt; 24 ca đều có cấu hình/provenance và dữ liệu thử giả. |
| `npm test` | **935 test / 82 file đạt**; chỉ còn cảnh báo `window.scrollTo` đã có của jsdom. |
| Static | Typecheck, oxlint, Prettier và `git diff --check` đạt. |
| Build | Vite/PWA/prerender đạt; còn cảnh báo chunk >500 kB và `inlineDynamicImports` deprecated đã có. |

Không chạy Emulator hoặc Playwright vì task 6 không đổi schema, repository, rules hay UI. Không chạy
`npm audit` vì không thay `package.json`/lockfile; hai package ứng viên chỉ được cài tạm ngoài project
để đo và không xuất hiện trong dependency ứng dụng.
