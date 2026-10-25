import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { getAlmanac } from './almanac'
import { evaluateEventDay } from './eventEvaluation'
import { resolveEventActivities } from './eventMapping'
import { activityRows, BASELINE_DIR as V1, eventRows } from './p4AdapterBaselineRows'

// G2 Stage 2 successor of baseline v1: the same flag-OFF configuration and dates (p4AdapterBaseline.test.ts,
// now pinned to the pre-G2 rollback), measured on the shipped G2 graph. Baseline v1 rows may differ only
// where G2 reaches: contract / transaction activity rows, and events whose profile holds one of them.
// P4_ADAPTER_BASELINE_V2_WRITE=1 rewrites the TSVs and lock.
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

const DIR = 'docs/audits/sources/p4-vol10/p4-adapter-baseline-v2/'
const G2 = ['contract', 'transaction']
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')

describe('flag-OFF baseline v2 (G2 Stage 2 successor of baseline v1)', () => {
  it('activity and event outputs equal baseline v2; v1 differs only where G2 reaches', () => {
    const files = {
      'activities.tsv': activityRows(getAlmanac),
      'events.tsv': eventRows(evaluateEventDay),
    }
    const diff = (name: string) => {
      const a = readFileSync(V1 + name, 'utf8')
        .trimEnd()
        .split('\n')
      const b = files[name as keyof typeof files].trimEnd().split('\n')
      expect(b.length, name).toBe(a.length)
      return b.filter((l, i) => l !== a[i]).map((l) => l.split('\t'))
    }
    const acts = diff('activities.tsv')
    const events = diff('events.tsv')
    expect(acts.filter((r) => !G2.includes(r[1]!))).toEqual([])
    expect(
      events.filter((r) => !resolveEventActivities(r[1]!).some((a) => G2.includes(a))),
    ).toEqual([])
    const summary = {
      activityRowsChanged: acts.length,
      activityDatesChanged: new Set(acts.map((r) => r[0])).size,
      eventRowsChanged: events.length,
      eventsChanged: Object.fromEntries(
        [...new Set(events.map((r) => r[1]!))]
          .sort()
          .map((e) => [e, events.filter((r) => r[1] === e).length]),
      ),
    }
    if (process.env.P4_ADAPTER_BASELINE_V2_WRITE === '1') {
      mkdirSync(DIR, { recursive: true })
      for (const [name, text] of Object.entries(files)) writeFileSync(DIR + name, text)
      const lock = {
        version: 'p4-adapter-baseline-lock-v2',
        scope: 'MEASURED_BASELINE_NOT_GOLDEN',
        supersedes:
          'p4-adapter-baseline-lock-v1 as forward evidence; v1 kept unchanged as pre-G2 rollback evidence',
        migration:
          'G2 Stage 2 (docs/audits/p4-g2-stage2-migration.md): 卷十 headingAliases 立劵交易 → [立券交易] + 劫煞 authority v2',
        flag: 'same as v1: xiejiVol10BalancingEnabled OFF, tiangouYinNoYi / satChuNgocHapStars OFF, legacy-cancel-both; provider loaded (src/test/setup.ts)',
        rows: 'same as v1 (p4AdapterBaselineRows.ts)',
        regenerate:
          'P4_ADAPTER_BASELINE_V2_WRITE=1 npx vitest run shared/lunar/p4AdapterBaselineV2.test.ts',
        diffFromV1: summary,
        files: Object.keys(files).map((n) => ({
          path: DIR + n,
          sha256: sha(files[n as keyof typeof files]),
        })),
      }
      writeFileSync(DIR + 'lock.json', JSON.stringify(lock, null, 1) + '\n')
    }
    const lock = JSON.parse(readFileSync(DIR + 'lock.json', 'utf8')) as {
      diffFromV1: typeof summary
      files: { path: string; sha256: string }[]
    }
    expect(lock.diffFromV1).toEqual(summary)
    for (const f of lock.files) expect(sha(readFileSync(f.path)), f.path).toBe(f.sha256)
    for (const [name, text] of Object.entries(files))
      expect(sha(text), name).toBe(sha(readFileSync(DIR + name)))
  }, 900_000)
})
