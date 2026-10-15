# P4-C 2.5 — 天巫 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Single reviewer Codex; không tự nhận review độc lập thứ hai. Task 2.5 chốt authority; chưa Golden/implementation.

## Nguyên văn và scan

`entry.json` chứa 6 raw refs với UTF-8 SHA-1, Unicode code-point offset/length và quote nguyên trạng; 11 scan-page checks có bản chép excerpt riêng. `lock.json` khóa entry/README/renders và raw/PDF/artifacts đối chiếu. Raw/lock cũ không refresh.

- 卷四, SHA-1 `da680c13601d1cb7b81a1b5e53645e87b8f524b7`, scan 06067682.cn PDF 27–33. Trang 27 đồ 滿 / 福德 / 天巫; trang 29: 「總要厯曰天巫者月中善神也所值之日宜合藥請醫祀鬼神求福願○厯例曰常居月建前二辰○曹震圭曰天巫者月中善神能克除鬼煞也義與福德同」. Raw refs giữ 厯/歴 và 夘 nguyên trạng. Trang 28–29 ví dụ 福德 寅→辰、卯→巳、辰→午 xác nhận hướng đếm chung; không lấy output implementation làm nguồn.
- Trang 30–33 là lời bàn: 「天狗者戌日值滿也」「滿既是戌建必在申」「非謂凡為滿日皆天狗也」; trang 33 chốt 「又按天狗為申建之戌止一位故不入圖」. Không nhận câu quoted older rule 天狗常居月建前二辰 như predicate cho tất cả 滿日. Đây là scope riêng của ritual 忌, không clause xóa presence 天巫.
- 卷十, SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 112–113. 「又為天巫宜祭祀祈福」 tách khỏi 福德 và raw 滿日 list. Lời bàn **「又謂天巫宜療病與滿日所忌自相牴牾故刪」** bỏ old medical use. Không tự chuyển 合藥請醫 thành 求醫療病 hoặc thêm medical activity.
- 卷十一, SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 13–14. 天巫 có trong 宜 của 祭祀 và 祈福; 祭祀 đồng thời có 忌天狗寅日. Source literal 宜/忌 được giữ riêng, không lấy thần 宜 làm lý do xóa 忌. Existing puzhu/protection/override sẽ được kiểm ở bước ghép, không triển khai trong task này.

PDF page 1-based được xác minh trực tiếp. Không đoán printed folio/index Archive khi chưa ghi; PNG là derived render, không thay PDF bytes. Raw và scan không có disagreement về predicate hoặc hai heading được nhận.

## Predicate, input, coverage và alias

`(dayBranch - monthJianBranch + 12) % 12 == 2`; chi đánh số 子=0…亥=11. Bảng 子→寅、丑→卯、寅→辰、卯→巳、辰→午、巳→未、午→申、未→酉、申→戌、酉→亥、戌→子、亥→丑. Input Month Jian từ exact Jie và chi pillar hợp lệ; không dùng tháng âm hoặc legacy whole-day officer. Can ngày/ngày âm/phase/soil/birthYear không là operand.

Coverage cấu trúc 12 × 60 = 720 context; coverage lịch chỉ kế thừa provider input được kiểm. Missing required input/outside coverage → unknown; malformed → error là contract audit. Không tự cấp coverage ngoài provider.

Không nhận alias. 福德 và 滿日 cùng vị trí nhưng giữ authority/scope riêng; 天狗 không là alias 天巫. Không có source clause loại presence tại 申建戌日: ngày đó 天巫 present theo predicate, ritual 忌 phải vẫn được ghép theo source riêng. Presence chưa phải verdict cuối.

## Đối chiếu và scope

Hai direct heading: **祭祀 → worship**, **祈福 → pray_blessing**. Không thêm 求嗣/求醫療病 hoặc các heading thuộc raw 滿日 list. `xiejibianfangshu-yiji.json` và inventory task 1 đúng hai heading; extra occurrence của 天巫 trong artifact không là heading thứ ba. `xieji-god-definitions.json`, `good-gods.json`, `stars.data.ts` không có entry/label 天巫/Thiên Vu để tái dùng. Không suy rule từ nhãn sao tốt trùng tên.

Task 2.5 xong, **4/11 authority**; parent 2.0/P4-C chưa nghiệm thu. Next 2.6 天后. Giữ P5/S1, Golden, evaluator/runtime/manifest/scoring hiện hành.
