import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v2.json'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'

// Golden v2 (successor of v1), frozen before G2 Stage 2: run on the pre-G2 rollback graph (g2Rollback.ts).
// The shipped successor is golden-xieji-vol10-scoring-v3.json (xiejiVol10ScoringV3.test.ts).
let graph: Promise<{
  resolveVol10: typeof import('./xiejiVol10Resolution').resolveVol10
  applyVol10Scoring: typeof import('./xiejiVol10Scoring').applyVol10Scoring
  VOL10_SCORED_ENTRIES: ReadonlySet<string>
}>
const rollback = () =>
  (graph ??= (async () => {
    vi.resetModules()
    const { withoutG2Alias, jieshaAuthorityV1 } = await import('./g2Rollback')
    vi.doMock('../almanac-data/xiejibianfangshu-vol10-yiji.json', async (load) =>
      withoutG2Alias(await load()),
    )
    vi.doMock('../almanac-data/xieji-vol10-jiesha-authority-v3.json', () => jieshaAuthorityV1())
    await (await import('./g1GlyphRollback')).assertJieshaAuthority('xieji-vol10-jiesha-faithful-v1')
    const { resolveVol10 } = await import('./xiejiVol10Resolution')
    const { applyVol10Scoring, VOL10_SCORED_ENTRIES } = await import('./xiejiVol10Scoring')
    return { resolveVol10, applyVol10Scoring, VOL10_SCORED_ENTRIES }
  })())

describeScoringGolden('協紀 卷十 scoring policy — golden v2 (faithful-v1)', golden, rollback)

describe('golden v2 provenance', () => {
  it('records the approved authority and the v1 projection', () => {
    expect(golden.provenance.sourceAuthority).toContain(
      'b24f6f68e6b662fc04b5ec56ab6f2da8981273291ef3bf4e05a028b2f48d326a',
    )
    expect(golden.provenance.demolition).toMatch(/^EXCLUDED_PENDING_GLYPH_AUDIT/)
    expect(golden.provenance.contractTransaction).toMatch(
      /^UNREACHABLE_UNDER_CURRENT_VOL10_NORMALIZATION/,
    )
    expect(golden.provenance.normalization).toBe('unchanged')
  })
})
