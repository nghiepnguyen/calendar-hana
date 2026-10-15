# P4-C 4.6 — Presence / coverage / lock gate

2026-10-15: **PASS trong scope presence audit-only; parent 4.0 hoàn tất.** Tiếp theo 5.1 viết regression heading đỏ. P4-C chưa nghiệm thu.

Chạy lại bốn suites provider/domain/input/trace: 2.479 tests, **2.451 PASS**, đúng **28 assertion RED** của listed-heading masked ANY giữ nguyên tên so với run 4.5. Không failure mới, skip/todo hoặc collection error. 28 tests thuộc integration 5.x; không tuyên bố toàn unit suite/CI xanh. Full domains 7.863 records, presence replay 906, source slices 74 và scan checks 120 được kiểm bằng suites hiện có.

Chạy lại chín suites legacy: **198 PASS**. `npm run lint` và `npm run typecheck` (main + functions) PASS. Build 4.5 được reuse sau khi xác nhận code bytes và bundle SHA-256 khớp; không chạy build mới. Bundle `index-CeLinrvj.js`: `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`.

Replay evidence 4.5 và chuỗi verifier 4.1–4.4: **677 frozen source/Golden hashes**, legacy API/manifest bytes và static production import closure PASS trước gate. Snapshot code/evidence trước và sau gate giữ bytes; verifier bên dưới kiểm lại khóa sau gate. Không sửa code, expected, nguồn hay evidence cũ. Graph AST giữ nguyên từ 4.5 vì chỉ thêm tài liệu/evidence.

[Results](results.json), [full test output](test-results.json), [legacy output](legacy-results.json), [replay verifier](validation.json). Lệnh test chính xác nằm trong output `testResults[].name` và validation commands. Exit 1 của bốn suites là đúng 28 RED được phân loại, không phải presence gate failure.

Reviewer single Codex, không independent second review. 母倉 vẫn OWNER_ADOPTED_SOURCE_DEPENDENT trong 2025–2027; S1 canonical OPEN, P5 deferred. Chưa ghép heading/ANY, sweep, commit/push/merge/deploy.
