import type { CanChi } from '../lunar/canChi'

export type BirthTimePrecision = 'exact' | 'estimated' | 'unknown'
export type BirthTimezoneId = 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok'
export type BirthTimezoneSource = 'bundledMapping' | 'userConfirmed'
export type CoordinateSource = 'bundledGazetteer' | 'userSelected' | 'userEntered'
export type ZiPolicy = 'splitZi' | 'dayStartsAt23'

export interface BirthPlace {
  countryCode: 'VN'
  subdivisionCode: string | null
  label: string
  latitude: number
  longitude: number
  coordinateSource: CoordinateSource
  coordinateAccuracyKm: number | null
}

export interface BaziProfileInput {
  birthDate?: string | null
  birthTime?: string | null
  birthTimePrecision?: BirthTimePrecision | null
  birthTimeUncertaintyMinutes?: number | null
  birthPlace?: BirthPlace | null
  birthTimezoneId?: BirthTimezoneId | null
  birthTimezoneSource?: BirthTimezoneSource | null
  birthConfirmedOffsetMinutes?: number | null
  birthZiPolicy?: ZiPolicy | null
}

export interface Pillars {
  year: CanChi
  month: CanChi
  day: CanChi
  hour: CanChi
}

export const BAZI_VERSIONS = Object.freeze({
  rules: '1.1.0',
  astronomy: '2.1.19',
  tzdb: '2026d',
})
