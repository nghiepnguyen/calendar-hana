import { describe, expect, it } from 'vitest'
import goodGods from '../almanac-data/good-gods.json'
import badGods from '../almanac-data/bad-gods.json'
import { STARS } from './stars.data'

// Audit inventory (docs/audits/truc-than-context-audit.md). A catalog god scores only when the day
// star table carries its exact name or the catalog declares a day rule. Aliases are never inferred,
// so these gods currently never fire. Bridging one must be a reviewed change that updates this list.
const WITHOUT_PRESENCE_SOURCE = [
  'thien_nguyen',
  'tu_tuong',
  'thoi_duc',
  'ngu_hop',
  'bat_tuong',
  'thien_thuong',
  'pho_ho',
  'tai_sat',
  'nguyet_sat',
  'nguyet_hai',
  'nguyet_yem',
  'yem_doi',
  'dai_thoi',
  'tu_phe',
  'tu_ky',
  'tu_cung',
  'ngu_mo',
  'ngu_ly',
  'vang_vong',
  'bat_chuyen',
  'quy_ky',
]

describe('catalog god presence coverage', () => {
  it('lists every scoring god that has no day-presence source', () => {
    const norm = (s: string) => s.normalize('NFC').trim().toLowerCase()
    const names = new Set(STARS.map((s) => norm(s.name)))
    const missing = [...goodGods.items, ...badGods.items]
      .filter((g) => !('rule' in g) && !names.has(norm(g.label)))
      .map((g) => g.id)
    expect(missing).toEqual(WITHOUT_PRESENCE_SOURCE)
  })
})
