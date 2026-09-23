import { create } from 'zustand'

interface AppUpdateState {
  /** Có bản mới đang chờ kích hoạt. */
  needRefresh: boolean
  /** Lần đầu cài xong service worker: app đã dùng được offline. */
  offlineReady: boolean
  /** Kích hoạt bản mới rồi tải lại trang. */
  update: () => void
  dismiss: () => void
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  needRefresh: false,
  offlineReady: false,
  update: () => {},
  dismiss: () => set({ needRefresh: false, offlineReady: false }),
}))
