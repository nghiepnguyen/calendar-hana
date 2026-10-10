# Astronomy Model Compatibility Decision

Phase **3B.4.1**, audit date **2026-10-08**, decision/architecture only. Recommendation **INSUFFICIENT_EVIDENCE**. Phase 3B.4 remains **BLOCKED_SPEC_CONFLICT**. No migration, thaw, tolerance or Golden repair is authorized or performed.

## Executive summary

The 21 frozen DE441-derived Jie events reproduce within 41 microseconds with an independent crossing/Newton solver and the pinned ephemeris. Current production differs by **−18.835446 to +21.043808 seconds**. Those model-dependent crossings are compatible coordinate definitions, but unequal numerical events.

The expanded six-year sample contains **144 crossings**. A complete **4,824-crossing scan, 1900–2100**, finds two Vietnam civil-date disagreements and one Hong Kong civil-date disagreement. Consequently a model change can affect whole-day features and Group A, not just exact Group B fixtures. The complete pipelines differ by as much as **152.179179 seconds**; that includes time conversion differences. On TT alone, the maximum crossing difference is **56.289938 seconds**, not a claim of an engine's physical error.

Neither adoption option meets its stated evidence gate today. A has a practical compact data candidate, but unverified browser/WASM integration, redistribution licensing and migration validation. B is compact, deterministic and already fits offline architecture, but cannot yet be certified adequate against the existing Bazi ≤30-second independent-reference gate over the supported range. C has no rigorous binary semantics independent of choosing A or B. An authority decision must address **coordinate model + time-scale conversion + serialization + calendar convention**, not merely choose a library name.

This is a completed decision audit with an allowed insufficient-evidence outcome. It is not permission to weaken existing requirements. No option-specific migration plan is created: the request explicitly restricts that artifact to a recommended adoption option, and none qualifies. The next evidence phase is described below.

## Current conflict

A: frozen Swiss compressed DE441 crossings define exact canonical T. B: production must reuse unchanged Astronomy Engine. C: no tolerance, second engine or hard-coded transition table. All three cannot hold simultaneously when the crossings differ.

The exact month convention stays **[T,next T)**; equality selects NEW. Original/patch specs lock apparent longitude and instant-aware month/Trực but do not identify DE441 as a physical millisecond oracle. The later reviewed frozen evidence locks a particular numerical event. Existing DE441 Golden is **not GOLDEN_BUG** merely because it disagrees with production.

Read inputs: all four named specs in `/Users/nghiepnguyen/Downloads`; exact-Jie JSON/review; reviewer decision; independent review JSON/MD; freeze readiness; freeze report; implementation report; test/mutation JSON; regression report; actual shared astronomy, Officer, Group A/B, Bazi, UI, deployment and persistence paths. The spec priority is Source Lock V3 > Spec V3 > Patch2.1 > original spec > Golden > production. No higher-priority document was edited.

Starting HEAD: `b24879b77797a29fdee10bc178acfa07cfeadab0`. Workspace was already dirty with Phase3B.4 implementation/freeze and graph outputs. Status, complete tracked diff, HEAD and pre-audit SHA256 are saved under `tasks/calendar-audit/astronomy-model-v3.1/`. The existing dirty state was preserved.

## Product precision requirement

| Concept | Meaning in this project | Required precision |
|---|---|---|
| Physical astronomical truth | Position/event inferred from observations, Earth rotation, ephemeris and transformations | No physical millisecond/second certainty requirement is established by the calendar specs |
| Numerical model event | Root of specified apparent longitude under pinned model/time conversion | Deterministic root and comparison; runtime ISO Date precision is milliseconds |
| Calendar convention | Choose old/new month with t>=T; UTC+7 civil midnight for calendar operands | Exact equality at the chosen event; no epsilon or ambiguous interval |
| UI precision | Almanac displays HH:mm and daily badges; Bazi input currently uses HH:mm | Minute formatting for time, civil day for daily labels; format does not determine internal cutoff |

Original validation D03/E04 and Patch2.1 §3 require old before/new at and after; they do not imply that nature is known to the timestamp's serialization precision. Group B's current frozen gate nevertheless demands its independently reviewed model T. The Bazi PRD `tasks/prd-birth-time-normalization.md` §9 additionally requires independent fixtures within **≤30s for TST and giao tiết**; the old benchmark covers only 12 month openings in 2024–2025. Its stated pass cannot be generalized to all 1900–2100 crossings. `engineErrorBoundSeconds:30` in solarTime.ts belongs to TST, not an established global crossing error bound.

10–30 seconds can change user-visible Month Jian and instant 12 Trực; Bazi month/year pillars, candidate deduplication and ready/ambiguous status; Group B raw matches where the old/new target discriminates; HH:mm labels near minute boundaries; and civil-date assignment near midnight. Minute-granularity birth input can still fall between roots. No assumption that users' input uncertainty masks astronomy differences is made.

Ordinary daily term and Trực displays need civil-day classification, not subsecond presentation, but depend on which day contains T. Group A uses that day minus one. Search/EventList lunar-only projections, lunar month Can Chi, lunar conversion, day Ganzhi, mansion, day gods and directions do not acquire a solar-term dependency merely by sharing a calendar object.

## Current Astronomy Engine model

Installed/lock-resolved **2.1.19**, MIT; package.json requests `^2.1.19`, so the lockfile is necessary for reproducibility and future canonical authority should pin the release explicitly. Shared primitive is SearchSunLongitude, apparent geocentric tropical ecliptic-of-date. solarTermsForYear solves all 24 sequentially, supports 1899–2101 padding, caches immutable arrays for up to 16 years, and serializes to JavaScript ISO milliseconds. Active term uses <=; Month Jian derives the branch from that term.

Upstream describes truncated VSOP87 and a one-arcminute design goal, **not a universal 30-second event-time guarantee**. [Astronomy Engine primary documentation](https://github.com/cosinekitty/astronomy).

Installed `DeltaT_EspenakMeeus`, default `DeltaT`, `TerrestrialTime` and AstroTime treat Date as approximate UT1/UTC and derive TT using a polynomial. No project SetDeltaTFunction call was found. This time mapping contributes to model-event disagreement independently of the longitude-series model. shared/bazi/solarTime.ts separately uses HourAngle(Sun)/Observer for TST. lunar.ts has its own lunar-calendar sunLongitude/newMoon algorithms; it is not a SearchSunLongitude consumer.

Determinism is practical for a pinned release, immutable process-wide DeltaT policy, JS numeric/Date semantics and unchanged runtime. Cross-browser/platform last-bit equivalence was not newly measured; existing own-root tests validate the inclusive contract. Offline calculation needs no runtime service or ephemeris download.

## Frozen DE441 model

Reference is **pyswisseph 2.10.3.2 / Swiss 2.10.03**, apparent geocentric tropical longitude, true equinox/ecliptic of date, SWIEPH only, nutation enabled, no mean/geometric/heliocentric substitution. Data `sepl_18.se1`, SHA256 `ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66`, measured **484,061 bytes**, actual file header DE441, created 2026-05-26. Coverage JD2378496.5–2597651.3591467496 includes 1900–2100 and padding. Every expanded solve asserts SWIEPH and rejects MOSEPH fallback.

Pinned bytes matter: older Swiss documentation mentioning DE431 does not identify this file. TT roots use solcross plus Newton refinement; frozen evidence used bisection. UTC conversion uses the pinned Swiss functions. Before1972 Swiss treats UT input/output as UT1; far-future outputs use its DeltaT/leap-table fallback, rather than known future UTC. [Swiss time conversion documentation](https://www.astro.com/swisseph/swephprg.htm). Historical/future columns labelled T/UTC below are the serialized model outputs, with that limitation.

DE441 alone does not uniquely specify apparent crossing UTC: precession, nutation, aberration, TT/TDB, DeltaT, leap seconds, root solver and rounding must also be fixed. DE440 is a possible independent JPL substrate over this range, but cannot be presumed bit-identical to frozen Swiss results. [JPL ephemeris export documentation](https://ssd.jpl.nasa.gov/planets/eph_export.html).

## Numerical comparison

Delta = **production serialized T − frozen DE441 serialized T**. Max absolute21.043808s, median absolute8.971878s, nearest-rank p95 absolute18.835446s. All21 same UTC/Vietnam/Hong Kong date. All21 T identities differ; at eight later production roots, fixed frozen at-T records select OLD context. Detailed per-transition columns (both T, delta, all dates, HKO minute, affected IDs/daily result) are in the comparison JSON.

| Jie | Frozen DE441 T (UTC serialization) | Production T | Delta s | Same UTC/+7/+8 date | HKO nearest minute: DE/AE | Fixed-input mismatches |
|---|---|---|---:|---|---|---:|
| jie-2014-02 | 2014-02-03T22:03:16.684536Z | 2014-02-03T22:03:04.781Z | -11.903536 | yes/yes/yes | True/True | 1 |
| jie-2014-03 | 2014-03-05T16:02:15.805446Z | 2014-03-05T16:01:56.970Z | -18.835446 | yes/yes/yes | True/True | 1 |
| jie-2014-04 | 2014-04-04T20:46:39.787483Z | 2014-04-04T20:46:27.245Z | -12.542483 | yes/yes/yes | True/False | 0 |
| jie-2014-05 | 2014-05-05T13:59:26.221400Z | 2014-05-05T13:59:24.306Z | -1.915400 | yes/yes/yes | True/True | 0 |
| jie-2023-03 | 2023-03-05T20:36:14.214332Z | 2023-03-05T20:36:20.289Z | +6.074668 | yes/yes/yes | True/True | 5 |
| jie-2023-04 | 2023-04-05T01:13:03.657937Z | 2023-04-05T01:13:07.237Z | +3.579063 | yes/yes/yes | True/True | 5 |
| jie-2023-05 | 2023-05-05T18:18:45.556920Z | 2023-05-05T18:18:31.575Z | -13.981920 | yes/yes/yes | True/True | 0 |
| jie-2024-01 | 2024-01-05T20:49:22.512852Z | 2024-01-05T20:49:19.758Z | -2.754852 | yes/yes/yes | True/True | 0 |
| jie-2024-02 | 2024-02-04T08:27:07.611503Z | 2024-02-04T08:26:49.630Z | -17.981503 | yes/yes/yes | True/True | 0 |
| jie-2024-03 | 2024-03-05T02:22:46.184919Z | 2024-03-05T02:22:28.877Z | -17.307919 | yes/yes/yes | True/False | 0 |
| jie-2024-04 | 2024-04-04T07:02:17.672062Z | 2024-04-04T07:02:14.725Z | -2.947062 | yes/yes/yes | True/True | 0 |
| jie-2024-05 | 2024-05-05T00:10:05.052803Z | 2024-05-05T00:10:08.464Z | +3.411197 | yes/yes/yes | True/True | 5 |
| jie-2024-06 | 2024-06-05T04:09:53.688941Z | 2024-06-05T04:09:54.092Z | +0.403059 | yes/yes/yes | True/True | 5 |
| jie-2024-07 | 2024-07-06T14:20:03.398193Z | 2024-07-06T14:20:07.101Z | +3.702807 | yes/yes/yes | True/True | 5 |
| jie-2024-08 | 2024-08-07T00:09:16.449044Z | 2024-08-07T00:09:30.136Z | +13.686956 | yes/yes/yes | True/False | 5 |
| jie-2024-09 | 2024-09-07T03:11:20.866192Z | 2024-09-07T03:11:41.910Z | +21.043808 | yes/yes/yes | True/False | 5 |
| jie-2024-10 | 2024-10-07T18:59:57.335789Z | 2024-10-07T19:00:06.976Z | +9.640211 | yes/yes/yes | True/True | 5 |
| jie-2024-11 | 2024-11-06T22:20:04.521878Z | 2024-11-06T22:19:55.550Z | -8.971878 | yes/yes/yes | True/True | 0 |
| jie-2024-12 | 2024-12-06T15:17:02.605598Z | 2024-12-06T15:16:48.690Z | -13.915598 | yes/yes/yes | True/True | 0 |
| jie-2025-01 | 2025-01-05T02:32:46.338815Z | 2025-01-05T02:32:41.099Z | -5.239815 | yes/yes/yes | True/True | 0 |
| jie-2025-07 | 2025-07-06T20:04:59.099337Z | 2025-07-06T20:04:51.895Z | -7.204337 | yes/yes/yes | True/True | 0 |

HKO nearest-minute diagnostic agrees21/21 for reference and17/21 for production. Comparing floor-minute instead gives a different result; neither diagnostic establishes HKO rounding semantics. HKO minute is corroboration, never exact T. There are four inter-model nearest-minute changes among these21. Ordinary daily results have no civil-date shift in these21; exact instant classification can still differ.

## Expanded comparison

| Sample | Crossings | Max absolute pipeline delta | Median absolute | p95 absolute | Max absolute TT-root delta | Different UTC/+7/+8 dates | Nearest-minute changes |
|---|---:|---:|---:|---:|---:|---|---:|
| Existing21 |21|21.043808s|8.971878s|18.835446s|26.114966s|0/0/0|4|
| 1900,1950,2000,2024,2050,2100, all24 |144|126.247363s|12.479962s|117.921961s|28.171201s|0/0/0|46|
| Every year1900–2100, all24 |4824|152.179179s|13.164989s|90.640295s|56.289938s|1/2/1|1618|

p95 uses sorted absolute deltas at index ceil(.95n)−1. Full raw records retain coordinates, TT difference, each time conversion contribution and solve duration. The expanded six-year sample alone misses all civil-date crossings. Its TT maximum is below30s, yet the exhaustive scan finds212/4824 TT-root differences above30s, including99 month-opening Jie. Complete pipeline deltas above30s occur1127/4824 times. These are **cross-model diagnostics**, not additional authoritative Golden or independent physical error certifications.

Largest positive serialized delta: Vũ Thủy2003, +56.039089s, TT +56.289938s, negligible conversion contribution. Largest absolute serialized delta: Lập Xuân2098, −152.179179s = approximately −46.314092s TT-root difference plus −105.865087s time-conversion difference. At Xuân Phân2084, TT differs +9.660941s while serialized times differ −70.254786s; the conversion policy dominates. Attribution solely to truncated VSOP87 would therefore be incomplete.

Future physical UTC/leap seconds are not known now. A numerical calendar can remain deterministic by locking a projection policy, but calling it physical second-level certainty is unsupported. The existing historical midnight cases remain materially relevant regardless of future projection uncertainty. Same-TT residual/crossing comparisons show that not all disagreement disappears by harmonizing time scales.

## Midnight/date risk

| Transition | Swiss model +7 | Production +7 | Affected civil assignment |
|---|---|---|---|
| Thu phân1938,180° |1938-09-23 23:59:27.110109|1938-09-24 00:00:01.461|Vietnam date differs; term day/badge and Tứ Ly move |
| Đại tuyết1946,255° |1946-12-08 00:00:11.018783|1946-12-07 23:59:57.701|Vietnam date differs; daily month and12Trực move |
| Xuân phân2084,0° |2084-03-19 23:00:29.882786|2084-03-19 22:59:19.628|Same Vietnam date; UTC+8 is SwissMar20 00:00:29.882786 vs productionMar19 23:59:19.628 |

UTC date also differs at Lập Hạ2086: Swiss2086-05-05T00:00:01.470119, production2086-05-04T23:58:39.396. Neither +7 nor +8 civil date differs there. Future cases are model-projected, not forecasts with physical second certainty.

At1938ThuPhân the event is not a Jie: daily term/TứLy shift, MonthJian/Officer do not. At1946ĐạiTuyết, the daily UI labels allDec7 as the new month under current production, while reference would keep old month onDec7 and new onDec8. Instant Bazi/GroupB remain defined on continuous instants; only births/evaluations between roots change month, not every birth on that civil date. Daily Bazi interpretation and printed labels can still be affected by changing the assumed day.

## Dependency graph

Full primitive→API→consumer→behavior→precision→impact inventory is in `calendar-astronomy-dependency-map-v3.1.md` and the comparison JSON. Graphify BFS found the shared solar roots and cross-file paths; exact import/call searches verified consumers.

SearchSunLongitude → solarTermsForYear → getSolarTermAt/getSolarMonth → exactOfficer/GroupB; solarTermsForYear → Bazi monthOpeningTerms/termContextAt → calculatePillars/calculateBazi → BaziSection/PersonalFengShuiPanel. The same roots feed GroupA and daily getSolarTerm/solarTermMonthChi → getDayInfo/getOfficer/getAlmanac → day/week/month/minimonth UI, activity advice, event evaluation and SEO/prerender.

Separate direct dependency: HourAngle→TST→Bazi day/hour. No astronomy endpoint or solar-term dependency in reminder Firebase functions was found. No Vercel config exists; Vite static deployment is the architecture examined. External consumers of exported APIs cannot be proven absent by repository inspection.

## Phase2.1 blast radius

| Guarantee | Option A | Option B |
|---|---|---|
| getSolarMonth inclusive own-root behavior |EXPECTED_NUMERICAL_SHIFT + REQUIRES_GOLDEN_REVIEW; preserve inequality|UNCHANGED runtime; REQUIRES_SPEC_CHANGE for explicit model authority|
| getOfficerAtInstant |EXPECTED_NUMERICAL_SHIFT only between relevant Jie roots; REQUIRES_GOLDEN_REVIEW|UNCHANGED runtime; independently restate event authority|
| Bazi exact month/year boundary |EXPECTED_NUMERICAL_SHIFT; REQUIRES_GOLDEN_REVIEW; model/version/TST scope decision|UNCHANGED runtime; REQUIRES_SPEC_CHANGE and adequacy review of≤30s independent gate|
| getSolarTermAt exact boundary |EXPECTED_NUMERICAL_SHIFT; new model's own T inclusive|UNCHANGED runtime, explicit model/version/time policy required|
| Phase2.1 local-noon100Golden records |No term/month classification difference found in this sample; full revalidation still required|UNCHANGED; no in-place edits justified|
| Whole-day UI/month/Officer |EXPECTED_NUMERICAL_SHIFT with day change in scanned range|UNCHANGED runtime|
| Lunar/core/28Tú/day gods/directions |UNCHANGED by solar-root-only replacement; regression required|UNCHANGED|

Phase2.1 specs require instant semantics, not named DE441 equality. A therefore need not rewrite the half-open rule, but needs model/time-policy documentation and independent reference re-review. B is an authority-policy change, not repair of V2.1 noon data. Phase2.1's own-engine equality tests can pass while the independent model differs. Existing noon approximate geometric longitudes are not the same quantity as apparent Sun longitude and cannot become an exact root oracle.

No Phase2.1 spec or Golden changed. The diagnostic100-noon timeline comparison supports retaining these records; it does not certify future/current physical precision. Existing source provenance debts remain excluded.

## Group A blast radius

**POTENTIAL_DAY_CHANGE**, demonstrated for Tứ Ly at1938ThuPhân. Under production, the day-before rule matches1938-09-23; with reference day assignment it matches1938-09-22. The underlying rule itself is unchanged. There is **NO_IMPACT_FOUND for Tứ Tuyệt civil-day assignment within the complete scanned1900–2100 range**; do not generalize beyond that range or a different time conversion/data version. Nguyệt Kỵ is lunar-day-only and unaffected by this solar-root change.

Existing GroupA Golden stays unchanged. A requires review of1938TứLy and the full relevant0/90/180/270 and315/45/135/225 transition-day matrix, including adjacent day assertions and independent samples. B retains current dates but must explicitly define which numerical model the source-convention day refers to; DE441 becomes independent corroboration only after authority approval.

## Group B blast radius

Rule logic is separate from astronomical context. Interior positives130/130, negatives130/130, leap5/5, civil timezone5/5, equivalent representations15/15, alias identity and range table invariants retain the prior evidence. There is no evidence requiring source table/alias/operand extraction to be reopened.

Fresh actual production evaluation of all606 fixed inputs reproduces **42 record-level mismatches:40 exact-boundary,2 rounded-minute**. Only **8 booleans** differ; other failing records differ in MonthJian/target context while the raw boolean can remain false. Exact changed IDs, frozen vs observed context and boolean flags are in JSON#/fixtureImpact. This is why calling every boundary a boolean killer would be inaccurate.

Option A aims to retain the frozen authority and315 existing exact records, but DE441-compatible alone is insufficient for exact equality at a microsecond-serialized T compared with JavaScript millisecond roots. Solver/representation semantics need explicit independent review, not an implicit epsilon. Option B changes authority: with fixed inputs,42 records require different context/target,8 different booleans. If new fixtures instead retain semantic before/at/after roles, all315 boundary timestamps/provenance need re-review/rebinding, plus15 equivalent-format inputs, and5 rounded-minute discriminator positions. Interior260, leap5, civil5 and alias1 are unchanged in the observed fixed-input comparison. No expected values were generated for adoption.

Under B, the frozen files/manifest/reviewer decisions remain immutable and valid for their version. A new Golden version would need independent derivation of the selected numerical convention without importing/calling production; same-library separate solver alone is limited independence and needs disclosed model lineage plus external position/event corroboration. Re-review only astronomical context/authority, exact boundaries, M3/M10 witness effectiveness, day assignment and affected provenance; retain admitted rule proof. Re-run all606, properties/range and qualified mutations after an approved migration. Current qualified mutation acceptance remains blocked by the red baseline;13 diagnostic detections are not10/10 acceptance.

## Option A — DE441-compatible production

| Approach | Browser/server/data/runtime estimate | Offline/determinism/1900–2100 | Licensing/maintenance | Assessment |
|---|---|---|---|---|
| Swiss C compiled to WASM, compressed DE441 |Browser possible; native binding alone is server-only. Measured Sun reference needs484,061B sepl file; WASM/glue bytes and mobile initialization/memory unmeasured. Native24solves≈0.8ms warm here.|Can be offline if hashed WASM/data explicitly cached. Coverage verified. Pin flags, data, time conversion and solver; reject Moshier fallback.|Swiss dual AGPL/professional; wrapper may add obligations. Async initialization/filesystem/data supply and package maintenance need review.|Most direct frozen-model candidate; **feasible in principle, NOT_READY**. Data size alone is not a reason to reject it.|
| Native Swiss service |Server can run C/Python/Node wrapper; browser needs network. Cold deploy packaging/native ABI portability unmeasured.|Service-only loses offline arbitrary-year calculation unless all needed results are cached/distributed; single authority across clients must be enforced.|Same licensing gate; server operation does not erase AGPL/professional issue. Operational API/availability/cache costs.|Does not meet current offline scope as a sole live service.|
| Direct DE441/DE440 SPK subset + apparent-coordinate/time pipeline |Use Sun/Earth (and Earth-Moon center correction if required) coefficients, reader and transformations. Full kernels overkill; size of validated selected subset unknown, likely larger than measured sepl in a naive extraction.|Portable JS/WASM possible; subset must include padding1899–2101 and solve arbitrary instants. Deterministic pinned coefficients/time policy.|Reader/toolkit and kernel rights separate. High validation/maintenance complexity; JPL kernel alone does not reproduce Swiss transformations.|Viable research candidate; no package benchmark or frozen equality proof. DE440 is not automatically accepted as DE441-compatible.|
| Generated high-order position coefficients |Versioned fitted position polynomials, not event dates; evaluate and solve runtime crossings. Bytes/error depend on segment length/degree; no supported-range error envelope measured.|Can fit offline small static artifact, deterministic generator/model/data pinning; range-edge/midnight errors must be bounded.|Derivative data redistribution needs review; fitting/source/tooling maintenance high.|Does not inherently violate no hardcoded Gregorian transition rules, but cannot recommend without rigorous independent bound.|
| Existing higher-precision library/full VSOP87 |Browser/server depends on implementation. Not inherently DE441-identical even if nominal accuracy improves.|Requires complete shared-coordinate/time pipeline and coverage proof.|Each package/code/data license and maintenance must be audited.|No demonstrated drop-in candidate for frozen equality.|
| Build-time annual transition generation |201×24=4824event timestamps before padding; Float64 storage≈38,592B raw, JSON/provenance larger. Fast lookup.|Offline/deterministic only for generated range; solver absent in production.|Generated-data rights/generator reproducibility still needed.|This **is a transition lookup table** and conflicts with the existing no-hardcoding constraint unless explicitly amended. Not recommended here.|

A migration would affect shared solarTerms, Bazi term/pillar/version provenance, exact/day Officer consumers, GroupA, GroupB contexts, SEO build and PWA asset handling. If one-engine policy covers all Sun astronomy, HourAngle/TST also must migrate; retaining Astronomy Engine only for TST would require an explicit scoped policy decision, not silent coexistence. Replacing lunar conversion is outside this phase and not implied by improving solar terms.

## Option B — Astronomy Engine canonical

A pinned current model provides one practical deterministic calendar event, preserves runtime deployment/offline behavior and current day assignments, and could preserve all source-derived monthly sequences and[T,nextT). It is not equivalent to proving DE441 freeze equality or the physical≤30s requirement.

To qualify, explicitly lock model/version, apparent coordinate definition, Espenak/Meeus TT mapping, historical/future UTC approximation, supported range, solver/serialization and precision/uncertainty policy. Keep DE441/HKO as independent numerical/astronomical references with an accuracy acceptance gate that is separate from domain equality. Existing PRD30s gate cannot silently become a±153s test to admit production. The present scan raises a material adequacy issue, including historical TT-only cases, not just unknowable future leap seconds.

A rebaseline must be versioned and independently approved, never an edit of the frozen606. No new authoritative Golden was created. Option B becomes recommendable only after the precision/time policy and an independent representative reference review establish adequacy, or an explicitly approved product/spec change establishes a different numerical-convention requirement.

## Option C — compatibility policy

**OPTION C NOT RECOMMENDED.** “Within±N seconds” says how close two models are, not whether Month Jian is OLD or NEW. Choosing OLD throughout the window delays T; NEW advances T; either chooses a different deterministic T and changes[T,nextT). Choosing either at each client's local root gives client-dependent answers. Returning both/unknown would change the binary domain/API and introduce a new product policy, not satisfy the current contract.

A single pinned midpoint root would be deterministic but is a new hybrid authority requiring two models/data and violates current constraints; it offers no independent domain justification. A display/input-uncertainty window may annotate confidence while retaining exact canonical output, but does not reconcile the frozen boundary gate.

Numerical **test tolerance** can quantify coordinate/time reference agreement for a selected model. Domain tests must still assert OLD at T−1ms, NEW at T, NEW at T+1ms for the canonical representation. M3 (> instead of>=) must be killed at that T. If the compatibility window lets OLD pass at T, it removes precisely that discriminatory witness. A broad cross-model accuracy gate must not swallow exact equality tests.

## Licensing

Astronomy Engine installed package declares **MIT**; preserve its notice. No ephemeris data download or new copyleft dependency is needed for B. Existing npm lockfile is preserved.

Swiss library is **dual AGPL / Swiss Ephemeris Professional License**. The official conditions apply before redistribution or operating a public service; authors describe whole-project compatible licensing under the free route. [Swiss license](https://raw.githubusercontent.com/aloistr/swisseph/master/LICENSE), [official licensing guidance](https://www.astro.com/swisseph/swephinfo_e.htm). Do not infer that “commercial” forbids AGPL use; commercial/open-source and proprietary are different choices. This project's package has no declared distributable license, and no professional contract was verified. Browser WASM, wrapper, service and modified library routes require matching rights/notices.

The measured `.se1` is Astrodienst-produced compressed JPL data. Library license, data redistribution and generated-data rights are distinct questions. The reviewed license does not independently settle every compressed-data redistribution use case: **LICENSE_REVIEW_REQUIRED** for sepl shipping and derived coefficients/tables. JPL/NAIF kernel/toolkit rules must be checked for a direct reader route; public availability alone is not a universal license. [NAIF use rules](https://naif.jpl.nasa.gov/naif/rules.html). No legal certainty or new dependency approval is claimed.

## Browser/PWA/deployment impact

Current Vite React app computes locally; PWA injectManifest precaches JS/CSS/HTML/images/fonts, ignores prerender day pages and does not currently include.wasm/.se1/.bsp. B adds no runtime/bundle/data cost. Source-only authority metadata and tests can change later without network astronomy.

A WASM design is plausible with the small measured sepl file; must prove content hash validation, startup sequencing, offline first-use after install, missing-file failure, memory budget, service-worker version consistency, build asset MIME/path behavior and CI reproducibility. A pure server ephemeris conflicts with offline and introduces request/data privacy questions for Bazi, whose PRD prohibits sending birth data to an astronomy service. Even requesting nonpersonal annual roots needs an offline cache policy and one pinned authority.

Static Vercel deployment can serve validated assets, but native Swiss runtime requires a backend/native/WASM packaging decision; no current Vercel backend configuration exists here. This is architectural analysis, not a deployment-limit claim. SEO generation and clients must use the same canonical model/version. In-memory yearCache must never mix models under a year-only key. No persisted UTC/TST/pillar schema was found; birth settings are recomputed.

## Performance

Measured on this host in isolated read-only audit harnesses; these numbers are not a browser/mobile performance contract:

| Metric | Current Astronomy Engine | Swiss reference native Python |
|---|---|---|
| Cold module load |3.446ms single Node import|2.389ms native import +0.652ms path setup|
| First crossing |0.705ms single Node first solve|0.254ms native first root|
| Annual24 warm solve |Median0.203ms; p950.309ms over203cache-miss years|Median≈0.8ms over203years; ≈0.034ms/transition|
| JS/data bytes |Browser minified116,424B; gzip46,803B; no external data|sepl484,061B; binding/WASM bundle not measured|
| Memory |Node total RSS≈59.6MB after import/solve; **not incremental engine memory**|Native total process peak RSS≈19.0MB; **not incremental binding memory**; WASM/mobile memory unmeasured|
| Actual app bundle delta |0 for B; current app budget unchanged|Unknown until integration; at least required data plus WASM/glue/cache copies|

Native Swiss need not be slow, and DE441's enormous full historical range does not require bundling a full multi-gigabyte kernel for Sun crossings. A supported-range-specific runtime can be practical; it still lacks deployment/license gates. No permanent package was installed or package/lock modified. Reference reused existing temporary binding and hashed data. Audit snapshots are not runtime assets.

## Risk matrix

Levels describe strength for positive criteria; **HIGH means more risk/cost** for rows explicitly marked risk. No summed score.

| Criterion | A | B | C |
|---|---|---|---|
| Astronomical fidelity |HIGH potential for pinned reference; whole time policy still required|MEDIUM; observed small typical TT difference with >30s outliers|LOW as authority; a window does not improve model fidelity|
| Frozen Golden compatibility |HIGH potential; exact numerical representation not yet proven|LOW; authority/version must change|LOW; equality ambiguity remains|
| Existing production compatibility |LOW; shared model migration|HIGH; runtime preserved|LOW/MEDIUM; new policy changes boundary/API|
| Phase2.1 blast radius risk |HIGH; roots and day assignments shift|MEDIUM; authority/precision re-review, runtime stable|HIGH; ambiguous instant guarantees|
| Browser/PWA fit |MEDIUM; WASM/data integration plausible but unverified|HIGH; current local JS|MEDIUM only if annotation; fails binary contract|
| Bundle/data cost risk |MEDIUM for compact Swiss; HIGH for naive full kernels|LOW; existing bundle|LOW toHIGH depending on one/two engines|
| Performance strength |MEDIUM; native fast, browser unmeasured|HIGH for current observed Node path|UNKNOWN semantics represented as LOW confidence, not measured benefit|
| Licensing confidence |LOW; LICENSE_REVIEW_REQUIRED|HIGH; MIT known|MEDIUM; inherited chosen-engine rights|
| Determinism |HIGH potential with full pipeline pinning|HIGH under pinned numerical convention|LOW unless selects one T, then reduces to authority option|
| Maintenance cost risk |HIGH; transformations/assets/license/build|LOW/MEDIUM; model/version and independent review|HIGH; policy edge cases/mutation weakening|
| Migration risk |HIGH; runtime and regression|MEDIUM; versioned authority/Golden and product precision|HIGH; changes mathematical contract|

The performance C cell uses LOW confidence because it is not a viable defined algorithm. Scores do not promote an arbitrary winner. A's small-data/native-performance evidence improves feasibility; B's observed precision/date cases lower adequacy confidence. Both are assessed independently of “already production” or “more precise is always better.”

## Recommendation

**INSUFFICIENT_EVIDENCE.** Do not adopt A/B/C in this phase.

Concrete unresolved gates: a complete canonical time-scale/serialization convention; independent validation of the Bazi≤30s accuracy requirement over the declared range using comparable coordinate/time definitions; explicit treatment of historical/future time uncertainty; Option A browser/WASM cold/data/memory/offline and reproducible-build proof; separate library/data redistribution licensing. The findings are sufficient to reject a tolerance-only solution and a blanket “10–30 seconds never affects a day” assumption. They are insufficient to assert either adoption option meets all decision principles.

GroupB blocker stays astronomical MonthJian T. No source table re-extraction is warranted. Newly found GroupA/day-label blast radius and Bazi time-policy requirement are related migration risks, not new GroupB rule defects. Prior Phase1/2.1/GroupA implementation PASS is retained under its tested convention; no broader independent ephemeris-accuracy claim is inferred.

## Next phase

An explicitly authorized **evidence/authority decision phase**, before migration:

1. Lock desired astronomy/event convention and the interpretation of “one shared engine,” including TST scope. Separate physical reference accuracy from exact domain comparisons, milliseconds from true physical certainty, UTC from UT1 projections, and uncertainty from a switching window. Preserve[T,nextT).
2. Independently compare TT longitude/root and common time mappings over all12Jie and24terms; include1938ThuPhân,1946ĐạiTuyết,2003VũThủy,2098LậpXuân and2084/2086 date projections. Obtain an independent reference/position review rather than assume these Swiss-vs-AE deltas are physical truth errors. Confirm/revise product precision only by explicit approval.
3. If investigating A, isolate a pinned Swiss WASM build/data prototype or validated direct JPL subset; resolve license and data rights; benchmark actual browser/mobile cold init,24terms, memory, data/bundle and offline/static deployment. No production inclusion until gate approval. Benchmark targets should be set against current app cold-start budget, not invented from Node timings.
4. Reissue a decision A orB only after its gates hold. Then create **only that option's migration plan** with affected files, immutable new Golden version where needed, independent exact-boundary review, M3/M10 and all mutations, Phase2.1, GroupA, GroupB606/range/regression, performance/license gates and rollback. Rollback must preserve a recoverable snapshot of the current dirty Phase3B.4 state as well as checkpointb24879b; HEAD alone does not contain groupB.ts.

No step executed beyond this read-only audit. No migration plan file is created for an unselected option. STOP; explicit authorization is required for any further phase.

## Reproduction and verification

Audit code/output under `tasks/calendar-audit/astronomy-model-v3.1/`; no runtime imports refer to it. `production-sample.mjs` calls the actual unchanged production APIs through Vite SSR, with HMR/dependency scanning disabled. It also records independent library TT values for decomposition. `reference-sample.py` validates data SHA256, uses Swiss solcross/Newton with required flags, and converts via pinned Swiss rules. JS millisecond serialization contributes at most about1ms truncation; this does not explain second-level differences. Sample and full-range timelines are diagnostic only.

Commands:

```sh
node tasks/calendar-audit/astronomy-model-v3.1/production-sample.mjs
PYTHONPATH=/tmp/hana-independent-ephemeris /Users/nghiepnguyen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tasks/calendar-audit/astronomy-model-v3.1/reference-sample.py
python3 tasks/calendar-audit/astronomy-model-v3.1/write-reports.py
npx vitest run shared/lunar/solarTerms.test.ts shared/lunar/officers.instant.test.ts shared/lunar/groupA.test.ts shared/bazi/termInstants.test.ts shared/bazi/pillars.test.ts shared/bazi/solarTime.test.ts shared/bazi/index.test.ts
npx vitest run shared/lunar/groupB.test.ts
npm run lint
npm run typecheck
graphify update .
```

For another host, recreate an isolated pyswisseph2.10.3.2 environment and download the official sepl data URL from frozen evidence; validate pinned SHA256 before reuse. These dependencies remain outside the project. The comparison script's external ephemeral paths must be adjusted; no installed production dependency should be inferred from this reproduction recipe.

Fresh focused regression: **160/160 PASS**, zero skipped. GroupB: **586/636 PASS,50FAIL**, zero skipped, matching the prior42Golden+8independent-T property failures. Known red tests were neither disabled nor repaired. No full E2E/build rerun was needed for unchanged runtime; prior13screenshot failures and formatting debt remain documented without reclassification. Final audit integrity and static checks are recorded in the companion integrity JSON.
