import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../almanac-data/manifest.json'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { activityRows, BASELINE_DIR as DIR, eventRows } from './p4AdapterBaselineRows'

// Frozen before G2 Stage 2 (立劵交易 alias + 劫煞 authority v2): pinned to the pre-G2 rollback (g2Rollback.ts).
vi.mock('../almanac-data/xiejibianfangshu-vol10-yiji.json', async (load) =>
  (await import('./g2Rollback')).withoutG2Alias(await load()),
)
vi.mock('../almanac-data/xieji-vol10-jiesha-authority-v3.json', async () =>
  (await import('./g2Rollback')).jieshaAuthorityV1(),
)
await vi.hoisted(async () => (await import('./g2Rollback')).reloadUnderG2Pins())

// Roadmap 10 ships the flag ON; this file pins it OFF (the flag-OFF / rollback state).
// Frozen before the 卷十 劫煞 faithful-v1 migration (2026-10-22): pinned to legacy-cancel-both.
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
        xiejiVol10JieshaPolicy: 'legacy-cancel-both',
      },
    },
  }
})
const shipped = JSON.parse(readFileSync('shared/almanac-data/manifest.json', 'utf8')) as {
  policies: { xiejiVol10BalancingEnabled: boolean }
}

// Roadmap 8: measured production baseline, frozen before any adapter code (runtime-equal to f00dd5c).
// With `xiejiVol10BalancingEnabled` OFF every row here must stay byte-equal. Default manifest, no
// override, no personal input. Version stamps are left out so a version bump alone is not a diff.
// P4_ADAPTER_BASELINE_WRITE=1 rewrites the files; the lock is written once, by hand, at the freeze.

describe('roadmap 8 flag-OFF baseline (measured, frozen before the adapter)', () => {
  it('runs with the flag OFF (shipped ON since roadmap 10)', () => {
    expect(manifest.policies.xiejiVol10BalancingEnabled).toBe(false)
    expect(shipped.policies.xiejiVol10BalancingEnabled).toBe(true)
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
