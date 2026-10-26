import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import dates from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { getP4MoonPhase } from './p4LunarPhase'
import { getP4SoilPresence } from './p4SoilConvention'
import { getP4MuCangSoil } from './p4YiOperands'

// Q4-REST Stage 1 (docs/audits/p4-q4-rest-stage1-witness-matrix.md), audit only. Two prediction models for
// 九空 / 五虛 / 小耗 / 五墓, each in its own module graph (vi.doMock + vi.resetModules, as in F1 Stage 2):
//   generic  production as shipped (p4b-puzhu06-v4): any puzhu:06 trigger outside an established exclusion lifts
//   narrow   v4 + liftExclusions[god] = every puzhu:06 trigger outside the god's own 卷十 lifters (test-only)
// Q4R_DUMP=1 writes q4-rest-stage1/models.json (720 contexts and the 1,095 dated days); npm test re-derives
// the witness contexts named in evidence.json against that dump. No production code or data is touched.
type Model = 'generic' | 'narrow'
// Production imports authority v5 since Q4-REST Stage 3; this proof stays pinned to v4 (q4RestRollback.ts).
const PUZHU06 = '../almanac-data/p4b-puzhu06-v5.json'
const DIR = 'docs/audits/sources/p4-vol10/q4-rest-stage1/'
const OUT = DIR + 'models.json'
const B = '子丑寅卯辰巳午未申酉戌亥'
const S = '甲乙丙丁戊己庚辛壬癸'
export const Q4_REST_GODS = ['九空', '五虛', '小耗', '五墓'] as const
// Own lifters ∩ puzhu:06 triggers, from the 卷十 entries (evidence.json sourceRules carries the quotes):
//   九空 「…與月德天德合月德合併則不忌」; 五虛 「與天德月德天德合月德合六合併則不忌」 + note 「天願必是六合」;
//   小耗 「與天德月德天德合月德合天願併則不忌」; 五墓 「五月十一月與月德併則不忌」 (月德 meets 五墓 only in 午/子).
export const Q4_REST_OWN: Record<string, readonly string[]> = {
  九空: ['月德', '天德合', '月德合'],
  五虛: ['天德', '月德', '天德合', '月德合', '天願'],
  小耗: ['天德', '月德', '天德合', '月德合', '天願'],
  五墓: ['月德'],
}

async function load(model: Model) {
  vi.resetModules()
  vi.doUnmock(PUZHU06)
  vi.doMock(PUZHU06, async () => (await import('./q4RestRollback')).puzhu06V4())
  if (model === 'narrow')
    vi.doMock(PUZHU06, async () => {
      const a = ((await import('./q4RestRollback')).puzhu06V4() as { default: { triggers: string[]; liftExclusions: object } }).default
      const extra = Object.fromEntries(
        Q4_REST_GODS.map((g) => [g, { triggers: a.triggers.filter((t) => !Q4_REST_OWN[g]!.includes(t)) }]),
      )
      return { default: { ...a, liftExclusions: { ...a.liftExclusions, ...extra } } }
    })
  const m = await import('./p4Puzhu06')
  expect(m.P4_PUZHU06_AUTHORITY_ID).toBe('p4b-puzhu06-v4')
  return m.resolveP4Puzhu06Day
}
type Resolve = Awaited<ReturnType<typeof load>>
type Src = { kind?: string; name?: string }
const HEADINGS = ['安牀', '開市', '立券交易', '納財', '開倉庫出貨財']

/** Compact touched rows (untouched rows are identical in both models and in Golden v4). */
function view(day: ReturnType<Resolve>) {
  return Object.fromEntries(
    HEADINGS.filter((h) => day.puzhu06[h]!.action !== 'untouched').map((h) => {
      const d = day.puzhu06[h]!
      const f = day.headings[h]!
      return [
        h,
        {
          action: d.action,
          classes: d.classes.join('+'),
          triggers: d.triggers.join('+'),
          final: f.state,
          ji: f.ji,
          yi: f.yi ?? null,
          sources: (d.sources as Src[]).map((s) => `${s.kind}:${s.name}`).sort(),
        },
      ]
    }),
  )
}

function operands(date: string) {
  const a = getAlmanac(date as never)
  return {
    month: B[a.selectionContext.MONTH_JIAN_BRANCH!]!,
    pillar: S[a.dayCanChi.can]! + B[a.dayCanChi.chi]!,
    op: {
      lunarDay: a.selectionContext.LUNAR_DAY!,
      phase: getP4MoonPhase(date),
      soil: getP4SoilPresence(date),
      yiInputs: { SOIL_REIGN_STATE: getP4MuCangSoil(date) },
    },
  }
}

const contexts = () =>
  [...B].flatMap((m) => Array.from({ length: 60 }, (_, i) => [m, S[i % 10]! + B[i % 12]!] as const))

describe('Q4-REST Stage 1 prediction models', () => {
  it.skipIf(!process.env.Q4R_DUMP)(
    'dumps both models over 720 contexts and 2025–2027',
    async () => {
      const out: Record<string, unknown> = { authority: 'p4b-puzhu06-v4', own: Q4_REST_OWN }
      for (const model of ['generic', 'narrow'] as const) {
        const resolve = await load(model)
        out[model] = {
          contexts: Object.fromEntries(contexts().map(([m, p]) => [`${m}-${p}`, view(resolve(m, p))])),
          dated: Object.fromEntries(
            dates.days.map(({ date }) => {
              const { month, pillar, op } = operands(date)
              return [date, { context: `${month}-${pillar}`, rows: view(resolve(month, pillar, op as never)) }]
            }),
          ),
        }
      }
      writeFileSync(OUT, JSON.stringify(out) + '\n')
    },
    900_000,
  )

  it('the frozen dump re-derives for every witness context, in both models', async () => {
    expect(existsSync(OUT)).toBe(true)
    const dump = JSON.parse(readFileSync(OUT, 'utf8'))
    const evidence = JSON.parse(readFileSync(DIR + 'evidence.json', 'utf8')) as {
      candidates: { context: string }[]
    }
    const ctx = [...new Set(evidence.candidates.map((c) => c.context))]
    expect(ctx.length).toBeGreaterThan(20)
    for (const model of ['generic', 'narrow'] as const) {
      const resolve = await load(model)
      for (const c of ctx) {
        const [m, p] = c.split('-') as [string, string]
        expect(view(resolve(m, p)), `${model} ${c}`).toEqual(dump[model].contexts[c])
      }
    }
  }, 300_000)
})
