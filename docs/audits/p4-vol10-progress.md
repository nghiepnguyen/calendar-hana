# P4 — tiến độ audit-only (mục lục)

Spec: [`docs/plans/p4-xieji-vol10-balancing.md`](../plans/p4-xieji-vol10-balancing.md). Nhánh `codex/p4-authority-lock`, đã merge qua PR #48 (`2cf7bb3`); 「又為X」 qua PR #51 (`2f14092`). Mọi module dưới đây **chỉ test import**: không đổi runtime, bundle trùng production.

| Bước | Module | Oracle khóa trước code | Kết quả chính | Audit |
|---|---|---|---|---|
| Khóa nguồn | — | v1 `08e2aaf`, v2 `19e8673` | 66 ô 等第 (kể cả ô trống), 28 dòng 鋪註, source-role 53 IDs | [authority-lock](p4-vol10-authority-lock.md), [transcription](p4-vol10-transcription.md) |
| Mệnh đề có tên | `p4NamedClauses.ts` | `5591752` | 18 nhóm / 67 cặp override can-chi, 16 nhóm deferral | [named-clauses](p4-vol10-named-clauses.md) |
| Context bridge | `p4ContextBridge.ts` | v1 `4099d88`, v2 `67c442b` | Presence 13 đối tượng bảng (刼煞 theo 卷06), deferral bắc cầu có path, 0 undetermined / 720 | [context-bridge](p4-vol10-context-bridge.md) |
| A03 ô 等第 + nhóm 德 | `p4GradeResolution.ts` | `4f4cea7` | Ô chọn theo (đối tượng, Month Jian), kiểm 11×12; 遇德 = nhóm thần do clause nêu; 0 conflict; đọc lại ô 月厭 下; 德願 giữ undetermined (convention có điều kiện không đạt) | [grade-resolution](p4-vol10-grade-resolution.md) |
| A04a heading theo phạm vi | `p4HeadingAnnotation.ts` | `d36e2aa` | 73 heading / phạm vi; 相抵 → neither_recorded (owner duyệt) | [heading-annotation](p4-vol10-heading-annotation.md) |
| A04b ghép ngày | `p4DayComposition.ts` | `3d03947` | 29 heading activity; 宜 卷十一; 百忌日 bảo vệ; 鋪註 07–10; lan truyền 11/16–24 (0 áp, 27 chặn) | [day-composition](p4-vol10-day-composition.md) |
| A05 bao trùm deferral | (trong A04a) | artifact `0e953c8`, v2 sau PR #49 | 12/16 edge đủ; heading hụt → undetermined | [deferral-coverage](p4-vol10-deferral-coverage.md) |
| Presence 四時 日 | `p4SeasonDays.ts` | `4f447f8` | 王/官 thuyết cũ, 守日 = 辰未戌丑, 長生 theo 令星; mọi nhãn bảng khớp, 3 cách đọc khác bị bác | [season-days](p4-vol10-season-days.md) |
| 又為X (roadmap 3) | trong A04a / A04b | `df4e1f9` (+v2) | 土府/血支 專忌 = phạm vi bảo vệ; 死神 thuộc 平日; 5 thần convention = phạm vi riêng | [youwei-scopes](p4-vol10-youwei-scopes.md) |
| 凶 còn lại + 21 dormant (roadmap 4) | `p4RemainingJi.ts` / `p4FullDayComposition.ts` | source `0b405e6`, partial Golden v8 `5c9e3c0`; ngày âm v1 `5442f10`; end clauses `07ae416`; phase `1b2e9c2` | **PARTIAL**: 26 entry + puzhu:28 / 29 heading / đủ 21 IDs; 51 ca scope + 10 ca ngày + 9 ca ngày âm; 31.755 dòng thật; 0 propagation gỡ, 75 chặn, 6.516 unresolved (sửa lookup 壞/壊); ngày âm, 朔弦望, 鋪註 27/28-first đã mô hình; còn gate S1 | [remaining-ji](p4-vol10-remaining-ji.md) |
| Code review PR #48 | — | — | 10 phát hiện, sửa 7, đồng bộ cách đọc 月破 với production (PR #49) | [day-composition §Sửa sau code review](p4-vol10-day-composition.md) |

**Kiểm chứng gần nhất (main `94cdb05`):** gate P4 321 test; full unit 175 file / 3276 test; typecheck/lint/build qua; bundle `index-CeLinrvj.js` trùng production. Mutation runner (chạy tuần tự): `scripts/audit-p4-{authority,bridge,grade,heading,day,coverage,season}-mutations.py`, đều bắt hết.

**Phát hiện production đã sửa từ P4:** 月破 子午未申 仍忌 (PR #49, deployed `1fc9940`).
