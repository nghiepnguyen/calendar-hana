# P4-B — các 凶 còn lại của 卷十一 và 21 dormant

Trạng thái: **AUDIT_ONLY_PARTIAL — chưa đạt “Xong khi” của roadmap mục 4**. Không activation, scoring, merge hoặc deploy. Nhánh `codex/p4-remaining-ji-audit`.

## Mô hình và căn cứ

- `shared/almanac-data/p4-vol10-remaining-ji-v5.json`: 24 entry riêng và inventory đầy đủ 29 heading 卷十一. Mỗi entry có nguyên văn 卷十, offset theo Unicode code point, SHA-1 raw nguồn, danh sách 忌, predicate và phạm vi bảo vệ. Không suy class từ dấu điểm hoặc nhãn sao.
- 9 凶 dormant còn thiếu scope được ghép: 厭對、四廢、四忌、四窮、五墓、五離、往亡、八專、歸忌. 5 hung dormant còn lại dùng các scope P4-A đã khóa: 災煞、月煞、月害、月厭、大時. 7 cát dormant đã có operand trong A04b; P4-B xuất presence đủ 21 IDs và dùng chúng qua đường 宜 hiện có, không tạo điểm.
- Presence ngoài P3: 死氣 = Month Jian +4, 小耗 = +5; 天賊 từ 丑 nghịch 12 chi; 四耗 theo mùa; 五虛 theo mùa; 九空 từ 辰 nghịch 四季; 九坎/九焦 theo tháng; 土符 theo bảng; 地囊 theo **bản sửa rõ ràng của 按**, không theo bảng 歴例 bị chính nguồn bác; 觸水龍 = 丙子/癸丑/癸未.
- 四廢 + 月破 → 諸事皆忌. 四窮 chỉ gỡ ở 寅月乙亥 có 天願; 八專 gỡ hôn nhân với 天願, không gỡ quân sự. 五墓 chỉ gỡ với 月德 ở 午/子. 不將 không miễn kỵ hôn nhân khác.
- 小耗 chỉ bảo vệ toàn scope ở 四仲. 死氣 bảo vệ quân sự/y tế, thêm toàn scope ở 辰/戌. 四耗 bảo vệ quân sự; không gọi toàn bộ 忌 tài chính là 遇德猶忌.
- 九空 deferral có đích và trạng thái unresolved khi đích không đủ bao phủ; không tự suy từ độ nặng.
- 招搖 giữ heading nước riêng nhưng dùng miễn 德赦 chung với 厭對, vì **按 của chính entry nói rõ cả hai**. Không tự dùng convention của các 又為X khác để phủ định câu này.
- 氣往亡 không được kích hoạt hoặc đồng nhất với 往亡; đã chốt tại P3.

## Oracle và sửa lỗi minh bạch

Artifact nguồn v1 và partial Golden v1 đóng băng ở `0b405e6`, trước evaluator; bản chép sửa tại `f6de5e5`, phạm vi bảo vệ sửa tại `8f160c0`. Các version cũ giữ nguyên bytes.

Partial oracle hiện hành: `golden-p4-remaining-ji-v6.json`, 42 ca suy tay. Các lock nằm trong `docs/audits/sources/p4-vol10/remaining-ji-*-lock*.json`. Test kiểm SHA-256 của mọi version và nguyên văn/offset trên raw khóa.

Bốn lỗi oracle được phân loại **GOLDEN_BUG**, có bản sửa riêng và chứng minh không phụ thuộc evaluator:

1. 辰月庚申 bị ghi nhầm đồng hiện 月破. 月破 của 辰 là 戌; 庚申 có 四廢 nhưng không có 月破. Sửa tại `406da01`.
2. Negative fixture 四耗 bỏ sót 寅月 天德合壬 (丁壬合), vốn thuộc ngoại lệ nguồn. Chuyển fixture âm sang 卯, ngoài các ngoại lệ được nêu.
3. Fixture 歸忌 dùng 甲丑, không thuộc lục thập hoa giáp. Sửa thành 乙丑; presence chỉ xét chi. Hai sửa cuối tại `cf82ccc`.

4. Fixture 八風申月丁亥 bỏ sót 月德合丁 (申子辰月德壬, 丁壬合). Sửa thành ca gỡ; thêm 戌月丁亥 làm ca còn kỵ, có chứng minh nhóm 德 riêng tại `f316732`.

Owner chốt ba presence tại `51a7d2b`: 八風 theo 按; 復日 một 本建令干 theo từng tháng; 重日 là hai chi 巳/亥. Golden mới thay expectation theo quyết định này, không lấy output evaluator.

Oracle này là scope oracle, **không phải full Golden 720 context × heading** của roadmap mục 7. Test bổ sung 招搖 và bảo toàn raw 忌 của 遊禍 đều được viết và thấy fail trước sửa evaluator.

## Ghép ngày và dữ liệu thật

`p4RemainingJi.ts` đánh giá từng entry; `p4FullDayComposition.ts` ghép với raw A04b **trước** 鋪註. A04b cũ vẫn có oracle và hành vi cũ; chỉ xuất thêm `prePropagationHeadings` cho tầng audit mới.

Thiếu operand chỉ làm heading liên quan `undetermined`; không giả absent, không sinh penalty. Trường hợp có presence và raw 忌 đã chứng minh nhưng exception chưa rõ vẫn giữ `ji: true`. Scope lift chỉ gỡ chính scope ấy; không xoá 忌 từ scope khác. 忌 bảo vệ và 百忌 không bị propagation gỡ. Không lấy số thần để chọn cấp.

Quét 1095 ngày 2025–2027, 29 heading/ngày: **31.755 dòng**. TSV: `p4-vol10-remaining-ji-2025-2027.tsv`; tổng hợp: `p4-vol10-remaining-ji-summary.json`.

- 21 dormant đều xuất hiện trong khoảng kiểm; presence còn được đối chiếu trực tiếp từng ô với definitions P3 trên 720 context.
- **0 propagation gỡ; 69 propagation bị chặn**. Không thay số 0 bằng fixture nhân tạo để nói đã chứng minh lan truyền thành công trên dữ liệu thật.
- **10.962 dòng còn thiếu operand 凶**. Đây là số dòng có `unresolvedJi`, không phải tổng số `undetermined` (vốn còn phụ thuộc 11 宜 của mục 5).
- 6 ngày gặp xung đột 天願/遊禍: 2025-05-27, 2025-11-29, 2026-05-22, 2026-11-24, 2027-05-17, 2027-11-19.

Lệnh tái tạo: `P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts`.

## Thiếu hụt và quyết định cần thiết

| Đối tượng | Căn cứ / thiếu hụt | Trạng thái hiện hành |
|---|---|---|
| 八風 | 卷05 歴例 / 按 khác nhau ở 春/秋 | **OWNER_ADOPTED** 2026-10-12: dùng 按, giữ 歴例 làm alternative |
| 復日 | 歴例 gom cặp tháng; 地理新書 / 按 giải thích theo 本建令干 | **OWNER_ADOPTED**: 正甲、二乙、三戊、四丙、五丁、六己、七庚、八辛、九戊、十壬、十一癸、十二己 |
| 重日 | 原文「己亥二日」, diễn giải sau nói 巳/亥 | **OWNER_ADOPTED**: hai chi 巳/亥, không phải một pillar 己亥 |
| 天願 + 遊禍 | P3 source-locked 天願 = 巳月丙申/亥月壬寅; 卷06 遊禍 đúng là 申/寅 tại hai tháng ấy, nhưng 卷十 chú「天願不得與遊禍併」 | SOURCE_DEPENDENT; presence giữ P3, exception undetermined, raw 忌 giữ nguyên; owner giữ pending, không coi chú là lỗi nguồn; scan n182 đã xác nhận chú đúng bản text. **月表 witness**: cả hai thần đều có mặt; 十月壬寅 giữ 忌, 四月丙申 thì 諸事不忌 theo `puzhu:28`, nên có thể đóng mục này khi owner duyệt |
| 每月十二日十五日 / 每月十五日 / 朔望日 | Context 720 chỉ Month Jian + pillar; chưa đưa operand ngày âm / phase chính xác vào API P4-B | UNSUPPORTED_OPERAND, không giả absent; cần mở rộng audit context và Golden trước code |
| 土王用事後 | S1 vẫn SOURCE_DEPENDENT, không lấy quy ước cũ làm authority mới | UNSUPPORTED_OPERAND, tiếp tục S1 |
| 天狗 | Nguồn 卷04 按 chỉ 申月戌日 ở 滿日; P1 được giữ scope riêng trong spec, chưa được owner nhập P4 | OWNER_SCOPE_PENDING, không coi mọi 滿日 là 天狗. 月表: 七月庚戌 có 天狗, các 滿日 của 正月 thì không |
| 滿日 (求醫療病) | Inventory có nhưng chưa khóa đầy đủ entry 忌 / clause riêng | SOURCE_ENTRY_PENDING, không suy từ tên Trực. 月表: 滿日 không có 德 thì 忌 求醫療病, nhưng 3 trang đã đọc đều có 厭對/招搖 nên chưa tách được |

Quotes và offset của ba presence đã chốt: `sources/p4-vol10/remaining-ji-open-presence.json`. Các câu 卷十 và conflict P3 nằm trong artifact nguồn / `xieji-god-definitions.json`. Đã đọc trực tiếp [scan n182](https://archive.org/download/06067686.cn/page/n182_w1200.jpg): mục 遊禍 có chú **天願不得與遊禍併**. Ảnh gốc `sources/p4-vol10/youhuo-n182.jpg`, checksum/locator ở `youhuo-scan-lock.json`. OCR không đọc được, không dùng OCR làm oracle. Scan này xác nhận provenance của chú; không giải quyết mâu thuẫn với presence P3, nên giữ pending đúng quyết định owner.

## Witness 月表 (卷二十–三十一)

Đọc bằng mắt 17 trang ngày của 月表 (四庫全書, archive.org `06067692.cn`–`06067697.cn`; leaf n6+i ở quyển đầu, n73+i ở quyển sau, i tính từ 甲子). Ảnh, SHA-256 và bản đọc các cột: `sources/p4-vol10/yuebiao-witness-lock.json`, ảnh ở `sources/p4-vol10/yuebiao/`. Đây là witness, không dùng output evaluator và không đổi Golden. Test mới so presence của mọi scope đã xác định với danh sách 凶神 trên từng trang: **0 lệch**. Mutation bỏ 八風 khỏi trang 正月丁巳 bị test bắt.

- **八風 theo 按**: 正月丁巳 và 七月丁亥 có; 正月己酉 và 七月辛未 (các ngày chỉ có trong 歴例) không có.
- **復日 theo 本建令干**: 正月甲辰, 五月丁未, 七月庚戌 và 四月丙申/十月壬寅 có; 正月庚午, 七月甲子 và 三月己卯 (cặp của 歴例) không có.
- **重日 theo chi 巳/亥**: có trên 乙亥, 丁巳, 丁亥 (không phải pillar 己亥).
- Ngoại lệ đã mô hình: 五墓 + 月德 ở 午/子 (五月丙戌, 十一月壬辰) cho 嫁娶 vào 宜. 八專 + 天願 (五月丁未) cũng cho 嫁娶 vào 宜. 四窮 + 天願 (正月乙亥) cho 結婚姻/納采問名 vào 宜 nhưng vẫn 忌 嫁娶. 遊禍 + 月德合 (七月丁亥) vẫn 忌 (猶忌).
- **天願 + 遊禍**: 月表 in **cả hai** thần trên 四月丙申 và 十月壬寅, nên presence P3 đúng với thực hành của chính sách. 十月壬寅 không có 德合 và in 忌 祭祀 祈福 求嗣 解除 求醫療病 開渠, tức 天願 không gỡ 遊禍. 四月丙申 có thêm 天德合 và không in 忌 nào. Lý do là 鋪註條例 cuối 卷十 (`puzhu:28`, offset 22630): 「…四月丙申…徳合與赦願所㑹之辰諸事不忌」. Chú 「天願不得與遊禍併」 không phải lỗi chép, nhưng 月表 không dùng nó để xoá presence.
- **天狗**: có trên 七月庚戌 (申月戌, 滿日). 正月丙辰/甲辰/戊辰 (滿日, tháng khác) không có.
- **滿日 求醫療病**: 正月甲辰/戊辰 (không có 德) 忌 求醫療病. 正月丙辰 (có 月德) cho nó vào 宜. Các trang này còn 厭對/招搖/九空, nên chưa tách được 忌 riêng của 滿日. Cần thêm một trang 滿日 không có các thần ấy.

**Lỗ hổng mới**: `puzhu:28` đã được chép trong `p4-vol10-authority.json` nhưng không thuộc propagation inventory và evaluator không áp. TSV vẫn để 2025-05-27 (巳月丙申) ở `undetermined`. Muốn sửa phải viết Golden riêng cho 8 pillar của câu này trước, sau đó mới sửa code.

Không chuyển roadmap sang mục 5 trước khi mục 4 đạt tiêu chí. 11 宜, P5 warehouse, full Golden, adapter OFF, migration và activation vẫn là các bước kế tiếp riêng.

## Kiểm chứng

Gate P4-B hiện hành: 2 file / 52 test qua, gồm quét 720 context và 1095 ngày. Typecheck/lint/build qua; bundle `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`, trùng baseline production được ghi trong context. Không tuyên bố deploy mới. Full unit sau quyết định owner: **177 file / 3328 test qua**. Thêm kiểm hash scan đã qua gate riêng; bảng/effect không đổi sau full unit. Mutation: 9/9 P4-B mới + 9/9 A04b cũ bị assertion bắt. Không dùng audit này để tuyên bố scoring đã chứng nhận. Mutation runner mới phục hồi nguyên bytes và exit nonzero nếu mutation không bị assertion bắt. Gate cũ A04b / 又為X vẫn được giữ.
