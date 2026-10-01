import type { ApplicationStatus, RuleScope, VerificationStatus } from '../rules'

export type AnnualPurpose =
  | 'general'
  | 'wedding'
  | 'construction'
  | 'business'
  | 'carPurchase'
  | 'housePurchase'
  | 'repair'
  | 'moveIn'
  | 'ritual'
export type AnnualRole = 'self' | 'bride' | 'owner' | 'principal' | 'other' | 'unspecified'
export interface AnnualInput {
  readonly viewDate: string
  readonly birthDate?: string
  readonly purpose: AnnualPurpose
  readonly role: AnnualRole
}

export type AnnualReasonCode =
  | 'contextReady'
  | 'calculated'
  | 'missingViewDate'
  | 'invalidViewDate'
  | 'missingBirthDate'
  | 'invalidBirthDate'
  | 'dateOutOfRange'
  | 'beforeBirth'
  | 'unknownContext'
  | 'purposeUnsupported'
  | 'roleMismatch'
  | 'purposeExcluded'
  | 'targetRoleRequired'
  | 'ageOutOfRange'
  | 'unverifiedRule'
  | 'missingRule'
  | 'rejectedRule'
  | 'scopeMismatch'

export interface ReadyAnnualContext {
  readonly status: 'applies'
  readonly reasonCode: 'contextReady'
  readonly reason: string
  readonly birthLunarYear: number
  readonly viewLunarYear: number
  readonly nominalAge: number
  readonly birthYearChi: number
  readonly viewYearChi: number
}
export type AnnualContext =
  | ReadyAnnualContext
  | {
      readonly status: Exclude<ApplicationStatus, 'applies'>
      readonly reasonCode: AnnualReasonCode
      readonly reason: string
    }

export interface KimLauValue {
  readonly hit: boolean
  readonly kind: 'than' | 'the' | 'tu' | 'suc' | null
  readonly remainder: number
}
export interface HoangOcValue {
  readonly hit: boolean
  readonly palace: 1 | 2 | 3 | 4 | 5 | 6
  readonly palaceId: 'nhatCat' | 'nhiNghi' | 'tamDiaSat' | 'tuTanTai' | 'nguThoTu' | 'lucHoangOc'
  readonly decade: number
  readonly units: number
}
export interface TamTaiValue {
  readonly hit: boolean
  readonly stage: 1 | 2 | 3 | null
}
export interface AnnualValueMap {
  'annual.kim-lau': KimLauValue
  'annual.hoang-oc': HoangOcValue
  'annual.tam-tai': TamTaiValue
}
export type AnnualRuleId = keyof AnnualValueMap
export interface AnnualRuleEvidence {
  readonly id: string
  readonly version: string | null
  readonly scope: RuleScope | null
  readonly verificationStatus: VerificationStatus | null
  readonly sourceIds: readonly string[]
  readonly reason: string | null
}
interface AnnualMetadata<K extends AnnualRuleId> {
  readonly ruleId: K
  readonly ruleVersion: string | null
  readonly scope: 'annual'
  readonly verificationStatus: VerificationStatus | null
  readonly sourceIds: readonly string[]
  readonly requiredRules: readonly AnnualRuleEvidence[]
  readonly operands: Readonly<Record<string, number>>
  readonly reason: string
}
export type AnnualResultFor<K extends AnnualRuleId> = AnnualMetadata<K> &
  (
    | {
        readonly status: 'applies'
        readonly reasonCode: 'calculated'
        readonly value: AnnualValueMap[K]
      }
    | {
        readonly status: Exclude<ApplicationStatus, 'applies'>
        readonly reasonCode: AnnualReasonCode
        readonly value?: never
      }
  )
export type AnnualRuleResult = { [K in AnnualRuleId]: AnnualResultFor<K> }[AnnualRuleId]
export interface AnnualAssessment {
  readonly specVersion: '1.0.0'
  readonly purpose: AnnualPurpose | null
  readonly role: AnnualRole | null
  readonly context: AnnualContext
  readonly results: readonly AnnualRuleResult[]
}
