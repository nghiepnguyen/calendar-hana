# Phase 6 — Thái Tuế / Tuế Phá / Tam Sát

Status: IMPLEMENTED, RELEASE GATES PENDING. Not CLOSED or deployed.
Base: production main `019f9ab`; branch `audit/tai-tue-tue-pha-tam-sat`.
Reviewed 2026-10-09.

## Production inventory

- `shared/personalFengShui/annual/afflictions.ts`: `assessAnnualAfflictions` compares birth/view branches. Its Tam Sát table indexes the birth trine and tests the view year. `assessPersonalAnnualAfflictions` derives both years from lunar dates.
- `shared/personalFengShui/annual/context.ts`: annual personal context also uses lunar years.
- `src/views/DayView/AnnualFengShuiSection.tsx`: renders personal Trực/Xung/Hình/Hại/Phá, Tuế Phá, and Tam Sát hits. `PersonalFengShuiPanel.tsx` owns this personal flow.
- `src/pages/Settings/FengShuiGuideSection.tsx`: explains those personal rules.
- `shared/personalFengShui/rules.ts`: already cautions that branch relations alone do not establish Thái Tuế/Tuế Phá semantics.
- No pre-existing calendar-level annual directional API or directional UI was found. No existing generic daily star identity is replaced by this phase.

Personal interpretation remains outside this audit. Its existing tests and the explicit separation regression protect its behavior; retaining it does not certify its provenance.

## Primary witnesses and individual rules

[欽定協紀辨方書, 四庫全書本, 卷三](https://zh.wikisource.org/zh-hant/欽定協紀辨方書_(四庫全書本)/卷03), sections 太歲, 歲破, 劫煞, 災煞, 歲煞, supplies separate rules. This is a transcription of the primary work, not a survey of modern websites.

Thái Tuế occupies the current year branch. Tuế Phá occupies its opposite branch. Tam Sát combines Kiếp Sát, Tai Sát and Tuế Sát in that order, indexed by the **year's** trine:

| Year trine | Kiếp / Tai / Tuế Sát | Direction |
| --- | --- | --- |
| 申子辰 | 巳 / 午 / 未 | 南 |
| 寅午戌 | 亥 / 子 / 丑 | 北 |
| 巳酉丑 | 寅 / 卯 / 辰 | 東 |
| 亥卯未 | 申 / 酉 / 戌 | 西 |

These are branch positions. The API preserves the single branch for Thái Tuế/Tuế Phá and the ordered three branches plus cardinal label for Tam Sát. It does not collapse the former into an eight-direction label or invent degree widths/24-mountain sectors. Construction prohibitions, remedies, and personal effects require later activity/personal audits.

Each rule has its own ID and section citation, operand `SOLAR_YEAR_BRANCH`, table status `SOURCE_LOCKED`, and `INFORMATIONAL_ONLY` policy. No global score is introduced.

## Year boundary and precision

[卷三十四, 造葬權法](https://www.shidianguji.com/zh/book/SK1619/chapter/1kg94qjcw9hc0) places annual directional turnover around Lập Xuân. It explicitly describes the post-Lập Xuân annual/monthly directions as fixed. This supports `LI_CHUN` for this annual construction-direction tradition. It does not establish a universal year convention for all personal traditions.

The operational implementation uses the exact canonical `lap-xuan` instant from the already-closed JPL DE440s `astronomy-authority-v4 / clock-v1` table. `T-1ms` uses the previous solar year; `T` and `T+1ms` use the new year. Millisecond precision is explicitly `PROJECT_CONVENTION_EXACT_INSTANT`, not a claim that the classical text specifies milliseconds.

Gregorian January 1 and lunar new year are classified `CONVENTION_DIFFERENCE` relative to this directional tradition. They are not fallbacks. Leap months do not participate. API instants require an explicit Z/offset; equivalent offset spellings give identical results. UTC input years 1900–2100 are supported, including the previous solar year 1899 before Lập Xuân 1900.

## Golden and gates

`shared/lunar/audit-fixtures/annual-directions-golden-v1.json` is an expansion of the source rules into twelve literal rows, using Chinese tokens. It was frozen before the production implementation and does not import or execute production code. The four trines were expanded into year rows and the opposite branches enumerated independently of the implementation. It must not be regenerated from production.

`annualDirectionsAuthority.test.ts` checks all twelve rows, individual provenance, policy, invalid operands, timezone-equivalent instants, and 603 boundary cases (201 years × three points). Boundary instants intentionally reuse the closed astronomy authority; this phase does not independently recertify astronomy.

`annualDirectionsRegression.test.ts` scans 1,095 UTC-midnight dates in 2025–2027, checks all three positions against the frozen rows, and distinguishes lunar/Gregorian convention differences. Those differences are expected under the new API; there is no migrated legacy calendar output to classify. The Personal case on 2026-02-10 deliberately retains lunar year 2025 while the calendar API uses solar year 2026.

Run `python3 scripts/audit-annual-directions-mutations.py` **serially**, without simultaneous builds/tests/editing of the authority module. It temporarily mutates the real source and restores it in `finally`. Seven actual mutants must fail semantic assertions: Thái Tuế +1, opposite +5, Tam Sát trine +1, North/South swap, delayed equality, Gregorian fallback, and lunar fallback. Import/compiler failures do not count as kills.

## Production integration and release

Public APIs `getAnnualDirectionsByYearBranch` and `getAnnualDirectionsAtInstant` are exported through `shared/lunar/index.ts`. This is an additive calendar primitive. Existing personal UI and daily recommendation output are preserved. Calendar UI integration belongs to the later Product phase in the roadmap.

Release checklist:

- [x] Inventory and independent source/table audit
- [x] Frozen Golden before implementation
- [x] Calendar authority separated from Personal
- [x] Local validation: 134 test files / 2,721 tests passed; typecheck and lint passed; seven real source mutants killed
- [ ] PR reviewed and branch GitHub CI confirmed
- [ ] Merge to main authorized/completed
- [ ] Main CI and actual Firebase deployment confirmed

Phase 6 must remain open until the final two release checks are confirmed.

Graph maintenance: `graphify update .` completed locally (AST only). Generated graph artifacts are kept local because this checkout includes the pre-existing untracked `graft/` corpus; that corpus is outside the Phase 6 PR.
