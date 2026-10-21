# Independent Secondary Review

Reviewer: independent-secondary-agent (Reviewer #2) · 2026-10-20 · không sửa dữ liệu production.

## Scope

Mansion: 115/115 reviewed
用事: 29/29 reviewed

## Method

- **Claim**: mansion lấy từ `mansion-content-yuxia-1880-v1.json` qua chính resolver `resolveMansionActivityMapping` (activity hiển thị cho người dùng, không phải ID rỗng trong source lock). 用事 lấy từ `activityEntries` trong `xiejibianfangshu-yiji.json` + nhãn `activities.json`.
- **Độc lập**: tài liệu review #1 chỉ dùng để xác định phạm vi; không trường `evidence` nào trích chúng.
- **Mansion (Tier 1)**: tải lại 28 trang scan archive.org (n45–n72, SHA-1 trong JSON), chép toàn bài từng Tú bằng mắt rồi mới so quote. Mỗi clause kiểm 3 chiều: quote nguyên văn, cực tính (câu nào mang cực tính), phạm vi nghĩa.
- **Chính sách dị thể**: 莊/庄, 克/剋, 蠶/蚕 coi là nguyên văn (AGREE + ghi chú). Khác chữ thật sự là DISAGREE ở chiều quote, kể cả khi nghĩa mapping vẫn đúng.
- **用事 (Tier 1, có lưu ý)**: tải lại 卷十一 Wikisource raw (SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`). Trang tự ghi chưa hiệu đính với scan 四庫; heading và chú 「X同」 chưa đối chiếu ảnh gốc.
- **Gộp**: một chiều DISAGREE → DISAGREE; nếu không, một chiều UNCERTAIN → UNCERTAIN.
- **Tier**: mỗi item một tier = nguồn mạnh nhất đã thực sự đọc.

## Mansion

AGREE: 107
DISAGREE: 5
UNCERTAIN: 3

## 用事

AGREE: 28
DISAGREE: 0
UNCERTAIN: 1

## Disagreements

Cả 5 đều là lỗi **quote** (nguyên văn trên scan khác production). Activity và cực tính của clause vẫn được bài thơ hỗ trợ; cần sửa quote (source lock + golden) ở task riêng.

| ID | Production | Reviewer #2 | Bằng chứng |
|---|---|---|---|
| 亢-2 | 「埋葬定是虎狼傷」 · negative · scope=funeral_burial · activity=burial · exact_catalog_pair | burial · negative, nhưng quote đúng phải là 「埋葬若還逢此日」 (cực tính ở câu sau 「當時災禍主重喪」) | Quote KHÔNG có nguyên văn trên scan. Scan: 「投軍定是虎狼傷」 (câu 4, nói về tòng quân) và 「埋葬若還逢此日，當時災禍主重喪」 (câu 7-8). Quote production ghép 埋葬 với hậu quả của 投軍. |
| 房-2 | 「埋葬若然逢此日」 · positive · scope=funeral_burial · activity=burial · exact_catalog_pair | burial · positive (「高官進職拜君王」); quote cần sửa thành 「埋葬若然用此日」 | Quote KHÔNG có nguyên văn trên scan. Cực tính positive mang bởi câu 「高官進職拜君王」. Quote lệch một chữ không phải dị thể: scan 「埋葬若然用此日」, production 「埋葬若然逢此日」 (用≠逢). |
| 心-2 | 「埋葬若還逢此日」 · negative · scope=funeral_burial · activity=burial · exact_catalog_pair | burial · negative, quote đúng 「埋葬卒暴死相從」 | Quote KHÔNG có nguyên văn trên scan. Câu chôn cất của Tâm là 「埋葬卒暴死相從」; 「埋葬若還逢此日」 là câu của 危/翼, không có ở trang 心. |
| 斗-2 | 「墳墓修築富貴家」 · positive · scope=funeral_grave_repair · activity=grave_repair · exact_catalog_pair | grave_repair · positive, quote đúng 「墳堂修築富貴來」 (墳堂 = nhà mộ/phần mộ) | Quote KHÔNG có nguyên văn trên scan. Quote lệch hai chữ: scan 「墳堂修築富貴來」, production 「墳墓修築富貴家」 (堂≠墓, 來≠家). reviewTerm 墳墓修築 của production chỉ khớp nhờ quote chép sai. |
| 壁-2 | 「婚姻自有人口進」 · positive · scope=relationship_wedding · activity=wedding · exact_catalog_pair | wedding · positive, quote đúng 「婚姻吉利生貴子」 | Quote KHÔNG có nguyên văn trên scan. Quote ghép từ hai câu: 「奴婢自來人口進」 (câu 3) và 「婚姻吉利生貴子」 (câu 7). |

**Hệ quả nếu sửa quote** (resolver production chạy thử trên quote đúng, không sửa repo):

- 亢-2: Chạy resolver production trên quote đã sửa (thử trong scratch): vẫn exact_catalog_pair, interpretation_reviewed, reviewTerm 埋葬 — sửa quote không đổi hành vi.
- 房-2: Resolver trên quote đã sửa: interpretation_reviewed, reviewTerm 埋葬 — không đổi hành vi.
- 心-2: Resolver trên quote đã sửa: interpretation_reviewed, reviewTerm 埋葬 — không đổi hành vi.
- 斗-2: Resolver trên quote đã sửa: 墳堂修築 không khớp term nào của funeral_grave_repair (修築墳墓/墳墓修築/修墳) → interpretation_pending. Sửa quote SẼ đổi review status; cần thêm term 墳堂修築 hoặc quyết định khác.
- 壁-2: Resolver trên quote đã sửa: interpretation_reviewed, reviewTerm 婚姻 — không đổi hành vi.

## Uncertain items

| ID | Production | Reviewer #2 | Bằng chứng |
|---|---|---|---|
| 婁-1 | 「婁星竪柱起門庭」 · positive · scope=construction_columns · activity=(gap) · unmapped | ứng viên beam_raising (豎柱上梁) hoặc giữ gap; cần owner quyết | Quote có nguyên văn trên scan. Cực tính positive mang bởi câu 「婁星竪柱起門庭」. Quote và cực tính đúng trên scan. Nhưng lý do gap của production ("Dựng cột chưa có exact activity ID") bị chính catalog phản chứng một phần: beam_raising được gắn heading 協紀 卷十一 「豎柱上梁」, chứa nguyên 竪柱 (竪=豎). 竪柱 một mình chỉ là nửa đầu của nghi thức 豎柱上梁, nên cũng chưa chắc gán beam_raising là đúng. |
| 柳-2 | 「埋葬瘟疫多疾病」 · negative · scope=funeral_burial · activity=burial · exact_catalog_pair | burial · negative (câu mở 埋葬 + 瘟…病: hung), nguyên văn chưa xác nhận | Quote chưa xác nhận được (chữ khó đọc). Câu 3 trang 柳 đọc được 「埋葬瘟_多__」 (đã cắt cột ở độ phân giải gốc): chữ 4 có bộ 疒, nét trong giống 旦 (疸) hơn 殳 (疫); chữ 6-7 trông như 「病死」 chứ không phải 「疾病」. Mực nhoè. Không đủ rõ để xác nhận hay bác bỏ nguyên văn. |
| 張-1 | 「張星日好造龍軒」 · positive · scope=construction_general · activity=construction · exact_catalog_pair | construction (nếu 龍軒 = sảnh) hoặc gap hẹp như 高堂/龍宮; nhất quán chưa được chứng minh | Quote có nguyên văn trên scan. Cực tính positive mang bởi câu 「張星日好造龍軒」. 軒 vừa là hiên/lầu vừa là xe; 龍軒 có thể là sảnh lớn hoặc xe rồng. Production xếp 造龍軒 vào xây dựng chung, trong khi các cụm cùng kiểu 造高堂 (危), 架高堂 (翼), 造新房 (星), 造龍宮 (軫) lại giữ gap hẹp. Câu sau 「年年便見進庄田」 không giải quyết được. |
| renovation | renovation ("Sửa chữa") ← 修宮室 | Hoặc 修宮室 (production) hoặc 興造動土 qua 「修造同」; nguồn không phân định | heading 「修宮室」 có trong thân 卷十一, danh sách 御用. Heading 修宮室 chỉ có trong danh sách 御用 (sửa cung thất). Trong 民用/通書, việc sửa chữa nhà thường gọi là 修造, và nguồn ghi 修造 dưới heading 興造動土 (「修造同」). Vì vậy "Sửa chữa" có hai cách đọc đều có căn cứ: 修宮室 (theo chữ) hoặc 興造動土 (theo 修造). Hai heading có 宜 khác nhau, nên lựa chọn ảnh hưởng kết quả. |

## Ghi chú khác (AGREE)

- 亢-1: Câu 4 「投軍定是虎狼傷」 (tòng quân) là việc không có trong catalog; không trích, không tính.
- 危-1: Gap thận trọng; xem 張-1 về độ nhất quán 造X.
- 壁-1: Dị thể: scan 「進庄田」, production 「進莊田」 (莊/庄). Theo chính sách dị thể: AGREE kèm ghi chú.
- 參-1: Câu 3 「只因造作田財旺」 lặp lại 造作 cát.
- 參-5: Dị thể: scan chữ cuối dạng 剋/尅, production 「克」. Theo chính sách dị thể: AGREE kèm ghi chú.
- 井-1: Dị thể: scan 「旺蚕田」, production 「旺蠶田」 (蠶/蚕). Theo chính sách dị thể: AGREE kèm ghi chú.
- 鬼-6: 修土 có thể đọc là đào đắp đất; production không gộp vào groundbreaking (興造動土) — cách giữ gap thận trọng, không khẳng định điều sai.
- 星-1: Gap thận trọng; xem 張-1.
- 星-3: Câu cuối 「放水開溝天命傷」 cũng xác nhận 放水 hung.
- 星-4: Đọc đủ đoạn: 「不可葬埋并放水，凶星臨位女人亡，生離死別無心戀，自要歸休別嫁郎」. 自要歸休別嫁郎 là hậu quả (vợ bỏ đi lấy chồng khác), không phải lời dặn về cưới gả trong ngày → not_operative đúng.
- 翼-1: Gap thận trọng; xem 張-1.
- 軫-1: Gap thận trọng; 臨水 thu hẹp phạm vi. Xem 張-1.

## Source coverage

Tier 1: 144
Tier 2: 0
Tier 3 only: 0

Lưu ý: 29 item 用事 xếp Tier 1 vì là bản chép của nguồn gốc 四庫全書, nhưng chưa được hiệu đính với ảnh scan.

## Certification recommendation

Current: `SINGLE_REVIEWED`

Recommendation:

```
SECONDARY_REVIEW_COMPLETE
RESOLUTION_REQUIRED
EVIDENCE_REQUIRED
```

Reviewer #2 không nâng chứng nhận. Chỉ maintainer quyết định sau khi xử lý các mục trên.

## Artifacts

- `secondary-review.json`: 144 kết quả, bản chép 28 trang scan, SHA-1 nguồn.
- `review-diff.json`: chỉ DISAGREE/UNCERTAIN.
