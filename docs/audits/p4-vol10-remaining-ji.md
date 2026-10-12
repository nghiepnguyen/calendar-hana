# P4-B — các 凶 còn lại của 卷十一 và 21 dormant

Trạng thái: **AUDIT_ONLY_PARTIAL — chưa đạt “Xong khi” của roadmap mục 4**. Không activation, scoring, merge hoặc deploy. Nhánh `codex/p4-remaining-ji-audit`.

## Mô hình và căn cứ

- `shared/almanac-data/p4-vol10-remaining-ji-v7.json`: 26 entry riêng (v5 + 滿日, 天狗), một day rule `puzhu:28`, và inventory đầy đủ 29 heading 卷十一. Mỗi entry có nguyên văn 卷十, offset theo Unicode code point, SHA-1 raw nguồn, danh sách 忌, predicate và phạm vi bảo vệ. Không suy class từ dấu điểm hoặc nhãn sao.
- 9 凶 dormant còn thiếu scope được ghép: 厭對、四廢、四忌、四窮、五墓、五離、往亡、八專、歸忌. 5 hung dormant còn lại dùng các scope P4-A đã khóa: 災煞、月煞、月害、月厭、大時. 7 cát dormant đã có operand trong A04b; P4-B xuất presence đủ 21 IDs và dùng chúng qua đường 宜 hiện có, không tạo điểm.
- Presence ngoài P3: 死氣 = Month Jian +4, 小耗 = +5; 天賊 từ 丑 nghịch 12 chi; 四耗 theo mùa; 五虛 theo mùa; 九空 từ 辰 nghịch 四季; 九坎/九焦 theo tháng; 土符 theo bảng; 地囊 theo **bản sửa rõ ràng của 按**, không theo bảng 歴例 bị chính nguồn bác; 觸水龍 = 丙子/癸丑/癸未.
- 四廢 + 月破 → 諸事皆忌. 四窮 chỉ gỡ ở 寅月乙亥 có 天願; 八專 gỡ hôn nhân với 天願, không gỡ quân sự. 五墓 chỉ gỡ với 月德 ở 午/子. 不將 không miễn kỵ hôn nhân khác.
- 小耗 chỉ bảo vệ toàn scope ở 四仲. 死氣 bảo vệ quân sự/y tế, thêm toàn scope ở 辰/戌. 四耗 bảo vệ quân sự; không gọi toàn bộ 忌 tài chính là 遇德猶忌.
- 九空 deferral có đích và trạng thái unresolved khi đích không đủ bao phủ; không tự suy từ độ nặng.
- 招搖 giữ heading nước riêng nhưng dùng miễn 德赦 chung với 厭對, vì **按 của chính entry nói rõ cả hai**. Không tự dùng convention của các 又為X khác để phủ định câu này.
- 氣往亡 không được kích hoạt hoặc đồng nhất với 往亡; đã chốt tại P3.
- 滿日 theo entry riêng của 卷十 (offset 10434): 忌 施恩封拜…上官赴任 臨政親民 結婚姻 納采問名 求醫療病. Tháng 寅申 (守日) và 子午卯酉 (相日) gỡ khi có 月德/天德合/月德合/月恩/四相 (nguồn không nêu 天德). 辰戌丑未 theo 災煞, 巳亥 theo 月厭. Chú 「天赦天願不得與滿日併」 được test kiểm là luôn đúng.
- 天狗 lấy từ chính entry 滿日: 「申月又為天狗忌祭祀與德合併猶忌」, tức chỉ 申月戌, 忌 祭祀 và được bảo vệ. Scope 天狗 của P1 (卷04) vẫn tách riêng.
- Khi defer sang scope A04b, P4-B đặt 宜 = true để chỉ đọc 忌 (both_present = kept, only_yi = lifted). Nhờ vậy clause 止忌 không còn ra `undetermined` chỉ vì thiếu operand 宜.

## Oracle và sửa lỗi minh bạch

Artifact nguồn v1 và partial Golden v1 đóng băng ở `0b405e6`, trước evaluator; bản chép sửa tại `f6de5e5`, phạm vi bảo vệ sửa tại `8f160c0`. Các version cũ giữ nguyên bytes.

Partial oracle hiện hành: `golden-p4-remaining-ji-v8.json`, 51 ca scope và 10 ca ngày, đều suy tay. Golden v7 đóng băng ở `c988e12` và v8 ở `5c9e3c0`, đều trước code. Các lock nằm trong `docs/audits/sources/p4-vol10/remaining-ji-*-lock*.json`. Test kiểm SHA-256 của mọi version và nguyên văn/offset trên raw khóa.

Bốn lỗi oracle được phân loại **GOLDEN_BUG**, có bản sửa riêng và chứng minh không phụ thuộc evaluator:

1. 辰月庚申 bị ghi nhầm đồng hiện 月破. 月破 của 辰 là 戌; 庚申 có 四廢 nhưng không có 月破. Sửa tại `406da01`.
2. Negative fixture 四耗 bỏ sót 寅月 天德合壬 (丁壬合), vốn thuộc ngoại lệ nguồn. Chuyển fixture âm sang 卯, ngoài các ngoại lệ được nêu.
3. Fixture 歸忌 dùng 甲丑, không thuộc lục thập hoa giáp. Sửa thành 乙丑; presence chỉ xét chi. Hai sửa cuối tại `cf82ccc`.

4. Fixture 八風申月丁亥 bỏ sót 月德合丁 (申子辰月德壬, 丁壬合). Sửa thành ca gỡ; thêm 戌月丁亥 làm ca còn kỵ, có chứng minh nhóm 德 riêng tại `f316732`.

Owner chốt ba presence tại `51a7d2b`: 八風 theo 按; 復日 một 本建令干 theo từng tháng; 重日 là hai chi 巳/亥. Golden mới thay expectation theo quyết định này, không lấy output evaluator.

Cùng ngày, owner nhận witness 月表 cho 遊禍 + 天願: cả hai thần đều có mặt và 遊禍 giữ 忌. Golden v7 đổi hai ca 遊禍 từ `undetermined` sang `protected` (**OWNER_ADOPTED**, không phải GOLDEN_BUG). Riêng 巳月丙申 được gỡ ở cấp ngày bởi `puzhu:28`.

Oracle này là scope oracle, **không phải full Golden 720 context × heading** của roadmap mục 7. Test bổ sung 招搖 và bảo toàn raw 忌 của 遊禍 đều được viết và thấy fail trước sửa evaluator.

## Ghép ngày và dữ liệu thật

`p4RemainingJi.ts` đánh giá từng entry; `p4FullDayComposition.ts` ghép với raw A04b **trước** 鋪註. A04b cũ vẫn có oracle và hành vi cũ; chỉ xuất thêm `prePropagationHeadings` cho tầng audit mới.

Thiếu operand chỉ làm heading liên quan `undetermined`; không giả absent, không sinh penalty. Trường hợp có presence và raw 忌 đã chứng minh nhưng exception chưa rõ vẫn giữ `ji: true`. Scope lift chỉ gỡ chính scope ấy; không xoá 忌 từ scope khác. 忌 bảo vệ và 百忌 không bị propagation gỡ. Không lấy số thần để chọn cấp.

Quét 1095 ngày 2025–2027, 29 heading/ngày: **31.755 dòng**. TSV: `p4-vol10-remaining-ji-2025-2027.tsv`; tổng hợp: `p4-vol10-remaining-ji-summary.json`.

- 21 dormant đều xuất hiện trong khoảng kiểm; presence còn được đối chiếu trực tiếp từng ô với definitions P3 trên 720 context.
- **0 propagation gỡ; 75 propagation bị chặn** (bản đầu là 69). Khi thêm 滿日/天狗, số này lên 84: các heading trước kia `undetermined` vì token 滿日/天狗 nay đã xác định, propagation hiện ra và bị 忌 bảo vệ chặn. Áp 未月甲午 bỏ đi 9 ca chặn trên 3 ngày đó. Không thay số 0 bằng fixture nhân tạo để nói đã chứng minh lan truyền thành công trên dữ liệu thật.
- **6.516 dòng còn thiếu operand 凶** (sau phase từng báo 5.430 do bỏ sót alias phá dỡ; trước phase: 6.516; trước ngày âm: 7.602) (bản đầu là 10.962), chỉ còn 土王用事後. Đây là số dòng có `unresolvedJi`, không phải tổng số `undetermined` (vốn còn phụ thuộc 11 宜 của mục 5).
- 0 ngày còn xung đột 天願/遊禍 (trước là 6). 巳月丙申 (2025-05-27, 2026-05-22, 2027-05-17) giờ là 諸事不忌. 亥月壬寅 (2025-11-29, 2026-11-24, 2027-11-19) giữ 忌 của 遊禍.
- `puzhu:28` áp cho 9 ngày thực trong khoảng kiểm: 2025-03-06, 2025-05-27, 2025-07-24, 2025-08-07, 2025-09-08, 2026-05-22, 2026-07-19, 2027-05-17, 2027-07-14. Mọi heading đều `ji: false`. Khi thêm 未月甲午, TSV chỉ đổi ở 3 ngày 未月甲午; mọi dòng khác giữ nguyên.

Lệnh tái tạo: `P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts`.

## Thiếu hụt và quyết định cần thiết

| Đối tượng | Căn cứ / thiếu hụt | Trạng thái hiện hành |
|---|---|---|
| 八風 | 卷05 歴例 / 按 khác nhau ở 春/秋 | **OWNER_ADOPTED** 2026-10-12: dùng 按, giữ 歴例 làm alternative |
| 復日 | 歴例 gom cặp tháng; 地理新書 / 按 giải thích theo 本建令干 | **OWNER_ADOPTED**: 正甲、二乙、三戊、四丙、五丁、六己、七庚、八辛、九戊、十壬、十一癸、十二己 |
| 重日 | 原文「己亥二日」, diễn giải sau nói 巳/亥 | **OWNER_ADOPTED**: hai chi 巳/亥, không phải một pillar 己亥 |
| 天願 + 遊禍 | P3 天願 = 巳月丙申/亥月壬寅 trùng 遊禍; 卷十 chú「天願不得與遊禍併」 (scan n182 xác nhận) | **OWNER_ADOPTED** 2026-10-12 theo 月表: cả hai có mặt, 遊禍 giữ 忌; 巳月丙申 諸事不忌 theo `puzhu:28` |
| 每月十二日十五日 / 每月十五日 / 朔望日 | API audit có context tùy chọn `{ lunarDay }`; sweep cấp `LUNAR_DAY` theo lịch hiện hành. 卷十: 十五日「忌求醫療病，義同朢日」 | Ngày 12/15 MODELED (Golden riêng `5442f10`); 朔弦望 đã MODELED theo scan + USNO 2025–2027 (`1b2e9c2`); thiếu date/ngoài coverage vẫn unknown, không đồng nhất 望 với ngày 15 |
| 土王用事後 | S1 vẫn SOURCE_DEPENDENT, không lấy quy ước cũ làm authority mới | UNSUPPORTED_OPERAND, tiếp tục S1 |
| 天狗 | 卷十 entry 滿日: 申月又為天狗, 忌祭祀, 與德合併猶忌 | **MODELED** (申月戌, protected). 月表: 七月庚戌 có. P1 scope 卷04 vẫn tách riêng |
| 滿日 | Entry riêng 卷十 offset 10434 | **MODELED**. 月表: 正月甲辰/戊辰 và 二月乙巳/辛巳 忌 (không có 德); 正月丙辰 (月德) và 二月丁巳 (月恩 + 四相) gỡ |
| `puzhu:28` mục 六月 | Bản in n229 và raw ghi 六月甲子; 月表 六月甲子 không có 赦/願 và in 忌, còn 六月甲午 (天德 月德 天赦) không in 忌 | **OWNER_ADOPTED** 2026-10-12: coi 「甲子」 là lỗi in, áp cho 未月甲午 theo 月表; 未月甲子 không áp. Vế đầu 「嵗薄逐陣…」 đã mô hình theo source lock `07ae416` |

Quotes và offset của ba presence đã chốt: `sources/p4-vol10/remaining-ji-open-presence.json`. Các câu 卷十 và conflict P3 nằm trong artifact nguồn / `xieji-god-definitions.json`. Đã đọc trực tiếp [scan n182](https://archive.org/download/06067686.cn/page/n182_w1200.jpg): mục 遊禍 có chú **天願不得與遊禍併**. Ảnh gốc `sources/p4-vol10/youhuo-n182.jpg`, checksum/locator ở `youhuo-scan-lock.json`. OCR không đọc được, không dùng OCR làm oracle. Scan này xác nhận provenance của chú; không giải quyết mâu thuẫn với presence P3, đã được owner giải quyết theo witness 月表 như bảng trên.

## Witness 月表 (卷二十–三十一)

Đọc bằng mắt 24 trang ngày của 月表 (四庫全書, archive.org `06067692.cn`–`06067697.cn`; leaf n6+i ở quyển đầu, n73+i ở quyển sau, i tính từ 甲子), thêm hai trang cuối 卷十 (n228/n229) cho dòng `puzhu:28`. Ảnh, SHA-256 và bản đọc: `sources/p4-vol10/yuebiao-witness-lock-v2.json` (v1 giữ nguyên). Test so presence của mọi scope đã xác định với danh sách 凶神 (và Trực cho 滿日) trên từng trang: **0 lệch**.

- **八風 theo 按**: 正月丁巳 và 七月丁亥 có; 正月己酉 và 七月辛未 (các ngày chỉ có trong 歴例) không có.
- **復日 theo 本建令干**: 正月甲辰, 五月丁未, 七月庚戌 và 四月丙申/十月壬寅 có; 正月庚午, 七月甲子 và 三月己卯 (cặp của 歴例) không có.
- **重日 theo chi 巳/亥**: có trên 乙亥, 丁巳, 丁亥 (không phải pillar 己亥).
- Ngoại lệ đã mô hình: 五墓 + 月德 ở 午/子 (五月丙戌, 十一月壬辰) cho 嫁娶 vào 宜. 八專 + 天願 (五月丁未) cũng cho 嫁娶 vào 宜. 四窮 + 天願 (正月乙亥) cho 結婚姻/納采問名 vào 宜 nhưng vẫn 忌 嫁娶. 遊禍 + 月德合 (七月丁亥) vẫn 忌 (猶忌).
- **天願 + 遊禍**: 月表 in **cả hai** thần trên 四月丙申 và 十月壬寅, nên presence P3 đúng với thực hành của chính sách. 十月壬寅 không có 德合 và in 忌 祭祀 祈福 求嗣 解除 求醫療病 開渠, tức 天願 không gỡ 遊禍. 四月丙申 có thêm 天德合 và không in 忌 nào. Lý do là 鋪註條例 cuối 卷十 (`puzhu:28`, offset 22630): 「…四月丙申…徳合與赦願所㑹之辰諸事不忌」. Chú 「天願不得與遊禍併」 không phải lỗi chép, nhưng 月表 không dùng nó để xoá presence.
- **天狗**: có trên 七月庚戌 (申月戌, 滿日). Các 滿日 của 正月/二月 không có.
- **滿日**: 二月乙巳/辛巳 (không có 德) 忌 結婚姻/納采問名; 二月丁巳 (月恩 + 四相) thì không. 求醫療病 không tách riêng được ở 二月 vì cả ba ngày đều có 往亡, nhưng nằm sẵn trong entry 卷十.
- **puzhu:28**: 四月丙申, 六月甲午, 七月戊申, 十二月甲子 đều không in 忌, dù có 月刑/血忌/遊禍 (丙申) hay 天吏/往亡/血支 (甲午). Phạm vi gỡ vì vậy là **toàn bộ 忌 của ngày** (諸事不忌), kể cả 百忌. 六月甲子 vẫn in 忌. Test xác nhận rule chỉ áp cho đúng 8 pillar trong 720 context và giữ nguyên bằng chứng 宜.

Không chuyển roadmap sang mục 5 trước khi mục 4 đạt tiêu chí. 11 宜, P5 warehouse, full Golden, adapter OFF, migration và activation vẫn là các bước kế tiếp riêng.

## Kiểm chứng

Gate P4-B hiện hành: 5 file / 132 test qua, gồm quét 720 context, 1095 ngày, Golden v8 (51 ca scope + 10 ca ngày), Golden ngày âm v1 (9 ca) và witness 月表. Typecheck/oxlint/build qua; bundle `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`, trùng baseline production. Không tuyên bố deploy mới. Full unit: **180 file / 3408 test qua**. Mutation P4-B: **21/21** bị assertion bắt, gồm 3 mutation mới cho kỵ ngày âm, bảo vệ ngày âm và missing ngày âm không được thành absent; runner phục hồi nguyên bytes. File A04b không đổi nên không chạy lại mutation A04b. Không dùng audit này để tuyên bố scoring đã chứng nhận.

## Context ngày âm 12/15 (2026-10-12)

Authority `p4-lunar-day-taboo-v1.json` và `golden-p4-lunar-day-v1.json` khóa tại **5442f10 trước code**; lock `sources/p4-vol10/lunar-day-lock-v1.json` kiểm SHA-256 và nguyên văn/offset/SHA-1 raw 卷十. Chín ca suy trực tiếp từ hai đoạn nguồn, không dùng output resolver. Golden v8 và các lock cũ giữ nguyên bytes.

`resolveP4FullDay(month, pillar, { lunarDay })`: ngày 12/15 giữ 忌 **剃頭** trong heading ghép 整容剃頭; ngày 15 giữ 忌 求醫療病. Presence độc lập với Month Jian; missing giữ unknown; ngoài 1–30 hoặc không nguyên bị từ chối. Theo phần 「與德合赦願併猶忌以下並同」 của đoạn nguồn, các 忌 này được bảo vệ khi ghép/propagation. Ngoại lệ cấp ngày puzhu:28 vẫn gỡ 忌, còn trace presence nguồn giữ lại. Không suy ra kỵ riêng 整容.

Sweep ngày thật cấp `selectionContext.LUNAR_DAY` từ calendar đã có (Asia/Ho_Chi_Minh); cột `lunar_day` trong TSV cho phép tái hiện input. Số unresolved giảm đúng 1.086 dòng 整容剃頭; 求醫療病 đã biết điều kiện ngày 15 nhưng vẫn thiếu 朔望, nên vẫn unresolved. Còn 5.430 dòng 土王用事後 + 1.086 dòng 朔望 = **6.516**. 0 conflict; 0 propagation gỡ / 75 chặn. Không chứng nhận phase hoặc S1 bằng Golden ngày âm; vế 歲薄逐陣 đã mô hình trong 鋪註 27/28-first bên dưới.

## 鋪註 27/28-first và 朔弦望 (2026-10-13)

- **07ae416 trước code**: authority `p4-puzhu-end-v1.json`, Golden 8 context 歲薄/逐陣 + 四廢/天吏; lock `puzhu-end-lock-v1.json` có 8 scan 月表 đọc bằng mắt. Câu 27 restore raw 忌 大時/天吏 khi có 四廢/歲薄/逐陣. Câu 28-first xóa 宜 theo raw 月厭, không tự thêm 月厭 忌; 忌 vẫn theo ngày. Heading ngoài mask giữ evidence. Không đổi helper A04b và Golden cũ.
- **1b2e9c2 trước code**: authority `p4-lunar-phase-authority-v1.json`, 13 Golden ngày dân sự đọc USNO và đổi UT+7 độc lập. Scan 卷十 n216/n217 xác nhận **朔弦望**; token inventory 朔望日 bỏ sót 弦 là SPEC_BUG, giữ token tương thích nhưng scope record đủ New Moon / First Quarter / Full Moon / Last Quarter.
- `p4LunarPhase.ts` là input provider audit-only từ dataset USNO đã khóa, không dùng resolver hoặc engine repo để sinh expected, không tính lại astronomy production. 148 sự kiện trên 2025–2027 (37 mỗi phase), 947 ngày không phase; ngoài miền trả unknown. Không sự kiện nào ở trong một phút quanh nửa đêm VN, nên độ làm tròn phút/UT1–UTC không đổi ngày của các input này. Metadata ghi rõ JSON đã chuẩn hóa từ bản render web, không giả SHA cho HTTP bytes nguyên bản.
- Context tùy chọn `{ lunarDay, phase }` vẫn giữ unknown nếu thiếu, tách ngày 15 khỏi ngày chứa phase. 忌 phase được bảo vệ trong ghép/propagation; puzhu:28 list vẫn gỡ 忌 nhưng không xóa trace presence.
- Sweep có cột `lunar_day`, `phase`, `yi`, `puzhu_end`, `death_defeat`: **6.516** unresolved (bao gồm 1.086 dòng phá dỡ được sửa lookup), tất cả 土王用事後; 0 conflict, 0 propagation gỡ / 75 chặn. Không coi metric thiếu 凶 bằng metric thiếu 11 宜. Gate 5 file / 132 test; mutation 21/21 assertion bắt và phục hồi bytes.

S1 còn gate presence/biên: xem [phương án review](p4-vol10-soil-convention-gate.md). So raw 土府 với đất xây dựng trong catalog cho thấy gặp 德 vẫn kỵ các heading này; không còn ambiguity miễn kỵ ảnh hưởng sáu activity hiện hành. Convention 18 ngày dân sự đã được owner chốt cho production, nhưng chưa dùng làm canonical authority P4 mới.

### Sửa coverage lookup 壞/壊 (2026-10-13)

Inventory khóa ghi `破屋壞垣`, evaluator dùng heading chuẩn `破屋壊垣`. Lookup trực tiếp theo key khiến operand 土王用事後 của phá dỡ bị bỏ sót, không phải đã resolve. Regression test đã thấy đỏ (`[]` thiếu token 土王) trước sửa. Lookup mới dùng cùng `splitHeadings` + `canonP4Heading` như tầng heading; không sửa bytes artifact hoặc Golden cũ. Mutation bỏ chuẩn hóa bắt được regression này. Số unresolved chính xác là 1.086 × **6** heading = **6.516**, toàn bộ 土王用事後. Metric trước sửa alias 5.430 phải được hiểu là thiếu coverage, không dùng để chứng nhận P4-B.
