## Relevant Files

- `tasks/prd-bazi-interpretation.md` - Contract, phương pháp, nguồn và gate P4.
- `tasks/fixtures/bazi-interpretation.v1.json` - Ma trận Thập thần, bảng tàng can và status fixture độc lập.
- `shared/bazi/interpretation/types.ts` - Kiểu input/output và trạng thái có version cho P4.
- `shared/bazi/interpretation/stems.ts`, `stems.test.ts` - Hành/âm dương của Can và Nhật chủ.
- `shared/bazi/interpretation/tenGods.ts`, `tenGods.test.ts` - Ma trận Thập thần 10×10.
- `shared/bazi/interpretation/hiddenStems.ts`, `hiddenStems.test.ts` - Bảng tàng can và provenance.
- `shared/bazi/interpretation/strengthEvidence.ts`, `strengthEvidence.test.ts` - Bằng chứng mùa/gốc/sinh trợ/tiết khắc, không dùng score.
- `shared/bazi/interpretation/usefulGod.ts`, `usefulGod.test.ts` - Resolver tháng lệnh chỉ cho rule đã duyệt.
- `shared/bazi/interpretation/index.ts`, `index.test.ts` - Pipeline candidate, uncertainty, version và cache key.
- `shared/personalFengShui/rules.ts`, `rules.test.ts` - Gate/version P4 độc lập với P1–P3.
- `src/views/DayView/BaziSection.tsx`, `BaziSection.test.tsx`, `BaziSection.module.css` - Disclosure Nhật chủ/Thập thần và trạng thái giới hạn.
- `e2e/birth-info.spec.ts`, `e2e/personal-feng-shui.spec.ts`, `e2e/a11y.spec.ts` - Luồng P4, ambiguity, mobile và accessibility.
- `tasks/validation-bazi-interpretation.md` - Bằng chứng nghiệm thu theo từng lớp P4a/P4b/P4c.

### Notes

- P3 đã đạt nghiệm thu tự động với rules 1.1.0, Astronomy Engine 2.1.19 và tzdb 2026d.
- Triển khai theo thứ tự P4a → P4b → P4c. P4a có thể phát hành độc lập; Dụng thần không được mở
  chỉ vì Nhật chủ/Thập thần đã đạt.
- Fixture phải được review trước mã sản xuất. Không cập nhật expected chỉ để hợp implementation.
- Dùng Vitest và các script dự án hiện có; chạy emulator chỉ khi thay repository/rules, Playwright
  khi thay UI. Không persist output luận giải.
- Mọi rule Dụng thần cần hai review nội dung đối chiếu nguồn. Thiếu review thì giữ `pending` và trả
  `unsupported`.

## Instructions for Completing Tasks

Làm xong sub-task nào thì đổi `- [ ]` thành `- [x]`. Chỉ đánh dấu task cha khi toàn bộ gate của lớp
đó đạt. Không đánh dấu rule Dụng thần hoàn tất bằng cách thu hẹp test hoặc dùng một ví dụ tự sinh.

## Tasks

- [ ] 0.0 Chuẩn bị triển khai P4 trên nhánh phù hợp
  - [ ] 0.1 Đọc PRD/fixture P4, kiểm tra trạng thái Git và hướng dẫn repository; giữ nguyên thay đổi hiện có.
  - [ ] 0.2 Tạo hoặc tiếp tục nhánh `codex/bazi-interpretation`; ghi commit P3 làm dependency base.
  - [ ] 0.3 Xác nhận P3 vẫn đạt unit/typecheck và output/version chưa đổi trước khi viết test P4.

- [ ] 1.0 Chốt dữ liệu và gate quy tắc P4
  - [ ] 1.1 Thêm rule ID/version/source cho Nhật chủ, Thập thần, tàng can, strength evidence và Dụng thần.
  - [ ] 1.2 Giữ Dụng thần `pending`; chỉ chuyển từng decision rule sang verified sau hai review nguồn.
  - [ ] 1.3 Validate fixture JSON, đủ 100 ô Thập thần, 12 Chi/28 tàng can và status cases.
  - [ ] 1.4 Viết test gate: pending/rejected không thể trả `ready`, version thiếu không fallback âm thầm.

- [ ] 2.0 Triển khai Nhật chủ và Thập thần P4a bằng TDD
  - [ ] 2.1 Viết test đỏ từ ma trận 10×10 và input Can sai range/parity trước implementation.
  - [ ] 2.2 Tạo bảng Can có hành/âm dương; lấy Nhật chủ duy nhất từ Can ngày của từng candidate P3.
  - [ ] 2.3 Tạo hàm quan hệ có hướng và gán đúng mười Thập thần; không thêm cát/hung hoặc score.
  - [ ] 2.4 Gắn Thập thần cho Can lộ năm/tháng/giờ, giữ pillar/operand/reason/source/version.
  - [ ] 2.5 Thêm lớp tùy chọn Can ngày/giờ xem, không sửa lá số hoặc summary ngày.
  - [ ] 2.6 Test property toàn 100 tổ hợp, chiều quan hệ, polarity và regression Can Chi hiện có.

- [ ] 3.0 Triển khai tàng can và bằng chứng vượng/suy P4b bằng TDD
  - [ ] 3.1 Viết test đỏ cho 12 Chi, thứ tự bản/trung/dư và tổng 28 tàng can.
  - [ ] 3.2 Trả tàng can theo từng trụ, rank và Thập thần; không gán tỷ trọng hoặc tự biến hóa do hợp/xung.
  - [ ] 3.3 Định nghĩa evidence item cho tháng lệnh, thông căn, Can lộ, sinh/trợ, tiết/khắc và tương tác.
  - [ ] 3.4 Dùng Chi tháng P3 làm tháng lệnh; không dùng tháng âm hoặc nạp âm.
  - [ ] 3.5 Test fixture có cùng hành khác Can, nhiều gốc, không gốc và candidate khác nhau.
  - [ ] 3.6 Xác nhận API/UI không xuất `strengthScore` hoặc kết luận thân vượng/nhược ngoài coverage.

- [ ] 4.0 Xây pipeline candidate, uncertainty và version
  - [ ] 4.1 Tạo contract status `ready/ambiguous/insufficientData/unsupported` và reason codes.
  - [ ] 4.2 Map từng candidate P3 độc lập, giữ `sourceCandidateIndex`; không gộp candidate theo Nhật chủ.
  - [ ] 4.3 Propagate thiếu dữ liệu/version không hỗ trợ và phân biệt input uncertainty với method coverage.
  - [ ] 4.4 Tạo cache key gồm candidate P3, P3 versions, zi policy và toàn bộ P4 versions; cache chỉ trong bộ nhớ.
  - [ ] 4.5 Test candidate đồng kết quả/khác Nhật chủ, tối đa tám candidate và invalidation version.

- [ ] 5.0 Lập bảng quyết định Dụng thần P4c trước implementation
  - [ ] 5.1 Chia phương pháp tháng lệnh thành rule nhỏ có ID: tàng can chủ tháng, Can lộ, hội/hợp, thành–bại và cứu ứng.
  - [ ] 5.2 Với mỗi rule, trích passage/ấn bản, ghi operands, precedence, positive/near-miss/conflict fixture.
  - [ ] 5.3 Thực hiện hai review nội dung độc lập; lưu reviewer/date/decision và bất đồng.
  - [ ] 5.4 Giữ các cách đặc biệt, tòng/hóa, phù ức, điều hậu và thông quan ngoài coverage ở `unsupported`.
  - [ ] 5.5 Chỉ sau khi 5.1–5.4 đạt, viết test đỏ và resolver deterministic cho các rule verified.
  - [ ] 5.6 Resolver nhiều nhánh trả `indeterminate`; không chọn theo điểm, hành thiếu hoặc thứ tự code.

- [ ] 6.0 Tích hợp UI theo gate từng lớp
  - [ ] 6.1 Thêm disclosure “Giải nghĩa Bát Tự” vào `BaziSection`, sau bốn trụ hiện có.
  - [ ] 6.2 Hiển thị Nhật chủ và Thập thần bằng chữ, lý do ngắn, glossary và source/version.
  - [ ] 6.3 Hiển thị tàng can/evidence theo progressive disclosure; không dùng màu làm tín hiệu duy nhất.
  - [ ] 6.4 Hiển thị nhiều candidate, `unsupported` và `indeterminate` với hành động sửa hồ sơ khi phù hợp.
  - [ ] 6.5 Chỉ render Dụng thần khi feature gate và method coverage đạt; không dùng placeholder như kết luận.
  - [ ] 6.6 Test keyboard/screen reader, 360px, ba cỡ chữ, sáng/tối và nội dung không tràn.

- [ ] 7.0 Nghiệm thu và chuẩn bị phát hành P4 theo lớp
  - [ ] 7.1 Chạy unit/fixture P4 và full regression P1–P3/lịch chung; ghi số test và version.
  - [ ] 7.2 Chạy typecheck, lint, format, build và Playwright desktop/mobile/WebKit phù hợp.
  - [ ] 7.3 Kiểm tra offline, bundle/performance và không có request luận giải ngoài.
  - [ ] 7.4 Audit URL/analytics/log/SEO/prerender/service worker để không lộ input/output P4.
  - [ ] 7.5 Review nội dung: không dự báo, không gán cát/hung từ tên, phân biệt Nhật chủ/nạp âm.
  - [ ] 7.6 Tạo `validation-bazi-interpretation.md` và checklist phát hành riêng P4a/P4b/P4c.
  - [ ] 7.7 Chỉ mở lớp đạt gate; ghi rõ lớp pending/unsupported và không tự deploy production.

