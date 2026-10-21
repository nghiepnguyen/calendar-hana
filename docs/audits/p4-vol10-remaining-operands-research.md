# P4-B — phương án giải quyết operand còn thiếu

Ngày kiểm ban đầu: 2026-10-12; cập nhật 2026-10-13. Nghiên cứu lịch sử bên dưới giữ số liệu trước triển khai. Ngày âm 12/15, 朔弦望 và 鋪註 27/28-first đã triển khai audit-only. Owner phê duyệt mới soil convention cho P4-B dưới `p4-soil-owner-convention-v1` / **OWNER_ADOPTED_SOURCE_DEPENDENT**; mục 4 đã nghiệm thu audit-only, sweep 0 thiếu operand 凶 / 0 conflict. Đây không phải authority canonical. S1 final review (2026-10-21, cuối file): PARTIALLY RESOLVED, chỉ còn mở ngày khởi đầu khi 四立 rơi sớm trong ngày. Xem [gate](p4-vol10-soil-convention-gate.md).

## Phân rã số liệu hiện hành

Đếm trực tiếp cột `unresolved` trong `p4-vol10-remaining-ji-2025-2027.tsv`:

| Operand chưa có | Dòng chưa resolve | Heading |
|---|---:|---|
| 土王用事後 | 5.430 | 修倉庫、修宮室、栽種、營建宮室、興造動土 |
| 每月十二日十五日 | 1.086 | 整容剃頭 |
| 每月十五日 + 朔望日 | 1.086 | 求醫療病 |

Tổng 7.602. Mỗi heading có 1.086 dòng vì 9 ngày `puzhu:28` đã gỡ toàn bộ 忌. Đây là số dòng thiếu dữ liệu, không phải số dòng thực sự có kỵ. 破屋壞垣 có 土王用事後 trong inventory nhưng không còn ở cột unresolved của sweep hiện hành; cần kiểm cả inventory khi mở operand, không chỉ các dòng chưa resolve.

## 1. Ngày âm và 朔望: mở context, giữ riêng các điều kiện

Raw khóa `sources/p4-vol10/vol10.raw.txt` ghi riêng 十五日 (dòng 460–462), 人神所在日 (463–464), và 朔 / ký tự SKchar / 朢 (452–454). Lập luận của đoạn phase dùng vị trí tương đối nhật nguyệt; không đủ căn cứ để thay toàn bộ bằng ngày âm 1/15.

Phương án:

1. Thêm context audit tùy chọn cho ngày âm (1–30), convention lịch/múi giờ và evidence ID; giữ Month Jian làm operand của thần theo tháng. Không dùng tháng âm thay Month Jian.
2. Mô hình `lunarDay in {12,15}` cho kỵ **剃頭**, `lunarDay = 15` cho 求醫療病. Heading 整容剃頭 ghép hai việc: giữ provenance phần 剃頭; không khẳng định nguyên văn cũng cấm 整容.
3. Tách presence phase `present / absent / unknown`, kèm instant hoặc ngày dân sự và authority ID. Missing không được đổi thành absent. Cần đọc scan để xác nhận ký tự `SKchar|2959` và kiểm inventory 卷十一 có bỏ sót 弦 hay không trước khi khóa tập phase.
4. Không ép “望 = ngày 15”. Dùng witness có ngày 望 khác 15, ca sát nửa đêm, ngày nhuận, ngày 12/15 có/không 德 và `puzhu:28` làm Golden độc lập. Chỉ dùng engine lịch hiện hành để cung cấp input sau khi expected được suy độc lập.
5. API hai tham số hiện có tiếp tục giữ unknown cho operand mới. Sweep 1095 ngày cần cung cấp context ngày thật; 720 context Month Jian/pillar không đủ để chứng nhận ngày âm/phase.

Ngày 12/15 có thể làm trước; phase cần authority ngày dân sự và scan. Không reopen astronomy CLOSED hay tự thêm một ephemeris thành authority mới.

## 2. 歲薄 / 逐陣: presence đã có, thiếu effect 鋪註

Raw 卷四 dòng 412–415 và 卷十 dòng 322 đồng thuận:

| Scope | Month Jian / pillar |
|---|---|
| 歲薄 | 巳月丙午、巳月戊午、亥月壬子、亥月戊子 |
| 逐陣 | 未月丙午、未月戊午、丑月壬子、丑月戊子 |

Artifact `p4-vol10-named-clauses.json` đã khóa `thin_year` / `pursuit`, effect `follow_yan`. Không cần dựng evaluator presence thứ hai.

鋪註 dòng 28 (raw 卷十 dòng 514): 「凡嵗薄逐陣日所宜事照月厭所忌刪所忌仍從本日」. Phương án cần witness: suppression 宜 theo phạm vi 忌 月厭, đồng thời giữ 忌 của ngày. Không suy suppression 宜 thành thêm 忌 hoặc 諸事皆忌. Cần phân biệt danh sách raw 忌 月厭 với phạm vi đã resolve qua 德; kiểm 月表 trước khi chọn.

Cũng phải kiểm dòng 27 (raw dòng 513): 天吏 / 大時 đang không lấy 死敗, khi gặp 四廢 / 歲薄 / 逐陣 lại lấy 死敗. Xử lý riêng condition này; chỉ làm dòng 28 có thể bỏ sót tác động liên quan.

Golden trước code: đủ 8 context, mỗi ca có heading thuộc / ngoài 月厭, 宜 có / không / unknown, 忌 bảo vệ từ scope khác. Kiểm riêng 巳月丙午 và 未月戊午 vì nguồn nêu không theo 德願所宜. Witness phải có locator, checksum và bản chép; các scan 月表 hiện có cho puzhu:28 không mặc nhiên chứng minh vế 歲薄 / 逐陣.

## 3. S1: đã tìm được bản scan 時憲書 trực tuyến

Nguồn mới: [Tohoku University Library, 藤原文庫/3241](https://touda.tohoku.ac.jp/collection/database/library/10020000012396), [manifest IIIF](https://touda.tohoku.ac.jp/collection/iiif/metadata/10020000012396/manifest.json). Manifest có 225 canvas, 9冊, metadata ghi CC BY và attribution 東北大学附属図書館. Đã tải manifest và ảnh nghiên cứu tại `sources/p4-vol10/shixian-tohoku/`; checksum/URL ở `research-lock.json`.

Đọc bằng mắt canvas 6: **大清咸豐元年歲次辛亥時憲書** (1851). Metadata cấp bộ ghi 同治3年, nên không dùng metadata đó làm năm cho mọi trang. Canvas 6–7 có bảng tiết khí cả năm; canvas 8 bắt đầu 正月. Các ảnh trước đó mờ hơn; chưa chép chắc chắn mốc 土王. Không dùng OCR làm oracle.

Đường kiểm S1 cụ thể:

1. Nhận diện từng quyển bằng trang nhan đề; đọc bốn mốc 土王 và 四立 trong cùng năm, ghi cả ngày âm / can-chi / thời khắc khi có.
2. Tính khoảng cách ngày dân sự giữa các ngày in sách trước khi gọi engine hiện đại. Nếu đủ 18 ngày thì đó là witness cho cách đếm ngày; không tự suy ra cách tính thời khắc hoặc solar longitude chỉ từ một ngày.
3. Chọn năm mà hai phương án (đếm ngày / longitude) khác ngày; một witness nơi chúng trùng không phân biệt được hai mô hình.
4. Kiểm annotation trước / tại / sau khởi đầu và trước / tại 四立 để xác định 「後」. Một nhãn 土王 không đủ chứng minh biên cuối hoặc 忌 được gỡ bởi 德.
5. Kiểm co-presence 德 và earth-work headings để giải câu 「義同土府」. Nếu scan chỉ in ngày khởi đầu, giữ phần ngoại lệ này SOURCE_DEPENDENT.

Bản in này mở đường tra tự động hợp lệ từ thư viện; không còn cần coi owner cung cấp scan là lối tiếp cận duy nhất. **S1 chưa được giải quyết**. Quy ước production PR #29 vẫn là OWNER_ADOPTED; không đưa vào P4 như canonical authority chỉ vì đã chạy đúng Golden production.

## Thứ tự thực hiện và tiêu chí dừng

Khóa witness 歲薄/逐陣 và ngày 12/15 → Golden mới trước evaluator audit → mở context phase sau witness → tiếp tục S1 trên scan thư viện → sweep có input ngày thật và mutation. Báo cáo tách lỗi thiếu 凶 khỏi thiếu 11 宜 (mục 5).

Không chuyển mục 5 cho tới khi mục 4 đạt tiêu chí hoặc owner chốt thay đổi phạm vi rõ ràng. Chưa sửa artifact nguồn/Golden đóng băng; chưa dùng discovery này làm bằng chứng đã nghiệm thu P4-B.

## S1 — 土王用事 final review

2026-10-21. Kết luận: **PARTIALLY RESOLVED**. S1-A, S1-B1 (đầu ra là ngày), S1-B3, S1-B4, S1-C đã chốt; S1-B2 (ngày khởi đầu khi 四立 rơi sớm trong ngày) còn **SOURCE_DEPENDENT / OPEN**. Không đổi production code.

### Hành vi hiện tại (trước review)

`shared/lunar/thoVuongDungSu.ts`: lấy ngày dân sự Asia/Ho_Chi_Minh của instant 四立 (JPL, `solarTermsForYear` → `SOLAR_TERM_AUTHORITY`), rồi onset = ngày đó − 18 ngày lịch, eve = ngày đó − 1, loại ngày 立. Đây là phương án **A** (`civilDate(siLi) − 18 calendar days`), không phải `instant − 18×24h`. Production: god `tho_vuong_dung_su` (bad god major −15, không hard warning, 6 activity) qua rule `{ thoVuongDungSu: true }`. P4: `p4SoilConvention.ts` dùng cùng period dưới `p4-soil-owner-convention-v1` (OWNER_ADOPTED_SOURCE_DEPENDENT); fact `土王用事後` có state `protected`. `xiejiVol10Scoring` không có chain nào cho `tho_vuong_dung_su` (đọc code). Đường balancing chưa đọc code; đã kiểm bằng test (40 ngày có 德 trong khoảng 土王, row vẫn `applied`).

### Sources

Wikisource transcription ghim theo `oldid` tại `sources/p4-vol10/s1-tuwang/` (`lock.json`: URL, revid, SHA-256, quote; test kiểm bytes và quote).

| Source | Thời kỳ / locator | Text | Loại | Độ mạnh |
|---|---|---|---|---|
| 欽定協紀辨方書 (四庫全書本) | Thanh (乾隆); 卷一 五行用事 (SHA-1 `66c18401b9f4`) | 「土於四立之前各旺一十八日」 | primary (reproduction số) | cao cho rule cơ bản; không cho cách tính |
| 同上 | 卷十 raw dòng 440, 443, 448–450 (SHA-1 `355dc6c8fe2d`); scan n213, n215–n216 | 「與徳合赦願併猶忌」「…以下並同」; 土王用事 忌 list; 「義同土府」 | primary | cao |
| 同上 | 卷十一 (SHA-1 `ce4ed7f23ff9`) dòng 199–291; dòng 253 | 忌 list ghi riêng 「土府…土符地囊土王用事後」; 補垣塞穴: 「土府土符地囊土王用事後止忌補垣」 | primary | cao |
| 同上 | 卷五 母倉 (raw dòng 196, SHA-1 `1d4000974e32`) | 歴例 「春亥子夏寅卯秋辰戌丑未冬申酉土王後巳午」 | primary | trung bình–cao cho 「後」 |
| 同上 | 卷六 往亡 (SHA-1 `a9ab67896fc9`) | 「六月土旺後十二日十二月土旺後十八日…或節氣早晚間有差一日者」 | primary | trung bình |
| 推步捷例 上, 南相吉 | Joseon, header 1861; 求土王用事 (revid 2393440) | 「自四立節前一辰，逆數至十八日，爲土王用事」「寄旺四時共日七十二日」「土王後巳午母倉日」; 末伏: 「淸置末伏於其日，鄕置末伏於次庚，以爲相左」 | reproduction của sổ tay Joseon thời 時憲 (日躔 có 最卑 → phép 時憲/定氣) | trung bình–cao cho Joseon; **không** phải bằng chứng 欽天監 Thanh |
| 明史 卷35 大統曆 | Minh (revid 2594649) | 「土王策三萬零四百三十六分八十七秒五十微」; 「置穀雨、大暑、霜降、大寒恆氣日，減土王策…即各得土王用事日」 | reproduction sử chính thức | cao cho 大統 |
| 古今律厯考 卷36 | Minh (revid 771682) | 「毎季土王十八日二十六刻二十一分二十五秒…為土王策以加四季節各大小餘分秒…得土王用事日辰」 | reproduction | cao cho 大統 |
| 宋史 卷68 | Tống (revid 757353) | 「以土王筞加四季之節大小餘秒命從甲子算外即其月土王用事日」; chú 乾元 減中氣, 儀天 加四季 | reproduction | cao: hằng số tùy hệ lịch |
| 承政院日記 高宗五年 | Joseon 1868 | 土王用事 ngày 1868-07-20 ≈ 立秋 − 18 | secondary (ngày tính bằng ephemeris xấp xỉ, không từ 時憲書 in) | trung bình |

Đơn vị 大統: 萬爲日 → 土王策 = 3,0436875 ngày trước 中氣 恆氣, tức ≈ 立 − 18,2621 ngày (= 歲實/20).

### Findings

**S1-A.** 協紀 卷一, 推步捷例 và các 曆志 thống nhất: 土王用事 là khoảng trước mỗi 四立 (立春/立夏/立秋/立冬), danh nghĩa 18 ngày, 4 khoảng × 18 + 4 × 72 = 360. RESOLVED.

**S1-B1.** Các witness vận hành đã xem biểu diễn onset 土王 là một ngày lịch/dân sự; không witness nào đã xem xác lập biên onset giữa ngày. Các 曆志 (宋/明) dùng đại lượng phân số (大小餘, 土王策) ở bước trung gian rồi mới gọi ngày (「命從甲子算外」, 「得土王用事日辰」), nên **không** phải phép tính thuần ngày dân sự. 推步捷例 đếm ngày từ ngày trước 四立. Phương pháp chọn ngày: xem B2.

**S1-B2.** Hai họ phương pháp:

- (a) 曆志 恆氣: instant 中氣/節 ± 土王策 phân số, ≈ 立 − 18,2621 ngày rồi lấy ngày chứa instant. Là 恆氣, trước 時憲; hằng số khác nhau giữa 乾元/儀天/大統. Không chuyển sang 定氣/JPL.
- (b) 協紀 + 推步捷例: đếm 18 ngày dân sự ngược từ ngày trước 四立 (ngày 立 loại trừ). Trùng đúng implementation A.

Không nguồn nào hỗ trợ `四立 instant − 18 × 24h`. Hai họ khác ngày khởi đầu khi instant 四立 rơi vào 00:00–06:17 giờ địa phương: trong miền authority 1899–2101 có **212/812** 四立 (giờ VN, test ghim) thuộc khoảng này, nên đây là khác biệt ảnh hưởng production, không phải chi tiết hiển thị. Bằng chứng nghiêng về (b) cho truyền thống 時憲 (協紀 + sổ tay Joseon 1861 + 承政院日記), nhưng chưa có bản 時憲書 Thanh đọc được cho ca 四立 trước ~06:17. Cùng sổ tay ghi Thanh và Joseon từng lệch nhau về xử lý thời khắc trong ngày cho 末伏: 「道光戊申，立秋値庚，時刻在戌正，而淸置末伏於其日，鄕置末伏於次庚，以爲相左」, sau đó Joseon bỏ quy tắc 午前/午後 để theo Thanh. Đó là về 末伏, không chuyển sang 土王; nhưng cho thấy thực hành Joseon không mặc nhiên bằng Thanh ở biên ngày. Lưu ý: 「一辰」 thường là “một ngày” (日辰) nhưng cũng có thể đọc là một giờ đôi; ngữ cảnh 「逆數至十八日」 nghiêng về ngày. **PARTIALLY RESOLVED**; câu hỏi còn lại thu hẹp thành: *時憲書 Thanh đặt ngày 土王 ra sao khi 四立 rơi 00:00–06:17 giờ Bắc Kinh?*

**S1-B3.** JPL/golden-v4 giữ nguyên làm authority instant 四立 hiện đại. Lịch cổ quyết định semantics rule; JPL quyết định instant. `solarTermsForYear` đọc `SOLAR_TERM_AUTHORITY`; không có engine tiết khí thứ hai.

**S1-B4.** 「土王用事後」: 母倉 歴例 đặt 「土王後」 song song với 春/夏/秋/冬 → nhãn **khoảng thời gian** (từ khởi đầu thổ vượng); 往亡 「土旺後十二日」 đếm từ onset. Biên cuối tại 四立 lấy từ phân chia 72 ngày (卷一, 「寄旺四時共日七十二日」), không từ chữ 後. Nghĩa từ vựng riêng của 後 (“sau thời điểm bắt đầu”) không đứng độc lập; không chặn engine vì 卷十/卷十一 xác định rõ operand và heading. RESOLVED (MEDIUM-HIGH).

**S1-C1.** 卷十 có mục 土府 (dòng 271–272) và 土王用事 (dòng 448–450) riêng; 卷十一 ghi 「土府…土王用事後」 là hai item trong cùng chuỗi 忌. Production: 土府 qua alias Trực Kiến (`kien:*`), 土王 là god `tho_vuong_dung_su`. Invariant **土府 ≠ 土王用事後**.

**S1-C2.** Có câu nguồn trực tiếp, không cần suy từ 土府: 卷十 đoạn 「與徳合赦願併猶忌」 (anchor dòng 440), 「…與徳合赦願併猶忌以下並同」 (dòng 443) và 按 「下倣此」; 土王用事 nằm dưới đoạn này. Ngay cả đọc theo 「義同土府」, 止忌 của 土府 (dòng 272) bao trọn list 土王 (list 土府 còn thêm 伐木), nên mọi heading của 土王 vẫn kỵ. Kết luận: **không có 德 → cancel(土王用事後)**. Production và P4 đã đúng.

**S1-C3.** 止忌 tường minh duy nhất có 土王用事後: 卷十一 補垣塞穴 「土府土符地囊土王用事後止忌補垣」. Đây là thu hẹp heading (chỉ kỵ 補垣, không kỵ 塞穴), trigger là chính các operand đó, **không** phải điều kiện 德. Catalog và sáu heading P4 không có 補垣/塞穴 → không áp dụng, không code, không Test E. 推步捷例 còn liệt kê 作厠/作竈/盖屋; không thêm vào catalog.

### Decision matrix

| Gate | Question | Decision | Confidence | Blocking? |
|---|---|---|---|---|
| S1-A | Rule cơ bản 四立 | 18 ngày trước mỗi 四立 — RESOLVED | HIGH | no |
| S1-B1 | Ngày dân sự hay instant | Onset biểu diễn là ngày lịch; không witness nào xác lập biên giữa ngày — RESOLVED; cách chọn ngày theo B2 | MEDIUM | no |
| S1-B2 | Công thức thời lượng chính xác | 18×24h bị loại; 大統 18,2621 ngày (恆氣) không chuyển được; civil(四立) − 18 có Joseon/協紀 hỗ trợ; 時憲書 Thanh chưa đọc — PARTIALLY RESOLVED | MEDIUM | yes cho canonical (212/812 ca); no cho runtime convention OWNER_ADOPTED |
| S1-B3 | JPL authority | KEEP | HIGH | no |
| S1-B4 | Nghĩa của 後 | Nhãn khoảng thời gian, kết thúc tại 四立 — RESOLVED | MEDIUM-HIGH | no |
| S1-C1 | 土府 vs 土王 | Operand độc lập | HIGH | no |
| S1-C2 | 德 override toàn cục | Không; 卷十 「與徳合赦願併猶忌…以下並同」 | HIGH | no |
| S1-C3 | 止忌 theo activity | Chỉ 補垣塞穴 → 補垣; không phải 德; ngoài catalog | HIGH | no |

### Decision

- **Canonical historical rule:** 18 ngày trước mỗi 四立, onset là một ngày lịch, 德 không gỡ. Ngày onset khi hai họ phương pháp khác nhau: chưa xác lập (B2).
- **Owner-adopted runtime convention:** ngày dân sự của 四立 theo múi giờ dự án (Asia/Ho_Chi_Minh) − 18 ngày lịch, loại ngày 四立. Vẫn là **OWNER_ADOPTED_SOURCE_DEPENDENT**, không phải canonical cho tới khi câu hỏi biên 時憲書 Thanh được giải. Khớp họ (b), không thêm giả định ngoài nguồn; giữ nguyên, không sửa production.
- Research-only: họ (a) phân số; không đưa vào runtime.
- Giữ `p4-soil-owner-convention-v1` = OWNER_ADOPTED_SOURCE_DEPENDENT, `canonicalWitnessAudit.status: OPEN`, `unresolved: ["S1"]` trong `p4-vol10-god-classes.json`.
- Canonical blocker: bằng chứng 時憲書 Thanh cho quy ước onset 土王 khi 四立 rơi đủ sớm để phương pháp ngày dân sự và phương pháp phân số lịch cổ chọn hai ngày onset khác nhau.
- Follow-up không chặn (ngoài scope S1): `tsx` và `vitest` cho output almanac khác nhau ở 2025-04-28 (row 月害, status 德合); chưa điều tra.
- Mở lại khi: có bản 時憲書 Thanh đọc được với 四立 trong 00:00–06:17 giờ Bắc Kinh, ghi locator/checksum/bản chép.

### Non-inferences

- instant semantics ≠ bằng chứng thời lượng đúng 18 × 24h
- 18,2621 ngày của 大統 (恆氣) ≠ quy tắc 時憲/定氣
- precedence của 土府 ≠ precedence của 土王
- có 德 ≠ hủy toàn cục 土王
- 止忌補垣 trong 補垣塞穴 ≠ quy tắc 德
- hằng số lịch cổ ≠ thay thế authority JPL
- thực hành Joseon 1861 ≠ thực hành 欽天監 Thanh

### Tests

`shared/lunar/thoVuongDungSuS1.test.ts` (manifest thật, scoring/balancing bật): ghim witness; mọi năm authority có 4 khoảng 18 ngày dân sự, eve = 立 − 1 (không test T ± ε vì biên instant không có nguồn); 土府 (`kien:*`) và 土王 không alias; 40 ngày 2025–2027 có 德/德合 trong khoảng 土王 vẫn giữ row `applied` cho cả sáu activity. Row có thể có `scoreDelta` 0 khi trần điểm bad god đã dùng hết (ví dụ 2025-04-28 warehouse: 月害 + 天吏); đó là trần điểm, không phải 德 gỡ kỵ. P4 phía 德 đã có ở `p4SoilConvention.test.ts` (“even with 德”).
