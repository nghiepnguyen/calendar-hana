# Tasks — Roadmap 7b: engine cài luật owner

Nguồn yêu cầu: [PRD](prd-p4-owner-rules-engine.md). Quy trình: [generate-tasks.md](../docs/templates/generate-tasks.md).
Trạng thái: PRD nháp 2026-10-17, chờ owner duyệt.

## Relevant Files

- `shared/lunar/p4OwnerRules.ts` (mới) — layer opt-in `resolveP4OwnerRulesDay`.
- `shared/lunar/p4OwnerRules.test.ts` (mới) — đối chiếu Golden v2, đỏ trước code.
- `shared/lunar/p4OwnerRulesSweep.test.ts` (mới) — sweep miền ngày + context, verify bytes.
- `scripts/audit-p4-owner-rules-mutations.py` (mới) — mutation runner; nối vào `ci:p4`.
- Chỉ đọc: `shared/lunar/p4YiDayComposition.ts`, `p4Puzhu06.ts`, `p4Warehouse.ts`, `p4FullDayComposition.ts`, `p4DayComposition.ts`, `p4GradeResolution.ts`, `p4HeadingAnnotation.ts`, `p4RemainingJi.ts`.
- `docs/audits/sources/p4-vol10/p4-full-golden-v2/` — oracle, không sửa.
- `docs/audits/p4-owner-rules-engine.md` (mới), `PROJECT_CONTEXT.md`.

## Tasks

- [ ] 1.0 Owner duyệt PRD
- [ ] 2.0 Test đỏ từ Golden v2
  - [ ] 2.1 Loader đọc Golden v2 (dated + context), ghim SHA từ lock v2
  - [ ] 2.2 Test so `state`/`ji`/`protected` cho miền ngày và context ngoài E5; stub trả lỗi → đỏ; commit
- [ ] 3.0 Implementation (opt-in, không đổi hành vi mặc định)
  - [ ] 3.1 Hook tham số opt-in cho H2-A, (i), F1, E1 ở tầng dưới (mặc định = hành vi hiện tại)
  - [ ] 3.2 Composer ngày mới: H1-B/F5, E3, sửa phân tầng A04b, scope undetermined theo heading
  - [ ] 3.3 修倉庫: quy tắc D có (i); puzhu:06 với trigger theo (i)
  - [ ] 3.4 Context: bất biến E5 trên soil × ngày âm × phase
  - [ ] 3.5 Trace/reason code
- [ ] 4.0 Sweep + diff Golden v2 = 0; mọi sweep cũ giữ nguyên bytes
- [ ] 5.0 Mutation runner (lượt đối chứng sạch, mỗi luật ít nhất một mutation) + `ci:p4`
- [ ] 6.0 Báo cáo, `ci:local`, `ci:p4` tay, PROJECT_CONTEXT, PR (hỏi trước khi merge)
