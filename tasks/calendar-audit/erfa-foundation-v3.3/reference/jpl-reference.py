"""Phase 3B.4.3 independent astronomy reference (AUDIT ONLY, never runtime).

JPL DE440s via Skyfield 1.55 / jplephem 2.24: apparent geocentric Sun in the
true ecliptic and equinox of date (Skyfield ecliptic_frame), TT roots.

Independence: seeds come only from the Gregorian calendar (TT Jan 1 + mean
solar motion); no ERFA, Astronomy Engine or Swiss value is read. Each root is
bracketed (sign change checked over +-12 days), refined by Newton iterations
with a numerical derivative, then confirmed by a bracketing sign test at
+-1 ms of the converged root. Rows failing any check abort the run.

Usage (repo root):
  PYTHONPATH=<skyfield site> python3 tasks/calendar-audit/erfa-foundation-v3.3/reference/jpl-reference.py <de440s.bsp>
"""
import hashlib
import json
import sys
import time
from pathlib import Path

import numpy as np
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame
import skyfield
import jplephem

KERNEL_SHA256 = 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2'
kernel = Path(sys.argv[1])
digest = hashlib.sha256(kernel.read_bytes()).hexdigest()
assert digest == KERNEL_SHA256, f'kernel hash mismatch {digest}'
out_dir = Path('tasks/calendar-audit/erfa-foundation-v3.3')

eph = load_file(str(kernel))
ts = load.timescale(builtin=True)
earth, sun = eph['earth'], eph['sun']

rows = [(y, (19 + k) % 24) for y in range(1899, 2102) for k in range(24)]
year = np.array([r[0] for r in rows])
term = np.array([r[1] for r in rows])
target = term * 15.0


def jan1_days(y):
    # Days since J2000.0 TT of TT Jan 1 00:00 (proleptic Gregorian).
    return np.array([(np.datetime64(f'{int(v):04d}-01-01') - np.datetime64('2000-01-01')).astype(int) - 0.5 for v in y])


def longitude(days):
    t = ts.tt_jd(2451545.0, days)
    lat, lon, _ = earth.at(t).observe(sun).apparent().frame_latlon(ecliptic_frame)
    return lon.degrees


def residual(days):
    return (longitude(days) - target + 180.0) % 360.0 - 180.0


start = time.perf_counter()
seed = jan1_days(year) + 5.0 + ((target - 285.0 + 360.0) % 360.0) / 360.0 * 365.2422
lo, hi = seed - 12.0, seed + 12.0
flo, fhi = residual(lo), residual(hi)
assert np.all(flo < 0) and np.all(fhi > 0), 'reference bracket failure'
root = seed.copy()
h = 1e-3
for _ in range(10):
    f = residual(root)
    slope = (residual(root + h) - residual(root - h)) / (2 * h)
    root = np.clip(root - f / slope, lo, hi)
final = residual(root)
one_ms = 1.0 / 86400000.0
before, after = residual(root - one_ms), residual(root + one_ms)
assert np.all(before < 0) and np.all(after > 0), 'root not confirmed by +-1 ms sign test'
# Linear refinement inside the confirmed +-1 ms bracket (sub-ms precision).
root_ms = root * 86400000.0 - final / ((after - before) / 2.0)
# Second, independent bisection pass on a coarser bracket for convergence evidence.
blo, bhi = root - 0.01, root + 0.01
for _ in range(45):
    mid = (blo + bhi) / 2
    pos = residual(mid) >= 0
    bhi = np.where(pos, mid, bhi)
    blo = np.where(pos, blo, mid)
bisect_ms = bhi * 86400000.0
elapsed = time.perf_counter() - start

out = {
    'classification': 'INDEPENDENT_REFERENCE_AUDIT_ONLY',
    'identity': 'JPL DE440s / Skyfield %s / jplephem %s / numpy %s; apparent geocentric Sun, '
                'true ecliptic and equinox of date (skyfield.framelib.ecliptic_frame); TT'
                % (skyfield.__version__, jplephem.__version__, np.__version__),
    'kernel': {'source': 'https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp', 'sha256': digest,
               'bytes': kernel.stat().st_size},
    'seed': 'TT Jan 1 + 5 d + mean motion from 285 deg; bracket +-12 d; no model roots consulted',
    'solver': 'Newton x10 (central difference h=1e-3 d) clipped to bracket; +-1 ms sign confirmation; '
              'linear sub-ms refinement; independent 45-step bisection cross-check',
    'count': len(rows),
    'maxFinalResidualDeg': float(np.max(np.abs(final))),
    'maxNewtonVsBisectionMs': float(np.max(np.abs(root_ms - bisect_ms))),
    'elapsedSeconds': elapsed,
    'rowFormat': ['year', 'termIndex (longitude/15)', 'jplTtMsSinceJ2000 (TT ms since J2000.0 TT, 4 decimals)'],
    'rows': [[int(y), int(k), round(float(m), 4)] for y, k, m in zip(year, term, root_ms)],
}
(out_dir / 'fixtures').mkdir(exist_ok=True)
(out_dir / 'fixtures/jpl-de440s-reference-v3.3.json').write_text(json.dumps(out, separators=(',', ':')).replace('],[', '],\n[') + '\n')
print({k: v for k, v in out.items() if k != 'rows'})
