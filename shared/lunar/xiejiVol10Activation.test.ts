import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import witnesses from '../../docs/audits/xieji-vol10-post-pr29-samples.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import type { SolarDateString } from '../types'

// Release witnesses are observed OFF/ON migration outputs, not independent Golden.
// This test uses the real production manifest and proves it reaches the reviewed ON path.
// The witnesses predate dropping business from open_business (kaishiDoubleCountMigration),
// so that mapping is pinned here.
vi.mock('../almanac-data/event-mapping.json', async (importOriginal) => {
  const { legacyOpenBusinessMapping } = await import('./legacyEventMapping')
  const { default: original } = await importOriginal<{
    default: typeof import('../almanac-data/event-mapping.json')
  }>()
  return legacyOpenBusinessMapping(original)
})
describe('卷十 production activation', () => {
  it('enables only 卷十 while mansion scoring stays informational', () => {
    expect(manifest.policies.xiejiVol10Scoring).toBe(true)
    expect(manifest.policies.mansion28ScoringEnabled).toBe(false)
  })

  for (const [transition, witness] of Object.entries(witnesses))
    it(transition, () => {
      const result = evaluateEventDay(
        witness.date as SolarDateString,
        witness.event as Parameters<typeof evaluateEventDay>[1],
        { hour: 9 },
      )
      expect({ score: result.score, classification: result.classification }).toEqual(witness.after)
      expect(result.classicalResolution.items).toEqual(witness.items)
    })

  for (const [date, month, entry] of [
    ['2025-03-17', 3, 'yue_po'],
    ['2025-12-09', 0, 'yue_yan'],
  ] as const)
    it(`${date}: release smoke ${entry}`, () => {
      const day = getAlmanac(date)
      expect(day.selectionContext.MONTH_JIAN_BRANCH).toBe(month)
      const result = evaluateEventDay(date, 'wedding', { hour: 9 })
      expect(result.classicalResolution.items.some((item) => item.entry === entry)).toBe(true)
      expect(result.classicalResolution.items.some((item) => item.verdict === 'undetermined')).toBe(
        false,
      )
    })
})
