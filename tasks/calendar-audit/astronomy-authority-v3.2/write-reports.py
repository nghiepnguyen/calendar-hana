import json,math,datetime as D,hashlib
from pathlib import Path
root=Path.cwd();base=root/'tasks/calendar-audit/astronomy-authority-v3.2'
load=lambda p:json.loads(Path(p).read_text())
ind=load(base/'independent-reference.json');old=load(root/'tasks/calendar-audit/astronomy-model-v3.1/reference-comparison.json');bench=load(base/'browser-benchmark.json');impact=load(root/'tasks/calendar-audit/astronomy-model-v3.1/fixture-impact.json')
lookup={(x['year'],x['longitude']):x for x in old['fullRange']['transitions']}
for x in ind['rows']:
 p=lookup[x['year'],x['longitude']];x.update({k:p[k] for k in ['de441T','astronomyEngineT','sameUTCDate','sameVietnamCivilDate','sameHongKongCivilDate','productionDeltaTSeconds','referenceTTMinusSerializedUTCSeconds']})
valid=[x for x in bench['browsers'] if 'cold' in x];parity=[]
for x in valid:
 mism=[]
 for y in x['cold']['rows']:
  t=D.datetime.fromisoformat(lookup[y['year'],y['longitude']]['de441T']);m=math.ceil(t.timestamp()*1000)
  if m!=y['event']['epochMs']:mism.append(dict(year=y['year'],longitude=y['longitude'],nativeEpochMs=m,wasmEpochMs=y['event']['epochMs']))
 parity.append(dict(browser=x['name'],count=288,nativeSerializationMismatches=mism))
assert all(x['cold']['rows']==valid[0]['cold']['rows'] for x in valid)
(base/'serialized-parity.json').write_text(json.dumps(dict(crossBrowserExactAgreement=True,canonicalBrowserEvents=288,nativeComparison=parity),indent=2))
mandatory=[(1938,180),(1946,255),(2003,330),(2014,345),(2024,315),(2084,0),(2086,45),(2098,315)]
selected=[x for x in ind['rows'] if (x['year'],x['longitude']) in mandatory]
licenses=dict(library='REQUIRES_COMMERCIAL_LICENSE',auditWrapper='AGPL_COMPATIBILITY_REQUIRED',compressedData='REQUIRES_COMMERCIAL_LICENSE',productionRoute='Professional contract covering C and compressed files + independently owned minimal FFI wrapper, or documented project-wide AGPL compatibility',generatedData='No generated authority table distributed; if contemplated separately review distribution rights; not an authorized substitute for runtime roots',contract='https://www.astro.com/swisseph/secont_e_2609.pdf',wrapperNotice='https://github.com/kuntayerkus/swisseph-wasm',signedLicensePresent=False)
evidence=dict(phase='3B.4.2',selectedAuthority='ADOPT_DE441_CANONICAL',scope='SHARED_SOLAR_TERM_ENGINE_ONLY',independentReference=ind,browserBenchmark=bench,serializationParity=load(base/'serialized-parity.json'),mandatoryEvents=selected,prior21=old['existing21'],priorFullRangeSummary={k:v for k,v in old['fullRange'].items() if k!='transitions'},fixtureImpactB=impact,fixtureImpactA=dict(interiorRetained=260,oldExactBoundaryRecords=315,oldAtTInputsWhoseJianChanges=105,oldAtTBooleanChanges=16,beforeAfterMinuteRetained=210,leapRetained=5,timezoneCivilRetained=5,timezoneEquivalenceRetained=15,aliasRetained=1,roundedMinuteRetained=5,newGoldenRequired=True,note='Projected from explicit ceil-ms policy: all 21 frozen microsecond events parse below ceil-ms T; 5 at-T records each. These are diagnostic projections, not replacement Golden or production test results.'),licensing=licenses,precisionClassification='independent validation target; clarify time scale by SPEC_CHANGE without widening TT accuracy threshold',rejectedAuthorityReason='210 independently tested TT roots exceed 30s; no approved product accuracy relaxation, larger civil-day/UTC projection differences; A practical and license route actionable',provenance=['hashes-before.json','dirty-workspace-before.zip','independent.py','browser.mjs','vite-probe.mjs','https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp','https://rhodesmill.org/skyfield/api-framelib.html','https://www.astro.com/swisseph/swephprg.htm','https://raw.githubusercontent.com/aloistr/swisseph/v2.10.03/swephexp.h'])
(root/'calendar-astronomy-authority-evidence-v3.2.json').write_text(json.dumps(evidence,indent=2,ensure_ascii=False)+'\n')
rows='\n'.join(f"| {x['year']} {x['name']} | {x['swissMinusIndependentSeconds']:+.6f} | {x['aeMinusIndependentSeconds']:+.6f} | {x['pipelineDeltaSeconds']:+.6f} | {x['timeConversionContributionSeconds']:+.6f} |" for x in selected)
assets='\n'.join(f"| {x['file']} | {x['bytes']} | {x['gzipBytes']} | {x['brotliBytes']} |" for x in bench['assets'])
perf='\n'.join(f"| {x['name']} {x['version']} | {x['cold']['initMs']:.2f} | {x['cold']['firstRootMs']:.2f} | {x['cold']['annual24Ms']:.2f} | {x['warm']['annual24Ms']:.2f} | {x['offlineReload']} |" for x in valid)
report=f'''# Astronomy authority decision v3.2

**ADOPT_DE441_CANONICAL.** Scope: **SHARED_SOLAR_TERM_ENGINE_ONLY**. Decision recommendation only; production migration is not executed or release-approved.

Independent evidence now favors the Swiss/DE441 apparent-longitude model, and an isolated browser implementation is viable. Licensing has a concrete Professional/owned-wrapper route. This resolves the earlier INSUFFICIENT_EVIDENCE; it does not reinterpret Group B source rules as wrong. No numerical scoring or OLD/NEW tolerance is used.

## Product precision and specification decision

Four different contracts apply: astronomical TT accuracy, deterministic numerical reproducibility, exact domain equality, and HH:mm/civil-day presentation. A physically uncertain future wall clock can still have one deterministic model event. Display minute precision does not authorize moving a domain cutoff.

The Bazi PRD §9 <=30s requirement is an **independent validation target**, inherited from a limited JPL/Horizons 2024–2025 benchmark, rather than a demonstrated universal physical wall-clock bound. Birth-time uncertainty and HH:mm display do not scientifically establish 30s, but it remains an admitted gate; this phase does not relax it to make Astronomy Engine pass.

**SPEC_CHANGE proposed, not applied:** old: <=30s giao-tiết independent-reference comparison without a fully explicit scale. Proposed: retain <=30s for roots in TT against an independently implemented matching apparent coordinate frame; separately validate serialized time against the pinned conversion policy and known leap-second data. Historical UT1 and future projected wall clocks must identify their convention and must not claim physical UTC certainty <=30s. Exact domain comparison has zero allowance. Reason: TT-root accuracy, Earth rotation and future leap seconds are separate quantities. Impact: provenance/uncertainty wording changes, future labels may change when clock policy is versioned, no dual-answer interval. Tests affected: Bazi independent giao-tiết benchmarks, solar-root reference tests, time-conversion/serialization fixtures. Existing TST <=30s target stays separate and unchanged. This is specification clarification, not a bug fix or an adopted widening.

## Independent astronomical evidence

Downloaded official JPL DE440s, SHA256 `{ind['kernelSha256']}`, and used Skyfield 1.55/jplephem 2.24 apparent geocentric true-ecliptic/equinox-of-date coordinates. No Swiss coordinate computation is used by this reference. All 4,824 roots, every 12 Jie and remaining 12 terms for each year 1900–2100, were re-solved in TT. Starts at AE TT ±0.25 day converged independently to identical doubles; reference angle evaluations, not either input timestamp, determine the root. DE440 versus DE441 and independent precession/nutation choices remain a small comparison difference, not an exact Swiss oracle. [Skyfield planetary data](https://rhodesmill.org/skyfield/planets.html), [reference frame definition](https://rhodesmill.org/skyfield/api-framelib.html).

Swiss minus independent: max absolute **0.084208s**, median 0.013076s, p95 0.039813s; zero >30s. AE minus independent: max absolute **56.288892s**, median 9.792484s, p95 29.225577s; **210 >30s**. This supports a fidelity choice, not microsecond physical truth. Full arrays and source hashes are in evidence JSON. Prior 212 Swiss/AE >30s and new 210 independent/AE >30s are distinct comparisons.

| Mandatory event | Swiss−independent TT s | AE−independent TT s | AE−Swiss serialized s | conversion contribution s |
|---|---:|---:|---:|---:|
{rows}

1938 Thu Phân is predominantly longitude/root difference; 1946 Đại Tuyết crosses a civil day with only ~13s root shift. 2003 Vũ Thủy is a ~56s TT approximation discrepancy independently supported. 2014 Kinh Trập and 2024 Lập Xuân have both longitude and smaller clock effects. 2084 Xuân Phân and 2086 Lập Hạ are dominated by projected clock mappings; 2098 Lập Xuân combines ~46s TT discrepancy with ~106s conversion discrepancy. Those future UTC differences cannot be called physical engine error from a Swiss comparison alone. Historical Delta-T uncertainty affects wall-clock accuracy but cannot explain a TT-only discrepancy. Millisecond serialization cannot explain tens of seconds. HKO tables remain minute corroboration of the existing 21, never exact T.

Prior findings preserved: existing 21 serialized −18.835446..+21.043808s, same Vietnam dates; 4,824 maximum complete-pipeline absolute 152.179179s, maximum TT intermodel 56.289938s, Vietnam date changes in 1938 and 1946, Hong Kong change in 2084, UTC change in 2086. No outlier discarded.

## Complete canonical event definition proposed

Definition ID **solar-term-swiss-de441-2.10.03-tt-clock-v1-ceil-ms-v1**. Runtime root authority is one pinned WASM artifact and owned FFI algorithm, same bytes in browser, server and prerender. Audit artifact @kuntay/swisseph 0.2.2 establishes feasibility only; its AGPL wrapper is not automatically approved production code.

- Data: only `sepl_18.se1`, DE441 header, SHA256 `ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66`. Coverage includes 1899–2101 padding. No lunar ephemeris is required for the Sun. One isolated instance, mounted data before calculation; never load auxiliary Delta-T, leap-second or Earth-orientation files silently.
- Observable: Sun apparent geocentric tropical longitude, true ecliptic/equinox of date, crossings at 0,15,…345 degrees. Flags `SWIEPH=2`, Newton evaluation `SWIEPH|SPEED=258`. No TRUEPOS, NONUT, J2000, HELCTR, TOPOCTR, SIDEREAL, JPLHOR or JPLHORA. Light-time, relativistic aberration and default deflection handling stay in the pinned Swiss implementation.
- Models: Vondrak 2011 precession, IAU2000B nutation, IAU2006 frame bias; Swiss 2.10.03 default Stephenson et al. 2016 Delta-T branch/table/extrapolation and ephemeris-selected tidal acceleration. Do not substitute AE Espenak/Meeus. Models and all tables are part of artifact identity. [Pinned header](https://raw.githubusercontent.com/aloistr/swisseph/v2.10.03/swephexp.h).
- Root: TT Julian days. Gregorian year January 1 at 00:00 interpreted as TT numeric seed (`swe_julday(y,1,1,0,GREG_CAL)`), `swe_solcross(angle,seed,SWIEPH)`, then at most six Newton corrections using wrapped signed residual and returned longitude speed; stop if next binary64 JD equals current. Require returned ephemeris SWIEPH on every evaluation; errors, missing/corrupt data, coverage or model mismatch fail closed. Root must belong to requested year and maintain 24 ordered crossings. No per-date repair or production hard-coded table.
- Mapping: `swe_jdet_to_utc(TT,GREG_CAL)` in the same initialized Swiss instance. Pre-1972 output is model UT1, carried on the project civil/POSIX axis and labeled historical UT1 convention; not historical atomic UTC. From 1972, use embedded leap table through 2016-12-31 (TAI−UTC37s thereafter) and TT−TAI32.184s. Freeze that table: no uncontrolled device update.
- Future: retain exact Swiss 2.10.03 converter behavior, including its UT1 fallback when Delta-T minus leap count minus32.184 exceeds1s. These values are **projected civil-time convention**, not known future UTC. Version any leap/table/conversion change and re-review impacted Golden/days; never reinterpret future output as immutable physical UTC. [Conversion documentation](https://www.astro.com/swisseph/swephprg.htm).
- Serialization: take returned Gregorian year/month/day/hour/minute with seconds double `s`; canonical epoch ms = `Date.UTC(y,m−1,d,h,min,0) + ceil(s*1000)`, normalize overflow, serialize ISO with exactly three fractional digits. Leap-second events unsupported on this POSIX axis must fail explicitly, not collapse a second. This picks the first integer millisecond at/after the converted numerical root. Sub-ms detail is not domain authority.
- Domain: integer epoch comparison `[T,nextT)`: T−1ms OLD; T NEW; T+1ms NEW. Cached events keyed by full engine/data/model/clock/serialization version and year; one shared immutable result, no client-local alternative roots or epsilon. Public range1900–2100, internal1899–2101. Pin all C/WASM, glue, FFI, data and build hashes before migration.

The audit WASM SHA256 is `{bench['assets'][0]['sha256']}`; glue `{bench['assets'][1]['sha256']}`. A Professional build must receive a new recorded artifact identity and independently reviewed roots if bytes or serialized outputs change; naming the same C version alone is insufficient.

## Option A technical and license gate

Actual browser measurements on this desktop, localhost uncompressed assets, single runs; coarse timer zeros mean below browser resolution, not no cost. Cold includes fetch, compile and data mount; warm here means a fresh instance after browser cache/JIT warm-up, followed by a repeat 24-term calculation. No internet/mobile bandwidth extrapolation.

| Asset | raw B | gzip B | brotli B |
|---|---:|---:|---:|
{assets}

These sum WASM/glue/data; wrapper modules add bytes. They do not represent a full product bundle. Ephemeris is already compressed, so savings are modest.

| Browser | cold init ms | first root ms | annual24 ms | warm annual24 ms | offline reload |
|---|---:|---:|---:|---:|---|
{perf}

All three engine families agree exactly on 288 serialized events covering 12 selected historical/modern/future years and all mandatory cases. Chromium and Firefox service-worker cached reloads reproduce identical roots offline. WebKit online roots work; Playwright WebKit offline navigation repeatedly raises an internal error. Actual iOS Safari/Android devices and WebKit offline remain next-phase release gates, not a claim of device validation. Memory probe is unavailable through this wrapper; no fabricated memory number.

Native reference and WASM can differ by a JD ULP; ceil-ms can expose a 1ms difference on rare events (enumerated in serialized-parity.json). Therefore native Python is a reference comparator, **not a second domain oracle**. Exactly identical WASM outputs across browsers demonstrate selected serialization reproducibility. The old microsecond Golden is not treated as identical to the new event definition.

Isolated Vite build passes with expected externalized Node-only helper warnings; browser modules run through native ESM and proper `application/wasm` MIME. Production Vite/PWA is not integrated. Its current precache globs omit `.wasm`/`.se1`; next phase must include hash-addressed assets, explicit ready/error state, cache atomicity, URL base/path and MIME tests, and use fetch integrity checks. The audit SW caches all relevant modules/data and is isolated. Missing data was exercised: underlying library reports Moshier, guarded root evaluation rejects it. Corruption/integrity rejection must be tested in the production adapter.

Reproducible build: npm 0.2.2 tarball integrity and artifact hashes recorded; upstream provides C/Emscripten build source. A clean bit-for-bit rebuild was **not executed**. Next implementation must own/pin compiler/toolchain/options and prove reproducible build or retain a signed/verified artifact. Do not claim npm version proves reproducible compilation.

Licensing separately: Swiss C **REQUIRES_COMMERCIAL_LICENSE** for the selected Professional route; compressed data same classification. The [September 2026 contract](https://www.astro.com/swisseph/secont_e_2609.pdf) explicitly includes proprietary-format compressed data and distributed apps/browser-server projects. Current terms include CHF700 and six-year renewal; signed paid contract is required before distribution/service. [Official dual-license policy](https://www.astro.com/swisseph/swephinfo_e.htm).

Third-party wrapper/WASM package **AGPL_COMPATIBILITY_REQUIRED**: NOTICE licenses its TS API/tooling/tests under AGPL. Astrodienst's license cannot automatically sublicense those contributions. Actionable route: obtain Professional C/data rights and build from upstream C with independently owned minimal FFI/build glue, without copying the third-party wrapper. Alternatively document whole-project AGPL compatibility and corresponding-source compliance. No project-wide licensing compatibility or signed purchase is assumed. Generated table redistribution is neither needed nor evaluated as a license bypass; if proposed later, review separately. This is a clearly actionable prerequisite, not an unresolvable external evidence blocker. Preserve copyright/data notices and contract restrictions; this report does not replace legal acceptance.

## Option B fully pinned candidate and rejection

Astronomy Engine **2.1.19**, exact lockfile integrity, MIT, `SearchSunLongitude(target,start,20)` with year sequential targets starting285°, next start at returned Date+1000ms. Apparent geocentric Sun longitude of date, library precession/nutation/aberration implementation and default `DeltaT_EspenakMeeus`; AstroTime UT-to-TT and binary64 iteration are numerical convention, UT is treated as UTC on Date/POSIX conversion. Search returns JS Date, `toISOString()` millisecond TimeClip serialization. Current supported year computation1899–2101 and 16-year immutable in-memory cache. Equality is serialized Date T using <=; no tolerance. These internals and current code/lock hashes define B; changing package or Delta-T is a new convention.

B can deterministically satisfy its own domain tests, and is lighter/easier for current synchronous APIs/offline deployment. But independent TT evidence establishes 210 >30s cases. It is not justified to broaden the admitted accuracy gate just because UI shows minutes. Neither a universal <=30s physical UTC promise nor the assertion that every pipeline delta is AE error is defensible. We clarify the scale for A; we do not recommend a relaxed bound to admit B. No newly proven catastrophic general AE defect is alleged: fidelity and exact-event authority are decisive.

## Scope and blast radius

**SHARED_SOLAR_TERM_ENGINE_ONLY**: solar longitude/Jie roots are shared by solarTerms, officers, Group A/B, Bazi term context/year/month and SEO/prerender. HourAngle(Sun) is a different observable; existing AE2.1.19 TST remains independently versioned, with its own accuracy gate and provenance. Bazi day/hour and Zi-hour policies are not migrated. Lunar newMoon/conversion/sunLongitude stays outside scope. No evidence forces all solar observables or lunar core into one package.

Group A: source rules remain authoritative; existing Golden is valid under its recorded old model/tested dates, not a universal oracle for the changed model. A moves1938 Thu Phân from VN September24 toSeptember23, hence Tứ Ly fromSeptember23 toSeptember22: **EXPECTED_MODEL_MIGRATION_CHANGE**, not GROUP_A_BUG. B retains existing day labels but disagrees with independent higher-fidelity evidence. Full scan finds no Vietnam Tứ Tuyệt term-day change; still re-review315/45/135/225 boundaries and midnight regressions. Nguyệt Kỵ depends on lunar day5/14/23 only: no expected impact. 1946 Đại Tuyết movesVNDecember7 toDecember8 underA, affecting daily term/month/Officer day, not TứLy/TứTuyệt. GroupA Golden is immutable; add independently reviewed versioned migration evidence for affected cases.

Group B: all five admitted rule tables and aliases remain frozen. B fixed-input comparison retains260 interiors,5leap,5civil traps,15offset-equivalence,1alias; exact275/315 and rounded3/5 retain their assertions.40 exact contexts plus2 rounded contexts change, with8 boolean changes (IDs in evidence). These are astronomy-context changes, not source lookup changes.

A preserves the physical/model authority but **still requires a new independently reviewed Golden version**: all21 old microsecond at-T inputs are below ceil-ms T when parsed as JS Date;105 at-record MonthJian contexts and16 killer booleans would differ at those old fixed inputs.210 old ±minute boundary records,260interiors,5leap,5civil traps,15equivalences,1alias and5rounded discriminators retain behavior. These are projections from the proposed serialization, not executed migration acceptance. Re-anchor all315 boundary records into independently constructed T−1ms/T/T+1ms witnesses; retain old606 unchanged as history. Audit evidence is not replacement authoritative Golden.

M3 must kill strict `>` at new canonical T using each rule's killer event. M10 must kill minute-rounding of root before domain comparison; retaining display HH:mm is fine. All five existing rounded discriminator concepts remain useful for A; B requires independent rederivation where two old inputs moved context. Qualified mutation acceptance remains blocked by the current red baseline; no migration mutation suite run in this phase.

Bazi: month/year pillars change between model cutoffs, year changes specifically around Lập Xuân; clock endpoints may alter candidate dedup/ambiguity. Keep normalized birth UTC, explicit input uncertainty and day/hourTST unchanged. Test term-context, exact month/year triple, year315°, candidate endpoints straddling each new T, dedup and version identity. Existing noon Golden does not prove boundary safety. DailyUI/Officer, event evaluation, SEO/static day pages, browser/server and reminders' precomputed content must use consistent shared term provenance; no independent hard-coded frontend roots. Existing non-term lunar conversion preserved.

## Non-summed decision matrix

| Criterion | A: Swiss/DE441 | B: AE2.1.19 |
|---|---|---|
| Astronomical fidelity | Independent TT max0.084s | Independent TT max56.289s;210>30s |
| Reproducibility | Pinned WASM/FFI/data/clock;288 cross-browser exact | Existing package/Date convention deterministic |
| Product precision | Retains30s TT validation; clocks labeled separately | Needs unapproved accuracy relaxation to meet full TT gate |
| Exact semantics | One ceil-ms T; no tolerance | One Date T; no tolerance |
| Browser/mobile | Three desktop engines; real-device gate pending | Existing JS deployment; same device regression needed |
| PWA/offline | Chromium/Firefox measured;WebKit pending | Existing cached JS path |
| Performance | Annual24~1.5–2ms measured here | Prior current-engine benchmark; no new claim of browser parity |
| Size |~1.12MB wasm/glue/data raw plus wrapper | Existing JS dependency, no extra ephemeris file |
| License | Professional+ownedwrapper actionable;not yet acquired | MIT;current simpler |
| Maintenance | Versioned data,clock,toolchain,asyncready/cache | Pin package and convention;lower operational overhead |
| Migration | Asyncready/syncconsumer compatibility gate | NewGolden despite retainedproduction roots |
| GroupA |1938TứLy and1946daily changes reviewed | Retains current labels;accuracy disagreement stays |
| GroupB | Source tables retained;new serializationGolden |42old fixed-input assertions affected;newmodelGolden |
| Bazi | Month/year changes;TSTseparate | Current terms;newaccuracy-spec approval needed |
| SEO/build | Same verified artifact/adapter each environment | Current sharedJS maintained |
| Auditability | Fullroot/frame/clock/data hashes;independentJPL evidence | Fully versionable convention,lowerfidelity gate fails |

Decisive gates favor A: independently supported TT fidelity, measured browser viability, explicit deterministic event definition and actionable licensing. Bundle/async/license complexity is real but can be gated. No arbitrary summed score overrides these gates.

## Prerequisites and remaining risks

No production implementation here. Next phase must obtain rights, independently own adapter/build, freeze reproducible artifact, prove full-range serialized equality/browser-server-prerender consistency, real mobile/WebKit offline, asset integrity/atomic caching/failure, padding, GroupA historical changes, independent newGolden, Bazi boundaries and regression/mutation gates. Current synchronous consumers require explicit initialization design before implementation; no silent asynchronous API substitution. Rollback must restore versioned code/data/cache/Golden together, preserving this dirty checkpoint snapshot.

Known limits: DE440s is a close independent reference, not physical microsecond truth; future Earth rotation/leaps uncertain; native/WASM ULP can change rounded millisecond; full-range browser parity and memory/device/cold-network budgets remain release gates; Professional contract and owned-wrapper build not yet secured. WebKit offline automation fails with an internal navigation error. Those concrete implementation prerequisites do not prevent choosing A under the user's “acceptable or clearly actionable” decision rule.

FINAL DECISION: ADOPT_DE441_CANONICAL
'''
(root/'calendar-astronomy-authority-decision-v3.2.md').write_text(report)
(root/'calendar-astronomy-authority-migration-gate-v3.2.md').write_text('''# Astronomy authority migration gates v3.2

Selected authority: ADOPT_DE441_CANONICAL. Scope: SHARED_SOLAR_TERM_ENGINE_ONLY. This document defines next-phase acceptance gates, not implementation authorization or a detailed plan.

1. Rights: signed paid Professional C/compressed-data license and owned wrapper/glue rights, or proven whole-project AGPL compliance. Preserve notices, contract renewal/redistribution conditions; third-party AGPL API cannot be assumed commercially sublicensed.
2. Numerical identity: adopt decision-v3.2 complete event definition: apparent geocentric true ecliptic/equinox of date, SWIEPH2/SPEED258, Swiss2.10.03 models/data/clock, TT Jan1 seed plus solcross/six Newton corrections, Gregorian jdet conversion and embedded-table fallback, ceil seconds×1000 serialization. Pin source/compiler/build/C/WASM/glue/FFI/data/leap/Delta-T/serialization hashes and artifact recipe. Any different artifact/output requires a versioned authority review. No silent model/default/auxiliary-file update.
3. Equality: one serialized integer-ms T for browser/server/prerender. Full1900–2100 plus1899/2101 padding must reproduce exactly across supported environments. T−1ms OLD, T NEW, T+1ms NEW. No epsilon, minute rounding or client-specific alternate event. Native comparison is reference accuracy only.
4. Assets/runtime: deterministic ready/error initialization compatible with existing synchronous consumers; explicit unavailable state until assets verified. Correct Vite base/path/MIME, WASM and se1 precache, cache version/atomic upgrades, online/offline reload and corrupt/missing/out-of-range failure. Reject Moshier fallback. Real iOS/Android and WebKit offline proof required; audit desktop WebKit online success is insufficient for release. Freeze measurable startup/memory/bundle budgets on target devices, and verify owned build performance; no native timing substitution.
5. Affected modules: shared solarTerms; exact/daily officers; GroupA term-day rules; GroupB MonthJian; Bazi termContext/year/month/candidate endpoints; dailyUI, evaluation, SEO/prerender and shared build consumers. HourAngle/TST remains AE2.1.19 separately versioned; lunar core untouched. Persist/cache provenance with full authority version and invalidate stale outputs.
6. Precision spec: explicitly approve proposed scale clarification as SPEC_CHANGE before changing authoritative specs. Retain <=30s independent matching-frame TT comparison; known UTC mapping separately validated; historicalUT1/futureprojection clearly identified. TST requirement unchanged. Independent reference cannot be production-generated expected.
7. Golden: retain old606, manifest, GroupA and Phase2.1 bytes immutable. Create separately versioned independently constructed/reviewed GroupB millisecond Golden (all315 exact boundaries reanchored), independent tables/day/context/timezone/leap/alias/rounded witnesses. Review105old at-input context/16boolean serialization projections rather than patch expectations to production. Five source-rule tables unchanged.
8. GroupA: independently review1938ThuPhân/TứLy day shift,1946ĐạiTuyết dailyOfficer/term shift, all TứTuyệt seasonal boundaries and padding. Classify demonstrated model migrations EXPECTED_MODEL_MIGRATION_CHANGE; preserve NguyệtKỵ/lunar regression. Approve versioned evidence, never rewrite history.
9. Bazi: exact month/year/LậpXuân triples, birth uncertainty endpoints crossingT, ambiguity/dedup/version metadata, explicit timezones, unchanged TST day/hour/Zi policies and all prior fixtures. No implied universal futureUTC physical accuracy.
10. Mutation: only after green unmutated newGolden/property baseline, run qualified M1–M10 including all variants. M3 must kill strict>;M10 must kill root-minute-rounding with genuine discriminator. Identity/alias cardinality and source operands retained. Report qualified kills, not diagnostic detections on red baseline. This phase did not execute that suite.
11. Regression: Phase1,Phase2.1,GroupA,Bazi,daily/exactOfficer, all GroupB property/Golden/source-table range checks, integration, UI/SEO/build/PWA/offline, lint/typecheck and platform tests. Resolve/report current visual/format baseline separately; never disable tests or overwrite frozen files. No ThiênĐức or GroupC scope.
12. Rollback: recover original b24879b77797a29fdee10bc178acfa07cfeadab0 AND dirty Phase3B.4 snapshot; restore engine/data/clock/serialization/cache/Golden versions as a unit. Prove rollback with versioned artifacts and preserved inputs; HEAD alone lacks dirty GroupB work.

Gate status now: authority chosen; migration/release NOT APPROVED. Missing signed rights, owned reproducible build, full-range cross-environment ms proof and target-device/offline tests are concrete next-phase prerequisites.
''')
print('three decision artifacts written')
