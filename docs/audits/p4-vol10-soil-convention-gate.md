# P4-B — gate 土王用事後

2026-10-13. Không đổi runtime, chưa coi convention production thành authority canonical mới.

## Phạm vi heading: ngoại lệ 德 không còn chặn các heading catalog hiện hành

Raw 卷十 (`sources/p4-vol10/vol10.raw.txt`, SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`):

- Dòng 271: 土府專忌 có 營建宮室、修宮室、興造動土、修倉庫、破屋壞垣、栽種 cùng các heading khác.
- Dòng 272: 月建 với 天德/月德/天德合/月德合/天赦/月恩/四相 **止忌** vẫn bao gồm toàn bộ các heading trên.
- Dòng 448–450: 土王用事 có cùng sáu heading, chú **義同土府**. Scan n215–n216 đọc trực tiếp xác nhận danh sách và chú.

Vì vậy, với các heading hiện map vào catalog, cả hai cách đọc “giữ raw 忌 土王” và “kế thừa phạm vi còn kỵ của 土府 khi gặp 德” đều giữ 忌. Không cần tự chọn một miễn kỵ khác nhau cho sáu activity. Không dùng kết luận này để mở rộng sang heading ngoài catalog hoặc mặc định mọi clause 土府 đều được kế thừa.

## Presence: điều kiện còn thiếu cho nghiệm thu canonical

S1 vẫn chưa có witness chắc chắn từ 時憲書 cho ngày khởi đầu, biên 「後」 và cách tính theo 定氣. Bộ Tohoku đã có ảnh nhưng chưa chép được mốc 土王 một cách chắc chắn; không dùng OCR/ảnh mờ làm oracle.

Convention production đã được owner chốt 2026-10-10 và triển khai PR #29:

- Asia/Ho_Chi_Minh, 18 ngày dân sự trước ngày 四立.
- Onset bao gồm; ngày 四立 loại trừ.
- Golden production khóa trước code `02302bb`, mốc 四立 từ HKO độc lập.

Phương án có thể review cho P4-B: tái sử dụng chính presence này với authority ID/convention được đặt tên, trạng thái **OWNER_ADOPTED_SOURCE_DEPENDENT**, không gắn CANONICAL_SOURCE_LOCKED. Raw 忌 được ghép theo nguồn như trên; không thay production và không thêm điểm. Cần owner chốt việc dùng convention đó để nghiệm thu P4-B; context hiện hành còn ghi không lấy convention cũ làm authority mới.

Phương án tiếp tục yêu cầu canonical witness: giữ `土王用事後` unknown trong audit, tiếp tục đọc bản in/scan; chưa chuyển roadmap mục 5.

## Evidence hiện hành

Sau ngày âm, bốn phase và 鋪註 27/28, 1095 ngày × 29 heading còn **6.516 dòng unresolved** (sau khi sửa lookup 壞/壊, thêm 1.086 dòng phá dỡ từng bị bỏ sót), tất cả do 土王用事後. Đây là số dòng thiếu presence, không phải 6.516 dòng thật sự kỵ. Các số đếm runtime/production của PR #29 không được dùng như Golden independent mới.
