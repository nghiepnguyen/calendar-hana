# PROJECT_CONTEXT.md

> Handoff cập nhật 2026-10-10 (giờ Việt Nam), sau release Activity interpretation review (PR #6) ngày 2026-10-10.
> Đây là tài liệu trạng thái và quyết định của project; chỉ dẫn trong tài liệu không thay thế yêu cầu mới của người dùng.
> Chat mới đọc phần 21–24, 29 và 30 trước, rồi dùng các phần authority bên dưới khi cần.
> Các phần Phase 4C/4D/5 được kế thừa từ context trước; Phase 6/7 và release evidence được kiểm chứng trong thread này.


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
14. Activity interpretation review + door_opening/waterworks ✅ MERGED & DEPLOYED (PR #6); phần 30.

### Next — đề xuất, chưa có scope triển khai mới được duyệt

Review narrow activity semantics và mapping interpretation; bổ sung context Trực/thần và audit conflict-resolution policy khi có scope được duyệt. Taxonomy, mapping contract, conflict diagnostics và explainability đã deploy; chưa chứng nhận full conflict resolution hoặc scoring authority mới. Chưa tự đặt phase number mới.

### Engine

13. Activity taxonomy — 29 IDs/scopes hiện tại đã deploy; narrow catalog gaps còn pending
14. Nên/kỵ rule mapping — mansion contract đã deploy; interpretation review còn pending
15. Conflict-resolution engine — diagnostics đã deploy; resolution policy còn pending
16. Explainability/evidence — mansion activity UI đã deploy
17. Daily evaluation

### Personal

18. Personal feng-shui rules
19. Bazi / Dụng-Hỷ-Kỵ-Cừu
20. Personal daily evaluation

### Product

21. UI integration
22. Full Golden/regression
23. E2E/visual/device
24. Production release

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
```

Closure có phạm vi: Phase 5 không chứng nhận Sát Chủ; Phase 4D không chứng nhận mọi generic star; Phase 7 không chứng nhận mọi edition và không bật scoring.

Repo checkout hiện tại: `main`, HEAD và `origin/main` khi cập nhật handoff:

```text
4ba37939c31b4f8d43dbd1ea4ea637f8767cc4fa
```

Latest release: **Sát Chủ months 7/8 alignment**, [PR #8](https://github.com/nghiepnguyen/calendar-hana/pull/8), MERGED & DEPLOYED 2026-10-10 10:37:13 Việt Nam; chi tiết phần 30 (mục “Cập nhật sau release”).

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

1. **Sát Chủ:** primary provenance, competing variants, leap-month semantics chưa giải quyết. Legacy Sát Chủ Âm lunar-month behavior giữ nguyên, migration blocked.
2. **Thiên Đức/Hợp directional tokens:** 坤/乾/艮/巽 chưa có normalization provenance hoàn chỉnh; partial legacy giữ nguyên ở các rows này.
3. **Generic stars:** `byMonth` blanket lunar assumption, modern-derived table, meanings/provenance chưa toàn bộ source-lock. Không tự đổi tất cả sang Month Jian.
4. **Duplicate Hoàng/Hắc concepts:** không để legacy duplicate ghi đè Phase 4C authority.
5. **Phase 6 product/personal:** calendar annual directions chưa đưa vào calendar UI; personal annual afflictions/lunar conventions được bảo toàn chứ chưa được Phase 6 chứng nhận. Không gộp Hai layer.
6. **Phase 7 coverage:** other editions, old tailoring/study/business/bed/travel/boat claims chưa được selected poems hỗ trợ; vẫn UNKNOWN đối với authority này. Không kết luận tất cả tradition đều sai.
7. **Taxonomy/mapping:** door opening, waterworks, narrow construction, boat building vs launching cần activity IDs/schema/scope riêng nếu được triển khai.
8. **Scoring/conflict resolver:** mansion conflict diagnostics đã deploy, nhưng chưa có production-wide audited resolution policy; đã tồn tại product weights, caps, event profiles, local conflict behavior, nhưng không coi đó là classical global scoring authority. Không bật mansion scoring sau content closure một cách tự động.
9. **Documentation release headers:** audit docs Phase 6/7 còn status/checklists trước deploy (phần 21); cần docs-only reconciliation nếu muốn repo docs phản ánh release.

### Next steps đề xuất cho chat mới (chưa tự implement)

1. Đọc handoff và phần 29; kiểm tra latest main/release, tránh redo Phase 6/7 hoặc activity slice đã deploy.
2. Dùng inventory/acceptance trong bốn verification docs trong `docs/verification/` (danh sách chính xác ở phần 29) làm baseline; các header trước merge là historical snapshots.
3. Review narrow activity semantics: door opening, waterworks, narrow construction, boat building vs launching; chỉ thêm ID/scope khi source và acceptance rõ.
4. Tách lexical normalization, source evidence, taxonomy interpretation và scoring policy. Freeze independent Golden trước semantic migration; decision baseline không phải scoring authority. Empty ID/UNKNOWN không tự thành permission.
5. Audit context/conditions/exceptions cho Trực/cát/hung thần trước khi migrate các nguồn đó vào diagnostics.
6. Audit resolution policy theo cùng activity/scope/context và source; không majority vote hoặc tự chọn winner giữa các phái.
7. Triển khai scope mới khi user yêu cầu, từ latest main trên nhánh phù hợp. Scoring mới cần scope/authority/policy audit riêng; chưa gọi đây là Phase 8.
8. Giữ zero mansion scoring, core astronomy, exact boundaries và personal separation.
9. Local validation → GitHub branch/PR gates → authorized merge → main CI → actual deploy; ghi production smoke đúng release được kiểm tra.

User request mới nhất là cập nhật handoff sau deploy PR #5. Không có implementation task hoặc approval cho next phase đang tồn đọng.

------------------------------------------------------------------------

## 24. Workspace, tooling và cách tiếp tục an toàn

Workspace: `/Users/nghiepnguyen/My Files/calendar-hana`.
Original input context: `/Users/nghiepnguyen/Downloads/PROJECT_CONTEXT (2).md` (historical; chưa được sửa).
Handoff hiện tại: `PROJECT_CONTEXT.md` ở repo root, **tracked trong git từ 10/10/2026** theo yêu cầu user (PR riêng, docs only). Cập nhật handoff sau mỗi release qua nhánh/PR như code.

- Local `.gitignore` edits và untracked `.ignore` đã tồn tại trước Phase 7; được giữ nguyên, không đưa vào bất kỳ PR nào (#4–#10).
- `graphify-out/` có generated modifications/cache; `graph.html` có thể bị xoá do >5000-node visualization limit. Không phải app regression; không commit generated churn hoặc reset user state.
- `graft/` indexing corpus được ignore; không đưa vào product change.
- Graph có 5822 nodes, 8340 edges, 765 communities tại update gần nhất; built commit header a69e8df7.
- Theo AGENTS.md: đọc `graphify-out/GRAPH_REPORT.md` trước source/search; wiki index nếu tồn tại thì dùng wiki; cross-module questions ưu tiên graphify query/path/explain; sau code edits `graphify update .` AST-only.
- Graft: ask --source để locate/understand; callers để impact; grep cho exhaustive symbol usage. Không thay graph navigation bằng quét toàn bộ repo không cần thiết.
- Không spawn subagents trong thread này; không tự delegate nếu user/applicable instructions chưa yêu cầu.
- Temporary primary scan `/tmp/calendar-hana-yuxia-1880.pdf` và rendered images là research cache, không phải durable dependency. Có thể mất khi đổi session; re-download primary archive và verify hash nếu cần đọc lại.

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

> Đọc PROJECT_CONTEXT.md. Phase 6/7 đã CLOSED & DEPLOYED; activity taxonomy/mapping contract/conflict diagnostics/explainability đã deploy trên main a69e8df (PR #5). Lên plan review narrow mapping interpretation và context/resolution policy còn pending từ production hiện tại. Giữ 28 Tú informational/scoreDelta=0, không reopen astronomy hoặc tự thay personal conventions. Inventory và acceptance trước khi code.


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

### Việc mở / branch local (tại thời điểm release PR #6)

- `fix/explainability-test-date` (local, chưa push): commit `2811055` chỉ sửa comment test (2026-10-11 là Tú Tinh, không phải Trương).
- `audit/sat-chu-printed-witness` (local, chưa push): commit `1b42703` `docs/audits/sat-chu-ngoc-hap-chanh-tong-witness.md` — nhân chứng in *Ngọc Hạp Chánh Tông* (Hà Tấn Phát; PDF user cung cấp, SHA-1 95c29e2f…). Phát hiện: **calendar `stars.data.ts` Sát Chủ (7 Sửu / 8 Hợi) mâu thuẫn personal `SAT_CHU_AM` (7 Hợi / 8 Sửu)**; sách khớp personal; “Tháng Sát-Chủ (Lưu-Thị)” khớp `SAT_CHU_DUONG`; Thọ Tử can-chi hẹp hơn (CONVENTION_DIFFERENCE). Chưa đổi code; cần quyết định riêng.
- Lệch trang scan 觜/參: dataset ghi 觜 p65 / 參 p66 nhưng sách đóng 參 n64 trước 觜 n65 → link scan hai Tú hoán đổi; sửa cần dataset + Golden Phase 7 (GOLDEN_BUG), chờ user.
- Tú 角: scan có thể là 葬埋 thay vì 埋葬; cần đối chiếu crop độ phân giải cao.
- Còn pending: ID riêng cho xây dựng hẹp; audit context Trực/cát/hung thần; resolution policy; scoring vẫn tắt.
