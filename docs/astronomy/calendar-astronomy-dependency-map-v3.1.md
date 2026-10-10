# Astronomy Dependency Map — Phase 3B.4.1

Read-only inventory dated 2026-10-08. Graphify BFS followed by repository-wide API/import and consumer search. No wiki/index.md exists. Graph edges are navigation evidence; references below were checked in source. Line numbers refer to current workspace.

```text
SearchSunLongitude → solarTermsForYear → getSolarTermAt → getSolarMonth → instant Officer / Group B
                           │                    └→ getSolarTerm → getDayInfo → calendar UI / SEO
                           │                                      └→ solarTermMonthChi → daily Officer → almanac/activity
                           ├→ monthOpeningTerms → termContextAt → calculatePillars → calculateBazi → chart UI
                           └→ Group A → civil-day-before Tứ Ly/Tứ Tuyệt
HourAngle(Sun) → TST → Bazi day/hour (separate direct astronomy primitive)
lunar.ts sunLongitude/newMoon → lunar core (separate existing model)
```

| Primitive/API chain | Exact file/function | Classification | User-visible behavior | Model-change impact |
|---|---|---|---|---|
| SearchSunLongitude | shared/lunar/solarTerms.ts / solarTermsForYear:78 / getSolarTermAt:105 / getSolarMonth:121 | EXACT_INSTANT_REQUIRED | Canonical term/month event; inclusive equality | All roots move; comparisons change only between roots; method/version and cache ownership must stay coherent |
| getSolarMonth | shared/lunar/officers.ts / getOfficerAtInstant:116 | EXACT_INSTANT_REQUIRED | Instant 12 Trực | Jie difference interval changes officer for a fixed civil day branch |
| solarTermMonthChi → getSolarTerm | shared/lunar/officers.ts / getOfficer:106 | DAY_LEVEL_ONLY | Whole crossing day 12 Trực | 1946 Đại Tuyết changes day-month label; 1938 non-Jie has no officer shift |
| solarTermsForYear | shared/bazi/termInstants.ts / monthOpeningTerms:27 / termContextAt:44 | EXACT_INSTANT_REQUIRED | 12 month pillars and Lập Xuân year pillar | Root shifts; Lập Xuân can change year/month; 1946 midnight also affects daily interpretation |
| termContextAt | shared/bazi/pillars.ts / calculatePillars:18 | EXACT_INSTANT_REQUIRED | Four pillars | Month/year move for births between roots; day/hour use TST separately |
| calculatePillars → termContextAt | shared/bazi/index.ts / calculateBazi:7 | EXACT_INSTANT_REQUIRED | Chart candidates and input uncertainty | Changed pillars can change candidate deduplication/status |
| calculateBazi | src/views/DayView/BaziSection.tsx / BaziSection (calculateBazi call:321) | EXACT_INSTANT_REQUIRED | Birth chart UI | Month/year/candidate result changes; minute UI does not remove classification need |
| calculateBazi | src/views/DayView/PersonalFengShuiPanel.tsx / PersonalFengShuiPanel (calculateBazi call:252) | EXACT_INSTANT_REQUIRED | Personal chart context | Same pillar dependency; no new Group B integration implied |
| getSolarMonth | shared/lunar/groupB.ts / evaluateGroupBAtInstant:116 | EXACT_INSTANT_REQUIRED | Five canonical raw stars, API not released | Astronomical context changes; source tables unchanged |
| solarTermsForYear | shared/lunar/groupA.ts / evaluateGroupAAtInstant:133 | DAY_LEVEL_ONLY | Tứ Ly/Tứ Tuyệt civil day before crossing | POTENTIAL_DAY_CHANGE: Tứ Ly at 1938 Thu phân; no Tứ Tuyệt day change found in scan |
| getSolarTermAt | shared/lunar/solarTerms.ts / getSolarTerm:142 / solarTermMonthChi:160 | DAY_LEVEL_ONLY | Legacy daily labels at end-of-day | Two VN crossing dates differ; whole-day labels and startsToday move |
| getSolarTerm | shared/lunar/index.ts / getDayInfo:55 | DAY_LEVEL_ONLY | Calendar day context | Term label/date moves; lunar/Ganzhi/mansion core unaffected |
| getDayInfo + getOfficer | shared/lunar/almanac.ts / getAlmanac:45 | DAY_LEVEL_ONLY | Daily officer/activity recommendations | Daily term/officer propagate to activity rules; legacy stars still lunar based |
| getDayInfo + getAlmanac | shared/lunar/eventEvaluation.ts / evaluateEventDay:59 | DAY_LEVEL_ONLY | Event advice using officer | Officer-based activity check affected on 1946-12-07 |
| getAlmanac | src/views/DayView/DailyActivitySection.tsx / DailyActivitySection (getAlmanac:151,173) | DAY_LEVEL_ONLY | Activity suggestions and hour choices | Officer-derived advice may move on midnight Jie day; hour rules independent |
| getAlmanac | src/views/DayView/AlmanacPanel.tsx / AlmanacPanel (getAlmanac:167; display:194–204) | DISPLAY_ONLY | Term label, minute HH:mm and officer presentation | Minute labels can differ without day change; term civil dates differ in two cases |
| getDayInfo | src/views/DayView/DayCard.tsx / DayCard:15 | DAY_LEVEL_ONLY | Transition-day badge | startsToday changes at two VN midnight cases |
| getDayInfo | src/views/WeekView/WeekView.tsx / WeekView:36 | DAY_LEVEL_ONLY | Calendar day information | Derived solar fields change if displayed; lunar-only projections unchanged |
| getDayInfo | src/views/MonthView/MonthView.tsx / MonthView:61 | DAY_LEVEL_ONLY | Calendar day information | Derived solar fields change if displayed; lunar-only projections unchanged |
| getDayInfo | src/components/MiniMonth/MiniMonth.tsx / MiniMonth:60 | DAY_LEVEL_ONLY | Calendar day information | Derived solar fields change if displayed; lunar-only projections unchanged |
| getDayInfo | src/components/EventDetail/EventDetail.tsx / EventDetail:34 | DAY_LEVEL_ONLY | Calendar day information | Derived solar fields change if displayed; lunar-only projections unchanged |
| getDayInfo → lunar projection | src/components/SearchPanel/SearchPanel.tsx / SearchPanel:63 | DISPLAY_ONLY | Lunar date only at observed call | No user-visible term impact for these lunar-only projections |
| getDayInfo → lunar projection | src/components/EventList/DayGroup.tsx / DayGroup:37 | DISPLAY_ONLY | Lunar date only at observed call | No user-visible term impact for these lunar-only projections |
| getDayInfo + getAlmanac | shared/seo/daySeo.ts / getDaySeo:34 / daySummary:103 / renderDayArticle:130 | DAY_LEVEL_ONLY | SEO term/day badges, officer/activity prose | Static build uses same model; rebuild public daily pages after migration |
| daySeo | scripts/prerenderDays.ts / prerenderDays:109 | DAY_LEVEL_ONLY | Static day pages at build | Generated content changes with model; synchronize build/runtime |
| HourAngle(Body.Sun) | shared/bazi/solarTime.ts / calculateTrueSolarTime:13 | EXACT_INSTANT_REQUIRED | TST day/hour pillar | Separate HourAngle Sun primitive: not a solarTerms consumer; replacing all astronomy could shift TST day/hour |
| calculateBazi versions | shared/bazi/types.ts / BAZI_VERSIONS | DISPLAY_ONLY | Astronomy provenance | Version must describe actual transition and TST model; current 2.1.19 |
| Metadata, no astronomy solve | shared/personalFengShui/rules.ts / birthTime engine provenance:87,461,487 | DISPLAY_ONLY | Rule/source metadata and claimed benchmark | Must update claims if engine/model convention changes |
| Settings input, not a crossing cache | src/data/db.ts / src/data/localRepository.ts / src/data/firestoreRepository.ts / CalendarDatabase / settings persistence | DAY_LEVEL_ONLY | Birth input/settings storage | No persisted term/UTC/TST/pillars schema found; no DB migration evidenced; derived values recompute |
| solarTermsForYear | shared/lunar/solarTerms.ts / yearCache:74 | EXACT_INSTANT_REQUIRED | In-memory 16-year bounded cache | Key is year only; immutable model per process required; future model identity needed on persisted cache |
| Bundled JS solar path | vite.config.ts / src/sw.ts / VitePWA injectManifest / precacheAndRoute | DISPLAY_ONLY | Offline assets | WASM/.se1/.bsp not in existing glob; Option A needs explicit asset precache/integrity/deployment design |
| No solar-term dependency found | functions/src/index.ts / queue.ts / sender.ts / push.ts / email.ts / Firebase reminder delivery | DAY_LEVEL_ONLY | Reminder transport | No shared solar API/import found; no current server crossing API or Vercel config found |
| Imports production APIs; independent Golden where present | shared/lunar/solarTerms.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/lunar/officers.instant.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/lunar/calendarExtendedAudit.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/lunar/groupA.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/lunar/groupB.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/bazi/termInstants.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/bazi/pillars.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/bazi/index.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Imports production APIs; independent Golden where present | shared/bazi/solarTime.test.ts / Test suite | EXACT_INSTANT_REQUIRED | Regression acceptance | Revalidate own-root semantics separately from independent model/reference gates |
| Independent Swiss DE441 | golden-v3/group-b/*.json / manifest.json / calendar-group-b-exact-jie-evidence.json / Frozen 606 and 21 independent roots | EXACT_INSTANT_REQUIRED | Frozen gate | 42 fixed-input record changes under B; all boundary input/provenance needs review; never edit in place |
| Noon convention | shared/lunar/audit-fixtures/calendar-golden-v2.1.json / 100 local-noon records | DAY_LEVEL_ONLY | Phase2.1 regression | No term/month-at-noon classification differences in this sample under A; numeric longitude is separate quantity |
| Separate Meeus-style lunar core | shared/lunar/lunar.ts / sunLongitude / newMoon / solarToLunar | DAY_LEVEL_ONLY | Lunar conversion | Independent existing lunar algorithm, not SearchSunLongitude; do not replace from a solar-term-only migration |

## Precision and reachability limits

EXACT_INSTANT_REQUIRED means binary comparisons at a deterministic model event, not physical millisecond certainty. DAY_LEVEL_ONLY still depends on the exact root to assign its day. DISPLAY_ONLY may expose minute differences. No UNKNOWN consumer remains in the searched repository paths; dynamic/external users of exported APIs cannot be enumerated from repository evidence. Group B/Group A new raw APIs have test/barrel consumers, no new UI integration found. Existing UI star tables remain legacy lunar-month behavior.

No persistent astronomy cache or astronomy HTTP endpoint was found. Settings store birth inputs; solarTerms yearCache is in-memory, bounded at 16 years. SearchPanel and EventList call getDayInfo but use lunar projections only. Calendar-month Can Chi is lunar convention and not the Bazi seasonal-month pillar.

## Options

A moves all shared roots, daily and instant consumers, SEO/build and Group A day assignment. If one-engine policy includes all Sun primitives, A must replace HourAngle/TST too and rerun its independent fixtures; keeping Astronomy Engine for TST would need an explicit scoped interpretation of the policy. B preserves runtime and daily output but changes model authority/spec and requires versioned exact-event tests. C cannot establish a unique month inside a window without selecting a canonical event.
