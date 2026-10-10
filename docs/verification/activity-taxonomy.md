# Activity taxonomy — bước 1, 10/10/2026

Baseline: main `d1209ec` (Phase 6/7 closed). Nhánh `codex/activity-taxonomy`.
Phạm vi: taxonomy sản phẩm và contract ID/scope; không tạo authority cổ điển mới.

## Acceptance và kết quả

- Bao phủ đúng 29 ID của catalog; không thêm/xóa ID hoặc đổi nhãn/group.
- Scope mặc định tường minh, không còn phụ thuộc thứ tự phrase trong mansion-patterns.
- `travel_road` vẫn là scope riêng của `travel`; không tự mở rộng sang đường thủy.
- Resolver trả `exact`, `unmapped`, `incompatible`, giữ nguyên ID/scope đầu vào.
- ID rỗng, UNKNOWN hoặc không tồn tại là unmapped, không suy thành neutral/permission.
- Scope hẹp không nhận evidence từ activity rộng qua inheritance.
- Resolver không suy polarity, conditions, exceptions, source authority hay score.
- Cả 29 scope mặc định khớp baseline; datasets, trọng số, classification, personal policy và astronomy không đổi.
- Mansion evidence tiếp tục informational, scoreDelta=0; nội dung source-lock và mapping confidence không thay đổi.

## Inventory

Catalog: shared/almanac-data/activities.json. Lexical phrases: mansion-patterns.json (review status not_audited).
Operative clauses: mansion-content-yuxia-1880-v1.json (source locked; taxonomy interpretation riêng).
Events: event-mapping.json (11 profile, primary/supporting/conditional).

| ID | Nhãn | Nhóm | Scope mặc định | Event sử dụng |
|---|---|---|---|---|
| `worship` | Cúng tế | spiritual | `worship` | — |
| `pray_blessing` | Cầu phúc | spiritual | `pray_blessing` | — |
| `pray_children` | Cầu tự | spiritual | `pray_children` | — |
| `wedding` | Cưới hỏi | relationship | `relationship_wedding` | wedding |
| `engagement` | Ăn hỏi / Nạp thái | relationship | `engagement` | wedding |
| `moving` | Nhập trạch / Chuyển nhà | home | `home_moving` | buy_property, property_handover, move_house |
| `bed_installation` | An giường | home | `bed_installation` | — |
| `opening` | Khai trương | business | `business_opening` | open_business |
| `business` | Mở hàng | business | `business` | open_business |
| `contract` | Ký kết / Lập khế ước | business | `contract` | sign_contract |
| `transaction` | Giao dịch | business | `transaction` | receive_vehicle, buy_vehicle, sign_contract, buy_property, property_handover |
| `finance` | Nạp tài / Cầu tài | business | `finance` | buy_vehicle, buy_property, open_business |
| `travel` | Xuất hành | movement | `travel_general` | receive_vehicle, start_journey |
| `meeting` | Gặp gỡ / Hội họp | social | `meeting` | — |
| `study` | Nhập học / Học tập | education | `study` | — |
| `medical` | Cầu y / Chữa bệnh | health | `medical` | — |
| `cleaning` | Dọn dẹp / Tảo xá | home | `cleaning` | move_house |
| `cut_hair` | Cắt tóc | personal_care | `cut_hair` | cut_hair |
| `groundbreaking` | Động thổ | construction | `construction_groundbreaking` | groundbreaking |
| `construction` | Xây dựng | construction | `construction_general` | groundbreaking |
| `renovation` | Sửa chữa | construction | `renovation` | — |
| `beam_raising` | Thượng lương | construction | `beam_raising` | — |
| `warehouse` | Sửa kho | business | `warehouse` | — |
| `warehouse_opening` | Mở kho xuất hàng | business | `warehouse_opening` | — |
| `planting` | Trồng trọt | agriculture | `planting` | — |
| `livestock` | Chăn nuôi / Nạp súc | agriculture | `livestock` | — |
| `burial` | An táng | funeral | `funeral_burial` | — |
| `demolition` | Phá dỡ | construction | `construction_demolition` | — |
| `water_travel` | Đi thuyền / Đường thủy | movement | `travel_water` | start_journey |
| `grave_repair` | Sửa mộ / Sửa mồ mả | funeral | `funeral_grave_repair` | — |

## Khoảng trống giữ nguyên

Các scope source-locked có ID rỗng: `construction_columns`, `construction_high_hall`, `construction_new_room`, `construction_wall`, `construction_waterside`, `door_opening`, `waterworks`.

Không đổi 開門 thành opening/business, 放水 thành water_travel, hoặc việc xây dựng hẹp thành construction chung.
Boat building/launching cần định nghĩa riêng trước khi map; phrase legacy “hạ thủy” đang map water_travel nhưng không chứng nhận equivalence nguồn cổ điển.
Các nhãn ghép (Nạp tài/Cầu tài, Nhập học/Học tập…) vẫn là nhãn sản phẩm hiện tại, không phải bằng chứng rằng mọi động tác tương đương.

## Consumers và semantic boundary

getActivityRecommendations → almanac → evaluateEventDay → eventRecommendations, DailyActivitySection, AlmanacPanel và daySeo.
Contribution scope của Trực/cát/hung thần trước đây lấy phrase đầu tiên không phải travel_road, nay lấy bảng tường minh.
extractMansionEvidence vẫn dùng lexical longest-match ở đường fallback; content authority giữ operative scope/conditions/exceptions nguyên vẹn.
resolveEventActivityRoles giữ điều kiện vehicle_departure/move_in/water_transport và vai trò event.
Resolver taxonomy mới chỉ kiểm tra tính tương thích kỹ thuật. `exact` không phải source review hay permission chấm điểm.

## Bước tiếp theo: explicit rule mapping

1. Mỗi operative clause có mapping review riêng: source quote/ref, activity ID, scope, context, conditions, exceptions, review status/confidence.
2. Chốt semantics của các activity hẹp và nhãn ghép trước khi thêm ID; không dùng lexical similarity thay evidence.
3. Freeze Golden độc lập cho mapping; baseline kết quả trước migration chỉ dùng regression, không gọi là authority Golden.
4. Conflict chỉ so evidence cùng activity/scope/context; giữ source/phái và điều kiện ngoại lệ, không majority vote.
5. Thêm explainability sau mapping contract; scoring mới cần audit policy riêng, không tự bật điểm 28 Tú.

## Validation

activityTaxonomy.test.ts khóa coverage, parity baseline của 29 default scopes, toàn bộ lexical pairs và source-locked clauses, unknown IDs và incompatible narrow scopes.
Scope parity là bằng chứng compatibility với production trước migration, không phải Golden độc lập về authority.

Kết quả local 10/10/2026: `npm test` **137 files / 2.761 tests passed**; `npm run typecheck`, `npm run lint`, Prettier và `git diff --check` passed. Suite có ba thông báo jsdom scrollTo chưa implement; không có test failure. `graphify update .` hoàn tất (5.767 nodes, 8.254 edges); HTML visualization bị bỏ qua theo giới hạn 5.000 nodes. Chưa commit/push/PR/deploy; release production vẫn là d1209ec.

## Cập nhật 10/10/2026 (owner)

- `warehouse` tách đôi: **Sửa kho** (修倉庫, giữ ID, quy tắc không đổi) và **Mở kho xuất hàng** (`warehouse_opening`, 開倉庫出貨財 chép mới từ 卷十一). Cụm từ legacy "mở kho" trong `mansion-patterns.json` chuyển sang `warehouse_opening`; "nhập kho" giữ ở `warehouse`.
- `business` đổi nhãn **Mở hàng** theo đúng 開市, tách khỏi Ký kết / Giao dịch (立券交易). Quy tắc và sự kiện không đổi.
