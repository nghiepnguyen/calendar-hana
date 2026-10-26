/** Test-only: the Q4-REST Stage 3 rollback (docs/audits/p4-q4-rest-stage3-migration.md), for vi.mock / vi.doMock
 * factories at the path production imports (p4Puzhu06.ts): puzhu:06 authority v4 = shipped before R-JK / R-WX /
 * R-XH / R-F1Y. v4 carries no QL_NARROW class and no yiComposition, so the v5 code paths stay inert under it. */
import puzhu06V4Data from '../almanac-data/p4b-puzhu06-v4.json'
import { assertPuzhu06Authority, PUZHU06_V4_ID } from './f1R2Rollback'

export const puzhu06V4 = () => ({ default: puzhu06V4Data })

/** Run from vi.hoisted after the pin: drop the provider graph, reload it under the pin, check v4 is loaded. */
export async function reloadUnderQ4RestPin() {
  const { vi } = await import('vitest')
  vi.resetModules()
  await import('./p4AlmanacHeadings')
  await assertPuzhu06Authority(PUZHU06_V4_ID)
}
