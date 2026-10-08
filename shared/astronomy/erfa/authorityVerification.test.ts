/// <reference types="node" />
// ERFA is the independent CI verifier of the shipped JPL authority table, never
// the runtime boundary. Gate: |T_ERFA − T_JPL| <= 0.5 s for every supported
// crossing; millisecond equality is not expected and not required.
import { writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { getCanonicalSolarTermsForYear } from '../solarTerms'
import { erfaSolarTermsForYear } from './index'

it('ERFA verifies every 1900–2100 authority crossing within 0.5 s', () => {
  const deltas: number[] = []
  let civilDateDisagreements = 0
  const vnDate = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
  for (let year = 1900; year <= 2100; year++) {
    const erfa = erfaSolarTermsForYear(year)
    const jpl = getCanonicalSolarTermsForYear(year)
    jpl.forEach((b) => {
      const e = erfa.find((x) => x.termIndex === b.termIndex)!
      expect(e.year).toBe(year)
      const delta = e.ttMs - b.ttMs
      deltas.push(delta)
      // Same clock-v1 civil offset applies to both instants (no leap second within 0.5 s).
      if (vnDate(b.civilEpochMs + delta) !== vnDate(b.civilEpochMs)) civilDateDisagreements++
    })
  }
  const abs = deltas.map(Math.abs).sort((a, b) => a - b)
  const report = {
    phase: '3B.4.4B',
    verifier: 'ERFA 2.0.1 port (shared/astronomy/erfa), CI only; not bundled as runtime authority',
    authority: 'astronomy-authority-v4 runtime table (golden-v4)',
    gate: '|T_ERFA - T_JPL| <= 500 ms for every supported crossing',
    crossings: deltas.length,
    maxAbsMs: abs.at(-1),
    medianAbsMs: abs[Math.floor(abs.length / 2)],
    p95AbsMs: abs[Math.floor(abs.length * 0.95)],
    over250Ms: abs.filter((x) => x > 250).length,
    over500Ms: abs.filter((x) => x > 500).length,
    integerMsEqual: abs.filter((x) => x === 0).length,
    erfaLater: deltas.filter((x) => x > 0).length,
    erfaEarlier: deltas.filter((x) => x < 0).length,
    vnCivilDateDisagreements: civilDateDisagreements,
    verdict: abs.at(-1)! <= 500 ? 'PASS' : 'FAIL',
  }
  if (process.env['ERFA_VERIFICATION_OUTPUT'])
    writeFileSync(process.env['ERFA_VERIFICATION_OUTPUT'], JSON.stringify(report, null, 2) + '\n')
  expect(deltas).toHaveLength(4824)
  expect(report.over500Ms).toBe(0)
}, 300_000)
