import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import witness from '../../docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json'
import scopeDates from '../../docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json'

// Audit only: G1-a demolition (docs/audits/p4-g1a-demolition-authority.md). Successor to the faithful
// 劫煞 harnesses (p4JieshaFaithfulSensitivity / p4Puzhu17Audit / p4ChouBingyinDeGate …), which key the
// 卷十一 activity side with canonP4Heading (劵→券 only) while the 劫煞 side comes through splitHeadings
// (NORM 壞→壊): demolition's source key 破屋壞垣 never meets 破屋壊垣 and reads a false not_listed. Those
// harnesses and their locked outputs stay frozen; this file keys both sides with canonicalP4HeadingKey and
// keeps the source spelling next to it. Prelude trimmed from p4Puzhu17Audit.test.ts (vi.mock must live in
// the test file): faithful candidate only, no puzhu:17 variants (puzhu:17 never reaches demolition).
// npm test: compare with engine.json; G1A_WRITE=1 rewrites it; G1A_FULL=1 adds every faithful scope date.
const S = vi.hoisted(() => ({
  mode: null as null | 'F',
  day: null as null | { key: string; yi: Record<string, boolean | undefined> },
  warehouseYi: undefined as boolean | undefined,
}))
const SOIL_MONTHS = '辰戌丑未'
// 卷五 立成 as corrected (「今圖依起例改正」): 三子 四寅 四卯; matches 67/67 locked 月表 pages.
const MINGFEI_DUI = new Set('丙子 庚子 壬子 甲寅 丙寅 庚寅 壬寅 乙卯 丁卯 辛卯 癸卯'.split(' '))

function yiFromTrace(trace: { presence: string }[] | undefined): boolean | undefined {
  const states = (trace ?? []).map((t) =>
    t.presence === 'present' ? true : t.presence === 'absent' ? false : undefined,
  )
  return states.includes(true) ? true : states.includes(undefined) ? undefined : false
}
const viaQizan = (pillar: string, heading: string) => heading === '安葬' && MINGFEI_DUI.has(pillar)
const keepsJi = (pillar: string, heading: string, yi: boolean | undefined) =>
  yi === false && !viaQizan(pillar, heading)

vi.mock('./p4YiDayComposition', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4YiDayComposition')>()
  return {
    ...m,
    resolveP4YiDay: (...a: Parameters<typeof m.resolveP4YiDay>) => {
      const r = m.resolveP4YiDay(...a)
      const ev = r.yiEvidence as unknown as Record<string, { trace?: { presence: string }[] }>
      S.day = {
        key: a[0] + a[1],
        yi: Object.fromEntries(Object.entries(ev).map(([h, e]) => [h, yiFromTrace(e?.trace)])),
      }
      return r
    },
  }
})
vi.mock('./p4Warehouse', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4Warehouse')>()
  return {
    ...m,
    resolveP4WarehouseDay: (...a: Parameters<typeof m.resolveP4WarehouseDay>) => {
      const r = m.resolveP4WarehouseDay(...a)
      S.warehouseYi = r.warehouse.yi
      return r
    },
  }
})
vi.mock('./p4HeadingAnnotation', async (importOriginal) => {
  const m = await importOriginal<typeof import('./p4HeadingAnnotation')>()
  return {
    ...m,
    resolveP4Headings: (...a: Parameters<typeof m.resolveP4Headings>) => {
      const r = m.resolveP4Headings(...a)
      if (!S.mode) return r
      const [month, pillar, yi = {}] = a
      const sc = r.scopes['刼煞'] as { clauseEffect?: string; headings?: Record<string, string> }
      const caller = new Error().stack?.split('\n')[2] ?? ''
      if (
        !caller.includes('resolveP4OwnerRulesDay') ||
        !SOIL_MONTHS.includes(month) ||
        sc?.clauseEffect !== 'cancel_both' ||
        !sc.headings
      )
        return r
      const allTrue = Object.values(yi).length > 0 && Object.values(yi).every((v) => v === true)
      if (allTrue && S.day?.key !== month + pillar) throw new Error('stale 宜 stash')
      const headings = { ...sc.headings }
      for (const [h, s] of Object.entries(headings)) {
        if (s !== 'neither_recorded') continue
        const y = allTrue ? (h === '修倉庫' ? S.warehouseYi : S.day!.yi[h]) : yi[h]
        // 鋪註05: 求醫療病 is in 劫煞's 止忌 list, kept whatever its 宜.
        if (h === '求醫療病' || keepsJi(pillar, h, y)) headings[h] = 'only_ji'
      }
      return { ...r, scopes: { ...r.scopes, 刼煞: { ...sc, headings } } }
    },
  }
})

type Row = { state: string; yi?: boolean; propagatedFrom?: string; trace?: { ji: string[] } }
const DIR = 'docs/audits/sources/p4-vol10/g1a-demolition-authority-v1'
const SOURCE_RAW = '破屋壞垣' // 卷十一 activity map key and every 月表 page (h1b)
const CANDIDATE = '破屋壊垣' // 卷十一 heading glyph; runtime key
// Same representative dates as p4Puzhu17Audit / G1 §B, so the four witness conflicts are the same ones.
const REP: Record<string, string> = {
  '丑-丙寅': '1904-02-02',
  '丑-壬寅': '2025-02-02',
  '丑-戊寅': '2025-01-09',
  '丑-甲寅': '1902-01-31',
  '戌-丁亥': '2027-11-04',
  '戌-乙亥': '2025-11-02',
  '戌-己亥': '1903-11-07',
  '戌-癸亥': '2025-10-21',
  '未-丙申': '2025-07-26',
  '未-壬申': '1904-08-06',
  '未-庚申': '1902-08-05',
  '未-戊申': '2026-08-02',
  '辰-乙巳': '2025-04-06',
  '辰-己巳': '2025-04-30',
  '辰-癸巳': '1903-05-05',
  '辰-辛巳': '2027-05-02',
}
const CONFLICTS = ['丑-甲寅', '丑-丙寅', '丑-壬寅', '未-戊申']
const SIBLINGS = ['興造動土', '豎柱上梁']

async function setup() {
  vi.resetModules()
  const own = await import('./p4OwnerRules')
  const { getP4MoonPhase } = await import('./p4LunarPhase')
  const { getP4MuCangSoil } = await import('./p4YiSoil')
  const { getP4SoilPresence } = await import('./p4SoilConvention')
  const { solarToLunar } = await import('./lunar')
  const { thoVuongDungSuPeriods } = await import('./thoVuongDungSu')
  const { splitHeadings, canonicalP4HeadingKey, canonP4Heading } =
    await import('./xiejiVol10Resolution')
  const jie = (vol10.entries as { id: string; avoid: string }[]).find((e) => e.id === 'jie_sha')!
  const listed = new Set(splitHeadings(jie.avoid).map(canonP4Heading))
  const acts = vol11.activityEntries as Record<string, string[]>
  const p25 = thoVuongDungSuPeriods(2025)[0]!
  const muRef = { present: getP4MuCangSoil(p25.onset), absent: getP4MuCangSoil('2025-06-15') }
  if (muRef.present.state !== 'present' || muRef.absent.state !== 'absent')
    throw new Error('母倉 ref')
  const inWindow = (date: string) =>
    thoVuongDungSuPeriods(Number(date.slice(0, 4))).some((p) => date >= p.onset && date <= p.eve)
  /** Faithful engine rows with 土王用事後 (soil and 母倉 soil reign) forced to `soil`; unknown moon
   * phase enumerated as in the faithful harnesses. */
  const runs = (date: string, month: string, pillar: string, soil: 'present' | 'absent') => {
    const [y, m, d] = date.split('-').map(Number)
    const lunarDay = solarToLunar(d!, m!, y!).day
    const phase = getP4MoonPhase(date)
    const phases = phase.phase === 'unknown' ? ['none', 'New Moon'] : [phase.phase]
    // Stand-ins carry no civil date: the engine reads date only for its same-day check.
    const { date: _d, ...mu } = muRef[soil]
    const { date: _s, ...soilRef } = getP4SoilPresence('2025-06-15')
    return phases.map((ph) => {
      S.mode = 'F'
      try {
        return own.resolveP4OwnerRulesDay(month, pillar, {
          lunarDay,
          phase: { ...phase, phase: ph },
          soil: { ...soilRef, presence: soil },
          yiInputs: { SOIL_REIGN_STATE: mu },
        } as never) as Record<string, Row>
      } finally {
        S.mode = null
      }
    })
  }
  /** The three keys G1-a keeps apart: what the source wrote, the comparison key, the runtime key. */
  const keys = (sourceRaw: string) => ({
    sourceRaw,
    normalizedComparison: splitHeadings(sourceRaw).join('|'),
    canonicalCandidate: canonicalP4HeadingKey(sourceRaw),
  })
  const verdictOf = (rows: Record<string, Row>, hs: string[]) => {
    if (!hs.length) return 'not_listed'
    const keep = (h: string) =>
      ['only_ji', 'both_present'].includes(rows[h]?.state ?? '') &&
      Boolean(rows[h]?.trace?.ji.includes('刼煞'))
    if (hs.some(keep)) return 'avoid'
    return hs.some((h) => rows[h]?.state === 'undetermined') ? 'undetermined' : 'blank'
  }
  const demolitionKeys = {
    legacy: acts.demolition!.map(canonP4Heading).filter((h) => listed.has(h)),
    corrected: acts.demolition!.map(canonicalP4HeadingKey).filter((h) => listed.has(h)),
  }
  return { runs, keys, verdictOf, demolitionKeys, inWindow }
}

const brief = (r?: Row) =>
  r && { state: r.state, yi: r.yi, ji: r.trace?.ji ?? [], propagatedFrom: r.propagatedFrom }
const one = <T>(xs: T[]) => {
  const s = [...new Set(xs.map((x) => JSON.stringify(x)))]
  return s.length === 1 ? JSON.parse(s[0]!) : { enumerated: s.map((x) => JSON.parse(x)) }
}

describe('G1-a demolition engine (corrected keying)', () => {
  it('reproduces the harness defect and keeps the three keys apart', async () => {
    const { demolitionKeys, keys } = await setup()
    expect(demolitionKeys.legacy).toEqual([]) // false not_listed (frozen harnesses)
    expect(demolitionKeys.corrected).toEqual([CANDIDATE])
    const k = keys(SOURCE_RAW)
    expect(k.sourceRaw).toBe(SOURCE_RAW)
    expect(k.sourceRaw).not.toBe(CANDIDATE) // raw transcription differs
    expect(k.normalizedComparison).toBe(keys(CANDIDATE).normalizedComparison) // comparison agrees
    expect(k.canonicalCandidate).toBe(CANDIDATE)
    expect(SOURCE_RAW.normalize('NFKC')).not.toBe(CANDIDATE) // not a Unicode compatibility pair
  })

  it(
    'freezes demolition per context with 土王用事後 absent and present',
    { timeout: 600_000 },
    async () => {
      const { runs, verdictOf, demolitionKeys, inWindow, keys } = await setup()
      const pages = new Map(
        (
          witness.pages as {
            monthJian: string
            pillar: string
            jiLine: string
            path: string
            sha256: string
          }[]
        ).map((p) => [`${p.monthJian}-${p.pillar}`, p]),
      )
      const contexts: Record<string, unknown> = {}
      for (const [ctx, date] of Object.entries(REP)) {
        const [month, pillar] = ctx.split('-') as [string, string]
        const at = (soil: 'present' | 'absent') => {
          const rs = runs(date, month, pillar, soil)
          return {
            verdict: one(rs.map((r) => verdictOf(r, demolitionKeys.corrected))),
            legacyVerdict: one(rs.map((r) => verdictOf(r, demolitionKeys.legacy))),
            [CANDIDATE]: one(rs.map((r) => brief(r[CANDIDATE]))),
            ...Object.fromEntries(SIBLINGS.map((h) => [h, one(rs.map((r) => brief(r[h])))])),
          }
        }
        const page = pages.get(ctx)!
        const absent = at('absent')
        // A 月表 page is keyed by month + pillar only, so it can witness the 土王用事後-absent cell only.
        const printedRaw = page.jiLine.includes(SOURCE_RAW)
        // 月表 terms (通書選擇六十事) are outside the 卷十一 vocabulary, so match any spelling with the key.
        const printedNorm = [SOURCE_RAW, CANDIDATE].some(
          (s) => keys(s).canonicalCandidate === CANDIDATE && page.jiLine.includes(s),
        )
        contexts[ctx] = {
          repDate: date,
          repDateInSoilWindow: inWindow(date),
          conflict: CONFLICTS.includes(ctx),
          soilAbsent: absent,
          soilPresent: at('present'),
          witness: {
            page: page.path.split('/').pop(),
            sha256: page.sha256,
            printedSourceRaw: printedRaw,
            printedNormalized: printedNorm,
            printedOtherGlyph: page.jiLine.includes(CANDIDATE),
            predictedPrintedSoilAbsent: absent.verdict === 'avoid',
            agreesSoilAbsent: (absent.verdict === 'avoid') === printedNorm,
          },
        }
      }
      const out = { sourceRaw: SOURCE_RAW, canonicalCandidate: CANDIDATE, demolitionKeys, contexts }
      if (process.env.G1A_WRITE)
        writeFileSync(`${DIR}/engine.json`, JSON.stringify(out, null, 1) + '\n')
      expect(out).toEqual(JSON.parse(readFileSync(`${DIR}/engine.json`, 'utf8')))
    },
  )

  it.skipIf(!process.env.G1A_FULL)(
    'demolition verdict on every faithful scope date, split by 土王用事 window',
    { timeout: 3_600_000 },
    async () => {
      const { runs, verdictOf, demolitionKeys, inWindow } = await setup()
      const out: Record<string, Record<string, Record<string, number>>> = {}
      for (const [ctx, dates] of Object.entries(scopeDates as Record<string, string[]>)) {
        const [month, pillar] = ctx.split('-') as [string, string]
        const tally: Record<string, Record<string, number>> = { inWindow: {}, outOfWindow: {} }
        for (const date of dates) {
          const w = inWindow(date)
          const v = one(
            runs(date, month, pillar, w ? 'present' : 'absent').map((r) =>
              verdictOf(r, demolitionKeys.corrected),
            ),
          )
          const key = typeof v === 'string' ? v : JSON.stringify(v)
          const t = tally[w ? 'inWindow' : 'outOfWindow']!
          t[key] = (t[key] ?? 0) + 1
        }
        out[ctx] = tally
      }
      if (process.env.G1A_WRITE)
        writeFileSync(`${DIR}/full.json`, JSON.stringify(out, null, 1) + '\n')
      expect(out).toEqual(JSON.parse(readFileSync(`${DIR}/full.json`, 'utf8')))
    },
  )
})
