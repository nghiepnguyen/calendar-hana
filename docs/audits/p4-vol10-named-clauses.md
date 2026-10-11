# P4 — override can-chi và deferral có tên nguồn

Ngày 2026-10-11. Nối tiếp evidence lock v2 `19e8673`, trên nhánh `codex/p4-authority-lock`, PR #48. Không thay bytes/expected values của lock cũ.

## Đã thực hiện

- Chép **18 nhóm, 67 ánh xạ rule–tháng/can-chi (59 cặp context riêng; có overlap)** từ đoạn 月厭: đại hội, tiểu hội, âm vị, giao phá, kích xung, dương phá, âm đạo, tuế bạc, trục trận, tam âm, dương/âm thác và ngoại lệ, tuyệt âm/dương. Các nhóm chồng nhau được giữ cùng nhau; không chọn “nặng nhất”.
- Khóa **16 nhóm deferral có tên**: 月建, 平日, 收日, 閉日, 月害, 月刑, 大時, 天吏, 災煞. Đích chuyển chỉ là nguồn cần tra tiếp, chưa là kết luận của việc cụ thể. Phải biết subject/scope thật sự áp dụng trước khi kích hoạt.
- Ngoại lệ 德合/德願 là nhóm được nguồn gọi tên, không gộp mọi sao tốt. Ví dụ 六月己未 theo 月建 và không theo 德合所宜; 六月己巳 theo 月厭 và không theo 德合所宜. 四月己巳 là tiểu hội 諸事皆忌, không dùng nhánh dương thác thường lệ.
- Giữ negative witness: **月害 không theo 天吏**, vì 天吏 không bao trùm danh sách việc 月害 kỵ. Đây là ranh giới rõ của 從重論, không phải universal max-grade.
- Helper annotation theo từng heading áp câu `凡所忌者則不註宜所宜者亦不註忌` trong scope đã chứng minh. `neither_recorded` không trở thành product neutral; unknown không được kích hoạt. Gỡ 忌 không tự sinh 宜; ngày “遇德猶忌” giữ 忌 theo câu nguồn. Scope khác phải được resolver cấp trên giữ riêng.

Nguồn `vol10.raw.txt` được giữ nguyên; mỗi quote có offset Unicode code points. Glyph 己亥 → cách đọc 巳亥, 夘 → 卯 và lựa chọn 月建午 → 月厭 được ghi rõ trong `editorialNormalizations`; không sửa text nguồn. Quote ngắn được kèm toàn đoạn chứa hậu tố hiệu lực, tránh gán effect bằng default policy.

## Artifact / oracle

- `shared/almanac-data/p4-vol10-named-clauses.json`: predicates/source refs, trạng thái audit-only; `scoringReady: false`.
- `shared/almanac-data/golden-p4-named-clauses.json`: **26 expected sets** đọc tay trước helper, giữ nguyên sau lần test đỏ vì module chưa có. Có overlap, exception và ngày không khớp; đây là partial source oracle, không phải score oracle.
- `docs/audits/sources/p4-vol10/named-clauses-lock.json`: checksum artifact/oracle bổ sung, parent là lock v2. Không cập nhật theo scorer.
- `shared/lunar/p4NamedClauses.ts` và test: audit helpers chỉ được test import; chưa nối runtime. 49 tests mới, gate P4 tổng 217 tests.

## Phạm vi còn lại trước scoring

A03 có bảng named pillar overrides, nhưng chưa hoàn tất canonical resolver nối presence, bảng 等第 và bare 遇德. A04 có contract heading transformation, nhưng còn cần applicability và propagation cho đủ activity headings. A05 có named edge inventory và negative witness, nhưng còn cần resolver target/transitive scopes cùng Golden cho toàn pipeline. Không đóng ba issue bằng cách đổi cờ readiness.

Full scoring Golden, P5 warehouse đầy đủ, bridge 21 thần, xử lý trước cap, penalty có nhãn policy, activation/rollback flag và diff so baseline sau Release A vẫn chưa hoàn thành. Không có merge/deploy hay đổi production trong phần này.

## Kiểm chứng

Full unit: 167 file / 3162 tests qua trước khi thêm 7 ca deferral; gate 217 tests chạy lại sau bổ sung. Typecheck/lint/build qua; bundle SHA-256 vẫn `00c37f604701221d662aa3f4401f9419964bf921ef8451647b879a249ce7ac33`. Ba mutation audit helper (unknown kích hoạt, deferral không có tên, cancel thành both) bị bắt; helper phục hồi và gate chạy lại xanh. Report `p4-vol10-named-mutation-results.json`; đây không phải mutation gate của scoring/go-live. `graphify update .` đã chạy.
