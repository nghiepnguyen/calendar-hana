# PROJECT_CONTEXT — lịch sử (archive)

> **Archive nguyên văn** của `PROJECT_CONTEXT.md` đến PR #36 (10/10/2026). Không cập nhật file này nữa; trạng thái hiện hành ở [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md). Các câu “flag OFF / Actions khoá / deploy thủ công / chưa merge” dưới đây là snapshot tại thời điểm viết. Số phần (“phần 39”…) trong file chính trỏ về file này.

> Handoff cập nhật 2026-10-10 (giờ Việt Nam), sau PR #6–#21: activity interpretation review, Sát Chủ tháng 7/8, nhân chứng in Ngọc Hạp Chánh Tông, sửa trang scan 觜/參, sửa 修倉庫, Trực/thần + 卷十 vào diagnostics, presence 月厭/月刑/月煞/災煞 + 天赦/天願/月恩/四相 + đọc scan 月表, 卷十 scoring sau flag tắt, Thiên Đức legacy tháng quẻ bỏ theo 月表 (PR #21, đổi điểm), rồi PR #22–#29: trung tính khi không gặp ngày kỵ (≤ high), đo lại 卷十 + review mapping 用事 29/29, tách kho (Sửa kho / Mở kho xuất hàng), nhãn Mở hàng, cảnh báo cứng không làm nhẹ trạng thái, 百忌日 甲日/乙日, 土王用事 (tất cả đổi điểm, đã deploy). GitHub Actions bị khoá billing: gate local + deploy hosting thủ công.
> Đây là tài liệu trạng thái và quyết định của project; chỉ dẫn trong tài liệu không thay thế yêu cầu mới của người dùng.
> **Cập nhật sau PR #33–#35 (10/10/2026, phần 40):** repo public (MIT), GitHub Actions chạy lại; **merge vào `main` = CI tự deploy production** (firestore + hosting + functions). Các câu “Actions bị khoá billing / deploy hosting thủ công” bên dưới là lịch sử.
> Chat mới đọc header Release mới nhất, **phần 40** và **phần 39 (handoff tổng hợp sau PR #31/#32)** trước; phần 2 là roadmap hiện tại, phần 24 là tooling. Phần 21/23/33–38 lưu lịch sử; các câu flag OFF/chưa merge ở đó là snapshot trước release, không phải trạng thái production hiện tại.
> Các phần Phase 4C/4D/5 được kế thừa từ context trước; Phase 6/7 và release evidence được kiểm chứng trong thread này.


## Release mới nhất — 卷十 ON, 10/10/2026

**PR #31/#32 đã MERGED; production `xiejiVol10Scoring = true`.** Main release `4e92cb68de23a62910482668fece4d10ba836cd5`. Deploy Hosting thủ công hoàn tất, production `Last-Modified` **09:18:51 UTC (16:18:51 VN)**. Bundle `index-Camk5ToH.js`, SHA-256 `5430ed0db4c83ad83ef9ee54948582766f59e8a3397b7d6ff8ccf7eb5e9fb190`, byte-for-byte trùng build local; có `xiejiVol10Scoring:!0`.

Production smoke **9/9 pass** (desktop Chromium, mobile Pixel 7, desktop Safari/WebKit; browser context tạm): Cưới hỏi 2025-01-21 **Thuận lợi**; 2025-03-17 (卯月 月破) và 2025-12-09 (子月 月厭) **Không thuận lợi**. Không nhập profile vào tài khoản thật; ngày sinh chỉ lưu local trong context tạm. Không đổi mansion scoring.

**Sau release:** PR #33 (handoff docs), #34 (public release prep), #35 (timeout test CI) đã merge; CI deploy từ main `77861fe` lúc 10:47:09 UTC, bundle vẫn `index-Camk5ToH.js` cùng SHA-256 → product không đổi. Chi tiết phần 40.

Các mục 36/37 là snapshot readiness trước release; trạng thái mới nhất tại đây và phần 38. **Next ưu tiên: nhãn Khai trương/Mở hàng cùng 開市**, rồi 百忌日 còn lại, audit 21 thần vắng mặt/14 bảng tháng âm. Không còn việc chờ bật 卷十.

## 1. Project overview

**Project:** `calendar-hana`\
**Repository:** `nghiepnguyen/calendar-hana`\
**Production:** `lich.thanhnghiep.top`\
**Default branch:** `main`

Mục tiêu của project là xây dựng lịch dương/âm Việt Nam kết hợp lịch vạn
niên, chọn ngày và phong thủy theo kiến trúc có thể audit được. Các quy
tắc truyền thống không được gom thành một "điểm tốt/xấu" tùy ý; mỗi rule
phải có nguồn, operand, convention và test độc lập trước khi ảnh hưởng
production.

### Nguyên tắc authority

1.  Astronomy/calendar core phải deterministic.
2.  Các rule truyền thống deterministic như 12 Trực, 28 Tú, Hoàng/Hắc
    đạo phải source-lock/convention-lock rõ ràng.
3.  Cát/Hung thần, Thụ Tử, Sát Chủ và các rule phụ thuộc sách/phái phải
    audit provenance trước khi migrate production.
4.  Golden phải độc lập với production.
5.  Không sửa Golden chỉ để làm test xanh.
6.  Không hardcode ngày, skip test hoặc nới assertion để che authority
    conflict.
7.  Không dùng "đa số website giống nhau" làm authority.
8.  Khi có khác biệt phải phân loại:
    -   `ENGINE_BUG`
    -   `GOLDEN_BUG`
    -   `SPEC_BUG`
    -   `CONVENTION_DIFFERENCE`
    -   `SOURCE_DEPENDENT`
    -   `NAMING_ONLY`
    -   `UNKNOWN`
9.  Migration diff phân loại:
    -   `EXPECTED_AUTHORITY_MIGRATION_CHANGE`
    -   `UNEXPECTED_REGRESSION`
10. Không reopen astronomy authority hoặc phase đã CLOSED nếu không có
    bằng chứng mới.

------------------------------------------------------------------------

## 2. Roadmap hiện tại

### Completed

1.  Calendar Core ✅
2.  Month Jian / 12 Trực ✅
3.  Group A ✅
4.  Group B ✅
5.  JPL Astronomy Authority ✅
6.  28 Tú canonical provenance ✅
7.  Hỷ Thần / Tài Thần / Phúc Thần ✅
8.  Hoàng/Hắc đạo --- Phase 4C ✅ CLOSED & DEPLOYED
9.  Cát/Hung thần --- Phase 4D ✅ CLOSED & DEPLOYED
10. Thụ Tử / Sát Chủ --- Phase 5 ✅ CLOSED & DEPLOYED

11. Phase 6 — Thái Tuế / Tuế Phá / Tam Sát ✅ CLOSED & DEPLOYED
12. Phase 7 — 28 Tú 宜/忌 content lock ✅ CLOSED & DEPLOYED (trong bản Ngọc Hạp 1880 đã chọn)
13. Activity taxonomy / explicit mansion mapping / conflict diagnostics / explainability ✅ MERGED & DEPLOYED; giới hạn product slice ở phần 29.
14. Activity interpretation review + door_opening/waterworks ✅ MERGED & DEPLOYED (PR #6); phần 30–31.
15. Sát Chủ tháng 7/8 thống nhất calendar ↔ personal ✅ MERGED & DEPLOYED (PR #8); phần 31. Sát Chủ vẫn SOURCE_DEPENDENT.

16. Trang scan 觜/參 + quote 角 ✅ MERGED & DEPLOYED (PR #11); 修倉庫 điều kiện 「又…併者」, dataset 1.2.1 ✅ (PR #14).
17. Trực + 9 thần audited + 卷十 resolution vào diagnostics ✅ MERGED & DEPLOYED (PR #15, #16; không đổi điểm).
18. 卷十 presence (月厭/月刑/月煞/災煞, 天赦/天願/月恩/四相), scan 月表, `undetermined` = 0, 卷十 scoring code + golden 39 ca + migration proof ✅ MERGED & DEPLOYED **sau flag `xiejiVol10Scoring` = false** (PR #18).
19. Thiên Đức/Hợp legacy tháng quẻ bỏ theo 月表 ✅ MERGED & DEPLOYED (PR #21, đổi điểm).
20. Không gặp ngày kỵ → trung tính cho sự kiện ≤ high ✅ MERGED & DEPLOYED (PR #23).
21. Mapping 用事 → activity (卷十一) review 29/29; tách Sửa kho / Mở kho xuất hàng; nhãn Mở hàng ✅ MERGED & DEPLOYED (PR #24, #25).
22. Cảnh báo cứng không làm nhẹ trạng thái ✅ MERGED & DEPLOYED (PR #28).
23. 百忌日 甲日/乙日; 土王用事 (18 ngày trước Tứ Lập) ✅ MERGED & DEPLOYED (PR #26, #27, #29). Chi tiết phần 35.
24. 卷十 scoring activation + migration readiness ✅ MERGED & DEPLOYED (PR #31/#32); flag ON, production smoke 9/9. Chi tiết phần 39.

### Next — đề xuất, chưa có scope triển khai mới được duyệt

Thứ tự ưu tiên (handoff mới nhất ở phần 39; phần 23 là nền lịch sử):

1. Gộp/ẩn một trong “Khai trương” / “Mở hàng” (cùng 開市).
2. 百忌日 còn lại cho activity đã có (巳日 出行, 寅日 祭祀, 亥日 嫁娶, 酉日 宴會, 申日 安牀, 未日 求醫療病).
3. 21/44 thần không bao giờ có mặt và 14 thần legacy tháng âm → audit bằng 月表.
4. Quy tắc chung 卷十 (“凡吉足勝凶…”, “凡吉凶相抵…”), phần 宜 theo thần.
5. Các điểm SOURCE_DEPENDENT của 土王用事; Sát Chủ cần nguồn offline.

### Engine

24. Activity taxonomy — **32 activity IDs** đã deploy (thêm door_opening, waterworks, warehouse_opening); 5 scope xây dựng hẹp giữ unmapped (owner).
25. Nên/kỵ rule mapping — mansion v2 review 115/115; 卷十一 用事 → activity 29/29 (single reviewer, agent).
26. Catalog chấm điểm — 24 cát thần (day-rule 除神) / 23 hung thần (day-rule 丁日, 甲日, 乙日, 人神, 土王用事); audit 10/10: 21/44 thần chấm điểm chưa bao giờ có mặt.
27. Conflict-resolution — diagnostics + 卷十 resolution/scoring đã deploy; `xiejiVol10Scoring: true` (PR #32).
28. Policy sản phẩm đang chạy — trung tính ≤ high; cảnh báo cứng lấy trạng thái nghiêm hơn; 不註 → trung tính; 卷十 flag ON.
29. Explainability/evidence — mansion activity UI + bất lợi/thuận theo dòng đã deploy.
30. Daily evaluation — event evaluation đã deploy (11 sự kiện); mansion scoring vẫn tắt.

### Personal

31. Personal feng-shui rules
32. Bazi / Dụng-Hỷ-Kỵ-Cừu
33. Personal daily evaluation

### Product

34. UI integration
35. Full Golden/regression
36. E2E/visual/device — desktop/mobile Pixel 7/desktop Safari đã chạy local trên build ON và smoke production; iPhone/Firefox/emulator chưa chạy cho release này.
37. Production release (merge main → CI deploy tự động; xem phần 24, 40)

------------------------------------------------------------------------

## 3. Astronomy / calendar authority

Astronomy authority đã CLOSED.

-   Runtime: **JPL DE440s frozen table**
-   Authority ID: `astronomy-authority-v4`
-   Clock authority: `clock-v1`
-   Boundary semantics:
    -   `T - 1ms` → authority cũ
    -   `T` → authority mới
    -   `T + 1ms` → authority mới

Astronomy Engine/ERFA không phải fallback authority. ERFA chỉ được dùng
như independent verifier.

### Month Jian

Canonical APIs:

``` ts
getSolarMonth(dateTime, timezone)
getOfficerAtInstant(dateTime, timezone)
```

Month Jian đổi **đúng tại Jie instant**, không theo tháng âm.

------------------------------------------------------------------------

## 4. Phase 4C --- Hoàng/Hắc đạo

**Status:** CLOSED & DEPLOYED

### Authority

Primary source:

`欽定協紀辨方書 卷七〈黃道黒道〉`

-   Authority: `day-gods-authority-v1`
-   Month operand: `MONTH_JIAN_BRANCH`
-   Day operand: `DAY_BRANCH`
-   Jie authority: `astronomy-authority-v4 / clock-v1`

### Branch encoding

``` text
Tý   = 0
Sửu  = 1
Dần  = 2
Mão  = 3
Thìn = 4
Tỵ   = 5
Ngọ  = 6
Mùi  = 7
Thân = 8
Dậu  = 9
Tuất = 10
Hợi  = 11
```

### Thanh Long start

``` text
寅 / 申 -> 子
卯 / 酉 -> 寅
辰 / 戌 -> 辰
巳 / 亥 -> 午
午 / 子 -> 申
未 / 丑 -> 戌
```

Canonical formula:

``` ts
startChi = ((monthJianBranch + 10) % 6) * 2
index = (dayBranch - startChi + 12) % 12
```

**Lưu ý:** audit ban đầu từng ghi `+11`; giá trị đúng là `+10`.

### APIs

``` ts
getDayGodByMonthJian(monthJianBranch, dayBranch)
getDayGodAtInstant(dateTime, timezone)
```

### Day-view convention

`getDayInfo(date)` dùng:

``` ts
const monthJianBranch = solarTermMonthChi(jd)

dayGod: getDayGodByMonthJian(
  monthJianBranch,
  dayCC.chi
)
```

Ngày dân sự chứa Jie hiển thị Month Jian mới cho cả ngày. Consumer cần
exact instant phải dùng `getDayGodAtInstant()`.

### Naming migration

Legacy:

``` text
Kim Đường
```

Primary-source naming:

``` text
天德 = Thiên Đức
```

Classification: `NAMING_ONLY`.

Hour-god sequence dùng chung `TWELVE_GODS`, nên tên ở hour display cũng
đổi theo.

### Files

``` text
docs/audits/hoang-hac-dao-provenance.md
shared/lunar/audit-fixtures/day-gods-golden-v1.json
shared/lunar/dayGodAuthority.test.ts
shared/lunar/auspicious.ts
shared/lunar/index.ts
shared/lunar/calendarExtendedAudit.test.ts
shared/lunar/auspicious.test.ts
```

### Mutation gates

1.  lunar-month-style row shift
2.  Month Jian +1
3.  day branch +1
4.  Qing Long start +2
5.  good/bad flipped

### Important commits

``` text
c1e6877 test(calendar): freeze day-god authority golden
c6aa71d test(calendar): add day-god authority and Jie boundary gate
f9512a4 feat(calendar): add Month Jian day-god authority API
70d4d16 test(calendar): compare day-god boundary payload semantically
68b4efa feat(calendar): migrate day god to Month Jian authority
061d3c4 test(calendar): migrate day-god expectations to authority-v1
ad0a912 test(calendar): classify canonical day-god naming migration
a762bb2 test(calendar): add day-god migration and mutation gate
8522128 docs(calendar): record Hoang Hac Dao migration closure gates
513fb91 test(e2e): refresh month snapshots after day-god authority migration
```

------------------------------------------------------------------------

## 5. Phase 4D --- Cát/Hung thần

**Status:** CLOSED & DEPLOYED

### Core decision

Không coi `stars.data.ts` hoặc một bảng Cát/Hung thần là một authority
đồng nhất.

Mỗi star có thể có:

-   nguồn khác nhau
-   operand khác nhau
-   month basis khác nhau
-   mức độ source-lock khác nhau
-   recommendation semantics khác nhau

### Authority schema

``` ts
type StarOperand =
  | 'MONTH_JIAN_BRANCH'
  | 'DAY_STEM'
  | 'DAY_BRANCH'
  | 'DAY_CAN_CHI'
  | 'SEASON'
  | 'SOLAR_TERM'
  | 'LUNAR_DAY'
  | 'OTHER'

interface StarAuthority {
  id: string
  name: string
  kind: 'CAT' | 'HUNG'

  monthBasis?: 'MONTH_JIAN'

  operands: StarOperand[]
  rule: StarRule

  source: {
    work: string
    volume?: string
    section?: string
    confidence:
      | 'PRIMARY'
      | 'SECONDARY'
      | 'PROJECT_CONVENTION'
  }

  status:
    | 'SOURCE_LOCKED'
    | 'SOURCE_DEPENDENT'
    | 'CONVENTION_DIFFERENCE'
    | 'UNKNOWN'

  recommendationPolicy:
    | 'ACTIVITY_SPECIFIC'
    | 'INFORMATIONAL_ONLY'
}
```

Không có `scoreDelta`.

Evidence pipeline:

``` text
traditional evidence
→ activity mapping
→ conflict resolution
→ recommendation
→ explanation
```

### Existing generic engine

`shared/lunar/stars.ts`

`StarMatch` hỗ trợ:

``` ts
can?: number[]
chi?: number[]
canChi?: number[]
officer?: number[]
mansion?: number[]
lunarDay?: number[]
```

`matches()` dùng OR semantics giữa các field được cung cấp.

Legacy `byMonth` dùng:

``` ts
ctx.lunarMonth - 1
```

Đây là technical debt vì blanket assumption = lunar month.

### Production star table

`shared/lunar/stars.data.ts`

Nguồn lịch sử của bảng:

-   generated từ khoảng 730 ngày 2025--2026 trên `licham.vn`
-   suy ra rule theo lunar month
-   meanings lấy từ licham.vn
-   một số exact Can-Chi rules dùng "bảng gốc" nhưng header chưa xác
    định primary classical source

### Important authority finding

Trong `欽定協紀辨方書`, nhiều month-based 神煞 tổ chức theo **節 /
solar-term month**, tức Month Jian/Jie boundary.

Vì vậy:

> Không được mặc định `byMonth = LUNAR_MONTH`.

Star nào source-lock vào `協紀辨方書` phải verify Month Jian.

### Independent Golden

File:

``` text
shared/lunar/audit-fixtures/cat-hung-golden-v1.json
```

Authority:

``` text
cat-hung-authority-v1
```

Month basis:

``` text
MONTH_JIAN
```

Primary source:

``` text
欽定協紀辨方書
四庫全書本
卷五 義例三
卷二十至卷三十一 月表
```

Locked subset:

-   Thiên Đức / 天德
-   Thiên Đức Hợp / 天德合
-   Nguyệt Đức / 月德
-   Nguyệt Đức Hợp / 月德合
-   Nguyệt Phá / 月破
-   Kiếp Sát / 劫煞

Important caveat:

Raw Tian De directional tokens:

``` text
坤 / 乾 / 艮 / 巽
```

được giữ nguyên trong Golden. Không normalize ngầm.

### Production APIs/files

``` text
shared/lunar/catHungAuthority.ts
shared/lunar/catHungStars.ts
shared/lunar/almanac.ts
shared/lunar/catHungMigration.test.ts
shared/lunar/catHungRegression.test.ts
shared/lunar/catHungMutation.test.ts
```

### Partial Tian De lock

Always source-locked:

-   Nguyệt Đức
-   Nguyệt Đức Hợp
-   Nguyệt Phá
-   Kiếp Sát

Thiên Đức / Thiên Đức Hợp chỉ replace legacy khi authority row là direct
stem/branch token.

Các tháng raw directional token vẫn giữ legacy Thiên Đức/Hợp cho tới khi
normalization được source-lock.

### Merge/deploy

PR #1:

``` text
Phase 4D: source-lock Cát/Hung thần subset to Month Jian
```

Merge commit:

``` text
40983f584d95ef868e77118fbcf3ebe5db91fc5a
```

Phase 4D đã deploy production.

------------------------------------------------------------------------

## 6. Phase 5 --- Thụ Tử / Sát Chủ

**FINAL STATUS: CLOSED & DEPLOYED**

PR:

``` text
#2 Phase 5: source-lock Thụ Tử and classify Sát Chủ
```

Branch:

``` text
audit/thu-tu-sat-chu
```

Pre-merge branch gate:

``` text
#97 GREEN
```

Merge/main workflow:

``` text
#98 GREEN
```

Production deploy:

``` text
DONE
```

------------------------------------------------------------------------

## 7. Thụ Tử / 受死 authority

### Classical sequence

Primary witness:

`六壬大全 卷十九`

Sequence:

``` text
正月戌
二月辰
三月亥
四月巳
五月子
六月午
七月丑
八月未
九月寅
十月申
十一月卯
十二月酉
```

Equivalent Vietnamese sequence:

``` text
1  Tuất
2  Thìn
3  Hợi
4  Tỵ
5  Tý
6  Ngọ
7  Sửu
8  Mùi
9  Dần
10 Thân
11 Mão
12 Dậu
```

Independent calendrical evidence recorded in audit:

``` text
選日法は節月と日の十二支による
```

Meaning: selection method uses solar-term month + day branch.

### Canonical operands

``` text
MONTH_JIAN_BRANCH + DAY_BRANCH
```

Boundary:

``` text
EXACT_JIE_INSTANT
```

Civil-day presentation:

``` ts
solarTermMonthChi(jd)
```

Leap month semantics:

``` text
NONE
```

Global score:

``` text
FORBIDDEN
```

Status:

``` text
SOURCE_LOCKED
```

------------------------------------------------------------------------

## 8. Thụ Tử Golden

File:

``` text
shared/lunar/audit-fixtures/thu-tu-golden-v1.json
```

Authority ID:

``` text
thu-tu-authority-v1
```

Golden Month Jian rows:

``` text
寅 / 立春 -> 戌
卯 / 驚蟄 -> 辰
辰 / 清明 -> 亥
巳 / 立夏 -> 巳
午 / 芒種 -> 子
未 / 小暑 -> 午
申 / 立秋 -> 丑
酉 / 白露 -> 未
戌 / 寒露 -> 寅
亥 / 立冬 -> 申
子 / 大雪 -> 卯
丑 / 小寒 -> 酉
```

Golden gates:

``` text
productionIndependence = true
noLunarMonthFallback = true
exactJieBoundaryRequired = true
satChuInferenceForbidden = true
globalScoreAllowed = false
```

Commit:

``` text
8f822c942b174447fa00ea3edbb04b538d4e2c1f
test(calendar): freeze Thu Tu authority golden
```

------------------------------------------------------------------------

## 9. Thụ Tử production API

File:

``` text
shared/lunar/thuTuAuthority.ts
```

Exports:

``` ts
THU_TU_AUTHORITY_ID = 'thu-tu-authority-v1'
THU_TU_MONTH_BASIS = 'MONTH_JIAN'

getThuTuDayBranchByMonthJian(monthJianBranch)
isThuTuByMonthJian(monthJianBranch, dayBranch)
getThuTuAtInstant(dateTime, timezone)
getThuTuForDate(date)
```

Canonical table using project branch encoding:

``` text
Tý   -> Mão
Sửu  -> Dậu
Dần  -> Tuất
Mão  -> Thìn
Thìn -> Hợi
Tỵ   -> Tỵ
Ngọ  -> Tý
Mùi  -> Ngọ
Thân -> Sửu
Dậu  -> Mùi
Tuất -> Dần
Hợi  -> Thân
```

### Exact-instant implementation decision

Month Jian:

``` ts
getSolarMonth(dateTime, timezone)
```

Day branch must be based on **local civil date in requested timezone**,
not fractional UTC JD.

Current implementation converts instant to local date via:

``` ts
Intl.DateTimeFormat('en-CA', {
  timeZone,
  ...
}).formatToParts(...)
```

Then:

``` ts
solarStringToJd(localDate)
dayCanChi(jd).chi
```

This separates:

-   exact Jie instant for Month Jian
-   local civil-day branch for day operand

Fix commit:

``` text
155502d76b2c5d235889cb23d21ff6799049ee5b
fix(calendar): use civil day operand for Thu Tu instant authority
```

Export commit:

``` text
58b6f6220c44a75ee61fddc476b613f6eab8b49b
feat(calendar): export Thu Tu authority
```

------------------------------------------------------------------------

## 10. Thụ Tử production migration

File:

``` text
shared/lunar/almanac.ts
```

Legacy `Thụ Tử` identity is always removed from generic star output.

Authority star is added only when:

``` ts
getThuTuForDate(date).applies
```

Canonical star object:

``` ts
{
  name: 'Thụ Tử',
  isGood: false,
  meaning: 'Trăm sự đều kỵ'
}
```

Migration commit:

``` text
b3255418168faeb6bac47b1ed86a4b4a8fdc2944
feat(calendar): migrate Thu Tu to Month Jian authority
```

Schema fix:

``` text
30e9baa9ee6545a945e525b4895566719cba7709
fix(calendar): construct Thu Tu star with Star schema
```

### Legacy fixture rule

`shared/lunar/almanac.test.ts` không được dùng legacy fixture để
override authority-migrated stars.

`AUTHORITY_MIGRATED` hiện gồm:

``` text
Thiên Đức
Thiên Đức Hợp
Nguyệt Đức
Nguyệt Đức Hợp
Nguyệt Phá
Kiếp Sát
Thụ Tử
```

Commit:

``` text
df990bb6d42387fa586bdbab38438fd060a7ca34
test(calendar): stop legacy fixtures overriding Thu Tu authority
```

------------------------------------------------------------------------

## 11. Thụ Tử tests

### Authority test

File:

``` text
shared/lunar/thuTuAuthority.test.ts
```

Checks:

-   metadata against Golden
-   12 Month Jian rows production ↔ Golden
-   exactly one matching day branch per row
-   exact 12 Jie boundaries in 2026
-   T-1ms old authority
-   T/T+1ms new authority
-   day branch stable across 1ms

Important commit:

``` text
7ee8c053ebecf1cbbbfec891f87a9892d133c716
test(calendar): gate Thu Tu production API against Golden
```

### Migration test

File:

``` text
shared/lunar/thuTuMigration.test.ts
```

-   scans every day 2026
-   production presence must equal authority
-   authority must differ from legacy lunar-month rule on at least one
    date
-   no duplicate Thụ Tử identity

Sexagenary index fix:

``` text
fca5de5fb99ebde57a40909b67810e33083e06ae
fix(test): compute legacy Thu Tu sexagenary index correctly
```

### Mutation test

File:

``` text
shared/lunar/thuTuMutation.test.ts
```

12×12 semantic matrix.

Must kill:

1.  Month Jian row shift +1
2.  Month Jian row shift -1
3.  day branch +1
4.  rotated target row +1

Commit:

``` text
2610bd331a6d12c6b2418267db314ce9f8f5f7d9
test(calendar): add Thu Tu mutation gate
```

### Regression test

File:

``` text
shared/lunar/thuTuRegression.test.ts
```

Scans 2025--2027.

Assertions:

``` text
production Thụ Tử == authority
legacy-vs-authority changed days > 0
unchanged days > 0
production Sát Chủ == legacy Sát Chủ
```

Also requires at least one 2026 date where:

``` text
Thụ Tử presence != Sát Chủ presence
```

This protects against accidentally treating the two rules as the same
authority.

Commit:

``` text
babe238970daa307b4781d6e9646f43c4fdd216b
test(calendar): add Thu Tu and Sat Chu regression gate
```

------------------------------------------------------------------------

## 12. Sát Chủ decision

### Current production sequence

Legacy lunar-month sequence:

``` text
1  Tỵ
2  Tý
3  Mùi
4  Mão
5  Thân
6  Tuất
7  Sửu
8  Hợi
9  Ngọ
10 Dậu
11 Dần
12 Thìn
```

### Audit result

Primary classical provenance has **not** been established.

Modern Vietnamese sources support the sequence as a Vietnamese
folk/almanac **Sát Chủ Âm** rule, generally using:

``` text
LUNAR_MONTH + DAY_BRANCH
```

However:

-   conflicting variants exist under similar names
-   primary provenance unresolved
-   leap-month semantics unresolved

Therefore:

``` text
tradition = VIETNAMESE_FOLK_ALMANAC / SAT_CHU_AM
status = SOURCE_DEPENDENT
production migration = BLOCKED
legacy production behavior = PRESERVED
```

**Critical decision:**

> Không được suy ra Sát Chủ từ Thụ Tử và không được migrate Sát Chủ sang
> Month Jian chỉ vì Thụ Tử dùng Month Jian.

Audit commit:

``` text
5d75b5f76e40ff8811b2e52d4d6cd4757d16f219
docs(calendar): classify Sat Chu as Vietnamese source-dependent rule
```

Workflow #93 cho commit audit này đã green trước khi branch được
sync/merge.

------------------------------------------------------------------------

## 13. Phase 5 provenance file

File:

``` text
docs/audits/thu-tu-sat-chu-provenance.md
```

Final interpretation:

### Thụ Tử

``` text
SOURCE_LOCKED
MONTH_JIAN_BRANCH + DAY_BRANCH
exact Jie boundary
production migrated
Golden/mutation/regression gates present
```

### Sát Chủ

``` text
SOURCE_DEPENDENT
Vietnamese folk/almanac Sát Chủ Âm
secondary evidence suggests LUNAR_MONTH + DAY_BRANCH
leap-month semantics unresolved
production migration intentionally blocked
legacy preserved
```

Phase closure does **not** mean Sát Chủ is source-locked. It means the
audit reached a deliberate, documented blocked/deferred decision.

------------------------------------------------------------------------

## 14. CI policy

Workflow:

``` text
.github/workflows/ci.yml
```

Regular CI for:

``` text
main
feature/**
audit/**
```

Required regular Playwright jobs:

``` text
Playwright tests (desktop, 1/2)
Playwright tests (desktop, 2/2)
```

Mobile Safari/iPhone is intended as a periodic/non-blocking device
suite, not part of every regular gate.

Audit branch alignment commit:

``` text
2143c08c886558548655f104935dbf49777842ea
ci: align audit branches with desktop-only Playwright gate
```

During Phase 5, branch had to sync `main` because both sides touched
`ci.yml`. Final PR became mergeable and #97 passed.

------------------------------------------------------------------------

## 15. Phase 5 merge/deploy closure

PR:

``` text
#2
Phase 5: source-lock Thụ Tử and classify Sát Chủ
```

Head branch:

``` text
audit/thu-tu-sat-chu
```

Latest pre-merge CI:

``` text
#97 GREEN
```

User then merged:

``` text
Merge pull request #2 from nghiepnguyen/audit/thu-tu-sat-chu
```

Main workflow:

``` text
#98 GREEN
```

User confirmed production deployment completed.

Therefore:

``` text
PHASE 5 = CLOSED & DEPLOYED
```

------------------------------------------------------------------------

## 16. 28 Tú — identity và content là hai authority layer

Canonical cycle, absolute phase, 七曜 và tổ hợp cầm thú đã CLOSED trước thread này.

```ts
const index = (((jd + 11) % 28) + 28) % 28
```

`index` 0..27: Giác, Cang, Đê, Phòng, Tâm, Vĩ, Cơ, Đẩu, Ngưu, Nữ, Hư, Nguy, Thất, Bích, Khuê, Lâu, Vị, Mão, Tất, Chủy, Sâm, Tỉnh, Quỷ, Liễu, Tinh, Trương, Dực, Chẩn.

`luminary` là 七曜 canonical; `element` compatibility chiếu Nhật→Hỏa, Nguyệt→Thủy.

Phase 7 đã source-lock **content theo bản cụ thể**, không đổi identity/phase:

```text
authorityId = mansion-content-yuxia-1880-v1
contentVersion = 1.0.0
selected edition = 繪圖增廣玉匣記 / 掃葉山房 / 光緒六年 (1880)
record.reviewStatus = SOURCE_LOCKED (trong edition này)
record.classification = SOURCE_DEPENDENT (giữa các sách/phái)
```

`Mansion.content` được gắn vào `getMansion(jd)`; UI/SEO và evidence production dùng content này.
`isGood`, `shouldDo`, `shouldAvoid` cũ giữ nguyên để compatibility; **chưa được chứng nhận classical**, không dùng như intrinsic verdict hoặc scoring authority.

```text
28 Tú = informational
scoreDelta = 0
rawDelta = 0 (đối với source content mới)
mansion28ScoringEnabled = false
```

Chi tiết data/schema, mapping và migration ở phần 22. Phase 7 CLOSED không có nghĩa scoring 28 Tú được phép bật.

------------------------------------------------------------------------

## 17. Hỷ / Tài / Phúc Thần

Operand:

``` text
DAY_STEM
```

Sources:

-   Hỷ: `欽定協紀辨方書 卷七〈喜神〉`
-   Tài: `玉匣記〈財神方位歌〉` --- project convention source-lock
-   Phúc: `玉匣記〈福神方位歌〉`

Table:

  Can    Hỷ Thần    Tài Thần   Phúc Thần
  ------ ---------- ---------- -----------
  Giáp   Đông Bắc   Đông Bắc   Đông Nam
  Ất     Tây Bắc    Đông Bắc   Đông Nam
  Bính   Tây Nam    Tây Nam    Đông
  Đinh   Nam        Tây Nam    Đông
  Mậu    Đông Nam   Bắc        Bắc
  Kỷ     Đông Bắc   Bắc        Nam
  Canh   Tây Bắc    Đông       Tây Nam
  Tân    Tây Nam    Đông       Tây Nam
  Nhâm   Nam        Nam        Tây Bắc
  Quý    Đông Nam   Nam        Tây

------------------------------------------------------------------------

## 18. Known technical/source debt

### 18.1 Sát Chủ

Still unresolved:

-   primary classical provenance
-   competing variants
-   leap-month semantics

Do not migrate until resolved.

### 18.2 28 Tú 宜/忌 — giới hạn edition và scoring

Identity/cycle đã CLOSED. Content trong bản Ngọc Hạp 1880 đã source-lock ở Phase 7; các edition khác, hành động legacy chưa được nguồn nêu và scoring/conflict resolution vẫn chưa được chứng nhận.

### 18.3 Generic star engine

`byMonth` still encodes lunar-month assumptions for legacy stars.

Future audits must not blindly reuse it for Month Jian authorities.

### 18.4 Thiên Đức partial normalization

Raw directional tokens:

``` text
坤 / 乾 / 艮 / 巽
```

still require explicit normalization provenance before full source-lock
of Thiên Đức/Hợp.

### 18.5 Duplicate Hoàng/Hắc đạo concepts

Legacy generic star table contains names/concepts overlapping Phase 4C.

Phase 4C is authoritative.

Future cleanup should prevent duplicate legacy stars from silently
overriding or duplicating Phase 4C results.

### 18.6 Activity recommendation engine

There is not yet a fully audited production-wide conflict resolver.

Do not convert all gods/stars into an arbitrary global score.

Future activity pipeline:

``` text
traditional evidence
→ activity mapping
→ conflict resolution
→ recommendation
→ explanation
```

------------------------------------------------------------------------

## 19. Phase 6 — annual directional authority

**CLOSED & DEPLOYED.** Branch `audit/tai-tue-tue-pha-tam-sat`, PR [#3](https://github.com/nghiepnguyen/calendar-hana/pull/3).

### Quyết định kiến trúc

Tách calendar-level vị trí/hướng theo năm khỏi personal interaction theo tuổi sinh.
Không dùng birth branch để lấy Tam Sát calendar; không gọi API mới để tự thay personal lunar-year behavior.
Không suy diễn "phạm Thái Tuế", remedies, cấm xây dựng hay điểm chọn ngày từ vị trí calendar.
API additive, không thay generic daily stars; tích hợp hướng năm vào UI calendar được để lại cho Product phase.

### Nguồn, operand và boundary

- Primary work: `欽定協紀辨方書 (四庫全書本)`.
- 卷三: 太歲, 歲破, 劫煞, 災煞, 歲煞 — mỗi rule có ID và citation riêng.
- 卷三十四〈造葬權法〉: hỗ trợ turnover annual direction theo Lập Xuân trong tradition này.
- Operand `SOLAR_YEAR_BRANCH`; boundary `LI_CHUN`.
- Exact instant lấy canonical `lap-xuan` từ JPL `astronomy-authority-v4 / clock-v1`.
- Precision `PROJECT_CONVENTION_EXACT_INSTANT`: milliseconds là operational convention, không phải khẳng định cổ thư quy định ms.
- `T-1ms` → solar year cũ; `T`, `T+1ms` → solar year mới.
- January 1/lunar new year là `CONVENTION_DIFFERENCE`, không phải fallback. Leap month không tham gia.

### APIs và thuật toán

```ts
ANNUAL_DIRECTIONS_AUTHORITY_ID = 'annual-directions-authority-v1'
getAnnualDirectionsByYearBranch(yearBranch) // integer 0..11
getAnnualDirectionsAtInstant(dateTime)      // yêu cầu Z hoặc explicit ±HH:MM

const year = new Date(instant).getUTCFullYear()
const solarYear = instant < Date.parse(liChun.instantUtc) ? year - 1 : year
const yearBranch = yearCanChi(solarYear).chi

taiSui.branches = [yearBranch]
suiPo.branches = [(yearBranch + 6) % 12]
sanSha = groups[yearBranch % 4]
```

Hỗ trợ UTC input years 1900–2100, gồm solar year 1899 trước Lập Xuân 1900. Equivalent timezone offsets phải cho cùng kết quả. Không hỗ trợ input instant không có timezone.

| yearBranch % 4 | Trine năm | Kiếp/Tai/Tuế Sát (giữ đúng thứ tự) | direction |
| --- | --- | --- | --- |
| 0 | Thân/Tý/Thìn | [5,6,7] = Tỵ/Ngọ/Mùi | 南 |
| 1 | Tỵ/Dậu/Sửu | [2,3,4] = Dần/Mão/Thìn | 東 |
| 2 | Dần/Ngọ/Tuất | [11,0,1] = Hợi/Tý/Sửu | 北 |
| 3 | Hợi/Mão/Mùi | [8,9,10] = Thân/Dậu/Tuất | 西 |

Thái Tuế/Tuế Phá giữ single branch, không tự ép thành 8 hướng. Tam Sát giữ ba branch + cardinal label. Không tạo degree intervals, 24 sơn hoặc width của sector.

### Schema runtime

```ts
interface AnnualDirectionalRule {
  readonly id: string
  readonly name: string
  readonly operands: readonly ['SOLAR_YEAR_BRANCH']
  readonly yearBoundary: 'LI_CHUN'
  readonly branches: readonly number[]
  readonly direction?: '北' | '東' | '南' | '西'
  readonly status: 'SOURCE_LOCKED'
  readonly recommendationPolicy: 'INFORMATIONAL_ONLY'
  readonly source: { work: string; section: string; confidence: 'PRIMARY' }
}
```

Record IDs: `tai-sui-direction-v1`, `sui-po-direction-v1`, `san-sha-direction-v1`.
Instant result thêm `authorityId`, `solarYear`, `yearBoundary`, `boundaryPrecision`, `astronomyMethod`, `yearBranch`, `taiSui`, `suiPo`, `sanSha`.

### File đã tạo/thay đổi

```text
docs/audits/tai-tue-tue-pha-tam-sat-provenance.md
shared/lunar/annualDirectionsAuthority.ts
shared/lunar/annualDirectionsAuthority.test.ts
shared/lunar/annualDirectionsRegression.test.ts
shared/lunar/audit-fixtures/annual-directions-golden-v1.json
scripts/audit-annual-directions-mutations.py
shared/lunar/index.ts                      # public API exports
.github/workflows/ci.yml                    # serial real-source mutation gate
```

### Gates và release

Golden: 12 literal year rows, independently expanded từ source; không gọi production.
Tests: tất cả 12 rows; metadata/policy/invalid inputs; timezone equivalence; 603 boundary cases (201 years × T-1ms/T/T+1ms); regression 1095 ngày 2025–2027; bảo vệ personal behavior.
Ví dụ 2026-02-10: calendar solar year = 2026; personal lunar-year convention còn 2025. Đây là tách convention có chủ ý.

7 real-source mutants: Tai Sui +1, opposite +5, Tam Sát wrong trine, north/south swap, equality delayed, Gregorian fallback, lunar fallback. Compiler/import errors không được tính là mutant kill. Runner restore source trong `finally`; chạy serial.

Implementation `ea65175`; CI gate `0a22c1f`; merge commit:

```text
adfd3b598545be067182654f4a1fdb2c54b7b974
```

Main [run 37952109725](https://github.com/nghiepnguyen/calendar-hana/actions/runs/37952109725) SUCCESS, actual Firebase `Deploy complete!` đã được kiểm chứng. Local phase validation tại thời điểm implementation: 134 test files / 2721 tests; typecheck/lint; 7 mutants killed.

------------------------------------------------------------------------

## 20. Rules for the next chat/agent

When continuing work:

-   Use GitHub repository directly when available.
-   Do not ask the user to upload repo files that can be inspected from
    GitHub.
-   On "làm", perform actual repo work rather than only explaining.
-   Work on audit/feature branch, not directly on `main`.
-   Do not claim tests are green until GitHub Actions confirms.
-   Do not claim production deployed until main deploy is confirmed.
-   If a source conflict appears, classify it rather than silently
    choosing one.
-   Never change independent Golden merely to satisfy production.
-   Keep calendar-level and personal feng-shui rules separate.
-   Keep each star/rule as its own authority record where provenance
    differs.
-   Do not introduce global auspiciousness scoring before the
    activity/conflict-resolution phase.
-   Preserve exact Jie boundary semantics wherever Month Jian is an
    operand.

------------------------------------------------------------------------

## 21. Current handoff state — đọc đầu tiên

```text
Phase 4C Hoàng/Hắc đạo             CLOSED & DEPLOYED
Phase 4D Cát/Hung thần subset       CLOSED & DEPLOYED
Phase 5 Thụ Tử / Sát Chủ audit      CLOSED & DEPLOYED
Phase 6 Annual directional rules   CLOSED & DEPLOYED
Phase 7 28 Tú content, edition 1880 CLOSED & DEPLOYED
Activity evidence product slice    MERGED & DEPLOYED (PR #5)
Activity interpretation review     MERGED & DEPLOYED (PR #6)
Sát Chủ months 7/8 alignment      MERGED & DEPLOYED (PR #8)
Docs: 觜/參 note (PR #9), handoff tracked (PR #10)
Scan page 觜/參 + 角 quote fix      MERGED (PR #11) & DEPLOYED (manual hosting)
修倉庫 conditional fix (data 1.2.1)  MERGED (PR #14) & DEPLOYED (manual hosting)
Trực/thần diagnostics + 卷十 diag   MERGED (PR #15, #16) & DEPLOYED (manual hosting)
Trực/thần context audit (docs)     MERGED (PR #12)
卷十 scoring plan (docs)            MERGED (PR #17)
卷十 presence + 月表 + scoring flag MERGED (PR #18) & DEPLOYED (manual hosting), flag OFF
Handoff PR #18 (docs)               MERGED (PR #20)
Thiên Đức trigram vs 月表 (#19)     MERGED (PR #21) & DEPLOYED (manual hosting) — ĐỔI ĐIỂM
Handoff PR #21 (docs)               MERGED (PR #22)
No-taboo neutral ≤ high             MERGED (PR #23) & DEPLOYED — ĐỔI KẾT LUẬN SỰ KIỆN
卷十 re-measure + mapping review     MERGED (PR #24) & DEPLOYED (metadata)
Kho tách đôi + nhãn Mở hàng         MERGED (PR #25) & DEPLOYED — hoạt động mới
Hard warning giữ trạng thái xấu     MERGED (PR #28) & DEPLOYED — ĐỔI TRẠNG THÁI
百忌日 甲日/乙日                     MERGED (PR #26) & DEPLOYED — ĐỔI ĐIỂM
土王用事 audit + code                MERGED (PR #27, #29) & DEPLOYED — ĐỔI ĐIỂM
```

Closure có phạm vi: Phase 5 không chứng nhận Sát Chủ (PR #8 chỉ thống nhất bảng tháng 7/8 giữa hai layer theo biến thể đã chọn); Phase 4D không chứng nhận mọi generic star; Phase 7 không chứng nhận mọi edition và không bật scoring.

Repo checkout hiện tại: `main`, HEAD và `origin/main` khi cập nhật handoff:

```text
75156514a0eeaa34ef5178870866ee14d9e20195
```

Latest release: **PR #23–#29 gộp một lần deploy**: hosting thủ công 2026-10-10 08:39:12 UTC (15:39:12 VN), bundle `index-DgL50c2x.js` trùng SHA-1 local (`1e8bef69…`), có `hardWarningKeepsWorseScoreStatus`, `tho_vuong_dung_su`, `giap_nhat`, `warehouse_opening`. (#23 đã deploy riêng trước đó lúc 07:40:06 UTC, bundle `index-DWF490CP.js`.) Smoke browser thật (Chromium) trên production: `/day/2026-01-25` Động thổ “Không thuận lợi”, bất lợi “Thổ Vương Dụng Sự”, ngày phù hợp gần nhất 4/2/2026 (= Lập xuân, biên loại trừ đúng); `/day/2026-01-10` Mở kho xuất hàng “Cân nhắc” với “Ngày Giáp (Bách Kỵ)”; `/day/2025-07-07` (月破) Cưới hỏi/Ăn hỏi/Chuyển nhà/Khai trương/Động thổ/Xây dựng nằm trong “Không nên làm”. **Đổi điểm/trạng thái production.** Chi tiết phần 35.

Release trước: **Thiên Đức legacy tháng 坤/乾/艮/巽 bỏ theo 協紀 月表**, [PR #21](https://github.com/nghiepnguyen/calendar-hana/pull/21) merge `e64d507` (đóng [issue #19](https://github.com/nghiepnguyen/calendar-hana/issues/19)); deploy hosting thủ công 2026-10-10 07:04:09 UTC (14:04:09 VN), bundle `index-BQ9rTDUx.js` trùng SHA-1 local (`76963ef8…`); smoke `/day/2026-09-25`: “Sao tốt” = Giải Thần, Thanh Long Hoàng Đạo (không còn Thiên Đức sao; “Thiên Đức” còn lại là tên giờ hoàng đạo Tỵ). **Đổi điểm production.** Chi tiết phần 34.

Release trước: **卷十 presence + 月表 + scoring behind flag**, [PR #18](https://github.com/nghiepnguyen/calendar-hana/pull/18) merge `ee3fd3f`; deploy hosting thủ công 2026-10-10 06:32:20 UTC (13:32:20 VN), bundle production `index-C57w-Wrc.js` trùng SHA-1 bản build local (`8a510222c166…`), bundle có `xiejiVol10Scoring:!1`. **Không đổi điểm/UI** (flag tắt). Chi tiết phần 33.

Release trước: **Trực/thần diagnostics + 卷十 diagnostics**, [PR #15](https://github.com/nghiepnguyen/calendar-hana/pull/15) merge `71e7558` và [PR #16](https://github.com/nghiepnguyen/calendar-hana/pull/16) merge `7dbf24b`; deploy hosting thủ công, bundle production trùng bản build local (`index-ChWrCHbv.js`). Không đổi điểm. Trước đó [PR #14](https://github.com/nghiepnguyen/calendar-hana/pull/14) (修倉庫, dataset 1.2.1) merge `51f7100`, deploy thủ công, bundle production có `datasetVersion: 1.2.1`.

Release trước: **Scan page 觜/參 + 角 quote fix**, [PR #11](https://github.com/nghiepnguyen/calendar-hana/pull/11) merge `97cebfc`; **deploy thủ công** `firebase deploy --only hosting` từ máy user, hosting `last-modified` 2026-10-10 04:29:51 UTC (11:29:51 VN). Smoke: `/day/2026-10-06` Chủy “trang 66”/`n65.jpg`, `/day/2026-10-07` Sâm “trang 65”/`n64.jpg`. PR #12 (docs + test) merge `9f9e0fc`.

**GitHub Actions không chạy được từ 10/10/2026 04:19 UTC** (“recent account payments have failed or your spending limit needs to be increased”). Main run 38023761172 của PR #11 và CI PR #12 không khởi động. User chọn bỏ qua Actions: gate chạy local (typecheck, lint, 142 files / 2800 tests, mutation 9/9 + 7/7, build, Playwright desktop 104/16 skipped; chưa chạy `test:emulator`), deploy hosting thủ công. Không gọi là CI green.

Release trước: **Sát Chủ months 7/8 alignment**, [PR #8](https://github.com/nghiepnguyen/calendar-hana/pull/8), MERGED & DEPLOYED 2026-10-10 10:37:13 Việt Nam; chi tiết phần 30 (mục “Cập nhật sau release”).

Release trước: **Activity interpretation review**, [PR #6](https://github.com/nghiepnguyen/calendar-hana/pull/6), MERGED & DEPLOYED 2026-10-10 09:46:35 Việt Nam.

Previous release: **Activity taxonomy / evidence**, [PR #5](https://github.com/nghiepnguyen/calendar-hana/pull/5), MERGED & DEPLOYED. Merge lúc 08:09:11 Việt Nam, Firebase deploy complete lúc **08:11:45 Việt Nam, 2026-10-10**. [Main run 38012046852](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38012046852) SUCCESS; chi tiết commit, gates và scope ở phần 29. Main tái sử dụng successful audit cùng Git tree; build và actual Firebase deploy vẫn chạy trên main.

Previous release (historical): [PR #4](https://github.com/nghiepnguyen/calendar-hana/pull/4), Phase 7 content lock; merge 2026-10-09 16:31:27 UTC, [main run 37959739801](https://github.com/nghiepnguyen/calendar-hana/actions/runs/37959739801) SUCCESS, deploy complete 16:34:11 UTC (23:34:11 Việt Nam). Production smoke của release đó: `/day/2026-09-28` trả HTML có `theo Ngọc Hạp bản 1880`, sao Nguy và source `page/n56.jpg`. Đây không phải production UI smoke của PR #5.

**Documentation debt:** audit markdown Phase 6/7 và verification docs của activity slice vẫn giữ snapshot trước release; Phase 6/7 có header trước release (`IMPLEMENTED... NOT CLOSED...`). Chúng là snapshot audit trước merge, không phải release state mới nhất. Release evidence trong handoff này và PR bodies mới hơn. Chat tiếp theo có thể cập nhật headers/checklists qua một docs-only change; không cần reopen authority hoặc triển khai lại Phase 6/7 vì header cũ.

------------------------------------------------------------------------

## 22. Phase 7 — 28 Tú 宜/忌 content lock

### Nguồn được chọn và lý do

Authority `mansion-content-yuxia-1880-v1`, version `1.0.0`.
Work **繪圖增廣玉匣記**; title page PDF 3 đọc trực tiếp: **光緒六年仲夏校鐫 / 掃葉山房藏板**, năm 1880.
Section **二十八宿值日吉凶歌**, PDF pages **46–73**, canonical order 角…軫.

- [Primary scan](https://archive.org/details/20241205_20241205_0310).
- [Title page](https://archive.org/download/20241205_20241205_0310/page/n2.jpg).
- Page images: `https://archive.org/download/20241205_20241205_0310/page/n{pdfPage-1}.jpg`.
- PDF filename `繪圖增廣玉匣記 .pdf` (có space trước `.pdf`).
- Bytes `120856022`; SHA-1 `c8f9ccbb73f7bb0e05c6c1880d61ac9f62dae6b1`.
- OCR không đáng tin; dùng visual reading toàn bộ 28 page images, không OCR làm authority.
- Chỉ chép operative excerpts, đọc polarity theo surrounding verse, không giả là full transcription.
- Version-study chỉ giúp tìm scan. Wikisource 玉匣記 không pin edition được loại khỏi content authority (variant ordering/wording, ví dụ 畢 無光 so với scan 光前). Không trộn với 文瑞堂 1684 hay Hiệp Kỷ identity rules.
- Source confidence `PRIMARY`; mapped Evidence confidence `medium` vì gloss/taxonomy là diễn giải.

### Data/schema

Tất cả 28 content records: `reviewStatus: SOURCE_LOCKED` trong edition này, `classification: SOURCE_DEPENDENT` giữa editions/traditions. Tổng **115 operative clauses**.

```ts
// Logical schema; runtime TS types derive from the production JSON,
// widening exceptions to string[] rather than JSON's inferred never[].
interface MansionContentClause {
  id: string                   // ví dụ 角-1
  quote: string                // original Chinese operative excerpt
  translation: string          // Vietnamese activity gloss
  polarity: 'positive' | 'negative' | 'neutral'
  activityId: string            // '' khi chưa có exact taxonomy mapping
  scope: string
  conditions: { operand: 'MANSION_INDEX'; equals: number }[]
  exceptions: string[]
  confidence: 'PRIMARY'
  scoreDelta: 0
}
interface MansionContent {
  authorityId: string
  version: string
  source: {
    work: string; edition: string; section: string; url: string
    titlePdfPage: number; pdfPages: number[]; pdfSha1: string
    transcription: string
  }
  index: number                // 0..27
  name: string
  han: string
  pdfPage: number               // 46 + index
  classification: string
  reviewStatus: string
  clauses: MansionContentClause[]
  coverage: string
}
```

### APIs và data flow

```ts
getMansionContent(index)          // rejects non-integer/out-of-range; returns structuredClone
getMansionContentEvidence(row)    // requires authority ID + SOURCE_LOCKED + exact index condition
presentMansionContent(row)        // source label, shouldDo/Avoid, meaning, reasons, source link
getMansion(jd)                    // giữ legacy fields, thêm .content
extractMansionEvidence(input)    // .content có mặt → structured authority; không → legacy parser
```

Every clause requires exactly one `MANSION_INDEX == content.index`. Không tự thêm month/season/hour/direction/birth operands. `exceptions: []` = không có extra override stated cho excerpts này, không khẳng định mọi tradition đều không có exception.

Evidence runtime giữ `sourceQuote`, `conditions`, `exceptions`; `sourceRef` trỏ đúng image page. `status: informational`, `scoreDelta: 0`, `rawDelta: 0`, label theo Tú + Ngọc Hạp 1880.

Legacy text-only parser vẫn tồn tại, longest phrase span-first để không gộp boat/grave repair vào parent activity; confidence giảm `high` → `low`. `audited-mansion-evidence.json` là **legacy parser snapshot**, không phải classical Golden và không được promote `ready`.

### Mapping và các decision quan trọng

- 造作/修造 → `construction_general` / `construction`, project mapping; không phải "mọi việc", 動土, 上梁 hay travel.
- Specific room/high-hall/columns/waterside construction giữ scope riêng, activity ID rỗng; không broad-map.
- 嫁娶/婚姻 → `relationship_wedding` / `wedding`; không suy ra engagement/bed installation.
- 埋葬/葬埋 → `funeral_burial` / `burial`.
- 修墳/墳墓修築 → `funeral_grave_repair` / `grave_repair`; không nhập vào burial.
- 行船 → `travel_water` / `water_travel`; chỉ Đê có operative clause này trong selected verses. Không nhập với road/general travel hoặc boat building/launching.
- 開門/放水 → `door_opening`/`waterworks`, activity IDs rỗng vì taxonomy chưa có exact match. Không đổi thành opening/business/water travel.
- Unmentioned activity = `UNKNOWN`, không phải allowed/forbidden; không tạo "mọi việc đều tốt"/"không kỵ gì".
- 吉/凶 headline không là intrinsic boolean verdict hay global score. Mão headline 凶 nhưng 造作進田牛 được giữ positive construction.
- Nguy burial legacy positive → selected-source negative: `SOURCE_DEPENDENT`, expected explanation migration.
- Chủy/Liễu có burial operative evidence sau review; việc legacy parser bỏ activity evidence ở hai Tú này không giới hạn content authority mới.
- Nguy 後生出外不還鄉 là consequence liên quan descendants, không biến thành operative travel taboo.
- Tỉnh widow/property consequence không biến thành wedding recommendation.
- Gloss không khẳng định cổ thư dự đoán chết/bệnh/phú quý là empirical outcome.

### UI/SEO và scoring

- AlmanacPanel neutral badge `Theo Ngọc Hạp`, edition label; không dùng legacy Cát Tú/Hung Tú verdict cho content.
- AlmanacExplain có edition/page link và original quote ↔ gloss; nói rõ tham khảo theo nguồn, chưa tính điểm/kết luận ngày.
- SEO static day article cùng wording/source page; unknown side có câu "Chưa có việc được nêu rõ trong đoạn nguồn đã đối chiếu."
- Daily activity evidence nhận structured content. Decision policy trong `activityRecommendations.ts` và `eventEvaluation.ts` không đổi ở Phase 7.
- `manifest.policies.mansion28ScoringEnabled = false`.
- `mansion28.json`: activityRules vẫn [], defaultModifier 0.
- `datasetVersion` vẫn `1.2.0`; `ENGINE_VERSION` tăng `1.1.0` → `1.2.0` cho memoized explanations; content có version riêng `1.0.0`.
- `Evidence` thêm optional `sourceQuote`, `conditions`, `exceptions`.

### File đã tạo

```text
docs/audits/28-mansion-content-provenance.md
shared/almanac-data/mansion-content-yuxia-1880-v1.json
shared/lunar/audit-fixtures/mansion-content-golden-v1.json
shared/lunar/audit-fixtures/mansion-decision-baseline-v1.json
shared/lunar/mansionContentAuthority.ts
shared/lunar/mansionContentAuthority.test.ts
shared/lunar/mansionContentRegression.test.ts
scripts/audit-mansion-content-mutations.py
e2e/mansion-content.spec.ts
```

### File đã sửa

```text
shared/lunar/mansions.ts
shared/lunar/mansionEvidence.ts
shared/lunar/mansionEvidence.test.ts
shared/lunar/evidence.ts
shared/almanac-data/audited-mansion-evidence.json
shared/almanac-data/manifest.json
shared/seo/daySeo.ts
shared/seo/daySeo.test.ts
src/views/DayView/AlmanacPanel.tsx
src/views/DayView/AlmanacPanel.test.tsx
src/views/DayView/AlmanacExplain.tsx
.github/workflows/ci.yml
```

### Golden, baseline và mutation gates

Golden chép visual-source trước runtime, commit riêng `564491e`; runtime JSON độc lập, runtime không import audit fixture. Không regenerate Golden từ implementation.

```text
content Golden SHA-256:
4c4b1be57ac711e4209a348db919c0117d26b8aab94892711ed148607817a0b1

decision baseline SHA-256:
4ee182f6a4aeb35960ffff0565373dee88d9e825715ab35f3181279c40f66be5
```

Baseline capture **trước code changes**, trên `adfd3b598545be067182654f4a1fdb2c54b7b974`:
1095 ngày 2025-01-01 đến 2027-12-31; all enabled activity scores/statuses và mọi EVENT_OPTIONS profile với hour=9.
Fixture lưu SHA-256 mỗi ngày của payload `{activities: [id,score,status][], events: [id,score,classification][]}`.
Regression chỉ recompute/compare, không recapture. Result: mọi decision digest giữ nguyên; explanations đổi có chủ ý.
Đây là migration baseline, không phải independent source authority cho event scoring.

9 real-source mutants phải KILLED bằng semantic assertions:

1. polarity flip;
2. wrong mansion row/name;
3. omitted index condition;
4. grave repair merged into burial;
5. water travel merged into road/general travel;
6. omitted exception (synthetic transport fixture, không invent classical exception);
7. unaudited promotion;
8. applied mansion score nonzero;
9. scoring policy enabled.

Runner restore mọi modified source trong `finally`; chạy serial, không đồng thời build/tests/edit source. CI gọi sau annual direction mutation gate trong unit/emulator job.

### Commits, GitHub validation và deploy

```text
564491e test: freeze mansion content and decision golden
54195cb51c2c716f44f306ce1d8f0ba4345b3d32 implementation
d1209ece5b4737e51dc7b452df6f2f3d84281a09 merge PR #4
```

- [Branch run 37957954624](https://github.com/nghiepnguyen/calendar-hana/actions/runs/37957954624): SUCCESS.
- [PR run 37958080623](https://github.com/nghiepnguyen/calendar-hana/actions/runs/37958080623): SUCCESS.
- GitHub unit suite: **136 files / 2757 tests**; emulator **3 files / 29 tests**.
- Typecheck/lint; both required desktop E2E shards; 9 Phase 7 mutants; GitGuardian SUCCESS.
- Local targeted E2E desktop + mobile: **4 passed**, source-dialog/page citation and no blanket-permission wording.
- Main run/deploy và production smoke được ghi ở phần 21.

------------------------------------------------------------------------

## 23. Vấn đề chưa giải quyết và next steps

### Những gì chưa được chứng nhận

1. **Sát Chủ:** bảng tháng 7/8 đã thống nhất calendar ↔ personal theo bài Hán văn (PR #8). **Tìm nguồn Hán văn 10/10/2026: không tìm thấy** (web, Wikisource “殺主” chỉ có nghĩa “giết chủ”); chỉ có nhân chứng Việt (Hán-Việt, Nôm, sách in). huyenbi.net có bài Nôm khác cũng cho 7 Hợi / 8 Sửu. Văn bản gốc tiền hiện đại chưa tìm thấy; nhân chứng in duy nhất là sách biên soạn hiện đại; sub-sources “Thọ-Mai”, “Lưu-Thị” chưa định vị; **leap-month semantics UNRESOLVED** (product dùng tháng chính); month basis giữ lunar. Vẫn `SOURCE_DEPENDENT`. Không suy từ Thụ Tử, không chuyển Month Jian.
2. **Thiên Đức/Hợp directional tokens — RESOLVED (PR #21):** 月表 không ghi 天德/天德合 ngày nào ở tháng 坤/乾/艮/巽 → không có mặt; legacy bỏ. Token thô vẫn không bị ép thành can/chi trong `catHungAuthority`.
3. **Generic stars:** `byMonth` blanket lunar assumption, modern-derived table, meanings/provenance chưa toàn bộ source-lock. Không tự đổi tất cả sang Month Jian.
4. **Duplicate Hoàng/Hắc concepts:** không để legacy duplicate ghi đè Phase 4C authority.
5. **Phase 6 product/personal:** calendar annual directions chưa đưa vào calendar UI; personal annual afflictions/lunar conventions được bảo toàn chứ chưa được Phase 6 chứng nhận. Không gộp hai layer.
6. **Phase 7 coverage:** other editions, old tailoring/study/business/bed/travel/boat claims chưa được selected poems hỗ trợ; vẫn UNKNOWN đối với authority này.
7. **Taxonomy/mapping:** door_opening/waterworks đã thêm (PR #6). **Owner quyết định 10/10/2026: không tạo ID** cho 5 scope xây dựng hẹp (`construction_columns`, `construction_high_hall`, `construction_new_room`, `construction_wall`, `construction_waterside`; 6 clauses) — giữ unmapped/reviewed; đóng thuyền/hạ thủy không có clause trong subset 1880 nên không có căn cứ định nghĩa; lexical “hạ thủy” → water_travel không được chứng nhận.
8a. **Mapping 用事 → activity (卷十一) — REVIEWED 29/29 (PR #24, #25):** travel ↔ 行幸遣使 theo chú 「出行同」, moving ↔ 般移 「移徙同」, meeting ↔ 宴會 「會親友同」, groundbreaking ↔ 興造動土 「修造同」; warehouse/business đã chốt (phần 35). Single-reviewer (agent).
8. **Interpretation review là single-reviewer (agent):** Golden diễn giải v2 chưa có thẩm định chuyên gia thứ hai; `interpretation_reviewed` không phải quyền chấm điểm.
9. **Trực/thần cho activity mới:** không có rule Trực/cát/hung thần cho door_opening/waterworks → luôn `no_evidence`. 協紀 卷十一 có 開渠穿井 / 修飾垣墻 (ứng viên), chưa chứng minh tương đương 放水.
20. **月厭/月刑/月煞/災煞 presence + 卷十 entries (diagnostics, nhánh `audit/xieji-monthly-sha-presence`, `docs/audits/xieji-monthly-sha-presence.md`):** định nghĩa theo Month Jian từ 卷四 (月厭 正月起戌逆行), 卷三/卷六 (月刑 = 歲刑), 卷六 (月煞 正月起丑逆行四季, 災煞 正月起子逆行四仲); khớp Group B v3.1 (月煞/災煞, 144 ô) và mọi câu 值X日 của 卷十. `shared/lunar/xiejiMonthlySha.ts` chỉ dùng cho `resolveVol10` (version `xieji-vol10-v2`), không đổi godPresence/điểm; legacy gods vẫn không bao giờ có mặt. Undetermined của 6 mục cũ 4.540 → 2.520; 4 mục mới 7.320 items (1.220 undetermined); divergence 6 mục cũ 1.707 → 2.313, 4 mục mới 3.417 (sản phẩm không có rule 月厭/月刑/月煞/災煞 chạy được). **Phần 2:** 天赦/天願/月恩/四相 khoá theo 卷五 歴例 (`shared/lunar/xiejiVirtues.ts`), 天德合 vắng mặt ở tháng tứ trọng (“四仲之月…無合”, `unknownGodIds` chỉ còn `thien_duc`). **Phần 3 (scan 月表 四庫全書, archive.org `06067692/94/95/97.cn`):** 240 trang ngày của tháng 2/5/8/11 không trang nào ghi 天德 (tháng 7 vẫn ghi 天德 ở 癸亥) → 天德 tháng tứ trọng vắng mặt, `unknownGodIds` = []. Scan cũng lộ lỗi: 天願 phải theo 卷五 **按 起例** (正月乙亥…五月丁未…十一月癸丑), không theo 歴例 (đã sửa; 月表 xác nhận). **Undetermined = 0** (2025–2027).
22. **卷十 scoring — ĐÃ CODE, flag `xiejiVol10Scoring` = false** (`docs/audits/xieji-vol10-scoring-migration.md`): `xiejiVol10Scoring.ts` (`applyVol10Scoring`), golden 39 ca đóng băng trước code (1 đính chính `GOLDEN_BUG` do suy tay), migration proof 1095 ngày (mọi dòng đổi giải thích bằng đúng một kết luận 卷十). Bật flag: 1.639/12.045 event đổi điểm; not_recommended→recommended 244, not_recommended→insufficient 156, insufficient→not_recommended 126… **Owner 10/10/2026:** (1) 不註 → **trung tính** (activity `neutral`, `event_fit` pass) — đã code; số mới: not_recommended→caution 172, không còn chuyển sang no_evidence/insufficient; (2) Thiên Đức legacy tháng quẻ → ticket riêng [issue #19](https://github.com/nghiepnguyen/calendar-hana/issues/19), audit toàn bộ 月表, không đụng migration 卷十; (3) **CHƯA bật flag**.
21. **Bảng verdict → điểm 卷十 — ĐÃ CHỐT 10/10/2026** (plan mục “Owner decisions”): avoid giữ trừ, cộng đổi thành trừ cùng độ lớn; not_avoided bỏ trừ giữ cộng; no_annotation bỏ cả hai; not_listed/undetermined giữ nguyên; avoid mà chuỗi 凶 chưa có trừ → thêm −25, không hardWarning; phạm vi 6 mục + deferral (4 thần mới không có dòng riêng); cap theo nguồn (Trực không cap, god theo bad_god cap); flag `xiejiVol10Scoring` mặc định false. **Owner: golden + migration proof làm SAU khi giảm tiếp undetermined** (天赦/天願/月恩/四相, token quẻ 天德) để không làm lại.
19. **Kế hoạch đưa 卷十 vào điểm — (lịch sử; đã code sau flag, xem mục 22)** (`docs/plans/xieji-vol10-scoring.md`): cần owner chọn bảng verdict → điểm, trọng số cho ngày kỵ mọi việc, flag `manifest.policies.xiejiVol10Scoring` (mặc định false); proof: golden độc lập 30–50 ca + migration proof (flag off = baseline 1095/1095; flag on = mọi thay đổi giải thích bằng đúng một item 卷十, không từ `undetermined`).
18. **卷十 resolution (diagnostics, nhánh `audit/xieji-vol10-resolution`, `docs/audits/xieji-vol10-resolution.md`):** chép 6 hung thần đã khoá (月建, 月破, 平日, 收日, 閉日, 刼煞) với điều kiện tháng/德/can-chi; `evaluateEventDay().classicalResolution` cho verdict từng hoạt động + `diverges`. 2025–2027: 1.707/10.920 mục lệch điểm sản phẩm (vd. 刼煞 tháng 寅申 chỉ kỵ quân sự/chữa bệnh). Không đổi điểm. Undetermined 4.540 (cần 月厭/月刑/月煞, 天赦/月恩/四相…). Bật vào điểm cần quyết định riêng.
17. **Bước (a) — Trực/thần vào diagnostics (nhánh `audit/xieji-diagnostics`):** Trực + 9 thần audited có `activityMapping` (`xieji-activity-mapping-v1`, authority `xiejibianfangshu-vol11`, pending), `conditions` tường minh, `exceptions: []`; `Almanac.selectionContext`; `evaluateEventDay` phân tích mọi contribution. Không đổi điểm. Legacy gods ngoài diagnostics. Tiếp: mã hoá 卷十.
16. **協紀 修倉庫 conditional clause — fixed (nhánh `audit/xieji-conditional-warehouse`, dataset 1.2.1):** “又收日母倉六合五富天倉與月德四相時德開日併者” chỉ tốt khi cùng có mặt; parser cũ tính vô điều kiện → bỏ Thu→warehouse và warehouse của Lục Hợp/Ngũ Phú/Thiên Thương. 220/1095 ngày đổi điểm warehouse; event verdict không đổi; pre-fix catalog vẫn tái tạo baseline 1095/1095 (`xiejiConditionalMigration.test.ts`). Tổ hợp co-presence chưa mã hoá. 卷十 宜忌 là nguồn cổ điển cho resolution policy (bác bỏ “gặp hung thần là kỵ”, xét theo lực), chưa mã hoá.
15. **Audit Trực/thần context (10/10/2026, `docs/audits/truc-than-context-audit.md`):** **21/44 thần chấm điểm không bao giờ có mặt** (không có tên chính xác trong bảng sao ngày, không suy alias) — gồm 災煞, 月煞, 月厭, 往亡, 四廢, 五墓, 天願, 四相, 時德, 不將; 14 thần legacy tính theo **tháng âm** trong khi 協紀 định nghĩa theo Month Jian (`CONVENTION_DIFFERENCE`); ngoại lệ 卷十一 (止忌/德化煞) chưa mã hoá. Trực + 9 thần locked/day-rule gần sẵn sàng cho diagnostics. `godPresenceCoverage.test.ts` khoá danh sách 21.
10. **Scoring/conflict resolver:** diagnostics đã deploy, chưa có audited resolution policy; mansion scoring vẫn tắt (`mansion28ScoringEnabled: false`).
11. **Lệch trang scan 觜/參 — RESOLVED (nhánh `audit/mansion-scan-page-fix`):** xác nhận trên ảnh gốc: n63 畢, n64 參, n65 觜, n66 井. Đã sửa 觜 pdfPage 66 / 參 65 trong dataset + Golden Phase 7 (`GOLDEN_BUG`), version 1.0.1.
12. **Tú 角 — RESOLVED cùng nhánh:** scan ghi 惟有葬埋不可用; đã sửa quote 角-3 (dataset, Golden Phase 7, Golden diễn giải v2 `reviewTerm` 葬埋).
13. **Documentation release headers:** audit docs Phase 6/7 và verification docs còn header/checklist trước release; cần docs-only reconciliation nếu muốn.
14. **UI production chưa kiểm tra bằng browser** cho PR #6 (disclosure, nhãn activity mới); smoke chỉ dựa trên HTML trang ngày.

### Next steps đề xuất cho chat mới (chưa tự implement)

1. Đọc phần 21, 23, 24, 35; `git pull` main (HEAD `7515651` sau PR #29; PR handoff này sau đó).
2. **Bật `xiejiVol10Scoring`** — owner: **CHƯA bật**. Mapping đã review 29/29; số đo lại (PR #24, sau #21/#23): rows như PR #18, event 1.662 đổi điểm. Các PR #25–#29 thêm hoạt động/thần/policy sau lần đo đó → **chạy lại** `REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts` trước khi bật. Khi bật: một dòng manifest → gate local → PR → deploy → smoke 2025-01-21 (cưới hỏi), một ngày 月破 tháng 卯, một ngày 月厭 tháng 子.
3. **Nhãn trùng nghĩa:** “Khai trương” (opening) và “Mở hàng” (business) cùng heading 開市, chỉ khác trọng số Trực → cân nhắc gộp/ẩn một mục (PR riêng, owner quyết).
4. **土王用事 còn SOURCE_DEPENDENT** (phần 35): đếm từ ngày hay thời khắc 立; biên 「後」; 時憲書 dùng đếm ngày hay 定氣; 德 có làm 止忌 như 土府 không. 「補垣」 và 開渠穿井 chưa có activity (waterworks chưa map).
5. **百忌日 còn lại** (卷十: 庚日 經絡, 辛日 醖釀, 壬日 開渠, 卯日 穿井, 巳日 出行, 寅日 祭祀, 亥日 嫁娶, 酉日 宴會, 申日 安牀, 未日 求醫療病, 丑日 冠帶, 午日 苫蓋): nhiều mục khớp activity hiện có (出行 → travel, 祭祀 → worship, 嫁娶 → wedding, 宴會 → meeting, 安牀 → bed_installation, 求醫療病 → medical). Cùng cơ chế `dayCan`/`dayChi` + preserve_bad; đổi điểm → owner quyết, golden trước code. Lưu ý 卷十 鋪註條例 “凡巳日忌出行不註宜出師遣使”, “凡酉日忌宴會亦不註宜慶賜賞賀”.
6. 21/44 thần không bao giờ có mặt; 14 thần legacy theo tháng âm → audit bằng 月表 (như trước).
7. Mã hoá quy tắc chung 卷十 (“凡吉足勝凶…”, “凡吉凶相抵…”) và phần 宜 theo thần.
8. Sát Chủ: cần nguồn offline.
9. Giữ: zero mansion scoring, core astronomy, exact Jie boundaries, calendar/personal separation, Golden độc lập (đóng băng trước code), không majority vote.
10. Quy trình: local validation → branch → PR → **user cho phép merge** → deploy → smoke → handoff qua PR. Actions bị khoá billing: gate local đủ, ghi rõ là local; deploy chỉ khi user đồng ý: `npx firebase deploy --only hosting --project calendar-hana`; kiểm bundle production trùng SHA-1 local + smoke browser (cách làm ở phần 35).

User request mới nhất: tổng kết handoff sau PR #23–#29 (merged + deployed). Không có implementation task đang tồn đọng; PR handoff này chờ merge.

------------------------------------------------------------------------

## 24. Workspace, tooling và cách tiếp tục an toàn

Workspace: `/Users/nghiepnguyen/My Files/calendar-hana`.
Original input context: `/Users/nghiepnguyen/Downloads/PROJECT_CONTEXT (2).md` (historical; chưa được sửa).
Handoff hiện tại: `PROJECT_CONTEXT.md` ở repo root, **tracked trong git từ 10/10/2026** theo yêu cầu user (PR riêng, docs only). Cập nhật handoff sau mỗi release qua nhánh/PR như code.

- Local `.gitignore` edits và untracked `.ignore` đã tồn tại trước Phase 7; được giữ nguyên, không đưa vào bất kỳ PR nào (#4–#10).
- `graphify-out/` và `graft/` là cache graph local, **không còn tracked từ PR #34** (gitignored); `graph.html` có thể bị xoá do >5000-node visualization limit. Không commit generated churn hoặc reset user state.
- Tài liệu audit/decision/design gốc ở root đã chuyển vào `docs/` (PR #34); bảng đường dẫn cũ → mới ở `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích đường dẫn root (khoá SHA-256 không đổi).
- **CI/deploy (từ PR #35):** Actions hoạt động lại; push `main` chạy typecheck/lint, unit+emulator, Playwright desktop 2 shard, rồi `firebase deploy --only firestore,hosting,functions` — rộng hơn deploy tay hosting-only trước đây. Merge vào main = deploy production → **luôn hỏi owner trước khi merge**. Không cần deploy tay nữa trừ khi CI hỏng.
- Graph có 5908 nodes, 8424 edges, 790 communities tại update gần nhất (sau PR #8).
- Theo AGENTS.md: đọc `graphify-out/GRAPH_REPORT.md` trước source/search; wiki index nếu tồn tại thì dùng wiki; cross-module questions ưu tiên graphify query/path/explain; sau code edits `graphify update .` AST-only.
- Graft: ask --source để locate/understand; callers để impact; grep cho exhaustive symbol usage. Không thay graph navigation bằng quét toàn bộ repo không cần thiết.
- Thread PR #22–#29 dùng **một** subagent nghiên cứu (đọc 36 quyển 協紀 tìm định nghĩa 土王用事); kết quả được kiểm lại trên file nguồn trước khi dùng (agent đọc sai 「乙日土王用事後」 — đã sửa). Raw wikitext 36 quyển nằm ở scratchpad của session, không durable.
- **Rebase khi working tree có `.gitignore`/`graphify-out` của user:** dùng `git rebase --autostash main` (không stash/reset tay).
- **Không chạy `npx prettier --write` theo glob rộng** (vd. `shared/lunar/*.ts`): nhiều file legacy (vd. `mansions.ts`) chưa format, sẽ sinh diff lớn ngoài phạm vi. Chỉ format file đã sửa.
- Branch prefix: CI chạy trên push cho `main`, `feature/**`, `audit/**`; `fix/**`/`docs/**` chỉ có CI khi mở PR.
- Temporary primary scan `/tmp/calendar-hana-yuxia-1880.pdf` và rendered images là research cache, không phải durable dependency. Trang lẻ bản 1880 tải trực tiếp: `https://archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1).
- Nhân chứng in *Ngọc Hạp Chánh Tông*: file user `~/Downloads/Ngoc hap chanh tong.pdf` (SHA-1 `95c29e2fd7c4b418555287a4dd1d2fbbfc3ebaae`, 69 ảnh JPEG, không text layer). Trích ảnh bằng Python (tìm stream `/Subtype /Image` + `DCTDecode`; máy không có PIL/poppler/mutool); cắt bằng `sips -c H W --cropOffset Y X` (offset `0 0` bị bỏ qua → dùng `1 1`).
- User specs ở `~/Downloads/` (không trong repo): `Spec Ngày Thụ Tử & Sát Chủ.md` (chọn bản Hán văn Sát Chủ, ghi dị bản Nôm), `Spec tính phạm Thái Tuế, Tuế Phá, Tam Sát, Sát Chủ.md` (bảng SAT_CHU_AM/DUONG).

Commands:

```sh
npm run typecheck
npm run lint
npm test
# Firebase emulator cần CLI/Java và môi trường hỗ trợ localhost:
npm run test:emulator
# Chạy mutation runners SERIAL, không đồng thời với test/build/edit nguồn:
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
# Targeted content E2E:
npx playwright test e2e/mansion-content.spec.ts --project=desktop --project=mobile
# Regular E2E theo CI:
npx playwright test --project=desktop
# Graph maintenance sau code edits:
graphify update .
```

CI `.github/workflows/ci.yml`: main/feature/**/audit/** + PR; desktop two shards là regular required gate. Main có thể reuse successful audit khi **Git tree giống hệt** và required jobs đều green; deploy vẫn chạy build + Firebase thật trên main. Mobile Safari/iPhone periodic/non-blocking như context trước.

Môi trường sandbox có thể cần escalation cho `.git`, network hoặc browser localhost. Trong thread này các yêu cầu merge/deploy đã được user authorize rõ; không suy ra authorization đó cho mọi phase tương lai. Không bao giờ đưa credentials/secret values vào handoff.

Starter prompt gợi ý:

> Đọc PROJECT_CONTEXT.md (phần 21, 23, 24, 35). Main = `7515651` (PR #6–#29, đã deploy). Đã có: trung tính khi không gặp ngày kỵ cho sự kiện ≤ high; mapping 用事 29/29; Sửa kho / Mở kho xuất hàng (開倉庫出貨財), nhãn Mở hàng; cảnh báo cứng không làm nhẹ “Nên tránh/Kỵ mạnh”; 百忌日 甲日/乙日; 土王用事 (18 ngày trước Tứ Lập, −15). `xiejiVol10Scoring` vẫn false. Actions bị khoá billing → gate local, deploy hosting thủ công khi tôi đồng ý. Việc tiếp theo: chờ tôi quyết bật flag 卷十 (đo lại trước), gộp Khai trương/Mở hàng, 百忌日 còn lại, hoặc audit 21 thần vắng mặt / 14 bảng tháng âm. Giữ 28 Tú informational/scoreDelta=0, không reopen astronomy.


## 25. Activity taxonomy — snapshot implementation 10/10/2026 (đã deploy, xem phần 29)

Yêu cầu mới: đọc context và làm tiếp Activity taxonomy. Bước 1 triển khai từ baseline main `d1209ec`; nhánh ban đầu `codex/activity-taxonomy` đã đổi thành `audit/activity-taxonomy`. Đã commit, merge và deploy cùng các bước 2–4 (phần 29).

- `shared/lunar/activityTaxonomy.ts`: bảng scope tường minh cho đúng 29 activity hiện tại; resolver exact/unmapped/incompatible, không suy authority/polarity/score hoặc tự broaden scope.
- `getActivityRecommendations` dùng default scope từ taxonomy thay vì phrase order trong mansion-patterns; parity cả 29 default scopes đã kiểm tra, không đổi datasets/scoring policy.
- Unknown/empty ID giữ unmapped trong contract mới; các scope mở cửa, thủy công và xây dựng hẹp vẫn chưa có exact ID. Không tự bật scoring 28 Tú.
- Inventory, acceptance, consumer map và next step: `docs/verification/activity-taxonomy.md`.
- Local validation: 137 test files / 2.761 tests passed, typecheck/lint/Prettier/diff-check passed; graph update AST hoàn tất.

Next tại thời điểm snapshot (các bước tiếp theo đã thực hiện bên dưới): explicit rule mapping với mapping review độc lập, narrow activity semantics và Golden độc lập trước semantic migration; conflict/explainability/scoring chưa thuộc bước 1 đã hoàn tất. Phần 21–24 đã được cập nhật theo release mới nhất.


## 26. Explicit rule mapping — snapshot implementation 10/10/2026 (đã deploy, xem phần 29)

Yêu cầu “làm tiếp” đã triển khai bước 2 trên nhánh triển khai (sau đổi tên: `audit/activity-taxonomy`).

- `shared/lunar/ruleActivityMapping.ts`: contract tường minh cho 12 scope của 28 Tú content subset; exact catalog pair và catalog gap riêng biệt, từ chối cặp sai/scope chưa khai báo.
- `getMansionContentEvidence` đính kèm activityMapping (version, status, reviewStatus, reason, authorityId, clauseId) cho 115 clauses: 70 exact_catalog_pair / 45 unmapped. Tất cả interpretation_pending; SOURCE_LOCKED không tự thành mapping review.
- Conditions, exceptions, quote, polarity và ID/scope nguồn giữ nguyên; điểm 28 Tú vẫn bằng 0, informational. Không đổi datasets hoặc astronomy/personal/scoring policy.
- Golden Phase 7 dùng làm parity proof, không tạo Golden mới bằng copy production.
- Validation: 138 files / 2.776 tests passed; lint/typecheck passed; Phase 7 semantic mutations 9/9 KILLED.
- Tài liệu: `docs/verification/activity-rule-mapping.md`. Đã commit/merge/deploy qua PR #5; xem phần 29.

Next tại thời điểm snapshot (các bước tiếp theo đã thực hiện bên dưới): review semantics/mapping của activity hẹp và Golden độc lập trước semantic migration; conflict theo cùng activity/scope/context rồi explainability. Mapping pending không được dùng để mở scoring. Contract bước 2 giới hạn source-locked 28 Tú; chưa migrate lexical fallback hoặc Trực/thần sang mapping review.


## 27. Conflict diagnostics — snapshot implementation 10/10/2026 (đã deploy, xem phần 29)

Yêu cầu “làm tiếp” triển khai bước 3 trên nhánh triển khai (sau đổi tên: `audit/activity-taxonomy`).

- `shared/lunar/evidenceConflicts.ts`: analyzer cùng activity/scope và context operand rõ; phân biệt within_authority / between_authorities, không majority vote/chọn winner/cancellation.
- Thiếu context, ID rỗng, scope sai hoặc ngoại lệ chưa xử lý giữ unresolved; điều kiện không khớp và no_evidence giữ notApplicable. Pending mapping có reviewPending=true.
- `evaluateEventDay` trả conflictAnalysis cho mansion contributions theo role event, context MANSION_INDEX; không đổi score/classification/policy cũ. Không tự gán context cho Trực/thần; chưa migrate các nguồn đó.
- Baseline 1.095 ngày 2025–2027 × 11 event hour=9 vẫn khớp. Nội dung authority/manifest/Golden không đổi; 28 Tú vẫn informational và scoreDelta=0.
- Validation: 139 files / 2.783 tests passed; lint/typecheck/Prettier/diff-check passed.
- Tài liệu scope/giới hạn: `docs/verification/evidence-conflicts.md`. Đã commit/merge/deploy qua PR #5; xem phần 29.

Next tại thời điểm snapshot (các bước tiếp theo đã thực hiện bên dưới): explainability cho metadata mapping, source/quote/applicability và opposing/unresolved witnesses. Conflict diagnostics không phải policy tự giải quyết xung đột hoặc quyền mở scoring; mapping semantics hẹp vẫn pending.


## 28. Activity explainability — snapshot implementation 10/10/2026 (đã deploy, xem phần 29)

Yêu cầu “làm” đã triển khai bước 4 trên nhánh triển khai (sau đổi tên: `audit/activity-taxonomy`).

- `MansionEvidenceDetails` tích hợp DailyActivitySection ở cả event và activity riêng. Thu gọn mặc định, mở bằng bàn phím; key ngày/mục tiêu reset disclosure.
- Hiển thị nguồn, quote, scan link, phạm vi, pending interpretation, applicability/exceptions và opposing witnesses. ID rỗng hiển thị riêng trong “Việc khác trong nguồn chưa có mục tương ứng”; không gán cho mục tiêu.
- Source không có evidence liên quan ghi rõ không suy permission/taboo. UI dùng analyzer bước 3, không tự chọn nguồn thắng hoặc mở scoring.
- Validation: 140 files / 2.787 tests passed; focused component 4/4 passed, typecheck/lint/format/diff-check passed, build thành công, existing mansion-content E2E desktop/mobile 4/4 passed.
- Browser manual: Enter mở disclosure, verdict giữ nguyên; responsive 390 px không tràn ngang. Ảnh /private/tmp/calendar-hana-activity-explainability.jpg.
- Scope/evidence: `docs/verification/activity-explainability.md`. Đã commit/merge/deploy qua PR #5, production main a69e8df; xem phần 29.

Bốn bước local taxonomy → explicit mansion mapping contract → conflict diagnostics → explainability đã hoàn tất trong phạm vi đã ghi. Mapping interpretation hẹp và nguồn/context Trực/cát/hung thần vẫn pending; không gọi đây là scoring authority mới hoặc full automated conflict resolution. PR/release gates đã hoàn tất (phần 29). Next còn lại là review semantics/mapping thiếu và context/policy trong scope mới được user yêu cầu.


------------------------------------------------------------------------

## 29. Activity evidence release — MERGED & DEPLOYED, 10/10/2026

Bốn bước ở phần 25–28 đã được phát hành: taxonomy tường minh cho 29 activity IDs; mansion rule-mapping contract; conflict diagnostics; activity explainability UI. Đây là product slice có giới hạn, không phải authority/scoring phase mới.

### Commit, merge và deploy evidence

- Implementation: `9803cabde6c0c66d8ce7744c9638c1b5f4f68337` — `feat(almanac): explain activity evidence` (18 files).
- Nhánh `codex/activity-taxonomy` đã đổi thành `audit/activity-taxonomy` ở local và GitHub theo yêu cầu user; cùng implementation commit.
- [PR #5 — Explain activity evidence with explicit taxonomy](https://github.com/nghiepnguyen/calendar-hana/pull/5): MERGED.
- Merge/main: `a69e8df73a715d589f1680be9bd5d20b6244f320`, lúc 2026-10-10 01:09:11 UTC (**08:09:11 Việt Nam**).
- [Branch CI 38010778949](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38010778949): SUCCESS.
- [PR CI 38011369880](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38011369880): SUCCESS; Prepare dependencies, Typecheck/lint, Unit/emulator và hai desktop Playwright shards đều green; GitGuardian SUCCESS.
- [Main CI/Deploy 38012046852](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38012046852): completed / SUCCESS, head SHA đúng merge commit; Prepare dependencies và Deploy to Firebase SUCCESS.
- Main reuse successful audit của nội dung đã kiểm tra: implementation và merge commit cùng Git tree `e5c5686d08ae5134053f5b1a7cdda2530b8d5f04`. Test jobs trên main SKIPPED do exact-tree reuse; không coi là test thất bại hay gate bị bỏ qua.
- Actual log: `hosting[calendar-hana]: release complete` và `Deploy complete!` lúc **2026-10-10 01:11:45 UTC / 08:11:45 Việt Nam**. Hosting URL: [calendar-hana.web.app](https://calendar-hana.web.app); production domain: [lich.thanhnghiep.top](https://lich.thanhnghiep.top).
- Trong request cập nhật handoff này đã kiểm chứng deploy log; chưa chạy production UI smoke mới cho PR #5. Browser/UI proof ở phần 28 là development preview, không gọi là production smoke.

### Validation và invariants

- Local full suite: **140 files / 2787 tests passed**; typecheck/lint/Prettier/diff-check và build passed.
- Existing mansion-content E2E desktop/mobile **4/4 passed**; focused component **4/4 passed**, manual Enter disclosure và 390 px không overflow.
- Phase 7 real-source mutation gate **9/9 KILLED**; CI Unit/emulator cũng chạy annual-direction và mansion mutation gates.
- Frozen decision baseline **1095 ngày 2025–2027 × 11 events, hour=9** giữ nguyên; không recapture baseline hoặc sinh semantic Golden từ production để làm test xanh.
- Mansion vẫn `informational`, `rawDelta = scoreDelta = 0`; manifest/datasets, astronomy, personal conventions và scoring/verdict policy không đổi.

### Scope đã ship và giới hạn còn pending

- 115 source-locked clauses: **70 exact_catalog_pair / 45 unmapped**; 12 scopes: **5 mapped / 7 catalog gaps**. Tất cả mapping vẫn `interpretation_pending`; SOURCE_LOCKED của đoạn nguồn không chứng nhận taxonomy interpretation.
- Diagnostics cùng activity/scope và explicit operand context; phân biệt within_authority / between_authorities. Unresolved/non-applicable witnesses giữ riêng; không majority vote, winner selection hoặc cancellation.
- Event conflictAnalysis hiện chỉ nhận mansion contributions với MANSION_INDEX; chưa migrate context Trực/cát/hung thần.
- UI “Thông tin Tú (tham khảo)” mở khi yêu cầu: source/quote/scan/scope/pending/applicability/exceptions/opposing witnesses; unmapped source clauses giữ riêng. Không có evidence không suy allowed/forbidden.
- Narrow activity IDs/semantics, independent interpretation Golden, full source context và audited conflict-resolution/scoring policy vẫn pending. Legacy authority gaps ở phần 23 không được release này giải quyết.

Verification snapshots đã commit trong PR #5:

```text
docs/verification/activity-taxonomy.md
docs/verification/activity-rule-mapping.md
docs/verification/evidence-conflicts.md
docs/verification/activity-explainability.md
```

Các trạng thái “chưa commit/deploy” trong verification snapshots mô tả thời điểm viết trước release. Phần 21 và 29 là release state mới nhất. `PROJECT_CONTEXT.md` lúc đó còn untracked; nay đã đưa vào git (phần 24).


------------------------------------------------------------------------

## 30. Activity interpretation review — MERGED & DEPLOYED, 10/10/2026

Yêu cầu user: “làm phase tiếp theo”, sau đó “thêm door_opening và waterworks vào danh mục hoạt động, xử lý 5 câu còn chờ”, rồi “cho phép merge”.

### Scope đã ship

- Mapping contract `mansion-activity-mapping-v2` (`shared/lunar/ruleActivityMapping.ts`): clause chỉ `interpretation_reviewed` khi quote chứa thuật ngữ nguồn đã rà soát của chính scope (`reviewTerm`); mapping trả `activityId` diễn giải; status `exact_catalog_pair | unmapped | not_operative`.
- **115/115 clauses reviewed**: 108 exact_catalog_pair, 6 unmapped (xây dựng hẹp: cột, cao đường, phòng mới, tường, bên nước), 1 not_operative (星-4). Evidence 114 rows.
- Catalog thêm `door_opening` “Trổ cửa / Làm cổng” (開門, 19 clauses) và `waterworks` “Dẫn nước / Khơi mương” (放水, 20 clauses), nhóm construction, không gắn event profile; Trực/thần không có rule nên `no_evidence`. Catalog nay 31 IDs.
- 5 clause đọc đủ bài trên scan archive.org: 張-1 (造龍軒 → construction), 參-5 (婚姻許定 → wedding, không suy nạp thái), 婁-1 (竪柱 → columns), 鬼-6 (築牆 → wall, không phải động thổ), 星-4 (câu hậu quả → not_operative; Tú Tinh không còn “Cưới hỏi — bất lợi”).
- Dataset 1880, manifest, Golden Phase 7 không đổi; migration khai báo tường minh trong `mansionContentAuthority.test.ts`. Golden diễn giải độc lập `shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json` (single-reviewer agent, viết tay từng clause).
- Decision baseline 1095 ngày × 11 event không recapture: hash trên 29 activity cũ; 2 activity mới assert `no_evidence`. Mansion vẫn informational, scoreDelta = 0.
- Doc: `docs/verification/activity-interpretation-review.md`.

### Release evidence

- Commits: `29bf0ae` (review v2), `2a1f89a` (catalog + 5 clauses). Merge `48fa26002b6ea603009dfc18ae880eb2cdf0a0e7` lúc 02:44:02 UTC.
- PR CI: branch run 38017456162 và PR run 38017460316 SUCCESS (Prepare, Typecheck/lint, Unit/emulator + mutation gates, Playwright desktop 2 shards, GitGuardian).
- Main run 38018038166 SUCCESS; test jobs skipped do exact-tree reuse (tree `b2d6c05568dad48824d6146135cec09283131b8d` = PR head). Log: `release complete` / `Deploy complete!` lúc 02:46:35 UTC (**09:46:35 Việt Nam**).
- Production smoke (HTML `lich.thanhnghiep.top/day/…`, sau deploy): 2026-10-11 Tú Tinh “Nên kiêng: Chôn cất; Dẫn nước.” (không còn Cưới hỏi); 2026-10-12 Trương và 2026-10-05 Tất hiện “Mở cửa; Dẫn nước”. Chưa kiểm tra UI tương tác production (disclosure/nhãn activity mới) bằng browser.
- Local trước PR: 140 files / 2795 tests; typecheck/lint/build; mutation 9/9; E2E mansion 4/4; desktop 104 passed / 16 skipped.

### Cập nhật sau release (10/10/2026)

- PR #7 `fix/explainability-test-date` (chỉ sửa comment test) đã MERGED, main `3b020b9`.
- Sát Chủ tháng 7/8: [PR #8](https://github.com/nghiepnguyen/calendar-hana/pull/8) **MERGED & DEPLOYED** — merge `74d6c64912e0dd7f8ed202e96a62b2c40cf13c6e` 03:26:19 UTC; main run 38020554586 SUCCESS (full test jobs chạy vì tree khác PR do PR #7); `Deploy complete!` 03:37:13 UTC (**10:37:13 Việt Nam**). Production smoke: `/day/2026-09-12` có “Sát Chủ” trong Sao xấu; `/day/2026-09-22` không còn. PR #8 gồm cả re-read độ phân giải gốc của nhân chứng in (sửa: tr. 114 là Tỉnh 井, không phải Tinh). Calendar `stars.data.ts` đổi tháng 7 Sửu→Hợi, tháng 8 Hợi→Sửu cho khớp `SAT_CHU_AM`, spec owner (bản Hán văn “thất Trư, bát Ngưu”) và nhân chứng in Ngọc Hạp Chánh Tông. Golden `sat-chu-golden-v1.json`, test `satChuAuthority.test.ts`. Chỉ hiển thị (không có trong bad-gods.json); 29 ngày 2025–2027 đổi. Sát Chủ vẫn SOURCE_DEPENDENT; leap chưa giải quyết. Phase 5 doc có ghi chú update.
- Note kiểm tra sau 觜/參: [PR #9](https://github.com/nghiepnguyen/calendar-hana/pull/9) MERGED (`4ba3793`), docs only: `docs/audits/mansion-scan-page-check.md` — trạng thái OPEN, chờ kiểm tra ảnh độ phân giải gốc.
- `PROJECT_CONTEXT.md` đưa vào git qua nhánh `docs/project-context`.

### Việc mở tại thời điểm release PR #6 — đã xử lý

Tất cả đã đóng hoặc chuyển sang phần 23/31: comment test (PR #7), nhân chứng Sát Chủ + sửa tháng 7/8 (PR #8), note 觜/參 (PR #9), handoff vào git (PR #10).

------------------------------------------------------------------------

## 31. Tổng kết thread 10/10/2026 — PR #6 đến #10

Chuỗi yêu cầu user: “đọc PROJECT_CONTEXT.md làm phase tiếp theo” → “thêm door_opening và waterworks, xử lý 5 câu còn chờ” → “cho phép merge” (PR #6) → đọc PDF *Ngọc Hạp Chánh Tông* → ghi audit docs-only → mở nhánh audit xử lý Sát Chủ 7/8, push nhánh sửa comment, tạo note 觜/參 → đọc lại PDF ở độ phân giải gốc → “cho phép merge” (PR #8), mở + merge PR #9 → đưa PROJECT_CONTEXT.md vào git (PR #10) → tổng kết handoff.

### Release và PR

| PR | Nội dung | Trạng thái | Merge commit | Deploy |
|---|---|---|---|---|
| #6 | Mansion interpretation review v2 + door_opening/waterworks + 5 clauses | MERGED & DEPLOYED | `48fa260` | 09:46:35 VN, main run 38018038166 (exact-tree reuse) |
| #7 | Sửa comment test (2026-10-11 là Tú Tinh) | MERGED (user tự mở/merge) | `3b020b9` | — |
| #8 | Sát Chủ tháng 7/8 + nhân chứng in + re-read | MERGED & DEPLOYED | `74d6c64` | 10:37:13 VN, main run 38020554586 (full tests) |
| #9 | Note kiểm tra trang scan 觜/參 (docs) | MERGED | `4ba3793` | — |
| #10 | Đưa PROJECT_CONTEXT.md vào git (docs) + tổng kết thread | MERGED | `8899a87` | — |

Production smoke (HTML `lich.thanhnghiep.top/day/<date>`): 2026-10-11 Tinh “Nên kiêng: Chôn cất; Dẫn nước.” (không còn Cưới hỏi); 2026-10-12 Trương, 2026-10-05 Tất có “Mở cửa; Dẫn nước”; 2026-09-12 có “Sát Chủ” trong Sao xấu; 2026-09-22 không còn.

### Decisions

1. **Scope phase tiếp theo** = review diễn giải mapping 28 Tú (next step #3–4 cũ); không thêm scoring, không đổi dataset nguồn.
2. **Reviewed theo thuật ngữ, không theo scope:** clause chỉ `interpretation_reviewed` khi quote chứa thuật ngữ nguồn đã rà soát của chính scope; thuật ngữ không lan sang scope khác.
3. **開門 = trổ cửa/làm cổng công trình**, không phải khai trương (開市). **放水 = dẫn/tháo nước, khơi mương**, không phải đi thuyền. Thêm ID `door_opening`, `waterworks` (nhóm construction, personalSensitivity 0.9), không gắn event profile.
4. **Không sửa source lock/Golden Phase 7** để gán ID mới: lớp mapping gán `activityId` cho clause có ID rỗng ở scope `catalogAdded`; migration khai báo tường minh (`EXPECTED_AUTHORITY_MIGRATION_CHANGE`) trong test.
5. **5 clause chờ** đọc đủ bài trên scan 1880: 張-1 造龍軒 → construction (龍軒 là mỹ từ); 參-5 婚姻許定 → wedding, không suy nạp thái; 婁-1 竪柱起門庭 → construction_columns (cửa đã có clause riêng); 鬼-6 修土築牆 → construction_wall (tường đất, không phải động thổ); 星-4 自要歸休別嫁郎 → **not_operative** (hậu quả của 不可葬埋并放水), bỏ khỏi evidence.
6. **Decision baseline không recapture:** hash 1095 ngày × 11 event chỉ tính 29 activity cũ; activity mới assert riêng `no_evidence`.
7. **Ngọc Hạp Chánh Tông** (Hà Tấn Phát) xếp loại nhân chứng in thứ cấp hiện đại; dùng làm witness, không làm authority chính.
8. **Sát Chủ 7/8:** calendar `stars.data.ts` theo dị bản Nôm (7 Sửu / 8 Hợi) trong khi project đã chọn bản Hán văn (spec owner, `SAT_CHU_AM` commit `38b5352`). Phân loại `ENGINE_BUG` ở calendar layer (hai layer cùng rule đã chọn nhưng lệch); dị bản Nôm ghi là rejected variant, không bị xoá. Sửa calendar thành 7 Hợi / 8 Sửu.
9. **Thọ Tử can-chi trong sách** (một ngày can-chi/tháng) = `CONVENTION_DIFFERENCE`, không đổi Phase 5.
10. **Lệch trang 觜/參:** chỉ ghi note để kiểm tra sau (user chọn), không sửa dataset/Golden.
11. **PROJECT_CONTEXT.md** chuyển sang tracked trong git (user yêu cầu); cập nhật qua PR.

### Thuật toán

`resolveMansionActivityMapping(clause: {id, quote, activityId, scope})` (`shared/lunar/ruleActivityMapping.ts`):

1. Scope phải có trong bảng `mappings`, nếu không → throw `Undeclared mansion activity mapping`.
2. `activityId` của clause phải bằng `mapping.activityId`, trừ trường hợp scope `catalogAdded` và clause có ID rỗng; ID khác rỗng phải `resolveActivityScope(...) === 'exact'`; sai → throw `Incompatible mansion activity mapping`.
3. Clause id trong `nonOperativeClauses` → `{activityId: '', status: 'not_operative', reviewStatus: 'interpretation_reviewed', reviewNote}`.
4. Tìm thuật ngữ đầu tiên trong `mapping.terms` có trong quote. Không có → `interpretation_pending` + note chung. Có → `interpretation_reviewed` + `reviewTerm` (+ `reviewNote` từ `clauseNotes` nếu có).
5. `status` = `exact_catalog_pair` nếu mapping có ID, ngược lại `unmapped`.

`getMansionContentEvidence` dùng `flatMap`: clause `not_operative` không sinh evidence; evidence lấy `activityId` từ mapping (không từ source lock). `analyzeEvidenceConflicts`: `reviewPending` chỉ false khi mọi witness `interpretation_reviewed` (logic không đổi).

Sát Chủ (ngày): `chi_ngày === SAT_CHU[lunarMonth − 1]`, bảng `[Tỵ, Tý, Mùi, Mão, Thân, Tuất, Hợi, Sửu, Ngọ, Dậu, Dần, Thìn]` = `[5,0,7,3,8,10,11,1,6,9,2,4]`; tháng nhuận dùng tháng chính (legacy, chưa có nguồn).

### Data / schema

`RuleActivityMapping` (v2):

```ts
{
  version: 'mansion-activity-mapping-v2'
  activityId: string                      // ID diễn giải; '' nếu gap/not_operative
  status: 'exact_catalog_pair' | 'unmapped' | 'not_operative'
  reviewStatus: 'interpretation_reviewed' | 'interpretation_pending'
  reason: string                          // ranh giới diễn giải của scope
  reviewTerm?: string                     // thuật ngữ nguồn tìm thấy trong quote
  reviewNote?: string                     // cách đọc theo đủ bài thơ
}
```

Bảng thuật ngữ đã rà soát:

| Scope | Terms | activityId |
|---|---|---|
| construction_general | 造作, 修造, 起造, 造龍軒 | construction |
| relationship_wedding | 嫁娶, 婚姻 | wedding |
| funeral_burial | 埋葬, 葬埋 | burial |
| funeral_grave_repair | 修築墳墓, 墳墓修築, 修墳 | grave_repair |
| travel_water | 行船 | water_travel |
| door_opening | 開門 | door_opening (catalogAdded) |
| waterworks | 放水 | waterworks (catalogAdded) |
| construction_columns | 竪柱 | '' |
| construction_high_hall | 造高堂, 架高堂 | '' |
| construction_new_room | 造新房 | '' |
| construction_wall | 築牆 | '' |
| construction_waterside | 臨水造 | '' |

Kết quả: 115 clauses = 108 exact_catalog_pair / 6 unmapped / 1 not_operative; 115 reviewed; evidence 114 rows (19 door_opening, 20 waterworks). Catalog `activities.json` 31 IDs; `ACTIVITY_SCOPES` thêm `door_opening: ['door_opening']`, `waterworks: ['waterworks']`.

Golden diễn giải v2: `{authorityId, mappingVersion, review, glossary, verses{婁,參,鬼,星,張}, items[{id, quote, activityId, scope, status, reviewStatus, reviewTerm?}]}`.

Golden Sát Chủ v1: `{authorityId: 'sat-chu-ngay-folk-v1', status: 'SOURCE_DEPENDENT', selectedVariant: 'HAN_VAN_VERSE', verse, witnesses[], rejectedVariants[{id:'NOM_VERSE', rows:{7:'Sửu',8:'Hợi'}}], operands: ['LUNAR_MONTH','DAY_BRANCH'], monthBasis, leapMonthSemantics: 'UNRESOLVED…', globalScoreAllowed: false, inferenceFromThuTuForbidden: true, rows[{month, dayBranch, dayBranchHan, chi, verseWord}]}`.

### File đã tạo

- `shared/lunar/audit-fixtures/mansion-activity-interpretation-golden-v2.json` (v1 tạo rồi xoá trước release).
- `shared/lunar/audit-fixtures/sat-chu-golden-v1.json`.
- `shared/lunar/satChuAuthority.test.ts`.
- `docs/verification/activity-interpretation-review.md`.
- `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md` (nhân chứng in, decision, re-read verification).
- `docs/audits/mansion-scan-page-check.md` (note 觜/參, 角).
- `PROJECT_CONTEXT.md` đưa vào git.

### File đã sửa

- `shared/lunar/ruleActivityMapping.ts` (contract v2), `shared/lunar/mansionContentAuthority.ts` (flatMap, activityId từ mapping).
- `shared/almanac-data/activities.json` (+2 ID), `shared/lunar/activityTaxonomy.ts` (+2 scope).
- `src/views/DayView/MansionEvidenceDetails.tsx` (hiện `reviewTerm`/`reviewNote`).
- `shared/lunar/stars.data.ts` (Sát Chủ tháng 7/8 + comment).
- Tests: `ruleActivityMapping.test.ts`, `mansionContentAuthority.test.ts`, `mansionContentRegression.test.ts`, `evidenceConflicts.test.ts`, `MansionEvidenceDetails.test.tsx`, `shared/personalFengShui/rules.test.ts`.
- `docs/audits/thu-tu-sat-chu-provenance.md` (ghi chú update đầu file).

### Nhân chứng in *Ngọc Hạp Chánh Tông* — dữ liệu đã xác nhận (crop độ phân giải gốc)

| Bảng (trang) | Giá trị |
|---|---|
| Ngày Sát-Chủ, Thọ-Mai (128–129) | Tỵ, Tý, Mùi, Mão, Thân, Tuất, **Hợi**, **Sửu**, Ngọ, Dậu, Dần, Thìn (thơ = giải nghĩa) |
| Tháng Sát-Chủ, Lưu-Thị (128) | 1 Tý; 2/3/7/9 Sửu; 4 Tuất; 11 Mùi; 5/6/8/10/12 Thìn (= `SAT_CHU_DUONG`) |
| Giờ Sát-Chủ (129) | 1/7 Dần, 2/8 Tỵ, 3/9 Thân, 4/10 Thìn, 5/11 Dậu, 6/12 Mão |
| Bốn mùa Sát-chủ (130) | 1/5/9 Tý, 2/8/10 Mão, 3/7/11 Ngọ, 4/6/12 Dậu |
| Sát-chủ trong bốn mùa (130) | Xuân Ngọ, Hạ Tý, Thu Mùi, Đông Mão |
| Ngày Thọ-tử (131) | Bính-Tuất, Nhâm-Thìn, Tân-Hợi, Đinh-Tỵ, Mậu-Tý, Bính-Ngọ, Ất-Sửu, Quý-Mùi, Giáp-Dần, Mậu-Thân, Tân-Mão, Tân-Dậu |
| Ngày Sát-Sư (132–133) | Tỵ, Tý, Mùi, Mão, Hợi, Tuất, Ngọ, Thân, Sửu, Dậu, Dần, Thìn |
| Tháng Sát-sư, Lưu-Thị (133) | 1/11 Tý, 2 Sửu, 4 Mão, 3/6/7 Mùi, 9 Ngọ, 5/8/10/12 Dậu |
| Ngày tốt cưới (114) | … Giốc, Chấp, Trương, Bế, Đẩu, Phòng, Lâu, Vĩ, Vị, Cơ, Tất, Bích, Chẩn, Khuê, **Tỉnh (井)** — không phải Tinh (星) |

Sách không nêu tháng nhuận hay tháng âm/tiết; không có bài thơ 28 Tú, không có nội dung mở cửa/dẫn nước. Đã đọc toàn bộ Phần III (tr. 106–135); Phần I–II chỉ mục lục + trang mẫu.

### Validation cuối (local + CI)

- Local sau PR #8: `npm test` 141 files / 2798 tests; typecheck, lint, build; mutation mansion 9/9, annual directions 7/7 KILLED; Playwright desktop 104 passed / 16 skipped.
- CI PR #6, #8, #9: tất cả required jobs SUCCESS; main deploy SUCCESS cho #6 và #8.

### Bài học / lưu ý cho agent sau

- Ngày Tú: xác định bằng `getAlmanac(date).mansion` hoặc HTML production, không suy theo phép trừ ngày (đã đoán sai 2026-10-10 là Tinh; thực tế Liễu).
- Test UI dựa vào ngày cụ thể có thể pass vì lý do khác; ghi rõ lý do trong comment.
- Đọc ảnh scan thu nhỏ dễ nhầm chữ gần giống (Tinh/Tỉnh); dữ liệu đưa vào code hoặc dùng làm lập luận phải đọc trên crop độ phân giải gốc.

------------------------------------------------------------------------

## 32. Trạng thái sau PR #11–#17 (10/10/2026)

| PR | Nội dung | Trạng thái |
|---|---|---|
| #11 | Sửa trang scan 觜/參 (pdfPage 66/65) + quote 角 惟有葬埋不可用 (`GOLDEN_BUG`, content 1.0.1) | MERGED `97cebfc`, deploy thủ công |
| #12 | Audit Trực/thần context, tìm nguồn Hán văn Sát Chủ (không thấy), quyết định không tạo ID xây dựng hẹp | MERGED `9f9e0fc` |
| #13 | Handoff: deploy thủ công + Actions bị khoá | MERGED `da2225e` |
| #14 | 協紀 修倉庫 “又…與…併者” là điều kiện: bỏ Thu/Lục Hợp/Ngũ Phú/Thiên Thương → warehouse; dataset 1.2.1; 220/1095 ngày đổi điểm warehouse; event verdict không đổi | MERGED `51f7100`, deploy thủ công |
| #15 | Trực + 9 thần audited vào diagnostics (`xieji-activity-mapping-v1`, điều kiện tường minh, `Almanac.selectionContext`) | MERGED `71e7558`, deploy thủ công |
| #16 | 卷十 resolution cho 6 hung thần đã khoá, chỉ diagnostics (`classicalResolution`) | MERGED `7dbf24b`, deploy thủ công |
| #17 | Kế hoạch đưa 卷十 vào điểm + handoff | MERGED `767efc8` |

### Decisions

1. Owner: Actions không có ngân sách → bỏ qua; gate chạy local, deploy hosting thủ công khi owner đồng ý (memory `local-gates-manual-deploy`).
2. Owner: không tạo ID cho 5 scope xây dựng hẹp.
3. Owner: 卷十 làm **diagnostics trước**, lát đầu **6 nguồn đã khoá**; đưa vào điểm cần quyết định riêng.
4. 修倉庫 conditional clause = `ENGINE_BUG`; tổ hợp co-presence chưa mã hoá (bảo thủ: không còn điểm cộng vô điều kiện).
5. 卷十一 chỉ có 8 chú thích (7 “X同”, 1 dẫn sang 鋪註條例 卷十): heading lists không có ngoại lệ riêng → `exceptions: []`.

### Thuật toán / data mới

- `getSourceLockedCatHungPresence(monthJian, can, chi)` (catHungStars.ts), `resolveDayRuleGodPresence` (godMapping.ts): điều kiện có mặt tường minh.
- `activityRecommendations`: `godPresence` input; `xiejiEvidence()` gắn `activityMapping` (authority `xiejibianfangshu-vol11`, pending), `conditions`, `exceptions: []` cho Trực và 9 thần audited.
- `Almanac.selectionContext` {MANSION_INDEX, OFFICER_INDEX, MONTH_JIAN_BRANCH, DAY_STEM, DAY_BRANCH, LUNAR_DAY}; `auditedGodIds`, `unknownGodIds` (天德/天德合 tháng có token quẻ).
- `shared/almanac-data/xiejibianfangshu-vol10-yiji.json`: 6 entry 卷十 (avoid, extraAvoid, notAvoid, clauses {months, with, effect, otherwise, list, notAvoid, to, quote}, virtueIgnoredPillars, allAvoidPillars, sourceLines), alias heading.
- `xiejiVol10Resolution.ts`: `splitHeadings`, `resolveVol10(day, activityIds)` → verdict `avoid | not_avoided | no_annotation | not_listed | undetermined`; `via` khi 從X論.
- `evaluateEventDay()`: `conflictAnalysis` trên mọi contribution; `classicalResolution {version: 'xieji-vol10-v1' (v2 sau mục 20), items[{…, productDelta, diverges}]}`.

### File mới

`shared/lunar/xiejiConditionalMigration.test.ts`, `shared/lunar/xiejiDiagnostics.test.ts`, `shared/lunar/xiejiVol10Resolution.ts`, `shared/lunar/xiejiVol10Resolution.test.ts`, `shared/lunar/godPresenceCoverage.test.ts`, `shared/almanac-data/xiejibianfangshu-vol10-yiji.json`, `docs/audits/truc-than-context-audit.md`, `docs/audits/xieji-vol10-resolution.md`, `docs/plans/xieji-vol10-scoring.md`.

### Số liệu

- Local cuối: 145 files / 2813 tests; mutation 9/9 + 7/7; Playwright desktop 104 passed / 16 skipped.
- 卷十 diagnostics 2025–2027 × 11 event: 10.920 items — 2.691 avoid, 738 not_avoided, 637 no_annotation, 2.314 not_listed, 4.540 undetermined; **1.707 lệch điểm sản phẩm**.
- Frozen decision baseline: tái tạo 1095/1095 với catalog trước 1.2.1 (`xiejiConditionalMigration.test.ts`).

------------------------------------------------------------------------

## 33. PR #18 — 卷十 presence, 月表 scan, scoring sau flag (10/10/2026)

[PR #18](https://github.com/nghiepnguyen/calendar-hana/pull/18) merge `ee3fd3f`, deploy hosting thủ công (bundle `index-C57w-Wrc.js`, SHA-1 trùng local). Không đổi điểm/UI: chẩn đoán + code chấm điểm sau flag tắt. Issue tách ra: [#19](https://github.com/nghiepnguyen/calendar-hana/issues/19).

### Nội dung

1. **月厭/月刑/月煞/災煞** (`shared/lunar/xiejiMonthlySha.ts`): Month Jian từ 卷四 (月厭 正月起戌逆行), 卷三/卷六 (月刑 = 歲刑), 卷六 (月煞 正月起丑逆行四季; 災煞 正月起子逆行四仲, theo 曹震圭); khớp Group B v3.1 (144 ô) và mọi câu 值X日 của 卷十. Chép 4 mục 卷十 (月厭: chỉ can-chi rơi đúng ngày 月厭, phần khác ở `notEncoded`).
2. **天赦/天願/月恩/四相** (`shared/lunar/xiejiVirtues.ts`, 卷五): **天願 theo 按 起例** (正月乙亥 二月甲戌 三月乙酉 四月丙申 五月丁未 六月戊午 七月己巳 八月庚辰 九月辛卯 十月壬寅 十一月癸丑 十二月甲子) — 協紀 bác bảng 歴例; bản nháp đầu dùng 歴例, đã sửa sau khi đọc 月表. 天德合 vắng mặt tháng tứ trọng (“四仲之月…無合”).
3. **Scan 月表** (四庫全書, ĐH Chiết Giang, archive.org `06067692.cn` 卷二十一 n73–n132, `06067694.cn` 卷二十四 n6–n65, `06067695.cn` 卷二十七 n70–n129, `06067697.cn` 卷三十 n6–n65; mỗi ngày 1 trang, 甲子→癸亥; cắt/ghép bằng ffmpeg vì máy không có PIL): 240 trang ngày tháng 2/5/8/11 không trang nào ghi 天德; tháng 7 có 天德 ở 癸亥 → 天德 quẻ vắng mặt, `Almanac.unknownGodIds` = [] (chỉ chẩn đoán đọc). Witness 天願/天赦 lưu trong test.
4. Chẩn đoán `classicalResolution` version `xieji-vol10-v2`: **undetermined 4.540 → 0** (2025–2027 × 11 event; 6 mục cũ 5.422 avoid / 798 not_avoided / 833 no_annotation / 3.867 not_listed; lệch sản phẩm 2.575; 4 mục mới 7.320 items, lệch 3.385).
5. **卷十 scoring** (`shared/lunar/xiejiVol10Scoring.ts`, `applyVol10Scoring`; `getActivityRecommendations` input `classicalDay`, override `xiejiVol10Scoring`): bảng owner (avoid giữ/đổi dương thành âm, thêm −25 nếu chuỗi chưa có trừ; not_avoided bỏ trừ; no_annotation bỏ cả hai; not_listed/undetermined giữ); 6 hung thần + deferral; cap theo nguồn; xung đột lấy verdict nghiêm hơn; dòng bị đổi mang `Evidence.classical`. **不註 bỏ hết mọi dòng → activity `neutral`, `event_fit` pass** (owner).
6. Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` 39 ca đóng băng trước code (`a045f3a`); 1 đính chính `GOLDEN_BUG` do agent suy tay (`2e830e9`, jie-yin-finance: 納財 thuộc 止不忌 của 收日 → not_listed).
7. Migration proof `xiejiVol10ScoringMigration.test.ts` (mock manifest bật flag, 1095 ngày): mọi dòng đổi/thêm giải thích bằng đúng một kết luận 卷十; bật flag: 1.639/12.045 event đổi điểm; not_recommended→recommended 244, not_recommended→caution 172, insufficient→not_recommended 126, caution→recommended 112…; ví dụ 2025-01-21 cưới hỏi 65 → 87,5 (刼煞 + 天德/月德 tháng 丑 ngày 除).

### Decisions (owner, 10/10/2026)

1. Bảng verdict → điểm (plan “Owner decisions”); golden + proof làm sau khi undetermined giảm (đã về 0).
2. 不註/不忌 bỏ hết mọi dòng → **trung tính**.
3. Thiên Đức legacy tháng quẻ → **issue #19**, PR riêng, audit toàn bộ 月表, không làm nhiễu migration 卷十.
4. **Chưa bật flag** `xiejiVol10Scoring`.

### Số liệu gate (local)

149 files / 2.886 tests; mutation 9/9 + 7/7; build; Playwright desktop 104 passed / 16 skipped. Chưa chạy `test:emulator`.

### File mới

`shared/lunar/xiejiMonthlySha.ts` (+test), `shared/lunar/xiejiVirtues.ts` (+test), `shared/lunar/xiejiVol10Scoring.ts` (+test), `shared/lunar/xiejiVol10ScoringMigration.test.ts`, `shared/almanac-data/golden-xieji-vol10-scoring.json`, `docs/audits/xieji-monthly-sha-presence.md`, `docs/audits/xieji-vol10-scoring-migration.md`.

------------------------------------------------------------------------

## 34. PR #19–#21 — Thiên Đức legacy tháng quẻ theo 月表 (10/10/2026)

| PR / issue | Nội dung | Trạng thái |
|---|---|---|
| issue #19 | Thiên Đức/Hợp legacy tháng 坤/乾/艮/巽 vs 月表 | CLOSED bởi PR #21 |
| #20 | Handoff sau PR #18 (docs) | MERGED `28ed950` |
| #21 | Bỏ Thiên Đức/Hợp legacy tháng quẻ theo 月表 — **đổi điểm** | MERGED `e64d507`, deploy thủ công, bundle `index-BQ9rTDUx.js` |

### Decisions (owner, 10/10/2026)

1. Thiên Đức tách khỏi PR #18 thành issue/PR riêng, audit 月表, không làm nhiễu migration 卷十.
2. Merge + deploy PR #21 theo hiện trạng, kể cả 31 lượt sự kiện recommended → insufficient_evidence; đổi hiển thị (nếu muốn) làm PR riêng.
3. `xiejiVol10Scoring` vẫn **tắt**.

### Nhân chứng (`shared/almanac-data/golden-yuebiao-tiande.json`, đóng băng trước code, commit `100e43c`)

協紀 月表 卷二十–三十一, 四庫全書 子部 (浙江大學圖書館) trên archive.org; mỗi ngày một trang 甲子→癸亥 (`page/nN_w800.jpg`, trang 甲子 của tháng: n6 hoặc n73 trong mỗi item). Item: `06067692.cn` (卷20–21: 正月 n6, 二月 n73), `06067693.cn` (三月 n6, 四月 n73), `06067694.cn` (五月 n6, 六月 n73), `06067695.cn` (七月 n6, 八月 n70), `06067696.cn` (九月 n6, 十月 n73), `06067697.cn` (十一月 n6, 十二月 n73). Đọc bằng mắt cột 吉神 trên ảnh cắt/ghép (ffmpeg `xstack`, script scratch `tile12.sh`; máy không có PIL).

| Tháng | 天德 | 天德合 | Đã đọc |
|---|---|---|---|
| 正 寅 | 丁 | 壬 | 60 |
| 二 卯 (坤) | không | không | 60 |
| 三 辰 | 壬 | 丁 | 60 |
| 四 巳 | 辛 | 丙 | 60 |
| 五 午 (乾) | không | không | 60 |
| 六 未 | 甲 | 己 | 36 |
| 七 申 | 癸 | 戊 | 12 |
| 八 酉 (艮) | không | không | 60 |
| 九 戌 | 丙 | 辛 | 12 |
| 十 亥 | 乙 | 庚 | 12 |
| 十一 子 (巽) | không | không | 60 |
| 十二 丑 | 庚 | 乙 | 12 |

### Thuật toán / data / schema

- `computeAlmanac` (`shared/lunar/almanac.ts`): Thiên Đức/Thiên Đức Hợp **luôn** thay bằng authority (`getSourceLockedCatHungStarsForDate`), nên tháng quẻ không có. Hành vi cũ giữ sau hằng `KEEP_LEGACY_TRIGRAM_TIAN_DE` (`shared/lunar/tianDeLegacyPolicy.ts`, `false`), chỉ test mock `true`.
- `xiejiConditionalMigration.test.ts`: cả pre lẫn post mock legacy `true` → frozen baseline vẫn 1095/1095, proof 1.2.1 tách biệt.
- Golden schema: `{version, status, source, reading, months[{monthJian, month, item, pages, tianDeStem|null, tianDeHeStem|null, read}]}`.
- Fixture đổi: `almanac.test.ts` (25/9/2026 không còn Thiên Đức), `AlmanacPanel.test.tsx` + `e2e/a11y.spec.ts` + `e2e/user-stories.spec.ts` dùng chip Giải Thần; `xiejiDiagnostics.test.ts` bỏ ngoại lệ legacy.

### Migration (`shared/lunar/tianDeYuebiao.test.ts`, 1095 ngày 2025–2027)

- Mọi ngày khớp nhân chứng (Thiên Đức ⇔ can ngày = can 天德 tháng; tương tự 合).
- Ngoài tháng quẻ: khuyến nghị y hệt.
- Tháng quẻ: 62 ngày mất dòng legacy (34 Thiên Đức, 28 Thiên Đức Hợp); dòng khác y hệt, trừ cát thần khác tăng trong trọng số do cap cát thần (25) được giải phóng (226 dòng).
- Activity: 914 đổi điểm; recommended → no_evidence 156, watch → avoid 87, recommended → neutral 33.
- Event × 11: 284 đổi điểm; recommended → insufficient_evidence 31.

### Gate (local)

150 files / 2.888 tests; mutation 9/9 + 7/7; build; Playwright desktop 104 passed / 16 skipped. Chưa chạy `test:emulator`.

### File mới

`shared/lunar/tianDeLegacyPolicy.ts`, `shared/lunar/tianDeYuebiao.test.ts`, `shared/almanac-data/golden-yuebiao-tiande.json`, `docs/audits/tiande-yuebiao.md`.

### Vấn đề chưa giải quyết (sau PR #21)

1. ~~31 lượt sự kiện hiện “không đủ căn cứ”~~ — RESOLVED bởi PR #23 (trung tính cho sự kiện ≤ high; xem phần 35).
2. ~~Số liệu migration 卷十 đo trước PR #21~~ — đo lại ở PR #24 (phần 35); cần đo lại lần nữa sau #25–#29 trước khi bật flag.
3. Nhân chứng 月表 tháng 6/7/9/10/12 chỉ đọc một phần (36/12/12/12/12 trang).
4. Hai spec e2e đã đổi chip Thiên Đức → Giải Thần chỉ chạy project desktop; mobile/Safari chưa chạy.

------------------------------------------------------------------------

## 35. PR #22–#29 — trung tính, mapping 用事, tách kho, hard warning, 百忌日, 土王用事 (10/10/2026)

| PR | Nội dung | Merge | Đổi production |
|---|---|---|---|
| #22 | Handoff sau PR #21 (docs) | `440dd10` | — |
| #23 | Không gặp ngày kỵ → trung tính cho sự kiện ≤ high | `b293e21` | kết luận sự kiện |
| #24 | Đo lại 卷十 sau #21/#23; review mapping 用事 → activity | `b72500c` | metadata chẩn đoán |
| #25 | Tách warehouse; warehouse_opening mới; business “Mở hàng”; Sửa kho → nhóm construction | `175cb65` | hoạt động/nhãn mới |
| #28 | Cảnh báo cứng lấy trạng thái nghiêm hơn | `50d2597` | trạng thái hoạt động |
| #26 | 百忌日: 甲日 kỵ mở kho xuất hàng, 乙日 kỵ trồng trọt | `9dbd268` | điểm |
| #27 | Audit định nghĩa 土王用事 (docs) | `14c341b` | — |
| #29 | 土王用事: 18 ngày trước Tứ Lập kỵ việc đất | `7515651` | điểm + kết luận Động thổ |

Thứ tự merge thực tế: #28 → #26 (rebase) → #27 → #29 (rebase). Deploy một lần sau #29 (phần 21).

### Decisions (owner, 10/10/2026)

1. **Trung tính (PR #23):** hoạt động chính `no_evidence` (không quy tắc nào, nên cũng không ngày kỵ) → sự kiện severity low/medium/high là **trung tính** (“Cân nhắc”, score 50, ghi “Không gặp ngày kỵ nào.”); `very_high` (cưới hỏi, động thổ, khai trương, mua nhà/đất) vẫn `insufficient_evidence`. Agent thêm (được giữ): ngày trung tính theo policy **không bao giờ** `recommended` (hoạt động phụ chỉ dịch điểm).
2. **Kho:** tách 2 hoạt động — `warehouse` giữ ID, nhãn **Sửa kho** (修倉庫), chuyển nhóm `construction` (Tu tạo); `warehouse_opening` **Mở kho xuất hàng** (開倉庫出貨財), nhóm business. Không đổi ID thành `warehouse_repair` (vỡ frozen baseline/fixtures); không map 修棧櫃 (không có trong 卷十一) hay 開倉 riêng.
3. **business:** nhãn **Mở hàng** (開市), tách khỏi Ký kết/Giao dịch (立券交易).
4. **Hard warning (PR #28):** trạng thái = nghiêm hơn giữa `consider` và trạng thái theo điểm (≤19 strong_avoid, ≤29 avoid). Trường hợp không hard warning mà cộng/trừ đều ≥30 vẫn `consider`.
5. **百忌日:** 甲日 → Mở kho xuất hàng, 乙日 → Trồng trọt; medium (−10) + hard warning, như 丁日 kỵ cắt tóc.
6. **土王用事:** đếm lùi 18 ngày lịch từ ngày Tứ Lập (giờ VN), **loại trừ ngày Lập**; major (−15), **không** hard warning; đúng 6 hoạt động: Xây dựng, Động thổ, Sửa chữa, Sửa kho, Phá dỡ, Trồng trọt.
7. `xiejiVol10Scoring` vẫn **tắt**.

### Thuật toán

- `evaluateEventDay` (`eventEvaluation.ts`): `neutralByPolicy = severity ≤ manifest.policies.noTabooMeansNeutralUpToSeverity && primary.status === 'no_evidence'` (thứ tự `low < medium < high < very_high`); classification `recommended` chỉ khi `score >= 65 && !neutralByPolicy`.
- `getActivityRecommendations` status: `hardWarning && (score > 29 || !hardWarningKeepsWorseScoreStatus)` → `consider`; ngược lại rơi xuống ngưỡng điểm. Đánh giá sự kiện đọc hard warning trực tiếp, không đọc status hoạt động → sự kiện không đổi.
- `xiejiEvidence`: `reviewStatus`/`reviewTerm`/`reviewNote` từ `xieji-activity-mapping-review.json` (chẩn đoán; `conflictAnalysis.reviewPending` false cho mapping đã review).
- `thoVuongDungSu.ts`: `thoVuongDungSuPeriods(year)` lấy 立春/立夏/立秋/立冬 (term index 21/3/9/15) từ `solarTermsForYear`, đổi sang ngày lịch UTC+7, kỳ = [立 − 18, 立 − 1]; `isThoVuongDungSu(date)`. Bốn kỳ luôn nằm trong cùng năm dương lịch.
- `godMapping.ts`: `DayRule.thoVuongDungSu`; `resolveDayRuleGods`/`resolveDayRuleGodPresence` nhận `RuleDay {can, chi, lunarDay, thoVuongDungSu?}`; operand `THO_VUONG_DUNG_SU`. `almanac.ts` tính `ruleDay` một lần, thêm `selectionContext.THO_VUONG_DUNG_SU` (0/1).
- 甲日/乙日 dùng sẵn `rule.dayCan` + override `preserve_bad` (không helper mới, không đặt trong `applyVol10Scoring` vì nguồn là 卷十一/百忌日, không phải verdict 卷十 và flag đang tắt).

### Data / schema

- `manifest.policies`: `lowSeverityNoTabooMeansNeutral` → **`noTabooMeansNeutralUpToSeverity: "high"`**; mới **`hardWarningKeepsWorseScoreStatus: true`**; notes tương ứng.
- `activities.json`: `warehouse` label “Sửa kho”, group `construction`; mới `warehouse_opening` “Mở kho xuất hàng” (group business, sensitivity 0.5); `business` label “Mở hàng”. `activityTaxonomy.ts`: scope `warehouse_opening`.
- `xiejibianfangshu-yiji.json`: entry 開倉庫出貨財 (宜 月恩四相時德滿日五富; 忌 月建月破大耗平日收日閉日劫煞災煞月煞月虛月刑月害月厭大時天吏小耗天賊四耗四廢四窮五虛九空甲日), `activityEntries.warehouse_opening`.
- `truc.json`: warehouse_opening — Mãn +15; Kiến/Bình/Thu/Bế −15; Phá −25 (parity test + quy ước trọng số). `good-gods.json`: 月恩, 四相, 時德, 五富 thêm warehouse_opening; `bad-gods.json`: 11 hung thần thêm warehouse_opening.
- `bad-gods.json` mới: `giap_nhat` {han 甲日, medium, dayCan [0], [warehouse_opening]}, `at_nhat` {han 乙日, medium, dayCan [1], [planting]}, `tho_vuong_dung_su` {han 土王用事後, major, rule {thoVuongDungSu: true}, 6 activity}. `overrides.json`: `giap_day_blocks_warehouse_opening`, `at_day_blocks_planting` (preserve_bad).
- `mansion-patterns.json` (legacy): “mở kho” → `warehouse_opening`; “nhập kho” giữ `warehouse`.
- `xieji-activity-mapping-review.json` (mới): `{version, reviewedAt, reviewer, source, note, activities{id: {status reviewed|pending, term, note}}}` — 29/29 reviewed.
- Golden mới (đóng băng trước code, có trường `corrections[{kind: POLICY_CHANGE|DATA_CHANGE, cases, note}]` khi policy/data sau đổi tiền đề):
  - `golden-hard-warning-status.json` (`f8ba8a4`): 21 ca; 1 DATA_CHANGE (2025-01-26 groundbreaking/construction điểm 50 → 35 do 土王, status vẫn consider).
  - `golden-baiji-giap-at.json` (`f29a4d0`, can ngày tính từ 2000-01-07 = 甲子): 49 ca; 1 POLICY_CHANGE (2 ca điểm 25 consider → avoid do #28).
  - `golden-tu-vuong-dung-su.json` (`02302bb`): 12 kỳ, 48 ca biên; ngày Tứ Lập từ bảng HKO (T2025c/T2026c/T2027c, HKT; SHA-1 d88bbdc4c183 / bae773653a0b / e4fb75dfe89e).

### Nguồn đã khoá (Wikisource raw, SHA-1 prefix)

卷一 `66c18401b9f4` (「土於四立之前各旺一十八日」), 卷十 `355dc6c8fe2d` (百忌日 「甲日忌開倉庫出貨財乙日忌栽種丁日忌剃頭…」; 鋪註條例 「…如遇專忌之日則仍註忌」; 土王用事 忌 list 「義同土府」), 卷十一 `ce4ed7f23ff9` (heading hợp nhất + chú 「X同」; 開倉庫出貨財; 土王用事後 dưới 15 heading), 卷五 `1d4000974e32`, 卷六 `a9ab67896fc9`, 卷二十二 `3517ed0b55bb`, 卷三十五 `cfc090a9feca`. Volumes 1–9 tên trang `卷01`…`卷09`.

### Số liệu (1095 ngày 2025–2027)

- #23: 1.674 event `insufficient_evidence → caution` (high 1.462: mua xe 337, ký hợp đồng 337, bàn giao nhà 337, chuyển nhà 261, nhận xe 190; medium 212 xuất hành).
- #24 (卷十 flag on): rows y như PR #18; event 1.662 đổi điểm (trước 1.639); insufficient → not_recommended 49 (trước 126); rows theo activity, ví dụ warehouse 137, business 182, warehouse_opening 171 (sau #25).
- #25: warehouse_opening — recommended 83, watch 383, neutral 81, avoid 163, strong_avoid 21, no_evidence 364; hoạt động cũ + sự kiện không đổi.
- #28: consider → avoid 360, consider → strong_avoid 79 (月破 trên 6 hoạt động; 丁日 trên cắt tóc); điểm + 11 sự kiện không đổi.
- #26: 110 ngày Giáp (warehouse_opening), 109 ngày Ất (planting); không sự kiện nào đổi.
- #29: 216 ngày trong kỳ; chỉ 6 hoạt động đổi; event Động thổ recommended → not_recommended 63, insufficient → not_recommended 40.
- Gate local cuối: 155 files / 2.903 tests; mutation 7/7 + 9/9; build; Playwright desktop 104 passed / 16 skipped. Chưa chạy `test:emulator`, mobile/Safari.

### Frozen baseline 1.2.1 (`xiejiConditionalMigration.test.ts`)

Hai phía đều ghim trạng thái trước các thay đổi sau: Thiên Đức legacy (`KEEP_LEGACY_TRIGRAM_TIAN_DE`), manifest (`noTabooMeansNeutralUpToSeverity: 'low'`, `hardWarningKeepsWorseScoreStatus: false`), bad-gods không có `giap_nhat`/`at_nhat`/`tho_vuong_dung_su`, overrides không có 2 override 百忌日; `ADDED_ACTIVITIES` gồm door_opening, waterworks, warehouse_opening. Vẫn 1095/1095. **Mỗi thay đổi đổi điểm/trạng thái sau này phải ghim thêm ở đây.**

### Smoke production bằng browser

Khu “Mục tiêu và kết luận trong ngày” chỉ hiện khi có ngày sinh: smoke Playwright tạm (config riêng `testDir: '.'`) với `addInitScript` đặt `hana:welcome-seen`/`hana:swipe-hint-seen`, lưu ngày sinh giả ở `/settings#birth-info` (chỉ trong browser context tạm), rồi mở `/day/<date>`; xoá file tạm sau khi chạy.

### File mới

`shared/lunar/neutralNoTabooMigration.test.ts`, `shared/lunar/xiejiActivityMappingReview.test.ts`, `shared/almanac-data/xieji-activity-mapping-review.json`, `docs/audits/xieji-activity-mapping-review.md`, `shared/lunar/hardWarningStatus.test.ts`, `shared/almanac-data/golden-hard-warning-status.json`, `shared/lunar/baijiGiapAt.test.ts`, `shared/almanac-data/golden-baiji-giap-at.json`, `docs/audits/baiji-giap-at.md`, `shared/lunar/thoVuongDungSu.ts` (+test), `shared/almanac-data/golden-tu-vuong-dung-su.json`, `docs/audits/tu-vuong-dung-su.md`. Sửa doc: `docs/verification/mapping-scoring.md`, `docs/verification/activity-taxonomy.md`, `docs/audits/xieji-vol10-scoring-migration.md` (mục Re-measure).

### Vấn đề chưa giải quyết (sau PR #29)

1. `xiejiVol10Scoring` tắt; số đo #24 trước #25–#29 → đo lại trước khi bật.
2. “Khai trương” và “Mở hàng” gần trùng (cùng 開市).
3. 土王用事: các điểm SOURCE_DEPENDENT (phần Next steps mục 4); chứng phụ đếm ngày (承政院日記) tính bằng ephemeris gần đúng, độ tin cậy trung bình.
4. 卷十 鋪註條例 dòng 492 (德/月恩/四相/時德 không chú kỵ 開倉庫出貨財 trừ ngày 德猶忌) chưa mã hoá; 百忌日 được xem là 專忌 nên áp vô điều kiện.
5. Smoke chưa kiểm nhãn “Kỵ mạnh” trên từng mục (bấm mở chi tiết Ăn hỏi bị timeout); chỉ xác nhận các mục nằm trong “Không nên làm”.
6. Mobile/Safari, `test:emulator` chưa chạy cho các PR này.



## 36. 卷十 release readiness sau PR #29 — snapshot trước activation

Base `43d6303` (PR #30), 10/10/2026. Đo lại 1095 ngày × 32 activity × 11 event, chỉ khác flag mocked: **1662 event đổi điểm, 652 đổi kết luận**. not_recommended → recommended **231** (trước 244); → caution **157** (trước 172); recommended → not_recommended 7. 3968 activity đổi điểm; changed rows no_annotation 1622, not_avoided 1482, avoid 181; added 1205.

Proof tăng cường: không mất contribution key; unrelated rows (gồm 百忌日/土王用事) giữ nguyên; hard warning giữ bit và mức trạng thái; 0 undetermined. Mapping 29/29. Report bền vững: `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-post-pr29.tsv`, `xieji-vol10-post-pr29-samples.json` (observed outputs, không phải Golden độc lập).

**Flag vẫn false.** Next step là owner review các transition và quyết bật; activation cần commit riêng, ghim OFF trong các migration lịch sử, gate trên build đã bật, rồi merge/deploy khi được phép. Không coi số event đổi điểm bằng cũ là kết luận giống cũ.

Gate readiness: typecheck/lint, 155 files / 2903 tests; mutation tuần tự 7/7 + 9/9; build; E2E desktop 104/16 skip, mobile Pixel 7 119/1 skip, Safari desktop WebKit 88/32 skip (tổng 311 pass / 49 skip). Chưa chạy iPhone/Firefox/emulator. Toàn bộ build/E2E dùng flag OFF; migration test mock ON.


## 37. 卷十 activation candidate — snapshot trước merge/deploy

Nhánh `codex/enable-xieji-vol10-scoring`, stacked trên PR #31 (còn OPEN). Local manifest bật `xiejiVol10Scoring: true`; production vẫn OFF. Không đổi product rule/weight/Golden khác; mansion scoring vẫn false.

Migration proof ghim cả ON/OFF; 5 test migration/Golden lịch sử ghim OFF. Diagnostics phân biệt dòng phạt `xieji10:` với mapping 卷十一. Integration ON kiểm 21 transition witnesses + 月破 2025-03-17 / 月厭 2025-12-09; mới E2E chọn Cưới hỏi qua UI cho hai ngày này và 2025-01-21 (mục Cưới hỏi không có ô giờ).

Gate: typecheck/lint; 156 files / 2927 tests pass; mutation tuần tự 7/7 + 9/9. Build/device E2E ON ghi tại `docs/audits/xieji-vol10-activation.md`. Next: review release candidate, merge readiness #31 trước, retarget activation vào main; merge/deploy khi owner cho phép. Chưa production smoke.

Gate ON hoàn tất: build/E2E hiện có 311 pass / 49 skip; 9 smoke mới pass sau khi sửa thao tác test (không sửa product). Tổng 320 pass / 49 skip. Counters ON/OFF trùng PR #31.


## 38. 卷十 ON — MERGED & DEPLOYED, 10/10/2026

Owner cho phép chuỗi merge #31 → retarget #32/main → merge #32 → deploy/smoke.

- #31 merge `90fcf02d9f7d6ce2122c18d78af6772cf2e61b6e`.
- #32 retarget main, merge `4e92cb68de23a62910482668fece4d10ba836cd5`.
- Checkout main fast-forward; product tree trùng `3aa1451` đã gate ON. Build lại main thành công; chỉ deploy Hosting project `calendar-hana`, không deploy Functions/Firestore.
- Production flag ON; bundle và thời điểm ở header Release mới nhất. Cả HTML production lẫn JS bundle được verify với local; bundle trùng byte-for-byte.
- Smoke domain `https://lich.thanhnghiep.top`, 3 ngày × 3 browser = 9 pass; dùng chính `e2e/xieji-vol10-activation.spec.ts` qua config tạm không webServer. Config tạm đã xoá. Screenshots ở `/tmp/xieji-vol10-production-smoke` là scratch, không durable dependency.
- Local gates ON được kế thừa từ product tree giống hệt: 2927 tests; typecheck/lint; mutation 7/7 + 9/9; E2E 320 pass/49 skip. Không gọi CI green; không chạy iPhone/Firefox/emulator.
- Rollback: flip flag false, rebuild/redeploy; không sửa independent Golden. Phạm vi authority còn pending giữ nguyên.

Docs release evidence: `docs/audits/xieji-vol10-activation.md`. Roadmap tiếp: Khai trương/Mở hàng trùng heading; 百忌日 khớp activity còn lại; dormant/legacy gods audit; quy tắc chung 卷十; nguồn offline Sát Chủ.


------------------------------------------------------------------------

## 39. Handoff tổng hợp — PR #31/#32, 卷十 scoring ON (10/10/2026)

**Đây là trạng thái mới nhất của work trong chat này.** Các phần 36/37 lưu snapshot trước release. Không tiếp tục task “bật flag” hoặc coi production vẫn OFF.

### A. Trạng thái, branch và release

| Hạng mục | Trạng thái / bằng chứng |
|---|---|
| Readiness PR #31 | MERGED, merge `90fcf02d9f7d6ce2122c18d78af6772cf2e61b6e`; head `53c80e89d49fff0bcda1d576bf42edbb5afb0de2` |
| Activation PR #32 | Retarget từ nhánh #31 sang `main`, MERGED; merge `4e92cb68de23a62910482668fece4d10ba836cd5`, head `3aa1451adaa3ae744c0eff6d74ed5a6fa2b80756` |
| Production | Hosting project `calendar-hana`, domain `https://lich.thanhnghiep.top`; **`xiejiVol10Scoring: true`** |
| Release time | Deploy hoàn tất; production HTML `Last-Modified` **2026-10-10 09:18:51 UTC = 16:18:51 VN** |
| Bundle | `/assets/index-Camk5ToH.js`; SHA-256 `5430ed0db4c83ad83ef9ee54948582766f59e8a3397b7d6ff8ccf7eb5e9fb190`; remote bytes trùng local build; có `xiejiVol10Scoring:!0` |
| Handoff PR #33 | Docs-only, `codex/vol10-release-handoff`; **MERGED** `6bac1d4` (xem phần 40). |

Main được fast-forward rồi build lại trước deploy; product tree của merge `4e92cb6` trùng activation head `3aa1451` đã kiểm chứng. Chỉ chạy `firebase deploy --only hosting --project calendar-hana`; không deploy Functions/Firestore. Không gọi gate local là CI green. GitHub Actions billing bị khoá theo trạng thái đã ghi trước đó; release không phụ thuộc Actions.

### B. Decisions đã chốt và phạm vi

1. Owner cho phép rõ chuỗi **merge #31 → retarget #32/main → merge #32 → deploy → smoke production**; đã hoàn tất.
2. Bật scorer 卷十 đã có, giới hạn sáu chain: 月建, 月破, 平日, 收日, 閉日, 刼煞 và verdict sau deferral. Không bổ sung rule/weight/authority mới trong activation.
3. Giữ bảng verdict → điểm đã chốt trước đó; **不註/不忌 bỏ mọi dòng đang áp → activity trung tính**, không tự biến thiếu căn cứ thành ngày tốt.
4. Giữ **hard warning không làm nhẹ trạng thái xấu**; contribution 百忌日 甲日/乙日 và 土王用事 không đổi bởi scorer.
5. Giữ **mansion scoring OFF** (`mansion28ScoringEnabled: false`, informational/scoreDelta=0); không reopen astronomy/calendar authority; không gộp calendar/personal layer.
6. Giữ mọi independent Golden. Samples migration là **observed integration witnesses**, không phải Golden độc lập hay thẩm định chuyên gia thứ hai.
7. Chưa duyệt scope mới cho gộp Khai trương/Mở hàng, 百忌日 còn lại, dormant/legacy gods hoặc general balancing. Chỉ đề xuất next steps; không tự ship các mục này.

### C. Thuật toán và contract runtime

Pipeline runtime giữ nguyên kiến trúc:

```text
computeAlmanac → classicalDay + activity contributions
→ getActivityRecommendations
→ applyVol10Scoring (manifest flag ON)
→ cap/status hoạt động
→ evaluateEventDay (criteria + score/classification + diagnostics)
→ daily UI/evidence
```

`applyVol10Scoring(rows, items, {activityId, scope, badGodCap})` chỉ tác động contribution thuộc scored 凶 chain và các source của deciding entry sau 從X論:

| Verdict | Hành vi |
|---|---|
| `avoid` | Giữ delta âm; đổi delta dương thành âm cùng độ lớn. Nếu chain chưa có dòng âm, thêm một dòng `xieji10:<entry>:<activity>` −25. Không tạo hard warning mới. |
| `not_avoided` | Delta âm → 0, status `informational`; giữ dòng dương. |
| `no_annotation` | Delta khác 0 → 0, status `informational`. |
| `not_listed` / `undetermined` | Giữ nguyên. Migration 2025–2027 không có event item `undetermined`; không suy phép chấm điểm từ UNKNOWN. |

Các chain dùng chung dòng lấy verdict nghiêm hơn. Added penalty có source `truc` nếu chain có Trực; nếu chỉ god thì `bad_god` nằm trong cap hung thần. Trực không dùng god cap. Dòng touched có `classical {version, entry, verdict, via?, quote}`; phiên bản scoring **`xieji-vol10-scoring-v1`**, khác resolver diagnostics **`xieji-vol10-v2`**. `rawDelta` giữ product weight; explanation mang nguồn 卷十.

Nếu 不註/不忌 làm mọi applied row được bỏ tính, activity là `neutral`, score nền 50; event criterion `event_fit` pass với lý do 不註宜忌. Policy hiện hành giữ `noTabooMeansNeutralUpToSeverity: "high"`; `very_high` vẫn cần căn cứ. Hard-warning activity lấy trạng thái nghiêm hơn: score ≤19 `strong_avoid`, ≤29 `avoid`, còn lại ít nhất `consider`. Production event evaluation cũng đọc hard-warning contribution trực tiếp.

`evaluateEventDay` dùng `isVol10ChainRow` cho `productDelta`, gồm cả added `xieji10:` rows. Các entries 月厭/月刑/月煞/災煞 không được thêm row độc lập chỉ vì có presence; chúng tác động qua deciding verdict/deferral của scored chain. Astronomy/Jie/day operand và authority data không đổi.

### D. Data/schema và proof

- Product mutation duy nhất của PR #32: `shared/almanac-data/manifest.json`, `policies.xiejiVol10Scoring: false → true`. `datasetVersion` vẫn **1.2.1**, schemaVersion **1.1.0**. Không đổi catalog, trọng số, activity ID hoặc independent fixtures.
- Catalog hiện tại: 32 activities, 11 event profiles; 用事 mapping 29/29 reviewed (single agent reviewer).
- Golden scorer: `shared/almanac-data/golden-xieji-vol10-scoring.json`, 39 ca, giữ nguyên; correction `GOLDEN_BUG` lịch sử vẫn được ghi trong audit.
- Report TSV: mỗi dòng `count<TAB>metric`; xuất qua `REPORT_FILE`. Samples JSON: map từ `"<event> <before> → <after>"` sang `{date, event, before:{score,classification}, after:{score,classification}, items:[...]}`; giữ witness đầu tiên theo thứ tự ngày cho 21 transition theo loại event. Không phải exhaustive danh sách mọi event đổi.
- `xiejiVol10ScoringMigration.test.ts` load **ON và OFF bằng mock manifest tường minh**, không dựa vào production default. Hai phía dùng cùng catalog/policy mới; so sánh 1095 ngày 2025–2027, 32 activity, 11 event tại hour 9.
- Assertion: không mất original contribution key; mọi row đổi/thêm có acted verdict của scored chain; unrelated row giữ nguyên toàn bộ; hardWarning bit giữ nguyên; applied hard warning giữ mức trạng thái; 0 undetermined event items. Historical baseline 1.2.1 là proof riêng, không thay bằng output mới.
- Năm test migration/Golden lịch sử ghim 卷十 OFF cả hai phía: 修倉庫, Thiên Đức 月表, hard-warning status, 甲日/乙日, 土王用事. Chúng kiểm migration ban đầu; test runtime khác dùng manifest ON. Không sửa Golden để chạy theo điểm mới.
- Diagnostics test phân biệt added `xieji10:` penalty (nguồn quote/verdict/version 卷十, không có mapping 卷十一) với original audited Trực/god rows; vẫn kiểm các original operand/mapping.

### E. Số đo cuối và các transition cần nhớ

Counters ON/OFF sau activation khớp báo cáo readiness PR #31 (chỉ khác newline cuối khi ghi file). Tổng không đổi sau chuyển production default vì OFF đã được mock tường minh.

| Metric | Sau #25–#29 |
|---|---:|
| Dates / activity / event | 1095 / 32 / 11 |
| Activity scores đổi | 3968 |
| Event scores đổi | 1662 / 12045 |
| Event classifications đổi | 652 |
| Changed `no_annotation` rows | 1622 |
| Changed `not_avoided` rows | 1482 |
| Changed `avoid` rows | 181 |
| Added penalty rows | 1205 |
| Tagged unchanged rows | 8043 |

Event classification: `not_recommended → recommended` 231; `not_recommended → caution` 157; `caution → recommended` 112; `caution → not_recommended` 77; `insufficient_evidence → not_recommended` 49; `recommended → caution` 19; `recommended → not_recommended` 7. Không event nào chuyển vào `insufficient_evidence`.

Rows đổi/thêm: warehouse 137, warehouse_opening 171, business 182. So với lần đo sau #21/#23, event score changed vẫn 1662 nhưng **classification không còn giống**: 244→231 ca not_recommended→recommended, 172→157 ca →caution. Không dùng tổng đổi điểm bằng nhau để suy conclusion không đổi.

Ca tiêu biểu (hour 9): 2025-01-21 wedding 65/not_recommended → 87.5/recommended; 2025-02-11 groundbreaking 27.5/not_recommended → 72.5/recommended; 2025-02-13 buy_property null/insufficient_evidence → 12.5/not_recommended; 2025-03-11 move_house 65/recommended → 32.5/not_recommended; 2025-11-14 open_business 68/recommended → 23/not_recommended.

### F. File đã tạo và file sửa trong chat

**Mới, tracked/durable:**

- `docs/audits/xieji-vol10-post-pr29.tsv` — toàn bộ counters readiness.
- `docs/audits/xieji-vol10-post-pr29-samples.json` — 21 observed transition witnesses.
- `docs/audits/xieji-vol10-activation.md` — scope activation, isolation, gates, release và rollback evidence.
- `shared/lunar/xiejiVol10Activation.test.ts` — real-manifest ON assertions, 21 samples, 月破/月厭 smoke contexts, mansion scoring OFF.
- `e2e/xieji-vol10-activation.spec.ts` — rendered production-path smoke cho 3 ngày; dùng fixture browser tạm.

**Sửa:** `PROJECT_CONTEXT.md`, `docs/audits/xieji-vol10-scoring-migration.md`, `shared/almanac-data/manifest.json`, `shared/lunar/xiejiVol10ScoringMigration.test.ts`, `shared/lunar/xiejiDiagnostics.test.ts`, `shared/lunar/xiejiConditionalMigration.test.ts`, `shared/lunar/tianDeYuebiao.test.ts`, `shared/lunar/hardWarningStatus.test.ts`, `shared/lunar/baijiGiapAt.test.ts`, `shared/lunar/thoVuongDungSu.test.ts`.

Config `.tmp-vol10-production.config.ts` và probe `xiejiSmokeProbe.test.ts` chỉ dùng scratch, **đã xoá**. Screenshots/logs/report dưới `/tmp` hoặc `test-results/` không phải dependency bền vững. `.gitignore` và generated `graphify-out/` changes của user được giữ nguyên, không stage/commit. Graph đã chạy AST-only update sau code edits; không rebuild semantic docs hoặc commit generated churn.

### G. Validation và smoke production

- Readiness OFF: 155 files / 2903 tests; E2E 311 pass/49 skip.
- Activation ON: **156 files / 2927 tests**, typecheck/lint/build pass. Sau format cuối, nearest tests diagnostics+activation 27/27 pass.
- Mutation chạy **tuần tự**, trước build/E2E: annual 7/7 + mansion 9/9 killed; source được restore. Readiness có một E2E run trùng mutation/build, đã bỏ kết quả và chạy lại clean.
- Local ON E2E existing: desktop 104 pass/16 skip; mobile Pixel 7 119/1; desktop Safari WebKit 88/32. Chín smoke mới rerun pass sau khi sửa **test navigation**: Cưới hỏi không có ô “Giờ dự kiến”, và có ngày nằm trong details thu gọn. Không sửa product để chữa smoke. Tổng **320 pass/49 skip**.
- Production: **9/9 pass**, ba ngày × ba browser, dùng chính smoke spec qua baseURL production, không local webServer. Profile sinh giả lưu trong browser context local tạm, không đăng nhập hay ghi record vào tài khoản user.
- UI: 2025-01-21 Cưới hỏi **Thuận lợi**; 2025-03-17 (Month Jian 卯, 月破) **Không thuận lợi**; 2025-12-09 (Month Jian 子, 月厭/deferral) **Không thuận lợi**. UI smoke theo default event context (không nhập hour); integration/migration dùng hour 9 theo proof contract.
- Chưa chạy iPhone/Firefox/emulator cho release này. Safari đã chạy là **desktop WebKit**, không phải chứng nhận iPhone thật. Không claim coverage cho các device/gate chưa chạy.

### H. Vấn đề chưa giải quyết

1. **Khai trương (`opening`) và Mở hàng (`business`)** cùng 開市, khác trọng số Trực; chưa quyết gộp/ẩn, chưa đổi ID/label mới.
2. **百忌日 còn lại** cho activity đã có: 巳日 出行, 寅日 祭祀, 亥日 嫁娶, 酉日 宴會, 申日 安牀, 未日 求醫療病; các heading khác chưa có activity không được tự map. Cần owner scope/điểm, Golden trước code. Giữ chú 巳日 không 宜 出師遣使 và 酉日 không 宜 慶賜賞賀 trong audit interpretation.
3. **21/44 thần không có presence** và **14 thần legacy tháng âm**: số inventory audit cũ, không hiểu là toàn catalog hiện tại 47 thần đã source-lock. Cần audit riêng bằng 月表; không đổi blanket sang Month Jian.
4. **General 卷十 balancing** (“凡吉足勝凶…”, “凡吉凶相抵…”) và phần 宜 theo thần chưa mã hoá. Activation chỉ six-chain subset.
5. **Warehouse:** 修倉庫 điều kiện co-presence chưa mã hoá; 卷十 鋪註條例 ngoại lệ 開倉庫出貨財 với 德/月恩/四相/時德 chưa mã hoá. 百忌日 vẫn áp theo 專忌 đã chọn. Không suy việc bật scorer đã giải quyết các ngoại lệ này.
6. **土王用事 SOURCE_DEPENDENT:** đếm ngày/thời khắc, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không; 補垣/開渠穿井 chưa có mapping activity; waterworks chưa được chứng minh tương đương.
7. **Sát Chủ:** vẫn SOURCE_DEPENDENT, cần nguồn offline tiền hiện đại; month basis/lunar leap semantics chưa chứng nhận. Không suy từ Thụ Tử hay chuyển Month Jian.
8. **Interpretation review:** mansion 115/115 và 用事 29/29 là single reviewer (agent), chưa có chuyên gia thứ hai; other editions/scopes không được chứng nhận. Five narrow construction scopes giữ unmapped theo owner. Mansion scoring tiếp tục OFF.
9. **Coverage/docs:** iPhone/Firefox/emulator chưa chạy; 月表 tháng 6/7/9/10/12 có scan mới đọc một phần; audit headers cũ ở các Phase trước vẫn có thể là snapshot trước release. Dùng header latest/section39 để xác định production.
10. ~~Handoff PR #33 chưa merge~~ — đã merge (phần 40). Docs commit không phải product release; CI vẫn redeploy khi merge main nhưng bundle không đổi.

### I. Next steps và rollback

1. ~~Hoàn tất PR #33 handoff~~ — xong (phần 40).
2. Đề xuất scope nhỏ nhất cho duplicate 開市: xác định khác biệt `opening`/`business`, consumer/event references và chọn gộp/ẩn; cần owner quyết định vì thay đổi UX/taxonomy.
3. Sau đó xử lý sáu 百忌日 đã có activity: source/interpretation → independent Golden đóng băng → dayChi/preserve_bad → migration diff → gate → PR; không nhập thêm unmapped activity chỉ để đủ bảng.
4. Audit dormant/legacy gods theo từng authority, sau đó general balancing/宜; tách provenance/presence thay đổi khỏi release chấm điểm khác để có diff review rõ.
5. Tiếp tục nguồn offline Sát Chủ và unresolved 土王用事 theo scope riêng. Không reopen astronomy, không bật mansion scoring chỉ vì 卷十 đã ON.

Rollback nếu cần: change `xiejiVol10Scoring` về false trên nhánh riêng, rebuild và deploy Hosting; kiểm bundle OFF và smoke so readiness path. Không sửa independent Golden. Hai activation assertions về default ON và UI smoke expectations phải được review theo rollback contract; ON/OFF migration vẫn hữu ích. Không deploy binary cũ mơ hồ hoặc rollback toàn authority không liên quan.

Starter prompt cho chat mới:

> Đọc PROJECT_CONTEXT.md header latest, phần 2/24/39. PR #31 readiness và #32 activation đã merge/deploy; main release 4e92cb6, production 卷十 flag ON, bundle index-Camk5ToH.js trùng local. Local ON 2927 tests + E2E320/49skip; production smoke9/9 desktop/mobile/Safari. PR #33 docs handoff còn chờ merge. Giữ mansion scoring OFF, Golden độc lập, core astronomy/Jie và calendar/personal separation. Next scope: Khai trương/Mở hàng trùng 開市, sáu 百忌日 đã có activity, hoặc audit dormant/legacy gods; chưa scope mới nào được duyệt.


------------------------------------------------------------------------

## 40. Sau PR #33–#35 — repo public, CI hoạt động lại (10/10/2026)

**Trạng thái mới nhất.** Product không đổi so với phần 39; chỉ docs, repo hygiene và CI.

| PR | Nội dung | Merge |
|---|---|---|
| #33 | Handoff 卷十 release (docs) | `6bac1d4` |
| #34 | Chuẩn bị public: MIT `LICENSE`; 74 tài liệu root → `docs/` (astronomy, group-b, rules, integrity, audits, design, templates) + `docs/README.md`, `docs/legacy-paths.json`; `groupB.test.ts` và `scripts/mutate-group-b.mjs` resolve qua map; bỏ `example.spec.ts`; ngừng track `graphify-out/`, `graft/`. Audit pre-public: không có secret trong HEAD/302 commit; Firestore rules scope theo user; deploy secret chỉ từ push/dispatch `main`. | `f7bda2f` |
| #35 | Timeout 60s cho `erfa.test.ts` (1-ulp libm) và `thuTuRegression.test.ts` (chậm trên runner CI) | `77861fe` |

### CI và deploy

- Repo public → GitHub Actions chạy lại. Run main của #34 fail sau 4s (không chạy job nào); run PR #35 và run main `38045575170` (merge #35) **xanh toàn bộ**: Prepare dependencies, Typecheck and lint, Unit and emulator tests, Playwright desktop 1/2 + 2/2, **Deploy to Firebase**.
- Production HTML `Last-Modified` **10:47:09 UTC (17:47:09 VN)**; bundle vẫn `/assets/index-Camk5ToH.js`, SHA-256 `5430ed0d…b190` trùng release phần 39 → product, flag `xiejiVol10Scoring: true` và mansion scoring OFF giữ nguyên.
- Deploy CI gồm **firestore, hosting, functions** (`--force`). Merge main = deploy production; luôn hỏi owner trước khi merge.
- Từ nay quy trình: branch → gate local → PR → CI xanh → **owner cho phép merge** → CI deploy → smoke production. Có thể gọi “CI green” khi Actions xác nhận. Mobile Safari/iPhone/Firefox vẫn không thuộc gate bắt buộc.

### Next (không đổi thứ tự phần 39-I, chưa scope nào được duyệt)

1. 開市 trùng: `opening` (Khai trương) và `business` (Mở hàng) chỉ khác Trực 成 (+20/+15), 開 (+25/+20), 閉 (−25/−15); bad-gods liệt kê cả hai giống nhau. Event `open_business` dùng `opening` ×1 **và** `business` ×0.5 → cùng bằng chứng 開市 bị tính hai lần. Lựa chọn đề xuất: (a) bỏ `business` khỏi `open_business` (nhỏ nhất); (b) ẩn `business`, giữ ID; (c) gộp hẳn, chọn một bộ trọng số. Owner quyết; migration diff trước merge.
2. Sáu 百忌日 đã có activity; 3. audit thần vắng mặt/legacy tháng âm; 4. cân bằng chung 卷十 và 宜; 5. Sát Chủ / 土王用事 cần nguồn.

Starter prompt cho chat mới:

> Đọc PROJECT_CONTEXT.md header, phần 2/24/39/40. Main `77861fe` (PR #6–#35), repo public, CI xanh và tự deploy khi merge main (hỏi trước khi merge). Production 卷十 ON, bundle `index-Camk5ToH.js`, mansion scoring OFF. Next scope: 開市 trùng (`opening`/`business` đếm đôi trong `open_business`), sáu 百忌日, hoặc audit dormant/legacy gods; chưa scope nào được duyệt.

## 41. Header PROJECT_CONTEXT đến roadmap 8–9 (thay ngày 2026-10-18 khi deploy `9865eee`)

Bản nguyên văn header cũ, giữ để tra cứu chuỗi deploy 2026-10-13 → 2026-10-18. Trạng thái "chưa PR/merge" của roadmap 8 và "chưa push/PR" của roadmap 9 trong đó đã hết hiệu lực: PR #69 merge `7d7596f`, roadmap 9 deploy `9865eee`.

> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-18 (giờ VN). **Roadmap 9 (migration diff 4 cấu hình + rollback flag) XONG trên nhánh `claude/p4-migration-diff` (đặt trên `claude/p4-adapter`), chưa push/PR: 0 `UNEXPECTED_REGRESSION` theo 12 bất biến khóa trước dữ liệu, full đổi 14.894 dòng activity / 5.009 classification event, rollback flag OFF + provider = baseline v1 byte-equal, mutation 14/14 ([báo cáo](docs/audits/p4-migration-diff.md)). Chờ owner go-live review trước roadmap 10.** **Roadmap 8 (adapter điểm sau flag `xiejiVol10BalancingEnabled` = OFF) XONG trên nhánh `claude/p4-adapter`, chưa PR/merge: flag `false`, baseline flag OFF byte-equal, Golden điểm v1 trước code, mutation 21/21 ([báo cáo](docs/audits/p4-score-adapter.md)). Tiếp theo là 9.** **Roadmap 7 (Full Golden P4) XONG: Golden v2 `c574e57` owner nghiệm thu 2026-10-17, đã vào main qua PR #66 (`82b3eb4`). CI tối giản qua PR #67 (`740a9bb`): pre-push `ci:local` = lint + typecheck + unit (~3 phút); `ci:full` và `ci:p4` chạy tay. Mục tiếp theo là 7b (engine audit-only cài luật owner, kiểm bằng Golden v2), rồi mới tới 8.** Main HEAD `da73e90` gồm thêm PR #64 (docs) và PR #65 (`72e0f49`, footer pháp lý Day view); deploy/bundle của #65 chưa kiểm trong file này. Trước đó: main deploy `3980183` = [PR #63](https://github.com/nghiepnguyen/calendar-hana/pull/63) (R5: build e2e dùng Firebase giả, visual snapshot qua không cần `.env.local`; chỉ đổi `playwright.config.ts` + docs, [deploy 39003051538](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39003051538) SUCCESS, bundle `index-CBpvqC51.js` khác chỉ do `build`/`builtAt`) sau PR #62 `c9a1ecc` (docs). Trước đó main deploy `e427e2b` = PR #61 (F1 puzhu:06, audit-only; [deploy 39000168607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000168607) SUCCESS) sau `ac2835e` (CI chuyển về máy: `npm run ci:local` qua hook pre-push, GitHub chỉ còn `deploy.yml`) và PR #60 `22dd72f` (P5 warehouse, audit-only; [deploy 38995034163](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38995034163) SUCCESS). Bundle production `index-g13VWl-j.js` trùng build local cùng SHA sau khi thay `builtAt` + hash chunk; chỉ khác cấu hình Firebase web public mà deploy inject lúc build. Không đổi điểm/almanac. Trước đó, 2026-10-16: main deploy `03fb35d` (CI path-gate P4) sau PR #57 (PWA build version + update detection) và PR #58 (version = ngày build `YY.MM.DD` giờ VN); bundle production mới `index-BC34-C-T.js` SHA-256 `4903beff…`, khớp build local cùng SHA (chỉ khác `builtAt`); không đổi điểm/almanac. Trước đó: P4-C MERGED & DEPLOYED PR #55 (`9afd39f`), CI main gồm 4 shard mutation P4-C SUCCESS, bundle production `index-CeLinrvj.js` không đổi. Trước đó: P4-B đã nghiệm thu audit-only, PR #54 đã merge `1ad9b4b` và deploy SUCCESS; CI main [38350956914](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38350956914) xanh đủ gate. Production bundle `index-CeLinrvj.js` SHA-256 vẫn `f29f5aab62b23e92e44eea45fec642060156b48fd64d195fbbed30b55dbef969`; runtime/điểm giữ nguyên như PR #49. Soil authority OWNER_ADOPTED_SOURCE_DEPENDENT; canonical onset/後/定氣 vẫn OPEN. P4-C (roadmap 5) **ĐÃ NGHIỆM THU AUDIT-ONLY 2026-10-15** và **MERGED & DEPLOYED** ([PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) merge `9afd39f`, [CI main 38771420451](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38771420451) SUCCESS và deploy SUCCESS 2026-10-16; bundle production kiểm lại `f29f5aab…` không đổi): 11/11 authority, Golden độc lập freeze `c12df53` trước code, 31.755 dòng 0 thiếu operand 宜 của 11 thần / 0 unresolved 凶 / 0 unexplained, undetermined 4.040 → 642 (P5 539 + scope khác 103), mutation P4-C 23/23, CI [38764920607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38764920607) xanh trên `efc5ffa`, runtime/bundle bất biến ([acceptance gate](docs/audits/sources/p4-vol10/yi-acceptance-gate-v1/README.md)). P5 warehouse (roadmap 6) **ĐÃ NGHIỆM THU AUDIT-ONLY 2026-10-16**, MERGED & DEPLOYED [PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) (`22dd72f`; gate 8/8, [report](docs/audits/p5-warehouse.md)). F1 puzhu:06 MERGED & DEPLOYED [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) (`e427e2b`; audit-only, gỡ 68 / giữ 645 / hold 11). S1 canonical vẫn OPEN.

## 42. PROJECT_CONTEXT đầy đủ trước khi thu gọn (2026-10-20, main `94f5319`)

Bản nguyên văn (heading hạ 2 cấp) trước khi thu gọn file chính. Tương đương `git show 94f5319:PROJECT_CONTEXT.md`. Giữ chuỗi SHA/bundle/deploy cũ, evidence từng mục roadmap P4 và smoke chi tiết đã bỏ khỏi file chính. Trạng thái trong đây là snapshot ngày 2026-10-20.


> Trạng thái hiện hành và quyết định của project. Cập nhật 2026-10-20 (giờ VN). **Roadmap P4 (1–10) XONG HẾT; P4 đã bật trên production.** Activation: [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) `7826f0c` ([deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586) SUCCESS 2026-10-18) bật `xiejiVol10BalancingEnabled` = `true` (bundle `index-DmK6R6W_.js` nhúng `!0`, chunk `p4AlmanacHeadings-C0cqUkeK.js` 407.895 B): 21 thần dormant + balancing 卷十一 + P5 + 9b. Smoke production OFF trước / ON sau 12/12 trên desktop Chrome, Pixel 7, Safari desktop; Firefox 4/4 sau (2026-10-19), iPhone chưa chạy (R3). Rollback: PR một dòng flag `false`. **P1 天狗寅日 DEPLOYED** [PR #76](https://github.com/nghiepnguyen/calendar-hana/pull/76) `5913c98` ([deploy 39280489041](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39280489041) SUCCESS 2026-10-19, flag `tiangouYinNoYi` = true; smoke 8/8 Chrome/Pixel 7/Safari/Firefox). **Sát Chủ / Sát Sư theo Ngọc Hạp Chánh Tông DEPLOYED** [PR #78](https://github.com/nghiepnguyen/calendar-hana/pull/78) `09f3ec7` ([deploy 39344371847](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39344371847) SUCCESS 2026-10-20, flag `satChuNgocHapStars` = true); [PR #80](https://github.com/nghiepnguyen/calendar-hana/pull/80) `ca3c983` ([deploy 39346272375](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39346272375) SUCCESS 2026-10-20) thêm Tháng Sát Chủ + giờ Sát Chủ ở giờ hợp tuổi. Main HEAD `ca3c983`. **Không có mục roadmap đang làm**; chỉ còn việc độc lập (§5: S1, S2, R1–R4, backlog `event_fit`), làm khi owner yêu cầu. S1 canonical (土王用事 onset/後/定氣) vẫn OPEN. Header cũ: history §41 (đến roadmap 8–9) và git history file này.
> Tài liệu này không thay thế yêu cầu mới của người dùng.
> Lịch sử chi tiết (phase, PR, số đo, release evidence): [`docs/project-context/history.md`](docs/project-context/history.md) — “history §N” trỏ về phần N trong file đó.
> **Quy tắc cập nhật:** sửa tại chỗ các mục trạng thái / vấn đề mở / next steps. Không thêm “phần N+1”. Chi tiết release ghi vào `docs/audits/` hoặc history.

#### 1. Project

- **Repo:** `nghiepnguyen/calendar-hana` (public, MIT) · **Production:** <https://lich.thanhnghiep.top> · **Default branch:** `main`
- Lịch dương/âm Việt Nam + lịch vạn niên, chọn ngày, phong thủy — kiến trúc audit được. Không gom quy tắc truyền thống thành “điểm tốt/xấu” tùy ý: mỗi rule cần nguồn, operand, convention và test độc lập trước khi ảnh hưởng production.

##### Nguyên tắc authority

1. Astronomy/calendar core deterministic.
2. Rule truyền thống deterministic (12 Trực, 28 Tú, Hoàng/Hắc đạo) phải source-lock/convention-lock.
3. Cát/Hung thần, Thụ Tử, Sát Chủ và rule phụ thuộc sách/phái phải audit provenance trước khi migrate production.
4. Golden độc lập với production, **đóng băng trước code**; không sửa Golden để test xanh.
5. Không hardcode ngày, skip test hoặc nới assertion để che authority conflict.
6. Không dùng “đa số website giống nhau” làm authority; không majority vote.
7. Khác biệt phải phân loại: `ENGINE_BUG`, `GOLDEN_BUG`, `SPEC_BUG`, `CONVENTION_DIFFERENCE`, `SOURCE_DEPENDENT`, `NAMING_ONLY`, `UNKNOWN`.
8. Migration diff phân loại: `EXPECTED_AUTHORITY_MIGRATION_CHANGE` / `UNEXPECTED_REGRESSION`.
9. Không reopen astronomy hoặc phase CLOSED nếu không có bằng chứng mới.

#### 2. Trạng thái production

| Hạng mục | Giá trị |
|---|---|
| Main đã deploy | `ca3c983` ([PR #80](https://github.com/nghiepnguyen/calendar-hana/pull/80) Tháng Sát Chủ + giờ Sát Chủ cá nhân, 2026-10-20; gồm PR #79 docs `ce9a23b`), trước đó `09f3ec7` ([PR #78](https://github.com/nghiepnguyen/calendar-hana/pull/78) Sát Chủ / Sát Sư, 2026-10-20; gồm PR #77 docs `52fc203`, PR #74 local checks `3a7511a`), trước đó `5913c98` (PR #76 **P1 天狗寅日**, 2026-10-19; gồm PR #75 docs R3 `4f98f9b`, run deploy của #75 bị huỷ do concurrency), trước đó `284eb8e` (PR #73 docs), `8f485ec` (PR #72 docs, 2026-10-19; `src`/`shared` không đổi từ `7826f0c`), trước đó `7826f0c` (PR #71 roadmap 10: **P4 ON**, 2026-10-18), trước đó `98e8ca5` (PR #70: go-live review 9 + 9b + PRD 10, flag OFF, 2026-10-18), trước đó `9865eee` (roadmap 9 migration diff, push thẳng main 2026-10-18; chỉ test/script/docs), trước đó `7d7596f` (PR #69 roadmap 8: adapter P4 sau flag OFF, runtime mới nhưng output không đổi), `f00dd5c` (PR #68 roadmap 7b audit-only), `82b3eb4` (PR #66 Full Golden), `3980183` (PR #63 R5 e2e env, 2026-10-17; không đổi `src`/`shared`), trước đó `c9a1ecc` (PR #62 docs), `e427e2b` (PR #61 puzhu:06 audit-only). Trước đó `ac2835e` (CI local pre-push, push thẳng main), PR #60 `22dd72f` (P5 audit-only), `03fb35d` (CI path-gate P4, push thẳng main). Trước nữa PR #58 `c09a4c3`, PR #57 `3800d99` (PWA: `/version.json`, update toast, version = ngày build); PR #55 `9afd39f` (P4-C audit-only). Output điểm/almanac đổi gần nhất: `ca3c983` (PR #80: sao Tháng Sát Chủ; điểm/status không đổi); trước đó `09f3ec7` (PR #78: 4 sao mới + giờ Sát Chủ; điểm/status không đổi, chỉ thêm text cảnh báo sao chưa mapping); trước đó `5913c98` (PR #76); `7826f0c` (PR #71, P4 ON); trước đó `1fc9940` (PR #49) |
| Bundle | `/assets/index-BOXM4O_Y.js`, SHA-256 `b591b41d3e36264fe0e7a6749443cd0c6686676ab52d0b5d5e3e2d4fc972981a`, chứa "Giờ Sát Chủ hôm nay"; `/version.json` `{"version":"26.10.20","build":"ca3c983","builtAt":"2026-10-20T00:13:37.382Z"}` (kiểm 2026-10-20; chưa so byte với build local). Trước đó `/assets/index-CM9DaQOs.js`, SHA-256 `5c4cfe4b1445e99e5c19c1760b3df034acb9a6a4acb212d0f8883a6727556596`, nhúng `satChuNgocHapStars:!0`; `/version.json` `{"version":"26.10.20","build":"09f3ec7","builtAt":"2026-10-19T23:54:58.843Z"}` (kiểm 2026-10-20; chưa so byte với build local). Trước đó `/assets/index-CNs6AFJY.js`, SHA-256 `38194102abf7f27f09bb208f6a0e4c060a2ba7e0047e0063608455975e548830`, nhúng `xiejiVol10BalancingEnabled:!0`, `tiangouYinNoYi:!0`, `p1-tiangou-yin-v1`; `/version.json` `{"version":"26.10.19","build":"5913c98","builtAt":"2026-10-19T15:52:23.109Z"}` (kiểm 2026-10-19; chưa so byte với build local). Trước đó `/assets/index-DbFAG4Ga.js` (`284eb8e`, SHA-256 `2233c6af…`). Trước đó `/assets/index-DmK6R6W_.js`, SHA-256 `bdfec497a5e31c00ad264724756de4b367ab470343c7198f13285fbc0abce5af`, nhúng `xiejiVol10BalancingEnabled:!0`; chunk `/assets/p4AlmanacHeadings-C0cqUkeK.js` (407.895 B, nạp không chặn); `/version.json` `{"version":"26.10.18","build":"7826f0c","builtAt":"2026-10-18T15:00:24.585Z"}` (kiểm 2026-10-18). So byte 2026-10-19: build local `GITHUB_SHA=7826f0c…` với cấu hình Firebase web public đọc từ bundle production → mọi file JS production (index, `p4AlmanacHeadings`, các chunk lazy) trùng byte sau khi chuẩn hóa `builtAt`/version và hash tên chunk (hash đổi theo `builtAt` trong `index`); `index.esm` ×3 và `workbox-window` trùng cả tên-hash. Trước đó `/assets/index-C_yKx2zH.js`, SHA-256 `7c6e04a0d2cd7d399a9cb63954b6077ba1df72d1ad43e2bdd83adb78dadfa08d`; `/version.json` `{"version":"26.10.18","build":"98e8ca5","builtAt":"2026-10-18T12:11:19.788Z"}`; nhúng `xiejiVol10BalancingEnabled:!1` (kiểm 2026-10-18; chưa so byte với build local). Trước đó `/assets/index-umK95j49.js`, SHA-256 `926dde690715f38a46e568895ce1136d1f337e7a3e5a4716936088140db35953`; `/version.json` `{"version":"26.10.18","build":"9865eee","builtAt":"2026-10-18T06:04:17.065Z"}`; manifest nhúng `xiejiVol10BalancingEnabled:!1` (kiểm 2026-10-18). Chưa so với build local cùng SHA. Khác bundle trước do code adapter roadmap 8 (+0,66 kB, resolver P4 không vào bundle chính). Trước đó `/assets/index-CBpvqC51.js`, SHA-256 `6804ea53e90145d1fe2391a53ba7e1810eb4c7150e8f679edbb68a220789d971`; `/version.json` `{"version":"26.10.17","build":"3980183","builtAt":"2026-10-17T04:35:02.404Z"}` (kiểm 2026-10-17; `src`/`shared` không đổi từ `e427e2b`, chỉ khác `build`/`builtAt`). Trước đó `/assets/index-g13VWl-j.js`, SHA-256 `8df99c4d99079e776db8d16fe14529ccdb0e931359b3073f0a176ff96c6269d2`; `/version.json` `{"version":"26.10.17","build":"e427e2b","builtAt":"2026-10-17T03:49:06.512Z"}` (kiểm 2026-10-17). Build local `GITHUB_SHA=e427e2b…` thiếu biến môi trường Firebase web của deploy (`VITE_FIREBASE_*`, config public), nên khi so phải bỏ qua khối cấu hình đó ngoài `builtAt`/hash chunk. Trước đó `index-BC34-C-T.js` / `4903beff…` (`03fb35d`). Từ PR #57 bundle nhúng `builtAt` (giờ build) nên không còn trùng byte với build local: kiểm bằng `GITHUB_SHA=<sha> npm run build`, thay `builtAt` local bằng giá trị `/version.json` → `index-*.js` trùng production ngoài tham chiếu hash chunk. Bundle cũ `index-CeLinrvj.js` / `f29f5aab…` (PR #49–#56) |
| Deploy gần nhất | [deploy 39346272375](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39346272375), commit `ca3c983` (PR #80), SUCCESS 2026-10-20 (2m59s). Trước đó [deploy 39344959706](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39344959706) `ce9a23b` (PR #79 docs). Trước đó [deploy 39344371847](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39344371847), commit `09f3ec7` (PR #78), SUCCESS 2026-10-20 (3m5s). Trước đó [deploy 39280489041](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39280489041), commit `5913c98` (P1), SUCCESS 2026-10-19 (queue chậm do sự cố GitHub Actions 15:49 UTC). Trước đó [deploy 39180387957](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39180387957), commit `8f485ec` (docs), SUCCESS 2026-10-19 (bundle chưa kiểm lại, `src`/`shared` không đổi). Trước đó [deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586), commit `7826f0c`, SUCCESS 2026-10-18. Trước đó [deploy](https://github.com/nghiepnguyen/calendar-hana/actions) `8893eb0` (docs). Trước đó [deploy 39126203902](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39126203902), commit `98e8ca5`, SUCCESS 2026-10-18. Trước đó [deploy 39102682779](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39102682779), commit `9865eee`, SUCCESS 2026-10-18. Trước đó [deploy 39090860176](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39090860176) (`7d7596f`, PR #69), [deploy 39038139063](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39038139063) (`f00dd5c`, PR #68), [deploy 39003051538](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39003051538), commit `3980183`, SUCCESS 2026-10-17. Trước đó [deploy 39000603292](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000603292) (`c9a1ecc`, PR #62), [deploy 39000168607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000168607), commit `e427e2b`, SUCCESS 2026-10-17 (workflow `deploy.yml`: build + Firebase deploy, không test lại; gate là `ci:local` ở máy). PR #60 [deploy 38995034163](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38995034163) SUCCESS (job deploy, audit reuse). Trước đó [CI main 38832193524](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38832193524), commit `03fb35d`, SUCCESS 2026-10-16 (~6 phút: 4 shard unit, gates, Playwright 2 shard, Deploy; P4-B/P4-C mutation skipped vì không đổi file P4). Trước đó PR #58 [38830103117](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38830103117), PR #57 [38821209473](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38821209473), PR #55 [38771420451](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38771420451) đều SUCCESS |
| Dataset | `datasetVersion` 1.2.1, `schemaVersion` 1.1.0 |
| Catalog | 32 activities (đều enabled), 11 event profiles |

PR #49 đổi điểm `medical`/`demolition` ở 11/1095 ngày (chi tiết bảng §3). Run main của PR #51 (`2f14092`) đỏ do test 720 context vượt timeout 5 s nên bỏ qua deploy; PR #52 sửa timeout và deploy lại xanh (production không bị ảnh hưởng vì #51 không đổi runtime). Smoke production PR #49: 2025-07-06 / 2025-07-19 / 2025-07-05 (đối chứng) đúng kỳ vọng trên desktop Chrome và Pixel 7. Safari desktop, iPhone, Firefox chưa chạy (R3).

`shared/almanac-data/manifest.json` → `policies`:

| Policy | Giá trị | Ý nghĩa |
|---|---|---|
| `xiejiVol10Scoring` | **true** | Scorer 卷十 cho 6 chain 月建/月破/平日/收日/閉日/刼煞 (PR #32) |
| `mansion28ScoringEnabled` | **false** | 28 Tú chỉ informational, `scoreDelta = 0` |
| `noTabooMeansNeutralUpToSeverity` | `high` | Không gặp ngày kỵ → trung tính cho event ≤ high; `very_high` vẫn cần căn cứ |
| `hardWarningKeepsWorseScoreStatus` | true | Hard warning lấy trạng thái nghiêm hơn (≤19 strong_avoid, ≤29 avoid, còn lại ≥ consider) |
| `unknownRuleMeansNoEvidence` | true | UNKNOWN không suy thành tốt/xấu |
| `hardVetoFromClassicalJi` | false | 忌 cổ điển không tự thành veto |
| `legacyGodsMonthJian` | **true** (PR #45) | 14 thần legacy (Thiên Xá, Nguyệt Ân, Dân Nhật, Tam Hợp, Thiên Hỷ, Lục Hợp, Ngũ Phú, Giải Thần, Phúc Sinh, Thánh Tâm, Ích Hậu, Tục Thế, Nguyệt Hình, Thiên Lại) đọc theo Month Jian thay vì tháng âm; sao hiển thị và điểm cùng đổi |
| `xiejiVol10BalancingEnabled` | **true** (PR #71, 2026-10-18; thêm ở PR #69 với false) | P4: cân bằng 宜/忌 卷十一 + 21 thần dormant + P5 + 9b (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`) + −25 product policy; chỉ chạy khi flag ON **và** provider `p4AlmanacHeadings` đã nạp **và** ngày trong 2025–2027. OFF = baseline v1 byte-equal (kể cả khi provider đã nạp) |
| `tiangouYinNoYi` | **true** (PR #76, 2026-10-19) | P1: ngày Dần, `pray_blessing`/`pray_children` mọi dòng dương applied → informational (`p1-tiangou-yin-v1`, puzhu:07); mọi năm, độc lập flag P4. `false` = output trước P1 |
| `satChuNgocHapStars` | **true** (PR #78, 2026-10-20; PR #80 thêm Tháng Sát Chủ) | Sao ngày Tháng Sát Chủ (Lưu-thị, tr. 128, = `SAT_CHU_DUONG`), Bốn Mùa Sát Chủ, Sát Chủ Trong Bốn Mùa, Ngày Sát Sư, Tháng Sát Sư (Ngọc Hạp Chánh Tông tr. 128–133; không mapping chấm điểm). `false` = output trước PR #78 (giờ Sát Chủ `DayHour.isSatChu` không theo flag, chỉ hiển thị) |
| `aiMayChangeScore` | false |  |

Rollback (flag về false trên nhánh riêng → PR → CI deploy → smoke; không sửa Golden): `xiejiVol10Scoring` (history §38–39), `legacyGodsMonthJian` (`docs/audits/dormant-legacy-gods.md`), `xiejiVol10BalancingEnabled` (PR một dòng manifest, giữ 6 chain và `legacyGodsMonthJian`; chứng minh output bằng `shared/lunar/p4MigrationRollback.test.ts`, `docs/audits/p4-migration-diff.md`), `tiangouYinNoYi` (PR một dòng manifest; độc lập flag P4; test lịch sử ghim `false`, proof `shared/lunar/p1TiangouYinMigration.test.ts`), `satChuNgocHapStars` (PR một dòng manifest; baseline/rollback/migration-diff/almanac legacy ghim `false`).

#### 3. Trạng thái theo phase

| Phase / hạng mục | Trạng thái | Authority / tài liệu |
|---|---|---|
| Calendar core, Month Jian/12 Trực, Group A/B | CLOSED | `docs/group-b/`, `docs/rules/` |
| Astronomy | CLOSED | JPL DE440s frozen, `astronomy-authority-v4`, `clock-v1`; ERFA chỉ là verifier; `docs/astronomy/` |
| 28 Tú identity | CLOSED | `index = ((jd + 11) % 28 + 28) % 28`; `docs/audits/28-mansion-provenance.md` |
| Hỷ/Tài/Phúc Thần | CLOSED | Operand `DAY_STEM`; history §17 |
| 4C Hoàng/Hắc đạo | CLOSED & DEPLOYED | 協紀 卷七, `day-gods-authority-v1`; `docs/audits/hoang-hac-dao-provenance.md` |
| 4D Cát/Hung thần | CLOSED & DEPLOYED | Mỗi thần là authority riêng (nguồn/operand/month basis); history §5 |
| 5 Thụ Tử | CLOSED & DEPLOYED | 六壬大全 卷十九, `thu-tu-authority-v1`, `MONTH_JIAN`; `docs/audits/thu-tu-sat-chu-provenance.md` |
| 5 Sát Chủ | **SOURCE_DEPENDENT** | Tháng âm; 7 Hợi / 8 Sửu thống nhất calendar ↔ personal (PR #8); `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md` |
| 6 Thái Tuế/Tuế Phá/Tam Sát | CLOSED & DEPLOYED | `annual-directions-authority-v1`, boundary 立春 exact instant; `docs/audits/tai-tue-tue-pha-tam-sat-provenance.md` |
| 7 28 Tú 宜/忌 | CLOSED & DEPLOYED | 玉匣記 1880, `mansion-content-yuxia-1880-v1`, 115 clauses; `docs/audits/28-mansion-content-provenance.md` |
| Activity taxonomy/mapping/diagnostics/explainability | DEPLOYED | Mansion mapping 115/115, 用事 29/29 (single reviewer); `docs/audits/xieji-activity-mapping-review.md` |
| Trực/thần + 卷十 diagnostics | DEPLOYED | `docs/audits/truc-than-context-audit.md`, `xieji-vol10-resolution.md`, `xieji-monthly-sha-presence.md` |
| Thiên Đức legacy tháng quẻ | RESOLVED, bỏ theo 月表 (PR #21) | `docs/audits/tiande-yuebiao.md` |
| 百忌日 甲日/乙日 | DEPLOYED (PR #26) | `docs/audits/baiji-giap-at.md` |
| 百忌日 寅/酉/申/未 (祭祀/宴會/安牀/求醫療病) | DEPLOYED (PR #40) | `docs/audits/baiji-dayzhi.md`; chỉ activity đổi, event không đổi |
| P1 天狗寅日 「不註宜求福祈嗣」 | **DEPLOYED (PR #76)** | `docs/audits/p1-tiangou-yin.md`, PRD `tasks/prd-p1-tiangou-yin.md` (owner D1–D3); Golden `golden-p1-tiangou-yin.json` freeze `338b8dc`; mọi ngày Dần: Cầu phúc/Cầu tự không còn dòng dương applied; 2025–2027 (P4 ON) 58 dòng đổi, ngoài miền có `avoid`/`watch → strong_avoid` (owner chấp nhận); event không đổi |
| Sát Chủ / Sát Sư (Ngọc Hạp Chánh Tông) | **DEPLOYED (PR #78, #80)** | Bảng chép từ scan tr. 128–133, ghim trong `shared/lunar/satChuAuthority.test.ts`; Sát Chủ đổi ý nghĩa thành "Đại kỵ cất nhà, cưới gả, an táng; hạn chế việc trọng đại."; giờ Sát Chủ (tr. 129) gắn nhãn trong `HourGrid`. Mùa = tháng âm 1–3/4–6/7–9/10–12. PR #80: sao Tháng Sát Chủ (Lưu-thị) vào bảng sao chung; panel cá nhân "Giờ phù hợp với bạn" gắn nhãn Sát Chủ trên thẻ giờ và dòng "Giờ Sát Chủ hôm nay" (không đổi nhóm/loại trừ giờ). Smoke production PR #80 (Chromium): 2026-10-30 có Tháng Sát Chủ, Ngày Sát Sư, giờ Thân Sát Chủ; panel cá nhân kiểm ở local (ngày sinh thử 1990-07-01: thẻ Thân Ưu tiên có nhãn) và bundle production chứa chuỗi; production chưa nhập ngày sinh. Smoke production 2026-10-20 (built-in browser Chromium): 2026-11-19 giờ Thìn + Ngày/Tháng Sát Sư, 2026-11-13 Bốn Mùa Sát Chủ + Sát Chủ Trong Bốn Mùa, không lỗi console |
| 百忌日 巳日 出行 / 亥日 嫁娶 | DEPLOYED (PR #42) | `docs/audits/baiji-ty-hoi.md`; `travel` = Xuất hành (owner); mọi ngày Tỵ: Xuất hành ≤ Cân nhắc; mọi ngày Hợi: Cưới hỏi Không thuận lợi |
| 土王用事 | DEPLOYED (PR #29), còn SOURCE_DEPENDENT | `docs/audits/tu-vuong-dung-su.md` |
| Event bỏ activity phụ trùng heading | DEPLOYED (PR #37, #38) | `open_business` bỏ `business` (開市), `sign_contract` bỏ `transaction` (立券交易), `groundbreaking` bỏ `construction` (興造動土); 1095 ngày: recommended → caution 40 / 80 / 6, event khác không đổi. Proof `kaishiDoubleCountMigration.test.ts`, `sameHeadingDuplicateMigration.test.ts`; test lịch sử ghim mapping cũ qua `legacyEventMapping.ts` |
| P3a — định nghĩa 協紀 cho 35 thần | DONE (PR #43, audit) | `shared/almanac-data/xieji-god-definitions.json` (quy tắc + trích dẫn nguyên văn + offset, SHA-1 từng quyển), `xiejiGodDefinitions.test.ts`; owner chốt 往亡 (氣往亡 = tên liên quan, quy tắc khác), 不將 bỏ 六月戊午, 五富 順行 (逆行 lưu `alternative`) |
| P3b — presence evaluator | DONE (PR #44) | `shared/lunar/xiejiGodPresence.ts` (`xieji-god-presence-v1`), runtime đọc `xieji-god-tables.json` (bảng không trích dẫn, test buộc khớp definitions); `docs/audits/xieji-god-presence-2025-2027.tsv` |
| Release A — 14 thần legacy theo Month Jian | **DEPLOYED (PR #45)** | Flag `legacyGodsMonthJian`; Golden `golden-legacy-gods-month-jian.json` (52 ca, đóng băng `70ed321`); migration `legacyGodsMonthJian.test.ts` + `docs/audits/legacy-gods-month-jian-migration.tsv`; `docs/audits/dormant-legacy-gods.md` |
| 月破 子午未申 仍忌 | **DEPLOYED (PR #49)** | Clause 「…不忌祭祀覃恩肆赦等事仍忌解除求醫療病破屋壞垣」: resolver trước chỉ giữ danh sách gốc nên medical/demolition `not_listed`, Trực Phá vẫn +25. Sửa (`yuePoStillAvoidPolicy.ts`, cách đọc sát chữ: danh sách gốc + 3 việc 仍忌); 1095 ngày: 11 ngày, medical recommended → watch 5 / watch giữ 6, demolition recommended → avoid 5 / watch → strong_avoid 6, mỗi dòng −50; event không đổi. `yuePoStillAvoidMigration.test.ts` |
| 卷十 scoring | **ON** (PR #31/#32) | `docs/audits/xieji-vol10-scoring-migration.md`, `xieji-vol10-activation.md`, Golden `shared/almanac-data/golden-xieji-vol10-scoring.json` (39 ca) |
| P4 — cân bằng 卷十 | **ON (PR #71, 2026-10-18)**; roadmap 4–7b audit-only, 8–9b sau flag OFF, 10 activation | PR #54: 26 entry + puzhu:28 + 21 dormant; 31.755 dòng / 0 thiếu operand 凶 / 0 conflict. Soil `p4-soil-owner-convention-v1` **OWNER_ADOPTED_SOURCE_DEPENDENT** (phê duyệt mới 2026-10-13); canonical onset/後/定氣 còn OPEN (S1). P4-C (PR #55), P5 (PR #60), F1 puzhu:06 (PR #61), Full Golden (PR #66), 7b (PR #68) đã MERGED & DEPLOYED, đều audit-only. Adapter điểm (PR #69), migration diff (`9865eee`) và 9b (PR #70) deploy sau flag OFF; activation PR #71 bật flag ([báo cáo](docs/audits/p4-activation.md)). [`progress`](docs/audits/p4-vol10-progress.md), [`P4-B`](docs/audits/p4-vol10-remaining-ji.md) |
| CI — chia shard unit | **DEPLOYED (PR #52)** | Vitest 4 shard song song + job “Mutation and emulator gates”; timeout 60 s cho 6 test quét 720 context P4, 5 s cho test vuốt `App.test.tsx`; `testTimeout` mặc định 30 s (PR #53, sau khi `catHungRegression` vượt 5 s trên CI); job Unit ~10 phút → 4 × ~2m20s |
| Coverage P2 / R5 — 百忌日 + hard warning | **DONE, MERGED & DEPLOYED (PR #47)** | Golden P2 dùng manifest thật; migration lịch sử tách riêng; 9 rule trên 1095 ngày 2025–2027, event có/không giờ, 3 vùng điểm hard warning; 2 mutation bị bắt; local 165 file / 2952 test qua; [CI PR](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38098804753) và CI main xanh; `docs/audits/baiji-production-coverage.md` |
| PWA update (build version, `/version.json`, toast “Có phiên bản mới”) | **DEPLOYED (PR #57, #58)** | `docs/pwa-update-strategy.md`; so `build` (short SHA), version hiển thị = ngày build `YY.MM.DD` giờ VN; Hosting `no-store` cho `/version.json`. Chưa kiểm tay trên iPhone Home Screen (v1 → v2 → toast → Cập nhật ngay) |
| Personal (feng-shui, Bazi, daily) | Code có sẵn, chưa có phase audit riêng | Personal annual afflictions giữ convention cũ, chưa chứng nhận |

#### 4. Runtime pipeline

```text
computeAlmanac
  sao ngày: bảng legacy stars.data.ts (tháng âm)
    − thay bằng source-locked: Nguyệt Đức/Đức Hợp/Phá, Kiếp Sát, Thiên Đức/Hợp (Month Jian, Phase 4D)
    − thay bằng Month Jian: 14 thần legacy (getXiejiGodPresence, flag legacyGodsMonthJian), giữ vị trí bảng
    + Thụ Tử (authority), + day-rule gods (Trừ Thần, 百忌日, Nhân Thần, 土王用事)
  → present gods + godPresence (operand cho thần đã khoá)
→ classicalDay + activity contributions
→ getActivityRecommendations
→ applyVol10Scoring (flag ON) — khi xiejiVol10BalancingEnabled ON: applyP4Balancing thay 6 chain cho activity có heading P4 (flag ON ở production từ PR #71; cần provider `p4AlmanacHeadings` đã nạp, 2025–2027)
→ cap/status hoạt động
→ evaluateEventDay (criteria + score/classification + diagnostics)
→ daily UI/evidence
```

Bảng verdict 卷十 → điểm (`xieji-vol10-scoring-v1`):

| Verdict | Hành vi |
|---|---|
| `avoid` | Giữ delta âm; delta dương → âm cùng độ lớn; chain chưa có dòng âm → thêm `xieji10:<entry>:<activity>` −25 (không tạo hard warning) |
| `not_avoided` | Delta âm → 0 (`informational`); giữ dòng dương |
| `no_annotation` (不註/不忌) | Delta → 0; nếu mọi dòng bị bỏ → activity `neutral`, score 50 |
| `not_listed` / `undetermined` | Giữ nguyên |

Chi tiết contract: history §39-C.

Lưu ý UI: ô “Sao tốt & sao xấu” (`StarChips`) chỉ hiện 5 sao đầu mỗi nhóm trước “xem thêm” → thứ tự sao là hành vi sản phẩm. Phần sao từ bảng ngày giữ thứ tự `STARS`; sao source-locked nối sau. Test Release A buộc thứ tự giữ nguyên ở ngày tháng âm = Month Jian.

#### 5. Vấn đề mở và việc tiếp theo

Roadmap đánh số theo **thứ tự thực hiện**. Làm dứt điểm từng mục: chỉ chuyển mục kế khi mục hiện tại đạt “Xong khi”. Mục cần owner quyết thì dừng ở đó và hỏi, không tự chọn. Roadmap P4 1–10 đã xong (activation PR #71 owner cho phép 2026-10-18). Không có mục roadmap mới; việc tiếp theo chọn từ bảng việc độc lập khi owner yêu cầu.

##### Roadmap

| # | Việc | Trạng thái | Xong khi | Cần owner |
|---|---|---|---|---|
| 1 | ~~Smoke production PR #49~~ | **XONG** 2026-10-11: 6/6 desktop Chrome + Pixel 7 (`docs/audits/yue-po-still-avoid-release.md`) | — | — |
| 2 | ~~Merge PR #48~~ | **XONG**: merge `2cf7bb3`, deploy SUCCESS, bundle production vẫn `f29f5aab…` | — | — |
| 3 | ~~Quyết định 「又為X」~~ | **XONG**, merged PR #51 (audit-only): B theo nguồn — 土府/血支 專忌 = phạm vi bảo vệ, 死神 thuộc 平日, 大耗/地火/月虛/天火/咸池 = phạm vi riêng convention; 德願 giữ undetermined (`docs/audits/p4-vol10-youwei-scopes.md`) | — | — |
| 4 | **P4-B — mô hình các 凶 khác của 卷十一** (四廢, 五墓, 往亡, 八專, 四忌, 四窮, 厭對, 歸忌, 天賊, 小耗, 死氣, 遊禍…) và 21 thần dormant vào ghép ngày (audit-only) | **XONG — MERGED & DEPLOYED PR #54** (`1ad9b4b`, CI/deploy SUCCESS 2026-10-13); đã nghiệm thu audit-only theo owner: 26 entry + puzhu:28 + 21 dormant; Golden v8 giữ bytes, bổ sung ngày âm / 朔弦望 / 鋪註 27/28 / soil Golden độc lập khóa trước code (`c0d8f56`). 1095 × 29 = 31.755 dòng, 0 thiếu operand 凶, 0 conflict, 0 propagation gỡ / 179 chặn; 月表 24 trang presence 0 lệch. Giữ quyết định owner 2026-10-12 về 八風/復日/重日, 遊禍–天願 và puzhu:28 8 pillar gỡ toàn bộ 忌, 六月甲子 sửa 甲午. Soil authority mới `p4-soil-owner-convention-v1` có status OWNER_ADOPTED_SOURCE_DEPENDENT: Asia/Ho_Chi_Minh, 18 ngày dân sự trước 四立, gồm onset / trừ 四立; chỉ sáu heading. Canonical witness onset/後/定氣 vẫn OPEN, không đổi production/điểm. [`gate`](docs/audits/p4-vol10-soil-convention-gate.md), [`audit`](docs/audits/p4-vol10-remaining-ji.md). Validation: 181 file / 3476 test; gate 200 test; mutation 28/28; build/lint/typecheck qua, bundle runtime SHA-256 vẫn `f29f5aab…`. Mục 5 chưa làm. | Mỗi 凶 có entry 卷十 chép kèm offset, presence đã audit, clause → phạm vi heading; Golden suy tay khóa trước code; lan truyền 鋪註 được kiểm trên dữ liệu thật; mutation bắt hết | — |
| 5 | **P4-C — operand cho 11 thần 宜 còn thiếu** (母倉, 福德, 天恩, 天巫, 天后, 天醫, 除神, 驛馬, 天馬, 吉期, 鳴吠) | **XONG — NGHIỆM THU AUDIT-ONLY 2026-10-15**, **MERGED & DEPLOYED** ([PR #55](https://github.com/nghiepnguyen/calendar-hana/pull/55) merge `9afd39f`, [CI main 38771420451](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38771420451) SUCCESS và deploy SUCCESS 2026-10-16; bundle production kiểm lại `f29f5aab…` không đổi). [PRD](tasks/prd-p4c-yi-operands.md), [task list](tasks/tasks-p4c-yi-operands.md), [audit report](docs/audits/p4-vol10-yi-operands.md) (bảng tổng kết), [acceptance gate](docs/audits/sources/p4-vol10/yi-acceptance-gate-v1/README.md) 8/8. Authority `p4-yi-operands-v1` 11/11 (10 SOURCE_REVIEWED, 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT 2025–2027); Golden `golden-p4-yi-operands-v1` 10.668 records freeze `c12df53`; module audit-only `shared/lunar/p4Yi*.ts`, entry opt-in `resolveP4YiDay`. Sweep 1.095 × 29: baseline `991e87c` → [TSV](docs/audits/p4-vol10-yi-operands-2025-2027.tsv)/[summary](docs/audits/p4-vol10-yi-operands-summary.json): 0 operand unknown, 0 unresolved 凶, 0 conflict, 3.803 dòng đổi đều có lý do Golden; final undetermined 4.040 → 642 (修倉庫 P5 539, scope khác 103). Mutation `scripts/audit-p4-yi-mutations.py` 23/23 (CI 4 shard, 16–20 phút), P4-B 28/28. Unit 7.999 PASS; bundle `f29f5aab…` bất biến. Giới hạn: single reviewer (Codex/Claude), S1 canonical OPEN, 3 ngày Jie lệch quy ước noon không đổi state | Định nghĩa 協紀 kèm offset + SHA-1; đối chiếu chéo với bảng/nhãn sẵn có; số heading `undetermined` do 宜 giảm và được báo cáo | — |
| 6 | **P5 — warehouse** (修倉庫 co-presence; 開倉庫出貨財 với 德/月恩/四相/時德) | **XONG — NGHIỆM THU AUDIT-ONLY 2026-10-16**, **MERGED & DEPLOYED** ([PR #60](https://github.com/nghiepnguyen/calendar-hana/pull/60) merge `22dd72f` 2026-10-17, deploy SUCCESS). [PRD](tasks/prd-p5-warehouse.md), [tasks](tasks/tasks-p5-warehouse.md), [audit report](docs/audits/p5-warehouse.md) (gate 8/8). Owner chốt **D**: 修倉庫 qua đồng hiện chỉ 宜 khi 卷十 (月恩) và 卷十一 (月德) cùng cho 宜, lệch → `undetermined` SOURCE_DEPENDENT (OWNER_ADOPTED_SOURCE_DEPENDENT, không canonical). Authority `p5-warehouse-v1`; Golden `golden-p5-warehouse-v1` freeze `fc5c1fb` trước code; module audit-only `shared/lunar/p4Warehouse.ts` (`resolveP4WarehouseDay` bọc `resolveP4YiDay`, P4-C giữ nguyên). Sweep 31.755 dòng: chỉ 565 dòng 修倉庫 đổi; 539 dòng P5 → only_yi 225 / both_present 161 / only_ji 90 / not_recorded 46 / undetermined 17 (SOURCE_DEPENDENT 1 = 2025-10-08, 16 do 忌 P4-B mở). Mutation `scripts/audit-p4-warehouse-mutations.py` 12/12 (job CI riêng); bundle bất biến. Giới hạn: single agent; F1 puzhu:06 làm riêng, xong ở PR #61 | Predicate khóa theo spec §6 (ANY, không ALL), negative fixture cho đồng hiện không thể; Golden trước code | — |
| 7 | **Full Golden P4** cho 720 context × heading + presence + warehouse (lớp resolution; adapter/cap/event thuộc 8) | **XONG — OWNER NGHIỆM THU 2026-10-17**, MERGED & DEPLOYED [PR #66](https://github.com/nghiepnguyen/calendar-hana/pull/66) (`82b3eb4`, deploy 39027581948 SUCCESS, runtime không đổi). [Review sheet](docs/audits/p4-full-golden-review.md). [Báo cáo](docs/audits/p4-full-golden.md), [PRD](tasks/prd-p4-full-golden.md), [tasks](tasks/tasks-p4-full-golden.md). Golden Python độc lập engine (0 input engine, quét path literal): v1 freeze `b70913f`, **v2 freeze `c574e57`** (owner (i) 德作建論 cho mọi chỗ dùng 德), 31.755 dòng ngày + 20.880 context, reason code mọi dòng, bất biến thứ tự input. Quyết định owner 2026-10-17: H1-B/F5 (忌 không bảo vệ gặp 相抵 của scope khác → 忌 giữ, 宜 không ghi, rồi lan truyền), H2-A (天願 ∈ 德願), F1 (百忌 巳日 出行 → 行幸遣使), F4 (閉日 không 忌 求醫療病), E1 (復日/重日 「不忌亦不註宜」 → neither), E3 (lan truyền còn 相抵 → neither), E5 (context bất biến trên operand theo ngày), (i). Oracle chéo: mọi Golden từng phần + P5 28.800 ô + P4-C dayOverride 720, 0 lệch chưa phân loại. So engine: ngày 31.507/31.755 trùng, chứng minh nguyên nhân từng lệch (đảo luật), phần dư 0; lệch còn lại = luật owner chưa có trong engine + ENGINE_BUG E1 + ENGINE_BUG phân tầng A04b (6 dòng 栽種) + SPEC_BUG F1 + E5. Mutation (phương án b, mutate derive): 20/20 bị self-check bắt, có trong `ci:p4`. `ci:local` EXIT 0 (unit 8.056); runtime/bundle không đổi | Golden độc lập (không gọi resolver) đóng băng, checksum, reviewer; bao phủ theo spec §7.1 | — (đã nghiệm thu) |
| 7b | **Layer engine audit-only cài luật owner** (H1-B/F5, H2-A, F1, E1, E3, E5 context, (i)) và sửa ENGINE_BUG phân tầng A04b, kiểm bằng Golden v2 | **XONG — MERGED & DEPLOYED** [PR #68](https://github.com/nghiepnguyen/calendar-hana/pull/68) (`f00dd5c`, deploy 39038139063 SUCCESS, `/version.json` build `f00dd5c`, runtime không đổi): `shared/lunar/p4OwnerRules.ts` khớp Golden v2 31.755/31.755 ngày + 20.880/20.880 context, không sửa file engine đã khóa; test đỏ trước code `aef0a1e`; mutation 12/12; `ci:p4` thêm phép so toàn miền + runner. [Báo cáo](docs/audits/p4-owner-rules-engine.md) | Layer opt-in (như `resolveP4Puzhu06Day`), không đổi runtime; khớp Golden v2 toàn miền (31.755 ngày + context ngoài E5) với 0 lệch chưa phân loại; sweep + mutation trong `ci:p4`; Golden v2 không sửa | — |
| 8 | **Adapter điểm sau flag `xiejiVol10BalancingEnabled` = OFF** | **XONG — MERGED & DEPLOYED** [PR #69](https://github.com/nghiepnguyen/calendar-hana/pull/69) (`7d7596f`, deploy 39090860176 SUCCESS 2026-10-18; flag OFF, output production không đổi). [PRD](tasks/prd-p4-score-adapter.md) (owner §6.1–6.14), [báo cáo](docs/audits/p4-score-adapter.md). Manifest flag `false`; baseline v1 `1609264` (1098 ngày × 32 activity + 11 event) byte-equal. Golden điểm `p4-score-golden-v1` Python độc lập, test đỏ `47e8438` trước adapter (25 ca điểm + 5 baseline + 31.842 trạng thái activity). Adapter `shared/lunar/p4ScoreAdapter.ts`: chặt nhất `only_ji` > `both_present` > `neither_recorded` > `only_yi`, heading `not_recorded`/`undetermined` → baseline, resolution trước cap, −25 product policy một lần, 6 chain bỏ cho activity có state. Almanac (flag ON + provider `p4AlmanacHeadings` đã nạp + 2025–2027): 21 thần theo Month Jian, thay 5 sao alias; ngoài miền = baseline toàn bộ. FR-05 4 ngày làm chứng; mutation 21/21 (`ci:p4`); bundle +0,66 kB (resolver sau provider, import tĩnh sẽ +409 kB); unit 8.104 | Resolution trước cap; penalty −25 `product_policy_default_penalty` (`balancingEligible: false`); flag OFF tương đương baseline byte-for-byte trên 1095 ngày; P2/R5 manifest thật vẫn qua | — |
| 9 | **Migration diff + rollback** | **XONG — DEPLOYED** `9865eee` (push thẳng main theo owner, deploy 39102682779 SUCCESS 2026-10-18; chỉ test/script/docs). [PRD](tasks/prd-p4-migration-diff.md) (owner §6.10), [báo cáo](docs/audits/p4-migration-diff.md), [dữ liệu](docs/audits/sources/p4-vol10/p4-migration-diff-v1/README.md). Luật class + 12 bất biến khóa sha256 trước TSV (`p4-migration-rules-v1`); harness 6 cấu hình (mỗi cấu hình một module graph); full 14.894 dòng activity đổi, 0 vi phạm, phản thực tế cap-trước 0 dòng, 2.645 dòng đổi không có thần dormant đều do gỡ/−25/bỏ chain; fixture 36 Jie × ±1 khớp Golden v2; rollback manifest OFF + provider = baseline v1 byte-equal; mutation 14/14; `ci:p4` tay EXIT 0 ~55 phút (+~12 phút) | TSV 4 cấu hình (baseline / presence-only / balancing-only / full) trên 1095 ngày × 32 activity × 11 event; 0 `UNEXPECTED_REGRESSION`; rollback bằng flag đã kiểm | — (go-live review xong 2026-10-18, owner chốt nhóm 1–7 → 9b) |
| 9b | **Policy sau go-live review** (`ALL_TABOO_FLOOR_V1`, `MULTI_HEADING_JI_WINS_V1`, UI 忌 bị cap) | **XONG — MERGED & DEPLOYED** [PR #70](https://github.com/nghiepnguyen/calendar-hana/pull/70) (`98e8ca5`, [deploy 39126203902](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39126203902) SUCCESS 2026-10-18; flag OFF, runtime người dùng không đổi). [PRD](tasks/prd-p4-9b.md) (owner §6), [báo cáo](docs/audits/p4-9b.md). Golden điểm v2 trước code (test đỏ `930aa31`; lớp C 35.040 điểm chính xác; với policy cũ tái tạo full roadmap 9 35.040/35.040); adapter + UI `65fc896`; luật migration v2 khóa trước dữ liệu; diff v2 0 `UNEXPECTED_REGRESSION`; delta 9b 760 dòng activity (462 + 280 + 18) = Golden, event 216 classification đều xấu đi; mutation 29/29 + 20/20; flag vẫn `false` | Ba điều kiện go-live: floor 諸事皆忌 / 忌 đã ghi ≥ −25; 忌 multi-heading bảo toàn; UI hiện 忌 bị cap về 0. Golden điểm v2 trước code, mutation, diff v2 | — (owner duyệt 2026-10-18, gồm 216 event) |
| 10 | **Activation PR** (flag ON + 21 thần + P5) → merge → deploy → smoke → cập nhật file này | **XONG — MERGED & DEPLOYED** [PR #71](https://github.com/nghiepnguyen/calendar-hana/pull/71) (`7826f0c`, [deploy 39138435586](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39138435586) SUCCESS 2026-10-18). [PRD](tasks/prd-p4-activation.md), [báo cáo](docs/audits/p4-activation.md). A1 nạp provider không chặn + DayView chờ, A2 prerender, A4 nghĩa 16 thần, A5 "Đã gỡ theo Hiệp Kỷ", flag ON; unit 8.176, `ci:full` EXIT 0, `ci:p4` qua tới runner adapter (harness diff toàn miền + runner migration không chạy lại sau khi bật flag, theo owner). Smoke production OFF trước / ON sau 12/12 (desktop Chrome, Pixel 7, Safari desktop); iPhone/Firefox chưa chạy | CI xanh, deploy, bundle SHA, smoke desktop Chrome/Pixel 7/Safari | — (owner cho phép merge 2026-10-18) |

##### Việc độc lập (làm khi owner yêu cầu, không chặn roadmap)

| # | Vấn đề | Trạng thái / việc tiếp theo |
|---|---|---|
| P1 | 百忌日 phần còn lại: 「凡天狗寅日忌祭祀不註宜求福祈嗣」 → ngày Dần không ghi tốt cho `pray_blessing`/`pray_children` | **XONG — MERGED & DEPLOYED** [PR #76](https://github.com/nghiepnguyen/calendar-hana/pull/76) `5913c98` ([deploy 39280489041](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39280489041) SUCCESS 2026-10-19). Bỏ mọi dòng dương (D1/D2), mọi năm (D3), flag riêng `tiangouYinNoYi`. `ci:full` EXIT 0, `ci:p4` đủ 11 bước EXIT 0 (1h20m). Smoke trước 4/4 (Chrome/Firefox) / sau 8/8 (Chrome, Pixel 7, Safari, Firefox). [Báo cáo](docs/audits/p1-tiangou-yin.md). 「酉日…不註宜慶賜賞賀」 không có activity → không làm |
| P2 | 「凡巳日忌出行不註宜出師遣使」 | Không có activity 出師 → không làm. 巳日/亥日 chính đã deploy (PR #42), coverage PR #47 |
| S1 | 土王用事 SOURCE_DEPENDENT (đếm ngày hay thời khắc 立, biên 「後」, 時憲書/定氣, 德 có 止忌 như 土府 không) | Tìm nguồn; không đổi khi chưa có. 2026-10-12: archive.org không có 時憲書 in theo năm; chỉ có 《大清時憲書箋釋》 (`02094009.cn`, chép tay, tựa 雍正元年, trước 協紀, OCR không dùng được); ctext cấm truy cập tự động. Đã tìm thêm scan công khai 時憲書 ở Tohoku (225 canvas, 9冊; canvas 6 là 咸豐元年 1851 dù metadata bộ ghi 同治3年), đã tải manifest/ảnh, chưa khóa mốc 土王. Phương án và evidence: `docs/audits/p4-vol10-remaining-operands-research.md`; P4-B được nhận theo authority mới OWNER_ADOPTED_SOURCE_DEPENDENT 2026-10-13; S1 canonical onset/後/定氣 vẫn OPEN và SOURCE_DEPENDENT |
| S2 | Sát Chủ: chưa có nguồn Hán văn tiền hiện đại (PR #78 thêm biến thể Ngọc Hạp Chánh Tông). Tháng nhuận **đã chốt** (owner 2026-10-20): dùng bảng của tháng gốc (nhuận 4 → tháng 4) cho mọi bảng Sát Chủ/Sát Sư và giờ Sát Chủ; ngày Can Chi chạy liên tục; ghi ở header `stars.ts` (có sẵn) + test nhuận 6/2025 trong `satChuAuthority.test.ts` (golden `sat-chu-golden-v1.json` vẫn ghi `UNRESOLVED` vì bytes bị khóa bởi `yi-freeze-v1`, không sửa) | Nguồn offline |
| R1 | Review mapping single reviewer (agent): mansion 115/115, 用事 29/29 | Cần chuyên gia thứ hai nếu muốn nâng chứng nhận |
| R2 | Thần chung giữa activity chính/phụ khác heading (giữ có chủ đích) | Đổi policy cả 11 event → phase riêng nếu muốn |
| R3 | Coverage thiết bị: iPhone thật chưa chạy cho các release đổi điểm | Firefox: smoke P4 ON trên production 4/4 pass 2026-10-19 (`docs/audits/p4-activation.md` § Smoke R3). iPhone: owner tự chạy theo checklist trong đó (gồm luồng PWA update) |
| F1 | 鋪註 puzhu:06 「凡德合赦願月恩四相時德等日不註忌…如遇德猶忌及從忌不從宜之日則仍註忌」 (phát hiện P5 5.2) | **NGHIỆM THU AUDIT-ONLY 2026-10-16**; **MERGED & DEPLOYED** [PR #61](https://github.com/nghiepnguyen/calendar-hana/pull/61) (`e427e2b`, [deploy 39000168607](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39000168607) SUCCESS 2026-10-17; CI PR [38998213170](https://github.com/nghiepnguyen/calendar-hana/actions/runs/38998213170) xanh trước khi main chuyển sang CI local; push cuối `7d67d80` dùng `--no-verify` theo owner vì visual snapshot fail sẵn trên main, xem R5). Owner: Q1–Q3 không, Q4 có (danh sách gỡ riêng 九空 五虛 小耗 五離 五墓), Q4a chặn (五墓 不取德合). Module opt-in `shared/lunar/p4Puzhu06.ts` (`resolveP4Puzhu06Day` bọc `resolveP4YiDay`), authority `p4b-puzhu06-v3`, Golden v3 `f0454cb` (v1/v2 trước code; v3 sau khi sweep tìm SPEC_BUG 相抵 → `neither_recorded`). 2025–2027: 724 ứng viên → gỡ 68 / giữ 645 / hold 11; sweep 70 dòng đổi (68 + 2 propagationBlocked 開倉庫 未戊申), 0 đổi 忌 protected; mutation 16/16; full unit 8.033; runtime/bundle bất biến. [PRD](tasks/prd-p4b-puzhu06.md), [tasks](tasks/tasks-p4b-puzhu06.md), [báo cáo](docs/audits/p4b-puzhu06.md). 11 dòng hold (P4-B scope mở) đã chuyển vào roadmap 7; Full Golden v2 phủ toàn miền 31.755 dòng có reason code và 7b khớp toàn miền → không còn việc riêng |
| E1 | Backlog `event_fit`: event không `very_high` lấy điểm trung bình profile, vd. 6 ngày `buy_property` recommended dù `moving` là `only_ji` (`docs/audits/p4-migration-diff.md`) | Owner chốt giữ `event_fit` hiện hành ở go-live review (OK); siết là phase riêng nếu owner muốn |
| R5 | Visual snapshot `e2e/visual-default.spec.ts` (macOS): 7 ảnh day/week/month/form lệch (header, thẻ Phong thủy cá nhân) trên main `ac2835e` → `ci:local` fail, chặn hook pre-push. Không do PR #61 (không đổi `src`/`e2e`) | **XONG — MERGED & DEPLOYED 2026-10-17** [PR #63](https://github.com/nghiepnguyen/calendar-hana/pull/63) (`3980183`, [deploy 39003051538](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39003051538) SUCCESS; hook pre-push `ci:local` qua, không cần `--no-verify`). Nguyên nhân: môi trường, không phải UI. Ảnh chuẩn chụp khi Firebase đã cấu hình (có nút Đăng nhập ở header và thẻ Phong thủy); worktree/clone mới không có `.env.local` (gitignore) nên `isFirebaseConfigured()` false, nút ẩn, layout lệch. `src` không đổi từ `3800d99`. Sửa: `playwright.config.ts` `webServer.env` đặt `VITE_FIREBASE_*` giả (`demo-calendar-hana`, không bí mật), env tiến trình thắng `.env*` của Vite. Không tạo lại ảnh chuẩn. Kiểm: visual 12/12 pass cả khi có và không có `.env.local`; `npm run ci:local` EXIT 0 trong worktree sạch (unit 8.047, Playwright desktop 109 + dev 9). Lưu ý worktree mới cần `npm --prefix functions ci` trước, nếu không `npm run build` lỗi typecheck functions |
| R4 | 百忌日 còn 6 ngày không có activity (庚 經絡, 辛 醖釀, 壬 開渠, 卯 穿井, 丑 冠帶, 午 苫蓋) | Không tự map; chỉ làm nếu thêm activity |

##### Phụ thuộc

```text
(1, 2, 3 xong) ─► 4 凶 卷十一 + 21 thần ─► 5 operand 宜 ─► 6 P5
  ─► 7 full Golden (cần 4–6) ─► 7b engine cài luật owner (kiểm bằng Golden v2) ─► 8 adapter OFF ─► 9 diff + rollback ─► 9b policy ─► 10 activation (tất cả XONG)
P4 giữ nguyên 百忌日 (專忌 vẫn kỵ khi 吉凶相抵) và event_fit hiện hành
P1 (xong PR #76), P2, S1, S2, R1–R4, E1: độc lập
```

#### 6. Quy tắc cho agent

- “làm” = làm thật trong repo, không chỉ giải thích. Dùng GitHub/repo trực tiếp, không bắt user upload file.
- Làm trên nhánh, không commit thẳng `main`. Từ `03fb35d`: push CI chỉ chạy cho `main`; mọi nhánh khác chạy CI qua PR. Main reuse audit khi run `pull_request` thành công có cùng Git tree.
- Chỉ nói “CI green” khi Actions xác nhận; chỉ nói “deployed” khi deploy job xong và bundle production đã kiểm.
- Source conflict → phân loại, không tự chọn. Golden độc lập không bao giờ sửa theo production.
- Tách calendar-level và personal; mỗi rule có provenance khác là authority record riêng.
- Không global auspiciousness score; giữ mansion scoring OFF; giữ exact Jie boundary khi Month Jian là operand.
- Đổi điểm → owner quyết, Golden trước code, migration diff giải thích từng thay đổi.

#### 7. Quy trình, CI, tooling

**Quy trình:** branch → gate local → PR → CI xanh → **owner cho phép merge** → CI deploy → smoke production → cập nhật file này.

**CI** chạy ở máy (2026-10-19): (1) `npm run check` = lint → typecheck (app + functions), fail-fast; hook `.githooks/pre-push` (`core.hooksPath`, đặt bởi `prepare`) chỉ chạy tầng này; FAIL → chặn push, bypass `--no-verify`. (1b) `npm run test:changed` (chạy tay) = `vitest run --changed origin/main`: test phụ thuộc (module graph) file đổi đã commit chưa push + staged + chưa commit; đổi `package.json`/config Vitest/setup → chạy hết; không thấy dữ liệu đọc qua `fs` (Golden TSV/JSON). (2) `npm run ci:full` (chạy tay; `ci:local` là alias) = check → toàn bộ unit → emulator → 2 mutation gate (annual, mansion) → Playwright desktop (webServer tự `npm run build`, visual snapshot) + legal pages Vite dev; không gọi `ci:p4`. (3) `npm run ci:p4` (chạy tay, độc lập, luôn chạy đủ, không path-gate) = mutation P4-B, P4-C (~25 phút), P5, puzhu:06, Full Golden, owner-rules, score adapter (nối almanac toàn miền + mutation 21), migration diff roadmap 9 (harness toàn miền + mutation 14); đủ chuỗi 11 bước ~1h20m (EXIT 0 tại P1 `ac24039`, 2026-10-19, lần đầu đủ sau activation; runner adapter dùng `flag_shipped_off` thay `flag_default_on`, `b340881`). Đổi `shared/`, `e2e/` hay `shared/lunar/p4*`/`scripts/audit-p4-*` thì chạy tay `ci:full`/`ci:p4` trước khi merge. GitHub chỉ còn `.github/workflows/deploy.yml`: push `main` → lint → build (tsc -b; predeploy functions chạy tsc) → `firebase deploy --only firestore,hosting,functions --project calendar-hana`, không test lại. **Merge/push vào main = deploy production**, luôn hỏi owner trước. Mobile Safari/iPhone/Firefox không thuộc gate. Deploy tay (`npx firebase deploy --only hosting --project calendar-hana`) chỉ khi Actions hỏng và owner đồng ý.

```sh
npm run typecheck
npm run lint
npm test
npm run test:emulator            # cần Firebase CLI + Java
# Mutation runners: chạy TUẦN TỰ, không song song với test/build/edit
python3 scripts/audit-annual-directions-mutations.py
python3 scripts/audit-mansion-content-mutations.py
python3 scripts/audit-p4-grade-mutations.py   # và audit-p4-{authority,bridge,heading,day,coverage,season,remaining-ji}-mutations.py
python3 scripts/audit-p4-yi-mutations.py       # P4-C, ~25 phút; CI chạy --shard=i/4, chỉ bản đầy đủ ghi report tracked
python3 scripts/audit-p4-warehouse-mutations.py  # P5, 12 mutation
python3 scripts/audit-p4-puzhu06-mutations.py  # puzhu:06, 16 mutation, ~3 phút local
python3 scripts/audit-p4-score-adapter-mutations.py  # roadmap 8, 21 mutation, ~2 phút; toàn miền: P4_SCORE_ADAPTER_FULL=1 npx vitest run shared/lunar/p4ScoreAdapterAlmanac.test.ts
P4_MIGRATION_FULL=1 npx vitest run shared/lunar/p4MigrationDiff.test.ts  # roadmap 9 harness toàn miền ~5 phút; thêm P4_MIGRATION_WRITE=1 để sinh lại p4-migration-diff-v1 (cây sạch)
python3 scripts/audit-p4-migration-mutations.py  # roadmap 9, 14 mutation tuần tự, ngày mẫu, ~15 phút
# puzhu:06: baseline/sweep verify bytes; P4B_PUZHU06_WRITE=1 ghi lại; Golden: python3 -I docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/derive.py
# Quét P4-B 1095 ngày (ghi TSV + summary)
P4_B_REPORT=1 npx vitest run shared/lunar/p4RemainingJi.test.ts shared/lunar/p4FullDayComposition.test.ts shared/lunar/p4LunarDayComposition.test.ts shared/lunar/p4PuzhuEnd.test.ts shared/lunar/p4LunarPhase.test.ts
npx playwright test --project=desktop
npx playwright test e2e/mansion-content.spec.ts --project=desktop --project=mobile
# Báo cáo migration / chẩn đoán (ghi TSV qua REPORT_FILE)
REPORT_FILE=… npx vitest run shared/lunar/xiejiVol10ScoringMigration.test.ts
REPORT_FILE=docs/audits/legacy-gods-month-jian-migration.tsv npx vitest run shared/lunar/legacyGodsMonthJian.test.ts
REPORT_FILE=docs/audits/xieji-god-presence-2025-2027.tsv npx vitest run shared/lunar/xiejiGodPresence.test.ts
```

**Smoke production sau release đổi điểm:** spec Playwright (vd. `e2e/xieji-vol10-activation.spec.ts`, hoặc spec nháp chọn “Nhóm mục tiêu” + event) qua config tạm `{...base, webServer: undefined, baseURL: production}`; chạy **trước** deploy (giá trị cũ) và **sau** deploy; kiểm bundle production trùng SHA-256 build local; xoá file tạm. Profile ngày sinh chỉ lưu trong browser context tạm. Phần “Mục tiêu và kết luận” chỉ hiện khi đã nhập ngày sinh; ô sao cần bấm “xem thêm” (nút `aria-expanded` ngay sau `h4` “Sao tốt (n)” / “Sao xấu (n)”), không bấm lan mọi `aria-expanded` (treo test).

**Workspace:**

- `/Users/nghiepnguyen/My Files/calendar-hana`. Untracked `.ignore` và local `.gitignore` edits của user: giữ nguyên, không đưa vào PR. Rebase dùng `git rebase --autostash`.
- `graphify-out/`, `graft/`: cache graph local, gitignored. Theo `AGENTS.md`: graphify/graft trước khi grep; sau code edit chạy `graphify update .`.
- Tài liệu cũ ở root đã chuyển vào `docs/` (PR #34); map cũ → mới `docs/legacy-paths.json`, index `docs/README.md`. Artifact đóng băng vẫn trích path root (khoá SHA-256).
- **Không** chạy `npx prettier --write` theo glob rộng; chỉ format file đã sửa.
- Không đưa credentials/secret hoặc email cá nhân vào repo (repo public).
- Giữ test production bất biến chạy manifest thật (`baijiProductionInvariants.test.ts`, Golden P2 `baijiTyHoi.test.ts`); không ghim chúng về flag cũ để che regression. Golden lịch sử Giáp/Ất và hard warning vẫn giữ cấu hình đã đóng băng. Test migration lịch sử ghim trạng thái cũ bằng mock manifest/catalog: `xiejiVol10Scoring: false`, `legacyGodsMonthJian: false`, mapping event cũ qua `legacyEventMapping.ts`. Release đổi điểm mới phải ghim lại các test lịch sử theo cách này, không sửa Golden.
- Nguồn 協紀 dạng text: Wikisource raw `https://zh.wikisource.org/w/index.php?title=欽定協紀辨方書_(四庫全書本)/卷NN&action=raw` (NN = 03…11); SHA-1 prefix ghi trong `xieji-god-definitions.json` và các audit doc.
- Nguồn tham khảo ngoài repo: scan 玉匣記 1880 `archive.org/download/20241205_20241205_0310/page/nN.jpg` (N = pdfPage − 1); 月表 四庫全書 archive.org `06067692.cn`–`06067697.cn` (2 quyển/item; trang ngày = n6+i ở quyển đầu, n73+i ở quyển sau, i = chỉ số lục thập hoa giáp từ 甲子; witness đã khoá ở `docs/audits/sources/p4-vol10/yuebiao-witness-lock-v2.json`); scan 卷九–卷十 `06067686.cn` (鋪註條例 cuối quyển n222–n229); _Ngọc Hạp Chánh Tông_ `~/Downloads/Ngoc hap chanh tong.pdf`; spec user ở `~/Downloads/`. Cách trích ảnh: history §24.

#### 8. Starter prompt

> Đọc PROJECT_CONTEXT.md. **Roadmap P4 1–10 xong, P4 đã bật trên production**: activation PR #71 `7826f0c` (2026-10-18, flag `xiejiVol10BalancingEnabled` = true; rollback = PR một dòng flag false); main HEAD `ca3c983` (PR #80 Tháng Sát Chủ + giờ Sát Chủ cá nhân; PR #78 Sát Chủ / Sát Sư, flag `satChuNgocHapStars` = true, deploy SUCCESS 2026-10-20; trước đó PR #76 P1 天狗寅日 `tiangouYinNoYi` = true). Repo public; CI chạy ở máy (`npm run check` qua hook pre-push; `test:changed`, `ci:full`/`ci:p4` chạy tay), GitHub chỉ deploy; push/merge main = deploy production, luôn hỏi owner trước. Production: 卷十 ON (6 chain), P4 balancing ON (21 thần dormant + 卷十一 + P5 + 9b `ALL_TABOO_FLOOR_V1`/`MULTI_HEADING_JI_WINS_V1`, chỉ 2025–2027 và sau khi provider `p4AlmanacHeadings` nạp), mansion scoring OFF, 百忌日 甲/乙/丁/寅/酉/申/未/巳/亥 ON, 14 thần legacy theo Month Jian, P1 天狗寅日 ON, sao Sát Chủ/Sát Sư Ngọc Hạp ON. Không có mục roadmap đang làm; việc tiếp theo chỉ từ bảng việc độc lập §5 (S1 土王用事 canonical OPEN, S2 Sát Chủ, R1 reviewer thứ hai, R2, R3 iPhone, R4, E1 backlog `event_fit`) khi owner yêu cầu. Quyết định owner P4: spec `docs/plans/p4-xieji-vol10-balancing.md` §9, PRD `tasks/prd-p4-score-adapter.md` §6, `tasks/prd-p4-migration-diff.md` §6.10, `tasks/prd-p4-9b.md` §6, `tasks/prd-p4-activation.md`; báo cáo `docs/audits/p4-activation.md`. Soil authority OWNER_ADOPTED_SOURCE_DEPENDENT. Golden trước code, không sửa Golden/authority/lock để test xanh; unknown không kích hoạt; penalty mặc định là product policy; mutation runner chạy tuần tự; test quét toàn miền cần timeout rõ ràng. Lịch sử ở `docs/project-context/history.md`.


## 43. 卷十 劫煞 Option C v1 — release (2026-10-22, main `85736fd`)

PR [#87](https://github.com/nghiepnguyen/calendar-hana/pull/87) `feat(calendar): migrate Vol10 Jie Sha to faithful Option C v1`, merge `85736fd` (2026-10-22T15:39Z), [Deploy #30 / 39806855626](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39806855626) SUCCESS. `/version.json` `{"version":"26.10.22","build":"85736fd"}`; bundle `/assets/index-DFKQlWND.js` SHA-256 `2ea886f55e75f71eacee098b218dc84c002dd70a2d79c2860707c14cb521143b`. Gate trước merge: `ci:p4` PASS (13 bước, mutation mới 14/14), `ci:full` PASS (unit 8.313, emulator 29, Playwright 110 + legal 10). Báo cáo: `docs/audits/p4-jiesha-option-c-migration.md`.

### Chuỗi audit (đều audit-only, merge cùng PR #87)

| Bước | Commit | Báo cáo | Kết luận |
|---|---|---|---|
| H1-B 月表 witness | `3444e01`, `18faa35` | `docs/audits/p4-h1b-yuebiao-witness.md` | PARTIALLY_SOURCE_WITNESSED; phát hiện tiền đề 劫煞 相抵 sai |
| 相抵 / cancel_both | `ea94c37`…`158263f` | `docs/audits/p4-xiangdi-cancel-both-audit.md` | 39/39 cụm phản bác `cancel_both`; đọc OVERLAP |
| Impact OVERLAP | `58dd3bb`, `c340cb0` | `docs/audits/p4-jiesha-overlap-impact.md` | 鳴吠對 → 啟攢; cận trên 15.158 |
| Simulator trung thực | `6177853`, `d79b08e` | `docs/audits/p4-jiesha-faithful-vol10.md` | bảng 384 ô; 鋪註05; kiến trúc C |
| puzhu:17 不將 | `616698a`…`a85ab0f` | `docs/audits/p4-puzhu17-bujiang.md` | P17-A; +3 ô 未-壬申 |
| 未-戊申 納財 / puzhu:21 | `718f06c`, `3e1c784` | `docs/audits/p4-weishen-nacai-puzhu21.md` | trang tự mâu thuẫn; owner: nguồn thắng (cục bộ) |
| Gate cuối | `163e050` | `docs/audits/p4-option-c-final-gate.md` | 丑-丙寅 月德 đổi 2 ô → dừng |
| 丑-丙寅 月德 | `4f1cd9f`, `681c692` | `docs/audits/p4-chou-bingyin-yuede.md` | D-A; candidate 384 ô / 177 avoid |
| Migration v1 | `fe40968`, `db905d8`, `e85451f` | `docs/audits/p4-jiesha-option-c-migration.md` | projection 352 APPLIED; G1/G2 tách nợ |

Phát hiện khi migrate: candidate dùng heading chuẩn hoá khác `resolveVol10` ở 2 chữ (壞/壊, 劵/券) → owner chọn projection v1 (Option 1), demolition EXCLUDED_PENDING_GLYPH_AUDIT, contract/transaction UNREACHABLE. Policy chuyển từ hằng module sang `manifest.policies.xiejiVol10JieshaPolicy` vì setup test nạp provider P4 trước, `vi.mock` module không còn tác dụng.

### PROJECT_CONTEXT trước 2026-10-22 (thay bằng bản hiện hành)

- Main đã deploy: `ac25ce6` (PR #84 audit 28 Tú, content 1.0.4, chỉ hiển thị/evidence); runtime trước đó `ca3c983` (PR #80).
- Bundle: `/assets/index-CRGNGEqY.js` `fce1aaea29c4f878fd75a31f3558c59393a1d4194eab45c8c06ac664982a8474` (`ac25ce6`); trước đó `index-BOXM4O_Y.js` `b591b41d…` (`ca3c983`).
- Deploy: 39518653568 `ac25ce6` SUCCESS 2026-10-21, smoke 柳/星 28 Tú PASS; trước đó 39348730720 `94f5319`. Sau đó 39522624941 `f1e5c54` (PR #86 S1, docs) SUCCESS 2026-10-21.
- Dòng §5 "X相抵" đầy đủ trước khi thu gọn:

| X相抵 | 相抵 / `cancel_both` (tách khỏi H1-B) | Audit evidence-only (nhánh `claude/xiangdi-cancel-both-audit`, chưa merge; [audit](docs/audits/p4-xiangdi-cancel-both-audit.md)). **劫煞 辰戌丑未 không 德: `cancel_both` bị 月表 phản bác** (辰/戌/未 39/39 cụm). Đọc chữ 「凡所忌者則不註宜所宜者亦不註忌」 = chỉ bỏ heading có 宜 + cặp 鋪註: PARTIALLY_SOURCE_WITNESSED (in-sample). 災煞/月煞 ứng viên riêng; 月刑/天吏 có 德 UNRESOLVED (lẫn puzhu:06). Ảnh hưởng mọi năm qua 卷十 scoring. **Impact study** (nhánh `claude/jiesha-overlap-impact`; [báo cáo](docs/audits/p4-jiesha-overlap-impact.md)): 鳴吠對 宜 啟攢 (không 宜 安葬) + 鋪註 「有宜啟攢不註忌安葬」 giải thích 丑 (3/3); OVERLAP 42/42 cụm vs production 2/42. 1900–2100: tối đa 15.158 activity −15, 3.314 event caution→not_recommended (cận trên — tầng 卷十 không có cặp 鋪註); 2025–2027: 136 activity, 50 event. J5 MORE_EVIDENCE_REQUIRED (tầng 卷十). **Simulator trung thực** (nhánh `claude/jiesha-faithful-vol10-sim`; [báo cáo](docs/audits/p4-jiesha-faithful-vol10.md)): verdict 卷十 劫煞 = hàm của (context, activity), 384 ô; 1900–2100: 17.242 activity đổi điểm (CONFIRMED, 0 unresolved), thêm 鋪註05 (求醫療病 遇徳猶忌); F1 (lan truyền xuyên thần) SOURCE_DEPENDENT chỉ tầng P4; đề xuất kiến trúc C (bảng authority sinh từ engine P4). **puzhu:17 不將** (nhánh `claude/puzhu17-bujiang-audit`; [audit](docs/audits/p4-puzhu17-bujiang.md)): ngoại lệ là điều kiện trên nguồn 宜 — 嫁娶 chỉ có 宜 từ 不將 thì không lan truyền; 月表 未-壬申/未-戊申 7/7 ô ủng hộ, engine hiện tại (P17-0) sai 5; bảng 384 ô đổi 3 ô (未-壬申 wedding/engagement/moving → avoid); kiểm 16 trang: 未-戊申 納財 宜 (qua puzhu:21) còn có thể đổi tới 5 ô → F2_TABLE PARTIAL, VOL10_OPTION_C và P4 đều MORE_EVIDENCE_REQUIRED. **未-戊申 納財 / puzhu:21** (nhánh `claude/weishen-nacai-puzhu21-audit`; [audit](docs/audits/p4-weishen-nacai-puzhu21.md)): nguồn (四相 宜 納財, mệnh đề 劫煞, puzhu:06) đều cho 納財 không chú 忌 → bảng = bảng P17-A, 0 ô đổi; trang n117 tự mâu thuẫn (in 納財 nhưng bỏ 開市), mọi cách đọc đều sai ≥1 ô → **dừng chờ owner**: nguồn có thắng 1 ô 月表 hay không (nếu theo trang: 5 ô, 108 ngày, 328 activity −15). **Owner chọn nguồn** cho 未-戊申 納財 (phán quyết cục bộ). **Gate cuối** (nhánh `claude/option-c-final-gate`; [audit](docs/audits/p4-option-c-final-gate.md)): 丑-丙寅 in 月德 làm đổi 2 ô (construction, warehouse) × 99 ngày, 198 activity +15 → F2_TABLE PARTIAL, Option C chưa sẵn sàng; chờ owner chọn D-A (384 ô) hay D-B (360 ô). **Audit nguồn 月德** (nhánh `claude/chou-bingyin-yuede-source-audit`; [audit](docs/audits/p4-chou-bingyin-yuede.md)): 歴例 「四八十二月在庚」, project chép đúng; 月德 10 trang khớp, 0 thiếu, 1 thừa (n75); 月空 4/0/0; 丑-庚寅 in 月德 (đọc lại full-res) → 月德 trên n75 丙寅 là lỗi chép (WITNESS_PRINTING_ERROR) → D-A. F2_TABLE COMPLETE, **VOL10_OPTION_C MIGRATION_READY**; candidate audit-only 384 ô / 177 avoid. P4 vẫn MORE_EVIDENCE_REQUIRED. Owner duyệt. **Option C v1 (projection)** (nhánh `claude/jiesha-option-c-migration`, chưa push; [báo cáo](docs/audits/p4-jiesha-option-c-migration.md)): authority `shared/almanac-data/xieji-vol10-jiesha-authority-v1.json`, policy manifest `xiejiVol10JieshaPolicy: faithful-v1` (legacy `legacy-cancel-both` vẫn chọn được); 352 ô APPLIED, demolition EXCLUDED_PENDING_GLYPH_AUDIT (G1 壞/壊), contract/transaction UNREACHABLE (G2 劵/券); 1900–2100: 17.420 activity −15, 0 thay đổi 2025–2027, 2.576 event đổi phân loại; golden v2 kế nhiệm, v1 giữ nguyên byte. **Chờ owner review trước khi push.** **Chờ owner**, không đổi runtime |

## 44. Nợ chữ heading G1 / G2, CI phase 1–2b — PR #88–#100 (2026-10-22 → 2026-10-25, main `d47bcc6`)

Mục production thay trong PROJECT_CONTEXT §2 ngày 2026-10-25:

- Main `85736fd` (PR #87, Option C v1), [Deploy #30 / 39806855626](https://github.com/nghiepnguyen/calendar-hana/actions/runs/39806855626), bundle `/assets/index-DFKQlWND.js` `2ea886f5…143b`, `/version.json` `26.10.22`. Trước đó: `f1e5c54` (PR #86), `ac25ce6` (PR #84).

| PR | Merge | Loại | Nội dung |
|---|---|---|---|
| [#88](https://github.com/nghiepnguyen/calendar-hana/pull/88) | `8b63ba0` | docs | Ghi release Option C v1 |
| [#89](https://github.com/nghiepnguyen/calendar-hana/pull/89) | `177f694` | audit | G1: 破屋壊垣/破屋壞垣 → `SAME_ACTIVITY_ALIAS`; phát hiện lệch key ở score adapter (demolition `baseline` cả 1.095 ngày P4). `docs/audits/p4-g1-glyph-audit.md` |
| [#90](https://github.com/nghiepnguyen/calendar-hana/pull/90) | `70f3707` | runtime, không đổi output | G1-b Stage 1: `canonicalP4HeadingKey`, policy `p4ScoreHeadingLookup` ship `source-key-v1` (output byte-equal) |
| [#91](https://github.com/nghiepnguyen/calendar-hana/pull/91)–[#93](https://github.com/nghiepnguyen/calendar-hana/pull/93) | `67e8099`, `6043f3d`, `175b889` | CI | `check:fast`, `check:audit-clean` (fail khi test ghi đè artifact audit đã track), output mutation remaining-ji tất định, `ci:p4:fast` (vòng dev, không phải gate), `npm test` bỏ audit puzhu17 đóng băng, `ci:p4:full`, `test:p4:puzhu17-freeze` |
| [#94](https://github.com/nghiepnguyen/calendar-hana/pull/94) | `1380cfb` | analytics | PostHog qua proxy first-party `https://e.lich.thanhnghiep.top` (`VITE_POSTHOG_*`, CSP) |
| [#95](https://github.com/nghiepnguyen/calendar-hana/pull/95) | `36878dd` | perf, không đổi output | `splitHeadings` tính sẵn vocabulary đã chuẩn hoá (~70–79 % CPU P4) |
| [#96](https://github.com/nghiepnguyen/calendar-hana/pull/96) | `00558ba` | UI | Kẹp timer lời mời cài đặt (TimeoutOverflowWarning) |
| [#97](https://github.com/nghiepnguyen/calendar-hana/pull/97) | `5f2397d` | audit | G1-a: `SAME_ACTIVITY_ALIAS_CONFIRMED`; lỗi harness = bỏ sót match (6 harness đóng băng key activity chỉ bằng `canonP4Heading`), harness kế nhiệm; 4 witness conflict = DEPENDENCY_CONFLICT (土王用事; 16/16 khớp khi không có 土王); 5 ngày overlap EXPECTED_CORRECTION, owner chấp nhận. `docs/audits/p4-g1a-demolition-authority.md` |
| [#98](https://github.com/nghiepnguyen/calendar-hana/pull/98) | `1ed3828` | spec | Đóng băng spec G1-b Stage 2 trên main (bản lịch sử `9aa9cf7`, sha `8ac93927…`); envelope 353 / 320 / 337 / 0. `docs/audits/p4-g1b-score-lookup.md` |
| [#99](https://github.com/nghiepnguyen/calendar-hana/pull/99) | `394acbb` | **đổi output** | G1-b Stage 2: `p4ScoreHeadingLookup` → `canonical-v1`. Chỉ demolition, chỉ 2025–2027: 353 ngày đổi điểm/status (điểm 320: 223 giảm / 97 tăng; status 337), hard warning 0, activity khác 0, ngoài miền 0. Score Golden v3, migration diff v3, rollback proof. Deploy #42 / 40086414826. `docs/audits/p4-g1b-stage2-migration.md` |
| [#100](https://github.com/nghiepnguyen/calendar-hana/pull/100) | `d47bcc6` | audit | G2 Stage 1: 立劵交易/立券交易 `SAME_ACTIVITY_ALIAS_CONFIRMED`; lệch ở khớp heading 卷十 của `resolveVol10`, không phải P4; phán quyết owner 2026-10-25 (未-戊申 BLANK, I1); đóng băng envelope I1. Deploy #43 / 40148584043. `docs/audits/p4-g2-vol10-heading-match.md` |

Gate trước #99: `ci:p4:full` exit 0 (mọi mutation bị bắt), `ci:full` exit 0 (unit 250 file, emulator, Playwright), `check:audit-clean` sạch, build index Δ −3 B.

## 45. G2 Stage 2, G1 glyph/SOIL, W1, F1 R2, Q4-REST — PR #101–#107 (2026-10-25 → 2026-10-26, main `6dac11a`)

Mục production thay trong PROJECT_CONTEXT §2 ngày 2026-10-26:

- Main `d47bcc6` (PR #100, G2 Stage 1), [Deploy #43 / 40148584043](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40148584043), bundle `/assets/index-BNiXJDPd.js` `23fef042…cccb`, `/version.json` `26.10.25`. Trước đó: `394acbb` (PR #99, Deploy #42).

| PR | Merge | Deploy | Loại | Nội dung |
|---|---|---|---|---|
| [#101](https://github.com/nghiepnguyen/calendar-hana/pull/101) | `58faf3a` | #44 | docs | PROJECT_CONTEXT G1/G2 |
| [#102](https://github.com/nghiepnguyen/calendar-hana/pull/102) | `f3c68c6` | #45 | **đổi output** | G2 Stage 2: `headingAliases` 立劵交易 → [立券交易] + authority 劫煞 v2 (352 → 384 ô APPLIED). 2025–2027: 24 dòng contract/transaction (12 ngày, 24 tăng); ngoài miền 13.856 dòng; event 293.600 đánh giá đổi (gồm evidence-only). `docs/audits/p4-g2-stage2-migration.md` |
| [#103](https://github.com/nghiepnguyen/calendar-hana/pull/103) | `d5c005f` | #46 | **đổi output** | G1 glyph Stage 2 (R3): authority 劫煞 v3, +11 ô demolition; 2025–2027 = 0; ngoài miền 1.119 ngày −15. `docs/audits/p4-g1-glyph-stage2-migration.md` |
| [#104](https://github.com/nghiepnguyen/calendar-hana/pull/104) | `aebcf2e` | #47 | **đổi output** | G1-SOIL (R2): rule service `tho-vuong-dung-su-rule-v1` + authority v4 (5 context `APPLIED_DATE_DEPENDENT`); 2025–2027 = 0; ngoài miền 298 ngày watch→avoid. `docs/audits/p4-g1-soil-stage2-migration.md` |
| [#105](https://github.com/nghiepnguyen/calendar-hana/pull/105) | `f66c74f` | #48 | audit | W1 `未-戊申 × 立券交易` đóng (owner D1(a) cục bộ), 0 thay đổi production. `docs/audits/p4-g2-n117-stage3-owner-ruling.md` |
| [#106](https://github.com/nghiepnguyen/calendar-hana/pull/106) | `7a38f09` | #49 | **đổi output** | F1 R2: puzhu:06 v4 (Q4 không gỡ 五離 × 立券交易); 20 dòng activity −15, 2025–2027. `docs/audits/p4-f1-wuli-lijuan-stage3-migration.md` |
| [#107](https://github.com/nghiepnguyen/calendar-hana/pull/107) | `6dac11a` | #50 | **đổi output** | Q4-REST: puzhu:06 v5 (R-JK/R-WX/R-XH `QL_NARROW` + R-F1Y); 121 dòng activity, 366 event, 2025–2027. `docs/audits/p4-q4-rest-stage3-migration.md` |

## 46. Checkpoint post-Q4-REST, P21 partial migration — main `eb4dfd6`, PR #108 (2026-10-26, main `e15f047`)

Mục production thay trong PROJECT_CONTEXT §2 ngày 2026-10-26:

- Main `7a38f09` (PR #106, F1 R2), [Deploy #49 / 40268301142](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40268301142).
- Main `6dac11a` (PR #107, Q4-REST), [Deploy #50 / 40290726192](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40290726192), bundle `/assets/index-YAZPGNPM.js`.

| Push / PR | Commit | Deploy | Loại | Nội dung |
|---|---|---|---|---|
| push `main` (owner yêu cầu) | `f7ba333`, `c6d7997`, `eb4dfd6` | [#51 / 40335793972](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40335793972) | docs | PROJECT_CONTEXT lên `6dac11a`, tách `docs/project-context/`, checkpoint post-Q4-REST. 0 thay đổi production |
| [#108](https://github.com/nghiepnguyen/calendar-hana/pull/108) | merge `e15f047` (13 commit Stage 1–4, không squash) | [#52 / 40336298796](https://github.com/nghiepnguyen/calendar-hana/actions/runs/40336298796) | **đổi output** | P21: authority `p4-puzhu21-v1` (puzhu:21 contribution-scoped trên 亥-丁酉/亥-癸酉); 2025–2027: 3 ngày 亥-丁酉, 6 dòng contract/transaction 50 neutral → 20 avoid, 27 event (18 đổi phân loại), hard warning 0. Golden full v5, score v7. `docs/audits/p21-stage4-partial-migration.md` |
