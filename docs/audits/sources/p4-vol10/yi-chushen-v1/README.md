# P4-C 2.8 — 除神 authority v1

2026-10-14. **SOURCE_REVIEWED**, AUDIT_ONLY, scoringReady false. Identity `tru_than` khớp catalog sau review nguồn độc lập, không suy authority từ label. Single reviewer Codex; không có review độc lập thứ hai. Chưa Golden/implementation.

## Nguyên văn và scan

`entry.json` có 8 raw refs với Unicode code-point offset/length và UTF-8 SHA-1; 9 scan pages có excerpt riêng. `lock.json` khóa entry/README/renders, raw/PDF và artifacts đối chiếu; không refresh nguồn hoặc lock cũ.

- 卷五 SHA-1 `1d4000974e3222122e8919fa01102dc3cda352a2`, scan 06067683.cn PDF 113, 116–117. Trang 113 day chart 重日/五合/五離/除神. Trang 117: 「考原曰按通書以申酉日為除神與五合對衝之日也宜沐浴祓除災眚」「按日神不從年月天干起義者唯此三條故并為一圖」. Raw 災眚 và scan 災害 giữ riêng; wording mục đích không đổi predicate. Trang 116–117 dẫn 五離 忌 riêng; fixed 申酉 không phải monthly 除日.
- 卷十 SHA-1 `355dc6c8fe2d815c2fdec51b25228836cfea6025`, scan 06067686.cn PDF 126: 「除神」「宜解除沐浴整容剃頭整手足甲求醫療病掃舍宇」「義同除日」. Usage giống 除日, không phải presence equality.
- 卷十一 SHA-1 `ce4ed7f23ff94a74cd0e1c4f89ae4d22e6df8f50`, scan 06067687.cn PDF 31–34 và 46. 解除、沐浴、整容剃頭、整手足甲、求醫療病、掃舍宇 có named 除神 trong 宜. 除日/除神 là hai token riêng; source refs giữ cả raw 忌, presence không tự gỡ kỵ.

PDF page 1-based đã đọc trực tiếp. Không đoán folio/index Archive chưa ghi. Derived PNG không thay PDF bytes; scan excerpt không dùng thay offset raw.

## Predicate, input, coverage và alias

**DAY_BRANCH ∈ {申, 酉}**, 子=0…亥=11 → [8,9]. Input chi từ valid day pillar. Không Month Jian, tháng/ngày âm, can ngày, phase, soil hoặc birthYear. Miền riêng 60 pillar, 10 present/50 absent; có thể sweep 12×60 để kiểm month independence, không ép Month Jian thành required input. Coverage lịch kế thừa validated day-pillar provider; missing/outside coverage → unknown, malformed → error là contract audit.

Không thấy presence exception cho 申/酉. 五離 cùng vị trí nhưng named 忌 khác scope, không mang negative marriage/friends/contracts sang 除神 宜/scoring. Không nhận aliases 五離、除日、解神. Trừ Thần là catalog label; `tru_than` là stable ID, không tự thêm token alias Việt.

除日 dùng `(dayBranch - MonthJian + 12) % 12 == 1`; 除神 fixed 申酉. Ví dụ suy tay: 寅建申日 除神 present/除日 absent; 寅建卯日 除日 present/除神 absent. Chưa Golden. 「義同除日」 không thay day-rule bằng monthly officer hoặc mở mọi heading 除日 sang 除神.

## Đối chiếu và heading

`good-gods.json`: `tru_than`, han 除神, label Trừ Thần, rule.dayChi [8,9], activities medical/cleaning/cut_hair. `godMapping.ts` resolveDayRuleGods/resolveDayRuleGodPresence đọc chi rule này: khớp predicate đã review. Không gọi output resolver để làm Golden. `xieji-god-definitions.json` chưa có entry 除神 riêng; inventory task 1 ghi đúng catalog ID/authority gap. Không đổi catalog/runtime.

Ba direct catalog heading: **掃舍宇 → cleaning**, **整容剃頭 → cut_hair**, **求醫療病 → medical**, khớp `xiejibianfangshu-yiji.json` và inventory. Ba source heading ngoài 29-heading catalog: 解除、沐浴、整手足甲, giữ scope riêng, không tự map sang cleaning/cut_hair hoặc mở catalog.

Task 2.8 xong, **7/11 authority**; parent 2.0/P4-C vẫn mở, next 2.9 驛馬. Giữ P5/S1, Golden, evaluator/runtime/manifest/scoring hiện hành.
