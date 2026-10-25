import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v3.json'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'
import { resolveVol10 } from './xiejiVol10Resolution'
import { applyVol10Scoring, VOL10_SCORED_ENTRIES } from './xiejiVol10Scoring'

// Golden v3 (successor of v2): the shipped G2 Stage 2 graph (立劵交易 alias + 劫煞 authority v2).
describeScoringGolden(
  '協紀 卷十 scoring policy — golden v3 (faithful-v1, authority v2)',
  golden,
  async () => ({
    resolveVol10,
    applyVol10Scoring,
    VOL10_SCORED_ENTRIES,
  }),
)

describe('golden v3 provenance', () => {
  it('records the approved authority and the v2 projection', () => {
    expect(golden.provenance.sourceAuthority).toContain(
      'b24f6f68e6b662fc04b5ec56ab6f2da8981273291ef3bf4e05a028b2f48d326a',
    )
    expect(golden.provenance.demolition).toMatch(/^EXCLUDED_PENDING_GLYPH_AUDIT/)
    expect(golden.provenance.contractTransaction).toMatch(/^APPLIED/)
    expect(golden.cases.map((c) => c.id)).not.toContain('jie-chen-contract-unreachable')
  })
})
