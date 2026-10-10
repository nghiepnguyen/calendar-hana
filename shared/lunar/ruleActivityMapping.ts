import { resolveActivityScope } from './activityTaxonomy'

export interface RuleActivityMapping {
  version: 'mansion-activity-mapping-v2'
  /** Catalog activity the clause is interpreted as; '' while the scope is a catalog gap. */
  activityId: string
  /** `not_operative`: the excerpt is source-accurate but states a consequence, not an activity. */
  status: 'exact_catalog_pair' | 'unmapped' | 'not_operative'
  /** Interpretation review of the source term; independent of SOURCE_LOCKED and never a scoring permission. */
  reviewStatus: 'interpretation_reviewed' | 'interpretation_pending'
  reason: string
  /** Reviewed source term found in the quote; absent while pending. */
  reviewTerm?: string
  /** Clause-specific reading from the full verse on the scan. */
  reviewNote?: string
}

export interface MansionClauseRef {
  id: string
  quote: string
  activityId: string
  scope: string
}

/** Explicit product interpretations for the current 1880 mansion content subset.
 * `terms` are reviewed operative source terms for the scope; a clause is reviewed only
 * when one of them occurs in its quote. This table never extracts rules from keywords.
 * `catalogAdded` scopes were source-locked with an empty ID before their catalog activity
 * existed; the mapping assigns the ID without rewriting the source lock.
 * Empty IDs are deliberate catalog gaps, not neutral activities or permissions.
 */
const mappings: Record<
  string,
  { activityId: string; terms: readonly string[]; reason: string; catalogAdded?: true }
> = {
  construction_general: {
    activityId: 'construction',
    terms: ['造作', '修造', '起造', '造龍軒'],
    reason:
      'Giữ diễn giải xây dựng chung hiện tại; không mở rộng sang động thổ hoặc việc xây dựng hẹp.',
  },
  relationship_wedding: {
    activityId: 'wedding',
    terms: ['嫁娶', '婚姻'],
    reason: 'Giữ diễn giải hôn nhân/cưới hỏi; không tự gộp với nạp thái hoặc đính hôn.',
  },
  funeral_burial: {
    activityId: 'burial',
    terms: ['埋葬', '葬埋'],
    reason: 'An táng riêng với sửa mộ; cùng câu có nhiều động tác vẫn giữ các clause riêng.',
  },
  funeral_grave_repair: {
    activityId: 'grave_repair',
    terms: ['修築墳墓', '墳墓修築', '修墳'],
    reason: 'Sửa xây mộ riêng với an táng và sửa chữa nhà ở.',
  },
  travel_water: {
    activityId: 'water_travel',
    terms: ['行船'],
    reason: 'Đi thuyền riêng với xuất hành chung, đóng thuyền, hạ thủy và thủy công.',
  },
  door_opening: {
    activityId: 'door_opening',
    terms: ['開門'],
    catalogAdded: true,
    reason: 'Trổ cửa/làm cổng của công trình; không phải khai trương (開市).',
  },
  waterworks: {
    activityId: 'waterworks',
    terms: ['放水'],
    catalogAdded: true,
    reason: 'Dẫn/tháo nước, khơi mương; không phải đi thuyền.',
  },
  construction_columns: {
    activityId: '',
    terms: ['竪柱'],
    reason: 'Dựng cột chưa có exact activity ID; không mở rộng thành xây dựng chung.',
  },
  construction_high_hall: {
    activityId: '',
    terms: ['造高堂', '架高堂'],
    reason: 'Dựng cao đường chưa có exact activity ID; giữ phạm vi hẹp.',
  },
  construction_new_room: {
    activityId: '',
    terms: ['造新房'],
    reason: 'Xây phòng/nhà mới chưa có exact activity ID; giữ phạm vi hẹp.',
  },
  construction_wall: {
    activityId: '',
    terms: ['築牆'],
    reason: 'Xây tường chưa có exact activity ID; không đổi thành động thổ.',
  },
  construction_waterside: {
    activityId: '',
    terms: ['臨水造'],
    reason:
      'Xây bên nước chưa có exact activity ID; không đổi thành xây dựng chung hoặc đường thủy.',
  },
}

/** Readings settled against the full verse on the scan (2026-10-10). */
const clauseNotes: Record<string, string> = {
  '張-1':
    '張星日好造龍軒，年年便見進庄田: 龍軒 là mỹ từ cho nhà/sảnh, câu khen việc xây dựng nói chung.',
  '參-5':
    '婚姻許定遭刑剋，男女朝開暮落花: nói về hôn nhân; không suy ra riêng cho nạp thái/ăn hỏi.',
  '婁-1':
    '婁星竪柱起門庭: dựng cột dựng nhà là một động tác; mở cửa đã có clause riêng (放水開門).',
  '鬼-6': '修土築牆: đắp đất làm tường (tường đất), không phải động thổ.',
}

/** Excerpts that are source-accurate but are not operative activity clauses. */
const nonOperativeClauses: Record<string, string> = {
  '星-4':
    '自要歸休別嫁郎 là hậu quả của 不可葬埋并放水 → 凶星臨位女人亡, không nêu việc cưới hỏi trong ngày.',
}

export function resolveMansionActivityMapping(clause: MansionClauseRef): RuleActivityMapping {
  const { scope } = clause
  if (!Object.hasOwn(mappings, scope)) throw new Error('Undeclared mansion activity mapping')
  const mapping = mappings[scope]
  const sourceLockedGap = mapping.catalogAdded && clause.activityId === ''
  if (
    (mapping.activityId !== clause.activityId && !sourceLockedGap) ||
    (mapping.activityId !== '' &&
      resolveActivityScope(mapping.activityId, scope).status !== 'exact')
  )
    throw new Error('Incompatible mansion activity mapping')
  const base = { version: 'mansion-activity-mapping-v2', reason: mapping.reason } as const
  if (Object.hasOwn(nonOperativeClauses, clause.id))
    return {
      ...base,
      activityId: '',
      status: 'not_operative',
      reviewStatus: 'interpretation_reviewed',
      reviewNote: nonOperativeClauses[clause.id],
    }
  const status = mapping.activityId === '' ? 'unmapped' : 'exact_catalog_pair'
  const term = mapping.terms.find((t) => clause.quote.includes(t))
  if (!term)
    return {
      ...base,
      activityId: mapping.activityId,
      status,
      reviewStatus: 'interpretation_pending',
      reviewNote: 'Trích đoạn không chứa thuật ngữ đã rà soát cho phạm vi này.',
    }
  return {
    ...base,
    activityId: mapping.activityId,
    status,
    reviewStatus: 'interpretation_reviewed',
    reviewTerm: term,
    ...(clauseNotes[clause.id] ? { reviewNote: clauseNotes[clause.id] } : {}),
  }
}
