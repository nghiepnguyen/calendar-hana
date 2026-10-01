import type { KimLauValue } from './types'

/** Arithmetic classification only; application/readiness belong to the evaluator. */
export function calculateKimLau(nominalAge: number): KimLauValue {
  if (!Number.isInteger(nominalAge) || nominalAge < 1 || nominalAge > 202) {
    throw new RangeError('Kim Lâu requires an integer nominal age within 1–202')
  }
  const remainder = nominalAge % 9
  const kinds: Readonly<Partial<Record<number, NonNullable<KimLauValue['kind']>>>> = {
    1: 'than',
    3: 'the',
    6: 'tu',
    8: 'suc',
  }
  const kind = kinds[remainder] ?? null
  return { hit: kind !== null, kind, remainder }
}
