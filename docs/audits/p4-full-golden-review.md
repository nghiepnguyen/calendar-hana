# Full Golden P4 v2 — tài liệu review cho owner (task 8.0)

2026-10-17. Golden v2 (`c574e57`) đã vào `main` qua PR #66; runtime không đổi. Tài liệu này gom những gì owner cần xem để **nghiệm thu roadmap 7**. Chi tiết: [báo cáo](p4-full-golden.md), [README v2](sources/p4-vol10/p4-full-golden-v2/README.md).

## 1. Xác nhận các quyết định đã áp vào Golden

| Mã | Quy tắc trong Golden | Số dòng ảnh hưởng (ngày / context) |
|---|---|---|
| H1-B/F5 | 忌 không bảo vệ (canonical hoặc convention) gặp 相抵 của scope khác → 忌 giữ, 宜 không ghi, rồi xét lan truyền | 95 / 58 |
| E3 | Lan truyền gỡ 忌 mà heading còn 相抵 → `neither_recorded` | 57 / 33 (đều là dòng H1-B) |
| H2-A | 天願 ∈ 德願; ngày 未月戊午, phạm vi 閉日/天吏 theo 如常例 | 2027-08-07 và context 未-戊午 |
| F1 | 百忌 巳日「出行」 → 行幸遣使 (專忌, được bảo vệ) | 73 / 45 |
| F4 | 閉日 không sinh 忌 cho 求醫療病 (theo 卷十: 療目) | không đổi |
| E1 | 復日/重日 gặp 德赦六合 → 「不忌亦不註宜」 → `neither_recorded` | 59 / 38 |
| E5 | Context chỉ xác định khi bất biến trên soil × ngày âm × phase | 4.437 context `undetermined` |
| (i) | 德作建論: 天德/月德/天德合/月德合 không tính là 德 ở mọi chỗ trên ngày đó | 2 / 12 |

## 2. Mỗi lớp lệch so với engine: một ví dụ

Mọi lệch đều đã được chứng minh nguyên nhân bằng cách đảo luật ([attribution.json](sources/p4-vol10/p4-full-golden-v2-review/engine/attribution.json)).

| Lớp | Ví dụ | Golden | Engine hiện tại | Code Golden |
|---|---|---|---|---|
| H1-B/F5 + E3 | 2025-03-18 修倉庫 | neither_recorded | undetermined | `propagated:興造動土+豎柱上梁>neither_recorded;H1-B;ji=月虛;xd=月煞` |
| H2-A | 2027-08-07 祭祀 | only_yi | undetermined (engine coi cả ngày undetermined) | `no_ji;yi:四相+天願` |
| F1 (SPEC_BUG authority) | 2025-01-12 行幸遣使 | only_ji, bảo vệ | not_recorded | `ji;ji=百忌巳;prot=百忌巳` |
| E1 (ENGINE_BUG) | 2025-01-06 安葬 | neither_recorded | only_yi | `xiangdi;xd=重日` |
| (i) | 2026-06-01 安葬 | only_ji | not_recorded | `ji;ji=復日;suppressed:puzhu:28-first` |
| ENGINE_BUG phân tầng A04b | 2025-05-03 栽種 | only_ji, bảo vệ | undetermined | `ji;ji=土王用事後+地火+死氣;prot=土王用事後+死氣;xd=月厭` |

Danh sách đầy đủ: [diffs.tsv](sources/p4-vol10/p4-full-golden-v2-review/engine/diffs.tsv). Các dòng H1-B: [h1b-changes.tsv](sources/p4-vol10/p4-full-golden-v2/compose/h1b-changes.tsv).

## 3. Một ngày cụ thể để đối chiếu: 2026-10-17 (戌月 甲子)

Cách đọc code: `ji=` là nguồn 忌, `prot=` là nguồn bảo vệ, `xd=` là nguồn 相抵/不註, `yi:` là thần 宜 có mặt, `suppressed:` là nguồn chặn 宜.

| Heading | Trạng thái | 忌 / bảo vệ | Code |
|---|---|---|---|
| 祭祀 | only_yi | false / false | `no_ji;yi:天巫+時德+普護` |
| 祈福 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 求嗣 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 結婚姻 | only_ji | true / false | `ji;ji=滿日+災煞;suppressed:災煞` |
| 嫁娶 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 納采問名 | only_ji | true / false | `ji;ji=滿日+災煞;suppressed:災煞` |
| 般移 | only_ji | true / true | `ji;ji=歸忌+災煞;prot=歸忌;suppressed:災煞` |
| 安牀 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 開市 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 立券交易 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 納財 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 行幸遣使 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 宴會 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 入學 | not_recorded | false / false | `no_ji;yi_absent` |
| 求醫療病 | only_ji | true / false | `ji;ji=滿日+災煞;suppressed:災煞` |
| 掃舍宇 | not_recorded | false / false | `no_ji;yi_absent` |
| 整容剃頭 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 興造動土 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 營建宮室 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 修宮室 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 豎柱上梁 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 修倉庫 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 開倉庫出貨財 | only_ji | true / true | `ji;ji=災煞+百忌甲;prot=百忌甲;suppressed:災煞` |
| 栽種 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 牧養 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 納畜 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 安葬 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 破屋壊垣 | only_ji | true / false | `ji;ji=災煞;suppressed:災煞` |
| 乘船渡水 | not_recorded | false / false | `no_ji;yi_absent` |

## 4. Nghiệm thu nghĩa là gì

- Golden v2 trở thành oracle chính thức cho mục 7b và mọi phần sau. Không sửa Golden để test xanh; nếu thấy sai thì ra v3.
- Không kích hoạt gì: scoring, flag và runtime giữ nguyên. Adapter thuộc mục 8, activation thuộc mục 10.
- Giới hạn còn lại:
  - single reviewer;
  - presence và danh sách 忌 lấy từ authority đã khóa;
  - S1 (土王用事 canonical) vẫn OPEN;
  - miền context chưa so 修倉庫 với engine.
