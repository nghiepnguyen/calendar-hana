/** Test-only: the P21 Stage 4 rollback (docs/audits/p21-stage4-partial-migration.md), for vi.mock / vi.doMock
 * factories at the path production imports (p4OwnerRules.ts): p4-puzhu21-v1 with no eligible context = puzhu:21
 * heading-wide everywhere (N-A), i.e. production as shipped before Stage 4. The factory must not import the mocked
 * path itself (that would wait on its own mock), so the rollback record is written out here; production reads
 * eligibleContexts only. */
export const PUZHU21_PATH = '../almanac-data/p4-puzhu21-v1.json'

export const puzhu21Off = () => ({
  default: {
    version: 'p4-puzhu21-v1:rollback',
    rule: 'puzhu:21',
    eligibleContexts: [] as string[],
  },
})

/** A pinned graph must run N-A: a mock on a path production no longer imports would be a silent no-op. */
export async function assertPuzhu21Off() {
  const { resolveP4OwnerRulesContext } = await import('./p4OwnerRules')
  const state = resolveP4OwnerRulesContext('亥', '丁酉')['立券交易']!.state
  if (state !== 'neither_recorded')
    throw new Error(`pinned graph runs puzhu:21 scoped (亥-丁酉 ${state})`)
}

/** src/test/setup.ts loads the P4 provider before a test file's vi.mock applies. Run from vi.hoisted after the
 * pin: drop that graph, reload the provider under it and check puzhu:21 is heading-wide. */
export async function reloadUnderP21Pin() {
  const { vi } = await import('vitest')
  vi.resetModules()
  await import('./p4AlmanacHeadings')
  await assertPuzhu21Off()
}
