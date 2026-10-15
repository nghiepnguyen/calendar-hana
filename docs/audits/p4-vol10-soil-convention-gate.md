# P4-B — gate 土王用事後

2026-10-13. **Gate P4-B ACCEPTED dưới `OWNER_ADOPTED_SOURCE_DEPENDENT`**. Authority mới `p4-soil-owner-convention-v1`; không đổi runtime, không nâng authority cũ thành canonical.

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

Owner phê duyệt mới ngày 2026-10-13 cho phạm vi P4-B: tái sử dụng presence production theo convention trên dưới tên `p4-soil-owner-convention-v1`, trạng thái **OWNER_ADOPTED_SOURCE_DEPENDENT**. Đây là authority riêng, không phải nâng authority cũ thành canonical. Raw 忌 chỉ ghép sáu heading đã xác nhận; giữ bảo vệ 德 theo đoạn 「以下並同」 và vẫn chịu override cấp ngày `puzhu:28`. Không thay production, không thêm điểm.

Authority và Golden độc lập khóa trước code tại `c0d8f56`: bảng HKO 2025–2027 vừa tải lại, 12 kỳ / 48 ca biên; không nhập engine để tạo expected và không dùng số đếm PR #29. Test đối chiếu ngày HKO UTC+8 với mốc engine ở Asia/Ho_Chi_Minh UTC+7; cả 12 mốc đồng ngày trong miền kiểm. HKO chứng minh input biên của convention, không chứng minh cách tính cổ.

**Audit canonical witness vẫn OPEN** cho onset, biên 「後」 và 定氣. Tiếp tục tìm bản in/scan 時憲書 đọc được và ghi locator/checksum/transcription trước khi đề xuất authority canonical mới. Bộ Tohoku hiện không đủ để kết luận ba mục này; không suy từ việc gate P4-B đã được nghiệm thu.

## Evidence hiện hành

Trước phê duyệt mới, sau ngày âm, bốn phase và 鋪註 27/28, 1095 ngày × 29 heading còn **6.516 dòng unresolved** (sau khi sửa lookup 壞/壊, thêm 1.086 dòng phá dỡ từng bị bỏ sót), tất cả do 土王用事後. Đây là số dòng thiếu presence, không phải 6.516 dòng thật sự kỵ. Các số đếm runtime/production của PR #29 không được dùng như Golden independent mới.

Sau ghép soil theo authority mới: **31.755 dòng, 0 unresolved operand 凶, 0 conflict, 0 propagation gỡ / 179 chặn**. TSV có `soil_presence`, `soil_authority`, `soil_status`; thiếu operand hoặc ngoài 2025–2027 vẫn unknown. Đây là nghiệm thu roadmap 4 audit-only; chưa phải full Golden hay hoàn tất 11 operand 宜 của mục 5.

Validation cuối ngày 2026-10-13: gate **6 file / 200 test**; mutation **28/28** bắt bằng assertion, bytes phục hồi; full unit **181 file / 3476 test**; build, main/functions typecheck, oxlint và formatting bốn file code đều qua. `graphify update .` đã chạy. Bundle `dist/assets/index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`, trùng baseline runtime. TSV kiểm 31.755 dòng × 19 cột, soil status explicit và không còn unresolved token. Các Golden/lock cũ giữ nguyên bytes. Chưa push các commit mới, không merge/deploy.

Release 2026-10-13: PR #54 MERGED tại `1ad9b4b478b7446c1db45ef0347a2485827c6a3e`. [CI/deploy main 38350956914](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38350956914) SUCCESS: typecheck/lint, 4 shard unit, 2 shard Playwright, mutation/emulator và P4-B mutation gate đều qua. Log Firebase xác nhận hosting release complete / Deploy complete lúc 05:27 UTC. Kiểm production HTTP và bundle sau deploy: `index-CeLinrvj.js` SHA-256 `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`, trùng baseline. P4-B hoàn tất audit-only; không activation/đổi runtime/điểm. Canonical S1 onset/後/定氣 vẫn OPEN. Bước tiếp theo: P4-C, roadmap 5.
