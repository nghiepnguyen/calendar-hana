# P4-C — source collection v1 (task 2.1)

2026-10-13. **EVIDENCE COLLECTED; không phải authority presence, không phải Golden.** Predicate của cả 11 thần vẫn chưa chốt. Bản collection này dùng cho các task 2.2–2.12 đọc và review từng entry.

## Nguồn đã khóa

| Volume raw | Revision Wikisource | SHA-1 raw | Scan đầy đủ | Trang PDF |
|---|---:|---|---|---:|
| 卷04 (tái dùng) | 787340 | da680c13601d1cb7b81a1b5e53645e87b8f524b7 | 06067682.cn — 卷四 | 140 |
| 卷05 (tái dùng) | 787341 | 1d4000974e3222122e8919fa01102dc3cda352a2 | 06067683.cn — 卷五 | 140 |
| 卷06 (tái dùng) | 787343 | a9ab67896fc9098e6842036979e84fde4f8aae19 | 06067684.cn — 卷六 | 154 |
| 卷10 (tái dùng) | 787351 | 355dc6c8fe2d815c2fdec51b25228836cfea6025 | 06067686.cn — 卷九〜卷十 | 231 |
| 卷11 (mới) | 787353 | ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50 | 06067687.cn — 卷十一〜卷十二 | 112 |

`manifest.json` chứa URL revision cố định, URL/item scan, local path, SHA-1/SHA-256, page count và trạng thái review. Response API Wikisource được giữ: bốn raw cũ và raw mới khớp byte-for-byte với content/hash trong revision response. PDF được kiểm SHA-1/size với metadata Archive và kiểm bằng `pdfinfo`.

Trang PDF 3 được render/đọc trực tiếp: tiêu đề xác nhận 卷四、卷五、卷六、卷九、卷十一 tương ứng. PNG tiêu đề chỉ là derived render, không thay bytes PDF gốc. Với item nhiều volume, tiêu đề này xác nhận volume đầu; locator/transcription từng clause vẫn cần review ở task entry. Không suy thứ tự volume từ số identifier: 06067683 là **卷五**, không phải 卷三–四.

OCR XML chỉ là trợ giúp tìm trang. Tìm các tên theo dạng truyền thống/giản thể không cho locator đủ tin cậy; không dùng OCR làm bản chép, predicate hay oracle. Các scan đầy đủ được giữ để đọc tay.

## Reading index cho 11 thần

`candidate-index.json` ghi **230 occurrence** của 11 tên trên volume định nghĩa candidate + 卷十 phạm vi dùng + 卷十一 heading. Mỗi occurrence có actual raw mention và context quote/offset/length để kiểm lại. Role chỉ là điểm bắt đầu đọc, không là kết luận authority.

- 卷04 candidate: 福德、天巫、天醫、吉期.
- 卷05 candidate: 母倉、天恩、除神、鳴吠.
- 卷06 candidate: 天后、驛馬、天馬.

福德 có raw spelling 福徳 ở 卷十一. Chỉ mục tìm cả 德/徳 và giữ nguyên `mentionText`/quote; việc nhận alias phải được ghi khi review entry. Không biến những chữ trong quote thành bản normalized. Không tự gộp 天后–驛馬 hoặc 鳴吠–鳴吠對 từ tên/mention.

## Offset protocol

ID: `unicode-code-point-zero-based-end-exclusive-v1`.

1. Đọc bytes nguồn đã khóa, decode **UTF-8 strict**. Không thêm/bớt BOM, không đổi CRLF/LF, không trim, NFC/NFKC, giản thể/phồn thể, HTML entity hoặc template expansion.
2. `offset` bắt đầu từ **0**, đếm **Unicode code point**. Không dùng byte offset, UTF-16 code unit hoặc grapheme count.
3. `length` cũng đếm code point; khoảng quote là `[offset, offset + length)`.
4. `quote` phải bằng substring nguyên trạng ở khoảng đó; `length` phải bằng số code point của quote. SHA-1/SHA-256 luôn tính trên **bytes UTF-8 gốc**, không trên text đã normalize.
5. Python: `raw = path.read_bytes().decode('utf8'); raw[offset:offset+length]`. JavaScript: `Array.from(raw).slice(offset, offset + length).join('')`; không dùng `String.slice` trực tiếp cho offset này.
6. Ví dụ `A𠀀母倉\n`: 母倉 bắt đầu ở code point 2, không phải UTF-16 index 3. Validator có ca kiểm chữ supplementary plane, CRLF, sai length/offset/quote và bounds.

Locator scan phải ghi riêng: item/source ID, PDF page **1-based**, Archive image index **0-based khi đã xác minh alignment**, printed folio/recto-verso đọc trực tiếp và transcription. Không suy printed folio từ PDF page; full scan/page title collection chưa thay thế review clause.

## Mẫu entry authority

`authority-entry.template.json` là mẫu JSON **chưa có dữ liệu authority**, đặt dưới sources để tránh runtime import. Copy thành entry versioned khi làm task 2.2–2.12; không ghi đè mẫu/source lock để chốt predicate.

| Field | Yêu cầu trước khi entry được chốt |
|---|---|
| schemaVersion | `p4-yi-authority-entry-v1` |
| id / han / aliases | Stable ID và tên, alias có căn cứ; không coi label runtime trùng tên là alias đã nhận |
| authorityId / authorityVersion / status | Authority có tên/version và status được giải thích; mẫu giữ UNREVIEWED |
| scope / scoringReady | AUDIT_ONLY / false |
| sources | Mỗi ref có sourceId, role, volume, offset, length, quote và raw SHA-1; phải kiểm protocol trên manifest |
| scanChecks | Source ID, PDF page, Archive index đã xác minh, printed folio, transcription, reviewer và nội dung check; giữ separate scan text/raw quote |
| operandInputs | Key/input origin, required flag và nguồn chứng minh lựa chọn input; không ép tất cả về Month Jian |
| predicate / coverage | Predicate có derivation, miền áp dụng và dữ kiện cần; chưa đọc nguồn thì giữ null |
| exceptions / headingScopes | Phạm vi/exception đúng nguồn; raw/normalized heading/activity và ref chứng minh |
| conflicts | Cách đọc khác nhau, evidence, trạng thái giải quyết; không bỏ alternative để test xanh |
| unknownPolicy | Missing input/outside coverage → unknown; malformed input → error (contract audit, không gắn thành cổ văn) |
| ownerAdoption | Chỉ có khi owner quyết: tên, ngày, quyết định, scope, lý do và alternative; không tự nâng thành canonical |
| review | PENDING cho mẫu; khi chốt phải ghi reviewer/date/method/limits và các field đã kiểm |
| traceFields / limits | Trace tái hiện authority/rule/input/presence/source; ghi giới hạn coverage/review |

Các giá trị null/array rỗng trong mẫu là dữ liệu **chưa chốt**, không phải absent hoặc không có exception. Entry chỉ đạt gate khi các field cần thiết đã được điền và review; task 2.1 không đánh dấu 11 authority là hoàn tất.

## Verify và versioning

`python3 scripts/verify-p4-yi-sources.py --self-test`

Validator chỉ đọc: kiểm lock bytes, published PDF checksum/size, revision raw content/hash, 230 quote offsets, template chưa adopted và hashes task-1 baseline. Không chạy resolver/scorer, không ghi predicate hay refresh hash.

`lock.json` đóng băng collection, protocol/template và verifier. Nếu bổ sung scan/clause hay sửa transcription, tạo version/lock mới kèm lý do; không refresh lock để hợp code. Baseline task 1 `991e87c`, các raw/Golden/locks cũ giữ nguyên bytes.
