# P4 — khóa chứng cứ trước scoring

Ngày: 2026-10-11. Nhánh: `codex/p4-authority-lock`.
Baseline production: `93a513d5200ff7ef456852a524f863622d5f6a0c`.

## Kết quả và giới hạn

Đã chép đầy đủ lưới 等第: 11 cột × 6 cấp = 66 ô (kể cả ô trống), đối chiếu hai scan archive. Đã lưu bytes nguồn, checksum, 28 dòng 鋪註條例 có offset và quote; tạo bảng source-role cho đủ **53 stable god IDs hiện hành**. Con số 44 trong mô tả lịch sử không bao gồm toàn bộ các rule được thêm sau đó.

Đây là **bản khóa chứng cứ có ghi ambiguity**, chưa là chứng nhận canonical scoring. Không thêm flag activation vào manifest, không bật 21 thần và không sửa pipeline hiện hành. Golden mới là **partial oracle trước scoring**, không phải gate go-live đã hoàn tất.

Các class `de_he`, `she_yuan`, `sheng_benefic`, `yi_subject`, `contextual_grade_subject`, `conditional_ji_subject`, `persistent_ji_in_named_scope`, `protected_baiji`… là tên encoding của vai trò nguồn. Chúng không phải bảng xếp hạng cố định, không suy từ dấu weight, không cấp quyền miễn kỵ toàn cục. Bảng giữ `canonicalRank: null`. Grade của thần phụ thuộc tháng/context và clause; bảng lớp khác với hàm chọn cấp chung của ngày.

## Artifact và cách tái kiểm

- `shared/almanac-data/p4-vol10-authority.json`: scan locators, checksum, 66 ô, sáu cấp có quote từ phần 按 平日, 28 dòng 鋪註條例 và ambiguity IDs.
- `shared/almanac-data/p4-vol10-god-classes.json`: đủ 53 IDs, source-role, quote/offset, candidate và phạm vi chưa rõ. 德合 gồm bốn ID đã có câu nguồn; chưa suy bare 遇德 của mọi dòng bảng thành một boolean chung.
- `shared/almanac-data/golden-p4-vol10-authority.json`: 132 local monthly-grade fixtures, 12 grade actions, 5 annotation cases, 9 protected 百忌日, 7 warehouse subset cases, 5 policy-penalty cases và 720 valid context inputs.
- `docs/audits/sources/p4-vol10/lock.json`: SHA-256 khóa nguồn/data/Golden, không regenerate tự động khi kiểm test.
- `shared/lunar/p4Vol10Authority.test.ts`: kiểm quote/hash, đủ bảng/IDs, Golden local grade đối chiếu bản chép, bảo vệ ambiguity và tách policy/source.

**720 contexts chỉ là miền input 12 tháng × 60 can-chi hợp lệ.** Chúng có `expectedGlobalGrade: undetermined` và không có score oracle. Không báo “720 ca scoring đã qua”. Golden local grade cũng không thay thế phép kiểm presence/đồng hiện hay override can-chi. Warehouse mới có subset Thu + partner và impossible contexts; còn cần đầy đủ heading/exception fixtures cho go-live.

## Nguồn lưu trong repo

[Wikisource 卷十, revision 787351](https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷10&oldid=787351) có raw SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`. Raw chỉ chứa tiêu đề 等第, không có bảng. Đây là văn bản cổ public domain, giữ nguyên wikitext và ghi attribution; các quote dùng offset Unicode code points, không phải byte hay UTF-16 offset.

Scan chính: [06067686.cn](https://archive.org/details/06067686.cn), bảng n220/n221, trang in 七十三; đầu 鋪註條例 n222/n223. Scan đối chiếu: [06056510.cn](https://archive.org/details/06056510.cn), n220/n221. Hai item là hai scan witness; chưa chứng minh khác edition, không tính là hai chuyên gia review độc lập. Bytes lưu nguyên trạng, không dùng ảnh crop/OCR làm bản khóa. Bản chép thêm dấu câu/phân nhóm để đọc, chuẩn hóa glyph 巳/卯/劫 có ghi là editorial, không tự biến thành predicates.

## Ambiguity và điều kiện trước scoring

| ID | Chứng cứ / vấn đề | Xử lý đã khóa |
|---|---|---|
| P4-A03 | Một số can-chi có 德作建論不作德論; nhãn 德大會 không thể thay bằng “có sao tốt” | Cần bảng override can-chi/class trước generic scoring; không dùng hasVirtue chung để gỡ kỵ |
| P4-A04 | Summary cấp ghi 從宜亦從忌, clause cụ thể có 不宜不忌 | Grade action không phải final annotation. Phải giải quyết heading-specific overlap, giữ bốn states độc lập |
| P4-A05 | 從重論 có căn cứ cho các chuỗi được gọi tên; 月害 không theo 天吏 vì 天吏 không bao quát các việc nó kỵ | Không universal max-grade; giữ scope/deferral theo nguồn. Fallback bảo thủ nếu muốn thêm phải có product policy riêng |

P4-A02 đã giải quyết: phóng lớn hai scan thấy **六害**, không phải 六合. Nhận định source conflict trước đó là lỗi đọc của agent. Authority/class mapping v2 sửa cách đọc này và ghi region/chứng cứ; Golden expected grades không đổi. V1 còn trong commit `08e2aaf`, không xóa dấu vết khóa cũ. Đây là sửa theo ảnh nguồn, không theo scorer.

Bản đọc ban đầu tưởng cột 月害 có ô gộp; scan đối chiếu xác nhận hai ô 中/次 riêng. Đã sửa **trước freeze**, ghi vào `editorialCorrections`. Đây là lỗi đọc được sửa, không phải ambiguity nguồn.

Các quote còn có thể nghiên cứu tiếp mà không cần owner tự chọn Hán văn. Không dùng “chưa rõ thì chọn xấu hơn” để vượt gate. Nếu cần đổi một artifact đã khóa, tạo version mới với lý do/source mới; không cập nhật checksum theo output scorer để test xanh.

## Contract đã có thể kiểm chứng độc lập

`both_present`, `only_yi`, `only_ji`, `neither_recorded` là trạng thái annotation của scope, tách khỏi status sản phẩm. Không có 宜/忌 nhưng chưa có câu nguồn “không ghi” thì là `undetermined`, không tự thành `neither_recorded`. Protected taboo thuộc scope khác vẫn tồn tại. Input mâu thuẫn (explicit neither mà vẫn có 宜/忌) phải báo lỗi.

Penalty mặc định −25 là product policy, không hard warning, `balancingEligible: false`. Chỉ áp sau khi clause đã chứng minh khớp và thiếu dòng âm, không sinh từ unknown và không phạt trùng. Golden ghi contract này; **chưa có penalty scoring implementation** vì source gate chưa đạt.

## Việc tiếp theo

1. A02 đã giải quyết bằng ảnh phóng lớn; còn cần audit predicates và danh sách clause per-heading đầy đủ.
2. Khóa predicates của từng ô + override can-chi A03; bare 德 và named 德合/赦願 không gộp mặc định.
3. Hoàn thành heading-specific applicability/overlap A04 và deferral scope A05; source-role table hiện có là inventory, chưa phải canonical class resolver đầy đủ.
4. Bổ sung full Golden per-heading/presence/warehouse, đóng băng version trước code scoring.
5. Chỉ sau gate nguồn mới triển khai OFF, đo diff sau Release A, kiểm rollback rồi trình go-live. Merge/deploy vẫn cần authorization riêng.
