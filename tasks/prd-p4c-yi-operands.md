# PRD — P4-C: hoàn thiện 11 operand 宜 của 協紀

Ngày: 2026-10-13.
Trạng thái: PRD đã chốt tiêu chí nghiệm thu; chưa triển khai.
Quyết định owner: **1A — chỉ hoàn tất khi cả 11 operand có authority được chốt**. Nếu còn thiếu hoặc mâu thuẫn nguồn, giữ unknown và P4-C chưa được nghiệm thu.

## 1. Introduction / Overview

P4-B đã merge và deploy qua PR #54 (`1ad9b4b`), hoàn tất phần operand 凶 trong audit ngày. Phần 宜 vẫn thiếu 11 thần: 母倉、福德、天恩、天巫、天后、天醫、除神、驛馬、天馬、吉期、鳴吠. Vì vậy, một số heading chưa thể xác định đầy đủ có ghi 宜 hay không.

P4-C bổ sung presence có căn cứ nguồn cho đúng 11 thần này và ghép vào audit 29 heading trước 鋪註. Presence nghĩa là thần có mặt (`present`), có đủ dữ kiện để xác nhận không có mặt (`absent`), hoặc chưa xác định được (`unknown`). Có mặt không đồng nghĩa được cộng điểm hay miễn mọi 忌.

Đây là roadmap mục 5 của [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), theo [spec cân bằng 卷十](../docs/plans/p4-xieji-vol10-balancing.md). P4-C tạo evidence để tiếp tục P5; không kích hoạt thay đổi sản phẩm.

## 2. Goals

1. Chốt authority và predicate cho **11/11 thần**: nguồn, input cần thiết, quy tắc presence, phạm vi heading, giới hạn và tình trạng review đều có thể kiểm tra lại.
2. Đóng băng Golden độc lập trước implementation. Không dùng output resolver, scorer hoặc tổng số hiện hành làm expected.
3. Ghép operand vào audit và loại bỏ tình trạng thiếu chính 11 operand này trong miền có đủ input và nằm trong phạm vi authority.
4. Đo trước/sau trên 1.095 ngày 2025–2027 × 29 heading; giải thích thay đổi 宜, trạng thái heading và propagation bằng trace.
5. Giữ nguyên runtime production, scoring, manifest và các quyết định authority P4-B đã chốt.

## 3. User Stories

- Là người audit nguồn, tôi muốn truy từ mỗi presence đến nguyên văn, offset và checksum để kiểm tra kết luận không được suy từ tên sao hoặc điểm tốt/xấu.
- Là người phát triển, tôi muốn biết input cần cho từng predicate và cách xử lý thiếu input để không vô tình biến unknown thành absent.
- Là người review, tôi muốn xem Golden đã khóa trước code, các ca âm/dương và báo cáo trước/sau để phân biệt thay đổi có căn cứ với regression.
- Là owner, tôi muốn P4-C chỉ được đánh dấu hoàn tất khi đủ 11 operand đã chốt, để chuyển sang P5 trên một nền audit rõ ràng.

## 4. Functional Requirements

### 4.1. Inventory và authority

**FR-01.** Hệ thống audit phải có inventory chính xác gồm 11 tên sau; 王日 đã có operand và chỉ là regression control:

| # | Thần cần bổ sung |
|---|---|
| 1 | 母倉 |
| 2 | 福德 |
| 3 | 天恩 |
| 4 | 天巫 |
| 5 | 天后 |
| 6 | 天醫 |
| 7 | 除神 |
| 8 | 驛馬 |
| 9 | 天馬 |
| 10 | 吉期 |
| 11 | 鳴吠 |

**FR-02.** Mỗi entry phải có stable ID, tên Hán/alias nếu có, authority ID/version/status, nguyên văn định nghĩa 協紀, volume/locator, raw SHA-1 và offset Unicode code point tính trên chính bytes đã khóa. Các file evidence lưu kèm SHA-256. Nếu dùng scan, phải có locator ảnh, checksum và bản chép đọc được; OCR chỉ phục vụ tìm kiếm.

**FR-03.** Mỗi entry phải ghi rõ predicate, input, miền áp dụng và các ngoại lệ mà nguồn nêu. Phải phân biệt Month Jian, tháng âm, mùa, can/chi, vị trí ngày trong chu kỳ hoặc input khác nếu định nghĩa yêu cầu; không ép tất cả thần về cùng một kiểu predicate.

**FR-04.** Phải đối chiếu nguồn với definitions, bảng và nhãn đã có trong repo. Một nhãn trùng tên hoặc bảng sao Ngọc Hạp không tự trở thành authority 協紀. Mọi khác biệt phải có bảng đối chiếu và kết luận có căn cứ.

**FR-05.** Khi nguồn thiếu hoặc mâu thuẫn, entry giữ unknown và ghi vấn đề mở. Không tự chọn cách đọc vì thuận lợi cho test. Quyết định owner mới, nếu cần, phải ghi tên authority, ngày, phạm vi và status riêng; không tự nâng lên canonical. Chưa chốt đủ 11 entry thì P4-C chưa hoàn tất.

### 4.2. Presence và heading 宜

**FR-06.** Operand phải trả presence ba trạng thái cùng trace đủ tái hiện: input sử dụng, rule/authority ID và nguồn. Thiếu input hoặc ngoài coverage phải trả unknown; input không hợp lệ phải được báo rõ.

**FR-07.** Mỗi thần chỉ tạo evidence 宜 trên các heading được liệt kê trong 卷十一 đã khóa. Phải kiểm tra alias/chuẩn hóa heading, đặc biệt khi chữ nguồn và key evaluator khác nhau. Không mở rộng sang mọi activity vì thần mang tên cát.

**FR-08.** Với mỗi heading không nằm trong deferral P5, giữ quy tắc ghép 宜 hiện hành:

- Có ít nhất một thần được liệt kê và xác định present → có evidence 宜.
- Tất cả thần được liệt kê đều xác định absent → không có evidence 宜.
- Không có thần present và còn ít nhất một operand unknown → 宜 chưa xác định.

Trace vẫn phải ghi các operand unknown, kể cả khi một thần present khác đã đủ xác định 宜. Không dùng sự giảm `undetermined` làm bằng chứng rằng mọi operand đã hoàn tất.

**FR-09.** Bổ sung operand qua tầng audit và ghép trước propagation 鋪註. Khi thiết kế API, phải bảo toàn các API/oracle A04b và P4-B đã khóa; không sửa Golden cũ để phù hợp output mới. Artifact bổ sung hoặc sửa đổi phải có version và lock riêng.

**FR-10.** Phải giữ raw 忌, phạm vi bảo vệ, các exception và override ngày của P4-B, gồm `puzhu:28` và sửa 六月甲子 thành 甲午. Nếu evidence 宜 mới làm thay đổi propagation theo luật đã khóa, phải giải thích bằng trace và Golden độc lập; không yêu cầu số propagation giữ nguyên chỉ để khớp baseline.

**FR-11.** `修倉庫` tiếp tục thuộc deferral P5. Presence 母倉 có thể được chốt trong P4-C nhưng không được dùng để tự giải predicate warehouse co-presence. Các heading hoặc clause chưa giải ngoài phạm vi 11 operand phải được báo riêng.

### 4.3. Golden, kiểm tra và báo cáo

**FR-12.** Authority và Golden mới phải được đóng băng bằng commit/checksum trước implementation. Người tạo expected phải dùng nguồn và phép tính độc lập, không import/call resolver hoặc scorer đang được kiểm. Ghi phương pháp suy expected, người review và giới hạn review.

**FR-13.** Golden phải bao phủ cả 11 thần, present/absent và các biên predicate có ý nghĩa. Bổ sung ca thiếu input, ngoài coverage và alias khi áp dụng. Với predicate chỉ phụ thuộc Month Jian × pillar, kiểm toàn miền 12 × 60 = 720 context bằng phương pháp độc lập; predicate cần input khác phải có miền kiểm và fixture riêng, không coi 720 context là đủ.

**FR-14.** Phải lập baseline trước thay đổi trên cùng 1.095 ngày 2025–2027, 29 heading và cùng bộ input phase/lunar day/soil đã khóa. Ghi commit/tree và authority IDs. Báo cáo sau thay đổi phải có ngày, heading, presence/trace của 11 thần liên quan, 宜 trước/sau, raw/effective 忌, trạng thái trước/sau, unresolved và propagation nếu có.

**FR-15.** Summary phải phân tách tối thiểu:

- Coverage authority/presence cho từng thần và các input còn thiếu.
- Heading thiếu operand 宜 thuộc 11 thần, trước/sau.
- Heading vẫn `undetermined` do P5 hoặc lý do khác.
- Thay đổi trạng thái heading/propagation và nguyên nhân.
- Unresolved operand 凶, source conflicts và regression P4-B.

Không đếm tổng `undetermined` như số thiếu riêng 11 operand, không gán expected bằng số đo từ evaluator. Bản đồ nguyên nhân phải cho phép kiểm tra lại từng dòng.

**FR-16.** Mutation chạy tuần tự, bắt bằng assertion và phục hồi đúng source bytes. Bao phủ lỗi có ý nghĩa với từng loại predicate thực tế: bỏ operand, sai bảng/offset/chu kỳ, sai input tháng, unknown thành absent, sai heading và bỏ bảo vệ 忌/override khi ghép. Không tạo mutation vô nghĩa cho input mà predicate không dùng. Mutation gate phải được nối CI.

**FR-17.** Trước nghiệm thu phải qua unit/gate phù hợp, regression A04b/P4-B, build, main/functions typecheck, lint và CI. Test quét toàn miền phải đặt timeout phù hợp CI. So checksum bundle và diff runtime/manifest để chứng minh không thay production. Cập nhật graph bằng `graphify update .` sau sửa code.

**FR-18.** Cập nhật audit report, task progress và PROJECT_CONTEXT.md khi có evidence. Ghi rõ trạng thái authority của từng entry. Khi chưa đủ 11 entry được chốt, trạng thái vẫn đang làm/blocked theo vấn đề thực tế, không ghi hoàn tất hoặc chuyển roadmap sang P5.

## 5. Non-Goals / Out of Scope

- P5 warehouse co-presence và predicate ANY/ALL của warehouse.
- Full Golden P4 720 context × toàn bộ heading/grades/warehouse của roadmap 7; P4-C chỉ khóa Golden cho phạm vi operand và phép ghép đang làm.
- Score adapter, penalty, thresholds/caps, hard warning, manifest/flag, activation và UI production.
- Thay thế hoặc nâng authority soil P4-B thành canonical. `p4-soil-owner-convention-v1` vẫn là `OWNER_ADOPTED_SOURCE_DEPENDENT`; S1 onset/後/定氣 vẫn OPEN và không chặn P4-C.
- P1 百忌日, nội dung mansion, personal/Bazi hoặc các thần ngoài inventory 11.
- Merge/deploy tự động theo PRD; các bước này vẫn theo phê duyệt owner của project.

## 6. Design Considerations

Không có UI mới. Deliverable là authority, Golden, trace và audit report đọc được. Người review phải truy từ dòng báo cáo đến predicate, input và nguồn mà không cần suy ngược từ score.

Dùng tên Hán nguồn cùng stable ID; alias phải minh bạch. Báo cáo phải phân biệt một operand chưa xác định với một heading đã xác định nhờ evidence khác.

## 7. Technical Considerations

Điểm xuất phát đã kiểm tra:

- `shared/almanac-data/p4-vol10-day-composition-v2.json`: `yiEvidence.unknown` hiện đúng 11 tên; 王日 ở `seasonDays`; 修倉庫 ở `deferred` P5.
- `shared/lunar/p4DayComposition.ts`: `splitP4YiGods`, `yiEvidence`, `resolveP4Day`, `applyP4Propagation`; nơi ghép 宜 hiện hành.
- `shared/lunar/p4FullDayComposition.ts`: phép ghép P4-B cùng lunar day, phase và soil; regression bắt buộc.
- `shared/lunar/p4ContextBridge.ts`, `p4HeadingAnnotation.ts`: presence/deferral và phân loại heading cần giữ contract.
- `shared/almanac-data/xiejibianfangshu-yiji.json`: danh sách 宜 theo heading 卷十一.
- `shared/almanac-data/xieji-god-definitions.json`: tài liệu để đối chiếu definitions hiện có; phải kiểm provenance từng entry trước tái sử dụng.
- `shared/lunar/p4SeasonDays.ts`: 王日 đã có authority, không đưa lại vào inventory thiếu.
- `docs/audits/sources/p4-vol10/`: evidence đã khóa; thêm file/version mới thay vì viết lại lock lịch sử.
- `.github/workflows/ci.yml`: có gate P4-B; cần nối gate P4-C phù hợp.

Tên file đề xuất, có thể điều chỉnh khi thiết kế nhưng phải giữ liên kết và version rõ ràng:

- `shared/almanac-data/p4-yi-operands-v1.json` — authority 11 thần.
- `shared/almanac-data/golden-p4-yi-operands-v1.json` — expected độc lập.
- `shared/lunar/p4YiOperands.ts` và test cạnh module — evaluator audit-only.
- `docs/audits/p4-vol10-yi-operands.md` — nguồn, quyết định, coverage, kết quả kiểm tra.
- TSV/summary trước-sau và source/Golden locks trong các thư mục audit hiện hành.
- `scripts/audit-p4-yi-mutations.py` — mutation runner tuần tự.

Thứ tự thực hiện: lập baseline/inventory → đọc và chốt authority 11 entry → đóng băng Golden → viết test đỏ → implementation audit → diff/mutation/regression/CI → cập nhật nghiệm thu. Trước thay symbol, kiểm callers/blast radius; tránh sửa production helper chỉ để phục vụ audit.

PRD này chưa chốt predicate cụ thể của từng thần. Predicate phải được rút từ nguồn trong bước authority; các tên file trên không phải giấy phép suy quy tắc từ tên thần.

## 8. Success Metrics / Acceptance Gate

P4-C chỉ được đánh dấu hoàn tất khi **tất cả** điều kiện sau đúng:

1. **11/11 authority được chốt**, có nguồn/locator, offset/checksum, predicate/input/coverage và kết quả review; không còn entry chưa giải quyết được tính là hoàn tất.
2. **11/11 operand đã ghép vào audit**; các context đủ input trong coverage không còn unknown do chưa triển khai chính 11 thần này. Thiếu input/ngoài coverage vẫn giữ unknown đúng contract.
3. Golden độc lập mới khóa trước code; hashes nguồn/Golden cũ bất biến. Cả present, absent và biên có nghĩa đều được kiểm.
4. Báo cáo đủ **1.095 ngày × 29 heading = 31.755 dòng**, có số trước/sau và trace giải thích thay đổi; thiếu operand 宜 do 11 thần được loại bỏ trong miền đầy đủ input. Không yêu cầu tổng trạng thái `undetermined` bằng 0 vì P5/lý do ngoài scope có thể còn.
5. Unresolved operand 凶 vẫn **0** trên miền sweep đủ input P4-B; không có source conflict/regression mới chưa giải thích. Mọi thay đổi propagation do evidence 宜 mới có căn cứ, bảo vệ 忌 và `puzhu:28` vẫn đúng.
6. Mọi mutation đã đăng ký bị assertion bắt; bytes được phục hồi; gate CI qua cùng các regression/checks bắt buộc.
7. Runtime/manifest/scoring bất biến; bundle production-build vẫn trùng baseline runtime `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969` nếu không có thay đổi runtime ngoài P4-C được duyệt riêng.
8. Audit report và PROJECT_CONTEXT.md đã cập nhật với evidence chính xác; P5 chỉ là bước kế tiếp sau khi gate này đạt.

Nếu bất kỳ entry nào còn thiếu/mâu thuẫn nguồn: giữ unknown, ghi evidence và việc cần owner quyết; **không nghiệm thu partial**. Giảm số dòng unknown hoặc CI xanh không thay thế gate 11/11 authority.

## 9. Open Questions

Không còn câu hỏi về phạm vi và mức nghiệm thu: owner chọn 1A. Những vấn đề sau phải được giải trong bước đọc nguồn, chưa được tự coi là đã chốt:

- Volume/locator và predicate chính xác cho từng thần; alias hoặc cách đọc nào có khác biệt giữa các bản?
- Thần nào cần input ngoài Month Jian và pillar, và coverage độc lập phải khóa ra sao?
- Definitions/nhãn hiện có nào đủ provenance để tái sử dụng, entry nào phải tạo authority mới?
- Reviewer và mức review nguồn thực tế: nếu chỉ một người/agent review thì phải ghi giới hạn, không nhận là review độc lập thứ hai.

Bắt đầu implementation chỉ khi bước authority/Golden cần thiết đã hoàn tất. Việc tạo PRD không phải yêu cầu triển khai code, bật flag, merge hoặc deploy.
