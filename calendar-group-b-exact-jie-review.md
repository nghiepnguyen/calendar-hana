# Group B independent exact Jie review

Status: INDEPENDENT_EXACT_SOURCE_ESTABLISHED; CANDIDATE, awaiting independent review. 21 transitions, 12 different Jie, years 2014/2023/2024/2025. No production output was obtained or compared in this phase.

## Definition compatibility

Original calendar-validation.spec.md §2 locks apparent solar longitude; Phase 2.1 uses SearchSunLongitude. Its [upstream API contract](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#SearchSunLongitude) describes apparent geocentric longitude in the true ecliptic of date. [Swiss Ephemeris programming documentation](https://www.astro.com/swisseph/swephprg.htm) describes default apparent geocentric positions and true equinox of date when NONUT/J2000/TRUEPOS/HELCTR/TOPOCTR flags are absent. Definition COMPATIBLE; numerical agreement with production has NOT been tested. This is compatibility of definitions, not an assertion of identical precession/nutation models or physical accuracy.

## Independent algorithm and files

pyswisseph 2.10.3.2 / Swiss Ephemeris 2.10.03, downloaded official sepl_18.se1, content hash ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66. Actual file metadata returns JPL generation **441**. [Official repository README](https://github.com/aloistr/swisseph/blob/master/readme.md) records rebuilding .se1 files with DE441 in April 2026. Older documentation mentioning DE431 is not the identity of these actual bytes.

Data: [official sepl_18.se1](https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1). File coverage JD 2378496.5..2597651.3591467496. Assert returned SWIEPH flag and reject MOSEPH on every call. No fallback was observed. Evidence JSON pins data and binary SHA256; binary hash is platform-specific, version/data hashes allow independent reproduction on another platform.

Solve wrapped longitude-target residual on TT. Bracket from Gregorian UTC first of month (converted to TT) through +12 TT days; bisection to <=0.0001 seconds bracket width. Targets January..December: 285,315,345,15,45,75,105,135,165,195,225,255 degrees. UTC conversion uses Swiss leap-second-aware jdet_to_utc, not TT=UTC. Timezones are absolute UTC offsets; Asia/Ho_Chi_Minh UTC+7 determines calendar day. No ephemeris is installed in this repository or incorporated into production.

ISO microseconds are serialization precision. Numerical root bracket <=0.1 ms does not establish physical microsecond certainty. The candidate T is a reproducible model crossing, with TT bracket and residuals preserved. Independent review must approve the reference before runtime exact-equality tests; any later production disagreement requires investigation, not automatic tolerance weakening or changing these candidates.

## Reproduction recipe

Install pyswisseph==2.10.3.2 in an isolated environment, download the linked ephemeris, verify evidence dataSha256, put it in EPHE_DIR. This recipe reads no project evaluator, lookup or solar-term output:

```python
import swisseph as swe
from datetime import datetime, timezone, timedelta
swe.set_ephe_path(EPHE_DIR)
def independent_jie(year, civil_month):
    target = (285 + 30*(civil_month-1)) % 360
    lo = swe.utc_to_jd(year,civil_month,1,0,0,0,swe.GREG_CAL)[0]
    hi = lo + 12
    def residual(tt):
        x,flags = swe.calc(tt,swe.SUN,swe.FLG_SWIEPH)
        assert flags & swe.FLG_SWIEPH and not flags & swe.FLG_MOSEPH
        return (x[0]-target+180)%360-180
    assert residual(lo)<0<residual(hi)
    while (hi-lo)*86400 > 0.0001:
        mid=(lo+hi)/2
        if residual(mid)<0: lo=mid
        else: hi=mid
    tt=(lo+hi)/2
    y,m,d,h,minute,sec=swe.jdet_to_utc(tt,swe.GREG_CAL)
    utc=datetime(y,m,d,h,minute,tzinfo=timezone.utc)+timedelta(seconds=sec)
    return utc,tt,(lo,hi),(residual(lo),residual(hi))
```

## HKO corroboration

Monthly HKO p.1 Solar Terms rows for 2023–2025 were visually read from original PDFs; 2014 values from the [HKO annual term table](https://www.hko.gov.hk/en/gts/astron2014/Solar_Term_2014.htm). Each reference URL/location/offset and available PDF hash is in evidence JSON. Published minute corroboration, never exact T. Maximum absolute difference 26.221400 seconds, consistent with minute-level publication; no large discrepancy. We do not assert HKO's rounding algorithm, average sources, or alter timestamps to match HKO.

| Transition | Independent exact T (+07) | HKO published (+08) | Exact − published seconds |
|---|---|---|---:|
| jie-2014-02 · Lập Xuân | 2014-02-04T05:03:16.684536+07:00 | 2014-02-04T06:03:00+08:00 | +16.684536 |
| jie-2014-03 · Kinh Trập | 2014-03-05T23:02:15.805446+07:00 | 2014-03-06T00:02:00+08:00 | +15.805446 |
| jie-2014-04 · Thanh Minh | 2014-04-05T03:46:39.787483+07:00 | 2014-04-05T04:47:00+08:00 | -20.212517 |
| jie-2014-05 · Lập Hạ | 2014-05-05T20:59:26.221400+07:00 | 2014-05-05T21:59:00+08:00 | +26.221400 |
| jie-2023-03 · Kinh Trập | 2023-03-06T03:36:14.214332+07:00 | 2023-03-06T04:36:00+08:00 | +14.214332 |
| jie-2023-04 · Thanh Minh | 2023-04-05T08:13:03.657937+07:00 | 2023-04-05T09:13:00+08:00 | +3.657937 |
| jie-2023-05 · Lập Hạ | 2023-05-06T01:18:45.556920+07:00 | 2023-05-06T02:19:00+08:00 | -14.443080 |
| jie-2024-01 · Tiểu Hàn | 2024-01-06T03:49:22.512852+07:00 | 2024-01-06T04:49:00+08:00 | +22.512852 |
| jie-2024-02 · Lập Xuân | 2024-02-04T15:27:07.611503+07:00 | 2024-02-04T16:27:00+08:00 | +7.611503 |
| jie-2024-03 · Kinh Trập | 2024-03-05T09:22:46.184919+07:00 | 2024-03-05T10:23:00+08:00 | -13.815081 |
| jie-2024-04 · Thanh Minh | 2024-04-04T14:02:17.672062+07:00 | 2024-04-04T15:02:00+08:00 | +17.672062 |
| jie-2024-05 · Lập Hạ | 2024-05-05T07:10:05.052803+07:00 | 2024-05-05T08:10:00+08:00 | +5.052803 |
| jie-2024-06 · Mang Chủng | 2024-06-05T11:09:53.688941+07:00 | 2024-06-05T12:10:00+08:00 | -6.311059 |
| jie-2024-07 · Tiểu Thử | 2024-07-06T21:20:03.398193+07:00 | 2024-07-06T22:20:00+08:00 | +3.398193 |
| jie-2024-08 · Lập Thu | 2024-08-07T07:09:16.449044+07:00 | 2024-08-07T08:09:00+08:00 | +16.449044 |
| jie-2024-09 · Bạch Lộ | 2024-09-07T10:11:20.866192+07:00 | 2024-09-07T11:11:00+08:00 | +20.866192 |
| jie-2024-10 · Hàn Lộ | 2024-10-08T01:59:57.335789+07:00 | 2024-10-08T03:00:00+08:00 | -2.664211 |
| jie-2024-11 · Lập Đông | 2024-11-07T05:20:04.521878+07:00 | 2024-11-07T06:20:00+08:00 | +4.521878 |
| jie-2024-12 · Đại Tuyết | 2024-12-06T22:17:02.605598+07:00 | 2024-12-06T23:17:00+08:00 | +2.605598 |
| jie-2025-01 · Tiểu Hàn | 2025-01-05T09:32:46.338815+07:00 | 2025-01-05T10:33:00+08:00 | -13.661185 |
| jie-2025-07 · Tiểu Thử | 2025-07-07T03:04:59.099337+07:00 | 2025-07-07T04:05:00+08:00 | -0.900663 |

2014 Kinh Trập crosses on March 5 in Vietnam while HKO prints March 6. Independent T is 2014-03-05T23:02:15.805446+07:00 (model-derived serialized reference); HKO 00:02+08 is only corroboration. 2024 Bạch Lộ and other samples also exercise offset conversion. Files titled SolarTerms24 listing only principal terms were rejected as a Jie reference.

## Day Ganzhi and leap metadata

HKO calendar cells independently read: 2014-02-05 丁未, 2023-04-05 癸巳, 2024-03-05 戊辰, 2025-07-07 丁丑. The first gives cycle index43 in 甲子=0 order. Independently propagate by Gregorian civil-day difference modulo60; all three distant corroborations agree. This uses Python date arithmetic and source day labels, no production JD/Can Chi function or expected table. Fixture provenance identifies derived operands instead of claiming every HKO date cell was individually collated.

2023 April PDF header 閏二月小 and April1..19 cells establish leap second month; March22 new moon01:23+08 is 00:23+07, same civil start. Selected April6..17 noon samples are safely interior to leap2 and independent 辰 Jie interval. Lunar metadata is evidence for a regression, not a rule operand. Original spec binds civil day turnover at 00:00+07; no 23:00 mode is inferred.

## Remaining limitations

Numerical source/model review pending; source transcription/facsimile collation limits from earlier research remain disclosed. Future exact-instant integration must preserve the independently frozen reference and separately diagnose ephemeris/model differences. Presentation/date-only policy remains PENDING. No production implementation or comparison performed.
