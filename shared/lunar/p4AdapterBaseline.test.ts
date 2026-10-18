import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { activityRows, BASELINE_DIR as DIR, eventRows } from './p4AdapterBaselineRows'

// Roadmap 8: measured production baseline, frozen before any adapter code (runtime-equal to f00dd5c).
// With `xiejiVol10BalancingEnabled` OFF every row here must stay byte-equal. Default manifest, no
// override, no personal input. Version stamps are left out so a version bump alone is not a diff.
// P4_ADAPTER_BASELINE_WRITE=1 rewrites the files; the lock is written once, by hand, at the freeze.

describe('roadmap 8 flag-OFF baseline (measured, frozen before the adapter)', () => {
  it('ships with the flag OFF', () => {
    expect(manifest.policies.xiejiVol10BalancingEnabled).toBe(false)
  })

  it('activity and event outputs equal the frozen baseline', () => {
    const files = {
      'activities.tsv': activityRows(getAlmanac),
      'events.tsv': eventRows(evaluateEventDay),
    }
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
