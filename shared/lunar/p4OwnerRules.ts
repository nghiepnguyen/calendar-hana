import { resolveP4Puzhu06Day } from './p4Puzhu06'
import { resolveP4WarehouseDay } from './p4Warehouse'
import type { P4YiDayOperands } from './p4YiDayComposition'

/** Roadmap 7b, audit-only: the P4 resolution layer with the owner rules of the accepted full Golden v2
 * (H1-B/F5, E3, H2-A, F1, E1, E5, 德作建論 (i)). Not imported by the production pipeline. */
export type P4OwnerRow = {
  state: string
  ji: boolean | undefined
  protectedJi: boolean | undefined
}
export type P4OwnerDay = Record<string, P4OwnerRow>

/** Current engine stitching (registered in the Golden v2 lock): P4-C → puzhu:06 (5 headings) → P5 修倉庫. */
export function stitchP4EngineDay(
  month: string,
  pillar: string,
  operands: P4YiDayOperands = {},
): P4OwnerDay {
  const day = resolveP4Puzhu06Day(month, pillar, operands)
  const wh = resolveP4WarehouseDay(month, pillar, operands)
  const out: P4OwnerDay = {}
  for (const [h, d] of Object.entries(day.headings))
    out[h] = { state: d.state, ji: d.ji, protectedJi: d.protectedJi }
  const w = wh.headings['修倉庫']!
  out['修倉庫'] = { state: w.state, ji: w.ji, protectedJi: w.protectedJi }
  return out
}

/** Dated day (all date operands given). Stub until task 3: the engine stitching. */
export function resolveP4OwnerRulesDay(
  month: string,
  pillar: string,
  operands: P4YiDayOperands = {},
): P4OwnerDay {
  return stitchP4EngineDay(month, pillar, operands)
}

/** Context (no date operands). Stub until task 3: the engine stitching without operands. */
export function resolveP4OwnerRulesContext(month: string, pillar: string): P4OwnerDay {
  return stitchP4EngineDay(month, pillar)
}
