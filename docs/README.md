# Tài liệu dự án

| Thư mục | Nội dung |
| --- | --- |
| [audits/](audits/) | Audit nguồn và provenance cho dữ liệu lịch vạn niên (28 tú, sát chủ, hoàng/hắc đạo, Hiệp Kỷ quyển 10...), audit tổng thể v2.1, báo cáo audit UI |
| [astronomy/](astronomy/) | Mô hình thiên văn tính tiết khí: so sánh mô hình, ERFA, dữ liệu JPL, ranh giới runtime, các migration gate (v3.1 → v3.4A) |
| [group-b/](group-b/) | Nhóm B (nguyệt phá, kiếp sát, tai sát, nguyệt sát, nguyệt đức): nghiên cứu cơ sở, golden fixture, review độc lập, mutation/regression test |
| [rules/](rules/) | Trích xuất quy tắc v3, nhóm A, thiên đức, fixture và quy tắc còn chờ |
| [integrity/](integrity/) | Báo cáo integrity cuối mỗi phase audit (hash file trước/sau) |
| [plans/](plans/) | Kế hoạch triển khai |
| [verification/](verification/) | Kiểm chứng ánh xạ và chấm điểm hoạt động |
| [design/](design/) | Design system (docx/pdf) |
| [templates/](templates/) | Prompt mẫu tạo PRD và danh sách task (dùng cho `tasks/`) |

PRD, danh sách task và bằng chứng audit thô (log, hash, script tái lập) nằm ở [`../tasks/`](../tasks/).

## Đường dẫn cũ

Các file ở `astronomy/`, `group-b/`, `rules/`, `integrity/`, `templates/`, `design/` và audit v2.1 trước đây nằm ở thư mục gốc.
Các artifact đã đóng băng (golden manifest, hash snapshot, báo cáo integrity) vẫn ghi đường dẫn gốc cũ và không được sửa
vì nội dung đã bị khóa bằng SHA-256. Tra đường dẫn hiện tại trong [legacy-paths.json](legacy-paths.json); test
`shared/lunar/groupB.test.ts` và `scripts/mutate-group-b.mjs` cũng phân giải qua bảng này.
