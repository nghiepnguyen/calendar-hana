import data from '../almanac-data/mansion-content-yuxia-1880-v1.json'
import type { Evidence } from './evidence'
import { resolveMansionActivityMapping } from './ruleActivityMapping'

export const MANSION_CONTENT_AUTHORITY_ID = 'mansion-content-yuxia-1880-v1'
type MansionClause = Omit<(typeof data.items)[number]['clauses'][number], 'exceptions'> & {
  exceptions: string[]
}
export type MansionContent = Omit<(typeof data.items)[number], 'clauses'> & {
  clauses: MansionClause[]
  authorityId: string
  version: string
  source: typeof data.source
}

/** Content belongs to one edition/tradition; it does not redefine mansion identity or scoring. */
export function getMansionContent(index: number): MansionContent {
  if (!Number.isInteger(index) || index < 0 || index >= 28)
    throw new RangeError('Invalid mansion index')
  const row = data.items[index]
  if (row.index !== index) throw new Error('Mansion content row/index mismatch')
  return structuredClone({
    ...row,
    authorityId: data.authorityId,
    version: data.version,
    source: data.source,
  })
}

/** Operative excerpts only. General blessings and unmentioned activities never become permissions. */
export function getMansionContentEvidence(content: MansionContent): Evidence[] {
  if (
    content.authorityId !== MANSION_CONTENT_AUTHORITY_ID ||
    content.reviewStatus !== 'SOURCE_LOCKED'
  )
    throw new Error('Unreviewed mansion content authority')
  return content.clauses.map((clause) => {
    if (
      clause.conditions.length !== 1 ||
      clause.conditions[0].operand !== 'MANSION_INDEX' ||
      clause.conditions[0].equals !== content.index
    )
      throw new Error('Mansion content operand mismatch')
    return {
      source: 'mansion',
      ruleId: `${content.authorityId}:${clause.id}`,
      activityId: clause.activityId,
      activityMapping: {
        ...resolveMansionActivityMapping(clause),
        authorityId: content.authorityId,
        clauseId: clause.id,
      },
      scope: clause.scope,
      polarity: clause.polarity as Evidence['polarity'],
      sourcePhrase: clause.translation,
      sourceQuote: clause.quote,
      sourceRef: `https://archive.org/download/20241205_20241205_0310/page/n${content.pdfPage - 1}.jpg`,
      conditions: clause.conditions,
      exceptions: clause.exceptions,
      // Primary page verified; translating an operative phrase to the product taxonomy is an interpretation.
      confidence: 'medium',
      status: 'informational',
      scoreDelta: 0,
      rawDelta: 0,
      label: `Tú ${content.name} · Ngọc Hạp 1880`,
    }
  })
}

export function presentMansionContent(content: MansionContent) {
  const clauses = getMansionContentEvidence(content)
  const summarize = (polarity: Evidence['polarity']) => {
    const translations = [
      ...new Set(clauses.filter((c) => c.polarity === polarity).map((c) => c.sourcePhrase)),
    ]
    return translations.length
      ? `${translations.join('; ')}.`
      : 'Chưa có việc được nêu rõ trong đoạn nguồn đã đối chiếu.'
  }
  return {
    sourceLabel: 'Ngọc Hạp · bản 1880',
    shouldDo: summarize('positive'),
    shouldAvoid: summarize('negative'),
    meaning:
      'Nội dung theo một bản Ngọc Hạp đã đối chiếu. Chỉ dùng để tham khảo từng việc; chưa tính vào điểm hoặc kết luận chọn ngày. Việc không được nêu không đồng nghĩa với nên làm hay nên kiêng.',
    source: { label: `Bản scan · trang ${content.pdfPage}`, url: clauses[0].sourceRef },
    reasons: clauses.map((c) => `${c.sourceQuote} — ${c.sourcePhrase}`),
  }
}
