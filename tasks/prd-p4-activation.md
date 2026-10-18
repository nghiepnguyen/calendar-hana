# PRD — Roadmap 10: activation P4 (flag `xiejiVol10BalancingEnabled` ON)

Ngày: 2026-10-18. Trạng thái: **PRD chốt 2026-10-18**: owner duyệt §5 theo đề xuất (1 PR-1 trước, 2 nạp provider không chặn + DayView chờ, 3 soạn nghĩa 16 thần để duyệt, 4 thêm mục "Đã gỡ theo Hiệp Kỷ", 5 diễn tập rollback local). PR-1 xong (PR #70). PR-2 trên nhánh `claude/p4-activation`, [báo cáo](../docs/audits/p4-activation.md).

## 1. Bối cảnh

- Roadmap 8 (adapter), 9 (diff + rollback) đã deploy với flag OFF (`9865eee`). Go-live review roadmap 9 xong; roadmap 9b ([báo cáo](../docs/audits/p4-9b.md)) đã được owner duyệt 2026-10-18, gồm 216 event đổi classification.
- Spec: [p4-xieji-vol10-balancing.md](../docs/plans/p4-xieji-vol10-balancing.md) §5 (21 thần, một flag, UI), §8 bước 7–8, §9 điều kiện 4 (đủ 21 thần + balancing + P5 cùng activation).
- Quy trình (PROJECT_CONTEXT §7): branch → gate local → PR → **owner cho phép merge** → deploy → bundle SHA → smoke → cập nhật context. Merge vào main = deploy production.

## 2. Hiện trạng nhánh

| Nhánh | Nội dung | Trạng thái |
|---|---|---|
| `claude/p4-migration-diff` | 9 commit docs sau `9865eee` (status sau deploy, go-live review nhóm 1–7, acceptance) | chưa push |
| `claude/p4-9b` (đặt trên nhánh trên) | 9b: Golden điểm v2, adapter + UI sau flag, luật migration v2, diff v2, mutation, docs | chưa push; `ci:local`, `ci:full`, `ci:p4` EXIT 0 |

9b đổi runtime **chỉ khi flag ON** (flag OFF byte-equal baseline v1, UI không đổi). Merge 9b với flag OFF = deploy không đổi gì cho người dùng.

## 3. Việc của roadmap 10 (inventory)

| # | Việc | Ghi chú đo / hiện trạng |
|---|---|---|
| A1 | Nạp provider `p4AlmanacHeadings` (dynamic import) **trước almanac đầu tiên** | Almanac memo key `${datasetVersion}:${ENGINE_VERSION}:${date}` không có flag/provider: almanac tính trước khi provider nạp sẽ kẹt ở baseline. Consumer: `AlmanacPanel`, `DailyActivitySection` (DayView), `eventRecommendations`, `shared/seo/daySeo.ts` (prerender lúc build) |
| A2 | Prerender SEO (`scripts/prerenderDays.ts` → `daySeo`) nạp provider | Không nạp thì trang SEO tĩnh hiện baseline, lệch app |
| A3 | Flag `true` trong manifest | Test `p4AdapterBaseline` assert `false` → đổi thành test "flag OFF override = baseline v1" (giữ bằng chứng rollback) |
| A4 | `meaning` 16 thần dormant đang rỗng (5 thần có alias lấy nghĩa sao âm lịch) | Có trích dẫn 協紀 trong `xieji-god-definitions.json`, chưa có câu giải nghĩa tiếng Việt |
| A5 | Dòng giải thích spec §5: "có sao" / "kỵ đã được gỡ" / "kỵ vẫn áp dụng" | 9b đã có "kỵ vẫn áp dụng, đã đạt mức trừ tối đa" (dòng bị cap) và nhãn dòng −25 "Điểm trừ mặc định của ứng dụng". Dòng bị gỡ (informational) hiện **không hiện** trên UI |
| A6 | Hiệu năng | Node, máy dev: almanac đầu tiên OFF 17 ms / ON 53 ms; ~32 ms/ngày khi ON; quét "ngày tốt kế tiếp" 3 event × 30 ngày 6 → 35 ms. Mobile ước ~4× |
| A7 | Bundle | Resolver ~409 kB (gzip ~91 kB) ở chunk riêng; `index` +0,66 kB (đo roadmap 8) |
| A8 | Release evidence | CI local + `ci:full` + `ci:p4`; bundle SHA production; smoke desktop Chrome, Pixel 7, Safari desktop (iPhone/Firefox ghi chưa chạy — R3) |
| A9 | Smoke | Ngày có mỗi nhóm dormant, ca 德, warehouse, 百忌亥/巳, event very_high, 諸事皆忌 floor, `both_present` −25, `wedding` P2, dòng bị cap; trước deploy (giá trị cũ) và sau deploy |
| A10 | Rollback | PR một dòng flag `false` → deploy → SHA/smoke; đã chứng minh byte-equal ở roadmap 9 (`p4MigrationRollback.test.ts`) |

## 4. Đề xuất mặc định

1. **Thứ tự merge:** PR-1 = `claude/p4-migration-diff` + `claude/p4-9b` (flag OFF, không đổi người dùng) → merge → deploy → kiểm bundle chứa `xiejiVol10BalancingEnabled:!1`. PR-2 = activation (A1–A5 + flag ON) → merge → deploy → smoke.
2. **A1 nạp provider:** `main.tsx` bắt đầu `import('@shared/lunar/p4AlmanacHeadings')` ngay khi khởi động (không chặn); thêm "provider đã nạp" vào memo key almanac; DayView chờ provider (khung loading ngắn) trước khi tính almanac. Không chặn render tháng/tuần (chỉ dùng `getDayInfo`). Lý do: không tăng thời gian mở app, không để almanac baseline kẹt trong memo.
3. **A2:** prerender import provider trước `daySeo`.
4. **A4:** soạn 1 câu nghĩa tiếng Việt cho 16 thần từ trích dẫn 協紀 đã khóa, kèm bảng cho owner duyệt trước khi ghép.
5. **A5:** chi tiết activity thêm mục "Đã gỡ theo Hiệp Kỷ" liệt kê dòng 忌/宜 bị gỡ (nhãn "kỵ đã được gỡ" / "không ghi tốt"); giữ chú thích "kỵ vẫn áp dụng" của 9b.
6. **A10:** diễn tập rollback trên build preview local (ON → OFF, so bytes), không diễn tập trên production; rollback production chỉ khi cần.

## 5. Cần owner trả lời

1. Đồng ý **PR-1** (merge 9b + docs với flag OFF, deploy không đổi người dùng) trước PR activation? (Đề xuất: có.)
2. **A1:** nạp provider không chặn + DayView chờ (đề xuất), hay chặn toàn app tới khi nạp xong (đơn giản hơn, chậm lần mở đầu ~91 kB gzip)?
3. **A4:** soạn nghĩa 16 thần từ trích dẫn 協紀 để owner duyệt (đề xuất), hay để trống ở release đầu?
4. **A5:** thêm mục "Đã gỡ theo Hiệp Kỷ" ở chi tiết activity (đề xuất), hay chỉ giữ chú thích "kỵ vẫn áp dụng" của 9b?
5. **A10:** diễn tập rollback local, không trên production (đề xuất)?

## 6. Non-goals

28 Tú scoring; P1 (天狗寅日); siết `event_fit` (backlog owner); thêm 忌 ngoài catalog; iPhone/Firefox smoke (R3, ghi chưa chạy).
