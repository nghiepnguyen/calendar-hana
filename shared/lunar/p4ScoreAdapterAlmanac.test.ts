import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import fixture from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS, getEventProfile, resolveEventActivityRoles } from './eventMapping'
import goodGods from '../almanac-data/good-gods.json'
import badGods from '../almanac-data/bad-gods.json'
import { getP4DayHeadings } from './p4AlmanacHeadings'
import { P4_DORMANT_GODS, P4_SCORE_ADAPTER_VERSION, p4ActivityState } from './p4ScoreAdapter'

// Frozen before G2 Stage 2 (立劵交易 alias + 劫煞 authority v2): pinned to the pre-G2 rollback (g2Rollback.ts).
vi.mock('../almanac-data/xiejibianfangshu-vol10-yiji.json', async (load) =>
  (await import('./g2Rollback')).withoutG2Alias(await load()),
)
vi.mock('../almanac-data/xieji-vol10-jiesha-authority-v4.json', async () =>
  (await import('./g2Rollback')).jieshaAuthorityV1(),
)
await vi.hoisted(async () => (await import('./g2Rollback')).reloadUnderG2Pins())

// Roadmap 8 wiring with the flag ON in production config (manifest mocked; production keeps it false).
vi.mock('../almanac-data/manifest.json', async (load) => {
  const real = ((await load()) as { default: { policies: object } }).default
  return {
    default: {
      ...real,
      policies: {
        ...real.policies,
        xiejiVol10BalancingEnabled: true,
        tiangouYinNoYi: false,
        satChuNgocHapStars: false,
        // G1-b Stage 2 ships canonical-v1; Golden v2 is the source-key-v1 rollback evidence.
        p4ScoreHeadingLookup: 'source-key-v1',
      },
    },
  }
})

const tsv = (path: string) => {
  const [head, ...rows] = readFileSync(path, 'utf8').trimEnd().split('\n')
  const keys = head!.split('\t')
  return rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [keys[i]!, v])))
}
const OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']
// npm test: every 10th P4 date + the 3 outside dates; ci:p4 (P4_SCORE_ADAPTER_FULL=1): all 1098.
const FULL = process.env.P4_SCORE_ADAPTER_FULL === '1'
const P4_DATES = fixture.days.map((d) => d.date).filter((_, i) => FULL || i % 10 === 0)
const DATES = [...P4_DATES, ...OUTSIDE]
const SAMPLED = new Set(DATES)
const LABEL = new Map([...goodGods.items, ...badGods.items].map((g) => [g.id, g.label]))
const ALIASES = [
  'Phổ Hộ (Hội Hộ)',
  'Phi Ma Sát (Tai Sát)',
  'Nguyệt Hư (Nguyệt Sát)',
  'Nguyệt Yếm Đại Hoạ',
  'Vãng Vong (Thổ Kỵ)',
]

describe('roadmap 8 almanac wiring (flag ON)', () => {
  it('21 dormant gods appear on Month Jian exactly as the frozen Golden v2 presence', () => {
    const want = new Map(
      tsv('docs/audits/sources/p4-vol10/p4-full-golden-v2/presence/dated.tsv').map((r) => [
        r.date!,
        r.dormant!.split(' ').filter(Boolean).sort(),
      ]),
    )
    const diff: string[] = []
    for (const date of P4_DATES) {
      const a = getAlmanac(date as never)
      const names = new Set([...a.stars.good, ...a.stars.bad].map((s) => s.name))
      const got = [...P4_DORMANT_GODS].filter((id) => names.has(LABEL.get(id)!)).sort()
      if (got.join() !== want.get(date)!.join()) diff.push(`${date} ${got} ≠ ${want.get(date)}`)
      if (ALIASES.some((n) => names.has(n))) diff.push(`${date} alias star kept`)
    }
    expect(diff.slice(0, 10).join('\n')).toBe('')
  }, 300_000)

  it('heading states from the resolver give the Golden v2 activity states', () => {
    const want = tsv('docs/audits/sources/p4-vol10/p4-score-golden-v2/activity-states.tsv').filter(
      (r) => SAMPLED.has(r.date!),
    )
    const byDate = new Map<string, ReturnType<typeof getP4DayHeadings>>()
    const diff = want.filter((r) => {
      let hs = byDate.get(r.date!)
      if (!hs) {
        const a = getAlmanac(r.date as never)
        hs = getP4DayHeadings(r.date!, {
          monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
          dayStem: a.dayCanChi.can,
          dayBranch: a.dayCanChi.chi,
          lunarDay: a.selectionContext.LUNAR_DAY!,
        })
        byDate.set(r.date!, hs)
      }
      const got = p4ActivityState(r.activity!, hs, 'source-key-v1')
      return (
        got.state !== r.state ||
        (got.heading ?? '') !== r.deciding_heading ||
        String(got.allTaboo === true) !== r.all_taboo
      )
    })
    expect(
      diff
        .slice(0, 10)
        .map((r) => Object.values(r).join(' '))
        .join('\n'),
    ).toBe('')
  }, 600_000)

  it('baseline activities and out-of-domain dates keep the flag-OFF score and status', () => {
    const states = new Map(
      tsv('docs/audits/sources/p4-vol10/p4-score-golden-v2/activity-states.tsv').map((r) => [
        `${r.date}|${r.activity}`,
        r.state!,
      ]),
    )
    const diff = tsv('docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/activities.tsv').filter(
      (r) => {
        if (!SAMPLED.has(r.date!)) return false
        if ((states.get(`${r.date}|${r.activity}`) ?? 'baseline') !== 'baseline') return false
        const got = getAlmanac(r.date as never).activityRecommendations.find(
          (x) => x.activityId === r.activity,
        )!
        return (
          String(got.score) !== r.score ||
          got.status !== r.status ||
          String(got.hardWarning) !== r.hard_warning
        )
      },
    )
    expect(
      diff
        .slice(0, 10)
        .map((r) => Object.values(r).join(' '))
        .join('\n'),
    ).toBe('')
  }, 600_000)

  it('every activity score, status and hard warning equals the Golden v2 layer C (roadmap 9b)', () => {
    const diff = tsv('docs/audits/sources/p4-vol10/p4-score-golden-v2/activity-scores.tsv').filter(
      (r) => {
        if (!SAMPLED.has(r.date!)) return false
        const got = getAlmanac(r.date as never).activityRecommendations.find(
          (x) => x.activityId === r.activity,
        )!
        return (
          String(got.score) !== r.score ||
          got.status !== r.status ||
          String(got.hardWarning) !== r.hard_warning
        )
      },
    )
    expect(
      diff
        .slice(0, 10)
        .map((r) => Object.values(r).join(' '))
        .join('\n'),
    ).toBe('')
  }, 600_000)

  it('every dormant star carries a meaning (roadmap 10 A4)', () => {
    const empty = P4_DATES.flatMap((date) => {
      const a = getAlmanac(date as never)
      return [...a.stars.good, ...a.stars.bad]
        .filter((s) => [...P4_DORMANT_GODS].some((id) => LABEL.get(id) === s.name) && !s.meaning)
        .map((s) => `${date} ${s.name}`)
    })
    expect(empty.slice(0, 10).join('\n')).toBe('')
  }, 300_000)

  it('outside the P4 domain flag ON is the whole flag-OFF output (owner 2026-10-18)', () => {
    const want = tsv('docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/activities.tsv').filter(
      (r) => OUTSIDE.includes(r.date!),
    )
    expect(want).toHaveLength(OUTSIDE.length * 32)
    for (const r of want) {
      const a = getAlmanac(r.date as never)
      const got = a.activityRecommendations.find((x) => x.activityId === r.activity)!
      expect(createHash('sha256').update(JSON.stringify(got)).digest('hex'), r.date).toBe(r.sha256)
      const names = new Set([...a.stars.good, ...a.stars.bad].map((s) => s.name))
      expect(
        [...P4_DORMANT_GODS].filter((id) => names.has(LABEL.get(id)!)),
        r.date,
      ).toEqual([])
    }
  })

  it('a resolution failure keeps every activity on baseline instead of throwing', () => {
    expect(
      getP4DayHeadings('2025-06-01', {
        monthJianBranch: 99,
        dayStem: 0,
        dayBranch: 0,
        lunarDay: 1,
      }),
    ).toEqual({})
    for (const date of OUTSIDE)
      expect(
        getP4DayHeadings(date, { monthJianBranch: 0, dayStem: 0, dayBranch: 0, lunarDay: 1 }),
      ).toEqual({})
  })

  // FR-05 / spec §7.1: very_high event_fit reads the primary activity's final applied evidence.
  // Witnesses found by a full-domain scan with the flag ON.
  it.each([
    ['applied negative left → fail', '2025-01-01', 'buy_property', 'fail', { neg: true }],
    ['negative only lifted → pass', '2025-01-03', 'buy_property', 'pass', { lifted: true }],
    ['hard warning → fail', '2025-01-01', 'open_business', 'fail', { hard: true }],
    ['−25 product policy → fail', '2025-02-19', 'buy_property', 'fail', { penalty: true }],
  ] as const)('FR-05 %s', (_, date, event, want, shape) => {
    expect(getEventProfile(event)!.severity).toBe('very_high')
    const primaryId = resolveEventActivityRoles(event, {}).find(
      (r) => r.role === 'primary',
    )!.activityId
    const p = getAlmanac(date as never).activityRecommendations.find(
      (r) => r.activityId === primaryId,
    )!
    const lifted = p.contributions.some(
      (r) =>
        r.status === 'informational' &&
        r.rawDelta < 0 &&
        r.classical?.verdict === 'not_avoided' &&
        r.classical.version === P4_SCORE_ADAPTER_VERSION,
    )
    // Every witness goes through the adapter (non-baseline state), not the flag-OFF path.
    expect(p.contributions.some((r) => r.evidenceOrigin !== undefined)).toBe(true)
    if ('neg' in shape) expect(p.negativeMagnitude > 0 && !p.hardWarning).toBe(true)
    if ('lifted' in shape)
      expect([lifted, p.negativeMagnitude, p.hardWarning]).toEqual([true, 0, false])
    if ('hard' in shape) expect(p.hardWarning).toBe(true)
    if ('penalty' in shape)
      expect(p.contributions.some((r) => r.evidenceOrigin === 'product_policy')).toBe(true)
    const e = evaluateEventDay(date, event, {})
    const fit = [...(e.mustHave ?? []), ...(e.criteria ?? [])].find((c) => c.id === 'event_fit')
    expect(fit?.status).toBe(want)
  })

  it('event evaluation does not throw on sampled dates (smoke only; FR-05 witnesses open)', () => {
    for (const date of DATES)
      for (const [id] of EVENT_OPTIONS)
        expect(evaluateEventDay(date, id, {}).classification).toBeTruthy()
  }, 600_000)
})
