# PRD — P4-B follow-up: 鋪註 puzhu:06 (德合赦願月恩四相時德等日不註忌…)

Ngày: 2026-10-16.
Trạng thái: PRD đã viết; owner đã chốt Q1–Q4 (§8). Chưa có Golden, chưa có code.
Quyết định owner (2026-10-16): xử lý puzhu:06 là việc P4-B audit-only riêng, không nằm trong P5. Đóng băng Golden trước, owner quyết cách đọc 「如常例」.
Quyết định owner (2026-10-16): **Q1 không, Q2 không, Q3 không, Q4 có.** puzhu:06 chỉ gỡ 忌 của remaining-ji có danh sách gỡ riêng (九空, 五虛, 小耗, 五離, 五墓): **77 dòng** trên 2025–2027 (立券交易 28, 開倉庫出貨財 17, 開市 16, 納財 13, 安牀 3). 如常例 có grade 從忌不從宜, 「與德併如常例」 và 月破 không có 德 đều giữ 忌. Status `OWNER_ADOPTED`, không phải canonical.

## 1. Introduction / Overview

Trong P5 task 5.2 (finding **F1**, [báo cáo P5](../docs/audits/p5-warehouse.md) §5.2 trên nhánh `codex/p5-warehouse`, PR #60) phát hiện 鋪註 `puzhu:06` chưa được mô hình ở bất kỳ đâu trong P4:

> 凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌

(`shared/almanac-data/p4-vol10-authority.json` → `puzhu:06`, raw `docs/audits/sources/p4-vol10/vol10.raw.txt` offset 21817.)

Nghĩa: ngày có 德合赦願 / 月恩 / 四相 / 時德 thì không ghi 忌 cho tám việc kia, trừ khi gặp 「遇德猶忌」 hoặc 「從忌不從宜之日」 thì vẫn ghi 忌.

Việc này mô hình puzhu:06 bằng một lớp composer opt-in mới bọc ngày P4-C. Thứ tự: đóng băng Golden độc lập trước code, rồi viết test đỏ, implementation, sweep, mutation gate, nghiệm thu. Đây là việc audit-only, độc lập với roadmap: không đổi runtime production, điểm, manifest hay flag.

## 2. Baseline đã đo (pre-PRD, chưa phải Golden)

**Đầu vào:**
- Trạng thái heading lấy từ `resolveP4YiDay` trên `origin/main` `1c4bb32` (tree `4b32d9ab0338`).
- Presence của 天德, 月德, 天德合, 月德合, 天赦, 天願, 月恩, 四相 và 時德 lấy từ P5 Golden `docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/dated.tsv` ở `472220b` (nhánh P5, chưa merge).
- P5 chỉ đổi 修倉庫. Năm heading dưới đây và mọi field cấp ngày khác deep-equal P4-C (P5 task 4.4), nên kết quả trên main và trên P5 trùng nhau. 修倉庫 không nằm trong danh sách puzhu:06.

**Ứng viên** là dòng (ngày × heading) có `ji && !protectedJi` ở trạng thái cuối, rơi vào một ngày puzhu:06 (có ít nhất một thần trong chín thần trên). 2025–2027 có 532/1.095 ngày puzhu:06. Ứng viên rơi vào 183 ngày, tổng **724 dòng**, khớp đúng số của P5 F1:

| Heading | Ứng viên |
|---|---|
| 開倉庫出貨財 | 133 |
| 開市 | 153 |
| 立券交易 | 159 |
| 納財 | 139 |
| 安牀 | 140 |

進人口, 經絡 và 醞釀 không thuộc 29 heading P4. Chúng nằm ngoài phạm vi đo; authority ghi rõ là `OUT_OF_HEADING_SCOPE`.

**Cách phân loại.** Mỗi nguồn 忌 trên dòng được đối chiếu với entry 卷十 của thần 凶 sinh ra nó. Nguồn đọc từ `resolveP4Headings` (clauseEffect của entry), `resolveP4Grades` (等第), `getP4YouweiScopes` (又為), `remaining.scopes` (remaining-ji v7) và `puzhuEnd`. Dòng chỉ được gỡ khi **mọi** nguồn của nó gỡ được; nguồn chặt nhất quyết định.

Loại nguồn:

| Mã | Ý nghĩa | Nguồn văn bản |
|---|---|---|
| 猶忌 | entry ghi 「與德…併猶忌」, có 德 (vd. 月破 「與天德月德天德合月德合併…猶忌」) | 遇德猶忌, ngoại lệ puzhu:06 |
| 諸事皆忌 | clause hoặc grade `avoid_all` (vd. 月煞 「不與德合併諸事皆忌」) | mạnh hơn 從忌不從宜, ngoại lệ |
| puzhu27 | 「凡天吏大時不以死敗論者遇四廢嵗薄逐陣仍以死敗論」 (offset 22604) khôi phục 忌 | 鋪註 riêng, giữ |
| AN | 「不與德…併如常例」, grade 等第 = `only_ji` (中/次 「不遇從忌不從宜」) | **Q1** |
| AD | 「與德…併如常例」, có 德, grade 下 「遇德從忌不從宜」 | **Q1** và **Q2** |
| AU | 如常例 không có cột 等第 (月破 khi không có 德, clause mặc định) | **Q3** (如常例 thuần) |
| QL | remaining-ji có danh sách gỡ riêng 「與…併則不忌」 không gồm 月恩/四相/時德… (九空, 五虛, 小耗, 五離, 五墓) | **Q4** |
| 又為 / defer | 又為大耗, 又為月虛 theo entry cha (月破, 月煞); 九空 「從月破論 / 從月厭論」 theo entry đích | theo lớp của cha hoặc đích |

Kết quả phân loại 724 dòng:

| Nhóm | Dòng | 開倉庫 | 開市 | 立券 | 納財 | 安牀 |
|---|---|---|---|---|---|---|
| **Giữ 忌, ngoại lệ có nguồn** | **254** | 45 | 53 | 53 | 53 | 50 |
| — 猶忌 (trực tiếp, qua 又為大耗, hoặc qua 九空 從月破論) | 132 | 27 | 27 | 27 | 27 | 24 |
| — 諸事皆忌 (trực tiếp hoặc qua cha/đích) | 112 | 16 | 24 | 24 | 24 | 24 |
| — puzhu:27 死敗論 (2026-06-01, 2027-05-27 巳丙午) | 10 | 2 | 2 | 2 | 2 | 2 |
| **Tùy owner** | **459** | 81 | 99 | 105 | 85 | 89 |
| — chỉ AN (Q1) | 237 | 37 | 53 | 43 | 42 | 62 |
| — AD (Q1 + Q2) | 75 | 7 | 17 | 17 | 17 | 17 |
| — chỉ AU (Q3) | 35 | 7 | 7 | 7 | 7 | 7 |
| — chỉ QL (Q4) | 77 | 17 | 16 | 28 | 13 | 3 |
| — AN + QL (Q1 + Q4) | 35 | 13 | 6 | 10 | 6 | 0 |
| **Undetermined, giữ nguyên** | **11** | 7 | 1 | 1 | 1 | 1 |
| — scope 閉日/天吏 undetermined (2027-08-07 未戊午) | 5 | 1 | 1 | 1 | 1 | 1 |
| — 月煞 卯/酉 scope mở, chỉ 又為月虛 (P5 F3) | 6 | 6 | 0 | 0 | 0 | 0 |

Số dòng được gỡ theo từng tổ hợp câu trả lời (Q = có nghĩa là cách đọc đó cho gỡ):

| Owner trả lời "có" | Dòng gỡ |
|---|---|
| không câu nào (puzhu:06 không chạm entry nào) | 0 |
| chỉ Q4 | 77 |
| chỉ Q3 | 35 |
| Q3 + Q4 | 112 |
| chỉ Q1 | 237 |
| Q1 + Q2 | 312 |
| Q1 + Q3 | 272 |
| Q1 + Q4 | 349 |
| Q1 + Q2 + Q3 | 347 |
| Q1 + Q3 + Q4 | 384 |
| Q1 + Q2 + Q4 | 424 |
| Q1 + Q2 + Q3 + Q4 (đọc rộng nhất) | 459 |

Q2 chỉ có tác dụng khi Q1 là "có"; các tổ hợp Q2 không kèm Q1 cho cùng kết quả với tổ hợp bỏ Q2. Bảng trên phủ đủ 16 tổ hợp. Probe pre-PRD không commit; task 1.0 tạo lại TSV 724 dòng trong repo bằng generator có verify bytes.

**Phát hiện cấu trúc.** Theo `p4-vol10-grade-resolution-v2.json → actionEffect`, grade `only_ji` ứng với clause `as_usual` hoặc `still_avoid`. Vậy mọi thần 凶 có cột 等第 mà clause là 如常例 thì grade của ngày đó **là** 「從忌不從宜」:

- 中 (offset 9720): 「吉不抵凶遇德則吉勝從宜不從忌不遇從忌不從宜」
- 次 (offset 9743): 「凶勝於吉遇德始相抵從宜亦從忌不遇從忌不從宜」
- 下 (offset 9766): 「凶又逢凶遇德從忌不從宜不遇諸事皆忌」

Nếu 「從忌不從宜之日」 của puzhu:06 được hiểu theo bảng 等第, thì puzhu:06 không gỡ dòng AN/AD nào. Khi đó nó chỉ còn tác dụng trên AU và QL (tối đa 112 dòng).

## 3. Goals

1. Khóa authority puzhu:06: nguyên văn, offset, checksum, scan; tám heading (ba ngoài phạm vi); chín thần kích hoạt; hai ngoại lệ; cách đọc owner chọn cho Q1–Q4 với status `OWNER_ADOPTED`.
2. Đóng băng Golden độc lập trước implementation: Python reference không import resolver hay composer, phủ 720 context (Month Jian × pillar) và 1.095 ngày.
3. Ghép puzhu:06 vào audit ngày qua một composer version opt-in mới. P4-C, P5 và output cũ giữ nguyên bytes.
4. Mọi dòng trong 724 ứng viên được giải thành gỡ / giữ / undetermined, kèm lý do có trích nguồn. 0 thay đổi ngoài năm heading.
5. Runtime production, scoring, manifest và flag giữ nguyên.

## 4. Functional Requirements

### 4.1. Authority

**FR-01.** Authority mới (đề xuất `p4b-puzhu06-v1`) ghi: nguyên văn puzhu:06, SHA-1 raw, offset code point, locator scan 卷十 (`06067686.cn`); danh sách heading `[進人口, 安牀, 經絡, 醞釀, 開市, 立券交易, 納財, 開倉庫出貨財]`, trong đó 進人口/經絡/醞釀 là `OUT_OF_HEADING_SCOPE`; chín thần kích hoạt `[天德, 月德, 天德合, 月德合, 天赦, 天願, 月恩, 四相, 時德]` (「德合赦願」 = 二德 + 二合 + 天赦 + 天願; 「等日」 không mở rộng thêm). Ghi status, ngày quyết định và cách đọc owner chọn cho Q1–Q4.

**FR-02.** Ngoại lệ 「如遇德猶忌」: nguồn 忌 có clause `still_avoid` (entry ghi 猶忌 khi có 德), kể cả qua 又為 cha hoặc defer đích → giữ 忌. Nếu owner chọn "không" cho Q2, AD cũng thuộc ngoại lệ này.

**FR-03.** Ngoại lệ 「從忌不從宜之日」: `avoid_all` (諸事皆忌) luôn giữ. Grade `only_ji` có giữ hay không là **Q1**.

**FR-04.** Nguồn ngoài 等第:
- 又為大耗 theo lớp của 月破, 又為月虛 theo lớp của 月煞.
- 九空 `defer` theo lớp của entry đích (月破 ở 辰戌丑未, 月厭 ở 巳亥).
- remaining-ji `keep` có danh sách gỡ riêng (九空, 五虛, 小耗, 五離, 五墓) là **Q4**.
- 小耗 子午卯酉 + 刼煞 「雖與德合併猶忌」 là 猶忌. Nguồn này đã protected trong remaining-ji v7 nên không xuất hiện trong ứng viên.

**FR-05.** puzhu:06 không gỡ 忌 protected: 百忌日 專忌 (vd. 甲日 開倉庫), 止忌 `only_avoid`, 又為 專忌, lunar-day, phase và soil. Nó cũng không vượt `puzhu:27` (死敗論 khôi phục) hay pillar 諸事皆忌. `puzhu:28` 諸事不忌 vẫn thắng như cũ.

**FR-06.** Gỡ 忌 chỉ đổi `ji`/`state` của heading đó, không đổi 宜:
- only_ji → not_recorded
- both_present → only_yi
- undetermined giữ undetermined nếu còn nguồn mở

Propagation chạy lại sau lift theo thứ tự P4-C hiện hành (`applyP4Propagation`), có ghi trace. Đặc biệt `puzhu:22` 開市+立券交易 → 開倉庫出貨財 (`requireAll`) cần kiểm thứ tự: puzhu:06 lift trước propagation.

**FR-07.** Mỗi heading-ngày bị puzhu:06 chạm có trace gồm: thần kích hoạt có mặt, từng nguồn 忌 với lớp (猶忌 / 諸事皆忌 / AN / AD / AU / QL / 又為 / defer / puzhu27), quyết định Q áp dụng, và kết quả gỡ/giữ.

### 4.2. Golden, kiểm tra, báo cáo

**FR-08.** Golden (đề xuất `golden-p4b-puzhu06-v1`) đóng băng bằng commit và checksum **trước** test đỏ và code. Expected suy từ nguồn qua Python độc lập; đầu vào là các lock P4-B/P4-C đã khóa (clause, grade, remaining-ji, presence), không phải output của composer đang kiểm. Giữ nguyên bytes của mọi lock P4-B/P4-C/P5 cũ.

**FR-09.** Coverage tối thiểu: mỗi thần kích hoạt riêng lẻ; mỗi lớp nguồn (猶忌, 諸事皆忌, AN, AD, AU, QL, 又為, defer, puzhu27); dòng nhiều nguồn mà nguồn chặt nhất thắng; 忌 protected; heading ngoài puzhu:06 không bị chạm; puzhu:28; tương tác `puzhu:22`. Toàn miền 720 context cho phần chỉ phụ thuộc Month Jian × pillar; 1.095 ngày cho phần theo ngày (月恩, 四相, 時德, lunar-day, phase, soil).

**FR-10.** Sweep 1.095 ngày × 29 heading trước/sau → TSV và summary. Phải có: 724 ứng viên phân rã khớp Golden; 0 thay đổi ở 24 heading còn lại; 0 thay đổi trên 忌 protected; số `undetermined` ngoài phạm vi giữ nguyên.

**FR-11.** Mutation tuần tự, bắt bằng assertion, phục hồi bytes. Tối thiểu:
- bỏ ngoại lệ 猶忌;
- coi 從忌不從宜 chỉ là `avoid_all` (đảo Q1);
- đảo Q2, Q3, Q4;
- bỏ 月恩/四相/時德 khỏi thần kích hoạt;
- thêm 三合 hoặc 六合 vào thần kích hoạt;
- áp puzhu:06 lên 忌 protected;
- áp lên heading ngoài danh sách (vd. 修倉庫);
- bỏ defer/又為 (dùng lớp riêng thay lớp cha);
- puzhu:06 sau propagation thay vì trước.

Runner đặt tên `scripts/audit-p4-puzhu06-mutations.py` để vào path-gate CI P4 sẵn có.

**FR-12.** Trước nghiệm thu chạy: unit và gate, regression A04b/P4-B/P4-C (và P5 nếu đã merge), build, typecheck main/functions, lint, CI. Kiểm runtime/manifest không đổi bằng cách so bundle với build local cùng SHA (thay `builtAt`). Chạy `graphify update .` sau khi sửa code.

**FR-13.** Cập nhật báo cáo `docs/audits/p4b-puzhu06.md`, task list, `docs/audits/p4-vol10-progress.md` và PROJECT_CONTEXT.md (dòng F1 "Việc độc lập", nếu PR #60 đã merge).

## 5. Non-Goals

- Score adapter, penalty, flag `xiejiVol10BalancingEnabled`, activation, UI (roadmap 8–10).
- 進人口, 經絡, 醞釀: chỉ ghi `OUT_OF_HEADING_SCOPE`, không thêm heading.
- Sửa P5 F3 (月煞 卯/酉 scope mở) hoặc scope undetermined khác.
- Chọn canonical cho tranh chấp ngoài puzhu:06 (月恩/月德 của P5, S1 soil).
- Merge hay deploy tự động; luôn hỏi owner.

## 6. Technical Considerations

- Bọc `resolveP4YiDay` (`shared/lunar/p4YiDayComposition.ts`) bằng lớp mới, ví dụ `resolveP4Puzhu06Day` trong `shared/lunar/p4Puzhu06.ts`, giống cách P5 bọc ngày P4-C. Không sửa bytes `p4-vol10-day-composition-v2.json`, remaining-ji v7 hay P4-C. Output version mới `p4b-puzhu06-day-v1`.
- Nguồn 忌 từng heading lấy từ `resolveP4Headings` (`p4HeadingAnnotation.ts`), `resolveP4Grades` (`p4GradeResolution.ts`), `getP4YouweiScopes`, `resolveP4RemainingJi` (`p4RemainingJi.ts`) và `puzhuEnd` trong `assembleP4YiFullDayWithRaw` (`p4YiFullDayCore.ts`).
- Presence chín thần: 二德/二合 qua `presentP4De`; 天赦, 天願, 月恩, 四相, 時德 qua operand P4-C (`p4YiOperands.ts`, `getVol10VirtuesPresent`). Golden phải tự suy độc lập.
- Nếu PR #60 (P5) merge trước, rebase và bọc ngày P5 thay vì P4-C. 修倉庫 không thuộc puzhu:06 nên hai lớp độc lập; kiểm deep-equal 修倉庫.
- Chạy `graft callers` trước khi đổi symbol. Module audit-only không được runtime import.

Thứ tự: authority (sau khi owner trả lời) → Golden freeze → test đỏ → implementation → sweep, mutation, regression, CI → nghiệm thu.

## 7. Acceptance Gate

Việc này hoàn tất khi **tất cả** đúng:

1. Owner đã trả lời Q1–Q4. Authority `p4b-puzhu06-v1` khóa nguyên văn, offset, checksum, scan và các cách đọc đã chọn.
2. Golden độc lập đóng băng trước test đỏ và code (có commit-proof). Lock P4-B/P4-C/P5 cũ giữ bytes.
3. 724 ứng viên được giải với lý do khớp Golden. Mọi dòng giữ 忌 có trích nguồn ngoại lệ. Dòng undetermined được liệt kê riêng.
4. 0 thay đổi ngoài năm heading, 0 thay đổi trên 忌 protected, 0 regression P4-B/P4-C/P5.
5. Mọi mutation bị bắt, CI xanh.
6. Runtime, manifest và scoring giữ nguyên.
7. Báo cáo, progress và PROJECT_CONTEXT.md đã cập nhật.

## 8. Owner decision và câu hỏi đã hỏi

**Quyết định owner (2026-10-16): Q1 không, Q2 không, Q3 không, Q4 có.** Kết quả trên 2025–2027: gỡ 77 dòng, giữ 636, undetermined 11. Lý do đã trình cho owner:

- **Q1 không:** cùng một sách, cụm 「從忌不從宜」 của puzhu:06 được hiểu như trong bảng 等第. 月恩/四相/時德 không phải 德 của 等第, nên ngày chỉ có các thần đó là 「不遇」.
- **Q2 không:** 「與德併如常例」 nghĩa là có 德 mà không giúp được, thực chất là 遇德猶忌.
- **Q3 không:** 月破 có 德 còn 猶忌, nên không có 德 mà chỉ có 月恩/四相 càng không gỡ được.
- **Q4 có:** danh sách heading của puzhu:06 gần trùng danh sách 忌 của 九空/大耗/小耗. Nếu cả bốn câu đều "không", puzhu:06 không bao giờ có tác dụng.
- **諸事皆忌** giữ (owner không bác ghi chú dưới đây).

Rủi ro đã nêu: Q4 là chỗ yếu nhất. Nếu bám chữ vào danh sách gỡ riêng của từng entry thì sẽ đọc "không", và puzhu:06 thành vô hiệu.

**Q4a (mở, chặn task 4.2 — phát hiện khi review Golden 3.0).** Lời bàn entry 五墓 kết thúc bằng 「…與月德併則為三合旺氣發於天干而不可以墓論矣故不忌也不取德合者不同行也」 (卷十, offset 18263 của 「不取德合者不同行也」): entry nói rõ 德合 không gỡ 五墓 vì khác hành. Golden v1 (theo Q4 = có) đang gỡ **9 dòng 五墓** chỉ nhờ 天德合: 巳丙戌 2025-05-17, 2026-05-12, 2027-05-07 × 開市, 立券交易, 安牀. Ngày tháng 巳, nên điều kiện gỡ riêng của 五墓 (月德, tháng 午/子) không áp dụng. Bốn thần Q4 còn lại (九空, 五虛, 小耗, 五離) không có câu loại trừ tương tự; 「天赦不得與五虛併」 là ghi chú về đồng hiện, không phải loại trừ.

Câu hỏi: 「不取德合」 của 五墓 có chặn trigger 德合 của puzhu:06 không?
- **Chặn:** 9 dòng đó chuyển sang keep; còn gỡ 68 dòng.
- **Không chặn:** giữ 77 dòng như Golden v1.

Nếu owner chọn "chặn", authority và Golden phải tạo version mới và đóng băng lại trước test đỏ. Việc này hợp lệ vì chưa có code puzhu:06.

Câu hỏi đã hỏi owner (giữ nguyên để truy vết):

Mọi câu hỏi viết theo cùng một chiều: **"có" = puzhu:06 gỡ 忌**, "không" = giữ 忌. Bảng §2 dùng đúng quy ước này.

**Q1 (chính). Khi entry 凶 ghi 「如常例」 và grade 等第 của ngày là 「從忌不從宜」, puzhu:06 có gỡ 忌 không?**

- **Có (đọc A):** 如常例 chỉ đọc theo entry. puzhu:06 là một phần của 「常例」 nên được áp; grade 等第 không phải 「從忌不從宜之日」 của puzhu:06. Kết quả: gỡ dòng AN (237), gỡ thêm AD nếu Q2 cũng là "có".
- **Không (đọc B):** grade 等第 `only_ji` chính là 「從忌不從宜」, nên ngày đó là ngoại lệ của puzhu:06 và vẫn ghi 忌. Kết quả: AN và AD giữ 忌; puzhu:06 chỉ còn tác dụng trên AU và QL.

**Q2. Khi entry ghi 「與德…併如常例」 (có 德 mà vẫn như thường), puzhu:06 có gỡ 忌 không,** tức là không coi câu đó là 「遇德猶忌」? Câu này chỉ có tác dụng khi Q1 = có.

**Q3. Với 如常例 không có cột 等第 (月破 khi không có 德), puzhu:06 có gỡ 忌 không?**

**Q4. Với remaining-ji có danh sách gỡ riêng 「與…併則不忌」 không gồm thần puzhu:06 (九空, 五虛, 小耗, 五離, 五墓), puzhu:06 có gỡ 忌 không** (tức là mở rộng danh sách đó)? Lưu ý: các heading thương mại của puzhu:06 (進人口 開市 立劵交易 納財 開倉庫出貨財) gần trùng hẳn danh sách 忌 của 九空 「忌進人口修倉庫開市立劵交易納財開倉庫出貨財」, 又為大耗 「忌修倉庫開市立劵交易納財開倉庫出貨財」 và 小耗. Điều này có thể nghiêng về việc puzhu:06 nhắm vào nhóm thần này.

**Ghi chú cho owner (không phải câu hỏi riêng, có thể bác):** 112 dòng 諸事皆忌 được giữ dưới mọi cách đọc. Đây là suy luận của audit: puzhu:06 chỉ nêu 遇德猶忌 và 從忌不從宜, còn 諸事皆忌 được coi là mạnh hơn 從忌不從宜 (下 「不遇諸事皆忌」 xếp dưới 「遇德從忌不從宜」). Nếu owner bác, 112 dòng này chuyển thành câu hỏi riêng.

Ví dụ:

1. **2025-01-22 丑辛卯**, có 月恩. Nguồn 忌 duy nhất là 災煞 丑月: 「辰戌丑未月不與德神併如常例」 (offset 12003). Grade 中 không có 德 là 「不遇從忌不從宜」 (offset 9720). Lớp AN, ảnh hưởng 5 heading. Q1 có: gỡ (only_ji → not_recorded). Q1 không: giữ.
2. **2025-01-11 丑庚辰**, có 天德 và 月德. Nguồn 忌 là 月煞 丑月平日: 「辰戌丑未月值平日與天德月德天德合月德合併如常例」 (offset 12318), cộng 平日 從月煞論. Grade 下 có 德 là 「遇德從忌不從宜」 (offset 9766). 開倉庫 còn có thêm 又為月虛 「忌修倉庫開倉庫出貨財」. Lớp AD. Q1 không: giữ. Q1 có + Q2 có: gỡ 5 heading. Q1 có + Q2 không (coi là 猶忌): giữ.
3. **2025-01-26 丑乙未**, có 天德合, 月德合 và 四相. Nguồn 忌 là 月破 「與天德月德天德合月德合併…猶忌」, cùng 又為大耗 và 九空 從月破論. Đây là 遇德猶忌, nên giữ dưới mọi cách đọc.
4. (Q3) **2025-04-11 辰庚戌**, có 月恩. Nguồn 忌 là 月破 không có 德 (như thường), cùng 又為大耗 và 九空 從月破論. Không có 等第, gỡ chỉ khi Q3 = có.
5. (Q4) **2025-01-15 丑甲申** 立券交易, có 四相. Nguồn 忌 là 五離 「與天德月德天德合月德合天赦三合六合併則不忌」. Danh sách này không có 四相; gỡ chỉ khi Q4 = có. Trạng thái hiện tại both_present, sau gỡ thành only_yi.

Số dòng gỡ theo từng tổ hợp ở §2.

Câu hỏi phụ (không chặn): reviewer chỉ là single agent; ghi giới hạn, không nhận là review độc lập thứ hai.
