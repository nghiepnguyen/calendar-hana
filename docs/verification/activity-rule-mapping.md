# Explicit rule mapping — bước 2, 10/10/2026

Phạm vi: contract mapping cho operative clauses của authority `mansion-content-yuxia-1880-v1`, trên nhánh `codex/activity-taxonomy`. Đây là bước triển khai kỹ thuật tiếp sau taxonomy; chưa chứng nhận diễn giải mới hoặc mở scoring.

## Contract và acceptance

`ruleActivityMapping.ts` khai báo 12 scope của content subset hiện tại, độc lập với lexical patterns. Năm scope có exact catalog pair, bảy scope là catalog gap có ID rỗng. Không tự fallback sang hoạt động rộng hoặc suy từ phrase tương tự.

Mỗi evidence source-locked có `activityMapping` riêng:

- `version`: mansion-activity-mapping-v1.
- `status`: exact_catalog_pair hoặc unmapped; chỉ nói về cặp kỹ thuật.
- `reviewStatus`: interpretation_pending, độc lập với SOURCE_LOCKED/PRIMARY.
- `reason`: giải thích ranh giới diễn giải và điều không được tự gộp.
- `authorityId`, `clauseId`: định danh context nguồn và clause. `sourceRef`, `sourceQuote`, `conditions`, `exceptions` vẫn ở evidence cùng cấp.

Resolver từ chối scope chưa khai báo, ID/scope không khớp, ID rỗng cho scope đã có mapping, ID không tồn tại và cặp catalog-compatible chưa thuộc subset này. Chỉ kiểm tra mapping được khai báo; không xác thực thêm bản scan hay tự cấp quyền scoring. Legacy lexical evidence và evidence Trực/thần chưa dùng contract review này.

## Mapping tường minh

| Scope | Activity ID | Ranh giới |
|---|---|---|
| construction_general | construction | Không mở rộng sang động thổ hoặc việc xây dựng hẹp |
| relationship_wedding | wedding | Không tự gộp nạp thái/đính hôn |
| funeral_burial | burial | Không gộp sửa mộ |
| funeral_grave_repair | grave_repair | Không gộp an táng/sửa chữa nhà |
| travel_water | water_travel | Không gộp xuất hành chung, đóng thuyền/hạ thủy/thủy công |
| door_opening | rỗng | Chưa có ID; không khai trương |
| waterworks | rỗng | Chưa có ID; không đi thuyền |
| construction_columns | rỗng | Giữ dựng cột |
| construction_high_hall | rỗng | Giữ cao đường |
| construction_new_room | rỗng | Giữ phòng/nhà mới |
| construction_wall | rỗng | Giữ xây tường |
| construction_waterside | rỗng | Giữ xây bên nước |

115 clauses: **70 exact_catalog_pair / 45 unmapped**, toàn bộ **interpretation_pending**. ID, quote, scope, polarity, điều kiện và ngoại lệ không đổi so với dataset trước bước này. Metadata là bổ sung; dữ liệu nguồn và manifest không thay đổi. Evidence vẫn informational, rawDelta=0, scoreDelta=0.

## Golden và validation

Dùng `audit-fixtures/mansion-content-golden-v1.json` đã freeze ở Phase 7 để kiểm tra toàn bộ clauses. Không tạo “Golden độc lập” bằng cách copy production. Tests mới khai báo expected pairs/gaps trực tiếp và thử mapping sai (mở cửa→khai trương, xây tường→xây chung, sửa mộ→an táng, thủy công→đi thuyền…). Golden Phase 7 chỉ chứng minh parity nguồn/mapping cũ, không chứng nhận review diễn giải mới.

## Tiếp theo

Review diễn giải và chốt semantics của activity hẹp trước semantic migration/thêm ID. Nếu đổi mapping, cần Golden độc lập cho quyết định mới. Sau đó triển khai conflict theo cùng activity/scope/context, giữ nguồn/phái và điều kiện/ngoại lệ; metadata pending không được dùng làm chứng nhận scoring. Contract conflict và explainability UI chưa thuộc bước 2.

## Kết quả local

- `npm test`: 138 files / 2.776 tests passed.
- `npm run typecheck`, `npm run lint`: passed.
- `python3 scripts/audit-mansion-content-mutations.py`: 9/9 mutants KILLED; sources đã được runner restore.
- Suite có ba thông báo jsdom scrollTo chưa implement, không có test failure.
- Chưa commit/push/PR/deploy; production vẫn là main d1209ec.
