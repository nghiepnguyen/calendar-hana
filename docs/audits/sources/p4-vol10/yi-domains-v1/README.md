# P4-C 3.3 — Full domains cho 11 predicate 宜

2026-10-14. **Task 3.3 hoàn tất — DOMAIN_EXPECTED_COMPLETE_PENDING_3_4_TO_3_6**. [expected.tsv](expected.tsv) có **7.863 record độc lập**, mỗi record chứa input, provenance, expected, authority/rule/status và derivation/sourceRefs. [summary.json](summary.json) ghi riêng từng domain; chưa Golden commit freeze và chưa provider implementation.

## Domains đã chốt

| Predicate                                | Domain                                                                        | Present / absent                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 福德、天巫、天后、天醫、驛馬、天馬、吉期 | Mỗi rule đủ **12 Month Jian × 60 valid pillars = 720**; tổng 5.040            | **60 / 660** mỗi rule                                      |
| 天恩                                     | **60** valid pillars, không required Month Jian                               | **15 / 45**                                                |
| 除神                                     | **60** valid pillars, không required Month Jian; five valid stems cho mỗi chi | **10 / 50**                                                |
| 鳴吠                                     | **60** valid pillars, corrected 立成, không required Month Jian               | **13 / 47**                                                |
| 母倉 — conditional predicate             | **12 × 60 × 2 abstract soil states = 1.440**                                  | **270 / 1.170**; soil absent 150/570, soil present 120/600 |
| 母倉 — dated provider input              | Đủ **1.095 ngày dân sự 2025–2027**, local noon UTC+7                          | Xem summary, đếm từ source arithmetic theo ngày thật       |
| 母倉 — exact Jie                         | **36 crossing × trước/đúng/sau 1 ms = 108** cho cả ba năm                     | Xem summary; không suy từ dated-noon count                 |

**7.863 = 5.040 + 180 + 1.440 + 1.095 + 108.** Không gộp ba miền 母倉 thành một số chứng minh coverage; từng miền có contract và kiểm tra riêng. Domain day-only dùng cả 60 valid pillars để chứng minh stem/branch parity, nhưng 除神 chỉ truyền required chi.

## Tính độc lập và kiểm exact sets

[domains.py](domains.py) chỉ dùng standard library và **một đường dẫn cố định/hash-bound** đến Python reference độc lập của 3.2. Tái dùng literal raw/scan và phép tính nguồn đã ghi trong source-basis; không đọc production predicate/tables hoặc gọi resolver/scorer/provider sẽ được kiểm. Không sửa source, reference hoặc expected 3.2 để mở domain. [inputs.json](inputs.json) bind reference/basis/prior expected/authority/matrix bằng SHA-256.

Mỗi tuple structural là can chi hợp lệ, có 5 pillar cho mỗi chi. Validator kiểm **exact Cartesian-set equality**, uniqueness và pillar parity, thay vì chỉ khớp 720/60. So expected bằng phép tính độc lập dạng cyclic offset/source chart/range/corrected set, đối chiếu known tuple của 3.2. SourceRefs/rule IDs/status giữ đúng entry riêng, không gộp 福德/天巫 hoặc 天后/驛馬 dù cùng vị trí.

Unknown, malformed, provider coverage và alias đã có fixture riêng trong 3.2, giữ bytes/lock nguyên trạng. Structural domains ở đây giả định input hợp lệ/coverage provider inside, không tự gán dated cutoff cho 10 rule không có cutoff riêng. Không biến missing thành absent chỉ để full domain có hai trạng thái.

## 母倉: conditional và dated scope

Miền 1.440 là **bảng chân trị predicate có điều kiện**, với `abstractSoilState`, `inputProvenance.kind = PREDICATE_ONLY`, `providerValidated = false`. Không có date hoặc SOIL_REIGN_STATE provenance giả. Không được đưa trực tiếp bảng này qua full provider, không chứng nhận mọi combination có ngày thật trong 2025–2027. Source ordinary sets/soil replacement cho phép xét đủ nhánh predicate; một soil state không làm nới coverage authority.

Miền dated dùng ngày thật riêng: tự tính Gregorian JDN/can chi và exact-Jie Month Jian từ frozen independent JPL inputs; soil lấy UTC+7 civil-date window **[Li−18 ngày, Li)**. Validator kiểm lại can chi từ chênh ngày anchor, crossing cuối cùng ≤ instant và next Li civil date > ngày được xét; đối chiếu conditional truth table chỉ sau khi provenance hợp lệ. Ngày 四立 soil đã absent cả ngày nhưng Month Jian/mùa chuyển tại exact instant.

Đủ mỗi ngày **2025-01-01…2027-12-31** ở local noon, cộng biên của **mọi 36 Jie** trong coverage. Noon không được gọi là quét mọi instant; day pillar/soil cố định trong ngày, Month Jian có thể đổi ở crossing nên có exact-Jie triples riêng. Source inputs 3.2 đã đối chiếu 100 calendar records và 12 HKO Li dates; đây là tái dùng astronomy authority đã nghiệm thu, không audit thiên văn mới.

`muCangPriorFixtureRefs` trong summary trỏ ca 3.2 còn cần: 72 soil onset/Li civil edges, missing/unknown/unvalidated soil, cutoff endpoints và seasonal instant edges. Không đổi các fixture đó thành expected domain mới. **OWNER_ADOPTED_SOURCE_DEPENDENT** giữ nguyên; S1 canonical OPEN và 修倉庫/P5 vẫn deferred.

## Validation và tiến độ

[validation.json](validation.json) lưu exact-set/source/provenance verifier và commands. Replay TSV byte-for-byte/summary semantic qua; `--write` chỉ exclusive creation, từ chối ghi đè. AST isolation/compile, lint/main+functions typecheck, JSON/README format và diff check qua; `graphify update .` cập nhật AST cho script audit mới.

[prior-hashes.json](prior-hashes.json) bảo toàn **652 file** có từ trước task 3.3, gồm toàn bộ evidence/lock 3.2. [lock.json](lock.json) khóa domain/script/report/verifier cùng input/prior locks. Đây là domain integrity checkpoint, **không thay commit freeze task 3.6**. Không có source/Golden correction trong bước này.

Reviewer **Codex (single agent)**, không independent second review. Phép tính expected độc lập với implementation không đồng nghĩa review chuyên gia lần hai. **Next 3.4**: expected ANY/unknown trace/heading/normalization/protection/override/P5. Review 3.5 và commit freeze 3.6/parent 3.0/P4-C vẫn mở; chưa runtime/scoring change hoặc activation.
