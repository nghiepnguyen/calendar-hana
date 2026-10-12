import { describe, expect, it } from 'vitest'
import art from '../almanac-data/p4-vol10-remaining-ji-v7.json'
import golden from '../almanac-data/golden-p4-remaining-ji-v8.json'
import { resolveP4Day } from './p4DayComposition'
import { resolveP4FullDay } from './p4FullDayComposition'

const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'

describe('P4-B composed day, audit only', () => {
  it('adds protected 四窮 without spreading marriage taboo to 安牀', () => {
    const r = resolveP4FullDay('卯', '乙亥')
    expect(r.headings['嫁娶']).toMatchObject({ ji: true, protectedJi: true })
    expect(r.remaining.scopes['四窮']!.headings['安牀']).toBe('not_listed')
  })
  it('does not substitute 不將 for immunity from 八專 or 百忌', () => {
    const r = resolveP4FullDay('寅', '甲寅')
    expect(r.headings['嫁娶']!.ji).toBe(true)
    expect(r.headings['嫁娶']!.protectedJi).toBe(true)
  })
  it('keeps missing source operands visible and blocks favourable inference', () => {
    // 寅丁卯: 除日 and 天德丁 prove 宜 medical, but lunar date/phase is missing.
    const r = resolveP4FullDay('寅', '丁卯')
    expect(r.unresolvedJi['求醫療病']).toContain('朔望日')
    expect(r.headings['求醫療病']!.state).toBe('undetermined')
  })
  it.each(golden.dayCases)('$month月$pillar puzhu:28 $rule: $note', (c) => {
    const r = resolveP4FullDay(c.month, c.pillar)
    expect(r.dayRule ?? null).toBe(c.rule)
    if (c.rule)
      for (const [h, d] of Object.entries(r.headings)) {
        expect(d, h).toMatchObject({ ji: false, protectedJi: false })
        expect(r.unresolvedJi[h], h).toEqual([])
      }
    for (const [h, ji] of Object.entries(c.ji ?? {})) expect(r.headings[h]!.ji, h).toBe(ji)
  })
  it('applies puzhu:28 only to its listed days and keeps their 宜 evidence', () => {
    const listed = new Set(art.dayRules.flatMap((r) => r.applied.map(([m, p]) => m! + p!)))
    expect(listed.size).toBe(8)
    for (const month of B)
      for (let i = 0; i < 60; i++) {
        const pillar = S[i % 10]! + B[i % 12]!
        const r = resolveP4FullDay(month, pillar)
        expect(r.dayRule !== undefined, `${month}${pillar}`).toBe(listed.has(month + pillar))
        if (!r.dayRule) continue
        const base = resolveP4Day(month, pillar).prePropagationHeadings
        expect(
          Object.values(base).some((d) => d.ji),
          `${month}${pillar} had 忌`,
        ).toBe(true)
        for (const [h, d] of Object.entries(r.prePropagationHeadings))
          expect(d.yi, h).toBe(base[h]!.yi)
      }
  }, 60_000)
  it('never lets the puzhu:28 list meet a whole-day taboo', () => {
    for (const { applied } of art.dayRules)
      for (const [m, p] of applied) {
        const r = resolveP4FullDay(m!, p!)
        expect(r.pillarAllTaboo, `${m}${p}`).toEqual([])
        expect(
          Object.values(r.remaining.scopes).some(
            (s) => s.presence === 'present' && s.effect === 'all_taboo',
          ),
        ).toBe(false)
      }
  })
  it('keeps full taboo on 四廢 with 月破', () => {
    const r = resolveP4FullDay('寅', '庚申')
    for (const d of Object.values(r.headings))
      expect(d).toMatchObject({ state: 'only_ji', ji: true, protectedJi: true })
  })
})

import { writeFileSync } from 'node:fs'
import baseline from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'

it('audits propagation on all 1095 real dates with explicit unresolved evidence', () => {
  const rows = [
    'date\tlunar_day\tmonth_jian\tpillar\theading\tbefore\tafter\tji\tprotected\tunresolved\tpropagated_from\tblocked_by',
  ]
  const counts = { dates: 0, headings: 0, lifted: 0, blocked: 0, unresolved: 0 }
  const dormant: Record<string, number> = {}
  const conflicts: string[] = []
  for (const { date } of baseline.days) {
    const a = getAlmanac(date as never)
    const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
    const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
    const lunarDay = a.selectionContext.LUNAR_DAY!
    const r = resolveP4FullDay(month, pillar, { lunarDay })
    counts.dates++
    for (const [id, present] of Object.entries(r.remaining.dormantPresence))
      dormant[id] = (dormant[id] ?? 0) + Number(present)
    if (r.remaining.scopes['遊禍']?.reason) conflicts.push(date)
    for (const [h, d] of Object.entries(r.headings)) {
      counts.headings++
      counts.lifted += Number('propagatedFrom' in d)
      counts.blocked += Number('propagationBlocked' in d)
      counts.unresolved += Number(r.unresolvedJi[h]!.length > 0)
      if (d.protectedJi) expect(d.ji, `${date} ${h}`).toBe(true)
      if ('propagatedFrom' in d) {
        expect(r.prePropagationHeadings[h]!.protectedJi).toBe(false)
        expect(d.ji).toBe(false)
      }
      if (r.unresolvedJi[h]!.length && d.state !== 'only_ji') expect(d.state).toBe('undetermined')
      rows.push(
        [
          date,
          lunarDay,
          month,
          pillar,
          h,
          r.prePropagationHeadings[h]!.state,
          d.state,
          d.ji,
          d.protectedJi,
          r.unresolvedJi[h]!.join('+'),
          'propagatedFrom' in d ? d.propagatedFrom : '',
          'propagationBlocked' in d ? d.propagationBlocked : '',
        ].join('\t'),
      )
    }
  }
  expect(counts.dates).toBe(1095)
  expect(counts.headings).toBe(1095 * 29)
  expect(counts.unresolved).toBe(6516)
  expect(Object.keys(dormant)).toHaveLength(21)
  for (const n of Object.values(dormant)) expect(n).toBeGreaterThan(0)
  if (process.env.P4_B_REPORT) {
    writeFileSync('docs/audits/p4-vol10-remaining-ji-2025-2027.tsv', rows.join('\n') + '\n')
    writeFileSync(
      'docs/audits/p4-vol10-remaining-ji-summary.json',
      JSON.stringify({ scope: 'AUDIT_ONLY_PARTIAL', counts, dormant, conflicts }, null, 2) + '\n',
    )
  }
}, 120_000)
