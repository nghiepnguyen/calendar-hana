# P4-C 2.3 — 福德 authority v1

2026-10-14. **SOURCE_REVIEWED**, audit-only, scoringReady false. Task 2.3 chốt theo nguồn; không cần convention owner mới. Single reviewer: Codex, không phải review độc lập thứ hai. Chưa Golden hoặc presence implementation.

## Nguồn và predicate

`entry.json` giữ nguyên quote UTF-8, Unicode code-point offset/length, raw SHA-1 và source ID. `lock.json` khóa entry/report/renders cùng raw/scan và các bảng đối chiếu; không refresh lock/source cũ.

- 卷四, SHA-1 `da680c13601d1cb7b81a1b5e53645e87b8f524b7`, scan 06067682.cn PDF 27–32. Trang 27 đồ 滿 / 福德 / 天巫; trang 28–29 định nghĩa 福德, trang 30–32 lời bàn phân scope 天狗. Nguyên văn: 「厯例曰福德常居月建前二辰」. Ví dụ 「正月寅…辰」「二月夘…巳」「三月辰…午」 khóa hướng tiến hai chi, không đếm ngược hoặc inclusive. Bản raw có 夘/卯 và 厯/歷; giữ quote nguyên trạng, không dùng normalization để đổi offset.
- 卷十, SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 112–113. Trang 112 đặt 滿日 với 天巫、福德; trang 113: 「又為天巫宜祭祀祈福」「又為福德宜上册進表章慶賜賞賀宴㑹修宮室繕城郭」. Đây là scopes riêng, không sao chép flat 宜 của 滿日 sang 福德. Định nghĩa 卷四 nhắc tế tự/cầu phúc nhưng scope ghép P4-C tuân 卷十/十一; không lấy lịch cũ để thêm heading.
- 卷十一, SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 14–15 (上冊進表章、上表章), 21–22 (慶賜賞賀、宴會), 36–37 (修宮室、繕城郭). Raw viết 福徳 tại đúng vị trí mà scan viết 福德: nhận **福徳 → 福德** chỉ như orthographic alias của token trong scope này. Scan 宴會 ghi 會親友同; raw ghi 㑹親友同, không tạo thêm activity hay alias god.

Locator dùng PDF page 1-based đã đọc trực tiếp; không đoán printed folio hay Archive image index. Renders là derived evidence, không thay PDF nguồn.

Predicate: `(dayBranch - monthJianBranch + 12) % 12 == 2`, chi đánh số 子=0…亥=11. Bảng 子→寅、丑→卯、寅→辰、卯→巳、辰→午、巳→未、午→申、未→酉、申→戌、酉→亥、戌→子、亥→丑. Input Month Jian từ boundary Jie chính xác và chi pillar hợp lệ; không dùng tháng âm, can ngày, pha trăng, soil hoặc năm sinh. Miền cấu trúc 12 × 60 = 720 context; coverage ngày kế thừa provider input hợp lệ, không tự cấp coverage ngoài provider. Missing/outside coverage → unknown; malformed → error là contract audit, không gắn thành cổ văn.

## Heading, exception và scope trùng tên

Current inventory có hai direct heading: **修宮室 → renovation**, **宴會 → meeting**. Bốn heading nguồn khác 上冊進表章、上表章、慶賜賞賀、繕城郭 được lưu riêng như ngoài 29-heading catalog; không tự map sang renovation/meeting hoặc mở catalog.

「按滿為福德」 xác nhận vị trí chung với 滿, không biến tên 滿日 thành alias god. 天巫 cũng có predicate cùng vị trí nhưng scope 宜 riêng, không alias/gộp identity. Lời bàn 天狗 giới hạn 申建戌日 và 忌 tế tự; không có clause loại 福德 presence ở đó. Presence và heading 忌 là hai tầng khác nhau; giữ các exception/override resolver đang có cho bước ghép sau.

Đầu 卷四 dẫn 四利三元 「收為…福德」 rồi phê bình việc ghép các thần đó; đây không phải monthly rule đang khóa. Không lấy chữ 福德 trùng tên trong 四利三元, nhãn generic hoặc hệ personal làm authority/input.

## Đối chiếu dự án

`xieji-god-definitions.json`, `good-gods.json` không có entry 福德/福徳. `stars.data.ts` không có label 福德/福徳/Phúc Đức để tái dùng. `xiejibianfangshu-yiji.json` có 福德 trong hai heading 修宮室、宴會, khớp source sau normalization 徳→德. Inventory task 1 cũng đúng hai heading; giữ inventory/definition/catalog bytes.

`officers.ts` có Mãn index 2 và công thức chi ngày trừ chi tháng, chỉ là cross-check vị trí. Text nên/kiêng và isGood của officer không là authority 福德; legacy getOfficer dùng whole crossing-day month, không dùng nó thay exact-Jie Month Jian trong predicate mới.

Task 2.3 xong, cùng 母倉 là **2/11 authority**. Task 2.0/P4-C chưa nghiệm thu; next 2.4 天恩. Không sửa Golden, evaluator, runtime/manifest/scoring hoặc P5/S1.
