import { resolveActivityScope } from './activityTaxonomy'

export interface RuleActivityMapping {
  version: 'mansion-activity-mapping-v2'
  status: 'exact_catalog_pair' | 'unmapped'
  /** Interpretation review of the source term; independent of SOURCE_LOCKED and never a scoring permission. */
  reviewStatus: 'interpretation_reviewed' | 'interpretation_pending'
  reason: string
  /** Reviewed source term found in the quote; absent while pending. */
  reviewTerm?: string
  /** Why a clause stays pending although its scope has reviewed terms. */
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
 * Empty IDs are deliberate catalog gaps, not neutral activities or permissions.
 */
const mappings = {
  construction_general: {
    activityId: 'construction',
    terms: ['造作', '修造', '起造'],
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
    activityId: '',
    terms: ['開門'],
    reason: 'Mở/làm cổng cửa chưa có exact activity ID; không đổi thành khai trương.',
  },
  waterworks: {
    activityId: '',
    terms: ['放水'],
    reason: 'Tháo/dẫn nước chưa có exact activity ID; không đổi thành đi thuyền.',
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
} as const

/** Clauses kept pending: compound acts, consequence lines or terms outside the reviewed list. */
const pendingClauses: Record<string, string> = {
  '張-1':
    '造龍軒 chỉ có chữ 造 với công trình 龍軒 chưa xác định; chưa rõ là xây dựng chung hay phạm vi hẹp như cao đường.',
  '參-5': '婚姻許定 có thể chỉ việc hứa hôn/định thân; chưa phân định giữa cưới hỏi và nạp thái.',
  '星-4': 'Câu nêu hậu quả chia lìa (別嫁郎), không trực tiếp nêu việc cưới hỏi trong ngày.',
  '婁-1':
    '竪柱起門庭 gộp dựng cột với dựng cổng/sân; chỉ phần dựng cột được giữ, chưa tách 起門庭.',
  '鬼-6':
    '修土築牆 gộp đắp đất với xây tường; chưa tách phần đắp đất khỏi xây tường hoặc động thổ.',
}

export function resolveMansionActivityMapping(clause: MansionClauseRef): RuleActivityMapping {
  const { activityId, scope } = clause
  if (!Object.hasOwn(mappings, scope)) throw new Error('Undeclared mansion activity mapping')
  const mapping = mappings[scope as keyof typeof mappings]
  if (
    mapping.activityId !== activityId ||
    (activityId !== '' && resolveActivityScope(activityId, scope).status !== 'exact')
  )
    throw new Error('Incompatible mansion activity mapping')
  const base = {
    version: 'mansion-activity-mapping-v2',
    status: activityId === '' ? 'unmapped' : 'exact_catalog_pair',
    reason: mapping.reason,
  } as const
  const term = (mapping.terms as readonly string[]).find((t) => clause.quote.includes(t))
  if (Object.hasOwn(pendingClauses, clause.id) || !term)
    return {
      ...base,
      reviewStatus: 'interpretation_pending',
      reviewNote:
        pendingClauses[clause.id] ?? 'Trích đoạn không chứa thuật ngữ đã rà soát cho phạm vi này.',
    }
  return { ...base, reviewStatus: 'interpretation_reviewed', reviewTerm: term }
}
