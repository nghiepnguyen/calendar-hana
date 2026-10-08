import { readFileSync, writeFileSync } from 'node:fs'
import { it, vi } from 'vitest'
import { evaluateDay, evaluateInstant, productionRoots } from './collect'

// Projection only: production modules run unmodified; their astronomy source is
// replaced by ERFA canonical roots serialized through clock-v1.
vi.mock('astronomy-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('astronomy-engine')>()
  const erfa = await import('../../../../shared/astronomy/erfa/index')
  return {
    ...actual,
    SearchSunLongitude(longitude: number, start: Date, limitDays: number) {
      const s = start.getTime()
      const y = new Date(s).getUTCFullYear()
      for (const year of [y - 1, y, y + 1].filter((v) => v >= 1899 && v <= 2101))
        for (const b of erfa.erfaSolarTermsForYear(year)) {
          if (b.targetLongitudeDeg !== longitude) continue
          const civil = erfa.ttToCivil(b.ttMs).epochMs
          if (civil >= s && civil <= s + limitDays * 86400000)
            return { date: new Date(civil), tt: b.ttMs / 86400000, ut: (civil - 946728000000) / 86400000 }
        }
      return null
    },
  }
})

it('erfa: projected outputs at the same probes', () => {
  const base = JSON.parse(readFileSync(`${process.env.IMPACT_OUT}/baseline.json`, 'utf8'))
  const roots = productionRoots()
  const instants = Object.fromEntries(base.probes.instants.map((ms: number) => [ms, evaluateInstant(ms)]))
  const days = Object.fromEntries(base.probes.days.map((d: string) => [d, evaluateDay(d)]))
  writeFileSync(`${process.env.IMPACT_OUT}/erfa.json`, JSON.stringify({ roots, instants, days }))
})
