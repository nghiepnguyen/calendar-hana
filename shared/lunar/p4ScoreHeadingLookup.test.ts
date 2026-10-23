import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import xieji from '../almanac-data/xiejibianfangshu-yiji.json'
import { solarTermCacheStore } from '../astronomy/solarTerms/cache'
// Production loads the provider before the first almanac (roadmap 10).
import { getP4DayHeadings } from './p4AlmanacHeadings'
import { getAlmanac } from './almanac'
import { P4_HEADINGS } from './p4HeadingAnnotation'
import {
  applyP4Balancing,
  p4ActivityState,
  setP4HeadingsProvider,
  type P4HeadingInput,
  type P4ScoreHeadingLookup,
} from './p4ScoreAdapter'
import { canonicalP4HeadingKey } from './xiejiVol10Resolution'

// G1-b Stage 1 (docs/audits/p4-g1b-score-lookup.md): the policy exists, production ships source-key-v1.
const policy = vi.hoisted(() => ({ lookup: 'source-key-v1', balancing: true }))
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return {
    default: {
      ...real,
      policies: {
        ...real.policies,
        get p4ScoreHeadingLookup() {
          return policy.lookup
        },
        get xiejiVol10BalancingEnabled() {
          return policy.balancing
        },
      },
    },
  }
})

const RAW = '破屋壞垣'
const CANON = '破屋壊垣'
const ACTS = xieji.activityEntries as Record<string, string[]>
const FULL = process.env.P4_HEADING_LOOKUP_FULL === '1'
const OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']
const DATES: string[] = []
for (let t = Date.UTC(2025, 0, 1); t <= Date.UTC(2027, 11, 31); t += 864e5)
  DATES.push(new Date(t).toISOString().slice(0, 10))
// Default sample: January 2025 (vol10 and legacy paths, every P4 state) and the 丑-壬寅 soil day.
const SAMPLE = FULL ? DATES : [...DATES.slice(0, 31), '2025-02-02']

type Headings = Readonly<Record<string, P4HeadingInput>>
const recs = (date: string, lookup: P4ScoreHeadingLookup, balancing = true) => {
  policy.lookup = lookup
  policy.balancing = balancing
  solarTermCacheStore('almanac').clear() // the getAlmanac memo key has no policy component
  return JSON.stringify(getAlmanac(date as never).activityRecommendations)
}
const byActivity = (json: string) =>
  new Map(
    (JSON.parse(json) as { activityId: string }[]).map((r) => [r.activityId, JSON.stringify(r)]),
  )

afterEach(() => {
  policy.lookup = 'source-key-v1'
  policy.balancing = true
  setP4HeadingsProvider(getP4DayHeadings)
  solarTermCacheStore('almanac').clear()
})

describe('canonicalP4HeadingKey', () => {
  it('maps both demolition spellings to the canonical key', () => {
    expect(canonicalP4HeadingKey(RAW)).toBe(CANON)
    expect(canonicalP4HeadingKey(CANON)).toBe(CANON)
  })

  it('leaves every other activity heading unchanged and rejects multi-heading text', () => {
    const changed = Object.values(ACTS)
      .flat()
      .filter((h) => canonicalP4HeadingKey(h) !== h)
    expect(changed).toEqual([RAW])
    expect(canonicalP4HeadingKey('立券交易')).toBe('立券交易')
    expect(canonicalP4HeadingKey('嫁娶')).toBe('嫁娶')
    expect(() => canonicalP4HeadingKey('嫁娶安葬')).toThrow(RangeError)
  })

  it('resolves every activity heading to a P4 heading key (drift guard)', () => {
    const missing = Object.values(ACTS)
      .flat()
      .map(canonicalP4HeadingKey)
      .filter((h) => !P4_HEADINGS.includes(h))
    expect(missing).toEqual([])
  })

  it('keeps the source spelling in the activity map (provenance)', () => {
    expect(ACTS.demolition).toEqual([RAW])
    expect(Object.keys(xieji.entries)).toContain(RAW)
    expect(Object.keys(xieji.entries)).not.toContain(CANON)
  })
})

describe('p4ScoreAdapter heading lookup', () => {
  const day: Headings = { [CANON]: { state: 'only_ji' } }

  it('source-key-v1 (default) keeps demolition on baseline', () => {
    expect(p4ActivityState('demolition', day)).toEqual({ state: 'baseline' })
    expect(p4ActivityState('demolition', day, 'source-key-v1')).toEqual({ state: 'baseline' })
  })

  it('canonical-v1 resolves demolition and keeps the source spelling as deciding heading', () => {
    expect(p4ActivityState('demolition', day, 'canonical-v1')).toEqual({
      state: 'only_ji',
      heading: RAW,
    })
    const p4 = p4ActivityState('demolition', day, 'canonical-v1')
    const rows = applyP4Balancing([], p4, day, {
      activityId: 'demolition',
      scope: 'demolition',
      headingLookup: 'canonical-v1',
    })
    expect(rows.map((r) => r.sourceClauseId)).toEqual([`p4:${RAW}`])
  })

  it('canonical-v1 reads prot through the canonical key', () => {
    // only_yi lifts negatives unless the god is protected (§6.9); 月刑 is protected on this heading.
    const row = {
      source: 'bad_god',
      ruleId: 'nguyet_hinh',
      activityId: 'demolition',
      scope: 'demolition',
      label: 'Nguyệt Hình',
      sourcePhrase: '',
      sourceRef: '',
      confidence: 'high',
      status: 'applied',
      rawDelta: -10,
      scoreDelta: -10,
      polarity: 'negative',
    } as const
    const yiDay: Headings = { [CANON]: { state: 'only_yi', prot: ['月刑'] } }
    const status = (lookup: P4ScoreHeadingLookup) =>
      applyP4Balancing([row], { state: 'only_yi', heading: RAW }, yiDay, {
        activityId: 'demolition',
        scope: 'demolition',
        headingLookup: lookup,
      })[0]!.status
    expect(status('source-key-v1')).toBe('informational') // prot unseen, so lifted
    expect(status('canonical-v1')).toBe('applied')
  })
})

describe('getAlmanac under the lookup policy', () => {
  it('the shipped manifest is source-key-v1', () => {
    const shipped = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
      policies: Record<string, unknown>
    }
    expect(shipped.policies.p4ScoreHeadingLookup).toBe('source-key-v1')
    expect(shipped.policies.xiejiVol10BalancingEnabled).toBe(true)
  })

  it('source-key-v1 keeps demolition on the pre-P4 path; canonical-v1 changes only demolition', () => {
    let changedDays = 0
    for (const date of SAMPLE) {
      const src = byActivity(recs(date, 'source-key-v1'))
      const can = byActivity(recs(date, 'canonical-v1'))
      expect(
        JSON.parse(src.get('demolition')!).contributions.some(
          (r: { policyId?: string }) => r.policyId === 'product_policy_default_penalty',
        ),
      ).toBe(false)
      for (const [id, row] of src)
        if (id !== 'demolition') expect(can.get(id), `${date} ${id}`).toBe(row)
      if (src.get('demolition') !== can.get('demolition')) changedDays++
    }
    expect(changedDays).toBeGreaterThan(0)
  }, 900_000)

  it('canonical-v1 equals the audited simulation (provider aliases the source spelling)', () => {
    const aliased = (d: string, o: Parameters<typeof getP4DayHeadings>[1]) => {
      const h = getP4DayHeadings(d, o)
      return h[CANON] ? { ...h, [RAW]: h[CANON] } : h
    }
    for (const date of SAMPLE) {
      const can = recs(date, 'canonical-v1')
      setP4HeadingsProvider(aliased)
      const sim = recs(date, 'source-key-v1')
      setP4HeadingsProvider(getP4DayHeadings)
      expect(can, date).toBe(sim)
    }
  }, 900_000)

  it('has no effect with P4 balancing disabled', () => {
    for (const date of SAMPLE)
      expect(recs(date, 'canonical-v1', false), date).toBe(recs(date, 'source-key-v1', false))
  }, 900_000)

  it('has no effect outside the P4 domain', () => {
    for (const date of OUTSIDE)
      expect(recs(date, 'canonical-v1'), date).toBe(recs(date, 'source-key-v1'))
  })
})
