// Cài app (PWA): giữ sự kiện beforeinstallprompt của Chrome/Edge để hiện nút Cài app.

import { create } from 'zustand'
import { track } from '../analytics'

/** Sự kiện chỉ có ở trình duyệt Chromium, chưa có trong lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  /** Trình duyệt cho phép hiện hộp thoại cài app ngay. */
  canPrompt: boolean
  /** Đã cài trong phiên này. */
  installed: boolean
  /** Hiện hộp thoại cài app. Trả về true nếu người dùng đồng ý. */
  prompt: () => Promise<boolean>
}

let deferred: BeforeInstallPromptEvent | null = null

export const useInstallStore = create<InstallState>((set) => ({
  canPrompt: false,
  installed: false,
  prompt: async () => {
    const event = deferred
    if (!event) return false
    deferred = null
    set({ canPrompt: false })
    await event.prompt()
    const { outcome } = await event.userChoice
    track('install_prompt', { outcome })
    return outcome === 'accepted'
  },
}))

/** Gọi sớm khi app khởi động: sự kiện có thể đến trước khi trang Cài đặt mở. */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    useInstallStore.setState({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    track('app_installed')
    deferred = null
    useInstallStore.setState({ canPrompt: false, installed: true })
  })
}
