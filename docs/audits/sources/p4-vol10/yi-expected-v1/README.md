# P4-C 3.2 — Expected độc lập từ nguồn

2026-10-14. **Task 3.2 hoàn tất — EXPECTED_DERIVED_PENDING_3_3_TO_3_6**. [expected.json](expected.json) chứa **906 fixture presence**, **25 fixture phân biệt identity** và **24 fixture malformed**. Chưa đóng băng Golden, chưa triển khai provider presence hoặc gọi evaluator/scorer/resolver của dự án.

## Đầu vào và phương pháp

[source-basis.json](source-basis.json) ghi source refs theo từng entry, nguyên văn/offset/SHA-1, scan transcription, literal đã chép để suy expected và các SHA-256 đầu vào. Đây là bản chép phục vụ phép tính độc lập, không đọc `entry.predicate` hoặc bảng production để tính expected. Các authority ID/rule ID/sourceRefs là provenance, không oracle output. Mỗi fixture có input, expected và derivation riêng; lần đọc source raw kiểm exact slice trước khi tính.

- **福德/天巫/吉期**: đi từng chi thuận từ Month Jian, lần lượt hai/hai/một bước; ví dụ nguồn 寅→辰 và 寅→卯 khóa hướng. **天醫**: bắt đầu 戌 ở 寅建 rồi đi 十二辰. Không mượn offset implementation.
- **天后/驛馬**: đọc 正月起申逆行四孟, đi chuỗi 申→巳→寅→亥 rồi lặp; giữ identity/scope riêng. **天馬**: bắt đầu 午 rồi đi 六陽辰 午→申→戌→子→寅→辰; 四/十月 tại 子.
- **天恩**: từ scan PDF38, endpoints 甲子–戊辰 / 己卯–癸未 / 己酉–癸丑; tự tạo lục thập hoa giáp từ 10 can và 12 chi để tính indices/inclusive membership. Raw 巳 giữ bytes, không biến thành pillar sai.
- **除神**: membership 申酉, không cần tháng hoặc can. **鳴吠**: corrected 立成 gồm 甲丙庚壬 phối 午申 và 乙丁己辛癸 phối 酉; loại old14 庚寅/壬寅, nhận 甲午/己酉. Không gộp 鳴吠對.
- **母倉**: đọc xuân 亥子 / hạ 寅卯 / thu 辰戌丑未 / đông 申酉. Soil present thay bảng mùa bằng 巳午, không union. Soil được tính bằng phép trừ 18 ngày dân sự UTC+7 theo owner adoption riêng; không dùng expected soil Golden P4-B.

[derive.py](derive.py) chỉ import Python standard library. Script dùng dữ liệu thiên văn **JPL frozen Golden v4** làm input thời khắc, không import module runtime hoặc chạy astronomy engine. Odd termIndex xác định exact Jie; lấy crossing cuối cùng ≤ instant. Day pillar được tính bằng Gregorian JDN độc lập, chênh ngày từ anchor đã khóa **1900-01-01 / 甲戌 / JDN 2415021**; cả 100 JDN/day-can-chi records lịch đã khóa được đối chiếu. Không lấy field presence từ Golden P4 cũ hoặc baseline measurement.

Ngày 四立 của cả ba năm được tính từ JPL UTC+7 và đối chiếu **12 dòng HKO** đã khóa. HKO là input thiên văn/date witness, không chứng nhận S1 cổ điển. Không thực hiện audit astronomy mới; tái dùng authority/calendar inputs đã nghiệm thu.

## Phạm vi fixture

| Nhóm                 | Ca đã tạo trong 3.2                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presence của 11 thần | Target và hai phía, wraps/sequence, endpoints và corrected set; mỗi thần có present/absent/unknown                                                                                                       |
| 7 monthly rules      | 36 target-neighbor cases/rule; toàn bộ 12 exact Jie năm 2025 × trước/đúng/sau 1 ms = 252 instant cases                                                                                                   |
| 母倉                 | Ngày thật cho tất cả ordinary branches của bốn mùa, soil override 巳/午 và ordinary-only counterexample; 12 四立 × 6 biên ngày = 72; 12 seasonal Jie × 3 biên instant = 36; bốn dated coverage endpoints |
| Missing/coverage     | Omit từng required input/tất cả, provider unknown/outside riêng; soil thiếu provenance, soil unknown, local dated coverage riêng                                                                         |
| Alias/identity       | 福徳→福德 với present/absent/unknown, giữ authority/rule/source trace; 25 tên không alias, không suy thành absent presence                                                                               |
| Malformed            | Invalid chi/type/pillar 甲丑; soil sai authority/status/timezone/date → error theo contract                                                                                                              |

Các tuple structural dùng pillar hợp lệ nhưng không được trình bày như ngày có thật. Tất cả positive 母倉 fixtures có ngày thật/soil provenance riêng. Các ca thiếu input hoặc provider outside/unknown là **scenario contract được khai báo**, không giả mạo một ngày outside coverage của provider. Với 10 thần không có cutoff riêng, không tự dùng năm 2024/2028 để suy unknown.

Fixture `irrelevantInput` giữ required tuple và expected invariant, ghi key/variant plan để adapter sau thử bỏ hoặc thay valid optional input; không mở thêm required input. Contract JSON ở đây là declarative fixture representation, chưa phải API runtime task 4.1. Identity/malformed assertions tách khỏi presence; chưa chốt lớp lỗi hoặc normalization API cụ thể.

Ở ngày 四立, soil đã absent từ đầu ngày dân sự ngay cả 1 ms trước Jie; Month Jian/mùa chỉ chuyển ở exact Jie. Ca 2027-12-31 nằm trong coverage, là 甲申/子建/soil absent nên **母倉 present**, không suy absent vì đây là endpoint. Outside coverage 2024-12-31 và 2028-01-01 giữ unknown dù có input chi hợp lệ.

## Kiểm chứng, corrections và giới hạn

[validation.json](validation.json) lưu verifier/commands/corrections. Replay so JSON với derivation độc lập; `--write` chỉ tạo lần đầu bằng exclusive creation và từ chối ghi đè. AST kiểm import standard library và không truy cập predicate/project evaluator. [prior-hashes.json](prior-hashes.json) giữ **645 file** từ trước 3.2 (shared, Golden v3/v4, sources), kiểm bytes bất biến. [lock.json](lock.json) khóa riêng expected/basis/script/report/verifier và prior authority/matrix locks; đây là integrity checkpoint, không commit freeze 3.6.

Hai correction trước review/freeze được ghi minh bạch:

1. **SPEC_BUG — fixture selection generator**: validator phát hiện 除神 chưa có ca gắn category boundary. Bổ sung 12 ca 未/申/酉/戌 và valid-stem invariance; mọi 894 expected presence đã tạo trước đó và identity/malformed records được so sánh giữ nguyên.
2. **SPEC_BUG — validator sentinel**: sentinel ban đầu giả định 2027-12-31 absent. Đã sửa sentinel theo phép tính ngày/predicate nguồn; expected đã suy độc lập giữ nguyên, không sửa để khớp evaluator.

Reviewer **Codex (single agent)**, `independentSecondReview: false`. Raw slices đã đọc cho derivation; re-inspect trực tiếp 天恩 PDF38 và 鳴吠 corrected 立成 PDF137 trong bước này. Scan còn lại tái dùng review 2.2–2.12, không tự nhận reread hoặc review chuyên gia lần hai.

Full domains **720/rule** cho 7 monthly rules, **60/rule** cho 3 day rules và miền bổ sung soil thuộc **3.3**. ANY/heading/protection/override/warehouse expected thuộc **3.4**; review **3.5** và commit/source/Golden freeze **3.6** còn mở. Parent 3.0/P4-C chưa nghiệm thu; S1 canonical OPEN, P5 修倉庫 deferred, 母倉 vẫn OWNER_ADOPTED_SOURCE_DEPENDENT. Không thay production/manifest/scoring.
