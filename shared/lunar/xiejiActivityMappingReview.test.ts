import { describe, expect, it } from 'vitest'
import review from '../almanac-data/xieji-activity-mapping-review.json'
import vol11 from '../almanac-data/xiejibianfangshu-yiji.json'

const entries = vol11.activityEntries as Record<string, string[]>
const activities = review.activities as Record<
  string,
  { status: string; term: string; note: string }
>

describe('協紀 卷十一 用事 → activity interpretation review', () => {
  it('covers every mapped activity and nothing else', () => {
    expect(Object.keys(activities).sort()).toEqual(Object.keys(entries).sort())
  })

  it('names one of the mapped headings as the reviewed term', () => {
    for (const [id, item] of Object.entries(activities)) {
      expect(['reviewed', 'pending'], id).toContain(item.status)
      expect(entries[id], id).toContain(item.term)
      expect(item.note.length, id).toBeGreaterThan(0)
    }
  })

  it('leaves nothing pending after the owner decisions of 10/10/2026', () => {
    expect(
      Object.entries(activities)
        .filter(([, item]) => item.status === 'pending')
        .map(([id]) => id)
        .sort(),
    ).toEqual([])
  })
})

describe('owner split of warehouse (10/10/2026)', () => {
  it('maps repairing and opening storehouses to separate headings', () => {
    expect(entries.warehouse).toEqual(['修倉庫'])
    expect(entries.warehouse_opening).toEqual(['開倉庫出貨財'])
  })
})
