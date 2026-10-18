import type { RuleActivityMapping } from './ruleActivityMapping'

export const ENGINE_VERSION = '1.2.0'
export type EvidenceStatus =
  'applied' | 'informational' | 'conflict' | 'no_evidence' | 'not_audited'
export interface Evidence {
  source: 'truc' | 'mansion' | 'good_god' | 'bad_god' | 'override' | 'personal'
  ruleId: string
  activityId: string
  scope: string
  polarity: 'positive' | 'negative' | 'neutral'
  sourcePhrase: string
  sourceRef: string
  /** Original source excerpt and explicit operands, when a content authority supplies them. */
  sourceQuote?: string
  /** Product interpretation review, independent from source confidence and scoring. */
  activityMapping?: RuleActivityMapping & { authorityId: string; clauseId: string }
  conditions?: readonly { operand: string; equals: number }[]
  exceptions?: readonly string[]
  confidence: 'high' | 'medium' | 'low'
  status: EvidenceStatus
  scoreDelta: number
  rawDelta: number
  hardWarning?: boolean
  label: string
  /** 協紀 卷十 verdict that adjusted this row (only with `xiejiVol10Scoring` on). */
  classical?: { version: string; entry: string; verdict: string; via?: string; quote: string }
  /** Roadmap 8, only with `xiejiVol10BalancingEnabled` ON: delta after resolution, before the cap. */
  preCapDelta?: number
  evidenceOrigin?: 'canonical' | 'product_policy'
  policyId?: string
  sourceClauseId?: string
  balancingEligible?: boolean
}
