import { useMemo } from 'react'
import {
  compareOccurrences,
  expandOccurrences,
  type Occurrence,
} from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import { useEvents } from './useRepositoryData'

/**
 * Các lần diễn ra trong khoảng [rangeStart, rangeEnd], đã tính lần lặp, lọc danh mục ẩn
 * và sắp xếp. undefined = đang tải.
 */
export function useEventsInRange(
  rangeStart: SolarDateString,
  rangeEnd: SolarDateString,
  hiddenCategoryIds: readonly string[] = [],
): Occurrence[] | undefined {
  const events = useEvents()
  const hiddenKey = hiddenCategoryIds.join(',')

  return useMemo(() => {
    if (!events) return undefined
    const hidden = new Set(hiddenKey ? hiddenKey.split(',') : [])
    const result: Occurrence[] = []
    for (const event of events) {
      for (const occurrence of expandOccurrences(event, rangeStart, rangeEnd)) {
        if (!hidden.has(occurrence.event.categoryId)) result.push(occurrence)
      }
    }
    return result.sort(compareOccurrences)
  }, [events, rangeStart, rangeEnd, hiddenKey])
}

/** Gom lần diễn ra theo ngày: { '2026-09-23': [...] }. */
export function groupByDate(occurrences: Occurrence[]): Map<SolarDateString, Occurrence[]> {
  const map = new Map<SolarDateString, Occurrence[]>()
  for (const occurrence of occurrences) {
    const list = map.get(occurrence.date)
    if (list) list.push(occurrence)
    else map.set(occurrence.date, [occurrence])
  }
  return map
}
