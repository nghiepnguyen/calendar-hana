import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import remainingArt from '../almanac-data/p4-vol10-remaining-ji-v7.json'

// Q4-REST Stage 2A.1 (docs/audits/p4-q4-rest-stage2a1-y-axis-impact.md), audit only. One module graph per model:
//   production  shipped runtime (p4OwnerRules → getP4DayHeadings → score adapter), untouched
//   ynarrow*    DIAGNOSTIC ONLY: resolveP4OwnerRulesDay wrapped so a both_present row whose surviving 忌
//               includes an ungraded remaining-ji god (卷十 remaining entry) reads only_ji, over a scope:
//               all | evidence (god × family of a source pattern) | f1y (五離 sole ungraded) | u7 (protected).
//               Not approved behaviour, never a production expectation.
// Q4R2A1_DUMP=1 writes q4-rest-stage2a1/runtime.json (population, page contexts, impact); npm test
// re-derives the page contexts and a sample of dated rows against it.
type Scope = 'all' | 'evidence' | 'f1y' | 'u7'
type Model = 'production' | Scope
const OWNER = './p4OwnerRules'
// Production imports authority v5 since Q4-REST Stage 3; this proof stays pinned to v4 (q4RestRollback.ts).
const PUZHU06 = '../almanac-data/p4b-puzhu06-v5.json'
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage2a1/'
const OUT = DIR + 'runtime.json'
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const REMAINING = new Set((remainingArt.entries as { han: string }[]).map((e) => e.han))
type Row = {
  state: string
  yiNoted?: boolean
  protectedJi?: boolean
  puzhu06?: string
  propagatedFrom?: string
  propagationBlocked?: string
  rule?: string
  trace?: { primary: string; ji: string[]; prot: string[] }
}
const ungraded = (r: Row) => (r.trace?.ji ?? []).filter((id) => REMAINING.has(id))
const OFFICER = new Set([
  '建日',
  '除日',
  '滿日',
  '平日',
  '定日',
  '執日',
  '破日',
  '危日',
  '成日',
  '收日',
  '開日',
  '閉日',
])
// Source patterns (source-pattern.json): god × family with a direct only_ji witness.
const PATTERNS = new Set(['九空:U2', '五虛:U2', '五墓:U3', '五離:U3'])
/** Family as in build_evidence.py; U2/U3 need the row's 宜 gods. */
function family(r: Row, yiGods: string[]) {
  if (r.protectedJi) return 'U7'
  if ((r.trace?.ji ?? []).length > 1) return 'U4'
  if (r.puzhu06?.startsWith('keep')) return 'U5'
  const off = yiGods.filter((g) => OFFICER.has(g)).length
  return off && off === yiGods.length ? 'U2' : off ? 'U1' : 'U3'
}
const inScope = (scope: Scope, r: Row, yiGods: string[]) => {
  const u = ungraded(r)
  if (r.state !== 'both_present' || !u.length) return false
  if (scope === 'all') return true
  if (scope === 'u7') return Boolean(r.protectedJi)
  if (scope === 'f1y') return u.length === 1 && u[0] === '五離'
  return u.some((g) => PATTERNS.has(`${g}:${family(r, yiGods)}`))
}

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(OWNER)
  vi.doMock(PUZHU06, async () => (await import('./q4RestRollback')).puzhu06V4())
  if (model !== 'production')
    vi.doMock(OWNER, async (orig) => {
      const real = (await orig()) as typeof import('./p4OwnerRules')
      const { resolveP4YiDay } = await import('./p4YiDayComposition')
      return {
        ...real,
        resolveP4OwnerRulesDay: (...a: Parameters<typeof real.resolveP4OwnerRulesDay>) => {
          const ev = resolveP4YiDay(...a).yiEvidence as unknown as Record<
            string,
            { trace?: { han: string; presence: string }[] }
          >
          return Object.fromEntries(
            Object.entries(real.resolveP4OwnerRulesDay(...a)).map(([h, r]) => {
              const yi = (ev[h]?.trace ?? [])
                .filter((t) => t.presence === 'present')
                .map((t) => t.han)
              return [h, inScope(model, r, yi) ? { ...r, state: 'only_ji', yiNoted: false } : r]
            }),
          )
        },
      }
    })
  ;(await import('../astronomy/solarTerms/cache')).solarTermCacheStore('almanac').clear()
  await import('./p4AlmanacHeadings')
  const { getAlmanac } = await import('./almanac')
  const { getP4DayHeadings } = await import('./p4AlmanacHeadings')
  const { resolveP4OwnerRulesDay } = await import('./p4OwnerRules')
  const { resolveP4YiDay } = await import('./p4YiDayComposition')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { getP4MuCangSoil } = await import('./p4YiOperands')
  const { evaluateEventDay } = await import('./eventEvaluation')
  const { eventOutput, EVENT_HOURS } = await import('./p4AdapterBaselineRows')
  const { EVENT_OPTIONS } = await import('./eventMapping')
  const { P4_PUZHU06_AUTHORITY_ID } = await import('./p4Puzhu06')
  expect(P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
  return {
    getAlmanac,
    getP4DayHeadings,
    resolveP4OwnerRulesDay,
    resolveP4YiDay,
    getP4MoonPhase,
    getP4SoilPresence,
    getP4MuCangSoil,
    evaluateEventDay,
    eventOutput,
    EVENT_HOURS,
    EVENT_OPTIONS,
  }
}
type Engine = Awaited<ReturnType<typeof load>>
const h16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)
const days = (from: string, to: string) => {
  const out: string[] = []
  for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

function operands(e: Engine, date: string) {
  const a = e.getAlmanac(date as never)
  const month = BRANCHES[a.selectionContext.MONTH_JIAN_BRANCH!]!
  const pillar = STEMS[a.dayCanChi.can]! + BRANCHES[a.dayCanChi.chi]!
  return {
    a,
    month,
    pillar,
    op: {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: e.getP4MoonPhase(date),
      soil: e.getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: e.getP4MuCangSoil(date) },
    },
  }
}

/** Production rows with a surviving ungraded 忌 and 宜 noted, with the 宜 gods of the engine trace. */
function population(e: Engine, month: string, pillar: string, op?: object) {
  const rows = e.resolveP4OwnerRulesDay(month, pillar, op as never) as Record<string, Row>
  const yi = e.resolveP4YiDay(month, pillar, op as never).yiEvidence as unknown as Record<
    string,
    { trace?: { han: string; presence: string }[] }
  >
  const out: Record<string, unknown> = {}
  for (const [h, r] of Object.entries(rows)) {
    if (r.state !== 'both_present' || !ungraded(r).length) continue
    out[h] = {
      ji: r.trace!.ji,
      ungraded: ungraded(r),
      prot: r.trace!.prot,
      protectedJi: r.protectedJi ?? false,
      puzhu06: r.puzhu06 ?? '',
      propagationBlocked: r.propagationBlocked ?? '',
      yiGods: (yi[h]?.trace ?? []).filter((t) => t.presence === 'present').map((t) => t.han),
    }
  }
  return out
}

/** Every production row of a context (for the page-pattern check), compact. */
function contextRows(e: Engine, month: string, pillar: string) {
  const rows = e.resolveP4OwnerRulesDay(month, pillar) as Record<string, Row>
  return Object.fromEntries(
    Object.entries(rows).map(([h, r]) => [
      h,
      {
        state: r.state,
        ji: r.trace?.ji ?? [],
        prot: r.trace?.prot ?? [],
        puzhu06: r.puzhu06 ?? '',
      },
    ]),
  )
}

function snapshot(e: Engine, date: string) {
  const { a } = operands(e, date)
  const op = {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  }
  const heads = e.getP4DayHeadings(date, op)
  type Rec = { activityId: string; score: number; status: string; hardWarning: boolean }
  const acts = Object.fromEntries(
    (a.activityRecommendations as unknown as Rec[]).map((r) => [
      r.activityId,
      { score: r.score, status: r.status, hardWarning: r.hardWarning, sha: h16(JSON.stringify(r)) },
    ]),
  )
  const events: Record<string, { score: unknown; classification: string; sha: string }> = {}
  for (const [id] of e.EVENT_OPTIONS)
    for (const hr of e.EVENT_HOURS) {
      const ev = e.eventOutput(e.evaluateEventDay, date, id, hr) as {
        score: unknown
        classification: string
      }
      events[`${id}@${hr ?? ''}`] = {
        score: ev.score,
        classification: ev.classification,
        sha: h16(JSON.stringify(ev)),
      }
    }
  return { heads, acts, events }
}

const pageContexts = () => JSON.parse(readFileSync(DIR + 'page-contexts.json', 'utf8')) as string[]

describe('Q4-REST Stage 2A.1 runtime', () => {
  it.runIf(process.env.Q4R2A1_DUMP === '1')(
    'dumps population, page contexts and diagnostic impact (2025–2027)',
    async () => {
      const prod = await load('production')
      const range = days('2025-01-01', '2027-12-31')
      const pop: Record<string, unknown> = {}
      const snapA = new Map<string, ReturnType<typeof snapshot>>()
      const ctxOf: Record<string, string> = {}
      for (const d of range) {
        const { month, pillar, op } = operands(prod, d)
        ctxOf[d] = `${month}-${pillar}`
        const p = population(prod, month, pillar, op)
        if (Object.keys(p).length) pop[d] = { context: ctxOf[d], rows: p }
        snapA.set(d, snapshot(prod, d))
      }
      const pages = Object.fromEntries(
        pageContexts().map((c) => [c, contextRows(prod, c[0]!, c.slice(2))]),
      )
      const impact: Record<string, unknown> = {}
      for (const scope of ['all', 'evidence', 'f1y', 'u7'] as const) {
        const yn = await load(scope)
        const heading: unknown[] = []
        const activity: unknown[] = []
        const event: unknown[] = []
        for (const d of range) {
          const x = snapA.get(d)!
          const y = snapshot(yn, d)
          for (const h of new Set([...Object.keys(x.heads), ...Object.keys(y.heads)]))
            if (JSON.stringify(x.heads[h]) !== JSON.stringify(y.heads[h]))
              heading.push({
                date: d,
                context: ctxOf[d],
                heading: h,
                production: x.heads[h],
                ynarrow: y.heads[h],
              })
          for (const id of Object.keys(x.acts)) {
            const p = x.acts[id]!
            const q = y.acts[id]!
            if (p.sha !== q.sha)
              activity.push({
                date: d,
                context: ctxOf[d],
                activityId: id,
                production: { score: p.score, status: p.status, hardWarning: p.hardWarning },
                ynarrow: { score: q.score, status: q.status, hardWarning: q.hardWarning },
              })
          }
          for (const k of Object.keys(x.events)) {
            const p = x.events[k]!
            const q = y.events[k]!
            if (p.sha !== q.sha)
              event.push({
                date: d,
                context: ctxOf[d],
                event: k,
                production: { score: p.score, classification: p.classification },
                ynarrow: { score: q.score, classification: q.classification },
              })
          }
        }
        impact[scope] = { heading, activity, event }
      }
      writeFileSync(
        OUT,
        JSON.stringify({
          authority: 'p4b-puzhu06-v4',
          range: ['2025-01-01', '2027-12-31'],
          population: pop,
          pages,
          impact,
        }) + '\n',
      )
    },
    3_600_000,
  )

  it('the frozen runtime dump re-derives for every page context and the first population days', async () => {
    expect(existsSync(OUT)).toBe(true)
    const dump = JSON.parse(readFileSync(OUT, 'utf8'))
    const prod = await load('production')
    for (const c of pageContexts())
      expect(contextRows(prod, c[0]!, c.slice(2)), c).toEqual(dump.pages[c])
    const sample = Object.keys(dump.population).slice(0, 25)
    expect(sample.length).toBe(25)
    for (const d of sample) {
      const { month, pillar, op } = operands(prod, d)
      expect(population(prod, month, pillar, op), d).toEqual(dump.population[d].rows)
    }
  }, 600_000)
})
