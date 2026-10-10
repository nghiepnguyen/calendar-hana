# Calendar V3 — Pending rules

These nine rules remain outside authoritative Golden V3. Source-family locking does not settle calendar basis, scope or lookup semantics.

| Rule | Status | Evidence found | Required before admission |
|---|---|---|---|
| Nguyệt Phá | PARTIAL / PENDING | Primary symbolic lookup in 卷四 / 義例二 / 月破 / 考原曰 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; confirm scope and alias policy |
| Kiếp Sát | PARTIAL / PENDING | Primary symbolic lookup in 卷六 / 義例四 / 刼煞 / 李鼎祚曰 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; confirm scope and alias policy |
| Tai Sát | PARTIAL / PENDING | Primary symbolic lookup in 卷六 / 義例四 / 月災煞、天獄 / 按 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; confirm scope and alias policy |
| Nguyệt Sát | PARTIAL / PENDING | Primary symbolic lookup in 卷六 / 義例四 / 月煞 / 歴例曰 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; confirm scope and alias policy |
| Nguyệt Đức | PARTIAL / PENDING | Primary symbolic lookup in 卷五 / 義例三 / 月徳 / 歴例曰 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; confirm scope and alias policy |
| Thiên Đức | PARTIAL / PENDING | Primary symbolic lookup in 卷五 / 義例三 / 天徳 / 堪輿經曰 | Review source month binding, exact cutoff vs civil label, leap handling, independent date positives/negatives; resolve four trigram operands |
| Thụ Tử | VN / UNVERIFIED | Existing project table; candidate 選擇紀要 受死 | Project-approved Vietnamese edition/location and boundary/leap policy |
| Sát Chủ | VN / UNVERIFIED | Different legacy monthly tables documented | Decide named variant and canonical Vietnamese source; do not merge tables |
| Tam Nương | VN / UNVERIFIED | Existing lunar-day set only | Approved Vietnamese source with exact wording/scope |

## Existing project conventions — descriptive only

- Thụ Tử month1→12: Tuất, Thìn, Hợi, Tỵ, Tý, Ngọ, Sửu, Mùi, Dần, Thân, Mão, Dậu (`shared/lunar/stars.data.ts`). Existing prose says generally bad except hunting; **not admitted as V3 activity logic**.
- Sát Chủ month1→12: Tỵ, Tý, Mùi, Mão, Thân, Tuất, Sửu, Hợi, Ngọ, Dậu, Dần, Thìn (same file). A previous project attachment describes a separate sequential Dương table Tý→Hợi, differing10/12, agreeing only months4 and10. Other project docs also discuss an Âm table with months7/8 = Hợi/Sửu, while the general legacy table has Sửu/Hợi. These are distinct conventions, not interchangeable canonical labels.
- Tam Nương days3,7,13,18,22,27 (`shared/lunar/auspicious.ts`); prose lists construction/wedding/travel/opening. This is legacy data, not source evidence.
- Current legacy Nguyệt Kỵ prose “kỵ đi xa, làm việc lớn” is broader than the raw V3 day-membership extraction. It was not copied as a canonical effect or changed in production.

## Source candidates and differences

[選擇紀要 / 上編 / 嫁娶類 / 披麻・紅紗・受死](https://zh.wikisource.org/wiki/選擇紀要/上編) is a traceable different work, mentioned in a prior project audit. It is not XJBF_QD, not a Vietnamese source approved by this V3 lock, and does not promote Thụ Tử to Tier A or verified VN. Prior project “verified” labels describe earlier legacy scope only; Source Lock V3 controls this package.

No approved source was found in the supplied V3 registry for Sát Chủ or Tam Nương. This is absence of sufficient evidence in this audit, not proof no canonical source exists. Blogs/app consensus were not used.

## Outstanding reviewer decisions

1. Confirm source-transcription extraction and Group A candidate anchors; optionally collate with a scan/edition.
2. Bind each Group B source-month symbol to the project calendar context from explicit source wording; do not assume one lunar/solar convention across all rules.
3. Resolve Thiên Đức stem/trigram/day/direction interpretation without branch substitution by guesswork.
4. Select Vietnamese canonical source/edition and variant names for each VN extension, including leap handling.
5. Review activity scopes and precedence separately; no whole-day verdict, severity or scoring inferred.

Group B symbolic positive/negative anchors and normalized tables are preserved for review in extraction JSON, not in `golden-v3/`. No production engine or migration was implemented.
