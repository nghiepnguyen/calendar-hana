import { useEffect, useState } from 'react'
import type { CalendarEvent, Category, Settings } from '@shared/types'
import { useRepository } from '../data/repositoryContext'

/** Danh sách sự kiện gốc (chưa tính lần lặp), tự cập nhật. undefined = đang tải. */
export function useEvents(): CalendarEvent[] | undefined {
  const repository = useRepository()
  const [events, setEvents] = useState<CalendarEvent[]>()
  useEffect(() => repository.watchEvents(setEvents), [repository])
  return events
}

/** Danh sách danh mục theo thứ tự, tự cập nhật. undefined = đang tải. */
export function useCategories(): Category[] | undefined {
  const repository = useRepository()
  const [categories, setCategories] = useState<Category[]>()
  useEffect(() => repository.watchCategories(setCategories), [repository])
  return categories
}

/** Cài đặt hiện tại, tự cập nhật. undefined = đang tải. */
export function useSettings(): Settings | undefined {
  const repository = useRepository()
  const [settings, setSettings] = useState<Settings>()
  useEffect(() => repository.watchSettings(setSettings), [repository])
  return settings
}
