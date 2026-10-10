# Activity interpretation review — mansion mapping v2, 10/10/2026

Baseline: main `a69e8df` (PR #5 deployed). Nhánh `audit/activity-interpretation-review`.
Phạm vi: review diễn giải thuật ngữ nguồn cho 115 operative clauses của `mansion-content-yuxia-1880-v1`. Không thêm activity ID, không đổi dataset/manifest, không mở scoring.

## Quyết định

Mapping contract lên `mansion-activity-mapping-v2`. Mỗi scope khai báo danh sách thuật ngữ nguồn đã rà soát; clause chỉ `interpretation_reviewed` khi quote chứa đúng một thuật ngữ của chính scope đó (`reviewTerm`). Thuật ngữ không lan sang scope khác. Clause mơ hồ giữ `interpretation_pending` kèm `reviewNote`.

| Scope | Thuật ngữ đã rà soát | Cách hiểu |
|---|---|---|
| construction_general | 造作, 修造, 起造 | Việc xây dựng chung; không gồm động thổ hay xây dựng hẹp |
| relationship_wedding | 嫁娶, 婚姻 | Hôn nhân/cưới hỏi; không gồm nạp thái |
| funeral_burial | 埋葬, 葬埋 | An táng |
| funeral_grave_repair | 修築墳墓, 墳墓修築, 修墳 | Xây/sửa mộ |
| travel_water | 行船 | Đi thuyền; không gồm đóng thuyền/hạ thủy |
| door_opening (gap) | 開門 | Mở/làm cổng cửa công trình; **không phải** khai trương (開市) |
| waterworks (gap) | 放水 | Tháo/dẫn nước, khơi mương; **không phải** đi thuyền |
| construction_columns (gap) | 竪柱 | Dựng cột |
| construction_high_hall (gap) | 造高堂, 架高堂 | Dựng nhà cao/cao đường |
| construction_new_room (gap) | 造新房 | Xây phòng/nhà mới |
| construction_wall (gap) | 築牆 | Xây tường |
| construction_waterside (gap) | 臨水造 | Xây bên nước (龍宮 là hình ảnh, không chốt loại công trình) |

Kết quả: **110 reviewed / 5 pending**. Reviewed gồm 67 exact_catalog_pair và 43 catalog gap (thuật ngữ đã rõ nhưng vẫn chưa có ID; reviewed không biến gap thành mapping).

Pending có lý do riêng:

- `張-1` 造龍軒 — chỉ có 造; 龍軒 chưa rõ là xây dựng chung hay phạm vi hẹp như cao đường.
- `參-5` 婚姻許定 — có thể là hứa hôn/định thân; chưa phân định cưới hỏi với nạp thái.
- `星-4` 自要歸休別嫁郎 — câu hậu quả chia lìa, không trực tiếp nêu việc cưới hỏi trong ngày.
- `婁-1` 竪柱起門庭 — gộp dựng cột với dựng cổng/sân; chưa tách 起門庭.
- `鬼-6` 修土築牆 — gộp đắp đất với xây tường; chưa tách phần đắp đất.

Không đổi activityId/scope/polarity/conditions/exceptions của clause nào; các clause pending trên là ứng viên cho quyết định sau, không tự sửa.

## Activity hẹp — kết luận semantics

- 開門/放水 xuất hiện 19–20 lần mỗi loại, gần như luôn đi đôi. Semantics đã rõ (công trình cổng cửa / thủy lợi trong nhà đất), nhưng thêm ID là quyết định sản phẩm (catalog UI, event profile). Đề xuất nếu thêm: `door_opening` và `waterworks` riêng, nhóm construction, không gắn event `open_business` hay `start_journey`.
- Xây dựng hẹp (cột, cao đường, phòng mới, tường, bên nước) mỗi loại 1–2 clause; giữ gap, chưa đủ để thêm ID riêng.
- Đóng thuyền/hạ thủy: **không có clause nào** trong subset 1880; không có căn cứ nguồn để định nghĩa. Phrase legacy “hạ thủy” → water_travel trong lexical patterns giữ nguyên, không được chứng nhận.

## Golden và giới hạn

`shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v1.json`: quyết định viết tay theo từng clause (id, quote, activityId, scope, reviewStatus, reviewTerm) kèm glossary; không sinh từ production code. Test so toàn bộ 115 clause production với Golden này.

Giới hạn: đây là review một người (agent) từ trích đoạn đã source-lock, không phải thẩm định chuyên gia thứ hai; không đọc lại bản scan trong bước này. Reviewed nghĩa là cách hiểu thuật ngữ đã rõ, **không** phải quyền chấm điểm hay giải quyết xung đột.

## Ảnh hưởng runtime

- `analyzeEvidenceConflicts`: `reviewPending` chỉ false khi mọi witness đã reviewed; logic không đổi.
- UI “Thông tin Tú (tham khảo)”: reviewed hiển thị thuật ngữ nguồn đã rà soát; pending giữ “chưa được thẩm định” kèm lý do.
- Mansion vẫn informational, scoreDelta = rawDelta = 0; datasets, decision baseline, astronomy, personal và scoring policy không đổi.

## Validation local

- `npm test`: 140 files / 2791 tests passed; `npm run typecheck`, `npm run lint`, Prettier (file thay đổi), `git diff --check` passed.
- `python3 scripts/audit-mansion-content-mutations.py`: 9/9 KILLED.

## Tiếp theo

1. User quyết định có thêm `door_opening`/`waterworks` vào catalog hay không.
2. Quyết định 5 clause pending (đọc lại bản scan để có ngữ cảnh câu kế tiếp).
3. Audit context/conditions của Trực/cát/hung thần trước khi đưa vào diagnostics.
4. Resolution policy riêng; không majority vote, không tự mở scoring.
