# Kiểm tra và sửa mapping/scoring — 05/10/2026

## Phạm vi đã thực hiện

Đối chiếu `spec-chon-ngay-mapping-scoring-v1.0.0.md` và `checklist-trien-khai-v1.0.0.md` do người dùng cung cấp. Thay đổi tập trung vào lỗi dữ liệu, phép tính sử dụng dữ liệu đó, và màn hình Mục tiêu trong ngày. Không triển khai production hoặc bật scoring Tú.

Dataset và engine được tăng lên **1.1.0**.

## Các lỗi đã sửa

| Trước | Sau |
|---|---|
| Đi thuyền bị gộp với xuất hành | `water_travel` / `travel_water` tách khỏi `travel_general` và `travel_road` |
| Sửa mồ mả bị tính thành an táng | `grave_repair` / `funeral_grave_repair` tách khỏi `burial` |
| Phát cỏ phá đất bị tính thành động thổ | Ưu tiên cụm dài, map `demolition`; Tú Quỷ vẫn giữ động thổ bất lợi riêng |
| Khởi tạo mọi việc bị tính thành động thổ | General note, không tạo rule động thổ |
| Câu tổng quát bị bỏ hoặc mất ngữ nghĩa | General note có polarity đúng, delta bằng 0 |
| Manifest tắt Tú nhưng runtime vẫn chấm | Tú chỉ informational, không tác động điểm/danh sách khuyến nghị |
| Chấp hoặc thiếu rule bị coi là neutral | `no_evidence`; event thiếu evidence hoạt động chính trả `insufficient_evidence` |
| Sự kiện là danh sách hoạt động ngang nhau | Có một primary, supporting/conditional và multiplier theo spec |
| Cát/hung thần không truyền vào phép tính | Bridge tên sao thực tế với catalog theo tên chính xác, inject hai danh sách; tên chưa có mapping được báo rõ |
| Điểm cát/hung thần không được cap riêng | Cap +25 / -30 theo từng activity, contribution giữ rawDelta và delta sau cap |
| Nguyệt Phá bị điểm thuận che | Hard warning theo override; classification không vượt guardrail |
| Ngày thay thế dùng phép tính khác UI | Dùng cùng `evaluateEventDay`, cùng input, chỉ chấp nhận `recommended` |
| Nhận xe chưa chọn giờ vẫn đề xuất 6/10/2026 | `good_hour=unknown`, `Chưa đủ dữ liệu`, không có ngày thay thế khi thiếu giờ |
| UI tính lý do riêng từ từ khóa | UI dùng contributions của engine; Tú nằm riêng ở phần tham khảo |

## Checklist có bằng chứng

- [x] ACT-01, ACT-02: danh mục có `water_travel`, `grave_repair`.
- [x] ACT-03, ACT-04: validate reference enabled và keyword không trùng.
- [x] ACT-05: 11 event có primary, role/multiplier; conditional chỉ áp dụng khi input xác nhận.
- [x] PAR-01–PAR-06: longest-phrase extraction, contextual scope, general notes informational.
- [x] TRU-01, TRU-02: không có rule trả no_evidence, không tự coi neutral.
- [x] GOD-01–GOD-04: inject catalog IDs thực tế, source caps, giữ hard warning.
- [x] MNS-01–MNS-06: Tú tắt điểm, đúng phạm vi, Quỷ không conflict, evidence tham khảo riêng.
- [x] MST-01–MST-03: ba must-have đang khai báo (`calendar_validity`, `event_fit`, `good_hour`) có evaluator; fail/unknown chặn khuyến nghị.
- [x] CLS-01, CLS-02: guardrails năm classification; supporting không che primary; hard warning không tự triệt tiêu.
- [x] AUD-01, AUD-02: output có contributions đầy đủ, rule/source/scope, multiplier, raw/applied delta, input/timezone/dataset/engine version.
- [x] VAL-01, VAL-02, VAL-04: static/semantic validation, policy parity cả 28 Tú, đưa vào suite unit test đã chạy trong CI.
- [x] PRS-01–PRS-03, TST-01–TST-04: parser production và 38 golden fixtures, phủ đủ 28 Tú, chạy qua Vitest cùng suite CI hiện có.
- [x] VER-01, VER-02: dataset/evidence version và review metadata.

## Những mục chưa thể đánh dấu hoàn tất

- **Source audit/owner approval:** snapshot evidence ghi `not_audited` cho 26 Tú; Chủy/Liễu ghi `no_activity_evidence`. Đã kiểm tra mapping kỹ thuật, chưa xác nhận nguồn cổ điển theo từng rule. Không tự dùng con số “26 ready” trong spec làm bằng chứng đã được owner phê duyệt.
- **AUD-03/AUD-04:** output engine (`contributions`) có toàn bộ audit trail. Từ ngày 05/10/2026 UI không còn hiển thị phần này (đã bỏ mục "Xem toàn bộ lý do", xem mục UI bên dưới). Chưa bổ sung lưu lịch sử bền vững hoặc API endpoint. Ứng dụng hiện đánh giá tại client.
- **VAL-03:** cảnh báo thiếu danh sách/mapping có trong `warnings` của kết quả engine, UI không hiển thị; chưa gửi telemetry.
- **VER-03:** dữ liệu repository đã đổi schema; chưa bổ sung công cụ migration cho các bản dataset bên ngoài.
- **Rollback/TEL/OPS:** chưa làm flag từ xa, shadow rollout, dashboard drift hoặc alerts. Policy tắt Tú nằm trong dataset và luôn được runtime kiểm tra.
- **P2 personal evaluators:** tuổi, ngũ hành, hướng và participant alignment chưa được chấm trong luồng này. Criteria trả `unknown`, không giả mạo đã đánh giá; UI không còn liệt kê các tiêu chí chưa đánh giá.
- **Mapping thần chưa có bộ tính ngày:** một số catalog thần không có tên tương ứng trong bảng sao ngày hiện tại. Chỉ bridge tên chính xác; không tự tạo alias. Thần định nghĩa theo chính ngày (Can, Chi, ngày âm) khai báo `rule` trong catalog và được tính bằng `resolveDayRuleGods` (hiện có Trừ Thần, Ngày Đinh, Nhân Thần, xem mục Cắt tóc). Cần audit nguồn trước khi mở rộng.
- Không đánh dấu toàn bộ release P0 hoặc gate bật scoring Tú đã đạt chỉ từ đợt sửa dữ liệu này.

## Kiểm chứng

- Golden mapping: **38/38** đạt, gồm các case critical Cơ/Ngưu/Quỷ/sửa mộ/Tất/Chẩn.
- Snapshot: **28/28** khớp parser production; **0** unresolved scoped conflict.
- Static validation: 29 activity, 11 event; reference enabled, một primary, multiplier [0,1], không duplicate keyword/rule key.
- Runtime regression: cap thần, no-evidence, missing-hour/invalid-hour/invalid-date, conditional context, audit/multiplier, ngày thay thế cùng evaluator.
- UI regression: không hiển thị ngày phù hợp sai khi Nhận xe thiếu giờ; phân biệt chưa đủ dữ liệu và dữ liệu tham khảo.

## File chính

- `shared/almanac-data/mansion-patterns.json`: từ khóa với activity/scope, review metadata.
- `shared/almanac-data/audited-mansion-evidence.json`: snapshot structured evidence (chưa phê duyệt nguồn).
- `shared/almanac-data/golden-tests-mansion-mapping.json`: 38 trường hợp kỳ vọng.
- `shared/lunar/mansionEvidence.ts`: longest-phrase parser/context/conflict.
- `shared/lunar/activityRecommendations.ts`: chấm activity, caps, no-evidence, policy/hard warning.
- `shared/lunar/eventEvaluation.ts`: must-have, multiplier, classification và audit.
- `shared/lunar/godMapping.ts`: bridge tên sao/catalog, không suy diễn alias.
- `shared/lunar/datasetValidation.test.ts`: gate dữ liệu trong CI unit suite hiện có.
- `src/views/DayView/DailyActivitySection.tsx`: một card gồm bộ chọn mục tiêu, input giờ/ngữ cảnh, kết luận và yếu tố thuận/bất lợi đã gộp theo quy tắc.
- `shared/lunar/godMapping.ts`: bridge tên sao/catalog và `resolveDayRuleGods` cho thần định nghĩa theo ngày.
- `shared/almanac-data/xiejibianfangshu-yiji.json`: bảng 宜忌 gốc của Hiệp Kỷ quyển 11.

## Bổ sung dataset 1.2.0 — 05/10/2026

### Quy ước tháng

Giữ theo fixture licham.vn: Trực theo tháng tiết khí; sao theo tháng, Hoàng/Hắc đạo và Can Chi tháng theo tháng âm. Hệ quả đã biết: ngày giáp ranh có thể là Trực Phá mà không có Nguyệt Phá (ví dụ 09/10/2026), hoặc có Nguyệt Phá vào ngày không phải Trực Phá (08/10/2026).

### Nguồn gốc rule: nguyên văn Hiệp Kỷ quyển 11

Rule 12 Trực và danh sách hoạt động của 24 cát thần + 18 hung thần nay sinh từ **欽定協紀辨方書 卷十一 用事** (bản Tứ Khố, [Wikisource](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷11)). Quyển này liệt kê với từng việc thần nào 宜 và thần nào 忌. Bảng gốc (đã chuẩn hóa dị thể 徳→德, 刼→劫, 劵→券, 虚→虛, 壊→壞) lưu tại `shared/almanac-data/xiejibianfangshu-yiji.json`. Test `Hiệp Kỷ Biện Phương Thư vol. 11 parity` bắt buộc `truc.json`, `good-gods.json`, `bad-gods.json` khớp bảng này.

Ánh xạ hoạt động app → mục trong quyển 11:

| App | Quyển 11 |
|---|---|
| travel (Xuất hành) | 行幸遣使 — quyển 10 chú thích 建日: "舊本止宜…出行…故增之", tức 出行 được gộp vào 行幸遣使 |
| wedding | 結婚姻 + 嫁娶 |
| engagement | 納采問名 |
| moving | 般移 |
| construction | 營建宮室 + 興造動土 |
| groundbreaking | 興造動土 |
| renovation | 修宮室 |
| opening, business | 開市 |
| contract, transaction | 立券交易 |
| finance | 納財 |
| medical | 求醫療病 |
| cut_hair | 整容剃頭 |
| burial | 安葬 |
| khác | 祭祀, 祈福, 求嗣, 安牀, 宴會, 入學, 掃舍宇, 豎柱上梁, 修倉庫, 栽種, 牧養+納畜, 破屋壞垣, 乘船渡水 |

Trực được nhận diện qua tên trực tiếp và các tên mà quyển 10 xác định là cùng ngày: 建日/月建/土府 = Kiến; 除日/吉期 = Trừ; 滿日/天巫 = Mãn; 平日/死神 = Bình; 破日/月破/大耗 = Phá; 成日/天喜/天醫 = Thành. Bổ sung một dòng từ quyển 10 mà quyển 11 bỏ sót: 開日 "忌…破土安葬" → Khai kỵ an táng. Mệnh đề điều kiện "與…併者" (chỉ tốt khi đi cùng thần khác) không tính là 宜.

### Kết quả chính

- **Xuất hành:** Kiến, Trừ, Thành, Khai tốt; Bình, Phá, Thu, Bế xấu; các đức thần (Thiên/Nguyệt Đức, Thiên Xá, Thiên Nguyện, Nguyệt Ân, Tứ Tướng, Thời Đức, Thiên Hỷ) tốt; Kiếp/Tai/Nguyệt Sát, Nguyệt Hình, Nguyệt Yếm, Đại Thời, Thiên Lại, Tứ Phế, Ngũ Mộ, Vãng Vong xấu. Giai đoạn 01–13/10/2026 từ 9/13 ngày "Chưa đủ dữ liệu" còn 1/13; cả năm 2026 còn 61/365.
- **Trừ:** bỏ cưới hỏi, xây dựng, động thổ, an táng, trồng trọt (nguồn lichviet.me, không có trong Hiệp Kỷ). Giữ chữa bệnh, cắt tóc, dọn dẹp; thêm xuất hành.
- **Mãn:** dữ liệu cũ khớp nguyên văn; thêm cúng tế, cầu phúc tốt (天巫), ăn hỏi xấu.
- **Bình:** nguyên văn kỵ hầu hết mọi việc (平日 thuộc nhóm hung). Nhận định "vạn sự đều cát" của bài thứ cấp là sai. Sửa chữa đổi từ tốt sang xấu.
- **Nguy:** chỉ tốt cho an giường. Cưới hỏi, chuyển nhà không được nhắc nên là `no_evidence`.
- **Khai:** tốt cho động thổ, xây dựng, xuất hành, chữa bệnh, nhập học, cúng tế…; kỵ an táng. Bỏ cưới hỏi, ký kết vì không có trong nguyên văn.
- **Chấp, Định:** Chấp chỉ hợp 捕捉 (bắt bớ), không có hoạt động tương ứng trong app. Định chỉ hợp 冠帶 (đội mũ) và 運謀 (bàn mưu); ký kết ngày Định đến từ Tam Hợp và được chấm qua thần Tam Hợp.
- **Thần sát:** Quy Kỵ chỉ kỵ 般移, 遠迴 (về từ nơi xa), nên bỏ xuất hành. Vãng Vong thêm chữa bệnh, bỏ an giường. Giải Thần bỏ dọn dẹp, thêm cắt tóc. Kiếp/Tai/Nguyệt Sát, Nguyệt Hình, Nguyệt Yếm, Tứ Phế có danh sách kỵ rộng như nguyên văn.
- **Không cộng trùng:** thần sát luôn trùng Trực (Thành ↔ Tam Hợp, Thiên Hỷ; Định ↔ Tam Hợp; Phá ↔ Nguyệt Phá) chỉ hiển thị, không cộng lại khi Trực đã chấm hoạt động đó. Hard warning của Nguyệt Phá vẫn giữ.

### Giới hạn còn lại

- Quyển 10 có nhiều ngoại lệ "與德合併…不忌" (gặp đức thần thì hết kỵ). `overrides.json` chưa mô hình hóa nên các kỵ vẫn bị tính đầy đủ.
- 乘船渡水 (đi thuyền) chỉ có các sao 招搖, 咸池, 八風, 九坎, 觸水龍, đều chưa có trong catalog.
- Tên sao ngày (stars.data.ts) chỉ bridge với catalog khi trùng tên chính xác; các thần trong quyển 11 chưa có trong catalog (驛馬, 天馬, 母倉, 王日, 天后, 鳴吠…) chưa được chấm điểm.

### Cắt tóc (整容剃頭)

Nguồn: 卷十一 mục 整容剃頭 ("宜除日解神除神 / 忌月建月破劫煞災煞月煞月刑月厭丁日每月十二日十五日"), bổ sung bằng chú thích quyển 10 và định nghĩa quyển 5.

| Thay đổi | Nguyên văn |
|---|---|
| Trừ Thần (除神) trước đây có trong catalog nhưng không bao giờ được tính, vì bảng sao Ngọc Hạp không có sao này. Nay tính theo Chi ngày Thân/Dậu | 卷五: "通書以申酉日為除神" |
| Thêm "Ngày Đinh" (`dinh_nhat`, Can ngày Đinh) kỵ cắt tóc, kèm hard warning để ngày Đinh không bao giờ được đánh giá "Thuận lợi" | 卷十 百忌日: "丁日忌剃頭"; "凡丁日忌剃頭亦不註宜整容"; Bành Tổ bách kỵ "丁不剃頭" |
| Thêm "Nhân Thần" (`nhan_than_toc`, ngày âm 12, 15) kỵ cắt tóc | 卷十 人神所在日: "十二日在髮際十五日在徧身忌剃頭" |
| Bình, Thu: cắt tóc ở mức `neutral` (0 điểm, có bằng chứng), không còn `no_evidence` | 卷十 平日/收日: "止不忌…整容剃頭" |

Năm 2026: "Chưa đủ dữ liệu" giảm từ 219 xuống 120 ngày; "Thuận lợi" giảm từ 24 xuống 18 ngày vì các ngày Trừ trùng ngày Đinh bị chặn. Các ngày còn thiếu dữ liệu rơi vào Trực Mãn, Định, Chấp, Nguy, Thành, Khai, Bế, những Trực mà nguyên văn không nhắc tới cắt tóc.

Không dùng: bảng ngày âm "tốt để cắt tóc" trên các trang tiếng Việt (mùng 3, 4, 8, 10…). Các bảng này mâu thuẫn nhau và mâu thuẫn với Hiệp Kỷ (có bài ghi rằm là ngày tốt, trong khi Hiệp Kỷ kỵ ngày 15). Cũng không dùng câu "除、破、危日宜剃頭" của Thông Thắng vì khác trường phái.

#### Policy sản phẩm: việc nhỏ không gặp ngày kỵ thì xem là bình thường

`manifest.policies.lowSeverityNoTabooMeansNeutral = true`. Sự kiện mức `low` (hiện chỉ có Cắt tóc) mà hoạt động chính không gặp quy tắc nào, tức cũng không có ngày kỵ, được kết luận "Cân nhắc" (score 50, `neutralByPolicy: true`) thay vì "Chưa đủ dữ liệu". UI ghi một dòng ngắn "Không gặp ngày kỵ nào.". Đây là quyết định sản phẩm, không phải nguồn cổ điển. Sự kiện mức medium trở lên vẫn trả `insufficient_evidence`.

Năm 2026, Cắt tóc: 0 ngày "Chưa đủ dữ liệu", 347 ngày "Cân nhắc" (120 ngày trong đó do policy này), 18 ngày "Thuận lợi".

#### Cập nhật 10/10/2026: mở rộng tới mức high

Owner quyết định đọc "không gặp quy tắc nào" là trung tính cho cả sự kiện mức medium và high. Policy đổi tên thành `manifest.policies.noTabooMeansNeutralUpToSeverity = "high"` (thay `lowSeverityNoTabooMeansNeutral`). Sự kiện mức `very_high` (cưới hỏi, động thổ, khai trương, mua nhà/đất) vẫn trả `insufficient_evidence`, vì việc lớn cần dấu hiệu tốt.

Ngày trung tính theo policy không bao giờ được kết luận "Thuận lợi": hoạt động phụ vẫn cộng/trừ điểm nhưng kết luận tối đa là "Cân nhắc". Nếu không chặn, ví dụ Bàn giao nhà 18/09/2026 (hoạt động chính không có quy tắc, hoạt động phụ +17,5) sẽ thành "Thuận lợi" chỉ nhờ hoạt động phụ.

Migration proof `shared/lunar/neutralNoTabooMigration.test.ts` (1095 ngày 2025–2027 × 11 sự kiện, giờ 9): contributions không đổi; chỉ sự kiện có hoạt động chính `no_evidence` ở mức medium/high đổi kết luận. 1.674 lượt `insufficient_evidence` → `caution` (high 1.462: mua xe 337, ký hợp đồng 337, bàn giao nhà 337, chuyển nhà 261, nhận xe 190; medium 212: xuất hành). Cắt tóc và mức very_high không đổi.

Sửa kèm: câu cảnh báo cứng trước đây luôn ghi "Nguyệt Phá"; nay ghi đúng tên thần gây cảnh báo (ví dụ "Ngày Đinh (Bách Kỵ)").

## UI — 05/10/2026

### Mục tiêu trong ngày (`DailyActivitySection`)

Ba box Mục tiêu trong ngày, Việc nên làm, Việc không nên làm được gộp thành một card:

- Header: tiêu đề và bộ chọn mục tiêu trên cùng một hàng.
- Tổng quan: hai nhóm chip "Nên làm" và "Không nên làm".
- Khi chọn mục tiêu: dải kết luận (tên việc, kết luận, ngày phù hợp tiếp theo hoặc gần nhất), sau đó là hai nhóm "Thuận" và "Bất lợi".
- Yếu tố được gộp theo quy tắc (`source` + rule): một quy tắc chạm nhiều hoạt động của sự kiện chỉ hiện một chip, kèm dòng phụ liệt kê các hoạt động. Yếu tố có hard warning có viền đỏ.
- Đã ẩn: mô tả chung của kết luận, dòng "Đánh giá theo Trực + Thần sát…", "Chưa đánh giá đầy đủ…", danh sách điều kiện Đạt/Không đạt và mục "Xem toàn bộ lý do". Chỉ giữ một dòng lý do khi thiếu dữ liệu, khi không gặp ngày kỵ (policy việc nhỏ), hoặc khi dữ liệu xung đột.
- Giữ: "Thông tin Tú (tham khảo)" dạng thu gọn ở đáy card.
- Khoảng cách tiêu đề nhóm dùng `gap` của grid, vì `PersonalFengShuiPanel` đặt lại margin của `h4` với độ ưu tiên cao hơn.

### Hoàng đạo / hắc đạo, đối chiếu lichviet.me

Đối chiếu trang chi tiết `lichviet.me/xem-ngay-tot-xau?date=…` cho đủ 365 ngày năm 2026:

| So sánh | Khớp |
|---|---|
| Ngày âm lịch | 365/365 |
| Hoàng/hắc đạo của app (tháng âm) | 365/365 |
| Nếu tính theo tháng tiết khí | 300/365 |

App giữ cách tính theo tháng âm, giống lichviet.me và licham.vn. Chấm "Ngày Tốt / Ngày Xấu" trên lịch tháng của lichviet.me không phải hoàng/hắc đạo: chỉ trùng 169/353 ô với trang chi tiết của chính họ, nên không dùng để đối chiếu. `shared/lunar/auspicious.test.ts` khóa 9 ngày giáp ranh mà tháng âm và tháng tiết khí cho kết quả ngược nhau.

### Lịch tháng (`MonthView`)

- Mỗi ngày có chấm ở góc trên phải số ngày: xanh `#16a34a` là hoàng đạo, xám `#c2c2c2` là hắc đạo. Thay cho sao vàng cũ, vốn chỉ đánh dấu ngày hoàng đạo.
- Hôm nay: viền đỏ 2px (`--accent`) vẽ vào trong ô, số ngày màu đỏ; bỏ nền tròn đỏ.
- Chú thích ở đáy lưới: Hoàng đạo, Hắc đạo, Hôm nay.
- Nhãn trợ năng của ô ngày đọc "ngày hoàng đạo" hoặc "ngày hắc đạo".
- Lưu ý: `#c2c2c2` trên nền sáng chỉ đạt khoảng 1.8:1, dưới mức 3:1 của WCAG 1.4.11 cho thành phần đồ họa. Thông tin vẫn có qua nhãn trợ năng và chú thích. `#949494` đạt khoảng 3:1 nếu cần đổi.
