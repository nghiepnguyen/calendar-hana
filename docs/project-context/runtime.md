# Runtime pipeline

> Luồng tính almanac → điểm → event và bảng verdict 卷十. Trạng thái hiện hành: [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md). Lịch sử PR/deploy: [`history.md`](history.md).

```text
computeAlmanac
  sao ngày: bảng legacy stars.data.ts (tháng âm; tháng nhuận dùng tháng gốc)
    − thay bằng source-locked: Nguyệt Đức/Đức Hợp/Phá, Kiếp Sát, Thiên Đức/Hợp (Month Jian, Phase 4D)
    − thay bằng Month Jian: 14 thần legacy (getXiejiGodPresence, flag legacyGodsMonthJian), giữ vị trí bảng
    − bỏ sao Sát Chủ/Sát Sư Ngọc Hạp khi satChuNgocHapStars OFF
    + Thụ Tử (authority), + day-rule gods (Trừ Thần, 百忌日, Nhân Thần, 土王用事)
  → present gods + godPresence (operand cho thần đã khoá); sao không mapping → cảnh báo, không chấm điểm
  giờ: getAllHours(jd, dayChi, lunarMonth) — hoàng/hắc đạo + isSatChu
→ classicalDay + activity contributions
→ getActivityRecommendations
→ resolveVol10 (policy `xiejiVol10JieshaPolicy`: 劫煞 辰戌丑未 không 德 → ô authority faithful-v1)
→ applyVol10Scoring — khi xiejiVol10BalancingEnabled ON: applyP4Balancing thay 6 chain cho activity có heading P4 (cần provider `p4AlmanacHeadings` đã nạp, 2025–2027); heading activity tra key provider qua `p4ScoreHeadingLookup` (`canonical-v1`: `canonicalP4HeadingKey`)
→ cap/status hoạt động
→ evaluateEventDay (criteria + score/classification + diagnostics)
→ daily UI/evidence
```

Bảng verdict 卷十 → điểm (`xieji-vol10-scoring-v1`; contract chi tiết history §39-C):

| Verdict | Hành vi |
|---|---|
| `avoid` | Giữ delta âm; delta dương → âm cùng độ lớn; chain chưa có dòng âm → thêm `xieji10:<entry>:<activity>` −25 (không tạo hard warning) |
| `not_avoided` | Delta âm → 0 (`informational`); giữ dòng dương |
| `no_annotation` (不註/不忌) | Delta → 0; nếu mọi dòng bị bỏ → activity `neutral`, score 50 |
| `not_listed` / `undetermined` | Giữ nguyên |

Lưu ý UI: ô "Sao tốt & sao xấu" (`StarChips`) chỉ hiện 5 sao đầu mỗi nhóm trước "xem thêm" → thứ tự sao là hành vi sản phẩm. Phần sao từ bảng ngày giữ thứ tự `STARS`; sao source-locked nối sau. Test Release A buộc thứ tự giữ nguyên ở ngày tháng âm = Month Jian.
