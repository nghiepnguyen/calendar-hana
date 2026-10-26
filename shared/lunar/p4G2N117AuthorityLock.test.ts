import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import evidence from '../../docs/audits/sources/p4-vol10/g2-n117-stage1/evidence.json'
import lock from '../../docs/audits/sources/p4-vol10/g2-n117-stage1/lock.json'
import authority from '../almanac-data/xieji-vol10-jiesha-authority-v4.json'
import { getAlmanac } from './almanac'
import { getVol10JieshaRuntime, VOL10_JIESHA_AUTHORITY_ID } from './xiejiVol10JieshaAuthority'
import { resolveVol10 } from './xiejiVol10Resolution'

// Audit only: G2-n117 Stage 1 (docs/audits/p4-g2-n117-authority-discrepancy.md). Freezes the open
// 未-戊申 × 立券交易 discrepancy as UNRESOLVED_CONFLICT; it does not pick 宜 or 忌.
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const G2 = ['contract', 'transaction']

describe('G2-n117 Stage 1 authority discrepancy lock', () => {
  it('pins the evidence, the witness pages and the raw sources', () => {
    for (const [path, hash] of Object.entries(lock.files)) expect(sha(path), path).toBe(hash)
  })

  it('records the conflict as unresolved and the cell as not witnessed', () => {
    expect(evidence.ruling).toBe('UNRESOLVED_CONFLICT')
    expect(evidence.witnessConflict).toBe(true)
    expect(evidence.sourceWitnessed).toBe(false)
    expect(evidence.productionState).toBe('BLANK / I1')
    const n117 = evidence.pages.find((p) => p.page === '06067694-n117')!
    expect(n117.onJiLine).toEqual({ 開市: false, 立券交易: true, 納財: true, 開倉庫出貨財: true })
    // 納財 → 立券交易 is the puzhu:21 source rule, not an alias.
    expect(evidence.canonical.aliasesTouching納財).toEqual([])
    expect(evidence.canonical.activityMap.contract).toEqual(['立券交易'])
    expect(evidence.canonical.activityMap.finance).toEqual(['納財'])
  })

  it('the live 劫煞 cell stays BLANK (I1) and is never marked SOURCE_WITNESSED', () => {
    expect(VOL10_JIESHA_AUTHORITY_ID).toBe(authority.version)
    for (const a of G2) {
      expect(getVol10JieshaRuntime('未', '戊申', a)).toEqual({ status: 'APPLIED', cell: 'blank' })
      expect(getVol10JieshaRuntime('未', '壬申', a)).toEqual({ status: 'APPLIED', cell: 'avoid' })
    }
    const prov = JSON.stringify(authority.provenance)
    expect(prov).toMatch(/NOT SOURCE_WITNESSED/)
    expect(prov.replaceAll('NOT SOURCE_WITNESSED', '')).not.toMatch(/SOURCE_WITNESSED/)
    const day = {
      monthJianBranch: 7,
      dayStem: 4,
      dayBranch: 8,
      officerId: 'tru',
      presentGods: new Set(['kiep_sat']),
      unknownGods: new Set<string>(),
    }
    const jie = resolveVol10(day as never, G2).filter((r) => r.entry === 'jie_sha')
    expect(jie.map((r) => r.verdict)).toEqual(['no_annotation', 'no_annotation'])
  })

  it('no runtime path turns 劫煞 into avoid on real 未-戊申 days', () => {
    // Only the 劫煞 verdict is pinned; the 五離 no_annotation inside 2025–2027 is current behaviour (F1 debt).
    for (const date of ['2026-08-02', '2027-07-28', '2028-07-22']) {
      const a = getAlmanac(date as never)
      for (const r of a.activityRecommendations.filter((r) => G2.includes(r.activityId))) {
        const kiep = r.contributions.filter((c) => c.ruleId === 'kiep_sat')
        expect(kiep.map((c) => c.classical?.verdict), `${date} ${r.activityId}`).toEqual([
          'no_annotation',
        ])
      }
    }
  })
})
