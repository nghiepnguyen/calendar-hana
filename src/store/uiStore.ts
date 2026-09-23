import { create } from 'zustand'
import type { Occurrence } from '@shared/recurrence/recurrence'
import type { SolarDateString, TimeString } from '@shared/types'

/** Giá trị điền sẵn khi mở form tạo sự kiện. */
export interface EventDraftDefaults {
  date: SolarDateString
  startTime?: TimeString
  allDay?: boolean
}

export type EventEditorState =
  | { mode: 'create'; defaults: EventDraftDefaults }
  | {
      mode: 'edit'
      eventId: string
      occurrence?: Occurrence
      scope: 'single' | 'following' | 'all'
    }

interface UiState {
  sidebarOpen: boolean
  searchOpen: boolean
  /** Lần diễn ra đang mở ở màn hình chi tiết. */
  detail: Occurrence | null
  editor: EventEditorState | null
  setSidebarOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  openDetail: (occurrence: Occurrence) => void
  closeDetail: () => void
  openCreate: (defaults: EventDraftDefaults) => void
  openEdit: (state: Omit<Extract<EventEditorState, { mode: 'edit' }>, 'mode'>) => void
  closeEditor: () => void
}

/** State giao diện tạm thời (không lưu). Chế độ xem và ngày đang xem nằm trên URL. */
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  searchOpen: false,
  detail: null,
  editor: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openDetail: (detail) => set({ detail }),
  closeDetail: () => set({ detail: null }),
  openCreate: (defaults) => set({ editor: { mode: 'create', defaults }, detail: null }),
  openEdit: (state) => set({ editor: { mode: 'edit', ...state }, detail: null }),
  closeEditor: () => set({ editor: null }),
}))
