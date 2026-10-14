# P4-C 3.4 — Expected phép ghép 宜 và các gate bảo toàn

2026-10-14. **Task 3.4 hoàn tất — COMPOSITION_EXPECTED_LOCKED_PENDING_3_5_3_6**. [expected.json](expected.json) khóa **1.850 fixture** bằng [integrity lock](lock.json), chưa commit freeze 3.6. Không import/call composer/resolver/scorer production hoặc triển khai provider P4-C.

## Expected đã chốt

| Nhóm                           | Số ca | Contract                                                                                                                                                        |
| ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ANY                            | 40    | Đủ mọi vector present/absent/unknown dài 0–3; có present → true, toàn absent/rỗng → false, không present/còn unknown → unknown                                  |
| Direct heading scope           | 957   | 11 thần × 29 heading × 3 state; chỉ listed direct operand được cấp 宜, unlisted present/unknown không cấp hoặc làm unknown heading; 修倉庫 luôn deferred        |
| Normalization                  | 15    | 立劵交易→立券交易, 破屋壞垣→破屋壊垣, 宴㑹→宴會, 修宫室→修宮室; 福徳→福德; idempotence, trace và identity không đổi                                             |
| Protection/override projection | 96    | 3 宜 states × 4 loại protection × cancel/suppress/override; raw 忌/protection retained, ordinary lift không xóa protected 忌, override cấp ngày không tự cấp 宜 |
| puzhu:28 mask                  | 720   | Đủ 12 Month Jian × 60 valid pillars; chỉ đúng 8 context áp, 未月甲午 áp/未月甲子 không áp; hiệu lực bao gồm protected 忌, raw trace không xóa                   |
| Warehouse deferred             | 18    | 母倉 × existing 四相 state × override; generic ANY dù true cũng không giải 修倉庫/P5, unknown trace và status source-dependent vẫn giữ                          |
| Source-context controls        | 4     | Presence suy riêng từ nguồn, raw 百忌/天狗 và 丁日 suppression giữ đúng phạm vi; chỉ xét scope đã nêu, không tuyên bố full day verdict                          |

**Unknown 宜 dùng JSON null**, known absent dùng false. `unresolvedTraceIds` luôn giữ mọi unknown đã được liệt kê trong input trace, kể cả khi một present khác đủ xác định ANY true. Trace của raw/protected 忌 vẫn hiện diện sau `puzhu:28`, chỉ effective 忌 bị gỡ. Unknown không liên quan vì god không được liệt kê ở heading không được đưa vào eligible operands.

## Nguồn và phạm vi phép tính

[source-basis.json](source-basis.json) giữ reviewed heading scopes và nguyên văn/Unicode offset/SHA-1 của nguồn 卷十/十一. Có nguồn raw riêng cho 遇德猶忌, 相抵, propagation protection, 百忌/天狗, suppression và `puzhu:28`; owner correction 六月甲子→甲午 được giữ cùng locator/witness lock. Chỉ 四相 là existing-operand stub để kiểm co-presence warehouse; null authority/rule ID ghi rõ stub, không bịa authority mới hoặc khẳng định presence ngày thật.

[derive.py](derive.py) dùng Python standard library và reference arithmetic 3.2 hash-bound cho bốn source-context controls. Expected ANY là truth table từ **PRD FR-08/task 5.2**, warehouse từ **FR-11**; đây là contract audit, không nhận là quotation cổ văn. Scope heading/normalization/protection/override xuất phát từ source và adoption đã khóa, không dùng số đo baseline hoặc output composer làm oracle.

Các vector ANY/scope/protection/warehouse là **isolated unit contract**: operand states được khai báo để xét logic, không ghép các fixture khác ngày thành một ngày có thật. Four context controls là:

- **亥建癸未 / 天醫 / 求醫療病**: 天醫 present, 百忌 未日 忌求醫療病 giữ protected 忌.
- **子建己酉 / 天恩 / 宴會**: 天恩 present theo corrected set, 百忌 酉日 忌宴會 giữ protected 忌.
- **申建甲戌 / 天巫 / 祭祀**: 天巫 present, 天狗 đúng 申月戌 và ritual 忌 được bảo vệ.
- **寅建丁酉 / 除神 / 整容剃頭**: 除神 present, 丁日 忌剃頭; `puzhu:10` không ghi 宜整容, nên contribution ghi 宜 của heading ghép bị chặn.

Mỗi control chỉ cam kết presence và projection của scope nguồn đó. Không suy raw/effective toàn ngày từ bốn ca này; các scope khác, propagation actual changes và full heading integration Golden tiếp tục thuộc task 5.4/6.8.

Các ca protection là local projections của annotation/propagation, chưa full day verdict hoặc global grade. `puzhu:28` áp sau ordinary protection để gỡ mọi effective 忌, nhưng giữ evidence 宜 trước đó và không xóa unresolved trace. Các ca warehouse bảo toàn deferral bất kể maternal presence; không chọn 月恩/月德, không tự dùng conditional clause như direct ANY.

## Verification, corrections và bước tiếp theo

[validation.json](validation.json) lưu replay/exact-set/source/trace verifier. Kiểm đủ 40 vectors, 957 scope keys, 96 protection combinations, exact 8/720 override contexts và 18 warehouse vectors, per-fixture derivation/trace và source hashes. `--write` chỉ exclusive creation; từ chối ghi đè expected đã có. AST kiểm standard-library imports và đúng một fixed/hash-pinned source-reference call; Python compile, lint/main+functions typecheck, format/diff và graph update qua.

[prior-hashes.json](prior-hashes.json) bảo toàn **660 file cũ**, gồm authority và expected/locks 3.1–3.3. Không sửa bất kỳ Golden/source lock lịch sử nào. [lock.json](lock.json) là composition integrity checkpoint; không thay review 3.5 hoặc authority/Golden commit freeze 3.6.

Corrections trước integrity lock, ghi tại validation:

1. Validator ban đầu tìm literal 福德 trong raw heading list nên dừng ở 福徳. Đã sửa validator để nhận đúng accepted spelling equivalence; raw/expected giữ nguyên.
2. Warehouse fixture draft dùng 福德 làm generic second candidate, nhưng 福德 không nằm trong warehouse clause. Thay bằng **四相 existing operand stub có trong clause**, không bịa authority hoặc ngày thật. Expected warehouse vẫn unknown và raw/protection/override behavior không đổi; mọi section khác được so JSON giữ nguyên. Không sửa theo composer output.

Reviewer **Codex (single agent)**, `independentSecondReview: false`. Không tuyên bố review Golden 3.5 hoặc full P4-C nghiệm thu. **Next 3.5**: review tính độc lập, input/pillar và coverage, ghi giới hạn/corrections; 3.6 commit freeze còn mở. Parent 3.0/P4-C, S1 canonical và P5 warehouse vẫn mở/deferred; production/manifest/scoring chưa đổi.
