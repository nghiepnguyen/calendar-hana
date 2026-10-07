# Calendar Group B — conflicts and reviewer decisions

2026-10-08. Research only. Không sửa các conflicts bằng majority vote, không sửa production/Golden.

## 1. Legacy lunar-month indexing khác source Month Jian binding

Legacy [stars.ts](</Users/nghiepnguyen/My Files/calendar-hana/shared/lunar/stars.ts>) dùng `byMonth[ctx.lunarMonth - 1]` và comment cho tháng nhuận dùng tháng thường cùng số. Đây là mô tả implementation, không authority. [卷十二 / 日躔過宮](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷12) và 月表卷20–23 phân biệt 月建 theo Jie với 月將 theo Zhongqi; từng rule có mặt trong các bảng tháng này. Ngay khi lunar month number và solar Month Jian không trùng, bảng symbolic dù giống nhau vẫn có thể cho raw match khác.

**Decision pending:** xác nhận runtime basis Jie/Month Jian cho từng rule theo package nghiên cứu; không lấy legacy lunar indexing làm oracle. Không đưa ra production-generated dated mismatch hay sửa engine trong lượt này.

## 2. Exact crossing vs whole-day calendar label

Primary xác nhận loại transition Jie, chưa tìm được instruction đủ rõ cho cutoff của từng rule ở thời điểm trước/trùng/sau giao tiết. 建除 có câu giao tiết lặp hai trực, nhưng scope/cách daily annotation không được tự mở rộng sang cả sáu rule. Legacy Trực API gán nguyên ngày giao tiết theo tháng mới; instant API dùng exact crossing. Cả hai behavior có thể cùng tồn tại với mục đích khác nhau, không cái nào tự là authority cho Group B.

[《大清時憲曆箋釋》](https://www.shidianguji.com/zh/book/NA06367/chapter/1m3q9g2tzjd4i) nói rõ before crossing còn tháng tiết trước; đây là khác-work historical interpretation support cho candidate instant policy, không câu primary XJBF đã được khóa. Không có bằng chứng đủ để tuyên bố canonical work bắt buộc whole civil day, cũng không giả rằng mọi rule đã được source-confirmed exact millisecond.

**Decision pending:** cutoff model, inclusive boundary, separation instant matching/calendar-day presentation, và evidence scope của commentary. HKO minute times không tự resolve sample “t”.

## 3. Tai Sát / 天獄 / 天火 / Phi Ma

[卷六](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷06&oldid=787343) thuật lại 天獄 thuận 四仲 rồi editorial correction sang nghịch; tác giả xác nhận 天獄 chính là 災煞 và xóa duplicate. Đây là **source’s own correction**, không hai bảng để lấy đa số.

天火 được cùng phần bàn correction và được đặt chung heading 災煞〈天火〉 ở [卷十](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷10), nhưng đoạn nghĩa/effects riêng không được xóa chỉ vì lookup có thể trùng. Cần review liệu đó là identity của toàn semantics hay co-location phục vụ mục 宜忌. Legacy “Phi Ma Sát (Tai Sát)” không có primary identity trong package.

**Resolved within scope:** monthly 天獄 canonicalizes to disaster-sha; không double count.

**Unresolved:** tự nhập 天火 hoặc Phi Ma vào ID đó, hoặc mượn wedding/move-house prose của legacy làm Tai Sát canonical effect. Không thực hiện.

## 4. Thiên Đức bốn quái và rival reconstructions

[卷五](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷05) giữ 坤/乾/艮/巽 và nêu “八天干 / 四卦位”. Tác phẩm thuật interpretation dùng nhóm 巳亥寅申, rồi một interpretation mộ 未戌丑辰; editor không cho trộn tùy ý luận địa chi với heavenly stems.

Legacy Thiên Đức chuyển bốn tháng 2/5/8/11 thành chi 申/亥/寅/巳. Bảng đó có thể trùng một interpretation được thuật lại; không đủ để gọi là canonical preferred day-only reading. Không chuyển 乾坤艮巽 thành branch theo production hoặc vì nhiều app chọn như vậy.

**Decision pending:** giữ bốn hàng direction-only/không day match, một source-supported mixed model, hoặc chọn named reconstruction riêng. Phải cite justification và independent dated examples trước khi admit. Thiên Đức vẫn PARTIAL.

## 5. 月建 và 月將 không được đánh đồng

[卷十二](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷12) và [月表二](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷21) đặt Jie cho 月建 nhưng Zhongqi cho 月將. 一月 trong source không tự đồng nghĩa một field lunarMonth hoặc một zodiac/month-General field hiện đại. 月表 có dòng “始…終…” theo Jie–Zhongqi; không đọc chữ 終 ấy như một instruction đổi Month Jian tại Zhongqi trong khi tháng kế đặt tại Jie.

**Decision pending:** field naming/API binding cần phân biệt Jian/General; không tái sử dụng tên mơ hồ “solar month” nếu chưa ghi nghĩa.

## 6. Activity scope, raw identity và project conflict policy

[卷十 / 宜忌](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷10) có các exceptions cụ thể khi hung/good rules đồng hiện. Spec V3 yêu cầu unresolved conflict giữ explainable, nhưng không được hiểu là phủ nhận mọi precedence đã được primary nêu rõ. Cần review per-activity conditions riêng nếu mở rộng resolver về sau; lượt này không implement.

Nguyệt Phá/大耗 cùng vị trí vẫn giữ nguồn effect; 月煞/月虚 có explicit identity nhưng effects phải attribution từng passage. Hai Đức có danh sách 宜 cụ thể, không canonical score. “Tốt cho mọi việc” hoặc “hung = mọi việc avoid” trong legacy không trở thành source rule.

**Decision pending:** mapping taxonomy và conditional exceptions; giữ research candidates có qualification. Không inference severity hoặc biến military terms thành business/litigation.

## 7. Historical traditions và timezone translation

Canonical cổ, commentary khác tác phẩm, Tong Shu hiện đại và legacy Việt có thể có traditions khác. [吳羽2021](https://www1.ihp.sinica.edu.tw/storage/publish2L/92-2-4%E5%90%B3%E7%BE%BD.pdf) cũng ghi nhận historical annotation policies thay đổi. Sự vắng label trên một trang chưa chứng minh raw false.

Asia/Ho_Chi_Minh fixed UTC+7 là project convention; cổ thư nêu regional clocks/local calendars không tự bind vào IANA timezone. HKO reference UTC+8 cần đổi absolute instant; Kinh Trập2014 rơi Mar5 UTC+7 nhưng Mar6 UTC+8. Không áp dụng trọn source civil date của Hong Kong cho Vietnam.

**Decision pending:** authority edition, annotation completeness, timezone/day-stem convention cho dated anchors. Không majority vote, không promote nguồn app/blog.
