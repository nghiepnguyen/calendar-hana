"""Phase 3B.4.4A INDEPENDENT REVIEW of the JPL authority dataset.

Distinct from the generator in every step that can be made distinct:
  - longitude route: apparent RA/Dec of date + true obliquity (mean obliquity +
    nutation in obliquity), converted to ecliptic longitude by spherical
    trigonometry -- not skyfield.framelib.ecliptic_frame;
  - seed: Meeus solar mean longitude (not the generator's calendar offset);
  - solver: pure integer-millisecond bisection driven only by residual signs
    (no Newton, no float root, no ceil);
  - structure checks: cardinality, order, targets, monotonicity, intervals, hashes.
Usage: PYTHONPATH=<skyfield> python3 review_authority.py <de440s.bsp> <candidate.json> <out.json>
"""
import hashlib
import json
import sys

import numpy as np
from skyfield.api import load, load_file

KERNEL_SHA256 = 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2'
kernel_path, candidate_path, out_path = sys.argv[1:4]
assert hashlib.sha256(open(kernel_path, 'rb').read()).hexdigest() == KERNEL_SHA256
text = open(candidate_path).read()
cand = json.loads(text)
eph = load_file(kernel_path)
ts = load.timescale(builtin=True)
earth, sun = eph['earth'], eph['sun']
findings = []


def finding(cls, msg, **kw):
    findings.append(dict(classification=cls, message=msg, **kw))


# ---- Structure ---------------------------------------------------------------------
def parse(encoded):
    f = encoded.split('|')
    if len(f) != 8:
        finding('GOLDEN_GENERATOR_ERROR', 'row field count', row=encoded)
    return [int(f[0]), int(f[1]), f[2], int(f[3]), int(f[4]), f[5], f[6], f[7] == '1']


rows = [parse(r) for r in cand['rows']]
required = ['authorityVersion', 'referenceEngine', 'referenceKernel', 'referenceKernelSha256', 'observable', 'frame',
            'timeScale', 'numericalBoundaryPolicy', 'clockPolicy', 'serializationPolicy', 'generatedAt',
            'generatorVersion', 'reviewStatus']
for k in required:
    if k not in cand:
        finding('GOLDEN_GENERATOR_ERROR', f'missing metadata {k}')
if cand.get('referenceKernelSha256') != KERNEL_SHA256:
    finding('GOLDEN_GENERATOR_ERROR', 'kernel hash in metadata differs')
if cand.get('timeScale') != 'TT' or cand.get('clockPolicy') != 'clock-v1':
    finding('GOLDEN_GENERATOR_ERROR', 'time scale / clock policy metadata')
expected_keys = [(y, (19 + k) % 24) for y in range(1899, 2102) for k in range(24)]
if [(r[0], r[1]) for r in rows] != expected_keys:
    finding('GOLDEN_GENERATOR_ERROR', 'year/term cardinality or order differs from 1899-2101 x 24 (285 deg first)')
tt = np.array([r[3] for r in rows], dtype=np.int64)
civil = np.array([r[4] for r in rows], dtype=np.int64)
gaps_days = np.diff(tt) / 86400000.0
if not np.all(np.diff(tt) > 0) or not np.all(np.diff(civil) > 0):
    finding('GOLDEN_GENERATOR_ERROR', 'boundaries not strictly increasing')
if not (gaps_days.min() > 14.0 and gaps_days.max() < 16.5):
    finding('GOLDEN_GENERATOR_ERROR', f'interval inconsistency {gaps_days.min()}..{gaps_days.max()} d')
for r in rows:
    root, T, settled = float(r[2]), r[3], r[7]
    if settled:
        # Float estimate within 1 microsecond of an integer: only the sign test can decide.
        if min(abs(root - T), abs(root - (T - 1))) >= 1e-3:
            finding('GOLDEN_GENERATOR_ERROR', 'signSettled flag on a root not near an integer', row=r[:4])
    elif not (T - 1 < root <= T):
        finding('GOLDEN_GENERATOR_ERROR', 'canonical T is not ceil(root)', row=r[:4])

# ---- Independent longitude route + integer bisection --------------------------------
target = np.array([r[1] * 15.0 for r in rows])
year = np.array([r[0] for r in rows])


def longitude(ms):
    t = ts.tt_jd(2451545.0, np.asarray(ms, dtype=np.int64) / 86400000.0)
    ra, dec, _ = earth.at(t).observe(sun).apparent().radec(epoch='date')
    dpsi, deps = t._nutation_angles_radians
    eps = t._mean_obliquity_radians + deps
    a, d = ra.radians, dec.radians
    lam = np.arctan2(np.sin(a) * np.cos(eps) + np.tan(d) * np.sin(eps), np.cos(a))
    return np.degrees(lam) % 360.0


def sign_new(ms):
    """True when the instant is on the NEW side (residual >= 0)."""
    r = (longitude(ms) - target + 180.0) % 360.0 - 180.0
    return r >= 0, r


# Seed: Meeus mean solar longitude L0 = 280.46646 + 36000.76983 T (+0.0003032 T^2).
jan1_days = np.array([(np.datetime64(f'{y:04d}-01-01') - np.datetime64('2000-01-01')).astype(int) - 0.5 for y in year])
T0 = jan1_days / 36525.0
L0 = (280.46646 + 36000.76983 * T0 + 0.0003032 * T0**2) % 360.0
seed_days = jan1_days + ((target - L0) % 360.0) / 0.98564736
lo = np.floor((seed_days - 6.0) * 86400000.0).astype(np.int64)
hi = np.floor((seed_days + 6.0) * 86400000.0).astype(np.int64)
lo_new, _ = sign_new(lo)
hi_new, _ = sign_new(hi)
if lo_new.any() or not hi_new.all():
    raise SystemExit('REVIEWER_ERROR: independent bracket failed')
while np.any(hi - lo > 1):
    mid = lo + (hi - lo) // 2
    new, _ = sign_new(mid)
    active = hi - lo > 1
    hi = np.where(active & new, mid, hi)
    lo = np.where(active & ~new, mid, lo)
review_T = hi
_, r_before = sign_new(review_T - 1)
_, r_at = sign_new(review_T)

mismatch = np.nonzero(review_T != tt)[0]
for i in mismatch:
    margin = min(abs(r_before[i]), abs(r_at[i]))
    cls = 'REFERENCE_ROOT_ERROR' if margin > 1e-10 else 'UNKNOWN'
    finding(cls, 'canonical T differs from independent review', year=int(year[i]), termIndex=int(rows[i][1]),
            generatorT=int(tt[i]), reviewT=int(review_T[i]), reviewResidualMarginDeg=float(margin))

margin = np.minimum(np.abs(r_before), np.abs(r_at))
result = dict(
    phase='3B.4.4A', review='independent JPL authority review',
    candidateSha256=hashlib.sha256(text.encode()).hexdigest(),
    method='RA/Dec of date + true obliquity spherical conversion; Meeus mean-longitude seed +-6 d; pure integer-ms sign bisection',
    rows=len(rows), exactCanonicalMatches=int(len(rows) - len(mismatch)), mismatches=int(len(mismatch)),
    minSignMarginDeg=float(margin.min()),
    nearIntegerRootsBelow1e10Deg=int(np.count_nonzero(margin < 1e-10)),
    signSettledRows=[r[:4] for r in rows if r[7]],
    maxRootVsReviewTMs=float(np.max(np.abs(np.array([float(r[2]) for r in rows]) - review_T))),
    structureChecks=dict(cardinality=len(rows) == 4872, order='checked', strictlyIncreasing=bool(np.all(np.diff(tt) > 0)),
                         gapDaysMin=float(gaps_days.min()), gapDaysMax=float(gaps_days.max())),
    findings=findings,
    verdict='PASS' if not findings else 'FAIL',
    reviewTtMs=[int(x) for x in review_T],
)
open(out_path, 'w').write(json.dumps(result, indent=1) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'reviewTtMs'}, indent=1)[:1800])
