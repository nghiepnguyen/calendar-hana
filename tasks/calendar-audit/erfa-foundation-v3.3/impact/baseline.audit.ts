import { writeFileSync } from 'node:fs'
import { it } from 'vitest'
import { evaluateDay, evaluateInstant, productionRoots } from './collect'
import { buildProbes } from './probes'

it('baseline: production Astronomy Engine outputs at all probes', () => {
  const probes = buildProbes(productionRoots())
  const instants = Object.fromEntries(probes.instants.map((ms) => [ms, evaluateInstant(ms)]))
  const days = Object.fromEntries(probes.days.map((d) => [d, evaluateDay(d)]))
  writeFileSync(`${process.env.IMPACT_OUT}/baseline.json`, JSON.stringify({ probes, instants, days }))
})
