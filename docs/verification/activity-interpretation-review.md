# Activity interpretation review — mansion mapping v2, 10/10/2026

Baseline: main `a69e8df` (PR #5 deployed). Nhánh `audit/activity-interpretation-review`.
Phạm vi: review diễn giải thuật ngữ nguồn cho 115 operative clauses của `mansion-content-yuxia-1880-v1`; thêm hai activity `door_opening`, `waterworks` theo yêu cầu user; xử lý 5 clause còn mơ hồ bằng ngữ cảnh đủ bài thơ trên bản scan. Dataset nguồn, manifest và Golden Phase 7 không đổi; không mở scoring.

## Contract v2

Mỗi scope khai báo thuật ngữ nguồn đã rà soát; clause chỉ `interpretation_reviewed` khi quote chứa thuật ngữ của chính scope đó (`reviewTerm`). Thuật ngữ không lan sang scope khác. Mapping trả `activityId` đã diễn giải; evidence dùng ID này thay vì sửa source lock. Scope `catalogAdded` chấp nhận clause source-locked với ID rỗng (trước khi catalog có ID). Status: `exact_catalog_pair`, `unmapped` (gap) hoặc `not_operative` (trích đúng nguồn nhưng là câu hậu quả; không thành evidence).

| Scope | Thuật ngữ | Activity | Cách hiểu |
|---|---|---|---|
| construction_general | 造作, 修造, 起造, 造龍軒 | construction | Xây dựng chung; không gồm động thổ hay xây dựng hẹp |
| relationship_wedding | 嫁娶, 婚姻 | wedding | Hôn nhân/cưới hỏi; không suy ra nạp thái |
| funeral_burial | 埋葬, 葬埋 | burial | An táng |
| funeral_grave_repair | 修築墳墓, 墳墓修築, 修墳 | grave_repair | Xây/sửa mộ |
| travel_water | 行船 | water_travel | Đi thuyền; không gồm đóng thuyền/hạ thủy |
| door_opening | 開門 | **door_opening** (mới) | Trổ cửa/làm cổng công trình; **không phải** khai trương (開市) |
| waterworks | 放水 | **waterworks** (mới) | Dẫn/tháo nước, khơi mương; **không phải** đi thuyền |
| construction_columns | 竪柱 | gap | Dựng cột |
| construction_high_hall | 造高堂, 架高堂 | gap | Dựng cao đường |
| construction_new_room | 造新房 | gap | Xây phòng/nhà mới |
| construction_wall | 築牆 | gap | Xây tường (tường đất) |
| construction_waterside | 臨水造 | gap | Xây bên nước |

Kết quả: **115/115 reviewed** — 108 exact_catalog_pair, 6 unmapped (gap xây dựng hẹp), 1 not_operative. Evidence: 114 rows (19 door_opening, 20 waterworks).

## Activity mới

`activities.json` thêm (cuối catalog, nhóm construction, personalSensitivity 0.9):

- `door_opening` — “Trổ cửa / Làm cổng”, scope `door_opening`.
- `waterworks` — “Dẫn nước / Khơi mương”, scope `waterworks`.

Không gắn vào event profile nào (không `open_business`, không `start_journey`). Trực/cát/hung thần không có rule cho hai ID này nên recommendation là `no_evidence`; evidence 28 Tú hiển thị tham khảo, scoreDelta = 0. Không suy permission từ việc thiếu evidence.

## Năm clause đã xử lý (đọc đủ bài trên scan)

| Clause | Câu thơ liên quan | Quyết định |
|---|---|---|
| 張-1 | 張星日好造龍軒，年年便見進庄田 | 龍軒 là mỹ từ cho nhà/sảnh → construction, reviewed |
| 參-5 | 婚姻許定遭刑剋，男女朝開暮落花 | Nói về hôn nhân → wedding, reviewed; không suy ra nạp thái |
| 婁-1 | 婁星竪柱起門庭 … 放水開門皆吉利 | Dựng cột dựng nhà là một động tác; cửa đã có clause riêng → construction_columns, reviewed |
| 鬼-6 | 修土築牆傷產女 | Đắp đất làm tường → construction_wall, reviewed; không phải động thổ |
| 星-4 | 不可葬埋并放水，凶星臨位女人亡，生離死別無心戀，自要歸休別嫁郎 | Câu hậu quả của 葬埋/放水, không nêu cưới hỏi → **not_operative**, bỏ khỏi evidence |

Hệ quả 星-4: ngày Tú Tinh không còn hiển thị “Cưới hỏi — bất lợi”; với cưới hỏi, Tú Tinh nay là không có evidence (UNKNOWN), không phải cho phép.

Trang scan đã đọc (archive.org `page/nN.jpg`): 婁 n60, 參 n64, 鬼 n67, 星 n69, 張 n70. Đọc bằng mắt, không OCR.

## Phát hiện ngoài phạm vi (chưa sửa)

- **Lệch trang scan 觜/參:** đã xác nhận và sửa dataset + Golden Phase 7 (xem `docs/audits/mansion-scan-page-check.md`).
- 角: đã xác nhận bản scan ghi 惟有葬埋不可用 và đã sửa quote (xem `docs/audits/mansion-scan-page-check.md`).

## Golden và migration

- `shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json`: quyết định viết tay từng clause (activityId, scope, status, reviewTerm) + glossary + câu thơ đầy đủ của 5 Tú đã đọc lại. Thay v1 (chưa phát hành). Không sinh từ production.
- Golden Phase 7 giữ nguyên. Test evidence khai báo tường minh migration `EXPECTED_AUTHORITY_MIGRATION_CHANGE`: hai scope gán ID mới, 星-4 không còn là evidence.
- Decision baseline 1095 ngày × 11 event không recapture: hash vẫn so trên 29 activity cũ; hai activity mới được assert riêng là `no_evidence`. Event verdict không đổi.

Giới hạn: review một người (agent), không phải thẩm định chuyên gia thứ hai. Reviewed nghĩa là đã rõ cách hiểu thuật ngữ, không phải quyền chấm điểm hay giải quyết xung đột.

## Validation local

- `npm test`: 140 files / 2795 tests passed; `npm run typecheck`, `npm run lint`, `npm run build` passed.
- Mutation: mansion content 9/9 KILLED; annual directions KILLED toàn bộ.
- E2E `mansion-content.spec.ts` desktop/mobile 4/4; full desktop Playwright 104 passed / 16 skipped.

## Tiếp theo

1. Quyết định sửa lệch trang 觜/參 (dataset + Golden Phase 7).
2. Có cần ID riêng cho xây dựng hẹp (cột, cao đường, tường…) hay không; hiện mỗi loại chỉ 1–2 clause.
3. Audit context/conditions của Trực/cát/hung thần (có thể bổ sung rule cho door_opening/waterworks từ nguồn khác, cần provenance riêng).
4. Resolution policy riêng; không majority vote, không tự mở scoring.

## Quyết định 2026-10-10: không tạo ID cho xây dựng hẹp

Owner quyết định **không** tạo activity ID riêng cho 5 scope xây dựng hẹp (`construction_columns`, `construction_high_hall`, `construction_new_room`, `construction_wall`, `construction_waterside`; 6 clauses). Chúng giữ `unmapped` (đã reviewed), tiếp tục hiển thị trong “Việc khác trong nguồn chưa có mục tương ứng”, không gộp vào `construction` hay `groundbreaking`.
