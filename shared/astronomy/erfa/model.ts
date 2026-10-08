// Versioned identity of the ERFA solar-term foundation. Any change to the
// model, coefficients, solver, clock or serialization requires a new version.

export const ERFA_SOLAR_TERM_MODEL = Object.freeze({
  id: 'hana-erfa-solar-term',
  version: '1.0.0-candidate.3b43',
  status: 'CANDIDATE_NOT_WIRED_TO_PRODUCTION',
  upstream: 'ERFA 2.0.1 (liberfa/erfa v2.0.1), derived from IAU SOFA',
  ephemeris: 'eraEpv00: VSOP2000-derived EPV00, 1,951 harmonic terms (Earth helio + SSB)',
  lightTime: 'one retardation of the barycentric Sun by |Earth_helio| / c',
  aberration: 'eraAb relativistic annual aberration, Earth barycentric velocity (eraApcs)',
  precession: 'IAU 2006 bias-precession, Fukushima–Williams angles (eraPfw06/eraObl06)',
  nutation: 'IAU 2000B (eraNut00b): 77 luni-solar terms + fixed planetary offsets',
  frame: 'apparent geocentric, TRUE ECLIPTIC AND EQUINOX OF DATE',
  observable: 'apparent geocentric ecliptic longitude of the Sun',
  timeScale: 'TT (used as TDB, |TDB − TT| < 2 ms)',
  targets: '24 terms at exact multiples of 15°, index = longitude / 15 (0 = Xuân phân)',
  boundary: 'T = first integer TT ms since J2000.0 TT with wrap(longitude − target) >= 0',
  domain: 'previous term: t < T; new term: t >= T; zero tolerance',
  solver: 'integer-grid Illinois false position + forced bisection, checked bracket ±10 d',
  math: 'deterministic fdlibm sin/cos/atan2 ports; IEEE-754 sqrt',
  supportedYears: '1900–2100 public; 1899 and 2101 internal padding',
})
