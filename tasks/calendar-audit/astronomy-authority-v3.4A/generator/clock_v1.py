"""clock-v1 (GENERATOR implementation, Python). Independent of the TypeScript
clockV1.ts: written from the authority spec, not translated from it.

TT integer ms since J2000.0 TT  ->  civil POSIX ms (first civil ms at/after).
  PRE1972_MODELED_UT1        civil < 1972-01-01: UT1 = TT - DeltaT(Espenak-Meeus 2006,
                             y = 2000 + (ut_days - 14) / 365.24217)
  UTC_LEAP_HISTORY           1972-01-01 <= civil < 2027-06-28: TT - 32.184 s - (TAI-UTC)
  PROJECTED_PINNED_TAI_UTC   civil >= 2027-06-28: TAI-UTC pinned at 37 s
Instants inside an inserted leap second raise LeapSecondError.
"""
import calendar
import hashlib
import math
from pathlib import Path

POLICY_ID = 'clock-v1'
LEAP_FILE_SHA256 = '6cb6f5d4b819f2e568e25db4b0b26d89dedf031fdffb18bc94d40f4e94e268d7'
J2000_TT_CLOCK_MS = 946728000000  # 2000-01-01T12:00:00.000 read on the TT clock
TT_MINUS_TAI_MS = 32184
KNOWN_THROUGH_MS = calendar.timegm((2027, 6, 28, 0, 0, 0)) * 1000


class LeapSecondError(Exception):
    pass


def _load_leaps(path):
    data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != LEAP_FILE_SHA256:
        raise RuntimeError('IERS Leap_Second.dat hash mismatch')
    rows = []
    for line in data.decode().splitlines():
        parts = line.split()
        if len(parts) == 5 and parts[0].endswith('.0') and not line.lstrip().startswith('#'):
            _, day, month, year, offset = parts
            start = calendar.timegm((int(year), int(month), int(day), 0, 0, 0)) * 1000
            rows.append((start, TT_MINUS_TAI_MS + int(offset) * 1000))
    if len(rows) != 28 or rows[-1][1] != TT_MINUS_TAI_MS + 37000:
        raise RuntimeError('unexpected leap table')
    return rows


def _delta_t_seconds(ut_days):
    # Same IEEE-754 operation sequence as the reference polynomial definition
    # (Espenak & Meeus 2006 polynomials as pinned by the clock-v1 spec), so every implementation of
    # clock-v1 produces bit-identical Delta-T.
    y = 2000 + ((ut_days - 14) / 365.24217)
    if y < 1860 or y >= 1986:
        raise ValueError(f'DeltaT outside clock-v1 pre-1972 range: {y}')
    if y < 1900:
        u = y - 1860
        u2 = u * u
        u3 = u * u2
        u4 = u2 * u2
        u5 = u2 * u3
        return 7.62 + 0.5737 * u - 0.251754 * u2 + 0.01680668 * u3 - 0.0004473624 * u4 + u5 / 233174
    if y < 1920:
        u = y - 1900
        u2 = u * u
        u3 = u * u2
        u4 = u2 * u2
        return -2.79 + 1.494119 * u - 0.0598939 * u2 + 0.0061966 * u3 - 0.000197 * u4
    if y < 1941:
        u = y - 1920
        u2 = u * u
        u3 = u * u2
        return 21.20 + 0.84493 * u - 0.076100 * u2 + 0.0020936 * u3
    if y < 1961:
        u = y - 1950
        u2 = u * u
        u3 = u * u2
        return 29.07 + 0.407 * u - u2 / 233 + u3 / 2547
    u = y - 1975
    u2 = u * u
    u3 = u * u2
    return 45.45 + 1.067 * u - u2 / 260 - u3 / 718


class ClockV1:
    def __init__(self, leap_file):
        self.leaps = _load_leaps(leap_file)
        self.utc_era_tt = self.leaps[0][0] + self.leaps[0][1]

    def civil(self, tt_ms):
        """Returns (epoch_ms, regime)."""
        assert isinstance(tt_ms, int)
        tt_clock = tt_ms + J2000_TT_CLOCK_MS
        if tt_clock < self.utc_era_tt:
            ut = float(tt_ms)
            for _ in range(6):
                ut = tt_ms - _delta_t_seconds(ut / 86400000.0) * 1000.0
            return math.ceil(ut + J2000_TT_CLOCK_MS), 'PRE1972_MODELED_UT1'
        offset = None
        for i, (start, off) in enumerate(self.leaps):
            if tt_clock >= start + off:
                offset, k = off, i
        epoch = tt_clock - offset
        if k + 1 < len(self.leaps) and epoch >= self.leaps[k + 1][0]:
            raise LeapSecondError(f'TT {tt_ms} falls inside an inserted leap second')
        regime = 'PROJECTED_PINNED_TAI_UTC' if epoch >= KNOWN_THROUGH_MS else 'UTC_LEAP_HISTORY'
        return epoch, regime


def iso(epoch_ms):
    secs, ms = divmod(epoch_ms, 1000)
    t = __import__('time').gmtime(secs)
    return '%04d-%02d-%02dT%02d:%02d:%02d.%03dZ' % (t.tm_year, t.tm_mon, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec, ms)
