# PRD: Tùy chỉnh cỡ chữ và cỡ icon (calendar-hana)

## 1. Giới thiệu / Tổng quan

Chữ trong app hiện khá nhỏ: phần lớn nội dung dùng cỡ 12–15px (ô ngày âm lịch, chip sự kiện, nhãn giờ...), icon Phosphor đặt cỡ cố định 12–20px. Người lớn tuổi hoặc người mắt kém khó đọc, khó bấm trúng, và phải phóng to cả trình duyệt (làm vỡ bố cục) hoặc bỏ dùng app.

Tính năng này thêm **mục "Cỡ chữ"** trong tab Hiển thị của Cài đặt, gồm:

1. **Chọn cỡ chữ** — 3 mức: **Mặc định / Lớn / Rất lớn**. Một cài đặt duy nhất: khi tăng cỡ chữ thì **icon, nút bấm và khoảng cách cũng tăng theo** cùng tỉ lệ.
2. **Công tắc "Chữ đậm hơn"** — tăng độ đậm của chữ thường để dễ đọc hơn.
3. **Ô xem trước** — thấy ngay chữ và icon trông thế nào trước khi rời trang.

Cài đặt được **lưu theo tài khoản** (đồng bộ Firestore như các cài đặt khác), nên đăng nhập máy khác vẫn giữ cỡ chữ đã chọn.

**Mục tiêu:** Người lớn tuổi đọc được mọi chữ và bấm trúng mọi nút trong app mà không cần phóng to trình duyệt, và bố cục không bị vỡ ở bất kỳ mức nào.

## 2. Mục tiêu (Goals)

1. Ở mức "Rất lớn", chữ nhỏ nhất trong app (chữ âm lịch, nhãn phụ) **không dưới 16px**; chữ nội dung chính **không dưới 21px**.
2. Ở mức "Lớn" và "Rất lớn", mọi nút/icon bấm được có vùng bấm **tối thiểu 44×44px**.
3. Đổi mức cỡ chữ có hiệu lực **ngay lập tức** (dưới 100ms), không cần tải lại trang.
4. Mở app lần sau **không bị nháy** cỡ chữ mặc định rồi mới nhảy sang cỡ đã chọn.
5. Ở cả 3 mức, trên màn hình rộng 360px và 1280px: **không có thanh cuộn ngang**, không có chữ bị cắt mất hoặc đè lên nhau ở các màn chính (Tháng, Tuần, Ngày, Danh sách, form sự kiện, Cài đặt).
6. Không có lỗi WCAG AA (axe) ở cả chế độ sáng và tối, cả 3 mức.

## 3. User Stories

- **US-T1:** Là người lớn tuổi, tôi muốn **chọn cỡ chữ Lớn hoặc Rất lớn** để đọc được ngày âm lịch và tên sự kiện mà không cần kính lúp.
- **US-T2:** Là người lớn tuổi, tôi muốn **icon và nút to hơn theo chữ**, để bấm trúng mà không bấm nhầm nút bên cạnh.
- **US-T3:** Là người mắt kém, tôi muốn **bật chữ đậm hơn**, vì chữ mảnh trên nền kính mờ khó đọc.
- **US-T4:** Là người dùng, tôi muốn **xem trước** kết quả ngay trong trang Cài đặt, để chọn mức phù hợp mà không phải đi qua lại giữa các màn.
- **US-T5:** Là con cháu cài app cho bố mẹ, tôi muốn **chỉnh cỡ chữ một lần trên máy tính** và bố mẹ đăng nhập trên điện thoại vẫn thấy cỡ chữ đó.
- **US-T6:** Là người dùng thấy chữ vừa rồi, tôi muốn **quay về Mặc định** dễ dàng, giao diện giống hệt như trước khi có tính năng này.

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1 Dữ liệu cài đặt

1. Kiểu `Settings` trong `shared/types.ts` phải có thêm 2 trường:
   - `textSize: 'default' | 'large' | 'xlarge'` — mặc định `'default'`.
   - `boldText: boolean` — mặc định `false`.
2. Người dùng cũ (bản ghi Settings chưa có 2 trường này) phải được coi là `'default'` và `false`. Không được báo lỗi hay mất các cài đặt khác.
3. Hai trường này phải được lưu và đồng bộ theo cùng cơ chế với các cài đặt đang có (`theme`, `weekStartsOn`...): lưu local khi chưa đăng nhập, đồng bộ Firestore khi đã đăng nhập, dùng `updatedAt` để giải quyết xung đột.
4. Xuất/nhập dữ liệu (`src/data/exportImport.ts`) phải xuất 2 trường này và khi nhập phải kiểm tra giá trị hợp lệ. Giá trị lạ (ví dụ `textSize: 'huge'`) thì bỏ qua, giữ giá trị hiện tại.

### 4.2 Tỉ lệ phóng to

5. Mỗi mức ứng với một tỉ lệ áp dụng cho **chữ, icon, vùng bấm và khoảng cách giữa các phần tử**:

   | Mức | Tên hiển thị | Tỉ lệ |
   |---|---|---|
   | `default` | Mặc định | 1.0 (giữ nguyên như hiện tại) |
   | `large` | Lớn | 1.25 |
   | `xlarge` | Rất lớn | 1.5 |

6. Mức "Mặc định" phải cho giao diện **giống hệt** bản hiện tại (không lệch pixel nào so với trước khi làm tính năng).
7. Tất cả chữ trong app phải phóng to theo tỉ lệ, bao gồm: lưới Tháng/Tuần/Ngày, chữ âm lịch, chip sự kiện, khối lịch vạn niên, danh sách sự kiện, form tạo/sửa sự kiện, sidebar, thanh tab dưới đáy, trang Cài đặt, hộp thoại, thông báo (toast).
8. Tất cả icon (`@phosphor-icons/react`) phải phóng to theo cùng tỉ lệ. Không được còn icon nào đặt cỡ cố định không theo tỉ lệ.
9. Ở mức "Lớn" và "Rất lớn", mọi nút bấm, nút icon, ô chọn phải có vùng bấm tối thiểu 44×44px (có thể lớn hơn phần icon nhìn thấy).
10. Chữ nhập trong ô input trên điện thoại vẫn phải ≥ 16px ở mọi mức (giữ quy tắc hiện có để iOS không tự zoom).

### 4.3 Chữ đậm hơn

11. Khi bật `boldText`, chữ thường (weight 400) phải hiện đậm hơn (khoảng 500–600); chữ đã đậm (600–700) tăng thêm một bậc nhưng không quá 800.
12. `boldText` hoạt động độc lập với cỡ chữ: dùng được ở cả 3 mức.

### 4.4 Áp dụng lên giao diện

13. Hệ thống phải đặt thuộc tính trên thẻ `<html>` theo cài đặt, ví dụ `data-text-size="large"` và `data-bold-text`, tương tự cách `ThemeController` đang đặt `data-theme`. CSS dựa vào các thuộc tính này để phóng to.
14. Đổi mức phải có hiệu lực ngay, không tải lại trang, không mất nội dung đang nhập ở form.
15. Khi mở app, cỡ chữ đã chọn phải được áp dụng **trước lần vẽ đầu tiên** (không nháy cỡ mặc định). Vì Settings đọc từ IndexedDB/Firestore mất thời gian, hệ thống phải lưu thêm một bản sao nhỏ trong `localStorage` và đọc nó bằng script chạy sớm trong `index.html`. Nếu `localStorage` không dùng được (chế độ riêng tư) thì dùng mức mặc định, không được lỗi.
16. Khi Settings đồng bộ từ Firestore về có giá trị khác bản sao `localStorage`, giá trị từ Settings thắng và bản sao được cập nhật.

### 4.5 Bố cục ở cỡ chữ lớn

17. Lưới Tháng ở mức "Lớn" và "Rất lớn": **số ngày dương và âm luôn được ưu tiên** đọc được đủ. Khi ô ngày **không đủ chỗ** hiện chip sự kiện có chữ (thường là trên điện thoại):
    - Hệ thống phải **ẩn chữ của chip, chỉ hiện icon** của sự kiện (icon danh mục, hoặc chấm màu danh mục nếu sự kiện không có icon; icon âm lịch/lặp lại giữ nguyên nếu vừa).
    - Nếu vẫn không đủ chỗ cho hết icon thì hiện "+N" cho phần còn lại.
    - Khi ô đủ chỗ (ví dụ trên máy tính) thì vẫn hiện chip có chữ như bình thường.
    - Việc chọn hiện chữ hay chỉ icon phải dựa vào **kích thước thật của ô** (đo được), không dựa vào tên thiết bị. Bấm vào ô vẫn mở ngày/sự kiện như hiện tại.
    - Icon phải có `aria-label` / tooltip là tên sự kiện, để trình đọc màn hình và người dùng máy tính vẫn biết đó là sự kiện gì.
    - Không được đè lên ô bên cạnh.
18. Chữ dài (tên sự kiện, tên danh mục) phải xuống dòng hoặc cắt bằng dấu "…", không được tràn ra ngoài khung.
19. Thanh tab dưới đáy (điện thoại):
    - Khi đủ chỗ thì hiện cả icon và nhãn như hiện tại.
    - Khi **không đủ chỗ** cho cả icon và nhãn (ví dụ màn 360px ở mức "Rất lớn") thì **ẩn nhãn, chỉ hiện icon**. Icon vẫn to theo tỉ lệ, vùng bấm ≥ 44×44px.
    - Việc ẩn nhãn phải dựa vào kích thước thật của thanh (đo được), không dựa vào tên thiết bị hay chỉ dựa vào mức cỡ chữ.
    - Khi ẩn nhãn, mỗi tab vẫn phải có `aria-label` là tên tab để trình đọc màn hình đọc được. Tab đang chọn vẫn phải nhìn ra được (màu nhấn / nền) mà không cần nhãn.
    - Không được cắt nửa chữ hay để nhãn xuống 2 dòng làm thanh cao lên.
19a. Thanh tab Cài đặt (cuộn ngang trên điện thoại) giữ cả icon và nhãn, vì thanh này cuộn được; icon không bị che.
20. Không được có thanh cuộn ngang toàn trang ở bất kỳ mức nào.

### 4.6 Mục "Cỡ chữ" trong tab Hiển thị

21. Cỡ chữ là **mục con cuối tab "Hiển thị"** trong Cài đặt (`src/pages/Settings/SettingsPage.tsx`), không phải tab riêng:
    - Tiêu đề mục: "Cỡ chữ" (`<h3 id="text-size">`), tách khỏi các dòng phía trên bằng vạch kẻ.
    - Link `/settings#text-size` mở tab "Hiển thị" và cuộn tới mục này.
    - Hiện cả trên điện thoại và máy tính.
22. Mục gồm, theo thứ tự từ trên xuống:
    1. **Ô xem trước** (xem 4.7).
    2. **Chọn cỡ chữ**: segmented control 3 lựa chọn "Mặc định / Lớn / Rất lớn". Mỗi lựa chọn hiện chữ "A" với cỡ tương ứng để người dùng nhìn là hiểu. Dùng đúng component segmented control đang có trong app.
    3. **Công tắc "Chữ đậm hơn"** kèm dòng mô tả ngắn: "Làm chữ dày hơn để dễ đọc trên nền kính mờ."
    4. **Nút "Đặt lại mặc định"**: đưa về `default` + tắt chữ đậm. Chỉ hiện khi đang khác mặc định.
23. Chọn một mức là lưu ngay (không có nút "Lưu"), giống các cài đặt khác trong app.
24. Segmented control phải dùng được bằng bàn phím (phím mũi tên chuyển lựa chọn) và trình đọc màn hình đọc được tên mức đang chọn.

### 4.7 Ô xem trước

25. Ô xem trước phải mô phỏng thật một phần giao diện, dùng chính component/CSS của app (không phải ảnh chụp), gồm:
    - Một ô ngày kiểu lưới Tháng: số ngày dương + ngày âm (ví dụ "26" và "15/8").
    - Một chip sự kiện có icon (ví dụ "Giỗ ông nội" với icon mặt trăng âm lịch).
    - Một dòng chữ nội dung thường và một nút có icon.
26. Ô xem trước cập nhật ngay khi đổi mức hoặc bật/tắt chữ đậm.
27. Ô xem trước chỉ để xem, bấm vào không làm gì (không mở sự kiện, không điều hướng).

## 5. Ngoài phạm vi (Non-Goals)

- **Không** có thanh trượt tự do hay nhập tỉ lệ tùy ý — chỉ 3 mức.
- **Không** có cài đặt riêng cho cỡ icon — icon luôn theo cỡ chữ.
- **Không** làm chế độ tương phản cao, đổi màu, hay đổi font chữ.
- **Không** tự đọc cỡ chữ của hệ điều hành / trình duyệt để chọn mức mặc định, kể cả lần đầu mở app.
- **Không** thêm phím tắt đổi cỡ chữ. `Ctrl +` / `Ctrl -` (hoặc `⌘ +` / `⌘ -`) để nguyên cho trình duyệt phóng to trang như bình thường; app không chặn các phím này.
- **Không** gợi ý bật cỡ chữ lớn khi mở app lần đầu.
- **Không** đổi cỡ chữ của thông báo đẩy (push notification) — đó là do hệ điều hành hiển thị.
- **Không** đổi cỡ chữ trong file ICS/CSV xuất ra hay trang prerender cho SEO.

## 6. Thiết kế (Design Considerations)

- Giữ phong cách kính mờ kiểu iOS hiện tại (`src/styles/theme.css`). Tab mới dùng lại các class/component đang có: `glass`, segmented control, switch, nút viên thuốc.
- Ô xem trước đặt trong một card `--radius-lg`, nền `--glass`, có nhãn nhỏ "Xem trước" ở góc.
- Ở mức "Rất lớn", ưu tiên **đọc được** hơn **nhét được nhiều**: chấp nhận hiện ít sự kiện hơn mỗi ô, xuống dòng nhiều hơn.
- Kiểm tra cả chế độ sáng và tối: chữ đậm trên nền kính tối không được bị nhòe.
- Mức "Mặc định" không được thay đổi gì về giao diện so với hiện tại.

## 7. Kỹ thuật (Technical Considerations)

### 7.1 Hiện trạng cần biết

- Có ~118 chỗ `font-size` viết bằng `px` cố định trong CSS module và `theme.css` (phổ biến nhất: 13px, 14px, 12px).
- Icon Phosphor truyền `size={số}` cố định (12–28px) ở khoảng 20 file. Prop `size` đặt thẳng vào thuộc tính `width`/`height` của `<svg>`, nên **không** dùng được `calc()`/biến CSS ở đó.
- `ThemeController` (`src/components/ThemeController.tsx`) là mẫu để làm controller mới đặt thuộc tính trên `<html>`.
- Giá trị Settings mặc định nằm trong `src/data/defaultCategories.ts`.
- `firestore.rules` hiện không giới hạn các khóa của Settings, nhưng cần kiểm tra lại khi thêm trường.

### 7.2 Hướng làm gợi ý

1. **Biến tỉ lệ:** định nghĩa `--ui-scale` trong `theme.css`: `1` mặc định, `1.25` với `[data-text-size='large']`, `1.5` với `[data-text-size='xlarge']`.
2. **Chữ:** đổi các `font-size: Npx` thành `calc(Npx * var(--ui-scale))`. Ở mức 1 kết quả giống hệt, đảm bảo yêu cầu 6. Có thể viết script tìm-thay một lần rồi rà lại tay. Làm tương tự cho `padding`, `gap`, `min-height` của nút và ô, nhưng **không** cho viền 1px, bo góc, blur.
   - Không nên đổi cỡ chữ gốc của `<html>` (rem) vì app đang dùng px, đổi rem không có tác dụng và dễ làm lệch mức Mặc định.
3. **Icon:** hai cách, chọn một và dùng thống nhất:
   - (a) Hook `useUiScale()` đọc `textSize` từ Settings, trả tỉ lệ; icon truyền `size={Math.round(16 * scale)}`. Có thể gói thành component `<AppIcon icon={Plus} size={16} />`.
   - (b) Truyền `size="1em"` và đặt `font-size` cho phần tử cha bằng CSS có `calc(... * var(--ui-scale))`. Cách này không cần re-render React.
   - Gợi ý chọn (b) nếu được, vì cùng một cơ chế với chữ và không nháy khi mở app.
4. **Chữ đậm:** `[data-bold-text] { --weight-boost: 100 }` và dùng `font-weight: calc(400 + var(--weight-boost, 0))` ở các chỗ đặt `font-weight`; hoặc đơn giản quy tắc `:root[data-bold-text] body { font-weight: 500 }` cộng với ghi đè cho tiêu đề. Cần kiểm tra font đang dùng có sẵn độ đậm 500/600 không (font hệ thống iOS/Android thì có).
5. **Chống nháy khi mở app:** controller ghi `localStorage['hana:text-size']` và `['hana:bold-text']` mỗi khi Settings đổi. Một đoạn `<script>` inline nhỏ trong `<head>` của `index.html` đọc 2 khóa này (bọc `try/catch`) và đặt thuộc tính lên `<html>` trước khi CSS vẽ. Lưu ý service worker và CSP (nếu có) cho phép script inline này.
6. **Kiểm thử:**
   - Unit test: giá trị mặc định cho Settings cũ; xuất/nhập với giá trị hợp lệ và không hợp lệ; controller đặt đúng thuộc tính `<html>`.
   - Component test cho tab "Cỡ chữ": chọn mức thì gọi `save` đúng; nút "Đặt lại mặc định" ẩn/hiện đúng; điều khiển bằng phím mũi tên.
   - E2E (Playwright): chọn "Rất lớn" ở viewport 360px và 1280px, kiểm tra không có cuộn ngang (`document.documentElement.scrollWidth <= innerWidth`) trên các màn Tháng, Tuần, Ngày, Danh sách, form sự kiện; chạy axe ở cả 3 mức; tải lại trang vẫn giữ mức đã chọn; lưới Tháng ở 360px mức "Rất lớn" chỉ hiện icon sự kiện (không có chữ chip) và mỗi icon có `aria-label` là tên sự kiện; ở 1280px vẫn hiện chip có chữ; thanh tab dưới đáy ở 360px mức "Rất lớn" chỉ hiện icon, mỗi tab có `aria-label`, ở mức "Mặc định" vẫn hiện nhãn.
   - Chụp ảnh so sánh mức "Mặc định" trước/sau để chắc không lệch.

## 8. Đo lường thành công (Success Metrics)

1. Tất cả test ở mục 7.2.6 chạy xanh; không có lỗi axe nào mới.
2. Ảnh chụp mức "Mặc định" khớp với bản trước khi làm tính năng.
3. Thử với ít nhất 2 người lớn tuổi (trên 60): ở mức họ chọn, họ đọc được ngày âm và tên sự kiện trong lưới Tháng, và tạo được một sự kiện mà không bấm nhầm.
4. Sau 1 tháng: tỉ lệ người dùng chọn mức khác "Mặc định" (đếm từ Settings trên Firestore) — dùng để quyết định có cần thêm mức không.

## 9. Câu hỏi còn mở (Open Questions)

1. Mức "Rất lớn" chốt 1.5. Mức "Lớn" đặt 1.25 để các bước đều nhau — cần thử trên điện thoại thật, nếu thấy chưa hợp thì chỉnh lại.
