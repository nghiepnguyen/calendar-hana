/** Test-only: the G2 Stage 2 rollback configuration (docs/audits/p4-g2-stage2-migration.md), for vi.mock /
 * vi.doMock factories. Rollback = the 卷十 headingAliases entry 立劵交易 removed + 劫煞 authority v1 in place
 * of v2; that is pre-G2 production. Tests that pin pre-G2 evidence (Score Golden v3, baseline v1, …) use it. */
import authorityV1 from '../almanac-data/xieji-vol10-jiesha-authority-v1.json'

export const G2_ALIAS = '立劵交易'

export function withoutG2Alias(mod: unknown) {
  const real = (mod as { default: { headingAliases: Record<string, string[]> } }).default
  const { [G2_ALIAS]: alias, ...headingAliases } = real.headingAliases
  if (!alias) throw new Error('G2 alias missing: nothing to roll back')
  return { default: { ...real, headingAliases } }
}

export const jieshaAuthorityV1 = () => ({ default: authorityV1 })

/** src/test/setup.ts loads the P4 provider, whose graph imports the 卷十 resolver before a test file's
 * vi.mock applies. Run from vi.hoisted after the pins: drop that graph and reload the provider under them. */
export async function reloadUnderG2Pins() {
  const { vi } = await import('vitest')
  vi.resetModules()
  await import('./p4AlmanacHeadings')
  await (await import('./g1GlyphRollback')).assertJieshaAuthority('xieji-vol10-jiesha-faithful-v1')
}
