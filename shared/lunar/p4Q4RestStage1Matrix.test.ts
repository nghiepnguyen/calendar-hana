import { describe, expect, it } from 'vitest'
import coverage from '../../docs/audits/sources/p4-vol10/q4-rest-stage1/coverage.json'
import evidence from '../../docs/audits/sources/p4-vol10/q4-rest-stage1/evidence.json'
import matrix from '../../docs/audits/sources/p4-vol10/q4-rest-stage1/matrix.json'

// Audit only: Q4-REST Stage 1. Every classification must re-derive from the recorded cell fields, so the
// matrix cannot be edited into a conclusion the evidence does not carry.
type Cell = (typeof matrix.cells)[number]
const GODS = ['九空', '五虛', '小耗', '五墓'] as const
const ji = (s: string) => s === 'only_ji' || s === 'both_present'

describe('Q4-REST Stage 1 matrix', () => {
  it('each cell classification follows from its printed state and the two predictions', () => {
    for (const c of matrix.cells as Cell[]) {
      expect(c.clean, c.witness).toBe(c.status === 'CLEAN')
      if (!c.clean) {
        expect(c.classification).toBeNull()
        continue
      }
      expect(c.ownLifters).toEqual([])
      expect(c.otherJi).toEqual([])
      expect(c.nonOwnTriggers.length).toBeGreaterThan(0)
      expect(c.predictGeneric).not.toBe(c.predictNarrow)
      const want =
        c.printed === c.predictGeneric ? 'A' : c.printed === c.predictNarrow ? 'B' : 'C'
      expect(c.classification, c.witness).toBe(want)
      const [p, a, b] = [ji(c.printed), ji(c.predictGeneric), ji(c.predictNarrow)]
      expect(c.jiAxis, c.witness).toBe(a === b ? 'NONE' : p === a ? 'A' : 'B')
    }
  })

  it('god × heading and god aggregates derive from the cells', () => {
    const godHeading = matrix.godHeading as Record<string, Record<string, { classification: string }>>
    for (const g of GODS) {
      const cls: string[] = []
      for (const [h, v] of Object.entries(godHeading[g]!)) {
        const clean = (matrix.cells as Cell[]).filter((c) => c.god === g && c.heading === h && c.clean)
        const k = clean.map((c) => c.classification!)
        const want = !k.length
          ? 'D'
          : k.includes('C') || (k.includes('A') && k.includes('B'))
            ? 'C'
            : k[0]! + (k.length > 1 ? '2' : '1')
        expect(v.classification, `${g} ${h}`).toBe(want)
        cls.push(want[0]!)
      }
      const has = new Set(cls.filter((c) => c !== 'D'))
      const agg = cls.includes('C')
        ? 'UNRESOLVED_CONFLICT'
        : !has.size || cls.includes('D')
          ? 'INSUFFICIENT_EVIDENCE'
          : has.size > 1
            ? 'MIXED_BY_HEADING'
            : has.has('A')
              ? 'SUPPORTS_Q4_GENERIC'
              : 'SUPPORTS_GOD_NARROW'
      expect((matrix.aggregates as Record<string, string>)[g], g).toBe(agg)
    }
    expect(evidence.aggregates).toEqual(matrix.aggregates)
    expect(evidence.globalQ4Rest).toBe('NOT_RULED')
  })

  it('freezes the Stage 1 outcome', () => {
    expect(matrix.aggregates).toEqual({
      九空: 'INSUFFICIENT_EVIDENCE',
      五虛: 'UNRESOLVED_CONFLICT',
      小耗: 'INSUFFICIENT_EVIDENCE',
      五墓: 'INSUFFICIENT_EVIDENCE',
    })
    const clean = (matrix.cells as Cell[]).filter((c) => c.clean)
    expect(clean.map((c) => [c.witness, c.god, c.heading, c.printed, c.predictGeneric, c.predictNarrow])).toEqual([
      ['06067692-n126', '五虛', '開倉庫出貨財', 'only_ji', 'only_yi', 'both_present'],
    ])
    expect(clean[0]!.jiAxis).toBe('B')
    expect(clean[0]!.otherYi).toEqual(['四相', '月恩', '滿日'])
  })

  it('recomputes the 56 QL lift rows of 2025–2027 per god', () => {
    expect(coverage.qlLiftRowsDistinct).toBe(56)
    expect(Object.fromEntries(GODS.map((g) => [g, coverage.byGod[g].qlRows]))).toEqual({
      九空: 37,
      五虛: 17,
      小耗: 9,
      五墓: 0,
    })
    expect([coverage.godAttributions, coverage.sharedRows]).toEqual([63, 7])
    for (const g of GODS) expect(coverage.byGod[g].cleanCovered).toBe(0)
  })
})
