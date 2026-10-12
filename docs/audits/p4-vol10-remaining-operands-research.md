# P4-B — phương án giải quyết operand còn thiếu

Ngày kiểm: 2026-10-12. Bản nghiên cứu ban đầu dưới đây giữ số liệu trước triển khai. Cập nhật: phần ngày âm 12/15 đã triển khai audit-only (Golden khóa `5442f10`); ngày âm, 朔弦望 và 鋪註 27/28-first đã triển khai; sửa alias phá dỡ, sweep còn 6.516 dòng thiếu 凶 chỉ do 土王用事後. S1 còn gate owner (`p4-vol10-soil-convention-gate.md`); mục 4 vẫn PARTIAL.

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
