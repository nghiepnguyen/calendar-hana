import { describe, expect, it, vi } from 'vitest'
import golden from '../almanac-data/golden-xieji-vol10-scoring-v4.json'
import { describeScoringGolden } from './xiejiVol10ScoringGolden'

// 卷十 Scoring Golden v4 (successor of v3), frozen before G1-SOIL Stage 2: run on the authority v3 graph
// (g1GlyphRollback.ts), i.e. shipped G1 glyph Stage 2. The shipped successor is golden-xieji-vol10-scoring-v5.json.
let graph: Promise<{
  resolveVol10: typeof import('./xiejiVol10Resolution').resolveVol10
  applyVol10Scoring: typeof import('./xiejiVol10Scoring').applyVol10Scoring
  VOL10_SCORED_ENTRIES: ReadonlySet<string>
}>
const rollback = () =>
  (graph ??= (async () => {
    vi.resetModules()
    const { jieshaAuthorityV3, assertJieshaAuthority, V3_ID } = await import('./g1GlyphRollback')
    vi.doMock('../almanac-data/xieji-vol10-jiesha-authority-v4.json', () => jieshaAuthorityV3())
    await assertJieshaAuthority(V3_ID)
    const { resolveVol10 } = await import('./xiejiVol10Resolution')
    const { applyVol10Scoring, VOL10_SCORED_ENTRIES } = await import('./xiejiVol10Scoring')
    return { resolveVol10, applyVol10Scoring, VOL10_SCORED_ENTRIES }
  })())

describeScoringGolden(
  '協紀 卷十 scoring policy — 卷十 Scoring Golden v4 (faithful-v1, authority v3)',
  golden,
  rollback,
)

describe('卷十 Scoring Golden v4 provenance', () => {
  it('records the R3 demolition projection', () => {
    expect(golden.provenance.demolition).toMatch(/^APPLIED_BY_CONTEXT/)
    const ids = golden.cases.map((c) => c.id)
    expect(ids).not.toContain('jie-chen-demolition-excluded')
    expect(ids).toContain('jie-chen-demolition-applied')
    expect(ids).toContain('jie-chou-renyin-demolition-excluded')
  })
})
