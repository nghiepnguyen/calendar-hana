import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expandOccurrences } from '@shared/recurrence/recurrence'
import type { SolarDateString } from '@shared/types'
import { useUiStore } from '../store/uiStore'
import { useEvents } from './useRepositoryData'

/**
 * Link từ thông báo / email (/day/2026-09-23?event=...&occurrence=...) mở chi tiết lần diễn ra đó.
 * Mở xong thì bỏ query khỏi URL.
 */
export function useOpenOccurrenceFromUrl(date: SolarDateString): void {
  const [params, setParams] = useSearchParams()
  const events = useEvents()
  const openDetail = useUiStore((s) => s.openDetail)
  const eventId = params.get('event')
  const occurrenceKey = params.get('occurrence')

  useEffect(() => {
    if (!eventId || !events) return
    const event = events.find((e) => e.id === eventId)
    const occurrence = event
      ? expandOccurrences(event, date, date).find(
          (o) => !occurrenceKey || o.occurrenceKey === occurrenceKey,
        )
      : undefined
    if (occurrence) openDetail(occurrence)
    setParams({}, { replace: true })
  }, [eventId, occurrenceKey, events, date, openDetail, setParams])
}
