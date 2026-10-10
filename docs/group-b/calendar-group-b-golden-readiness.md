# Calendar Group B — Golden readiness

2026-10-08. **Không tạo authoritative Golden Group B trong lượt này.**

Tất cả sáu rule **GOLDEN_READY = NO**. Month Jian/Jie basis đã có evidence mạnh theo từng rule, nhưng exact/civil cutoff và independent dated matches chưa đủ admission. Thiên Đức còn bốn quái chưa có day operand.

Checklist “month basis” là xác định meaning từ source, không đồng nghĩa runtime binding đã được reviewer admit. “leap” được checked ở nghĩa đã chứng minh không là operand trong Jie interpretation; không có lunar repeat policy được đoán. Nếu đổi interpretation về lunar months, phải mở lại checkbox này.

## Nguyệt Phá — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: 月建所衝之日, 卷四
- [x] month basis: MONTH_JIAN_BRANCH; 月表 riêng
- [ ] boundary: exact-instant vs civil-day cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis; không số tháng âm
- [x] operand: DAY_BRANCH đối xung
- [x] alias: monthly 月破; cùng-position 大耗 có scope riêng được phân biệt
- [ ] independent fixtures: 0 positive / 0 negative accepted; cần ít nhất 2/2

Blocker: cutoff + INDEPENDENT_DATE_FIXTURE_MISSING. Không dùng production calendar hoặc 60 symbolic rows làm dated oracle.

## Kiếp Sát — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: 正月起亥逆行四孟, 卷六
- [x] month basis: chính 月表 bind rule vào Jie/Month Jian
- [ ] boundary: cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis
- [x] operand: DAY_BRANCH
- [x] alias: 刼/劫, monthly variant; không annual rule
- [ ] independent fixtures: 0/0; cần 2/2

Blocker: cutoff + INDEPENDENT_DATE_FIXTURE_MISSING. Không lấy chữ 正月 để mặc định lunarMonth.

## Tai Sát — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: compiler’s reverse 四仲 correction, 卷六
- [x] month basis: rule-specific 月表 placement
- [ ] boundary: cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis
- [x] operand: DAY_BRANCH
- [x] alias: monthly 天獄 identity explicit; chưa admit 天火/Phi Ma aliases
- [ ] independent fixtures: 0/0; cần 2/2

Blocker: cutoff + dated fixtures; giữ Tianhuo/Phi Ma scope review ngoài alias đã admit. Không thay symbolic table theo forward truyền bản.

## Nguyệt Sát — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: reverse 四季 và 月虚 relation, 卷六
- [x] month basis: 月建三合 + 月表 riêng
- [ ] boundary: cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis
- [x] operand: DAY_BRANCH
- [x] alias: 月煞/月殺/月虚/月虛 cùng monthly rule có explicit explanation
- [ ] independent fixtures: 0/0; cần 2/2

Blocker: cutoff + dated fixtures. Không double count 月虚.

## Nguyệt Đức — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: 三合陽干, 卷五; 月建三合, 卷十
- [x] month basis: riêng month-table Jie placement, không chỉ branch-general statement
- [ ] boundary: cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis
- [x] operand: DAY_STEM, direction aspect riêng
- [x] alias: 徳/德; 月德合 riêng
- [ ] independent fixtures: 0/0; cần 2/2

Blocker: cutoff + dated fixtures. Không chuyển stem sang branch, không dùng production prose làm scope.

## Thiên Đức — GOLDEN_READY = NO / PARTIAL

- [x] primary rule: mixed 8 stems/4 trigrams, 卷五
- [x] month basis: own 月建 rationale + 月表
- [ ] boundary: cutoff chưa khóa
- [x] leap: irrelevant theo Jie basis
- [ ] operand: 2/5/8/11 TRIGRAM/DIRECTION day semantics chưa resolve
- [x] alias: 徳/德; 天道 là aspect, không tự tạo duplicate raw rule
- [ ] independent fixtures: 0/0; cần 2/2 và coverage bốn quái

Blocker: cutoff + four mixed operands + independent dated evidence. Các rival branch reconstructions giữ riêng trong conflicts; không chọn nhánh theo legacy.

## Candidate evidence đã giao

`calendar-group-b-basis.json` có evidence URLs/locations, SOURCE_SAYS versus inference, six statuses, direct activity candidates và 144 boundary records **PENDING / expected=null**.

Bốn transitions: Lập Xuân, Kinh Trập, Thanh Minh, Lập Hạ2014 từ HKO, chỉ precision minute. Sample reference±1min không được quảng cáo là exact t±1min; actual exact timestamp và cutoff vẫn cần admission. Civil D−1/D/D+1 luôn ghi timezone UTC+7. Chưa có independent day operands được verify nên không fabricate fields.

Không tạo lunar before/leap/after expected vì solar/Jian reading không nhận lunarMonth. Nếu reviewer muốn một lunar alternative, cả leap policy và date fixtures phải PENDING cho tới khi primary support riêng.

## Evidence cần bổ sung trước Golden

1. Review/collate canonical edition và source scope cho cutoff; hoặc quyết định named project binding, ghi rõ origin khác primary claim.
2. Traceable dated almanac pages: ít nhất 2 positive/2 negative mỗi rule, có timezone/calendar basis/day stem/branch và annotation policy. Không coi absence label là raw false khi chưa biết completeness.
3. Riêng Thiên Đức: resolve mixed day/direction model hoặc giữ named alternative ngoài canonical day matching.
4. Sau review mới có lượt tạo candidate Golden; không tự unlock production bằng report này.

Safety: production và Golden V1/V2.1/V3 unchanged qua SHA-256; không scoring, Group C hoặc resolver. Dừng tại research package.
