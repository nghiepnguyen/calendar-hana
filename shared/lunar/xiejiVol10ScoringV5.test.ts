import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v5.json'
import { VOL10_JIESHA_AUTHORITY_ID } from './xiejiVol10JieshaAuthority'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring, VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'

// 卷十 Scoring Golden v5 (successor of v4): the shipped G1-SOIL Stage 2 graph (劫煞 authority v4, R2).
describeScoringGolden(
  '協紀 卷十 scoring policy — 卷十 Scoring Golden v5 (faithful-v1, authority v4)',
  golden,
  async () => ({
    resolveVol10,
    applyVol10Scoring,
    VOL10_SCORED_ENTRIES,
  }),
)

describe('卷十 Scoring Golden v5 provenance', () => {
  it('runs on authority v4; every date-dependent case declares date and soilState', () => {
    expect(VOL10_JIESHA_AUTHORITY_ID).toBe('xieji-vol10-jiesha-faithful-v4')
    const dd = golden.cases.filter((c) => 'soilState' in c)
    expect(dd.length).toBe(10)
    expect(dd.every((c) => 'date' in c)).toBe(true)
    expect(golden.cases.map((c) => c.id)).not.toContain('jie-chou-renyin-demolition-excluded')
  })
})
