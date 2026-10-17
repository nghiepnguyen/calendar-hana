# Golden điểm P4 adapter v1 (roadmap 8, FR-01)

Đóng băng **trước** code adapter. Chính sách: [PRD](../../../../../tasks/prd-p4-score-adapter.md) §5 FR-02, §6 (5–13). Tạo/kiểm: `python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v1/golden.py [--write]`. Gate: `shared/lunar/p4ScoreAdapter.test.ts`.

Độc lập engine: `golden.py` chỉ đọc catalog sản phẩm (ghim sha trong `lock.json`, role `product_catalog_input`) và `p4-full-golden-v2/compose/dated.tsv` (Golden đóng băng). Không đọc output resolver/scorer TS.

- **Lớp A — `cases.json`.** 25 ca tính điểm (flag ON) với input tường minh: Trực, thần cát/hung có mặt, trạng thái từng heading (`state`, `rule: all_taboo`, `prot`), `classicalDay` khi cần chứng minh 6 chain bị thay (A24 ↔ B05: cùng ngày 收日, chain có kích hoạt khi OFF). Expected: score, status, magnitude, hard warning, từng dòng (`rawDelta`, `preCapDelta`, `scoreDelta`, `evidenceOrigin`, penalty `policyId`/`sourceClauseId`/`balancingEligible: false`). 5 ca baseline: expected = output flag OFF của cùng input bỏ thần dormant (§6.10).
- **Lớp B — `activity-states.tsv`.** Trạng thái activity (chặt nhất §6.5, baseline §6.6) cho 1095 ngày × 29 activity có heading, cộng 3 ngày ngoài miền (toàn baseline): 31.842 dòng.

Quy ước đã ghi trong PRD §6: scope = Trực + mọi thần catalog; `preserve_bad` không bị gỡ; protected khớp đúng `han` (thần 百忌日 đã có `preserve_bad`); cap theo thứ tự catalog, penalty xếp cuối pool âm thần, Trực không cap.

Chưa phủ (để roadmap 9 / task sau): §6.13 (thần hung bị Trực bao) không tách được bằng catalog hiện tại — chỉ `nguyet_pha` bị 破日 bao và mọi activity của nó có Trực âm; nối dây almanac → heading state kiểm ở task adapter; event `very_high` (FR-05).
