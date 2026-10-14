# P4-C 2.14 — Authority tổng hợp v1

2026-10-14. Artifact: [`p4-yi-operands-v1.json`](../../../../../shared/almanac-data/p4-yi-operands-v1.json), schema `p4-yi-operands-authority-v1`, status **AUTHORITY_ASSEMBLED_PENDING_2_15_GATE**, AUDIT_ONLY, scoringReady false.

Đủ 11 entries, copy nguyên trạng toàn bộ fields từ authority riêng đã khóa: stable ID/han/aliases, authority ID/version/status, sources nguyên văn/Unicode code-point offset/SHA-1, scan locators/transcriptions, predicate/input/coverage, heading/exception/conflict và reviewer. Chỉ thêm `ruleId` và `provenance` cho mỗi entry. `provenance` giữ entry path/SHA-256 và lock path/SHA-256; không renumber sourceRefs hoặc sửa predicate để đồng bộ schema.

## IDs, inputs và current direct headings

| Han / stable ID | Authority ID | Required inputs | Direct current catalog headings |
|---|---|---|---|
| 母倉 / mu-cang | p4-yi-mucang-v2 | Month Jian, day branch, validated soil state/date provenance | 納財、栽種、牧養、納畜 |
| 福德 / fu-de | p4-yi-fude-v1 | Month Jian, day branch | 宴會、修宮室 |
| 天恩 / tian-en | p4-yi-tianen-v1 | valid day pillar | 宴會 |
| 天巫 / tian-wu | p4-yi-tianwu-v1 | Month Jian, day branch | 祭祀、祈福 |
| 天后 / tian-hou | p4-yi-tianhou-v1 | Month Jian, day branch | 求醫療病 |
| 天醫 / tian-yi | p4-yi-tianyi-v1 | Month Jian, day branch | 求醫療病 |
| 除神 / tru_than | p4-yi-chushen-v1 | valid day branch | 掃舍宇、整容剃頭、求醫療病 |
| 驛馬 / yi-ma | p4-yi-yima-v1 | Month Jian, day branch | 行幸遣使、般移 |
| 天馬 / tian-ma | p4-yi-tianma-v1 | Month Jian, day branch | 行幸遣使、般移 |
| 吉期 / ji-qi | p4-yi-jiqi-v1 | Month Jian, day branch | 行幸遣使 |
| 鳴吠 / ming-fei | p4-yi-mingfei-v1 | valid day pillar | 安葬 |

Mỗi rule ID là **`authorityId + :presence`** (11 IDs duy nhất), ví dụ `p4-yi-mucang-v2:presence`. Đây là ID trace cho rule đã versioned, không thay catalog ID `tru_than`. `sourceRefs` là index 0-based vào chính entry.sources, không global index. Trace contract giữ authorityId/ruleId/inputs/presence/sourceRefs để implementation sau dùng đúng provenance.

## Status, coverage và residual scope

10 entry **SOURCE_REVIEWED**; riêng 母倉 **OWNER_ADOPTED_SOURCE_DEPENDENT**, không tự nâng thành canonical. Giữ soil authority riêng `p4-yi-mucang-soil-owner-convention-v1`: UTC+7, 18 ngày dân sự trước 四立, onset included/四立 excluded, coverage **2025–2027**. Unknown soil hoặc ngoài coverage không fallback ordinary seasonal absent. S1 canonical onset/後/定氣 vẫn OPEN, P4-B soil authority không đổi.

7 monthly rules (福德/天巫/天后/天醫/驛馬/天馬/吉期) có structural domain 12×60; 除神/天恩/鳴吠 có miền 60 pillar riêng. 母倉 cần thêm soil, không coi 720 contexts đơn thuần là đủ. Coverage đầy đủ và input origin nằm nguyên trạng trong mỗi entry; Month Jian dùng exact Jie, không lunar month hoặc whole-day legacy officer. Missing required input/outside coverage → unknown, malformed → error theo audit contract.

Source-only và conditional headings được giữ nguyên theo entry, không tự map vào activity. 修倉庫 của 母倉 vẫn P5 deferred; 月恩/月德 source conflict chưa chọn predicate. 鳴吠對 comparison vẫn không alias hoặc operand thứ 12. Alias accepted duy nhất là 福徳→福德. Bộ tổng hợp giữ 2 residual issues từ [comparison 2.13](../yi-comparison-v1/README.md), không thay các decisions đã khóa.

## Reviewer và evidence

Reviewer nguồn từng entry và assembly: **Codex (single agent)**. Top-level `independentSecondReview: false`; limitations riêng của từng entry giữ nguyên. Các scan được review trong 2.2–2.12; bước này kiểm copy/provenance, không tuyên bố reread scan độc lập thứ hai hoặc chuyên gia xác nhận canonical.

`evidenceFiles` khóa **130 unique raw/PDF/render file paths** bằng SHA-256; sources vẫn giữ SHA-1 của raw và exact offset/length. `lock.json` khóa artifact, README/validation, prior entry/collection/baseline/comparison locks. Không ghi đè bất kỳ source/authority/Golden lock lịch sử nào. Checksum ở bước này không thay yêu cầu commit freeze authority/Golden trước implementation tại task 3.6.

## Validation và tiến độ

`validation.json` chứa lệnh tái tạo/read-only verifier. Copy mỗi entry phải bằng nguyên bản sau khi bỏ duy nhất ruleId/provenance; kiểm 11 distinct stable IDs/authority IDs/rule IDs, đủ input/predicate/coverage/heading/reviewer, 74 raw source slices và 130 evidence hashes, prior locks đệ quy, status 母倉 và residual S1/P5. Prettier JSON, lint/main typecheck và `git diff --check` qua; graph cập nhật sau artifact change. Không có production import/evaluator mới.

Task **2.14 hoàn tất**. Tiếp theo **2.15** kiểm gate authority 11/11. Parent 2.0/P4-C chưa nghiệm thu; Golden chưa frozen, presence chưa implementation, activation false. Không chuyển sang P5 hoặc tự merge/deploy.
