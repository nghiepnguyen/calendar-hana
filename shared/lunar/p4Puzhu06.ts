// puzhu:06 task 4.2 stub: red tests run against this before the implementation (task 4.3).
export type P4Puzhu06Source = Readonly<Record<string, unknown>>
export type P4Puzhu06Row = {
  heading: string
  month: string
  triggers: readonly string[]
  day_rule: string
  yi: 'true' | 'false' | 'unknown'
  ji: boolean
  protected: boolean
  state: string
  sources: readonly P4Puzhu06Source[]
}

export function decideP4Puzhu06(_row: P4Puzhu06Row): {
  action: string
  classes: string[]
  ji: boolean
  state: string
} {
  throw new Error('not implemented')
}

export function resolveP4Puzhu06Day(
  _month: string,
  _pillar: string,
  _operands: object = {},
): never {
  throw new Error('not implemented')
}
