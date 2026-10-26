import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import { resolveP4Headings } from './p4HeadingAnnotation'
import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4OwnerRulesDay } from './p4OwnerRules'
import { getP4SoilPresence } from './p4SoilConvention'
import { resolveP4YiDay } from './p4YiDayComposition'
import { getP4MuCangSoil } from './p4YiSoil'

// Audit only: P21 Stage 3 (docs/audits/p21-stage3-authority-freeze.md). Recomputes, date by date over
// 2025–2027, every puzhu:21 cell where N-C (H2) differs from production, straight from the production layer
// (not from the Stage 1 freeze), with the trigger provenance Stage 3 classifies. Read-only.
// npm test: the 8 frozen dates plus a non-firing control. P21S3_FULL=1: the full 1,095-day sweep.
// P21S3_DUMP=1 rewrites affected-cells.json.
const OUT = 'docs/audits/sources/p4-vol10/p21-stage3/affected-cells.json'
const TRIAD = ['開市', '立券交易', '納財']
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const ALL_TRUE = Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, true]))

const ALL_DATES = Array.from(
  { length: (Date.parse('2027-12-31') - Date.parse('2025-01-01')) / 864e5 + 1 },
  (_, i) => new Date(Date.parse('2025-01-01') + i * 864e5).toISOString().slice(0, 10),
)

function scan(dates: readonly string[] = ALL_DATES) {
  const rows: { date: string }[] = []
  for (const date of dates) {
    const a = getAlmanac(date as never)
    const month = BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!
    const pillar = STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!
    const op = {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: getP4MoonPhase(date),
      soil: getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
    }
    const day = resolveP4OwnerRulesDay(month, pillar, op)
    const triggers = TRIAD.filter((h) => day[h]?.state === 'neither_recorded')
    if (!triggers.length) continue
    const { scopes } = resolveP4Headings(month, pillar, ALL_TRUE)
    const xd = (h: string) =>
      Object.entries(scopes)
        .filter(([, s]) => 'headings' in s && s.headings[h] === 'neither_recorded')
        .map(([n]) => n)
        .sort()
    const yiDay = resolveP4YiDay(month, pillar, op)
    for (const h of TRIAD) {
      const d = day[h]!
      if (!d.propagatedFrom && !d.propagationBlocked) continue
      const from = triggers.filter((f) => f !== h)
      const cancelled = [...new Set(from.flatMap(xd))]
      const independent = (d.trace?.ji ?? []).filter((g) => !cancelled.includes(g))
      if (!independent.length || d.propagationBlocked) continue
      rows.push({
        date,
        context: `${month}-${pillar}`,
        triggers: from.map((f) => ({
          heading: f,
          yi: day[f]!.yi ?? null,
          yiSources: ((yiDay.yiEvidence[f]?.trace ?? []) as { han: string; presence: string }[])
            .filter((x) => x.presence === 'present')
            .map((x) => x.han),
          xiangdi: xd(f),
        })),
        target: h,
        targetYi: d.yi ?? null,
        targetJi: d.trace?.ji ?? [],
        targetProt: d.trace?.prot ?? [],
        independent,
        preRule: d.rule ?? null,
        puzhu06: d.puzhu06 ?? null,
        current: d.state,
        h2: d.yiNoted ? 'both_present' : 'only_ji',
      })
    }
  }
  return rows
}

describe('P21 Stage 3 affected matrix (audit only)', () => {
  it.runIf(process.env.P21S3_DUMP === '1')('dumps the matrix', { timeout: 600_000 }, () => {
    writeFileSync(
      OUT,
      JSON.stringify(
        { harness: 'shared/lunar/p4P21Stage3Affected.test.ts', cells: scan() },
        null,
        2,
      ) + '\n',
    )
  })

  const frozen = () => JSON.parse(readFileSync(OUT, 'utf8')).cells as { date: string }[]

  it('production still yields the frozen rows on their dates; a control date fires nothing', () => {
    const f = frozen()
    expect(scan(f.map((c) => c.date))).toEqual(f)
    expect(scan(['2025-01-01'])).toEqual([])
  })

  it.runIf(process.env.P21S3_FULL === '1')(
    'full sweep matches the freeze',
    { timeout: 600_000 },
    () => {
      expect(scan()).toEqual(frozen())
    },
  )
})
