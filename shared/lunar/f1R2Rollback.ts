/** Test-only: the F1 Stage 3 rollback (docs/audits/p4-f1-wuli-lijuan-stage3-migration.md), for vi.mock /
 * vi.doMock factories at the path production imports (p4Puzhu06.ts): puzhu:06 authority v3 = shipped before R2. */
import puzhu06V3Data from '../almanac-data/p4b-puzhu06-v3.json'

export const PUZHU06_PATH = '../almanac-data/p4b-puzhu06-v4.json'
export const PUZHU06_V3_ID = 'p4b-puzhu06-v3'
export const PUZHU06_V4_ID = 'p4b-puzhu06-v4'

export const puzhu06V3 = () => ({ default: puzhu06V3Data })

/** A pinned graph must load the authority it claims; a mock on a path production no longer imports would be a
 * silent no-op and the "rollback" would run on the shipped authority. */
export async function assertPuzhu06Authority(id: string) {
  const loaded = (await import('./p4Puzhu06')).P4_PUZHU06_AUTHORITY_ID
  if (loaded !== id) throw new Error(`pinned graph loaded ${loaded}, expected ${id}`)
}

/** src/test/setup.ts loads the P4 provider before a test file's vi.mock applies. Run from vi.hoisted after the
 * pin: drop that graph, reload the provider under it and check the pinned authority is the one loaded. */
export async function reloadUnderR2Pin() {
  const { vi } = await import('vitest')
  vi.resetModules()
  await import('./p4AlmanacHeadings')
  await assertPuzhu06Authority(PUZHU06_V3_ID)
}
