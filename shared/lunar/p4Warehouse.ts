// P5 task 4.2 red stub: replaced by the implementation in 4.3.
type Presence = Readonly<Record<string, boolean | undefined>>
type Base = { base: string; r10?: boolean; r11?: boolean; d: string }
type Result = { heading: string; bases: Base[] }
export const P5_WAREHOUSE_AUTHORITY = { path: '', sha256: '' }
export const P5_WAREHOUSE_GODS: readonly string[] = []
export function resolveP4Warehouse(_p: Presence): Result {
  throw new Error('P5 warehouse not implemented')
}
export function resolveP4WarehouseDay(
  _m: string,
  _p: string,
  _o?: object,
): ReturnType<typeof import('./p4YiDayComposition').resolveP4YiDay> & {
  warehouse: Result & { presence: Presence; unknownOperands: string[] }
} {
  throw new Error('P5 warehouse not implemented')
}
