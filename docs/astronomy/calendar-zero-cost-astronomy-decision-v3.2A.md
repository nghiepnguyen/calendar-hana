# Zero-cost astronomy decision v3.2A

**SELECT_ZERO_COST_ENGINE** — hana-erfa-solar-eval@0.1.0 — ERFA 2.0.1 EPV00 + IAU2006 bias/precession + IAU2000B nutation + retarded barycentric Sun + relativistic aberration; TT-ms-v1 / clock-v1.

**Reference authority:** JPL DE440s, independently solved through Skyfield1.55/jplephem2.24 apparent geocentric true-ecliptic/equinox-of-date Sun in TT. **Production migration: NOT EXECUTED.** This selects a foundation candidate, not a released production adapter.

## Supersession and protected scope

v3.2 selected DE441/Swiss as preferred high-fidelity runtime. v3.2A supersedes that **production implementation** decision because the paid Swiss Professional route is financially unavailable. The astronomical evidence in v3.2 remains valid and unchanged. Reference authority and production numerical implementation are separate: ERFA need not reproduce JPL or frozen Swiss millisecond-for-millisecond. Accuracy allowance applies only to independent astronomy comparison; one production serialized T remains exact for domain equality.

All protected v3.2 documents, production, packages/lock, 606 GroupB Golden/manifest, GroupA, Phase2.1 and V1 Golden remain untouched. Snapshot preserves current dirty workspace and b24879b77797a29fdee10bc178acfa07cfeadab0; HEAD is not substituted for dirty GroupB implementation. Isolated research is labeled NON_AUTHORITATIVE_ASTRONOMY_EVALUATION. No replacement authoritative Golden, migration, ThiênĐức, GroupC or domain tolerance is introduced.

## Reference and methodology

Official DE440s kernel SHA256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`. The supported interval is well inside its1849–2150 coverage; it is validation data only, never a browser runtime/network dependency. [Skyfield JPL data](https://rhodesmill.org/skyfield/planets.html), [true ecliptic frame](https://rhodesmill.org/skyfield/api-framelib.html).

Re-solved4872 events including1899/2101padding; supported4824 exactly reproduce v3.2 reference TT doubles. Independent starting points are Gregorian TTJan1 plus approximate term phase, then Newton; alternate +0.75day starts agree exactly. No candidate/Swiss root seed is needed. Candidate roots use their own longitudes, a Gregorian-year generic bracket and integerTT-ms search; no JPL timestamp is an expected production output. Browser bundles do not contain Skyfield/JPL, Swiss or a transition table.

Statistics use signed candidate−JPL TT seconds; absolute percentiles use linear interpolation, no rounded-minute timestamps. Serial/civil comparisons use named clocks below. AE own current Date pipeline is retained and its discrepancy separated from a common-clock comparison. UTC labels for future projections are serialization on a civil/POSIX axis, not a claim of future atomicUTC certainty. Evidence supplies all4872 records/candidate in a SHA256-linked dataset, all mandatory cases with both TT roots, times/dates, worst50, distributions and exact civil mismatch lists.

## Measured numerical comparison

| Candidate | max abs TT s | median abs s | p95 abs s | all24 >30s | max Jie s | Jie >30s |
|---|---:|---:|---:|---:|---:|---:|
| AE2.1.19 | 56.288892 | 9.792484 | 29.225577 | 210 | 52.145523 | 99 |
| FullVSOP87D/Meeus4.2.0 | 7.406075 | 3.534622 | 6.512099 | 0 | 7.406075 | 0 |
| ERFA2.0.1/JS0.1.0 | 0.376341 | 0.073526 | 0.196509 | 0 | 0.353529 | 0 |

### AE2.1.19

Signed min/max -46.319805/+56.288892s; abs mean 11.691768s; signed mean +4.262073s; p90/p95/p99 24.550030/29.225577/38.604147s; RMS 14.775423s. Counts >0.5/1/2/5/10/30/60s: 4665 / 4531 / 4263 / 3482 / 2362 / 210 / 0. Worst event: 2003, 330°. All worst50, decade/longitude/Jie/Zhongqi statistics and exact roots are in comparison.json, referenced by digest in evidence. No supported outlier is dropped; 2100 decade has only one year.

### FullVSOP87D/Meeus4.2.0

Signed min/max -7.214203/+7.406075s; abs mean 3.436434s; signed mean +0.248591s; p90/p95/p99 6.146919/6.512099/6.974886s; RMS 3.969436s. Counts >0.5/1/2/5/10/30/60s: 4423 / 4186 / 3454 / 1311 / 0 / 0 / 0. Worst event: 1900, 75°. All worst50, decade/longitude/Jie/Zhongqi statistics and exact roots are in comparison.json, referenced by digest in evidence. No supported outlier is dropped; 2100 decade has only one year.

### ERFA2.0.1/JS0.1.0

Signed min/max -0.376341/+0.342706s; abs mean 0.084551s; signed mean -0.041790s; p90/p95/p99 0.169450/0.196509/0.255256s; RMS 0.104132s. Counts >0.5/1/2/5/10/30/60s: 0 / 0 / 0 / 0 / 0 / 0 / 0. Worst event: 1941, 30°. All worst50, decade/longitude/Jie/Zhongqi statistics and exact roots are in comparison.json, referenced by digest in evidence. No supported outlier is dropped; 2100 decade has only one year.

All2412Jie are covered. AE fails the retained max<=30s Jie gate at99 events. FullVSOP87D and ERFA pass every Jie and all24term comparisons. Padding max errors: AE36.197913s, FullVSOP87D7.651055s, ERFA0.201568s. Prior Swiss accuracy max~0.0842s remains historical evidence; no Swiss runtime was used for the new candidate/reference benchmarks.

## Coordinates, algorithm and error sources

**AE:** existing pinned astronomy-engine2.1.19, current sequential `SearchSunLongitude(target,start,20)`, following startDate+1000ms, package's apparent geocentric true-ecliptic-of-date Sun. SunPosition uses a truncated VSOP Earth model at about1AU/c retarded time, library frame/nutation transformations; default Espenak/Meeus Delta-T, AstroTime UT~UTC convention and JSDate TimeClip milliseconds. Cache16 immutable annual arrays in production. Its exact own T is reproducible but not JPL truth. TT orbit/frame approximation gives supported~56s discrepancies; historical/current/future clock mapping adds independent contributions. Serialization is millisecond-sized, so cannot explain tens of seconds.

**FullVSOP87:** astronomia4.2.0 `Planet(vsop87Dearth)` + `solar.apparentVSOP87`. OriginalVSOP87D heliocentric Earth L/B/R, dynamical equinox/ecliptic of date, geocentric Sun inversion, Meeus FK5−0.09033arcsec correction, IAU1980 nutation (terms<0.0003arcsec neglected), scalar aberration−20.4898arcsec/R. No separate full retarded barycentricSun/relativisticvelocity solution. Earth series1080L/348B/997R, total2425, **complete**: every coefficient triplet agrees with original [CDS VI/81](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VI/81?format=html&tex=true), no truncation. Binary64 TT input, no Delta-T inside the longitude/root. Older dynamical-of-date/FK5 frame and simple aberration contribute systematic offsets relative to modern ICRF/IAU reference; measured7.4s cannot be assumed solely orbital error. No fitted correction or per-event residual repair was added. Full coefficients alone do not produce sub-second apparent roots.

**ERFA candidate:** JavaScript derivation of [ERFA2.0.1 EPV00](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/epv00.c), a simplified VSOP2000 solution already delivered as licensed code, not fullVSOP87 or a DE440 runtime. All1951embedded harmonic terms are preserved; Earth heliocentric/barycentric position and barycentric velocity are rotated by the upstream empirically defined BCRS matrix. Obtain Sun barycentric position from Earth barycentric−heliocentric at emission t−R/c; subtract Earth barycentric at reception. Normalize direction, apply ERFA-style special-relativistic/solar-potential aberration with barycentric observer velocity; use IAU2006 Fukushima-Williams bias/precession,77-termIAU2000B plus fixed planetary offsets, and true obliquity to true-ecliptic/equinox of date. No topocentric/heliocentric output, sidereal frame or refraction. Other-body gravitational deflection/free-core nutation are not implemented; residuals are measured, not claimed zero. TT is used as the permitted close approximation to TDB; the periodic TT–TDB difference is millisecond-scale, not the~0.376s dominant error.

Unmodified upstream C plus independent C vector/matrix operations were compiled with clang and compared at8 epochs including padding: max longitude difference~6.4e−12degrees, heliocentric components~1.2e−13AU, nutation~2.1e−19rad. This validates the JS port against original code, separate from JPL accuracy. EPV00 upstream nominal warning is |T−J2000|>100Julian years: late2100 and padding are flagged nominal extrapolation. Every required event through2101 was actually measured; explicit adapter range/extrapolation provenance remains a foundation gate.

Controlled correction omissions at mandatory cases: skipping aberration moves roots~492–503s; skipping nutation−406..+389s; skipping retardedSun moves−0.238..+0.124s. These counterfactuals falsify naive geometric/model substitutions. They quantify correction contributions, not an exact independent decomposition of residual orbital/precession/nutation error. Orbit/frame residual and sub-ms solver/serialization are retained separately from clock effects. No empirical fit to JPL was used.

## Canonical numerical and time policy proposed

Engine/model/data/port and clock/serialization are independently versioned. Exact identity includes source hashes in evidence plus the browser bundle hash `35a42c0ec6fa4defb9c53d375bf7d3393f9a32a0b1d270c1140d43f728f164f3`; a new build/output must not reuse the old event version silently.

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
| 1938 180° | AE2.1.19 | +34.287281 | 1938-09-23T17:00:01.461Z | 1938-09-24 | 1938-09-24 |
| 1946 255° | AE2.1.19 | -13.430263 | 1946-12-07T16:59:57.701Z | 1946-12-07 | 1946-12-08 |
| 2003 330° | AE2.1.19 | +56.288892 | 2003-02-19T02:01:08.792Z | 2003-02-19 | 2003-02-19 |
| 2014 345° | AE2.1.19 | -17.435592 | 2014-03-05T16:01:56.970Z | 2014-03-05 | 2014-03-06 |
| 2024 315° | AE2.1.19 | -13.242173 | 2024-02-04T08:26:49.630Z | 2024-02-04 | 2024-02-04 |
| 2084 0° | AE2.1.19 | +9.629399 | 2084-03-19T15:59:19.628Z | 2084-03-19 | 2084-03-19 |
| 2086 45° | AE2.1.19 | +1.789691 | 2086-05-04T23:58:39.396Z | 2086-05-05 | 2086-05-05 |
| 2098 315° | AE2.1.19 | -46.319805 | 2098-02-03T07:27:57.645Z | 2098-02-03 | 2098-02-03 |
| 1938 180° | FullVSOP87D/Meeus4.2.0 | +4.222830 | 1938-09-23T16:59:31.397Z | 1938-09-23 | 1938-09-24 |
| 1946 255° | FullVSOP87D/Meeus4.2.0 | +3.900361 | 1946-12-07T17:00:15.031Z | 1946-12-08 | 1946-12-08 |
| 2003 330° | FullVSOP87D/Meeus4.2.0 | +0.436047 | 2003-02-19T02:00:13.191Z | 2003-02-19 | 2003-02-19 |
| 2014 345° | FullVSOP87D/Meeus4.2.0 | -0.513978 | 2014-03-05T16:02:15.300Z | 2014-03-05 | 2014-03-06 |
| 2024 315° | FullVSOP87D/Meeus4.2.0 | -1.213512 | 2024-02-04T08:27:06.380Z | 2024-02-04 | 2024-02-04 |
| 2084 0° | FullVSOP87D/Meeus4.2.0 | -5.110694 | 2084-03-19T16:00:41.988Z | 2084-03-19 | 2084-03-20 |
| 2086 45° | FullVSOP87D/Meeus4.2.0 | -5.376072 | 2086-05-05T00:00:14.133Z | 2086-05-05 | 2086-05-05 |
| 2098 315° | FullVSOP87D/Meeus4.2.0 | -6.478138 | 2098-02-03T07:30:46.475Z | 2098-02-03 | 2098-02-03 |
| 1938 180° | ERFA2.0.1/JS0.1.0 | -0.054154 | 1938-09-23T16:59:27.120Z | 1938-09-23 | 1938-09-24 |
| 1946 255° | ERFA2.0.1/JS0.1.0 | -0.144638 | 1946-12-07T17:00:10.986Z | 1946-12-08 | 1946-12-08 |
| 2003 330° | ERFA2.0.1/JS0.1.0 | +0.330032 | 2003-02-19T02:00:13.084Z | 2003-02-19 | 2003-02-19 |
| 2014 345° | ERFA2.0.1/JS0.1.0 | -0.076000 | 2014-03-05T16:02:15.737Z | 2014-03-05 | 2014-03-06 |
| 2024 315° | ERFA2.0.1/JS0.1.0 | -0.038543 | 2024-02-04T08:27:07.554Z | 2024-02-04 | 2024-02-04 |
| 2084 0° | ERFA2.0.1/JS0.1.0 | -0.068718 | 2084-03-19T16:00:47.029Z | 2084-03-19 | 2084-03-20 |
| 2086 45° | ERFA2.0.1/JS0.1.0 | +0.070931 | 2086-05-05T00:00:19.580Z | 2086-05-05 | 2086-05-05 |
| 2098 315° | ERFA2.0.1/JS0.1.0 | +0.011869 | 2098-02-03T07:30:52.966Z | 2098-02-03 | 2098-02-03 |

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
| AE2.1.19 | 45752 | 14724 | 11791 |
| FullVSOP87D/Meeus4.2.0 | 180002 | 51985 | 37959 |
| ERFA2.0.1/JS0.1.0 | 124552 | 47032 | 36707 |

Bundles include a common clockhelper/root interface; coefficient source files are separately measured in evidence. Selected coefficient source100297B, gzip41255B/brotli33960B before source-format changes; noWASM/datafetch required. Source-only sizes do not sum to minifiedbundle size. Importeddatasets are compiled intoJS so existingPWA `.js`globs can accommodate them; scope/path/moduleinit/cacheversion still need productiontests.

| Browser | Candidate | init ms | one root ms | annual24 ms | all4824 ms | warm24 ms | offline reload |
|---|---|---:|---:|---:|---:|---:|---|
| chromium 153.0.8010.12 | AE2.1.19 | 10.90 | 0.70 | 4.10 | 40.00 | 0.20 | PASS |
| chromium 153.0.8010.12 | FullVSOP87D/Meeus4.2.0 | 3.80 | 2.80 | 24.30 | 4625.40 | 22.50 | PASS |
| chromium 153.0.8010.12 | ERFA2.0.1/JS0.1.0 | 2.70 | 4.00 | 35.10 | 6357.70 | 31.40 | PASS |
| firefox 155.0 | AE2.1.19 | 6.00 | 0.00 | 2.00 | 55.00 | 0.00 | PASS |
| firefox 155.0 | FullVSOP87D/Meeus4.2.0 | 7.00 | 2.00 | 24.00 | 4613.00 | 23.00 | PASS |
| firefox 155.0 | ERFA2.0.1/JS0.1.0 | 4.00 | 4.00 | 54.00 | 10443.00 | 54.00 | PASS |
| webkit 26.6 | AE2.1.19 | 8.00 | 0.00 | 3.00 | 43.00 | 1.00 | INTERNAL ERROR |
| webkit 26.6 | FullVSOP87D/Meeus4.2.0 | 6.00 | 7.00 | 129.00 | 25168.00 | 122.00 | INTERNAL ERROR |
| webkit 26.6 | ERFA2.0.1/JS0.1.0 | 4.00 | 3.00 | 35.00 | 5680.00 | 29.00 | INTERNAL ERROR |

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
SELECTED ENGINE: hana-erfa-solar-eval@0.1.0 — ERFA 2.0.1 EPV00 + IAU2006 bias/precession + IAU2000B nutation + retarded barycentric Sun + relativistic aberration; TT-ms-v1 / clock-v1
REFERENCE AUTHORITY: JPL DE440s / Skyfield1.55 / jplephem2.24 / apparent geocentric true ecliptic/equinox-of-date Sun in TT
PROPOSED ACCURACY CONTRACT: max<=30s TT for all24terms/year1900–2100; retainexistingJiegate;reporttails/civilrisks;zero domainallowance
LICENSE: ATTRIBUTION_REQUIRED — ERFA permissive BSD-3-Clause terms + MIT clockhelper
PRODUCTION MIGRATION: NOT EXECUTED
