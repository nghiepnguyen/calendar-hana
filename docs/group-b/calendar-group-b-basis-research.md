# Calendar Group B — source / calendar-basis research

Ngày nghiên cứu: 2026-10-08. Version: 3.1.0. **RESEARCH ONLY**.

Phase 1, Phase 2.1 calculation và Group A giữ nguyên trạng thái PASS đã khóa. Không chạy lại các audit đó, không gọi production để tạo expected. Không triển khai Group B, không tạo authoritative Golden. “Phase 3B” ở đây là tên lượt **source/basis resolution** theo yêu cầu mới; khác mục “Phase 3B — Vietnamese extensions” trong spec V3. Không làm Group C.

Đã đối chiếu toàn bộ bộ input được yêu cầu: Source Lock V3, Validation Spec V3, registry, extraction JSON/MD, fixture review, pending rules, Golden manifest và Group A implementation report. Các bảng symbolic cũ được giữ nguyên; báo cáo này giải quyết cách bind bảng vào thời gian, không extract lại để dựng bảng trùng production.

Authority trong lượt này: primary evidence > Source Lock V3 > Spec V3 > Patch 2.1 > original spec > frozen Golden > production. “PARTIAL” dưới đây áp dụng tiêu chuẩn mới, gồm cả boundary và dated evidence; không phủ nhận đã tìm được passage primary.

| Rule | Source Month Meaning | Runtime Basis | Boundary | Leap Policy | Day Operand | Alias | Independent Anchors | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nguyệt Phá | MONTH_JIAN_BRANCH, theo 節 | Proposed solar/Jie month branch; chưa admit API | Jie rõ; exact instant/civil D chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | DAY_BRANCH đối xung 月建 | 月破; 破日 tương đương operand; 大耗 là cùng vị trí có scope riêng | 0+/0−; MISSING | PARTIAL |
| Kiếp Sát | MONTH_JIAN_BRANCH, 正月 trong 月表 | Proposed solar/Jie month branch | Jie rõ; cutoff chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | DAY_BRANCH | 刼煞 / 劫煞, monthly variant | 0+/0−; MISSING | PARTIAL |
| Tai Sát | MONTH_JIAN_BRANCH; 月災煞 đã hiệu đính | Proposed solar/Jie month branch | Jie rõ; cutoff chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | DAY_BRANCH | 月災煞 / 天獄: có explicit identity; không tự nhập 天火/Phi Ma | 0+/0−; MISSING | PARTIAL |
| Nguyệt Sát | MONTH_JIAN_BRANCH; 月建三合 | Proposed solar/Jie month branch | Jie rõ; cutoff chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | DAY_BRANCH | 月煞 / 月殺 / 月虚 / 月虛 | 0+/0−; MISSING | PARTIAL |
| Nguyệt Đức | MONTH_JIAN_BRANCH; giải thích 三合 + 月表 riêng | Proposed solar/Jie month branch | Jie rõ; cutoff chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | DAY_STEM; direction là aspect riêng | 月徳 / 月德; không 月德合 | 0+/0−; MISSING | PARTIAL |
| Thiên Đức | MONTH_JIAN_BRANCH; 月表 + passage riêng | Proposed solar/Jie month branch | Jie rõ; cutoff chưa khóa | SOLAR_CONTEXT_UNAFFECTED¹ | 8 DAY_STEM + 4 TRIGRAM/DIRECTION; day matching bốn hàng unresolved | 天徳 / 天德; 天道 là direction aspect | 0+/0−; MISSING | PARTIAL |

¹ **INFERENCE từ basis đã xác định**, không phải câu trích riêng về 閏月: tháng theo Jie/Jian không nhận lunarMonth/leap làm operand. Nhuận không lặp/đẩy bảng theo số tháng âm. Nếu reviewer chọn lại một cách đọc lunar-month cho rule nào, leap policy cách đọc ấy là **UNRESOLVED**; không được chuyển sang SAME_AS_PREVIOUS/NEXT/OWN_MONTH_NUMBER. Kết luận này không tự khóa cutoff giao tiết.

## Cross-rule framework và giới hạn phạm vi

**SOURCE SAYS — 月建 khác 月將.** [卷十二 / 日躔過宮](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷12) kết luận: `月建視節氣斗杓也月將視中氣太陽也`. [月表正月](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷20) đặt 立春正月節 cạnh 月建寅 và sáu rule; 雨水正月中 được ghi riêng cho 月將亥. Các [tháng 2](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷21), [3](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷22), [4](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷23) lặp cấu trúc tương ứng Kinh Trập/Thanh Minh/Lập Hạ. Đây là bằng chứng riêng về sự hiện diện của từng rule trong 月表, không chỉ là diễn giải “正月 nghĩa là tháng âm 1”.

**SOURCE SAYS — phạm vi chung có điều kiện.** [卷四 / 建除十二神](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷04) ghi giao 節 và 起建 từ 月建; đoạn mở đầu 建除十二神所合叢辰 quy định `凡月神之以十二辰起例者…今一以建除統之`. Áp dụng đoạn này cho bốn rule có target địa chi là có scope support; hai Đức cần passages riêng về 月建三合 và 月表. Không áp dụng cho mọi rule chứa chữ 月: lunar-day rules, 月將 hoặc direction rules có thể khác.

**UNRESOLVED — độ phân giải thời gian.** Các đoạn canonical được tìm thấy chỉ rõ loại transition là Jie. Chúng chưa đủ để kết luận sáu rule cùng đổi tại millisecond giao tiết, hay cách ghi nguyên civil day của một lịch ngày. “Mỗi tháng giao tiết thì lặp hai ngày trực” ở 卷四 là cách mô tả 建除, không tự chứng minh API instant cho tất cả sáu rule. Cũng không có cơ sở chọn Trung khí, new moon, lunar new year hoặc 00:00 chỉ vì source gọi 正月.

**External evidence, không tráo authority.** [《大清時憲曆箋釋》 / 繆之晉 / phần mở đầu](https://www.shidianguji.com/zh/book/NA06367/chapter/1m3q9g2tzjd4i) cho ví dụ Lập Hạ cùng một ngày nhưng trước giờ giao vẫn thuộc tháng tiết trước. Đây là historical commentary rõ về exact-time, song là **tác phẩm khác**, chưa phải điều khoản khóa cho từng rule trong XJBF. Transcription có lỗi OCR và chưa collation đầy đủ. [吳羽, 2021, printed p.408 / PDF p.12](https://www1.ihp.sinica.edu.tw/storage/publish2L/92-2-4%E5%90%B3%E7%BE%BD.pdf) xác định tháng trong bảng thần sát của bài là 星命月 bắt đầu tại 12 Jie; phạm vi bảng đó không tự cung cấp sáu-rule dated fixtures/cutoff.

**PROJECT CONVENTION.** Asia/Ho_Chi_Minh, civil midnight UTC+7 cố định và apparent-longitude engine là conventions hiện đại của project. Nguồn cổ không dùng IANA timezone, không tự có longitude UTC timestamp đến millisecond. Nếu chọn instant boundary, phải ghi điều đó là binding policy được review, không giả danh trích nguyên văn cổ. Quy tắc whole-day hay instant đã pass cho Trực không tự có authority cho Group B.

## Evidence riêng từng rule

### Nguyệt Phá — month-breaker

**SOURCE SAYS:** [卷四 / 月破 / 考原曰](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷04): `月破者月建所衝之日也`. 月建 được cùng卷解释 như chủ của 建除. Ngày có chi đối xung month Jian là cùng operand với 破日 trong hệ đó. 月表 đặt tháng Jian寅/卯/辰/巳 theo bốn Jie đã nêu; không cần suy từ Bazi API.

**INFERENCE:** dùng MONTH_JIAN_BRANCH (solar/Jie) làm context, match DAY_BRANCH đối chi. Tháng nhuận âm không phải input của phép đối xung. **UNRESOLVED:** daily annotation / exact-instant binding và dated examples. 大耗 được source ghi cùng vị trí nhưng có mục effect riêng; không dùng alias để cộng hai raw hung matches hoặc mất nguồn scope.

### Kiếp Sát — robbery-sha

**SOURCE SAYS:** [卷六 / 刼煞](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) giữ passage `正月起亥逆行四孟`. 正月 trong rule được corroborate bởi chính 月表 chứa 刼煞 dưới 立春正月節, rồi tháng 2 dưới 驚蟄. 四孟 mô tả bốn branch targets, không phải instruction cho lunar leap month.

**INFERENCE:** ordinal labels được bind vào Month Jian/Jie framework của chính work. Operand là ngày chi theo “其日”. 刼/劫 là variants ký tự; không nhập annual 劫煞 vào monthly canonical ID. **UNRESOLVED:** cutoff và độc lập ngày thực tế. Không đổi “正月” thành lunarMonth=1 trong runtime chỉ vì bản dịch hiện đại.

### Tai Sát — disaster-sha

**SOURCE SAYS:** [卷六 / 月災煞、天獄、天火 / 按](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) ghi lời truyền 天獄 thuận 四仲, chấp nhận correction của 曹震圭 sang nghịch, rồi xóa 天獄 khi đã dùng 災煞. Sách cũng bàn sửa chiều của 天火; không được coi đó là dữ liệu production tự dựng.

Month basis được kiểm chứng riêng bằng 月表 chứa 災煞 cho các Jie. Target là DAY_BRANCH, cycle symbolic cũ giữ nguyên. Alias 天獄 → monthly disaster-sha có **explicit identity**, không double count. Heading 災煞〈天火〉 tại 卷十 và các lý giải riêng về 天火 chưa chứng minh mọi semantics/effect identical; giữ alias này chưa admit. “Phi Ma Sát (Tai Sát)” trong legacy không chứng minh primary identity.

**UNRESOLVED:** cutoff, dated fixtures, quan hệ Tianhuo ngoài identity Tianyu đã rõ. Không đổi table để khớp các truyền bản thuận hành.

### Nguyệt Sát — month-sha

**SOURCE SAYS:** [卷六 / 月煞、月虚](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) có cùng reverse 四季 và giải thích bằng 月建三合旺氣; nói không hai nghĩa. Monthly 月虚/煞 có căn cứ để canonicalize, không chỉ vì lookup giống nhau. 月表 corroborates Jie context cho chính rule.

Target DAY_BRANCH; tháng nhuận không đổi solar context. **UNRESOLVED:** exact versus civil labels và independent dated anchors. Alias 月虚 không đem theo một bộ raw match thứ hai; activity wording của từng passage phải giữ attribution.

### Nguyệt Đức — month-virtue

**SOURCE SAYS:** [卷五 / 月徳](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05) giải thích 三合五行陽干 và rõ 寅午戌→丙. [卷十 / 天德月德… / 按](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷10) gọi hai Đức là 月建三合旺氣. Chính 月表 gắn tháng Jie với 月徳; không dựa riêng đoạn “凡月神…十二辰”.

Day operand là DAY_STEM; chữ tại方 có direction aspect riêng. Không đổi stem thành branch. 月德合 có rule/effect riêng, không phải alias 月德. **UNRESOLVED:** exact cutoff và dated matches. Leap irrelevance theo Jie basis, không phải lunar month repeat policy.

### Thiên Đức — heaven-virtue

**SOURCE SAYS:** [卷五 / 天徳 / 考原、按](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05) gắn tháng với 月建三合. Source nói tám 天干 và bốn 卦位; 四仲 dùng 坤/乾/艮/巽. Theo source, 天道 là cách nói chuyên direction, 天徳 gồm day-stem và direction aspects. Không biến hai aspect thành hai vị thần independent để tính đôi.

Ba cách giải **ghi riêng, không hòa trộn**:

1. Giữ mixed stem/trigram wording; bốn quái là bốn góc/direction, không phải branch-valued day record.
2. 蠡海集 kể cách dùng nhóm 巳亥寅申 cho bốn 仲; đây là interpretation được thuật lại, không production-ready conversion mặc định.
3. “又一說” lấy nhóm mộ 未戌丑辰. Editor nêu tranh luận rồi phản đối trộn nghĩa 長生/墓庫 địa chi vào rule dùng thiên can; không chọn interpretation theo majority.

Ở đoạn 天德合, source giải thích bốn góc không có 十干 thì không có ngày tương ứng theo phép hợp đó; đây là bằng chứng thêm để không chế một ngày chi cho quái. **UNRESOLVED:** một modern day-only API phải biểu diễn bốn hàng này thế nào; cutoff; dated fixtures. Status **PARTIAL**, chưa promote hoặc sửa legacy conversion.

## Activity scope — research candidates, không runtime effects

[卷十 / 宜忌](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷10) có mục riêng cho tháng Phá và hai Đức, gồm co-occurrence exceptions. [卷六](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) có scope cho các 月煞. Không suy chỉ từ polarity; không giữ prose “tốt/xấu mọi việc” thành machine logic.

| Rule | Direct lexical candidates đã tìm | Giới hạn |
| --- | --- | --- |
| Nguyệt Phá | wedding/construction/finance → avoid; medical treatment và study có exceptions | Không “all activities avoid”; exceptions phụ thuộc passage/co-occurrence, chưa implement |
| Kiếp Sát | 成親 → wedding avoid; 納禮 → engagement avoid | Không lấy burial/construction từ legacy prose nếu chưa dẫn passage riêng |
| Tai Sát / 天獄 | 興詞訟 → litigation avoid | Không suy wedding/move-house từ tên Phi Ma ở production |
| Nguyệt Sát / 月虚 | travel/wedding/warehouse/finance/planting → avoid | Phân biệt 日 scope với 方 scope; quân sự/chăn nuôi chưa có activity ID tương ứng |
| Nguyệt Đức | wedding/pray/medical-treatment/construction/burial → recommend, trong mục hai Đức | Chỉ là subset trích rõ; không scoring/severity, không resolver precedence |
| Thiên Đức | cùng mục hai Đức, cùng subset | Effect chỉ meaningful khi operand và raw match đã resolve; quái không tự thành day match |

Danh sách này không exhaustive taxonomy. JSON giữ sourceTextRef, words và qualification. Tuyệt đối không đem 宜修造取土 ở dòng month-direction headings biến thành day-level construction rule mà thiếu passage day-specific. Những hoạt động không có ID được giữ ở text evidence, không ép sang litigation/business.

## Independent dated anchors — chưa đủ admission

Đã tìm primary transcription, catalogue/facsimile leads, historical commentary, scholarly historical-calendar study và dated Tong Shu leads. **0 positive + 0 negative được chấp nhận cho từng rule**, không fabricate để đủ 2+/2−. Đây là thiếu evidence đủ điều kiện trong lượt này, không phải khẳng định không tồn tại.

| Lead | Kết quả / lý do chưa nhận |
| --- | --- |
| [NDL, 1741 edition, 36卷, さ-88](https://ndlsearch.ndl.go.jp/en/books/R100000002-I000007567664) | Catalogue xác định edition và public digital PID 2609626; viewer/IIIF fetch lỗi. Không claim đã collation scan |
| [CText / 四庫 scan catalogue](https://ctext.org/library.pl?if=gb&res=6135) | Fetch lỗi; discovery lead, không chứng cứ passage đã nhìn scan |
| [Historical commentary scan PDF](https://upload.wikimedia.org/wikipedia/commons/0/0f/Shanghai_%E5%A4%A7%E6%B8%85%E6%86%B2%E6%9B%B8%E7%AE%8B%E9%87%8B%E4%B8%80%E5%8D%B7.pdf) | Located 99-page image PDF; chưa completed folio-by-folio collation, không nguồn XJBF độc lập cho dated match |
| [同治九年時憲書](https://www.shidianguji.com/zh/book/HY1764/chapter/1ko001jzxfn77) | Có recorded Jie giờ và 閏十月, OCR thiếu/nhầm; chưa verified ngày annotation của sáu rule. Chỉ calendar-context lead |
| [信發堂 / 2024 廖淵用通書](https://www.hsing-fa-tang.com.tw/book_detail.php?id=230426095739) | Có bibliographic/publisher listing, không đọc được đủ dated pages. Không suy rule từ product description |
| [真佛報 HK issue1507](https://uploads.strikinglycdn.com/files/04febaf1-d2cf-4ccc-8cfe-ced114a13bd9/Truebuddhanews1507.pdf?t=1710578394%3Fid%3D4121124) | Search snippet có 2024-01-08 辛未 / 乙丑月 / 月破; PDF fetch vượt giới hạn. Chưa verify page/timezone/completeness; chưa accepted anchor |
| Generic app/blog dated listings | Không traceable edition/method; chỉ discovery leads, không authority và không negative evidence từ sự vắng một label |

Month table’s 60 symbolic days are **not dated anchors**. HKO chỉ chứng minh astronomical/calendar context, không xác nhận Shen Sha. Một label không xuất hiện trên lịch có thể do omission hoặc rule precedence, chưa là negative raw match nếu không rõ annotation policy.

## Boundary / leap candidate evidence

JSON có 144 pending records: 6 rules × 4 transitions × 6 samples. Các sample là published-minute reference−1min / reference / +1min và civil D−1/D/D+1 lúc noon. `expected=null`, day stem/branch chưa verified → null. Không gọi production. Các reference từ [HKO2014](https://www.hko.gov.hk/en/gts/astron2014/Solar_Term_2014.htm):

| Jie | HKO UTC+8 | Converted fixed UTC+7 |
| --- | --- | --- |
| Lập Xuân | 2014-02-04 06:03 | 2014-02-04 05:03 |
| Kinh Trập | 2014-03-06 00:02 | 2014-03-05 23:02 |
| Thanh Minh | 2014-04-05 04:47 | 2014-04-05 03:47 |
| Lập Hạ | 2014-05-05 21:59 | 2014-05-05 20:59 |

HKO precision là minute. Reference-at-published-minute **không phải exact t**, không tạo lời khẳng định sample đó thuộc đúng instant mới. Khi cutoff được admit, cần exact independent timestamp hoặc uncertainty-aware evidence; không tự phát sinh expected từ API đang kiểm chứng.

Không tạo lunar before/leap/after fixtures như thể sáu rule đã chọn lunar basis. Nếu reviewer chọn lunar alternative, cần riêng primary leap evidence; khi thiếu thì các fixtures ấy PENDING. Trong Jie reading, leap flag là irrelevant và boundary evidence cần chứng minh month Jian xuyên qua leap month bằng nguồn độc lập khi dựng Golden sau này.

## Safety / stop

SHA-256 before/after: toàn bộ protected source/test files trong shared/, src/, functions/src/, Golden V3 và supplied Downloads V1/V2.1 unchanged. JSON có count và snapshot digest. Không rerun audit Group A, không scoring, không Group C, không modify extraction/registry/manifest để làm trạng thái xanh.

- [x] Production unchanged
- [x] Golden V1 unchanged
- [x] Golden V2.1 unchanged
- [x] Golden V3 Group A unchanged
- [x] No production-derived expected
- [x] No majority-web authority
- [x] No guessed leap policy
- [x] No trigram→branch guess
- [x] No automatic lunar-month assumption
- [x] No scoring
- [x] No Group C work

Dừng ở bốn report. Chưa rule Group B nào GOLDEN_READY; không implement.
