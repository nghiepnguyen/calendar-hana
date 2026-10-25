import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v4.json'
import { VOL10_JIESHA_AUTHORITY_ID } from './xiejiVol10JieshaAuthority'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring, VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'

// 卷十 Scoring Golden v4 (successor of v3): the shipped G1 glyph Stage 2 graph (劫煞 authority v3, R3).
describeScoringGolden(
  '協紀 卷十 scoring policy — 卷十 Scoring Golden v4 (faithful-v1, authority v3)',
  golden,
  async () => ({
    resolveVol10,
    applyVol10Scoring,
    VOL10_SCORED_ENTRIES,
  }),
)

describe('卷十 Scoring Golden v4 provenance', () => {
  it('runs on authority v3 and records the R3 demolition projection', () => {
    expect(VOL10_JIESHA_AUTHORITY_ID).toBe('xieji-vol10-jiesha-faithful-v3')
    expect(golden.provenance.demolition).toMatch(/^APPLIED_BY_CONTEXT/)
    const ids = golden.cases.map((c) => c.id)
    expect(ids).not.toContain('jie-chen-demolition-excluded')
    expect(ids).toContain('jie-chen-demolition-applied')
    expect(ids).toContain('jie-chou-renyin-demolition-excluded')
  })
})
