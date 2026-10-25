/** Test-only: the G1 glyph Stage 2 rollback configuration (docs/audits/p4-g1-glyph-stage2-migration.md), for
 * vi.mock / vi.doMock factories. Rollback = 劫煞 authority v2 in place of v3, mocked at the path production
 * imports (xiejiVol10JieshaAuthority.ts); that is shipped f3c68c6 production. */
import authorityV2 from '../almanac-data/xieji-vol10-jiesha-authority-v2.json'

export const AUTHORITY_PATH = '../almanac-data/xieji-vol10-jiesha-authority-v3.json'
export const V1_ID = 'xieji-vol10-jiesha-faithful-v1'
export const V2_ID = 'xieji-vol10-jiesha-faithful-v2'
export const V3_ID = 'xieji-vol10-jiesha-faithful-v3'

export const jieshaAuthorityV2 = () => ({ default: authorityV2 })

/** A pinned graph must load the authority it claims: a mock on a path production no longer imports would
 * otherwise be a silent no-op and the "rollback" would run on the shipped authority. */
export async function assertJieshaAuthority(id: string) {
  const loaded = (await import('./xiejiVol10JieshaAuthority')).VOL10_JIESHA_AUTHORITY_ID
  if (loaded !== id) throw new Error(`pinned graph loaded ${loaded}, expected ${id}`)
}
