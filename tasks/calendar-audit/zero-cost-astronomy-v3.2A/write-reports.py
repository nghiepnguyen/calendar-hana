import json,hashlib
from pathlib import Path
root=Path.cwd();b=root/'tasks/calendar-audit/zero-cost-astronomy-v3.2A'
load=lambda f:json.loads((b/f).read_text());sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
c=load('comparison.json');jpl=load('jpl-reference.json');platform=load('browser-results.json');bundles=load('bundle-results.json');vsop=load('vsop-completeness.json');erfa=load('erfa-provenance.json');port=load('erfa-port-check.json');migration=load('migration-projection.json');mobile=load('mobile-emulation.json')
selected='hana-erfa-solar-eval@0.1.0 — ERFA 2.0.1 EPV00 + IAU2006 bias/precession + IAU2000B nutation + retarded barycentric Sun + relativistic aberration; TT-ms-v1 / clock-v1'
licenses={
 'AE':dict(status='PERMISSIVE_OK',code='MIT',coefficients='Embedded in MIT Astronomy Engine2.1.19 distribution',redistribution='source/browser bundle/commercial use and modification allowed with MIT notices; no copyleft',source='https://raw.githubusercontent.com/cosinekitty/astronomy/v2.1.19/LICENSE'),
 'FULL_VSOP87':dict(status='REDISTRIBUTION_UNCLEAR',code='astronomia4.2.0 MIT; distributed data also fall under its package-level grant',coefficients='VSOP87D from original CDS VI/81/Bretagnon-Francou; original upstream coefficient redistribution chain not explicitly established by reviewed ReadMe/catalogue',redistribution='MIT permits modification/commercial browser code with notices; do not assume the package grant or a third-party public-domain port settles original coefficient rights',source=['https://raw.githubusercontent.com/commenthol/astronomia/v4.2.0/LICENSE','https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VI/81?format=html&tex=true'],resolution='Clear upstream coefficient permission before recommending this exact dataset. Not an allegation that it is prohibited; conservative unestablished gate. Raw coefficients/built VSOP candidate retained only in /tmp.'),
 'OPEN_HIGH_PRECISION':dict(status='ATTRIBUTION_REQUIRED',code='ERFA BSD-3-Clause-style permissive terms; modified JS derivation, not unmodified SOFA',coefficients='1951 EPV00 harmonic terms and77nutation terms embedded in the same explicitly licensed ERFA C source; same permission/notice terms',clockHelper='Astronomy Engine2.1.19 DeltaT_EspenakMeeus MIT; tree-shaken helper only',redistribution='source and binary/browser forms, modifications and commercial use permitted with copyright/conditions/disclaimer; no endorsement; no copyleft or paid runtime dependency',sources=['https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/LICENSE','https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/epv00.c','https://raw.githubusercontent.com/cosinekitty/astronomy/v2.1.19/LICENSE'])}
contract=dict(status='PROPOSED_NOT_APPLIED',scope='All24terms/year1900-2100 including2412Jie; same validation on required1899/2101padding',reference='JPL DE440s/Skyfield1.55/jplephem2.24 apparent geocentric true ecliptic/equinox-of-date TT root',maximumAbsoluteTTRootErrorSeconds=30,retainsExistingBazi30SecondGate=True,p95='report measured distribution; no invented binding percentile target',domain='zero allowance: serialized production T−1ms OLD;T NEW;T+1ms NEW',numericalResolution='first integer TT ms at/after model root; final time-axis ceil-ms serialization',civilDates='no unexplained civil-day change against independently reviewed reference under SAME pinned clock; any mismatch explicitly reviewed, not automatically forbidden by astronomy tolerance',timeScale='known-leap UTC separately validated; pre1972 modelUT1 and post2017 frozen-leap projection are numerical conventions, not30s physicalUTC guarantees',specificationChange='Explicit approval required for named observable/time scale, clock-v1, serialization and authority version; no accuracy widening')
evidence=dict(phase='3B.4.2A',classification='NON_AUTHORITATIVE_ASTRONOMY_EVALUATION',primaryVerdict='SELECT_ZERO_COST_ENGINE',selectedEngine=selected,referenceAuthority=dict(identity=jpl['identity'],kernelSha256=jpl['kernelSha256'],kernelSource=jpl['kernelSource'],referenceDataset=dict(path=str(b/'jpl-reference.json'),sha256=sha(b/'jpl-reference.json'),roots=4872,supportedRoots=4824),priorReferenceMaxDifferenceSeconds=jpl['priorReferenceMaxDifferenceSeconds'],independentStartAgreementSeconds=jpl['alternativeSeedMaxDifferenceSeconds']),supersession='v3.2A supersedes v3.2 production runtime choice because Swiss Professional is financially unavailable; v3.2 astronomy evidence retained',licenses=licenses,coefficientProvenance=dict(FULL_VSOP87=vsop,OPEN_HIGH_PRECISION=erfa),comparisons=dict(classification='NON_AUTHORITATIVE_ASTRONOMY_EVALUATION',path=str(b/'comparison.json'),sha256=sha(b/'comparison.json'),recordsPerCandidate=4872,supportedRecordsPerCandidate=4824),candidates={k:{a:v for a,v in x.items() if a!='rows'} for k,x in c['candidates'].items()},performance=platform,bundle=bundles,sourceSizes=load('source-sizes.json'),mobileEmulation=mobile,portValidation=port,buildRepeatability=load('build-repeatability.json'),ablation=load('ablation.json'),migrationProjection=migration,proposedContract=contract,scope='SHARED_SOLAR_TERM_ENGINE_ONLY',productionMigrationExecuted=False,sourceHashes={str(b/f):sha(b/f) for f in ['erfa-solar.mjs','erfa-coefficients.mjs','candidates.mjs','ERFA-LICENSE.txt','jpl-reference.py','extract-erfa.py']})
(root/'calendar-zero-cost-astronomy-evidence-v3.2A.json').write_text(json.dumps(evidence,indent=2,ensure_ascii=False)+'\n')
keys=['AE','FULL_VSOP87','OPEN_HIGH_PRECISION']; labels={'AE':'AE2.1.19','FULL_VSOP87':'FullVSOP87D/Meeus4.2.0','OPEN_HIGH_PRECISION':'ERFA2.0.1/JS0.1.0'}
summary='\n'.join(f"| {labels[k]} | {x['statistics']['maximumAbsoluteSeconds']:.6f} | {x['statistics']['medianAbsoluteSeconds']:.6f} | {x['statistics']['p95AbsoluteSeconds']:.6f} | {x['statistics']['above']['30']} | {x['jieStatistics']['maximumAbsoluteSeconds']:.6f} | {x['jieStatistics']['above']['30']} |" for k,x in c['candidates'].items())
mandatory='\n'.join(f"| {r['year']} {r['longitude']}° | {labels[k]} | {r['deltaTTSeconds']:+.6f} | {r['candidateInstantUtc']} | {r['dates']['Asia/Ho_Chi_Minh']['candidate']} | {r['dates']['Asia/Hong_Kong']['candidate']} |" for k in keys for r in c['candidates'][k]['mandatoryCases'])
size='\n'.join(f"| {labels[k]} | {a['rawBytes']} | {a['gzipBytes']} | {a['brotliBytes']} |" for k,a in bundles['assets'].items())
perf='\n'.join(f"| {p['name']} {p['version']} | {labels[k]} | {x['initMs']:.2f} | {x['oneRootMs']:.2f} | {x['annual24Ms']:.2f} | {x['all4824Ms']:.2f} | {x['warmAnnual24Ms']:.2f} | {'PASS' if x['offlineReload'] else 'INTERNAL ERROR'} |" for p in platform['platforms'] for k,x in p['candidates'].items())
fullstats=[]
for k in keys:
 s=c['candidates'][k]['statistics'];fullstats.append(f"### {labels[k]}\n\nSigned min/max {s['signedMinimumSeconds']:+.6f}/{s['signedMaximumSeconds']:+.6f}s; abs mean {s['meanAbsoluteSeconds']:.6f}s; signed mean {s['meanSignedSeconds']:+.6f}s; p90/p95/p99 {s['p90AbsoluteSeconds']:.6f}/{s['p95AbsoluteSeconds']:.6f}/{s['p99AbsoluteSeconds']:.6f}s; RMS {s['rmsSeconds']:.6f}s. Counts >0.5/1/2/5/10/30/60s: {' / '.join(str(s['above'][str(t)]) for t in [.5,1,2,5,10,30,60])}. Worst event: {c['candidates'][k]['worst50'][0]['year']}, {c['candidates'][k]['worst50'][0]['longitude']}°. All worst50, decade/longitude/Jie/Zhongqi statistics and exact roots are in comparison.json, referenced by digest in evidence. No supported outlier is dropped; 2100 decade has only one year.")
report=f'''# Zero-cost astronomy decision v3.2A

**SELECT_ZERO_COST_ENGINE** — {selected}.

**Reference authority:** JPL DE440s, independently solved through Skyfield1.55/jplephem2.24 apparent geocentric true-ecliptic/equinox-of-date Sun in TT. **Production migration: NOT EXECUTED.** This selects a foundation candidate, not a released production adapter.

## Supersession and protected scope

v3.2 selected DE441/Swiss as preferred high-fidelity runtime. v3.2A supersedes that **production implementation** decision because the paid Swiss Professional route is financially unavailable. The astronomical evidence in v3.2 remains valid and unchanged. Reference authority and production numerical implementation are separate: ERFA need not reproduce JPL or frozen Swiss millisecond-for-millisecond. Accuracy allowance applies only to independent astronomy comparison; one production serialized T remains exact for domain equality.

All protected v3.2 documents, production, packages/lock, 606 GroupB Golden/manifest, GroupA, Phase2.1 and V1 Golden remain untouched. Snapshot preserves current dirty workspace and b24879b77797a29fdee10bc178acfa07cfeadab0; HEAD is not substituted for dirty GroupB implementation. Isolated research is labeled NON_AUTHORITATIVE_ASTRONOMY_EVALUATION. No replacement authoritative Golden, migration, ThiênĐức, GroupC or domain tolerance is introduced.

## Reference and methodology

Official DE440s kernel SHA256 `{jpl['kernelSha256']}`. The supported interval is well inside its1849–2150 coverage; it is validation data only, never a browser runtime/network dependency. [Skyfield JPL data](https://rhodesmill.org/skyfield/planets.html), [true ecliptic frame](https://rhodesmill.org/skyfield/api-framelib.html).

Re-solved4872 events including1899/2101padding; supported4824 exactly reproduce v3.2 reference TT doubles. Independent starting points are Gregorian TTJan1 plus approximate term phase, then Newton; alternate +0.75day starts agree exactly. No candidate/Swiss root seed is needed. Candidate roots use their own longitudes, a Gregorian-year generic bracket and integerTT-ms search; no JPL timestamp is an expected production output. Browser bundles do not contain Skyfield/JPL, Swiss or a transition table.

Statistics use signed candidate−JPL TT seconds; absolute percentiles use linear interpolation, no rounded-minute timestamps. Serial/civil comparisons use named clocks below. AE own current Date pipeline is retained and its discrepancy separated from a common-clock comparison. UTC labels for future projections are serialization on a civil/POSIX axis, not a claim of future atomicUTC certainty. Evidence supplies all4872 records/candidate in a SHA256-linked dataset, all mandatory cases with both TT roots, times/dates, worst50, distributions and exact civil mismatch lists.

## Measured numerical comparison

| Candidate | max abs TT s | median abs s | p95 abs s | all24 >30s | max Jie s | Jie >30s |
|---|---:|---:|---:|---:|---:|---:|
{summary}

{'\n\n'.join(fullstats)}

All2412Jie are covered. AE fails the retained max<=30s Jie gate at99 events. FullVSOP87D and ERFA pass every Jie and all24term comparisons. Padding max errors: AE36.197913s, FullVSOP87D7.651055s, ERFA0.201568s. Prior Swiss accuracy max~0.0842s remains historical evidence; no Swiss runtime was used for the new candidate/reference benchmarks.

## Coordinates, algorithm and error sources

**AE:** existing pinned astronomy-engine2.1.19, current sequential `SearchSunLongitude(target,start,20)`, following startDate+1000ms, package's apparent geocentric true-ecliptic-of-date Sun. SunPosition uses a truncated VSOP Earth model at about1AU/c retarded time, library frame/nutation transformations; default Espenak/Meeus Delta-T, AstroTime UT~UTC convention and JSDate TimeClip milliseconds. Cache16 immutable annual arrays in production. Its exact own T is reproducible but not JPL truth. TT orbit/frame approximation gives supported~56s discrepancies; historical/current/future clock mapping adds independent contributions. Serialization is millisecond-sized, so cannot explain tens of seconds.

**FullVSOP87:** astronomia4.2.0 `Planet(vsop87Dearth)` + `solar.apparentVSOP87`. OriginalVSOP87D heliocentric Earth L/B/R, dynamical equinox/ecliptic of date, geocentric Sun inversion, Meeus FK5−0.09033arcsec correction, IAU1980 nutation (terms<0.0003arcsec neglected), scalar aberration−20.4898arcsec/R. No separate full retarded barycentricSun/relativisticvelocity solution. Earth series1080L/348B/997R, total2425, **complete**: every coefficient triplet agrees with original [CDS VI/81](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VI/81?format=html&tex=true), no truncation. Binary64 TT input, no Delta-T inside the longitude/root. Older dynamical-of-date/FK5 frame and simple aberration contribute systematic offsets relative to modern ICRF/IAU reference; measured7.4s cannot be assumed solely orbital error. No fitted correction or per-event residual repair was added. Full coefficients alone do not produce sub-second apparent roots.

**ERFA candidate:** JavaScript derivation of [ERFA2.0.1 EPV00](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/epv00.c), a simplified VSOP2000 solution already delivered as licensed code, not fullVSOP87 or a DE440 runtime. All1951embedded harmonic terms are preserved; Earth heliocentric/barycentric position and barycentric velocity are rotated by the upstream empirically defined BCRS matrix. Obtain Sun barycentric position from Earth barycentric−heliocentric at emission t−R/c; subtract Earth barycentric at reception. Normalize direction, apply ERFA-style special-relativistic/solar-potential aberration with barycentric observer velocity; use IAU2006 Fukushima-Williams bias/precession,77-termIAU2000B plus fixed planetary offsets, and true obliquity to true-ecliptic/equinox of date. No topocentric/heliocentric output, sidereal frame or refraction. Other-body gravitational deflection/free-core nutation are not implemented; residuals are measured, not claimed zero. TT is used as the permitted close approximation to TDB; the periodic TT–TDB difference is millisecond-scale, not the~0.376s dominant error.

Unmodified upstream C plus independent C vector/matrix operations were compiled with clang and compared at8 epochs including padding: max longitude difference~6.4e−12degrees, heliocentric components~1.2e−13AU, nutation~2.1e−19rad. This validates the JS port against original code, separate from JPL accuracy. EPV00 upstream nominal warning is |T−J2000|>100Julian years: late2100 and padding are flagged nominal extrapolation. Every required event through2101 was actually measured; explicit adapter range/extrapolation provenance remains a foundation gate.

Controlled correction omissions at mandatory cases: skipping aberration moves roots~492–503s; skipping nutation−406..+389s; skipping retardedSun moves−0.238..+0.124s. These counterfactuals falsify naive geometric/model substitutions. They quantify correction contributions, not an exact independent decomposition of residual orbital/precession/nutation error. Orbit/frame residual and sub-ms solver/serialization are retained separately from clock effects. No empirical fit to JPL was used.

## Canonical numerical and time policy proposed

Engine/model/data/port and clock/serialization are independently versioned. Exact identity includes source hashes in evidence plus the browser bundle hash `{bundles['assets']['OPEN_HIGH_PRECISION']['sha256']}`; a new build/output must not reuse the old event version silently.

TTroot is the **first integer millisecond on the TT axis since JD2451545.0** at/after the candidate longitude reaches the target. Generic yearJan1 +5days +((target−285)mod360)/360×365.2422 supplies an approximate bracket center; ±10days bounds are checked for signed crossing. Integer bisection ends at adjacent milliseconds, choosing the new-side integer. No numeric tolerance is used in domain comparison. Root quantization contributes<=1ms to independent accuracy, not a physicalmillisecond claim.

Research **clock-v1**: pre1972 solve TT=UT1+Espenak/Meeus Delta-T with5 fixed iterations, using the MIT2.1.19 polynomial, interpreted as projectedUT1 on civil/POSIX axis. From1972 use embedded actual leap history, TT−TAI32.184s, TAI−UTC10..37s. After last known2016-12-31 leap, freeze TAI−UTC37s: **projected UTC-like convention**, not unknowable futureUTC. No Swiss leap-age UT1 fallback. UTC/TDB/UT1 are not silently equated. No network Earth-orientation/leap updates or device defaults. Clock changes require newversion/independentreview. A leap-second instant that cannot be represented on JSDate axis must fail explicitly; this research term dataset contains no such event.

Convert TT to civil epoch using clock-v1, **ceil to integer epoch ms**, ISO8601 with3fractional digits. Shared comparison is `[T,nextT)`: T−1msOLD, TNEW, T+1msNEW. A numerical error allowance against JPL never changes this inequality. Independentreference civil times use the same explicit clock to isolate model effects; AE's actual current Date pipeline is also reported. These projectedreference dates are not independently observed futureUTC dates.

## Civil-date risks and mandatory events

Complete pipelines vs reference: AE UTC1, Vietnam2, HongKong1 disagreements; FullVSOP87 and ERFA **0/0/0**. Under common clock, AE retains the2Vietnam disagreements while futureUTC/HongKong disagreements disappear. Thus1938/1946 are root-model effects,2084/2086 predominantly clock effects. Future2098 combines TT and clock differences. Zero dates here is evidence, not an invented universal accuracy gate.

-1938ThuPhân: referenceVNSept23, AESept24. Reference32.826s beforemidnight; AE1.461s after. TứLy changesSep23→Sep22 under selected engine, plus dailyterm/SEO; noJie month change. EXPECTED_MODEL_MIGRATION_CHANGE.
-1946ĐạiTuyết: referenceVNDec8, AEDec7. Reference11.131s aftermidnight; AE2.299s before. DailyOfficer/termlabel movesDec7→Dec8; exactJie/BaziMonth differs between cutoffs. TứLy/TứTuyệt not directly affected.
-2084XuânPhân: referenceHKMar20, AEMar19; distances47.098s after/40.372s beforemidnight, pipeline−87.470s. HKpresentation/timezoneinput issue;VNsame. CommonclockAE isHKMar20.
-2086LậpHạ: referenceUTCMay5, AEMay4; distances19.510s after/80.604s beforemidnight, pipeline−100.114s. UTCpresentation/prerender grouping risk;VN/HKsame. CommonclockAE isUTCMay5.

Distances, signedTT and completepipeline deltas for every mismatch appear in evidence. Compared to historical Swiss clock/output, selectedengine has no additional civil-date change across4824, but seconds still differ and futureclock labels now express a different explicit projection. This does not claim identical T or futureUTC physical truth.

| Event | Candidate | TT delta s | serialized candidate T | VN date | HK date |
|---|---|---:|---|---|---|
{mandatory}

Machine evidence includes JPLTT/candidateTT and UTCdate for all these and worst50; this table shows readability subset, not omittedfields. All8mandatorycases remain in evaluation.

## Licensing hard gate

AE code/embedded numerical coefficients are MIT: **PERMISSIVE_OK**, commercial/source/bundle/modification allowed with notices, no copyleft. [Exact2.1.19license](https://raw.githubusercontent.com/cosinekitty/astronomy/v2.1.19/LICENSE).

FullVSOP87 code and its package grant are MIT; originalCDS coefficient redistribution rights are **REDISTRIBUTION_UNCLEAR** from reviewed originalmaterials. Do not assume free download, package-levelMIT or another port's public-domain declaration settles originaldata rights. This is a conservative unestablished provenance gate, not a finding of prohibition. The coefficients and compiledcandidate stay in/tmp. Resolving that chain would make it an accuracy-qualified alternative; its7.4s error is not itself disqualifying. [Astronomia4.2.0license](https://raw.githubusercontent.com/commenthol/astronomia/v4.2.0/LICENSE), [originaldata description](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VI/81?format=html&tex=true).

SelectedERFA code **and embedded coefficients/correction tables** share explicit permissive redistribution and modification terms, source/binary forms, copyright/conditions/disclaimer and no-endorsement requirements: **ATTRIBUTION_REQUIRED**, not AGPL. ERFA is a permitted modified derivative of SOFA, avoiding SOFA's unmodified-source restriction; acknowledge ERFA-derived work rather than claiming an official SOFA implementation. ClockhelperMIT separately retains notices. No commercial restriction or paid dependency is required. New root/adapter glue is project-owned; preserve inherited notices and include licenses in product third-party materials. [ERFA2.0.1license](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/LICENSE). This is source-based license evaluation, not a claim that all astronomical data are automatically publicdomain.

JPL/Skyfield are audit-only reference tooling; no JPL kernel, SwissWASM/data or third-party restricted runtime is added to production or candidatebundle. No Horizons/networkservice is needed at runtime.

## Browser, offline, performance and bundle

Isolated Vite8.3.0 tree-shaken ESM builds succeed; two clean same-environment builds are byte-identical. No productionVite/PWA configuration edited. Each candidate tested Node23.7.0 and three desktopbrowser engines,4824roots each: **zero serialized Node/browser mismatches**. ERFA and FullVSOPTT grids match exactly; AE has up to1JD-ULP~40µs TT difference in two engines but the currentserializedDate still agrees. No allowance was used to accept a serialized mismatch.

| Candidate bundle, minified | raw B | gzip B | brotli B |
|---|---:|---:|---:|
{size}

Bundles include a common clockhelper/root interface; coefficient source files are separately measured in evidence. Selected coefficient source100297B, gzip41255B/brotli33960B before source-format changes; noWASM/datafetch required. Source-only sizes do not sum to minifiedbundle size. Importeddatasets are compiled intoJS so existingPWA `.js`globs can accommodate them; scope/path/moduleinit/cacheversion still need productiontests.

| Browser | Candidate | init ms | one root ms | annual24 ms | all4824 ms | warm24 ms | offline reload |
|---|---|---:|---:|---:|---:|---:|---|
{perf}

Node full4824 timings: AE~45ms, FullVSOP~8539ms, ERFA~9294ms; browser values are actual browser measurements, not inferred fromNode/C/Python. Initialization includes localhostfetch, SHAverification and moduleparse. Timer zeros are below browserresolution; no mobile/network percentile guarantee. Fullrange intentionally computes201years without cache, while ordinary application usage should cache bounded immutableyear results. Current prototype uses robust integerbisection, not a prematurely optimized Newtonsearch.

Chromium/Firefox serviceworker offline reload and2024repeat roots pass for every candidate. WebKit onlinecomplete range passes but offline navigation yields an internalPlaywrightWebKit error for **allthree**, includingcurrentAE. This is unverified Safari/iOSoffline, not proof of a candidate-specific defect; physicaldevice/offline remains a next-phase gate. Selectedcandidate mobileviewport/user-agent emulation runs onPixel7/Chromium andiPhone15/WebKit (~45/48ms annual24); not realhardware.

Missing/corrupt selectedbundle fixtures fail closed in allthree browsers (`ASSET_MISSING`/`ASSET_CORRUPT`) before model computation. Harness cache name contains enginehash; loader verifies expectedhash, so stalecontent cannot silently supply roots. A multi-versionatomicupgrade/cleanup/rollback was not tested and is a productiongate; do not copy the minimalresearchSW as productionintegration. No astronomy networkservice, fallbackmodel or partial-coefficient result is accepted. Memory: Node processRSS/heap snapshots captured; Chromium heap estimate is coarsened~10MB totalpage, Firefox/WebKit unavailable. None is claimed to be perengine retainedmemory.

## Decision matrix and maintenance

| Dimension | AE | FullVSOP87D | ERFA/EPV00 |
|---|---|---|---|
| Accuracy |99Jie>30s; needsSPEC_CHANGE forfallback |Pass30s; max7.406s |Pass30s; max0.376s |
| License |MITclear |MITcode; upstreamcoefficientchainunestablished |BSDembeddeddata+MITclock;clear notices |
| Browser |All4824serializedPASS |All4824serializedPASS |All4824serializedPASS |
| Offline |Chromium/FirefoxPASS;WebKitunverified |Same |Same |
| Performance |Fastest,existing |Annual24~24–129ms |Annual24~35–54ms;cachedyearpractical |
| Maintainability |Existingupstream,lowestchange |OneupstreamAPI,olderframe/corrections |Smallcuratedport,butfoundationreviewneeded |
| Determinism |CurrentDateconventionpinned |TTmsgrid,versionedclock/build |TTmsgrid,versionedclock/build;Cportcheck |
| Auditability |Pinnedclosed-over numericalmodel;JPLdifferencesreported |All2425coefficientsverified;correctionlimitationsvisible |Explicit18harmonicarrays/77nutationterms,upstreamCparity/JPLfalsification |

No scores are summed. Accuracy gate admits both high-precision candidates; ERFA is selected because its **coefficient redistribution permission is explicit**, it is fully deterministic in the testedplatforms, browser/offline does not needWASM/largeephemeris assets, and its compactembeddeddata remains auditable. It is not selected merely to chase0.1s accuracy. IfFullVSOP's provenancegate is later cleared,7.4s would satisfy the retained accuracycontract and deserves comparison onmaintenance, not automatic rejection for lack of subsecond precision.

ERFA maintenance burden: keep a small definedsubset of upstreammodels (EPV00,IAU2006frame,IAU2000B,aberration/lighttime), generatedcoefficientextractor/sourcehashes, referenceCcheck andversionedclock. No globalplanetaryAPI needed. Updates are reviewed versions, not automatic coefficient replacement. The JSport is researchcode, not a mature releasedpackage: independentfoundationreview, documentedfunctions/readability, upstreamnumericalvectors and publicrange/failurecontracts are mandatory before productionmigration. TDB approximation, ignoredotherbodydeflection andextrapolation remain visible. Simple sharedyearcache keepsrepeatcalls cheap; memory/cachelimits need targetdevicevalidation.

## Proposed accuracy contract after measurement

**Retain max<=30s TT independentreference error for all2412Jie, and apply the same validationbound to all24terms/year1900–2100 plus requiredpadding.** This is the existing Bazi validationlimit, not a new bound reverse-engineered to make the winnerpass. Selected max0.376s,p95~0.197s is measured margin; no new authoritative max5s/p951s target is invented. Reportsigned/percentile/tailoutliers continuously. No unexplained civil-day mismatch may be hidden; independently review anycandidate/reference civil difference under the sameversionedclock before migrationapproval.

Thirtyseconds is an inherited independentvalidation requirement rather than physicalfutureUTC certainty. Accuracy is sufficient for HH:mm andcalendar use with reviewedmidnightcases; exactBazi month/yearboundary remains deterministic even for a physically uncertainbirthtime. Userbirthuncertainty belongs to existingcandidateinterval logic, not a model-derived OLD/NEW window. Modelerror, inputuncertainty, UIrounding andexactequality remain separate.

Explicit **SPEC_CHANGE** is required for authority/model/observable/clock/serialization provenance and for extending the referencegate to allterms. No existingaccuracygate is weakened. Futurefrozenleaps/pre1972UT1 labeling must be approved rather than silently presented as physicalUTC. ExistingTSTaccuracytarget andAE2.1.19TSTversion unchanged.

## Migration implications and unresolved risks

Choose **SHARED_SOLAR_TERM_ENGINE_ONLY**. ExistingHourAngle/TST andBazi day/hour/Zi policies remain separatelyversioned; lunarcore untouched. Future solarTerms/officerinstant/dailylabels/GroupAtermday/GroupBMonthJian/BaziMonthYear/candidateambiguity/SEO must consume one immutableversionedeventstream. CurrentAPIssynchronous; this bundledJS approach has synchronouscomputation afterordinarymoduleload, thoughhash/ready/deferredloading choices must preserveconsumercontracts.

Keepold606 and allotherGolden immutable. Selectedengine differs fromSwiss roots:4of21oldfrozen at-T inputs would precede itsnewT (20at-record contexts projected), andall21boundarytimestampdefinitions require new independentreview. No booleans were regenerated here. Rebuildindependentlyderived **newversion** withT−1ms/T/T+1ms, genuineM3strict>/M10rounded-rootwitnesses,timezone/leap/alias/interiorproofs; never patcholdexpectedfields to output.1938TứLy and1946dailyOfficer changes are expectedmodelmigrationchanges needingGroupAreview. AllSolarYear/monthBazi endpoint/dedup/LậpXuântests andUI/SEOoffline consistencyneedregression.

Nextgates include clearERFA/MITnotices, independentlyreviewedport/clock, pinnedreproduciblebuild,physicalmobile/SafariOffline,performance/memorybudgets,allrangecrossplatformserialization,source/model/specapproval,independentnewGolden/reviewerapproval,greenbaseline beforequalifiedmutations androllbackengine/cache/Golden together. No migrationmutations executedhere. ExistingredGroupB/visual/formatbaseline remains historicalstate; no disabledtest or productionPASS claim.

FINAL VERDICT: SELECT_ZERO_COST_ENGINE
SELECTED ENGINE: {selected}
REFERENCE AUTHORITY: JPL DE440s / Skyfield1.55 / jplephem2.24 / apparent geocentric true ecliptic/equinox-of-date Sun in TT
PROPOSED ACCURACY CONTRACT: max<=30s TT for all24terms/year1900–2100; retainexistingJiegate;reporttails/civilrisks;zero domainallowance
LICENSE: ATTRIBUTION_REQUIRED — ERFA permissive BSD-3-Clause terms + MIT clockhelper
PRODUCTION MIGRATION: NOT EXECUTED
'''
(root/'calendar-zero-cost-astronomy-decision-v3.2A.md').write_text(report)
audit=[]
for k in keys:
 x=c['candidates'][k];audit.append(f"## {labels[k]}\n\nIdentity: {x['identity']}. License: {licenses[k]['status']}; details and authoritative pointers are in evidenceJSON and decision's licensing section. Accuracy: max{s if False else x['statistics']['maximumAbsoluteSeconds']:.6f}s, p95{x['statistics']['p95AbsoluteSeconds']:.6f}s; Jie max{x['jieStatistics']['maximumAbsoluteSeconds']:.6f}s, >30s{x['jieStatistics']['above']['30']}. Bundle raw/gzip/brotli {bundles['assets'][k]['rawBytes']}/{bundles['assets'][k]['gzipBytes']}/{bundles['assets'][k]['brotliBytes']}B. All4824serializedevents agreeNode/Chromium/Firefox/WebKit; offlineChromium/Firefoxpasses,WebKitinternalnavigationerror. Actualtimings/memorylimits are recorded in browser-resultsJSON; no nativeperformanceextrapolation.")
audit.append('''## Candidate implementation and provenance audit

AE: current2.1.19 SearchSunLongitude/Date/defaultDeltaT, truncatedEarthVSOP and library true-date frame. No changes to production/package. Lowest maintenance and fastest, but99Jie violate preservedgate; fallbackwouldneedSPEC_CHANGE_REQUIRED. LicenseMIT permitscode/embeddedcoefficients/commercialbundling withcopyrightnotice. Numericconvention remains usefuldiagnostic, not JPLoracle.

FullVSOP87D: astronomia4.2.0full2425EarthLBR terms validated against downloadedoriginalCDSfile, includingallpowerorders, no amplitude truncation. Heliocentricinversion/FK5/IAU1980nutation/scalar20.4898/Raberration,TTrootgrid andcommonclock. Completecoefficients do not fix oldframe/simplecorrection accuracy: max7.406s. Main risk is upstreamcoefficientrights chain not established despiteMITpackagegrant. Rawdataset/package andcompiledbundleisolated/tmp; no unclearcoefficientfilevendored. API/upstreammaintenance easierthanownport; browserWebKitannual129ms inthissinglemeasurement, olderframemodelsneedversionedprovenance.

ERFA: modifiedJSport of2.0.1EPV00; simplifiedVSOP2000,1951harmonicterms across18arrays,77nutationterms; allvaluesextracted reproducibly fromexplicitlylicensedC. SolarastrometrycombinesretardedbarycentricSun−Earthobserver,SRaberration+solarpotentialterm,IAU2006bias/precession andIAU2000B totrueeclipticofdate. TTapproximatesTDB perupstreamallowance; no fullDEruntime, no topocentric/refraction. Code andembeddedtables shareBSDredistribution/modificationpermissions, copyrights/conditions/disclaimer/nopromotion preserved inERFA-LICENSE. MITDeltaThelper separatelylicensed. OriginatefromERFA, not claimofficialSOFA. NativeupstreamCcheck andindependentJPLcomparison areseparateproofs.

KnownERFAweaknesses: nominalEPV00outside|T|<=100Julianyearwarning coverslate2100/padding; measuredsupported/paddingerrorsremainbelowgate butmustlabelrange. Otherbodylightdeflection/FCNnotincluded, TT–TDBapproximation; originalEPV00fitDE405 notDE440. CustomJSport requiresindependentreview/upstreamvectorcoverage beforeproduction. ExhaustiveTTmsbisection costs~31longitudeevaluations/root; boundedannualcacheimportant. CurrentMathtrig/canonicalgrid yieldsidenticalfullrangeserializedoutputs onthreetestedengines; newtoolchain/outputrequiresnewversion,notatolerance.

## Clock, serialization and domain separation

Allnon-AEcandidates useclock-v1: pre1972MITEspenak/MeeusprojectedUT1;>=1972knownleaps;post2017TAI−UTC37frozenprojection;ceilfinalepochms. This divergesintentionallyfromSwissfutureUT1fallbackandAEfuturepolynomialUTmapping. Itis a proposedversionspec, not knownfutureUTC. JPLreferencecivilcomparisonusesSAMEclock; exactTTreference remainsindependent. AEactualpipeline is reportedalongsidecommonclocknormalization. Neither civilclockmatching norcandidateoutput constructs independentastronomicalrootexpected.

CanonicalmodelTTroot:firstintegerTTms sinceJ2000 meetinglongitude;genericyearbracket checked,integerbisection. ExactdomainusesonlyserializedT,neverreferenceaccuracyallowance. Sharedenginecache/provenanceandready/errorcontractmustbeapprovedinthenextphase.

## Reproducibility receipts

Researchdata NON_AUTHORITATIVE_ASTRONOMY_EVALUATION. comparisonJSON containsall4872roots/candidate,allmandatoryevents,worst50,decade/longitude/Jie/Zhongqitails andcomplete/commonclockcivildifferences; main evidenceprovidesSHA256. jpl-referenceJSONrecords independentgenericstartandalternate-startreproductionagainstpriorv3.2. erfa-provenanceJSON/extract-erfa.py retainupstreamarchive/sourcehashes andcompletetermcounts;vsop-completenessJSONrecordsoriginaltripletcomparison. erfa-port-checkJSONdocumentsunmodifiedupstreamCcomparison. build-repeatabilityJSONconfirmsbyteidenticalsameenvironmentVitebuilds; browser-resultsJSONrecordsallexactcomparisoncountsandfailuretests. mobile-emulationJSONisnotphysicaldeviceproof.

Temporaryreproductiondependencies: astronomicalcandidate tarballs/ERFAupstreamC andJPLkernelin/tmp;Skyfield1.55,jplephem2.24,sgp42.27,certifi2026.7.22 isolated/tmp. Productionnode_modules/package/lock unchanged. Bundlebuild usesexistingNode/Vite/Playwright;Node23.7.0,Vite8.3.0. No emscripten/WASM needed. DownloadprovenanceURLs/hashes are captured;before/afterprotectedhashesandsnapshots prove no productionmigration.
''')
(root/'calendar-zero-cost-astronomy-candidate-audit-v3.2A.md').write_text('# Zero-cost astronomy candidate audit v3.2A\n\nNON_AUTHORITATIVE_ASTRONOMY_EVALUATION. No production/Golden change.\n\n'+'\n\n'.join(audit))
(root/'calendar-zero-cost-astronomy-next-gate-v3.2A.md').write_text(f'''# Zero-cost astronomy foundation and migration gates v3.2A

Selected: {selected}. Reference: JPLDE440s/Skyfield1.55/jplephem2.24 apparentgeocentrictrueecliptic/equinox-ofdateSunTT. Production migration NOT EXECUTED. Gates below do not authorizeimplementationnow orconstituteadetailedimplementationplan.

1. Foundationreview: independentlyreviewJSderivationagainstpinnedERFA2.0.1C andofficialnumericvectors; verifyall1951EPV00/77nutationcoefficients,frame/SRaberration/retardedSun,TT–TDBapproximation/rangelimits. Preserveupstreamhashes andgeneratedextractor;makeownadapterreadableanddocumented;noglobalplanetaryAPIexpansion.
2. Rights: ERFABSDnotices/conditions/disclaimer/nopromotion plusMITDeltaThelpernoticeinbundledthirdpartymaterials. ModifiedERFA-derivedname,notSOFAofficialclaim. NoSwissProfessional/AGPL/runtime/data orunclearoriginalVSOPdata dependency. Originalprojectglueownershiprecorded.
3. Proposedcontractapproval: retain<=30sTTJieindependentvalidation andapplysameboundtoall24terms1900–2100+1899/2101padding;reportalltails andcivilrisks. Approveobservable/model/clock-v1/serialization/versionasSPEC_CHANGE. No silentaccuracywidening orphysicalfutureUTCpromise. Full-range independentJPLexpectedrootsmustnotderivefromproduction.
4. Canonicalevent: pinERFAdata/frame/correction/source/build/clock/leaps/rootgrid/serializationhashes. TTgridfirstintegerJ2000millisecondmeetinglongitude;checkedgenericbracket/integerbisection;pre1972modelUT1,knownleaps>=1972,post2017frozenTAI−UTC37projection;ceilepochms/ISO3digits. Failonunsupportedrange/model/asset/malformedstate andunrepresentableleapsecond. Anyoutputchangegetsnewversion/review.
5. Equality: allsupportedrootsserializedexactacrossbrowser/server/prerender/build,withpadding andstableyearordering. T−1msOLD,TNEW,T+1msNEW;noepsilon/multiplevalidanswers/clientlocalcanonicalroots. TTaccuracyallowancecannotenterdomaincomparison. Verifynewtoolchainsandtargetdevices;cachekey includesfullauthorityversion.
6. Browser/PWA: nativeESMbundledcoefficients,oneexplicitready/errorcontract preservingcurrentconsumerAPIs;Vitepaths/MIME/CSP,productionSWhashassets/atomicupgrade/staleversioncleanup/rollback. Missing/corruptassetsmustfailclosed;nofallbackmodel/networkastronomyservice. Chromium/Firefoxofflineobserved;realAndroid/iOSSafari/WebKitofflineisareleasegate. AuditWebKitinternalerrornotresolvedbychangingtests. Establishstartup/annual/memory/cachebudgetsontargetdevices;do notusethefull201yearscaninUI.
7. Golden: old606/manifest,GroupA,Phase2.1,V1 remainimmutable. New independentlyconstructed/reviewedsolar-term/GroupBversion afterauthorityapproval,notpatchedexpectedoutput. Re-anchor21sampleboundariesandfullrequiredcoverage toT−1ms/T/T+1ms. Preservefivesourceruletables,interior/leap/timezone/alias/roundeddiscriminators. Review4oldat-eventprojection/20contexts;nonewexpectedbooleansgeneratedthisphase.
8. GroupA/daily: independentlyreview1938ThuPhân/TứLySep23→Sep22,1946ĐạiTuyếtdailyterm/OfficerDec7→Dec8,midnight/seasonalTứTuyệtandpadding. ModelmigrationchangesareEXPECTED_MODEL_MIGRATION_CHANGE;NguyệtKỵ/lunarcoreunchanged. ReviewaffectedUI/SEO/staticcontent/event-evaluationprovenance.
9. Bazi/scope: SHARED_SOLAR_TERM_ENGINE_ONLY;termContext/month/year/LậpXuân,candidateuncertaintyendpoints/dedup requireexactboundaryandregressionproof. ExistingHourAngle/TSTAE2.1.19/day/hour/Zipoliciesremainseparatelyversionedandaccuracytested;noimplicitall-solarorlunarconversionmigration.
10. Regression/mutations: greenindependentnewGoldenbaselinebeforequalifiedM1–M10andallvariants;M3killsstrict>,M10killsroot-minute-rounding,aliases/cardinality/sourceoperandsretained. Phase1/2.1/GroupA/Bazi/fullGroupBproperties/range,UI/SEO/build/PWA/integration/lint/typecheckrequired. CurrentredGroupB/visual/formatdebt mustbereported/resolvedwithoutdisabledtestsorfrozenfileedits. Migrationmutation suitewasnotrunhere.
11. Rollback: preserveb24879b7andactualdirtyworkspace;restorecode/model/clock/cache/Goldenversionsasoneunit,notHEADalone. ProveassetversioninvalidationandrollbackwithoutdestroyingdirtyGroupBwork.

Stopatdecisionforthisphase. NoThiênĐức/GroupC,productionmigration,newauthoritativeGolden,paidpurchaseorpackagechangesauthorizedhere.
''')
print('four v3.2A artifacts written')
