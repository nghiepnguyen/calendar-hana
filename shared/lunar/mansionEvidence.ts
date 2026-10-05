import patterns from '../almanac-data/mansion-patterns.json'
import type { Evidence } from './evidence'
export type MansionText = { name: string; shouldDo: string; shouldAvoid: string }

/** Longest phrases reserve their span; a boat or grave repair cannot also match its parent activity. */
export function extractMansionEvidence(input: MansionText): Evidence[] {
  const rows: Evidence[] = []
  for (const [text, polarity] of [
    [input.shouldDo, 'positive'],
    [input.shouldAvoid, 'negative'],
  ] as const) {
    const original = text.normalize('NFC')
    const normalized = original.toLowerCase()
    const spans: [number, number][] = []
    for (const pattern of [...patterns.items].sort((a, b) => b.phrase.length - a.phrase.length)) {
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${pattern.phrase}(?![\\p{L}\\p{N}])`, 'gu')
      for (const match of normalized.matchAll(regex)) {
        const start = match.index,
          end = start + match[0].length
        if (spans.some(([a, b]) => start < b && end > a)) continue
        spans.push([start, end])
        // These two entries have no reviewed activity evidence in the supplied specification.
        if (pattern.activityId && ['Chủy', 'Liễu'].includes(input.name)) continue
        const general = !pattern.activityId
        const resolvedPolarity =
          pattern.scope === 'general_negative'
            ? 'negative'
            : pattern.scope === 'general_positive'
              ? 'positive'
              : pattern.scope === 'general_no_taboos'
                ? 'neutral'
                : polarity
        rows.push({
          source: 'mansion',
          ruleId: `${input.name}:${pattern.activityId || pattern.scope}:${resolvedPolarity}:${start}`,
          activityId: pattern.activityId,
          scope: pattern.scope,
          polarity: resolvedPolarity,
          sourcePhrase: original.slice(start, end),
          sourceRef: `shared/lunar/mansions.ts#${input.name}`,
          confidence: 'high',
          status: 'informational',
          scoreDelta: 0,
          rawDelta: general ? 0 : polarity === 'positive' ? 15 : -25,
          label: `Tú ${input.name}`,
        })
      }
    }
  }
  const unique = rows.filter(
    (row, i) =>
      rows.findIndex(
        (other) =>
          other.activityId === row.activityId &&
          other.scope === row.scope &&
          other.polarity === row.polarity,
      ) === i,
  )
  for (const row of unique) {
    if (
      row.activityId &&
      unique.some(
        (other) =>
          other.activityId === row.activityId &&
          other.scope === row.scope &&
          other.polarity !== row.polarity,
      )
    )
      row.status = 'conflict'
  }
  return unique
}
