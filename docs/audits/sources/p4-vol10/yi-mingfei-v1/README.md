# P4-C 2.12 — 鳴吠 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Codex (single agent), không tự nhận review độc lập thứ hai. Chưa Golden/implementation. 鳴吠對 giữ là rule/tên khác, không alias hoặc gộp tập ngày.

## Nguồn, locator và nguyên văn

`entry.json` giữ 6 full raw refs với Unicode code-point offset/length và UTF-8 SHA-1; 15 scan pages đọc trực tiếp ở 2.12. `lock.json` khóa entry/README/validation/renders, raw/PDF, prior locks và comparison artifacts; nguồn/lock lịch sử giữ bytes.

- 卷五 SHA-1 `1d4000974e3222122e8919fa01102dc3cda352a2`, 06067683.cn PDF **130–135, 137–140**. Full block gồm old lists, 神煞起例, **立成** và final editor. Adopt **「共十三日為鳴吠日」**, **「通書誤以庚寅壬寅為鳴吠甲午為鳴吠對…今圖依起例改正」**. Corrected 立成 trang 137 và derivation trang 138–139 đồng nhất: 4 午 + 4 申 + 5 酉 = 13 ngày. Không dùng old 14-day quoted list ở trang 130–131.
- Cùng 卷五 PDF **124–125**: **「今定為鳴吠遇復日則忌徳赦六合遇復日則不忌」**. Đây là heading interaction với 復日; không biến presence 鳴吠 thành absent, không sửa P4-B/composition.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, 06067686.cn PDF **128**: **「鳴吠　宜破土安葬」** và **「鳴吠對　宜破土啟攢」** tách named scopes.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, 06067687.cn PDF **52–53**: 破土 宜鳴吠鳴吠對; 安葬 宜…六合鳴吠; 啓攢 宜鳴吠對. Raw heading giữ full 忌 và nguyên trạng việc 宜/忌 dính cùng dòng ở 安葬.

PDF pages 1-based verified. Printed folio/Archive image alignment chưa ghi thì null, không đoán từ PDF page. PNG là derived render; source raw/PDF mới là locked witness. Punctuation/ellipsis trong scan excerpts không thay raw.

## Predicate và coverage

Input duy nhất **pillar ngày dân sự hợp lệ**, gồm cả can và chi. Adopt corrected set:

| Chi ngày | Can dùng | Pillars |
|---|---|---|
| 午 | 甲、丙、庚、壬 | 甲午、丙午、庚午、壬午 |
| 申 | 甲、丙、庚、壬 | 甲申、丙申、庚申、壬申 |
| 酉 | 乙、丁、己、辛、癸 | 乙酉、丁酉、己酉、辛酉、癸酉 |

13 present / 47 absent trong 60 pillar. Index 0-based từ 甲子: **6, 8, 9, 18, 20, 21, 30, 32, 33, 42, 45, 56, 57**. Không Month Jian/tháng/ngày âm, moon phase, soil, year/natal input. Calendar coverage kế thừa validated civil-day pillar provider, không dated restriction riêng. Missing/outside coverage → unknown; malformed → error. Không suy predicate từ chi 午申酉 đơn thuần hoặc blanket loại can thổ: **己酉 vẫn dùng**, 戊午/戊申 không dùng.

## Khác biệt và biến thể

1. **Old 14 vs corrected 13 — explicit editor correction.** Old list chứa 庚寅/壬寅, thiếu 甲午. Final editor/bảng 立成 loại hai 寅 đó và thêm 甲午. Giữ cả raw quotation nhưng chốt predicate theo correction được tác giả nói rõ, không majority vote hoặc owner convention mới.
2. **Raw 巳 vs scan 己 — transcription correction.** Lời bàn raw `乙丁巳辛癸`/`巳為隂土` giữ nguyên bytes. Scan PDF 138–139 ghi **己**, raw và scan 立成 cũng có **己酉**; adopts stem 己. Không tạo invalid pillar 巳酉 hoặc sửa raw cho test qua.
3. **鳴吠對 — distinct rule.** Corrected set riêng 11 ngày: 丙子/庚子/壬子; 甲寅/丙寅/庚寅/壬寅; 乙卯/丁卯/辛卯/癸卯. Không 甲子; không 甲午. `comparisonOnlyVariant` chỉ ghi identity boundary, không triển khai operand thứ 12, không merge với 鳴吠 hoặc lấy phép đối chi tự động làm predicate.
4. **Tên 金雞鳴玉犬吠 không mở 戌日.** Editor PDF 139–140 giải thích 「戌者指葬地而非指葬日也」, 「非並用雞日犬日之謂也」. Phrase này lưu trong quotation, aliases accepted rỗng.

## Heading và đối chiếu

Direct current catalog: **安葬 → burial**. **破土** là direct source heading ngoài current 29-heading catalog, giữ riêng; không tự map sang 興造動土/earthwork. **啓攢/啟攢 thuộc 鳴吠對**, không cấp scope này cho 鳴吠. Presence không tự gỡ raw/protected 忌; 復日 interaction giữ theo P4-B đã khóa.

`xieji-god-definitions.json`, `good-gods.json` không có entry 鳴吠 riêng; `stars.data.ts` không có 鳴吠/Minh Phệ để adopt. Baseline inventory và `xiejibianfangshu-yiji.json` khớp một heading burial. Không lấy resolver/scorer hoặc danh sách phổ biến ngoài nguồn làm expected.

## Validation và trạng thái

`validation.json` chứa lệnh tái tạo/read-only verification Python. Source collection verifier + offset self-test qua; prior source/authority/baseline locks giữ hashes. Exact 6 slices/SHA-1, 15 PNG signatures, corrected 13 valid pillars/47 absent, old14→new13 correction, separate 11-day variant/disjoint identity, direct/source-only/negative heading và unknown contract đều qua. `git diff --check` qua. Đây là authority consistency, không Golden độc lập task 3.

Task **2.12 xong**, individual entries **11/11 đã chốt**. **Parent 2.0/P4-C chưa nghiệm thu**: còn tổng hợp 2.13, hoàn thiện version/reviewer 2.14 và gate 2.15; tiếp theo **2.13**. P5/S1, Golden và implementation còn mở; runtime/manifest/scoring chưa đổi.
