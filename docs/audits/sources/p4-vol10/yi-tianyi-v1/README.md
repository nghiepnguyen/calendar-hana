# P4-C 2.7 — 天醫 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Single reviewer Codex; không phải review độc lập thứ hai. Authority-only, chưa Golden/implementation.

## Nguyên văn và scan

`entry.json` có 4 raw refs với Unicode code-point offset/length và UTF-8 SHA-1; 8 scan pages có excerpt riêng. `lock.json` khóa entry/README/renders, raw/PDF và artifacts đối chiếu. Không refresh source/lock cũ.

- 卷四 SHA-1 `da680c13601d1cb7b81a1b5e53645e87b8f524b7`, scan 06067682.cn PDF 57–60. Trang 57 đồ 成 / 天醫 / 天喜. Trang 58: 「總要厯曰天醫者天之巫醫其日宜請藥避病尋巫禱祀○厯例曰天醫者正月起戌順行十二辰」; ví dụ 「正月建寅三合為寅午戌而戌為寅之後辰是也餘倣此」. Trang 59: 「月建後二辰生氣也又後二辰即生氣之生氣也故曰天醫又成日也」. Chi 後 không được đọc thành tiến hai chi; sequence 寅→戌 khóa hướng và khoảng cách.
- Trang 58–60 đoạn bên cạnh dẫn variants **天喜** 春戌夏丑秋辰冬未 và monthly 成日, editor ghi 「成日之理為長…故改從畫一而並存其説以備㕘考」. Giữ full paragraph như evidence scope; không lấy seasonal 天喜 table thay monthly 天醫.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 116–117. Trang 116 đặt 成日 / 天喜 / 天醫; trang 117 **「又為天醫宜求醫療病」** là scope riêng. Raw anchor viết 「乂為天醫宜求醫療病」: giữ raw bytes và ghi scan spelling 又 riêng; không có predicate delta. Không copy flat 宜 của 成日 hay 天喜 sang 天醫.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 33–34. Heading 求醫療病 có 天醫 trong 宜 ở trang 34; các raw/protected 忌 giữ nguyên trong source ref, không bị presence 天醫 tự gỡ.

PDF page 1-based đọc trực tiếp; không đoán folio/index Archive chưa ghi. PNG là derived renders, PDF giữ bytes. Raw quotation giữ 厯/歷 và variants nguyên trạng; scan excerpt không dùng thay raw offset.

## Predicate, input và coverage

Bảng 天醫: 子→申、丑→酉、寅→戌、卯→亥、辰→子、巳→丑、午→寅、未→卯、申→辰、酉→巳、戌→午、亥→未. Đây là 正月起戌 rồi thuận 12 chi; vị trí 成日, **8 bước thuận / 4 bước ngược** từ Month Jian. Công thức `(dayBranch - monthJianBranch + 12) % 12 == 8`, 子=0…亥=11. Không suy từ nhãn medical, không chọn một bảng trùng tên khác.

Input exact-Jie Month Jian + chi pillar hợp lệ. Miền cấu trúc 12 × 60 = 720 context; coverage lịch chỉ kế thừa provider input đã kiểm, không tự cấp coverage ngoài provider. Missing/outside coverage → unknown; malformed → error là contract audit. Không can ngày, ngày/tháng âm, phase, soil hoặc birthYear. Không dùng legacy officer của cả crossing day để thay Month Jian chính xác.

## Heading, alias, exceptions và đối chiếu

Direct heading duy nhất **求醫療病 → medical**. Definition 尋巫禱祀 giữ như quotation cũ, không mở 祭祀/祈福 ngoài scope 卷十/十一. Không nhận alias 成日/天喜; đồng vị không làm các named usage hoán đổi được. Không có presence exception được tìm thấy; ngày có medical 忌 vẫn giữ negative/protected layer khi ghép sau.

`xieji-god-definitions.json` chưa có entry 天醫 riêng, nhưng entry 天喜 có sourceRef 卷十 「成日}}{{SK notes|天喜　天醫}}」 và chốt 成日 thay seasonal 天喜; đây là cross-check đồng vị, không authority 天醫 hay alias. `good-gods.json`, `stars.data.ts` không có entry/label 天醫/Thiên Y để tái dùng. `xiejibianfangshu-yiji.json` và inventory task 1 đúng một heading 求醫療病. Offset 8 có thể đối chiếu vị trí Thành của officer, nhưng text shouldDo/isGood và runtime output không làm oracle. Không sửa catalog/definitions/runtime.

Task 2.7 xong, **6/11 authority**; parent 2.0/P4-C còn mở, next 2.8 除神. P5/S1 hiện hành, chưa Golden/implementation/scoring activation.
