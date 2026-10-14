# P4-C 2.13 — Tổng hợp khác biệt nguồn và bảng

2026-10-14. **REVIEWED_COMPARISON_NOT_AUTHORITY_GATE**, audit-only. Tổng hợp 11 entry đã khóa: 31 conflict records nguyên trạng + 9 đối chiếu bổ sung = **40 records**. `decisions.json` giữ entry path/hash, original conflict/index, phân loại, kết luận và vấn đề mở; `comparison.tsv` có 11 dòng đối chiếu input/heading/definitions/catalog/legacy. Đây không phải authority version tổng hợp của 2.14, Golden, implementation hoặc nghiệm thu 2.15.

Reviewer: Codex, một agent; consolidation dựa trên evidence đã review tại 2.2–2.12. Không tuyên bố review scan độc lập thứ hai. Không sửa entry, lock/raw/scan cũ để làm kết quả nhất quán.

## Kết luận theo từng thần

| Entry evidence | Khác biệt / cách đọc thay thế | Kết luận đã khóa |
|---|---|---|
| [母倉 v2](../yi-mucang-v2/README.md), [evidence v1](../yi-mucang-v1/README.md) | 卷五 巳午/不用干而用支 vs 卷十 raw **và scan** 己午; soil canonical chưa chốt; legacy thu chỉ 丑辰, thiếu 戌未 và không soil override | Dùng chi 巳午 theo định nghĩa, không gọi 己午 là lỗi raw transcription. Separate owner convention 18 ngày dân sự trước 四立, UTC+7, onset gồm/四立 trừ, **2025–2027**, soil present thay set mùa. Không đổi P4-B. 納財/栽種/牧養/納畜 direct; warehouse và S1 canonical vẫn mở. |
| [福德](../yi-fude-v1/README.md) | Raw 福徳 vs scan 福德; 四利三元 收福德 vs monthly 滿/福德; definition ritual use vs named use | Nhận alias **福徳** trong scope này; 月建 +2, không alias 滿日/天巫 hoặc hệ khác. Current direct 宴會/修宮室; ritual use không copy từ quotation. |
| [天恩](../yi-tianen-v1/README.md) | Raw 巳卯/巳酉/巳土 vs scan 己; cách đọc lunar days hoặc reset tháng | Scan + 六十甲子/不參諸月令 khóa 15/60 pillars, ranges 0–4/15–19/45–49. Current direct 宴會; court/repair co-presence không biến thành direct 宜. |
| [天巫](../yi-tianwu-v1/README.md) | Definition 合藥請醫 vs editor 故刪; old 天狗 rule áp mọi 滿; cùng vị trí 福德/滿 | 月建 +2; current 祭祀/祈福. Medical use bị editor bỏ. 天狗 giới hạn 申建戌日, ritual 忌 riêng; không delete presence hoặc alias 天狗/福德. |
| [天后](../yi-tianhou-v1/README.md) | 天后與驛馬同位/天后者驛馬也; variants horse từ năm/ngày; 祈福禮神 quotation | Monthly exact-Jie lookup cùng 驛馬 nhưng current scope **求醫療病** riêng; không alias/merge hoặc dùng natal/year/day base. Không mở ritual scope. |
| [天醫](../yi-tianyi-v1/README.md) | Raw 乂為 vs scan 又為; 天喜 seasonal table/cùng vị trí 成日 | 正月起戌順行十二辰, offset +8; medical named scope riêng. Seasonal alternatives thuộc 天喜, không thay 天醫. 乂/又 không predicate delta. |
| [除神](../yi-chushen-v1/README.md) | 義同除日, 五離 đồng vị; raw 災眚 vs scan 災害; catalog tru_than | Fixed day chi 申酉, không monthly 除日 hoặc 五離 alias. Catalog [8,9]/medical/cleaning/cut_hair khớp nguồn; wording không predicate delta. |
| [驛馬](../yi-yima-v1/README.md) | Legacy Dịch Mã sequence khớp nhưng tháng âm; old court/赴任 use; 天后 cùng vị trí | Monthly 正月起申逆行四孟; direct 行幸遣使/般移, court conditional riêng. Exact-Jie Month Jian, không personal/natal horse base. |
| [天馬](../yi-tianma-v1/README.md) | Legacy Thiên Mã (Lộc Mã) sequence khớp nhưng tháng âm, broad wealth/business use; old court/military quotation | 正月起午順行六陽辰; direct 行幸遣使/般移. Lộc Mã không accepted alias, business/wealth scope không adopt. Conditional 天馬+吉期 ở 亥建 / 天馬+天喜 ở 午建 giữ riêng. |
| [吉期](../yi-jiqi-v1/README.md) | Cùng vị trí 除/兵寶; old military/marriage use bị editor sửa; raw court heading SKchar | 月建 +1; current 行幸遣使. 4 source-only court/office headings không map career. Military thuộc 兵寶, marriage bị bỏ. 詔命公卿招賢 chỉ với 天馬 ở 亥建; 0 đồng hiện monthly 驛馬. SKchar chỉ normalized heading. |
| [鳴吠](../yi-mingfei-v1/README.md) | Old14 vs corrected13; raw 巳 vs scan 己; 鳴吠對/金雞鳴玉犬吠; 復日 | Corrected 立成 **13/60**, loại 庚寅/壬寅 và thêm 甲午; 己酉 dùng. 鳴吠對 11-day rule riêng, không alias/merge. Current 安葬, 破土 source-only; 啓攢 không thuộc 鳴吠. 復日 tác động heading, không presence. |

## Phân loại và nguyên tắc đọc

40 records gồm **31 SOURCE_DEPENDENT, 4 NAMING_ONLY, 3 CONVENTION_DIFFERENCE, 1 SPEC_BUG, 1 match không khác biệt**. SOURCE_DEPENDENT mô tả nguồn/reading/scope khác nhau; disposition phân biệt đã giải bằng editor/định nghĩa với còn canonical/P5 unknown. Không dùng nhãn này để nâng mọi entry thành canonical hoặc coi tất cả conflict unresolved.

- **Raw transcription có predicate impact:** 天恩 và 鳴吠 dùng can 己 từ scan + chart; giữ raw 巳 nguyên trạng. Khác **母倉**: raw/scan 卷十 đều 己午, nhưng explicit definition 卷五 dùng chi 巳午; quyết định là đọc scope/definition, không raw correction.
- **NAMING_ONLY:** 福徳→福德 được entry nhận alias; 乂/又, 災眚/災害 và court SKchar không tạo god alias hoặc đổi predicate. 夘/卯, 厯/歷, 㑹/會, 啟/啓 trong quotations giữ bytes/offset, normalization chỉ ở token/heading có căn cứ.
- **Editor sửa source usage:** 天巫 medical, 吉期 military/marriage, 驛馬/天馬 court/military, 鳴吠 old14 đều giữ quotation cũ nhưng adopted rule theo phần sửa được tác giả ghi rõ. Không lấy “nhiều website dùng” hoặc production output làm authority.
- **CONVENTION_DIFFERENCE:** legacy Mẫu Thương/Dịch Mã/Thiên Mã dùng lunar month, khác exact-Jie Month Jian. Bảng nhánh khớp ở Dịch Mã/Thiên Mã không làm input tương đương. Không sửa runtime ở task này.
- **SPEC_BUG có giới hạn:** locator 母倉 v1 納畜 trỏ mục lục offset 774; v2 dùng actual heading 6587 đã được sửa versioned. Đây là lỗi evidence locator, không ENGINE_BUG/GOLDEN_BUG, không sửa source hoặc expected theo evaluator.
- **Match không khác biệt:** 除神 catalog tru_than [8,9] khớp nguồn review độc lập. Các 10 tên còn lại không có dedicated definition/catalog identity; entry 天喜 chỉ đối chiếu scope 天醫, không definition thay thế. Không invent bug cho chỗ thiếu inventory/implementation đã biết.

Cùng vị trí không gộp token/usage: 福德–天巫–滿, 天后–驛馬, 天醫–成日–天喜, 吉期–除日–兵寶, 除神–五離. Alias accepted duy nhất trong 11 entry là **福徳**. Nghĩa tên, label Việt và text “tốt mọi việc” không cấp heading mới.

## Điểm còn mở và unknown

| Vấn đề | Trạng thái / tác động | Cần owner ngay? |
|---|---|---|
| **S1 canonical onset/後/定氣** của 土王 | OPEN, chưa canonical. Separate 母倉 adoption đã duyệt 2026-10-14 cho 2025–2027; missing/unknown soil hoặc ngoài coverage giữ unknown, không fallback seasonal absent. Không đổi soil P4-B hoặc nâng certification. | **Không**: không có evidence mới hoặc yêu cầu thay convention. |
| **P5 修倉庫 月恩/月德** | 卷十 raw/scan 月恩, 卷十一 raw/scan 月德; DEFERRED_P5/unknown. Không chọn warehouse predicate, không flat ANY từ 母倉 present. | **Không**: ngoài P4-C adopted operand scope, cần research/decision ở P5. |

Trong phạm vi adopted P4-C hiện tại không phát hiện conflict chưa có quyết định làm chặn consolidation 2.13. Đây **không phải gate 2.15**. Missing required input/outside validated coverage vẫn unknown ở cả 11 entry; malformed input là error theo audit contract. Source-only/conditional headings giữ ngoài current 29-heading catalog, không tự mở activity. Positive 宜 không tự gỡ raw/protected 忌 hoặc override P4-B.

## Integrity và tiến độ

`validation.json` chứa lệnh tái tạo/read-only verification Python. Kiểm toàn bộ prior locks đệ quy, hashes/offsets của 11 entry; ledger bao phủ nguyên trạng 31 conflict, 11 matrix rows, catalog/definitions/legacy sequences, inventory heading mapping và 2 residual issues. Collection offset self-test/verifier và `git diff --check` qua. Không chạy production resolver/scorer để tạo expected, không gọi đây là Golden.

Task **2.13 hoàn tất**. Tiếp theo **2.14** hoàn thiện authority version/reviewer, rồi **2.15** gate 11/11. Parent 2.0/P4-C chưa nghiệm thu; không chuyển roadmap sang P5, không implementation/activation/merge/deploy.
