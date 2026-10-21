import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fullres from '../../docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/fullres-check.json'
import faithful from '../../docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/faithful.json'
import lock from '../../docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/lock.json'
import status from '../../docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/status.json'

// Audit only: freezes the faithful 卷十 劫煞 simulator artifact (docs/audits/p4-jiesha-faithful-vol10.md).
describe('faithful 卷十 劫煞 artifact', () => {
  it('keeps the harness, sweep, summary and full-resolution check byte-identical', () => {
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
  })

  it('records the three-way comparison', () => {
    expect(faithful.supportedRange).toEqual(['1900-01-01', '2100-12-31'])
    expect(faithful.upperBound.effectiveScore).toBe(15158)
    expect(faithful.faithful.effectiveScore).toBe(17242)
    expect(faithful.faithful.verdictRows).toEqual({
      'CONFIRMED:avoid': 17949,
      'CONFIRMED:blank': 21315,
    })
  })

  it('explains every earlier upper-bound row', () => {
    expect(faithful.upperBoundRows.notSupported).toEqual({
      total: 2085,
      faithful: { PUZHU_PAIR: 1687, 'OTHER_YI_EVIDENCE+PUZHU_PAIR': 296, FAITHFUL_AVOID: 102 },
    })
    expect(faithful.upperBoundRows.unknownInModel).toEqual({
      total: 2653,
      faithful: { FAITHFUL_AVOID: 2653 },
    })
  })

  it('finds the faithful verdict constant per (context, activity) and the deciding cells verified', () => {
    expect(faithful.verdictTable.contexts).toBe(16)
    expect(faithful.verdictTable.cells).toBe(384)
    expect(faithful.verdictTable.varyingAcrossDates).toEqual([])
    expect(fullres.summary).toEqual({ cells: 87, matches: 87, uncertain: 0, pages: 14 })
    expect(faithful.witnessWindow.contradictions).toHaveLength(15)
    // No cell depends on the restored-scope label or on cross-god (F1) propagation.
    expect(status.cells).toEqual({ 'CONFIRMED:blank': 210, 'CONFIRMED:avoid': 174 })
    expect(status.xuGuiHai開倉庫.puzhu06).toBe('lift:QL')
  })
})
