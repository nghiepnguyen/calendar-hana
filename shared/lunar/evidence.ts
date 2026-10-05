export const ENGINE_VERSION = '1.1.0'
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
  confidence: 'high' | 'medium' | 'low'
  status: EvidenceStatus
  scoreDelta: number
  rawDelta: number
  hardWarning?: boolean
  label: string
}
