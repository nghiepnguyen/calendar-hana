# Full Golden P4 v1 (roadmap 7)

Index: `shared/almanac-data/golden-p4-full-v1.json`. Gate: `shared/lunar/p4FullGolden.test.ts`, chỉ kiểm hash, không import engine.

Trạng thái: **HASH_LOCKED_PRE_ENGINE_COMPARISON**, audit-only, chỉ lớp resolution. Score adapter, cap và event thuộc roadmap 8.

| Phần | Thư mục | Ghi chú |
|---|---|---|
| Inventory input (1.0) | [inventory.md](inventory.md) | |
| Presence 35 thần (3.1) | [presence/](presence/README.md) | |
| Lớp 忌 P4-B (3.2) | [ji/](ji/README.md) | |
| Trạng thái ngày + kiểm (3.3, 3.4) | [compose/](compose/README.md) | |
| Câu hỏi owner | [../../../p4-full-golden-hold-questions.md](../../../p4-full-golden-hold-questions.md) | H1-B, H2-A; F1/F4/F5 và E1/E3/E5 ghi trong README của `ji/` và `compose/` |

## Đóng băng (task 4.0)

[freeze.py](freeze.py) sinh [lock.json](lock.json) và file index. Chạy mặc định để kiểm bytes; `--write` để sinh lại; `--proof <sha>` để ghi [commit-proof.json](commit-proof.json) từ Git object sau commit freeze.

`lock.json` chứa:
- **SHA-256** của 9 script derive, 20 output, 31 input, 12 Golden fixture viết tay (`frozen_oracle`) và 4 file `oracle_only`.
- **Proof không có input engine** (`noEngineInput`):
  - quét mọi path literal trong script; 0 vi phạm với các luật cấm `shared/lunar/*.ts`, sweep TSV, `*-baseline-v1/`, `context-p4c` và `xieji-god-tables.json`;
  - import chỉ gồm thư viện chuẩn và các stage anh em nạp theo đường dẫn cố định;
  - 4 file `oracle_only` (puzhu:06 v3 `dated`/`context`, `jie-convention.json`, A04b v1) gián tiếp đến từ engine hoặc ra đời trước P4-B. Chúng chỉ dùng để so sau khi expected đã suy xong.
- **Lớp lệch đăng ký trước** (`diffClasses`):
  - quyết định owner: H2-A, H1-B/F5, F1, F4, E1, E3, E5;
  - lựa chọn của Golden: E2, E4, E6, CONTEXT_DATE_OPERAND_POLICY, LATER_SCOPE, PUZHU06_HOLD_UNDER_H1B;
  - lớp chung: ENGINE_BUG, GOLDEN_BUG, SPEC_BUG, SOURCE_DEPENDENT, CONVENTION_DIFFERENCE, NAMING_ONLY.

  Task 6.0 phải xếp mọi lệch vào một lớp trong danh sách này.
- **Kế hoạch so engine** (`engineComparisonPlan`):
  - miền ngày: `resolveP4Puzhu06Day` cho 29 heading, riêng 修倉庫 dùng `resolveP4WarehouseDay`; Month Jian theo quy ước calendar-day; so `state` / `ji` / `protected`;
  - miền context: chỉ so ở các dòng không `undetermined` theo E5.

Trước khi đóng băng, lần tiếp xúc engine duy nhất là chẩn đoán ở task 2.1 và các lần đọc code đã ghi log trong `ji/README.md` và `compose/README.md`. Chưa chạy phép so Golden ↔ engine nào.

## Giới hạn

Single agent (Claude). Owner review ở task 8.0. Bảng presence và danh sách 忌 lấy từ authority đã khóa, không suy lại từ văn gốc.
