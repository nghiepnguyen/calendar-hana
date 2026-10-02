export type SaoHanGender = 'male' | 'female'

export interface SaoHanResult {
  readonly nominalAge: number
  readonly sao: string
  readonly han: string
  readonly saoRemainder: number
  readonly hanRemainder: number
}

const SAO_MAP: Readonly<Record<number, Readonly<Record<SaoHanGender, string>>>> = {
  1: { male: 'La Hầu', female: 'Kế Đô' },
  2: { male: 'Thổ Tú', female: 'Vân Hớn' },
  3: { male: 'Thủy Diệu', female: 'Mộc Đức' },
  4: { male: 'Thái Bạch', female: 'Thái Âm' },
  5: { male: 'Thái Dương', female: 'Thổ Tú' },
  6: { male: 'Vân Hớn', female: 'La Hầu' },
  7: { male: 'Kế Đô', female: 'Thái Dương' },
  8: { male: 'Thái Âm', female: 'Thái Bạch' },
  0: { male: 'Mộc Đức', female: 'Thủy Diệu' },
}

const HAN_MAP: Readonly<Record<number, Readonly<Record<SaoHanGender, string>>>> = {
  1: { male: 'Huỳnh Tuyền', female: 'Thiên La' },
  2: { male: 'Tam Kheo', female: 'Ngũ Mộ' },
  3: { male: 'Ngũ Mộ', female: 'Tam Kheo' },
  4: { male: 'Thiên La', female: 'Huỳnh Tuyền' },
  5: { male: 'Địa Võng', female: 'Địa Võng' },
  6: { male: 'Thiên Tinh', female: 'Tán Tận' },
  7: { male: 'Tán Tận', female: 'Thiên Tinh' },
  0: { male: 'Toán Tận', female: 'Toán Tận' },
}

export function calculateSaoHan(nominalAge: number, gender: SaoHanGender): SaoHanResult {
  if (!Number.isInteger(nominalAge) || nominalAge < 1)
    throw new RangeError('Tuổi mụ phải là số nguyên dương')
  const saoRemainder = nominalAge % 9
  const hanRemainder = nominalAge % 8
  return {
    nominalAge,
    sao: SAO_MAP[saoRemainder][gender],
    han: HAN_MAP[hanRemainder][gender],
    saoRemainder,
    hanRemainder,
  }
}
