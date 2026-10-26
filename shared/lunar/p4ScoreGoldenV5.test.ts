import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import { getP4DayHeadings } from './p4AlmanacHeadings'
import { getAlmanac } from './almanac'
import { lockedDigests } from './lockAnchor'
import { p4ActivityState } from './p4ScoreAdapter'

// F1 Stage 3 (docs/audits/p4-f1-wuli-lijuan-stage3-migration.md): the shipped puzhu:06 authority v4 against
// Score Golden v5. Same configuration as the v4 gate (p4ScoreGoldenV4.test.ts, now pinned to the pre-R2
// rollback); layer B is v5's own file. npm test: every 10th P4 date + the R2 dates + the 3 outside dates;
// ci:p4 (P4_SCORE_ADAPTER_FULL=1): all 1098.
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
      },
    },
  }
})

const DIR = 'docs/audits/sources/p4-vol10/p4-score-golden-v5/'
const tsv = (path: string) => {
  const [head, ...rows] = readFileSync(path, 'utf8').trimEnd().split('\n')
  const keys = head!.split('\t')
  return rows.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [keys[i]!, v])))
}
const FULL = process.env.P4_SCORE_ADAPTER_FULL === '1'
const STATES = tsv(DIR + 'activity-states.tsv')
const R2_DATES = (
  JSON.parse(readFileSync(DIR + 'diff.json', 'utf8')) as { changedDates: string[] }
).changedDates
const OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']
const P4_DATES = [...new Set(STATES.map((r) => r.date!))]
  .filter((d) => !OUTSIDE.includes(d))
  .filter((d, i) => FULL || i % 10 === 0 || R2_DATES.includes(d))
const SAMPLED = new Set([...P4_DATES, ...OUTSIDE])

const headingsOf = (date: string) => {
  const a = getAlmanac(date as never)
  return getP4DayHeadings(date, {
    monthJianBranch: a.selectionContext.MONTH_JIAN_BRANCH!,
    dayStem: a.dayCanChi.can,
    dayBranch: a.dayCanChi.chi,
    lunarDay: a.selectionContext.LUNAR_DAY!,
  })
}

describe('P4 score Golden v5 (F1 R2, puzhu:06 authority v4)', () => {
  it('the shipped lookup is canonical-v1 (not pinned here)', () => {
    expect(manifest.policies.p4ScoreHeadingLookup).toBe('canonical-v1')
  })

  it('lock pins the Golden and its inputs', () => {
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    expect(lock.files).toHaveLength(8)
    const atAnchor = lockedDigests(
      DIR + 'lock.json',
      lock.files.filter((f) => !f.path.startsWith(DIR)).map((f) => f.path),
    )
    for (const f of lock.files)
      expect(
        atAnchor.get(f.path) ?? createHash('sha256').update(readFileSync(f.path)).digest('hex'),
        f.path,
      ).toBe(f.sha256)
  })

  it('heading states from the resolver give the Golden v5 activity states (layer B)', () => {
    const byDate = new Map<string, ReturnType<typeof getP4DayHeadings>>()
    const diff = STATES.filter((r) => SAMPLED.has(r.date!)).filter((r) => {
      let hs = byDate.get(r.date!)
      if (!hs) byDate.set(r.date!, (hs = headingsOf(r.date!)))
      const got = p4ActivityState(r.activity!, hs) // code default: canonical-v1
      return (
        got.state !== r.state ||
        (got.heading ?? '') !== r.deciding_heading ||
        String(got.allTaboo === true) !== r.all_taboo
      )
    })
    expect(diff.slice(0, 10)).toEqual([])
  }, 900_000)

  it('every activity score, status and hard warning equals Golden v5 layer C', () => {
    const want = tsv(DIR + 'activity-scores.tsv').filter((r) => SAMPLED.has(r.date!))
    const recs = new Map<
      string,
      Map<string, { score: number; status: string; hardWarning: boolean }>
    >()
    const diff = want
      .filter((r) => {
        let day = recs.get(r.date!)
        if (!day)
          recs.set(
            r.date!,
            (day = new Map(
              getAlmanac(r.date as never).activityRecommendations.map((x) => [x.activityId, x]),
            )),
          )
        const got = day.get(r.activity!)!
        return (
          got.score !== Number(r.score) ||
          got.status !== r.status ||
          String(got.hardWarning) !== r.hard_warning
        )
      })
      .map((r) => `${r.date} ${r.activity}`)
    expect(want.length).toBe(FULL ? 1095 * 32 : P4_DATES.length * 32)
    expect(diff.slice(0, 10)).toEqual([])
  }, 900_000)
})
