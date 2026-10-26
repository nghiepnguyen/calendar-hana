import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getAlmanac } from './almanac'
import { P4_DAY_HEADINGS } from './p4DayComposition'
import art from '../almanac-data/p4-vol10-day-composition-v2.json'
import { resolveP4Headings } from './p4HeadingAnnotation'
import { getP4MoonPhase } from './p4LunarPhase'
import { resolveP4OwnerRulesContext, resolveP4OwnerRulesDay, type P4OwnerDay } from './p4OwnerRules'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiSoil'
import { canonP4Heading, splitHeadings } from './xiejiVol10Resolution'

// Audit only: P21 Stage 1 (docs/audits/p21-authority-reconstruction.md). Projects the two readings of the
// 鋪註 propagation lines (puzhu:21 「凡吉凶相抵不註忌開市亦不註忌立劵交易納財…」 and, as analogues, puzhu:11,
// 16–24) over the production P4 resolution layer, read-only:
//   H1 heading-wide        every unprotected 忌 on the target heading is withheld (= engine, N-A)
//   H2 contribution-scoped only the 忌 of the gods whose 相抵 left the trigger unnoted is withheld (N-C)
// The H2 row is a projection, never fed back. npm test: the frozen divergent contexts plus a control.
// P21_FULL=1: all 720 contexts against the freeze. P21_DUMP=1: rewrites projection.json.
const OUT = 'docs/audits/sources/p4-vol10/p21-stage1/projection.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const MONTHS = [...BRANCHES]
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10]! + BRANCHES[i % 12]!)
const ALL_TRUE = Object.fromEntries(P4_DAY_HEADINGS.map((h) => [h, true]))
const norm = (h: string) => canonP4Heading(splitHeadings(h)[0]!)
type Line = { id: string; from?: string[]; to?: string[]; pairs?: string[][]; requireAll?: boolean }
const EDGES = (art.propagation.lines as Line[]).flatMap((l) =>
  l.pairs
    ? l.pairs.map(([f, t]) => ({ line: l.id, from: [norm(f!)], to: norm(t!), all: false }))
    : (l.to ?? []).map((t) => ({
        line: l.id,
        from: (l.from ?? []).map(norm),
        to: norm(t),
        all: l.requireAll === true,
      })),
)

type Cell = {
  line: string
  context: string
  heading: string
  triggers: string[]
  triggerXiangdi: Record<string, string[]>
  targetJi: string[]
  cancelled: string[]
  independent: string[]
  h1: string
  h2: string
  blocked?: string
  preRule?: string
  puzhu06?: string
  targetXiangdi: string[]
}

/** Every propagation edge that fired on a resolved day and reached a target 忌 (lifted or protected-blocked).
 * The engine's propagatedFrom keeps only the last firing edge, so edges are re-derived from the lines. */
function cells(month: string, pillar: string, day: P4OwnerDay): Cell[] {
  const context = `${month}-${pillar}`
  const { scopes } = resolveP4Headings(month, pillar, ALL_TRUE)
  // The gods whose 相抵 leaves a heading unnoted (卷十 subject scopes on that heading).
  const xiangdiGods = (f: string) =>
    Object.entries(scopes)
      .filter(([, s]) => 'headings' in s && s.headings[f] === 'neither_recorded')
      .map(([name]) => name)
      .sort()
  const byKey = new Map<string, { line: string; heading: string; triggers: Set<string> }>()
  for (const e of EDGES) {
    const d = day[e.to]
    if (!d || !(d.propagatedFrom || d.propagationBlocked)) continue
    const fired = e.from.filter((f) => day[f]?.state === 'neither_recorded')
    if (e.all ? fired.length !== e.from.length : !fired.length) continue
    const k = `${e.line}|${e.to}`
    const c = byKey.get(k) ?? { line: e.line, heading: e.to, triggers: new Set<string>() }
    for (const f of fired) c.triggers.add(f)
    byKey.set(k, c)
  }
  return [...byKey.values()].map(({ line, heading: h, triggers: t }) => {
    const d = day[h]!
    const triggers = [...t].sort()
    const triggerXiangdi = Object.fromEntries(triggers.map((f) => [f, xiangdiGods(f)]))
    const targetJi = d.trace?.ji ?? []
    const cancelled = [...new Set(Object.values(triggerXiangdi).flat())].sort()
    const independent = targetJi.filter((g) => !cancelled.includes(g))
    const h1 = d.state
    // H2 keeps the heading noted when an independent 忌 survives; the 宜 noting follows the engine's
    // ji branch (both_present / only_ji). A blocked edge is protected under both readings.
    const h2 = d.propagationBlocked
      ? h1
      : independent.length
        ? d.yiNoted
          ? 'both_present'
          : 'only_ji'
        : h1
    return {
      line,
      context,
      heading: h,
      triggers,
      triggerXiangdi,
      targetJi,
      cancelled,
      independent,
      h1,
      h2,
      ...(d.propagationBlocked ? { blocked: d.propagationBlocked } : {}),
      ...(d.rule ? { preRule: d.rule } : {}),
      ...(d.puzhu06 ? { puzhu06: d.puzhu06 } : {}),
      targetXiangdi: xiangdiGods(h),
    }
  })
}

function contextLevel() {
  return MONTHS.flatMap((m) =>
    PILLARS.flatMap((p) => cells(m, p, resolveP4OwnerRulesContext(m, p))),
  )
}

function dated() {
  const rows: (Cell & { date: string })[] = []
  for (let t = Date.parse('2025-01-01'); t <= Date.parse('2027-12-31'); t += 864e5) {
    const date = new Date(t).toISOString().slice(0, 10)
    const a = getAlmanac(date as never)
    const month = BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!
    const pillar = STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!
    const day = resolveP4OwnerRulesDay(month, pillar, {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: getP4MoonPhase(date),
      soil: getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
    })
    for (const c of cells(month, pillar, day)) rows.push({ date, ...c })
  }
  return rows
}

function summary(rows: Cell[]) {
  const div = rows.filter((r) => r.h1 !== r.h2)
  return {
    cells: rows.length,
    sameOutput: rows.length - div.length,
    divergent: div.length,
    independentContribution: rows.filter((r) => r.independent.length).length,
    blocked: rows.filter((r) => r.blocked).length,
    contexts: [...new Set(rows.map((r) => r.context))].sort(),
    divergentContexts: [...new Set(div.map((r) => r.context))].sort(),
    headings: [...new Set(rows.map((r) => r.heading))].sort(),
  }
}
const byLine = (rows: Cell[]) =>
  Object.fromEntries(
    [...new Set(rows.map((r) => r.line))]
      .sort()
      .map((l) => [l, summary(rows.filter((r) => r.line === l))]),
  )

describe('P21 Stage 1 projection (audit only)', () => {
  it.runIf(process.env.P21_DUMP === '1')('dumps the H1/H2 projection', { timeout: 600_000 }, () => {
    const ctx = contextLevel()
    const days = dated()
    writeFileSync(
      OUT,
      JSON.stringify(
        {
          harness: 'shared/lunar/p4P21Stage1Projection.test.ts',
          contextLevel: { byLine: byLine(ctx), cells: ctx },
          dated2025_2027: { byLine: byLine(days), cells: days },
        },
        null,
        2,
      ) + '\n',
    )
  })

  const frozen = () => JSON.parse(readFileSync(OUT, 'utf8')) as { contextLevel: { cells: Cell[] } }

  it('puzhu:21: the frozen divergent contexts and a non-firing control match the production layer', () => {
    const p21 = frozen().contextLevel.cells.filter((c) => c.line === 'puzhu:21')
    expect([...new Set(p21.map((c) => c.context))].sort()).toEqual([
      '亥-丁酉',
      '亥-癸酉',
      '未-丙申',
      '未-壬申',
      '未-庚申',
      '未-戊申',
    ])
    for (const c of p21) {
      const [m, p] = c.context.split('-') as [string, string]
      const live = cells(m, p, resolveP4OwnerRulesContext(m, p)).filter(
        (x) => x.line === 'puzhu:21',
      )
      expect(live).toEqual(p21.filter((x) => x.context === c.context))
      expect([c.heading, c.independent, c.h1, c.h2]).toEqual([
        '立券交易',
        ['五離'],
        'neither_recorded',
        'only_ji',
      ])
    }
    // Control: 申-甲申 (no 相抵 on the triad) fires no puzhu:21 edge.
    expect(
      cells('申', '甲申', resolveP4OwnerRulesContext('申', '甲申')).filter(
        (x) => x.line === 'puzhu:21',
      ),
    ).toEqual([])
  })

  it.runIf(process.env.P21_FULL === '1')(
    'all 720 contexts match the freeze',
    { timeout: 600_000 },
    () => {
      expect(contextLevel()).toEqual(frozen().contextLevel.cells)
    },
  )
})
