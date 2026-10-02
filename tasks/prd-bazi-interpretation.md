# PRD luận giải Bát Tự: Nhật chủ, Thập thần và Dụng thần

Phiên bản đặc tả: **1.2.0**  
Ngày chốt: **02/10/2026**  
Trạng thái: đủ để lập task P4; chưa cho phép mở UI hoặc triển khai kết luận Dụng thần.

## 1. Tổng quan

P3 đã chuẩn hóa giờ sinh và trả một hoặc nhiều lá số Tứ Trụ có version. P4 thêm lớp giải nghĩa có
thể truy vết trên từng lá số: xác định Nhật chủ, gán Thập thần cho Can lộ và tàng can, mô tả bằng
chứng mùa/vượng suy, rồi mới xét Dụng thần theo phương pháp đã chọn.

Mục tiêu là cho người dùng biết **kết quả được suy từ quan hệ nào** và mức chắc chắn của nó. Sản
phẩm không biến tên Thập thần thành dự báo tốt/xấu, không lấy nạp âm năm sinh làm Nhật chủ và không
chọn Dụng thần bằng cách đếm hành còn thiếu.

## 2. Quyết định phương pháp và nguồn

### 2.1 Trường phái

Phiên bản đầu dùng **Tử Bình, lấy Nhật can làm chủ và tháng lệnh làm trục**:

- Nhật chủ là Thiên can của trụ ngày trong từng candidate P3.
- Thập thần là quan hệ có hướng giữa Nhật chủ và một Thiên can khác, xét cả sinh/khắc và âm dương.
- Tàng can dùng bảng đóng, có thứ tự bản khí → trung khí → dư khí; không tự gán tỷ trọng phần trăm.
- Bằng chứng vượng/suy gồm được tháng lệnh, thông căn, Can lộ, sinh/trợ, tiết/khắc và hợp/xung đã
  được đặc tả. V1 không cộng các bằng chứng thành một điểm số phổ quát.
- Dụng thần theo cách đọc **tháng lệnh–cách cục** của *Tử Bình Chân Thuyên*: bắt đầu từ tàng can
  tháng lệnh, xét Can lộ/hội hợp và sự thành–bại/cứu ứng. “Dụng thần” ở đây không đồng nghĩa với
  một hành bù thiếu theo cách cân bằng số lượng.

Ba lớp phải version độc lập. Nhật chủ/Thập thần có thể phát hành khi đạt fixture dù Dụng thần còn
`unsupported`. Không trộn phương pháp phù ức, điều hậu hoặc thông quan vào kết quả tháng lệnh v1.

### 2.2 Nguồn chuẩn

| ID | Nguồn | Dùng cho |
| --- | --- | --- |
| `ditiansui-09` | [滴天髓/09](https://zh.wikisource.org/wiki/滴天髓/09) | Nhật chủ là trục để xét bảy chữ còn lại; phải xét thời lệnh và tương tác. |
| `sanming-07` | [三命通會/卷七](https://zh.wikisource.org/zh-hant/三命通會/卷七) | Quan hệ sinh/khắc có hướng và phân biệt chính/thiên theo âm dương. |
| `ditiansui-17` | [滴天髓/17](https://zh.wikisource.org/wiki/滴天髓/17) | Vai trò tháng lệnh, tàng can và khí đang dụng; không giản lược thành đếm hành. |
| `ziping-08-10` | [子平真詮, luận Dụng thần và biến hóa](https://libokang.com/zh-hant/guji/bazi/子平真詮原文/) | Phương pháp tháng lệnh–cách cục, Can lộ/hội hợp và biến hóa Dụng thần. |
| `p3-contract` | `prd-birth-time-normalization.md`, `shared/bazi/` | Tứ Trụ, uncertainty, zi policy và version đầu vào. |

Các văn bản cổ là nguồn của quy ước truyền thống, không phải bằng chứng khoa học về khả năng dự
báo. Bản dịch/diễn giải trong UI phải được review riêng và không thêm khẳng định sức khỏe, tiền bạc,
quan hệ hoặc sự kiện tương lai.

## 3. Mục tiêu

1. Xác định Nhật chủ và 100 quan hệ Can–Can Thập thần một cách tái lập.
2. Gắn Thập thần cho bảy Can lộ còn lại và mọi tàng can, giữ vị trí/provenance.
3. Trình bày bằng chứng mùa/vượng suy có cấu trúc, không dùng điểm số tùy ý.
4. Chỉ trả Dụng thần khi một nhánh quyết định tháng lệnh v1 đã được fixture và review; còn lại trả
   `unsupported` hoặc `indeterminate` cùng lý do.
5. Propagate đầy đủ nhiều candidate, version và uncertainty từ P3; không hợp nhất các kết quả khác
   nhau thành một kết luận chắc chắn.

## 4. User stories

- Là người đã nhập đủ hồ sơ sinh, tôi thấy Nhật chủ của từng lá số ứng viên và biết đó là Can ngày.
- Tôi có thể xem mỗi Can/ẩn Can quan hệ gì với Nhật chủ và vì sao có tên đó.
- Tôi thấy các dấu hiệu được mùa, có gốc, được sinh/trợ hoặc bị tiết/khắc dưới dạng bằng chứng, thay
  vì một con số không giải thích được.
- Nếu phương pháp chưa hỗ trợ lá số của tôi hoặc giờ sinh tạo nhiều kết quả, tôi thấy giới hạn rõ
  ràng và không nhận một Dụng thần giả chắc chắn.

## 5. Contract đầu vào/đầu ra

```ts
interface BaziInterpretationInput {
  baziResult: BaziResult // output trực tiếp của calculateBazi
  viewedAt?: string // ISO instant, chỉ dùng cho lớp quan hệ ngày/giờ xem riêng
}

type InterpretationStatus = 'ready' | 'ambiguous' | 'insufficientData' | 'unsupported'

interface InterpretationCandidate {
  sourceCandidateIndex: number
  dayMaster: StemEvidence
  visibleTenGods: TenGodPlacement[]
  hiddenStems: HiddenStemPlacement[]
  seasonalEvidence: StrengthEvidence[]
  usefulGod: UsefulGodResult
}
```

Input phải là output P3 nguyên vẹn, gồm `status`, candidates và `BAZI_VERSIONS`. Module không nhận
bốn chuỗi Can Chi rời không provenance. Output thêm:

- `interpretationRulesVersion`, `tenGodTableVersion`, `hiddenStemTableVersion`,
  `usefulGodMethodVersion`;
- `sourceIds`, `reasonCodes` và operands cho mọi phép gán;
- `sourceCandidateIndex`; tuyệt đối không gộp candidate chỉ vì cùng Nhật chủ;
- trạng thái tổng: `ready` chỉ khi mọi candidate có cùng kết luận ở lớp đang hiển thị;
- `ambiguous` khi candidate khác nhau về Nhật chủ/Thập thần/Dụng thần;
- `unsupported` khi nhánh phương pháp chưa có bảng quyết định đã duyệt.

Không persist output dẫn xuất. Cache trong bộ nhớ phải có key gồm toàn bộ candidate P3 và tất cả
version; đổi rules/engine/tzdb/zi policy phải làm cache miss.

## 6. Yêu cầu chức năng

### 6.1 Nhật chủ và thuộc tính Can

1. Hệ thống phải lấy Nhật chủ từ `candidate.pillars.day.can`.
2. Bảng Can cố định: Giáp/Ất=Mộc, Bính/Đinh=Hỏa, Mậu/Kỷ=Thổ, Canh/Tân=Kim, Nhâm/Quý=Thủy;
   chỉ số chẵn là Dương, lẻ là Âm theo index hiện có 0–9.
3. Output phải ghi rõ `sourcePillar: day`, tên Can, hành, âm dương và source/version.
4. Nạp âm của năm, ngày hoặc trụ không được dùng để thay Nhật chủ.

### 6.1a Thống kê ngũ hành 8 chữ (bổ sung v1.1.0, 02/10/2026)

Nguồn: `bazi_calculation_engine_spec.md` mục 3.1–3.2 và 5.1. Chỉ nhận phép đếm; không nhận mục 2.2
(ví dụ đầu ra sai với công thức JDN của chính tài liệu: 15/08/1990 là ngày Nhâm Tý, giờ Giáp Thìn),
còn mục 5.2–5.3 (trọng số và ngưỡng vượng suy) được sửa và nhận ở mục 6.4a.

1. Đếm 8 chữ: hành của 4 Can lộ và hành chính của 4 Chi theo `CHI_ELEMENTS`; tổng luôn bằng 8.
2. Trả số đếm, phần trăm (làm tròn 0,1) và vị trí từng chữ theo thứ tự Kim, Mộc, Thủy, Hỏa, Thổ;
   hành vắng trả 0.
3. Không cộng tàng can, không áp trọng số vị trí, không suy vượng/suy hoặc Dụng thần từ số đếm.
   UI phải ghi rõ đây là thống kê, không phải độ vượng suy.
4. Rule `interpretation.element-count@1.0.0`, Nhật chủ là `interpretation.day-master@1.0.0`.
   Điểm vượng suy là rule riêng `interpretation.strength-score`, xem mục 6.4a.

### 6.2 Ma trận Thập thần

Quan hệ luôn đọc từ **Nhật chủ → Can đang xét**:

| Quan hệ hành | Cùng âm dương | Khác âm dương |
| --- | --- | --- |
| Cùng hành | Tỷ Kiên | Kiếp Tài |
| Nhật chủ sinh Can kia | Thực Thần | Thương Quan |
| Nhật chủ khắc Can kia | Thiên Tài | Chính Tài |
| Can kia khắc Nhật chủ | Thất Sát (Thiên Quan) | Chính Quan |
| Can kia sinh Nhật chủ | Thiên Ấn | Chính Ấn |

5. Engine phải bao phủ đủ 10×10 tổ hợp, không suy tên từ bản dịch UI.
6. Mỗi Can lộ ở trụ năm/tháng/giờ được gắn đúng một Thập thần. Can ngày được ghi `dayMaster`,
   không lặp thành một badge Tỷ Kiên trong UI chính; API có thể trả quan hệ tự thân để kiểm thử.
7. Tên là mô tả quan hệ. V1 không gắn `good/bad`, điểm cát/hung hoặc dự báo từ tên Thập thần.
8. Nếu xét Can của ngày/giờ đang xem, phải tính từ cùng pipeline Can Chi có version và trả trong
   nhóm `transitRelations`; không sửa lá số gốc, không tự gọi đó là vận hạn.

### 6.3 Tàng can

V1 dùng bảng thứ tự sau, không gán tỷ trọng số:

| Chi | Tàng can (bản → trung → dư) |
| --- | --- |
| Tý | Quý |
| Sửu | Kỷ, Quý, Tân |
| Dần | Giáp, Bính, Mậu |
| Mão | Ất |
| Thìn | Mậu, Ất, Quý |
| Tỵ | Bính, Mậu, Canh |
| Ngọ | Đinh, Kỷ |
| Mùi | Kỷ, Đinh, Ất |
| Thân | Canh, Nhâm, Mậu |
| Dậu | Tân |
| Tuất | Mậu, Tân, Đinh |
| Hợi | Nhâm, Giáp |

9. Mỗi tàng can phải giữ `pillar`, `branch`, `rank: main|middle|residual` và Thập thần tương ứng.
10. Không diễn giải số ngày “dụng sự” thành trọng số nếu chưa có bảng instant và fixture độc lập.
11. Hợp/xung không tự xóa hoặc biến đổi tàng can. Mọi phép biến hóa phải là rule riêng có nguồn.

### 6.4 Bằng chứng vượng/suy

12. Lớp bằng chứng (evidence) trả danh sách thay vì gộp điểm; điểm trọng số chỉ có ở phương pháp
    riêng mục 6.4a và không thay thế danh sách này:
    `monthCommand`, `root`, `visibleSupport`, `generatedBy`, `drainedBy`, `controlledBy`,
    `controls`, `combinationOrClash`.
13. `monthCommand` lấy Chi tháng P3; không dùng tháng âm. “Có gốc” chỉ có khi tàng can cùng hành
    hoặc cùng Can theo rule đã version, kèm vị trí.
14. Không dùng vòng Trường Sinh như phép cộng điểm mặc định. Nếu bổ sung phải có PRD/version/fixture
    riêng và không đổi kết quả cũ âm thầm.
15. UI dùng ngôn ngữ “bằng chứng đang xét” cho lớp evidence. Nhãn “Thân Vượng/Thân Nhược” chỉ được
    hiện kèm tên phương pháp 6.4a và lưu ý đây là bản đơn giản.

### 6.4a Điểm vượng suy theo trọng số vị trí (bổ sung v1.2.0, 02/10/2026)

Phương pháp riêng `weighted-v1.0.0`, rule `interpretation.strength-score@1.0.0`, sửa từ
`bazi_calculation_engine_spec.md` mục 5.2–5.3:

| Lỗi trong tài liệu gốc | Cách sửa |
| --- | --- |
| Trọng số cộng 105% (40+15+12+12+10+10+6) | Chi tháng lấy **35** (trong khoảng 30–40 tài liệu cho), tổng đúng **100** |
| Chỉ cho khoảng điểm (“30–40”, “12–15”, “5–6”) | Chốt một giá trị: Chi tháng 35, Chi ngày 15, Can tháng 12, Can giờ 12, Chi giờ 10, Chi năm 10, Can năm 6 |
| Không nói Can ngày có trọng số không | Can ngày là Nhật Nguyên, **không** tính; chỉ 7 vị trí còn lại |
| Ngưỡng có nhánh “hoặc đắc Nguyệt Lệnh + có trợ lực” chưa định nghĩa | Bỏ nhánh đó; chỉ dùng ngưỡng điểm |

1. Mỗi vị trí lấy hành của Can, hoặc hành chính của Chi; không cộng tàng can.
2. Nhóm trợ lực = cùng hành Nhật Nguyên (Tỷ Kiên/Kiếp Tài) và hành sinh Nhật Nguyên (Ấn).
3. Điểm = tổng trọng số các vị trí thuộc nhóm trợ lực, 0–100. **≥ 50 là Thân Vượng**, dưới 50 là
   Thân Nhược (50 thuộc Thân Vượng, đúng chữ “≥ 50%” của tài liệu).
4. Output: `score`, `threshold`, `strength`, `supportElements`, `weightedScores` (tổng điểm theo
   hành, cộng 100) và `contributions` (vị trí, chữ, hành, trọng số, có trợ lực không).
5. Kết quả không dùng để chọn Dụng thần (mục 6.5) và không gắn dự báo tốt/xấu.
6. Fixture: ví dụ mục 2.2 của tài liệu (Bính, 37 điểm, Thân Nhược), ca 72 điểm và ca biên đúng 50;
   xem `shared/bazi/interpretation/strength.test.ts`.

### 6.5 Dụng thần tháng lệnh–cách cục

16. Resolver bắt đầu từ tàng can của Chi tháng, xét Can lộ và hội hợp theo bảng quyết định đã duyệt.
17. Mỗi nhánh phải ghi `pattern`, `selectedStemOrElement`, `supportingGods`, `adverseGods`,
    `evidence`, `sourcePassages`, `decisionRuleId` và version.
18. V1 chỉ trả `ready` cho nhánh có fixture độc lập và hai lượt review nội dung. Không khớp đúng
    một nhánh trả `unsupported`; nhiều nhánh cùng hợp lệ trả `indeterminate`.
19. Không chọn Dụng thần bằng số lượng hành, nạp âm năm sinh, một bảng tra Nhật chủ×tháng đơn lẻ,
    hoặc quy tắc “thân yếu thì sinh trợ/thân mạnh thì tiết khắc” chưa được đặc tả.
20. Không trộn thuật ngữ Dụng thần tháng lệnh với “hành cân bằng” trong UI. Nếu sau này hỗ trợ phù
    ức/điều hậu/thông quan, mỗi phương pháp là output/version riêng và không tự hợp nhất.

## 7. Bất định và khác biệt phương pháp

- `insufficientData` từ P3 được giữ nguyên; không lập Nhật chủ từ ngày sinh hành chính khi chưa có
  candidate chuẩn hóa.
- Với nhiều candidate, tính độc lập từng candidate. Nếu lớp đang xem giống hoàn toàn, UI có thể ghi
  “kết quả này không đổi giữa các khả năng” nhưng vẫn giữ danh sách nguồn.
- Nếu Nhật chủ hoặc kết luận khác nhau, trả `ambiguous`; người dùng chọn/xác nhận offset hoặc thu
  hẹp khoảng giờ ở hồ sơ, module không tự chọn.
- Khi nguồn cổ có nhiều cách đọc hoặc bản chú giải mâu thuẫn, rule giữ `unsupported` và ghi câu hỏi
  cần adjudication. Không lấy đa số website làm nguồn quyết định.
- Output phải phân biệt `inputUncertainty`, `methodCoverage` và `sourceConfidence`.

## 8. Quan hệ ngày/giờ đang xem

Ngày/giờ xem là lớp tùy chọn sau khi lá số gốc sẵn sàng:

1. Can ngày xem được gán Thập thần so với Nhật chủ cho từng candidate.
2. Can giờ xem chỉ được xét khi caller truyền instant/timezone/địa điểm đủ rõ; không dùng một “giờ
   hoàng đạo” chung làm Can giờ cá nhân.
3. Quan hệ này chỉ mô tả phép sinh/khắc/âm dương. Không tự suy tài chính, công danh, tình cảm, sức
   khỏe hoặc đổi summary tốt/xấu của ngày.
4. Nếu candidate có Nhật chủ khác nhau thì kết quả ngày/giờ xem là `ambiguous`.

## 9. UI, riêng tư và accessibility

- P4 nằm trong `BaziSection`, sau bốn trụ, dưới disclosure “Giải nghĩa Bát Tự”. Nhật chủ/Thập thần
  có thể mở riêng khi đạt gate; Dụng thần chỉ xuất hiện khi method coverage đạt.
- Mỗi nhãn có mô tả văn bản; không chỉ dùng màu/icon. Details nguồn hiển thị method/version và giới
  hạn. Thuật ngữ Trung–Việt có glossary ngắn.
- Không hiển thị câu dự đoán hay khuyến nghị quyết định quan trọng. Nội dung ghi rõ đây là quy ước
  văn hóa tham khảo.
- Không đưa ngày/giờ/nơi sinh, Tứ Trụ hay luận giải vào analytics, URL, SEO, prerender, log, session
  replay hoặc public service-worker cache. Không gọi dịch vụ luận giải ngoài.

## 10. Không thuộc phạm vi

- Đại vận, lưu niên, lưu nguyệt, lưu nhật ngoài quan hệ Can ngày/giờ mô tả ở mục 8.
- Cách cục đặc biệt, tòng cách, hóa cách, điều hậu, thông quan và thần sát Bát Tự chưa có decision
  table được duyệt.
- Dự báo sự kiện, bệnh tật, tài sản, hôn nhân, nghề nghiệp; chấm điểm hoặc xếp hạng con người.
- Ghép đôi hai hồ sơ, nhiều hồ sơ, chọn ngày tự động hoặc nghi thức hóa giải.
- Thay đổi phép tính Tứ Trụ P3, nạp âm MVP, hạn năm P1 hoặc summary lịch chung.

## 11. Fixture và tiêu chí nghiệm thu

Fixture chuẩn là `tasks/fixtures/bazi-interpretation.v1.json`, được viết từ bảng trong PRD trước mã
sản xuất. Tối thiểu phải có:

- ma trận 10 Nhật chủ × 10 Can khác;
- đủ 12 Chi và thứ tự 28 tàng can;
- Can ngày tự thân, Can lộ ở ba trụ còn lại và tàng can cùng tên nhưng khác vị trí;
- candidate cùng kết quả và candidate khác Nhật chủ;
- ca thiếu dữ liệu, version không hỗ trợ và nhánh Dụng thần ngoài coverage;
- ca ngày xem có đủ năm quan hệ hành và hai polarity;
- fixture Dụng thần riêng cho từng decision rule, gồm positive, near-miss và conflict.

Gate phát hành:

1. 100/100 quan hệ Thập thần và 12/12 bảng tàng can đạt test.
2. Không có `good/bad`, dự báo hoặc score phát sinh từ tên Thập thần.
3. Dụng thần không trả `ready` nếu thiếu decision rule đã review hoặc candidate mâu thuẫn.
4. Unit/component/E2E, typecheck/lint/format/build, mobile 360px/ba cỡ chữ/sáng tối/axe đạt.
5. Privacy/offline regression đạt; không tăng request runtime và không persist output.
6. Nội dung Dụng thần có hai review độc lập đối chiếu nguồn trước khi mở feature flag.

## 12. Chỉ số thành công

- 100% output có rule/source/version và reason có thể hiển thị.
- 0 trường hợp fixture bất định bị ép thành một kết luận.
- 0 request ngoài hoặc analytics field chứa dữ liệu hồ sơ/luận giải.
- Trong kiểm thử người dùng, ít nhất 90% người thử phân biệt được Nhật chủ với nạp âm và hiểu rằng
  tên Thập thần không tự mang nghĩa tốt/xấu.

## 13. Câu hỏi còn mở

Các câu hỏi sau **không chặn P4a Nhật chủ/Thập thần**, nhưng chặn rule Dụng thần tương ứng:

1. Ấn bản/chú giải nào là bản đối chiếu thứ hai cho từng nhánh thành–bại/cứu ứng?
2. Có đưa hợp hóa và tam hội/tam hợp vào v1 hay giữ `unsupported` đến PRD phụ?
3. Có cần mô hình “dụng sự theo ngày sau giao tiết” hay chỉ dùng thứ tự bản/trung/dư khí?
4. Ai là hai reviewer nội dung có quyền duyệt bảng quyết định Dụng thần?

