# PRD — Hạn năm theo mục đích (P1)

Phiên bản đặc tả: **1.0.0**, ngày **01/10/2026**. Task nguồn: **2.0** trong `tasks-personal-feng-shui-expansion.md`. Module thuần đã triển khai ở task 3; UI hạn năm đã triển khai ở task 4; bằng chứng và giới hạn nghiệm thu tại `tasks/validation-personal-feng-shui-task-4.md`.

## 1. Kết quả cần đạt

Người dùng xem Kim Lâu, Hoang Ốc và Tam Tai của **một hồ sơ bản thân đã lưu**, theo năm âm của ngày đang chọn, mục đích và vai trò họ xác nhận. Hiển thị trong phần “Hạn năm theo mục đích” của khối Phong thủy cá nhân, dưới sự kiện trong tab Ngày; hiển thị năm âm, tuổi mụ và từng kết quả có phép tính/nguồn.

Hạn năm không thay nhãn đánh giá ngày, giờ tốt cá nhân, hoàng đạo chung hoặc dữ liệu sự kiện. Không khóa tạo/sửa sự kiện. Đổi ngày trong cùng năm âm giữ kết quả năm nếu ngày xem không trước ngày sinh và hồ sơ/ngữ cảnh không đổi.

Không có kết luận chung “năm tốt/xấu”, điểm số, xếp hạng ba hạn, dự đoán sức khỏe/tài chính, nghi thức hóa giải, mượn tuổi, ghép đôi hoặc kết luận cho người chưa có hồ sơ. Không yêu cầu giờ/nơi sinh hoặc dùng Lập Xuân của Bát Tự.

## 2. Nguồn, quyết định và giới hạn kiểm chứng

Các attachment là tài liệu tham khảo. Chỉ các quy tắc dưới đây được chọn cho P1; chỉ dẫn nghi thức và lời khẳng định tác hại trong nguồn không phải yêu cầu sản phẩm.

| ID nguồn đặc tả | Định vị | Dùng cho |
| --- | --- | --- |
| `attachmentAnnual` | [Tài liệu người dùng](</Users/nghiepnguyen/Downloads/2. quy_t_c_h_n_phong_th_y.md>), mục 1, 2A–C, 3 | Đề xuất ban đầu; mốc Tết và vai trò được cụ thể hóa thành policy bên dưới. |
| `batTrachCourse` | Uông Sỹ Cần, *Phong thủy Bát Trạch*, bản rút gọn, Bài 7, trang in 47–48 / PDF 47–48, [PDF do website trung tâm công bố](https://tuvithuchanh.com/wp-content/uploads/2025/03/Phong-thuy-bat-trach-ban-rut-gon.pdf#page=47) | Đối chiếu số dư Kim Lâu và sáu mốc/cách đếm Hoang Ốc. Mục lục dùng số trang khác; định vị theo trang thực tế. |
| `khoiSuExtract` | *Phần thứ tư: Khởi sự*, II.1.a, trang in 2 / PDF 3, [bản PDF](https://www.tuviglobal.com/static/upload/books/demo/1352132109_khoi%20su_2.pdf#page=3) | Đối chiếu bốn nhóm Chi Tam Tai. Bản trích không ghi tác giả/ấn bản; không gán nguồn này cho một cổ thư cụ thể. |
| `localCalendar` | `shared/lunar/lunar.ts`, `canChi.ts`, `lunar.test.ts` | Quy đổi âm lịch UTC+7, chỉ số Chi, khoảng năm và các ngày Tết regression của app. |
| `annualSpec` | Tài liệu này, mục 3–8 | Miền tính, ma trận áp dụng và cách trình bày là quy ước sản phẩm có giới hạn. |

Hai PDF là văn bản trình bày phương pháp trực tiếp; không lấy search snippet hoặc lời dẫn “theo sách cổ” làm bằng chứng. Đối chiếu văn bản PDF ngày 01/10/2026; chưa xác minh ảnh in/ấn bản lịch sử. Bảng số được đối chiếu; không coi diễn giải văn hóa là dự đoán đã chứng minh hoặc quy tắc thống nhất mọi trường phái.

Nguồn Tam Tai nêu giới hạn theo nam giới khác attachment. P1 **chỉ sử dụng bảng Chi** của bản trích; việc cho xem thông tin chu kỳ của hồ sơ bản thân không phụ thuộc giới tính là policy sản phẩm. Không đưa khẳng định kiêng việc theo giới tính vào UI. Vai trò cô dâu/gia chủ/người đứng đầu lấy từ lựa chọn rõ ràng của người dùng, theo phạm vi đề xuất trong attachment; không tuyên bố ma trận đó là kết luận của cả hai PDF.

Kết thúc task 2, registry P0 giữ ba hạn `pending@1.0.0`. **Task 3 đã đồng bộ nguồn, miền tính và policy này: ba hạn và tuổi mụ ở version 1.1.0, thêm `annual.application-policy@1.0.0`; các mục này verified trong phạm vi mô tả.** Mỗi phép tính vẫn kiểm tra readiness trước khi chạy. Không mở gate chỉ vì có fixture; nếu cấu hình Tam Tai về pending do yêu cầu provenance đầy đủ hơn, trả riêng `unsupported/unverifiedRule`, không suy nguồn cổ hoặc tạo kết quả thay thế. Không dùng nguồn này để mở gate P2/P3.

## 3. Input và miền ngày

Contract dự kiến cho `annual/index.ts`, không thêm schema lưu trữ tại task này:

```ts
type AnnualPurpose = 'general' | 'wedding' | 'construction' | 'business'
  | 'carPurchase' | 'housePurchase' | 'repair' | 'moveIn' | 'ritual'
type AnnualRole = 'self' | 'bride' | 'owner' | 'principal' | 'other' | 'unspecified'

interface AnnualInput {
  viewDate: string // YYYY-MM-DD, ngày dương đang xem; không dùng timestamp
  birthDate?: string // hồ sơ bản thân đã lưu
  purpose: AnnualPurpose
  role: AnnualRole
}
```

- Kiểm tra ngày Gregorian thật, không để `Date` tự sửa 31/02; dùng parser hiện có. Mỗi ngày dương phải nằm trong **1900-01-01 … 2100-12-31**, inclusive. `solarToLunar` có vùng đệm nội bộ không có nghĩa public contract hỗ trợ 1899/2101.
- Năm âm đầu ra được phép là **1899** ở đầu miền ngày dương; không loại ngày 1900 hợp lệ chỉ vì năm âm là 1899. Tuổi mụ phát sinh từ miền ngày hợp lệ nằm trong **1–202**.
- `birthDate` lấy từ hồ sơ đã lưu; nhập liệu tương lai vẫn bị form hiện có từ chối. Module thuần không gọi thời gian hệ thống để đánh giá ngày xem; lịch cho phép xem ngày tương lai trong miền hỗ trợ.
- Thiếu/sai định dạng/ngày không tồn tại → `insufficientData` với reason cụ thể. Ngày hợp lệ nhưng ngoài miền → `unsupported/dateOutOfRange`. Ngày xem trước ngày sinh → `notApplicable/beforeBirth`; không tính tuổi âm/0 hoặc chuyển thành 1.
- Purpose/role ngoài enum → `unsupported/unknownContext`; không mặc định về general/self. Giờ sinh, nơi sinh và giới tính không phải operand.

## 4. Context năm và tuổi mụ

Quy đổi **riêng cả ngày sinh và ngày xem** bằng lịch Việt UTC+7 đang có. Lấy `birthLunar.year` và `viewLunar.year`; mốc năm là mùng 1 Tết. Tháng nhuận không đổi công thức. Chi năm dùng `yearCanChi(lunarYear).chi`, không lấy trực tiếp năm dương.

```text
nominalAge = viewLunarYear - birthLunarYear + 1
```

Ví dụ sinh 04/02/2000 (năm âm 1999): xem 16/02/2026 (năm âm 2025) có tuổi mụ 27; xem 17/02/2026 (năm âm 2026) có tuổi mụ 28. Đổi ngày qua Lập Xuân nhưng chưa qua Tết không tăng tuổi. Cùng năm âm không tăng tuổi vào sinh nhật dương.

## 5. Ba phép tính được chọn

### 5.1. Kim Lâu — `annual.kim-lau`

Tuổi mụ nguyên dương trong miền context; lấy **số dư `% 9`**. Bảng kỳ vọng:

| Số dư | `hit` | `kind` / nhãn |
| --- | --- | --- |
| 0, 2, 4, 5, 7 | false | `null` / Không phạm Kim Lâu |
| 1 | true | `than` / Kim Lâu Thân |
| 3 | true | `the` / Kim Lâu Thê |
| 6 | true | `tu` / Kim Lâu Tử |
| 8 | true | `suc` / Kim Lâu Súc |

Lưu tuổi mụ và số dư vào operands; không dùng mẹo cộng chữ số một lượt. Tuổi 19/28 đều dư 1; 53 dư 8; 94 dư 4. Tên loại là tên phân loại, không xuất lời dự đoán tác hại cho bản thân/vợ/con/tài sản.

### 5.2. Hoang Ốc — `annual.hoang-oc`

**Miền tuổi P1: 10–69 inclusive.** Tuổi 1–9, 70–202 trả `unsupported/ageOutOfRange` cho riêng Hoang Ốc, dù Kim Lâu/Tam Tai có thể có kết quả. Không suy tiếp chu kỳ thập niên hoặc mặc định tuổi nhỏ tốt.

Sáu mốc: 10→1, 20→2, 30→3, 40→4, 50→5, 60→6. Đếm mỗi tuổi lẻ thêm một cung theo vòng 1→2→3→4→5→6→1; **khởi lại tại mốc chục mới**. Với tuổi trong miền đã chọn:

```text
decade = floor(nominalAge / 10)   // 1..6
units = nominalAge % 10          // 0..9
palace = ((decade - 1 + units) % 6) + 1
```

| Cung | `palaceId` | Nhãn | `hit` |
| --- | --- | --- | --- |
| 1 | `nhatCat` | Nhất Cát | false |
| 2 | `nhiNghi` | Nhị Nghi | false |
| 3 | `tamDiaSat` | Tam Địa Sát | true |
| 4 | `tuTanTai` | Tứ Tấn Tài | false |
| 5 | `nguThoTu` | Ngũ Thọ Tử | true |
| 6 | `lucHoangOc` | Lục Hoang Ốc | true |

Nhãn “Hoang Ốc” của tính năng dùng thống nhất; giữ tên nguồn “Hoàng Ốc” trong provenance. Operands gồm tuổi, decade, units, palace. Giải thích bằng đường đếm; không hứa tài lộc hoặc dự đoán bệnh/chia ly từ tên cung. Fixture độc lập bao phủ **tất cả 60 tuổi**; 19→cung 4, 20→2, 59→2, 60→6, 69→3, 70→unsupported.

### 5.3. Tam Tai — `annual.tam-tai`

Nhận Chi năm sinh âm và Chi năm xem âm. Chỉ số theo `CHI`: Tý=0, Sửu=1, Dần=2, Mão=3, Thìn=4, Tỵ=5, Ngọ=6, Mùi=7, Thân=8, Dậu=9, Tuất=10, Hợi=11.

| Chi năm sinh | Chi năm xem theo thứ tự | `stage` |
| --- | --- | --- |
| Thân, Tý, Thìn | Dần, Mão, Thìn | 1, 2, 3 |
| Dần, Ngọ, Tuất | Thân, Dậu, Tuất | 1, 2, 3 |
| Tỵ, Dậu, Sửu | Hợi, Tý, Sửu | 1, 2, 3 |
| Hợi, Mão, Mùi | Tỵ, Ngọ, Mùi | 1, 2, 3 |

Ngoài ba Chi → `hit:false, stage:null`; trong bảng → `hit:true, stage:1|2|3`. Nhãn năm đầu/giữa/cuối chỉ nói vị trí chu kỳ; không gán “nặng nhất”, lời khuyên bắt đầu/dừng/kết thúc việc hay mức độ so với hạn khác. Bảng số ở fixture chứa 144 ô; 0 là không phạm, 1/2/3 là stage, không phải điểm rủi ro. Cấm nhận Chi không nguyên hoặc ngoài 0..11.

## 6. Ma trận mục đích–vai trò

`A` = có thể tính sau validation và gate registry; `N` = `notApplicable/purposeExcluded`, không tính; `I` = `insufficientData/targetRoleRequired`; `U` = `unsupported/purposeUnsupported`.

| Mục đích | Vai trò hồ sơ bản thân được xác nhận | Kim Lâu | Hoang Ốc | Tam Tai |
| --- | --- | --- | --- | --- |
| Xem chung `general` | `self` | N | N | A — thông tin chu kỳ cá nhân |
| Cưới hỏi `wedding` | `bride` | A | N | A — chỉ hồ sơ này |
| Cưới hỏi `wedding` | `self`, `other`, `unspecified` | I | N | A — chỉ hồ sơ này, không kết luận cặp đôi |
| Động thổ/xây mới `construction` | `owner` | A | A | A |
| Động thổ/xây mới `construction` | `self`, `other`, `unspecified` | I | I | I |
| Khai trương/đầu tư `business` | `principal` | N | N | A — thông tin chu kỳ |
| Khai trương/đầu tư `business` | `self`, `other`, `unspecified` | N | N | I |
| Mua xe, mua nhà, sửa nhà, nhập trạch, nghi thức | Mọi vai trò | U | U | U |

General chỉ nhận self; các vai trò chuyên biệt không thuộc mục đích đã chọn (ví dụ business/bride, wedding/owner, construction/principal) trả `unsupported/roleMismatch` cho cả yêu cầu. Khác với `other`, đây là tổ hợp enum mâu thuẫn. Đổi purpose trên UI đưa role về self ở general, unspecified ở mục đích khác; không giữ vai trò cũ.

`bride/owner/principal` là **vai trò của chính hồ sơ này**. Nếu người dùng muốn xét cô dâu/gia chủ/người đầu tư khác, chưa có hồ sơ của họ: không dùng ngày sinh bản thân thay; trả I cho các hạn cần đối tượng đó. Tam Tai ở cưới hỏi vẫn chỉ mô tả bản thân, ghi rõ “Chưa xét người còn lại”. Không hiện kết luận cho hai người.

Construction chỉ là động thổ/xây nhà mới. Mua nhà không đồng nghĩa xây mới; sửa chữa không tự coi là động thổ; nhập trạch không gộp vào construction. Với business, không khuyến nghị quyết định đầu tư từ Tam Tai. Nhãn N là “Không xét cho mục đích này”; nhãn U là “Chưa hỗ trợ mục đích này”, đều không phải “Không phạm”.

## 7. Output, trạng thái và gate

Trả context và **đủ ba mục**, theo thứ tự Kim Lâu → Hoang Ốc → Tam Tai; không bỏ mục không áp dụng. Mỗi mục có `ruleId`, `ruleVersion` (null nếu không tìm thấy quy tắc), `scope:'annual'`, `verificationStatus`, `sourceIds`, `status`, `reasonCode`, `reason` và operands đã biết. Output tổng có `specVersion`, purpose/role, `context.status`, view/birth lunarYear, nominalAge, yearChi khi context hợp lệ. Không trả rating ngày/năm.

Context được validate độc lập: kiểm tra viewDate rồi birthDate về thiếu/sai ngày, sau đó miền ngày và quan hệ trước sinh. Context hợp lệ có `status:'applies'`; context lỗi không có tuổi/năm/Chi dẫn xuất. `verificationStatus` của rule missing là null. Mỗi mục vẫn giải quyết theo thứ tự dưới đây, nên mục không xét không bị biến thành yêu cầu nhập ngày sinh chỉ vì context thiếu.

Contract kết quả là discriminated union:

```ts
type AnnualRuleResult =
  | { status: 'applies'; value: KimLauValue | HoangOcValue | TamTaiValue }
  | { status: 'notApplicable' | 'insufficientData' | 'unsupported'; value?: never }
// Cả hai nhánh còn có metadata, reasonCode và operands như mô tả trên.
// value của mỗi rule có kiểu riêng, luôn có hit:boolean.
```

Không có `hit:false`, palace, kind hoặc stage giả ở nhánh chưa tính. Bảng Tam Tai dùng 0 trong fixture phải được chuyển thành `stage:null` khi output, không xuất stage 0.

Thứ tự giải quyết một mục:

1. Enum/mục đích/vai trò mâu thuẫn hoặc purpose ngoài P1 → U. Với context không hợp lệ vẫn cho biết các mục N/U theo ma trận; không cần ngày sinh để nói “Không xét”.
2. Mục bị loại khỏi purpose → N.
3. Thiếu vai trò cần thiết → I; thiếu/sai ngày → I; ngày đúng nhưng ngoài miền → U; ngày xem trước sinh → N. Không xuất operands dẫn xuất khi context lỗi.
4. Miền tuổi riêng Hoang Ốc không đạt → U.
5. Registry readiness theo scope annual với **đầy đủ nhóm bắt buộc cho mục đó**: nominal-age + rule đó; policy mục 6 phải được version hóa trong registry hoặc metadata ruleset bắt buộc. Thiếu/pending/rejected/sai scope → U với `unverifiedRule/missingRule/rejectedRule/scopeMismatch`; không chạy hàm tính.
6. Đủ dữ liệu và readiness ready → `applies`, lúc này mới xuất `hit` và kết quả cụ thể.

Các mục độc lập: Hoang Ốc ngoài miền không làm mất Tam Tai; một rule pending không khiến cả section hiện “không phạm”. Không gom ba hạn thành boolean. Rule readiness cho một mục không chứng nhận cả P1.

## 8. UI, lưu trữ và riêng tư

- Mặc định **general/self**, trình bày năm âm và tuổi mụ nếu có; không cần form hồ sơ thứ hai.
- Purpose/role là state tạm của section; **P1 không persist**, không thêm Settings/Firestore/JSON migration. Đóng/mở section trong cùng mount có thể giữ; remount, đổi tài khoản hoặc xóa hồ sơ về mặc định. Không lưu kết quả dẫn xuất.
- Đổi ngày/sửa hoặc sync hồ sơ đã lưu/đổi purpose/role/ruleset → tính lại. Nếu cache, key gồm tài khoản, hồ sơ, năm âm, purpose/role, rule version; validation ngày trước sinh phải chạy trước lookup. Không cần cache ở bản đầu.
- Link sửa ngày sinh trong Cài đặt; thiếu giờ sinh vẫn tính được. Chỉ dùng hồ sơ đã lưu; xóa sinh/đăng xuất làm mất kết quả cũ ngay.
- Hiện chữ trạng thái kèm màu, nguồn và phiên bản trong giải thích. Ví dụ: “Tuổi mụ 28; 28 chia 9 dư 1; Kim Lâu Thân — theo quy tắc đang chọn”. Không thêm “bắt buộc tránh”.
- Không đưa ngày sinh, purpose/role hoặc kết quả hạn vào analytics, log công khai, SEO/prerender, URL chia sẻ hay dịch vụ ngoài. Giữ offline theo dữ liệu đóng gói.
- UI chỉ triển khai ở task 4, sau MVP; giữ font scale/theme, mobile 360px, bàn phím, đọc màn hình và vùng bấm 44px.

## 9. Fixture và nghiệm thu

Fixture: `tasks/fixtures/annual-feng-shui.v1.json`. Dữ liệu số ghi tĩnh, chưa import trong production; task 3 có thể chuyển nguyên expected sang `annual.fixtures.ts` và phải giữ provenance. Không gọi hàm sản xuất để sinh expected.

| Nhóm | Bao phủ / kỳ vọng |
| --- | --- |
| Kim Lâu | 9 số dư; thêm tuổi 19, 28, 53, 94; tên loại và hit khớp bảng. |
| Hoang Ốc | 60 tuổi 10–69, nhóm cung 1/2/4 không phạm; ngoài miền 1/9/70/202 unsupported. |
| Tam Tai | 12 hàng × 12 cột theo thứ tự CHI; mỗi hàng đúng ba năm; thứ tự stage 1/2/3 kể cả qua Hợi→Tý→Sửu. |
| Context | Trước/đúng Tết ở ngày xem và sinh; cùng năm âm; Lập Xuân không thay tuổi; trước ngày sinh; hai biên 1900/2100; âm năm 1899 hợp lệ; ngày sai/ngoài miền. |
| Ma trận | Mọi tổ hợp purpose/role theo mục 6; đặc biệt thiếu đối tượng, vai trò mâu thuẫn và cả năm mục đích chưa hỗ trợ. |
| Gate | Pending/rejected/missing/sai scope không có value; quy tắc độc lập vẫn giữ trạng thái riêng. |
| Phân lớp | Không sửa đánh giá ngày/giờ/lịch chung hoặc thao tác sự kiện; cùng năm âm có cùng hạn sau validation. |

Task 2 hoàn tất khi đặc tả và fixture được đóng, các quyết định miền tuổi/role/persistence đã rõ. Task 3 hoàn tất chỉ khi registry được đồng bộ và test engine thực sự chạy qua fixture này, unit/typecheck/lint đạt. Task 4 còn phụ thuộc MVP và kiểm thử UI; **đặc tả không chứng nhận engine hoặc UI đã đạt**.

Kiểm tra tại task 2, trước triển khai: JSON parse/cấu trúc và coverage đạt; 9 context hợp lệ khớp `solarToLunar`/`yearCanChi` hiện có. Regression registry/lịch âm: **165 test đạt / 16 file**; `git diff --check` đạt. Task 2 chỉ thay tài liệu/fixture.

## 10. Triển khai và nghiệm thu task 3

API `assessAnnualFengShui(input, definitions?)` tại `shared/personalFengShui/annual/index.ts` nhận dữ liệu runtime cần validation; `AnnualInput` là kiểu đầu vào hợp lệ cho caller. Trả context và đủ ba mục, metadata nguồn/phiên bản của mọi nhóm bắt buộc, reasonCode, operands và value có kiểu riêng. Tham số definitions là cấu hình quy tắc tin cậy, mặc định registry đóng gói; cấu hình sai metadata bị registry từ chối, không nhận cấu hình này từ hồ sơ người dùng.

Các hàm `calculateKimLau`, `calculateHoangOc`, `calculateTamTai` chỉ phân loại số học, không tự quyết định purpose/readiness. Operand sai hoặc ngoài miền gây RangeError; caller thông thường dùng evaluator để nhận trạng thái có lý do. `buildAnnualContext` validate view/birth date, miền ngày và trước sinh, rồi kiểm tra gate nominal-age trước khi quy đổi; gate lỗi không xuất tuổi/năm/Chi dẫn xuất.

Evaluator không có cache/state, không ghi storage hoặc log, không gọi dịch vụ bên ngoài. Fixture test tái sử dụng nguyên expected/provenance của task 2 qua `annual.fixtures.ts`, không được import vào code production. Không thay `shared/lunar/`, UI, Settings, dependency hoặc dữ liệu sự kiện. MVP cá nhân ngày/giờ chưa triển khai nên phân lớp được bảo đảm bằng module độc lập và regression lịch chung, chưa có test tích hợp UI MVP.

- TDD: test registry mới thất bại khi gate còn đóng; test module mới thất bại vì chưa có implementation; test nominal-age unavailable thất bại trước khi bổ sung gate. Sau triển khai/refactor, **360 test annual + 17 test registry đạt**.
- `npm test`: **879 test / 75 file đạt**; có cảnh báo jsdom `window.scrollTo` từ test UI hiện có.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`: đạt. Build vẫn có cảnh báo chunk lớn và tùy chọn PWA deprecated.
- `npm audit --audit-level=high`: chưa hoàn tất vì DNS `ENOTFOUND registry.npmjs.org`; không thay dependency.
- Chưa chạy Emulator/E2E vì không đổi UI, lưu trữ hoặc rules. Task 4 cần MVP và kiểm thử tích hợp riêng; chưa deploy.


## 10. Triển khai UI task 4

`AnnualFengShuiSection` nằm trong `PersonalFengShuiPanel` dưới phần đánh giá ngày/giờ. Hai lớp dùng evaluator riêng và không lưu kết quả dẫn xuất. Chọn purpose/role chỉ ở state tạm; đổi purpose đặt role về self cho general, unspecified cho các mục đích khác; xóa hồ sơ/đổi tài khoản/remount về general/self. Không tự xác nhận cô dâu/gia chủ/người đứng chính.

Không thêm trường persist cho purpose/role. Trường `Settings.showPersonalFengShui` thuộc MVP, mặc định true cho bản cũ, sanitize chỉ nhận boolean, độc lập với `showAuspicious`; dùng repository, JSON và sync hiện có. Migration giữ các cài đặt cloud đã có, bao gồm false, theo policy hiện tại. Link `/settings#birth-info` mở tab Tài khoản và focus ô ngày sinh.

Bằng chứng task 4: `tasks/validation-personal-feng-shui-task-4.md`. Hoàn thành triển khai không đồng nghĩa đã nghiệm thu phát hành hoặc deploy.
