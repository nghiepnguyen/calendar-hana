import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import fixture from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { EVENT_OPTIONS } from './eventMapping'

// Roadmap 8: measured production baseline, frozen before any adapter code (runtime-equal to f00dd5c).
// With `xiejiVol10BalancingEnabled` OFF every row here must stay byte-equal. Default manifest, no
// override, no personal input. Version stamps are left out so a version bump alone is not a diff.
// P4_ADAPTER_BASELINE_WRITE=1 rewrites the files; the lock is written once, by hand, at the freeze.
const DIR = 'docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/'
// Out of the 2025–2027 P4 domain: the adapter must degrade to this baseline there, even with the flag ON.
const OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']
const DATES = [...fixture.days.map((d) => d.date), ...OUTSIDE]
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

function activityRows() {
  const out = ['date\tactivity\tscore\tstatus\thard_warning\tsha256']
  for (const date of DATES)
    for (const r of getAlmanac(date as never).activityRecommendations)
      out.push([date, r.activityId, r.score, r.status, r.hardWarning, sha(r)].join('\t'))
  return out.join('\n') + '\n'
}

function eventRows() {
  const out = ['date\tevent\thour\tscore\tclassification\tsha256']
  for (const date of DATES)
    for (const [id] of EVENT_OPTIONS)
      for (const hour of [undefined, 9]) {
        const {
          datasetVersion: _d,
          engineVersion: _e,
          ...e
        } = evaluateEventDay(date, id, hour === undefined ? {} : { hour })
        out.push([date, id, hour ?? '', e.score ?? '', e.classification, sha(e)].join('\t'))
      }
  return out.join('\n') + '\n'
}

describe('roadmap 8 flag-OFF baseline (measured, frozen before the adapter)', () => {
  it('ships with the flag OFF', () => {
    expect(manifest.policies.xiejiVol10BalancingEnabled).toBe(false)
  })

  it('activity and event outputs equal the frozen baseline', () => {
    const files = { 'activities.tsv': activityRows(), 'events.tsv': eventRows() }
    if (process.env.P4_ADAPTER_BASELINE_WRITE === '1') {
      mkdirSync(DIR, { recursive: true })
      for (const [name, text] of Object.entries(files)) writeFileSync(DIR + name, text)
    }
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      files: { path: string; sha256: string }[]
    }
    expect(lock.files).toHaveLength(2)
    for (const f of lock.files)
      expect(createHash('sha256').update(readFileSync(f.path)).digest('hex'), f.path).toBe(f.sha256)
    for (const [name, text] of Object.entries(files)) {
      const want = readFileSync(DIR + name, 'utf8').split('\n')
      const got = text.split('\n')
      const diff = got.filter((l, i) => l !== want[i]).slice(0, 10)
      expect(diff.join('\n'), name).toBe('')
      expect(got.length, name).toBe(want.length)
    }
  }, 900_000)
})
