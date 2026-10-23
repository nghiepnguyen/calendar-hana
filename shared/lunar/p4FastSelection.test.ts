import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Guards the file selection of vitest.p4fast.config.ts (npm run ci:p4:fast, a dev loop, not a merge gate).

// P4-related tests the fast loop deliberately skips. Each still runs in `npm test` (ci:full).
const EXCLUDED: Record<string, string> = {
  // Frozen puzhu17 freeze derivation (~600 s); pinned by puzhu17-bujiang-v1/lock.json, which the
  // chou-bingyin-yuede-v1 candidate-final.json pins in turn. The fast p4Puzhu17AuditLock checks the artifacts.
  'shared/lunar/p4Puzhu17Audit.test.ts': 'frozen audit',
}
// Import a P4 module but are not P4 tests.
const OUTSIDE: Record<string, string> = {
  // P1 Golden; loads p4AlmanacHeadings only so the almanac has its headings registered.
  'shared/lunar/p1TiangouYin.test.ts': 'P1',
  // P1 migration; only reuses the row helpers of p4AdapterBaselineRows.
  'shared/lunar/p1TiangouYinMigration.test.ts': 'P1',
}

const P4_NAME =
  /^shared\/lunar\/(p4|xiejiVol10|yuePo)\w*\.test\.ts$|^src\/(.+\/)?p4\w*\.test\.tsx?$/
const P4_IMPORT = /['"][^'"]*\/(p4|xiejiVol10|yuePo)\w*['"]/

const ROOT = process.cwd()

function listFiles(config: string): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'p4fast-'))
  try {
    const out = join(dir, 'list.json')
    execFileSync(
      process.execPath,
      [
        'node_modules/vitest/vitest.mjs',
        'list',
        '--filesOnly',
        `--json=${out}`,
        '--config',
        config,
      ],
      {
        cwd: ROOT,
        stdio: 'ignore',
      },
    )
    return (JSON.parse(readFileSync(out, 'utf8')) as { file: string }[])
      .map((f) => relative(ROOT, f.file))
      .sort()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('ci:p4:fast selection', () => {
  const all = listFiles('vitest.config.ts')
  const fast = listFiles('vitest.p4fast.config.ts')
  const p4Related = all.filter(
    (f) => P4_NAME.test(f) || P4_IMPORT.test(readFileSync(join(ROOT, f), 'utf8')),
  )

  it('never runs a file that `npm test` does not, so it is never the only gate', () => {
    expect(fast.filter((f) => !all.includes(f))).toEqual([])
  })

  it('selects only P4-related tests', () => {
    expect(fast.filter((f) => !p4Related.includes(f))).toEqual([])
  })

  it('selects every P4-related test except the documented exclusions', () => {
    const missing = p4Related.filter((f) => !fast.includes(f)).sort()
    expect(missing).toEqual([...Object.keys(EXCLUDED), ...Object.keys(OUTSIDE)].sort())
  })

  it('has no stale exclusion entries', () => {
    for (const f of [...Object.keys(EXCLUDED), ...Object.keys(OUTSIDE)]) expect(all).toContain(f)
  })
})
