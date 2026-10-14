# P4-C 2.11 — 吉期 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Codex (single agent); không tự nhận review độc lập thứ hai. Chưa Golden/implementation.

## Nguyên văn, locator và scan

`entry.json` giữ 10 raw refs nguyên trạng, Unicode code-point offset/length và UTF-8 SHA-1; 10 scan pages đọc trực tiếp ở task 2.11. `lock.json` khóa entry/README/validation/renders, raw/PDF, prior authority locks và comparison artifacts; không refresh nguồn/lock cũ.

- 卷四 SHA-1 `da680c13601d1cb7b81a1b5e53645e87b8f524b7`, 06067682.cn PDF **25–26**. Chart **除／吉期／兵寶** và definition **「厯例曰常居月建前一辰也」**, 「蓋常居建前一辰可與要約吉事故因名之」. Ví dụ ở scope 兵寶 đồng vị **「假如寅為兵福則夘為兵寶」** và chart khóa hướng +1. Giữ old quotation military/㑹親姻 trong raw, không lấy nó làm direct scope sau editor correction.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, 06067686.cn PDF **111–112**. Named scope **「又為吉期宜施恩封拜舉正直行幸遣使上官赴任臨政親民」**; conditional **「十月與天馬併宜詔命公卿招賢」**, notes 「驛馬不得與吉期併」. Editor **「舊謂吉期宜兵事葢兵寶之誤又謂宜結婚姻於義無取故刪」** chốt phạm vi, không source conflict còn mở về predicate.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, 06067687.cn PDF **17–18, 23, 25–27**. Chép full heading gồm raw 忌: 施恩封拜, 舉正直, 行幸遣使, 上官赴任, 臨政親民; court co-presence riêng. 出師 có 兵寶, không 吉期; 結婚姻 không 吉期, khớp editor correction. Raw court heading `詔命公{{SKchar|2721}}招賢` giữ bytes; scan xác nhận **詔命公卿招賢**, chỉ normalization heading.

PDF pages 1-based verified. Printed folio/Archive image alignment chưa ghi thì null, không suy từ số PDF. Ba renders 111/112/23 tái dùng bytes locked evidence rồi đọc lại; bảy renders mới từ PDF gốc. Scan excerpts có punctuation/ellipsis riêng, raw giữ full source bytes. Không phát hiện discrepancy làm thay predicate/direct scope.

## Predicate, input và coverage

Presence khi **chi pillar ngày = Month Jian tiến một chi**, tức `(monthBranchIndex + 1) mod 12`. Chart được đọc độc lập với resolver/runtime.

| Month Jian | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chi ngày 吉期 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 | 子 |

Input **exact-Jie Month Jian + chi pillar ngày hợp lệ**; không can ngày, tháng/ngày âm, phase, soil, năm sinh/personal pillar. Structural domain 12×60 = 720 context; calendar coverage kế thừa validated providers, không tự đặt dated restriction. Missing/outside coverage → unknown; malformed → error theo audit contract. Không tìm thấy ngoại lệ loại presence; heading 忌/conditional co-presence không đổi presence.

## Scope, aliases và đối chiếu

Direct heading trong current 29-heading catalog chỉ **行幸遣使 → travel**. Bốn direct source headings **施恩封拜、舉正直、上官赴任、臨政親民** ghi riêng ngoài catalog, không tự map vào career/appointment hay mở activity.

詔命公卿招賢 cần **吉期 + 天馬 tại 亥建 (tháng 10), chi ngày 子**. 卷十一 ghi general co-presence list; kiểm 12 target của 天馬 đã khóa cho đúng một intersection 亥→子, khớp 卷十. 驛馬 monthly không thể đồng hiện 吉期 (0/12), khớp notes. Đây là source/table consistency, không Golden. Không lấy co-presence làm điều kiện presence 吉期.

Chart đồng vị với 除日/兵寶 không là alias cho token/evaluator P4-C. Không copy 除日 medical/bathing/removal scope; military scope giữ 兵寶 riêng, marriage scope bị editor bỏ. Alias accepted rỗng.

`xieji-god-definitions.json`, `good-gods.json` không có entry 吉期 riêng; `stars.data.ts` không có 吉期/Cát Kỳ để adopt. Inventory task 1 và `xiejibianfangshu-yiji.json` khớp một heading travel; không mở các heading ngoài catalog. Prior 天馬/驛馬 table chỉ được dùng kiểm consistency của conditional notes, không tạo expected từ production.

## Validation và giới hạn

`validation.json` chứa lệnh tái tạo và read-only verification Python. Task-2.1 verifier/offset self-test qua; prior authority/source/baseline locks kiểm đệ quy và giữ hashes. Exact raw slices/SHA-1, PNG signatures, 12 targets/720 structural contexts, inventory/direct/source-only/conditional refs, 1 天馬 intersection và 0 驛馬 intersections đều qua. `git diff --check` qua. Đây là authority consistency check, không thay Golden độc lập task 3 hoặc production predicate tests.

Task 2.11 xong, **10/11 authority**; parent 2.0/P4-C còn mở, tiếp theo 2.12 鳴吠. P5/S1 còn mở; runtime/manifest/scoring chưa đổi.
