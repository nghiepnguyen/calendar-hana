import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
// Production after roadmap 10 loads the provider before the first almanac; rollback flips only the flag.
import './p4AlmanacHeadings'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { activityRows, BASELINE_DIR, eventRows } from './p4AdapterBaselineRows'
import { p4BalancingReady } from './p4ScoreAdapter'

// Roadmap 10 ships the flag ON; this file pins it OFF = the one-line rollback PR.
vi.mock('../almanac-data/manifest.json', async (importOriginal) => {
  const real = ((await importOriginal()) as { default: { policies: object } }).default
  return {
    default: {
      ...real,
      policies: {
        ...real.policies,
        xiejiVol10BalancingEnabled: false,
        tiangouYinNoYi: false,
        satChuNgocHapStars: false,
      },
    },
  }
})
const shipped = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
  policies: { xiejiVol10BalancingEnabled: boolean }
}

// Roadmap 9 FR-08 (owner §6.10.8): the rollback state is the real manifest (flag OFF) with the P4
// heading provider loaded. It must give baseline v1 byte-equal, activities and events, all 1098 dates.
describe('roadmap 9 rollback: flag OFF with the provider loaded = baseline v1', () => {
  it('the provider is loaded and the rollback flag is OFF (shipped ON since roadmap 10)', () => {
    expect(p4BalancingReady('2026-01-01')).toBe(true)
    expect(manifest.policies.xiejiVol10BalancingEnabled).toBe(false)
    expect(shipped.policies.xiejiVol10BalancingEnabled).toBe(true)
  })

  it('activity and event outputs equal the frozen baseline', () => {
    const files = {
      'activities.tsv': activityRows(getAlmanac),
      'events.tsv': eventRows(evaluateEventDay),
    }
    for (const [name, text] of Object.entries(files)) {
      const want = readFileSync(BASELINE_DIR + name, 'utf8').split('\n')
      const got = text.split('\n')
      expect(
        got
          .filter((l, i) => l !== want[i])
          .slice(0, 10)
          .join('\n'),
        name,
      ).toBe('')
      expect(got.length, name).toBe(want.length)
    }
  }, 900_000)
})
