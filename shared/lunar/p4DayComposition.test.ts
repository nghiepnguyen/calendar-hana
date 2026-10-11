import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import golden from '../almanac-data/golden-p4-day-composition.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import lockV1 from '../../docs/audits/sources/p4-vol10/day-composition-lock.json'
import lock from '../../docs/audits/sources/p4-vol10/day-composition-lock-v2.json'
import {
  applyP4Propagation,
  P4_PROPAGATION_OUT_OF_SCOPE,
  P4_DAY_HEADINGS,
  resolveP4Day,
  splitP4YiGods,
} from './p4DayComposition'
import { canonP4Heading, P4_HEADINGS } from './p4HeadingAnnotation'
import { splitHeadings } from './xiejiVol10Resolution'

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const source = Array.from(readFileSync('docs/audits/sources/p4-vol10/vol10.raw.txt', 'utf8'))
const norm = (h: string) => canonP4Heading(splitHeadings(h)[0]!)
const quoted = (r: { offset: number; text: string }) =>
  source.slice(r.offset, r.offset + Array.from(r.text).length).join('')

describe('P4 day composition (A04b), audit only', () => {
  it('keeps the frozen oracle and source quotations intact', () => {
    for (const f of [...lockV1.files, ...lock.files])
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex')).toBe(f.sha256)
    const refs = [
      art.baiji.source,
      ...art.yiSuppression.map((l) => l.source),
      ...art.propagation.lines.map((l) => l.source),
    ]
    for (const r of refs) expect(quoted(r)).toBe(r.text)
    expect(art.scoringReady).toBe(false)
  })

  it('tokenizes every 卷十一 宜 list except the deferred P5 heading', () => {
    for (const [h, e] of Object.entries(vol11.entries as Record<string, { 宜: string }>))
      if (!(h in art.yiEvidence.deferred)) expect(splitP4YiGods(e.宜).join('')).toBe(e.宜)
  })

  it('maps every 百忌 heading and propagation heading onto a real heading', () => {
    const known = new Set(P4_HEADINGS)
    for (const r of art.baiji.rules)
      if (r.heading) expect(known.has(norm(r.heading)), r.heading).toBe(true)
    for (const l of art.propagation.lines as {
      from?: string[]
      to?: string[]
      pairs?: string[][]
    }[])
      for (const h of [...(l.from ?? []), ...(l.to ?? []), ...(l.pairs ?? []).flat()])
        expect(known.has(norm(h)), `${h}`).toBe(true)
    expect(P4_DAY_HEADINGS).toContain('立券交易')
    expect(P4_HEADINGS).not.toContain('立劵交易')
  })

  // Expected values hand-derived in golden-p4-day-composition.json before the composer existed.
  it.each(golden.cases)('$monthJian月$pillar: $note', (c) => {
    const r = resolveP4Day(c.monthJian, c.pillar)
    for (const [h, state] of Object.entries(c.headings)) expect(r.headings[h]?.state, h).toBe(state)
  })

  // Hand-derived: 午月庚寅 has no 卷十 subject; 掃舍宇 宜 = 除日 (absent: 除 is 未) + 除神 (no
  // audited operand), so nothing can decide it.
  it('leaves a heading undetermined when only an unaudited god could supply 宜', () => {
    expect(resolveP4Day('午', '庚寅').headings['掃舍宇']).toMatchObject({
      state: 'undetermined',
      yi: undefined,
    })
  })

  it('composes all 720 contexts; protected 忌 never disappears', () => {
    const counts: Record<string, number> = {}
    for (const month of BRANCHES)
      for (let i = 0; i < 60; i++) {
        const pillar = STEMS[i % 10]! + BRANCHES[i % 12]!
        const r = resolveP4Day(month, pillar)
        for (const [h, d] of Object.entries(r.headings)) {
          counts[d.state] = (counts[d.state] ?? 0) + 1
          if (d.protectedJi)
            expect(['only_ji', 'both_present', 'undetermined'], h).toContain(d.state)
          if (r.pillarAllTaboo.length) expect(d.state).toBe('only_ji')
        }
      }
    for (const s of ['only_ji', 'neither_recorded', 'not_recorded', 'undetermined', 'only_yi'])
      expect(counts[s], s).toBeGreaterThan(0)
  })

  // Owner decision B (p4-vol10-youwei-scopes.json): 乘船渡水 comes from 大時's 又為咸池 scope, which
  // no deferral or lift removes. Under B no activity heading remains deferral-uncovered, so the
  // review fix (no lifted inference for uncovered headings) has no live case; logic kept.
  it('keeps 咸池 忌 on 乘船渡水 through 大時 → 月刑', () => {
    expect(resolveP4Day('卯', '甲子').headings['乘船渡水']!.state).toBe('only_ji')
  })

  it('reports propagation headings outside the day scope instead of skipping them silently', () => {
    const known = new Set(P4_HEADINGS)
    expect(P4_PROPAGATION_OUT_OF_SCOPE.length).toBeGreaterThan(0)
    for (const h of P4_PROPAGATION_OUT_OF_SCOPE) {
      expect(known.has(h), h).toBe(true)
      expect(P4_DAY_HEADINGS).not.toContain(h)
    }
    expect(resolveP4Day('寅', '丁未').propagationOutOfScope).toEqual(P4_PROPAGATION_OUT_OF_SCOPE)
  })

  it('validates input before any lookup', () => {
    expect(() => resolveP4Day('X', '甲子')).toThrow(RangeError)
    expect(() => resolveP4Day('子', '甲丑')).toThrow(RangeError)
  })

  it('propagates a 相抵 lift only to unprotected 忌, once', () => {
    const d = (
      state: string,
      ji: boolean,
      protectedJi = false,
      yi: boolean | 'unknown' = false,
    ) => ({
      state: state as never,
      ji,
      protectedJi,
      yi: yi === 'unknown' ? undefined : yi,
    })
    const out = applyP4Propagation({
      嫁娶: d('neither_recorded', false),
      安牀: d('only_ji', true),
      般移: d('only_ji', true, true),
      冠帶: d('only_ji', true, false, 'unknown'),
      結婚姻: d('only_ji', true, false, true),
    })
    expect(out['安牀']).toMatchObject({ state: 'not_recorded', propagatedFrom: '嫁娶' })
    expect(out['般移']).toMatchObject({ state: 'only_ji', propagationBlocked: '嫁娶' })
    expect(out['冠帶']!.state).toBe('undetermined')
    expect(out['結婚姻']!.state).toBe('only_yi')
    // A to-heading undetermined for other reasons is not made determinate by propagation.
    const pending = applyP4Propagation({
      嫁娶: d('neither_recorded', false),
      安牀: d('undetermined', true, false, true),
    })
    expect(pending['安牀']!.state).toBe('undetermined')
    // A lifted to-heading does not chain into its own lines (安牀 → 般移 needs 安牀 相抵).
    expect(out['般移']!.state).toBe('only_ji')
    // requireAll: 開倉 needs both 開市 and 立券交易 at 相抵.
    const half = applyP4Propagation({
      開市: d('neither_recorded', false),
      立券交易: d('only_ji', true),
      開倉庫出貨財: d('only_ji', true),
    })
    expect(half['開倉庫出貨財']!.state).toBe('only_ji')
  })
})
