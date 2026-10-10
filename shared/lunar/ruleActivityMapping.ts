import { resolveActivityScope } from './activityTaxonomy'

export interface RuleActivityMapping {
  version: 'mansion-activity-mapping-v1'
  status: 'exact_catalog_pair' | 'unmapped'
  /** Source lock and catalog compatibility do not constitute interpretation review. */
  reviewStatus: 'interpretation_pending'
  reason: string
}

/** Explicit product interpretations for the current 1880 mansion content subset.
 * This table validates declared pairs; it never extracts rules from keywords.
 * Empty IDs are deliberate catalog gaps, not neutral activities or permissions.
 */
const mappings = {
  construction_general: {
    activityId: 'construction',
    reason:
      'Giữ diễn giải xây dựng chung hiện tại; không mở rộng sang động thổ hoặc việc xây dựng hẹp.',
  },
  relationship_wedding: {
    activityId: 'wedding',
    reason: 'Giữ diễn giải hôn nhân/cưới hỏi; không tự gộp với nạp thái hoặc đính hôn.',
  },
  funeral_burial: {
    activityId: 'burial',
    reason: 'An táng riêng với sửa mộ; cùng câu có nhiều động tác vẫn giữ các clause riêng.',
  },
  funeral_grave_repair: {
    activityId: 'grave_repair',
    reason: 'Sửa xây mộ riêng với an táng và sửa chữa nhà ở.',
  },
  travel_water: {
    activityId: 'water_travel',
    reason: 'Đi thuyền riêng với xuất hành chung, đóng thuyền, hạ thủy và thủy công.',
  },
  door_opening: {
    activityId: '',
    reason: 'Mở cửa chưa có exact activity ID; không đổi thành khai trương.',
  },
  waterworks: {
    activityId: '',
    reason: 'Thủy công chưa có exact activity ID; không đổi thành đi thuyền.',
  },
  construction_columns: {
    activityId: '',
    reason: 'Dựng cột chưa có exact activity ID; không mở rộng thành xây dựng chung.',
  },
  construction_high_hall: {
    activityId: '',
    reason: 'Dựng cao đường chưa có exact activity ID; giữ phạm vi hẹp.',
  },
  construction_new_room: {
    activityId: '',
    reason: 'Xây phòng/nhà mới chưa có exact activity ID; giữ phạm vi hẹp.',
  },
  construction_wall: {
    activityId: '',
    reason: 'Xây tường chưa có exact activity ID; không đổi thành động thổ.',
  },
  construction_waterside: {
    activityId: '',
    reason:
      'Xây bên nước chưa có exact activity ID; không đổi thành xây dựng chung hoặc đường thủy.',
  },
} as const

export function resolveMansionActivityMapping(
  activityId: string,
  scope: string,
): RuleActivityMapping {
  if (!Object.hasOwn(mappings, scope)) throw new Error('Undeclared mansion activity mapping')
  const mapping = mappings[scope as keyof typeof mappings]
  if (
    mapping.activityId !== activityId ||
    (activityId !== '' && resolveActivityScope(activityId, scope).status !== 'exact')
  )
    throw new Error('Incompatible mansion activity mapping')
  return {
    version: 'mansion-activity-mapping-v1',
    status: activityId === '' ? 'unmapped' : 'exact_catalog_pair',
    reviewStatus: 'interpretation_pending',
    reason: mapping.reason,
  }
}
