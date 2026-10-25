import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v3.json'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'

// Golden v3 (successor of v2), frozen before G1 glyph Stage 2: run on the authority v2 graph (g1GlyphRollback.ts),
// i.e. shipped G2 Stage 2. The shipped successor is golden-xieji-vol10-scoring-v4.json (xiejiVol10ScoringV4.test.ts).
let graph: Promise<{
  resolveVol10: typeof import('./xiejiVol10Resolution').resolveVol10
  applyVol10Scoring: typeof import('./xiejiVol10Scoring').applyVol10Scoring
  VOL10_SCORED_ENTRIES: ReadonlySet<string>
}>
const rollback = () =>
  (graph ??= (async () => {
    vi.resetModules()
    const { jieshaAuthorityV2, assertJieshaAuthority, V2_ID } = await import('./g1GlyphRollback')
    vi.doMock('../almanac-data/xieji-vol10-jiesha-authority-v3.json', () => jieshaAuthorityV2())
    await assertJieshaAuthority(V2_ID)
    const { resolveVol10 } = await import('./xiejiVol10Resolution')
    const { applyVol10Scoring, VOL10_SCORED_ENTRIES } = await import('./xiejiVol10Scoring')
    return { resolveVol10, applyVol10Scoring, VOL10_SCORED_ENTRIES }
  })())

describeScoringGolden(
  '協紀 卷十 scoring policy — golden v3 (faithful-v1, authority v2)',
  golden,
  rollback,
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
