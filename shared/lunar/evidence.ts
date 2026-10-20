import type { RuleActivityMapping } from './ruleActivityMapping'

export const ENGINE_VERSION = '1.2.0'
/** How reliably a source excerpt was read, separate from how its term was interpreted.
 * Positions are 1-based character indices into the excerpt. There is no global default: a dataset
 * may declare one for its own excerpts (e.g. mansion content `source.evidenceConfidence`). */
export interface EvidenceConfidence {
  semantic: 'VERIFIED' | 'PROBABLE' | 'UNCERTAIN'
  transcription: 'EXACT' | 'NORMALIZED' | 'IDENTIFIED' | 'PARTIAL' | 'UNCERTAIN'
  basis: 'scan_read' | 'digital_transcription'
  /** PARTIAL: positions shown as □ because the scan is unreadable there. */
  uncertainPositions?: number[]
  /** NORMALIZED: printed character on the scan → character stored in the excerpt. */
  normalizations?: { position: number; sourceCharacter: string; storedCharacter: string }[]
}
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
  /** Only when the excerpt departs from its dataset default (sparse). */
  evidenceConfidence?: EvidenceConfidence
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
