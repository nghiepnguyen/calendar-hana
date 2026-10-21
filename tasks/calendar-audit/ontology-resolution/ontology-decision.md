# Ontology decisions required

2026-10-20 · chờ owner; chưa thực hiện gì trong production.

## Decision 1 — 造龍軒 (張-1)

- A: giữ nguyên — không đổi gì; giữ mâu thuẫn.
- B: 張-1 → gap — 39 dòng baseline đổi hash, 0 thay đổi hành vi.
- C: 危-1, 翼-1, 星-1, 軫-1 → construction — 156 dòng baseline đổi hash, 0 thay đổi hành vi (TSV).
- **Recommended: C**, tuỳ chọn loại 軫-1; ghi nhận 婁-1 là ngoại lệ có lý do. Chi tiết: `construction-ontology.md`.

## Decision 2 — renovation

- A: giữ 修宮室, ghi hợp đồng hẹp "sửa nhà đang có" — 0 thay đổi hành vi.
- B: → 興造動土 — **BEHAVIORAL MIGRATION REQUIRED** (ước tính 187/1095 ngày, 73 đổi status).
- C: → 修宮室 + 興造動土 — **BEHAVIORAL MIGRATION REQUIRED** (ước tính 287/1095 ngày, 117 đổi status).
- **Recommended: A**. Chi tiết: `renovation-ontology.md`.

## Sau khi owner chọn

- B/C của Decision 1: task riêng; sửa resolver/dataset + golden v2 (+ golden v1 nếu đổi scope); migration baseline P4 provenance-only với gate so toàn bộ leaf như lần trước.
- B/C của Decision 2: task riêng có migration hành vi, phiên bản golden mới cho artifact P4 đóng băng; không làm chung với Decision 1.
- 柳-2 không thuộc phase này.

## Vấn đề rộng hơn (chỉ báo cáo)

- construction và groundbreaking gần như không phân biệt được từ nguồn (tắt P4: 0/1098 ngày khác).
- 福德 chưa có trong catalog thần (P4 yi-operands task 2.3).
## OWNER DECISIONS — FINAL (2026-10-20)

### Construction: OPTION C — PARTIAL

ADD:

- 危-1 造高堂 → construction
- 翼-1 架高堂 → construction
- 星-1 造新房 → construction

KEEP:

- 張-1 造龍軒 → construction

INTENTIONAL GAP:

- 軫-1 臨水造龍宮 — INTENTIONAL_GAP / INSUFFICIENT_SEMANTIC_EVIDENCE: 龍宮 not shown to be the same semantic class as civil/general construction. Consistency does not replace evidence.
- 婁-1 竪柱 — INTENTIONAL_GAP / PARTIAL_RITUAL: 竪柱 is part of 豎柱上梁 (beam_raising); no activity for the partial rite.

### Renovation: OPTION A

- renovation → 修宮室 (unchanged)
- Semantic contract: repair/renovate an existing house/building.
- No change to scoring, gods, Trực, activity ID or the UI label "Sửa chữa". A "Sửa nhà" label would be a separate UI-copy task.

Implementation: `tasks/calendar-audit/ontology-resolution-implementation/`.
