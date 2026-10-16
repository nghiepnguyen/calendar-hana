import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import golden from '../almanac-data/golden-p4b-puzhu06-v2.json'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { decideP4Puzhu06, resolveP4Puzhu06Day, type P4Puzhu06Row } from './p4Puzhu06'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiOperands'

// puzhu:06 task 4.2: red tests from the frozen Golden v2 (67af7c0); expected values are read from
// the Golden files only, never from the implementation.
const DIR = 'docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v2/'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
const HEADINGS = ['開倉庫出貨財', '開市', '立券交易', '納財', '安牀']
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')
type Fixture = {
  id: string
  input: P4Puzhu06Row
  expected: { action: string; classes: string[]; ji: boolean; state: string } | { error: string }
}
function table(path: string) {
  const [head, ...lines] = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n')
  const keys = head!.split('\t')
  return new Map(
    lines.map((l) => {
      const r = Object.fromEntries(l.split('\t').map((v, i) => [keys[i]!, v]))
      return [`${r.id}:${r.heading}`, r]
    }),
  )
}
type Day = ReturnType<typeof resolveP4YiDay> & {
  version: string
  puzhu06: Record<string, { action: string; classes: string[] }>
}

function expectDay(
  id: string,
  day: Day,
  p4c: ReturnType<typeof resolveP4YiDay>,
  rows: Map<string, Record<string, string>>,
) {
  expect(day.version, id).toBe('p4b-puzhu06-day-v1')
  for (const [h, final] of Object.entries(day.headings)) {
    if (!HEADINGS.includes(h)) {
      expect(final, `${id} ${h}`).toEqual(p4c.headings[h])
      continue
    }
    const g = rows.get(`${id}:${h}`)!
    const t = day.puzhu06[h]!
    expect([t.action, t.classes.join('+')], `${id} ${h}`).toEqual([g.action, g.classes])
    expect([String(final.ji), final.state], `${id} ${h}`).toEqual([g.after_ji, g.after_state])
    if (g.action !== 'lift') expect(final, `${id} ${h}`).toEqual(p4c.headings[h])
    else expect(final.yi, `${id} ${h} 宜 unchanged`).toBe(p4c.headings[h]!.yi)
  }
  // Every day field outside the headings is P4-C's.
  for (const key of Object.keys(p4c).filter(
    (k) => !['version', 'headings', 'prePropagationHeadings'].includes(k),
  ))
    expect((day as Record<string, unknown>)[key], `${id} ${key}`).toEqual(
      (p4c as Record<string, unknown>)[key],
    )
}

describe('puzhu:06 composer (audit-only, red from Golden v2)', () => {
  it('pins the Golden and the authority it reads', () => {
    expect(sha256(readFileSync(golden.authority.path))).toBe(golden.authority.sha256)
    for (const b of golden.blocks) expect(sha256(readFileSync(b.path)), b.path).toBe(b.sha256)
  })

  it('decides every fixture', () => {
    const { fixtures } = JSON.parse(readFileSync(DIR + 'expected.json', 'utf8')) as {
      fixtures: Fixture[]
    }
    expect(fixtures).toHaveLength(102)
    for (const f of fixtures)
      if ('error' in f.expected)
        expect(() => decideP4Puzhu06(f.input), f.id).toThrow(
          expect.objectContaining({ code: 'SPEC_GAP' }),
        )
      else expect(decideP4Puzhu06(f.input), f.id).toEqual(f.expected)
  })

  it('matches 720 contexts x 5 headings', () => {
    const rows = table(DIR + 'context.tsv')
    for (const m of B)
      for (let i = 0; i < 60; i++) {
        const pillar = S[i % 10]! + B[i % 12]!
        expectDay(
          `${m}-${pillar}`,
          resolveP4Puzhu06Day(m, pillar) as Day,
          resolveP4YiDay(m, pillar),
          rows,
        )
      }
  }, 300_000)

  it('matches 1,095 dates x 5 headings', () => {
    const rows = table(DIR + 'dated.tsv')
    for (const { date } of dates.days) {
      const a = getAlmanac(date as never)
      const month = B[a.selectionContext.MONTH_JIAN_BRANCH!]!
      const pillar = S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!
      const operands = {
        lunarDay: a.selectionContext.LUNAR_DAY!,
        phase: getP4MoonPhase(date),
        soil: getP4SoilPresence(date),
        yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
      }
      expectDay(
        date,
        resolveP4Puzhu06Day(month, pillar, operands) as Day,
        resolveP4YiDay(month, pillar, operands),
        rows,
      )
    }
  }, 300_000)
})
