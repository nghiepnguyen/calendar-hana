# Secondary Review — Resolution Phase

2026-10-20 · dựa trên `tasks/calendar-audit/secondary-review/` (giữ nguyên, không sửa).

Thứ tự ưu tiên: nguồn đúng > ngữ nghĩa đúng > ontology nhất quán > hành vi resolver > test > điểm chứng nhận.

## Baseline P4 (đã xử lý)

Đã xử lý 2026-10-20 (maintainer quyết: giữ 5 sửa quote): baseline P4 đóng băng chỉ đổi hash do sourceQuote; migration có kiểm soát, gate A–F PASS, 0 thay đổi hành vi trên 35136 + 24156 dòng. Bằng chứng: tasks/calendar-audit/p4-baseline-source-correction/. npm test: 225 file / 8196 test pass, 0 fail.

## Tóm tắt

DISAGREE: resolved 5/5, remaining 0
UNCERTAIN: DEFERRED 0, NEEDS_ONTOLOGY_DECISION 2, NEEDS_PRIMARY_EVIDENCE 1, RESOLVED 1

## Kết quả

| ID | Trước | Kết quả | Thay đổi | Trước → Sau |
|---|---|---|---|---|
| 亢-2 | DISAGREE | RESOLVED | transcription | 「埋葬定是虎狼傷」 · negative · burial · interpretation_reviewed → 「埋葬若還逢此日」 · negative · burial · interpretation_reviewed |
| 房-2 | DISAGREE | RESOLVED | transcription | 「埋葬若然逢此日」 · positive · burial · interpretation_reviewed → 「埋葬若然用此日」 · positive · burial · interpretation_reviewed |
| 心-2 | DISAGREE | RESOLVED | transcription | 「埋葬若還逢此日」 · negative · burial · interpretation_reviewed → 「埋葬卒暴死相從」 · negative · burial · interpretation_reviewed |
| 壁-2 | DISAGREE | RESOLVED | transcription | 「婚姻自有人口進」 · positive · wedding · interpretation_reviewed → 「婚姻吉利生貴子」 · positive · wedding · interpretation_reviewed |
| 斗-2 | DISAGREE | RESOLVED | transcription+resolver | 「墳墓修築富貴家」 · positive · grave_repair · interpretation_reviewed → 「墳堂修築富貴來」 · positive · grave_repair · interpretation_reviewed · reviewTerm 墳堂修築 |
| 婁-1 | UNCERTAIN | RESOLVED | none | 「婁星竪柱起門庭」 · positive · construction_columns · gap (unmapped) → không đổi (giữ gap) |
| 柳-2 | UNCERTAIN | NEEDS_PRIMARY_EVIDENCE | none | 「埋葬瘟疫多疾病」 · negative · burial → không đổi |
| 張-1 | UNCERTAIN | NEEDS_ONTOLOGY_DECISION | none | 「張星日好造龍軒」 · positive · construction_general → construction → không đổi |
| renovation | UNCERTAIN | NEEDS_ONTOLOGY_DECISION | none | renovation ("Sửa chữa") ← 修宮室 → không đổi |

## Bằng chứng từng mục

### 亢-2 — RESOLVED

Scan n46 (secondary-review.json scanTranscriptions): 「亢星造作長房當，十日之中主有[殃?]，田地消磨官失職，投軍定是虎狼傷，嫁娶婚姻用此日，兒孫新婦守空房，埋葬若還逢此日，當時災禍主重喪」. Câu chôn cất thật trên scan là 「埋葬若還逢此日」, cực tính hung mang bởi câu sau 「當時災禍主重喪」. 「投軍定是虎狼傷」 nói về tòng quân, không dùng làm bằng chứng cho burial.

Activity, scope, cực tính và review status không đổi (resolver chạy lại trên dữ liệu mới). Files: shared/almanac-data/mansion-content-yuxia-1880-v1.json (version 1.0.1 → 1.0.2), shared/almanac-data/manifest.json (version), shared/lunar/audit-fixtures/mansion-content-golden-v1.json, shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json (quote + verses).

Độ tin: ngữ nghĩa high, chép nguồn high.

### 房-2 — RESOLVED

Scan n48 (secondary-review.json scanTranscriptions): 「房星造作田園進，血財牛馬遍山岡，更招外處田庄宅，榮華富貴福壽康，埋葬若然用此日，高官進職拜君王，嫁娶嫦娥歸月殿，三年抱子至朝堂」. Sửa một chữ chép sai: 逢 → 用. Ngữ nghĩa giữ nguyên; cực tính cát mang bởi câu sau 「高官進職拜君王」.

Activity, scope, cực tính và review status không đổi (resolver chạy lại trên dữ liệu mới). Files: shared/almanac-data/mansion-content-yuxia-1880-v1.json (version 1.0.1 → 1.0.2), shared/almanac-data/manifest.json (version), shared/lunar/audit-fixtures/mansion-content-golden-v1.json, shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json (quote + verses).

Độ tin: ngữ nghĩa high, chép nguồn high.

### 心-2 — RESOLVED

Scan n49 (secondary-review.json scanTranscriptions): 「心星造作大為凶，更遭刑訟獄囚中，忤逆官非田宅退，埋葬卒暴死相從，婚姻若是逢此日，子死兒亡泪滿胸，三年之內連遭禍，事事教君没始終」. Câu chôn cất của Tâm là 「埋葬卒暴死相從」; bản thân câu đã nêu hung (chết đột ngột nối nhau).

Activity, scope, cực tính và review status không đổi (resolver chạy lại trên dữ liệu mới). Files: shared/almanac-data/mansion-content-yuxia-1880-v1.json (version 1.0.1 → 1.0.2), shared/almanac-data/manifest.json (version), shared/lunar/audit-fixtures/mansion-content-golden-v1.json, shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json (quote + verses).

Độ tin: ngữ nghĩa high, chép nguồn high.

### 壁-2 — RESOLVED

Scan n58 (secondary-review.json scanTranscriptions): 「壁星造作進庄田，絲蚕大熟福滔天，奴婢自來人口進，開門放水出英賢，埋葬招財官品進，家中諸事樂陶然，婚姻吉利生貴子，早播名聲着祖鞭」. Quote cũ ghép từ 「奴婢自來人口進」 và 「婚姻吉利生貴子」. Thay bằng câu hôn nhân thật; câu tự mang cực tính cát.

Activity, scope, cực tính và review status không đổi (resolver chạy lại trên dữ liệu mới). Files: shared/almanac-data/mansion-content-yuxia-1880-v1.json (version 1.0.1 → 1.0.2), shared/almanac-data/manifest.json (version), shared/lunar/audit-fixtures/mansion-content-golden-v1.json, shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json (quote + verses).

Độ tin: ngữ nghĩa high, chép nguồn high.

### 斗-2 — RESOLVED

Scan n52 (secondary-review.json scanTranscriptions): 「斗星造作主招財，文武官員位鼎台，田宅錢財千萬進，墳堂修築富貴來，開門放水招牛馬，旺蚕男女主和諧，遇此吉星來照護，時支福慶永無災」. Thay quote bằng 「墳堂修築富貴來」 và thêm term 墳堂修築 cho funeral_grave_repair. Ngữ nghĩa xét theo tầng: (1) 墳 = mộ, nghĩa chính và chắc chắn (教育部重編國語辭典修訂本「墳」[名] 1: 「用土築成高起的墓」, cùng trang raw HTML ở trên); (2) 修築 = xây, đắp, sửa; cùng động từ với 角 「起工修築墳墓地」 trong cùng bộ ca (scan n45); (3) 教育部臺灣客語辭典「墳」條 (qua pedia.cloud.edu.tw/Entry/Detail/?title=墳, raw HTML SHA-1 44b67bd0fa4f, tải 2026-10-20): 「釋義：埋葬死者的地方。例：墳堂。」 Tier 2, chỉ là chứng cứ phụ. (4) Cách đọc thay thế: 堂 = 享堂/祠堂 cạnh mộ. Vẫn là công trình của phần mộ, nên không đưa clause ra khỏi funeral_grave_repair. Không có cách đọc nào khiến 墳堂 là nhà ở hay công trình dân dụng. Kết luận: đủ căn cứ cho term tối thiểu 墳堂修築 (nguyên cụm, không tách 墳堂 hay 修築 riêng để tránh khớp rộng).

Resolver: shared/lunar/ruleActivityMapping.ts thêm term 墳堂修築. 墳墓修築 giữ nguyên (cụm hợp lệ, chỉ không còn clause nào dùng; xem khuyến nghị). Regression test dùng quote đúng. Files: shared/almanac-data/mansion-content-yuxia-1880-v1.json (version 1.0.1 → 1.0.2), shared/almanac-data/manifest.json (version), shared/lunar/audit-fixtures/mansion-content-golden-v1.json, shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json (quote + verses).

Độ tin: ngữ nghĩa high, chép nguồn high.

### 婁-1 — RESOLVED

Giữ gap dựa trên ontology hiện hành, không dựa trên trùng chuỗi: (1) catalog activities.json đặt nhãn beam_raising = "Thượng lương" (上梁), tức nghi thức gác đòn dông; (2) mapping 用事 gán beam_raising cho nguyên heading 豎柱上梁 (cột + đòn dông là một nghi thức ghép), không cho 豎柱 riêng; (3) quyết định owner 2026-10-10 không tạo ID xây dựng hẹp (dựng cột, cao đường, tường…). Trên scan n60, 竪柱 đi với 起門庭 (dựng cột làm cổng/sân), không nhắc 上梁. Map 竪柱 → beam_raising sẽ mở rộng ý nghĩa activity quá thiết kế.

Bằng chứng tầng ontology là tài liệu dự án (Tier 3) — phù hợp vì câu hỏi là về ontology, không về nguồn. Nếu muốn ID riêng cho dựng cột: quyết định ontology mới.

Độ tin: ngữ nghĩa high, chép nguồn high.

### 柳-2 — NEEDS_PRIMARY_EVIDENCE

Scan n68 dòng 3 chỉ đọc chắc 「埋葬瘟_多__」. Chữ 4 có bộ 疒 (nét trong giống 旦 hơn 殳), chữ 6-7 trông như 「病死」. Phần chắc chắn (埋葬 + 瘟 + 多) đủ cho burial · hung; mapping không phụ thuộc chữ chưa đọc được.

SEMANTICALLY_RESOLVED / TRANSCRIPTION_UNCERTAIN. Quote production 「埋葬瘟疫多疾病」 KHÔNG được xác nhận và có thể sai ở chữ 4, 6, 7; không sửa vì không có chữ đọc chắc để thay. Cần ảnh rõ hơn của cùng bản in 1880 (bản in khác là văn bản khác, không thay được).

Độ tin: ngữ nghĩa high, chép nguồn low.

### 張-1 — NEEDS_ONTOLOGY_DECISION

Vấn đề ở quy tắc chung, không riêng 張-1. Trong bộ ca, 造/架 + tân ngữ công trình được xử lý hai kiểu: 造龍軒 (張, n70) → construction chung; 造高堂 (危, n56), 架高堂 (翼, n71), 造新房 (星, n69), 臨水造龍宮 (軫, n72) → gap hẹp. 軒 có hai nghĩa (hiên/lầu, hoặc xe); câu sau 「年年便見進庄田」 không phân định. Chưa có quy tắc nói khi nào "造 + công trình" là xây dựng chung.

Khuyến nghị (không sửa production): owner chọn một quy tắc cho 造/架 + công trình. (a) Mọi 造X với X là nhà/sảnh → construction (đổi 危-1, 翼-1, 星-1, có thể 軫-1); (b) chỉ 造作/修造/起造 là chung, 造X → gap (đổi 張-1 sang gap); (c) giữ nguyên và ghi rõ ngoại lệ 龍軒. Sau đó áp đồng loạt.

Độ tin: ngữ nghĩa medium, chép nguồn high.

### renovation — NEEDS_ONTOLOGY_DECISION

卷十一 tách bốn việc: 營建宮室 (dựng nhà, 御用), 修宮室 (sửa nhà/cung thất, 御用), 興造動土 (khởi công + động thổ, 御用; chú 「修造同」 gom 修造 của 民用/通書 vào đây), 破土 (đào đất việc táng). 修造 trong lịch dân gian là "tu tạo" = sửa và làm công trình nói chung, nên KHÔNG đồng nghĩa với 修宮室. "Sửa chữa" của catalog có thể là: (1) sửa nhà ở đơn thuần → 修宮室; (2) tu tạo theo lịch dân dụng → 興造動土 qua 修造. 宜 hai heading khác nhau (修宮室: 月恩四相時德三合福德開日; 興造動土 thêm 天德月德… và 天赦天願).

Lệch khỏi gợi ý fallback của task (NEEDS_PRIMARY_EVIDENCE): đối chiếu scan 四庫 chỉ xác nhận chữ, không quyết được "Sửa chữa" bao gồm gì, nên xếp NEEDS_ONTOLOGY_DECISION. Việc đối chiếu chú 「修造同」 với scan 四庫 vẫn còn mở; maintainer có thể đổi sang NEEDS_PRIMARY_EVIDENCE.

Độ tin: ngữ nghĩa medium, chép nguồn medium (Wikisource chưa hiệu đính).

## Thay đổi production

- `shared/almanac-data/mansion-content-yuxia-1880-v1.json`
- `shared/almanac-data/manifest.json`
- `shared/lunar/audit-fixtures/mansion-content-golden-v1.json`
- `shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json`
- `shared/lunar/ruleActivityMapping.ts`

Version nội dung `1.0.1 → 1.0.2` (theo tiền lệ sửa 角-3). Golden v2 viết tay: chỉ sửa 5 quote, reviewTerm của 斗-2, glossary, và thêm bản chép scan của 亢/房/心/斗/壁 vào `verses` (chữ chưa chắc ghi là □). Không tái sinh golden từ production.

## Tests

- shared/lunar/ruleActivityMapping.test.ts (+1: 斗-2 regression on 墳堂修築富貴來)
- shared/lunar/mansionContentAuthority.test.ts (+1: lock 5 corrected quotes)

Kiểm đột biến: bỏ term 墳堂修築 thì 2 test fail (golden v2 và regression 斗-2), đã khôi phục.

## Chứng nhận

- Reviewer #1: `SINGLE_REVIEWED` (giữ nguyên)
- Secondary review: `COMPLETE`
- Resolution: `SECONDARY_REVIEW_COMPLETE / DISAGREEMENTS_RESOLVED / UNCERTAINTIES_REMAIN`
- Baseline migration: `VERIFIED`
- 柳-2: `SEMANTICALLY_RESOLVED / TRANSCRIPTION_UNCERTAIN`
- Khuyến nghị: **chưa đủ điều kiện** `ELIGIBLE_FOR_DOUBLE_REVIEWED`. Chỉ maintainer quyết định chứng nhận.

## Khuyến nghị

- 張-1 / 危-1 / 翼-1 / 星-1 / 軫-1: chọn một quy tắc cho 造/架 + công trình rồi áp đồng loạt.
- renovation: owner định nghĩa "Sửa chữa" (sửa nhà ở vs tu tạo); đối chiếu chú 「修造同」 trên scan 四庫.
- 柳-2: tìm ảnh rõ hơn của cùng bản 1880 trước khi sửa quote.
- 墳墓修築 trong terms không còn clause nào dùng; giữ hay bỏ là quyết định riêng.
- docs/audits/28-mansion-content-provenance.md:32 (bản ghi lịch sử) chưa nhắc 墳堂修築.
