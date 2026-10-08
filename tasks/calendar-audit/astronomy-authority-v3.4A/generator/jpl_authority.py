"""Phase 3B.4.4A GENERATOR: independent JPL solar-term authority dataset.

Authority (Layer A): JPL DE440s via Skyfield 1.55 / jplephem 2.24; apparent
geocentric tropical longitude of the Sun in the true ecliptic and equinox of
date (skyfield.framelib.ecliptic_frame); time scale TT.
Canonical boundary (Layer C): T = first integer TT millisecond since J2000.0 TT
at or after the crossing = ceil(R), confirmed by the sign of the residual at
T - 1 ms and T. Civil serialization (Layer D): clock-v1 (clock_v1.py).

Inputs only: the pinned kernel, the calendar (seeds), clock-v1. No production
engine, ERFA output, Astronomy Engine value or old Golden timestamp is read.

Usage: PYTHONPATH=<skyfield> python3 jpl_authority.py <de440s.bsp> <Leap_Second.dat> <out.json>
"""
import hashlib
import json
import math
import sys
import time
from datetime import date

import jplephem
import numpy as np
import skyfield
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame

from clock_v1 import POLICY_ID, ClockV1, iso

GENERATOR_VERSION = 'jpl-authority-generator 1.0.0'
KERNEL_SHA256 = 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2'
MS_PER_DAY = 86400000.0

kernel_path, leap_path, out_path = sys.argv[1:4]
kernel_bytes = open(kernel_path, 'rb').read()
if hashlib.sha256(kernel_bytes).hexdigest() != KERNEL_SHA256:
    raise SystemExit('kernel hash mismatch')
eph = load_file(kernel_path)
ts = load.timescale(builtin=True)
earth, sun = eph['earth'], eph['sun']
clock = ClockV1(leap_path)

rows = [(y, (19 + k) % 24) for y in range(1899, 2102) for k in range(24)]
year = np.array([r[0] for r in rows])
term = np.array([r[1] for r in rows])
target = term * 15.0


def residual_days(days):
    t = ts.tt_jd(2451545.0, days)
    lon = earth.at(t).observe(sun).apparent().frame_latlon(ecliptic_frame)[1].degrees
    return (lon - target + 180.0) % 360.0 - 180.0


def residual_ms(ms):
    # Integer TT ms -> days with an exact integer numerator.
    return residual_days(np.asarray(ms, dtype=np.int64) / MS_PER_DAY)


start = time.perf_counter()
jan1 = np.array([(date(int(y), 1, 1) - date(2000, 1, 1)).days - 0.5 for y in year])
seed = jan1 + 5.0 + ((target - 285.0 + 360.0) % 360.0) / 360.0 * 365.2422
lo, hi = seed - 12.0, seed + 12.0
if not (np.all(residual_days(lo) < 0) and np.all(residual_days(hi) > 0)):
    raise SystemExit('REFERENCE_ROOT_ERROR: bracket failure')
root = seed.copy()
for _ in range(10):
    f = residual_days(root)
    slope = (residual_days(root + 1e-3) - residual_days(root - 1e-3)) / 2e-3
    root = np.clip(root - f / slope, lo, hi)
# Sub-millisecond refinement with the local slope per millisecond.
f0 = residual_days(root)
slope_ms = (residual_days(root + 1 / MS_PER_DAY) - residual_days(root - 1 / MS_PER_DAY)) / 2.0
root_ms = root * MS_PER_DAY - f0 / slope_ms

# Canonical T = ceil(R); confirmed (and, if R sits within float noise of an
# integer, settled) by the residual sign at integer milliseconds.
T = np.ceil(root_ms).astype(np.int64)
adjust = np.zeros(len(T), dtype=np.int64)
for _ in range(3):
    before, at = residual_ms(T - 1), residual_ms(T)
    down = before >= 0
    up = at < 0
    if not (down.any() or up.any()):
        break
    T = T - down.astype(np.int64) + up.astype(np.int64)
    adjust += up.astype(np.int64) - down.astype(np.int64)
before, at = residual_ms(T - 1), residual_ms(T)
if not (np.all(before < 0) and np.all(at >= 0)):
    raise SystemExit('REFERENCE_ROOT_ERROR: canonical sign test failed')
elapsed = time.perf_counter() - start

# The float root estimate carries about 0.5 microsecond of noise (ulp of ~3e12 ms).
# Where it lies within 1 microsecond of an integer, the residual sign at integer
# milliseconds -- not the float estimate -- settles T; such rows are flagged.
out_rows = []
for y, k, r, t, adj in zip(year, term, root_ms, T, adjust):
    civil, regime = clock.civil(int(t))
    settled = bool(adj != 0 or abs(r - round(r)) < 1e-3)
    row = [int(y), int(k), f'{r:.3f}', int(t), civil, iso(civil), regime, 1 if settled else 0]
    out_rows.append('|'.join(str(v) for v in row))

doc = {
    'authorityVersion': 'astronomy-authority-v4',
    'datasetId': 'solar-terms-jpl-de440s-clock-v1',
    'reviewStatus': 'CANDIDATE',
    'referenceEngine': f'JPL DE440s via Skyfield {skyfield.__version__} / jplephem {jplephem.__version__} / numpy {np.__version__}',
    'referenceKernel': 'de440s.bsp (https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp)',
    'referenceKernelSha256': KERNEL_SHA256,
    'observable': 'apparent geocentric tropical ecliptic longitude of the Sun',
    'frame': 'true ecliptic and equinox of date (skyfield.framelib.ecliptic_frame)',
    'timeScale': 'TT',
    'targets': '24 solar terms, exact multiples of 15 degrees; termIndex = longitude / 15 (0 = Xuan phan)',
    'numericalBoundaryPolicy': 'T = first integer TT millisecond since J2000.0 TT at or after the crossing (ceil), sign-confirmed at T-1 ms and T',
    'clockPolicy': POLICY_ID,
    'serializationPolicy': 'civil epoch ms = first civil ms at/after T under clock-v1; ISO-8601 UTC with exactly 3 fractional digits',
    'coverage': {'supported': '1900-2100 (4,824 crossings)', 'padding': '1899 and 2101 (48 crossings, internal only)'},
    'generatorVersion': GENERATOR_VERSION,
    'generatedAt': 'deterministic (not recorded; see manifest)',
    'solver': 'calendar seed, +-12 d bracket, 10 Newton steps (central difference), sub-ms linear refinement, ceil, integer-ms sign confirmation',
    'signTestAdjustments': int(np.count_nonzero(adjust)),
    'minAbsResidualDegAtTminus1': float(np.min(np.abs(before))),
    'minAbsResidualDegAtT': float(np.min(np.abs(at))),
    'rootPrecision': 'rootTtMs is a float estimate (about 0.5 microsecond noise), audit only; T is defined by residual signs at integer ms',
    'rowEncoding': 'one pipe-delimited string per crossing, fields in rowFormat order',
    'rowFormat': ['year', 'termIndex', 'rootTtMs (3 dp float estimate, audit only)', 'ttMs (canonical T)', 'civilEpochMs (clock-v1)', 'civilIso', 'clockRegime', 'signSettled 1/0 (root within 1 microsecond of an integer; T fixed by sign test)'],
    'rows': out_rows,
}
text = json.dumps(doc, ensure_ascii=False, indent=2) + '\n'
open(out_path, 'w').write(text)
print(json.dumps({'rows': len(out_rows), 'signTestAdjustments': doc['signTestAdjustments'],
                  'minAbsResidualDegAtTminus1': doc['minAbsResidualDegAtTminus1'],
                  'minAbsResidualDegAtT': doc['minAbsResidualDegAtT'], 'seconds': round(elapsed, 1),
                  'sha256': hashlib.sha256(text.encode()).hexdigest()}))
