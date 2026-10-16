import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { resolveP4Grades } from './p4GradeResolution'
import { getP4YouweiScopes, resolveP4Headings } from './p4HeadingAnnotation'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'

// puzhu:06 task 1.0: engine baseline on main (P4-B/P4-C, no puzhu:06 layer). For every
// (date | context) x the five in-scope headings it records the nine trigger gods as the P4-C
// trace sees them, the final heading state and, where 忌 is present, every 忌 source with the
// raw fields the Golden classifies (clause effect, 等第 grade, 德, 又為, remaining-ji, puzhu:27).
// No classification here. Ordinary runs verify bytes; P4B_PUZHU06_WRITE=1 regenerates.
const OUT = 'docs/audits/sources/p4-vol10/p4b-puzhu06-baseline-v1/'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const HEADINGS = ['開倉庫出貨財', '開市', '立券交易', '納財', '安牀']
const OUT_OF_SCOPE = ['進人口', '經絡', '醞釀']
const TRIGGERS = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '月恩', '四相', '時德']
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const add = (tally: Record<string, number>, key: string) => (tally[key] = (tally[key] ?? 0) + 1)
const yi = (v: boolean | undefined) => (v === undefined ? 'unknown' : String(v))
const COLUMNS = [
  'id',
  'month_jian',
  'pillar',
  'heading',
  'triggers',
  'day_rule',
  'yi',
  'ji',
  'protected_ji',
  'state',
  'sources',
]

type YiDay = ReturnType<typeof resolveP4YiDay>
type Heading = { state: string; ji: boolean; protectedJi: boolean; yi: boolean | undefined }

/** Gods the P4-C 宜 traces mark present on this day (union over every heading). */
function triggersOf(day: YiDay) {
  const present = new Set<string>()
  for (const e of Object.values(day.yiEvidence) as unknown as {
    trace?: { han: string; presence: string }[]
  }[])
    for (const t of e.trace ?? []) if (t.presence === 'present') present.add(t.han)
  return TRIGGERS.filter((g) => present.has(g))
}

/** Raw 忌 source records for one heading; every subject scope is kept so parents resolve. */
function sourcesOf(month: string, pillar: string, day: YiDay, h: string) {
  const yiKnown = Object.fromEntries(
    Object.entries(day.yiEvidence as Record<string, { yi?: boolean }>)
      .filter(([, e]) => e.yi !== undefined)
      .map(([k, e]) => [k, e.yi!]),
  )
  const { scopes } = resolveP4Headings(month, pillar, yiKnown)
  const grades = resolveP4Grades(month, pillar).subjects as Record<string, Record<string, unknown>>
  const out: Record<string, unknown>[] = []
  for (const [name, sc] of Object.entries(scopes)) {
    const g = grades[name] ?? {}
    if (!('headings' in sc)) {
      out.push({ kind: 'subject', name, scope: 'undetermined' })
      continue
    }
    out.push({
      kind: 'subject',
      name,
      owner: sc.owner,
      clauseEffect: sc.clauseEffect,
      grade: (g.grade as string) ?? null,
      gradeAction: (g.gradeAction as string) ?? null,
      dePresent: (g.dePresent as boolean) ?? null,
      state: sc.headings[h],
    })
  }
  for (const [name, y] of Object.entries(getP4YouweiScopes(day.subjects)))
    if (y.headings[h] === 'only_ji')
      out.push({ kind: 'youwei', name, parent: y.parent, protected: y.protected })
  for (const [name, s] of Object.entries(day.remaining.scopes))
    if (s.presence === 'present' && ['kept', 'protected', 'undetermined'].includes(s.headings[h]!))
      out.push({ kind: 'remaining', name, effect: s.effect, state: s.headings[h] })
  if (day.puzhuEnd.restoredJiHeadings.includes(h))
    out.push({ kind: 'puzhuEnd', name: 'deathDefeat', subjects: day.puzhuEnd.restoredSubjects })
  return out
}

function rowsOf(id: string, month: string, pillar: string, day: YiDay) {
  const triggers = triggersOf(day)
  return HEADINGS.map((h) => {
    const f = day.headings[h] as Heading
    return [
      id,
      month,
      pillar,
      h,
      triggers.join('+'),
      'dayRule' in day ? String(day.dayRule) : '',
      yi(f.yi),
      String(f.ji),
      String(f.protectedJi),
      f.state,
      f.ji ? JSON.stringify(sourcesOf(month, pillar, day, h)) : '',
    ]
  })
}

describe('puzhu:06 engine baseline (audit-only, task 1.0)', () => {
  it('records 1,095 dates and 720 contexts x 5 headings with raw 忌 sources', () => {
    // 1.5: the three other puzhu:06 headings are outside the 29 P4 headings.
    for (const h of HEADINGS) expect(P4_DAY_HEADINGS).toContain(h)
    for (const h of OUT_OF_SCOPE) expect(P4_DAY_HEADINGS).not.toContain(h)
    const dated = [COLUMNS.join('\t')]
    const summary = {
      scope: 'MEASURED_AUDIT_ONLY_NOT_GOLDEN',
      engine: 'resolveP4YiDay (P4-C, main), no puzhu:06 layer',
      headings: HEADINGS,
      outOfHeadingScope: OUT_OF_SCOPE,
      dated: {
        dates: 0,
        triggerDays: 0,
        candidates: {} as Record<string, number>,
        protectedOnTriggerDay: {} as Record<string, number>,
        dayRuleOnTriggerDay: 0,
        // 1.4: puzhu:22 fires only on 相抵 (neither_recorded) 開市 + 立券交易; a lift never makes it.
        neitherRecordedCandidates: 0,
      },
      context: { contexts: 0, candidates: {} as Record<string, number> },
    }
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const day = resolveP4YiDay(month, pillar, {
        lunarDay: a.selectionContext.LUNAR_DAY!,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      })
      const rows = rowsOf(date, month, pillar, day)
      const d = summary.dated
      d.dates++
      if (rows[0]![4]) d.triggerDays++
      if (rows[0]![4] && rows[0]![5]) d.dayRuleOnTriggerDay++
      for (const r of rows) {
        dated.push(r.join('\t'))
        if (!r[4]) continue
        if (r[7] === 'true' && r[8] === 'false') add(d.candidates, r[3]!)
        if (r[8] === 'true') add(d.protectedOnTriggerDay, r[3]!)
        if (r[7] === 'true' && r[8] === 'false' && r[9] === 'neither_recorded')
          d.neitherRecordedCandidates++
      }
    }
    const context = [COLUMNS.join('\t')]
    for (const m of B)
      for (let i = 0; i < 60; i++) {
        const pillar = S[i % 10]! + B[i % 12]!
        for (const r of rowsOf(`${m}-${pillar}`, m, pillar, resolveP4YiDay(m, pillar))) {
          context.push(r.join('\t'))
          if (r[4] && r[7] === 'true' && r[8] === 'false') add(summary.context.candidates, r[3]!)
        }
        summary.context.contexts++
      }
    expect(summary.dated.dates).toBe(1095)
    expect(summary.context.contexts).toBe(720)
    // PRD §2 / P5 F1.
    expect(summary.dated.candidates).toEqual({
      開倉庫出貨財: 133,
      開市: 153,
      立券交易: 159,
      納財: 139,
      安牀: 140,
    })
    expect(summary.dated.neitherRecordedCandidates).toBe(0)
    const outputs: [string, string][] = [
      [OUT + 'baseline.tsv', dated.join('\n') + '\n'],
      [OUT + 'context.tsv', context.join('\n') + '\n'],
      [OUT + 'summary.json', JSON.stringify(summary, null, 2) + '\n'],
    ]
    for (const [path, content] of outputs)
      if (process.env.P4B_PUZHU06_WRITE) writeFileSync(path, content)
      else {
        expect(existsSync(path), `${path}: run with P4B_PUZHU06_WRITE=1`).toBe(true)
        const committed = readFileSync(path, 'utf8')
        if (sha256(committed) !== sha256(content)) {
          const was = committed.split('\n')
          const at = content.split('\n').findIndex((line, i) => line !== was[i])
          expect(content.split('\n')[at], `${path} line ${at + 1}`).toBe(was[at])
        }
      }
  }, 300_000)
})
