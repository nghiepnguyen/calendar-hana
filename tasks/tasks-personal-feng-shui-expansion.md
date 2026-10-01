## Relevant Files

- `tasks/plan-personal-feng-shui-expansion.md` - Plan nguồn: audit tài liệu, giai đoạn P0–P4, phụ thuộc và tiêu chí nghiệm thu.
- `tasks/prd-personal-feng-shui.md` - Phạm vi MVP phải giữ khi tích hợp mở rộng.
- `generate-tasks.md` - Quy trình tạo task hai giai đoạn; người dùng đã xác nhận “go” để tạo sub-task.

### Tài liệu và nguồn cần tạo

- `tasks/feng-shui-rule-audit.md` (đã tạo, P0) - Danh mục nguồn, khác biệt, trạng thái và quyết định cho từng quy tắc.
- `tasks/prd-annual-feng-shui.md` (đã tạo, P1 spec) - Hạn năm theo mục đích/vai trò, miền tuổi được hỗ trợ và trạng thái đầu ra.
- `tasks/fixtures/annual-feng-shui.v1.json` (đã tạo, P1 spec) - Expected tĩnh có provenance: Kim Lâu, toàn miền Hoang Ốc 10–69, Tam Tai 12×12, context và ma trận áp dụng; chưa dùng trong production.
- `tasks/prd-personal-feng-shui-stars.md` (mới, có điều kiện) - Chỉ các thần sát cá nhân đủ nguồn; phép tổng hợp và ranh giới với sao chung.
- `tasks/prd-birth-time-normalization.md` (mới) - Hồ sơ sinh, UTC/TST, múi giờ lịch sử, giao tiết, giờ Tý và chuẩn độ chính xác.
- `tasks/bazi-engine-evaluation.md` (mới) - So sánh engine/dữ liệu, sai số, giấy phép, dung lượng và quyết định lựa chọn.
- `tasks/prd-bazi-interpretation.md`, `tasks/tasks-bazi-interpretation.md` (mới, P4) - Đặc tả và task luận Nhật chủ/Thập thần/Dụng thần ở giai đoạn sau.
- `tasks/feng-shui-release-checklist.md` (mới) - Bằng chứng nghiệm thu, lớp được phát hành và các phần chưa hỗ trợ.

### Logic thuần và dữ liệu đề xuất

- `shared/personalFengShui/rules.ts`, `rules.test.ts` (đã tạo, P0) - ID, version, scope, nguồn, trạng thái kiểm chứng và lọc quy tắc được phép chạy.
- `shared/personalFengShui/annual/types.ts`, `context.ts`, `context.test.ts` (đã tạo, P1) - Kiểu mục đích/vai trò, trạng thái và năm âm/tuổi mụ; gate tuổi mụ chạy trước quy đổi.
- `shared/personalFengShui/annual/kimLau.ts`, `hoangOc.ts`, `tamTai.ts` và các file `.test.ts` cùng tên (đã tạo, P1) - Từng phép tính hạn năm theo nguồn đã chốt; hàm số học từ chối operand ngoài miền bằng RangeError.
- `shared/personalFengShui/annual/index.ts`, `index.test.ts`, `annual.fixtures.ts` (đã tạo, P1) - API `assessAnnualFengShui`, ma trận áp dụng và fixture đặc tả dùng trong test, không import trong production.
- `shared/personalFengShui/stars.ts`, `stars.test.ts`, `stars.fixtures.ts` (mới, có điều kiện) - Thần sát thực sự cá nhân, chỉ tạo khi đạt bước xác minh.
- `shared/bazi/types.ts`, `validation.ts`, `validation.test.ts` (mới) - Input/metadata hồ sơ, uncertainty và lỗi miền dữ liệu.
- `shared/bazi/birthTime.ts`, `solarTime.ts`, `termInstants.ts`, `ziPolicy.ts`, `pillars.ts`, `index.ts` và các file `.test.ts` tương ứng (mới) - Pipeline thời gian và Tứ Trụ tách khỏi lịch chung.
- `shared/bazi/timezone.data.ts`, `termInstants.data.ts`, `bazi.fixtures.ts` (mới nếu phương pháp được chọn cần) - Dữ liệu phiên bản cố định và fixture có provenance; không mặc định chọn thư viện trước benchmark.
- `scripts/generateBaziReference.ts`, `scripts/benchmarkBazi.ts` (mới) - Sinh dữ liệu tham chiếu/tái lập benchmark, tách khỏi hàm sản xuất.
- `shared/lunar/lunar.ts`, `canChi.ts`, `solarTerms.ts`, `stars.ts`, `stars.data.ts` và test hiện có - Tận dụng lịch/Can Chi/bảng sao, kiểm tra regression; không ghi đè quy ước chung bằng quy ước Bát Tự.

### Hồ sơ, lưu trữ và giao diện

- `shared/types.ts`, `shared/birthInfo.ts`, `shared/birthInfo.test.ts` - Bổ sung metadata sinh/cài đặt tương thích ngược; giữ ngày/giờ sinh hiện có.
- `src/data/defaultCategories.ts` - Kiểm tra nơi định nghĩa cài đặt mặc định hiện tại trước khi thêm trường mới.
- `src/data/db.ts`, `localRepository.ts`, `firestoreRepository.ts`, `migrateLocalToCloud.ts` - Lưu trữ, đồng bộ, chuyển local lên cloud và migration nếu cần.
- `src/data/exportImport.ts`, `exportImport.test.ts`, `localRepository.test.ts`, `firestoreRepository.emulator.test.ts` - Sanitize, JSON round-trip và tính tương thích dữ liệu.
- `firestore.rules`, `src/firebase/rules.emulator.test.ts` - Quyền sở hữu và validation dữ liệu mới nếu schema/rules hiện tại cần cập nhật.
- `src/pages/Settings/BirthInfoForm.tsx`, `AccountSection.test.tsx`, `SettingsPage.tsx`, `SettingsPage.module.css` - Nơi sinh, độ chắc chắn, quy ước và xóa hồ sơ; không nhân đôi form ngày sinh.
- `src/views/DayView/PersonalFengShuiPanel.tsx`, `PersonalFengShuiPanel.test.tsx` (phụ thuộc MVP) - Khối riêng dưới sự kiện và ranh giới đánh giá ngày/hạn năm.
- `src/views/DayView/AnnualFengShuiSection.tsx`, `AnnualFengShuiSection.test.tsx`, `AnnualFengShuiSection.module.css` (mới) - Chọn mục đích/vai trò và xem từng hạn năm.
- `src/views/DayView/BaziSection.tsx`, `BaziSection.test.tsx`, `BaziSection.module.css` (mới) - Hiển thị bốn trụ, hiệu chỉnh, quy ước và trường hợp chưa xác định.
- `src/views/DayView/DayView.tsx`, `DayView.test.tsx`, `AlmanacPanel.test.tsx` - Thứ tự khối và regression công tắc/lịch chung.
- `src/styles/textSize.ts`, `src/styles/theme.css` - Tận dụng scale, icon và màu sáng/tối hiện có.
- `src/analytics.ts`, `src/sw.ts`, `shared/seo/daySeo.ts`, `scripts/prerenderDays.ts`, `public/privacy.html` - Kiểm tra dữ liệu riêng tư, cache offline, SEO/prerender và cập nhật mô tả chính sách nếu có dữ liệu mới.
- `e2e/personal-feng-shui.spec.ts` (mới), `e2e/birth-info.spec.ts`, `e2e/a11y.spec.ts`, `e2e/mobile-layout.spec.ts`, `e2e/text-size.spec.ts` - Luồng mở rộng, migration hồ sơ, mobile/cỡ chữ và accessibility.
- `package.json`, lockfile, cấu hình Vite/Playwright hiện có - Chỉ chỉnh khi lựa chọn engine, script tham chiếu hoặc test cần; không nâng cấp dependency ngoài phạm vi.

- `shared/personalFengShui/day.ts`, `day.test.ts` - MVP quan hệ Can/Chi, nạp âm, tổng hợp và lọc 12 giờ; không dùng cache lịch chung cho hồ sơ.
- `src/hooks/useSettingsIdentity.test.tsx`, `src/views/DayView/personalProfileChanges.test.tsx` - Chuyển repository/tài khoản, xóa hồ sơ và cập nhật quy tắc/giờ.
- `src/data/personalFengShuiSettings.test.ts`, `src/pages/Settings/birthInfoAnchor.test.tsx` - Round-trip JSON/công tắc và focus liên kết hồ sơ.
- `tasks/validation-personal-feng-shui-task-4.md` - Bằng chứng triển khai task 4 và nghiệm thu phát hành còn lại.

### Notes

- Trạng thái: đã hoàn tất bước 0, task 1, đặc tả task 2 và module hạn năm task 3; đang ở nhánh `codex/personal-feng-shui-expansion`, tạo từ `main`. Task 4.0 đã tích hợp UI P1 và triển khai phần MVP ngày/giờ còn thiếu; task 5.0–9.0 chưa làm. Nghiệm thu phát hành MVP còn cần đo trên điện thoại thật và thử với người dùng.
- Kiểm tra bước 0: không tìm thấy `AGENTS.md` trong repository hoặc các thư mục cha áp dụng. Trước khi tạo nhánh chỉ có ba tài liệu phong thủy chưa được Git theo dõi; đã giữ nguyên, không reset/stash/xóa hoặc commit.
- Kiểm tra bước 0 ban đầu chưa có MVP. Trong task 4 đã triển khai `shared/personalFengShui/day.ts`, `PersonalFengShuiPanel` và `showPersonalFengShui`, rồi tích hợp hạn năm. Bằng chứng và giới hạn nghiệm thu: `tasks/validation-personal-feng-shui-task-4.md`.
- Snapshot P0: 26 mục (10 verified, 15 pending, 1 rejected). Sau task 3, registry có 27 mục (14 verified, 12 pending, 1 rejected): thêm policy annual, kiểm chứng ba bảng trong phạm vi PRD. Bằng chứng và câu hỏi chặn từng quy tắc ở `tasks/feng-shui-rule-audit.md`; pending vẫn chưa được phép tính.
- Kết quả task 2: PRD P1 v1.0.0 và fixture đã đóng; Hoang Ốc chỉ hỗ trợ 10–69, purpose/role không persist. Nguồn PDF/giới hạn provenance và policy ở PRD mục 2; registry đã đồng bộ ở task 3, không mở gate chỉ từ fixture.
- Kết quả task 3: 360 test annual và 17 test registry đạt; toàn dự án 879 test / 75 file đạt, typecheck/lint/format/build đạt. Không thêm cache, persist, UI, dependency hoặc thay lịch chung. `npm audit` chưa hoàn tất do DNS `ENOTFOUND registry.npmjs.org`.
- Đường dẫn trong Relevant Files tương đối với gốc repository; file ghi “mới” hoặc “đề xuất” chưa tồn tại. Điều chỉnh tên theo kiến trúc MVP thực tế và ghi lại quyết định khi triển khai.
- Giữ một hồ sơ và khối riêng dưới sự kiện trong tab Ngày. Nếu MVP chưa triển khai, hoàn tất MVP theo PRD riêng trước khi tích hợp các lớp mở rộng vào UI.
- Phụ thuộc: P0 → P1; P0 → P2; P0 → P3 → P4. Thần sát P2 có thể hoãn mà không chặn nền tảng Tứ Trụ P3.
- Chỉ quy tắc có nguồn và fixture kiểm chứng được tham gia kết luận. Quy tắc pending/rejected không được tính ngầm; nguồn chưa đủ là điều kiện chặn quy tắc đó, không chặn phần độc lập đã xác minh.
- Hạn năm, sao chung và đánh giá cá nhân theo ngày phải tách biệt. Giữ nguyên cách tính lịch chung và quy ước giờ của MVP.
- Task về Thập thần/Dụng thần ở danh sách này dừng ở đặc tả và lập task tiếp theo; không tự triển khai phương pháp chưa được chốt.
- Khi triển khai, dùng Vitest: `npm test` hoặc `npx vitest run <path>`; chạy `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` cho thay đổi phù hợp. Chạy `npm run test:emulator` khi thay lưu trữ/rules; Playwright cho luồng UI đã đổi. Không dùng Jest theo ví dụ chung trong hướng dẫn.
- Benchmark dùng hồ sơ giả cố định và fixture tham chiếu có nguồn; không gửi thông tin sinh thật lên dịch vụ thiên văn hoặc công cụ đo.
- Phát hành ở đây là chuẩn bị mã và bằng chứng nghiệm thu; danh sách này không tự cấp quyền deploy production. Đánh giá điều kiện phát hành riêng cho từng lớp, không bắt P1 chờ toàn bộ P3/P4.
- Danh sách này không bao gồm nhiều hồ sơ, ghép đôi, tìm ngày theo khoảng, nghi thức hóa giải hoặc tự đổi lịch sự kiện.

## Instructions for Completing Tasks

Làm xong task nào thì đổi `- [ ]` thành `- [x]`. Sau khi bổ sung sub-task, cập nhật từng sub-task ngay khi hoàn tất; chỉ đánh dấu task cha khi mọi điều kiện nghiệm thu của nó đã đạt. Không đánh dấu hoàn tất chỉ vì task bị hoãn hoặc còn thiếu nguồn.

## Tasks

- [x] 0.0 Create feature branch — Tạo nhánh `codex/personal-feng-shui-expansion` khi bắt đầu triển khai, sau khi kiểm tra trạng thái checkout và thay đổi hiện có.
  - [x] 0.1 Đọc hướng dẫn repository áp dụng, kiểm tra `git status`, nhánh hiện tại và công việc chưa commit; không reset/stash/xóa thay đổi của người dùng để lấy checkout sạch.
  - [x] 0.2 Kiểm tra nhánh `codex/personal-feng-shui-expansion` đã tồn tại chưa; tạo từ checkout phù hợp hoặc tiếp tục nhánh phù hợp đang có, không ghi đè nhánh.
  - [x] 0.3 Kiểm tra MVP đã có component/logic chưa; ghi rõ điều kiện phụ thuộc vào PRD MVP trước task tích hợp 4.0/7.0, không giả định file đề xuất đã tồn tại.

- [x] 1.0 Chuẩn hóa nguồn và kiểm chứng quy tắc (P0): lập danh mục có scope, mục đích, mốc thời gian, phiên bản, fixture và trạng thái verified/pending/rejected; xử lý các mâu thuẫn đã nêu trong plan.
  - [x] 1.1 Tạo `tasks/feng-shui-rule-audit.md`, liệt kê từng quy tắc từ ba attachment và đối chiếu với PRD MVP, `shared/lunar/stars.data.ts`, `canChi.ts`, `solarTerms.ts`.
  - [x] 1.2 Ghi cho mỗi quy tắc: ID, nguồn/ấn bản/trang hoặc URL, ngày đối chiếu, version, đầu vào, scope chung/cá nhân/năm, mục đích/vai trò, mốc thời gian và tháng âm/tiết khí.
  - [x] 1.3 Kiểm chứng Can xung riêng, cách gắn nhãn Thái Tuế/Tuế Phá, cách áp dụng Tam Sát và bảng Sát Chủ Dương; ghi khác biệt với attachment, không lấy comment trong mã làm bằng chứng.
  - [x] 1.4 Xác nhận Thụ Tử trong attachment là sao chung trùng dữ liệu hiện có; ghi cách tái sử dụng, không đưa vào kết luận riêng theo tuổi.
  - [x] 1.5 Ghi và xử lý lỗi đã nêu: mẹo tổng chữ số Kim Lâu, miền tuổi Hoang Ốc chưa đủ, hoạt động mua/sửa nhà chưa rõ, mốc Thanh Minh, lịch sử offset và Can giờ Tý không cố định.
  - [x] 1.6 Đánh dấu verified/pending/rejected với lý do và bằng chứng. Với phần thiếu nguồn, ghi cụ thể câu hỏi còn thiếu và phạm vi bị chặn; không chặn các quy tắc độc lập đã verified.
  - [x] 1.7 Định nghĩa registry quy tắc trong `shared/personalFengShui/rules.ts` hoặc mở rộng registry MVP: tách trạng thái kiểm chứng khỏi trạng thái áp dụng, kiểm tra ID duy nhất/version và chỉ cho chạy quy tắc verified.
  - [x] 1.8 Thêm test registry: pending/rejected không tham gia tổng hợp, thiếu nhóm bắt buộc không thành kết quả trung tính; hoàn tất audit P0 trước task triển khai tương ứng.

- [x] 2.0 Hoàn thiện đặc tả hạn năm (P1): chốt tuổi mụ, toàn miền tuổi Hoang Ốc, bảng Kim Lâu/Tam Tai, ma trận mục đích–vai trò và trạng thái không áp dụng/thiếu dữ liệu/chưa hỗ trợ.
  - [x] 2.1 Tạo `tasks/prd-annual-feng-shui.md` mô tả một hồ sơ, năm âm đang xem và phần kết quả riêng; ghi rõ không đổi nhãn đánh giá ngày, không khóa tạo sự kiện.
  - [x] 2.2 Định nghĩa input/output: ngày xem/ngày sinh dương, mục đích/vai trò, năm âm, tuổi mụ, từng hạn, toán hạng, rule ID/version và trạng thái `applies/notApplicable/insufficientData/unsupported`; kết quả có/không phạm chỉ có khi `applies`.
  - [x] 2.3 Chốt tuổi mụ theo năm âm sau quy đổi cả hai ngày; ngày xem trước ngày sinh không áp dụng, ngày ngoài khoảng hỗ trợ không âm thầm tính.
  - [x] 2.4 Chốt Kim Lâu bằng số dư chia 9; định nghĩa loại hạn và nội dung diễn giải dựa nguồn; không triển khai mẹo tổng chữ số một lần hoặc dự đoán tác hại cụ thể.
  - [x] 2.5 Chốt bảng/công thức Hoang Ốc cho toàn miền tuổi được hỗ trợ, gồm dưới 10 và từ 70 trở lên. Nếu chưa đủ nguồn, giới hạn rõ miền tính và trả `unsupported` ngoài miền; không extrapolate.
  - [x] 2.6 Chốt bảng Tam Tai theo 12 Chi năm sinh và năm xem; phân biệt năm đầu/giữa/cuối với mức độ diễn giải chưa được kiểm chứng.
  - [x] 2.7 Chốt ma trận mục đích–vai trò: xem chung, cưới hỏi, động thổ/xây dựng, khai trương/đầu tư; không suy vai trò từ giới tính/tên tài khoản, không tính cả cặp với một hồ sơ.
  - [x] 2.8 Chốt trạng thái cho mua xe, mua/sửa nhà, nhập trạch và nghi thức chưa được nguồn xác nhận; không trình bày “không phạm” thay cho “không xét”.
  - [x] 2.9 Soạn fixture kỳ vọng độc lập và tiêu chí nghiệm thu kèm nguồn, đủ chín số dư Kim Lâu, miền Hoang Ốc và 12×12 tổ hợp Tam Tai; chốt các quyết định chặn P1 trước task 3.0.

- [x] 3.0 Triển khai module hạn năm đã kiểm chứng (P1): hàm thuần, kết quả có lý do và ID quy tắc, validation và fixture độc lập; hạn năm không thay đổi nhãn đánh giá ngày.
  - [x] 3.1 Đồng bộ nguồn/miền/policy và tăng version các rule annual trong registry theo PRD 2.0, cập nhật test readiness; chỉ đổi verified trong phạm vi bằng chứng đã ghi. Sau đó tạo kiểu trong `annual/types.ts`; các hàm không phụ thuộc React/Firebase và không gọi dịch vụ bên ngoài.
  - [x] 3.2 Tạo `annual/context.ts` để validate ngày, quy đổi năm âm và tính tuổi mụ; thêm test trước/đúng Tết, sinh trước Tết, ngày xem trước sinh và biên năm hỗ trợ.
  - [x] 3.3 Tạo `kimLau.ts` và test số dư/loại hạn, đặc biệt tuổi 19/28; giữ phép tính tách khỏi quyết định áp dụng cho mục đích.
  - [x] 3.4 Tạo `hoangOc.ts` theo bảng/công thức đã verified; test mốc 10–60, 19→20, 59→60, 69→70 và miền tuổi ngoài hỗ trợ.
  - [x] 3.5 Tạo `tamTai.ts`; test đủ 12 Chi tuổi ×12 Chi năm, đúng thứ tự đầu/giữa/cuối và không tự thêm mức độ chưa có nguồn.
  - [x] 3.6 Tạo hàm gom `annual/index.ts`: áp dụng ma trận purpose/role, trả trạng thái/lý do từng hạn; thiếu hồ sơ người cần xét không tự dùng hồ sơ bản thân thay thế.
  - [x] 3.7 Thêm `annual.fixtures.ts` có provenance và test tích hợp: cùng năm âm/cùng hồ sơ có cùng hạn dù ngày xem đổi; hạn năm không can thiệp module đánh giá ngày MVP.
  - [x] 3.8 Nếu cần cache, khóa theo ngày/hồ sơ/ngữ cảnh tài khoản/purpose/role/ruleset version, xử lý invalidation; không persist kết quả dẫn xuất hoặc log ngày sinh. Quyết định P1: không cần cache; evaluator không có state, storage hoặc logging.
  - [x] 3.9 Chạy unit test module, typecheck/lint cho thay đổi; xác nhận không có quy tắc pending chạy và không có dữ liệu sai bị trả thành “không phạm”.

- [x] 4.0 Tích hợp hạn năm vào khối Phong thủy cá nhân (P1): chọn mục đích/vai trò, hiển thị riêng theo năm và đồng bộ lưu trữ/JSON; giữ một hồ sơ và xử lý đúng dữ liệu thiếu hoặc cũ.
  - [x] 4.1 Kiểm tra điều kiện 0.3: dùng `PersonalFengShuiPanel` từ MVP đã hoàn tất; giữ thẻ ngày → sự kiện → khối cá nhân → Lịch vạn niên và hai công tắc độc lập theo PRD MVP.
  - [x] 4.2 Thêm `AnnualFengShuiSection` có chọn mục đích/vai trò và hiển thị năm âm/tuổi mụ, kết quả/lý do từng hạn; không tự chọn vai trò cô dâu/gia chủ theo tài khoản.
  - [x] 4.3 Thêm trạng thái chưa nhập, dữ liệu sai, không áp dụng, chưa đủ dữ liệu và chưa hỗ trợ; liên kết sửa thông tin sinh trong Cài đặt, không yêu cầu giờ/nơi sinh cho hạn năm.
  - [x] 4.4 Quyết định và ghi trong PRD những lựa chọn purpose/role cần lưu; nếu lưu, cập nhật `Settings`, mặc định, sanitize JSON, repository và sync tương thích dữ liệu cũ.
  - [x] 4.5 Cập nhật tính toán khi lưu/sync hồ sơ, thay ngày, mục đích/vai trò, phiên bản hoặc tài khoản; dữ liệu chưa lưu không được dùng, xóa sinh/đăng xuất không còn kết quả cũ.
  - [x] 4.6 Thêm giải thích nguồn/phiên bản và phân biệt hạn năm với hoàng đạo chung/đánh giá ngày; nội dung không hứa kết quả sức khỏe/tài chính, không thêm nghi thức hóa giải.
  - [x] 4.7 Dùng scale/theme hiện có, nhãn chữ kèm màu, vùng bấm 44px, bàn phím/đọc màn hình; hỗ trợ 360px và ba cỡ chữ mà không tràn ngang.
  - [x] 4.8 Thêm component test cho thứ tự khối, đổi purpose/role, hồ sơ thiếu/xóa và không đổi nhãn ngày; thêm E2E luồng P1 và test JSON/repository nếu có trường persist mới.

- [ ] 5.0 Đặc tả và triển khai thần sát cá nhân đủ căn cứ (P2, có điều kiện): xác minh Can xung, Thái Tuế/Tuế Phá, Tam Sát và Sát Chủ; không nhân đôi Thụ Tử chung hoặc ghi đè bảng sao hiện tại bằng bảng chưa kiểm chứng.
  - [ ] 5.1 Dựa audit 1.0, liệt kê quy tắc verified có đầu vào thực sự cá nhân; ghi phần chưa đủ nguồn và hoãn nó, không cản P3.
  - [ ] 5.2 Với quy tắc verified, tạo `prd-personal-feng-shui-stars.md` chốt scope năm/tháng/ngày, tháng âm/tiết khí, mục đích, toán hạng, nhãn và cách xử lý tháng nhuận.
  - [ ] 5.3 Chốt quan hệ với Can hợp/khắc MVP và phép tổng hợp ngày mới; nếu thay kết luận MVP, version quy tắc và cập nhật PRD/fixture minh bạch trước khi viết mã. Không gộp vào boolean `isHarmfulToUser`.
  - [ ] 5.4 Soạn fixture độc lập theo từng quy tắc verified, gồm cùng ngày với tuổi khác và dữ liệu không đủ; trường hợp cùng Chi không mặc định đổi thành Thái Tuế.
  - [ ] 5.5 Tạo logic `stars.ts`/test theo scope đã chốt, validate Can Chi hợp lệ trong 60 Hoa Giáp và tháng hợp lệ; không copy nguyên `FengShuiUtils` attachment.
  - [ ] 5.6 Tích hợp giải thích cá nhân riêng trong panel; tái sử dụng Thụ Tử chung, tránh đếm đôi Sát Chủ hoặc âm thầm ghi đè bảng sao hiện tại.
  - [ ] 5.7 Chạy test phân lớp/scope/version và regression sao chung; ghi danh sách phần P2 có thể phát hành và phần vẫn pending. Chỉ đánh dấu 5.0 hoàn tất khi phạm vi đã chốt thực sự nghiệm thu, không vì bị hoãn.

- [ ] 6.0 Hoàn thiện PRD và lựa chọn nền tảng thời gian sinh (P3): chốt nơi sinh, múi giờ lịch sử, UTC/TST, thời điểm giao tiết, quy ước giờ Tý và bất định; benchmark engine/fixture, giấy phép, dung lượng và offline trước khi chọn phương pháp.
  - [ ] 6.1 Tạo `prd-birth-time-normalization.md`, chốt vùng/năm hỗ trợ; đề xuất ngày sinh dương trước, nơi sinh Việt Nam trước; chỉ thêm nhập ngày âm khi có quy ước lịch và tháng nhuận được xác nhận.
  - [ ] 6.2 Chốt schema ngày/giờ hành chính, giờ chính xác/ước lượng, tọa độ/nguồn tọa độ, múi giờ, offset được xác nhận và khoảng bất định; không suy nơi sinh từ vị trí thiết bị.
  - [ ] 6.3 Chốt nguồn timezone phiên bản cố định, chính sách miền Bắc/Nam/lịch sử trước 1970, thiếu dữ liệu, gap/overlap và xác nhận offset; không hardcode mốc attachment hoặc dựa duy nhất vào `Intl`.
  - [ ] 6.4 Định nghĩa pipeline và time scales: hành chính → UTC instant; instant dùng so giao tiết; TST dùng phân giải ngày/giờ luận trụ; không biến TST thành instant mới hoặc hiệu chỉnh hai lần.
  - [ ] 6.5 Chốt định nghĩa EoT/TST, dấu kinh độ, đơn vị, ngày sau hiệu chỉnh và metadata; tách sai số engine khỏi độ chắc chắn giờ/tọa độ đầu vào.
  - [ ] 6.6 Chốt 12 tiết mở tháng từ 315° theo bước 30°, Thanh Minh 15°; so thời điểm địa tâm biểu kiến theo nguồn đã chọn, không dùng tiết khí cuối ngày hoặc tháng âm cho trụ năm/tháng.
  - [ ] 6.7 Chốt default và bảng quyết định `splitZi`/`dayStartsAt23`; output có ngày tính trụ ngày, ngày tính Can giờ, Chi giờ và policy cho đủ 24h; reject enum sai, không cố định Canh Tý.
  - [ ] 6.8 Định nghĩa chế độ thiếu dữ liệu/bất định: không tự điền giờ 12h; khoảng cắt qua Chi giờ/giao tiết trả ứng viên hoặc chưa xác định; ghi cách hiển thị và giới hạn số ứng viên.
  - [ ] 6.9 Tạo dữ liệu benchmark tham chiếu có cấu hình NOAA/JPL/tzdb, tọa độ, UTC/UT1/TT phù hợp và nguồn; profile thử giả, fixture độc lập với hàm sản xuất.
  - [ ] 6.10 So sánh phương pháp/engine: mục tiêu ≤30 giây cho TST và instant giao tiết trên ma trận đã chốt, giấy phép, khả năng tái lập, dung lượng và offline; ghi kết quả từng ca vào `bazi-engine-evaluation.md`.
  - [ ] 6.11 Chọn phương pháp đạt yêu cầu hoặc sửa yêu cầu với bằng chứng nếu chưa đạt; chốt nguồn dữ liệu/phiên bản, cách build/cache và các quyết định chặn P3 trước task 7.0. Không gọi JPL live bằng thông tin sinh thật.

- [ ] 7.0 Triển khai hồ sơ sinh mở rộng và module Tứ Trụ (P3): migration tương thích ngược, chuẩn hóa thời gian, giao tiết theo instant và bốn trụ; chỉ xuất kết quả khi đủ dữ liệu và thể hiện rõ các trường hợp không chắc chắn.
  - [ ] 7.1 Thêm schema metadata theo PRD 6.0 vào `Settings`/kiểu dùng chung, giữ `birthDate`/`birthTime`; quy định `null`/thiếu trường và xóa liên đới nơi sinh/offset/uncertainty khi người dùng xóa toàn hồ sơ.
  - [ ] 7.2 Cập nhật local/cloud, migration nếu cần, mặc định, sanitize/JSON và chuyển local lên cloud; giữ chính sách không ghi đè hồ sơ cloud đã lưu, không persist lá số dẫn xuất.
  - [ ] 7.3 Mở rộng `BirthInfoForm` để nhập nơi sinh/giờ ước lượng/offset hoặc policy khi cần; giữ luồng Google chỉ điền ngày sinh, không tự suy metadata mới.
  - [ ] 7.4 Tạo `shared/bazi/validation.ts` và `birthTime.ts`: wall time → một/nhiều UTC instant theo timezone version; kiểm tra năm, tọa độ, offset, gap/overlap và nguồn dữ liệu lịch sử.
  - [ ] 7.5 Tạo `solarTime.ts` theo engine đã chọn, trả độ lệch kinh độ/EoT/TST có ngày và uncertainty; test offset lẻ/DST, năm nhuận, đổi ngày và tính bất biến khi đổi cách biểu diễn cùng instant.
  - [ ] 7.6 Tạo `termInstants.ts` theo thời điểm chính xác và dữ liệu/engine đã chọn; nếu cần, bổ sung script sinh bảng có version và provenance. Test Lập Xuân/các tiết mở tháng trước–đúng–sau mốc, vòng 345°→0°→15°.
  - [ ] 7.7 Tạo `ziPolicy.ts` cho đủ giờ trong ngày, cả hai policy; test biên 22:59/23:00/23:59/00:00/00:59/01:00 trên TST, ngày tính trụ ngày và ngày tính Can giờ trả riêng.
  - [ ] 7.8 Tạo `pillars.ts`: trụ năm/tháng theo instant và tiết đã chốt, trụ ngày/giờ theo TST/policy; dùng thuật toán Can Chi có fixture kiểm chứng, test Can giờ Tý cho đủ 10 Can ngày.
  - [ ] 7.9 Gom pipeline trong `shared/bazi/index.ts`, version toàn engine/data/policy; propagate thiếu dữ liệu/ứng viên, không chọn lá số duy nhất khi khoảng đầu vào cắt mốc; invalidate cache theo hồ sơ/tài khoản/version.
  - [ ] 7.10 Thêm `BaziSection`: bốn trụ, giờ hành chính/TST, hiệu chỉnh, nguồn, policy và giới hạn; dữ liệu thiếu có nút bổ sung hồ sơ, không ảnh hưởng MVP/hạn năm.
  - [ ] 7.11 Đóng gói/cache engine và dữ liệu cần dùng offline sau lần tải; không lưu hồ sơ cá nhân vào service worker cache công khai, SEO/prerender hoặc telemetry.
  - [ ] 7.12 Thêm unit/component/JSON/repository/E2E cho hồ sơ mới, xóa/sync/đổi tài khoản, DST và bất định; chạy kiểm tra kiểu/lint/build và benchmark regression trước nghiệm thu P3.

- [ ] 8.0 Kiểm thử, nghiệm thu và chuẩn bị phát hành từng lớp độc lập (P1/P2/P3): kiểm tra fixture, biên thời gian, local/cloud/JSON, riêng tư, offline, mobile/a11y và regression lịch chung; chỉ mở UI cho lớp đạt điều kiện nghiệm thu.
  - [ ] 8.1 Lập `feng-shui-release-checklist.md` chia P1/P2/P3, liên kết PRD, ruleset/engine version, nguồn/fixture, trường hợp chưa hỗ trợ và bằng chứng nghiệm thu từng lớp.
  - [ ] 8.2 Chạy unit/fixture theo phạm vi thực tế: ma trận hạn năm, mục đích/vai trò, phân lớp sao/ngày/năm, múi giờ lịch sử/gap/overlap, TST/giao tiết/giờ Tý và uncertainty.
  - [ ] 8.3 Chạy `npm run test:emulator` cho thay đổi repository/rules; xác nhận tài khoản khác không đọc/ghi hồ sơ, offline/sync và JSON cũ/mới không mất dữ liệu hoặc giữ kết quả hồ sơ trước.
  - [ ] 8.4 Chạy Playwright desktop/mobile cho luồng đã đổi; kiểm tra sáng/tối, ba cỡ chữ, 360px, bàn phím/đọc màn hình/dialog và axe; kiểm tra Safari/iPhone cho nền tảng thời gian/offline khi hỗ trợ.
  - [ ] 8.5 Kiểm tra không có ngày/giờ/nơi sinh hoặc kết quả trong URL, analytics/session replay, log, SEO/prerender, cache công khai hay request luận giải bên ngoài; cập nhật mô tả chính sách dữ liệu nếu cần.
  - [ ] 8.6 Chạy regression âm lịch, Can Chi, tiết khí theo ngày, sao/giờ chung và đánh giá ngày MVP; không cập nhật fixture cũ chỉ để hợp với kết quả mới sai quy ước.
  - [ ] 8.7 Ghi thời gian tính, bundle và benchmark sai số trên môi trường xác định; kiểm tra offline với dữ liệu đã tải, nêu rõ độ chính xác engine và độ chắc chắn hồ sơ là hai tiêu chí khác nhau.
  - [ ] 8.8 Chạy các check dự án phù hợp (`typecheck`, `lint`, `format:check`, `build`, unit/E2E), sửa lỗi trong phạm vi và ghi limitation thực tế; chỉ mở UI lớp có đủ nguồn và đạt nghiệm thu.
  - [ ] 8.9 Cập nhật README/hướng dẫn về tính năng đã đạt, phạm vi và dữ liệu hồ sơ; chuẩn bị bản thay đổi có thể review, không tự deploy production hoặc mở P4 chưa đặc tả.

- [ ] 9.0 Đặc tả Nhật chủ, Thập thần và Dụng thần sau nền tảng Tứ Trụ (P4): chốt trường phái, nguồn, tàng can/vượng suy, cách xét ngày giờ và fixture; tạo PRD/task riêng trước khi triển khai luận giải.
  - [ ] 9.1 Xác nhận nền tảng Tứ Trụ đạt nghiệm thu và đọc các output/uncertainty/version hiện có trước khi thiết kế lớp luận giải.
  - [ ] 9.2 Chốt nguồn/trường phái cho Nhật chủ, âm dương Can, Thập thần, tàng can, vượng/suy và Dụng thần; phân biệt điều có thể tính bằng bảng với điều còn phụ thuộc phương pháp.
  - [ ] 9.3 Tạo `prd-bazi-interpretation.md` với input/output từng lớp, yêu cầu đủ dữ liệu, quan hệ ngày/giờ xem với Nhật chủ, lý do/nguồn/version và ranh giới với nạp âm MVP.
  - [ ] 9.4 Đặc tả Thập thần bằng quan hệ có hướng và âm dương với Nhật chủ, fixture đủ tổ hợp; không tự gán cát/hung chỉ từ tên Thập thần.
  - [ ] 9.5 Đặc tả Dụng thần theo phương pháp xác nhận, tàng can/tháng tiết khí/vượng suy và các ngoại lệ; không xác định bằng đếm hành thiếu hoặc nạp âm năm sinh.
  - [ ] 9.6 Định nghĩa ứng xử khi có nhiều lá số ứng viên, phương pháp chưa đủ nguồn hoặc kết quả khác giữa trường phái; không trả kết luận chắc chắn từ đầu vào bất định.
  - [ ] 9.7 Soạn fixture độc lập có nguồn và tiêu chí nghiệm thu, sau đó tạo `tasks-bazi-interpretation.md` theo quy trình task áp dụng; dừng ở tài liệu/task, chưa viết mã luận giải P4.
