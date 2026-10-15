import { BUILD_VERSION } from '../buildInfo'

/** Build mới nhất trên server (LATEST_BUILD); null khi offline, quá giờ hoặc file hỏng. */
export async function fetchLatestBuild(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return null
    const { build } = (await response.json()) as { build?: unknown }
    return typeof build === 'string' && build ? build : null
  } catch {
    return null
  }
}

/**
 * Server có build khác build đang chạy: nhờ trình duyệt tải service worker mới.
 * Không tự tải lại trang: toast "Có phiên bản mới" chỉ hiện khi service worker mới đã cài xong
 * và đang chờ (onNeedRefresh), tránh trang mới chạy cùng asset cũ.
 */
export async function checkForUpdate(registration: ServiceWorkerRegistration): Promise<boolean> {
  if (!navigator.onLine) return false
  const latest = await fetchLatestBuild()
  if (!latest || latest === BUILD_VERSION) return false
  await registration.update().catch(() => {})
  return true
}
