import { create } from 'zustand'

export type SyncState = 'synced' | 'pending' | 'offline'

interface SyncStore {
  state: SyncState
  /** Lỗi ghi lên cloud gần nhất (ví dụ bị Security Rules từ chối). */
  error: string | null
  setState: (state: SyncState) => void
  reportError: (error: unknown) => void
  clearError: () => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  state: 'synced',
  error: null,
  setState: (state) => set({ state }),
  reportError: (error) => {
    console.error('Lỗi đồng bộ', error)
    set({ error: error instanceof Error ? error.message : String(error) })
  },
  clearError: () => set({ error: null }),
}))
