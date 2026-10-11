# Spec P4 — Cân bằng 宜/忌 卷十 và kích hoạt 21 thần

> Hướng triển khai được owner duyệt có điều kiện, 2026-10-11 (§9). Chưa hoàn tất authority/Golden; chưa phê duyệt activation, merge hoặc deploy.
> Baseline production: `93a513d5200ff7ef456852a524f863622d5f6a0c` (PR #47), sau Release A. P2/R5 đã hoàn tất.

## 1. Mục tiêu và phạm vi

Đưa quy tắc cân bằng của 協紀辨方書 卷十 vào kết luận **từng activity**, rồi kích hoạt đồng thời 21 thần đã có presence nhưng chưa tham gia sao/điểm. Kết luận phải giải thích được: thần nào hiện diện, điều kiện nào khớp, 宜/忌 nào được giữ hoặc gỡ, ngoại lệ nào ngăn gỡ. P5 warehouse nằm trong release này.

Phạm vi đề xuất:

- Bảng 宜忌等第 và 鋪註條例, chỉ các heading map được vào 32 activity hiện hành.
- 宜/忌 theo từng thần, gồm điều kiện đồng hiện; mở rộng resolution ngoài sáu chain đang chấm điểm.
- 7 cát + 14 hung dormant: presence, hiển thị, evidence và scoring cùng một activation.
- Giữ 專忌/百忌日, xử lý ngoại lệ 遇德猶忌; đưa kết quả đã resolve vào event evaluator hiện hành.
- Golden độc lập, mutation, migration, smoke và rollback trước activation.

Không đổi astronomy/calendar core, Month Jian/exact Jie, 28 Tú scoring OFF, activity taxonomy, event mapping, personal conventions, Sát Chủ, 土王用事 chưa rõ nguồn hoặc policy đếm thần giữa activity chính/phụ (R2). Không thêm global auspiciousness score. P1 suppression 求福/祈嗣 trên ngày Dần là scope riêng; nếu muốn nhập vào P4 phải ghi quyết định riêng và Golden trước code. Heading chưa map vẫn unmapped.

## 2. Baseline cần giữ

| Thành phần | Trạng thái trước P4 |
|---|---|
| 卷十 scorer | ON, sáu chain 月建/月破/平日/收日/閉日/刼煞; có deferral sang 月厭/月刑/月煞/災煞 |
| Legacy presence | 14 thần theo Month Jian, `legacyGodsMonthJian: true` |
| Presence đã audit | 35 definitions + evaluator, gồm 21 dormant |
| Chuyên kỵ production | 甲/乙/丁/寅/酉/申/未/巳/亥; manifest thật, 1095 ngày có invariants |
| Event `very_high` | Activity chính còn applied negative hoặc hard warning → `event_fit` fail |
| Score adapter | Base 50, weights/caps/thresholds hiện hành; classical 忌 không tự là hard veto |

Các số +7/+21 trong audit dormant được đo **trước Release A**. Không dùng chúng làm dự báo hoặc acceptance của P4. Migration mới phải chạy trên baseline sau Release A ở commit trên; nếu main có thay đổi runtime mới thì ghi lại baseline trước khi đóng băng báo cáo.

## 3. Authority và phần còn thiếu

Nguồn chính:

1. [卷十 text](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷10), revision `oldid=787351`; raw SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025` (cùng nguồn audit hiện có).
2. [卷十一](https://zh.wikisource.org/wiki/欽定協紀辨方書_(四庫全書本)/卷11) cho heading và danh sách thần; không dùng danh sách này thay luật cân bằng 卷十.
3. [Scan 四庫全書 卷九–卷十, item 06067686.cn](https://archive.org/details/06067686.cn), Zhejiang University/CADAL. Bảng ở [n220](https://archive.org/download/06067686.cn/page/n220_w1200.jpg) và [n221](https://archive.org/download/06067686.cn/page/n221_w1200.jpg); 鋪註條例 bắt đầu [n222](https://archive.org/download/06067686.cn/page/n222_w1200.jpg), tiếp [n223](https://archive.org/download/06067686.cn/page/n223_w1200.jpg). `nN` là chỉ số ảnh của archive, không phải số trang in; trang in bảng là 七十三.

**Phát hiện:** text Wikisource có tiêu đề 宜忌等第表 nhưng bỏ trống nội dung bảng. Vì vậy một implementation chỉ đọc raw text là thiếu authority. Đã lưu và đối chiếu hai scan, chép đủ 66 ô và 28 dòng 鋪註條例; bản chứng cứ/partial Golden đóng băng v1 `08e2aaf`, v2 đọc ảnh sửa tại `19e8673`. Xem [`audit khóa nguồn`](../audits/p4-vol10-authority-lock.md) và [`bản chép`](../audits/p4-vol10-transcription.md). Còn ambiguity về predicates/precedence, chưa chứng nhận scoring. Không dùng OCR XML của archive làm Golden vì nhận dạng chữ không đáng tin.

Trước code cần artifact authority có: ID/version, trích Hán văn, ảnh + locator, SHA-256 của bytes nguồn đã lưu, bản chép từng ô, predicate, operand, heading mapping, ngoại lệ, convention và người review. Bản chép phải bao phủ cả ô trống; ô trống nghĩa là không có entry tại vị trí đó, không suy thành trung tính. Có bản text kèm offset cho 鋪註條例; offset phải tính trên đúng raw/hash đã khóa.

### 3.1 Sáu cấp trong bảng — bản đọc để review

Bản đọc này được đối chiếu cột cấp n220 với phần 按 平日; grade actions đã có partial Golden khóa v1 `08e2aaf`, v2 metadata `19e8673`, chưa là final annotation/score oracle. `德` trong bảng cần có danh sách predicate riêng; không tự coi mọi cát thần là 德, cũng không mặc định đồng nhất với nhóm 德合赦願 của một điều khoản khác.

| Cấp | Mô tả | Gặp 德 | Không gặp 德 |
|---|---|---|---|
| 上 | 吉足勝凶 | 從宜不從忌 | 從宜不從忌 (câu của bảng không chia nhánh 德) |
| 上次 | 吉足抵凶 | 從宜不從忌 | 亦從宜亦從忌 |
| 中 | 吉不抵凶 | 從宜不從忌 | 從忌不從宜 |
| 次 | 凶勝於吉 | 從宜亦從忌 | 從忌不從宜 |
| 下 | 凶又逢凶 | 從忌不從宜 | 諸事皆忌 |
| 下下 | 凶疊大凶 | 諸事皆忌 | 諸事皆忌 |

**Không đồng nhất** `亦從宜亦從忌` với `吉凶相抵不註宜亦不註忌`: một trường hợp giữ cả hai, trường hợp kia không ghi cả hai. Phải audit điều kiện của hai trường hợp trước khi mã hóa. Không dùng số lượng sao tốt/xấu hoặc tổng trọng số để suy cấp.

Bảng có cột 平日/收日/閉日/劫煞/災煞 ở n220 và 月煞/月刑/月害/月厭/大時/天吏 ở n221. Đã chép toàn bộ ô; còn cần khóa predicates tháng + đồng hiện + Trực, kiểm tổ hợp không thể xảy ra và giải quyết P4-A03–A05. Bảng source-role đủ 53 IDs hiện hành đã khóa; không phải bảng rank hoặc canonical class resolver đầy đủ. Nhiều entry khớp: chưa khóa cách chọn/ghép; đề xuất ưu tiên mức nghiêm hơn chỉ được dùng sau khi tìm được căn cứ hoặc owner chốt thành convention có tên. Không âm thầm lấy entry đầu tiên.

### 3.2 Các điều khoản phải biểu diễn được

- 「凡吉足勝凶從宜不從忌者如遇徳猶忌之事則仍註忌」 và câu tương tự cho 吉凶相抵: ngoại lệ còn kỵ luôn được giữ.
- 「凡徳合赦願月恩四相時徳等日不註忌…」: chỉ bỏ kỵ cho danh sách heading được nêu; nếu 遇德猶忌 hoặc 從忌不從宜 thì vẫn kỵ. Không biến việc được bỏ kỵ thành 宜.
- Propagation giữa 求福/求嗣, các việc cưới hỏi, 移徙/安牀, 解除/grooming, xây dựng, 開市/立券交易/納財, livestock, 安葬/啟攢: trích từng clause và mapping riêng, giữ ngoại lệ chuyên kỵ. Không phát triển một heuristic “việc gần giống thì cùng kết luận”.
- 不將 không miễn các kỵ khác của hôn lễ. 亥日/厭對/八專/四忌/四窮 không được diễn giải thành cấm toàn bộ heading hôn lễ khi nguồn chỉ giữ chuyên kỵ của chúng.
- 丁日 剃頭 và suppression 整容 phải phân biệt: một heading kết hợp ở taxonomy không được xóa kỵ cắt tóc chỉ vì điều khoản gỡ phần chỉnh dung.
- Các điều khoản dùng thần chưa có presence, như 歲薄/逐陣, cần explicit unsupported/unknown; không tự coi absent. Tám can-chi có ngoại lệ cuối 鋪註條例 phải audit độc lập trước khi đưa vào scope.

## 4. Contract resolution

Mô hình đề xuất; tên TypeScript/file cuối cùng có thể điều chỉnh, semantics phải giữ:

```text
DayContext = monthJianBranch + dayStem + dayBranch + officerId
             + presence(known-present / known-absent / unknown)
AuthorityClause = id + source + heading + predicate + effect + exceptions
ResolvedActivity = applicableClauses + matchedGrades + selectedGrade
                   +宜 evidence +忌 evidence + protectedTaboos + unknowns + trace
```

Trạng thái annotation phải tách bốn giá trị: `both_present` (có cả 宜/忌), `only_yi`, `only_ji`, `neither_recorded` (nguồn quy định không ghi cả hai). `neither_recorded` không phải status “neutral”, không phải thiếu nguồn (`unknown`/`not_listed`), và không tự cho phép event. Activity status được tính riêng sau resolution/adapter; protected taboo vẫn được ghi riêng ngay cả khi annotation trong scope là `neither_recorded`.

Bảng thần → class phải khóa trước code scoring: mỗi stable god ID có class theo từng clause/context, source locator, predicate, balancing eligibility và trạng thái review. Không suy class từ nhãn sao tốt/xấu, dấu trọng số hoặc alias. Nếu nguồn không đủ thì class là unknown, không tự gán vào 德/cát/hung để chọn cấp.

Mỗi clause phải trả match / no_match / unknown. Unknown không được kích hoạt miễn kỵ, nâng mức thuận lợi hoặc giả thành false để chọn nhánh ưu đãi. Nếu thiếu operand của clause liên quan, giữ evidence đã chứng minh, ghi thiếu căn cứ; không biến cả ngày thành “xấu” và không dựng một penalty cho unknown. Phân biệt `not_listed`, `no_annotation`, `not_avoided`, `avoid`, `undetermined` của resolver hiện hành.

Luật cấp ngày chỉ xử lý evidence truyền thống thuộc authority scope của nó; không gỡ hướng năm, personal rule, 百忌日 hoặc source khác bằng một “good day” tổng quát. Mỗi effect chỉ áp dụng một lần cho `(clause, activity, scope)`; chuỗi deferral giữ đường đi, chống vòng lặp và không tạo duplicate penalty khi đến cùng đích.

### 4.1 Thứ tự xử lý đã duyệt có điều kiện

1. Tính context/presence theo evaluator đã audit; gom raw evidence cho activity.
2. Resolve các clause cụ thể, co-presence và deferral; thu thập tất cả entry 等第 khớp.
3. Áp policy cấp/德 đã khóa; áp propagation có căn cứ.
4. Giữ lại 遇德猶忌/專忌 và hard warning; áp suppression đúng heading.
5. Chuyển evidence còn hiệu lực sang scoring adapter, **rồi phân bổ cap** một lần.
6. Tính general score/status theo policy hiện hành; personal modifier theo pipeline hiện hành; event tiêu thụ applied evidence cuối cùng.

Hiện god caps được phân bổ trước 卷十. Khi gỡ một dòng đã ăn cap, phần cap còn lại có thể không được phân bổ cho dòng còn hiệu lực. Owner đã duyệt resolution trước cap có điều kiện; thay đổi này có thể ảnh hưởng cả ngày không có dormant god, phải phân rã tác động trong migration trước activation. Flag OFF phải giữ đường cũ chính xác.

Trace giữ `rawDelta` ban đầu, effect/authority, effective delta trước cap, applied delta sau cap, lý do bị gỡ và lý do còn kỵ. Dòng informational có applied delta 0; lịch sử trace còn thấy clause, UI không gọi nó là kỵ đang hiệu lực. Presence sao không biến mất chỉ vì kỵ của sao được gỡ.

### 4.2 Adapter điểm — hướng triển khai đã duyệt

| Kết quả cổ điển | Hành vi evidence/điểm |
|---|---|
| 從宜不從忌 | Giữ 宜, gỡ 忌 trong scope; giữ protected taboo |
| 亦從宜亦從忌 | Giữ cả hai; không triệt tiêu chỉ vì cùng magnitude |
| 從忌不從宜 | Giữ 忌, suppress 宜 trong scope |
| 不註宜亦不註忌 | Cả hai informational 0 trong scope; protected taboo vẫn áp dụng |
| 諸事皆忌 | Penalty mặc định có nhãn product policy, không hard veto và không tham gia balancing ở release đầu |

Không tự sinh điểm dương khi chỉ “không kỵ”; không lấy điểm sao làm authority xác định 等第. Giữ magnitude/weights, thresholds và caps hiện hành. Không tự tạo positive weight mới.

`諸事皆忌` và clause đã chứng minh áp dụng nhưng thiếu dòng âm dùng penalty mặc định `-25`, không hard warning, có nhãn `product_policy_default_penalty`; provenance tách **clause nguồn** khỏi **magnitude do sản phẩm chọn**. Release đầu đặt `balancingEligible: false`: penalty này không là đầu vào chọn cấp/cân bằng và không bị balancing gỡ hoặc đổi dấu. Chỉ thêm sau resolution canonical, trước cap cuối cùng; không cộng lại nếu cùng clause/activity/scope đã có penalty. Phải kiểm chống trùng với sáu chain cũ. Clause chưa xác định áp dụng (unknown) không sinh penalty mặc định.

Contract bắt buộc có `evidenceOrigin: canonical | product_policy`, `policyId` cho policy, `sourceClauseId` khi có căn cứ nguồn, và `balancingEligible`. UI/explain/report phải gọi đúng “điểm trừ mặc định của ứng dụng”, không mô tả magnitude hay lựa chọn bảo thủ là quy tắc của sách.

Giữ `hardWarningKeepsWorseScoreStatus: true`, `hardVetoFromClassicalJi: false`, 28 Tú OFF. Mọi protected 百忌日 phải vượt qua suite production thật sau P4. `event_fit` của `very_high` giữ nguyên: xét applied negative cuối cùng, không xét raw negative đã được gỡ. Có hard warning vẫn fail. Nếu owner muốn đổi policy này thì tách quyết định và ma trận test riêng.

## 5. Activation 21 thần

| Nhóm | IDs theo catalog |
|---|---|
| 7 cát | `thien_nguyen`, `tu_tuong`, `thoi_duc`, `ngu_hop`, `bat_tuong`, `thien_thuong`, `pho_ho` |
| 14 hung | `tai_sat`, `nguyet_sat`, `nguyet_hai`, `nguyet_yem`, `yem_doi`, `dai_thoi`, `tu_phe`, `tu_ky`, `tu_cung`, `ngu_mo`, `ngu_ly`, `vang_vong`, `bat_chuyen`, `quy_ky` |

Dùng definitions/tables đã audit; không thêm bảng tính tháng âm thứ hai. Giữ quyết định 不將 bỏ 六月戊午, 五富 順行, 往亡 không đồng nhất 氣往亡; không tự kích hoạt 氣往亡.

Một flag activation đề xuất `xiejiVol10BalancingEnabled` điều khiển đồng thời full balancing và 21 thần vào sao/evidence/scoring. `false` giữ production trước P4, 14 legacy vẫn theo Month Jian và sáu chain scorer vẫn ON. Không phát hành trạng thái chỉ bật 7 cát hoặc chỉ bật 21 thần. Nếu tách presence flag để chẩn đoán, nó chỉ được dùng trong test/report, không thành config production được hỗ trợ.

UI dùng tên/alias catalog, stable ID; giữ thứ tự sao legacy và nối dormant theo thứ tự catalog ổn định. “Xem thêm” hiển thị đủ sao; dòng giải thích phân biệt “có sao”, “kỵ đã được gỡ” và “kỵ vẫn áp dụng”. Không đưa cấp nội bộ thành điểm ngày tổng quát.

## 6. P5 — warehouse

`warehouse` = 修倉庫 (sửa kho); `warehouse_opening` = 開倉庫出貨財 (mở kho xuất hàng). Hai activity khác nhau; không gộp heading hoặc dùng miễn kỵ mở kho để cho phép sửa kho.

| Clause 修倉庫 | Predicate cần chép/khóa từ 卷十 |
|---|---|
| 母倉 | 母倉 AND ANY(月恩, 四相, 開日) |
| 收日 | 收日 AND ANY(月恩, 四相, 時德) |
| 六合 / 五富 | Thần tương ứng AND ANY(月恩, 四相, 時德) |
| 天倉 | 天倉 AND ANY(月恩, 四相, 開日); đối chiếu ghi chú 時德 không đồng hiện |
| 德合赦願 | Clause 宜 độc lập theo nguồn, không yêu cầu có 收日 |

Đây là predicate đề xuất từ đọc nguồn; phải khóa câu và kiểm 月恩/四相/時德/開日 từng tổ hợp. Danh sách “與…併” không được biến thành AND tất cả partner. 收日 không đồng thời là 開日; ca không thể đồng hiện phải có negative fixture.

開倉庫出貨財: xét clause 德合赦願/月恩/四相/時德 và propagation 開市/立券交易. Giữ 遇德猶忌/從忌不從宜/專忌. Audit 月煞 (alias Nguyệt Hư) và 月厭 riêng, không gỡ tất cả warehouse penalties chỉ vì có một cát thần.

## 7. Golden, mutation và migration

### 7.1 Golden độc lập trước implementation

Artifact đề xuất `golden-xieji-vol10-balancing.json`, cùng authority transcription và schema validation. Authoring từ nguồn + phép tính operand độc lập; không gọi resolver/scorer production để sinh expected. Ghi commit đóng băng, checksum, reviewer và convention. Expected gồm present IDs, matched clause/cấp, effect từng heading, protected taboo, effective evidence; score adapter có expected riêng sau khi owner duyệt.

Coverage tối thiểu:

- 12 Month Jian × 60 can-chi hợp lệ = 720 context, mỗi ô bảng có positive/negative witness hoặc chứng minh impossible; không dùng 10×12 can-chi vô hiệu.
- Sáu cấp × có/không 德; bốn trạng thái annotation độc lập; `neither_recorded` khác neutral/unknown; nhiều entry khớp, không entry, unknown operand, missing authority. Bảng thần → class kiểm đủ IDs và provenance. Penalty product policy không tham gia balancing, không sinh từ unknown, không trùng penalty canonical.
- Cả 21 thần: có/vắng, tháng/mùa đổi, boundary trước/đúng/sau exact Jie, aliases đúng stable ID.
- Mỗi clause miễn kỵ: protected/unprotected, có/không partner, heading có/không map. Cả chín 百忌日, riêng ngày Hợi cưới hỏi và ngày Tỵ xuất hành qua event có/không giờ.
- Warehouse: base-only, partner-only, mỗi partner riêng, multiple partner, impossible co-presence, 德 độc lập, sửa kho khác mở kho.
- Cap reallocation, deferral hội tụ/vòng lặp, duplicate effect, thứ tự input không ảnh hưởng kết quả; không xóa raw evidence.
- Event `very_high`: applied negative còn → fail; chỉ negative được gỡ → theo evidence còn lại; hard warning → fail. Không biến `no_evidence` thành pass.

Mutation phải bắt: bỏ một dormant god; đổi Month Jian thành lunar month; ANY partner thành ALL; bỏ 專忌 exception; unknown thành absent; gộp `亦從宜亦從忌` với 不註; bỏ branch 德; chạy cap trước resolution; duplicate penalty; sửa event đọc raw thay applied. Chạy mutation tuần tự, phục hồi tree sau mỗi lần.

### 7.2 Migration trên production sau Release A

Đo 1095 ngày 2025–2027 × 32 activities × 11 event profiles; event có/không giờ, cùng input personal cố định nếu dùng để xem UI. Ghi toàn bộ input và flags để tái hiện. Chạy thêm fixture boundary exact Jie độc lập với sweep ngày.

Bốn cấu hình chẩn đoán: baseline / presence-only / balancing-only / full P4. Hai cấu hình giữa chỉ để phân rã nguyên nhân. Full P4 cần TSV cho activity và event: date, operands, added/removed stars, clause/cấp/德, protected taboo, raw/effective/applied delta, cap, score/status trước–sau, event_fit, change classification và source ID.

Mọi thay đổi kết luận phải thuộc `EXPECTED_AUTHORITY_MIGRATION_CHANGE` có trace giải thích; `UNEXPECTED_REGRESSION` = 0 trước activation. Không lấy tổng recommended tăng/giảm làm bằng chứng đúng nguồn. Báo cáo transition matrix, changed dates, phân rã 21 thần/balancing/warehouse/cap, và ca có tác động lớn nhất để owner review.

Giữ Golden lịch sử đã khóa; migration lịch sử pin config cũ trong test riêng. Không pin suite production P2/R5 về flag cũ hoặc sửa expected theo output mới.

## 8. Kế hoạch thực hiện và gates

| Bước | Deliverable | Điều kiện hoàn tất |
|---|---|---|
| 1. Khóa nguồn | Bản chép đầy đủ 等第 + 鋪註條例, bảng thần → class, authority records/mapping | Không ô mơ hồ bị suy diễn; các convention được ghi và duyệt |
| 2. Khóa adapter | Cụ thể hóa các điều kiện đã duyệt ở §9 | Scope/penalty/precedence rõ, gồm cap và event |
| 3. Golden | Fixtures + verifier độc lập | Commit đóng băng trước resolver/scorer mới |
| 4. Resolver | Clause predicates, grades, exceptions, traces | Golden + unknown + warehouse + mutation qua |
| 5. Adapter/activation OFF | Pipeline/caps + 21 sao qua flag | Flag OFF tương đương baseline; P2/R5 manifest thật qua |
| 6. Migration | TSV + matrices + phân loại | Không regression chưa giải thích, owner review full P4 |
| 7. Activation PR | Flag ON + release evidence + UI smoke | Typecheck/lint/unit/emulator/Playwright/gates bắt buộc xanh |
| 8. Merge/deploy | CI main deploy + bundle SHA + smoke | Owner cho phép merge; kiểm production rồi cập nhật context |

Sau code chạy `graphify update .`. Đo thời gian tính lịch và chọn ngày cùng input/máy trước–sau; điều tra regression đáng kể, không tự công bố budget khi chưa có số baseline.

Smoke trước/sau release: ngày có mỗi nhóm dormant, ca cấp có/không 德, warehouse co-presence, protected Hợi/Tỵ, event very_high, xem thêm sao, đổi ngày, app update/service worker. Dùng desktop Chrome, Pixel 7, Safari desktop như Release A; ghi iPhone/Firefox chưa chạy nếu chưa có bằng chứng. Bundle production phải trùng SHA-256 build release.

Rollback: một PR đổi `xiejiVol10BalancingEnabled` về false → CI/deploy → SHA/smoke, giữ `legacyGodsMonthJian` và sáu chain hiện hành ON. Không sửa Golden/authority để rollback. Flag OFF phải phục hồi sao/điểm baseline, ngoại trừ thay đổi runtime độc lập được ghi rõ.

## 9. Quyết định owner — duyệt có điều kiện (2026-10-11)

Owner duyệt hướng triển khai: ưu tiên chứng cứ; chưa xác định thì không kích hoạt; resolution trước cap; không cộng điểm chỉ vì miễn kỵ; giữ thresholds/caps/hard warning/`event_fit`; bật đủ 21 thần + balancing + P5 cùng flag, P1 riêng. Đây là duyệt hướng thực hiện, không thay thế go-live review hoặc cho phép merge/deploy.

Bốn điều kiện bắt buộc:

1. **Trước code scoring:** khóa bản chép đầy đủ 等第 và bảng ánh xạ thần → class. Nhóm 德, điều kiện 不註 và xử lý nhiều entry phải có chứng cứ; phần chưa giải quyết chưa kích hoạt.
2. **Contract:** tách `both_present`, `only_yi`, `only_ji`, `neither_recorded`. Không gộp “không ghi” với status trung tính hoặc unknown.
3. **Penalty:** `諸事皆忌` và clause đã xác định áp dụng nhưng thiếu dòng âm dùng penalty mặc định có nhãn product policy; không tham gia balancing ở release đầu. Default `-25` theo phương án đã trình, không hard warning; kiểm provenance và chống phạt trùng trước activation.
4. **Go-live:** đủ 21 thần + balancing + P5 cùng activation; Golden độc lập khóa trước code, diff report phân loại đầy đủ và rollback flag đã kiểm chứng là gates bắt buộc.

**Ranh giới authority:** “thận trọng” không được ghi thành quy tắc nguồn. Mọi fallback bảo thủ phải có product policy ID/nhãn, giải thích và test riêng. Không có căn cứ canonical thì không tự chọn cấp xấu nhất; nếu đề xuất fallback mới phải ghi là policy sản phẩm và review trước activation.

Chứng cứ, bản chép toàn bảng, source-role inventory và partial Golden đã khóa v2 (`19e8673`); contract annotation có gate kiểm. Việc tiếp theo là giải quyết ambiguity P4-A03–A05, khóa canonical predicates/class resolver và full Golden per-heading/presence/warehouse trước scoring. Chưa bật flag, chưa đổi runtime; các ambiguity nguồn vẫn là việc điều tra, không được coi đã giải quyết bằng quyết định duyệt hướng triển khai.
