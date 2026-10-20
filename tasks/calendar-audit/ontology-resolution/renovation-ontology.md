# Renovation ontology — 修宮室 vs 修造 / 興造動土

2026-10-20 · nghiên cứu, không sửa production.

## B1. Activity hiện tại

| Thuộc tính | Giá trị |
|---|---|
| ID | `renovation` |
| Nhãn | "Sửa chữa" (`activities.json`, group construction) |
| Nhãn/thuật ngữ nguồn | 修宮室 (`xiejibianfangshu-yiji.json` activityEntries) |
| Mô tả | không có trường mô tả |
| Scope taxonomy | `renovation` (`activityTaxonomy.ts:26`) |
| Cụm cũ | "sửa chữa" → renovation (`mansion-patterns.json`, chỉ dùng khi không có content) |
| Resolver term 28 Tú | không có (không clause 1880 nào mang scope renovation) |
| Luật | Trực: 建/平/收/閉 −15, 破 −25, 開 +15; 宜神 三合 四相 時德 月恩; 忌神 11 thần (giống construction) — sourceRef 卷十一 修宮室 |
| Event | không event nào dùng |
| UI | danh sách activity hằng ngày, khuyến nghị theo ngày |
| Scoring | có, qua Trực/thần và P4 (卷十) theo heading 修宮室 |

## B2. Phạm vi nghĩa nguồn

| Claim | Tier | Nguồn |
|---|---|---|
| 宮室: 1. 「古時房屋的通稱」 (từ chung chỉ nhà cửa thời xưa; 《易·繫辭》, 《淮南子》 「築土構木，以為宮室」); 2. cung điện | 2 | Tier 2 — 教育部重編國語辭典修訂本「宮室」 (HTML SHA-1 aaf669127932) |
| 修造: 「修理建造」 (sửa và xây) | 2 | Tier 2 — 教育部重編國語辭典修訂本「修造」 (HTML SHA-1 73c44934a854) |
| 卷十一: 御用 có 營建宮室, 修宮室, 興造動土; 民用 có 修造動土 (không có 修宮室, 營建宮室); 通書 có 修造動土. Heading thân 興造動土 mang chú nhỏ 「修造同」 | 1 | Tier 1 — 欽定協紀辨方書 卷十一, Wikisource raw SHA-1 ce4ed7f23ff9 (chưa hiệu đính với scan 四庫) |
| 卷十 tách hai việc trong cùng một quy tắc: 「凡吉凶相抵不註忌修造動土豎柱上梁亦不註忌修宫室繕城郭築隄防修倉庫…」 (offset 22313) | 1 | Tier 1 — 欽定協紀辨方書 卷十, docs/audits/sources/p4-vol10/vol10.raw.txt (SHA-1 355dc6c8fe2d) |
| 卷十 dùng 修造 như một lớp việc chung: 「與修造吉神併尤宜興作」; 「義取諸收無修造義…若開日則雖宜修造」 | 1 | Tier 1 — 欽定協紀辨方書 卷十, docs/audits/sources/p4-vol10/vol10.raw.txt (SHA-1 355dc6c8fe2d) |

- **修宮室**: sửa nhà cửa (宮室 nghĩa 1 là nhà nói chung, không riêng cung điện); trong 卷十一 là một mục cụ thể cạnh 繕城郭 (sửa thành), 修倉庫 (sửa kho). Không có dấu hiệu nghi lễ riêng.
- **修造**: "sửa + xây", một lớp việc rộng của lịch dân dụng (卷十 nói 「修造吉神」, 「宜修造」).
- **興造動土**: heading ghép (khởi công xây + động thổ). Chú 「修造同」 nằm dưới heading theo đúng cách 卷十一 ghi các tên gộp (như 般移 「移徙同」, 宴會 「會親友同」): tên 修造動土 của 民用/通書 dùng chung 宜忌 với 興造動土. Nghĩa là **修造 tuân theo 宜忌 của 興造動土**, không có nghĩa 修造 = 修宮室.

## B3. Ba tầng

- **Nguồn**: 協紀 (bản 御用) có ba mục riêng: dựng nhà (營建宮室), sửa nhà (修宮室), khởi công/động thổ (興造動土). Bản 民用/通書 gộp tất cả vào 修造動土.
- **Domain app**: catalog có construction (營建宮室 + 興造動土), groundbreaking (興造動土), renovation (修宮室), beam_raising (豎柱上梁).
- **Người dùng Việt**: "Sửa chữa" thường hiểu là sửa nhà đang ở; "Xây dựng" là làm mới; "Động thổ" là khởi công đào đất; "Thượng lương" là gác đòn dông. Không bắt buộc ánh xạ 1:1 với tên nguồn.

## B4. Hợp đồng ngữ nghĩa đề xuất

- **Hẹp (đề xuất)**: renovation = sửa chữa/cải tạo nhà đang có, không gồm xây mới (construction) và không gồm khởi công đào đất (groundbreaking). Khớp 修宮室 theo nghĩa 宮室 = nhà cửa và cách 卷十 tách 修宮室 khỏi 修造動土.
- Trung bình (sửa + cải tạo kết cấu) không có heading riêng trong nguồn.
- Rộng (xây + sửa) trùng với construction.

**Chứng cứ ngược mạnh nhất:** danh sách 民用三十七事 không có 修宮室; với dân thường, mọi việc sửa/xây nhà nằm dưới 修造動土. App phục vụ dân thường, nên có thể lập luận "Sửa chữa" theo lịch dân dụng là 修造 (→ 興造動土).

## B5. Chồng lấn

- **construction ≡ groundbreaking khi tắt P4**: 0/1098 ngày khác nhau (baseline v1). Lý do: 宜 của 營建宮室 nằm trọn trong 宜 của 興造動土, 忌 giống hệt, nên hợp hai heading = 興造動土. Khi bật P4 (production) chúng khác nhau 100/1095 ngày, hoàn toàn do heading thứ hai 營建宮室: 60 ngày 營建宮室 ở trạng thái only_ji quyết định construction (忌 thắng khi nhiều heading), 40 ngày construction giữ baseline còn groundbreaking được nâng only_yi (đo trên migration-diff-v2).
- **beam_raising**: 宜 giống hệt 興造動土, 忌 thiếu các thần đất (土府, 土符, 地囊, 土王用事後) → phân biệt được (264/1098 ngày khác groundbreaking khi tắt P4).
- **renovation**: 宜 thiếu 天德, 月德, 天德合, 月德合, 天赦, 天願 so với construction/groundbreaking → khác 313/1098 ngày (tắt P4), 287/1095 ngày so với construction và 187/1095 so với groundbreaking (bật P4).
- **福德** (thuộc 宜 của 修宮室) chưa có trong catalog thần; đang theo dõi ở P4 yi-operands task 2.3 (`docs/audits/p4-vol10-yi-operands.md`). Ngoài phạm vi.
- Sự kiện "Động thổ" chỉ dùng groundbreaking; construction đã bị gỡ khỏi vai trò phụ ngày 10/10 vì cùng heading (`legacyEventMapping.ts`).
- Vấn đề rộng hơn renovation: construction và groundbreaking gần như không phân biệt được từ nguồn. Không sửa ở đây.

## Phương án (chưa thực hiện)

### OPTION A — Giữ renovation ↔ 修宮室, ghi hợp đồng hẹp (sửa nhà đang có)

- semantic correctness: Cao theo bản 御用 và nghĩa 宮室 = nhà cửa; thấp hơn nếu theo lịch dân dụng
- ontology consistency: Cao: bốn activity giữ phân biệt được
- production impact: Không có thay đổi hành vi. Tuỳ chọn: làm rõ nhãn/mô tả (vd "Sửa nhà") — đó là thay đổi chữ UI, cần duyệt riêng
- affected records: 0
- migration required: Không
- advantages: Giữ phân biệt sửa/xây/động thổ có cơ sở nguồn
- risks: Lệch với tập quán 民用 (修造動土)

### OPTION B — renovation → 興造動土 (theo 「修造同」)

- semantic correctness: Trung bình: đúng tập quán 民用 nhưng biến "sửa" thành "khởi công + động thổ"
- ontology consistency: Thấp: renovation trùng groundbreaking
- production impact: **BEHAVIORAL MIGRATION REQUIRED**: ước tính 187/1095 ngày đổi score/status, 73 ngày đổi status (bật P4), giả định renovation remap sẽ cho kết quả giống groundbreaking
- affected records: ~187 ngày × renovation
- migration required: Có: activityEntries, truc.json, good-gods.json, bad-gods.json (sourceRef 修宮室), artifact P4 đóng băng chứa dòng renovation (baseline v1, migration-diff v1/v2, score-golden v1/v2, yi-baseline-v1…) cần phiên bản golden mới
- advantages: Theo lịch dân dụng
- risks: Mất phân biệt; trùng activity

### OPTION C — renovation → 修宮室 + 興造動土 (hợp, như construction)

- semantic correctness: Thấp: gộp sửa và khởi công
- ontology consistency: Thấp: renovation ≈ construction
- production impact: **BEHAVIORAL MIGRATION REQUIRED**: ước tính 287/1095 ngày khác so với hiện tại (bật P4), 117 ngày đổi status, giả định kết quả giống construction
- affected records: ~287 ngày × renovation
- migration required: Có (như B)
- advantages: Bao cả hai cách hiểu
- risks: Ba activity gần như trùng nhau

**RECOMMENDED: OPTION A** — lý do ontology: nguồn (cả 卷十一 lẫn 卷十) tách 修宮室 khỏi 修造動土; 宮室 là nhà cửa nói chung; giữ được ba activity xây cất phân biệt. Lý do "không đổi hành vi" không phải căn cứ chọn. Nếu owner ưu tiên tập quán 民用, chọn B và chấp nhận migration hành vi.
